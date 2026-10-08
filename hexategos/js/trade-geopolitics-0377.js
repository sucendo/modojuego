'use strict';

// HEXATEGOS 0.37.7 · CORREDORES COMERCIALES GEOPOLÍTICOS.
// El comercio exterior genera decisiones territoriales reales:
// espacio neutral -> expansión; tercer país -> permiso de tránsito;
// negativa -> alternativa, contrabando, tensión y posible guerra.
(() => {
  const BUILD='0.37.7';
  const SAVE_KEY='hexategos-trade-geopolitics-0377';
  const SERVICE_SECONDS=17;
  const NEIGHBOR_CACHE_SECONDS=22;
  const MAX_STATE_DEPTH=5;
  const MAX_PARTNERS_CHECKED=5;

  const nextService=new Float64Array(FACTIONS3230.length);
  const refusal=new Map();
  const neighborCache=new Map();
  let neutralExpansions=0,transitRequests=0,transitGranted=0,transitDenied=0;
  let alternatives=0,smugglingAttempts=0,tensions=0,corridorWars=0,corridorRoads=0;

  const pairKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
  const refusalKey=(a,b,v)=>pairKey(a,b)+'|'+v;

  function cooperative0377(a,b){
    const api=window.HexategosStatecraft0380;
    if(api?.canTrade)return !!api.canTrade(a,b);
    const r=diplomaticRelation3300(a,b);
    return r===1||r===2||r===3;
  }

  function hasLandRoute0377(a,b){
    const routes=window.HexategosTradeLogistics0370?.routes?.()||[];
    return routes.find(r=>r.type==='land'&&r.status!=='closed'&&
      ((r.a===a&&r.b===b)||(r.a===b&&r.b===a)))||null;
  }

  function tradePartners0377(f){
    const out=new Set();
    const net=window.HexategosDiplomacyNetwork3301;
    try{
      const arr=net?.targetsRef?net.targetsRef(f):net?.targets?net.targets(f):null;
      if(arr)for(const o of arr)if(o>0&&o!==f&&cooperative0377(f,o))out.add(o);
    }catch(_){}
    // Fallback acotado: relaciones cooperativas conocidas.
    if(!out.size){
      for(let o=1;o<activeFactionCount3230;o++){
        if(o!==f&&cooperative0377(f,o))out.add(o);
        if(out.size>=14)break;
      }
    }
    return [...out];
  }

  function stateNeighbors0377(f){
    const now=campaignSeconds3230||0,old=neighborCache.get(f);
    if(old&&now-old.t<NEIGHBOR_CACHE_SECONDS)return old.set;
    const set=new Set(),snap=aiSnapshot3260,L=loadLevel(MAX_GAME_LEVEL3233);
    const frontier=snap?.frontier?.[f]||[];
    for(const c of frontier){
      if(owner6[c]!==f)continue;
      for(let k=L.offsets[c];k<L.offsets[c+1];k++){
        const n=L.edgeNbr[k],o=n>=0?owner6[n]:-1;
        if(o>0&&o!==f)set.add(o); // 0 nunca se usa como tránsito automático IA
      }
    }
    neighborCache.set(f,{t:now,set});
    return set;
  }

  function countryPath0377(a,b,excluded=new Set()){
    if(a===b)return [a];
    const prev=new Map([[a,-1]]),depth=new Map([[a,0]]),q=[a];
    for(let h=0;h<q.length;h++){
      const u=q[h],d=depth.get(u)||0;
      if(d>=MAX_STATE_DEPTH)continue;
      for(const v of stateNeighbors0377(u)){
        if(v===0||excluded.has(v)||prev.has(v))continue;
        prev.set(v,u);depth.set(v,d+1);
        if(v===b){
          const path=[];let x=b;
          while(x>=0){path.push(x);x=prev.get(x)}
          return path.reverse();
        }
        q.push(v);
      }
    }
    return null;
  }

  function borderPair0377(a,b){
    const snap=aiSnapshot3260,L=loadLevel(MAX_GAME_LEVEL3233),frontier=snap?.frontier?.[a]||[];
    let best=null,bestScore=1e9;
    const ca=capitals[a],cb=capitals[b];
    for(const c of frontier){
      if(owner6[c]!==a)continue;
      for(let k=L.offsets[c];k<L.offsets[c+1];k++){
        const n=L.edgeNbr[k];if(n<0||owner6[n]!==b)continue;
        let score=0;
        if(ca>=0)score+=angularHeuristic3254(c,ca)*.35;
        if(cb>=0)score+=angularHeuristic3254(n,cb)*.35;
        if(aiRoadDegree3260(c)>0)score-=18;
        if(aiRoadDegree3260(n)>0)score-=18;
        score+=((Math.min(c,n)*37+Math.max(c,n)*19)%991)*.0001;
        if(score<bestScore){bestScore=score;best={a:c,b:n}}
      }
    }
    return best;
  }

  function roadCell0377(c){return c>=0&&aiRoadDegree3260(c)>0}

  function nearestInfrastructure0377(f,target){
    const snap=aiSnapshot3260,out=[],seen=new Set();
    const add=c=>{if(Number.isInteger(c)&&c>=0&&owner6[c]===f&&!seen.has(c)){seen.add(c);out.push(c)}};
    add(capitals[f]);
    for(const c of snap?.cities?.[f]||[])add(c);
    for(const c of snap?.industries?.[f]||[])add(c);
    for(const c of snap?.ports?.[f]||[])add(c);
    let best=-1,bestScore=1e9;
    for(const c of out){
      if(c===target)return c;
      let s=angularHeuristic3254(c,target);
      if(roadCell0377(c))s-=15;
      if(c===capitals[f])s-=2;
      if(s<bestScore){bestScore=s;best=c}
    }
    return best;
  }

  function samePhysicalComponent0377(a,b){
    if(a===b)return true;
    const api=window.HexategosTradeLogistics0370;
    if(!api?.roadComponent||!roadCell0377(a)||!roadCell0377(b))return false;
    const ca=api.roadComponent(a),cb=api.roadComponent(b);
    return ca>=0&&ca===cb;
  }

  function buildRoad0377(owner,source,target,payer,reason){
    if(owner<=0||payer<=0||source<0||target<0||owner6[source]!==owner||owner6[target]!==owner)return false;
    if(source===target)return roadCell0377(target);
    const path=findOwnedStrategicPath3275(owner,source,target);
    if(!path||path.length<2||path.length>190||path.some(c=>owner6[c]!==owner))return false;
    let fresh=0;
    for(let i=1;i<path.length;i++)if(!roadEdgeSet3212.has(edgeKey3212(path[i-1],path[i])))fresh++;
    if(fresh<1)return true;
    const cost=Math.max(12,Math.round(fresh*3));
    const reserve=payer===owner?26:38;
    if(botGold3230[payer]-cost<reserve)return false;
    botGold3230[payer]-=cost;
    roads3212.push(path);rebuildRoadEdges3212();
    markEconomyDirty3261();aiMarkDirty3260();supplyDirty3220=true;
    window.HexategosTradeLogistics0370?.refresh?.();
    corridorRoads++;
    const st=aiDevState3283?.[owner];
    if(st){st.lastBuild=campaignSeconds3230;st.lastCell=target;st.nextAction='ROAD';st.reason=reason}
    return true;
  }

  function bestNeutralStep0377(f,targetFaction){
    const cap=capitals[targetFaction];if(cap<0)return null;
    const snap=aiSnapshot3260,L=loadLevel(MAX_GAME_LEVEL3233),frontier=snap?.frontier?.[f]||[];
    let best=null,bestScore=1e9;
    for(const src of frontier){
      if(owner6[src]!==f)continue;
      const base=angularHeuristic3254(src,cap);
      for(let k=L.offsets[src];k<L.offsets[src+1];k++){
        const n=L.edgeNbr[k];
        if(n<0||L.land[n]<0||owner6[n]>=0)continue;
        const d=angularHeuristic3254(n,cap);
        if(d>base+1.2)continue;
        let score=d-(roadCell0377(src)?13:0);
        if(terrainKey3250(n)==='highmountain')score+=8;
        else if(terrainKey3250(n)==='mountain')score+=3;
        // Recurso cercano y escaso = incentivo económico, sin eliminar
        // continuidad terrestre, pendiente ni coste de carreteras.
        score-=Math.min(5,window.HexategosResourceStrategy0383?.priority?.(f,n)||0);
        if(score<bestScore){bestScore=score;best={src,target:n,score,progress:base-d}}
      }
    }
    return best;
  }

  function expandNeutral0377(f,step){
    if(!step||owner6[step.src]!==f||owner6[step.target]>=0)return false;
    const tp=terrainProfile3250(step.target);
    const cost=.7*(1+Math.max(0,1-tp.move)*.22);
    if(troops3230[f]<Math.max(6,cost+3))return false;
    troops3230[f]-=cost;
    const chance=Math.max(.72,.90-Math.max(0,1-tp.move)*.055);
    if(Math.random()>chance)return false;
    owner6[step.target]=f;forts3212[step.target]=0;
    cacheDirty=true;supplyDirty3220=true;aiSnapshotDirty3260=true;
    markEconomyDirty3261();aiMarkDirty3260();markEncirclementDirty3254?.();
    neighborCache.clear();
    // La conquista comercial intenta prolongar la carretera con el avance.
    if(!step.noRoad&&roadCell0377(step.src)&&botGold3230[f]>=12){
      botGold3230[f]-=12;roads3212.push([step.src,step.target]);rebuildRoadEdges3212();
      corridorRoads++;
    }
    neutralExpansions++;needsRender=true;
    return true;
  }

  function gateways0377(path){
    const out=[];
    for(let i=0;i<path.length-1;i++){
      const p=borderPair0377(path[i],path[i+1]);
      if(!p)return null;
      out.push({leftState:path[i],rightState:path[i+1],left:p.a,right:p.b});
    }
    return out;
  }

  function authorizePath0377(a,b,path){
    const api=window.HexategosTradeLogistics0370;
    if(!api?.requestTransit)return {ok:false,denied:path[1]||-1};
    for(const via of path.slice(1,-1)){
      transitRequests++;
      if(api.requestTransit(a,b,via)){transitGranted++;continue}
      transitDenied++;
      const k=refusalKey(a,b,via);
      refusal.set(k,(refusal.get(k)||0)+1);
      return {ok:false,denied:via,count:refusal.get(k)};
    }
    return {ok:true,denied:-1,count:0};
  }

  function advanceLegalCorridor0377(a,b,path){
    const g=gateways0377(path);if(!g)return false;
    const border=window.HexategosBorderRoad0376;
    if(!border)return false;

    // Un único trabajo físico por servicio.
    const first=g[0].left;
    if(!roadCell0377(first)){
      const src=nearestInfrastructure0377(a,first);
      return buildRoad0377(a,src,first,a,'corredor comercial hacia '+factionName3230(b));
    }
    const last=g[g.length-1].right;
    if(!roadCell0377(last)){
      const src=nearestInfrastructure0377(b,last);
      return buildRoad0377(b,src,last,b,'corredor comercial hacia '+factionName3230(a));
    }

    for(let i=1;i<path.length-1;i++){
      const via=path[i],entry=g[i-1].right,exit=g[i].left;
      if(!samePhysicalComponent0377(entry,exit)){
        return buildRoad0377(via,entry,exit,a,'corredor de tránsito internacional');
      }
    }

    // Después de tener carreteras en todos los países se construyen las aduanas,
    // también de una en una para no concentrar coste/cálculo.
    for(let i=0;i<g.length;i++){
      const x=g[i];
      if(border.hasLink?.(x.left,x.right))continue;
      const direct=path.length===2;
      const ok=direct
        ?border.createAI?.(x.left,x.right,x.leftState,x.rightState)
        :border.createTransitAI?.(x.left,x.right,a);
      if(ok)return true;
      return false;
    }

    const route=window.HexategosTradeLogistics0370?.ensureLandRoute?.(a,b);
    return !!route;
  }

  function canSmuggle0377(a,b,path){
    const g=gateways0377(path);if(!g)return null;
    // Contrabando solo reutiliza infraestructura YA existente: no construye
    // una autopista clandestina atravesando un tercer Estado.
    if(!roadCell0377(g[0].left)||!roadCell0377(g[g.length-1].right))return null;
    for(let i=1;i<path.length-1;i++){
      if(!samePhysicalComponent0377(g[i-1].right,g[i].left))return null;
    }
    for(const x of g)if(!roadCell0377(x.left)||!roadCell0377(x.right))return null;
    return g;
  }

  function trySmuggling0377(a,b,path){
    const g=canSmuggle0377(a,b,path);if(!g)return false;
    const border=window.HexategosBorderRoad0376;
    if(!border?.createClandestineAI)return false;
    smugglingAttempts++;
    for(const x of g){
      if(border.hasLink?.(x.left,x.right))continue;
      if(!border.createClandestineAI(x.left,x.right,a))return false;
      return true; // una frontera clandestina por servicio
    }
    const r=window.HexategosTradeLogistics0370?.enableSmuggling?.(a,b);
    return !!r;
  }

  function applyTension0377(a,via,count){
    if(via<=0||a<=0)return;
    const oa=typeof dipOpinionOf3300==='function'?dipOpinionOf3300(a,via):0;
    const ov=typeof dipOpinionOf3300==='function'?dipOpinionOf3300(via,a):0;
    const ta=typeof dipTrustOf3300==='function'?dipTrustOf3300(a,via):50;
    if(typeof dipSetOpinion3300==='function'){
      dipSetOpinion3300(a,via,oa-(3+count));
      dipSetOpinion3300(via,a,ov-2);
    }
    if(typeof dipSetTrust3300==='function')dipSetTrust3300(a,via,ta-2.5);
    if(typeof saveDiplomacy3300==='function')saveDiplomacy3300();
    tensions++;
  }

  function maybeEscalateWar0377(a,via,count){
    if(a<=0||via<=0||count<4||diplomaticRelation3300(a,via)===-1)return false;
    const fac=FACTIONS3230[a],role=fac?.role||'balanced';
    const mindset=window.HexategosNationAI0360?.mindset?.(a)||'';
    const hawkish=role==='aggressive'||mindset==='opportunist'||(fac?.aggr||0)>.70;
    if(!hawkish)return false;
    const ownPower=typeof dipPower3300==='function'?dipPower3300(a):(troops3230[a]||0);
    const otherPower=typeof dipPower3300==='function'?dipPower3300(via):(troops3230[via]||1);
    if(ownPower/Math.max(1,otherPower)<1.08||troops3230[a]<45)return false;
    const rel=diplomaticRelation3300(a,via);
    if(count===4&&rel>0){
      setDiplomaticRelation3300(a,via,0,'tensión por corredor comercial denegado',false);
      return true;
    }
    if(count>=5&&diplomaticRelation3300(a,via)===0){
      setDiplomaticRelation3300(a,via,-1,'crisis por acceso al corredor comercial',false);
      corridorWars++;return true;
    }
    return false;
  }

  function handleDenied0377(a,b,via,count,path){
    applyTension0377(a,via,count);

    // 1) Busca primero un rodeo geopolítico.
    const alt=countryPath0377(a,b,new Set([via]));
    if(alt&&alt.length>=2){
      const auth=authorizePath0377(a,b,alt);
      if(auth.ok){alternatives++;return advanceLegalCorridor0377(a,b,alt)}
    }

    // 2) Personalidades oportunistas pueden aprovechar carreteras ya existentes.
    const role=FACTIONS3230[a]?.role||'balanced';
    const mindset=window.HexategosNationAI0360?.mindset?.(a)||'';
    if(count>=2&&(mindset==='opportunist'||role==='aggressive')){
      if(trySmuggling0377(a,b,path))return true;
    }

    // 3) Si el bloqueo persiste puede escalar diplomáticamente y, muy tarde,
    // desembocar en guerra. Nunca se declara guerra automática al jugador aquí.
    return maybeEscalateWar0377(a,via,count);
  }

  function chooseProject0377(f){
    const partners=tradePartners0377(f).filter(o=>o>f).slice(0,MAX_PARTNERS_CHECKED);
    if(!partners.length)return null;
    let best=null,bestScore=1e9;
    for(const o of partners){
      const r=hasLandRoute0377(f,o);
      if(r&&(r.status==='active'||r.status==='smuggling'))continue;
      const cf=capitals[f],co=capitals[o];
      const d=cf>=0&&co>=0?angularHeuristic3254(cf,co):99;
      const importValue=window.HexategosResourceStrategy0383?.tradeOpportunity?.(f,o)||0;
      const score=d+(r?.status==='blocked'?-18:0)-importValue*2.7;
      if(score<bestScore){bestScore=score;best={a:f,b:o,route:r,importValue}}
    }
    return best;
  }

  function serviceProject0377(f){
    const now=campaignSeconds3230||0;
    if(now<nextService[f])return false;
    nextService[f]=now+SERVICE_SECONDS+(f%7)*1.35;
    if(f<=0||f>=activeFactionCount3230||!started3230)return false;

    // Aunque la ruta comercial ya exista, la IA sigue consolidando poco a poco
    // el terreno neutral inmediatamente adyacente a su trazado real.
    const activeBelt03711=window.HexategosEconomicCorridors0379?.activeRoutePlan?.(f)||null;
    if(activeBelt03711?.done)return true;
    if(activeBelt03711?.step)return expandNeutral0377(f,activeBelt03711.step);

    const p=chooseProject0377(f);if(!p)return false;
    const a=p.a,b=p.b;

    // Ruta ya creada pero bloqueada por terceros: trabaja directamente sobre
    // los permisos que figuran en la propia ruta.
    if(p.route&&p.route.status==='blocked'&&Array.isArray(p.route.via)&&p.route.via.length){
      for(const via of p.route.via){
        if(window.HexategosTradeLogistics0370?.hasTransit?.(a,b,via))continue;
        transitRequests++;
        if(window.HexategosTradeLogistics0370?.requestTransit?.(a,b,via)){
          transitGranted++;window.HexategosTradeLogistics0370.refresh?.();return true;
        }
        transitDenied++;
        const k=refusalKey(a,b,via),n=(refusal.get(k)||0)+1;refusal.set(k,n);
        return handleDenied0377(a,b,via,n,[a,via,b]);
      }
    }

    // Si existe espacio neutral en dirección razonable, la IA prefiere ocuparlo
    // antes que exigir tránsito por un país ajeno.
    const sa=bestNeutralStep0377(a,b),sb=bestNeutralStep0377(b,a);

    // 0.37.9 puede dedicar este microturno a consolidar lateralmente el eje
    // o a crear un nodo económico sobre una carretera ya conquistada.
    const economicPlan0379=window.HexategosEconomicCorridors0379?.prepare?.(a,b,sa,sb)||null;
    if(economicPlan0379?.done)return true;
    if(economicPlan0379?.step?.s)return expandNeutral0377(economicPlan0379.step.f,economicPlan0379.step.s);

    const step=sa&&sb?(sa.score<=sb.score?{f:a,s:sa}:{f:b,s:sb}):sa?{f:a,s:sa}:sb?{f:b,s:sb}:null;
    if(step&&step.s.progress>-.2)return expandNeutral0377(step.f,step.s);

    const path=countryPath0377(a,b);
    if(!path||path.length<2)return false;
    if(path.length===2)return false; // 0.37.5/0.37.6 resuelven frontera directa

    const auth=authorizePath0377(a,b,path);
    if(auth.ok)return advanceLegalCorridor0377(a,b,path);
    return handleDenied0377(a,b,auth.denied,auth.count,path);
  }

  const baseBotBuild0377=botBuild3230;
  botBuild3230=function(f){
    if(f>0&&f<activeFactionCount3230&&serviceProject0377(f))return;
    return baseBotBuild0377.apply(this,arguments);
  };

  function serialize0377(){
    return {version:1,refusal:[...refusal.entries()]};
  }
  function restore0377(data){
    refusal.clear();
    if(data&&Array.isArray(data.refusal)){
      for(const row of data.refusal){
        if(Array.isArray(row)&&typeof row[0]==='string'&&Number.isFinite(Number(row[1])))
          refusal.set(row[0],Math.max(0,Number(row[1])));
      }
    }
    nextService.fill(0);neighborCache.clear();return true;
  }
  function save0377(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize0377()))}catch(_){}}
  function load0377(){try{return restore0377(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'))}catch(_){return restore0377(null)}}

  const baseSave0377=saveGame3212;
  saveGame3212=function(){const out=baseSave0377.apply(this,arguments);save0377();return out};
  const baseLoad0377=loadGame3212;
  loadGame3212=function(){const out=baseLoad0377.apply(this,arguments);load0377();return out};
  const baseReset0377=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset0377.apply(this,arguments);
    refusal.clear();nextService.fill(0);neighborCache.clear();
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out;
  };

  if(typeof buildPortableFile3275==='function'){
    const basePortableBuild0377=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=basePortableBuild0377.apply(this,arguments);
      file.gameVersion=BUILD;
      file.payload.tradeGeopolitics0377=serialize0377();
      if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const basePortableApply0377=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const data=file?.payload?.tradeGeopolitics0377||null;
      const out=basePortableApply0377.apply(this,arguments);
      restore0377(data);save0377();return out;
    };
  }

  load0377();
  window.HexategosTradeGeopolitics0377={
    version:BUILD,
    service:(f)=>serviceProject0377(Number(f)),
    stats:()=>({build:BUILD,neutralExpansions,transitRequests,transitGranted,transitDenied,
      alternatives,smugglingAttempts,tensions,corridorWars,corridorRoads,refusalEntries:refusal.size}),
    validate:()=>{
      const errors=[],warnings=[];
      if(!window.HexategosTradeLogistics0370?.requestTransit)errors.push('API de tránsito 0.37.x no disponible');
      if(!window.HexategosBorderRoad0376?.createTransitAI)errors.push('API de aduanas de tránsito no disponible');
      if(refusal.size>activeFactionCount3230*5)warnings.push('historial de negativas de tránsito elevado');
      return {ok:errors.length===0,errors,warnings};
    }
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.37.7 · corredores comerciales geopolíticos activos');
})();
