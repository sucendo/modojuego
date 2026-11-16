// js/game/tactics/strength.js
//
// Helpers de fuerza/estilo táctico usados por el motor de simulación.
// Mantenerlo separado evita duplicar criterios entre motor y UI.

import { ensureClubTactics, isPlayerUnavailable } from '../utils/index.js';
import { FORMATION_EFFECTS, FORMATION_ROLES, fitPlayersToFormation } from './identity.js';
import { getPositionAffinity } from './positions.js';

// Wrapper defensivo: sanciones + unavailable base
function isPlayerUnavailableNow(p) {
  if (!p) return true;
  const s = p.suspension;
  if (s && typeof s.matchesRemaining === 'number' && s.matchesRemaining > 0) return true;
  return !!isPlayerUnavailable(p);
}

export function getClubStrengthProfile(club, isHome, options = {}) {
  ensureClubTactics(club);

  const players =
    Array.isArray(club?.players) && club.players.length > 0
      ? club.players
      : null;

  let lineupPlayers = [];
  const lineupIds = options.lineupIds || club.lineup;
  if (players && Array.isArray(lineupIds) && lineupIds.length > 0) {
    const lineupSet = new Set(lineupIds.map(String));
    lineupPlayers = players.filter(
      (p) => lineupSet.has(String(p.id)) && !isPlayerUnavailableNow(p)
    );
  }

  // fallback: si no hay lineup, usar los mejores disponibles
  if (!lineupPlayers || lineupPlayers.length === 0) {
    lineupPlayers = (players || [])
      .filter((p) => p && p.id && !isPlayerUnavailableNow(p))
      .slice(0, 11);
  }

  const avgOverall =
    lineupPlayers.length > 0
      ? lineupPlayers.reduce((acc, p) => acc + (p.overall || 50), 0) / lineupPlayers.length
      : 50;

  // Las opciones del usuario viven en club.tactics. alignment se conserva
  // como compatibilidad con los guardados y pantallas antiguos.
  const t = { ...(club.alignment || {}), ...(club.tactics || {}), ...(options.tactics || {}) };
  const mentality = t.mentality || 'BALANCED';
  const pressure = t.pressure || 'NORMAL';
  const formation = FORMATION_EFFECTS[t.formation] ? t.formation : '4-4-2';
  const formationEffect = FORMATION_EFFECTS[formation];
  const assigned = fitPlayersToFormation(lineupPlayers, formation);
  const roles = FORMATION_ROLES[formation];
  let totalAffinity = 0;
  let attackPenalty = 0;
  let defensePenalty = 0;
  for (const slot of assigned) {
    const player = slot.player;
    if (!player) continue;
    const affinity = getPositionAffinity(player, slot.position);
    totalAffinity += affinity;
    const loss = (Number(player.overall) || 50) * (1 - affinity);
    const pos = roles[slot.index];
    const def = ['GK', 'CB', 'RB', 'LB', 'RWB', 'LWB'].includes(pos);
    const att = ['ST', 'SS', 'RW', 'LW'].includes(pos);
    // Una única penalización por rol: pesa algo más en la faceta principal
    // de ese puesto, sin cambiar las estadísticas persistentes del jugador.
    attackPenalty += loss * (att ? 1.25 : def ? .65 : 1);
    defensePenalty += loss * (def ? 1.25 : att ? .70 : 1);
  }
  const tacticalFit = totalAffinity / 11;
  let attack = avgOverall * .9 - attackPenalty / 11;
  let defense = avgOverall * .9 - defensePenalty / 11;

  // Sin penalización adicional por tacticalFit: el coste ya está incluido.
  attack += formationEffect.attack;
  defense += formationEffect.defense;

  if (mentality === 'OFFENSIVE') attack += 5;
  else if (mentality === 'DEFENSIVE') defense += 5;

  if (pressure === 'HIGH') {
    attack += 1;
    defense -= 1;
  } else if (pressure === 'LOW') {
    defense += 1;
  }

  if (t.playStyle === 'DIRECT') attack += 0.8;
  else if (t.playStyle === 'COUNTER') defense += 0.8;
  else if (t.playStyle === 'POSSESSION') { attack += 0.3; defense += 0.3; }
  if (t.tempo === 'FAST') { attack += 0.6; defense -= 0.4; }
  else if (t.tempo === 'SLOW') { attack -= 0.3; defense += 0.5; }

  if (isHome) attack += 1;

  return { attack, defense, formation, tacticalFit };
}

export function getTacticalAggression(club, overrides = {}) {
  ensureClubTactics(club);
  const t = { ...(club.alignment || {}), ...(club.tactics || {}), ...overrides };
  let factor = 1.0;

  if (t.mentality === 'OFFENSIVE') factor += 0.15;
  else if (t.mentality === 'DEFENSIVE') factor -= 0.1;

  if (t.pressure === 'HIGH') factor += 0.2;
  else if (t.pressure === 'LOW') factor -= 0.1;

  return Math.max(0.7, Math.min(1.4, factor));
}
