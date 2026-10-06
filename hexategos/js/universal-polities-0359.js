'use strict';

// HEXATEGOS 0.35.9 · ENTIDADES POLÍTICAS UNIVERSALES.
// Todas las entidades se presentan y se juegan como naciones normales.
// La diferencia interna es únicamente el coste/frecuencia de decisión de su IA.
(() => {
  const BUILD='0.35.9';
  const API=window.HexategosMinorPolities0357;
  if(!API){console.warn('[HEXATEGOS 0.35.9] capa política base no disponible');return}

  const SAVE_KEY='hexategos-universal-polities-0359';
  const VIRTUAL_BASE=1000;
  const SNAP_PERIOD=10;
  const MAX_SAMPLES=24;
  const MAX_DIP_ROWS=260;
  const REL_LABEL={[-1]:'GUERRA',0:'NEUTRAL',1:'COMERCIO',2:'NO AGRESIÓN',3:'ALIANZA'};

  let states=[];
  let lastSnapCampaign=-1e9;
  let territoryCounts=new Int32Array(0);
  let samples=[];
  let borderPairs=[];
  let lastThinkCampaign=-1e9;
  let restored0359=null;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const vid=id=>VIRTUAL_BASE+id;
  const isVirtual=x=>Number.isInteger(x)&&x>=VIRTUAL_BASE;
  const mid=x=>x-VIRTUAL_BASE;

  function hash(x){
    x=(x|0)+0x9E3779B9;
    x=Math.imul(x^(x>>>16),0x21f0aaad);
    x=Math.imul(x^(x>>>15),0x735a2d97);
    return (x^(x>>>15))>>>0;
  }

  function defaultState(e){
    const p=e?.personality||'conformist';
    const h=hash((e?.id||0)+((e?.seed||0)*17));
    const active=p==='opportunist'?1.18:p==='commercial'?1.02:p==='defensive'?.82:p==='localist'?.62:.70;
    return {
      id:e.id,rel:0,opinion:(h%41)-20,trust:45+(h%16),
      gold:120+(h%180),troops:55+(h%110),warWeariness:0,
      nextThink:campaignSeconds3230+3+(h%8),decisionRate:active,
      cityCells:[],industryCells:[],portCells:[],roadPairs:[],
      lastBuild:-1e9,lastAction:-1e9
    };
  }

  function serialize(){
    return {version:1,states:states.map(s=>({
      id:s.id,rel:s.rel,opinion:s.opinion,trust:s.trust,gold:s.gold,troops:s.troops,
      warWeariness:s.warWeariness,nextThink:s.nextThink,decisionRate:s.decisionRate,
      cityCells:s.cityCells,industryCells:s.industryCells,portCells:s.portCells,roadPairs:s.roadPairs,
      lastBuild:s.lastBuild,lastAction:s.lastAction
    }))};
  }
  function save(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize()))}catch(_){}
  }
  function load(){
    try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch(_){return null}
  }

  function initStates(data=null){
    const entities=API.entities();
    const rows=Array.isArray(data?.states)?data.states:null;
    states=entities.map((e,i)=>{
      const base=defaultState(e),old=rows?.find?.(x=>x&&x.id===i);
      if(!old)return base;
      return Object.assign(base,old,{
        cityCells:Array.isArray(old.cityCells)?old.cityCells.slice(0,18):[],
        industryCells:Array.isArray(old.industryCells)?old.industryCells.slice(0,14):[],
        portCells:Array.isArray(old.portCells)?old.portCells.slice(0,10):[],
        roadPairs:Array.isArray(old.roadPairs)?old.roadPairs.slice(0,12):[]
      });
    });
    territoryCounts=new Int32Array(states.length);
    samples=Array.from({length:states.length},()=>[]);
    rebuildSnapshot(true);
    ensureStarterInfrastructure();
  }

  function rebuildSnapshot(force=false){
    if(!force&&campaignSeconds3230-lastSnapCampaign<SNAP_PERIOD)return;
    const t0=performance.now(),L=loadLevel(MAX_GAME_LEVEL3233);
    territoryCounts=new Int32Array(states.length);
    samples=Array.from({length:states.length},()=>[]);
    borderPairs=[];
    const pairSeen=new Set();

    for(let i=0;i<L.n;i++){
      const m=API.ownerIdAt(i);
      if(m<0||m>=states.length)continue;
      territoryCounts[m]++;
      const a=samples[m];
      if(a.length<MAX_SAMPLES)a.push(i);
      else{
        const n=territoryCounts[m],r=hash(i^m^n)%n;
        if(r<MAX_SAMPLES)a[r]=i;
      }
      const s=L.offsets[i],e=L.offsets[i+1];
      for(let k=s;k<e;k++){
        const n=L.edgeNbr[k];if(n<0||L.land[n]<0)continue;
        const major=owner6[n];
        const other=API.ownerIdAt(n);
        let key=null,pair=null;
        if(major>=0){
          key='m'+m+'|M'+major;pair={minor:m,otherKind:'major',other:major,a:i,b:n};
        }else if(other>=0&&other!==m){
          const lo=Math.min(m,other),hi=Math.max(m,other);
          key='m'+lo+'|m'+hi;pair={minor:m,otherKind:'minor',other,b:n,a:i};
        }
        if(key&&!pairSeen.has(key)){pairSeen.add(key);borderPairs.push(pair)}
      }
    }
    lastSnapCampaign=campaignSeconds3230;
    if(window.HexategosDiag033?.snapshot){
      window.__hexategos0359Perf={snapshotMs:performance.now()-t0,entities:states.length,borders:borderPairs.length};
    }
  }

  function ensureStarterInfrastructure(){
    for(const s of states){
      const e=API.entityRef(s.id);if(!e)continue;
      const c=e.seed;
      if(c>=0&&API.ownerIdAt(c)===s.id){
        if(!s.cityCells.length)s.cityCells=[c];
        cities3212.add(c);
        if(s.industryCells.includes(c))industries3212.add(c);
        if(s.portCells.includes(c))ports3212.add(c);
      }
    }
  }

  function relationWithPlayer(id){return states[id]?.rel??0}
  function setRelationWithPlayer(id,v,reason='decisión diplomática'){
    const s=states[id],e=API.entityRef(id);if(!s||!e)return false;
    const old=s.rel;s.rel=v;
    if(v===-1&&old!==-1){s.opinion-=18;s.trust-=14;toast('Guerra con '+e.name)}
    else if(v===0&&old===-1){s.warWeariness=Math.max(0,s.warWeariness-18);toast('Paz con '+e.name)}
    else toast((REL_LABEL[v]||'NEUTRAL')+' · '+e.name);
    s.opinion=clamp(s.opinion,-100,100);s.trust=clamp(s.trust,0,100);
    save();renderSystems3220();needsRender=true;return true;
  }

  function acceptance(id,type){
    const s=states[id],e=API.entityRef(id);if(!s||!e)return -999;
    let score=s.opinion*.55+(s.trust-50)*.5;
    const p=e.personality||'conformist';
    if(type==='trade')score+=22+(p==='commercial'?12:0);
    if(type==='nap')score+=14+(p==='conformist'||p==='defensive'?12:0);
    if(type==='alliance')score+=p==='defensive'?9:p==='localist'?-7:0;
    if(type==='peace')score+=s.warWeariness*.65+(s.troops<55?12:0);
    return score;
  }
  function threshold(type){return type==='trade'?2:type==='nap'?10:type==='alliance'?31:type==='peace'?7:999}

  function minorActionsHtml(id){
    const rel=relationWithPlayer(id),x=vid(id);
    if(rel===-1)return '<button class="good" onclick="playerDiplomaticAction3300('+x+',\'peace\')">Proponer paz</button>';
    if(rel===3)return '<button class="warn" onclick="playerDiplomaticAction3300('+x+',\'break\')">Romper alianza</button>';
    if(rel===2)return '<button class="good" onclick="playerDiplomaticAction3300('+x+',\'alliance\')">Proponer alianza</button><button class="warn" onclick="playerDiplomaticAction3300('+x+',\'break\')">Romper pacto</button>';
    if(rel===1)return '<button class="good" onclick="playerDiplomaticAction3300('+x+',\'nap\')">No agresión</button><button class="good" onclick="playerDiplomaticAction3300('+x+',\'alliance\')">Alianza</button><button class="warn" onclick="playerDiplomaticAction3300('+x+',\'break\')">Cancelar comercio</button><button class="danger" onclick="playerDiplomaticAction3300('+x+',\'war\')">Guerra</button>';
    return '<button class="good" onclick="playerDiplomaticAction3300('+x+',\'trade\')">Comercio</button><button onclick="playerDiplomaticAction3300('+x+',\'nap\')">No agresión</button><button class="danger" onclick="playerDiplomaticAction3300('+x+',\'war\')">Guerra</button>';
  }

  const basePlayerDip0359=playerDiplomaticAction3300;
  playerDiplomaticAction3300=function(other,type){
    if(!isVirtual(other))return basePlayerDip0359.apply(this,arguments);
    const id=mid(other),s=states[id],e=API.entityRef(id);if(!s||!e)return;
    const rel=s.rel;
    if(type==='war'){
      if(rel===-1)return;
      if(rel>0&&!confirm('Romper '+(REL_LABEL[rel]||'tratado').toLowerCase()+' y declarar la guerra a '+e.name+'?'))return;
      s.trust-=rel>0?24:8;s.opinion-=rel>0?18:8;
      return setRelationWithPlayer(id,-1,'declaración del jugador');
    }
    if(type==='break'){
      if(rel<=0)return;s.trust-=10;return setRelationWithPlayer(id,0,'tratado cancelado');
    }
    if(type==='peace'&&rel!==-1)return;
    if(type!=='peace'&&rel===-1){toast('Primero debes negociar la paz');return}
    const score=acceptance(id,type)+((Math.random()-.5)*12);
    if(score>=threshold(type)){
      const v=type==='trade'?1:type==='nap'?2:type==='alliance'?3:0;
      s.opinion+=6;s.trust+=5;setRelationWithPlayer(id,v,'acuerdo negociado');
    }else{
      s.opinion-=2;toast(e.name+' rechaza la propuesta');save();renderSystems3220();
    }
  };

  const baseRenderDip0359=renderDiplomacy3300;
  renderDiplomacy3300=function(){
    baseRenderDip0359.apply(this,arguments);
    const host=document.getElementById('sysContent3213');if(!host||!states.length)return;
    rebuildSnapshot(false);
    const rows=states.map((s,id)=>({id,s,e:API.entityRef(id),count:territoryCounts[id]||0}))
      .filter(x=>x.e&&x.count>0)
      .sort((a,b)=>b.count-a.count)
      .slice(0,MAX_DIP_ROWS);
    const html=rows.map(x=>{
      const rel=x.s.rel;
      return '<div class="sysRow3213"><i class="sysDot3213" style="background:'+(rel===-1?'#e86f70':rel===1?'#72d9c6':rel===2?'#d4c778':rel===3?'#78b7ff':'#788b9e')+'"></i><div>'+
        '<b>'+x.e.name+'</b><div class="sysMeta3213">'+(REL_LABEL[rel]||'NEUTRAL')+' · '+x.count.toLocaleString('es-ES')+' territorios</div>'+
        '<div class="sysActs3213">'+minorActionsHtml(x.id)+'</div></div><span></span></div>';
    }).join('');
    if(html)host.insertAdjacentHTML('beforeend',html);
  };

  function playerAdjacent(cell){
    const L=loadLevel(MAX_GAME_LEVEL3233),s=L.offsets[cell],e=L.offsets[cell+1];
    for(let k=s;k<e;k++){const n=L.edgeNbr[k];if(n>=0&&owner6[n]===playerCountry)return true}
    return false;
  }

  const baseUpdatePanel0359=updatePanel;
  updatePanel=function(){
    baseUpdatePanel0359.apply(this,arguments);
    if(!selected||selected.key!==MAX_GAME_LEVEL3233)return;
    const cell=selected.i,id=API.ownerIdAt(cell);
    if(id<0)return;
    const e=API.entityRef(id),s=states[id];if(!e||!s)return;
    selEl.textContent=e.name;
    selSub.textContent=(REL_LABEL[s.rel]||'NEUTRAL')+' · territorio '+(territoryCounts[id]||0).toLocaleString('es-ES');
    attackBtn.disabled=!(playerCountry>=0&&playerAdjacent(cell)&&gold3212>=8);
    attackBtn.textContent='⚔ OPERACIÓN';
  };

  function captureMinorByPlayer(target,id){
    if(playerCountry<0||!playerAdjacent(target)||gold3212<8)return false;
    const st=states[id],entity=API.entityRef(id);if(!st||!entity)return false;
    if(st.rel!==-1)setRelationWithPlayer(id,-1,'ataque del jugador');
    const L=loadLevel(MAX_GAME_LEVEL3233),strength=Number(strength3212.value),advance=Number(advance3212.value);
    let power=2+Math.floor(strength/25)+Math.floor(advance/25);
    const maxCells=1+Math.floor(advance/20)+Math.floor(strength/50);
    const q=[target],seen=new Set(q),captured=[];let head=0;
    while(head<q.length&&captured.length<maxCells&&power>0){
      const u=q[head++];if(API.ownerIdAt(u)!==id)continue;
      let friendly=-1;for(let k=L.offsets[u];k<L.offsets[u+1];k++){const n=L.edgeNbr[k];if(n>=0&&owner6[n]===playerCountry){friendly=n;break}}
      if(friendly<0)continue;
      let cost=1+(mountainTier3212[u]>=3?2:mountainTier3212[u]?1:0)+(forts3212[u]||0)*2;
      if(cost>power)continue;
      power-=cost;API.setOwner(u,-1);owner6[u]=playerCountry;forts3212[u]=0;captured.push(u);
      if(entity.seed===u){
        const replacement=samples[id]?.find(c=>API.ownerIdAt(c)===id&&c!==u);
        if(replacement>=0)API.setCapital(id,replacement);
      }
      for(let k=L.offsets[u];k<L.offsets[u+1];k++){const n=L.edgeNbr[k];if(n>=0&&API.ownerIdAt(n)===id&&!seen.has(n)){seen.add(n);q.push(n)}}
    }
    if(captured.length){
      gold3212-=Math.min(gold3212,8+captured.length*2);st.troops=Math.max(0,st.troops-captured.length*.7);
      cacheDirty=true;supplyDirty3220=true;aiSnapshotDirty3260=true;needsRender=true;
      rebuildSnapshot(true);API.refreshRanking();saveGame3212();save();
      toast('Operación: '+captured.length+' territorio'+(captured.length===1?'':'s')+' conquistado'+(captured.length===1?'':'s'));
      return true;
    }
    toast('La defensa y el terreno han detenido la operación');return false;
  }

  const baseOperation0359=operation3212;
  operation3212=function(target){
    const id=API.ownerIdAt(target);
    if(id>=0)return captureMinorByPlayer(target,id);
    return baseOperation0359.apply(this,arguments);
  };

  function structureValid(id,cell){return cell>=0&&API.ownerIdAt(cell)===id}
  function buildMinor(id){
    const st=states[id],e=API.entityRef(id);if(!st||!e)return;
    const arr=samples[id]||[];if(!arr.length)return;
    const now=campaignSeconds3230;if(now-st.lastBuild<9/st.decisionRate)return;
    st.lastBuild=now;
    const pick=arr[hash((now|0)^id)%arr.length];if(!structureValid(id,pick))return;

    const cities=st.cityCells.filter(c=>structureValid(id,c));
    const inds=st.industryCells.filter(c=>structureValid(id,c));
    const ports=st.portCells.filter(c=>structureValid(id,c));
    st.cityCells=cities;st.industryCells=inds;st.portCells=ports;

    if(st.gold>=80&&cities.length<Math.max(1,Math.ceil(Math.sqrt(Math.max(1,territoryCounts[id]))*.42))){
      st.gold-=80;if(!cities3212.has(pick)){cities3212.add(pick);st.cityCells.push(pick)};return;
    }
    if(st.gold>=110&&inds.length<Math.max(1,Math.ceil(cities.length*.65))){
      st.gold-=110;if(!industries3212.has(pick)){industries3212.add(pick);st.industryCells.push(pick)};return;
    }
    if(st.gold>=70&&isCoastal3212(pick)&&ports.length<Math.max(1,Math.ceil(cities.length*.22))){
      st.gold-=70;if(!ports3212.has(pick)){ports3212.add(pick);st.portCells.push(pick)};return;
    }
    if(st.gold>=50&&forts3212[pick]<2){
      st.gold-=50;forts3212[pick]++;
    }
  }

  function minorEconomyTick(){
    rebuildSnapshot(false);
    for(const st of states){
      const t=territoryCounts[st.id]||0;if(!t)continue;
      const city=st.cityCells.filter(c=>structureValid(st.id,c)).length;
      const ind=st.industryCells.filter(c=>structureValid(st.id,c)).length;
      const port=st.portCells.filter(c=>structureValid(st.id,c)).length;
      const gross=.014*t+.34*city+.62*ind+.28*port;
      const upkeep=.0018*st.troops+.025*st.cityCells.length;
      st.gold=clamp(st.gold+Math.max(-2.2,gross-upkeep)*Math.max(1,gameSpeed3212),0,9999);
      st.troops=clamp(st.troops+(.045+.0018*t+.012*city)*Math.max(1,gameSpeed3212),0,1200);
      if(st.rel===-1)st.warWeariness=clamp(st.warWeariness+.12*gameSpeed3212,0,100);
      else st.warWeariness=Math.max(0,st.warWeariness-.05*gameSpeed3212);
      buildMinor(st.id);
    }
  }

  function contactForMinor(id){
    const out=[];
    for(const p of borderPairs){
      if(p.minor===id)out.push(p);
      else if(p.otherKind==='minor'&&p.other===id)out.push({minor:id,otherKind:'minor',other:p.minor,a:p.b,b:p.a});
    }
    return out;
  }

  function thinkMinor(id){
    const st=states[id],e=API.entityRef(id);if(!st||!e||(territoryCounts[id]||0)<=0)return;
    const now=campaignSeconds3230;if(now<st.nextThink)return;
    const baseDelay=e.personality==='localist'?28:e.personality==='conformist'?23:e.personality==='defensive'?18:e.personality==='commercial'?16:12;
    st.nextThink=now+baseDelay/st.decisionRate+(id%5);
    const contacts=contactForMinor(id);
    if(!contacts.length)return;

    // Player diplomacy: same treaty set as every other nation; only propensity differs.
    const withPlayer=contacts.find(x=>x.otherKind==='major'&&x.other===0);
    if(withPlayer){
      if(st.rel===-1&&st.warWeariness>48&&acceptance(id,'peace')>threshold('peace'))setRelationWithPlayer(id,0,'desgaste de guerra');
      else if(st.rel===0){
        const roll=Math.random();
        if((e.personality==='commercial'&&roll<.24)||roll<.05)setRelationWithPlayer(id,1,'interés económico');
        else if((e.personality==='defensive'||e.personality==='conformist')&&roll<.09)setRelationWithPlayer(id,2,'estabilidad fronteriza');
        else if(e.personality==='opportunist'&&st.troops>110&&roll<.07)setRelationWithPlayer(id,-1,'tensión fronteriza');
      }
    }

    // Guerra real contra el jugador: puede quitarle territorio como cualquier nación.
    if(st.rel===-1&&withPlayer&&st.troops>28){
      const target=withPlayer.b;
      if(owner6[target]===0&&Math.random()<clamp(.22*st.decisionRate-(forts3212[target]||0)*.05,.04,.38)){
        owner6[target]=-1;API.setOwner(target,id);forts3212[target]=0;st.troops=Math.max(0,st.troops-1.2);
        cacheDirty=true;supplyDirty3220=true;aiSnapshotDirty3260=true;needsRender=true;
        rebuildSnapshot(true);API.refreshRanking();
      }
    }
  }

  function thinkAll(){
    if(!started3230||paused3230||gameSpeed3212<=0)return;
    rebuildSnapshot(false);
    const now=campaignSeconds3230;if(now-lastThinkCampaign<1.8)return;
    lastThinkCampaign=now;
    // Stagger: only a fraction of entities think on each pass.
    const bucket=Math.floor(now/1.8)%4;
    for(let id=bucket;id<states.length;id+=4)thinkMinor(id);
  }

  // Main-AI attacks against these nations are allowed only once a virtual war exists.
  // For now their diplomatic behaviour towards principal AIs is deliberately sparse
  // and border-driven, preserving performance.
  if(typeof aiTargetAllowed3260==='function'){
    const baseAllowed0359=aiTargetAllowed3260;
    aiTargetAllowed3260=function(f,target){
      const id=API.ownerIdAt(target);
      if(id>=0){
        // Major powers do not silently consume a neighbour: contact creates a
        // lightweight war state deterministically from aggression/personality.
        const e=API.entityRef(id),aggr=FACTIONS3230[f]?.aggr??.5;
        const gate=((hash(f*977+id*131+(Math.floor(campaignSeconds3230/30)))%1000)/1000);
        return gate<Math.max(.035,(aggr-.42)*.18+(e?.personality==='opportunist'?.025:0));
      }
      return baseAllowed0359.apply(this,arguments);
    };
  }

  const baseEco0359=economyTick3212;
  economyTick3212=function(){
    const out=baseEco0359.apply(this,arguments);
    if(started3230){minorEconomyTick();thinkAll()}
    return out;
  };

  // Trade with any nation affects the player's economy identically.
  const baseIncome0359=income3212;
  income3212=function(){
    let extra=0;
    for(const st of states)if(st.rel===1||st.rel===3)extra+=.32+Math.min(1.25,(territoryCounts[st.id]||0)*.004);
    return baseIncome0359.apply(this,arguments)+extra;
  };

  // Draw their infrastructure using the exact same symbols as all other nations.
  const baseInfra0359=drawInfrastructure3212;
  drawInfrastructure3212=function(R,cx,cy,now){
    const out=baseInfra0359.apply(this,arguments);
    if(zoom<2.15||currentKey!==MAX_GAME_LEVEL3233||!states.length)return out;
    const L=loadLevel(MAX_GAME_LEVEL3233),C=L.centers,px=globeIconScale3249();
    let drawn=0;
    for(const st of states){
      const lists=[['city',st.cityCells],['industry',st.industryCells],['port',st.portCells]];
      for(const [kind,list] of lists)for(const cell of list){
        if(drawn>260||!structureValid(st.id,cell))continue;
        const j=cell*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
        if(!globeIconVisible3249(p,.075))continue;
        if(kind==='city')drawGlobeCityIcon3249(p[0],p[1],cell,px*.82);
        else if(kind==='industry')drawGlobeIndustryIcon3249(p[0],p[1],cell,px*.80);
        else drawGlobePortIcon3249(p[0],p[1],cell,px*.80);
        drawn++;
      }
    }
    return out;
  };

  // Portable/local persistence.
  if(typeof buildPortableFile3276==='function'){
    const baseBuild0359=buildPortableFile3276;
    buildPortableFile3276=function(){
      const file=baseBuild0359.apply(this,arguments);
      file.gameVersion='0.35.9';file.payload.universalPolities0359=serialize();
      if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const baseApply0359=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const out=baseApply0359.apply(this,arguments);
      restored0359=file?.payload?.universalPolities0359||null;
      setTimeout(()=>initStates(restored0359),0);return out;
    };
  }
  const baseSave0359=saveGame3212;
  saveGame3212=function(){const out=baseSave0359.apply(this,arguments);save();return out};

  const baseLoad0359=loadGame3212;
  loadGame3212=function(){
    restored0359=load();
    const out=baseLoad0359.apply(this,arguments);
    setTimeout(()=>initStates(restored0359),0);return out;
  };

  const baseReset0359=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset0359.apply(this,arguments);
    states=[];territoryCounts=new Int32Array(0);samples=[];borderPairs=[];
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out;
  };

  function stats(){
    rebuildSnapshot(false);
    return {
      version:BUILD,entities:states.length,territory:Array.from(territoryCounts),
      borders:borderPairs.length,relations:states.reduce((a,s)=>{a[s.rel]=(a[s.rel]||0)+1;return a},{}),
      perf:window.__hexategos0359Perf||null
    };
  }

  window.HexategosUniversalPolities0359={
    version:BUILD,stats,state:id=>states[id]?{...states[id]}:null,
    relation:id=>relationWithPlayer(id),refresh:()=>{rebuildSnapshot(true);API.refreshRanking();renderSystems3220()}
  };
  window.HEXATEGOS_VERSION=BUILD;

  setTimeout(()=>{
    initStates(load());
    API.refreshRanking();
  },0);

  console.info('[HEXATEGOS] 0.35.9 entidades políticas universales activas');
})();
