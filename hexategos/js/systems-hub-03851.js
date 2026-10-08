'use strict';

// HEXATEGOS 0.38.5.1 · Sistemas: embajadas, rutas marítimas, Militar y UX.
// Reutiliza los motores diplomático, logístico y bélico existentes.
(() => {
  const BUILD='0.38.5.1';
  const panel=document.getElementById('systemsPanel3213');
  const host=document.getElementById('sysContent3213');
  if(!panel||!host)return;
  const nationApi=()=>window.HexategosStatecraft0380;
  const tradeApi=()=>window.HexategosTradeActions0370;
  const routeApi=()=>window.HexategosTradeLogistics0370;
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pretty=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString('es-ES'):'—';
  let embassyOpen=false,embassyContacts=[],embassyFilter='',embassySelected=-1;
  let maritimePort=-1,showAllSeaRoutes=false,lastTab='dip';
  const states={none:'Sin embajada',active:'Embajada activa',pending:'Solicitud pendiente',rejected:'Solicitud rechazada',expelled:'Embajada expulsada'};
  const routeNames={active:'Activa',risky:'Sin permiso',smuggling:'Contrabando',blocked:'Bloqueada',inspected:'En inspección',suspended:'Suspendida',broken:'Interrumpida',rebuilding:'Recalculando'};
  const msg=s=>{if(typeof toast==='function')toast(s)};
  const switchTab=tab=>{if(typeof openSystems3220==='function')openSystems3220(tab)};

  function introBlock(tab){
    const el=document.createElement('div');
    el.className='sysBlock3213 sysHubCritical03851';
    el.dataset.hubTab=tab;
    return el;
  }
  function makeHint(label,value){
    return '<span class="hubStat03851"><small>'+escape(label)+'</small><strong>'+escape(value)+'</strong></span>';
  }
  function diplomacyCard(){
    if(!started3230)return;
    let card=host.querySelector('[data-hub-tab="dip"]');
    const api=nationApi();
    if(!api)return;
    if(!card){card=introBlock('dip');host.prepend(card)}
    const tech=api.tech?.(0)??0, reach=api.reach?.(0)??18;
    const prevTech=card.querySelector('[data-hub-tech]');
    if(!prevTech){
      card.innerHTML='<div class="hubHeader03851"><div><b>🤝 Embajadas y contacto exterior</b>'+
        '<p>El alcance diplomático permite iniciar contactos; una embajada abre las negociaciones formales. No concede comercio automáticamente.</p></div></div>'+
        '<div class="hubStats03851" data-hub-tech></div>'+
        '<div class="hubButtons03851"><button type="button" class="hubPrimary03851" data-hub-action="embassy-toggle">Gestionar embajadas</button>'+
        '<button type="button" data-hub-action="go-research">Mejorar alcance en Investigación</button></div>'+
        '<div id="hubEmbassyPanel03851" hidden></div>';
    }
    const el=card.querySelector('[data-hub-tech]');
    if(el)el.innerHTML=makeHint('I+D diplomática','Nivel '+tech)+makeHint('Alcance',''+reach+'°')+
      makeHint('Regla de comercio','Embajada + tratado');
    const roster=card.querySelector('#hubEmbassyPanel03851');
    if(roster){
      roster.hidden=!embassyOpen;
      if(embassyOpen)renderEmbassyRoster();
    }
  }
  function filteredEmbassies(){
    const filter=embassyFilter.trim().toLocaleLowerCase('es');
    return embassyContacts.filter(x=>!filter||x.name.toLocaleLowerCase('es').includes(filter));
  }
  function refreshEmbassyContacts(){
    embassyContacts=nationApi()?.embassyContacts?.()||[];
    embassyContacts.sort((a,b)=>{
      const aa=a.pending?0:a.status==='none'?1:a.status==='rejected'?2:3;
      const bb=b.pending?0:b.status==='none'?1:b.status==='rejected'?2:3;
      return aa-bb||a.name.localeCompare(b.name,'es');
    });
    if(!embassyContacts.some(x=>x.f===embassySelected))embassySelected=embassyContacts[0]?.f??-1;
  }
  function renderEmbassyRoster(){
    const view=host.querySelector('#hubEmbassyPanel03851');
    if(!view||view.hidden)return;
    if(!view.querySelector('[data-embassy-search]')){
      view.innerHTML='<div class="hubManager03851"><label for="hubEmbassyFilter03851">Buscar nación con contacto diplomático</label>'+
        '<input id="hubEmbassyFilter03851" data-embassy-search type="search" placeholder="Nombre de nación" autocomplete="off">'+
        '<label for="hubEmbassySelect03851">Nación de destino</label><select id="hubEmbassySelect03851" data-embassy-select></select>'+
        '<div class="hubDetail03851" data-embassy-status></div>'+
        '<div class="hubButtons03851" data-embassy-buttons></div></div>';
    }
    const filter=view.querySelector('[data-embassy-search]');
    if(filter&&filter.value!==embassyFilter)filter.value=embassyFilter;
    const select=view.querySelector('[data-embassy-select]');
    if(!select)return;
    const matches=filteredEmbassies();
    const visible=matches.slice(0,90);
    if(!matches.some(x=>x.f===embassySelected))embassySelected=matches[0]?.f??-1;
    const frag=document.createDocumentFragment();
    for(const x of visible){
      const o=document.createElement('option');
      o.value=String(x.f);
      o.textContent=x.name+' · '+(states[x.status]||'Sin embajada');
      frag.appendChild(o);
    }
    select.replaceChildren(frag);
    const found=visible.find(x=>x.f===embassySelected);
    if(!found)embassySelected=visible[0]?.f??-1;
    select.value=String(embassySelected);
    const status=view.querySelector('[data-embassy-status]'),buttons=view.querySelector('[data-embassy-buttons]');
    if(!matches.length){
      if(status)status.textContent='No se encontraron naciones con contacto disponible. Amplía el alcance diplomático desde Investigación.';
      if(buttons)buttons.replaceChildren();
      return;
    }
    if(status)status.textContent='Mostrando '+visible.length+' de '+matches.length+' naciones. Escribe para filtrar.';
    updateEmbassyActions();
  }
  function updateEmbassyActions(){
    const detail=host.querySelector('[data-embassy-status]'),buttons=host.querySelector('[data-embassy-buttons]');
    const c=embassyContacts.find(x=>x.f===embassySelected);
    if(!detail||!buttons)return;
    if(!c){buttons.replaceChildren();return}
    const atWar=typeof diplomaticRelation3300==='function'&&diplomaticRelation3300(0,c.f)===-1;
    const busy=c.pending,locked=c.status==='active',retry=Math.ceil(c.retry||0);
    const statusText=states[c.status]||'Sin embajada';
    const info=statusText+(c.treaty?' · Comercio autorizado':' · Sin acuerdo comercial')+
      (atWar?' · En guerra':retry>0?' · Reintento en '+retry+' s':'');
    detail.textContent=c.name+' — '+info;
    buttons.innerHTML='';
    const button=(label,action,disabled=false,emphasis=false)=>{
      const el=document.createElement('button');
      el.type='button';el.dataset.hubAction=action;el.textContent=label;el.disabled=disabled;
      if(emphasis)el.className='hubPrimary03851';
      buttons.appendChild(el);
    };
    if(busy){
      button('Aceptar embajada','embassy-accept',false,true);
      button('Rechazar','embassy-reject');
    }else if(!locked){
      button('Enviar embajada','embassy-send',atWar||retry>0,true);
    }else button('Embajada establecida','embassy-none',true);
    button('Abrir ficha de nación','embassy-dossier');
  }

  function ownPorts(){
    const out=[];
    if(typeof ports3212==='undefined'||typeof owner6==='undefined')return out;
    for(const cell of ports3212){
      if(owner6[cell]!==0)continue;
      out.push({cell,name:typeof placeDisplayName3271==='function'?placeDisplayName3271(cell):'Puerto '+cell});
    }
    out.sort((a,b)=>a.name.localeCompare(b.name,'es'));
    return out;
  }
  function maritimeCard(){
    if(!started3230)return;
    // La vista naval clásica también enumera las rutas; retiramos SOLO ese
    // bloque duplicado de la pantalla (las rutas y acciones siguen intactas).
    for(const block of host.querySelectorAll(':scope > .sysBlock3213')){
      if(block.dataset.hubTab)continue;
      const title=block.querySelector(':scope > b')?.textContent||'';
      if(title.startsWith('⇄ Rutas marítimas'))block.remove();
    }
    let card=host.querySelector('[data-hub-tab="naval"]');
    if(!card){card=introBlock('naval');host.prepend(card)}
    const ports=ownPorts();
    if(maritimePort<0||!ports.some(p=>p.cell===maritimePort))maritimePort=ports[0]?.cell??-1;
    const routes=(routeApi()?.routes?.()||[]).filter(r=>r.type==='sea'&&r.status!=='closed'&&(r.a===0||r.b===0));
    const listed=showAllSeaRoutes?routes:routes.slice(0,12);
    card.innerHTML='<div class="hubHeader03851"><div><b>⚓ Gestión de rutas comerciales marítimas</b>'+
      '<p><strong>1.</strong> Selecciona un puerto propio. <strong>2.</strong> Abre una ruta por lista o elige un puerto destino en el mapa. <strong>3.</strong> Gestiona las rutas existentes aquí.</p></div></div>'+
      '<div class="hubManager03851"><label for="hubSeaPort03851">Puerto de origen</label>'+
      '<select id="hubSeaPort03851" data-hub-sea-port '+(!ports.length?'disabled':'')+'>'+
      (ports.length?ports.map(p=>'<option value="'+p.cell+'" '+(p.cell===maritimePort?'selected':'')+'>'+escape(p.name)+'</option>').join(''):'<option>Construye primero un puerto</option>')+
      '</select><div class="hubButtons03851">'+
      '<button class="hubPrimary03851" data-hub-action="sea-list" '+(maritimePort<0?'disabled':'')+'>Abrir ruta · elegir destino</button>'+
      '<button data-hub-action="sea-map" '+(maritimePort<0?'disabled':'')+'>Elegir destino en el mapa</button></div></div>'+
      '<div class="hubSectionHeading03851"><b>Rutas marítimas existentes</b><span>'+routes.length+'</span></div>'+
      (routes.length?'<div class="hubRouteList03851">'+listed.map(r=>'<div class="hubRoute03851">'+
        '<div class="hubRouteTitle03851"><b>'+escape(placeDisplayName3271(r.from))+' ↔ '+escape(placeDisplayName3271(r.to))+'</b>'+
        '<small>'+escape(routeNames[r.status]||r.status)+' · +'+Number(r.lastValue||0).toFixed(2)+'/s</small></div>'+
        '<div class="hubButtons03851"><button data-hub-action="sea-focus" data-id="'+r.id+'">Ver en mapa</button>'+
        '<button data-hub-action="sea-close" data-id="'+r.id+'">Cerrar ruta</button></div></div>').join('')+'</div>':
        '<p class="hubEmpty03851">Todavía no has creado rutas marítimas. Puedes comerciar también entre puertos de tu propio país.</p>')+
      (routes.length>12?'<button class="hubMore03851" data-hub-action="sea-more">'+(showAllSeaRoutes?'Ver menos':'Ver todas las '+routes.length+' rutas')+'</button>':'');
  }
  function militaryCard(){
    if(!started3230){
      host.innerHTML='<div class="sysBlock3213"><b>Militar</b><p>Inicia una partida para consultar tropas y frentes.</p></div>';
      return;
    }
    const ownTroops=typeof troops3230!=='undefined'?(Number(troops3230[0])||0):0;
    const totalWar=typeof warCount3261==='function'?warCount3261(0):0;
    const selected=typeof selectedGameCell3230==='function'?selectedGameCell3230():-1;
    const ownSelected=selected>=0&&owner6[selected]===0;
    const mat=routeApi()?.resourceSummaryCached?.(0);
    const matPct=mat?.coverage?.[4]!=null?Math.round(mat.coverage[4]*100)+'%':'—';
    const known=window.HexategosDiplomacyNetwork3301?.targetsRef?.(0)||
      window.HexategosDiplomacyNetwork3301?.targets?.(0)||[];
    const wars=[];
    for(const other of known){
      if(other===0||other<0||other>=activeFactionCount3230)continue;
      if(diplomaticRelation3300(0,other)===-1)wars.push(other);
      if(wars.length>=18)break;
    }
    const card=introBlock('military');
    card.innerHTML='<div class="hubHeader03851"><div><b>⚔️ Ejército y frentes</b>'+
      '<p>Resumen terrestre. Las operaciones y fortificaciones utilizan las órdenes del territorio seleccionado, sin duplicar el sistema de combate.</p></div></div>'+
      '<div class="hubStats03851">'+makeHint('Reservas de tropas',pretty(ownTroops))+
      makeHint('Guerras activas',pretty(totalWar))+makeHint('Material militar',matPct)+'</div>'+
      '<div class="hubSectionHeading03851"><b>Acciones terrestres</b></div>'+
      '<p class="hubEmpty03851">'+(ownSelected?'Territorio propio seleccionado: '+escape(placeDisplayName3271(selected)):'Selecciona un territorio propio en el mapa para emitir órdenes terrestres.')+'</p>'+
      '<div class="hubButtons03851">'+
      '<button data-hub-action="military-attack" '+(!ownSelected||document.getElementById('attackBtn')?.disabled?'disabled':'')+'>Operación terrestre</button>'+
      '<button data-hub-action="military-fort" '+(!ownSelected||document.getElementById('fortBtn')?.disabled?'disabled':'')+'>Construir defensa</button>'+
      '<button data-hub-action="military-naval">Ir a Naval</button></div>'+
      '<div class="hubSectionHeading03851"><b>Conflictos en curso</b></div>'+
      (wars.length?'<div class="hubWarList03851">'+wars.map(f=>
        '<button data-hub-action="military-dossier" data-faction="'+f+'">'+escape(factionName3230(f))+' · Ver situación militar</button>'
      ).join('')+'</div>':'<p class="hubEmpty03851">No hay guerras declaradas con las naciones conocidas.</p>');
    host.replaceChildren(card);
  }
  function decorateNew(){
    window.HexategosSystemsUI0385?.refresh?.();
  }
  const baseRender=renderSystems3220;
  renderSystems3220=function(){
    const tab=typeof sysTab3220==='string'?sysTab3220:'dip';
    const rememberedScroll=lastTab===tab?host.scrollTop:0;
    if(tab==='military'){
      militaryCard();decorateNew();host.scrollTop=rememberedScroll;lastTab=tab;
      return;
    }
    const out=baseRender.apply(this,arguments);
    if(tab==='dip')diplomacyCard();
    else if(tab==='naval')maritimeCard();
    if(tab==='research'){
      const v=host.querySelector('.statecraftResearch0380 .sysMeta3213');
      if(v)v.textContent='Alcance diplomático · nivel '+(nationApi()?.tech?.(0)??0)+
        ' · radio '+(nationApi()?.reach?.(0)??18)+'°. La investigación amplía los contactos posibles; no concede tratados ni embajadas automáticamente.';
    }
    decorateNew();
    host.scrollTop=lastTab===tab?rememberedScroll:0;
    lastTab=tab;
    return out;
  };
  const baseOpen=openSystems3220;
  openSystems3220=function(tab='dip'){
    const out=baseOpen.apply(this,arguments);
    if(tab==='military'){
      sysTab3220='military';
      renderSystems3220();
    }
    return out;
  };
  panel.querySelector('[data-tab="military"]')?.addEventListener('click',()=>{
    sysTab3220='military';
    renderSystems3220();
  });

  host.addEventListener('input',e=>{
    if(e.target.matches('[data-embassy-search]')){
      embassyFilter=e.target.value||'';
      renderEmbassyRoster();
      const field=host.querySelector('[data-embassy-search]');
      field?.focus();
      field?.setSelectionRange?.(embassyFilter.length,embassyFilter.length);
    }
  });
  host.addEventListener('change',e=>{
    if(e.target.matches('[data-embassy-select]')){
      embassySelected=Number(e.target.value);
      updateEmbassyActions();
    }
    if(e.target.matches('[data-hub-sea-port]'))maritimePort=Number(e.target.value);
  });
  host.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-hub-action]');
    if(!b)return;
    const action=b.dataset.hubAction;
    if(!action)return;
    e.preventDefault();
    if(action==='go-research'){switchTab('research');return}
    if(action==='embassy-toggle'){
      embassyOpen=!embassyOpen;
      if(embassyOpen)refreshEmbassyContacts();
      const v=host.querySelector('#hubEmbassyPanel03851');
      if(v){v.hidden=!embassyOpen;if(embassyOpen)renderEmbassyRoster()}
      b.textContent=embassyOpen?'Ocultar embajadas':'Gestionar embajadas';
      return;
    }
    if(action.startsWith('embassy-')){
      if(embassySelected<1)return;
      const api=nationApi();
      if(action==='embassy-send')api?.requestEmbassyPlayer?.(embassySelected);
      else if(action==='embassy-accept')api?.answerEmbassyPlayer?.(embassySelected,true);
      else if(action==='embassy-reject')api?.answerEmbassyPlayer?.(embassySelected,false);
      else if(action==='embassy-dossier'){api?.dossier?.(embassySelected,'dip');return}
      refreshEmbassyContacts();renderEmbassyRoster();return;
    }
    if(action==='sea-list'||action==='sea-map'){
      if(maritimePort<0)return;
      closeSystems3220();
      if(action==='sea-list')tradeApi()?.openSeaTrade?.(maritimePort);
      else tradeApi()?.pickSeaOnMap?.(maritimePort);
      return;
    }
    if(action==='sea-more'){
      showAllSeaRoutes=!showAllSeaRoutes;
      maritimeCard();decorateNew();return;
    }
    if(action==='sea-focus'){tradeApi()?.focusRoute?.(Number(b.dataset.id));return}
    if(action==='sea-close'){
      if(confirm('¿Cerrar esta ruta marítima? La ruta dejará de transportar mercancías.')){
        tradeApi()?.closeRoute?.(Number(b.dataset.id));
      }
      return;
    }
    if(action==='military-naval'){switchTab('naval');return}
    if(action==='military-dossier'){
      nationApi()?.dossier?.(Number(b.dataset.faction),'military');return;
    }
    if(action==='military-attack'||action==='military-fort'){
      const button=document.getElementById(action==='military-attack'?'attackBtn':'fortBtn');
      if(!button||button.disabled){msg('Selecciona antes un territorio propio válido');return}
      closeSystems3220();button.click();
    }
  });

  // Stable3 es el ÚNICO gestor del movimiento del diálogo Sistemas.
  // Restablecer posición ayuda cuando un panel ampliado queda fuera de pantalla.
  const reset=document.getElementById('systemsRecenter03851');
  reset?.addEventListener('click',()=>{
    try{localStorage.removeItem('hexategos.stable3.systems.pos')}catch(_){}
    for(const p of ['left','top','right','bottom','transform'])panel.style.removeProperty(p);
    panel.classList.remove('uiMovedStable3');
    msg('Posición de Sistemas restablecida');
  });

  window.HexategosSystemsUI03851={
    version:BUILD,
    getState:()=>({tab:lastTab,embassyOpen,embassySelected,maritimePort}),
    refresh:()=>renderSystems3220()
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.38.5.1 · Sistemas, embajadas, rutas marítimas y Militar');
})();
