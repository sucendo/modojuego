// 📌 ai.js //

import { throwBall } from "./game.js";
import * as Game from "./game.js";
import { currentTargetPosition } from "./terrain.js";

let model;
let isTraining = false;

function normalize(v,min,max){return Math.max(0,Math.min(1,(v-min)/(max-min)));}  
function clamp(v,min,max){return Math.max(min,Math.min(max,Math.round(v)));}  
function bestOf(arr,target){return arr.reduce((a,b)=>Math.abs(a.distance-target)<Math.abs(b.distance-target)?a:b);}

// Denormaliza de [0,1] a [min,max]
function denormalize(value, min, max) {
  return value * (max - min) + min;
}

// Muestra un comentario en pantalla
function updateComment(newComment) {
  console.log(`📢 ${newComment}`);
  const commentBox = document.getElementById("commentBox");
  const p = document.createElement("p");
  p.textContent = newComment;
  commentBox.appendChild(p);
  while (commentBox.childNodes.length > 5) {
    commentBox.removeChild(commentBox.firstChild);
  }
}

// ==============================
// initNeuralNetwork()
// Carga/sintetiza el modelo y lo compila.
// ==============================
export async function initNeuralNetwork() {
  try {
    console.log("📡 Cargando modelo desde IndexedDB...");
    model = await tf.loadLayersModel("indexeddb://my-trained-model");
    console.log("✅ Modelo cargado.");
  } catch {
    console.warn("⚠️ No hay modelo previo, creando uno nuevo...");
    await initAndSaveModel();
  }
  model.compile({
    optimizer: tf.train.adam(0.0005),   // tasa de aprendizaje reducida
    loss: "meanSquaredError"
  });
}

async function initAndSaveModel() {
  model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [3], units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 2, activation: "tanh" }));
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "meanSquaredError"
  });
  await model.save("indexeddb://my-trained-model");
  console.log("✅ Modelo nuevo creado y guardado.");
}

async function saveModel() {
  try {
    console.log("💾 Guardando modelo...");
    await model.save("indexeddb://my-trained-model");
    console.log("✅ Modelo guardado.");
  } catch (e) {
    console.error("❌ Error guardando modelo:", e);
  }
}

export async function clearModel() {
  try {
    const del = indexedDB.deleteDatabase("tensorflowjs");
    del.onsuccess = () => {
      console.log("🗑️ IndexedDB eliminada.");
      location.reload();
    };
    del.onerror = () => console.warn("❌ Error eliminando IndexedDB.");
  } catch (e) {
    console.error("❌ clearModel:", e);
  }
}

// ==============================
// trainModel(attemptsData)
// Entrena con early-stopping y guarda en IndexedDB.
// ==============================
export async function trainModel(attemptsData = Game.attemptLog) {
  if (isTraining) return;
  isTraining = true;
  document.getElementById("trainingStatus").style.display = "block";

  // Filtrado y persistencia
  const valid = attemptsData.filter(a => 
    [a.angle,a.force,a.distance,a.errorX].every(v => isFinite(v))
  );
  localStorage.setItem("attemptLog", JSON.stringify(valid));

  if (valid.length < 20) {
    console.warn("⚠️ No hay suficientes datos para entrenar.");
    isTraining = false;
    document.getElementById("trainingStatus").style.display = "none";
    return;
  }

  const xs = tf.tensor2d(valid.map(a => [
    normalize(a.angle,10,80),
    normalize(a.force,5,40),
    normalize(a.distance - currentTargetPosition,-2000,2000)
  ]));
  const ys = tf.tensor2d(valid.map(a => [
    (a.angle - Game.bestAngle)/70,
    (a.force - Game.bestForce)/35
  ]));

  // Early stopping: si la pérdida no mejora en 5 épocas, para
  const earlyStop = tf.callbacks.earlyStopping({
    monitor: "loss",
    patience: 5
  });

  await model.fit(xs, ys, {
    epochs: 50,
    shuffle: true,
    callbacks: [ earlyStop ],
    verbose: 0
  });

  await model.save("indexeddb://my-trained-model");
  xs.dispose(); ys.dispose();

  document.getElementById("trainingStatus").style.display = "none";
  isTraining = false;
}

