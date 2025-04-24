// 📌 terrain.js //

import { addBuildings, addTrees, addRiver, addBridge } from './terrain_extras.js';

export let currentTargetPosition = null;
export const RESOLUTION = 10; // separación horizontal en px
const LAUNCH_ZONE_PX = 50; // ancho de la zona de lanzamiento en píxeles
const MAX_SLOPE = 0.3;     // pendiente máxima: 0.1 = 1px vertical / 10px horizontal
const PLATFORM_TOLERANCE    = 5;    // tolerancia ±5px alrededor de la plataforma

// Devuelve altura interpolada en cualquier x (px), a partir del array `terrain`.
export function getTerrainHeight(x, terrain, resolution = RESOLUTION) {
	  const idx = x / resolution;
	  const i0  = Math.floor(idx);
	  const i1  = Math.min(i0 + 1, terrain.length - 1);
	  const t   = idx - i0;
	  return terrain[i0] * (1 - t) + terrain[i1] * t;
}

// Ruido fractal multioctava
function generateHeightMap(segments) {
	  const octaves = [
		{ freq: 0.0025, amp: 300 },
		{ freq: 0.007,  amp: 180 },
		{ freq: 0.018,  amp:  90 },
		{ freq: 0.045,  amp:  45 }
	  ];
	  const phases = octaves.map(() => Math.random() * Math.PI * 2);
	  const heights = new Array(segments);

	  // Suma de varias ondas
	  for (let i = 0; i < segments; i++) {
		let h = 0;
		octaves.forEach((o, idx) => {
		  h += o.amp * Math.sin(i * o.freq + phases[idx]);
		});
		heights[i] = h;
	  }

	  // Media móvil para suavizar aun más
	  for (let pass = 0; pass < 5; pass++) {
		const tmp = heights.slice();
		for (let j = 1; j < segments - 1; j++) {
		  tmp[j] = (heights[j-1] + heights[j] + heights[j+1]) / 3;
		}
		for (let j = 1; j < segments - 1; j++) {
		  heights[j] = tmp[j];
		}
	  }

	  return heights;
}

/**
 * Asegura que en la zona de lanzamiento la pendiente ascendente
 * no supere MAX_SLOPE. Solo actúa si hay subida excesiva.
 */
function flattenLaunchZone(terrain, resolution = RESOLUTION) {
  const launchCols = Math.ceil(LAUNCH_ZONE_PX / resolution);
  const maxDelta   = resolution * MAX_SLOPE;      // aquí sí usamos MAX_SLOPE
  for (let i = 1; i <= launchCols && i < terrain.length; i++) {
    const delta = terrain[i] - terrain[i - 1];
    if      (delta >  maxDelta) terrain[i] = terrain[i - 1] + maxDelta;
    else if (delta < -maxDelta) terrain[i] = terrain[i - 1] - maxDelta;
  }
}

function midpointDisplacement(heights, start, end, roughness) {
	  if (end - start < 2) return;
	  const mid = Math.floor((start + end) / 2);
	  const displacement = (Math.random() * 2 - 1) * roughness;
	  heights[mid] = (heights[start] + heights[end]) / 2 + displacement;
	  midpointDisplacement(heights, start, mid, roughness * 0.6);
	  midpointDisplacement(heights, mid, end, roughness * 0.6);
}

// Genera el array de alturas normalizado para ocupar toda la pantalla
export function generateTerrainData(width, resolution = 10, height) {
	  const cols = Math.ceil(width / resolution);
	  const H    = height;
	  const heights = new Array(cols).fill(0);

	  // ─── extremos base ────────────────────────────
	  heights[0]      = H * 0.2;
	  heights[cols-1] = H * 0.2;

	  // ─── fractal (midpoint displacement) ─────────
	  midpointDisplacement(heights, 0, cols-1, H * 0.5);

	  // ─── picos suaves y valles ligeros + suavizado ─
	  for (let i = 1; i < cols - 1; i++) {
		// reducimos tanto probabilidad como amplitud:
		if (Math.random() < 0.005) {
		  // pico suave
		  heights[i] += Math.random() * H * 0.2 + 20;
		} else if (Math.random() < 0.005) {
		  // valle suave
		  heights[i] -= Math.random() * H * 0.15 + 15;
		}
		// un pase extra de suavizado
		heights[i] = (heights[i-1] + heights[i] + heights[i+1]) / 3;
	  }

	  // ─── tramo inicial: plataforma / pendiente muy suave ─
	  const launchZoneCols = Math.ceil(50 / resolution);
	  const h0    = heights[0];
	  const hEnd  = heights[launchZoneCols] || h0;
	  for (let i = 0; i <= launchZoneCols; i++) {
		const t = i / launchZoneCols;
		// lineal entre h0 y hEnd, sin ruidos fuertes
		heights[i] = h0 + (hEnd - h0) * t;
	  }

	  // ─── clamp [20, 0.6·H] para no salirse de la ventana ─
	  return heights.map(h => Math.max(20, Math.min(h, H * 0.6)));
}

