import { initTerrain, relocateTarget, setTargetAtX, currentTargetPosition, getTerrainHeight, RESOLUTION } from './terrain.js';
import { initNeuralNetwork, adjustLearning, clearModel, ANGLE_MIN, ANGLE_MAX, FORCE_MIN, FORCE_MAX } from './ai.js';
import { initErrorChart, updateErrorChart, clearErrorChart } from './errorChart.js';

const gameContainer = document.querySelector('.game-container');
const terrainContainer = document.getElementById('terrainContainer');
const target = document.getElementById('target');
const launcher = document.getElementById('launcher');
const launcherBarrel = document.getElementById('launcherBarrel');
const aimLine = document.getElementById('aimLine');
const impactPulse = document.getElementById('impactPulse');
const trailCanvas = document.getElementById('trailCanvas');
const trailCtx = trailCanvas.getContext('2d');

const projectiles = {
  user: document.getElementById('ballUser'),
  ai: document.getElementById('ballAI')
};

const attemptsDisplay = document.getElementById('attempts');
const userAttemptsDisplay = document.getElementById('userAttempts');
const aiAttemptsDisplay = document.getElementById('aiAttempts');
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

const angleSlider = document.getElementById('angleSlider');
const forceSlider = document.getElementById('forceSlider');
const angleSliderValue = document.getElementById('angleSliderValue');
const forceSliderValue = document.getElementById('forceSliderValue');

const manualShotBtn = document.getElementById('manual-shot-btn');
const startTrainingBtn = document.getElementById('start-training-btn');
const pauseTrainingBtn = document.getElementById('pause-training-btn');
const newTargetBtn = document.getElementById('new-target-btn');
const newTerrainBtn = document.getElementById('new-terrain-btn');
const clearTrainingBtn = document.getElementById('clear-training');

const START_X = 12;
const AI_RETRY_DELAY = 420;
const seedShots = [
  { angle: 18, force: 14 },
  { angle: 30, force: 22 },
  { angle: 42, force: 28 },
  { angle: 58, force: 38 },
  { angle: 74, force: 48 }
];
const trailColors = {
  user: 'rgba(255, 140, 140, 0.52)',
  ai: 'rgba(160, 160, 160, 0.58)'
};
const impactColors = {
  user: 'rgba(255, 140, 140, 0.95)',
  ai: 'rgba(170, 170, 170, 0.95)'
};

let terrain = [];
let attemptLog = [];
let totalAttempts = 0;
let userAttempts = 0;
let aiAttempts = 0;
let bestDistance = Infinity;
let bestAngle = 45;
let bestForce = 24;
let wind = 0;
let bestAttempts = [];
let noProgressCounter = 0;
let autoTrainingEnabled = false;
let trainingPaused = false;
let worker = null;
let workerReady = false;
let aiReady = false;
let sceneVersion = 0;
let nextAIShotTimeout = null;
let successCountdownInterval = null;
let successAutoPauseTimeout = null;
let aiControlAngle = 45;
let aiControlForce = 24;
const activeShots = { user: null, ai: null };

const aiFunny = {
  start: [
    '🤖 Modo superentreno activado. Hoy no vengo a fallar… demasiado.',
    '🤖 La IA se ha tomado un café virtual. Allá voy.',
    '🤖 Activando puntería premium de mercadillo.'
  ],
  adjust: [
    '🤖 Giro de tuerca: {angle}° y empujón {force}.',
    '🤖 Recalculando con estilo: {angle}° / {force}.',
    '🤖 Mi intuición de tostadora dice {angle}° y fuerza {force}.'
  ],
  best: [
    '🤖 ¡Ojo! Me acerco más que el GPS del futuro: error {error}px.',
    '🤖 Eso ya huele a diana: solo {error}px de error.',
    '🤖 ¡Ja! Ajuste fino del bueno: {error}px.'
  ],
  miss: [
    '🤖 He fallado, sí, pero con mucha personalidad: {error}px.',
    '🤖 No era la diana. Era un saludo táctico a {error}px.',
    '🤖 Bueno… casi. En mi defensa, la física estaba mirando.'
  ],
  hit: [
    '🤖 ¡Toma diana! Dadme una medalla y una batería nueva.',
    '🤖 ¡Objetivo alcanzado! Soy peligroso incluso en modo pruebas.',
    '🤖 ¡Pam! Centro aproximado certificado por la IA.'
  ],
  workerReady: [
    '🧠 Worker listo para entrenar en segundo plano.',
    '🧠 El mini-cerebro auxiliar ya está calentando GPU imaginaria.'
  ],
  workerDone: [
    '✅ La IA ha refinado el modelo en segundo plano.',
    '✅ Entrenamiento completado. Ahora fallo con más elegancia.'
  ]
};

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function funnyAI(kind, values = {}) {
  let message = pickRandom(aiFunny[kind] || ['🤖 Bip bop.']);
  for (const [key, value] of Object.entries(values)) {
    message = message.replaceAll(`{${key}}`, value);
  }
  return message;
}

