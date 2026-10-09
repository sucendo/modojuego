import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('js/world-core-03828.js'),index=read('index.html');
assert.doesNotThrow(()=>new Function(src));
assert.ok(index.indexOf('js/world-core-03828.js?v=03828')>
  index.indexOf('js/save-integrity-03827.js?v=03827'),
  'Core must load after prior save wrappers');

const disk=new Map();
let mainSaves=0,mainLoads=0,mainResets=0,portableImports=0,clock=0;
const storage={
  setItem:(key,value)=>disk.set(key,value),
  getItem:key=>disk.get(key)||null,
  removeItem:key=>disk.delete(key)
};
const codec={set:(key,value)=>{disk.set(key,JSON.stringify(value));return true},
  get:key=>{const text=disk.get(key);return text?JSON.parse(text):null}};
const scope={HexategosSaveStorage03827:codec};
const perf={now:()=>{clock+=.7;return clock}};
const hash=text=>text.length;
const prelude=[
  'let started3230=true,campaignSeconds3230=0;',
  'let saveGame3212=()=>{mainSavesHook();return undefined};',
  'let loadGame3212=()=>{mainLoadsHook();return true};',
  'let resetGame3230=()=>{mainResetsHook();return undefined};',
  'let buildPortableFile3275=()=>({payload:{main:{owner:[0,0]}}});',
  'let applyPortableFile3275=()=>{portableImportsHook();return true};',
  'let economyTick3212=()=>{campaignSeconds3230+=2};'
].join('\n');
const boot=new Function('window','localStorage','performance','console','fnv1a3273',
  'mainSavesHook','mainLoadsHook','mainResetsHook','portableImportsHook',
  prelude+'\n'+src+
  '\nreturn {core:window.HexategosWorldCore03828,save:saveGame3212,'+
  'load:loadGame3212,reset:resetGame3230,build:buildPortableFile3275,'+
  'apply:applyPortableFile3275,economy:economyTick3212,time:()=>campaignSeconds3230};');
const game=boot(scope,storage,perf,{warn(){},info(){}},hash,
  ()=>mainSaves++,()=>mainLoads++,()=>mainResets++,()=>portableImports++);
const core=game.core;
assert.equal(core.version,'0.38.28');
game.save();
assert.equal(mainSaves,1,'main save untouched');
assert.equal(disk.size,0,'no empty persistent layers on routine save');

let deposit={discovered:[41,42],ownerIndependent:true},restored=0,migrations=0;
core.register({id:'geology',schemaVersion:2,
  snapshot:()=>({...deposit}),
  restore:value=>{deposit=value??{discovered:[],ownerIndependent:true};restored++},
  migrate:(data,from,to)=>{assert.equal(from,1);assert.equal(to,2);
    migrations++;return {discovered:data.known||[],ownerIndependent:true}}});
let agriculture={rated:[17]};
core.register({id:'agronomy',schemaVersion:1,
  snapshot:()=>({...agriculture}),
  restore:value=>{agriculture=value??{rated:[]}}});
core.register({id:'prospection',schemaVersion:1,tick:()=>{}});
assert.equal(core.list().length,3);
assert.equal(core.list().filter(x=>x.persistent).length,2);

game.save();
const key='hexategos.world-layers.03828';
assert.ok(disk.has(key),'world modules must save alongside existing modules');
assert.deepEqual(codec.get(key).modules.geology.data.discovered,[41,42]);
deposit={discovered:[],ownerIndependent:true};agriculture={rated:[]};
assert.equal(game.load(),true);
assert.equal(mainLoads,1);
assert.deepEqual(deposit.discovered,[41,42],'local load restores discoveries');
assert.deepEqual(agriculture.rated,[17],'local load restores agronomy');
assert.ok(restored>0);

const exported=game.build();
assert.deepEqual(exported.payload.worldLayers03828.modules.geology.data.discovered,[41,42]);
assert.equal(exported.checksum,JSON.stringify(exported.payload).length);
const payload=structuredClone(exported);
payload.payload.worldLayers03828.modules.geology={schema:1,data:{known:[2,4]}};
deposit={discovered:[500],ownerIndependent:true};
assert.equal(game.apply(payload),true);
assert.equal(portableImports,1);
assert.deepEqual(deposit.discovered,[2,4],'old module snapshots migrate');
assert.equal(migrations,1,'migration should run once');
assert.deepEqual(codec.get(key).modules.geology.data.discovered,[2,4]);

const unsupported=structuredClone(payload);
unsupported.payload.worldLayers03828.modules.geology={schema:3,data:{}};
assert.throws(()=>game.apply(unsupported),/más reciente/);
assert.equal(portableImports,1,'reject unknown schema before applying main save');
assert.deepEqual(deposit.discovered,[2,4]);

assert.equal(game.apply({payload:{main:{owner:[0,0]}}}),true);
assert.equal(portableImports,2);
assert.deepEqual(deposit.discovered,[],'old portable has no inherited discoveries');
assert.deepEqual(agriculture.rated,[],'old portable has no inherited evaluations');
assert.equal(disk.has(key),false,'legacy import removes stale registered layers');
assert.equal(game.reset(true),undefined);
assert.equal(mainResets,1);

let events=0;
const off=core.on('resourceDiscovered',data=>{events+=data.quantity});
core.on('resourceDiscovered',()=>{throw new Error('listener isolation')});
assert.equal(core.emit('resourceDiscovered',{quantity:3}),1);
off();
assert.equal(core.emit('resourceDiscovered',{quantity:4}),0);
assert.equal(events,3,'listeners can unsubscribe');

const round=[];
core.register({id:'test-a',tick:()=>round.push('a')});
core.register({id:'test-b',tick:()=>round.push('b')});
core.register({id:'test-c',tick:()=>round.push('c')});
const first=core.step(2,.2),second=core.step(2,.2);
for(let i=0;i<5;i++)core.step(2,.2);
assert.ok(first.ran>=1&&second.ran>=1,'budgeted scheduler must run tasks');
assert.ok(round.length>=2);
assert.notEqual(round[0],round[1],'scheduler must rotate cursors under tight budgets');
game.economy();
assert.equal(game.time(),2,'existing economy clock runs');
assert.ok(core.diagnostics().lastTick.steps>=1,'new modules share existing economy tick');

console.log('HEXATEGOS 0.38.28: registry, migrations, local/portable persistence, legacy saves, events and scheduler PASS');
