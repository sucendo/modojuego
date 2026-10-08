import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync(new URL('../js/production-0388.js',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Function(src));
const names=['window','FACTIONS3230','owner6','botGold3230','gold3212','loadLevel',
  'MAX_GAME_LEVEL3233','campaignSeconds3230','started3230','activeFactionCount3230',
  'saveGame3212','loadGame3212','resetGame3230','renderSystems3220','buildClassicActions3246',
  'handleContextAction3244','drawInfrastructure3212','document','modalBody3244','console',
  'aiNationalSamples3275','ports3212','localStorage','capitals','industryLevel3230','industries3212',
  'buildPortableFile3275','applyPortableFile3275','fnv1a3273'];

function fixture(){
  const owner=Array(50).fill(0),edges=[],offsets=[0],saved=new Map();
  for(let c=0;c<50;c++){for(let i=1;i<=6;i++)edges.push((c+i)%50);offsets.push(edges.length)}
  const road=c=>c<20?1:2;
  const win={HexategosTradeLogistics0370:{
    geography:c=>({type:c===1?'mountain':'plain',food:1.5,raw:1.8,fuel:1.9}),
    roadComponent:road,resourceSummaryCached:()=>({coverage:[.5,.5,.5]})
  }};
  const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
  const args=[win,[{role:'balanced'}],owner,[0],8000,()=>({n:50,offsets,edgeNbr:edges}),
    0,100,true,1,()=>true,()=>true,()=>true,()=>{},()=>[],()=>{},()=>{},
    {getElementById:()=>null},null,{info(){},warn(){}},[[]],new Set([15,25]),
    storage,[0],new Uint8Array(50),new Set(),
    ()=>({payload:{}}),()=>true,undefined];
  const boot=new Function(...names,src+
    '\nreturn {api:window.HexategosProduction0388,save:saveGame3212,load:loadGame3212,reset:resetGame3230,exportFile:buildPortableFile3275,importFile:applyPortableFile3275}');
  const game=boot(...args);
  const nodes=new Map(Array.from({length:50},(_,c)=>[c,{cell:c,f:0,comp:road(c),stock:[0,0,0,0,0],cap:[250,250,250,250,250]}]));
  return {...game,nodes,saved,owner,run:n=>{for(let i=0;i<n;i++)game.api.tick({nodes,routes:[],dt:4})}};
}
const construct=(g,arr)=>{for(const [cell,kind] of arr)assert.equal(g.api.build(0,cell,kind,false),true,'build '+kind)};
const output=(g,cell,kind)=>g.api.sitesOnCell(cell).find(s=>s.kind===kind)?.output||0;

// Physical coal reserve and electricity-gated steel.
{
  const g=fixture();
  assert.ok(g.api.types.coal&&g.api.potential(1,0,'coal')>0,'coal geology must exist');
  construct(g,[[1,'coal'],[4,'iron'],[5,'steel'],[6,'copper'],[7,'smelter']]);
  g.run(5);
  assert.equal(output(g,5,'steel'),0,'iron must not become steel without power');
  assert.equal(output(g,7,'smelter'),0,'copper must not refine without power');
  assert.ok(g.api.sitesOnCell(4)[0].stock>0,'unpowered steel must not consume iron');
  assert.equal(g.api.sitesOnCell(5)[0].status,'Falta electricidad');
  construct(g,[[8,'thermal']]);
  g.run(8);
  assert.ok(output(g,8,'thermal')>0,'coal should generate power');
  assert.ok(output(g,5,'steel')>0,'connected power should enable steel');
  assert.ok(output(g,7,'smelter')>0,'connected power should enable copper refinement');
  const savedBefore=g.api.snapshot();
  g.save();g.reset(false);assert.equal(g.api.sites().length,0);
  g.load();
  assert.equal(g.api.sites().length,savedBefore.sites.length,'browser load count');
  assert.ok(g.api.sites().some(s=>s.kind==='coal'),'coal must survive local save');
  const portable=g.exportFile();
  assert.ok(portable.payload.production0388.sites.some(s=>s.kind==='coal'));
  g.reset(false);g.importFile(portable);
  assert.ok(g.api.sites().some(s=>s.kind==='coal'),'coal must survive portable save');
  const old={payload:{production0388:{v:1,sites:[{cell:2,kind:'iron',level:2,pct:90,stock:5,output:3}],depots:[],sectors:[]}}};
  g.importFile(old);
  assert.equal(g.api.sites().length,1,'old saves must restore without new materials');
  assert.equal(g.api.sitesOnCell(2)[0].level,2);
}
// Coal has to travel physically when the generator is in a separate network.
{
  const g=fixture();construct(g,[[1,'coal'],[26,'thermal']]);
  g.run(3);assert.equal(output(g,26,'thermal'),0,'isolated station cannot use distant coal');
  const route={type:'sea',a:0,b:0,from:15,to:25,status:'active',navalRisk:0};
  for(let i=0;i<12;i++)g.api.tick({nodes:g.nodes,routes:[route],dt:4});
  assert.ok(output(g,26,'thermal')>0,'coal shipping must supply an isolated thermal station');
  assert.ok(g.api.snapshot().depots.some(([cell,goods])=>cell===25&&'coal' in goods),
    'coal must be inventoried in destination port');
}
// Oil/gas are usable immediately if the required source, processor and power plant exist.
for(const [fuel,processor] of [['oil','refinery'],['gas','gasplant']]){
  const g=fixture();construct(g,[[1,fuel],[2,processor],[3,'thermal'],[4,'iron'],[5,'steel']]);g.run(20);
  assert.ok(output(g,3,'thermal')>0,fuel+' should power a thermal plant');
  assert.ok(output(g,5,'steel')>0,fuel+' electricity should enable steel');
}
// Isolated networks cannot borrow electricity from a remote coal plant.
{
  const g=fixture();construct(g,[[1,'coal'],[2,'thermal'],[22,'iron'],[23,'steel']]);g.run(12);
  assert.ok(output(g,2,'thermal')>0);
  assert.equal(output(g,23,'steel'),0,'electricity must not jump to another road component');
}
// Agricultural and livestock products remain physically based and portable.
{
  const g=fixture();
  construct(g,[[1,'coal'],[2,'thermal'],[3,'crops'],[4,'livestock'],
    [5,'fiberworks'],[6,'tannery'],[7,'textile'],[8,'foodplant']]);
  g.run(22);
  assert.ok(output(g,5,'fiberworks')>0,'real plant fiber or wool must feed spinning');
  assert.ok(output(g,6,'tannery')>0,'real hides must feed leather');
  assert.ok(output(g,7,'textile')>0,'textiles need actual transformed fibers/leather + electricity');
  assert.ok(output(g,8,'foodplant')>0,'food industry must process crops, meat or dairy');
  const livestock=g.api.sitesOnCell(4)[0];
  assert.ok(livestock.byproducts&&'wool' in livestock.byproducts);
  g.save();g.reset(false);g.load();
  assert.ok(g.api.sitesOnCell(4)[0].byproducts,'livestock byproducts must persist');
}
// Strategic weapons require machinery goods, not just abstract national output.
{
  const g=fixture();
  construct(g,[[1,'coal'],[2,'thermal'],[3,'iron'],[4,'copper'],
    [5,'steel'],[6,'smelter'],[7,'arms']]);
  g.run(15);
  assert.equal(output(g,7,'arms'),0,'weapons require machinery from the same logistics network');
  construct(g,[[8,'machinery']]);g.run(18);
  assert.ok(output(g,8,'machinery')>0,'machinery should be manufactured');
  assert.ok(output(g,7,'arms')>0,'material armament should consume machinery goods');
}
console.log('HEXATEGOS 0.38.25: coal, 3 fuels, metal electricity, isolated networks, derivatives, weapons and saves OK');
