import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPostMatchReport, getPostMatchStatGroups } from '../js/ui/utils/matchPostReport.js';
import { buildMatchTimelineHTML } from '../js/ui/utils/matchTimeline.js';
import { generateAdvancedStatsForFixture } from '../js/game/match/advancedStats.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/matchPostVisual26.css', import.meta.url), 'utf8');

const fixture = () => ({
  id:'f1', played:true, homeClubId:'a', awayClubId:'b', homeGoals:2, awayGoals:1,
  meta:{stadiumName:'Estadio de prueba'},
  events:[
    {type:'GOAL',minute:15,clubId:'b',playerId:'b1'},
    {type:'GOAL',minute:41,clubId:'a',playerId:'a1'},
    {type:'GOAL',minute:88,clubId:'a',playerId:'a2'},
    {type:'YELLOW_CARD',minute:62,clubId:'b',playerId:'b1'},
  ],
  substitutions:[{ minute:69,clubId:'a',outPlayerId:'a1',inPlayerId:'a3'}],
  tacticalChanges:[{ minute:65,clubId:'a',fromFormation:'4-4-2',toFormation:'4-3-3',reason:'CHASING_GAME'}],
  teamStats:{home:{possessionPct:55,shotsTotal:12,shotsOnTarget:5,passesCompleted:400,yellows:1,reds:0,distanceKm:109},away:{possessionPct:45,shotsTotal:9,shotsOnTarget:3,passesCompleted:320,yellows:2,reds:1,distanceKm:106}},
});

test('postpartido conserva todos los paneles, datos y controles de navegación', () => {
  for (const id of [
    'nextmatch-card-post','nextmatch-last-title','nextmatch-last-meta','nextmatch-post-hero',
    'nextmatch-post-highlights','nextmatch-last-stats','nextmatch-last-timeline',
    'nextmatch-post-occasions','nextmatch-last-players','nextmatch-last-players-opp',
    'nextmatch-post-sensations','nextmatch-post-referee','nextmatch-post-standings',
    'nextmatch-post-results','nextmatch-open-last-detail','nextmatch-continue',
    'nextmatch-post-report','nextmatch-post-snapshot', 'nextmatch-timeline-controls',
  ]) assert.match(html, new RegExp(`id="${id}"`), `Debe conservar ${id}`);
  for (const tab of ['general','stats','timeline','occasions','contrib','sensations','referee'])
    assert.match(html, new RegExp(`data-tab="${tab}"`));
  assert.match(html, /matchPostVisual26\.css/);
  assert.match(css, /@media \(max-width:530px\)/);
});

test('la cadena de módulos invalida las versiones cacheadas de la previa v13', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(html, /main\.js\?v=14/);
  assert.match(read('../js/main.js'), /ui\/index\.js\?v=14/);
  assert.match(read('../js/ui/index.js'), /ui\.js\?v=14/);
  assert.match(read('../js/ui.js'), /nextMatchView\.js\?v=14/);
  assert.match(read('../js/ui/nextMatchView.js'), /matchTimeline\.js\?v=14/);
});

test('la crónica utiliza resultado, goles y decisiones tácticas registrados', () => {
  const names = new Map([['a1','Lina'],['a2','Mario'],['b1','Pedro']]);
  const report = buildPostMatchReport(fixture(), {homeName:'Local',awayName:'Visitante',playerNames:names});
  assert.match(report.headline, /Local.*2-1/);
  assert.match(report.paragraphs.join(' '), /Pedro.*15'/);
  assert.match(report.paragraphs.join(' '), /Mario.*88'/);
  assert.match(report.paragraphs.join(' '), /4-4-2.*4-3-3/);
  assert.equal(report.moment.title, 'Último gol del partido');
  assert.match(report.moment.detail, /Mario/);
});

test('en un 0-0 no inventa goleadores ni ocasiones', () => {
  const f = fixture();
  f.homeGoals = 0; f.awayGoals = 0; f.events = [];
  f.tacticalChanges = []; f.teamStats = null;
  const report = buildPostMatchReport(f, {homeName:'A',awayName:'B'});
  assert.match(report.headline, /Empate sin goles/);
  assert.match(report.paragraphs.join(' '), /Ninguno.*marcar/);
  assert.doesNotMatch(report.paragraphs.join(' '), /remontada|ocasión|disparo/);
});

test('las estadísticas recuperan las tarjetas con los nombres correctos', () => {
  const groups = getPostMatchStatGroups(fixture());
  const rows = groups.flatMap((group) => group.rows);
  assert.equal(rows.find((r) => r.key === 'yellows').home, 1);
  assert.equal(rows.find((r) => r.key === 'reds').away, 1);
  assert.equal(rows.find((r) => r.key === 'distanceKm').home, 109);
  assert.equal(rows.find((r) => r.key === 'passesCompleted').away, 320);
  assert.deepEqual(getPostMatchStatGroups({}), []);
});

test('la cronología conserva eventos y puede ordenar ascendente con cambios tácticos', () => {
  const f = fixture();
  const opts = {fx:f,playerIndex:new Map(),clubIndex:new Map(),extraEvents:f.tacticalChanges.map((e)=>({...e,type:'TACTICAL'})),order:'asc'};
  const timeline = buildMatchTimelineHTML(opts);
  assert.ok(timeline.indexOf('Inicio del partido') < timeline.indexOf('Descanso'));
  assert.ok(timeline.indexOf('Descanso') < timeline.indexOf('Final del partido'));
  assert.match(timeline, /Cambio de formación/);
  assert.match(timeline, /4-4-2.*4-3-3/);
  const goalsOnly = buildMatchTimelineHTML({...opts,filter:(e)=>e.type==='GOAL'});
  assert.doesNotMatch(goalsOnly, /Cambio de formación/);
});

test('las paradas descuentan los goles encajados, no los marcados', () => {
  const f = { homeGoals:3,awayGoals:1,homeClubId:'a',awayClubId:'b',homeLineupIds:['a1'],awayLineupIds:['b1'],events:[],substitutions:[] };
  const a = {id:'a',players:[{id:'a1',name:'A',position:'GK',overall:80}]};
  const b = {id:'b',players:[{id:'b1',name:'B',position:'GK',overall:80}]};
  generateAdvancedStatsForFixture(f,a,b);
  assert.equal(f.teamStats.home.saves, Math.min(12,Math.max(0,f.teamStats.away.shotsOnTarget - 1)));
  assert.equal(f.teamStats.away.saves, Math.min(12,Math.max(0,f.teamStats.home.shotsOnTarget - 3)));
});
