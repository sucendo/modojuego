import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { allLeagues } from '../js/data.js';
import { GameState, newGame } from '../js/state.js';
import { getLeagueRoundDates, LEAGUE_CALENDARS } from '../js/game/seasonCalendar.js';
import { searchTransferMarket } from '../js/game/transferMarket.js';
import { getCoatUrlForClubId } from '../js/ui/utils/coats.js';
import { getFlagUrlForNationality, getFlagEmojiForNationality } from '../js/ui/utils/flags.js';

const base = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Villarreal: 27 jugadores con nombre, nacionalidad, nacimiento, edad y dorsal verificados', () => {
  const club = allLeagues.find(l => l.id === 'league_es_primera').clubs.find(c => c.id === 'villarreal');
  assert.equal(club.players.length, 27);
  assert.equal(new Set(club.players.map(p => p.shirtNumber)).size, 27);
  for (const player of club.players) {
    assert.ok(player.name.includes(' '), player.name);
    assert.ok(player.biographyVerified, player.name);
    assert.match(player.biographySource, /^https:\/\/www\.laliga\.com\/jugador\//);
    assert.match(player.birthDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(player.nationality, player.name);
    assert.equal(player.ageEstimated, false);
    assert.equal(player.shirtNumberEstimated, false);
    assert.ok(player.age >= 17 && player.age <= 40);
  }
});

