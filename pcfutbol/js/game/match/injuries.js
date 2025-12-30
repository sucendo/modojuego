// js/game/match/injuries.js
// Lesiones: generación + progresión (depende del módulo medical).

import { ensureClubMedical, getPhysioRecoveryExtraChance } from '../utils/medical.js';

export function progressInjuriesForClub(club, { currentDate } = {}) {
  ensureClubMedical(club);
  const physioChance = getPhysioRecoveryExtraChance(club);
  const players = Array.isArray(club?.players) ? club.players : [];
  players.forEach((p) => {
    if (!p?.injury) return;
    if (typeof p.injury.matchesRemaining !== 'number') return;
    if (p.injury.matchesRemaining <= 0) return;

    // ✅ Si la lesión se produjo en ESTA misma jornada, no la progresamos aún.
    // (La primera “baja” debe contar a partir del siguiente partido.)
    if (currentDate && p.injury.startedSeason != null && p.injury.startedMatchday != null) {
      const sameSeason = Number(p.injury.startedSeason) === Number(currentDate.season);
      const sameMd = Number(p.injury.startedMatchday) === Number(currentDate.matchday);
      if (sameSeason && sameMd) return;
    }

    p.injury.matchesRemaining = Math.max(0, p.injury.matchesRemaining - 1);
    if (p.injury.matchesRemaining > 0 && Math.random() < physioChance) {
      p.injury.matchesRemaining = Math.max(0, p.injury.matchesRemaining - 1);
    }
    if (p.injury.matchesRemaining === 0) {
      p.injury = null;
    }
  });
}

export function generateRandomInjury(riskMult = 1.0, age = null, fitness = 0.9) {
  // Si el riesgo es alto (poca energía/forma mala/edad…), aumenta la probabilidad de lesión más seria.
  let bias = 0;
  if (riskMult >= 1.6) bias += 0.10;
  if (riskMult >= 2.2) bias += 0.08;
  if (fitness < 0.75) bias += 0.08;
  if (Number.isFinite(age) && age >= 33) bias += 0.05;

  let roll = Math.random();
  roll = Math.max(0, Math.min(1, roll + bias));

  if (roll < 0.55) return { type: 'Molestias', matchesRemaining: 1 };
  if (roll < 0.85) return { type: 'Distensión', matchesRemaining: 2 };
  return { type: 'Rotura fibrilar', matchesRemaining: 4 };
}