function clearSuccessTimers() {
  if (successCountdownInterval) {
    clearInterval(successCountdownInterval);
    successCountdownInterval = null;
  }
  if (successAutoPauseTimeout) {
    clearTimeout(successAutoPauseTimeout);
    successAutoPauseTimeout = null;
  }
}

function validateDOM() {
  const required = [
    ['gameContainer', gameContainer],
    ['terrainContainer', terrainContainer],
    ['target', target],
    ['launcher', launcher],
    ['launcherBarrel', launcherBarrel],
    ['aimLine', aimLine],
    ['impactPulse', impactPulse],
    ['trailCanvas', trailCanvas],
    ['ballUser', projectiles.user],
    ['ballAI', projectiles.ai],
    ['attempts', attemptsDisplay],
    ['userAttempts', userAttemptsDisplay],
    ['aiAttempts', aiAttemptsDisplay],
    ['bestDistance', bestDistanceDisplay],
    ['angleValue', angleDisplay],
    ['forceValue', forceDisplay],
    ['distanceThrown', distanceDisplay],
    ['errorValue', errorDisplay],
    ['windSpeed', windDisplay],
    ['targetPosValue', targetPosValue],
    ['bestShotValue', bestShotValue],
    ['modeValue', modeValue],
    ['aiStateValue', aiStateValue],
    ['trainingStatus', trainingStatus],
    ['commentBox', commentBox],
    ['angleSlider', angleSlider],
    ['forceSlider', forceSlider],
    ['angleSliderValue', angleSliderValue],
    ['forceSliderValue', forceSliderValue],
    ['manual-shot-btn', manualShotBtn],
    ['start-training-btn', startTrainingBtn],
    ['pause-training-btn', pauseTrainingBtn],
    ['new-target-btn', newTargetBtn],
    ['new-terrain-btn', newTerrainBtn],
    ['clear-training', clearTrainingBtn]
  ];
  const missing = required.filter(([, el]) => !el).map(([name]) => name);
  if (missing.length) {
    throw new Error(`Faltan elementos del DOM: ${missing.join(', ')}`);
  }
}

function appendComment(message) {
  const p = document.createElement('p');
  p.textContent = message;
  commentBox.appendChild(p);
  while (commentBox.childNodes.length > 8) {
    commentBox.removeChild(commentBox.firstChild);
  }
  commentBox.scrollTop = commentBox.scrollHeight;
  console.log(message);
}

function setStatus(text) {
  trainingStatus.textContent = text;
}

function setAIState(text) {
  aiStateValue.textContent = text;
}

function updateModeLabel() {
  if (autoTrainingEnabled && (activeShots.ai || activeShots.user)) {
    modeValue.textContent = 'Simultáneo';
  } else if (autoTrainingEnabled) {
    modeValue.textContent = 'Mixto';
  } else {
    modeValue.textContent = 'Manual';
  }
}

function resizeCanvases() {
  trailCanvas.width = gameContainer.clientWidth;
  trailCanvas.height = gameContainer.clientHeight;
  drawLauncherAndAim(Number(angleSlider.value));
}

function cancelScheduledAI() {
  if (nextAIShotTimeout) {
    clearTimeout(nextAIShotTimeout);
    nextAIShotTimeout = null;
  }
}

function isAnyShotActive() {
  return Boolean(activeShots.user || activeShots.ai);
}

