// representation/representationManager.js
// Pixel-size based visual representation switching.
//
// Goals:
// - Keep a stable physical node (TransformNode) per entity that orbit/rotation logic targets.
// - Swap the *visual* representation under that node based on screen-space diameter (pixels).
// - Scale dot representations to a minimum pixel size.
// - Be scalable to thousands of entities via evaluation slicing (budget per tick).

import { getDefaultRepresentationProfiles } from './representationProfiles.js';
import { computePxPerUnit, computeDiameterPx, computeDotWorldScale } from './screenSpace.js';
import { createDotRep, createSphereRep } from './repFactories.js';

function _keyOf(kind, systemName, bodyId) {
  return `${kind}:${systemName || ''}:${String(bodyId)}`;
}

export function createRepresentationManager({ scene, engine, camera, labelsApi, lights, profiles, opts = {} }) {
  if (!scene || !engine || !camera) throw new Error('[repMgr] scene/engine/camera required');

  const PROFILES = profiles || getDefaultRepresentationProfiles();

  // ------------------------------------------------------------
  // Config
  // ------------------------------------------------------------
  const CONFIG = {
    // How often to evaluate LOD (ms). 0 => every frame.
    evalIntervalMs: (typeof opts.evalIntervalMs === 'number') ? opts.evalIntervalMs
      : (typeof opts.throttleMs === 'number') ? opts.throttleMs
      : 80,

    // Max entities evaluated per evaluation tick. 0 => all.
    evalMaxPerTick: (typeof opts.evalMaxPerTick === 'number') ? Math.max(0, opts.evalMaxPerTick) : 0,

    // Max time (ms) spent evaluating per tick. 0 => unlimited.
    evalBudgetMs: (typeof opts.evalBudgetMs === 'number') ? Math.max(0, opts.evalBudgetMs) : 0,

    // Limit number/time of transitions (mesh swaps) per tick.
    transitionMaxPerTick: (typeof opts.transitionMaxPerTick === 'number') ? Math.max(0, opts.transitionMaxPerTick) : 0,
    transitionBudgetMs: (typeof opts.transitionBudgetMs === 'number') ? Math.max(0, opts.transitionBudgetMs) : 0,

    hysteresisRatio: (typeof opts.hysteresisRatio === 'number') ? opts.hysteresisRatio : 0.12,

    // Minimum time (ms) an entity must stay in a LOD state before switching again.
    minStateHoldMs: (typeof opts.minStateHoldMs === 'number') ? Math.max(0, opts.minStateHoldMs) : 1200,

    // Initial rep state for each entity.
    initialState: opts.initialState || 'sphere_low',

    // Create an initial rep right away (prevents a blank first frame)
    createInitialRep: (opts.createInitialRep !== false),

    // Cache a few procedural sphere_high planets to avoid re-generation stutter.
    procCacheMax: (typeof opts.procCacheMax === 'number') ? Math.max(0, Math.floor(opts.procCacheMax)) : 2,

    // Skip heavy procedural refinements while the camera is moving fast (units/sec). 0 => disabled.
    procRefineMaxCamSpeed: (typeof opts.procRefineMaxCamSpeed === 'number') ? Math.max(0, opts.procRefineMaxCamSpeed) : 3.5,
  };
  
  // ------------------------------------------------------------
  // AtmospherePP (Planet-Editor compatibility)
  // - In the editor this is a single post-process bound to the active preview planet.
  // - In the simulator we bind it to the currently active procedural sphere_high (latest activated).
  // ------------------------------------------------------------
  const ATM = (opts.enableAtmospherePP === false) ? null : globalThis.AtmospherePP;
  const _atmoPP = (ATM && typeof ATM.createAtmospherePostProcess === 'function')
    ? ATM.createAtmospherePostProcess(scene, camera)
    : null;
  if (_atmoPP && ATM && typeof ATM.attachDepthForAtmosphere === 'function') {
    try { ATM.attachDepthForAtmosphere(scene, camera, _atmoPP); } catch (_) {}
  }

  let _atmoActiveKey = null; // entry.key currently bound
  let _atmoActiveEntry = null;
  let _atmoActiveMesh = null;
  let _atmoLastPickT = 0;

  function _getProcParamsForEntry(entry) {
    const mesh = entry?.reps?.sphere_high;
    return mesh?.metadata?.__procParams || null;
  }

  function _entryWantsAtmosphere(entry) {
    const p = _getProcParamsForEntry(entry);
    return !!(p && p.atmoEnabled);
  }

  function _hexToVec3(hex) {
    try {
      const c = BABYLON.Color3.FromHexString(String(hex || '#ffffff'));
      return new BABYLON.Vector3(c.r, c.g, c.b);
    } catch (_) {
      return new BABYLON.Vector3(1, 1, 1);
    }
  }

  function _getSunPosFor(entry, planetPos) {
    // Prefer the system primary light (per-system lighting), fallback to scene._ringSunLight.
    let L = null;
    try { L = lights?.getPrimaryLight?.(entry?.systemName) || null; } catch (_) {}
    try { if (!L) L = scene?._ringSunLight || null; } catch (_) {}

    if (!L) return (planetPos || BABYLON.Vector3.Zero()).add(new BABYLON.Vector3(1, 0, 0).scale(1e6));

    // PointLight => real position
    try {
      if (L.getClassName && L.getClassName() === 'PointLight') {
        return (typeof L.getAbsolutePosition === 'function') ? L.getAbsolutePosition() : (L.position || BABYLON.Vector3.Zero());
      }
    } catch (_) {}

    // DirectionalLight => fake a far away sun opposite to light.direction (stable direction is what matters)
    try {
      const dir = (L.direction && L.direction.normalize) ? L.direction.normalize() : new BABYLON.Vector3(-0.6, -0.2, -0.7);
      return (planetPos || BABYLON.Vector3.Zero()).subtract(dir.scale(1e6));
    } catch (_) {}

    return (planetPos || BABYLON.Vector3.Zero()).add(new BABYLON.Vector3(1, 0, 0).scale(1e6));
  }  

  function _projectToScreen(worldPos) {
    if (!worldPos || !engine || !camera || !scene) return null;
    try {
      const rw = engine.getRenderWidth(true);
      const rh = engine.getRenderHeight(true);
      const vp = camera.viewport
        ? camera.viewport.toGlobal(rw, rh)
        : { x: 0, y: 0, width: rw, height: rh };
      const projected = BABYLON.Vector3.Project(
        worldPos,
        BABYLON.Matrix.Identity(),
        scene.getTransformMatrix(),
        vp
      );
      if (!projected || !Number.isFinite(projected.x) || !Number.isFinite(projected.y) || !Number.isFinite(projected.z)) return null;

      const margin = 96;
      const cx = vp.x + (vp.width * 0.5);
      const cy = vp.y + (vp.height * 0.5);
      const nx = (projected.x - cx) / Math.max(1, vp.width * 0.5);
      const ny = (projected.y - cy) / Math.max(1, vp.height * 0.5);
      const centerDistN = Math.sqrt((nx * nx) + (ny * ny));
      const onScreen = (projected.z >= 0.0 && projected.z <= 1.0)
        && projected.x >= (vp.x - margin)
        && projected.x <= (vp.x + vp.width + margin)
        && projected.y >= (vp.y - margin)
        && projected.y <= (vp.y + vp.height + margin);

      return { projected, vp, centerDistN, onScreen };
    } catch (_) {
      return null;
    }
  }
  
  function _pickAtmosphereEntry() {
    let best = null;
    let bestScore = -Infinity;
    for (const entry of entryList) {
      if (!entry || entry.activeState !== 'sphere_high') continue;
      const mesh = entry?.reps?.sphere_high;
      if (!mesh?.metadata?.__procRep) continue;
      if (!(mesh?.isEnabled?.() ?? mesh?.isVisible)) continue;
      if (!_entryWantsAtmosphere(entry)) continue;

      const worldPos = mesh.getAbsolutePosition ? mesh.getAbsolutePosition() : (entry.bodyNode?.getAbsolutePosition?.() || entry.bodyNode?.position);
      if (!worldPos) continue;

      const diamPx = computeDiameterPx({ engine, camera, worldPos, radiusWorld: entry.radiusWorld });
      if (!Number.isFinite(diamPx) || diamPx <= 2.0) continue;

      const proj = _projectToScreen(worldPos);
      if (!proj?.onScreen) continue;

      // Prioriza el cuerpo realmente visible y cercano al centro de pantalla,
      // no el más grande “en cualquier parte” del sistema.
      const centerWeight = Math.max(0.35, 1.20 - (proj.centerDistN * 0.55));
      const score = diamPx * centerWeight;
      if (!best || score > bestScore) {
        best = entry;
        bestScore = score;
      }
    }
    return best;
  }

  function _refreshAtmosphereBinding(nowMs) {
    if (!_atmoPP || !ATM) return;
    const now = Number(nowMs) || ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
    if ((now - _atmoLastPickT) < 120) return;
    _atmoLastPickT = now;

    const best = _pickAtmosphereEntry();
    if (!best) {
      if (_atmoActiveKey) _disableAtmosphere();
      return;
    }

    const mesh = best?.reps?.sphere_high || null;
    if (!mesh) {
      if (_atmoActiveKey) _disableAtmosphere();
      return;
    }

    if (_atmoActiveKey !== best.key || _atmoActiveMesh !== mesh) {
      _applyAtmosphere(best, mesh);
      return;
    }

    const planetPos = mesh.getAbsolutePosition ? mesh.getAbsolutePosition() : (best.bodyNode?.getAbsolutePosition?.() || best.bodyNode?.position || BABYLON.Vector3.Zero());
    const planetR = Number(best.radiusWorld || mesh.getBoundingInfo?.().boundingSphere?.radiusWorld || 1);
    const p = _getProcParamsForEntry(best) || {};
    const atmoR = planetR * Number(p.atmoRadiusMul || 1.055);
    try { ATM.setAtmosphereTarget(_atmoPP, mesh, planetR, atmoR, _getSunPosFor(best, planetPos)); } catch (_) {}
    try { ATM.enableAtmospherePP(_atmoPP, true); } catch (_) {}
  }

  function _disableAtmosphere() {
    if (!_atmoPP || !ATM) return;
    try { ATM.enableAtmospherePP(_atmoPP, false); } catch (_) {}
    try { _atmoPP._enabled = false; } catch (_) {}
    _atmoActiveKey = null;
    _atmoActiveEntry = null;
    _atmoActiveMesh = null;
  }

  function _applyAtmosphere(entry, mesh) {
    if (!_atmoPP || !ATM || !entry || !mesh) return;
    const p = mesh?.metadata?.__procParams;
    if (!p) return;

    const enabled = !!p.atmoEnabled;
    if (!enabled) { _disableAtmosphere(); return; }

    let planetR = Number(entry.radiusWorld || 0);
    if (!Number.isFinite(planetR) || planetR <= 0) {
      try { planetR = mesh.getBoundingInfo?.().boundingSphere?.radiusWorld || 1; } catch (_) { planetR = 1; }
    }
    const atmoR = planetR * Number(p.atmoRadiusMul || 1.055);

    try {
      _atmoPP._enabled = true;
      _atmoPP._useDepth = !!p.atmoUseDepth;
      _atmoPP._atmoStrength = Number(p.atmoStrength ?? 2.8);
      _atmoPP._mieStrength = Number(p.mieStrength ?? 2.4);
      _atmoPP._upperStrength = Number(p.upperStrength ?? 1.6);
      _atmoPP._steps = Number(p.atmoSteps ?? 48);
      _atmoPP._c0 = _hexToVec3(p.c0);
      _atmoPP._c1 = _hexToVec3(p.c1);
      _atmoPP._c2 = _hexToVec3(p.c2);
      _atmoPP._cloudAlpha = (p.cloudLayerEnabled ? 0.0 : Number(p.cloudAlpha ?? 0.22));
      _atmoPP._cloudScale = Number(p.cloudScale ?? 2.7);
      _atmoPP._cloudSharpness = Number(p.cloudSharpness ?? 2.2);
      _atmoPP._cloudWind = new BABYLON.Vector3(Number(p.cloudWindX ?? 0.02), 0.0, Number(p.cloudWindZ ?? 0.012));
      _atmoPP._cloudTint = _hexToVec3(p.cloudTint || '#eef6ff');
    } catch (_) {}

    const planetPos = mesh.getAbsolutePosition ? mesh.getAbsolutePosition() : (entry.bodyNode?.getAbsolutePosition?.() || entry.bodyNode?.position || BABYLON.Vector3.Zero());
    const sunPos = _getSunPosFor(entry, planetPos);
    try { ATM.setAtmosphereTarget(_atmoPP, mesh, planetR, atmoR, sunPos); } catch (_) {}
    try { ATM.enableAtmospherePP(_atmoPP, true); } catch (_) {}

    _atmoActiveKey = entry.key;
    _atmoActiveEntry = entry;
    _atmoActiveMesh = mesh;
  }

  const VALID_STATES = new Set(['none', 'dot', 'sphere_low', 'sphere_high']);
  function _coerceState(st) {
    const s = String(st || '').trim();
    return VALID_STATES.has(s) ? s : 'sphere_low';
  }
  CONFIG.initialState = _coerceState(CONFIG.initialState);

  // Entities
  const entries = new Map();
  const entryList = [];
  let _evalCursor = 0;
  let _lastEval = 0;

  // Camera motion (used to avoid heavy procedural regen while moving)
  let _camLastT = 0;
  let _camLastX = camera.position.x, _camLastY = camera.position.y, _camLastZ = camera.position.z;
  let _camSpeed = 0; // units/sec

  // Stats (lightweight)
  const _stats = {
    total: 0,
    states: { none: 0, dot: 0, sphere_low: 0, sphere_high: 0 },
    lastEvalProcessed: 0,
    lastEvalTransitions: 0,
    lastEvalMs: 0,
  };

  function _incState(st) {
    const s = _coerceState(st);
    _stats.states[s] = (_stats.states[s] || 0) + 1;
  }
  function _decState(st) {
    const s = _coerceState(st);
    _stats.states[s] = Math.max(0, (_stats.states[s] || 0) - 1);
  }

  // Keep a tiny set of animated reps (cloud drift, etc.) to update every frame.
  const _animEntries = new Set();

  // ------------------------------------------------------------
  // Optional Planet-Editor integration (procedural planets)
  // ------------------------------------------------------------
  const _presetPromiseByFile = new Map();
  const _upgradeInFlight = new Set();

  function _canUsePlanetEditor() {
    return !!(globalThis && globalThis.PlanetGenerator);
  }

  function _loadPresetParams(jsonFile) {
    if (!jsonFile) return Promise.reject(new Error('missing jsonFile'));
    const key = String(jsonFile);
    if (_presetPromiseByFile.has(key)) return _presetPromiseByFile.get(key);
    const p = fetch(`./planet-presets/${encodeURIComponent(key)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`preset fetch failed (${r.status}) for ${key}`);
        return r.json();
      })
      .then((j) => (j && j.params) ? j.params : j);
    _presetPromiseByFile.set(key, p);
    return p;
  }

  function _clamp(n, a, b) {
    n = Number(n);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function _smoothstep01(t) {
    t = _clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function _pickSubdivFromDiamPx(profile, diamPx, maxAllowed) {
    const levels = (profile?.planetEditorSubdivLevels && Array.isArray(profile.planetEditorSubdivLevels))
      ? profile.planetEditorSubdivLevels
      : [18, 24, 32, 42, 56, 72, 90, 99];

    const px0 = Number(profile?.planetEditorSubdivPxMin ?? 40);
    const px1 = Number(profile?.planetEditorSubdivPxMax ?? 1600);
    const dpx = Number(diamPx);

    if (!Number.isFinite(dpx)) return Math.min(levels[0], maxAllowed);
    if (px1 <= px0) return Math.min(levels[levels.length - 1], maxAllowed);

    const t = _smoothstep01((dpx - px0) / (px1 - px0));
    const idx = Math.round(t * (levels.length - 1));
    const pick = Number(levels[Math.max(0, Math.min(levels.length - 1, idx))] || levels[0]);
    return Math.floor(_clamp(pick, levels[0], maxAllowed));
  }

  // Compute an effective subdivision level from screen-space diameter.
  // IMPORTANT:
  // - Presets saved from the editor often store a modest `subdivisions` (e.g. 20-30)
  //   for responsiveness.
  // - In the simulator we want to allow *higher* quality (up to profile cap, typically 99)
  //   when the body is large on screen.
  // Therefore `maxSubdivAllowed` must be treated as an explicit cap (profile-driven),
  // not as the preset's `subdivisions` value.
  function _computeProcSubdiv(entry, profile, maxSubdivAllowed) {
    const worldPos = entry?.bodyNode?.getAbsolutePosition ? entry.bodyNode.getAbsolutePosition() : entry?.bodyNode?.position;
    const cap = _clamp(profile?.planetEditorMaxSubdivisions ?? 99, 6, 99);
    const maxAllowed = _clamp((maxSubdivAllowed ?? cap), 6, cap);
    if (!worldPos) return Math.floor(maxAllowed);
    const diamPx = computeDiameterPx({ engine, camera, worldPos, radiusWorld: entry.radiusWorld });
    return _pickSubdivFromDiamPx(profile, diamPx, maxAllowed);
  }

  function _normalizeEditorParams(raw, entry, profile) {
    const p = Object.assign({}, raw || {});

    // ------------------------------------------------------------
    // Scale-invariant presets (editor->simulator sync)
    // ------------------------------------------------------------
    const radiusRef = _clamp(Number(p.radiusRef ?? p.radius ?? 6), 0.25, 256);
    const desiredR = _clamp(Number(entry?.radiusWorld ?? radiusRef), 0.000001, 1000000);

    p.radiusRef = radiusRef;
    p.__radiusWorld = desiredR;
    p.__tuningScale = (radiusRef > 1e-9) ? (desiredR / radiusRef) : 1.0;
    p.__radiusScale = 1.0; // generate at desiredR => no post scaling

    // Generate at physical radius (desiredR)
    p.radius = desiredR;

    // seaHugBand is WORLD units in geosphere.js => convert from relative
    if (p.seaHugCoast) {
      if (typeof p.seaHugBandRel === 'number' && Number.isFinite(p.seaHugBandRel)) {
        p.seaHugBand = p.seaHugBandRel * desiredR;
      } else if (typeof p.seaHugBand === 'number' && Number.isFinite(p.seaHugBand)) {
        const rel = (radiusRef > 1e-9) ? (p.seaHugBand / radiusRef) : 0;
        p.seaHugBandRel = rel;
        p.seaHugBand = rel * desiredR;
      } else {
        const rel = (radiusRef > 1e-9) ? (0.45 / radiusRef) : 0.075;
        p.seaHugBandRel = rel;
        p.seaHugBand = rel * desiredR;
      }
    }

    // Match editor "derived by type"
    if (p.planetType === "GasGiant") {
      p.seaEnabled = false;
      p.cratersEnabled = false;
      p.colorsSnowEnabled = false;
      p.ridgedAmp = Math.min(p.ridgedAmp || 0, 0.05);
      p.mountainAmp = Math.min(p.mountainAmp || 0, 0.08);
      p.continentAmp = Math.min(p.continentAmp || 0, 0.05);
    }

    // Cloud layer normalization (kept)
    if (p.cloudLayerEnabled) {
      let mul = Number(p.cloudLayerMul ?? 1.018);
      if (p.planetType === "GasGiant" && Number.isFinite(mul) && mul > 1.2) {
        mul = 1.0 + (mul / 100.0);
      }
      mul = (p.planetType === "GasGiant")
        ? _clamp(mul, 1.005, 1.08)
        : _clamp(mul, 1.005, 2.56);
      p.cloudLayerMul = mul;
    }

    // Preset `subdivisions` is treated as a *baseline* (initial quality),
    // not as a hard cap. The simulator may refine above this value up to
    // `profile.planetEditorMaxSubdivisions` when the planet is large on screen.
    const maxSub = _clamp(profile?.planetEditorMaxSubdivisions ?? 99, 6, 99);
    const minSub = _clamp(profile?.planetEditorMinSubdivisions ?? 0, 0, maxSub);
    // Preset subdivisions are treated as a baseline, but we can force a higher baseline per profile
    // (useful for tiny bodies like moons at real scale).
    const presetSub = Math.floor(_clamp(p.subdivisions ?? 24, 6, maxSub));
    p.subdivisions = Math.max(presetSub, Math.floor(minSub));
    p.__presetSubdiv = p.subdivisions;
    p.__maxSubdiv = maxSub;

    // Rings: cap ring segments
    if (p.ringSegments !== undefined) p.ringSegments = Math.floor(_clamp(p.ringSegments, 32, 192));

    return p;
  }

  function _disposeProceduralRoot(mesh) {
    if (!mesh) return;
    const md = mesh.metadata || {};
    const disposeFn = md.__disposeOnDisable;
    if (typeof disposeFn === 'function') {
      try { disposeFn(); } catch (_) {}
    } else {
      try { mesh.dispose(); } catch (_) {}
    }
  }

  // LRU cache for procedural sphere_high meshes (disabled when cached)
  const _procCacheLRU = new Map(); // key -> mesh (insertion order = recency)

  function _cacheProcedural(entryKey, mesh) {
    if (!entryKey || !mesh) return;
    if (CONFIG.procCacheMax <= 0) {
      _disposeProceduralRoot(mesh);
      return;
    }

    // Refresh recency
    if (_procCacheLRU.has(entryKey)) _procCacheLRU.delete(entryKey);
    _procCacheLRU.set(entryKey, mesh);

    // Evict oldest
    while (_procCacheLRU.size > CONFIG.procCacheMax) {
      const oldest = _procCacheLRU.entries().next().value;
      if (!oldest) break;
      const [oldKey, oldMesh] = oldest;
      _procCacheLRU.delete(oldKey);

      const e = entries.get(oldKey);
      if (e?.reps?.sphere_high === oldMesh) e.reps.sphere_high = null;
      _disposeProceduralRoot(oldMesh);
    }
  }

  async function _upgradeSphereHighToPlanetEditor(entry, placeholderMesh) {
    if (!entry || !placeholderMesh) return;
    if (!_canUsePlanetEditor()) return;

    const jsonFile = entry?.appearance?.jsonFile;
    if (!jsonFile) return;

    const upgradeKey = `${entry.key}::${String(jsonFile)}`;
    if (_upgradeInFlight.has(upgradeKey)) return;
    _upgradeInFlight.add(upgradeKey);

    try {
      const raw = await _loadPresetParams(jsonFile);
      const p = _normalizeEditorParams(raw, entry, entry.profile);

      // Dynamic subdivisions: based on distance+size (screen-space diameter).
      // If enabled, we allow refinement up to the profile cap (typically 99),
      // while keeping the preset value as a baseline minimum.
      const presetBase = Number(p.__presetSubdiv || p.subdivisions || 24);
      const capMax = Number(p.__maxSubdiv || (entry.profile?.planetEditorMaxSubdivisions ?? 99));
      if (entry.profile?.planetEditorAutoSubdiv) {
        const eff = _computeProcSubdiv(entry, entry.profile, capMax);
        p.subdivisions = Math.max(
          Math.floor(_clamp(presetBase, 6, capMax)),
          Math.floor(_clamp(eff, 6, capMax))
        );
      }

      const Gen = globalThis.PlanetGenerator;
      const gen = new Gen(scene);
      gen.generate(p);

      // Rings (optional)
      if (globalThis.RingSystem && typeof globalThis.RingSystem.ensureRings === 'function') {
        try { globalThis.RingSystem.ensureRings(gen, p); } catch (_) {}
      }

      const root = gen.mesh;
      if (!root) throw new Error('PlanetGenerator did not create mesh');

      // La mesh procedural real se usará para colisión cercana.
      try { root.isPickable = true; } catch (_) {}

      root.parent = entry.bodyNode;
      root.position.set(0, 0, 0);

      // Parent optional children
      if (gen.seaMesh) {
        try { gen.seaMesh.parent = root; gen.seaMesh.position.set(0, 0, 0); } catch (_) {}
      }
      if (gen.cloudMesh) {
        try { gen.cloudMesh.parent = root; gen.cloudMesh.position.set(0, 0, 0); } catch (_) {}
      }
      if (gen.ringMeshes && Array.isArray(gen.ringMeshes)) {
        for (const rm of gen.ringMeshes) {
          if (!rm) continue;
          try { rm.parent = root; rm.position.set(0, 0, 0); } catch (_) {}

          // Ensure ring uses correct system light if available (visual fix)
          try {
            if (!rm.metadata) rm.metadata = {};
            rm.metadata.__ringSystem = entry.systemName;
            rm.metadata.__ringLight = lights?.getPrimaryLight?.(entry.systemName) || null;
          } catch (_) {}
        }
      }
      if (gen.ringMesh) {
        try { gen.ringMesh.parent = root; gen.ringMesh.position.set(0, 0, 0); } catch (_) {}
      }

      // No post scaling: generation uses desiredR (radiusWorld)
      try { root.scaling.set(1, 1, 1); } catch (_) {}

      try { root.renderingGroupId = 0; } catch (_) {}

      root.metadata = Object.assign({}, root.metadata, {
        __procRep: true,
        __planetEditorJson: String(jsonFile),
        // Save preset params for runtime atmosphere & visuals
        __procParams: p,

        __procSubdiv: Number(p.subdivisions || 0),
        // In-sim cap (profile-driven). Preset is baseline, not the max.
        __procSubdivMax: Number(p.__maxSubdiv || (entry.profile?.planetEditorMaxSubdivisions ?? 99) || p.subdivisions || 0),
        __procSubdivPreset: Number(p.__presetSubdiv || p.subdivisions || 0),
        __repUpdate: (dtMs) => {
          try { gen.updateClouds(dtMs, p); } catch (_) {}
        },
        __disposeOnDisable: () => {
          try {
            if (gen.ringMeshes && Array.isArray(gen.ringMeshes)) {
              for (const rm of gen.ringMeshes) if (rm) rm.dispose();
            }
            if (gen.ringMesh) gen.ringMesh.dispose();
            if (gen._ringItemTex && Array.isArray(gen._ringItemTex)) {
              for (const t of gen._ringItemTex) if (t) t.dispose();
            }
          } catch (_) {}
          try { gen.dispose(); } catch (_) {}
        },
      });

      // Light linking
      if (lights && typeof lights.includeMesh === 'function' && entry.profile?.lit) {
        try { lights.includeMesh(entry.systemName, root); } catch (_) {}
        try { if (gen.seaMesh) lights.includeMesh(entry.systemName, gen.seaMesh); } catch (_) {}
        try { if (gen.cloudMesh) lights.includeMesh(entry.systemName, gen.cloudMesh); } catch (_) {}
        try {
          if (gen.ringMeshes && Array.isArray(gen.ringMeshes)) {
            for (const rm of gen.ringMeshes) if (rm) {
              try { lights.includeMesh(entry.systemName, rm); } catch (_) {}
            }
          }
        } catch (_) {}
      }

      // Replace placeholder
      const prev = entry.reps?.sphere_high;
      if (prev && prev !== root) {
        try { prev.setEnabled(false); } catch (_) { prev.isVisible = false; }
        try { prev.dispose(); } catch (_) {}
      }

      entry.reps.sphere_high = root;
      applyCommonMeshMetadata(root, entry);

      if (entry.activeState === 'sphere_high') {
        try { root.setEnabled(true); } catch (_) { root.isVisible = true; }
		setTerrainCollisionMesh(entry, root);
        if (labelsApi && typeof labelsApi.registerLabel === 'function' && entry.label?.key) {
          try { labelsApi.registerLabel(entry.label.key, entry.label.text, entry.label.kind, root, entry.label.extra); } catch (_) {}
        }
        _animEntries.add(entry);

        // Atmosphere (bind to this procedural planet, editor-style)
        try { _applyAtmosphere(entry, root); } catch (_) {}
      } else {
        if (entry?.bodyNode?.metadata?.__terrainCollisionMesh === root) {
          setTerrainCollisionMesh(entry, null);
        }
        try { root.setEnabled(false); } catch (_) { root.isVisible = false; }
      }
    } catch (e) {
      // Keep placeholder
      // console.warn('[repMgr] Planet-Editor upgrade failed:', e);
    } finally {
      _upgradeInFlight.delete(upgradeKey);
    }
  }
  
  function _maybeRefineProcedural(entry) {
    if (!entry) return;
    if (!entry.profile?.planetEditorAutoSubdiv) return;
    if (entry.activeState !== 'sphere_high') return;

    const maxSpeed = Number(CONFIG.procRefineMaxCamSpeed || 0);
    if (maxSpeed > 0 && _camSpeed > maxSpeed) return;

    const mesh = entry?.reps?.sphere_high;
    if (!mesh?.metadata?.__procRep) return;

    // If we already locked this body at max quality, never regenerate again.
    if (entry._procLockedMax) return;


    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const cooldown = Number(entry.profile?.planetEditorRefineCooldownMs ?? 1200);
    if ((now - (entry._procRefineLast || 0)) < cooldown) return;
    entry._procRefineLast = now;

    const cur = Number(mesh.metadata.__procSubdiv || 0);
    const maxQ = Number(mesh.metadata.__procSubdivMax || cur);
    if (!Number.isFinite(cur) || !Number.isFinite(maxQ) || cur >= maxQ) return;

    const worldPos = entry?.bodyNode?.getAbsolutePosition ? entry.bodyNode.getAbsolutePosition() : entry?.bodyNode?.position;
    const diamPx = computeDiameterPx({ engine, camera, worldPos, radiusWorld: entry.radiusWorld });

    // If the body is huge on screen => jump straight to MAX quality ONCE, then lock.
    const lockPx = Number(entry.profile?.planetEditorLockMaxAtPx ?? 0);
    let desired = _computeProcSubdiv(entry, entry.profile, maxQ);

    // Never go below the preset baseline (helps preserve the editor look even at mid distances).
    const presetBase = Number(mesh.metadata.__procSubdivPreset || 0);
    if (Number.isFinite(presetBase) && presetBase > 0) desired = Math.max(desired, presetBase);
    if (lockPx > 0 && Number.isFinite(diamPx) && diamPx >= lockPx) {
      desired = maxQ;
    }

    const minDelta = Number(entry.profile?.planetEditorRefineMinDelta ?? 8);

    // Only refine upwards (never down-regenerate), and only if worth it.
    if (Number.isFinite(desired) && desired >= (cur + minDelta)) {
      // Re-run upgrade to replace the current procedural mesh with higher subdiv
      // (keeps same json preset, only increases resolution)
      // Note: uses the same in-flight guard, so it won't spam.
      _upgradeSphereHighToPlanetEditor(entry, mesh);

      // If we just requested MAX, lock to prevent further "reconstruction" while flying.
      if (desired >= maxQ) {
        entry._procLockedMax = true;
      }
    }
  }

  // ------------------------------------------------------------
  // Core helpers
  // ------------------------------------------------------------
  function getProfile(kind) {
    return PROFILES && PROFILES[kind] ? PROFILES[kind] : (PROFILES.planet || null);
  }

  function getBandIndex(profile, diamPx) {
    const list = profile?.stateByDiamPx || [];
    for (let i = 0; i < list.length; i++) {
      if (diamPx <= list[i].max) return i;
    }
    return Math.max(0, list.length - 1);
  }

  function bandToState(profile, bandIdx) {
    const list = profile?.stateByDiamPx || [];
    if (!list.length) return 'sphere_low';
    const i = Math.max(0, Math.min(list.length - 1, bandIdx));
    return list[i].state;
  }

  function applyCommonMeshMetadata(mesh, entry) {
    if (!mesh) return;
    mesh.metadata = Object.assign({}, mesh.metadata, {
      kmPerUnit: entry.kmPerUnit,
      systemName: entry.systemName,
      bodyId: entry.bodyId,
      kind: entry.kind,
      repState: entry.activeState,
    });
    if (entry.label?.key) mesh.metadata.labelKey = entry.label.key;
  }

  function setTerrainCollisionMesh(entry, mesh) {
    const bodyNode = entry?.bodyNode;
    if (!bodyNode) return;
    if (!bodyNode.metadata) bodyNode.metadata = {};

    if (mesh) {
      bodyNode.metadata.__terrainCollisionMesh = mesh;
    } else {
      delete bodyNode.metadata.__terrainCollisionMesh;
    }
  }

  function ensureRepMesh(entry, state) {
    const st = _coerceState(state);
    if (!entry || !st) return null;
    if (st !== 'none' && entry.reps[st]) return entry.reps[st];

    const profile = entry.profile;
    let mesh = null;

    if (st === 'dot') {
      mesh = createDotRep({ scene, entry, profile });
    } else if (st === 'sphere_low') {
      mesh = createSphereRep({
        scene,
        entry,
        profile,
        segments: profile?.sphereLowSegments || 12,
        repTag: 'low',
      });
    } else if (st === 'sphere_high') {
      mesh = createSphereRep({
        scene,
        entry,
        profile,
        segments: profile?.sphereHighSegments || 20,
        repTag: 'high',
      });

      const wantsProc = (entry.kind === 'planet' || entry.kind === 'moon' || entry.kind === 'asteroid' || entry.kind === 'comet')
        && entry?.appearance?.jsonFile;
      if (wantsProc && _canUsePlanetEditor()) {
        _upgradeSphereHighToPlanetEditor(entry, mesh);
      }
    } else {
      mesh = null;
    }

    if (mesh) {
      mesh.parent = entry.bodyNode;
      // Picking: enable ray-targeting for relevant bodies.
      // Avoid making star DOT pickable (it would steal targeting from systems at long range).
      const k = String(entry.kind || '');
      const pickableByState = (st === 'sphere_low' || st === 'sphere_high')
        || (st === 'dot' && (k === 'planet' || k === 'moon' || k === 'asteroid' || k === 'comet' || k === 'artificialSatellite'));
      const isStarDot = (k === 'star' && st === 'dot');
      mesh.isPickable = !!pickableByState && !isStarDot;
      applyCommonMeshMetadata(mesh, entry);
      try { mesh.setEnabled(false); } catch (_) { mesh.isVisible = false; }

      if (lights && typeof lights.includeMesh === 'function' && entry.profile?.lit) {
        const wantsLight = (st === 'sphere_low' || st === 'sphere_high');
        if (wantsLight) {
          try { lights.includeMesh(entry.systemName, mesh); } catch (_) {}
        }
      }

      entry.reps[st] = mesh;
    }

    return mesh;
  }

  function updateDotScale(entry, pxPerUnit) {
    const m = entry?.reps?.dot;
    if (!m) return;
    const minPx = Number(entry.profile?.dotMinPx || 3);
    const s = computeDotWorldScale({ minPx, pxPerUnit });
    try { m.scaling.set(s, s, 1); } catch (_) {
      try { m.scaling.x = s; m.scaling.y = s; } catch (_) {}
    }
  }

  function chooseBandWithHysteresis(entry, desiredBand, diamPx) {
    const profile = entry.profile;
    const list = profile?.stateByDiamPx || [];
    const curBand = Number.isFinite(entry.currentBand) ? entry.currentBand : desiredBand;

    if (!list.length) return desiredBand;
    if (desiredBand === curBand) return desiredBand;

    const h = CONFIG.hysteresisRatio;

    if (desiredBand > curBand) {
      const boundary = Number(list[curBand]?.max);
      if (Number.isFinite(boundary) && diamPx < boundary * (1 + h)) return curBand;
      return desiredBand;
    }

    if (desiredBand < curBand) {
      const boundary = Number(list[desiredBand]?.max);
      if (Number.isFinite(boundary) && diamPx > boundary * (1 - h)) return curBand;
      return desiredBand;
    }

    return desiredBand;
  }

  function _refreshAnimTracking(entry) {
    if (!entry) return;
    const activeMesh = entry.reps?.[entry.activeState || ''] || null;
    const upd = activeMesh?.metadata?.__repUpdate;
    if (typeof upd === 'function' && (activeMesh?.isEnabled?.() ?? activeMesh?.isVisible)) {
      _animEntries.add(entry);
    } else {
      _animEntries.delete(entry);
    }
  }

  function setActiveState(entry, nextState) {
    if (!entry) return;
    const ns = _coerceState(nextState);
    const prev = _coerceState(entry.activeState);
    if (prev === ns) return;

    // Update stats
    if (entry.activeState) _decState(prev);

    // Disable all other reps
    for (const [st, m] of Object.entries(entry.reps)) {
      if (!m) continue;
      if (st === ns) continue;

      if (st === 'sphere_high' && entry?.bodyNode?.metadata?.__terrainCollisionMesh === m) {
        setTerrainCollisionMesh(entry, null);
      }	  

      try { m.setEnabled(false); } catch (_) { m.isVisible = false; }

      // Procedural sphere_high is heavy: cache a few, otherwise free.
      if (st === 'sphere_high' && m?.metadata?.__procRep) {
        if (_atmoActiveKey && _atmoActiveKey === entry.key) {
          try { _disableAtmosphere(); } catch (_) {}
        }
        if (CONFIG.procCacheMax > 0) {
          _cacheProcedural(entry.key, m);
        } else {
          _disposeProceduralRoot(m);
          entry.reps[st] = null;
        }
      }
    }

    entry.activeState = ns;
    _incState(ns);

    // Enable new rep
    const m = ensureRepMesh(entry, ns);
    if (m) {
      applyCommonMeshMetadata(m, entry);
      try { m.setEnabled(true); } catch (_) { m.isVisible = true; }

      if (ns === 'sphere_high' && m?.metadata?.__procRep) {
        setTerrainCollisionMesh(entry, m);
        try { _applyAtmosphere(entry, m); } catch (_) {}
      } else if (_atmoActiveKey && _atmoActiveKey === entry.key) {
        try { _disableAtmosphere(); } catch (_) {}
        setTerrainCollisionMesh(entry, null);
      } else {
        setTerrainCollisionMesh(entry, null);
      }

      // Re-bind label target to the active mesh
      if (labelsApi && typeof labelsApi.registerLabel === 'function' && entry.label?.key) {
        try { labelsApi.registerLabel(entry.label.key, entry.label.text, entry.label.kind, m, entry.label.extra); } catch (_) {}
      }
    } else {
      // 'none': bind label to physical node
      if (labelsApi && typeof labelsApi.registerLabel === 'function' && entry.label?.key) {
        try { labelsApi.registerLabel(entry.label.key, entry.label.text, entry.label.kind, entry.bodyNode, entry.label.extra); } catch (_) {}
      }
    }

    _refreshAnimTracking(entry);
  }

  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------
  function registerEntity(params) {
    const { kind, systemName, bodyId, bodyNode, radiusKm, kmPerUnit, color, label, appearance } = params || {};
    if (!kind || !bodyNode) throw new Error('[repMgr] registerEntity requires kind/bodyNode');

    const profile = getProfile(kind);

    const kmPU = (typeof kmPerUnit === 'number' && kmPerUnit > 0) ? kmPerUnit : (bodyNode?.metadata?.kmPerUnit || 1e6);
    const rKm = Number(radiusKm);
    const rWorld = (Number.isFinite(rKm) && rKm > 0) ? (rKm / kmPU) : 0.001;

    const entry = {
      key: _keyOf(kind, systemName, bodyId),
      kind,
      systemName: systemName || '',
      bodyId,
      bodyNode,
      radiusKm: rKm,
      kmPerUnit: kmPU,
      radiusWorld: rWorld,
      color,
      label,
      appearance,
      profile,
      reps: Object.create(null),
      activeState: null,
      currentBand: null,
      _stateChangedAt: 0,
    };

    entries.set(entry.key, entry);
    entryList.push(entry);
    _stats.total = entries.size;

    // Initial rep
    if (CONFIG.createInitialRep) {
      const initState = CONFIG.initialState;
      ensureRepMesh(entry, initState);
      setActiveState(entry, initState);
    }

    // Inform labels index (optional)
    try {
      labelsApi?.onRegistered?.({
        key: entry.key,
        kind: entry.kind,
        systemName: entry.systemName,
        bodyId: entry.bodyId,
        radiusKm: entry.radiusKm,
        radiusWorld: entry.radiusWorld,
      });
    } catch (_) {}

    return entry;
  }

  function update() {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    // Camera speed (units/sec)
    if (camera && camera.position) {
      const t = now;
      const dt = (t - (_camLastT || t)) / 1000;
      if (dt > 0) {
        const dx = camera.position.x - _camLastX;
        const dy = camera.position.y - _camLastY;
        const dz = camera.position.z - _camLastZ;
        _camSpeed = Math.sqrt(dx*dx + dy*dy + dz*dz) / dt;
      } else {
        _camSpeed = 0;
      }
      _camLastT = t;
      _camLastX = camera.position.x; _camLastY = camera.position.y; _camLastZ = camera.position.z;
    }

    // Always animate procedural reps (cloud drift, etc.) even when evaluation is throttled.
    const dtMs = (engine && typeof engine.getDeltaTime === 'function') ? engine.getDeltaTime() : 16;
    if (_animEntries.size) {
      for (const entry of _animEntries) {
        // Optional: refine procedural planet quality as you get closer.
        // Throttled by cooldown and only increases (no oscillation).
        try { _maybeRefineProcedural(entry); } catch (_) {}

        const activeMesh = entry?.reps?.[entry.activeState || ''] || null;
        const upd = activeMesh?.metadata?.__repUpdate;
        if (typeof upd === 'function') {
          try { upd(dtMs); } catch (_) {}
        }
      }
    }
	
    // La atmósfera debe decidirse con las posiciones/LOD ya actualizadas por el simulador,
    // no en un observer anterior al floating-origin y a las órbitas.
    if (_atmoPP && ATM) {
      try { _refreshAtmosphereBinding(now); } catch (_) {}
      if (_atmoPP._enabled && typeof ATM.updateAtmospherePP === 'function') {
        try { ATM.updateAtmospherePP(_atmoPP, (now * 0.001)); } catch (_) {}
        try {
          if (_atmoActiveEntry && _atmoActiveMesh) {
            const pos = _atmoActiveMesh.getAbsolutePosition ? _atmoActiveMesh.getAbsolutePosition() : BABYLON.Vector3.Zero();
            _atmoPP._sunPos = _getSunPosFor(_atmoActiveEntry, pos);
          }
        } catch (_) {}
      }
    }

    if (CONFIG.evalIntervalMs > 0 && (now - _lastEval) < CONFIG.evalIntervalMs) return;
    _lastEval = now;

    const total = entryList.length;
    if (!total) return;

    const maxN = (CONFIG.evalMaxPerTick > 0) ? Math.min(CONFIG.evalMaxPerTick, total) : total;
    const evalBudget = (CONFIG.evalBudgetMs > 0) ? CONFIG.evalBudgetMs : Infinity;

    const transMax = (CONFIG.transitionMaxPerTick > 0) ? CONFIG.transitionMaxPerTick : Infinity;
    const transBudget = (CONFIG.transitionBudgetMs > 0) ? CONFIG.transitionBudgetMs : Infinity;

    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    let processed = 0;
    let transitions = 0;

    while (processed < maxN) {
      const entry = entryList[_evalCursor];
      _evalCursor = (_evalCursor + 1) % total;
      processed++;

      if (!entry || !entry.bodyNode) continue;

      const worldPos = entry.bodyNode.getAbsolutePosition ? entry.bodyNode.getAbsolutePosition() : entry.bodyNode.position;
      if (!worldPos) continue;

      const camPos = camera.globalPosition || camera.position;
      const d = BABYLON.Vector3.Distance(camPos, worldPos);
      const pxPerUnit = computePxPerUnit({ engine, camera, distance: d });

      const diamPx = computeDiameterPx({ engine, camera, worldPos, radiusWorld: entry.radiusWorld });

      let desiredBand = getBandIndex(entry.profile, diamPx);
      desiredBand = chooseBandWithHysteresis(entry, desiredBand, diamPx);
      const desiredState = bandToState(entry.profile, desiredBand);
      entry.currentBand = desiredBand;

      if (desiredState !== entry.activeState) {
        const timeSinceChange = now - (entry._stateChangedAt || 0);

        // Enforce minimum hold time to avoid rapid LOD oscillation
        if (timeSinceChange >= CONFIG.minStateHoldMs) {
          const spent = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
          if (transitions < transMax && spent <= transBudget) {
            ensureRepMesh(entry, desiredState);
            setActiveState(entry, desiredState);
            entry._stateChangedAt = now;
            transitions++;
          }
        }
      }

      if (desiredState === 'dot' && pxPerUnit > 0) {
        updateDotScale(entry, pxPerUnit);
      }

      const spent = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      if (spent >= evalBudget) break;
    }

    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    _stats.lastEvalProcessed = processed;
    _stats.lastEvalTransitions = transitions;
    _stats.lastEvalMs = (t1 - t0);

    // Si en esta pasada se ha activado un procedural sphere_high, re-evaluamos aquí
    // para que la atmósfera aparezca en el mismo frame y no un tick después.
    if (_atmoPP && ATM) {
      try { _refreshAtmosphereBinding(now); } catch (_) {}
    }
  }

  function getEntry(kind, systemName, bodyId) {
    return entries.get(_keyOf(kind, systemName, bodyId)) || null;
  }

  function getActiveMesh(kind, systemName, bodyId) {
    const e = getEntry(kind, systemName, bodyId);
    if (!e) return null;
    const st = e.activeState;
    return st && e.reps ? e.reps[st] : null;
  }

  function getStats() {
    return {
      total: _stats.total,
      states: Object.assign({}, _stats.states),
      lastEvalProcessed: _stats.lastEvalProcessed,
      lastEvalTransitions: _stats.lastEvalTransitions,
      lastEvalMs: _stats.lastEvalMs,
      config: {
        evalIntervalMs: CONFIG.evalIntervalMs,
        evalMaxPerTick: CONFIG.evalMaxPerTick,
        evalBudgetMs: CONFIG.evalBudgetMs,
        transitionMaxPerTick: CONFIG.transitionMaxPerTick,
        transitionBudgetMs: CONFIG.transitionBudgetMs,
        hysteresisRatio: CONFIG.hysteresisRatio,
        procCacheMax: CONFIG.procCacheMax,
      },
    };
  }

  return {
    registerEntity,
    update,
    getEntry,
    getActiveMesh,
    getStats,
    profiles: PROFILES,
    config: CONFIG,
  };
}
