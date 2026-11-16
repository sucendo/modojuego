import test from 'node:test';
import assert from 'node:assert/strict';
import { allLeagues } from '../js/data.js';
import { newGame, GameState, applyLoadedState } from '../js/state.js';
import {
  POSITION_NAMES, normalizePosition, ensurePlayerPositionData,
  inferSecondaryPositions, getPositionAffinity, getEffectiveOverall,
} from '../js/game/tactics/positions.js';
import { FORMATION_ROLES, fitPlayersToRoles, fitPlayersToFormation } from '../js/game/tactics/identity.js';
import { getClubStrengthProfile } from '../js/game/tactics/strength.js';
import { applyFixturePositionExperience } from '../js/game/tactics/positionExperience.js';

test('15 demarcaciones nativas, con carrileros, interiores y segundo delantero diferenciados', () => {
  assert.equal(Object.keys(POSITION_NAMES).length, 15);
  for (const code of ['RWB', 'LWB', 'RM', 'LM', 'SS']) {
    assert.equal(normalizePosition(code), code);
    assert.ok(POSITION_NAMES[code]);
    assert.ok(Object.values(FORMATION_ROLES).some(roles => roles.includes(code)));
  }
  assert.equal(normalizePosition('LD'), 'RB');
  assert.equal(normalizePosition('SD'), 'SS');
  assert.equal(normalizePosition('POR'), 'GK');
});

test('la base de datos 2026/27 conserva cada futbolista y tiene campos de posiciones trazables', () => {
  const clubs = allLeagues.flatMap(l => l.clubs);
  assert.equal(clubs.length, 272);
  const players = clubs.flatMap(c => c.players);
  assert.ok(players.length > 7000);
  for (const player of players) {
    assert.ok(POSITION_NAMES[player.position], player.name);
    assert.equal(player.primaryPosition, player.position);
    assert.ok(player.primaryPositionSource, player.name);
    assert.ok(Array.isArray(player.secondaryPositions), player.name);
    assert.ok(player.secondaryPositions.every(item => POSITION_NAMES[item.position]
      && item.position !== player.position
      && item.position !== 'GK'
      && item.sourceType === 'estimated-compatible'), player.name);
    assert.ok(player.versatility >= 0 && player.versatility <= 1, player.name);
    assert.equal(player.versatilitySource, 'simulated');
    assert.deepEqual(player.positionExperience, {});
  }
  assert.ok(players.some(p => p.secondaryPositions.some(s => s.position === 'RWB')));
  assert.ok(players.some(p => p.secondaryPositions.some(s => s.position === 'LWB')));
  assert.ok(players.some(p => p.secondaryPositions.some(s => s.position === 'RM')));
  assert.ok(players.some(p => p.secondaryPositions.some(s => s.position === 'LM')));
  assert.ok(players.some(p => p.secondaryPositions.some(s => s.position === 'SS')));
});

test('la penalización distingue primaria, secundaria, compatible, incompatible y portería', () => {
  const player = ensurePlayerPositionData({ id: 'demo', position: 'RB', overall: 82 });
  assert.equal(getPositionAffinity(player, 'RB'), 1);
  const secondary = getPositionAffinity(player, 'RWB');
  const related = getPositionAffinity(player, 'CB');
  const unrelated = getPositionAffinity(player, 'ST');
  assert.ok(secondary >= .94 && secondary <= .99, String(secondary));
  assert.ok(related >= .75 && related < secondary, String(related));
  assert.ok(unrelated < related, String(unrelated));
  assert.equal(getEffectiveOverall(player, 'RB'), 82);
  assert.ok(getEffectiveOverall(player, 'RWB') >= 77);
  assert.ok(getEffectiveOverall(player, 'ST') <= 60);
  assert.equal(getPositionAffinity(player, 'GK'), .03);
  assert.equal(getPositionAffinity({ position: 'GK' }, 'ST'), .03);
  assert.equal(inferSecondaryPositions('GK').length, 0);
});

