import { ProceduralPlanet } from "./planets/proceduralPlanet.js";
import { createLowPolyFarPlanet } from "./planets/farPlanet.js";
import { makeAtmosphere, updateAtmosphere } from "./planets/atmosphere.js";
import { makeRings, updateRings } from "./planets/rings.js";
import { createStarDotManager, createStarDotSprite } from "./galaxy/starDots.js";
import { buildSystems } from "./galaxy/systems.js";


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

    const createScene = () => {
      const scn = new BABYLON.Scene(engine);
      const starDotMgr = createStarDotManager(scn, 8000);
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
	  
      // Mantener las estrellas "infinito" siguiendo la cámara
      scn.onBeforeRenderObservable.add(() => {
        if (starsMesh && scn.activeCamera) {
          starsMesh.position.copyFrom(scn.activeCamera.position);
        }

        // Ajuste de tamaño para los "dots" de estrellas (>= 1px en pantalla)
        const cam = scn.activeCamera;
        if (cam && galaxyStarDots.length) {
          // cálculo worldUnits por píxel (aprox) usando FOV vertical
          const vh = engine.getRenderHeight(true);
          const fov = (typeof cam.fov === "number") ? cam.fov : 0.8;
          const tanHalf = Math.tan(fov * 0.5);
          const camPos = cam.globalPosition || cam.position;
          const targetPx = 1.25; // "aunque sea un px"
  
          for (const s of galaxyStarDots) {
            const dot = s.dot;
            if (!dot) continue;
            if (typeof dot.isDisposed === "function" && dot.isDisposed()) continue;

            // Mesh vs Sprite compatibility
            const p = (typeof dot.getAbsolutePosition === "function")
              ? dot.getAbsolutePosition()
              : (dot.position || null);
            if (!p) continue;

            const dist = BABYLON.Vector3.Distance(camPos, p);
            // world size que equivale a ~1.25px a esa distancia
            const worldPerPx = (2 * dist * tanHalf) / Math.max(1, vh);
            const size = Math.max(worldPerPx * targetPx, s.radius * 0.035);

            // Mesh: scaling; Sprite: size
            if (dot.scaling && typeof dot.scaling.setAll === "function") {
              dot.scaling.setAll(size);
            } else if ("size" in dot) {
              dot.size = size;
            }

            // si estás muy cerca de la estrella, el "dot" molesta: lo ocultamos
            const nearCut = s.radius * 12;
            const hide = dist < nearCut;
            if ("visibility" in dot) dot.visibility = hide ? 0 : 1;
            else if ("isVisible" in dot) dot.isVisible = !hide;
          }
        }

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

      // Luz de "linterna" en superficie (evita que el terreno quede negro si el sol no incluye los chunks)
      const playerLamp = new BABYLON.PointLight("playerLamp", new BABYLON.Vector3(0, 0.25, 0), scn);
      playerLamp.parent = cameraSurface;
      playerLamp.intensity = 0.85;
      playerLamp.range = 140;
      playerLamp.setEnabled(false);

      // Lights
      const sunLight = new BABYLON.PointLight("sunLight", BABYLON.Vector3.Zero(), scn);
      sunLight.intensity = 2.2;
      sunLight.range = 8000;

      
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
      const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scn);
      hemi.intensity = 0.10;
      hemi.diffuse = new BABYLON.Color3(0.1, 0.1, 0.2); // Tinte azulado para ambiente espacial
      hemi.groundColor = new BABYLON.Color3(0,0,0);

      // Un pelín de ambiente para que no queden negros en superficie sin "subir" el cielo
      scn.ambientColor = new BABYLON.Color3(0.05, 0.05, 0.06);

      // Shadows (optional)
      const shadowGen = new BABYLON.ShadowGenerator(2048, sunLight);
      // Rendimiento: Poisson es mucho más barato que contact hardening
      shadowGen.usePoissonSampling = true;
      shadowGen.bias = 0.00025;
      shadowGen.normalBias = 0.01;

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

      // Create meshes
      const bodies = new Map(); // name => body
      const orbitNodes = new Map(); // name => node rotated around sun
      const moonOrbitNodes = new Map(); // moon around parent
      let sunMesh = null; // set when Canopus is created via createStarSystem(coreSystem)
      let halo = null; // core-system halo mesh (created in createStarSystem for Canopus)

      // Ensure sunLight follows sun (in case you move it later)
      if (sunMesh) sunLight.position.copyFrom(sunMesh.position);
      // GUI labels (optional)
      const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui", true, scn);
      function createLabel(text, mesh) {
        const rect = new BABYLON.GUI.Rectangle("lbl_" + text);
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
        return rect;
      }

              // ============================================================
// Labels: registro + visibilidad (throttle)
// - Estrellas siempre visibles
// - Planetas y lunas: solo los cercanos (por ranking + distancia)
// - Permite apagar/encender desde UI
// ============================================================
const labelsByName = new Map(); // name -> { rect, kind, mesh }
let showLabels = true;

function registerLabel(name, kind, mesh) {
  if (!mesh) return null;
  let meta = labelsByName.get(name);
  if (!meta) {
    const rect = createLabel(name, mesh);
    meta = { rect, kind, mesh };
    labelsByName.set(name, meta);
  } else {
    meta.kind = kind || meta.kind;
    meta.mesh = mesh || meta.mesh;
  }
  return meta.rect;
}

const LABEL_NEAREST_BODIES = 10;   // cuántos planetas/lunas mostrar como "cercanos"
const LABEL_MAX_DIST = 1200;       // además, muestra cuerpos dentro de esta distancia
const LABEL_UPDATE_MS = 220;       // throttle del cálculo

function setAllLabelsVisible(v) {
  for (const { rect } of labelsByName.values()) rect.isVisible = !!v;
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
  for (const meta of labelsByName.values()) {
    if (meta.kind === "sun") meta.rect.isVisible = true;
  }

  // 2) ranking de cercanos (planetas + lunas)
  const ranked = [];
  for (const [name, b] of bodies.entries()) {
    if (!b || !b.def || !b.farMesh) continue;
    const k = b.def.kind;
    if (k !== "planet" && k !== "moon") continue;
    const p = b.farMesh.getAbsolutePosition();
    const d2 = BABYLON.Vector3.DistanceSquared(camPos, p);
    ranked.push({ name, d2 });
  }
  ranked.sort((a,b)=>a.d2-b.d2);

  const visible = new Set();
  for (let i=0; i<ranked.length && i<LABEL_NEAREST_BODIES; i++) visible.add(ranked[i].name);
  for (const r of ranked) {
    if (r.d2 <= maxD2) visible.add(r.name);
    else break;
  }

  // 3) aplica visibilidad (todo lo que no sea estrella => depende del set)
  for (const [name, meta] of labelsByName.entries()) {
    if (meta.kind === "sun") continue;
    meta.rect.isVisible = visible.has(name);
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

      function buildSpiralSystemPositions(systems) {
        const map = new Map();
        for (let i = 0; i < systems.length; i++) {
          const sys = systems[i];
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
      const galaxyPosBySystemId = buildSpiralSystemPositions(extraSystems);
	  
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
        const gpos = galaxyPosBySystemId.get(sys.id) || (sys.pos || BABYLON.Vector3.Zero());
        root.position.copyFrom(gpos);
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
          spr.renderingGroupId = 1;
          starDot = spr;
        }

        galaxyStarDots.push({ dot: starDot, star, radius: sys.star.radius });

        bodies.set(starName, {
          def: sys.star,
          farMesh: star,
		  ocean: null,
          atmo: null,
          ring: null,
          // reference star for day/night shading of atmo/rings
          starRef: star,
          orbitAngle: 0,
          orbitNode: null,
          proc: null,
        });

        // Local/system light (extras) — Canopus usa sunLight
        let local = null;
        if (!isCore) {
          local = new BABYLON.PointLight(sys.id + "_light", new BABYLON.Vector3(0,0,0), scn);
          local.parent = star;
          local.intensity = (sys.star.lightIntensity != null) ? sys.star.lightIntensity : 1.85;
          local.range = (sys.star.lightRange != null) ? sys.star.lightRange : 900;
          local.includedOnlyMeshes = [];
          local.setEnabled(true);
          systemLights.push({ light: local, root, range: local.range });

          // Mapear estrella -> luz local
          lightByStarMesh.set(star, local);
        }

        function linkToLight(mesh, ocean, clouds) {
          if (!mesh) return;
          if (isCore) {
            mainLitMeshes.push(mesh);
            if (ocean) mainLitMeshes.push(ocean);
			if (clouds) mainLitMeshes.push(clouds);
          } else if (local) {
            local.includedOnlyMeshes.push(mesh);
            if (ocean) local.includedOnlyMeshes.push(ocean);
			if (clouds) local.includedOnlyMeshes.push(clouds);
          }
        }

        function applyShadows(mesh, ocean, clouds) {
          if (!mesh) return;
          if (isCore) {
            shadowGen.addShadowCaster(mesh);
            mesh.receiveShadows = true;
            if (ocean) ocean.receiveShadows = false;
			if (clouds) clouds.receiveShadows = false;
          } else {
            mesh.receiveShadows = false;
            if (ocean) ocean.receiveShadows = false;
			if (clouds) clouds.receiveShadows = false;
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

          const orbitNode = new BABYLON.TransformNode(pDef.name + "_orbit", scn);
          orbitNode.parent = root;
          orbitNode.position.set(0, 0, 0);
          orbitNodes.set(pDef.name, orbitNode);

          const created = createLowPolyFarPlanet(scn, pDef, orbitNode);
          const mesh  = created.land;
          const ocean = created.ocean;
		  const clouds = created.clouds || null;
		  
          // rings (core only, por ahora)
          const ring = isCore ? createRings(pDef, mesh) : null;

          // Atmosphere (LOD: se activa solo cerca)
          const atmo = (pDef.atmo || pDef.atmoColor)
            ? makeAtmosphere(
                scn,
                mesh,
                pDef.radius,
                (pDef.atmoColor || new BABYLON.Color3(0.35, 0.55, 1.0)),
                (pDef.atmoAlpha != null ? pDef.atmoAlpha : 0.28),
                // Optional per-body tuning from systems.js:
                // - atmoLayers: array of layer descriptors (inner→outer)
                // - atmoOpts:  global knobs (mieStrength, pathStrength, noiseStrength, ...)
                (pDef.atmoLayers || pDef.atmoOpts)
                  ? { ...(pDef.atmoOpts || {}), layers: pDef.atmoLayers }
                  : undefined
              )
            : null;
          if (atmo) atmo.setEnabled(false);

          mesh.isPickable = false;
          if (ocean) ocean.isPickable = false;
		  if (clouds) clouds.isPickable = false;
          if (ring) ring.isPickable = false;
		  
          applyShadows(mesh, ocean, clouds);
          linkToLight(mesh, ocean, clouds);

          bodies.set(pDef.name, {
            def: pDef,
            farMesh: mesh,
			ocean,
            atmo,
            ring,
            starRef: star,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitNode,
            proc: null,
          });

          // Congela materiales en far para sistemas lejanos
          if (!isCore) {
            if (mesh.material && mesh.material.freeze) mesh.material.freeze();
            if (ocean && ocean.material && ocean.material.freeze) ocean.material.freeze();
            if (clouds && clouds.material && clouds.material.freeze) clouds.material.freeze();
            if (ring && ring.material && ring.material.freeze) ring.material.freeze();
          }
        }

        // Moons (solo si sys.moons existe; coreSystem las usa)
        for (const mDef of (sys.moons || [])) {
          if (!mDef.parent) continue;
          mDef._sysSpeed = sys.speedScale || 1;

          const parentBody = bodies.get(mDef.parent);
          if (!parentBody) {
            console.warn("[moon] parent no encontrado:", mDef.parent, "para", mDef.name);
            continue;
          }

          const moonOrbitNode = new BABYLON.TransformNode(mDef.name + "_moonOrbit", scn);
          moonOrbitNode.parent = parentBody.farMesh;
          moonOrbitNode.position.set(0,0,0);
          moonOrbitNodes.set(mDef.name, moonOrbitNode);

          const created = createLowPolyFarPlanet(scn, mDef, moonOrbitNode);
          const mesh = created.land;
          const ocean = created.ocean;
		  const clouds = created.clouds || null;

          mesh.isPickable = false;
          if (ocean) ocean.isPickable = false;
		  if (clouds) clouds.isPickable = false;

          applyShadows(mesh, ocean, clouds);
          linkToLight(mesh, ocean, clouds);
		  
          // Atmosphere (LOD: solo visible cerca)
          const atmoM = (mDef.atmo || mDef.atmoColor)
            ? makeAtmosphere(
                scn,
                mesh,
                mDef.radius,
                (mDef.atmoColor || new BABYLON.Color3(0.35,0.55,1.0)),
                (mDef.atmoAlpha != null ? mDef.atmoAlpha : 0.22),
                (mDef.atmoLayers || mDef.atmoOpts)
                  ? { ...(mDef.atmoOpts || {}), layers: mDef.atmoLayers }
                  : undefined
              )
            : null;
          if (atmoM) atmoM.setEnabled(false);

          bodies.set(mDef.name, {
            def: mDef,
            farMesh: mesh,
			ocean,
            atmo: atmoM,
            ring: null,
            starRef: star,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitNode: moonOrbitNode,
            proc: null,
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
      // 4) Labels + UI populate (incluye sistemas extra)
      // ====================================================================
      const allDefs = bodyDefs.concat(
        extraSystems
          .filter(s => s.id !== "Canopus")
          .flatMap(s => [s.star, ...(s.planets || []), ...((s.moons) || [])])
      );

	  for (const def of allDefs) {
        if (!def) continue;
        // Normaliza nombre y evita entries vacíos en el selector/labels
        const n = (typeof def.name === "string") ? def.name.trim() : "";
        if (!n) {
          console.warn("[skip] body sin nombre:", def);
          continue;
        }
        def.name = n;
        const opt = document.createElement("option");
        opt.value = n;
        opt.innerText = n;
        ui.planetSelect.appendChild(opt);
        const lb = bodies.get(n);
        if (lb && lb.farMesh) registerLabel(n, def.kind, lb.farMesh); 
      }
      ui.planetSelect.value = "Arrakis";
      updateLabelVisibility(true);

      // ====================================================================
      // 5) Modes: orbit / fly / surface
      // ====================================================================
      const mode = { value: "orbit" }; // orbit | fly | surface

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
        ui.modePill.textContent = (m === "orbit") ? "Órbita" : (m === "fly" ? "Vuelo" : "Superficie");

        updateModeButtons();

        // Fog/"aire" solo en superficie (se ajusta por planeta en el loop)
        if (m !== "surface") {
          try { scn.fogMode = BABYLON.Scene.FOGMODE_NONE; } catch(e) {}
        }

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
      function getTargetBody() {
        const name = ui.planetSelect.value;
        return bodies.get(name);
      }

      function approachTarget(preferredMode = null) {
        const b = getTargetBody();
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
          // 1) activamos procedural (y su atmo) para el objetivo
          ensureProceduralForBody(b);
          enableProceduralOnly(b.def.name);

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
            return b.proc && b.proc.enabled
              ? !!(mesh && mesh.metadata && mesh.metadata.isChunk && mesh.metadata.planet === b.proc.name)
              : (mesh === b.farMesh);
          });

          if (hit && hit.hit && hit.pickedPoint) {
            const up = hit.pickedPoint.subtract(center);
            if (up.length() > 1e-6) up.normalize();
            playerRoot.position.copyFrom(hit.pickedPoint.add(up.scale(eyeH)));
          } else {
            // fallback: casi a ras de esfera
            playerRoot.position.copyFrom(center.add(N.scale(r + eyeH)));
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
      // 7) Procedural planet activation (Surface mode)
      // ====================================================================
      function ensureProceduralForBody(body) {
        if (!body.def.rocky) return;
        if (body.proc) return;

        // Solo el sistema núcleo (Canopus) tiene sombras activas (shadowGen usa sunLight)
        const useShadows = (sunMesh && body.starRef === sunMesh);
        const proc = new ProceduralPlanet(scn, body.def.name, body.def.radius, (useShadows ? shadowGen : null), body.def);

        // Asegura que los chunks procedurales queden iluminados por la luz correcta
        // (en este proyecto, las luces usan includedOnlyMeshes por rendimiento)
        proc.onChunkMesh = (mesh) => {
          includeMeshInBodyLight(mesh, body);
        };

        // Preset desde bodyDefs
        if (body.def.biomePreset) proc.biomePreset = body.def.biomePreset;
        if (body.def.terrainScale != null) proc.terrainScale = body.def.terrainScale;
        if (body.def.seaLevel != null) proc.seaLevel = body.def.seaLevel;
        if (body.def.noiseFrequency != null) proc.noiseFrequency = body.def.noiseFrequency;
        if (body.def.noiseOctaves != null) proc.noiseOctaves = body.def.noiseOctaves;
        // en superficie mantenemos low-poly pero con chunks
        // Rendimiento: menos vértices y menos niveles
        proc.chunkResolution = 12;
        proc.maxDetailLevel = 5;
        proc._maxSplitsPerFrame = 6;

        // Atmosfera en superficie: la far-atmo se oculta al desactivar el farMesh,
        // así que creamos una atmósfera "cercana" pegada al procedural.
        // Además, usamos capas más pequeñas (1.02–1.12) para que no explote el tamaño.
        if (body.def.atmo || body.def.atmoColor) {
          const c = body.def.atmoColor || new BABYLON.Color3(0.35, 0.55, 1.0);
          const baseA = (body.def.atmoAlpha != null ? body.def.atmoAlpha : 0.24);
          const a = Math.min(0.55, Math.max(0.06, baseA * 1.8)); // en superficie se nota más

          const saneLayers = Array.isArray(body.def.atmoLayers)
            ? body.def.atmoLayers.filter(L => (L && typeof L.mul === "number" && L.mul > 1.0 && L.mul < 1.5))
            : null;

          const surfaceLayers = (saneLayers && saneLayers.length >= 2)
            ? saneLayers
            : [
                { mul: 1.020, aMul: 0.95, rimPower: 3.2, terminatorSoftness: 0.18, nightMin: 0.05, mieStrength: 0.25, pathStrength: 0.35, layerFade: 1.00 },
                { mul: 1.065, aMul: 1.00, rimPower: 4.6, terminatorSoftness: 0.22, nightMin: 0.08, mieStrength: 0.55, pathStrength: 0.22, layerFade: 0.85 },
                { mul: 1.120, aMul: 0.55, rimPower: 6.0, terminatorSoftness: 0.28, nightMin: 0.10, mieStrength: 0.75, pathStrength: 0.12, layerFade: 0.65 },
              ];

          const atmoOpts = {
            ...(body.def.atmoOpts || {}),
            layers: surfaceLayers,
            // un pelín más de ruido para romper uniformidad cuando estás cerca
            noiseStrength: (body.def.atmoOpts && typeof body.def.atmoOpts.noiseStrength === "number")
              ? Math.max(body.def.atmoOpts.noiseStrength, 0.12)
              : 0.14,
          };

          try {
            proc.atmo = makeAtmosphere(scn, proc.root, body.def.radius, c, a, atmoOpts);
            proc.atmo.setEnabled(false);
          } catch (e) {
            console.warn("[surface-atmo] no se pudo crear atmósfera procedural", e);
          }
        }

        body.proc = proc;
      }

      function enableProceduralOnly(name) {
        for (const [n, b] of bodies.entries()) {
          if (b.proc) b.proc.setEnabled(false);
          // also hide far mesh for active rocky planet to avoid z-fighting when near surface
          if (b.def.rocky) b.farMesh.setEnabled(true);
        }

        const b = bodies.get(name);
        if (!b || !b.proc) return;

        // show proc, hide far sphere (and its atmo) for this planet
        b.proc.setEnabled(true);
        b.farMesh.setEnabled(false);
      }

      // When switching to surface mode, approach and enable LOD for selected planet
      ui.camSurfaceBtn.addEventListener("click", () => {
        // ensure procedural is prepared
        const b = getTargetBody();
        if (b && (b.def.gasGiant || b.def.rocky === false)) {
          ui.debugInfo.textContent = `⚠️ ${b.def.name}: gigante gaseoso (sin superficie).`;
          if (mode.value === "orbit") setMode("fly");
          approachTarget(null);
          return;
        }
        if (b && b.def.rocky) ensureProceduralForBody(b);
        setMode("surface");
        approachTarget("surface");
      });

      // If user changes planet while in surface mode, switch planet
      ui.planetSelect.addEventListener("change", () => {
        if (mode.value === "surface") {
          const b = getTargetBody();
          if (b && (b.def.gasGiant || b.def.rocky === false)) {
            ui.debugInfo.textContent = `⚠️ ${b.def.name}: gigante gaseoso (sin superficie). Cambiando a vuelo.`;
            setMode("fly");
            approachTarget("fly");
            return;
          }
          if (b && b.def.rocky) ensureProceduralForBody(b);
          approachTarget("surface");
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
            forwardWorld: new BABYLON.Vector3(),
            forwardOnTangent: new BABYLON.Vector3(),
            forward: new BABYLON.Vector3(),
            right: new BABYLON.Vector3(),
            m: new BABYLON.Matrix(),
            desiredQ: new BABYLON.Quaternion(),
            ray: new BABYLON.Ray(BABYLON.Vector3.Zero(), BABYLON.Vector3.Up(), 1),
            targetPos: new BABYLON.Vector3(),
          };
        }
        const t = surfaceStep._t;

        // center of planet in world
        const center = t.center;
        center.copyFrom(b.farMesh.getAbsolutePosition());
        if (b.proc && b.proc.enabled) center.copyFrom(b.proc.root.position);

        const pos = t.pos;
        pos.copyFrom(playerRoot.position);

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

        // Orient playerRoot so its "up" matches local up (smooth)
        const fw = cameraSurface.getForwardRay(1).direction;
        t.forwardWorld.copyFrom(fw);

        // forwardOnTangent = forwardWorld - up*(dot(forwardWorld, up))
        const dotFU = BABYLON.Vector3.Dot(t.forwardWorld, up);
        t.forwardOnTangent.copyFrom(t.forwardWorld).subtractInPlace(up.scale(dotFU));

        const fLen = t.forwardOnTangent.length();
        if (fLen > 1e-4) {
          t.forward.copyFrom(t.forwardOnTangent).scaleInPlace(1 / fLen);
        } else {
          // fallback
          BABYLON.Vector3.CrossToRef(BABYLON.Axis.X, up, t.forward);
          const fl2 = t.forward.length();
          if (fl2 > 1e-6) t.forward.scaleInPlace(1 / fl2);
        }
        const forward = t.forward;

        BABYLON.Vector3.CrossToRef(up, forward, t.right);
        const rl = t.right.length();
        if (rl > 1e-6) t.right.scaleInPlace(1 / rl);
        const right = t.right;

        // rotation quaternion from basis (manual matrix)
        const m = t.m;
        const mm = m.m;
        mm[0]  = right.x;   mm[1]  = right.y;   mm[2]  = right.z;   mm[3]  = 0;
        mm[4]  = up.x;      mm[5]  = up.y;      mm[6]  = up.z;      mm[7]  = 0;
        mm[8]  = forward.x; mm[9]  = forward.y; mm[10] = forward.z; mm[11] = 0;
        mm[12] = 0;         mm[13] = 0;         mm[14] = 0;         mm[15] = 1;

        BABYLON.Quaternion.FromRotationMatrixToRef(m, t.desiredQ);
        playerRoot.rotationQuaternion = BABYLON.Quaternion.Slerp(playerRoot.rotationQuaternion, t.desiredQ, 0.18);

        // Raycast to ground against procedural chunks if available, else against far mesh
        const rayLen = Math.max(60, b.def.radius * 6);
        const ray = t.ray;
        ray.origin.copyFrom(pos);
        ray.direction.copyFrom(down);
        ray.length = rayLen;

        let hit = null;
        if (b.proc && b.proc.enabled) {
          hit = scn.pickWithRay(ray, (mesh) => {
            return !!(mesh && mesh.metadata && mesh.metadata.isChunk && mesh.metadata.planet === b.proc.name);
          });
        } else {
          hit = scn.pickWithRay(ray, (mesh) => mesh === b.farMesh);
        }

        onGround = false;
        const eyeHeight = 0.25;

        if (hit && hit.hit && hit.pickedPoint) {
          const dGround = BABYLON.Vector3.Distance(pos, hit.pickedPoint);
          if (dGround < eyeHeight + 0.8) {
            onGround = true;
            t.targetPos.copyFrom(hit.pickedPoint).addInPlace(up.scale(eyeHeight));
            playerRoot.position = BABYLON.Vector3.Lerp(playerRoot.position, t.targetPos, 0.25);
            playerVel = playerVel.scale(0.75);
          }
        }

        // Gravity
        const g = 9.8;
        if (!onGround) {
          playerVel.addInPlace(down.scale(g * dt));
        } else {
          if (input.jump) {
            playerVel.addInPlace(up.scale(7.0));
            onGround = false;
          }
        }

        // Tangential movement
        const baseSpeed = input.sprint ? 11.0 : 6.0;
        let move = BABYLON.Vector3.Zero();
        // use temp vector for move
        const mv = surfaceStep._t.move || (surfaceStep._t.move = new BABYLON.Vector3());
        mv.set(0,0,0);
        if (input.forward) mv.addInPlace(forward);
        if (input.back) mv.subtractInPlace(forward);
        if (input.left) mv.subtractInPlace(right);
        if (input.right) mv.addInPlace(right);

        const mLen = mv.length();
        if (mLen > 1e-4) {
          mv.scaleInPlace(baseSpeed / mLen);
          playerVel.x += mv.x * dt * 18;
          playerVel.y += mv.y * dt * 18;
          playerVel.z += mv.z * dt * 18;
        }

        // damping
        playerVel.scaleInPlace(0.985);

        // integrate
        playerRoot.position.addInPlace(playerVel.scale(dt));
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
            if (b.ocean) b.ocean.position.set(r, 0, 0);
          } else {
            // asegura que si alguien tocó position, vuelva al radio base
            b.farMesh.position.set(b.def.orbitR, 0, 0);
            if (b.ocean) b.ocean.position.set(b.def.orbitR, 0, 0);
          }

          // spin
          b.farMesh.rotation.y += (b.def.rotSpeed || 0.01) * dt * timeScale;
          if (b.ring) b.ring.rotation.z += 0.3 * dt * timeScale;

          // if procedural exists, keep it aligned with far mesh position and rotation
          if (b.proc) {
            b.proc.root.position.copyFrom(b.farMesh.getAbsolutePosition());
            b.proc.root.rotationQuaternion = b.farMesh.rotationQuaternion ? b.farMesh.rotationQuaternion.clone() : BABYLON.Quaternion.FromEulerAngles(0, b.farMesh.rotation.y, 0);
          }
        }

        // Moons around their parent planet
        for (const [moonName, moonOrbitNode] of moonOrbitNodes.entries()) {
          const m = bodies.get(moonName);
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
            if (m.ocean) m.ocean.position.set(r, 0, 0);
          } else {
            m.farMesh.position.set(m.def.orbitR, 0, 0);
            if (m.ocean) m.ocean.position.set(m.def.orbitR, 0, 0);
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
        // Atmospheres: solo visibles cuando te acercas al cuerpo
        // + Dim unlit atmo/rings on the night side
        // ------------------------------------------------------------
        if (camPos) {
          for (const [, b] of bodies.entries()) {
            if (!b || !b.farMesh) continue;
            const p = b.farMesh.getAbsolutePosition();

            // Find the star for this body (stored at creation time).
            const starRef = b.starRef || sunMesh;
            const sunPos = starRef ? starRef.getAbsolutePosition() : null;

            // Atmosphere LOD + day/night dim
            if (b.atmo) {
              const dist = BABYLON.Vector3.Distance(camPos, p);
              const range = (typeof b.def.atmoRange === "number")
                ? b.def.atmoRange
                : (b.def.radius * 60);
              const enable = dist < range;
              if (b.atmo.isEnabled() !== enable) b.atmo.setEnabled(enable);
              if (enable && sunPos) {
                updateAtmosphere(b.atmo, p, sunPos, camPos);
              }
            }

            // Rings: per-fragment lighting + true shadow
            if (b.ring && sunPos) {
              updateRings(b.ring, p, sunPos, b.def.radius);
            }
          }
        }

        // animate halo (subtle breathing)
        const t = performance.now() * 0.001;
        if (halo) {
          halo.scaling.set(1 + Math.sin(t*0.8)*0.01, 1 + Math.sin(t*0.9)*0.01, 1 + Math.sin(t*0.7)*0.01);
        }

        // orbits always (even in fly), but you can pause by setting timeScale=0
        updateOrbits(dt);

        // surface mode: enable procedural only for selected rocky planet
        let chunks = 0;
        if (mode.value === "surface") {
          const b = getTargetBody();
          if (b && b.def.rocky) {
            ensureProceduralForBody(b);
            enableProceduralOnly(b.def.name);
            if (b.proc) {
              b.proc.update(scn.activeCamera);
              chunks = b.proc.countActiveChunks();
            }

            // Atmosfera visible también en superficie (la far-atmo está oculta)
            // + Fog suave para sensación de "aire" / polvo
            const starRef = b.starRef || sunMesh;
            const sunPos = starRef ? starRef.getAbsolutePosition() : null;
            const center = (b.proc && b.proc.enabled) ? b.proc.root.getAbsolutePosition() : b.farMesh.getAbsolutePosition();

            if (b.proc && b.proc.atmo) {
              if (!b.proc.atmo.isEnabled()) b.proc.atmo.setEnabled(true);
              if (sunPos && camPos) updateAtmosphere(b.proc.atmo, center, sunPos, camPos);
            }

            // Fog (solo en superficie)
            try {
              const c = b.def.atmoColor || new BABYLON.Color3(0.35, 0.55, 1.0);
              scn.fogMode = BABYLON.Scene.FOGMODE_EXP2;
              scn.fogColor = new BABYLON.Color3(c.r * 0.85, c.g * 0.85, c.b * 0.90);
              const r = Math.max(1.0, b.def.radius || 10);
              // densidad auto: planetas pequeños => un poco más denso para que se note
              const d = Math.min(0.0009, Math.max(0.00008, 0.0025 / r));
              scn.fogDensity = d;
            } catch (e) {}
          }
          surfaceStep(dt);
        } else {
          // not surface: hide procedural planets to save CPU
          for (const [n, b] of bodies.entries()) {
            if (b.proc) b.proc.setEnabled(false);
            if (b.def.rocky) b.farMesh.setEnabled(true);
          }
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

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
  
