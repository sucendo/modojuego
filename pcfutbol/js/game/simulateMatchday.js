// js/game/simulateMatchday.js
//
// Lógica de simulación (sin DOM). Mutará GameState.
// La UI decide cómo refrescar vistas.

import {
  GameState,
  recomputeLeagueTable,
  applyStatsForFixtures,
} from '../state.js';

import { ensureClubTactics, isPlayerUnavailable, isPlayerInjuredNow } from './utils/index.js';

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clamp(x, a, b) {
  const n = Number(x);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, n));
}

function computeMinutesForClubInFixture(fx, isHome) {
  const mins = new Map();
  const xi = (isHome ? fx.homeLineupIds : fx.awayLineupIds) || [];
  xi.forEach((pid) => {
    if (pid != null) mins.set(pid, 90);
  });

  const clubId = isHome ? fx.homeClubId : fx.awayClubId;
  const subs = Array.isArray(fx.substitutions) ? fx.substitutions : [];
  subs.forEach((s) => {
    if (!s) return;
    if (s.clubId && clubId && s.clubId !== clubId) return;
    const m = typeof s.minute === 'number' ? s.minute : null;
    if (!m || m < 1 || m > 90) return;
    const outId = s.outPlayerId;
    const inId = s.inPlayerId;
    if (outId != null && mins.has(outId)) {
      mins.set(outId, Math.max(0, Math.min(mins.get(outId), m - 1)));
    }
    if (inId != null) {
      const add = Math.max(0, 91 - m);
      mins.set(inId, (mins.get(inId) || 0) + add);
    }
  });
  return mins;
}

