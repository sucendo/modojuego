export const ANGLE_MIN = 5;
export const ANGLE_MAX = 88;
export const FORCE_MIN = 5;
export const FORCE_MAX = 65;

let model;
let isTraining = false;

function normalize(v, min, max) {
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function buildModel() {
  const net = tf.sequential();
  net.add(tf.layers.dense({ inputShape: [3], units: 32, activation: 'relu' }));
  net.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  net.add(tf.layers.dense({ units: 2, activation: 'tanh' }));
  net.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
  return net;
}

export async function initNeuralNetwork() {
  try {
    model = await tf.loadLayersModel('indexeddb://my-trained-model');
  } catch {
    model = buildModel();
    await model.save('indexeddb://my-trained-model');
  }
  model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
}

export function clearModel() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('my-trained-model');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error('Error al eliminar modelo'));
    req.onblocked = () => reject(new Error('La base de datos del modelo está bloqueada'));
  });
}

export async function trainModel(attemptsData) {
  if (isTraining || !model) return;
  isTraining = true;

  try {
    const recent = attemptsData.slice(-220);
    const unique = Array.from(new Map(recent.map(a => [`${a.angle}|${a.force}|${a.source ?? 'unk'}`, a])).values());
    if (unique.length < 10) return;

    const xs = tf.tensor2d(unique.map(a => [
      normalize(a.angle, ANGLE_MIN, ANGLE_MAX),
      normalize(a.force, FORCE_MIN, FORCE_MAX),
      normalize((a.distance ?? 0) - (a.targetPosition ?? 0), -2000, 2000)
    ]));

    const ys = tf.tensor2d(unique.map(a => [
      ((a.bestAngle ?? 45) - a.angle) / (ANGLE_MAX - ANGLE_MIN),
      ((a.bestForce ?? 20) - a.force) / (FORCE_MAX - FORCE_MIN)
    ]));

    const earlyStop = tf.callbacks.earlyStopping({ monitor: 'loss', patience: 5 });
    const reduceLR = tf.callbacks.reduceLROnPlateau({ monitor: 'loss', factor: 0.5, patience: 3 });

    await model.fit(xs, ys, {
      epochs: 50,
      shuffle: true,
      callbacks: [earlyStop, reduceLR],
      verbose: 0
    });

    await model.save('indexeddb://my-trained-model');
    xs.dispose();
    ys.dispose();
  } finally {
    isTraining = false;
  }
}

async function predictShot(angle, force, distance, targetPosition) {
  if (!model) return { bestAngle: angle, bestForce: force };

  const input = tf.tensor2d([[
    normalize(angle, ANGLE_MIN, ANGLE_MAX),
    normalize(force, FORCE_MIN, FORCE_MAX),
    normalize(distance - targetPosition, -2000, 2000)
  ]]);

  const data = await model.predict(input).data();
  input.dispose();

  if (data.some(v => Number.isNaN(v))) {
    return { bestAngle: angle, bestForce: force };
  }

  const angleSpan = ANGLE_MAX - ANGLE_MIN;
  const forceSpan = FORCE_MAX - FORCE_MIN;

  return {
    bestAngle: clamp(angle + data[0] * angleSpan * 0.45, ANGLE_MIN, ANGLE_MAX),
    bestForce: clamp(force + data[1] * forceSpan * 0.35, FORCE_MIN, FORCE_MAX)
  };
}

export async function adjustLearning(
  errorX,
  currentCounter,
  attemptLog,
  targetPosition,
  bestAngle,
  bestForce
) {
  let newCounter = currentCounter;

  const under = attemptLog.filter(a => a.distance < targetPosition);
  const over = attemptLog.filter(a => a.distance > targetPosition);

  const lastUnder = under.length
    ? under.reduce((a, b) => (Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b))
    : { angle: bestAngle, force: bestForce, distance: targetPosition };

  const lastOver = over.length
    ? over.reduce((a, b) => (Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b))
    : { angle: bestAngle, force: bestForce, distance: targetPosition };

  const midAngle = (lastUnder.angle + lastOver.angle) / 2;
  const midForce = (lastUnder.force + lastOver.force) / 2;
  const midDist = (lastUnder.distance + lastOver.distance) / 2;

  const { bestAngle: netA, bestForce: netF } = await predictShot(midAngle, midForce, midDist, targetPosition);

  const alpha = 0.55;
  let nextAngle = alpha * netA + (1 - alpha) * midAngle;
  let nextForce = alpha * netF + (1 - alpha) * midForce;

  const eps = Math.min(0.5, 0.1 + errorX / 800);
  if (newCounter >= 6) {
    nextAngle += Math.random() * 28 - 14;
    nextForce += Math.random() * 22 - 11;
    newCounter = 0;
  } else if (Math.random() < eps) {
    nextAngle += Math.random() * 8 - 4;
    nextForce += Math.random() * 10 - 5;
    newCounter += 1;
  }

  nextAngle = clamp(nextAngle, ANGLE_MIN, ANGLE_MAX);
  nextForce = clamp(nextForce, FORCE_MIN, FORCE_MAX);

  return { newCounter, newAngle: nextAngle, newForce: nextForce };
}
