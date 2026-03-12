// src/scene/gravity.js
// "Pseudo-gravedad" de cámara:
// - atrae suavemente hacia el cuerpo dominante cercano
// - arrastra la cámara con el desplazamiento orbital del cuerpo
//   para que "siga" al objeto cuando estás cerca
//
// No usa masa real; usa radio + distancia para una sensación estable.

export function createCameraBodyGravity({
  bodyMaps = [],
  padding = 0.0,
  allowedKinds = ['planet', 'moon', 'asteroid', 'comet'],
  influenceMul = 400.0,   // alcance extra = radiusWorld * influenceMul
  minInfluence = 1.25,    // alcance mínimo en unidades de escena
  carryFactor = 1.0,      // cuánto arrastra la traslación orbital del cuerpo
  pullMul = 400.0,        // fuerza base ≈ radiusWorld * pullMul
  minPullPerSec = 0.35,   // mínimo para cuerpos pequeños
  maxPullPerSec = 80.0,   // techo por estabilidad
  maxCarryDelta = 5000.0, // evita teleports raros si algo salta
}) {
  const EPS = 1e-8;
  const PAD = Number.isFinite(padding) ? padding : 0.0;
  const kinds = new Set(Array.isArray(allowedKinds) ? allowedKinds : ['planet', 'moon', 'asteroid', 'comet']);
  const prevCenters = new WeakMap(); // node -> Vector3
  let activeBody = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function eachBody(fn) {
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

  function applyBodyGravity(cam, dtSec) {
    if (!cam?.position) return null;
    dtSec = Number(dtSec) || 0;
    if (dtSec <= 0) return null;

    let best = null;

    eachBody((node, radiusWorld) => {
      const center = getNodeWorldPos(node);
      if (!center) return;

      const cx = center.x, cy = center.y, cz = center.z;

      let prev = prevCenters.get(node);
      if (!prev) {
        prev = new BABYLON.Vector3(cx, cy, cz);
        prevCenters.set(node, prev);
      }

      const dx = cx - cam.position.x;
      const dy = cy - cam.position.y;
      const dz = cz - cam.position.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      const d = Math.sqrt(Math.max(EPS, d2));

      const effectiveRadius = Math.max(EPS, radiusWorld + PAD);
      const influenceRadius = effectiveRadius + Math.max(minInfluence, radiusWorld * influenceMul);
      const surfaceGap = Math.max(0, d - effectiveRadius);

      if (d <= influenceRadius) {
        const normGap = surfaceGap / effectiveRadius;
        const stickyBias = (node === activeBody) ? 0.15 : 0.0;
        const score = normGap - stickyBias;

        if (!best || score < best.score) {
          best = {
            node,
            score,
            radiusWorld,
            effectiveRadius,
            influenceRadius,
            cx, cy, cz,
            px: prev.x, py: prev.y, pz: prev.z,
          };
        }
      }

      prev.copyFromFloats(cx, cy, cz);
    });

    if (!best) {
      activeBody = null;
      return null;
    }

    activeBody = best.node;

    // 1) Arrastre orbital: la cámara acompaña al cuerpo en su traslación.
    const bdx = best.cx - best.px;
    const bdy = best.cy - best.py;
    const bdz = best.cz - best.pz;
    const bodyDelta2 = bdx * bdx + bdy * bdy + bdz * bdz;
    if (carryFactor !== 0 && bodyDelta2 > EPS) {
      const bodyDelta = Math.sqrt(bodyDelta2);
      if (bodyDelta < maxCarryDelta) {
        cam.position.x += bdx * carryFactor;
        cam.position.y += bdy * carryFactor;
        cam.position.z += bdz * carryFactor;
      }
    }

    // 2) Atracción suave hacia el centro del cuerpo dominante.
    const dx = best.cx - cam.position.x;
    const dy = best.cy - cam.position.y;
    const dz = best.cz - cam.position.z;
    const d2 = dx * dx + dy * dy + dz * dz;
    const d = Math.sqrt(Math.max(EPS, d2));

    const surfaceGap = Math.max(0, d - best.effectiveRadius);
    const t = 1.0 - clamp(
      surfaceGap / Math.max(EPS, (best.influenceRadius - best.effectiveRadius)),
      0, 1
    );
    const strength = t * t;
    const pullPerSec = Math.min(
      maxPullPerSec,
      Math.max(minPullPerSec, best.radiusWorld * pullMul) * strength
    );

    if (pullPerSec > 0 && d > EPS) {
      const invD = 1.0 / d;
      const step = pullPerSec * dtSec;
      cam.position.x += dx * invD * step;
      cam.position.y += dy * invD * step;
      cam.position.z += dz * invD * step;
    }

    return {
      body: best.node,
      strength,
      influenceRadius: best.influenceRadius,
      effectiveRadius: best.effectiveRadius,
    };
  }

  return {
    applyBodyGravity,
    getActiveBody: () => activeBody,
  };
}