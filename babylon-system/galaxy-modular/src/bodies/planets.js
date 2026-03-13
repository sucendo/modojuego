// bodies/planets.js
// Crea cuerpos (planetas, lunas/satélites, cometas, asteroides, satélites artificiales)
// a partir de:
//  - GALAXY.planets
//  - GALAXY.asteroids (o GALAXY.asteroid)
//  - GALAXY.comets (o GALAXY.comet)
//  - GALAXY.satellites
//  - GALAXY.artificialSatellites (o GALAXY.artificial_satellites)

import { ensureSimMeta, setSimLocalU, setSimAbsKm } from '../sim/universeState.js';

export function buildPlanets({ scene, systemNodes, starMeshById, GALAXY, lights, labelsApi, repMgr, kmPerUnitLocal = 1e6 }) {
  if (!scene || !Array.isArray(systemNodes)) throw new Error('[planets] scene/systemNodes required');

  const planetSystems = [];
  // NOTE:
  // - We now store PHYSICAL nodes (TransformNode) in these maps.
  // - Visual meshes are managed by RepresentationManager and can change dynamically.
  const planetMeshById = new Map();
  // "moon" legacy -> ahora "satellite", pero mantenemos el nombre para no romper imports
  const moonMeshById = new Map(); // satelliteId -> TransformNode
  
  const asteroidMeshById = new Map(); // asteroidId -> TransformNode
  const cometMeshById = new Map();    // cometId -> TransformNode
  const artificialSatMeshById = new Map(); // artificialSatelliteId -> TransformNode

  const stars = GALAXY?.star || {};
  const planets = GALAXY?.planets || {};
  const asteroids = GALAXY?.asteroids || GALAXY?.asteroid || {};
  const comets = GALAXY?.comets || GALAXY?.comet || {};
  const satellites = GALAXY?.satellites || {};
  const artificialSatellites = GALAXY?.artificialSatellites || GALAXY?.artificial_satellites || {};

  const starsBySystem = new Map();
  for (const [starId, sdef] of Object.entries(stars)) {
    const sys = sdef?.orbits;
    if (!sys) continue;
    if (!starsBySystem.has(sys)) starsBySystem.set(sys, []);
    starsBySystem.get(sys).push({ id: starId, def: sdef });
  }

  const bodiesByStar = new Map();
  const bodiesBySystem = new Map(); // soporte: bodies que orbitan el baricentro del sistema (def.orbits = systemName)

  function addOrbitingBodies(src, kind) {
    for (const [id, def] of Object.entries(src || {})) {
      const target = def?.orbits;
      if (!target) continue;

      // Normal: planet/asteroid/comet orbitan una estrella por id.
      // Fallback: si no existe esa estrella, interpretamos orbits como systemName (baricentro del sistema).
      const isStarTarget = (starMeshById && typeof starMeshById.has === 'function' && starMeshById.has(target));

      const map = isStarTarget ? bodiesByStar : bodiesBySystem;
      if (!map.has(target)) map.set(target, []);
      map.get(target).push({ id, def, kind });
    }
  }

  addOrbitingBodies(planets, 'planet');
  addOrbitingBodies(asteroids, 'asteroid');
  addOrbitingBodies(comets, 'comet');

  // ============================================================
  // ESCALA REALISTA (dentro del sistema)
  // Misma conversión para órbitas y tamaños, para que:
  // - radios (km) y distancias orbitales (km) mantengan proporciones reales
  // - las lunas NO queden “dentro” de su planeta por escalas distintas
  // ============================================================
  const kmPerUnit = (Number(kmPerUnitLocal) > 0) ? Number(kmPerUnitLocal) : 1e6;
  const KM_TO_UNITS = 1 / kmPerUnit;
  const AU_TO_KM = 149597870.7;
  const JD_UNIX_EPOCH = 2440587.5;
  const JD_J2000 = 2451545.0;
  
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

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

  function colorFromDef(c) {
    if (typeof c === 'number') {
      const hex = '#' + (c >>> 0).toString(16).padStart(6, '0');
      return BABYLON.Color3.FromHexString(hex);
    }
    return null;
  }
  function radPerDayFromPeriod(periodDays, fallback) {
    const p = Number(periodDays);
    if (!Number.isFinite(p) || p === 0) return fallback;
    return TAU / p;
  }
  function makeLabel(kind, sysName, text, planetId) {
    const key = `${kind}:${sysName}:${planetId || ''}:${String(text)}`;
    return { key, text: String(text), kind, extra: { system: sysName, planet: planetId } };
  }

  // Mapa genérico de cuerpos por id para colgar satélites donde toque
  // value: { mesh, orbit, systemName, satellites: [] }
  const bodyById = new Map();

  function getOrbitDirFromDef(def) {
    // Si orbitalPeriod es negativo -> retrograde
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
    if (Number.isFinite(tilt) && tilt > 90) return -1; // Venus/Urano style
    if (def?.retrogradeSpin === true) return -1;
    if (def?.spinDirection === -1) return -1;
    return 1;
  }

  function meanFromLastPerihelion(def, nAbs) {
    const jplMean = getMeanNowFromEpoch(def);
    if (Number.isFinite(jplMean)) return jplMean;
    // mean anomaly at "now" (radian)
    const s = def?.lastPerihelion;
    if (!s || !nAbs) return 0;
    const t0 = Date.parse(s);
    if (Number.isNaN(t0)) return 0;
    const daysSince = (Date.now() - t0) / 86400000;
    return (daysSince * nAbs);
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

  function createBodyNode({ systemName, parentOrbit, bodyId, def, kind, defaultSizeKm }) {
    // size se interpreta como radio en km
    const radiusKm = Number(def?.size || defaultSizeKm);
    const radiusWorld = (Number.isFinite(radiusKm) && radiusKm > 0) ? (radiusKm * KM_TO_UNITS) : 0.001;
    const collisionRadiusMul = Math.max(1.0, Number(def?.collisionRadiusMul || 1.0));

    const node = new BABYLON.TransformNode(`body_${kind}_${systemName}_${bodyId}`, scene);
    node.parent = parentOrbit;
    node.position.set(0, 0, 0);
    node.metadata = Object.assign({}, node.metadata, {
      kmPerUnit: kmPerUnitLocal,
      systemName,
      bodyId,
      kind,
      radiusKm,
      radiusWorld,
      collisionRadiusMul,
      collisionRadiusWorld: radiusWorld * collisionRadiusMul,
	});
    ensureSimMeta(node, {
      bodyId,
      kind,
      systemName,
      parentBodyId: null,
      kmPerUnit: kmPerUnitLocal,
      radiusKm,
    });
    return { node, radiusKm };
  }

  function initSpin(mesh, def) {
    // rotación: rotationPeriod (días); dirección por signo / axialTilt>90
    const spinDir = getSpinDirFromDef(def);
    const rpAbs = Math.abs(Number(def?.rotationPeriod || 0));
    const spinAbs = (rpAbs > 0) ? (TAU / rpAbs) : 0.35; // rad/día

    // Eje base
    const ra = def?.rotationAxis;
    let axis = (ra && Number.isFinite(ra.x) && Number.isFinite(ra.y) && Number.isFinite(ra.z))
      ? new BABYLON.Vector3(ra.x, ra.y, ra.z)
      : new BABYLON.Vector3(0, 1, 0);
    if (axis.lengthSquared() < 1e-9) axis.set(0, 1, 0);
    axis.normalize();

    // axialTilt -> inclinamos el eje (aprox) alrededor de Z
    const tilt = Number(def?.axialTilt || 0) * DEG;
    if (tilt) {
      const q = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, tilt);
      const m = new BABYLON.Matrix();
      // Compat Babylon: en algunas versiones no existe Matrix.FromQuaternion
      if (typeof BABYLON.Matrix.FromQuaternionToRef === 'function') {
        BABYLON.Matrix.FromQuaternionToRef(q, m);
      } else if (typeof q.toRotationMatrix === 'function') {
        q.toRotationMatrix(m);
      } else {
        // fallback ultra defensivo
        BABYLON.Matrix.RotationYawPitchRollToRef(0, 0, tilt, m);
      }
      axis = BABYLON.Vector3.TransformNormal(axis, m);
      if (axis.lengthSquared() < 1e-9) axis.set(0, 1, 0);
      axis.normalize();
    }

    // Guardamos axis en metadata y giramos sobre él (LOCAL)
    mesh.metadata.spin = spinDir * spinAbs;
    mesh.metadata.spinAxis = axis;
  }

  function initOrbit(orbitNode, def) {
    // Kepler: a,e,n,mean (mean anomaly)
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

      // Si no hay peri/apo válidos, fallback a circular con aKm=0 -> aU pequeño
      // peri/apo se interpretan como distancias al centro del cuerpo padre (km)
      aU = Math.max(0.001, (aKm > 0 ? aKm : Math.max(peri, apo, 1)) * KM_TO_UNITS);
    }

    const orbitDir = getOrbitDirFromDef(def);
    const pAbs = Math.abs(Number(def?.orbitalPeriod || 0));
    const jplNAbs = getMeanMotionRadPerDay(def);
    const nAbs = Number.isFinite(jplNAbs) && jplNAbs > 0
      ? jplNAbs
      : ((pAbs > 0) ? (TAU / pAbs) : (TAU / 365.25)); // rad/día

    const Mnow = meanFromLastPerihelion(def, nAbs);

    orbitNode.metadata = Object.assign({}, orbitNode.metadata, {
      aU, e,
      mean0: orbitDir * Mnow,
      mean: orbitDir * Mnow,
      n: nAbs,
      dir: orbitDir,
    });
  }

  function defaultSizeKmForKind(kind) {
    switch (kind) {
      case 'asteroid': return 10; // km radius (visual placeholder)
      case 'comet': return 6;     // km radius (visual placeholder)
      case 'planet':
      default: return 2500;       // km radius
    }
  }

  function makeBodyFromDef(systemName, parentMesh, bodyId, def, kind) {
    const { orbitPlane, orbitArg } = createOrbitNodes({ systemName, parentMesh, bodyId, def });

    const { node: bodyNode, radiusKm } = createBodyNode({
      systemName,
      parentOrbit: orbitArg,
      bodyId,
      def,
      kind,
      defaultSizeKm: defaultSizeKmForKind(kind),
    });

    if (kind === 'planet') planetMeshById.set(bodyId, bodyNode);
    else if (kind === 'asteroid') asteroidMeshById.set(bodyId, bodyNode);
    else if (kind === 'comet') cometMeshById.set(bodyId, bodyNode);

    const baseColor = colorFromDef(def?.color) || (kind === 'planet'
      ? new BABYLON.Color3(0.35, 0.35, 0.35)
      : new BABYLON.Color3(0.7, 0.7, 0.7));

    const lbl = makeLabel(kind, systemName, bodyId, bodyId);
    try {
      repMgr?.registerEntity?.({
        kind,
        systemName,
        bodyId,
        bodyNode,
        radiusKm,
        kmPerUnit: kmPerUnitLocal,
        color: baseColor,
        label: lbl,
        appearance: def?.jsonFile ? { jsonFile: String(def.jsonFile) } : null,
      });
    } catch (_) {
      // If repMgr is unavailable, at least register the label on the physical node.
      try { labelsApi?.registerLabel?.(lbl.key, lbl.text, lbl.kind, bodyNode, lbl.extra); } catch (_) {}
    }

    initOrbit(orbitArg, def);
    initSpin(bodyNode, def);
    ensureSimMeta(bodyNode, {
      parentBodyId: parentMesh?.metadata?.bodyId || `system:${systemName}`,
      radiusKm,
    });
    syncNodeSimFromScene(bodyNode, parentMesh, 0);

    // Estructura compatible con orbitAnimator.js (usa obj.planet como “cuerpo principal”)
    const out = { orbit: orbitArg, orbitPlane, planet: bodyNode, satellites: [] };
    out.moons = out.satellites;

    bodyById.set(bodyId, { mesh: bodyNode, orbit: orbitArg, systemName, satellites: out.satellites });
    return out;
  }

  for (const it of systemNodes) {
    const sysName = it.name;
    const starList = starsBySystem.get(sysName) || [];

    const planetsOut = [];
    for (const st of starList) {
      const starMesh = starMeshById.get(st.id) || it.primaryStar;
      if (!starMesh) continue;

      const blist = bodiesByStar.get(st.id) || [];
      const kindWeight = (k) => (k === 'planet' ? 0 : (k === 'asteroid' ? 1 : 2));
      blist.sort((a, b) => {
        const da = (((a.def?.periapsis || 0) + (a.def?.apoapsis || 0)) * 0.5);
        const db = (((b.def?.periapsis || 0) + (b.def?.apoapsis || 0)) * 0.5);
        if (da !== db) return da - db;
        return kindWeight(a.kind) - kindWeight(b.kind);
      });

      for (const { id, def, kind } of blist) planetsOut.push(makeBodyFromDef(sysName, starMesh, id, def, kind));
    }
	
    // Cuerpos que orbitan el baricentro del sistema (def.orbits = systemName)
    const sysBlist = bodiesBySystem.get(sysName) || [];
    if (sysBlist.length) {
      const kindWeight = (k) => (k === 'planet' ? 0 : (k === 'asteroid' ? 1 : 2));
      sysBlist.sort((a, b) => {
        const da = (((a.def?.periapsis || 0) + (a.def?.apoapsis || 0)) * 0.5);
        const db = (((b.def?.periapsis || 0) + (b.def?.apoapsis || 0)) * 0.5);
        if (da !== db) return da - db;
        return kindWeight(a.kind) - kindWeight(b.kind);
      });
      for (const { id, def, kind } of sysBlist) planetsOut.push(makeBodyFromDef(sysName, it.system, id, def, kind));
    }

    planetSystems.push({ systemName: sysName, planets: planetsOut });
  }
  
  // ============================
  // Satélites: 2ª pasada (enlaza por def.orbits)
  // ============================
  // Hacemos varias pasadas por si hay satélites de satélites
  const pending = new Map(); // id -> { def, labelKind }
  for (const [id, def] of Object.entries(satellites || {})) pending.set(id, { def, labelKind: 'moon' });
  for (const [id, def] of Object.entries(artificialSatellites || {})) pending.set(id, { def, labelKind: 'artSat' });
  let progressed = true;
  let safety = 0;
  while (pending.size && progressed && safety++ < 10) {
    progressed = false;
    for (const [sid, packed] of Array.from(pending.entries())) {
      const sdef = packed?.def || packed;
      const labelKind = packed?.labelKind || 'moon';
      const parentId = sdef?.orbits;
      if (!parentId) { pending.delete(sid); continue; }

      const parentBody = bodyById.get(parentId);
      // Permitimos satélite orbitando estrella por id de estrella
      let parentMesh = parentBody?.mesh || starMeshById.get(parentId) || null;
      let systemName = parentBody?.systemName || null;

      if (!parentMesh) continue; // aún no existe el padre (quizá satélite de satélite)

      // si cuelga de una estrella, intentamos inferir sistema por su parent (sys_XXX)
      if (!systemName) {
        // starMesh parent es el TransformNode del sistema (sys_X)
        const sysNodeName = parentMesh.parent?.name || '';
        systemName = sysNodeName.startsWith('sys_') ? sysNodeName.slice(4) : (parentMesh.metadata?.systemName || 'Sol');
      }

      const { orbitPlane, orbitArg } = createOrbitNodes({ systemName, parentMesh, bodyId: sid, def: sdef });
      const entityKind = (labelKind === 'artSat') ? 'artificialSatellite' : 'moon';
      const { node: satNode, radiusKm } = createBodyNode({ systemName, parentOrbit: orbitArg, bodyId: sid, def: sdef, kind: entityKind, defaultSizeKm: 300 });
      if (labelKind === 'artSat') artificialSatMeshById.set(sid, satNode);
      else moonMeshById.set(sid, satNode);

      const baseColor = colorFromDef(sdef?.color) || new BABYLON.Color3(0.75, 0.75, 0.75);
      const lbl = makeLabel(labelKind, systemName, sid, parentId);
      try {
        repMgr?.registerEntity?.({
          kind: entityKind,
          systemName,
          bodyId: sid,
          bodyNode: satNode,
          radiusKm,
          kmPerUnit: kmPerUnitLocal,
          color: baseColor,
          label: lbl,
          appearance: sdef?.jsonFile ? { jsonFile: String(sdef.jsonFile) } : null,
        });
      } catch (_) {
        try { labelsApi?.registerLabel?.(lbl.key, lbl.text, lbl.kind, satNode, lbl.extra); } catch (_) {}
      }

      initOrbit(orbitArg, sdef);
      initSpin(satNode, sdef);
      ensureSimMeta(satNode, {
        parentBodyId: parentMesh?.metadata?.bodyId || parentId || null,
        radiusKm,
      });
      syncNodeSimFromScene(satNode, parentMesh, 0);

      const satObj = { orbit: orbitArg, orbitPlane, mesh: satNode, satellites: [] };
      satObj.moons = satObj.satellites;

      // registrar para futuros hijos
      bodyById.set(sid, { mesh: satNode, orbit: orbitArg, systemName, satellites: satObj.satellites });

      // colgar en el padre si era planeta/satélite; si es estrella, no hace falta pero lo guardamos en metadata
      if (parentBody?.satellites) parentBody.satellites.push(satObj);
      else {
        // estrella: lo dejamos “suelto” (seguirá animándose si lo recorremos desde planetSystems?),
        // por simplicidad lo metemos en el sistema como “planeta root” extra:
        const sys = planetSystems.find(s => s.systemName === systemName);
        if (sys) sys.planets.push({ orbit: orbitArg, orbitPlane, planet: satNode, satellites: satObj.satellites, moons: satObj.satellites });
      }

      pending.delete(sid);
      progressed = true;
    }
  }

  try {
    const st = repMgr?.getStats?.();
    console.log(
      `[planets] registered: planets=${planetMeshById.size} moons=${moonMeshById.size} ` +
      `asteroids=${asteroidMeshById.size} comets=${cometMeshById.size} artSat=${artificialSatMeshById.size} ` +
      `repTotal=${st?.total ?? 'n/a'}`
    );
  } catch (_) {}
  return { planetSystems, planetMeshById, moonMeshById, asteroidMeshById, cometMeshById, artificialSatMeshById };
}