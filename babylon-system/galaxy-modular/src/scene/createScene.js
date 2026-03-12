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
import { collectUniverseSnapshots } from '../sim/universeState.js';

export function bootstrap() {
  const canvas = document.getElementById('renderCanvas');
  const engine = createEngine(canvas);

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
  camera.position.set(2, 50, -540);
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
  let nearZ = 1e-4;
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
    captureMul: 24.0,
    minCaptureGap: 0.10,
    stickyMul: 48.0,
  });
  window.__orbitAnchor = orbitAnchor;

  const bodyCollision = createCameraBodyCollision({ bodyMaps: BODY_MAPS, padding: 0.00017 });
   
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
  }
  
  let _lastSaveT = 0;
  const SAVE_MS = 30000;
  const doSave = () => {
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
			saveState({ floating, camera, camCtrl });
			console.log("[SAVE] ok");
		  } else if (e.code === "F8") {
			clearState();
			console.log("[SAVE] cleared");
		  } else if (e.code === "F10") {
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

    // Sombras dinámicas (si tu lights.js lo tiene)
    if (typeof lights.updateNearestSystemShadows === 'function') {
      lights.updateNearestSystemShadows();
    }

	// (mantén aquí solo lo que NO depende de órbitas si quieres)

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

    // Órbitas
    const dtDays = dtSec * DAYS_PER_REAL_SECOND;
    simDays += dtDays;

    // Suaviza el tiempo de render de órbitas para esconder pequeños stalls
    // (autosave, GC, pestaña, etc.) sin tocar el tiempo simulado "real".
    const orbitAlpha = 1.0 - Math.exp(-dtSec * ORBIT_SMOOTH_HZ);
    simDaysRender += (simDays - simDaysRender) * orbitAlpha;

    // Movimiento orbital primero, para que el anclaje siga el frame actual del cuerpo.
    if (starsApi?.starSystems?.length) updateOrbits(starsApi.starSystems, simDaysRender);
    updateOrbits(planetSystems, simDaysRender);

    const prevCamPos = camera.position.clone();
    camCtrl.update(dtSec);

    // Si speedLevel === 0 y estás cerca, quedas "enganchado" al cuerpo
    // conservando tu offset relativo, sin caer hacia el centro.
    orbitAnchor.applyOrbitAnchor(camera, camCtrl);

    bodyCollision.enforceBodyCollision(camera, prevCamPos);

    // Si la colisión corrigió algo, actualizamos el offset bloqueado real.
    orbitAnchor.syncOffsetFromCamera(camera);

    floating.apply();

    // Grid anclado (internamente hace early-exit si no hay cambios)
    if (navGrid?.enabled) navGrid.update();

    // Ahora sí: LOD y labels con posiciones ya actualizadas
    systemDotScaler.update();
    repMgr.update();
    labelsApi.update(false);

    // HUD debug floating origin
    if (typeof floating.updateHud === 'function') floating.updateHud();

    // Elite HUD (modo, velocidad, fullscreen icon, etc.)
    eliteHud?.update?.();

    // Publicación local/offline: deja lista la frontera para un futuro transport real.
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
    bodyCollision.enforceBodyCollision(camera, null);
  })

  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());
}