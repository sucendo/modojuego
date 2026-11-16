// Año inicial para partidas nuevas. Temporada 1 = 2026/27.
export const FIRST_SEASON_YEAR = 2026;

export function getSeasonStartYear(season = 1) {
  return FIRST_SEASON_YEAR + Math.max(1, Number(season) || 1) - 1;
}

export function getSeasonLabel(season = 1) {
  const year = getSeasonStartYear(season);
  return `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
}
