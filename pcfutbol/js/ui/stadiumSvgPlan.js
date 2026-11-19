// Plano top-down reutilizable. La silueta es ilustrativa; las localidades por
// sector y altura proceden del motor de taquilla, no del área del dibujo.
const SVG_NS = 'http://www.w3.org/2000/svg';

const ARCS = Object.freeze([
  { sector: 'tribuna', start: -143, end: -37 },
  { sector: 'sur', start: -37, end: 37 },
  { sector: 'preferencia', start: 37, end: 143 },
  { sector: 'norte', start: 143, end: 217 },
]);

// Cada recinto puede tener su silueta específica, mientras que el reparto de
// localidades y sus tarifas siempre lo determina la base de datos del juego.
// El plano genérico NO pretende documentar un número de anfiteatros desconocido.
const PLANS = Object.freeze({
  metropolitano: {
    label: 'Riyadh Air Metropolitano',
    shape: 2,
  },
  bernabeu: { label: 'Santiago Bernabéu', shape: 3.35 },
  campnou: { label: 'Spotify Camp Nou', shape: 2.55 },
  sanmames: { label: 'San Mamés', shape: 2.65 },
  generic: { label: 'estadio', shape: 2.35 },
});

function element(name, attrs = {}, value) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, String(val));
  if (value != null) node.textContent = value;
  return node;
}

// Anillo elíptico sectorizado, con pasillos radiales visibles entre fondos,
// esquinas y laterales. Coordenadas comunes a todos los niveles del estadio.
export function stadiumRingPath(start, end, inner, outer, shape = 2) {
  const point = (angle, t) => {
    const radians = angle * Math.PI / 180;
    const rx = 205 + 155 * t;
    const ry = 132 + 108 * t;
    const square = value => Math.sign(value) * Math.abs(value) ** (2 / shape);
    return `${(400 + rx * square(Math.cos(radians))).toFixed(2)},${(270 + ry * square(Math.sin(radians))).toFixed(2)}`;
  };
  const steps = Math.max(8, Math.ceil((end - start) / 4));
  const outerPoints = Array.from({ length: steps + 1 }, (_, i) => point(start + (end - start) * i / steps, outer));
  const innerPoints = Array.from({ length: steps + 1 }, (_, i) => point(end - (end - start) * i / steps, inner));
  return `M${outerPoints.join(' L')} L${innerPoints.join(' L')} Z`;
}

export function stadiumPlanAvailable(plan) { return !!PLANS[plan]; }

// Las bandas son niveles comerciales distintos, no medidas físicas del graderío.
export function stadiumTierBands(count) {
  if (count === 0) return [[0, 1]]; // grada única sin atribuir alturas no documentadas
  if (count === 1) return [[0, 1]];
  if (count === 2) return [[0, .58], [.67, 1]];
  if (count === 3) return [[0, .37], [.43, .63], [.69, 1]];
  const gap = .025;
  const width = (1 - (count - 1) * gap) / count;
  return Array.from({ length: count }, (_, index) => [index * (width + gap), index * (width + gap) + width]);
}

