import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
    'pcf-inbox-list', 'pcf-news-list', 'pcf-shortcuts-list', 'pcf-shortcuts-picker',
    'pcf-mobile-more', 'btn-nav-dashboard', 'btn-nav-medical',
  ]) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${id} duplicado o ausente`);
  }
  assert.equal((html.match(/data-category-toggle/g) || []).length, 4);
  assert.match(html, /class="pcf-mobile-nav"/);
  assert.match(html, /img\/resources\/balonfutbol\.svg/);
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
