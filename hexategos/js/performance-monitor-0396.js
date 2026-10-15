'use strict';
/* HEXATEGOS · C4 diagnostics (non-persistent, no simulation timers).
 * Wrap only the final public tick functions; keep their returns/exceptions.
 * All measurements are observational. No gameplay state is written.
 */
(() => {
  const VERSION='0.39.6-c4', MAX_SAMPLES=3600, INTERVAL_MS=1000;
  const clock=()=>performance.now();
  const sectionNames=['ai','economy'];
  let capturing=false, opened=false, rafId=0, lastPaint=0, lastSample=0;
  let startedWall=0, stoppedWall=0, samples=[];
  let buckets={ai:{ms:0,count:0,max:0},economy:{ms:0,count:0,max:0}};
  let panel=null;

  function readNumber(value){
    const n=Number(value);
    return Number.isFinite(n)?Math.round(n*100)/100:null;
  }
  function counters(){
    const ai=window.HexategosNationAI0360?.stats?.().scheduler||null;
    const perf=window.HexategosStability0342?.stats?.().performance||null;
    const world=window.HexategosWorldCore03828?.diagnostics?.()||null;
    const memory=performance.memory?.usedJSHeapSize;
    return {
      wallMs:Math.round(clock()-startedWall),
      campaignSeconds:typeof campaignSeconds3230==='number'?readNumber(campaignSeconds3230):null,
      nations:typeof activeFactionCount3230==='number'?activeFactionCount3230:null,
      paused:typeof paused3230==='boolean'?paused3230:null,
      cells:typeof owner6!=='undefined'&&owner6?owner6.length:null,
      cities:typeof cities3212!=='undefined'&&cities3212?.size!=null?cities3212.size:null,
      roads:typeof roadEdgeSet3212!=='undefined'&&roadEdgeSet3212?.size!=null?roadEdgeSet3212.size:null,
      renderAvgMs:readNumber(perf?.renderAvg),
      renderMaxMs:readNumber(perf?.renderMax),
      aiTickMs:readNumber(ai?.lastTickMs),
      aiSnapshotMs:readNumber(ai?.lastSnapshotMs),
      aiDeferred:readNumber(ai?.deferred),
      worldTickMs:readNumber(world?.lastTick?.elapsedMs),
      heapMB:readNumber(memory!=null?memory/1048576:null),
      timerDriftMs:readNumber(window.HexategosDiag033?.lastTimerDrift)
    };
  }
  function emptyBuckets(){
    return {ai:{ms:0,count:0,max:0},economy:{ms:0,count:0,max:0}};
  }
  function snapshot(){
    const s=counters();
    for(const section of sectionNames){
      const b=buckets[section];
      s[section+'CpuMs']=readNumber(b.ms);
      s[section+'Calls']=b.count;
      s[section+'MaxMs']=readNumber(b.max);
    }
    return s;
  }
  function flushSample(){
    if(!capturing)return;
    const now=clock();
    if(now-lastSample<INTERVAL_MS)return;
    const row=snapshot();
    samples.push(row);
    if(samples.length>MAX_SAMPLES)samples.shift();
    buckets=emptyBuckets();
    lastSample=now;
  }
  function wrap(name,section){
    const fn=window[name];
    if(typeof fn!=='function')return false;
    window[name]=function(){
      if(!capturing)return fn.apply(this,arguments);
      const t0=clock();
      try{return fn.apply(this,arguments)}
      finally{
        const ms=Math.max(0,clock()-t0),b=buckets[section];
        b.ms+=ms;b.count++;b.max=Math.max(b.max,ms);
        if(section==='economy')flushSample();
      }
    };
    return true;
  }
  const wrapped={
    ai:wrap('aiTick3212','ai'),
    economy:wrap('economyTick3212','economy')
  };
  function start(){
    samples=[];buckets=emptyBuckets();startedWall=clock();stoppedWall=0;
    lastSample=startedWall;capturing=true;paint();
    return true;
  }
  function stop(){
    flushSample();capturing=false;stoppedWall=clock();paint();
    return samples.length;
  }
  function report(){
    return {
      schema:'hexategos-performance-c4-v1',
      version:VERSION,
      generatedAt:new Date().toISOString(),
      durationMs:Math.round((capturing?clock():stoppedWall||clock())-startedWall),
      running:capturing,
      wrapped:{...wrapped},
      note:'Métricas CPU incluyentes: economy puede abarcar logística y diplomacia. Memoria JS solo cuando el navegador la expone; no equivale a RAM total.',
      samples:samples.map(r=>({...r}))
    };
  }
  function exportReport(){
    const data=JSON.stringify(report(),null,2);
    const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
    const a=document.createElement('a');
    a.href=url;a.download='HEXATEGOS_PERF_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
    document.body.appendChild(a);a.click();a.remove();
    // URL cleanup happens on the next direct user action, not a simulation timer.
    if(exportReport.previous)URL.revokeObjectURL(exportReport.previous);
    exportReport.previous=url;
  }
  function format(v,unit=''){
    return v===null||v===undefined?'N/D':String(v)+unit;
  }
  function paint(){
    if(!opened||!panel)return;
    const s=snapshot(),values=panel.querySelector('[data-perf-values]');
    if(values){
      values.textContent=
        'Naciones: '+format(s.nations)+' · Celdas: '+format(s.cells)+'\n'+
        'Tiempo campaña: '+format(s.campaignSeconds,' s')+' · Pausa: '+format(s.paused)+'\n'+
        'Render medio/máx: '+format(s.renderAvgMs,' ms')+' / '+format(s.renderMaxMs,' ms')+'\n'+
        'IA último tick: '+format(s.aiTickMs,' ms')+' · diferidas: '+format(s.aiDeferred)+'\n'+
        'IA CPU (intervalo): '+format(s.aiCpuMs,' ms')+' · llamadas: '+format(s.aiCalls)+'\n'+
        'Economía CPU (intervalo): '+format(s.economyCpuMs,' ms')+' · llamadas: '+format(s.economyCalls)+'\n'+
        'Snapshot IA: '+format(s.aiSnapshotMs,' ms')+' · mundo: '+format(s.worldTickMs,' ms')+'\n'+
        'Heap JS: '+format(s.heapMB,' MB')+' · deriva: '+format(s.timerDriftMs,' ms')+'\n'+
        'Muestras: '+samples.length+' / '+MAX_SAMPLES;
    }
    const indicator=panel.querySelector('[data-perf-status]');
    if(indicator)indicator.textContent=capturing?'● Grabando (1 muestra/s)':'○ Detenido';
    panel.querySelector('[data-perf-start]').disabled=capturing;
    panel.querySelector('[data-perf-stop]').disabled=!capturing;
    panel.querySelector('[data-perf-export]').disabled=!samples.length;
  }
  function ensurePanel(){
    if(panel)return panel;
    panel=document.createElement('section');
    panel.id='hexategosPerfPanel0396';
    panel.className='hexategosPerfPanel0396';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','Diagnóstico de rendimiento');
    panel.setAttribute('aria-modal','false');
    panel.innerHTML=
      '<header><b>Rendimiento · C4</b><button type="button" data-perf-close aria-label="Cerrar">×</button></header>'+
      '<p data-perf-status>○ Detenido</p>'+
      '<pre data-perf-values></pre>'+
      '<footer><button type="button" data-perf-start>Iniciar captura</button>'+
      '<button type="button" data-perf-stop>Detener</button>'+
      '<button type="button" data-perf-export>Exportar JSON</button></footer>'+
      '<small>Captura local de métricas, sin datos de la partida. La memoria JS puede aparecer como N/D.</small>';
    document.body.appendChild(panel);
    panel.querySelector('[data-perf-close]').addEventListener('click',close);
    panel.querySelector('[data-perf-start]').addEventListener('click',start);
    panel.querySelector('[data-perf-stop]').addEventListener('click',stop);
    panel.querySelector('[data-perf-export]').addEventListener('click',exportReport);
    return panel;
  }
  function frame(){
    if(!opened)return;
    const now=clock();
    if(now-lastPaint>=INTERVAL_MS){lastPaint=now;paint()}
    rafId=requestAnimationFrame(frame);
  }
  function open(){
    ensurePanel();opened=true;panel.hidden=false;
    lastPaint=clock()-INTERVAL_MS;paint();
    if(!rafId)rafId=requestAnimationFrame(frame);
  }
  function close(){
    opened=false;
    if(panel)panel.hidden=true;
    if(rafId){cancelAnimationFrame(rafId);rafId=0}
  }
  function inject(){
    if(typeof sysTab3220==='undefined'||sysTab3220!=='settings')return;
    const host=document.getElementById('sysContent3213');
    if(!host||host.querySelector('#hexategosPerfOpen0396'))return;
    const block=document.createElement('div');
    block.className='sysBlock3213';
    const title=document.createElement('b');
    title.textContent='Rendimiento y simulación (C4)';
    const action=document.createElement('button');
    action.type='button';action.id='hexategosPerfOpen0396';
    action.textContent='Ver diagnóstico / registrar métricas';
    action.addEventListener('click',open);
    const note=document.createElement('p');
    note.className='sysMeta3213';
    note.textContent='Mide IA, economía, renderizado y memoria. No modifica la partida.';
    block.append(title,action,note);host.appendChild(block);
  }
  if(typeof renderSystems3220==='function'){
    const old=renderSystems3220;
    renderSystems3220=function(){
      const result=old.apply(this,arguments);
      inject();
      return result;
    };
  }
  window.HexategosPerformanceMonitor0396={
    version:VERSION,start,stop,snapshot,report,open,close,get capturing(){return capturing},
    get sampleCount(){return samples.length},wrapped
  };
})();