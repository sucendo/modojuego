'use strict';
// HEXATEGOS 0.38.74 · Movilización y desmovilización sin doble ejército.
(() => {
  const KEY='hexategos-military-manpower-03874',UNIT_GOLD=.42,UNIT_EQUIP=.012,UPKEEP=.00165;
  const count=FACTIONS3230.length,queues=new Float64Array(count),aiNext=new Float64Array(count);
  const aiDemobNext=new Float64Array(count),cachedRates=new Array(count);
  let lastSaved=0,cycle={recruited:0,demobilized:0,gold:0,material:0};
  const number=x=>Number.isFinite(Number(x))?Number(x):0;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const valid=f=>Number.isInteger(f)&&f>=0&&f<activeFactionCount3230;
  const cash=f=>f===0?number(gold3212):number(botGold3230[f]);
  const treasury=(f,x)=>{if(f===0)gold3212=x;else botGold3230[f]=x};
  const fmt=x=>Math.round(x).toLocaleString('es-ES');
  const live=()=>typeof started3230!=='undefined'&&started3230;
  function deployed(f){
    if(f>0)return typeof aiTotalMilitary3280==='function'?
      Math.max(0,number(aiTotalMilitary3280(f))-number(troops3230[f])):0;
    let n=0;
    if(typeof activeFronts3230!=='undefined')for(const x of activeFronts3230)n+=Math.max(0,number(x.pool));
    if(typeof fleets3212!=='undefined')for(const x of fleets3212)
      if(x.f===0)n+=Math.max(0,number(x.troops));
    n+=Math.max(0,number(window.HexategosStatecraft0380?.garrisonCommitted03874?.(0)));
    return n;
  }
  // Desactivar SOLO el incremento automático del juego antiguo.
  // Conservamos el potencial de reclutamiento, límites y economía originales.
  const baseRate=economyRate3230;
  economyRate3230=function(f){
    const r=baseRate.apply(this,arguments);
    if(r&&typeof r==='object'){
      if(valid(f))cachedRates[f]=r;
      return {...r,troop:0,recruitPotential03874:Math.max(0,number(r.troop))};
    }
    return r;
  };
  function rate(f){return cachedRates[f]||baseRate(f)}
  function total(f){return Math.max(0,number(troops3230[f]))+deployed(f)}
  function status(f=0){
    if(!valid(f))return null;
    const r=rate(f),reserve=Math.max(0,number(troops3230[f]));
    const maximum=Math.max(0,number(r.max)),active=total(f);
    return {f,reserve,deployed:Math.max(0,active-reserve),total:active,maximum,
      room:Math.max(0,maximum-active),queue:queues[f],gold:cash(f),
      recruitRate:Math.max(0,number(r.troop)),net:number(r.net),
      militaryStock:Math.max(0,number(window.HexategosTradeLogistics0370?.resourceSummaryCached?.(f)?.stock?.[4])),
      upkeep:active*UPKEEP,unitGold:UNIT_GOLD,unitMaterial:UNIT_EQUIP};
  }
  function request(f,qty){
    if(!live()||!valid(f)||!Number.isFinite(qty)||qty<=0)return false;
    const available=Math.min(1200-queues[f],Math.floor(status(f).room-queues[f]),Math.floor(qty));
    if(available<1)return false;
    queues[f]+=available;persist();return true;
  }
  function cancel(f=0){
    if(!valid(f)||queues[f]<=0)return false;
    queues[f]=0;persist();return true;
  }
  function demobilize(f,qty){
    if(!live()||!valid(f)||!Number.isFinite(qty)||qty<=0)return 0;
    const removed=Math.min(Math.floor(qty),Math.floor(Math.max(0,number(troops3230[f]))));
    if(removed<=0)return 0;
    troops3230[f]=Math.max(0,troops3230[f]-removed);
    // La demovilización no destruye ejércitos desplegados, ni devuelve oro/equipo.
    queues[f]=Math.min(queues[f],Math.max(0,Math.floor(status(f).room)));
    if(f===0){updateUI3230();needsRender=true}
    persist();return removed;
  }
  function reviewAI(f,now){
    if(f<=0||now<aiNext[f])return;
    aiNext[f]=now+29+(f%9)*3;
    const s=status(f);if(!s||!s.maximum)return;
    const snapshot=typeof aiSnapshot3260!=='undefined'?aiSnapshot3260:null;
    const threat=(snapshot?.capThreat?.[f]??99)<14;
    const fronts=typeof aiFrontsForNation3280==='function'?aiFrontsForNation3280(f).length:0;
    const war=threat||fronts>0||(typeof warCount3261==='function'&&warCount3261(f)>0);
    const role=FACTIONS3230[f]?.role||'balanced';
    const ratio=war?(role==='aggressive'?.70:.61):(role==='defense'?.40:role==='aggressive'?.39:.34);
    const target=Math.min(s.maximum,Math.max(65,s.maximum*ratio));
    const shortage=target-s.total-s.queue;
    if(shortage>8&&s.gold>42&&s.net>-.25)
      queues[f]=Math.min(1200,queues[f]+Math.min(100,Math.floor(shortage)));
    else if(!war&&s.total>target+24&&now>=aiDemobNext[f]){
      const excess=Math.min(s.reserve-15,s.total-target);
      if(excess>10){
        const remove=Math.min(30,Math.floor(excess*.30));
        troops3230[f]=Math.max(0,troops3230[f]-remove);
        cycle.demobilized+=remove;aiDemobNext[f]=now+36+(f%7)*3;
      }
      queues[f]=0;
    }else if(s.total>=target)queues[f]=0;
  }
  function step(dt){
    const now=number(campaignSeconds3230),trade=window.HexategosTradeLogistics0370;
    cycle={recruited:0,demobilized:0,gold:0,material:0};
    for(let f=0;f<activeFactionCount3230;f++){
      if(f>0)reviewAI(f,now);
      const pending=queues[f];if(pending<=0)continue;
      const r=rate(f),room=Math.max(0,number(r.max)-total(f));
      if(room<=0){queues[f]=0;continue}
      const gold=cash(f),freeGold=Math.max(0,gold-(f===0?0:20));
      const capacity=Math.min(pending,room,freeGold/UNIT_GOLD,
        Math.max(0,number(r.troop))*dt,3*dt);
      if(capacity<1e-8)continue;
      const made=Math.max(0,number(trade?.consumeRecruitEquipment03874?.(f,capacity,UNIT_EQUIP)));
      if(made<1e-8)continue;
      troops3230[f]+=made;queues[f]=Math.max(0,pending-made);
      const spent=made*UNIT_GOLD;
      treasury(f,Math.max(0,cash(f)-spent));
      cycle.recruited+=made;cycle.gold+=spent;cycle.material+=made*UNIT_EQUIP;
    }
    if(cycle.recruited>0||cycle.demobilized>0){updateUI3230();needsRender=true}
    const t=performance.now();
    if(t-lastSaved>=20000&&(cycle.recruited>0||cycle.demobilized>0)){
      lastSaved=t;persist();
    }
    updatePanelValues();
  }
  const baseTick=economyTick3212;
  economyTick3212=function(){
    const before=number(campaignSeconds3230),out=baseTick.apply(this,arguments);
    const dt=number(campaignSeconds3230)-before;
    if(dt>0&&live()&&!paused3230)step(Math.min(8,dt));
    return out;
  };
  function snapshot(){
    const n=activeFactionCount3230;
    return {v:1,queues:Array.from(queues.slice(0,n)),
      aiNext:Array.from(aiNext.slice(0,n)),aiDemobNext:Array.from(aiDemobNext.slice(0,n))};
  }
  function restore(s){
    queues.fill(0);aiNext.fill(0);aiDemobNext.fill(0);cachedRates.fill(null);
    if(!s||s.v!==1)return;
    for(const [key,target,limit] of [['queues',queues,1200],['aiNext',aiNext,1e12],
      ['aiDemobNext',aiDemobNext,1e12]]){
      const a=Array.isArray(s[key])?s[key]:[];
      for(let i=0;i<Math.min(a.length,activeFactionCount3230);i++)
        target[i]=clamp(number(a[i]),0,limit);
    }
  }
  function persist(){
    try{
      const s=snapshot(),codec=window.HexategosSaveStorage03827;
      if(codec?.set)return codec.set(KEY,s);
      localStorage.setItem(KEY,JSON.stringify(s));return true;
    }catch(e){console.warn('[HEXATEGOS movilización] guardado no disponible',e);return false}
  }
  function read(){
    try{
      const codec=window.HexategosSaveStorage03827;
      return codec?.get?codec.get(KEY):JSON.parse(localStorage.getItem(KEY)||'null');
    }catch(_){return null}
  }
  const baseSave=saveGame3212;
  saveGame3212=function(){
    const out=baseSave.apply(this,arguments);
    if(live()&&!persist())return false;
    return out;
  };
  const baseLoad=loadGame3212;
  loadGame3212=function(){
    const saved=read(),out=baseLoad.apply(this,arguments);
    restore(out!==false&&live()?saved:null);return out;
  };
  const baseReset=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset.apply(this,arguments);
    restore(null);
    if(clearSave)try{localStorage.removeItem(KEY)}catch(_){}
    return out;
  };
  if(typeof buildPortableFile3275==='function'){
    const base=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=base.apply(this,arguments);
      if(file?.payload){
        file.payload.militaryManpower03874=snapshot();
        if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      }
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const base=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const next=file?.payload?.militaryManpower03874||null;
      const out=base.apply(this,arguments);
      if(out!==false){restore(next);persist()}
      return out;
    };
  }
  const host=document.getElementById('sysContent3213');
  const controls='<div class="hubButtons03851 milOrders03874">'+
    '<button type="button" data-mobil03874="25">Reclutar +25</button>'+
    '<button type="button" data-mobil03874="100">Reclutar +100</button>'+
    '<button type="button" data-mobil03874="cancel">Cancelar orden</button>'+
    '<button type="button" data-mobil03874="-25">Desmovilizar 25</button>'+
    '<button type="button" data-mobil03874="-100">Desmovilizar 100</button></div>';
  function panelMarkup(){
    const s=status(0);if(!s)return '';
    const stat=(name,value)=>'<span class="hubStat03851"><small>'+name+
      '</small><strong data-mil-value03874="'+value+'"></strong></span>';
    return '<div class="hubSectionHeading03851"><b>Reclutamiento y desmovilización</b></div>'+
      '<div class="hubStats03851">'+stat('Reserva disponible','reserve')+
      stat('Tropas desplegadas','deployed')+stat('Límite militar','maximum')+
      stat('Pendientes de formación','queue')+stat('Mantenimiento existente','upkeep')+
      stat('Equipo militar nacional','equipment')+'</div>'+
      '<p class="hubEmpty03851">Formación gradual según población urbana y territorio. Cada tropa requiere '+
      UNIT_GOLD+' oro y '+UNIT_EQUIP+' de equipo militar del almacén real de la capital. '+
      'El mantenimiento ya está contabilizado en Economía; no se cobra dos veces. '+
      'Desmovilizar solo reduce la reserva libre y no devuelve los gastos anteriores.</p>'+controls;
  }
  function updatePanelValues(){
    if(!host||sysTab3220!=='military')return;
    const root=host.querySelector('[data-military-manpower03874]');
    if(!root)return;
    const s=status(0);if(!s)return;
    const values={reserve:fmt(s.reserve),deployed:fmt(s.deployed),maximum:fmt(s.maximum),
      queue:fmt(s.queue),upkeep:s.upkeep.toFixed(2)+' oro/s',equipment:s.militaryStock.toFixed(2)};
    for(const [key,val] of Object.entries(values)){
      const el=root.querySelector('[data-mil-value03874="'+key+'"]');
      if(el&&el.textContent!==val)el.textContent=val;
    }
  }
  if(typeof renderSystems3220==='function'){
    const base=renderSystems3220;
    renderSystems3220=function(){
      const out=base.apply(this,arguments);
      if(host&&live()&&sysTab3220==='military'){
        const box=host.querySelector('[data-hub-tab="military"]');
        if(box){
          const el=document.createElement('section');
          el.dataset.militaryManpower03874='';el.innerHTML=panelMarkup();
          box.appendChild(el);updatePanelValues();
        }
      }
      return out;
    };
  }
  host?.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-mobil03874]');
    if(!button||sysTab3220!=='military'||!host.contains(button))return;
    event.preventDefault();event.stopPropagation();
    const choice=button.dataset.mobil03874;
    if(choice==='cancel'){
      if(!cancel(0)&&typeof toast==='function')toast('No hay reclutas pendientes');
    }else{
      const amount=Number(choice);
      if(amount>0){
        if(!request(0,amount)&&typeof toast==='function')toast('Capacidad de reclutamiento agotada');
      }else if(amount<0){
        if(!demobilize(0,-amount)&&typeof toast==='function')toast('No hay tropas libres');
      }
    }
    saveGame3212();updatePanelValues();
  });
  window.HexategosMilitaryManpower03874=Object.freeze({
    version:'0.38.74',status,request,cancel,demobilize,snapshot,restore,
    diagnostics:()=>({...cycle,activeQueues:queues.slice(0,activeFactionCount3230).filter(n=>n>0).length})
  });
})();
