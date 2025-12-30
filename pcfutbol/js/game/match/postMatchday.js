// js/game/match/postMatchday.js
//
// Pipeline post-jornada por club:
// - Fatiga (applyMatchEffectsToClub sin canal de eventos)
// - Moral (por minutos, resultado, goles, no convocado, etc.)
// - Fitness/Form (por descanso hasta el siguiente partido)
// - Progresión de lesiones y sanciones

import { isPlayerUnavailable } from '../utils/index.js';
import {
  GAME_CALENDAR,
  getFixtureDayIndex,
  getNextFixtureDayIndexForClub,
  applyMoraleForClubFixture,
  applyFitnessAndFormForClubBetweenMatches,
  applyRestEffectsToClub,
} from '../club/conditioning.js';
import { computeMinutesForClubInFixture, buildEventCountMap } from './statsPersist.js';

// Wrapper defensivo: aunque isPlayerUnavailable no contemple sanciones, aquí las respetamos.
function isPlayerUnavailableNow(p) {
  if (!p) return true;
  const s = p.suspension;
  if (s && typeof s.matchesRemaining === 'number' && s.matchesRemaining > 0) return true;
  return !!isPlayerUnavailable(p);
}

export function applyPostMatchdayEffects(currentFixtures, ctx) {
  const clubs = Array.isArray(ctx?.clubs) ? ctx.clubs : [];
  const allFixtures = Array.isArray(ctx?.fixtures) ? ctx.fixtures : [];
  const currentDate = ctx?.currentDate || {};

  const applyMatchEffectsToClub = ctx?.applyMatchEffectsToClub;
  const progressInjuriesForClub = ctx?.progressInjuriesForClub;
  const progressSanctionsForClub = ctx?.progressSanctionsForClub;

  if (typeof applyMatchEffectsToClub !== 'function') {
    throw new Error('applyPostMatchdayEffects: ctx.applyMatchEffectsToClub es obligatorio');
  }
  if (typeof progressInjuriesForClub !== 'function') {
    throw new Error('applyPostMatchdayEffects: ctx.progressInjuriesForClub es obligatorio');
  }
  if (typeof progressSanctionsForClub !== 'function') {
    throw new Error('applyPostMatchdayEffects: ctx.progressSanctionsForClub es obligatorio');
  }

  const fixtureByClub = new Map();
  (Array.isArray(currentFixtures) ? currentFixtures : []).forEach((fx) => {
    if (!fx) return;
    fixtureByClub.set(fx.homeClubId, fx);
    fixtureByClub.set(fx.awayClubId, fx);
  });

  const fallbackDays = GAME_CALENDAR.DAYS_PER_MATCHDAY;
  const currentDay = (Math.max(1, currentDate?.matchday || 1) - 1) * fallbackDays;

  clubs.forEach((club) => {
    if (!club?.id) return;
    const fx = fixtureByClub.get(club.id) || null;

    if (fx) {
      // Fatiga + (si hubiera) efectos “no-evento”
      applyMatchEffectsToClub(fx, club, fx.homeClubId === club.id);

      // Moral
      applyMoraleForClubFixture(club, fx, fx.homeClubId === club.id, {
        computeMinutesForClubInFixture,
        buildEventCountMap,
        isPlayerUnavailableNow,
      });

      // Fitness/Form (según días hasta el próximo partido)
      const fxDay = getFixtureDayIndex(fx, currentDate);
      const nextDay = getNextFixtureDayIndexForClub(allFixtures, club.id, fxDay, currentDate);
      const daysUntilNext = nextDay != null ? (nextDay - fxDay) : fallbackDays;
      applyFitnessAndFormForClubBetweenMatches(club, fx, fx.homeClubId === club.id, daysUntilNext, {
        currentDate,
        computeMinutesForClubInFixture,
      });
    } else {
      // No jugó: descanso + fitness/form hacia “normal”
      applyRestEffectsToClub(club);
      const nextDay = getNextFixtureDayIndexForClub(allFixtures, club.id, currentDay, currentDate);
      const daysUntilNext = nextDay != null ? (nextDay - currentDay) : fallbackDays;
      applyFitnessAndFormForClubBetweenMatches(club, null, false, daysUntilNext, {
        currentDate,
      });
    }

    // Tick de lesiones/sanciones (siempre)
    progressInjuriesForClub(club, { currentDate });
    progressSanctionsForClub(club);
  });
}