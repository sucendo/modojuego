'use strict';

// HEXATEGOS 0.37.5 · IA CIVIL + CORREDORES COMERCIALES.
// Corrige tres bloqueos observables:
// 1) diplomacia comercial que podía quedarse sin CPU con 350/500 naciones;
// 2) tratados sin infraestructura física hacia la frontera;
// 3) desarrollo civil que podía quedar sin candidatos tras la fase inicial.
(() => {
  const BUILD='0.37.5';
  const DIPLOMACY_SERVICE_SECONDS=3;
  const COMMERCE_RETRY_SECONDS=14;
  const CIVIL_WATCHDOG_SECONDS=30;
  const MAX_BORDER_SAMPLES=260;

  let lastDiplomacyService=-1e9;
  const nextCommerceTry=new Float64Array(FACTIONS3230.length);
  const lastCivilBuild=new Float64Array(FACTIONS3230.length);
  const civilStalls=new Uint16Array(FACTIONS3230.length);
  let corridorBuilds=0,watchdogBuilds=0,diplomacyServices=0;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function tradeRelation0375(a,b){
    const statecraft=window.HexategosStatecraft0380;
    if(statecraft?.canTrade)return !!statecraft.canTrade(a,b);
    const r=diplomaticRelation3300(a,b);
    return r===1||r===2||r===3;
  }

  function tradePartners0375(f){
    const out=new Set();
    const net=window.HexategosDiplomacyNetwork3301;
    let src=null;
    try{
      src=net?.targetsRef?net.targetsRef(f):net?.targets?net.targets(f):null;
    }catch(_){src=null}
    if(src)for(const o of src)if(o!==f)out.add(o);

    // Las fronteras reales siempre entran en la muestra, aunque la caché
    // diplomática todavía no las haya incorporado.
    const snap=aiSnapshot3260;
    const frontier=snap?.frontier?.[f]||[];
    const L=loadLevel(MAX_GAME_LEVEL3233);
    const stride=Math.max(1,Math.floor(frontier.length/MAX_BORDER_SAMPLES));
    for(let i=0;i<frontier.length;i+=stride){
      const c=frontier[i];if(owner6[c]!==f)continue;
      for(let k=L.offsets[c];k<L.offsets[c+1];k++){
        const n=L.edgeNbr[k],o=n>=0?owner6[n]:-1;
        if(o>=0&&o!==f)out.add(o);
      }
    }
    return [...out].filter(o=>o>=0&&o<activeFactionCount3230&&tradeRelation0375(f,o));
  }

  function sharedPhysicalRoad0375(f,o){
    const api=window.HexategosTradeLogistics0370;
    if(!api?.roadComponent)return false;
    const comps=new Set();
    const addPartner=c=>{
      if(c>=0&&owner6[c]===o){
        const id=api.roadComponent(c);if(id>=0)comps.add(id);
      }
    };
    addPartner(capitals[o]);
    const snap=aiSnapshot3260;
    for(const c of snap?.cities?.[o]||[])addPartner(c);
    for(const c of snap?.industries?.[o]||[])addPartner(c);
    for(const c of snap?.ports?.[o]||[])addPartner(c);
    if(!comps.size)return false;

    const hasOwn=c=>c>=0&&owner6[c]===f&&comps.has(api.roadComponent(c));
    if(hasOwn(capitals[f]))return true;
    for(const c of snap?.cities?.[f]||[])if(hasOwn(c))return true;
    for(const c of snap?.industries?.[f]||[])if(hasOwn(c))return true;
    for(const c of snap?.ports?.[f]||[])if(hasOwn(c))return true;
    return false;
  }

  function borderPair0375(f,o){
    const snap=aiSnapshot3260;
    const frontier=snap?.frontier?.[f]||[];
    if(!frontier.length)return null;
    const L=loadLevel(MAX_GAME_LEVEL3233);
    const capF=capitals[f],capO=capitals[o];
    const stride=Math.max(1,Math.floor(frontier.length/MAX_BORDER_SAMPLES));
    let best=null,bestScore=1e9;
    for(let i=0;i<frontier.length;i+=stride){
      const c=frontier[i];if(owner6[c]!==f)continue;
      for(let k=L.offsets[c];k<L.offsets[c+1];k++){
        const n=L.edgeNbr[k];if(n<0||owner6[n]!==o)continue;
        const ownRoad=aiRoadDegree3260(c)>0,otherRoad=aiRoadDegree3260(n)>0;
        let score=0;
        if(capF>=0)score+=angularHeuristic3254(c,capF);
        if(capO>=0)score+=angularHeuristic3254(n,capO);
        if(ownRoad)score-=26;
        if(otherRoad)score-=38; // encontrarse con una carretera ya llevada a frontera
        // Desempate determinista y simétrico para que dos IA converjan al mismo paso.
        score+=((Math.min(c,n)*31+Math.max(c,n)*17)%997)*.0001;
        if(score<bestScore){bestScore=score;best={own:c,other:n,ownRoad,otherRoad,score}}
      }
    }
    return best;
  }

  function ownInfrastructureNodes0375(f){
    const out=[],seen=new Set(),snap=aiSnapshot3260;
    const add=c=>{if(Number.isInteger(c)&&c>=0&&owner6[c]===f&&!seen.has(c)){seen.add(c);out.push(c)}};
    add(capitals[f]);
    for(const c of snap?.cities?.[f]||[])add(c);
    for(const c of snap?.industries?.[f]||[])add(c);
    for(const c of snap?.ports?.[f]||[])add(c);
    return out;
  }

  function nearestRoadSource0375(f,target){
    const nodes=ownInfrastructureNodes0375(f);
    if(!nodes.length)return -1;
    let best=-1,bestScore=1e9;
    for(const c of nodes){
      if(c===target)continue;
      let score=angularHeuristic3254(c,target);
      if(aiRoadDegree3260(c)>0)score-=18;
      if(c===capitals[f])score-=3;
      if(score<bestScore){bestScore=score;best=c}
    }
    return best;
  }

  function buildRoadPath0375(f,source,target,reserve,reason){
    if(source<0||target<0||source===target||owner6[source]!==f||owner6[target]!==f)return false;
    const path=findOwnedStrategicPath3275(f,source,target);
    if(!path||path.length<2||path.length>190)return false;
    let fresh=0;
    for(let i=1;i<path.length;i++)if(!roadEdgeSet3212.has(edgeKey3212(path[i-1],path[i])))fresh++;
    if(fresh<1)return false;
    const cost=Math.max(12,Math.round(fresh*3));
    if(botGold3230[f]-cost<reserve)return false;
    botGold3230[f]-=cost;
    roads3212.push(path);rebuildRoadEdges3212();
    markEconomyDirty3261();aiMarkDirty3260();supplyDirty3220=true;
    window.HexategosTradeLogistics0370?.refresh?.();
    const st=aiDevState3283?.[f];
    if(st){st.lastBuild=campaignSeconds3230;st.lastCell=target;st.nextAction='ROAD';st.reason=reason}
    lastCivilBuild[f]=campaignSeconds3230;
    return true;
  }

  function tryCommercialCorridor0375(f){
    const now=campaignSeconds3230||0;
    if(now<nextCommerceTry[f])return false;
    nextCommerceTry[f]=now+COMMERCE_RETRY_SECONDS+(f%5)*1.1;
    if(f<=0||f>=activeFactionCount3230||botGold3230[f]<42)return false;

    const partners=tradePartners0375(f);
    if(!partners.length)return false;
    // Growth/commercial IAs prueban primero; las demás también reaccionan a una
    // carretera que ya les espera en la frontera.
    const mindset=window.HexategosNationAI0360?.mindset?.(f)||'';
    const role=FACTIONS3230[f]?.role||'balanced';

    let best=null;
    for(const o of partners){
      if(sharedPhysicalRoad0375(f,o)){
        window.HexategosTradeLogistics0370?.ensureLandRoute?.(Math.min(f,o),Math.max(f,o));
        continue;
      }
      const pair=borderPair0375(f,o);if(!pair)continue;
      let priority=(pair.otherRoad?42:0)+(mindset==='commercial'?15:0)+(role==='growth'?10:0)+(o===0?3:0)-pair.score*.02;
      if(!best||priority>best.priority)best={o,pair,priority};
    }
    if(!best)return false;
    if(!best.pair.otherRoad&&mindset!=='commercial'&&role!=='growth'&&best.priority<3)return false;

    // Llegar a la frontera NO une automáticamente las dos redes.
    // IA↔IA puede construir la aduana explícita; jugador↔IA espera al botón
    // CONEXIÓN TERRESTRE del jugador.
    if(best.pair.ownRoad){
      if(best.pair.otherRoad&&f>0&&best.o>0){
        const made=window.HexategosBorderRoad0376?.createAI?.(
          best.pair.own,best.pair.other,f,best.o
        );
        if(made)window.HexategosTradeLogistics0370?.ensureLandRoute?.(Math.min(f,best.o),Math.max(f,best.o));
        return !!made;
      }
      return false;
    }

    const source=nearestRoadSource0375(f,best.pair.own);
    const reserve=Math.max(24,Math.min(55,(aiDevState3283?.[f]?.reserve||42)*.72));
    if(!buildRoadPath0375(f,source,best.pair.own,reserve,'corredor comercial fronterizo'))return false;
    corridorBuilds++;
    if(best.pair.otherRoad&&f>0&&best.o>0){
      const made=window.HexategosBorderRoad0376?.createAI?.(
        best.pair.own,best.pair.other,f,best.o
      );
      if(made)window.HexategosTradeLogistics0370?.ensureLandRoute?.(Math.min(f,best.o),Math.max(f,best.o));
    }
    return true;
  }

  function isolatedStructure0375(f){
    const snap=aiSnapshot3260;
    const cap=capitals[f];
    const seen=new Set();
    const candidates=[];
    const add=(c,w)=>{
      if(!Number.isInteger(c)||c<0||c===cap||owner6[c]!==f||seen.has(c))return;
      seen.add(c);if(aiRoadDegree3260(c)<=0)candidates.push({c,w});
    };
    for(const c of snap?.cities?.[f]||[])add(c,6+(cityLevel3230[c]||1)*2);
    for(const c of snap?.industries?.[f]||[])add(c,5+(industryLevel3230[c]||1)*2);
    for(const c of snap?.ports?.[f]||[])add(c,5);
    candidates.sort((a,b)=>b.w-a.w);
    return candidates[0]?.c??-1;
  }

  function tryRepairCommunications0375(f){
    const target=isolatedStructure0375(f);if(target<0)return false;
    const source=nearestRoadSource0375(f,target);if(source<0)return false;
    const reserve=Math.max(22,Math.min(48,(aiDevState3283?.[f]?.reserve||40)*.65));
    return buildRoadPath0375(f,source,target,reserve,'reconectar infraestructura aislada');
  }

  function fallbackCity0375(f,targets,counts){
    if(counts.cities>=targets.targetCities||botGold3230[f]<104)return false;
    const samples=aiNationalSamples3275?.[f]||[];
    let best=-1,bestScore=-1e9,checked=0;
    for(const c of samples){
      if(checked++>190)break;
      if(owner6[c]!==f||cities3212.has(c)||encircledMask3254?.[c]||aiEnemyNeighbours3260(f,c)>0)continue;
      const tk=terrainKey3250(c);if(tk==='ice'||tk==='highmountain')continue;
      let d=999;
      for(const x of aiSnapshot3260?.cities?.[f]||[])d=Math.min(d,angularHeuristic3254(c,x));
      if(d<2.2)continue;
      const supply=aiLocalSupply3260(f,c);if(supply<25)continue;
      let sc=supply*.05+Math.min(5,d*.22)+aiRoadDegree3260(c)*2.2;
      if(tk==='plain'||tk==='mediterranean'||tk==='forest')sc+=1;
      if(sc>bestScore){bestScore=sc;best=c}
    }
    if(best<0)return false;
    const reserve=Math.max(22,Math.min(45,(aiDevState3283?.[f]?.reserve||40)*.6));
    if(botGold3230[f]-80<reserve)return false;
    botGold3230[f]-=80;cityLevel3230[best]=Math.max(1,cityLevel3230[best]||0);cities3212.add(best);
    markEconomyDirty3261();aiMarkDirty3260();supplyDirty3220=true;
    lastCivilBuild[f]=campaignSeconds3230;watchdogBuilds++;
    return true;
  }

  function fallbackIndustry0375(f,targets,counts){
    if(counts.industries>=targets.targetIndustries||botGold3230[f]<132)return false;
    const pool=[],seen=new Set(),snap=aiSnapshot3260;
    const add=c=>{if(Number.isInteger(c)&&c>=0&&owner6[c]===f&&!seen.has(c)){seen.add(c);pool.push(c)}};
    for(const c of snap?.cities?.[f]||[])add(c);
    for(const c of snap?.ports?.[f]||[])add(c);
    for(const c of aiNationalSamples3275?.[f]||[]){if(pool.length>=160)break;if(aiRoadDegree3260(c)>0)add(c)}
    let best=-1,bestScore=-1e9;
    for(const c of pool){
      if(industryLevel3230[c]>0||encircledMask3254?.[c]||aiEnemyNeighbours3260(f,c)>0)continue;
      const supply=aiLocalSupply3260(f,c);if(supply<28)continue;
      let d=999;for(const x of aiSnapshot3260?.industries?.[f]||[])d=Math.min(d,angularHeuristic3254(c,x));
      if(d<1.8)continue;
      const sc=supply*.055+aiRoadDegree3260(c)*1.9+(cityLevel3230[c]||0)*2.2+(ports3212.has(c)?1.2:0)+Math.min(3,d*.18);
      if(sc>bestScore){bestScore=sc;best=c}
    }
    if(best<0)return false;
    const reserve=Math.max(22,Math.min(45,(aiDevState3283?.[f]?.reserve||40)*.6));
    if(botGold3230[f]-110<reserve)return false;
    botGold3230[f]-=110;industryLevel3230[best]=1;industries3212.add(best);
    markEconomyDirty3261();aiMarkDirty3260();supplyDirty3220=true;
    lastCivilBuild[f]=campaignSeconds3230;watchdogBuilds++;
    return true;
  }

  function tryCivilWatchdog0375(f){
    const now=campaignSeconds3230||0;
    if(now-lastCivilBuild[f]<CIVIL_WATCHDOG_SECONDS+(f%7)*2)return false;
    const econ=territorialEconomy3261(f);
    const counts=aiPhysicalCounts3283(f);
    const targets=aiDevelopmentTargets3283(f,econ,counts);
    const deficit=counts.cities<targets.targetCities||counts.industries<targets.targetIndustries||
      counts.roadRoutes<targets.targetRoads||counts.ports<targets.targetPorts;
    if(!deficit){lastCivilBuild[f]=now;civilStalls[f]=0;return false}
    if((aiSnapshot3260?.capThreat?.[f]??99)<10)return false;

    civilStalls[f]++;
    if(tryRepairCommunications0375(f)){watchdogBuilds++;civilStalls[f]=0;return true}
    if(fallbackCity0375(f,targets,counts)){civilStalls[f]=0;return true}
    if(fallbackIndustry0375(f,targets,counts)){civilStalls[f]=0;return true}
    return false;
  }

  // Constructor IA actual (incluye 0.36.2): añadimos necesidades, no lo sustituimos.
  const baseBotBuild0375=botBuild3230;
  botBuild3230=function(f){
    if(f<=0||f>=activeFactionCount3230||!started3230)return;

    // Una infraestructura existente aislada tiene prioridad sobre abrir otra.
    if(tryRepairCommunications0375(f)){lastCivilBuild[f]=campaignSeconds3230;return}
    // Un tratado comercial puede generar inversión real hasta la frontera.
    if(tryCommercialCorridor0375(f)){lastCivilBuild[f]=campaignSeconds3230;return}

    // El constructor 3.28.x ya registra lastBuild cuando hace una inversión.
    // Usamos ese marcador en vez de volver a contar toda la infraestructura de
    // la nación en cada servicio: crítico con 500 IA.
    const st=aiDevState3283?.[f],beforeLast=st?.lastBuild??-1e9,beforeRoads=roads3212.length;
    const out=baseBotBuild0375.apply(this,arguments);
    const afterLast=aiDevState3283?.[f]?.lastBuild??-1e9;
    if(afterLast>beforeLast||roads3212.length!==beforeRoads){
      lastCivilBuild[f]=campaignSeconds3230;civilStalls[f]=0;
      return out;
    }

    // Solo si lleva tiempo sin progresar se ejecuta el conteo/diagnóstico caro.
    tryCivilWatchdog0375(f);
    return out;
  };

  // La diplomacia deja de depender de que al scheduler militar le sobren ms.
  // Reutiliza el tick económico y su propio dipNextReview: no crea otro timer.
  const baseEconomyTick0375=economyTick3212;
  economyTick3212=function(){
    const out=baseEconomyTick0375.apply(this,arguments);
    if(started3230&&!paused3230&&gameSpeed3212>0&&typeof diplomacyTick3300==='function'){
      const now=campaignSeconds3230||0;
      if(now-lastDiplomacyService>=DIPLOMACY_SERVICE_SECONDS){
        lastDiplomacyService=now;diplomacyTick3300();diplomacyServices++;
      }
    }
    return out;
  };

  function resetState0375(){
    nextCommerceTry.fill(0);lastCivilBuild.fill(campaignSeconds3230||0);civilStalls.fill(0);
    lastDiplomacyService=-1e9;
  }
  const baseReset0375=resetGame3230;
  resetGame3230=function(){
    const out=baseReset0375.apply(this,arguments);resetState0375();return out;
  };
  const baseLoad0375=loadGame3212;
  loadGame3212=function(){
    const out=baseLoad0375.apply(this,arguments);resetState0375();return out;
  };

  function stats0375(){
    let stalled=0;
    for(let f=1;f<activeFactionCount3230;f++)if(civilStalls[f]>0)stalled++;
    return {build:BUILD,corridorBuilds,watchdogBuilds,diplomacyServices,stalled,
      diplomacyEvery:DIPLOMACY_SERVICE_SECONDS,commerceRetry:COMMERCE_RETRY_SECONDS,
      watchdog:CIVIL_WATCHDOG_SECONDS};
  }
  function validate0375(){
    const errors=[],warnings=[],st=stats0375();
    if(typeof diplomacyTick3300!=='function')errors.push('motor diplomático no disponible');
    if(!window.HexategosTradeLogistics0370?.ensureLandRoute)warnings.push('API de creación de ruta terrestre no disponible');
    if(st.stalled>Math.max(12,activeFactionCount3230*.18))warnings.push('muchas IA con intentos civiles fallidos: '+st.stalled);
    return {ok:errors.length===0,errors,warnings,stats:st};
  }

  resetState0375();
  window.HexategosAICommerce0375={version:BUILD,stats:stats0375,validate:validate0375,
    serviceTrade:(f)=>tryCommercialCorridor0375(Number(f)),
    serviceCivil:(f)=>tryCivilWatchdog0375(Number(f))};
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.37.5 · diplomacia garantizada, corredores comerciales y watchdog civil');
})();
