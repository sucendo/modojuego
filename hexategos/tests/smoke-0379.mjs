import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const eco=read('js/economic-corridors-0379.js');
const geo=read('js/trade-geopolitics-0377.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(eco),'economic-corridors-0379.js must parse');
assert.ok(eco.includes("const BUILD='0.37.9'"),'economic corridor build must be 0.37.9');
assert.ok(eco.includes('CONSOLIDATE_EVERY=3'),'corridor consolidation cadence missing');
assert.ok(eco.includes('DEVELOP_EVERY=6'),'corridor development cadence missing');
assert.ok(eco.includes('MAX_FRONTIER_SAMPLES=180'),'bounded frontier sampling missing');
assert.ok(eco.includes('MAX_NODE_SAMPLES=190'),'bounded node sampling missing');
assert.ok(eco.includes('function axisExcess0379'),'corridor-axis scoring missing');
assert.ok(eco.includes('function bestConsolidationStep0379'),'lateral consolidation planner missing');
assert.ok(eco.includes('support.own<2&&support.road<1'),'compact territorial support rule missing');
assert.ok(eco.includes("'nodo urbano de corredor comercial'"),'corridor city construction missing');
assert.ok(eco.includes("'industria de corredor comercial'"),'corridor industry construction missing');
assert.ok(eco.includes('aiNationalSamples3275'),'bounded national samples must be reused');
assert.ok(!eco.includes('setInterval('),'0.37.9 must not add another periodic timer');

assert.ok(geo.includes('HexategosEconomicCorridors0379?.prepare?.(a,b,sa,sb)'),
  '0.37.7 corridor service must delegate consolidation/development to 0.37.9');
assert.ok(index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>'),'visible version must be 0.37.9 or compatible successor');
assert.ok(index.indexOf('js/economic-corridors-0379.js')>index.indexOf('js/national-visuals-0378.js'),
  '0.37.9 must load after 0.37.8');
assert.ok(about.includes("version:'0.37.9'"),'about history must include 0.37.9');

console.log('HEXATEGOS 0.37.9 consolidated economic corridors smoke: OK');
