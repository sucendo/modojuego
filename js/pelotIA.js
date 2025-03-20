const gameContainer = document.querySelector(".game-container");
const ball = document.getElementById("ball");
const target = document.getElementById("target");
const terrainCanvas = document.getElementById("terrainCanvas");
const ctx = terrainCanvas.getContext("2d");
const attemptsDisplay = document.getElementById("attempts");
const bestDistanceDisplay = document.getElementById("bestDistance");
const windDisplay = document.getElementById("windSpeed");
const angleDisplay = document.getElementById("angleValue");
const forceDisplay = document.getElementById("forceValue");
const distanceDisplay = document.getElementById("distanceThrown");
const errorDisplay = document.getElementById("errorValue");

let attempts = 0;
let bestDistance = 0;
let bestAngle = 45;
let bestForce = 20;
let wind = generateWind();
let targetPosition = randomTargetPosition();
let lastError = null; 
let terrain = [];
// 📌 Variables para almacenar el mejor intento
let bestForceEver = bestForce;
let bestAngleEver = bestAngle;

let runningInBackground = true;
let ballMoving = false; // 📌 Evita que se generen múltiples pelotas

let attemptLog = []; // 📌 Historial de intentos con errores
let bestAttempts = [];
let noProgressCounter = 0; // 📌 Contador de intentos sin mejora
let forceDirection = 1; // 📌 Dirección de ajuste de la fuerza
let angleDirection = 1; // 📌 Dirección de ajuste del ángulo

target.style.left = targetPosition + "px";
windDisplay.textContent = wind.toFixed(2);
let previousAttempts = [];

const inputs = attemptLog.map(d => [
	normalize(d.angle, 10, 80),
	normalize(d.force, 5, 40),
	normalize(d.errorX, 0, 2000),  // 📌 Le enseñamos el error en cada intento
	normalize(bestDistance, 0, 2000) // 📌 Le damos el mejor intento como referencia
]);

const outputs = attemptLog.map(d => [
	normalize(d.angle, 10, 80),
	normalize(d.force, 5, 40)
]);			

// 📌 Normaliza valores entre 0 y 1
function normalize(value, min, max) {
	return (value - min) / (max - min);
}

// 📌 Desnormaliza para recuperar valores reales
function denormalize(value, min, max) {
	return (value * (max - min)) + min;
}

const commentBox = document.getElementById("commentBox");

// 📌 `updateComment` incluye CONSOLE.LOG
function updateComment(newComment) {
	console.log(`📢 ${newComment}`);

	// 📌 Agregar nuevos comentarios en una lista, en lugar de borrar el anterior
	let newMessage = document.createElement("p");
	newMessage.textContent = newComment;

	commentBox.appendChild(newMessage);

	// 📌 Limitar el historial a los últimos 5 mensajes
	while (commentBox.childNodes.length > 5) {
		commentBox.removeChild(commentBox.firstChild);
	}
}

// 📌 Generador del viento
function generateWind() {
	return Math.random() * 4 - 2; 
}

// 📌 Generador de ruido con mejor interpolación
function smoothNoise(x) {
    return (
        Math.sin(x * 0.003) * 50 +
        Math.cos(x * 0.002) * 40 +
        Math.sin(x * 0.007) * 25
    ) / 3;
}

