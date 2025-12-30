// js/game/simulateMatchday.js
//
// Lógica de simulación (sin DOM). Mutará GameState.
// La UI decide cómo refrescar vistas.

import {
  GameState,
  recomputeLeagueTable,
  applyStatsForFixtures,
} from '../state.js';

import { simulateFixture } from './match/simulateFixture.js';
import { applyPostMatchdayEffects } from './match/postMatchday.js';
import { applyStatsForFixturesSafe } from './match/statsPersist.js';
import { applyMatchEffectsToClub } from './match/effects.js';
import { applyCardsForPlayer, recordCardEvent, progressSanctionsForClub } from './match/discipline.js';
import { progressInjuriesForClub, generateRandomInjury } from './match/injuries.js';

import {
  computeGameNowISO,
  syncWorldLeaguesUpToTime,
  ensureGameTimeAndWorldSync,
  syncWorldLeaguesToNow,
} from './world/sync.js';

import { getTacticalAggression } from './tactics/strength.js';

// Mantener API pública desde este archivo (por compatibilidad con imports existentes)
export { ensureGameTimeAndWorldSync, syncWorldLeaguesToNow, syncWorldLeaguesUpToTime };

// Cache simple para evitar .find() repetidos en bucles de simulación.
let _clubsRef = null;
let _clubById = new Map();
function getClubById(clubId) {
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  if (clubs !== _clubsRef) {
    _clubsRef = clubs;
    _clubById = new Map();
    for (const c of clubs) {
      if (!c || c.id == null) continue;
      _clubById.set(c.id, c);
    }
  }
  return _clubById.get(clubId) || null;
}

// Wrapper para mantener la misma firma que espera events.js/simulateFixture.js
function applyMatchEffectsToClubWithCtx(fx, club, isHome, events, pickMinute) {
  return applyMatchEffectsToClub(fx, club, isHome, events, pickMinute, {
    currentTimeISO: GameState.currentTimeISO,
    currentDate: GameState.currentDate,
    fixtures: GameState.fixtures,
    applyCardsForPlayer,
    recordCardEvent,
    generateRandomInjury,
    getTacticalAggression,
  });
}

function buildEffectsCtx() {
  return {
    currentTimeISO: GameState.currentTimeISO,
    currentDate: GameState.currentDate,
    fixtures: GameState.fixtures,
    applyCardsForPlayer,
    recordCardEvent,
    generateRandomInjury,
    getTacticalAggression,
  };
}

function bumpNowHours(hours) {
  if (!GameState.currentTimeISO) return;
  const t = new Date(GameState.currentTimeISO);
  if (!Number.isFinite(t.getTime())) return;
  t.setUTCHours(t.getUTCHours() + Number(hours || 0));
  GameState.currentTimeISO = t.toISOString();
}

function simulateFixturesBatch(fixturesToPlay) {
  if (!Array.isArray(fixturesToPlay) || fixturesToPlay.length === 0) return;

  const effectsCtx = buildEffectsCtx();
  fixturesToPlay.forEach((fx) => {
     simulateFixture(fx, {
       getClubById,
       applyMatchEffectsToClub: applyMatchEffectsToClubWithCtx,
       getTacticalAggression,
       effectsCtx,
     });
    fx.played = true;
  });

  applyPostMatchdayEffects(fixturesToPlay, {
    clubs: GameState.clubs,
    fixtures: GameState.fixtures,
    currentDate: GameState.currentDate,
    applyMatchEffectsToClub: applyMatchEffectsToClubWithCtx,
    progressInjuriesForClub,
    progressSanctionsForClub,
  });

  const season = GameState.currentDate?.season || 1;
  applyStatsForFixturesSafe(fixturesToPlay, season, {
    applyStatsForFixtures,
    clubs: GameState.clubs,
    getClubById,
    currentMatchday: GameState.currentDate?.matchday || 1,
  });
}

function advanceUserMatchdayPointer(userClubId, currentMd) {
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  const nextFx = fixtures
    .filter((fx) => {
      if (!fx || fx.played) return false;
      if (!(fx.homeClubId === userClubId || fx.awayClubId === userClubId)) return false;
      const md = Number(fx.matchday || 0);
      return Number.isFinite(md) && md > Number(currentMd || 0);
    })
    .sort((a, b) => Number(a.matchday) - Number(b.matchday))[0];

  if (nextFx && nextFx.matchday != null) {
    GameState.currentDate.matchday = Number(nextFx.matchday);
  } else {
    // Fallback: avanzar 1 jornada (si no hay más del usuario, no rompe nada)
    GameState.currentDate.matchday = Number(currentMd || 1) + 1;
  }
}

