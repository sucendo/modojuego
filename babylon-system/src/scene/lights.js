// scene/lights.js
// Paso 4: extraer luces + link de meshes a luces + sombras extra por sistema (1 a la vez)

export function setupLighting({ scn, bodies }) {
  // ------------------------------------------------------------
  // Core light (Canopus)
  // ------------------------------------------------------------
  const sunLight = new BABYLON.PointLight("sunLight", BABYLON.Vector3.Zero(), scn);
  sunLight.intensity = 7.5;
  sunLight.range = 20000;
  // En escalas grandes, el falloff físico hace que "no llegue" luz
  try { sunLight.falloffType = BABYLON.Light.FALLOFF_STANDARD; } catch(e) {}
  try { sunLight.usePhysicalLightFalloff = false; } catch(e) {}

  // Fill light
  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scn);
  hemi.intensity = 0.10;
  hemi.diffuse = new BABYLON.Color3(0.1, 0.1, 0.2);
  hemi.groundColor = new BABYLON.Color3(0,0,0);
  scn.ambientColor = new BABYLON.Color3(0.06, 0.06, 0.07);

  // Core shadow map
  const shadowGen = new BABYLON.ShadowGenerator(2048, sunLight);
  shadowGen.usePoissonSampling = true;
  shadowGen.bias = 0.00025;
  shadowGen.normalBias = 0.01;

  // ------------------------------------------------------------
  // Light linking (includedOnlyMeshes)
  // - Canopus ilumina todo el "core"
  // - Extras: cada sistema ilumina solo lo suyo
  // ------------------------------------------------------------
  const mainLitMeshes = [];
  sunLight.includedOnlyMeshes = mainLitMeshes;

  // starMesh -> PointLight (core o local)
  const lightByStarMesh = new Map();

  // extras: { id, light, root, range }
  const systemLights = [];

  // Evita duplicados en includedOnlyMeshes (stable key)
  const _litKeySet = new Set();

  function registerStarLight(starMesh, light) {
    if (!starMesh || !light) return;
    lightByStarMesh.set(starMesh, light);
  }

  function includeMeshInBodyLight(mesh, body) {
    if (!mesh || !body) return;
    const star = body.starRef;
    const l = star ? lightByStarMesh.get(star) : null;

    const mid = (mesh.uniqueId != null) ? mesh.uniqueId : (mesh.id || mesh.name);

    if (l && l.includedOnlyMeshes) {
      const key = l.name + "::" + mid;
      if (_litKeySet.has(key)) return;
      _litKeySet.add(key);
      l.includedOnlyMeshes.push(mesh);
    } else {
      const key = "sunLight::" + mid;
      if (_litKeySet.has(key)) return;
      _litKeySet.add(key);
      mainLitMeshes.push(mesh);
    }
  }

  // ------------------------------------------------------------
  // Safety net: relink periódico (evita planetas oscuros al regenerar LOD)
  // ------------------------------------------------------------
  let _relinkTick = 0;
  function relinkAllBodyMeshesToLights() {
    const now = performance.now();
    if (now - _relinkTick < 800) return;
    _relinkTick = now;

    for (const b of bodies.values()) {
      if (!b) continue;
      if (b.farMesh && b.farMesh.isDisposed && b.farMesh.isDisposed()) continue;
      includeMeshInBodyLight(b.farMesh, b);
      if (b.ocean) includeMeshInBodyLight(b.ocean, b);
      if (b.lowMesh) includeMeshInBodyLight(b.lowMesh, b);
      if (b.lowOcean) includeMeshInBodyLight(b.lowOcean, b);
      if (b.midMesh) includeMeshInBodyLight(b.midMesh, b);
      if (b.midOcean) includeMeshInBodyLight(b.midOcean, b);
      if (b.hiMesh) includeMeshInBodyLight(b.hiMesh, b);
      if (b.hiOcean) includeMeshInBodyLight(b.hiOcean, b);
    }
  }

  // ------------------------------------------------------------
  // Dynamic per-system shadows (extras)
  // - Solo 1 sistema extra a la vez (nearest)
  // ------------------------------------------------------------
  let extraShadowGen = null;
  let extraShadowSystemId = null;
  const EXTRA_SHADOW = {
    enableDist: 3200,
    updateMs: 600,
    mapSize: 1024,
    bias: 0.00035,
    normalBias: 0.012,
  };
  let _extraShadowTick = 0;

  function updateExtraSystemShadows() {
    const now = performance.now();
    if (now - _extraShadowTick < EXTRA_SHADOW.updateMs) return;
    _extraShadowTick = now;

    const cam = scn.activeCamera;
    if (!cam) return;

    let best = null;
    let bestD2 = Infinity;
    const camPos = cam.position;

    for (const s of systemLights) {
      if (!s || !s.light || !s.root) continue;
      const d2 = BABYLON.Vector3.DistanceSquared(camPos, s.root.getAbsolutePosition());
      if (d2 < bestD2) { bestD2 = d2; best = s; }
    }

    const enable = best && (bestD2 <= (EXTRA_SHADOW.enableDist * EXTRA_SHADOW.enableDist));
    const targetSystemId = enable ? best.id : null;
    if (targetSystemId === extraShadowSystemId) return;

    if (extraShadowGen) {
      try { extraShadowGen.dispose(); } catch(_) {}
      extraShadowGen = null;
    }
    extraShadowSystemId = targetSystemId;
    if (!enable) return;

    try {
      extraShadowGen = new BABYLON.ShadowGenerator(EXTRA_SHADOW.mapSize, best.light);
      extraShadowGen.usePoissonSampling = true;
      extraShadowGen.bias = EXTRA_SHADOW.bias;
      extraShadowGen.normalBias = EXTRA_SHADOW.normalBias;
    } catch (e) {
      console.warn("No se pudo crear extraShadowGen:", e);
      extraShadowGen = null;
      extraShadowSystemId = null;
      return;
    }

    // Casters/receivers del sistema activo
    for (const b of bodies.values()) {
      if (!b || b.systemId !== extraShadowSystemId) continue;
      if (b.farMesh) {
        b.farMesh.receiveShadows = true;
        try { extraShadowGen.addShadowCaster(b.farMesh, true); } catch(_) {}
      }
      if (b.ocean) {
        b.ocean.receiveShadows = false;
      }
    }
  }

  // Helper: crea luz local para un sistema extra (parented a su estrella)
  function createLocalSystemLight({ systemId, starMesh, root, intensity, range }) {
    const local = new BABYLON.PointLight(systemId + "_light", new BABYLON.Vector3(0,0,0), scn);
    local.parent = starMesh;
    local.intensity = (intensity != null) ? intensity : 7.0;
    local.range = (range != null) ? range : 20000;
    try { local.falloffType = BABYLON.Light.FALLOFF_STANDARD; } catch(e) {}
    try { local.usePhysicalLightFalloff = false; } catch(e) {}
    local.includedOnlyMeshes = [];
    local.setEnabled(true);
    systemLights.push({ id: systemId, light: local, root, range: local.range });
    registerStarLight(starMesh, local);
    return local;
  }

  return {
    sunLight,
    hemi,
    shadowGen,
    mainLitMeshes,
    lightByStarMesh,
    systemLights,
    registerStarLight,
    createLocalSystemLight,
    includeMeshInBodyLight,
    relinkAllBodyMeshesToLights,
    updateExtraSystemShadows,
  };
}