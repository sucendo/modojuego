'use strict';
/* Hexategos Pruebas 0.38.95: old portable saves need no synchronous AI campaign
 * synthesis. Resume missing national campaigns in bounded scheduler slices.
 * Keeps simulation paused while the nested import wrappers restore their data.
 */
(() => {
  if(typeof applyPortableFile3275!=='function'||
     typeof strategicThink3260!=='function'||
     typeof aiNationalCampaignEval3280!=='function')return;
  const baseApply=applyPortableFile3275;
  const baseStrategic=strategicThink3260;
  const baseNational=aiNationalCampaignEval3280;
  const BUDGET_MS=8;
  const MARKER='hexategos_pruebas_import_phase_03895';
  const PENDING_KEY='hexategos_pruebas_ai_pending_03895';
  let importing=0,stage='idle',pendingNation=0,cycleStarted=0,cycleCount=0;
  let skippedStrategic=0,skippedNational=0,lastMs=0,lastError=null;
  let peakHeap=0;
  try{
    const stored=Number(localStorage.getItem(PENDING_KEY));
    if(Number.isInteger(stored)&&stored>0&&stored<=500)pendingNation=stored;
  }catch(_){}
  function persistPending(){
    try{localStorage.setItem(PENDING_KEY,String(pendingNation));}catch(_){}
  }
  function mark(label,status='running'){
    stage=label;
    const heap=Number(performance?.memory?.usedJSHeapSize)||0;
    if(heap>peakHeap)peakHeap=heap;
    // Persistent marker helps distinguish a renderer kill from a JS exception.
    try{sessionStorage.setItem(MARKER,JSON.stringify({label,status,at:Date.now(),heap}));}
    catch(_){}
  }
  function profile(name,fn){
    return function(){
      if(importing)mark(name+':begin');
      const result=fn.apply(this,arguments);
      if(importing)mark(name+':end');
      return result;
    };
  }
  // These are full-world derived calculations; keep their last completed
  // checkpoint, without logging individual cells or any private save contents.
  if(typeof rebuildSupply3253==='function')
    rebuildSupply3253=profile('supply',rebuildSupply3253);
  if(typeof rebuildEncirclements3254==='function')
    rebuildEncirclements3254=profile('encirclements',rebuildEncirclements3254);
  if(typeof rebuildFrontSectors3255==='function')
    rebuildFrontSectors3255=profile('fronts',rebuildFrontSectors3255);
  if(typeof rebuildNavalBlockades3270==='function')
    rebuildNavalBlockades3270=profile('naval',rebuildNavalBlockades3270);
  if(typeof ensureEconomySnapshot3261==='function')
    ensureEconomySnapshot3261=profile('economy',ensureEconomySnapshot3261);

  strategicThink3260=function(){
    if(importing){skippedStrategic++;return;}
    return baseStrategic.apply(this,arguments);
  };
  aiNationalCampaignEval3280=function(f,force=false){
    if(importing){skippedNational++;return;}
    if(pendingNation>0){
      if(!started3230||paused3230)return;
      const nation=Number(f);
      if(nation===1){cycleStarted=performance.now();cycleCount=0;}
      if(nation!==pendingNation)return;
      if(cycleCount>0&&performance.now()-cycleStarted>=BUDGET_MS)return;
      // Importing a legacy save without aiCampaigns must not invent fronts
      // until the user explicitly resumes the simulation.
      const out=baseNational.call(this,nation,true);
      cycleCount++;
      pendingNation++;
      if(pendingNation>=activeFactionCount3230)pendingNation=0;
      persistPending();
      return out;
    }
    return baseNational.apply(this,arguments);
  };
  applyPortableFile3275=function(file){
    if(importing)return baseApply.apply(this,arguments);
    const wasPaused=paused3230;
    const isLegacy=!Array.isArray(file?.payload?.aiCampaigns?.fronts);
    const start=performance.now();
    importing++;
    lastError=null;
    mark('apply:begin');
    paused3230=true;
    let success=false;
    try{
      const result=baseApply.apply(this,arguments);
      if(result===false)return result;
      // Snapshot data is authoritative. Missing AI campaigns are future work,
      // not a reason to create routes, wars, and military orders during import.
      pendingNation=isLegacy?1:0;
      persistPending();
      lastMs=performance.now()-start;
      success=true;
      mark('apply:done','ok');
      return result;
    }catch(error){
      lastError=String(error?.message||error);
      mark('apply:failed','error');
      throw error;
    }finally{
      importing--;
      paused3230=success?true:wasPaused;
    }
  };
  if(typeof resetGame3230==='function'){
    const baseReset=resetGame3230;
    resetGame3230=function(){
      const result=baseReset.apply(this,arguments);
      pendingNation=0;
      if(arguments[0]!==false)try{localStorage.removeItem(PENDING_KEY);}catch(_){}
      return result;
    };
  }
  window.HexategosImportScheduler03895=Object.freeze({
    version:'0.38.95',
    status:()=>({stage,importing:!!importing,pendingNation,
      skippedStrategic,skippedNational,lastMs:+lastMs.toFixed(1),
      peakHeap,lastError,
      lastCheckpoint:(()=>{try{return JSON.parse(sessionStorage.getItem(MARKER)||'null')}catch(_){return null}})()})
  });
})();