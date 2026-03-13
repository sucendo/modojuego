// src/scene/localSurfaceFlight.js
// Movimiento planetario local:
// - cerca de un cuerpo grande, separa movimiento tangencial + radial
// - el efecto de movimiento entra antes que la alineación de cámara
// - subir cuesta algo más, pero no exagerado
// - bajar cuesta algo menos
// - el cabeceo/align al suelo local es MUCHO más suave y solo muy cerca

export function createLocalSurfaceFlight({
  bodyMaps = [],
  allowedKinds = ['planet', 'moon', 'asteroid', 'comet'],

  // Influencia sobre el MOVIMIENTO (entra relativamente pronto)
  moveFullMul = 0.002,
  moveFadeMul = 0.05,
  minMoveFullGap = 0.00001,
  minMoveFadeGap = 0.00015,

  // Influencia sobre la ALINEACIÓN/CABEZCEO (entra mucho más tarde)
  alignFullMul = 0.0005,
  alignFadeMul = 0.008,
  minAlignFullGap = 0.000003,
  minAlignFadeGap = 0.00003,

  // Escalas de movimiento
  tangentMoveScale = 1.00,
  upMoveScale = 0.88,
  downMoveScale = 1.03,

  // Alineación de cámara/nave con el suelo local
  alignHz = 0.60,
  alignMix = 0.14,

  // Si vas rápido, todavía menos alineación
  alignSpeedFullKmS = 0.15,
  alignSpeedFadeKmS = 2.00,
}) {
  const EPS = 1e-8;
  const kinds = new Set(
    Array.isArray(allowedKinds)
      ? allowedKinds
      : ['planet', 'moon', 'asteroid', 'comet']
  );

  const _move = new BABYLON.Vector3();
  const _up = new BABYLON.Vector3();
  const _radial = new BABYLON.Vector3();
  const _tangent = new BABYLON.Vector3();

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

  function chooseSurfaceBody(cam) {
    let best = null;

    eachBody((node, radiusWorld) => {
      const center = getNodeWorldPos(node);
      if (!center) return;

      const dx = cam.position.x - center.x;
      const dy = cam.position.y - center.y;
      const dz = cam.position.z - center.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const gap = Math.max(0, dist - radiusWorld);

      const moveFullGap = Math.max(minMoveFullGap, radiusWorld * moveFullMul);
      const moveFadeGap = Math.max(minMoveFadeGap, radiusWorld * moveFadeMul);
      if (gap > moveFadeGap) return;

      const moveInfluence = inverseSmoothBand(gap, moveFullGap, moveFadeGap);

      const alignFullGap = Math.max(minAlignFullGap, radiusWorld * alignFullMul);
      const alignFadeGap = Math.max(minAlignFadeGap, radiusWorld * alignFadeMul);
      const alignInfluence = inverseSmoothBand(gap, alignFullGap, alignFadeGap);

      const normGap = gap / Math.max(radiusWorld, EPS);
      const score = normGap - moveInfluence * 0.10;

      if (!best || score < best.score) {
        best = {
          node,
          center,
          radiusWorld,
          gap,
          moveInfluence,
          alignInfluence,
          score,
        };
      }
    });

    return best;
  }

  function speedAlignFactor(camCtrl) {
    const kmS = Math.abs(Number(camCtrl?.getSpeedMetrics?.()?.currentKmS ?? 0));
    return inverseSmoothBand(kmS, alignSpeedFullKmS, alignSpeedFadeKmS);
  }

  function apply(cam, camCtrl, prevPos, dtSec = 0) {
    if (!cam?.position || !prevPos) return null;
    if (camCtrl?.getMode?.() !== 'ship') return null;

    const target = chooseSurfaceBody(cam);
    if (!target) return null;

    _up.x = cam.position.x - target.center.x;
    _up.y = cam.position.y - target.center.y;
    _up.z = cam.position.z - target.center.z;

    const upLen = Math.sqrt(_up.x * _up.x + _up.y * _up.y + _up.z * _up.z);
    if (upLen < EPS) return null;
    _up.scaleInPlace(1 / upLen);

    _move.x = cam.position.x - prevPos.x;
    _move.y = cam.position.y - prevPos.y;
    _move.z = cam.position.z - prevPos.z;

    const radialDot = (_move.x * _up.x) + (_move.y * _up.y) + (_move.z * _up.z);

    _radial.x = _up.x * radialDot;
    _radial.y = _up.y * radialDot;
    _radial.z = _up.z * radialDot;

    _tangent.x = _move.x - _radial.x;
    _tangent.y = _move.y - _radial.y;
    _tangent.z = _move.z - _radial.z;

    const moveInf = target.moveInfluence;

    const tangScale = 1.0 + (tangentMoveScale - 1.0) * moveInf;
    const upScale = 1.0 + (upMoveScale - 1.0) * moveInf;
    const downScale = 1.0 + (downMoveScale - 1.0) * moveInf;
    const radialScale = (radialDot >= 0) ? upScale : downScale;

    cam.position.x = prevPos.x + (_tangent.x * tangScale) + (_radial.x * radialScale);
    cam.position.y = prevPos.y + (_tangent.y * tangScale) + (_radial.y * radialScale);
    cam.position.z = prevPos.z + (_tangent.z * tangScale) + (_radial.z * radialScale);

    // Alineación suave y solo muy cerca + despacio
    const alignInf = target.alignInfluence * speedAlignFactor(camCtrl) * alignMix;
    if (alignInf > 1e-4) {
      try {
        camCtrl?.stabilizeToLocalUp?.(_up, alignInf, dtSec, { alignHz });
      } catch (_) {}
    }

    return target;
  }

  return {
    apply,
  };
}