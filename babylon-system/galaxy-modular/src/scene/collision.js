// src/scene/collision.js
// Colisión de cámara contra cuerpos:
// - fallback esférico barato
// - si existe __terrainCollisionMesh en el bodyNode, usa la mesh procedural
//   del terreno para calcular el radio real en la dirección de la cámara
// - mantiene deslizamiento tangencial sobre la superficie
// - NO usa la bounding sphere gruesa para "pegarte" al suelo: solo para early-out

export function createCameraBodyCollision({
  bodyMaps = [],
  padding = 0.000002,
  allowedKinds = ['planet', 'moon', 'asteroid', 'comet'],
}) {
  const EPS = 1e-8;
  const PAD = Number.isFinite(padding) ? padding : 0.000002;
  const kinds = new Set(
    Array.isArray(allowedKinds) ? allowedKinds : ['planet', 'moon', 'asteroid', 'comet']
  );

  const _dir = new BABYLON.Vector3();
  const _prevDir = new BABYLON.Vector3();
  const _n = new BABYLON.Vector3();
  const _move = new BABYLON.Vector3();
  const _tan = new BABYLON.Vector3();
  const _candidate = new BABYLON.Vector3();
  const _ray = new BABYLON.Ray(BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 1, 0), 1);

  function eachCollisionBody(fn) {
    for (const map of bodyMaps) {
      if (!map || typeof map.values !== 'function') continue;

      for (const node of map.values()) {
        if (!node) continue;

        const md = node.metadata || {};
        if (!kinds.has(md.kind)) continue;

        const radiusWorld = Number(md.collisionRadiusWorld ?? md.radiusWorld);
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

  function normalizeFromCenterToPoint(center, point, out, fallbackPos = null) {
    out.x = point.x - center.x;
    out.y = point.y - center.y;
    out.z = point.z - center.z;

    let len = Math.sqrt(out.x * out.x + out.y * out.y + out.z * out.z);

    if (len < EPS && fallbackPos) {
      out.x = fallbackPos.x - center.x;
      out.y = fallbackPos.y - center.y;
      out.z = fallbackPos.z - center.z;
      len = Math.sqrt(out.x * out.x + out.y * out.y + out.z * out.z);
    }

    if (len < EPS) {
      out.set(0, 1, 0);
      return 0;
    }

    out.scaleInPlace(1 / len);
    return len;
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

  function projectOutsideToRef(center, dirNorm, minR, out) {
    out.x = center.x + dirNorm.x * minR;
    out.y = center.y + dirNorm.y * minR;
    out.z = center.z + dirNorm.z * minR;
  }

  function enforceBodyCollision(cam, prevPos = null) {
    if (!cam?.position) return false;

    let collided = false;

    eachCollisionBody((node, radiusWorld, md) => {
      const center = getNodeWorldPos(node);
      if (!center) return;

      const terrainMesh = md.__terrainCollisionMesh || null;

      // Early-out barato: solo evita raycasts cuando estás MUY lejos.
      // No debe provocar por sí solo el "pegado" al suelo.
      const coarseRadius = terrainMesh
        ? Number(terrainMesh.getBoundingInfo?.().boundingSphere?.radiusWorld || radiusWorld)
        : radiusWorld;

      const coarseMinR = coarseRadius + PAD;

      const camDx = cam.position.x - center.x;
      const camDy = cam.position.y - center.y;
      const camDz = cam.position.z - center.z;
      const camDist = Math.sqrt(camDx * camDx + camDy * camDy + camDz * camDz);

      let maybeNear = camDist < coarseMinR;
      if (!maybeNear && prevPos) {
        maybeNear = segmentHitsSphere(prevPos, cam.position, center, coarseMinR);
      }
      if (!maybeNear) return;

      // Radio exacto del terreno en la dirección actual
      const curLen = normalizeFromCenterToPoint(center, cam.position, _dir, prevPos || cam.position);
      const curShellRadius = terrainMesh
        ? getTerrainRadiusWorld(center, terrainMesh, _dir, radiusWorld)
        : radiusWorld;
      const curMinR = curShellRadius + PAD;

      // Y en la dirección previa, para sweep real
      let prevLen = curLen;
      let prevShellRadius = curShellRadius;
      let prevMinR = curMinR;

      if (prevPos) {
        prevLen = normalizeFromCenterToPoint(center, prevPos, _prevDir, cam.position);
        prevShellRadius = terrainMesh
          ? getTerrainRadiusWorld(center, terrainMesh, _prevDir, radiusWorld)
          : radiusWorld;
        prevMinR = prevShellRadius + PAD;
      }

      // Solo colisiona si realmente estás por debajo del shell real
      // o si en el segmento cruzas el shell real aproximado.
      let exactHit = curLen < curMinR;
      if (!exactHit && prevPos) {
        const segMinR = Math.max(curMinR, prevMinR);
        exactHit = segmentHitsSphere(prevPos, cam.position, center, segMinR);
      }
      if (!exactHit) return;

      collided = true;

      // Sin movimiento previo: clamp simple
      if (!prevPos) {
        projectOutsideToRef(center, _dir, curMinR, _candidate);
        cam.position.copyFrom(_candidate);
        return;
      }

      // Punto seguro sobre la superficie real usando la dirección previa
      projectOutsideToRef(center, _prevDir, prevMinR, _candidate);

      // Movimiento deseado del frame
      _move.x = cam.position.x - prevPos.x;
      _move.y = cam.position.y - prevPos.y;
      _move.z = cam.position.z - prevPos.z;

      // Normal superficial
      _n.x = _candidate.x - center.x;
      _n.y = _candidate.y - center.y;
      _n.z = _candidate.z - center.z;

      const nLen = Math.sqrt(_n.x * _n.x + _n.y * _n.y + _n.z * _n.z) || 1;
      _n.scaleInPlace(1 / nLen);

      // Conserva solo la parte tangencial (deslizamiento)
      const radialDot = (_move.x * _n.x) + (_move.y * _n.y) + (_move.z * _n.z);
      _tan.copyFrom(_move);

      if (radialDot < 0) {
        _tan.x -= _n.x * radialDot;
        _tan.y -= _n.y * radialDot;
        _tan.z -= _n.z * radialDot;
      }

      // Nueva posición deslizante
      cam.position.x = _candidate.x + _tan.x;
      cam.position.y = _candidate.y + _tan.y;
      cam.position.z = _candidate.z + _tan.z;

      // Clamp final exacto
      const afterLen = normalizeFromCenterToPoint(center, cam.position, _dir, prevPos);
      const afterShellRadius = terrainMesh
        ? getTerrainRadiusWorld(center, terrainMesh, _dir, radiusWorld)
        : radiusWorld;
      const afterMinR = afterShellRadius + PAD;

      if (afterLen < afterMinR) {
        projectOutsideToRef(center, _dir, afterMinR, _candidate);
        cam.position.copyFrom(_candidate);
      }
    });

    return collided;
  }

  return {
    enforceBodyCollision,
  };
}