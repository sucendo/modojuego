import test from 'node:test';
import assert from 'node:assert/strict';
import { allLeagues } from '../js/data.js';
import { newGame, GameState, applyLoadedState } from '../js/state.js';
import { FORMATION_ROLES, fitPlayersToFormation, getFormationFit } from '../js/game/tactics/identity.js';
import { chooseMatchPlan } from '../js/game/tactics/matchPlans.js';
import { getClubStrengthProfile, getTacticalAggression } from '../js/game/tactics/strength.js';
import { simulateFixture } from '../js/game/match/simulateFixture.js';
import { simulateQuickWorldFixture } from '../js/game/world/quickSim.js';
import { getFormationSlots } from '../js/game/utils/tacticsState.js';

test('las bandas se dibujan con laterales y extremos en su lado correcto', () => {
  for (const formation of Object.keys(FORMATION_ROLES)) {
    const slots = getFormationSlots(formation);
    assert.equal(slots.length, 11);
    const left = slots.find(s => s.position === 'LB');
    const right = slots.find(s => s.position === 'RB');
    assert.ok(left && right && left.x < right.x, formation);
    const lw = slots.find(s => s.position === 'LW');
    const rw = slots.find(s => s.position === 'RW');
    if (lw && rw) assert.ok(lw.x < rw.x, formation);
  }
});

test('272 clubes reciben identidad distinta y fuentes o marcas de estimación', () => {
  const clubs = allLeagues.flatMap(league => league.clubs);
  assert.equal(clubs.length, 272);
  const formations = new Set();
  for (const club of clubs) {
    const identity = club.tacticalIdentity;
    assert.ok(FORMATION_ROLES[identity.formation], club.name);
    assert.ok(FORMATION_ROLES[identity.alternate], club.name);
    assert.notEqual(identity.formation, identity.alternate, club.name);
    assert.ok(['observed-match-2026/27', 'estimated-from-roster'].includes(identity.sourceType));
    if (identity.sourceType === 'observed-match-2026/27') assert.match(identity.source, /^https:\/\//);
    if (identity.sourceType === 'estimated-from-roster') assert.equal(identity.source, null);
    formations.add(identity.formation);
  }
  assert.equal(formations.size, 6);
  assert.equal(clubs.find(c => c.id === 'barcelona').tacticalIdentity.formation, '4-3-3');
  assert.equal(clubs.find(c => c.id === 'atletico').tacticalIdentity.formation, '4-4-2');
  assert.equal(clubs.find(c => c.id === 'realmadrid').tacticalIdentity.formation, '4-2-3-1');
});

test('al iniciar temporada, los onces encajan con cada sistema sin duplicar al portero', () => {
  newGame();
  const clubs = [...GameState.clubs, ...GameState.world.leagues.flatMap(league => league.clubs)];
  for (const club of clubs) {
    assert.equal(club.tactics.formation, club.tacticalIdentity.formation, club.name);
    assert.equal(club.lineup.length, 11, club.name);
    const xi = club.players.filter(player => club.lineup.includes(player.id));
    assert.equal(xi.filter(player => player.position === 'GK').length, 1, club.name);
    assert.ok(getFormationFit(xi, club.tactics.formation) >= 0.76, club.name);
    const assigned = fitPlayersToFormation(xi, club.tactics.formation);
    assert.equal(new Set(assigned.map(slot => slot.player?.id)).size, 11, club.name);
  }
});

test('la formación escogida por el usuario afecta al motor y se conserva en la partida', () => {
  newGame();
  const club = GameState.clubs[0];
  club.tactics.formation = '5-3-2';
  club.tactics.mentality = 'DEFENSIVE';
  const defensive = getClubStrengthProfile(club, true);
  club.tactics.formation = '3-4-3';
  club.tactics.mentality = 'OFFENSIVE';
  const offensive = getClubStrengthProfile(club, true);
  assert.ok(offensive.attack > defensive.attack);
  assert.ok(defensive.defense > offensive.defense);
  const snapshot = structuredClone(GameState);
  applyLoadedState(snapshot);
  assert.equal(GameState.clubs[0].tactics.formation, '3-4-3');
  assert.equal(GameState.clubs[0].tactics.mentality, 'OFFENSIVE');
});

test('la IA cambia el plan si va perdiendo, pero no controla al equipo humano', () => {
  const club = {
    id: 'ai', players: [], alignment: { formation: '4-4-2' },
    tacticalIdentity: { alternate: '4-3-3', manager: { risk: 0.9, adaptability: 0.9 } },
  };
  const rival = { id: 'human', players: [] };
  const initial = chooseMatchPlan(club, rival, { userClubId: 'human' });
  const trailing = chooseMatchPlan(club, rival, { minute: 65, goalDifference: -1, userClubId: 'human' });
  assert.equal(initial.formation, '4-4-2');
  assert.equal(trailing.formation, '4-3-3');
  assert.equal(trailing.mentality, 'OFFENSIVE');
  assert.equal(trailing.reason, 'CHASING_GAME');
  const human = chooseMatchPlan({ ...club, id: 'human' }, rival,
    { minute: 65, goalDifference: -3, userClubId: 'human' });
  assert.equal(human.formation, '4-4-2');
  assert.equal(human.reason, 'USER_CHOICE');
});

test('un partido registra fases, cambios y goles coherentes con cada fase sin mover la plantilla', () => {
  newGame();
  const home = GameState.clubs[0];
  const away = GameState.clubs[1];
  const original = [home, away].map(c => c.players.map(p => p.id));
  const fx = { id: 'fx_tactics_test', homeClubId: home.id, awayClubId: away.id };
  simulateFixture(fx, {
    getClubById: id => GameState.clubs.find(c => c.id === id),
    applyMatchEffectsToClub: () => {},
    getTacticalAggression,
    userClubId: home.id,
  });
  assert.equal(fx.tacticalPhases.length, 2);
  assert.equal(fx.tacticalPhases[0].minute, 0);
  assert.equal(fx.tacticalPhases[1].minute, 65);
  assert.equal(fx.tacticalPhases[1].home.reason, 'USER_CHOICE');
  assert.equal(fx.goalPhases.home[0] + fx.goalPhases.home[1], fx.homeGoals);
  assert.equal(fx.goalPhases.away[0] + fx.goalPhases.away[1], fx.awayGoals);
  for (const club of [home, away]) assert.deepEqual(club.players.map(p => p.id), original.shift());
  for (const clubId of [home.id, away.id]) {
    const stages = clubId === home.id ? fx.goalPhases.home : fx.goalPhases.away;
    const goals = fx.events.filter(e => e.type === 'GOAL' && e.clubId === clubId);
    assert.equal(goals.filter(e => e.minute < 65).length, stages[0]);
    assert.equal(goals.filter(e => e.minute >= 65).length, stages[1]);
  }
});

test('las ligas paralelas también aplican táctica y once con un solo portero', () => {
  newGame();
  const league = GameState.world.leagues[0];
  const fx = league.fixtures[0];
  simulateQuickWorldFixture(fx, league);
  assert.equal(fx.tacticalPhases.length, 2);
  assert.equal(fx.goalPhases.home.reduce((a, b) => a + b, 0), fx.homeGoals);
  const home = league.clubs.find(c => c.id === fx.homeClubId);
  const byId = new Map(home.players.map(p => [p.id, p]));
  assert.equal(fx.homeLineupIds.length, 11);
  assert.equal(fx.homeLineupIds.filter(id => byId.get(id)?.position === 'GK').length, 1);
});
