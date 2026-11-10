/* APEX: catálogo completo, banderas, tiempos y fuentes de circuitos extra.
 * Auditoría estructural; no sustituye tests WebGL, vueltas, IA o boxes reales. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const p000=fs.readFileSync(path.join(root,'parts/part-000.txt'),'utf8');
const p023=fs.readFileSync(path.join(root,'parts/part-023.txt'),'utf8');
function between(src,start,end){
 const a=src.indexOf(start);assert.ok(a>=0,'Missing '+start);
 const b=src.indexOf(end,a+start.length);assert.ok(b>a,'Missing '+end);
 return src.slice(a,b);
}
const catalog=vm.runInNewContext(between(p000,'const calendar=[','const CUSTOM_CIRCUIT_JSON_KEY_PREFIX')+
 '\n({calendar,F1_SEASON_COUNT,EXTRA_CIRCUITS})');
const {calendar,F1_SEASON_COUNT,EXTRA_CIRCUITS}=catalog;
assert.equal(F1_SEASON_COUNT,23);
assert.equal(EXTRA_CIRCUITS.length,8);
assert.equal(calendar.length,31);
assert.equal(new Set(calendar.map(s=>s.dir)).size,31);
assert.ok(calendar.slice(0,23).every(s=>Number.isInteger(s.r)&&!s.nonCalendar));
assert.ok(calendar.slice(23).every(s=>s.r===null&&s.nonCalendar));
const meta=JSON.parse(between(p000,'const APEX_LEGACY_RACE_META=',';\nvar APEX_BASE_CIRCUIT_JSON_BY_ID=').replace(/^const APEX_LEGACY_RACE_META=/,''));
const sandbox={raceMetaFor:spec=>meta[spec.dir]||null};
const flags=between(p023,'const roundFlagCode=','let teamLogoRenderSeq');
const lap=between(p023,'function estimateLapBase(','function weekendTeamKey(');
vm.runInNewContext(flags+'\n'+lap+'\nthis.flagMarkup=flagMarkup;this.estimateLapBase=estimateLapBase;',sandbox);
const rows=[];
const colorByCountry={US:'#3c3b6e',ES:'#aa151b',FR:'#0055a4',DE:'#dd0000'};
for(const spec of EXTRA_CIRCUITS){
 const m=meta[spec.dir];assert.ok(m&&m.km>1&&m.laps>0&&m.turns>0,'Missing race metadata '+spec.dir);
 const f=sandbox.flagMarkup(spec);
 const cc=spec.country.includes('Francia')?'FR':spec.country.includes('Alemania')?'DE':spec.country.includes('España')?'ES':'US';
 assert.ok(f.includes(colorByCountry[cc]),'Wrong flag '+spec.dir);
 const lapSeconds=sandbox.estimateLapBase(spec);
 assert.ok(Number.isFinite(lapSeconds)&&lapSeconds>40&&lapSeconds<600,'Invalid simulated lap '+spec.dir);
 if(spec.dir==='x-nurburgring-long')assert.ok(lapSeconds>300,'Nordschleife cannot use 78 seconds');
 if(spec.dir==='x-le-mans-sarthe')assert.ok(lapSeconds>180,'Sarthe cannot use 78 seconds');
 let svgStatus='procedural';
 if(spec.externalSource==='extra-outline'){
  const file=path.join(root,'circuits/extra',m.layout+'.svg');
  assert.ok(fs.existsSync(file),'Missing extra track '+file);
  const xml=fs.readFileSync(file,'utf8');
  assert.ok(xml.includes('<svg')&&xml.includes('<path'),'Bad extra SVG '+file);
  svgStatus='outline';
  if(['x-le-mans-sarthe','x-le-mans-bugatti','x-nurburgring-long','x-nurburgring-gp'].includes(spec.dir)){
   assert.match(xml,/data-apex-role="pitlane-centerline"/,'Missing authored pit centreline '+spec.dir);
   svgStatus='outline-and-pit';
  }
 }
 rows.push({id:spec.dir,lapSeconds:+lapSeconds.toFixed(1),svgStatus});
}
// Los tiempos ya calibrados de la temporada no deben cambiar.
assert.equal(sandbox.estimateLapBase(calendar[0]),78);
assert.equal(sandbox.estimateLapBase(calendar[13]),82);
console.log(JSON.stringify({test:'apex-extra-circuit-catalog',calendar:23,extra:8,rows,ok:true}));
