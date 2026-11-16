import { fitPlayersToFormation } from './identity.js';
import { ensurePlayerPositionData } from './positions.js';

// Aprendizaje posicional ligero y conservador. Se aplica una sola vez
// por fixture, tras terminar el encuentro, tanto en liga activa como mundial.
// Cuenta únicamente el XI inicial; cambios de sistema ponderados por minutos.
export function applyFixturePositionExperience(fixture, home, away) {
  if (!fixture || fixture.positionExperienceApplied) return false;
  if (!home || !away || !Array.isArray(fixture.homeLineupIds) || !Array.isArray(fixture.awayLineupIds)) return false;

  const split = Number(fixture.goalPhases?.splitMinute);
  const minute = Number.isFinite(split) ? Math.max(0, Math.min(90, split)) : 90;
  const phases = Array.isArray(fixture.tacticalPhases) ? fixture.tacticalPhases : [];
  for (const [side, club, ids] of [
    ['home', home, fixture.homeLineupIds],
    ['away', away, fixture.awayLineupIds],
  ]) {
    const byId = new Map((club.players || []).map(player => [String(player.id), player]));
    const xi = ids.map(id => byId.get(String(id))).filter(Boolean);
    const baseFormation = club.tactics?.formation || club.alignment?.formation || '4-4-2';
    for (const [formation, portion] of [
      [phases[0]?.[side]?.formation || baseFormation, minute / 90],
      [phases[1]?.[side]?.formation || phases[0]?.[side]?.formation || baseFormation, (90 - minute) / 90],
    ]) {
      if (!portion) continue;
      for (const slot of fitPlayersToFormation(xi, formation)) {
        const player = slot.player;
        if (!player) continue;
        ensurePlayerPositionData(player);
        const key = slot.position;
        player.positionExperience[key] = Math.round(
          ((Number(player.positionExperience[key]) || 0) + portion) * 10000,
        ) / 10000;
      }
    }
  }
  fixture.positionExperienceApplied = true;
  return true;
}
