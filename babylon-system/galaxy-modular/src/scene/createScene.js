// createScene.js

import { SYSTEMS } from '../data/systems.js';
import { GALAXY } from '../data/galaxy.js';
import { createEngine } from '../core/engine.js';
import { createFloatingOrigin } from '../core/floatingOrigin.js';
import { initHudToggles } from '../ui/hudToggles.js';
import { setupLights } from './lights.js';
import { setupCamera } from './camera.js';
import { createLabels } from '../ui/labels.js';
import { createEliteHud } from '../ui/eliteHud.js';
import { createPerfOverlay } from '../ui/perfOverlay.js';
import { createNavigationGridController } from '../ui/navGrid.js';
import { buildSystemNodes } from '../bodies/systems.js';
import { buildStars } from '../bodies/stars.js';
import { buildPlanets } from '../bodies/planets.js';
import { updateOrbits } from '../bodies/orbitAnimator.js';
import { createSystemDotScaler } from '../ui/systemDots.js'
import { createRepresentationManager } from '../representation/representationManager.js';
import { saveState, loadState, clearState, applyLoadedState } from '../core/savegame.js';
import { createOfflineTransport } from '../net/offlineTransport.js';
import { createCameraOrbitAnchor } from './orbitAnchor.js';
import { createCameraBodyCollision } from './collision.js';
import { createLocalSurfaceFlight } from './localSurfaceFlight.js';
import { createSurfaceAltimeter } from './surfaceAltimeter.js';
import { collectUniverseSnapshots } from '../sim/universeState.js';

