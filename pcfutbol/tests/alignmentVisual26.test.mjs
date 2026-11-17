import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/alignmentVisual26.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../js/ui/alignment.js', import.meta.url), 'utf8');
const alignment = html.split('<!-- SUBVISTA: ALINEACIÓN -->')[1]?.split('<!-- SUBVISTA: TÁCTICAS -->')[0] || '';

test('el rediseño conserva las tres listas, el campo, las medias y la ficha existentes', () => {
  assert.match(html, /css\/alignmentVisual26\.css\?v=3/);
  for (const id of [
    'alignment-xi-body', 'alignment-bench-body', 'alignment-out-body',
    'alignment-pitch', 'alignment-team-card', 'alignment-player-card', 'alignment-xi-count',
  ]) {
    assert.equal((alignment.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `Falta o se duplica ${id}`);
  }
  const positions = ['alignment-xi-body', 'alignment-bench-body', 'alignment-out-body'].map(id => alignment.indexOf(id));
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2], 'Orden de listas alterado');
  assert.equal((alignment.match(/<th>(EN|CF|CM|CD|CO|MO|EF|ME|ROL|DEM|Estado)<\/th>/g) || []).length, 33);
});

test('la ficha, la media y el campo siguen conectados a la lógica dinámica', () => {
  assert.match(js, /renderPlayerCard\(cardPlayer\)/);
  assert.match(js, /renderTeamCard\(computeXIteamAverages\(club, xiIds, byId\)\)/);
  assert.match(js, /renderPitch\(club\)/);
  assert.match(js, /swapPlayersBetweenGroups\(club, selectedPlayerId, pid\)/);
  assert.match(js, /club\.tactics\?\.manualPositions/);
  assert.match(js, /alignment-pitch-formation/);
  assert.match(js, /alignment-selection-hint/);
  assert.match(js, /addEventListener\('keydown'/);
  assert.match(js, /const ratingTd = \(value\) =>/);
});

test('la presentación mantiene el campo horizontal y no oculta columnas', () => {
  assert.match(css, /#view-alignment \.pcf-alignment-layout/);
  assert.match(css, /aspect-ratio: 1\.83 \/ 1/);
  assert.match(css, /#view-alignment \.pcf-table--alignment \{ min-width: 685px;/);
  assert.match(css, /@media \(max-width: 800px\)/);
  assert.doesNotMatch(css, /#view-alignment [^{}]*\b(?:th|td)\b[^{}]*\{[^}]*display:\s*none/);
});

test('cabecera compacta, titulares completos y desplazamiento independiente por grupo', () => {
  assert.match(alignment, /<h2>Alineación<\/h2>/);
  assert.doesNotMatch(alignment, /id="alignment-formation-label"/);
  assert.doesNotMatch(alignment, /pcf-alignment-eyebrow|pcf-subtitle/);
  assert.match(alignment, /class="pcf-panel pcf-alignment-starters"/);
  assert.equal((alignment.match(/class="pcf-panel pcf-alignment-scroll-list/g) || []).length, 2);
  assert.match(css, /\.pcf-alignment-starters \.pcf-table-wrapper \{ max-height: none;/);
  assert.match(css, /\.pcf-alignment-scroll-list \.pcf-table-wrapper \{[^}]*max-height: 198px;[^}]*overflow-y: auto;/);
  assert.doesNotMatch(css, /\.pcf-alignment-left,\s*#view-alignment \.pcf-alignment-right \{[^}]*overflow-y: auto;/);
  assert.match(css, /\.pcf-alignment-scroll-list \.pcf-table--alignment thead th \{[^}]*position: sticky;/);
});

test('Alineación comparte el único marco exterior sin duplicar borde ni margen inferior', () => {
  const frame = css.match(/#view-alignment \.pcf-alignment-card \{([^}]*)\}/)?.[1];
  assert.ok(frame, 'Falta el contenedor de Alineación');
  assert.match(frame, /margin:\s*0;/);
  assert.match(frame, /border:\s*0;/);
  assert.match(frame, /border-radius:\s*0;/);
  assert.match(frame, /box-shadow:\s*none;/);
});
