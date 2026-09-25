// HEXATEGOS 0.33 · clasificación libre y redimensionable desde bordes/esquina
(() => {
  const panel = document.getElementById('rankPanel3213');
  const title = document.getElementById('rankDragHandle3303');
  const corner = document.getElementById('rankResize3303');
  const edgeRight = document.getElementById('rankResizeRight033');
  const edgeBottom = document.getElementById('rankResizeBottom033');
  const toggle = document.getElementById('rankToggle3302');
  if (!panel || !title || !corner) return;

  const POS_KEY='hexategos.ui.rank.pos.033';
  const SIZE_KEY='hexategos.ui.rank.size.033';

  const read=key=>{
    try{return JSON.parse(localStorage.getItem(key)||'null')}
    catch(_){return null}
  };
  const write=(key,value)=>{
    try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}
  };

  const limits=()=>({
    margin:4,
    minW:132,
    minH:92,
    maxW:Math.max(132,innerWidth-8),
    maxH:Math.max(92,innerHeight-8)
  });

  function place(x,y){
    const lim=limits();
    const r=panel.getBoundingClientRect();
    const px=Math.min(Math.max(lim.margin,x),Math.max(lim.margin,innerWidth-r.width-lim.margin));
    const py=Math.min(Math.max(lim.margin,y),Math.max(lim.margin,innerHeight-r.height-lim.margin));
    panel.style.setProperty('left',px+'px','important');
    panel.style.setProperty('top',py+'px','important');
    panel.style.setProperty('right','auto','important');
    panel.style.setProperty('bottom','auto','important');
  }

  function size(w,h){
    const lim=limits();
    const r=panel.getBoundingClientRect();
    const maxW=Math.max(lim.minW,innerWidth-r.left-lim.margin);
    const maxH=Math.max(lim.minH,innerHeight-r.top-lim.margin);
    const ww=Math.min(maxW,Math.max(lim.minW,w));
    const hh=Math.min(maxH,Math.max(lim.minH,h));
    panel.style.setProperty('width',ww+'px','important');
    panel.style.setProperty('height',hh+'px','important');
    panel.style.setProperty('max-width','none','important');
    panel.style.setProperty('max-height','none','important');
  }

  function savePos(){
    const r=panel.getBoundingClientRect();
    write(POS_KEY,{x:r.left,y:r.top});
  }
  function saveSize(){
    const r=panel.getBoundingClientRect();
    write(SIZE_KEY,{w:r.width,h:r.height});
  }

  function applySaved(){
    if(panel.classList.contains('collapsed3302'))return;
    const s=read(SIZE_KEY);
    if(s&&Number.isFinite(s.w)&&Number.isFinite(s.h))size(s.w,s.h);
    const p=read(POS_KEY);
    if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))place(p.x,p.y);
  }

  // Movimiento libre por cabecera.
  let move=null;
  title.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    if(e.button!==undefined&&e.button!==0)return;
    const r=panel.getBoundingClientRect();
    move={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
    panel.style.setProperty('width',r.width+'px','important');
    panel.style.setProperty('height',r.height+'px','important');
    place(r.left,r.top);
    panel.classList.add('rankMoving033');
    try{title.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  title.addEventListener('pointermove',e=>{
    if(!move||move.id!==e.pointerId)return;
    place(e.clientX-move.dx,e.clientY-move.dy);
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  const endMove=e=>{
    if(!move||(e.pointerId!==undefined&&move.id!==e.pointerId))return;
    try{title.releasePointerCapture(move.id)}catch(_){}
    move=null;
    panel.classList.remove('rankMoving033');
    savePos();
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
  };
  title.addEventListener('pointerup',endMove,true);
  title.addEventListener('pointercancel',endMove,true);

  // Redimensionado por derecha, abajo o esquina.
  function bindResize(handle,mode){
    if(!handle)return;
    let drag=null;

    handle.addEventListener('pointerdown',e=>{
      if(e.button!==undefined&&e.button!==0)return;
      const r=panel.getBoundingClientRect();
      drag={
        id:e.pointerId,
        sx:e.clientX,
        sy:e.clientY,
        w:r.width,
        h:r.height,
        x:r.left,
        y:r.top
      };
      place(r.left,r.top);
      panel.style.setProperty('width',r.width+'px','important');
      panel.style.setProperty('height',r.height+'px','important');
      panel.style.setProperty('max-width','none','important');
      panel.style.setProperty('max-height','none','important');
      panel.classList.add('rankSizing033');
      try{handle.setPointerCapture(e.pointerId)}catch(_){}
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);

    handle.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      const dw=e.clientX-drag.sx;
      const dh=e.clientY-drag.sy;
      const w=(mode==='right'||mode==='corner')?drag.w+dw:drag.w;
      const h=(mode==='bottom'||mode==='corner')?drag.h+dh:drag.h;
      size(w,h);
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);

    const end=e=>{
      if(!drag||(e.pointerId!==undefined&&drag.id!==e.pointerId))return;
      try{handle.releasePointerCapture(drag.id)}catch(_){}
      drag=null;
      panel.classList.remove('rankSizing033');
      saveSize();
      savePos();
      e.preventDefault?.();
      e.stopImmediatePropagation?.();
    };
    handle.addEventListener('pointerup',end,true);
    handle.addEventListener('pointercancel',end,true);
  }

  bindResize(edgeRight,'right');
  bindResize(edgeBottom,'bottom');
  bindResize(corner,'corner');

  toggle?.addEventListener('click',()=>setTimeout(applySaved,0));

  addEventListener('resize',()=>{
    if(panel.classList.contains('collapsed3302'))return;
    const r=panel.getBoundingClientRect();
    size(r.width,r.height);
    place(r.left,r.top);
    saveSize();
    savePos();
  },{passive:true});

  requestAnimationFrame(applySaved);
})();
