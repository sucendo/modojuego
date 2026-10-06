import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/minor-polities-0357.js');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(js),'political entities module must parse');
assert.doesNotThrow(()=>new Function(about),'About module must parse');
assert.ok(js.includes("const BUILD='0.35.8'"),'0.35.8 build marker missing');
assert.ok(js.includes('unifiedRanking0358'),'unified ranking missing');
assert.ok(js.includes('data-minor0358'),'minor entities must appear in the same ranking');
assert.ok(js.includes('drawGlobeCapitalIcon3249(p[0],p[1],false,px*.93)'),'minor capitals must use the normal capital symbol');
assert.ok(js.includes('bootstrapVisible0358'),'existing-save bootstrap missing');
assert.ok(!js.includes('Mosaico político secundario'),'player-facing hierarchy disclosure remains');
assert.ok(js.includes("title.textContent='NACIONES'"),'setup still exposes primary/minor distinction');
assert.ok(js.includes('neutralizeLegacyName0358'),'legacy tier-revealing names are not neutralized');
assert.ok(index.includes('js/minor-polities-0357.js'),'political entities module not loaded');

console.log('HEXATEGOS 0.35.8 unified political entities smoke: OK');