function resetRunData({ preserveLogMessage = false } = {}) {
  clearSuccessTimers();
  attemptLog = [];
  totalAttempts = 0;
  userAttempts = 0;
  aiAttempts = 0;
  bestDistance = Infinity;
  bestAngle = Number(angleSlider.value || 45);
  bestForce = Number(forceSlider.value || 24);
  aiControlAngle = bestAngle;
  aiControlForce = bestForce;
  bestAttempts = [];
  noProgressCounter = 0;
  attemptsDisplay.textContent = '0';
  userAttemptsDisplay.textContent = '0';
  aiAttemptsDisplay.textContent = '0';
  bestDistanceDisplay.textContent = '0 px';
  bestShotValue.textContent = '—';
  distanceDisplay.textContent = '0 px';
  errorDisplay.textContent = '0 px';
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  clearErrorChart();
  if (!preserveLogMessage) {
    commentBox.innerHTML = '<p>Escena lista. Puedes disparar tú mientras la IA sigue entrenando.</p>';
  }
}

function syncManualOutputs() {
  angleSliderValue.textContent = `${angleSlider.value}°`;
  forceSliderValue.textContent = `${forceSlider.value}`;
  angleDisplay.textContent = `${angleSlider.value}°`;
  forceDisplay.textContent = `${forceSlider.value}`;
  drawLauncherAndAim(Number(angleSlider.value));
}

function getStartPosition(shooter) {
  const launchY = terrain.length ? getTerrainHeight(START_X, terrain, RESOLUTION) : 0;
  const offset = shooter === 'user'
    ? { x: 10, y: 8 }
    : { x: 16, y: 16 };
  return { x: START_X + offset.x, y: launchY + offset.y };
}

function drawLauncherAndAim(angle) {
  if (!terrain.length) return;
  const groundY = getTerrainHeight(START_X, terrain, RESOLUTION);
  launcher.style.left = '8px';
  launcher.style.bottom = `${groundY}px`;
  launcherBarrel.style.transform = `rotate(${-angle}deg)`;

  const originX = 30;
  const originY = groundY + 18;
  aimLine.style.left = `${originX}px`;
  aimLine.style.bottom = `${originY}px`;
  aimLine.style.width = '128px';
  aimLine.style.transform = `rotate(${-angle}deg)`;
}

function placeProjectileAtLauncher(shooter) {
  if (!terrain.length) return;
  const projectile = projectiles[shooter];
  const start = getStartPosition(shooter);
  projectile.style.left = `${start.x}px`;
  projectile.style.bottom = `${start.y}px`;
  projectile.style.display = 'block';
}

function placeProjectilesAtLauncher() {
  placeProjectileAtLauncher('user');
  placeProjectileAtLauncher('ai');
  target.style.display = 'block';
  drawLauncherAndAim(Number(angleSlider.value));
}

function updateWindFromUI() {
  wind = Number(windDisplay.textContent) || 0;
}

function updateTargetPositionLabel() {
  targetPosValue.textContent = Number.isFinite(currentTargetPosition) ? `${Math.round(currentTargetPosition)} px` : '—';
}

function showImpactPulse(x, y, shooter) {
  impactPulse.style.left = `${x}px`;
  impactPulse.style.bottom = `${y}px`;
  impactPulse.style.borderColor = impactColors[shooter];
  impactPulse.classList.remove('visible');
  void impactPulse.offsetWidth;
  impactPulse.classList.add('visible');
}

function setupScene() {
  resizeCanvases();
  terrain = initTerrain('terrainContainer', projectiles.user, target, windDisplay);
  projectiles.ai.style.display = 'block';
  updateWindFromUI();
  updateTargetPositionLabel();
  placeProjectilesAtLauncher();
  updateModeLabel();
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
        appendComment(funnyAI('workerReady'));
      } else if (data.cmd === 'trained') {
        setAIState('Modelo actualizado');
        if (!data.skipped) appendComment(funnyAI('workerDone'));
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
      angle: Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, Math.round(avgAngle + (Math.random() * 8 - 4)))),
      force: Math.max(FORCE_MIN, Math.min(FORCE_MAX, Math.round(avgForce + (Math.random() * 10 - 5))))
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
    const tag = best.source === 'ai' ? 'IA' : 'Tú';
    bestShotValue.textContent = `${tag}: ${Math.round(best.angle)}° / ${Math.round(best.force)}`;
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

function stopAllShots() {
  sceneVersion += 1;
  activeShots.user = null;
  activeShots.ai = null;
  cancelScheduledAI();
}

