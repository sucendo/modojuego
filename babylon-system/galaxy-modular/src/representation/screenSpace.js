// representation/screenSpace.js
// Screen-space helpers for pixel-based LOD decisions.

export function computePxPerUnit({ engine, camera, distance }) {
  if (!engine || !camera) return 0;
  const d = Number(distance);
  if (!Number.isFinite(d) || d <= 1e-9) return 0;

  const vh = engine.getRenderHeight(true);
  const fov = (typeof camera.fov === 'number') ? camera.fov : 0.8;
  const tanHalf = Math.tan(fov * 0.5);
  if (!Number.isFinite(tanHalf) || tanHalf <= 1e-9) return 0;

  // pixels per world-unit at a given distance
  return (vh / (2 * tanHalf)) / d;
}

export function computeDiameterPx({ engine, camera, worldPos, radiusWorld }) {
  if (!engine || !camera || !worldPos) return 0;
  const r = Number(radiusWorld);
  if (!Number.isFinite(r) || r <= 0) return 0;

  const camPos = camera.globalPosition || camera.position;
  const dx = worldPos.x - camPos.x;
  const dy = worldPos.y - camPos.y;
  const dz = worldPos.z - camPos.z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const pxPerUnit = computePxPerUnit({ engine, camera, distance: d });
  if (pxPerUnit <= 0) return 0;

  return (2 * r) * pxPerUnit;
}

export function computeDotWorldScale({ minPx, pxPerUnit }) {
  const mp = Number(minPx);
  const ppu = Number(pxPerUnit);
  if (!Number.isFinite(mp) || mp <= 0) return 1;
  if (!Number.isFinite(ppu) || ppu <= 1e-9) return 1;
  return mp / ppu;
}
