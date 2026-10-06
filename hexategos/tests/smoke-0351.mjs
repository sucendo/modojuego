import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html');
const about=read('js/about-0351.js');
const css=read('css/about-0351.css');

assert.ok(index.includes('id="landingAbout0351"'),'About button missing from landing');
assert.ok(index.includes('ACERCA DE…'),'About button label missing');
assert.ok(index.includes('css/about-0351.css'),'About stylesheet not loaded');
assert.ok(index.includes('js/about-0351.js'),'About script not loaded');
assert.ok(index.indexOf('landingOptions3305')<index.indexOf('landingAbout0351'),'About button must appear after Options');

assert.doesNotThrow(()=>new Function(about),'about-0351.js must parse');
for(const v of ['0.35.1','0.35.0','0.34.2','0.34.1','0.34.0','0.33 · Stable Rebuild 8','0.33 · Web Modular','Etapa previa'])
  assert.ok(about.includes(v),`history entry missing: ${v}`);

assert.ok(about.includes("e.key==='Escape'"),'Escape close missing');
assert.ok(about.includes('if(e.target===overlay)'),'outside-click close missing');
assert.ok(about.includes("role=\"dialog\""),'dialog semantics missing');
assert.ok(css.includes('@media(max-width:700px)'),'mobile styling missing');
assert.ok(!about.includes('setInterval('),'About panel must not add timers');
assert.ok(!about.includes('new MutationObserver('),'About panel must not instantiate observers');

console.log('HEXATEGOS 0.35.1 About smoke: OK');
