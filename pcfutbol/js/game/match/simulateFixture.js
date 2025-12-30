// js/game/match/simulateFixture.js
//
// Orquestador por partido (sin DOM).
// Recibe deps para evitar ciclos y para no acoplarse a GameState.

import { generateAdvancedStatsForFixture } from './advancedStats.js';
import { generateEventsForFixture, attachFixtureMeta } from './events.js';
import { getStartingXIForFixture, getBenchForFixture } from './selection.js';
import { getClubStrengthProfile } from '../tactics/strength.js';
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

  const homeProfile = getClubStrengthProfile(homeClub, true);
  const awayProfile = getClubStrengthProfile(awayClub, false);

  const homeAgg = getAgg(homeClub);
  const awayAgg = getAgg(awayClub);

  const { homeLambda, awayLambda } = computeMatchLambdas(
    homeProfile,
    awayProfile,
    homeAgg,
    awayAgg
  );

  fx.homeGoals = sampleGoals(homeLambda);
  fx.awayGoals = sampleGoals(awayLambda);

  // Eventos (goles + subs tácticas + tarjetas/lesión vía hook del motor)
  fx.events = generateEventsForFixture(fx, homeClub, awayClub, {
    applyMatchEffectsToClub,
    ctx: effectsCtx,
  });

  // Meta + estadísticas avanzadas (para UI nueva)
  attachFixtureMeta(fx, homeClub, awayClub);
  generateAdvancedStatsForFixture(fx, homeClub, awayClub);
}