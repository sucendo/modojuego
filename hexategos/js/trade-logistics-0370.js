'use strict';

(() => {
  const BUILD='0.37.2';
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
    // El motor diplomático actual guarda un único estado por pareja.
    // NO AGRESIÓN y ALIANZA son tratados cooperativos superiores: conservan
    // los derechos comerciales ya implícitos en la relación.
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
    for(const o of diplomaticTargets0370(f)){
      const rel=diplomaticRelation3300(f,o);
      if(rel===1)trade++;
      else if(rel===3){trade++;allies++}
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
      const k=routeFactor0370(r),value=(r.baseValue||0)*k,share=value*.56;
      r.lastFactor=k;r.lastValue=value;routeEvals++;
      if(k<=0)continue;
      if(r.a<activeFactionCount3230){tradeCache[r.a]+=share;goodsCache[r.a]+=value*9.5}
      if(r.b<activeFactionCount3230){tradeCache[r.b]+=share;goodsCache[r.b]+=value*9.5}
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

  function beginSeaTradeMapPick03714(from){
    if(from<0||!ports3212.has(from)||owner6[from]!==0){
      toast('Selecciona uno de tus puertos');return false;
    }
    if(!seaCandidates0370(from).length){
      toast('No hay puertos compatibles para abrir una ruta comercial');return false;
    }
    if(typeof closeModal3244==='function')closeModal3244();
    setInteractionMode3244('select_trade_route_target',from,'sea_trade_0370');
    interactionText3244.textContent='Ruta comercial · selecciona un puerto de destino';
    return true;
  }

  const baseHandleInteractionTarget03714=handleInteractionTarget3244;
  handleInteractionTarget3244=function(cell){
    if(uiInteractionState3244.interactionMode!=='select_trade_route_target')
      return baseHandleInteractionTarget03714.apply(this,arguments);

    const from=uiInteractionState3244.sourceCell;
    const reason=seaTradeTargetReason03711(from,cell);
    if(reason){
      interactionText3244.textContent='Ruta comercial · '+reason;
      toast(reason);
      return;
    }
    const r=createPlayerSeaRoute0370(from,cell);
    if(!r){
      interactionText3244.textContent='Ruta comercial · no se pudo abrir esa ruta';
      return;
    }
    cancelInteractionMode3244();
    toast('Ruta comercial creada · '+placeDisplayName3271(from)+' → '+placeDisplayName3271(cell));
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
    r.status='closed';markTradeDirty0370();saveGame3212();renderSystems3220();needsRender=true;
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
    pickSeaOnMap:beginSeaTradeMapPick03714,
    createSea:createPlayerSeaRoute0370,
    rebase:rebaseFleet0370,
    closeRoute:closeRoute0370,
    requestTransit:requestRouteTransit0370,
    smuggle:enableSmuggling0370
  };

  const baseClassicActions0370=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const a=baseClassicActions0370(ctx);
    if(ctx&&ctx.kind==='cell'&&ctx.own&&ctx.port){
      const tr=a.find(x=>x.id==='transport');
      if(tr){tr.label='TRANSPORTE';tr.sub=tr.enabled?'TROPAS · ELIGE COSTA':tr.sub}
      let at=a.findIndex(x=>x.id==='transport');if(at<0)at=0;
      const canFleet=gold3212>=NAVAL_BUILD_COST3270;
      a.splice(at+1,0,
        classicAction3246('naval_build_0370','CONSTRUIR FLOTA','⚓',canFleet?NAVAL_BUILD_COST3270+' ORO':'NECESITA '+NAVAL_BUILD_COST3270+' ORO',canFleet,'good3244'),
        classicAction3246('sea_trade_0370','RUTA COMERCIAL','⇄',seaCandidates0370(ctx.cell).length?'ELIGE EN MAPA':'SIN SOCIO / PUERTO',seaCandidates0370(ctx.cell).length>0,'')
      );
    }
    return a;
  };

  const baseContextAction0370=handleContextAction3244;
  handleContextAction3244=function(id){
    if(id==='naval_build_0370'||id==='sea_trade_0370'){
      const ctx=uiInteractionState3244.contextData;
      if(!ctx||ctx.kind!=='cell'||!ctx.own||!ctx.port)return;
      closeContextDialog3244();
      if(id==='naval_build_0370')buildNavalGroup3270(0,ctx.cell,true);
      else beginSeaTradeMapPick03714(ctx.cell);
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
    if(g){g.interceptPhase0371=null;g.interceptReturn0371=null;g.interceptEnemyPort0371=-1}
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

  function buildLocalPatrolRoute0371(g,nowCampaign){
    if(!g||g.home<0)return false;
    const homeSea=bestPortSea3270(g.home,g.cell);
    if(homeSea<0)return false;
    const L=loadLevel(MAX_GAME_LEVEL3233),route=[g.cell],seed=(g.id*1103515245+Math.floor(nowCampaign/4)*12345)>>>0;
    let u=g.cell,prev=-1;
    for(let step=0;step<7;step++){
      const opts=[];
      for(let k=L.offsets[u];k<L.offsets[u+1];k++){
        const v=L.edgeNbr[k];if(v<0||L.land[v]>=0||v===prev)continue;
        opts.push(v);
      }
      if(!opts.length)break;
      opts.sort((a,b)=>angularHeuristic3254(a,homeSea)-angularHeuristic3254(b,homeSea));
      let pick;
      if(step<3)pick=opts[Math.min(opts.length-1,Math.floor(opts.length*.55)+((seed>>>step)%Math.max(1,Math.ceil(opts.length*.45))))];
      else pick=opts[(seed+step)%Math.min(opts.length,Math.max(1,Math.ceil(opts.length*.55)))];
      prev=u;u=pick;route.push(u);
    }
    for(let step=0;step<10&&u!==homeSea;step++){
      let best=-1,bestD=1e9;
      for(let k=L.offsets[u];k<L.offsets[u+1];k++){
        const v=L.edgeNbr[k];if(v<0||L.land[v]>=0)continue;
        const d=angularHeuristic3254(v,homeSea);
        if(d<bestD){bestD=d;best=v}
      }
      if(best<0||best===u)break;
      u=best;route.push(u);
    }
    if(route.length<3)return false;
    g.route=route;g.routePos=0;g.routeGoal=homeSea;
    g.patrolNext0371=nowCampaign+4+(g.id%4);
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
      if(!g.route&&nowCampaign>=(g.patrolNext0371||0))buildLocalPatrolRoute0371(g,nowCampaign);
      return;
    }
    if(g.order==='patrol'){
      const homeSea=bestPortSea3270(g.home,g.cell);
      if(homeSea>=0&&angularHeuristic3254(g.cell,homeSea)>10){
        if(navalPathPermit0371(nowCampaign))setNavalDestination3270(g,homeSea);
        return;
      }
      if(!g.route&&nowCampaign>=(g.patrolNext0371||0))buildLocalPatrolRoute0371(g,nowCampaign);
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
          '<div class="acts">'+(missingPermits0370(r).length?'<button onclick="HexategosTradeActions0370.requestTransit('+r.id+')">Solicitar permisos</button>':'')+
          '<button class="warn" onclick="HexategosTradeActions0370.closeRoute('+r.id+')">Cerrar ruta</button></div></div>';
      }
      html+='</div></div>';
    }
    c.innerHTML=html;
  };

  const baseRenderSystems0370=renderSystems3220;
  renderSystems3220=function(){
    baseRenderSystems0370();
    if(sysTab3220!=='eco')return;
    rebuildTradeCache0370(false);
    const c=document.getElementById('sysContent3213');if(!c)return;
    const own=routes.filter(r=>(r.a===0||r.b===0)&&r.status!=='closed');
    const residual=residualTrade0370(0);
    let html='<div class="sysBlock3213"><b>⇄ Comercio físico · v0.37.2</b>'+
      '<div class="sysMeta3213">Las relaciones comerciales sin infraestructura generan solo +'+residual.toFixed(2)+'/s. El ingreso importante exige carreteras conectadas o rutas marítimas entre puertos.</div>'+
      '<div class="econGrid3261"><span>Rutas activas / registradas</span><b>'+own.filter(r=>(r.lastFactor||0)>0).length+' / '+own.length+'</b>'+
      '<span>Flujo de mercancías</span><b>'+Math.round(goodsCache[0]||0)+'</b>'+
      '<span>Ingreso comercial</span><b>+'+(tradeCache[0]||0).toFixed(2)+'/s</b></div>';
    if(own.length){
      html+='<div class="tradeRoutes0370">';
      for(const r of own.slice(0,12)){
        const miss=missingPermits0370(r);
        html+='<div class="tradeRoute0370"><b>'+(r.type==='sea'?'Marítima':'Terrestre')+' · '+(r.a===r.b?'Comercio interior':escapeHtml3271(factionName3230(r.a===0?r.b:r.a)))+'</b>'+
          '<span>'+routeStatusName0370(r)+' · +'+(r.lastValue||0).toFixed(2)+'/s</span>'+
          (r.via&&r.via.length?'<small>Tránsito: '+r.via.map(factionName3230).join(', ')+'</small>':'')+
          '<div class="acts">'+(miss.length?'<button onclick="HexategosTradeActions0370.requestTransit('+r.id+')">Solicitar tránsito</button>':'')+
          (r.type==='land'&&miss.length&&r.mode!=='smuggle'?'<button class="warn" onclick="HexategosTradeActions0370.smuggle('+r.id+')">Abrir contrabando</button>':'')+
          '<button onclick="HexategosTradeActions0370.closeRoute('+r.id+')">Cerrar</button></div></div>';
      }
      html+='</div>';
    }else{
      html+='<div class="sysMeta3213">Todavía no hay rutas físicas. Une carreteras con un socio o abre una ruta desde un puerto.</div>';
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
      const dots=Math.max(1,Math.min(3,Math.round((r.lastValue||r.baseValue||.2)*1.35)));
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
      version:1,nextRouteId,permits:[...permits.entries()],
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
    refresh:()=>{lastRoadCampaign=-1e9;markTradeDirty0370();rebuildTradeCache0370(true)}
  };
  window.HEXATEGOS_VERSION=BUILD;

  setInterval(tradeTick0370,TRADE_TICK_MS);
  console.info('[HEXATEGOS] 0.37.2 · tráfico terrestre visible, carreteras finas y patrulla naval local');
})();
