// HEXATEGOS 0.33 SR1 · diagnostics only (no gameplay overrides)
(() => {
  const D = window.HexategosDiag033 = {
    build:'0.33-SR1',
    startedAt:performance.now(),
    maxTimerDrift:0,
    lastTimerDrift:0,
    longTasks:[],
    errors:[],
    rejections:[],
    ui:{},
    snapshot(){
      const ids=['gameMenu3306','newGameSetup3302','systemsPanel3213','intro3230','landing3305'];
      const ui={};
      for(const id of ids){
        const el=document.getElementById(id); if(!el)continue;
        const cs=getComputedStyle(el);
        ui[id]={display:cs.display,visibility:cs.visibility,pointerEvents:cs.pointerEvents,ariaHidden:el.getAttribute('aria-hidden'),inert:!!el.inert,classes:el.className};
      }
      this.ui=ui;
      return {build:this.build,maxTimerDrift:this.maxTimerDrift,lastTimerDrift:this.lastTimerDrift,longTasks:this.longTasks.slice(-12),errors:this.errors.slice(-12),rejections:this.rejections.slice(-12),ui};
    }
  };

  addEventListener('error',e=>{
    D.errors.push({at:Date.now(),message:String(e.message||e.error||'error')});
    if(D.errors.length>40)D.errors.shift();
  });
  addEventListener('unhandledrejection',e=>{
    D.rejections.push({at:Date.now(),message:String(e.reason?.message||e.reason||'rejection')});
    if(D.rejections.length>40)D.rejections.shift();
  });

  try{
    if('PerformanceObserver' in window){
      const po=new PerformanceObserver(list=>{
        for(const x of list.getEntries()){
          D.longTasks.push({at:Date.now(),duration:Math.round(x.duration*10)/10,name:x.name||'longtask'});
          if(D.longTasks.length>40)D.longTasks.shift();
        }
      });
      po.observe({entryTypes:['longtask']});
    }
  }catch(_){}

  let expected=performance.now()+1000;
  function heartbeat(){
    const now=performance.now();
    const drift=Math.max(0,now-expected);
    D.lastTimerDrift=Math.round(drift*10)/10;
    D.maxTimerDrift=Math.max(D.maxTimerDrift,D.lastTimerDrift);
    expected=now+1000;
    setTimeout(heartbeat,1000);
  }
  setTimeout(heartbeat,1000);

  // Initial hidden panels are non-interactive for accessibility/focus safety.
  for(const id of ['gameMenu3306','newGameSetup3302']){
    const el=document.getElementById(id);
    if(el && el.getAttribute('aria-hidden')==='true') el.inert=true;
  }

  console.info('[HEXATEGOS] Stable Rebuild 1 activo. Diagnóstico: HexategosDiag033.snapshot()');
})();
