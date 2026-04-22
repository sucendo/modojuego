import { addBuildings, addTrees, addRiver, addBridge } from './terrain_extras.js';

export let currentTargetPosition = null;
export const RESOLUTION = 10;
const LAUNCH_ZONE_PX = 50;
const MAX_SLOPE = 0.1;
const PLATFORM_TOLERANCE = 5;

function midpointDisplacement(heights, start, end, roughness) {
  if (end - start < 2) return;
  const mid = Math.floor((start + end) / 2);
  const displacement = (Math.random() * 2 - 1) * roughness;
  heights[mid] = (heights[start] + heights[end]) / 2 + displacement;
  midpointDisplacement(heights, start, mid, roughness * 0.6);
  midpointDisplacement(heights, mid, end, roughness * 0.6);
}

export function generateTerrainData(width, resolution = RESOLUTION, height) {
  const cols = Math.ceil(width / resolution);
  const H = height;
  const heights = new Array(cols).fill(0);

  heights[0] = H * 0.18;
  heights[cols - 1] = H * 0.22;
  midpointDisplacement(heights, 0, cols - 1, H * 0.42);

  for (let i = 1; i < cols - 1; i++) {
    if (Math.random() < 0.008) {
      heights[i] += Math.random() * H * 0.16 + 14;
    } else if (Math.random() < 0.008) {
      heights[i] -= Math.random() * H * 0.12 + 10;
    }
    heights[i] = (heights[i - 1] + heights[i] + heights[i + 1]) / 3;
  }

  return heights.map(h => Math.max(20, Math.min(h, H * 0.58)));
}

export function getTerrainHeight(x, terrain, resolution = RESOLUTION) {
  const idx = x / resolution;
  const i0 = Math.max(0, Math.floor(idx));
  const i1 = Math.min(i0 + 1, terrain.length - 1);
  const t = idx - i0;
  return terrain[i0] * (1 - t) + terrain[i1] * t;
}

function flattenLaunchZone(terrain, resolution = RESOLUTION) {
  const launchCols = Math.ceil(LAUNCH_ZONE_PX / resolution);
  const maxDelta = resolution * MAX_SLOPE;
  for (let i = 1; i <= launchCols && i < terrain.length; i++) {
    const delta = terrain[i] - terrain[i - 1];
    if (delta > maxDelta) terrain[i] = terrain[i - 1] + maxDelta;
    else if (delta < -maxDelta) terrain[i] = terrain[i - 1] - maxDelta;
  }
}

function generateWidthMap(cols, totalWidth, jitterPct = 0.35) {
  const base = totalWidth / cols;
  const widths = Array.from({ length: cols }, () => base * (1 + (Math.random() * 2 * jitterPct - jitterPct)));
  const sum = widths.reduce((a, b) => a + b, 0);
  const scale = totalWidth / sum;
  return widths.map(v => v * scale);
}

export function drawTerrainSVG(containerId, terrain) {
  const div = document.getElementById(containerId);
  const W = div.clientWidth;
  const H = div.clientHeight;
  const N = terrain.length;
  const NS = 'http://www.w3.org/2000/svg';

  const widths = generateWidthMap(N, W);
  const xs = [0];
  for (let i = 1; i < N; i++) {
    xs[i] = xs[i - 1] + widths[i - 1];
  }

  let d = `M0,${H} L0,${H - terrain[0]}`;
  for (let i = 1; i < N; i++) {
    d += ` L${xs[i]},${H - terrain[i]}`;
  }
  const lastY = H - terrain[N - 1];
  d += ` L${W},${lastY} L${W},${H} Z`;

  div.innerHTML = '';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = `
    <linearGradient id="terrainFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#79c45f"/>
      <stop offset="45%" stop-color="#5fa74a"/>
      <stop offset="100%" stop-color="#3f6c2f"/>
    </linearGradient>
    <linearGradient id="skyGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  `;
  svg.appendChild(defs);

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'url(#terrainFill)');
  path.setAttribute('stroke', '#345224');
  path.setAttribute('stroke-width', '3');
  svg.appendChild(path);

  const ridge = document.createElementNS(NS, 'path');
  ridge.setAttribute('d', d.replace(`M0,${H} `, '').replace(` L${W},${H} Z`, ''));
  ridge.setAttribute('fill', 'none');
  ridge.setAttribute('stroke', 'rgba(255,255,255,0.26)');
  ridge.setAttribute('stroke-width', '1.5');
  svg.appendChild(ridge);

  div.appendChild(svg);
}

export function initTerrain(containerId, ball, target, windDisplay) {
  const div = document.getElementById(containerId);
  const W = div.clientWidth;
  const H = div.clientHeight;

  const terrain = generateTerrainData(W, RESOLUTION, H);

  const launchCols = Math.ceil(LAUNCH_ZONE_PX / RESOLUTION);
  const minY = 26;
  const maxY = H / 2;
  const launchY = Math.random() * (maxY - minY) + minY;
  terrain[0] = launchY;

  for (let i = 1; i <= launchCols && i < terrain.length; i++) {
    const delta = terrain[i] - launchY;
    terrain[i] = launchY + Math.max(-PLATFORM_TOLERANCE, Math.min(PLATFORM_TOLERANCE, delta));
  }

  flattenLaunchZone(terrain, RESOLUTION);
  drawTerrainSVG(containerId, terrain, RESOLUTION);

  ball.style.left = '10px';
  ball.style.bottom = `${launchY}px`;
  target.style.display = 'block';
  ball.style.display = 'block';

  relocateTarget(target, containerId, windDisplay, terrain, ball);
  return terrain;
}

export function relocateTarget(target, containerId, windDisplay, terrain) {
  const div = document.getElementById(containerId);
  div.querySelectorAll('.trail').forEach(el => el.remove());

  let posPx = 0;
  let h = 0;
  for (let i = 0; i < 50; i++) {
    posPx = Math.random() * (div.clientWidth - 220) + 220;
    h = getTerrainHeight(posPx, terrain, RESOLUTION);
    if (h > 40 && h < div.clientHeight * 0.6) break;
  }

  currentTargetPosition = posPx;
  windDisplay.textContent = (Math.random() * 4 - 2).toFixed(2);
  target.style.left = `${posPx}px`;
  target.style.bottom = `${h}px`;
}
