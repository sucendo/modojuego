// 📌 game.js //

import { initTerrain, relocateTarget, currentTargetPosition, getTerrainHeight,  RESOLUTION } from "./terrain.js";
import { initNeuralNetwork, trainModel, adjustLearning, clearModel } from "./ai.js";
import { initErrorChart, updateErrorChart } from "./errorChart.js";

// 📌 Elementos del DOM
const gameContainer = document.querySelector(".game-container");
const ball = document.getElementById("ball");
const target = document.getElementById("target");

// resolution debe coincidir con la que usas en terrain.js (p.ej. 10px)
let terrain = [];  // se llenará desde initTerrain()

const attemptsDisplay = document.getElementById("attempts");
const bestDistanceDisplay = document.getElementById("bestDistance");
const angleDisplay = document.getElementById("angleValue");
const forceDisplay = document.getElementById("forceValue");
const distanceDisplay = document.getElementById("distanceThrown");
const errorDisplay = document.getElementById("errorValue");
const commentBox = document.getElementById("commentBox");
//const trainingStatus = document.getElementById("trainingStatus");
const windDisplay = document.getElementById("windSpeed");

let attemptLog = []; 

let attempts = 0;
let bestDistance = 0;
let bestAngle = 45;
let bestForce = 20;
let wind = Math.random() * 4 - 2;
//let lastError = null;
let ballMoving = false;

let bestAttempts = [];
let noProgressCounter = 0;
let forceDirection = 1;
let angleDirection = 1;

// ✅ Referencia global de inactividad tras alcanzar objetivo
let inactivityTimeout = null;

let worker;
//let lastTargetPos = 0;

// tras obtener gameContainer, ball, target…
const trailCanvas = document.getElementById('trailCanvas');
const trailCtx    = trailCanvas.getContext('2d');
// Asegúrate de ajustar su tamaño al contenedor:
trailCanvas.width  = gameContainer.clientWidth;
trailCanvas.height = gameContainer.clientHeight;

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

// Ajustar tamaño al arrancar y al redimensionar
function resizeCanvases() {
  const W = gameContainer.clientWidth;
  const H = gameContainer.clientHeight;
  trailCanvas.width = W;
  trailCanvas.height = H;
  // si usas un canvas para el SVG del terreno, ajústalo aquí también
}
window.addEventListener('resize', resizeCanvases);
resizeCanvases();

// 📌 Lanzamiento de la pelota con control de instancia única
// 📌 game.js (solo la función throwBall modificada)

// Asumiendo que al inicio de tu módulo has hecho algo así:
// const trailCanvas = document.getElementById('trailCanvas');
// const trailCtx    = trailCanvas.getContext('2d');

export function throwBall(angle, force) {
  if (ballMoving) return;
  ballMoving = true;

  let x = 10;
  let y = getTerrainHeight(x, terrain, RESOLUTION);
  const vx0 = force * Math.cos(angle * Math.PI / 180) + wind;
  const vy0 = force * Math.sin(angle * Math.PI / 180);
  let vx = vx0, vy = vy0;
  const gravity = -9.81;
  const elasticity = 0;

  function updateBall() {
    // Si la pestaña está oculta, seguimos en “background”
    if (document.hidden) {
      setTimeout(updateBall, 50);
      return;
    }

    x += vx;
    y += vy;
    vy += gravity * 0.05;

    // —— Nuevo: si baja de Y=0 consideramos colisión con el suelo “infinito”
    if (y < 0) {
      y = 0;
      ballMoving = false;
      evaluateThrow(x, angle, force);
      return;
    }

    // Comprobar choque real con el terreno
    const terrainH = getTerrainHeight(x, terrain, RESOLUTION);
    if (y <= terrainH) {
      y = terrainH;
      vx *= 0.8;
      vy *= -elasticity;
      if (Math.abs(vy) < 2) {
        ballMoving = false;
        evaluateThrow(x, angle, force);
        return;
      }
    }

    // Actualizamos posición visual
    ball.style.left   = `${x}px`;
    ball.style.bottom = `${y}px`;

    // Pintamos un punto en el canvas de trails
    trailCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    trailCtx.fillRect(x, window.innerHeight - y, 3, 3);

    requestAnimationFrame(updateBall);
  }

  updateBall();
}

