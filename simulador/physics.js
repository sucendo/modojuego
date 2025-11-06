// physics.js
import {
	rho0, gravity,
	DRAG_SCALE, MIN_THRUST_PROJ,
	K_AOA_FORMDRAG, K_INDUCED_ENERGY, VERTICAL_DAMP_EXTRA,
	I, Iinv,
	S_aileron, l_aileron,
	S_elevator, l_elevator,
	S_rudder, l_rudder,
	Cm_ALPHA, l_fuselage,
	C_d_rot,
	maxRollRate, maxPitchRate, maxYawRate,
	maxDeflectionRate
} from './config.js';
	
import { sinGammaFromVelocity } from './utils.js';
	
// ===== Lift =====
export function computeLiftCoefficient(aoa, SIM) {
	const stall  = Cesium.Math.toRadians(14);
	const maxAoA = Cesium.Math.toRadians(40);
	const sign = Math.sign(aoa) || 1;
	const abs  = Math.abs(aoa);
	if (abs <= stall) return SIM.CL0 + SIM.CL_ALPHA * aoa;
	const CLmax = SIM.CL0 + SIM.CL_ALPHA * sign * stall;
	const t = Cesium.Math.clamp((abs - stall) / (maxAoA - stall), 0, 1);
	return (1 - t) * CLmax;
}
	
// ===== Aerodinámica (Lift/Drag) =====
export function computeAerodynamics(planeVelocity, forward, right, carto, hpr, SIM) {
	const V = Cesium.Cartesian3.magnitude(planeVelocity);
	let liftForce = 0, aoa = 0, qd = 0, Dp = 0, Di = 0;
		
	if (V > 5) {
		const flightDir  = Cesium.Cartesian3.normalize(planeVelocity, new Cesium.Cartesian3());
		const cosAoA     = Cesium.Math.clamp(Cesium.Cartesian3.dot(flightDir, forward), -1, 1);
		const unsignedAoA = Math.acos(cosAoA);
		const crossFF    = Cesium.Cartesian3.cross(forward, flightDir, new Cesium.Cartesian3());
		const sign       = Math.sign(Cesium.Cartesian3.dot(crossFF, right)) || 1;

		aoa = Cesium.Math.clamp(unsignedAoA * sign, Cesium.Math.toRadians(-22), Cesium.Math.toRadians(22));

		const CL = computeLiftCoefficient(aoa, SIM);
		const AR = (SIM.wingSpan * SIM.wingSpan) / SIM.wingArea;

		const rho = rho0 * Math.exp(-carto.height / 8500);
		qd = 0.5 * rho * V * V;

		liftForce = qd * SIM.wingArea * CL;

		// Inducido base
		let CDi = (CL * CL) / (Math.PI * AR * SIM.e_oswald);

		// Onda transónica
		const mach = V / 340;
		const wave = Math.max(0, mach - SIM.machDrag.M0);
		const CDw  = wave > 0 ? (wave * wave) / SIM.machDrag.k : 0;

		// Parásito+forma+onda (base) y refuerzo por AoA^2; todo escalado
		const CDp0   = SIM.CD0 + SIM.k_form + CDw;
		const CDpEff = (CDp0 + K_AOA_FORMDRAG * aoa * aoa) * DRAG_SCALE;

		// Refuerzo energético del inducido por carga n (tirar de palanca “cuesta” IAS)
		const n = Math.max(0, liftForce / (SIM.mass * gravity));
		const inducedGain = 1 + K_INDUCED_ENERGY * Math.max(0, (n * n - 1));
		const CDiEff = CDi * inducedGain * DRAG_SCALE;

		// Fuerzas de drag
		Dp = qd * SIM.wingArea * CDpEff;
		Di = qd * SIM.wingArea * CDiEff;

		// Penaliza lift con bank (simple)
		const rollAbs = hpr ? Math.abs(hpr.roll) : 0;
		const liftBankFactor = (hpr ? (0.25 + 0.75 * Math.cos(rollAbs)) : 1.0);
		liftForce *= liftBankFactor;
	}
	
	const rhoOut = (V > 5) ? (qd * 2) / (V * V) : rho0;
	return { liftForce, aoa, qd, rho: rhoOut, D_parasite: Dp, D_induced: Di };
}
	
