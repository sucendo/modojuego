// Elite-style HUD overlay (lightweight DOM, no Babylon GUI)
// - Toggle show/hide with key 'C'
// - Buttons: camera modes (M/K), speed 0..9 (ship), fullscreen
// - Toggles: names/labels, navigation grid
// - Coordinates: ABS/CAM/OFF + floating origin threshold
// - Includes logo (src/resources/logo.svg)

// v06+drag: Panels are draggable and persist positions in localStorage.
// Drag using the handle ⠿ on each panel header.
// Reset layout with the ↺ button (top-right panel).

function shouldIgnoreKey(ev) {
  const t = ev?.target;
  const tag = t?.tagName ? String(t.tagName).toUpperCase() : '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ev?.metaKey || ev?.ctrlKey || ev?.altKey;
}

function safeDispatchKey(key) {
  try {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  } catch (_) {}
}

function toggleFullscreen() {
  const doc = document;
  const el = document.documentElement;
  if (!doc.fullscreenElement) el.requestFullscreen?.();
  else doc.exitFullscreen?.();
}

const LAYOUT_KEY = 'eliteHudLayout_v1';

// ============================================================
// Cockpit (Idea B): 1 camera per monitor + off-axis projection
// - AUX windows are real Engine views (engine.registerView)
// - Each monitor has its own independent calibrator UI
// - Calib stored in localStorage per role: center/left/right
// - Robust AUX resize: AUX notifies MAIN -> engine.resize()
// ============================================================

const COCKPIT_BC_NAME = 'eliteCockpitBC_v1';
const COCKPIT_CALIB_KEY = (role) => `eliteCockpitCalib_v1_${role}`;

function deg2rad(d){ return (d || 0) * Math.PI / 180; }
function cm2m(cm){ return (Number(cm) || 0) / 100; }

function loadCalib(role) {
  const key = COCKPIT_CALIB_KEY(role);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  // Defaults
  if (role === 'center') {
    return { yawDeg: 0, eyeCm: 70, widthCm: 60, heightCm: 34, gapCm: 0.6, shiftCm: 0 };
  }
  const sign = role === 'left' ? 1 : -1;
  return { yawDeg: 35 * sign, eyeCm: 70, widthCm: 60, heightCm: 34, gapCm: 0.6, shiftCm: 0 };
}

function saveCalib(role, calib) {
  const key = COCKPIT_CALIB_KEY(role);
  try { localStorage.setItem(key, JSON.stringify(calib)); } catch (_) {}
}

function rotY(v, yawRad) {
  const c = Math.cos(yawRad);
  const s = Math.sin(yawRad);
  return {
    x: v.x * c + v.z * s,
    y: v.y,
    z: -v.x * s + v.z * c,
  };
}

function vec3(x,y,z){ return {x, y, z}; }
function vAdd(a,b){ return vec3(a.x+b.x, a.y+b.y, a.z+b.z); }
function vSub(a,b){ return vec3(a.x-b.x, a.y-b.y, a.z-b.z); }
function vMul(a,s){ return vec3(a.x*s, a.y*s, a.z*s); }
function vDot(a,b){ return a.x*b.x + a.y*b.y + a.z*b.z; }
function vCross(a,b){ return vec3(a.y*b.z - a.z*b.y, a.z*b.x - a.x*b.z, a.x*b.y - a.y*b.x); }
function vLen(a){ return Math.sqrt(vDot(a,a)) || 1; }
function vNorm(a){ const l = vLen(a); return vMul(a, 1/l); }

// Kooima-style off-axis projection in LH coords.
function computeOffAxisLH({ pa, pb, pc, pe, near, far }) {
  const vr = vNorm(vSub(pb, pa));
  const vu = vNorm(vSub(pc, pa));
  const vn = vNorm(vCross(vr, vu));

  const va = vSub(pa, pe);
  const vb = vSub(pb, pe);
  const vc = vSub(pc, pe);

  const d = vDot(va, vn);
  // Avoid division by 0 / invalid setup
  const dd = Math.abs(d) < 1e-6 ? (d >= 0 ? 1e-6 : -1e-6) : d;

  const l = vDot(vr, va) * near / dd;
  const r = vDot(vr, vb) * near / dd;
  const b = vDot(vu, va) * near / dd;
  const t = vDot(vu, vc) * near / dd;

  return perspectiveOffCenterLH(l, r, b, t, near, far);
}

// Babylon.js helper names vary by version (PerspectiveOffCenterLH vs PerspectiveOffCenterLHToRef).
// Provide a robust wrapper + a fallback implementation.
function perspectiveOffCenterLH(l, r, b, t, near, far) {
  const M = BABYLON?.Matrix;
  if (!M) throw new Error('BABYLON.Matrix no disponible');

  // Preferred: official helpers
  try {
    if (typeof M.PerspectiveOffCenterLHToRef === 'function') {
      const out = new M();
      M.PerspectiveOffCenterLHToRef(l, r, b, t, near, far, out);
      return out;
    }
    if (typeof M.PerspectiveOffCenterLH === 'function') {
      return M.PerspectiveOffCenterLH(l, r, b, t, near, far);
    }
  } catch (_) {
    // fall through to manual
  }

  // Fallback: build the matrix manually.
  // Detect whether Babylon is using an OpenGL-style (-1..1) or D3D-style (0..1) depth projection.
  let glDepth = true;
  try {
    const test = new M();
    if (typeof M.PerspectiveFovLHToRef === 'function') {
      M.PerspectiveFovLHToRef(Math.PI / 2, 1, near, far, test);
      // In GL style, m[14] tends to be about -2*near*far/(far-near) (≈ -2 when near=1, far=1000)
      // In D3D style, m[14] tends to be about -near*far/(far-near) (≈ -1 in same setup)
      const m14 = test.m?.[14];
      if (typeof m14 === 'number') glDepth = Math.abs(m14) > 1.5;
    }
  } catch (_) {}

  const w = r - l;
  const h = t - b;
  const a = (r + l) / w;
  const bb = (t + b) / h;

  const m00 = (2 * near) / w;
  const m11 = (2 * near) / h;
  const m20 = a;
  const m21 = bb;

  let m22, m32;
  if (glDepth) {
    // OpenGL/WebGL depth (-1..1)
    m22 = (far + near) / (far - near);
    m32 = (-2 * far * near) / (far - near);
  } else {
    // D3D depth (0..1)
    m22 = far / (far - near);
    m32 = (-far * near) / (far - near);
  }

  // Row-major values for Babylon.Matrix.FromValues
  return M.FromValues(
    m00, 0,   0,  0,
    0,   m11, 0,  0,
    m20, m21, m22, 1,
    0,   0,   m32, 0
  );
}