// ────────────────────────────────────────────────────
// evaluateThrow: envía datos al Worker tras cada intento
// ────────────────────────────────────────────────────
async function evaluateThrow(distance, angle, force) {
  // 1) Cálculo del error y actualización de la UI
  const errorX = Math.abs(currentTargetPosition - distance);
  angleDisplay.textContent    = Math.round(angle);
  forceDisplay.textContent    = Math.round(force);
  distanceDisplay.textContent = Math.round(distance);
  errorDisplay.textContent    = Math.round(errorX);
  commentBox.textContent = "";

  // 2) Log de intento y gráfico
  attemptLog.push({ angle, force, distance, errorX });
  updateErrorChart(errorX, attempts + 1);
  
  // 3) Disparo al Worker y Actualizar datos del Worker
if (attemptLog.length % 10 === 0) {
  worker.postMessage({ cmd: 'train', attempts: attemptLog, targetPosition: currentTargetPosition, bestAngle, bestForce });
}

  // 4) Penalización de repeticiones
  if (bestAttempts.length >= 3) {
    const lastAngles = bestAttempts.slice(-3).map(a => a.angle);
    const lastForces = bestAttempts.slice(-3).map(a => a.force);
    if (new Set(lastAngles).size === 1 && new Set(lastForces).size === 1) {
      updateComment("⚠️ Ajustes repetitivos, cambiando estrategia...");
      forceDirection *= -1;
      angleDirection *= -1;
    }
  }

  // 5) Nuevo mejor intento
  if (errorX < bestDistance || bestDistance === 0) {
    bestDistance = errorX;
    bestAttempts.push({ angle, force, errorX });
    if (bestAttempts.length > 10) bestAttempts.shift();
    bestDistanceDisplay.textContent = `${Math.floor(bestDistance)}`;
    noProgressCounter = 0;
    updateComment(`🎯 ¡Nuevo mejor intento! Error: ${Math.floor(bestDistance)} px`);
  } else {
    noProgressCounter++;
    updateComment("🤖 No mejoré...🤔 probando otra variante.");
  }

  // 6) Éxito y modal
const targetRadius = target.clientWidth / 2;
if (errorX <= targetRadius) {
    updateComment("🏆 ¡Lo logré! Alcancé el objetivo.");
    showSuccessModal();
    startInactivityTimer();
    return;
  }

// 7) Incrementar contador y siguiente tiro
  attempts++;
  attemptsDisplay.textContent = attempts;

  // —— Calcular siguiente tiro con la IA
  const { newCounter, newAngle, newForce } = await adjustLearning(
    errorX,
    noProgressCounter,
    attemptLog,
    currentTargetPosition,
    bestAngle,
    bestForce
  );
  noProgressCounter = newCounter;
  bestAngle         = newAngle;
  bestForce         = newForce;

  // —— Comentarios enriquecidos —— 

  // 1) Mostrar el nuevo ángulo y fuerza
  updateComment(`🔄 Nuevo tiro: ángulo ${bestAngle.toFixed(1)}°, fuerza ${bestForce.toFixed(1)}`);

  // 2) Mostrar el error actual
  updateComment(`❌ Error tras tiro: ${errorX.toFixed(1)} px`);

  // 3) Comentario gracioso aleatorio
  const chistes = [
    "🤖 ¡Ey, no se me escape esa parábola!",
    "🤖 Creí que sabía matemáticas… pero no tanto 🤓",
    "🤖 La IA: 0 – Suerte: 1",
    "🤖 Necesito un café para corregir esto ☕",
    "🤖 ¿Alguien llamó a Pythagoras?"
  ];
  const idx = Math.floor(Math.random() * chistes.length);
  updateComment(chistes[idx]);

  // —— Lanzar el siguiente tiro con los nuevos parámetros
  console.log(`▶️ Siguiente lanzamiento — ángulo: ${bestAngle}°, fuerza: ${bestForce}`);
  throwBall(bestAngle, bestForce);
}

