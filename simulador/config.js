// config.js (minúsculas para mantener consistencia en imports)

// =====================
//   AERONAVES (datos base + coef. efectivos)
// =====================
export const AIRCRAFTS = {
  F22: {
    // Geometría / masas
    mass: 19500,             // kg (ligero; operativo real sube con fuel/carga)
    wingArea: 78.0,          // m²
    wingSpan: 13.56,         // m

    // Aerodinámica efectiva (tuning plausible)
    CL0: 0.24,
    CL_ALPHA: 4.8,           // por rad
    CD0: 0.018,              // parásito “clean” efectivo
    e_oswald: 0.88,          // rendimiento (inducido)
    k_form: 0.006,           // extra de forma/uniones
    machDrag: { M0: 0.95, k: 28 }, // arranque y pendiente de drag de onda

    // Propulsión
    maxThrustMIL: 232000,    // N (2×F119 “military power”)
    maxThrustAB: 312000,     // N (postcombustión)
    maxMach: 2.25
  },

  F16: {
    mass: 12000,
    wingArea: 27.87,
    wingSpan: 9.96,

    CL0: 0.22,
    CL_ALPHA: 5.1,
    CD0: 0.022,
    e_oswald: 0.85,
    k_form: 0.008,
    machDrag: { M0: 0.93, k: 26 },

    maxThrustMIL: 76000,
    maxThrustAB: 129000,
    maxMach: 2.05
  }
};

// =====================
//   CONSTANTES FÍSICAS
// =====================
export const rho0 = 1.225;  // kg/m³ (nivel del mar)
export const gravity = 9.8; // m/s²

// =====================
//   TUNING GLOBAL (energético)
// =====================
// Escala global de drag (parasitario + inducido) aplicada en physics.js
export const DRAG_SCALE = 0.80;         // 0.8 = 20% menos drag total
// Proyección mínima del empuje “útil” a lo largo de V para que se note en resbales
export const MIN_THRUST_PROJ = 0.04;    // [0–1], 0.12 ≈ 12%

// Refuerzo de drag por actitud (morros fuera) con AoA^2 (AoA en rad)
export const K_AOA_FORMDRAG = 0.16;     // pequeño; subir si quieres castigar AoA alto
// Refuerzo energético del inducido en función de la carga n (n^2)
export const K_INDUCED_ENERGY = 0.18;   // subir ⇒ tirar de palanca “cuesta” más IAS
// Damping vertical extra dependiente de AoA (además del 0.04 base en physics.js)
export const VERTICAL_DAMP_EXTRA = 0.08;

// =====================
//   INERCIA / SUPERFICIES / LÍMITES
// =====================
// Tensor de inercia (aprox. cuerpo rígido)
export const I = Cesium.Matrix3.fromArray([
  1.20e5, 0,      0,
  0,      9.00e4, 0,
  0,      0,      1.50e5
]);
export const Iinv = Cesium.Matrix3.inverse(I, new Cesium.Matrix3());

// Superficies y brazos (para torques aerodinámicos)
export const S_aileron  = 4.0,  l_aileron  = 5.0;
export const S_elevator = 3.5,  l_elevator = 7.0;
export const S_rudder   = 2.0,  l_rudder   = 6.0;

// Momento de cabeceo por fuselaje/perfil
export const Cm_ALPHA   = 0.05; // por rad (signo positivo ⇒ tendencia a cabecear con AoA)
export const l_fuselage = 8.0;  // brazo de palanca (m)

// Amortiguamiento rotacional (adimensional efectivo)
export const C_d_rot = 1.05;

// Límites de tasas angulares (rad/s)
export const maxRollRate  = Cesium.Math.toRadians(90);  // ±90°/s
export const maxPitchRate = Cesium.Math.toRadians(60);  // ±60°/s
export const maxYawRate   = Cesium.Math.toRadians(45);  // ±45°/s

// Velocidad de movimiento de superficies (rad/s)
export const maxDeflectionRate = Cesium.Math.toRadians(30); // 30°/s

// =====================
//   DEPURACIÓN / CONTROL
// =====================
// Cuando está a true, el control de pitch queda "limpio":
//   - Sin momento de fuselaje (Cm·AoA)
//   - Sin auto-nivelado en pitch
//   - Sin mezclas automáticas que toquen el elevador
export const DISABLE_PITCH_INTERFERENCE = true;


// =====================
//   MODO SIMPLE DE VELOCIDAD
// =====================
// Si está a true, se ignoran fuerzas aerodinámicas para la TRASLACIÓN:
//  - Aceleración solo por throttle en el eje forward del avión.
//  - Caída por gravedad en el eje vertical (Up del mundo).
//  - Sin lift/drag (¡para depurar!).
export const SIMPLE_SPEED_MODE = true;

// Aceleración máxima hacia adelante con throttle=1 (m/s^2)
export const SIMPLE_THRUST_ACCEL = 50;   // ajústalo a tu gusto (30–70)
// “Fricción” lineal muy suave para que no crezca sin límite (1/s)
export const SIMPLE_SPEED_DAMP   = 0.02; // 0.02 → ~2%/s
