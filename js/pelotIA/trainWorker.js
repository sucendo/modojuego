// 📌 trainWorker.js //

// =============================================
// Web Worker para entrenar en segundo plano, incluso si la pestaña está oculta
// =============================================
import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.esm.js';

let model;

// Normaliza de [min,max] → [0,1]
function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

self.onmessage = async ({ data }) => {
  if (data.cmd === 'init') {
    model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [3], units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2, activation: 'tanh' }));
    model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
    self.postMessage({ cmd: 'inited' });
  }

  if (data.cmd === 'train') {
    const { attempts, targetPosition, bestAngle, bestForce } = data;
    if (!model || attempts.length < 10) {
      self.postMessage({ cmd: 'trained' });
      return;
    }

    await tf.tidy(() => {
      const xs = tf.tensor2d(attempts.map(a => [
        normalize(a.angle, 10, 80),
        normalize(a.force, 5, 40),
        normalize(a.distance - targetPosition, -2000, 2000)
      ]));
      const ys = tf.tensor2d(attempts.map(a => [
        (a.angle - bestAngle) / 70,
        (a.force - bestForce) / 35
      ]));
      return model.fit(xs, ys, { epochs: 20, shuffle: true, verbose: 0 });
    });

    try {
      await model.save('indexeddb://my-trained-model');
    } catch (e) {
      console.warn('Error al guardar modelo en Worker:', e);
    }

    self.postMessage({ cmd: 'trained' });
  }
};