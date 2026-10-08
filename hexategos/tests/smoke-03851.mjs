import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const ui=read('js/systems-hub-03851.js');
const old=read('js/systems-hub-0385.js');
const diplomacy=read('js/statecraft-0380.js');
const css=read('css/systems-hub-03851.css');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(ui),'new Systems UI syntax');
assert.doesNotThrow(()=>new Function(diplomacy),'diplomacy API syntax');
assert.ok(versionAtLeast(html,'0.38.5.2'),'game version must be at least 0.38.5.2');
assert.equal((html.match(/data-tab="(?:dip|eco|research|intel|military|naval)"/g)||[]).length,6);
assert.ok(html.includes('id="systemsRecenter03851"'));
assert.ok(html.includes('css/systems-hub-03851.css'));
assert.ok(html.indexOf('js/systems-hub-03851.js')>html.indexOf('js/systems-hub-0385.js'));
assert.ok(!old.includes('HexategosMovablePanels0353?.register'),'no competing drag handlers');
assert.ok(diplomacy.includes('requestEmbassyPlayer:'));
assert.ok(diplomacy.includes('embassyContacts:()=>'));
assert.ok(ui.includes('data-hub-action="embassy-toggle">Enviar embajada'));
assert.ok(ui.includes('answerEmbassyPlayer?.(embassySelected,true)'));
assert.ok(ui.includes('answerEmbassyPlayer?.(embassySelected,false)'));
assert.ok(ui.includes('data-hub-action="go-research"'));
assert.ok(ui.includes('nationApi()?.tech?.(0)'));
assert.ok(ui.includes('nationApi()?.reach?.(0)'));
assert.ok(ui.includes('tradeApi()?.openSeaTrade?.(maritimePort)'));
assert.ok(ui.includes('tradeApi()?.pickSeaOnMap?.(maritimePort)'));
assert.ok(ui.includes('tradeApi()?.focusRoute?.(Number(b.dataset.id))'));
assert.ok(ui.includes('tradeApi()?.closeRoute?.(Number(b.dataset.id))'));
assert.ok(ui.includes("function militaryCard()"));
assert.ok(ui.includes('data-hub-action="military-attack"'));
assert.ok(css.includes('overflow-y:auto!important'));
assert.ok(css.includes('repeat(2,minmax(0,1fr))'));
assert.ok(about.includes("version:'0.38.5.1'"));
assert.ok(!ui.includes('setInterval('),'no new timers');

class Node {
  constructor(){
    this.children=[];this.events={};this.dataset={};this.innerHTML='';
    this.scrollTop=0;this.hidden=false;this.value='';this.disabled=false;
  }
  addEventListener(k,fn){this.events[k]=fn}
  querySelector(){return null}
  querySelectorAll(){return []}
  prepend(el){this.children.unshift(el)}
  replaceChildren(...els){this.children=els}
}
const host=new Node(),panel=new Node();
const milTab=new Node();
panel.querySelector=s=>s.includes('data-tab="military"')?milTab:null;
const elements={
  systemsPanel3213:panel,sysContent3213:host,
  systemsRecenter03851:new Node(),
  attackBtn:{disabled:false,click(){}},
  fortBtn:{disabled:false,click(){}}
};
const document={
  getElementById:id=>elements[id]||null,
  createElement:()=>new Node(),
  createDocumentFragment:()=>new Node()
};
const window={
  HexategosStatecraft0380:{tech:()=>2,reach:()=>42},
  HexategosSystemsUI0385:{refresh(){}},
  HexategosTradeLogistics0370:{
    routes:()=>[{id:6,type:'sea',a:0,b:1,from:3,to:4,status:'active',lastValue:1.1}],
    resourceSummaryCached:()=>({coverage:[.2,.3,.4,.5,.6]})
  },
  HexategosDiplomacyNetwork3301:{targetsRef:()=>[1]}
};
const context={
  document,window,console:{info(){},warn(error){throw error}},
  toast(){},confirm:()=>true,
  started3230:true,
  ports3212:new Set([3]),owner6:new Int8Array([0,0,0,0,0]),
  placeDisplayName3271:c=>'Puerto '+c,
  troops3230:new Int16Array([95,10]),warCount3261:()=>1,
  selectedGameCell3230:()=>3,activeFactionCount3230:2,
  diplomaticRelation3300:()=>-1,factionName3230:f=>'Nación '+f,
  localStorage:{removeItem(){}},
  cities3212:new Set([3]),
  buildClassicActions3246:()=>[],classicAction3246:(id)=>({id}),
  handleContextAction3244(){},closeContextDialog3244(){},
  uiInteractionState3244:{contextData:null},
  sysTab3220:'dip',renderSystems3220(){},openSystems3220(){}
};
vm.runInNewContext(ui,context,{timeout:4000});
context.renderSystems3220();
assert.ok(host.children[0]?.innerHTML.includes('Enviar embajada'),
  'Diplomacy must show sending entry point');
context.sysTab3220='naval';host.replaceChildren();
context.renderSystems3220();
assert.ok(host.children[0]?.innerHTML.includes('Gestión de rutas comerciales marítimas'),
  'Naval must show route manager');
assert.ok(host.children[0]?.innerHTML.includes('Puerto 3 ↔ Puerto 4'),
  'Naval must list existing sea routes');
context.sysTab3220='military';context.renderSystems3220();
assert.ok(host.children[0]?.innerHTML.includes('Ejército y frentes'),
  'Militar tab must render');
assert.ok(host.children[0]?.innerHTML.includes('Operación terrestre'),
  'Militar tab must reuse military controls');
assert.equal(window.HEXATEGOS_VERSION,'0.38.5.2');
console.log('HEXATEGOS 0.38.5.1 Systems usability smoke: OK');
