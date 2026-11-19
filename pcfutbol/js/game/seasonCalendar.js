// Ventanas orientativas para el generador de temporadas posteriores a 2026/27.
// Los cruces y fechas oficiales de 2026/27 se importan en officialSeason2026.js.
import { getSeasonStartYear } from '../gameSeason.js';

export const LEAGUE_CALENDARS = Object.freeze({
  league_es_primera: { start: '08-14', end: '05-23', source: 'https://www.laliga.com/noticias/ya-se-conoce-el-calendario-al-completo-de-laliga-ea-sports-2026-27' },
  league_es_segunda: { start: '08-14', end: '05-30', source: 'https://www.laliga.com/noticias/horarios-de-la-primera-jornada-de-laliga-hypermotion-2026-27' },
  league_en_premier: { start: '08-21', end: '05-30', source: 'https://www.premierleague.com/en/news/4468487' },
  league_en_championship: { start: '08-14', end: '05-01', source: 'https://www.efl.com/competitions/key-dates/' },
  league_it_seriea: { start: '08-21', end: '05-30', source: 'https://www.legaseriea.it/serie-a/news/le-date-della-stagione-2026-2027' },
  league_it_serieb: { start: '08-21', end: '05-29', estimated: true },
  league_de_bundesliga: { start: '08-28', end: '05-22', source: 'https://www.bundesliga.com/en/bundesliga/news/calendar-for-2026-27-season-world-cup-34676' },
  league_de_zweite: { start: '08-07', end: '05-23', source: 'https://www.bundesliga.com/en/bundesliga/news/calendar-for-2026-27-season-world-cup-34676' },
  league_fr_ligue1: { start: '08-21', end: '05-29', winterBreak: ['12-14', '01-01'], source: 'https://ligue1.com/en/articles/l1_article_5292-' },
  league_fr_ligue2: { start: '08-14', end: '05-21', estimated: true },
  league_pt_primeira: { start: '08-07', end: '05-23', source: 'https://www.ligaportugal.pt/news/27682/definido-o-arranque-das-competicoes-profissionais-2026-27' },
  league_pt_segunda: { start: '08-08', end: '05-23', estimated: true },
  league_nl_eredivisie: { start: '08-07', end: '05-23', source: 'https://eredivisie.nl/nieuws/eerste-speelronde-2026-27/' },
  league_nl_eerste: { start: '08-07', end: '05-21', source: 'https://eredivisie.nl/nieuws/eerste-speelronde-2026-27/' },
});

const DAY = 86400000;
const kickoffSlots = [
  [0, '20:30'], [1, '13:00'], [1, '16:15'], [1, '18:30'],
  [1, '21:00'], [2, '12:30'], [2, '16:15'], [2, '18:30'],
  [2, '21:00'], [3, '21:00'], [1, '14:00'], [2, '19:00'],
];

function toDate(year, md, afterNewYear = false) {
  const [month, day] = String(md).split('-').map(Number);
  return Date.UTC(year + (afterNewYear ? 1 : 0), month - 1, day, 12);
}

function configFor(leagueId) {
  return LEAGUE_CALENDARS[String(leagueId)] || { start: '08-14', end: '05-30', estimated: true };
}

function inWinterBreak(date, year, config) {
  if (!config.winterBreak) return false;
  const start = toDate(year, config.winterBreak[0]);
  const end = toDate(year, config.winterBreak[1], true);
  return date >= start && date <= end;
}

export function getLeagueRoundDates(leagueId, season = 1, rounds = 38) {
  const year = getSeasonStartYear(season);
  const config = configFor(leagueId);
  const first = toDate(year, config.start);
  const last = toDate(year, config.end, true);
  const needed = Math.max(0, Math.floor(Number(rounds) || 0));
  if (!needed) return [];

  // Jornadas de fin de semana. La cadencia específica de cada competición
  // permite que unas hayan jugado 4 jornadas cuando otras solo llevan 2.
  let dates = [];
  for (let d = first; d <= last; d += 7 * DAY) {
    if (!inWinterBreak(d, year, config)) dates.push(d);
  }

  // Si faltan fechas (ligas con 42/46 jornadas), insertar jornadas entre
  // semana a intervalos repartidos, nunca dentro de la pausa invernal.
  if (dates.length < needed) {
    const available = [];
    for (let i = 0; i < dates.length - 1; i++) {
      const mid = dates[i] + 3 * DAY;
      if (mid < dates[i + 1] && !inWinterBreak(mid, year, config)) available.push(mid);
    }
    const missing = Math.min(needed - dates.length, available.length);
    const picked = new Set();
    for (let i = 0; i < missing; i++) {
      const index = Math.round(((i + 0.5) * available.length / missing) - 0.5);
      picked.add(available[Math.max(0, Math.min(index, available.length - 1))]);
    }
    dates = [...dates, ...picked].sort((a, b) => a - b);
  }
  // Para ligas cortas, espaciar las jornadas hasta mayo y no acabar en marzo.
  if (dates.length > needed) {
    dates = Array.from({ length: needed }, (_, i) => dates[Math.round(i * (dates.length - 1) / Math.max(1, needed - 1))]);
  }
  // Si faltan por un calendario excepcional, ampliar con miércoles reales.
  while (dates.length < needed) dates.push(dates.at(-1) + 3 * DAY);
  return dates.map(ms => new Date(ms));
}

export function assignLeagueFixtureDates(fixtures, leagueId, season = 1) {
  if (!Array.isArray(fixtures) || !fixtures.length) return fixtures;
  const byRound = new Map();
  for (const fixture of fixtures) {
    if (!fixture) continue;
    const md = Math.max(1, Number(fixture.matchday) || 1);
    if (!byRound.has(md)) byRound.set(md, []);
    byRound.get(md).push(fixture);
  }
  const maxRound = Math.max(...byRound.keys());
  const dates = getLeagueRoundDates(leagueId, season, maxRound);
  const config = configFor(leagueId);
  for (const [md, list] of byRound.entries()) {
    const anchor = dates[md - 1];
    const next = dates[md] || null;
    list.sort((a, b) => String(a.homeClubId).localeCompare(String(b.homeClubId)) ||
      String(a.awayClubId).localeCompare(String(b.awayClubId)));
    list.forEach((fixture, i) => {
      if (fixture.kickoffDate) return; // No sobrescribir fechas oficiales/partidas guardadas.
      const [offset, time] = kickoffSlots[i % kickoffSlots.length];
      const maxOffset = next ? Math.max(0, Math.floor((next.getTime() - anchor.getTime()) / DAY) - 1) : 3;
      const d = new Date(anchor.getTime() + Math.min(offset, maxOffset) * DAY);
      const [hour, minute] = time.split(':').map(Number);
      d.setUTCHours(hour, minute, 0, 0);
      fixture.kickoffTime = time;
      fixture.kickoffDate = d.toISOString();
      fixture.meta ||= {};
      fixture.meta.scheduleSource = Number(season) === 1 ? config.source || null : null;
      fixture.meta.schedulePrecision = config.estimated || Number(season) !== 1
        ? 'generated-estimated-start' : 'generated-official-start';
      fixture.meta.official = false;
    });
  }
  return fixtures;
}