function buildEventCountMap(fx, type, clubId) {
  const map = new Map();
  const ev = Array.isArray(fx?.events) ? fx.events : [];
  ev.forEach((e) => {
    if (!e || e.type !== type) return;
    if (clubId != null && e.clubId !== clubId) return;
    const key = e.playerId != null ? String(e.playerId) : null;
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function getMentalScore01(player) {
  const m = player?.attributes?.mental || {};
  const vals = [m.vision, m.composure, m.workRate, m.leadership]
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const base = vals.length
    ? vals.reduce((a, b) => a + b, 0) / vals.length
    : Number(player?.overall ?? 50);
  // asume escala 1..99
  return clamp01(base / 99);
}

function applyMoraleDelta(player, delta, mental01) {
  if (player.morale == null) player.morale = 0.7;
  const posMult = 0.85 + 0.30 * mental01; // 0.85..1.15
  const negMult = 1.15 - 0.30 * mental01; // 1.15..0.85 (alto mental = menos bajón)
  const d = delta >= 0 ? delta * posMult : delta * negMult;
  player.morale = clamp01(player.morale + d);
}

function applyMoraleForClubFixture(club, fx, isHome) {
  if (!club || !fx) return;
  const players = Array.isArray(club.players) ? club.players : [];
  const xiIds = (isHome ? fx.homeLineupIds : fx.awayLineupIds) || [];
  const benchIds = (isHome ? fx.homeBenchIds : fx.awayBenchIds) || [];
  const xiSet = new Set(xiIds);
  const benchSet = new Set(benchIds);
  const calledSet = new Set([...xiIds, ...benchIds]);

  const minutesById = computeMinutesForClubInFixture(fx, isHome);
  const goalsByPlayer = buildEventCountMap(fx, 'GOAL', club.id);
  const redsByPlayer = buildEventCountMap(fx, 'RED_CARD', club.id);

  const gf = isHome ? (fx.homeGoals || 0) : (fx.awayGoals || 0);
  const ga = isHome ? (fx.awayGoals || 0) : (fx.homeGoals || 0);
  const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D';

  players.forEach((p) => {
    if (!p?.id) return;
    if (p.morale == null) p.morale = 0.7;

    const mental01 = getMentalScore01(p);
    const mins = minutesById.get(p.id) || 0;
    const played = mins > 0;
    const onBench = benchSet.has(p.id);
    const called = calledSet.has(p.id) || played;
    const available = !isPlayerUnavailable(p);

    const mfrac = clamp(mins / 90, 0, 1);
    const goals = goalsByPlayer.get(String(p.id)) || 0;
    const reds = redsByPlayer.get(String(p.id)) || 0;

    let delta = 0;

    if (played) {
      // jugar: sube moral (más si gana), y goles suman más
      delta += 0.020 * mfrac;                 // jugar
      if (result === 'W') delta += 0.012 * mfrac;
      else if (result === 'D') delta += 0.004 * mfrac;
      else delta -= 0.012 * mfrac;

      delta += goals * 0.020;                 // goles
      if (reds) delta -= 0.010;               // roja: bajón
    } else if (onBench) {
      // convocado pero no juega: según resultado + mental (mental amortigua bajada)
      delta += -0.004;
      if (result === 'W') delta += 0.004;     // queda ~0
      else if (result === 'D') delta += 0.002; // ligera bajada
      else delta -= 0.004;                    // pierde y no juegas => bajada mayor
    } else if (!called) {
      // no convocado: baja si está disponible
      if (available) delta -= 0.014;
      else delta -= 0.001; // si está lesionado/sancionado, casi no penaliza
    }

    // Transferible: erosiona moral poco a poco
    if (p.transferListed) delta -= 0.004;

    // Hook futuro: si añades contractDissatisfaction (0..1) o similar, afectará.
    const diss =
      (typeof p.contractDissatisfaction === 'number' ? p.contractDissatisfaction : null) ??
      (typeof p.contract?.dissatisfaction === 'number' ? p.contract.dissatisfaction : null);
    if (diss != null) delta -= 0.010 * clamp01(diss);

    applyMoraleDelta(p, delta, mental01);
  });
}

// Calendario interno del juego (motor):
//  - Temporada 1 comienza el 1 de agosto de 2025
//  - Por defecto cada jornada de liga son 7 días
// En el futuro, para Champions/Copa, añade a los fixtures un `gameDay` (día absoluto
// dentro de la temporada) o un `kickoffDate` ISO para que el motor calcule descansos reales.
const GAME_CALENDAR = {
  BASE_SEASON_YEAR: 2025,
  SEASON_START_MONTH: 8, // agosto
  SEASON_START_DAY: 1,
  DAYS_PER_MATCHDAY: 7,
};


function getClubById(clubId) {
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  return clubs.find((c) => c && c.id === clubId) || null;
}

function ensureClubMedical(club) {
  if (!club) return;
  if (!club.medical) club.medical = { centerLevel: 1, physioLevel: 1 };
  if (club.medical.centerLevel == null) club.medical.centerLevel = 1;
  if (club.medical.physioLevel == null) club.medical.physioLevel = 1;
}

// ----------------------
// Descanso / forma / fit
// ----------------------

function getSeasonStartUTC(season) {
  const year = GAME_CALENDAR.BASE_SEASON_YEAR + (Number(season || 1) - 1);
  return new Date(
    Date.UTC(
      year,
      GAME_CALENDAR.SEASON_START_MONTH - 1,
      GAME_CALENDAR.SEASON_START_DAY
    )
  );
}

function dateToDayIndexUTC(date, seasonStartUTC) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const ms = date.getTime() - seasonStartUTC.getTime();
  return Math.floor(ms / 86400000);
}

// Devuelve el "día" absoluto dentro de la temporada para un fixture.
// Prioridad:
//  1) fx.gameDay (si lo defines en el futuro para Champions/Copa)
//  2) fx.kickoffDate (ISO) o fx.date (ISO)
//  3) matchday * DAYS_PER_MATCHDAY (liga)
function getFixtureDayIndex(fx) {
  if (!fx) return null;
  if (Number.isFinite(Number(fx.gameDay))) return Number(fx.gameDay);

  const season = fx.season ?? GameState.currentDate?.season ?? 1;
  const start = getSeasonStartUTC(season);

  const iso = fx.kickoffDate || fx.date || fx.dateISO || null;
  if (typeof iso === 'string' && iso.length >= 10) {
    const d = new Date(iso);
    const di = dateToDayIndexUTC(d, start);
    if (Number.isFinite(di)) return di;
  }

  const md = Number(fx.matchday || 1);
  return (Math.max(1, md) - 1) * GAME_CALENDAR.DAYS_PER_MATCHDAY;
}

function getNextFixtureDayIndexForClub(clubId, afterDay) {
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  const after = Number.isFinite(Number(afterDay)) ? Number(afterDay) : 0;
  let best = null;
  for (let i = 0; i < fixtures.length; i++) {
    const fx = fixtures[i];
    if (!fx || fx.played) continue;
    if (fx.homeClubId !== clubId && fx.awayClubId !== clubId) continue;
    const day = getFixtureDayIndex(fx);
    if (!Number.isFinite(day)) continue;
    if (day <= after) continue;
    if (best == null || day < best) best = day;
  }
  return best;
}

function getPreviousFixtureDayIndexForClub(clubId, beforeDay) {
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  const before = Number.isFinite(Number(beforeDay)) ? Number(beforeDay) : Infinity;
  let best = null;
  for (let i = 0; i < fixtures.length; i++) {
    const fx = fixtures[i];
    if (!fx || !fx.played) continue;
    if (fx.homeClubId !== clubId && fx.awayClubId !== clubId) continue;
    const day = getFixtureDayIndex(fx);
    if (!Number.isFinite(day)) continue;
    if (day >= before) continue;
    if (best == null || day > best) best = day;
  }
  return best;
}

function getPlayerAgeAtUTCDate(player, dateUTC) {
  const dobStr = player?.birthDate;
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return null;
  let age = dateUTC.getUTCFullYear() - dob.getUTCFullYear();
  const m = dateUTC.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && dateUTC.getUTCDate() < dob.getUTCDate())) age--;
  if (!Number.isFinite(age) || age < 14 || age > 60) return null;
  return age;
}

