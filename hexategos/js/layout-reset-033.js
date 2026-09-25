// HEXATEGOS 0.33 · restablecer la disposición al iniciar una partida nueva
(() => {
  const POSITION_KEYS = [
    'hexategos.ui.leftRail.pos.033',
    'hexategos.ui.zoomCtl.pos.033',
    'hexategos.ui.newGameSetup.pos.033',
    'hexategos.ui.gameMenu.pos.033',
    'hexategos.ui.systemsPanel.pos.033',
    'hexategos.ui.rank.pos.033',
    'hexategos.ui.rank.size.033'
  ];

  const removeInlineGeometry = el => {
    if(!el) return;
    ['left','right','top','bottom','width','height','max-width','max-height','transform']
      .forEach(p => el.style.removeProperty(p));
    el.classList.remove(
      'uiMoved033','dragging033','rankMoving033','rankSizing033'
    );
  };

  function resetLayoutDefaults033(){
    POSITION_KEYS.forEach(k => {
      try{ localStorage.removeItem(k); }catch(_){}
    });

    removeInlineGeometry(document.getElementById('leftRail3306'));
    removeInlineGeometry(document.getElementById('zoomCtl3232'));
    removeInlineGeometry(document.getElementById('newGameSetup3302'));
    removeInlineGeometry(document.getElementById('gameMenu3306'));
    removeInlineGeometry(document.getElementById('systemsPanel3213'));
    removeInlineGeometry(document.getElementById('rankPanel3213'));

    // Clasificación: por defecto arriba-derecha y con su tamaño original.
    const rank=document.getElementById('rankPanel3213');
    if(rank){
      rank.style.removeProperty('left');
      rank.style.removeProperty('bottom');
      rank.style.removeProperty('width');
      rank.style.removeProperty('height');
      rank.style.removeProperty('max-width');
      rank.style.removeProperty('max-height');
      rank.style.removeProperty('right');
      rank.style.removeProperty('top');
    }

    // El diálogo de nueva partida vuelve centrado y desplegado.
    const setup=document.getElementById('newGameSetup3302');
    setup?.classList.remove('minimized033');

    window.dispatchEvent(new CustomEvent('hexategos:layout-reset-033'));
  }

  window.resetHexategosLayout033 = resetLayoutDefaults033;

  // Captura antes que los onclick del motor para que el setup ya nazca centrado.
  const newGameIds = new Set([
    'landingNew3305',
    'newGameBtn',
    'new3230',
    'endRestart3230'
  ]);

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('button');
    if(btn && newGameIds.has(btn.id)) resetLayoutDefaults033();
  },true);
})();
