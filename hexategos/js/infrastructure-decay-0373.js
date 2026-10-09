'use strict';

// HEXATEGOS 0.37.3 · DEGRADACIÓN DE INFRAESTRUCTURAS AISLADAS.
// Ciudades, industrias y puertos necesitan una comunicación física útil.
// La auditoría es deliberadamente lenta y solo recorre estructuras dispersas.
(() => {
  const BUILD='0.38.40';
  const SAVE_KEY='hexategos-infrastructure-decay-0373';
  const AUDIT_PERIOD=10;          // segundos de campaña
  const GRACE_SECONDS=60;         // sin penalización visual
  const ABANDONED_SECONDS=180;    // ya aparece completamente gris
  const FADE_SECONDS=300;         // empieza a desaparecer visualmente
  const REMOVE_SECONDS=360;       // retirada definitiva

  const cityDecay=new Map();
  const industryDecay=new Map();
  const portDecay=new Map();
  const specializedDecay=new Map();
  let lastAudit=-1e9;
  let lastAuditMs=0;
  let audits=0;
  let removals=0;
  let recoveries=0;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function isCapital0373(cell,f){
    return f>=0&&capitals?.[f]===cell&&owner6[cell]===f;
  }

  function routeOperational0373(r){
    return !!r&&['active','smuggling'].includes(r.status||'active')&&!r.blocked&&!r.destroyed;
  }

  function tradeRoutes0373(){
    const api=window.HexategosTradeLogistics0370;
    return api&&typeof api.routes==='function'?(api.routes()||[]):[];
  }

  function activeSeaEndpoints0373(routes=tradeRoutes0373()){
    const out=new Set();
    for(const r of routes){
      if(!routeOperational0373(r)||r.type!=='sea')continue;
      if(!ports3212.has(r.from)||!ports3212.has(r.to))continue;
      if(owner6[r.from]!==r.a||owner6[r.to]!==r.b)continue;
      out.add(r.from);out.add(r.to);
    }
    return out;
  }

  // Any real road touching the structure is already an internal land route.
  // Reuse the cached 0.37.x road components so this remains O(structures),
  // not O(world cells), even with 500 nations.
  function connections0373(){
    const api=window.HexategosTradeLogistics0370;
    const cache=new Map();
    const road=c=>{if(!cache.has(c))cache.set(c,api?.roadComponent?.(c)??-1);return cache.get(c)};
    const sea=activeSeaEndpoints0373();
    const direct=(c,f)=>f>=0&&owner6[c]===f&&(road(c)>=0||(ports3212.has(c)&&sea.has(c)));
    return (cell,f,level=2)=>{
      if(direct(cell,f))return true;
      if(level!==1||f<0)return false;
      const L=loadLevel(MAX_GAME_LEVEL3233);
      if(cell<0||cell>=L.n)return false;
      for(let k=L.offsets[cell];k<L.offsets[cell+1];k++){
        const n=L.edgeNbr[k];if(n<0)continue;
        if(owner6[n]===f&&direct(n,f))return true;
        if(owner6[n]>=0&&owner6[n]!==f&&road(n)>=0&&
          window.HexategosBorderRoad0376?.hasLink?.(cell,n))return true;
      }
      return false;
    };
  }

  function mapFor0373(kind){
    return kind==='city'?cityDecay:kind==='industry'?industryDecay:kind==='port'?portDecay:specializedDecay;
  }

  function decayAge0373(kind,cell,now=Number(campaignSeconds3230)||0){
    const rec=mapFor0373(kind).get(cell);
    return rec==null?-1:Math.max(0,now-rec);
  }

  function decayStage0373(kind,cell,now=Number(campaignSeconds3230)||0){
    const age=decayAge0373(kind,cell,now);
    if(age<0)return 'healthy';
    if(age<GRACE_SECONDS)return 'isolated';
    if(age<ABANDONED_SECONDS)return 'degraded';
    if(age<FADE_SECONDS)return 'abandoned';
    if(age<REMOVE_SECONDS)return 'fading';
    return 'removed';
  }

  function visual0373(kind,cell){
    const age=decayAge0373(kind,cell);
    if(age<0||age<GRACE_SECONDS)return {alpha:1,filter:'none',stage:age<0?'healthy':'isolated'};
    if(age<ABANDONED_SECONDS){
      const p=clamp((age-GRACE_SECONDS)/(ABANDONED_SECONDS-GRACE_SECONDS),0,1);
      const gray=Math.round(p*100),sat=Math.round(100-p*100),bright=Math.round(100-p*10);
      return {alpha:1,filter:`grayscale(${gray}%) saturate(${sat}%) brightness(${bright}%)`,stage:'degraded'};
    }
    if(age<FADE_SECONDS)return {alpha:.82,filter:'grayscale(100%) saturate(0%) brightness(88%)',stage:'abandoned'};
    const p=clamp((age-FADE_SECONDS)/(REMOVE_SECONDS-FADE_SECONDS),0,1);
    return {alpha:Math.max(.03,.82*(1-p)),filter:'grayscale(100%) saturate(0%) brightness(84%)',stage:'fading'};
  }

  function detachPortFleets0373(cell){
    if(typeof navalGroups3270==='undefined'||!Array.isArray(navalGroups3270))return;
    for(const g of navalGroups3270){
      if(!g)continue;
      if(g.pendingHome0370===cell)g.pendingHome0370=-1;
      if(g.home!==cell)continue;
      g.home=-1;g.pendingHome0370=-1;g.targetPort=-1;
      if(g.order==='return'||g.order==='patrol')g.order='intercept';
      g.route=null;g.routePos=0;g.routeGoal=-1;
    }
  }

  function removeStructure0373(kind,cell){
    const f=owner6[cell];
    if(kind==='city'&&isCapital0373(cell,f))return false;
    let removed=false;
    if(kind==='city'&&cities3212.delete(cell)){
      if(cityLevel3230?.length>cell)cityLevel3230[cell]=0;
      removed=true;
    }else if(kind==='industry'&&industries3212.delete(cell)){
      if(industryLevel3230?.length>cell)industryLevel3230[cell]=0;
      removed=true;
    }else if(kind==='port'&&ports3212.delete(cell)){
      detachPortFleets0373(cell);removed=true;
    }
    if(!removed)return false;
    removals++;
    cacheDirty=true;supplyDirty3220=true;needsRender=true;
    if(typeof economyDirty3261!=='undefined')economyDirty3261=true;
    if(typeof aiSnapshotDirty3260!=='undefined')aiSnapshotDirty3260=true;
    if(typeof markEconomyDirty3261==='function')markEconomyDirty3261();
    if(selected?.key===MAX_GAME_LEVEL3233&&selected.i===cell&&typeof updatePanel==='function')updatePanel();
    return true;
  }

  function auditSet0373(kind,set,map,now,connected){
    let dirty=false;
    for(const cell of set){
      const f=owner6[cell];
      if((kind==='city'&&isCapital0373(cell,f))||connected(cell,f,2)){
        if(map.delete(cell)){recoveries++;dirty=true}
        continue;
      }
      let since=map.get(cell);
      if(since==null){since=now;map.set(cell,since);dirty=true}
      if(now-since>=REMOVE_SECONDS){
        if(removeStructure0373(kind,cell)){map.delete(cell);dirty=true}
      }
    }
    // Limpia registros de estructuras eliminadas por otros sistemas.
    for(const cell of map.keys())if(!set.has(cell)){map.delete(cell);dirty=true}
    return dirty;
  }

  function audit0373(force=false){
    if(!started3230||paused3230||gameSpeed3212<=0)return false;
    const now=Number(campaignSeconds3230)||0;
    if(now<lastAudit)lastAudit=-1e9;
    if(!force&&now-lastAudit<AUDIT_PERIOD)return false;
    const t0=performance.now();
    const connected=connections0373();
    const removalsBefore=removals;
    let dirty=false;
    dirty=auditSet0373('city',cities3212,cityDecay,now,connected)||dirty;
    dirty=auditSet0373('industry',industries3212,industryDecay,now,connected)||dirty;
    dirty=auditSet0373('port',ports3212,portDecay,now,connected)||dirty;
    const prod=window.HexategosProduction0388,existing=new Set();
    for(const site of prod?.drawCandidates?.()||[]){
      const id=site.cell+':'+site.kind;existing.add(id);
      if(connected(site.cell,site.f,site.level===1?1:2)){
        if(specializedDecay.delete(id)){recoveries++;dirty=true}
        continue;
      }
      let since=specializedDecay.get(id);
      if(since==null){since=now;specializedDecay.set(id,since);dirty=true}
      if(now-since>=REMOVE_SECONDS&&prod?.removeSite?.(site.cell,site.kind)){
        specializedDecay.delete(id);removals++;dirty=true;
      }
    }
    for(const id of specializedDecay.keys())if(!existing.has(id)){specializedDecay.delete(id);dirty=true}
    lastAudit=now;audits++;lastAuditMs=performance.now()-t0;
    if(typeof markEconomyDirty3261==='function')markEconomyDirty3261();
    if(removals>removalsBefore&&window.HexategosTradeLogistics0370?.refresh)window.HexategosTradeLogistics0370.refresh();
    if(dirty){save0373();needsRender=true}
    return dirty;
  }

  function serializeMap0373(map){
    return [...map.entries()].map(([cell,since])=>[cell,Number(since)||0]);
  }
  function restoreMap0373(map,data,set){
    map.clear();
    for(const row of Array.isArray(data)?data:[]){
      const cell=Number(row?.[0]),since=Number(row?.[1]);
      if(Number.isInteger(cell)&&cell>=0&&set.has(cell)&&Number.isFinite(since))map.set(cell,since);
    }
  }
  function serialize0373(){
    return {version:2,city:serializeMap0373(cityDecay),industry:serializeMap0373(industryDecay),port:serializeMap0373(portDecay),specialized:[...specializedDecay]};
  }
  function restore0373(data){
    if(!data||typeof data!=='object'){
      cityDecay.clear();industryDecay.clear();portDecay.clear();specializedDecay.clear();lastAudit=-1e9;return false;
    }
    restoreMap0373(cityDecay,data.city,cities3212);
    restoreMap0373(industryDecay,data.industry,industries3212);
    restoreMap0373(portDecay,data.port,ports3212);
    specializedDecay.clear();
    const ids=new Set([...window.HexategosProduction0388?.drawCandidates?.()||[]].map(s=>s.cell+':'+s.kind));
    for(const [id,since] of data.specialized||[])if(ids.has(id)&&Number.isFinite(Number(since)))specializedDecay.set(id,Number(since));
    lastAudit=-1e9;needsRender=true;return true;
  }
  function save0373(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize0373()))}catch(_){}
  }
  function load0373(){
    try{return restore0373(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'))}catch(_){return restore0373(null)}
  }

  function economyFactor0373(cell){
    let age=-1;
    if(cities3212.has(cell))age=Math.max(age,decayAge0373('city',cell));
    if(industries3212.has(cell))age=Math.max(age,decayAge0373('industry',cell));
    if(ports3212.has(cell))age=Math.max(age,decayAge0373('port',cell));
    if(age<0||age<GRACE_SECONDS)return 1;
    if(age<ABANDONED_SECONDS){
      const p=clamp((age-GRACE_SECONDS)/(ABANDONED_SECONDS-GRACE_SECONDS),0,1);
      return 1-p*.75;
    }
    if(age<FADE_SECONDS)return .08;
    return Math.max(0,.08*(1-clamp((age-FADE_SECONDS)/(REMOVE_SECONDS-FADE_SECONDS),0,1)));
  }

  const baseEconomySupply0373=economyStructureSupply3261;
  economyStructureSupply3261=function(f,cell){
    return baseEconomySupply0373.apply(this,arguments)*economyFactor0373(cell);
  };

  const baseCityIcon0373=drawGlobeCityIcon3249;
  drawGlobeCityIcon3249=function(x,y,id,px){
    const v=visual0373('city',id);if(v.alpha<=0)return;
    ctx.save();ctx.globalAlpha*=v.alpha;if(v.filter!=='none')ctx.filter=v.filter;
    try{return baseCityIcon0373.apply(this,arguments)}finally{ctx.restore()}
  };
  const baseIndustryIcon0373=drawGlobeIndustryIcon3249;
  drawGlobeIndustryIcon3249=function(x,y,id,px){
    const v=visual0373('industry',id);if(v.alpha<=0)return;
    ctx.save();ctx.globalAlpha*=v.alpha;if(v.filter!=='none')ctx.filter=v.filter;
    try{return baseIndustryIcon0373.apply(this,arguments)}finally{ctx.restore()}
  };
  const basePortIcon0373=drawGlobePortIcon3249;
  drawGlobePortIcon3249=function(x,y,id,px){
    const v=visual0373('port',id);if(v.alpha<=0)return;
    ctx.save();ctx.globalAlpha*=v.alpha;if(v.filter!=='none')ctx.filter=v.filter;
    try{return basePortIcon0373.apply(this,arguments)}finally{ctx.restore()}
  };

  // Reutiliza el reloj económico ya existente: no se añade otro setInterval.
  const baseEconomyTick0373=economyTick3212;
  economyTick3212=function(){
    const out=baseEconomyTick0373.apply(this,arguments);
    audit0373(false);
    return out;
  };

  const baseSave0373=saveGame3212;
  saveGame3212=function(){
    const out=baseSave0373.apply(this,arguments);save0373();return out;
  };
  const baseLoad0373=loadGame3212;
  loadGame3212=function(){
    const out=baseLoad0373.apply(this,arguments);load0373();return out;
  };
  const baseReset0373=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset0373.apply(this,arguments);
    cityDecay.clear();industryDecay.clear();portDecay.clear();specializedDecay.clear();lastAudit=-1e9;
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out;
  };

  if(typeof buildPortableFile3275==='function'){
    const basePortableBuild0373=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=basePortableBuild0373.apply(this,arguments);
      file.gameVersion=BUILD;file.payload.infrastructureDecay0373=serialize0373();
      if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const basePortableApply0373=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const data=file?.payload?.infrastructureDecay0373||null;
      const out=basePortableApply0373.apply(this,arguments);
      restore0373(data);save0373();return out;
    };
  }

  function status0373(kind,cell){
    const stage=decayStage0373(kind,cell),age=decayAge0373(kind,cell);
    return {stage,age:age<0?0:Math.round(age),connected:stage==='healthy'};
  }
  function stats0373(){
    return {
      build:BUILD,audits,removals,recoveries,
      tracked:{city:cityDecay.size,industry:industryDecay.size,port:portDecay.size,specialized:specializedDecay.size},
      lastAuditMs:Number(lastAuditMs.toFixed(2)),thresholds:{grace:GRACE_SECONDS,abandoned:ABANDONED_SECONDS,fade:FADE_SECONDS,remove:REMOVE_SECONDS}
    };
  }
  function validate0373(){
    const errors=[],warnings=[],st=stats0373();
    for(const [cell] of cityDecay)if(!cities3212.has(cell))errors.push('ciudad inexistente en degradación: '+cell);
    for(const [cell] of industryDecay)if(!industries3212.has(cell))errors.push('industria inexistente en degradación: '+cell);
    for(const [cell] of portDecay)if(!ports3212.has(cell))errors.push('puerto inexistente en degradación: '+cell);
    if(st.lastAuditMs>18)warnings.push('auditoría de comunicaciones alta: '+st.lastAuditMs+' ms');
    return {ok:errors.length===0,errors,warnings,stats:st};
  }

  window.HexategosInfrastructureDecay0373={
    version:BUILD,status:status0373,visual:visual0373,stats:stats0373,validate:validate0373,
    audit:()=>audit0373(true),isCommunicated:(cell,level=2)=>connections0373()(cell,owner6[cell],level),
    specialStatus:(cell,kind)=>status0373('special',cell+':'+kind),
    productionFactor:(cell,kind)=>{
      const age=decayAge0373('special',cell+':'+kind);
      return age<GRACE_SECONDS?1:age<ABANDONED_SECONDS?1-.75*(age-GRACE_SECONDS)/120:age<FADE_SECONDS?.08:Math.max(0,.08*(1-(age-FADE_SECONDS)/60));
    }
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.37.3 · degradación de infraestructuras aisladas activa');
})();
