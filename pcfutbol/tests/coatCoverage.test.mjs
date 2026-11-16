import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { COMPETITIONS_2026_27 } from '../js/catalog_2026_27.js';
import { GOOGLE_SPORTS_COATS, OTHER_REMOTE_COATS } from '../js/ui/utils/coatSources.js';
import {
  createCoatImgElement, getCoatCandidateUrlsForClubId, getCoatUrlForClubId
} from '../js/ui/utils/coats.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clubs = COMPETITIONS_2026_27.flatMap(league => league.clubs);
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'img', 'coats', '2026-27', 'manifest.json'), 'utf8'));

test('los 272 clubes tienen un PNG local de 96x96 y un manifiesto completo', () => {
  assert.equal(COMPETITIONS_2026_27.length, 14);
  assert.equal(clubs.length, 272);
  assert.equal(new Set(clubs.map(club => club.id)).size, 272);
  assert.equal(Object.keys(manifest.clubs).length, 272);

  for (const club of clubs) {
    const url = getCoatUrlForClubId(club.id);
    assert.equal(url, `img/coats/2026-27/${club.id}.png`);
    assert.deepEqual(getCoatCandidateUrlsForClubId(club.id), [url]);
    const file = path.resolve(projectRoot, url);
    assert.ok(file.startsWith(path.join(projectRoot, 'img', 'coats', '2026-27') + path.sep));
    assert.ok(fs.existsSync(file), `Escudo inexistente: ${club.id}`);
    const buffer = fs.readFileSync(file);
    assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(buffer.readUInt32BE(16), 96, `Anchura incorrecta: ${club.id}`);
    assert.equal(buffer.readUInt32BE(20), 96, `Altura incorrecta: ${club.id}`);
    assert.equal(manifest.clubs[club.id].sha256, createHash('sha256').update(buffer).digest('hex'));
  }
});

test('las referencias remotas solo se usan para actualizar los escudos durante el desarrollo', () => {
  assert.ok(Object.keys(GOOGLE_SPORTS_COATS).length >= 200);
  for (const id of [...Object.keys(GOOGLE_SPORTS_COATS), ...Object.keys(OTHER_REMOTE_COATS)]) {
    assert.ok(clubs.some(club => club.id === id), `Fuente sin club: ${id}`);
  }
  assert.match(GOOGLE_SPORTS_COATS.villarreal, /WKH7Ak5cYD6Qm1EEqXzmVw/);
  assert.notEqual(getCoatUrlForClubId('racing_santander'), getCoatUrlForClubId('deportivo'));
  assert.equal(OTHER_REMOTE_COATS.eindhoven.endsWith('/3892.png'), true);
  assert.equal(OTHER_REMOTE_COATS.sabadell.endsWith('/11422.png'), true);
  assert.equal(OTHER_REMOTE_COATS.jong_psv.endsWith('/9715.png'), true);
});

test('las imágenes usadas durante la partida no apuntan a servicios externos', () => {
  for (const club of clubs) {
    for (const src of getCoatCandidateUrlsForClubId(club.id)) {
      assert.ok(!/^https?:\/\//.test(src), `Imagen remota en tiempo de juego: ${club.id}`);
    }
  }
  assert.equal(getCoatUrlForClubId('../unsafe'), null);
  assert.equal(getCoatUrlForClubId('https://example.org'), null);
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  assert.ok(!/<(?:script|link)[^>]+(?:src|href)=["']https?:\/\//i.test(html));
});

test('ante un archivo local corrupto aparece un SVG de respaldo sin Internet', () => {
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
    assert.equal(img.src, 'img/coats/2026-27/villarreal.png');
    assert.equal(typeof handlers.error, 'function');
    handlers.error({ target: img });
    assert.match(img.src, /^data:image\/svg\+xml/);
  } finally {
    globalThis.document = previousDocument;
  }
});
