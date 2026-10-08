import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const game=read('js/game.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(trade),'trade-logistics-0370.js must parse');
assert.ok(versionAtLeast(trade,'0.37.2'),'module version must be 0.37.2 or a compatible successor');
assert.ok(trade.includes("const TRAFFIC_ZOOM=2.15")||trade.includes("const TRAFFIC_ZOOM=25"),'terrestrial traffic zoom threshold missing');
assert.ok(trade.includes('playerTrafficColor0372'),'player-colored terrestrial traffic helper missing');
assert.ok(trade.includes('landRouteTrafficColor0372')||trade.includes('factionTrafficColor0378'),'land-route nation color helper missing');
assert.ok(trade.includes("ctx.fillStyle=playerTrafficColor0372()")||trade.includes("ctx.fillStyle=factionTrafficColor0378(d.faction)"),'domestic traffic must use owning nation color');
assert.ok(trade.includes("r.type==='land'&&(r.a===0||r.b===0)")||trade.includes('routeDotFaction0378'),'land trade traffic nation identity missing');
assert.ok(trade.includes('const baseDrawFleets0372=drawFleetsSea3261'),'patrol route visual wrapper missing');
assert.ok(trade.includes("g.order!=='patrol'"),'patrol-only route handling missing');
assert.ok(trade.includes('g.route=null;g.routePos=0'),'patrol route must be completely hidden');
assert.ok(game.includes("ctx.lineWidth=Math.max(.70,.98*Math.sqrt(zoom))"),'roads must be slightly thinner');
assert.ok(versionAtLeast(index,'0.37.2'),'visible version must be compatible with 0.37.2 or later');

console.log('HEXATEGOS 0.37.2 traffic visibility + patrol route smoke: OK');
