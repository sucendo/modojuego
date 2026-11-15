import test from 'node:test';
import assert from 'node:assert/strict';

import { allLeagues } from '../js/data.js';
import { OFFICIAL_SQUADS_2026_27 } from '../js/squads_2026_27.js';
import { PUBLISHED_SQUADS_2026_27 } from '../js/published_squads_2026_27.js';
import { CLUB_OFFICIAL_SQUADS_2026_27 } from '../js/club_official_squads_2026_27.js';

const clubs = allLeagues.flatMap(l => l.clubs);
const club = (id) => clubs.find(c => c.id === id);

test('Ligue 1: 18 plantillas publicadas, identificadas como independientes de las fuentes oficiales', () => {
  const ligue1 = allLeagues.find(l => l.id === 'league_fr_ligue1');
  assert.equal(ligue1.clubs.length, 18);
  assert.equal(Object.keys(PUBLISHED_SQUADS_2026_27).length, 116);
  assert.ok(ligue1.clubs.every(c => c.squadSource === 'published-roster'));
  assert.ok(ligue1.clubs.every(c => c.players.length >= 16 && c.players.length <= 27));
  assert.ok(ligue1.clubs.every(c => c.players.every(p => p.rosterVerified === false)));
  assert.ok(club('psg').players.some(p => p.name === 'Vitinha' && p.ageEstimated === false));
  assert.ok(club('marseille').players.some(p => p.name === 'Igor Paixão'));
  assert.ok(club('monaco').players.some(p => p.name === 'Folarin Balogun'));
  assert.ok(club('lemans').players.some(p => p.name === 'Habib Diallo'));
});

test('Primeira Liga: 18 equipos con los 470 futbolistas publicados y reconocibles', () => {
  const league = allLeagues.find(l => l.id === 'league_pt_primeira');
  assert.equal(league.clubs.length, 18);
  assert.ok(league.clubs.every(c => c.squadSource === 'published-roster'));
  assert.ok(league.clubs.every(c => c.players.length >= 16 && c.players.length <= 27));
  assert.ok(league.clubs.every(c => c.players.every(p => !p.rosterVerified)));
  assert.ok(club('porto').players.some(p => p.name === 'Diogo Costa'));
  assert.ok(club('benfica').players.some(p => p.name === 'Vangelis Pavlidis'));
  assert.ok(club('sportingcp').players.some(p => p.name === 'Gonçalo Inácio'));
  assert.ok(club('maritimo').players.some(p => p.name === 'Martín Tejón'));
});

test('Championship: 24 equipos con plantillas publicadas para 2026/27', () => {
  const league = allLeagues.find(l => l.id === 'league_en_championship');
  assert.equal(league.clubs.length, 24);
  assert.ok(league.clubs.every(c => c.squadSource === 'published-roster'));
  assert.ok(league.clubs.every(c => c.players.length >= 16 && c.players.length <= 27));
  assert.ok(league.clubs.every(c => c.players.some(p => p.position === 'POR')));
  assert.ok(club('birmingham').players.some(p => p.name === 'Jay Stansfield'));
  assert.ok(club('norwich').players.some(p => p.name === 'Mathias Kvistgaarden'));
  assert.ok(club('wrexham').players.some(p => p.name === 'Nathan Broadhead'));
});

test('Eerste Divisie: 20 plantillas 2026/27 con dorsales y reparto equilibrado', () => {
  const league = allLeagues.find(l => l.id === 'league_nl_eerste');
  assert.equal(league.clubs.length, 20);
  assert.ok(league.clubs.every(c => c.squadSource === 'published-roster'));
  assert.ok(league.clubs.every(c => c.players.length >= 16 && c.players.length <= 27));
  assert.ok(league.clubs.every(c => c.players.filter(p => p.position === 'POR').length >= 2));
  assert.ok(league.clubs.every(c => c.players.filter(p => p.position === 'ST').length >= 2));
  assert.ok(club('vvv').players.some(p => p.name === 'Youri Schoonderwaldt' && p.shirtNumber === 13));
  assert.ok(club('almere').players.some(p => p.name === 'Ferdy Druijf'));
  assert.ok(club('vitesse').players.some(p => p.name === 'Alexander Büttner'));
});

test('Liga Portugal 2: 18 plantillas 2026/27 con dorsales de clubes y filiales', () => {
  const league = allLeagues.find(l => l.id === 'league_pt_segunda');
  assert.equal(league.clubs.length, 18);
  assert.ok(league.clubs.every(c => c.squadSource === 'published-roster'));
  assert.ok(league.clubs.every(c => c.players.length >= 16 && c.players.length <= 27));
  assert.ok(league.clubs.every(c => c.players.filter(p => p.position === 'POR').length >= 2));
  assert.ok(league.clubs.every(c => c.players.filter(p => p.position === 'ST').length >= 2));
  assert.ok(club('tondela').players.some(p => p.name === 'Lucas Cañizares' && p.shirtNumber === 1));
  assert.ok(club('sporting_b').players.some(p => p.name === 'Luka Petrič'));
  assert.ok(club('feirense').players.some(p => p.name === 'Francisco Meixedo'));
});

