import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const js=fs.readFileSync(new URL('../js/about-0351.js',import.meta.url),'utf8');
const recorded=[];
const button={setAttribute(){},addEventListener(type,cb){recorded.push(type)}};
const document={
  getElementById(id){return id==='landingAbout0351'?button:null},
  addEventListener(type,cb){recorded.push(type)}
};
const window={};
vm.runInNewContext(js,{window,document,console:{info(){}},requestAnimationFrame(){}});
const history=window.HexategosAbout0351?.history;
assert.ok(Array.isArray(history)&&history.length>=65,'keep full historical changelog');
assert.deepEqual([...history.slice(0,5).map(x=>x.version)],
 ['0.38.93','0.38.92','0.38.91','0.38.77','0.38.75'],
 'new releases ordered newest to oldest');
assert.equal(history.filter(x=>x.current).length,1,'only one CURRENT badge');
assert.equal(history[0].current,true,'latest release is CURRENT');
assert.ok(history.some(x=>x.version==='0.38.18'&&!x.current),'keep old version without CURRENT');
assert.ok(history.some(x=>x.version==='0.35.1'),'preserve entire historical timeline');
for(const entry of history) {
 assert.ok(entry.title&&entry.summary&&entry.changes?.length,'every release has useful details');
}
assert.match(js,/esc0351\(HISTORY\[0\]\.version\)/,'visible title must derive from actual version');
assert.doesNotMatch(js,/versión 0\.37\.3/,'no stale visible version');
assert.ok(recorded.includes('click')&&recorded.includes('keydown'),'retain About open and close');
console.log('HEXATEGOS About 0.38.93: accurate current label, 5 new milestones, full history, heading, interactions PASS');
