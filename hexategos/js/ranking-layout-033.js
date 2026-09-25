// HEXATEGOS 0.33 · clasificación móvil, libre y redimensionable en 2 ejes
(() => {
  const panel = document.getElementById('rankPanel3213');
  const title = document.getElementById('rankDragHandle3303');
  const resize = document.getElementById('rankResize3303');
  const toggle = document.getElementById('rankToggle3302');
  if (!panel || !title || !resize) return;

  const POS_KEY = 'hexategos.ui.rank.pos.033';
  const SIZE_KEY = 'hexategos.ui.rank.size.033';

  const read = key => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  };
  const write = (key,value) => {
    try { localStorage.setItem(key,JSON.stringify(value)); } catch (_) {}
  };

  function limits(){
    return {
      margin:4,
      minW:132,
      minH:84,
      maxW:Math.max(132,innerWidth-8),
      maxH:Math.max(84,innerHeight-8)
    };
  }

  function applySaved(){
    if (panel.classList.contains('collapsed3302')) return;
    const lim = limits();
    const size = read(SIZE_KEY);
    if (size && Number.isFinite(size.w) && Number.isFinite(size.h)){
      panel.style.width = Math.min(lim.maxW,Math.max(lim.minW,size.w)) + 'px';
      panel.style.height = Math.min(lim.maxH,Math.max(lim.minH,size.h)) + 'px';
      panel.style.maxWidth = 'none';
      panel.style.maxHeight = 'none';
    }

    const pos = read(POS_KEY);
    if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)){
      const r=panel.getBoundingClientRect();
      const x=Math.min(Math.max(lim.margin,pos.x),Math.max(lim.margin,innerWidth-r.width-lim.margin));
      const y=Math.min(Math.max(lim.margin,pos.y),Math.max(lim.margin,innerHeight-r.height-lim.margin));
      panel.style.left=x+'px';
      panel.style.top=y+'px';
      panel.style.right='auto';
      panel.style.bottom='auto';
    }
  }

  function savePos(){
    const r=panel.getBoundingClientRect();
    write(POS_KEY,{x:r.left,y:r.top});
  }
  function saveSize(){
    const r=panel.getBoundingClientRect();
    write(SIZE_KEY,{w:r.width,h:r.height});
  }

  // Capture-phase handlers replace the old drag/resize behaviour without
  // touching the ranking renderer itself.
  let move=null;
  title.addEventListener('pointerdown',e=>{
    if (e.target.closest('button')) return;
    if (e.button !== undefined && e.button !== 0) return;

    const r=panel.getBoundingClientRect();
    move={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};

    panel.style.left=r.left+'px';
    panel.style.top=r.top+'px';
    panel.style.width=r.width+'px';
    panel.style.height=r.height+'px';
    panel.style.right='auto';
    panel.style.bottom='auto';
    panel.style.maxWidth='none';
    panel.style.maxHeight='none';
    panel.classList.add('rankMoving033');

    try{title.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  title.addEventListener('pointermove',e=>{
    if(!move || move.id!==e.pointerId)return;
    const r=panel.getBoundingClientRect(),lim=limits();
    const x=Math.min(Math.max(lim.margin,e.clientX-move.dx),Math.max(lim.margin,innerWidth-r.width-lim.margin));
    const y=Math.min(Math.max(lim.margin,e.clientY-move.dy),Math.max(lim.margin,innerHeight-r.height-lim.margin));
    panel.style.left=x+'px';
    panel.style.top=y+'px';
    panel.style.right='auto';
    panel.style.bottom='auto';
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  const endMove=e=>{
    if(!move || (e.pointerId!==undefined && move.id!==e.pointerId))return;
    try{title.releasePointerCapture(move.id)}catch(_){}
    move=null;
    panel.classList.remove('rankMoving033');
    savePos();
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
  };
  title.addEventListener('pointerup',endMove,true);
  title.addEventListener('pointercancel',endMove,true);

  let sizing=null;
  resize.addEventListener('pointerdown',e=>{
    if(e.button!==undefined && e.button!==0)return;
    const r=panel.getBoundingClientRect();
    sizing={
      id:e.pointerId,
      startX:e.clientX,
      startY:e.clientY,
      w:r.width,
      h:r.height,
      x:r.left,
      y:r.top
    };

    panel.style.left=r.left+'px';
    panel.style.top=r.top+'px';
    panel.style.right='auto';
    panel.style.bottom='auto';
    panel.style.width=r.width+'px';
    panel.style.height=r.height+'px';
    panel.style.maxWidth='none';
    panel.style.maxHeight='none';
    panel.classList.add('rankSizing033');

    try{resize.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  resize.addEventListener('pointermove',e=>{
    if(!sizing || sizing.id!==e.pointerId)return;
    const lim=limits();
    const availableW=Math.max(lim.minW,innerWidth-sizing.x-lim.margin);
    const availableH=Math.max(lim.minH,innerHeight-sizing.y-lim.margin);
    const w=Math.min(availableW,Math.max(lim.minW,sizing.w+(e.clientX-sizing.startX)));
    const h=Math.min(availableH,Math.max(lim.minH,sizing.h+(e.clientY-sizing.startY)));

    panel.style.width=w+'px';
    panel.style.height=h+'px';
    panel.style.maxWidth='none';
    panel.style.maxHeight='none';
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  const endSize=e=>{
    if(!sizing || (e.pointerId!==undefined && sizing.id!==e.pointerId))return;
    try{resize.releasePointerCapture(sizing.id)}catch(_){}
    sizing=null;
    panel.classList.remove('rankSizing033');
    saveSize();
    savePos();
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
  };
  resize.addEventListener('pointerup',endSize,true);
  resize.addEventListener('pointercancel',endSize,true);

  // Recover the chosen geometry after expanding again.
  toggle?.addEventListener('click',()=>setTimeout(applySaved,0));

  addEventListener('resize',()=>{
    if(panel.classList.contains('collapsed3302'))return;
    applySaved();
    savePos();
    saveSize();
  },{passive:true});

  requestAnimationFrame(applySaved);
})();
