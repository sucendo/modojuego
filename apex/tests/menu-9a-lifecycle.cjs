/* Regression APEX 9A: the welcome overlay must not block race results on return. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const registry = new Map();
let observer;
class Classes {
  constructor(values=[]){this.items=new Set(values);}
  contains(x){return this.items.has(x);}
  add(x){if(!this.items.has(x)){this.items.add(x);this.changed();}}
  remove(x){if(this.items.delete(x))this.changed();}
  toggle(x,enable){if(enable)this.add(x);else this.remove(x);}
  changed(){if(observer?.active)queueMicrotask(()=>observer.callback());}
}
class Node {
  constructor(tag,id){this.tag=tag;this.id=id||'';this.classList=new Classes();this.hidden=false;this.children=[];this.onclick=null;this.attributes={};}
  set innerHTML(value){
    this.html=value;
    for(const match of value.matchAll(/id="([^"]+)"/g)){
      const child=new Node('button',match[1]);registry.set(child.id,child);this.children.push(child);
    }
  }
  setAttribute(key,value){this.attributes[key]=value;}
  prepend(node){this.children.unshift(node);if(node.id)registry.set(node.id,node);}
  insertBefore(node){this.children.push(node);if(node.id)registry.set(node.id,node);}
}
const menu=new Node('section','menu');
const tabs=new Node('div','menuModeTabs');
menu.classList.add('panel');
const quick=new Node('button','quickTab');quick.dataset={t:'quick'};quick.click=()=>{quick.clicked=(quick.clicked||0)+1;};
tabs.querySelector=()=>quick;
registry.set(menu.id,menu);registry.set(tabs.id,tabs);
const document={
  readyState:'complete',
  getElementById:id=>registry.get(id)||null,
  createElement:tag=>new Node(tag),
  querySelector:()=>null
};
class MutationObserver {
  constructor(callback){this.callback=callback;}
  observe(target,options){assert.equal(target,menu);assert.deepEqual(Array.from(options.attributeFilter),['class']);this.active=true;observer=this;}
}
const js=fs.readFileSync(path.join(__dirname,'..','js','menu-9a.js'),'utf8');
vm.runInNewContext(js,{document,MutationObserver,alert:()=>{}});
(async()=>{
  const welcome=registry.get('apex9aLanding');
  assert.ok(welcome,'Landing rendered');
  assert.equal(welcome.hidden,false,'Welcome screen initially visible');
  menu.classList.add('hidden');await new Promise(r=>setImmediate(r));
  assert.equal(welcome.hidden,true,'Welcome closes when game starts');
  menu.classList.remove('hidden');await new Promise(r=>setImmediate(r));
  assert.equal(welcome.hidden,true,'Returning from race does not block last results');
  assert.equal(menu.classList.contains('apex9aModes'),true);
  registry.get('apex9aBack').onclick();
  assert.equal(welcome.hidden,false,'User can still reopen the welcome page');
  registry.get('apex9aRace').onclick();
  assert.equal(welcome.hidden,true,'Choosing race reveals the original race configuration');
  assert.equal(quick.clicked,1,'Existing native tab is used');
  console.log('APEX 9A menu lifecycle: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
