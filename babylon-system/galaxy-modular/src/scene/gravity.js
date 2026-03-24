// src/scene/gravity.js
// Gravedad local simplificada para vuelo de superficie:
// - solo actúa respecto al cuerpo local activo
// - aplica aceleración radial suave hacia el centro
// - compensa gran parte de la caída cerca de superficie (flight assist vertical)
// - no introduce física multibody ni órbitas reales
// - mantiene el coste muy bajo y evita pelearse con la maniobrabilidad local

export function createLocalBodyGravity({
  // Aceleración radial base (pseudo-física jugable, no masa real)
  accelMul = 0.020,
  minAccel = 0.0000005,
  maxAccel = 0.000040,

  // Assist vertical: cerca del suelo compensa casi toda la caída.
  assistNear = 0.985,
  assistFar = 0.0,
  assistFullMul = 0.0012,
  assistFadeMul = 0.040,
  minAssistFullGap = 0.000008,
  minAssistFadeGap = 0.00015,

  // Estabilidad radial
  radialDampingNear = 12.0,
  radialDampingFar = 1.5,
  groundClampMul = 0.00030,
  minGroundClampGap = 0.000004,
  maxFallSpeed = 0.0000045,
} = {}) {
  const EPS = 1e-8;
  const _up = new BABYLON.Vector3(0, 1, 0);
  let lockedBody = null;
  let radialVel = 0.0; // signed speed along local up; < 0 means falling toward the body

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function clamp01(v) { return clamp(v, 0, 1); }
  function smoothstep01(t) {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
  }
  function alphaFromHz(hz, dtSec) {
    return 1.0 - Math.exp(-Math.max(0, hz) * Math.max(0, dtSec));
  }
  function lerp(a, b, t) { return a + ((b - a) * t); }

  function getNodeWorldPos(node) {
    if (!node) return null;
    try { node.computeWorldMatrix?.(true); } catch (_) {}
    try {
      return (typeof node.getAbsolutePosition === 'function')
        ? node.getAbsolutePosition()
        : node.position;
    } catch (_) {
      return node.position;
    }
  }

  function reset() {
    lockedBody = null;
    radialVel = 0.0;
  }

  function apply(cam, dtSec, surfaceState = null) {
    if (!cam?.position) {
      reset();
      return null;
    }

    dtSec = Number(dtSec) || 0;
    if (dtSec <= 0) return null;

    const targetNode = surfaceState?.node || surfaceState?.body || null;
    if (!targetNode) {
      reset();
      return null;
    }

    const center = getNodeWorldPos(targetNode);
    if (!center) {
      reset();
      return null;
    }

    const radiusWorld = Math.max(EPS, Number(surfaceState?.radiusWorld) || 0);
    if (!(radiusWorld > 0)) {
      reset();
      return null;
    }

    const bodyChanged = lockedBody !== targetNode;
    lockedBody = targetNode;

    _up.x = cam.position.x - center.x;
    _up.y = cam.position.y - center.y;
    _up.z = cam.position.z - center.z;
    const dist = Math.sqrt((_up.x * _up.x) + (_up.y * _up.y) + (_up.z * _up.z));
    if (!(dist > EPS)) return null;
    _up.scaleInPlace(1.0 / dist);

    const gap = Math.max(0, dist - radiusWorld);

    const assistFullGap = Math.max(minAssistFullGap, radiusWorld * assistFullMul);
    const assistFadeGap = Math.max(minAssistFadeGap, radiusWorld * assistFadeMul);
    const assistT = clamp01((gap - assistFullGap) / Math.max(EPS, assistFadeGap - assistFullGap));
    const assistBlend = smoothstep01(assistT);
    const assistFactor = lerp(assistNear, assistFar, assistBlend);

    const surfaceAccel = clamp(radiusWorld * accelMul, minAccel, maxAccel);
    const gravityAccel = surfaceAccel * Math.max(0, 1.0 - assistFactor);

    const dampingHz = lerp(radialDampingNear, radialDampingFar, assistBlend);
    const dampAlpha = alphaFromHz(dampingHz, dtSec);

    if (bodyChanged) {
      radialVel = Math.min(0.0, radialVel * 0.25);
    }

    radialVel -= gravityAccel * dtSec;
    radialVel += (0.0 - radialVel) * dampAlpha;

    const groundClampGap = Math.max(minGroundClampGap, radiusWorld * groundClampMul);
    if (gap <= groundClampGap && radialVel < 0) {
      radialVel *= Math.exp(-18.0 * dtSec);
      if (Math.abs(radialVel) < 1e-7) radialVel = 0.0;
    }

    if (radialVel < 0) {
      radialVel = Math.max(radialVel, -Math.max(0, maxFallSpeed));
    }

    const radialDelta = radialVel * dtSec;
    if (Math.abs(radialDelta) > 0) {
      cam.position.x += _up.x * radialDelta;
      cam.position.y += _up.y * radialDelta;
      cam.position.z += _up.z * radialDelta;
    }

    return {
      node: targetNode,
      center,
      radiusWorld,
      gap,
      localUp: _up.clone(),
      assistFactor,
      gravityAccel,
      radialVel,
      radialDelta,
    };
  }

  return {
    apply,
    reset,
    getLockedBody: () => lockedBody,
    getRadialVelocity: () => radialVel,
  };
}

// Alias de compatibilidad por si en algún momento se había referenciado
// el nombre antiguo del experimento de pseudo-gravedad.
export const createCameraBodyGravity = createLocalBodyGravity;