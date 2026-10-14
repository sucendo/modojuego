import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sc=read('js/statecraft-0380.js');
const trade=read('js/trade-logistics-0370.js');
const css=read('css/statecraft-0380.css');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(sc),'statecraft must parse');
assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');

assert.ok(versionAtLeast(sc,'0.38.2'),'module build must be compatible with 0.38.2');
assert.ok(trade.includes('function terrainResourceProfile0382'),'geographic primary resource profile missing');
assert.ok(trade.includes('function urbanWeight0382'),'urban weight missing');
assert.ok(trade.includes("plain:[1.38,.82,.72]"),'plain food profile missing');
assert.ok(trade.includes("desert:[.34,.94,1.44]"),'desert fuel profile missing');
assert.ok(trade.includes("mountain:[.46,1.54,.78]"),'mountain raw-material profile missing');
assert.ok(trade.includes('geo:profile.geo'),'resource nodes must retain geographic profile');
assert.ok(trade.includes('geography:(cell)=>terrainResourceProfile0382'),'geography API missing');
assert.ok(trade.includes('urbanWeight:(cell)=>'),'urban weight API missing');

assert.ok(sc.includes('function providerCandidates0382'),'supplier candidate engine missing');
assert.ok(sc.includes('function providerSearchPanel0382'),'supplier search UI missing');
assert.ok(sc.includes('function selfCommerceTab0382'),'self commerce view missing');
assert.ok(sc.includes('data-provider-open0382'),'supplier search action missing');
assert.ok(sc.includes('suppliers:(resource)=>'),'supplier search API missing');
assert.ok(css.includes('.supplierList0382'),'supplier search styles missing');

assert.ok(versionAtLeast(index,'0.38.2'),'visible game version must be 0.38.2 or newer');
assert.ok(about.includes("version:'0.38.2'"),'About must include 0.38.2');

console.log('HEXATEGOS 0.38.2 economy geography smoke: OK');
