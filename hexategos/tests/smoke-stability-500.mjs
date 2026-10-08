import fs from 'node:fs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';

const source=fs.readFileSync(new URL('../js/production-0388.js',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Function(source),'production module syntax');
assert.ok(source.includes('nationSites=new Map()'),'nation-specific industrial index missing');
assert.ok(source.includes('Array.from(nationSites.get(f)||[])'),'500-nation AI must not scan every other nation for industries');
assert.ok(!source.includes('own=[...sites.values()].filter'),'quadratic industrial AI scan reintroduced');

const FACTIONS=Array.from({length:500},(_,f)=>({role:f%5===0?'growth':'balanced',color:'#445566'}));
const owners=Array.from({length:1000},(_,i)=>i%500);
const neighbours=[],offsets=[0];
for(let i=0;i<owners.length;i++){neighbours.push((i+500)%1000);offsets.push(neighbours.length)}
const L={n:owners.length,offsets,edgeNbr:neighbours};
const capitals=Array.from({length:500},(_,f)=>f);
const cash=new Float64Array(500).fill(2500);
const stored=new Map();
const apiWorld={HexategosTradeLogistics0370:{
  geography:()=>({type:'plain',food:1.2,raw:1.3,fuel:1.4}),
  roadComponent:cell=>cell%500,
  resourceSummaryCached:()=>({coverage:[.4,.5,.55]})
}};
const names=[
  'window','FACTIONS3230','owner6','botGold3230','gold3212','loadLevel','MAX_GAME_LEVEL3233',
  'campaignSeconds3230','started3230','activeFactionCount3230','saveGame3212','loadGame3212',
  'resetGame3230','renderSystems3220','buildClassicActions3246','handleContextAction3244',
  'drawInfrastructure3212','document','modalBody3244','console','aiNationalSamples3275',
  'ports3212','localStorage','capitals','industryLevel3230','industries3212'
];
const args=[
  apiWorld,FACTIONS,owners,cash,100000,()=>L,5,100,true,500,
  ()=>{},()=>{},()=>{},()=>{},()=>[],()=>{},()=>{},
  {getElementById:()=>null},null,{info(){},warn(){}},
  Array.from({length:500},(_,f)=>[f+500]),new Set(),
  {getItem:key=>stored.get(key)||null,setItem:(key,v)=>stored.set(key,v),
    removeItem:key=>stored.delete(key)},capitals,new Uint8Array(owners.length),new Set()
];
const init=new Function(...names,source+
  '\nreturn {prod:window.HexategosProduction0388,save:saveGame3212,load:loadGame3212,reset:resetGame3230};');
const sim=init(...args);
for(let f=1;f<400;f++)
  assert.ok(sim.prod.build(f,f,'iron',false),'preparing site for nation '+f);
assert.equal(sim.prod.sites().length,399);
assert.equal(sim.prod.availability(200,200,'iron',false).ok,false,'duplicate national building must be rejected');

const nodes=new Map();
for(let c=0;c<1000;c++)nodes.set(c,{
  cell:c,f:owners[c],comp:c%500,
  stock:[0,0,0,0,0],cap:[150,150,150,150,150]
});
const start=performance.now();
for(let step=0;step<3;step++)sim.prod.tick({nodes,routes:[],dt:2.8});
const ms=performance.now()-start;
assert.ok(ms<1600,'500-nation industrial simulation unexpectedly slow: '+ms.toFixed(1)+'ms');
assert.ok(sim.prod.stats().aiReviewed>=1,'AI scheduler did not evaluate countries');
assert.ok(sim.prod.stats().sites>=399,'industrial sites lost in 500-nation simulation');

owners[200]=400;
sim.prod.tick({nodes,routes:[],dt:2.8});
assert.equal(sim.prod.sitesOnCell(200)[0].f,400,'captured factory owner not updated');
assert.equal(sim.prod.legacyManufacturingFactor(400),1,'manufacturing fallback incorrectly reduced by mines');

sim.save();
const snapshot=JSON.parse(stored.get('hexategos.production.0388')||'{}');
assert.ok(snapshot.sites.length>=399,'large-nation industrial save missing');
sim.reset(false);
assert.equal(sim.prod.sites().length,0,'reset must clear industrial state and nation index');
sim.load();
assert.equal(sim.prod.sitesOnCell(200)[0].f,400,'captured industry not retained in loaded save');
assert.ok(sim.prod.validate().ok,'invalid 500-nation production state after restore');

console.log('HEXATEGOS stability: 500 factions, 399+ industries, nation ownership and save/load OK; 3 ticks '+ms.toFixed(1)+'ms');
