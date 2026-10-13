'use strict';
// HEXATEGOS 0.38.76 · Colonización civil estratégica de territorio neutral.
// No declara guerras ni inventa reservas: expansión contigua, financiada,
// escalonada por la IA existente y con una ventana CPU compartida.
(() => {
  const BUILD='0.38.76',N=FACTIONS3230.length;
  const next=new Float64Array(N),lastCell=new Int32Array(N).fill(-1);
  let cursor=1,lastMs=0,lastCells=0,success=0,failBudget=0,frontierCursor=0;
  const COST_GOLD=1.25,COST_TROOP=.10;
  const min=(a,b)=>Math.min(a,b),max=(a,b)=>Math.max(a,b);
  const hash=x=>{x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return (x^(x>>>16))>>>0};
  function neighbors(f,t,L){
    let own=0,enemy=0,neutral=0;
    for(let k=L.offsets[t];k<L.offsets[t+1];k++){
      const c=L.edgeNbr[k];if(c<0||L.land[c]<0)continue;
      if(owner6[c]===f)own++;
      else if(owner6[c]<0)neutral++;else enemy++;
    }
    return {own,enemy,neutral};
  }
  function priority(f,t,L){
    if(t<0||owner6[t]>=0||L.land[t]<0)return -1e9;
    const near=neighbors(f,t,L);
    if(!near.own)return -1e9;
    const natural=window.HexategosNaturalPotential03829;
    const geo=natural?.profile?.(t);
    // Only surface fertility, visible forest and coast; no hidden deposits.
    const farm=max(0,Math.min(2.5,Number(geo?.food)||0));
    const forestry=max(0,Math.min(2.5,Number(geo?.forest)||0));
    const coast=typeof isCoastal3212==='function'&&isCoastal3212(t);
    const mountains=typeof mountainTier3212!=='undefined'?mountainTier3212[t]||0:0;
    const mountainPenalty=mountains>=3?1.5:mountains>=2?.6:0;
    // A two-cell connection creates compact borders. One-neighbor protrusions
    // are justified only by geography or a valuable coast.
    return near.own*2.9+farm*1.8+forestry*.36+(coast?3.6:0)
      -near.enemy*.7-mountainPenalty
      +(hash(t*31+f*79)%97)*.009;
  }
  function candidate(f,snap,L){
    const frontier=snap?.frontier?.[f];
    if(!Array.isArray(frontier)||!frontier.length)return -1;
    const stride=max(1,Math.floor(frontier.length/70));
    let best=-1,score=-1e9;
    const offset=hash((f+1)*733+Math.floor(campaignSeconds3230/12))%stride;
    for(let i=offset;i<frontier.length;i+=stride){
      const src=frontier[i];if(owner6[src]!==f)continue;
      for(let k=L.offsets[src];k<L.offsets[src+1];k++){
        const t=L.edgeNbr[k];if(t<0||owner6[t]>=0||L.land[t]<0)continue;
        const value=priority(f,t,L);
        if(value>score){score=value;best=t}
      }
    }
    return best;
  }
  function attempt(f,snap,L){
    if(f<=0||f>=activeFactionCount3230||owner6[capitals[f]]!==f)return false;
    const now=campaignSeconds3230;
    if(now<next[f])return false;
    next[f]=now+3.6+(f%11)*.20;
    const gold=Number(botGold3230[f])||0,troops=Number(troops3230[f])||0;
    if(gold<COST_GOLD+5||troops<COST_TROOP+8){failBudget++;return false}
    const t=candidate(f,snap,L);
    if(t<0)return false;
    const frontier=neighbors(f,t,L);
    if(!frontier.own)return false;
    // Recheck ownership in case a previous faction expanded during this frame.
    if(owner6[t]>=0)return false;
    // The front expands by civil settlement, but still costs real gold and
    // available military escort. No free troop minting or foreign conquest.
    botGold3230[f]-=COST_GOLD;
    troops3230[f]-=COST_TROOP;
    owner6[t]=f;lastCell[f]=t;success++;
    cacheDirty=true;supplyDirty3220=true;aiSnapshotDirty3260=true;
    if(typeof markEconomyDirty3261==='function')markEconomyDirty3261();
    window.HexategosWorldCore03828?.emit?.('ownership', {cell:t,f,from:-1});
    return true;
  }
  const oldTick=aiTick3212;
  aiTick3212=function(){
    const result=oldTick.apply(this,arguments);
    if(paused3230||!started3230||gameSpeed3212<=0)return result;
    const t0=performance.now();
    const snap=aiSnapshot3260;
    if(!snap?.frontier)return result;
    const L=loadLevel(MAX_GAME_LEVEL3233);
    const budget=activeFactionCount3230>=350?14:activeFactionCount3230>=250?12:10;
    let served=0,scanned=0;lastCells=0;
    while(served<budget&&scanned<activeFactionCount3230-1){
      if(performance.now()-t0>2.4&&served>=4)break;
      if(cursor<=0||cursor>=activeFactionCount3230)cursor=1;
      const f=cursor++;scanned++;
      if(campaignSeconds3230<next[f])continue;
      if(attempt(f,snap,L))lastCells++;
      served++;
    }
    if(lastCells)needsRender=true;
    lastMs=performance.now()-t0;
    return result;
  };
  const reset=resetGame3230;
  resetGame3230=function(){
    const out=reset.apply(this,arguments);
    next.fill(0);lastCell.fill(-1);cursor=1;success=0;failBudget=0;
    return out;
  };
  window.HexategosExpansion03876=Object.freeze({
    version:BUILD,priority,preview:(f,snap=aiSnapshot3260)=>{
      const L=loadLevel(MAX_GAME_LEVEL3233);
      return candidate(f,snap,L);
    },
    stats:()=>({lastMs,lastCells,total:success,blockedByBudget:failBudget,cursor})
  });
})();