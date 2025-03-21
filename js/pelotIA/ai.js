// 📌 ai.js //

import { drawTerrain, relocateTarget, generateWind } from "./terrain.js";
import { throwBall } from "./game.js";
import * as Game from "./game.js";

console.log("🔎 attemptLog desde AI.js:", Game.attemptLog);

// 📌 Normaliza valores entre 0 y 1
function normalize(value, min, max) {
	return (value - min) / (max - min);
}

// 📌 Desnormaliza valores
function denormalize(value, min, max) {
	return (value * (max - min)) + min;
}

// 📌 Elementos del DOM
const commentBox = document.getElementById("commentBox");

// 📌 Manejo de comentarios en UI
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
export async function initNeuralNetwork() {
	try {
		console.log("📡 Intentando cargar modelo desde IndexedDB...");
		model = await tf.loadLayersModel('indexeddb://my-trained-model');
		console.log("✅ Modelo cargado correctamente.");
		model.compile({ optimizer: tf.train.adam(0.005), loss: 'meanSquaredError' });
	} catch (error) {
		console.warn("⚠️ No se encontró un modelo entrenado. Creando uno nuevo...");
		await initAndSaveModel();
		model.compile({ optimizer: tf.train.adam(0.005), loss: 'meanSquaredError' });
		await saveModel(); // ⬅️ importante
	}
}

// 📌 Crear y guardar un modelo nuevo en IndexedDB
async function initAndSaveModel() {
	model = tf.sequential();

	// 🧠 Capas ocultas
	model.add(tf.layers.dense({ inputShape: [3], units: 16, activation: 'relu' }));
	model.add(tf.layers.dense({ units: 16, activation: 'relu' }));

	// 📤 Capa de salida: 2 valores → ángulo, fuerza
	model.add(tf.layers.dense({ units: 2, activation: 'sigmoid' }));

	// ⚙️ Compilar
	model.compile({
		optimizer: tf.train.adam(0.005),
		loss: 'meanSquaredError'
	});

	// 💾 Guardar en IndexedDB
	await model.save('indexeddb://my-trained-model');
	console.log("✅ Modelo nuevo creado y guardado en IndexedDB.");
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
let isTraining = false;

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
export async function trainModel(attemptsData = attemptLog) {
	if (isTraining || !Array.isArray(attemptsData) || attemptsData.length < 10) {
		console.warn("⚠️ No hay suficientes intentos para entrenar.");
		return;
	}

	if (!model || typeof model.fit !== "function") {
		console.error("❌ Modelo no definido o no inicializado correctamente.");
		return;
	}

	isTraining = true;
	console.log("🔄 Entrenando el modelo...");

	updateComment("🤖 Entrenando modelo...");
	if (trainingStatus) trainingStatus.style.display = "block";

	const xs = tf.tensor2d(attemptsData.map(a =>
		[normalize(a.angle, 10, 80), normalize(a.force, 5, 40), normalize(a.errorX, 0, 2000)]
	));

	const ys = tf.tensor2d(attemptsData.map(a =>
		[normalize(a.angle, 10, 80), normalize(a.force, 5, 40)]
	));

	await model.fit(xs, ys, {
		epochs: 20,
		shuffle: true,
		verbose: 0,
	});

	await saveModel(); // 💾 Guardar solo una vez

	xs.dispose();
	ys.dispose();

	if (trainingStatus) trainingStatus.style.display = "none";
	isTraining = false;
}

// 📌 Predecir el próximo disparo
async function predictShot(angle, force, errorX) {
	if (!model) return { bestAngle: angle, bestForce: force };

	const input = tf.tensor2d([[normalize(angle, 10, 80), normalize(force, 5, 40), normalize(errorX, 0, 2000)]]);

	let prediction;
	try {
		prediction = model.predict(input);
		const data = await prediction.data();
		return {
			bestAngle: Math.round(denormalize(data[0], 10, 80)),
			bestForce: Math.round(denormalize(data[1], 5, 40))
		};
	} finally {
		input.dispose();
		if (prediction) prediction.dispose();
	}
}

// 📌 Ajustar la IA con exploración inteligente
export async function adjustLearning(errorX, angle, force, currentCounter) {
	let prediction = await predictShot(angle, force, errorX);
	let newAngle = prediction.bestAngle;
	let newForce = prediction.bestForce;
	let newCounter = currentCounter;

	let explorationRate = Math.min(0.5, 0.1 + errorX / 800);

	if (newCounter >= 6) {
		updateComment("⚠️ Exploración forzada...");
		newAngle += (Math.random() * 25 - 12);
		newForce += (Math.random() * 16 - 8);
		newCounter = 0;
	} else if (Math.random() < explorationRate) {
		updateComment("🔄 Explorando nuevas estrategias...");
		newAngle += (Math.random() * 6 - 3);
		newForce += (Math.random() * 6 - 3);
	}

	newAngle = Math.max(10, Math.min(80, newAngle));
	newForce = Math.max(5, Math.min(40, newForce));

	updateComment(`📢 🤖 IA ajustó → Ángulo: ${Math.round(newAngle)}°, Fuerza: ${Math.round(newForce)}`);
	setTimeout(() => {
		throwBall(newAngle, newForce);
	}, 500); // 🔁 Espera 500ms antes de lanzar

	return {
		newCounter,
		newAngle,
		newForce
	};
	
}

// 📌 Hacer accesibles globalmente las funciones
window.trainModel = trainModel;
window.adjustLearning = adjustLearning;