function avgNums(nums) {
  const arr = (nums || []).filter((n) => Number.isFinite(n));
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pickWeighted(items, weights) {
  let total = 0;
  for (let i = 0; i < weights.length; i++) total += Math.max(0, weights[i] || 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, weights[i] || 0);
    if (r <= 0) return items[i];
  }
  return items[items.length - 1] || null;
}

function computePlayerInjuryRiskMultiplier(player, minutesPlayed, restDays, cardAgg, nowDateUTC) {
  // Fitness = energía (0..1)
  const fit = player?.fitness == null ? 0.9 : clamp01(player.fitness);
  // Form = forma (-3..+3)
  const form = (player?.form != null && Number.isFinite(Number(player.form))) ? clamp(Number(player.form), -3, 3) : 0;
  // Fatiga (0..100)
  const fat = clamp(Number(player?.fatigue || 0), 0, 100);
  // Minutos de exposición
  const m = clamp(Number(minutesPlayed || 90) / 90, 0, 1);
  // Días desde el partido anterior (si hay)
  const rd = clamp(Number(restDays || 7), 1, 14);
  // Edad
  const age = getPlayerAgeAtUTCDate(player, nowDateUTC);

  // Energía baja => sube mucho el riesgo
  // Por debajo de 0.85 empieza a penalizar fuerte.
  const energyPenalty = fit < 0.85 ? (0.85 - fit) / 0.85 : 0; // 0..1 aprox
  const energyMult = 1 + 1.8 * clamp(energyPenalty, 0, 1);     // hasta ~2.8

  // Fatiga acumulada alta => sube riesgo
  const fatiguePenalty = fat > 45 ? (fat - 45) / 55 : 0;       // 0..1
  const fatigueMult = 1 + 0.55 * clamp(fatiguePenalty, 0, 1);  // hasta ~1.55

  // Forma mala => sube (forma buena reduce ligeramente)
  const formMult =
    form < 0 ? (1 + (Math.abs(form) / 3) * 0.35) : (1 - (form / 3) * 0.08);

  // Poco descanso desde el partido anterior => sube riesgo
  // 3 días => +12%, 2 días => +24%, etc.
  const restMult = rd < 4 ? (1 + (4 - rd) * 0.12) : (rd >= 7 ? 0.98 : 1.0);

  // Edad: a partir de 28-30 sube progresivo
  let ageMult = 1.0;
  if (Number.isFinite(age)) {
    if (age >= 30) ageMult = 1 + Math.min(0.30, (age - 29) * 0.02); // cap +30%
    else if (age <= 22) ageMult = 0.95;
  }

  // Exposición por minutos: 30' no es lo mismo que 90'
  const minutesMult = 0.45 + 0.55 * m; // 0.45..1.0

  // Intensidad táctica / agresividad (ya lo usas para tarjetas)
  const intensityMult = clamp(0.90 + 0.25 * (cardAgg - 1.0), 0.75, 1.25);

  const mult = energyMult * fatigueMult * formMult * restMult * ageMult * minutesMult * intensityMult;
  return clamp(mult, 0.6, 3.0);
}

function getRecoveryTarget(daysRest, age) {
  // Usuario: con 7 días -> ~95%
  // Fórmula base: 0.65 + 0.05*días, cap a 0.95
  let t = 0.65 + 0.05 * clamp(daysRest, 0, 14);
  t = Math.min(0.95, t);

  // Edad: a partir de 27 recupera un poco peor; por debajo, un poco mejor.
  if (Number.isFinite(age)) {
    if (age > 27) t -= (age - 27) * 0.005;
    else if (age < 23) t += (23 - age) * 0.003;
  }
  return clamp01(t);
}

