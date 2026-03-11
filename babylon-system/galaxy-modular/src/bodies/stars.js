// bodies/stars.js
// Crea estrellas y registra luces por sistema.
// - Si una estrella tiene elementos orbitales (periapsis/apoapsis/orbitalPeriod),
//   se crea su jerarquía de órbita (Ω/i/ω) y se anima con el mismo Kepler solver
//   que los planetas (via updateOrbits).
// - Si en un sistema N-ario ninguna estrella tiene órbita definida, se mantiene
//   el fallback legacy: separación en círculo + rotación simple.

import { ensureSimMeta, setSimLocalU, setSimAbsKm } from '../sim/universeState.js';

export function buildStars({ scene, systemNodes, GALAXY, lights, labelsApi, starMeshById, repMgr, kmPerUnitLocal = 1e6 }) {
  if (!scene || !Array.isArray(systemNodes)) throw new Error('[stars] scene/systemNodes required');
  if (!starMeshById) starMeshById = new Map();
  starMeshById.clear();

  const byName = new Map();
  for (const it of systemNodes) byName.set(it.name, it);

  const starsBySystem = new Map();
  for (const [sid, sdef] of Object.entries(GALAXY?.star || {})) {
    if (!sdef) continue;
    const sysId = sdef.orbits;
    if (!sysId) continue;
    if (!starsBySystem.has(sysId)) starsBySystem.set(sysId, []);
    starsBySystem.get(sysId).push({ id: sid, def: sdef });
  }

  // Escala realista dentro del sistema: tamaño (km) -> unidades de escena
  const kmPerUnit = (Number(kmPerUnitLocal) > 0) ? Number(kmPerUnitLocal) : 1e6;
  const KM_TO_UNITS = 1 / kmPerUnit;
  const AU_TO_KM = 149597870.7;
  const JD_UNIX_EPOCH = 2440587.5;
  const JD_J2000 = 2451545.0;

  const DEG = Math.PI / 180;
  const TAU = Math.PI * 2;

  const binaryGroups = [];
  const starSystems = []; // reutiliza updateOrbits() (estructura { planets:[{orbit, planet}] })

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(v, fb = 0) { return Number.isFinite(Number(v)) ? Number(v) : fb; }
  function normDeg(v) {
    v = v % 360;
    if (v < 0) v += 360;
    return v;
  }
  function nowJD() {
    return (Date.now() / 86400000) + JD_UNIX_EPOCH;
  }
  function epochCenturies(def) {
    const epochJD = num(def?.epochJD, JD_J2000);
    return (nowJD() - epochJD) / 36525.0;
  }
  function hasJplEpochElements(def) {
    return Number.isFinite(Number(def?.meanLongitudeAtEpoch))
      && Number.isFinite(Number(def?.longitudeOfPerihelionAtEpoch));
  }
  function getJplAnglesRad(def) {
    if (!hasJplEpochElements(def)) {
      return {
        lonAsc: num(def?.longitudeOfAscendingNode, 0) * DEG,
        inc: num(def?.inclination, 0) * DEG,
        argPeri: num(def?.argumentOfPeriapsis, 0) * DEG,
      };
    }
    const T = epochCenturies(def);
    const I = num(def?.inclinationAtEpoch, def?.inclination) +
      num(def?.inclinationRateDegPerCentury, 0) * T;
    const Omega = num(def?.longitudeOfAscendingNodeAtEpoch, def?.longitudeOfAscendingNode) +
      num(def?.longitudeOfAscendingNodeRateDegPerCentury, 0) * T;
    const longPeri = num(def?.longitudeOfPerihelionAtEpoch, 0) +
      num(def?.longitudeOfPerihelionRateDegPerCentury, 0) * T;
    const argPeri = normDeg(longPeri - Omega);
    return {
      lonAsc: Omega * DEG,
      inc: I * DEG,
      argPeri: argPeri * DEG,
    };
  }
  function getEpochOrbitShape(def) {
    if (Number.isFinite(Number(def?.semiMajorAxisAuAtEpoch)) || Number.isFinite(Number(def?.eccentricityAtEpoch))) {
      const T = epochCenturies(def);
      const aAU = num(def?.semiMajorAxisAuAtEpoch, 0) + num(def?.semiMajorAxisRateAuPerCentury, 0) * T;
      const e = clamp(num(def?.eccentricityAtEpoch, 0) + num(def?.eccentricityRatePerCentury, 0) * T, 0, 0.999999);
      if (aAU > 0) {
        return {
          aU: Math.max(0.001, (aAU * AU_TO_KM) * KM_TO_UNITS),
          e,
        };
      }
    }
    return null;
  }
  function getMeanNowFromEpoch(def) {
    if (!hasJplEpochElements(def)) return null;
    const T = epochCenturies(def);
    const L = num(def?.meanLongitudeAtEpoch, 0) +
      num(def?.meanLongitudeRateDegPerCentury, 0) * T;
    const longPeri = num(def?.longitudeOfPerihelionAtEpoch, 0) +
      num(def?.longitudeOfPerihelionRateDegPerCentury, 0) * T;
    return normDeg(L - longPeri) * DEG;
  }
  function getMeanMotionRadPerDay(def) {
    if (!hasJplEpochElements(def)) return null;
    const lDot = num(def?.meanLongitudeRateDegPerCentury, NaN);
    const pDot = num(def?.longitudeOfPerihelionRateDegPerCentury, NaN);
    if (!Number.isFinite(lDot) || !Number.isFinite(pDot)) return null;
    return Math.abs((lDot - pDot) * DEG / 36525.0);
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
  function syncNodeSimFromScene(node, parentNode, simDays = 0) {
    if (!node) return null;
    const md = node.metadata || {};
    const kmPerUnit = num(md.kmPerUnit, kmPerUnitLocal || 1e6);
    const localU = v3obj(node.position);
    const parentAbsKm = parentNode?.metadata?.sim?.absKm
      ? v3obj(parentNode.metadata.sim.absKm)
      : { x: 0, y: 0, z: 0 };
    const nodeAbsU = getNodeAbsSceneU(node);
    const parentAbsU = parentNode ? getNodeAbsSceneU(parentNode) : { x: 0, y: 0, z: 0 };
    const relU = {
      x: nodeAbsU.x - parentAbsU.x,
      y: nodeAbsU.y - parentAbsU.y,
      z: nodeAbsU.z - parentAbsU.z,
    };

    ensureSimMeta(node, { kmPerUnit });
    setSimLocalU(node, localU, simDays);
    setSimAbsKm(node, {
      x: parentAbsKm.x + (relU.x * kmPerUnit),
      y: parentAbsKm.y + (relU.y * kmPerUnit),
      z: parentAbsKm.z + (relU.z * kmPerUnit),
    }, simDays);
    return node.metadata?.sim || null;
  }

  function color3FromHex(hex) {
    if (typeof hex !== 'number') return null;
    return BABYLON.Color3.FromInts((hex >> 16) & 255, (hex >> 8) & 255, hex & 255);
  }
  function emissiveFromDef(def) {
    if (def?.emissive && def.emissive.r !== undefined) return def.emissive;
    const c = color3FromHex(def?.color);
    return c ? c.scale(1.1) : new BABYLON.Color3(1, 1, 1);
  }

  function getOrbitDirFromDef(def) {
    const p = Number(def?.orbitalPeriod);
    if (Number.isFinite(p) && p < 0) return -1;
    if (def?.retrogradeOrbit === true) return -1;
    if (def?.orbitDirection === -1) return -1;
    return 1;
  }

  function getSpinDirFromDef(def) {
    const rp = Number(def?.rotationPeriod);
    if (Number.isFinite(rp) && rp < 0) return -1;
    const tilt = Number(def?.axialTilt);
    if (Number.isFinite(tilt) && tilt > 90) return -1;
    if (def?.retrogradeSpin === true) return -1;
    if (def?.spinDirection === -1) return -1;
    return 1;
  }

  function meanFromLastPerihelion(def, nAbs) {
    const jplMean = getMeanNowFromEpoch(def);
    if (Number.isFinite(jplMean)) return jplMean;
    const s = def?.lastPerihelion;
    if (!s || !nAbs) return 0;
    const t0 = Date.parse(s);
    if (Number.isNaN(t0)) return 0;
    const daysSince = (Date.now() - t0) / 86400000;
    return (daysSince * nAbs);
  }

  function hasOrbit(def) {
    // Consideramos “órbita definida” si hay periodo y distancia (peri o apo) o si forceOrbit=true
    if (def?.forceOrbit === true) return true;
    const peri = Math.max(0, Number(def?.periapsis || 0));
    const apo  = Math.max(0, Number(def?.apoapsis || 0));
    const pAbs = Math.abs(Number(def?.orbitalPeriod || 0));
    return (pAbs > 0 && (peri > 0 || apo > 0));
  }

  function createOrbitNodes({ systemName, parentMesh, bodyId, def }) {
    // Orientación orbital: Ω (Y), i (X), ω (Y dentro del plano)
    const { lonAsc, inc, argPeri } = getJplAnglesRad(def);

    const orbitPlane = new BABYLON.TransformNode(`orbPlane_${systemName}_${bodyId}`, scene);
    orbitPlane.parent = parentMesh;
    orbitPlane.rotation.y = lonAsc;
    orbitPlane.rotation.x = inc;

    const orbitArg = new BABYLON.TransformNode(`orb_${systemName}_${bodyId}`, scene);
    orbitArg.parent = orbitPlane;
    orbitArg.rotation.y = argPeri;

    return { orbitPlane, orbitArg };
  }

  function initOrbit(orbitNode, def) {
    const epochShape = getEpochOrbitShape(def);
    let aU, e;
    if (epochShape) {
      aU = epochShape.aU;
      e = epochShape.e;
    } else {
      const peri = Math.max(0, Number(def?.periapsis || 0));
      const apo  = Math.max(0, Number(def?.apoapsis || 0));
      const aKm  = (peri + apo) * 0.5;
      const denom = (peri + apo);
      e = (denom > 0) ? clamp((apo - peri) / denom, 0, 0.999999) : 0;

      // Distancias peri/apo en km (respecto al padre)
      aU = Math.max(0.001, (aKm > 0 ? aKm : Math.max(peri, apo, 1)) * KM_TO_UNITS);
    }

    const orbitDir = getOrbitDirFromDef(def);
    const pAbs = Math.abs(Number(def?.orbitalPeriod || 0));
    const jplNAbs = getMeanMotionRadPerDay(def);
    const nAbs = Number.isFinite(jplNAbs) && jplNAbs > 0
      ? jplNAbs
      : ((pAbs > 0) ? (TAU / pAbs) : 0);

    const Mnow = meanFromLastPerihelion(def, nAbs);

    orbitNode.metadata = Object.assign({}, orbitNode.metadata, {
      aU, e,
      mean0: orbitDir * Mnow,
      mean: orbitDir * Mnow,
      n: nAbs,
      dir: orbitDir,
    });
  }

  // Mini Kepler solver solo para “poner” la posición inicial
  function normAngle(a) {
    a = a % TAU;
    if (a < 0) a += TAU;
    return a;
  }
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
  function placeNow(orbitNode, bodyMesh) {
    const md = orbitNode?.metadata;
    if (!md) return;
    const a = Number(md.aU);
    const e = Number(md.e);
    const M = Number(md.mean);
    if (!Number.isFinite(a) || !Number.isFinite(e) || !Number.isFinite(M)) return;

    const E = solveKeplerE(M, e);
    const cosE = Math.cos(E);
    const r = a * (1 - e * cosE);

    const sq1pe = Math.sqrt(1 + e);
    const sq1me = Math.sqrt(1 - e);
    const nu = 2 * Math.atan2(sq1pe * Math.sin(E * 0.5), sq1me * Math.cos(E * 0.5));

    const x = r * Math.cos(nu);
    const z = r * Math.sin(nu);

    if (bodyMesh) bodyMesh.position.set(x, 0, z);
    else orbitNode.position.set(x, 0, z);
  }

  function initSpin(mesh, def) {
    const spinDir = getSpinDirFromDef(def);
    const rpAbs = Math.abs(Number(def?.rotationPeriod || 0));
    const spinAbs = (rpAbs > 0) ? (TAU / rpAbs) : 0;

    // eje base
    const ra = def?.rotationAxis;
    let axis = (ra && Number.isFinite(ra.x) && Number.isFinite(ra.y) && Number.isFinite(ra.z))
      ? new BABYLON.Vector3(ra.x, ra.y, ra.z)
      : new BABYLON.Vector3(0, 1, 0);
    if (axis.lengthSquared() < 1e-9) axis.set(0, 1, 0);
    axis.normalize();

    const tilt = Number(def?.axialTilt || 0) * DEG;
    if (tilt) {
      const q = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, tilt);
      const m = new BABYLON.Matrix();
      if (typeof BABYLON.Matrix.FromQuaternionToRef === 'function') {
        BABYLON.Matrix.FromQuaternionToRef(q, m);
      } else if (typeof q.toRotationMatrix === 'function') {
        q.toRotationMatrix(m);
      } else {
        BABYLON.Matrix.RotationYawPitchRollToRef(0, 0, tilt, m);
      }
      axis = BABYLON.Vector3.TransformNormal(axis, m);
      if (axis.lengthSquared() < 1e-9) axis.set(0, 1, 0);
      axis.normalize();
    }

    if (spinAbs > 0) {
      mesh.metadata = Object.assign({}, mesh.metadata, {
        spin: spinDir * spinAbs,
        spinAxis: axis,
      });
    }
  }

  for (const [sysId, list] of starsBySystem.entries()) {
    const it = byName.get(sysId);
    if (!it) continue;

    list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const total = list.length;

    // ¿Hay alguna estrella con órbita kepleriana definida?
    const anyOrbit = list.some(x => hasOrbit(x.def));

    // Fallback legacy: para sistemas sin datos orbitales (deja el comportamiento anterior)
    const radiiUnits = list.map(x => (x.def?.size || 696340) * KM_TO_UNITS);
    const baseSep = Math.max(2.0, (radiiUnits.reduce((s, v) => s + v, 0) / Math.max(1, total)) * 6);

    it.stars.length = 0;
    it.primaryStar = null;

    // Elegimos primary como la estrella de mayor tamaño (siempre útil para UI/anchors)
    let primaryCandidate = null;
    let bestSize = -Infinity;
    for (const s of list) {
      const sz = Number(s.def?.size || 0);
      if (Number.isFinite(sz) && sz > bestSize) { bestSize = sz; primaryCandidate = s.id; }
    }

    // Si vamos a animar órbitas, creamos un “contenedor” de sistema para updateOrbits
    const sysBucket = anyOrbit ? { systemName: sysId, planets: [] } : null;

    for (let i = 0; i < total; i++) {
      const starId = list[i].id;
      const sdef = list[i].def;

      const rU = (sdef?.size || 696340) * KM_TO_UNITS;
      const emissive = emissiveFromDef(sdef);

      // Physical node (always active): orbit animator targets this, not the visual mesh.
      const starNode = new BABYLON.TransformNode(`starNode_${sysId}_${starId}`, scene);
      starNode.metadata = Object.assign({}, starNode.metadata, { kmPerUnit: kmPerUnitLocal, systemName: sysId, bodyId: starId, kind: 'star' });
      ensureSimMeta(starNode, {
        bodyId: starId,
        kind: 'star',
        systemName: sysId,
        parentBodyId: `system:${sysId}`,
        kmPerUnit: kmPerUnitLocal,
        radiusKm: (sdef?.size || 696340),
      });

      // Parent / posición: depende de si hay órbitas o fallback
      if (anyOrbit && hasOrbit(sdef)) {
        const { orbitPlane, orbitArg } = createOrbitNodes({ systemName: sysId, parentMesh: it.system, bodyId: starId, def: sdef });
        starNode.parent = orbitArg;
        starNode.position.set(0, 0, 0);

        initOrbit(orbitArg, sdef);
        placeNow(orbitArg, starNode);
        initSpin(starNode, sdef);

        // reutiliza updateOrbits: { orbit, planet }
        if (sysBucket) sysBucket.planets.push({ orbit: orbitArg, planet: starNode, satellites: [], moons: [] });

        // guardamos también en metadata por si lo necesitas
        starNode.metadata.orbitPlane = orbitPlane;
        starNode.metadata.orbitNode = orbitArg;
      } else {
        // Sin órbita: queda anclada al centro del sistema (o fallback separando si no hay órbitas definidas)
        starNode.parent = it.system;
        if (!anyOrbit) {
          if (total === 1) {
            starNode.position.set(0, 0, 0);
          } else {
            const ang = (TAU) * (i / total);
            starNode.position.set(Math.cos(ang) * baseSep, 0, Math.sin(ang) * baseSep);
          }
        } else {
          starNode.position.set(0, 0, 0);
        }
        initSpin(starNode, sdef);
      }

      syncNodeSimFromScene(starNode, it.system, 0);

      try {
        lights?.registerStar?.({
          systemId: sysId,
          starMesh: starNode,
          systemRoot: it.system,
          intensity: 2.5,
          range: 25000,
          color: emissive,
          radiusWorld: rU,
        });
      } catch (_) {}

      // Visual representation + label binding
      try {
        repMgr?.registerEntity?.({
          kind: 'star',
          systemName: sysId,
          bodyId: starId,
          bodyNode: starNode,
          radiusKm: (sdef?.size || 696340),
          kmPerUnit: kmPerUnitLocal,
          color: emissive,
          label: {
            key: `star:${sysId}:${starId}`,
            text: String(starId),
            kind: 'star',
            extra: { system: sysId },
          },
        });
      } catch (_) {
        // Fallback: if repMgr is unavailable, at least register a label on the physical node.
        try { labelsApi?.registerLabel?.(`star:${sysId}:${starId}`, String(starId), 'star', starNode, { system: sysId }); } catch (_) {}
      }

      it.stars.push(starNode);
      starMeshById.set(starId, starNode);

      if (!it.primaryStar) it.primaryStar = starNode;
      if (primaryCandidate && starId === primaryCandidate) it.primaryStar = starNode;
    }

    // Si no hay órbitas keplerianas, mantenemos el “spin” visual legacy para binarios/trinarios
    if (!anyOrbit && it.stars.length > 1) binaryGroups.push({ stars: it.stars.slice(), parentNode: it.system, omega: 0.06 });
    if (sysBucket && sysBucket.planets.length > 0) starSystems.push(sysBucket);
  }

  function updateBinaries(dtSec) {
    if (!dtSec) return;
    for (const g of binaryGroups) {
      const rot = g.omega * dtSec;
      const c = Math.cos(rot), s = Math.sin(rot);
      for (const starMesh of g.stars) {
        const x = starMesh.position.x, z = starMesh.position.z;
        starMesh.position.x = x * c - z * s;
        starMesh.position.z = x * s + z * c;
		syncNodeSimFromScene(starMesh, g.parentNode, starMesh?.metadata?.sim?.simDays || 0);
      }
    }
  }

  return { updateBinaries, starSystems };
}
