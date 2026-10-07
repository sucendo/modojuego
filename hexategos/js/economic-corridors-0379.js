'use strict';

// HEXATEGOS 0.37.9 · CORREDORES ECONÓMICOS CONSOLIDADOS.
// Evita pasillos territoriales de una sola casilla: el avance comercial alterna
// progreso hacia el socio con consolidación lateral y nodos urbanos/industriales.
// Todo se apoya en snapshots, muestras y scheduler existentes; no añade timers.
(() => {
  const BUILD='0.37.9';
  const CONSOLIDATE_EVERY=3;
  const DEVELOP_EVERY=6;
  const MAX_FRONTIER_SAMPLES=180;
  const MAX_NODE_SAMPLES=190;
  const MAX_AXIS_EXCESS=5.2;
  const ACTIVE_BELT_EVERY=3;
  const ACTIVE_DEVELOP_EVERY=6;
  const MAX_ACTIVE_ROUTE_SAMPLES=96;

  const corridorCycles=new Uint16Array(FACTIONS3230.length);
  const activeBeltCycles=new Uint16Array(FACTIONS3230.length);
  let consolidationPlans=0,corridorCities=0,corridorIndustries=0,developmentSkips=0;
  let activeBeltPlans=0;

  function roadCell0379(c){
    return c>=0&&typeof aiRoadDegree3260==='function'&&aiRoadDegree3260(c)>0;
  }

  function axisExcess0379(f,targetFaction,c){
    const a=capitals[f],b=capitals[targetFaction];
    if(a<0||b<0||c<0)return 99;
    const direct=angularHeuristic3254(a,b);
    const via=angularHeuristic3254(a,c)+angularHeuristic3254(c,b);
    return Math.max(0,via-direct);
  }

  function localSupport0379(f,c,L){
    let own=0,road=0,neutral=0;
    for(let k=L.offsets[c];k<L.offsets[c+1];k++){
      const n=L.edgeNbr[k];if(n<0)continue;
      const o=owner6[n];
      if(o===f){own++;if(roadCell0379(n))road++}
      else if(o<0&&L.land[n]>=0)neutral++;
    }
    return {own,road,neutral};
  }

  function bestConsolidationStep0379(f,targetFaction){
    const cap=capitals[targetFaction];if(cap<0)return null;
    const snap=aiSnapshot3260,L=loadLevel(MAX_GAME_LEVEL3233);
    const frontier=snap?.frontier?.[f]||[];
    if(!frontier.length)return null;
    const stride=Math.max(1,Math.floor(frontier.length/MAX_FRONTIER_SAMPLES));
    let best=null,bestScore=1e9;
    for(let i=0;i<frontier.length;i+=stride){
      const src=frontier[i];if(owner6[src]!==f)continue;
      const base=angularHeuristic3254(src,cap);
      for(let k=L.offsets[src];k<L.offsets[src+1];k++){
        const n=L.edgeNbr[k];
        if(n<0||L.land[n]<0||owner6[n]>=0)continue;
        const support=localSupport0379(f,n,L);
        if(support.own<2&&support.road<1)continue;
        const d=angularHeuristic3254(n,cap);
        if(d>base+1.9)continue;
        const excess=axisExcess0379(f,targetFaction,n);
        if(excess>MAX_AXIS_EXCESS)continue;
        const tk=terrainKey3250(n);
        let terrainPenalty=0;
        if(tk==='highmountain')terrainPenalty=8;
        else if(tk==='mountain')terrainPenalty=3;
        else if(tk==='ice')terrainPenalty=5;
        const compactBonus=support.own*8.5+support.road*4.5;
        const score=excess*2.2-compactBonus+(d>base?.8:0)+terrainPenalty+
          ((n*29+src*11+f*7)%997)*.0001;
        if(score<bestScore){
          bestScore=score;
          best={src,target:n,score,progress:base-d,consolidation:true,noRoad:true,
            ownSupport:support.own,roadSupport:support.road};
        }
      }
    }
    return best;
  }

  function activeRoutePlan03711(f){
    if(f<=0||f>=activeFactionCount3230)return null;
    const cycle=(activeBeltCycles[f]=(activeBeltCycles[f]+1)%65535||1);

    const all=window.HexategosTradeLogistics0370?.routes?.()||[];
    const land=all.filter(r=>r?.type==='land'&&
      (r.status==='active'||r.status==='smuggling')&&
      (r.a===f||r.b===f)&&Array.isArray(r.path)&&r.path.length>=2);
    if(!land.length)return null;

    const route=land[Math.floor(cycle/ACTIVE_BELT_EVERY+f)%land.length];
    const partner=route.a===f?route.b:route.a;

    // Una ruta madura puede generar nodos económicos sin esperar a que vuelva
    // a existir un proyecto de conexión pendiente.
    if(cycle%ACTIVE_DEVELOP_EVERY===0&&partner>0){
      if(buildCorridorCity0379(f,partner)||buildCorridorIndustry0379(f,partner))
        return {done:true,kind:'active-route-development',routeId:route.id};
    }

    if(cycle%ACTIVE_BELT_EVERY!==0)return null;
    const path=route.path,L=loadLevel(MAX_GAME_LEVEL3233);
    const stride=Math.max(1,Math.floor(path.length/MAX_ACTIVE_ROUTE_SAMPLES));
    let best=null,bestScore=1e9,checked=0;

    for(let i=0;i<path.length&&checked<MAX_ACTIVE_ROUTE_SAMPLES;i+=stride,checked++){
      const src=path[i];
      if(src<0||owner6[src]!==f||!roadCell0379(src))continue;
      for(let k=L.offsets[src];k<L.offsets[src+1];k++){
        const n=L.edgeNbr[k];
        if(n<0||L.land[n]<0||owner6[n]>=0)continue;
        if(typeof aiEnemyNeighbours3260==='function'&&aiEnemyNeighbours3260(f,n)>0)continue;
        const support=localSupport0379(f,n,L);
        if(support.own<2)continue;

        const tk=terrainKey3250(n);
        let terrainPenalty=0;
        if(tk==='highmountain')terrainPenalty=8;
        else if(tk==='mountain')terrainPenalty=3;
        else if(tk==='ice')terrainPenalty=6;

        // El corredor ya existe: aquí importa compactar la franja real,
        // no seguir acercándose a la capital del socio.
        const score=terrainPenalty-support.own*9-support.road*4+
          ((n*31+src*17+f*13)%997)*.0001;
        if(score<bestScore){
          bestScore=score;
          best={src,target:n,score,progress:0,consolidation:true,activeRouteBelt:true,
            noRoad:true,ownSupport:support.own,roadSupport:support.road,routeId:route.id};
        }
      }
    }
    if(best){activeBeltPlans++;return {done:false,kind:'active-route-belt',step:best}}
    return null;
  }

  function nodePool0379(f){
    const snap=aiSnapshot3260,out=[],seen=new Set();
    const add=c=>{
      if(!Number.isInteger(c)||c<0||owner6[c]!==f||seen.has(c)||!roadCell0379(c))return;
      seen.add(c);out.push(c);
    };
    const samples=aiNationalSamples3275?.[f]||[];
    const sStride=Math.max(1,Math.floor(samples.length/MAX_NODE_SAMPLES));
    for(let i=0;i<samples.length&&out.length<MAX_NODE_SAMPLES;i+=sStride)add(samples[i]);
    const frontier=snap?.frontier?.[f]||[];
    const fStride=Math.max(1,Math.floor(frontier.length/Math.max(1,MAX_NODE_SAMPLES-out.length)));
    for(let i=0;i<frontier.length&&out.length<MAX_NODE_SAMPLES;i+=fStride)add(frontier[i]);
    return out;
  }

  function nearestDistance0379(c,list,fallback=-1){
    let d=fallback>=0?angularHeuristic3254(c,fallback):999;
    for(const x of list||[])if(x>=0)d=Math.min(d,angularHeuristic3254(c,x));
    return d;
  }

  function bestCorridorCity0379(f,targetFaction){
    const snap=aiSnapshot3260,cities=snap?.cities?.[f]||[],cap=capitals[f],target=capitals[targetFaction];
    if(cap<0||target<0)return -1;
    let best=-1,bestScore=1e9,checked=0;
    for(const c of nodePool0379(f)){
      if(checked++>=MAX_NODE_SAMPLES)break;
      if(cities3212.has(c)||(cityLevel3230[c]||0)>0||aiEnemyNeighbours3260(f,c)>0)continue;
      const tk=terrainKey3250(c);if(tk==='ice'||tk==='highmountain')continue;
      const excess=axisExcess0379(f,targetFaction,c);if(excess>3.6)continue;
      const dCity=nearestDistance0379(c,cities,cap);if(dCity<4.2)continue;
      const supply=aiLocalSupply3260(f,c);if(supply<22)continue;
      const score=excess*3.4+angularHeuristic3254(c,target)*.06-Math.min(10,dCity)*.24-
        Math.min(70,supply)*.018+((c*23+f*13)%991)*.0001;
      if(score<bestScore){bestScore=score;best=c}
    }
    return best;
  }

  function bestCorridorIndustry0379(f,targetFaction){
    const snap=aiSnapshot3260,industries=snap?.industries?.[f]||[],target=capitals[targetFaction];
    if(target<0)return -1;
    let best=-1,bestScore=1e9;
    for(const c of nodePool0379(f)){
      if((cityLevel3230[c]||0)<1||industries3212.has(c)||(industryLevel3230[c]||0)>0)continue;
      if(aiEnemyNeighbours3260(f,c)>0)continue;
      const excess=axisExcess0379(f,targetFaction,c);if(excess>4.0)continue;
      const dInd=nearestDistance0379(c,industries,-1);if(dInd<2.1)continue;
      const supply=aiLocalSupply3260(f,c);if(supply<26)continue;
      const score=excess*3+angularHeuristic3254(c,target)*.05-Math.min(65,supply)*.02+
        ((c*19+f*31)%983)*.0001;
      if(score<bestScore){bestScore=score;best=c}
    }
    return best;
  }

  function markDevelopment0379(f,c,kind,reason){
    markEconomyDirty3261();aiMarkDirty3260();supplyDirty3220=true;needsRender=true;
    window.HexategosTradeLogistics0370?.refresh?.();
    const st=aiDevState3283?.[f];
    if(st){
      st.lastBuild=campaignSeconds3230||0;
      st.lastCell=c;
      st.nextAction=kind;
      st.reason=reason;
    }
  }

  function buildCorridorCity0379(f,targetFaction){
    const c=bestCorridorCity0379(f,targetFaction);if(c<0)return false;
    const reserve=Math.max(34,Math.min(58,(aiDevState3283?.[f]?.reserve||42)*.78));
    if(botGold3230[f]-80<reserve)return false;
    botGold3230[f]-=80;
    cityLevel3230[c]=Math.max(1,cityLevel3230[c]||0);cities3212.add(c);
    markDevelopment0379(f,c,'CITY','nodo urbano de corredor comercial');
    corridorCities++;return true;
  }

  function buildCorridorIndustry0379(f,targetFaction){
    const c=bestCorridorIndustry0379(f,targetFaction);if(c<0)return false;
    const reserve=Math.max(36,Math.min(62,(aiDevState3283?.[f]?.reserve||44)*.80));
    if(botGold3230[f]-110<reserve)return false;
    botGold3230[f]-=110;
    industryLevel3230[c]=Math.max(1,industryLevel3230[c]||0);industries3212.add(c);
    markDevelopment0379(f,c,'INDUSTRY','industria de corredor comercial');
    corridorIndustries++;return true;
  }

  function serviceDevelopment0379(a,b,sa,sb,cycle){
    if(cycle%DEVELOP_EVERY!==0)return false;
    const sides=[];
    if(sa)sides.push([a,b]);
    if(sb)sides.push([b,a]);
    if(!sides.length)return false;
    if(((cycle/DEVELOP_EVERY)|0)%2===0)sides.reverse();
    for(const [f,target] of sides){
      if(buildCorridorCity0379(f,target))return true;
      if(buildCorridorIndustry0379(f,target))return true;
    }
    developmentSkips++;return false;
  }

  function prepare0379(a,b,sa,sb){
    if(a<=0||b<=0||(!sa&&!sb))return null;
    const cycle=(corridorCycles[a]=(corridorCycles[a]+1)%65535||1);

    if(serviceDevelopment0379(a,b,sa,sb,cycle))return {done:true,kind:'development'};

    if(cycle%CONSOLIDATE_EVERY!==0)return null;
    let ca=sa?bestConsolidationStep0379(a,b):null;
    let cb=sb?bestConsolidationStep0379(b,a):null;
    if(!ca&&!cb)return null;
    const chosen=ca&&cb?(ca.score<=cb.score?{f:a,s:ca}:{f:b,s:cb}):ca?{f:a,s:ca}:{f:b,s:cb};
    consolidationPlans++;
    return {done:false,kind:'consolidation',step:chosen};
  }

  function reset0379(){corridorCycles.fill(0);activeBeltCycles.fill(0)}

  const baseReset0379=resetGame3230;
  resetGame3230=function(){
    const out=baseReset0379.apply(this,arguments);reset0379();return out;
  };
  const baseLoad0379=loadGame3212;
  loadGame3212=function(){
    const out=baseLoad0379.apply(this,arguments);reset0379();return out;
  };

  if(typeof buildPortableFile3275==='function'){
    const basePortableBuild0379=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=basePortableBuild0379.apply(this,arguments);
      if(file)file.gameVersion=BUILD;
      return file;
    };
  }

  function stats0379(){
    let active=0;for(let f=1;f<activeFactionCount3230;f++)if(corridorCycles[f])active++;
    return {build:BUILD,activeProjects:active,consolidationPlans,corridorCities,corridorIndustries,
      developmentSkips,activeBeltPlans,consolidateEvery:CONSOLIDATE_EVERY,developEvery:DEVELOP_EVERY,
      activeBeltEvery:ACTIVE_BELT_EVERY,activeDevelopEvery:ACTIVE_DEVELOP_EVERY,
      maxFrontierSamples:MAX_FRONTIER_SAMPLES,
      maxNodeSamples:MAX_NODE_SAMPLES,maxActiveRouteSamples:MAX_ACTIVE_ROUTE_SAMPLES};
  }

  window.HexategosEconomicCorridors0379={
    version:BUILD,
    prepare:prepare0379,
    activeRoutePlan:activeRoutePlan03711,
    stats:stats0379,
    validate:()=>({ok:true,errors:[],warnings:[],stats:stats0379()})
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.37.9 · corredores económicos consolidados activos');
})();