function applyFitnessAndFormForClubBetweenMatches(club, fx, isHome, daysUntilNext) {
  const players = Array.isArray(club.players) ? club.players : [];
  const minutesById = fx ? computeMinutesForClubInFixture(fx, isHome) : new Map();
  const season = fx?.season ?? GameState.currentDate?.season ?? 1;
  const seasonStart = getSeasonStartUTC(season);
  const nowDay = fx
    ? getFixtureDayIndex(fx)
    : (Math.max(1, GameState.currentDate?.matchday || 1) - 1) * GAME_CALENDAR.DAYS_PER_MATCHDAY;
  const nowDate = new Date(seasonStart.getTime() + nowDay * 86400000);

  const restDays = clamp(daysUntilNext ?? GAME_CALENDAR.DAYS_PER_MATCHDAY, 1, 14);

  players.forEach((p) => {
    if (!p?.id) return;
    // Defaults defensivos
    if (p.fitness == null) p.fitness = 0.9;
    if (p.form == null || Number.isNaN(p.form)) p.form = 0;

    const mins = minutesById.get(p.id) || 0;
    const played = mins > 0;
    const age = getPlayerAgeAtUTCDate(p, nowDate);

    if (played) {
      // 1) Coste de partido: reduce Energía según minutos + ligera penalización por edad.
      const m = clamp(mins / 90, 0, 1);
      const agePenalty = Number.isFinite(age) && age > 30 ? (age - 30) * 0.002 : 0;
      const loss = clamp(0.32 * m + agePenalty, 0, 0.55);
      p.fitness = clamp01(clamp01(p.fitness) - loss);

      // 2) Recuperación hasta un objetivo según días de descanso.
      const target = getRecoveryTarget(restDays, age);
      if (p.fitness < target) p.fitness = target;

      // 3) Forma: +15% aprox -> +1.0 si juega 90' (rango -3..+3), escalado por minutos.
      const deltaForm = 1.0 * m;
      p.form = clamp(p.form + deltaForm, -3, 3);
    } else {
      // No jugó: recupera más y la forma tiende suavemente a 0.
      const ageAdj = Number.isFinite(age) && age > 30 ? (age - 30) * 0.003 : 0;
      const restTarget = clamp01(Math.min(0.99, getRecoveryTarget(restDays, age) + 0.04 - ageAdj));
      if (p.fitness < restTarget) p.fitness = restTarget;

      // Reversión a 0 si no participa
      p.form = p.form + (0 - p.form) * 0.10;
      p.form = clamp(p.form, -3, 3);
    }
  });
}

export function simulateCurrentMatchday() {
  const fixtures = GameState.fixtures || [];
  if (fixtures.length === 0) {
    throw new Error('No hay calendario de liga configurado.');
  }

  const currentMd = GameState.currentDate.matchday || 1;
  const currentFixtures = fixtures.filter(
    (f) => f.matchday === currentMd && !f.played
  );

  if (currentFixtures.length === 0) {
    throw new Error('Esta jornada ya está simulada.');
  }

  // Simular partidos
  currentFixtures.forEach((fx) => {
    simulateFixture(fx);
    fx.played = true;
  });

  // Efectos post-jornada (fatiga, lesiones, sanciones, recuperación...)
  applyPostMatchdayEffects(currentFixtures);

  // Estadísticas persistentes (goles, tarjetas, lesiones, apariciones...)
  // Importante: se aplica DESPUÉS de los efectos post-partido, porque ahí
  // se añaden eventos de lesión y tarjetas al fixture.
  try {
    applyStatsForFixtures(currentFixtures, GameState.currentDate.season || 1);
  } catch (e) {
    // No bloqueamos la simulación por un fallo de stats
    console.warn('No se pudieron aplicar estadísticas:', e);
  }

  recomputeLeagueTable();

  const maxMd =
    GameState.competition?.maxMatchday ||
    Math.max(...fixtures.map((f) => f.matchday || 1));

  if (GameState.currentDate.matchday < maxMd) {
    GameState.currentDate.matchday += 1;
  }
}

// ----------------------------
// Helpers minuto único fixture
// ----------------------------

function createFixtureMinutePicker(existingEvents) {
  const used = new Set();
  (Array.isArray(existingEvents) ? existingEvents : []).forEach((ev) => {
    const m = ev && typeof ev.minute === 'number' ? ev.minute : null;
    if (m && m > 0) used.add(m);
  });
  return function pick() {
    for (let i = 0; i < 18; i++) {
      const m = 1 + Math.floor(Math.random() * 90);
      if (!used.has(m)) {
        used.add(m);
        return m;
      }
    }
    return 90;
  };
}

// ----------------------------------------
// Selección XI/banquillo para la simulación
// ----------------------------------------

function getStartingXIForFixture(club) {
  ensureClubTactics(club);
  const preferred = Array.isArray(club.lineup) ? club.lineup.slice() : [];
  const available = (club.players || []).filter((p) => p && p.id && !isPlayerUnavailable(p));
  const availableSet = new Set(available.map((p) => p.id));
  const xi = [];
  const seen = new Set();
  preferred.forEach((id) => {
    if (id && !seen.has(id) && availableSet.has(id) && xi.length < 11) {
      xi.push(id);
      seen.add(id);
    }
  });
  for (let i = 0; i < available.length && xi.length < 11; i++) {
    const id = available[i].id;
    if (id && !seen.has(id)) {
      xi.push(id);
      seen.add(id);
    }
  }
  return xi;
}

