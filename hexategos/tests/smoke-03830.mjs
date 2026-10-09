import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const naturalSrc=read('js/natural-potential-03829.js');
const geoSrc=read('js/geology-03830.js'),html=read('index.html');
assert.doesNotThrow(()=>new Function(geoSrc));
assert.ok(!/\bowner6\b/.test(geoSrc),'geology cannot depend on political ownership');
assert.ok(!/Math\.random\(/.test(geoSrc),'geology cannot reroll deposits');
assert.ok(html.indexOf('js/geology-03830.js')>html.indexOf('js/natural-potential-03829.js'));
const table=new Map([
  [1,{lat:27,lon:50}],[2,{lat:27.05,lon:50.05}],[3,{lat:0,lon:-150}],
  [4,{lat:-22,lon:119}],[5,{lat:-24,lon:-70}],[6,{lat:38,lon:-81}],
  [7,{lat:62,lon:72}],[8,{lat:57,lon:3}],[9,{lat:41,lon:51}],
  [10,{lat:29,lon:5}]
]);
for(let i=100;i<3100;i++){
  const n=i-100;
  table.set(i,{lat:-79+(n%60)*(158/59),lon:-178+Math.floor(n/60)*(356/49)});
}
const baseCore={register(){},on(){return ()=>{}},persist(){return true}};
function boot(seed=0x487E291A){
 const win={__openfrontBootCompleted3281:true,HexategosWorldCore03828:baseCore};
 const terrain=()=> 'plain';
 const location=c=>table.get(c)||null;
 const run=new Function('window','cellLonLat3302','terrainKey3250','console',
   naturalSrc+'\n'+geoSrc+
   '\nreturn {nature:window.HexategosNaturalPotential03829,geology:window.HexategosGeology03830};');
 const apis=run(win,location,terrain,{warn(){}});
 // Natural registration normally restores via the world core after loading.
 // For tests, apply alternate seed through the exposed registered module hook.
 return apis;
}
const A=boot(),B=boot();
const geo=A.geology;
assert.equal(geo.generatorVersion,1);
assert.deepEqual(geo.kinds(),['iron','copper','coal','quarry','oil','gas']);
assert.ok(geo.provinces().length>=20,'geological provinces must be configurable');
assert.deepEqual(geo.deposit(1,'oil'),B.geology.deposit(1,'oil'),'same map and seed => same deposit');
assert.deepEqual(geo.deposit(2,'oil'),B.geology.deposit(2,'oil'));
for(const [kind,lat,lon] of [
  ['oil',27,50],['gas',62,72],['coal',38,-81],['iron',-22,119],['copper',-24,-70]
]){
 const region=geo.provinceEffect(lat,lon,kind);
 const remote=geo.provinceEffect(0,-150,kind);
 assert.ok(region>remote+.1,kind+' deposit region must increase its likelihood');
}
const hint=geo.hint(1);
assert.deepEqual(Object.keys(hint).sort(),['energyPotential','mineralPotential'],
  'undiscovered resources cannot leak from general potential API');
assert.equal(geo.deposit(1,'uranium'),null,'future uranium deposits must remain disabled');
const near=geo.deposit(1,'oil'),adjacent=geo.deposit(2,'oil');
assert.ok(Math.abs(near.quality-adjacent.quality)<.25,'oil basin must be spatially continuous');
assert.equal(near.reserve===0,near.quality===0,'reserve exists only with a deposit');
const before=geo.deposit(4,'iron');
before.quality=987;
assert.notEqual(geo.deposit(4,'iron').quality,987,'returned deposit cannot corrupt cached geology');
const zeros={};
for(const kind of geo.kinds()){
 let zero=0,positive=0;
 for(let cell=100;cell<3100;cell++){
   const p=geo.deposit(cell,kind);
   if(p.quality===0){zero++;assert.equal(p.reserve,0)}
   else {positive++;assert.ok(p.reserve>0&&p.quality<=2.6)}
 }
 zeros[kind]={zero,positive};
 if(kind!=='quarry')assert.ok(zero>1700,'numerous cells must genuinely have no '+kind);
 assert.ok(positive>0,'the world should have at least some '+kind);
}
assert.ok(geo.cacheSize()<=geo.cacheLimit,'memory must be bounded at global map scale');
assert.equal(geo.cacheLimit,8192);
console.log('HEXATEGOS 0.38.30: regional provinces, deterministic and hidden deposits, real zero abundance, coherent basins and bounded memory PASS');
console.log('Sample absent deposit counts:',JSON.stringify(zeros));
