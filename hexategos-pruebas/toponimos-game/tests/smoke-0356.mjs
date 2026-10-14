import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/ai-infra-0356.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(js),'ai-infra-0356.js must parse');
assert.ok(js.includes("if(isHistoric)return"),'historic capital marker must be suppressed');
assert.ok(js.includes('MULTI_ICON_ZOOM'),'combined infrastructure LOD missing');
assert.ok(js.includes("k.city&&k.industry&&k.port"),'triple city/industry/port layout missing');
assert.ok(js.includes('aiDevelopmentTargets3283=function'),'AI development targets override missing');
assert.ok(js.includes('Math.ceil(root*1.02)'),'large-country city scaling missing');
assert.ok(js.includes('nationalDefense3275=function'),'AI defense limiter missing');
assert.ok(js.includes('underdeveloped'),'development-before-fortification rule missing');
assert.ok(js.includes('refreshExistingPlans0356'),'started-game plan refresh missing');
assert.ok(index.includes('js/ai-infra-0356.js'),'0.35.6 module not loaded');

console.log('HEXATEGOS 0.35.6 AI + infrastructure smoke: OK');
