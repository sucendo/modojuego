'use strict';

// HEXATEGOS 0.34.2 · estabilización de escala política.
// - Garantiza exactamente 150/250/350/500 naciones al crear mundo.
// - Añade validación y telemetría sin timers ni observers.
// - Conserva intacta la base estable y los guardados 0.33/0.34.1.
(() => {
  const BUILD='0.34.2';
  const PREF_KEY='hexategos-newgame-faction-count-0341';
  const FALLBACK_THRESHOLDS=[2.6,2.1,1.7,1.35,1.05,.78,.52,.28,0];
  const SCAN_STRIDE=7919;

  const baseChooseAICapitals0342=chooseAICapitals3302;
  const baseBuildCustomWorld0342=buildCustomWorld3302;
  const baseBeginNewGame0342=beginNewGameSetup3302;

  let lastPlacement0342={
    requested:0,
    supplied:0,
    baseSupplied:0,
    fallbackAdded:0,
    scanned:0,
    minThreshold:null,
    ms:0
  };
  let lastBuild0342={ok:true,requested:0,capitals:0,unique:0,ms:0};

  function validLand0342(cell,L){
    return Number.isInteger(cell)&&cell>=0&&cell<L.n&&L.land[cell]>=0;
  }

  function farEnough0342(cell,chosen,minDist){
    if(minDist<=0)return true;
    for(let i=0;i<chosen.length;i++){
      if(angularHeuristic3254(chosen[i],cell)<minDist)return false;
    }
    return true;
  }

  function describeCapital0342(cell){
    const near=nearestCapitalCandidate3302(cell);
    return {
      cell,
      city:(near&&near.distance<8)?near.city:'Capital regional',
      geo:landName3230(cell)
    };
  }

  function deterministicFill0342(playerCell,result,want){
    const L=loadLevel(MAX_GAME_LEVEL3233);
    const used=new Set([playerCell]);
    const chosen=[playerCell];

    const cleaned=[];
    for(const item of result||[]){
      const cell=item?.cell;
      if(cleaned.length>=want)break;
      if(!validLand0342(cell,L)||used.has(cell))continue;
      // Never place an AI capital on the already claimed player start ring.
      if(owner6?.[cell]>=0)continue;
      used.add(cell);chosen.push(cell);cleaned.push(item);
    }

    let scanned=0,minThreshold=null;
    const n=L.n;
    const start=((Math.imul((playerCell+1)>>>0,2654435761)>>>0)%n);

    for(const threshold of FALLBACK_THRESHOLDS){
      if(cleaned.length>=want)break;
      for(let step=0;step<n&&cleaned.length<want;step++){
        const cell=(start+step*SCAN_STRIDE)%n;
        scanned++;
        if(used.has(cell)||L.land[cell]<0||owner6?.[cell]>=0)continue;
        if(!farEnough0342(cell,chosen,threshold))continue;
        used.add(cell);chosen.push(cell);cleaned.push(describeCapital0342(cell));
        minThreshold=threshold;
      }
    }

    // Absolute safety net. With the current world this should never be needed,
    // but it makes the requested nation count an invariant instead of a best effort.
    if(cleaned.length<want){
      for(let cell=0;cell<n&&cleaned.length<want;cell++){
        scanned++;
        if(used.has(cell)||L.land[cell]<0||owner6?.[cell]>=0)continue;
        used.add(cell);chosen.push(cell);cleaned.push(describeCapital0342(cell));
        minThreshold=0;
      }
    }

    return {result:cleaned.slice(0,want),scanned,minThreshold};
  }

  chooseAICapitals3302=function(playerCell,count){
    const t0=performance.now();
    const want=Math.max(0,Math.min(FACTION_CAPACITY3230-1,Number(count)|0));
    let base=[];
    try{base=baseChooseAICapitals0342(playerCell,want)||[]}catch(err){
      console.warn('[HEXATEGOS 0.34.2] selector base de capitales falló; se usa recuperación determinista.',err);
    }

    const filled=deterministicFill0342(playerCell,base,want);
    lastPlacement0342={
      requested:want,
      supplied:filled.result.length,
      baseSupplied:Math.min(base.length,want),
      fallbackAdded:Math.max(0,filled.result.length-Math.min(base.length,want)),
      scanned:filled.scanned,
      minThreshold:filled.minThreshold,
      ms:performance.now()-t0
    };

    if(filled.result.length!==want){
      console.error('[HEXATEGOS 0.34.2] No se pudo satisfacer el número exacto de capitales',lastPlacement0342);
    }
    return filled.result;
  };

  function quickCapitalCheck0342(){
    const L=loadLevel(MAX_GAME_LEVEL3233);
    const seen=new Set();
    let valid=0,owned=0;
    for(let f=0;f<activeFactionCount3230;f++){
      const c=capitals?.[f]??-1;
      if(!validLand0342(c,L))continue;
      valid++;
      seen.add(c);
      if(owner6?.[c]===f)owned++;
    }
    return {valid,unique:seen.size,owned};
  }

  buildCustomWorld3302=function(playerCell){
    const requested=window.HexategosNationScale0341?.pending??activeFactionCount3230;
    const t0=performance.now();
    const ok=baseBuildCustomWorld0342.apply(this,arguments);
    if(!ok){
      lastBuild0342={ok:false,requested,capitals:0,unique:0,ms:performance.now()-t0};
      return false;
    }

    const q=quickCapitalCheck0342();
    const exact=q.valid===activeFactionCount3230&&q.unique===activeFactionCount3230&&q.owned===activeFactionCount3230;
    lastBuild0342={
      ok:exact,
      requested:activeFactionCount3230,
      capitals:q.valid,
      unique:q.unique,
      owned:q.owned,
      ms:performance.now()-t0
    };

    if(!exact){
      paused3230=true;
      console.error('[HEXATEGOS 0.34.2] Mundo rechazado: número de naciones inconsistente.',lastBuild0342);
      try{toast('No se pudo crear el número exacto de naciones. Prueba otra ubicación.')}catch(_){}
      return false;
    }
    return true;
  };

  // En una campaña existente se conserva su escala. Desde la portada sin campaña
  // se recupera la última preferencia 150/250/350/500 del jugador.
  beginNewGameSetup3302=function(origin='intro'){
    const hadCampaign=!!started3230;
    const r=baseBeginNewGame0342.apply(this,arguments);
    if(!hadCampaign&&window.HexategosNationScale0341?.setPending){
      try{
        const saved=Number(localStorage.getItem(PREF_KEY));
        if(FACTION_COUNT_OPTIONS3230.includes(saved))window.HexategosNationScale0341.setPending(saved);
      }catch(_){}
    }
    return r;
  };

  function fullOwnerAudit0342(){
    let inactiveOwners=0,invalidOwners=0;
    if(!owner6)return {inactiveOwners,invalidOwners};
    for(let i=0;i<owner6.length;i++){
      const f=owner6[i];
      if(f<-1||f>=FACTION_CAPACITY3230)invalidOwners++;
      else if(f>=activeFactionCount3230)inactiveOwners++;
      if(invalidOwners>50||inactiveOwners>50)break;
    }
    return {inactiveOwners,invalidOwners};
  }

  function stats0342(){
    const q=quickCapitalCheck0342();
    const diplomacy=window.HexategosDiplomacyNetwork3301?.stats?.()||null;
    return {
      build:BUILD,
      capacity:FACTION_CAPACITY3230,
      active:activeFactionCount3230,
      started:!!started3230,
      capitals:q.valid,
      uniqueCapitals:q.unique,
      ownedCapitals:q.owned,
      placement:{...lastPlacement0342},
      lastWorldBuild:{...lastBuild0342},
      performance:{
        renderAvg:Number(renderMsAvg3255||0),
        renderMax:Number(renderMsMax3255||0),
        aiAvg:Number(stabilityPerf3298?.aiAvg||0),
        frontsAvg:Number(stabilityPerf3298?.frontsAvg||0),
        economyAvg:Number(stabilityPerf3298?.economyAvg||0),
        aiSnapshotMs:Number(aiSnapshotBuildMs3260||0),
        diplomacyBuildMs:Number(diplomacy?.lastBuildMs||0),
        diplomacyAvgTargets:diplomacy?.avgTargets??null
      }
    };
  }

  function validate0342(full=false){
    const errors=[],warnings=[],st=stats0342();
    if(!FACTION_COUNT_OPTIONS3230.includes(activeFactionCount3230)&&
       !(typeof LEGACY_FACTION_COUNT_OPTIONS3230!=='undefined'&&LEGACY_FACTION_COUNT_OPTIONS3230.includes(activeFactionCount3230)))
      errors.push('Número activo de naciones no permitido');
    if(FACTIONS3230.length!==FACTION_CAPACITY3230)
      errors.push('Capacidad de facciones distinta de 500');
    if(DIP_F3300!==FACTION_CAPACITY3230)
      errors.push('Matriz diplomática con capacidad incorrecta');

    if(started3230){
      if(st.capitals!==activeFactionCount3230)
        errors.push(`Capitales válidas ${st.capitals}/${activeFactionCount3230}`);
      if(st.uniqueCapitals!==activeFactionCount3230)
        errors.push(`Capitales únicas ${st.uniqueCapitals}/${activeFactionCount3230}`);
      if(st.ownedCapitals!==activeFactionCount3230)
        errors.push(`Capitales en poder de su nación ${st.ownedCapitals}/${activeFactionCount3230}`);
    }

    if(lastPlacement0342.requested&&lastPlacement0342.supplied!==lastPlacement0342.requested)
      errors.push('El generador no entregó todas las capitales solicitadas');

    if(full){
      const a=fullOwnerAudit0342();
      if(a.invalidOwners)errors.push(`Propietarios inválidos: ${a.invalidOwners}`);
      if(a.inactiveOwners)errors.push(`Territorios de naciones inactivas: ${a.inactiveOwners}`);
    }

    const p=st.performance;
    if(activeFactionCount3230>=350&&p.aiAvg>45)warnings.push(`IA media alta: ${p.aiAvg.toFixed(1)} ms`);
    if(activeFactionCount3230>=350&&p.renderAvg>36)warnings.push(`Render medio alto: ${p.renderAvg.toFixed(1)} ms`);
    if(activeFactionCount3230>=350&&p.diplomacyBuildMs>28)warnings.push(`Red diplomática alta: ${p.diplomacyBuildMs.toFixed(1)} ms`);

    return {ok:errors.length===0,errors,warnings,stats:st};
  }

  function smoke0342(){
    const out=validate0342(true);
    try{
      const scale=window.HexategosNationScale0341?.validate?.();
      if(scale&&!scale.ok)out.errors.push(...scale.errors.map(x=>'Escala: '+x));
    }catch(err){out.errors.push('Validador de escala: '+err.message)}
    out.ok=out.errors.length===0;
    return out;
  }

  if(window.HexategosDiag033?.snapshot){
    const baseSnapshot0342=window.HexategosDiag033.snapshot.bind(window.HexategosDiag033);
    window.HexategosDiag033.snapshot=function(){
      const out=baseSnapshot0342();
      out.stability0342=stats0342();
      return out;
    };
  }

  window.HEXATEGOS_VERSION=BUILD;
  window.HexategosStability0342={
    stats:stats0342,
    validate:validate0342,
    smoke:smoke0342,
    get lastPlacement(){return {...lastPlacement0342}},
    get lastWorldBuild(){return {...lastBuild0342}}
  };

  console.info('[HEXATEGOS] 0.34.2 estabilización activa · HexategosStability0342.smoke()');
})();
