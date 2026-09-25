// HEXATEGOS 0.33 · zoom táctil hasta 40×
(() => {
  if (typeof canvas === 'undefined' || !canvas) return;

  canvas.addEventListener('pointermove', e => {
    if (typeof pointers === 'undefined' || pointers.size !== 2) return;
    const p = pointers.get(e.pointerId);
    if (!p) return;

    // El handler principal ya ha actualizado la posición de los dos punteros.
    // Recalculamos después con el mismo gesto, pero usando el máximo global 40×
    // en lugar del antiguo límite táctil de 24×.
    const a = [...pointers.values()];
    const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    const maxZoom = (typeof ZOOM_MAX3232 !== 'undefined') ? ZOOM_MAX3232 : 40;
    const nextZoom = Math.max(.62, Math.min(maxZoom, pinchZoom * (d / Math.max(20, pinchStart))));

    if (nextZoom !== zoom) {
      zoom = nextZoom;
      try { showZoom3232(); } catch (_) {}
      needsRender = true;
    }
  }, { passive: true });
})();
