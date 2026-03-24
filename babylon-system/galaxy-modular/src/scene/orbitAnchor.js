
export function createCameraOrbitAnchor({
  bodyMaps = [],
  allowedKinds = ['planet', 'moon', 'asteroid', 'comet'],
  captureMul = 60.0,
  stickyMul = 120.0,
  minCaptureGap = 0.03,
  influenceHz = 2.0,
  offsetFollowHz = 5.0,
  carryFactor = 1.0,

  // Mucho más suave cerca de superficie
  surfaceSpinFullMul = 0.005,
  surfaceSpinFadeMul = 0.06,
  minSurfaceSpinFullGap = 0.00005,
  minSurfaceSpinFadeGap = 0.002,
  surfaceSpinCarry = 0.12,
}) {
  const kinds = new Set(
    Array.isArray(allowedKinds)
      ? allowedKinds
      : ['planet', 'moon', 'asteroid', 'comet']
  );

  const prevCenters = new WeakMap();

  let lockedNode = null;
  let influence = 0.0;

  const smoothedOffset = new BABYLON.Vector3(0, 0, 0);
  const desiredOffset = new BABYLON.Vector3(0, 0, 0);
  const _currentOffset = new BABYLON.Vector3(0, 0, 0);
  const _rotatedOffset = new BABYLON.Vector3(0, 0, 0);
  const _rotatedSmoothed = new BABYLON.Vector3(0, 0, 0);
  const _rotM = new BABYLON.Matrix();

  function alphaFromHz(hz, dtSec) {
    return 1.0 - Math.exp(-Math.max(0, hz) * Math.max(0, dtSec));
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function smoothstep01(t) {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
  }

  function inverseSmoothBand(value, fullValue, fadeValue) {
    if (value <= fullValue) return 1.0;
    if (value >= fadeValue) return 0.0;
    const t = (value - fullValue) / Math.max(1e-8, (fadeValue - fullValue));
    return 1.0 - smoothstep01(t);
  }

  function computeSurfaceSpinFactor(radiusWorld, gap) {
    const fullGap = Math.max(minSurfaceSpinFullGap, radiusWorld * surfaceSpinFullMul);
    const fadeGap = Math.max(minSurfaceSpinFadeGap, radiusWorld * surfaceSpinFadeMul);
    return inverseSmoothBand(gap, fullGap, fadeGap);
  }

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

  function getWorldSpinAxis(node, localAxis) {
    const axis = localAxis || BABYLON.Axis.Y;
    try {
      const out = node?.getDirection?.(axis);
      if (out) return out.normalize();
    } catch (_) {}
    try {
      return axis.clone().normalize();
    } catch (_) {
      return new BABYLON.Vector3(0, 1, 0);
    }
  }

  function rotateVectorAroundAxisToRef(vec, axis, angle, out) {
    BABYLON.Matrix.RotationAxisToRef(axis, angle, _rotM);
    BABYLON.Vector3.TransformNormalToRef(vec, _rotM, out);
  }

  function chooseTarget(cam) {
    let best = null;

    eachBody((node, radiusWorld) => {
      const center = getNodeWorldPos(node);
      if (!center) return;

      const dx = cam.position.x - center.x;
      const dy = cam.position.y - center.y;
      const dz = cam.position.z - center.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const gap = Math.max(0, dist - radiusWorld);

      const captureGap = Math.max(minCaptureGap, radiusWorld * captureMul);
      const stickyGap = Math.max(captureGap * 2.0, radiusWorld * stickyMul);
      const limit = (node === lockedNode) ? stickyGap : captureGap;

      if (gap > limit) return;

      const score = gap + (node === lockedNode ? -0.01 : 0.0);
      if (!best || score < best.score) {
        best = { node, center, radiusWorld, gap, captureGap, stickyGap, score };
      }
    });

    return best;
  }

  function applyOrbitAnchor(cam, camCtrl, dtSec = 0, dtDays = 0, surfaceState = null) {
    if (!cam?.position) return null;

    if (camCtrl?.getMode?.() !== 'ship') {
      lockedNode = null;
      influence = 0.0;
      return null;
    }

    const target = chooseTarget(cam);

    if (!target) {
      const aOut = alphaFromHz(influenceHz, dtSec);
      influence += (0.0 - influence) * aOut;
      if (influence < 0.001) {
        influence = 0.0;
        lockedNode = null;
      }
      return null;
    }

    if (lockedNode !== target.node) {
      lockedNode = target.node;
      smoothedOffset.x = cam.position.x - target.center.x;
      smoothedOffset.y = cam.position.y - target.center.y;
      smoothedOffset.z = cam.position.z - target.center.z;
    }

    let prevCenter = prevCenters.get(target.node);
    if (!prevCenter) {
      prevCenter = target.center.clone();
      prevCenters.set(target.node, prevCenter);
    }

    const bodyDx = target.center.x - prevCenter.x;
    const bodyDy = target.center.y - prevCenter.y;
    const bodyDz = target.center.z - prevCenter.z;

    const aInf = alphaFromHz(influenceHz, dtSec);
    const t = 1.0 - Math.min(1.0, target.gap / Math.max(target.captureGap, 1e-8));
    const wantedInfluence = smoothstep01(t);
    influence += (wantedInfluence - influence) * aInf;

    // 1) Viajar con el cuerpo
    cam.position.x += bodyDx * carryFactor * influence;
    cam.position.y += bodyDy * carryFactor * influence;
    cam.position.z += bodyDz * carryFactor * influence;

    // 1b) Cerca de la superficie, solo una pequeña fracción del spin
    const md = target.node?.metadata || {};
    const spin = Number(md.spin);
    if (Number.isFinite(spin) && dtDays !== 0) {
      const surfaceSpinFactor = computeSurfaceSpinFactor(target.radiusWorld, target.gap) * influence;
      const angle = spin * dtDays * surfaceSpinFactor * surfaceSpinCarry;

      if (Math.abs(angle) > 1e-12) {
        const axisWorld = getWorldSpinAxis(target.node, md.spinAxis || BABYLON.Axis.Y);

        _currentOffset.x = cam.position.x - target.center.x;
        _currentOffset.y = cam.position.y - target.center.y;
        _currentOffset.z = cam.position.z - target.center.z;

        rotateVectorAroundAxisToRef(_currentOffset, axisWorld, angle, _rotatedOffset);
        cam.position.x = target.center.x + _rotatedOffset.x;
        cam.position.y = target.center.y + _rotatedOffset.y;
        cam.position.z = target.center.z + _rotatedOffset.z;

        rotateVectorAroundAxisToRef(smoothedOffset, axisWorld, angle, _rotatedSmoothed);
        smoothedOffset.copyFrom(_rotatedSmoothed);
      }
    }

    // 2) Movimiento libre alrededor del cuerpo, suavizado
    // En vuelo local/superficie evitamos el retardo artificial del ancla:
    // debe acompañar al cuerpo, no amortiguar la entrada del piloto.
    desiredOffset.x = cam.position.x - target.center.x;
    desiredOffset.y = cam.position.y - target.center.y;
    desiredOffset.z = cam.position.z - target.center.z;

    const surfaceBlend = clamp01(Number(surfaceState?.frameBlend) || 0);
    if (surfaceBlend >= 0.55) {
      smoothedOffset.copyFrom(desiredOffset);
    } else {
      const dynamicOffsetHz = offsetFollowHz + (22.0 * surfaceBlend);
      const aOff = alphaFromHz(dynamicOffsetHz, dtSec);
      smoothedOffset.x += (desiredOffset.x - smoothedOffset.x) * aOff;
      smoothedOffset.y += (desiredOffset.y - smoothedOffset.y) * aOff;
      smoothedOffset.z += (desiredOffset.z - smoothedOffset.z) * aOff;
    }

    const targetX = target.center.x + smoothedOffset.x;
    const targetY = target.center.y + smoothedOffset.y;
    const targetZ = target.center.z + smoothedOffset.z;

    cam.position.x += (targetX - cam.position.x) * influence;
    cam.position.y += (targetY - cam.position.y) * influence;
    cam.position.z += (targetZ - cam.position.z) * influence;

    prevCenter.copyFrom(target.center);
    return target;
  }

  function syncOffsetFromCamera(cam) {
    if (!lockedNode || !cam?.position) return;
    const center = getNodeWorldPos(lockedNode);
    if (!center) return;

    smoothedOffset.x = cam.position.x - center.x;
    smoothedOffset.y = cam.position.y - center.y;
    smoothedOffset.z = cam.position.z - center.z;

    desiredOffset.x = smoothedOffset.x;
    desiredOffset.y = smoothedOffset.y;
    desiredOffset.z = smoothedOffset.z;

    let prevCenter = prevCenters.get(lockedNode);
    if (!prevCenter) {
      prevCenter = center.clone();
      prevCenters.set(lockedNode, prevCenter);
    } else {
      prevCenter.copyFrom(center);
    }
  }
  
  function getBodyKey(node) {
    const md = node?.metadata || {};
    return String(md.bodyId || md.id || node?.name || '');
  }

  function findBodyById(bodyId) {
    if (!bodyId) return null;
    const wanted = String(bodyId);
    let found = null;

    eachBody((node) => {
      if (found) return;
      if (getBodyKey(node) === wanted) found = node;
    });

    return found;
  }

  function serializeState(cam) {
    if (!cam?.position) return null;

    let node = lockedNode;
    let center = node ? getNodeWorldPos(node) : null;

    // Si aún no estaba "locked", intenta usar el cuerpo candidato actual
    if (!node || !center) {
      const target = chooseTarget(cam);
      node = target?.node || null;
      center = target?.center || (node ? getNodeWorldPos(node) : null);
    }

    if (!node || !center) return null;

    const bodyId = getBodyKey(node);
    if (!bodyId) return null;

    return {
      version: 1,
      bodyId,
      offset: {
        x: cam.position.x - center.x,
        y: cam.position.y - center.y,
        z: cam.position.z - center.z,
      },
      influence: Number.isFinite(influence) ? influence : 1.0,
    };
  }

  function applySavedState(saved, cam) {
    if (!saved || !cam?.position) return false;

    const bodyId = String(saved.bodyId || '');
    const ox = Number(saved?.offset?.x);
    const oy = Number(saved?.offset?.y);
    const oz = Number(saved?.offset?.z);

    if (!bodyId || !Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(oz)) {
      return false;
    }

    const node = findBodyById(bodyId);
    if (!node) return false;

    const center = getNodeWorldPos(node);
    if (!center) return false;

    lockedNode = node;
    influence = clamp01(Number.isFinite(saved.influence) ? saved.influence : 1.0);

    smoothedOffset.copyFromFloats(ox, oy, oz);
    desiredOffset.copyFromFloats(ox, oy, oz);

    cam.position.copyFromFloats(
      center.x + ox,
      center.y + oy,
      center.z + oz,
    );

    let prevCenter = prevCenters.get(node);
    if (!prevCenter) {
      prevCenter = center.clone();
      prevCenters.set(node, prevCenter);
    } else {
      prevCenter.copyFrom(center);
    }

    return true;
  }

  function clearOrbitAnchor() {
    lockedNode = null;
    influence = 0.0;
  }

  return {
    applyOrbitAnchor,
    syncOffsetFromCamera,
    clearOrbitAnchor,
    getLockedBody: () => lockedNode,
    findBodyById,
    serializeState,
    applySavedState,
  };
}