function queueNextAIShot(delay = AI_RETRY_DELAY) {
  cancelScheduledAI();
  nextAIShotTimeout = window.setTimeout(async () => {
    nextAIShotTimeout = null;
    if (!autoTrainingEnabled || trainingPaused || activeShots.ai) return;
    const referenceError = Number.isFinite(bestDistance) ? bestDistance : 400;
    const next = await adjustLearning(
      referenceError,
      noProgressCounter,
      attemptLog,
      currentTargetPosition,
      bestAngle,
      bestForce
    );
    noProgressCounter = next.newCounter;
    aiControlAngle = next.newAngle;
    aiControlForce = next.newForce;
    appendComment(funnyAI('adjust', { angle: next.newAngle, force: next.newForce }));
    launchShot(aiControlAngle, aiControlForce, { shooter: 'ai' });
  }, delay);
}

function launchShot(angle, force, { shooter = 'user' } = {}) {
  if (!terrain.length || activeShots[shooter]) return false;

  const projectile = projectiles[shooter];
  const start = getStartPosition(shooter);
  const shotSceneVersion = sceneVersion;
  const radians = angle * Math.PI / 180;

  const shot = {
    shooter,
    angle,
    force,
    x: start.x,
    y: start.y,
    vx: force * Math.cos(radians) + wind,
    vy: force * Math.sin(radians),
    startedAt: performance.now(),
    sceneVersion: shotSceneVersion
  };

  activeShots[shooter] = shot;
  projectile.style.display = 'block';
  projectile.style.left = `${shot.x}px`;
  projectile.style.bottom = `${shot.y}px`;
  updateModeLabel();
  setStatus(shooter === 'ai' ? 'IA disparando…' : 'Disparo manual en curso…');

  const gravity = -9.81;
  const dt = 0.16;

  const step = () => {
    if (!activeShots[shooter] || activeShots[shooter] !== shot || shot.sceneVersion !== sceneVersion) return;

    if (document.hidden) {
      requestAnimationFrame(step);
      return;
    }

    shot.x += shot.vx;
    shot.y += shot.vy;
    shot.vy += gravity * dt;

    const clampedX = Math.max(0, Math.min(shot.x, gameContainer.clientWidth - 1));
    const terrainHeight = getTerrainHeight(clampedX, terrain, RESOLUTION);
    const outOfBounds = shot.x > gameContainer.clientWidth + 20 || shot.x < -20 || shot.y < -30;

    if (outOfBounds || shot.y <= terrainHeight) {
      shot.y = Math.max(terrainHeight, shot.y);
      projectile.style.left = `${Math.max(0, shot.x)}px`;
      projectile.style.bottom = `${Math.max(0, shot.y)}px`;
      trailCtx.fillStyle = trailColors[shooter];
      trailCtx.fillRect(Math.max(0, shot.x), trailCanvas.height - Math.max(0, shot.y), 3, 3);
      activeShots[shooter] = null;
      showImpactPulse(Math.max(0, shot.x), Math.max(0, shot.y), shooter);
      evaluateThrow(Math.max(0, shot.x), angle, force, shooter).catch(error => {
        console.error(error);
        appendComment('⚠️ Error al evaluar el disparo.');
      });
      return;
    }

    projectile.style.left = `${shot.x}px`;
    projectile.style.bottom = `${shot.y}px`;
    trailCtx.fillStyle = trailColors[shooter];
    trailCtx.fillRect(shot.x, trailCanvas.height - shot.y, 2.6, 2.6);

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
  return true;
}

async function evaluateThrow(distance, angle, force, shooter) {
  const errorX = Math.abs(currentTargetPosition - distance);
  const fromAI = shooter === 'ai';

  totalAttempts += 1;
  attemptsDisplay.textContent = `${totalAttempts}`;
  if (fromAI) {
    aiAttempts += 1;
    aiAttemptsDisplay.textContent = `${aiAttempts}`;
  } else {
    userAttempts += 1;
    userAttemptsDisplay.textContent = `${userAttempts}`;
  }

  updateShotDisplays(angle, force, distance, errorX);

  const shot = {
    source: shooter,
    angle,
    force,
    distance,
    errorX,
    targetPosition: currentTargetPosition,
    bestAngle,
    bestForce
  };
  attemptLog.push(shot);
  updateErrorChart(errorX, totalAttempts, shooter);

  if (errorX < bestDistance) {
    bestDistance = errorX;
    bestAngle = angle;
    bestForce = force;
    bestAttempts.push({ source: shooter, angle, force, errorX });
    if (bestAttempts.length > 10) bestAttempts.shift();
    appendComment(fromAI
      ? funnyAI('best', { error: Math.round(errorX) })
      : `🎯 Tú mejoras el récord: error ${Math.round(errorX)} px.`);
  } else {
    noProgressCounter += 1;
    appendComment(fromAI
      ? funnyAI('miss', { error: Math.round(errorX) })
      : `🕹️ Tu disparo deja un error de ${Math.round(errorX)} px.`);
  }

  updateBestDisplays();
  updateModeLabel();
  sendTrainingBatch();
  placeProjectileAtLauncher(shooter);

  const hitRadius = target.clientWidth / 2 + 2;
  if (errorX <= hitRadius) {
    setStatus('Objetivo alcanzado');
    setAIState(fromAI ? 'La IA acertó' : '¡Diana!');
    updateModeLabel();
    if (fromAI) {
      appendComment(funnyAI('hit'));
    } else {
      appendComment('🏆 ¡Diana! Tu disparo ha clavado el objetivo.');
    }
    showSuccessModal(angle, force, errorX, shooter);
    if (autoTrainingEnabled && !trainingPaused) {
      setStatus('Superentreno activo durante 15 s…');
      queueNextAIShot(120);
    }
    return;
  }

  if (fromAI && autoTrainingEnabled && !trainingPaused) {
    setStatus('IA calculando siguiente tiro…');
    queueNextAIShot();
  } else if (!isAnyShotActive()) {
    setStatus('Listo para otro disparo');
  }
}

function showSuccessModal(angle, force, errorX, shooter) {
  clearSuccessTimers();
  const modal = document.getElementById('successModal');
  const countdownEl = document.getElementById('modalCountdown');
  document.getElementById('modalAttempts').textContent = `${totalAttempts}`;
  document.getElementById('modalSummary').textContent = `${shooter === 'ai' ? 'La IA' : 'Tu disparo'} acertó con ${Math.round(angle)}°, fuerza ${Math.round(force)} y error ${Math.round(errorX)} px.`;
  modal.style.display = 'flex';

  if (autoTrainingEnabled && !trainingPaused) {
    let remaining = 15;
    countdownEl.textContent = `⏳ Superentreno en curso. La IA seguirá 15 s y luego se pausará sola.`;
    successCountdownInterval = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        countdownEl.textContent = `⏳ Superentreno en curso. Pausa automática en ${remaining} s.`;
      }
    }, 1000);

    successAutoPauseTimeout = window.setTimeout(() => {
      clearSuccessTimers();
      trainingPaused = true;
      pauseTrainingBtn.textContent = '▶️ Reanudar IA';
      setStatus('IA pausada tras superentreno');
      setAIState('Pausada');
      appendComment('⏸️ La IA se ha pausado sola tras 15 s extra de entrenamiento.');
      countdownEl.textContent = '⏸️ La IA se ha pausado automáticamente. Puedes cerrarlo o reanudarla.';
    }, 15000);
  } else {
    countdownEl.textContent = 'Puedes cerrar esta ventana y seguir jugando.';
  }
}

