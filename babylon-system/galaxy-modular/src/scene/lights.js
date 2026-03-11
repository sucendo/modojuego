// scene/lights.js
// Per-system lighting + dynamic shadows (only 1 active shadow map at a time)
// - Each star creates a PointLight parented to the star mesh.
// - Lights are restricted to their own system via includedOnlyMeshes.
// - A single ShadowGenerator is enabled for the nearest system (by system root distance).
//
// Usage from createScene:
//   const lights = setupLights(scene, { hemiIntensity: 0.10 });
//   lights.registerStar({ systemId, starMesh, systemRoot, intensity, range });
//   lights.includeMesh(systemId, mesh);
//   scene.onBeforeRenderObservable.add(() => lights.updateNearestSystemShadows());

export function setupLights(scene, opts = {}) {
  if (!scene) throw new Error("[lights] scene required");

  const CONFIG = {
    // Igual que en tu proyecto anterior: una luz de rellen4o suave + un poco de ambient.
    // Para negro total: pasa { hemiIntensity: 0, ambientColor: new Color3(0,0,0) }
    hemiIntensity: (typeof opts.hemiIntensity === "number") ? opts.hemiIntensity : 0.10,
    hemiDiffuse: opts.hemiDiffuse ?? new BABYLON.Color3(0.10, 0.10, 0.20),
    hemiGround: opts.hemiGround ?? new BABYLON.Color3(0, 0, 0),
    ambientColor: opts.ambientColor ?? new BABYLON.Color3(0.06, 0.06, 0.07),

    // Normalización opcional: si alguien sigue pasando intensidades “astronómicas” (200000)
    // pero el falloff físico está DESACTIVADO, conviene bajar a valores razonables.
    normalizeIntensity: (opts.normalizeIntensity !== undefined) ? !!opts.normalizeIntensity : false,
    normalizeThreshold: (typeof opts.normalizeThreshold === "number") ? opts.normalizeThreshold : 1000,
    normalizeDiv: (typeof opts.normalizeDiv === "number") ? opts.normalizeDiv : 100000,

    // Sombras por sistema (solo 1 shadow map activo)
    shadowEnableDist: opts.shadowEnableDist ?? 3200,
    shadowUpdateMs: opts.shadowUpdateMs ?? 600,
    shadowMapSize: opts.shadowMapSize ?? 1024,
    shadowBias: opts.shadowBias ?? 0.00035,
    shadowNormalBias: opts.shadowNormalBias ?? 0.012,

    // Clipping de sombras: cap para no disparar coste. Si un planeta queda fuera,
    // lo dejamos sin receiveShadows para evitar que “se apague”.
    shadowMaxZCap: (typeof opts.shadowMaxZCap === "number") ? opts.shadowMaxZCap : 20000,
  };

  // ------------------------------------------------------------
  // Ambient / fill
  // ------------------------------------------------------------
  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = Math.max(0, CONFIG.hemiIntensity);
  hemi.diffuse = CONFIG.hemiDiffuse;
  hemi.groundColor = CONFIG.hemiGround;

  scene.ambientColor = CONFIG.ambientColor;
  scene.environmentTexture = null;

  // ------------------------------------------------------------
  // Per-system registry
  // systemId -> { id, root, starLights: PointLight[], meshes: Set<AbstractMesh> }
  // ------------------------------------------------------------
  const systems = new Map();
  const _litKeySet = new Set();

  // Hidden mesh used as a sentinel so Babylon enters "includedOnlyMeshes mode" immediately.
  // Babylon only switches to included-only filtering when includedOnlyMeshes.length > 0.
  // If we leave it empty, the light impacts *all* meshes and Babylon will keep only the first
  // material.maxSimultaneousLights lights per mesh (often looking like “only the first planet is lit”).
  let _includeSentinelMesh = null;
  function _getIncludeSentinel(scene){
  if (_includeSentinelMesh && typeof _includeSentinelMesh.isDisposed === "function" && !_includeSentinelMesh.isDisposed()) return _includeSentinelMesh;
  try{
  	const m = new BABYLON.Mesh("__lightIncludeSentinel", scene);
  	m.isVisible = false;
  	m.isPickable = false;
  	// Not rendered, but still a valid AbstractMesh reference for includedOnlyMeshes.
  	if (typeof m.setEnabled === "function") m.setEnabled(false);
  	_includeSentinelMesh = m;
  	return m;
  }catch(e){
  	return null;
  }
  }
  
  const DEBUG_LIGHTS = false;
  function _dlog(...args){ if (DEBUG_LIGHTS) console.log("[lights]", ...args); }
  
  
  function ensureSystem(systemId, systemRoot) {
    if (!systemId) throw new Error("[lights] systemId required");
    let s = systems.get(systemId);
    if (!s) {
      s = { id: systemId, root: systemRoot || null, starLights: [], meshes: new Set() };
      systems.set(systemId, s);
    }
    if (systemRoot) s.root = systemRoot;
    return s;
  }

  function _tryDisablePhysicalFalloff(L) {
    // Devuelve true si queda en modo “físico”, false si conseguimos desactivarlo.
    let physicalNow = false;
    try { L.falloffType = BABYLON.Light.FALLOFF_STANDARD; } catch (_) {}
    try {
      if (typeof L.usePhysicalLightFalloff === "boolean") {
        L.usePhysicalLightFalloff = false;
        physicalNow = !!L.usePhysicalLightFalloff;
      }
    } catch (_) {}
    return physicalNow;
  }

  function registerStar({ systemId, starMesh, systemRoot, intensity = 5.5, range = 20000, color = null, radiusWorld = null }) {
    if (!systemId || !starMesh) return null;
    const s = ensureSystem(systemId, systemRoot);

    const L = new BABYLON.PointLight(`${systemId}_${starMesh.name}_light`, BABYLON.Vector3.Zero(), scene);
    L.parent = starMesh;
    L.range = range;
    L.includedOnlyMeshes = [_getIncludeSentinel(scene)].filter(Boolean);

    const physicalNow = _tryDisablePhysicalFalloff(L);

    let I = intensity;
    // Normaliza SOLO si NO es físico
    if (!physicalNow && CONFIG.normalizeIntensity && Number.isFinite(I) && I >= CONFIG.normalizeThreshold) {
      I = I / Math.max(1e-9, CONFIG.normalizeDiv);
    }
    L.intensity = I;

    // Color de luz (si no, intentamos inferir del material de la estrella)
    try {
      if (color && color.r !== undefined) {
        L.diffuse = color;
        L.specular = color;
      } else if (starMesh && starMesh.material) {
        const m = starMesh.material;
        const c = (m.emissiveColor && m.emissiveColor.r !== undefined) ? m.emissiveColor
          : (m.diffuseColor && m.diffuseColor.r !== undefined) ? m.diffuseColor
          : null;
        if (c) { L.diffuse = c; L.specular = c; }
      }
    } catch (_) {}

    // Radio de luz ~ radio de estrella (suaviza highlights)
    try {
      const rW = Number(radiusWorld);
      const r = (Number.isFinite(rW) && rW > 0)
        ? rW
        : (starMesh && typeof starMesh.getBoundingInfo === 'function'
          ? (starMesh.getBoundingInfo?.().boundingSphere?.radiusWorld || 0)
          : 0);
      if (r > 0) L.radius = Math.max(1.0, r * 1.25);
    } catch (_) {}

    s.starLights.push(L);
	_dlog("registerStar", systemId, "light", L && L.name, "range", L && L.range, "physicalFalloff", !!(L && L.usePhysicalLightFalloff));

    // Link meshes ya registrados
    for (const m of s.meshes) {
      if (!m || m.isDisposed?.()) continue;
      const mid = (m.uniqueId != null) ? m.uniqueId : (m.id || m.name);
      const key = L.name + "::" + mid;
      if (_litKeySet.has(key)) continue;
      _litKeySet.add(key);
      L.includedOnlyMeshes.push(m);
    }

    return L;
  }

  function includeMesh(systemId, mesh) {
    if (!systemId || !mesh) return;
    const s = ensureSystem(systemId, null);
    s.meshes.add(mesh);

    for (const L of s.starLights) {
      if (!L || !L.includedOnlyMeshes) continue;
      const mid = (mesh.uniqueId != null) ? mesh.uniqueId : (mesh.id || mesh.name);
      const key = L.name + "::" + mid;
      if (_litKeySet.has(key)) continue;
      _litKeySet.add(key);
      L.includedOnlyMeshes.push(mesh);
    }

    // Ensure Babylon recomputes the light list for this mesh if it has already been cached.
    // (Safe no-op in older/newer versions.)
    try {
      if (typeof mesh.markSubMeshesAsLightDirty === "function") mesh.markSubMeshesAsLightDirty();
      if (typeof mesh._markSubMeshesAsLightDirty === "function") mesh._markSubMeshesAsLightDirty();
    } catch(e) {}

    // Si este sistema ya tiene el ShadowGenerator activo, registra el mesh al momento.
    // (Equivalente al syncShadows() del editor: evita que “solo algunos anillos” proyecten sombra.)
    try {
      if (shadowGen && activeShadowSystemId && systemId === activeShadowSystemId) {
        mesh.receiveShadows = true;
        shadowGen.addShadowCaster(mesh, true);
      }
    } catch (_) {}

    _dlog("includeMesh", systemId, "mesh", mesh && (mesh.name||mesh.id), "lights", s.starLights.length);
  }

  // Limpia referencias a meshes ya dispuestos para no acumular basura
  function pruneDisposedMeshes() {
    for (const s of systems.values()) {
      // limpiar set
      for (const m of Array.from(s.meshes)) {
        if (!m || m.isDisposed?.()) s.meshes.delete(m);
      }
      // limpiar arrays includedOnlyMeshes
      for (const L of s.starLights) {
        if (!L || !L.includedOnlyMeshes) continue;
        L.includedOnlyMeshes = L.includedOnlyMeshes.filter(m => m && !(m.isDisposed?.()));
      }
    }
  }

  // ------------------------------------------------------------
  // Dynamic nearest-system shadows (ONE active shadow generator)
  // ------------------------------------------------------------
  let shadowGen = null;
  let activeShadowSystemId = null;
  let _shadowTick = 0;
  let _ringTick = 0;
  let _pruneTick = 0;
  let _ringSunProxy = null;
  
  function _findNearestLitSystem(camPos) {
    let best = null;
    let bestD2 = Infinity;
    for (const s of systems.values()) {
      if (!s || !s.root || !s.starLights || s.starLights.length === 0) continue;
      const p = s.root.getAbsolutePosition ? s.root.getAbsolutePosition() : s.root.position;
      if (!p) continue;
      const d2 = BABYLON.Vector3.DistanceSquared(camPos, p);
      if (d2 < bestD2) { bestD2 = d2; best = s; }
    }
    return { best, bestD2 };
  }


  function _ensureRingSunProxy() {
    if (_ringSunProxy) return _ringSunProxy;
    _ringSunProxy = new BABYLON.PointLight("__ringSunLight_proxy", BABYLON.Vector3.Zero(), scene);
    // IMPORTANTE: que NO afecte a la iluminación real del scene
    try { _ringSunProxy.setEnabled(false); } catch (_) {}
    _ringSunProxy.intensity = 1.0;
    _ringSunProxy.diffuse = BABYLON.Color3.White();
    _ringSunProxy.specular = _ringSunProxy.diffuse;
    return _ringSunProxy;
  }

  function _setRingSunFromSystem(bestSystem) {
    try {
      const L = (bestSystem && bestSystem.starLights && bestSystem.starLights[0]) ? bestSystem.starLights[0] : null;
      if (!L) { scene._ringSunLight = null; return; }

      const proxy = _ensureRingSunProxy();

      // Copiar intensidad/color del light real
      proxy.intensity = (L.intensity ?? 1.0);
      proxy.diffuse = (L.diffuse && L.diffuse.clone) ? L.diffuse.clone() : (L.diffuse || BABYLON.Color3.White());
      proxy.specular = proxy.diffuse;

      // Posición en MUNDO como en el editor:
      // si el light real está parentado a la estrella, usamos la posición absoluta del parent.
      let wp = null;
      if (L.parent && typeof L.parent.getAbsolutePosition === "function") {
        wp = L.parent.getAbsolutePosition();
      } else if (typeof L.getAbsolutePosition === "function") {
        wp = L.getAbsolutePosition();
      } else {
        wp = L.position;
      }
      if (wp) proxy.position.copyFrom(wp);

      scene._ringSunLight = proxy;
    } catch (_) {
      // fallback seguro
      try { scene._ringSunLight = null; } catch(_) {}
    }
  }

  function disposeShadowGen() {
    if (shadowGen) {
      try { shadowGen.dispose(); } catch (_) {}
      shadowGen = null;
    }
    activeShadowSystemId = null;
  }

  function updateNearestSystemShadows() {
    const now = performance.now();

    const cam = scene.activeCamera;
    if (!cam) return;
    const camPos = cam.globalPosition || cam.position;

    // Keep ring lighting in sync even when shadow-map updates are throttled.
    // This matters with floating-origin rebases and when crossing between systems.
    const nearest = _findNearestLitSystem(camPos);
    if (now - _ringTick > 120) {
      _ringTick = now;
      _setRingSunFromSystem(nearest.best);
    }

    if (now - _shadowTick < CONFIG.shadowUpdateMs) return;
    _shadowTick = now;

    // limpieza ligera cada ~2s
    if (now - _pruneTick > 2000) { _pruneTick = now; pruneDisposedMeshes(); }

    const best = nearest.best;
    const bestD2 = nearest.bestD2;

    // Editor-compatible ring light (PointLight no parentado, con position en mundo)
    _setRingSunFromSystem(best);

    const enable = !!(best && bestD2 <= (CONFIG.shadowEnableDist * CONFIG.shadowEnableDist));
    const nextId = enable ? best.id : null;
    if (nextId === activeShadowSystemId) return;

    if (!enable) {
      disposeShadowGen();
      return;
    }

    const primaryLight = best.starLights[0];
    if (!primaryLight) {
      disposeShadowGen();
      return;
    }

    disposeShadowGen();
    activeShadowSystemId = nextId;
    _dlog("shadows.activate", nextId, "meshes", best && best.meshes && best.meshes.size, "light", primaryLight && primaryLight.name);
 

    // ---- Shadow clipping fix ----
    let lightPos = null;
    try { lightPos = primaryLight.getAbsolutePosition ? primaryLight.getAbsolutePosition() : primaryLight.position; } catch (_) {}

    let maxDist = 0;
    if (lightPos) {
      for (const m of best.meshes) {
        if (!m || m.isDisposed?.()) continue;
        try {
          const mp = m.getAbsolutePosition ? m.getAbsolutePosition() : m.position;
          const br = (m.getBoundingInfo?.()?.boundingSphere?.radiusWorld) || 0;
          const d = BABYLON.Vector3.Distance(lightPos, mp) + br;
          if (d > maxDist) maxDist = d;
        } catch (_) {}
      }
    }

    const wantedMaxZ = Math.max(50, maxDist * 1.25);
    const maxZ = Math.min(CONFIG.shadowMaxZCap, wantedMaxZ);
    const minZ = Math.max(0.5, Math.min(maxZ * 0.01, 50));
    try { primaryLight.shadowMaxZ = maxZ; } catch (_) {}
    try { primaryLight.shadowMinZ = minZ; } catch (_) {}

    shadowGen = new BABYLON.ShadowGenerator(CONFIG.shadowMapSize, primaryLight);
    shadowGen.usePoissonSampling = true;
    shadowGen.bias = CONFIG.shadowBias;
    shadowGen.normalBias = CONFIG.shadowNormalBias;
	
    // Allow transparent casters (rings) to cast shadows (like planet-editor)
    try {
      if ('useTransparencyShadow' in shadowGen) shadowGen.useTransparencyShadow = true;
      if ('transparencyShadow' in shadowGen) shadowGen.transparencyShadow = true;
    } catch (_) {}

    // casters/receivers: si queda fuera de maxZ, no recibe sombras (evita “apagón”)
    for (const m of best.meshes) {
      if (!m || m.isDisposed?.()) continue;
      let inRange = true;
      if (lightPos) {
        try {
          const mp = m.getAbsolutePosition ? m.getAbsolutePosition() : m.position;
          inRange = (BABYLON.Vector3.Distance(lightPos, mp) <= maxZ);
        } catch (_) {}
      }
      m.receiveShadows = !!inRange;
      if (inRange) {
        try { shadowGen.addShadowCaster(m, true); } catch (_) {}
      }
    }
    _dlog("shadows.renderList", nextId, "casters", shadowGen && shadowGen.getShadowMap && shadowGen.getShadowMap().renderList && shadowGen.getShadowMap().renderList.length);

  }
  
  // Visual helper: rings/atmosphere need the main system light
  function getPrimaryLight(systemId) {
    const s = systems.get(systemId);
    if (!s || !s.starLights || !s.starLights.length) return null;
    return s.starLights[0];
  }

  return {
    hemi,
    systems,
    registerStar,
    includeMesh,
	getPrimaryLight,
    pruneDisposedMeshes,
    updateNearestSystemShadows,
    disposeShadowGen,
  };
}