// Build monitor planes in eye/camera-local space, using a hinged-edge model.
// Assumptions:
// - Center screen plane is at z = eyeDist (center), normal +Z
// - Left screen is hinged on center's left edge, rotated by yawDeg (positive)
// - Right screen is hinged on center's right edge, rotated by yawDeg (negative)
function computeMonitorCorners(role, cal) {
  const c = cal.center;
  const wC = cm2m(c.widthCm);
  const hC = cm2m(c.heightCm);
  const dC = cm2m(c.eyeCm);
  const gap = cm2m(c.gapCm || 0);

  const yawC = deg2rad(c.yawDeg || 0);
  const nC = rotY(vec3(0,0,1), yawC);
  const rC = rotY(vec3(1, 0, 0), yawC);
  const shiftC = cm2m(c.shiftCm || 0);
  const centerC = vAdd(vMul(nC, dC), vMul(rC, shiftC));
  const uC = vec3(0, 1, 0);

  const paC = vAdd(vSub(centerC, vMul(rC, wC/2)), vMul(uC, -hC/2));
  const pbC = vAdd(vAdd(centerC, vMul(rC, wC/2)), vMul(uC, -hC/2));
  const pcC = vAdd(vSub(centerC, vMul(rC, wC/2)), vMul(uC,  hC/2));

  if (role === 'center') {
    return { pa: paC, pb: pbC, pc: pcC };
  }

  const s = cal[role];
  const wS = cm2m(s.widthCm);
  const hS = cm2m(s.heightCm);
  const yaw = deg2rad(s.yawDeg);
  const shift = cm2m(s.shiftCm || 0);

  // Rotated local axes for side screen
  const rS = rotY(vec3(1,0,0), yaw);
  const uS = vec3(0,1,0);

  // Hinge center on center screen edge + optional shift
  const isLeft = role === 'left';
  const hinge = vAdd(centerC, vMul(rC, (isLeft ? -1 : 1) * (wC/2 + gap/2) + shift));

  // Side screen center so that its adjacent edge matches hinge
  // Left screen hinges on its RIGHT edge => center = hinge - rS*(wS/2)
  // Right screen hinges on its LEFT edge  => center = hinge + rS*(wS/2)
  const centerS = isLeft ? vSub(hinge, vMul(rS, wS/2)) : vAdd(hinge, vMul(rS, wS/2));

  const pa = vAdd(vSub(centerS, vMul(rS, wS/2)), vMul(uS, -hS/2));
  const pb = vAdd(vAdd(centerS, vMul(rS, wS/2)), vMul(uS, -hS/2));
  const pc = vAdd(vSub(centerS, vMul(rS, wS/2)), vMul(uS,  hS/2));
  return { pa, pb, pc };
}

