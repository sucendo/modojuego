import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ai=read('js/ai-commerce-0375.js');
const trade=read('js/trade-logistics-0370.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(ai),'ai-commerce-0375.js must parse');
assert.ok(ai.includes("const BUILD='0.37.5'"),'AI commerce build must be 0.37.5');
assert.ok(ai.includes('DIPLOMACY_SERVICE_SECONDS=3'),'guaranteed diplomacy cadence missing');
assert.ok(ai.includes('CIVIL_WATCHDOG_SECONDS=30'),'civil watchdog cadence missing');
assert.ok(ai.includes('MAX_BORDER_SAMPLES=260'),'bounded border sampling missing');
assert.ok(ai.includes('return r===1||r===2||r===3'),'cooperative treaties must preserve trade rights');
assert.ok(ai.includes('function borderPair0375'),'commercial border rendezvous missing');
assert.ok(ai.includes('pair.otherRoad?42:0'),'existing partner road must strongly attract corridor');
assert.ok(ai.includes("'corredor comercial fronterizo'"),'commercial corridor construction reason missing');
assert.ok(ai.includes("'reconectar infraestructura aislada'"),'isolated infrastructure repair missing');
assert.ok(ai.includes('tryCivilWatchdog0375'),'civil watchdog missing');
assert.ok(ai.includes('now-lastCivilBuild[f]<CIVIL_WATCHDOG_SECONDS'),'watchdog must stay inactive while development progresses');
assert.ok(ai.includes('const baseEconomyTick0375=economyTick3212'),'diplomacy must reuse existing economy tick');
assert.ok(ai.includes('diplomacyTick3300();diplomacyServices++'),'guaranteed diplomacy service missing');
assert.ok(!ai.includes('setInterval('),'0.37.5 must not add another periodic timer');
assert.ok(trade.includes('return r===1||r===2||r===3'),'physical trade must remain valid under NAP/alliance');
assert.ok(trade.includes('ensureLandRoute:(a,b)=>'),'safe land-route materialization API missing');
assert.ok(index.includes('v0.37.5</title>')||index.includes('v0.37.6</title>')||index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>'),'visible version must be 0.37.5');
assert.ok(index.indexOf('js/ai-commerce-0375.js')>index.indexOf('js/road-removal-0374.js'),'0.37.5 must load after 0.37.4');
assert.ok(about.includes("version:'0.37.5'"),'about history must include 0.37.5');

console.log('HEXATEGOS 0.37.5 AI commerce and civil watchdog smoke: OK');
