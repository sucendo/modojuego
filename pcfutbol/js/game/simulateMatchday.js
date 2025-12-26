// js/game/simulateMatchday.js
//
// Lógica de simulación (sin DOM). Mutará GameState.
// La UI decide cómo refrescar vistas.

import {
  GameState,
  recomputeLeagueTable,
  applyStatsForFixtures,
  advanceToNextSeason,
} from '../state.js';

import { ensureClubTactics, isPlayerUnavailable, isPlayerInjuredNow } from './utils/index.js';

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampN(x, a, b) {
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

/**
 * Fallback local: aplicar estadísticas persistentes a jugadores a partir de los fixtures.
 * Esto evita que la UI de estadísticas quede vacía si state.applyStatsForFixtures falla
 * (por ejemplo por cambios de formato en events/substitutions).
 */
function applyStatsForFixturesFallback(fixtures, season) {
  const arr = Array.isArray(fixtures) ? fixtures : [];
  const seasonNum = Number(season || 1);
  const seasonKey = String(seasonNum);

  arr.forEach((fx) => {
    if (!fx || fx.__statsApplied) return;
    // Solo si hay equipos
    const home = getClubById(fx.homeClubId);
    const away = getClubById(fx.awayClubId);
    if (!home || !away) {
      fx.__statsApplied = true;
      return;
    }

    const md = Number(fx.matchday || GameState.currentDate?.matchday || 1);

    // Procesar ambos lados
    const processSide = (club, opponent, isHome) => {
      const players = Array.isArray(club.players) ? club.players : [];
      const xiIds = (isHome ? fx.homeLineupIds : fx.awayLineupIds) || [];
      const xiSet = new Set(Array.isArray(xiIds) ? xiIds : []);

      const minutesById = computeMinutesForClubInFixture(fx, isHome);

      const goalsByPlayer = buildEventCountMap(fx, 'GOAL', club.id);
      const yellowsByPlayer = buildEventCountMap(fx, 'YELLOW_CARD', club.id);
      const redsByPlayer = buildEventCountMap(fx, 'RED_CARD', club.id);

      players.forEach((p) => {
        if (!p || p.id == null) return;

        // Asegurar contenedores
        if (!p.stats || typeof p.stats !== 'object') p.stats = {};
        if (!p.stats[seasonKey] || typeof p.stats[seasonKey] !== 'object') {
          p.stats[seasonKey] = { apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, yellows: 0, reds: 0 };
        }
        if (!p.statsByMatchday || typeof p.statsByMatchday !== 'object') p.statsByMatchday = {};
        if (!Array.isArray(p.statsByMatchday[seasonKey])) p.statsByMatchday[seasonKey] = [];

        const mins = Number(minutesById.get(p.id) || 0);
        if (mins <= 0) return;

        const st = p.stats[seasonKey];
        st.apps += 1;
        if (xiSet.has(p.id)) st.starts += 1;
        st.minutes += mins;

        const pid = String(p.id);
        const g = goalsByPlayer.get(pid) || 0;
        const y = yellowsByPlayer.get(pid) || 0;
        const r = redsByPlayer.get(pid) || 0;

        st.goals += g;
        st.yellows += y;
        st.reds += r;

        p.statsByMatchday[seasonKey].push({
          season: seasonNum,
          matchday: md,
          opponentId: opponent.id,
          opponentName: opponent.name || opponent.shortName || opponent.id,
          isHome: !!isHome,
          minutes: mins,
          goals: g,
          assists: 0,
          yellows: y,
          reds: r,
        });
      });
    };

    processSide(home, away, true);
    processSide(away, home, false);

    fx.__statsApplied = true;
  });
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

    const mfrac = clampN(mins / 90, 0, 1);
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
  const form = (player?.form != null && Number.isFinite(Number(player.form))) ? clampN(Number(player.form), -3, 3) : 0;
  // Fatiga (0..100)
  const fat = clampN(Number(player?.fatigue || 0), 0, 100);
  // Minutos de exposición
  const m = clampN(Number(minutesPlayed || 90) / 90, 0, 1);
  // Días desde el partido anterior (si hay)
  const rd = clampN(Number(restDays || 7), 1, 14);
  // Edad
  const age = getPlayerAgeAtUTCDate(player, nowDateUTC);

  // Energía baja => sube mucho el riesgo
  // Por debajo de 0.85 empieza a penalizar fuerte.
  const energyPenalty = fit < 0.85 ? (0.85 - fit) / 0.85 : 0; // 0..1 aprox
  const energyMult = 1 + 1.8 * clampN(energyPenalty, 0, 1);     // hasta ~2.8

  // Fatiga acumulada alta => sube riesgo
  const fatiguePenalty = fat > 45 ? (fat - 45) / 55 : 0;       // 0..1
  const fatigueMult = 1 + 0.55 * clampN(fatiguePenalty, 0, 1);  // hasta ~1.55

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
  const intensityMult = clampN(0.90 + 0.25 * (cardAgg - 1.0), 0.75, 1.25);

  const mult = energyMult * fatigueMult * formMult * restMult * ageMult * minutesMult * intensityMult;
  return clampN(mult, 0.6, 3.0);
}

function getRecoveryTarget(daysRest, age) {
  // Usuario: con 7 días -> ~95%
  // Fórmula base: 0.65 + 0.05*días, cap a 0.95
  let t = 0.65 + 0.05 * clampN(daysRest, 0, 14);
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

  const restDays = clampN(daysUntilNext ?? GAME_CALENDAR.DAYS_PER_MATCHDAY, 1, 14);

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
      const m = clampN(mins / 90, 0, 1);
      const agePenalty = Number.isFinite(age) && age > 30 ? (age - 30) * 0.002 : 0;
      const loss = clampN(0.32 * m + agePenalty, 0, 0.55);
      p.fitness = clamp01(clamp01(p.fitness) - loss);

      // 2) Recuperación hasta un objetivo según días de descanso.
      const target = getRecoveryTarget(restDays, age);
      if (p.fitness < target) p.fitness = target;

      // 3) Forma: +15% aprox -> +1.0 si juega 90' (rango -3..+3), escalado por minutos.
      const deltaForm = 1.0 * m;
      p.form = clampN(p.form + deltaForm, -3, 3);
    } else {
      // No jugó: recupera más y la forma tiende suavemente a 0.
      const ageAdj = Number.isFinite(age) && age > 30 ? (age - 30) * 0.003 : 0;
      const restTarget = clamp01(Math.min(0.99, getRecoveryTarget(restDays, age) + 0.04 - ageAdj));
      if (p.fitness < restTarget) p.fitness = restTarget;

      // Reversión a 0 si no participa
      p.form = p.form + (0 - p.form) * 0.10;
      p.form = clampN(p.form, -3, 3);
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
  const _seasonForStats = GameState.currentDate.season || 1;
  let _statsApplied = false;

  if (typeof applyStatsForFixtures === 'function') {
    try {
      applyStatsForFixtures(currentFixtures, _seasonForStats);
      _statsApplied = true;
    } catch (e) {
      // No bloqueamos la simulación por un fallo de stats
      console.warn('No se pudieron aplicar estadísticas (state.js). Usando fallback local.', e);
    }
  }

  if (!_statsApplied) {
    applyStatsForFixturesFallback(currentFixtures, _seasonForStats);
  }
  
  // Simular otras ligas (calendario sincronizado)
  simulateWorldLeaguesMatchday(GameState.currentDate.matchday);

  recomputeLeagueTable();


  const maxMd =
    GameState.competition?.maxMatchday ||
    Math.max(...fixtures.map((f) => f.matchday || 1));

  if (GameState.currentDate.matchday < maxMd) {
    GameState.currentDate.matchday += 1;
  } else {
    // Última jornada: arrancar nueva temporada (calendario + stats)
    advanceToNextSeason();
  }
}


// ----------------------------------------
// Mundo: simular otras ligas en paralelo
// (No usa el motor completo: resultados rápidos, suficientes para mantener el calendario coherente)
// ----------------------------------------

function simulateWorldLeaguesMatchday(matchday) {
  const worldLeagues = GameState.world?.leagues;
  if (!Array.isArray(worldLeagues) || worldLeagues.length === 0) return;

  const md = Number(matchday || 1);
  const season = GameState.currentDate?.season || 1;

  worldLeagues.forEach((ls) => {
    if (!ls || !Array.isArray(ls.fixtures) || !Array.isArray(ls.clubs)) return;

    if (!ls.currentDate || typeof ls.currentDate !== 'object') {
      ls.currentDate = { season, matchday: 1 };
    }
    if (ls.currentDate.season == null) ls.currentDate.season = season;

    const maxMd = Number(ls.competition?.maxMatchday || 0) || computeMaxMatchday(ls.fixtures);
    if (maxMd <= 0) return;
    if (md > maxMd) return; // liga terminada

    const toPlay = ls.fixtures.filter((f) => (f?.matchday || 1) === md && !f.played);
    if (toPlay.length === 0) {
      ls.currentDate.matchday = Math.min(Math.max(ls.currentDate.matchday || 1, md + 1), maxMd);
      return;
    }

    toPlay.forEach((fx) => {
      simulateQuickWorldFixture(fx, ls);
      fx.played = true;
    });

    ls.currentDate.matchday = Math.min(md + 1, maxMd);
  });
}

function computeMaxMatchday(fixtures) {
  const arr = Array.isArray(fixtures) ? fixtures : [];
  let mx = 0;
  for (const f of arr) {
    const md = Number(f?.matchday || 0);
    if (md > mx) mx = md;
  }
  return mx || 1;
}

function simulateQuickWorldFixture(fx, ls) {
  if (!fx) return;

  const clubs = ls.clubs || [];
  const home = clubs.find((c) => c?.id === fx.homeClubId);
  const away = clubs.find((c) => c?.id === fx.awayClubId);
  if (!home || !away) {
    fx.homeGoals = fx.homeGoals ?? 0;
    fx.awayGoals = fx.awayGoals ?? 0;
    fx.events = Array.isArray(fx.events) ? fx.events : [];
    return;
  }

  const homeXI = wPickBestXI(home);
  const awayXI = wPickBestXI(away);
  fx.homeLineupIds = homeXI.map((p) => p.id);
  fx.awayLineupIds = awayXI.map((p) => p.id);
  fx.substitutions = [];

  const homeStr = wAvgOverall(homeXI);
  const awayStr = wAvgOverall(awayXI);

  const homeLambda = wClamp(1.15 + (homeStr - awayStr) / 22 + 0.15, 0.2, 3.2);
  const awayLambda = wClamp(1.00 + (awayStr - homeStr) / 24, 0.1, 2.8);

  const hg = wPoisson(homeLambda);
  const ag = wPoisson(awayLambda);

  fx.homeGoals = hg;
  fx.awayGoals = ag;
  fx.events = [];
  
  // IMPORTANTE:
  // En ligas del mundo se simulaba "rápido" y solo quedaba el marcador.
  // Reutilizamos el generador completo de estadísticas para disponer de:
  //  - fx.teamStats (posesión/pases/distancia/etc.)
  //  - fx.playerStatsById (para detalle y agregaciones)
  // Debe hacerse después de fijar XI y eventos (goles/tarjetas...).

  const pickMinute = wCreateFixtureMinutePicker();

  for (let i = 0; i < hg; i++) {
    const scorer = wPickGoalScorer(homeXI);
    if (!scorer) break;
    fx.events.push({ type: 'GOAL', minute: pickMinute(), clubId: home.id, playerId: scorer.id });
  }

  // Genera teamStats + playerStatsById coherentes con los eventos
  generateAdvancedStatsForFixture(fx, home, away);

  for (let i = 0; i < ag; i++) {
    const scorer = wPickGoalScorer(awayXI);
    if (!scorer) break;
    fx.events.push({ type: 'GOAL', minute: pickMinute(), clubId: away.id, playerId: scorer.id });
  }

  fx.events.sort((a, b) => (a.minute || 0) - (b.minute || 0));
  
  wApplyWorldPlayerStats(ls, fx);
}

function wPickBestXI(club) {
  const players = Array.isArray(club?.players) ? club.players : [];
  const sorted = players.filter(Boolean).slice().sort((a, b) => Number(b?.overall || 0) - Number(a?.overall || 0));
  return sorted.slice(0, 11);
}

function wAvgOverall(list) {
  const arr = Array.isArray(list) ? list : [];
  if (!arr.length) return 60;
  const sum = arr.reduce((acc, p) => acc + Number(p?.overall || 0), 0);
  return sum / arr.length;
}

function wClamp(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function wPoisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= Math.random();
  } while (p > L && k < 12);
  return Math.max(0, k - 1);
}

