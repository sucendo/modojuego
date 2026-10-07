import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');

assert.ok(trade.includes('function beginSeaTradeMapPick03715'),'0.37.15 picker missing');
assert.ok(!trade.slice(trade.indexOf('function beginSeaTradeMapPick03715'),trade.indexOf('const baseHandleInteractionTarget03714'))
  .includes('seaCandidates0370(from).length'),'picker must not be gated by precomputed candidates');
assert.ok(trade.includes('const canTrade=routeCount0370(0)<routeLimit0370(0)'),'route button must be enabled by route capacity only');
assert.ok(trade.includes("'ELIGE PUERTO EN MAPA'"),'route action must advertise direct port selection');
assert.ok(trade.includes("setInteractionMode3244('select_trade_route_target'"),'native target mode missing');

assert.ok(trade.includes('function nearestPortScreen03715'),'screen-port snap helper missing');
assert.ok(trade.includes("if(uiInteractionState3244.interactionMode==='select_trade_route_target')"),'port snap must only run in trade target mode');
assert.ok(trade.includes('const basePick03715=pick'),'map pick wrapper missing');
assert.ok(trade.includes('handleInteractionTarget3244(port)'),'snapped port must enter native target handler');
assert.ok(trade.includes('p[2]<.035'),'hidden/back-side ports must not be picked');
assert.ok(trade.includes('Uno de los puertos no tiene acceso marítimo navegable'),'explicit maritime-access diagnostic missing');
assert.ok(trade.includes('canPickSeaTarget:(from,to)=>'),'target validation diagnostic API missing');

assert.ok(index.includes('v0.37.15</title>'),'visible version must be 0.37.15');
assert.ok(about.includes("version:'0.37.15'"),'about history must include 0.37.15');

console.log('HEXATEGOS 0.37.15 robust commercial picker smoke: OK');