function makeToast(root, msg, ms = 2500) {
  try {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      position:fixed; left:50%; top:12px; transform:translateX(-50%);
      background: rgba(0,0,0,0.75);
      border:1px solid rgba(0,255,204,0.25);
      color: rgba(210,255,245,0.98);
      font-family: Orbitron, system-ui, sans-serif;
      font-size: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      z-index: 100000;
      pointer-events:none;
      box-shadow: 0 12px 40px rgba(0,0,0,0.35);
    `;
    (root || document.body).appendChild(el);
    setTimeout(() => el.remove(), ms);
  } catch (_) {}
}

function loadLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? JSON.parse(raw) : { panels: {}, locked: false };
  } catch (_) {
    return { panels: {}, locked: false };
  }
}

function saveLayout(layout) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (_) {}
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function applyPanelPos(panelEl, pos) {
  if (!panelEl || !pos) return;
  // Switch to explicit left/top positioning and disable right/bottom defaults.
  panelEl.style.right = 'auto';
  panelEl.style.bottom = 'auto';
  panelEl.style.left = `${pos.left}px`;
  panelEl.style.top = `${pos.top}px`;
}

function getPanelPos(panelEl) {
  const r = panelEl.getBoundingClientRect();
  return { left: Math.round(r.left), top: Math.round(r.top) };
}

function clampPanelIntoView(panelEl) {
  if (!panelEl) return;
  const r = panelEl.getBoundingClientRect();
  const vw = window.innerWidth || document.documentElement.clientWidth || 1;
  const vh = window.innerHeight || document.documentElement.clientHeight || 1;
  const maxL = Math.max(0, vw - r.width);
  const maxT = Math.max(0, vh - r.height);
  const left = clamp(r.left, 0, maxL);
  const top = clamp(r.top, 0, maxT);
  applyPanelPos(panelEl, { left, top });
}

function makeDraggable(panelEl, handleEl, layout, panelKey, isLockedFn) {
  if (!panelEl || !handleEl) return;
  let dragging = false;
  let startX = 0, startY = 0;
  let baseLeft = 0, baseTop = 0;
  let raf = 0;
  let nextLeft = 0, nextTop = 0;

  const paint = () => {
    raf = 0;
    applyPanelPos(panelEl, { left: nextLeft, top: nextTop });
  };

  const onMove = (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    // Clamp inside viewport
    const r = panelEl.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 1;
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;
    const maxL = Math.max(0, vw - r.width);
    const maxT = Math.max(0, vh - r.height);

    nextLeft = clamp(baseLeft + dx, 0, maxL);
    nextTop = clamp(baseTop + dy, 0, maxT);
    if (!raf) raf = requestAnimationFrame(paint);
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    panelEl.classList.remove('dragging');
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);

    const pos = getPanelPos(panelEl);
    layout.panels[panelKey] = pos;
    saveLayout(layout);
  };

  handleEl.addEventListener('pointerdown', (ev) => {
    if (isLockedFn?.()) return;
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault?.();
    ev.stopPropagation?.();

    // Ensure we start from explicit left/top (even if the panel was using right/bottom)
    const current = getPanelPos(panelEl);
    applyPanelPos(panelEl, current);

    dragging = true;
    startX = ev.clientX;
    startY = ev.clientY;
    baseLeft = current.left;
    baseTop = current.top;
    nextLeft = baseLeft;
    nextTop = baseTop;
    panelEl.classList.add('dragging');

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
  });
}

export function createEliteHud({
  camera,
  engine,
  floating,
  labelsApi,
  gridController,
  camCtrl,
  mountId = 'eliteHudMount',
  logoUrl,
} = {}) {
  if (typeof document === 'undefined') return { update() {}, setVisible() {} };

  // Try auto-wire from globals if not provided
  camCtrl = camCtrl || window.__camCtrl || null;

  const mount = document.getElementById(mountId) || document.body;

  // If hot-reloading or re-bootstrapping, remove previous instance
  try { document.getElementById('eliteHudRoot')?.remove(); } catch (_) {}

  // One-time CSS
  if (!document.getElementById('eliteHudStyles')) {
    const st = document.createElement('style');
    st.id = 'eliteHudStyles';
    st.textContent = `
      :root{
        --hudC: rgba(0,255,204,0.92);
        --hudC2: rgba(0,255,204,0.25);
        --hudBg: rgba(0,0,0,0.35);
        --hudBg2: rgba(0,0,0,0.20);
        --hudLine: rgba(0,255,204,0.20);
        --hudWarn: rgba(255,160,0,0.95);
        --hudRed: rgba(255,60,60,0.95);
      }
      #eliteHudRoot{ position:fixed; inset:0; z-index:9999; pointer-events:none; }
      #eliteHudRoot.eliteHidden{ display:none; }
      .elitePanel{
        pointer-events:auto;
        font-family: Orbitron, system-ui, -apple-system, Segoe UI, Arial, sans-serif;
        color: rgba(210,255,245,0.95);
        background: var(--hudBg);
        border: 1px solid var(--hudLine);
        border-radius: 12px;
        backdrop-filter: blur(6px);
        box-shadow: 0 0 0 1px rgba(0,0,0,0.35) inset;
        position:relative;
        overflow:hidden;
      }
      .elitePanel:before{
        content:'';
        position:absolute; inset:0;
        background: linear-gradient(90deg, rgba(0,255,204,0.08), transparent 40%, transparent 60%, rgba(0,255,204,0.06));
        pointer-events:none;
      }
      .eliteHdr{
        display:flex; align-items:center; justify-content:space-between;
        gap:10px; padding:10px 12px 6px 12px;
        border-bottom: 1px solid rgba(0,255,204,0.10);
      }
      .eliteHdr .dragHandle{
        display:inline-flex; align-items:center; justify-content:center;
        width: 26px; height: 26px;
        border-radius: 9px;
        border: 1px solid rgba(0,255,204,0.18);
        background: rgba(0,0,0,0.25);
        color: rgba(0,255,204,0.75);
        cursor: grab;
        user-select:none;
      }
      .eliteHdr .dragHandle:active{ cursor: grabbing; }
      .elitePanel.dragging{ outline: 2px solid rgba(0,255,204,0.20); }
      .eliteHdr .title{ letter-spacing:0.8px; font-size:12px; color: var(--hudC); text-shadow: 0 0 10px rgba(0,255,204,0.22); }
      .eliteBody{ padding:10px 12px 12px 12px; font-size:12px; }
      .eliteRow{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
      .eliteCol{ display:flex; flex-direction:column; gap:6px; }
      .eliteK{ color: rgba(0,255,204,0.9); }
      .eliteV{ color: rgba(225,255,250,0.95); }
      .eliteMuted{ opacity:0.75; }
      .eliteBtn{
        pointer-events:auto;
        font-family: Orbitron, system-ui, sans-serif;
        font-size: 12px;
        color: rgba(210,255,245,0.95);
        background: rgba(0,0,0,0.40);
        border: 1px solid rgba(0,255,204,0.22);
        border-radius: 10px;
        padding: 6px 10px;
        cursor:pointer;
        transition: transform 0.06s ease, border-color 0.12s ease, background 0.12s ease;
      }
      .eliteBtn:hover{ border-color: rgba(0,255,204,0.45); background: rgba(0,0,0,0.55); }
      .eliteBtn:active{ transform: translateY(1px); }
      .eliteBtn.on{ outline: 2px solid rgba(0,255,204,0.25); }
      .eliteSeg{ display:flex; gap:6px; flex-wrap:wrap; }
      .eliteSeg .eliteBtn{ padding: 5px 8px; border-radius: 9px; }
      .eliteSwitch{ display:flex; align-items:center; gap:8px; }
      .eliteSwitch input{ accent-color: rgba(0,255,204,0.85); }
      .eliteNotes{
        width: 320px; max-width: 40vw;
        height: 120px;
        resize: vertical;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
        font-size: 12px;
        color: rgba(225,255,250,0.95);
        background: rgba(0,0,0,0.30);
        border: 1px solid rgba(0,255,204,0.18);
        border-radius: 10px;
        padding: 8px;
        outline:none;
      }
      .eliteCorner{
        position:absolute; width:14px; height:14px; border-color: rgba(0,255,204,0.35);
        border-style: solid; pointer-events:none;
      }
      .eliteCorner.tl{ left:10px; top:10px; border-width:2px 0 0 2px; border-radius: 12px 0 0 0; }
      .eliteCorner.tr{ right:10px; top:10px; border-width:2px 2px 0 0; border-radius: 0 12px 0 0; }
      .eliteCorner.bl{ left:10px; bottom:10px; border-width:0 0 2px 2px; border-radius: 0 0 0 12px; }
      .eliteCorner.br{ right:10px; bottom:10px; border-width:0 2px 2px 0; border-radius: 0 0 12px 0; }

      /* Layout */
      #eliteHudTopLeft{ position:fixed; left:14px; top:14px; width: 430px; max-width: calc(100vw - 28px); }
      #eliteHudTopRight{ position:fixed; right:14px; top:14px; width: 360px; max-width: calc(100vw - 28px); }
      #eliteHudBottomLeft{ position:fixed; left:14px; bottom:14px; width: 430px; max-width: calc(100vw - 28px); }
      #eliteHudCockpit{ position:fixed; right:14px; bottom:14px; width: 380px; max-width: calc(100vw - 28px); }

      .eliteSliderRow{ display:flex; align-items:center; gap:10px; }
      .eliteSliderRow label{ width: 86px; opacity:0.9; }
      .eliteSliderRow input[type="range"]{ flex:1; }
      .eliteNum{ width: 64px; text-align:right; color: rgba(225,255,250,0.95); }
      #eliteHudReticle{ position:fixed; inset:0; pointer-events:none; }
      #eliteHudReticle .ret{
        position:absolute; left:50%; top:50%; width:64px; height:64px; transform:translate(-50%,-50%);
        border: 1px solid rgba(0,255,204,0.10);
        border-radius: 14px;
      }
      #eliteHudReticle .ret:before, #eliteHudReticle .ret:after{
        content:''; position:absolute; left:50%; top:50%; width:92px; height:1px;
        background: rgba(0,255,204,0.12); transform:translate(-50%,-50%);
      }
      #eliteHudReticle .ret:after{
        width:1px; height:92px; background: rgba(0,255,204,0.10);
      }
      #eliteHudHint{
        position:fixed; left:50%; bottom:10px; transform:translateX(-50%);
        font-family: Orbitron, system-ui, sans-serif;
        font-size: 12px;
        color: rgba(0,255,204,0.75);
        text-shadow: 0 0 10px rgba(0,255,204,0.18);
        pointer-events:none;
        opacity: 0.65;
      }
      @media (max-width: 920px){
        #eliteHudTopLeft, #eliteHudTopRight, #eliteHudBottomLeft{ width: calc(100vw - 28px); }
        #eliteHudCockpit{ width: calc(100vw - 28px); }
      }
    `;
    document.head.appendChild(st);
  }

  const layout = loadLayout();

  const root = document.createElement('div');
  root.id = 'eliteHudRoot';

  // Reticle + hint
  const ret = document.createElement('div');
  ret.id = 'eliteHudReticle';
  ret.innerHTML = `<div class="ret"></div>`;
  const hint = document.createElement('div');
  hint.id = 'eliteHudHint';
  hint.textContent = 'C · HUD   |   M · Ratón   |   K · Nave   |   0-9 · Velocidad   |   Shift · Turbo';

  // Panels
  const topLeft = document.createElement('div');
  topLeft.id = 'eliteHudTopLeft';
  topLeft.className = 'elitePanel';
  topLeft.innerHTML = `
    <div class="eliteCorner tl"></div><div class="eliteCorner tr"></div><div class="eliteCorner bl"></div><div class="eliteCorner br"></div>
    <div class="eliteHdr">
      <div style="display:flex;align-items:center;gap:10px;">
        <img id="eliteLogo" alt="logo" style="width:34px;height:34px;opacity:0.95;filter: drop-shadow(0 0 10px rgba(0,255,204,0.18));" />
        <div>
          <div class="title">NAV / STATUS</div>
          <div class="eliteMuted" style="font-size:11px;">Floating Origin <span id="th"></span></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="dragHandle" id="dragTopLeft" title="Arrastra para mover">⠿</span>
        <button class="eliteBtn" id="btnFullscreen" title="Pantalla completa">⛶</button>
      </div>
    </div>
    <div class="eliteBody">
      <div class="eliteCol">
        <div class="eliteRow">
          <span class="eliteK">ABS</span><span class="eliteV" id="abs">—</span>
        </div>
        <div class="eliteRow">
          <span class="eliteK">CAM</span><span class="eliteV" id="cam">—</span>
        </div>
        <div class="eliteRow">
          <span class="eliteK">OFF</span><span class="eliteV" id="off">—</span>
        </div>
        <div class="eliteRow" style="margin-top:6px; gap:14px;">
          <label class="eliteSwitch"><input id="toggleNames" type="checkbox" checked> <span>Names</span></label>
          <label class="eliteSwitch"><input id="toggleGrid" type="checkbox" checked> <span>Grid</span></label>
        </div>
      </div>
    </div>
  `;

  const topRight = document.createElement('div');
  topRight.id = 'eliteHudTopRight';
  topRight.className = 'elitePanel';
  topRight.innerHTML = `
    <div class="eliteCorner tl"></div><div class="eliteCorner tr"></div><div class="eliteCorner bl"></div><div class="eliteCorner br"></div>
    <div class="eliteHdr">
      <div class="title">FLIGHT / MODES</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="eliteBtn" id="btnLayoutReset" title="Reset HUD layout">↺</button>
        <span class="dragHandle" id="dragTopRight" title="Arrastra para mover">⠿</span>
        <button class="eliteBtn" id="btnHudToggle" title="Mostrar/ocultar HUD (C)">C</button>
      </div>
    </div>
    <div class="eliteBody">
      <div class="eliteRow" style="justify-content:space-between;">
        <div class="eliteRow" style="gap:8px;">
          <button class="eliteBtn" id="btnModeMouse">M · Ratón</button>
          <button class="eliteBtn" id="btnModeShip">K · Nave</button>
        </div>
        <div class="eliteRow" style="gap:8px;">
          <span class="eliteK">SPD</span>
          <span class="eliteV" id="hudSpeed">0</span>
        </div>
      </div>
      <div class="eliteMuted" style="margin:8px 0 6px 0; font-size:11px;">0=Stop · 1=Sound · 2=Light · 9=1LY/h</div>
      <div class="eliteSeg" id="speedSeg"></div>
    </div>
  `;

  const bottomLeft = document.createElement('div');
  bottomLeft.id = 'eliteHudBottomLeft';
  bottomLeft.className = 'elitePanel';
  bottomLeft.innerHTML = `
    <div class="eliteCorner tl"></div><div class="eliteCorner tr"></div><div class="eliteCorner bl"></div><div class="eliteCorner br"></div>
    <div class="eliteHdr">
      <div class="eliteRow" style="align-items:center;gap:10px;">
        <div class="title">COMMS / NOTES</div>
        <span class="dragHandle" id="dragBottomLeft" title="Arrastra para mover">⠿</span>
      </div>
      <div class="eliteMuted" style="font-size:11px;">(Escribe aquí sin afectar a las teclas de vuelo)</div>
    </div>
    <div class="eliteBody">
      <textarea class="eliteNotes" id="hudNotes" placeholder="Notas… / comandos…"></textarea>
    </div>
  `;

  const cockpit = document.createElement('div');
  cockpit.id = 'eliteHudCockpit';
  cockpit.className = 'elitePanel';
  cockpit.innerHTML = `
    <div class="eliteCorner tl"></div><div class="eliteCorner tr"></div><div class="eliteCorner bl"></div><div class="eliteCorner br"></div>
    <div class="eliteHdr">
      <div class="title">COCKPIT / MONITORS (B)</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="dragHandle" id="dragCockpit" title="Arrastra para mover">⠿</span>
        <button class="eliteBtn" id="btnCockpitReset" title="Reset calibración">↺</button>
      </div>
    </div>
    <div class="eliteBody">
      <div class="eliteRow" style="justify-content:space-between;">
        <div class="eliteRow" style="gap:8px;">
          <button class="eliteBtn" id="btnAuxLeft">AUX L</button>
          <button class="eliteBtn" id="btnAuxRight">AUX R</button>
          <button class="eliteBtn" id="btnAuxCloseAll" title="Cerrar AUX">✕</button>
        </div>
        <label class="eliteSwitch" title="Activa proyección off-axis cuando hay AUX"><input id="toggleCockpit" type="checkbox" checked> <span>ON</span></label>
      </div>
      <div class="eliteMuted" style="margin:8px 0 8px 0; font-size:11px;">Calibración independiente por pantalla (cada AUX tiene su panel).</div>

      <div class="eliteCol" style="gap:8px;">
        <div class="eliteSliderRow"><label>Yaw</label><input id="c_yaw" type="range" min="-20" max="20" step="0.1"><span class="eliteNum" id="c_yaw_v"></span></div>
        <div class="eliteSliderRow"><label>Eye cm</label><input id="c_eye" type="range" min="30" max="120" step="0.5"><span class="eliteNum" id="c_eye_v"></span></div>
        <div class="eliteSliderRow"><label>W cm</label><input id="c_w" type="range" min="20" max="120" step="0.5"><span class="eliteNum" id="c_w_v"></span></div>
        <div class="eliteSliderRow"><label>H cm</label><input id="c_h" type="range" min="15" max="80" step="0.5"><span class="eliteNum" id="c_h_v"></span></div>
        <div class="eliteSliderRow"><label>Gap cm</label><input id="c_gap" type="range" min="0" max="3" step="0.1"><span class="eliteNum" id="c_gap_v"></span></div>
        <div class="eliteSliderRow"><label>Shift cm</label><input id="c_shift" type="range" min="-80" max="80" step="0.5"><span class="eliteNum" id="c_shift_v"></span></div>
      </div>
    </div>
  `;

  root.appendChild(ret);
  root.appendChild(topLeft);
  root.appendChild(topRight);
  root.appendChild(bottomLeft);
  root.appendChild(cockpit);
  root.appendChild(hint);
  mount.appendChild(root);

  // Apply saved panel positions
  try {
    if (layout?.panels?.eliteHudTopLeft) applyPanelPos(topLeft, layout.panels.eliteHudTopLeft);
    if (layout?.panels?.eliteHudTopRight) applyPanelPos(topRight, layout.panels.eliteHudTopRight);
    if (layout?.panels?.eliteHudBottomLeft) applyPanelPos(bottomLeft, layout.panels.eliteHudBottomLeft);
    if (layout?.panels?.eliteHudCockpit) applyPanelPos(cockpit, layout.panels.eliteHudCockpit);
    // Clamp after first layout pass
    setTimeout(() => {
      clampPanelIntoView(topLeft);
      clampPanelIntoView(topRight);
      clampPanelIntoView(bottomLeft);
      clampPanelIntoView(cockpit);
    }, 0);
  } catch (_) {}

  // Logo
  try {
    const img = root.querySelector('#eliteLogo');
    img.src = logoUrl || new URL('../resources/logo.svg', import.meta.url).href;
  } catch (_) {}

  // Speed segmented buttons
  const seg = root.querySelector('#speedSeg');
  const speedBtns = [];
  for (let i = 0; i <= 9; i++) {
    const b = document.createElement('button');
    b.className = 'eliteBtn';
    b.textContent = String(i);
    b.title = `Velocidad ${i}`;
    b.onclick = () => {
      if (camCtrl?.setSpeedLevel) camCtrl.setSpeedLevel(i);
      else safeDispatchKey(String(i));
      updateModeAndSpeed();
    };
    seg.appendChild(b);
    speedBtns.push(b);
  }

  // Buttons
  const btnFs = root.querySelector('#btnFullscreen');
  const btnHud = root.querySelector('#btnHudToggle');
  const btnLayoutReset = root.querySelector('#btnLayoutReset');
  const btnMouse = root.querySelector('#btnModeMouse');
  const btnShip = root.querySelector('#btnModeShip');
  const elSpeed = root.querySelector('#hudSpeed');
  const notes = root.querySelector('#hudNotes');

  btnFs?.addEventListener('click', toggleFullscreen);
  btnHud?.addEventListener('click', () => setVisible(root.classList.contains('eliteHidden')));
  btnLayoutReset?.addEventListener('click', () => {
    // Clear persisted positions and restore defaults
    layout.panels = {};
    saveLayout(layout);
    // Remove inline styles so CSS defaults apply again
    for (const el of [topLeft, topRight, bottomLeft, cockpit]) {
      el.style.left = '';
      el.style.top = '';
      el.style.right = '';
      el.style.bottom = '';
    }
  });
  btnMouse?.addEventListener('click', () => {
    if (camCtrl?.setMode) camCtrl.setMode('mouse');
    else safeDispatchKey('m');
    updateModeAndSpeed();
  });
  btnShip?.addEventListener('click', () => {
    if (camCtrl?.setMode) camCtrl.setMode('ship');
    else safeDispatchKey('k');
    updateModeAndSpeed();
  });

  // Notes persistence
  try {
    const key = 'eliteHudNotes';
    const saved = localStorage.getItem(key);
    if (saved != null) notes.value = saved;
    notes.addEventListener('input', () => localStorage.setItem(key, notes.value));
    // Stop key events so flight controls don't react
    notes.addEventListener('keydown', (e) => e.stopPropagation());
    notes.addEventListener('keyup', (e) => e.stopPropagation());
  } catch (_) {}

  // HUD show/hide (C)
  function onKeyDown(ev) {
    if (shouldIgnoreKey(ev)) return;
    const k = (ev.key || '').toLowerCase();
    if (k === 'c') {
      ev.preventDefault?.();
      setVisible(root.classList.contains('eliteHidden'));
    }
  }
  window.addEventListener('keydown', onKeyDown, { passive: false });

  // Wire toggles directly as well (in case initHudToggles isn't used)
  const toggleNames = root.querySelector('#toggleNames');
  const toggleGrid = root.querySelector('#toggleGrid');

  // Cockpit UI refs
  const btnAuxLeft = root.querySelector('#btnAuxLeft');
  const btnAuxRight = root.querySelector('#btnAuxRight');
  const btnAuxCloseAll = root.querySelector('#btnAuxCloseAll');
  const btnCockpitReset = root.querySelector('#btnCockpitReset');
  const toggleCockpit = root.querySelector('#toggleCockpit');
  const cYaw = root.querySelector('#c_yaw');
  const cEye = root.querySelector('#c_eye');
  const cW = root.querySelector('#c_w');
  const cH = root.querySelector('#c_h');
  const cGap = root.querySelector('#c_gap');
  const cShift = root.querySelector('#c_shift');
  const cYawV = root.querySelector('#c_yaw_v');
  const cEyeV = root.querySelector('#c_eye_v');
  const cWV = root.querySelector('#c_w_v');
  const cHV = root.querySelector('#c_h_v');
  const cGapV = root.querySelector('#c_gap_v');
  const cShiftV = root.querySelector('#c_shift_v');

  function applyNames() {
    const on = !!toggleNames?.checked;
    labelsApi?.setShowLabels?.(on);
  }
  function applyGrid() {
    const on = !!toggleGrid?.checked;
    gridController?.setEnabled?.(on);
  }
  toggleNames?.addEventListener('change', applyNames);
  toggleGrid?.addEventListener('change', applyGrid);

  // Initial apply
  applyNames();
  applyGrid();

  // ============================================================
  // Cockpit manager (Idea B)
  // ============================================================
  function buildAuxHtml(role) {
    // role: 'left'|'right'
    // The AUX is a lightweight page that only exposes a canvas + calibrator.
    // It reports changes/resize to MAIN via BroadcastChannel.
    const escRole = String(role).replace(/[^a-z]/g, '');
    return `<!doctype html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>AUX ${escRole.toUpperCase()}</title>
