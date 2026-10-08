import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const moduleCode=read('js/production-0388.js');
const logistics=read('js/trade-logistics-0370.js');
const index=read('index.html');
const css=read('css/production-0388.css');
assert.doesNotThrow(()=>new Function(moduleCode),'production syntax');
assert.doesNotThrow(()=>new Function(logistics),'logistics syntax');
assert.match(index,/js\/production-0388\.js\?v=038(?:8|1[012345])/);
assert.match(index,/css\/production-0388\.css\?v=038(?:8|1[012345])/);
assert.ok(logistics.includes('HexategosProduction0388?.tick?.('),'production not connected to material tick');
assert.ok(logistics.includes('production?.cells?.()'),'extraction nodes not connected to national inventories');
assert.ok(css.includes('industryBuildGrid0388'));

const names=['window','FACTIONS3230','owner6','botGold3230','gold3212','loadLevel',
  'MAX_GAME_LEVEL3233','campaignSeconds3230','started3230','activeFactionCount3230',
  'saveGame3212','loadGame3212','resetGame3230','renderSystems3220','buildClassicActions3246',
  'handleContextAction3244','drawInfrastructure3212','document','modalBody3244','console',
  'aiNationalSamples3275','ports3212','localStorage','capitals','industryLevel3230','industries3212'];
const owner=Array(40).fill(1);for(let i=0;i<=8;i++)owner[i]=0;
const edges=[],offsets=[0];
for(let i=0;i<owner.length;i++){
  edges.push((i+1)%40,(i+2)%40,(i+3)%40,(i+4)%40,(i+5)%40,(i+6)%40);
  offsets.push(edges.length);
}
const component=c=>c>=1&&c<=4?1:c>=5&&c<=8?2:c>=9?3:-1;
const gold=[0,2500],storage=new Map();
const world={HexategosTradeLogistics0370:{
  geography:c=>({type:c<=4?'desert':'mountain',food:1.2,raw:1.5,fuel:1.8}),
  roadComponent:component,
  resourceSummaryCached:()=>({coverage:[.4,.2,.1]})
}};
const args=[world,[{role:'balanced'},{role:'growth'}],owner,gold,4000,
  ()=>({n:owner.length,offsets,edgeNbr:edges}),0,100,true,2,
  ()=>{},()=>{},()=>{},()=>{},()=>[],()=>{},()=>{},
  {getElementById:()=>null},null,{info(){}},
  [[],Array.from({length:30},(_,i)=>i+9)],new Set([4,5]),
  {getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),
    removeItem:k=>storage.delete(k)},[0,9],new Uint8Array(owner.length),new Set()];
const factory=new Function(...names,moduleCode+
  '\nreturn {api:window.HexategosProduction0388,save:saveGame3212,load:loadGame3212,reset:resetGame3230}');
const {api,save,load,reset}=factory(...args);
assert.equal(api.build(0,1,'gas',false),true);
assert.equal(api.build(0,6,'gasplant',false),true);
const mk=c=>({cell:c,f:owner[c],comp:component(c),stock:[0,0,0,0,0],cap:[100,100,100,100,100]});
const nodes=new Map(Array.from({length:40},(_,c)=>[c,mk(c)]));
const previous=gold[1];
api.tick({nodes,routes:[],dt:4});
assert.ok(api.sites().some(s=>s.f===1),'AI failed to construct geological industry');
assert.ok(gold[1]<previous,'AI construction must use treasury');
assert.equal(nodes.get(6).stock[2],0,'isolated gas plant produced without gas shipment');
api.tick({nodes,routes:[{type:'sea',a:0,b:0,from:4,to:5,status:'active'}],dt:4});
assert.ok(nodes.get(6).stock[2]>0,'gas did not reach refinery over two ports');
save();
assert.ok(JSON.parse(storage.get('hexategos.production.0388')).sites.length>=2,'industries not saved');
reset(false);
assert.equal(api.sites().length,0,'reset did not clear industry state');
load();
assert.ok(api.sites().length>=2,'legacy-compatible local save did not reload');
assert.equal(api.validate().ok,true);
console.log('HEXATEGOS 0.38.8 extractive industry, sea route, AI and save smoke: OK');
