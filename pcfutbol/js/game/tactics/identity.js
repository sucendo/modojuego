// Identidad táctica 2026/27. Las formaciones contrastadas usan una muestra
// de varios partidos; para los demás clubes se calcula un perfil ESTIMADO.
// No inferimos un entrenador real a partir de una distribución de posiciones.

import { OBSERVED_MATCHLOGS_2026_27 } from './observed2026.js';

export const FORMATION_ROLES = Object.freeze({
  // Orden de izquierda a derecha para que los extremos y laterales se
  // dibujen en su banda, tanto en Tácticas como en la previa.
  '4-4-2':   ['GK', 'LB', 'CB', 'CB', 'RB', 'LW', 'CM', 'CM', 'RW', 'ST', 'ST'],
  '4-3-3':   ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'ST', 'RW'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'LW', 'CAM', 'RW', 'ST'],
  '3-5-2':   ['GK', 'CB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RB', 'ST', 'ST'],
  '3-4-3':   ['GK', 'CB', 'CB', 'CB', 'LB', 'CM', 'CM', 'RB', 'LW', 'ST', 'RW'],
  '5-3-2':   ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'ST', 'ST'],
  '5-4-1':   ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'LW', 'CM', 'CM', 'RW', 'ST'],
  '4-1-4-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LW', 'CM', 'CM', 'RW', 'ST'],
  '4-5-1':   ['GK', 'LB', 'CB', 'CB', 'RB', 'LW', 'CM', 'CDM', 'CM', 'RW', 'ST'],
});

export const FORMATION_EFFECTS = Object.freeze({
  '4-4-2':   { attack: 0.3, defense: 0.6, attackBias: 0 },
  '4-3-3':   { attack: 1.9, defense: -0.8, attackBias: 2 },
  '4-2-3-1': { attack: 1.0, defense: 0.8, attackBias: 1 },
  '3-5-2':   { attack: 0.8, defense: 0.2, attackBias: 0 },
  '3-4-3':   { attack: 2.2, defense: -1.4, attackBias: 2 },
  '5-3-2':   { attack: -1.2, defense: 2.2, attackBias: -2 },
  '5-4-1':   { attack: -1.4, defense: 2.1, attackBias: -2 },
  '4-1-4-1': { attack: 0.2, defense: 1.1, attackBias: 0 },
  '4-5-1':   { attack: -0.7, defense: 1.5, attackBias: -1 },
});

const POSITION_NEIGHBOURS = Object.freeze({
  GK: {},
  RB: { LB: 0.63, CB: 0.73, CDM: 0.58, RW: 0.58 },
  LB: { RB: 0.63, CB: 0.73, CDM: 0.58, LW: 0.58 },
  CB: { RB: 0.76, LB: 0.76, CDM: 0.75, CM: 0.5 },
  CDM: { CM: 0.87, CB: 0.76, CAM: 0.67, RB: 0.5, LB: 0.5 },
  CM: { CDM: 0.88, CAM: 0.87, RW: 0.6, LW: 0.6 },
  CAM: { CM: 0.85, RW: 0.76, LW: 0.76, ST: 0.71, CDM: 0.6 },
  RW: { LW: 0.7, CAM: 0.82, ST: 0.77, CM: 0.56, RB: 0.48 },
  LW: { RW: 0.7, CAM: 0.82, ST: 0.77, CM: 0.56, LB: 0.48 },
  ST: { RW: 0.78, LW: 0.78, CAM: 0.75, CM: 0.45 },
});

const LEGACY_POSITIONS = {
  POR: 'GK', DFC: 'CB', DF: 'CB', LD: 'RB', LI: 'LB',
  MC: 'CM', MF: 'CM', MCD: 'CDM', MCO: 'CAM', MP: 'CAM',
  ED: 'RW', EI: 'LW', FW: 'ST', DC: 'ST', CF: 'ST',
  RWB: 'RB', LWB: 'LB', RM: 'RW', LM: 'LW',
};

// Los sistemas de cuatro defensas son el punto de partida más frecuente;
// el ajuste por plantilla puede superar esta preferencia.
const FORMATION_PRIOR = {
  '4-4-2': 0.22, '4-3-3': 0.32, '4-2-3-1': 0.34,
  '3-5-2': 0.14, '3-4-3': 0.08, '5-3-2': 0.08,
  '5-4-1': 0.06, '4-1-4-1': 0.10, '4-5-1': 0.07,
};

export function normalizePosition(position) {
  const pos = String(position || '').toUpperCase();
  return LEGACY_POSITIONS[pos] || pos;
}

export function suitabilityForPosition(playerPosition, targetPosition) {
  const actual = normalizePosition(playerPosition);
  const target = normalizePosition(targetPosition);
  if (actual === target) return 1;
  if (actual === 'GK' || target === 'GK') return 0.03;
  return POSITION_NEIGHBOURS[target]?.[actual] ?? 0.32;
}

