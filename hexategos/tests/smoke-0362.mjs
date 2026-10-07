import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const human=read('js/human-build-0362.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(human),'human-build-0362.js must parse');
assert.ok(human.includes("const BUILD='0.36.2'"),'human construction build must be 0.36.2');
assert.ok(human.includes('Math.ceil(root*.92)'),'human-like city density calibration missing');
assert.ok(human.includes('Math.ceil(root*.40)'),'human-like industry density calibration missing');
assert.ok(human.includes('newIndustrySite0362'),'strategic new industry site selector missing');
assert.ok(human.includes('existingIndustryUpgrade0362'),'upgrade-existing-industry path missing');
assert.ok(human.includes("if(creating&&!needNew)return false"),'new industry must stop after reaching target');
assert.ok(human.includes("cities3212.has(task.target)||ports3212.has(task.target)||aiRoadDegree3260(task.target)>0"),
  'regional industry must require an urban/logistics node');
assert.ok(human.includes('regionalTryInvest3284=function'),'stale regional task pruning missing');
assert.ok(human.includes('live.industries<targets.targetIndustries'),'live industry quota guard missing');

const iPerf=index.indexOf('js/performance-0361.js');
const iHuman=index.indexOf('js/human-build-0362.js');
assert.ok(iPerf>=0&&iHuman>iPerf,'0.36.2 construction layer must load after 0.36.1 performance layer');
assert.ok(index.includes('v0.36.2</title>')||index.includes('v0.37.0</title>'),'visible version must include 0.36.2 construction or a compatible successor');

console.log('HEXATEGOS 0.36.2 human-like AI construction smoke: OK');
