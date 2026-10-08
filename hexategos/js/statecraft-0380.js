'use strict';

// HEXATEGOS 0.38.0 · Estado, embajadas, inteligencia, comercio y estabilidad.
// Capa incremental: reutiliza diplomacia, comercio material, IA, guardados y reloj existentes.
(() => {
  const BUILD='0.38.0';
  const SAVE_KEY='hexategos-statecraft-0380';
  const RESOURCE_LABELS=['Alimentos','Materias primas','Energía/combustible','Bienes industriales','Material militar'];
  const RESOURCE_ICONS=['🍞','⛏','⛽','📦','🎖'];
  const REACH_DEG=[18,28,42,60,90,180];
  const TECH_COST=[0,120,190,280,400,560];
  const STABILITY_BATCH=28;
  const SERVICE_SECONDS=5;

  const pairKey=(a,b)=>a<b?a+':'+b:b+':'+a;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const now=()=>Number(campaignSeconds3230)||0;
  const esc=s=>typeof escapeHtml3271==='function'?escapeHtml3271(String(s??'')):String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const relationLabel=r=>({[-1]:'GUERRA',0:'NEUTRAL',1:'COMERCIO',2:'NO AGRESIÓN',3:'ALIANZA'})[r]||'NEUTRAL';

  let embassies=new Map(); // pair -> {status,requestedBy,at}
  let spies=new Map();     // "from:to" -> {level,active,detected,lastOp}
  let cityState=new Map(); // cell -> {origin,owner,stability,nationalism,scarcity,strikeUntil,riotUntil,...}
  let operations=[];       // efectos temporales abstractos
  let dipTech=new Uint8Array(FACTIONS3230.length);
  let restoredPortable=null;
  let lastService=-1e9;
  let cityCursor=0;
  let aiCursor=1;
  let openNation=-1;
  let openTab='dip';
  let internalRelationChange=false;
  let initialized=false;

  function notify(message,type='info',tab='dip'){
    const api=window.HexategosMessagesStable8;
    if(api?.show)return api.show(message,type,tab);
    if(typeof toast==='function')toast(message);
  }

  function capitalDistance(a,b){
    const ca=capitals?.[a]??-1,cb=capitals?.[b]??-1;
    if(ca<0||cb<0)return 180;
    if(typeof angularHeuristic3254==='function'){
      // angularHeuristic3254 está en unidades de malla, no grados exactos; usamos vectores.
    }
    const L=loadLevel(MAX_GAME_LEVEL3233),C=L.centers,ia=ca*3,ib=cb*3;
    if(ia+2>=C.length||ib+2>=C.length)return 180;
    const ax=C[ia]/32767,ay=C[ia+1]/32767,az=C[ia+2]/32767;
    const bx=C[ib]/32767,by=C[ib+1]/32767,bz=C[ib+2]/32767;
    const dot=clamp(ax*bx+ay*by+az*bz,-1,1);
    return Math.acos(dot)*180/Math.PI;
  }

  function borderContact(a,b){
    try{return Number(dipBorder3300(a,b))>0}catch(_){return false}
  }

  function techLevel(f){
    f=Number(f);
    if(f===0)return dipTech[0]||0;
    const territory=typeof countFaction3230==='function'?countFaction3230(f):0;
    const time=now();
    const natural=Math.floor(Math.min(5,(territory>=25?1:0)+(territory>=80?1:0)+(time>=240?1:0)+(time>=720?1:0)+(time>=1500?1:0)));
    return Math.max(dipTech[f]||0,natural);
  }

  function reachDeg(f){return REACH_DEG[clamp(techLevel(f),0,5)]}

  function embassyRecord(a,b){return embassies.get(pairKey(a,b))||null}
  function hasEmbassy(a,b){return a===b||embassyRecord(a,b)?.status==='active'}
  function embassyPending(a,b){const e=embassyRecord(a,b);return e?.status==='pending'?e:null}

  function canContact(a,b){
    if(a===b)return true;
    if(hasEmbassy(a,b)||diplomaticRelation3300(a,b)!==0)return true;
    if(borderContact(a,b))return true;
    const net=window.HexategosDiplomacyNetwork3301;
    const lvl=Number(net?.level?.(a,b))||0;
    const d=capitalDistance(a,b);
    return d<=reachDeg(a)||(lvl>=3&&d<=reachDeg(a)*1.18);
  }

  function embassyAcceptance(target,from){
    if(diplomaticRelation3300(target,from)===-1)return -999;
    const op=typeof dipOpinionOf3300==='function'?dipOpinionOf3300(target,from):0;
    const trust=typeof dipTrustOf3300==='function'?dipTrustOf3300(target,from):45;
    const role=FACTIONS3230[target]?.role||'balanced';
    let score=38+op*.36+trust*.28;
    if(borderContact(target,from))score+=8;
    if(role==='growth'||role==='naval')score+=7;
    if(role==='aggressive')score-=5;
    return score;
  }

  function setEmbassy(a,b,status,requestedBy=-1){
    if(a===b)return false;
    const key=pairKey(a,b);
    embassies.set(key,{status,requestedBy,at:now()});
    save0380();
    return true;
  }

  function requestEmbassy(from,to,interactive=false){
    if(from===to||from<0||to<0)return false;
    if(hasEmbassy(from,to))return true;
    if(!canContact(from,to)){
      if(interactive)notify('Fuera del alcance diplomático actual','diplomacy','dip');
      return false;
    }
    if(to===0&&from>0){
      setEmbassy(from,to,'pending',from);
      notify(factionName3230(from)+' solicita establecer una embajada','diplomacy','dip');
      return true;
    }
    if(from===0&&to>0){
      const score=embassyAcceptance(to,from);
      if(score>=50){
        setEmbassy(from,to,'active',from);
        if(typeof dipSetTrust3300==='function')dipSetTrust3300(to,from,(dipTrustOf3300(to,from)||45)+4);
        notify(factionName3230(to)+' acepta nuestra embajada','diplomacy','dip');
        return true;
      }
      setEmbassy(from,to,'rejected',from);
      notify(factionName3230(to)+' rechaza por ahora nuestra embajada','diplomacy','dip');
      return false;
    }
    const score=embassyAcceptance(to,from);
    if(score>=48){setEmbassy(from,to,'active',from);return true}
    return false;
  }

  function answerEmbassy(other,accept){
    const p=embassyPending(0,other);
    if(!p||p.requestedBy!==other)return false;
    setEmbassy(0,other,accept?'active':'rejected',other);
    notify((accept?'Embajada establecida con ':'Embajada rechazada de ')+factionName3230(other),'diplomacy','dip');
    return true;
  }

  function tradeAllowedPair(a,b){
    if(a===b)return true;
    return hasEmbassy(a,b)&&[1,2,3].includes(diplomaticRelation3300(a,b));
  }

  function proposeTreaty(type,target){
    if(target<=0)return false;
    if(type!=='war'&&!hasEmbassy(0,target)){
      notify('Primero debes establecer una embajada','diplomacy','dip');return false;
    }
    if(type==='war'){
      internalRelationChange=true;
      try{setDiplomaticRelation3300(0,target,-1,'declaración de guerra',true)}
      finally{internalRelationChange=false}
      renderNationDossier(target,'dip');return true;
    }
    const score=typeof dipAcceptanceScore3300==='function'?dipAcceptanceScore3300(target,0,type):50;
    const threshold=typeof dipThreshold3300==='function'?dipThreshold3300(type):50;
    if(score>=threshold){
      const rel=type==='trade'?1:type==='nap'?2:type==='alliance'?3:type==='peace'?0:0;
      internalRelationChange=true;
      try{setDiplomaticRelation3300(0,target,rel,'acuerdo bilateral',true)}
      finally{internalRelationChange=false}
      notify(factionName3230(target)+' acepta '+(type==='trade'?'el acuerdo comercial':type==='nap'?'el pacto de no agresión':type==='alliance'?'la alianza':'la paz'),'diplomacy','dip');
      renderNationDossier(target,'dip');return true;
    }
    if(typeof dipSetOpinion3300==='function')dipSetOpinion3300(target,0,(dipOpinionOf3300(target,0)||0)-2);
    notify(factionName3230(target)+' rechaza la propuesta','diplomacy','dip');
    renderNationDossier(target,'dip');return false;
  }

  function spyKey(from,to){return from+':'+to}
  function spyState(from,to){return spies.get(spyKey(from,to))||null}
  function intelScore(viewer,target){
    if(viewer===target)return 100;
    const spy=spyState(viewer,target);
    let v=spy?.active?(Number(spy.level)||0):0;
    if(hasEmbassy(viewer,target))v+=18;
    const rel=diplomaticRelation3300(viewer,target);
    if(rel===1)v+=12; else if(rel===2)v+=8; else if(rel===3)v+=18;
    const net=window.HexategosDiplomacyNetwork3301;
    if((net?.level?.(viewer,target)||0)>=3)v+=5;
    return clamp(Math.round(v),0,100);
  }

  function deploySpy(from,to,interactive=false){
    if(from===to||to<0)return false;
    const existing=spyState(from,to);
    if(existing?.active)return true;
    if(!canContact(from,to)&&!hasEmbassy(from,to)){
      if(interactive)notify('No existe acceso suficiente a esa nación','intel','intel');
      return false;
    }
    const cost=hasEmbassy(from,to)?45:65;
    if(from===0){
      if(gold3212<cost){notify('Oro insuficiente para desplegar la red de inteligencia','intel','intel');return false}
      gold3212-=cost;
    }else if(botGold3230[from]>=cost)botGold3230[from]-=cost; else return false;
    spies.set(spyKey(from,to),{active:true,level:12,detected:false,lastOp:-1e9});
    save0380();
    if(interactive)notify('Red de inteligencia desplegada en '+factionName3230(to),'intel','intel');
    return true;
  }

  function nationResourceSummary(f){
    return window.HexategosTradeLogistics0370?.resourceSummary?.(f)||null;
  }

  function secretPolicy(f,r){
    const h=((f+11)*1103515245+(r+7)*12345)>>>0;
    const secrecy=((h>>>8)%100);
    const strategic=r===4?28:r===2?14:0;
    return clamp(secrecy+strategic,0,100);
  }

  function resourceBalance(f,r){
    const s=nationResourceSummary(f);
    if(!s)return {coverage:.55,prod:0,demand:0,balance:0};
    const coverage=Number(s.coverage?.[r])||0;
    const prod=Number(s.prod?.[r])||0,demand=Number(s.demand?.[r])||0;
    return {coverage,prod,demand,balance:prod-demand};
  }

  function exportWillingness(f,partner,r){
    const d=resourceBalance(f,r),op=typeof dipOpinionOf3300==='function'?dipOpinionOf3300(f,partner):0;
    const secrecy=secretPolicy(f,r);
    let reserve=.48+(r===4?.18:r===2?.08:0)+secrecy*.0012;
    if(d.coverage<reserve)return {allowed:false,label:'NO EXPORTA',reason:'reserva insuficiente',secrecy};
    if(op<-20)return {allowed:false,label:'RESTRINGIDO',reason:'relación política',secrecy};
    if(secrecy>82&&r>=2)return {allowed:false,label:'ESTRATÉGICO',reason:'reserva estratégica',secrecy};
    const high=d.coverage>Math.max(.76,reserve+.14);
    return {allowed:true,label:high?'EXCEDENTE ALTO':'DISPONIBLE',reason:high?'capacidad exportadora alta':'exportación limitada',secrecy};
  }

  function resourceTradeAllowed(exporter,importer,r){
    if(exporter===importer)return true;
    if(!tradeAllowedPair(exporter,importer))return false;
    return exportWillingness(exporter,importer,r).allowed;
  }

  function qualitativeResource(viewer,target,r){
    const intel=intelScore(viewer,target),d=resourceBalance(target,r),w=exportWillingness(target,viewer,r);
    if(intel<15)return {text:'Desconocido',exact:false,willing:'Desconocido'};
    let text=d.coverage>=.78?'Excedente':d.coverage>=.58?'Equilibrado':d.coverage>=.38?'Déficit':'Escasez';
    if(intel<35&&secretPolicy(target,r)>62)text='Información reservada';
    const exact=intel>=62;
    let willing=intel>=32?w.label:(w.allowed?'Posible exportación':'No confirmado');
    if(intel<70&&w.secrecy>78)willing='Política reservada';
    return {text,exact,pct:Math.round(d.coverage*100),prod:d.prod,demand:d.demand,willing,hidden:intel>=72&&w.secrecy>68};
  }

  function averageStability(f){
    let sum=0,n=0,min=100;
    for(const st of cityState.values()){
      if(st.owner!==f)continue;
      sum+=st.stability;n++;min=Math.min(min,st.stability);
    }
    return {avg:n?sum/n:75,min:n?min:75,n};
  }

  function operationEffect(target,type){
    const n=now();
    const duration=type==='labor'?55:type==='nationalist'?70:48;
    operations.push({target,type,until:n+duration,started:n});
  }

  function runSpyOperation(target,type){
    const sp=spyState(0,target);
    if(!sp?.active){notify('Necesitas una red de inteligencia activa','intel','intel');return false}
    const req=type==='food'?35:type==='fuel'?42:type==='industry'?42:type==='labor'?48:58;
    if(sp.level<req){notify('Infiltración insuficiente para esta operación','intel','intel');return false}
    const stab=averageStability(target);
    const vulnerability=clamp((60-stab.avg)*.45,0,22);
    const counter=(secretPolicy(target,4)%24);
    const chance=clamp(42+sp.level*.48+vulnerability-counter,18,88);
    const success=Math.random()*100<chance;
    sp.lastOp=now();sp.level=clamp(sp.level-(success?18:26),5,100);
    if(success){
      operationEffect(target,type);
      notify('Operación de inteligencia completada en '+factionName3230(target),'intel','intel');
    }else{
      const detected=Math.random()*100<clamp(34+counter-sp.level*.12,18,72);
      if(detected){
        sp.detected=true;
        if(typeof dipSetOpinion3300==='function')dipSetOpinion3300(target,0,(dipOpinionOf3300(target,0)||0)-18);
        if(typeof dipSetTrust3300==='function')dipSetTrust3300(target,0,(dipTrustOf3300(target,0)||45)-22);
        if(Math.random()<.22&&hasEmbassy(0,target))setEmbassy(0,target,'expelled',target);
        notify(factionName3230(target)+' ha detectado una operación de inteligencia','war','intel');
      }else notify('La operación fracasa sin atribución confirmada','intel','intel');
    }
    save0380();renderNationDossier(target,'intel');return success;
  }

  function activeOperation(f,type){
    const n=now();
    for(let i=operations.length-1;i>=0;i--){
      if(operations[i].until<=n)operations.splice(i,1);
    }
    return operations.some(x=>x.target===f&&x.type===type&&x.until>n);
  }

  function resourceProductionMultiplier(cell,r,f){
    let m=1;
    if(activeOperation(f,'food')&&r===0)m*=.58;
    if(activeOperation(f,'fuel')&&r===2)m*=.58;
    if(activeOperation(f,'industry')&&(r===3||r===4))m*=.56;
    const st=cityState.get(Number(cell));
    if(st&&st.owner===f){
      if(st.strikeUntil>now())m*=.62;
      if(st.riotUntil>now())m*=.78;
    }
    return clamp(m,.18,1);
  }

  function supplyForCity(cell,f){
    const api=window.HexategosTradeLogistics0370;
    let physical=Number(api?.combinedSupply?.(cell));
    if(!Number.isFinite(physical))physical=typeof supplyPct3220==='function'?Number(supplyPct3220(cell))||0:60;
    if(f===0)return clamp(physical,0,100);
    const mat=api?.materialSupply?.(cell);
    if(mat&&Number.isFinite(mat.material))return clamp(physical*(.25+.75*mat.material/100),0,100);
    return clamp(physical,0,100);
  }

  function ensureCityState(cell){
    const owner=owner6[cell];
    let st=cityState.get(cell);
    if(!st){
      st={cell,origin:owner,owner,stability:78,nationalism:12,scarcity:0,strikeUntil:0,riotUntil:0,lastEvent:0,occupiedSince:0};
      cityState.set(cell,st);
    }
    if(st.owner!==owner){
      const previous=st.owner;
      st.owner=owner;st.occupiedSince=now();
      if(st.origin>=0&&owner!==st.origin)st.nationalism=Math.max(st.nationalism,68);
      else st.nationalism=Math.max(10,st.nationalism*.55);
      st.stability=clamp(st.stability-18,8,100);
      if(previous===0||owner===0)notify('Cambio de control en '+placeDisplayName3271(cell),'war','dip');
    }
    return st;
  }

  function triggerUnrest(st,supply){
    const n=now();
    if(n-st.lastEvent<22)return;
    if(st.stability<48&&st.scarcity>45&&st.strikeUntil<n){
      st.strikeUntil=n+38;st.lastEvent=n;
      if(st.owner===0)notify('Huelgas por escasez en '+placeDisplayName3271(st.cell),'economy','eco');
      return;
    }
    if(st.stability<34&&st.scarcity>90&&st.riotUntil<n){
      st.riotUntil=n+48;st.lastEvent=n;
      if(st.owner===0)notify('Disturbios graves en '+placeDisplayName3271(st.cell),'war','dip');
      return;
    }
    if(st.stability<22&&st.scarcity>150&&st.origin>=0&&st.owner!==st.origin&&st.nationalism>70){
      restoreNationalControl(st);
    }
  }

  function restoreNationalControl(st){
    const cell=st.cell,occupier=st.owner,origin=st.origin;
    if(origin<0||origin>=activeFactionCount3230||occupier<0||origin===occupier)return false;
    owner6[cell]=origin;
    const L=loadLevel(MAX_GAME_LEVEL3233);
    for(let k=L.offsets[cell];k<L.offsets[cell+1];k++){
      const n=L.edgeNbr[k];
      if(n>=0&&owner6[n]===occupier&&!cities3212.has(n)&&Math.random()<.34)owner6[n]=origin;
    }
    if(typeof countFaction3230==='function'&&countFaction3230(origin)<=2){
      capitals[origin]=cell;
      if(typeof botGold3230!=='undefined')botGold3230[origin]=Math.max(botGold3230[origin]||0,70);
      if(typeof troops3230!=='undefined')troops3230[origin]=Math.max(troops3230[origin]||0,36);
    }
    st.owner=origin;st.stability=42;st.nationalism=28;st.scarcity=0;st.lastEvent=now();
    if(typeof markEconomyDirty3261==='function')markEconomyDirty3261();
    if(typeof aiMarkDirty3260==='function')aiMarkDirty3260();
    if(typeof supplyDirty3220!=='undefined')supplyDirty3220=true;
    window.HexategosDiplomacyNetwork3301?.markDirty?.();
    notify(placeDisplayName3271(cell)+' se ha rebelado y restaura '+factionName3230(origin),'war','dip');
    return true;
  }

  function updateOneCity(cell,dt){
    if(!cities3212.has(cell)||owner6[cell]<0)return;
    const st=ensureCityState(cell),f=st.owner,supply=supplyForCity(cell,f);
    const occupied=st.origin>=0&&f!==st.origin;
    if(occupied)st.nationalism=clamp(st.nationalism+dt*.018,0,100);
    else st.nationalism=clamp(st.nationalism-dt*.012,6,100);

    if(supply<55)st.scarcity=clamp(st.scarcity+dt,0,300);
    else st.scarcity=clamp(st.scarcity-dt*1.6,0,300);

    let target=82;
    target+=(supply-70)*.42;
    if(occupied)target-=18+st.nationalism*.20;
    if(activeOperation(f,'labor'))target-=12;
    if(activeOperation(f,'nationalist')&&occupied)target-=18;
    if(diplomaticRelation3300(f,0)===-1&&f!==0)target-=3;
    if(st.strikeUntil>now())target-=8;
    if(st.riotUntil>now())target-=16;
    target=clamp(target,5,96);
    st.stability=clamp(st.stability+(target-st.stability)*clamp(dt*.012,.02,.18),0,100);
    triggerUnrest(st,supply);
  }

  function serviceStability(dt){
    const cities=[...cities3212];
    if(!cities.length)return;
    if(cityCursor>=cities.length)cityCursor=0;
    const lim=Math.min(STABILITY_BATCH,cities.length);
    for(let i=0;i<lim;i++){
      const cell=cities[cityCursor++%cities.length];
      updateOneCity(cell,dt);
    }
  }

  function serviceSpies(dt){
    for(const [key,s] of spies){
      if(!s.active)continue;
      s.level=clamp((Number(s.level)||0)+dt*.045,0,100);
    }
  }

  function serviceAI(){
    if(activeFactionCount3230<=1)return;
    if(aiCursor>=activeFactionCount3230)aiCursor=1;
    const f=aiCursor++;
    if(typeof countFaction3230==='function'&&countFaction3230(f)<=0)return;
    dipTech[f]=Math.max(dipTech[f],techLevel(f));
    const net=window.HexategosDiplomacyNetwork3301;
    const targets=net?.targetsRef?.(f)||net?.targets?.(f)||[];
    for(let i=0;i<Math.min(6,targets.length);i++){
      const o=targets[(i+f)%targets.length];
      if(o===f||o<0||o>=activeFactionCount3230||!canContact(f,o))continue;
      if(!hasEmbassy(f,o)&&!embassyPending(f,o)&&embassyAcceptance(o,f)>=55){
        requestEmbassy(f,o,false);break;
      }
      if(hasEmbassy(f,o)&&diplomaticRelation3300(f,o)===0){
        const score=typeof dipAcceptanceScore3300==='function'?dipAcceptanceScore3300(o,f,'trade'):0;
        const th=typeof dipThreshold3300==='function'?dipThreshold3300('trade'):50;
        if(score>=th+5){
          internalRelationChange=true;
          try{setDiplomaticRelation3300(f,o,1,'acuerdo comercial tras apertura de embajadas',false)}
          finally{internalRelationChange=false}
          break;
        }
      }
      if(hasEmbassy(f,o)&&!spyState(f,o)&&((f*31+o*17+Math.floor(now()/30))%19===0))deploySpy(f,o,false);
    }
    const spTargets=[];
    for(const [key,s] of spies){
      const [from,to]=key.split(':').map(Number);
      if(from===f&&s.active&&s.level>62&&diplomaticRelation3300(f,to)!==3)spTargets.push({to,s});
    }
    if(spTargets.length){
      const x=spTargets[0],stab=averageStability(x.to);
      if(stab.avg<52&&Math.random()<.08)operationEffect(x.to,stab.avg<38?'labor':'industry');
    }
  }

  function service0380(){
    const n=now();
    if(!initialized){initialize0380();return}
    if(n-lastService<SERVICE_SECONDS)return;
    const dt=clamp(n-lastService,1,12);lastService=n;
    serviceStability(dt);serviceSpies(dt);serviceAI();
    operations=operations.filter(x=>x.until>n);
  }

  function initialize0380(){
    if(initialized)return;
    initialized=true;lastService=now();
    load0380();
    // Migración: tratados positivos preexistentes se consideran diplomacia ya formalizada.
    for(let a=0;a<activeFactionCount3230;a++)for(let b=a+1;b<activeFactionCount3230;b++){
      if(diplomaticRelation3300(a,b)>0&&!hasEmbassy(a,b))embassies.set(pairKey(a,b),{status:'active',requestedBy:-1,at:now()});
    }
    for(const c of cities3212)ensureCityState(c);
    save0380();
  }

  function resourceRows(target){
    const intel=intelScore(0,target);
    let html='';
    for(let r=0;r<5;r++){
      const q=qualitativeResource(0,target,r);
      html+='<div class="nationResource0380"><span>'+RESOURCE_ICONS[r]+' '+RESOURCE_LABELS[r]+'</span><b>'+esc(q.text)+(q.exact?' · '+q.pct+'%':'')+'</b><small>'+esc(q.willing)+(q.hidden?' · posible reserva oculta':'')+'</small></div>';
    }
    return '<div class="nationIntelLevel0380">Fiabilidad de inteligencia <b>'+intel+'%</b></div><div class="nationResources0380">'+html+'</div>';
  }

  function routesForPair(a,b){
    const all=window.HexategosTradeLogistics0370?.routes?.()||[];
    return all.filter(r=>r.status!=='closed'&&((r.a===a&&r.b===b)||(r.a===b&&r.b===a)));
  }

  function dossierHeader(target){
    const rel=diplomaticRelation3300(0,target),emb=embassyRecord(0,target),d=capitalDistance(0,target);
    return '<div class="nationHero0380"><div><b>'+esc(factionName3230(target))+'</b><small>'+relationLabel(rel)+' · '+Math.round(d)+'° · alcance '+reachDeg(0)+'°</small></div>'+
      '<span class="nationColor0380" style="background:'+(FACTIONS3230[target]?.color||'#789')+'"></span></div>'+
      '<div class="nationStatus0380"><span>Embajada <b>'+(emb?.status==='active'?'ACTIVA':emb?.status==='pending'?'PENDIENTE':emb?.status==='expelled'?'EXPULSADA':'NO')+'</b></span>'+
      '<span>Opinión <b>'+Math.round(dipOpinionOf3300?.(target,0)||0)+'</b></span><span>Confianza <b>'+Math.round(dipTrustOf3300?.(target,0)||0)+'</b></span></div>';
  }

  function diplomacyTab(target){
    const emb=embassyRecord(0,target),rel=diplomaticRelation3300(0,target),pending=emb?.status==='pending'&&emb.requestedBy===target;
    let acts='';
    if(pending)acts='<button data-sc0380="embassy_accept">ACEPTAR EMBAJADA</button><button data-sc0380="embassy_reject" class="warn0380">RECHAZAR</button>';
    else if(!hasEmbassy(0,target))acts='<button data-sc0380="embassy_request" '+(!canContact(0,target)?'disabled':'')+'>ENVIAR EMBAJADA</button>';
    else{
      if(rel===0)acts+='<button data-sc0380="trade">PROPONER COMERCIO</button><button data-sc0380="nap">NO AGRESIÓN</button>';
      if(rel===1||rel===2)acts+='<button data-sc0380="alliance">PROPONER ALIANZA</button>';
      if(rel===-1)acts+='<button data-sc0380="peace">PROPONER PAZ</button>';
      if(rel!==-1)acts+='<button data-sc0380="war" class="warn0380">DECLARAR GUERRA</button>';
    }
    return '<div class="nationSection0380"><h4>Relaciones diplomáticas</h4>'+
      '<p>El contacto permite conocer la nación; la embajada abre la diplomacia formal. El comercio requiere además un acuerdo aceptado por ambos estados.</p>'+
      '<div class="nationActions0380">'+acts+'</div></div>';
  }

  function commerceTab(target){
    const rel=diplomaticRelation3300(0,target),routes=routesForPair(0,target);
    return '<div class="nationSection0380"><h4>Recursos y comercio</h4>'+
      (!hasEmbassy(0,target)?'<p class="nationWarning0380">Sin embajada: la información comercial es muy limitada y no pueden abrirse acuerdos formales.</p>':'')+
      resourceRows(target)+
      '<div class="nationTradeSummary0380"><span>Acuerdo comercial <b>'+([1,2,3].includes(rel)?'SÍ':'NO')+'</b></span><span>Rutas físicas <b>'+routes.length+'</b></span></div>'+
      (hasEmbassy(0,target)&&rel===0?'<button data-sc0380="trade">SOLICITAR ACUERDO COMERCIAL</button>':'')+
      '<p>Las rutas automáticas solo transportan recursos que la nación exportadora esté dispuesta a vender y que tengan disponibilidad real.</p></div>';
  }

  function intelTab(target){
    const sp=spyState(0,target),intel=intelScore(0,target),stab=averageStability(target);
    let html='<div class="nationSection0380"><h4>Inteligencia</h4><div class="nationTradeSummary0380"><span>Conocimiento <b>'+intel+'%</b></span><span>Red de espionaje <b>'+(sp?.active?Math.round(sp.level)+'%':'NO')+'</b></span></div>';
    if(!sp?.active)html+='<button data-sc0380="spy_deploy">DESPLEGAR RED DE INTELIGENCIA</button>';
    else{
      html+='<div class="nationOps0380">'+
        '<button data-sc0380="op_food" '+(sp.level<35?'disabled':'')+'>SABOTAJE ALIMENTARIO</button>'+
        '<button data-sc0380="op_fuel" '+(sp.level<42?'disabled':'')+'>SABOTAJE ENERGÉTICO</button>'+
        '<button data-sc0380="op_industry" '+(sp.level<42?'disabled':'')+'>SABOTAJE INDUSTRIAL</button>'+
        '<button data-sc0380="op_labor" '+(sp.level<48?'disabled':'')+'>AGITACIÓN LABORAL</button>'+
        '<button data-sc0380="op_nationalist" '+(sp.level<58?'disabled':'')+'>AGITACIÓN NACIONALISTA</button></div>';
      html+='<p>Las operaciones explotan vulnerabilidades existentes. Una sociedad estable y abastecida es mucho más resistente; una operación descubierta deteriora gravemente la relación.</p>';
      if(intel>=55)html+='<div class="nationTradeSummary0380"><span>Estabilidad estimada <b>'+Math.round(stab.avg)+'%</b></span><span>Ciudad más tensa <b>'+Math.round(stab.min)+'%</b></span></div>';
    }
    return html+'</div>';
  }

  function militaryTab(target){
    const intel=intelScore(0,target);
    if(intel<28)return '<div class="nationSection0380"><h4>Capacidad militar</h4><p>Información insuficiente. Aumenta la inteligencia o establece relaciones diplomáticas.</p></div>';
    const troops=Math.round(Number(troops3230?.[target])||0);
    const fleets=(typeof navalGroups3270!=='undefined'?navalGroups3270.filter(g=>g.f===target).length:0);
    return '<div class="nationSection0380"><h4>Capacidad militar '+(intel<65?'estimada':'conocida')+'</h4><div class="nationTradeSummary0380"><span>Reserva terrestre <b>'+(intel>=65?troops:'~'+Math.round(troops/10)*10)+'</b></span><span>Flotas <b>'+(intel>=55?fleets:'?')+'</b></span></div></div>';
  }

  function routesTab(target){
    const rs=routesForPair(0,target);
    let html='<div class="nationSection0380"><h4>Rutas comerciales bilaterales</h4>';
    if(!rs.length)return html+'<p>No hay rutas físicas entre ambas naciones.</p></div>';
    for(const r of rs){
      html+='<div class="nationRoute0380"><b>'+(r.type==='sea'?'⚓ MARÍTIMA':'🛣 TERRESTRE')+'</b><span>'+esc(placeDisplayName3271(r.from))+' ↔ '+esc(placeDisplayName3271(r.to))+'</span><small>'+esc(r.status||'')+' · '+Math.round(r.distance||0)+' hex</small></div>';
    }
    return html+'</div>';
  }

  function renderNationDossier(target,tab=openTab){
    target=Number(target);
    if(!Number.isInteger(target)||target<0||target>=activeFactionCount3230)return false;
    openNation=target;openTab=tab||'dip';
    closeContextDialog3244?.();
    if(typeof closeSystems3220==='function')closeSystems3220();
    uiInteractionState3244.modal={type:'nation_dossier_0380',data:{target}};
    modal3244.classList.add('open3244');modal3244.setAttribute('aria-hidden','false');
    modalTitle3244.textContent=(target===0?'Tu nación · ': 'Nación · ')+factionName3230(target);
    const tabs=['dip','commerce','intel','military','routes'];
    const labels={dip:'DIPLOMACIA',commerce:'COMERCIO',intel:'INTELIGENCIA',military:'MILITAR',routes:'RUTAS'};
    let body=dossierHeader(target)+'<div class="nationTabs0380">'+tabs.map(t=>'<button data-nation-tab0380="'+t+'" class="'+(openTab===t?'active':'')+'">'+labels[t]+'</button>').join('')+'</div>';
    if(target===0){
      const s=nationResourceSummary(0),stab=averageStability(0);
      body+='<div class="nationSection0380"><h4>Estado nacional</h4><div class="nationTradeSummary0380"><span>I+D diplomática <b>Nivel '+techLevel(0)+'</b></span><span>Alcance <b>'+reachDeg(0)+'°</b></span><span>Estabilidad urbana <b>'+Math.round(stab.avg)+'%</b></span></div></div>';
    }else if(openTab==='dip')body+=diplomacyTab(target);
    else if(openTab==='commerce')body+=commerceTab(target);
    else if(openTab==='intel')body+=intelTab(target);
    else if(openTab==='military')body+=militaryTab(target);
    else body+=routesTab(target);
    modalBody3244.innerHTML=body;
    modalActions3244.innerHTML='<button data-modal-action="close">CERRAR</button>';
    return true;
  }

  function contextFaction0380(ctx){
    if(ctx?.kind!=='cell'||!Number.isInteger(ctx.cell)||ctx.cell<0)return -1;
    return Number(owner6[ctx.cell]);
  }

  function updateQuickNationButton(ctx){
    let b=document.getElementById('nationQuick0380');
    if(!b){
      b=document.createElement('button');b.id='nationQuick0380';b.type='button';b.className='nationQuick0380';
      const sub=document.getElementById('selSub');
      sub?.insertAdjacentElement('afterend',b);
      b.addEventListener('click',()=>{const f=Number(b.dataset.faction);if(Number.isInteger(f)&&f>=0)renderNationDossier(f,'dip')});
    }
    const f=contextFaction0380(ctx);
    if(f>=0){
      b.dataset.faction=String(f);b.hidden=false;b.textContent='▦ '+(f===0?'TU NACIÓN':factionName3230(f));
    }else b.hidden=true;
  }

  const baseClassic0380=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const a=baseClassic0380.apply(this,arguments);
    updateQuickNationButton(ctx);
    const f=contextFaction0380(ctx);
    if(f>=0){
      const id='nation_dossier_0380';
      if(!a.some(x=>x.id===id)){
        a.push(classicAction3246(id,f===0?'TU NACIÓN':'FICHA DE NACIÓN','▦',
          f===0?'ESTADO NACIONAL':'DIPLOMACIA · COMERCIO · INTEL.',true,''));
      }
    }
    return a;
  };

  const baseContext0380=handleContextAction3244;
  handleContextAction3244=function(id){
    if(id==='nation_dossier_0380'){
      const ctx=uiInteractionState3244?.contextData;
      const f=contextFaction0380(ctx);
      if(f>=0){
        closeContextDialog3244();renderNationDossier(f,'dip');return;
      }
    }
    return baseContext0380.apply(this,arguments);
  };

  modalBody3244.addEventListener('click',e=>{
    const tab=e.target.closest?.('[data-nation-tab0380]');
    if(tab&&openNation>=0){renderNationDossier(openNation,tab.dataset.nationTab0380);return}
    const b=e.target.closest?.('[data-sc0380]');if(!b||openNation<=0)return;
    const a=b.dataset.sc0380;
    if(a==='embassy_request')requestEmbassy(0,openNation,true);
    else if(a==='embassy_accept')answerEmbassy(openNation,true);
    else if(a==='embassy_reject')answerEmbassy(openNation,false);
    else if(['trade','nap','alliance','peace','war'].includes(a))proposeTreaty(a,openNation);
    else if(a==='spy_deploy')deploySpy(0,openNation,true);
    else if(a.startsWith('op_'))runSpyOperation(openNation,a.slice(3)==='industry'?'industry':a.slice(3)==='labor'?'labor':a.slice(3)==='nationalist'?'nationalist':a.slice(3));
    renderNationDossier(openNation,openTab);
  });

  const baseRenderSystems0380=renderSystems3220;
  renderSystems3220=function(){
    const out=baseRenderSystems0380.apply(this,arguments);
    if(!started3230)return out;
    const host=document.getElementById('sysContent3213');if(!host)return out;
    if(sysTab3220==='research'){
      const l=techLevel(0),next=Math.min(5,l+1),cost=TECH_COST[next]||0;
      host.insertAdjacentHTML('beforeend','<div class="sysBlock3213 statecraftResearch0380"><b>🌐 Diplomacia internacional</b><div class="sysMeta3213">Nivel '+l+' · alcance formal '+reachDeg(0)+'°. El alcance aumenta qué naciones pueden recibir embajadas y tratados.</div>'+
        (l<5?'<button class="sysBtn3213" data-sc-research0380="1" '+(gold3212<cost?'disabled':'')+'>INVESTIGAR NIVEL '+next+' · '+cost+' ORO</button>':'<div class="sysMeta3213">Alcance diplomático global desbloqueado.</div>')+'</div>');
    }
    if(sysTab3220==='intel'){
      let active=0,avg=0;for(const [k,s] of spies){if(k.startsWith('0:')&&s.active){active++;avg+=s.level||0}}
      host.insertAdjacentHTML('beforeend','<div class="sysBlock3213"><b>🕵 Redes exteriores</b><div class="sysMeta3213">'+active+' redes activas'+(active?' · infiltración media '+Math.round(avg/active)+'%':'')+'. Abre la ficha de una nación para desplegar agentes u ordenar operaciones.</div></div>');
    }
    return out;
  };

  document.getElementById('sysContent3213')?.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-sc-research0380]');if(!b)return;
    const l=techLevel(0),next=Math.min(5,l+1),cost=TECH_COST[next]||0;
    if(l>=5||gold3212<cost)return;
    gold3212-=cost;dipTech[0]=next;save0380();renderSystems3220();
    notify('I+D diplomática nivel '+next+' · alcance '+reachDeg(0)+'°','research','research');
  });

  // Tratados positivos exigen embajada. Guerra y paz siguen disponibles.
  const baseSetRelation0380=setDiplomaticRelation3300;
  setDiplomaticRelation3300=function(a,b,v){
    if(!internalRelationChange&&v>0&&!hasEmbassy(Number(a),Number(b))){
      if(Number(a)===0||Number(b)===0)notify('Se necesita una embajada antes de firmar tratados','diplomacy','dip');
      return diplomaticRelation3300(Number(a),Number(b));
    }
    return baseSetRelation0380.apply(this,arguments);
  };

  // Reutiliza el reloj de economía; no añade intervalos.
  const baseEconomyTick0380=economyTick3212;
  economyTick3212=function(){
    const out=baseEconomyTick0380.apply(this,arguments);
    try{service0380()}catch(err){console.warn('[HEXATEGOS 0.38.0 statecraft]',err)}
    return out;
  };

  function serialize0380(){
    return {
      version:1,
      embassies:[...embassies],
      spies:[...spies],
      cities:[...cityState],
      operations:operations.filter(x=>x.until>now()),
      dipTech:Array.from(dipTech)
    };
  }
  function restore0380(s){
    if(!s||typeof s!=='object')return false;
    embassies=new Map(Array.isArray(s.embassies)?s.embassies:[]);
    spies=new Map(Array.isArray(s.spies)?s.spies:[]);
    cityState=new Map(Array.isArray(s.cities)?s.cities:[]);
    operations=Array.isArray(s.operations)?s.operations.filter(x=>x&&x.until>now()):[];
    const a=Array.isArray(s.dipTech)?s.dipTech:[];
    dipTech.fill(0);for(let i=0;i<Math.min(a.length,dipTech.length);i++)dipTech[i]=clamp(Number(a[i])||0,0,5);
    return true;
  }
  function save0380(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize0380()))}catch(_){}}
  function load0380(){
    if(restoredPortable){const s=restoredPortable;restoredPortable=null;return restore0380(s)}
    try{return restore0380(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'))}catch(_){return false}
  }

  const baseSave0380=saveGame3212;
  saveGame3212=function(){const out=baseSave0380.apply(this,arguments);if(started3230)save0380();return out};
  const baseLoad0380=loadGame3212;
  loadGame3212=function(){const out=baseLoad0380.apply(this,arguments);initialized=false;initialize0380();return out};
  const baseReset0380=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset0380.apply(this,arguments);
    embassies.clear();spies.clear();cityState.clear();operations=[];dipTech.fill(0);initialized=false;
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out;
  };

  if(typeof buildPortableFile3275==='function'){
    const basePortableBuild0380=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=basePortableBuild0380.apply(this,arguments);
      if(file?.payload)file.payload.statecraft0380=serialize0380();
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const basePortableApply0380=applyPortableFile3275;
    applyPortableFile3275=function(file){
      restoredPortable=file?.payload?.statecraft0380||null;
      const out=basePortableApply0380.apply(this,arguments);
      if(restoredPortable){initialized=false;initialize0380()}
      return out;
    };
  }

  window.HexategosStatecraft0380={
    version:BUILD,
    hasEmbassy,
    canContact,
    canTrade:tradeAllowedPair,
    reach:(f=0)=>reachDeg(Number(f)),
    tech:(f=0)=>techLevel(Number(f)),
    intel:(viewer,target)=>intelScore(Number(viewer),Number(target)),
    resourceTradeAllowed:(exporter,importer,r)=>resourceTradeAllowed(Number(exporter),Number(importer),Number(r)),
    resourceProductionMultiplier:(cell,r,f)=>resourceProductionMultiplier(Number(cell),Number(r),Number(f)),
    resourceProfile:(viewer,target)=>RESOURCE_LABELS.map((_,r)=>qualitativeResource(Number(viewer),Number(target),r)),
    stability:(cell)=>{const s=cityState.get(Number(cell));return s?{...s}:null},
    nationStability:(f)=>averageStability(Number(f)),
    dossier:(f,tab='dip')=>renderNationDossier(Number(f),tab),
    requestEmbassy:(a,b)=>requestEmbassy(Number(a),Number(b),false),
    deploySpy:(a,b)=>deploySpy(Number(a),Number(b),false),
    serialize:serialize0380
  };

  initialize0380();
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.38.0 · embajadas, alcance diplomático, inteligencia económica, operaciones y estabilidad');
})();
