'use strict';
// HEXATEGOS v0.38.17 · Ficha informativa por hexágono.
// Sólo recopila datos al abrir/cambiar una ficha, nunca en el render del mapa.
(() => {
  const BUILD='0.38.17';
  const root=document.getElementById('contextMenu3244');
  const actions=document.getElementById('ctxActions3244');
  if(!root||!actions||typeof renderContextDialog3244!=='function')return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const pct=n=>clamp(Math.round(Number(n)||0),0,100);
  const num=n=>Math.round(Number(n)||0).toLocaleString('es-ES');
  const fmt=n=>Number(n||0).toFixed(2).replace('.',',');
  const MATERIALS=['Alimentos','Materias primas','Energía','Bienes civiles','Material militar'];
  const stageOf=k=>{
    const d=window.HexategosProduction0388?.types?.[k];
    return d?.group==='extract'?'Extracción':d?.group==='factory'?'Transformación':
      d?.group==='power'?'Electricidad':d?.group==='manufacture'?'Manufactura':'Industria';
  };
  let tab='summary',lastCell=-1,scrollCell=-1,scrollTab='summary';
  const panel=document.createElement('div');
  panel.id='ctxInspector03817';
  panel.className='ctxInspector03817';
  root.insertBefore(panel,actions);
  const original=renderContextDialog3244;
  const originalPosition=positionContextDialog3244;
  function profile(cell){
    return window.HexategosTradeLogistics0370?.geography?.(cell)||null;
  }
  // El juego no disponía de censo: estimación reproducible, evolucionada con
  // tiempo de campaña y factores urbanos, productivos y administrativos.
  // No se guardan 510.000 registros de población ni se añade trabajo por tick.
  function population(cell){
    const L=loadLevel(MAX_GAME_LEVEL3233);
    if(!Number.isInteger(cell)||cell<0||cell>=L.n||L.land[cell]<0)return null;
    const f=owner6[cell],geo=profile(cell);
    const h=(Math.imul(cell+233,1664525)^(cell*1013904223))>>>0;
    const food=clamp(Number(geo?.food)||.65,.1,2.6);
    const raw=clamp(Number(geo?.raw)||.65,.1,2.6);
    const level=cities3212.has(cell)?Math.max(1,cityLevel3230[cell]||1):0;
    const ind=industries3212.has(cell)?Math.max(1,industryLevel3230[cell]||1):0;
    const special=window.HexategosProduction0388?.sitesOnCell?.(cell)||[];
    const port=ports3212.has(cell),capital=f>=0&&capitals?.[f]===cell;
    const climate=geo?.type;
    const terrain=(climate==='desert'||climate==='ice'||climate==='tundra')?.38:
      climate==='mountain'||climate==='highmountain'?.55:climate==='forest'?.80:1;
    const rural=(180+h%1850)*(.45+food*.52)*terrain;
    const urban=level?Math.pow(level,1.8)*2550*(.7+food*.25):0;
    const supply=f===0?Number(window.HexategosTradeLogistics0370?.combinedSupply?.(cell)):
      Number.NaN;
    const gov=level?window.HexategosStatecraft0380?.governmentCity?.(cell):null;
    const quality=Number.isFinite(supply)?clamp(.63+supply*.0045,.65,1.12):1;
    const stability=gov?.stability!=null?clamp(.72+gov.stability*.0035,.72,1.07):1;
    const industry=1+ind*.065+Math.min(6,special.length)*.025;
    const maritime=port?1.12:1;
    const administrative=capital?1.24:1;
    const war=f>=0&&f<relations3220.length&&f>0&&relations3220[f]===-1?.88:1;
    const seconds=clamp(Number(campaignSeconds3230)||0,0,36000);
    const growth=clamp(1+(seconds/36000)*(.19+food*.06),1,1.38);
    const value=Math.max(0,Math.round((rural+urban)*quality*stability*industry*
      maritime*administrative*war*growth));
    return {value,urban:level>0,growth,quality,stability,food,raw};
  }
  function metric(label,value,sub=''){
    return '<div class="ctxStat03817"><span>'+esc(label)+'</span><b>'+esc(value)+'</b>'+
      (sub?'<small>'+esc(sub)+'</small>':'')+'</div>';
  }
  function meter(label,value,color='blue',detail=''){
    const v=pct(value);
    return '<div class="ctxMeter03817" data-tone="'+color+'">'+
      '<div><span>'+esc(label)+'</span><b>'+v+' %</b></div>'+
      '<div class="ctxTrack03817"><i style="width:'+v+'%"></i></div>'+
      (detail?'<small>'+esc(detail)+'</small>':'')+'</div>';
  }
  function card(title,body,small=''){
    return '<section class="ctxCard03817"><h4>'+esc(title)+'</h4>'+
      (small?'<p class="ctxHelp03817">'+esc(small)+'</p>':'')+body+'</section>';
  }
  function supply(ctx){
    if(!ctx.own)return {value:null,diag:null};
    const api=window.HexategosTradeLogistics0370;
    let value=Number(api?.combinedSupply?.(ctx.cell));
    if(!Number.isFinite(value))value=Number(supplyAt3230?.(ctx.cell));
    if(!Number.isFinite(value))value=null;
    return {value,diag:api?.materialSupply?.(ctx.cell)||null};
  }
  function materialsSummary(ctx){
    const geo=profile(ctx.cell);
    const stock=window.HexategosTradeLogistics0370?.resourceNode?.(ctx.cell);
    const prod=window.HexategosProduction0388;
    const sites=prod?.sitesOnCell?.(ctx.cell)||[];
    const weights=[
      ['Alimentos',geo?.food,'green'],
      ['Minerales y madera',geo?.raw,'gold'],
      ['Petróleo y gas',geo?.fuel,'blue']
    ];
    const potential=weights.map(([label,x,tone])=>
      meter(label,Number.isFinite(Number(x))?Number(x)*70:0,tone,
        Number.isFinite(Number(x))?'potencial geográfico '+fmt(x)+'×':'Sin prospección')).join('');
    const row=stock?'<div class="ctxInline03817">'+
      MATERIALS.map((label,i)=>'<span>'+esc(label)+' <b>'+fmt(stock.stock?.[i])+'/'+fmt(stock.cap?.[i])+'</b></span>').join('')+
      '</div>':'<p class="ctxHelp03817">Sin almacén logístico en este hexágono. Las existencias pueden encontrarse en otra instalación de la red.</p>';
    return card('Recursos del terreno',potential,
      'Potencial estimado del entorno; no es un depósito extraíble automáticamente.')+
      card('Reservas y producción local',row+
        (sites.length?'<p class="ctxHelp03817">'+sites.map(s=>esc((prod.types[s.kind]?.name||s.kind)+' · nivel '+s.level)).join(' · ')+'</p>':''));
  }
  function government(ctx){
    const g=window.HexategosStatecraft0380?.governmentCity?.(ctx.cell);
    const policyNames={aid:'Ayuda',invest:'Inversión',autonomy:'Autonomía',garrison:'Guarnición',ration:'Racionamiento',repression:'Coerción'};
    if(!g)return card('Gobierno y estabilidad',
      '<p class="ctxHelp03817">Sin administración urbana local. Construye una ciudad para consultar estabilidad, nacionalismo y políticas.</p>');
    return card('Gobierno y estabilidad',
      meter('Estabilidad',g.stability,g.stability<40?'red':'green')+
      meter('Nacionalismo',g.nationalism,g.nationalism>70?'red':'gold')+
      '<div class="ctxInline03817"><span>Escasez <b>'+num(g.scarcity)+'/300</b></span>'+
      '<span>Abastecimiento <b>'+pct(g.supply)+' %</b></span>'+
      '<span>Situación <b>'+(g.riot?'Disturbios':g.strike?'Huelga':g.occupied?'Ocupada':'Normal')+'</b></span></div>'+
      (Object.entries(g.active||{}).filter(x=>x[1]).length?
        '<p class="ctxHelp03817">Medidas activas: '+Object.entries(g.active).filter(x=>x[1]).map(x=>esc(policyNames[x[0]]||x[0])).join(', ')+'</p>':'')+
      (ctx.own?'<button class="ctxManage03817" type="button" data-action="government_city_0386">Gestionar gobierno local ↗</button>':'' ));
  }
  function industry(ctx){
    const prod=window.HexategosProduction0388,sites=prod?.sitesOnCell?.(ctx.cell)||[];
    const generic=ctx.industry||0;
    let content='<div class="ctxInline03817"><span>Área manufacturera <b>Nivel '+generic+'/3</b></span>'+
      '<span>Instalaciones especializadas <b>'+sites.length+'</b></span></div>';
    if(!sites.length)content+='<p class="ctxHelp03817">No hay explotaciones ni fábricas especializadas en este hexágono.</p>';
    else for(const s of sites){
      const d=prod.types[s.kind]||{name:s.kind,icon:'🏭',sector:''};
      const identifier=s.cell+':'+s.kind;
      const active=pct(s.pct),sector=pct(prod.sector?.(s.f,d.sector)??100);
      const effective=Math.min(active,sector);
      content+='<article class="ctxPlant03817"><div class="ctxPlantHead03817">'+
        '<b>'+esc(d.icon)+' '+esc(d.name)+'</b><small>'+esc(stageOf(s.kind))+' · nivel '+s.level+'/5</small></div>'+
        '<div class="ctxInline03817"><span>Actividad efectiva <b>'+effective+' %</b></span>'+
        '<span>Sector <b>'+sector+' %</b></span>'+
        '<span>Producción acumulada <b>'+fmt(s.output)+'</b></span></div>'+
        '<p class="ctxHelp03817"><b>Estado:</b> '+esc(s.status||'Pendiente de simulación')+
        ' · Producción '+fmt(s.lastRate||0)+'/s · Eficiencia '+Math.round(s.efficiency||0)+' %</p>'+
        ((d.electricity||d.group==='manufacture')?
          '<p class="ctxHelp03817">⚡ Electricidad de la red: '+fmt(s.lastPower||0)+'</p>':'')+
        (s.lastInputs?.length?'<p class="ctxHelp03817">Materias disponibles: '+esc(s.lastInputs.map(v=>
          (prod.types[v.kind]?.name||prod.intermediates?.()[v.kind]||v.kind)+' '+fmt(v.available)).join(' · '))+'</p>':'')+
        (ctx.own?'<label class="ctxControl03817">Producción individual <b data-inspect-value03817="'+esc(identifier)+'">'+active+' %</b>'+
          '<input type="range" min="0" max="100" step="5" value="'+active+'" data-inspect-pct03817="'+esc(identifier)+'"></label>':
          '<p class="ctxHelp03817">Actividad programada: '+active+' %</p>')+
        '</article>';
    }
    if(ctx.own)content+='<button type="button" class="ctxManage03817" data-action="production0388">Construir o mejorar industrias ↗</button>'+
      '<button type="button" class="ctxManage03817" data-inspect-systems03817="eco">Reguladores generales por sector ↗</button>';
    return card('Industrias y controles de producción',content,
      'La actividad efectiva depende del control individual y del regulador nacional del sector.');
  }
  function portRoutes(ctx){
    if(!ctx.port)return '';
    const routes=(window.HexategosTradeLogistics0370?.routes?.()||[])
      .filter(r=>r.type==='sea'&&r.status!=='closed'&&(r.from===ctx.cell||r.to===ctx.cell));
    const fleets=typeof navalGroups3270!=='undefined'?
      navalGroups3270.filter(g=>g.home===ctx.cell&&g.f===ctx.owner):[];
    const transports=typeof fleets3212!=='undefined'?
      fleets3212.filter(g=>(g.home===ctx.cell||g.from===ctx.cell)&&(g.f??0)===ctx.owner):[];
    const kinds=window.HexategosProduction0388?.types||{};
    const intermediate=window.HexategosProduction0388?.intermediates?.()||{};
    const cargo=r=>{
      const base=Array.isArray(r.cargo03720)?r.cargo03720:[];
      const generic=base.map((v,i)=>({label:MATERIALS[i],amount:Number(v)||0,direction:r.cargoDirection03720?.[i]??0}));
      const entries=Array.isArray(r.productionCargoDetail03817)&&r.productionCargoDetail03817.length?
        r.productionCargoDetail03817.map(v=>[v.kind,v.rate,v.direction]):
        Object.entries(r.productionCargo0388||{}).map(([k,v])=>[k,v,0]);
      const specific=entries.map(([k,v,direction])=>({
        label:kinds[k]?.name||intermediate[k]||k,amount:Number(v)||0,
        direction:Number(direction)||0
      }));
      return [...generic,...specific].filter(x=>x.amount>.005);
    };
    let html='<div class="ctxInline03817"><span>Rutas marítimas <b>'+routes.length+'</b></span>'+
      '<span>Flotas basadas <b>'+fleets.length+'</b></span>'+
      '<span>Transportes <b>'+transports.length+'</b></span></div>';
    if(!routes.length)html+='<p class="ctxHelp03817">Este puerto todavía no tiene rutas comerciales marítimas activas.</p>';
    for(const r of routes.slice(0,10)){
      const target=r.from===ctx.cell?r.to:r.from;
      const other=typeof placeDisplayName3271==='function'?placeDisplayName3271(target):'Hexágono '+target;
      const items=cargo(r),exports=[],imports=[],undirected=[];
      for(const item of items){
        // Dirección positiva: from→to. Negativa: to→from.
        if(item.direction>0)(r.from===ctx.cell?exports:imports).push(item);
        else if(item.direction<0)(r.from===ctx.cell?imports:exports).push(item);
        else undirected.push(item);
      }
      const goods=items.length?'<div class="ctxRouteCargo03817">'+
        (exports.length?'<span>↑ Exporta: '+esc(exports.map(x=>x.label+' '+fmt(x.amount)+'/s').join(', '))+'</span>':'')+
        (imports.length?'<span>↓ Importa: '+esc(imports.map(x=>x.label+' '+fmt(x.amount)+'/s').join(', '))+'</span>':'')+
        (undirected.length?'<span>⇄ Intercambio: '+esc(undirected.map(x=>x.label+' '+fmt(x.amount)+'/s').join(', '))+'</span>':'')+
        '</div>':'<small>Sin carga registrada en el último ciclo</small>';
      html+='<article class="ctxPortRoute03817"><b>'+esc(other)+'</b><small>'+
        (r.status==='active'?'Activa':esc(r.status))+' · '+esc(r.mode||'ruta legal')+'</small>'+
        goods+(ctx.own?'<button type="button" data-inspect-route03817="'+r.id+'">Ver ruta ↗</button>':'')+'</article>';
    }
    if(routes.length>10)html+='<p class="ctxHelp03817">Se muestran diez de '+routes.length+' rutas.</p>';
    if(!fleets.length)html+='<p class="ctxHelp03817">Sin flotas militares con base en este puerto.</p>';
    else html+='<div class="ctxFleetList03817">'+fleets.slice(0,12).map(g=>
      '<div>⚓ Flota '+esc(g.id3270??g.id??'')+
      '<b>'+esc(g.order||'patrol')+'</b><small>Fuerza '+num(g.strength||0)+
      ' · '+(g.targetPort>=0?'destino '+esc(placeDisplayName3271(g.targetPort)):'en su zona')+'</small></div>').join('')+'</div>';
    if(ctx.own)html+='<button type="button" class="ctxManage03817" data-inspect-systems03817="naval">Administrar puertos y flotas ↗</button>'+
      '<button type="button" class="ctxManage03817" data-inspect-systems03817="commerce">Gestionar rutas comerciales ↗</button>';
    return card('Puerto, comercio y flotas',html,
      'Las exportaciones e importaciones se indican según el sentido efectivo de cada cargamento.');
  }
  function renderDetails(ctx){
    const val=population(ctx.cell),sup=supply(ctx),prod=window.HexategosProduction0388;
    if(tab==='industry')return industry(ctx)+materialsSummary(ctx);
    if(tab==='government')return government(ctx);
    if(tab==='port')return portRoutes(ctx);
    const owner=ctx.owner>=0?factionName3230(ctx.owner):'Sin control nacional';
    const metrics='<div class="ctxMetrics03817">'+
      metric('Población estimada',val?num(val.value):'—',
        val?.urban?'Núcleo urbano y entorno':'Población rural estimada')+
      metric('Suministro',sup.value!=null?pct(sup.value)+' %':'No disponible',
        ctx.own?(sup.value<45?'En riesgo':sup.value<70?'Necesita mejoras':'Conectividad y existencias'):'Solo territorio propio')+
      metric('Territorio',owner,ctx.capital?'Capital':ctx.port?'Zona portuaria':ctx.city?'Ciudad nivel '+ctx.city:'Zona territorial')+
      metric('Infraestructura',(ctx.city?'Ciudad '+ctx.city+'/3 · ':'')+
        (ctx.industry?'Manufactura '+ctx.industry+'/3 · ':'')+
        (ctx.fort?'Defensa '+ctx.fort+'/3 · ':'')+(ctx.port?'Puerto':'Sin puerto'))+
      '</div>';
    let body=card('Población y territorio',metrics,
      'Estimación dinámica, no censo real; cambia con terreno, tiempo, actividad económica, suministro y estabilidad.');
    if(sup.diag){
      body+=card('Abastecimiento',MATERIALS.map((k,i)=>
        meter(k,(sup.diag.resourcePct?.[i]??.55),pct(sup.diag.resourcePct?.[i]??55)<40?'red':'blue')).join(''));
    }
    body+=materialsSummary(ctx);
    body+=government(ctx);
    body+=industry(ctx);
    if(ctx.port)body+=portRoutes(ctx);
    return body;
  }
  const tabsFor=ctx=>{
    const tabs=[['summary','Resumen'],['industry','Industria']];
    if(ctx.city)tabs.push(['government','Gobierno']);
    if(ctx.port)tabs.push(['port','Puerto']);
    return tabs;
  };
  let extrasExpanded03819=false;
  function simplifyActions(ctx){
    const buttons=Array.from(actions.querySelectorAll(':scope > button.ctxAction3244'));
    if(!buttons.length)return;
    const quick=ctx.own?['send_troops','build_city','production0388','build_road']:
      ctx.enemy?['attack','diplomacy','inspect']:['expand','inspect'];
    const main=document.createElement('div');
    main.className='ctxQuick03817';
    const rest=document.createElement('div');rest.className='ctxMoreGrid03817';
    for(const b of buttons){
      if(quick.includes(b.dataset.action)&&!b.disabled&&main.children.length<4)main.appendChild(b);
      else rest.appendChild(b);
    }
    const previouslyOpen=extrasExpanded03819;
    actions.replaceChildren();
    actions.appendChild(main);
    if(rest.children.length){
      const extra=document.createElement('details');
      extra.className='ctxExtras03817';
      extra.innerHTML='<summary>Más acciones y construcciones</summary>';
      extra.open=previouslyOpen;
      extra.appendChild(rest);actions.appendChild(extra);
    }
    // Las áreas clásicas de diplomacia y sliders no pueden vivir dentro de
    // ctxActions: el motor reconstruye ese contenedor con innerHTML en cada
    // selección, lo que destruiría sus listeners y rompería la siguiente ficha.
    const wrap=(id,wrapperId,title,active)=>{
      const el=document.getElementById(id);
      if(!el)return;
      let w=document.getElementById(wrapperId);
      if(!w){
        w=document.createElement('details');w.id=wrapperId;
        w.className='ctxExtras03817 ctxOuterExtras03817';
        const summary=document.createElement('summary');summary.textContent=title;
        w.appendChild(summary);
        root.insertBefore(w,el);w.appendChild(el);
      }
      w.hidden=!active;
    };
    wrap('ctxForeign3246','ctxForeignWrapper03817','Diplomacia y tratados',!!ctx.enemy);
    wrap('ctxRanges3246','ctxRangesWrapper03817','Fuerza y avance',!!ctx.own);
  }
  function mount(ctx){
    if(ctx?.kind!=='cell'||!Number.isInteger(ctx.cell)){
      panel.hidden=true;root.classList.remove('hexInspectorActive03817');
      scrollCell=-1;return;
    }
    if(lastCell!==ctx.cell){tab='summary';lastCell=ctx.cell;extrasExpanded03819=false}
    const permitted=tabsFor(ctx);
    if(!permitted.some(v=>v[0]===tab))tab='summary';
    // La ficha puede renovarse mientras se juega. Mantener las dos barras
    // en el mismo hexágono; una pestaña diferente comienza al principio.
    const sameCell=scrollCell===ctx.cell,oldOuter=sameCell?(root.scrollTop||0):0;
    const sameView=sameCell&&scrollTab===tab;
    const oldInner=sameView?(panel.querySelector?.('.ctxDetails03817')?.scrollTop||0):0;
    root.classList.add('hexInspectorActive03817');panel.hidden=false;
    panel.innerHTML='<nav class="ctxNav03817" aria-label="Información del hexágono">'+
      permitted.map(([key,name])=>'<button type="button" data-inspect-tab03817="'+key+'" aria-pressed="'+(key===tab)+'">'+name+'</button>').join('')+
      '</nav><div class="ctxDetails03817">'+renderDetails(ctx)+'</div>';
    simplifyActions(ctx);
    if(sameCell)root.scrollTop=oldOuter;
    if(sameView){const details=panel.querySelector?.('.ctxDetails03817');if(details)details.scrollTop=oldInner}
    scrollCell=ctx.cell;scrollTab=tab;
  }
  function render(ctx){
    // El motor original también reconstruye el menú contextual. Tomar la
    // posición ANTES de llamar al renderer original para evitar saltos.
    const sameCell=ctx?.kind==='cell'&&ctx.cell===lastCell;
    const previousOuter=sameCell?(root.scrollTop||0):0;
    const previousTab=tab;
    const previousInner=sameCell?(panel.querySelector?.('.ctxDetails03817')?.scrollTop||0):0;
    const existingExtras=actions.querySelector('.ctxExtras03817');
    if(existingExtras)extrasExpanded03819=existingExtras.open;
    const out=original.apply(this,arguments);
    try{mount(ctx)}catch(err){console.warn('[HEXATEGOS 0.38.17 Inspector]',err)}
    if(sameCell){
      root.scrollTop=previousOuter;
      if(tab===previousTab){
        const details=panel.querySelector?.('.ctxDetails03817');
        if(details)details.scrollTop=previousInner;
      }
    }
    return out;
  }
  renderContextDialog3244=render;
  if(typeof renderContextDialog3246==='function')renderContextDialog3246=render;
  const baseOpen=openContextDialog3244;
  openContextDialog3244=function(ctx){
    if(ctx?.cell!==lastCell)tab='summary';
    return baseOpen.apply(this,arguments);
  };
  root.addEventListener('toggle',event=>{
    if(event.target.matches?.('.ctxExtras03817:not(.ctxOuterExtras03817)')) extrasExpanded03819=event.target.open;
  },true);
  root.addEventListener('click',event=>{
    const nav=event.target.closest('[data-inspect-tab03817]');
    if(nav){
      event.preventDefault();event.stopPropagation();
      tab=nav.dataset.inspectTab03817;
      const ctx=uiInteractionState3244?.contextData;
      if(ctx?.kind==='cell')mount(ctx);
      return;
    }
    const systems=event.target.closest('[data-inspect-systems03817]');
    if(systems){
      event.preventDefault();event.stopPropagation();
      openSystems3220(systems.dataset.inspectSystems03817);return;
    }
    const route=event.target.closest('[data-inspect-route03817]');
    if(route){
      event.preventDefault();event.stopPropagation();
      window.HexategosTradeLogistics0370?.focusRoute?.(Number(route.dataset.inspectRoute03817));
      return;
    }
  },true);
  root.addEventListener('input',event=>{
    const input=event.target.closest('[data-inspect-pct03817]');
    if(!input)return;
    const id=input.dataset.inspectPct03817;
    if(window.HexategosProduction0388?.setPct?.(id,Number(input.value))){
      const val=panel.querySelector('[data-inspect-value03817="'+id+'"]');
      if(val)val.textContent=pct(input.value)+' %';
    }
  });
  root.addEventListener('change',event=>{
    if(event.target.matches('[data-inspect-pct03817]'))saveGame3212();
  });
  // Únicamente el guardado de instalaciones existentes; no se añade un timer.
  window.HexategosHexInspector03817={
    version:BUILD,population,
    refresh:()=>{const c=uiInteractionState3244?.contextData;if(c?.kind==='cell')mount(c)},
    current:()=>({cell:lastCell,tab}),
    tabsFor:ctx=>tabsFor(ctx).map(x=>x[0])
  };
  console.info('[HEXATEGOS] '+BUILD+' · ficha por hexágono, recursos, producción, gobierno y tráfico portuario.');
})();