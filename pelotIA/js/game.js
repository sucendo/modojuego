import { initTerrain, relocateTarget, currentTargetPosition, getTerrainHeight, RESOLUTION } from './terrain.js';
import { initNeuralNetwork, adjustLearning, clearModel } from './ai.js';
import { initErrorChart, updateErrorChart, clearErrorChart } from './errorChart.js';

const gameContainer = document.querySelector('.game-container');
const ball = document.getElementById('ball');
const target = document.getElementById('target');
const launcher = document.getElementById('launcher');
const launcherBarrel = document.getElementById('launcherBarrel');
const aimLine = document.getElementById('aimLine');
const impactPulse = document.getElementById('impactPulse');
const trailCanvas = document.getElementById('trailCanvas');
const trailCtx = trailCanvas.getContext('2d');

const attemptsDisplay = document.getElementById('attempts');
const bestDistanceDisplay = document.getElementById('bestDistance');
const angleDisplay = document.getElementById('angleValue');
const forceDisplay = document.getElementById('forceValue');
const distanceDisplay = document.getElementById('distanceThrown');
const errorDisplay = document.getElementById('errorValue');
const windDisplay = document.getElementById('windSpeed');
const targetPosValue = document.getElementById('targetPosValue');
const bestShotValue = document.getElementById('bestShotValue');
const modeValue = document.getElementById('modeValue');
const aiStateValue = document.getElementById('aiStateValue');
const trainingStatus = document.getElementById('trainingStatus');
const commentBox = document.getElementById('commentBox');
const chartPanel = document.getElementById('chartPanel');
const toggleChart = document.getElementById('toggleChart');

const angleSlider = document.getElementById('angleSlider');
const forceSlider = document.getElementById('forceSlider');
const angleSliderValue = document.getElementById('angleSliderValue');
const forceSliderValue = document.getElementById('forceSliderValue');

const manualShotBtn = document.getElementById('manual-shot-btn');
const startTrainingBtn = document.getElementById('start-training-btn');
const pauseTrainingBtn = document.getElementById('pause-training-btn');
const newTargetBtn = document.getElementById('new-target-btn');
const clearTrainingBtn = document.getElementById('clear-training');

let terrain = [];
let attemptLog = [];
let attempts = 0;
let bestDistance = Infinity;
let bestAngle = 45;
let bestForce = 20;
let wind = 0;
let ballMoving = false;
let bestAttempts = [];
let noProgressCounter = 0;
let autoTrainingEnabled = false;
let trainingPaused = false;
let worker = null;
let workerReady = false;
let aiReady = false;

const START_X = 10;
const seedShots = [
  { angle: 22, force: 12 },
  { angle: 34, force: 18 },
  { angle: 44, force: 21 },
  { angle: 56, force: 28 },
  { angle: 68, force: 34 }
];

function appendComment(message) {
  const p = document.createElement('p');
  p.textContent = message;
  commentBox.appendChild(p);
  while (commentBox.childNodes.length > 6) {
    commentBox.removeChild(commentBox.firstChild);
  }
  commentBox.scrollTop = commentBox.scrollHeight;
  console.log(message);
}

function setStatus(text) {
  trainingStatus.textContent = text;
}

function setMode(mode) {
  modeValue.textContent = mode;
}

function setAIState(text) {
  aiStateValue.textContent = text;
}

function resizeCanvases() {
  trailCanvas.width = gameContainer.clientWidth;
  trailCanvas.height = gameContainer.clientHeight;
  drawLauncherAndAim(Number(angleSlider.value));
}

function resetRunData() {
  attemptLog = [];
  attempts = 0;
  bestDistance = Infinity;
  bestAttempts = [];
  noProgressCounter = 0;
  attemptsDisplay.textContent = '0';
  bestDistanceDisplay.textContent = '0 px';
  bestShotValue.textContent = '—';
  distanceDisplay.textContent = '0 px';
  errorDisplay.textContent = '0 px';
  commentBox.innerHTML = '<p>Escena lista. Ajusta el disparo o inicia el entrenamiento.</p>';
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  clearErrorChart();
}

function syncManualOutputs() {
  angleSliderValue.textContent = `${angleSlider.value}°`;
  forceSliderValue.textContent = `${forceSlider.value}`;
  if (!ballMoving) {
    angleDisplay.textContent = `${angleSlider.value}°`;
    forceDisplay.textContent = `${forceSlider.value}`;
  }
  drawLauncherAndAim(Number(angleSlider.value));
}

