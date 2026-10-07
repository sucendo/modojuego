import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const css=read('css/trade-logistics-0370.css');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade logistics must parse');

assert.ok(trade.includes('function sortedOwnRoutes03717'),'own-route manager sorter missing');
assert.ok(trade.includes("routes.filter(r=>(r.a===0||r.b===0)&&r.status!=='closed')"),'manager must include all player routes');
assert.ok(trade.includes('for(const r of own)html+=renderTradeManagerRoute03717(r)'),'manager must render all routes without slice limit');
assert.ok(!trade.includes('for(const r of own.slice(0,12))'),'old 12-route economy limit must be removed');

assert.ok(trade.includes('function renderTradeManagerRoute03717'),'route-card renderer missing');
assert.ok(trade.includes('tradeRouteEndpointLabel03717(r.from)'),'route origin missing');
assert.ok(trade.includes('tradeRouteEndpointLabel03717(r.to)'),'route destination missing');
assert.ok(trade.includes('tradeRouteGoods03717(r)'),'route goods metric missing');
assert.ok(trade.includes('tradeRouteSupplyLabel03717(r)'),'domestic supply state missing');
assert.ok(trade.includes("Number(r.navalRisk||0).toFixed(1)"),'naval risk metric missing');

assert.ok(trade.includes('function focusTradeRoute03717'),'map focus action missing');
assert.ok(trade.includes('closeSystems3220'),'route focus must close systems');
assert.ok(trade.includes('cellLonLat3302(cell)'),'route focus must resolve geographic position');
assert.ok(trade.includes("rotateToGeo3243(p.lon,p.lat,r.type==='sea'?4.8:6.0)"),'route focus zoom/rotation missing');
assert.ok(trade.includes('function drawFocusedTradeRoute03717'),'route highlight renderer missing');
assert.ok(trade.includes('drawFocusedTradeRoute03717(C,R,cx,cy)'),'route highlight must be rendered even before traffic dots');
assert.ok(trade.includes('focusRoute:focusTradeRoute03717'),'route focus action API missing');
assert.ok(trade.includes('focusedRoute:()=>focusedTradeRoute03717'),'route focus diagnostic API missing');

assert.ok(css.includes('.tradeManager03717'),'trade manager styles missing');
assert.ok(css.includes('.tradeManagerRoute03717.focused03717'),'focused route style missing');
assert.ok(css.includes('.tradeRouteMetrics03717'),'route metrics layout missing');

assert.ok(index.includes('v0.37.17</title>'),'visible version must be 0.37.17');
assert.ok(about.includes("version:'0.37.17'"),'about history must include 0.37.17');

// 0.37.16 creation flow must remain intact.
assert.ok(trade.includes("beginTargetFromDialog3282('select_trade_route_target'"),'0.37.16 strict route selector must remain');
assert.ok(trade.includes('const baseHandleInteractionTarget03716=handleInteractionTarget3245'),'0.37.16 final target handler must remain');
assert.ok(trade.includes('const r=createPlayerSeaRoute0370(from,cell)'),'proven route creation must remain');

console.log('HEXATEGOS 0.37.17 trade route manager smoke: OK');
