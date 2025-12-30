// js/game/utils/fixtures.js
// Helpers de fixtures (kickoff, fechas, etc.)

// Devuelve un ISO “canónico” de kickoff para un fixture, usando varios campos posibles.
export function getFixtureKickoffISO(fx) {
  if (!fx) return null;
  return (
    fx.kickoffDate ||
    fx.kickoffUtc ||
    fx.kickoff ||
    fx.dateTime ||
    (fx.dateKey && fx.kickoffTime ? `${fx.dateKey}T${fx.kickoffTime}:00Z` : null) ||
    (fx.dateKey ? `${fx.dateKey}T12:00:00Z` : null)
  );
}