function closeModal() {
  document.getElementById('successModal').style.display = 'none';
  setStatus(trainingPaused ? 'IA en pausa' : 'Listo para continuar');
}

async function startAITraining() {
  await ensureAI();
  clearSuccessTimers();
  autoTrainingEnabled = true;
  trainingPaused = false;
  pauseTrainingBtn.textContent = '⏯️ Pausar IA';
  updateModeLabel();
  setStatus('IA activa');
  setAIState(workerReady ? 'Aprendiendo' : 'Preparando');
  appendComment(funnyAI('start'));

  if (!activeShots.ai) {
    const seed = pickSeedShot();
    aiControlAngle = seed.angle;
    aiControlForce = seed.force;
    launchShot(aiControlAngle, aiControlForce, { shooter: 'ai' });
  }
}

function toggleAIPause() {
  if (!autoTrainingEnabled) {
    appendComment('ℹ️ Inicia la IA antes de pausarla.');
    return;
  }

  trainingPaused = !trainingPaused;
  clearSuccessTimers();
  pauseTrainingBtn.textContent = trainingPaused ? '▶️ Reanudar IA' : '⏯️ Pausar IA';
  setStatus(trainingPaused ? 'IA en pausa' : 'IA activa');
  setAIState(trainingPaused ? 'Pausada' : 'Aprendiendo');
  appendComment(trainingPaused ? '⏸️ IA pausada.' : '▶️ IA reanudada.');

  if (!trainingPaused && !activeShots.ai) {
    queueNextAIShot(80);
  }
}

