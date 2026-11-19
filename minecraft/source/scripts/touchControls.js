import { TouchInput } from './touchInput.js';
import { t, onLanguageChange } from './i18n.js';

export function setupTouchControls(player, canvas, orbitControls) {
  const input=new TouchInput();
  const controls=player.controls;
  const nativeLock=controls.lock.bind(controls), nativeUnlock=controls.unlock.bind(controls);
  let touchMode=window.matchMedia('(pointer: coarse)').matches;
  let repeat=null;
  const root=document.createElement('div');
  root.id='touch-controls'; root.hidden=true;
  root.innerHTML=`<div id="touch-stick" role="group"><span></span></div>
    <div class="touch-actions">
      <button type="button" data-touch="jump"></button>
      <button type="button" data-touch="action"></button>
      <button type="button" data-touch="use"></button>
      <button type="button" data-touch="tool"></button>
    </div>
    <div class="touch-top">
      <button type="button" data-touch="inventory"></button>
      <button type="button" data-touch="menu"></button>
    </div><div class="touch-look-hint"></div>`;
  document.body.append(root);
  const stick=root.querySelector('#touch-stick'), thumb=stick.querySelector('span');
  const labels={jump:'touchJump',action:'touchAction',use:'touchUse',tool:'touchTool',inventory:'touchInventory',menu:'touchMenu'};
  const translate=()=>{
    for(const [action,key] of Object.entries(labels))root.querySelector(`[data-touch="${action}"]`).textContent=t(key);
    stick.setAttribute('aria-label',t('touchMove'));
    root.querySelector('.touch-look-hint').textContent=t('touchLook');
  };
  translate();onLanguageChange(translate);
  const applyMove=()=>{
    player.input.x=input.x*player.maxSpeed;
    player.input.z=input.forward*player.maxSpeed;
    thumb.style.transform=`translate(${input.x*34}px,${-input.forward*34}px)`;
  };
  const stop=()=>{input.reset();applyMove();clearInterval(repeat);repeat=null;};
  const show=()=>{
    root.hidden=!(touchMode&&controls.isLocked);
    document.body.classList.toggle('touch-playing',!root.hidden);
    orbitControls.enabled=!touchMode || !controls.isLocked;
  };
  controls.lock=()=>{
    if(!touchMode)return nativeLock();
    if(controls.isLocked)return;
    player.camera.rotation.reorder('YXZ');
    controls.isLocked=true;controls.dispatchEvent({type:'lock'});show();
  };
  controls.unlock=()=>{
    if(!touchMode)return nativeUnlock();
    if(!controls.isLocked)return;
    stop();controls.isLocked=false;controls.dispatchEvent({type:'unlock'});show();
  };
  controls.addEventListener('lock',show);
  controls.addEventListener('unlock',()=>{stop();show();});
  // Hybrid laptops may start with a mouse and subsequently use the touchscreen.
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch')touchMode=true;
  },true);
  const consume=e=>{e.preventDefault();e.stopPropagation();};
  stick.addEventListener('pointerdown',e=>{
    if(!controls.isLocked)return;consume(e);
    const box=stick.getBoundingClientRect();
    if(input.beginMove(e.pointerId,box.left+box.width/2,box.top+box.height/2)){
      stick.setPointerCapture(e.pointerId);input.move(e.pointerId,e.clientX,e.clientY);applyMove();
    }
  });
  stick.addEventListener('pointermove',e=>{if(input.move(e.pointerId,e.clientX,e.clientY)){consume(e);applyMove();}});
  const end=e=>{input.end(e.pointerId);applyMove();};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,end);
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch'||!controls.isLocked)return;consume(e);
    if(input.beginLook(e.pointerId,e.clientX,e.clientY))canvas.setPointerCapture(e.pointerId);
  },true);
  canvas.addEventListener('pointermove',e=>{
    const delta=input.look(e.pointerId,e.clientX,e.clientY);
    if(!delta||!controls.isLocked)return;consume(e);
    player.camera.rotation.y+=delta.yaw;
    player.camera.rotation.x=Math.max(-Math.PI/2+.01,Math.min(Math.PI/2-.01,player.camera.rotation.x+delta.pitch));
  },true);
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>input.end(e.pointerId),true);
  const act=button=>player.onMouseDown({button,shiftKey:false,preventDefault(){}});
  const actions={jump:()=>player.onKeyDown({code:'Space',repeat:false}),action:()=>act(0),use:()=>act(2),tool:()=>player.selectPickaxe(),inventory:()=>player.openInventory(),menu:()=>controls.unlock()};
  for(const button of root.querySelectorAll('button')){
    button.addEventListener('pointerdown',e=>{
      consume(e);if(!controls.isLocked)return;
      button.setPointerCapture(e.pointerId);
      const action=button.dataset.touch;actions[action]();
      if(action==='action'&&controls.isLocked){clearInterval(repeat);repeat=setInterval(()=>{if(controls.isLocked)act(0);},260);}
    });
    const release=()=>{if(button.dataset.touch==='action'){clearInterval(repeat);repeat=null;}};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release);
    // Keyboard and assistive technology can also activate the controls.
    button.addEventListener('click',e=>{if(e.detail===0&&controls.isLocked)actions[button.dataset.touch]();});
  }
  document.getElementById('toolbar').addEventListener('pointerdown',e=>{
    if(touchMode&&controls.isLocked)e.stopPropagation();
  });
  document.addEventListener('keydown',e=>{if(e.code==='Escape'&&touchMode&&controls.isLocked)controls.unlock();});
  window.addEventListener('blur',()=>{if(touchMode)controls.unlock();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&touchMode)controls.unlock();});
  return {input,stop};
}
