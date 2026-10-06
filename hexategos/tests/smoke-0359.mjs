import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/universal-polities-0359.js');
const base=read('js/minor-polities-0357.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(js),'universal-polities-0359.js must parse');
assert.ok(js.includes("const BUILD='0.35.9'"),'0.35.9 marker missing');
assert.ok(js.includes('playerDiplomaticAction3300=function'),'player diplomacy bridge missing');
assert.ok(js.includes('renderDiplomacy3300=function'),'unified diplomacy UI missing');
assert.ok(js.includes('operation3212=function'),'player combat bridge missing');
assert.ok(js.includes('owner6[target]=-1;API.setOwner(target,id)'),'minor nations cannot conquer player territory');
assert.ok(js.includes('minorEconomyTick'),'minor economy missing');
assert.ok(js.includes('buildMinor(id)'),'minor national development missing');
assert.ok(js.includes('income3212=function'),'trade economy integration missing');
assert.ok(js.includes('drawGlobeCityIcon3249'),'same city icon family missing');
assert.ok(js.includes('drawGlobeIndustryIcon3249'),'same industry icon family missing');
assert.ok(js.includes('drawGlobePortIcon3249'),'same port icon family missing');
assert.ok(base.includes('setOwner(cell,id)'),'base ownership mutation API missing');
assert.ok(base.includes('setCapital(id,cell)'),'base capital mutation API missing');
assert.ok(index.includes('js/universal-polities-0359.js'),'0.35.9 module not loaded');

console.log('HEXATEGOS 0.35.9 universal political entities smoke: OK');