test('el XI maximiza valoración efectiva y el motor penaliza una sola vez', () => {
  const roles = FORMATION_ROLES['4-4-2'];
  const players = roles.map((position, i) => ensurePlayerPositionData({
    id: `role_${i}`, position, overall: 80, secondaryPositions: [],
  }));
  const club = { id: 'unit', players, lineup: players.map(p => p.id),
    tactics: { formation: '4-4-2', mentality: 'BALANCED', pressure: 'NORMAL', tempo: 'NORMAL' } };
  const ideal = getClubStrengthProfile(club, false);
  assert.equal(ideal.tacticalFit, 1);
  assert.equal(ideal.attack, 72.3);
  assert.equal(ideal.defense, 72.6);
  // En otro puesto no se cambia el overall original: solo el valor efectivo.
  const rightBack = players[4];
  rightBack.position = 'ST';
  rightBack.primaryPosition = 'ST';
  const outOfRole = getClubStrengthProfile(club, false);
  assert.ok(outOfRole.attack < ideal.attack);
  assert.ok(outOfRole.defense < ideal.defense);
  assert.equal(rightBack.overall, 80);
  const matched = fitPlayersToRoles([
    { id: 'a', overall: 65, position: 'RB', secondaryPositions: [] },
    { id: 'b', overall: 92, position: 'RWB', secondaryPositions: [] },
  ], ['RB']);
  assert.equal(matched[0].player.id, 'b');
});

test('la experiencia por puesto sube con moderación, una vez por partido y queda guardada', () => {
  newGame();
  const home = GameState.clubs[0];
  const away = GameState.clubs[1];
  const fixture = {
    id: 'fixture_position_exp',
    homeLineupIds: [...home.lineup], awayLineupIds: [...away.lineup],
    goalPhases: { splitMinute: 65 },
    tacticalPhases: [
      { home: { formation: '4-4-2' }, away: { formation: '4-4-2' } },
      { home: { formation: '3-5-2' }, away: { formation: '4-4-2' } },
    ],
  };
  const byId = new Map(home.players.map(p => [String(p.id), p]));
  const xi = fixture.homeLineupIds.map(id => byId.get(String(id))).filter(Boolean);
  const initialAssignments = fitPlayersToFormation(xi, '4-4-2');
  const targetSlot = initialAssignments.find(s => s.player && s.position !== s.player.position);
  assert.ok(targetSlot, 'la adaptación se puede medir en un puesto alternativo');
  const player = targetSlot.player;
  const before = getPositionAffinity(player, targetSlot.position);
  assert.equal(applyFixturePositionExperience(fixture, home, away), true);
  assert.equal(fixture.positionExperienceApplied, true);
  assert.ok(player.positionExperience[targetSlot.position] >= 65 / 90 - .01);
  assert.equal(applyFixturePositionExperience(fixture, home, away), false);
  const after = getPositionAffinity(player, targetSlot.position);
  assert.ok(after >= before && after - before <= .01);
  const stored = structuredClone(GameState);
  applyLoadedState(stored);
  const restored = GameState.clubs[0].players.find(p => p.id === player.id);
  assert.deepEqual(restored.positionExperience, player.positionExperience);
});

test('los guardados anteriores migran sin cambios en plantilla, cláusula o valoración', () => {
  newGame();
  const old = structuredClone(GameState);
  const p = old.clubs[0].players[0];
  const identity = { id: p.id, overall: p.overall, wage: p.wage, releaseClause: p.releaseClause };
  delete p.primaryPosition;
  delete p.secondaryPositions;
  delete p.versatility;
  delete p.positionExperience;
  applyLoadedState(old);
  const migrated = GameState.clubs[0].players[0];
  for (const [key, value] of Object.entries(identity)) assert.equal(migrated[key], value);
  assert.equal(migrated.primaryPosition, migrated.position);
  assert.ok(Array.isArray(migrated.secondaryPositions));
  assert.deepEqual(migrated.positionExperience, {});
});
