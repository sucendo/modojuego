import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('js/natural-potential-03829.js');
const coreSource=read('js/world-core-03828.js'),html=read('index.html');
assert.doesNotThrow(()=>new Function(src),'natural potential module syntax');
assert.ok(!/\bowner6\b/.test(src),'natural potential MUST NOT depend on territorial ownership');
assert.ok(src.includes('CACHE_LIMIT=4096'),'bounded LRU cache required');
assert.ok(html.indexOf('js/natural-potential-03829.js')>
  html.indexOf('js/world-core-03828.js'));
assert.ok(coreSource.includes("emit('worldNewGame'"),'new game must receive a new seed');

function create(){
  let registered=null,persisted=0;
  const callbacks=new Map();
  const core={
    register:spec=>{registered=spec},
    on:(name,cb)=>{callbacks.set(name,cb);return ()=>callbacks.delete(name)},
    persist:()=>{persisted++;return true}
  };
  const coords=new Map([
    [1,{lat:40.0,lon:-2.0}],
    [2,{lat:40.05,lon:-1.95}],
    [3,{lat:-21.5,lon:134.0}],
    [4,{lat:55.5,lon:12.0}],
    [5,{lat:58.7,lon:13.0}],
    [6,{lat:40,lon:-2.0}],
    [7,{lat:40,lon:-2.0}],
    [8,{lat:40,lon:-2.0}]
  ]);
  const landTypes={1:'plain',2:'plain',3:'desert',4:'forest',5:'steppe',6:'rainforest',7:'ice',8:'plain'};
  const window={HexategosWorldCore03828:core,__openfrontBootCompleted3281:true,
    crypto:{getRandomValues(arr){arr[0]=0x1234abcd;return arr}}};
  const boot=new Function('window','cellLonLat3302','terrainKey3250','console',
    src+'\nreturn window.HexategosNaturalPotential03829;');
  const api=boot(window,c=>coords.get(c)||null,c=>landTypes[c]||'sea',console);
  return {api,registered,callbacks,window,get persisted(){return persisted}};
}
const a=create(),b=create();
assert.equal(a.api.seed(),b.api.seed(),'legacy seed must be deterministic');
assert.equal(a.api.generatorVersion,1);
assert.deepEqual(a.api.profile(1),b.api.profile(1),'same seed and atlas must match');
assert.deepEqual(a.api.profile(1),a.api.profile(1),'repeated queries match');
assert.equal(a.api.profile(-1),null,'invalid cell rejected');
for(const key of ['food','livestock','forest','mineral','energy']){
  assert.ok(Number.isFinite(a.api.profile(1)[key]),key+' must be numeric');
  assert.ok(a.api.profile(1)[key]>=0&&a.api.profile(1)[key]<=2.5);
}
const close=a.api.profile(1),neighbor=a.api.profile(2);
assert.ok(Math.abs(close.mineral-neighbor.mineral)<.035,'mineral potential must vary smoothly across adjacent coordinates');
assert.ok(Math.abs(close.energy-neighbor.energy)<.035,'energy potential must vary smoothly across adjacent coordinates');
assert.ok(Math.abs(close.food-neighbor.food)<.035,'agricultural potential should be spatially coherent');
assert.equal(a.api.profile(1).forest,0,'nonforest land has no forest resource');
assert.ok(a.api.profile(4).forest>.3,'forest has trees without geological study');
assert.ok(a.api.profile(6).forest>.3,'rainforest has trees without geological study');
assert.equal(a.api.profile(7).food,0,'ice must have zero agricultural potential');
assert.equal(a.api.profile(7).livestock,0,'ice must have zero pasture');
assert.notEqual(a.api.profile(4).food,a.api.profile(4).livestock,'livestock is not a clone of agriculture');
assert.ok(a.api.profile(3).food<a.api.profile(1).food,'desert agriculture is poorer than a nearby plain');
assert.equal(a.api.category(1.3),'Alto');
assert.equal(a.api.category(0),'Inexistente');
assert.equal(a.api.cacheSize(),6,'only requested cells should be cached');
a.api.profile(5);a.api.profile(8);
assert.equal(a.api.cacheSize(),8,'new queries add to bounded cache on demand');

const before=a.api.profile(1);
a.registered.restore({seed:0x1e2d3c4b,generator:1});
const changed=a.api.profile(1);
assert.notEqual(a.api.seed(),b.api.seed(),'imported seed is restored');
assert.notDeepEqual(changed,before,'different seeds produce different abundance');
assert.equal(a.api.cacheSize(),1,'restoring a seed invalidates the old cache');
assert.deepEqual(a.registered.snapshot(),{seed:0x1e2d3c4b,generator:1});
a.registered.restore(null);
assert.deepEqual(a.api.profile(1),b.api.profile(1),'old saves with no seed recover the legacy model');
assert.ok(a.callbacks.has('worldNewGame'));
a.callbacks.get('worldNewGame')();
assert.equal(a.api.seed(),0x1234abcd,'new campaign creates a new seed exactly once');
assert.equal(a.persisted,1,'new seed must be persisted immediately');
assert.deepEqual(a.registered.snapshot(),{seed:0x1234abcd,generator:1});

console.log('HEXATEGOS 0.38.29: seed, political independence, terrain, agriculture, livestock, forest, regional continuity and cache PASS');
