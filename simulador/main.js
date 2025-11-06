// main.js
// -----------------------------------------------------------------------------
// Bucle principal del simulador (Cesium + Física + HUD + Controles + FX)
//
// Cambios clave de esta versión:
// 1) Integración de la VELOCIDAD a lo largo de la trayectoria real (advanceSpeedAlongVelocity),
//    en lugar de empujar siempre en el eje del morro. Esto evita acelerar “hacia el espacio”
//    cuando el morro está arriba pero la trayectoria no acompaña.
// 2) Eliminada la doble contabilidad de velocidad: ya NO aplicamos
//    ParasiteDrag + InducedDrag + applyThrottleAndFlightPath y, además, la energética;
//    ahora solo usamos:  lift/gravedad para verticalSpeed  +  energética para forwardSpeed.
// 3) Comentarios y estructura más clara.
//
// Nota: Este archivo asume que en physics.js existen:
//  - computeAerodynamics(...)
//  - applyLiftAndGravity(...)
//  - advanceSpeedAlongVelocity(...)
//  - updateRotation(...)
// y en autopilot.js:
//  - computeAutothrottleCommand(...)
//  - computeAutopilotCommands(...)
//  - computeHeadingHoldCommands(...)
// -----------------------------------------------------------------------------

import * as Config from './config.js';
import { HUD } from './hud.js';
import { Aircraft } from './aircraft.js';
import { Controls } from './controls.js';
import * as Physics from './physics.js';
import * as Autopilot from './autopilot.js';
import { Effects } from './effects.js';

