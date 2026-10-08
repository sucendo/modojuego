'use strict';

(() => {
  const BUILD='0.37.24';
  const SAVE_KEY='hexategos-trade-logistics-0370';
  const TRADE_TICK_MS=2800;
  const ROAD_REFRESH_SECONDS=18;
  const MAX_ROUTES=720;
  const MAX_ROUTES_PER_FACTION=4;
  const TRAFFIC_ZOOM=25;

  // 0.37.10: velocidad visual expresada en hexágonos/segundo.
  // La longitud total de la ruta deja de alterar la velocidad del vehículo.
  const DOMESTIC_TRAFFIC_CELLS_PER_SECOND=.78;
  const LAND_TRADE_CELLS_PER_SECOND=.92;
  const SEA_TRADE_CELLS_PER_SECOND=.72;

  let routes=[];
  let nextRouteId=1;
  let permits=new Map();
  let tradeCache=new Float32Array(FACTIONS3230.length);
  let goodsCache=new Float32Array(FACTIONS3230.length);
  let dirty=true;
  let lastCacheWall=-1e9;
  let lastRoadCampaign=-1e9;
  let roadEpoch=0;
  let roadMask=null;
  let roadComp=null;
  let roadCells=[];
  let components=[];
  let factionComponents=[];
  let portsByFaction=[];
  let portsStamp=-1e9;
  let aiCursor=1;
  let riskCursor=0;
  let rebuildCursor=0;
  let pathBudget0370=0;
  let seaPathUsed0370=false;
  let lastTickMs=0;
  let roadBuildMs=0;
  let trafficDrawn=0;
  let routeEvals=0;
  let seaSearches=0;
  let restoredPortable=null;
  let domesticRoadTraffic0371=[];
  let domesticTrafficSig0371='';
  let domesticTrafficBuiltAt0371=-1e9;
  let domesticSeaSupplyCache03713=null;
  let tradeRevision03713=0;
  let focusedTradeRoute03717=-1;

  // 0.37.20 · economía material física. Inventario solo en nodos logísticos
  // (estructura/puerto/extremo de ruta), nunca por hexágono.
  const RESOURCE_KEYS03720=['food','raw','fuel','goods','military'];
  const RESOURCE_LABELS03720=['Alimentos','Materias primas','Energía/combustible','Bienes industriales','Material militar'];
  const RESOURCE_SHORT03720=['Alimentos','Materias','Combustible','Bienes','Militar'];
  let resourceNodes03720=new Map();
  let resourceNation03720=[];
  let resourceSig03720='';
  let resourceLastCampaign03720=-1e9;
  let resourceTickMs03720=0;
  let restoredResources03720=null;
  let resourceComponentCoverage03721=new Map();
  // Producción geográfica refrescada progresivamente, sin barrer el mundo
  // ni reconstruir el grafo logístico al conquistar una casilla.
  let geoProductionIterator0383=null;
  let geoNodeCounts0383=new Uint16Array(FACTIONS3230.length);
  // 0.38.4: el trabajo geográfico comparte presupuesto con el render.
  // Se procesan pocas ciudades/nodos por ciclo y se continúa en el siguiente.
  const GEO_PRODUCTION_BATCH0383=48;
  const GEO_REFRESH_BUDGET_MS0384=1.4;
  let geoRefreshMs0384=0,geoRefreshedNodes0384=0;

  let navalPathBucket0371=-1;
  let navalPathUsed0371=0;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const pair=(a,b)=>a<b?a+':'+b:b+':'+a;
  function factionTrafficColor0378(f){
    if(f===0)return (FACTIONS3230&&FACTIONS3230[0]&&FACTIONS3230[0].color)||
      (typeof PLAYER_COLOR!=='undefined'?PLAYER_COLOR:'#2f91ff');
    return (FACTIONS3230&&FACTIONS3230[f]&&FACTIONS3230[f].color)||'#8da9c2';
  }
  function playerTrafficColor0372(){return factionTrafficColor0378(0)}
  function routeDotFaction0378(r,d){
    if(r.a===r.b)return r.a;
    return ((r.id+d)&1)?r.a:r.b;
  }

  // Punto único para futuras tecnologías de transporte. Hoy todas devuelven 1.
  // En el futuro un módulo tecnológico podrá exponer speedMultiplier(kind,faction).
  function tradeSpeedMultiplier03710(kind,faction){
    const api=window.HexategosTransportTechnology;
    const v=Number(api?.speedMultiplier?.(kind,faction));
    return Number.isFinite(v)&&v>0?clamp(v,.35,3):1;
  }

  function domesticTravelPhase03710(d,k,now){
    const distance=Math.max(2,d?.path?.length||2);
    const speed=DOMESTIC_TRAFFIC_CELLS_PER_SECOND*tradeSpeedMultiplier03710('land',d.faction);
    const offset=(((d.seed||0)*17+k*43)%997)/997*distance;
    let phase=((now*.001*speed+offset)%distance)/distance;
    if(((d.seed||0)+k)&1)phase=1-phase;
    return phase;
  }

  function routeTravelPhase03710(r,d,now,visualLength,faction){
    const distance=Math.max(2,Number(r.distance)||visualLength||2);
    const base=r.type==='sea'?SEA_TRADE_CELLS_PER_SECOND:LAND_TRADE_CELLS_PER_SECOND;
    const speed=base*tradeSpeedMultiplier03710(r.type,faction);
    const offset=((r.id*37+d*53)%997)/997*distance;
    return ((now*.001*speed+offset)%distance)/distance;
  }
  const baseNavalHostile0371=navalHostile3270;
  navalHostile3270=function(a,b){
    if(a===b||a<0||b<0)return false;
    if(typeof diplomaticRelation3300==='function')return diplomaticRelation3300(a,b)===-1;
    return baseNavalHostile0371(a,b);
  };
  const permitKey=(kind,a,b,via)=>kind+':'+pair(a,b)+':'+via;

  function tradeRelation0370(a,b){
    const r=diplomaticRelation3300(a,b);
    // 0.38.0: los tratados comerciales internacionales requieren embajada
    // y consentimiento formal. Las rutas interiores siguen siempre permitidas.
    const statecraft=window.HexategosStatecraft0380;
    if(a!==b&&statecraft?.canTrade&&!statecraft.canTrade(a,b))return false;
    return r===1||r===2||r===3;
  }

  function diplomaticTargets0370(f){
    const net=window.HexategosDiplomacyNetwork3301;
    if(net&&net.targetsRef)return net.targetsRef(f);
    if(net&&net.targets)return net.targets(f);
    const out=[];
    for(let o=0;o<activeFactionCount3230;o++){
      if(o!==f&&diplomaticRelation3300(f,o)!==0)out.push(o);
    }
    return out;
  }

  function markTradeDirty0370(){dirty=true;tradeRevision03713++;domesticSeaSupplyCache03713=null}
  function routeLimit0370(f){return f===0?16:MAX_ROUTES_PER_FACTION}

  function routeCount0370(f,type){
    let n=0;
    for(const r of routes){
      if(r.status==='closed')continue;
      if(r.a!==f&&r.b!==f)continue;
      if(type&&r.type!==type)continue;
      n++;
    }
    return n;
  }

  function routeExists0370(type,a,b,from=-1,to=-1){
    return routes.some(r=>{
      if(r.status==='closed'||r.type!==type)return false;
      if(!((r.a===a&&r.b===b)||(r.a===b&&r.b===a)))return false;
      if(from<0||to<0)return true;
      return (r.from===from&&r.to===to)||(r.from===to&&r.to===from);
    });
  }

  function samplePath0370(path,maxPoints){
    if(!path||!path.length)return [];
    if(path.length<=maxPoints)return Array.from(path);
    const out=[];
    const step=(path.length-1)/(maxPoints-1);
    for(let i=0;i<maxPoints;i++)out.push(path[Math.min(path.length-1,Math.round(i*step))]);
    return out;
  }

  function rebuildPorts0370(force=false){
    const now=campaignSeconds3230||0;
    if(!force&&portsByFaction.length===FACTIONS3230.length&&now-portsStamp<12)return;
    portsByFaction=Array.from({length:FACTIONS3230.length},()=>[]);
    for(const p of ports3212){
      const f=owner6[p];
      if(f>=0&&f<portsByFaction.length)portsByFaction[f].push(p);
    }
    portsStamp=now;
  }

  function bestPortPair0370(a,b){
    rebuildPorts0370();
    const A=portsByFaction[a]||[],B=portsByFaction[b]||[];
    if(!A.length||!B.length)return null;
    let best=null,bestScore=1e9;
    for(let i=0;i<Math.min(10,A.length);i++){
      for(let j=0;j<Math.min(10,B.length);j++){
        const x=A[i],y=B[j];
        const score=angularHeuristic3254(x,y)+
          (navalPortBlockadeLevel3270(x)+navalPortBlockadeLevel3270(y))*22-
          (cityLevel3230[x]||0)*.55-(cityLevel3230[y]||0)*.55;
        if(score<bestScore){bestScore=score;best={from:x,to:y,score}}
      }
    }
    return best;
  }

  function residualTrade0370(f){
    let trade=0,allies=0;
    const statecraft=window.HexategosStatecraft0380;
    for(const o of diplomaticTargets0370(f)){
      const rel=diplomaticRelation3300(f,o);
      const allowed=statecraft?.canTrade?statecraft.canTrade(f,o):(rel===1||rel===3);
      if(!allowed)continue;
      trade++;
      if(statecraft?.hasAlliance?statecraft.hasAlliance(f,o):rel===3)allies++;
    }
    return Math.min(.16,trade*.011+allies*.004);
  }

  function routeBaseValue0370(type,a,b,distance,from=-1,to=-1){
    const snap=ensureEconomySnapshot3261(false);
    const same=a===b;
    const ind=(snap.industryWeighted[a]||0)+(same?0:(snap.industryWeighted[b]||0));
    const city=(snap.cityWeighted[a]||0)+(same?0:(snap.cityWeighted[b]||0));
    const port=(snap.portCount[a]||0)+(same?0:(snap.portCount[b]||0));
    let v=(type==='sea'?.36:.29)+Math.min(1.0,ind*.019)+Math.min(.58,city*.010);
    if(type==='sea')v+=Math.min(.34,port*.028);
    const dist=Math.max(2,distance||2);
    if(type==='sea')v*=clamp(.86+Math.log2(dist)*.043,.86,1.16);
    else v*=clamp(1.08-Math.log2(dist)*.024,.82,1.06);
    if(from>=0)v+=(cityLevel3230[from]||0)*.045+(industryLevel3230[from]||0)*.034;
    if(to>=0)v+=(cityLevel3230[to]||0)*.045+(industryLevel3230[to]||0)*.034;
    if(same)v*=.55;
    return clamp(v,.12,2.20);
  }

  function hasTransitPermit0370(kind,a,b,via){
    if(via<0||via===a||via===b)return true;
    const p=permits.get(permitKey(kind,a,b,via));
    if(p&&p.granted)return true;
    return tradeRelation0370(via,a)&&tradeRelation0370(via,b);
  }

  function requestTransit0370(kind,a,b,via,notify=false){
    if(hasTransitPermit0370(kind,a,b,via))return true;
    const ra=diplomaticRelation3300(via,a),rb=diplomaticRelation3300(via,b);
    if(ra===-1||rb===-1){
      if(notify&&a===0)toast('Tránsito rechazado por '+factionName3230(via));
      return false;
    }
    const opa=typeof dipOpinionOf3300==='function'?dipOpinionOf3300(via,a):0;
    const opb=typeof dipOpinionOf3300==='function'?dipOpinionOf3300(via,b):0;
    const ta=typeof dipTrustOf3300==='function'?dipTrustOf3300(via,a):45;
    const tb=typeof dipTrustOf3300==='function'?dipTrustOf3300(via,b):45;
    let score=31+opa*.22+opb*.14+(ta+tb)*.18;
    if(ra===1||ra===3)score+=13;
    if(rb===1||rb===3)score+=13;
    if(ra===2)score+=5;
    if(rb===2)score+=5;
    const granted=score>=54;
    permits.set(permitKey(kind,a,b,via),{granted,at:campaignSeconds3230,score:Math.round(score)});
    if(notify&&a===0)toast(granted?'Tránsito autorizado por '+factionName3230(via):factionName3230(via)+' rechaza el tránsito');
    markTradeDirty0370();
    return granted;
  }

  function missingPermits0370(r){
    const out=[];
    for(const via of r.via||[]){
      if(!hasTransitPermit0370(r.type,r.a,r.b,via))out.push(via);
    }
    return out;
  }

  function roadJoin0370(a,b){
    const oa=owner6[a],ob=owner6[b];
    // Dentro de un país basta una carretera física normal.
    if(oa===ob)return roadCross3230(a,b);
    // Entre países, el simple contacto de dos carreteras NO crea una unión.
    // Hace falta un enlace fronterizo / aduana explícito de 0.37.6.
    if(oa>=0&&ob>=0&&oa!==ob){
      return !!window.HexategosBorderRoad0376?.hasLink?.(a,b);
    }
    return false;
  }

  function rebuildRoadGraph0370(force=false){
    const now=campaignSeconds3230||0;
    if(!force&&roadMask&&now-lastRoadCampaign<ROAD_REFRESH_SECONDS)return;
    const t0=performance.now();
    const L=loadLevel(MAX_GAME_LEVEL3233),N=L.n;
    if(!roadMask||roadMask.length!==N){
      roadMask=new Uint8Array(N);
      roadComp=new Int32Array(N);
    }
    roadMask.fill(0);roadComp.fill(-1);roadCells=[];
    for(const path of roads3212){
      if(!Array.isArray(path))continue;
      for(const c of path){
        if(c>=0&&c<N&&!roadMask[c]){roadMask[c]=1;roadCells.push(c)}
      }
    }
    components=[];
    factionComponents=Array.from({length:FACTIONS3230.length},()=>[]);
    const q=[];
    for(const start of roadCells){
      if(roadComp[start]>=0)continue;
      const id=components.length;
      const factions=new Set(),reps=new Map(),cells=[];
      roadComp[start]=id;q.length=0;q.push(start);
      for(let h=0;h<q.length;h++){
        const u=q[h];cells.push(u);
        const o=owner6[u];
        if(o>=0){
          factions.add(o);
          const score=(u===capitals[o]?12:0)+(cityLevel3230[u]||0)*5+
            (industryLevel3230[u]||0)*3+(ports3212.has(u)?2:0);
          const old=reps.get(o);
          if(!old||score>old.score)reps.set(o,{cell:u,score});
        }
        for(let k=L.offsets[u];k<L.offsets[u+1];k++){
          const v=L.edgeNbr[k];
          if(v<0||!roadMask[v]||roadComp[v]>=0||!roadJoin0370(u,v))continue;
          roadComp[v]=id;q.push(v);
        }
      }
      components.push({id,cells,factions:[...factions],reps});
      for(const f of factions)factionComponents[f].push(id);
    }
    lastRoadCampaign=now;roadEpoch++;domesticSeaSupplyCache03713=null;
    roadBuildMs=performance.now()-t0;
    for(const r of routes)if(r.type==='land'&&r.status!=='closed')r.needsRebuild=true;
  }

  function sharedRoadComponent0370(a,b){
    rebuildRoadGraph0370();
    const bset=new Set(factionComponents[b]||[]);
    let best=-1,bestSize=0;
    for(const id of factionComponents[a]||[]){
      const size=components[id]?components[id].cells.length:0;
      if(bset.has(id)&&size>bestSize){best=id;bestSize=size}
    }
    return best;
  }

  function buildLandPath0370(a,b,compId){
    if(pathBudget0370<=0)return null;
    const c=components[compId];
    if(!c)return null;
    const start=c.reps.get(a)&&c.reps.get(a).cell;
    const goal=c.reps.get(b)&&c.reps.get(b).cell;
    if(start==null||goal==null)return null;
    pathBudget0370--;
    const L=loadLevel(MAX_GAME_LEVEL3233);
    const prev=new Map([[start,-1]]),q=[start];
    for(let h=0;h<q.length&&q.length<24000;h++){
      const u=q[h];
      if(u===goal)break;
      for(let k=L.offsets[u];k<L.offsets[u+1];k++){
        const v=L.edgeNbr[k];
        if(v<0||roadComp[v]!==compId||prev.has(v)||!roadJoin0370(u,v))continue;
        prev.set(v,u);q.push(v);
      }
    }
    if(!prev.has(goal))return null;
    const out=[];let u=goal,guard=0;
    while(u>=0&&guard++<30000){out.push(u);u=prev.get(u)}
    return out.reverse();
  }

  function routeOwners0370(path,a,b){
    const out=[],seen=new Set();
    for(const c of path||[]){
      const o=owner6[c];
      if(o>=0&&o!==a&&o!==b&&!seen.has(o)){seen.add(o);out.push(o)}
    }
    return out;
  }

  function createLandRoute0370(a,b){
    if(routes.length>=MAX_ROUTES||routeCount0370(a)>=routeLimit0370(a)||
       routeCount0370(b)>=routeLimit0370(b)||routeExists0370('land',a,b))return null;
    const comp=sharedRoadComponent0370(a,b);
    if(comp<0)return null;
    const full=buildLandPath0370(a,b,comp);
    if(!full||full.length<2)return null;
    const via=routeOwners0370(full,a,b),missing=via.filter(v=>!hasTransitPermit0370('land',a,b,v));
    const r={
      id:nextRouteId++,type:'land',a,b,from:full[0],to:full[full.length-1],
      path:samplePath0370(full,320),distance:full.length,via,component:comp,roadEpoch,
      baseValue:routeBaseValue0370('land',a,b,full.length,full[0],full[full.length-1]),
      mode:missing.length?'blocked':'legal',status:missing.length?'blocked':'active',
      created:campaignSeconds3230,lastIncident:-1e9,nextIncident:campaignSeconds3230+18+(a+b)%17
    };
    routes.push(r);markTradeDirty0370();return r;
  }

  function coastalTransitOwners0370(path,a,b){
    if(!path||!path.length)return [];
    const L=loadLevel(MAX_GAME_LEVEL3233),hits=new Map();
    const stride=Math.max(1,Math.floor(path.length/180));
    for(let i=0;i<path.length;i+=stride){
      const u=path[i];
      for(let k=L.offsets[u];k<L.offsets[u+1];k++){
        const n=L.edgeNbr[k];
        if(n<0||L.land[n]<0)continue;
        const o=owner6[n];
        if(o>=0&&o!==a&&o!==b)hits.set(o,(hits.get(o)||0)+1);
      }
    }
    return [...hits.entries()].filter(x=>x[1]>=2).sort((x,y)=>y[1]-x[1]).slice(0,8).map(x=>x[0]);
  }

  function createSeaRoute0370(a,b,from,to,risky=false,notify=false){
    if(seaPathUsed0370||pathBudget0370<=0)return {deferred:true};
    if(routes.length>=MAX_ROUTES||routeCount0370(a)>=routeLimit0370(a)||
       (b!==a&&routeCount0370(b)>=routeLimit0370(b))||routeExists0370('sea',a,b,from,to))return null;
    if((a!==b&&!tradeRelation0370(a,b))||!ports3212.has(from)||!ports3212.has(to)||
       owner6[from]!==a||owner6[to]!==b||from===to)return null;
    const s=bestPortSea3270(from),g=bestPortSea3270(to,s);
    if(s<0||g<0)return null;
    seaPathUsed0370=true;pathBudget0370--;seaSearches++;
    const full=findSeaPathCells3270(s,g);
    if(!full||!full.length){
      if(notify&&a===0)toast('No existe una ruta marítima continua entre esos puertos');
      return null;
    }
    const via=a===b?[]:coastalTransitOwners0370(full,a,b),denied=[];
    for(const v of via){
      if(!requestTransit0370('sea',a,b,v,notify&&a===0))denied.push(v);
    }
    if(denied.length&&!risky)return {needsRisk:true,denied};
    const sampled=samplePath0370(full,298);
    const visualPath=[from,...sampled,to];
    const risk=navalRouteRisk3270(a,sampled).risk;
    const r={
      id:nextRouteId++,type:'sea',a,b,from,to,path:visualPath,distance:full.length,via,
      baseValue:routeBaseValue0370('sea',a,b,full.length,from,to),navalRisk:risk,
      mode:denied.length?'risky':'legal',status:'active',created:campaignSeconds3230,
      lastIncident:-1e9,nextIncident:campaignSeconds3230+17+(a+b)%19
    };
    routes.push(r);markTradeDirty0370();
    if(notify&&a===0)toast((a===b?'Ruta marítima interior abierta':'Ruta marítima abierta')+(denied.length?' · tránsito sin permiso':''));
    return r;
  }

  function routeFactor0370(r){
    if(r.status==='closed')return 0;
    const now=campaignSeconds3230||0;
    if((r.inspectionUntil||0)>now){r.status='inspected';return .18}
    if(r.a!==r.b&&!tradeRelation0370(r.a,r.b)){r.status='suspended';return 0}
    if(r.type==='sea'){
      if(!ports3212.has(r.from)||!ports3212.has(r.to)||owner6[r.from]!==r.a||owner6[r.to]!==r.b){
        r.status='broken';return 0;
      }
    }
    if(r.type==='land'&&r.needsRebuild){r.status='rebuilding';return .20}
    const missing=missingPermits0370(r);
    if(r.type==='land'){
      if(r.mode==='smuggle'){r.status='smuggling';return .34}
      if(missing.length){r.status='blocked';return 0}
      r.status='active';return 1;
    }
    let f=(r.mode==='risky'&&missing.length)?0.62:1;
    const blockade=Math.max(navalPortBlockadeLevel3270(r.from)||0,navalPortBlockadeLevel3270(r.to)||0);
    f*=Math.max(.08,1-blockade*.72);
    f*=clamp(1-(r.navalRisk||0)*.022,.42,1);
    r.status=f<.22?'blocked':(r.mode==='risky'&&missing.length?'risky':'active');
    return f;
  }

  function resourceKind03720(cell,f){
    const kinds=[];
    if(capitals[f]===cell)kinds.push('capital');
    if(cities3212.has(cell))kinds.push('city');
    if(industries3212.has(cell))kinds.push('industry');
    if(ports3212.has(cell))kinds.push('port');
    return kinds.length?kinds.join('+'):'hub';
  }

  function resourceStructureSignature03720(){
    let h=(cities3212.size*31+industries3212.size*37+ports3212.size*41+routes.length*43+activeFactionCount3230*47)>>>0;
    const mix=cell=>{const f=owner6[cell];h=Math.imul(h^((cell+1)*17+(f+2)*29),16777619)>>>0};
    for(const x of cities3212)mix(x);
    for(const x of industries3212)mix(x);
    for(const x of ports3212)mix(x);
    for(let f=0;f<activeFactionCount3230;f++)if(Number.isInteger(capitals[f])&&capitals[f]>=0)mix(capitals[f]);
    for(const r of routes)if(r.status!=='closed'){mix(r.from);mix(r.to)}
    return h+':'+roadEpoch;
  }

  function resourceRoadComp03720(cell,f){
    if(roadComp&&cell>=0&&cell<roadComp.length&&roadComp[cell]>=0)return roadComp[cell];
    const L=loadLevel(MAX_GAME_LEVEL3233);
    if(cell<0||cell>=L.n)return -1;
    for(let k=L.offsets[cell];k<L.offsets[cell+1];k++){
      const n=L.edgeNbr[k];
      if(n>=0&&owner6[n]===f&&roadComp&&roadComp[n]>=0)return roadComp[n];
    }
    return -1;
  }

  function terrainResourceProfile0382(cell){
    let type='plain';
    try{if(typeof terrainKey3250==='function')type=terrainKey3250(cell)||'plain'}catch(_){}
    const base={
      plain:[1.38,.82,.72],
      mediterranean:[1.24,.92,.76],
      forest:[1.08,1.22,.66],
      jungle:[1.16,1.13,.54],
      desert:[.34,.94,1.44],
      steppe:[1.02,1.02,1.06],
      mountain:[.46,1.54,.78],
      highmountain:[.20,1.72,.56],
      ice:[.10,.78,.62]
    }[type]||[1,.95,.82];

    // Yacimientos abstractos compartidos por áreas vecinas (~6°), no ruido
    // independiente por hexágono: los distritos ricos forman zonas continuas.
    let lat=0,lon=0;
    try{
      const p=cellLonLat3302(cell);
      lat=Number(p?.lat)||0;lon=Number(p?.lon)||0;
    }catch(_){}
    const zoneLat=Math.floor((lat+90)/6);
    const zoneLon=Math.floor((lon+180)/6);
    let h=Math.imul((zoneLat+11)*73856093^(zoneLon+47)*19349663,2654435761)>>>0;
    h^=h>>>13;h=Math.imul(h,1274126177)>>>0;h^=h>>>16;
    const rawNoise=.78+((h&1023)/1023)*.52;
    const fuelNoise=.56+(((h>>>10)&1023)/1023)*1.02;
    const absLat=Math.abs(lat);
    const climateFood=absLat>72?.48:absLat>62?.72:absLat<23?1.04:1;
    return {
      type,
      food:clamp(base[0]*climateFood,.08,1.7),
      raw:clamp(base[1]*rawNoise,.35,2.0),
      fuel:clamp(base[2]*fuelNoise,.28,2.25)
    };
  }

  function urbanWeight0382(cell,f,cityLevel=0,ind=0,port=0,capital=0){
    if(!cityLevel&&!capital)return 0;
    let w=cityLevel?1.25+Math.max(1,cityLevel)*1.20:1.0;
    if(capital)w+=2.35;
    if(port)w+=.65;
    if(ind)w+=Math.min(1.2,ind*.32);
    return clamp(w,1,10);
  }

  function resourceNodeProfile03720(cell,f,nodeCount,snap){
    const city=cities3212.has(cell)?Math.max(1,cityLevel3230[cell]||1):0;
    const ind=industries3212.has(cell)?Math.max(1,industryLevel3230[cell]||1):0;
    const port=ports3212.has(cell)?1:0;
    const capital=capitals[f]===cell?1:0;
    const hub=!city&&!ind&&!port&&!capital?1:0;
    const urbanWeight=urbanWeight0382(cell,f,city,ind,port,capital);

    const cap=[18,18,16,16,10],prod=[0,0,0,0,0],demand=[0,0,0,0,0];
    if(city){
      const urbanScale=.55+urbanWeight*.23;
      cap[0]+=20*urbanScale;cap[2]+=9*urbanScale;cap[3]+=17*urbanScale;cap[4]+=4*urbanScale;
      prod[0]+=.018*urbanScale;
      demand[0]+=.064*urbanScale;demand[2]+=.018*urbanScale;demand[3]+=.041*urbanScale;
    }
    if(ind){
      cap[1]+=28*ind;cap[2]+=24*ind;cap[3]+=28*ind;cap[4]+=24*ind;
      demand[0]+=.012*ind;demand[1]+=.105*ind;demand[2]+=.078*ind;
      // goods / military output is added later using the actual input-stock factor.
      demand[3]+=.008*ind;
    }
    if(port){
      cap[0]+=16;cap[1]+=20;cap[2]+=24;cap[3]+=18;cap[4]+=8;
      demand[2]+=.026;demand[3]+=.012;
    }
    if(capital){
      cap[0]+=36;cap[1]+=20;cap[2]+=24;cap[3]+=38;cap[4]+=28;
      demand[0]+=.125;demand[2]+=.035;demand[3]+=.082;demand[4]+=.014;
    }
    if(hub){
      for(let i=0;i<5;i++)cap[i]+=8;
    }

    // El territorio genera la producción primaria. Se deposita de forma
    // repartida en sus nodos logísticos, evitando un scan/stock por hexágono.
    const territory=Math.max(1,snap.territory[f]||1),div=Math.max(1,nodeCount);
    const regional=territory/div;
    const geo=terrainResourceProfile0382(cell);
    const nation=window.HexategosResourceStrategy0383?.nationalPotential?.(f);
    // La riqueza de las casillas conquistadas forma el grueso de la producción;
    // el nodo local modula el resto. La muestra nacional es acotada.
    const mix=(v,r)=>clamp(nation?.[r]!=null?(nation[r]*.72+v*.28):v,.18,2.2);
    prod[0]+=regional*.00072*mix(geo.food,0);
    prod[1]+=regional*.00056*mix(geo.raw,1);
    prod[2]+=regional*.00025*mix(geo.fuel,2);

    return {cap,prod,demand,city,ind,port,capital,hub,urbanWeight,geo};
  }

  function ensureResourceNodes03720(force=false){
    rebuildRoadGraph0370(false);
    const sig=resourceStructureSignature03720();
    if(!force&&resourceSig03720===sig&&resourceNodes03720.size)return resourceNodes03720;

    const old=resourceNodes03720,next=new Map(),cellsByFaction=Array.from({length:activeFactionCount3230},()=>new Set());
    const add=(cell,f)=>{
      if(!Number.isInteger(cell)||cell<0||f<0||f>=activeFactionCount3230||owner6[cell]!==f)return;
      cellsByFaction[f].add(cell);
    };
    for(const cell of cities3212)add(cell,owner6[cell]);
    for(const cell of industries3212)add(cell,owner6[cell]);
    for(const cell of ports3212)add(cell,owner6[cell]);
    for(let f=0;f<activeFactionCount3230;f++)add(capitals[f],f);
    for(const r of routes){
      if(r.status==='closed')continue;
      add(r.from,r.a);add(r.to,r.b);
    }

    const snap=ensureEconomySnapshot3261(false);
    const restoredPlayer=new Map(Array.isArray(restoredResources03720?.playerNodes)?restoredResources03720.playerNodes:[]);
    const restoredCoverage=Array.isArray(restoredResources03720?.nationCoverage)?restoredResources03720.nationCoverage:[];

    geoNodeCounts0383.fill(0);
    for(let f=0;f<activeFactionCount3230;f++){
      const count=Math.max(1,cellsByFaction[f].size);
      geoNodeCounts0383[f]=Math.min(65535,count);
      for(const cell of cellsByFaction[f]){
        const profile=resourceNodeProfile03720(cell,f,count,snap),prev=old.get(cell);
        let stock;
        if(prev&&prev.f===f&&Array.isArray(prev.stock)){
          stock=profile.cap.map((mx,i)=>clamp(Number(prev.stock[i])||0,0,mx));
        }else if(f===0&&restoredPlayer.has(cell)){
          const saved=restoredPlayer.get(cell);
          stock=profile.cap.map((mx,i)=>clamp(Number(saved?.[i])||0,0,mx));
        }else{
          const cov=Array.isArray(restoredCoverage[f])?restoredCoverage[f]:null;
          stock=profile.cap.map((mx,i)=>mx*clamp(Number(cov?.[i])||.56,.12,.92));
        }
        next.set(cell,{
          cell,f,kind:resourceKind03720(cell,f),stock,
          cap:profile.cap,prod:profile.prod,demand:profile.demand,
          city:profile.city,ind:profile.ind,port:profile.port,capital:profile.capital,
          urbanWeight:profile.urbanWeight,geo:profile.geo,
          comp:resourceRoadComp03720(cell,f)
        });
      }
    }
    resourceNodes03720=next;resourceSig03720=sig;restoredResources03720=null;
    geoProductionIterator0383=null;
    return next;
  }

  function redistributeRoadResources03720(blend=.28){
    const groups=new Map();
    for(const n of resourceNodes03720.values()){
      if(n.comp<0)continue;
      const key=n.f+':'+n.comp;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(n);
    }
    for(const list of groups.values()){
      if(list.length<2)continue;
      for(let r=0;r<5;r++){
        let total=0,totalCap=0;
        for(const n of list){total+=n.stock[r];totalCap+=n.cap[r]}
        if(totalCap<=0)continue;
        const ratio=total/totalCap;
        for(const n of list)n.stock[r]=clamp(n.stock[r]*(1-blend)+n.cap[r]*ratio*blend,0,n.cap[r]);
      }
    }
  }

  function transferRouteResources03720(r,dt){
    r.cargo03720=[0,0,0,0,0];r.cargoTotal03720=0;r.materialFactor03720=.48;
    const k=routeFactor0370(r);
    if(k<=0)return;
    const a=resourceNodes03720.get(r.from),b=resourceNodes03720.get(r.to);
    if(!a||!b)return;

    const perSec=(r.type==='sea'?.62:.44)*(.72+Math.min(2.2,r.baseValue||.2)*.42)*k;
    const importance=[1.18,1.00,1.08,1.12,.72],needs=[],sumBase={v:0};
    for(let i=0;i<5;i++){
      const ra=a.cap[i]>0?a.stock[i]/a.cap[i]:0,rb=b.cap[i]>0?b.stock[i]/b.cap[i]:0;
      const diff=ra-rb;
      const score=Math.max(0,Math.abs(diff)-.025)*importance[i];
      needs[i]={diff,score};sumBase.v+=score;
    }
    if(sumBase.v<=.0001){r.materialFactor03720=.62;return}

    let total=0;
    for(let i=0;i<5;i++){
      const x=needs[i];if(x.score<=0)continue;
      const src=x.diff>0?a:b,dst=x.diff>0?b:a;
      const statecraft=window.HexategosStatecraft0380;
      if(src.f!==dst.f&&statecraft?.resourceTradeAllowed&&!statecraft.resourceTradeAllowed(src.f,dst.f,i))continue;
      const budget=perSec*dt*(x.score/sumBase.v);
      const reserve=src.cap[i]*.16,space=Math.max(0,dst.cap[i]*.88-dst.stock[i]);
      const amount=Math.max(0,Math.min(budget,src.stock[i]-reserve,space));
      if(amount<=0)continue;
      src.stock[i]-=amount;dst.stock[i]+=amount;
      r.cargo03720[i]=amount/Math.max(.1,dt);
      total+=amount/Math.max(.1,dt);
    }
    r.cargoTotal03720=total;
    r.materialFactor03720=clamp(.45+total/Math.max(.08,perSec)*.70,.45,1.16);
  }

  function summarizeResources03720(){
    resourceNation03720=Array.from({length:activeFactionCount3230},()=>({
      stock:[0,0,0,0,0],cap:[0,0,0,0,0],prod:[0,0,0,0,0],demand:[0,0,0,0,0],
      coverage:[.55,.55,.55,.55,.55],economyFactor:1,recruitFactor:1,nodes:0
    }));
    for(const n of resourceNodes03720.values()){
      const s=resourceNation03720[n.f];if(!s)continue;
      s.nodes++;
      const effectiveProd=effectiveNodeProduction03722(n);
      for(let i=0;i<5;i++){s.stock[i]+=n.stock[i];s.cap[i]+=n.cap[i];s.prod[i]+=effectiveProd[i]||0;s.demand[i]+=n.demand[i]}
    }

    resourceComponentCoverage03721=new Map();
    const compTotals=new Map();
    for(const n of resourceNodes03720.values()){
      if(n.comp<0)continue;
      const key=n.f+':'+n.comp;
      let g=compTotals.get(key);
      if(!g){g={stock:[0,0,0,0,0],cap:[0,0,0,0,0]};compTotals.set(key,g)}
      for(let i=0;i<5;i++){g.stock[i]+=n.stock[i];g.cap[i]+=n.cap[i]}
    }
    for(const [key,g] of compTotals){
      resourceComponentCoverage03721.set(key,g.cap.map((mx,i)=>mx>0?clamp(g.stock[i]/mx,0,1):.55));
    }
    const norm=x=>clamp(x/.55,.42,1.12);
    for(const s of resourceNation03720){
      for(let i=0;i<5;i++)s.coverage[i]=s.cap[i]>0?clamp(s.stock[i]/s.cap[i],0,1):.55;
      const food=norm(s.coverage[0]),raw=norm(s.coverage[1]),fuel=norm(s.coverage[2]),
            goods=norm(s.coverage[3]),mil=norm(s.coverage[4]);
      s.economyFactor=clamp(.36+food*.23+raw*.10+fuel*.18+goods*.13,.55,1.10);
      s.recruitFactor=clamp(.30+food*.24+fuel*.16+goods*.08+mil*.22,.45,1.08);
    }
  }

  function refreshGeoProduction0383(snap){
    const strategy=window.HexategosResourceStrategy0383;
    if(!strategy?.nationalPotential||!resourceNodes03720.size||!snap?.territory)return;
    if(!geoProductionIterator0383)geoProductionIterator0383=resourceNodes03720.values();
    const t0=performance.now(),limit=activeFactionCount3230>=350?24:
      activeFactionCount3230>=250?32:GEO_PRODUCTION_BATCH0383;
    let completed=0;
    // Perfil rápido: no recrea cinco vectores, no vuelve a preguntar terreno,
    // no inspecciona puertos/ciudades y no fuerza snapshots completos.
    for(let i=0;i<limit;i++){
      if(i>=8&&(i&7)===0&&performance.now()-t0>=GEO_REFRESH_BUDGET_MS0384)break;
      let item=geoProductionIterator0383.next();
      if(item.done){
        geoProductionIterator0383=resourceNodes03720.values();
        item=geoProductionIterator0383.next();
        if(item.done)break;
      }
      const n=item.value;
      if(n.f<0||owner6[n.cell]!==n.f)continue;
      const count=Math.max(1,geoNodeCounts0383[n.f]||1);
      const regional=Math.max(1,snap.territory[n.f]||1)/count;
      const geo=n.geo||terrainResourceProfile0382(n.cell);
      const country=strategy.nationalPotential(n.f);
      const blend=(v,r)=>clamp(country?.[r]!=null?country[r]*.72+v*.28:v,.18,2.2);
      const urban=n.city?.018*(.55+(n.urbanWeight||0)*.23):0;
      n.prod[0]=urban+regional*.00072*blend(geo.food,0);
      n.prod[1]=regional*.00056*blend(geo.raw,1);
      n.prod[2]=regional*.00025*blend(geo.fuel,2);
      completed++;
    }
    geoRefreshMs0384=performance.now()-t0;
    geoRefreshedNodes0384=completed;
  }

  function resourceTick03720(force=false){
    const t0=performance.now(),now=Number(campaignSeconds3230)||0;
    let dt=resourceLastCampaign03720<-1e8?1:now-resourceLastCampaign03720;
    if(!force&&dt<=.05)return;
    dt=clamp(dt,.1,8);resourceLastCampaign03720=now;
    ensureResourceNodes03720(force);
    // Incremental: hasta 160 nodos por tick comercial; no hay scan global.
    refreshGeoProduction0383(economySnapshot3261||ensureEconomySnapshot3261(false));

    // Producción / consumo local.
    for(const n of resourceNodes03720.values()){
      const rawRatio=n.cap[1]?n.stock[1]/n.cap[1]:1,fuelRatio=n.cap[2]?n.stock[2]/n.cap[2]:1;
      const industryInput=n.ind?clamp(Math.min(rawRatio/.34,fuelRatio/.30),.12,1.08):0;
      for(let i=0;i<5;i++){
        let production=n.prod[i];
        if(i===3&&n.ind)production+=.105*n.ind*industryInput;
        if(i===4&&n.ind)production+=.046*n.ind*industryInput;
        const statecraft=window.HexategosStatecraft0380;
        if(statecraft?.resourceProductionMultiplier)production*=statecraft.resourceProductionMultiplier(n.cell,i,n.f);
        n.stock[i]=clamp(n.stock[i]+production*dt,0,n.cap[i]);
      }
      for(let i=0;i<5;i++)n.stock[i]=Math.max(0,n.stock[i]-n.demand[i]*dt);
    }

    // Camiones/logística interna: redistribución limitada dentro de la red viaria.
    redistributeRoadResources03720(.30);

    // Comercio físico: cada ruta mueve excedente real hacia el nodo deficitario.
    for(const r of routes){
      if(r.status==='closed')continue;
      transferRouteResources03720(r,dt);
    }

    // Lo descargado en un puerto/aduana se reparte por la red local.
    redistributeRoadResources03720(.22);
    summarizeResources03720();
    resourceTickMs03720=performance.now()-t0;
    markTradeDirty0370();
  }

  function resourceSummary03720(f){
    f=Number(f);
    if(!Number.isInteger(f)||f<0||f>=activeFactionCount3230)return null;
    // Consultar la pantalla de Economía no debe avanzar producción/consumo.
    if(!resourceNodes03720.size){
      ensureResourceNodes03720(true);
      summarizeResources03720();
    }
    return resourceNation03720[f]||null;
  }

  function materialCoverageForCell03721(cell){
    cell=Number(cell);
    if(!Number.isInteger(cell)||cell<0||cell>=owner6.length)return null;
    const f=owner6[cell];
    if(f<0||f>=activeFactionCount3230||!resourceNation03720[f])return null;

    const exact=resourceNodes03720.get(cell);
    if(exact){
      return exact.cap.map((mx,i)=>mx>0?clamp(exact.stock[i]/mx,0,1):.55);
    }
    const comp=roadComp&&cell<roadComp.length?roadComp[cell]:-1;
    if(comp>=0){
      const group=resourceComponentCoverage03721.get(f+':'+comp);
      if(group)return group.slice();
    }
    return resourceNation03720[f].coverage.slice();
  }

  function materialSupplyScore03721(coverage){
    if(!Array.isArray(coverage)||coverage.length<5)return 100;
    const w=[.30,.10,.27,.21,.12];
    let weighted=0;
    for(let i=0;i<5;i++)weighted+=clamp(Number(coverage[i])||0,0,1)*w[i];
    const bottleneck=Math.min(
      clamp(Number(coverage[0])||0,0,1),
      clamp(Number(coverage[2])||0,0,1),
      clamp(Number(coverage[3])||0,0,1)
    );
    return Math.round(clamp((weighted*.72+bottleneck*.28)*100,0,100));
  }

  function materialSupplyDetail03721(cell){
    const coverage=materialCoverageForCell03721(cell);
    if(!coverage)return null;
    const resourcePct=coverage.map(x=>Math.round(clamp(x,0,1)*100));
    return {resourcePct,material:materialSupplyScore03721(coverage)};
  }

  function effectiveNodeProduction03722(n){
    const out=Array.isArray(n?.prod)?n.prod.slice():[0,0,0,0,0];
    if(n?.ind){
      const rawRatio=n.cap?.[1]?n.stock[1]/n.cap[1]:1;
      const fuelRatio=n.cap?.[2]?n.stock[2]/n.cap[2]:1;
      const input=clamp(Math.min(rawRatio/.34,fuelRatio/.30),.12,1.08);
      out[3]=(out[3]||0)+.105*n.ind*input;
      out[4]=(out[4]||0)+.046*n.ind*input;
    }
    return out;
  }

  function supplyDiagnosis03722(cell){
    cell=Number(cell);
    if(!Number.isInteger(cell)||cell<0||cell>=owner6.length)return null;
    const f=owner6[cell];
    if(f<0||f>=activeFactionCount3230)return null;
    ensureResourceNodes03720(false);
    if(!resourceNation03720[f])summarizeResources03720();

    const detail=materialSupplyDetail03721(cell);
    if(!detail)return null;
    const logistic=Math.round(clamp(Number(baseSupplyPct03721(cell))||0,0,100));
    const combined=Math.round(clamp(Number(supplyPct3220(cell))||0,0,100));
    const comp=roadComp&&cell<roadComp.length?roadComp[cell]:-1;
    const exact=resourceNodes03720.get(cell)||null;
    const nodes=[];
    if(exact)nodes.push(exact);
    else if(comp>=0){
      for(const n of resourceNodes03720.values())if(n.f===f&&n.comp===comp)nodes.push(n);
    }else{
      for(const n of resourceNodes03720.values())if(n.f===f)nodes.push(n);
    }

    const stock=[0,0,0,0,0],cap=[0,0,0,0,0],prod=[0,0,0,0,0],demand=[0,0,0,0,0];
    for(const n of nodes){
      const p=effectiveNodeProduction03722(n);
      for(let i=0;i<5;i++){
        stock[i]+=Number(n.stock?.[i])||0;
        cap[i]+=Number(n.cap?.[i])||0;
        prod[i]+=Number(p[i])||0;
        demand[i]+=Number(n.demand?.[i])||0;
      }
    }
    const sum=a=>a.reduce((x,y)=>x+(Number(y)||0),0);
    const production=sum(prod),consumption=sum(demand),balance=production-consumption;

    let tradeFlow=0,blockedRoutes=0,activeRoutes=0;
    for(const r of routes){
      if(r.status==='closed')continue;
      const touches=(r.a===f&&(r.from===cell||r.to===cell||(comp>=0&&(resourceNodes03720.get(r.from)?.comp===comp||resourceNodes03720.get(r.to)?.comp===comp))))||
                    (r.b===f&&(r.from===cell||r.to===cell||(comp>=0&&(resourceNodes03720.get(r.from)?.comp===comp||resourceNodes03720.get(r.to)?.comp===comp))));
      if(!touches)continue;
      if((r.lastFactor||0)>0){activeRoutes++;tradeFlow+=Number(r.cargoTotal03720)||0}
      else blockedRoutes++;
    }

    const criticalIndexes=[0,2,3];
    let critical=criticalIndexes[0];
    for(const i of criticalIndexes)if(detail.resourcePct[i]<detail.resourcePct[critical])critical=i;

    let cause='Suministro estable';
    const recommendations=[];
    if(logistic<35){
      cause=comp<0?'Zona aislada de la red logística':'Capacidad logística muy insuficiente';
      recommendations.push(comp<0?'Conecta la zona por carretera o mediante un puerto':'Refuerza la red de carreteras y sus conexiones');
    }else if(detail.resourcePct[critical]<40){
      cause='Escasez de '+RESOURCE_LABELS03720[critical].toLowerCase();
      if(critical===0)recommendations.push('Aumenta producción de alimentos o impórtalos mediante una ruta comercial');
      else if(critical===2)recommendations.push('Aumenta combustible/energía o abre una ruta de importación');
      else recommendations.push('Construye o mejora industria y garantiza materias primas y combustible');
    }else if(production+tradeFlow<consumption*.9){
      cause='Producción insuficiente para el consumo de la red';
      recommendations.push('Construye o mejora industria en ciudades conectadas');
      recommendations.push('Abre rutas comerciales para importar recursos');
    }else if(blockedRoutes>0){
      cause='Rutas comerciales bloqueadas o suspendidas';
      recommendations.push('Restablece tránsito, desbloquea puertos o crea una ruta alternativa');
    }else if(combined<55){
      cause='Presión combinada de logística y reservas';
      recommendations.push(logistic<detail.material?'Mejora conexiones y capacidad de transporte':'Aumenta producción o importaciones');
    }else if(combined<75){
      cause='Red en tensión';
      recommendations.push(balance<0?'Aumenta producción o reduce consumo':'Refuerza la distribución hacia esta zona');
    }else{
      recommendations.push('No requiere intervención inmediata');
    }

    if(exact?.ind&&detail.resourcePct[1]<45)recommendations.push('La industria necesita más materias primas');
    if(exact?.ind&&detail.resourcePct[2]<45)recommendations.push('La industria está limitada por combustible');
    if(blockedRoutes>0&&!recommendations.some(x=>x.includes('ruta')))recommendations.push('Revisa las rutas comerciales bloqueadas');
    const unique=[...new Set(recommendations)].slice(0,3);

    return {
      cell,f,scope:exact?'nodo':(comp>=0?'red conectada':'nacional'),component:comp,
      logistic,material:detail.material,combined,resourcePct:detail.resourcePct.slice(),
      stock,cap,prod,demand,production,consumption,balance,
      activeRoutes,blockedRoutes,tradeFlow,
      criticalResource:RESOURCE_LABELS03720[critical],criticalPct:detail.resourcePct[critical],
      cause,recommendations:unique
    };
  }

  function openSupplyDiagnosis03723(cell){
    const diag=supplyDiagnosis03722(cell);
    if(!diag){toast('No hay diagnóstico de suministro disponible');return false}
    const material=materialSupplyDetail03721(cell);
    const state=diag.combined>=75?'ABASTECIDO':diag.combined>=55?'TENSIÓN':diag.combined>=35?'BAJO':'CRÍTICO';
    closeContextDialog3244?.();
    if(typeof uiInteractionState3244==='object'&&uiInteractionState3244)
      uiInteractionState3244.modal={type:'supply_diagnosis_03723',data:{cell}};
    modal3244.classList.add('open3244');
    modal3244.setAttribute('aria-hidden','false');
    modalTitle3244.textContent='Suministro · '+placeDisplayName3271(cell);
    const bal=(diag.balance>=0?'+':'')+diag.balance.toFixed(2);
    let html='<div class="supplyModal03723">'+
      '<div class="supplyModalHero03723"><span>'+state+'</span><b>'+diag.combined+'%</b></div>'+
      '<div class="supplyModalTriplet03723">'+
        '<span><small>Logística física</small><b>'+diag.logistic+'%</b></span>'+
        '<span><small>Material</small><b>'+diag.material+'%</b></span>'+
        '<span><small>Ámbito</small><b>'+escapeHtml3271(diag.scope)+'</b></span>'+
      '</div>'+
      '<div class="supplyResourceGrid03721">';
    for(let i=0;i<5;i++){
      const p=material.resourcePct[i];
      html+='<span><b>'+RESOURCE_LABELS03720[i]+'</b><i><em style="width:'+p+'%"></em></i><small>'+p+'%</small></span>';
    }
    html+='</div>'+
      '<div class="supplyDiagnosisGrid03722">'+
        '<span>Producción</span><b>'+diag.production.toFixed(2)+' u/s</b>'+
        '<span>Consumo</span><b>'+diag.consumption.toFixed(2)+' u/s</b>'+
        '<span>Balance</span><b class="'+(diag.balance>=0?'good03722':'bad03722')+'">'+bal+' u/s</b>'+
        '<span>Flujo comercial</span><b>'+diag.tradeFlow.toFixed(2)+' u/s</b>'+
        '<span>Rutas activas</span><b>'+diag.activeRoutes+'</b>'+
        '<span>Rutas bloqueadas</span><b>'+diag.blockedRoutes+'</b>'+
      '</div>'+
      '<div class="supplyCause03722"><small>Principal problema</small><b>'+escapeHtml3271(diag.cause)+'</b></div>'+
      '<div class="supplyAdvice03722">'+diag.recommendations.map(x=>'<span>› '+escapeHtml3271(x)+'</span>').join('')+'</div>'+
    '</div>';
    modalBody3244.innerHTML=html;
    modalActions3244.innerHTML='<button data-modal-action="close">CERRAR</button>';
    return true;
  }

  document.getElementById('panel')?.addEventListener('click',e=>{
    const b=e.target?.closest?.('button');
    if(!b)return;
    const txt=(b.textContent||'').toUpperCase();
    if(!txt.includes('INFORMACIÓN')||!txt.includes('SUMINISTRO'))return;
    const cell=selectedGameCell3230();
    if(cell<0||owner6[cell]!==0)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    openSupplyDiagnosis03723(cell);
  },true);

  function routeCargoText03720(r){
    const a=Array.isArray(r.cargo03720)?r.cargo03720:[];
    const parts=[];
    for(let i=0;i<5;i++)if((a[i]||0)>=.015)parts.push(RESOURCE_SHORT03720[i]+' '+a[i].toFixed(2)+'/s');
    return parts.join(' · ');
  }

  const baseSupplyPct03721=supplyPct3220;
  supplyPct3220=function(cell){
    const logistic=Number(baseSupplyPct03721.apply(this,arguments))||0;
    if(logistic<=0||owner6[cell]!==0||!resourceNation03720[0])return logistic;
    const detail=materialSupplyDetail03721(cell);
    if(!detail)return logistic;
    // La conexión física sigue siendo obligatoria; los materiales solo pueden
    // reducir el suministro utilizable. Con material crítico, una red físicamente
    // conectada pasa gradualmente a naranja/rojo.
    return Math.round(clamp(logistic*(.25+.75*detail.material/100),0,logistic));
  };

  const baseTerritorialEconomy03720=territorialEconomy3261;
  territorialEconomy3261=function(f){
    const r=baseTerritorialEconomy03720.apply(this,arguments);
    const s=resourceNation03720[Number(f)];
    if(!s||!r||typeof r!=='object')return r;
    const gross=(Number(r.gross)||0)*s.economyFactor;
    const maintenance=Number(r.maintenance)||0;
    return {...r,
      gross,net:gross-maintenance,gold:gross-maintenance,
      troop:(Number(r.troop)||0)*s.recruitFactor,
      materialEconomyFactor:s.economyFactor,
      materialRecruitFactor:s.recruitFactor
    };
  };
  economyRate3230=territorialEconomy3261;

  function rebuildTradeCache0370(force=false){
    const wall=performance.now();
    if(!force&&!dirty&&wall-lastCacheWall<1700)return;
    if(!force&&wall-lastCacheWall<650)return;
    rebuildRoadGraph0370();rebuildPorts0370();
    tradeCache.fill(0);goodsCache.fill(0);
    for(let f=0;f<activeFactionCount3230;f++)tradeCache[f]=residualTrade0370(f);
    routeEvals=0;
    for(const r of routes){
      if(r.status==='closed')continue;
      const k=routeFactor0370(r),material=Number.isFinite(r.materialFactor03720)?r.materialFactor03720:1,
            value=(r.baseValue||0)*k*material,share=value*.56,
            physical=Number.isFinite(r.cargoTotal03720)?r.cargoTotal03720:value*9.5;
      r.lastFactor=k;r.lastValue=value;routeEvals++;
      if(k<=0)continue;
      if(r.a<activeFactionCount3230){tradeCache[r.a]+=share;goodsCache[r.a]+=physical}
      if(r.b<activeFactionCount3230){tradeCache[r.b]+=share;goodsCache[r.b]+=physical}
    }
    dirty=false;lastCacheWall=wall;
  }

  tradeIncome3261=function(f){
    rebuildTradeCache0370(false);
    return tradeCache[f]||0;
  };

  function repairOneLandRoute0370(){
    const land=routes.filter(r=>r.type==='land'&&r.status!=='closed'&&r.needsRebuild);
    if(!land.length)return false;
    if(rebuildCursor>=land.length)rebuildCursor=0;
    const r=land[rebuildCursor++];
    const comp=sharedRoadComponent0370(r.a,r.b);
    if(comp<0){r.path=[];r.status='broken';r.needsRebuild=false;markTradeDirty0370();return true}
    const full=buildLandPath0370(r.a,r.b,comp);
    if(!full)return false;
    r.path=samplePath0370(full,320);r.distance=full.length;r.component=comp;r.roadEpoch=roadEpoch;
    r.from=full[0];r.to=full[full.length-1];r.via=routeOwners0370(full,r.a,r.b);
    r.baseValue=routeBaseValue0370('land',r.a,r.b,full.length,r.from,r.to);
    r.needsRebuild=false;markTradeDirty0370();return true;
  }

  function autoLandTrade0370(f){
    if(pathBudget0370<=0||routeCount0370(f)>=routeLimit0370(f))return false;
    for(const o of diplomaticTargets0370(f)){
      if(o<=f||o>=activeFactionCount3230||!tradeRelation0370(f,o)||
         routeCount0370(o)>=routeLimit0370(o)||routeExists0370('land',f,o))continue;
      const r=createLandRoute0370(f,o);
      if(!r)continue;
      if(r.status==='blocked'&&f>0&&o>0){
        let granted=true;
        for(const v of missingPermits0370(r)){
          if(!requestTransit0370('land',f,o,v,false)){granted=false;break}
        }
        if(granted){r.mode='legal';r.status='active'}
        else{
          const mf=window.HexategosNationAI0360&&window.HexategosNationAI0360.mindset?window.HexategosNationAI0360.mindset(f):'';
          const mo=window.HexategosNationAI0360&&window.HexategosNationAI0360.mindset?window.HexategosNationAI0360.mindset(o):'';
          if(mf==='opportunist'||mo==='opportunist'){r.mode='smuggle';r.status='smuggling'}
        }
      }
      markTradeDirty0370();return true;
    }
    return false;
  }

  function bestSeaCandidate0370(f){
    if(routeCount0370(f)>=routeLimit0370(f))return null;
    rebuildPorts0370();
    const own=portsByFaction[f]||[];
    if(!own.length)return null;
    const snap=ensureEconomySnapshot3261(false),out=[];
    const domesticCount=routes.filter(r=>r.type==='sea'&&r.status!=='closed'&&r.a===f&&r.b===f).length;
    const domesticWanted=Math.min(2,Math.floor(own.length/2));
    if(own.length>=2&&domesticCount<domesticWanted){
      let best=null,bestScore=1e9;
      for(let i=0;i<Math.min(8,own.length);i++)for(let j=i+1;j<Math.min(8,own.length);j++){
        const from=own[i],to=own[j];
        if(routeExists0370('sea',f,f,from,to))continue;
        const d=angularHeuristic3254(from,to);
        const score=d-(cityLevel3230[from]||0)*.7-(cityLevel3230[to]||0)*.7-
          (industryLevel3230[from]||0)*.5-(industryLevel3230[to]||0)*.5;
        if(score<bestScore){bestScore=score;best={o:f,from,to,score:26-score*.05,domestic:true}}
      }
      if(best)out.push(best);
    }
    for(const o of diplomaticTargets0370(f)){
      if(o===f||o<0||o>=activeFactionCount3230||!tradeRelation0370(f,o)||
         !(portsByFaction[o]||[]).length||routeCount0370(o)>=routeLimit0370(o))continue;
      const pp=bestPortPair0370(f,o);
      if(!pp||routeExists0370('sea',f,o,pp.from,pp.to))continue;
      const role=FACTIONS3230[f]&&FACTIONS3230[f].role||'balanced';
      const score=24-pp.score*.05+(role==='naval'?9:role==='growth'?5:0)+
        Math.min(10,(snap.industryWeighted[o]||0)*.08+(snap.cityWeighted[o]||0)*.035);
      out.push({o,from:pp.from,to:pp.to,score});
    }
    out.sort((a,b)=>b.score-a.score);
    return out[0]||null;
  }

  function autoSeaTrade0370(f){
    if(seaPathUsed0370||pathBudget0370<=0)return false;
    const c=bestSeaCandidate0370(f);if(!c)return false;
    const mindset=window.HexategosNationAI0360&&window.HexategosNationAI0360.mindset?
      window.HexategosNationAI0360.mindset(f):'';
    const risky=mindset==='opportunist'||FACTIONS3230[f]&&FACTIONS3230[f].role==='naval';
    const r=createSeaRoute0370(f,c.o,c.from,c.to,risky,false);
    return !!r&&!r.deferred&&!r.needsRisk;
  }

  function tradeIncident0370(r){
    const missing=missingPermits0370(r);
    if(!missing.length)return;
    const chance=r.mode==='smuggle'?0.12:0.075;
    if(Math.random()>=chance)return;
    const via=missing[(Math.floor(campaignSeconds3230)+r.id)%missing.length];
    const offender=r.a===0?0:r.b===0?0:r.a;
    if(typeof dipSetOpinion3300==='function'&&typeof dipOpinionOf3300==='function')
      dipSetOpinion3300(via,offender,dipOpinionOf3300(via,offender)-(r.mode==='smuggle'?5.5:3.5));
    if(typeof dipSetTrust3300==='function'&&typeof dipTrustOf3300==='function')
      dipSetTrust3300(via,offender,dipTrustOf3300(via,offender)-(r.mode==='smuggle'?3.2:2));
    r.lastIncident=campaignSeconds3230;
    if(Math.random()<.32)r.inspectionUntil=campaignSeconds3230+18;
    if(r.a===0||r.b===0)toast((r.mode==='smuggle'?'Contrabando descubierto por ':'Incidente de tránsito con ')+factionName3230(via));
    markTradeDirty0370();
  }

  function refreshOneSeaRisk0370(){
    const sea=routes.filter(r=>r.type==='sea'&&r.status!=='closed'&&r.path&&r.path.length);
    if(!sea.length)return;
    if(riskCursor>=sea.length)riskCursor=0;
    const r=sea[riskCursor++];
    r.navalRisk=navalRouteRisk3270(r.a,r.path).risk;
    markTradeDirty0370();
  }

  function tradeTick0370(){
    if(!started3230||paused3230||gameSpeed3212<=0)return;
    const t0=performance.now();
    pathBudget0370=2;seaPathUsed0370=false;
    rebuildRoadGraph0370();rebuildPorts0370();
    repairOneLandRoute0370();
    autoLandTrade0370(0);
    const batch=activeFactionCount3230>=450?7:activeFactionCount3230>=350?9:12;
    for(let i=0;i<batch;i++){
      if(aiCursor<=0||aiCursor>=activeFactionCount3230)aiCursor=1;
      const f=aiCursor++;
      autoLandTrade0370(f);
    }
    for(let i=0;i<batch&&!seaPathUsed0370;i++){
      let f=1+((aiCursor+i)%Math.max(1,activeFactionCount3230-1));
      autoSeaTrade0370(f);
    }
    refreshOneSeaRisk0370();
    for(const r of routes){
      if((r.mode==='risky'||r.mode==='smuggle')&&campaignSeconds3230>=(r.nextIncident||0)){
        r.nextIncident=campaignSeconds3230+17+(r.id%13);
        tradeIncident0370(r);
      }
    }
    resourceTick03720(false);
    rebuildTradeCache0370(true);
    lastTickMs=performance.now()-t0;
  }

  function seaCandidates0370(port){
    const a=owner6[port],out=[];
    if(a<0)return out;
    rebuildPorts0370();
    for(let b=0;b<activeFactionCount3230;b++){
      if((b!==a&&!tradeRelation0370(a,b))||!(portsByFaction[b]||[]).length)continue;
      const portLimit=b===a?24:8;
      for(const to of portsByFaction[b].slice(0,portLimit)){
        if(to===port||routeExists0370('sea',a,b,port,to))continue;
        const d=angularHeuristic3254(port,to);
        out.push({b,to,d,value:routeBaseValue0370('sea',a,b,Math.max(2,d*14),port,to)});
      }
    }
    out.sort((x,y)=>(y.value-y.d*.006)-(x.value-x.d*.006));
    return out.slice(0,14);
  }

  function openSeaTradeModal0370(port){
    if(port<0||!ports3212.has(port)||owner6[port]!==0){toast('Selecciona uno de tus puertos');return}
    const list=seaCandidates0370(port);
    closeContextDialog3244();
    uiInteractionState3244.modal={type:'trade_sea_0370',data:{port}};
    modal3244.classList.add('open3244');modal3244.setAttribute('aria-hidden','false');
    modalTitle3244.textContent='Ruta comercial marítima · '+placeDisplayName3271(port);
    if(!list.length){
      modalBody3244.innerHTML='<div class="stat3244">No hay otro puerto compatible. Puedes abrir rutas entre tus propios puertos o con países con los que tengas Comercio o Alianza.</div>';
      modalActions3244.innerHTML='<button data-modal-action="close">Cerrar</button>';return;
    }
    let html='<div class="tradeRouteList0370">';
    for(const x of list){
      html+='<button class="tradeCandidate0370" data-trade-from0370="'+port+'" data-trade-to0370="'+x.to+'">'+
        '<b>'+escapeHtml3271(placeDisplayName3271(x.to))+'</b>'+
        '<span>'+(x.b===0?'Comercio interior':escapeHtml3271(factionName3230(x.b)))+'</span>'+
        '<small>Valor estimado '+x.value.toFixed(2)+'/s · distancia '+x.d.toFixed(1)+'</small></button>';
    }
    html+='</div>';
    modalBody3244.innerHTML=html;
    modalActions3244.innerHTML='<button data-modal-action="close">Cancelar</button>';
  }

  function seaTradeTargetReason03711(from,to){
    if(!Number.isInteger(to)||to<0||to===from)return 'Selecciona otro puerto en el mapa';
    if(!ports3212.has(to))return 'El destino debe ser un puerto';
    const b=owner6[to];
    if(b<0)return 'Ese puerto no pertenece a una nación';
    if(b!==0&&!tradeRelation0370(0,b))return 'Necesitas Comercio, No agresión o Alianza con ese país';
    if(routeExists0370('sea',0,b,from,to))return 'Ya existe una ruta comercial con ese puerto';
    if(routeCount0370(0)>=routeLimit0370(0))return 'Has alcanzado el límite de rutas comerciales';
    if(b!==0&&routeCount0370(b)>=routeLimit0370(b))return factionName3230(b)+' no admite más rutas';
    return '';
  }

  function createPlayerSeaRoute0370(from,to){
    const b=owner6[to];
    if(owner6[from]!==0||b<0||from===to)return null;
    pathBudget0370=1;seaPathUsed0370=false;
    let r=createSeaRoute0370(0,b,from,to,false,true);
    if(r&&r.needsRisk){
      const names=r.denied.map(factionName3230).join(', ');
      if(!confirm('No se ha obtenido permiso de tránsito de '+names+'. ¿Abrir la ruta igualmente y exponerte a inspecciones e incidentes diplomáticos?'))return null;
      pathBudget0370=1;seaPathUsed0370=false;
      r=createSeaRoute0370(0,b,from,to,true,true);
    }
    if(r&&!r.needsRisk&&!r.deferred){
      closeModal3244();saveGame3212();renderSystems3220();needsRender=true;
      return r;
    }
    return null;
  }

  let seaTradeTargetStartedAt03716=-1e9;

  function beginSeaTradeMapPick03716(from){
    if(from<0||!ports3212.has(from)||owner6[from]!==0){
      toast('Selecciona uno de tus puertos');return false;
    }
    if(routeCount0370(0)>=routeLimit0370(0)){
      toast('Has alcanzado el límite de rutas comerciales');return false;
    }
    if(typeof closeModal3244==='function')closeModal3244();

    // El controlador v3.28.2 exige que todo modo de segundo destino nazca
    // mediante beginTargetFromDialog3282(), igual que carretera/transporte.
    let armed=false;
    if(typeof beginTargetFromDialog3282==='function'){
      beginTargetFromDialog3282('select_trade_route_target',from,'sea_trade_0370');
      armed=uiInteractionState3244.interactionMode==='select_trade_route_target';
    }else{
      // Fallback de compatibilidad para builds antiguos sin controlador estricto.
      armed=setInteractionMode3244('select_trade_route_target',from,'sea_trade_0370')!==false;
    }
    if(!armed){
      toast('No se pudo activar la selección de destino comercial');
      return false;
    }
    seaTradeTargetStartedAt03716=performance.now();
    interactionText3244.textContent='Ruta comercial · selecciona cualquier puerto válido en el mapa';
    toast('Selecciona el puerto de destino');
    return true;
  }

  function nearestPortScreen03715(x,y){
    if(!ports3212?.size)return -1;
    const L=loadLevel(MAX_GAME_LEVEL3233),C=L.centers,R=baseRadius(),cx=vw/2,cy=vh/2;
    let best=-1,bd=Math.max(22,Math.min(34,18+zoom*.35));
    bd*=bd;
    for(const port of ports3212){
      const j=port*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(p[2]<.035)continue;
      const dx=p[0]-x,dy=p[1]-y,d=dx*dx+dy*dy;
      if(d<bd){bd=d;best=port}
    }
    return best;
  }

  function tradeTargetFailure03716(from,cell){
    const b=owner6[cell];
    if(routes.length>=MAX_ROUTES)return 'Se alcanzó el límite global de rutas';
    if(routeCount0370(0)>=routeLimit0370(0))return 'Has alcanzado el límite de rutas comerciales';
    if(b>0&&routeCount0370(b)>=routeLimit0370(b))return factionName3230(b)+' no admite más rutas';
    if(bestPortSea3270(from)<0||bestPortSea3270(cell)<0)return 'Uno de los puertos no tiene acceso marítimo navegable';
    return 'No se pudo encontrar un corredor marítimo navegable entre ambos puertos';
  }

  function handleSeaTradeTarget03716(cell){
    const from=uiInteractionState3244.sourceCell;
    const reason=seaTradeTargetReason03711(from,cell);
    if(reason){
      interactionText3244.textContent='Ruta comercial · '+reason;
      toast(reason);
      return false;
    }
    const r=createPlayerSeaRoute0370(from,cell);
    if(!r){
      const msg=tradeTargetFailure03716(from,cell);
      interactionText3244.textContent='Ruta comercial · '+msg;
      toast(msg);
      return false;
    }
    cancelInteractionMode3245();
    toast('Ruta comercial creada · '+placeDisplayName3271(from)+' → '+placeDisplayName3271(cell));
    return true;
  }

  // El pick final del juego (v3.28.2) llama a handleInteractionTarget3245.
  // Interceptamos ESE manejador, no la compatibilidad 3244.
  const baseHandleInteractionTarget03716=handleInteractionTarget3245;
  handleInteractionTarget3245=function(cell){
    if(uiInteractionState3244.interactionMode!=='select_trade_route_target')
      return baseHandleInteractionTarget03716.apply(this,arguments);

    // Misma defensa anti click-through del controlador estricto.
    if(performance.now()-seaTradeTargetStartedAt03716<220)return;
    return handleSeaTradeTarget03716(cell);
  };
  // Mantener el alias de compatibilidad alineado con el controlador real.
  handleInteractionTarget3244=handleInteractionTarget3245;

  // En modo comercial, prioriza el icono/hexágono exacto del puerto.
  const basePick03716=pick;
  pick=function(x,y){
    if(uiInteractionState3244.interactionMode==='select_trade_route_target'){
      const port=nearestPortScreen03715(x,y);
      if(port>=0){
        handleInteractionTarget3245(port);
        return;
      }
    }
    return basePick03716.apply(this,arguments);
  };

  function rebaseFleet0370(id,port,notify=true){
    const g=navalGroups3270.find(x=>x.id===id);
    if(!g)return false;
    if(port<0||!ports3212.has(port)||owner6[port]!==g.f){
      if(notify&&g.f===0)toast('La nueva base debe ser un puerto propio');
      return false;
    }
    const sea=bestPortSea3270(port,g.cell);
    if(sea<0)return false;
    g.pendingHome0370=port;g.order='return';g.targetPort=-1;g.escortFleetId=-1;
    g.route=null;g.routeGoal=-1;
    if(!setNavalDestination3270(g,sea)){g.pendingHome0370=-1;return false}
    if(notify&&g.f===0)toast('Traslado de base ordenado a '+placeDisplayName3271(port));
    saveGame3212();needsRender=true;return true;
  }

  function closeRoute0370(id){
    const r=routes.find(x=>x.id===id);
    if(!r||!(r.a===0||r.b===0))return;
    r.status='closed';
    if(focusedTradeRoute03717===r.id)clearTradeRouteFocus03717(false);
    markTradeDirty0370();saveGame3212();renderSystems3220();needsRender=true;
  }

  function requestRouteTransit0370(id){
    const r=routes.find(x=>x.id===id);
    if(!r||!(r.a===0||r.b===0))return;
    let all=true;
    for(const v of missingPermits0370(r)){
      if(!requestTransit0370(r.type,r.a,r.b,v,true))all=false;
    }
    if(all){r.mode='legal';r.status='active';toast('Permisos de tránsito concedidos')}
    else toast('La ruta sigue necesitando permisos');
    markTradeDirty0370();saveGame3212();renderSystems3220();
  }

  function enableSmuggling0370(id){
    const r=routes.find(x=>x.id===id);
    if(!r||r.type!=='land'||!(r.a===0||r.b===0))return;
    r.mode='smuggle';r.status='smuggling';r.nextIncident=campaignSeconds3230+8;
    toast('Contrabando activo · beneficio reducido y riesgo diplomático');
    markTradeDirty0370();saveGame3212();renderSystems3220();
  }

  window.HexategosTradeActions0370={
    openSeaTrade:openSeaTradeModal0370,
    pickSeaOnMap:beginSeaTradeMapPick03716,
    focusRoute:focusTradeRoute03717,
    clearRouteFocus:clearTradeRouteFocus03717,
    canPickSeaTarget:(from,to)=>seaTradeTargetReason03711(Number(from),Number(to)),
    createSea:createPlayerSeaRoute0370,
    rebase:rebaseFleet0370,
    closeRoute:closeRoute0370,
    requestTransit:requestRouteTransit0370,
    smuggle:enableSmuggling0370
  };

  const baseClassicActions0370=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const a=baseClassicActions0370(ctx);
    // 0.37.24: reutiliza la acción INFORMACIÓN nativa, pero la enruta al
    // diagnóstico completo de suministro. Evita que el manejador antiguo
    // muestre únicamente "Suministro: XX%".
    if(ctx&&ctx.kind==='cell'&&ctx.own){
      const info=a.find(x=>{
        const label=String(x?.label||'').toUpperCase();
        const sub=String(x?.sub||'').toUpperCase();
        return label.includes('INFORM')&&(sub.includes('SUMIN')||sub.includes('TERRENO'));
      });
      if(info){
        info.id='supply_diagnosis_03724';
        info.label='INFORMACIÓN';
        info.sub='TERRENO Y SUMINISTRO';
        info.enabled=true;
      }
    }
    if(ctx&&ctx.kind==='cell'&&ctx.own&&ctx.port){
      const tr=a.find(x=>x.id==='transport');
      if(tr){tr.label='TRANSPORTE';tr.sub=tr.enabled?'TROPAS · ELIGE COSTA':tr.sub}
      let at=a.findIndex(x=>x.id==='transport');if(at<0)at=0;
      const canFleet=gold3212>=NAVAL_BUILD_COST3270;
      const canTrade=routeCount0370(0)<routeLimit0370(0);
      a.splice(at+1,0,
        classicAction3246('naval_build_0370','CONSTRUIR FLOTA','⚓',canFleet?NAVAL_BUILD_COST3270+' ORO':'NECESITA '+NAVAL_BUILD_COST3270+' ORO',canFleet,'good3244'),
        classicAction3246('sea_trade_0370','RUTA COMERCIAL','⇄',canTrade?'ELIGE PUERTO EN MAPA':'LÍMITE DE RUTAS',canTrade,'')
      );
    }
    return a;
  };

  const baseContextAction0370=handleContextAction3244;
  handleContextAction3244=function(id){
    if(id==='supply_diagnosis_03724'){
      const ctx=uiInteractionState3244.contextData;
      if(!ctx||ctx.kind!=='cell'||!ctx.own)return;
      closeContextDialog3244();
      openSupplyDiagnosis03723(ctx.cell);
      return;
    }
    if(id==='naval_build_0370'||id==='sea_trade_0370'){
      const ctx=uiInteractionState3244.contextData;
      if(!ctx||ctx.kind!=='cell'||!ctx.own||!ctx.port)return;
      closeContextDialog3244();
      if(id==='naval_build_0370')buildNavalGroup3270(0,ctx.cell,true);
      else beginSeaTradeMapPick03716(ctx.cell);
      return;
    }
    return baseContextAction0370(id);
  };

  modalBody3244.addEventListener('click',e=>{
    const b=e.target.closest('[data-trade-to0370]');
    if(!b)return;
    e.preventDefault();e.stopPropagation();
    createPlayerSeaRoute0370(Number(b.dataset.tradeFrom0370),Number(b.dataset.tradeTo0370));
  });

  navalGroupAtHome3270=function(g){
    if(!g||g.home<0||!ports3212.has(g.home)||owner6[g.home]!==g.f)return false;
    return adjacentSeaCells3261(g.home).includes(g.cell);
  };

  const baseNavalOrderPlayer0370=navalOrderPlayer3270;
  navalOrderPlayer3270=function(id,order){
    const g=navalGroups3270.find(x=>x.id===id&&x.f===0);
    if(g){
      g.interceptPhase0371=null;g.interceptReturn0371=null;g.interceptEnemyPort0371=-1;
      if(order==='patrol'){g.patrolNext0371=0;g._patrolAwaitingNext03719=false}
    }
    if(g&&(order==='return'||order==='patrol')&&g.home<0){
      toast('La flota no tiene base · selecciona un puerto propio y traslada la base');
      return;
    }
    return baseNavalOrderPlayer0370(id,order);
  };

  function navalPathPermit0371(nowCampaign){
    const bucket=Math.floor((nowCampaign||0)/1.35);
    if(bucket!==navalPathBucket0371){navalPathBucket0371=bucket;navalPathUsed0371=0}
    if(navalPathUsed0371>=1)return false;
    navalPathUsed0371++;return true;
  }

  function buildLocalPatrolRoute03719(g,nowCampaign){
    if(!g||g.home<0||!ports3212.has(g.home)||owner6[g.home]!==g.f)return false;
    const homeSea=bestPortSea3270(g.home,g.cell);
    if(homeSea<0||g.cell!==homeSea)return false;

    // Patrulla cerrada y determinista: sale de la celda de mar del puerto,
    // recorre una excursión local y vuelve EXACTAMENTE a la misma celda.
    // El regreso reutiliza el camino de ida al revés: cero A* adicional y
    // garantía de cierre incluso con 500 naciones.
    const L=loadLevel(MAX_GAME_LEVEL3233),outbound=[homeSea];
    const seed=(g.id*1103515245+Math.floor(nowCampaign/4)*12345)>>>0;
    let u=homeSea,prev=-1;
    for(let step=0;step<9;step++){
      const opts=[];
      for(let k=L.offsets[u];k<L.offsets[u+1];k++){
        const v=L.edgeNbr[k];if(v<0||L.land[v]>=0||v===prev)continue;
        opts.push(v);
      }
      if(!opts.length)break;
      opts.sort((a,b)=>angularHeuristic3254(a,homeSea)-angularHeuristic3254(b,homeSea));
      const farStart=Math.max(0,Math.floor(opts.length*.45));
      const span=Math.max(1,opts.length-farStart);
      const pick=opts[Math.min(opts.length-1,farStart+((seed>>>Math.min(20,step*2))%span))];
      prev=u;u=pick;outbound.push(u);
    }
    if(outbound.length<3)return false;

    const route=outbound.concat(outbound.slice(0,-1).reverse());
    if(route[0]!==homeSea||route[route.length-1]!==homeSea)return false;
    g.route=route;g.routePos=0;g.routeGoal=homeSea;
    g._patrolHomeSea03719=homeSea;
    g._patrolPort03719=g.home;
    g._patrolCycle03719=(g._patrolCycle03719||0)+1;
    // Mientras la ruta está activa no se lanza otra. Al finalizar se programa
    // una breve estancia en puerto antes de la siguiente salida.
    g.patrolNext0371=Number.POSITIVE_INFINITY;
    return true;
  }

  function startInterceptExcursion0371(g,nowCampaign){
    if(!g||g.home<0||!navalPathPermit0371(nowCampaign))return false;
    const enemyPort=nearestHostilePort3270(g.f,g.home);
    if(enemyPort<0)return false;
    const start=bestPortSea3270(g.home,g.cell),goal=bestPortSea3270(enemyPort,start);
    if(start<0||goal<0)return false;
    const full=findSeaPathCells3270(g.cell,goal);
    if(!full||full.length<4)return false;
    const maxLeg=32+(g.id%17),cut=Math.min(full.length-1,maxLeg,Math.max(3,Math.floor(full.length*.68)));
    const outward=full.slice(0,cut+1);
    g.route=outward;g.routePos=0;g.routeGoal=outward[outward.length-1];
    g.interceptPhase0371='out';
    g.interceptReturn0371=outward.slice().reverse();
    g.interceptEnemyPort0371=enemyPort;
    g.interceptNext0371=nowCampaign+12+(g.id%9);
    return true;
  }

  updateNavalOrder3270=function(g,nowCampaign){
    if(g.home>=0&&(!ports3212.has(g.home)||owner6[g.home]!==g.f)){
      g.home=-1;g.order='intercept';g.targetPort=-1;g.route=null;g.routeGoal=-1;
      if(g.f===0&&nowCampaign-(g.lastNotice||-1e9)>8){
        toast('Una flota ha perdido su puerto base');g.lastNotice=nowCampaign;
      }
    }

    const pending=g.pendingHome0370;
    if(Number.isInteger(pending)&&pending>=0){
      if(!ports3212.has(pending)||owner6[pending]!==g.f){g.pendingHome0370=-1;g.order='intercept'}
      else{
        const sea=bestPortSea3270(pending,g.cell);
        if(sea>=0)setNavalDestination3270(g,sea);
        if(adjacentSeaCells3261(pending).includes(g.cell)){
          g.home=pending;g.pendingHome0370=-1;g.order='patrol';g.route=null;g.routeGoal=-1;
          if(g.f===0)toast('Traslado de base completado · '+placeDisplayName3271(g.home));
        }
        return;
      }
    }

    if(g.home<0){
      if(g.order==='return'||g.order==='patrol')g.order='intercept';
      if(g.order==='escort'){
        let tr=findTransportById3270(g.escortFleetId);
        if(!tr){g.order='intercept';g.escortFleetId=-1}
        else{
          const sea=currentTransportSeaCell3270(tr);
          if(sea>=0&&angularHeuristic3254(g.cell,sea)>2.4&&nowCampaign-g.lastRetarget>3){
            setNavalDestination3270(g,sea);g.lastRetarget=nowCampaign;
          }
        }
      }
      if(g.order==='intercept'){
        const hit=nearestTransport3270(g.f,g.cell,true);
        if(hit&&hit.d<36&&nowCampaign-g.lastRetarget>3){
          setNavalDestination3270(g,hit.sea);g.lastRetarget=nowCampaign;
        }
      }
      return;
    }

    if(g.order==='return'){
      const sea=bestPortSea3270(g.home,g.cell);
      if(sea>=0)setNavalDestination3270(g,sea);
      if(navalGroupAtHome3270(g)){g.order='patrol';g.route=null;g.routeGoal=-1}
      return;
    }
    if(g.order==='blockade'){
      if(g.targetPort<0||owner6[g.targetPort]===g.f||!ports3212.has(g.targetPort)){
        g.order='intercept';g.targetPort=-1;g.route=null;return;
      }
      const sea=bestPortSea3270(g.targetPort,g.cell);
      if(sea>=0)setNavalDestination3270(g,sea);
      return;
    }
    if(g.order==='escort'){
      let tr=findTransportById3270(g.escortFleetId);
      if(!tr){
        const near=nearestTransport3270(g.f,g.cell,false);
        tr=near&&near.fleet||null;g.escortFleetId=tr?tr.id3270:-1;
      }
      if(!tr){g.order='patrol';g.route=null;return}
      const sea=currentTransportSeaCell3270(tr);
      if(sea>=0&&angularHeuristic3254(g.cell,sea)>2.4&&nowCampaign-g.lastRetarget>3){
        setNavalDestination3270(g,sea);g.lastRetarget=nowCampaign;
      }
      return;
    }
    if(g.order==='intercept'){
      const hit=nearestTransport3270(g.f,g.cell,true);
      if(hit&&hit.d<36&&nowCampaign-g.lastRetarget>3){
        g.interceptPhase0371=null;g.interceptReturn0371=null;
        setNavalDestination3270(g,hit.sea);g.lastRetarget=nowCampaign;
        return;
      }
      if(g.interceptPhase0371==='out'){
        if(g.route&&g.route.length)return;
        const back=g.interceptReturn0371;
        if(back&&back.length>1){
          g.route=back;g.routePos=0;g.routeGoal=back[back.length-1];g.interceptPhase0371='back';
        }else g.interceptPhase0371=null;
        return;
      }
      if(g.interceptPhase0371==='back'){
        if(g.route&&g.route.length)return;
        g.interceptPhase0371=null;g.interceptReturn0371=null;
        g.interceptNext0371=nowCampaign+7+(g.id%7);
        return;
      }
      const hs=bestPortSea3270(g.home,g.cell);
      if(hs>=0&&angularHeuristic3254(g.cell,hs)>12){
        if(navalPathPermit0371(nowCampaign))setNavalDestination3270(g,hs);
        return;
      }
      if(nowCampaign>=(g.interceptNext0371||0)){
        if(startInterceptExcursion0371(g,nowCampaign))return;
        g.interceptNext0371=nowCampaign+6+(g.id%6);
      }
      if(!g.route&&nowCampaign>=(g.patrolNext0371||0))buildLocalPatrolRoute03719(g,nowCampaign);
      return;
    }
    if(g.order==='patrol'){
      // Una patrulla en curso termina siempre su ciclo antes de recibir otro.
      if(g.route&&g.route.length)return;

      // Una orden nueva de patrulla o un cambio de orden de la IA puede haber
      // heredado el Infinity usado durante el ciclo anterior.
      if(!g._patrolAwaitingNext03719&&!Number.isFinite(g.patrolNext0371))g.patrolNext0371=nowCampaign;

      const homeSea=bestPortSea3270(g.home,g.cell);
      if(homeSea<0)return;

      // Si por combate, carga o una orden previa quedó lejos de la base,
      // primero regresa al mar adyacente a SU puerto. No patrulla "desde donde esté".
      if(g.cell!==homeSea){
        if(navalPathPermit0371(nowCampaign))setNavalDestination3270(g,homeSea);
        return;
      }

      // Si acaba de finalizar un ciclo, permanece un instante en puerto.
      if(g._patrolAwaitingNext03719){
        if(nowCampaign<(g.patrolNext0371||0))return;
        g._patrolAwaitingNext03719=false;
      }
      if(nowCampaign>=(g.patrolNext0371||0))buildLocalPatrolRoute03719(g,nowCampaign);
    }
  };

  const baseAiNavalPlan0370=aiNavalPlan3270;
  aiNavalPlan3270=function(f){
    for(const g of navalGroups3270){
      if(g.f!==f||g.home>=0||g.pendingHome0370>=0)continue;
      const p=nearestOwnedPort3270(f,g.cell);
      if(p>=0)rebaseFleet0370(g.id,p,false);
      break;
    }

    const before=new Map();
    for(const g of navalGroups3270)if(g.f===f)before.set(g.id,g.home);
    const out=baseAiNavalPlan0370(f);

    let transferUsed=false;
    for(const g of navalGroups3270){
      if(g.f!==f)continue;
      const oldHome=before.get(g.id);
      if(oldHome==null||oldHome<0||g.home===oldHome)continue;
      const requested=g.home;
      if(ports3212.has(oldHome)&&owner6[oldHome]===f){
        g.home=oldHome;
        if(!transferUsed&&requested>=0&&ports3212.has(requested)&&owner6[requested]===f){
          g.route=null;g.routeGoal=-1;
          if(rebaseFleet0370(g.id,requested,false))transferUsed=true;
        }
      }
    }
    return out;
  };

  const baseRepairFleet0370=repairNavalGroup3270;
  repairNavalGroup3270=function(id){
    const g=navalGroups3270.find(x=>x.id===id&&x.f===0);
    if(g&&g.home<0){toast('La flota no tiene puerto base');return}
    return baseRepairFleet0370(id);
  };

  function routeStatusName0370(r){
    return r.status==='active'?'ACTIVA':r.status==='risky'?'SIN PERMISO':
      r.status==='smuggling'?'CONTRABANDO':r.status==='blocked'?'BLOQUEADA':
      r.status==='inspected'?'INSPECCIÓN':r.status==='suspended'?'SUSPENDIDA':
      r.status==='broken'?'INTERRUMPIDA':'RECALCULANDO';
  }

  renderNavalPanel3270=function(){
    const c=document.getElementById('sysContent3213');if(!c)return;
    rebuildTradeCache0370(false);
    const own=factionNavalGroups3270(0),trans=fleets3212.filter(x=>(x.f??0)===0);
    const status=selectedNavalStatus3270(),selected=status?status.port:-1;
    const ownSelected=selected>=0&&owner6[selected]===0;
    const enemySelected=selected>=0&&owner6[selected]!==0;
    const seaRoutes=routes.filter(r=>r.type==='sea'&&(r.a===0||r.b===0)&&r.status!=='closed');
    let html='<div class="sysBlock3213"><b>⚓ Naval y puertos · v0.37.2</b>'+
      '<div class="sysMeta3213">Cada flota pertenece a un puerto-base. Desde un puerto puedes construir flota, transportar tropas y abrir rutas comerciales marítimas.</div>'+
      '<div class="navalSummary3270"><span>Flotas</span><b>'+own.length+'</b>'+
      '<span>Fuerza</span><b>'+Math.round(own.reduce((s,g)=>s+g.strength,0))+'</b>'+
      '<span>Transportes</span><b>'+trans.length+'</b>'+
      '<span>Rutas marítimas</span><b>'+seaRoutes.length+'</b>'+
      '<span>Comercio físico</span><b>+'+(tradeCache[0]||0).toFixed(2)+'/s</b></div></div>';

    if(status){
      html+='<div class="sysBlock3213"><b>Puerto seleccionado · '+escapeHtml3271(placeDisplayName3271(status.port))+'</b>'+
        '<div class="sysMeta3213">Bloqueo '+Math.round((status.block||0)*100)+'% · fuerza propia '+Math.round(status.inf.friendly)+' / enemiga '+Math.round(status.inf.hostile)+'</div>';
      if(status.owner===0){
        html+='<button class="navalAction3270 good" onclick="buildPlayerNavalAtSelected3270()">Construir flota · '+NAVAL_BUILD_COST3270+' oro</button>'+
          '<button class="navalAction3270" onclick="HexategosTradeActions0370.openSeaTrade('+status.port+')">Abrir ruta comercial marítima</button>';
      }
      html+='</div>';
    }

    const byHome=new Map();
    for(const g of own){
      const key=g.home>=0?g.home:-1;
      if(!byHome.has(key))byHome.set(key,[]);
      byHome.get(key).push(g);
    }
    if(!own.length)html+='<div class="sysBlock3213"><div class="sysMeta3213">Selecciona un puerto propio para construir tu primera flota.</div></div>';
    for(const [home,groups] of byHome){
      html+='<div class="sysBlock3213"><b>'+(home>=0?'⚓ '+escapeHtml3271(placeDisplayName3271(home)):'⚠ FLOTAS SIN BASE')+'</b>';
      for(const g of groups){
        const pct=clamp(Math.round(g.strength/g.maxStrength*100),0,100);
        const repair=Math.ceil(Math.max(0,g.maxStrength-g.strength)*6);
        const transfer=g.pendingHome0370>=0?' · trasladándose a '+escapeHtml3271(placeDisplayName3271(g.pendingHome0370)):'';
        html+='<div class="navalFleet3270"><b>Flota '+g.id+'</b> · '+(NAVAL_ORDER_LABEL3270[g.order]||g.order)+
          '<div class="sysMeta3213">Base '+(home>=0?escapeHtml3271(placeDisplayName3271(home)):'SIN BASE')+transfer+
          ' · fuerza '+Math.round(g.strength)+'/'+g.maxStrength+'</div>'+
          '<div class="navalBar3270"><i style="width:'+pct+'%"></i></div><div class="acts">'+
          '<button onclick="navalOrderPlayer3270('+g.id+',\'patrol\')">Patrulla</button>'+
          '<button onclick="navalOrderPlayer3270('+g.id+',\'escort\')">Escolta</button>'+
          '<button onclick="navalOrderPlayer3270('+g.id+',\'intercept\')">Interceptar</button>'+
          '<button onclick="navalOrderPlayer3270('+g.id+',\'return\')">Regresar</button>'+
          (enemySelected?'<button class="warn" onclick="assignPlayerBlockade3270('+g.id+','+selected+')">Bloquear</button>':'')+
          (ownSelected&&selected!==home?'<button class="good" onclick="HexategosTradeActions0370.rebase('+g.id+','+selected+')">Trasladar base aquí</button>':'')+
          '<button class="good" onclick="repairNavalGroup3270('+g.id+')" '+(repair<=0||home<0?'disabled':'')+'>Reparar '+repair+'</button>'+
          '</div></div>';
      }
      html+='</div>';
    }

    if(seaRoutes.length){
      html+='<div class="sysBlock3213"><b>⇄ Rutas marítimas</b><div class="tradeRoutes0370">';
      for(const r of seaRoutes.slice(0,12)){
        html+='<div class="tradeRoute0370"><b>'+escapeHtml3271(placeDisplayName3271(r.from))+' ↔ '+escapeHtml3271(placeDisplayName3271(r.to))+'</b>'+
          '<span>'+(r.a===r.b?'Comercio interior':escapeHtml3271(factionName3230(r.a===0?r.b:r.a)))+' · '+routeStatusName0370(r)+' · +'+(r.lastValue||0).toFixed(2)+'/s</span>'+
          '<div class="acts"><button class="good" onclick="HexategosTradeActions0370.focusRoute('+r.id+')">Ver en mapa</button>'+(missingPermits0370(r).length?'<button onclick="HexategosTradeActions0370.requestTransit('+r.id+')">Solicitar permisos</button>':'')+
          '<button class="warn" onclick="HexategosTradeActions0370.closeRoute('+r.id+')">Cerrar ruta</button></div></div>';
      }
      html+='</div></div>';
    }
    c.innerHTML=html;
  };

  function tradeRouteById03717(id){
    id=Number(id);
    return routes.find(r=>r.id===id&&r.status!=='closed')||null;
  }

  function tradeRouteTypeLabel03717(r){
    return r.type==='sea'?'Marítima':'Terrestre';
  }

  function tradeRoutePartnerLabel03717(r){
    if(r.a===r.b)return 'Comercio interior';
    return factionName3230(r.a===0?r.b:r.a);
  }

  function tradeRouteEndpointLabel03717(cell){
    if(!Number.isInteger(cell)||cell<0)return '—';
    return placeDisplayName3271(cell);
  }

  function tradeRouteGoods03717(r){
    return Number.isFinite(r.cargoTotal03720)?Number(r.cargoTotal03720.toFixed(2)):Math.max(0,Math.round((r.lastValue||0)*9.5));
  }

  function tradeRouteSupplyLabel03717(r){
    if(r.type!=='sea'||r.a!==r.b)return '';
    return routeOperationalSupply03713(r)?'Abastecimiento interior activo':'Sin abastecimiento interior';
  }

  function showTradeRouteFocusBar03718(r){
    if(typeof interactionBar3244==='undefined'||typeof interactionText3244==='undefined')return;
    if(typeof cancelInteractionMode3245==='function'&&uiInteractionState3244?.interactionMode!=='normal')
      cancelInteractionMode3245();
    interactionText3244.textContent='Ruta comercial · '+tradeRouteEndpointLabel03717(r.from)+' ↔ '+tradeRouteEndpointLabel03717(r.to);
    const btn=document.getElementById('interactionCancel3244');
    if(btn)btn.textContent='Salir';
    interactionBar3244.classList.add('show3244');
  }

  function hideTradeRouteFocusBar03718(){
    const btn=document.getElementById('interactionCancel3244');
    if(btn)btn.textContent='Cancelar';
    if(typeof interactionBar3244!=='undefined'&&
       (typeof uiInteractionState3244==='undefined'||uiInteractionState3244.interactionMode==='normal'))
      interactionBar3244.classList.remove('show3244');
  }

  function focusTradeRoute03717(id){
    const r=tradeRouteById03717(id);
    if(!r){toast('Ruta comercial no disponible');return false}
    const visual=routeVisualPath0371(r);
    if(!visual.length){toast('La ruta no tiene trazado visible');return false}
    const cell=visual[Math.floor((visual.length-1)*.5)]??r.from;
    if(cell<0){toast('No se pudo localizar la ruta');return false}
    focusedTradeRoute03717=r.id;
    if(typeof closeSystems3220==='function')closeSystems3220();
    if(typeof cellLonLat3302==='function'&&typeof rotateToGeo3243==='function'){
      const p=cellLonLat3302(cell);
      rotateToGeo3243(p.lon,p.lat,r.type==='sea'?4.8:6.0);
    }
    showTradeRouteFocusBar03718(r);
    needsRender=true;
    return true;
  }

  function clearTradeRouteFocus03717(notify=true){
    if(focusedTradeRoute03717<0)return false;
    focusedTradeRoute03717=-1;
    hideTradeRouteFocusBar03718();
    needsRender=true;
    if(notify)toast('Vista de ruta cerrada');
    return true;
  }

  // El botón de la barra contextual funciona como SALIR mientras se visualiza
  // una ruta. Se captura antes del listener genérico de "Cancelar destino".
  document.getElementById('interactionCancel3244')?.addEventListener('click',e=>{
    if(focusedTradeRoute03717<0)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    clearTradeRouteFocus03717(true);
  },true);

  function sortedOwnRoutes03717(){
    const rank={active:0,smuggling:1,risky:2,inspected:3,rebuilding:4,blocked:5,suspended:6,broken:7};
    return routes.filter(r=>(r.a===0||r.b===0)&&r.status!=='closed').slice().sort((a,b)=>{
      const ra=rank[a.status]??4,rb=rank[b.status]??4;
      if(ra!==rb)return ra-rb;
      if(a.type!==b.type)return a.type==='sea'?-1:1;
      return (b.lastValue||0)-(a.lastValue||0);
    });
  }

  function renderTradeManagerRoute03717(r){
    const miss=missingPermits0370(r);
    const origin=escapeHtml3271(tradeRouteEndpointLabel03717(r.from));
    const dest=escapeHtml3271(tradeRouteEndpointLabel03717(r.to));
    const partner=escapeHtml3271(tradeRoutePartnerLabel03717(r));
    const status=escapeHtml3271(routeStatusName0370(r));
    const supply=tradeRouteSupplyLabel03717(r);
    const focused=r.id===focusedTradeRoute03717?' focused03717':'';
    let details='<span class="tradeRouteMetrics03717">'+
      '<i><em>Ingreso</em><b>+'+(r.lastValue||0).toFixed(2)+'/s</b></i>'+
      '<i><em>Mercancías</em><b>'+tradeRouteGoods03717(r)+'</b></i>'+
      '<i><em>Distancia</em><b>'+Math.max(0,Math.round(r.distance||0))+'</b></i>';
    if(r.type==='sea')details+='<i><em>Riesgo naval</em><b>'+Number(r.navalRisk||0).toFixed(1)+'</b></i>';
    details+='</span>';
    return '<div class="tradeRoute0370 tradeManagerRoute03717'+focused+'">'+
      '<div class="tradeRouteHead03717"><b>'+origin+' ↔ '+dest+'</b><small>'+tradeRouteTypeLabel03717(r)+'</small></div>'+
      '<span>'+partner+' · '+status+'</span>'+
      details+
      (routeCargoText03720(r)?'<small class="tradeCargo03720">Carga: '+escapeHtml3271(routeCargoText03720(r))+'</small>':'')+
      (supply?'<small class="tradeSupply03717">'+escapeHtml3271(supply)+'</small>':'')+
      (r.via&&r.via.length?'<small>Tránsito: '+r.via.map(x=>escapeHtml3271(factionName3230(x))).join(', ')+'</small>':'')+
      '<div class="acts">'+
      '<button class="good" onclick="HexategosTradeActions0370.focusRoute('+r.id+')">Ver en mapa</button>'+
      (miss.length?'<button onclick="HexategosTradeActions0370.requestTransit('+r.id+')">Solicitar tránsito</button>':'')+
      (r.type==='land'&&miss.length&&r.mode!=='smuggle'?'<button class="warn" onclick="HexategosTradeActions0370.smuggle('+r.id+')">Contrabando</button>':'')+
      '<button class="warn" onclick="HexategosTradeActions0370.closeRoute('+r.id+')">Cerrar ruta</button>'+
      '</div></div>';
  }

  const RESOURCE_SUPPLY_COLORS03721={
    good:'rgba(93,208,135,.76)',
    tension:'rgba(214,189,100,.75)',
    low:'rgba(214,141,76,.77)',
    critical:'rgba(182,79,79,.80)'
  };

  function supplyClass03721(p){
    return p>=75?'good':p>=55?'tension':p>=35?'low':'critical';
  }

  const baseUpdateMapModeUI03721=updateMapModeUI3252;
  updateMapModeUI3252=function(showToast=false){
    const out=baseUpdateMapModeUI03721.apply(this,arguments);
    if(mapMode3252==='supply'){
      const leg=document.getElementById('terrainLegend3250');
      if(leg){
        leg.innerHTML=
          '<span class="tl3250"><i style="background:#5dd087"></i>Abastecido ≥75%</span>'+
          '<span class="tl3250"><i style="background:#d6bd64"></i>Tensión 55–74%</span>'+
          '<span class="tl3250"><i style="background:#d68d4c"></i>Bajo 35–54%</span>'+
          '<span class="tl3250"><i style="background:#b64f4f"></i>Crítico &lt;35%</span>';
      }
      if(showToast)toast('Mapa de suministro · conexión logística + recursos materiales');
    }
    return out;
  };

  const baseDrawSupply03721=drawSupply3230;
  drawSupply3230=function(R,cx,cy){
    if(!showSupplyOverlay3230||currentKey!==MAX_GAME_LEVEL3233||zoom<2)
      return baseDrawSupply03721.apply(this,arguments);
    if(supplyDirty3220)supplyMap3220(false);
    const L=loadLevel(MAX_GAME_LEVEL3233),F=L.faceCenters,O=L.offsets,A=L.adj;
    ctx.save();ctx.globalAlpha=.40;
    for(const d of drawn){
      const i=d[0];if(owner6[i]!==0)continue;
      const p=supplyPct3220(i),s=O[i],e=O[i+1];ctx.beginPath();
      for(let k=s;k<e;k++){
        const fi=A[k],j=fi*3,q=projectVec(F[j]/32767,F[j+1]/32767,F[j+2]/32767,R,cx,cy);
        if(k===s)ctx.moveTo(q[0],q[1]);else ctx.lineTo(q[0],q[1]);
      }
      ctx.closePath();
      ctx.fillStyle=RESOURCE_SUPPLY_COLORS03721[supplyClass03721(p)];
      ctx.fill();
    }
    ctx.restore();
    drawSupplyRoute3253(R,cx,cy);
  };

  const baseContextHeader03721=contextHeader3244;
  contextHeader3244=function(ctx){
    const h=baseContextHeader03721.apply(this,arguments);
    if(ctx?.kind==='cell'&&ctx.cell>=0&&owner6[ctx.cell]===0&&mapMode3252==='supply'){
      const material=materialSupplyDetail03721(ctx.cell);
      if(material){
        h.meta+=' · material '+material.material+'%'+
          ' · 🍞 '+material.resourcePct[0]+'%'+
          ' · ⛽ '+material.resourcePct[2]+'%'+
          ' · 📦 '+material.resourcePct[3]+'%';
      }
    }
    return h;
  };

  const baseRenderSystems0370=renderSystems3220;
  renderSystems3220=function(){
    baseRenderSystems0370();
    if(sysTab3220!=='eco')return;
    rebuildTradeCache0370(false);
    const c=document.getElementById('sysContent3213');if(!c)return;
    const own=sortedOwnRoutes03717();
    const residual=residualTrade0370(0);
    const active=own.filter(r=>(r.lastFactor||0)>0).length;
    const material=resourceSummary03720(0);
    const selectedSupplyCell=selectedGameCell3230();
    const selectedMaterial=selectedSupplyCell>=0&&owner6[selectedSupplyCell]===0?materialSupplyDetail03721(selectedSupplyCell):null;
    const selectedLogistic=selectedSupplyCell>=0&&owner6[selectedSupplyCell]===0?Number(baseSupplyPct03721(selectedSupplyCell))||0:0;
    const selectedCombined=selectedSupplyCell>=0&&owner6[selectedSupplyCell]===0?supplyPct3220(selectedSupplyCell):0;
    let html='';
    if(material){
      html+='<div class="sysBlock3213 resourceEconomy03720"><div class="tradeManagerTitle03717"><b>▦ Economía material</b><small>'+material.nodes+' nodos logísticos</small></div>'+
        '<div class="sysMeta3213">Los stocks se producen, consumen y redistribuyen por carreteras y rutas físicas. La escasez reduce economía y reclutamiento.</div>'+
        '<div class="resourceGrid03720">';
      for(let i=0;i<5;i++){
        const pct=Math.round((material.coverage[i]||0)*100);
        html+='<span><b>'+RESOURCE_LABELS03720[i]+'</b><i><em style="width:'+pct+'%"></em></i><small>'+pct+'% · '+material.stock[i].toFixed(1)+' / '+material.cap[i].toFixed(1)+'</small></span>';
      }
      html+='</div><div class="econGrid3261">'+
        '<span>Factor económico material</span><b>'+Math.round(material.economyFactor*100)+'%</b>'+
        '<span>Factor de reclutamiento</span><b>'+Math.round(material.recruitFactor*100)+'%</b>'+
        '<span>Cálculo material</span><b>'+resourceTickMs03720.toFixed(1)+' ms</b>'+
        '</div></div>';
    }
    if(selectedMaterial){
      const diag=supplyDiagnosis03722(selectedSupplyCell);
      html+='<div class="sysBlock3213 supplyMaterialSelected03721">'+
        '<div class="tradeManagerTitle03717"><b>📦 Suministro seleccionado</b><small>'+selectedCombined+'%</small></div>'+
        '<div class="sysMeta3213">Logística física <b>'+Math.round(selectedLogistic)+'%</b> · disponibilidad material <b>'+selectedMaterial.material+'%</b></div>'+
        '<div class="supplyResourceGrid03721">';
      for(let i=0;i<5;i++){
        const p=selectedMaterial.resourcePct[i];
        html+='<span><b>'+RESOURCE_LABELS03720[i]+'</b><i><em style="width:'+p+'%"></em></i><small>'+p+'%</small></span>';
      }
      html+='</div>';
      if(diag){
        const bal=(diag.balance>=0?'+':'')+diag.balance.toFixed(2);
        html+='<div class="supplyDiagnosis03722">'+
          '<div class="tradeManagerTitle03717"><b>Diagnóstico</b><small>'+escapeHtml3271(diag.scope)+'</small></div>'+
          '<div class="supplyDiagnosisGrid03722">'+
            '<span>Producción</span><b>'+diag.production.toFixed(2)+' u/s</b>'+
            '<span>Consumo</span><b>'+diag.consumption.toFixed(2)+' u/s</b>'+
            '<span>Balance</span><b class="'+(diag.balance>=0?'good03722':'bad03722')+'">'+bal+' u/s</b>'+
            '<span>Flujo comercial</span><b>'+diag.tradeFlow.toFixed(2)+' u/s</b>'+
            '<span>Rutas activas</span><b>'+diag.activeRoutes+'</b>'+
            '<span>Rutas bloqueadas</span><b>'+diag.blockedRoutes+'</b>'+
          '</div>'+
          '<div class="supplyCause03722"><small>Principal problema</small><b>'+escapeHtml3271(diag.cause)+'</b></div>'+
          '<div class="supplyAdvice03722">'+diag.recommendations.map(x=>'<span>› '+escapeHtml3271(x)+'</span>').join('')+'</div>'+
        '</div>';
      }
      html+='</div>';
    }
    html+='<div class="sysBlock3213 tradeManager03717">'+
      '<div class="tradeManagerTitle03717"><b>⇄ Gestor de rutas comerciales</b><small>'+own.length+' registradas</small></div>'+
      '<div class="sysMeta3213">Las relaciones diplomáticas aportan solo un comercio residual de +'+residual.toFixed(2)+'/s. El flujo importante depende de rutas físicas.</div>'+
      '<div class="econGrid3261">'+
      '<span>Rutas activas / registradas</span><b>'+active+' / '+own.length+'</b>'+
      '<span>Flujo físico de mercancías</span><b>'+Number(goodsCache[0]||0).toFixed(2)+' u/s</b>'+
      '<span>Ingreso comercial</span><b>+'+(tradeCache[0]||0).toFixed(2)+'/s</b>'+
      '</div>';
    if(own.length){
      html+='<div class="tradeRoutes0370 tradeManagerList03717">';
      for(const r of own)html+=renderTradeManagerRoute03717(r);
      html+='</div>';
    }else{
      html+='<div class="sysMeta3213 tradeEmpty03717">Todavía no hay rutas físicas. Une carreteras con un socio o crea una ruta desde uno de tus puertos.</div>';
    }
    html+='</div>';
    c.insertAdjacentHTML('beforeend',html);
  };

  function domesticAnchorKind03714(cell,f){
    if(capitals[f]===cell)return 'capital';
    if(ports3212.has(cell))return 'port';
    if(industries3212.has(cell))return 'industry';
    if(cities3212.has(cell))return 'city';
    return '';
  }

  function domesticAnchorWeight03714(cell,f){
    let w=0;
    if(capitals[f]===cell)w+=60;
    if(cities3212.has(cell))w+=20+(cityLevel3230[cell]||1)*5;
    if(industries3212.has(cell))w+=18+(industryLevel3230[cell]||1)*6;
    if(ports3212.has(cell))w+=24;
    return w;
  }

  function roadTree03714(f,hub,compId,maxVisits){
    const L=loadLevel(MAX_GAME_LEVEL3233),prev=new Map([[hub,-1]]),q=[hub];
    for(let h=0;h<q.length&&q.length<maxVisits;h++){
      const u=q[h];
      for(let k=L.offsets[u];k<L.offsets[u+1];k++){
        const v=L.edgeNbr[k];
        if(v<0||prev.has(v)||owner6[v]!==f||roadComp[v]!==compId||!roadJoin0370(u,v))continue;
        prev.set(v,u);q.push(v);
      }
    }
    return prev;
  }

  function pathFromRoadTree03714(prev,hub,target){
    if(target===hub)return [hub];
    if(!prev.has(target))return null;
    const out=[];let u=target,guard=0;
    while(u>=0&&guard++<18000){
      out.push(u);
      if(u===hub)break;
      u=prev.get(u);
      if(u==null)return null;
    }
    if(out[out.length-1]!==hub)return null;
    return out.reverse();
  }

  function rebuildDomesticTraffic0371(now){
    if(now-domesticTrafficBuiltAt0371<3500&&domesticRoadTraffic0371.length)return;
    const sig=roads3212.length+':'+cities3212.size+':'+industries3212.size+':'+ports3212.size+':'+activeFactionCount3230;
    if(sig===domesticTrafficSig0371&&now-domesticTrafficBuiltAt0371<9000)return;
    domesticTrafficSig0371=sig;domesticTrafficBuiltAt0371=now;
    rebuildRoadGraph0370(false);

    // Los camiones representan viajes completos ENTRE nodos logísticos,
    // no vehículos pegados a cada array/tramo individual de roads3212.
    const groups=new Map(),seenAnchors=new Set();
    const addAnchor=(cell,f)=>{
      if(!Number.isInteger(cell)||cell<0||f<0||f>=activeFactionCount3230||owner6[cell]!==f||seenAnchors.has(cell))return;
      const comp=roadComp&&cell<roadComp.length?roadComp[cell]:-1;
      if(comp<0)return;
      seenAnchors.add(cell);
      const key=f+':'+comp;
      if(!groups.has(key))groups.set(key,{f,comp,anchors:[]});
      groups.get(key).anchors.push(cell);
    };
    for(const cell of cities3212){const f=owner6[cell];if(f>=0)addAnchor(cell,f)}
    for(const cell of industries3212){const f=owner6[cell];if(f>=0)addAnchor(cell,f)}
    for(const cell of ports3212){const f=owner6[cell];if(f>=0)addAnchor(cell,f)}
    for(let f=0;f<activeFactionCount3230;f++)addAnchor(capitals[f],f);

    const ordered=[...groups.values()].filter(g=>g.anchors.length>=2);
    ordered.sort((a,b)=>{
      const ap=a.f===0?1:0,bp=b.f===0?1:0;
      if(ap!==bp)return bp-ap;
      return b.anchors.length-a.anchors.length;
    });

    const candidates=[];
    const maxGroups=coarsePointer3255?54:96;
    let groupsDone=0;
    for(const g of ordered){
      if(groupsDone>=maxGroups&&g.f!==0)break;
      const anchors=g.anchors.slice().sort((a,b)=>domesticAnchorWeight03714(b,g.f)-domesticAnchorWeight03714(a,g.f));
      let hub=anchors[0];
      if(Number.isInteger(capitals[g.f])&&anchors.includes(capitals[g.f]))hub=capitals[g.f];

      const maxVisits=g.f===0?14000:6500;
      const prev=roadTree03714(g.f,hub,g.comp,maxVisits);
      const targets=anchors.filter(x=>x!==hub&&prev.has(x));
      targets.sort((a,b)=>{
        const ka=domesticAnchorKind03714(a,g.f),kb=domesticAnchorKind03714(b,g.f);
        const diversityA=ka!==domesticAnchorKind03714(hub,g.f)?1:0;
        const diversityB=kb!==domesticAnchorKind03714(hub,g.f)?1:0;
        return diversityB-diversityA+domesticAnchorWeight03714(b,g.f)-domesticAnchorWeight03714(a,g.f);
      });

      const perGroup=g.f===0?Math.min(18,targets.length):Math.min(2,targets.length);
      for(let i=0;i<perGroup;i++){
        const target=targets[i],full=pathFromRoadTree03714(prev,hub,target);
        if(!full||full.length<2)continue;
        candidates.push({
          path:samplePath0370(full,160),faction:g.f,anchors:2,
          origin:hub,destination:target,
          originKind:domesticAnchorKind03714(hub,g.f),
          destinationKind:domesticAnchorKind03714(target,g.f),
          score:domesticAnchorWeight03714(hub,g.f)+domesticAnchorWeight03714(target,g.f)+Math.min(40,full.length),
          seed:g.comp*37+hub*7+target*13+g.f*101
        });
      }
      groupsDone++;
    }

    candidates.sort((a,b)=>{
      const ap=a.faction===0?1:0,bp=b.faction===0?1:0;
      if(ap!==bp)return bp-ap;
      return b.score-a.score;
    });
    domesticRoadTraffic0371=candidates.slice(0,coarsePointer3255?100:220);
  }

  function projectedAlongCells0371(path,phase,C,R,cx,cy){
    if(!path||path.length<2)return null;
    const x=clamp(phase,0,.999999)*(path.length-1),i=Math.floor(x),t=x-i;
    const a=path[i]*3,b=path[Math.min(path.length-1,i+1)]*3;
    let vx=(C[a]/32767)*(1-t)+(C[b]/32767)*t;
    let vy=(C[a+1]/32767)*(1-t)+(C[b+1]/32767)*t;
    let vz=(C[a+2]/32767)*(1-t)+(C[b+2]/32767)*t;
    const n=Math.hypot(vx,vy,vz)||1;vx/=n;vy/=n;vz/=n;
    return projectVec(vx,vy,vz,R,cx,cy);
  }

  function routeVisualPath0371(r){
    const raw=r.path||[];
    if(r.type!=='sea')return raw;
    const needA=raw[0]!==r.from,needB=raw[raw.length-1]!==r.to;
    if(!needA&&!needB)return raw;
    const out=[];
    if(needA)out.push(r.from);
    for(const x of raw)out.push(x);
    if(needB)out.push(r.to);
    return out;
  }

  function pointVisible0378(p){
    return !!p&&p[2]>=.045&&p[0]>=-12&&p[0]<=vw+12&&p[1]>=-12&&p[1]<=vh+12;
  }

  function routeScreenRelevant0378(path,C,R,cx,cy){
    if(!path||!path.length)return false;
    const ids=[0,Math.floor((path.length-1)*.5),path.length-1];
    for(const ii of ids){
      const cell=path[Math.max(0,Math.min(path.length-1,ii))],j=cell*3;
      const p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(pointVisible0378(p))return true;
    }
    return false;
  }

  function drawSeaTradeLine0378(visual,C,R,cx,cy){
    ctx.beginPath();let started=false;
    const stride=Math.max(1,Math.floor(visual.length/72));
    for(let i=0;i<visual.length;i+=stride){
      const j=visual[i]*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(p[2]<.03){started=false;continue}
      if(!started){ctx.moveTo(p[0],p[1]);started=true}else ctx.lineTo(p[0],p[1]);
    }
    if(visual.length>1&&(visual.length-1)%stride!==0){
      const j=visual[visual.length-1]*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(p[2]>=.03){if(!started)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1])}
    }
    ctx.setLineDash([2.5,3.5]);
    ctx.strokeStyle='rgba(99,206,226,.30)';
    ctx.lineWidth=.85;ctx.stroke();ctx.setLineDash([]);
  }

  function drawFocusedTradeRoute03717(C,R,cx,cy){
    const r=tradeRouteById03717(focusedTradeRoute03717);
    if(!r||!r.path||!r.path.length)return;
    const visual=routeVisualPath0371(r);
    if(!routeScreenRelevant0378(visual,C,R,cx,cy))return;
    ctx.save();
    ctx.beginPath();let started=false;
    const stride=Math.max(1,Math.floor(visual.length/130));
    for(let i=0;i<visual.length;i+=stride){
      const j=visual[i]*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(p[2]<.03){started=false;continue}
      if(!started){ctx.moveTo(p[0],p[1]);started=true}else ctx.lineTo(p[0],p[1]);
    }
    const last=visual[visual.length-1];
    if(last!=null){
      const j=last*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(p[2]>=.03){if(!started)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1])}
    }
    ctx.setLineDash(r.type==='sea'?[7,4]:[]);
    ctx.lineWidth=r.type==='sea'?3.1:3.4;
    ctx.strokeStyle=r.type==='sea'?'rgba(126,229,246,.92)':'rgba(244,247,250,.88)';
    ctx.shadowBlur=8;ctx.shadowColor=r.type==='sea'?'rgba(80,210,236,.62)':'rgba(235,242,249,.42)';
    ctx.stroke();
    ctx.restore();
  }

  function drawTradeTraffic0370(R,cx,cy,now){
    trafficDrawn=0;
    const C=loadLevel(MAX_GAME_LEVEL3233).centers;
    const showDots=zoom>=TRAFFIC_ZOOM;
    const maxRoutes=coarsePointer3255?24:adaptiveDetail3255>=2?30:56;
    const maxDots=coarsePointer3255?50:adaptiveDetail3255>=2?66:126;
    let seen=0;
    ctx.save();

    // Maritime trade routes stay visible as the light-blue dashed line even
    // before zoom 25. This applies equally to player and AI↔AI routes.
    if(zoom>3.15){
      let seaLines=0;
      for(const r of routes){
        if(seaLines>=maxRoutes||r.type!=='sea'||r.status==='closed'||!r.path||!r.path.length||(r.lastFactor||0)<=0)continue;
        const visual=routeVisualPath0371(r);
        if(!routeScreenRelevant0378(visual,C,R,cx,cy))continue;
        drawSeaTradeLine0378(visual,C,R,cx,cy);seaLines++;
      }
    }

    drawFocusedTradeRoute03717(C,R,cx,cy);

    if(!showDots){ctx.restore();return}

    rebuildDomesticTraffic0371(now);
    const domesticCap=coarsePointer3255?100:220;
    for(let i=0;i<Math.min(domesticCap,domesticRoadTraffic0371.length)&&trafficDrawn<maxDots;i++){
      const d=domesticRoadTraffic0371[i],path=d.path;
      if(!path||path.length<2)continue;
      const dots=d.faction===0?(path.length>3?2:1):(path.length>7?2:1);
      for(let k=0;k<dots&&trafficDrawn<maxDots;k++){
        const phase=domesticTravelPhase03710(d,k,now);
        const p=projectedAlongCells0371(path,phase,C,R,cx,cy);
        if(!pointVisible0378(p))continue;
        ctx.beginPath();ctx.arc(p[0],p[1],zoom>32?3.20:2.60,0,Math.PI*2);
        ctx.fillStyle=factionTrafficColor0378(d.faction);ctx.fill();
        ctx.lineWidth=.6;ctx.strokeStyle='rgba(245,250,255,.78)';ctx.stroke();
        trafficDrawn++;
      }
    }

    for(const r of routes){
      if(seen>=maxRoutes||trafficDrawn>=maxDots||r.status==='closed'||!r.path||!r.path.length||(r.lastFactor||0)<=0)continue;
      const visual=routeVisualPath0371(r);
      if(!routeScreenRelevant0378(visual,C,R,cx,cy))continue;
      seen++;
      const intensity=Number.isFinite(r.cargoTotal03720)?r.cargoTotal03720:(r.lastValue||r.baseValue||.2)*1.35;
      const dots=Math.max(1,Math.min(3,Math.round(intensity*1.7)));
      for(let d=0;d<dots&&trafficDrawn<maxDots;d++){
        const faction=routeDotFaction0378(r,d);
        const phase=routeTravelPhase03710(r,d,now,visual.length,faction);
        const p=projectedAlongCells0371(visual,phase,C,R,cx,cy);
        if(!pointVisible0378(p))continue;
        const color=factionTrafficColor0378(faction);
        // Convención visual 0.37.12:
        // todo transporte COMERCIAL es un punto, también en rutas marítimas.
        // El tamaño marítimo sigue siendo algo mayor para conservar legibilidad.
        const rr=r.type==='sea'?(zoom>32?4.40:3.70):(zoom>32?3.20:2.70);
        ctx.beginPath();ctx.arc(p[0],p[1],rr,0,Math.PI*2);
        ctx.fillStyle=color;ctx.fill();
        ctx.lineWidth=.65;
        ctx.strokeStyle=r.type==='sea'?'rgba(2,10,16,.90)':'rgba(245,250,255,.78)';
        ctx.stroke();
        trafficDrawn++;
      }
    }
    ctx.restore();
  }

  const baseDrawFleets0372=drawFleetsSea3261;
  drawFleetsSea3261=function(R,cx,cy,now,C){
    // 0.37.10: una patrulla se mueve, pero su ruta NO se dibuja.
    const changed=[];
    for(const g of navalGroups3270){
      if(g.order!=='patrol'||!Array.isArray(g.route)||!g.route.length)continue;
      changed.push([g,g.route,g.routePos||0]);
      g.route=null;g.routePos=0;
    }
    try{return baseDrawFleets0372.apply(this,arguments)}
    finally{
      for(const [g,route,pos] of changed){g.route=route;g.routePos=pos}
    }
  };

  const baseDrawInfrastructure0370=drawInfrastructure3212;
  drawInfrastructure3212=function(R,cx,cy,now){
    const out=baseDrawInfrastructure0370.apply(this,arguments);
    drawTradeTraffic0370(R,cx,cy,now||performance.now());
    return out;
  };

  const baseRebuildRoads0370=rebuildRoadEdges3212;
  rebuildRoadEdges3212=function(){
    const out=baseRebuildRoads0370.apply(this,arguments);
    lastRoadCampaign=-1e9;domesticTrafficBuiltAt0371=-1e9;domesticTrafficSig0371='';markTradeDirty0370();
    return out;
  };

  if(typeof setDiplomaticRelation3300==='function'){
    const baseSetRelation0370=setDiplomaticRelation3300;
    setDiplomaticRelation3300=function(){
      const out=baseSetRelation0370.apply(this,arguments);
      markTradeDirty0370();return out;
    };
  }

  function serialize0370(){
    return {
      version:2,nextRouteId,permits:[...permits.entries()],
      resources03720:{
        version:1,
        playerNodes:[...resourceNodes03720.values()].filter(n=>n.f===0).map(n=>[n.cell,n.stock.map(x=>Number(x.toFixed(3)))]),
        nationCoverage:resourceNation03720.map(s=>s?s.coverage.map(x=>Number(x.toFixed(4))):null)
      },
      routes:routes.filter(r=>r.status!=='closed').map(r=>({
        id:r.id,type:r.type,a:r.a,b:r.b,from:r.from,to:r.to,path:r.path||[],
        via:r.via||[],distance:r.distance||0,baseValue:r.baseValue||0,navalRisk:r.navalRisk||0,
        mode:r.mode||'legal',status:r.status||'active',created:r.created||0,
        lastIncident:r.lastIncident||-1e9,nextIncident:r.nextIncident||0
      })),
      fleets:navalGroups3270.map(g=>({
        id:g.id,f:g.f,home:Number.isInteger(g.home)?g.home:-1,
        pendingHome0370:Number.isInteger(g.pendingHome0370)?g.pendingHome0370:-1,
        cell:g.cell,strength:g.strength,maxStrength:g.maxStrength,order:g.order,
        targetPort:g.targetPort,escortFleetId:g.escortFleetId
      }))
    };
  }

  function restore0370(data){
    if(!data||typeof data!=='object')return false;
    focusedTradeRoute03717=-1;hideTradeRouteFocusBar03718();
    restoredResources03720=data.resources03720&&typeof data.resources03720==='object'?data.resources03720:null;
    resourceNodes03720=new Map();resourceNation03720=[];resourceComponentCoverage03721=new Map();resourceSig03720='';resourceLastCampaign03720=-1e9;
    permits=new Map(Array.isArray(data.permits)?data.permits:[]);
    routes=[];
    for(const x of data.routes||[]){
      if(!x||!['land','sea'].includes(x.type))continue;
      routes.push({...x,path:Array.isArray(x.path)?x.path:[],needsRebuild:x.type==='land'});
    }
    nextRouteId=Math.max(Number(data.nextRouteId)||1,...routes.map(r=>(r.id||0)+1));
    const byId=new Map(navalGroups3270.map(g=>[g.id,g]));
    for(const x of data.fleets||[]){
      let g=byId.get(x.id);
      if(!g){
        if(x.cell<0||x.cell>=owner6.length)continue;
        g={
          id:x.id,f:x.f,home:-1,cell:x.cell,strength:Math.max(0,Number(x.strength)||1),
          maxStrength:Math.max(1,Number(x.maxStrength)||14),order:x.order||'intercept',
          targetPort:Number.isInteger(x.targetPort)?x.targetPort:-1,targetSea:-1,
          route:null,routePos:0,routeGoal:-1,
          escortFleetId:Number.isInteger(x.escortFleetId)?x.escortFleetId:-1,
          lastRetarget:-1e9,lastBattle:-1e9,lastNotice:-1e9
        };
        navalGroups3270.push(g);byId.set(g.id,g);
      }
      g.home=Number.isInteger(x.home)&&x.home>=0&&ports3212.has(x.home)&&owner6[x.home]===g.f?x.home:-1;
      g.pendingHome0370=Number.isInteger(x.pendingHome0370)&&x.pendingHome0370>=0&&
        ports3212.has(x.pendingHome0370)&&owner6[x.pendingHome0370]===g.f?x.pendingHome0370:-1;
      if(g.home<0&&g.pendingHome0370<0&&(g.order==='return'||g.order==='patrol'))g.order='intercept';
    }
    dirty=true;lastRoadCampaign=-1e9;return true;
  }

  function save0370(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize0370()))}catch(e){}
  }
  function load0370(){
    try{return restore0370(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'))}catch(e){return false}
  }

  const baseSave0370=saveGame3212;
  saveGame3212=function(){
    const out=baseSave0370.apply(this,arguments);save0370();return out;
  };
  const baseLoad0370=loadGame3212;
  loadGame3212=function(){
    const out=baseLoad0370.apply(this,arguments);load0370();
    setTimeout(()=>{lastRoadCampaign=-1e9;markTradeDirty0370()},0);
    return out;
  };
  const baseReset0370=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset0370.apply(this,arguments);
    focusedTradeRoute03717=-1;hideTradeRouteFocusBar03718();
    resourceNodes03720=new Map();resourceNation03720=[];resourceComponentCoverage03721=new Map();resourceSig03720='';resourceLastCampaign03720=-1e9;restoredResources03720=null;
    routes=[];permits.clear();nextRouteId=1;dirty=true;lastRoadCampaign=-1e9;
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(e){}
    return out;
  };

  if(typeof buildPortableFile3275==='function'){
    const basePortableBuild0370=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=basePortableBuild0370.apply(this,arguments);
      file.gameVersion='0.37.2';file.payload.tradeLogistics0370=serialize0370();
      if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const basePortableApply0370=applyPortableFile3275;
    applyPortableFile3275=function(file){
      restoredPortable=file&&file.payload&&file.payload.tradeLogistics0370||null;
      const out=basePortableApply0370.apply(this,arguments);
      if(restoredPortable)restore0370(restoredPortable);
      save0370();return out;
    };
  }

  function routeOperationalSupply03713(r){
    return !!r&&r.type==='sea'&&r.a===r.b&&r.status!=='closed'&&
      r.status!=='broken'&&r.status!=='blocked'&&r.status!=='suspended';
  }

  function domesticSeaSupplyNetwork03713(){
    rebuildRoadGraph0370(false);
    const cached=domesticSeaSupplyCache03713;
    if(cached&&cached.roadEpoch===roadEpoch&&cached.revision===tradeRevision03713)return cached;

    const endpoints=Array.from({length:FACTIONS3230.length},()=>new Set());
    const componentsByFaction=Array.from({length:FACTIONS3230.length},()=>new Set());
    let activeRoutes=0;
    for(const r of routes){
      if(!routeOperationalSupply03713(r))continue;
      const f=r.a;
      if(f<0||f>=activeFactionCount3230||!ports3212.has(r.from)||!ports3212.has(r.to))continue;
      if(owner6[r.from]!==f||owner6[r.to]!==f)continue;
      endpoints[f].add(r.from);endpoints[f].add(r.to);
      const cf=roadComp&&r.from<roadComp.length?roadComp[r.from]:-1;
      const ct=roadComp&&r.to<roadComp.length?roadComp[r.to]:-1;
      if(cf>=0)componentsByFaction[f].add(cf);
      if(ct>=0)componentsByFaction[f].add(ct);
      activeRoutes++;
    }
    domesticSeaSupplyCache03713={roadEpoch,revision:tradeRevision03713,endpoints,componentsByFaction,activeRoutes};
    return domesticSeaSupplyCache03713;
  }

  function domesticSeaSupplyFloor03713(f,cell){
    f=Number(f);cell=Number(cell);
    if(!Number.isInteger(f)||!Number.isInteger(cell)||f<0||cell<0||owner6[cell]!==f)return 0;
    const net=domesticSeaSupplyNetwork03713();
    if(net.endpoints[f]?.has(cell))return 64;
    const comp=roadComp&&cell<roadComp.length?roadComp[cell]:-1;
    return comp>=0&&net.componentsByFaction[f]?.has(comp)?58:0;
  }

  // Una ruta marítima interior funciona como puente logístico real:
  // abastece el puerto remoto y su red viaria local, por ejemplo una isla.
  if(typeof economyStructureSupply3261==='function'){
    const baseEconomyStructureSupply03713=economyStructureSupply3261;
    economyStructureSupply3261=function(f,cell){
      const base=Number(baseEconomyStructureSupply03713.apply(this,arguments))||0;
      return Math.max(base,domesticSeaSupplyFloor03713(f,cell));
    };
  }

  function stats0370(){
    rebuildTradeCache0370(false);
    return {
      build:BUILD,
      routes:routes.filter(r=>r.status!=='closed').length,
      sea:routes.filter(r=>r.type==='sea'&&r.status!=='closed').length,
      land:routes.filter(r=>r.type==='land'&&r.status!=='closed').length,
      permits:permits.size,
      playerIncome:Number((tradeCache[0]||0).toFixed(2)),
      goods:Math.round(goodsCache[0]||0),
      performance:{
        lastTickMs:Number(lastTickMs.toFixed(2)),
        resourceTickMs:Number(resourceTickMs03720.toFixed(2)),
        geoRefreshMs:Number(geoRefreshMs0384.toFixed(2)),
        geoRefreshedNodes:geoRefreshedNodes0384,
        roadBuildMs:Number(roadBuildMs.toFixed(2)),
        routeEvals,seaSearches,trafficDrawn
      }
    };
  }

  function validate0370(){
    const errors=[],warnings=[],st=stats0370();
    for(const g of navalGroups3270){
      if(g.home>=0&&(!ports3212.has(g.home)||owner6[g.home]!==g.f))
        errors.push('flota '+g.id+' con base inválida');
    }
    if(st.routes>MAX_ROUTES)errors.push('límite de rutas superado');
    if(st.performance.lastTickMs>28)warnings.push('tick comercial alto: '+st.performance.lastTickMs+' ms');
    if(st.performance.roadBuildMs>35)warnings.push('rebuild terrestre alto: '+st.performance.roadBuildMs+' ms');
    return {ok:errors.length===0,errors,warnings,stats:st};
  }

  window.HexategosTradeLogistics0370={
    version:BUILD,stats:stats0370,validate:validate0370,
    routes:()=>routes,
    focusedRoute:()=>focusedTradeRoute03717,
    focusRoute:(id)=>focusTradeRoute03717(Number(id)),
    resourceKeys:()=>RESOURCE_KEYS03720.slice(),
    resourceSummary:(f=0)=>resourceSummary03720(Number(f)),
    geography:(cell)=>terrainResourceProfile0382(Number(cell)),
    urbanWeight:(cell)=>{
      const c=Number(cell),f=owner6[c];
      return urbanWeight0382(c,f,cities3212.has(c)?Math.max(1,cityLevel3230[c]||1):0,industries3212.has(c)?Math.max(1,industryLevel3230[c]||1):0,ports3212.has(c)?1:0,capitals[f]===c?1:0);
    },
    materialSupply:(cell)=>materialSupplyDetail03721(Number(cell)),
    supplyDiagnosis:(cell)=>supplyDiagnosis03722(Number(cell)),
    combinedSupply:(cell)=>supplyPct3220(Number(cell)),
    resourceNode:(cell)=>{
      ensureResourceNodes03720(false);
      const n=resourceNodes03720.get(Number(cell));
      return n?{cell:n.cell,f:n.f,kind:n.kind,stock:n.stock.slice(),cap:n.cap.slice(),demand:n.demand.slice(),prod:n.prod.slice(),urbanWeight:n.urbanWeight||0,geo:n.geo?{...n.geo}:null}:null;
    },
    domesticSeaSupply:(f,cell)=>domesticSeaSupplyFloor03713(Number(f),Number(cell)),
    roadComponent:(cell)=>{rebuildRoadGraph0370(false);return Number.isInteger(cell)&&cell>=0&&roadComp&&cell<roadComp.length?roadComp[cell]:-1},
    visualSpeed:(kind,faction)=>({
      cellsPerSecond:(kind==='sea'?SEA_TRADE_CELLS_PER_SECOND:LAND_TRADE_CELLS_PER_SECOND)*
        tradeSpeedMultiplier03710(kind,Number(faction)||0),
      multiplier:tradeSpeedMultiplier03710(kind,Number(faction)||0)
    }),
    ensureLandRoute:(a,b)=>{
      a=Number(a);b=Number(b);
      if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a===b)return null;
      if(!tradeRelation0370(a,b))return null;
      rebuildRoadGraph0370(true);
      pathBudget0370=Math.max(pathBudget0370,1);
      return createLandRoute0370(a,b);
    },
    requestTransit:(a,b,via)=>requestTransit0370('land',Number(a),Number(b),Number(via),false),
    hasTransit:(a,b,via)=>hasTransitPermit0370('land',Number(a),Number(b),Number(via)),
    enableSmuggling:(a,b)=>{
      a=Number(a);b=Number(b);
      let r=routes.find(x=>x.type==='land'&&x.status!=='closed'&&
        ((x.a===a&&x.b===b)||(x.a===b&&x.b===a)));
      if(!r){
        rebuildRoadGraph0370(true);pathBudget0370=Math.max(pathBudget0370,1);
        r=createLandRoute0370(a,b);
      }
      if(!r)return null;
      r.mode='smuggle';r.status='smuggling';markTradeDirty0370();return r;
    },
    patrolCycle:(id)=>{
      const g=navalGroups3270.find(x=>x.id===Number(id));
      return g?{home:g.home,cell:g.cell,order:g.order,route:Array.isArray(g.route)?g.route.slice():[],homeSea:g._patrolHomeSea03719??-1,cycle:g._patrolCycle03719||0}:null;
    },
    refresh:()=>{lastRoadCampaign=-1e9;markTradeDirty0370();rebuildTradeCache0370(true)}
  };
  window.HEXATEGOS_VERSION=BUILD;

  setInterval(tradeTick0370,TRADE_TICK_MS);
  console.info('[HEXATEGOS] 0.37.24 · INFORMACIÓN enlazada al diagnóstico completo de suministro');
})();
