'use strict';
// HEXATEGOS v0.38.61 · Panel de gestión territorial.
// Sólo recopila datos al abrir/cambiar una ficha, nunca en el render del mapa.
(() => {
  const BUILD='0.38.61';
  const root=document.getElementById('contextMenu3244');
  const actions=document.getElementById('ctxActions3244');
  if(!root||!actions||typeof renderContextDialog3244!=='function')return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const pct=n=>clamp(Math.round(Number(n)||0),0,100);
  const num=n=>Math.round(Number(n)||0).toLocaleString('es-ES');
  const fmt=n=>Number(n||0).toFixed(2).replace('.',',');
  const MATERIALS=['Alimentos','Materias primas','Combustible','Bienes civiles','Material militar'];
  const stageOf=k=>{
    const d=window.HexategosProduction0388?.types?.[k];
    return d?.group==='extract'?'Extracción':d?.group==='factory'?'Transformación':
      d?.group==='power'?'Electricidad':d?.group==='manufacture'?'Manufactura':'Industria';
  };
  let tab='summary',lastCell=-1;
  let openSection03858='';
  const panel=document.createElement('div');
  panel.id='ctxInspector03817';
  panel.className='ctxInspector03817';
  root.insertBefore(panel,actions);
  const details=document.createElement('div');
  details.className='ctxDetails03817';
  actions.after(details);
  if(typeof ensureClassicDialog3246==='function')ensureClassicDialog3246();
  const militaryStrength=document.getElementById('ctxStrength3246');
  if(militaryStrength){militaryStrength.min='0';militaryStrength.step='1';}
  const original=renderContextDialog3244;
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
  function meter(label,value,color='blue',detail=''){
    const v=pct(value);
    return '<div class="ctxMeter03817" data-tone="'+color+'">'+
      '<div><span>'+esc(label)+'</span><b>'+v+' %</b></div>'+
      '<div class="ctxTrack03817"><i style="width:'+v+'%"></i></div>'+
      (detail?'<small>'+esc(detail)+'</small>':'')+'</div>';
  }
  function card(title,body,small=''){
    const collapsible=/prospecci[oó]n|estudios|industria|producci[oó]n|gobierno|estabilidad|recursos|potencial|puerto/i.test(title);
    if(collapsible){
      const key=/prospecci[oó]n|estudios/i.test(title)?'studies':
        /industria|producci[oó]n/i.test(title)?'industry':
        /gobierno|estabilidad/i.test(title)?'government':/puerto/i.test(title)?'port':'resources';
      return '<details name="hex-territorial-management" class="ctxCard03817 ctxAccordion03858" data-hex-section03858="'+key+'" '+
        (openSection03858===key?'open':'')+'><summary>'+esc(title)+'</summary>'+
        '<div class="ctxAccordionBody03858">'+
        (small?'<p class="ctxHelp03817">'+esc(small)+'</p>':'')+body+'</div></details>';
    }
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
    const stock=window.HexategosTradeLogistics0370?.resourceNode?.(ctx.cell);
    const prod=window.HexategosProduction0388;
    const sites=prod?.sitesOnCell?.(ctx.cell)||[];
    const deposits=window.HexategosProspection03831?.result?.(ctx.cell);
    const agr=window.HexategosAgronomy03832?.result?.(ctx.cell);
    const known=deposits?'<p class="ctxHelp03817">Yacimientos descubiertos: '+
      Object.entries(deposits).map(([k,v])=>esc(k)+': '+esc(v)).join(' · ')+'</p>':
      '<p class="ctxHelp03817">Yacimientos sin prospectar. El potencial superficial no identifica reservas.</p>';
    const row=stock?'<div class="ctxInline03817">'+
      MATERIALS.map((label,i)=>'<span>'+esc(label)+' <b>'+fmt(stock.stock?.[i])+'/'+fmt(stock.cap?.[i])+'</b></span>').join('')+
      '</div>':'<p class="ctxHelp03817">Sin almacén logístico en este hexágono. Las existencias pueden encontrarse en otra instalación de la red.</p>';
    return card('Recursos y potencial económico',known+
      (agr?'<p class="ctxHelp03817">Agricultura: '+esc(agr.farming)+' · Ganadería: '+esc(agr.livestock)+' · Bosque: '+esc(agr.forest)+'</p>':'')+
      '<p class="ctxHelp03817">'+esc(typeof terrainSummary3244==='function'?terrainSummary3244(ctx.cell):'')+'</p>'+
      '<p class="ctxHelp03817">Ciudad '+num(ctx.city)+'/3 · Manufactura '+num(ctx.industry)+'/3 · Defensa '+num(ctx.fort)+'/3</p>'+
      '<h4>Existencias / capacidad del almacén</h4>'+row+
      (sites.length?'<p class="ctxHelp03817">Explotación: '+sites.map(s=>esc((prod.types[s.kind]?.name||s.kind)+' · nivel '+s.level)).join(' · ')+'</p>':''));
  }

  function naturalStudies03834(ctx){
    const natural=window.HexategosNaturalPotential03829;
    const geology=window.HexategosGeology03830;
    const prospect=window.HexategosProspection03831;
    const agronomy=window.HexategosAgronomy03832;
    const p=natural?.profile?.(ctx.cell),hint=geology?.hint?.(ctx.cell);
    if(!p)return '';
    const category=n=>natural.category(n);
    const geoStatus=prospect?.status?.(ctx.cell)||{state:'unexplored'};
    const agrStatus=agronomy?.status?.(ctx.cell)||{state:'unexplored'};
    const stateLabel=st=>st.state==='completed'?'Completado':
      st.state==='pending'?'En curso · '+Math.ceil(st.remaining||0)+' s':'Sin estudiar';
    let html='<div class="ctxInline03817">'+
      '<span>Terreno <b>'+esc(({plain:'Llanura',forest:'Bosque',jungle:'Selva',desert:'Desierto',steppe:'Estepa',mountain:'Montaña',highmountain:'Alta montaña',ice:'Hielo',tundra:'Tundra'})[p.type]||p.type)+'</b></span>'+
      '<span>Potencial minero <b>'+esc(hint?.mineralPotential||category(p.mineral))+'</b></span>'+
      '<span>Potencial energético <b>'+esc(hint?.energyPotential||category(p.energy))+'</b></span>'+
      '<span>Bosque <b>'+esc(category(p.forest))+'</b></span></div>';
    html+='<p class="ctxHelp03817">Agronomía: '+esc(stateLabel(agrStatus))+
      ' · Geología: '+esc(stateLabel(geoStatus))+'</p>';
    const agrResult=agronomy?.result?.(ctx.cell);
    if(agrResult){
      html+='<p class="ctxHelp03817">Fertilidad: '+esc(agrResult.farming)+
        ' · Ganadería: '+esc(agrResult.livestock)+
        ' · Potencial forestal: '+esc(agrResult.forest)+'</p>';
    }else{
      html+='<p class="ctxHelp03817">Agricultura y pastos requieren evaluación agronómica para conocer su aptitud.</p>';
    }
    const deposits=prospect?.result?.(ctx.cell);
    if(deposits){
      const labels={oil:'Petróleo',gas:'Gas',coal:'Carbón',iron:'Hierro',
        copper:'Cobre',quarry:'Piedra'};
      html+='<p class="ctxHelp03817"><b>Yacimientos descubiertos:</b> '+
        Object.entries(deposits).map(([kind,value])=>
          esc(labels[kind]||kind)+': '+esc(value)).join(' · ')+'</p>';
    }else{
      html+='<p class="ctxHelp03817">Los yacimientos exactos permanecen ocultos hasta prospectar.</p>';
    }
    if(ctx.own){
      for(const [kind,api,label,st] of [
        ['geology',prospect,'Prospección geológica',geoStatus],
        ['agronomy',agronomy,'Evaluación agronómica',agrStatus]]){
        if(!api)continue;
        const allowed=api.availability?.(0,ctx.cell);
        html+='<button type="button" class="ctxManage03817" data-natural-study03834="'+kind+'"'+
          (st.state!=='unexplored'||!allowed?.ok?' disabled title="'+esc(allowed?.reason||'No disponible')+'"':'')+'>'+
          '<span><b>'+esc(label)+'</b><small>'+ (kind==='geology'?'Estudiar el subsuelo y descubrir yacimientos.':'Analizar agricultura, pastos y bosque.')+'</small></span><strong>'+ (st.state==='unexplored'?Number(api.cost||0)+' ORO':esc(stateLabel(st)))+'</strong></button>';
      }
    }
    return card('Prospección y estudios',html,
      'Las estimaciones superficiales no revelan recursos concretos sin prospección.');
  }
  function government(ctx){
    const g=window.HexategosStatecraft0380?.governmentCity?.(ctx.cell);
    const policyNames={aid:'Ayuda',invest:'Inversión',autonomy:'Autonomía',garrison:'Guarnición',ration:'Racionamiento',repression:'Coerción'};
    if(!g)return card('Gobierno local',
      '<p class="ctxHelp03817">Sin administración urbana local. Construye una ciudad para consultar estabilidad, nacionalismo y políticas.</p>');
    return card('Gobierno local',
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
        '<b>'+esc(d.name)+'</b><small>'+esc(stageOf(s.kind))+' · nivel '+s.level+'/5</small></div>'+
        '<div class="ctxActivityGrid"><div><h4>Actividad</h4><div class="ctxInline03817"><span>Actividad efectiva <b>'+effective+' %</b></span>'+
        '<span>Sector <b>'+sector+' %</b></span>'+
        '</div></div><div><h4>Producción</h4><p class="ctxHelp03817">Acumulada <b>'+fmt(s.output)+'</b></p>'+
        '<p class="ctxHelp03817"><b>Estado:</b> '+esc(s.status||'Pendiente de simulación')+
        ' · Producción '+fmt(s.lastRate||0)+'/s · Eficiencia '+Math.round(s.efficiency||0)+' %</p>'+
        '</div><div><h4>Abastecimiento</h4>'+
        ((d.electricity||d.group==='manufacture')?
          '<p class="ctxHelp03817">⚡ Electricidad de la red: '+fmt(s.lastPower||0)+'</p>':'')+
        (s.lastInputs?.length?'<p class="ctxHelp03817">Materias disponibles: '+esc(s.lastInputs.map(v=>
          (prod.types[v.kind]?.name||prod.intermediates?.()[v.kind]||v.kind)+' '+fmt(v.available)).join(' · '))+'</p>':'')+
        '</div></div>'+
        (ctx.own?'<label class="ctxControl03817">Producción individual <b data-inspect-value03817="'+esc(identifier)+'">'+active+' %</b>'+
          '<input type="range" min="0" max="100" step="5" value="'+active+'" data-inspect-pct03817="'+esc(identifier)+'"></label>':
          '<p class="ctxHelp03817">Actividad programada: '+active+' %</p>')+
        '</article>';
    }
    if(ctx.own)content+='<button type="button" class="ctxManage03817" data-action="production0388">Construir o mejorar industrias ↗</button>'+
      '<button type="button" class="ctxManage03817" data-inspect-systems03817="eco">Reguladores generales por sector ↗</button>';
    return card('Industria y producción',content,
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
    // One set of sections; tabs are shortcuts, never a second manager.
    return naturalStudies03834(ctx)+industry(ctx)+government(ctx)+materialsSummary(ctx)+portRoutes(ctx);
  }
  const tabsFor=ctx=>{
    const tabs=[['summary','Resumen'],['industry','Industria']];
    if(ctx.city)tabs.push(['government','Gobierno']);
    if(ctx.port)tabs.push(['port','Puerto']);
    return tabs;
  };
  // Small vector symbols also render on devices without emoji fonts.
  const iconPaths={
    operation:'M4 3l16 17M20 3L4 20M3 15l6 6M15 21l6-6M4 3v5M20 3v5',
    city:'M3 21V10h6v11M9 21V3h6v18M15 21V8h6v13M5 13h2M11 6h2M11 10h2M17 11h2M1 21h22',
    industry:'M3 21V11l6-4v4l6-4v4h6v10zM4 10V3h3v6M17 10V2h3v8M6 16h2M11 16h2M17 16h2',
    road:'M8 3L3 21M16 3l5 18M12 3v4M12 10v4M12 17v4M4 21h16',
    fleet:'M12 7v14M8 10h8M3 14v3l9 5 9-5v-3M3 17l2-2M21 17l-2-2M15 4a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
    shield:'M12 2l9 4v6c0 5-6 9-9 10-3-1-9-5-9-10V6z',
    rename:'M3 17L17 3l4 4L7 21H3zM14 6l4 4',
    star:'M12 2l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z',
    info:'M12 10v8M12 6v1M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0',
    nation:'M3 21V3h18v18zM7 6v2M12 6v2M17 6v2M7 11v2M12 11v2M17 11v2M7 16v2M12 16v2M17 16v2',
    resources:'M3 3l18 18M3 9c4-7 11-8 18-3M3 9l5-1',
    government:'M2 8l10-6 10 6zM2 22h20M4 19h16M5 10v9M10 10v9M14 10v9M19 10v9',
    remove:'M4 4l16 16M4 20L20 4',
    food:'M4 2v8h6V2M7 2v20M18 2c-5 6-5 11 0 11V2v20',
    crate:'M3 6l9-4 9 4v13l-9 3-9-3zM3 6l9 4 9-4M12 10v12M7 8v12M17 8v12',
    fuel:'M12 2C10 7 4 12 4 16a8 8 0 0 0 16 0c0-4-6-9-8-14z',
    energy:'M14 2L4 14h7l-1 8L21 9h-8z',
    flag:'M4 22V3c6-5 10 5 16 0v11c-6 5-10-5-16 0',
    warning:'M12 2L1 22h22zM12 9v6M12 18v1',
    balance:'M12 2v20M5 22h14M3 7h18M5 7l-4 9h8zM19 7l-4 9h8z'
  };
  const iconSvg=name=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+(iconPaths[name]||iconPaths.info)+'"/></svg>';
  function simplifyActions(ctx){
    const order=['send_troops','attack','expand','build_city','production0388','build_industry',
      'build_road','transport','build_fort','city_rename','capital_manage','build_port',
      'inspect','supply_diagnosis_03724','nation_dossier_0380','economic_potential_0383','government_city_0386','road_abandon_0374'];
    const buttons=Array.from(actions.querySelectorAll('button.ctxAction3244'));
    const rank=b=>{const i=order.indexOf(b.dataset.action);return i<0?order.length:i};
    buttons.sort((a,b)=>rank(a)-rank(b));
    // Move the actual nodes, preserving delegated and direct listeners.
    const icons={send_troops:'operation',attack:'operation',expand:'operation',build_city:'city',
      production0388:'industry',build_industry:'industry',build_road:'road',transport:'fleet',
      build_fort:'shield',city_rename:'rename',capital_manage:'star',build_port:'fleet',inspect:'info',
      supply_diagnosis_03724:'info',nation_dossier_0380:'nation',economic_potential_0383:'resources',
      government_city_0386:'government',road_abandon_0374:'remove'};
    for(const button of buttons){
      const icon=button.querySelector('.ico3244');
      if(icon&&icons[button.dataset.action])icon.innerHTML=iconSvg(icons[button.dataset.action]);
      if(button.dataset.action==='production0388'){
        const subtitle=button.querySelector('small');if(subtitle)subtitle.textContent='Gestionar producción';
      }
      actions.appendChild(button);
    }
    const ranges=document.getElementById('ctxRanges3246');
    if(ranges){
      root.appendChild(ranges);
      ranges.style.display='';ranges.hidden=!ctx.own;
      const labels=ranges.querySelectorAll('label > span');
      if(labels[0])labels[0].textContent='Fuerza militar';
      if(labels[1])labels[1].textContent='Estrategia de avance';
      if(!ranges.querySelector('.ctxMilitaryHelp')){
        const help=document.createElement('p');help.className='ctxMilitaryHelp';
        help.textContent='Fuerza: porcentaje de tropas disponibles. Avance: 0 % prioriza el objetivo; desde 60 % el motor consolida también el entorno. 100 % prioriza consolidación.';
        ranges.appendChild(help);
      }
    }
  }
  function quickIndicators(ctx){
    const sup=supply(ctx),g=window.HexategosStatecraft0380?.governmentCity?.(ctx.cell);
    const r=sup.diag?.resourcePct;
    // No electrical coverage percentage exists in the engine. Do not reuse fuel.
    const first=[['Alimentos',r?.[0],'green','food'],['Materias primas',r?.[1],'gold','crate'],
      ['Petróleo y gas',r?.[2],'gold','fuel'],['Energía',null,'gold','energy']];
    const second=[['Bienes civiles',r?.[3],'blue','nation'],['Material militar',r?.[4],'blue','operation'],
      ['Estabilidad',g?.stability,'blue','balance'],['Nacionalismo',g?.nationalism,'red','flag'],
      ['Escasez',g?.scarcity==null?null:num(g.scarcity)+'/300','red','warning'],
      ['Situación',g?(g.riot?'Disturbios':g.strike?'Huelga':g.occupied?'Ocupada':'Normal'):null,'green','shield']];
    const row=(items,cls)=>'<div class="ctxIndicatorRow '+cls+'">'+items.map(([label,value,tone,icon])=>{
      const numeric=typeof value==='number'&&Number.isFinite(value);
      return '<div class="ctxIndicator" data-tone="'+tone+'"><i aria-hidden="true">'+iconSvg(icon)+'</i><div><span>'+esc(label)+'</span><b>'+ (value==null?'<abbr title="No disponible" aria-label="No disponible">N/D</abbr>':numeric?pct(value)+' %':esc(value))+'</b>'+
        (numeric?'<div class="ctxTrack03817"><i style="width:'+pct(value)+'%"></i></div>':'')+'</div></div>';
    }).join('')+'</div>';
    return row(first,'ctxPrimaryIndicators')+row(second,'ctxSecondaryIndicators');
  }
  function mount(ctx){
    if(ctx?.kind!=='cell'||!Number.isInteger(ctx.cell)){
      panel.hidden=true;details.hidden=true;root.classList.remove('hexInspectorActive03817');
      return;
    }
    const changed=lastCell!==ctx.cell;
    if(changed){tab='summary';lastCell=ctx.cell;openSection03858='';}
    const permitted=tabsFor(ctx),oldScroll=changed?0:root.scrollTop;
    if(!permitted.some(v=>v[0]===tab))tab='summary';
    root.classList.add('hexInspectorActive03817');panel.hidden=false;details.hidden=false;
    const val=population(ctx.cell),title=document.getElementById('ctxTitle3244');
    if(title){
      title.textContent=(typeof placeDisplayName3271==='function'?placeDisplayName3271(ctx.cell):ctx.geo||'Territorio')+
        (ctx.ownCapital||ctx.capital||capitals?.[ctx.owner]===ctx.cell?' ★':'');
      const populationLabel=document.createElement('span');populationLabel.className='ctxPopulation';
      populationLabel.textContent=val?' ≈ '+num(val.value)+' hab.':'';
      populationLabel.title='Población estimada por el modelo del juego; no es un censo';title.appendChild(populationLabel);
    }
    const meta=document.getElementById('ctxMeta3244');
    if(meta){
      const owner=ctx.owner>=0?factionName3230(ctx.owner):'Territorio neutral';
      const terrain=typeof terrainSummary3244==='function'?terrainSummary3244(ctx.cell).split(' · ')[0]:profile(ctx.cell)?.type||'';
      const road=typeof roadCellMask3251!=='undefined'&&roadCellMask3251?.[ctx.cell];
      const info=[ctx.geo,terrain,owner,road?'Carretera':'Sin carretera',ctx.port?'Puerto':'Sin puerto'].filter(Boolean);
      let logistics='';
      if(ctx.own&&typeof supplyDetail3253==='function'){
        const d=supplyDetail3253(ctx.cell);
        logistics='Desde '+d.source+' · '+d.hops+' saltos · conexión '+pct(d.pct)+' %';
      }
      meta.innerHTML='<span>'+info.map(esc).join(' · ')+'</span>'+(logistics?'<span>'+esc(logistics)+'</span>':'');
    }
    panel.innerHTML=quickIndicators(ctx)+'<nav class="ctxNav03817" aria-label="Información del hexágono">'+
      permitted.map(([key,name])=>'<button type="button" data-inspect-tab03817="'+key+'" aria-pressed="'+(key===tab)+'">'+name+'</button>').join('')+'</nav>';
    const content=renderDetails(ctx);
    if(details._content!==content){details.innerHTML=content;details._content=content;}
    simplifyActions(ctx);
    root.scrollTo({top:oldScroll,behavior:'instant'});
  }
  function revealSection(section){
    const box=root.getBoundingClientRect(),rect=section.getBoundingClientRect();
    const header=root.querySelector('.ctxHead3244').getBoundingClientRect();
    if(rect.top<header.bottom||rect.bottom>box.bottom){
      root.scrollTo({top:root.scrollTop+rect.top-header.bottom-8,behavior:'smooth'});
    }
  }
  function render(ctx){
    // El motor original también reconstruye el menú contextual. Tomar la
    // posición ANTES de llamar al renderer original para evitar saltos.
    const sameCell=ctx?.kind==='cell'&&ctx.cell===lastCell;
    const previousOuter=sameCell?(root.scrollTop||0):0;
    const out=original.apply(this,arguments);
    try{mount(ctx)}catch(err){console.warn('[HEXATEGOS 0.38.61 Inspector]',err)}
    if(sameCell){
      root.scrollTo({top:previousOuter,behavior:'instant'});
    }
    return out;
  }
  renderContextDialog3244=render;
  if(typeof renderContextDialog3246==='function')renderContextDialog3246=render;
  for(const type of ['wheel','touchmove'])root.addEventListener(type,event=>event.stopPropagation(),{passive:true});
  const baseOpen=openContextDialog3244;
  openContextDialog3244=function(ctx){
    const changed=ctx?.cell!==lastCell;
    const position=changed?0:root.scrollTop;
    if(changed)tab='summary';
    const out=baseOpen.apply(this,arguments);
    root.scrollTo({top:position,behavior:'instant'});
    return out;
  };
  if(typeof openContextDialog3245==='function')openContextDialog3245=openContextDialog3244;
  root.addEventListener('click',event=>{
    const action=event.target.closest?.('[data-action]');
    if(action&&['send_troops','attack','expand','transport'].includes(action.dataset.action)&&Number(strength3212.value)===0){
      event.preventDefault();event.stopImmediatePropagation();
      if(typeof toast==='function')toast('Selecciona una fuerza militar mayor que 0 %.');
      return;
    }
    const study=event.target.closest?.('[data-natural-study03834]');
    if(study){
      event.preventDefault();event.stopPropagation();
      const ctx=uiInteractionState3244?.contextData;
      if(ctx?.kind==='cell'&&ctx.own){
        const api=study.dataset.naturalStudy03834==='geology'?
          window.HexategosProspection03831:window.HexategosAgronomy03832;
        const outcome=api?.begin?.(0,ctx.cell);
        if(!outcome?.ok&&typeof toast==='function')toast(outcome?.reason||'Estudio no disponible');
        else{
          if(typeof toast==='function')toast('Estudio iniciado');
          mount(ctx);
        }
      }
      return;
    }
    const nav=event.target.closest('[data-inspect-tab03817]');
    if(nav){
      event.preventDefault();event.stopPropagation();
      tab=nav.dataset.inspectTab03817;
      const ctx=uiInteractionState3244?.contextData;
      if(ctx?.kind==='cell'){
        openSection03858=tab==='summary'?'':tab;
        mount(ctx);
        const section=details.querySelector('[data-hex-section03858="'+tab+'"]');
        if(section){section.open=true;revealSection(section);}
        else root.scrollTop=0;
      }
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
      const val=details.querySelector('[data-inspect-value03817="'+id+'"]');
      if(val)val.textContent=pct(input.value)+' %';
    }
  });
  root.addEventListener('change',event=>{
    if(event.target.matches('[data-inspect-pct03817]'))saveGame3212();
  });
  // Únicamente el guardado de instalaciones existentes; no se añade un timer.
  details.addEventListener('toggle',event=>{
    const target=event.target;
    if(!target?.matches?.('details[data-hex-section03858]')||!target.isConnected)return;
    if(!target.open){
      if(openSection03858===target.dataset.hexSection03858)openSection03858='';
      return;
    }
    if(!target.isConnected)return;
    openSection03858=target.dataset.hexSection03858;
    for(const other of details.querySelectorAll('details[data-hex-section03858]')){
      if(other!==target)other.open=false;
    }
  },true);
  window.HexategosHexInspector03817={
    version:BUILD,population,
    refresh:()=>{const c=uiInteractionState3244?.contextData;if(c?.kind==='cell')mount(c)},
    current:()=>({cell:lastCell,tab}),
    tabsFor:ctx=>tabsFor(ctx).map(x=>x[0])
  };
  console.info('[HEXATEGOS] '+BUILD+' · ficha por hexágono, recursos, producción, gobierno y tráfico portuario.');
})();