function drawTerrain() {
    terrainCanvas.width = window.innerWidth;
    terrainCanvas.height = window.innerHeight;

    ctx.clearRect(0, 0, terrainCanvas.width, terrainCanvas.height);
    terrain = [];

    let numMountains = Math.floor(Math.random() * 4) + 3;
    let mountainSpacing = terrainCanvas.width / numMountains;
    let baseHeight = Math.random() * 80 + 40;
    let maxMountainHeight = terrainCanvas.height * 0.4;

    let createBigMountain = Math.random() < 0.3;
    let bigMountainX = createBigMountain ? Math.random() * (terrainCanvas.width - 300) + 150 : -1;

    let smoothedHeights = [];

    ctx.fillStyle = "green";
    ctx.beginPath();

    for (let i = 0; i < terrainCanvas.width; i += 10) {
        let height;

        if (i < 150) {
            height = baseHeight + Math.sin(i * 0.02) * 10;
        } else {
            let mountainIndex = Math.floor(i / mountainSpacing);
            let mountainHeight = Math.random() * maxMountainHeight;

            let prevHeight = terrain.length > 0 ? terrain[terrain.length - 1] : baseHeight;
            let nextHeight = Math.min(smoothNoise(i + mountainIndex * 10) + mountainHeight, maxMountainHeight);

            height = (prevHeight * 0.75) + (nextHeight * 0.25);

            if (createBigMountain && Math.abs(i - bigMountainX) < 100) {
                height = Math.min(height + 120 + Math.random() * 100, maxMountainHeight);
            }
        }

        smoothedHeights.push(height);
    }

    // 🔹 Suavizado extra con media móvil
    for (let i = 1; i < smoothedHeights.length - 1; i++) {
        terrain[i] = (smoothedHeights[i - 1] + smoothedHeights[i] + smoothedHeights[i + 1]) / 3;
    }

    ctx.moveTo(0, terrainCanvas.height - terrain[0]);

    for (let i = 1; i < terrain.length - 1; i++) {
        let midX = i * 10;
        let midY = terrain[i];
        let cpX = (i - 1) * 10 + 5;
        let cpY = (terrain[i - 1] + terrain[i]) / 2;

        ctx.quadraticCurveTo(cpX, terrainCanvas.height - cpY, midX, terrainCanvas.height - midY);
    }

    ctx.lineTo(terrainCanvas.width, terrainCanvas.height);
    ctx.lineTo(0, terrainCanvas.height);
    ctx.closePath();
    ctx.fill();

    // 🔹 Línea oscura para resaltar la superficie del terreno
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, terrainCanvas.height - terrain[0]);

    for (let i = 1; i < terrain.length - 1; i++) {
        let midX = i * 10;
        let midY = terrain[i];
        let cpX = (i - 1) * 10 + 5;
        let cpY = (terrain[i - 1] + terrain[i]) / 2;

        ctx.quadraticCurveTo(cpX, terrainCanvas.height - cpY, midX, terrainCanvas.height - midY);
    }

    ctx.stroke();
}

// 📌 Obtener la altura del terreno en una posición específica
function getTerrainHeight(x) {
    let index = Math.floor(x / 10);
    if (index < 0 || index >= terrain.length) return 50; 
    return terrain[index];
}

// 📌 Ajustar la posición del objetivo correctamente sobre la superficie
function relocateTarget() {
    document.querySelectorAll(".trail").forEach(el => el.remove());

    let attempts = 0;
    let maxAttempts = 50; 
    let validPositionFound = false;
    let terrainHeight = 0; 

    while (attempts < maxAttempts) {
        targetPosition = randomTargetPosition();
        terrainHeight = getTerrainHeight(targetPosition) || 50;

        if (terrainHeight < terrainCanvas.height * 0.6 && terrainHeight > 40) {
            validPositionFound = true;
            break;
        }

        attempts++;
    }

    if (!validPositionFound) {
        console.error("🚨 No se encontró una posición válida para el objetivo después de 50 intentos.");
        return;
    }

    wind = generateWind();
    windDisplay.textContent = wind.toFixed(2);
    drawTerrain();

    // 📌 Ajustar la posición sobre la superficie del terreno
    let adjustedHeight = terrainHeight + 10; 
    target.style.left = `${targetPosition}px`;
    target.style.bottom = `${adjustedHeight}px`;

    // 📌 Asegurar que la pelota se coloque en un punto dinámico del terreno
    adjustLaunchPosition();
}

// 📌 Ajustar la posición de lanzamiento en función del terreno
function adjustLaunchPosition() {
    let launchX = 10;
    let launchHeight = getTerrainHeight(launchX) + Math.random() * 20; 

    ball.style.left = `${launchX}px`;
    ball.style.bottom = `${launchHeight}px`;
}

// 📌 Generar una posición aleatoria para el objetivo
function randomTargetPosition() {
    let minDist = 200;
    let maxDist = terrainCanvas.width - minDist;
    return Math.random() * (maxDist - minDist) + minDist;
}

// 📌 Llamar a `drawTerrain` y ajustar la posición de lanzamiento
window.onload = function () {
    drawTerrain();
    adjustLaunchPosition();
};

// 📌 Redibujar el terreno si cambia el tamaño de la ventana
window.addEventListener("resize", function () {
    drawTerrain();
    adjustLaunchPosition();
});

