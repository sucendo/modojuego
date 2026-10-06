'use strict';

// HEXATEGOS 0.35.8 · entidades políticas unificadas + compatibilidad de partidas.
// Las 16/25/35/50 plazas siguen siendo naciones principales con IA completa.
// Las entidades menores viven en una capa independiente y barata: no amplían
// matrices diplomáticas, no participan en los bucles O(N²) y no consumen slots.
(() => {
  const BUILD='0.35.8';
  const SAVE_KEY='hexategos-minor-polities-0357';
  const TARGET_SECONDS=300;
  const TARGET_OCCUPANCY=.975;
  const MAX_CLAIMS_PER_TICK=4200;
  const MIN_CLAIMS_PER_TICK=160;
  const LABEL_ZOOM=2.65;

  const TYPES={
    village:{label:'PUEBLO',growth:.48,weight:44},
    citystate:{label:'CIUDAD-ESTADO',growth:.58,weight:13},
    minor:{label:'ESTADO MENOR',growth:.72,weight:29},
    regional:{label:'ESTADO REGIONAL',growth:.90,weight:14}
  };
  const PERSONALITIES=[
    {id:'conformist',label:'CONFORMISTA',growth:.72},
    {id:'commercial',label:'COMERCIAL',growth:.93},
    {id:'defensive',label:'DEFENSIVA',growth:.82},
    {id:'opportunist',label:'OPORTUNISTA',growth:1.08},
    {id:'localist',label:'LOCALISTA',growth:.66}
  ];
  const PALETTE=[
    '#7b8f63','#7f6f9a','#9a765f','#5e8793','#927e55','#65836d',
    '#8b6680','#6e7f9b','#8a875d','#627b83','#8c6e5d','#708d7a',
    '#776b91','#8f805f','#638a87','#8a6f78','#7f8b66','#6b7894',
    '#96735e','#62806f','#857291','#78875e','#66818f','#8f6c69'
  ];

  let ownerMinor0357=null;
  let entities0357=[];
  let queue0357=null,head0357=0,tail0357=0;
  let totalLand0357=0,majorAtInit0357=0,claimed0357=0;
  let initialized0357=false,lastCampaign0357=-1;
  let seed0357=1,restoredMeta0357=null,lastStepMs0357=0,layerStartedCampaign0357=0;
  let rankingLastWall0358=-1e9,rankingSignature0358='';

  function hash0357(x){
    x=(x|0)+0x6D2B79F5;
    x=Math.imul(x^(x>>>15),x|1);
    x^=x+Math.imul(x^(x>>>7),x|61);
    return (x^(x>>>14))>>>0;
  }
  function rand010357(x){return hash0357(x)/4294967296}
  function clamp0357(v,a,b){return Math.max(a,Math.min(b,v))}
  function typeFor0357(n){
    const r=rand010357(seed0357+n*97)*100;
    let sum=0;
    for(const [id,t] of Object.entries(TYPES)){sum+=t.weight;if(r<sum)return id}
    return 'minor';
  }
  function personalityFor0357(n){
    return PERSONALITIES[hash0357(seed0357+n*193)%PERSONALITIES.length];
  }
  function minorCount0357(){
    const jitter=(hash0357(seed0357^0x35A7)%51)-25;
    // Con más naciones principales hacen falta menos entidades de relleno.
    return clamp0357(Math.round(224-(activeFactionCount3230-16)*2.15+jitter),105,245);
  }
  function color0357(n,type){
    const shift=type==='regional'?3:type==='minor'?1:type==='citystate'?5:0;
    return PALETTE[(n*7+shift)%PALETTE.length];
  }
  function shortGeo0357(cell){
    try{
      const s=(typeof geographicNameForCell3244==='function'?geographicNameForCell3244(cell):landName3230(cell))||'Territorio';
      return String(s).replace(/^Región de\s+/i,'').slice(0,34);
    }catch(_){return 'Territorio'}
  }
  function uniqueName0357(type,cell,n){
    // El nombre visible no revela nunca la categoría interna de la entidad.
    const g=shortGeo0357(cell);
    const variants=[g,g+' Norte',g+' Sur',g+' Oriental',g+' Occidental',g+' Central'];
    let base=variants[hash0357(seed0357^n^cell)%variants.length]||g;
    let dup=entities0357.filter(e=>e.name===base).length;
    return dup?base+' '+String.fromCharCode(65+(dup%26)):base;
  }
  function neutralizeLegacyName0358(name,cell,n){
    const raw=String(name||'').trim();
    if(!/^(Comunidad de |Ciudad de |Estado regional de |Estado de |Entidad \d+$)/i.test(raw))return raw;
    return uniqueName0357('minor',cell,n);
  }
  function computeSeed0357(){
    let h=(activeFactionCount3230*2654435761)>>>0;
    for(let f=0;f<activeFactionCount3230;f++){
      const c=capitals?.[f]??-1;
      h=hash0357(h^((c+1)*97));
    }
    return h||1;
  }
  function validMinorCell0357(c,L){
    return c>=0&&c<L.n&&L.land[c]>=0&&owner6[c]<0;
  }

  function buildEntities0357(saved=null){
    const L=loadLevel(MAX_GAME_LEVEL3233);
    ownerMinor0357=new Int16Array(L.n);ownerMinor0357.fill(-1);
    queue0357=new Int32Array(L.n);
    head0357=tail0357=0;claimed0357=0;totalLand0357=0;majorAtInit0357=0;
    for(let i=0;i<L.n;i++)if(L.land[i]>=0){totalLand0357++;if(owner6[i]>=0)majorAtInit0357++}

    seed0357=saved?.seed||computeSeed0357();
    entities0357=[];
    const savedRows=Array.isArray(saved?.entities)?saved.entities:null;
    const want=savedRows?.length||minorCount0357();
    const used=new Set();
    const stride=7919;
    let probe=hash0357(seed0357)%L.n,attempts=0;

    for(let n=0;n<want&&attempts<L.n*3;){
      const proposed=savedRows?.[n]?.seed;
      let cell=Number.isInteger(proposed)?proposed:probe;
      if(!Number.isInteger(proposed))probe=(probe+stride)%L.n;
      attempts++;
      if(!validMinorCell0357(cell,L)||used.has(cell)){
        if(Number.isInteger(proposed)){
          // La capital menor puede haber sido absorbida por una nación principal.
          // Se conserva la entidad en metadatos, pero no se fuerza sobre territorio mayor.
          const row=savedRows[n],type=row.type||typeFor0357(n),p=PERSONALITIES.find(x=>x.id===row.personality)||personalityFor0357(n);
          entities0357.push({id:n,seed:cell,type,name:row.name||('Entidad '+(n+1)),color:row.color||color0357(n,type),personality:p.id,growth:TYPES[type]?.growth||.7});
          n++;
        }
        continue;
      }
      used.add(cell);
      const row=savedRows?.[n];
      const type=row?.type||typeFor0357(n),p=PERSONALITIES.find(x=>x.id===row?.personality)||personalityFor0357(n);
      const visibleName=row?.name?neutralizeLegacyName0358(row.name,cell,n):uniqueName0357(type,cell,n);
      const e={id:n,seed:cell,type,name:visibleName,color:row?.color||color0357(n,type),personality:p.id,growth:(TYPES[type]?.growth||.7)*p.growth};
      entities0357.push(e);
      ownerMinor0357[cell]=n;queue0357[tail0357++]=cell;claimed0357++;n++;
    }

    initialized0357=true;
    layerStartedCampaign0357=campaignSeconds3230;
    lastCampaign0357=campaignSeconds3230;
    persistMeta0357();
    needsRender=true;
  }

  function persistMeta0357(){
    if(!initialized0357)return;
    const payload={version:1,seed:seed0357,entities:entities0357.map(e=>({
      seed:e.seed,type:e.type,name:e.name,color:e.color,personality:e.personality
    }))};
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(payload))}catch(_){}
  }
  function loadMeta0357(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      return raw?JSON.parse(raw):null;
    }catch(_){return null}
  }
  function clearMeta0357(){try{localStorage.removeItem(SAVE_KEY)}catch(_){}}

  function desiredCoverage0357(){
    // Cada campaña existente recibe cinco minutos reales de simulación desde que
    // esta capa se incorpora; no intentamos rellenar de golpe una partida antigua.
    const elapsed=Math.max(0,campaignSeconds3230-layerStartedCampaign0357);
    const t=clamp0357(elapsed/TARGET_SECONDS,0,1);
    return Math.min(TARGET_OCCUPANCY,.055+(TARGET_OCCUPANCY-.055)*Math.pow(t,.70));
  }
  function targetMinorClaims0357(){
    return Math.max(entities0357.length,Math.floor(totalLand0357*desiredCoverage0357())-majorAtInit0357);
  }
  function acceptClaim0357(entity,cell,from){
    const type=TYPES[entity.type]||TYPES.minor;
    // Se permite que los conformistas/localistas formen territorios más pequeños
    // sin crear una IA táctica por entidad.
    let p=clamp0357(entity.growth,.30,.98);
    if(type===TYPES.regional)p=Math.min(.99,p+.04);
    const r=rand010357(seed0357^Math.imul(cell+1,1103515245)^Math.imul(from+7,12345));
    return r<p;
  }

  function reseedFrontier0357(L,maxSeeds=48){
    if(head0357<tail0357||claimed0357>=targetMinorClaims0357())return;
    let added=0,tries=0,probe=hash0357(seed0357^claimed0357^Math.floor(campaignSeconds3230*17))%L.n;
    while(added<maxSeeds&&tries<Math.min(L.n,18000)&&tail0357<queue0357.length){
      const cell=probe;
      probe=(probe+7919)%L.n;tries++;
      if(L.land[cell]<0||owner6[cell]>=0||ownerMinor0357[cell]>=0)continue;
      const id=hash0357(seed0357^cell)%Math.max(1,entities0357.length);
      ownerMinor0357[cell]=id;queue0357[tail0357++]=cell;claimed0357++;added++;
    }
  }

  function grow0357(force=false,maxClaims=MAX_CLAIMS_PER_TICK){
    if(!initialized0357||(!force&&paused3230)||!started3230||!queue0357)return;
    const t0=performance.now(),L=loadLevel(MAX_GAME_LEVEL3233),target=targetMinorClaims0357();
    if(claimed0357>=target)return;
    reseedFrontier0357(L);
    let budget=clamp0357(target-claimed0357,MIN_CLAIMS_PER_TICK,Math.max(MIN_CLAIMS_PER_TICK,maxClaims));
    let guard=0;
    while(head0357<tail0357&&budget>0&&guard<MAX_CLAIMS_PER_TICK*14){
      const c=queue0357[head0357++],id=ownerMinor0357[c];guard++;
      if(id<0)continue;
      const entity=entities0357[id];if(!entity)continue;
      const s=L.offsets[c],e=L.offsets[c+1];
      for(let k=s;k<e&&budget>0;k++){
        const n=L.edgeNbr[k];
        if(n<0||L.land[n]<0||owner6[n]>=0||ownerMinor0357[n]>=0)continue;
        if(!acceptClaim0357(entity,n,c))continue;
        ownerMinor0357[n]=id;
        if(tail0357<queue0357.length)queue0357[tail0357++]=n;
        claimed0357++;budget--;
        if(claimed0357>=target)break;
      }
    }
    lastStepMs0357=performance.now()-t0;
    if(budget<Math.max(MIN_CLAIMS_PER_TICK,maxClaims))needsRender=true;
  }

  function bootstrapVisible0358(){
    if(!initialized0357||!started3230)return;
    const goal=Math.max(entities0357.length,Math.floor(totalLand0357*.09)-majorAtInit0357);
    let rounds=0;
    const run=()=>{
      if(!initialized0357||claimed0357>=goal||rounds>=20){updateRanking3220();needsRender=true;return}
      const before=claimed0357;
      // Fuerza crecimiento aun si la partida cargada está en pausa, pero en trozos.
      const originalStart=layerStartedCampaign0357;
      layerStartedCampaign0357=Math.min(layerStartedCampaign0357,campaignSeconds3230-TARGET_SECONDS*.12);
      grow0357(true,2400);
      layerStartedCampaign0357=originalStart;
      rounds++;
      if(claimed0357===before){needsRender=true;updateRanking3220();return}
      (window.requestIdleCallback||((fn)=>setTimeout(fn,0)))(run,{timeout:80});
    };
    run();
  }

  function syncMajorConquests0357(){
    // Sin escanear el planeta: la capa principal siempre tiene prioridad en render
    // y en lógica. La propiedad menor subyacente no participa en combate/economía.
  }

  function entityAt0357(cell){
    if(!ownerMinor0357||cell<0||cell>=ownerMinor0357.length||owner6[cell]>=0)return null;
    const id=ownerMinor0357[cell];
    return id>=0?entities0357[id]||null:null;
  }

  // La capa menor solo colorea el modo político. Terreno, suministro y
  // geopolítica principal conservan exactamente su coste y semántica.
  const baseTerrainFill0357=terrainStrategicFill3247;
  terrainStrategicFill3247=function(key,i,L,own,z){
    if(mapMode3252==='political'&&key===MAX_GAME_LEVEL3233&&own<0&&ownerMinor0357){
      const id=ownerMinor0357[i];
      if(id>=0){
        const e=entities0357[id];
        if(e){
          // Exactamente el mismo lenguaje visual que las demás naciones:
          // terreno base + tinte político. No hay un estilo "menor".
          const type=terrainType3247(key,i,L);
          const base=TERRAIN_PALETTE3247[type]||TERRAIN_PALETTE3247.plain;
          const rgb=hexRGB3247(e.color);
          const tint=zoom<1.7?.58:zoom<3.5?.50:zoom<7?.43:.36;
          return shadedRGB3247(mixRGB3247(base,rgb,tint),z);
        }
      }
    }
    return baseTerrainFill0357.apply(this,arguments);
  };

  // Capitales/nombres menores: como máximo unas centenas de proyecciones y solo
  // al acercarse. No se recorren celdas del mundo para dibujarlos.
  const baseInfra0357=drawInfrastructure3212;
  drawInfrastructure3212=function(R,cx,cy,now){
    const out=baseInfra0357.apply(this,arguments);
    if(!initialized0357||zoom<LABEL_ZOOM||currentKey!==MAX_GAME_LEVEL3233)return out;
    const L=loadLevel(MAX_GAME_LEVEL3233),C=L.centers;
    ctx.save();ctx.textAlign='center';ctx.textBaseline='bottom';
    let drawn=0;
    for(const e of entities0357){
      const c=e.seed;
      if(c<0||c>=L.n||owner6[c]>=0||ownerMinor0357[c]!==e.id)continue;
      const j=c*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(!globeIconVisible3249(p,.08))continue;
      const px=globeIconScale3249();
      drawGlobeCapitalIcon3249(p[0],p[1],false,px*.93);
      if(zoom>=3.15&&p[2]>.35&&drawn<55){
        ctx.font='700 7px system-ui';ctx.textAlign='left';ctx.textBaseline='middle';
        ctx.lineWidth=2.2;ctx.strokeStyle='rgba(2,7,12,.85)';ctx.strokeText(e.name,p[0]+px*.78,p[1]);
        ctx.fillStyle='rgba(241,246,250,.88)';ctx.fillText(e.name,p[0]+px*.78,p[1]);
      }
      drawn++;
    }
    ctx.restore();
    return out;
  };

  // Aprovechamos el reloj económico existente: cero timers periódicos nuevos.
  const baseEconomyTick0357=economyTick3212;
  economyTick3212=function(){
    const out=baseEconomyTick0357.apply(this,arguments);
    if(started3230){
      if(!initialized0357)buildEntities0357(restoredMeta0357||loadMeta0357());
      grow0357();syncMajorConquests0357();
    }
    return out;
  };

  const baseBuildWorld0357=buildCustomWorld3302;
  buildCustomWorld3302=function(){
    clearMeta0357();initialized0357=false;restoredMeta0357=null;
    const out=baseBuildWorld0357.apply(this,arguments);
    if(out)setTimeout(()=>{if(started3230){buildEntities0357(null);bootstrapVisible0358()}},0);
    return out;
  };

  const baseLoad0357=loadGame3212;
  loadGame3212=function(){
    restoredMeta0357=loadMeta0357();
    initialized0357=false;
    const out=baseLoad0357.apply(this,arguments);
    setTimeout(()=>{if(started3230&&!initialized0357){buildEntities0357(restoredMeta0357);bootstrapVisible0358()}},0);
    return out;
  };

  const baseReset0357=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset0357.apply(this,arguments);
    ownerMinor0357=null;entities0357=[];queue0357=null;head0357=tail0357=0;initialized0357=false;
    if(clearSave)clearMeta0357();
    return out;
  };

  // Portable saves: metadatos pequeños; el mapa menor se reconstruye de forma
  // determinista. No añadimos un Int16Array de cientos de miles de celdas al JSON.
  if(typeof currentPersistentPayload3273==='function'){
    const basePayload0357=currentPersistentPayload3273;
    currentPersistentPayload3273=function(){
      const p=basePayload0357.apply(this,arguments);
      p.minorPolities={version:1,seed:seed0357,entities:entities0357.map(e=>({
        seed:e.seed,type:e.type,name:e.name,color:e.color,personality:e.personality
      }))};
      return p;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const baseApplyPortable0357=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const out=baseApplyPortable0357.apply(this,arguments);
      const m=file?.payload?.minorPolities;
      if(m){try{localStorage.setItem(SAVE_KEY,JSON.stringify(m))}catch(_){}}
      else clearMeta0357();
      restoredMeta0357=m||null;initialized0357=false;
      setTimeout(()=>{if(started3230){buildEntities0357(restoredMeta0357);bootstrapVisible0358()}},0);
      return out;
    };
  }

  // No mostramos al jugador ninguna etiqueta que revele la jerarquía interna.
  // El diagnóstico queda disponible únicamente para desarrollo mediante la API.


  function stats0357(){
    const counts={village:0,citystate:0,minor:0,regional:0};
    for(const e of entities0357)counts[e.type]=(counts[e.type]||0)+1;
    return {
      version:BUILD,initialized:initialized0357,mainStates:activeFactionCount3230,
      minorEntities:entities0357.length,types:counts,totalLand:totalLand0357,
      minorClaimed:claimed0357,coverageTarget:desiredCoverage0357(),
      estimatedOccupancy:totalLand0357?(majorAtInit0357+claimed0357)/totalLand0357:0,
      queue:{head:head0357,tail:tail0357},lastStepMs:lastStepMs0357,
      memoryBytes:(ownerMinor0357?.byteLength||0)+(queue0357?.byteLength||0)
    };
  }

  // El jugador elige la escala inicial sin exponer la jerarquía interna.
  function relabelSetup0357(){
    const title=document.querySelector('#nationScale0341 .nationScaleTitle0341 b');
    if(title)title.textContent='NACIONES';
    const hint=document.getElementById('nationScaleHint0341');
    if(hint)hint.textContent=activeFactionCount3230+' naciones iniciales · el mapa político evolucionará de forma dinámica durante la partida.';
    const meta=document.querySelector('#newGameSetup3302 .newGameSetupMeta3302');
    if(meta)meta.textContent='Las demás entidades políticas aparecerán y evolucionarán de forma dinámica según la geografía y el desarrollo de la partida.';
  }
  const baseBeginSetup0357=beginNewGameSetup3302;
  beginNewGameSetup3302=function(){
    const out=baseBeginSetup0357.apply(this,arguments);
    relabelSetup0357();
    return out;
  };
  setTimeout(relabelSetup0357,0);

  function focusMinor0358(id){
    id=Number(id);const e=entities0357[id];if(!e)return false;
    const cell=e.seed;
    if(cell<0||owner6[cell]>=0||ownerMinor0357?.[cell]!==id)return false;
    try{
      closeContextDialog3244?.();
      const {lon,lat}=cellLonLat3302(cell);
      const coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
      rotateToGeo3243(lon,lat,coarse?7.1:5.7);
      selected={key:MAX_GAME_LEVEL3233,i:cell};
      if(typeof uiInteractionState3244!=='undefined')uiInteractionState3244.selectedCell=cell;
      updatePanel();needsRender=true;toast(e.name);
      return true;
    }catch(_){return false}
  }

  function unifiedRanking0358(force=false){
    if(!initialized0357||!ownerMinor0357||!owner6)return;
    const wall=performance.now();
    if(!force&&wall-rankingLastWall0358<850)return;
    rankingLastWall0358=wall;

    const majorCounts=new Int32Array(activeFactionCount3230);
    const minorCounts=new Int32Array(entities0357.length);
    for(let i=0;i<owner6.length;i++){
      const f=owner6[i];
      if(f>=0&&f<majorCounts.length)majorCounts[f]++;
      else{
        const m=ownerMinor0357[i];
        if(m>=0&&m<minorCounts.length)minorCounts[m]++;
      }
    }
    const rows=[];
    for(let f=0;f<majorCounts.length;f++)if(majorCounts[f]>0||f===0)
      rows.push({kind:'major',id:f,name:factionName3230(f),color:FACTIONS3230[f]?.color||'#80909b',count:majorCounts[f]});
    for(let m=0;m<minorCounts.length;m++)if(minorCounts[m]>0){
      const e=entities0357[m];
      rows.push({kind:'minor',id:m,name:e.name,color:e.color,count:minorCounts[m]});
    }
    rows.sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'es'));
    const signature=rows.map(r=>r.kind[0]+r.id+':'+r.count).join('|');
    if(!force&&signature===rankingSignature0358)return;
    rankingSignature0358=signature;

    const host=document.getElementById('rankRows3213');if(!host)return;
    host.innerHTML=rows.map((r,k)=>
      '<div class="rankRow3213" role="button" tabindex="0" '+
      (r.kind==='major'?'data-faction="'+r.id+'"':'data-minor0358="'+r.id+'"')+
      ' aria-label="Ir a la capital de '+String(r.name).replace(/"/g,'&quot;')+'" title="Ir a la capital de '+String(r.name).replace(/"/g,'&quot;')+'">'+
      '<i class="rankDot3213" style="background:'+r.color+'"></i><span>'+(k+1)+'. '+r.name+'</span><small>'+r.count.toLocaleString('es-ES')+'</small></div>'
    ).join('');
  }

  const baseRankingUnified0358=updateRanking3220;
  updateRanking3220=function(){
    if(!initialized0357)return baseRankingUnified0358.apply(this,arguments);
    return unifiedRanking0358(false);
  };
  const rankHost0358=document.getElementById('rankRows3213');
  rankHost0358?.addEventListener('click',e=>{
    const row=e.target.closest('.rankRow3213[data-minor0358]');
    if(row)focusMinor0358(row.dataset.minor0358);
  });
  rankHost0358?.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const row=e.target.closest('.rankRow3213[data-minor0358]');
    if(!row)return;e.preventDefault();focusMinor0358(row.dataset.minor0358);
  });

  window.HexategosMinorPolities0357={
    version:BUILD,stats:stats0357,entityAt:entityAt0357,
    entities:()=>entities0357.map(e=>({...e})),
    rebuild:()=>{initialized0357=false;buildEntities0357(loadMeta0357());return stats0357()}
  };
  window.HEXATEGOS_VERSION=BUILD;

  // Campañas abiertas al actualizar reciben la capa nueva sin reiniciarse.
  setTimeout(()=>{
    if(started3230&&!initialized0357){buildEntities0357(loadMeta0357());bootstrapVisible0358();}
  },0);

  console.info('[HEXATEGOS] 0.35.8 entidades políticas unificadas activas · HexategosMinorPolities0357.stats()');
})();