<style>
  html,body{ margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#000; }
  #auxCanvas{ position:fixed; inset:0; width:100%; height:100%; display:block; background:#000; }
  #calib{
    position:fixed; right:12px; top:12px; width: 320px; max-width: calc(100vw - 24px);
    font-family: Orbitron, system-ui, -apple-system, Segoe UI, Arial, sans-serif;
    color: rgba(210,255,245,0.95);
    background: rgba(0,0,0,0.45);
    border: 1px solid rgba(0,255,204,0.22);
    border-radius: 12px;
    backdrop-filter: blur(6px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.35) inset;
  }
  #calib .hdr{ display:flex; align-items:center; justify-content:space-between; padding:10px 12px 8px 12px; border-bottom:1px solid rgba(0,255,204,0.12); }
  #calib .title{ letter-spacing:0.8px; font-size:12px; color: rgba(0,255,204,0.92); }
  #calib .body{ padding:10px 12px 12px 12px; font-size:12px; display:flex; flex-direction:column; gap:8px; }
  .row{ display:flex; align-items:center; gap:10px; }
  .row label{ width: 78px; opacity:0.9; }
  .row input[type=range]{ flex:1; }
  .num{ width:64px; text-align:right; }
  .btn{ font-family: Orbitron, system-ui, sans-serif; font-size:12px; color: rgba(210,255,245,0.95);
        background: rgba(0,0,0,0.50); border: 1px solid rgba(0,255,204,0.22);
        border-radius: 10px; padding: 6px 10px; cursor:pointer; }
  .btn:hover{ border-color: rgba(0,255,204,0.45); }
