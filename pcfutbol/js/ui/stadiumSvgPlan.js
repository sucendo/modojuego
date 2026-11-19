// Plano top-down reutilizable. La silueta es ilustrativa; las localidades por
// sector y altura proceden del motor de taquilla, no del área del dibujo.
const SVG_NS = 'http://www.w3.org/2000/svg';

const PLANS = Object.freeze({
  metropolitano: {
    label: 'Riyadh Air Metropolitano',
    arcs: [
      { sector: 'tribuna', start: -143, end: -37 },
      { sector: 'sur', start: -37, end: 37 },
      { sector: 'preferencia', start: 37, end: 143 },
      { sector: 'norte', start: 143, end: 217 },
    ],
  },
});

function element(name, attrs = {}, value) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, String(val));
  if (value != null) node.textContent = value;
  return node;
}

// Anillo elíptico sectorizado, con pasillos radiales visibles entre fondos,
// esquinas y laterales. Coordenadas comunes a todos los niveles del estadio.
export function stadiumRingPath(start, end, inner, outer) {
  const point = (angle, t) => {
    const radians = angle * Math.PI / 180;
    const rx = 205 + 155 * t;
    const ry = 132 + 108 * t;
    return `${(400 + rx * Math.cos(radians)).toFixed(2)},${(270 + ry * Math.sin(radians)).toFixed(2)}`;
  };
  const steps = Math.max(8, Math.ceil((end - start) / 4));
  const outerPoints = Array.from({ length: steps + 1 }, (_, i) => point(start + (end - start) * i / steps, outer));
  const innerPoints = Array.from({ length: steps + 1 }, (_, i) => point(end - (end - start) * i / steps, inner));
  return `M${outerPoints.join(' L')} L${innerPoints.join(' L')} Z`;
}

export function stadiumPlanAvailable(plan) { return !!PLANS[plan]; }

/** Renderiza sectores interactivos. Devuelve false si aún no hay plano específico. */
export function renderStadiumPlan(container, { plan, sectors, prices, levelPrices = {}, selectedSector, selectedLevel = null }) {
  if (!stadiumPlanAvailable(plan)) return false;
  const stadium = PLANS[plan];
  const svg = element('svg', {
    viewBox: '0 0 800 540', xmlns: SVG_NS,
    role: 'group', 'aria-label': `Plano interactivo del ${stadium.label}: selecciona la grada y la altura`,
    class: 'pcf-stadium-svg', preserveAspectRatio: 'xMidYMid meet',
  });
  const defs = element('defs');
  const grass = element('pattern', { id: 'pcf-stadium-grass', x: 0, y: 0, width: 26, height: 26, patternUnits: 'userSpaceOnUse' });
  grass.append(element('rect', { width: 26, height: 26, fill: '#286e42' }));
  grass.append(element('rect', { width: 13, height: 26, fill: '#338452' }));
  defs.append(grass);
  svg.append(defs);
  svg.append(element('ellipse', { cx: 400, cy: 270, rx: 365, ry: 245, fill: '#092536', stroke: '#6996aa', 'stroke-width': 2 }));

  for (const arc of stadium.arcs) {
    const sector = sectors.find(item => item.id === arc.sector);
    if (!sector) continue;
    const tierCount = sector.levels.length;
    // Preferencia no posee grada media en la ficha documentada.
    const bands = tierCount === 2 ? [[0, .58], [.67, 1]]
      : tierCount === 3 ? [[0, .37], [.43, .63], [.69, 1]]
        : tierCount === 1 ? [[0, 1]] : [];
    bands.forEach(([inner, outer], index) => {
      const tier = sector.levels[index];
      const active = selectedSector === arc.sector && selectedLevel === index;
      const group = element('g', {
        'data-sector': arc.sector, 'data-level-index': index,
        role: 'button', tabindex: 0, 'aria-pressed': String(active),
        'aria-label': `${sector.label}, ${tier.name}, ${tier.capacity.toLocaleString('es-ES')} plazas aproximadas`,
        class: `pcf-stadium-svg__tier${active ? ' is-selected' : ''}${selectedSector === arc.sector ? ' is-zone-selected' : ''}`,
      });
      const shape = element('path', {
        d: stadiumRingPath(arc.start + 1.5, arc.end - 1.5, inner, outer),
        class: `pcf-stadium-svg__tier-shape pcf-stadium-svg__tier-shape--${index}`,
      });
      group.append(shape, element('title', {}, `${sector.label} · ${tier.name} · ${levelPrices[sector.id]?.[index]?.price ?? prices[sector.id] ?? '—'} €`));
      svg.append(group);
    });
  }

  // Los palcos VIP se integran en el lateral principal, no se representan
  // como una tribuna inventada encima del estadio.
  const vip = sectors.find(sector => sector.id === 'vip');
  if (vip) {
    const group = element('g', {
      'data-sector': 'vip', role: 'button', tabindex: 0,
      'aria-pressed': String(selectedSector === 'vip'),
      'aria-label': `Palcos VIP, ${vip.capacity.toLocaleString('es-ES')} plazas estimadas`,
      class: `pcf-stadium-svg__vip${selectedSector === 'vip' ? ' is-selected' : ''}`,
    });
    group.append(element('path', { d: stadiumRingPath(-118, -62, .40, .51), class: 'pcf-stadium-svg__vip-shape' }));
    group.append(element('title', {}, `Palcos VIP · ${prices.vip ?? '—'} €`));
    svg.append(group);
  }

  // El campo se mantiene dentro del anillo y no cubre los asientos.
  svg.append(element('rect', { x: 270, y: 185, width: 260, height: 170, rx: 3, fill: 'url(#pcf-stadium-grass)', stroke: '#edfff4', 'stroke-width': 2 }));
  svg.append(element('path', { d: 'M400 185 V355 M270 221 H307 V319 H270 M530 221 H493 V319 H530', fill: 'none', stroke: '#e5ffec', 'stroke-width': 1.6 }));
  svg.append(element('circle', { cx: 400, cy: 270, r: 25, fill: 'none', stroke: '#e5ffec', 'stroke-width': 1.6 }));
  svg.append(element('circle', { cx: 400, cy: 270, r: 2, fill: '#e5ffec' }));

  const captions = [
    ['TRIBUNA PRINCIPAL', 400, 75, 0], ['PREFERENCIA', 400, 468, 0],
    ['FONDO NORTE', 86, 270, -90], ['FONDO SUR', 714, 270, 90],
  ];
  for (const [label, x, y, angle] of captions) {
    svg.append(element('text', { x, y, transform: `rotate(${angle} ${x} ${y})`,
      class: 'pcf-stadium-svg__caption', 'text-anchor': 'middle' }, label));
  }
  svg.append(element('text', { x: 400, y: 137, class: 'pcf-stadium-svg__vip-label', 'text-anchor': 'middle' }, 'PALCOS VIP'));
  container.replaceChildren(svg);
  container.classList.add('pcf-stadium-map--svg');
  return true;
}
