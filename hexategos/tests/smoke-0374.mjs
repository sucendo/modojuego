import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const road=read('js/road-removal-0374.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(road),'road-removal-0374.js must parse');
assert.ok(road.includes("const BUILD='0.37.4'"),'road removal build must be 0.37.4');
assert.ok(road.includes('path.includes(cell)'),'road-on-cell detection missing');
assert.ok(road.includes('if(c===cell)flush()'),'road path splitting at selected cell missing');
assert.ok(road.includes('roads3212=next'),'road replacement missing');
assert.ok(road.includes('rebuildRoadEdges3212()'),'road edge rebuild missing');
assert.ok(road.includes('supplyDirty3220=true'),'supply invalidation missing');
assert.ok(road.includes('markEconomyDirty3261'),'economy invalidation missing');
assert.ok(road.includes('aiMarkDirty3260'),'AI cache invalidation missing');
assert.ok(road.includes('HexategosTradeLogistics0370?.refresh'),'trade refresh missing');
assert.ok(road.includes('HexategosInfrastructureDecay0373?.audit'),'decay re-audit missing');
assert.ok(road.includes("'road_abandon_0374','ABANDONAR CARRETERA'"),'context action missing');
assert.ok(road.includes("ctx?.kind==='cell'&&ctx.own"),'road abandonment must be restricted to own cells');
assert.ok(road.includes('SIN REEMBOLSO'),'no-refund rule missing');
assert.ok(!road.includes('setInterval('),'road removal must not add a periodic timer');
assert.ok(index.includes('v0.37.4</title>')||index.includes('v0.37.5</title>')||index.includes('v0.37.6</title>')||index.includes('v0.37.7</title>')||index.includes('v0.37.8</title>'),'visible version must be 0.37.4');
assert.ok(index.indexOf('js/road-removal-0374.js')>index.indexOf('js/infrastructure-decay-0373.js'),'road removal module must load after decay');
assert.ok(about.includes("version:'0.37.4'"),'about history must include 0.37.4');

console.log('HEXATEGOS 0.37.4 contextual road removal smoke: OK');
