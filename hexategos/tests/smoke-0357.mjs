import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/minor-polities-0357.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(js),'minor-polities-0357.js must parse');
assert.ok(js.includes("TARGET_SECONDS=300"),'five-minute occupancy horizon missing');
assert.ok(js.includes("TARGET_OCCUPANCY=.975"),'near-full occupancy target missing');
assert.ok(js.includes('new Int16Array(L.n)'),'compact minor ownership map missing');
assert.ok(js.includes('new Int32Array(L.n)'),'bounded BFS queue missing');
assert.ok(js.includes('MAX_CLAIMS_PER_TICK=4200'),'per-tick performance budget missing');
assert.ok(js.includes("mapMode3252==='political'"),'minor political rendering hook missing');
assert.ok(js.includes('baseEconomyTick0357=economyTick3212'),'must reuse existing simulation clock');
assert.ok(!js.includes('setInterval('),'minor polity layer must not add periodic timers');
assert.ok(js.includes("village:{label:'PUEBLO'"),'village tier missing');
assert.ok(js.includes("regional:{label:'ESTADO REGIONAL'"),'regional tier missing');
assert.ok(js.includes("conformist"),'conformist personality missing');
assert.ok(js.includes('minorPolities={version:1'),'portable metadata extension missing');
assert.ok(index.includes('js/minor-polities-0357.js'),'0.35.7 module not loaded');

console.log('HEXATEGOS 0.35.7 minor polities smoke: OK');
