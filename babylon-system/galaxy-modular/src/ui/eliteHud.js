// src/ui/eliteHud.js
// HUD compacto tipo cabina
// - C: mostrar/ocultar HUD
// - L: labels on/off
// - G: grid on/off
// - M/K: modos cámara (M oculto en HUD, sigue por teclado)
// - 0..9: hitos de velocidad
// - +/-: ajuste fino
// - º: reversa
// - R: centrar vista

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

const LAYOUT_KEY = 'eliteHudLayout_v3';

function loadLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? JSON.parse(raw) : { panels: {} };
  } catch (_) {
    return { panels: {} };
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

function makeDraggable(panelEl, handleEl, layout, panelKey) {
  if (!panelEl || !handleEl) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let baseLeft = 0;
  let baseTop = 0;
  let raf = 0;
  let nextLeft = 0;
  let nextTop = 0;

  const paint = () => {
    raf = 0;
    applyPanelPos(panelEl, { left: nextLeft, top: nextTop });
  };

  const onMove = (ev) => {
    if (!dragging) return;

    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

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

    layout.panels[panelKey] = getPanelPos(panelEl);
    saveLayout(layout);
  };

  handleEl.addEventListener('pointerdown', (ev) => {
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault?.();
    ev.stopPropagation?.();

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

function fmtAbs(v) {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(3);
}

function getAbsoluteCameraPosition(camera, floating) {
  try {
    if (floating?.getCameraAbsoluteToRef && typeof BABYLON !== 'undefined') {
      const out = new BABYLON.Vector3();
      floating.getCameraAbsoluteToRef(out);
      return out;
    }
  } catch (_) {}

  try {
    if (floating?.getAbsolutePosition && camera?.position) {
      return floating.getAbsolutePosition(camera.position);
    }
  } catch (_) {}

  try {
    if (floating?.originOffset && camera?.position) {
      return {
        x: (camera.position.x || 0) + (floating.originOffset.x || 0),
        y: (camera.position.y || 0) + (floating.originOffset.y || 0),
        z: (camera.position.z || 0) + (floating.originOffset.z || 0),
      };
    }
  } catch (_) {}

  return camera?.position || { x: 0, y: 0, z: 0 };
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

  camCtrl = camCtrl || window.__camCtrl || null;
  const mount = document.getElementById(mountId) || document.body;

  try { document.getElementById('eliteHudRoot')?.remove(); } catch (_) {}

  if (!document.getElementById('eliteHudStyles')) {
    const st = document.createElement('style');
    st.id = 'eliteHudStyles';
    st.textContent = `
      :root{
        --hudC: rgba(0,255,204,0.92);
        --hudBg: rgba(0,0,0,0.34);
        --hudLine: rgba(0,255,204,0.18);
        --hudWarn: rgba(255,170,60,0.95);
      }

      #eliteHudRoot{
        position:fixed;
        inset:0;
        z-index:9999;
        pointer-events:none;
      }
      #eliteHudRoot.eliteHidden{ display:none; }

      .elitePanel{
        pointer-events:auto;
        position:relative;
        overflow:hidden;
        border-radius:12px;
        border:1px solid var(--hudLine);
        background:var(--hudBg);
        backdrop-filter: blur(6px);
        box-shadow: 0 0 0 1px rgba(0,0,0,0.35) inset;
        font-family: Orbitron, system-ui, -apple-system, Segoe UI, Arial, sans-serif;
        color: rgba(215,255,247,0.96);
      }
      .elitePanel:before{
        content:'';
        position:absolute; inset:0;
        pointer-events:none;
        background: linear-gradient(90deg, rgba(0,255,204,0.06), transparent 40%, transparent 60%, rgba(0,255,204,0.04));
      }
      .elitePanel.dragging{
        outline: 2px solid rgba(0,255,204,0.18);
      }

      .eliteHdr{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:8px 10px 6px 10px;
        border-bottom:1px solid rgba(0,255,204,0.10);
      }
      .eliteHdrLeft{
        display:flex;
        align-items:flex-start;
        gap:8px;
        min-width:0;
      }
      .eliteLogo{
        width:34px;
        height:34px;
        object-fit:contain;
        filter: drop-shadow(0 0 8px rgba(0,255,204,0.14));
        flex:0 0 auto;
      }
      .eliteTitleWrap{
        display:flex;
        flex-direction:column;
        gap:2px;
        min-width:0;
      }
      .eliteTitle{
        color: var(--hudC);
        font-size:11px;
        letter-spacing:0.9px;
        text-shadow: 0 0 8px rgba(0,255,204,0.18);
        white-space:nowrap;
      }
      .eliteSub{
        font-size:10px;
        line-height:1.2;
        color: rgba(215,255,247,0.82);
        white-space:nowrap;
      }

      .eliteHdrRight{
        display:flex;
        align-items:center;
        gap:6px;
        flex:0 0 auto;
      }

      .dragHandle,
      .eliteIconBtn{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:24px;
        height:24px;
        border-radius:8px;
        border:1px solid rgba(0,255,204,0.18);
        background: rgba(0,0,0,0.24);
        color: rgba(0,255,204,0.82);
        cursor:pointer;
        user-select:none;
        font: inherit;
      }
      .dragHandle{ cursor:grab; }
      .dragHandle:active{ cursor:grabbing; }

      .eliteBody{
        padding:8px 10px 10px 10px;
        font-size:11px;
      }
      .eliteRow{
        display:flex;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
      }
      .eliteCol{
        display:flex;
        flex-direction:column;
        gap:8px;
        min-width:0;
      }
      .eliteK{
        color: rgba(0,255,204,0.88);
        font-size:10px;
      }
      .eliteV{
        color: rgba(235,255,251,0.95);
        font-size:12px;
      }
      .eliteMuted{
        opacity:0.78;
        font-size:10px;
      }

      .eliteBtn{
        pointer-events:auto;
        font-family: Orbitron, system-ui, sans-serif;
        font-size:11px;
        color: rgba(215,255,247,0.96);
        background: rgba(0,0,0,0.36);
        border:1px solid rgba(0,255,204,0.22);
        border-radius:10px;
        padding:5px 8px;
        min-height:28px;
        cursor:pointer;
        transition: transform .06s ease, border-color .12s ease, background .12s ease;
      }
      .eliteBtn:hover{
        border-color: rgba(0,255,204,0.42);
        background: rgba(0,0,0,0.50);
      }
      .eliteBtn:active{ transform: translateY(1px); }
      .eliteBtn.on{ outline:2px solid rgba(0,255,204,0.22); }
      .eliteBtn.warn.on{
        outline-color: rgba(255,170,60,0.25);
        border-color: rgba(255,170,60,0.34);
        color: rgba(255,230,190,0.95);
      }

      .eliteSeg{
        display:flex;
        gap:5px;
        flex-wrap:wrap;
      }
      .eliteSeg .eliteBtn{
        min-width:30px;
        height:26px;
        padding:4px 7px;
        border-radius:9px;
      }

      .eliteMetrics{
        display:flex;
        gap:14px;
        flex-wrap:wrap;
        align-items:flex-start;
      }
      .eliteMetric{
        display:flex;
        flex-direction:column;
        gap:2px;
        min-width:70px;
      }

      .eliteMainLayout{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
      }
      .eliteMainLeft{
        flex:1 1 auto;
        min-width:0;
      }

      .eliteSpeedRailWrap{
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:6px;
        min-width:40px;
      }
      .eliteRailLabel{
        font-size:10px;
        color: var(--hudC);
        letter-spacing:0.8px;
      }
      .eliteSpeedRail{
        position:relative;
        width:16px;
        height:150px;
        border-radius:14px;
        border:1px solid rgba(0,255,204,0.18);
        background: linear-gradient(180deg, rgba(0,255,204,0.08), rgba(0,0,0,0.44) 40%, rgba(0,0,0,0.52) 60%, rgba(255,120,70,0.08));
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.35);
        cursor: ns-resize;
        touch-action:none;
      }
      .eliteSpeedRailCenter{
        position:absolute;
        left:2px; right:2px; top:50%;
        height:1px;
        background: rgba(255,255,255,0.20);
        transform: translateY(-50%);
      }
      .eliteSpeedRailThumb{
        position:absolute;
        left:50%;
        top:50%;
        width:26px;
        height:10px;
        border-radius:999px;
        border:1px solid rgba(0,255,204,0.38);
        background: rgba(0,255,204,0.34);
        box-shadow: 0 0 10px rgba(0,255,204,0.14);
        transform: translate(-50%, -50%);
      }
      .eliteRailScale{
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:4px;
        font-size:9px;
        color: rgba(215,255,247,0.74);
      }

      #eliteHudMain{
        position:fixed;
        left:10px;
        top:10px;
        width:min(560px, calc(100vw - 20px));
      }

      #eliteHudNotes{
        position:fixed;
        left:10px;
        bottom:10px;
        width:min(300px, calc(100vw - 20px));
      }

      .eliteNotes{
        display:block;
        width:100%;
        min-height:90px;
        resize:vertical;
        background: rgba(0,0,0,0.24);
        color: rgba(236,255,251,0.96);
        border:1px solid rgba(0,255,204,0.16);
        border-radius:10px;
        padding:10px 11px;
        outline:none;
        box-sizing:border-box;
        font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      .eliteNotes::placeholder{
        color: rgba(215,255,247,0.44);
      }

      #eliteHudReticle{
        position:fixed;
        left:50%;
        top:50%;
        transform:translate(-50%, -50%);
        width:180px;
        height:180px;
        pointer-events:none;
        opacity:0.96;
      }
      .retRing{
        position:absolute;
        inset:0;
        margin:auto;
        width:74px;
        height:74px;
        border-radius:50%;
        border:1px solid rgba(0,255,204,0.18);
        box-shadow: 0 0 18px rgba(0,255,204,0.06);
      }
      .retCrossH,
      .retCrossV{
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%, -50%);
        background: rgba(0,255,204,0.86);
        box-shadow: 0 0 8px rgba(0,255,204,0.24);
      }
      .retCrossH{ width:40px; height:1px; }
      .retCrossV{ width:1px; height:40px; }

      .eliteHeadingMark{
        position:absolute;
        left:50%;
        top:50%;
        width:14px;
        height:14px;
        transform: translate(-50%, -50%);
        opacity:0.95;
      }
      .eliteHeadingMark:before,
      .eliteHeadingMark:after{
        content:'';
        position:absolute;
        left:50%;
        top:50%;
        background: rgba(255,190,80,0.94);
        box-shadow: 0 0 8px rgba(255,180,60,0.28);
        transform: translate(-50%, -50%);
      }
      .eliteHeadingMark:before{ width:14px; height:2px; }
      .eliteHeadingMark:after{ width:2px; height:14px; }

      #eliteHudHint{
        position:fixed;
        left:50%;
        bottom:8px;
        transform:translateX(-50%);
        pointer-events:none;
        color: rgba(215,255,247,0.72);
        font: 10px/1.2 Orbitron, system-ui, sans-serif;
        letter-spacing:0.6px;
        text-shadow: 0 0 8px rgba(0,255,204,0.12);
      }

      @media (max-width: 760px){
        #eliteHudMain{
          width: calc(100vw - 12px);
          left:6px;
          top:6px;
        }
        #eliteHudNotes{
          display:none;
        }
        .eliteHdr{
          padding:7px 8px 5px 8px;
        }
        .eliteBody{
          padding:7px 8px 8px 8px;
        }
        .eliteLogo{
          width:28px;
          height:28px;
        }
        .eliteTitle{
          font-size:10px;
        }
        .eliteSub{
          font-size:9px;
        }
        .eliteBtn{
          font-size:10px;
          padding:4px 7px;
          min-height:25px;
        }
        .eliteMetrics{
          gap:10px;
        }
        .eliteMetric{
          min-width:58px;
        }
        .eliteV{
          font-size:11px;
        }
        .eliteSpeedRail{
          height:114px;
          width:14px;
        }
        .eliteSpeedRailThumb{
          width:22px;
          height:9px;
        }
        #eliteHudReticle{
          width:150px;
          height:150px;
        }
        .retRing{
          width:62px;
          height:62px;
        }
        .retCrossH{ width:34px; }
        .retCrossV{ height:34px; }
        #eliteHudHint{
          display:none;
        }
      }
    `;
    document.head.appendChild(st);
  }

  const layout = loadLayout();
  const DEV_UI = false;

  const root = document.createElement('div');
  root.id = 'eliteHudRoot';

	const ret = document.createElement('div');
	ret.id = 'eliteHudReticle';
	ret.innerHTML = `
	  <div class="retBox">
		<span class="retCorner tl"></span>
		<span class="retCorner tr"></span>
		<span class="retCorner bl"></span>
		<span class="retCorner br"></span>
		<div class="retCrossH"></div>
		<div class="retCrossV"></div>
	  </div>
	  <div class="eliteHeadingMark" id="eliteHeadingMark">
		<div class="eliteHeadingDot"></div>
	  </div>
	`;

  const hint = document.createElement('div');
  hint.id = 'eliteHudHint';
  hint.textContent = 'C HUD · L labels · G grid · M ratón(dev) · K nave · 0..9 hitos · +/- fino · º reversa · R centrar vista';

  const main = document.createElement('div');
  main.id = 'eliteHudMain';
  main.className = 'elitePanel';
  main.innerHTML = `
    <div class="eliteHdr">
      <div class="eliteHdrLeft">
        <img id="eliteLogo" class="eliteLogo" alt="Logo">
        <div class="eliteTitleWrap">
          <div class="eliteTitle">GALAXY MODULAR · FLIGHT <span id="hudModeInline">K</span></div>
          <div class="eliteSub">ABS X <span id="absX">—</span> · Y <span id="absY">—</span> · Z <span id="absZ">—</span></div>
        </div>
      </div>
      <div class="eliteHdrRight">
        <button class="eliteIconBtn" id="btnLayoutReset" title="Reset HUD">↺</button>
        <button class="eliteIconBtn" id="btnFullscreen" title="Pantalla completa">⛶</button>
        <span class="dragHandle" id="dragMain" title="Arrastra">⠿</span>
      </div>
    </div>

    <div class="eliteBody">
      <div class="eliteMainLayout">
        <div class="eliteMainLeft">
          <div class="eliteRow" style="margin-bottom:8px;">
            <button class="eliteBtn" id="btnModeShip">K</button>
            <button class="eliteBtn warn" id="btnReverse" title="Alternar reversa (º)">REV</button>
            <button class="eliteBtn" id="btnLabels" title="Labels (L)">LBL</button>
            <button class="eliteBtn" id="btnGrid" title="Grid (G)">GRD</button>
            <button class="eliteBtn" id="btnGyro" title="Giroscopio">GYR</button>
            <button class="eliteBtn" id="btnGyroReset" title="Recalibrar giroscopio">GYR↺</button>
            <button class="eliteBtn" id="btnViewCenter" title="Centrar vista (R)">VIEW↺</button>
          </div>

          <div class="eliteMetrics" style="margin-bottom:7px;">
            <div class="eliteMetric">
              <span class="eliteK">STEP</span>
              <span class="eliteV" id="hudSpeed">0</span>
            </div>
            <div class="eliteMetric">
              <span class="eliteK">KM/S</span>
              <span class="eliteV" id="hudKmS">0.000</span>
            </div>
            <div class="eliteMetric">
              <span class="eliteK">LY/H</span>
              <span class="eliteV" id="hudLyH">0.000000</span>
            </div>
          </div>

          <div class="eliteMuted" id="hudSpeedMeta" style="margin-bottom:7px;">FWD · paso 0/49 · +/- fino · º reversa</div>

          <div class="eliteSeg" id="speedSeg"></div>
        </div>

        <div class="eliteSpeedRailWrap">
          <div class="eliteRailLabel">RNG</div>
          <div class="eliteSpeedRail" id="speedRail" title="Arrastra para ajustar velocidad">
            <div class="eliteSpeedRailCenter"></div>
            <div class="eliteSpeedRailThumb" id="speedRailThumb"></div>
          </div>
          <div class="eliteRailScale"><span>FWD</span><span>0</span><span>REV</span></div>
        </div>
      </div>
    </div>
  `;

  const notesPanel = document.createElement('div');
  notesPanel.id = 'eliteHudNotes';
  notesPanel.className = 'elitePanel';
  notesPanel.innerHTML = `
    <div class="eliteHdr">
      <div class="eliteTitle">COMMS / NOTES</div>
      <div class="eliteHdrRight">
        <span class="dragHandle" id="dragNotes" title="Arrastra">⠿</span>
      </div>
    </div>
    <div class="eliteBody">
      <textarea class="eliteNotes" id="hudNotesArea" placeholder="Notas… / comandos…"></textarea>
    </div>
  `;

  root.appendChild(ret);
  root.appendChild(main);
  root.appendChild(notesPanel);
  root.appendChild(hint);
  mount.appendChild(root);

  try {
    if (layout?.panels?.eliteHudMain) applyPanelPos(main, layout.panels.eliteHudMain);
    if (layout?.panels?.eliteHudNotes) applyPanelPos(notesPanel, layout.panels.eliteHudNotes);
    setTimeout(() => {
      clampPanelIntoView(main);
      clampPanelIntoView(notesPanel);
    }, 0);
  } catch (_) {}

  try {
    const img = root.querySelector('#eliteLogo');
    img.src = logoUrl || new URL('../resources/logo.svg', import.meta.url).href;
  } catch (_) {}

  const uiState = {
    labelsVisible: true,
    gridVisible: false,
  };

  try {
    if (typeof labelsApi?.getShowLabels === 'function') {
      uiState.labelsVisible = labelsApi.getShowLabels() !== false;
    }
  } catch (_) {}

  try {
    if (typeof gridController?.isEnabled === 'function') {
      uiState.gridVisible = !!gridController.isEnabled();
    } else if (typeof gridController?.enabled === 'boolean') {
      uiState.gridVisible = !!gridController.enabled;
    }
  } catch (_) {}

  const btnFs = root.querySelector('#btnFullscreen');
  const btnLayoutReset = root.querySelector('#btnLayoutReset');
  const btnShip = root.querySelector('#btnModeShip');
  const btnReverse = root.querySelector('#btnReverse');
  const btnLabels = root.querySelector('#btnLabels');
  const btnGrid = root.querySelector('#btnGrid');
  const btnGyro = root.querySelector('#btnGyro');
  const btnGyroReset = root.querySelector('#btnGyroReset');
  const btnViewCenter = root.querySelector('#btnViewCenter');

  const headingMark = root.querySelector('#eliteHeadingMark');
  const modeInline = root.querySelector('#hudModeInline');
  const elAbsX = root.querySelector('#absX');
  const elAbsY = root.querySelector('#absY');
  const elAbsZ = root.querySelector('#absZ');
  const elSpeed = root.querySelector('#hudSpeed');
  const elKmS = root.querySelector('#hudKmS');
  const elLyH = root.querySelector('#hudLyH');
  const elSpeedMeta = root.querySelector('#hudSpeedMeta');
  const speedRail = root.querySelector('#speedRail');
  const speedRailThumb = root.querySelector('#speedRailThumb');
  const speedSeg = root.querySelector('#speedSeg');
  const notes = root.querySelector('#hudNotesArea');

  const speedBtns = [];
  for (let i = 0; i <= 9; i++) {
    const b = document.createElement('button');
    b.className = 'eliteBtn';
    b.textContent = String(i);
    b.title = `Atajo ${i}`;
    b.onclick = () => {
      if (camCtrl?.setSpeedLevel) camCtrl.setSpeedLevel(i);
      else safeDispatchKey(String(i));
      updateModeAndSpeed(true);
    };
    speedSeg.appendChild(b);
    speedBtns.push(b);
  }

  function setLabelsVisible(on) {
    uiState.labelsVisible = !!on;
    try { labelsApi?.setShowLabels?.(uiState.labelsVisible); } catch (_) {}
    updateModeAndSpeed(true);
  }

  function toggleLabels() {
    setLabelsVisible(!uiState.labelsVisible);
  }

  function setGridVisible(on) {
    uiState.gridVisible = !!on;
    try { gridController?.setEnabled?.(uiState.gridVisible); } catch (_) {}
    updateModeAndSpeed(true);
  }

  function toggleGrid() {
    setGridVisible(!uiState.gridVisible);
  }

  btnFs?.addEventListener('click', toggleFullscreen);

  btnLayoutReset?.addEventListener('click', () => {
    layout.panels = {};
    saveLayout(layout);
    for (const el of [main, notesPanel]) {
      el.style.left = '';
      el.style.top = '';
      el.style.right = '';
      el.style.bottom = '';
    }
  });

  btnShip?.addEventListener('click', () => {
    if (camCtrl?.setMode) camCtrl.setMode('ship');
    else safeDispatchKey('k');
    updateModeAndSpeed(true);
  });

  btnReverse?.addEventListener('click', () => {
    if (camCtrl?.toggleReverse) camCtrl.toggleReverse();
    else safeDispatchKey('º');
    updateModeAndSpeed(true);
  });

  btnLabels?.addEventListener('click', toggleLabels);
  btnGrid?.addEventListener('click', toggleGrid);

  btnGyro?.addEventListener('click', () => {
    if (camCtrl?.setGyroEnabled) camCtrl.setGyroEnabled(!camCtrl?.getGyroEnabled?.());
    updateModeAndSpeed(true);
  });

  btnGyroReset?.addEventListener('click', () => {
    camCtrl?.resetGyroscope?.();
    updateModeAndSpeed(true);
  });

  btnViewCenter?.addEventListener('click', () => {
    camCtrl?.centerView?.();
    updateModeAndSpeed(true);
  });

  try {
    const key = 'eliteHudNotes';
    const saved = localStorage.getItem(key);
    if (saved != null) notes.value = saved;
    notes.addEventListener('input', () => localStorage.setItem(key, notes.value));
    notes.addEventListener('keydown', (e) => e.stopPropagation());
    notes.addEventListener('keyup', (e) => e.stopPropagation());
  } catch (_) {}

  function onKeyDown(ev) {
    if (shouldIgnoreKey(ev)) return;
    const k = (ev.key || '').toLowerCase();

    if (k === 'c') {
      ev.preventDefault?.();
      setVisible(root.classList.contains('eliteHidden'));
      return;
    }

    if (k === 'l') {
      ev.preventDefault?.();
      toggleLabels();
      return;
    }

    if (k === 'g') {
      ev.preventDefault?.();
      toggleGrid();
      return;
    }
  }

  window.addEventListener('keydown', onKeyDown, { passive: false });

  function setSpeedFromRailClientY(clientY) {
    if (!speedRail || !camCtrl?.setSpeedStep) return;

    const rect = speedRail.getBoundingClientRect();
    if (!rect.height) return;

    const t = clamp((clientY - rect.top) / rect.height, 0, 1);
    const dist = t - 0.5;

    if (Math.abs(dist) <= 0.03) {
      camCtrl.setSpeedStep(0, { sign: 1 });
      return;
    }

    const maxStep = camCtrl?.getHudState?.()?.speed?.maxStep ?? 49;
    const mag = clamp(Math.round((Math.abs(dist) / 0.5) * maxStep), 1, maxStep);
    camCtrl.setSpeedStep(mag, { sign: dist < 0 ? 1 : -1 });
  }

  if (speedRail) {
    let railDrag = false;

    const onRailMove = (ev) => {
      if (!railDrag) return;
      setSpeedFromRailClientY(ev.clientY);
      updateModeAndSpeed(true);
    };

    const stopRailDrag = () => {
      railDrag = false;
      window.removeEventListener('pointermove', onRailMove);
      window.removeEventListener('pointerup', stopRailDrag);
      window.removeEventListener('pointercancel', stopRailDrag);
    };

    speedRail.addEventListener('pointerdown', (ev) => {
      railDrag = true;
      speedRail.setPointerCapture?.(ev.pointerId);
      setSpeedFromRailClientY(ev.clientY);
      updateModeAndSpeed(true);
      window.addEventListener('pointermove', onRailMove, { passive: true });
      window.addEventListener('pointerup', stopRailDrag, { passive: true });
      window.addEventListener('pointercancel', stopRailDrag, { passive: true });
    });
  }

  const UI_MS = 120;
  let _lastUiT = 0;
  let _lastFs = null;
  let _lastHudSignature = '';

  function updateModeAndSpeed(force = false) {
    const hud = camCtrl?.getHudState?.() || {
      mode: camCtrl?.getMode?.() || 'mouse',
      speed: {
        signedStep: camCtrl?.getSpeedLevel?.() ?? 0,
        absStep: Math.abs(camCtrl?.getSpeedLevel?.() ?? 0),
        reverse: (camCtrl?.getSpeedLevel?.() ?? 0) < 0,
        hotkey: camCtrl?.getSelectedHotkey?.() ?? null,
        currentKmS: 0,
        currentLyH: 0,
        maxStep: 49,
      },
      headingMarker: { xN: 0, yN: 0, visible: false },
      gyroEnabled: false,
    };

    const mode = hud.mode || 'mouse';
    const spd = hud.speed || {};
    const absPos = getAbsoluteCameraPosition(camera, floating);

    try {
      if (typeof labelsApi?.getShowLabels === 'function') {
        uiState.labelsVisible = labelsApi.getShowLabels() !== false;
      }
    } catch (_) {}

    try {
      if (typeof gridController?.isEnabled === 'function') {
        uiState.gridVisible = !!gridController.isEnabled();
      } else if (typeof gridController?.enabled === 'boolean') {
        uiState.gridVisible = !!gridController.enabled;
      }
    } catch (_) {}

    const signature = JSON.stringify({
      mode,
      signedStep: spd.signedStep,
      hotkey: spd.hotkey,
      kmS: Number(spd.currentKmS || 0).toFixed(4),
      lyH: Number(spd.currentLyH || 0).toFixed(7),
      reverse: !!spd.reverse,
      gyro: !!hud.gyroEnabled,
      labels: !!uiState.labelsVisible,
      grid: !!uiState.gridVisible,
      absX: fmtAbs(absPos.x),
      absY: fmtAbs(absPos.y),
      absZ: fmtAbs(absPos.z),
      markerX: Number(hud.headingMarker?.xN || 0).toFixed(3),
      markerY: Number(hud.headingMarker?.yN || 0).toFixed(3),
      markerV: !!hud.headingMarker?.visible,
    });

    if (!force && signature === _lastHudSignature) return;
    _lastHudSignature = signature;

    if (modeInline) modeInline.textContent = mode === 'ship' ? 'K' : 'M';

    if (btnShip) btnShip.classList.toggle('on', mode === 'ship');
    if (btnReverse) btnReverse.classList.toggle('on', !!spd.reverse);
    if (btnLabels) btnLabels.classList.toggle('on', !!uiState.labelsVisible);
    if (btnGrid) btnGrid.classList.toggle('on', !!uiState.gridVisible);

    if (btnGyro) {
      btnGyro.classList.toggle('on', !!hud.gyroEnabled);
      btnGyro.textContent = `GYR${hud.gyroEnabled ? '•' : ''}`;
    }

    if (elAbsX) elAbsX.textContent = fmtAbs(absPos.x);
    if (elAbsY) elAbsY.textContent = fmtAbs(absPos.y);
    if (elAbsZ) elAbsZ.textContent = fmtAbs(absPos.z);

    if (elSpeed) elSpeed.textContent = String(spd.signedStep ?? 0);
    if (elKmS) elKmS.textContent = Number(spd.currentKmS || 0).toFixed(3);
    if (elLyH) elLyH.textContent = Number(spd.currentLyH || 0).toFixed(6);

    if (elSpeedMeta) {
      const dir = spd.reverse ? 'REV' : 'FWD';
      elSpeedMeta.textContent = `${dir} · paso ${spd.absStep ?? 0}/${spd.maxStep ?? 49} · +/- fino · º reversa`;
    }

    for (let i = 0; i < speedBtns.length; i++) {
      speedBtns[i].classList.toggle('on', i === spd.hotkey);
    }

    if (speedRailThumb) {
      const maxStep = Math.max(1, spd.maxStep ?? 49);
      const sign = spd.reverse ? -1 : 1;
      const signed = (spd.absStep ?? 0) * sign;
      const normalized = signed / maxStep;
      const topPct = 50 - normalized * 50;

      speedRailThumb.style.top = `${clamp(topPct, 0, 100)}%`;
      speedRailThumb.style.background = spd.reverse ? 'rgba(255,120,70,0.38)' : 'rgba(0,255,204,0.34)';
      speedRailThumb.style.borderColor = spd.reverse ? 'rgba(255,150,70,0.45)' : 'rgba(0,255,204,0.38)';
    }

    if (headingMark) {
      const visible = mode === 'ship' && !!hud.headingMarker?.visible;
      headingMark.style.display = visible ? '' : 'none';

      if (visible) {
        const left = clamp(50 + (hud.headingMarker?.xN || 0) * 38, 8, 92);
        const top = clamp(50 + (hud.headingMarker?.yN || 0) * 32, 8, 92);
        headingMark.style.left = `${left}%`;
        headingMark.style.top = `${top}%`;
      }
    }
  }

  function setVisible(on) {
    root.classList.toggle('eliteHidden', !on);
  }

  makeDraggable(main, root.querySelector('#dragMain'), layout, 'eliteHudMain');
  makeDraggable(notesPanel, root.querySelector('#dragNotes'), layout, 'eliteHudNotes');

  const onResize = () => {
    clampPanelIntoView(main);
    clampPanelIntoView(notesPanel);
    const p = layout.panels || {};
    if (p.eliteHudMain) p.eliteHudMain = getPanelPos(main);
    if (p.eliteHudNotes) p.eliteHudNotes = getPanelPos(notesPanel);
    saveLayout(layout);
  };

  window.addEventListener('resize', onResize, { passive: true });

  function update() {
    const now = performance.now();
    if ((now - _lastUiT) < UI_MS) return;
    _lastUiT = now;

    try {
      const fs = !!document.fullscreenElement;
      if (btnFs && fs !== _lastFs) {
        btnFs.textContent = fs ? '⛶×' : '⛶';
        _lastFs = fs;
      }
    } catch (_) {}

    updateModeAndSpeed();
  }

  update();

  try {
    const obs = engine?.onDisposeObservable || camera?.getScene?.()?.onDisposeObservable;
    obs?.add?.(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    });
  } catch (_) {}

  return {
    update,
    setVisible,
    root,
  };
}