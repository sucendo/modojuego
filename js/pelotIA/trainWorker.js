// 📌 trainWorker.js //

// =============================================
// Web Worker para entrenar en segundo plano, incluso si la pestaña está oculta
// =============================================
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js');

let model;
let isTraining = false; 

self.onmessage = async ({ data }) => {
  if (data.cmd === 'init') {
    // … tu init existente …
    self.postMessage({ cmd: 'inited' });
  }

  if (data.cmd === 'train') {
    // 0) Si ya estamos entrenando, descartamos esta petición
    if (isTraining) return;

    const { attempts, targetPosition, bestAngle, bestForce } = data;
    if (!model || attempts.length < 10) {
      self.postMessage({ cmd: 'trained' });
      return;
    }

    isTraining = true;  // ← bloqueamos nuevas llamadas

    // 1) Crear tensores (dentro de tidy para auto-limpiar intermediarios)
    const { xs, ys } = tf.tidy(() => {
      const xs = tf.tensor2d(attempts.map(a => [
        normalize(a.angle, 10, 80),
        normalize(a.force, 5, 40),
        normalize(a.distance - targetPosition, -2000, 2000)
      ]));
      const ys = tf.tensor2d(attempts.map(a => [
        (a.angle - bestAngle) / 70,
        (a.force - bestForce) / 35
      ]));
      return { xs, ys };
    });

    // 2) Entrenamos **fuera** de tidy
    await model.fit(xs, ys, {
      epochs: 20,
      shuffle: true,
      verbose: 0
    });

    // 3) Limpiamos tensores
    xs.dispose();
    ys.dispose();

    // 4) Guardamos y notificamos
    try {
      await model.save('indexeddb://my-trained-model');
    } catch (e) {
      console.warn('Error al guardar modelo en Worker:', e);
    }

    isTraining = false;          // ← desbloqueamos
    self.postMessage({ cmd: 'trained' });
  }
};
