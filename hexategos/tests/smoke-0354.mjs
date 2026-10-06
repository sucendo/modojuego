import fs from 'node:fs';
import assert from 'node:assert/strict';

const base=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,base),'utf8');
const index=read('index.html');
const js=read('js/real-cities-0354.js');
const css=read('css/real-cities-0354.css');
const manifest=JSON.parse(read('data/cities-0354/manifest.json'));
const exclusions=JSON.parse(read('data/cities-0354/pplx-exclusions.json'));
const history=JSON.parse(read('data/cities-0354/historical-names.json'));

assert.doesNotThrow(()=>new Function(js),'real-cities-0354.js must parse');
assert.ok(index.includes('css/real-cities-0354.css'),'real-cities CSS not loaded');
assert.ok(index.includes('js/real-cities-0354.js'),'real-cities JS not loaded');
assert.ok(index.indexOf('js/real-cities-0354.js')>index.indexOf('js/movable-panels-0353.js'),
  'real-cities layer must load after movable panels');

for(const token of [
  'focusFactionCapital0354',
  'rotateToGeo3243',
  'decorateRanking0354',
  'pointInsideCell0354',
  'suggestForCell0354',
  'openCityProposal0354',
  'real_city_build',
  'GeoNames'
]) assert.ok(js.includes(token),`missing feature: ${token}`);

assert.ok(js.includes("modal3244.addEventListener('click'"),
  'city-choice listener must cover the whole modal');
assert.ok(!js.includes('setInterval('),'0.35.4 must not add periodic timers');
assert.ok(!js.includes('new MutationObserver('),'0.35.4 must not add MutationObserver');

assert.equal(manifest.records,140607,'atlas manifest record count changed');
assert.equal(manifest.excludedPPLX,5428,'PPLX exclusion count changed');
assert.equal(manifest.usableRecords,135179,'usable atlas count changed');
assert.equal(exclusions.records,5428,'PPLX exclusion file count changed');
assert.equal(Object.keys(history.records||{}).length,33,'historical city metadata count changed');
assert.ok(js.includes('pplx-exclusions.json'),'PPLX filter is not loaded');
assert.ok(js.includes('historical-names.json'),'historical names are not loaded');
assert.ok(!js.includes('formatPopulation0354'),'population must not be rendered in city choices');
assert.ok(!css.includes('grid-area:pop'),'population column must not remain in city cards');
assert.equal(manifest.bands,12,'atlas must have 12 longitude bands');

const dir=new URL('data/cities-0354/',base);
let records=0;
let madrid=false;
for(let i=0;i<12;i++){
  const file=new URL(`band-${String(i).padStart(2,'0')}.json`,dir);
  assert.ok(fs.existsSync(file),`missing city band ${i}`);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(data.band,i,`wrong band id ${i}`);
  for(const rows of Object.values(data.tiles||{})){
    records+=rows.length;
    if(rows.some(r=>r[0]==='Madrid' && Math.abs(Number(r[1])-40.4165)<.2 && Math.abs(Number(r[2])+3.7)<.2))
      madrid=true;
  }
}
assert.equal(records,manifest.records,'atlas record total does not match manifest');
assert.ok(madrid,'Madrid sanity-check city missing from atlas');

const exclusionKey=r=>String(r[0])+'\u0001'+Number(r[1])+'\u0001'+Number(r[2])+'\u0001'+String(r[3]||'');
const excluded=new Set(exclusions.rows.map(exclusionKey));
let matchedExcluded=0;
for(let i=0;i<12;i++){
  const data=JSON.parse(fs.readFileSync(new URL(`band-${String(i).padStart(2,'0')}.json`,dir),'utf8'));
  for(const rows of Object.values(data.tiles||{})){
    for(const r of rows){
      const k=String(r[0])+'\u0001'+Number(r[1])+'\u0001'+Number(r[2])+'\u0001'+String(r[4]||'');
      if(excluded.has(k))matchedExcluded++;
    }
  }
}
assert.equal(matchedExcluded,exclusions.records,'every PPLX exclusion must match the atlas exactly');

console.log('HEXATEGOS 0.35.4 real cities smoke: OK · '+records+' raw · '+(records-matchedExcluded)+' usable localities');
