import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/mobileVisual26.css', import.meta.url), 'utf8');

test('las correcciones móviles cargan después de los estilos existentes y tienen caché propia', () => {
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1\.0"/);
  assert.match(html, /mobileVisual26\.css\?v=1/);
  assert.ok(html.indexOf('matchPostVisual26.css') < html.indexOf('mobileVisual26.css'));
});

test('hay soporte para vertical y horizontal de móvil sin perder navegación', () => {
  assert.match(css, /max-width: 780px/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /\.pcf-mobile-nav\s*\{/);
  assert.match(css, /\.pcf-shortcuts__list\s*\{/);
  for (const target of ['dashboard','squad','nextmatch','transfermarket']) {
    assert.match(html, new RegExp(`data-nav-target="${target}"`));
  }
  assert.match(html, /id="pcf-mobile-more"/);
  assert.match(css, /safe-area-inset-bottom/);
});

test('las cuatro familias del menú y los tres elementos centrales tienen filas independientes', () => {
  for (const selector of [
    'pcf-inbox','pcf-center__ball','pcf-nextcard','pcf-big-action',
    'pcf-panel--competitions','pcf-panel--style','pcf-panel--club','pcf-panel--market','pcf-news',
  ]) assert.ok(css.includes(`#screen-dashboard .${selector}`), `${selector} tiene colocación móvil`);
  assert.match(css, /\.pcf-center__ball\s*\{[^}]*grid-row:\s*2/);
  assert.match(css, /\.pcf-nextcard\s*\{[^}]*grid-row:\s*3/);
  assert.match(css, /\.pcf-big-action\s*\{[^}]*grid-row:\s*4/);
});

test('las tablas mantienen todos sus campos con scroll interior y formularios flexibles', () => {
  for (const wrapper of ['table-wrapper','pcf-table-wrapper','squad-table-wrapper','competition-table-wrapper'])
    assert.ok(css.includes(`.${wrapper}`));
  assert.match(css, /overflow-x:auto/);
  assert.match(css, /\.table-squad\s*\{\s*min-width:/);
  assert.match(css, /\.market-toolbar\s*\{/);
  assert.match(css, /\.squad-toolbar\s*\{/);
  assert.doesNotMatch(css, /display:\s*none[^;]*;[^}]*table-squad/);
});

test('cronología de postpartido pasa a una pista vertical sin eliminar eventos', () => {
  assert.match(css, /\.pcf-mtl__item\s*\{[^}]*grid-template-columns:36px minmax\(0,1fr\)/);
  assert.match(css, /\.pcf-mtl__main,[\s\S]*?white-space:normal/);
  for (const side of ['is-home','is-away','is-neutral']) assert.match(css, new RegExp(side));
});
