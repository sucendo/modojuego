import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../js/production-0388.js',import.meta.url),'utf8');
const owner=Array(35).fill(0),edges=[],offsets=[0];
for(let c=0;c<35;c++){edges.push((c+1)%35,(c+2)%35,(c+3)%35,(c+4)%35,(c+5)%35,(c+6)%35);offsets.push(edges.length)}
const storage=new Map();
const world={HexategosTradeLogistics0370:{
  geography:()=>({type:'plain',food:1.5,raw:1.6,fuel:1.8}),
  roadComponent:cell=>cell===34?99:1,resourceSummaryCached:()=>({coverage:[.4,.4,.3]})
}};
const names=['window','FACTIONS3230','owner6','botGold3230','gold3212','loadLevel',
  'MAX_GAME_LEVEL3233','campaignSeconds3230','started3230','activeFactionCount3230',
  'saveGame3212','loadGame3212','resetGame3230','renderSystems3220','buildClassicActions3246',
  'handleContextAction3244','drawInfrastructure3212','document','modalBody3244','console',
  'aiNationalSamples3275','ports3212','localStorage','capitals','industryLevel3230','industries3212'];
const industryLevels=new Uint8Array(35);industryLevels[7]=2;
const args=[world,[{role:'growth'}],owner,[0],6000,()=>({n:35,offsets,edgeNbr:edges}),
  0,100,true,1,()=>{},()=>{},()=>{},()=>{},()=>[],()=>{},()=>{},
  {getElementById:()=>null},null,{info(){},warn(){}},[[]],new Set(),
  {getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),
    removeItem:k=>storage.delete(k)},[0],industryLevels,new Set([7])];
const get=new Function(...names,src+
  '\nreturn {api:window.HexategosProduction0388,save:saveGame3212,load:loadGame3212,reset:resetGame3230};');
const {api,save,load,reset}=get(...args);

assert.equal(api.electricityAt(7),null,'No fabricated values before the first cycle');
const nodes=new Map(Array.from({length:35},(_,cell)=>[cell,{cell,f:0,comp:1,stock:[0,0,0,0,0],cap:[220,220,220,220,220]}]));
for(const [cell,kind] of [[3,'gas'],[12,'gasplant'],[9,'thermal'],[1,'iron'],[7,'steel']])assert(api.build(0,cell,kind,false));
for(let i=0;i<18;i++)api.tick({nodes,routes:[],dt:4});
const power=api.electricityAt(7);
assert(power.generatedRate>0,'Real fueled station must generate electricity');
assert(power.consumedRate>0,'Real steelworks must consume electricity');
assert(Math.abs(power.generatedRate-power.consumedRate-power.availableRate)<1e-10,'Conservation of generated electricity');
assert.deepEqual(api.electricityAt(33),power,'A territory without a factory on the same network must see its electricity');
assert.equal(api.electricityAt(34).availableRate,0,'A disconnected network must not receive that electricity');
owner[33]=1;
assert.equal(api.electricityAt(33).availableRate,0,'Another nation must not inherit the player network snapshot');
const fuel=nodes.get(7).stock[2];
api.electricityAt(7);api.electricityAt(7);
assert.equal(nodes.get(7).stock[2],fuel,'A read must not consume fuel');
const balance=api.snapshot();
assert(!JSON.stringify(balance).includes('electricalNetworks'),'Diagnostic snapshots do not change the save schema');
reset(false);
assert.equal(api.electricityAt(7),null,'Reset must discard previous campaign electricity');
api.tick({nodes,routes:[],dt:4});
assert.equal(api.electricityAt(7).availableRate,0,'No generation means zero, not N/D');
console.log('PASS: real generation/consumption/surplus, network sharing, isolated and foreign territories, read-only query and reset.');
