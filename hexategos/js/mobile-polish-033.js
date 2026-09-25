// HEXATEGOS 0.33 · estabilización del HUD frente al viewport móvil
(() => {
  const ids=[
    'leftRail3306',
    'zoomCtl3232',
    'rankPanel3213',
    'gameMenu3306',
    'systemsPanel3213',
    'newGameSetup3302'
  ];

  function viewportSize(){
    const vv=window.visualViewport;
    return {
      w:vv?.width || innerWidth,
      h:vv?.height || innerHeight,
      ox:vv?.offsetLeft || 0,
      oy:vv?.offsetTop || 0
    };
  }

  function clampMoved(el){
    if(!el || !el.classList.contains('uiMoved033')) return;
    if(el.offsetParent===null && getComputedStyle(el).position!=='fixed') return;

    const v=viewportSize();
    const r=el.getBoundingClientRect();
    const margin=4;
    const maxX=Math.max(v.ox+margin,v.ox+v.w-r.width-margin);
    const maxY=Math.max(v.oy+margin,v.oy+v.h-r.height-margin);
    const x=Math.min(Math.max(v.ox+margin,r.left),maxX);
    const y=Math.min(Math.max(v.oy+margin,r.top),maxY);

    el.style.setProperty('left',x+'px','important');
    el.style.setProperty('top',y+'px','important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('bottom','auto','important');
    el.style.setProperty('transform','none','important');
  }

  function stabilize(){
    ids.forEach(id=>clampMoved(document.getElementById(id)));
  }

  addEventListener('orientationchange',()=>setTimeout(stabilize,120),{passive:true});
  addEventListener('resize',()=>requestAnimationFrame(stabilize),{passive:true});

  if(window.visualViewport){
    visualViewport.addEventListener('resize',()=>requestAnimationFrame(stabilize),{passive:true});
    visualViewport.addEventListener('scroll',()=>requestAnimationFrame(stabilize),{passive:true});
  }
})();
