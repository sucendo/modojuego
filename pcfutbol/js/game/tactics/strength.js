// js/game/tactics/strength.js
//
// Helpers de fuerza/estilo táctico usados por el motor de simulación.
// Mantenerlo separado evita duplicar criterios entre motor y UI.

import { ensureClubTactics, isPlayerUnavailable } from '../utils/index.js';
import { FORMATION_EFFECTS, getFormationFit } from './identity.js';

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

  let attack = avgOverall * 0.9;
  let defense = avgOverall * 0.9;

  // Las opciones del usuario viven en club.tactics. alignment se conserva
  // como compatibilidad con los guardados y pantallas antiguos.
  const t = { ...(club.alignment || {}), ...(club.tactics || {}), ...(options.tactics || {}) };
  const mentality = t.mentality || 'BALANCED';
  const pressure = t.pressure || 'NORMAL';
  const formation = FORMATION_EFFECTS[t.formation] ? t.formation : '4-4-2';
  const formationEffect = FORMATION_EFFECTS[formation];
  const tacticalFit = getFormationFit(lineupPlayers, formation);

  // La formación sí modifica las fortalezas, sin crear ventajas extremas;
  // situar titulares fuera de su demarcación cuesta una penalización gradual.
  attack += formationEffect.attack - (1 - tacticalFit) * 5;
  defense += formationEffect.defense - (1 - tacticalFit) * 6;

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
