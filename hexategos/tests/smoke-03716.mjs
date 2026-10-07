import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const game=read('js/game.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');

// Prove the final controller architecture we are integrating with.
assert.ok(game.includes('const _setInteractionStrictBase3282=setInteractionMode3245'),'strict destination permit layer missing');
assert.ok(game.includes('const p=contextTargetPermit3282'),'strict destination permit check missing');
assert.ok(game.includes('function beginTargetFromDialog3282(mode,source,pending)'),'authoritative target arming helper missing');
assert.ok(game.includes('pick=pick3245'),'final canvas pick must be pick3245');
assert.ok(game.includes('const _handleTargetStrictBase3282=handleInteractionTarget3245'),'strict final target handler missing');

// Trade must enter through the strict permit flow.
assert.ok(trade.includes('function beginSeaTradeMapPick03716'),'0.37.16 trade picker missing');
assert.ok(trade.includes("beginTargetFromDialog3282('select_trade_route_target',from,'sea_trade_0370')"),
  'commercial target mode must be armed through the authoritative permit helper');
assert.ok(trade.includes("armed=uiInteractionState3244.interactionMode==='select_trade_route_target'"),
  'trade picker must verify that the mode actually armed');

// Trade must intercept the REAL final target handler.
assert.ok(trade.includes('const baseHandleInteractionTarget03716=handleInteractionTarget3245'),
  'trade must wrap final 3245 target handler');
assert.ok(trade.includes('handleInteractionTarget3245=function(cell)'),
  'trade final target override missing');
assert.ok(trade.includes('handleInteractionTarget3244=handleInteractionTarget3245'),
  'compatibility alias must follow final handler');
assert.ok(!trade.includes('const baseHandleInteractionTarget03714=handleInteractionTarget3244'),
  'obsolete 3244-only target hook must stay removed');

// Map port snap must feed the final handler.
assert.ok(trade.includes('handleInteractionTarget3245(port)'),
  'port snap must feed the final target handler');
assert.ok(trade.includes('function handleSeaTradeTarget03716'),'commercial target resolver missing');
assert.ok(trade.includes('const reason=seaTradeTargetReason03711(from,cell)'),'commercial validation missing');
assert.ok(trade.includes('const r=createPlayerSeaRoute0370(from,cell)'),'map target must reuse proven list-era route creation');
assert.ok(trade.includes('cancelInteractionMode3245()'),'successful route must cancel final interaction mode');

// Creation path remains the proven route engine.
assert.ok(trade.includes('function createPlayerSeaRoute0370(from,to)'),'player route creator missing');
assert.ok(trade.includes('let r=createSeaRoute0370(0,b,from,to,false,true)'),'player route must call common sea route engine');
assert.ok(trade.includes("const full=findSeaPathCells3270(s,g)"),'continuous maritime pathfinding missing');
assert.ok(trade.includes('routes.push(r);markTradeDirty0370()'),'route persistence/cache insertion missing');
assert.ok(trade.includes('saveGame3212();renderSystems3220();needsRender=true'),'player route must save and render');

assert.ok(index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>')||index.includes('v0.37.19</title>')||index.includes('v0.37.20</title>'),'visible version must be 0.37.16');
assert.ok(about.includes("version:'0.37.16'"),'about history must include 0.37.16');

console.log('HEXATEGOS 0.37.16 final-controller commercial route smoke: OK');
