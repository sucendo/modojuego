// js/game/club/conditioning.js
//
// Moral + Fitness/Form + helpers de calendario (día de fixture, descanso, edad).
// No depende de GameState: recibe fixtures/currentDate/deps por parámetro.

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

// Calendario interno del juego (motor):
//  - Temporada 1 comienza el 1 de agosto de 2025
//  - Por defecto cada jornada de liga son 7 días
// En el futuro, para Champions/Copa, añade a los fixtures un `gameDay` o un `kickoffDate` ISO.
export const GAME_CALENDAR = {
  BASE_SEASON_YEAR: 2025,
  SEASON_START_MONTH: 8, // agosto
  SEASON_START_DAY: 1,
  DAYS_PER_MATCHDAY: 7,
};

export function getSeasonStartUTC(season) {
  const year = GAME_CALENDAR.BASE_SEASON_YEAR + (Number(season || 1) - 1);
  return new Date(Date.UTC(year, GAME_CALENDAR.SEASON_START_MONTH - 1, GAME_CALENDAR.SEASON_START_DAY));
}

function dateToDayIndexUTC(date, seasonStartUTC) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const ms = date.getTime() - seasonStartUTC.getTime();
  return Math.floor(ms / 86400000);
}

// Devuelve el "día" absoluto dentro de la temporada para un fixture.
// Prioridad:
//  1) fx.gameDay
//  2) fx.kickoffDate/fx.date/fx.dateISO
//  3) matchday * DAYS_PER_MATCHDAY
export function getFixtureDayIndex(fx, currentDate) {
  if (!fx) return null;
  if (Number.isFinite(Number(fx.gameDay))) return Number(fx.gameDay);

  const season = fx.season ?? currentDate?.season ?? 1;
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

export function getNextFixtureDayIndexForClub(fixtures, clubId, afterDay, currentDate) {
  const arr = Array.isArray(fixtures) ? fixtures : [];
  const after = Number.isFinite(Number(afterDay)) ? Number(afterDay) : 0;
  let best = null;
  for (let i = 0; i < arr.length; i++) {
    const fx = arr[i];
    if (!fx || fx.played) continue;
    if (fx.homeClubId !== clubId && fx.awayClubId !== clubId) continue;
    const day = getFixtureDayIndex(fx, currentDate);
    if (!Number.isFinite(day)) continue;
    if (day <= after) continue;
    if (best == null || day < best) best = day;
  }
  return best;
}

export function getPreviousFixtureDayIndexForClub(fixtures, clubId, beforeDay, currentDate) {
  const arr = Array.isArray(fixtures) ? fixtures : [];
  const before = Number.isFinite(Number(beforeDay)) ? Number(beforeDay) : Infinity;
  let best = null;
  for (let i = 0; i < arr.length; i++) {
    const fx = arr[i];
    if (!fx || !fx.played) continue;
    if (fx.homeClubId !== clubId && fx.awayClubId !== clubId) continue;
    const day = getFixtureDayIndex(fx, currentDate);
    if (!Number.isFinite(day)) continue;
    if (day >= before) continue;
    if (best == null || day > best) best = day;
  }
  return best;
}

export function getPlayerAgeAtUTCDate(player, dateUTC) {
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

export function avgNums(nums) {
  const arr = (nums || []).filter((n) => Number.isFinite(n));
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function pickWeighted(items, weights) {
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

export function computePlayerInjuryRiskMultiplier(player, minutesPlayed, restDays, cardAgg, nowDateUTC) {
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
  const energyPenalty = fit < 0.85 ? (0.85 - fit) / 0.85 : 0; // 0..1 aprox
  const energyMult = 1 + 1.8 * clampN(energyPenalty, 0, 1);     // hasta ~2.8

  // Fatiga acumulada alta => sube riesgo
  const fatiguePenalty = fat > 45 ? (fat - 45) / 55 : 0;       // 0..1
  const fatigueMult = 1 + 0.55 * clampN(fatiguePenalty, 0, 1);  // hasta ~1.55

  // Forma mala => sube (forma buena reduce ligeramente)
  const formMult =
    form < 0 ? (1 + (Math.abs(form) / 3) * 0.35) : (1 - (form / 3) * 0.08);

  // Poco descanso desde el partido anterior => sube riesgo
  const restMult = rd < 4 ? (1 + (4 - rd) * 0.12) : (rd >= 7 ? 0.98 : 1.0);

  // Edad: a partir de 28-30 sube progresivo
  let ageMult = 1.0;
  if (Number.isFinite(age)) {
    if (age >= 30) ageMult = 1 + Math.min(0.30, (age - 29) * 0.02); // cap +30%
    else if (age <= 22) ageMult = 0.95;
  }

  // Exposición por minutos
  const minutesMult = 0.45 + 0.55 * m; // 0.45..1.0

  // Intensidad táctica
  const intensityMult = clampN(0.90 + 0.25 * (cardAgg - 1.0), 0.75, 1.25);

  const mult = energyMult * fatigueMult * formMult * restMult * ageMult * minutesMult * intensityMult;
  return clampN(mult, 0.6, 3.0);
}

export function getRecoveryTarget(daysRest, age) {
  let t = 0.65 + 0.05 * clampN(daysRest, 0, 14);
  t = Math.min(0.95, t);
  if (Number.isFinite(age)) {
    if (age > 27) t -= (age - 27) * 0.005;
    else if (age < 23) t += (23 - age) * 0.003;
  }
  return clamp01(t);
}

export function applyFitnessAndFormForClubBetweenMatches(club, fx, isHome, daysUntilNext, deps = {}) {
  const players = Array.isArray(club?.players) ? club.players : [];
  const minutesById = fx && typeof deps.computeMinutesForClubInFixture === 'function'
    ? deps.computeMinutesForClubInFixture(fx, isHome)
    : new Map();

  const season = fx?.season ?? deps.currentDate?.season ?? 1;
  const seasonStart = getSeasonStartUTC(season);
  const nowDay = fx
    ? getFixtureDayIndex(fx, deps.currentDate)
    : (Math.max(1, deps.currentDate?.matchday || 1) - 1) * GAME_CALENDAR.DAYS_PER_MATCHDAY;
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
      // 1) Coste de partido
      const m = clampN(mins / 90, 0, 1);
      const agePenalty = Number.isFinite(age) && age > 30 ? (age - 30) * 0.002 : 0;
      const loss = clampN(0.32 * m + agePenalty, 0, 0.55);
      p.fitness = clamp01(clamp01(p.fitness) - loss);

      // 2) Recuperación hasta objetivo
      const target = getRecoveryTarget(restDays, age);
      if (p.fitness < target) p.fitness = target;

      // 3) Forma
      const deltaForm = 1.0 * m;
      p.form = clampN(p.form + deltaForm, -3, 3);
    } else {
      // No jugó
      const ageAdj = Number.isFinite(age) && age > 30 ? (age - 30) * 0.003 : 0;
      const restTarget = clamp01(Math.min(0.99, getRecoveryTarget(restDays, age) + 0.04 - ageAdj));
      if (p.fitness < restTarget) p.fitness = restTarget;

      // Reversión forma a 0
      p.form = p.form + (0 - p.form) * 0.10;
      p.form = clampN(p.form, -3, 3);
    }
  });
}

export function applyRestEffectsToClub(club) {
  const players = Array.isArray(club?.players) ? club.players : [];
  players.forEach((p) => {
    if (!p) return;
    // Baja fatiga
    p.fatigue = Math.max(0, (p.fatigue || 0) - 8);
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

export function applyMoraleForClubFixture(club, fx, isHome, deps = {}) {
  if (!club || !fx) return;
  const players = Array.isArray(club.players) ? club.players : [];
  const benchIds = (isHome ? fx.homeBenchIds : fx.awayBenchIds) || [];
  const calledSet = new Set([...(isHome ? fx.homeLineupIds : fx.awayLineupIds) || [], ...benchIds]);

  const minutesById = typeof deps.computeMinutesForClubInFixture === 'function'
    ? deps.computeMinutesForClubInFixture(fx, isHome)
    : new Map();
  const goalsByPlayer = typeof deps.buildEventCountMap === 'function'
    ? deps.buildEventCountMap(fx, 'GOAL', club.id)
    : new Map();
  const redsByPlayer = typeof deps.buildEventCountMap === 'function'
    ? deps.buildEventCountMap(fx, 'RED_CARD', club.id)
    : new Map();

  const gf = isHome ? (fx.homeGoals || 0) : (fx.awayGoals || 0);
  const ga = isHome ? (fx.awayGoals || 0) : (fx.homeGoals || 0);
  const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D';

  players.forEach((p) => {
    if (!p?.id) return;
    if (p.morale == null) p.morale = 0.7;

    const mental01 = getMentalScore01(p);
    const mins = minutesById.get(p.id) || 0;
    const played = mins > 0;
    const onBench = benchIds.includes(p.id);
    const called = calledSet.has(p.id) || played;
    const available = typeof deps.isPlayerUnavailableNow === 'function'
      ? !deps.isPlayerUnavailableNow(p)
      : true;

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
      // convocado pero no juega
      delta += -0.004;
      if (result === 'W') delta += 0.004;
      else if (result === 'D') delta += 0.002;
      else delta -= 0.004;
    } else if (!called) {
      // no convocado: baja si está disponible
      if (available) delta -= 0.014;
      else delta -= 0.001;
    }

    // Transferible: erosiona moral poco a poco
    if (p.transferListed) delta -= 0.004;

    // Hook futuro: contractDissatisfaction (0..1)
    const diss =
      (typeof p.contractDissatisfaction === 'number' ? p.contractDissatisfaction : null) ??
      (typeof p.contract?.dissatisfaction === 'number' ? p.contract.dissatisfaction : null);
    if (diss != null) delta -= 0.010 * clamp01(diss);

    applyMoraleDelta(p, delta, mental01);
  });
}
