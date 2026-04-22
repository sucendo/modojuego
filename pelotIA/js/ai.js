// 📌 ai.js — IA del simulador

let model = null;
let isTraining = false;

function normalize(value, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function buildModel() {
  const nextModel = tf.sequential();
  nextModel.add(tf.layers.dense({ inputShape: [3], units: 32, activation: 'relu' }));
  nextModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  nextModel.add(tf.layers.dense({ units: 2, activation: 'tanh' }));
  nextModel.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
  return nextModel;
}

export async function initNeuralNetwork() {
  if (model) return model;

  try {
    model = await tf.loadLayersModel('indexeddb://my-trained-model');
    model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
  } catch {
    model = buildModel();
    await model.save('indexeddb://my-trained-model');
  }

  return model;
}

export async function clearModel() {
  if (model) {
    model.dispose?.();
    model = null;
  }

  if (!window.indexedDB) return;

  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('my-trained-model');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error('Error al eliminar el modelo')); 
    req.onblocked = () => resolve();
  });
}

export async function trainModel(attemptsData) {
  if (isTraining) return false;
  await initNeuralNetwork();

  const recent = attemptsData.slice(-240);
  const unique = Array.from(
    new Map(
      recent.map((attempt) => [
        `${attempt.angle}|${attempt.force}|${Math.round((attempt.targetPosition ?? 0) / 10)}`,
        attempt
      ])
    ).values()
  );

  if (unique.length < 10) return false;

  isTraining = true;
  let xs;
  let ys;

  try {
    xs = tf.tensor2d(unique.map((attempt) => [
      normalize(attempt.angle, 10, 80),
      normalize(attempt.force, 5, 40),
      normalize((attempt.distance ?? 0) - (attempt.targetPosition ?? 0), -2000, 2000)
    ]));

    ys = tf.tensor2d(unique.map((attempt) => [
      ((attempt.bestAngle ?? attempt.angle) - attempt.angle) / 70,
      ((attempt.bestForce ?? attempt.force) - attempt.force) / 35
    ]));

    const earlyStop = tf.callbacks.earlyStopping({ monitor: 'loss', patience: 5 });

    await model.fit(xs, ys, {
      epochs: 35,
      shuffle: true,
      callbacks: [earlyStop],
      verbose: 0
    });

    await model.save('indexeddb://my-trained-model');
    return true;
  } finally {
    xs?.dispose();
    ys?.dispose();
    isTraining = false;
  }
}

async function predictShot(angle, force, distance, targetPosition) {
  if (!model) {
    return { bestAngle: angle, bestForce: force };
  }

  const input = tf.tensor2d([[
    normalize(angle, 10, 80),
    normalize(force, 5, 40),
    normalize(distance - targetPosition, -2000, 2000)
  ]]);

  try {
    const prediction = model.predict(input);
    const data = await prediction.data();
    prediction.dispose?.();

    if (data.some((value) => Number.isNaN(value))) {
      return { bestAngle: angle, bestForce: force };
    }

    return {
      bestAngle: clamp(angle + data[0] * 35, 10, 80),
      bestForce: clamp(force + data[1] * 20, 5, 40)
    };
  } finally {
    input.dispose();
  }
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

  const under = attemptLog.filter((attempt) => attempt.distance < targetPosition);
  const over = attemptLog.filter((attempt) => attempt.distance > targetPosition);

  const closestUnder = under.length
    ? under.reduce((a, b) => Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b)
    : { angle: bestAngle, force: bestForce, distance: targetPosition };

  const closestOver = over.length
    ? over.reduce((a, b) => Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b)
    : { angle: bestAngle, force: bestForce, distance: targetPosition };

  const midAngle = (closestUnder.angle + closestOver.angle) / 2;
  const midForce = (closestUnder.force + closestOver.force) / 2;
  const midDistance = (closestUnder.distance + closestOver.distance) / 2;

  const { bestAngle: networkAngle, bestForce: networkForce } =
    await predictShot(midAngle, midForce, midDistance, targetPosition);

  const blend = attemptLog.length < 12 ? 0.3 : 0.55;
  let nextAngle = blend * networkAngle + (1 - blend) * midAngle;
  let nextForce = blend * networkForce + (1 - blend) * midForce;

  const epsilon = Math.min(0.45, 0.08 + errorX / 900);

  if (newCounter >= 6) {
    nextAngle += Math.random() * 20 - 10;
    nextForce += Math.random() * 14 - 7;
    newCounter = 0;
  } else if (Math.random() < epsilon) {
    nextAngle += Math.random() * 6 - 3;
    nextForce += Math.random() * 6 - 3;
    newCounter++;
  }

  nextAngle = clamp(nextAngle, 10, 80);
  nextForce = clamp(nextForce, 5, 40);

  return {
    newCounter,
    newAngle: nextAngle,
    newForce: nextForce
  };
}
