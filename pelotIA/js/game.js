// 📌 game.js

import {
  initTerrain,
  relocateTarget,
  currentTargetPosition,
  getTerrainHeight,
  RESOLUTION
} from './terrain.js';
import { initNeuralNetwork, trainModel, adjustLearning, clearModel } from './ai.js';
import { initErrorChart, updateErrorChart } from './errorChart.js';

const gameContainer = document.querySelector('.game-container');
const ball = document.getElementById('ball');
const target = document.getElementById('target');
const trailCanvas = document.getElementById('trailCanvas');
const trailCtx = trailCanvas.getContext('2d');

const attemptsDisplay = document.getElementById('attempts');
const bestDistanceDisplay = document.getElementById('bestDistance');
const angleDisplay = document.getElementById('angleValue');
const forceDisplay = document.getElementById('forceValue');
const distanceDisplay = document.getElementById('distanceThrown');
const errorDisplay = document.getElementById('errorValue');
const windDisplay = document.getElementById('windSpeed');
const avgErrorDisplay = document.getElementById('avgError');
const bestConfigDisplay = document.getElementById('bestConfig');
const modelStateDisplay = document.getElementById('modelState');
const commentBox = document.getElementById('commentBox');
const toggleChart = document.getElementById('toggleChart');
const chartContainer = document.getElementById('chartContainer');
const startButton = document.getElementById('start-training-btn');
const clearButton = document.getElementById('clear-training');

let terrain = [];
let attempts = 0;
let bestDistance = Infinity;
let bestAngle = 45;
let bestForce = 20;
let wind = 0;
let attemptLog = [];
let bestAttempts = [];
let noProgressCounter = 0;
let ballMoving = false;
let isSessionActive = false;
let isTrainingQueued = false;
let inactivityTimeout = null;
let modalCountdownInterval = null;

function resizeCanvases() {
  trailCanvas.width = gameContainer.clientWidth;
  trailCanvas.height = gameContainer.clientHeight;
}

function updateModelState(text) {
  if (modelStateDisplay) modelStateDisplay.textContent = text;
}

function resetTelemetry() {
  attempts = 0;
  bestDistance = Infinity;
  bestAngle = 45;
  bestForce = 20;
  wind = 0;
  attemptLog = [];
  bestAttempts = [];
  noProgressCounter = 0;
  ballMoving = false;

  attemptsDisplay.textContent = '0';
  bestDistanceDisplay.textContent = '—';
  angleDisplay.textContent = '0';
  forceDisplay.textContent = '0';
  distanceDisplay.textContent = '0';
  errorDisplay.textContent = '0';
  avgErrorDisplay.textContent = '—';
  bestConfigDisplay.textContent = '—';
}

function clearTrails() {
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
}

function clearComments() {
  commentBox.innerHTML = '';
}

function addComment(message) {
  const line = document.createElement('p');
  line.textContent = message;
  commentBox.appendChild(line);

  while (commentBox.childNodes.length > 6) {
    commentBox.removeChild(commentBox.firstChild);
  }
}

function renderSummary() {
  attemptsDisplay.textContent = String(attempts);
  bestDistanceDisplay.textContent = Number.isFinite(bestDistance) ? String(Math.round(bestDistance)) : '—';
  avgErrorDisplay.textContent = attemptLog.length
    ? String(Math.round(attemptLog.reduce((sum, item) => sum + item.errorX, 0) / attemptLog.length))
    : '—';
  bestConfigDisplay.textContent = Number.isFinite(bestDistance)
    ? `${Math.round(bestAngle)}° / ${Math.round(bestForce)}`
    : '—';
}

function refreshWindFromUI() {
  wind = Number.parseFloat(windDisplay.textContent) || 0;
}

function scheduleAutoRestart() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    if (isSessionActive) {
      restartAITraining();
    }
  }, 15000);
}

function cancelAutoRestart() {
  clearTimeout(inactivityTimeout);
}

