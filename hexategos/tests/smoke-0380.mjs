import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sc=read('js/statecraft-0380.js');
const trade=read('js/trade-logistics-0370.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(sc),'statecraft must parse');
assert.ok(versionAtLeast(sc,'0.38.0'),'module build must be compatible with 0.38.0');
assert.ok(sc.includes('function requestEmbassy'),'embassy flow missing');
assert.ok(sc.includes('function renderNationDossier'),'nation dossier missing');
assert.ok(sc.includes("['dip','commerce','intel','military','routes']"),'nation dossier tabs missing');
assert.ok(sc.includes('function runSpyOperation'),'spy operations missing');
assert.ok(sc.includes('function resourceTradeAllowed'),'resource export policy missing');
assert.ok(sc.includes('function resourceProductionMultiplier'),'intelligence production effects missing');
assert.ok(sc.includes('function updateOneCity'),'city stability missing');
assert.ok(sc.includes('function restoreNationalControl'),'nationalist rebellion/restoration missing');
assert.ok(sc.includes('statecraft0380=serialize0380()'),'portable statecraft save missing');
assert.ok(!sc.includes('setInterval('),'statecraft must reuse existing simulation clock');

assert.ok(trade.includes('statecraft?.canTrade'),'physical trade must require formal statecraft permission');
assert.ok(trade.includes('statecraft?.resourceTradeAllowed'),'route cargo must respect export policy');
assert.ok(trade.includes('statecraft?.resourceProductionMultiplier'),'resource production must accept sabotage/unrest effects');

assert.ok(versionAtLeast(index,'0.38.0'),'visible game version must be 0.38.0 or newer');
assert.ok(index.includes('js/statecraft-0380.js'),'statecraft script missing');
assert.ok(index.includes('css/statecraft-0380.css'),'statecraft css missing');
assert.ok(about.includes("version:'0.38.0'"),'About must include 0.38.0');
assert.ok(about.includes("version:'0.37.24'"),'About must retain 0.37.24');

console.log('HEXATEGOS 0.38.0 statecraft smoke: OK');
