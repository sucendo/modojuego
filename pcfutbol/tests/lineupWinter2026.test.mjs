import test from 'node:test';
import assert from 'node:assert/strict';

import { allLeagues } from '../js/data.js';
import { GameState, newGame, applyLoadedState } from '../js/state.js';
import { selectValidStartingXI, isGoalkeeper } from '../js/game/utils/lineupSelection.js';
import { getStartingXIForFixture } from '../js/game/match/selection.js';
import { autoPickMatchdaySquad } from '../js/game/utils/tacticsState.js';
import { advanceAiTransferMarket, AI_MARKET_RULES, getMarketClubs } from '../js/game/transferMarket.js';

const begin = () => newGame({ leagueId: 'league_es_primera', clubId: 'realmadrid' });
const all = () => getMarketClubs().map(entry => entry.club);
const gkIn = (club, ids) => ids.filter(id =>
  club.players.some(p => String(p.id) === String(id) && isGoalkeeper(p))).length;

test('los 272 equipos comienzan con un solo portero en el XI y en el motor de partido', () => {
  begin();
  assert.equal(all().length, 272);
  for (const club of all()) {
    assert.equal(club.lineup.length, 11, club.name);
    assert.equal(gkIn(club, club.lineup), 1, club.name);
    const matchXI = getStartingXIForFixture(club);
    assert.equal(matchXI.length, 11, club.name);
    assert.equal(gkIn(club, matchXI), 1, club.name);
  }
});

test('las posiciones 2026/27 son modernas y las subposiciones inferidas están identificadas', () => {
  const valid = new Set(['GK', 'RB', 'LB', 'CB', 'RWB', 'LWB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST', 'SS']);
  const clubs = allLeagues.flatMap(league => league.clubs);
  assert.equal(clubs.length, 272);
  for (const club of clubs) {
    assert.ok(club.players.every(player => valid.has(player.position)), club.name);
    assert.ok(club.players.every(player => typeof player.positionEstimated === 'boolean'), club.name);
    assert.ok(club.players.every(player => player.primaryPosition === player.position), club.name);
    assert.ok(club.players.every(player => player.secondaryPositions.every(secondary =>
      valid.has(secondary.position) && secondary.sourceType)), club.name);
    for (const position of ['GK', 'RB', 'LB', 'CB', 'CM', 'ST']) {
      assert.ok(club.players.some(player => player.position === position), `${club.name}: falta ${position}`);
    }
  }
});

test('una alineación guardada con tres porteros se corrige sin perder la convocatoria', () => {
  begin();
  const club = GameState.clubs.find(c => c.id === 'realmadrid');
  const goalkeeperIds = club.players.filter(isGoalkeeper).map(p => p.id);
  assert.ok(goalkeeperIds.length >= 3);
  const outfield = club.players.filter(p => !isGoalkeeper(p)).map(p => p.id);
  const corrupt = [goalkeeperIds[0], ...outfield.slice(0, 8), goalkeeperIds[1], goalkeeperIds[2]];
  club.lineup = corrupt;
  const save = JSON.parse(JSON.stringify(GameState));
  applyLoadedState(save);
  const restored = GameState.clubs.find(c => c.id === 'realmadrid');
  assert.equal(restored.lineup.length, 11);
  assert.equal(gkIn(restored, restored.lineup), 1);
  assert.equal(restored.bench.filter(id => restored.lineup.includes(id)).length, 0);

  autoPickMatchdaySquad(restored);
  assert.equal(gkIn(restored, restored.lineup), 1);
  const firstKeeper = restored.players.find(p => restored.lineup.includes(p.id) && isGoalkeeper(p));
  firstKeeper.suspension = { type: 'red', matchesRemaining: 1 };
  const backup = getStartingXIForFixture(restored);
  assert.equal(gkIn(restored, backup), 1, 'Un guardameta sancionado debe tener sustituto');
  assert.ok(!backup.includes(firstKeeper.id));
  assert.equal(selectValidStartingXI(restored.players, corrupt).length, 11);
});

test('la IA respeta intactas todas las plantillas hasta el mercado de enero de 2027', () => {
  begin();
  assert.equal(AI_MARKET_RULES.firstSummerSignings, 0);
  const initial = all().map(club => [club.id, club.players.map(p => p.id)]);
  for (let time = Date.UTC(2026, 7, 1); time < Date.UTC(2027, 0, 1); time += 7 * 86400000) {
    assert.equal(advanceAiTransferMarket(new Date(time).toISOString()), 0);
  }
  assert.deepEqual(GameState.transferHistory, []);
  for (const [id, players] of initial) {
    assert.deepEqual(all().find(club => club.id === id).players.map(p => p.id), players, id);
  }
  for (let time = Date.UTC(2027, 0, 1); time <= Date.UTC(2027, 0, 31); time += 7 * 86400000) {
    advanceAiTransferMarket(new Date(time).toISOString());
  }
  assert.ok(GameState.transferHistory.length > 0, 'El mercado debe activarse en enero');
  assert.ok(GameState.transferHistory.every(move => move.gameDate.startsWith('2027-01-')));
  assert.ok(GameState.transferHistory.every(move => move.type === 'ai'));
});
