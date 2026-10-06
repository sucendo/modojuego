'use strict';

// HEXATEGOS 0.35.0 · doctrina geopolítica.
// Capa estratégica sobre la IA 0.33/0.34:
// - intereses nacionales persistentes;
// - esfera regional e influencia creciente;
// - rival, amenaza, equilibrio de poder y estados tapón;
// - memoria diplomática;
// - objetivos comprensibles y visibles para el jugador.
// Sin temporizadores nuevos y sin escaneos mundiales adicionales.
(() => {
  const BUILD='0.35.0';
  const N=FACTION_CAPACITY3230;
  const SAVE_KEY='hexategos-geopolitics-035';
  const EVAL_PERIOD=18;
  const POWER_PERIOD=6;

  const DOCTRINE_BY_ROLE={
    aggressive:'expansionist',
    naval:'maritime',
    defense:'defensive',
    growth:'commercial',
    balanced:'continental'
  };
  const DOCTRINE_LABEL={
    expansionist:'EXPANSIONISTA',
    maritime:'MARÍTIMA',
    defensive:'DEFENSIVA',
    commercial:'COMERCIAL',
    continental:'CONTINENTAL'
  };
  const REGION_LABEL={
    europe:'Europa',
    northamerica:'Norteamérica',
    southamerica:'Sudamérica',
    africa:'África',
    westasia:'Asia occidental',
    southasia:'Asia meridional',
    eastasia:'Asia oriental',
    maritime:'Sudeste marítimo',
    pacific:'Pacífico',
    arctic:'Ártico'
  };

  let state=Array.from({length:N},()=>null);
  let grievance=new Float32Array(N*N);
  let powerCache=new Float64Array(N);
  let powerCampaign=-Infinity;
  let powerOrder=[];
  let initializedFromStorage=false;
  let evalCount=0;
  let lastEvalMs=0;

  const ix=(a,b)=>a*N+b;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function alive035(f,snap){
    return f>=0&&f<activeFactionCount3230&&(snap?.territory?.[f]||0)>0;
  }

  function angleCells035(a,b){
    if(a<0||b<0||a>=owner6.length||b>=owner6.length)return 180;
    const L=loadLevel(MAX_GAME_LEVEL3233),C=L.centers,ia=a*3,ib=b*3;
    const ax=C[ia]/32767,ay=C[ia+1]/32767,az=C[ia+2]/32767;
    const bx=C[ib]/32767,by=C[ib+1]/32767,bz=C[ib+2]/32767;
    return Math.acos(clamp(ax*bx+ay*by+az*bz,-1,1))*180/Math.PI;
  }

  function capitalDistance035(a,b){
    return angleCells035(capitals?.[a]??-1,capitals?.[b]??-1);
  }

  function homeRegion035(f){
    const cap=(capitals?.[f]>=0?capitals[f]:(historicCapital3230?.[f]??-1));
    return cap>=0?regionKey3302(cap):'unknown';
  }

  function doctrine035(f){
    return DOCTRINE_BY_ROLE[FACTIONS3230[f]?.role]||'continental';
  }

  function deterministicAmbition035(f){
    const role=FACTIONS3230[f]?.role||'balanced';
    const base=role==='aggressive'?.86:role==='naval'?.72:role==='growth'?.66:role==='defense'?.45:.58;
    return clamp(base+((((f+3)*37)%17)-8)*.012,.34,.94);
  }

  function refreshPower035(force=false){
    const now=Number(campaignSeconds3230)||0;
    if(!force&&now-powerCampaign<POWER_PERIOD&&powerOrder.length)return;
    const snap=aiSnapshot3260||rebuildAISnapshot3260();
    powerOrder=[];
    for(let f=0;f<activeFactionCount3230;f++){
      if(!alive035(f,snap)){powerCache[f]=0;continue}
      powerCache[f]=dipPower3300(f);
      powerOrder.push(f);
    }
    powerOrder.sort((a,b)=>powerCache[b]-powerCache[a]);
    powerCampaign=now;
  }

  function sphereRadius035(f,snap){
    const territory=snap?.territory?.[f]||0;
    const d=doctrine035(f);
    let radius=18+Math.min(32,Math.sqrt(Math.max(0,territory))*1.15);
    if(d==='maritime')radius+=12;
    if(d==='expansionist')radius+=6;
    if(d==='defensive')radius-=3;
    return clamp(radius,16,62);
  }

  function threatScore035(a,b,snap){
    if(a===b||!alive035(a,snap)||!alive035(b,snap))return 0;
    refreshPower035(false);
    const rel=diplomaticRelation3300(a,b);
    const border=dipBorder3300(a,b);
    const ratio=powerCache[b]/Math.max(1,powerCache[a]);
    const distance=capitalDistance035(a,b);
    const op=dipOpinionOf3300(a,b);
    const trust=dipTrustOf3300(a,b);
    let v=0;
    if(border)v+=18+Math.min(18,border*.45);
    if(distance<18)v+=10;else if(distance<34)v+=5;else if(distance>70)v-=8;
    if(ratio>2)v+=27;else if(ratio>1.45)v+=18;else if(ratio>1.05)v+=8;
    if(rel===-1)v+=32;else if(rel===3)v-=28;else if(rel===2)v-=18;else if(rel===1)v-=8;
    if(op<-35)v+=14;else if(op>35)v-=8;
    if(trust<25)v+=8;else if(trust>70)v-=7;
    if(homeRegion035(a)===homeRegion035(b))v+=5;
    v+=Math.min(28,grievance[ix(a,b)]*.55);
    return clamp(v,0,100);
  }

  function bufferCandidate035(f,rival,snap){
    if(rival<0)return -1;
    let best=-1,bestScore=-Infinity;
    for(let b=0;b<activeFactionCount3230;b++){
      if(b===f||b===rival||!alive035(b,snap))continue;
      if(!dipBorder3300(f,b)||!dipBorder3300(b,rival))continue;
      const rel=diplomaticRelation3300(f,b);
      if(rel===-1)continue;
      const ratio=powerCache[b]/Math.max(1,powerCache[f]);
      if(ratio>.82)continue;
      let score=20-ratio*8+dipTrustOf3300(f,b)*.08;
      if(homeRegion035(b)===homeRegion035(f))score+=4;
      if(score>bestScore){bestScore=score;best=b}
    }
    return best;
  }

  function dominantTarget035(f,snap){
    refreshPower035(false);
    const top=powerOrder[0]??-1;
    if(top<0||top===f)return -1;
    const own=Math.max(1,powerCache[f]);
    const ratio=powerCache[top]/own;
    if(ratio<1.55)return -1;
    const distance=capitalDistance035(f,top);
    const contact=window.HexategosDiplomacyNetwork3301?.level?.(f,top)??0;
    if(distance>72&&contact<=0)return -1;
    return top;
  }

  function objectiveList035(f,snap,rival,buffer,balance){
    const d=doctrine035(f),out=[];
    const cap=capitals?.[f]??-1,hist=historicCapital3230?.[f]??-1;
    const ports=snap?.ports?.[f]?.length||0;
    const capThreat=snap?.capThreat?.[f]??99;

    if(hist>=0&&owner6[hist]!==f)out.push({type:'recover',label:'Recuperar la capital histórica',weight:100});
    if(cap>=0&&capThreat<14)out.push({type:'security',label:'Asegurar la capital y la frontera',weight:94});
    if(!ports)out.push({type:'sea',label:'Conseguir una salida al mar',weight:d==='maritime'?92:72});
    if(rival>=0){
      const ratio=powerCache[rival]/Math.max(1,powerCache[f]);
      out.push({
        type:ratio>1.18?'contain':'rival',
        target:rival,
        label:(ratio>1.18?'Contener a ':'Superar a ')+factionName3230(rival),
        weight:86
      });
    }
    if(balance>=0&&balance!==rival)out.push({
      type:'balance',target:balance,label:'Equilibrar el poder de '+factionName3230(balance),weight:78
    });
    if(d==='commercial')out.push({type:'trade',label:'Ampliar la red comercial',weight:74});
    if(d==='maritime')out.push({type:'ports',label:'Controlar nodos costeros',weight:76});
    if(d==='defensive'&&buffer>=0)out.push({type:'buffer',target:buffer,label:'Mantener a '+factionName3230(buffer)+' como estado tapón',weight:82});
    if(d==='expansionist')out.push({type:'region',label:'Dominar '+(REGION_LABEL[homeRegion035(f)]||'la región'),weight:77});
    if(d==='continental')out.push({type:'region',label:'Consolidar '+(REGION_LABEL[homeRegion035(f)]||'la esfera regional'),weight:70});
    if(d==='commercial'&&buffer>=0)out.push({type:'buffer',target:buffer,label:'Preservar la estabilidad de '+factionName3230(buffer),weight:68});

    const seen=new Set();
    return out.sort((a,b)=>b.weight-a.weight).filter(x=>{
      const k=x.type+':'+(x.target??'');if(seen.has(k))return false;seen.add(k);return true;
    }).slice(0,4);
  }

  function evaluateFaction035(f,force=false){
    const t0=performance.now();
    const snap=aiSnapshot3260||rebuildAISnapshot3260();
    if(!alive035(f,snap))return null;
    const now=Number(campaignSeconds3230)||0;
    const old=state[f];
    if(!force&&old&&now-old.lastEval<EVAL_PERIOD)return old;

    refreshPower035(false);
    const candidates=[];
    for(let o=0;o<activeFactionCount3230;o++){
      if(o===f||!alive035(o,snap))continue;
      candidates.push({o,threat:threatScore035(f,o,snap)});
    }
    candidates.sort((a,b)=>b.threat-a.threat);

    let rival=candidates[0]?.o??-1;
    if(old?.rival>=0&&alive035(old.rival,snap)){
      const oldThreat=threatScore035(f,old.rival,snap);
      const bestThreat=candidates[0]?.threat||0;
      if(oldThreat>=bestThreat*.78)rival=old.rival;
    }
    const rivalThreat=rival>=0?threatScore035(f,rival,snap):0;
    if(rivalThreat<18)rival=-1;

    const balance=dominantTarget035(f,snap);
    const buffer=bufferCandidate035(f,rival,snap);
    const region=homeRegion035(f);
    const d=doctrine035(f);
    const objectives=objectiveList035(f,snap,rival,buffer,balance);

    state[f]={
      doctrine:d,
      doctrineLabel:DOCTRINE_LABEL[d],
      homeRegion:region,
      homeRegionLabel:REGION_LABEL[region]||region,
      ambition:old?.ambition??deterministicAmbition035(f),
      influenceRadius:sphereRadius035(f,snap),
      rival,
      rivalThreat:rival>=0?threatScore035(f,rival,snap):0,
      buffer,
      balanceTarget:balance,
      objectives,
      lastEval:now
    };
    evalCount++;
    lastEvalMs=performance.now()-t0;
    return state[f];
  }

  function geopoliticalModifier035(f,target){
    if(f<=0||f>=activeFactionCount3230||target<0)return 0;
    const snap=aiSnapshot3260||rebuildAISnapshot3260();
    const st=evaluateFaction035(f,false);
    if(!st)return 0;
    const def=owner6[target];
    const d=st.doctrine;
    const cap=capitals[f]??-1;
    const dist=cap>=0?angleCells035(cap,target):180;
    let mod=0;

    if(regionKey3302(target)===st.homeRegion)
      mod+=d==='expansionist'?3.4:d==='continental'?2.6:d==='defensive'?1.2:1.8;
    if(dist>st.influenceRadius){
      const over=Math.min(35,dist-st.influenceRadius);
      mod-=over*(d==='maritime'?.045:d==='expansionist'?.085:.12);
    }
    if(ports3212.has(target)){
      if(d==='maritime')mod+=4.4;
      if(!(snap.ports[f]?.length))mod+=4.8;
      if(d==='commercial')mod+=1.8;
    }
    mod+=(industryLevel3230[target]||0)*(d==='commercial'?.65:.18);
    if(def===st.rival)mod+=4.8;
    if(def===st.balanceTarget&&powerCache[def]>powerCache[f]*1.45)mod+=2.4;
    if(def===st.buffer)mod-=7.5;
    if(def>=0&&capitals[def]===target){
      if(def===st.rival)mod+=4.2;
      else if(d==='expansionist')mod+=1.3;
    }
    if(def>=0&&d==='defensive'&&dist>26)mod-=2.8;
    if(def>=0&&d==='continental'&&dipBorder3300(f,def))mod+=1.2;
    return mod;
  }

  function opinionModifier035(a,b){
    const snap=aiSnapshot3260||rebuildAISnapshot3260();
    const st=evaluateFaction035(a,false);
    if(!st||!alive035(b,snap))return 0;
    let mod=0;
    const threat=threatScore035(a,b,snap);
    mod-=Math.max(0,threat-30)*.24;
    if(st.rival===b)mod-=14;
    if(st.buffer===b)mod+=15;
    if(st.balanceTarget===b&&powerCache[b]>powerCache[a]*1.45)mod-=8;
    if(homeRegion035(a)===homeRegion035(b)){
      if(st.doctrine==='expansionist')mod-=5;
      else if(st.doctrine==='commercial')mod+=4;
      else if(st.doctrine==='defensive')mod+=2;
    }
    if(st.doctrine==='commercial'&&(aiSnapshot3260?.ports?.[b]?.length||0))mod+=3;
    const bst=state[b];
    if(st.rival>=0&&bst?.rival===st.rival&&b!==st.rival)mod+=9;
    mod-=Math.min(18,grievance[ix(a,b)]*.42);
    return clamp(mod,-32,24);
  }

  function relationReason035(a,b){
    const snap=aiSnapshot3260||rebuildAISnapshot3260();
    const st=evaluateFaction035(a,false);
    if(!st||!alive035(b,snap))return 'interés limitado';
    const parts=[];
    if(st.rival===b)parts.push('rival estratégico');
    if(st.buffer===b)parts.push('estado tapón');
    if(st.balanceTarget===b)parts.push('equilibrio de poder');
    if(homeRegion035(a)===homeRegion035(b))parts.push('misma esfera regional');
    if(dipBorder3300(a,b))parts.push('frontera directa');
    const th=threatScore035(a,b,snap);
    if(th>=65)parts.push('amenaza alta');
    else if(th>=40)parts.push('amenaza media');
    if(diplomaticRelation3300(a,b)===3)parts.push('aliado');
    else if(diplomaticRelation3300(a,b)===1)parts.push('socio comercial');
    if(grievance[ix(a,b)]>22)parts.push('memoria de conflicto');
    return parts.slice(0,4).join(' · ')||'interés geopolítico secundario';
  }

  function explain035(a,b){
    const st=evaluateFaction035(a,true);
    if(!st)return null;
    return {
      nation:factionName3230(a),
      doctrine:st.doctrineLabel,
      region:st.homeRegionLabel,
      influenceRadiusDeg:Math.round(st.influenceRadius),
      ambition:Math.round(st.ambition*100),
      rival:st.rival>=0?factionName3230(st.rival):null,
      buffer:st.buffer>=0?factionName3230(st.buffer):null,
      balanceTarget:st.balanceTarget>=0?factionName3230(st.balanceTarget):null,
      objectives:st.objectives.map(x=>x.label),
      relation:b==null?null:{
        with:factionName3230(b),
        threat:Math.round(threatScore035(a,b,aiSnapshot3260||rebuildAISnapshot3260())),
        reason:relationReason035(a,b),
        grievance:Math.round(grievance[ix(a,b)])
      }
    };
  }

  function serialize035(){
    return {
      version:1,
      state:state.map(x=>x?{
        doctrine:x.doctrine,
        homeRegion:x.homeRegion,
        ambition:x.ambition,
        rival:x.rival,
        buffer:x.buffer,
        balanceTarget:x.balanceTarget,
        lastEval:x.lastEval
      }:null),
      grievance:Array.from(grievance)
    };
  }

  function restore035(data){
    if(!data||!Array.isArray(data.state))return false;
    grievance.fill(0);
    if(Array.isArray(data.grievance))
      grievance.set(data.grievance.slice(0,grievance.length));
    state=Array.from({length:N},(_,f)=>{
      const x=data.state[f];if(!x)return null;
      const d=DOCTRINE_LABEL[x.doctrine]?x.doctrine:doctrine035(f);
      return {
        doctrine:d,doctrineLabel:DOCTRINE_LABEL[d],
        homeRegion:x.homeRegion||homeRegion035(f),
        homeRegionLabel:REGION_LABEL[x.homeRegion]||x.homeRegion||'Región',
        ambition:Number.isFinite(x.ambition)?x.ambition:deterministicAmbition035(f),
        influenceRadius:0,
        rival:Number.isInteger(x.rival)?x.rival:-1,
        rivalThreat:0,
        buffer:Number.isInteger(x.buffer)?x.buffer:-1,
        balanceTarget:Number.isInteger(x.balanceTarget)?x.balanceTarget:-1,
        objectives:[],
        lastEval:-Infinity
      };
    });
    powerCampaign=-Infinity;
    return true;
  }

  function reset035(clearStorage=false){
    state=Array.from({length:N},()=>null);
    grievance.fill(0);
    powerCache.fill(0);powerOrder=[];powerCampaign=-Infinity;
    initializedFromStorage=true;
    if(clearStorage)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
  }

  function saveLocal035(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize035()))}catch(_){}
  }

  function loadLocal035(){
    if(initializedFromStorage)return false;
    initializedFromStorage=true;
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw)return restore035(JSON.parse(raw));
    }catch(_){}
    return false;
  }

  // --- Integración estratégica ------------------------------------------------
  const baseStrategicValue035=aiStrategicValue3260;
  aiStrategicValue3260=function(f,src,target,stance,maneuver,objective=-1){
    return baseStrategicValue035.apply(this,arguments)+geopoliticalModifier035(f,target);
  };

  const basePlanFaction035=aiPlanFaction3260;
  aiPlanFaction3260=function(f,snap){
    const st=evaluateFaction035(f,false);
    const out=basePlanFaction035.apply(this,arguments);
    if(out&&st){
      const owner=out.objective>=0?owner6[out.objective]:-1;
      if(owner===st.rival)out.reason='presionar al rival estratégico';
      else if(owner===st.balanceTarget)out.reason='contener una potencia dominante';
      else if(out.objective>=0&&regionKey3302(out.objective)===st.homeRegion)
        out.reason='consolidar la esfera regional';
      else if(out.objective>=0&&ports3212.has(out.objective)&&!(snap?.ports?.[f]?.length))
        out.reason='obtener una salida al mar';
      out.geopoliticalDoctrine=st.doctrine;
      out.geopoliticalRival=st.rival;
    }
    return out;
  };

  // --- Integración diplomática ------------------------------------------------
  const baseOpinionTarget035=dipOpinionTarget3300;
  dipOpinionTarget3300=function(a,b){
    return clamp(baseOpinionTarget035.apply(this,arguments)+opinionModifier035(a,b),-100,100);
  };

  const baseAcceptance035=dipAcceptanceScore3300;
  dipAcceptanceScore3300=function(receiver,sender,type){
    let score=baseAcceptance035.apply(this,arguments);
    const st=evaluateFaction035(receiver,false);
    if(!st)return score;
    if(type==='trade'&&st.doctrine==='commercial')score+=10;
    if(type==='nap'&&st.buffer===sender)score+=16;
    if(type==='alliance'&&st.rival>=0&&state[sender]?.rival===st.rival)score+=14;
    if(type==='alliance'&&st.balanceTarget>=0&&state[sender]?.balanceTarget===st.balanceTarget)score+=8;
    if(type==='peace'&&st.buffer===sender)score+=12;
    return score;
  };

  const baseReview035=aiReviewDiplomacy3300;
  aiReviewDiplomacy3300=function(f){
    loadLocal035();
    evaluateFaction035(f,false);
    return baseReview035.apply(this,arguments);
  };

  const baseRelation035=setDiplomaticRelation3300;
  setDiplomaticRelation3300=function(a,b,v,reason='decisión diplomática',announce=true){
    const old=diplomaticRelation3300(a,b);
    let why=reason;
    const st=state[a]||evaluateFaction035(a,false);

    if(v===-1&&old!==-1){
      grievance[ix(a,b)]=clamp(grievance[ix(a,b)]+18+(old>0?22:0),0,100);
      grievance[ix(b,a)]=clamp(grievance[ix(b,a)]+16+(old>0?24:0),0,100);
      if(st?.rival===b)why='rivalidad estratégica y disputa regional';
      else if(st?.balanceTarget===b)why='contención de una potencia emergente';
      else if(st&&homeRegion035(a)===homeRegion035(b))why='disputa por la esfera regional';
    }else if(old===-1&&v>=0){
      grievance[ix(a,b)]*=.82;grievance[ix(b,a)]*=.82;
    }else if(v>0){
      grievance[ix(a,b)]*=.94;grievance[ix(b,a)]*=.94;
    }

    const out=baseRelation035.call(this,a,b,v,why,announce);
    if(out){
      if(state[a])state[a].lastEval=-Infinity;
      if(state[b])state[b].lastEval=-Infinity;
      window.HexategosDiplomacyNetwork3301?.markDirty?.();
      saveLocal035();
    }
    return out;
  };

  // --- Guardado compatible ----------------------------------------------------
  if(typeof buildMainState3275==='function'){
    const baseBuildMain035=buildMainState3275;
    buildMainState3275=function(){
      const out=baseBuildMain035.apply(this,arguments);
      out.geopolitics035=serialize035();
      return out;
    };
  }

  if(typeof applyMainState3275==='function'){
    const baseApplyMain035=applyMainState3275;
    applyMainState3275=function(s){
      const out=baseApplyMain035.apply(this,arguments);
      if(!restore035(s?.geopolitics035))reset035(false);
      initializedFromStorage=true;
      return out;
    };
  }

  const baseSave035=saveGame3212;
  saveGame3212=function(){
    const out=baseSave035.apply(this,arguments);
    if(started3230)saveLocal035();
    return out;
  };

  const baseLoad035=loadGame3212;
  loadGame3212=function(){
    const out=baseLoad035.apply(this,arguments);
    if(out){initializedFromStorage=false;loadLocal035()}
    return out;
  };

  const baseBuildWorld035=buildCustomWorld3302;
  buildCustomWorld3302=function(){
    reset035(true);
    const out=baseBuildWorld035.apply(this,arguments);
    if(out){
      const snap=aiSnapshot3260||rebuildAISnapshot3260();
      refreshPower035(true);
      for(let f=1;f<activeFactionCount3230;f++)if(alive035(f,snap))evaluateFaction035(f,true);
      saveLocal035();
    }
    return out;
  };

  // --- Interfaz: explicación geopolítica -------------------------------------
  const baseRenderSystems035=renderSystems3220;
  renderSystems3220=function(){
    const out=baseRenderSystems035.apply(this,arguments);
    if(sysTab3220!=='dip'||!started3230)return out;
    const host=document.getElementById('sysContent3213');
    if(!host||host.querySelector('.geopolitics035'))return out;

    const snap=aiSnapshot3260||rebuildAISnapshot3260();
    refreshPower035(false);
    const contacts=[];
    for(let f=1;f<activeFactionCount3230;f++){
      if(!alive035(f,snap))continue;
      const st=evaluateFaction035(f,false);
      const salience=(dipBorder3300(0,f)?30:0)+
        (diplomaticRelation3300(0,f)!==0?28:0)+
        threatScore035(f,0,snap)+
        (st?.rival===0?24:0);
      contacts.push({f,st,salience});
    }
    contacts.sort((a,b)=>b.salience-a.salience);

    const block=document.createElement('div');
    block.className='sysBlock3213 geopolitics035';
    const rows=contacts.slice(0,8).map(({f,st})=>{
      const rel=relationReason035(f,0);
      const rival=st.rival>=0?factionName3230(st.rival):'ninguno';
      return '<div class="sysMeta3213" style="margin-top:7px"><b>'+
        factionName3230(f)+'</b> · '+st.doctrineLabel+
        ' · rival: '+rival+'<br>'+rel+
        ' · objetivo: '+(st.objectives[0]?.label||'consolidación interna')+'</div>';
    }).join('');

    block.innerHTML='<b>🧭 Lectura geopolítica 0.35</b>'+
      '<div class="sysMeta3213">Las naciones ya ponderan esfera regional, amenaza, rivalidad, acceso al mar, equilibrio de poder, estados tapón y memoria diplomática.</div>'+
      rows;
    host.insertBefore(block,host.children[2]||null);
    return out;
  };

  function stats035(){
    const snap=aiSnapshot3260||rebuildAISnapshot3260();
    refreshPower035(false);
    let living=0,rivals=0,buffers=0,objectives=0;
    const doctrines={};
    for(let f=1;f<activeFactionCount3230;f++){
      if(!alive035(f,snap))continue;
      living++;
      const st=evaluateFaction035(f,false);
      doctrines[st.doctrine]=(doctrines[st.doctrine]||0)+1;
      if(st.rival>=0)rivals++;
      if(st.buffer>=0)buffers++;
      objectives+=st.objectives.length;
    }
    return {
      build:BUILD,living,rivals,buffers,objectives,
      avgObjectives:living?Number((objectives/living).toFixed(2)):0,
      doctrines,evalCount,lastEvalMs:Number(lastEvalMs.toFixed(2)),
      strongest:powerOrder.slice(0,5).map(f=>({f,name:factionName3230(f),power:Number(powerCache[f].toFixed(1))}))
    };
  }

  function validate035(){
    const errors=[],warnings=[];
    const snap=aiSnapshot3260||rebuildAISnapshot3260();
    for(let f=1;f<activeFactionCount3230;f++){
      if(!alive035(f,snap))continue;
      const st=evaluateFaction035(f,true);
      if(!DOCTRINE_LABEL[st.doctrine])errors.push('Doctrina inválida: '+f);
      if(st.rival===f)errors.push('Rival propio: '+f);
      if(st.buffer===f||st.buffer===st.rival)errors.push('Estado tapón inválido: '+f);
      if(st.objectives.length>4)errors.push('Demasiados objetivos: '+f);
      if(st.rival>=activeFactionCount3230)errors.push('Rival inactivo: '+f);
    }
    const st=stats035();
    if(activeFactionCount3230>=50&&st.lastEvalMs>12)warnings.push('Evaluación geopolítica alta: '+st.lastEvalMs+' ms');
    return {ok:errors.length===0,errors,warnings,stats:st};
  }

  if(window.HexategosDiag033?.snapshot){
    const baseDiag035=window.HexategosDiag033.snapshot.bind(window.HexategosDiag033);
    window.HexategosDiag033.snapshot=function(){
      const out=baseDiag035();
      out.geopolitics035=stats035();
      return out;
    };
  }

  window.HEXATEGOS_VERSION=BUILD;
  window.HexategosGeopolitics035={
    stats:stats035,
    validate:validate035,
    explain:explain035,
    evaluate:(f,force=true)=>evaluateFaction035(Number(f),!!force),
    relation:(a,b)=>relationReason035(Number(a),Number(b)),
    save:saveLocal035
  };

  console.info('[HEXATEGOS] 0.35.0 doctrina geopolítica activa · HexategosGeopolitics035.validate()');
})();