// ────────────────────────────────────────────────────
// Modal de éxito con cuenta atrás y reinicio automático
// ────────────────────────────────────────────────────

// variable para almacenar el intervalo de la cuenta atrás
let modalCountdownInterval;

export function showSuccessModal() {
	const modal = document.getElementById("successModal");
	const content = modal.querySelector(".modal-content");

	// Actualiza número de intentos
	content.querySelector("#modalAttempts").textContent = attempts;

	// Crea (o reutiliza) el elemento de cuenta atrás
	let countdownElem = content.querySelector("#modalCountdown");
	if (!countdownElem) {
		countdownElem = document.createElement("p");
		countdownElem.id = "modalCountdown";
		content.appendChild(countdownElem);
	}

	// Muestra el modal
	modal.style.display = "flex";

	// Inicia la cuenta atrás desde 15 segundos
	let secondsLeft = 15;
	countdownElem.textContent = `Reiniciar entrenamiento en ${secondsLeft} seg`;

	modalCountdownInterval = setInterval(() => {
		secondsLeft--;
		if (secondsLeft > 0) {
			countdownElem.textContent = `Reiniciar entrenamiento en ${secondsLeft} seg`;
		} else {
			clearInterval(modalCountdownInterval);
			// cierra el modal y, al hacerlo, reinicia el entrenamiento
			closeModal();
		}
	}, 1000);
}