// Genera un array de anchos variables que suman exactamente totalWidth
function generateWidthMap(cols, totalWidth, jitterPct = 0.5) {
	  const base = totalWidth / cols;
	  let w = Array.from({length: cols}, () =>
		base * (1 + (Math.random()*2*jitterPct - jitterPct))
	  );
	  const sum = w.reduce((a,b)=>a+b,0), scale = totalWidth/sum;
	  return w.map(v=>v*scale);
}

// Dibuja via SVG usando curvas cuadráticas y llena todo el ancho
export function drawTerrainSVG(containerId, terrain, resolution = 10) {
  const div = document.getElementById(containerId);
  const W   = div.clientWidth;
  const H   = window.innerHeight;
  const N   = terrain.length;
  const NS  = "http://www.w3.org/2000/svg";

  // Calcula anchos de cada columna para cubrir exactamente W
  const widths = generateWidthMap(N, W);
  const xs     = [0];
  for (let i = 1; i < N; i++) {
    xs[i] = xs[i - 1] + widths[i - 1];
  }

  // Empieza el path desde la esquina inferior izquierda
  let d = `M0,${H} L0,${H - terrain[0]}`;

  // Dibuja línea a cada vértice del terreno
  for (let i = 1; i < N; i++) {
    d += ` L${xs[i]},${H - terrain[i]}`;
  }

  // Extiende horizontalmente hasta el borde derecho, manteniendo altura
  const lastY = H - terrain[N - 1];
  d += ` L${W},${lastY}`;

  // Baja al fondo y cierra
  d += ` L${W},${H} Z`;

  // Renderiza el SVG
  div.innerHTML = "";
  const svg  = document.createElementNS(NS, "svg");
  svg.setAttribute("width",  "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "green");
  path.setAttribute("stroke", "#3e2723");
  path.setAttribute("stroke-width", "3");

  svg.appendChild(path);
  div.appendChild(svg);
}


//Inicializa el terreno: genera datos, dibuja SVG, ubica bola y target.
export function initTerrain(containerId, ball, target, windDisplay) {
  const div = document.getElementById(containerId);
  const W   = div.clientWidth;
  const H   = div.clientHeight;

  // 1) Generar array de alturas
  const terrain = generateTerrainData(W, RESOLUTION, H);

  // 2) Plataforma de lanzamiento aleatoria
  const launchCols   = Math.ceil(LAUNCH_ZONE_PX / RESOLUTION);
  const minY         = 20;
  const maxY         = H / 2;
  const launchY      = Math.random() * (maxY - minY) + minY;
  terrain[0] = launchY;

  // 3) Clamp de tolerancia (±5px)
  for (let i = 1; i <= launchCols && i < terrain.length; i++) {
    const d = terrain[i] - launchY;
    terrain[i] = launchY + Math.max(-PLATFORM_TOLERANCE,
                    Math.min(PLATFORM_TOLERANCE, d));
  }

  // 4) **Aquí** aplicamos el tope de pendiente con MAX_SLOPE
  flattenLaunchZone(terrain, RESOLUTION);

  // 5) Dibujar SVG
  drawTerrainSVG(containerId, terrain, RESOLUTION);

  // 6) Colocar bola justo en launchY
  ball.style.left   = `10px`;
  ball.style.bottom = `${launchY}px`;

  // 7) Ubicar objetivo
  relocateTarget(target, containerId, windDisplay, terrain, ball);

  // 8) Ajustar sólo el viewBox al redimensionar
  window.addEventListener("resize", () => {
    const svg = div.querySelector("svg");
    svg.setAttribute("width",  "100%");
    svg.setAttribute("height", "100%");
  });

  return terrain;
}

//Mueve el objetivo a una nueva posición válida.
export function relocateTarget(target, containerId, windDisplay, terrain, ball) {
	  const div = document.getElementById(containerId);

	  // limpia trazas
	  div.querySelectorAll(".trail").forEach(el => el.remove());

	  // elige una posición válida en píxeles
	  let posPx, h;
	  for (let i = 0; i < 50; i++) {
		posPx = Math.random() * (div.clientWidth - 200) + 200;
		// aquí obtenemos la altura real en píxeles con getTerrainHeight
		h = getTerrainHeight(posPx, terrain, RESOLUTION);
		if (h > 40 && h < div.clientHeight * 0.6) break;
	  }

	  // guardamos la posición para la IA
	  currentTargetPosition = posPx;

	  // mostramos la velocidad del viento
	  windDisplay.textContent = (Math.random() * 4 - 2).toFixed(2);

	  // posicionamos el <div id="target"> justo sobre la curva
	  target.style.left   = `${posPx}px`;
	  target.style.bottom = `${h}px`;
}
