import fs from 'node:fs';
import assert from 'node:assert/strict';

const get=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=get('js/military-manpower-03874.js');
const trade=get('js/trade-logistics-0370.js');
const css=get('css/military-manpower-03875.css');
const html=get('index.html');
assert.doesNotThrow(()=>new Function(source),'military module JS syntax');
assert.match(html,/css\/military-manpower-03875\.css\?v=03875/);
assert.match(html,/js\/military-manpower-03874\.js\?v=03875/);
assert.match(html,/js\/trade-logistics-0370\.js\?v=03875/);
assert.match(trade,/recruitEquipmentAvailable03875:\(f=0\)=>/);
assert.match(trade,/return n&&n\.f===f\?Math\.max\(0,Number\(n\.stock\[4\]\)\|\|0\):0/);
assert.match(source,/id="milSlider03875" data-mil-slider03875 type="range"/);
assert.match(source,/id="milExact03875" data-mil-exact03875 type="number"/);
assert.match(source,/data-mil-mode03875="recruit"/);
assert.match(source,/data-mil-mode03875="demob"/);
assert.match(source,/updatePanelValues03875/);
assert.match(source,/document\.activeElement!==exact/,'keep input focus and cursor stable during updates');
assert.match(source,/async function confirmMilitaryAction03875/);
assert.match(source,/amount>current/,'recheck real maximum after confirmation');
assert.doesNotMatch(source,/data-mobil03874="25"/,'old fixed actions must no longer be displayed');
assert.doesNotMatch(source,/setInterval\(|setTimeout\(|MutationObserver/,'must not create extra polling');
assert.match(css,/touch-action:pan-y/);
assert.match(css,/focus-visible/);
const section=(first,last)=>{
  const a=source.indexOf(first),b=source.indexOf(last,a+first.length);
  assert(a>=0&&b>a,'missing actual block '+first);
  return source.slice(a,b);
};

// Run exact production functions from the module under several resource
// and troop constraint combinations; never duplicate game formulas in tests.
let capitalStock=1.2;
const tradeApi={recruitEquipmentAvailable03875:()=>capitalStock};
const number=x=>Number.isFinite(Number(x))?Number(x):0;
const functions=section('  function capitalEquipment03875(){',
  '  function chooseAmount03875(v){');
const {militaryLimit03875,capitalEquipment03875}=new Function(
  'window','number','uiMode03875','status','UNIT_GOLD','UNIT_EQUIP',
  functions+'\nreturn {militaryLimit03875,capitalEquipment03875};'
)({HexategosTradeLogistics0370:tradeApi},number,'recruit',()=>null,.42,.012);
const s={reserve:31,deployed:25,room:130,queue:5,gold:60};
assert.equal(militaryLimit03875('recruit',s),95,'max from actual available capital equipment minus pending orders');
assert.equal(militaryLimit03875('demob',s),31,'demobilisation limit is free reserve only');
capitalStock=3;
assert.equal(militaryLimit03875('recruit',s),130-5,'free soldier capacity minus pending orders');
capitalStock=0;
assert.equal(militaryLimit03875('recruit',s),0,'cannot order equipment not in actual capital');
capitalStock=20;
assert.equal(militaryLimit03875('recruit',{...s,gold:1,queue:0}),2,'cash also caps new recruits');
assert.equal(militaryLimit03875('recruit',{...s,room:0}),0,'army cap is enforced');
assert.equal(militaryLimit03875('demob',{...s,reserve:0}),0,'deployed soldiers can never be demobilised');
assert.equal(capitalEquipment03875(),20);

const notices=[],actions=[],saved=[];
let live=true;
const win={HexategosDialogs03851:{confirm:async(...args)=>{notices.push(args);return true}}};
const confirmBlock=section('  async function confirmMilitaryAction03875(mode,amount){',
  '  host?.addEventListener(');
const controls=new Function('window','fmt','UNIT_GOLD','UNIT_EQUIP',
  'militaryLimit03875','status','live','request','demobilize','saveGame3212','toast',
  'let uiAmount03875=32;\n'+confirmBlock+
  '\nreturn {confirmMilitaryAction03875,amount:()=>uiAmount03875};')(
  win,String,.42,.012,militaryLimit03875,
  ()=>({...s,room:60,queue:0,gold:100,reserve:31}),
  ()=>live,
  (f,amount)=>{actions.push(['recruit',f,amount]);return true},
  (f,amount)=>{actions.push(['demob',f,amount]);return amount},
  ()=>{saved.push(true);return true},x=>notices.push(x)
);
capitalStock=15;
assert.equal(await controls.confirmMilitaryAction03875('recruit',22),true);
assert.deepEqual(actions[0],['recruit',0,22]);
assert.match(notices[0][0],/22 soldados/);
assert.match(notices[0][0],/9\.24 oro/);
assert.match(notices[0][0],/0\.264 de material militar/);
assert.equal(saved.length,1,'confirmed changes saved immediately');
assert.equal(controls.amount(),0,'successful order clears selection');
assert.equal(await controls.confirmMilitaryAction03875('demob',12),true);
assert.deepEqual(actions[1],['demob',0,12]);
assert.equal(saved.length,2);

win.HexategosDialogs03851.confirm=async()=>false;
assert.equal(await controls.confirmMilitaryAction03875('recruit',10),false,'declining confirmation makes no changes');
assert.equal(actions.length,2);
win.HexategosDialogs03851.confirm=async()=>{
  capitalStock=0;return true;
};
assert.equal(await controls.confirmMilitaryAction03875('recruit',10),false,
 'equipment exhaustion during confirmation must prevent recruiting');
assert.equal(actions.length,2,'stale confirmation never mutates the army');
live=false;
assert.equal(await controls.confirmMilitaryAction03875('demob',5),false,'no changes after ending game');

console.log('HEXATEGOS 0.38.75: touch slider + exact input, dynamic gold/equipment/queue caps, deployed-safe demob, modal confirmation, stale resource revalidation and save PASS');
