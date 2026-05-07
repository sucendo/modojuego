import { clampPct } from "../core/helpers.js";

export function buildDeckStatsSnapshot({ deckProgress, session, itemsCount, computeMastery, toSafeInt }){
  const safe = deckProgress || {};
  const correct = toSafeInt(safe.correct, 0);
  const wrong = toSafeInt(safe.wrong, 0);
  const totalAnswers = toSafeInt(safe.totalAnswers, correct + wrong);
  const accuracy = totalAnswers ? Math.round((correct / totalAnswers) * 100) : 0;
  const mastery = deckProgress ? computeMastery(deckProgress) : 0;
  const mins = Math.round((toSafeInt(safe.timeSpentMs, 0)) / 60000);
  const pendingErrors = Array.isArray(safe.errorsRecent) ? safe.errorsRecent.length : 0;
  const sessionsStarted = toSafeInt(safe.sessionsStarted, 0);
  const sessionsCompleted = toSafeInt(safe.sessionsCompleted, 0);
  const sessionPct = sessionsStarted ? Math.round((sessionsCompleted / sessionsStarted) * 100) : 0;
  const okPct = totalAnswers ? Math.round((correct / totalAnswers) * 100) : 0;
  const badPct = totalAnswers ? Math.max(0, 100 - okPct) : 0;
  const coverageCount = safe.itemStats && typeof safe.itemStats === "object"
    ? Object.keys(safe.itemStats).length
    : 0;
  const coveragePct = itemsCount ? Math.round((coverageCount / itemsCount) * 100) : 0;
  const pendingPct = itemsCount
    ? Math.round((pendingErrors / itemsCount) * 100)
    : Math.min(100, pendingErrors * 10);
  const bestStreak = Math.max(toSafeInt(session?.bestStreak, 0), toSafeInt(safe.bestStreak, 0));
  const rpm = mins > 0 ? (totalAnswers / mins).toFixed(1) : "0.0";
  const lastPlayedLabel = safe.lastPlayedAt ? new Date(safe.lastPlayedAt).toLocaleString() : "—";

  return {
    correct,
    wrong,
    totalAnswers,
    accuracy,
    mastery,
    mins,
    pendingErrors,
    sessionsStarted,
    sessionsCompleted,
    sessionPct: clampPct(sessionPct),
    okPct: clampPct(okPct),
    badPct: clampPct(badPct),
    coverageCount,
    coveragePct: clampPct(coveragePct),
    pendingPct: clampPct(pendingPct),
    bestStreak,
    rpm,
    lastPlayedLabel,
    deckSize: itemsCount,
  };
}
