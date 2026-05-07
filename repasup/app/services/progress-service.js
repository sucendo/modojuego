export function getRepasoStatsForPlayer(playerId){
  try {
    const raw = localStorage.getItem('repaso_progress_v1');
    const progress = raw ? JSON.parse(raw) : { players: {} };
    const player = progress?.players?.[playerId];
    const decks = player?.decks || {};
    let correct = 0, wrong = 0, timeSpentMs = 0, pending = 0, decksPlayed = 0, sessionsStarted = 0, sessionsCompleted = 0;
    Object.values(decks).forEach(deck => {
      correct += Number(deck.correct || 0);
      wrong += Number(deck.wrong || 0);
      timeSpentMs += Number(deck.timeSpentMs || 0);
      pending += Array.isArray(deck.errorsRecent) ? deck.errorsRecent.length : 0;
      sessionsStarted += Number(deck.sessionsStarted || 0);
      sessionsCompleted += Number(deck.sessionsCompleted || 0);
      if ((Number(deck.correct || 0) + Number(deck.wrong || 0)) > 0) decksPlayed += 1;
    });
    const totalAnswers = correct + wrong;
    return {
      decksPlayed,
      totalAnswers,
      correct,
      wrong,
      accuracy: totalAnswers ? Math.round((correct / totalAnswers) * 100) : 0,
      mastery: totalAnswers ? Math.round((correct / Math.max(totalAnswers + pending, 1)) * 100) : 0,
      timeMin: Math.round(timeSpentMs / 60000),
      pending,
      sessionsStarted,
      sessionsCompleted
    };
  } catch {
    return { decksPlayed: 0, totalAnswers: 0, correct: 0, wrong: 0, accuracy: 0, mastery: 0, timeMin: 0, pending: 0, sessionsStarted: 0, sessionsCompleted: 0 };
  }
}