(async function main () {
  // 1) CESIUM: Viewer base
  Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYTQ0YWUyYi0wYjcwLTQ3NDEtYmEzMS1kZDJlYzhkNTkyMzgiLCJpZCI6MzA5MDg4LCJpYXQiOjE3NDkwMjU5NDh9.vtAd5T0-iIYfa8YbSDhK1HEUeOgqR3Whk4OAehbKZ3w';

  const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
    animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
    homeButton: false, infoBox: false, sceneModePicker: false, selectionIndicator: false,
    navigationHelpButton: false, navigationInstructionsInitiallyVisible: false,
    fullscreenButton: false, shadows: true, shouldAnimate: true
  });

  const osmBuildings = await Cesium.createOsmBuildingsAsync();
  viewer.scene.primitives.add(osmBuildings);

  // Bloquea los controles por defecto de la cámara: la controlamos nosotros
  const ssc = viewer.scene.screenSpaceCameraController;
  ssc.enableRotate = false;
  ssc.enableTranslate = false;
  ssc.enableZoom = false;
  ssc.enableTilt = false;
  ssc.enableLook = false;

  // 2) MÓDULOS: HUD, FX, Avión, Controles
  const hud = new HUD();
  const effects = new Effects(viewer);
  const aircraft = new Aircraft(viewer, effects);
  const controls = new Controls(viewer, aircraft);
  await aircraft.createModel();

  // 3) Estado de simulación
  let lastNow = performance.now();
  let lastSpeed = 0; // para Mach/diagnósticos si hiciera falta
  const simState = { paused: false, crashed: false };
  const crashOverlayEl = document.getElementById('crashOverlay');

  // 4) BUCLE PRINCIPAL (postRender)
  viewer.scene.postRender.addEventListener(() => {
    // ---- Tiempo delta (clamp para estabilidad numérica) ----
    const now = performance.now();
    let dt = (now - lastNow) * 0.001;
    lastNow = now;
    if (!Number.isFinite(dt) || dt <= 0) dt = 0.016;
    if (dt > 0.05) dt = 0.05;

    if (simState.paused || simState.crashed) return;
    if (!aircraft.position || !aircraft.orientationQuat) return;

    try {
      // ---- Entrada de potencia suave (teclado) ----
      const throttleStep = 0.5 * dt;
      if (controls.keys['Equal'] || controls.keys['NumpadAdd']) {
        aircraft.sim.throttle = Math.min(aircraft.sim.throttle + throttleStep, 1.0);
      }
      if (controls.keys['Minus'] || controls.keys['NumpadSubtract']) {
        aircraft.sim.throttle = Math.max(aircraft.sim.throttle - throttleStep, 0.0);
      }

      // ---- Estado instantáneo del avión (marcos, V, etc.) ----
      const state = aircraft.computeFrameState();
      if (!state.carto || !Number.isFinite(state.carto.height)) return;

      // ---- Aerodinámica (Lift + Drag + AoA + qd, etc.) ----
      const aero = Physics.computeAerodynamics(
        state.planeVelocity, state.forward, state.right, state.carto, state.hpr, aircraft.sim
      );
      lastSpeed = state.speed;
      aircraft.sim.lastRho = Number.isFinite(aero.rho) ? aero.rho : aircraft.sim.lastRho;

      // ---- Piloto automático / Heading Hold / Manual ----
      let rollCmd = 0, pitchCmd = 0, yawCmd = 0;

      if (controls.autopilot) {
        // AUTOTHROTTLE (opcional): mantiene IAS objetivo ajustando throttle
        // (si no usas A/T, comenta este bloque)
        const at = Autopilot.computeAutothrottleCommand(
          state.speed,          // IAS actual (m/s)
          controls.autopilotSpeed, // IAS objetivo (m/s) — asegúrate de setearlo en Controls
          controls,
          dt
        );
        aircraft.sim.throttle = at.throttle;
        controls.apSpdInt = at.apSpdInt;

        // AP HEADING/ALT: Calcula deflexiones virtuales deseadas
        const compassHdg = aircraft.getCompassHeading(); // 0–360 (brújula real)
        const ap = Autopilot.computeAutopilotCommands(state, dt, controls, compassHdg);
        rollCmd = ap.roll; pitchCmd = ap.pitch; yawCmd = ap.yaw;
        controls.apHdgInt = ap.apHdgInt; controls.apAltInt = ap.apAltInt;

      } else if (controls.hdgHold) {
        // Solo mantener rumbo con bank/yaw, pitch manual
        const compassHdg = aircraft.getCompassHeading();
        const hdg = Autopilot.computeHeadingHoldCommands(state, dt, controls.hdgBugDeg, compassHdg);
        rollCmd = hdg.roll; yawCmd = hdg.yaw;
      }
      // Si no hay AP ni HDG HOLD: el mando viene de teclado/gyro (Controls.getInputs)

      // ---- Integrar ROTACIÓN (torques de superficies + damping + inercia) ----
      const inputs = { ...controls.getInputs(), rollCmd, pitchCmd, yawCmd };
      const rotationState = {
        ω: aircraft.ω,
        orientationQuat: aircraft.orientationQuat,
        δa_current: aircraft.δa_current,
        δe_current: aircraft.δe_current,
        δr_current: aircraft.δr_current,
        wingArea: aircraft.sim.wingArea // para el término de pitching de fuselaje
      };
      const newRot = Physics.updateRotation(dt, aero.qd, aero.aoa, rotationState, inputs);

      // Volcar cambios de rotación al avión
      aircraft.ω = newRot.ω;
      aircraft.orientationQuat = newRot.orientationQuat;
      aircraft.δa_current = newRot.δa_current;
      aircraft.δe_current = newRot.δe_current;
      aircraft.δr_current = newRot.δr_current;
      controls.autoLevel = inputs.autoLevel; // si se desactiva automáticamente

      // ---- Integrar TRASLACIÓN (modelo energético coherente) ----
      // 1) VerticalSpeed solo con lift y gravedad (y damping vertical dependiente de AoA)
      aircraft.verticalSpeed = Physics.applyLiftAndGravity(
        dt, aero.liftForce, state.verticalSpeed, aircraft.sim, aero.aoa
      );

      // 2) ForwardSpeed desde energía a lo largo de la velocidad real:
      //    Vnew = V + [(T_alongV - (D_parasite + D_induced))/m - g*sinγ] * dt
      //    forwardSpeed = Vnew * cos(slip)
      const adv = Physics.advanceSpeedAlongVelocity(dt, state, aero, aircraft.sim);
      aircraft.forwardSpeed = adv.forwardSpeed;

      // Importante: ya NO llamamos a applyParasiteDrag / applyInducedDrag / applyThrottleAndFlightPath,
      // porque la integración energética ya incorpora empuje, drag y gravedad de forma consistente.

      // ---- Integrar POSICIÓN y actualizar CÁMARA ----
      aircraft.updatePosition(dt, state.forward, state.surfaceNormal);
      const newState = aircraft.computeFrameState(); // estado tras el paso
      aircraft.updateCamera(newState, controls.orbitAngles, controls.orbitRadius);

      // ---- HUD ----
      aircraft.sim.defl = {
        daDeg: Cesium.Math.toDegrees(aircraft.δa_current),
        deDeg: Cesium.Math.toDegrees(aircraft.δe_current),
        drDeg: Cesium.Math.toDegrees(aircraft.δr_current)
      };
      hud.update(newState, aero, aircraft.sim, controls, dt, Config.gravity);

      // ---- Proyectiles / FX ----
      aircraft.updateProjectiles(dt);
      effects.update(dt);

      // ---- Colisión con terreno ----
      if (detectTerrainCollision(newState.carto)) {
        effects.explosionAt(aircraft.position);     // efecto visual
        simState.crashed = true;
        crashOverlayEl.style.display = 'flex';
        controls.autopilot = false;
        return;
      }

    } catch (err) {
      console.error('[SIM ERROR]', err);
      simState.paused = true;
      crashOverlayEl.innerHTML =
        '<div>⚠️ Error en simulación<br><small>Revisa consola (F12).</small></div>';
      crashOverlayEl.style.display = 'flex';
    }
  });

  // 5) Utilidades locales
  function detectTerrainCollision (carto) {
    const hT = viewer.scene.globe.getHeight(carto);
    const terrain = (typeof hT === 'number' && Number.isFinite(hT)) ? hT : 0;
    const agl = carto.height - terrain;
    if (agl <= 0.5) {
      // Fija al suelo y detiene
      aircraft.position = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, terrain + 0.5);
      aircraft.forwardSpeed = 0;
      aircraft.verticalSpeed = 0;
      console.warn('[SIM] Colisión');
      return true;
    }
    return false;
  }

  // 6) Reset tras crash
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r' && simState.crashed) {
      simState.crashed = false;
      crashOverlayEl.style.display = 'none';
      lastNow = performance.now();

      const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(aircraft.position);
      const hT = viewer.scene.globe.getHeight(carto) || 0;

      // Recoloca 1000 m AGL con velocidad y potencia razonables
      aircraft.position = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, hT + 1000);
      aircraft.verticalSpeed = 0;
      aircraft.forwardSpeed = 150;
      aircraft.sim.throttle = 0.75;
      aircraft.sim.afterburner = false;
      aircraft.orientationQuat = aircraft.initOrientation();
      aircraft.resetControls();
    }
  });

  // 7) Pausa si se oculta la pestaña
  document.addEventListener('visibilitychange', () => {
    simState.paused = document.hidden;
    if (!simState.paused) lastNow = performance.now();
  });
})();