function hash01(seed) {
  let h = 2166136261;
  for (const c of String(seed)) {
    h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function fitPlayersToRoles(players, roles) {
  const available = (players || []).filter(p => p && p.id);
  const slots = (roles || []).map((position, index) => ({ position, index, player: null }));

  // Reservar el puesto de portero y cubrir primero los roles más escasos.
  const waiting = slots.slice().sort((a, b) => {
    const scarce = slot => available.filter(p => suitabilityForPosition(p.position, slot.position) >= 0.85).length;
    return (a.position === 'GK' ? -1000 : scarce(a)) - (b.position === 'GK' ? -1000 : scarce(b)) || a.index - b.index;
  });
  const taken = new Set();
  for (const slot of waiting) {
    let best = null;
    let bestScore = -1;
    for (const player of available) {
      if (taken.has(String(player.id))) continue;
      if (slot.position !== 'GK' && normalizePosition(player.position) === 'GK') continue;
      const suitability = suitabilityForPosition(player.position, slot.position);
      const score = suitability * 100 + Math.min(100, Number(player.overall || 60)) * 0.12;
      if (score > bestScore) { best = player; bestScore = score; }
    }
    if (best) {
      slot.player = best;
      taken.add(String(best.id));
    }
  }
  return slots;
}

export function fitPlayersToFormation(players, formation) {
  return fitPlayersToRoles(players, FORMATION_ROLES[formation] || FORMATION_ROLES['4-4-2']);
}

export function getFormationFit(players, formation) {
  const slots = fitPlayersToFormation(players, formation);
  const total = slots.reduce((sum, slot) => sum + (slot.player
    ? suitabilityForPosition(slot.player.position, slot.position) : 0), 0);
  return total / 11;
}

function seededManagerStyle(id, overall) {
  const risk = Math.round((0.24 + hash01(`${id}:risk`) * 0.6) * 100) / 100;
  const adaptability = Math.round((0.2 + hash01(`${id}:adapt`) * 0.65) * 100) / 100;
  const offense = (Number(overall || 70) - 70) / 25 + risk - 0.5;
  return {
    risk,
    adaptability,
    mentality: offense > 0.42 ? 'OFFENSIVE' : offense < -0.43 ? 'DEFENSIVE' : 'BALANCED',
    pressure: hash01(`${id}:press`) > 0.72 ? 'HIGH' : hash01(`${id}:press`) < 0.22 ? 'LOW' : 'NORMAL',
    tempo: hash01(`${id}:tempo`) > 0.7 ? 'FAST' : hash01(`${id}:tempo`) < 0.22 ? 'SLOW' : 'NORMAL',
    playStyle: hash01(`${id}:play`) > 0.69 ? 'DIRECT' : hash01(`${id}:play`) < 0.27 ? 'COUNTER' : 'POSSESSION',
  };
}

export function createClubTacticalIdentity(club, baseOverall = 70, leagueId = '') {
  const id = String(club?.id || 'unknown');
  const players = club?.players || [];
  const style = seededManagerStyle(id, baseOverall);
  const ranked = Object.keys(FORMATION_ROLES).map(formation => {
    const fitness = getFormationFit(players, formation);
    const bias = FORMATION_EFFECTS[formation].attackBias;
    const favorable = style.mentality === 'OFFENSIVE' ? bias : style.mentality === 'DEFENSIVE' ? -bias : 0;
    const variation = hash01(`${leagueId}:${id}:${formation}`) - 0.5;
    return { formation, score: fitness * 4 + favorable * 0.12 + variation * 0.7 + FORMATION_PRIOR[formation] };
  }).sort((a, b) => b.score - a.score);

  const observed = OBSERVED_MATCHLOGS_2026_27[id];
  const formation = observed?.preferred || ranked[0].formation;
  const observedAlternates = observed ? Object.entries(observed.formations)
    .filter(([name, appearances]) => name !== formation && appearances >= 2 && FORMATION_ROLES[name])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) : [];
  // Una aparición aislada no basta para declarar un sistema alternativo real.
  const alternate = observedAlternates[0]?.[0]
    || ranked.find(x => x.formation !== formation)?.formation || '4-4-2';
  return {
    season: '2026/27',
    formation,
    alternate,
    mentality: style.mentality,
    pressure: style.pressure,
    tempo: style.tempo,
    playStyle: style.playStyle,
    manager: { risk: style.risk, adaptability: style.adaptability },
    sourceType: observed ? 'observed-matchlogs-2026/27' : 'estimated-from-roster',
    source: observed?.source || null,
    observedGames: observed?.fixtures || 0,
    observedFormationMatches: observed?.formations[formation] || 0,
    sourceScope: observed?.scope || null,
    alternateSourceType: observedAlternates.length ? 'observed-matchlogs-2026/27' : 'estimated-from-roster',
  };
}