// ===== Empuje disponible =====
export function thrustAvailable(throttle, mach, rhoRatio, SIM) {
	const fM_mil = Math.max(0.55, 1 - 0.22 * Math.max(0, mach - 0.6));
	let thrust = throttle * SIM.maxThrustMIL * fM_mil;
	if (SIM.afterburner) {
		const fM_ab = Math.max(0.65, 1 - 0.10 * Math.max(0, mach - 1.2));
		const extra = throttle * (SIM.maxThrustAB - SIM.maxThrustMIL) * fM_ab;
		thrust += Math.max(0, extra);
	}
	return thrust * Math.pow(rhoRatio, 0.80);
}
	
// ===== dV por trayectoria (gamma desde V real) =====
export function applyThrottleAndFlightPath(
	dt, position, planeVelocity, forwardSpeed, throttle, mach, rhoRatio, SIM
	) {
	const T = thrustAvailable(throttle, mach, rhoRatio, SIM);
	const sinG = sinGammaFromVelocity(position, planeVelocity); // γ desde V (no solo morro)
	const dV = (T / SIM.mass) - (gravity * sinG);              // g*sinγ RESTA al subir
	return Math.max(0, forwardSpeed + dV * dt);
}
	
// ===== Vertical (lift + gravedad + damping extra por AoA) =====
export function applyLiftAndGravity(dt, liftForce, verticalSpeed, SIM, aoa = 0) {
	let vs = verticalSpeed;
	vs -= gravity * dt;
	if (liftForce) vs += (liftForce / SIM.mass) * dt;
	
	// Damping vertical dependiente de AoA (sube/baja “chupa” más energía con morro fuera)
	const aoaNorm = Cesium.Math.clamp(Math.abs(aoa) / Cesium.Math.toRadians(15), 0, 1);
	const extra = VERTICAL_DAMP_EXTRA * aoaNorm;
	vs *= (1 - (0.04 + extra) * dt);
	
	return Cesium.Math.clamp(vs, -120, 120);
}
	
// ===== Drag parásito proyectado sobre la velocidad =====
export function applyParasiteDrag(dt, planeVelocity, Dp, forward, forwardSpeed, SIM) {
	const V = Cesium.Cartesian3.magnitude(planeVelocity);
	if (V < 0.1 || Dp <= 0) return forwardSpeed;
	
	const dragDir = Cesium.Cartesian3.normalize(planeVelocity, new Cesium.Cartesian3());
	Cesium.Cartesian3.negate(dragDir, dragDir);
	
	const dragAcc = (Dp / SIM.mass);
	const dv = Cesium.Cartesian3.multiplyByScalar(dragDir, dragAcc * dt, new Cesium.Cartesian3());
	const newVel = Cesium.Cartesian3.add(planeVelocity, dv, new Cesium.Cartesian3());
	
	return Math.max(0, Cesium.Cartesian3.dot(newVel, forward));
}
	
// ===== Drag inducido (más severo a baja V) =====
export function applyInducedDrag(dt, planeVelocity, forward, dragForce, forwardSpeed, SIM) {
	const V = Cesium.Cartesian3.magnitude(planeVelocity);
	if (V < 0.1) return forwardSpeed;
	
	const dragDir = Cesium.Cartesian3.normalize(planeVelocity, new Cesium.Cartesian3());
	Cesium.Cartesian3.negate(dragDir, dragDir);
	
	const lowVFactor = V < 80 ? (0.5 + 0.5 * V / 80) : 1.0;
	const dragAcc = (dragForce / SIM.mass) * lowVFactor;
	
	const dv = Cesium.Cartesian3.multiplyByScalar(dragDir, dragAcc * dt, new Cesium.Cartesian3());
	const newVel = Cesium.Cartesian3.add(planeVelocity, dv, new Cesium.Cartesian3());
	
	return Math.max(0, Cesium.Cartesian3.dot(newVel, forward));
}
	
