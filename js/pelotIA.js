	
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
			let noProgressCounter = 0; // 📌 Contador de intentos sin mejora
			let forceDirection = 1; // 📌 Dirección de ajuste de la fuerza
			let angleDirection = 1; // 📌 Dirección de ajuste del ángulo
			
			target.style.left = targetPosition + "px";
			windDisplay.textContent = wind.toFixed(2);
			let previousAttempts = [];
			
			
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
			
			// 📌 Generador de ruido más suave con interpolación
			function smoothNoise(x) {
				return (Math.sin(x * 0.008) * 40 + Math.cos(x * 0.005) * 30 + Math.sin(x * 0.02) * 10) / 2;
			}

			function drawTerrain() {
				terrainCanvas.width = window.innerWidth;
				terrainCanvas.height = Math.floor(window.innerHeight * 0.5); // 📌 50% de la pantalla

				ctx.fillStyle = "green";
				ctx.clearRect(0, 0, terrainCanvas.width, terrainCanvas.height);
				ctx.beginPath();

				terrain = [];

				let numMountains = Math.floor(Math.random() * 5) + 3; // 📌 Entre 3 y 7 montañas
				let mountainSpacing = terrainCanvas.width / numMountains;

				// 📌 Altura inicial aleatoria de la rampa (entre 40 y 100 px)
				let baseHeight = Math.random() * 60 + 40;

				// 📌 Decidimos si generamos una gran montaña (20% de probabilidad)
				let createBigMountain = Math.random() < 0.2;
				let bigMountainX = createBigMountain ? Math.random() * (terrainCanvas.width - 300) + 150 : -1;

				for (let i = 0; i < terrainCanvas.width; i += 10) {
					let height;

					if (i < 150) {
						// 📌 Rampa de lanzamiento con una transición suave
						height = baseHeight + Math.sin(i * 0.015) * 5;
					} else {
						let mountainIndex = Math.floor(i / mountainSpacing);
						let mountainHeight = Math.random() * (terrainCanvas.height * 0.3) + 50;
						
						let prevHeight = terrain.length > 0 ? terrain[terrain.length - 1] : baseHeight;
						let nextHeight = smoothNoise(i + mountainIndex * 10) + mountainHeight;
						
						height = (prevHeight * 0.6) + (nextHeight * 0.4);

						// 📌 Si decidimos generar una gran montaña, la colocamos aquí
						if (createBigMountain && Math.abs(i - bigMountainX) < 100) {
							height += 100 + Math.random() * 80; // 📌 Aumenta la altura de la gran montaña
						}
					}

					terrain.push(height);
					ctx.lineTo(i, terrainCanvas.height - height);
				}

				ctx.lineTo(terrainCanvas.width, terrainCanvas.height);
				ctx.lineTo(0, terrainCanvas.height);
				ctx.fill();
			}

			function getTerrainHeight(x) {
				let index = Math.floor(x / 10);
				return terrain[index] || 0;
			}

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
				} catch (error) {
					console.warn("⚠️ No se encontró un modelo entrenado. Creando uno nuevo...");

					model = tf.sequential();
					model.add(tf.layers.dense({ inputShape: [3], units: 32, activation: 'relu' }));  
					model.add(tf.layers.dense({ units: 32, activation: 'relu' }));  
					model.add(tf.layers.dense({ units: 2, activation: 'sigmoid' })); 

					model.compile({ optimizer: tf.train.adam(0.005), loss: 'meanSquaredError' });

					console.log("📡 Red Neuronal Inicializada...");
				}
			}
			
			// 📌 Guardar el modelo en localStorage
			async function saveModel() {
				try {
					await model.save('localstorage://my-trained-model');
					console.log("✅ Modelo guardado en localStorage.");
				} catch (error) {
					console.error("❌ Error al guardar el modelo:", error);
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
			
			async function clearModel() {
				try {
					localStorage.removeItem('tensorflowjs_models/my-trained-model');
					console.log("🗑️ Modelo eliminado del almacenamiento.");
				} catch (error) {
					console.error("❌ Error al eliminar el modelo:", error);
				}
			}

			let isTraining = false; // 📌 Controla si la IA está entrenando

			// 📌 Función para entrenar el modelo con datos previos
			async function trainModel() {
				if (isTraining) {
					console.log("⚠️ La IA ya está entrenando. Esperando...");
					return;
				}

				isTraining = true;
				
				const inputs = attemptLog.map(d => [normalize(d.angle, 10, 80), normalize(d.force, 5, 40), normalize(d.errorX, 0, 2000)]);
				const outputs = attemptLog.map(d => [normalize(d.angle, 10, 80), normalize(d.force, 5, 40)]);

				const xs = tf.tensor2d(inputs);
				const ys = tf.tensor2d(outputs);

				await model.fit(xs, ys, { epochs: 100 });

				isTraining = false;

				console.log("✅ Red Neuronal Entrenada con últimos intentos.");
				
				await saveModel();  // 📌 Guardar modelo en `localStorage`
			}

			// 📌 Función para predecir el próximo disparo óptimo
			async function predictShot(angle, force, errorX) {
				if (!model) {
					console.log("❌ Modelo no inicializado.");
					return { bestAngle: angle, bestForce: force };
				}

				const input = tf.tensor2d([[normalize(angle, 10, 80), normalize(force, 5, 40), normalize(errorX, 0, 2000)]]);
				const prediction = model.predict(input);
				const data = await prediction.data();

				let bestAngle = denormalize(data[0], 10, 80);
				let bestForce = denormalize(data[1], 5, 40);

				// 📌 Si la IA repite valores sin mejorar, aplicar un cambio leve en lugar de uno drástico
				if (Math.abs(bestAngle - angle) < 2 && Math.abs(bestForce - force) < 2) {
					updateComment("⚠️ La IA está estancada, probando una leve variación.");
					bestAngle += (Math.random() * 4 - 2); // Pequeña variación entre -2° y +2°
					bestForce += (Math.random() * 3 - 1.5); // Pequeña variación de fuerza
				}

				// 📌 Evita valores NaN
				if (isNaN(bestAngle) || isNaN(bestForce)) {
					console.warn("⚠️ Predicción fallida. Usando valores por defecto.");
					bestAngle = Math.random() * (80 - 10) + 10;
					bestForce = Math.random() * (40 - 5) + 5;
				}

				return { bestAngle, bestForce };
			}

			// 📌 Modificar adjustLearning para usar la Red Neuronal
			async function adjustLearning(errorX, totalError, angle, force, closestBefore, closestAfter) {
				let prediction = await predictShot(angle, force, errorX);

				// 📌 Ajuste dinámico del rango de exploración según la distancia
				let adjustmentFactor = bestDistance > 500 ? 5 : 2;

				// 📌 Si el intento es cercano al mejor, explorar ajustes finos
				let isCloseToBest = errorX < bestDistance * 1.2;
				let newAngle, newForce;

				if (isCloseToBest) {
					updateComment("🎯 Cerca del objetivo, ajustando finamente...");

					// 📌 Prueba pequeñas variaciones en la fuerza sin alterar mucho el ángulo
					newAngle = bestAngle + (Math.random() * 3 - 1.5);
					newForce = bestForce + (Math.random() * 6 - 3);

					// 📌 Si el ajuste empeora, intenta cambiar la combinación ángulo/fuerza
					if (Math.abs(newForce - force) > 2) {
						updateComment("🔄 Buscando alternativa de ángulo y fuerza...");
						newAngle = 90 - bestAngle; // Prueba un ángulo complementario
						newForce = bestForce * Math.sqrt(2);
					}
				} 
				// 📌 Si el intento no mejora tras 5 intentos, hacer cambios agresivos
				else if (noProgressCounter >= 5) {
					updateComment("🔄 Estancado... probando cambios más agresivos.");

					if (closestBefore) {
						newAngle = closestBefore.angle + (Math.random() * adjustmentFactor * 2 - adjustmentFactor);
						newForce = closestBefore.force + (Math.random() * adjustmentFactor * 2 - adjustmentFactor);
					} else if (closestAfter) {
						newAngle = closestAfter.angle + (Math.random() * adjustmentFactor * 2 - adjustmentFactor);
						newForce = closestAfter.force + (Math.random() * adjustmentFactor * 2 - adjustmentFactor);
					} else {
						newAngle = Math.random() * (80 - 10) + 10;
						newForce = Math.random() * (40 - 5) + 5;
					}
					noProgressCounter = 0;
				} 
				// 📌 Si no hay mejor intento, seguir predicción de la IA con pequeñas variaciones
				else {
					newAngle = Math.max(10, Math.min(80, prediction.bestAngle + (Math.random() * adjustmentFactor - adjustmentFactor / 2)));
					newForce = Math.max(5, Math.min(40, prediction.bestForce + (Math.random() * adjustmentFactor - adjustmentFactor / 2)));
				}

				// 📌 FORZAR LÍMITES FINALES antes del disparo
				newAngle = Math.round(Math.max(10, Math.min(80, newAngle)));
				newForce = Math.round(Math.max(5, Math.min(40, newForce)));

				// 📌 Actualizar valores de mejor intento
				bestAngle = newAngle;
				bestForce = newForce;

				updateComment(`📢 🤖 IA ajustó → Ángulo: ${bestAngle}°, Fuerza: ${bestForce}, Intento: ${attempts}`);

				setTimeout(() => {
					throwBall(bestAngle, bestForce);
				}, 500);
			}
						
			function evaluateThrow(distance, angle, force) { 
				let errorX = Math.abs(targetPosition - distance);
				let totalError = errorX;

				// 📌 ACTUALIZAR UI
				angleDisplay.textContent = Math.round(angle);
				forceDisplay.textContent = Math.round(force);
				distanceDisplay.textContent = Math.round(distance);
				errorDisplay.textContent = `${Math.round(errorX)}`;

				// 📌 REINICIAR MENSAJES DE updateComment PARA UN NUEVO LANZAMIENTO
				commentBox.textContent = ""; 

				// 📌 GUARDAR EL INTENTO EN EL HISTORIAL
				attemptLog.push({
					angle: angle,
					force: force,
					distance: distance,
					errorX: errorX
				});

				// 📌 Mantener el historial limitado a los últimos 50 intentos
				if (attemptLog.length > 50) {
					attemptLog.shift();
				}

				// 📌 BUSCAR EL MEJOR DISPARO ANTERIOR Y POSTERIOR
				let closestBefore = null;
				let closestAfter = null;

				for (let attempt of attemptLog) {
					if (attempt.distance < targetPosition) {
						if (!closestBefore || Math.abs(attempt.distance - targetPosition) < Math.abs(closestBefore.distance - targetPosition)) {
							closestBefore = attempt;
						}
					} else {
						if (!closestAfter || Math.abs(attempt.distance - targetPosition) < Math.abs(closestAfter.distance - targetPosition)) {
							closestAfter = attempt;
						}
					}
				}

				// 📌 SI MEJORA EL MEJOR INTENTO REGISTRADO
				if (totalError < bestDistance || bestDistance === 0) {
					bestDistance = totalError;
					bestForceEver = force;
					bestAngleEver = angle;
					bestDistanceDisplay.textContent = `${Math.floor(bestDistance)}`;
					noProgressCounter = 0;
					updateComment(`🎯 ¡Nuevo mejor intento! Error: ${Math.floor(bestDistance)} px`);
				} else {
					noProgressCounter++;
					updateComment("🤔 No mejoré... probando otra variante.");
				}

				// 📌 SI EL ERROR ES MENOR A 10 PX, ÉXITO
				if (totalError < 20) {
					updateComment("🏆 ¡Lo logré! Alcancé el objetivo.");
					showSuccessModal();
					return;
				}

				attempts++;
				attemptsDisplay.textContent = attempts;

				// 📌 ENTRENAR LA RED NEURONAL SI HAY SUFICIENTES DATOS
				if (attemptLog.length > 20) {
					trainModel();
				}

				// 📌 ENVÍO DE LOS DATOS A ADJUSTLEARNING PARA UN AJUSTE MÁS PRECISO
				adjustLearning(errorX, totalError, angle, force, closestBefore, closestAfter);
			}

			// 📌 Asegurar que el objetivo y la pelota se coloquen correctamente sobre el terreno
			function relocateTarget() {
				document.querySelectorAll(".trail").forEach(el => el.remove());

				targetPosition = randomTargetPosition();
				wind = generateWind();
				windDisplay.textContent = wind.toFixed(2);

				drawTerrain(); // 📌 Primero regeneramos el terreno para evitar errores de altura

				let terrainHeight = getTerrainHeight(targetPosition);

				// 📌 Ajustar correctamente sobre el terreno
				target.style.left = `${targetPosition}px`;
				target.style.bottom = `${terrainHeight}px`;

				// 📌 Asegurar que la pelota inicie sobre el terreno
				let ballTerrainHeight = getTerrainHeight(10); // 📌 Altura en la posición inicial
				ball.style.left = "10px";
				ball.style.bottom = `${ballTerrainHeight}px`;

				attempts = 0;
				bestDistance = 0;
				lastError = null;

				trainAI(); // 📌 Reinicia el entrenamiento
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
			}

			function generateWind() {
				return Math.random() * 4 - 2; 
			}

			function randomTargetPosition() {
				let screenWidth = window.innerWidth;
				let minDistance = 200;  // 📌 Evita que el objetivo esté demasiado cerca de la pelota
				let maxPosition = screenWidth - minDistance; 
				return Math.random() * (maxPosition - minDistance) + minDistance;
			}

			function trainAI() {
				bestAngle = Math.random() * 70 + 10;
				bestForce = Math.random() * 20 + 10;
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