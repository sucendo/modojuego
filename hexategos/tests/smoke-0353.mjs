import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html');
const movable=read('js/movable-panels-0353.js');
const map=read('js/geopolitical-map-0352.js');
const css=read('css/movable-panels-0353.css');

assert.doesNotThrow(()=>new Function(movable),'movable-panels-0353.js must parse');
assert.ok(movable.includes('HexategosMovablePanels0353'),'movable panel API missing');
assert.ok(movable.includes('register0353'),'register helper missing');
assert.ok(movable.includes('localStorage'),'position persistence missing');
assert.ok(movable.includes('visualViewport'),'viewport clamping missing');
assert.ok(movable.includes("document.addEventListener('pointerdown'"),'pointer dragging missing');
assert.ok(movable.includes("document.addEventListener('pointermove'"),'pointer move missing');
assert.ok(movable.includes("document.addEventListener('pointerup'"),'pointer release missing');
assert.ok(!movable.includes('setInterval('),'movable layer must not add timers');
assert.ok(!movable.includes('new MutationObserver('),'movable layer must not add observers');

assert.ok(map.includes("HexategosMovablePanels0353?.register(panel,'.geoPanelHead0352','geopolitical-map')"),
  'geopolitical panel must re-register after redraw');
assert.ok(index.includes('css/movable-panels-0353.css'),'movable CSS missing');
assert.ok(index.includes('js/movable-panels-0353.js'),'movable JS missing');
assert.ok(index.indexOf('js/movable-panels-0353.js')>index.indexOf('js/geopolitical-map-0352.js'),
  'movable layer must load after geopolitical map');
assert.ok(css.includes('[data-hex-drag-handle-0353]'),'drag-handle styling missing');

console.log('HEXATEGOS 0.35.3 movable panels smoke: OK');
