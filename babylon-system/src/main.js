import { createLowPolyFarPlanet } from "./planets/farPlanet.js";
import { loadPlanetConfig, buildRuntimePlanetParams, createJsonPlanet } from "./planets/jsonPlanet.js";
import { makeRings, updateRings } from "./planets/rings.js";
import { createStarDotManager, createStarDotSprite } from "./galaxy/starDots.js";
import { buildSystems } from "./galaxy/systems.js";
import { throttleMs } from "./utils/throttle.js";
import {
  createAtmospherePostProcess,
  attachDepthForAtmosphere,
  setAtmosphereTarget,
  enableAtmospherePP,
  updateAtmospherePP,
} from "./planets/atmospherePP.js";



    // ====================================================================
    // 0) Engine
    // ====================================================================
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      powerPreference: "high-performance",
      adaptToDeviceRatio: true,
    });
    // Rendimiento: baja resolución interna en pantallas densas
    try {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      // 1.0 = nativo, 1.25-1.6 suele ser un buen equilibrio
      engine.setHardwareScalingLevel(dpr > 1.25 ? 1.35 : 1.0);
    } catch(e) {}

    // ====================================================================
    // 4) Scene
    // ====================================================================
    const ui = {
      camOrbitBtn: document.getElementById("camOrbit"),
      camFlyBtn: document.getElementById("camFly"),
      camSurfaceBtn: document.getElementById("camSurface"),
      speedRange: document.getElementById("speedRange"),
      speedVal: document.getElementById("speedVal"),
      planetSelect: document.getElementById("planetSelect"),
      approachBtn: document.getElementById("approachBtn"),
      debugInfo: document.getElementById("debugInfo"),
      modePill: document.getElementById("modePill"),
      toggleLabels: document.getElementById("toggleLabels"),
      labelsPill: document.getElementById("labelsPill"),
    };

    let timeScale = 1.0;

    const createScene = async () => {
      const scn = new BABYLON.Scene(engine);
      const starDotMgr = createStarDotManager(scn, 8000);
	  

      // Star-dots (sprites): deben renderizar "como fondo" y respetar profundidad
      // Si están en un renderingGroup > planetas, se dibujan encima (parece que el agua queda detrás).
      try { if (starDotMgr) starDotMgr.renderingGroupId = 0; } catch(e) {}
      try { if (starDotMgr) starDotMgr.disableDepthWrite = true; } catch(e) {}
 
      // Para escalas galácticas (sistemas muy separados) sin clipping ni z-fighting
      // (si el build de Babylon no lo soporta, no pasa nada)
      try { scn.useLogarithmicDepth = true; } catch(e) {}
      // Rendimiento: evita trabajo extra de picking continuo
      scn.skipPointerMovePicking = true;
      scn.blockMaterialDirtyMechanism = true;
      // Fondo realmente negro (evita el "cielo gris" cuando sube la exposición/bloom)
      scn.clearColor = new BABYLON.Color4(0, 0, 0, 1);
	  
      // Iluminación Global (IBL) muy suave (sin crear skybox/ground)
      scn.environmentIntensity = 0.15;

      // Background stars (point cloud, estilo "inicio"; sin URLs externas)
      const starsPCS = new BABYLON.PointsCloudSystem("stars", 1, scn);
      const starCount = 12000; // rendimiento
      const starRadius = 2800;
      let starsMesh = null;

      starsPCS.addPoints(starCount, (p) => {
        // distribución esférica (más estrellas lejos)
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);

        const r = starRadius * (0.35 + 0.65 * Math.pow(Math.random(), 0.35));
        p.position.x = r * Math.sin(phi) * Math.cos(theta);
        p.position.y = r * Math.cos(phi);
        p.position.z = r * Math.sin(phi) * Math.sin(theta);

        // brillo con ligera variación
        const a = 0.55 + Math.random() * 0.45;
        p.color = new BABYLON.Color4(1, 1, 1, a);
      });

      starsPCS.buildMeshAsync().then((m) => {
        starsMesh = m;
        starsMesh.isPickable = false;
        starsMesh.alwaysSelectAsActiveMesh = true;

        const starsMat = new BABYLON.StandardMaterial("starsMat", scn);
        starsMat.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        starsMat.disableLighting = true;
        starsMat.pointsCloud = true;

		starsMat.pointSize = 1.15;
        starsMesh.material = starsMat;
      });
	  
      // Throttle: este ajuste no necesita 60fps (con 4–10Hz va perfecto)
      const updateStarDotsSize = throttleMs(() => {
        const cam = scn.activeCamera;
        if (!cam || !galaxyStarDots.length) return;

        const vh = engine.getRenderHeight(true);
        const fov = (typeof cam.fov === "number") ? cam.fov : 0.8;
        const tanHalf = Math.tan(fov * 0.5);
        const camPos = cam.globalPosition || cam.position;
        const targetPx = 1.25;

        for (const s of galaxyStarDots) {
          const dot = s.dot;
          if (!dot) continue;
          if (typeof dot.isDisposed === "function" && dot.isDisposed()) continue;
          // Mantener el dot exactamente en la posición actual de la estrella (3D real)
          if (s.star && dot.position && typeof dot.position.copyFrom === "function" && typeof s.star.getAbsolutePosition === "function") {
            dot.position.copyFrom(s.star.getAbsolutePosition());
          }

          const p = (typeof dot.getAbsolutePosition === "function")
            ? dot.getAbsolutePosition()
            : (dot.position || null);
          if (!p) continue;

          const dist = BABYLON.Vector3.Distance(camPos, p);
          const worldPerPx = (2 * dist * tanHalf) / Math.max(1, vh);
          const size = Math.max(worldPerPx * targetPx, s.radius * 0.035);

          if (dot.scaling && typeof dot.scaling.setAll === "function") dot.scaling.setAll(size);
          else if (typeof dot.size === "number") dot.size = size;
        }
      }, 250);

      scn.onBeforeRenderObservable.add(() => {
        if (starsMesh && scn.activeCamera) {
          starsMesh.position.copyFrom(scn.activeCamera.position);
        }

	    updateStarDotsSize();
      });

      // Cameras
      const cameraOrbit = new BABYLON.ArcRotateCamera("camOrbit", -Math.PI/2, Math.PI/3, 260, BABYLON.Vector3.Zero(), scn);
      cameraOrbit.lowerRadiusLimit = 8;
      cameraOrbit.upperRadiusLimit = 2500;
      cameraOrbit.wheelDeltaPercentage = 0.01;
      // En órbita queremos rotar/zoom alrededor de un objetivo (sin pan libre)
      cameraOrbit.panningSensibility = 0;
      // Galaxia: que las estrellas/sistemas lejanos no desaparezcan por el plano lejano
      const GALAXY_MAX_Z = 5e7;
      cameraOrbit.maxZ = GALAXY_MAX_Z;
      cameraOrbit.attachControl(canvas, true);

      const cameraFly = new BABYLON.UniversalCamera("camFly", new BABYLON.Vector3(0, 60, -220), scn);
      cameraFly.minZ = 0.1;
	  cameraFly.maxZ = GALAXY_MAX_Z;
      // Velocidad base + turbo (Shift) para vuelo libre
      const FLY_SPEED_BASE = 2.2;
      const FLY_SPEED_SPRINT = 7.5; // ajusta a gusto (más alto = turbo más bestia)
      cameraFly.speed = FLY_SPEED_BASE;
      cameraFly._flyBaseSpeed = FLY_SPEED_BASE;
      cameraFly._flySprintSpeed = FLY_SPEED_SPRINT;
      cameraFly.angularSensibility = 4000;
      cameraFly.keysUp = [87];    // W
      cameraFly.keysDown = [83];  // S
      cameraFly.keysLeft = [65];  // A
      cameraFly.keysRight = [68]; // D
      // add vertical controls
      cameraFly.keysUpward = [32];       // Space up
      cameraFly.keysDownward = [17, 67]; // Ctrl or C down
	  
      // ------------------------------------------------------------
      // Collisions: impedir atravesar cuerpos celestes (fly)
      // ------------------------------------------------------------
      scn.collisionsEnabled = false; // Optim: usamos colisión esférica barata + raycasts en superficie
      cameraFly.checkCollisions = false;
      cameraFly.applyGravity = false;
      cameraFly.ellipsoid = new BABYLON.Vector3(1.2, 1.2, 1.2);
      cameraFly.ellipsoidOffset = new BABYLON.Vector3(0, 1.2, 0);
      cameraFly.onCollide = (collidedMesh) => {
        // pequeño "rebote"/freno para que se note el impacto
        try { cameraFly.cameraDirection.scaleInPlace(-0.25); } catch(e) {}
      };

      // Surface camera: use a playerRoot for proper orientation
      const playerRoot = new BABYLON.TransformNode("playerRoot", scn);
      playerRoot.rotationQuaternion = BABYLON.Quaternion.Identity();

      const cameraSurface = new BABYLON.UniversalCamera("camSurface", new BABYLON.Vector3(0, 0, 0), scn);
      cameraSurface.parent = playerRoot;
      cameraSurface.minZ = 0.05;
	  cameraSurface.maxZ = GALAXY_MAX_Z;
      cameraSurface.speed = 0; // we implement movement ourselves
      cameraSurface.angularSensibility = 3500;

      scn.activeCamera = cameraOrbit;
	  
      // ------------------------------------------------------------
      // Atmósfera screen-space (post-process) estilo "Unity"
      // (se recrea al cambiar de cámara)
      // ------------------------------------------------------------
      let atmoPP = null;
	  let atmoPPCam = null;
      function ensureAtmoPPForCamera(cam) {
        if (!cam) return;
        try {
          if (atmoPP && atmoPPCam) {
            atmoPPCam.detachPostProcess(atmoPP);
          }
        } catch (e) {}
        try { if (atmoPP) atmoPP.dispose(); } catch (e) {}
        atmoPP = createAtmospherePostProcess(scn, cam);
		atmoPPCam = cam;
        // Depth ayuda a que la atmósfera no se dibuje "por delante" de objetos cercanos
        try { attachDepthForAtmosphere(scn, cam, atmoPP); } catch (e) {}
      }

      ensureAtmoPPForCamera(scn.activeCamera);


      // Luz de "linterna" en superficie (evita que el terreno quede negro si el sol no incluye los chunks)
      const playerLamp = new BABYLON.PointLight("playerLamp", new BABYLON.Vector3(0, 0.25, 0), scn);
      playerLamp.parent = cameraSurface;
      playerLamp.intensity = 0.85;
      playerLamp.range = 140;
      playerLamp.setEnabled(false);

      // Lights
      const sunLight = new BABYLON.PointLight("sunLight", BABYLON.Vector3.Zero(), scn);
      // More intensity so PBR vertex-colored planets read well without needing a skybox.
      sunLight.intensity = 7.5;
      sunLight.range = 20000;
      // IMPORTANTE: en escalas grandes, el falloff físico hace que "no llegue" luz
      // Forzamos caída estándar (no inverse-square)
      try { sunLight.falloffType = BABYLON.Light.FALLOFF_STANDARD; } catch(e) {}
      try { sunLight.usePhysicalLightFalloff = false; } catch(e) {}
      
      // Light linking: Canopus sólo ilumina su propio sistema (mejora rendimiento y evita 'todo gira/ilumina Canopus')
      const mainLitMeshes = [];
      sunLight.includedOnlyMeshes = mainLitMeshes;

      // Mapear "estrella -> luz" para poder incluir también los chunks procedurales en el light correcto
      const lightByStarMesh = new Map(); // starMesh -> PointLight

      // Evita duplicados cuando metemos meshes a includedOnlyMeshes
      const _litKeySet = new Set();
      function includeMeshInBodyLight(mesh, body) {
        if (!mesh || !body) return;
        const star = body.starRef;
        const l = star ? lightByStarMesh.get(star) : null;

        // key estable por mesh (uniqueId existe en Mesh)
        const mid = (mesh.uniqueId != null) ? mesh.uniqueId : (mesh.id || mesh.name);

        if (l && l.includedOnlyMeshes) {
          const key = l.name + "::" + mid;
          if (_litKeySet.has(key)) return;
          _litKeySet.add(key);
          l.includedOnlyMeshes.push(mesh);
        } else {
          // core (sunLight) usa mainLitMeshes
          const key = "sunLight::" + mid;
          if (_litKeySet.has(key)) return;
          _litKeySet.add(key);
          mainLitMeshes.push(mesh);
        }
      }

      // ------------------------------------------------------------
      // Safety net: (re)link meshes to their system light periodically.
      // This prevents "some planets are dark" if a mesh was recreated (LOD)
      // or created before a light list was ready.
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
        }
      }

      function updateExtraSystemShadows() {
        const now = performance.now();
        if (now - _extraShadowTick < EXTRA_SHADOW.updateMs) return;
        _extraShadowTick = now;

        const cam = scn.activeCamera;
        if (!cam) return;

        // Pick nearest non-core system light
        let best = null;
        let bestD2 = Infinity;
        const camPos = cam.position;

        for (const s of systemLights) {
          if (!s || !s.light || !s.root) continue;
          // systemLights does NOT include core (sunLight), only extras
          const d2 = BABYLON.Vector3.DistanceSquared(camPos, s.root.getAbsolutePosition());
          if (d2 < bestD2) { bestD2 = d2; best = s; }
        }

        const enable = best && (bestD2 <= (EXTRA_SHADOW.enableDist * EXTRA_SHADOW.enableDist));
        const targetSystemId = enable ? best.id : null;

        if (targetSystemId === extraShadowSystemId) return;

        // Switch / disable
        if (extraShadowGen) {
          try { extraShadowGen.dispose(); } catch(_) {}
          extraShadowGen = null;
        }
        extraShadowSystemId = targetSystemId;

        if (!enable) return;

        // Create new shadow generator for the nearest system
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

        // Register casters/receivers for this system
        for (const b of bodies.values()) {
          if (!b || b.systemId !== extraShadowSystemId) continue;
          if (b.farMesh) {
            b.farMesh.receiveShadows = true;
            try { extraShadowGen.addShadowCaster(b.farMesh, true); } catch(_) {}
          }
          if (b.ocean) {
            // Water looks better without shadow maps (avoid banding)
            b.ocean.receiveShadows = false;
          }
        }
      }	  

      const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scn);
      // A touch more fill light so distant planets don't read as pitch-black.
      hemi.intensity = 0.10;
      hemi.diffuse = new BABYLON.Color3(0.1, 0.1, 0.2); // Tinte azulado para ambiente espacial
      hemi.groundColor = new BABYLON.Color3(0,0,0);

      // Un pelín de ambiente para que no queden negros en superficie sin "subir" el cielo
      scn.ambientColor = new BABYLON.Color3(0.06, 0.06, 0.07);

      // Shadows (optional)
      const shadowGen = new BABYLON.ShadowGenerator(2048, sunLight);
      // Rendimiento: Poisson es mucho más barato que contact hardening
      shadowGen.usePoissonSampling = true;
      shadowGen.bias = 0.00025;
      shadowGen.normalBias = 0.01;	  

      // ------------------------------------------------------------
      // Dynamic per-system shadows (extras)
      // - Only one extra system gets a shadow map at a time (nearest to camera)
      // - Keeps performance predictable while allowing planet-to-planet/moon shadows
      // ------------------------------------------------------------
      let extraShadowGen = null;
      let extraShadowSystemId = null;
      const EXTRA_SHADOW = {
        enableDist: 3200,     // distance to system root to enable extra shadows
        updateMs: 600,        // throttle
        mapSize: 1024,        // 512/1024; 2048 is heavy for point light cubemaps
        bias: 0.00035,
        normalBias: 0.012,
      };
      let _extraShadowTick = 0;

      // Glow desactivado por rendimiento (ya tenemos halo del sol)
      // const glow = new BABYLON.GlowLayer("glow", scn);
      // glow.intensity = 0.12;

      // Textures (put these in: /textures/planets/)
      const T = (f) => "textures/planets/" + f;

      const mapsByName = {
        // Texturas opcionales (si las pones en /textures/planets/)
        // Si no existen, el código hace fallback a colores.
        "Canopus": { /* albedo: T("2k_sun.jpg") */ },
      };

      // ====================================================================
      // DUNE systems/data extracted to src/galaxy/systems.js
      const { coreSystem, extraSystems, bodyDefs, planetMeta } = buildSystems(T);

      // ====================================================================
      // ====================================================================
      // JSON planets (exported by generate-planet-js)
      // - Bodies can optionally declare def.jsonFile in src/galaxy/systems.js
      // - Everything else (rocky bodies): default.json (with per-name seed for variation)
      // NOTE: JSON files live in src/data/
      const planetParamsByName = new Map(); // bodyName -> params
      let defaultPlanetParams = null;

      // Load default params (fallback for any rocky body without a specific JSON)
      try {
        defaultPlanetParams = await loadPlanetConfig("src/data/default.json");
      } catch (e) {
        console.warn("[json planets] no se pudo cargar default.json", e);
        defaultPlanetParams = null;
      }

      // Collect specific JSON files declared in systems.js (centralized source of truth)
      const fileToBodies = new Map(); // file -> [bodyName,...]
      for (const sys of (extraSystems || [])) {
        for (const b of (sys.planets || [])) {
          if (b && b.jsonFile) {
            const f = String(b.jsonFile);
            if (!fileToBodies.has(f)) fileToBodies.set(f, []);
            fileToBodies.get(f).push(b.name);
          }
        }
        for (const b of (sys.moons || [])) {
          if (b && b.jsonFile) {
            const f = String(b.jsonFile);
            if (!fileToBodies.has(f)) fileToBodies.set(f, []);
            fileToBodies.get(f).push(b.name);
          }
        }
      }

      await Promise.all(
        [...fileToBodies.entries()].map(async ([file, bodyNames]) => {
          try {
            const params = await loadPlanetConfig("src/data/" + file);
            for (const name of bodyNames) planetParamsByName.set(name, params);
          } catch (e) {
            console.warn(`[json planets] no se pudo cargar ${file}`, e);
          }
        })
      );