// ==============================
// predictShot(angle, force, distance, targetPosition)
// Calcula la siguiente acción sin bloquear.
// ==============================
async function predictShot(angle, force, distance, targetPosition) {
  const input = tf.tensor2d([[
    normalize(angle,10,80),
    normalize(force,5,40),
    normalize(distance - targetPosition,-2000,2000)
  ]]);
  let data = await model.predict(input).data();
  input.dispose();

  // Fallback si NaN
  if (data.some(v=>isNaN(v))) {
    console.warn("🚫 Predicción inválida, reiniciando modelo.");
    await initAndSaveModel();
    return { bestAngle: angle, bestForce: force };
  }

  return {
    bestAngle: Math.round(angle + data[0]*35),
    bestForce: Math.round(force + data[1]*20)
  };
}

// ==============================
// adjustLearning(errorX, angle, force, counter)
// Exploración adaptativa según historial.
// ==============================
/**
 * Ajusta el siguiente tiro basándose en los lanzamientos previos
 * y su relación con el objetivo.
 *
 * @param {number} errorX           Error absoluto del último tiro
 * @param {number} angle            Ángulo usado en el último tiro
 * @param {number} force            Fuerza usada en el último tiro
 * @param {number} currentCounter   Contador de intentos sin mejora
 * @returns {Promise<{newCounter:number,newAngle:number,newForce:number}>}
 */
export async function adjustLearning(errorX, angle, force, currentCounter) {
  const attemptLog     = Game.attemptLog;
  const targetPosition = currentTargetPosition;
  const distance       = attemptLog.at(-1)?.distance ?? 0;

  // Empezamos con el contador que llega como parámetro
  let newCounter = currentCounter;

  // Elegimos un tiro de referencia combinando mejores aciertos "bajo" y "sobre"
  let refAngle = angle;
  let refForce = force;
  const under = attemptLog.filter(a => a.distance < targetPosition);
  const over  = attemptLog.filter(a => a.distance > targetPosition);

  if (under.length && over.length) {
    const bestUnder = under.reduce((a, b) =>
      Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b
    );
    const bestOver = over.reduce((a, b) =>
      Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b
    );
    refAngle = (bestUnder.angle + bestOver.angle) / 2;
    refForce = (bestUnder.force + bestOver.force) / 2;
  } else if (under.length) {
    const closest = under.reduce((a, b) =>
      Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b
    );
    refAngle = closest.angle;
    refForce = closest.force;
  } else if (over.length) {
    const closest = over.reduce((a, b) =>
      Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b
    );
    refAngle = closest.angle;
    refForce = closest.force;
  }

  // Fallback por si sale NaN
  if (isNaN(refAngle) || isNaN(refForce)) {
    updateComment("⚠️ Sin datos válidos. Usando valores por defecto.");
    refAngle = angle;
    refForce = force;
  }

  // Pedimos al modelo una predicción basada en esa referencia
  const { bestAngle, bestForce } = await predictShot(refAngle, refForce, distance, targetPosition);
  let nextAngle = bestAngle;
  let nextForce = bestForce;

  // Tasa de exploración: permite probar variaciones si no mejora
  const explorationRate = Math.min(0.5, 0.1 + errorX / 800);

  if (newCounter >= 6) {
    updateComment("⚠️ Exploración forzada tras muchos intentos...");
    nextAngle += Math.random() * 25 - 12;
    nextForce += Math.random() * 16 - 8;
    newCounter = 0;
  } else if (Math.random() < explorationRate) {
    updateComment("🔄 Explorando nuevas estrategias...");
    nextAngle += Math.random() * 6 - 3;
    nextForce += Math.random() * 6 - 3;
    newCounter++;
  }

  // Clampeamos a los rangos válidos
  nextAngle = Math.max(10, Math.min(80, Math.round(nextAngle)));
  nextForce = Math.max(5,  Math.min(40, Math.round(nextForce)));

  updateComment(`📢 🤖 IA ajustó → Ángulo: ${nextAngle}°, Fuerza: ${nextForce}`);
  setTimeout(() => throwBall(nextAngle, nextForce), 500);

  return { newCounter, newAngle: nextAngle, newForce: nextForce };
}

window.clearModel       = clearModel;
window.trainModel       = trainModel;
window.adjustLearning   = adjustLearning;