export function bootstrap() {
  const BOOT_LOGO_URL = new URL('../resources/logo.svg', import.meta.url).href;

  const canvas = document.getElementById('renderCanvas');
  const engine = createEngine(canvas);
  
  function createBootSplash({
    title = 'SIMULADOR',
    logoUrl = '',
    delayMs = 2000,
    fadeMs = 2000,
  } = {}) {
    const root = document.createElement('div');
    root.id = 'bootSplash';
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '99999';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.justifyContent = 'center';
    root.style.background = '#000';
    root.style.opacity = '1';
    root.style.pointerEvents = 'auto';
    root.style.transition = `opacity ${fadeMs}ms ease`;

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'center';
    wrap.style.justifyContent = 'center';
    wrap.style.gap = '22px';
    wrap.style.padding = '24px';
    wrap.style.transform = 'translateY(-2%)';

    const img = document.createElement('img');
    img.alt = 'Logo';
    img.src = logoUrl;
    img.style.display = logoUrl ? 'block' : 'none';
    img.style.width = 'min(42vw, 420px)';
    img.style.maxWidth = '80vw';
    img.style.maxHeight = '40vh';
    img.style.objectFit = 'contain';
    img.style.filter = 'drop-shadow(0 0 24px rgba(255,255,255,0.10))';
    img.style.userSelect = 'none';
    img.draggable = false;
    img.onerror = () => {
      img.style.display = 'none';
    };

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.color = '#fff';
    titleEl.style.fontFamily = 'Arial, Helvetica, sans-serif';
    titleEl.style.fontSize = 'clamp(28px, 4vw, 56px)';
    titleEl.style.fontWeight = '700';
    titleEl.style.letterSpacing = '0.28em';
    titleEl.style.textAlign = 'center';
    titleEl.style.textShadow = '0 0 22px rgba(255,255,255,0.12)';
    titleEl.style.userSelect = 'none';

    wrap.appendChild(img);
    wrap.appendChild(titleEl);
    root.appendChild(wrap);
    document.body.appendChild(root);

    let removed = false;

    const remove = () => {
      if (removed) return;
      removed = true;
      try { root.remove(); } catch (_) {}
    };

    const startFadeOut = () => {
      window.setTimeout(() => {
        root.style.opacity = '0';
        root.style.pointerEvents = 'none';
        window.setTimeout(remove, fadeMs + 60);
      }, delayMs);
    };

    return { root, remove, startFadeOut };
  }

  const bootSplash = createBootSplash({
    title: 'SIMULADOR',
    logoUrl: BOOT_LOGO_URL,
    delayMs: 2000,
    fadeMs: 1000,
  });

  const scene = new BABYLON.Scene(engine);
  // Perf: si no haces picking por “hover”, esto ahorra CPU
  scene.skipPointerMovePicking = true;
  scene.constantlyUpdateMeshUnderPointer = false;

  // ============================================================
  // TIME SCALE
  // Tiempo real: 1 segundo real = 1 segundo simulado.
  // Los orbitalPeriod/rotationPeriod están en *días*, así que convertimos:
  //   dtDays = dtSeconds / 86400
  // ============================================================
  const DAYS_PER_REAL_SECOND = 1.0 / 86400.0;

  // ============================================================
  // Fondo negro garantizado
  // ============================================================
  scene.autoClear = true;
  scene.autoClearDepthAndStencil = true;
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
  scene.environmentTexture = null;

  // Like planet-editor: keep depth between rendering groups (terrain→sea→clouds→rings).
  // Prevents rings/clouds from drawing over the planet when using renderingGroupId 1/2/3.
  try {
    scene.setRenderingAutoClearDepthStencil(1, false);
    scene.setRenderingAutoClearDepthStencil(2, false);
    scene.setRenderingAutoClearDepthStencil(3, false);
  } catch (_) {}

  try { engine.getRenderingCanvas().style.background = '#000'; } catch (e) {}

  // ============================================================
  // ROOT del mundo
  // ============================================================
  const worldRoot = new BABYLON.TransformNode('worldRoot', scene);

  // ============================================================
  // Lights + Camera
  // ============================================================
  const lights = setupLights(scene, { hemiIntensity: 0.10 });
  const unitsPerLy =
    (GALAXY?.system && Number.isFinite(GALAXY.system.__LY)) ? GALAXY.system.__LY :
    (Number.isFinite(SYSTEMS?.__LY)) ? SYSTEMS.__LY :
    1_000_000;
  const camCfg = setupCamera(scene, canvas, {
    baseSpeed: 100.0,
    fastMult: 1000.0,
    unitsPerLy,
    // Evita que salga el mini panel antiguo de camera.js (ya tenemos HUD Elite)
    enableModeUI: false
  });
  const camera = camCfg.camera;
  
  const camCtrl = camCfg.controller;
  window.__camCtrl = camCtrl;

  // Shift/turbo ya lo gestiona camera.js (state.isFast). No duplicar handlers aquí.

  // Ajustes cámara (si setupCamera ya los fija, esto solo los sobreescribe)
  camera.angularSensibility = 3500;
  camera.inertia = 0.0;
  camera.angularInertia = 0.0;
  camera.keysUp = [87];      // W
  camera.keysDown = [83];    // S
  camera.keysLeft = [65];    // A
  camera.keysRight = [68];   // D
  camera.keysUpward = [32];  // Space
  camera.keysDownward = [17];// Ctrl
  // Near plane too small destroys depth precision (z-fighting / shimmer on clouds/sea/rings).
  // Keep it small, but not *microscopic*. You can override via ?near=1e-6
  let nearZ = 1e-6;
  try {
    const u = new URL(location.href);
    const nz = Number(u.searchParams.get('near'));
    if (Number.isFinite(nz) && nz > 0) nearZ = nz;
  } catch (_) {}
  camera.minZ = nearZ;
  camera.maxZ = 5e9;

  // ============================================================
  // Labels API
  // ============================================================
  const labelsApi = createLabels({ scene, camera, engine });

  // ============================================================
  // Representation Manager (pixel-based visual LOD)
  // - Keeps physics/orbits untouched (targets TransformNodes)
  // - Swaps visual meshes under each body node
  // ============================================================
  const repMgr = createRepresentationManager({
    scene,
    engine,
    camera,
    labelsApi,
    lights,
    opts: {
      evalIntervalMs: 33,
      evalBudgetMs: 0.8,
      evalMaxPerTick: 250,
      transitionBudgetMs: 1.5,
      transitionMaxPerTick: 10,
      hysteresisRatio: 0.25,
      minStateHoldMs: 900,
      initialState: 'dot',
      createInitialRep: true,
      offDisablesLabels: true,
      offDisablesMesh: true,

      // Avoid heavy planet-editor regenerations while the camera is moving fast.
      procRefineMaxCamSpeed: 200.0,
    },
  });

  // ============================================================
  // Builders (extraídos)
  // ============================================================
  const KM_PER_UNIT_LOCAL = 1e6;
  const KM_PER_UNIT = KM_PER_UNIT_LOCAL;
  const starMeshById = new Map();

  const { systemNodes, lyUnits } = buildSystemNodes({ scene, worldRoot, GALAXY, SYSTEMS, labelsApi });
  camCtrl?.setUnitsPerLy?.(lyUnits);
  
  const starsApi = buildStars({ scene, systemNodes, GALAXY, lights, labelsApi, starMeshById, repMgr, kmPerUnitLocal: KM_PER_UNIT_LOCAL });
  const {
    planetSystems,
    planetMeshById,
    moonMeshById,
    asteroidMeshById,
    cometMeshById,
  } = buildPlanets({
    scene,
    systemNodes,
    starMeshById,
    GALAXY,
    lights,
    labelsApi,
    repMgr,
    kmPerUnitLocal: KM_PER_UNIT_LOCAL
  });

  const BODY_MAPS = [planetMeshById, moonMeshById, asteroidMeshById, cometMeshById];
  
  function getEarthNode() {
    return (
      planetMeshById.get('Tierra') ||
      planetMeshById.get('Earth') ||
      planetMeshById.get('Terra') ||
      null
    );
  }
  
  function getSunNode() {
    return (
      starMeshById.get('Sol') ||
      starMeshById.get('Sun') ||
      starMeshById.get('Solis') ||
      null
    );
  }

  function spawnCameraInEarthOrbit() {
    const earth = getEarthNode();
    if (!earth) return false;
  
    try { earth.computeWorldMatrix?.(true); } catch (_) {}
  
    const earthPos =
      (typeof earth.getAbsolutePosition === 'function')
        ? earth.getAbsolutePosition()
        : earth.position;
  
    if (!earthPos) return false;
  
    const radiusWorld = Number(earth?.metadata?.radiusWorld) || 0.01;
  
    // Altura baja, tipo órbita visual cercana
    const orbitalAltitude = Math.max(radiusWorld * 0.10, 0.0057);
    const orbitalRadius = radiusWorld + orbitalAltitude;
  
    // Posición real del Sol
    let sunNode = null;
    try {
      sunNode = getSolAnchorNode?.() || getSunNode();
    } catch (_) {
      sunNode = getSunNode();
    }
  
    let sunPos = null;
    if (sunNode) {
      try { sunNode.computeWorldMatrix?.(true); } catch (_) {}
      sunPos = (typeof sunNode.getAbsolutePosition === 'function')
        ? sunNode.getAbsolutePosition()
        : sunNode.position;
    }
  
    let sunDir = new BABYLON.Vector3(0, 0, 1);
    if (sunPos) {
      sunDir = sunPos.subtract(earthPos);
      if (sunDir.lengthSquared() > 1e-12) sunDir.normalize();
    }
  
    const worldUp = new BABYLON.Vector3(0, 1, 0);
  
    // Base del terminador
    let northOnTerminator = worldUp.subtract(
      sunDir.scale(BABYLON.Vector3.Dot(worldUp, sunDir))
    );
    if (northOnTerminator.lengthSquared() < 1e-8) {
      northOnTerminator = BABYLON.Axis.Z.subtract(
        sunDir.scale(BABYLON.Vector3.Dot(BABYLON.Axis.Z, sunDir))
      );
    }
    northOnTerminator.normalize();
  
    let eastOnTerminator = BABYLON.Vector3.Cross(sunDir, northOnTerminator);
    if (eastOnTerminator.lengthSquared() < 1e-8) {
      eastOnTerminator = BABYLON.Vector3.Cross(sunDir, BABYLON.Axis.X);
    }
    eastOnTerminator.normalize();
  
    // Spawn:
    // - casi sobre el terminador
    // - un poquito en lado iluminado para que el Sol sí aparezca
    // - leve sesgo lateral para composición cinematográfica
    const spawnNormal = northOnTerminator.scale(0.96)
      .add(eastOnTerminator.scale(-0.14))
      .add(sunDir.scale(0.10))
      .normalize();
  
    const spawnPos = earthPos.add(spawnNormal.scale(orbitalRadius));
    camera.position.copyFrom(spawnPos);
  
    camera.rotationQuaternion = null;
    if (camera.rotation?.set) camera.rotation.set(0, 0, 0);
  
    // Dirección tangencial hacia el Sol sobre el horizonte
    let towardSunOnTangent = sunDir.subtract(
      spawnNormal.scale(BABYLON.Vector3.Dot(sunDir, spawnNormal))
    );
    if (towardSunOnTangent.lengthSquared() < 1e-8) {
      towardSunOnTangent = eastOnTerminator.clone();
    }
    towardSunOnTangent.normalize();
  
    let localRight = BABYLON.Vector3.Cross(towardSunOnTangent, spawnNormal);
    if (localRight.lengthSquared() < 1e-8) {
      localRight = eastOnTerminator.clone();
    }
    localRight.normalize();
  
    // Base local
    const localLeft = localRight.scale(-1);
    
    // 60° a la izquierda sobre el plano tangente
    const yawDeg = 60;
    const yawRad = BABYLON.Angle.FromDegrees(yawDeg).radians();
    
    const horizDir = towardSunOnTangent.scale(Math.cos(yawRad))
      .add(localLeft.scale(Math.sin(yawRad)))
      .normalize();
    
    // 20° hacia abajo respecto al horizonte local
    const pitchDownDeg = 20;
    const pitchRad = BABYLON.Angle.FromDegrees(pitchDownDeg).radians();
    
    const lookDir = horizDir.scale(Math.cos(pitchRad))
      .add(spawnNormal.scale(-Math.sin(pitchRad)))
      .normalize();
  
    const targetPos = camera.position.add(lookDir.scale(radiusWorld * 4.5));
  
    if (typeof camera.setTarget === 'function') {
      camera.setTarget(targetPos);
    } else if (typeof camera.lookAt === 'function') {
      camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
    }
  
    // Ayuda a mantener horizonte lógico
    try {
      camera.upVector = spawnNormal.clone();
    } catch (_) {}
  
    try { orbitAnchor?.syncOffsetFromCamera?.(camera); } catch (_) {}
    try { camera.computeWorldMatrix?.(true); } catch (_) {}
  
    return true;
  }

  const orbitAnchor = createCameraOrbitAnchor({
    bodyMaps: BODY_MAPS,
    captureMul: 6.0,
    minCaptureGap: 0.00010,
    stickyMul: 12.0,
    influenceHz: 1.5,
    offsetFollowHz: 4.0,
    carryFactor: 1.0,
  });
  window.__orbitAnchor = orbitAnchor;

  const bodyCollision = createCameraBodyCollision({ bodyMaps: BODY_MAPS, padding: 0.0000005 });

  const localSurfaceFlight = createLocalSurfaceFlight({
    bodyMaps: BODY_MAPS,
    moveFullMul: 0.002,
    moveFadeMul: 0.05,
    minMoveFullGap: 0.00001,
    minMoveFadeGap: 0.00015,
    alignFullMul: 0.0005,
    alignFadeMul: 0.008,
    minAlignFullGap: 0.000003,
    minAlignFadeGap: 0.00003,
    tangentMoveScale: 1.00,
    upMoveScale: 0.88,
    downMoveScale: 1.03,
    alignHz: 0.60,
    alignMix: 0.14,
  });

  const surfaceAltimeter = createSurfaceAltimeter({ camera, bodyMaps: BODY_MAPS });
  
  function updateDynamicNearPlane() {
    const alt = surfaceAltimeter?.getState?.();
    if (!alt?.visible || !Number.isFinite(alt.meters)) {
      camera.minZ = 1e-4;
      return;
    }
  
    // Convertimos metros -> km -> units de escena usando la escala REAL del proyecto
    const altUnits = (alt.meters / 1000) / KM_PER_UNIT;
  
    // Queremos un near pequeño cerca del suelo, pero sin volverlo microscópico
    // para no romper la precisión de profundidad.
    const dynamicNear = Math.max(1e-8, Math.min(1e-4, altUnits * 0.15));
  
    camera.minZ = dynamicNear;
  }
  
  const systemDotScaler = createSystemDotScaler({
    engine, camera, systemNodes,
    opts: { minPx: 22.0, throttleMs: 80 },
  });

  // ============================================================
  // Floating Origin
  // ============================================================
  const floating = createFloatingOrigin({ scene, camera, worldRoot });
  const transport = createOfflineTransport();
  transport.connect();
  const _camAbsTmp = new BABYLON.Vector3();
  let _lastPresenceT = 0;
  
  // ============================================================
  // NavGrid (UI helper): anclado al nodo real del Sol
  // - Los 3 ejes pasan por el Sol y se quedan fijos ahí
  // - Con floating origin, el anchor debe leerse cada frame desde el nodo de escena
  // ============================================================
  const _navAnchorTmp = new BABYLON.Vector3();
  function getSolAnchorNode() {
    return (
      starMeshById.get('Sol') ||
      starMeshById.get('Sun') ||
      systemNodes.find((it) => it?.name === 'Sol')?.primaryStar ||
      systemNodes.find((it) => it?.name === 'Sol')?.system ||
      null
    );
  }

  const navGrid = createNavigationGridController({
    scene, worldRoot, camera,
    opts: {
      fixedAnchor: true,
      getAnchorPosition: () => {
        const n = getSolAnchorNode();
        if (!n) return _navAnchorTmp.set(0, 0, 0);
        try { n.computeWorldMatrix?.(true); } catch (_) {}
        const p = (typeof n.getAbsolutePosition === 'function') ? n.getAbsolutePosition() : n.position;
        return _navAnchorTmp.copyFrom(p || BABYLON.Vector3.Zero());
      },
      throttleMs: 0,
      autoCenter: false,
      followY: false,
      includeYZ: true,
      yLevel: 0,
      step: 250000,
      extent: 25000000,
      maxLinesPerAxis: 401,
      rebuildDistance: 0,
    }
  });
  
  // ============================================================
  // Elite HUD (crea DOM: th/abs/cam/off + toggles + botones)
  // ============================================================
  const eliteHud = createEliteHud({
    camera,
    engine,
    floating,
	surfaceAltimeter,
    labelsApi,
    gridController: navGrid,
    camCtrl,
    // mountId: 'eliteHudMount', // opcional; si no existe, cae a document.body
  });

  // ============================================================
  // HUD toggles
  // ============================================================
  initHudToggles({
    setShowLabels: labelsApi.setShowLabels,
    gridController: navGrid,
  });

  // ============================================================
  // Perf overlay (toggle with F3 / P)
  // ============================================================
  const perfOverlay = createPerfOverlay({ engine, scene, repMgr, camera, opts: { intervalMs: 250, visible: false } });
  window.__perfOverlay = perfOverlay;


  // Throttles for heavy tickers
  let binAccSec = 0;
  let binLastT = 0;
  const BIN_MS = 33;

  let simDays = 0;

  const runtime = {
    getSimDays: () => simDays,
    getUniverseSnapshot: () => collectUniverseSnapshots(scene),
    getLocalPlayerState: () => {
      const abs = floating.getCameraAbsoluteToRef(_camAbsTmp);
      return {
        id: 'local',
        mode: camCtrl?.getMode?.() || 'mouse',
        speedLevel: camCtrl?.getSpeedLevel?.() || 0,
        cameraAbsU: {
          x: Number(abs.x || 0),
          y: Number(abs.y || 0),
          z: Number(abs.z || 0),
        },
        simDays,
        ts: Date.now(),
      };
    },
    transport,
  };

  window.__runtime = runtime;
  window.__transport = transport;

  let simDaysRender = 0;
  // Suavizado SOLO visual para órbitas:
  // amortigua micro-parones del frame loop sin cambiar el tiempo simulado guardado.
  const ORBIT_SMOOTH_HZ = 12.0;

  // Sitúa los cuerpos en su posición inicial antes de decidir spawn.
  if (starsApi?.starSystems?.length) updateOrbits(starsApi.starSystems, simDaysRender, 0);
  updateOrbits(planetSystems, simDaysRender, 0);

  // ============================
  // Load saved travel (optional)
  // ============================
  const saved = loadState();
  if (saved) {
    applyLoadedState({
      state: saved,
      worldRoot,
      floating,
      camera,
	  camCtrl,
    });
    // estabiliza antes del primer render (evita micro-salto)
    floating.apply();
  } else {
    spawnCameraInEarthOrbit();
    // estabiliza antes del primer render
    floating.apply();
  }
  
  let _lastSaveT = 0;
  const SAVE_MS = 30000;
  let _saveDisabled = false;
  
  const doSave = () => {
    if (_saveDisabled) return;
    try { saveState({ floating, camera, camCtrl }); } catch (_) {}
  };

  scene.onBeforeRenderObservable.add(() => {
    const now = performance.now();
    if (now - _lastSaveT > SAVE_MS) {
      _lastSaveT = now;
      doSave();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) doSave();
  });
  
  window.addEventListener("beforeunload", doSave);

  if (!window.__gm13_saveKeysBound) {
    window.__gm13_saveKeysBound = true;
    window.addEventListener("keydown", (e) => {
      if (e.code === "F9") {
        _saveDisabled = false;
        saveState({ floating, camera, camCtrl });
        console.log("[SAVE] ok");
      } else if (e.code === "F8") {
        _saveDisabled = true;
        clearState();
        console.log("[SAVE] cleared");
      } else if (e.code === "F10") {
        _saveDisabled = false;
        const st = loadState();
        if (st) {
          applyLoadedState({
            state: st,
            worldRoot,
            floating,
            camera,
            camCtrl,
          });
          console.log("[SAVE] loaded");
        }
      }
    });
  }
  
  scene.onBeforeRenderObservable.add(() => {
    const dtSec = engine.getDeltaTime() * 0.001;
  
    // Sombras dinámicas
    if (typeof lights.updateNearestSystemShadows === 'function') {
      lights.updateNearestSystemShadows();
    }
  
    // Binarios/trinarios (throttle)
    if (starsApi?.updateBinaries) {
      const now = performance.now();
      binAccSec += dtSec;
      if ((now - binLastT) >= BIN_MS) {
        starsApi.updateBinaries(binAccSec);
        binAccSec = 0;
        binLastT = now;
      }
    }
  
    // Tiempo simulado
    const dtDays = dtSec * DAYS_PER_REAL_SECOND;
    simDays += dtDays;
  
    // Suavizado visual del tiempo orbital
    const prevSimDaysRender = simDaysRender;
    const orbitAlpha = 1.0 - Math.exp(-dtSec * ORBIT_SMOOTH_HZ);
    simDaysRender += (simDays - simDaysRender) * orbitAlpha;
    const dtDaysRender = simDaysRender - prevSimDaysRender;
  
    // Órbitas y spin primero
    if (starsApi?.starSystems?.length) {
      updateOrbits(starsApi.starSystems, simDaysRender, dtDaysRender);
    }
    updateOrbits(planetSystems, simDaysRender, dtDaysRender);
  
    // Movimiento jugador
    const prevCamPos = camera.position.clone();
    camCtrl.update(dtSec);
	
    // Movimiento local cerca de superficie, con cabeceo mucho más suave
    localSurfaceFlight.apply(camera, camCtrl, prevCamPos, dtSec);

    // Anclaje orbital + arrastre por spin superficial
    orbitAnchor.applyOrbitAnchor(camera, camCtrl, dtSec);
  
    // Colisión superficie
    bodyCollision.enforceBodyCollision(camera, prevCamPos);
  
    // Resincroniza offset por si la colisión corrigió
    orbitAnchor.syncOffsetFromCamera(camera);
  
    floating.apply();
  
    // Grid anclado
    if (navGrid?.enabled) navGrid.update();
  
    // LOD + labels
    systemDotScaler.update();
    repMgr.update();
    labelsApi.update(false);
  
    // HUD debug floating origin
    if (typeof floating.updateHud === 'function') floating.updateHud();
  
    // Altímetro primero, HUD después
    surfaceAltimeter.update();
	updateDynamicNearPlane();
    eliteHud?.update?.();
  
    // Publicación local/offline
    const now = performance.now();
    if ((now - _lastPresenceT) >= 100) {
      _lastPresenceT = now;
      transport.publishSelf(runtime.getLocalPlayerState());
    }
  });

  // Safety net extra: si la UniversalCamera mete movimiento por teclado/ratón
  // fuera de camCtrl.update(), evitamos que el frame siguiente empiece dentro
  // de la superficie.
  scene.onAfterRenderObservable.add(() => {
    // Safety net solo para modo ratón.
    // En ship ya corregimos en onBeforeRender y repetir aquí mete jitter.
    if (camCtrl?.getMode?.() !== 'mouse') return;
    bodyCollision.enforceBodyCollision(camera, null);
  });

  engine.runRenderLoop(() => scene.render());

  // El splash permanece visible al inicio, empieza a desvanecerse a los 2 s
  // y desaparece totalmente al 3º segundo.
  // Lo lanzamos tras arrancar el render loop para tapar la carga inicial.
  try {
    bootSplash.startFadeOut();
  } catch (_) {}

  window.addEventListener('resize', () => engine.resize());
}