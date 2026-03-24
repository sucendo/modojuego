// bodies/orbitAnimator.js
// Anima órbitas y rotaciones.

import { ensureSimMeta, setSimLocalU, setSimAbsKm } from '../sim/universeState.js';

export function updateOrbits(planetSystems, simDays, dtDays = 0) {
  if (!Array.isArray(planetSystems)) return;
  simDays = Number(simDays) || 0;
  dtDays = Number(dtDays) || 0;
  
  const TAU = Math.PI * 2;

  function num(v, fb = 0) {
    return Number.isFinite(Number(v)) ? Number(v) : fb;
  }
  function v3obj(v) {
    return {
      x: num(v?.x, 0),
      y: num(v?.y, 0),
      z: num(v?.z, 0),
    };
  }
  function getNodeAbsSceneU(node) {
    if (!node) return { x: 0, y: 0, z: 0 };
    try { node.computeWorldMatrix?.(true); } catch (_) {}
    const p = (typeof node.getAbsolutePosition === 'function') ? node.getAbsolutePosition() : node.position;
    return v3obj(p);
  }
  function getOrbitParentNode(orbitNode, bodyMesh) {
    return orbitNode?.parent?.parent || bodyMesh?.parent?.parent?.parent || bodyMesh?.parent?.parent || null;
  }
  function getAbsKm(node) {
    const sim = ensureSimMeta(node);
    return sim?.absKm ? v3obj(sim.absKm) : { x: 0, y: 0, z: 0 };
  }
  function syncBodySim(node, tDays, parentNode, parentAbsKm) {
    if (!node) return v3obj(parentAbsKm);
    const md = node.metadata || {};
    const kmPerUnit = num(md.kmPerUnit, 1e6);
    const localU = v3obj(node.position);
    const nodeAbsU = getNodeAbsSceneU(node);
    const parentAbsU = parentNode ? getNodeAbsSceneU(parentNode) : { x: 0, y: 0, z: 0 };
    const relU = {
      x: nodeAbsU.x - parentAbsU.x,
      y: nodeAbsU.y - parentAbsU.y,
      z: nodeAbsU.z - parentAbsU.z,
    };
    ensureSimMeta(node, { kmPerUnit });
    setSimLocalU(node, localU, tDays);
    const absKm = {
      x: num(parentAbsKm?.x, 0) + (relU.x * kmPerUnit),
      y: num(parentAbsKm?.y, 0) + (relU.y * kmPerUnit),
      z: num(parentAbsKm?.z, 0) + (relU.z * kmPerUnit),
    };
    setSimAbsKm(node, absKm, tDays);
    return absKm;
  }

  function normAngle(a) {
    a = a % TAU;
    if (a < 0) a += TAU;
    return a;
  }

  // Kepler solver: E - e sin E = M
  function solveKeplerE(M, e) {
    M = normAngle(M);
    e = Math.max(0, Math.min(0.999999, e || 0));
    let E = (e < 0.8) ? M : Math.PI;
    for (let i = 0; i < 8; i++) {
      const f = E - e * Math.sin(E) - M;
      const fp = 1 - e * Math.cos(E);
      E = E - f / Math.max(1e-8, fp);
    }
    return E;
  }

  function applyOrbitPosition(orbitNode, bodyMesh) {
    const md = orbitNode?.metadata;
    if (!md) return;
    const a = Number(md.aU);
    const e = Number(md.e);
    const M = Number(md.mean);
    if (!Number.isFinite(a) || !Number.isFinite(e) || !Number.isFinite(M)) return;

    // PERF: circular fast-path (avoids Kepler iterations)
    let r = a;
    let nu = normAngle(M);
    if (Math.abs(e) >= 1e-4) {
      const E = solveKeplerE(M, e);
      const cosE = Math.cos(E);
      r = a * (1 - e * cosE);

      // True anomaly (cache sqrt terms per orbit)
      if (md._eCache !== e) {
        md._eCache = e;
        md._sq1pe = Math.sqrt(1 + e);
        md._sq1me = Math.sqrt(1 - e);
      }
      const sq1pe = md._sq1pe;
      const sq1me = md._sq1me;
      nu = 2 * Math.atan2(sq1pe * Math.sin(E * 0.5), sq1me * Math.cos(E * 0.5));
    }

    const x = r * Math.cos(nu);
    const z = r * Math.sin(nu);

    // En coords del plano orbital local (orbitArg ya contiene ω)
    if (bodyMesh) bodyMesh.position.set(x, 0, z);
    else orbitNode.position.set(x, 0, z);
  }

  function stepOrbitAbs(orbitNode, bodyMesh, tDays) {
    const md = orbitNode?.metadata;
    if (!md) return;
    const n = Number(md.n);
    const dir = Number(md.dir || 1);
    if (!Number.isFinite(n)) return;
    const mean0 = Number(md.mean0);
    const base = Number.isFinite(mean0) ? mean0 : Number(md.mean || 0);
    md.mean = base + (dir * n * tDays);
    applyOrbitPosition(orbitNode, bodyMesh);
    if (bodyMesh) {
      const parentNode = getOrbitParentNode(orbitNode, bodyMesh);
      const parentAbsKm = getAbsKm(parentNode);
      syncBodySim(bodyMesh, tDays, parentNode, parentAbsKm);
    }
  }

  function ensureSpinBase(mesh) {
    if (!mesh) return null;
    const md = (mesh.metadata = Object.assign({}, mesh.metadata));
    if (md._spinBaseQ) return md._spinBaseQ;

    const baseQ = mesh.rotationQuaternion
      ? mesh.rotationQuaternion.clone()
      : BABYLON.Quaternion.FromEulerAngles(
          Number(mesh.rotation?.x || 0),
          Number(mesh.rotation?.y || 0),
          Number(mesh.rotation?.z || 0)
        );

    md._spinBaseQ = baseQ;
    if (!mesh.rotationQuaternion) {
      mesh.rotationQuaternion = baseQ.clone();
    }
    return md._spinBaseQ;
  }

  function stepSpin(mesh, tDays) {
    const md = mesh?.metadata;
    if (!md) return;
    const spin = Number(md.spin);
    if (!Number.isFinite(spin)) return;
	
    const axis = md.spinAxis || BABYLON.Axis.Y;
    const baseQ = ensureSpinBase(mesh);
    if (!baseQ) return;

    const spinPhase0 = Number(md.spinPhase0) || 0;
    const spinAngle = spinPhase0 + (spin * tDays);
    const qSpin = BABYLON.Quaternion.RotationAxis(axis, spinAngle);
    const qAbs = baseQ.multiply(qSpin);

    if (!mesh.rotationQuaternion) {
      mesh.rotationQuaternion = qAbs.clone();
    } else {
      mesh.rotationQuaternion.copyFrom(qAbs);
    }
  }

  function updateSatelliteList(list, tDays) {
    if (!Array.isArray(list)) return;
    for (const s of list) {
      const orbit = s?.orbit;
      const mesh = s?.mesh;
      if (orbit) stepOrbitAbs(orbit, mesh, tDays);
      else if (mesh) {
        const parentNode = getOrbitParentNode(orbit, mesh);
        const parentAbsKm = getAbsKm(parentNode);
        syncBodySim(mesh, tDays, parentNode, parentAbsKm);
      }
      if (mesh) stepSpin(mesh, tDays);
      updateSatelliteList(s?.satellites || s?.moons, tDays);
    }
  }

  for (const sys of planetSystems) {
    const planets = sys?.planets || [];
    for (const obj of planets) {
      const orbit = obj?.orbit;
      const planet = obj?.planet;

      if (orbit) stepOrbitAbs(orbit, planet, simDays);
      else if (planet) {
        const parentNode = getOrbitParentNode(orbit, planet);
        const parentAbsKm = getAbsKm(parentNode);
        syncBodySim(planet, simDays, parentNode, parentAbsKm);
      }
      if (planet) stepSpin(planet, simDays);
      updateSatelliteList(obj?.satellites || obj?.moons, simDays);
    }
  }
}