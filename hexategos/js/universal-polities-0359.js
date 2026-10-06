'use strict';

// HEXATEGOS 0.36.2 · MUNDO DE ~500 NACIONES + IA INTERCAMBIABLE.
// Todas las entidades se presentan y se juegan como naciones normales.
// La diferencia interna es únicamente el coste/frecuencia de decisión de su IA.
(() => {
  const BUILD='0.36.2';
  const API=window.HexategosMinorPolities0357;
  if(!API){console.warn('[HEXATEGOS 0.35.9] capa política base no disponible');return}

  const SAVE_KEY='hexategos-universal-polities-0359';
  const VIRTUAL_BASE=1000;
  const SNAP_PERIOD=10;
  const MAX_SAMPLES=24;
  const MAX_DIP_ROWS=560;
  const REL_LABEL={[-1]:'GUERRA',0:'NEUTRAL',1:'COMERCIO',2:'NO AGRESIÓN',3:'ALIANZA'};

  let states=[];
  let lastSnapCampaign=-1e9;
  let territoryCounts=new Int32Array(0);
  let samples=[];
  let borderPairs=[];
  let lastThinkCampaign=-1e9;
  let restored0359=null;
  let minorWars0359=new Map(); // mapa disperso de relación nación↔nación: -1..3
  let majorMinorRelations0359=new Map();
  let tradeDegree0359=new Uint16Array(0);
  let rankingLastWall0362=-1e9,rankingSignature0362='';
  let majorRoles0359=[];
  let majorNextReview0359=[];
  let majorDoctrineCursor0359=1;
  let lastMajorDoctrinePass0359=-1e9;

  const MINDSETS0359=['conformist','commercial','defensive','opportunist','localist'];
  const MAIN_ROLES0359=['balanced','growth','defense','aggressive','naval'];

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

  function mindsetRate0359(p){
    return p==='opportunist'?1.18:p==='commercial'?1.02:p==='defensive'?.82:p==='localist'?.62:.70;
  }
  function settlementFloor0359(p,h){
    const base=p==='opportunist'?42:p==='commercial'?30:p==='defensive'?24:p==='conformist'?16:10;
    const spread=p==='opportunist'?70:p==='commercial'?48:p==='defensive'?36:p==='conformist'?28:18;
    return base+(h%spread);
  }
  function defaultState(e){
    const p=e?.personality||'conformist';
    const h=hash((e?.id||0)+((e?.seed||0)*17));
    return {
      id:e.id,rel:0,opinion:(h%41)-20,trust:45+(h%16),
      gold:120+(h%180),troops:55+(h%110),warWeariness:0,
      mindset:p,bornAt:campaignSeconds3230,nextMindsetReview:campaignSeconds3230+18+(h%28),
      settlementFloor:settlementFloor0359(p,h),
      nextThink:campaignSeconds3230+3+(h%8),decisionRate:mindsetRate0359(p),
      cityCells:[],industryCells:[],portCells:[],roadPairs:[],
      lastBuild:-1e9,lastAction:-1e9,eliminatedAt:-1
    };
  }

  function serialize(){
    return {version:2,states:states.map(s=>({
      id:s.id,rel:s.rel,opinion:s.opinion,trust:s.trust,gold:s.gold,troops:s.troops,
      warWeariness:s.warWeariness,mindset:s.mindset,bornAt:s.bornAt,
      nextMindsetReview:s.nextMindsetReview,settlementFloor:s.settlementFloor,
      nextThink:s.nextThink,decisionRate:s.decisionRate,eliminatedAt:s.eliminatedAt,
      cityCells:s.cityCells,industryCells:s.industryCells,portCells:s.portCells,roadPairs:s.roadPairs,
      lastBuild:s.lastBuild,lastAction:s.lastAction
    })),
    minorWars:[...minorWars0359.entries()],
    majorMinorRelations:[...majorMinorRelations0359.entries()],
    majorRoles:majorRoles0359.slice(),
    majorNextReview:majorNextReview0359.slice()};
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
      const merged=Object.assign(base,old,{
        cityCells:Array.isArray(old.cityCells)?old.cityCells.slice(0,18):[],
        industryCells:Array.isArray(old.industryCells)?old.industryCells.slice(0,14):[],
        portCells:Array.isArray(old.portCells)?old.portCells.slice(0,10):[],
        roadPairs:Array.isArray(old.roadPairs)?old.roadPairs.slice(0,12):[]
      });
      merged.mindset=MINDSETS0359.includes(merged.mindset)?merged.mindset:(e.personality||'conformist');
      merged.decisionRate=mindsetRate0359(merged.mindset);
      if(!Number.isFinite(merged.settlementFloor)||merged.settlementFloor<6)
        merged.settlementFloor=settlementFloor0359(merged.mindset,hash(i*131+(e.seed||0)));
      return merged;
    });
    minorWars0359=new Map(Array.isArray(data?.minorWars)?data.minorWars:[]);
    majorMinorRelations0359=new Map(Array.isArray(data?.majorMinorRelations)?data.majorMinorRelations:[]);
    tradeDegree0359=new Uint16Array(states.length);
    majorRoles0359=Array.isArray(data?.majorRoles)?data.majorRoles.slice(0,activeFactionCount3230):[];
    majorNextReview0359=Array.isArray(data?.majorNextReview)?data.majorNextReview.slice(0,activeFactionCount3230):[];
    for(let f=1;f<activeFactionCount3230;f++){
      const role=MAIN_ROLES0359.includes(majorRoles0359[f])?majorRoles0359[f]:(FACTIONS3230[f]?.role||'balanced');
      majorRoles0359[f]=role;
      if(FACTIONS3230[f])FACTIONS3230[f].role=role;
      if(!Number.isFinite(majorNextReview0359[f]))majorNextReview0359[f]=campaignSeconds3230+25+(f%7)*5;
    }
    territoryCounts=new Int32Array(states.length);
    samples=Array.from({length:states.length},()=>[]);
    rebuildTradeDegree0359();
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
      const raw=typeof API.rawOwnerIdAt==='function'?API.rawOwnerIdAt(i):API.ownerIdAt(i);
      // Si una nación principal ha conquistado esta casilla, se elimina la
      // propiedad compacta subyacente para impedir "reapariciones fantasma".
      if(owner6[i]>=0){
        if(raw>=0)API.setOwner(i,-1);
        continue;
      }
      const m=raw;
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
    // Reasignar capitales perdidas y marcar eliminaciones sin un escaneo extra.
    for(let id=0;id<states.length;id++){
      const st=states[id],e=API.entityRef(id),count=territoryCounts[id]||0;
      if(!st||!e)continue;
      if(count<=0){
        if(st.eliminatedAt<0)st.eliminatedAt=campaignSeconds3230;
        continue;
      }
      st.eliminatedAt=-1;
      if(API.ownerIdAt(e.seed)!==id){
        const replacement=samples[id]?.find(c=>API.ownerIdAt(c)===id);
        if(replacement>=0)API.setCapital(id,replacement);
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
    const p=s.mindset||e.personality||'conformist';
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
    if(playerCountry<0||gold3212<8)return false;
    const st=states[id],entity=API.entityRef(id);if(!st||!entity)return false;
    if(!playerAdjacent(target)){toast('Necesitas contacto terrestre con '+entity.name);return false}
    if(st.rel!==-1){
      if(st.rel>0&&!confirm('Hay un acuerdo vigente con '+entity.name+'. ¿Romperlo y declarar la guerra?'))return false;
      setRelationWithPlayer(id,-1,'ataque del jugador');
    }
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

  function findVirtualPath0359(target,id){
    const L=loadLevel(MAX_GAME_LEVEL3233);
    if(target<0||L.land[target]<0||API.ownerIdAt(target)!==id)return null;
    const prev=new Int32Array(L.n);prev.fill(-2);
    const q=new Int32Array(L.n);let h=0,t=0;q[t++]=target;prev[target]=-1;let source=-1;
    while(h<t&&t<L.n){
      const u=q[h++],s=L.offsets[u],e=L.offsets[u+1];
      for(let k=s;k<e;k++){
        const n=L.edgeNbr[k];if(n<0||L.land[n]<0||prev[n]!==-2)continue;
        if(owner6[n]===0){prev[n]=u;source=n;h=t;break}
        if(owner6[n]>=0)continue;
        const m=API.ownerIdAt(n);
        if(m>=0&&m!==id)continue;
        prev[n]=u;q[t++]=n;
      }
    }
    if(source<0)return null;
    const path=[source];let u=prev[source],guard=0;
    while(u>=0&&guard++<L.n){path.push(u);if(u===target)break;u=prev[u]}
    return path[path.length-1]===target?path:null;
  }

  function createVirtualFront0359(target,id){
    const st=states[id],entity=API.entityRef(id);if(!st||!entity||API.ownerIdAt(target)!==id)return null;
    if(activeFronts3230.length>=4){toast('Máximo 4 frentes simultáneos');return null}
    if(st.rel===3){toast('Es un aliado · rompe la alianza antes de atacar');return null}
    if(st.rel>0&&!confirm('Hay un acuerdo vigente con '+entity.name+'. ¿Romperlo y declarar la guerra?'))return null;
    if(st.rel!==-1)setRelationWithPlayer(id,-1,'declaración del jugador');
    const path=findVirtualPath0359(target,id);
    if(!path){toast(isCoastal3212(target)?'Sin ruta terrestre · utiliza transporte naval':'No existe una ruta terrestre válida');return null}
    const pool=allocateFrontTroops3230();if(pool<1)return null;
    const adv=Number(advance3212.value);
    const front={
      id:nextFrontId3230++,kind:'war',goal:target,target:path[1]??target,targetOwner:-1,
      virtualMinorId:id,targetGeo:loadLevel(MAX_GAME_LEVEL3233).land[target],
      pool,initial:pool,status:adv>=60?'ocupación amplia':'asalto rápido',advance:adv,
      route:path,secureBudget:adv>=60?Math.max(3,Math.min(22,Math.floor(pool/12))):0,
      secured:0,lastSrc:path[0],ticks:0
    };
    activeFronts3230.push(front);activeFrontId3230=front.id;
    toast(Math.floor(pool)+' tropas comprometidas contra '+entity.name);
    banner3230('⚔ '+entity.name);updateUI3230();updateFrontDock3220(true);needsRender=true;saveGame3212();
    return front;
  }

  function captureVirtualFrontCell0359(front,target,src){
    const id=front.virtualMinorId,st=states[id];if(!st)return false;
    const defenderId=API.ownerIdAt(target),enemy=defenderId===id;
    let terrain=0;
    if(mountainTier3212[target]>=3)terrain+=1.1;else if(mountainTier3212[target])terrain+=.5;
    if(typeof riverCross3230==='function'&&riverCross3230(src,target))terrain+=.55;
    if(typeof roadCross3230==='function'&&roadCross3230(src,target))terrain=Math.max(0,terrain-.55);
    const cost=(enemy?1.55:.65)+terrain*.35;if(front.pool<cost)return false;
    front.pool-=cost;
    let p=.94;
    if(enemy){
      const defender=Math.max(12,st.troops||50),ratio=front.pool/(front.pool+defender),supply=supplyAt3230(src)/100;
      p=.27+ratio*.44+.09*(Number(strength3212.value)/100)+.10*supply-(forts3212[target]||0)*.11-terrain*.07;
      p=clamp(p,.07,.82);
    }
    if(Math.random()>=p){front.pool=Math.max(0,front.pool-(enemy?1.05:.20));return false}
    if(enemy){
      API.setOwner(target,-1);
      territoryCounts[id]=Math.max(0,(territoryCounts[id]||0)-1);
      st.troops=Math.max(0,st.troops-(1.1+front.pool*.003));
      relocateOrEliminate0359(id,target);
    }
    owner6[target]=0;forts3212[target]=0;front.pool=Math.max(0,front.pool-(enemy?.42:.08));
    front.lastSrc=target;cacheDirty=true;supplyDirty3220=true;aiSnapshotDirty3260=true;needsRender=true;
    return true;
  }

  function nextVirtualTarget0359(front){
    if(front.secureBudget<=0)return -1;
    const id=front.virtualMinorId,L=loadLevel(MAX_GAME_LEVEL3233),base=front.lastSrc>=0?front.lastSrc:front.goal;
    const opts=[];
    for(let k=L.offsets[base];k<L.offsets[base+1];k++){
      const n=L.edgeNbr[k];if(n>=0&&API.ownerIdAt(n)===id)opts.push(n);
    }
    return opts.length?opts[hash((campaignSeconds3230|0)^front.id^base)%opts.length]:-1;
  }

  const baseCreateFront0359=createFront3230;
  createFront3230=function(target,poolOverride=null,kindOverride=null){
    const id=API.ownerIdAt(target);
    if(id>=0&&poolOverride===null)return createVirtualFront0359(target,id);
    return baseCreateFront0359.apply(this,arguments);
  };

  const baseFrontTick0359=frontTick3230;
  frontTick3230=function(front){
    if(front?.virtualMinorId==null)return baseFrontTick0359.apply(this,arguments);
    const id=front.virtualMinorId,st=states[id];
    if(!st||(territoryCounts[id]||0)<=0){finishFront3230(front,'Nación derrotada',1);return}
    if(front.pool<1){finishFront3230(front,'Frente agotado',0);return}
    if(owner6[front.goal]===0){
      const extra=front.advance>=60?nextVirtualTarget0359(front):-1;
      if(extra<0){finishFront3230(front,'Objetivo conquistado',1);return}
      front.target=extra;front.status='asegurando';
      if(captureVirtualFrontCell0359(front,extra,front.lastSrc)){front.secureBudget--;front.secured++}
      front.ticks++;return;
    }
    const path=findVirtualPath0359(front.goal,id);
    if(!path||path.length<2){front.status='sin contacto';return}
    front.route=path;front.target=path[1];front.lastSrc=path[0];front.status='combate';
    captureVirtualFrontCell0359(front,front.target,front.lastSrc);front.ticks++;
    if((front.ticks%3)===0){rebuildSnapshot(true);API.refreshRanking()}
  };

  const baseOperation0359=operation3212;
  operation3212=function(target){
    const id=API.ownerIdAt(target);
    if(id>=0)return createVirtualFront0359(target,id);
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
      st.gold-=80;if(!st.cityCells.includes(pick))st.cityCells.push(pick);return;
    }
    if(st.gold>=110&&inds.length<Math.max(1,Math.ceil(cities.length*.65))){
      st.gold-=110;if(!st.industryCells.includes(pick))st.industryCells.push(pick);return;
    }
    if(st.gold>=70&&isCoastal3212(pick)&&ports.length<Math.max(1,Math.ceil(cities.length*.22))){
      st.gold-=70;if(!st.portCells.includes(pick))st.portCells.push(pick);return;
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
      const tradeBonus=(tradeDegree0359[st.id]||0)*.11;
      const gross=.014*t+.34*city+.62*ind+.28*port+tradeBonus;
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

  function warKey0359(a,b){return a<b?a+'|'+b:b+'|'+a}
  function minorRelation0359(a,b){return minorWars0359.get(warKey0359(a,b))??0}
  function setMinorRelation0359(a,b,v){
    const key=warKey0359(a,b);
    if(v===0)minorWars0359.delete(key);else minorWars0359.set(key,v);
    rebuildTradeDegree0359();
  }
  function atWarMinor0359(a,b){return minorRelation0359(a,b)===-1}
  function setMinorWar0359(a,b,on){setMinorRelation0359(a,b,on?-1:0)}

  function majorMinorKey0359(f,id){return f+'|'+id}
  function majorMinorRelation0359(f,id){return majorMinorRelations0359.get(majorMinorKey0359(f,id))??0}
  function setMajorMinorRelation0359(f,id,v){
    const key=majorMinorKey0359(f,id);
    if(v===0)majorMinorRelations0359.delete(key);else majorMinorRelations0359.set(key,v);
  }
  function rebuildTradeDegree0359(){
    tradeDegree0359=new Uint16Array(states.length);
    for(const [key,v] of minorWars0359){
      if(v!==1&&v!==3)continue;
      const [a,b]=key.split('|').map(Number);
      if(a>=0&&a<tradeDegree0359.length)tradeDegree0359[a]++;
      if(b>=0&&b<tradeDegree0359.length)tradeDegree0359[b]++;
    }
  }

  function maybeChangeMindset0359(id){
    const st=states[id],e=API.entityRef(id);if(!st||!e)return;
    const now=campaignSeconds3230;if(now<st.nextMindsetReview)return;
    const age=Math.max(0,now-(st.bornAt||0));
    st.nextMindsetReview=now+(age<300?32:age<600?65:170)+(id%17);
    const chance=age<300?.24:age<600?.085:.012;
    if(Math.random()>chance)return;

    const current=st.mindset||'conformist';
    let pool;
    if(st.warWeariness>55||st.troops<35)pool=['defensive','conformist','localist'];
    else if((territoryCounts[id]||0)<Math.max(8,st.settlementFloor*.55))pool=['opportunist','commercial','defensive'];
    else if(current==='opportunist')pool=['opportunist','commercial','defensive','conformist'];
    else if(current==='localist')pool=['localist','conformist','commercial','defensive'];
    else pool=MINDSETS0359;
    const next=pool[hash(id*911+(now|0)+Math.floor(Math.random()*100000))%pool.length];
    st.mindset=next;
    st.decisionRate=mindsetRate0359(next);
    // El objetivo territorial también puede evolucionar, pero nunca cae por
    // debajo de un mínimo que obligue a toda entidad a intentar crecer algo.
    const evolved=settlementFloor0359(next,hash(id*313+(now|0)));
    st.settlementFloor=Math.max(8,Math.round(st.settlementFloor*.58+evolved*.42));
  }

  function tryPeacefulExpansion0359(id){
    const st=states[id];if(!st)return false;
    const count=territoryCounts[id]||0;if(count<=0)return false;
    const L=loadLevel(MAX_GAME_LEVEL3233),arr=samples[id]||[];
    if(!arr.length)return false;
    const urgency=count<st.settlementFloor?1:st.mindset==='opportunist'?.18:st.mindset==='commercial'?.11:st.mindset==='defensive'?.07:.035;
    if(Math.random()>urgency)return false;
    const attempts=count<st.settlementFloor?3:1;
    let expanded=false;
    for(let a=0;a<attempts;a++){
      const src=arr[hash(id*733+(campaignSeconds3230|0)+a*17)%arr.length];
      if(API.ownerIdAt(src)!==id)continue;
      const s=L.offsets[src],e=L.offsets[src+1],opts=[];
      for(let k=s;k<e;k++){
        const n=L.edgeNbr[k];
        if(n>=0&&L.land[n]>=0&&owner6[n]<0&&API.ownerIdAt(n)<0)opts.push(n);
      }
      if(!opts.length)continue;
      const target=opts[hash(src^id^a^(campaignSeconds3230|0))%opts.length];
      API.setOwner(target,id);territoryCounts[id]++;expanded=true;
    }
    return expanded;
  }

  function relocateOrEliminate0359(id,lostCell){
    const st=states[id],e=API.entityRef(id);if(!st||!e)return;
    const count=territoryCounts[id]||0;
    if(count<=0){
      st.eliminatedAt=campaignSeconds3230;
      for(const key of [...minorWars0359.keys()])if(key.startsWith(id+'|')||key.endsWith('|'+id))minorWars0359.delete(key);
      return;
    }
    if(e.seed===lostCell||API.ownerIdAt(e.seed)!==id){
      const replacement=(samples[id]||[]).find(c=>c!==lostCell&&API.ownerIdAt(c)===id);
      if(replacement>=0)API.setCapital(id,replacement);
    }
  }

  function attackMinorNeighbour0359(id,contact){
    const st=states[id],def=states[contact.other];
    if(!st||!def||contact.otherKind!=='minor'||!atWarMinor0359(id,contact.other))return false;
    const target=contact.b;
    if(API.ownerIdAt(target)!==contact.other||st.troops<18)return false;
    const ratio=st.troops/Math.max(16,def.troops);
    const chance=clamp(.13+(ratio-1)*.14+(st.mindset==='opportunist'?.08:0)-(forts3212[target]||0)*.055,.035,.48);
    if(Math.random()>chance){st.troops=Math.max(0,st.troops-.22);return false}
    API.setOwner(target,id);
    territoryCounts[id]=(territoryCounts[id]||0)+1;
    territoryCounts[contact.other]=Math.max(0,(territoryCounts[contact.other]||0)-1);
    forts3212[target]=0;
    st.troops=Math.max(0,st.troops-.75);
    def.troops=Math.max(0,def.troops-1.15);
    st.lastAction=campaignSeconds3230;
    relocateOrEliminate0359(contact.other,target);
    needsRender=true;
    return true;
  }

  function maybeMinorDiplomacy0359(id,contacts){
    const st=states[id];if(!st)return;
    const p=st.mindset||'conformist';
    const neighbours=contacts.filter(x=>x.otherKind==='minor'&&(territoryCounts[x.other]||0)>0);
    if(!neighbours.length)return;
    const c=neighbours[hash(id*577+(campaignSeconds3230|0))%neighbours.length];
    const rel=minorRelation0359(id,c.other);
    const roll=Math.random();
    if(rel===0){
      if(p==='commercial'&&roll<.075)setMinorRelation0359(id,c.other,1);
      else if((p==='defensive'||p==='conformist')&&roll<.055)setMinorRelation0359(id,c.other,2);
      else if(p==='localist'&&roll<.025)setMinorRelation0359(id,c.other,2);
      else if(roll<.006)setMinorRelation0359(id,c.other,3);
    }else if(rel>0&&roll<.006){
      setMinorRelation0359(id,c.other,0);
    }
  }

  function attackMajorNeighbour0359(id,contact){
    const st=states[id],f=contact.other;
    if(!st||contact.otherKind!=='major'||f<=0||majorMinorRelation0359(f,id)!==-1)return false;
    const target=contact.b;if(owner6[target]!==f||st.troops<24)return false;
    const ratio=st.troops/Math.max(20,troops3230[f]||60);
    const chance=clamp(.10+(ratio-1)*.12+(st.mindset==='opportunist'?.075:0)-(forts3212[target]||0)*.05,.025,.34);
    if(Math.random()>chance){st.troops=Math.max(0,st.troops-.18);return false}
    owner6[target]=-1;API.setOwner(target,id);forts3212[target]=0;
    territoryCounts[id]=(territoryCounts[id]||0)+1;
    st.troops=Math.max(0,st.troops-.85);troops3230[f]=Math.max(0,(troops3230[f]||0)-1.2);
    if(capitals[f]===target){
      const next=chooseEmergencyCapital3230(f,target);
      if(next>=0)setCapital3230(f,next,'forced');else capitals[f]=-1;
    }
    cacheDirty=true;supplyDirty3220=true;aiSnapshotDirty3260=true;needsRender=true;
    return true;
  }

  function maybeMajorMinorDiplomacy0359(id,contacts){
    const st=states[id];if(!st)return;
    const p=st.mindset||'conformist';
    const neighbours=contacts.filter(x=>x.otherKind==='major'&&x.other>0);
    if(!neighbours.length)return;
    const c=neighbours[hash(id*839+(campaignSeconds3230|0))%neighbours.length],f=c.other;
    let rel=majorMinorRelation0359(f,id);
    const roll=Math.random();
    if(rel===0){
      if(p==='commercial'&&roll<.055)setMajorMinorRelation0359(f,id,1);
      else if((p==='defensive'||p==='conformist')&&roll<.04)setMajorMinorRelation0359(f,id,2);
      else if(p==='opportunist'&&st.troops>80&&roll<.035)setMajorMinorRelation0359(f,id,-1);
    }else if(rel>0&&roll<.004)setMajorMinorRelation0359(f,id,0);
    rel=majorMinorRelation0359(f,id);
    if(rel===-1)attackMajorNeighbour0359(id,c);
  }

  function maybeMinorWar0359(id,contacts){
    const st=states[id];if(!st)return false;
    const candidates=contacts.filter(x=>x.otherKind==='minor'&&(territoryCounts[x.other]||0)>0&&minorRelation0359(id,x.other)<=0);
    if(!candidates.length)return false;
    const active=candidates.find(x=>atWarMinor0359(id,x.other));
    if(active){
      const def=states[active.other];
      if(st.warWeariness>72&&Math.random()<.22){setMinorWar0359(id,active.other,false);st.warWeariness*=.55;return false}
      return attackMinorNeighbour0359(id,active);
    }
    const p=st.mindset||'conformist';
    const aggression=p==='opportunist'?.11:p==='commercial'?.025:p==='defensive'?.018:p==='conformist'?.009:.006;
    if(Math.random()>aggression)return false;
    const target=candidates
      .map(x=>({x,ratio:st.troops/Math.max(15,states[x.other]?.troops||50),size:(territoryCounts[x.other]||1)}))
      .sort((a,b)=>(b.ratio-a.ratio)||a.size-b.size)[0];
    if(!target||target.ratio<(p==='opportunist'?.82:1.02))return false;
    setMinorWar0359(id,target.x.other,true);
    return attackMinorNeighbour0359(id,target.x);
  }

  function maybeChangeMainDoctrine0359(){
    const now=campaignSeconds3230;if(now-lastMajorDoctrinePass0359<8||activeFactionCount3230<=1)return;
    lastMajorDoctrinePass0359=now;
    const f=majorDoctrineCursor0359++;
    if(majorDoctrineCursor0359>=activeFactionCount3230)majorDoctrineCursor0359=1;
    if(f<=0||f>=activeFactionCount3230||now<(majorNextReview0359[f]||0))return;
    const early=now<300,mid=now<600;
    majorNextReview0359[f]=now+(early?32:mid?70:190)+(f%9);
    if(Math.random()>(early?.20:mid?.065:.012))return;
    let pool=MAIN_ROLES0359;
    const coast=typeof aiNationalCoast3275!=='undefined'&&(aiNationalCoast3275[f]?.length||0)>0;
    if(!coast)pool=pool.filter(x=>x!=='naval');
    const next=pool[hash(f*137+(now|0)+Math.floor(Math.random()*10000))%pool.length];
    majorRoles0359[f]=next;
    if(FACTIONS3230[f])FACTIONS3230[f].role=next;
    try{
      if(aiNationalPlan3275?.[f])aiNationalPlan3275[f].nextReview=0;
      if(regionalPlans3284?.[f])regionalPlans3284[f].nextEval=0;
    }catch(_){}
  }

  function thinkMinor(id){
    const st=states[id],e=API.entityRef(id);if(!st||!e||(territoryCounts[id]||0)<=0)return;
    const now=campaignSeconds3230;if(now<st.nextThink)return;
    maybeChangeMindset0359(id);
    const p=st.mindset||e.personality||'conformist';
    const baseDelay=p==='localist'?28:p==='conformist'?23:p==='defensive'?18:p==='commercial'?16:12;
    st.nextThink=now+baseDelay/st.decisionRate+(id%5);
    const expanded=tryPeacefulExpansion0359(id);
    const contacts=contactForMinor(id);
    if(!contacts.length){if(expanded)needsRender=true;return}

    // Player diplomacy: same treaty set as every other nation; only propensity differs.
    const withPlayer=contacts.find(x=>x.otherKind==='major'&&x.other===0);
    if(withPlayer){
      if(st.rel===-1&&st.warWeariness>48&&acceptance(id,'peace')>threshold('peace'))setRelationWithPlayer(id,0,'desgaste de guerra');
      else if(st.rel===0){
        const roll=Math.random();
        if((p==='commercial'&&roll<.24)||roll<.05)setRelationWithPlayer(id,1,'interés económico');
        else if((p==='defensive'||p==='conformist')&&roll<.09)setRelationWithPlayer(id,2,'estabilidad fronteriza');
        else if(p==='opportunist'&&st.troops>110&&roll<.07)setRelationWithPlayer(id,-1,'tensión fronteriza');
      }
    }

    // Guerra real contra el jugador: puede quitarle territorio como cualquier nación.
    if(st.rel===-1&&withPlayer&&st.troops>28){
      const target=withPlayer.b;
      if(owner6[target]===0&&Math.random()<clamp(.22*st.decisionRate-(forts3212[target]||0)*.05,.04,.38)){
        owner6[target]=-1;API.setOwner(target,id);forts3212[target]=0;st.troops=Math.max(0,st.troops-1.2);
        cacheDirty=true;supplyDirty3220=true;aiSnapshotDirty3260=true;needsRender=true;
        territoryCounts[id]=(territoryCounts[id]||0)+1;
      }
    }

    // Diplomacia dispersa entre las ~500 naciones: mismas relaciones, sin
    // construir una matriz 500×500 ni revisar pares que nunca tienen contacto.
    maybeMinorDiplomacy0359(id,contacts);
    maybeMajorMinorDiplomacy0359(id,contacts);
    maybeMinorWar0359(id,contacts);
  }

  function thinkAll(){
    if(!started3230||paused3230||gameSpeed3212<=0)return;
    rebuildSnapshot(false);
    const now=campaignSeconds3230;if(now-lastThinkCampaign<1.8)return;
    lastThinkCampaign=now;
    // Stagger: only a fraction of entities think on each pass.
    const bucket=Math.floor(now/1.8)%4;
    for(let id=bucket;id<states.length;id+=4)thinkMinor(id);
    maybeChangeMainDoctrine0359();
  }

  // Las IA de alta frecuencia también consideran a las demás naciones rivales.
  // La relación se guarda de forma dispersa solo cuando existe contacto.
  if(typeof aiTargetAllowed3260==='function'){
    const baseAllowed0359=aiTargetAllowed3260;
    aiTargetAllowed3260=function(f,target){
      const id=API.ownerIdAt(target);
      if(id>=0){
        let rel=majorMinorRelation0359(f,id);
        if(rel===-1)return true;
        if(rel>0)return false;
        const aggr=FACTIONS3230[f]?.aggr??.5,role=FACTIONS3230[f]?.role||'balanced';
        const gate=((hash(f*977+id*131+Math.floor(campaignSeconds3230/25))%1000)/1000);
        const chance=Math.max(.018,(aggr-.40)*.13+(role==='aggressive'?.035:role==='growth'?.012:0));
        if(gate<chance){setMajorMinorRelation0359(f,id,-1);return true}
        return false;
      }
      return baseAllowed0359.apply(this,arguments);
    };
  }
  if(typeof aiCampaignCellAllowed3280==='function'){
    const baseCampaignCell0362=aiCampaignCellAllowed3280;
    aiCampaignCellAllowed3280=function(f,cell,enemy){
      const id=API.ownerIdAt(cell);
      if(id>=0)return majorMinorRelation0359(f,id)===-1;
      return baseCampaignCell0362.apply(this,arguments);
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

  // --- Integración total con el controlador contextual ---
  // owner6 conserva -1 para estas entidades por rendimiento, así que traducimos
  // esa propiedad compacta al mismo contexto visible que cualquier otra nación.
  const baseOwnerSummary0360=ownerSummary3244;
  ownerSummary3244=function(cell){
    const id=API.ownerIdAt(cell),e=id>=0?API.entityRef(id):null;
    return e?e.name:baseOwnerSummary0360.apply(this,arguments);
  };

  const baseCellContext0360=cellContext3244;
  cellContext3244=function(cell){
    const id=API.ownerIdAt(cell);
    if(id<0)return baseCellContext0360.apply(this,arguments);
    const e=API.entityRef(id),st=states[id],base=baseCellContext0360(cell);
    return {...base,
      owner:vid(id),own:false,neutral:false,enemy:true,virtualMinorId:id,
      capital:e?.seed===cell,
      port:!!st?.portCells?.includes(cell),
      city:st?.cityCells?.includes(cell)?1:0,
      industry:st?.industryCells?.includes(cell)?1:0,
      geo:geographicNameForCell3244(cell)
    };
  };

  const baseContextHeader0360=contextHeader3244;
  contextHeader3244=function(ctx){
    if(ctx?.virtualMinorId==null)return baseContextHeader0360.apply(this,arguments);
    const id=ctx.virtualMinorId,e=API.entityRef(id),st=states[id];
    const bits=[
      (REL_LABEL[st?.rel??0]||'NEUTRAL'),
      (territoryCounts[id]||0).toLocaleString('es-ES')+' territorios',
      ctx.geo,
      terrainSummary3244(ctx.cell)
    ];
    if(e?.seed===ctx.cell)bits.unshift('★ capital');
    else if(ctx.port)bits.unshift('⚓ puerto');
    else if(ctx.city)bits.unshift('🏙 ciudad');
    return {title:e?.name||ctx.geo,meta:bits.join(' · ')};
  };

  const baseContextActions0360=buildContextActions3244;
  buildContextActions3244=function(ctx,submenu=null){
    if(ctx?.virtualMinorId==null)return baseContextActions0360.apply(this,arguments);
    const id=ctx.virtualMinorId,e=API.entityRef(id),a=[];
    if(started3230&&playerCountry>=0)
      a.push(action3244('attack','Atacar','⚔','Abrir frente contra '+(e?.name||'esta nación'),'warn3244'));
    a.push(action3244('inspect','Inspeccionar','ⓘ','Información del territorio'));
    a.push(action3244('diplomacy','Diplomacia','🤝','Relaciones con '+(e?.name||'esta nación'),'',true));
    return a;
  };

  const baseOpenModal0360=openModal3244;
  openModal3244=function(type,data){
    if(data?.virtualMinorId==null)return baseOpenModal0360.apply(this,arguments);
    const id=data.virtualMinorId,e=API.entityRef(id),st=states[id];
    closeContextDialog3244();uiInteractionState3244.modal={type,data};
    modal3244.classList.add('open3244');modal3244.setAttribute('aria-hidden','false');
    modalActions3244.innerHTML='';
    if(type==='inspect'){
      modalTitle3244.textContent=e?.name||data.geo;
      modalBody3244.innerHTML=
        '<div class="stat3244"><b>Control:</b> '+(e?.name||'—')+'</div>'+
        '<div class="stat3244"><b>Territorios:</b> '+(territoryCounts[id]||0).toLocaleString('es-ES')+'</div>'+
        '<div class="stat3244"><b>Relación:</b> '+(REL_LABEL[st?.rel??0]||'NEUTRAL')+'</div>'+
        '<div class="stat3244"><b>Región:</b> '+data.geo+'</div>'+
        '<div class="stat3244"><b>Terreno:</b> '+terrainSummary3244(data.cell)+'</div>'+
        '<div class="stat3244"><b>Infraestructura:</b> '+(data.city?'ciudad · ':'')+(data.industry?'industria · ':'')+(data.port?'puerto · ':'')+(data.fort?'defensa '+data.fort+'/3':'sin fortificación')+'</div>';
      modalActions3244.innerHTML='<button data-modal-action="close">Cerrar</button>';
      return;
    }
    if(type==='diplomacy'){
      modalTitle3244.textContent='Diplomacia · '+(e?.name||'Nación');
      modalBody3244.innerHTML=
        '<div class="stat3244"><b>Estado actual:</b> '+(REL_LABEL[st?.rel??0]||'NEUTRAL')+'</div>'+
        '<div class="stat3244"><b>Territorios:</b> '+(territoryCounts[id]||0).toLocaleString('es-ES')+'</div>';
      modalActions3244.innerHTML=
        '<button class="danger3244" data-modal-action="relation" data-value="-1">Guerra</button>'+
        '<button data-modal-action="relation" data-value="0">Paz</button>'+
        '<button data-modal-action="relation" data-value="1">Comercio</button>'+
        '<button data-modal-action="relation" data-value="2">No agresión</button>'+
        '<button class="good3244" data-modal-action="relation" data-value="3">Alianza</button>'+
        '<button data-modal-action="close">Cerrar</button>';
      return;
    }
    return baseOpenModal0360.apply(this,arguments);
  };

  const baseSetRelation0360=setRelation3220;
  setRelation3220=function(country,val){
    if(!isVirtual(country))return baseSetRelation0360.apply(this,arguments);
    const id=mid(country),cur=relationWithPlayer(id);
    const type=val===-1?'war':val===1?'trade':val===2?'nap':val===3?'alliance':cur===-1?'peace':'break';
    return playerDiplomaticAction3300(country,type);
  };

  const baseHandleContext0360=handleContextAction3244;
  handleContextAction3244=function(id){
    const ctx=uiInteractionState3244.contextData;
    if(ctx?.virtualMinorId!=null&&id==='attack'){
      const cell=ctx.cell;
      closeContextDialog3244();
      selected={key:MAX_GAME_LEVEL3233,i:cell};
      uiInteractionState3244.selectedCell=cell;
      return operation3212(cell);
    }
    return baseHandleContext0360.apply(this,arguments);
  };

  // Portable/local persistence.
  if(typeof buildPortableFile3276==='function'){
    const baseBuild0359=buildPortableFile3276;
    buildPortableFile3276=function(){
      const file=baseBuild0359.apply(this,arguments);
      file.gameVersion='0.36.2';file.payload.universalPolities0359=serialize();
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
    minorWars0359=new Map();majorMinorRelations0359=new Map();tradeDegree0359=new Uint16Array(0);majorRoles0359=[];majorNextReview0359=[];
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out;
  };

  function universalRanking0362(force=false){
    if(!states.length)return;
    const wall=performance.now();if(!force&&wall-rankingLastWall0362<1100)return;
    rankingLastWall0362=wall;rebuildSnapshot(false);
    const snap=aiSnapshot3260||rebuildAISnapshot3260(),rows=[];
    for(let f=0;f<activeFactionCount3230;f++){
      const count=snap?.territory?.[f]||0;
      if(count>0||f===0)rows.push({kind:'major',id:f,name:factionName3230(f),color:FACTIONS3230[f]?.color||'#80909b',count});
    }
    for(let id=0;id<states.length;id++){
      const count=territoryCounts[id]||0,e=API.entityRef(id);
      if(count>0&&e)rows.push({kind:'minor',id,name:e.name,color:e.color,count});
    }
    rows.sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'es'));
    const signature=rows.map(r=>r.kind[0]+r.id+':'+r.count).join('|');
    if(!force&&signature===rankingSignature0362)return;
    rankingSignature0362=signature;
    const host=document.getElementById('rankRows3213');if(!host)return;
    host.innerHTML=rows.map((r,k)=>
      '<div class="rankRow3213" role="button" tabindex="0" '+(r.kind==='major'?'data-faction="'+r.id+'"':'data-minor0358="'+r.id+'"')+
      ' aria-label="Ir a la capital de '+String(r.name).replace(/"/g,'&quot;')+'" title="Ir a la capital de '+String(r.name).replace(/"/g,'&quot;')+'">'+
      '<i class="rankDot3213" style="background:'+r.color+'"></i><span>'+(k+1)+'. '+r.name+'</span><small>'+r.count.toLocaleString('es-ES')+'</small></div>'
    ).join('');
  }
  const baseRanking0362=updateRanking3220;
  updateRanking3220=function(){
    if(!states.length)return baseRanking0362.apply(this,arguments);
    return universalRanking0362(false);
  };

  function stats(){
    rebuildSnapshot(false);
    return {
      version:BUILD,entities:states.length,territory:Array.from(territoryCounts),
      borders:borderPairs.length,sparseRelations:minorWars0359.size,majorMinorRelations:majorMinorRelations0359.size,
      mindsets:states.reduce((a,s)=>{a[s.mindset]=(a[s.mindset]||0)+1;return a},{}),
      relations:states.reduce((a,s)=>{a[s.rel]=(a[s.rel]||0)+1;return a},{}),
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

  console.info('[HEXATEGOS] 0.36.2 mundo de ~500 naciones + IA intercambiable activo');
})();
