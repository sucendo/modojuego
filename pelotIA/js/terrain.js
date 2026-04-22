// 📌 terrain.js

export let currentTargetPosition = null;
export const RESOLUTION = 10;

const LAUNCH_ZONE_PX = 60;
const MAX_SLOPE = 0.12;
const PLATFORM_TOLERANCE = 6;

function midpointDisplacement(heights, start, end, roughness) {
  if (end - start < 2) return;
  const mid = Math.floor((start + end) / 2);
  const displacement = (Math.random() * 2 - 1) * roughness;
  heights[mid] = (heights[start] + heights[end]) / 2 + displacement;
  midpointDisplacement(heights, start, mid, roughness * 0.58);
  midpointDisplacement(heights, mid, end, roughness * 0.58);
}

export function generateTerrainData(width, resolution = RESOLUTION, height) {
  const cols = Math.max(2, Math.ceil(width / resolution));
  const heights = new Array(cols).fill(0);

  heights[0] = height * 0.22;
  heights[cols - 1] = height * 0.22;

  midpointDisplacement(heights, 0, cols - 1, height * 0.42);

  for (let i = 1; i < cols - 1; i++) {
    heights[i] = (heights[i - 1] + heights[i] + heights[i + 1]) / 3;
  }

  return heights.map((value) => Math.max(24, Math.min(value, height * 0.62)));
}

export function getTerrainHeight(x, terrain, resolution = RESOLUTION) {
  if (!terrain.length) return 0;

  const clampedX = Math.max(0, x);
  const idx = clampedX / resolution;
  const i0 = Math.floor(idx);
  const i1 = Math.min(i0 + 1, terrain.length - 1);
  const t = idx - i0;

  return (terrain[i0] ?? terrain[terrain.length - 1]) * (1 - t) + (terrain[i1] ?? terrain[terrain.length - 1]) * t;
}

function flattenLaunchZone(terrain, launchY, resolution = RESOLUTION) {
  const cols = Math.ceil(LAUNCH_ZONE_PX / resolution);
  const maxDelta = resolution * MAX_SLOPE;

  terrain[0] = launchY;

  for (let i = 1; i <= cols && i < terrain.length; i++) {
    const original = terrain[i];
    const withTolerance = launchY + Math.max(-PLATFORM_TOLERANCE, Math.min(PLATFORM_TOLERANCE, original - launchY));
    const delta = withTolerance - terrain[i - 1];

    if (delta > maxDelta) terrain[i] = terrain[i - 1] + maxDelta;
    else if (delta < -maxDelta) terrain[i] = terrain[i - 1] - maxDelta;
    else terrain[i] = withTolerance;
  }
}

export function drawTerrainSVG(containerId, terrain, resolution = RESOLUTION) {
  const div = document.getElementById(containerId);
  const width = div.clientWidth;
  const height = div.clientHeight;
  const ns = 'http://www.w3.org/2000/svg';

  let d = `M 0 ${height}`;
  for (let i = 0; i < terrain.length; i++) {
    const x = Math.min(width, i * resolution);
    const y = height - terrain[i];
    d += ` L ${x} ${y}`;
  }
  d += ` L ${width} ${height - terrain[terrain.length - 1]}`;
  d += ` L ${width} ${height} Z`;

  div.innerHTML = '';

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  const defs = document.createElementNS(ns, 'defs');
  const gradient = document.createElementNS(ns, 'linearGradient');
  gradient.setAttribute('id', 'terrainGradient');
  gradient.setAttribute('x1', '0');
  gradient.setAttribute('y1', '0');
  gradient.setAttribute('x2', '0');
  gradient.setAttribute('y2', '1');

  const stopTop = document.createElementNS(ns, 'stop');
  stopTop.setAttribute('offset', '0%');
  stopTop.setAttribute('stop-color', '#6fd14f');
  const stopBottom = document.createElementNS(ns, 'stop');
  stopBottom.setAttribute('offset', '100%');
  stopBottom.setAttribute('stop-color', '#347b2a');

  gradient.appendChild(stopTop);
  gradient.appendChild(stopBottom);
  defs.appendChild(gradient);
  svg.appendChild(defs);

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'url(#terrainGradient)');
  path.setAttribute('stroke', '#2c4f1a');
  path.setAttribute('stroke-width', '3');

  svg.appendChild(path);
  div.appendChild(svg);
}

export function initTerrain(containerId, ball, target, windDisplay) {
  const div = document.getElementById(containerId);
  const width = div.clientWidth;
  const height = div.clientHeight;
  const terrain = generateTerrainData(width, RESOLUTION, height);

  const launchY = Math.random() * (height * 0.28) + 36;
  flattenLaunchZone(terrain, launchY, RESOLUTION);
  drawTerrainSVG(containerId, terrain, RESOLUTION);

  ball.style.left = '10px';
  ball.style.bottom = `${launchY}px`;

  relocateTarget(target, containerId, windDisplay, terrain, ball);
  return terrain;
}

export function relocateTarget(target, containerId, windDisplay, terrain) {
  const div = document.getElementById(containerId);

  let posPx = 240;
  let terrainHeight = 0;

  for (let i = 0; i < 60; i++) {
    posPx = Math.random() * Math.max(80, div.clientWidth - 240) + 200;
    terrainHeight = getTerrainHeight(posPx, terrain, RESOLUTION);
    if (terrainHeight > 40 && terrainHeight < div.clientHeight * 0.62) break;
  }

  currentTargetPosition = posPx;
  windDisplay.textContent = (Math.random() * 4 - 2).toFixed(2);
  target.style.left = `${posPx}px`;
  target.style.bottom = `${terrainHeight}px`;
}