function drawLauncherAndAim(angle) {
  if (!terrain.length) return;
  const groundY = getTerrainHeight(START_X, terrain, RESOLUTION);
  launcher.style.left = '8px';
  launcher.style.bottom = `${groundY}px`;
  launcherBarrel.style.transform = `rotate(${-angle}deg)`;

  const originX = 26;
  const originY = groundY + 16;
  const aimLength = 120;
  const radians = angle * Math.PI / 180;
  aimLine.style.left = `${originX}px`;
  aimLine.style.bottom = `${originY}px`;
  aimLine.style.width = `${aimLength}px`;
  aimLine.style.transform = `rotate(${-angle}deg)`;
}

function placeBallAtLauncher() {
  if (!terrain.length) return;
  const launchY = getTerrainHeight(START_X, terrain, RESOLUTION);
  ball.style.left = `${START_X}px`;
  ball.style.bottom = `${launchY}px`;
  ball.style.display = 'block';
  target.style.display = 'block';
  drawLauncherAndAim(Number(angleSlider.value));
}

function updateWindFromUI() {
  wind = Number(windDisplay.textContent) || 0;
}

function updateTargetPositionLabel() {
  targetPosValue.textContent = currentTargetPosition ? `${Math.round(currentTargetPosition)} px` : '—';
}

function showImpactPulse(x, y) {
  impactPulse.style.left = `${x}px`;
  impactPulse.style.bottom = `${y}px`;
  impactPulse.classList.remove('visible');
  void impactPulse.offsetWidth;
  impactPulse.classList.add('visible');
}

function setupScene() {
  resizeCanvases();
  terrain = initTerrain('terrainContainer', ball, target, windDisplay);
  updateWindFromUI();
  updateTargetPositionLabel();
  placeBallAtLauncher();
  setStatus('Modo preparación');
}

async function ensureAI() {
  if (!aiReady) {
    await initNeuralNetwork();
    aiReady = true;
  }

  if (!worker) {
    worker = new Worker('js/trainWorker.js');
    worker.onmessage = async ({ data }) => {
      if (data.cmd === 'inited') {
        workerReady = true;
        setAIState('Worker listo');
        appendComment('🧠 Worker listo para entrenar en segundo plano.');
      } else if (data.cmd === 'trained') {
        setAIState('Modelo actualizado');
        appendComment('✅ La IA ha refinado el modelo en segundo plano.');
        try {
          await initNeuralNetwork();
        } catch (error) {
          console.warn('No se pudo recargar el modelo actualizado:', error);
        }
      } else if (data.cmd === 'train-error') {
        setAIState('Error de entrenamiento');
        appendComment(`⚠️ Error en worker: ${data.message}`);
      }
    };
    worker.postMessage({ cmd: 'init' });
    setAIState('Inicializando');
  }
}

function pickSeedShot() {
  if (bestAttempts.length) {
    const avgAngle = bestAttempts.reduce((sum, shot) => sum + shot.angle, 0) / bestAttempts.length;
    const avgForce = bestAttempts.reduce((sum, shot) => sum + shot.force, 0) / bestAttempts.length;
    return {
      angle: Math.max(10, Math.min(80, Math.round(avgAngle + (Math.random() * 6 - 3)))),
      force: Math.max(5, Math.min(40, Math.round(avgForce + (Math.random() * 6 - 3))))
    };
  }
  return seedShots[Math.floor(Math.random() * seedShots.length)];
}

function updateShotDisplays(angle, force, distance, errorX) {
  angleDisplay.textContent = `${Math.round(angle)}°`;
  forceDisplay.textContent = `${Math.round(force)}`;
  distanceDisplay.textContent = `${Math.round(distance)} px`;
  errorDisplay.textContent = `${Math.round(errorX)} px`;
}

function updateBestDisplays() {
  bestDistanceDisplay.textContent = Number.isFinite(bestDistance) ? `${Math.round(bestDistance)} px` : '0 px';
  if (bestAttempts.length) {
    const best = bestAttempts[bestAttempts.length - 1];
    bestShotValue.textContent = `${Math.round(best.angle)}° / ${Math.round(best.force)}`;
  } else {
    bestShotValue.textContent = '—';
  }
}

function sendTrainingBatch() {
  if (!workerReady || !worker || attemptLog.length < 10 || attemptLog.length % 8 !== 0) return;
  setAIState('Entrenando');
  worker.postMessage({
    cmd: 'train',
    attempts: attemptLog,
    targetPosition: currentTargetPosition,
    bestAngle,
    bestForce
  });
}

