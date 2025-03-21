// 📌 game.js //

import { getTerrainHeight, drawTerrain, relocateTarget } from "./terrain.js";
import { trainModel, adjustLearning } from "./ai.js";
import { initNeuralNetwork } from "./ai.js";
import { initErrorChart, updateErrorChart } from './errorChart.js';


// 📌 Elementos del DOM
const gameContainer = document.querySelector(".game-container");
const ball = document.getElementById("ball");
const target = document.getElementById("target");
const terrainCanvas = document.getElementById("terrainCanvas");
const ctx = terrainCanvas.getContext("2d");
const attemptsDisplay = document.getElementById("attempts");
const bestDistanceDisplay = document.getElementById("bestDistance");
const angleDisplay = document.getElementById("angleValue");
const forceDisplay = document.getElementById("forceValue");
const distanceDisplay = document.getElementById("distanceThrown");
const errorDisplay = document.getElementById("errorValue");
const commentBox = document.getElementById("commentBox");
const trainingStatus = document.getElementById("trainingStatus");
const windDisplay = document.getElementById("windSpeed");

let attempts = 0;
let bestDistance = 0;
let bestAngle = 45;
let bestForce = 20;
let wind = Math.random() * 4 - 2;
let targetPosition = 0; // ✅ Antes: let targetPosition;
let lastError = null;
let ballMoving = false;
export let attemptLog = []; // 👈 Exportamos attemptLog para que otros módulos puedan acceder
let bestAttempts = [];
let noProgressCounter = 0;
let forceDirection = 1;
let angleDirection = 1;
let terrain = [];
// ✅ Referencia global al gráfico
let errorChartInstance = null;

// 📌 Función para mostrar comentarios en UI
function updateComment(newComment) {
	console.log(`📢 ${newComment}`);
	let newMessage = document.createElement("p");
	newMessage.textContent = newComment;
	commentBox.appendChild(newMessage);
	while (commentBox.childNodes.length > 5) {
		commentBox.removeChild(commentBox.firstChild);
	}
}

// 📌 Lanzamiento de la pelota con control de instancia única
export function throwBall(angle, force) {
	if (ballMoving) return;
	ballMoving = true;

	let x = 10;
	let y = getTerrainHeight(x, terrain);
	let vx = force * Math.cos(angle * Math.PI / 180) + wind;
	let vy = force * Math.sin(angle * Math.PI / 180);
	let gravity = -9.81;
	let elasticity = 0;

	function updateBall() {
		if (document.hidden) {
			setTimeout(updateBall, 50);
			return;
		}

		x += vx;
		y += vy;
		vy += gravity * 0.05;

		let terrainHeight = getTerrainHeight(x, terrain);
		if (y <= terrainHeight) {
			y = terrainHeight;
			vx *= 0.8;
			vy *= -elasticity;
			if (Math.abs(vy) < 2) {
				ballMoving = false;
				evaluateThrow(x, angle, force);
				return;
			}
		}

		ball.style.left = `${x}px`;
		ball.style.bottom = `${y}px`;

		let trail = document.createElement("div");
		trail.classList.add("trail");
		trail.style.left = `${x}px`;
		trail.style.bottom = `${y}px`;
		gameContainer.appendChild(trail);

		requestAnimationFrame(updateBall);
	}

	updateBall();
}

