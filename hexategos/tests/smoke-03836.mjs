import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const mapSource=read('js/natural-map-03836.js');
const naturalSource=read('js/natural-potential-03829.js');
const html=read('index.html');
assert.doesNotThrow(()=>new Function(mapSource));
assert.doesNotThrow(()=>new Function(naturalSource));
assert.ok(html.indexOf('js/natural-map-03836.js')>html.indexOf('js/prospection-03831.js'));
assert.ok(html.indexOf('js/natural-map-03836.js')>html.indexOf('js/geology-03830.js'));
assert.match(html,/css\/natural-map-03836\.css\?v=03836/);
assert.match(naturalSource,/function sampleAt\(lat,lon,type='plain'\)/);
assert.doesNotMatch(mapSource,/geology\.deposit|Geology03830\.deposit/,
  'visualization must not inspect underground deposits');
assert.doesNotMatch(mapSource,/setInterval\(|requestAnimationFrame\(|MutationObserver/,
  'reuse normal visible-cell renderer');
function element(){
  const attrs=new Map(),listeners={};
  const node={style:{},dataset:{},hidden:false,children:[],classList:{
    remove(){},add(){},toggle(){}},
    appendChild(x){this.children.push(x);x.parentElement=this;return x},
    setAttribute:(k,v)=>attrs.set(k,String(v)),
    getAttribute:k=>attrs.get(k),
    addEventListener:(k,fn)=>listeners[k]=fn,
    getBoundingClientRect:()=>({top:92,right:42}),
    contains:x=>x===node||node.children.includes(x),
    clickHandler:(name,event)=>listeners[name]?.(event)
  };
  return node;
}
const button=element(),legend=element(),body=element(),handlers={};
const doc={
  body,createElement:()=>element(),
  getElementById:id=>id==='mapModeBtn3252'?button:
    id==='terrainLegend3250'?legend:null,
  addEventListener:(name,fn)=>handlers[name]=fn
};
const disk=new Map();
const storage={getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v)};
const seen=new Set(),invocations={result:0,profile:0,sample:0};
let seed=1;
const natural={
  seed:()=>seed,
  profile:cell=>{invocations.profile++;return {food:1.3,livestock:.5,forest:0,mineral:1.7,energy:.8}},
  sampleAt:(lat,lon,type)=>{invocations.sample++;return {food:1.3,livestock:.5,forest:0,mineral:1.7,energy:.8}}
};
const prospect={
  hasKnowledge:cell=>seen.has(cell),
  result:cell=>{invocations.result++;return {oil:'Excepcional',iron:'Inexistente'}}
};
const win={innerWidth:900,innerHeight:700,HexategosNaturalPotential03829:natural,
  HexategosProspection03831:prospect};
const code=mapSource+'\nreturn {api:window.HexategosNaturalMap03836,'+
  'fill:terrainStrategicFill3247,mode:()=>mapMode3252,menu:document.body.children[0]}';
const run=new Function('window','document','localStorage','terrainStrategicFill3247',
 'mapMode3252','MAP_MODES3252','MAP_MODE_NAMES3252','updateMapModeUI3252',
 'MAX_GAME_LEVEL3233','shadedRGB3247','terrainType3247','showSupplyOverlay3230',
 'needsRender','toast',code);
const modes=['political','terrain','supply','geopolitics'];
const names={political:'Político',terrain:'Terreno',supply:'Suministro',geopolitics:'Geopolítica'};
let priorUpdates=0,notifications=0;
const runtime=run(win,doc,storage,()=>[1,2,3],'political',modes,names,
  ()=>{priorUpdates++},'8',(c,z)=>c,()=> 'plain',false,false,()=>notifications++);
const {api,fill,menu}=runtime;
assert.ok(api,'new map layer module must initialize');
assert.equal(modes.length,10,'all old and six new modes');
assert.equal(menu.children.length,10,'unified map selector includes old options');
assert.equal(api.select('natural-food'),true);
assert.equal(runtime.mode(),'natural-food');
assert.equal(button.textContent,'Agr');
assert.equal(storage.getItem('ofhex_map_mode_3252'),'natural-food');
const low={land:[1],centers:new Int16Array([0,0,32767])};
assert.deepEqual(fill('3',0,low,0,1),[84,157,85],
  'natural agriculture comes from public low-LOD regional sample');
assert.equal(invocations.sample,1);
assert.deepEqual(fill('3',0,low,1,1),[84,157,85]);
assert.equal(invocations.sample,1,'same lower LOD cell served from cache');
assert.equal(api.select('natural-forest'),true);
assert.deepEqual(fill('3',0,low,0,1),[50,53,53],
  'non-forest region has zero forest cover');
const detail={land:[1,1,1],centers:new Int16Array(9)};
assert.equal(api.select('natural-known'),true);
assert.deepEqual(fill('8',2,detail,0,1),[51,57,66]);
assert.equal(invocations.result,0,'undiscovered deposits must never be queried');
seen.add(2);
assert.deepEqual(fill('8',2,detail,0,1),[74,200,163],
  'only known exceptional finds can appear in discovered overlay');
assert.equal(invocations.result,1);
assert.deepEqual(fill('8',2,detail,0,1),[74,200,163]);
assert.equal(invocations.result,1,'known display grade must be cached');
assert.deepEqual(fill('3',0,low,0,1),[51,57,66],
  'low-detail mesh IDs may not be mistaken for real surveyed hexagons');
assert.equal(api.select('political'),true);
assert.deepEqual(fill('8',1,detail,0,1),[1,2,3],'political renderer preserved');
assert.ok(priorUpdates>=4,'existing map display hooks must still run');
for(let i=0;i<7200;i++){
  const L={land:[1],centers:new Int16Array([0,i%32767,32767])};
  fill('low'+i,0,L,0,1); // many LOD keys, bounded memory
}
assert.ok(api.stats().cache<=api.cacheLimit,'bounded natural LOD cache');
seed=2;
api.select('natural-energy');
fill('3',0,low,0,1);
assert.ok(api.stats().cache<=2,'changing seed invalidates old samples');
assert.equal(typeof handlers.pointerdown,'function');
assert.equal(typeof handlers.keydown,'function');
console.log('HEXATEGOS natural map: 10 modes, six overlays, undiscovered deposits hidden, LOD and caching PASS');