// Optional: show build report from systems.js (also logged in console)
      try {
        const rep = window.__GALAXY_REPORT;
        const el = document.getElementById("galaxyReport");
        if (el && rep) {
          const c = rep.counts || {};
          const problems = rep.problems || {};
          const nWarn = (problems.missingSystemPos?.length || 0)
            + (problems.systemsNoStar?.length || 0)
            + (problems.planetsMissingOrbit?.length || 0)
            + (problems.planetsUnknownSystem?.length || 0)
            + (problems.duplicateIds?.length || 0)
            + (problems.duplicatePlanetNames?.length || 0)
            + (problems.moonsMissingParent?.length || 0);

          const head = (nWarn === 0)
            ? `<span class="ok">✓ Galaxy OK</span>`
            : `<span class="warn">⚠ Galaxy warnings: ${nWarn}</span>`;

          el.innerHTML = `${head}<br>`
            + `Systems: ${c.systems ?? 0}, Stars: ${c.stars ?? 0}, Planets: ${c.planets ?? 0}, Moons: ${c.moons ?? 0}`
            + (nWarn ? `<br><span class="warn">Ver consola ("GALAXY BUILD REPORT")</span>` : "");
        }
      } catch(e) {}

      // Create meshes
      const bodies = new Map(); // id => body (internal stable key)
      const orbitNodes = new Map(); // id => node rotated around its parent (star/planet)
      const moonOrbitNodes = new Map(); // id => node rotated around its parent planet
      let sunMesh = null; // set when Canopus is created via createStarSystem(coreSystem)
      let halo = null; // core-system halo mesh (created in createStarSystem for Canopus)

      // ------------------------------------------------------------
      // Stable IDs (avoid name collisions across systems / moons)
      // UI still shows ONLY the display name.
      // ------------------------------------------------------------
      const _normName = (s) => (typeof s === "string" ? s.trim() : "");
      const _bodyKey = (systemId, kind, name, parentKey = "") =>
        `${systemId || ""}|${kind || ""}|${parentKey || ""}|${name || ""}`;

      function findBodyByNameInSystem(name, systemId, preferredKind = "planet") {
        const n = _normName(name);
        if (!n) return null;
        // 1) exact match with preferred kind
        for (const b of bodies.values()) {
          if (!b || !b.def) continue;
          if (b.def.systemId !== systemId) continue;
          if (_normName(b.def.name) !== n) continue;
          if (b.def.kind === preferredKind) return b;
        }
        // 2) any match in system
        for (const b of bodies.values()) {
          if (!b || !b.def) continue;
          if (b.def.systemId !== systemId) continue;
          if (_normName(b.def.name) === n) return b;
        }
        return null;
      }

      // Ensure sunLight follows sun (in case you move it later)
      if (sunMesh) sunLight.position.copyFrom(sunMesh.position);
      // GUI labels (optional)
      const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui", true, scn);
      function createLabel(id, text, mesh) {
        const rect = new BABYLON.GUI.Rectangle("lbl_" + String(id));
        rect.background = "rgba(0,0,0,0.35)";
        rect.thickness = 1;
        rect.color = "rgba(255,255,255,0.25)";
        rect.cornerRadius = 8;
        rect.height = "22px";
        rect.width = "120px";
        rect.isHitTestVisible = false;

        const tb = new BABYLON.GUI.TextBlock();
        tb.text = text;
        tb.color = "#fff";
        tb.fontSize = 12;
        rect.addControl(tb);

        gui.addControl(rect);
        rect.linkWithMesh(mesh);
        rect.linkOffsetY = -20;

        // Devuelve también el TextBlock para poder actualizarlo si cambia el displayName
        rect._tb = tb;
        return rect;
      }

              // ============================================================
// Labels: registro + visibilidad (throttle)
// - Estrellas siempre visibles
// - Planetas y lunas: solo los cercanos (por ranking + distancia)
// - Permite apagar/encender desde UI
// ============================================================
const labelsById = new Map(); // id -> { rect, kind, mesh, name }
let showLabels = true;

function registerLabel(id, name, kind, mesh) {
  if (!mesh) return null;
  const key = String(id || "");
  if (!key) return null;
  let meta = labelsById.get(key);
  if (!meta) {
    const rect = createLabel(key, name, mesh);
    meta = { rect, tb: rect._tb || null, name, kind, mesh };
    labelsById.set(key, meta);
  } else {
    meta.kind = kind || meta.kind;
    meta.mesh = mesh || meta.mesh;
    meta.name = name || meta.name;
    // Re-link y actualiza el texto (por si cambió el displayName)
    try { meta.rect && meta.rect.linkWithMesh && meta.rect.linkWithMesh(mesh); } catch (e) {}
    try { (meta.tb || meta.rect._tb) && ((meta.tb || meta.rect._tb).text = meta.name); } catch (e) {}
  }
  return meta.rect;
}

const LABEL_NEAREST_BODIES = 10;   // cuántos planetas/lunas mostrar como "cercanos"
const LABEL_MAX_DIST = 1200;       // además, muestra cuerpos dentro de esta distancia
const LABEL_UPDATE_MS = 220;       // throttle del cálculo

function setAllLabelsVisible(v) {
  for (const { rect } of labelsById.values()) rect.isVisible = !!v;
}

function updateLabelVisibility(force = false) {
  if (!showLabels) { setAllLabelsVisible(false); return; }
  const cam = scn.activeCamera;
  if (!cam) return;

  const now = performance.now();
  if (!force && scn._lblTick && (now - scn._lblTick) < LABEL_UPDATE_MS) return;
  scn._lblTick = now;

  const camPos = cam.position;
  const maxD2 = LABEL_MAX_DIST * LABEL_MAX_DIST;

  // 1) estrellas siempre visibles
  for (const meta of labelsById.values()) {
    if (meta.kind === "sun") meta.rect.isVisible = true;
  }

  // 2) ranking de cercanos (planetas + lunas)
  const ranked = [];
  for (const [id, b] of bodies.entries()) {
    if (!b || !b.def || !b.farMesh) continue;
    const k = b.def.kind;
    if (k !== "planet" && k !== "moon") continue;
    const p = b.farMesh.getAbsolutePosition();
    const d2 = BABYLON.Vector3.DistanceSquared(camPos, p);
    ranked.push({ id, d2 });
  }
  ranked.sort((a,b)=>a.d2-b.d2);

  const visible = new Set();

  // Siempre visible: el seleccionado (si existe)
  try {
    const selId = ui && ui.planetSelect ? ui.planetSelect.value : null;
    if (selId) visible.add(selId);
  } catch(e) {}

  for (let i=0; i<ranked.length && i<LABEL_NEAREST_BODIES; i++) visible.add(ranked[i].id);
   for (const r of ranked) {
    if (r.d2 <= maxD2) visible.add(r.id);
     else break;
   }

  // 3) aplica visibilidad (todo lo que no sea estrella => depende del set)
  for (const [id, meta] of labelsById.entries()) {
    if (meta.kind === "sun") continue;
    meta.rect.isVisible = visible.has(id);
  }
}

