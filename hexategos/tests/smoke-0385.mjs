import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/systems-hub-0385.js');
const css=read('css/systems-hub-0385.css');
const index=read('index.html');
const about=read('js/about-0351.js');

assert.doesNotThrow(()=>new Function(js),'Systems UI script parses');
assert.ok(versionAtLeast(index,'0.38.5'),'game version must be at least 0.38.5');
assert.ok(about.includes("version:'0.38.5'"),'changelog updated');
assert.ok(index.includes('css/systems-hub-0385.css'),'new stylesheet loaded');
assert.ok(index.includes('js/systems-hub-0385.js'),'new script loaded');
assert.ok(index.indexOf('js/systems-hub-0385.js')>index.indexOf('js/statecraft-0380.js'),
  'UI integration loaded after existing render hooks');
for(const tab of ['dip','eco','research','intel','naval'])
  assert.ok(index.includes('data-tab="'+tab+'"'),'existing tab id preserved '+tab);
assert.ok(index.includes('<div id="sysContent3213"></div>'),'system content ID preserved');
assert.ok(css.includes('font-size:13px!important'),'legibility overrides missing');
assert.ok(css.includes('repeat(3,minmax(0,1fr))'),'phone navigation missing');
assert.ok(css.includes('grid-template-areas:"head head" "nav main"'),'desktop layout missing');
assert.ok(css.includes('.systemsOptions0385 .sysTabs3213{display:none!important}'),
  'Options must remain distinct from Systems');
assert.ok(!/host\.innerHTML\s*=/.test(js),'redesign must preserve original content nodes');
assert.ok(!js.includes('setInterval('),'UI must not create periodic jobs');

class ClassList {
  constructor(values=[]){this.values=new Set(values)}
  contains(v){return this.values.has(v)}
  add(v){this.values.add(v)}
  remove(v){this.values.delete(v)}
  toggle(v,force){
    const on=force===undefined?!this.values.has(v):!!force;
    if(on)this.values.add(v);else this.values.delete(v);
    return on;
  }
}
class Element {
  constructor(tag='div',classes=[]){
    this.tagName=tag;this.classList=new ClassList(classes);
    this.children=[];this.dataset={};this.attrs={};this.events={};
    this.textContent='';this.titleChild=null;this.urgent=false;
  }
  querySelector(q){
    if(q===':scope > b')return this.titleChild;
    if(q.includes('.tradeManagerTitle03717'))return null;
    if(q.includes('data-message-key'))return this.urgent?this:null;
    return null;
  }
  querySelectorAll(){return []}
  setAttribute(k,v){this.attrs[k]=String(v)}
  removeAttribute(k){delete this.attrs[k]}
  addEventListener(k,fn){this.events[k]=fn}
  append(...els){this.children.push(...els)}
  insertBefore(el,at){
    const i=at?this.children.indexOf(at):0;
    this.children.splice(Math.max(0,i),0,el);
  }
}
const panel=new Element('div',['systemsHub0385']);
const content=new Element('div');
const header=new Element('b');
const navigation=['dip','eco','research','intel','naval'].map(t=>{
  const b=new Element('button');b.dataset.tab=t;return b;
});
panel.querySelector=q=>q==='.sysHead3213 b'?header:null;
panel.querySelectorAll=q=>q==='.sysTabs3213 button[data-tab]'?navigation:[];
const lookup={
  systemsPanel3213:panel,sysContent3213:content,
  systemsClose3213:new Element('button'),sysEyebrow0385:new Element('span'),
  sysSectionTitle0385:new Element('h2'),sysSectionDescription0385:new Element('p')
};
const document={
  getElementById:id=>lookup[id]||null,
  createElement:tag=>new Element(tag)
};
const makeBlocks=()=>Array.from({length:5},(_,i)=>{
  const b=new Element('div',['sysBlock3213']);
  b.titleChild=new Element('b');b.titleChild.textContent='Sección '+i;
  const existingAction=new Element('button');
  existingAction.addEventListener('click',()=>{});
  b.children=[b.titleChild,new Element('div'),existingAction];
  b.urgent=i===4;
  return b;
});
let registerCalls=0,baseChildren=[],baseRenders=0;
const ctx={
  document,window:{
    HexategosMovablePanels0353:{
      register:()=>{assert.ok(panel.classList.contains('open'),
        'draggable must be registered only while panel is visible');
        registerCalls++;return {panel};
      }
    }
  },
  console:{info(){},warn(error){throw error}},
  sysTab3220:'dip'
};
ctx.renderSystems3220=()=>{
  baseRenders++;
  content.children=makeBlocks();
  baseChildren=[...content.children];
};
ctx.openSystems3220=tab=>{
  ctx.sysTab3220=tab;
  panel.classList.add('open');
  ctx.renderSystems3220();
};
vm.runInNewContext(js,ctx,{timeout:5000});
assert.equal(registerCalls,0,'hidden panel must not be measured');
ctx.openSystems3220('dip');
assert.equal(registerCalls,0,'Stable3 alone manages Systems dragging; no duplicate listeners');
assert.equal(baseRenders,1,'original render still executes');
assert.ok(content.children.every((b,i)=>b===baseChildren[i]),
  'redesign must not replace any existing content block');
assert.ok(!content.children[0].classList.contains('isCollapsed0385'),
  'important primary block remains open');
assert.ok(!content.children[1].classList.contains('isCollapsed0385'),
  'important secondary block remains open');
assert.ok(content.children[2].classList.contains('isCollapsed0385'),
  'advanced block starts collapsed');
assert.ok(!content.children[4].classList.contains('isCollapsed0385'),
  'urgent diplomatic messages must never be hidden');
const action=content.children[2].children.at(-1);
assert.equal(typeof action.events.click,'function',
  'original underlying button listener must survive');
const toggle=content.children[2].children[0];
toggle.events.click();
assert.ok(!content.children[2].classList.contains('isCollapsed0385'),
  'expanded section opens on user click');
assert.equal(toggle.attrs['aria-expanded'],'true','expanded state is accessible');
ctx.renderSystems3220();
assert.ok(!content.children[2].classList.contains('isCollapsed0385'),
  'expanded state persists through content refresh');
ctx.openSystems3220('eco');
assert.equal(lookup.sysSectionTitle0385.textContent,'Economía y comercio',
  'section title follows existing tabs');
ctx.openSystems3220('settings');
assert.ok(panel.classList.contains('systemsOptions0385'),
  'Options uses independent single-column layout');
assert.equal(header.textContent,'OPCIONES','Options heading should update');
assert.equal(registerCalls,0,'reopening must not create a second drag manager');
console.log('HEXATEGOS 0.38.5 systems redesign smoke: OK');
