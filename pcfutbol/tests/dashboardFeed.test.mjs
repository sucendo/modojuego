import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { buildClubInbox, buildFootballNews } from '../js/ui/dashboardFeed.js';

const home = {
  id: 'home', name: 'Club local',
  players: [{ id: 'p1', name: 'Jugador Uno', injury: { matchesRemaining: 2 } },
    { id: 'p2', name: 'Jugador Dos', suspension: { matchesRemaining: 1 } }],
  lineup: [],
};
const away = { id: 'away', name: 'Rival', shortName: 'Rival', players: [] };
const state = {
  clubs: [home, away], world: { leagues: [] }, user: { clubId: 'home' },
  currentDate: { season: 1, matchday: 1 },
  fixtures: [{ id: 'f1', homeClubId: 'home', awayClubId: 'away', matchday: 1, played: false }],
  transferHistory: [], marketState: null,
};

test('la bandeja contiene bajas reales y acciones disponibles, sin gestiones inventadas', () => {
  const tasks = buildClubInbox(state, home);
  assert.equal(tasks[0].tag, 'PARTE MÉDICO');
  assert.equal(tasks[0].target, 'medical');
  assert.equal(tasks[1].tag, 'SANCIÓN');
  assert.ok(tasks.some(task => task.target === 'nextmatch'));
  assert.ok(!tasks.some(task => /derechos de tv|entradas/i.test(task.title)));
});

test('al no haber urgencias el panel mantiene una acción útil', () => {
  const empty = buildClubInbox({ ...state, fixtures: [] }, { ...home, players: [] });
  assert.deepEqual(empty.map(task => task.id), ['clear']);
});

test('la actualidad refleja fichajes, resultados y próximo rival reales', () => {
  const withEvents = {
    ...state,
    fixtures: [
      { id: 'f2', homeClubId: 'away', awayClubId: 'home', matchday: 1, played: true, homeGoals: 2, awayGoals: 1 },
      { ...state.fixtures[0], matchday: 2 },
    ],
    transferHistory: [{ id: 't1', playerName: 'Delantero', fromClubId: 'away', toClubId: 'home', toClubName: 'Club local' }],
  };
  const news = buildFootballNews(withEvents, home);
  assert.ok(news.some(item => item.title.includes('Delantero ficha')));
  assert.ok(news.some(item => item.title.includes('Rival 2-1 Club local')));
  assert.ok(news.some(item => item.tag === 'PRÓXIMO RIVAL'));
  assert.ok(news.every(item => ['results', 'transfermarket', 'calendar'].includes(item.target)));
});

test('sin actividad la actualidad explica que las noticias llegan con la simulación', () => {
  const news = buildFootballNews({ ...state, fixtures: [] }, home);
  assert.equal(news.length, 1);
  assert.equal(news[0].tag, 'TEMPORADA');
});

test('la portada conserva los controles originales y añade una navegación móvil completa', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of [
    'hud-next-main', 'hub-next-hint', 'hub-next-comp-logo', 'btn-go-next-match',
    'pcf-inbox-list', 'pcf-news-list', 'pcf-shortcuts-home', 'pcf-shortcuts-list', 'pcf-shortcuts-picker',
    'pcf-mobile-more', 'btn-nav-dashboard', 'btn-nav-medical',
  ]) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${id} duplicado o ausente`);
  }
  assert.equal((html.match(/data-category-toggle/g) || []).length, 4);
  assert.match(html, /class="pcf-mobile-nav"/);
  assert.match(html, /img\/resources\/dashboard-ball-2026-v4\.webp/);
});

test('el menú principal queda anclado a la izquierda y no depende de los accesos guardados', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../js/ui/dashboardExtras.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/dashboardVisual26.css', import.meta.url), 'utf8');
  const home = html.indexOf('id="pcf-shortcuts-home"');
  const list = html.indexOf('id="pcf-shortcuts-list"');
  const edit = html.indexOf('id="pcf-shortcuts-edit"');
  assert.ok(home > 0 && home < list && list < edit);
  assert.match(html, /id="pcf-shortcuts-home"[^>]*data-nav-target="dashboard"/);
  assert.match(html, /data-tooltip="Personalizar accesos rápidos"/);
  assert.match(css, /\.pcf-shortcuts__edit:hover::after/);
  assert.doesNotMatch(js, /\['dashboard',\s*'[^']+'/);
});

test('la portada 26 mantiene las cuatro familias de opciones accesibles en móvil', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
  assert.match(html, /class="pcf-brand"/);
  assert.match(html, /PC <strong>FÚTBOL<\/strong> <b>26<\/b>/);
  for (const icon of ['ico-standings', 'ico-tactics', 'ico-stadium', 'ico-transfers']) {
    assert.match(html, new RegExp(`class="pcf-category__art"[^>]*>[\\s\\S]*?#${icon}`));
  }
  assert.equal((html.match(/class="pcf-category__label"/g) || []).length, 4);
  assert.match(styles, /\.pcf-category__art/);
  assert.match(styles, /@media \(max-width:780px\)/);
  assert.match(styles, /#screen-dashboard \.pcf-panel\.is-expanded \.pcf-panel__category-toggle/);
});

test('el acabado cinematográfico es local y recupera los títulos de los paneles', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/dashboardVisual26.css', import.meta.url), 'utf8');
  assert.match(html, /css\/dashboardVisual26\.css/);
  assert.match(html, /id="pcf-news-more"/);
  assert.match(css, /pcf-panel__category-toggle > \.pcf-category__label \{ display:inline; \}/);
  for (const asset of ['stadium-night-2026.webp', 'dashboard-category-icons-2026.webp', 'dashboard-news-2026.webp', 'dashboard-ball-2026-v4.webp']) {
    const file = new URL(`../img/resources/${asset}`, import.meta.url);
    assert.ok(existsSync(file), `${asset} ausente`);
    assert.ok(statSync(file).size < 200_000, `${asset} no está optimizado`);
    assert.match(asset === 'dashboard-ball-2026-v4.webp' ? html : css, new RegExp(asset.replace('.', '\\.')));
  }
});

test('la pantalla de referencia presenta fotos, competición centrada y partido a todo el ancho', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/dashboardVisual26.css', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../js/ui/dashboardExtras.js', import.meta.url), 'utf8');
  assert.equal((html.match(/id="hub-next-comp-logo"/g) || []).length, 1);
  assert.match(html, /class="pcf-nextcard__competition"/);
  assert.match(css, /#screen-dashboard \.pcf-news \.pcf-feed-item__emblem--photo \{/);
  assert.match(css, /'inbox match match match news'/);
  assert.match(css, /'inbox action action action news'/);
  assert.match(css, /@media\(min-width:1241px\) and \(max-height:820px\)/);
  assert.match(css, /\.pcf-news:not\(\.is-expanded\) \.pcf-feed-item:nth-child\(n \+ 3\)/);
  assert.match(js, /function syncNewsMoreButton\(\)/);
});
