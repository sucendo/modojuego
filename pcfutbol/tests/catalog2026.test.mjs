import test from 'node:test';
import assert from 'node:assert/strict';

import { allLeagues } from '../js/data.js';
import { newGame, GameState } from '../js/state.js';
import { getSeasonLabel, getSeasonStartYear } from '../js/gameSeason.js';

const expected = {
  España: [20, 22],
  Inglaterra: [20, 24],
  Italia: [20, 20],
  Alemania: [18, 18],
  Francia: [18, 18],
  Portugal: [18, 18],
  'Países Bajos': [18, 20],
};

test('2026/27 incluye 14 ligas con 272 clubes únicos, sin perder descendidos', () => {
  assert.equal(getSeasonStartYear(1), 2026);
  assert.equal(getSeasonLabel(1), '2026/27');
  assert.equal(allLeagues.length, 14);
  const ids = new Set();
  const playerIds = new Set();
  for (const [country, sizes] of Object.entries(expected)) {
    const divisions = allLeagues.filter((league) => league.country === country);
    assert.deepEqual(divisions.map((league) => league.clubs.length), sizes, country);
    assert.deepEqual(divisions.map((league) => league.tier), [1, 2], country);
    for (const league of divisions) {
      for (const club of league.clubs) {
        assert.ok(!ids.has(club.id), `Club repetido: ${club.id}`);
        ids.add(club.id);
        assert.ok(club.players.length >= 18, club.name);
      assert.ok(['official-roster', 'published-roster', 'legacy', 'generated'].includes(club.squadSource));
        for (const player of club.players) {
          assert.ok(!playerIds.has(player.id), `Jugador repetido: ${player.id}`);
          playerIds.add(player.id);
        }
      }
    }
  }
  assert.equal(ids.size, 272);
  assert.ok(allLeagues.find(l => l.id === 'league_es_segunda').clubs.some(c => c.id === 'girona'));
  assert.ok(allLeagues.find(l => l.id === 'league_en_championship').clubs.some(c => c.id === 'westham'));
  assert.ok(allLeagues.find(l => l.id === 'league_de_zweite').clubs.some(c => c.id === 'wolfsburg'));
});

test('una nueva partida en Segunda juega 42 jornadas y sincroniza las demás ligas', () => {
  newGame({ leagueId: 'league_es_segunda', clubId: 'realoviedo' });
  assert.equal(GameState.league.tier, 2);
  assert.equal(GameState.user.clubId, 'realoviedo');
  assert.equal(GameState.competition.maxMatchday, 42);
  assert.equal(GameState.fixtures.length, 462);
  assert.equal(GameState.fixtures[0].kickoffDate.slice(0, 4), '2026');
  assert.equal(GameState.world.leagues.length, 13);
  assert.equal(GameState.world.leagues.flatMap(l => l.clubs).length, 250);
  assert.ok(GameState.marketState.baselines['1:league_es_segunda:realoviedo']);
});

test('filiales identificados para impedir ascensos ilegales en futuras temporadas', () => {
  const getClub = (id) => allLeagues.flatMap(l => l.clubs).find(c => c.id === id);
  assert.equal(getClub('celta_fortuna').parentClubId, 'celta');
  assert.equal(getClub('jong_ajax').parentClubId, 'ajax');
  assert.equal(getClub('porto_b').parentClubId, 'porto');
});
