importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js');

const ANGLE_MIN = 5;
const ANGLE_MAX = 88;
const FORCE_MIN = 5;
const FORCE_MAX = 65;

let model = null;
let isTraining = false;

function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function buildModel() {
  const net = tf.sequential();
  net.add(tf.layers.dense({ inputShape: [3], units: 24, activation: 'relu' }));
  net.add(tf.layers.dense({ units: 24, activation: 'relu' }));
  net.add(tf.layers.dense({ units: 2, activation: 'tanh' }));
  net.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
  return net;
}

async function ensureModel() {
  if (model) return model;
  try {
    model = await tf.loadLayersModel('indexeddb://my-trained-model');
    model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
  } catch {
    model = buildModel();
  }
  return model;
}

self.onmessage = async ({ data }) => {
  if (data.cmd === 'init') {
    await ensureModel();
    self.postMessage({ cmd: 'inited' });
    return;
  }

  if (data.cmd !== 'train' || isTraining) return;

  const attempts = Array.isArray(data.attempts) ? data.attempts.slice(-220) : [];
  if (attempts.length < 10) {
    self.postMessage({ cmd: 'trained', skipped: true });
    return;
  }

  await ensureModel();
  isTraining = true;

  try {
    const xs = tf.tensor2d(attempts.map(a => [
      normalize(a.angle, ANGLE_MIN, ANGLE_MAX),
      normalize(a.force, FORCE_MIN, FORCE_MAX),
      normalize((a.distance ?? 0) - (a.targetPosition ?? 0), -2000, 2000)
    ]));

    const ys = tf.tensor2d(attempts.map(a => [
      ((a.bestAngle ?? 45) - a.angle) / (ANGLE_MAX - ANGLE_MIN),
      ((a.bestForce ?? 20) - a.force) / (FORCE_MAX - FORCE_MIN)
    ]));

    await model.fit(xs, ys, {
      epochs: 18,
      shuffle: true,
      verbose: 0
    });

    xs.dispose();
    ys.dispose();

    try {
      await model.save('indexeddb://my-trained-model');
    } catch (saveError) {
      console.warn('No se pudo guardar el modelo del worker:', saveError);
    }

    self.postMessage({ cmd: 'trained' });
  } catch (error) {
    self.postMessage({ cmd: 'train-error', message: error?.message || 'Error desconocido en el worker' });
  } finally {
    isTraining = false;
  }
};