function launchShot(angle, force, { fromAI = false } = {}) {
  if (ballMoving || !terrain.length) return;

  ballMoving = true;
  setStatus(fromAI ? 'IA disparando…' : 'Disparo manual en curso…');

  let x = START_X;
  let y = getTerrainHeight(START_X, terrain, RESOLUTION);
  const radians = angle * Math.PI / 180;
  let vx = force * Math.cos(radians) + wind;
  let vy = force * Math.sin(radians);
  const gravity = -9.81;
  const dt = 0.16;

  ball.style.display = 'block';
  ball.style.left = `${x}px`;
  ball.style.bottom = `${y}px`;

  const step = () => {
    if (document.hidden) {
      requestAnimationFrame(step);
      return;
    }

    x += vx;
    y += vy;
    vy += gravity * dt;

    const terrainHeight = getTerrainHeight(Math.max(0, Math.min(x, gameContainer.clientWidth - 1)), terrain, RESOLUTION);
    const outOfBounds = x > gameContainer.clientWidth + 20 || x < -20 || y < -30;

    if (outOfBounds || y <= terrainHeight) {
      y = Math.max(terrainHeight, y);
      ball.style.left = `${Math.max(0, x)}px`;
      ball.style.bottom = `${Math.max(0, y)}px`;
      trailCtx.fillStyle = 'rgba(255, 70, 70, 0.5)';
      trailCtx.fillRect(Math.max(0, x), trailCanvas.height - Math.max(0, y), 3, 3);
      ballMoving = false;
      showImpactPulse(Math.max(0, x), Math.max(0, y));
      evaluateThrow(Math.max(0, x), angle, force, fromAI).catch(error => {
        console.error(error);
        appendComment('⚠️ Error al evaluar el disparo.');
      });
      return;
    }

    ball.style.left = `${x}px`;
    ball.style.bottom = `${y}px`;
    trailCtx.fillStyle = 'rgba(255, 70, 70, 0.42)';
    trailCtx.fillRect(x, trailCanvas.height - y, 2.5, 2.5);

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

async function evaluateThrow(distance, angle, force, fromAI) {
  const errorX = Math.abs(currentTargetPosition - distance);
  attempts += 1;
  attemptsDisplay.textContent = `${attempts}`;
  updateShotDisplays(angle, force, distance, errorX);

  const shot = {
    angle,
    force,
    distance,
    errorX,
    targetPosition: currentTargetPosition,
    bestAngle,
    bestForce
  };
  attemptLog.push(shot);
  updateErrorChart(errorX, attempts);

  if (errorX < bestDistance) {
    bestDistance = errorX;
    bestAngle = angle;
    bestForce = force;
    bestAttempts.push({ angle, force, errorX });
    if (bestAttempts.length > 10) bestAttempts.shift();
    appendComment(`🎯 Nuevo mejor intento: error ${Math.round(errorX)} px.`);
  } else {
    noProgressCounter += 1;
    appendComment(`🤔 Error actual ${Math.round(errorX)} px. La IA seguirá ajustando.`);
  }

  updateBestDisplays();
  sendTrainingBatch();

  const hitRadius = target.clientWidth / 2 + 2;
  if (errorX <= hitRadius) {
    autoTrainingEnabled = false;
    trainingPaused = false;
    setStatus('Objetivo alcanzado');
    setAIState('Objetivo alcanzado');
    setMode(fromAI ? 'IA' : 'Manual');
    showSuccessModal(angle, force, errorX);
    return;
  }

  if (fromAI && autoTrainingEnabled && !trainingPaused) {
    const next = await adjustLearning(
      errorX,
      noProgressCounter,
      attemptLog,
      currentTargetPosition,
      bestAngle,
      bestForce
    );

    noProgressCounter = next.newCounter;
    angleSlider.value = `${next.newAngle}`;
    forceSlider.value = `${next.newForce}`;
    syncManualOutputs();
    appendComment(`🔄 Próximo ajuste IA: ${next.newAngle}° / ${next.newForce}.`);

    window.setTimeout(() => {
      if (autoTrainingEnabled && !trainingPaused && !ballMoving) {
        launchShot(next.newAngle, next.newForce, { fromAI: true });
      }
    }, 450);
    setStatus('IA calculando siguiente tiro…');
  } else {
    setStatus('Listo para otro disparo');
    placeBallAtLauncher();
  }
}

function showSuccessModal(angle, force, errorX) {
  const modal = document.getElementById('successModal');
  document.getElementById('modalAttempts').textContent = `${attempts}`;
  document.getElementById('modalSummary').textContent = `Ángulo ${Math.round(angle)}°, fuerza ${Math.round(force)}, error ${Math.round(errorX)} px.`;
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('successModal').style.display = 'none';
  setStatus('Listo para continuar');
}

async function startAITraining() {
  if (ballMoving) return;

  await ensureAI();
  autoTrainingEnabled = true;
  trainingPaused = false;
  setMode('IA');
  setStatus('IA activa');
  setAIState(workerReady ? 'Aprendiendo' : 'Preparando');
  appendComment('🤖 Entrenamiento automático iniciado.');

  const seed = pickSeedShot();
  angleSlider.value = `${seed.angle}`;
  forceSlider.value = `${seed.force}`;
  syncManualOutputs();
  launchShot(seed.angle, seed.force, { fromAI: true });
}

function toggleAIPause() {
  if (!autoTrainingEnabled) {
    appendComment('ℹ️ Inicia la IA antes de pausarla.');
    return;
  }

  trainingPaused = !trainingPaused;
  pauseTrainingBtn.textContent = trainingPaused ? '▶️ Reanudar IA' : '⏯️ Pausar IA';
  setStatus(trainingPaused ? 'IA en pausa' : 'IA activa');
  setAIState(trainingPaused ? 'Pausada' : 'Aprendiendo');
  appendComment(trainingPaused ? '⏸️ IA pausada.' : '▶️ IA reanudada.');

  if (!trainingPaused && !ballMoving) {
    launchShot(Number(angleSlider.value), Number(forceSlider.value), { fromAI: true });
  }
}

function manualShot() {
  if (ballMoving) return;
  autoTrainingEnabled = false;
  trainingPaused = false;
  pauseTrainingBtn.textContent = '⏯️ Pausar IA';
  setMode('Manual');
  setStatus('Disparo manual');
  const angle = Number(angleSlider.value);
  const force = Number(forceSlider.value);
  appendComment(`🕹️ Disparo manual: ${angle}° / ${force}.`);
  launchShot(angle, force, { fromAI: false });
}

function relocateTargetOnly() {
  if (!terrain.length || ballMoving) return;
  relocateTarget(target, 'terrainContainer', windDisplay, terrain, ball);
  updateWindFromUI();
  updateTargetPositionLabel();
  placeBallAtLauncher();
  setStatus('Nuevo objetivo listo');
  appendComment('📍 Objetivo recolocado.');
}

async function clearTrainingAndReset() {
  autoTrainingEnabled = false;
  trainingPaused = false;
  pauseTrainingBtn.textContent = '⏯️ Pausar IA';
  setMode('Manual');
  setStatus('Reiniciando modelo…');
  setAIState('Limpiando');

  if (worker) {
    worker.terminate();
    worker = null;
    workerReady = false;
  }

  try {
    await clearModel();
    aiReady = false;
    await initNeuralNetwork();
    aiReady = true;
    resetRunData();
    setupScene();
    setAIState('Lista');
    appendComment('🗑️ Modelo borrado y sesión reiniciada.');
  } catch (error) {
    console.error(error);
    setAIState('Error');
    appendComment('⚠️ No se pudo borrar el modelo guardado.');
  }
}

function bindEvents() {
  window.addEventListener('resize', () => {
    resizeCanvases();
    placeBallAtLauncher();
  });

  toggleChart.addEventListener('change', () => {
    chartPanel.style.display = toggleChart.checked ? 'block' : 'none';
  });

  angleSlider.addEventListener('input', syncManualOutputs);
  forceSlider.addEventListener('input', syncManualOutputs);
  manualShotBtn.addEventListener('click', manualShot);
  startTrainingBtn.addEventListener('click', startAITraining);
  pauseTrainingBtn.addEventListener('click', toggleAIPause);
  newTargetBtn.addEventListener('click', relocateTargetOnly);
  clearTrainingBtn.addEventListener('click', clearTrainingAndReset);
}

async function boot() {
  initErrorChart();
  resetRunData();
  setupScene();
  syncManualOutputs();
  bindEvents();
  try {
    await initNeuralNetwork();
    aiReady = true;
    setAIState('Lista');
  } catch (error) {
    console.error(error);
    setAIState('Sin modelo');
    appendComment('⚠️ La IA se iniciará al crear un modelo nuevo.');
  }
}

window.closeModal = closeModal;
window.initGame = startAITraining;

document.addEventListener('DOMContentLoaded', boot);
