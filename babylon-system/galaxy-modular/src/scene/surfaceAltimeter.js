// src/scene/surfaceAltimeter.js
// Altímetro de superficie sin HUD propio.
// Calcula altura sobre el terreno en metros y deja el estado listo
// para que lo consuma eliteHud.js.

export function createSurfaceAltimeter({
  camera,
  bodyMaps = [],
  allowedKinds = ['planet', 'moon', 'asteroid', 'comet'],
  showFadeMul = 0.40,
  minShowGap = 0.002,
  throttleMs = 80,
}) {
  const kinds = new Set(
    Array.isArray(allowedKinds)
      ? allowedKinds
      : ['planet', 'moon', 'asteroid', 'comet']
  );

  const _dir = new BABYLON.Vector3();
  const _ray = new BABYLON.Ray(BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 1, 0), 1);

  let lastT = 0;
  let state = {
    visible: false,
    bodyName: '',
    meters: null,
    kilometers: null,
  };

  function eachBody(fn) {
    for (const map of bodyMaps) {
      if (!map || typeof map.values !== 'function') continue;
      for (const node of map.values()) {
        if (!node) continue;
        const md = node.metadata || {};
        if (!kinds.has(md.kind)) continue;
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

  function normalizeFromCenter(center, point, out) {
    out.x = point.x - center.x;
    out.y = point.y - center.y;
    out.z = point.z - center.z;
    const len = Math.sqrt(out.x * out.x + out.y * out.y + out.z * out.z);
    if (len < 1e-12) {
      out.set(0, 1, 0);
      return 0;
    }
    out.scaleInPlace(1 / len);
    return len;
  }

  function getTerrainRadiusWorld(center, terrainMesh, dirNorm, fallbackRadius) {
    if (!terrainMesh) return fallbackRadius;

    try {
      if (!terrainMesh.isEnabled?.()) return fallbackRadius;
    } catch (_) {}

    const scene = terrainMesh.getScene?.();
    if (!scene || typeof scene.pickWithRay !== 'function') return fallbackRadius;

    _ray.origin.x = center.x;
    _ray.origin.y = center.y;
    _ray.origin.z = center.z;

    _ray.direction.x = dirNorm.x;
    _ray.direction.y = dirNorm.y;
    _ray.direction.z = dirNorm.z;

    _ray.length = Math.max(fallbackRadius * 4.0, 1.0);

    try {
      const pick = scene.pickWithRay(_ray, (m) => m === terrainMesh, false);
      if (pick?.hit && pick.pickedPoint) {
        const px = pick.pickedPoint.x - center.x;
        const py = pick.pickedPoint.y - center.y;
        const pz = pick.pickedPoint.z - center.z;
        const r = Math.sqrt(px * px + py * py + pz * pz);
        if (Number.isFinite(r) && r > 0) return r;
      }
    } catch (_) {}

    return fallbackRadius;
  }

  function chooseBody() {
    let best = null;

    eachBody((node, radiusWorld, md) => {
      const center = getNodeWorldPos(node);
      if (!center) return;

      const dx = camera.position.x - center.x;
      const dy = camera.position.y - center.y;
      const dz = camera.position.z - center.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const gap = Math.max(0, dist - radiusWorld);

      const showGap = Math.max(minShowGap, radiusWorld * showFadeMul);
      if (gap > showGap) return;

      if (!best || gap < best.gap) {
        best = { node, center, radiusWorld, gap, md };
      }
    });

    return best;
  }

  function update() {
    const now = performance.now();
    if ((now - lastT) < throttleMs) return state;
    lastT = now;

    const best = chooseBody();
    if (!best) {
      state = {
        visible: false,
        bodyName: '',
        meters: null,
        kilometers: null,
      };
      return state;
    }

    const dist = normalizeFromCenter(best.center, camera.position, _dir);
    const terrainMesh = best.md.__terrainCollisionMesh || null;
    const shellRadius = getTerrainRadiusWorld(best.center, terrainMesh, _dir, best.radiusWorld);

    const kmPerUnit = Number(best.md.kmPerUnit || 10000000);
    const meters = Math.max(0, (dist - shellRadius) * kmPerUnit * 1000);

    state = {
      visible: true,
      bodyName: String(best.md.bodyId || best.node.name || 'cuerpo'),
      meters,
      kilometers: meters / 1000,
    };

    return state;
  }

  function getState() {
    return state;
  }

  return {
    update,
    getState,
  };
}