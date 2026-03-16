import { APP_CONFIG } from '../config/appConfig.js';

// src/ui/eliteHud.js
// HUD compacto tipo cabina
// - C: mostrar/ocultar HUD
// - L: labels on/off
// - G: grid on/off
// - N: mostrar/ocultar notes
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

const LAYOUT_KEY = APP_CONFIG.storage.hudLayoutKey;
const NOTES_KEY = APP_CONFIG.storage.hudNotesKey || 'eliteHudNotes';
const NOTES_DRAFT_KEY = APP_CONFIG.storage.hudNotesDraftKey || 'eliteHudNotesDraft';

function loadLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? JSON.parse(raw) : { panels: {} };
  } catch (_) {
    return { panels: {} };
  }
}

function saveLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch (_) {}
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

function fmtAlt(vMeters) {
  if (!Number.isFinite(vMeters)) return '—';
  if (vMeters < 1000) return `${vMeters.toFixed(0)} m`;
  if (vMeters < 10000) return `${(vMeters / 1000).toFixed(2)} km`;
  if (vMeters < 100000) return `${(vMeters / 1000).toFixed(1)} km`;
  return `${(vMeters / 1000).toFixed(0)} km`;
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

function fmtSigned(v, digits = 3) {
  if (!Number.isFinite(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}`;
}

function pad2(n) {
  return String(Math.trunc(n)).padStart(2, '0');
}

function fmtLocalTimestamp(d = new Date()) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function fmtUtcTimestamp(d = new Date()) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())} UTC`;
}

function getForwardDirection(camera) {
  try {
    const dir = camera?.getForwardRay?.(1)?.direction;
    if (dir) {
      const out = dir.clone ? dir.clone() : new BABYLON.Vector3(dir.x || 0, dir.y || 0, dir.z || 1);
      if (out.lengthSquared() > 1e-12) out.normalize();
      return out;
    }
  } catch (_) {}
  return new BABYLON.Vector3(0, 0, 1);
}

function getHeadingFromDirection(dir) {
  const az = ((Math.atan2(dir.x || 0, dir.z || 1) * 180 / Math.PI) + 360) % 360;
  const el = Math.asin(clamp(dir.y || 0, -1, 1)) * 180 / Math.PI;
  return { azimuthDeg: az, elevationDeg: el };
}

function getLockedBodyName(orbitAnchor) {
  try {
    const node = orbitAnchor?.getLockedBody?.();
    return String(node?.metadata?.bodyId || node?.name || '');
  } catch (_) {
    return '';
  }
}

function buildTelemetryStamp({
  camera,
  floating,
  surfaceAltimeter,
  camCtrl,
  orbitAnchor,
}) {
  const now = new Date();
  const absPos = getAbsoluteCameraPosition(camera, floating);
  const hud = camCtrl?.getHudState?.() || {};
  const spd = hud.speed || {};
  const alt = surfaceAltimeter?.getState?.() || { visible: false, bodyName: '', meters: null };
  const lockedBody = getLockedBodyName(orbitAnchor);
  const dir = getForwardDirection(camera);
  const heading = getHeadingFromDirection(dir);

  let context = 'TRÁNSITO LIBRE';
  let body = lockedBody || alt.bodyName || '—';

  if (lockedBody) context = 'ÓRBITA / MARCO LOCAL';
  if (alt.visible) {
    context = (Number(alt.meters) <= 1500) ? 'SUPERFICIE / RASANTE' : 'PROXIMIDAD';
    body = alt.bodyName || body;
  }

  const stepSigned = Number.isFinite(spd.signedStep) ? spd.signedStep : 0;
  const stepAbs = Number.isFinite(spd.absStep) ? spd.absStep : Math.abs(stepSigned);
  const stepMax = Number.isFinite(spd.maxStep) ? spd.maxStep : 49;
  const dirLabel = spd.reverse ? 'REV' : 'FWD';
  const gyroLabel = hud.gyroEnabled ? 'ON' : 'OFF';
  const freeYawDeg = (Number(hud.freeLookYaw || 0) * 180 / Math.PI);
  const freePitchDeg = (Number(hud.freeLookPitch || 0) * 180 / Math.PI);

  return [
    `[BITÁCORA ${fmtUtcTimestamp(now)} | local ${fmtLocalTimestamp(now)}]`,
    `ESTADO: ${context}`,
    `CUERPO: ${body}`,
    `ALT: ${alt.visible ? fmtAlt(Number(alt.meters)) : '—'}`,
    `POS ABS: X ${fmtAbs(absPos.x)} · Y ${fmtAbs(absPos.y)} · Z ${fmtAbs(absPos.z)}`,
    `VEL: ${dirLabel} · paso ${stepAbs}/${stepMax} · ${Number(spd.currentKmS || 0).toFixed(3)} km/s · ${Number(spd.currentLyH || 0).toFixed(6)} ly/h`,
    `RUMBO: az ${heading.azimuthDeg.toFixed(1)}° · el ${heading.elevationDeg.toFixed(1)}°`,
    `VECTOR FWD: ${fmtSigned(dir.x, 5)}, ${fmtSigned(dir.y, 5)}, ${fmtSigned(dir.z, 5)}`,
    `VISTA: yaw ${fmtSigned(freeYawDeg, 1)}° · pitch ${fmtSigned(freePitchDeg, 1)}° · gyro ${gyroLabel}`,
    `OBS: `,
  ].join('\n');
}

export function createEliteHud({
  camera,
  engine,
  floating,
  surfaceAltimeter,
  orbitAnchor,
  labelsApi,
  gridController,
  camCtrl,
  mountId = 'eliteHudMount',
  logoUrl,
} = {}) {
  if (typeof document === 'undefined') return { update() {}, setVisible() {} };

  camCtrl = camCtrl || window.__camCtrl || null;
  const mount = document.getElementById(mountId) || document.body;

  const isTouchLike =
    !!window.matchMedia?.('(pointer: coarse)').matches ||
    /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent || '');

  try { document.getElementById('eliteHudRoot')?.remove(); } catch (_) {}

  if (!document.getElementById('eliteHudStyles')) {
    const st = document.createElement('style');
    st.id = 'eliteHudStyles';
    st.textContent = `
      :root{
        --hudC: rgba(0,255,204,0.92);
        --hudBg: rgba(0,0,0,0.34);
        --hudBg2: rgba(0,0,0,0.48);
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
        backdrop-filter: blur(3px);
        box-shadow: 0 0 0 1px rgba(0,0,0,0.35) inset;
        font-family: Orbitron, system-ui, -apple-system, Segoe UI, Arial, sans-serif;
        color: rgba(215,255,247,0.96);
      }
      .elitePanel:before{
        content:'';
        position:absolute;
        inset:0;
        pointer-events:none;
        background: linear-gradient(90deg, rgba(0,255,204,0.05), transparent 40%, transparent 60%, rgba(0,255,204,0.04));
      }
      .elitePanel.dragging{
        outline: 2px solid rgba(0,255,204,0.18);
      }
      .elitePaneHidden{
        display:none !important;
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

      .eliteMetrics{
        display:flex;
        gap:18px;
        align-items:flex-start;
        margin-bottom:6px;
      }
      .eliteMetric{
        display:flex;
        flex-direction:column;
        gap:2px;
        min-width:72px;
      }
	  .eliteMetric:first-child {
		min-width: 25px;
	  }

      .eliteMainLayout{
        display:grid;
        grid-template-columns: minmax(0, 1fr) 66px;
        align-items:stretch;
        gap:10px;
      }
      .eliteMainLeft{
        min-width:0;
      }

      .eliteSpeedSeg{
        display:grid;
        grid-template-columns: repeat(5, 1fr);
        gap:7px 7px;
        max-width: 250px;
      }
      .eliteSpeedSeg .eliteBtn{
        min-width:0;
        height:28px;
        padding:4px 0;
        border-radius:10px;
      }

      .eliteSpeedRailWrap{
        position:relative;
        display:block;
        width:66px;
        min-width:66px;
        height:176px;
      }
      .eliteSpeedRail{
        position:absolute;
        left:50%;
        top:12px;
        transform:translateX(-50%);
        width:16px;
        height:152px;
        border-radius:14px;
        border:1px solid rgba(0,255,204,0.18);
        background: linear-gradient(180deg, rgba(0,255,204,0.08), rgba(0,0,0,0.44) 40%, rgba(0,0,0,0.52) 60%, rgba(255,120,70,0.08));
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.35);
        cursor: ns-resize;
        touch-action:none;
      }
      .eliteSpeedRailCenter{
        position:absolute;
        left:2px;
        right:2px;
        top:50%;
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

      .eliteRailTop{
        position:absolute;
        top:0;
        right:0;
        font-size:10px;
        color: rgba(215,255,247,0.82);
      }
      .eliteRailMid{
        position:absolute;
        left:2px;
        top:50%;
        transform: translateY(-50%);
        font-size:10px;
        color: rgba(215,255,247,0.82);
      }
      .eliteRailBottom{
        position:absolute;
        bottom:0;
        right:0;
        font-size:10px;
        color: rgba(215,255,247,0.82);
      }
      .eliteRailTag{
        position:absolute;
        right:0;
        top:50%;
        transform: translateY(-50%);
        font-size:11px;
        color: var(--hudC);
        letter-spacing:0.8px;
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }

      #eliteHudMain{
        position:fixed;
        left:8px;
        top:8px;
        width:min(372px, calc(100vw - 16px));
      }

      #eliteHudNotes{
        position:fixed;
        left:8px;
        bottom:8px;
        width:min(372px, calc(100vw - 16px));
      }

      .eliteAbsLine{
        margin-top:8px;
        font-size:10px;
        line-height:1.2;
        color: rgba(215,255,247,0.82);
        white-space:nowrap;
      }

      .eliteNotes{
        display:block;
        width:100%;
        min-height:76px;
        resize:vertical;
        background: rgba(0,0,0,0.24);
        color: rgba(236,255,251,0.96);
        border:1px solid rgba(0,255,204,0.16);
        border-radius:10px;
        padding:10px 11px;
        outline:none;
        box-sizing:border-box;
        font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        scrollbar-width: thin;
        scrollbar-color: rgba(0,255,204,0.42) rgba(0,0,0,0.18);
      }
      .eliteNotes::placeholder{
        color: rgba(215,255,247,0.44);
      }
      .eliteNotes::-webkit-scrollbar{
        width:10px;
      }
      .eliteNotes::-webkit-scrollbar-track{
        background: linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.34));
        border-left:1px solid rgba(0,255,204,0.08);
        border-radius:10px;
      }
      .eliteNotes::-webkit-scrollbar-thumb{
        background: linear-gradient(180deg, rgba(0,255,204,0.34), rgba(0,190,255,0.24));
        border:1px solid rgba(0,255,204,0.22);
        border-radius:10px;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0.04),
          0 0 8px rgba(0,255,204,0.10);
      }
      .eliteNotes::-webkit-scrollbar-thumb:hover{
        background: linear-gradient(180deg, rgba(0,255,204,0.48), rgba(0,190,255,0.34));
        border-color: rgba(0,255,204,0.34);
      }
      .eliteNotes::-webkit-scrollbar-corner{
        background: transparent;
      }

      .eliteNotesTools{
        display:flex;
        gap:8px;
        margin-bottom:8px;
        flex-wrap:wrap;
      }

      .eliteNotesComposer{
        display:flex;
        gap:8px;
        margin-top:8px;
        align-items:center;
      }

      .eliteNotesInput{
        flex:1 1 auto;
        min-width:0;
        height:32px;
        background: rgba(0,0,0,0.24);
        color: rgba(236,255,251,0.96);
        border:1px solid rgba(0,255,204,0.16);
        border-radius:10px;
        padding:0 11px;
        outline:none;
        box-sizing:border-box;
        font: 12px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      .eliteNotesInput::placeholder{
        color: rgba(215,255,247,0.44);
      }

      .eliteBtn.eliteBtnMini{
        min-height:32px;
        padding:5px 10px;
      }
	  
      #eliteHudReticle{
        position:fixed;
        left:50%;
        top:50%;
        transform:translate(-50%, -50%);
        width:170px;
        height:170px;
        pointer-events:none;
        opacity:0.96;
      }
      .retBox{
        position:absolute;
        inset:0;
        margin:auto;
        width:68px;
        height:68px;
      }
      .retCorner{
        position:absolute;
        width:14px;
        height:14px;
        filter: drop-shadow(0 0 6px rgba(0,255,204,0.12));
      }
      .retCorner.tl{ left:0; top:0; border-left:1px solid; border-top:1px solid; border-color: rgba(0,255,204,0.55);}
      .retCorner.tr{ right:0; top:0; border-right:1px solid; border-top:1px solid; border-color: rgba(0,255,204,0.55);}
      .retCorner.bl{ left:0; bottom:0; border-left:1px solid; border-bottom:1px solid; border-color: rgba(0,255,204,0.55);}
      .retCorner.br{ right:0; bottom:0; border-right:1px solid; border-bottom:1px solid; border-color: rgba(0,255,204,0.55);}

      .retCrossH,
      .retCrossV{
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%, -50%);
        background: rgba(0,255,204,0.88);
        box-shadow: 0 0 8px rgba(0,255,204,0.24);
      }
      .retCrossH{ width:34px; height:1px; }
      .retCrossV{ width:1px; height:34px; }

      .eliteHeadingMark{
        position:absolute;
        left:50%;
        top:50%;
        width:22px;
        height:22px;
        transform: translate(-50%, -50%);
        opacity:0.95;
      }
      .eliteHeadingMark:before,
      .eliteHeadingMark:after{
        content:'';
        position:absolute;
        left:50%;
        top:50%;
        background: rgba(255,190,80,0.92);
        box-shadow: 0 0 8px rgba(255,180,60,0.28);
        transform: translate(-50%, -50%);
      }
      .eliteHeadingMark:before{ width:22px; height:2px; }
      .eliteHeadingMark:after{ width:2px; height:22px; }
      .eliteHeadingDot{
        position:absolute;
        left:50%;
        top:50%;
        width:6px;
        height:6px;
        border-radius:999px;
        background: rgba(255,190,80,0.95);
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px rgba(255,180,60,0.34);
      }

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
          display:none !important;
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
        .eliteMainLayout{
          grid-template-columns: minmax(0, 1fr) 56px;
        }
        .eliteSpeedRailWrap{
          width:56px;
          min-width:56px;
          height:136px;
        }
        .eliteSpeedRail{
          height:118px;
          width:14px;
		  top:9px;
        }
        .eliteSpeedRailThumb{
          width:22px;
          height:9px;
        }
        #eliteHudReticle{
          width:150px;
          height:150px;
        }
        .retBox{
          width:60px;
          height:60px;
        }
        .retCrossH{ width:30px; }
        .retCrossV{ height:30px; }
        #eliteHudHint{
          display:none;
        }
        .hideOnSmall{
          display:none !important;
        }
      }

      @media (pointer: coarse) and (orientation: landscape){
        #eliteHudMain{
          width:min(360px, calc(100vw - 10px));
          left:5px;
          top:5px;
        }
        #speedSeg{
          display:none;
        }
        .eliteMainLayout{
          grid-template-columns: minmax(0, 1fr) 48px;
          gap:8px;
        }
        .eliteSpeedRailWrap{
          width:48px;
          min-width:48px;
          height:108px;
        }
        .eliteSpeedRail{
          height:94px;
          width:12px;
		  top:7px;
        }
        .eliteSpeedRailThumb{
          width:18px;
          height:8px;
        }
        .eliteMetrics{
          gap:8px;
        }
        .eliteMetric{
          min-width:52px;
        }
        .eliteBtn{
          min-height:24px;
          padding:4px 6px;
        }
      }
    `;
    document.head.appendChild(st);
  }

  const layout = loadLayout();

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
  hint.textContent = 'C Activa/desactiva el HUD';

  const controlsExtra = isTouchLike
    ? `
      <button class="eliteBtn" id="btnGyro" title="Giroscopio">GYR</button>
      <button class="eliteBtn" id="btnGyroReset" title="Recalibrar giroscopio">GYR↺</button>
    `
    : '';

  const main = document.createElement('div');
  main.id = 'eliteHudMain';
  main.className = 'elitePanel';
  main.innerHTML = `
    <div class="eliteHdr">
      <div class="eliteHdrLeft">
        <img id="eliteLogo" class="eliteLogo" alt="Logo">
        <div class="eliteTitleWrap">
          <div class="eliteTitle">GALAXY MODULAR · FLIGHT <span id="hudModeInline">K</span></div>
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
            <button class="eliteBtn hideOnSmall" id="btnNotesToggle" title="Notes (N)">NOT</button>
            <button class="eliteBtn" id="btnLabels" title="Labels (L)">LBL</button>
            <button class="eliteBtn" id="btnGrid" title="Grid (G)">GRD</button>
            ${controlsExtra}
            <button class="eliteBtn" id="btnViewCenter" title="Centrar vista (R)">VIEW↺</button>
          </div>

          <div class="eliteMetrics">
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
            <div class="eliteMetric">
              <span class="eliteK">ALT</span>
              <span class="eliteV" id="hudAlt">—</span>
            </div>
          </div>

          <div class="eliteMuted" id="hudSpeedMeta" style="margin-bottom:8px;">FWD · paso 0/49 · +/- fino · º reversa</div>
          <div class="eliteMuted" id="hudAltMeta" style="margin-bottom:8px;">SURF —</div>

          <div class="eliteSpeedSeg" id="speedSeg"></div>
          <div class="eliteAbsLine">ABS X <span id="absX">—</span> · Y <span id="absY">—</span> · Z <span id="absZ">—</span></div>
        </div>

        <div class="eliteSpeedRailWrap">
          <div class="eliteRailTop">FWD</div>
          <div class="eliteRailMid">0</div>
          <div class="eliteRailTag">RNG</div>
          <div class="eliteSpeedRail" id="speedRail" title="Arrastra para ajustar velocidad">
            <div class="eliteSpeedRailCenter"></div>
            <div class="eliteSpeedRailThumb" id="speedRailThumb"></div>
          </div>
          <div class="eliteRailBottom">REV</div>
        </div>
      </div>
    </div>
  `;

  const notesPanel = document.createElement('div');
  notesPanel.id = 'eliteHudNotes';
  notesPanel.className = 'elitePanel elitePaneHidden';
  notesPanel.innerHTML = `
    <div class="eliteHdr">
      <div class="eliteTitle">COMMS / NOTES</div>
      <div class="eliteHdrRight">
        <span class="dragHandle" id="dragNotes" title="Arrastra">⠿</span>
      </div>
    </div>
    <div class="eliteBody">
      <div class="eliteNotesTools">
        <button class="eliteBtn eliteBtnMini" id="btnNotesStamp" title="Inserta datos técnicos de la siguiente entrada">+DATA</button>
      </div>
      <textarea class="eliteNotes" id="hudNotesArea" placeholder="Notas… / comandos…"></textarea>
      <div class="eliteNotesComposer">
        <input class="eliteNotesInput" id="hudNotesInput" type="text" placeholder="Escribe la observación y pulsa Enter…">
        <button class="eliteBtn eliteBtnMini" id="btnNotesAppend" title="Añade la observación a la bitácora">ADD</button>
      </div>
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
    notesVisible: false,
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
  const btnNotesToggle = root.querySelector('#btnNotesToggle');
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
  const elAlt = root.querySelector('#hudAlt');
  const elAltMeta = root.querySelector('#hudAltMeta');
  const speedRail = root.querySelector('#speedRail');
  const speedRailThumb = root.querySelector('#speedRailThumb');
  const speedSeg = root.querySelector('#speedSeg');
  const notes = root.querySelector('#hudNotesArea');
  const notesInput = root.querySelector('#hudNotesInput');
  const btnNotesStamp = root.querySelector('#btnNotesStamp');
  const btnNotesAppend = root.querySelector('#btnNotesAppend');

  let pendingStampedEntry = false;

  function saveNotesValue() {
    try { localStorage.setItem(NOTES_KEY, notes.value); } catch (_) {}
  }

  function saveDraftValue() {
    try { localStorage.setItem(NOTES_DRAFT_KEY, notesInput?.value || ''); } catch (_) {}
  }

  function focusNotesEnd() {
    try {
      notes.focus();
      const end = notes.value.length;
      notes.setSelectionRange(end, end);
    } catch (_) {}
  }

  function appendRawToNotes(text, { focus = true } = {}) {
    if (!notes) return;
    const prefix = notes.value && !notes.value.endsWith('\n') ? '\n' : '';
    notes.value += `${prefix}${text}`;
    saveNotesValue();
    if (focus) focusNotesEnd();
  }

  function insertTelemetryEntry() {
    const stamp = buildTelemetryStamp({
      camera,
      floating,
      surfaceAltimeter,
      camCtrl,
      orbitAnchor,
    });
    appendRawToNotes(`${stamp}\n`, { focus: false });
    pendingStampedEntry = true;
    try { notesInput?.focus(); } catch (_) {}
  }

  function appendDraftNote() {
    const draft = String(notesInput?.value || '').trim();
    if (!draft) return;

    if (!pendingStampedEntry) {
      insertTelemetryEntry();
    }

    const endsWithObsPrompt = /OBS:\s*$/.test(notes.value);
    if (endsWithObsPrompt) {
      notes.value += `${draft}\n\n`;
    } else {
      const prefix = notes.value && !notes.value.endsWith('\n') ? '\n' : '';
      notes.value += `${prefix}OBS: ${draft}\n\n`;
    }

    pendingStampedEntry = false;
    notesInput.value = '';
    saveDraftValue();
    saveNotesValue();
    focusNotesEnd();
  }

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

  function setNotesVisible(on) {
    const wasHidden = notesPanel.classList.contains('elitePaneHidden');
    uiState.notesVisible = !!on;
    notesPanel.classList.toggle('elitePaneHidden', !uiState.notesVisible);
    if (btnNotesToggle) btnNotesToggle.classList.toggle('on', uiState.notesVisible);

    if (uiState.notesVisible) {
      try {
        const mainPos = getPanelPos(main);
        notesPanel.style.right = 'auto';
        notesPanel.style.top = 'auto';
        notesPanel.style.left = `${mainPos.left}px`;
        notesPanel.style.bottom = '8px';
        if (wasHidden) clampPanelIntoView(notesPanel);
      } catch (_) {}
    }
  }

  function toggleNotes() {
    if (window.innerWidth <= 760) return;
    setNotesVisible(!uiState.notesVisible);
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

  btnNotesToggle?.addEventListener('click', toggleNotes);
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
    const saved = localStorage.getItem(NOTES_KEY);
    if (saved != null) notes.value = saved;
    const savedDraft = localStorage.getItem(NOTES_DRAFT_KEY);
    if (savedDraft != null && notesInput) notesInput.value = savedDraft;

    notes.addEventListener('input', () => {
      saveNotesValue();
      pendingStampedEntry = /OBS:\s*$/.test(notes.value);
    });
    notes.addEventListener('keydown', (e) => e.stopPropagation());
    notes.addEventListener('keyup', (e) => e.stopPropagation());

    notesInput?.addEventListener('input', saveDraftValue);
    notesInput?.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        appendDraftNote();
      }
    });
    notesInput?.addEventListener('keyup', (e) => e.stopPropagation());
  } catch (_) {}

  btnNotesStamp?.addEventListener('click', insertTelemetryEntry);
  btnNotesAppend?.addEventListener('click', appendDraftNote);

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

    if (k === 'n') {
      ev.preventDefault?.();
      toggleNotes();
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
    const alt = surfaceAltimeter?.getState?.() || { visible: false, bodyName: '', meters: null };

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
      notes: !!uiState.notesVisible,
      absX: fmtAbs(absPos.x),
      absY: fmtAbs(absPos.y),
      absZ: fmtAbs(absPos.z),
      altVisible: !!alt.visible,
      altMeters: Number.isFinite(alt.meters) ? alt.meters.toFixed(1) : '—',
      altBody: String(alt.bodyName || ''),
      markerX: Number(hud.headingMarker?.xN || 0).toFixed(3),
      markerY: Number(hud.headingMarker?.yN || 0).toFixed(3),
      markerV: !!hud.headingMarker?.visible,
    });

    if (!force && signature === _lastHudSignature) return;
    _lastHudSignature = signature;

    if (modeInline) modeInline.textContent = mode === 'ship' ? 'K' : 'M';

    if (btnLabels) btnLabels.classList.toggle('on', !!uiState.labelsVisible);
    if (btnGrid) btnGrid.classList.toggle('on', !!uiState.gridVisible);
    if (btnNotesToggle) btnNotesToggle.classList.toggle('on', !!uiState.notesVisible);

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
    if (elAlt) elAlt.textContent = alt.visible ? fmtAlt(Number(alt.meters)) : '—';
    if (elAltMeta) elAltMeta.textContent = alt.visible ? `SURF ${alt.bodyName}` : 'SURF —';

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
      const dx = hud.headingMarker?.xN || 0;
      const dy = hud.headingMarker?.yN || 0;
      const separated = Math.abs(dx) > 0.035 || Math.abs(dy) > 0.035;
      const visible = mode === 'ship' && !!hud.headingMarker?.visible && separated;

      headingMark.style.display = visible ? '' : 'none';

      if (visible) {
        const left = clamp(50 + dx * 38, 8, 92);
        const top = clamp(50 + dy * 32, 8, 92);
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
    if (!notesPanel.classList.contains('elitePaneHidden')) {
      clampPanelIntoView(notesPanel);
    }
    const p = layout.panels || {};
    if (p.eliteHudMain) p.eliteHudMain = getPanelPos(main);
    if (p.eliteHudNotes && !notesPanel.classList.contains('elitePaneHidden')) {
      p.eliteHudNotes = getPanelPos(notesPanel);
    }
    saveLayout(layout);

    if (window.innerWidth <= 760) setNotesVisible(false);
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