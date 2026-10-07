import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const geo=read('js/trade-geopolitics-0377.js');
const trade=read('js/trade-logistics-0370.js');
const border=read('js/border-road-0376.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(geo),'trade-geopolitics-0377.js must parse');
assert.ok(geo.includes("const BUILD='0.37.7'"),'trade geopolitics build must be 0.37.7');
assert.ok(geo.includes('SERVICE_SECONDS=17'),'staggered service cadence missing');
assert.ok(geo.includes('MAX_STATE_DEPTH=5'),'bounded country-path search missing');
assert.ok(geo.includes('MAX_PARTNERS_CHECKED=5'),'bounded partner evaluation missing');
assert.ok(geo.includes('function bestNeutralStep0377'),'neutral corridor expansion planner missing');
assert.ok(geo.includes('owner6[step.target]=f'),'neutral conquest step missing');
assert.ok(geo.includes('function countryPath0377'),'state transit pathfinder missing');
assert.ok(geo.includes('requestTransit(a,b,via)'),'third-country transit request missing');
assert.ok(geo.includes('function handleDenied0377'),'transit-denial escalation missing');
assert.ok(geo.includes('countryPath0377(a,b,new Set([via]))'),'alternative route after denial missing');
assert.ok(geo.includes('trySmuggling0377'),'smuggling fallback missing');
assert.ok(geo.includes('setDiplomaticRelation3300(a,via,-1'),'late corridor-war escalation missing');
assert.ok(geo.includes("via===0")===false,'corridor module should not special-case player as auto-war target');
assert.ok(geo.includes("if(a<=0||via<=0"),'automatic corridor escalation must exclude player');
assert.ok(!geo.includes('setInterval('),'0.37.7 must not add a periodic timer');
assert.ok(geo.includes('HexategosEconomicCorridors0379?.prepare?.(a,b,sa,sb)'),
  '0.37.9 economic consolidation hook missing from geopolitical corridor service');

assert.ok(trade.includes('requestTransit:(a,b,via)=>'),'transit API must be exposed');
assert.ok(trade.includes('enableSmuggling:(a,b)=>'),'smuggling route API must be exposed');
assert.ok(border.includes('createTransitAI:'),'authorized transit-border API missing');
assert.ok(border.includes('createClandestineAI:'),'clandestine crossing API missing');

assert.ok(index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>'),'visible version must be 0.37.7');
assert.ok(index.indexOf('js/trade-geopolitics-0377.js')>index.indexOf('js/border-road-0376.js'),
  '0.37.7 must load after explicit border-road layer');
assert.ok(about.includes("version:'0.37.7'"),'about history must include 0.37.7');

console.log('HEXATEGOS 0.37.7 geopolitical trade corridors smoke: OK');