// 📌 Función de lanzamiento de la pelota con control de instancia única
function throwBall(angle, force) {
	if (ballMoving) return; // 📌 Si la pelota ya está en movimiento, no lanzar otra
	ballMoving = true;

	let x = 10;
	let y = getTerrainHeight(x);
	let vx = force * Math.cos(angle * Math.PI / 180) + wind;
	let vy = force * Math.sin(angle * Math.PI / 180);
	let gravity = -9.81;
	let elasticity = 0;

	function updateBall() {
		if (document.hidden) {
			// 📌 Si la pestaña está oculta, ejecuta en segundo plano con menos frecuencia
			setTimeout(updateBall, 50);
			return;
		}

		x += vx;
		y += vy;
		vy += gravity * 0.05;

		let terrainHeight = getTerrainHeight(x);

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

// 📌 Inicializar TensorFlow.js
let model;

// 📌 Función para inicializar la red neuronal
async function initNeuralNetwork() {
try {
	model = await tf.loadLayersModel('localstorage://my-trained-model');
	console.log("📡 Modelo cargado desde localStorage.");
	
	// 📌 COMPILAR EL MODELO EN SEGUNDO PLANO PARA NO BLOQUEAR
	setTimeout(() => {
		model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
		console.log("✅ Modelo compilado.");
	}, 100); // 🔹 Retrasamos la compilación para no frenar el juego

} catch (error) {
	console.warn("⚠️ No se encontró un modelo entrenado. Creando uno nuevo...");

	model = tf.sequential();
	model.add(tf.layers.dense({ inputShape: [3], units: 64, activation: 'relu' }));
	model.add(tf.layers.dense({ units: 32, activation: 'tanh' }));
	model.add(tf.layers.dense({ units: 2, activation: 'sigmoid' }));

	model.compile({ optimizer: tf.train.adam(0.005), loss: 'meanSquaredError' });

	console.log("📡 Red Neuronal Inicializada...");
}
}

// 📌 Guardar el modelo en localStorage
async function saveModel() {
	try {
		console.log("💾 Guardando modelo en localStorage...");
		localStorage.removeItem('tensorflowjs_models/my-trained-model'); // 📌 Elimina la versión anterior
		await model.save('localstorage://my-trained-model');
		console.log("✅ Modelo guardado en localStorage.");
	} catch (error) {
		console.error("❌ Error al guardar el modelo:", error);
	}
}

async function saveModelIfBetter() {
	try {
		let previousModel = await tf.loadLayersModel('localstorage://my-trained-model');
		let previousLoss = await previousModel.evaluate(xs, ys).data();
		let newLoss = await model.evaluate(xs, ys).data();

		if (newLoss[0] < previousLoss[0]) {
			await model.save('localstorage://my-trained-model');
			console.log("✅ Nuevo modelo guardado (mejor rendimiento).");
		} else {
			console.log("⚠️ Modelo actual no mejora, se mantiene el anterior.");
		}
	} catch (error) {
		await model.save('localstorage://my-trained-model');
		console.log("✅ Modelo guardado por primera vez.");
	}
}

// Guardar contador de progreso
function saveNoProgressCounter() {
	localStorage.setItem('noProgressCounter', noProgressCounter);
}

// Cargar el contador si existe
function loadNoProgressCounter() {
	noProgressCounter = parseInt(localStorage.getItem('noProgressCounter')) || 0;
}

// Llamar a esta función al inicio
loadNoProgressCounter();

// Función para borrar el modelo anterior - en la consola: clearModel();
async function clearModel() {
	try {
		indexedDB.deleteDatabase('tensorflowjs'); // 📌 Elimina por completo los datos de tf.js
		localStorage.removeItem('tensorflowjs_models/my-trained-model');
		console.log("🗑️ Modelo eliminado correctamente. Recarga la página.");
		setTimeout(() => location.reload(), 1000); // 📌 Recargar página tras borrar
	} catch (error) {
		console.error("❌ Error al eliminar el modelo:", error);
	}
}

window.clearModel = clearModel; // 📌 Hacer accesible la función desde la consola

function loadPreviousData() {
	let savedBestAttempts = localStorage.getItem("bestAttempts");
	let savedAttemptLog = localStorage.getItem("attemptLog");

	if (savedBestAttempts && savedBestAttempts !== "undefined") {
		bestAttempts = JSON.parse(savedBestAttempts);
	} else {
		bestAttempts = [];
	}

	if (savedAttemptLog && savedAttemptLog !== "undefined") {
		attemptLog = JSON.parse(savedAttemptLog);
	} else {
		attemptLog = [];
	}

	console.log("🔄 Datos cargados desde localStorage:", { bestAttempts, attemptLog });
}

window.addEventListener("beforeunload", function () {
	localStorage.setItem("bestAttempts", JSON.stringify(bestAttempts));
	localStorage.setItem("attemptLog", JSON.stringify(attemptLog));
});

let isTraining = false; // 📌 Controla si la IA está entrenando

// 📌 Función para entrenar la red neuronal de manera optimizada
async function trainModel() {
	if (isTraining) return;
	isTraining = true;

	if (attemptLog.length < 10) {
		console.warn("⚠️ No hay suficientes intentos para entrenar.");
		isTraining = false;
		return;
	}

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

	await model.fit(xs, ys, {
		epochs: Math.min(10, Math.floor(attemptLog.length / 4)),  // 📌 Reducimos epochs para entrenar más rápido
		batchSize: Math.max(4, Math.floor(inputs.length / 10)),
		shuffle: true
	});

	xs.dispose();
	ys.dispose();
	isTraining = false;

	console.log("✅ Entrenamiento completado.");
}

// 📌 Función para predecir el próximo disparo óptimo
async function predictShot(angle, force, errorX) {
	if (!model) return { bestAngle: angle, bestForce: force };

	const input = tf.tensor2d([[normalize(angle, 10, 80), normalize(force, 5, 40), normalize(errorX, 0, 2000)]]);
	let prediction;

	try {
		prediction = model.predict(input);
		const data = await prediction.data(); // Obtiene los valores de la predicción
		return {
			bestAngle: denormalize(data[0], 10, 80),
			bestForce: denormalize(data[1], 5, 40),
		};
	} finally {
		input.dispose(); // 🔥 LIBERA MEMORIA
		if (prediction) prediction.dispose(); // 🔥 LIBERA MEMORIA
	}
}

// 📌 Mejor penalización por intentos repetitivos
function calculateReward(errorX, previousBest) {
	let reward = Math.round(10 / (errorX + 1));

	if (errorX < previousBest) {
		reward += 5;
	} else {
		reward = Math.max(1, Math.round(reward * 0.8));
	}

	// 📌 Penalizar repeticiones de ángulo y fuerza
	if (bestAttempts.length >= 3) {
		let lastAngles = bestAttempts.slice(-3).map(a => a.angle);
		let lastForces = bestAttempts.slice(-3).map(a => a.force);

		if (new Set(lastAngles).size === 1 && new Set(lastForces).size === 1) {
			reward -= 3;
		}
	}

	return Math.max(1, reward);
}

// 📌 Ajustar la IA con exploración inteligente
async function adjustLearning(errorX, totalError, angle, force) {
	let prediction = await predictShot(angle, force, errorX);
	let reward = calculateReward(errorX, bestDistance);

	let newAngle = prediction.bestAngle;
	let newForce = prediction.bestForce;

	let explorationRate = Math.min(0.6, 0.2 + errorX / 500);  // 📌 Más exploración si el error es grande

	// 🚨 Si la IA no mejora en 4 intentos consecutivos, forzar exploración más agresiva
	if (noProgressCounter >= 4) {
		updateComment("⚠️ No mejora, forzando exploración DRÁSTICA...");
		newAngle += (Math.random() * 20 - 10);  // 🔥 Cambios más amplios en el ángulo
		newForce += (Math.random() * 16 - 8);   // 🔥 Cambios más amplios en la fuerza
		noProgressCounter = 0;  // 📌 Reiniciar contador
	} 
	else if (Math.random() < explorationRate) {
		updateComment("🔄 Explorando nuevas estrategias de ajuste...");
		newAngle += (Math.random() * 8 - 4);  // 📌 Ajustes menos agresivos si error es pequeño
		newForce += (Math.random() * 8 - 4);
	} 
	else {
		updateComment("🎯 Refinando los mejores intentos...");
		newAngle = (newAngle * 0.7) + (bestAngleEver * 0.3);  // 📌 Mezclar con el mejor ángulo conocido
		newForce = (newForce * 0.7) + (bestForceEver * 0.3);  // 📌 Mezclar con la mejor fuerza conocida
	}

	// 📌 Evitar valores extremos
	newAngle = Math.round(Math.max(10, Math.min(80, newAngle)));
	newForce = Math.round(Math.max(5, Math.min(40, newForce)));

	bestAngle = newAngle;
	bestForce = newForce;

	updateComment(`📢 🤖 IA ajustó → Ángulo: ${bestAngle}°, Fuerza: ${bestForce}, Intento: ${attempts}`);

	setTimeout(() => {
		throwBall(bestAngle, bestForce);
	}, 500);
}

// 📌 Evaluar el lanzamiento con mejoras de historial y UI
function evaluateThrow(distance, angle, force) {
	let errorX = Math.abs(targetPosition - distance);
	let totalError = errorX;

	// 📌 Actualizar UI
	angleDisplay.textContent = Math.round(angle);
	forceDisplay.textContent = Math.round(force);
	distanceDisplay.textContent = Math.round(distance);
	errorDisplay.textContent = `${Math.round(errorX)}`;

	commentBox.textContent = ""; 

	// 📌 Guardar el intento en el historial (solo si es válido)
	if (errorX < 2000) {
		attemptLog.push({ angle, force, distance, errorX });

		// 📌 Mantener el historial limitado a los últimos 50 intentos
		attemptLog = attemptLog.slice(-50);
	}

	// 📌 Si mejora el mejor intento registrado
	if (totalError < bestDistance || bestDistance === 0) {
		bestDistance = totalError;
		bestForceEver = force;
		bestAngleEver = angle;
		bestAttempts.push({ angle, force, errorX });

		// 📌 Mantener los mejores 10 intentos recientes
		if (bestAttempts.length > 10) {
			bestAttempts.shift();
		}

		bestDistanceDisplay.textContent = `${Math.floor(bestDistance)}`;
		noProgressCounter = 0;
		updateComment(`🎯 ¡Nuevo mejor intento! Error: ${Math.floor(bestDistance)} px`);
	} else {
		noProgressCounter++;
		updateComment("🤔 No mejoré... probando otra variante.");
	}

	// 📌 Si el error es menor a 20px, éxito
	if (totalError < 20) {
		updateComment("🏆 ¡Lo logré! Alcancé el objetivo.");
		showSuccessModal();
		return;
	}

	attempts++;
	attemptsDisplay.textContent = attempts;

	// 📌 Entrenar la red neuronal si hay suficientes datos y cada 5 intentos
	if (attempts % 5 === 0 && attemptLog.length > 20) {
		trainModel();
	}

	// 📌 Ajustar aprendizaje basado en los mejores intentos recientes
	let avgAngle = bestAttempts.reduce((sum, a) => sum + a.angle, 0) / bestAttempts.length;
	let avgForce = bestAttempts.reduce((sum, a) => sum + a.force, 0) / bestAttempts.length;

	adjustLearning(errorX, totalError, avgAngle, avgForce);
}

// 📌 Iniciar la simulación cuando se presiona el botón
function startSimulation() {
	ball.style.display = "block";
	target.style.display = "block";

	attempts = 0;
	bestDistance = 0;
	lastError = null;
	attemptsDisplay.textContent = attempts;
	bestDistanceDisplay.textContent = bestDistance;

	drawTerrain(); // 📌 Genera el terreno antes de colocar los elementos
	relocateTarget(); // 📌 Posiciona el objetivo correctamente sobre el terreno

	trainAI(); // 📌 Iniciar el primer disparo de aprendizaje
}

function trainAI() {
	if (bestAttempts.length > 0) {
		let avgAngle = bestAttempts.reduce((sum, a) => sum + a.angle, 0) / bestAttempts.length;
		let avgForce = bestAttempts.reduce((sum, a) => sum + a.force, 0) / bestAttempts.length;

		bestAngle = avgAngle + (Math.random() * 4 - 2); // 📌 Pequeña variación para refinamiento
		bestForce = avgForce + (Math.random() * 4 - 2);
	} else {
		// 📌 Usar valores iniciales estratégicos en lugar de aleatorios
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

function showSuccessModal() {
	document.getElementById("modalAttempts").textContent = attempts;
	document.getElementById("successModal").style.display = "flex";
}

function closeModal() {
	document.getElementById("successModal").style.display = "none";
	relocateTarget(); // 📌 Regenerar el objetivo después de cerrar el modal
}

// 📌 Hacer la función accesible globalmente
window.closeModal = closeModal;

async function initGame() {
	await initNeuralNetwork();
	loadPreviousData();  // 📌 Recuperar intentos previos
	startSimulation();
}

window.startSimulation = function startSimulation() {
	ball.style.display = "block";
	target.style.display = "block";

	attempts = 0;
	bestDistance = 0;
	lastError = null;
	attemptsDisplay.textContent = attempts;
	bestDistanceDisplay.textContent = bestDistance;

	drawTerrain();
	relocateTarget();
};

window.initGame = initGame;  // 📌 Hace que initGame sea accesible globalmente