// UI hook
if (ui.toggleLabels) {
  showLabels = !!ui.toggleLabels.checked;
  if (ui.labelsPill) ui.labelsPill.textContent = showLabels ? "ON" : "OFF";
  ui.toggleLabels.addEventListener("change", () => {
    showLabels = !!ui.toggleLabels.checked;
    if (ui.labelsPill) ui.labelsPill.textContent = showLabels ? "ON" : "OFF";
    updateLabelVisibility(true);
  });
}

      // Fill selector + labels
      ui.planetSelect.innerHTML = "";
      
      // ====================================================================
      // 3b) Create extra star systems (FAR-only por defecto)
      // ====================================================================
      const systemRoots = new Map(); // systemId -> root node
      const systemLights = []; // {light, root, range}
      const galaxyStarDots = []; // billboards para que las estrellas lejanas siempre se vean (>= 1px)
 
	  
      // ====================================================================
      // GALAXY LAYOUT: Spiral with empty center
      // - Coloca los centros de los sistemas en una espiral (plano XZ)
      // - Asegura un "hueco" central sin sistemas ni estrellas
      // - Mantiene posiciones deterministas (mismo orden => misma galaxia)
      // ====================================================================

      const GALAXY_LAYOUT = {
        // Debe ser mayor que el mayor |orbitR| de tus planetas para que el centro quede vacío.
        // (En tu Canopus tienes orbitR ~ 820)
        holeRadius: 1200,		// antes 2600
        radialStep: 700,		// antes 1200
        angleStep: 0.92,      // radianes por sistema (más => espiral más "abierta")
        verticalJitter: 140,  // pequeña variación Y para dar profundidad
        globalScale: 0.75		// antes 1.0
      };

      // pseudo-random determinista (0..1) a partir de un string
      function _galRand01(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        h >>>= 0;
        return (h % 100000) / 100000;
      }

      function buildGalaxySystemPositions(systems) {
        const map = new Map();
        let spiralIndex = 0;

        for (const sys of systems) {
          // 1) Si el sistema ya trae posición 3D (sys.pos), úsala SIEMPRE
          if (sys && sys.pos && typeof sys.pos.x === "number" && typeof sys.pos.y === "number" && typeof sys.pos.z === "number") {
            map.set(sys.id, sys.pos.clone().scale(GALAXY_LAYOUT.globalScale));
            continue;
          }

          // 2) Si no hay sys.pos, fallback a espiral (XZ) + jitter Y
          const i = spiralIndex++;
          const r = GALAXY_LAYOUT.holeRadius + i * GALAXY_LAYOUT.radialStep;
          const a = i * GALAXY_LAYOUT.angleStep;
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;
		  
          // jitter determinista por id para que no "salte" entre recargas
          const j = (_galRand01("GALAXY_Y_" + sys.id) - 0.5) * 2.0;
          const y = j * GALAXY_LAYOUT.verticalJitter;
		  
          map.set(sys.id, new BABYLON.Vector3(x, y, z).scale(GALAXY_LAYOUT.globalScale));
        }
        return map;
      }

      // Precalcula las posiciones (incluye Canopus)
      const galaxyPosBySystemId = buildGalaxySystemPositions(extraSystems);
	  
      // Separación entre sistemas (más grande => sistemas más lejos entre sí)
      const SYSTEM_POS_SCALE = 2.8;

      function createStarSystem(sys, opts = {}) {
        const isCore = !!opts.core || sys.id === "Canopus";
        const root = new BABYLON.TransformNode("sys_" + sys.id, scn);
		
        // ------------------------------------------------------------
        // Seguridad de nombres (evita estrellas/planetas "sin nombre")
        // - Si sys.star.name viene vacío/undefined, genera uno estable.
        // ------------------------------------------------------------
        if (!sys.star) sys.star = {};
        if (!sys.star.kind) sys.star.kind = "sun";
        if (typeof sys.star.radius !== "number") sys.star.radius = 26;
        const _rawStarName =
          (typeof sys.star.name === "string") ? sys.star.name.trim() : "";
        const starName =
          _rawStarName || (sys.id ? (sys.id + " Star") : "Unknown Star");
        sys.star.name = starName;
		
        // Posición galáctica en espiral (centro vacío)
        const gpos = galaxyPosBySystemId.has(sys.id)
          ? galaxyPosBySystemId.get(sys.id)
          : (sys.pos || BABYLON.Vector3.Zero());       root.position.copyFrom(gpos);
        systemRoots.set(sys.id, root);

        // Star mesh
        const starSeg = isCore ? 64 : 48;
        const star = BABYLON.MeshBuilder.CreateSphere(starName, { diameter: sys.star.radius * 2, segments: starSeg }, scn);
        star.parent = root;
        star.position.set(0,0,0);
        star.isPickable = false;
		star.checkCollisions = false;

        star.alwaysSelectAsActiveMesh = true;
        star.doNotSyncBoundingInfo = true;
        // Star material
        if (isCore) {
          // Canopus: look procedural + halo (como antes)
          const sunMat = new BABYLON.PBRMaterial("sunMat", scn);
          sunMat.unlit = true;
          sunMat.emissiveColor = new BABYLON.Color3(1, 0.6, 0.1);

          const sunNoise = new BABYLON.NoiseProceduralTexture("sunNoise", 512, scn);
          sunNoise.animationSpeedFactor = 0.8;
          sunNoise.brightness = 0.5;
          sunMat.emissiveTexture = sunNoise;
          star.material = sunMat;

          halo = BABYLON.MeshBuilder.CreatePlane("Canopus_Halo", { size: sys.star.radius * 3.6 }, scn);
          halo.parent = star;
          halo.isPickable = false;
          halo.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

          const haloTex = new BABYLON.DynamicTexture("haloTex", { width: 512, height: 512 }, scn, false);
          const ctx = haloTex.getContext();
          const g = ctx.createRadialGradient(256,256,0,256,256,256);
          g.addColorStop(0.00, "rgba(255,210,140,0.55)");
          g.addColorStop(0.25, "rgba(255,165, 70,0.22)");
          g.addColorStop(0.55, "rgba(255,120, 40,0.10)");
          g.addColorStop(1.00, "rgba(0,0,0,0.00)");
          ctx.fillStyle = g; ctx.fillRect(0,0,512,512);
          haloTex.update();

          const haloMat = new BABYLON.StandardMaterial("haloMat", scn);
          haloMat.diffuseTexture = haloTex;
          haloMat.emissiveTexture = haloTex;
          haloMat.opacityTexture = haloTex;
          haloMat.disableLighting = true;
          haloMat.backFaceCulling = false;
          haloMat.alpha = 0.75;
          haloMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
          haloMat.needDepthPrePass = true;
          halo.material = haloMat;

          // Attach main light to Canopus
          sunMesh = star;
          mainLitMeshes.push(star);
          sunLight.parent = star;
          sunLight.position.set(0,0,0);

          // Mapear estrella -> luz (para chunks procedurales)
          lightByStarMesh.set(star, sunLight);
        } else {
          const starMat = new BABYLON.StandardMaterial(starName + "_mat", scn);
          starMat.emissiveColor = sys.star.emissive || new BABYLON.Color3(1,0.9,0.7);
          starMat.diffuseColor = BABYLON.Color3.Black();
          starMat.specularColor = BABYLON.Color3.Black();
          starMat.disableLighting = true;
          star.material = starMat;
        }
				
        // ------------------------------------------------------------
        // Star dot billboard (LOD): asegura que una estrella muy lejana
        // se vea siempre al menos como 1-2 píxeles, sin “desaparecer”.
        // (Respeta la oclusión: si un planeta tapa, no se ve.)
        // ------------------------------------------------------------
        // Star dot (SpriteManager compartido) — evita 1 material + 1 DynamicTexture por sistema
        // Nota: ahora "dot" es un Sprite (no Mesh), así que se escala vía .size y se oculta vía .isVisible
        let starDot = null;
        if (starDotMgr) {
          const col = sys.star.emissive || new BABYLON.Color3(1, 0.9, 0.7);
          const spr = createStarDotSprite(starDotMgr, starName + "_dot", root.position, col, 1.0);
          // Sprites usan el mismo concepto de renderingGroupId
          spr.renderingGroupId = 0;
          starDot = spr;
        }

        galaxyStarDots.push({ dot: starDot, star, radius: sys.star.radius });

        // Stable id for star (avoid name collisions across systems)
        sys.star.kind = sys.star.kind || "sun";
        sys.star.systemId = sys.id;
        const starKey = _bodyKey(sys.id, "sun", starName, "");
        sys.star._key = starKey;

        bodies.set(starKey, {
          id: starKey,
          def: sys.star,
          farMesh: star,
		  ocean: null,
          atmo: null,
          ring: null,
          // reference star for day/night shading of atmo/rings
          starRef: star,
		  systemId: sys.id,
          orbitAngle: 0,
          orbitNode: null,
          proc: null,
        });

        // Local/system light (extras) — Canopus usa sunLight
        let local = null;
        if (!isCore) {
          local = new BABYLON.PointLight(sys.id + "_light", new BABYLON.Vector3(0,0,0), scn);
          local.parent = star;
          local.intensity = (sys.star.lightIntensity != null) ? sys.star.lightIntensity : 7.0;
          // Large enough to cover all orbits in the system (we still use includedOnlyMeshes).
          local.range = (sys.star.lightRange != null) ? sys.star.lightRange : 20000;
          // MISMO FIX: caída estándar para que ilumine planetas a distancias grandes
          try { local.falloffType = BABYLON.Light.FALLOFF_STANDARD; } catch(e) {}
          try { local.usePhysicalLightFalloff = false; } catch(e) {}

          local.includedOnlyMeshes = [];
          local.setEnabled(true);
          systemLights.push({ id: sys.id, light: local, root, range: local.range });

          // Mapear estrella -> luz local
          lightByStarMesh.set(star, local);
        }

        function linkToLight(mesh, ocean) {
          if (!mesh) return;
          if (isCore) {
            mainLitMeshes.push(mesh);
            if (ocean) mainLitMeshes.push(ocean);
          } else if (local) {
            local.includedOnlyMeshes.push(mesh);
            if (ocean) local.includedOnlyMeshes.push(ocean);
          }
        }

        function applyShadows(mesh, ocean) {
          if (!mesh) return;
          if (isCore) {
            shadowGen.addShadowCaster(mesh);
            mesh.receiveShadows = true;
            if (ocean) ocean.receiveShadows = false;
          } else {
            mesh.receiveShadows = false;
            if (ocean) ocean.receiveShadows = false;
          }
        }

        function createRings(def, planetMesh) {
          if (!def || !planetMesh) return null;
          if (!def.rings) return null;
		  // ringKind:"dust" => genera DynamicTexture con hueco interior + polvo tenue


          let rt = null;

          // ringTex puede ser:
          // - ruta normal a textura (png con alpha)
          // - "proc:ion"  => textura procedural (para Seban)
          // - "proc:dust" => anillo tenue de polvo (Arrakis)
          if (typeof def.ringTex === "string" && def.ringTex.startsWith("proc:")) {
            const mode = def.ringTex.split(":")[1] || "ion";
            const dyn = new BABYLON.DynamicTexture(def.name + "_ringDyn", { width: 512, height: 512 }, scn, false);
            const ctx = dyn.getContext();
            ctx.clearRect(0,0,512,512);

            // disco con hueco central (alpha) + ruido/estrías suaves
            const cx = 256, cy = 256;
            for (let y=0; y<512; y++) {
              for (let x=0; x<512; x++) {
                const dx = (x-cx)/256;
                const dy = (y-cy)/256;
                const r = Math.sqrt(dx*dx + dy*dy); // 0..~1.4
                // rangos distintos según modo
                if (mode === "dust") {
                  // anillo más fino y discreto
                  if (r < 0.58 || r > 0.86) continue;
                } else {
                  // anillo “grande” (ion)
                  if (r < 0.40 || r > 1.02) continue;
                }

                // perfil radial
                let a = 0.0;
                if (mode === "dust") {
                  a += Math.max(0, 1 - Math.abs(r - 0.70)/0.06) * 0.22;
                  a += Math.max(0, 1 - Math.abs(r - 0.80)/0.05) * 0.16;
                } else {
                  a += Math.max(0, 1 - Math.abs(r - 0.62)/0.10) * 0.35;
                  a += Math.max(0, 1 - Math.abs(r - 0.78)/0.12) * 0.25;
                  a += Math.max(0, 1 - Math.abs(r - 0.92)/0.06) * 0.18;
                }

                // estrías
                const stripe = (Math.sin((r*(mode === "dust" ? 180 : 120)) + (dx*18)) * 0.5 + 0.5);
                a *= (mode === "dust") ? (0.35 + stripe*0.35) : (0.55 + stripe*0.55);

                // “iones” (punteado)
                if (mode === "ion") {
                  const speck = (Math.sin((x*12.9898 + y*78.233)) * 43758.5453);
                  const rnd = speck - Math.floor(speck);
                  if (rnd > 0.985) a += 0.25;
                }
                // polvo muy fino (menos puntos y menos alpha)
                if (mode === "dust") {
                  const speck = (Math.sin((x*7.9898 + y*23.233)) * 15731.5453);
                  const rnd = speck - Math.floor(speck);
                  if (rnd > 0.996) a += 0.08;
                }

                if (a <= 0.005) continue;
                // color (ion: frío azulado)
                let rr, gg, bb;
                if (mode === "dust") {
                  // polvo cálido, muy tenue
                  rr = 210; gg = 190; bb = 145;
                  a *= 0.55; // aún más discreto
                } else {
                  rr = 120; gg = 170; bb = 255;
                }
                ctx.fillStyle = `rgba(${rr},${gg},${bb},${Math.min(1,a)})`;
                ctx.fillRect(x,y,1,1);
              }
            }

            dyn.update();
            rt = dyn;
          } else {
            rt = loadTextureOrNull(scn, def.ringTex, { hasAlpha: true });
          }

          if (!rt) return null;

          const ringRadiusMul = (typeof def.ringRadiusMul === "number") ? def.ringRadiusMul : 3.3;
          const ringAlpha = (typeof def.ringAlpha === "number") ? def.ringAlpha : 0.95;
          const ringTint = def.ringTint || new BABYLON.Color3(0.95, 0.90, 0.80);

          // Per-fragment lighting + true planet shadow on rings
          const ring = makeRings(scn, planetMesh, {
            name: def.name + "_Rings",
            radius: def.radius * ringRadiusMul,
            tessellation: 128,
            tilt: (typeof def.ringTilt === "number") ? def.ringTilt : 0,
            texture: rt,
            alpha: ringAlpha,
            tint: ringTint,
            planetRadius: def.radius,
            shadowSoftness: (typeof def.ringShadowSoftness === "number") ? def.ringShadowSoftness : 0.04,
            shadowMin: (typeof def.ringShadowMin === "number") ? def.ringShadowMin : 0.12,
          });

          return ring;
        }

        // Planets
        for (const pDef of (sys.planets || [])) {
          pDef._sysSpeed = sys.speedScale || 1;

          // Normalize + stable id
          pDef.kind = "planet";
          pDef.systemId = sys.id;
          pDef.name = _normName(pDef.name);
          if (!pDef.name) { console.warn("[skip] planet sin nombre:", pDef, "en", sys.id); continue; }
          pDef.parentKey = starKey;
          pDef.parent = starName;
          const pKey = _bodyKey(sys.id, "planet", pDef.name, starKey);
          pDef._key = pKey;

          const orbitNode = new BABYLON.TransformNode(pDef.name + "_orbit", scn);
          orbitNode.parent = root;
          orbitNode.position.set(0, 0, 0);
          orbitNodes.set(pKey, orbitNode);

          let created = null;
          let runtimeParams = null;

          const isRocky = !(pDef.gasGiant || pDef.rocky === false);
          if (isRocky && defaultPlanetParams) {
            const hasSpecific = !!pDef.jsonFile && planetParamsByName.has(pDef.name);
            const base = hasSpecific ? planetParamsByName.get(pDef.name) : defaultPlanetParams;
            runtimeParams = buildRuntimePlanetParams(base, pDef, {
              // orbit-view LOD: keep it cheap for non-core systems
              maxSubdiv: (isCore || hasSpecific) ? 7 : 5,
              minSubdiv: 2,
              forceSeedFromName: !hasSpecific,
            });
            created = createJsonPlanet(scn, pDef, orbitNode, runtimeParams);
            // Mark so surface-mode won't spawn the old chunked procedural planet for this body.
            pDef.useJsonPlanet = true;
          } else {
            // Gas giants (and fallback) keep the existing fast far-planet path.
            created = createLowPolyFarPlanet(scn, pDef, orbitNode);
          }
          const mesh  = created.land;
          const ocean = created.ocean;
		  
          // rings (core only, por ahora)
          const ring = isCore ? createRings(pDef, mesh) : null;

          mesh.isPickable = false;
          if (ocean) ocean.isPickable = false;
          if (ring) ring.isPickable = false;
		  
          applyShadows(mesh, ocean);
          linkToLight(mesh, ocean);

          bodies.set(pKey, {
            id: pKey,
            def: pDef,
            farMesh: mesh,
			ocean,
            ring,
            starRef: star,
			systemId: sys.id,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitNode,
            proc: null,
            genParams: (isRocky && defaultPlanetParams) ? runtimeParams : null,

            // LOD dinámico (solo planetas rocosos JSON)
            isCore: !!isCore,
            lod: "low",
            lowMesh: mesh,
            lowOcean: ocean,
            lowGenParams: (isRocky && defaultPlanetParams) ? runtimeParams : null,
            hiMesh: null,
            hiOcean: null,
          });

          // Congela materiales en far para sistemas lejanos
          if (!isCore) {
            if (mesh.material && mesh.material.freeze) mesh.material.freeze();
            if (ocean && ocean.material && ocean.material.freeze) ocean.material.freeze();
            if (ring && ring.material && ring.material.freeze) ring.material.freeze();
          }
        }

        // Moons (solo si sys.moons existe; coreSystem las usa)
        for (const mDef of (sys.moons || [])) {
          if (!mDef.parent) continue;
          mDef._sysSpeed = sys.speedScale || 1;

          // Normalize + stable id
          mDef.kind = "moon";
          mDef.systemId = sys.id;
          mDef.name = _normName(mDef.name);
          mDef.parent = _normName(mDef.parent);
          if (!mDef.name || !mDef.parent) { console.warn("[skip] moon sin nombre/parent:", mDef, "en", sys.id); continue; }

          const parentBody = findBodyByNameInSystem(mDef.parent, sys.id, "planet");
          if (!parentBody) {
            console.warn("[moon] parent no encontrado:", mDef.parent, "para", mDef.name, "en", sys.id);
            continue;
          }
		  
          const parentKey = parentBody.id || (parentBody.def && parentBody.def._key) || "";
          mDef.parentKey = parentKey;
          const mKey = _bodyKey(sys.id, "moon", mDef.name, parentKey);
          mDef._key = mKey;

          const moonOrbitNode = new BABYLON.TransformNode(mDef.name + "_moonOrbit", scn);
          moonOrbitNode.parent = parentBody.farMesh;
          moonOrbitNode.position.set(0,0,0);
          moonOrbitNodes.set(mKey, moonOrbitNode);

          let created = null;
          let runtimeParams = null;
          const isRockyMoon = !(mDef.gasGiant || mDef.rocky === false);
          if (isRockyMoon && defaultPlanetParams) {
            const hasSpecificMoon = !!mDef.jsonFile && planetParamsByName.has(mDef.name);
            const baseMoon = hasSpecificMoon ? planetParamsByName.get(mDef.name) : defaultPlanetParams;
            runtimeParams = buildRuntimePlanetParams(baseMoon, mDef, {
              maxSubdiv: (isCore || hasSpecificMoon) ? 6 : 4,
              minSubdiv: 2,
              forceSeedFromName: !hasSpecificMoon,
            });
            created = createJsonPlanet(scn, mDef, moonOrbitNode, runtimeParams);
            mDef.useJsonPlanet = true;
          } else {
            created = createLowPolyFarPlanet(scn, mDef, moonOrbitNode);
          }
          const mesh = created.land;
          const ocean = created.ocean;

          mesh.isPickable = false;
          if (ocean) ocean.isPickable = false;

          applyShadows(mesh, ocean);
          linkToLight(mesh, ocean);

          bodies.set(mKey, {
            id: mKey,
            def: mDef,
            farMesh: mesh,
			ocean,
            ring: null,
            starRef: star,
			systemId: sys.id,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitNode: moonOrbitNode,
            proc: null,
            genParams: (isRockyMoon && defaultPlanetParams) ? runtimeParams : null,

            // LOD dinámico (solo lunas rocosas JSON)
            isCore: !!isCore,
            lod: "low",
            lowMesh: mesh,
            lowOcean: ocean,
            lowGenParams: (isRockyMoon && defaultPlanetParams) ? runtimeParams : null,
            hiMesh: null,
            hiOcean: null,
          });

          if (!isCore) {
            if (mesh.material && mesh.material.freeze) mesh.material.freeze();
            if (ocean && ocean.material && ocean.material.freeze) ocean.material.freeze();
          }
        }

        // Congela star solo en sistemas lejanos (Canopus tiene textura animada)
        if (!isCore) {
          star.freezeWorldMatrix();
          star.doNotSyncBoundingInfo = true;
          if (star.material && star.material.freeze) star.material.freeze();
        }
      }
      for (const sys of extraSystems) {
        createStarSystem(sys, { core: sys.id === "Canopus" });
      }

      // ====================================================================
      // 3c) LOD dinámico: detalle completo SOLO para el planeta/luna al que te acercas
      // - El resto se mantiene en low LOD (rápido).
      // - En surface mode, el cuerpo activo siempre va en high.
      // ====================================================================
      // LOD progresivo (no es solo LOW/HIGH): la subdivisión baja/sube gradualmente
      const LOD = {
        updateMs: 120,
        // HIGH entra más lejos (más detalle antes)
        // distHighEnter = radius * nearMul + nearPad
        nearMul: 70,
        nearPad: 140,
        // HIGH sale con histéresis (un poco más lejos que el enter)
        hiExitMul: 140,
        hiExitPad: 550,

        // MID (nuevo): entra antes que HIGH (más lejos), sale con histéresis
        // distMidEnter = radius * midMul + midPad
        midMul: 170,
        midPad: 700,
        // distMidExit = radius * midExitMul + midExitPad
        midExitMul: 230,
        midExitPad: 1000,

        // Cuando estás más lejos que esto => objetivo = low (fallback si no hay MID)
        // (ya no se usa como “exit” único; lo mantenemos por compatibilidad)
        farMul: 120,
        // Caps
        hiCap: 99,     // tú lo has puesto alto; ojo con valores enormes
        hiFloor: 7,
        midCap: 14,
        midFloor: 5,
        lowCap: 2,
        // Curva de caída: <1 cae antes (menos detalle lejos), >1 cae después
        curvePow: 0.75,
        // Padding fijo (farPad ya no se usa como antes, pero lo dejamos si lo usas en otros sitios)
        farPad: 200,
        // Para evitar regenerar continuamente
        regenCooldownMs: 400,
        // Cambia mesh solo si difiere al menos en esto (subdiv steps)
        minStep: 1,
        // Presupuesto: cuántos cuerpos máximo regeneramos por tick (evita tirones).
        // OJO: esto NO limita cuántos pueden verse con detalle, solo cuántos se reconstruyen a la vez.
        maxRegenPerTick: 10,
      };
	  
	  function chooseHiSubdiv(baseParams) {
        const raw = (baseParams && typeof baseParams.subdivisions === "number") ? baseParams.subdivisions : 8;
        return Math.max(LOD.hiFloor, Math.min(LOD.hiCap, raw | 0));
      }
	  
      function chooseMidSubdiv(baseParams) {
        // Mid: un paso intermedio: suficiente para ver detalle desde más lejos sin ir al extremo del hi
        const raw = (baseParams && typeof baseParams.subdivisions === "number") ? baseParams.subdivisions : 8;
        // Si raw es muy alto, lo limitamos; si es muy bajo, lo subimos un poco
        const mid = Math.round(raw * 0.65);
        return Math.max(LOD.midFloor, Math.min(LOD.midCap, mid | 0));
      }

      function ensureMidLOD(b) {
        if (!b || !isRockyJsonBody(b) || !defaultPlanetParams) return;
        if (b.lod === "mid" && b.midMesh && !b.midMesh.isDisposed()) return;

        const hasSpecific = !!b.def.jsonFile && planetParamsByName.has(b.def.name);
        const base = hasSpecific ? planetParamsByName.get(b.def.name) : defaultPlanetParams;
        const midSubdiv = chooseMidSubdiv(base);

        const midParams = buildRuntimePlanetParams(base, b.def, {
          maxSubdiv: midSubdiv,
          minSubdiv: midSubdiv,
          forceSeedFromName: !hasSpecific,
        });

        const src = b.farMesh || b.lowMesh;
        const srcPos = src ? src.position.clone() : new BABYLON.Vector3(b.def.orbitR || 0, 0, 0);
        const srcRot = src ? src.rotation.clone() : new BABYLON.Vector3(0, 0, 0);

        const created = createJsonPlanet(scn, b.def, b.orbitNode, midParams);
        const midMesh = created.land;
        const midOcean = created.ocean;
        midMesh.isPickable = false;
        if (midOcean) midOcean.isPickable = false;

        midMesh.position.copyFrom(srcPos);
        midMesh.rotation.copyFrom(srcRot);

        includeMeshInBodyLight(midMesh, b);
        if (midOcean) includeMeshInBodyLight(midOcean, b);

        if (b.isCore && shadowGen) {
          try { shadowGen.addShadowCaster(midMesh); } catch (e) {}
          midMesh.receiveShadows = true;
        }

        // Rings: reparent al mesh activo
        if (b.ring) {
          try {
            b.ring.parent = midMesh;
            b.ring.position.set(0, 0, 0);
            b.ring.renderingGroupId = midMesh.renderingGroupId || 0;
          } catch (e) {}
        }

        // Moons orbitan el mesh activo
        if (b.def.kind === "planet") {
          relinkMoonsParent(b.id, midMesh);
        }

        // Oculta low (y también hi si existiera por un estado raro)
        if (b.lowMesh) b.lowMesh.setEnabled(false);
        if (b.lowOcean) b.lowOcean.setEnabled(false);
        if (b.hiMesh) b.hiMesh.setEnabled(false);
        if (b.hiOcean) b.hiOcean.setEnabled(false);

        b.midMesh = midMesh;
        b.midOcean = midOcean;
        b.farMesh = midMesh;
        b.ocean = midOcean;
        b.midGenParams = midParams;
        b.genParams = midParams;
        b.lod = "mid";

        // Labels: re-link al mesh activo (si existen)
        try {
          if (typeof labelsById !== "undefined") {
            const meta = labelsById.get(b.id || "");
            if (meta && meta.rect && meta.rect.linkWithMesh) {
              meta.rect.linkWithMesh(midMesh);
              meta.mesh = midMesh;
            }
          }
        } catch (e) {}
      }

      function dropMidLOD(b) {
        if (!b || b.lod !== "mid") return;

        const cur = b.farMesh;
        const curPos = cur ? cur.position.clone() : null;
        const curRot = cur ? cur.rotation.clone() : null;

        if (b.lowMesh) {
          b.lowMesh.setEnabled(true);
          if (curPos) b.lowMesh.position.copyFrom(curPos);
          if (curRot) b.lowMesh.rotation.copyFrom(curRot);
        }
        if (b.lowOcean) b.lowOcean.setEnabled(true);

        if (b.ring && b.lowMesh) {
          try {
            b.ring.parent = b.lowMesh;
            b.ring.position.set(0, 0, 0);
            b.ring.renderingGroupId = b.lowMesh.renderingGroupId || 0;
          } catch (e) {}
        }

        if (b.def.kind === "planet" && b.lowMesh) {
          relinkMoonsParent(b.id, b.lowMesh);
        }

        try { b.midOcean && b.midOcean.dispose(); } catch (e) {}
        try { b.midMesh && b.midMesh.dispose(); } catch (e) {}

        b.midMesh = null;
        b.midOcean = null;
        b.farMesh = b.lowMesh || b.farMesh;
        b.ocean = b.lowOcean || null;
        b.genParams = b.lowGenParams || b.genParams;
        b.lod = "low";

        try {
          if (typeof labelsById !== "undefined") {
            const meta = labelsById.get(b.id || "");
            if (meta && meta.rect && meta.rect.linkWithMesh && b.lowMesh) {
              meta.rect.linkWithMesh(b.lowMesh);
              meta.mesh = b.lowMesh;
            }
          }
        } catch (e) {}
      }


      function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
      function _smoothstep(t) { t = _clamp(t, 0, 1); return t * t * (3 - 2 * t); }

      // Calcula subdiv objetivo en función de distancia (progresivo)
      function desiredSubdivByDistance(dist, radius, baseRawSubdiv) {
        const near = radius * LOD.nearMul + LOD.nearPad;
        const far  = radius * LOD.farMul  + LOD.farPad;
        if (far <= near) return _clamp(baseRawSubdiv, LOD.hiFloor, LOD.hiCap);

        // t=0 cerca (hi), t=1 lejos (low)
        const t0 = _smoothstep((dist - near) / (far - near));
        const t = Math.pow(t0, (LOD.curvePow || 1));

        const hi = _clamp(baseRawSubdiv, LOD.hiFloor, LOD.hiCap);
        const lo = _clamp(LOD.lowCap, 2, hi); // lo nunca > hi

        // Interpolación hi->lo
        const f = hi + (lo - hi) * t;
        return Math.max(2, Math.round(f));
      }

      function baseSubdivFromParams(baseParams) {
        const raw = (baseParams && typeof baseParams.subdivisions === "number") ? (baseParams.subdivisions|0) : 8;
        return raw;
      }

      function ensureLODSubdiv(b, targetSubdiv) {
        if (!b || !b.def || !b.def.useJsonPlanet) return;
        const isRocky = !(b.def.gasGiant || b.def.rocky === false);
        if (!isRocky) return;
        if (!defaultPlanetParams) return;

        const now = performance.now();
        if (!b._lodLastRegen) b._lodLastRegen = 0;
        if (now - b._lodLastRegen < LOD.regenCooldownMs) return;

        const cur = (b.genParams && typeof b.genParams.subdivisions === "number") ? (b.genParams.subdivisions|0) : null;
        if (cur !== null && Math.abs(cur - targetSubdiv) < LOD.minStep) return;

        // regenerar con targetSubdiv
        const hasSpecific = !!b.def.jsonFile && planetParamsByName.has(b.def.name);
        const base = hasSpecific ? planetParamsByName.get(b.def.name) : defaultPlanetParams;
        const p = buildRuntimePlanetParams(base, b.def, {
          minSubdiv: targetSubdiv,
          maxSubdiv: targetSubdiv,
          forceSeedFromName: !hasSpecific,
        });

        const src = b.farMesh;
        const srcPos = src ? src.position.clone() : new BABYLON.Vector3(b.def.orbitR || 0, 0, 0);
        const srcRot = src ? src.rotation.clone() : new BABYLON.Vector3(0, 0, 0);

        const oldMesh = b.farMesh;
        const oldOcean = b.ocean;

        const created = createJsonPlanet(scn, b.def, b.orbitNode, p);
        const mesh = created.land;
        const ocean = created.ocean;

        mesh.isPickable = false;
        if (ocean) ocean.isPickable = false;

        mesh.position.copyFrom(srcPos);
        mesh.rotation.copyFrom(srcRot);

        includeMeshInBodyLight(mesh, b);
        if (ocean) includeMeshInBodyLight(ocean, b);

        // rings reparent
        if (b.ring) {
          try { b.ring.parent = mesh; b.ring.position.set(0,0,0); } catch(e) {}
        }
        // moons reparent if planet
        if (b.def.kind === "planet") {
          // IMPORTANTE: tus lunas usan parentKey = id estable del planeta (no el nombre).
          relinkMoonsParent(b.id, mesh);
        }

        b.farMesh = mesh;
        b.ocean = ocean;
        b.genParams = p;
        b._lodLastRegen = now;
		
        // Mantén coherente el "low" con el mesh activo para evitar que sistemas antiguos
        // (p.ej. si algo llama a lowMesh) vuelvan a una versión vieja.
        b.lowMesh = mesh;
        b.lowOcean = ocean;
        b.lowGenParams = p;
        b.lod = "low";

        // Labels: re-link al mesh nuevo (si existen) para que no "desaparezcan" al regenerar.
        try {
          if (typeof labelsById !== "undefined") {
            const meta = labelsById.get(String(b.id || ""));
            if (meta && meta.rect && meta.rect.linkWithMesh) {
              meta.rect.linkWithMesh(mesh);
              meta.mesh = mesh;
              const tb = meta.tb || meta.rect._tb;
              if (tb) tb.text = meta.name || (b.def && b.def.name) || "";
            }
          }
        } catch (e) {}

        try { oldMesh && oldMesh.dispose(); } catch(e) {}
        try { oldOcean && oldOcean.dispose(); } catch(e) {}
      }

      let _lodTick = 0;
      let _lodActiveId = null;

      function isRockyJsonBody(b) {
        if (!b || !b.def) return false;
        const k = b.def.kind;
        if (k !== "planet" && k !== "moon") return false;
        if (!b.def.useJsonPlanet) return false;
        return !(b.def.gasGiant || b.def.rocky === false);
      }

      function relinkMoonsParent(parentKey, newParentMesh) {
        if (!parentKey || !newParentMesh) return;
        for (const [, mb] of bodies.entries()) {
          if (!mb || !mb.def) continue;
          if (mb.def.kind !== "moon") continue;
          if (mb.def.parentKey !== parentKey) continue;
          if (mb.orbitNode) mb.orbitNode.parent = newParentMesh;
        }
      }

      function ensureHiLOD(b) {
        if (!b || !isRockyJsonBody(b) || !defaultPlanetParams) return;
        if (b.lod === "high" && b.hiMesh && !b.hiMesh.isDisposed()) return;

        const hasSpecific = !!b.def.jsonFile && planetParamsByName.has(b.def.name);
        const base = hasSpecific ? planetParamsByName.get(b.def.name) : defaultPlanetParams;
        const hiSubdiv = chooseHiSubdiv(base);

        const hiParams = buildRuntimePlanetParams(base, b.def, {
          maxSubdiv: hiSubdiv,
          minSubdiv: hiSubdiv,
          forceSeedFromName: !hasSpecific,
        });

        // Continuidad: copiamos transform del mesh activo (low)
        const src = b.farMesh || b.lowMesh;
        const srcPos = src ? src.position.clone() : new BABYLON.Vector3(b.def.orbitR || 0, 0, 0);
        const srcRot = src ? src.rotation.clone() : new BABYLON.Vector3(0, 0, 0);

        const created = createJsonPlanet(scn, b.def, b.orbitNode, hiParams);
        const hiMesh = created.land;
        const hiOcean = created.ocean;
        hiMesh.isPickable = false;
        if (hiOcean) hiOcean.isPickable = false;

        hiMesh.position.copyFrom(srcPos);
        hiMesh.rotation.copyFrom(srcRot);

        // Luz correcta (cada planeta con su estrella)
        includeMeshInBodyLight(hiMesh, b);
        if (hiOcean) includeMeshInBodyLight(hiOcean, b);

        // Sombras solo en el sistema core
        if (b.isCore && shadowGen) {
          try { shadowGen.addShadowCaster(hiMesh); } catch (e) {}
          hiMesh.receiveShadows = true;
        }

        // Rings: reparent al mesh activo
        if (b.ring) {
          try {
            b.ring.parent = hiMesh;
            b.ring.position.set(0, 0, 0);
            b.ring.renderingGroupId = hiMesh.renderingGroupId || 0;
          } catch (e) {}
        }

        // Si este planeta tiene lunas, deben orbitar el mesh activo
        if (b.def.kind === "planet") {
          relinkMoonsParent(b.id, hiMesh);
        }

        // Oculta low
        if (b.lowMesh) b.lowMesh.setEnabled(false);
        if (b.lowOcean) b.lowOcean.setEnabled(false);
        // Oculta mid si existe (cuando subimos de mid -> high)
        if (b.midMesh) b.midMesh.setEnabled(false);
        if (b.midOcean) b.midOcean.setEnabled(false);

        b.hiMesh = hiMesh;
        b.hiOcean = hiOcean;
        b.farMesh = hiMesh;
        b.ocean = hiOcean;
        b.genParams = hiParams;
        b.lod = "high";

        // Labels: re-link al mesh activo (si existen)
        try {
          if (typeof labelsById !== "undefined") {
            const meta = labelsById.get(b.id || "");
            if (meta && meta.rect && meta.rect.linkWithMesh) {
              meta.rect.linkWithMesh(hiMesh);
              meta.mesh = hiMesh;
            }
          }
        } catch (e) {}
      }

      function dropHiLOD(b) {
        if (!b || b.lod !== "high") return;

        const cur = b.farMesh;
        const curPos = cur ? cur.position.clone() : null;
        const curRot = cur ? cur.rotation.clone() : null;

        // Reactiva low y copia transform para que no haya salto
        if (b.lowMesh) {
          b.lowMesh.setEnabled(true);
          if (curPos) b.lowMesh.position.copyFrom(curPos);
          if (curRot) b.lowMesh.rotation.copyFrom(curRot);
        }
        if (b.lowOcean) {
          b.lowOcean.setEnabled(true);
        }

        // Rings: vuelve a low
        if (b.ring && b.lowMesh) {
          try {
            b.ring.parent = b.lowMesh;
            b.ring.position.set(0, 0, 0);
            b.ring.renderingGroupId = b.lowMesh.renderingGroupId || 0;
          } catch (e) {}
        }

        // Lunas: vuelve a low
        if (b.def.kind === "planet" && b.lowMesh) {
          relinkMoonsParent(b.id, b.lowMesh);
        }

        // Elimina hi
        try { b.hiOcean && b.hiOcean.dispose(); } catch (e) {}
        try { b.hiMesh && b.hiMesh.dispose(); } catch (e) {}

        b.hiMesh = null;
        b.hiOcean = null;
        b.farMesh = b.lowMesh || b.farMesh;
        b.ocean = b.lowOcean || null;
        b.genParams = b.lowGenParams || b.genParams;
        b.lod = "low";

        // Labels: re-link al mesh low (si existen)
        try {
          if (typeof labelsById !== "undefined") {
            const meta = labelsById.get(b.id || "");
            if (meta && meta.rect && meta.rect.linkWithMesh && b.lowMesh) {
              meta.rect.linkWithMesh(b.lowMesh);
              meta.mesh = b.lowMesh;
            }
          }
        } catch (e) {}
      }
	  
      function dropHiLODToMid(b) {
        if (!b || b.lod !== "high") return;

        const cur = b.farMesh;
        const curPos = cur ? cur.position.clone() : null;
        const curRot = cur ? cur.rotation.clone() : null;

        // Si no hay mid, cae a low (comportamiento antiguo)
        if (!b.midMesh || b.midMesh.isDisposed()) {
          dropHiLOD(b);
          return;
        }

        b.midMesh.setEnabled(true);
        if (curPos) b.midMesh.position.copyFrom(curPos);
        if (curRot) b.midMesh.rotation.copyFrom(curRot);
        if (b.midOcean) b.midOcean.setEnabled(true);

        if (b.ring) {
          try {
            b.ring.parent = b.midMesh;
            b.ring.position.set(0, 0, 0);
            b.ring.renderingGroupId = b.midMesh.renderingGroupId || 0;
          } catch (e) {}
        }

        if (b.def.kind === "planet") {
          relinkMoonsParent(b.id, b.midMesh);
        }

        // Elimina hi
        try { b.hiOcean && b.hiOcean.dispose(); } catch (e) {}
        try { b.hiMesh && b.hiMesh.dispose(); } catch (e) {}

        b.hiMesh = null;
        b.hiOcean = null;
        b.farMesh = b.midMesh;
        b.ocean = b.midOcean || null;
        b.genParams = b.midGenParams || b.genParams;
        b.lod = "mid";

        try {
          if (typeof labelsById !== "undefined") {
            const meta = labelsById.get(b.id || "");
            if (meta && meta.rect && meta.rect.linkWithMesh) {
              meta.rect.linkWithMesh(b.midMesh);
              meta.mesh = b.midMesh;
            }
          }
        } catch (e) {}
      }  

      function updateDynamicLOD(camPos) {
        const now = performance.now();
        if ((now - _lodTick) < LOD.updateMs) return;
        _lodTick = now;

        // ------------------------------------------------------------
        // MULTI-LOD PROGRESIVO POR DISTANCIA
        // - Se evalúan TODOS los cuerpos rocosos JSON.
        // - El nivel de subdiv (detalle) depende de distancia.
        // - Solo regeneramos un máximo de LOD.maxRegenPerTick por tick para evitar tirones.
        // ------------------------------------------------------------
        if (!defaultPlanetParams) return;

        // Si venías del modo antiguo "hiMesh", lo desactivamos: este modo usa 1 mesh regenerado.
        for (const [, b] of bodies.entries()) {
          if (b && b.lod === "high") {
            try { dropHiLOD(b); } catch(e) {}
          }
        }

        // Construye candidatos con distancia
        const candidates = [];
        for (const [, b] of bodies.entries()) {
          if (!isRockyJsonBody(b) || !b.farMesh) continue;
          const p = b.farMesh.getAbsolutePosition();
          const dist = BABYLON.Vector3.Distance(camPos, p);

          const r = (b.def && typeof b.def.radius === "number") ? b.def.radius : 6;
          const far = r * LOD.farMul + LOD.farPad;
          // Culling suave: si está MUY lejos, ni lo miramos (ahorra CPU).
          if (dist > far * 1.25) continue;

          candidates.push({ b, dist, r });
        }

        // Prioriza por distancia (más cercano primero)
        candidates.sort((a, c) => a.dist - c.dist);

        // Surface: fuerza max detalle para el cuerpo de surface (primero en la cola)
        if (mode.value === "surface" && surfaceBody && isRockyJsonBody(surfaceBody)) {
          // lo metemos al inicio si no estaba
          const already = candidates.find(x => x.b && x.b.id === surfaceBody.id);
          if (!already && surfaceBody.farMesh) {
            const p = surfaceBody.farMesh.getAbsolutePosition();
            const dist = BABYLON.Vector3.Distance(camPos, p);
            const r = (surfaceBody.def && typeof surfaceBody.def.radius === "number") ? surfaceBody.def.radius : 6;
            candidates.unshift({ b: surfaceBody, dist, r, forceSurface: true });
          } else if (already) {
            already.forceSurface = true;
          }
        }

        let regenCount = 0;
        for (const it of candidates) {
          if (regenCount >= LOD.maxRegenPerTick) break;
          const b = it.b;
          if (!b || !b.def) continue;

          const hasSpecific = !!b.def.jsonFile && planetParamsByName.has(b.def.name);
          const base = hasSpecific ? planetParamsByName.get(b.def.name) : defaultPlanetParams;
          const baseRaw = baseSubdivFromParams(base);

          let targetSubdiv;
          if (it.forceSurface) {
            // Surface = “lo más alto razonable” (cap)
            targetSubdiv = _clamp(baseRaw, LOD.hiFloor, LOD.hiCap);
          } else {
            targetSubdiv = desiredSubdivByDistance(it.dist, it.r, baseRaw);
          }

          // ensureLODSubdiv ya tiene cooldown + minStep
          const before = (b.genParams && typeof b.genParams.subdivisions === "number") ? (b.genParams.subdivisions|0) : null;
          ensureLODSubdiv(b, targetSubdiv);
          const after = (b.genParams && typeof b.genParams.subdivisions === "number") ? (b.genParams.subdivisions|0) : null;
          if (before !== null && after !== null && before !== after) regenCount++;
        }
      }

 
      // ====================================================================
      // 4) Labels + UI populate (incluye sistemas extra)
      // ====================================================================
      const allDefs = bodyDefs.concat(
        extraSystems
          .filter(s => s.id !== "Canopus")
          .flatMap(s => [s.star, ...(s.planets || []), ...((s.moons) || [])])
      );

	  for (const def of allDefs) {
        if (!def) continue;
        // Normaliza nombre display
        const n = _normName(def.name);
        if (!n) {
          console.warn("[skip] body sin nombre:", def);
          continue;
        }
        def.name = n;

        const id = def._key || _bodyKey(def.systemId || "", def.kind || "", n, def.parentKey || "");
        def._key = id;

        const opt = document.createElement("option");
        opt.value = id;          // internal stable key
        opt.innerText = n;       // display name ONLY
        ui.planetSelect.appendChild(opt);

        const lb = bodies.get(id);
        if (lb && lb.farMesh) registerLabel(id, n, def.kind, lb.farMesh);
      }

      // Default selection by display name (Arrakis)
      try {
        const arrOpt = Array.from(ui.planetSelect.options).find(o => (o.textContent || o.innerText) === "Arrakis");
        if (arrOpt) ui.planetSelect.value = arrOpt.value;
      } catch (e) {}
      updateLabelVisibility(true);


      // ====================================================================
      // 5) Modes: orbit / fly / surface
      // ====================================================================
      const mode = { value: "orbit" };

      // Body currently used for surface mode (player attached)
      let surfaceBody = null;
 // orbit | fly | surface

      // Órbita "enganchada" a un cuerpo (ArcRotateCamera.lockedTarget)
      let orbitLockedBodyName = null;
      function lockOrbitToBody(body) {
        if (!body || !body.farMesh) return;
        orbitLockedBodyName = body.def?.name || body.farMesh.name;
        try {
          cameraOrbit.lockedTarget = body.farMesh;
          cameraOrbit.setTarget(body.farMesh);
        } catch (e) {
          // Fallback si lockedTarget no existe en alguna build
          cameraOrbit.setTarget(body.farMesh.getAbsolutePosition());
        }
        const r = body.def?.radius || 10;
        cameraOrbit.lowerRadiusLimit = Math.max(8, r * 1.25);
        cameraOrbit.upperRadiusLimit = Math.max(cameraOrbit.lowerRadiusLimit * 2, r * 80);
        cameraOrbit.radius = Math.max(cameraOrbit.lowerRadiusLimit * 1.35, r * 6);
      }
      function unlockOrbit() {
        orbitLockedBodyName = null;
        try { cameraOrbit.lockedTarget = null; } catch (e) {}
      }
	  
      // ====================================================================
      // Surface attachment: si el planeta rota, el jugador debe heredar esa rotación.
      // En modo superficie "paramos" el jugador al planeta (preferimos proc.root si existe).
      // ====================================================================
      let surfaceAttachedTo = null;

      function attachPlayerToBody(b) {
        if (!b || !playerRoot) return;
        const parent = b.farMesh;
        if (!parent) return;

        // conservar posición world al re-parentar
        const wp = playerRoot.getAbsolutePosition().clone();
        playerRoot.parent = parent;
        playerRoot.setAbsolutePosition(wp);
        surfaceAttachedTo = b;
      }

      function detachPlayerFromBody() {
        if (!playerRoot || !playerRoot.parent) { surfaceAttachedTo = null; return; }
        const wp = playerRoot.getAbsolutePosition().clone();
        playerRoot.parent = null;
        playerRoot.position.copyFrom(wp);
        surfaceAttachedTo = null;
      }
	  
      // ====================================================================
      // Full detail on demand (surface mode): regenerate ONLY the selected rocky JSON planet
      // ====================================================================
      function ensureFullDetailJsonBody(b, forceSubdiv = 8) {
        try {
          if (!b || !b.def || !b.def.useJsonPlanet) return;
          if (!defaultPlanetParams) return;
          const isRocky = !(b.def.gasGiant || b.def.rocky === false);
          if (!isRocky) return;

          // If we already have enough detail, skip.
          if (b.genParams && typeof b.genParams.subdivisions === "number" && b.genParams.subdivisions >= forceSubdiv) {
            return;
          }

          const hasSpecific = !!b.def.jsonFile && planetParamsByName.has(b.def.name);
          const base = hasSpecific ? planetParamsByName.get(b.def.name) : defaultPlanetParams;

          const hiParams = buildRuntimePlanetParams(base, b.def, {
            // Force “full” detail (safe cap) for surface
            maxSubdiv: forceSubdiv,
            minSubdiv: forceSubdiv,
            forceSeedFromName: !hasSpecific,
          });

          const oldMesh = b.farMesh;
          const oldOcean = b.ocean;
          const oldRing = b.ring;
          const parentNode = b.orbitNode || (oldMesh ? oldMesh.parent : null);

          const created = createJsonPlanet(scn, b.def, parentNode, hiParams);
          const mesh = created.land;
          const ocean = created.ocean;

          mesh.isPickable = false;
          if (ocean) ocean.isPickable = false;

          applyShadows(mesh, ocean);
          linkToLight(mesh, ocean);

          // Rebuild rings if this body had them
          if (oldRing) {
            try { oldRing.dispose(); } catch(e) {}
            b.ring = createRings(b.def, mesh);
            if (b.ring) b.ring.isPickable = false;
          }

          // Swap
          b.farMesh = mesh;
          b.ocean = ocean;
          b.genParams = hiParams;

          try { oldMesh && oldMesh.dispose(); } catch(e) {}
          try { oldOcean && oldOcean.dispose(); } catch(e) {}

          // If orbit is locked to this body, refresh the target
          if (orbitLockedBodyName && orbitLockedBodyName === (b.def?.name || "")) {
            try { lockOrbitToBody(b); } catch(e) {}
          }
        } catch (e) {
          console.warn("ensureFullDetailJsonBody warn:", e);
        }
      }


      function updateModeButtons() {
        const is = (m) => mode.value === m;
        if (ui.camOrbitBtn) ui.camOrbitBtn.classList.toggle("active", is("orbit"));
        if (ui.camFlyBtn) ui.camFlyBtn.classList.toggle("active", is("fly"));
        if (ui.camSurfaceBtn) ui.camSurfaceBtn.classList.toggle("active", is("surface"));
        // compat: elimina primary si existe y deja active como estado visual
        if (ui.camOrbitBtn) ui.camOrbitBtn.classList.toggle("primary", false);
        if (ui.camFlyBtn) ui.camFlyBtn.classList.toggle("primary", false);
        if (ui.camSurfaceBtn) ui.camSurfaceBtn.classList.toggle("primary", false);
      }

      // Estado inicial (modo por defecto = órbita)
      updateModeButtons();

      function setMode(m) {
        mode.value = m;
        if (m !== "surface") surfaceBody = null;
        ui.modePill.textContent = (m === "orbit") ? "Órbita" : (m === "fly" ? "Vuelo" : "Superficie");

        updateModeButtons();

        // Fog/"aire" solo en superficie (se ajusta por planeta en el loop)
        if (m !== "surface") {
          try { scn.fogMode = BABYLON.Scene.FOGMODE_NONE; } catch(e) {}
        }
		
        // Si salimos de Superficie, soltamos el "enganche" al planeta (world-space libre)
        if (m !== "surface") detachPlayerFromBody();

        // detach all
        try { cameraOrbit.detachControl(canvas); } catch(e){}
        try { cameraFly.detachControl(canvas); } catch(e){}
        try { cameraSurface.detachControl(canvas); } catch(e){}

        // Luz de apoyo (solo superficie)
        try { playerLamp.setEnabled(m === "surface"); } catch (e) {}

        if (m === "orbit") {
          // Si volvemos a Órbita, soltamos el pointer-lock para no "pelearnos" con la UI.
          if (document.pointerLockElement === canvas) {
            try { document.exitPointerLock?.(); } catch(e) {}
          }
          scn.activeCamera = cameraOrbit;
          cameraOrbit.attachControl(canvas, true);
        } else if (m === "fly") {
          // Salimos de órbita => soltamos cualquier "enganche" para volver a ser libres
          unlockOrbit();
          scn.activeCamera = cameraFly;
          cameraFly.attachControl(canvas, true);
        } else {
          unlockOrbit();
          scn.activeCamera = cameraSurface;
          cameraSurface.attachControl(canvas, true);
        }
		
        // Re-crear el post-process para la cámara activa (cada cámara tiene su cadena de PP)
        ensureAtmoPPForCamera(scn.activeCamera);
      }

      // Pointer lock (como index-old): click en el canvas para capturar ratón en Vuelo/Superficie
      scn.onPointerDown = () => {
        if (mode.value !== "fly" && mode.value !== "surface") return;
        if (document.pointerLockElement !== canvas) {
          canvas.requestPointerLock?.();
        }
      };

      // (hook listo por si quieres hacer UI cuando se suelta)
      document.addEventListener("pointerlockchange", () => {});


      ui.camOrbitBtn.addEventListener("click", () => setMode("orbit"));
      ui.camFlyBtn.addEventListener("click", () => setMode("fly"));
      // Surface button has its own handler below (needs target checks).

      ui.speedRange.addEventListener("input", (e) => {
        timeScale = parseFloat(e.target.value);
        ui.speedVal.textContent = timeScale.toFixed(1) + "x";
      });
      ui.speedVal.textContent = timeScale.toFixed(1) + "x";

      // ====================================================================
      // 6) Approach: teleport camera to target (fly/surface)
      // ====================================================================
      function getSelectedBody() {
        const id = ui.planetSelect.value;
        return bodies.get(id);
      }
	  
      function getTargetBody() {
        // En modo superficie usamos el cuerpo al que estamos enganchados (evita que el selector te "arrastre").
        if (mode.value === "surface" && surfaceAttachedTo) return surfaceAttachedTo;
        return getSelectedBody();
      }

      function approachTarget(preferredMode = null) {
        const b = getSelectedBody();
        if (!b) return;
        if (preferredMode === "surface" && (b.def.gasGiant || b.def.rocky === false)) {
          ui.debugInfo.textContent = `⚠️ ${b.def.name}: gigante gaseoso (sin superficie). Usando modo vuelo.`;
          preferredMode = "fly";
        }

        const targetPos = b.farMesh.getAbsolutePosition().clone();
        const r = b.def.radius;

        if (preferredMode) setMode(preferredMode);

        // place camera near surface
        const dir = new BABYLON.Vector3(0.2, 0.25, -1).normalize();
        const camPos = targetPos.add(dir.scale(r * 4.2));

        if (mode.value === "orbit") {
          // En Órbita, "Aproximar" engancha el orbit camera al cuerpo seleccionado
          lockOrbitToBody(b);
        } else if (mode.value === "fly") {
          cameraFly.position.copyFrom(camPos);
          cameraFly.setTarget(targetPos);
        } else {
          if (b.def.gasGiant || b.def.rocky === false) {
            setMode("fly");
            cameraFly.position.copyFrom(camPos);
            cameraFly.setTarget(targetPos);
            return;
          }

          // surface mode: entrar MUY cerca del suelo
          // Full detail ONLY when we go surface (regenerate mesh once)
          ensureFullDetailJsonBody(b, 8);

          // Enganchar el jugador al planeta (para rotación)
          attachPlayerToBody(b);

          surfaceBody = b;

          // 2) elegimos un punto cerca del terminador (se aprecia mejor la atmósfera)
          const starRef = b.starRef || sunMesh;
          const center = targetPos.clone();
          let N = new BABYLON.Vector3(0, 1, 0);
          if (starRef) {
            const L = starRef.getAbsolutePosition().subtract(center);
            if (L.length() > 1e-6) {
              L.normalize();
              const axis = (Math.abs(L.y) < 0.9) ? BABYLON.Axis.Y : BABYLON.Axis.X;
              const perp = BABYLON.Vector3.Cross(L, axis);
              if (perp.length() > 1e-6) {
                perp.normalize();
                N = BABYLON.Vector3.Cross(perp, L).normalize(); // dot(N,L)=0 => terminador
              }
            }
          }

          // 3) raycast hacia el planeta para clavar el suelo y aparecer a ~2m sobre el terreno
          const eyeH = 0.25; // altura de ojos (mucho más cerca)
          const rayO = center.add(N.scale(r * 2.2));
          const rayD = N.scale(-1);
          const ray = new BABYLON.Ray(rayO, rayD, r * 3.0);
          const hit = scn.pickWithRay(ray, (mesh) => {
            return (mesh === b.farMesh);
          });

          if (hit && hit.hit && hit.pickedPoint) {
            const up = hit.pickedPoint.subtract(center);
            if (up.length() > 1e-6) up.normalize();
            playerRoot.setAbsolutePosition(hit.pickedPoint.add(up.scale(eyeH)));
          } else {
            // fallback: casi a ras de esfera
            playerRoot.setAbsolutePosition(center.add(N.scale(r + eyeH)));
          }

          // Reset de dinámica / orientación
          try { playerVel.set(0, 0, 0); } catch (e) {}
          try { onGround = false; } catch (e) {}
          playerRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
          cameraSurface.rotation.set(0, 0, 0);
        }
      }

      ui.approachBtn.addEventListener("click", () => {
        // Aproximar respeta el modo actual:
        // - Órbita: engancha al cuerpo
        // - Vuelo: teleporta cerca (pero sigues libre)
        // - Superficie: te deja en superficie del objetivo
        approachTarget(null);
      });
      // ====================================================================
      // 7) Surface mode (JSON planets)
      // - Los planetas rocosos usan SIEMPRE el mesh generado por generate-planet-js.
      // - No hay planeta procedural por chunks.
      // ====================================================================

      // When switching to surface mode, just approach the selected rocky body
      ui.camSurfaceBtn.addEventListener("click", () => {
        const b = getSelectedBody();
        if (b && (b.def.gasGiant || b.def.rocky === false)) {
          ui.debugInfo.textContent = `⚠️ ${b.def.name}: gigante gaseoso (sin superficie).`;
          if (mode.value === "orbit") setMode("fly");
          approachTarget(null);
          return;
        }
        setMode("surface");
        approachTarget("surface");
      });

      // If user changes planet while in surface mode, keep current; user must click Aproximar to travel
      ui.planetSelect.addEventListener("change", () => {
        if (mode.value !== "surface") return;
        const sel = getSelectedBody();
        if (sel && (sel.def.gasGiant || sel.def.rocky === false)) {
          ui.debugInfo.textContent = `ℹ️ ${sel.def.name}: sin superficie. Pulsa Aproximar para ir en modo vuelo.`;
        } else {
          ui.debugInfo.textContent = "ℹ️ En superficie: selecciona otro cuerpo y pulsa Aproximar (o Superficie) para viajar.";
        }
      });

      // ====================================================================
      // 8) Surface movement + gravity (C-ready)
      // ====================================================================
      const input = {
        forward:false, back:false, left:false, right:false,
        sprint:false, jump:false,
      };

      window.addEventListener("keydown", (e) => {
        if (e.code === "KeyW") input.forward = true;
        if (e.code === "KeyS") input.back = true;
        if (e.code === "KeyA") input.left = true;
        if (e.code === "KeyD") input.right = true;
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") input.sprint = true;
        if (e.code === "Space") input.jump = true;
      });
      window.addEventListener("keyup", (e) => {
        if (e.code === "KeyW") input.forward = false;
        if (e.code === "KeyS") input.back = false;
        if (e.code === "KeyA") input.left = false;
        if (e.code === "KeyD") input.right = false;
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") input.sprint = false;
        if (e.code === "Space") input.jump = false;
      });

      let playerVel = new BABYLON.Vector3(0,0,0);
      let onGround = false;
	  
      // Yaw en el jugador (como Unity), pitch en la cámara:
      // La UniversalCamera seguirá recibiendo input de ratón, pero en superficie
      // absorbemos su rotY (yaw) y lo aplicamos al jugador para evitar flips en polos.
      let surfaceYaw = 0;

      // Ajustes (toca aquí)
      const surfaceCfg = {
        walkSpeed: 8.0,
        runSpeed: 14.0,
        jumpSpeed: 7.0,                // “impulso” inicial de salto
        gravity: 9.8,
        vSmoothTime: 0.10,
        airSmoothTime: 0.50,
        stickToGround: 8.0,            // fuerza hacia abajo en suelo (evita “rebotar” en bajadas)
        eyeHeight: 0.25,               // tu “altura de ojos” (rasante)
        pitchMin: -0.75,               // rad (~ -43º)
        pitchMax:  1.35,               // rad (~ 77º)
        rotSharpness: 14.0,            // mayor = rota/alinea más rápido
        groundRayUp: 1.2,              // origen del ray un poco por encima
        groundEps: 0.22,               // tolerancia para considerar grounded
        snapSharpness: 18.0,           // “pegado” al suelo
      };

      function surfaceStep(dt) {
        const b = getTargetBody();
        if (!b) return;

        // --- Temps reutilizables (evita GC stutter) ---
        // (se inicializan lazy la 1ª vez)
        if (!surfaceStep._t) {
          surfaceStep._t = {
            center: new BABYLON.Vector3(),
            pos: new BABYLON.Vector3(),
            toCenter: new BABYLON.Vector3(),
            down: new BABYLON.Vector3(),
            up: new BABYLON.Vector3(),
            forward: new BABYLON.Vector3(),
            right: new BABYLON.Vector3(),
            m: new BABYLON.Matrix(),
            desiredQ: new BABYLON.Quaternion(),
            ray: new BABYLON.Ray(BABYLON.Vector3.Zero(), BABYLON.Vector3.Up(), 1),
            targetPos: new BABYLON.Vector3(),
            refF: new BABYLON.Vector3(),
            proj: new BABYLON.Vector3(),
            qYaw: new BABYLON.Quaternion(),
            targetTangVel: new BABYLON.Vector3(),
            tangVel: new BABYLON.Vector3(),
            radVel: new BABYLON.Vector3(),
            tmp: new BABYLON.Vector3(),
          };
        }
        const t = surfaceStep._t;

        // center of planet in world
        const center = t.center;
        center.copyFrom(b.farMesh.getAbsolutePosition());

        // pos = player (world)
        const pos = t.pos;
        pos.copyFrom(playerRoot.getAbsolutePosition());

        // toCenter = center - pos
        t.toCenter.copyFrom(center).subtractInPlace(pos);
        const dist = t.toCenter.length();

        // down = normalize(toCenter)
        t.down.copyFrom(t.toCenter);
        if (dist > 1e-6) t.down.scaleInPlace(1 / dist);
        const down = t.down;

        // up = -down
        t.up.copyFrom(down).scaleInPlace(-1);
        const up = t.up;

        // --- Mouse: yaw al jugador, pitch a la cámara ---
        // absorbemos yaw acumulado en la cameraSurface (rot.y) y lo pasamos a surfaceYaw
        if (cameraSurface.rotation.y) {
          surfaceYaw += cameraSurface.rotation.y;
          cameraSurface.rotation.y = 0;
        }
        cameraSurface.rotation.x = BABYLON.Scalar.Clamp(cameraSurface.rotation.x, surfaceCfg.pitchMin, surfaceCfg.pitchMax);
        cameraSurface.rotation.z = 0;

        // --- Forward estable (sin flips en polos) ---
        // ref forward = eje global Z proyectado en tangente; si degenera, usa X
        t.refF.copyFrom(BABYLON.Axis.Z);
        const dzu = BABYLON.Vector3.Dot(t.refF, up);
        t.proj.copyFrom(up).scaleInPlace(dzu);
        t.refF.subtractInPlace(t.proj);
        if (t.refF.lengthSquared() < 1e-8) {
          t.refF.copyFrom(BABYLON.Axis.X);
          const dxu = BABYLON.Vector3.Dot(t.refF, up);
          t.proj.copyFrom(up).scaleInPlace(dxu);
          t.refF.subtractInPlace(t.proj);
        }
        t.refF.normalize();

        // forward = rotate(refF, around up, surfaceYaw)
        BABYLON.Quaternion.RotationAxisToRef(up, surfaceYaw, t.qYaw);
        t.refF.rotateByQuaternionToRef(t.qYaw, t.forward);
        t.forward.normalize();
        const forward = t.forward;

        BABYLON.Vector3.CrossToRef(up, forward, t.right);
        const rl = t.right.length();
        if (rl > 1e-6) t.right.scaleInPlace(1 / rl);
        const right = t.right;
		
        // Evita el "roll flip" (180º) al cruzar zonas polares:
        // si el right cambia de signo respecto al frame anterior, invertimos right+forward para mantener continuidad.
        const prevR = t.prevRight || (t.prevRight = new BABYLON.Vector3(1, 0, 0));
        if (BABYLON.Vector3.Dot(prevR, right) < 0) {
          right.scaleInPlace(-1);
          forward.scaleInPlace(-1);
        }
        prevR.copyFrom(BABYLON.Vector3.Lerp(prevR, right, 0.35));
        prevR.normalize();
        right.copyFrom(prevR);

        // rotation quaternion from basis (manual matrix)
        const m = t.m;
        const mm = m.m;
        mm[0]  = right.x;   mm[1]  = right.y;   mm[2]  = right.z;   mm[3]  = 0;
        mm[4]  = up.x;      mm[5]  = up.y;      mm[6]  = up.z;      mm[7]  = 0;
        mm[8]  = forward.x; mm[9]  = forward.y; mm[10] = forward.z; mm[11] = 0;
        mm[12] = 0;         mm[13] = 0;         mm[14] = 0;         mm[15] = 1;

        BABYLON.Quaternion.FromRotationMatrixToRef(m, t.desiredQ);
        const rotAlpha = 1 - Math.exp(-surfaceCfg.rotSharpness * dt);
        playerRoot.rotationQuaternion = BABYLON.Quaternion.Slerp(playerRoot.rotationQuaternion, t.desiredQ, rotAlpha);
 
        // --- Raycast suelo (mesh del planeta) ---
        const rayLen = Math.max(60, b.def.radius * 6);
        const ray = t.ray;
        // origen un poco por encima (evita nacer dentro del terreno)
        t.tmp.copyFrom(up).scaleInPlace(surfaceCfg.groundRayUp);
        ray.origin.copyFrom(pos).addInPlace(t.tmp);
        ray.direction.copyFrom(down);
        ray.length = rayLen;

        const hit = scn.pickWithRay(ray, (mesh) => mesh === b.farMesh);

        // --- Grounded + objetivo de altura ---
        onGround = false;
        const eyeHeight = surfaceCfg.eyeHeight;

        if (hit && hit.hit && hit.pickedPoint) {
          const dGround = BABYLON.Vector3.Distance(pos, hit.pickedPoint);
          onGround = (dGround <= (eyeHeight + surfaceCfg.groundEps));

          // targetPos = hitPoint + up * eyeHeight  (NO mutar up)
          t.tmp.copyFrom(up).scaleInPlace(eyeHeight);
          t.targetPos.copyFrom(hit.pickedPoint).addInPlace(t.tmp);
        }


        // --- Movimiento (tangencial) estilo Unity: targetVel suavizado ---
        // moveDir = forward/back + right/left
        const mv = surfaceStep._t.move || (surfaceStep._t.move = new BABYLON.Vector3());
        mv.set(0,0,0);
        if (input.forward) mv.addInPlace(forward);
        if (input.back) mv.subtractInPlace(forward);
        if (input.left) mv.subtractInPlace(right);
        if (input.right) mv.addInPlace(right);

        const speed = input.sprint ? surfaceCfg.runSpeed : surfaceCfg.walkSpeed;
        if (mv.lengthSquared() > 1e-10) {
          mv.normalize();
          t.targetTangVel.copyFrom(mv).scaleInPlace(speed);
        } else {
          t.targetTangVel.set(0,0,0);
        }

        // separar vel radial/tangencial
        const vRad = BABYLON.Vector3.Dot(playerVel, down);   // hacia el centro = positivo
        t.radVel.copyFrom(down).scaleInPlace(vRad);
        t.tangVel.copyFrom(playerVel).subtractInPlace(t.radVel);

        const smoothT = onGround ? surfaceCfg.vSmoothTime : surfaceCfg.airSmoothTime;
        const velAlpha = 1 - Math.exp(-dt / Math.max(1e-4, smoothT));
        t.tangVel = BABYLON.Vector3.LerpToRef(t.tangVel, t.targetTangVel, velAlpha, t.tangVel);

        // recomponer playerVel
        playerVel.copyFrom(t.tangVel).addInPlace(t.radVel);

        // --- Gravedad + stickToGround + salto ---
        if (onGround) {
          if (input.jump) {
            t.tmp.copyFrom(up).scaleInPlace(surfaceCfg.jumpSpeed);
            playerVel.addInPlace(t.tmp);
            onGround = false;
          } else {
            // pequeña fuerza hacia abajo para que no “rebote” al bajar pendientes
            t.tmp.copyFrom(down).scaleInPlace(surfaceCfg.stickToGround * dt);
            playerVel.addInPlace(t.tmp);
          }
        } else {
          t.tmp.copyFrom(down).scaleInPlace(surfaceCfg.gravity * dt);
          playerVel.addInPlace(t.tmp);
        }

        // Integrate
        t.tmp.copyFrom(playerVel).scaleInPlace(dt);
        const newPos = pos.add(t.tmp);
        playerRoot.setAbsolutePosition(newPos);

        // Snap a suelo (mantener eyeHeight SIEMPRE)
        if (hit && hit.hit && hit.pickedPoint) {
          const snapA = 1 - Math.exp(-surfaceCfg.snapSharpness * dt);
          const cur = playerRoot.getAbsolutePosition();
          playerRoot.setAbsolutePosition(BABYLON.Vector3.Lerp(cur, t.targetPos, snapA));

          // si la velocidad va “hacia dentro del suelo”, anula ese componente
          const into = BABYLON.Vector3.Dot(playerVel, down);
          if (into > 0) {
            t.tmp.copyFrom(down).scaleInPlace(into);
            playerVel.subtractInPlace(t.tmp);
          }
        }
      }

