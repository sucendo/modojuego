// terrain_extras.js
// Funciones para añadir elementos al SVG creado por drawTerrainSVG

/**
 * Obtiene el svg dentro del contenedor dado
 */
 export const buildingRects = [];
 
function getSVG(containerOrSvg) {
  let svg;
  if (containerOrSvg instanceof SVGSVGElement) {
    svg = containerOrSvg;
  } else {
    const div = typeof containerOrSvg === 'string'
      ? document.getElementById(containerOrSvg)
      : containerOrSvg;
    svg = div && div.querySelector('svg');
  }
  if (!svg) {
    console.warn(`No se encontró <svg> en '${containerOrSvg}'.`);
    return null;
  }
  return svg;
}

/**
 * Añade edificios rectangulares al SVG
 * @param {string} containerId 
 * @param {number} count número de edificios
 * @param {number} maxHeight altura máxima de edificio
 */
export function addBuildings(containerOrSvg, count, maxHeight) {
  const svg = getSVG(containerOrSvg);
  if (!svg) return;
  const W = svg.viewBox.baseVal.width;
  const H = svg.viewBox.baseVal.height;
  for (let i = 0; i < count; i++) {
    const bw = Math.random() * 50 + 20;
    const bh = Math.random() * maxHeight + 20;
    const x  = Math.random() * (W - bw);
    const groundY = H; // asume que el suelo está en viewBox height
    const y  = groundY - bh;
    const rect = document.createElementNS(svg.namespaceURI, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', bw);
    rect.setAttribute('height', bh);
    rect.setAttribute('fill', '#888');
    rect.setAttribute('stroke', '#555');
    svg.appendChild(rect);
  }
}

/**
 * Añade árboles sencillos: tronco + copa
 */
export function addTrees(containerId, count = 8) {
  const svg = getSVG(containerId);
  if (!svg) return;
  const W = svg.viewBox.baseVal.width;
  const H = svg.viewBox.baseVal.height;
  for (let i = 0; i < count; i++) {
    const tx = Math.random() * W;
    const trunkHeight = 15;
    const trunkWidth = 4;
    const groundY = H;
    const trunk = document.createElementNS(svg.namespaceURI, 'rect');
    trunk.setAttribute('x', tx);
    trunk.setAttribute('y', groundY - trunkHeight);
    trunk.setAttribute('width', trunkWidth);
    trunk.setAttribute('height', trunkHeight);
    trunk.setAttribute('fill', '#6b4226');
    svg.appendChild(trunk);
    const cx = tx + trunkWidth/2;
    const cy = groundY - trunkHeight;
    const radius = 12;
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy - radius/2);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', '#227722');
    svg.appendChild(circle);
  }
}

/**
 * Añade un río como un path curvo
 */
export function addRiver(containerId) {
  const svg = getSVG(containerId);
  if (!svg) return;
  const W = svg.viewBox.baseVal.width;
  const H = svg.viewBox.baseVal.height;
  // path desde izquierda a derecha con curvatura
  let d = `M0,${H*0.8}`;
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const x = (W/steps)*i;
    const y = H*0.8 + (Math.random()*40 - 20);
    d += ` L${x},${y}`;
  }
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#44aaff');
  path.setAttribute('stroke-width', '20');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);
}

/**
 * Añade un puente entre dos puntos X
 */
export function addBridge(containerId, x1 = 100, x2 = 200) {
  const svg = getSVG(containerId);
  if (!svg) return;
  const H = svg.viewBox.baseVal.height;
  const y = H*0.75;
  // pilas
  [x1, x2].forEach(x => {
    const rect = document.createElementNS(svg.namespaceURI, 'rect');
    rect.setAttribute('x', x - 5);
    rect.setAttribute('y', y);
    rect.setAttribute('width', 10);
    rect.setAttribute('height', 40);
    rect.setAttribute('fill', '#663300');
    svg.appendChild(rect);
  });
  // tablero
  const bridge = document.createElementNS(svg.namespaceURI, 'line');
  bridge.setAttribute('x1', x1);
  bridge.setAttribute('y1', y);
  bridge.setAttribute('x2', x2);
  bridge.setAttribute('y2', y);
  bridge.setAttribute('stroke', '#553300');
  bridge.setAttribute('stroke-width', '10');
  svg.appendChild(bridge);
}