test('Ligue 2: 18 plantillas 2026/27 de los equipos descendidos y ascendidos', () => {
  const league = allLeagues.find(l => l.id === 'league_fr_ligue2');
  assert.equal(league.clubs.length, 18);
  assert.ok(league.clubs.every(c => c.squadSource === 'published-roster'));
  assert.ok(league.clubs.every(c => c.players.length >= 16 && c.players.length <= 27));
  assert.ok(league.clubs.every(c => c.players.filter(p => p.position === 'POR').length >= 2));
  assert.ok(league.clubs.every(c => c.players.filter(p => p.position === 'ST').length >= 2));
  assert.ok(club('nantes').players.some(p => p.name === 'Maxime Dupé'));
  assert.ok(club('saintetienne').players.some(p => p.name === 'Gautier Larsonneur'));
  assert.ok(club('reims').players.some(p => p.name === 'Tom Ritzy Hülsmann'));
});

test('todas las 272 plantillas de Primera y Segunda son de 2026/27 sin relleno generado', () => {
  assert.equal(clubs.length, 272);
  assert.equal(clubs.filter(c => c.squadSource === 'official-roster').length, 156);
  assert.equal(clubs.filter(c => c.squadSource === 'published-roster').length, 116);
  assert.ok(clubs.every(c => c.squadSeason === '2026/27' && /^https:/.test(c.squadReference)));
  assert.ok(clubs.every(c => c.players.length >= 16 && c.players.length <= 27));
  assert.ok(clubs.every(c => c.players.every(p => p.rosterSeason === '2026/27')));
});

test('Sabadell y Celta Fortuna incorporan jugadores y dorsales de sus clubes oficiales', () => {
  assert.equal(Object.keys(CLUB_OFFICIAL_SQUADS_2026_27).length, 2);
  assert.equal(club('sabadell').squadSource, 'official-roster');
  assert.equal(club('celta_fortuna').squadSource, 'official-roster');
  assert.ok(club('sabadell').players.some(p => p.name === 'Diego Fuoli' && p.shirtNumber === 1));
  assert.ok(club('celta_fortuna').players.some(p => p.name === 'Stefan Bajčetić' && p.shirtNumber === 22));
  assert.ok(club('celta_fortuna').players.some(p => p.name === 'Ángel Arcos'));
});

test('plantillas oficiales 2026/27: España (40), Premier (20), Alemania (36), Países Bajos (18), Italia (40)', () => {
  assert.equal(Object.keys(OFFICIAL_SQUADS_2026_27).length, 154);
  const verified = clubs.filter(c => c.squadSource === 'official-roster');
  assert.equal(verified.length, 156);
  assert.ok(verified.every(c => c.squadSeason === '2026/27' && /^https:/.test(c.squadReference)));
  assert.ok(verified.every(c => c.players.length >= 16 && c.players.length <= 27));
  assert.ok(verified.every(c => c.players.some(p => ['POR', 'GK'].includes(p.position))));
  assert.ok(verified.every(c => c.players.every(p => p.rosterVerified)));
});

test('las dos Bundesligas tienen sus 36 plantillas oficiales con delanteros reconocibles', () => {
  const germanLeagues = allLeagues.filter(l => l.country === 'Alemania');
  assert.equal(germanLeagues.length, 2);
  assert.equal(germanLeagues.flatMap(l => l.clubs).length, 36);
  assert.ok(germanLeagues.every(l => l.clubs.every(c => c.squadSource === 'official-roster')));
  assert.ok(club('bayern').players.some(p => p.name === 'Harry Kane'));
  assert.ok(club('dortmund').players.some(p => p.name === 'Serhou Guirassy'));
  assert.ok(club('schalke').players.some(p => p.name === 'Loris Karius'));
  assert.ok(club('wolfsburg').players.every(p => p.rosterVerified));
});

test('los 18 clubes de Eredivisie tienen sus plantillas actualizadas', () => {
  const league = allLeagues.find(l => l.id === 'league_nl_eredivisie');
  assert.equal(league.clubs.length, 18);
  assert.ok(league.clubs.every(c => c.squadSource === 'official-roster'));
  assert.ok(club('ajax').players.some(p => p.name.includes('ter Stegen')));
  assert.ok(club('psv').players.some(p => p.name.includes('Pepi')));
  assert.ok(club('feyenoord').players.some(p => p.name.includes('Read')));
});

test('Serie B mantiene los 20 clubes y sus futbolistas registrados', () => {
  const league = allLeagues.find(l => l.id === 'league_it_serieb');
  assert.equal(league.clubs.length, 20);
  assert.ok(league.clubs.every(c => c.squadSource === 'official-roster'));
  assert.ok(club('palermo').players.some(p => p.name.includes('Pohjanpalo')));
  assert.ok(club('modena').players.some(p => p.name.includes('Belotti')));
});

test('Serie A incorpora las 20 plantillas oficiales, titulares y dorsales', () => {
  const league = allLeagues.find(l => l.id === 'league_it_seriea');
  assert.equal(league.clubs.length, 20);
  assert.ok(league.clubs.every(c => c.squadSource === 'official-roster'));
  assert.ok(club('inter').players.some(p => p.name.includes('Lautaro') && p.shirtNumber === 10));
  assert.ok(club('acmilan').players.some(p => p.name.includes('Maignan')));
  assert.ok(club('juventus').players.some(p => p.name.includes('Kenan Yildiz')));
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
