// HEXATEGOS 0.33 · diálogos del leftRail centrados por defecto y movibles
(() => {
  const configs = [
    {
      panel: document.getElementById('gameMenu3306'),
      handle: document.querySelector('#gameMenu3306 .gameMenuHead3306'),
      openClass: 'open3306',
      key: 'hexategos.ui.gameMenu.pos.033'
    },
    {
      panel: document.getElementById('systemsPanel3213'),
      handle: document.querySelector('#systemsPanel3213 .sysHead3213'),
      openClass: 'open',
      key: 'hexategos.ui.systemsPanel.pos.033'
    }
  ].filter(x => x.panel && x.handle);

  const read = key => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  };
  const write = (key,value) => {
    try { localStorage.setItem(key,JSON.stringify(value)); } catch (_) {}
  };

  function center(panel){
    panel.classList.remove('uiMoved033');
    panel.style.removeProperty('left');
    panel.style.removeProperty('right');
    panel.style.removeProperty('top');
    panel.style.removeProperty('bottom');
    panel.style.removeProperty('transform');
  }

  function place(panel,x,y){
    const r=panel.getBoundingClientRect();
    const margin=4;
    const w=r.width || panel.offsetWidth || 1;
    const h=r.height || panel.offsetHeight || 1;
    const px=Math.min(Math.max(margin,x),Math.max(margin,innerWidth-w-margin));
    const py=Math.min(Math.max(margin,y),Math.max(margin,innerHeight-h-margin));

    panel.style.setProperty('left',px+'px','important');
    panel.style.setProperty('top',py+'px','important');
    panel.style.setProperty('right','auto','important');
    panel.style.setProperty('bottom','auto','important');
    panel.style.setProperty('transform','none','important');
    panel.classList.add('uiMoved033');
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

  configs.forEach(cfg => {
    let drag=null;
    let wasOpen=cfg.panel.classList.contains(cfg.openClass);

    cfg.handle.addEventListener('pointerdown',e=>{
      if(e.target.closest('button'))return;
      if(e.button!==undefined && e.button!==0)return;

      const r=cfg.panel.getBoundingClientRect();
      drag={
        id:e.pointerId,
        dx:e.clientX-r.left,
        dy:e.clientY-r.top
      };

      place(cfg.panel,r.left,r.top);
      cfg.panel.classList.add('dragging033');

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
      if(!drag || (e.pointerId!==undefined && drag.id!==e.pointerId))return;
      try{cfg.handle.releasePointerCapture(drag.id)}catch(_){}
      drag=null;
      cfg.panel.classList.remove('dragging033');
      save(cfg);
      e.preventDefault?.();
      e.stopPropagation?.();
    };

    cfg.handle.addEventListener('pointerup',end);
    cfg.handle.addEventListener('pointercancel',end);

    const obs=new MutationObserver(()=>{
      const open=cfg.panel.classList.contains(cfg.openClass);
      if(open && !wasOpen){
        requestAnimationFrame(()=>applySaved(cfg));
      }
      wasOpen=open;
    });
    obs.observe(cfg.panel,{attributes:true,attributeFilter:['class']});

    if(wasOpen) requestAnimationFrame(()=>applySaved(cfg));
  });

  addEventListener('resize',()=>{
    configs.forEach(cfg=>{
      if(!cfg.panel.classList.contains(cfg.openClass))return;
      const pos=read(cfg.key);
      if(pos) {
        place(cfg.panel,pos.x,pos.y);
        save(cfg);
      } else {
        center(cfg.panel);
      }
    });
  },{passive:true});
})();
