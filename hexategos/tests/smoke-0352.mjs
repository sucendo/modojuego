import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html');
const map=read('js/geopolitical-map-0352.js');
const css=read('css/geopolitical-map-0352.css');

assert.doesNotThrow(()=>new Function(map),'geopolitical-map-0352.js must parse');

assert.ok(map.includes("const MODE='geopolitics'"),'geopolitical mode constant missing');
assert.ok(map.includes("MAP_MODES3252.push(MODE)"),'geopolitical mode not registered');
assert.ok(map.includes("MAP_MODE_NAMES3252[MODE]=MODE_LABEL"),'map mode label missing');
assert.ok(map.includes('baseTerrainFill0352=terrainStrategicFill3247'),'map colour hook missing');
assert.ok(map.includes('baseInfra0352=drawInfrastructure3212'),'geopolitical overlay hook missing');
assert.ok(map.includes('drawInfluenceRing0352'),'sphere-of-influence ring missing');
assert.ok(map.includes("'RIVAL'"),'rival visualization missing');
assert.ok(map.includes("'CONTENCIÓN'"),'balance-of-power visualization missing');
assert.ok(map.includes("'TAPÓN'"),'buffer-state visualization missing');
assert.ok(map.includes('diplomaticRelation3300(focus,f)!==3'),'alliance visualization missing');
assert.ok(map.includes('Selecciona territorio de otro país'),'player-facing selection guidance missing');

assert.ok(map.includes('HexategosGeoMap0352'),'developer diagnostics API missing');
assert.ok(map.includes('debug:(enabled=true)'),'hidden debug toggle missing');
assert.ok(!index.includes('geoDebugBtn0352'),'developer diagnostics must have no public button');
assert.ok(!map.includes('setInterval('),'map layer must not add timers');
assert.ok(!map.includes('new MutationObserver('),'map layer must not add observers');

assert.ok(index.includes('css/geopolitical-map-0352.css'),'geopolitical map CSS not loaded');
assert.ok(index.includes('js/geopolitical-map-0352.js'),'geopolitical map JS not loaded');
assert.ok(index.indexOf('js/geopolitical-map-0352.js')>index.indexOf('js/geopolitics-035.js'),'map must load after geopolitical AI');
assert.ok(css.includes('@media(max-width:700px)'),'mobile layout missing');

console.log('HEXATEGOS 0.35.2 geopolitical map smoke: OK');
