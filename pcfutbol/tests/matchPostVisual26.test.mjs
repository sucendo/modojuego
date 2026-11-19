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
    'nextmatch-view-title','nextmatch-matchday-descriptor',
  ]) assert.match(html, new RegExp(`id="${id}"`), `Debe conservar ${id}`);
  for (const tab of ['general','stats','timeline','occasions','contrib','sensations','referee'])
    assert.match(html, new RegExp(`data-tab="${tab}"`));
  assert.match(html, /matchPostVisual26\.css/);
  assert.match(css, /@media \(max-width:530px\)/);
  assert.doesNotMatch(html, /class="pcf-match-card__title pcf-post-section-title"/, 'La cabecera general no debe duplicarse dentro del postpartido');
});

test('la cadena de módulos invalida el código cacheado al incorporar el calendario y las tarifas', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(html, /main\.js\?v=1670/);
  assert.match(html, /matchPostVisual26\.css\?v=141/);
  assert.match(read('../js/main.js'), /ui\/index\.js\?v=1670/);
  assert.match(read('../js/ui/index.js'), /ui\.js\?v=1670/);
  assert.match(read('../js/ui.js'), /nextMatchView\.js\?v=1670/);
  assert.match(read('../js/ui/nextMatchView.js'), /matchTimeline\.js\?v=141/);
  assert.match(read('../js/ui/nextMatchView.js'), /matchPostReport\.js\?v=141/);
});

test('el postpartido cambia la cabecera a la jornada disputada y desactiva el segundo simulador', () => {
  const view = readFileSync(new URL('../js/ui/nextMatchView.js', import.meta.url), 'utf8');
  assert.match(view, /Jornada disputada/);
  assert.match(view, /nextmatch-view-title/);
  assert.match(view, /nextmatch-date-label', info\.date/);
  assert.match(view, /simButton\.classList\.toggle\('hidden', showPost\)/);
});

test('la crónica utiliza resultado, goles y decisiones tácticas registrados', () => {
  const names = new Map([['a1','Lina'],['a2','Mario'],['b1','Pedro']]);
  const report = buildPostMatchReport(fixture(), {homeName:'Local',awayName:'Visitante',playerNames:names});
  assert.match(report.headline, /Remontada de Local.*2-1/);
  assert.match(report.paragraphs.join(' '), /llegó a estar por detrás/);
  assert.match(report.paragraphs.join(' '), /Pedro.*15'/);
  assert.match(report.paragraphs.join(' '), /Mario.*88'/);
  assert.match(report.paragraphs.join(' '), /4-4-2.*4-3-3/);
  assert.equal(report.moment.title, 'Gol de la victoria');
  assert.match(report.moment.detail, /Mario/);
});

test('reconoce un gol ganador tardío sin fingir una remontada', () => {
  const f = fixture();
  f.homeGoals = 1; f.awayGoals = 0;
  f.events = [{type:'GOAL', minute:90, clubId:'a', playerId:'a2'}];
  const r = buildPostMatchReport(f, {homeName:'Local', awayName:'Visitante', playerNames:new Map([['a2','Ana']])});
  assert.match(r.headline, /decide al final/);
  assert.match(r.paragraphs.join(' '), /Ana.*90'/);
  assert.doesNotMatch(r.paragraphs.join(' '), /remont/);
});

test('reconoce el empate final y la diferencia entre posesión y disparos', () => {
  const f = fixture();
  f.homeGoals = 1; f.awayGoals = 1;
  f.events = [{type:'GOAL',minute:9,clubId:'a',playerId:'a1'}, {type:'GOAL',minute:89,clubId:'b',playerId:'b1'}];
  f.teamStats.home.possessionPct = 64; f.teamStats.away.possessionPct = 36;
  f.teamStats.home.shotsTotal = 7; f.teamStats.away.shotsTotal = 14;
  const r = buildPostMatchReport(f, {homeName:'Local', awayName:'Visitante'});
  assert.match(r.headline, /Empate rescatado al final/);
  assert.equal(r.moment.title, 'Gol del empate');
  assert.match(r.paragraphs.join(' '), /Local tuvo más posesión.*Sin embargo, Visitante remató más/);
});

test('partidas antiguas sin goles registrados no generan remontadas inventadas', () => {
  const f = fixture();
  f.events = [];
  const r = buildPostMatchReport(f, {homeName:'Local',awayName:'Visitante'});
  assert.doesNotMatch(r.headline, /Remontada|decide al final/);
  assert.match(r.paragraphs.join(' '), /no incluye el detalle individual de los goles/);
  assert.doesNotMatch(r.paragraphs.join(' '), /Ninguno de los equipos consiguió marcar/);
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
  assert.match(timeline, /is-goal/);
  assert.match(timeline, /GOL/);
  const goalsOnly = buildMatchTimelineHTML({...opts,filter:(e)=>e.type==='GOAL'});
  assert.doesNotMatch(goalsOnly, /Cambio de formación/);
  const reverse = buildMatchTimelineHTML({...opts,order:'desc'});
  assert.ok(reverse.indexOf('Final del partido') < reverse.indexOf('Descanso'));
  assert.ok(reverse.indexOf('Descanso') < reverse.indexOf('Inicio del partido'));
  const empty = buildMatchTimelineHTML({...opts,filter:(e)=>e.type==='RED'});
  assert.match(empty, /No hay acontecimientos de este tipo/);
});

test('las paradas descuentan los goles encajados, no los marcados', () => {
  const f = { homeGoals:3,awayGoals:1,homeClubId:'a',awayClubId:'b',homeLineupIds:['a1'],awayLineupIds:['b1'],events:[],substitutions:[] };
  const a = {id:'a',players:[{id:'a1',name:'A',position:'GK',overall:80}]};
  const b = {id:'b',players:[{id:'b1',name:'B',position:'GK',overall:80}]};
  generateAdvancedStatsForFixture(f,a,b);
  assert.equal(f.teamStats.home.saves, Math.min(12,Math.max(0,f.teamStats.away.shotsOnTarget - 1)));
  assert.equal(f.teamStats.away.saves, Math.min(12,Math.max(0,f.teamStats.home.shotsOnTarget - 3)));
});
