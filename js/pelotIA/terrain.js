// 馃搶 terrain.js //

export let currentTargetPosition = null;

export function smoothNoise(x) {
    // mezcla de seno/coseno y ruido para dar variedad
    return (
        Math.sin(x * 0.0015) * 60 + 
        Math.cos(x * 0.0025) * 40 +
        Math.sin(x * 0.0045 + Math.random() * 2) * 30
    ) / 3;
}

let terrainLocked = false;

export function drawTerrain(terrainCanvas, ctx, terrain) {
	// Ajustar tamaño del canvas a la ventana
	terrainCanvas.width = window.innerWidth;
	terrainCanvas.height = window.innerHeight;

	ctx.clearRect(0, 0, terrainCanvas.width, terrainCanvas.height);

	// ✅ Si el terreno ya está generado, no lo regeneramos
	if (terrain.length === 0) {
		let baseHeight = Math.random() * 50 + 60;
		let maxHeight = terrainCanvas.height * 0.4;
		let launchOffset = (Math.random() - 0.5) * 40; // entre -20 y +20
		let smoothedHeights = [];

		// 🟩 Zona plana de lanzamiento con variación leve
		for (let i = 0; i < 8; i++) {
			let slightVariation = Math.sin(i * 0.3) * 5;
			smoothedHeights.push(baseHeight + launchOffset + slightVariation);
		}

		for (let i = 8; i < terrainCanvas.width / 10; i++) {
			let variation = Math.random() < 0.3
				? Math.tan(i * 0.002) * 10
				: smoothNoise(i * 10);

			let height = baseHeight + variation + Math.random() * maxHeight * 0.5;
			smoothedHeights.push(height);
		}

		// Suavizado
		for (let i = 1; i < smoothedHeights.length - 1; i++) {
			let smooth = (smoothedHeights[i - 1] + smoothedHeights[i] + smoothedHeights[i + 1]) / 3;
			terrain[i] = (terrain[i] || 0) * 0.3 + smooth * 0.7;
		}
	}

	// 🟩 Dibujar relleno
	ctx.fillStyle = "green";
	ctx.beginPath();
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

	// 🟫 Dibujar borde
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
	
	if (currentTargetPosition !== null) {
		const target = document.getElementById("target");
		const terrainHeight = getTerrainHeight(currentTargetPosition, terrain) || 50;

		target.style.left = `${currentTargetPosition}px`;
		target.style.bottom = `${terrainHeight}px`;
	}
}

// 馃搶 Obtener la altura del terreno en una posici贸n espec铆fica
export function getTerrainHeight(x, terrain) {
	let index = Math.floor(x / 10);
	return index < 0 || index >= terrain.length ? 50 : terrain[index];
}

// 馃搶 Generador de viento
export function generateWind() {
	return Math.random() * 4 - 2;
}

// 馃搶 Generar una posici贸n aleatoria para el objetivo
export function randomTargetPosition(terrainCanvas) {
	let minDist = 200;
	let maxDist = terrainCanvas.width - minDist;
	return Math.random() * (maxDist - minDist) + minDist;
}

// 馃搶 Ajustar la posici贸n del objetivo correctamente sobre la superficie
export function relocateTarget(target, terrainCanvas, windDisplay, terrain, ball, setTargetPos) {
	document.querySelectorAll(".trail").forEach(el => el.remove());

	let attempts = 0;
	let maxAttempts = 50;
	let validPositionFound = false;
	let terrainHeight = 0;
	let newTargetPos = 0; // ✅ variable local, no uses targetPosition

	while (attempts < maxAttempts) {
		newTargetPos = randomTargetPosition(terrainCanvas);
		terrainHeight = getTerrainHeight(newTargetPos, terrain) || 50;

		if (terrainHeight < terrainCanvas.height * 0.6 && terrainHeight > 40) {
			validPositionFound = true;
			break;
		}
		attempts++;
	}

	if (!validPositionFound) {
		console.error("🚫 No se encontró una posición válida para el objetivo después de 50 intentos.");
		return;
	}

	setTargetPos(newTargetPos); // ✅ actualiza variable externa
	currentTargetPosition = newTargetPos; 

	let wind = generateWind();
	windDisplay.textContent = wind.toFixed(2);

	const ctx = terrainCanvas.getContext("2d");
	drawTerrain(terrainCanvas, ctx, terrain, true);

	target.style.left = `${newTargetPos}px`;
	target.style.bottom = `${terrainHeight}px`;

	adjustLaunchPosition(ball, terrain);
}


// 馃搶 Ajustar la posici贸n de lanzamiento en funci贸n del terreno
export function adjustLaunchPosition(ball, terrain) {
	let launchX = 10;
	let launchHeight = getTerrainHeight(launchX, terrain);

	ball.style.left = `${launchX}px`;
	ball.style.bottom = `${launchHeight}px`;
}

// 馃搶 Inicializar el terreno y la posici贸n de lanzamiento al cargar la p谩gina
export function initTerrain(terrainCanvas, ball, target, windDisplay) {
	let terrain = [];
	let ctx = terrainCanvas.getContext("2d");

	drawTerrain(terrainCanvas, ctx, terrain);
	adjustLaunchPosition(ball, terrain);

	window.addEventListener("resize", () => {
		terrainCanvas.width = window.innerWidth;
		terrainCanvas.height = window.innerHeight;
		drawTerrain(terrainCanvas, ctx, terrain); // reutiliza terreno existente
		adjustLaunchPosition(ball, terrain);
	});

	return terrain;
}