function getBenchForFixture(club, startingXIIds, benchSize = 9) {
  const players = Array.isArray(club.players) ? club.players : [];
  const xiSet = new Set(Array.isArray(startingXIIds) ? startingXIIds : []);
  const available = players.filter((p) => p && p.id && !xiSet.has(p.id) && !isPlayerUnavailable(p));
  return available.slice(0, Math.max(0, benchSize)).map((p) => p.id);
}

function getBenchForFixturePro(club, startingXIIds, benchSize = 9) {
  // alias histórico si existía
  return getBenchForFixture(club, startingXIIds, benchSize);
}

// -----------------
// Simulación partido
// -----------------

/**
 * Usa fuerza de once titular + táctica + forma/fatiga para estimar goles.
 */
function simulateFixture(fx) {
  const homeClub = getClubById(fx.homeClubId);
  const awayClub = getClubById(fx.awayClubId);
  if (!homeClub || !awayClub) return;

  // Guardar XI y banquillo usado en el partido (clave para minutos reales)
  fx.season = fx.season ?? (GameState.currentDate?.season || 1);
  fx.homeLineupIds = getStartingXIForFixture(homeClub);
  fx.awayLineupIds = getStartingXIForFixture(awayClub);
  fx.homeBenchIds = getBenchForFixture(homeClub, fx.homeLineupIds, 9);
  fx.awayBenchIds = getBenchForFixture(awayClub, fx.awayLineupIds, 9);
  if (!Array.isArray(fx.substitutions)) fx.substitutions = [];

  const homeProfile = getClubStrengthProfile(homeClub, true);
  const awayProfile = getClubStrengthProfile(awayClub, false);

  // Base de goles por fuerza relativa
  const homeAgg = getTacticalAggression(homeClub);
  const awayAgg = getTacticalAggression(awayClub);

  // Heurística sencilla
  const homeLambda = Math.max(0.2, (homeProfile.attack / Math.max(1, awayProfile.defense)) * 1.2 * homeAgg);
  const awayLambda = Math.max(0.2, (awayProfile.attack / Math.max(1, homeProfile.defense)) * 0.95 * awayAgg);

  const homeGoals = sampleGoals(homeLambda);
  const awayGoals = sampleGoals(awayLambda);

  fx.homeGoals = homeGoals;
  fx.awayGoals = awayGoals;

  // Eventos
  fx.events = generateEventsForFixture(fx, homeClub, awayClub);
}

function sampleGoals(lambda) {
  // Poisson aproximada por sumas Bernoulli (suficiente para arcade)
  const base = Math.min(6, Math.max(0, lambda));
  let goals = 0;
  for (let i = 0; i < 6; i++) {
    const p = Math.max(0.02, Math.min(0.55, base / 6));
    if (Math.random() < p) goals++;
  }
  return goals;
}

// ----------------------------
// Eventos: goles/tarjetas/lesión
// ----------------------------

function generateEventsForFixture(fx, homeClub, awayClub) {
  const events = [];
  const pickMinute = createFixtureMinutePicker(events);

  const addGoal = (clubId, playerId) => {
    events.push({
      type: 'GOAL',
      clubId,
      playerId,
      minute: pickMinute(),
    });
  };

  const homeScorers = getPotentialScorersForClub(homeClub, fx.homeLineupIds);
  const awayScorers = getPotentialScorersForClub(awayClub, fx.awayLineupIds);

  for (let i = 0; i < (fx.homeGoals || 0); i++) {
    const p = pickRandomScorer(homeScorers);
    addGoal(fx.homeClubId, p?.id || null);
  }
  for (let i = 0; i < (fx.awayGoals || 0); i++) {
    const p = pickRandomScorer(awayScorers);
    addGoal(fx.awayClubId, p?.id || null);
  }

  // Subs tácticas básicas + alguna forzada por lesión
  generateTacticalSubsForFixture(fx, homeClub, true, events, pickMinute);
  generateTacticalSubsForFixture(fx, awayClub, false, events, pickMinute);

  // Tarjetas / lesiones post
  applyMatchEffectsToClub(fx, homeClub, true, events, pickMinute);
  applyMatchEffectsToClub(fx, awayClub, false, events, pickMinute);

  // Orden
  events.sort((a, b) => (a.minute || 999) - (b.minute || 999));
  return events;
}

function generateTacticalSubsForFixture(fx, club, isHome, events, pickMinute) {
  const bench = isHome ? fx.homeBenchIds : fx.awayBenchIds;
  const lineup = isHome ? fx.homeLineupIds : fx.awayLineupIds;
  if (!Array.isArray(bench) || bench.length === 0) return;
  if (!Array.isArray(lineup) || lineup.length < 11) return;

  // 0-3 cambios “random” (ajustable)
  const maxSubs = 3;
  const subsCount = Math.random() < 0.75 ? (Math.random() < 0.35 ? 2 : 1) : 0;
  const n = Math.min(maxSubs, subsCount);
  if (n <= 0) return;

  const usedIn = new Set();
  const usedOut = new Set();

  for (let i = 0; i < n; i++) {
    const outIdx = Math.floor(Math.random() * lineup.length);
    const outId = lineup[outIdx];
    if (!outId || usedOut.has(outId)) continue;

    const inId = bench.find((id) => id && !usedIn.has(id));
    if (!inId) break;

    usedOut.add(outId);
    usedIn.add(inId);

    const minute = Math.min(89, Math.max(46, pickMinute()));

    fx.substitutions.push({
      clubId: club.id,
      outPlayerId: outId,
      inPlayerId: inId,
      minute,
      reason: 'TACTICAL',
    });
  }
}

