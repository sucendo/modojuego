import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const visuals=read('js/national-visuals-0378.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(trade),'trade-logistics-0370.js must parse');
assert.doesNotThrow(()=>new Function(visuals),'national-visuals-0378.js must parse');

assert.ok(trade.includes('DOMESTIC_TRAFFIC_CELLS_PER_SECOND=.78'),'domestic constant speed missing');
assert.ok(trade.includes('LAND_TRADE_CELLS_PER_SECOND=.92'),'land trade constant speed missing');
assert.ok(trade.includes('SEA_TRADE_CELLS_PER_SECOND=.72'),'sea trade constant speed missing');
assert.ok(trade.includes('function tradeSpeedMultiplier03710'),'future technology speed hook missing');
assert.ok(trade.includes('HexategosTransportTechnology'),'future transport technology API hook missing');
assert.ok(trade.includes('function routeTravelPhase03710'),'distance-based commercial travel phase missing');
assert.ok(trade.includes('Number(r.distance)||visualLength'),'route distance must drive travel duration');
assert.ok(!trade.includes('now*.000055'),'legacy percentage-of-route speed must be removed');
assert.ok(trade.includes("r.type==='sea'?(zoom>32?4.40:3.70):(zoom>32?3.20:2.70)"),'commercial marker sizing missing');
assert.ok(trade.includes('zoom>32?2.20:1.85')||trade.includes('zoom>32?3.20:2.70'),'land commercial marker size not increased');
assert.ok(trade.includes('zoom>32?2.20:1.90')||trade.includes('zoom>32?3.20:2.60'),'domestic traffic marker size not increased');
assert.ok(trade.includes('g.route=null;g.routePos=0'),'legacy patrol route must be hidden');
assert.ok(visuals.includes("if(!g||g.order==='patrol')return null"),'national patrol route must be hidden');
assert.ok(!visuals.includes('oldRoute.slice(oldPos,oldPos+3)'),'patrol route segment must not be rendered by national layer');

assert.ok(versionAtLeast(index,'0.37.10'),'visible version must be compatible with 0.37.10 or later');
assert.ok(about.includes("version:'0.37.10'"),'about history must include 0.37.10');

console.log('HEXATEGOS 0.37.10 traffic size + constant commercial speed smoke: OK');
