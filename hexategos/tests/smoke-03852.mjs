import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const stable=read('js/ui-stable-step3-033.js');
const sys=read('js/systems-hub-03851.js');
const css=read('css/systems-hub-03851.css');
const html=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(stable),'drag controller syntax');
assert.doesNotThrow(()=>new Function(sys),'Systems controller syntax');
assert.ok(html.includes('v0.38.5.2</title>'),'build not bumped');
assert.ok(html.includes('css/systems-hub-03851.css?v=03852'),'CSS cache not refreshed');
assert.ok(html.includes('js/systems-hub-03851.js?v=03852'),'UI cache not refreshed');
assert.ok(html.includes('js/ui-stable-step3-033.js?v=03852'),'drag controller cache not refreshed');
assert.ok(about.includes("version:'0.38.5.2'"),'changelog not updated');
assert.ok(css.includes('#systemsPanel3213.systemsHub0385:not(.uiMovedStable3){'),'default position override missing');
assert.ok(css.includes('top:50%!important;'),'default centered vertical position missing');
assert.ok(css.includes('transform:translate(-50%,-50%)!important;'),'default centered transform missing');
assert.ok(css.includes('#systemsPanel3213.systemsHub0385.uiMovedStable3{'),'dragged state override missing');
assert.ok(stable.includes('window.HexategosStablePanels033'),'recenter API missing');
assert.ok(sys.includes("HexategosStablePanels033?.recenter?.('systemsPanel3213')"),'button not wired to controller');
assert.ok(!sys.includes("localStorage.removeItem('hexategos.stable3.systems.pos')"),'reset must not remove saved position and leave conflicting CSS');
assert.ok(!sys.includes('HexategosMovablePanels0353?.register'),'no second drag controller permitted');
assert.ok(!sys.includes('setInterval('),'no new timers');

const a=stable.indexOf('function recenterPanelStable3(');
const b=stable.indexOf('window.HexategosStablePanels033=',a);
assert.ok(a>=0&&b>a,'recenter function missing');
const slice=stable.slice(a,b);
const testRecenter=new Function('configs','viewport','place','save',
  slice+'return recenterPanelStable3("systemsPanel3213");');
function check(width,height,panelWidth,panelHeight){
  const p={
    id:'systemsPanel3213',
    getBoundingClientRect:()=>({width:panelWidth,height:panelHeight})
  };
  let rect=null,saved=null;
  const cfg={panel:p};
  const result=testRecenter([cfg],()=>({w:width,h:height,ox:0,oy:0}),
    (el,x,y)=>{rect={x,y};},()=>{saved={...rect};});
  assert.equal(result,true);
  assert.ok(rect.x>=0&&rect.y>=0,'recenter left or top out of view');
  assert.ok(rect.x+panelWidth<=width,'recenter right edge out of view');
  assert.ok(rect.y+panelHeight<=height,'recenter lower edge out of view');
  assert.deepEqual(saved,rect,'restored location must persist');
  return rect;
}
const desktop=check(1440,900,900,720);
const mobile=check(390,844,378,700);
assert.deepEqual(desktop,{x:270,y:90});
assert.deepEqual(mobile,{x:6,y:72});
console.log('HEXATEGOS 0.38.5.2 Systems recenter smoke: OK');
