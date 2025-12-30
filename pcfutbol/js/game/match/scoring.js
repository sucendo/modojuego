// js/game/match/scoring.js
//
// Modelo de goles: cálculo de lambdas + muestreo de goles.
// Separamos aquí para calibrar realismo por competición, estilo, clima, etc.

function clampN(x, a, b) {
  const n = Number(x);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, n));
}

/**
 * Calcula lambdas de goles (home/away) usando perfiles de fuerza y agresividad táctica.
 * Mantiene los factores históricos del proyecto (homeFactor=1.2, awayFactor=0.95).
 *
 * opts futuros:
 *  - homeFactor, awayFactor
 *  - minLambda
 *  - competitionMultiplier (p.ej. ligas con más goles)
 */
export function computeMatchLambdas(homeProfile, awayProfile, homeAgg, awayAgg, opts = {}) {
  const homeFactor = Number.isFinite(opts.homeFactor) ? opts.homeFactor : 1.2;
  const awayFactor = Number.isFinite(opts.awayFactor) ? opts.awayFactor : 0.95;
  const minLambda = Number.isFinite(opts.minLambda) ? opts.minLambda : 0.2;
  const compMul = Number.isFinite(opts.competitionMultiplier) ? opts.competitionMultiplier : 1.0;

  const homeAttack = Number(homeProfile?.attack || 50);
  const homeDefense = Number(homeProfile?.defense || 50);
  const awayAttack = Number(awayProfile?.attack || 50);
  const awayDefense = Number(awayProfile?.defense || 50);

  const hAgg = clampN(homeAgg ?? 1.0, 0.7, 1.4);
  const aAgg = clampN(awayAgg ?? 1.0, 0.7, 1.4);

  // Heurística sencilla (igual que antes)
  const homeLambda = Math.max(
    minLambda,
    (homeAttack / Math.max(1, awayDefense)) * homeFactor * hAgg * compMul
  );
  const awayLambda = Math.max(
    minLambda,
    (awayAttack / Math.max(1, homeDefense)) * awayFactor * aAgg * compMul
  );

  return { homeLambda, awayLambda };
}

export function sampleGoals(lambda) {
  // Poisson aproximada por sumas Bernoulli (suficiente para arcade)
  const base = Math.min(6, Math.max(0, lambda));
  let goals = 0;
  for (let i = 0; i < 6; i++) {
    const p = Math.max(0.02, Math.min(0.55, base / 6));
    if (Math.random() < p) goals++;
  }
  return goals;
}