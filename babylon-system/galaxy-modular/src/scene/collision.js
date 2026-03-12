// src/scene/collision.js
// Colisión esférica barata cámara vs cuerpos físicos.
// Usa los TransformNode físicos con metadata.radiusWorld y metadata.kind.
//
// Soporta:
// - planet
// - moon
// - asteroid
// - comet
//
// Incluye:
// - clamp si la cámara queda dentro
// - sweep segment->sphere para no "tunelar" a alta velocidad

export function createCameraBodyCollision({
  bodyMaps = [],
  padding = 0.00017,
  allowedKinds = ['planet', 'moon', 'asteroid', 'comet'],
}) {
  const EPS = 1e-8;
  const PAD = Number.isFinite(padding) ? padding : 0.00017;
  const kinds = new Set(Array.isArray(allowedKinds) ? allowedKinds : ['planet', 'moon', 'asteroid', 'comet']);

  function eachCollisionBody(fn) {
    for (const map of bodyMaps) {
      if (!map || typeof map.values !== 'function') continue;
      for (const node of map.values()) {
        if (!node) continue;
        const md = node.metadata || {};
        const kind = md.kind;
        if (!kinds.has(kind)) continue;

        const radiusWorld = Number(md.radiusWorld);
        if (!(radiusWorld > 0)) continue;

        fn(node, radiusWorld, md);
      }
    }
  }

  function getNodeWorldPos(node) {
    try { node.computeWorldMatrix?.(true); } catch (_) {}
    try {
      return (typeof node.getAbsolutePosition === 'function')
        ? node.getAbsolutePosition()
        : node.position;
    } catch (_) {
      return node.position;
    }
  }

  function projectOutside(cam, center, minR, fallbackPos = null) {
    let nx = cam.position.x - center.x;
    let ny = cam.position.y - center.y;
    let nz = cam.position.z - center.z;

    let n2 = nx * nx + ny * ny + nz * nz;
    if (n2 < EPS && fallbackPos) {
      nx = fallbackPos.x - center.x;
      ny = fallbackPos.y - center.y;
      nz = fallbackPos.z - center.z;
      n2 = nx * nx + ny * ny + nz * nz;
    }
    if (n2 < EPS) {
      nx = 0; ny = 1; nz = 0;
      n2 = 1;
    }

    const invLen = 1.0 / Math.sqrt(n2);
    cam.position.x = center.x + nx * invLen * minR;
    cam.position.y = center.y + ny * invLen * minR;
    cam.position.z = center.z + nz * invLen * minR;
  }

  function segmentHitsSphere(a, b, c, r) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const abz = b.z - a.z;
    const ab2 = abx * abx + aby * aby + abz * abz;
    if (ab2 < EPS) return false;

    const acx = c.x - a.x;
    const acy = c.y - a.y;
    const acz = c.z - a.z;

    let t = (acx * abx + acy * aby + acz * abz) / ab2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const qx = a.x + abx * t;
    const qy = a.y + aby * t;
    const qz = a.z + abz * t;

    const dx = qx - c.x;
    const dy = qy - c.y;
    const dz = qz - c.z;
    return (dx * dx + dy * dy + dz * dz) < (r * r);
  }

  function clearBuiltInCameraMotion(cam) {
    try { cam?.cameraDirection?.set?.(0, 0, 0); } catch (_) {}
  }

  function enforceBodyCollision(cam, prevPos = null) {
    if (!cam?.position) return false;

    let collided = false;

    eachCollisionBody((node, radiusWorld) => {
      const center = getNodeWorldPos(node);
      if (!center) return;

      const minR = radiusWorld + PAD;
      const minR2 = minR * minR;

      const dx = cam.position.x - center.x;
      const dy = cam.position.y - center.y;
      const dz = cam.position.z - center.z;
      const d2 = dx * dx + dy * dy + dz * dz;

      let hit = d2 < minR2;
      if (!hit && prevPos) {
        hit = segmentHitsSphere(prevPos, cam.position, center, minR);
      }
      if (!hit) return;

      projectOutside(cam, center, minR, prevPos);
      clearBuiltInCameraMotion(cam);
      collided = true;
    });

    return collided;
  }

  return {
    enforceBodyCollision,
  };
}