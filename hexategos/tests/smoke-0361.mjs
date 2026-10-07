import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('js/game.js');
const ai=read('js/nation-ai-0360.js');
const perf=read('js/performance-0361.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(ai),'nation-ai module must parse');
assert.doesNotThrow(()=>new Function(perf),'performance-0361.js must parse');
assert.ok(ai.includes("const BUILD='0.36.1'"),'adaptive scheduler build must be 0.36.1');
assert.ok(ai.includes('schedulerTimeBudget0361'),'time-budgeted AI scheduler missing');
assert.ok(ai.includes('performance.now()>=deadline'),'AI deadline guard missing');
assert.ok(ai.includes('lastDeferred'),'deferred AI accounting missing');
assert.ok(perf.includes('checkEnd3230=function'),'cached end-game check missing');
assert.ok(perf.includes('countFaction3230=function'),'cached territory count missing');
assert.ok(perf.includes('buildOwnerCacheKey3298=function'),'allocation-free owner LOD cache missing');
assert.ok(perf.includes('ownerVote0361'),'reused owner vote buffer missing');
assert.ok(perf.includes('warCount3261=function'),'cached war count missing');
assert.ok(perf.includes('tradeIncome3261=function'),'contact-based trade income missing');
assert.ok(perf.includes('ensureEconomySnapshot3261=function'),'coalesced economy snapshot missing');
assert.ok(perf.includes('renderDiplomacy3300=function'),'diplomacy DOM throttle missing');
assert.ok(perf.includes('rankOrderSignature'),'incremental ranking DOM update missing');
assert.ok(perf.includes('targetsRef'),'allocation-free diplomacy target access missing');
assert.ok(game.includes('window.HexategosPerformance0361'),'diplomatic weariness performance hook missing');
assert.ok(read('js/diplomatic-network-034.js').includes('targetsRef:(f)=>diplomaticTargets3301(f)'),'diplomatic network hot-path accessor missing');
const iAI=index.indexOf('js/nation-ai-0360.js');
const iPerf=index.indexOf('js/performance-0361.js');
assert.ok(iAI>=0&&iPerf>iAI,'performance layer must load after adaptive nation AI');
assert.ok(index.includes('v0.36.1</title>')||index.includes('v0.36.2</title>')||index.includes('v0.37.0</title>')||index.includes('v0.37.1</title>')||index.includes('v0.37.2</title>')||index.includes('v0.37.3</title>')||index.includes('v0.37.4</title>')||index.includes('v0.37.5</title>')||index.includes('v0.37.6</title>')||index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>'),'visible version must include the 0.36.1 performance layer or a compatible successor');

console.log('HEXATEGOS 0.36.1 500-nation performance smoke: OK');
