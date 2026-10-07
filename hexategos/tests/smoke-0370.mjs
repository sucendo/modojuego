import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(trade),'trade-logistics-0370.js must parse');
assert.ok(trade.includes("const BUILD='0.37.0'")||trade.includes("const BUILD='0.37.1'"),'trade logistics build must include 0.37.0 or a compatible successor');
assert.ok(trade.includes('tradeIncome3261=function'),'physical trade income override missing');
assert.ok(trade.includes('residualTrade0370'),'residual relation-only trade missing');
assert.ok(trade.includes('roadMask=new Uint8Array'),'cached road mask missing');
assert.ok(trade.includes('roadComp=new Int32Array'),'cached road component map missing');
assert.ok(trade.includes('createLandRoute0370'),'physical land route creation missing');
assert.ok(trade.includes('createSeaRoute0370'),'physical maritime route creation missing');
assert.ok(trade.includes('requestTransit0370'),'third-country transit permission missing');
assert.ok(trade.includes("r.mode='smuggle'"),'land smuggling mode missing');
assert.ok(trade.includes("g.home=-1"),'fleet orphaning after home-port loss missing');
assert.ok(trade.includes('pendingHome0370'),'fleet base transfer state missing');
assert.ok(trade.includes('rebaseFleet0370'),'fleet base transfer action missing');
assert.ok(trade.includes("naval_build_0370"),'direct port fleet-build action missing');
assert.ok(trade.includes("sea_trade_0370"),'direct port sea-trade action missing');
assert.ok(trade.includes('drawTradeTraffic0370'),'high-zoom moving trade traffic missing');
assert.ok(trade.includes('const MAX_ROUTES=720'),'global trade route cap missing');
assert.ok(trade.includes('const TRADE_TICK_MS=2800'),'trade scheduler throttle missing');
assert.ok(trade.includes('pathBudget0370=2'),'expensive route-search budget missing');
assert.ok(trade.includes('seaPathUsed0370=false'),'one-sea-search-per-tick guard missing');
assert.ok(trade.includes('routeLimit0370(f){return f===0?16:MAX_ROUTES_PER_FACTION}'),'player/AI route limits missing');
assert.ok(trade.includes('autoLandTrade0370(0)'),'player physical land-route discovery missing');
assert.ok(trade.includes('HexategosTradeLogistics0370'),'trade diagnostics API missing');

const iHuman=index.indexOf('js/human-build-0362.js');
const iTrade=index.indexOf('js/trade-logistics-0370.js');
assert.ok(iHuman>=0&&iTrade>iHuman,'0.37.0 logistics layer must load after 0.36.2 AI construction');
assert.ok(index.includes('css/trade-logistics-0370.css'),'0.37.0 trade CSS missing');
assert.ok(index.includes('v0.37.0</title>')||index.includes('v0.37.1</title>'),'visible version must include 0.37.0 or a compatible successor');

console.log('HEXATEGOS 0.37.0 physical trade + port-based fleets smoke: OK');