function wPickGoalScorer(xi) {
  const players = Array.isArray(xi) ? xi : [];
  if (!players.length) return null;

  const preferred = players.filter((p) => {
    const pos = String(p?.position || '').toUpperCase();
    return ['ST','CF','LW','RW','LM','RM','CAM','AM','SS','DC','EI','ED','MP','MCO','MCA'].includes(pos);
  });
  const pool = preferred.length ? preferred : players;

  const weights = pool.map((p) => Math.max(20, Number(p?.overall || 60)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function wCreateFixtureMinutePicker() {
  // minutos 1..90 con ligera preferencia por 2ª parte (más “realista”)
  return () => {
    const r = Math.random();
    if (r < 0.55) return 1 + Math.floor(Math.random() * 45);
    return 46 + Math.floor(Math.random() * 45);
  };
}

// -------------------------------------------------
// Stats rápidas para el "mundo" (otras ligas)
// -------------------------------------------------

function wEnsurePlayerSeasonContainers(player, seasonKey) {
  if (!player) return;
  if (!player.stats || typeof player.stats !== 'object') player.stats = {};
  if (!player.stats[seasonKey] || typeof player.stats[seasonKey] !== 'object') {
    player.stats[seasonKey] = {
      apps: 0,
      starts: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      yellows: 0,
      reds: 0,
    };
  }
  if (!player.statsByMatchday || typeof player.statsByMatchday !== 'object') player.statsByMatchday = {};
  if (!Array.isArray(player.statsByMatchday[seasonKey])) player.statsByMatchday[seasonKey] = [];
}

function wApplyWorldPlayerStats(ls, fx) {
  if (!ls || !fx) return;

  const season = Number(ls.currentDate?.season || fx.season || 1);
  const seasonKey = String(season);
  const matchday = Number(fx.matchday || ls.currentDate?.matchday || 1);

  const clubs = ls.clubs || [];
  const home = clubs.find((c) => c?.id === fx.homeClubId);
  const away = clubs.find((c) => c?.id === fx.awayClubId);
  if (!home || !away) return;

  const homePlayers = (home.players || []);
  const awayPlayers = (away.players || []);
  const homeById = new Map(homePlayers.map((p) => [p?.id, p]));
  const awayById = new Map(awayPlayers.map((p) => [p?.id, p]));

  const homeXIIds = Array.isArray(fx.homeLineupIds) ? fx.homeLineupIds : [];
  const awayXIIds = Array.isArray(fx.awayLineupIds) ? fx.awayLineupIds : [];

  // Contadores de goles por jugador
  const goalCount = new Map();
  (fx.events || []).forEach((ev) => {
    if (ev?.type !== 'GOAL') return;
    const pid = ev?.playerId;
    if (!pid) return;
    goalCount.set(pid, (goalCount.get(pid) || 0) + 1);
  });

  // HOME XI
  homeXIIds.forEach((pid) => {
    const p = homeById.get(pid);
    if (!p) return;
    wEnsurePlayerSeasonContainers(p, seasonKey);

    const st = p.stats[seasonKey];
    st.apps += 1;
    st.starts += 1;
    st.minutes += 90;

    const g = goalCount.get(pid) || 0;
    st.goals += g;

    // fila por jornada
    p.statsByMatchday[seasonKey].push({
      season,
      matchday,
      opponentId: away.id,
      opponentName: away.name || away.shortName || away.id,
      isHome: true,
      minutes: 90,
      goals: g,
      assists: 0,
      yellows: 0,
      reds: 0,
    });
  });

  // AWAY XI
  awayXIIds.forEach((pid) => {
    const p = awayById.get(pid);
    if (!p) return;
    wEnsurePlayerSeasonContainers(p, seasonKey);

    const st = p.stats[seasonKey];
    st.apps += 1;
    st.starts += 1;
    st.minutes += 90;

    const g = goalCount.get(pid) || 0;
    st.goals += g;

    p.statsByMatchday[seasonKey].push({
      season,
      matchday,
      opponentId: home.id,
      opponentName: home.name || home.shortName || home.id,
      isHome: false,
      minutes: 90,
      goals: g,
      assists: 0,
      yellows: 0,
      reds: 0,
    });
  });
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

function getPotentialAssistersForClub(club, lineupIds) {
  const ids = Array.isArray(lineupIds) ? lineupIds : [];
  const players = (club?.players || []).filter((p) => ids.includes(p.id));
  // Preferir mediapuntas/extremos/CM
  const score = (p) => {
    const pos = (p?.pos || '').toUpperCase();
    if (pos === 'CAM') return 6;
    if (pos === 'CM') return 5;
    if (pos === 'RW' || pos === 'LW') return 5;
    if (pos === 'RM' || pos === 'LM') return 4;
    if (pos === 'CF') return 4;
    if (pos === 'ST') return 2;
    if (pos === 'CDM') return 2;
    return 1;
  };
  return players
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, 10);
}

function pickRandomAssister(candidates, scorerId) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  // Evitar que el asistente sea el goleador
  const pool = candidates.filter((p) => p?.id && p.id !== scorerId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
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

  // Meta + estadísticas avanzadas (para UI nueva)
  attachFixtureMeta(fx, homeClub, awayClub);
  generateAdvancedStatsForFixture(fx, homeClub, awayClub);
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

  const addGoal = (clubId, playerId, assistPlayerId = null) => {
    events.push({
      type: 'GOAL',
      clubId,
      playerId,
      assistPlayerId: assistPlayerId || null,
      minute: pickMinute(),
    });
  };

  const homeScorers = getPotentialScorersForClub(homeClub, fx.homeLineupIds);
  const awayScorers = getPotentialScorersForClub(awayClub, fx.awayLineupIds);
  const homeAssisters = getPotentialAssistersForClub(homeClub, fx.homeLineupIds);
  const awayAssisters = getPotentialAssistersForClub(awayClub, fx.awayLineupIds);

  for (let i = 0; i < (fx.homeGoals || 0); i++) {
    const p = pickRandomScorer(homeScorers);
    const a = pickRandomAssister(homeAssisters, p?.id);
    addGoal(fx.homeClubId, p?.id || null, a?.id || null);
  }
  for (let i = 0; i < (fx.awayGoals || 0); i++) {
    const p = pickRandomScorer(awayScorers);
    const a = pickRandomAssister(awayAssisters, p?.id);
    addGoal(fx.awayClubId, p?.id || null, a?.id || null);
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
   const ids = Array.isArray(lineupIds) ? lineupIds : [];
   const players = (club?.players || []).filter((p) => ids.includes(p.id));
   // Preferir delanteros
   const score = (p) => {
     const pos = (p?.pos || '').toUpperCase();
     if (pos === 'ST') return 6;
     if (pos === 'CF') return 5;
     if (pos === 'RW' || pos === 'LW') return 4;
     if (pos === 'CAM') return 3;
     if (pos === 'CM') return 2;
     return 1;
   };
   return players
     .slice()
     .sort((a, b) => score(b) - score(a))
     .slice(0, 10);
 }
  
 function generateDisciplineAndInjuries(events, fx, homeClub, awayClub, pickMinute) {
   // Amarillas / rojas
   const addCard = (clubId, playerId, card) => {
     events.push({
       type: card,
       clubId,
       playerId,
       minute: pickMinute(),
     });
   };
 
   const addInjury = (clubId, playerId) => {
     events.push({
       type: 'INJURY',
       clubId,
       playerId,
       minute: pickMinute(),
     });
   };
 
   const homeLineup = (homeClub?.players || []).filter((p) => fx.homeLineupIds.includes(p.id));
   const awayLineup = (awayClub?.players || []).filter((p) => fx.awayLineupIds.includes(p.id));
 
   const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
 
   // Número de tarjetas aproximado
   const totalYellows = 2 + Math.floor(Math.random() * 6); // 2..7
   const totalReds = Math.random() < 0.15 ? 1 : 0;
 
   for (let i = 0; i < totalYellows; i++) {
     const isHome = Math.random() < 0.5;
     const p = randomFrom(isHome ? homeLineup : awayLineup);
     if (p) addCard(isHome ? fx.homeClubId : fx.awayClubId, p.id, 'YELLOW');
   }
 
   for (let i = 0; i < totalReds; i++) {
     const isHome = Math.random() < 0.5;
     const p = randomFrom(isHome ? homeLineup : awayLineup);
     if (p) addCard(isHome ? fx.homeClubId : fx.awayClubId, p.id, 'RED');
   }
 
   // Lesiones (pocas)
   const totalInjuries = Math.random() < 0.20 ? 1 : 0;
   for (let i = 0; i < totalInjuries; i++) {
     const isHome = Math.random() < 0.5;
     const p = randomFrom(isHome ? homeLineup : awayLineup);
     if (p) addInjury(isHome ? fx.homeClubId : fx.awayClubId, p.id);
   }
 }
 
 function generateSubstitutions(events, fx, homeClub, awayClub, pickMinute) {
   // Guardamos sustituciones en el fixture para minutos reales y cronología
   fx.substitutions = fx.substitutions || [];
 
   const maybeMakeSubs = (club, isHome) => {
     const clubId = isHome ? fx.homeClubId : fx.awayClubId;
     const lineupIds = isHome ? fx.homeLineupIds : fx.awayLineupIds;
     const benchIds = isHome ? fx.homeBenchIds : fx.awayBenchIds;
 
     const lineup = (club?.players || []).filter((p) => lineupIds.includes(p.id));
     const bench = (club?.players || []).filter((p) => benchIds.includes(p.id));
 
     if (lineup.length === 0 || bench.length === 0) return;
 
     const subs = Math.random() < 0.75 ? 3 : 2; // 2-3 por equipo
     const usedOut = new Set();
     const usedIn = new Set();
 
     for (let i = 0; i < subs; i++) {
       const out = lineup[Math.floor(Math.random() * lineup.length)];
       const inn = bench[Math.floor(Math.random() * bench.length)];
       if (!out || !inn) continue;
       if (usedOut.has(out.id) || usedIn.has(inn.id)) continue;
       usedOut.add(out.id);
       usedIn.add(inn.id);
       const minute = 50 + Math.floor(Math.random() * 40); // 50..89
       fx.substitutions.push({ clubId, outPlayerId: out.id, inPlayerId: inn.id, minute });
       events.push({
         type: 'SUB',
         clubId,
         outPlayerId: out.id,
         inPlayerId: inn.id,
         minute,
       });
     }
   };
 
   maybeMakeSubs(homeClub, true);
   maybeMakeSubs(awayClub, false);
 }
 
// ---------------------------
// META DEL PARTIDO (estadio/aforo/asistencia/clima/hora/added time)
// ---------------------------
function attachFixtureMeta(fx, homeClub, awayClub) {
  fx.meta = fx.meta || {};

  const stadiumName =
    fx.meta.stadiumName ||
    homeClub?.stadium?.name ||
    homeClub?.stadiumName ||
    'Estadio';
  const stadiumCapacity =
    Number(fx.meta.stadiumCapacity) ||
    Number(homeClub?.stadium?.capacity) ||
    Number(homeClub?.capacity) ||
    40000;

  // Hora (HH:MM) simple
  const kickoffTime = fx.meta.kickoffTime || (Math.random() < 0.6 ? '21:00' : '18:30');

  // Clima y estado del césped
  const weatherPool = ['Soleado', 'Nublado', 'Lluvia', 'Viento', 'Tormenta'];
  const pitchPool = ['Perfecto', 'Bueno', 'Irregular', 'Pesado'];
  const weather = fx.meta.weather || weatherPool[Math.floor(Math.random() * weatherPool.length)];
  const pitchState = fx.meta.pitchState || pitchPool[Math.floor(Math.random() * pitchPool.length)];

  // Tiempo añadido (para cronología)
  const addedTime = fx.meta.addedTime || { firstHalf: 1 + Math.floor(Math.random() * 3), secondHalf: 2 + Math.floor(Math.random() * 4) };

  // Asistencia (estimación según aforo + atractivo + rendimiento)
  const baseFill = 0.55 + Math.random() * 0.35; // 55%..90%
  const derbyBoost = homeClub?.rivals?.includes?.(awayClub?.id) ? 0.08 : 0;
  const fill = Math.min(0.98, baseFill + derbyBoost);
  const attendance = fx.meta.attendance || Math.max(2000, Math.floor(stadiumCapacity * fill));

  fx.meta.stadiumName = stadiumName;
  fx.meta.stadiumCapacity = stadiumCapacity;
  fx.meta.kickoffTime = kickoffTime;
  fx.meta.weather = weather;
  fx.meta.pitchState = pitchState;
  fx.meta.addedTime = addedTime;
  fx.meta.attendance = attendance;
}

// ---------------------------
// ESTADÍSTICAS AVANZADAS (team + players)
// Deben concordar con eventos (goles/tarjetas/sustituciones)
// ---------------------------
function generateAdvancedStatsForFixture(fx, homeClub, awayClub) {
  // Evitar recalcular si ya existe
  if (fx.teamStats && fx.playerStatsById) return;

  const safeNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const homeGoals = safeNum(fx.homeGoals, 0);
  const awayGoals = safeNum(fx.awayGoals, 0);

  // Fuerza relativa por overall medio del XI (si existe)
  const avgXI = (club, ids) => {
    const list = (club?.players || []).filter((p) => ids?.includes?.(p.id));
    if (!list.length) return 60;
    const sum = list.reduce((acc, p) => acc + safeNum(p.overall, 60), 0);
    return sum / list.length;
  };

  const homeXIOverall = avgXI(homeClub, fx.homeLineupIds);
  const awayXIOverall = avgXI(awayClub, fx.awayLineupIds);

  const rel = clamp((homeXIOverall - awayXIOverall) / 25, -0.35, 0.35);

  // Posesión: base 50 con sesgo por fuerza + localía
  let homePoss = 50 + rel * 18 + 3;
  homePoss = clamp(homePoss + (Math.random() * 6 - 3), 35, 65);
  const awayPoss = 100 - homePoss;

  // Disparos: base según partido y posesión
  const baseShots = 22 + Math.floor(Math.random() * 10); // 22..31
  let homeShots = clamp(Math.round(baseShots * (homePoss / 100) + rel * 4), 6, 22);
  let awayShots = clamp(baseShots - homeShots, 6, 22);

  // A puerta: mínimo goles+1 (con variación)
  let homeSOT = clamp(Math.round(homeShots * (0.26 + Math.random() * 0.12)), 1, homeShots);
  let awaySOT = clamp(Math.round(awayShots * (0.26 + Math.random() * 0.12)), 1, awayShots);
  homeSOT = Math.max(homeSOT, homeGoals);
  awaySOT = Math.max(awaySOT, awayGoals);

  // Ajustar para que haya paradas plausibles
  const homeSaves = Math.max(0, awaySOT - homeGoals);
  const awaySaves = Math.max(0, homeSOT - awayGoals);

  // Bloqueados / fuera
  const splitShots = (shots, sot) => {
    const on = clamp(sot, 0, shots);
    const remaining = shots - on;
    const blocked = clamp(Math.round(remaining * (0.25 + Math.random() * 0.15)), 0, remaining);
    const off = remaining - blocked;
    return { shotsTotal: shots, shotsOnTarget: on, shotsBlocked: blocked, shotsOffTarget: off };
  };

  const homeShotSplit = splitShots(homeShots, homeSOT);
  const awayShotSplit = splitShots(awayShots, awaySOT);

  // Corners / offside / attacks
  const homeCorners = clamp(Math.round(3 + homeShots * 0.35 + Math.random() * 2), 0, 12);
  const awayCorners = clamp(Math.round(3 + awayShots * 0.35 + Math.random() * 2), 0, 12);
  const homeOffside = clamp(Math.round(1 + Math.random() * 3 + rel * 1), 0, 7);
  const awayOffside = clamp(Math.round(1 + Math.random() * 3 - rel * 1), 0, 7);

  const homeAttacks = clamp(Math.round(35 + homePoss * 0.35 + Math.random() * 10), 25, 75);
  const awayAttacks = clamp(Math.round(35 + awayPoss * 0.35 + Math.random() * 10), 25, 75);

  // Pases: depende de posesión
  const passesAttemptedHome = clamp(Math.round(350 + homePoss * 4.2 + Math.random() * 70), 320, 720);
  const passesAttemptedAway = clamp(Math.round(350 + awayPoss * 4.2 + Math.random() * 70), 320, 720);
  const passAccHome = clamp(78 + rel * 6 + Math.random() * 6, 70, 92);
  const passAccAway = clamp(78 - rel * 6 + Math.random() * 6, 70, 92);
  const passesCompletedHome = Math.round(passesAttemptedHome * (passAccHome / 100));
  const passesCompletedAway = Math.round(passesAttemptedAway * (passAccAway / 100));

  // Recuperaciones / entradas / despejes
  const homeRecoveries = clamp(Math.round(32 + Math.random() * 20 - rel * 3), 20, 65);
  const awayRecoveries = clamp(Math.round(32 + Math.random() * 20 + rel * 3), 20, 65);
  const homeTacklesWon = clamp(Math.round(4 + Math.random() * 10 - rel * 2), 1, 18);
  const awayTacklesWon = clamp(Math.round(4 + Math.random() * 10 + rel * 2), 1, 18);
  const homeTacklesLost = clamp(Math.round(homeTacklesWon * (0.7 + Math.random() * 0.8)), 0, 25);
  const awayTacklesLost = clamp(Math.round(awayTacklesWon * (0.7 + Math.random() * 0.8)), 0, 25);
  const homeClearances = clamp(Math.round(8 + Math.random() * 18 - rel * 3), 2, 40);
  const awayClearances = clamp(Math.round(8 + Math.random() * 18 + rel * 3), 2, 40);

  // Faltas y tarjetas: CONCORDAR con eventos
  const countCards = (type, clubId) =>
    (fx.events || []).filter((e) => e?.type === type && e?.clubId === clubId).length;
  const homeYellows = countCards('YELLOW', fx.homeClubId);
  const awayYellows = countCards('YELLOW', fx.awayClubId);
  const homeReds = countCards('RED', fx.homeClubId);
  const awayReds = countCards('RED', fx.awayClubId);

  const homeFouls = clamp(Math.round(8 + homeYellows * 2 + homeReds * 3 + Math.random() * 8), 5, 25);
  const awayFouls = clamp(Math.round(8 + awayYellows * 2 + awayReds * 3 + Math.random() * 8), 5, 25);

  // Distancia recorrida (km)
  const homeDistanceKm = Number((112 + Math.random() * 12).toFixed(1));
  const awayDistanceKm = Number((112 + Math.random() * 12).toFixed(1));

  // Tiempo de posesión (seg)
  const homePossTime = Math.round((homePoss / 100) * 90 * 60);
  const awayPossTime = Math.round((awayPoss / 100) * 90 * 60);

  // Córners, centros, etc.
  const homeCrossesAttempted = clamp(Math.round(10 + Math.random() * 25 + homeCorners * 0.7), 5, 45);
  const awayCrossesAttempted = clamp(Math.round(10 + Math.random() * 25 + awayCorners * 0.7), 5, 45);
  const homeCrossAcc = clamp(10 + Math.random() * 14, 5, 35);
  const awayCrossAcc = clamp(10 + Math.random() * 14, 5, 35);
  const homeCrossesCompleted = Math.round(homeCrossesAttempted * (homeCrossAcc / 100));
  const awayCrossesCompleted = Math.round(awayCrossesAttempted * (awayCrossAcc / 100));

  // Pases por zona (reparto)
  const splitPasses = (completed) => {
    const back = clamp(Math.round(completed * (0.18 + Math.random() * 0.08)), 0, completed);
    const left = clamp(Math.round(completed * (0.25 + Math.random() * 0.12)), 0, completed - back);
    const right = clamp(Math.round(completed * (0.25 + Math.random() * 0.12)), 0, completed - back - left);
    const other = completed - back - left - right;
    return { back, left, right, other };
  };

  const homePassDirs = splitPasses(passesCompletedHome);
  const awayPassDirs = splitPasses(passesCompletedAway);

  // Reparto por tipo de pase
  const splitPassTypes = (completed) => {
    const short = clamp(Math.round(completed * (0.60 + Math.random() * 0.10)), 0, completed);
    const mid = clamp(Math.round(completed * (0.28 + Math.random() * 0.10)), 0, completed - short);
    const long = completed - short - mid;
    return { short, mid, long };
  };
  const homePassTypes = splitPassTypes(passesCompletedHome);
  const awayPassTypes = splitPassTypes(passesCompletedAway);

  // Ataques avanzados
  const homeAttFinalThird = clamp(Math.round(homeAttacks * (0.18 + Math.random() * 0.12)), 3, 25);
  const awayAttFinalThird = clamp(Math.round(awayAttacks * (0.18 + Math.random() * 0.12)), 3, 25);
  const homeKeyZones = clamp(Math.round(homeAttacks * (0.20 + Math.random() * 0.15)), 3, 30);
  const awayKeyZones = clamp(Math.round(awayAttacks * (0.20 + Math.random() * 0.15)), 3, 30);
  const homeRunsToBox = clamp(Math.round(6 + Math.random() * 8 + rel * 2), 2, 25);
  const awayRunsToBox = clamp(Math.round(6 + Math.random() * 8 - rel * 2), 2, 25);

  // Guardar teamStats
  fx.teamStats = {
    home: {
      possessionPct: Number(homePoss.toFixed(0)),
      shotsTotal: homeShotSplit.shotsTotal,
      shotsOnTarget: homeShotSplit.shotsOnTarget,
      shotsOffTarget: homeShotSplit.shotsOffTarget,
      shotsBlocked: homeShotSplit.shotsBlocked,
      corners: homeCorners,
      attacks: homeAttacks,
      passesAttempted: passesAttemptedHome,
      passesCompleted: passesCompletedHome,
      passAccuracyPct: Number(passAccHome.toFixed(0)),
      recoveries: homeRecoveries,
      offsides: homeOffside,
      saves: awaySaves,
      distanceKm: homeDistanceKm,
      yellows: homeYellows,
      reds: homeReds,
      foulsCommitted: homeFouls,
      goals: homeGoals,
      goalsInBox: homeGoals, // simplificado coherente
      goalsOutBox: 0,
      assists: (fx.events || []).filter((e) => e?.type === 'GOAL' && e?.clubId === fx.homeClubId && e?.assistPlayerId).length,
      crossesAttempted: homeCrossesAttempted,
      crossesCompleted: homeCrossesCompleted,
      crossAccuracyPct: Number(homeCrossAcc.toFixed(0)),
      possessionTimeSec: homePossTime,
      passesShortCompleted: homePassTypes.short,
      passesMidCompleted: homePassTypes.mid,
      passesLongCompleted: homePassTypes.long,
      passesBackCompleted: homePassDirs.back,
      passesLeftCompleted: homePassDirs.left,
      passesRightCompleted: homePassDirs.right,
      setPiecesTaken: clamp(Math.round(10 + Math.random() * 12), 4, 30),
      passesToFinalThird: clamp(Math.round(25 + Math.random() * 35), 5, 90),
      keyPasses: clamp(Math.round(6 + Math.random() * 12), 0, 30),
      passesToBox: clamp(Math.round(4 + Math.random() * 10), 0, 25),
      attacksFinalThird: homeAttFinalThird,
      attacksKeyZones: homeKeyZones,
      runsToBox: homeRunsToBox,
      dribbles: clamp(Math.round(10 + Math.random() * 12), 0, 40),
      tacklesWon: homeTacklesWon,
      tacklesLost: homeTacklesLost,
      clearancesCompleted: clamp(Math.round(homeClearances * (0.8 + Math.random() * 0.2)), 0, 60),
      clearancesAttempted: homeClearances,
      penaltyScored: 0,
      penaltyMissed: 0,
      penaltyForced: 0,
      penaltiesCommitted: 0,
    },
    away: {
      possessionPct: Number(awayPoss.toFixed(0)),
      shotsTotal: awayShotSplit.shotsTotal,
      shotsOnTarget: awayShotSplit.shotsOnTarget,
      shotsOffTarget: awayShotSplit.shotsOffTarget,
      shotsBlocked: awayShotSplit.shotsBlocked,
      corners: awayCorners,
      attacks: awayAttacks,
      passesAttempted: passesAttemptedAway,
      passesCompleted: passesCompletedAway,
      passAccuracyPct: Number(passAccAway.toFixed(0)),
      recoveries: awayRecoveries,
      offsides: awayOffside,
      saves: homeSaves,
      distanceKm: awayDistanceKm,
      yellows: awayYellows,
      reds: awayReds,
      foulsCommitted: awayFouls,
      goals: awayGoals,
      goalsInBox: awayGoals,
      goalsOutBox: 0,
      assists: (fx.events || []).filter((e) => e?.type === 'GOAL' && e?.clubId === fx.awayClubId && e?.assistPlayerId).length,
      crossesAttempted: awayCrossesAttempted,
      crossesCompleted: awayCrossesCompleted,
      crossAccuracyPct: Number(awayCrossAcc.toFixed(0)),
      possessionTimeSec: awayPossTime,
      passesShortCompleted: awayPassTypes.short,
      passesMidCompleted: awayPassTypes.mid,
      passesLongCompleted: awayPassTypes.long,
      passesBackCompleted: awayPassDirs.back,
      passesLeftCompleted: awayPassDirs.left,
      passesRightCompleted: awayPassDirs.right,
      setPiecesTaken: clamp(Math.round(10 + Math.random() * 12), 4, 30),
      passesToFinalThird: clamp(Math.round(25 + Math.random() * 35), 5, 90),
      keyPasses: clamp(Math.round(6 + Math.random() * 12), 0, 30),
      passesToBox: clamp(Math.round(4 + Math.random() * 10), 0, 25),
      attacksFinalThird: awayAttFinalThird,
      attacksKeyZones: awayKeyZones,
      runsToBox: awayRunsToBox,
      dribbles: clamp(Math.round(10 + Math.random() * 12), 0, 40),
      tacklesWon: awayTacklesWon,
      tacklesLost: awayTacklesLost,
      clearancesCompleted: clamp(Math.round(awayClearances * (0.8 + Math.random() * 0.2)), 0, 60),
      clearancesAttempted: awayClearances,
      penaltyScored: 0,
      penaltyMissed: 0,
      penaltyForced: 0,
      penaltiesCommitted: 0,
    },
  };

  // ---------------------------
  // PLAYER STATS: minutos, pases, distancia, velocidad, tiros, etc.
  // ---------------------------
  const makeBlank = () => ({
    apps: 1,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellows: 0,
    reds: 0,
    passesAttempted: 0,
    passesCompleted: 0,
    passAccuracyPct: 0,
    passesShortCompleted: 0,
    passesMidCompleted: 0,
    passesLongCompleted: 0,
    passesBackCompleted: 0,
    passesLeftCompleted: 0,
    passesRightCompleted: 0,
    crossesAttempted: 0,
    crossesCompleted: 0,
    crossAccuracyPct: 0,
    keyPasses: 0,
    passesToBox: 0,
    shotsTotal: 0,
    shotsOnTarget: 0,
    shotsOffTarget: 0,
    shotsBlocked: 0,
    recoveries: 0,
    tacklesWon: 0,
    tacklesLost: 0,
    clearances: 0,
    offsides: 0,
    foulsCommitted: 0,
    foulsSuffered: 0,
    saves: 0,
    distanceKm: 0,
    maxSpeedKmh: 0,
    possessionTimeSec: 0,
  });

  const playerStatsById = {};

  const collectPlayers = (club, lineupIds, benchIds) => {
    const ids = new Set([...(lineupIds || []), ...(benchIds || [])].filter(Boolean));
    const players = (club?.players || []).filter((p) => ids.has(p.id));
    return players;
  };

  const homePlayers = collectPlayers(homeClub, fx.homeLineupIds, fx.homeBenchIds);
  const awayPlayers = collectPlayers(awayClub, fx.awayLineupIds, fx.awayBenchIds);

  // Minutos por jugador (según sustituciones)
  const buildMinutesMap = (clubId, lineupIds, subs) => {
    const mins = {};
    (lineupIds || []).forEach((pid) => (mins[pid] = 90));
    (subs || [])
      .filter((s) => s?.clubId === clubId)
      .forEach((s) => {
        const m = clamp(safeNum(s.minute, 70), 1, 89);
        if (mins[s.outPlayerId] == null) mins[s.outPlayerId] = 90;
        mins[s.outPlayerId] = clamp(m, 0, 90);
        mins[s.inPlayerId] = 90 - clamp(m, 0, 90);
      });
    return mins;
  };

  const homeMinutes = buildMinutesMap(fx.homeClubId, fx.homeLineupIds, fx.substitutions);
  const awayMinutes = buildMinutesMap(fx.awayClubId, fx.awayLineupIds, fx.substitutions);

  // Asignación de goles/asistencias/tarjetas por eventos
  (fx.events || []).forEach((e) => {
    if (!e) return;
    if (e.type === 'GOAL') {
      if (e.playerId) {
        playerStatsById[e.playerId] = playerStatsById[e.playerId] || makeBlank();
        playerStatsById[e.playerId].goals += 1;
      }
      if (e.assistPlayerId) {
        playerStatsById[e.assistPlayerId] = playerStatsById[e.assistPlayerId] || makeBlank();
        playerStatsById[e.assistPlayerId].assists += 1;
      }
    }
    if (e.type === 'YELLOW' && e.playerId) {
      playerStatsById[e.playerId] = playerStatsById[e.playerId] || makeBlank();
      playerStatsById[e.playerId].yellows += 1;
    }
    if (e.type === 'RED' && e.playerId) {
      playerStatsById[e.playerId] = playerStatsById[e.playerId] || makeBlank();
      playerStatsById[e.playerId].reds += 1;
    }
  });

  // Inicializar stats para todos los jugadores implicados
  [...homePlayers, ...awayPlayers].forEach((p) => {
    if (!p?.id) return;
    playerStatsById[p.id] = playerStatsById[p.id] || makeBlank();
  });

  // Asignar minutos + velocidad + distancia (proporcional a minutos)
  const assignBaseRunning = (players, minutesMap, teamDistanceKm, teamPossTimeSec) => {
    const list = players.filter((p) => p?.id);
    const totalMinutes = list.reduce((acc, p) => acc + (minutesMap[p.id] || 0), 0) || 1;
    list.forEach((p) => {
      const st = playerStatsById[p.id];
      const mins = minutesMap[p.id] || 0;
      st.minutes = mins;
      const share = mins / totalMinutes;
      // distancia
      const d = teamDistanceKm * share * (0.9 + Math.random() * 0.2);
      st.distanceKm = Number(d.toFixed(2));
      // velocidad máxima (GK menor)
      const pos = (p.pos || '').toUpperCase();
      const base = pos === 'GK' ? 26 : pos === 'CB' ? 31 : pos === 'CDM' ? 32 : 34;
      st.maxSpeedKmh = Number((base + Math.random() * 3.5).toFixed(1));
      // tiempo de posesión
      st.possessionTimeSec = Math.round(teamPossTimeSec * share);
    });
  };

  assignBaseRunning(homePlayers, homeMinutes, homeDistanceKm, homePossTime);
  assignBaseRunning(awayPlayers, awayMinutes, awayDistanceKm, awayPossTime);

  // Pases: repartir completados e intentados según posición y minutos
  const allocatePasses = (players, team, teamPassAttempted, teamPassCompleted) => {
    const weights = players.map((p) => {
      const pos = (p.pos || '').toUpperCase();
      let w = 1;
      if (pos === 'CB' || pos === 'LB' || pos === 'RB' || pos === 'CDM') w = 1.3;
      if (pos === 'CM') w = 1.5;
      if (pos === 'CAM') w = 1.4;
      if (pos === 'RW' || pos === 'LW' || pos === 'RM' || pos === 'LM') w = 1.0;
      if (pos === 'ST' || pos === 'CF') w = 0.8;
      if (pos === 'GK') w = 0.6;
      const mins = (playerStatsById[p.id]?.minutes || 0) / 90;
      return w * clamp(mins, 0.15, 1);
    });
    const sumW = weights.reduce((a, b) => a + b, 0) || 1;

    let remainingA = teamPassAttempted;
    let remainingC = teamPassCompleted;

    players.forEach((p, idx) => {
      const st = playerStatsById[p.id];
      const share = weights[idx] / sumW;
      const att = idx === players.length - 1 ? remainingA : Math.round(teamPassAttempted * share);
      const comp = idx === players.length - 1 ? remainingC : Math.round(teamPassCompleted * share);
      remainingA -= att;
      remainingC -= comp;

      st.passesAttempted += att;
      st.passesCompleted += comp;

      // repartir por tipos/direcciones aproximado
      const short = Math.round(comp * (0.60 + Math.random() * 0.10));
      const mid = Math.round(comp * (0.25 + Math.random() * 0.10));
      const long = Math.max(0, comp - short - mid);
      st.passesShortCompleted += short;
      st.passesMidCompleted += mid;
      st.passesLongCompleted += long;

      const back = Math.round(comp * (0.18 + Math.random() * 0.08));
      const left = Math.round(comp * (0.25 + Math.random() * 0.12));
      const right = Math.round(comp * (0.25 + Math.random() * 0.12));
      const adjust = back + left + right;
      const fix = Math.max(0, comp - adjust);
      st.passesBackCompleted += clamp(back, 0, comp);
      st.passesLeftCompleted += clamp(left, 0, comp);
      st.passesRightCompleted += clamp(right + fix, 0, comp);

      // key passes / to box (más ofensivos)
      const pos = (p.pos || '').toUpperCase();
      const offensiveBoost = pos === 'CAM' || pos === 'RW' || pos === 'LW' || pos === 'CF' || pos === 'ST' ? 1.2 : 0.8;
      st.keyPasses += clamp(Math.round((comp / 60) * offensiveBoost * (0.7 + Math.random() * 0.8)), 0, 8);
      st.passesToBox += clamp(Math.round((comp / 90) * offensiveBoost * (0.6 + Math.random() * 0.8)), 0, 6);
    });
  };

  allocatePasses(homePlayers, fx.teamStats.home, passesAttemptedHome, passesCompletedHome);
  allocatePasses(awayPlayers, fx.teamStats.away, passesAttemptedAway, passesCompletedAway);

  // Centros (solo bandas principalmente)
  const allocateCrosses = (players, teamCrossAttempted, teamCrossCompleted) => {
    const wFor = (p) => {
      const pos = (p.pos || '').toUpperCase();
      let w = 0.4;
      if (pos === 'RW' || pos === 'LW' || pos === 'RM' || pos === 'LM' || pos === 'RWB' || pos === 'LWB') w = 1.6;
      if (pos === 'RB' || pos === 'LB') w = 1.2;
      const mins = (playerStatsById[p.id]?.minutes || 0) / 90;
      return w * clamp(mins, 0.15, 1);
    };
    const list = players.slice();
    const weights = list.map(wFor);
    const sumW = weights.reduce((a, b) => a + b, 0) || 1;
    let remA = teamCrossAttempted;
    let remC = teamCrossCompleted;
    list.forEach((p, idx) => {
      const st = playerStatsById[p.id];
      const share = weights[idx] / sumW;
      const att = idx === list.length - 1 ? remA : Math.round(teamCrossAttempted * share);
      const comp = idx === list.length - 1 ? remC : Math.round(teamCrossCompleted * share);
      remA -= att;
      remC -= comp;
      st.crossesAttempted += att;
      st.crossesCompleted += comp;
      if (st.crossesAttempted > 0) {
        st.crossAccuracyPct = Number(((st.crossesCompleted / st.crossesAttempted) * 100).toFixed(0));
      }
    });
  };

  allocateCrosses(homePlayers, homeCrossesAttempted, homeCrossesCompleted);
  allocateCrosses(awayPlayers, awayCrossesAttempted, awayCrossesCompleted);

  // Recuperaciones / entradas / despejes / faltas / offsides / paradas
  const allocateDefensive = (players, teamRecoveries, teamTacklesWon, teamTacklesLost, teamClearances) => {
    const wFor = (p) => {
      const pos = (p.pos || '').toUpperCase();
      let w = 1;
      if (pos === 'CB') w = 1.6;
      if (pos === 'LB' || pos === 'RB') w = 1.3;
      if (pos === 'CDM') w = 1.4;
      if (pos === 'CM') w = 1.1;
      if (pos === 'GK') w = 0.3;
      const mins = (playerStatsById[p.id]?.minutes || 0) / 90;
      return w * clamp(mins, 0.15, 1);
    };
    const list = players.slice();
    const weights = list.map(wFor);
    const sumW = weights.reduce((a, b) => a + b, 0) || 1;

    let remR = teamRecoveries;
    let remTW = teamTacklesWon;
    let remTL = teamTacklesLost;
    let remC = teamClearances;

    list.forEach((p, idx) => {
      const st = playerStatsById[p.id];
      const share = weights[idx] / sumW;
      const r = idx === list.length - 1 ? remR : Math.round(teamRecoveries * share);
      const tw = idx === list.length - 1 ? remTW : Math.round(teamTacklesWon * share);
      const tl = idx === list.length - 1 ? remTL : Math.round(teamTacklesLost * share);
      const c = idx === list.length - 1 ? remC : Math.round(teamClearances * share);
      remR -= r;
      remTW -= tw;
      remTL -= tl;
      remC -= c;

      st.recoveries += r;
      st.tacklesWon += tw;
      st.tacklesLost += tl;
      st.clearances += c;
    });
  };

  allocateDefensive(homePlayers, homeRecoveries, homeTacklesWon, homeTacklesLost, homeClearances);
  allocateDefensive(awayPlayers, awayRecoveries, awayTacklesWon, awayTacklesLost, awayClearances);

  // Faltas cometidas / sufridas (reparto simple)
  const allocateFouls = (players, foulsCommitted) => {
    let rem = foulsCommitted;
    players.forEach((p, idx) => {
      const st = playerStatsById[p.id];
      const v = idx === players.length - 1 ? rem : Math.round(foulsCommitted / players.length);
      rem -= v;
      st.foulsCommitted += v;
    });
    // sufridas: aleatorio compensado
    const list = players.slice().sort(() => Math.random() - 0.5);
    let left = foulsCommitted;
    list.forEach((p, idx) => {
      const st = playerStatsById[p.id];
      const v = idx === list.length - 1 ? left : Math.round(foulsCommitted / list.length);
      left -= v;
      st.foulsSuffered += v;
    });
  };
  allocateFouls(homePlayers, homeFouls);
  allocateFouls(awayPlayers, awayFouls);

  // Offsides: a delanteros
  const allocateOffsides = (players, offsides) => {
    const pool = players.filter((p) => ['ST', 'CF', 'RW', 'LW'].includes((p.pos || '').toUpperCase()));
    const list = pool.length ? pool : players;
    let rem = offsides;
    list.forEach((p, idx) => {
      const st = playerStatsById[p.id];
      const v = idx === list.length - 1 ? rem : Math.round(offsides / list.length);
      rem -= v;
      st.offsides += v;
    });
  };
  allocateOffsides(homePlayers, homeOffside);
  allocateOffsides(awayPlayers, awayOffside);

  // Paradas (solo portero titular aprox)
  const setGKSave = (club, lineupIds, saves) => {
    const gk = (club?.players || []).find((p) => (p.pos || '').toUpperCase() === 'GK' && lineupIds?.includes?.(p.id));
    if (gk?.id) {
      const st = playerStatsById[gk.id];
      st.saves = saves;
    }
  };
  setGKSave(homeClub, fx.homeLineupIds, homeSaves);
  setGKSave(awayClub, fx.awayLineupIds, awaySaves);

  // Tiros por jugador (concordando con goles ya asignados)
  const allocateShots = (club, teamStats, clubId) => {
    const ids = new Set([...(clubId === fx.homeClubId ? fx.homeLineupIds : fx.awayLineupIds)]);
    const list = (club?.players || []).filter((p) => ids.has(p.id));
    const pool = list.length ? list : (club?.players || []);
    if (!pool.length) return;

    const pick = () => pool[Math.floor(Math.random() * pool.length)];

    // Ya hay goles, asegurar al menos 1 tiro a puerta por gol del goleador si existe
    const goalsEvents = (fx.events || []).filter((e) => e?.type === 'GOAL' && e?.clubId === clubId && e?.playerId);
    goalsEvents.forEach((e) => {
      const st = playerStatsById[e.playerId];
      if (!st) return;
      st.shotsTotal += 1;
      st.shotsOnTarget += 1;
    });

    // Restante de tiros
    const alreadyOn = goalsEvents.length;
    const remainingOn = Math.max(0, teamStats.shotsOnTarget - alreadyOn);
    const remainingTotal = Math.max(0, teamStats.shotsTotal - goalsEvents.length);
    const remainingBlocked = clamp(Math.round(teamStats.shotsBlocked * (0.9 + Math.random() * 0.2)), 0, remainingTotal);
    const remainingOff = Math.max(0, remainingTotal - remainingOn - remainingBlocked);

    // repartir
    for (let i = 0; i < remainingOn; i++) {
      const p = pick();
      const st = playerStatsById[p.id];
      st.shotsTotal += 1;
      st.shotsOnTarget += 1;
    }
    for (let i = 0; i < remainingBlocked; i++) {
      const p = pick();
      const st = playerStatsById[p.id];
      st.shotsTotal += 1;
      st.shotsBlocked += 1;
    }
    for (let i = 0; i < remainingOff; i++) {
      const p = pick();
      const st = playerStatsById[p.id];
      st.shotsTotal += 1;
      st.shotsOffTarget += 1;
    }
  };

  allocateShots(homeClub, fx.teamStats.home, fx.homeClubId);
  allocateShots(awayClub, fx.teamStats.away, fx.awayClubId);

  // Normalizar porcentajes finales
  Object.keys(playerStatsById).forEach((pid) => {
    const st = playerStatsById[pid];
    if (!st) return;
    if (st.passesAttempted > 0) {
      st.passAccuracyPct = Number(((st.passesCompleted / st.passesAttempted) * 100).toFixed(2));
    } else {
      st.passAccuracyPct = 0;
    }
  });

  fx.playerStatsById = playerStatsById;
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
    const injuryChance = clampN(baseClubChance * injuryMod * avgRisk, 0.01, 0.22);

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
  roll = clampN(roll + bias, 0, 1);

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