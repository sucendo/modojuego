'use strict';
// HEXATEGOS v3.31.6 · anti-freeze scheduler, AI work budget and focus safety.
(() => {
  const PERF_VERSION = '3.31.6';
  const F = () => (typeof FACTIONS3230 !== 'undefined' ? FACTIONS3230.length : 0);

  const perf = window.HexategosPerf3316 = {
    version: PERF_VERSION,
    scheduler: 'recursive-timeout',
    aiEvalCursor: 1,
    tacticalCursor: 1,
    aiTicks: 0,
    deferredPaths: 0,
    deferredStrategic: 0,
    longTasks: [],
    last: Object.create(null),
    max: Object.create(null)
  };

  function sample(name, ms){
    perf.last[name] = ms;
    perf.max[name] = Math.max(perf.max[name] || 0, ms);
    if(ms >= 90){
      perf.longTasks.push({name, ms: Math.round(ms * 10) / 10, at: Date.now()});
      if(perf.longTasks.length > 40) perf.longTasks.shift();
      console.warn('[HEXATEGOS PERF]', name, ms.toFixed(1) + ' ms');
    }
  }

  // ---------------------------------------------------------------------------
  // 1. IA: una evaluación nacional por ciclo; táctica repartida por lotes.
  // ---------------------------------------------------------------------------
  let aiBudgetActive3316 = false;
  let aiEvalAllowed3316 = -1;
  let aiPathCalls3316 = 0;
  let tacticalAllowed3316 = new Uint8Array(Math.max(1, F()));
  let botBuildDone3316 = new Uint8Array(Math.max(1, F()));

  const baseNationalEval3316 = aiNationalCampaignEval3280;
  aiNationalCampaignEval3280 = function(f, force=false){
    if(aiBudgetActive3316 && !force && f !== aiEvalAllowed3316) return;
    return baseNationalEval3316.apply(this, arguments);
  };

  const baseNationTactical3316 = aiNationTactical3280;
  aiNationTactical3280 = function(f){
    if(aiBudgetActive3316 && !tacticalAllowed3316[f]) return;
    return baseNationTactical3316.apply(this, arguments);
  };

  const baseBotBuild3316 = botBuild3230;
  botBuild3230 = function(f){
    if(aiBudgetActive3316){
      if(!tacticalAllowed3316[f] || botBuildDone3316[f]) return;
      botBuildDone3316[f] = 1;
    }
    return baseBotBuild3316.apply(this, arguments);
  };

  // A* remains exact, but only one uncached large path search may start in one
  // AI slice. Cached routes remain free to reuse.
  const baseFindAIFrontPath3316 = findAIFrontPath3280;
  findAIFrontPath3280 = function(f, start, target, enemy){
    if(aiBudgetActive3316){
      const key = `${f}|${start}|${target}|${enemy}`;
      const cached = aiFrontPathCache3280?.get(key);
      if(!cached){
        if(aiPathCalls3316 >= 1){
          perf.deferredPaths++;
          return null;
        }
        aiPathCalls3316++;
      }
    }
    const t0 = performance.now();
    const v = baseFindAIFrontPath3316.apply(this, arguments);
    sample('path', performance.now() - t0);
    return v;
  };

  // Dirty snapshots no longer rebuild every time several conquests occur close
  // together. Forced rebuilds (load/reset/debug) still run immediately.
  const baseStrategicThink3316 = strategicThink3260;
  let strategicGateWall3316 = -1e9;
  strategicThink3260 = function(force=false){
    const now = performance.now();
    if(!force && aiSnapshot3260 && now - strategicGateWall3316 < 4200){
      perf.deferredStrategic++;
      return aiSnapshot3260;
    }
    const t0 = performance.now();
    const v = baseStrategicThink3316.apply(this, arguments);
    strategicGateWall3316 = performance.now();
    sample('strategic', strategicGateWall3316 - t0);
    return v;
  };

  const baseAiTick3316 = aiTick3212;
  aiTick3212 = function(){
    const n = F();
    if(n <= 1) return baseAiTick3316.apply(this, arguments);

    if(tacticalAllowed3316.length !== n){
      tacticalAllowed3316 = new Uint8Array(n);
      botBuildDone3316 = new Uint8Array(n);
      perf.aiEvalCursor = 1;
      perf.tacticalCursor = 1;
    }

    tacticalAllowed3316.fill(0);
    botBuildDone3316.fill(0);
    aiPathCalls3316 = 0;

    aiEvalAllowed3316 = perf.aiEvalCursor;
    perf.aiEvalCursor++;
    if(perf.aiEvalCursor >= n) perf.aiEvalCursor = 1;

    // Eight tactical nations per slice => with an ~850 ms scheduler every
    // nation gets a tactical opportunity roughly every 1.6-1.8 s.
    const tacticalBatch = Math.min(8, n - 1);
    for(let i=0; i<tacticalBatch; i++){
      const f = perf.tacticalCursor;
      tacticalAllowed3316[f] = 1;
      perf.tacticalCursor++;
      if(perf.tacticalCursor >= n) perf.tacticalCursor = 1;
    }

    aiBudgetActive3316 = true;
    perf.aiTicks++;
    const t0 = performance.now();
    try{
      return baseAiTick3316.apply(this, arguments);
    }finally{
      aiBudgetActive3316 = false;
      aiEvalAllowed3316 = -1;
      sample('ai', performance.now() - t0);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. Scheduler: no setInterval queue. Each task schedules itself only after
  //    the previous execution has completely returned to the browser.
  // ---------------------------------------------------------------------------
  const timers3316 = [];
  function schedule3316(name, fn, delay){
    const step = () => {
      const t0 = performance.now();
      try{
        fn();
      }catch(err){
        console.error('[HEXATEGOS ' + PERF_VERSION + '] ' + name, err);
      }finally{
        sample(name, performance.now() - t0);
        timers3316.push(setTimeout(step, delay));
        if(timers3316.length > 12) timers3316.splice(0, timers3316.length - 6);
      }
    };
    timers3316.push(setTimeout(step, delay));
  }

  startSimulationLoops3305 = function(){
    if(hexategosSimulationIntervals3305) return;
    hexategosSimulationIntervals3305 = true;

    // Economy keeps real-time cadence; AI is sliced more often but does much
    // less work per slice; fronts retain their previous cadence.
    schedule3316('economy', economyTick3212, 1000);
    schedule3316('aiLoop', aiTick3212, 850);
    schedule3316('fronts', frontsTick3230, 650);
  };

  // ---------------------------------------------------------------------------
  // 3. Accessibility/focus safety. aria-hidden must never be applied while a
  //    descendant owns focus. inert prevents the hidden panel receiving focus.
  // ---------------------------------------------------------------------------
  function blurInside3316(panel){
    const active = document.activeElement;
    if(panel && active && panel.contains(active)){
      try{ active.blur(); }catch(_){}
    }
  }

  const gameMenu3316 = document.getElementById('gameMenu3306');
  const setup3316 = document.getElementById('newGameSetup3302');

  if(gameMenu3316) gameMenu3316.inert = !gameMenu3316.classList.contains('open3306');
  if(setup3316) setup3316.inert = !setup3316.classList.contains('open3302');

  const baseOpenGameMenu3316 = openGameMenu3306;
  openGameMenu3306 = function(){
    if(gameMenu3316) gameMenu3316.inert = false;
    return baseOpenGameMenu3316.apply(this, arguments);
  };

  const baseCloseGameMenu3316 = closeGameMenu3306;
  closeGameMenu3306 = function(){
    blurInside3316(gameMenu3316);
    const v = baseCloseGameMenu3316.apply(this, arguments);
    if(gameMenu3316) gameMenu3316.inert = true;
    return v;
  };

  const baseBeginSetup3316 = beginNewGameSetup3302;
  beginNewGameSetup3302 = function(){
    if(setup3316) setup3316.inert = false;
    return baseBeginSetup3316.apply(this, arguments);
  };

  const baseCancelSetup3316 = cancelNewGameSetup3302;
  cancelNewGameSetup3302 = function(){
    blurInside3316(setup3316);
    const v = baseCancelSetup3316.apply(this, arguments);
    if(setup3316 && !setup3316.classList.contains('open3302')) setup3316.inert = true;
    return v;
  };

  const baseConfirmSetup3316 = confirmNewGameSetup3302;
  confirmNewGameSetup3302 = function(){
    blurInside3316(setup3316);
    const v = baseConfirmSetup3316.apply(this, arguments);
    if(setup3316 && !setup3316.classList.contains('open3302')) setup3316.inert = true;
    return v;
  };

  // These handlers were bound to the old function object by direct assignment.
  const gameMenuClose = document.getElementById('gameMenuClose3306');
  if(gameMenuClose) gameMenuClose.onclick = closeGameMenu3306;
  const setupClose = document.getElementById('setupClose3302');
  if(setupClose) setupClose.onclick = cancelNewGameSetup3302;
  const setupConfirm = document.getElementById('setupConfirm3302');
  if(setupConfirm) setupConfirm.onclick = confirmNewGameSetup3302;

  // Other legacy aria-hidden panels (landing options) also release focus before
  // their old close handler runs.
  document.addEventListener('click', e => {
    const b = e.target.closest?.('#landingOptionsClose3305');
    if(b) try{ b.blur(); }catch(_){}
  }, true);

  // Debug helper available from DevTools:
  // HexategosPerf3316 -> last/max timings and deferred heavy operations.
  console.info('[HEXATEGOS] Performance stability layer ' + PERF_VERSION + ' active');
})();
