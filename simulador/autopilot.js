import { hdgErr, wrap180 } from './utils.js';

// << MODIFICADO: Acepta el rumbo de brújula actual
export function computeAutopilotCommands(state, dt, apState, compassHeading) {
  const { verticalSpeed, carto } = state; let { autopilotHeading, autopilotAltitude, apHdgInt, apAltInt } = apState;

  const MAX_DEF=Math.PI/18; let bankMax=Cesium.Math.toRadians(22);
  // const KpH=0.015, KiH=0.003, Imax=200;
  const KpBank=2.0, KdRoll=0.6, KdYaw=0.4;
  const KpPitch=1.2, KdPitch=1.0;
  const KpVS=0.03, KiVS=0.01;

  const V=Cesium.Cartesian3.magnitude(state.planeVelocity);
  if(V<35) return {roll:0,pitch:-0.12,yaw:0,apHdgInt,apAltInt};
  if(V<55) bankMax=Cesium.Math.toRadians(10);

  // --- Lógica de Rumbo (HDG HOLD) ---
  // Comparamos el rumbo objetivo (grados) con el rumbo actual (grados)
  const KpAz = 0.035; // Ganancia P (misma que en computeHeadingHoldCommands)
  const errDeg = wrap180(autopilotHeading - compassHeading);

  // ¡No usamos el integrador (KiH) por ahora, es la causa más probable de la oscilación!
  
  const bankTarget = Cesium.Math.clamp(Cesium.Math.toRadians(KpAz * errDeg), -bankMax, bankMax);

  const rollErr=bankTarget - state.hpr.roll;
  const rollCmd=Cesium.Math.clamp(KpBank*rollErr - KdRoll*state.angularVel.x, -MAX_DEF, MAX_DEF);
  const yawCmd =Cesium.Math.clamp(-KdYaw*state.angularVel.z, -MAX_DEF, MAX_DEF);

  // --- Lógica de Altitud Hold ---
  const altError = autopilotAltitude - carto.height; // Error en metros
  // Queremos una VS objetivo para corregir el error. Clamp a +/- 15 m/s (aprox 3000 fpm)
  // Kp simple para altitud -> vsTarget
  const KpAlt = 0.1;
  const vsTarget = Cesium.Math.clamp(altError * KpAlt, -15, 15);

  apAltInt=Cesium.Math.clamp(apAltInt + (vsTarget-verticalSpeed)*dt, -200, 200);
  const vsBias=Cesium.Math.clamp(KpVS*(vsTarget-verticalSpeed)+KiVS*apAltInt, -0.25, 0.25);

  const pitchErr=-state.hpr.pitch;
  const pitchCmd=Cesium.Math.clamp(KpPitch*pitchErr - KdPitch*state.angularVel.y + vsBias, -MAX_DEF, MAX_DEF);

  return { roll:rollCmd, pitch:pitchCmd, yaw:yawCmd, apHdgInt, apAltInt };
}

export function computeHeadingHoldCommands(state, dt, targetHeadingDeg, compassHeading) {
  const MAX_DEF=Math.PI/18; let bankMax=Cesium.Math.toRadians(22);
  const KpAz=0.035; const KdRoll=0.6, KdYaw=0.4;

  const V=Cesium.Cartesian3.magnitude(state.planeVelocity);
  if(V<35) return { roll:0, pitch:0, yaw:0 };
  if(V<55) bankMax=Cesium.Math.toRadians(10);

  const errDeg = wrap180(targetHeadingDeg - compassHeading);
  const bankTarget = Cesium.Math.clamp(Cesium.Math.toRadians(KpAz*errDeg), -bankMax, bankMax);

  const rollErr = bankTarget - state.hpr.roll;
  const rollCmd = Cesium.Math.clamp(2.2*rollErr - KdRoll*state.angularVel.x, -MAX_DEF, MAX_DEF);
  const yawCmd  = Cesium.Math.clamp(-KdYaw*state.angularVel.z, -MAX_DEF, MAX_DEF);

  return { roll:rollCmd, pitch:0, yaw:yawCmd };
}

// --- NUEVA FUNCIÓN DE AUTOTHROTTLE (A/T) ---

/**
 * Calcula el comando de throttle para mantener una velocidad objetivo.
 * @param {number} currentSpeed - Velocidad actual (m/s)
 * @param {number} targetSpeed - Velocidad objetivo (m/s)
 * @param {object} apState - Objeto de estado del AP (para el integrador)
 * @param {number} dt - Delta time
 * @returns {object} { throttle: number, apSpdInt: number }
 */
export function computeAutothrottleCommand(currentSpeed, targetSpeed, apState, dt) {
  let { apSpdInt } = apState;
  const spdError = targetSpeed - currentSpeed; // Error de velocidad (m/s)

  // Constantes del controlador PI para velocidad
  const KpSpd = 0.04;  // Ganancia proporcional
  const KiSpd = 0.01;  // Ganancia integral

  apSpdInt = Cesium.Math.clamp(apSpdInt + (spdError * dt), -10, 10); // Anti-windup
  
  const trimThrottle = 0.5; // Potencia base para crucero
  const throttleCmd = trimThrottle + (KpSpd * spdError) + (KiSpd * apSpdInt);

  return { throttle: Cesium.Math.clamp(throttleCmd, 0.0, 1.0), apSpdInt };
}