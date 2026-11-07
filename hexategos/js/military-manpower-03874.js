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
  // También ajustar las consultas directas al balance territorial
  // utilizadas por Economía. economyRate conserva su propia envoltura
  // sobre la referencia ORIGINAL: el coste se aplica una sola vez.
  const baseTerritorial03874=territorialEconomy3261;
  territorialEconomy3261=function(f){
    const r=baseTerritorial03874.apply(this,arguments);
    if(f!==0||!r||typeof r!=='object')return r;
    const extra=deployed(0)*UPKEEP;
    return extra>0?{...r,maintenance:number(r.maintenance)+extra,
      net:number(r.net)-extra,gold:number(r.net)-extra,
      armyDeployedMaintenance03874:extra}:r;
  };
  const baseRate=economyRate3230;
  economyRate3230=function(f){
    const r=baseRate.apply(this,arguments);
    if(r&&typeof r==='object'){
      // La base ya mantiene la reserva propia y reserva+desplegados IA.
      // Cubrir también los soldados del jugador que están en frentes,
      // transportes y guarniciones: no repetir el coste de la reserva.
      const extra=f===0?deployed(0)*UPKEEP:0;
      const corrected=extra>0?{...r,maintenance:number(r.maintenance)+extra,
        net:number(r.net)-extra,gold:number(r.net)-extra,
        armyDeployedMaintenance03874:extra}:r;
      if(valid(f))cachedRates[f]=corrected;
      return {...corrected,troop:0,recruitPotential03874:Math.max(0,number(r.troop))};
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
    // Una orden expresa de desmovilización anula formación pendiente para
    // no volver a contratar inmediatamente a los mismos efectivos.
    queues[f]=0;
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
    // El tick económico original ya actualiza el HUD. Evitar una segunda
    // actualización completa por cada reclutamiento de las 500 IA.
    if(cycle.recruited>0||cycle.demobilized>0)needsRender=true;
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
  // Panel estable: no reconstruir sliders ni modificar scroll en cada tick.
  // El máximo utiliza equipo del almacén de la capital, no el stock nacional.
  const host=document.getElementById('sysContent3213');
  let uiMode03875='recruit',uiAmount03875=0,uiInitialised03875=false,confirming03875=false;
  const militaryRoot03875=()=>host?.querySelector('[data-military-manpower03874]');
  function capitalEquipment03875(){
    const api=window.HexategosTradeLogistics0370;
    return Math.max(0,number(api?.recruitEquipmentAvailable03875?.(0)));
  }
  function militaryLimit03875(mode=uiMode03875,s=status(0)){
    if(!s)return 0;
    if(mode==='demob')return Math.max(0,Math.floor(s.reserve));
    const remaining=Math.max(0,1200-s.queue);
    const capacity=Math.max(0,Math.floor(s.room-s.queue+1e-7));
    // La cola anterior tiene prioridad sobre los materiales/oro actuales.
    const paid=Math.max(0,Math.floor((s.gold-s.queue*UNIT_GOLD+1e-7)/UNIT_GOLD));
    const equipped=Math.max(0,Math.floor((capitalEquipment03875()-s.queue*UNIT_EQUIP+1e-7)/UNIT_EQUIP));
    return Math.max(0,Math.min(remaining,capacity,paid,equipped));
  }
  function chooseAmount03875(v){
    const s=status(0),max=militaryLimit03875(uiMode03875,s);
    uiAmount03875=clamp(Math.floor(number(v)),0,max);
    updatePanelValues03875();
  }
  function militaryMarkup03875(){
    const stat=(name,value)=>'<span class="hubStat03851"><small>'+name+
      '</small><strong data-mil-value03874="'+value+'"></strong></span>';
    return '<div class="hubSectionHeading03851"><b>Reclutamiento y desmovilización</b></div>'+
      '<div class="hubStats03851">'+stat('Reserva disponible','reserve')+
      stat('Tropas desplegadas','deployed')+stat('Límite militar','maximum')+
      stat('Pendientes de formación','queue')+stat('Mantenimiento existente','upkeep')+
      stat('Equipo militar nacional','equipment')+stat('Coste orden pendiente','cost')+'</div>'+
      '<p class="hubEmpty03851" data-mil-state03874></p>'+
      '<div class="milPlanner03875" aria-label="Gestión del personal militar">'+
        '<div class="milModes03875" role="group" aria-label="Tipo de operación">'+
          '<button type="button" data-mil-mode03875="recruit" aria-pressed="true">Reclutar</button>'+
          '<button type="button" data-mil-mode03875="demob" aria-pressed="false">Desmovilizar</button>'+
        '</div>'+
        '<div class="milQuantityHead03875"><label for="milSlider03875">Número de soldados</label>'+
          '<strong data-mil-selection03875>0</strong></div>'+
        '<input id="milSlider03875" data-mil-slider03875 type="range" min="0" max="0" step="1" value="0" aria-label="Seleccionar número de soldados">'+
        '<div class="milQuantityFoot03875"><span>0</span><span data-mil-max03875>Máximo: 0</span></div>'+
        '<label class="milExactLabel03875" for="milExact03875">Cantidad exacta</label>'+
        '<input id="milExact03875" data-mil-exact03875 type="number" inputmode="numeric" min="0" max="0" step="1" value="0">'+
        '<div class="milPreview03875" aria-live="polite" data-mil-preview03875></div>'+
        '<div class="hubButtons03851 milActions03875">'+
          '<button type="button" data-mil-confirm03875>Confirmar reclutamiento</button>'+
          '<button type="button" data-mil-cancel03875>Cancelar reclutamiento pendiente</button>'+
        '</div>'+
      '</div>';
  }
  function updatePanelValues03875(){
    if(!host||!live()||sysTab3220!=='military')return;
    const root=militaryRoot03875();
    if(!root)return;
    const s=status(0);if(!s)return;
    const values={reserve:fmt(s.reserve),deployed:fmt(s.deployed),maximum:fmt(s.maximum),
      queue:fmt(s.queue),upkeep:s.upkeep.toFixed(2)+' oro/s',
      equipment:s.militaryStock.toFixed(2),cost:(s.queue*UNIT_GOLD).toFixed(2)+' oro'};
    for(const [key,val] of Object.entries(values)){
      const el=root.querySelector('[data-mil-value03874="'+key+'"]');
      if(el&&el.textContent!==val)el.textContent=val;
    }
    const state=root.querySelector('[data-mil-state03874]');
    if(state){
      const message=s.queue<=0?'Sin orden de reclutamiento activa.':
        s.room<=0?'Orden detenida: capacidad militar agotada.':
        s.gold<UNIT_GOLD?'En espera: oro insuficiente.':
        capitalEquipment03875()<UNIT_EQUIP?'En espera: falta material militar en la capital.':
        'Formación en curso: '+fmt(s.queue)+' efectivos pendientes.';
      if(state.textContent!==message)state.textContent=message;
    }
    const max=militaryLimit03875(uiMode03875,s);
    if(!uiInitialised03875){uiAmount03875=Math.min(25,max);uiInitialised03875=true}
    if(uiAmount03875>max)uiAmount03875=max;
    const slider=root.querySelector('[data-mil-slider03875]');
    if(slider){
      if(slider.max!==String(max))slider.max=String(max);
      if(slider.value!==String(uiAmount03875))slider.value=String(uiAmount03875);
      slider.disabled=max===0||confirming03875;
    }
    const exact=root.querySelector('[data-mil-exact03875]');
    if(exact){
      if(exact.max!==String(max))exact.max=String(max);
      // No sobrescribir lo que el usuario está tecleando ni mover el foco.
      if(document.activeElement!==exact&&exact.value!==String(uiAmount03875))
        exact.value=String(uiAmount03875);
      exact.disabled=max===0||confirming03875;
    }
    const shown=root.querySelector('[data-mil-selection03875]');
    if(shown)shown.textContent=fmt(uiAmount03875);
    const maxEl=root.querySelector('[data-mil-max03875]');
    if(maxEl)maxEl.textContent='Máximo disponible ahora: '+fmt(max);
    for(const button of root.querySelectorAll('[data-mil-mode03875]')){
      const selected=button.dataset.milMode03875===uiMode03875;
      button.setAttribute('aria-pressed',String(selected));
      button.disabled=confirming03875;
    }
    const preview=root.querySelector('[data-mil-preview03875]');
    if(preview){
      if(uiMode03875==='recruit'){
        const seconds=s.recruitRate>0?Math.ceil(uiAmount03875/Math.min(s.recruitRate,3)):null;
        const capStock=capitalEquipment03875();
        const notice=max===0?'No hay capacidad, oro o material militar suficiente ahora.':'';
        preview.textContent='Coste: '+(uiAmount03875*UNIT_GOLD).toFixed(2)+' oro · '+
          'Material: '+(uiAmount03875*UNIT_EQUIP).toFixed(3)+' · '+
          'Duración mínima estimada: '+(seconds===null?'sin capacidad':seconds+' s')+
          ' · Equipo en capital: '+capStock.toFixed(2)+
          (notice?' · '+notice:'');
      }else{
        preview.textContent='Regresarán a la vida civil '+fmt(uiAmount03875)+
          ' soldados de la reserva. Las tropas desplegadas no se retiran. No se devuelve oro.';
      }
    }
    const submit=root.querySelector('[data-mil-confirm03875]');
    if(submit){
      submit.textContent=uiMode03875==='recruit'?'Confirmar reclutamiento':'Confirmar desmovilización';
      submit.disabled=confirming03875||uiAmount03875<1||uiAmount03875>max;
    }
    const cancelButton=root.querySelector('[data-mil-cancel03875]');
    if(cancelButton)cancelButton.disabled=confirming03875||s.queue<=0;
  }
  if(typeof renderSystems3220==='function'){
    const baseRender03875=renderSystems3220;
    renderSystems3220=function(){
      const result=baseRender03875.apply(this,arguments);
      if(host&&live()&&sysTab3220==='military'){
        const box=host.querySelector('[data-hub-tab="military"]');
        if(box&&!box.querySelector('[data-military-manpower03874]')){
          const section=document.createElement('section');
          section.dataset.militaryManpower03874='';
          section.innerHTML=militaryMarkup03875();box.appendChild(section);
        }
        updatePanelValues03875();
      }
      return result;
    };
  }
  // Reutilizar el ciclo económico, sin DOM polling ni render completo del panel.
  function updatePanelValues(){updatePanelValues03875()}
  host?.addEventListener('input',event=>{
    const target=event.target;
    if(target?.matches?.('[data-mil-slider03875], [data-mil-exact03875]')){
      chooseAmount03875(target.value);
    }
  });
  host?.addEventListener('change',event=>{
    const target=event.target;
    if(target?.matches?.('[data-mil-exact03875]')){
      chooseAmount03875(target.value);
      target.value=String(uiAmount03875);
    }
  });
  async function confirmMilitaryAction03875(mode,amount){
    const action=mode==='recruit'?'reclutar':'desmovilizar';
    const amountText=fmt(amount);
    const explanation=mode==='recruit'?
      'Coste previsto: '+(amount*UNIT_GOLD).toFixed(2)+' oro y '+
        (amount*UNIT_EQUIP).toFixed(3)+' de material militar. La incorporación será gradual.':
      'Solo se retirarán efectivos de la reserva libre; no se recuperará oro.';
    const dialog=window.HexategosDialogs03851?.confirm;
    const message='¿Confirmar '+action+' '+amountText+' soldados?\n\n'+explanation;
    const accepted=typeof dialog==='function'?
      await dialog(message,{title:mode==='recruit'?'Reclutamiento':'Desmovilización',
        accept:'Confirmar',cancel:'Volver'}):
      (typeof window.confirm==='function'?window.confirm(message):false);
    if(!accepted)return false;
    // Revalidar tras el modal; el juego puede seguir avanzando.
    const current=militaryLimit03875(mode,status(0));
    if(!live()||amount>current){
      if(typeof toast==='function')toast('Han cambiado los recursos o los efectivos. Revisa la cantidad.');
      return false;
    }
    const ok=mode==='recruit'?request(0,amount):demobilize(0,amount)===amount;
    if(ok){
      uiAmount03875=0;
      if(typeof saveGame3212==='function')saveGame3212();
      if(typeof toast==='function')toast(mode==='recruit'?
        'Reclutamiento encargado: '+amountText+' soldados':
        'Desmovilizados: '+amountText+' soldados');
    }
    return !!ok;
  }
  host?.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-mil-mode03875], [data-mil-confirm03875], [data-mil-cancel03875]');
    if(!button||!host.contains(button)||sysTab3220!=='military')return;
    event.preventDefault();event.stopPropagation();
    if(confirming03875)return;
    if(button.matches('[data-mil-mode03875]')){
      const mode=button.dataset.milMode03875;
      if(mode!=='recruit'&&mode!=='demob')return;
      uiMode03875=mode;
      uiAmount03875=Math.min(25,militaryLimit03875(mode,status(0)));
      updatePanelValues03875();return;
    }
    if(button.matches('[data-mil-cancel03875]')){
      if(cancel(0)){
        if(typeof saveGame3212==='function')saveGame3212();
      }else if(typeof toast==='function')toast('No hay reclutas pendientes');
      updatePanelValues03875();return;
    }
    const mode=uiMode03875,quantity=uiAmount03875;
    if(quantity<1||quantity>militaryLimit03875(mode,status(0))){
      if(typeof toast==='function')toast('Selecciona una cantidad disponible');
      updatePanelValues03875();return;
    }
    confirming03875=true;updatePanelValues03875();
    void confirmMilitaryAction03875(mode,quantity)
      .catch(error=>console.warn('[HEXATEGOS reclutamiento] Confirmación fallida',error))
      .finally(()=>{confirming03875=false;updatePanelValues03875()});
  });
  window.HexategosMilitaryManpower03874=Object.freeze({
    version:'0.38.75',status,request,cancel,demobilize,snapshot,restore,
    recruitmentLimit:(f=0)=>{
      if(f===0)return militaryLimit03875('recruit',status(0));
      const s=status(f);return s?Math.max(0,Math.min(1200-s.queue,
        Math.floor(s.room-s.queue),Math.floor((s.gold-s.queue*UNIT_GOLD)/UNIT_GOLD),
        Math.floor((number(window.HexategosTradeLogistics0370?.recruitEquipmentAvailable03875?.(f))-s.queue*UNIT_EQUIP)/UNIT_EQUIP))):0;
    },
    diagnostics:()=>({...cycle,activeQueues:queues.slice(0,activeFactionCount3230).filter(n=>n>0).length})
  });
})();
