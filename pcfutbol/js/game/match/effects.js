// js/game/match/effects.js
//
// Efectos por partido a nivel club:
// - Fatiga al XI
// - Tarjetas (con eventos)
// - Lesiones (con eventos + sustitución forzada)
//
// Se diseña para NO acoplarse a GameState: recibe un ctx con lo necesario.

import { ensureClubMedical, getMedicalInjuryModifier } from '../utils/medical.js';
import { isPlayerInjuredNow } from '../utils/index.js';
import {
  GAME_CALENDAR,
  getSeasonStartUTC,
  getFixtureDayIndex,
  getPreviousFixtureDayIndexForClub,
  getPlayerAgeAtUTCDate,
  avgNums,
  pickWeighted,
  computePlayerInjuryRiskMultiplier,
} from '../club/conditioning.js';
import { computeMinutesForClubInFixture } from './statsPersist.js';

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

 function normId(v) {
   return v == null ? '' : String(v);
 }
 
 function makeIdSet(ids) {
   const s = new Set();
   if (!Array.isArray(ids)) return s;
   for (const id of ids) {
     const k = normId(id);
     if (k) s.add(k);
   }
   return s;
 }

function isGKPos(pos) {
  const p = String(pos || '').toUpperCase();
  return p === 'GK' || p === 'POR';
}

function pickBenchInIdRespectingGKRule(outPlayer, candidateBenchIds, playersById) {
  const outIsGK = isGKPos(outPlayer?.position);
  const gks = candidateBenchIds.filter((id) => isGKPos(playersById.get(id)?.position));
  const field = candidateBenchIds.filter((id) => !isGKPos(playersById.get(id)?.position));
  if (outIsGK) return gks[0] || field[0] || null;
  return field[0] || gks[0] || null;
}

export function pickRandomLineupPlayer(club, lineupIds) {
  const players = Array.isArray(club?.players) ? club.players : [];
   const set = makeIdSet(lineupIds);
   const lineup = players.filter((p) => p && p.id != null && set.has(normId(p.id)));
  if (lineup.length === 0) return null;
  return lineup[Math.floor(Math.random() * lineup.length)];
}

export function maybeAddForcedSubstitution(fx, club, isHome, outPlayerId, minute) {
  if (!fx || !outPlayerId) return;
  const bench = isHome ? fx.homeBenchIds : fx.awayBenchIds;
  if (!Array.isArray(bench) || bench.length === 0) return;
  if (!Array.isArray(fx.substitutions)) fx.substitutions = [];
  
   // Máximo cambios por club (regla del fixture; fallback 5)
   const maxSubs = Number.isFinite(Number(fx.maxSubs)) ? Number(fx.maxSubs) : 5;
   const clubSubs = fx.substitutions.filter((s) => s && s.clubId === club.id);
   if (maxSubs > 0 && clubSubs.length >= maxSubs) return;
 
   const outKey = normId(outPlayerId);
   const players = Array.isArray(club?.players) ? club.players : [];
   const outP = players.find((p) => p && p.id != null && normId(p.id) === outKey) || null;
   const outIsGK = (outP?.position || outP?.pos) === 'GK';
 
   // Quién está "en uso" (en el campo ahora mismo)
   const xiIds = isHome ? fx.homeLineupIds : fx.awayLineupIds;
   const inUse = makeIdSet(xiIds);
   // jugadores que ya han entrado siguen "en campo", los que salen se quitan
   for (const s of clubSubs) {
     if (!s) continue;
     const outK = normId(s.outPlayerId);
     const inK = normId(s.inPlayerId);
     if (outK) inUse.delete(outK);
     if (inK) inUse.add(inK);
   }
   // este se va a ir ahora
   inUse.delete(outKey);
 
   // Candidatos de banquillo que no están en uso
   const benchKeys = bench.map(normId).filter(Boolean);
   const benchCandidates = benchKeys
     .filter((k) => k !== outKey && !inUse.has(k))
     .map((k) => players.find((p) => p && p.id != null && normId(p.id) === k))
     .filter(Boolean);
 
   if (benchCandidates.length === 0) return;
 
   const isGK = (p) => ((p?.position || p?.pos) === 'GK');
 
   let chosen = null;
   if (outIsGK) {
     // GK lesionado: entra GK si hay; si no, cualquiera (un jugador de campo a portería)
     chosen = benchCandidates.find(isGK) || benchCandidates[0];
   } else {
     // jugador de campo lesionado: entra jugador de campo; solo GK si no queda otra cosa
     chosen = benchCandidates.find((p) => !isGK(p)) || benchCandidates.find(isGK) || benchCandidates[0];
   }
   if (!chosen?.id) return;

  const m = Math.min(89, Math.max(1, Number(minute || 1)));
  fx.substitutions.push({
    clubId: club.id,
    outPlayerId,
    inPlayerId: chosen.id,
    minute: m,
    reason: 'INJURY',
  });
}