function getPotentialScorersForClub(club, lineupIds) {
  const players = Array.isArray(club.players) ? club.players : [];
  const idSet = new Set(Array.isArray(lineupIds) ? lineupIds : []);
  const lineupPlayers = players.filter((p) => p && idSet.has(p.id));

  // Ponderación muy básica por posición
  return lineupPlayers.map((p) => {
    const pos = (p.position || '').toUpperCase();
    let w = 1;
    if (pos.includes('DC') || pos.includes('ST')) w = 5;
    else if (pos.includes('EI') || pos.includes('ED') || pos.includes('MP')) w = 3;
    else if (pos.includes('MC') || pos.includes('MI') || pos.includes('MD')) w = 2;
    else if (pos.includes('DF')) w = 1.2;
    else if (pos.includes('POR') || pos.includes('GK')) w = 0.2;
    return { ...p, __goalWeight: w };
  });
}

function pickRandomScorer(players) {
  if (!Array.isArray(players) || players.length === 0) return null;
  const total = players.reduce((acc, p) => acc + (p.__goalWeight || 1), 0);
  let r = Math.random() * total;
  for (let i = 0; i < players.length; i++) {
    r -= players[i].__goalWeight || 1;
    if (r <= 0) return players[i];
  }
  return players[players.length - 1];
}

// ---------------------------
// Efectos post jornada (club)
// ---------------------------

function applyPostMatchdayEffects(currentFixtures) {
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  const fixtureByClub = new Map();
  (Array.isArray(currentFixtures) ? currentFixtures : []).forEach((fx) => {
    if (!fx) return;
    fixtureByClub.set(fx.homeClubId, fx);
    fixtureByClub.set(fx.awayClubId, fx);
  });
  
  const fallbackDays = GAME_CALENDAR.DAYS_PER_MATCHDAY;
  const currentDay = (Math.max(1, GameState.currentDate?.matchday || 1) - 1) * fallbackDays;

  clubs.forEach((club) => {
    if (!club?.id) return;
    const fx = fixtureByClub.get(club.id) || null;
    if (fx) {
      applyMatchEffectsToClub(fx, club, fx.homeClubId === club.id);
	  
      // Moral (depende de jugar, goles, resultado, banquillo/no convocado, mental, transferible...)
      applyMoraleForClubFixture(club, fx, fx.homeClubId === club.id);

      // Recuperación de Energía + subida de Forma en función de los días hasta el próximo partido.
      const fxDay = getFixtureDayIndex(fx);
      const nextDay = getNextFixtureDayIndexForClub(club.id, fxDay);
      const daysUntilNext = nextDay != null ? (nextDay - fxDay) : fallbackDays;
      applyFitnessAndFormForClubBetweenMatches(club, fx, fx.homeClubId === club.id, daysUntilNext);
   	  
    } else {
      applyRestEffectsToClub(club);
	  
      // Si no juega, aún así hacemos que recupere Energía y que la forma vuelva suavemente a 0.
      const nextDay = getNextFixtureDayIndexForClub(club.id, currentDay);
      const daysUntilNext = nextDay != null ? (nextDay - currentDay) : fallbackDays;
      applyFitnessAndFormForClubBetweenMatches(club, null, false, daysUntilNext);	  
    }
    progressInjuriesForClub(club);
    progressSanctionsForClub(club);
  });
}

