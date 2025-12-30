// js/game/tactics/strength.js
//
// Helpers de fuerza/estilo táctico usados por el motor de simulación.
// Mantenerlo separado evita duplicar criterios entre motor y UI.

import { ensureClubTactics, isPlayerUnavailable } from '../utils/index.js';

// Wrapper defensivo: sanciones + unavailable base
function isPlayerUnavailableNow(p) {
  if (!p) return true;
  const s = p.suspension;
  if (s && typeof s.matchesRemaining === 'number' && s.matchesRemaining > 0) return true;
  return !!isPlayerUnavailable(p);
}

export function getClubStrengthProfile(club, isHome) {
  ensureClubTactics(club);

  const players =
    Array.isArray(club?.players) && club.players.length > 0
      ? club.players
      : null;

  let lineupPlayers = [];
  if (players && Array.isArray(club.lineup) && club.lineup.length > 0) {
    const lineupSet = new Set(club.lineup);
    lineupPlayers = players.filter(
      (p) => lineupSet.has(p.id) && !isPlayerUnavailableNow(p)
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

  const t = club.alignment || {};
  const mentality = t.mentality || 'BALANCED';
  const pressure = t.pressure || 'NORMAL';

  if (mentality === 'OFFENSIVE') attack += 5;
  else if (mentality === 'DEFENSIVE') defense += 5;

  if (pressure === 'HIGH') {
    attack += 1;
    defense -= 1;
  } else if (pressure === 'LOW') {
    defense += 1;
  }

  if (isHome) attack += 1;

  return { attack, defense };
}

export function getTacticalAggression(club) {
  ensureClubTactics(club);
  const t = club.alignment || {};
  let factor = 1.0;

  if (t.mentality === 'OFFENSIVE') factor += 0.15;
  else if (t.mentality === 'DEFENSIVE') factor -= 0.1;

  if (t.pressure === 'HIGH') factor += 0.2;
  else if (t.pressure === 'LOW') factor -= 0.1;

  return Math.max(0.7, Math.min(1.4, factor));
}