/** Renderiza sectores interactivos. Devuelve false si aún no hay plano específico. */
export function renderStadiumPlan(container, { plan = 'generic', stadiumName = '', sectors, prices, levelPrices = {}, selectedSector, selectedLevel = null }) {
  if (!stadiumPlanAvailable(plan)) return false;
  const stadium = PLANS[plan];
  const svg = element('svg', {
    viewBox: '0 0 800 540', xmlns: SVG_NS,
    role: 'group', 'aria-label': `Plano interactivo del ${stadiumName || stadium.label}: selecciona la zona y, donde exista, la altura`,
    class: 'pcf-stadium-svg', preserveAspectRatio: 'xMidYMid meet',
  });
  const defs = element('defs');
  const grass = element('pattern', { id: 'pcf-stadium-grass', x: 0, y: 0, width: 26, height: 26, patternUnits: 'userSpaceOnUse' });
  grass.append(element('rect', { width: 26, height: 26, fill: '#286e42' }));
  grass.append(element('rect', { width: 13, height: 26, fill: '#338452' }));
  defs.append(grass);
  svg.append(defs);
  svg.append(element('path', { d: stadiumRingPath(-180, 180, 0, 1.025, stadium.shape), fill: '#092536', stroke: '#6996aa', 'stroke-width': 2 }));

  for (const arc of ARCS) {
    const sector = sectors.find(item => item.id === arc.sector);
    if (!sector) continue;
    const tierCount = sector.levels.length;
    const bands = stadiumTierBands(tierCount);
    bands.forEach(([inner, outer], index) => {
      const tier = sector.levels[index] || null;
      const active = selectedSector === arc.sector && (tier ? selectedLevel === index : selectedLevel == null);
      const attrs = {
        'data-sector': arc.sector,
        role: 'button', tabindex: 0, 'aria-pressed': String(active),
        'aria-label': tier
          ? `${sector.label}, ${tier.name}, ${tier.capacity.toLocaleString('es-ES')} plazas aproximadas`
          : `${sector.label}, ${sector.capacity.toLocaleString('es-ES')} plazas aproximadas; alturas sin documentar`,
        class: `pcf-stadium-svg__tier${active ? ' is-selected' : ''}${selectedSector === arc.sector ? ' is-zone-selected' : ''}`,
      };
      if (tier) attrs['data-level-index'] = index;
      const group = element('g', attrs);
      const shape = element('path', {
        d: stadiumRingPath(arc.start + 1.5, arc.end - 1.5, inner, outer, stadium.shape),
        class: `pcf-stadium-svg__tier-shape pcf-stadium-svg__tier-shape--${Math.min(index, 4)}`,
      });
      group.append(shape, element('title', {}, `${sector.label}${tier ? ` · ${tier.name}` : ''} · ${levelPrices[sector.id]?.[index]?.price ?? prices[sector.id] ?? '—'} €`));
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
    group.append(element('path', { d: stadiumRingPath(-118, -62, .40, .51, stadium.shape), class: 'pcf-stadium-svg__vip-shape' }));
    group.append(element('title', {}, `Palcos VIP · ${prices.vip ?? '—'} €`));
    svg.append(group);
  }

  // El campo se mantiene dentro del anillo y no cubre los asientos.
  svg.append(element('rect', { x: 270, y: 185, width: 260, height: 170, rx: 3, fill: 'url(#pcf-stadium-grass)', stroke: '#edfff4', 'stroke-width': 2 }));
  svg.append(element('path', { d: 'M400 185 V355 M270 221 H307 V319 H270 M530 221 H493 V319 H530', fill: 'none', stroke: '#e5ffec', 'stroke-width': 1.6 }));
  svg.append(element('circle', { cx: 400, cy: 270, r: 25, fill: 'none', stroke: '#e5ffec', 'stroke-width': 1.6 }));
  svg.append(element('circle', { cx: 400, cy: 270, r: 2, fill: '#e5ffec' }));

  const tariffLabel = (sectorId, label) => {
    const tierPrices = levelPrices[sectorId]?.map(tier => tier.price) || [];
    const unique = [...new Set(tierPrices)];
    const tariff = unique.length > 1 ? `${Math.min(...unique)}–${Math.max(...unique)}` : unique[0] ?? prices[sectorId];
    return `${label}${Number.isFinite(Number(tariff)) || unique.length > 1 ? ` · ${tariff} €` : ''}`;
  };
  const captions = [
    ['TRIBUNA PRINCIPAL', 400, 75, 0], ['PREFERENCIA', 400, 468, 0],
    ['FONDO NORTE', 86, 270, -90], ['FONDO SUR', 714, 270, 90],
  ];
  for (const [index, [label, x, y, angle]] of captions.entries()) {
    const sectorId = ['tribuna', 'preferencia', 'norte', 'sur'][index];
    svg.append(element('text', { x, y, transform: `rotate(${angle} ${x} ${y})`,
      class: 'pcf-stadium-svg__caption', 'text-anchor': 'middle' }, tariffLabel(sectorId, label)));
  }
  svg.append(element('text', { x: 400, y: 137, class: 'pcf-stadium-svg__vip-label', 'text-anchor': 'middle' }, tariffLabel('vip', 'PALCOS VIP')));
  container.replaceChildren(svg);
  container.classList.add('pcf-stadium-map--svg');
  return true;
}
