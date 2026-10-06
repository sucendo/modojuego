import fs from 'node:fs';
import assert from 'node:assert/strict';

const base=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,base),'utf8');
const index=read('index.html');
const js=read('js/real-cities-0354.js');
const css=read('css/real-cities-0354.css');
const manifest=JSON.parse(read('data/cities-0354/manifest.json'));

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

console.log('HEXATEGOS 0.35.4 real cities smoke: OK · '+records+' localities');
