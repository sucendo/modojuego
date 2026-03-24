// src/scene/localSurfaceFlight.js
// Maniobrabilidad local cerca de superficie:
// - detecta un marco local estable respecto al cuerpo cercano
// - proyecta el movimiento al plano tangente local + componente radial
// - suaviza la normal local para evitar vibración de ejes
// - separa mejor transición / modo local / alineación

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
  upMoveScale = 0.94,
  downMoveScale = 1.00,
  
  // Suavizado del cambio de marco y del delta aplicado
  moveBlendHz = 18.0,

  // Alineación de cámara/nave con el suelo local
  alignHz = 0.85,
  alignMix = 0.10,
  upSmoothingHz = 10.0,

  // Si vas rápido, todavía menos alineación
  alignSpeedFullKmS = 0.15,
  alignSpeedFadeKmS = 2.00,

  // Si estás girando activamente, reducimos aún más la autoalineación
  turnAlignFullRadS = 0.20,
  turnAlignFadeRadS = 1.20,
  turnAlignMinFactor = 0.25,
}) {
  const EPS = 1e-8;
  const kinds = new Set(
    Array.isArray(allowedKinds)
      ? allowedKinds
      : ['planet', 'moon', 'asteroid', 'comet']
  );

  const _move = new BABYLON.Vector3();
  const _up = new BABYLON.Vector3();
  const _rawUp = new BABYLON.Vector3();
  const _radial = new BABYLON.Vector3();
  const _tangent = new BABYLON.Vector3();
  const _correctedMove = new BABYLON.Vector3();
  const _targetMove = new BABYLON.Vector3();

  let lockedBody = null;
  let hadSurfaceFrame = false;
  const smoothedUp = new BABYLON.Vector3(0, 1, 0);
  const smoothedAppliedMove = new BABYLON.Vector3(0, 0, 0);

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

  function alphaFromHz(hz, dtSec) {
    return 1.0 - Math.exp(-Math.max(0, hz) * Math.max(0, dtSec));
  }

  function smoothUnitVectorToRef(from, to, alpha, out) {
    if (alpha >= 1.0) {
      out.copyFrom(to);
      out.normalize();
      return;
    }

    out.x = from.x + (to.x - from.x) * alpha;
    out.y = from.y + (to.y - from.y) * alpha;
    out.z = from.z + (to.z - from.z) * alpha;

    const lenSq = out.lengthSquared();
    if (lenSq < 1e-12) {
      out.copyFrom(to);
    }
    out.normalize();
  }

  function smoothVectorToRef(from, to, alpha, out) {
    if (alpha >= 1.0) {
      out.copyFrom(to);
      return;
    }
    out.x = from.x + (to.x - from.x) * alpha;
    out.y = from.y + (to.y - from.y) * alpha;
    out.z = from.z + (to.z - from.z) * alpha;
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
      const stickyBias = (node === lockedBody) ? 0.03 : 0.0;
      const score = normGap - moveInfluence * 0.10 - stickyBias;

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

  function turnAlignFactor(camCtrl) {
    const radS = Math.abs(Number(camCtrl?.getAngularMetrics?.()?.speedRadS ?? 0));
    const relaxed = inverseSmoothBand(radS, turnAlignFullRadS, turnAlignFadeRadS);
    return turnAlignMinFactor + ((1.0 - turnAlignMinFactor) * relaxed);
  }

  function apply(cam, camCtrl, prevPos, dtSec = 0) {
    if (!cam?.position || !prevPos) {
      lockedBody = null;
	  hadSurfaceFrame = false;
      return null;
    }
    if (camCtrl?.getMode?.() !== 'ship') {
      lockedBody = null;
	  hadSurfaceFrame = false;
      return null;
    }

    const target = chooseSurfaceBody(cam);
    if (!target) {
      lockedBody = null;
	  hadSurfaceFrame = false;
      return null;
    }

    const bodyChanged = lockedBody !== target.node;
    lockedBody = target.node;

    _rawUp.x = cam.position.x - target.center.x;
    _rawUp.y = cam.position.y - target.center.y;
    _rawUp.z = cam.position.z - target.center.z;

    const upLen = Math.sqrt(_rawUp.x * _rawUp.x + _rawUp.y * _rawUp.y + _rawUp.z * _rawUp.z);
    if (upLen < EPS) return null;
    _rawUp.scaleInPlace(1 / upLen);

    if (smoothedUp.lengthSquared() < 1e-10 || bodyChanged) {
      smoothedUp.copyFrom(_rawUp);
    } else {
      const upAlpha = alphaFromHz(upSmoothingHz, dtSec);
      smoothUnitVectorToRef(smoothedUp, _rawUp, upAlpha, smoothedUp);
    }

    _up.copyFrom(smoothedUp);

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

    // Mezcla real entre delta libre y delta corregido local.
    // Antes solo se mezclaban escalas, no el cambio de marco.
    _correctedMove.x = (_tangent.x * tangScale) + (_radial.x * radialScale);
    _correctedMove.y = (_tangent.y * tangScale) + (_radial.y * radialScale);
    _correctedMove.z = (_tangent.z * tangScale) + (_radial.z * radialScale);

    _targetMove.x = _move.x + ((_correctedMove.x - _move.x) * moveInf);
    _targetMove.y = _move.y + ((_correctedMove.y - _move.y) * moveInf);
    _targetMove.z = _move.z + ((_correctedMove.z - _move.z) * moveInf);

    const moveAlpha = alphaFromHz(moveBlendHz, dtSec);
    if (!hadSurfaceFrame || bodyChanged) {
      smoothedAppliedMove.copyFrom(_targetMove);
    } else {
      smoothVectorToRef(smoothedAppliedMove, _targetMove, moveAlpha, smoothedAppliedMove);
    }
    hadSurfaceFrame = true;

    cam.position.x = prevPos.x + smoothedAppliedMove.x;
    cam.position.y = prevPos.y + smoothedAppliedMove.y;
    cam.position.z = prevPos.z + smoothedAppliedMove.z;

    const alignInf = target.alignInfluence
      * speedAlignFactor(camCtrl)
      * turnAlignFactor(camCtrl)
      * alignMix;

    if (alignInf > 1e-4) {
      try {
        camCtrl?.stabilizeToLocalUp?.(_up, alignInf, dtSec, { alignHz });
      } catch (_) {}
    }

    return {
      ...target,
      localUp: _up.clone(),
      frameBlend: moveInf,
      isLocalFrame: moveInf >= 0.55,
    };
  }

  return {
    apply,
  };
}