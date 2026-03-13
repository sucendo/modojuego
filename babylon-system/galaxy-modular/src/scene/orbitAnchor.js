
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

  function applyOrbitAnchor(cam, camCtrl, dtSec = 0, dtDays = 0) {
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
    desiredOffset.x = cam.position.x - target.center.x;
    desiredOffset.y = cam.position.y - target.center.y;
    desiredOffset.z = cam.position.z - target.center.z;

    const aOff = alphaFromHz(offsetFollowHz, dtSec);
    smoothedOffset.x += (desiredOffset.x - smoothedOffset.x) * aOff;
    smoothedOffset.y += (desiredOffset.y - smoothedOffset.y) * aOff;
    smoothedOffset.z += (desiredOffset.z - smoothedOffset.z) * aOff;

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
  };
}