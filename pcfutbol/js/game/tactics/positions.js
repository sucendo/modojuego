// Modelo posicional 2026/27: 15 demarcaciones y afinidad por futbolista.
// Las posiciones secundarias inferidas son reglas de JUEGO, no hechos
// acreditados sobre futbolistas reales. No altera contratos ni ratings base.

export const POSITION_NAMES = Object.freeze({
  GK: 'Portero', CB: 'Central', RB: 'Lateral derecho', LB: 'Lateral izquierdo',
  RWB: 'Carrilero derecho', LWB: 'Carrilero izquierdo',
  CDM: 'Pivote defensivo', CM: 'Mediocentro', CAM: 'Mediapunta',
  RM: 'Interior derecho', LM: 'Interior izquierdo',
  RW: 'Extremo derecho', LW: 'Extremo izquierdo',
  ST: 'Delantero centro', SS: 'Segundo delantero',
});

const ALIASES = Object.freeze({
  POR: 'GK', DFC: 'CB', DF: 'CB', DEF: 'CB', LD: 'RB', LI: 'LB',
  MC: 'CM', MF: 'CM', MID: 'CM', MCD: 'CDM', DM: 'CDM',
  MCO: 'CAM', AM: 'CAM', MP: 'CAM',
  ED: 'RW', EI: 'LW', FW: 'ST', ATT: 'ST', DC: 'ST', CF: 'ST',
  SD: 'SS', CF2: 'SS', RD: 'RB',
});

export function normalizePosition(position) {
  const value = String(position || '').trim().toUpperCase();
  const normalized = ALIASES[value] || value;
  return POSITION_NAMES[normalized] ? normalized : 'CM';
}

// Afinidades por desplazamiento desde posición principal.
// Lo que no aparece expresamente se considera posición NO habitual (60%).
const RELATED = Object.freeze({
  GK: {},
  RB: { RWB: .91, CB: .81, RM: .79, LB: .68, RW: .65 },
  LB: { LWB: .91, CB: .81, LM: .79, RB: .68, LW: .65 },
  RWB: { RB: .93, RM: .86, RW: .79, CB: .75, LWB: .62 },
  LWB: { LB: .93, LM: .86, LW: .79, CB: .75, RWB: .62 },
  CB: { RB: .78, LB: .78, RWB: .71, LWB: .71, CDM: .80, CM: .61 },
  CDM: { CM: .88, CB: .78, CAM: .69, RM: .62, LM: .62 },
  CM: { CDM: .88, CAM: .88, RM: .81, LM: .81, CB: .61 },
  CAM: { CM: .86, SS: .85, RM: .79, LM: .79, RW: .77, LW: .77, ST: .70 },
  RM: { RW: .89, RWB: .84, CM: .82, CAM: .77, LM: .64 },
  LM: { LW: .89, LWB: .84, CM: .82, CAM: .77, RM: .64 },
  RW: { RM: .89, LW: .69, SS: .78, ST: .73, CAM: .77, RWB: .76 },
  LW: { LM: .89, RW: .69, SS: .78, ST: .73, CAM: .77, LWB: .76 },
  ST: { SS: .91, CAM: .70, RW: .71, LW: .71, CM: .58 },
  SS: { ST: .93, CAM: .85, RW: .78, LW: .78, CM: .72 },
});

const INFERRED_SECONDARIES = Object.freeze({
  GK: [], CB: [],
  RB: [['RWB', .96]], LB: [['LWB', .96]],
  RWB: [['RB', .96]], LWB: [['LB', .96]],
  CDM: [['CM', .92]], CM: [['CDM', .90], ['CAM', .90]],
  CAM: [['CM', .92], ['SS', .88]],
  RM: [['RW', .95]], LM: [['LW', .95]],
  RW: [['RM', .95]], LW: [['LM', .95]],
  ST: [['SS', .93]], SS: [['ST', .94]],
});

function clamp(n, low, high) {
  return Math.max(low, Math.min(high, Number(n)));
}

function stableVersatility(id) {
  let h = 2166136261;
  for (const char of String(id || '')) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return Math.round((.55 + ((h >>> 0) / 4294967295) * .30) * 100) / 100;
}

export function inferSecondaryPositions(primary) {
  return (INFERRED_SECONDARIES[normalizePosition(primary)] || []).map(
    ([position, familiarity]) => ({ position, familiarity, sourceType: 'estimated-compatible' }),
  );
}

export function ensurePlayerPositionData(player) {
  if (!player || typeof player !== 'object') return player;
  player.position = normalizePosition(player.position || player.primaryPosition);
  player.primaryPosition = player.position;
  player.primaryPositionSource ||= player.positionEstimated
    ? 'estimated-from-generic-roster' : 'legacy-role-unverified';
  if (!Array.isArray(player.secondaryPositions)) {
    player.secondaryPositions = inferSecondaryPositions(player.position);
  } else {
    const seen = new Set([player.position]);
    player.secondaryPositions = player.secondaryPositions
      .filter(entry => entry && typeof entry === 'object' && POSITION_NAMES[String(entry.position || '').toUpperCase()])
      .map(entry => ({
        position: normalizePosition(entry.position),
        familiarity: clamp(Number(entry.familiarity) || .90, .55, .99),
        sourceType: entry.sourceType || 'estimated-compatible',
      }))
      .filter(entry => {
        if (seen.has(entry.position) || entry.position === 'GK' || player.position === 'GK') return false;
        seen.add(entry.position);
        return true;
      }).slice(0, 4);
  }
  if (!Number.isFinite(Number(player.versatility))) {
    player.versatility = stableVersatility(player.id || player.name);
    player.versatilitySource = 'simulated';
  } else {
    player.versatility = clamp(player.versatility, 0, 1);
    player.versatilitySource ||= 'simulated';
  }
  if (!player.positionExperience || typeof player.positionExperience !== 'object'
    || Array.isArray(player.positionExperience)) player.positionExperience = {};
  return player;
}

export function getPositionAffinity(playerOrPosition, targetPosition) {
  const primary = normalizePosition(typeof playerOrPosition === 'string'
    ? playerOrPosition : playerOrPosition?.position || playerOrPosition?.primaryPosition);
  const target = normalizePosition(targetPosition);
  if (primary === target) return 1;
  if (primary === 'GK' || target === 'GK') return .03;

  const player = typeof playerOrPosition === 'object' ? playerOrPosition : null;
  const secondary = (player?.secondaryPositions || inferSecondaryPositions(primary))
    .find(item => normalizePosition(item.position) === target);
  const baseline = secondary ? clamp(secondary.familiarity, .55, .99) : (RELATED[primary]?.[target] ?? .60);
  const experience = Math.max(0, Number(player?.positionExperience?.[target]) || 0);
  const improvement = Math.min(.045, experience * .0015);
  const versatility = player ? clamp(Number(player.versatility ?? .70), 0, 1) : .70;
  const bonus = (versatility - .70) * .025;
  // Un futbolista nunca supera su puesto natural al desplazarse.
  return Math.round(clamp(baseline + improvement + bonus, .50, .99) * 1000) / 1000;
}

export function getEffectiveOverall(player, targetPosition) {
  return Math.round((Number(player?.overall) || 50) * getPositionAffinity(player, targetPosition));
}
