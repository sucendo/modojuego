import { GameState } from '../../state.js';

// Calendario interno del juego:
//  - Temporada 1 comienza el 1 de agosto de 2025
//  - Cada jornada suma 7 días
//  - Cada temporada suma 1 año
export const GAME_CALENDAR = {
  BASE_SEASON_YEAR: 2025,
  SEASON_START_MONTH: 8, // agosto
  SEASON_START_DAY: 1,
  DAYS_PER_MATCHDAY: 7,
};

// Devuelve la fecha "real" del juego para una temporada y jornada dadas
export function getGameDateFor(season, matchday) {
  const year = GAME_CALENDAR.BASE_SEASON_YEAR + (season - 1);
  const d = new Date(
    Date.UTC(
      year,
      GAME_CALENDAR.SEASON_START_MONTH - 1,
      GAME_CALENDAR.SEASON_START_DAY
    )
  );

  const md = Math.max(1, matchday || 1);
  const daysToAdd = (md - 1) * GAME_CALENDAR.DAYS_PER_MATCHDAY;
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d;
}

// Fecha actual de juego según GameState.currentDate
export function getCurrentGameDate() {
  const season = GameState.currentDate?.season || 1;
  const matchday = GameState.currentDate?.matchday || 1;
  return getGameDateFor(season, matchday);
}

// Formato "15/09/2025"
export function formatGameDateLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Edad del jugador en función de su fecha de nacimiento y la fecha actual del juego.
// Si no hay birthDate, cae al campo age (para datos antiguos / jugadores ficticios).
export function getPlayerGameAge(player, fallbackAge = null) {
  const dobStr = player?.birthDate;
  if (dobStr) {
    const dob = new Date(dobStr);
    if (!Number.isNaN(dob.getTime())) {
      const now = getCurrentGameDate();
      let age = now.getUTCFullYear() - dob.getUTCFullYear();
      const m = now.getUTCMonth() - dob.getUTCMonth();
      if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) {
        age--;
      }
      if (!Number.isNaN(age) && age >= 0 && age < 60) {
        return age;
      }
    }
  }

  if (typeof player?.age === 'number' && !Number.isNaN(player.age)) {
    return player.age;
  }

  return fallbackAge;
}