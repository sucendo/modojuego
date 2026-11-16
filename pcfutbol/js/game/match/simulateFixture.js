// js/game/match/simulateFixture.js
//
// Orquestador por partido (sin DOM).
// Recibe deps para evitar ciclos y para no acoplarse a GameState.

import { generateAdvancedStatsForFixture } from './advancedStats.js';
import { generateEventsForFixture, attachFixtureMeta } from './events.js';
import { getStartingXIForFixture, getBenchForFixture } from './selection.js';
import { getClubStrengthProfile } from '../tactics/strength.js';
import { chooseMatchPlan } from '../tactics/matchPlans.js';
import { computeMatchLambdas, sampleGoals } from './scoring.js';

export function simulateFixture(fx, deps = {}) {
  if (!fx) return;
  const getClubById = deps.getClubById;
  if (typeof getClubById !== 'function') {
    throw new Error('simulateFixture: deps.getClubById es obligatorio');
  }
  
  const applyMatchEffectsToClub = deps.applyMatchEffectsToClub;
  if (typeof applyMatchEffectsToClub !== 'function') {
    throw new Error('simulateFixture: deps.applyMatchEffectsToClub es obligatorio');
  }
  
  // ✅ Agresividad táctica desacoplada (fallback 1.0)
  const getAgg =
    (typeof deps.getTacticalAggression === 'function' && deps.getTacticalAggression) ||
    ((club) => 1.0);

  // ✅ ctx para effects (tarjetas/lesiones)
  const effectsCtx = deps.effectsCtx || deps.ctx || null;

  const homeClub = getClubById(fx.homeClubId);
  const awayClub = getClubById(fx.awayClubId);
  if (!homeClub || !awayClub) return;

  // Guardar XI y banquillo usado en el partido (clave para minutos reales)
  fx.season = fx.season ?? (deps.currentDate?.season || 1);
  fx.homeLineupIds = getStartingXIForFixture(homeClub);
  fx.awayLineupIds = getStartingXIForFixture(awayClub);
  fx.homeBenchIds = getBenchForFixture(homeClub, fx.homeLineupIds, 9);
  fx.awayBenchIds = getBenchForFixture(awayClub, fx.awayLineupIds, 9);
  if (!Array.isArray(fx.substitutions)) fx.substitutions = [];

  // Dos fases: el técnico puede reaccionar al resultado al llegar al 65',
  // sin reescribir los esquemas habituales ni el once inicial del club.
  const initialHomePlan = chooseMatchPlan(homeClub, awayClub, { userClubId: deps.userClubId });
  const initialAwayPlan = chooseMatchPlan(awayClub, homeClub, { userClubId: deps.userClubId });
  const calculatePhaseLambdas = (homePlan, awayPlan) => computeMatchLambdas(
    getClubStrengthProfile(homeClub, true, { lineupIds: fx.homeLineupIds, tactics: homePlan }),
    getClubStrengthProfile(awayClub, false, { lineupIds: fx.awayLineupIds, tactics: awayPlan }),
    getAgg(homeClub, homePlan),
    getAgg(awayClub, awayPlan),
  );

  const early = calculatePhaseLambdas(initialHomePlan, initialAwayPlan);
  const earlyHomeGoals = sampleGoals(early.homeLambda * (65 / 90));
  const earlyAwayGoals = sampleGoals(early.awayLambda * (65 / 90));
  const lateHomePlan = chooseMatchPlan(homeClub, awayClub, {
    minute: 65, goalDifference: earlyHomeGoals - earlyAwayGoals, userClubId: deps.userClubId,
  });
  const lateAwayPlan = chooseMatchPlan(awayClub, homeClub, {
    minute: 65, goalDifference: earlyAwayGoals - earlyHomeGoals, userClubId: deps.userClubId,
  });
  const late = calculatePhaseLambdas(lateHomePlan, lateAwayPlan);
  const lateHomeGoals = sampleGoals(late.homeLambda * (25 / 90));
  const lateAwayGoals = sampleGoals(late.awayLambda * (25 / 90));
  fx.homeGoals = earlyHomeGoals + lateHomeGoals;
  fx.awayGoals = earlyAwayGoals + lateAwayGoals;
  fx.goalPhases = { splitMinute: 65, home: [earlyHomeGoals, lateHomeGoals], away: [earlyAwayGoals, lateAwayGoals] };
  fx.tacticalPhases = [
    { minute: 0, home: initialHomePlan, away: initialAwayPlan },
    { minute: 65, home: lateHomePlan, away: lateAwayPlan },
  ];
  fx.tacticalChanges = [
    { clubId: homeClub.id, initial: initialHomePlan, final: lateHomePlan },
    { clubId: awayClub.id, initial: initialAwayPlan, final: lateAwayPlan },
  ].filter(change => ['formation', 'mentality', 'pressure', 'tempo'].some(
    key => change.initial[key] !== change.final[key],
  )).map(change => ({ minute: 65, clubId: change.clubId,
    reason: change.final.reason, fromFormation: change.initial.formation,
    toFormation: change.final.formation, mentality: change.final.mentality }));

  // Eventos (goles + subs tácticas + tarjetas/lesión vía hook del motor)
  fx.events = generateEventsForFixture(fx, homeClub, awayClub, {
    applyMatchEffectsToClub,
    ctx: effectsCtx,
  });

  // Meta + estadísticas avanzadas (para UI nueva)
  attachFixtureMeta(fx, homeClub, awayClub);
  generateAdvancedStatsForFixture(fx, homeClub, awayClub);
}
