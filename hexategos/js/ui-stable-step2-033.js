// HEXATEGOS Stable Rebuild 2 · UI recuperada sin observers ni bucles periódicos.
(() => {
  'use strict';
  const RAIL_KEY='hexategos.stable2.rail.pos';
  const SETUP_KEY='hexategos.stable2.setup.pos';

  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};

  function viewport(){
    const vv=window.visualViewport;
    return {w:vv?.width||innerWidth,h:vv?.height||innerHeight,ox:vv?.offsetLeft||0,oy:vv?.offsetTop||0};
  }
  function clamp(el,x,y){
    const v=viewport(),r=el.getBoundingClientRect(),m=4;
    return {
      x:Math.min(Math.max(v.ox+m,x),Math.max(v.ox+m,v.ox+v.w-r.width-m)),
      y:Math.min(Math.max(v.oy+m,y),Math.max(v.oy+m,v.oy+v.h-r.height-m))
    };
  }
  function place(el,pos){
    if(!el||!pos||!Number.isFinite(pos.x)||!Number.isFinite(pos.y))return false;
    const p=clamp(el,pos.x,pos.y);
    el.style.setProperty('left',p.x+'px','important');
    el.style.setProperty('top',p.y+'px','important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('bottom','auto','important');
    el.style.setProperty('transform','none','important');
    el.classList.add('uiMovedStable2');
    return true;
  }
  function save(el,key){
    const r=el.getBoundingClientRect();write(key,{x:r.left,y:r.top});
  }

  // Rail unificado: un toque sobre un botón sigue siendo un toque. Solo se
  // convierte en arrastre al superar un umbral real de movimiento.
  const rail=document.getElementById('leftRail3306');
  if(rail){
    place(rail,read(RAIL_KEY));
    let p=null,suppress=false;
    rail.addEventListener('pointerdown',e=>{
      if(e.button!=null&&e.button!==0)return;
      const r=rail.getBoundingClientRect();
      p={id:e.pointerId,sx:e.clientX,sy:e.clientY,dx:e.clientX-r.left,dy:e.clientY-r.top,moved:false,limit:e.pointerType==='touch'?16:7};
    },true);
    rail.addEventListener('pointermove',e=>{
      if(!p||p.id!==e.pointerId)return;
      if(!p.moved){
        if(Math.hypot(e.clientX-p.sx,e.clientY-p.sy)<p.limit)return;
        p.moved=true;suppress=true;
        const r=rail.getBoundingClientRect();
        place(rail,{x:r.left,y:r.top});
        rail.classList.add('draggingStable2');
        try{rail.setPointerCapture(e.pointerId)}catch(_){}
      }
      place(rail,{x:e.clientX-p.dx,y:e.clientY-p.dy});
      e.preventDefault();e.stopPropagation();
    },true);
    const end=e=>{
      if(!p||(e.pointerId!=null&&p.id!==e.pointerId))return;
      const moved=p.moved,id=p.id;p=null;
      if(moved){
        try{rail.releasePointerCapture(id)}catch(_){}
        rail.classList.remove('draggingStable2');save(rail,RAIL_KEY);
        e.preventDefault?.();e.stopPropagation?.();
        setTimeout(()=>{suppress=false},0);
      }
    };
    rail.addEventListener('pointerup',end,true);
    rail.addEventListener('pointercancel',end,true);
    rail.addEventListener('click',e=>{
      if(!suppress)return;
      suppress=false;e.preventDefault();e.stopImmediatePropagation();
    },true);
  }

  // Nueva partida: movimiento y minimizado sin MutationObserver. La posición se
  // aplica únicamente cuando el usuario abre realmente el setup.
  const setup=document.getElementById('newGameSetup3302');
  const head=setup?.querySelector('.newGameSetupHead3302');
  const min=document.getElementById('setupMinimizeStep2');
  if(setup&&head&&min){
    const setMin=v=>{
      setup.classList.toggle('minimizedStable2',!!v);
      min.textContent=v?'+':'−';
      min.setAttribute('aria-label',v?'Ampliar panel':'Minimizar panel');
      min.title=v?'Ampliar panel':'Minimizar panel';
    };
    min.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();setMin(!setup.classList.contains('minimizedStable2'));
    });

    let drag=null;
    head.addEventListener('pointerdown',e=>{
      if(e.button!=null&&e.button!==0)return;
      if(e.target.closest('button'))return;
      const r=setup.getBoundingClientRect();
      drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
      place(setup,{x:r.left,y:r.top});setup.classList.add('draggingStable2');
      try{head.setPointerCapture(e.pointerId)}catch(_){}
      e.preventDefault();e.stopPropagation();
    });
    head.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      place(setup,{x:e.clientX-drag.dx,y:e.clientY-drag.dy});
      e.preventDefault();e.stopPropagation();
    });
    const end=e=>{
      if(!drag||(e.pointerId!=null&&drag.id!==e.pointerId))return;
      try{head.releasePointerCapture(drag.id)}catch(_){}
      drag=null;setup.classList.remove('draggingStable2');save(setup,SETUP_KEY);
    };
    head.addEventListener('pointerup',end);
    head.addEventListener('pointercancel',end);

    if(typeof beginNewGameSetup3302==='function'){
      const base=beginNewGameSetup3302;
      beginNewGameSetup3302=function(){
        const v=base.apply(this,arguments);setMin(false);
        requestAnimationFrame(()=>place(setup,read(SETUP_KEY)));
        return v;
      };
    }
  }

  function clampOpen(){
    if(rail?.classList.contains('uiMovedStable2')) place(rail,read(RAIL_KEY));
    if(setup?.classList.contains('open3302')&&setup.classList.contains('uiMovedStable2')) place(setup,read(SETUP_KEY));
  }
  addEventListener('resize',clampOpen,{passive:true});
  if(window.visualViewport) visualViewport.addEventListener('resize',clampOpen,{passive:true});

  window.HEXATEGOS_STABLE_REBUILD='2';
})();