test('Primera 2026/27: las 540 fichas de los 20 clubes tienen biografía y dorsal contrastados', () => {
  const clubs = allLeagues.find(league => league.id === 'league_es_primera').clubs;
  assert.equal(clubs.length, 20);
  assert.equal(clubs.reduce((sum, club) => sum + club.players.length, 0), 540);
  for (const club of clubs) {
    const shirts = new Set();
    for (const player of club.players) {
      const context = `${club.id}: ${player.name}`;
      assert.ok(player.biographyVerified === true, `${context} sin verificación`);
      assert.ok(player.fullName?.includes(' '), `${context} sin nombre desarrollado`);
      assert.ok(player.nationality, `${context} sin nacionalidad`);
      assert.match(player.birthDate, /^\d{4}-\d{2}-\d{2}$/, `${context} sin nacimiento`);
      const birth = new Date(`${player.birthDate}T00:00:00Z`);
      assert.equal(birth.toISOString().slice(0, 10), player.birthDate, `${context} fecha inválida`);
      const age = 2026 - birth.getUTCFullYear() - (
        birth.getUTCMonth() > 7 || (birth.getUTCMonth() === 7 && birth.getUTCDate() > 14) ? 1 : 0);
      assert.equal(player.age, age, `${context} edad incoherente al comienzo de temporada`);
      assert.ok(age >= 15 && age <= 43, `${context} edad fuera de rango`);
      assert.equal(player.ageEstimated, false, `${context} edad marcada como estimada`);
      assert.ok(Number.isInteger(player.shirtNumber) && player.shirtNumber > 0 && player.shirtNumber <= 99,
        `${context} dorsal inválido`);
      assert.equal(player.shirtNumberEstimated, false, `${context} dorsal provisional`);
      assert.ok(!shirts.has(player.shirtNumber), `${club.id} dorsal ${player.shirtNumber} duplicado`);
      shirts.add(player.shirtNumber);
      assert.match(player.shirtNumberSource, /^https:\/\/www\.laliga\.com\/clubes\//, `${context} sin fuente de dorsal`);
      assert.match(player.biographySource, /^https:\/\//, `${context} sin fuente biográfica`);
      const flag = getFlagUrlForNationality(player.nationality);
      assert.ok(flag || getFlagEmojiForNationality(player.nationality), `${context} sin bandera`);
      if (flag) assert.ok(existsSync(join(base, flag)), `${context} imagen de bandera ausente`);
    }
  }
});

test('ninguna plantilla deja dorsales vacíos; se señalan las asignaciones provisionales', () => {
  let provisional = 0;
  for (const league of allLeagues) for (const club of league.clubs) {
    for (const player of club.players) {
      assert.ok(Number.isInteger(player.shirtNumber) && player.shirtNumber > 0, `${club.id}: ${player.name}`);
      if (player.shirtNumberEstimated) provisional++;
    }
  }
  assert.ok(provisional > 0, 'Hay ligas que no publican todos los dorsales');
});

test('los 14 campeonatos respetan los cruces oficiales de 2026/27 y pueden generar fechas futuras', () => {
  assert.equal(Object.keys(LEAGUE_CALENDARS).length, allLeagues.length);
  const firstDates = new Set();
  for (const league of allLeagues) {
    const rounds = (league.clubs.length - 1) * 2;
    const dates = getLeagueRoundDates(league.id, 2, rounds);
    assert.equal(dates.length, rounds, league.id);
    dates.forEach((date, i) => {
      assert.ok(Number.isFinite(date.getTime()), league.id);
      if (i) assert.ok(date > dates[i - 1], `${league.id} jornada ${i + 1} repetida`);
    });
    firstDates.add(dates[0].toISOString().slice(0, 10));
    newGame({ leagueId: league.id, clubId: league.clubs[0].id });
    const fixtures = GameState.fixtures.filter(f => f.matchday === 1);
    assert.equal(fixtures.length, league.clubs.length / 2);
    assert.ok(fixtures.every(f => f.kickoffDate && f.meta?.official === true),
      `${league.id} debe tener su calendario oficial`);
    assert.ok(fixtures.every(f => f.kickoffDate.startsWith('2026-')),
      `${league.id} debe comenzar en agosto de 2026`);
  }
  assert.ok(firstDates.size >= 5, 'Los países no deben comenzar todas las ligas el mismo día');
});

test('los escudos disponibles se usan y el resto obtiene un emblema provisional visible', () => {
  for (const id of ['villarreal','crystalpalace','fulham','benfica','porto','sportingcp','genoa','excelsior','fortuna','goahead']) {
    const url = getCoatUrlForClubId(id);
    assert.ok(url.startsWith('img/coats/'), `${id} debería tener escudo real`);
    assert.ok(existsSync(join(base, url)), `${id}: imagen no encontrada ${url}`);
  }
  assert.match(getCoatUrlForClubId('club_sin_escudo'), /^data:image\/svg\+xml/);
});

test('mercado: filtra antes de paginar y permite ordenar por edad o precio', () => {
  newGame({ leagueId: 'league_es_primera', clubId: 'realmadrid' });
  const matches = searchTransferMarket({ leagueId: 'league_es_primera', minAge: 25, maxAge: 30,
    minOverall: 70, maxPrice: 100000000, sortBy: 'age', sortDirection: 'asc', limit: 100 });
  assert.ok(matches.length > 0);
  assert.ok(matches.every(p => p.age >= 25 && p.age <= 30 && p.overall >= 70 && p.price <= 100000000));
  assert.ok(matches.every((p, i) => !i || p.age >= matches[i - 1].age));
  const lowPrices = searchTransferMarket({ sortBy: 'price', sortDirection: 'asc', limit: 25 });
  assert.ok(lowPrices.every((p, i) => !i || p.price >= lowPrices[i - 1].price));
});

test('la negociación utiliza una ventana emergente y las tablas admiten ordenación accesible', () => {
  const html = readFileSync(join(base, 'index.html'), 'utf8');
  assert.equal((html.match(/id="market-modal"/g) || []).length, 1);
  assert.equal((html.match(/id="market-message"/g) || []).length, 1);
  assert.match(html, /id="market-modal"[^>]+aria-hidden="true"/);
  assert.match(html, /id="market-negotiate"/);
  assert.match(html, /data-market-sort="price" tabindex="0"/);
  assert.match(html, /data-squad-sort="AGE" tabindex="0"/);
});
