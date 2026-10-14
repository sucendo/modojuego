'use strict';
/* HEXATEGOS 0.38.92 · Movilización territorial progresiva.
 * Una sola reserva nacional. La formación militar sigue en 0.38.75.
 * Los frentes y refuerzos terrestres no teletransportan tropas: hasta
 * completar la movilización, los efectivos permanecen comprometidos pero
 * NO participan en combate. Las flotas conservan su tránsito marítimo.
 * Los datos viajan dentro de activeFronts (principal/HXZ2), sin otra sidecar.
 */
(() => {
  if(typeof createFront3230!=='function'||
     typeof frontTick3230!=='function'||
     typeof finishFront3230!=='function'||
     typeof reinforceFront3230!=='function')return;
  const VERSION='0.38.92', MIN_SECONDS=3,MAX_SECONDS=180;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const currentTime=()=>Math.max(0,Number(campaignSeconds3230)||0);
  const validCell=c=>Number.isInteger(c)&&c>=0&&c<owner6.length;
  const owned=c=>validCell(c)&&owner6[c]===0;
  const amount=v=>Number.isFinite(v)&&v>0?v:0;
  const waiting=front=>{
    const start=amount(front?.mobilization03892?.troops);
    const incoming=Array.isArray(front?.reinforcements03892)?
      front.reinforcements03892.reduce((n,r)=>n+amount(r?.troops),0):0;
    return start+incoming;
  };
  function launchCell(front){
    if(owned(front?.sourceAnchor))return front.sourceAnchor;
    if(owned(front?.lastSrc))return front.lastSrc;
    if(Array.isArray(front?.route))
      for(const cell of front.route)if(owned(cell))return cell;
    return -1;
  }
  function geodesicKilometres(a,b){
    try{
      const L=loadLevel(MAX_GAME_LEVEL3233),C=L.centers;
      if(!validCell(a)||!validCell(b)||!C)return NaN;
      const i=a*3,j=b*3;
      const dot=(C[i]*C[j]+C[i+1]*C[j+1]+C[i+2]*C[j+2])/(32767*32767);
      return Math.acos(clamp(dot,-1,1))*6371;
    }catch(_){return NaN}
  }
  function delayFor(source){
    const capital=capitals?.[0];
    if(!owned(source))return MAX_SECONDS;
    if(!owned(capital))return 20;
    if(source===capital)return MIN_SECONDS;
    // Coste de ruta solo al emitir la orden (nunca por frame/tick).
    // La carretera reduce el tiempo; montaña y desvíos lo aumentan.
    let path=null;
    try{
      if(typeof findOwnedPath3212==='function')
        path=findOwnedPath3212(capital,source);
    }catch(error){console.warn('[HEXATEGOS movilización] Ruta terrestre no disponible',error)}
    if(path?.length){
      let cost=0;
      for(let i=1;i<path.length;i++){
        const a=path[i-1],b=path[i],road=typeof roadEdgeSet3212!=='undefined'&&
          typeof edgeKey3212==='function'&&roadEdgeSet3212.has(edgeKey3212(a,b));
        const mountain=typeof mountainTier3212!=='undefined'?
          Math.max(0,Number(mountainTier3212[b])||0):0;
        cost+=(road?.42:1.15)*(1+mountain*.12);
      }
      return clamp(Math.ceil(MIN_SECONDS+cost),MIN_SECONDS,MAX_SECONDS);
    }
    // Enclaves insulares o inconexos: movilización interregional lenta.
    // No fingimos una ruta terrestre; el traslado marítimo detallado será
    // una evolución posterior. Nunca se concede llegada instantánea.
    const km=geodesicKilometres(capital,source);
    return clamp(Math.ceil(22+(Number.isFinite(km)?km/36:42)),22,MAX_SECONDS);
  }
  function saveAndRefresh(){
    if(typeof updateFrontDock3220==='function')updateFrontDock3220(true);
    if(typeof updateUI3230==='function')updateUI3230();
    if(typeof needsRender!=='undefined')needsRender=true;
    if(typeof saveGame3212==='function'&&saveGame3212()===false)
      console.warn('[HEXATEGOS movilización] No se pudo persistir la orden');
  }
  function stage(front,source){
    if(!front||front.kind==='beach'||amount(front.pool)<=0)return front;
    const n=front.pool,seconds=delayFor(source),now=currentTime();
    front.mobilization03892={troops:n,source,createdAt:now,readyAt:now+seconds};
    front.pool=0;
    front.status='movilización · '+seconds+' s';
    if(typeof toast==='function')toast(Math.floor(n)+' reservistas en movilización · ETA '+seconds+' s');
    saveAndRefresh();
    return front;
  }
  const createBase=createFront3230;
  createFront3230=function(target,poolOverride=null,kindOverride=null){
    const front=createBase.apply(this,arguments);
    // Una cabeza de playa ya esperó al transporte naval. No duplicar tiempo.
    return poolOverride===null?stage(front,launchCell(front)):front;
  };
  if(typeof createFrontFromSource3245==='function'){
    const sourceBase=createFrontFromSource3245;
    createFrontFromSource3245=function(source,target){
      const front=sourceBase.apply(this,arguments);
      return stage(front,source);
    };
  }
  const reinforceBase=reinforceFront3230;
  reinforceFront3230=function(id){
    const front=activeFronts3230.find(f=>f.id===id);
    if(!front)return reinforceBase.apply(this,arguments);
    const before=amount(front.pool);
    const result=reinforceBase.apply(this,arguments);
    const added=Math.max(0,amount(front.pool)-before);
    if(added>0){
      const source=launchCell(front),now=currentTime(),delay=delayFor(source);
      front.pool-=added;
      if(!Array.isArray(front.reinforcements03892))front.reinforcements03892=[];
      front.reinforcements03892.push({troops:added,source,createdAt:now,readyAt:now+delay});
      if(typeof toast==='function')toast(Math.floor(added)+' refuerzos en camino · ETA '+delay+' s');
      saveAndRefresh();
    }
    return result;
  };
  const finishBase=finishFront3230;
  finishFront3230=function(front,msg,returnFactor=1){
    if(!front)return finishBase.apply(this,arguments);
    // Un soldado que todavía no combatió nunca puede desaparecer de la
    // reserva por cancelar, perder o completar antes un frente.
    const stranded=waiting(front);
    if(stranded>0){
      troops3230[0]+=stranded;
      delete front.mobilization03892;
      delete front.reinforcements03892;
    }
    return finishBase.apply(this,arguments);
  };
  const frontTickBase=frontTick3230;
  frontTick3230=function(front){
    if(!front)return frontTickBase.apply(this,arguments);
    const now=currentTime(),pending=front.mobilization03892;
    if(amount(pending?.troops)>0){
      if(now+1e-7<pending.readyAt){
        front.status='movilización · '+Math.ceil(pending.readyAt-now)+' s';
        return;
      }
      front.pool+=pending.troops;
      delete front.mobilization03892;
      if(typeof toast==='function')toast(Math.floor(pending.troops)+' reservistas incorporados al frente');
    }
    const arrivals=front.reinforcements03892;
    if(Array.isArray(arrivals)&&arrivals.length){
      let delivered=0;
      front.reinforcements03892=arrivals.filter(r=>{
        if(now+1e-7<(Number(r.readyAt)||0))return true;
        delivered+=amount(r.troops);
        return false;
      });
      if(delivered>0){
        front.pool+=delivered;
        if(typeof toast==='function')toast(Math.floor(delivered)+' refuerzos incorporados');
      }
      if(!front.reinforcements03892.length)delete front.reinforcements03892;
    }
    if(front.pool<1&&waiting(front)>0){
      const eta=Math.max(0,Math.ceil(Math.min(
        ...(front.reinforcements03892||[]).map(x=>x.readyAt-now))));
      front.status='esperando refuerzos · '+eta+' s';
      return;
    }
    return frontTickBase.apply(this,arguments);
  };
  window.HexategosMobilization03892=Object.freeze({
    version:VERSION,waiting,delayFor,
    status:()=>activeFronts3230.map(front=>({
      id:front.id,active:amount(front.pool),inTransit:waiting(front),
      eta:Math.max(0,Math.ceil(Math.min(
        ...(front.mobilization03892?[front.mobilization03892.readyAt]:[])
          .concat((front.reinforcements03892||[]).map(x=>x.readyAt)).map(x=>x-currentTime()),
        Infinity)))
    }))
  });
})();
