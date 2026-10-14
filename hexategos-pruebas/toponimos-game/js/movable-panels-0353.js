'use strict';

// HEXATEGOS 0.35.3 · estándar reutilizable de paneles movibles.
// Regla UI: todo diálogo/panel flotante nuevo debe poder reposicionarse.
// Sin MutationObserver ni timers periódicos.
(() => {
  const BUILD='0.35.3';
  const STORAGE_PREFIX='hexategos.ui.panel.pos.';
  const registry=new Map();
  let drag=null;

  function viewport0353(){
    const vv=window.visualViewport;
    return {
      w:vv?.width||innerWidth,
      h:vv?.height||innerHeight,
      ox:vv?.offsetLeft||0,
      oy:vv?.offsetTop||0
    };
  }

  function read0353(key){
    try{
      const v=JSON.parse(localStorage.getItem(STORAGE_PREFIX+key)||'null');
      return v&&Number.isFinite(v.x)&&Number.isFinite(v.y)?v:null;
    }catch(_){return null}
  }

  function write0353(key,value){
    try{localStorage.setItem(STORAGE_PREFIX+key,JSON.stringify(value))}catch(_){}
  }

  function setOffset0353(rec,x,y,save=false){
    rec.x=Number.isFinite(x)?x:0;
    rec.y=Number.isFinite(y)?y:0;
    rec.panel.style.setProperty('--hex-panel-x-0353',rec.x+'px');
    rec.panel.style.setProperty('--hex-panel-y-0353',rec.y+'px');
    rec.panel.classList.add('hexMovable0353');
    if(save)write0353(rec.key,{x:rec.x,y:rec.y});
  }

  function clampCurrent0353(rec,save=false){
    if(!rec?.panel?.isConnected)return;
    const v=viewport0353(),m=5,r=rec.panel.getBoundingClientRect();
    let dx=0,dy=0;
    if(r.left<v.ox+m)dx+=(v.ox+m-r.left);
    if(r.top<v.oy+m)dy+=(v.oy+m-r.top);
    if(r.right>v.ox+v.w-m)dx-=(r.right-(v.ox+v.w-m));
    if(r.bottom>v.oy+v.h-m)dy-=(r.bottom-(v.oy+v.h-m));
    if(dx||dy)setOffset0353(rec,rec.x+dx,rec.y+dy,save);
  }

  function resolveHandle0353(panel,handle){
    if(handle instanceof Element)return handle;
    if(typeof handle==='string')return panel.querySelector(handle);
    return null;
  }

  function register0353(panel,handle,key){
    if(!(panel instanceof Element))return null;
    const h=resolveHandle0353(panel,handle);
    if(!h)return null;

    const id=key||panel.id||('panel-'+registry.size);
    let rec=registry.get(panel);
    if(!rec){
      const saved=read0353(id)||{x:0,y:0};
      rec={panel,handle:h,key:id,x:saved.x,y:saved.y};
      registry.set(panel,rec);
    }else{
      rec.handle=h;
      rec.key=id;
    }

    panel.setAttribute('data-hex-movable-0353',id);
    h.setAttribute('data-hex-drag-handle-0353','');
    h.setAttribute('title',h.getAttribute('title')||'Arrastra para mover');
    setOffset0353(rec,rec.x,rec.y,false);
    requestAnimationFrame(()=>clampCurrent0353(rec,false));
    return rec;
  }

  function unregister0353(panel){
    const rec=registry.get(panel);
    if(!rec)return false;
    registry.delete(panel);
    panel.removeAttribute('data-hex-movable-0353');
    rec.handle?.removeAttribute('data-hex-drag-handle-0353');
    return true;
  }

  function reset0353(panelOrKey){
    for(const rec of registry.values()){
      if(rec.panel===panelOrKey||rec.key===panelOrKey){
        setOffset0353(rec,0,0,true);
        requestAnimationFrame(()=>clampCurrent0353(rec,true));
        return true;
      }
    }
    return false;
  }

  function beginDrag0353(e,handle){
    if(e.button!=null&&e.button!==0)return;
    if(e.target.closest('button,input,select,textarea,a,summary'))return;
    const panel=handle.closest('[data-hex-movable-0353]');
    if(!panel)return;
    const rec=registry.get(panel);
    if(!rec)return;

    const r=panel.getBoundingClientRect();
    drag={
      rec,
      handle,
      pointerId:e.pointerId,
      startClientX:e.clientX,
      startClientY:e.clientY,
      startX:rec.x,
      startY:rec.y,
      rect:r
    };
    panel.classList.add('hexDragging0353');
    try{handle.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
    e.stopPropagation();
  }

  function moveDrag0353(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    const {rec,rect,startClientX,startClientY,startX,startY}=drag;
    const v=viewport0353(),m=5;
    let x=startX+(e.clientX-startClientX);
    let y=startY+(e.clientY-startClientY);
    const ddx=x-startX,ddy=y-startY;
    let left=rect.left+ddx,right=rect.right+ddx,top=rect.top+ddy,bottom=rect.bottom+ddy;

    if(left<v.ox+m)x+=v.ox+m-left;
    if(right>v.ox+v.w-m)x-=right-(v.ox+v.w-m);
    if(top<v.oy+m)y+=v.oy+m-top;
    if(bottom>v.oy+v.h-m)y-=bottom-(v.oy+v.h-m);

    setOffset0353(rec,x,y,false);
    e.preventDefault();
    e.stopPropagation();
  }

  function endDrag0353(e){
    if(!drag||(e.pointerId!=null&&e.pointerId!==drag.pointerId))return;
    const {rec,handle,pointerId}=drag;
    drag=null;
    rec.panel.classList.remove('hexDragging0353');
    try{handle.releasePointerCapture(pointerId)}catch(_){}
    clampCurrent0353(rec,false);
    write0353(rec.key,{x:rec.x,y:rec.y});
    e.preventDefault?.();
    e.stopPropagation?.();
  }

  document.addEventListener('pointerdown',e=>{
    const h=e.target.closest?.('[data-hex-drag-handle-0353]');
    if(h)beginDrag0353(e,h);
  },true);
  document.addEventListener('pointermove',moveDrag0353,true);
  document.addEventListener('pointerup',endDrag0353,true);
  document.addEventListener('pointercancel',endDrag0353,true);

  function registerCurrent0353(){
    const geo=document.getElementById('geoMapPanel0352');
    if(geo)register0353(geo,'.geoPanelHead0352','geopolitical-map');

    const about=document.querySelector('#aboutOverlay0351 .aboutCard0351');
    if(about)register0353(about,'.aboutHead0351','about-history');
  }

  // El panel geopolítico ya existe al cargar esta capa.
  registerCurrent0353();

  // Acerca de se crea bajo demanda; el handler original lo crea primero.
  document.getElementById('landingAbout0351')?.addEventListener('click',()=>{
    registerCurrent0353();
  });

  function clampRegistered0353(){
    for(const rec of registry.values())clampCurrent0353(rec,true);
  }
  addEventListener('resize',clampRegistered0353,{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',clampRegistered0353,{passive:true});

  window.HexategosMovablePanels0353={
    register:register0353,
    unregister:unregister0353,
    reset:reset0353,
    clamp:clampRegistered0353,
    list:()=>[...registry.values()].map(r=>({key:r.key,id:r.panel.id||null,x:r.x,y:r.y})),
    version:BUILD
  };

  console.info('[HEXATEGOS] 0.35.3 estándar de paneles movibles activo');
})();