export function simulateCurrentMatchday() {
  // Asegurar que el juego tiene hora "real" para sincronización temporal de ligas
  if (!GameState.currentTimeISO) GameState.currentTimeISO = computeGameNowISO();

  const fixtures = GameState.fixtures || [];
  if (fixtures.length === 0) {
    throw new Error('No hay calendario de liga configurado.');
  }

  const currentMd = GameState.currentDate?.matchday || 1;
  const userClubId = GameState.user?.clubId;
  const userFx = fixtures.find((f) =>
    f && !f.played && (f.matchday === currentMd) &&
    (f.homeClubId === userClubId || f.awayClubId === userClubId)
  );
  if (!userFx) {
    throw new Error('No se encontró tu partido pendiente en esta jornada.');
  }

  // "Ahora" = hora de tu partido (si existe kickoffDate)
  if (userFx.kickoffDate) GameState.currentTimeISO = userFx.kickoffDate;

  // ✅ Si hay partidos (de esta u otras jornadas) jugados ANTES que el tuyo,
  // los simulamos ahora (sin tocar tu fixture).
  syncMainLeagueUpToBefore(userFx.kickoffDate, userFx.id);

  // Simular SOLO tu partido
  simulateFixture(userFx, {
    getClubById,
    currentDate: GameState.currentDate,
    applyMatchEffectsToClub: applyMatchEffectsToClubWithCtx,
    getTacticalAggression,
    effectsCtx: buildEffectsCtx(),
  });
  userFx.played = true;

  // Efectos post-partido (solo tu partido por ahora)
  applyPostMatchdayEffects([userFx], {
    clubs: GameState.clubs,
    fixtures: GameState.fixtures,
    currentDate: GameState.currentDate,
    applyMatchEffectsToClub: applyMatchEffectsToClubWithCtx,
    progressInjuriesForClub,
    progressSanctionsForClub,
  });

  // Estadísticas persistentes (goles, tarjetas, lesiones, apariciones...)
  // Importante: se aplica DESPUÉS de los efectos post-partido, porque ahí
  // se añaden eventos de lesión y tarjetas al fixture.
  const _seasonForStats = GameState.currentDate?.season || 1;
  applyStatsForFixturesSafe([userFx], _seasonForStats, {
    applyStatsForFixtures,
    clubs: GameState.clubs,
    getClubById,
    currentMatchday: GameState.currentDate?.matchday || 1,
  });

  // Tras tu partido: avanzamos SOLO 1 hora (así NO revelas partidos más tarde ese día)
  bumpNowHours(1);

  // Poner al día ligas world hasta el "ahora" (sincronización temporal)
  syncWorldLeaguesUpToTime(GameState.currentTimeISO);

  recomputeLeagueTable();

  // ✅ Avanzar la "jornada actual" al siguiente partido pendiente del usuario
  advanceUserMatchdayPointer(userClubId, currentMd);
}

export function syncMainLeagueUpTo(upToISO) {
  if (!upToISO) return;
  const upTo = Date.parse(upToISO);
  if (!Number.isFinite(upTo)) return;

  const fixtures = GameState.fixtures || [];
  const pending = fixtures.filter((fx) => {
    if (!fx || fx.played) return false;
    if (!fx.kickoffDate) return false;
    const t = Date.parse(fx.kickoffDate);
    return Number.isFinite(t) && t <= upTo;
  });

  if (pending.length === 0) return;
  simulateFixturesBatch(pending);
  recomputeLeagueTable();
}

// Igual que syncMainLeagueUpTo, pero excluye 1 fixture (tu partido), para no simularlo 2 veces.
function syncMainLeagueUpToBefore(upToISO, excludeFixtureId) {
  if (!upToISO) return;
  const upTo = Date.parse(upToISO);
  if (!Number.isFinite(upTo)) return;

  const fixtures = GameState.fixtures || [];
  const excludeKey = excludeFixtureId == null ? null : String(excludeFixtureId);

  const pending = fixtures.filter((fx) => {
    if (!fx || fx.played) return false;

    // Excluir fixture objetivo SOLO si hay id y coincide (ultra-defensivo).
    if (excludeKey != null && fx.id != null && String(fx.id) === excludeKey) return false;

    if (!fx.kickoffDate) return false;
    const t = Date.parse(fx.kickoffDate);
    return Number.isFinite(t) && t <= upTo;
  });

  if (pending.length === 0) return;
  simulateFixturesBatch(pending);
  recomputeLeagueTable();
}

// Avanza el tiempo a 1 día antes del próximo partido del usuario y
// simula TODO lo que haya ocurrido hasta esa fecha (incluidos partidos tardíos).
export function advanceToNextUserMatchPrep() {
  const fixtures = GameState.fixtures || [];
  const userClubId = GameState.user?.clubId;
  const now = GameState.currentTimeISO ? Date.parse(GameState.currentTimeISO) : -Infinity;

  const nextFx = fixtures
    .filter((fx) => {
      if (!fx || fx.played) return false;
      if (!(fx.homeClubId === userClubId || fx.awayClubId === userClubId)) return false;
      if (!fx.kickoffDate) return false;
      const t = Date.parse(fx.kickoffDate);
      return Number.isFinite(t) && t > now;
    })
    .sort((a, b) => Date.parse(a.kickoffDate) - Date.parse(b.kickoffDate))[0];

  if (!nextFx) return; // fin de temporada

  // objetivo: 1 día antes a las 09:00 UTC
  const k = new Date(nextFx.kickoffDate);
  const target = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate(), 9, 0, 0, 0));
  target.setUTCDate(target.getUTCDate() - 1);

  // Simula todo lo ocurrido hasta target
  const targetISO = target.toISOString();
  syncMainLeagueUpTo(targetISO);
  syncWorldLeaguesUpToTime(targetISO);

  // Sitúa al juego en el contexto del próximo partido
  GameState.currentTimeISO = targetISO;
}