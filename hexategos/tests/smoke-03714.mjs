import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');

assert.ok(trade.includes('function beginSeaTradeMapPick03716'),'native commercial destination picker missing');
assert.ok(trade.includes("beginTargetFromDialog3282('select_trade_route_target'"),'commercial picker must use strict native interaction flow');
assert.ok(trade.includes('const baseHandleInteractionTarget03716=handleInteractionTarget3245'),'final native target handler hook missing');
assert.ok(trade.includes("uiInteractionState3244.interactionMode!=='select_trade_route_target'"),'trade target mode dispatch missing');
assert.ok(trade.includes('const reason=seaTradeTargetReason03711(from,cell)'),'commercial target validation missing');
assert.ok(trade.includes('cancelInteractionMode3245()'),'successful commercial target must cancel final native mode');
assert.ok(!trade.includes('const baseUpdatePanel03711=updatePanel'),'fragile updatePanel picker must be removed');

assert.ok(trade.includes('function domesticAnchorKind03714'),'domestic logistics node classifier missing');
assert.ok(trade.includes("return 'capital'")&&trade.includes("return 'port'")&&trade.includes("return 'industry'")&&trade.includes("return 'city'"),
  'capital/city/industry/port must be domestic traffic nodes');
assert.ok(trade.includes('function roadTree03714'),'complete-road route tree missing');
assert.ok(trade.includes('function pathFromRoadTree03714'),'node-to-node road path reconstruction missing');
assert.ok(trade.includes('origin:hub,destination:target'),'domestic traffic must retain explicit origin/destination');
assert.ok(trade.includes('path:samplePath0370(full,160)'),'domestic traffic must use complete reconstructed route');
assert.ok(!trade.includes('faction:runFaction'),'legacy per-road-segment traffic builder must be removed');
assert.ok(trade.includes('const maxGroups=coarsePointer3255?54:96'),'domestic route group budget missing');
assert.ok(trade.includes('const maxVisits=g.f===0?14000:6500'),'bounded road-tree visits missing');
assert.ok(trade.includes('candidates.slice(0,coarsePointer3255?100:220)'),'global domestic candidate cap missing');

assert.ok(index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>'),'visible version must be 0.37.14 or compatible successor');
assert.ok(about.includes("version:'0.37.14'"),'about history must include 0.37.14');

console.log('HEXATEGOS 0.37.14 native route picker + node-to-node trucks smoke: OK');
