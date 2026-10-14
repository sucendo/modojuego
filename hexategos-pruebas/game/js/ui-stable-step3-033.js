// HEXATEGOS Stable Rebuild 3 · diálogos movibles sin MutationObserver ni timers periódicos.
(() => {
  'use strict';

  const configs = [
    {
      panel: document.getElementById('gameMenu3306'),
      handle: document.querySelector('#gameMenu3306 .gameMenuHead3306'),
      openClass: 'open3306',
      key: 'hexategos.stable3.gameMenu.pos'
    },
    {
      panel: document.getElementById('systemsPanel3213'),
      handle: document.querySelector('#systemsPanel3213 .sysHead3213'),
      openClass: 'open',
      key: 'hexategos.stable3.systems.pos'
    }
  ].filter(c => c.panel && c.handle);

  const read = key => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  };
  const write = (key,value) => {
    try { localStorage.setItem(key,JSON.stringify(value)); }
    catch (_) {}
  };

  function viewport(){
    const vv=window.visualViewport;
    return {
      w:vv?.width || innerWidth,
      h:vv?.height || innerHeight,
      ox:vv?.offsetLeft || 0,
      oy:vv?.offsetTop || 0
    };
  }

  function clearPosition(panel){
    panel.classList.remove('uiMovedStable3','draggingStable3');
    ['left','right','top','bottom','transform'].forEach(p=>panel.style.removeProperty(p));
  }

  function center(panel){
    clearPosition(panel);
  }

  function place(panel,x,y){
    const v=viewport(),r=panel.getBoundingClientRect(),m=4;
    const w=r.width || panel.offsetWidth || 1;
    const h=r.height || panel.offsetHeight || 1;
    const minX=v.ox+m,minY=v.oy+m;
    const maxX=Math.max(minX,v.ox+v.w-w-m);
    const maxY=Math.max(minY,v.oy+v.h-h-m);
    const px=Math.min(Math.max(minX,x),maxX);
    const py=Math.min(Math.max(minY,y),maxY);

    panel.style.setProperty('left',px+'px','important');
    panel.style.setProperty('top',py+'px','important');
    panel.style.setProperty('right','auto','important');
    panel.style.setProperty('bottom','auto','important');
    panel.style.setProperty('transform','none','important');
    panel.classList.add('uiMovedStable3');
  }

  function applySaved(cfg){
    const pos=read(cfg.key);
    if(!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)){
      center(cfg.panel);
      return;
    }
    place(cfg.panel,pos.x,pos.y);
  }

  function save(cfg){
    const r=cfg.panel.getBoundingClientRect();
    write(cfg.key,{x:r.left,y:r.top});
  }

  function onOpen(cfg){
    // Solo se ejecuta cuando el propio usuario abre el diálogo.
    requestAnimationFrame(()=>applySaved(cfg));
  }

  configs.forEach(cfg=>{
    let drag=null;

    cfg.handle.addEventListener('pointerdown',e=>{
      if(e.button!=null && e.button!==0)return;
      if(e.target.closest('button'))return;

      const r=cfg.panel.getBoundingClientRect();
      drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
      place(cfg.panel,r.left,r.top);
      cfg.panel.classList.add('draggingStable3');

      try{cfg.handle.setPointerCapture(e.pointerId)}catch(_){}
      e.preventDefault();
      e.stopPropagation();
    });

    cfg.handle.addEventListener('pointermove',e=>{
      if(!drag || drag.id!==e.pointerId)return;
      place(cfg.panel,e.clientX-drag.dx,e.clientY-drag.dy);
      e.preventDefault();
      e.stopPropagation();
    });

    const end=e=>{
      if(!drag || (e.pointerId!=null && drag.id!==e.pointerId))return;
      const id=drag.id;
      drag=null;
      try{cfg.handle.releasePointerCapture(id)}catch(_){}
      cfg.panel.classList.remove('draggingStable3');
      save(cfg);
      e.preventDefault?.();
      e.stopPropagation?.();
    };
    cfg.handle.addEventListener('pointerup',end);
    cfg.handle.addEventListener('pointercancel',end);
  });

  const gameCfg=configs.find(c=>c.panel.id==='gameMenu3306');
  const systemsCfg=configs.find(c=>c.panel.id==='systemsPanel3213');

  // Abrir/cerrar: se envuelven las funciones del núcleo, sin observar cambios de DOM.
  if(gameCfg && typeof openGameMenu3306==='function'){
    const baseOpen=openGameMenu3306;
    openGameMenu3306=function(){
      const v=baseOpen.apply(this,arguments);
      onOpen(gameCfg);
      return v;
    };
  }
  if(gameCfg && typeof closeGameMenu3306==='function'){
    const baseClose=closeGameMenu3306;
    closeGameMenu3306=function(){
      const v=baseClose.apply(this,arguments);
      gameCfg.panel.classList.remove('draggingStable3');
      return v;
    };
  }

  if(systemsCfg && typeof openSystems3220==='function'){
    const baseOpen=openSystems3220;
    openSystems3220=function(){
      const v=baseOpen.apply(this,arguments);
      onOpen(systemsCfg);
      return v;
    };
  }
  if(systemsCfg && typeof closeSystems3220==='function'){
    const baseClose=closeSystems3220;
    closeSystems3220=function(){
      const v=baseClose.apply(this,arguments);
      systemsCfg.panel.classList.remove('draggingStable3');
      return v;
    };
  }

  // Algunos handlers del núcleo guardan la referencia de función en el momento
  // de asignarla. Los actualizamos para que todos pasen por la misma capa segura.
  const gameBtn=document.getElementById('gameMenuBtn3306');
  if(gameBtn && gameCfg){
    gameBtn.onclick=e=>{
      e.stopPropagation();
      gameCfg.panel.classList.contains('open3306') ? closeGameMenu3306() : openGameMenu3306();
    };
  }
  const gameClose=document.getElementById('gameMenuClose3306');
  if(gameClose)gameClose.onclick=()=>closeGameMenu3306();

  const systemsBtn=document.getElementById('systemsBtn3213');
  if(systemsBtn)systemsBtn.onclick=()=>openSystems3220(typeof sysTab3220!=='undefined'?sysTab3220:'dip');
  const systemsClose=document.getElementById('systemsClose3213');
  if(systemsClose)systemsClose.onclick=()=>closeSystems3220();

  // Posición de recuperación compartida con el botón ⌖ de Sistemas.
  // La posición se establece explícitamente y se persiste mediante el
  // mismo gestor de arrastre, en vez de borrar estilos y dejar que varios
  // selectores CSS resuelvan el centrado de manera distinta.
  function recenterPanelStable3(panelId){
    const cfg=configs.find(c=>c.panel.id===panelId);
    if(!cfg)return false;
    const p=cfg.panel;
    const v=viewport(),r=p.getBoundingClientRect();
    const w=r.width||p.offsetWidth||1,h=r.height||p.offsetHeight||1;
    const x=v.ox+(v.w-w)/2;
    const y=v.oy+(v.h-h)/2;
    place(p,x,y);
    save(cfg);
    return true;
  }
  window.HexategosStablePanels033={
    recenter:recenterPanelStable3
  };

  // Reencuadre solo ante un resize real; no hay observers ni intervalos.
  function clampOpen(){
    for(const cfg of configs){
      if(!cfg.panel.classList.contains(cfg.openClass))continue;
      const pos=read(cfg.key);
      if(pos)place(cfg.panel,pos.x,pos.y);
    }
  }
  addEventListener('resize',clampOpen,{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',clampOpen,{passive:true});

  window.HEXATEGOS_STABLE_REBUILD='3';
})();
