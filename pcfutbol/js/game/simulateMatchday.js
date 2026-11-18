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
import {
  MANAGEMENT_STAGES, ensureManagementState, getPendingUserFixtures,
  applyScheduledTraining, lockCurrentTicketPrice, settleUserTicketSales,
} from './managementCycle.js?v=1651';

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
       userClubId: GameState.user?.clubId,
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
  if (ensureManagementState(GameState).stage !== MANAGEMENT_STAGES.MATCHDAY) {
    throw new Error('Antes de jugar, avanza desde la gestión semanal al día del partido.');
  }
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

  // El precio fijado en la previa queda definitivamente cerrado antes del saque inicial.
  lockCurrentTicketPrice(GameState, userFx);

  // ✅ Si hay partidos (de esta u otras jornadas) jugados ANTES que el tuyo,
  // los simulamos ahora (sin tocar tu fixture).
  syncMainLeagueUpToBefore(userFx.kickoffDate, userFx.id);

  // Simular SOLO tu partido
  simulateFixture(userFx, {
    getClubById,
    userClubId: GameState.user?.clubId,
    currentDate: GameState.currentDate,
    applyMatchEffectsToClub: applyMatchEffectsToClubWithCtx,
    getTacticalAggression,
    effectsCtx: buildEffectsCtx(),
  });
  userFx.played = true;
  // La taquilla se abona una sola vez tras obtener la asistencia real.
  settleUserTicketSales(GameState, userFx);

  // Efectos post-partido (solo tu partido por ahora)
  applyPostMatchdayEffects([userFx], {
    clubs: GameState.clubs,
    fixtures: GameState.fixtures,
    currentDate: GameState.currentDate,
    userClubId: GameState.user?.clubId,
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

  // Foto física histórica del jugador: no cambia al entrenar días después.
  const own = getClubById(userClubId);
  const minutes = userFx.playerStatsById || {};
  userFx.postPhysical = (own?.players || []).filter(p => {
    const id = String(p?.id ?? '');
    return id && (minutes[id] || (userFx.homeClubId === userClubId ? userFx.homeLineupIds : userFx.awayLineupIds)?.some(x => String(x) === id));
  }).map(p => ({
    playerId: p.id, name: p.name, fitness: Number(p.fitness ?? 0.9),
    fatigue: Number(p.fatigue || 0), injury: Number(p.injury?.matchesRemaining || 0),
    suspension: Number(p.suspension?.matchesRemaining || 0),
    minutes: Number(minutes[String(p.id)]?.minutes || 0),
  }));

  // Tras tu partido: avanzamos SOLO 1 hora (así NO revelas partidos más tarde ese día)
  bumpNowHours(1);

  // Poner al día ligas world hasta el "ahora" (sincronización temporal)
  syncWorldLeaguesUpToTime(GameState.currentTimeISO);

  recomputeLeagueTable();

  // ✅ Avanzar la "jornada actual" al siguiente partido pendiente del usuario
  advanceUserMatchdayPointer(userClubId, currentMd);
  ensureManagementState(GameState).stage = MANAGEMENT_STAGES.POST;
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

// Desde el postpartido: parada al día siguiente, a las 09:00, antes de entrenar.
export function advanceToNextManagementDay() {
  const m = ensureManagementState(GameState);
  if (m.stage !== MANAGEMENT_STAGES.POST) return false;
  const lastPlayed = (GameState.fixtures || [])
    .filter(fx => fx?.played && (fx.homeClubId === GameState.user?.clubId || fx.awayClubId === GameState.user?.clubId) && fx.kickoffDate)
    .sort((a,b) => Date.parse(b.kickoffDate) - Date.parse(a.kickoffDate))[0];
  if (!lastPlayed) return false;
  const kickoff = new Date(lastPlayed.kickoffDate);
  const target = new Date(Date.UTC(kickoff.getUTCFullYear(), kickoff.getUTCMonth(), kickoff.getUTCDate() + 1, 9));
  const currentMs = Date.parse(GameState.currentTimeISO || '');
  const upcoming = getPendingUserFixtures(GameState)[0];
  const nextKickoff = upcoming ? Date.parse(upcoming.kickoffDate) : Infinity;
  // Calendarios congestionados: no simular nunca el siguiente partido del usuario.
  const safeTarget = Math.min(target.getTime(), nextKickoff - 60000);
  const nextMs = Math.max(safeTarget, Number.isFinite(currentMs) ? currentMs : -Infinity);
  if (nextMs >= nextKickoff) return false;
  const nextISO = new Date(nextMs).toISOString();
  syncMainLeagueUpTo(nextISO);
  syncWorldLeaguesUpToTime(nextISO);
  GameState.currentTimeISO = nextISO;
  m.stage = MANAGEMENT_STAGES.WEEK;
  return true;
}

// Desde gestión semanal: ejecutar los entrenamientos y el resto de ligas hasta
// el día del partido. No se simula el encuentro del jugador antes de confirmarlo.
export function advanceToNextUserMatchDay() {
  const m = ensureManagementState(GameState);
  if (m.stage !== MANAGEMENT_STAGES.WEEK) return false;
  const nextFx = getPendingUserFixtures(GameState)[0];
  if (!nextFx) return false;
  const kickoffMs = Date.parse(nextFx.kickoffDate);
  const kickoff = new Date(kickoffMs);
  const sameDayNine = Date.UTC(kickoff.getUTCFullYear(), kickoff.getUTCMonth(), kickoff.getUTCDate(), 9);
  const desired = Math.min(kickoffMs - 2 * 3600000, sameDayNine);
  const currentMs = Date.parse(GameState.currentTimeISO || '');
  // Si dos encuentros están muy próximos, nunca retrocedemos en el calendario.
  const targetMs = Math.min(kickoffMs - 60000, Math.max(desired, Number.isFinite(currentMs) ? currentMs : -Infinity));
  if (!Number.isFinite(targetMs)) return false;
  const targetISO = new Date(targetMs).toISOString();
  applyScheduledTraining(GameState, GameState.currentTimeISO || targetISO, targetISO);
  syncMainLeagueUpTo(targetISO);
  syncWorldLeaguesUpToTime(targetISO);
  GameState.currentTimeISO = targetISO;
  GameState.currentDate.matchday = Number(nextFx.matchday || GameState.currentDate.matchday);
  lockCurrentTicketPrice(GameState, nextFx);
  m.stage = MANAGEMENT_STAGES.MATCHDAY;
  return true;
}

// Compatibilidad de nombre de API para cualquier import existente.
export function advanceToNextUserMatchPrep() {
  return advanceToNextUserMatchDay();
}
