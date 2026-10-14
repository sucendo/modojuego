// HEXATEGOS Stable Rebuild 5 · rail sin textos + ranking reconstruido.
// Sin observers, sin timers periódicos y sin modificar simulación/IA.
(() => {
  'use strict';
  const BUILD='5';
  const RANK_KEY='hexategos.stable5.rank.layout';
  const RANK_COLLAPSED_KEY='hexategos.stable5.rank.collapsed';

  // -----------------------------------------------------------------------
  // Rail: conserva las etiquetas accesibles y las usa como tooltip CSS.
  // -----------------------------------------------------------------------
  document.querySelectorAll('#leftRail3306 .railItem3306').forEach(item=>{
    const btn=item.querySelector('button');
    const label=item.querySelector('small');
    if(!btn||!label)return;
    const text=(label.textContent||btn.title||btn.getAttribute('aria-label')||'').trim();
    if(text){
      if(!btn.title)btn.title=text;
      if(!btn.getAttribute('aria-label'))btn.setAttribute('aria-label',text);
    }
  });

  // -----------------------------------------------------------------------
  // Ranking: clonamos el panel para eliminar TODOS los listeners históricos.
  // updateRanking3220() usa getElementById dinámicamente, por lo que seguirá
  // actualizando rankRows3213 en el panel nuevo sin tocar la lógica del juego.
  // -----------------------------------------------------------------------
  const oldPanel=document.getElementById('rankPanel3213');
  if(!oldPanel){ window.HEXATEGOS_STABLE_REBUILD=BUILD; return; }

  const panel=oldPanel.cloneNode(true);
  oldPanel.replaceWith(panel);
  panel.classList.add('rankRebuild5');
  panel.classList.remove('rankMoving033','rankSizing033','rankSizingStable4');

  const head=panel.querySelector('#rankDragHandle3303');
  const rows=panel.querySelector('#rankRows3213');
  const toggle=panel.querySelector('#rankToggle3302');
  const right=panel.querySelector('#rankResizeRight033');
  const bottom=panel.querySelector('#rankResizeBottom033');
  const corner=panel.querySelector('#rankResize3303');
  panel.querySelector('.rankMoveHint3303')?.remove();

  const read=()=>{
    try{return JSON.parse(localStorage.getItem(RANK_KEY)||'null')}catch(_){return null}
  };
  const write=()=>{
    try{localStorage.setItem(RANK_KEY,JSON.stringify(layout))}catch(_){}
  };

  function defaults(){
    const mobile=innerWidth<=760;
    const w=mobile?Math.min(210,Math.max(166,innerWidth*.40)):250;
    const h=mobile?Math.min(260,Math.max(145,innerHeight*.46)):310;
    return {x:Math.max(6,innerWidth-w-10),y:Math.max(6,(window.visualViewport?.offsetTop||0)+58),w,h};
  }

  let layout=read()||defaults();
  // One-time rollback for the short-lived compact experiment. Only browsers
  // that actually loaded that build carry this marker, so previous custom
  // layouts are left untouched.
  try{
    const compactKey='hexategos.stable5.rank.compact.v1';
    if(localStorage.getItem(compactKey)==='1'){
      const d=defaults(),oldW=Number(layout.w)||d.w,newW=Math.max(oldW,d.w);
      layout.x=(Number(layout.x)||d.x)-Math.max(0,newW-oldW);
      layout.w=newW;
      layout.h=Math.max(Number(layout.h)||d.h,d.h);
      localStorage.removeItem(compactKey);
      localStorage.setItem(RANK_KEY,JSON.stringify(layout));
    }
  }catch(_){}
  let collapsed=false;
  try{collapsed=localStorage.getItem(RANK_COLLAPSED_KEY)==='1'}catch(_){}

  function limits(){
    const vv=visualViewport;
    const ox=vv?.offsetLeft||0,oy=vv?.offsetTop||0,wv=vv?.width||innerWidth,hv=vv?.height||innerHeight;
    const mobile=wv<=760;
    return {
      ox,oy,wv,hv,m:5,
      minW:mobile?158:178,
      minH:mobile?100:112,
      maxW:Math.max(mobile?158:178,Math.min(600,wv-10)),
      maxH:Math.max(mobile?100:112,Math.min(760,hv-10))
    };
  }

  function normalize(){
    const L=limits();
    layout.w=Math.max(L.minW,Math.min(L.maxW,Number(layout.w)||defaults().w));
    layout.h=Math.max(L.minH,Math.min(L.maxH,Number(layout.h)||defaults().h));
    const actualW=collapsed?158:layout.w;
    const actualH=collapsed?34:layout.h;
    layout.x=Math.max(L.ox+L.m,Math.min(L.ox+L.wv-actualW-L.m,Number(layout.x)||L.ox+L.wv-actualW-10));
    layout.y=Math.max(L.oy+L.m,Math.min(L.oy+L.hv-actualH-L.m,Number(layout.y)||L.oy+58));
  }

  function syncLegacy(){
    try{
      if(typeof rankLayout3303!=='undefined'){
        rankLayout3303.x=layout.x;rankLayout3303.y=layout.y;
        rankLayout3303.w=layout.w;rankLayout3303.h=layout.h;
      }
      if(typeof rankCollapsed3302!=='undefined')rankCollapsed3302=collapsed;
    }catch(_){}
  }

  function apply(){
    normalize();
    panel.classList.toggle('collapsed3302',collapsed);
    panel.style.setProperty('left',Math.round(layout.x)+'px','important');
    panel.style.setProperty('top',Math.round(layout.y)+'px','important');
    panel.style.setProperty('right','auto','important');
    panel.style.setProperty('bottom','auto','important');
    if(!collapsed){
      panel.style.setProperty('width',Math.round(layout.w)+'px','important');
      panel.style.setProperty('height',Math.round(layout.h)+'px','important');
    }else{
      panel.style.removeProperty('width');
      panel.style.removeProperty('height');
    }
    if(toggle){
      toggle.textContent=collapsed?'＋':'−';
      toggle.setAttribute('aria-expanded',collapsed?'false':'true');
    }
    syncLegacy();
  }

  function save(){normalize();syncLegacy();write()}
  function setCollapsed(value){
    collapsed=!!value;
    try{localStorage.setItem(RANK_COLLAPSED_KEY,collapsed?'1':'0')}catch(_){}
    apply();save();
  }

  // Sustituimos las funciones globales de layout para que los antiguos
  // callbacks de resize que sí sobreviven llamen a la nueva implementación.
  try{applyRankLayout3303=apply}catch(_){}
  try{clampRankLayout3303=()=>{normalize();syncLegacy()}}catch(_){}
  try{saveRankLayout3303=save}catch(_){}
  try{keepRankOnScreen3303=()=>{const r=panel.getBoundingClientRect();layout.x=r.left;layout.y=r.top;if(!collapsed){layout.w=r.width;layout.h=r.height}apply();save()}}catch(_){}
  try{applyRankCollapsed3302=()=>apply()}catch(_){}

  // Cabecera = mover.
  let move=null;
  head?.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    if(e.button!=null&&e.button!==0)return;
    const r=panel.getBoundingClientRect();
    move={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
    panel.classList.add('rankMoving5');
    try{head.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();e.stopPropagation();
  });
  head?.addEventListener('pointermove',e=>{
    if(!move||move.id!==e.pointerId)return;
    layout.x=e.clientX-move.dx;layout.y=e.clientY-move.dy;
    apply();
    e.preventDefault();e.stopPropagation();
  });
  const finishMove=e=>{
    if(!move||(e.pointerId!=null&&move.id!==e.pointerId))return;
    const id=move.id;move=null;
    try{head.releasePointerCapture(id)}catch(_){}
    panel.classList.remove('rankMoving5');save();
    e.preventDefault?.();e.stopPropagation?.();
  };
  head?.addEventListener('pointerup',finishMove);
  head?.addEventListener('pointercancel',finishMove);

  // Resize desde derecha, abajo o esquina.
  function bindResize(handle,mode){
    if(!handle)return;
    let drag=null;
    handle.addEventListener('pointerdown',e=>{
      if(collapsed)return;
      if(e.button!=null&&e.button!==0)return;
      const r=panel.getBoundingClientRect();
      drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,w:r.width,h:r.height};
      panel.classList.add('rankSizing5');
      try{handle.setPointerCapture(e.pointerId)}catch(_){}
      e.preventDefault();e.stopPropagation();
    });
    handle.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      if(mode==='right'||mode==='corner')layout.w=drag.w+(e.clientX-drag.sx);
      if(mode==='bottom'||mode==='corner')layout.h=drag.h+(e.clientY-drag.sy);
      apply();
      e.preventDefault();e.stopPropagation();
    });
    const finish=e=>{
      if(!drag||(e.pointerId!=null&&drag.id!==e.pointerId))return;
      const id=drag.id;drag=null;
      try{handle.releasePointerCapture(id)}catch(_){}
      panel.classList.remove('rankSizing5');save();
      e.preventDefault?.();e.stopPropagation?.();
    };
    handle.addEventListener('pointerup',finish);
    handle.addEventListener('pointercancel',finish);
  }
  bindResize(right,'right');
  bindResize(bottom,'bottom');
  bindResize(corner,'corner');

  toggle?.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();setCollapsed(!collapsed);
  });
  head?.addEventListener('dblclick',e=>{
    if(e.target.closest('button'))return;
    setCollapsed(!collapsed);
  });

  // El scroll nunca debe mover el globo.
  panel.addEventListener('pointerdown',e=>e.stopPropagation());
  panel.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
  rows?.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});

  // Reencuadre sin bucles: solo cuando cambia el viewport.
  let resizeRAF=0;
  function onViewport(){
    if(resizeRAF)return;
    resizeRAF=requestAnimationFrame(()=>{resizeRAF=0;apply();save()});
  }
  addEventListener('resize',onViewport,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(onViewport,100),{passive:true});
  window.visualViewport?.addEventListener('resize',onViewport,{passive:true});

  // Nueva partida = clasificación limpia y bien colocada.
  const NEW_IDS=new Set(['landingNew3305','newGameBtn','new3230','endRestart3230']);
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('button');
    if(!b||!NEW_IDS.has(b.id))return;
    try{localStorage.removeItem(RANK_KEY);localStorage.removeItem(RANK_COLLAPSED_KEY)}catch(_){}
    layout=defaults();collapsed=false;apply();save();
  },true);

  apply();
  save();
  window.HexategosRankStable5={
    reset(){layout=defaults();collapsed=false;apply();save()},
    snapshot(){return {layout:{...layout},collapsed,rows:rows?.children.length||0}}
  };
  window.HEXATEGOS_STABLE_REBUILD=BUILD;
})();
