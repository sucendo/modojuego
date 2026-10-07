import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(trade),'trade-logistics-0370.js must parse');
assert.ok(trade.includes("const BUILD='0.37.1'")||trade.includes("const BUILD='0.37.2'"),'trade logistics build must include 0.37.1 or a compatible successor');
assert.ok(trade.includes("const TRAFFIC_ZOOM=2.55")||trade.includes("const TRAFFIC_ZOOM=2.15")||trade.includes("const TRAFFIC_ZOOM=25"),'domestic traffic zoom threshold missing');
assert.ok(trade.includes('domesticRoadTraffic0371'),'cached domestic road traffic missing');
assert.ok(trade.includes('rebuildDomesticTraffic0371'),'domestic traffic cache rebuild missing');
assert.ok(trade.includes('projectedAlongCells0371'),'smooth traffic interpolation missing');
assert.ok(trade.includes("x.b===0?'Comercio interior'"),'own-port maritime option label missing');
assert.ok(trade.includes("(a!==b&&!tradeRelation0370(a,b))"),'domestic sea routes must bypass foreign treaty requirement');
assert.ok(trade.includes("const visualPath=[from,...sampled,to]"),'maritime route must terminate at the actual ports');
assert.ok(trade.includes("if(r.a!==r.b&&!tradeRelation0370(r.a,r.b))"),'domestic route must remain economically active without self diplomacy');
assert.ok(trade.includes('domesticWanted=Math.min(2,Math.floor(own.length/2))'),'AI domestic maritime route planning missing');
assert.ok(trade.includes('buildLocalPatrolRoute03719'),'visible local naval patrol loop missing');
assert.ok(trade.includes('startInterceptExcursion0371'),'enemy-zone interception excursion missing');
assert.ok(trade.includes("g.interceptReturn0371=outward.slice().reverse()"),'interception return path reuse missing');
assert.ok(trade.includes('navalPathPermit0371'),'naval pathfinding budget missing');
assert.ok(trade.includes("diplomaticRelation3300(a,b)===-1"),'naval hostility must follow real war state');
assert.ok(index.includes('v0.37.1</title>')||index.includes('v0.37.2</title>')||index.includes('v0.37.3</title>')||index.includes('v0.37.4</title>')||index.includes('v0.37.5</title>')||index.includes('v0.37.6</title>')||index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>')||index.includes('v0.37.19</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.18</title>')||index.includes('v0.37.19</title>'),'visible version must include 0.37.1 or a compatible successor');

console.log('HEXATEGOS 0.37.1 domestic traffic + visible naval movement smoke: OK');
