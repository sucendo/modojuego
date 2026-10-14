import fs from 'node:fs';
import assert from 'node:assert/strict';

// Integration: run the real physical modules in the same lexical scope as
// the game save/load, portable import and economy scheduler.
const read=p=>fs.readFileSync(new URL('../js/'+p,import.meta.url),'utf8');
const source=[
  'world-core-03828.js','natural-potential-03829.js','geology-03830.js',
  'prospection-03831.js','agronomy-03832.js'
].map(read).join('\n');
assert.doesNotThrow(()=>new Function(source));
const disk=new Map();
const store={
  setItem:(k,v)=>disk.set(k,v),
  getItem:k=>disk.get(k)??null,
  removeItem:k=>disk.delete(k)
};
const base=`
 let campaignSeconds3230=0,started3230=true,gold3212=700;
 let activeFactionCount3230=500;
 const owner6=new Int16Array(80);
 const botGold3230=new Float64Array(500).fill(700);
 function terrainKey3250(cell){return cell===79?'sea':cell===15?'forest':'plain'}
 function cellLonLat3302(cell){
   if(cell===15)return {lat:51,lon:12};
   if(cell===20)return {lat:27,lon:50};
   return {lat:38+(cell%11)*.08,lon:-5+(cell%13)*.09};
 }
 const mainKey='physical-main-fixture';
 function mainState(){return {owner:[...owner6],time:campaignSeconds3230,gold:gold3212}}
 function applyMain(d){
   owner6.set(d.owner);
   campaignSeconds3230=d.time||0;
   gold3212=d.gold||0;
 }
 let saveGame3212=()=>{
   localStorage.setItem(mainKey,JSON.stringify(mainState()));
   return true;
 };
 let loadGame3212=()=>{
   const raw=localStorage.getItem(mainKey);
   if(!raw)return false;
   applyMain(JSON.parse(raw));return true;
 };
 let resetGame3230=(clearSave=true)=>{
   owner6.fill(0);campaignSeconds3230=0;gold3212=700;
   if(clearSave)localStorage.removeItem(mainKey);
 };
 let buildPortableFile3275=()=>({payload:{main:mainState()}});
 let applyPortableFile3275=file=>{
   applyMain(file.payload.main);
   localStorage.setItem(mainKey,JSON.stringify(mainState()));
   return true;
 };
 let economyTick3212=()=>{campaignSeconds3230+=16};
`;
const boot=new Function(
 'window','localStorage','performance','console','fnv1a3273',
 base+source+`
 return {
   core:window.HexategosWorldCore03828,
   natural:window.HexategosNaturalPotential03829,
   geology:window.HexategosGeology03830,
   prospection:window.HexategosProspection03831,
   agronomy:window.HexategosAgronomy03832,
   save:()=>saveGame3212(),load:()=>loadGame3212(),
   reset:clear=>resetGame3230(clear),
   exportFile:()=>buildPortableFile3275(),
   importFile:file=>applyPortableFile3275(file),
   step:()=>economyTick3212(),
   time:()=>campaignSeconds3230,
   gold:()=>gold3212,
   owner:owner6,
   botGold:botGold3230,
   setFactions:n=>{activeFactionCount3230=n}
 };
 `);
let perfCount=0;
const window={__openfrontBootCompleted3281:true,
 crypto:{getRandomValues:array=>{array[0]=0xA9234678;return array}}};
const game=boot(window,store,{now:()=>++perfCount*.1},console,
 s=>s.length);
const {core,natural,geology,prospection,agronomy}=game;
assert.equal(core.list().filter(x=>x.persistent).length,3,
  'natural seed, mineral discoveries and agronomy are all versioned');
assert.equal(core.list().filter(x=>x.scheduled).length,2,
  'only geological and agronomic work belongs to the scheduler');

// Public potential is a hint; private deposits are seed-driven and independent
// of political boundaries.
const naturalA=natural.profile(9),geoA=geology.deposit(9,'iron');
assert.ok(naturalA&&geoA);
assert.equal(prospection.result(9),null);
assert.equal(agronomy.result(10),null);
game.owner[9]=1;
assert.deepEqual(natural.profile(9),naturalA);
assert.deepEqual(geology.deposit(9,'iron'),geoA);
game.owner[9]=0;

