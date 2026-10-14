import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sc=read('js/statecraft-0380.js');
const trade=read('js/trade-logistics-0370.js');
const ai=read('js/ai-commerce-0375.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(sc),'statecraft must parse');
assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');
assert.doesNotThrow(()=>new Function(ai),'AI commerce must parse');

assert.ok(versionAtLeast(sc,'0.38.1'),'module build must be compatible with 0.38.1');
assert.ok(sc.includes('let treaties=new Map()'),'separate treaty registry missing');
assert.ok(sc.includes('function tradeTreaty'),'trade treaty flag missing');
assert.ok(sc.includes('function napTreaty'),'NAP treaty flag missing');
assert.ok(sc.includes('function allianceTreaty'),'alliance treaty flag missing');
assert.ok(sc.includes('EMBASSY_RETRY_SECONDS'),'embassy rejection cooldown missing');
assert.ok(sc.includes('SPY_UPKEEP_PER_SECOND'),'spy upkeep missing');
assert.ok(sc.includes('function counterIntelLevel'),'counterintelligence missing');
assert.ok(sc.includes('combinedSupply ya incorpora'),'AI supply double-penalty fix missing');
assert.ok(sc.includes('treaties:[...treaties]'),'treaties must persist');
assert.ok(sc.includes('counterIntel:Array.from(counterIntel)'),'counterintelligence must persist');
assert.ok(!sc.includes('setInterval('),'0.38.1 must reuse existing simulation clock');

assert.ok(ai.includes('statecraft?.canTrade'),'AI commerce must respect explicit trade treaty');
assert.ok(trade.includes('statecraft?.canTrade?statecraft.canTrade'),'residual income must respect explicit trade treaty');
assert.ok(versionAtLeast(index,'0.38.1'),'visible game version must be 0.38.1 or newer');
assert.ok(about.includes("version:'0.38.1'"),'About must include 0.38.1');

console.log('HEXATEGOS 0.38.1 diplomatic core smoke: OK');
