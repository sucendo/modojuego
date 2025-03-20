// 📌 terrain.js //

export function smoothNoise(x) {
    return (
        Math.sin(x * 0.003) * 50 +
        Math.cos(x * 0.002) * 40 +
        Math.sin(x * 0.007) * 25
    ) / 3;
}

// 📌 Generar y dibujar el terreno
export function drawTerrain(terrainCanvas, ctx, terrain) {
    terrainCanvas.width = window.innerWidth;
    terrainCanvas.height = window.innerHeight;

    ctx.clearRect(0, 0, terrainCanvas.width, terrainCanvas.height);
    terrain.length = 0; // Reiniciar el terreno

    let numMountains = Math.floor(Math.random() * 4) + 3;
    let mountainSpacing = terrainCanvas.width / numMountains;
    let baseHeight = Math.random() * 80 + 40;
    let maxMountainHeight = terrainCanvas.height * 0.4;

    let smoothedHeights = [];

    ctx.fillStyle = "green";
    ctx.beginPath();

    for (let i = 0; i < terrainCanvas.width; i += 10) {
        let height = baseHeight + smoothNoise(i) + Math.random() * maxMountainHeight;
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
export function getTerrainHeight(x, terrain) {
    let index = Math.floor(x / 10);
    return index < 0 || index >= terrain.length ? 50 : terrain[index];
}

// 📌 Generador de viento
export function generateWind() {
    return Math.random() * 4 - 2;
}

// 📌 Generar una posición aleatoria para el objetivo
export function randomTargetPosition(terrainCanvas) {
    let minDist = 200;
    let maxDist = terrainCanvas.width - minDist;
    return Math.random() * (maxDist - minDist) + minDist;
}

// 📌 Ajustar la posición del objetivo correctamente sobre la superficie
export function relocateTarget(target, terrainCanvas, windDisplay, terrain, ball) {
    document.querySelectorAll(".trail").forEach(el => el.remove());

    let attempts = 0;
    let maxAttempts = 50;
    let validPositionFound = false;
    let terrainHeight = 0;
    let targetPosition;

    while (attempts < maxAttempts) {
        targetPosition = randomTargetPosition(terrainCanvas);
        terrainHeight = getTerrainHeight(targetPosition, terrain) || 50;

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

    let wind = generateWind();
    windDisplay.textContent = wind.toFixed(2);

    drawTerrain(terrainCanvas, terrainCanvas.getContext("2d"), terrain);

    // 📌 Ajustar la posición sobre la superficie del terreno
    let adjustedHeight = terrainHeight + 10;
    target.style.left = `${targetPosition}px`;
    target.style.bottom = `${adjustedHeight}px`;

    adjustLaunchPosition(ball, terrain);
}

// 📌 Ajustar la posición de lanzamiento en función del terreno
export function adjustLaunchPosition(ball, terrain) {
    let launchX = 10;
    let launchHeight = getTerrainHeight(launchX, terrain) + Math.random() * 20;

    ball.style.left = `${launchX}px`;
    ball.style.bottom = `${launchHeight}px`;
}

// 📌 Inicializar el terreno y la posición de lanzamiento al cargar la página
export function initTerrain(terrainCanvas, ball, target, windDisplay) {
    let terrain = [];
    let ctx = terrainCanvas.getContext("2d");

    drawTerrain(terrainCanvas, ctx, terrain);
    adjustLaunchPosition(ball, terrain);

    window.addEventListener("resize", () => {
        drawTerrain(terrainCanvas, ctx, terrain);
        adjustLaunchPosition(ball, terrain);
    });

    return terrain;
}
