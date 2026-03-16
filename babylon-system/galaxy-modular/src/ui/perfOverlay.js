import { APP_CONFIG } from '../config/appConfig.js';

// ui/perfOverlay.js
// Tiny performance overlay (FPS + mesh counts + repMgr stats)

export function createPerfOverlay({ engine, scene, repMgr, camera, opts = {} }) {
  const intervalMs = (typeof opts.intervalMs === 'number') ? opts.intervalMs : APP_CONFIG.perfOverlay.intervalMs;

  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.right = '12px';
  el.style.top = '12px';
  el.style.zIndex = '9999';
  el.style.padding = '8px 10px';
  el.style.borderRadius = '10px';
  el.style.background = 'rgba(0,0,0,.45)';
  el.style.border = '1px solid rgba(255,255,255,.12)';
  el.style.backdropFilter = 'blur(6px)';
  el.style.color = '#cfe6ff';
  el.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  el.style.fontSize = '12px';
  el.style.whiteSpace = 'pre';
  el.style.pointerEvents = 'none';

  let visible = (typeof opts.visible === 'boolean') ? opts.visible : APP_CONFIG.perfOverlay.visible;
  el.style.display = visible ? 'block' : 'none';

  document.body.appendChild(el);

  function safeNum(n, d = 0) {
    n = Number(n);
    return Number.isFinite(n) ? n : d;
  }

  function meshCounts() {
    const meshes = scene?.meshes || [];
    let enabled = 0;
    let visibleCnt = 0;
    for (let i = 0; i < meshes.length; i++) {
      const m = meshes[i];
      if (!m || m.isDisposed?.()) continue;
      const en = (typeof m.isEnabled === 'function') ? m.isEnabled() : (m.isVisible !== false);
      if (en) enabled++;
      if (en && m.isVisible !== false) visibleCnt++;
    }
    return { total: meshes.length, enabled, visible: visibleCnt };
  }

  function update() {
    if (!visible) return;

    const fps = safeNum(engine?.getFps?.(), 0);

    const mc = meshCounts();

    // Babylon has these, but they can be 0 depending on engine mode.
    const verts = safeNum(engine?.getTotalVertices?.(), 0);
    const activeParticles = safeNum(scene?.getActiveParticleSystems?.()?.length, 0);

    const st = (repMgr && typeof repMgr.getStats === 'function') ? repMgr.getStats() : null;

    const camPos = camera?.globalPosition || camera?.position;

    let text = '';
    text += `FPS: ${fps.toFixed(0)}\n`;
    text += `Meshes: ${mc.enabled}/${mc.total} (vis ${mc.visible})\n`;
    if (verts) text += `Verts: ${Math.round(verts / 1000)}k\n`;
    if (activeParticles) text += `Particles: ${activeParticles}\n`;

    if (camPos) {
      text += `Cam: ${camPos.x.toFixed(1)}, ${camPos.y.toFixed(1)}, ${camPos.z.toFixed(1)}\n`;
    }

    if (st) {
      const s = st.states || {};
      text += `Entities: ${st.total}\n`;
      text += `LOD: dot ${s.dot || 0} | low ${s.sphere_low || 0} | high ${s.sphere_high || 0} | none ${s.none || 0}\n`;
      text += `Eval: ${st.lastEvalProcessed} ent, ${st.lastEvalTransitions} swap, ${st.lastEvalMs.toFixed(2)} ms\n`;
    }

    el.textContent = text;
  }

  const timer = setInterval(update, intervalMs);

  function toggle() {
    visible = !visible;
    el.style.display = visible ? 'block' : 'none';
  }

  const toggleKeys = new Set(APP_CONFIG.perfOverlay.toggleKeys || ['F3', 'KeyP']);
  window.addEventListener('keydown', (ev) => {
    if (toggleKeys.has(ev.code) || toggleKeys.has(ev.key)) {
      toggle();
    }
  });

  return {
    el,
    update,
    dispose: () => {
      try { clearInterval(timer); } catch (_) {}
      try { el.remove(); } catch (_) {}
    },
    toggle,
  };
}
