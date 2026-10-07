import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const game=read('js/game.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(trade),'trade-logistics-0370.js must parse');
assert.ok(trade.includes("const BUILD='0.37.2'"),'trade logistics build must be 0.37.2');
assert.ok(trade.includes("const TRAFFIC_ZOOM=2.15")||trade.includes("const TRAFFIC_ZOOM=25"),'terrestrial traffic zoom threshold missing');
assert.ok(trade.includes('playerTrafficColor0372'),'player-colored terrestrial traffic helper missing');
assert.ok(trade.includes('landRouteTrafficColor0372')||trade.includes('factionTrafficColor0378'),'land-route nation color helper missing');
assert.ok(trade.includes("ctx.fillStyle=playerTrafficColor0372()")||trade.includes("ctx.fillStyle=factionTrafficColor0378(d.faction)"),'domestic traffic must use owning nation color');
assert.ok(trade.includes("r.type==='land'&&(r.a===0||r.b===0)")||trade.includes('routeDotFaction0378'),'land trade traffic nation identity missing');
assert.ok(trade.includes('const baseDrawFleets0372=drawFleetsSea3261'),'patrol route visual wrapper missing');
assert.ok(trade.includes("g.order!=='patrol'"),'patrol-only route handling missing');
assert.ok(trade.includes('g.route=null;g.routePos=0'),'patrol route must be completely hidden');
assert.ok(game.includes("ctx.lineWidth=Math.max(.70,.98*Math.sqrt(zoom))"),'roads must be slightly thinner');
assert.ok(index.includes('v0.37.2</title>')||index.includes('v0.37.3</title>')||index.includes('v0.37.4</title>')||index.includes('v0.37.5</title>')||index.includes('v0.37.6</title>')||index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>')||index.includes('v0.37.9</title>')||index.includes('v0.37.10</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>')||index.includes('v0.37.11</title>')||index.includes('v0.37.12</title>')||index.includes('v0.37.13</title>')||index.includes('v0.37.14</title>')||index.includes('v0.37.15</title>')||index.includes('v0.37.16</title>')||index.includes('v0.37.17</title>'),'visible version must be 0.37.2 or compatible successor');

console.log('HEXATEGOS 0.37.2 traffic visibility + patrol route smoke: OK');