function applyMatchEffectsToClub(fx, club, isHome, events, pickMinute) {
  // Esta función se llama dos veces (en generación eventos y post jornada).
  // Si viene sin events/pickMinute, no añade eventos: solo aplica efectos de fatiga.
  ensureClubMedical(club);
  const players = Array.isArray(club.players) ? club.players : [];

  // Fatiga ligera al XI
  const xiIds = isHome ? fx.homeLineupIds : fx.awayLineupIds;
  const idSet = new Set(Array.isArray(xiIds) ? xiIds : []);
  players.forEach((p) => {
    if (!p?.id) return;
    if (!idSet.has(p.id)) return;
    p.fatigue = Math.min(100, Math.max(0, (p.fatigue || 0) + 6));
  });

  // Si no hay canal de eventos, terminamos aquí
  if (!events || !pickMinute) return;

  // Probabilidad de lesión + tarjetas
  const injuryMod = getMedicalInjuryModifier(club);
  const cardAgg = Math.max(0.8, Math.min(1.5, getTacticalAggression(club)));

  // Amarillas
  const yellowCount = Math.random() < 0.6 ? (Math.random() < 0.25 ? 2 : 1) : 0;
  for (let i = 0; i < yellowCount; i++) {
    const p = pickRandomLineupPlayer(club, xiIds);
    if (!p) continue;
    applyCardsForPlayer(p, 1);
    recordCardEvent(events, club.id, p.id, 'YELLOW_CARD', pickMinute());
  }

  // Roja directa (rara)
  if (Math.random() < 0.03 * cardAgg) {
    const p = pickRandomLineupPlayer(club, xiIds);
    if (p) {
      applyCardsForPlayer(p, 2);
      recordCardEvent(events, club.id, p.id, 'RED_CARD', pickMinute());
    }
  }

  // Lesiones (más realistas): riesgo depende de energía/forma/fatiga/descanso/edad/minutos
  const season = fx?.season ?? GameState.currentDate?.season ?? 1;
  const seasonStart = getSeasonStartUTC(season);
  const fxDay = getFixtureDayIndex(fx);
  const nowDateUTC = new Date(seasonStart.getTime() + (Number.isFinite(fxDay) ? fxDay : 0) * 86400000);
  const prevDay = Number.isFinite(fxDay) ? getPreviousFixtureDayIndexForClub(club.id, fxDay) : null;
  const restDaysFromPrev = prevDay != null ? Math.max(1, fxDay - prevDay) : GAME_CALENDAR.DAYS_PER_MATCHDAY;

  const minutesById = computeMinutesForClubInFixture(fx, isHome);
  const set = new Set(Array.isArray(xiIds) ? xiIds : []);
  const lineupPlayers = (club.players || []).filter((p) => p && p.id && set.has(p.id) && !isPlayerInjuredNow(p));

  if (lineupPlayers.length > 0) {
    const risks = lineupPlayers.map((p) =>
      computePlayerInjuryRiskMultiplier(p, minutesById.get(p.id) || 90, restDaysFromPrev, cardAgg, nowDateUTC)
    );
    const avgRisk = avgNums(risks) || 1.0;

    // Probabilidad base por club (ajustable). Se modula por:
    // - nivel médico (injuryMod)
    // - riesgo medio (energía/forma/fatiga/descanso)
    const baseClubChance = 0.05; // antes 0.06 fijo
    const injuryChance = clamp(baseClubChance * injuryMod * avgRisk, 0.01, 0.22);

    if (Math.random() < injuryChance) {
      const p = pickWeighted(lineupPlayers, risks);
      if (p) {
        const fit = p?.fitness == null ? 0.9 : clamp01(p.fitness);
        const age = getPlayerAgeAtUTCDate(p, nowDateUTC);
        const risk = risks[lineupPlayers.indexOf(p)] || avgRisk;
        const inj = generateRandomInjury(risk, age, fit);
        p.injury = inj;
        events.push({
          type: 'INJURY',
          clubId: club.id,
          playerId: p.id,
          minute: pickMinute(),
          injuryType: inj.type,
        });
        maybeAddForcedSubstitution(fx, club, isHome, p.id, pickMinute());
      }
    }
  }
}

function pickRandomLineupPlayer(club, lineupIds) {
  const players = Array.isArray(club.players) ? club.players : [];
  const set = new Set(Array.isArray(lineupIds) ? lineupIds : []);
  const lineup = players.filter((p) => p && p.id && set.has(p.id));
  if (lineup.length === 0) return null;
  return lineup[Math.floor(Math.random() * lineup.length)];
}

function maybeAddForcedSubstitution(fx, club, isHome, outPlayerId, pickMinute) {
  if (!fx || !outPlayerId) return;
  const bench = isHome ? fx.homeBenchIds : fx.awayBenchIds;
  if (!Array.isArray(bench) || bench.length === 0) return;

  const inId = bench.find((id) => id && id !== outPlayerId);
  if (!inId) return;

  const minute = Math.min(89, Math.max(1, pickMinute));
  fx.substitutions.push({
    clubId: club.id,
    outPlayerId,
    inPlayerId: inId,
    minute,
    reason: 'INJURY',
  });
}

function applyRestEffectsToClub(club) {
  const players = Array.isArray(club.players) ? club.players : [];
  players.forEach((p) => {
    if (!p) return;
    // Baja fatiga
    p.fatigue = Math.max(0, (p.fatigue || 0) - 8);
  });
}

