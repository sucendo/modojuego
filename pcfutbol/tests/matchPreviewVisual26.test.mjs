import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  computePreviewInsights, getPreviewKeyPlayer, getPreviewRatings,
} from '../js/ui/utils/matchPreviewInsights.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/matchPreviewVisual26.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../js/ui/nextMatchView.js', import.meta.url), 'utf8');
const preview = html.split('<!-- PREVIA (PCF) -->')[1]?.split('<!-- FINAL (PCF) -->')[0] || '';

test('la nueva previa conserva todos los identificadores usados por los controles anteriores', () => {
  for (const id of [
    'nextmatch-card-pre', 'nextmatch-pre', 'nextmatch-pre-home-coach', 'nextmatch-pre-away-coach',
    'nextmatch-pre-home-coat', 'nextmatch-pre-away-coat', 'nextmatch-pre-home-name',
    'nextmatch-pre-away-name', 'nextmatch-pre-home-pitch', 'nextmatch-pre-away-pitch',
    'nextmatch-pre-home-xi', 'nextmatch-pre-away-xi', 'nextmatch-pre-home-bench',
    'nextmatch-pre-away-bench', 'nextmatch-pre-home-out', 'nextmatch-pre-away-out',
    'nextmatch-next-title', 'nextmatch-next-meta', 'nextmatch-next-stadium',
    'nextmatch-next-attendance', 'nextmatch-expect-match', 'nextmatch-expect-general',
    'nextmatch-open-next-detail', 'nextmatch-simulate',
  ]) {
    assert.equal((preview.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${id} ausente o duplicado`);
  }
  assert.match(html, /id="nextmatch-card-post"/);
  assert.match(html, /id="nextmatch-continue"/);
  assert.match(js, /trySimulateFromMatchScreen\(\)/);
  assert.match(js, /ensureLineupBoundToMiniPitch\(homeXiEl, homePitchEl\)/);
});

test('dos campos y titulares completos; reservas y no convocados tienen scroll propio', () => {
  assert.match(css, /#view-nextmatch \.pcf-pre-shell \{/);
  assert.equal((preview.match(/pcf-squadcol--xi/g) || []).length, 2);
  assert.equal((preview.match(/pcf-squadcol--scroll/g) || []).length, 4);
  assert.match(css, /\.pcf-squadcol--scroll \.pcf-lineup \{[^}]*max-height: 153px;[^}]*overflow-y: auto;/);
  assert.doesNotMatch(js, /function renderNotCalledList\([^)]*maxItems/);
  assert.match(html, /data-nav-target="alignment"/);
  assert.match(html, /data-nav-target="tactics"/);
});

test('datos enriquecidos conectados a la partida y diseño aislado del postpartido', () => {
  for (const id of [
    'nextmatch-pre-home-form', 'nextmatch-pre-away-form',
    'nextmatch-pre-home-standing', 'nextmatch-pre-away-standing',
    'nextmatch-pre-home-key', 'nextmatch-pre-away-key',
    'nextmatch-pre-home-absences', 'nextmatch-pre-away-absences',
    'nextmatch-pre-referee', 'nextmatch-pre-weather',
    'nextmatch-pre-head-to-head', 'nextmatch-pre-comparison',
  ]) assert.equal((preview.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, id);
  assert.match(html, /matchPreviewVisual26\.css\?v=1/);
  assert.match(css, /#view-nextmatch/);
  assert.match(js, /nextFx\.refereeName/);
  assert.match(js, /nextFx\.meta\?\.weather/);
  assert.match(js, /isPlayerInjuredNow/);
  assert.match(js, /isPlayerSuspendedNow/);
});

test('clasificación, racha y enfrentamientos nunca incluyen el partido futuro', () => {
  const clubs = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  const fixtures = [
    { homeClubId: 'A', awayClubId: 'B', matchday: 1, homeGoals: 2, awayGoals: 1, played: true },
    { homeClubId: 'C', awayClubId: 'A', matchday: 2, homeGoals: 1, awayGoals: 1, played: true },
    { homeClubId: 'B', awayClubId: 'A', matchday: 3, homeGoals: 9, awayGoals: 0, played: true },
  ];
  const result = computePreviewInsights({ fixtures, clubs, homeId: 'A', awayId: 'B', beforeMatchday: 3 });
  assert.deepEqual(result.home.form.map(f => f.result), ['V', 'E']);
  assert.equal(result.home.points, 4);
  assert.equal(result.home.rank, 1);
  assert.deepEqual(result.headToHead, { played: 1, homeWins: 1, draws: 0, awayWins: 0 });
});

test('la previa indica ausencia de historial y no fabrica clasificaciones o notas', () => {
  const empty = computePreviewInsights({ clubs: [{ id: 'A' }, { id: 'B' }], homeId: 'A', awayId: 'B' });
  assert.equal(empty.home.rank, null);
  assert.equal(empty.headToHead.played, 0);
  assert.deepEqual(getPreviewRatings([], []), { xi: null, best: null, bench: null });
  assert.equal(getPreviewKeyPlayer([]), null);
});

test('jugador destacado y medias utilizan únicamente datos numéricos conocidos', () => {
  const xi = [
    { name: 'Portero', position: 'GK', overall: 92 },
    { name: 'Delantero', position: 'ST', overall: 84 },
    { name: 'Defensa', position: 'DEF', overall: 82 },
  ];
  assert.equal(getPreviewKeyPlayer(xi).name, 'Delantero');
  assert.deepEqual(getPreviewRatings(xi, [{ overall: 72 }, { overall: 74 }]), { xi: 86, best: 92, bench: 73 });
});
