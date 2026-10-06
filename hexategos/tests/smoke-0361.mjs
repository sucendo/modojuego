import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ai=read('js/universal-polities-0359.js');
const index=read('index.html');

assert.doesNotThrow(()=>new Function(ai),'0.36.1 universal polity module must parse');
assert.ok(ai.includes("const BUILD='0.36.1'"),'0.36.1 build marker missing');
assert.ok(ai.includes('cellContext3244=function'),'dynamic polity territory context bridge missing');
assert.ok(ai.includes('ownerSummary3244=function'),'dynamic polity ownership label bridge missing');
assert.ok(ai.includes('buildContextActions3244=function'),'context actions integration missing');
assert.ok(ai.includes("action3244('attack','Atacar'"),'occupied dynamic territory must expose Attack');
assert.ok(ai.includes("action3244('diplomacy','Diplomacia'"),'dynamic polity diplomacy action missing');
assert.ok(ai.includes('openModal3244=function'),'context modal bridge missing');
assert.ok(ai.includes('data-value="1">Comercio'),'trade action missing');
assert.ok(ai.includes('data-value="0">Paz'),'peace action missing');
assert.ok(ai.includes('data-value="-1">Guerra'),'war action missing');
assert.ok(ai.includes('data-value="2">No agresión'),'non-aggression action missing');
assert.ok(ai.includes('data-value="3">Alianza'),'alliance action missing');
assert.ok(ai.includes('createVirtualFront0359'),'dynamic polity front creation missing');
assert.ok(ai.includes('frontTick3230=function'),'dynamic polity front execution missing');
assert.ok(ai.includes('captureVirtualFrontCell0359'),'dynamic polity front combat missing');
assert.ok(index.includes('js/universal-polities-0359.js'),'0.36.1 module not loaded');

console.log('HEXATEGOS 0.36.1 contextual political integration smoke: OK');