/**
 * ctx requerido:
 *  - currentTimeISO
 *  - currentDate
 *  - fixtures (para restDaysFromPrev)
 *  - applyCardsForPlayer
 *  - recordCardEvent
 *  - generateRandomInjury
 *  - getTacticalAggression
 */
export function applyMatchEffectsToClub(fx, club, isHome, events, pickMinute, ctx) {
  // Esta función se llama dos veces (en generación eventos y post jornada).
  // Si viene sin events/pickMinute, no añade eventos: solo aplica efectos de fatiga.
  ensureClubMedical(club);
  const players = Array.isArray(club?.players) ? club.players : [];

  // Fatiga ligera al XI
  const xiIds = isHome ? fx.homeLineupIds : fx.awayLineupIds;
  const idSet = makeIdSet(xiIds);
  players.forEach((p) => {
     if (!p || p.id == null) return;
     if (!idSet.has(normId(p.id))) return;
    p.fatigue = Math.min(100, Math.max(0, (p.fatigue || 0) + 6));
  });

  // Si no hay canal de eventos, terminamos aquí
  if (!events || !pickMinute) return;

  const {
    currentTimeISO,
    currentDate,
    fixtures,
    applyCardsForPlayer,
    recordCardEvent,
    generateRandomInjury,
    getTacticalAggression,
  } = ctx || {};

  if (typeof applyCardsForPlayer !== 'function') throw new Error('applyMatchEffectsToClub: ctx.applyCardsForPlayer requerido');
  if (typeof recordCardEvent !== 'function') throw new Error('applyMatchEffectsToClub: ctx.recordCardEvent requerido');
  if (typeof generateRandomInjury !== 'function') throw new Error('applyMatchEffectsToClub: ctx.generateRandomInjury requerido');
  if (typeof getTacticalAggression !== 'function') throw new Error('applyMatchEffectsToClub: ctx.getTacticalAggression requerido');

  // Probabilidad de lesión + tarjetas
  const injuryMod = getMedicalInjuryModifier(club);
  const cardAgg = Math.max(0.8, Math.min(1.5, getTacticalAggression(club)));

  // Amarillas
  const yellowCount = Math.random() < 0.6 ? (Math.random() < 0.25 ? 2 : 1) : 0;
  for (let i = 0; i < yellowCount; i++) {
    const p = pickRandomLineupPlayer(club, xiIds);
    if (!p) continue;
    const issuedAtISO = currentTimeISO || null;
    applyCardsForPlayer(p, 1, issuedAtISO);
    recordCardEvent(events, club.id, p.id, 'YELLOW_CARD', pickMinute());
  }

  // Roja directa (rara)
  if (Math.random() < 0.03 * cardAgg) {
    const p = pickRandomLineupPlayer(club, xiIds);
    if (p) {
      const issuedAtISO = currentTimeISO || null;
      applyCardsForPlayer(p, 2, issuedAtISO);
      recordCardEvent(events, club.id, p.id, 'RED_CARD', pickMinute());
    }
  }

  // Lesiones (más realistas): riesgo depende de energía/forma/fatiga/descanso/edad/minutos
  const season = fx?.season ?? currentDate?.season ?? 1;
  const seasonStart = getSeasonStartUTC(season);
  const fxDay = getFixtureDayIndex(fx, currentDate);
  const nowDateUTC = new Date(seasonStart.getTime() + (Number.isFinite(fxDay) ? fxDay : 0) * 86400000);
  const prevDay = Number.isFinite(fxDay)
    ? getPreviousFixtureDayIndexForClub(fixtures, club.id, fxDay, currentDate)
    : null;
  const restDaysFromPrev = prevDay != null ? Math.max(1, fxDay - prevDay) : GAME_CALENDAR.DAYS_PER_MATCHDAY;

  const minutesById = computeMinutesForClubInFixture(fx, isHome);
   const set = makeIdSet(xiIds);
   const lineupPlayers = (club.players || []).filter((p) => {
     if (!p || p.id == null) return false;
     if (!set.has(normId(p.id))) return false;
     if (isPlayerInjuredNow(p)) return false;
     return true;
   });

  if (lineupPlayers.length > 0) {
    const risks = lineupPlayers.map((p) =>
      computePlayerInjuryRiskMultiplier(
        p,
         // soporte por si el Map está indexado por string o por número
         (minutesById.get(normId(p.id)) ?? minutesById.get(p.id) ?? 90),
        restDaysFromPrev,
        cardAgg,
        nowDateUTC
      )
    );
    const avgRisk = avgNums(risks) || 1.0;

    // Probabilidad base por club (ajustable). Se modula por:
    // - nivel médico (injuryMod)
    // - riesgo medio (energía/forma/fatiga/descanso)
    // Frecuencia base por equipo/partido (tuning):
    // 0.10 suele dar un ratio más “visible” (≈ 1 lesión cada 2-3 partidos en total).
    const baseClubChance = 0.10;
    // Subimos el mínimo para evitar que con buenos médicos / bajo riesgo caiga a casi nunca
    const injuryChance = clampN(baseClubChance * injuryMod * avgRisk, 0.02, 0.30);

// DEBUG TEMPORAL
if (fx && fx.id && Math.random() < 0.03) {
  console.log("[inj-debug]", fx.id, club.id, "chance", injuryChance, "avgRisk", avgRisk, "injMod", injuryMod, "lineup", lineupPlayers?.length);
}

    if (Math.random() < injuryChance) {
      const p = pickWeighted(lineupPlayers, risks);
      if (p) {
        const fit = p?.fitness == null ? 0.9 : clamp01(p.fitness);
        const age = getPlayerAgeAtUTCDate(p, nowDateUTC);
        const risk = risks[lineupPlayers.indexOf(p)] || avgRisk;
        const inj = generateRandomInjury(risk, age, fit);
        // ✅ Marcar cuándo se produjo (para no progresar en el mismo MD)
        const s = ctx?.currentDate?.season ?? null;
        const md = ctx?.currentDate?.matchday ?? null;
        inj.startedSeason = s;
        inj.startedMatchday = md;
        inj.startedFixtureId = fx?.id ?? null;
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
    // Segunda lesión (rara): partidos con mucho riesgo pueden tener 2
    // (sin pasarnos de frecuencia)
    if (Math.random() < injuryChance * 0.25) {
      const p2 = pickWeighted(lineupPlayers, risks);
      if (p2 && !p2.injury) {
        const fit2 = p2?.fitness == null ? 0.9 : clamp01(p2.fitness);
        const age2 = getPlayerAgeAtUTCDate(p2, nowDateUTC);
        const risk2 = risks[lineupPlayers.indexOf(p2)] || avgRisk;
        const inj2 = generateRandomInjury(risk2, age2, fit2);
        const s2 = ctx?.currentDate?.season ?? null;
        const md2 = ctx?.currentDate?.matchday ?? null;
        inj2.startedSeason = s2;
        inj2.startedMatchday = md2;
        inj2.startedFixtureId = fx?.id ?? null;
        p2.injury = inj2;
        events.push({
          type: 'INJURY',
          clubId: club.id,
          playerId: p2.id,
          minute: pickMinute(),
          injuryType: inj2.type,
        });
        maybeAddForcedSubstitution(fx, club, isHome, p2.id, pickMinute());
      }
    }
  }
}