async function maybeTrainModel() {
  if (isTrainingQueued || attemptLog.length < 12 || attemptLog.length % 12 !== 0) return;

  isTrainingQueued = true;
  updateModelState('Entrenando…');
  addComment('🧠 Refinando el modelo con los últimos intentos…');

  try {
    await trainModel(attemptLog);
    updateModelState('Lista');
    addComment('✅ Modelo actualizado. Probando mejor ajuste.');
  } catch (error) {
    console.error(error);
    updateModelState('Error de entrenamiento');
    addComment('⚠️ El entrenamiento ha fallado y sigo con heurística.');
  } finally {
    isTrainingQueued = false;
  }
}

export function throwBall(angle, force) {
  if (ballMoving || !terrain.length || !isSessionActive) return;

  ballMoving = true;
  let x = 10;
  let y = getTerrainHeight(x, terrain, RESOLUTION);
  let vx = force * Math.cos(angle * Math.PI / 180) + wind;
  let vy = force * Math.sin(angle * Math.PI / 180);
  const gravity = -9.81;
  const elasticity = 0.12;
  const maxX = gameContainer.clientWidth + 60;

  function updateBall() {
    if (!isSessionActive) {
      ballMoving = false;
      return;
    }

    x += vx;
    y += vy;
    vy += gravity * 0.05;

    if (x > maxX || y < -40) {
      ballMoving = false;
      evaluateThrow(Math.max(0, x), angle, force);
      return;
    }

    const terrainHeight = getTerrainHeight(Math.max(0, x), terrain, RESOLUTION);
    if (y <= terrainHeight) {
      y = terrainHeight;
      vx *= 0.82;
      vy *= -elasticity;

      if (Math.abs(vy) < 1.5 || Math.abs(vx) < 0.8) {
        ballMoving = false;
        evaluateThrow(Math.max(0, x), angle, force);
        return;
      }
    }

    ball.style.left = `${x}px`;
    ball.style.bottom = `${y}px`;

    trailCtx.fillStyle = 'rgba(255, 74, 74, 0.45)';
    trailCtx.fillRect(x, trailCanvas.height - y, 3, 3);

    requestAnimationFrame(updateBall);
  }

  updateBall();
}

async function evaluateThrow(distance, angle, force) {
  if (!isSessionActive) return;

  const errorX = Math.abs(currentTargetPosition - distance);
  const targetRadius = target.clientWidth / 2;

  angleDisplay.textContent = String(Math.round(angle));
  forceDisplay.textContent = String(Math.round(force));
  distanceDisplay.textContent = String(Math.round(distance));
  errorDisplay.textContent = String(Math.round(errorX));

  const bestAngleSnapshot = bestAngle;
  const bestForceSnapshot = bestForce;

  attemptLog.push({
    angle,
    force,
    distance,
    errorX,
    targetPosition: currentTargetPosition,
    bestAngle: bestAngleSnapshot,
    bestForce: bestForceSnapshot,
    wind
  });

  if (errorX < bestDistance) {
    bestDistance = errorX;
    bestAngle = angle;
    bestForce = force;
    bestAttempts.push({ angle, force, errorX });
    if (bestAttempts.length > 10) bestAttempts.shift();
    addComment(`🎯 Nuevo mejor intento: error ${Math.round(bestDistance)} px.`);
  } else {
    noProgressCounter += 1;
    addComment('🤔 No he mejorado. Ajustando estrategia…');
  }

  attempts += 1;
  renderSummary();
  updateErrorChart(errorX, attempts, Number.isFinite(bestDistance) ? bestDistance : errorX);

  if (errorX <= targetRadius) {
    addComment('🏆 ¡Objetivo alcanzado!');
    updateModelState('Objetivo alcanzado');
    showSuccessModal();
    scheduleAutoRestart();
    return;
  }

  await maybeTrainModel();

  const next = await adjustLearning(
    errorX,
    noProgressCounter,
    attemptLog,
    currentTargetPosition,
    bestAngle,
    bestForce
  );

  noProgressCounter = next.newCounter;
  bestAngle = next.newAngle;
  bestForce = next.newForce;

  renderSummary();
  addComment(`🔄 Siguiente tiro: ${bestAngle}° / ${bestForce}`);

  if (isSessionActive) {
    setTimeout(() => throwBall(bestAngle, bestForce), 240);
  }
}

