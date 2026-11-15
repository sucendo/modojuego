import test from 'node:test';
import assert from 'node:assert/strict';

import { allLeagues } from '../js/data.js';
import { OFFICIAL_SQUADS_2026_27 } from '../js/squads_2026_27.js';

const clubs = allLeagues.flatMap(l => l.clubs);
const club = (id) => clubs.find(c => c.id === id);

test('plantillas oficiales 2026/27: España (40) + Premier (20)', () => {
  assert.equal(Object.keys(OFFICIAL_SQUADS_2026_27).length, 60);
  const verified = clubs.filter(c => c.squadSource === 'official-roster');
  assert.equal(verified.length, 60);
  assert.ok(verified.every(c => c.squadSeason === '2026/27' && /^https:/.test(c.squadReference)));
  assert.ok(verified.every(c => c.players.length >= 16 && c.players.length <= 30));
  assert.ok(verified.every(c => c.players.some(p => ['POR', 'GK'].includes(p.position))));
  assert.ok(verified.every(c => c.players.every(p => p.rosterVerified)));
});

test('sin jugadores ficticios en los clubes verificados; fichajes reales reconocibles', () => {
  assert.ok(club('realmadrid').players.some(p => p.name === 'Kylian Mbappé'));
  assert.ok(!club('realmadrid').players.some(p => p.id === 'rm_rodrygo'), 'Bajas históricas fuera del equipo');
  assert.ok(club('alaves').players.some(p => p.id === 'alaves_sivera'));
  assert.ok(club('arsenal').players.some(p => p.name === 'David Raya'));
  assert.ok(club('arsenal').players.some(p => p.name === 'Bruno Guimarães'));
  assert.ok(club('malaga').players.some(p => p.name.includes('Herrero')));
  assert.ok(club('girona').players.some(p => p.name.includes('Gazzaniga')));
  for (const c of clubs.filter(c => c.squadSource === 'official-roster')) {
    assert.ok(c.players.every(p => !p.name.startsWith('Jugador ')), c.name);
    const ids = c.players.map(p => p.id);
    assert.equal(new Set(ids).size, ids.length, c.name);
  }
});

test('las estimaciones económicas no se confunden con datos de las fuentes', () => {
  const newSigning = club('arsenal').players.find(p => p.name === 'Bruno Guimarães');
  assert.ok(newSigning);
  assert.equal(newSigning.wageEstimated, true);
  assert.equal(newSigning.contractEstimated, true);
  assert.equal(newSigning.valueEstimated, true);
  assert.equal(newSigning.overallEstimated, true);
});