function progressInjuriesForClub(club) {
  ensureClubMedical(club);
  const physioChance = getPhysioRecoveryExtraChance(club);
  const players = Array.isArray(club.players) ? club.players : [];
  players.forEach((p) => {
    if (!p?.injury) return;
    if (typeof p.injury.matchesRemaining !== 'number') return;
    if (p.injury.matchesRemaining <= 0) return;
    p.injury.matchesRemaining = Math.max(0, p.injury.matchesRemaining - 1);
    if (p.injury.matchesRemaining > 0 && Math.random() < physioChance) {
      p.injury.matchesRemaining = Math.max(0, p.injury.matchesRemaining - 1);
    }
    if (p.injury.matchesRemaining === 0) {
      p.injury = null;
    }
  });
}

function progressSanctionsForClub(club) {
  const players = Array.isArray(club.players) ? club.players : [];
  players.forEach((p) => {
    if (!p?.suspension) return;
    if (typeof p.suspension.matchesRemaining !== 'number') return;
    if (p.suspension.matchesRemaining <= 0) return;
    p.suspension.matchesRemaining = Math.max(0, p.suspension.matchesRemaining - 1);
    if (p.suspension.matchesRemaining === 0) {
      p.suspension = null;
    }
  });
}

function generateRandomInjury(riskMult = 1.0, age = null, fitness = 0.9) {
  // Si el riesgo es alto (poca energía/forma mala/edad…), aumenta la probabilidad de lesión más seria.
  let bias = 0;
  if (riskMult >= 1.6) bias += 0.10;
  if (riskMult >= 2.2) bias += 0.08;
  if (fitness < 0.75) bias += 0.08;
  if (Number.isFinite(age) && age >= 33) bias += 0.05;

  let roll = Math.random();
  roll = clamp(roll + bias, 0, 1);

  if (roll < 0.55) return { type: 'Molestias', matchesRemaining: 1 };
  if (roll < 0.85) return { type: 'Distensión', matchesRemaining: 2 };
  return { type: 'Rotura fibrilar', matchesRemaining: 4 };
}

function getMedicalInjuryModifier(club) {
  ensureClubMedical(club);
  const lvl = club.medical?.centerLevel || 1;
  // mejor centro => menos lesiones
  if (lvl >= 4) return 0.65;
  if (lvl === 3) return 0.75;
  if (lvl === 2) return 0.88;
  return 1.0;
}

function getPhysioRecoveryExtraChance(club) {
  ensureClubMedical(club);
  const lvl = club.medical?.physioLevel || 1;
  if (lvl >= 4) return 0.45;
  if (lvl === 3) return 0.30;
  if (lvl === 2) return 0.18;
  return 0.08;
}

function applyCardsForPlayer(player, severity) {
  // severity: 1 amarilla, 2 roja directa
  if (!player) return;
  player.yellowCards = Number(player.yellowCards || 0);
  player.redCards = Number(player.redCards || 0);

  if (severity >= 2) {
    player.redCards += 1;
    player.suspension = { type: 'Roja directa', matchesRemaining: 1 };
    return;
  }

  player.yellowCards += 1;
  if (player.yellowCards >= 5) {
    player.yellowCards = 0;
    player.suspension = { type: 'Acumulación amarillas', matchesRemaining: 1 };
  }
}

function recordCardEvent(events, clubId, playerId, type, minute) {
  events.push({
    type,
    clubId,
    playerId,
    minute,
  });
}

// ------------------------------------------------
// Helpers de táctica/fuerza (venían en ui.js)
// ------------------------------------------------

function getClubStrengthProfile(club, isHome) {
  ensureClubTactics(club);

  const players =
    Array.isArray(club.players) && club.players.length > 0
      ? club.players
      : null;

  let lineupPlayers = [];
  if (players && Array.isArray(club.lineup) && club.lineup.length > 0) {
    const lineupSet = new Set(club.lineup);
    lineupPlayers = players.filter(
      (p) => lineupSet.has(p.id) && !isPlayerUnavailable(p)
    );
  }

  // fallback: si no hay lineup, usar los mejores disponibles
  if (!lineupPlayers || lineupPlayers.length === 0) {
    lineupPlayers = (players || []).filter((p) => p && p.id && !isPlayerUnavailable(p)).slice(0, 11);
  }

  const avgOverall =
    lineupPlayers.length > 0
      ? lineupPlayers.reduce((acc, p) => acc + (p.overall || 50), 0) /
        lineupPlayers.length
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

  if (isHome) {
    attack += 1;
  }

  return { attack, defense };
}

function getTacticalAggression(club) {
  ensureClubTactics(club);
  const t = club.alignment || {};
  let factor = 1.0;

  if (t.mentality === 'OFFENSIVE') factor += 0.15;
  else if (t.mentality === 'DEFENSIVE') factor -= 0.1;

  if (t.pressure === 'HIGH') factor += 0.2;
  else if (t.pressure === 'LOW') factor -= 0.1;

  return Math.max(0.7, Math.min(1.4, factor));
}