function updateOrbits(dt) {
        if (timeScale <= 0) return;

        // Planets around sun
        for (const [name, b] of bodies.entries()) {
          if (b.def.kind !== "planet") continue;

          const sysS = b.def._sysSpeed || 1;
          b.orbitAngle += (b.def.orbitSpeed * sysS) * dt * timeScale;
          b.orbitNode.rotation.y = b.orbitAngle;
		  
          // órbita excéntrica (si orbitEcc > 0): ajusta el radio local en X del mesh (y océano)
          const e = b.def.orbitEcc || 0;
          if (e > 0) {
            const a = b.def.orbitR;
            const th = b.orbitAngle;
            const r = (a * (1 - e*e)) / (1 + e * Math.cos(th));
            b.farMesh.position.set(r, 0, 0);
            if (b.ocean) {
            // Si el océano es hijo del land (JSON), su posición local debe ser (0,0,0)
            if (b.ocean.parent === b.farMesh) b.ocean.position.set(0, 0, 0);
				else b.ocean.position.set(r, 0, 0);
			}
          } else {
            // asegura que si alguien tocó position, vuelva al radio base
            b.farMesh.position.set(b.def.orbitR, 0, 0);
            if (b.ocean) {
            if (b.ocean.parent === b.farMesh) b.ocean.position.set(0, 0, 0);
				else b.ocean.position.set(b.def.orbitR, 0, 0);
			}
          }

          // spin
          b.farMesh.rotation.y += (b.def.rotSpeed || 0.01) * dt * timeScale;
          if (b.ring) b.ring.rotation.z += 0.3 * dt * timeScale;
        }

        // Moons around their parent planet
        for (const [moonId, moonOrbitNode] of moonOrbitNodes.entries()) {
          const m = bodies.get(moonId);
          if (!m) continue;

          const sysSm = m.def._sysSpeed || 1;
          m.orbitAngle += (m.def.orbitSpeed * sysSm) * dt * timeScale;
          moonOrbitNode.rotation.y = m.orbitAngle;
		  
          // órbita excéntrica opcional para lunas (normalmente 0)
          const me = m.def.orbitEcc || 0;
          if (me > 0) {
            const a = m.def.orbitR;
            const th = m.orbitAngle;
            const r = (a * (1 - me*me)) / (1 + me * Math.cos(th));
            m.farMesh.position.set(r, 0, 0);
            if (m.ocean) {
            if (m.ocean.parent === m.farMesh) m.ocean.position.set(0, 0, 0);
            else m.ocean.position.set(r, 0, 0);
            }
          } else {
            m.farMesh.position.set(m.def.orbitR, 0, 0);
            if (m.ocean) {
            if (m.ocean.parent === m.farMesh) m.ocean.position.set(0, 0, 0);
            else m.ocean.position.set(m.def.orbitR, 0, 0);
            }
          }

          // spin
          m.farMesh.rotation.y += m.def.rotSpeed * dt * timeScale;
        }
		
      }

      // ====================================================================
      // 10) 
      // ====================================================================
      // 9b) Camera safety: evitar atravesar planetas (colisión esférica barata)
      // ====================================================================
      const CAM_COLLISION_PADDING = 0.9; // uds
      function enforcePlanetCollision(cam) {
        if (!cam) return;
        const p = cam.position;

        for (const [, b] of bodies.entries()) {
          if (!b || !b.farMesh || !b.def || !b.def.radius) continue;
          if (b.def.kind !== "planet" && b.def.kind !== "moon") continue;

          const c = b.farMesh.getAbsolutePosition();
          const dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z;
          const d2 = dx*dx + dy*dy + dz*dz;

          const minR = (b.def.radius + CAM_COLLISION_PADDING);
          const minR2 = minR * minR;

          // early out si lejos
          if (d2 > (minR2 + 2500)) continue;

          if (d2 < minR2) {
            const d = Math.max(0.0001, Math.sqrt(d2));
            const inv = 1.0 / d;
            cam.position.x = c.x + dx * inv * minR;
            cam.position.y = c.y + dy * inv * minR;
            cam.position.z = c.z + dz * inv * minR;
          }
        }
      }

	  // Render loop logic
      // ====================================================================
      setMode("orbit");

      // initial approach nice view
      approachTarget(null);

      scn.onBeforeRenderObservable.add(() => {
        const dt = engine.getDeltaTime() / 1000;
        const camPos = scn.activeCamera ? scn.activeCamera.position : null;

        // ------------------------------------------------------------
        // LOD dinámico: solo el planeta/luna más cercano se regenera en high
        // (detalle completo) al acercarte. El resto se queda en low.
        // ------------------------------------------------------------
        if (camPos) updateDynamicLOD(camPos);

        if (camPos) {
          // Safety: ensure every body is linked to its system light (prevents dark bodies)
          relinkAllBodyMeshesToLights();

          // Enable planet-to-planet shadows for the nearest non-core system (cheap & effective)
          updateExtraSystemShadows();
        }

        // ------------------------------------------------------------
        // Atmósfera PP (generate-planet-js):
        // - Se activa para el planeta "objetivo" (surface) o el planeta con atmósfera más cercano (orbit/fly)
        // - Los parámetros (colores/strength/steps) vienen del JSON exportado.
        // ------------------------------------------------------------
        let atmoPPBody = null;
        if (atmoPP && camPos) {
          // Target:
          // - surface: el planeta al que está anclado el jugador (si existe)
          // - orbit/fly: el más cercano con genParams.atmoEnabled
          let best = null;
          let bestDist = Infinity;

          if (mode.value === "surface" && surfaceBody) {
            best = surfaceBody;
          } else {
            for (const [, b] of bodies.entries()) {
              if (!b || !b.farMesh || !b.def || !b.genParams || !b.genParams.atmoEnabled) continue;
              const p = b.farMesh.getAbsolutePosition();
              const dist = BABYLON.Vector3.Distance(camPos, p);
              const range = (typeof b.genParams.atmoRange === "number")
                ? b.genParams.atmoRange
                : (b.def.radius * 60);
              if (dist < range && dist < bestDist) {
                best = b;
                bestDist = dist;
              }
            }
          }

          if (best && best.genParams && best.genParams.atmoEnabled) {
            atmoPPBody = best;

            const params = best.genParams;
            const planetRadius = best.def.radius;
            const atmoRadius = planetRadius * (typeof params.atmoRadiusMul === "number" ? params.atmoRadiusMul : 1.055);

            // Star for this body
            const starRef = best.starRef || sunMesh;
            let sunPos = starRef ? starRef.getAbsolutePosition() : BABYLON.Vector3.Zero();

            // Guard: evita sunPos == planetPos
            const planetPos = best.farMesh.getAbsolutePosition();
            if (BABYLON.Vector3.DistanceSquared(sunPos, planetPos) < 1e-6) {
              sunPos = planetPos.add(new BABYLON.Vector3(1000, 0, 0));
            }

            // Aplicar params del JSON (solo cuando cambia el planeta objetivo)
            const defName = best.def.name || best.farMesh.name;
            if (atmoPP._lastDefName !== defName) {
              atmoPP._lastDefName = defName;

              const hexToV3 = (hex, fallback) => {
                try {
                  const c = BABYLON.Color3.FromHexString(hex || "");
                  return new BABYLON.Vector3(c.r, c.g, c.b);
                } catch (e) { return fallback; }
              };

              atmoPP._useDepth = !!params.atmoUseDepth;
              // IMPORTANTE:
              // Con scene.useLogarithmicDepth=true, el depth sampler NO coincide con el shader del generador
              // (se ve "raro"). Para que se vea como en generate-planet-js, forzamos sin depth.
              if (scn.useLogarithmicDepth) atmoPP._useDepth = false;

              atmoPP._atmoStrength  = (typeof params.atmoStrength === "number") ? params.atmoStrength : atmoPP._atmoStrength;
              atmoPP._mieStrength   = (typeof params.mieStrength === "number") ? params.mieStrength : atmoPP._mieStrength;
              atmoPP._upperStrength = (typeof params.upperStrength === "number") ? params.upperStrength : atmoPP._upperStrength;
              atmoPP._steps         = (typeof params.atmoSteps === "number") ? params.atmoSteps : atmoPP._steps;

              atmoPP._c0 = hexToV3(params.c0, atmoPP._c0);
              atmoPP._c1 = hexToV3(params.c1, atmoPP._c1);
              atmoPP._c2 = hexToV3(params.c2, atmoPP._c2);

              // Clouds (integrated in PP)
              atmoPP._cloudAlpha = (typeof params.cloudAlpha === "number") ? params.cloudAlpha : atmoPP._cloudAlpha;
              atmoPP._cloudScale = (typeof params.cloudScale === "number") ? params.cloudScale : atmoPP._cloudScale;
              atmoPP._cloudSharpness = (typeof params.cloudSharpness === "number") ? params.cloudSharpness : atmoPP._cloudSharpness;
              const wx = (typeof params.cloudWindX === "number") ? params.cloudWindX : 0.020;
              const wz = (typeof params.cloudWindZ === "number") ? params.cloudWindZ : 0.012;
              atmoPP._cloudWind = new BABYLON.Vector3(wx, 0.0, wz);
              atmoPP._cloudTint = hexToV3(params.cloudTint, atmoPP._cloudTint);
            }

            setAtmosphereTarget(atmoPP, best.farMesh, planetRadius, atmoRadius, sunPos);
            enableAtmospherePP(atmoPP, true);
            updateAtmospherePP(atmoPP, performance.now() * 0.001);
          } else {
            enableAtmospherePP(atmoPP, false);
          }
        } else if (atmoPP) {
          enableAtmospherePP(atmoPP, false);
        }

        // Rings & atmospheres now use shader-based per-fragment lighting/shadow.
		
        // ------------------------------------------------------------
        // Fly sprint (Shift): aumenta velocidad en modo "fly"
        // ------------------------------------------------------------
        if (mode.value === "fly") {
          const base = cameraFly._flyBaseSpeed || 2.2;
          const spr  = cameraFly._flySprintSpeed || 7.5;
          cameraFly.speed = input.sprint ? spr : base;

        }

        // ------------------------------------------------------------
        // Cheap planet collision in galaxy modes (no Babylon collisions)
        // ------------------------------------------------------------
        if (mode.value === "fly") enforcePlanetCollision(cameraFly);
        if (mode.value === "orbit") enforcePlanetCollision(cameraOrbit);

        // keep sunlight at sun
        if (sunMesh) sunLight.position.copyFrom(sunMesh.position);
        // ------------------------------------------------------------
        // Rings update (shadow + lighting)
        // ------------------------------------------------------------
        if (camPos) {
          for (const [, b] of bodies.entries()) {
            if (!b || !b.farMesh || !b.ring) continue;
            const p = b.farMesh.getAbsolutePosition();
            const starRef = b.starRef || sunMesh;
            const sunPos = starRef ? starRef.getAbsolutePosition() : null;
            if (sunPos) updateRings(b.ring, p, sunPos, b.def.radius);
          }
        }

        // animate halo (subtle breathing)
        const t = performance.now() * 0.001;
        if (halo) {
          halo.scaling.set(1 + Math.sin(t*0.8)*0.01, 1 + Math.sin(t*0.9)*0.01, 1 + Math.sin(t*0.7)*0.01);
        }

        // orbits always (even in fly), but you can pause by setting timeScale=0
        updateOrbits(dt);
        // surface mode: movement only (planet mesh always comes from generate-planet-js)
        let chunks = 0;
        if (mode.value === "surface") {
          surfaceStep(dt);
        }

        // Labels: throttle (barato)
        updateLabelVisibility(false);

        // Rendimiento: no actualizar el DOM cada frame
        if (!scn._dbgT || (performance.now() - scn._dbgT) > 350) {
          scn._dbgT = performance.now();
          ui.debugInfo.textContent = `Chunks activos: ${chunks} | FPS: ${engine.getFps().toFixed(0)}`;
        }
      });


	  // Orbit update barato para TODOS usando tiempo absoluto
	  function updateAllOrbitsAbsolute(nowSec) {
	    const t = nowSec * timeScale;
	    
	    for (const [name, b] of bodies.entries()) {
		  if (!b || !b.def) continue;
		  const def = b.def;
	    
		  if (def.kind === "sun") {
		  if (b.farMesh) b.farMesh.rotation.y = t * (def.rotSpeed || 0.02);
		  continue;
		  }
	    
		  if (b.orbitNode) {
		  const ang = t * (def.orbitSpeed || 0.001);
		  b.orbitNode.rotation.y = ang;
		  }
	    
		  if (b.farMesh) {
		  b.farMesh.rotation.y = t * (def.rotSpeed || 0.01);
		  }
	    }
	  }

      return scn;
    };

    createScene()
      .then((scene) => {
        engine.runRenderLoop(() => scene.render());
        window.addEventListener("resize", () => engine.resize());
      })
      .catch((err) => {
        console.error("Error al crear la escena:", err);
        const el = document.getElementById("galaxyReport");
        if (el) el.innerHTML = `<span class="warn">❌ Error al iniciar: ${String(err?.message || err)}</span>`;
      });
  