</style>
</head>
<body>
  <canvas id="auxCanvas"></canvas>
  <div id="calib">
    <div class="hdr">
      <div class="title">AUX ${escRole.toUpperCase()} · CALIB</div>
      <button class="btn" id="btnReset" title="Reset">↺</button>
    </div>
    <div class="body">
      <div class="row"><label>Yaw</label><input id="yaw" type="range" min="-70" max="70" step="0.1"><span class="num" id="yaw_v"></span></div>
      <div class="row"><label>Eye cm</label><input id="eye" type="range" min="30" max="120" step="0.5"><span class="num" id="eye_v"></span></div>
      <div class="row"><label>W cm</label><input id="w" type="range" min="20" max="120" step="0.5"><span class="num" id="w_v"></span></div>
      <div class="row"><label>H cm</label><input id="h" type="range" min="15" max="80" step="0.5"><span class="num" id="h_v"></span></div>
      <div class="row"><label>Shift</label><input id="shift" type="range" min="-10" max="10" step="0.1"><span class="num" id="shift_v"></span></div>
    </div>
  </div>

  <script>
  (function(){
    const ROLE = '${escRole}';
    const BC = new BroadcastChannel('${COCKPIT_BC_NAME}');
    const KEY = 'eliteCockpitCalib_v1_' + ROLE;
    const $ = (id)=>document.getElementById(id);
    const dpr = ()=> window.devicePixelRatio || 1;

    function load(){
      try{ const raw = localStorage.getItem(KEY); if(raw) return JSON.parse(raw); }catch(e){}
      const sign = ROLE==='left'?1:-1;
      return { yawDeg: 35*sign, eyeCm: 70, widthCm: 60, heightCm: 34, gapCm: 0.6, shiftCm: 0 };
    }
    function save(c){
      try{ localStorage.setItem(KEY, JSON.stringify(c)); }catch(e){}
      BC.postMessage({ type:'calib', role: ROLE, calib: c });
    }

    let cal = load();
    const yaw = $('yaw'), eye = $('eye'), w=$('w'), h=$('h'), shift=$('shift');
    const yawV=$('yaw_v'), eyeV=$('eye_v'), wV=$('w_v'), hV=$('h_v'), shiftV=$('shift_v');

    function syncUI(){
      yaw.value = cal.yawDeg; yawV.textContent = Number(cal.yawDeg).toFixed(1);
      eye.value = cal.eyeCm; eyeV.textContent = Number(cal.eyeCm).toFixed(1);
      w.value = cal.widthCm; wV.textContent = Number(cal.widthCm).toFixed(1);
      h.value = cal.heightCm; hV.textContent = Number(cal.heightCm).toFixed(1);
      shift.value = cal.shiftCm || 0; shiftV.textContent = Number(cal.shiftCm||0).toFixed(1);
    }

    function onChange(){
      cal.yawDeg = parseFloat(yaw.value);
      cal.eyeCm = parseFloat(eye.value);
      cal.widthCm = parseFloat(w.value);
      cal.heightCm = parseFloat(h.value);
      cal.shiftCm = parseFloat(shift.value);
      // Only update numeric labels while dragging (avoid slider re-sync jitter)
      yawV.textContent = Number(cal.yawDeg).toFixed(1);
      eyeV.textContent = Number(cal.eyeCm).toFixed(1);
      wV.textContent = Number(cal.widthCm).toFixed(1);
      hV.textContent = Number(cal.heightCm).toFixed(1);
      shiftV.textContent = Number(cal.shiftCm||0).toFixed(1);
      scheduleSave();
    }

    let _pending = false;
    function scheduleSave(){
      if (_pending) return;
      _pending = true;
      requestAnimationFrame(()=>{
        _pending = false;
        save(cal);
      });
    }

    for(const el of [yaw,eye,w,h,shift]){
      el.addEventListener('input', onChange);
      el.addEventListener('change', () => { onChange(); save(cal); });
    }

    $('btnReset').addEventListener('click', ()=>{
      const sign = ROLE==='left'?1:-1;
      cal = { yawDeg: 35*sign, eyeCm: 70, widthCm: 60, heightCm: 34, gapCm: 0.6, shiftCm: 0 };
      syncUI();
      save(cal);
    });

    function resizeCanvas(){
      const c = $('auxCanvas');
      const W = Math.max(1, Math.floor(window.innerWidth * dpr()));
      const H = Math.max(1, Math.floor(window.innerHeight * dpr()));
      if(c.width !== W) c.width = W;
      if(c.height !== H) c.height = H;
      BC.postMessage({ type:'auxResize', role: ROLE, w: window.innerWidth, h: window.innerHeight, dpr: dpr() });
    }
    window.addEventListener('resize', ()=>{ resizeCanvas(); }, { passive:true });

    syncUI();
    resizeCanvas();
    BC.postMessage({ type:'auxHello', role: ROLE });
  })();
  </script>