// ===== Integración energética a lo largo de V =====
export function advanceSpeedAlongVelocity(dt, state, aero, SIM) {
	const { position, forward, planeVelocity } = state;
	const V = Cesium.Cartesian3.magnitude(planeVelocity);
	if (V < 0.01) return { Vnew: 0, forwardSpeed: 0 };
	
	const Vhat = Cesium.Cartesian3.normalize(planeVelocity, new Cesium.Cartesian3());
	const fhat = Cesium.Cartesian3.normalize(forward, new Cesium.Cartesian3());
	
	const enu4 = Cesium.Transforms.eastNorthUpToFixedFrame(position);
	const Up = Cesium.Matrix3.getColumn(Cesium.Matrix4.getMatrix3(enu4, new Cesium.Matrix3()), 2, new Cesium.Cartesian3());
	const sing = Cesium.Cartesian3.dot(Vhat, Up);
	
	const rhoRatio = Math.max(SIM.lastRho, 0.2) / rho0;
	const mach = V / 340;
	const T = thrustAvailable(SIM.throttle, mach, rhoRatio, SIM);
	
	// Proyección mínima de empuje útil (para que el resbale no “corte” el T del todo)
	const proj = Cesium.Cartesian3.dot(fhat, Vhat);
	const T_alongV = Math.max(0, T * (MIN_THRUST_PROJ + Math.max(0, proj) * (1 - MIN_THRUST_PROJ)));
	
	const D = Math.max(0, (aero.D_parasite || 0) + (aero.D_induced || 0));
	const dV = (T_alongV - D) / SIM.mass - gravity * sing;
	const Vnew = Math.max(0, V + dV * dt);
	
	const cosSlip = Cesium.Cartesian3.dot(Vhat, fhat);
	const forwardSpeed = Math.max(0, Vnew * Math.max(0, cosSlip));
	return { Vnew, forwardSpeed };
}
	
