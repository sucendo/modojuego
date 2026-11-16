import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPETITIONS_2026_27 } from '../js/catalog_2026_27.js';
import { GOOGLE_SPORTS_COATS, OTHER_REMOTE_COATS } from '../js/ui/utils/coatSources.js';
import {
  createCoatImgElement, getCoatCandidateUrlsForClubId, getCoatUrlForClubId
} from '../js/ui/utils/coats.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clubs = COMPETITIONS_2026_27.flatMap(league => league.clubs);

test('los 272 clubes de las 14 ligas tienen un escudo concreto asignado', () => {
  assert.equal(COMPETITIONS_2026_27.length, 14);
  assert.equal(clubs.length, 272);
  assert.equal(new Set(clubs.map(club => club.id)).size, 272);
  for (const club of clubs) {
    const url = getCoatUrlForClubId(club.id);
    assert.ok(url, `Sin escudo: ${club.name} (${club.id})`);
    assert.match(url, /^(?:https:\/\/|img\/coats\/)/);
  }
  assert.ok(Object.keys(GOOGLE_SPORTS_COATS).length >= 200);
  for (const id of [...Object.keys(GOOGLE_SPORTS_COATS), ...Object.keys(OTHER_REMOTE_COATS)]) {
    assert.ok(clubs.some(club => club.id === id), `ID sin equipo: ${id}`);
  }
});

test('Google Sports tiene prioridad y distingue clubes con nombres parecidos', () => {
  assert.equal(
    getCoatUrlForClubId('villarreal'),
    'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/WKH7Ak5cYD6Qm1EEqXzmVw_96x96.png'
  );
  assert.notEqual(getCoatUrlForClubId('racing_santander'), getCoatUrlForClubId('deportivo'));
  assert.ok(!getCoatUrlForClubId('eindhoven').includes('383.png'), 'FC Eindhoven no es PSV');
  assert.match(getCoatUrlForClubId('eindhoven'), /3892\.png$/);
  assert.match(getCoatUrlForClubId('sabadell'), /11422\.png$/);
  assert.match(getCoatUrlForClubId('jong_psv'), /9715\.png$/);
});

test('todos los archivos PNG locales registrados existen y no escapan de coats', () => {
  for (const club of clubs) {
    for (const src of getCoatCandidateUrlsForClubId(club.id)) {
      if (!src.startsWith('img/coats/')) continue;
      const filename = path.resolve(projectRoot, src);
      assert.ok(filename.startsWith(path.join(projectRoot, 'img', 'coats') + path.sep));
      assert.ok(fs.existsSync(filename), `Archivo inexistente para ${club.id}: ${src}`);
    }
  }
});

test('las imágenes remotas prueban respaldos hasta el emblema local de emergencia', () => {
  const previousDocument = globalThis.document;
  const handlers = {};
  globalThis.document = {
    addEventListener(type, fn) { handlers[type] = fn; },
    createElement(type) {
      assert.equal(type, 'img');
      const classes = new Set();
      return {
        dataset: {}, style: {},
        classList: { add(name) { classes.add(name); }, contains(name) { return classes.has(name); } }
      };
    }
  };
  try {
    const img = createCoatImgElement('villarreal', 'Villarreal CF', 34);
    assert.equal(img.width, 34);
    assert.equal(img.alt, 'Escudo de Villarreal CF');
    assert.match(img.src, /_96x96\.png$/);
    assert.equal(typeof handlers.error, 'function');
    for (let i = 0; i < 10 && !img.src.startsWith('data:image/'); i++) {
      handlers.error({ target: img });
    }
    assert.match(img.src, /^data:image\/svg\+xml/);
  } finally {
    globalThis.document = previousDocument;
  }
});
