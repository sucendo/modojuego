// scene/collision.js
// Paso 5: extraer colisión esférica barata de cámara contra planetas/lunas

export function createCameraPlanetCollision({ bodies, padding = 0.9 }) {
  const CAM_COLLISION_PADDING = padding;

  function enforcePlanetCollision(cam) {
    if (!cam) return;
    const p = cam.position;

    for (const [, b] of bodies.entries()) {
      if (!b || !b.farMesh || !b.def || !b.def.radius) continue;
      if (b.def.kind !== "planet" && b.def.kind !== "moon") continue;

      const c = b.farMesh.getAbsolutePosition();
      const dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z;
      const d2 = dx * dx + dy * dy + dz * dz;

      const minR = (b.def.radius + CAM_COLLISION_PADDING);
      const minR2 = minR * minR;

      // early out si lejos
      if (d2 > (minR2 + 2500)) continue;

      if (d2 < minR2) {
        const d = Math.max(0.0001, Math.sqrt(d2));
        const inv = 1.0 / d;
        cam.position.x = c.x + dx * inv * minR;
        cam.position.y = c.y + dy * inv * minR;
        cam.position.z = c.z + dz * inv * minR;
      }
    }
  }

  return { enforcePlanetCollision };
}