// engine/progress-utils.js
import { nowISO } from "./storage.js";

export function toSafeInt(value, fallback = 0){
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export function sanitizeDeckProgress(raw){
  const d = (raw && typeof raw === "object") ? raw : {};
  const sessionsStarted = toSafeInt(d.sessionsStarted, toSafeInt(d.plays, 0));
  const sessionsCompleted = toSafeInt(d.sessionsCompleted, toSafeInt(d.plays, 0));
  const totalAnswers = toSafeInt(d.totalAnswers, toSafeInt(d.correct, 0) + toSafeInt(d.wrong, 0));
  return {
    lastPlayedAt: typeof d.lastPlayedAt === "string" ? d.lastPlayedAt : null,
    timeSpentMs: toSafeInt(d.timeSpentMs, 0),
    plays: sessionsCompleted,
    sessionsStarted,
    sessionsCompleted,
    totalAnswers,
    correct: toSafeInt(d.correct, 0),
    wrong: toSafeInt(d.wrong, 0),
    bestStreak: toSafeInt(d.bestStreak, 0),
    modeLast: typeof d.modeLast === "string" ? d.modeLast : null,
    itemStats: (d.itemStats && typeof d.itemStats === "object") ? d.itemStats : {},
    errorsRecent: Array.isArray(d.errorsRecent) ? d.errorsRecent.filter(Boolean).slice(0, 40) : []
  };
}

export function ensureDeckProgress(progress, playerId, deckId){
  progress.players ||= {};
  progress.players[playerId] ||= { name: null, decks: {} };
  const p = progress.players[playerId];
  p.decks ||= {};
  p.decks[deckId] = sanitizeDeckProgress(p.decks[deckId]);
  return p.decks[deckId];
}

export function updateProgressAfterAnswer(dProg, itemId, ok){
  dProg.itemStats ||= {};
  const st = dProg.itemStats[itemId] || { c:0, w:0, lastSeen:null };
  if (ok) st.c++; else st.w++;
  st.lastSeen = nowISO();
  dProg.itemStats[itemId] = st;

  if (!ok){
    dProg.errorsRecent ||= [];
    dProg.errorsRecent.unshift(itemId);
    dProg.errorsRecent = Array.from(new Set(dProg.errorsRecent)).slice(0, 40);
  } else if (Array.isArray(dProg.errorsRecent) && dProg.errorsRecent.length){
    dProg.errorsRecent = dProg.errorsRecent.filter(id => id !== itemId);
  }
}

export function computeMastery(dProg){
  const c = dProg.correct || 0;
  const w = dProg.wrong || 0;
  const total = c + w;
  if (!total) return 0;
  return Math.round((c / total) * 100);
}
