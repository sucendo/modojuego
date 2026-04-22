// 📌 trainWorker.js

importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js');

let model = null;
let isTraining = false;

function normalize(value, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function buildModel() {
  const nextModel = tf.sequential();
  nextModel.add(tf.layers.dense({ inputShape: [3], units: 32, activation: 'relu' }));
  nextModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  nextModel.add(tf.layers.dense({ units: 2, activation: 'tanh' }));
  nextModel.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
  return nextModel;
}

self.onmessage = async ({ data }) => {
  if (data.cmd === 'init') {
    if (!model) model = buildModel();
    self.postMessage({ cmd: 'inited' });
    return;
  }

  if (data.cmd !== 'train' || isTraining) return;

  const { attempts, targetPosition, bestAngle, bestForce } = data;
  if (!model || !Array.isArray(attempts) || attempts.length < 10) {
    self.postMessage({ cmd: 'trained', skipped: true });
    return;
  }

  isTraining = true;
  let xs;
  let ys;

  try {
    xs = tf.tensor2d(attempts.map((attempt) => [
      normalize(attempt.angle, 10, 80),
      normalize(attempt.force, 5, 40),
      normalize(attempt.distance - targetPosition, -2000, 2000)
    ]));

    ys = tf.tensor2d(attempts.map((attempt) => [
      (bestAngle - attempt.angle) / 70,
      (bestForce - attempt.force) / 35
    ]));

    await model.fit(xs, ys, {
      epochs: 20,
      shuffle: true,
      verbose: 0
    });

    self.postMessage({ cmd: 'trained' });
  } catch (error) {
    self.postMessage({ cmd: 'trained', error: error?.message || 'Error desconocido' });
  } finally {
    xs?.dispose();
    ys?.dispose();
    isTraining = false;
  }
};
