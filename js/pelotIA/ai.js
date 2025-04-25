// 📌 ai.js — Módulo puro de IA

let model;
let isTraining = false;

// —— Helpers ——

// Normaliza [min,max] → [0,1]
function normalize(v, min, max) {
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}
// Redondea y clampa
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

/**
 * Inicializa o carga el modelo desde IndexedDB.
 */
export async function initNeuralNetwork() {
  try {
    model = await tf.loadLayersModel("indexeddb://my-trained-model");
  } catch {
    model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [3], units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 2, activation: "tanh" }));
    await model.save("indexeddb://my-trained-model");
  }
  model.compile({ optimizer: tf.train.adam(0.001), loss: "meanSquaredError" });
}

/** Borra el modelo de IndexedDB y devuelve una promesa */
export function clearModel() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase("my-trained-model");
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(new Error('Error al eliminar modelo'));
  });
}

/**
 * Entrena el modelo con un array de intentos:
 * cada intento = { angle, force, distance, errorX }.
 */
export async function trainModel(attemptsData) {
  if (isTraining || !model) return;
  isTraining = true;

  const recent = attemptsData.slice(-200);
  const unique = Array.from(new Map(recent.map(a => [`${a.angle}|${a.force}`, a])).values());
  if (unique.length < 10) {
    isTraining = false;
    return;
  }

  const xs = tf.tensor2d(unique.map(a => [
    normalize(a.angle, 10, 80),
    normalize(a.force, 5, 40),
    normalize(a.distance - a.targetPosition, -2000, 2000)
  ]));
  const ys = tf.tensor2d(unique.map(a => [
    (a.angle - a.bestAngle) / 70,
    (a.force - a.bestForce) / 35
  ]));

  const earlyStop = tf.callbacks.earlyStopping({ monitor: 'loss', patience: 5 });
  const reduceLR  = tf.callbacks.reduceLROnPlateau({ monitor: 'loss', factor: 0.5, patience: 3 });

  await model.fit(xs, ys, {
    epochs: 50,
    shuffle: true,
    callbacks: [earlyStop, reduceLR],
    verbose: 0
  });
  await model.save("indexeddb://my-trained-model");
  xs.dispose(); ys.dispose();

  isTraining = false;
}

/**
 * Dada una posición media (angle, force, distance),
 * pide al modelo un pequeño ajuste.
 */
async function predictShot(angle, force, distance, targetPosition) {
  if (!model) return { bestAngle: angle, bestForce: force };

  const input = tf.tensor2d([[
    normalize(angle,10,80),
    normalize(force,5,40),
    normalize(distance - targetPosition,-2000,2000)
  ]]);
  const data = await model.predict(input).data();
  input.dispose();

  if (data.some(v => isNaN(v))) {
    // Si algo falla, devolvemos el tiro tal cual
    return { bestAngle: angle, bestForce: force };
  }
  return {
    bestAngle: clamp(angle + data[0]*35, 10, 80),
    bestForce: clamp(force + data[1]*20, 5, 40)
  };
}

/**
 * Ajusta el siguiente lanzamiento combinando:
 * - heurística “midpoint” (entre el mejor por debajo y por encima del target)
 * - predicción fina de la red
 * - exploración ε-greedy si hay estancamiento
 *
 * @param {number} errorX         Error absoluto del último tiro
 * @param {number} currentCounter Contador de fallos consecutivos
 * @param {Array}  attemptLog     Historial de intentos { angle, force, distance }
 * @param {number} targetPosition Posición del target
 * @param {number} bestAngle      Mejor ángulo actual
 * @param {number} bestForce      Mejor fuerza actual
 * @returns {Promise<{newCounter, newAngle, newForce}>}
 */
export async function adjustLearning(
  errorX,
  currentCounter,
  attemptLog,
  targetPosition,
  bestAngle,
  bestForce
) {
  let newCounter = currentCounter;

  // separar bajo/sobre
  const under = attemptLog.filter(a => a.distance < targetPosition);
  const over  = attemptLog.filter(a => a.distance > targetPosition);

  const lastUnder = under.length
    ? under.reduce((a,b) => Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b)
    : { angle: bestAngle, force: bestForce, distance: targetPosition };
  const lastOver  = over.length
    ? over.reduce((a,b) => Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b)
    : { angle: bestAngle, force: bestForce, distance: targetPosition };

  // punto medio heurístico
  const midAngle = (lastUnder.angle + lastOver.angle) / 2;
  const midForce = (lastUnder.force + lastOver.force) / 2;
  const midDist  = (lastUnder.distance + lastOver.distance) / 2;

  // predecir con la red
  const { bestAngle: netA, bestForce: netF } =
    await predictShot(midAngle, midForce, midDist, targetPosition);

  // mezcla heurística vs. red
  const α = 0.5;
  let nextAngle = α * netA + (1-α) * midAngle;
  let nextForce = α * netF + (1-α) * midForce;

  // exploración ε-greedy
  const eps = Math.min(0.5, 0.1 + errorX/800);
  if (newCounter >= 6) {
    nextAngle += Math.random()*25 - 12;
    nextForce += Math.random()*16 - 8;
    newCounter = 0;
  } else if (Math.random() < eps) {
    nextAngle += Math.random()*6 - 3;
    nextForce += Math.random()*6 - 3;
    newCounter++;
  }

  // clamp final
  nextAngle = clamp(nextAngle, 10, 80);
  nextForce = clamp(nextForce, 5, 40);

  return { newCounter, newAngle: nextAngle, newForce: nextForce };
}
