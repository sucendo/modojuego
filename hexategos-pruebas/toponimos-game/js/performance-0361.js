'use strict';

// HEXATEGOS 0.36.1 · PERFORMANCE PARA 150/250/350/500 NACIONES.
// No recorta reglas ni capacidades. Reduce trabajo duplicado, barridos mundiales
// innecesarios, matrices revisadas repetidamente y asignaciones temporales.
(() => {
  const BUILD='0.36.1';
  const F=FACTION_CAPACITY3230;

  let relationStamp=-1e9;
  let warDegree=new Uint16Array(F);
  let frontLossStamp=-1e9;
  let frontLoss=new Float32Array(F);
  let fallbackTerritory=null,fallbackTerritoryStamp=-1e9;
  let lastEndCheck=-1e9;
  let lastEconomyRebuildWall=-1e9;
  let dipUiWall=-1e9,dipUiDirty=true;
  let rankPerfWall=-1e9,rankOrderSignature='',rankCountSignature='';
  let ownerCacheOptimizedMs=0;
  let exactEndScans=0;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function invalidateRelations0361(){
    relationStamp=-1e9;
    dipUiDirty=true;
  }

  function relationTargets0361(f){
    const net=window.HexategosDiplomacyNetwork3301;
    if(net?.targetsRef)return net.targetsRef(f);
    if(net?.targets)return net.targets(f);
    const out=[];
    for(let o=0;o<activeFactionCount3230;o++)if(o!==f)out.push(o);
    return out;
  }

  function rebuildWarDegree0361(force=false){
    const stamp=campaignSeconds3230;
    if(!force&&relationStamp===stamp)return warDegree;
    warDegree.fill(0);
    const net=window.HexategosDiplomacyNetwork3301;
    if(net?.targets){
      for(let f=0;f<activeFactionCount3230;f++){
        let n=0;
        const targets=net.targets(f);
        for(let i=0;i<targets.length;i++){
          const o=targets[i];
          if(o!==f&&diplomaticRelation3300(f,o)===-1)n++;
        }
        warDegree[f]=n;
      }
    }else{
      for(let a=0;a<activeFactionCount3230;a++)for(let b=a+1;b<activeFactionCount3230;b++){
        if(diplomaticRelation3300(a,b)!==-1)continue;
        warDegree[a]++;warDegree[b]++;
      }
    }
    relationStamp=stamp;
    return warDegree;
  }

  function rebuildFrontLoss0361(force=false){
    const stamp=campaignSeconds3230;
    if(!force&&frontLossStamp===stamp)return frontLoss;
    frontLoss.fill(0);
    if(typeof aiFronts3280!=='undefined'){
      for(const fr of aiFronts3280){
        const f=fr?.nationId;
        if(f>=0&&f<activeFactionCount3230)
          frontLoss[f]+=Math.min(10,(fr.losses||0)*.025);
      }
    }
    frontLossStamp=stamp;
    return frontLoss;
  }

  // Economía diplomática: las relaciones no neutrales forman parte obligatoria
  // de la red de contacto, por lo que no necesitamos revisar 500 países por cada
  // país en cada tick económico.
  warCount3261=function(f){
    if(f<0||f>=activeFactionCount3230)return 0;
    return rebuildWarDegree0361(false)[f]||0;
  };

  tradeIncome3261=function(f,snap){
    const targets=relationTargets0361(f);
    let total=0,partners=0;
    for(let i=0;i<targets.length;i++){
      const o=targets[i];
      if(o===f||o<0||o>=activeFactionCount3230)continue;
      const rel=diplomaticRelation3300(f,o);
      if(rel!==1&&rel!==3)continue;
      partners++;
      const partnerIndustry=snap.industryWeighted[o]||0,partnerPorts=snap.portCount[o]||0;
      const ownPorts=snap.portCount[f]||0;
      let value=.16+Math.min(.62,(snap.territory[o]||0)*.00125)+
        Math.min(.48,partnerIndustry*.021)+Math.min(.24,partnerPorts*.038);
      if(rel===3)value+=.14;
      value*=ownPorts&&partnerPorts?1.0:.58;
      total+=value;
    }
    if(!partners)return 0;
    const ownPorts=snap.portCount[f]||0;
    const roleBonus=FACTIONS3230[f]?.role==='naval'?1.15:FACTIONS3230[f]?.role==='growth'?1.08:1;
    return Math.min(3.2,total*Math.min(1.35,.82+ownPorts*.055)*roleBonus);
  };

  // El snapshot económico ya es global. Con cientos de naciones no tiene sentido
  // reconstruir 510k celdas cada vez que cambia un único hexágono.
  const baseEnsureEconomy0361=ensureEconomySnapshot3261;
  ensureEconomySnapshot3261=function(force=false){
    if(force||!economySnapshot3261){
      const out=baseEnsureEconomy0361(true);
      lastEconomyRebuildWall=performance.now();
      return out;
    }
    const age=campaignSeconds3230-economyLastCampaign3261;
    const minAge=activeFactionCount3230>=450?4:activeFactionCount3230>=350?3.5:3;
    const maxAge=activeFactionCount3230>=350?7:6;
    const wall=performance.now();
    const dirtyDue=economyDirty3261&&age>=minAge&&wall-lastEconomyRebuildWall>=1800;
    if(age>=maxAge||dirtyDue){
      const out=rebuildEconomySnapshot3261();
      lastEconomyRebuildWall=wall;
      return out;
    }
    return economySnapshot3261;
  };

  function territoryCounts0361(){
    // Elegir el snapshot MÁS RECIENTE. Ambos ya recorren el mundo por otros
    // motivos; reutilizamos el último disponible para que HUD/ranking no queden
    // artificialmente atrasados sin provocar un nuevo barrido de 510k celdas.
    const aiOk=aiSnapshot3260?.territory?.length>=activeFactionCount3230;
    const ecoOk=economySnapshot3261?.territory?.length>=activeFactionCount3230;
    if(aiOk&&ecoOk){
      const aiT=Number(aiSnapshot3260.campaign)||0,ecoT=Number(economySnapshot3261.campaign)||0;
      return ecoT>aiT?economySnapshot3261.territory:aiSnapshot3260.territory;
    }
    if(aiOk)return aiSnapshot3260.territory;
    if(ecoOk)return economySnapshot3261.territory;
    if(fallbackTerritory&&fallbackTerritoryStamp===ownerCacheVersion3298)
      return fallbackTerritory;
    const counts=new Int32Array(F);
    if(owner6?.length)for(let i=0;i<owner6.length;i++){
      const f=owner6[i];if(f>=0&&f<F)counts[f]++;
    }
    fallbackTerritory=counts;
    fallbackTerritoryStamp=ownerCacheVersion3298;
    return counts;
  }

  countFaction3230=function(f){
    if(f<0||f>=activeFactionCount3230)return 0;
    return territoryCounts0361()[f]||0;
  };
  domination3230=function(f=0){
    return TOTAL_LAND3230?(countFaction3230(f)/TOTAL_LAND3230*100):0;
  };

  function exactTerritoryCounts0361(){
    const counts=new Int32Array(F);
    for(let i=0;i<owner6.length;i++){
      const f=owner6[i];if(f>=0&&f<F)counts[f]++;
    }
    exactEndScans++;
    return counts;
  }

  // El antiguo checkEnd podía terminar haciendo un barrido de 510k celdas por
  // nación. Ahora normalmente es O(500) y solo hace UN barrido exacto si alguien
  // está realmente cerca del 80 % o el jugador parece eliminado.
  checkEnd3230=function(){
    if(endShown3230||!started3230)return;
    const now=campaignSeconds3230;
    if(now-lastEndCheck<4)return;
    lastEndCheck=now;
    let counts=territoryCounts0361();
    let player=counts[0]||0,maxF=0,maxN=player;
    for(let f=1;f<activeFactionCount3230;f++){
      const n=counts[f]||0;if(n>maxN){maxN=n;maxF=f}
    }
    const nearEnd=player<=0||maxN>=TOTAL_LAND3230*.79;
    if(nearEnd){
      counts=exactTerritoryCounts0361();
      player=counts[0]||0;maxF=0;maxN=player;
      for(let f=1;f<activeFactionCount3230;f++){
        const n=counts[f]||0;if(n>maxN){maxN=n;maxF=f}
      }
    }
    if(player<=0){showEnd3230('DERROTA','Has perdido todo tu territorio.');return}
    if(player/TOTAL_LAND3230>=.80){showEnd3230('VICTORIA','Has alcanzado el 80 % del territorio terrestre conquistable.');return}
    if(maxF>0&&maxN/TOTAL_LAND3230>=.80)
      showEnd3230('DERROTA',factionName3230(maxF)+' domina más del 80 % del mundo.');
  };

  // Caché de propietario por LOD sin crear un Int32Array(501) para CADA celda
  // del LOD. Se reutiliza un único contador y solo se limpian índices tocados.
  const ownerVote0361=new Uint16Array(F+1);
  const ownerTouched0361=new Uint16Array(F+1);
  buildOwnerCacheKey3298=function(key){
    if(key===MAX_GAME_LEVEL3233)return owner6;
    const t0=performance.now(),L=loadLevel(key),g=loadGroups(key),arr=new Int16Array(L.n);
    for(let i=0;i<L.n;i++){
      let tn=0,best=-1,bn=-1;
      const s=g.offsets[i],e=g.offsets[i+1];
      for(let k=s;k<e;k++){
        const o=owner6[g.ids[k]],ix=o<0?0:o+1;
        if(ownerVote0361[ix]===0)ownerTouched0361[tn++]=ix;
        ownerVote0361[ix]++;
      }
      for(let t=0;t<tn;t++){
        const ix=ownerTouched0361[t],n=ownerVote0361[ix];
        if(n>bn){bn=n;best=ix===0?-1:ix-1}
      }
      arr[i]=best;
      for(let t=0;t<tn;t++)ownerVote0361[ownerTouched0361[t]]=0;
    }
    ownerCache[key]=arr;
    ownerCacheStamp3298[key]=ownerCacheVersion3298;
    ownerCacheBuildMs3298=performance.now()-t0;
    ownerCacheOptimizedMs=ownerCacheBuildMs3298;
    return arr;
  };

  // Clasificación de hasta 500 filas: si el orden no cambia, actualizamos
  // únicamente las cifras. Evita destruir/recrear cientos de nodos DOM en cada
  // refresco durante las fases de expansión rápida.
  updateRanking3220=function(force=false){
    if(typeof worldReady3301==='function'&&!worldReady3301())return;
    const wall=performance.now();
    const period=activeFactionCount3230>=450?5000:activeFactionCount3230>=350?4200:
                 activeFactionCount3230>=250?3400:2800;
    if(!force&&wall-rankPerfWall<period)return;
    rankPerfWall=wall;
    const t0=performance.now(),counts=territoryCounts0361(),arr=[];
    for(let f=0;f<activeFactionCount3230;f++)
      if((counts[f]||0)>0||f===0)arr.push([f,counts[f]||0]);
    arr.sort((a,b)=>b[1]-a[1]||a[0]-b[0]);
    const orderSig=arr.map(x=>x[0]).join(',');
    const countSig=arr.map(x=>x[1]).join(',');
    if(!force&&orderSig===rankOrderSignature&&countSig===rankCountSignature)return;
    const el=document.getElementById('rankRows3213');if(!el)return;
    if(orderSig!==rankOrderSignature||el.children.length!==arr.length){
      el.innerHTML=arr.map((r,k)=>
        '<div class="rankRow3213" data-faction="'+r[0]+'" role="button" tabindex="0" aria-label="Ir a la capital de '+
        factionName3230(r[0]).replace(/"/g,'&quot;')+'" title="Ir a la capital de '+
        factionName3230(r[0]).replace(/"/g,'&quot;')+'">'+
        '<i class="rankDot3213" style="background:'+(FACTIONS3230[r[0]]?.color||'#80909b')+'"></i>'+
        '<span>'+(k+1)+'. '+factionName3230(r[0])+'</span><small>'+r[1].toLocaleString('es-ES')+'</small></div>'
      ).join('');
    }else{
      for(let k=0;k<arr.length;k++){
        const small=el.children[k]?.querySelector('small'),txt=arr[k][1].toLocaleString('es-ES');
        if(small&&small.textContent!==txt)small.textContent=txt;
      }
    }
    rankOrderSignature=orderSig;rankCountSignature=countSig;
    if(typeof rankingCountMs3298!=='undefined')rankingCountMs3298=performance.now()-t0;
  };

  // La pestaña de diplomacia puede contener cientos de filas. Evitamos recrear
  // todo el DOM cada 2,2 s si no ha cambiado ninguna relación.
  const baseRenderDiplomacy0361=renderDiplomacy3300;
  renderDiplomacy3300=function(){
    const host=document.getElementById('sysContent3213'),wall=performance.now();
    const already=!!host?.querySelector('.dipSummary3300');
    if(already&&!dipUiDirty&&wall-dipUiWall<5000)return;
    const out=baseRenderDiplomacy0361.apply(this,arguments);
    dipUiWall=wall;dipUiDirty=false;
    return out;
  };

  const baseSetRelation0361=setDiplomaticRelation3300;
  setDiplomaticRelation3300=function(){
    const out=baseSetRelation0361.apply(this,arguments);
    invalidateRelations0361();
    return out;
  };
  const baseInitDiplomacy0361=initDiplomacy3300;
  initDiplomacy3300=function(){
    const out=baseInitDiplomacy0361.apply(this,arguments);
    invalidateRelations0361();
    return out;
  };
  const baseRestoreDiplomacy0361=restoreDiplomacy3300;
  restoreDiplomacy3300=function(){
    const out=baseRestoreDiplomacy0361.apply(this,arguments);
    invalidateRelations0361();
    return out;
  };
  const baseAbsorb0361=absorbLegacyPlayerRelations3300;
  absorbLegacyPlayerRelations3300=function(){
    const out=baseAbsorb0361.apply(this,arguments);
    relationStamp=-1e9;
    return out;
  };
  const baseOffer0361=createPlayerOffer3300;
  createPlayerOffer3300=function(){
    const out=baseOffer0361.apply(this,arguments);if(out)dipUiDirty=true;return out;
  };
  const baseAccept0361=acceptDiplomaticOffer3300;
  acceptDiplomaticOffer3300=function(){dipUiDirty=true;return baseAccept0361.apply(this,arguments)};
  const baseReject0361=rejectDiplomaticOffer3300;
  rejectDiplomaticOffer3300=function(){dipUiDirty=true;return baseReject0361.apply(this,arguments)};

  function stats0361(){
    const counts=territoryCounts0361();
    let alive=0;for(let f=0;f<activeFactionCount3230;f++)if((counts[f]||0)>0)alive++;
    return {
      build:BUILD,active:activeFactionCount3230,alive,
      warCacheCampaign:relationStamp,
      economySnapshotAge:economySnapshot3261?campaignSeconds3230-economyLastCampaign3261:null,
      ownerCacheMs:Number(ownerCacheOptimizedMs.toFixed(2)),
      exactEndScans,
      ai:window.HexategosNationAI0360?.stats?.().scheduler||null
    };
  }
  function validate0361(){
    const errors=[],warnings=[],st=stats0361();
    if(FACTION_CAPACITY3230!==500)errors.push('capacidad de facciones distinta de 500');
    if(!Array.isArray(FACTION_COUNT_OPTIONS3230)||FACTION_COUNT_OPTIONS3230.join(',')!=='150,250,350,500')
      errors.push('selector de naciones incorrecto');
    if(st.ownerCacheMs>45)warnings.push('caché LOD pesada: '+st.ownerCacheMs+' ms');
    if((st.ai?.lastTickMs||0)>35)warnings.push('tick IA alto: '+st.ai.lastTickMs+' ms');
    return {ok:errors.length===0,errors,warnings,stats:st};
  }

  window.HexategosPerformance0361={
    version:BUILD,stats:stats0361,validate:validate0361,
    warCount:f=>rebuildWarDegree0361(false)[Number(f)]||0,
    frontLossPressure:f=>rebuildFrontLoss0361(false)[Number(f)]||0,
    invalidateRelations:invalidateRelations0361
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.36.1 rendimiento adaptativo activo');
})();
