// 📌 ai.js mejorado //

import { drawTerrain, relocateTarget, generateWind } from "./terrain.js";
import { throwBall } from "./game.js";
import * as Game from "./game.js";

window.addEventListener("DOMContentLoaded", () => {
	console.log("🔎 attemptLog desde AI.js:", Game.attemptLog);
});

function normalize(value, min, max) {
	return (value - min) / (max - min);
}

function denormalize(value, min, max) {
	return value * (max - min) + min;
}

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

let model;
export async function initNeuralNetwork() {
	try {
		console.log("📡 Intentando cargar modelo desde IndexedDB...");
		model = await tf.loadLayersModel("indexeddb://my-trained-model");
		console.log("✅ Modelo cargado correctamente.");
	} catch (error) {
		console.warn("⚠️ No se encontró un modelo entrenado. Creando uno nuevo...");
		await initAndSaveModel();
	}
	model.compile({ optimizer: tf.train.adam(0.005), loss: "meanSquaredError" });
}

async function initAndSaveModel() {
	model = tf.sequential();
	model.add(tf.layers.dense({ inputShape: [3], units: 16, activation: "relu" }));
	model.add(tf.layers.dense({ units: 16, activation: "relu" }));
	model.add(tf.layers.dense({ units: 2, activation: "tanh" })); // Δángulo, Δfuerza
	await model.save("indexeddb://my-trained-model");
	console.log("✅ Modelo nuevo creado y guardado en IndexedDB.");
}

async function saveModel() {
	try {
		console.log("💾 Guardando modelo en IndexedDB...");
		await model.save("indexeddb://my-trained-model");
		console.log("✅ Modelo guardado correctamente en IndexedDB.");
	} catch (error) {
		console.error("❌ Error al guardar el modelo:", error);
	}
}

async function clearModel() {
	try {
		indexedDB.deleteDatabase("tensorflowjs");
		console.log("🗑️ Modelo eliminado correctamente.");
		setTimeout(() => location.reload(), 1000);
	} catch (error) {
		console.error("❌ Error al eliminar el modelo:", error);
	}
}
window.clearModel = clearModel;

let isTraining = false;

export async function trainModel(attemptsData = Game.attemptLog) {
	if (isTraining || !Array.isArray(attemptsData)) return;

	const validData = attemptsData.filter(a =>
		Number.isFinite(a.angle) &&
		Number.isFinite(a.force) &&
		Number.isFinite(a.distance)
	);

	if (validData.length < 10) {
		console.warn("⚠️ Datos de entrenamiento insuficientes o inválidos.");
		return;
	}

	if (!model || typeof model.fit !== "function") {
		console.error("❌ Modelo no inicializado.");
		return;
	}

	isTraining = true;
	updateComment("🤖 Entrenando modelo...");

	const xs = tf.tensor2d(validData.map(a => [
		normalize(a.angle, 10, 80),
		normalize(a.force, 5, 40),
		normalize(a.distance - Game.targetPosition, -2000, 2000)
	]));

	const ys = tf.tensor2d(validData.map(a => [
		(a.angle - Game.bestAngle) / 70,
		(a.force - Game.bestForce) / 35
	]));

	await model.fit(xs, ys, { epochs: 20, shuffle: true, verbose: 0 });
	await saveModel();

	xs.dispose();
	ys.dispose();
	isTraining = false;
}

function findClosestAttempts(attempts, targetX) {
	let under = null, over = null;
	for (let attempt of attempts) {
		if (attempt.distance < targetX && (!under || Math.abs(targetX - attempt.distance) < Math.abs(targetX - under.distance))) {
			under = attempt;
		}
		if (attempt.distance > targetX && (!over || Math.abs(attempt.distance - targetX) < Math.abs(over.distance - targetX))) {
			over = attempt;
		}
	}
	return { under, over };
}