function chooseOpeningShot() {
  const initialShots = [
    { angle: 20, force: 10 },
    { angle: 32, force: 15 },
    { angle: 40, force: 18 },
    { angle: 50, force: 22 },
    { angle: 60, force: 28 }
  ];

  const seed = initialShots[Math.floor(Math.random() * initialShots.length)];
  bestAngle = seed.angle;
  bestForce = seed.force;
}

export function showSuccessModal() {
  const modal = document.getElementById('successModal');
  const content = modal.querySelector('.modal-content');
  content.querySelector('#modalAttempts').textContent = String(attempts);

  let countdownElem = content.querySelector('#modalCountdown');
  if (!countdownElem) {
    countdownElem = document.createElement('p');
    countdownElem.id = 'modalCountdown';
    content.appendChild(countdownElem);
  }

  modal.style.display = 'flex';

  clearInterval(modalCountdownInterval);
  let secondsLeft = 15;
  countdownElem.textContent = `Reinicio automático en ${secondsLeft} s`;

  modalCountdownInterval = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft > 0) {
      countdownElem.textContent = `Reinicio automático en ${secondsLeft} s`;
    } else {
      clearInterval(modalCountdownInterval);
      closeModal();
    }
  }, 1000);
}

export function closeModal() {
  clearInterval(modalCountdownInterval);
  document.getElementById('successModal').style.display = 'none';
  restartAITraining();
}

async function setupScene() {
  terrain = initTerrain('terrainContainer', ball, target, windDisplay);
  refreshWindFromUI();
}

export async function initGame() {
  cancelAutoRestart();
  clearInterval(modalCountdownInterval);
  document.getElementById('successModal').style.display = 'none';

  isSessionActive = false;
  ballMoving = false;

  startButton.textContent = 'Reiniciar entrenamiento';
  updateModelState('Preparando…');

  resetTelemetry();
  clearComments();
  clearTrails();
  resizeCanvases();
  initErrorChart();

  await initNeuralNetwork();
  updateModelState('Lista');

  await setupScene();
  chooseOpeningShot();
  renderSummary();
  addComment('🚀 Entrenamiento iniciado. Buscando la parábola óptima…');

  isSessionActive = true;
  setTimeout(() => throwBall(bestAngle, bestForce), 150);
}

function restartAITraining() {
  initGame();
}

async function clearTraining() {
  cancelAutoRestart();
  isSessionActive = false;
  ballMoving = false;
  updateModelState('Borrando…');
  addComment('🗑️ Eliminando el modelo guardado y reiniciando…');

  try {
    await clearModel();
    await initGame();
  } catch (error) {
    console.error(error);
    updateModelState('Error al borrar');
    addComment('⚠️ No se pudo borrar el modelo almacenado.');
  }
}

function handleChartToggle() {
  chartContainer.style.display = toggleChart.checked ? 'block' : 'none';
}

let resizeRestartTimer = null;
window.addEventListener('resize', () => {
  resizeCanvases();
  if (isSessionActive) {
    cancelAutoRestart();
    clearTimeout(resizeRestartTimer);
    resizeRestartTimer = setTimeout(() => restartAITraining(), 180);
  }
});

toggleChart.addEventListener('change', handleChartToggle);
clearButton.addEventListener('click', clearTraining);

document.querySelectorAll('button').forEach((button) => {
  button.addEventListener('click', cancelAutoRestart);
});

document.addEventListener('mousemove', cancelAutoRestart);
document.addEventListener('keydown', cancelAutoRestart);

handleChartToggle();
resizeCanvases();
resetTelemetry();
updateModelState('Pendiente');

window.closeModal = closeModal;
window.initGame = initGame;
