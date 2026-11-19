import test from 'node:test';
import assert from 'node:assert/strict';

import { allLeagues } from '../js/data.js';
import { GameState, newGame, advanceToNextSeason } from '../js/state.js';
import { OFFICIAL_FIXTURES_2026, OFFICIAL_ROUND_ONLY_2026 } from '../js/game/officialFixtures2026.js';
import { buildOfficialSeason2026 } from '../js/game/officialSeason2026.js';
import { getPendingUserFixtures } from '../js/game/managementCycle.js';
import { syncMainLeagueUpTo } from '../js/game/simulateMatchday.js';

test('2026/27 tiene los 5.056 enfrentamientos oficiales de las 14 ligas', () => {
  assert.equal(Object.keys(OFFICIAL_FIXTURES_2026).length, 14);
  assert.equal(Object.values(OFFICIAL_FIXTURES_2026).flat().length, 5056);

  for (const league of allLeagues) {
    const n = league.clubs.length;
    const ids = league.clubs.map(c => c.id);
    const { fixtures, maxMatchday } = buildOfficialSeason2026(league.id, ids);
    assert.equal(fixtures.length, n * (n - 1), league.id);
    assert.equal(maxMatchday, (n - 1) * 2, league.id);
    const pairings = new Map();
    for (const fx of fixtures) {
      const key = `${fx.homeClubId}|${fx.awayClubId}`;
      pairings.set(key, (pairings.get(key) || 0) + 1);
      assert.equal(fx.meta.official, true);
      assert.equal(fx.meta.source, 'official_2026_27');
      assert.match(fx.meta.scheduleSource, /^https:\/\//);
      assert.match(fx.kickoffDate, /^202[67]-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/);
      assert.equal(fx.played, false);
    }
    assert.equal(pairings.size, n * (n - 1), `${league.id}: partidos duplicados`);
    for (const home of ids) for (const away of ids) {
      if (home !== away) assert.equal(pairings.get(`${home}|${away}`), 1, `${league.id}: ${home}-${away}`);
    }
    for (let md = 1; md <= maxMatchday; md++) {
      const matches = fixtures.filter(fx => fx.matchday === md);
      assert.equal(matches.length, n / 2, `${league.id}: jornada ${md}`);
      assert.equal(new Set(matches.flatMap(fx => [fx.homeClubId, fx.awayClubId])).size, n);
    }
  }
});

test('partidos contrastados en documentos oficiales: localía y jornada', () => {
  const check = (league, md, home, away, day) => {
    const fx = OFFICIAL_FIXTURES_2026[league].find(f => f[0] === md && f[1] === home && f[2] === away);
    assert.ok(fx, `${league} jornada ${md}: ${home}–${away}`);
    assert.equal(fx[3].slice(0, 10), day);
  };
  check('league_es_segunda', 1, 'almeria', 'eldense', '2026-08-16');
  check('league_it_serieb', 1, 'avellino', 'arezzo', '2026-08-22');
  check('league_pt_segunda', 1, 'afs', 'sporting_b', '2026-08-09');
  check('league_pt_segunda', 18, 'sporting_b', 'afs', '2027-01-17');
  check('league_nl_eerste', 1, 'dordrecht', 'jong_ajax', '2026-08-07');
  assert.deepEqual(OFFICIAL_ROUND_ONLY_2026.sort(),
    ['league_es_segunda', 'league_it_serieb', 'league_pt_segunda']);
});

test('la partida aplica el calendario oficial a la liga elegida y a las otras 13', () => {
  newGame({ leagueId: 'league_es_segunda', clubId: 'girona' });
  assert.ok(GameState.fixtures.every(f => f.meta?.official === true), 'LaLiga Hypermotion');
  assert.equal(GameState.fixtures.length, 462);
  assert.equal(GameState.world.leagues.length, 13);
  for (const lg of GameState.world.leagues) {
    assert.ok(lg.fixtures.every(f => f.meta?.official === true), lg.id);
    assert.equal(lg.fixtures.length, lg.clubs.length * (lg.clubs.length - 1), lg.id);
  }
});

test('los partidos aplazados no se simulan solos ni se pierden al cambiar el orden de jornadas', () => {
  newGame({ leagueId: 'league_es_primera', clubId: 'valencia' });
  const pending = getPendingUserFixtures(GameState);
  // Valencia disputa la jornada 2 antes que la 1 por una reprogramación real.
  assert.equal(pending[0].matchday, 2);
  assert.equal(pending[1].matchday, 1);
  assert.equal(GameState.currentDate.matchday, 2, 'La previa inicial debe mostrar el primer encuentro por fecha');
  syncMainLeagueUpTo('2026-08-30T23:59:59Z');
  assert.ok(pending.every(f => f.played === false), 'Nunca avanzar el equipo elegido por simulación de fondo');
});

test('desde 2027/28 se generan temporadas distintas, con máximo dos localías consecutivas', () => {
  newGame({ leagueId: 'league_en_premier', clubId: 'arsenal' });
  advanceToNextSeason();

  assert.equal(GameState.currentDate.season, 2);
  const leagues = [{ id: GameState.league.id, fixtures: GameState.fixtures, clubs: GameState.clubs },
    ...GameState.world.leagues];
  for (const league of leagues) {
    assert.ok(league.fixtures.every(f => f.meta?.official === false), league.id);
    assert.ok(league.fixtures.every(f => f.kickoffDate.slice(0, 4) >= '2027'), league.id);
    for (const club of league.clubs) {
      const schedule = league.fixtures.filter(f => f.homeClubId === club.id || f.awayClubId === club.id)
        .sort((a, b) => a.matchday - b.matchday);
      const sequence = schedule.map(f => f.homeClubId === club.id ? 'H' : 'A').join('');
      assert.doesNotMatch(sequence, /HHH|AAA/, `${league.id}, ${club.id}: ${sequence}`);
      assert.equal((sequence.match(/H/g) || []).length, league.clubs.length - 1);
      assert.equal((sequence.match(/A/g) || []).length, league.clubs.length - 1);
    }
  }
});
