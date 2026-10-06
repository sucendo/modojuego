import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const geo=read('js/geopolitics-035.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(geo),'geopolitics-035.js must parse as JavaScript');

for(const doctrine of ['expansionist','maritime','defensive','commercial','continental'])
  assert.ok(geo.includes(doctrine),`missing doctrine ${doctrine}`);

for(const feature of [
  'objectiveList035',
  'threatScore035',
  'bufferCandidate035',
  'dominantTarget035',
  'grievance',
  'geopoliticalModifier035',
  'opinionModifier035',
  'relationReason035'
]) assert.ok(geo.includes(feature),`missing geopolitical feature ${feature}`);

assert.ok(geo.includes('baseStrategicValue035=aiStrategicValue3260'),'strategic AI hook missing');
assert.ok(geo.includes('basePlanFaction035=aiPlanFaction3260'),'strategic plan hook missing');
assert.ok(geo.includes('baseOpinionTarget035=dipOpinionTarget3300'),'opinion hook missing');
assert.ok(geo.includes('baseAcceptance035=dipAcceptanceScore3300'),'treaty acceptance hook missing');
assert.ok(geo.includes('baseRelation035=setDiplomaticRelation3300'),'diplomatic memory hook missing');
assert.ok(geo.includes('out.geopolitics035=serialize035()'),'portable save extension missing');
assert.ok(geo.includes('restore035(s?.geopolitics035)'),'portable load extension missing');
assert.ok(geo.includes("const SAVE_KEY='hexategos-geopolitics-035'"),'local persistence key missing');
assert.ok(!geo.includes('setInterval('),'0.35 must not add periodic timers');
assert.ok(!geo.includes('MutationObserver'),'0.35 must not add MutationObserver');

const iStable=index.indexOf('js/stability-0342.js');
const iGeo=index.indexOf('js/geopolitics-035.js');
assert.ok(iStable>=0&&iGeo>iStable,'0.35 must load after 0.34.2 stability layer');

console.log('HEXATEGOS 0.35 geopolitical smoke: OK');
