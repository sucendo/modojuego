'use strict';
// HEXATEGOS 0.38.77 · Colonización de frontera neutral, calibrada y acotada.
// La malla se cuenta solo una vez; las fronteras se mantienen en una cola
// incremental muy pequeña por nación. Sin intervalos ni recursos ocultos.
(() => {
  const BUILD='0.38.77',N=FACTIONS3230.length;
  const COST_GOLD=.42,COST_TROOP=.10,RESERVE_GOLD=6,RESERVE_TROOP=8;
  const PERIOD=6,MAX_RECENT=48,MAX_PER_VISIT=20,MAX_SOURCES=12;
  const next=new Float64Array(N),recent=Array.from({length:N},()=>[]);
  const claims=new Uint32Array(N);
  let terrainCache=null,coastCache=null,landTotal=0,cursor=1;
  let successes=0,blockedByBudget=0,staleCandidates=0,lastMs=0,lastCells=0;
  let visits=0,scored=0,overBudget=0,lastVisits=0;
  const milestones=[];
  const max=Math.max,min=Math.min;
  const hash=x=>{
    x=(x|0)>>>0;
    x=Math.imul(x^(x>>>16),0x7feb352d);
    x=Math.imul(x^(x>>>15),0x846ca68b);
    return (x^(x>>>16))>>>0;
  };
  function world(L){
    if(terrainCache&&terrainCache.length===L.n)return;
    terrainCache=new Uint8Array(L.n);coastCache=new Uint8Array(L.n);
    landTotal=0;
    for(let i=0;i<L.n;i++)if(L.land[i]>=0)landTotal++;
  }
  const TERRAIN={
    plain:5,mediterranean:5,savanna:4,steppe:3,forest:4,
    rainforest:3,jungle:3,desert:1,tundra:1,ice:0,
    mountain:1,highmountain:0
  };
  function terrainScore(t){
    const known=terrainCache[t];
    if(known)return known-3;
    const key=typeof terrainKey3250==='function'?terrainKey3250(t):'plain';
    const score=Object.prototype.hasOwnProperty.call(TERRAIN,key)?TERRAIN[key]:3;
    // 1..6 = terrain score from 0..5, survives cache without allocations.
    terrainCache[t]=score+1;
    return score-2;
  }
  function coastal(t){
    if(!coastCache[t])coastCache[t]=typeof isCoastal3212==='function'&&isCoastal3212(t)?2:1;
    return coastCache[t]===2;
  }
  function surroundings(f,t,L){
    let own=0,foreign=0,neutral=0;
    for(let k=L.offsets[t];k<L.offsets[t+1];k++){
      const c=L.edgeNbr[k];
      if(c<0||L.land[c]<0)continue;
      const o=owner6[c];if(o===f)own++;else if(o===-1)neutral++;else foreign++;
    }
    return {own,foreign,neutral};
  }
  function priority(f,t,L){
    if(!L||t<0||t>=L.n||owner6[t]!==-1||L.land[t]<0)return -1e9;
    world(L);
    const near=surroundings(f,t,L);
    if(!near.own)return -1e9;
    const land=terrainScore(t);
    // No geography, agronomy or mineral report belonging to another nation.
    // The surface terrain type and shoreline are publicly visible.
    const coast=coastal(t);
    const mountain=typeof mountainTier3212!=='undefined'?(mountainTier3212[t]||0):0;
    // Strongly discourage exposed fingers while closing existing pockets.
    const compact=near.own===1?-1.1:near.own===2?2.2:near.own*2.15;
    return 5.1+land*1.35+compact+
      (coast?2.1:0)-near.foreign*.85-
      (mountain>=3?2.4:mountain>=2?.65:0)+
      hash(t*31+f*79)%97*.006;
  }
  function candidate(f,snap,L){
    const border=snap?.frontier?.[f],tail=recent[f];
    let best=-1,high=-1e9;
    if(!border?.length&&!tail.length)return -1;
    const visit=(origin)=>{
      if(origin<0||origin>=L.n||owner6[origin]!==f)return;
      for(let k=L.offsets[origin];k<L.offsets[origin+1];k++){
        const t=L.edgeNbr[k];
        if(t<0||L.land[t]<0||owner6[t]!==-1)continue;
        const value=priority(f,t,L);
        scored++;
        if(value>high){high=value;best=t}
      }
    };
    // Mix a few snapshot border cells with the recent settlement ring.
    // This adds new territory without waiting for a global AI snapshot.
    if(border?.length){
      const span=min(MAX_SOURCES,border.length);
      const origin=hash(f*199+Math.floor(campaignSeconds3230/12))%border.length;
      const stride=max(1,Math.floor(border.length/span));
      for(let j=0;j<span;j++)visit(border[(origin+j*stride)%border.length]);
    }
    if(tail.length){
      const span=min(20,tail.length);
      const seed=hash(f*719+Math.floor(campaignSeconds3230));
      for(let j=0;j<span;j++)visit(tail[(tail.length-1-j*3+tail.length*3+seed%3)%tail.length]);
    }
    return best;
  }
  function attempt(f,snap,L,count){
    if(f<=0||f>=activeFactionCount3230||owner6[capitals[f]]!==f)return 0;
    const now=campaignSeconds3230;
    if(now<next[f])return 0;
    next[f]=now+PERIOD+(f%4)*.08;
    let available=0;
    const threat=snap?.capThreat?.[f];
    const hostile=snap?.hostileBorder?.[f]||0,neutral=snap?.neutralBorder?.[f]||0;
    const factor=threat!=null&&threat<12?.15:hostile>neutral*2&&hostile>5?.45:1;
    const limit=max(1,Math.floor(count*factor));
    for(let j=0;j<limit;j++){
      const gold=Number(botGold3230[f])||0,troops=Number(troops3230[f])||0;
      if(gold<COST_GOLD+RESERVE_GOLD||troops<COST_TROOP+RESERVE_TROOP){
        blockedByBudget++;break;
      }
      const t=candidate(f,snap,L);
      if(t<0){staleCandidates++;break}
      // Single authority: owning another faction's land always requires war.
      if(owner6[t]!==-1||L.land[t]<0)break;
      botGold3230[f]=gold-COST_GOLD;
      troops3230[f]=troops-COST_TROOP;
      owner6[t]=f;claims[f]++;successes++;available++;
      const tail=recent[f];tail.push(t);if(tail.length>MAX_RECENT)tail.shift();
      window.HexategosWorldCore03828?.emit?.('ownership',{cell:t,f,from:-1});
    }
    if(available){
      cacheDirty=true;supplyDirty3220=true;aiSnapshotDirty3260=true;
      if(typeof markEconomyDirty3261==='function')markEconomyDirty3261();
    }
    return available;
  }
  function coverage(){
    const territory=aiSnapshot3260?.territory;
    if(!territory?.length||!landTotal)return null;
    let owned=0;
    for(let f=0;f<min(territory.length,activeFactionCount3230);f++)
      owned+=Math.max(0,Number(territory[f])||0);
    return {owned,land:landTotal,percentage:+(100*owned/landTotal).toFixed(2),
      source:'Última instantánea de IA (puede llevar hasta 12 s de retraso)'};
  }
  const baseAI=aiTick3212;
  aiTick3212=function(){
    const result=baseAI.apply(this,arguments);
    if(paused3230||!started3230||gameSpeed3212<=0)return result;
    const snap=aiSnapshot3260;
    if(!snap?.frontier)return result;
    const start=performance.now(),L=loadLevel(MAX_GAME_LEVEL3233);
    world(L);
    const nations=max(1,activeFactionCount3230-1);
    const visitedPerTick=max(8,Math.ceil(nations/PERIOD));
    // Target ~65% of actual terrestrial hexes in five campaign minutes,
    // conditional on treasury, contested borders and CPU budget.
    const perVisit=max(1,min(MAX_PER_VISIT,
      Math.ceil(landTotal*.65*PERIOD/(300*nations))));
    let n=0,scanned=0,settled=0;
    while(n<visitedPerTick&&scanned<nations){
      // Hard CPU limit is for this module ONLY; main AI retains its own budget.
      if(n>=6&&performance.now()-start>=3.1){overBudget++;break}
      if(cursor<=0||cursor>=activeFactionCount3230)cursor=1;
      const f=cursor++;scanned++;
      if(campaignSeconds3230<next[f])continue;
      settled+=attempt(f,snap,L,perVisit);
      n++;visits++;
    }
    lastMs=performance.now()-start;lastCells=settled;lastVisits=n;
    const now=campaignSeconds3230;
    for(const [index,minute] of [5,10,20].entries()){
      const threshold=minute*60;
      if(!milestones[index]&&now>=threshold&&now<threshold+12){
        const observed=coverage();
        milestones[index]={minute,seconds:now,occupiedPct:observed?.percentage??null,
          occupied:observed?.owned??null,settlements:successes,
          moduleMs:+lastMs.toFixed(3)};
      }
    }
    if(settled)needsRender=true;
    return result;
  };
  function clear(){
    next.fill(0);claims.fill(0);for(const tail of recent)tail.length=0;
    cursor=1;lastMs=0;lastCells=0;lastVisits=0;
    successes=0;blockedByBudget=0;staleCandidates=0;
    visits=0;scored=0;overBudget=0;milestones.length=0;
    // Terrain remains valid across owners; clear on new seed for safety.
    terrainCache=null;coastCache=null;landTotal=0;
  }
  if(typeof resetGame3230==='function'){
    const base=resetGame3230;
    resetGame3230=function(){const out=base.apply(this,arguments);clear();return out};
  }
  if(typeof loadGame3212==='function'){
    const base=loadGame3212;
    loadGame3212=function(){const out=base.apply(this,arguments);if(out!==false)clear();return out};
  }
  window.HexategosExpansion03876=Object.freeze({
    version:BUILD,priority,coverage,preview:(f,snap=aiSnapshot3260)=>{
      const L=loadLevel(MAX_GAME_LEVEL3233);world(L);
      return candidate(f,snap,L);
    },
    stats:()=>({version:BUILD,lastMs,lastCells,total:successes,blockedByBudget,
      staleCandidates,visits,scored,overBudget,lastVisits,
      landCount:landTotal,cursor,milestones:milestones.map(row=>row?{...row}:null)})
  });
})();