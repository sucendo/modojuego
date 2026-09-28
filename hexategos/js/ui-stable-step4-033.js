// HEXATEGOS Stable Rebuild 4 · recuperación segura de UI móvil/zoom/layout.
// Sin MutationObserver, sin setInterval y sin tocar la simulación.
(() => {
  'use strict';

  const ZOOM_POS_KEY='hexategos.stable4.zoom.pos';
  const ZOOM_VISIBLE_KEY='hexategos.ui.zoomCtl.visible.033';
  const RAIL_KEY='hexategos.stable2.rail.pos';
  const SETUP_KEY='hexategos.stable2.setup.pos';
  const GAME_KEY='hexategos.stable3.gameMenu.pos';
  const SYSTEMS_KEY='hexategos.stable3.systems.pos';

  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};

  function viewport(){
    const vv=window.visualViewport;
    return {w:vv?.width||innerWidth,h:vv?.height||innerHeight,ox:vv?.offsetLeft||0,oy:vv?.offsetTop||0};
  }
  function clamp(el,x,y){
    const v=viewport(),r=el.getBoundingClientRect(),m=4;
    const maxX=Math.max(v.ox+m,v.ox+v.w-(r.width||1)-m);
    const maxY=Math.max(v.oy+m,v.oy+v.h-(r.height||1)-m);
    return {x:Math.min(Math.max(v.ox+m,x),maxX),y:Math.min(Math.max(v.oy+m,y),maxY)};
  }
  function place(el,pos,cls='uiMovedStable4'){
    if(!el||!pos||!Number.isFinite(pos.x)||!Number.isFinite(pos.y))return false;
    const p=clamp(el,pos.x,pos.y);
    el.style.setProperty('left',p.x+'px','important');
    el.style.setProperty('top',p.y+'px','important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('bottom','auto','important');
    el.style.setProperty('transform','none','important');
    el.classList.add(cls);
    return true;
  }
  function save(el,key){
    if(!el)return;
    const r=el.getBoundingClientRect();
    write(key,{x:r.left,y:r.top});
  }

  // -------------------------------------------------------------------------
  // Zoom: visible/ocultable desde Opciones y Ajustes + posición movible.
  // -------------------------------------------------------------------------
  const zoom=document.getElementById('zoomCtl3232');
  const zoomHandle=document.getElementById('zoomRead3232');
  const landingZoom=document.getElementById('landingZoomCtl033');

  function zoomVisible(){
    try{
      const v=localStorage.getItem(ZOOM_VISIBLE_KEY);
      return v===null ? true : v==='1';
    }catch(_){return true}
  }
  function setZoomVisible(show,source){
    const value=!!show;
    try{localStorage.setItem(ZOOM_VISIBLE_KEY,value?'1':'0')}catch(_){}
    zoom?.classList.toggle('zoomCtlHiddenStable4',!value);
    if(landingZoom && source!==landingZoom)landingZoom.checked=value;
    const sys=document.getElementById('settingsZoomCtlStable4');
    if(sys && source!==sys)sys.checked=value;
  }
  if(landingZoom){
    landingZoom.checked=zoomVisible();
    landingZoom.addEventListener('change',()=>setZoomVisible(landingZoom.checked,landingZoom));
  }
  setZoomVisible(zoomVisible());

  if(zoom&&zoomHandle){
    place(zoom,read(ZOOM_POS_KEY));
    zoomHandle.title='Arrastra para mover el control de zoom';
    let drag=null;
    zoomHandle.addEventListener('pointerdown',e=>{
      if(e.button!=null&&e.button!==0)return;
      const r=zoom.getBoundingClientRect();
      drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
      place(zoom,{x:r.left,y:r.top});
      zoom.classList.add('draggingStable4');
      try{zoomHandle.setPointerCapture(e.pointerId)}catch(_){}
      e.preventDefault();e.stopPropagation();
    });
    zoomHandle.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      place(zoom,{x:e.clientX-drag.dx,y:e.clientY-drag.dy});
      e.preventDefault();e.stopPropagation();
    });
    const end=e=>{
      if(!drag||(e.pointerId!=null&&drag.id!==e.pointerId))return;
      const id=drag.id;drag=null;
      try{zoomHandle.releasePointerCapture(id)}catch(_){}
      zoom.classList.remove('draggingStable4');
      save(zoom,ZOOM_POS_KEY);
      e.preventDefault?.();e.stopPropagation?.();
    };
    zoomHandle.addEventListener('pointerup',end);
    zoomHandle.addEventListener('pointercancel',end);
  }

  function mountZoomSetting(){
    if(typeof sysTab3220!=='undefined' && sysTab3220!=='settings')return;
    const host=document.getElementById('sysContent3213');
    if(!host||host.querySelector('#settingsZoomCtlStable4'))return;
    const row=document.createElement('label');
    row.className='uiSettingRowStable4';
    row.innerHTML='<input id="settingsZoomCtlStable4" type="checkbox"> Mostrar control de zoom';
    host.appendChild(row);
    const cb=row.querySelector('input');
    cb.checked=zoomVisible();
    cb.addEventListener('change',()=>setZoomVisible(cb.checked,cb));
  }
  if(typeof renderSystems3220==='function'){
    const baseRenderSystems=renderSystems3220;
    renderSystems3220=function(){
      const v=baseRenderSystems.apply(this,arguments);
      mountZoomSetting();
      return v;
    };
  }

  // -------------------------------------------------------------------------
  // Ranking: resize desde borde derecho y borde inferior, manteniendo el mismo
  // estado rankLayout3303 del núcleo estable.
  // -------------------------------------------------------------------------
  const rank=document.getElementById('rankPanel3213');
  function bindRankEdge(id,mode){
    const h=document.getElementById(id);
    if(!h||!rank)return;
    let drag=null;
    h.addEventListener('pointerdown',e=>{
      if(typeof rankCollapsed3302!=='undefined'&&rankCollapsed3302)return;
      if(e.button!=null&&e.button!==0)return;
      const r=rank.getBoundingClientRect();
      drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,w:r.width,h:r.height};
      try{h.setPointerCapture(e.pointerId)}catch(_){}
      rank.classList.add('rankSizingStable4');
      e.preventDefault();e.stopPropagation();
    });
    h.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      if(typeof rankLayout3303==='undefined')return;
      if(mode==='right')rankLayout3303.w=drag.w+(e.clientX-drag.sx);
      if(mode==='bottom')rankLayout3303.h=drag.h+(e.clientY-drag.sy);
      if(typeof clampRankLayout3303==='function')clampRankLayout3303();
      if(typeof applyRankLayout3303==='function')applyRankLayout3303();
      e.preventDefault();e.stopPropagation();
    });
    const end=e=>{
      if(!drag||(e.pointerId!=null&&drag.id!==e.pointerId))return;
      const id=drag.id;drag=null;
      try{h.releasePointerCapture(id)}catch(_){}
      rank.classList.remove('rankSizingStable4');
      if(typeof keepRankOnScreen3303==='function')keepRankOnScreen3303();
      else if(typeof saveRankLayout3303==='function')saveRankLayout3303();
      e.preventDefault?.();e.stopPropagation?.();
    };
    h.addEventListener('pointerup',end);
    h.addEventListener('pointercancel',end);
  }
  bindRankEdge('rankResizeRight033','right');
  bindRankEdge('rankResizeBottom033','bottom');

  // -------------------------------------------------------------------------
  // Nueva partida: restablece posiciones, como en la versión moderna, pero sin
  // observers. Se ejecuta solo ante un clic explícito en una nueva partida.
  // -------------------------------------------------------------------------
  const NEW_IDS=new Set(['landingNew3305','newGameBtn','new3230','endRestart3230']);
  function clearGeometry(el){
    if(!el)return;
    ['left','right','top','bottom','width','height','max-width','max-height','transform'].forEach(p=>el.style.removeProperty(p));
    el.classList.remove('uiMovedStable2','draggingStable2','uiMovedStable3','draggingStable3','uiMovedStable4','draggingStable4','rankSizingStable4');
  }
  function resetLayoutStable4(){
    [RAIL_KEY,SETUP_KEY,GAME_KEY,SYSTEMS_KEY,ZOOM_POS_KEY,'hexategos-rank-layout-v3.30.3'].forEach(k=>{
      try{localStorage.removeItem(k)}catch(_){}
    });
    ['leftRail3306','zoomCtl3232','newGameSetup3302','gameMenu3306','systemsPanel3213','rankPanel3213']
      .forEach(id=>clearGeometry(document.getElementById(id)));
    document.getElementById('newGameSetup3302')?.classList.remove('minimizedStable2');
    if(typeof rankLayout3303!=='undefined'){
      rankLayout3303={x:null,y:null,w:220,h:260};
      if(typeof applyRankLayout3303==='function')applyRankLayout3303();
    }
  }
  window.resetHexategosLayoutStable4=resetLayoutStable4;
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('button');
    if(b&&NEW_IDS.has(b.id))resetLayoutStable4();
  },true);

  // -------------------------------------------------------------------------
  // Reencuadre en móvil/orientación. Solo responde a eventos reales del
  // viewport y no introduce trabajo periódico.
  // -------------------------------------------------------------------------
  let raf=0;
  function reclamp(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const rail=document.getElementById('leftRail3306');
      const setup=document.getElementById('newGameSetup3302');
      const menu=document.getElementById('gameMenu3306');
      const systems=document.getElementById('systemsPanel3213');
      if(rail?.classList.contains('uiMovedStable2')){
        const p=read(RAIL_KEY); if(p)place(rail,p,'uiMovedStable2');
      }
      if(setup?.classList.contains('open3302')&&setup.classList.contains('uiMovedStable2')){
        const p=read(SETUP_KEY); if(p)place(setup,p,'uiMovedStable2');
      }
      if(menu?.classList.contains('open3306')&&menu.classList.contains('uiMovedStable3')){
        const p=read(GAME_KEY); if(p)place(menu,p,'uiMovedStable3');
      }
      if(systems?.classList.contains('open')&&systems.classList.contains('uiMovedStable3')){
        const p=read(SYSTEMS_KEY); if(p)place(systems,p,'uiMovedStable3');
      }
      if(zoom?.classList.contains('uiMovedStable4')){
        const p=read(ZOOM_POS_KEY); if(p)place(zoom,p);
      }
      if(typeof applyRankLayout3303==='function')applyRankLayout3303();
    });
  }
  addEventListener('orientationchange',()=>setTimeout(reclamp,120),{passive:true});
  addEventListener('resize',reclamp,{passive:true});
  if(window.visualViewport){
    visualViewport.addEventListener('resize',reclamp,{passive:true});
    visualViewport.addEventListener('scroll',reclamp,{passive:true});
  }

  window.HEXATEGOS_STABLE_REBUILD='4';
})();
