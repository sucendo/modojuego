import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const geo=read('js/trade-geopolitics-0377.js');
const eco=read('js/economic-corridors-0379.js');
const visuals=read('js/national-visuals-0378.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');
assert.doesNotThrow(()=>new Function(geo),'trade geopolitics must parse');
assert.doesNotThrow(()=>new Function(eco),'economic corridors must parse');

assert.ok(eco.includes('ACTIVE_BELT_EVERY=3'),'active-route belt cadence missing');
assert.ok(eco.includes('ACTIVE_DEVELOP_EVERY=6'),'active-route development cadence missing');
assert.ok(eco.includes('MAX_ACTIVE_ROUTE_SAMPLES=96'),'active-route sampling bound missing');
assert.ok(eco.includes("r.status==='active'||r.status==='smuggling'"),'active land routes must remain eligible for consolidation');
assert.ok(eco.includes('Array.isArray(r.path)&&r.path.length>=2'),'active route physical path must be reused');
assert.ok(eco.includes('function activeRoutePlan03711'),'active route maintenance planner missing');
assert.ok(eco.includes('noRoad:true'),'lateral belt expansion must not create roads on every captured cell');
assert.ok(eco.includes('buildCorridorCity0379(f,partner)||buildCorridorIndustry0379(f,partner)'),
  'mature active routes must be able to create economic nodes');
assert.ok(geo.includes('HexategosEconomicCorridors0379?.activeRoutePlan?.(f)'),
  'geopolitical service must continue maintaining active routes');
assert.ok(geo.includes('if(!step.noRoad&&roadCell0377(step.src)'),
  'neutral expansion must honor no-road consolidation cells');

assert.ok(trade.includes('function beginSeaTradeMapPick03714'),'native map destination selector missing');
assert.ok(trade.includes("setInteractionMode3244('select_trade_route_target'"),'map picker must use native interaction mode');
assert.ok(trade.includes('function seaTradeTargetReason03711'),'map target validation missing');
assert.ok(trade.includes("ports3212.has(to)"),'map destination must require a port');
assert.ok(trade.includes("!tradeRelation0370(0,b)"),'foreign map destination must require commercial rights');
assert.ok(trade.includes("beginSeaTradeMapPick03714(ctx.cell)"),'RUTA COMERCIAL must enter native map-pick mode');
assert.ok(trade.includes("'ELIGE EN MAPA'"),'route action must advertise map selection');
assert.ok(trade.includes('pickSeaOnMap:beginSeaTradeMapPick03714'),'map picker public API missing');
assert.ok(trade.includes("r.type==='sea'?(zoom>32?4.40:3.70):(zoom>32?3.20:2.70)"),'larger commercial marker sizing missing');
assert.ok(trade.includes('zoom>32?3.20:2.70'),'larger land trade marker missing');
assert.ok(trade.includes('zoom>32?3.20:2.60'),'larger domestic marker missing');

assert.ok(visuals.includes("if(g.order==='patrol')return null"),'patrol route must remain hidden');
assert.ok(index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>'),'visible version must be 0.37.11 or compatible successor');
assert.ok(about.includes("version:'0.37.11'"),'about history must include 0.37.11');

console.log('HEXATEGOS 0.37.11 active trade belts + map route destination smoke: OK');
