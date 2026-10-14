// HEXATEGOS Stable Rebuild 6 · rail simplificado + acceso directo a Opciones.
// Sin MutationObserver, sin timers periódicos y sin tocar simulación/IA.
(() => {
  'use strict';
  const BUILD='6';
  const optionsBtn=document.getElementById('optionsBtnStable6');
  const systemsBtn=document.getElementById('systemsBtn3213');
  const systemsPanel=document.getElementById('systemsPanel3213');
  const headTitle=systemsPanel?.querySelector('.sysHead3213 b');
  const tabButtons=[...document.querySelectorAll('.sysTabs3213 button[data-tab]')];
  let lastSystemTab=(typeof sysTab3220!=='undefined' && sysTab3220!=='settings')?sysTab3220:'dip';

  function syncTabs(tab){
    tabButtons.forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    if(headTitle)headTitle.textContent=tab==='settings'?'OPCIONES':'SISTEMAS';
    optionsBtn?.classList.toggle('active',tab==='settings'&&systemsPanel?.classList.contains('open'));
    systemsBtn?.classList.toggle('active',tab!=='settings'&&systemsPanel?.classList.contains('open'));
  }

  // -----------------------------------------------------------------------
  // Un bloque de visualización único dentro de AJUSTES.
  // El resto del contenido (guardados, diagnóstico, auditoría, motor, etc.)
  // se conserva tal cual lo generan las capas estables anteriores.
  // -----------------------------------------------------------------------
  function zoomVisible(){
    const z=document.getElementById('zoomCtl3232');
    return !!z && !z.classList.contains('zoomCtlHiddenStable4');
  }
  function setZoomVisible(show){
    const value=!!show;
    const z=document.getElementById('zoomCtl3232');
    z?.classList.toggle('zoomCtlHiddenStable4',!value);
    try{localStorage.setItem('hexategos.ui.zoomCtl.visible.033',value?'1':'0')}catch(_){}
    const landing=document.getElementById('landingZoomCtl033');
    if(landing)landing.checked=value;
  }
  function persistLanding(){
    try{ if(typeof saveLandingOptions3305==='function')saveLandingOptions3305(); }catch(_){}
  }
  function setGrid(value){
    showGrid=!!value;needsRender=true;
    const el=document.getElementById('landingGrid3305');if(el)el.checked=showGrid;
    persistLanding();renderSystems3220();
  }
  function setLabels(value){
    showLabels=!!value;needsRender=true;
    const el=document.getElementById('landingLabels3305');if(el)el.checked=showLabels;
    persistLanding();renderSystems3220();
  }
  function toggleStartFullscreen(){
    const el=document.getElementById('landingFullscreen3305');
    if(!el)return;
    el.checked=!el.checked;persistLanding();renderSystems3220();
  }
  async function toggleFullscreen(){
    try{
      if(document.fullscreenElement) await document.exitFullscreen?.();
      else await document.documentElement.requestFullscreen?.();
    }catch(_){}
    renderSystems3220();
  }
  function centerView(){
    const legacy=document.getElementById('resetViewBtn');
    if(legacy)legacy.click();
    else { try{yaw=0;pitch=-.28;zoom=1;selected=null;needsRender=true}catch(_){} }
  }

  function injectViewOptions(){
    if(typeof sysTab3220==='undefined'||sysTab3220!=='settings')return;
    const c=document.getElementById('sysContent3213');if(!c)return;

    // Stable4 already appends a standalone zoom checkbox. It is replaced by
    // the unified Visualización block below.
    c.querySelector('#settingsZoomCtlStable4')?.closest('.uiSettingRowStable4')?.remove();

    // Remove only the old Malla/Etiquetas buttons; Debug, Cajas, Guardar and
    // all later blocks remain intact.
    [...c.querySelectorAll('.sysActs3213 button')].forEach(b=>{
      const t=(b.textContent||'').trim().toLocaleLowerCase('es');
      if(t.startsWith('malla ')||t.startsWith('etiquetas '))b.remove();
    });
    [...c.querySelectorAll('.sysBlock3213>b')].forEach(b=>{
      if((b.textContent||'').trim()==='Ajustes y diagnóstico')b.textContent='Diagnóstico y guardado';
    });

    const fullStart=document.getElementById('landingFullscreen3305')?.checked===true;
    const block=document.createElement('div');
    block.className='sysBlock3213 optionsViewStable6';
    block.innerHTML=`
      <b>⚙ Visualización e interfaz</b>
      <div class="sysMeta3213">Las opciones de vista ya no ocupan espacio en la barra izquierda.</div>
      <div class="optionsGridStable6">
        <button data-opt="grid" class="${showGrid?'active':''}">⌗ Malla <strong>${showGrid?'ON':'OFF'}</strong></button>
        <button data-opt="labels" class="${showLabels?'active':''}">Aa Nombres <strong>${showLabels?'ON':'OFF'}</strong></button>
        <button data-opt="zoom" class="${zoomVisible()?'active':''}">＋− Control zoom <strong>${zoomVisible()?'ON':'OFF'}</strong></button>
        <button data-opt="center">⌖ Centrar vista</button>
        <button data-opt="fullscreen">⛶ ${document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa'}</button>
        <button data-opt="startFullscreen" class="${fullStart?'active':''}">↗ Pantalla completa al iniciar <strong>${fullStart?'ON':'OFF'}</strong></button>
      </div>`;
    c.prepend(block);

    block.querySelector('[data-opt="grid"]')?.addEventListener('click',()=>setGrid(!showGrid));
    block.querySelector('[data-opt="labels"]')?.addEventListener('click',()=>setLabels(!showLabels));
    block.querySelector('[data-opt="zoom"]')?.addEventListener('click',()=>{setZoomVisible(!zoomVisible());renderSystems3220()});
    block.querySelector('[data-opt="center"]')?.addEventListener('click',()=>{centerView();renderSystems3220()});
    block.querySelector('[data-opt="fullscreen"]')?.addEventListener('click',toggleFullscreen);
    block.querySelector('[data-opt="startFullscreen"]')?.addEventListener('click',toggleStartFullscreen);
  }

  if(typeof renderSystems3220==='function'){
    const baseRender=renderSystems3220;
    renderSystems3220=function(){
      const v=baseRender.apply(this,arguments);
      injectViewOptions();
      syncTabs(typeof sysTab3220!=='undefined'?sysTab3220:'dip');
      return v;
    };
  }

  if(typeof openSystems3220==='function'){
    const baseOpen=openSystems3220;
    openSystems3220=function(tab='dip'){
      if(tab!=='settings')lastSystemTab=tab;
      const v=baseOpen.apply(this,arguments);
      syncTabs(tab);
      return v;
    };
  }
  if(typeof closeSystems3220==='function'){
    const baseClose=closeSystems3220;
    closeSystems3220=function(){
      const v=baseClose.apply(this,arguments);
      optionsBtn?.classList.remove('active');
      systemsBtn?.classList.remove('active');
      if(headTitle)headTitle.textContent='SISTEMAS';
      return v;
    };
  }

  // Sistemas y Opciones son ahora accesos distintos al mismo panel estable.
  if(systemsBtn)systemsBtn.onclick=()=>openSystems3220(lastSystemTab);
  if(optionsBtn)optionsBtn.onclick=()=>openSystems3220('settings');
  const close=document.getElementById('systemsClose3213');
  if(close)close.onclick=()=>closeSystems3220();

  tabButtons.forEach(b=>b.addEventListener('click',()=>{
    const tab=b.dataset.tab||'dip';
    if(tab!=='settings')lastSystemTab=tab;
    syncTabs(tab);
  }));

  window.HEXATEGOS_STABLE_REBUILD=BUILD;
})();