// Two different studies start simultaneously with independent costs/timers.
assert.equal(prospection.begin(0,9).ok,true);
assert.equal(agronomy.begin(0,10).ok,true);
assert.equal(game.gold(),700-prospection.cost-agronomy.cost);
assert.equal(prospection.status(9).state,'pending');
assert.equal(agronomy.status(10).state,'pending');
const originalSeed=natural.seed();
assert.ok(game.save());
const pendingFile=game.exportFile();
const modules=pendingFile.payload.worldLayers03828.modules;
assert.equal(modules['natural-potential'].data.seed,originalSeed);
assert.ok(modules['geological-prospection'].data.pending.some(x=>x[0]===9));
assert.ok(modules['agronomy-evaluation'].data.pending.some(x=>x[0]===10));
assert.equal(JSON.stringify(modules).includes('reserve'),false,
  'undiscovered geological deposits must not be materialized into saves');
assert.equal(pendingFile.checksum,JSON.stringify(pendingFile.payload).length);

// Simulate an actual reload before either study finishes.
game.reset(false);
assert.equal(prospection.status(9).state,'unexplored');
assert.ok(game.load());
assert.equal(natural.seed(),originalSeed);
assert.equal(prospection.status(9).state,'pending');
assert.equal(agronomy.status(10).state,'pending');
assert.equal(game.gold(),700-prospection.cost-agronomy.cost);
game.step();
assert.equal(game.time(),16);
assert.equal(agronomy.status(10).state,'completed');
assert.equal(prospection.status(9).state,'pending');
game.step();game.step();
assert.equal(game.time(),48);
assert.equal(prospection.status(9).state,'completed');
assert.ok(prospection.result(9)?.iron);
assert.ok(agronomy.result(10)?.farming);
assert.ok(game.save());
const completeFile=game.exportFile();

// Portable import restores both studies, the seed and the main owner state.
game.reset(true);
assert.equal(prospection.status(9).state,'unexplored');
assert.notEqual(natural.seed(),originalSeed);
assert.ok(game.importFile(completeFile));
assert.equal(prospection.status(9).state,'completed');
assert.equal(agronomy.status(10).state,'completed');
assert.equal(natural.seed(),originalSeed);
assert.deepEqual(geology.deposit(9,'iron'),geoA);
game.reset(false);
assert.ok(game.load());
assert.equal(prospection.status(9).state,'completed',
 'portable state survives the import and subsequent browser reload');
assert.equal(agronomy.status(10).state,'completed');

// A legacy portable file has no natural layers: it must not reuse them
// from the former campaign.
const legacy={payload:{main:{owner:[...game.owner],time:60,gold:100}}};
assert.ok(game.importFile(legacy));
assert.equal(prospection.status(9).state,'unexplored');
assert.equal(agronomy.status(10).state,'unexplored');
assert.equal(natural.seed(),0x487E291A);
game.reset(false);assert.ok(game.load());
assert.equal(prospection.status(9).state,'unexplored');

// Rollback on corrupt module snapshots must preserve all previously loaded
// layers rather than mix discoveries from two different saves.
let guard={value:1};
core.register({id:'test-guard',schemaVersion:1,
 snapshot:()=>({...guard}),
 restore:x=>{guard=x?{...x}:{value:1};if(guard.value===999)throw Error('corrupt guard')}});
const before=core.snapshot(),sameSeed=natural.seed();
const corrupted=structuredClone(before);
corrupted.modules['natural-potential'].data.seed=0x1234abcd;
corrupted.modules['geological-prospection'].data.known=[9,12];
corrupted.modules['test-guard'].data={value:999};
assert.throws(()=>core.restore(corrupted),/corrupt guard/);
assert.deepEqual(core.snapshot(),before,
 'all natural modules must roll back after a failed restore');
assert.equal(natural.seed(),sameSeed);
assert.ok(core.diagnostics().lastError?.phase==='restore');

// AI ownership/faction-size configurations must use the same public action
// without a nation-wide geological scan on each economy tick.
for(const count of [150,250,350,500]){
  game.setFactions(count);
  game.owner[16]=count-1;
  assert.equal(prospection.begin(count-1,16).ok,true);
  assert.equal(game.botGold[count-1],700-prospection.cost);
  game.step();game.step();game.step();
  assert.equal(prospection.status(16).state,'completed');
  game.reset(false);
  game.owner[16]=0;
  game.botGold[count-1]=700;
}
console.log('HEXATEGOS 0.38.37: integrated seed, geography, discovery, agronomy, old saves, portable round trips, atomic rollback, 150/250/350/500 AI PASS');
