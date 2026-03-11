// ui/systemDots.js
// Escala los dots de sistemas para que no bajen de X píxeles en pantalla.

export function createSystemDotScaler({ engine, camera, systemNodes, opts = {} }) {
  const minPx = (Number.isFinite(opts.minPx) && opts.minPx > 0) ? opts.minPx : 2.0;
  const throttleMs = (Number.isFinite(opts.throttleMs) && opts.throttleMs >= 0) ? opts.throttleMs : 80;
  let lastT = 0;

  function update() {
    if (!engine || !camera || !systemNodes?.length) return;

    if (throttleMs > 0) {
      const now = performance.now();
      if ((now - lastT) < throttleMs) return;
      lastT = now;
    }

    const vh = engine.getRenderHeight(true);
    const fov = (typeof camera.fov === 'number') ? camera.fov : 0.8;
    const tanHalf = Math.tan(fov * 0.5);
    const camPos = camera.globalPosition || camera.position;

    for (const it of systemNodes) {
      const dot = it?.dot;
      if (!dot) continue;
      const wpos = dot.getAbsolutePosition();
      const d = BABYLON.Vector3.Distance(camPos, wpos);
      const pxPerUnit = (vh / (2 * tanHalf)) / Math.max(1e-6, d);
      const wantUnits = Math.max(1e-4, minPx / Math.max(1e-9, pxPerUnit));
      dot.scaling.setAll(wantUnits);
    }
  }

  return { update };
}