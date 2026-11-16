import test from 'node:test';
import assert from 'node:assert/strict';
import { allLeagues } from '../js/data.js';
import { OBSERVED_MATCHLOGS_2026_27 } from '../js/game/tactics/observed2026.js';
import { FORMATION_ROLES, FORMATION_EFFECTS } from '../js/game/tactics/identity.js';
import { getFormationSlots } from '../js/game/utils/tacticsState.js';

const fixtureRecords = Object.entries(OBSERVED_MATCHLOGS_2026_27);
const allClubs = allLeagues.flatMap(league => league.clubs);
const observedClubs = allClubs.filter(club => club.tacticalIdentity.sourceType === 'observed-matchlogs-2026/27');

test('48 clubes tienen un registro multijornada trazable; 224 mantienen estimación explícita', () => {
  assert.equal(fixtureRecords.length, 48);
  assert.equal(observedClubs.length, 48);
  assert.equal(allClubs.length - observedClubs.length, 224);
  const laLiga = allLeagues.find(league => league.id === 'league_es_primera');
  assert.ok(laLiga);
  assert.equal(laLiga.clubs.filter(club => OBSERVED_MATCHLOGS_2026_27[club.id]).length, 20);
  assert.equal(fixtureRecords.length - 20, 28);
});

test('cada observación conserva URL, ámbito, frecuencia completa y sistema verdaderamente repetido', () => {
  for (const [id, record] of fixtureRecords) {
    assert.ok(record.fixtures >= 5, id);
    assert.match(record.source, /^https:\/\/fbref\.com\/en\/squads\//, id);
    assert.ok(['domestic-league', 'all-competitions'].includes(record.scope), id);
    const variants = Object.entries(record.formations);
    assert.equal(variants.reduce((total, [, count]) => total + count, 0), record.fixtures, id);
    assert.ok(variants.every(([name, count]) => /^\d(?:-\d){2,4}$/.test(name)
      && Number.isInteger(count) && count > 0), id);
    assert.ok(FORMATION_ROLES[record.preferred], id);
    const max = Math.max(...Object.values(record.formations));
    assert.equal(record.formations[record.preferred], max, id);
    const club = allClubs.find(candidate => candidate.id === id);
    assert.ok(club, id);
    assert.equal(club.tacticalIdentity.formation, record.preferred, id);
    assert.equal(club.tacticalIdentity.observedGames, record.fixtures, id);
    assert.equal(club.tacticalIdentity.observedFormationMatches, max, id);
    assert.equal(club.tacticalIdentity.sourceScope, record.scope, id);
    assert.equal(club.tacticalIdentity.source, record.source, id);
    assert.ok(FORMATION_ROLES[club.tacticalIdentity.alternate], id);
    assert.notEqual(club.tacticalIdentity.formation, club.tacticalIdentity.alternate, id);
    const alternateCount = record.formations[club.tacticalIdentity.alternate] || 0;
    assert.equal(club.tacticalIdentity.alternateSourceType,
      alternateCount >= 2 ? 'observed-matchlogs-2026/27' : 'estimated-from-roster', id);
  }
});

test('las alineaciones contrastadas son reconocibles, incluyendo empates y variantes poco habituales', () => {
  const lookup = id => allClubs.find(club => club.id === id).tacticalIdentity;
  assert.equal(lookup('barcelona').formation, '4-3-3');
  assert.equal(lookup('realmadrid').formation, '4-2-3-1');
  assert.equal(lookup('atletico').formation, '4-4-2');
  assert.equal(lookup('inter').formation, '3-5-2');
  assert.equal(lookup('benfica').formation, '4-2-3-1');
  assert.equal(lookup('celta').formation, '3-4-3');
  assert.equal(lookup('valencia').formation, '5-4-1');
  assert.equal(lookup('malaga').formation, '4-1-4-1');
  assert.equal(lookup('leipzig').formation, '4-5-1');
  assert.equal(lookup('chelsea').formation, '4-2-3-1');
  assert.equal(lookup('atalanta').formation, '4-2-3-1');
  assert.equal(lookup('elche').formation, '4-3-3');
  assert.equal(lookup('mancity').sourceType, 'observed-matchlogs-2026/27');
  assert.equal(lookup('girona').sourceType, 'estimated-from-roster');
});

test('nueve formaciones están disponibles en el motor, con 11 roles y posiciones de bandas', () => {
  assert.equal(Object.keys(FORMATION_ROLES).length, 9);
  for (const [formation, roles] of Object.entries(FORMATION_ROLES)) {
    assert.ok(FORMATION_EFFECTS[formation], formation);
    assert.equal(roles.length, 11, formation);
    assert.equal(roles[0], 'GK', formation);
    const slots = getFormationSlots(formation);
    assert.equal(slots.length, 11, formation);
    assert.deepEqual(slots.map(slot => slot.position), roles, formation);
    const left = slots.find(slot => ['LB', 'LWB'].includes(slot.position));
    const right = slots.find(slot => ['RB', 'RWB'].includes(slot.position));
    assert.ok(left.x < right.x, formation);
  }
});