function manualShot() {
  if (activeShots.user) {
    appendComment('⌛ Tu proyectil sigue en el aire.');
    return;
  }
  const angle = Number(angleSlider.value);
  const force = Number(forceSlider.value);
  appendComment(`🕹️ Disparo manual: ${angle}° / ${force}.`);
  launchShot(angle, force, { shooter: 'user' });
}

function prepareNewChallenge() {
  stopAllShots();
  resetRunData({ preserveLogMessage: true });
  placeProjectilesAtLauncher();
}

function randomizeTarget() {
  clearSuccessTimers();
  prepareNewChallenge();
  relocateTarget(target, 'terrainContainer', windDisplay, terrain);
  updateWindFromUI();
  updateTargetPositionLabel();
  appendComment('📍 Objetivo recolocado.');
  setStatus('Nuevo objetivo listo');
  if (autoTrainingEnabled && !trainingPaused) queueNextAIShot(150);
}

function placeTargetByClick(event) {
  if (!terrain.length) return;
  clearSuccessTimers();
  const rect = terrainContainer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  prepareNewChallenge();
  setTargetAtX(target, 'terrainContainer', x, terrain);
  updateTargetPositionLabel();
  appendComment(`🎯 Objetivo movido manualmente a X=${Math.round(currentTargetPosition)}.`);
  setStatus('Objetivo recolocado a mano');
  if (autoTrainingEnabled && !trainingPaused) queueNextAIShot(150);
}

function randomizeTerrain() {
  clearSuccessTimers();
  stopAllShots();
  resetRunData({ preserveLogMessage: true });
  setupScene();
  appendComment('⛰️ Terreno regenerado sin recargar la página.');
  if (autoTrainingEnabled && !trainingPaused) queueNextAIShot(180);
}

async function clearTrainingAndReset() {
  clearSuccessTimers();
  autoTrainingEnabled = false;
  trainingPaused = false;
  pauseTrainingBtn.textContent = '⏯️ Pausar IA';
  updateModeLabel();
  setStatus('Reiniciando modelo…');
  setAIState('Limpiando');
  stopAllShots();

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

function togglePanel(button) {
  const panel = button.closest('.hud-box');
  if (!panel) return;
  panel.classList.toggle('collapsed');
  const collapsed = panel.classList.contains('collapsed');
  if (panel.id === 'chartPanel') {
    panel.style.height = collapsed ? 'auto' : '';
  }
  button.textContent = collapsed ? '＋' : '−';
  button.setAttribute('aria-expanded', String(!collapsed));
  window.setTimeout(() => window.dispatchEvent(new Event('resize')), 20);
}

function bindEvents() {
  window.addEventListener('resize', () => {
    resizeCanvases();
    placeProjectilesAtLauncher();
  });

  angleSlider.min = `${ANGLE_MIN}`;
  angleSlider.max = `${ANGLE_MAX}`;
  forceSlider.min = `${FORCE_MIN}`;
  forceSlider.max = `${FORCE_MAX}`;

  angleSlider.addEventListener('input', syncManualOutputs);
  forceSlider.addEventListener('input', syncManualOutputs);
  manualShotBtn.addEventListener('click', manualShot);
  startTrainingBtn.addEventListener('click', startAITraining);
  pauseTrainingBtn.addEventListener('click', toggleAIPause);
  newTargetBtn.addEventListener('click', randomizeTarget);
  newTerrainBtn.addEventListener('click', randomizeTerrain);
  clearTrainingBtn.addEventListener('click', clearTrainingAndReset);
  terrainContainer.addEventListener('click', placeTargetByClick);

  document.querySelectorAll('.panel-toggle').forEach(button => {
    button.addEventListener('click', () => togglePanel(button));
  });
}

async function boot() {
  validateDOM();
  angleSlider.value = String(Math.max(45, ANGLE_MIN));
  forceSlider.value = String(Math.max(24, FORCE_MIN));
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
