'use strict';

// HEXATEGOS 0.36.0 · 150/250/350/500 NACIONES REALES + IA ADAPTATIVA.
// No existe una segunda clase de entidad: las 500 plazas usan owner6, capitales,
// economía, diplomacia, campañas, flotas e infraestructura del motor normal.
(() => {
  const BUILD='0.36.0';
  const SAVE_KEY='hexategos-nation-ai-0360';
  const CHANGE_LIMIT=3600; // 60 minutos de campaña.
  const MINDSETS=['conformist','commercial','defensive','opportunist','localist'];
  const PROFILE={
    conformist:{role:'balanced',aggr:.66,service:10.5},
    commercial:{role:'growth',aggr:.73,service:7.5},
    defensive:{role:'defense',aggr:.69,service:9.0},
    opportunist:{role:'aggressive',aggr:.91,service:5.5},
    localist:{role:'balanced',aggr:.61,service:12.0}
  };

  let mindset=Array(FACTION_CAPACITY3230).fill('conformist');
  let nextMindsetReview=new Float64Array(FACTION_CAPACITY3230);
  let nextService=new Float64Array(FACTION_CAPACITY3230);
  let serviceCursor=1,reviewCursor=1;
  let snapshotCampaign=-1e9,snapshotWall=-1e9;
  let rankingWall=-1e9,rankingSignature='';
  let lastTickMs=0,lastSnapshotMs=0,lastServed=0,lastReviewed=0;
  let restoredPortable=null;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function hash0360(x){
    x=(x|0)+0x9e3779b9;
    x=Math.imul(x^(x>>>16),0x21f0aaad);
    x=Math.imul(x^(x>>>15),0x735a2d97);
    return (x^(x>>>15))>>>0;
  }
  function rand0360(seed){return hash0360(seed)/4294967296}

  function validMindset0360(v){return MINDSETS.includes(v)}
  function initialMindset0360(f){
    const cap=capitals?.[f]??f;
    const r=hash0360((f+1)*65537^(cap+17))%100;
    return r<23?'conformist':r<45?'commercial':r<65?'defensive':r<84?'opportunist':'localist';
  }
  function isCoastalNation0360(f){
    try{
      if(Array.isArray(aiNationalCoast3275?.[f])&&aiNationalCoast3275[f].length)return true;
      const cap=capitals?.[f]??-1;
      return cap>=0&&owner6?.[cap]===f&&isCoastal3212(cap);
    }catch(_){return false}
  }
  function roleForMindset0360(f,m){
    // El tipo de IA es conceptual; "naval" sigue siendo una doctrina táctica del
    // motor original, no una categoría de nación. Algunas comerciales u
    // oportunistas costeras la adoptan sin perder ninguna capacidad.
    if(isCoastalNation0360(f)&&(m==='commercial'||m==='opportunist')){
      const cap=capitals?.[f]??f;
      if((hash0360(f*811+(cap+1)*37)%5)===0)return 'naval';
    }
    return PROFILE[m]?.role||'balanced';
  }
  function invalidatePlans0360(f){
    try{
      if(aiStrategicState3260?.[f])aiStrategicState3260[f].nextThink=0;
      if(aiNationNextCampaignEval3280?.length>f)aiNationNextCampaignEval3280[f]=0;
      if(aiNationalPlan3275?.[f])aiNationalPlan3275[f].nextReview=0;
      if(regionalPlans3284?.[f])regionalPlans3284[f].nextEval=0;
      if(aiDevState3283?.[f])aiDevState3283[f].lastTerritory=-1;
    }catch(_){}
  }
  function applyMindset0360(f,reset=false){
    if(f<=0||f>=FACTIONS3230.length)return;
    const m=validMindset0360(mindset[f])?mindset[f]:'conformist',p=PROFILE[m];
    FACTIONS3230[f].role=roleForMindset0360(f,m);
    // Pequeña variación individual para que dos IA del mismo perfil no sean clones.
    const variance=((hash0360(f*131+(capitals?.[f]??0))%9)-4)*.006;
    FACTIONS3230[f].aggr=clamp(p.aggr+variance,.54,.96);
    if(reset)invalidatePlans0360(f);
  }

  function transitionWeights0360(f){
    const snap=aiSnapshot3260,territory=snap?.territory?.[f]||0;
    const max=Math.max(1,economyRate3230(f).max||1);
    const reserve=troops3230[f]||0,wear=dipWarWeariness3300?.[f]||0;
    const momentum=aiStrategicState3260?.[f]?.momentum||0;
    const neutral=snap?.neutralBorder?.[f]||0,hostile=snap?.hostileBorder?.[f]||0;
    const econ=territorialEconomy3261(f);
    const w={conformist:10,commercial:10,defensive:10,opportunist:10,localist:9};

    // Inercia: cambiar es posible, pero no es un sorteo completamente nuevo.
    w[mindset[f]]=(w[mindset[f]]||10)+15;

    if(wear>52){w.defensive+=28;w.conformist+=14;w.localist+=8;w.opportunist-=5}
    if(reserve<max*.25){w.defensive+=22;w.conformist+=10;w.opportunist-=4}
    if(econ.net<0){w.commercial+=24;w.defensive+=10}
    else if(econ.net>2){w.commercial+=8;w.opportunist+=6}
    if(territory<18){w.opportunist+=17;w.commercial+=10;w.localist-=2}
    if(neutral>hostile*1.6){w.opportunist+=13;w.commercial+=5}
    if(hostile>neutral*1.4){w.defensive+=16;w.conformist+=7}
    if(momentum>=2){w.opportunist+=18;w.commercial+=5}
    if(momentum<=0&&wear>28){w.defensive+=8;w.localist+=5}
    if(isCoastalNation0360(f)){w.commercial+=5;w.opportunist+=3}
    for(const k of MINDSETS)w[k]=Math.max(1,w[k]||1);
    return w;
  }
  function weightedMindset0360(f,weights){
    let total=0;for(const k of MINDSETS)total+=weights[k];
    let r=rand0360(hash0360(f*977+(campaignSeconds3230|0)+Math.floor(performance.now()))) * total;
    for(const k of MINDSETS){r-=weights[k];if(r<=0)return k}
    return mindset[f];
  }
  function reviewChance0360(now){
    if(now>=CHANGE_LIMIT)return 0;
    if(now<600)return .26;      // 0–10 min
    if(now<1800)return .15;     // 10–30 min
    if(now<2700)return .075;    // 30–45 min
    return .032;                // 45–60 min
  }
  function reviewInterval0360(now,f){
    const base=now<600?48:now<1800?82:now<2700?135:210;
    return base+(f%17)*2.1;
  }
  function reviewMindset0360(f){
    const now=campaignSeconds3230;
    if(f<=0||f>=activeFactionCount3230||now>=CHANGE_LIMIT)return false;
    if(now<nextMindsetReview[f])return false;
    nextMindsetReview[f]=now+reviewInterval0360(now,f);
    if(Math.random()>reviewChance0360(now))return false;
    const old=mindset[f],next=weightedMindset0360(f,transitionWeights0360(f));
    if(next===old)return false;
    mindset[f]=next;applyMindset0360(f,true);saveAI0360();
    return true;
  }

  function initAI0360(saved=null,newWorld=false){
    const now=campaignSeconds3230||0;
    const rows=Array.isArray(saved?.mindset)?saved.mindset:null;
    const reviews=Array.isArray(saved?.nextMindsetReview)?saved.nextMindsetReview:null;
    for(let f=1;f<FACTION_CAPACITY3230;f++){
      mindset[f]=validMindset0360(rows?.[f])?rows[f]:initialMindset0360(f);
      nextMindsetReview[f]=Number.isFinite(reviews?.[f])?reviews[f]:
        now+18+(hash0360(f*433+(capitals?.[f]??0))%42);
      nextService[f]=now+(f%23)*.34;
      applyMindset0360(f,false);
    }
    serviceCursor=1;reviewCursor=1;
    snapshotCampaign=-1e9;snapshotWall=-1e9;
    rankingSignature='';rankingWall=-1e9;

    // En una partida nueva la diplomacia inicial debe nacer con los perfiles ya
    // aplicados. En una carga, restoreDiplomacy0360 se ejecutará después.
    if(newWorld&&typeof initDiplomacy3300==='function'){
      initDiplomacy3300(false);
      window.HexategosDiplomacyNetwork3301?.markDirty?.();
    }
    try{
      resetAIStrategy3260();
      if(typeof ensureNationalPlans3275==='function')ensureNationalPlans3275(true);
      if(typeof regionalPlans3284!=='undefined')regionalPlans3284=Array.from({length:FACTIONS3230.length},()=>null);
    }catch(_){}
  }

  function serializeAI0360(){
    return {
      version:1,factionCount:activeFactionCount3230,
      mindset:mindset.slice(0,activeFactionCount3230),
      nextMindsetReview:Array.from(nextMindsetReview.slice(0,activeFactionCount3230))
    };
  }
  function saveAI0360(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(serializeAI0360()))}catch(_){}
  }
  function loadAI0360(){
    try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch(_){return null}
  }

  // --------------------------------------------------------------------------
  // Snapshot compartido + scheduler escalonado.
  // Cada nación conserva EXACTAMENTE el mismo planificador/campaña/construcción;
  // solo cambia cuándo recibe CPU.
  // --------------------------------------------------------------------------
  function schedulerBudget0360(){
    const n=activeFactionCount3230;
    return n<=150?42:n<=250?48:n<=350?54:60;
  }
  function ensureSnapshot0360(force=false){
    const now=campaignSeconds3230,wall=performance.now();
    const minCampaign=activeFactionCount3230>=350?6:activeFactionCount3230>=250?5:4;
    const maxCampaign=activeFactionCount3230>=350?12:10;
    const due=!aiSnapshot3260||force||
      ((aiSnapshotDirty3260&&now-snapshotCampaign>=minCampaign&&wall-snapshotWall>=2400)||
       now-snapshotCampaign>=maxCampaign);
    if(due){
      const t0=performance.now();
      rebuildAISnapshot3260();
      lastSnapshotMs=performance.now()-t0;
      snapshotCampaign=now;snapshotWall=wall;
    }
    // Impide que aiNationalCampaignEval3280 fuerce otro barrido mundial dentro
    // de este mismo ciclo. Los cambios recientes entran en el siguiente snapshot.
    aiLastStrategicCampaign3260=now;
    aiLastStrategicWall3260=wall;
    return aiSnapshot3260;
  }
  function serviceInterval0360(f){
    const p=PROFILE[mindset[f]]||PROFILE.conformist;
    const scale=activeFactionCount3230>=450?1.18:activeFactionCount3230>=350?1.10:1;
    return p.service*scale+(f%5)*.18;
  }
  function serviceFaction0360(f,snap){
    if(f<=0||f>=activeFactionCount3230||(snap?.territory?.[f]||0)<=0){
      nextService[f]=campaignSeconds3230+45;return;
    }
    const now=campaignSeconds3230;
    let st=aiStrategicState3260[f];
    const invalid=!st||st.objective<0||st.source<0||
      (st.source>=0&&owner6[st.source]!==f)||
      (st.objective>=0&&owner6[st.objective]===f);
    if(invalid||now>=st.nextThink){
      aiPlanFaction3260(f,snap);
      st=aiStrategicState3260[f];
    }
    // Las tres llamadas son las mismas que usaban las 16/25/35/50 antiguas.
    aiNationalCampaignEval3280(f,false);
    aiNationTactical3280(f);
    botBuild3230(f);
    nextService[f]=now+serviceInterval0360(f);
  }
  function reviewSome0360(){
    if(campaignSeconds3230>=CHANGE_LIMIT)return 0;
    const budget=activeFactionCount3230>=350?12:8;
    let reviewed=0,scanned=0;
    while(reviewed<budget&&scanned<Math.max(1,activeFactionCount3230-1)){
      if(reviewCursor<=0||reviewCursor>=activeFactionCount3230)reviewCursor=1;
      const f=reviewCursor++;scanned++;
      if(campaignSeconds3230>=nextMindsetReview[f]){
        reviewMindset0360(f);reviewed++;
      }
    }
    return reviewed;
  }

  // La implementación original revisaba una sola nación por tick, adecuada para
  // 16–50 países pero demasiado lenta con 500. Conservamos exactamente la misma
  // lógica de revisión y solo escalamos el número de países atendidos.
  diplomacyTick3300=function(){
    const t0=performance.now();
    if(!started3230||paused3230||gameSpeed3212<=0||!dipBooted3300)return;
    absorbLegacyPlayerRelations3300();
    rebuildDiplomaticBorders3300(false);
    const now=campaignSeconds3230;
    const before=dipOffers3300.length;
    dipOffers3300=dipOffers3300.filter(x=>x.expires>now);
    if(before!==dipOffers3300.length&&sysTab3220==='dip')renderSystems3220();

    const budget=activeFactionCount3230>=450?7:activeFactionCount3230>=350?6:
                 activeFactionCount3230>=250?5:3;
    for(let n=0;n<budget;n++){
      if(dipReviewCursor3300<=0||dipReviewCursor3300>=activeFactionCount3230)dipReviewCursor3300=1;
      const f=dipReviewCursor3300++;
      if(now>=dipNextReview3300[f]){
        dipNextReview3300[f]=now+9+(f%4)*2.1;
        aiReviewDiplomacy3300(f);
      }
    }
    dipLastTickMs3300=performance.now()-t0;
  };

  aiTick3212=function(){
    if(paused3230||!started3230||gameSpeed3212<=0)return;
    const t0=performance.now(),now=campaignSeconds3230;
    const snap=ensureSnapshot0360(false);
    const budget=schedulerBudget0360();
    let served=0,scanned=0;
    while(served<budget&&scanned<Math.max(1,(activeFactionCount3230-1)*2)){
      if(serviceCursor<=0||serviceCursor>=activeFactionCount3230)serviceCursor=1;
      const f=serviceCursor++;scanned++;
      if(now+1e-6<nextService[f])continue;
      serviceFaction0360(f,snap);served++;
    }
    lastReviewed=reviewSome0360();
    if(typeof diplomacyTick3300==='function')diplomacyTick3300();
    updateRanking3220();updateFrontDock3220();checkEnd3230();needsRender=true;
    lastServed=served;lastTickMs=performance.now()-t0;
    if(typeof stabilitySample3298==='function')stabilitySample3298('ai',lastTickMs);
  };

  // --------------------------------------------------------------------------
  // Conteos / clasificación: UN solo barrido compartido, nunca 500 barridos.
  // --------------------------------------------------------------------------
  ownedCounts3220=function(){
    if(aiSnapshot3260?.territory?.length>=activeFactionCount3230)
      return aiSnapshot3260.territory;
    const counts=new Int32Array(FACTIONS3230.length);
    if(!owner6?.length)return counts;
    for(let i=0;i<owner6.length;i++){const f=owner6[i];if(f>=0&&f<counts.length)counts[f]++}
    return counts;
  };

  updateRanking3220=function(force=false){
    if(!worldReady3301?.())return;
    const wall=performance.now();
    if(!force&&wall-rankingWall<2600)return;
    rankingWall=wall;
    const counts=ownedCounts3220(),arr=[];
    for(let f=0;f<activeFactionCount3230;f++)if((counts[f]||0)>0||f===0)arr.push([f,counts[f]||0]);
    arr.sort((a,b)=>b[1]-a[1]||a[0]-b[0]);
    const sig=arr.map(x=>x[0]+':'+x[1]).join('|');
    if(!force&&sig===rankingSignature)return;
    rankingSignature=sig;
    const el=document.getElementById('rankRows3213');if(!el)return;
    el.innerHTML=arr.map((r,k)=>
      '<div class="rankRow3213" data-faction="'+r[0]+'" role="button" tabindex="0" aria-label="Ir a la capital de '+factionName3230(r[0]).replace(/"/g,'&quot;')+'" title="Ir a la capital de '+factionName3230(r[0]).replace(/"/g,'&quot;')+'">'+
      '<i class="rankDot3213" style="background:'+(FACTIONS3230[r[0]]?.color||'#80909b')+'"></i>'+
      '<span>'+(k+1)+'. '+factionName3230(r[0])+'</span><small>'+r[1].toLocaleString('es-ES')+'</small></div>'
    ).join('');
    if(typeof rankingCountMs3298!=='undefined')rankingCountMs3298=performance.now()-wall;
  };

  // --------------------------------------------------------------------------
  // Diplomacia: el motor sigue teniendo las mismas relaciones/opinión/confianza,
  // pero el guardado no vuelca seis matrices 500×500 como JSON.
  // Guardamos solo pares con contacto real; las relaciones activas siempre forman
  // parte de esa red y los pares neutros lejanos se regeneran determinísticamente.
  // --------------------------------------------------------------------------
  const baseSerializeDiplomacy0360=serializeDiplomacy3300;
  const baseRestoreDiplomacy0360=restoreDiplomacy3300;

  function compactDiplomacyPairs0360(){
    const pairMap=new Map(),add=(a,b)=>{
      if(a===b||a<0||b<0||a>=activeFactionCount3230||b>=activeFactionCount3230)return;
      const x=Math.min(a,b),y=Math.max(a,b),key=x+'|'+y;
      if(pairMap.has(key))return;
      const xy=dipIdx3300(x,y),yx=dipIdx3300(y,x);
      pairMap.set(key,[
        x,y,dipRelations3300[xy]||0,
        dipOpinion3300[xy]||0,dipOpinion3300[yx]||0,
        dipTrust3300[xy]||50,dipTrust3300[yx]||50,
        dipTreatyUntil3300[xy]||0,dipNoWarUntil3300[xy]||0,dipWarStarted3300[xy]||0
      ]);
    };
    for(let f=1;f<activeFactionCount3230;f++)add(0,f);
    if(window.HexategosDiplomacyNetwork3301?.targets){
      for(let f=0;f<activeFactionCount3230;f++)
        for(const o of window.HexategosDiplomacyNetwork3301.targets(f))add(f,o);
    }else{
      // Fallback limitado: conserva cualquier relación no neutral.
      for(let a=0;a<activeFactionCount3230;a++)for(let b=a+1;b<activeFactionCount3230;b++)
        if(diplomaticRelation3300(a,b)!==0)add(a,b);
    }
    return [...pairMap.values()];
  }
  serializeDiplomacy3300=function(){
    if(DIP_F3300<100)return baseSerializeDiplomacy0360();
    return {
      version:3,format:'contact-sparse',matrixSize:DIP_F3300,factionCount:activeFactionCount3230,
      pairs:compactDiplomacyPairs0360(),
      weariness:Array.from(dipWarWeariness3300.slice(0,activeFactionCount3230)),
      nextReview:Array.from(dipNextReview3300.slice(0,activeFactionCount3230)),
      offers:dipOffers3300.slice(0,12),events:dipEvents3300.slice(0,24),offerSeq:dipOfferSeq3300
    };
  };
  restoreDiplomacy3300=function(s){
    if(!s||s.version!==3||s.format!=='contact-sparse'||!Array.isArray(s.pairs))
      return baseRestoreDiplomacy0360(s);
    initDiplomacy3300(false);
    for(const p of s.pairs){
      if(!Array.isArray(p)||p.length<7)continue;
      const a=Number(p[0]),b=Number(p[1]);
      if(a<0||b<0||a>=activeFactionCount3230||b>=activeFactionCount3230||a===b)continue;
      const ab=dipIdx3300(a,b),ba=dipIdx3300(b,a),rel=Number(p[2])||0;
      dipRelations3300[ab]=rel;dipRelations3300[ba]=rel;
      dipOpinion3300[ab]=Number(p[3])||0;dipOpinion3300[ba]=Number(p[4])||0;
      const ta=Number(p[5]),tb=Number(p[6]);
      dipTrust3300[ab]=clamp(Number.isFinite(ta)?ta:50,0,100);dipTrust3300[ba]=clamp(Number.isFinite(tb)?tb:50,0,100);
      dipTreatyUntil3300[ab]=dipTreatyUntil3300[ba]=Number(p[7])||0;
      dipNoWarUntil3300[ab]=dipNoWarUntil3300[ba]=Number(p[8])||0;
      dipWarStarted3300[ab]=dipWarStarted3300[ba]=Number(p[9])||0;
    }
    if(Array.isArray(s.weariness))
      dipWarWeariness3300.set(s.weariness.slice(0,Math.min(s.weariness.length,DIP_F3300)));
    if(Array.isArray(s.nextReview))
      dipNextReview3300.set(s.nextReview.slice(0,Math.min(s.nextReview.length,DIP_F3300)));
    dipOffers3300=Array.isArray(s.offers)?s.offers.filter(x=>x&&x.from>0&&x.from<activeFactionCount3230).slice(0,12):[];
    dipEvents3300=Array.isArray(s.events)?s.events.slice(0,24):[];
    dipOfferSeq3300=Number(s.offerSeq)||1;
    relations3220.fill(0);
    for(let f=1;f<activeFactionCount3230;f++)relations3220[f]=dipRelations3300[dipIdx3300(0,f)]||0;
    dipBooted3300=true;
    window.HexategosDiplomacyNetwork3301?.markDirty?.();
    return true;
  };

  // --------------------------------------------------------------------------
  // Ciclo de vida / compatibilidad.
  // --------------------------------------------------------------------------
  const baseBuildWorld0360=buildCustomWorld3302;
  buildCustomWorld3302=function(){
    const out=baseBuildWorld0360.apply(this,arguments);
    if(out){initAI0360(null,true);saveAI0360();updateRanking3220(true)}
    return out;
  };

  const baseReset0360=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset0360.apply(this,arguments);
    mindset=Array(FACTION_CAPACITY3230).fill('conformist');
    nextMindsetReview=new Float64Array(FACTION_CAPACITY3230);
    nextService=new Float64Array(FACTION_CAPACITY3230);
    serviceCursor=1;reviewCursor=1;snapshotCampaign=-1e9;snapshotWall=-1e9;
    rankingSignature='';rankingWall=-1e9;
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out;
  };

  const baseLoad0360=loadGame3212;
  loadGame3212=function(){
    const out=baseLoad0360.apply(this,arguments);
    if(out){
      initAI0360(loadAI0360(),false);
      // La cadena base ya intentó cargar diplomacia antes de aplicar los perfiles.
      // Se restaura de nuevo ahora para que las opiniones neutras usen la IA correcta.
      try{
        const raw=localStorage.getItem(DIP_SAVE_KEY3300);
        if(raw)restoreDiplomacy3300(JSON.parse(raw));
      }catch(_){}
      updateRanking3220(true);
    }
    return out;
  };

  const baseSave0360=saveGame3212;
  saveGame3212=function(){
    const out=baseSave0360.apply(this,arguments);
    if(started3230)saveAI0360();
    return out;
  };

  if(typeof buildPortableFile3276==='function'){
    const basePortableBuild0360=buildPortableFile3276;
    buildPortableFile3276=function(){
      const file=basePortableBuild0360.apply(this,arguments);
      file.gameVersion='0.36.0';
      file.payload.nationAI0360=serializeAI0360();
      file.payload.diplomacy=serializeDiplomacy3300();
      if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const basePortableApply0360=applyPortableFile3275;
    applyPortableFile3275=function(file){
      restoredPortable=file?.payload?.nationAI0360||null;
      const out=basePortableApply0360.apply(this,arguments);
      initAI0360(restoredPortable,false);
      if(file?.payload?.diplomacy)restoreDiplomacy3300(file.payload.diplomacy);
      saveAI0360();updateRanking3220(true);
      return out;
    };
  }

  function stats0360(){
    const counts={};
    for(let f=1;f<activeFactionCount3230;f++)counts[mindset[f]]=(counts[mindset[f]]||0)+1;
    return {
      build:BUILD,active:activeFactionCount3230,capacity:FACTION_CAPACITY3230,
      mindsets:counts,changeWindowRemaining:Math.max(0,CHANGE_LIMIT-campaignSeconds3230),
      scheduler:{lastTickMs:Number(lastTickMs.toFixed(2)),lastSnapshotMs:Number(lastSnapshotMs.toFixed(2)),
        lastServed,lastReviewed,budget:schedulerBudget0360(),snapshotAge:campaignSeconds3230-snapshotCampaign}
    };
  }
  function validate0360(){
    const errors=[],warnings=[];
    if(FACTION_CAPACITY3230!==500)errors.push('Capacidad distinta de 500');
    if(JSON.stringify(FACTION_COUNT_OPTIONS3230)!==JSON.stringify([150,250,350,500]))
      errors.push('Selector de naciones incorrecto');
    if(FACTIONS3230.length!==500)errors.push('FACTIONS3230 no tiene 500 plazas');
    if(troops3230.length!==500||botGold3230.length!==500)errors.push('Arrays militares no tienen 500 plazas');
    if(DIP_F3300!==500)errors.push('Diplomacia no tiene 500 plazas');
    if(lastTickMs>90)warnings.push('Tick IA alto: '+lastTickMs.toFixed(1)+' ms');
    if(lastSnapshotMs>80)warnings.push('Snapshot alto: '+lastSnapshotMs.toFixed(1)+' ms');
    return {ok:errors.length===0,errors,warnings,stats:stats0360()};
  }

  window.HexategosNationAI0360={
    version:BUILD,stats:stats0360,validate:validate0360,
    mindset:f=>mindset[Number(f)]||null,
    forceReview:f=>reviewMindset0360(Number(f)),
    refresh:()=>{ensureSnapshot0360(true);updateRanking3220(true)}
  };
  window.HEXATEGOS_VERSION=BUILD;

  console.info('[HEXATEGOS] 0.36.0 · 150/250/350/500 naciones reales + IA adaptativa hasta 60 min');
})();
