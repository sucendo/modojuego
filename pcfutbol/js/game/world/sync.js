// js/game/world/sync.js
//
// Sincronización temporal de ligas WORLD por fecha/hora (kickoffDate/kickoffTime).
// Este módulo NO importa simulateMatchday.js para evitar ciclos.
// En su lugar, recibe dependencias vía configure*().

import { GameState } from '../../state.js';
import { getFixtureKickoffISO } from '../utils/fixtures.js';

let _syncMainLeagueUpTo = null;
let _simulateQuickWorldFixture = null;

export function configureMainLeagueSync(fn) {
  _syncMainLeagueUpTo = typeof fn === 'function' ? fn : null;
}

export function configureWorldSimulateFixture(fn) {
  _simulateQuickWorldFixture = typeof fn === 'function' ? fn : null;
}

// ---------------------------
// Helpers internos
// ---------------------------
function safeTime(iso) {
  const d = new Date(iso);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function computeGameNowISO() {
  // "Ahora" del juego = 1 día antes del próximo partido del usuario (09:00 UTC)
  const userClubId = GameState.user?.clubId;
  const season = GameState.currentDate?.season || 1;
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];

  const upcoming = fixtures
    .filter((f) => f && !f.played && f.kickoffDate && (f.homeClubId === userClubId || f.awayClubId === userClubId))
    .sort((a, b) => safeTime(a.kickoffDate) - safeTime(b.kickoffDate))[0];

  if (upcoming?.kickoffDate) {
    const d = new Date(upcoming.kickoffDate);
    d.setUTCDate(d.getUTCDate() - 1);
    d.setUTCHours(9, 0, 0, 0);
    return d.toISOString();
  }

  const lastPlayed = fixtures
    .filter((f) => f && f.played && f.kickoffDate && (f.homeClubId === userClubId || f.awayClubId === userClubId))
    .sort((a, b) => safeTime(b.kickoffDate) - safeTime(a.kickoffDate))[0];

  if (lastPlayed?.kickoffDate) {
    const d = new Date(lastPlayed.kickoffDate);
    d.setUTCHours(d.getUTCHours() + 2);
    return d.toISOString();
  }

  const d = new Date(Date.UTC(2025 + (season - 1), 7, 1, 9, 0, 0));
  const md = GameState.currentDate?.matchday || 1;
  d.setUTCDate(d.getUTCDate() + (Math.max(1, md) - 1) * 7);
  return d.toISOString();
}

// Horizon = último kickoff simulado en tu competición + 2h (utilidad futura)
export function computeHorizonISOAfterMatchday(simulatedFixtures) {
  const list = Array.isArray(simulatedFixtures) ? simulatedFixtures : [];
  let last = null;
  list.forEach((fx) => {
    const ms = safeTime(fx?.kickoffDate);
    if (ms != null && (last == null || ms > last)) last = ms;
  });
  if (last == null) {
    const season = GameState.currentDate?.season || 1;
    const md = GameState.currentDate?.matchday || 1;
    const d = new Date(Date.UTC(2025 + (season - 1), 7, 1, 20, 0, 0));
    d.setUTCDate(d.getUTCDate() + (Math.max(1, md) - 1) * 7);
    last = d.getTime();
  }
  const d2 = new Date(last);
  d2.setUTCHours(d2.getUTCHours() + 2);
  return d2.toISOString();
}

// ---------------------------
// API pública
// ---------------------------

// Asegura que el juego y las ligas estén sincronizadas por LÍNEA TEMPORAL (fecha+hora)
// - Si no existe currentTimeISO, lo calcula (1 día antes del próximo partido del usuario, 09:00 UTC)
// - Simula partidos de TU liga (si se configuró) y de ligas WORLD cuyo kickoff <= currentTimeISO
export function ensureGameTimeAndWorldSync() {
  if (!GameState.currentTimeISO) {
    GameState.currentTimeISO = computeGameNowISO();
  }

  // Tu liga por FECHA/HORA (si está disponible el sync)
  if (typeof _syncMainLeagueUpTo === 'function') {
    _syncMainLeagueUpTo(GameState.currentTimeISO);
  }

  // Mundo por FECHA/HORA
  syncWorldLeaguesUpToTime(GameState.currentTimeISO);
}

export function syncWorldLeaguesToNow() {
  syncWorldLeaguesUpToTime(computeGameNowISO());
}

// Sincroniza ligas del mundo por fecha/hora (respetando kickoffDate/kickoffTime).
export function syncWorldLeaguesUpToTime(upToISO) {
  const limit = safeTime(upToISO);
  if (limit == null) return;
  if (!GameState.world || !Array.isArray(GameState.world.leagues)) return;

  if (typeof _simulateQuickWorldFixture !== 'function') {
    // Defensivo: si no se configuró, no rompemos la app.
    console.warn('syncWorldLeaguesUpToTime: falta configureWorldSimulateFixture().');
    return;
  }

  GameState.world.leagues.forEach((lg) => {
    if (!lg || !Array.isArray(lg.fixtures)) return;

    const pending = lg.fixtures
      .map((fx) => ({ fx, ms: safeTime(getFixtureKickoffISO(fx)) }))
      .filter(({ fx, ms }) => fx && !fx.played && ms != null && ms <= limit)
      .sort((a, b) => a.ms - b.ms)
      .map(({ fx }) => fx);

    pending.forEach((fx) => {
      _simulateQuickWorldFixture(fx, lg);
      fx.played = true;
    });

    const maxPlayed = lg.fixtures
      .filter((fx) => fx && fx.played)
      .reduce((acc, fx) => Math.max(acc, Number(fx.matchday || 0)), 0);

    if (!lg.currentDate) lg.currentDate = { season: GameState.currentDate?.season || 1, matchday: 1 };
    if (maxPlayed > 0) lg.currentDate.matchday = Math.min((lg.competition?.maxMatchday || maxPlayed), maxPlayed + 1);
  });
}