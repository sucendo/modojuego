import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const decay=read('js/infrastructure-decay-0373.js');
const index=read('index.html');
const about=read('js/about-0351.js');
const trade=read('js/trade-logistics-0370.js');

assert.doesNotThrow(()=>new Function(decay),'infrastructure-decay-0373.js must parse');
assert.ok(decay.includes("const BUILD='0.37.3'"),'decay build must be 0.37.3');
assert.ok(decay.includes('const AUDIT_PERIOD=10'),'low-frequency audit missing');
assert.ok(decay.includes('const GRACE_SECONDS=60'),'communication grace period missing');
assert.ok(decay.includes('const ABANDONED_SECONDS=180'),'abandoned threshold missing');
assert.ok(decay.includes('const FADE_SECONDS=300'),'fade threshold missing');
assert.ok(decay.includes('const REMOVE_SECONDS=360'),'removal threshold missing');
assert.ok(decay.includes('api.roadComponent(c)>=0'),'any physical road connection must count as internal land route');
assert.ok(trade.includes('roadComponent:(cell)=>'),'trade logistics road-component API missing');
assert.ok(decay.includes("r.type!=='sea'"),'maritime-route connectivity missing');
assert.ok(decay.includes('function roadCommunications0373()'),'internal road communications helper missing');
assert.ok(decay.includes('isCapital0373(cell,f)'), 'capital communications protection missing');
assert.ok(decay.includes("cities3212.delete(cell)"),'city disappearance missing');
assert.ok(decay.includes("industries3212.delete(cell)"),'industry disappearance missing');
assert.ok(decay.includes("ports3212.delete(cell)"),'port disappearance missing');
assert.ok(decay.includes('g.home=-1'),'lost port must leave fleets without base');
assert.ok(decay.includes('economyStructureSupply3261=function'),'degradation must reduce economic output');
assert.ok(decay.includes("filter:'grayscale"),'greyscale visual states missing');
assert.ok(decay.includes('ctx.globalAlpha*=v.alpha'),'fade-to-transparent rendering missing');
assert.ok(decay.includes('const baseEconomyTick0373=economyTick3212'),'existing simulation clock must be reused');
assert.ok(!decay.includes('setInterval('),'0.37.3 must not add another periodic timer');
assert.ok(decay.includes('const removalsBefore=removals'),'batched removal refresh guard missing');
assert.ok(decay.includes('infrastructureDecay0373=serialize0373()'),'portable save extension missing');
assert.ok(index.includes('v0.37.3</title>')||index.includes('v0.37.4</title>')||index.includes('v0.37.5</title>')||index.includes('v0.37.6</title>')||index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>')||index.includes('v0.37.19</title>'),'visible version must be 0.37.3');
assert.ok(index.indexOf('js/infrastructure-decay-0373.js')>index.indexOf('js/trade-logistics-0370.js'),'decay module must load after logistics');
assert.ok(about.includes("version:'0.37.3'"),'about history must include 0.37.3');

console.log('HEXATEGOS 0.37.3 isolated infrastructure decay smoke: OK');