export function closeModal() {
	// Para la cuenta atrás si todavía está corriendo
	clearInterval(modalCountdownInterval);

	// Oculta el modal
	document.getElementById("successModal").style.display = "none";

	// Arranca de nuevo todo el ciclo de entrenamiento
	restartAITraining();
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

// Llamar esta función al acertar
function startInactivityTimer() {
	clearTimeout(inactivityTimeout);
	inactivityTimeout = setTimeout(() => {
		console.log("⏳ Sin interacción. Reiniciando entrenamiento IA...");
		restartAITraining(); // ← Función que reinicia la IA
	}, 15000);
}

// Escuchar interacción en botones para cancelar reinicio automático
function resetInactivityTimerOnInteraction() {
	clearTimeout(inactivityTimeout);
}

// Agrega estos listeners en tu initGame o después de crear los botones
document.querySelectorAll('button').forEach(btn => {
	btn.addEventListener('click', resetInactivityTimerOnInteraction);
});

// Además, cancelar tras cualquier movimiento de ratón o tecla pulsada
document.addEventListener('mousemove', resetInactivityTimerOnInteraction);
document.addEventListener('keydown', resetInactivityTimerOnInteraction);

// -------------------------------------
// Función restartAITraining actualizada
// -------------------------------------
function restartAITraining() {
  console.log("🔄 Reiniciando entrenamiento IA...");

  // 1) Resetear históricos en memoria
  attemptLog    = [];
  bestAttempts  = [];
  attempts      = 0;
  bestDistance  = 0;
  attemptsDisplay.textContent     = attempts;
  bestDistanceDisplay.textContent = bestDistance;

  // 2) Limpiar canvas de trails
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

  // 3) El chart se reiniciará dentro de initGame()
  initGame();
}

// 📌 Iniciar la simulación
export function startSimulation() {
  // hacemos visible bola/objetivo
  ball.style.display   = "block";
  target.style.display = "block";

  // reiniciamos contadores de UI
  attempts = 0;
  bestDistanceDisplay.textContent = 0;

  // inicializa el "terreno" en tu <div id="terrainContainer">
  terrain = initTerrain(
    "terrainContainer",  // el ID de tu div en pelotIA.html
    ball,
    target,
    windDisplay
  );

  // sitúa el objetivo
  relocateTarget(
    target,
    "terrainContainer",
    windDisplay,
    terrain,
    ball
  );
}

// ────────────────────────────────────────────────────
// initGame: arranca simulación + Worker de entrenamiento
// ────────────────────────────────────────────────────
export async function initGame() {
  // ── 1) Mostrar bola y objetivo ───────────────────
  ball.style.display   = "block";
  target.style.display = "block";

  // ── 2) Resetear contadores y logs ────────────────
  attemptLog      = [];
  bestAttempts    = [];
  attempts        = 0;
  bestDistance    = 0;
  noProgressCounter = 0;
  attemptsDisplay.textContent     = attempts;
  bestDistanceDisplay.textContent = bestDistance;
  //commentBox.textContent          = "";

  // ── 3) Borrar todas las trazas dibujadas ─────────
  document.querySelectorAll('.trail').forEach(el => el.remove());
  
  // ── 4) Limpiar el canvas de trails ─────────
  /*const trailCanvas = document.getElementById('trailCanvas');
  const trailCtx    = trailCanvas.getContext('2d');
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);*/
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

  // ── 5) Resetear gráfico de error ──────────────────
  initErrorChart();

  // ── 6) Cambiar texto del botón ────────────────────
  const startBtn = document.getElementById('start-training-btn');
  startBtn.textContent = 'Reiniciar Entrenamiento';

  // ── 7) Cargar o crear el modelo ──────────────────
  await initNeuralNetwork();
  
   // ── 8) Generar terreno y posicionar bola/objetivo _antes_ del primer tiro
  terrain = initTerrain( 'terrainContainer', ball, target, windDisplay );

  // ── 9) Inicializar Worker de entrenamiento BG ─────
	worker = new Worker("js/pelotIA/trainWorker.js"); // clásico
	//worker = new Worker('js/pelotIA/trainWorker.js', { type: 'module' });
	worker.postMessage({ cmd: 'init' });
	worker.onmessage = ({ data }) => {
	  if (data.cmd === 'inited')  updateComment('🧠 Worker listo para entrenar');
	  worker.onmessage = async ({ data }) => {
		  if (data.cmd === 'trained') {
			updateComment('✅ Entrenamiento BG completado');
			await initNeuralNetwork();  // <— recarga el modelo actualizado
		  }
		};
	};

  // ── 10) Disparar primer lanzamiento ─────────────────
  trainAI();
  
  const resetInactivity = () => clearTimeout(inactivityTimeout);
document.querySelectorAll('button').forEach(btn => btn.addEventListener('click', resetInactivity));
document.addEventListener('mousemove', resetInactivity);
document.addEventListener('keydown', resetInactivity);
  
}

function doNextShot() {
  throwBall(bestAngle, bestForce);
}

// Botón para borrar IA:
document.getElementById("clear-training")
  .addEventListener("click", clearModel);


document.getElementById("clear-training")
  .addEventListener("click", async () => {
    // 1) Limpiar estado en memoria y UI
    attemptLog   = [];
    bestAttempts = [];
    attempts     = 0;
    bestDistance = 0;
    attemptsDisplay.textContent     = attempts;
    bestDistanceDisplay.textContent = bestDistance;
    document.querySelectorAll(".trail").forEach(el => el.remove());
    // Resetea el gráfico de error
    initErrorChart();
    updateComment("🗑️ Entrenamientos previos eliminados. IA reiniciada.");

    // 2) Borra el modelo de IndexedDB y, al terminar, lanza un nuevo tiro
    try {
      await clearModel();
      trainAI();
    } catch (e) {
      console.error(e);
      updateComment("⚠️ No se pudo eliminar el modelo en IndexedDB.");
    }
  });

// 📌 Hacer accesibles globalmente las funciones
window.startSimulation = startSimulation;
window.closeModal = closeModal;
window.initGame = initGame;
