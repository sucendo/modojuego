import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scrollCode=read('js/dialog-scroll-03818.js');
const messageCode=read('js/ui-stable-step8-033.js');
const systemsCode=read('js/systems-hub-03851.js');
const html=read('index.html');
assert.doesNotThrow(()=>new Function(scrollCode),'scroll stability script syntax');
assert.doesNotThrow(()=>new Function(messageCode),'message script syntax');
assert.match(html,/v0\.38\.18<\/title>/);
assert.match(html,/js\/dialog-scroll-03818\.js\?v=\d+/);
assert.match(html,/js\/ui-stable-step8-033\.js\?v=\d+/);
assert.match(html,/js\/systems-hub-03851\.js\?v=\d+/);
assert.ok(systemsCode.includes('focus({preventScroll:true})'),'embassy input focus must not scroll automatically');

const host={scrollTop:92},main={scrollTop:34},panel={
  scrollTop:11,addEventListener(){},classList:{contains:c=>c==='open'},
  querySelector:s=>s==='.sysMain0385'?main:null
};
const doc={getElementById:id=>id==='systemsPanel3213'?panel:
  id==='sysContent3213'?host:null};
const apiWindow={};
const setup="let sysTab3220='dip',renderSystems3220=function(){host.scrollTop=0;main.scrollTop=0;panel.scrollTop=0;return 'updated';};"+
  scrollCode+"return {render:renderSystems3220,tab:v=>{sysTab3220=v},api:window.HexategosDialogScroll03818};";
const state=new Function('document','window','host','main','panel','requestAnimationFrame',setup)(doc,apiWindow,host,main,panel,cb=>cb());
assert.equal(state.render(),'updated');
assert.deepEqual([host.scrollTop,main.scrollTop,panel.scrollTop],[92,34,11],
  'scroll must stay still during a regular Systems rerender');
host.scrollTop=59;main.scrollTop=20;panel.scrollTop=6;
state.tab('eco');state.render();
assert.deepEqual([host.scrollTop,main.scrollTop,panel.scrollTop],[0,0,0],
  'first opening another tab must start from the top');
host.scrollTop=110;main.scrollTop=9;panel.scrollTop=1;
state.tab('dip');state.render();
assert.deepEqual([host.scrollTop,main.scrollTop,panel.scrollTop],[59,20,6],
  'returning to diplomacy must restore its previous scroll');
state.tab('eco');state.render();
assert.deepEqual([host.scrollTop,main.scrollTop,panel.scrollTop],[110,9,1],
  'Commerce/Economy scroll must be separate from Diplomacy');
assert.ok(state.api.savedTabs().includes('eco')&&state.api.savedTabs().includes('dip'));

const begin=messageCode.indexOf('  function focusCurrentMessage(){');
const end=messageCode.indexOf('  const baseRender=renderSystems3220;',begin);
assert.ok(begin>0&&end>begin,'message navigation function missing');
const focusBody=messageCode.slice(begin,end);
const queued=[];let navigated=0,animation=null;
const target={classList:{add(){}},scrollIntoView(opts){navigated++;animation=opts}};
const focusDocument={getElementById:()=>({contains:e=>e===target}),querySelector:()=>target};
const focusSetup="let focusMessageKey='notice-12';"+focusBody+"return {run:focusCurrentMessage,key:()=>focusMessageKey};";
const focusTest=new Function('requestAnimationFrame','document','CSS','setTimeout',focusSetup)(
  callback=>queued.push(callback),focusDocument,{escape:s=>s},()=>{}
);
focusTest.run();focusTest.run();focusTest.run();
assert.equal(queued.length,1,'old notice must not schedule scroll after each rerender');
assert.equal(focusTest.key(),'','the notification navigation request must be consumed');
queued[0]();
assert.equal(navigated,1,'explicit VER should navigate just once');
assert.equal(animation.behavior,'auto','automatic smooth scroll should be removed');
focusTest.run();assert.equal(queued.length,1,'another tick must not navigate again');
console.log('HEXATEGOS 0.38.18 dialog scroll stays fixed across refresh/tab changes; VER focuses exactly once: OK');