async function predictShot(angle, force, distance, targetPosition) {
	// Validación de entrada
	if (
		isNaN(angle) || isNaN(force) ||
		isNaN(distance) || isNaN(targetPosition)
	) {
		console.warn("🚫 predictShot recibió valores inválidos:", { angle, force, distance, targetPosition });
		return { bestAngle: angle, bestForce: force };
	}

	if (!model) {
		console.warn("❌ Modelo no inicializado.");
		return { bestAngle: angle, bestForce: force };
	}

	const signedError = distance - targetPosition;

	const input = tf.tensor2d([[
		normalize(angle, 10, 80),
		normalize(force, 5, 40),
		normalize(signedError, -2000, 2000)
	]]);

	let prediction;
	try {
		prediction = model.predict(input);
		const data = await prediction.data();

		let deltaAngle = data[0] * 35;
		let deltaForce = data[1] * 20;

		// Validación de salida
		if (isNaN(deltaAngle) || isNaN(deltaForce)) {
			console.warn("🚫 Modelo devolvió NaN en la predicción:", data);
			return { bestAngle: angle, bestForce: force };
		}

		return {
			bestAngle: Math.round(angle + deltaAngle),
			bestForce: Math.round(force + deltaForce)
		};
	} catch (err) {
		console.error("❌ Error al predecir:", err);
		return { bestAngle: angle, bestForce: force };
	} finally {
		input.dispose();
		if (prediction) prediction.dispose();
	}
}

export async function adjustLearning(errorX, angle, force, currentCounter) {
	const attemptLog = Game.attemptLog;
	const targetPosition = Game.targetPosition;
	let distance = Game.attemptLog.at(-1)?.distance ?? 0;

	let newCounter = currentCounter; // ✅ Esto asegura que siempre esté definido

	let refAngle = angle;
	let refForce = force;

	const under = attemptLog.filter(a => a.distance < targetPosition);
	const over = attemptLog.filter(a => a.distance > targetPosition);

	if (under.length && over.length) {
		const bestUnder = under.reduce((a, b) =>
			Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b);
		const bestOver = over.reduce((a, b) =>
			Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b);

		refAngle = (bestUnder.angle + bestOver.angle) / 2;
		refForce = (bestUnder.force + bestOver.force) / 2;
	} else if (under.length) {
		const closest = under.reduce((a, b) =>
			Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b);
		refAngle = closest.angle;
		refForce = closest.force;
	} else if (over.length) {
		const closest = over.reduce((a, b) =>
			Math.abs(a.distance - targetPosition) < Math.abs(b.distance - targetPosition) ? a : b);
		refAngle = closest.angle;
		refForce = closest.force;
	}

	if (isNaN(refAngle) || isNaN(refForce)) {
		updateComment("⚠️ Sin datos válidos. Usando valores por defecto.");
		refAngle = angle;
		refForce = force;
	}

	const prediction = await predictShot(refAngle, refForce, distance, targetPosition);
	let bestAngle = prediction.bestAngle;
	let bestForce = prediction.bestForce;

	const explorationRate = Math.min(0.5, 0.1 + errorX / 800);
	if (newCounter >= 6) {
		updateComment("⚠️ Exploración forzada...");
		bestAngle += Math.random() * 25 - 12;
		bestForce += Math.random() * 16 - 8;
		newCounter = 0;
	} else if (Math.random() < explorationRate) {
		updateComment("🔄 Explorando nuevas estrategias...");
		bestAngle += Math.random() * 6 - 3;
		bestForce += Math.random() * 6 - 3;
		newCounter++;
	}

	bestAngle = Math.max(10, Math.min(80, bestAngle));
	bestForce = Math.max(5, Math.min(40, bestForce));

	updateComment(`📢 🤖 IA ajustó → Ángulo: ${Math.round(bestAngle)}°, Fuerza: ${Math.round(bestForce)}`);
	setTimeout(() => throwBall(bestAngle, bestForce), 500);

	return { newCounter, newAngle: bestAngle, newForce: bestForce };
}

window.trainModel = trainModel;
window.adjustLearning = adjustLearning;
