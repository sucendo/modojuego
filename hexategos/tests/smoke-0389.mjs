import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const names=read('js/regional-names-0389.js');
const msgs=read('js/ui-stable-step8-033.js');
const statecraft=read('js/statecraft-0380.js');
const index=read('index.html');
for(const [name,code] of [['names',names],['messages',msgs],['statecraft',statecraft]]){
  assert.doesNotThrow(()=>new Function(code),name+' syntax');
}
assert.match(index,/v0\.38\.(?:9|1[0123])<\/title>/);
assert.match(index,/js\/regional-names-0389\.js\?v=0389/);
assert.match(index,/js\/ui-stable-step8-033\.js\?v=0389/);
assert.match(index,/js\/statecraft-0380\.js\?v=0389/);
assert.ok(msgs.includes('data-view-notice='),'notice VER missing');
assert.ok(msgs.includes('data-view-offer='),'diplomatic proposal VER missing');
assert.ok(msgs.includes('data-answer-embassy='),'embassy decision buttons missing');
assert.ok(msgs.includes('rotateToGeo3243(geo.lon,geo.lat'),'map navigation missing');
assert.ok(msgs.includes('pendingEmbassies?.()'),'pending requests must persist past notice truncation');
assert.ok(statecraft.includes('pendingEmbassies:()=>'),'pending embassies API missing');
assert.ok(statecraft.includes("requestKind:'embassy'"),'embassy request must be actionable');
assert.ok(names.includes('atlas.suggest(cell)'),'real GeoNames suggestions not used');
assert.ok(names.includes('checked.add(marker)'),'atlas cache missing');
assert.ok(names.includes('cities3212.add=function'),'new AI cities not indexed incrementally');
assert.ok(!names.includes('setInterval('),'naming must share economy scheduler');

const captured=new Map([[1,'Madrid'],[2,'Madrid'],[3,'Mi pueblo']]);
const saved=new Map();
const owner=[-1,0,1,1,-1],capitals=[1,2],citySet=new Set([1,2,3]);
const win={HexategosRealCities0354:{suggest:async cell=>({
  kind:'exact',options:[{name:cell===3?'Girona':'Barcelona',distanceKm:0}]
})}};
const args=[
 win,{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
 f=>f?'Nación ficticia':'Jugador',owner,capitals,()=>({lat:41.387,lon:2.17}),
 [{},{}],2,citySet,(cell,name)=>captured.set(cell,name),s=>s,
 cell=>captured.get(cell),()=>{},()=>{},()=>{},()=>{},true,false,10,
 undefined,undefined,undefined,{info(){},warn(){}}
];
const params=['window','localStorage','factionName3230','owner6','capitals','cellLonLat3302',
  'FACTIONS3230','activeFactionCount3230','cities3212','setCityName3271','cleanCityName3271',
  'cityDisplayName3271','saveGame3212','loadGame3212','resetGame3230',
  'economyTick3212','started3230','paused3230','campaignSeconds3230',
  'buildPortableFile3275','applyPortableFile3275','fnv1a3273','console'];
const boot=new Function(...params,names+
  '\nreturn {api:window.HexategosRegionalNames0389,label:factionName3230,tick:economyTick3212,advance:t=>campaignSeconds3230=t,save:saveGame3212}');
const test=boot(...args);
assert.equal(test.label(1),'Principado de Cataluña');
test.tick();
await Promise.resolve();await Promise.resolve();
assert.equal(captured.get(1),'Barcelona','Barcelona capital must not inherit Madrid');
test.advance(13);test.tick();
await Promise.resolve();await Promise.resolve();
assert.equal(captured.get(2),'Barcelona','AI capital must use the local city');
assert.equal(test.label(1),'Condado de Barcelona','historical Barcelona naming');
assert.equal(captured.get(3),'Mi pueblo','untouched player name');
test.save();
assert.ok(saved.has('hexategos.regionalNames.0389'),'naming save not persisted');
console.log('HEXATEGOS 0.38.9 notices, embassy requests and geographic capital naming: OK');
