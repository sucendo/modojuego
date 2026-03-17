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
import { APP_CONFIG } from '../config/appConfig.js';
import { createBootSplash, createIntroModal } from '../ui/bootIntro.js';
import { spawnCameraInEarthOrbit } from './initialSpawn.js';
import { registerGlobalShortcuts, scheduleIntroOpen } from '../input/globalShortcuts.js';

export function bootstrap() {
  const BOOT_LOGO_URL = new URL(APP_CONFIG.resources.bootLogoPath, import.meta.url).href;

  const canvas = document.getElementById('renderCanvas');
  const engine = createEngine(canvas);
  
  const bootSplash = createBootSplash({
    title: APP_CONFIG.app.title,
    logoUrl: BOOT_LOGO_URL,
    delayMs: APP_CONFIG.boot.delayMs,
    fadeMs: APP_CONFIG.boot.fadeMs,
  });

  // Importante: armamos el fade-out inmediatamente.
  // Si hay cualquier error posterior en bootstrap, el splash no se quedará fijo.
  try {
    bootSplash.startFadeOut();
  } catch (_) {}

  const introModal = createIntroModal({
    title: APP_CONFIG.app.title,
    subtitle: APP_CONFIG.intro.subtitle,
    logoUrl: BOOT_LOGO_URL,
    storyHtml: APP_CONFIG.intro.storyHtml,
    controlsHtml: APP_CONFIG.intro.controlsHtml,
    storageKey: APP_CONFIG.storage.introSeenKey,
    dontShowCheckedByDefault: APP_CONFIG.intro.dontShowCheckedByDefault,
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
  const DAYS_PER_REAL_SECOND = APP_CONFIG.scene.daysPerRealSecond;

  // ============================================================
  // Fondo negro garantizado
  // ============================================================
  scene.autoClear = true;
  scene.autoClearDepthAndStencil = true;
  scene.clearColor = new BABYLON.Color4(...APP_CONFIG.scene.clearColor);
  scene.environmentTexture = null;

  // Like planet-editor: keep depth between rendering groups (terrain→sea→clouds→rings).
  // Prevents rings/clouds from drawing over the planet when using renderingGroupId 1/2/3.
  try {
    for (const groupId of APP_CONFIG.scene.keepDepthGroups) {
      scene.setRenderingAutoClearDepthStencil(groupId, false);
    }
  } catch (_) {}

  try { engine.getRenderingCanvas().style.background = APP_CONFIG.scene.canvasBackground; } catch (e) {}

  // ============================================================
  // ROOT del mundo
  // ============================================================
  const worldRoot = new BABYLON.TransformNode('worldRoot', scene);

  // ============================================================
  // Lights + Camera
  // ============================================================
  const lights = setupLights(scene, { hemiIntensity: 0.16 });
  const unitsPerLy =
    (GALAXY?.system && Number.isFinite(GALAXY.system.__LY)) ? GALAXY.system.__LY :
    (Number.isFinite(SYSTEMS?.__LY)) ? SYSTEMS.__LY :
    APP_CONFIG.camera.unitsPerLyDefault;
  const camCfg = setupCamera(scene, canvas, {
    baseSpeed: APP_CONFIG.camera.baseSpeed,
    fastMult: APP_CONFIG.camera.fastMult,
    unitsPerLy,
    // Evita que salga el mini panel antiguo de camera.js (ya tenemos HUD Elite)
    enableModeUI: APP_CONFIG.camera.enableModeUI
  });
  const camera = camCfg.camera;
  
  const camCtrl = camCfg.controller;
  window.__camCtrl = camCtrl;

  // Shift/turbo ya lo gestiona camera.js (state.isFast). No duplicar handlers aquí.

  // Ajustes cámara (si setupCamera ya los fija, esto solo los sobreescribe)
  camera.angularSensibility = APP_CONFIG.camera.angularSensibility;
  camera.inertia = APP_CONFIG.camera.inertia;
  camera.angularInertia = APP_CONFIG.camera.angularInertia;
  camera.keysUp = [...APP_CONFIG.camera.keysUp];
  camera.keysDown = [...APP_CONFIG.camera.keysDown];
  camera.keysLeft = [...APP_CONFIG.camera.keysLeft];
  camera.keysRight = [...APP_CONFIG.camera.keysRight];
  camera.keysUpward = [...APP_CONFIG.camera.keysUpward];
  camera.keysDownward = [...APP_CONFIG.camera.keysDownward];
  // Near plane too small destroys depth precision (z-fighting / shimmer on clouds/sea/rings).
  // Keep it small, but not *microscopic*. You can override via ?near=1e-6
  let nearZ = APP_CONFIG.scene.nearZDefault;
  try {
    const u = new URL(location.href);
    const nz = Number(u.searchParams.get('near'));
    if (Number.isFinite(nz) && nz > 0) nearZ = nz;
  } catch (_) {}
  camera.minZ = nearZ;
  camera.maxZ = APP_CONFIG.scene.maxZ;

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
      ...APP_CONFIG.representation,
    },
  });

  // ============================================================
  // Builders (extraídos)
  // ============================================================
  const KM_PER_UNIT_LOCAL = APP_CONFIG.world.kmPerUnitLocal;
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

  const orbitAnchor = createCameraOrbitAnchor({
    bodyMaps: BODY_MAPS,
    ...APP_CONFIG.orbitAnchor,
  });
  window.__orbitAnchor = orbitAnchor;

  const bodyCollision = createCameraBodyCollision({ bodyMaps: BODY_MAPS, ...APP_CONFIG.bodyCollision });

  const localSurfaceFlight = createLocalSurfaceFlight({
    bodyMaps: BODY_MAPS,
    ...APP_CONFIG.localSurfaceFlight,
  });

  const surfaceAltimeter = createSurfaceAltimeter({ camera, bodyMaps: BODY_MAPS });
  
  function updateDynamicNearPlane() {
    const alt = surfaceAltimeter?.getState?.();
    if (!alt?.visible || !Number.isFinite(alt.meters)) {
      camera.minZ = APP_CONFIG.scene.nearZDefault;
      return;
    }
  
    // Convertimos metros -> km -> units de escena usando la escala REAL del proyecto
    const altUnits = (alt.meters / 1000) / KM_PER_UNIT;
  
    // Queremos un near pequeño cerca del suelo, pero sin volverlo microscópico
    // para no romper la precisión de profundidad.
    const dynamicNear = Math.max(
      APP_CONFIG.scene.nearZSurfaceMin,
      Math.min(APP_CONFIG.scene.nearZSurfaceDefault, altUnits * APP_CONFIG.scene.nearZSurfaceFactor)
    );
  
    camera.minZ = dynamicNear;
  }
  
  const systemDotScaler = createSystemDotScaler({
    engine, camera, systemNodes,
    opts: { ...APP_CONFIG.systemDots },
  });

  // ============================================================
  // Floating Origin
  // ============================================================
  const floating = createFloatingOrigin({
    scene,
    camera,
    worldRoot,
    ...APP_CONFIG.floatingOrigin,
  });
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
      ...APP_CONFIG.navGrid,
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
    orbitAnchor,
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
  const perfOverlay = createPerfOverlay({ engine, scene, repMgr, camera, opts: { ...APP_CONFIG.perfOverlay } });
  window.__perfOverlay = perfOverlay;


  // Throttles for heavy tickers
  let binAccSec = 0;
  let binLastT = 0;
  const BIN_MS = APP_CONFIG.scene.binaryUpdateMs;

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
  const ORBIT_SMOOTH_HZ = APP_CONFIG.scene.orbitSmoothHz;

  // Sitúa los cuerpos en su posición inicial antes de decidir spawn.
  if (starsApi?.starSystems?.length) updateOrbits(starsApi.starSystems, simDaysRender, 0);
  updateOrbits(planetSystems, simDaysRender, 0);

  // ============================
  // Load saved travel (optional)
  // ============================
  const saved = loadState();
  const hasSavedState = !!saved;
  if (saved) {
    applyLoadedState({
      state: saved,
      worldRoot,
      floating,
      camera,
	  camCtrl,
	  orbitAnchor,
    });
    // estabiliza antes del primer render (evita micro-salto)
    floating.apply();
  } else {
    spawnCameraInEarthOrbit({
      camera,
      camCtrl,
      orbitAnchor,
      planetMeshById,
      starMeshById,
      getSunAnchorNode: getSolAnchorNode,
      initialSpawn: APP_CONFIG.scene.initialSpawn,
    });
    // estabiliza antes del primer render
    floating.apply();
  }
  
  let _lastSaveT = 0;
  const SAVE_MS = APP_CONFIG.scene.saveIntervalMs;
  let _saveDisabled = false;
  
  const doSave = () => {
    if (_saveDisabled) return;
    try { saveState({ floating, camera, camCtrl, orbitAnchor }); } catch (_) {}
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

  registerGlobalShortcuts({
    onSave: () => {
      _saveDisabled = false;
      saveState({ floating, camera, camCtrl, orbitAnchor });
      console.log("[SAVE] ok");
    },
    onClearSave: () => {
      _saveDisabled = true;
      clearState();
      console.log("[SAVE] cleared");
    },
    onLoadSave: () => {
      _saveDisabled = false;
      const st = loadState();
      if (!st) return;
      applyLoadedState({
        state: st,
        worldRoot,
        floating,
        camera,
        camCtrl,
        orbitAnchor,
      });
      console.log("[SAVE] loaded");
    },
    introModal,
  });
  
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
    orbitAnchor.applyOrbitAnchor(camera, camCtrl, dtSec, dtDaysRender);
  
    // Colisión superficie
    bodyCollision.enforceBodyCollision(camera, prevCamPos);

    floating.apply();

    // Muy importante:
    // si floating ha hecho rebase, orbitAnchor debe resincronizarse
    // con el nuevo marco local ya rebajado.
    orbitAnchor.syncOffsetFromCamera(camera);
  
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
    if ((now - _lastPresenceT) >= APP_CONFIG.scene.presencePublishMs) {
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

  scheduleIntroOpen({
    introModal,
    hasSavedState,
    delayMs: APP_CONFIG.boot.delayMs + APP_CONFIG.boot.fadeMs + APP_CONFIG.intro.openDelayAfterBootMs,
  });

  window.addEventListener('resize', () => engine.resize());
}