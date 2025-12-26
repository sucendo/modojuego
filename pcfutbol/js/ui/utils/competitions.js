// js/ui/utils/competitions.js
// Helpers para tratar "competiciones" (liga actual + ligas del mundo) desde la UI.

import { GameState } from '../../state.js';

/**
 * Devuelve una lista de competiciones disponibles.
 * Cada item: { id, name, isCurrent, clubs, fixtures, currentDate }
 */
export function getCompetitions() {
  const currentId = GameState.league?.id || 'current';
  const list = [
    {
      id: currentId,
      name: GameState.league?.name || currentId,
      isCurrent: true,
      clubs: Array.isArray(GameState.clubs) ? GameState.clubs : [],
      fixtures: Array.isArray(GameState.fixtures) ? GameState.fixtures : [],
      currentDate: GameState.currentDate || { season: 1, matchday: 1 },
      __source: 'current',
    },
  ];

  const worldLeagues = GameState.world?.leagues;
  if (Array.isArray(worldLeagues)) {
    worldLeagues.forEach((l) => {
      if (!l || !l.id) return;
      // Evitar duplicar la actual si por lo que sea está también en world
      if (String(l.id) === String(currentId)) return;
      list.push({
        id: l.id,
        name: l.name || l.id,
        isCurrent: false,
        clubs: Array.isArray(l.clubs) ? l.clubs : [],
        fixtures: Array.isArray(l.fixtures) ? l.fixtures : [],
        currentDate: l.currentDate || { season: GameState.currentDate?.season || 1, matchday: 1 },
        __source: 'world',
      });
    });
  }

  return list;
}

export function getCompetitionById(competitionId) {
  const id = String(competitionId || '').trim();
  if (!id) return null;
  return getCompetitions().find((c) => c && String(c.id) === id) || null;
}

export function getDefaultCompetitionId() {
  return GameState.league?.id || 'current';
}

export function computeMaxMatchday(fixtures, fallback = 38) {
  const arr = Array.isArray(fixtures) ? fixtures : [];
  let mx = 0;
  for (const fx of arr) {
    const md = Number(fx?.matchday || 0);
    if (Number.isFinite(md) && md > mx) mx = md;
  }
  return mx || Number(fallback || 38) || 38;
}

export function buildClubIndex(clubs) {
  const map = new Map();
  (Array.isArray(clubs) ? clubs : []).forEach((c) => {
    if (c?.id) map.set(c.id, c);
  });
  return map;
}

export function getUserClubId() {
  return GameState.user?.clubId || (GameState.clubs?.[0]?.id ?? null);
}

export function findFixtureInCompetition(competitionId, fixtureId) {
  const comp = getCompetitionById(competitionId) || null;
  if (!comp) return null;
  const fid = fixtureId != null ? String(fixtureId) : '';
  const fx = (comp.fixtures || []).find((f) => f && String(f.id) === fid) || null;
  return { comp, fx };
}