// 📌 Evaluar el lanzamiento con mejoras en el aprendizaje
async function evaluateThrow(distance, angle, force) {
	let errorX = Math.abs(targetPosition - distance);
	let totalError = errorX;

	angleDisplay.textContent = Math.round(angle);
	forceDisplay.textContent = Math.round(force);
	distanceDisplay.textContent = Math.round(distance);
	errorDisplay.textContent = `${Math.round(errorX)}`;

	commentBox.textContent = "";

	if (errorX < 2000) {
		attemptLog.push({ angle, force, distance, errorX });
		updateErrorChart(errorX, attempts); // 📊 actualiza gráfico
		if (attemptLog.length > 50) attemptLog.shift();
	}

	// 📌 Penalizar repeticiones exactas
	if (bestAttempts.length >= 3) {
		let lastAngles = bestAttempts.slice(-3).map(a => a.angle);
		let lastForces = bestAttempts.slice(-3).map(a => a.force);

		if (new Set(lastAngles).size === 1 && new Set(lastForces).size === 1) {
			updateComment("⚠️ Ajustes repetitivos, cambiando estrategia...");
			forceDirection *= -1;
			angleDirection *= -1;
		}
	}

	if (totalError < bestDistance || bestDistance === 0) {
		bestDistance = totalError;
		bestAttempts.push({ angle, force, errorX });

		if (bestAttempts.length > 10) bestAttempts.shift();

		bestDistanceDisplay.textContent = `${Math.floor(bestDistance)}`;
		noProgressCounter = 0;
		updateComment(`🎯 ¡Nuevo mejor intento! Error: ${Math.floor(bestDistance)} px`);
	} else {
		noProgressCounter++;
		updateComment("🤔 No mejoré... probando otra variante.");
	}

	if (totalError < 20) {
		updateComment("🏆 ¡Lo logré! Alcancé el objetivo.");
		showSuccessModal();
		return;
	}

	attempts++;
	if (errorChartInstance) {
		errorChartInstance.data.labels.push(attempts);
		errorChartInstance.data.datasets[0].data.push(errorX);
		errorChartInstance.update();
	}
	attemptsDisplay.textContent = attempts;

	if (attempts % 5 === 0 && attemptLog.length > 20) {
		trainModel(attemptLog);
	}

	let avgAngle = bestAttempts.reduce((sum, a) => sum + a.angle, 0) / bestAttempts.length;
	let avgForce = bestAttempts.reduce((sum, a) => sum + a.force, 0) / bestAttempts.length;

	const result = await adjustLearning(errorX, avgAngle, avgForce, noProgressCounter);
	noProgressCounter = result.newCounter;
	bestAngle = result.newAngle;
	bestForce = result.newForce;
}

// 📌 Modal de éxito
function showSuccessModal() {
	document.getElementById("modalAttempts").textContent = attempts;
	document.getElementById("successModal").style.display = "flex";
}

// 📌 Cerrar modal y reubicar el objetivo
export function closeModal() {
	document.getElementById("successModal").style.display = "none";
	/*
	relocateTarget(target, terrainCanvas, windDisplay, terrain, ball, newTarget => {
		targetPosition = newTarget;
	});*/
}

const toggleChart = document.getElementById('toggleChart');
const chartContainer = document.getElementById('chartContainer');

toggleChart.addEventListener('change', () => {
	chartContainer.style.display = toggleChart.checked ? 'block' : 'none';
});


function trainAI() {
	if (bestAttempts.length > 0) {
		let avgAngle = bestAttempts.reduce((sum, a) => sum + a.angle, 0) / bestAttempts.length;
		let avgForce = bestAttempts.reduce((sum, a) => sum + a.force, 0) / bestAttempts.length;

		bestAngle = avgAngle + (Math.random() * 4 - 2);
		bestForce = avgForce + (Math.random() * 4 - 2);
	} else {
		const initialShots = [
			{ angle: 20, force: 10 },
			{ angle: 40, force: 18 },
			{ angle: 50, force: 22 },
			{ angle: 65, force: 30 },
			{ angle: 35, force: 25 },
		];
		let randomIndex = Math.floor(Math.random() * initialShots.length);
		bestAngle = initialShots[randomIndex].angle;
		bestForce = initialShots[randomIndex].force;
	}

	throwBall(bestAngle, bestForce);
}

// 📌 Iniciar la simulación
export function startSimulation() {
	ball.style.display = "block";
	target.style.display = "block";
	attempts = 0;
	bestDistance = 0;
	lastError = null;
	attemptsDisplay.textContent = attempts;
	bestDistanceDisplay.textContent = bestDistance;

	drawTerrain(terrainCanvas, ctx, terrain, true);
	relocateTarget(target, terrainCanvas, windDisplay, terrain, ball, newTarget => {
		targetPosition = newTarget;
	});

}

// 📌 Inicializar el juego
export async function initGame() {
	ball.style.display = "block";
	target.style.display = "block";

	attempts = 0;
	bestDistance = 0;
	lastError = null;
	attemptsDisplay.textContent = attempts;
	bestDistanceDisplay.textContent = bestDistance;

	await initNeuralNetwork(); // 👈 Cargar modelo antes de lanzar

	drawTerrain(terrainCanvas, ctx, terrain, true);
	
	initErrorChart(); // ✅ Esto debe ir antes de cualquier updateErrorChart()
	
	relocateTarget(target, terrainCanvas, windDisplay, terrain, ball, newTarget => {
		targetPosition = newTarget;
	});

	trainAI(); // 👈 Después de que el modelo esté listo
}

// 📌 Hacer accesibles globalmente las funciones
window.initGame = initGame;
window.startSimulation = startSimulation;
window.closeModal = closeModal;