</body></html>`;
  }

  function createCockpitManager() {
    const state = {
      enabled: true,
      projErrorShown: false,
      views: {
        left: { win: null, canvas: null, cam: null },
        right: { win: null, canvas: null, cam: null },
      },
      cal: {
        center: loadCalib('center'),
        left: loadCalib('left'),
        right: loadCalib('right'),
      },
      resizeRaf: 0,
      projDirty: true,
    };

    const bc = new BroadcastChannel(COCKPIT_BC_NAME);

    function readAllCalibFromStorage() {
      state.cal.center = loadCalib('center');
      state.cal.left = loadCalib('left');
      state.cal.right = loadCalib('right');
    }

    function scheduleResize() {
      if (state.resizeRaf) return;
      state.resizeRaf = requestAnimationFrame(() => {
        state.resizeRaf = 0;
        try { engine?.resize?.(); } catch (_) {}
      });
    }

    function ensureCam(role) {
      const view = state.views[role];
      if (!view) return null;
      if (view.cam && !view.cam.isDisposed?.()) return view.cam;
      const scn = camera?.getScene?.();
      if (!scn) return null;
      const cloned = camera.clone(`cockpitCam_${role}`);
      // No inputs on aux cams
      try { cloned.detachControl?.(); } catch (_) {}
      try { cloned.inputs?.clear?.(); } catch (_) {}
      // Follow the eye camera exactly
      cloned.parent = camera;
      cloned.position.set(0,0,0);
      if (cloned.rotationQuaternion) {
        try { cloned.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity()); } catch (_) {}
      }
      cloned.rotation.set(0,0,0);
      view.cam = cloned;
      state.projDirty = true;
      return cloned;
    }

    function applyProjections() {
      if (!state.enabled) {
        for (const role of ['left','right']) {
          const camX = state.views[role]?.cam;
          try { camX?.unfreezeProjectionMatrix?.(); } catch (_) {}
        }
        state.projDirty = false;
        return;
      }

      // Only run when needed
      if (!state.projDirty) return;
      state.projDirty = false;

      // Reload calibs (center calib affects hinge geometry but we DO NOT touch the main camera)
      readAllCalibFromStorage();

      const near = Math.max(1e-6, camera?.minZ ?? 0.1);
      const far = Math.max(near + 1, camera?.maxZ ?? 5e9);
      const pe = vec3(0,0,0);

      try {
        // Left/Right (only if view exists)
        for (const role of ['left','right']) {
          const v = state.views[role];
          if (!v?.canvas || !v?.win || v.win.closed) continue;
          const camX = ensureCam(role);
          if (!camX) continue;
          const corners = computeMonitorCorners(role, state.cal);
          const proj = computeOffAxisLH({ ...corners, pe, near, far });
          try { camX.freezeProjectionMatrix(proj); } catch (_) {}
        }

        state.projErrorShown = false;
      } catch (e) {
        if (!state.projErrorShown) {
          state.projErrorShown = true;
          console.warn('[EliteHUD] Off-axis projection error:', e);
          makeToast(root, 'Error al calcular la proyección off-axis (AUX). Revisa calibración.', 4500);
        }
        // Fallback AUX to normal projection
        for (const role of ['left','right']) {
          const camX = state.views[role]?.cam;
          try { camX?.unfreezeProjectionMatrix?.(); } catch (_) {}
        }
      }
    }

    function attachViewWhenReady(role) {
      const v = state.views[role];
      if (!v?.win || v.win.closed) return;
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        if (!v.win || v.win.closed) { clearInterval(timer); return; }
        let canvasEl = null;
        try { canvasEl = v.win.document.getElementById('auxCanvas'); } catch (_) {}
        if (!canvasEl) {
          if (tries > 80) clearInterval(timer);
          return;
        }

        v.canvas = canvasEl;
        const camX = ensureCam(role);

        try {
          // Unregister first if previously registered
          engine?.unRegisterView?.(canvasEl);
        } catch (_) {}
        try {
          engine?.registerView?.(canvasEl, camX);
        } catch (e) {
          makeToast(root, 'No se pudo registrar la vista AUX (engine.registerView).', 3500);
        }
        state.projDirty = true;
        applyProjections();
        scheduleResize();
        clearInterval(timer);
      }, 50);
    }

    function openAux(role) {
      if (!engine?.registerView) {
        makeToast(root, 'Babylon: engine.registerView no disponible en esta versión.', 3500);
        return;
      }
      const v = state.views[role];
      if (!v) return;
      if (v.win && !v.win.closed) {
        try { v.win.focus?.(); } catch (_) {}
        return;
      }

      const name = `eliteAux_${role}`;
      const features = `popup=yes,width=960,height=540,left=40,top=40`;
      const win = window.open('', name, features);
      if (!win) {
        makeToast(root, 'Popup bloqueada: permite ventanas emergentes para AUX.', 4000);
        return;
      }

      v.win = win;
      try {
        win.document.open();
        win.document.write(buildAuxHtml(role));
        win.document.close();
      } catch (_) {}

      attachViewWhenReady(role);
      state.projDirty = true;
      applyProjections();
    }

    function closeAux(role) {
      const v = state.views[role];
      if (!v) return;
      try {
        if (v.canvas) engine?.unRegisterView?.(v.canvas);
      } catch (_) {}
      try {
        v.cam?.dispose?.();
      } catch (_) {}
      v.cam = null;
      v.canvas = null;
      try { v.win?.close?.(); } catch (_) {}
      v.win = null;
      state.projDirty = true;
      // If no AUX open, restore normal projection
      if (!state.views.left.win && !state.views.right.win) {
        try { camera.unfreezeProjectionMatrix?.(); } catch (_) {}
      }
    }

    function closeAll() {
      closeAux('left');
      closeAux('right');
    }

    function resetCalibAll() {
      saveCalib('center', { yawDeg: 0, eyeCm: 70, widthCm: 60, heightCm: 34, gapCm: 0.6, shiftCm: 0 });
      saveCalib('left', { yawDeg: 35, eyeCm: 70, widthCm: 60, heightCm: 34, gapCm: 0.6, shiftCm: 0 });
      saveCalib('right', { yawDeg: -35, eyeCm: 70, widthCm: 60, heightCm: 34, gapCm: 0.6, shiftCm: 0 });
      state.projDirty = true;
      applyProjections();
    }

    // BC messages from AUX
    bc.addEventListener('message', (ev) => {
      const msg = ev?.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'auxHello') {
        const role = msg.role;
        if ((role === 'left' || role === 'right') && !state.views[role].canvas) {
          attachViewWhenReady(role);
        }
      } else if (msg.type === 'auxResize') {
        scheduleResize();
      } else if (msg.type === 'calib') {
        const role = msg.role;
        if (role === 'left' || role === 'right') {
          try { saveCalib(role, msg.calib); } catch (_) {}
          state.projDirty = true;
          applyProjections();
        }
      }
    });

    function tick() {
      // Auto-clean closed windows
      for (const role of ['left','right']) {
        const v = state.views[role];
        if (v?.win && v.win.closed) {
          closeAux(role);
        }
      }
      applyProjections();
    }

    function dispose() {
      try { bc.close?.(); } catch (_) {}
      closeAll();
    }

    return { state, openAux, closeAux, closeAll, resetCalibAll, tick, dispose, markDirty(){ state.projDirty = true; } };
  }

  const cockpitMgr = createCockpitManager();

  // Center-screen calibrator sliders (MAIN only)
  function syncCenterUIFromStorage() {
    const c = loadCalib('center');
    if (cYaw) { cYaw.value = c.yawDeg; if (cYawV) cYawV.textContent = Number(c.yawDeg).toFixed(1); }
    if (cEye) { cEye.value = c.eyeCm; if (cEyeV) cEyeV.textContent = Number(c.eyeCm).toFixed(1); }
    if (cW) { cW.value = c.widthCm; if (cWV) cWV.textContent = Number(c.widthCm).toFixed(1); }
    if (cH) { cH.value = c.heightCm; if (cHV) cHV.textContent = Number(c.heightCm).toFixed(1); }
    if (cGap) { cGap.value = c.gapCm || 0; if (cGapV) cGapV.textContent = Number(c.gapCm||0).toFixed(1); }
  }

  function onCenterUIChange() {
    const c = {
      yawDeg: parseFloat(cYaw?.value ?? 0),
      eyeCm: parseFloat(cEye?.value ?? 70),
      widthCm: parseFloat(cW?.value ?? 60),
      heightCm: parseFloat(cH?.value ?? 34),
      gapCm: parseFloat(cGap?.value ?? 0.6),
      shiftCm: 0,
    };
    saveCalib('center', c);
    if (cYawV) cYawV.textContent = Number(c.yawDeg).toFixed(1);
    if (cEyeV) cEyeV.textContent = Number(c.eyeCm).toFixed(1);
    if (cWV) cWV.textContent = Number(c.widthCm).toFixed(1);
    if (cHV) cHV.textContent = Number(c.heightCm).toFixed(1);
    if (cGapV) cGapV.textContent = Number(c.gapCm).toFixed(1);
    cockpitMgr.markDirty();
  }

  syncCenterUIFromStorage();
  for (const el of [cYaw, cEye, cW, cH, cGap]) {
    el?.addEventListener('input', onCenterUIChange);
    el?.addEventListener('change', onCenterUIChange);
  }

  toggleCockpit?.addEventListener('change', () => {
    cockpitMgr.state.enabled = !!toggleCockpit.checked;
    cockpitMgr.markDirty();
  });

  btnAuxLeft?.addEventListener('click', () => cockpitMgr.openAux('left'));
  btnAuxRight?.addEventListener('click', () => cockpitMgr.openAux('right'));
  btnAuxCloseAll?.addEventListener('click', () => cockpitMgr.closeAll());
  btnCockpitReset?.addEventListener('click', () => {
    cockpitMgr.resetCalibAll();
    syncCenterUIFromStorage();
    makeToast(root, 'Calibración cockpit reseteada.');
  });

  function updateModeAndSpeed() {
    const mode = camCtrl?.getMode?.() || camCtrl?._state?.mode || 'mouse';
    const spd = camCtrl?.getSpeedLevel?.() ?? camCtrl?._state?.ship?.speedLevel;
    const level = Number.isFinite(spd) ? spd : 0;
    if (elSpeed) elSpeed.textContent = String(level);

    if (btnMouse) btnMouse.classList.toggle('on', mode === 'mouse');
    if (btnShip) btnShip.classList.toggle('on', mode === 'ship');
    for (let i = 0; i < speedBtns.length; i++) speedBtns[i].classList.toggle('on', i === level);
  }

  function setVisible(on) {
    root.classList.toggle('eliteHidden', !on);
  }

  // Make panels draggable (using handles)
  const isLocked = () => !!layout.locked;
  makeDraggable(topLeft, root.querySelector('#dragTopLeft'), layout, 'eliteHudTopLeft', isLocked);
  makeDraggable(topRight, root.querySelector('#dragTopRight'), layout, 'eliteHudTopRight', isLocked);
  makeDraggable(bottomLeft, root.querySelector('#dragBottomLeft'), layout, 'eliteHudBottomLeft', isLocked);
  makeDraggable(cockpit, root.querySelector('#dragCockpit'), layout, 'eliteHudCockpit', isLocked);

  // Clamp on resize
  const onResize = () => {
    clampPanelIntoView(topLeft);
    clampPanelIntoView(topRight);
    clampPanelIntoView(bottomLeft);
    clampPanelIntoView(cockpit);
    // Persist clamped positions if we already had a saved one
    const p = layout.panels || {};
    if (p.eliteHudTopLeft) p.eliteHudTopLeft = getPanelPos(topLeft);
    if (p.eliteHudTopRight) p.eliteHudTopRight = getPanelPos(topRight);
    if (p.eliteHudBottomLeft) p.eliteHudBottomLeft = getPanelPos(bottomLeft);
    if (p.eliteHudCockpit) p.eliteHudCockpit = getPanelPos(cockpit);
    saveLayout(layout);
  };
  window.addEventListener('resize', onResize, { passive: true });

  // Public update hook (call from render loop)
  function update() {
    // keep fullscreen icon state (optional)
    try {
      if (btnFs) btnFs.textContent = document.fullscreenElement ? '⛶×' : '⛶';
    } catch (_) {}

    // floatingOrigin module can update the coordinate spans itself.
    // We still update mode/speed every frame.
    updateModeAndSpeed();

    // Cockpit views + projection upkeep
    try { cockpitMgr?.tick?.(); } catch (_) {}
  }

  // One immediate update
  update();

  // Cleanup if engine/scene is disposed
  try {
    const obs = engine?.onDisposeObservable || camera?.getScene?.()?.onDisposeObservable;
    obs?.add?.(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      try { cockpitMgr?.dispose?.(); } catch (_) {}
    });
  } catch (_) {}

  return {
    update,
    setVisible,
    root,
  };
}
