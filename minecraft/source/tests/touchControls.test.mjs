import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTouchControls } from '../scripts/touchControls.js';

class Element {
  listeners=new Map(); style={}; dataset={}; hidden=false; children=new Map();
  addEventListener(type,fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);}
  dispatchEvent(event){for(const fn of this.listeners.get(event.type)||[])fn(event);}
  fire(type,props={}){this.dispatchEvent({type,preventDefault(){},stopPropagation(){},...props});}
  append(child){this.child=child;}
  setAttribute(){}
  setPointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0,width:120,height:120};}
  set innerHTML(value){
    for(const action of ['jump','action','use','tool','inventory','menu']){
      const button=new Element();button.dataset.touch=action;
      this.children.set(`[data-touch="${action}"]`,button);
    }
  }
  querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Element());return this.children.get(selector);}
  querySelectorAll(){return [...this.children.values()].filter(e=>e.dataset.touch);}
}
function harness(coarse){
  const doc=new Element(),win=new Element();
  doc.body=new Element();doc.body.classList={toggle(){}};
  doc.createElement=()=>new Element();doc.getElementById=id=>doc.querySelector(id);
  win.matchMedia=()=>({matches:coarse});
  globalThis.document=doc;globalThis.window=win;
  const controls=new Element();controls.isLocked=false;
  let nativeLocks=0,nativeUnlocks=0;
  controls.lock=()=>nativeLocks++;controls.unlock=()=>nativeUnlocks++;
  const player={controls,maxSpeed:5,input:{x:0,z:0},camera:{rotation:{x:0,y:0,reorder(){}}},onMouseDown(){},onKeyDown(){},selectPickaxe(){},openInventory(){controls.unlock();}};
  const canvas=new Element(),orbit={enabled:true};
  setupTouchControls(player,canvas,orbit);
  return {doc,win,player,controls,canvas,orbit,root:doc.body.child,native:()=>[nativeLocks,nativeUnlocks]};
}

test('mobile play starts without pointer lock and pauses through the same control events',()=>{
  const h=harness(true);let locks=0,unlocks=0;
  h.controls.addEventListener('lock',()=>locks++);h.controls.addEventListener('unlock',()=>unlocks++);
  h.controls.lock();
  assert.deepEqual(h.native(),[0,0]);assert.equal(h.controls.isLocked,true);
  assert.equal(h.root.hidden,false);assert.equal(h.orbit.enabled,false);assert.equal(locks,1);
  const stick=h.root.querySelector('#touch-stick');
  stick.fire('pointerdown',{pointerId:1,clientX:60,clientY:12});
  h.canvas.fire('pointerdown',{pointerType:'touch',pointerId:2,clientX:200,clientY:100});
  h.canvas.fire('pointermove',{pointerId:2,clientX:220,clientY:90});
  assert.equal(h.player.input.z,5);assert.equal(h.player.camera.rotation.y,-.08);
  h.root.querySelector('[data-touch="inventory"]').fire('pointerdown',{pointerId:3});
  assert.equal(h.controls.isLocked,false);assert.equal(h.player.input.z,0);
  assert.equal(h.root.hidden,true);assert.equal(h.orbit.enabled,true);assert.equal(unlocks,1);
  h.controls.lock();h.win.fire('blur');assert.equal(h.controls.isLocked,false);
});

test('desktop keeps native pointer lock until the user actually touches the screen',()=>{
  const h=harness(false);h.controls.lock();h.controls.unlock();
  assert.deepEqual(h.native(),[1,1]);assert.equal(h.root.hidden,true);
  h.doc.fire('pointerdown',{pointerType:'touch'});h.controls.lock();
  assert.deepEqual(h.native(),[1,1]);assert.equal(h.controls.isLocked,true);
  h.doc.hidden=true;h.doc.fire('visibilitychange');
  assert.equal(h.controls.isLocked,false);
});
