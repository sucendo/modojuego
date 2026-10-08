'use strict';
// HEXATEGOS 0.38.18 · Desplazamiento estable en Sistemas.
// Los mensajes solo pueden desplazarnos tras pulsar VER explícitamente.
(() => {
  const VERSION='0.38.18';
  const panel=document.getElementById('systemsPanel3213');
  const content=document.getElementById('sysContent3213');
  if(!panel||!content||typeof renderSystems3220!=='function')return;
  const main=panel.querySelector('.sysMain0385');
  const tabPositions=new Map();
  let lastTab=typeof sysTab3220==='string'?sysTab3220:'dip';
  let lastRestore=null;
  function current(){
    return {
      content:Math.max(0,content.scrollTop||0),
      main:Math.max(0,main?.scrollTop||0),
      panel:Math.max(0,panel.scrollTop||0)
    };
  }
  function restore(snapshot){
    if(!snapshot)return;
    // Reconstruir el HTML no debe hacer que la pantalla salte arriba.
    // También hay paneles que desplazan .sysMain, no #sysContent.
    content.scrollTop=snapshot.content||0;
    if(main)main.scrollTop=snapshot.main||0;
    panel.scrollTop=snapshot.panel||0;
    lastRestore={...snapshot};
  }
  const baseRender=renderSystems3220;
  renderSystems3220=function(){
    const tab=typeof sysTab3220==='string'?sysTab3220:'dip';
    const scrollBefore=current();
    const visible=panel.classList.contains('open');
    if(visible&&tab!==lastTab)tabPositions.set(lastTab,scrollBefore);
    const target=tab===lastTab?scrollBefore:(tabPositions.get(tab)||{content:0,main:0,panel:0});
    const output=baseRender.apply(this,arguments);
    if(visible)restore(target);
    lastTab=tab;
    return output;
  };
  window.HexategosDialogScroll03818={
    version:VERSION,
    current,
    lastRestore:()=>lastRestore&&{...lastRestore},
    savedTabs:()=>Array.from(tabPositions.keys())
  };
})();