// ===== Rotación (Newton–Euler con superficies y damping) =====
export function updateRotation(dt, qd, aoa, state, inputs) {
	let { ω, orientationQuat, δa_current, δe_current, δr_current } = state;
	const { rollCmd, pitchCmd, yawCmd, gyroAngles, keys, useGyro, autoLevel } = inputs;
	
	const maxDef = Math.PI / 18; // ±10°
	let δa_target = 0, δe_target = 0, δr_target = 0;
	
	if (useGyro) {
		δa_target = Cesium.Math.clamp(gyroAngles.roll,  -maxDef, maxDef);
		δe_target = Cesium.Math.clamp(gyroAngles.pitch, -maxDef, maxDef);
		δr_target = Cesium.Math.clamp(gyroAngles.yaw,   -maxDef, maxDef);
	} else {
		δa_target = (keys['ArrowLeft'] ? -maxDef : 0) + (keys['ArrowRight'] ? +maxDef : 0);
		δe_target = (keys['ArrowDown'] ? -maxDef : 0) + (keys['ArrowUp'] ? +maxDef : 0);
		δr_target = (keys['KeyQ'] ? +maxDef : 0) + (keys['KeyE'] ? -maxDef : 0);
	}
	
	if (rollCmd  !== 0) δa_target = rollCmd;
	if (pitchCmd !== 0) δe_target = pitchCmd;
	if (yawCmd   !== 0) δr_target = yawCmd;
	
	if (autoLevel) {
		const k = 2.0;
		δa_target = Cesium.Math.clamp(-k * ω.x, -maxDef, maxDef);
		δe_target = Cesium.Math.clamp(-k * ω.y, -maxDef, maxDef);
		δr_target = Cesium.Math.clamp(-k * ω.z, -maxDef, maxDef);
		if (Cesium.Cartesian3.magnitude(ω) < 0.05) {
		inputs.autoLevel = false;
		}
	}
	
	// Slew rate superficies
	const step = maxDeflectionRate * dt;
	δa_current += Cesium.Math.clamp(δa_target - δa_current, -step, step);
	δe_current += Cesium.Math.clamp(δe_target - δe_current, -step, step);
	δr_current += Cesium.Math.clamp(δr_target - δr_current, -step, step);
	
	const δa = δa_current, δe = δe_current, δr = δr_current;
	
	// Torques
	const τx = qd * S_aileron  * δa * l_aileron;
	let   τy = qd * S_elevator * δe * l_elevator;
	const qdRef = 0.5 * rho0 * 140 * 140;
	const elevEff = 0.7 + 0.6 * (1 - Cesium.Math.clamp(qd / qdRef, 0, 1));
	τy *= elevEff;
	const τz = qd * S_rudder   * δr * l_rudder;
	
	// Pitching por fuselaje/perfil
	const τ_fuselaje = qd * state.wingArea * (Cm_ALPHA * aoa) * l_fuselage;
	const totalτy = τy + τ_fuselaje;
	
	// Damping rotacional
	const τd = new Cesium.Cartesian3(
		-C_d_rot * ω.x,
		-C_d_rot * 1.25 * ω.y,
		-C_d_rot * 1.10 * ω.z
	);
	
	const τ = Cesium.Cartesian3.add(new Cesium.Cartesian3(τx, totalτy, τz), τd, new Cesium.Cartesian3());
	
	// Newton–Euler
	const Iω  = Cesium.Matrix3.multiplyByVector(I, ω, new Cesium.Cartesian3());
	const ωIω = Cesium.Cartesian3.cross(ω, Iω, new Cesium.Cartesian3());
	const net = Cesium.Cartesian3.subtract(τ, ωIω, new Cesium.Cartesian3());
	const α   = Cesium.Matrix3.multiplyByVector(Iinv, net, new Cesium.Cartesian3());
	
	ω = Cesium.Cartesian3.add(ω, Cesium.Cartesian3.multiplyByScalar(α, dt, new Cesium.Cartesian3()), new Cesium.Cartesian3());
	ω.x = Cesium.Math.clamp(ω.x, -maxRollRate,  maxRollRate);
	ω.y = Cesium.Math.clamp(ω.y, -maxPitchRate, maxPitchRate);
	ω.z = Cesium.Math.clamp(ω.z, -maxYawRate,   maxYawRate);
	
	// Integrar orientación
	const bodyToWorld = Cesium.Matrix3.fromQuaternion(orientationQuat);
	const axisRoll  = Cesium.Matrix3.multiplyByVector(bodyToWorld, new Cesium.Cartesian3(1,0,0), new Cesium.Cartesian3());
	const axisPitch = Cesium.Matrix3.multiplyByVector(bodyToWorld, new Cesium.Cartesian3(0,1,0), new Cesium.Cartesian3());
	const axisYaw   = Cesium.Matrix3.multiplyByVector(bodyToWorld, new Cesium.Cartesian3(0,0,1), new Cesium.Cartesian3());
	
	const qIncRoll  = Cesium.Quaternion.fromAxisAngle(axisRoll,  ω.x * dt);
	const qIncPitch = Cesium.Quaternion.fromAxisAngle(axisPitch, ω.y * dt);
	const qIncYaw   = Cesium.Quaternion.fromAxisAngle(axisYaw,   ω.z * dt);
	
	orientationQuat = Cesium.Quaternion.normalize(
		Cesium.Quaternion.multiply(
		qIncYaw,
		Cesium.Quaternion.multiply(
			qIncPitch,
			Cesium.Quaternion.multiply(qIncRoll, orientationQuat, new Cesium.Quaternion()),
			new Cesium.Quaternion()
		),
		new Cesium.Quaternion()
		),
		new Cesium.Quaternion()
	);
	
	return { ω, orientationQuat, δa_current, δe_current, δr_current };
}
	