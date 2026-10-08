import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const core=read('js/game.js'),trade=read('js/trade-logistics-0370.js');
const visual=read('js/national-visuals-0378.js'),ui=read('js/ui-typography-0387.js');
const css=read('css/dialog-unified-0387.css'),html=read('index.html'),about=read('js/about-0351.js');
for(const [name,script] of [['core',core],['trade',trade],['visual',visual],['ui',ui],['about',about]]){
  assert.doesNotThrow(()=>new Function(script),name+' syntax');
}
assert.ok(/v0\.38\.(?:[789]|1[012345])<\/title>/.test(html),'version missing');
assert.ok(html.includes('js/game.js?v=0387'),'updated economic engine may be cached');
assert.ok(html.includes('js/national-visuals-0378.js?v=0387'),'updated fleet visuals may be cached');
assert.ok(/js\/trade-logistics-0370\.js\?v=038[78]/.test(html),'updated fleet logic may be cached');
assert.ok(/js\/ui-typography-0387\.js\?v=038[78]/.test(html),'font choice script missing');
assert.ok(/css\/dialog-unified-0387\.css\?v=038[78]/.test(html),'unified dialog styles missing');
assert.ok(html.includes('id="landingFontSelect0387"'),'landing option missing');
assert.ok(about.includes("version:'0.38.7'"),'history missing');
assert.ok(!core.includes('Math.min(9999,gold3212+r.gold*dt)'),'player gold still capped at 9999');
assert.ok(!core.includes('Math.min(9999,botGold3230[f]+r.gold*dt)'),'AI gold still capped at 9999');
assert.ok(core.includes('Math.max(0,Math.min(1000000000,gold3212+r.gold*dt))'),
  'player treasury must grow beyond 9999 without unbounded numbers');
assert.ok(trade.includes('if(!Number.isFinite(g.patrolNext0371)){'),
  'idle AI fleet may retain Infinity and never patrol again');
assert.ok(visual.includes('const returningPatrol=wasPatrol||'),
  'AI fleets changed to interception need visual docking at home port');
for(const dialog of ['#modalCard3244','#contextMenu3244','#gameMenu3306',
  '.newGameSetupCard3302','.aboutCard0351','.introCard3230','.endCard3230']){
  assert.ok(css.includes(dialog),'uniform dialog style missing: '+dialog);
}
assert.ok(css.includes('var(--hex-ui-scale)'),'CSS must respond to font settings');
assert.ok(css.includes('data-hex-font-mode="auto"'),'mobile automatic scale missing');
assert.ok(!ui.includes('setInterval('),'font settings cannot create timers');
assert.ok(!ui.includes('MutationObserver'),'font settings cannot poll/mutate DOM periodically');

const srcStart=trade.indexOf('  updateNavalOrder3270=function(g,nowCampaign){');
const srcEnd=trade.indexOf('  const baseAiNavalPlan0370',srcStart);
assert.ok(srcStart>=0&&srcEnd>srcStart,'naval update segment missing');
const ctor=new Function('owner6','ports3212','bestPortSea3270',
  'nearestOwnedPort3270','adjacentSeaCells3261','nearestTransport3270',
  'startInterceptExcursion0371','angularHeuristic3254','navalPathPermit0371',
  'setNavalDestination3270','buildLocalPatrolRoute03719',`
let updateNavalOrder3270=()=>{};
const toast=()=>{},placeDisplayName3271=()=>'',currentTransportSeaCell3270=()=>-1,findTransportById3270=()=>null;
${trade.slice(srcStart,srcEnd)}
return updateNavalOrder3270;`);
const owner=new Int16Array(50);owner[9]=1;
let patrols=0;
const g={id:7,cell:22,f:1,home:9,order:'intercept',targetPort:-1,route:null,
  routeGoal:-1,routePos:0,patrolNext0371:Infinity,interceptNext0371:40,
  lastRetarget:-1e9,pendingHome0370:-1};
const tick=ctor(owner,new Set([9]),()=>22,()=>9,()=>[22],()=>null,
  ()=>false,()=>0,()=>true,()=>{},
  (fleet,now)=>{
    patrols++;fleet.route=[22,23,24,23,22];fleet.routeGoal=22;
    fleet.patrolNext0371=Infinity;return true;
  });
tick(g,40);
assert.equal(g.patrolNext0371,45,'AI fleet must rearm patrol after Infinity');
tick(g,45);
assert.equal(patrols,1,'AI fleet must depart for patrol');
assert.equal(g.route.length,5,'AI fleet patrol has continuous sea path');
g.route=null;g.cell=22;tick(g,56);
assert.ok(Number.isFinite(g.patrolNext0371),'return must rearm next patrol');

// Una flota a pocos hexágonos de su base debe volver al puerto exacto.
// Antes quedaba bloqueada por el antiguo umbral de distancia >12.
let orderedHome=-1;
const near=ctor(owner,new Set([9]),()=>22,()=>9,()=>[22],()=>null,
  ()=>false,()=>0,()=>true,(_fleet,port)=>{orderedHome=port;return true},
  ()=>true);
const gNear={id:9,cell:24,f:1,home:9,order:'intercept',targetPort:-1,route:null,
  routeGoal:-1,routePos:0,patrolNext0371:Infinity,interceptNext0371:40,
  lastRetarget:-1e9,pendingHome0370:-1};
near(gNear,40);
assert.equal(orderedHome,22,'near-home interception fleet must return to exact port sea cell');

console.log('HEXATEGOS 0.38.7 gold, AI naval and unified dialogs smoke: OK');
