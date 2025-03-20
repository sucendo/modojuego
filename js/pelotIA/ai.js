// 📌 ai.js //

import { drawTerrain, relocateTarget, generateWind, randomTargetPosition } from "./terrain.js";
import { throwBall } from "./game.js";

// 📌 Normaliza valores entre 0 y 1
function normalize(value, min, max) {
    return (value - min) / (max - min);
}

// 📌 Desnormaliza valores
function denormalize(value, min, max) {
    return (value * (max - min)) + min;
}

// 📌 Manejo de comentarios en UI
const commentBox = document.getElementById("commentBox");
function updateComment(newComment) {
    console.log(`📢 ${newComment}`);
    let newMessage = document.createElement("p");
    newMessage.textContent = newComment;
    commentBox.appendChild(newMessage);
    while (commentBox.childNodes.length > 5) {
        commentBox.removeChild(commentBox.firstChild);
    }
}

// 📌 Inicializar TensorFlow.js
let model;
async function initNeuralNetwork() {
    try {
        console.log("📡 Intentando cargar modelo desde IndexedDB...");
        model = await tf.loadLayersModel('indexeddb://my-trained-model');
        console.log("✅ Modelo cargado correctamente desde IndexedDB.");
        model.compile({ optimizer: tf.train.adam(0.005), loss: 'meanSquaredError' });
    } catch (error) {
        console.warn("⚠️ No se encontró un modelo entrenado. Creando uno nuevo...");
        await initAndSaveModel();
    }
}

// 📌 Guardar el modelo en IndexedDB
async function saveModel() {
    try {
        console.log("💾 Guardando modelo en IndexedDB...");
        await model.save('indexeddb://my-trained-model');
        console.log("✅ Modelo guardado correctamente en IndexedDB.");
    } catch (error) {
        console.error("❌ Error al guardar el modelo:", error);
    }
}

// 📌 Función para borrar el modelo en IndexedDB
async function clearModel() {
    try {
        indexedDB.deleteDatabase('tensorflowjs');
        console.log("🗑️ Modelo eliminado correctamente.");
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error("❌ Error al eliminar el modelo:", error);
    }
}

window.clearModel = clearModel;

// 📌 Variables de control
let bestAttempts = [];
let attemptLog = [];
let isTraining = false;
let bestAngle = 45;
let bestForce = 20;
let noProgressCounter = 0;

// 📌 Cargar historial desde localStorage
function loadPreviousData() {
    let savedBestAttempts = localStorage.getItem("bestAttempts");
    let savedAttemptLog = localStorage.getItem("attemptLog");

    bestAttempts = savedBestAttempts ? JSON.parse(savedBestAttempts) : [];
    attemptLog = savedAttemptLog ? JSON.parse(savedAttemptLog) : [];

    console.log("🔄 Datos cargados desde localStorage:", { bestAttempts, attemptLog });
}

// 📌 Guardar historial en localStorage
window.addEventListener("beforeunload", () => {
    localStorage.setItem("bestAttempts", JSON.stringify(bestAttempts));
    localStorage.setItem("attemptLog", JSON.stringify(attemptLog));
});

// 📌 Entrenar la IA
export async function trainModel() {
    if (isTraining || attemptLog.length < 10) return;
    isTraining = true;

    const inputs = attemptLog.map(d => [
        normalize(d.angle, 10, 80),
        normalize(d.force, 5, 40),
        normalize(d.errorX, 0, 2000)
    ]);

    const outputs = attemptLog.map(d => [
        normalize(d.angle, 10, 80),
        normalize(d.force, 5, 40)
    ]);

    const xs = tf.tensor2d(inputs, [inputs.length, 3], "float32");
    const ys = tf.tensor2d(outputs, [outputs.length, 2], "float32");

    console.log("🔄 Entrenando el modelo...");
    await model.fit(xs, ys, { epochs: 10, batchSize: 4, shuffle: true });

    xs.dispose();
    ys.dispose();
    isTraining = false;
    console.log("✅ Entrenamiento completado.");
}

// 📌 Predecir el próximo disparo
async function predictShot(angle, force, errorX) {
    if (!model) return { bestAngle: angle, bestForce: force };

    const input = tf.tensor2d([[normalize(angle, 10, 80), normalize(force, 5, 40), normalize(errorX, 0, 2000)]]);
    let prediction = model.predict(input);
    let data = await prediction.data();
    input.dispose();
    prediction.dispose();

    return {
        bestAngle: Math.round(denormalize(data[0], 10, 80)),
        bestForce: Math.round(denormalize(data[1], 5, 40))
    };
}

// 📌 Ajustar la IA con exploración inteligente
export async function adjustLearning(errorX, angle, force) {
    let prediction = await predictShot(angle, force, errorX);
    let explorationRate = Math.min(0.5, 0.1 + errorX / 800);

    if (noProgressCounter >= 6) {
        updateComment("⚠️ Exploración forzada...");
        prediction.bestAngle += (Math.random() * 25 - 12);
        prediction.bestForce += (Math.random() * 16 - 8);
        noProgressCounter = 0;
    } else if (Math.random() < explorationRate) {
        updateComment("🔄 Explorando nuevas estrategias...");
        prediction.bestAngle += (Math.random() * 6 - 3);
        prediction.bestForce += (Math.random() * 6 - 3);
    }

    bestAngle = Math.max(10, Math.min(80, prediction.bestAngle));
    bestForce = Math.max(5, Math.min(40, prediction.bestForce));

    updateComment(`📢 🤖 IA ajustó → Ángulo: ${bestAngle}°, Fuerza: ${bestForce}`);
    throwBall(bestAngle, bestForce);
}

// 📌 Inicializar el juego
async function initGame() {
    await initNeuralNetwork();
    loadPreviousData();
    startSimulation();
}

window.initGame = initGame;

window.startSimulation = () => {
    ball.style.display = "block";
    target.style.display = "block";
    attempts = 0;
    bestDistance = 0;
    lastError = null;
    drawTerrain(terrainCanvas, terrainCanvas.getContext("2d"), []);
    relocateTarget(target, terrainCanvas, document.getElementById("windSpeed"), [], ball);
};

window.trainModel = trainModel;
window.adjustLearning = adjustLearning;