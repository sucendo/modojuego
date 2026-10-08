'use strict';
/* HEXATEGOS 0.38.8 · Cadenas industriales territoriales.
   Una instalación explota como máximo 7 hexágonos; inventario material
   concentrado en nodos, nunca un objeto de producción por celda. */
(() => {
  const VERSION='0.38.8';
  const SAVE_KEY='hexategos.production.0388';
  const MAX_SITES=3200,MAX_PER_NATION=18;
  const TYPES={
    oil:     {name:'Pozo de petróleo', icon:'🛢',sector:'energy',   group:'extract',material:'oil', cost:100},
    gas:     {name:'Pozo de gas',       icon:'🔥',sector:'energy',   group:'extract',material:'gas', cost:100},
    iron:    {name:'Mina de hierro',    icon:'⛏',sector:'mining',   group:'extract',material:'iron',cost:85},
    copper:  {name:'Mina de cobre',     icon:'⛏',sector:'mining',   group:'extract',material:'copper',cost:90},
    timber:  {name:'Explotación forestal',icon:'🌲',sector:'mining',group:'extract',material:'timber',cost:65},
    quarry:  {name:'Cantera',           icon:'🪨',sector:'mining',   group:'extract',material:'quarry',cost:70},
    crops:   {name:'Cultivos',          icon:'🌾',sector:'farming',  group:'extract',material:'crops',cost:55},
    livestock:{name:'Granja ganadera',  icon:'🐄',sector:'farming',  group:'extract',material:'livestock',cost:65},
    refinery:{name:'Refinería',         icon:'🏭',sector:'manufacturing',group:'factory',inputs:['oil'],output:2,cost:160},
    gasplant:{name:'Planta de gas',     icon:'🏭',sector:'manufacturing',group:'factory',inputs:['gas'],output:2,cost:140},
    steel:   {name:'Siderurgia',        icon:'🏭',sector:'manufacturing',group:'factory',inputs:['iron'],output:1,cost:155},
    smelter: {name:'Metalurgia',        icon:'🏭',sector:'manufacturing',group:'factory',inputs:['copper'],output:1,cost:135},
    sawmill: {name:'Aserradero',        icon:'🏭',sector:'manufacturing',group:'factory',inputs:['timber'],output:1,cost:105},
    cement:  {name:'Cementera',         icon:'🏭',sector:'manufacturing',group:'factory',inputs:['quarry'],output:1,cost:120},
    foodplant:{name:'Industria alimentaria',icon:'🏭',sector:'manufacturing',group:'factory',inputs:['crops','livestock'],output:0,cost:115}
  };
  const SECTORS={energy:'Energía',mining:'Minería y madera',farming:'Agricultura y ganadería',manufacturing:'Transformación industrial'};
  const RECIPE={oil:'refinery',gas:'gasplant',iron:'steel',copper:'smelter',timber:'sawmill',quarry:'cement',crops:'foodplant',livestock:'foodplant'};
  const rawTypes=Object.keys(TYPES).filter(k=>TYPES[k].group==='extract');
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sites=new Map(),depots=new Map(),sectorPct=new Map(),nextAI=new Float64Array(FACTIONS3230.length);
  let revision=1, aiCursor=1, lastStats={produced:0,processed:0,shipped:0,disconnected:0,sites:0};
  let loadedPortable=null;
  const api=()=>window.HexategosTradeLogistics0370;
  const geography=cell=>api()?.geography?.(cell);
  const sec=(f,s)=>sectorPct.get(f)?.[s]??100;
  const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  function adjacent(cell){
    const L=loadLevel(MAX_GAME_LEVEL3233);
    if(!Number.isInteger(cell)||cell<0||cell>=L.n)return [];
    const cells=[cell];
    for(let k=L.offsets[cell];k<L.offsets[cell+1];k++){
      const n=L.edgeNbr[k];
      if(n>=0&&!cells.includes(n))cells.push(n);
    }
    return cells;
  }
  function terrainWeight(kind,g,cell){
    if(!g)return 0;
    const t=g.type,food=g.food||.6,raw=g.raw||.7,fuel=g.fuel||.6;
    const hash=(Math.imul(cell+13,1103515245)^Math.imul(kind.length,2654435761))>>>0;
    const variation=.76+(hash%100)/210;
    const arid=t==='desert'||t==='steppe',mountain=t==='mountain'||t==='highmountain';
    const woodland=t==='forest'||t==='jungle';
    let v=0;
    if(kind==='oil')v=fuel*(arid?1.25:.78);
    else if(kind==='gas')v=fuel*(arid?1.13:.9)*(.75+(hash%31)/70);
    else if(kind==='iron')v=raw*(mountain?1.35:.85);
    else if(kind==='copper')v=raw*(mountain?1.22:.82)*(.72+(hash%43)/95);
    else if(kind==='timber')v=raw*(woodland?1.6:.12);
    else if(kind==='quarry')v=raw*(mountain?1.4:.86);
    else if(kind==='crops')v=food*(t==='plain'||t==='mediterranean'?1.25:.85);
    else if(kind==='livestock')v=food*(t==='steppe'||t==='plain'?1.2:.85);
    return clamp(v*variation,0,2.9);
  }
  function potential(cell,f,kind){
    const t=TYPES[kind];
    if(!t||t.group!=='extract'||owner6[cell]!==f)return 0;
    let sum=0;
    for(const c of adjacent(cell)){
      if(owner6[c]!==f)continue;
      sum+=terrainWeight(kind,geography(c),c);
    }
    return clamp(sum/7,0,2.6);
  }
  function efficiency(f){
    const role=FACTIONS3230[f]?.role||'balanced';
    const mind=window.HexategosNationAI0360?.mindset?.(f)||'';
    const baseline=.65+((Math.imul(f+37,214013)>>>3)%35)/100;
    const strategic=role==='growth'||mind==='trader'?.12:role==='aggressive'?-.05:0;
    return f===0?1:clamp(baseline+strategic,.55,1.16);
  }
  function countNation(f){let n=0;for(const s of sites.values())if(s.f===f)n++;return n}
  function connect(cell,f){
    const road=api()?.roadComponent;
    if(!road)return -1;
    let comp=road(cell);
    if(comp>=0)return comp;
    for(const c of adjacent(cell)){
      if(c!==cell&&owner6[c]===f){comp=road(c);if(comp>=0)return comp}
    }
    return -1;
  }
  function build(f,cell,kind,charge=true){
    const def=TYPES[kind],isPlayer=f===0;
    if(!def||!Number.isInteger(cell)||cell<0||cell>=owner6.length||owner6[cell]!==f||
       sites.has(cell)||sites.size>=MAX_SITES||countNation(f)>=MAX_PER_NATION)return false;
    const price=def.cost;
    if(charge){
      if(isPlayer){if(gold3212<price)return false;gold3212-=price}
      else {if(botGold3230[f]<price+45)return false;botGold3230[f]-=price}
    }
    const s={cell,f,kind,level:1,pct:100,stock:0,output:0,potential:def.group==='extract'?potential(cell,f,kind):1,updated:campaignSeconds3230||0};
    sites.set(cell,s);revision++;
    return true;
  }
  function upgrade(cell){
    const s=sites.get(cell);if(!s||s.f!==0||s.level>=5)return false;
    const cost=TYPES[s.kind].cost*(s.level+1);
    if(gold3212<cost)return false;
    gold3212-=cost;s.level++;revision++;return true;
  }
  function setPct(cell,pct){
    const s=sites.get(Number(cell));
    if(!s||s.f!==0)return false;
    s.pct=clamp(Math.round(Number(pct)||0),0,100);
    return true;
  }
  function setSector(f,name,pct){
    if(!SECTORS[name]||f!==0)return false;
    if(!sectorPct.has(f))sectorPct.set(f,{});
    sectorPct.get(f)[name]=clamp(Math.round(Number(pct)||0),0,100);
    return true;
  }
  function groupKey(f,comp,cell){
    return comp>=0?f+':r'+comp:f+':i'+cell;
  }
  function activeFactor(s){
    return clamp(Math.min(s.pct,sec(s.f,TYPES[s.kind].sector))/100,0,1)*efficiency(s.f);
  }
  function tick({nodes,routes,dt}){
    if(!started3230)return;
    const now=campaignSeconds3230||0,groups=new Map();
    const group=(f,comp,cell)=>{
      const key=groupKey(f,comp,cell);
      let g=groups.get(key);
      if(!g){g={key,f,raw:new Map(),factories:[]};groups.set(key,g)}
      return g;
    };
    const conn=new Map();
    let produced=0,processed=0,shipped=0,disconnected=0;
    // Capturas y pérdida de instalaciones: no se reconstruye el mapa entero.
    for(const s of sites.values()){
      const owner=owner6[s.cell];
      if(owner>=0&&owner!==s.f){s.f=owner;s.stock*=.5;s.pct=75;revision++}
      if(owner<0||owner!==s.f)continue;
      const n=nodes.get(s.cell);
      if(!n)continue;
      const comp=connect(s.cell,s.f);
      conn.set(s.cell,comp);
      if(comp<0)disconnected++;
      const g=group(s.f,comp,s.cell);
      const def=TYPES[s.kind];
      if(def.group==='extract'){
        if(now-s.updated>=36){
          s.potential=potential(s.cell,s.f,s.kind);s.updated=now;
        }
        const amount=clamp(s.potential,0,2.6)*.37*s.level*activeFactor(s)*dt;
        const before=s.stock;s.stock=clamp(s.stock+amount,0,65*s.level);
        produced+=s.stock-before;
        if(!g.raw.has(s.kind))g.raw.set(s.kind,[]);
        g.raw.get(s.kind).push({site:s});
      }else{
        g.factories.push({site:s,node:n});
      }
    }
    // Los cargamentos de los puertos se pueden recoger únicamente desde
    // una instalación que comparta una red viaria (o el propio puerto).
    for(const [cell,d] of depots){
      const f=owner6[cell];
      if(f<0||!ports3212.has(cell)){depots.delete(cell);continue}
      const comp=connect(cell,f);
      const g=group(f,comp,cell);
      for(const kind of rawTypes){
        if((d[kind]||0)<=0)continue;
        if(!g.raw.has(kind))g.raw.set(kind,[]);
        g.raw.get(kind).push({depot:d,kind});
      }
    }
    function take(g,kind,amount){
      const sources=g?.raw.get(kind)||[];
      let remaining=amount,taken=0;
      for(const x of sources){
        if(remaining<=.000001)break;
        const available=x.site?x.site.stock:x.depot[kind]||0;
        const qty=Math.min(available,remaining);
        if(qty<=0)continue;
        if(x.site)x.site.stock-=qty;else x.depot[kind]-=qty;
        taken+=qty;remaining-=qty;
      }
      return taken;
    }
    function available(g,kind){
      return (g?.raw.get(kind)||[]).reduce((total,x)=>total+(x.site?x.site.stock:x.depot[kind]||0),0);
    }
    // Solo se mueve materia físicamente por rutas existentes entre nodos.
    // Las fábricas receptoras determinan qué mercancía debe viajar.
    for(const r of routes){
      if((r.type!=='sea'&&r.type!=='land')||r.status==='closed'||r.status==='blocked'||
        r.status==='broken'||r.status==='suspended'||r.status==='rebuilding')continue;
      if(r.a!==r.b&&!window.HexategosStatecraft0380?.canTrade?.(r.a,r.b))continue;
      const a=nodes.get(r.from),b=nodes.get(r.to);
      if(!a||!b)continue;
      const ga=groups.get(groupKey(r.a,a.comp,r.from));
      const gb=groups.get(groupKey(r.b,b.comp,r.to));
      if(ga===gb)continue;
      const directions=[[ga,gb,r.to],[gb,ga,r.from]];
      const factor=clamp(1-(r.navalRisk||0)*.025,.25,1);
      let budget=(r.type==='sea'?.58:.42)*dt*factor;
      for(const [src,dst,port] of directions){
        if(!src||!dst||!dst.factories.length||budget<=0)continue;
        if(r.type==='sea'&&!ports3212.has(port))continue;
        const wanted=new Set();
        for(const f of dst.factories)for(const kind of TYPES[f.site.kind].inputs)wanted.add(kind);
        for(const kind of wanted){
          if(budget<=0)break;
          // No inundar puertos que ya tienen materiales suficientes.
          const destinationAvailable=available(dst,kind);
          if(destinationAvailable>=30)continue;
          const quantity=Math.min(budget,30-destinationAvailable,available(src,kind));
          if(quantity<=0)continue;
          if(!depots.has(port))depots.set(port,{});
          const dstStock=depots.get(port);
          const cargo=take(src,kind,quantity);
          dstStock[kind]=(dstStock[kind]||0)+cargo;
          if(!dst.raw.has(kind))dst.raw.set(kind,[]);
          if(!dst.raw.get(kind).some(x=>x.depot===dstStock&&x.kind===kind))
            dst.raw.get(kind).push({depot:dstStock,kind});
          budget-=cargo;shipped+=cargo;
        }
      }
    }
    // Transformación en instalaciones fabriles; los productos terminados
    // entran en el inventario material original y circulan hacia las ciudades.
    for(const g of groups.values()){
      for(const item of g.factories){
        const s=item.site,n=item.node,def=TYPES[s.kind],out=def.output;
        const room=Math.max(0,n.cap[out]-n.stock[out]);
        if(room<=0)continue;
        let amount=Math.min(room/.90,.39*s.level*activeFactor(s)*dt);
        let spent=0;
        for(const kind of def.inputs){
          if(amount<=0)break;
          const part=take(g,kind,amount);
          spent+=part;amount-=part;
        }
        if(spent<=0)continue;
        const created=Math.min(room,spent*.90);
        n.stock[out]+=created;processed+=created;s.output+=created;
      }
    }
    // La IA invierte escalonadamente, siempre con su presupuesto y de forma
    // condicionada por riqueza geográfica y carencias de su economía.
    const batch=activeFactionCount3230>350?10:activeFactionCount3230>180?8:5;
    for(let i=0;i<batch&&activeFactionCount3230>1;i++){
      if(aiCursor>=activeFactionCount3230)aiCursor=1;
      aiDevelop(aiCursor++);
    }
    lastStats={produced:+produced.toFixed(2),processed:+processed.toFixed(2),
      shipped:+shipped.toFixed(2),disconnected,sites:sites.size};
  }
  function aiDevelop(f){
    if(f<=0||f>=activeFactionCount3230||!Number.isInteger(capitals[f]))return;
    const now=campaignSeconds3230||0;
    if(now<nextAI[f])return;
    nextAI[f]=now+44+(f%11)*6;
    if(botGold3230[f]<150||countNation(f)>=MAX_PER_NATION)return;
    const own=[...sites.values()].filter(s=>s.f===f);
    const summary=api()?.resourceSummaryCached?.(f);
    const coverage=summary?.coverage||[.5,.5,.5];
    const pressure={energy:Math.max(.05,1-(coverage[2]||0)),mining:Math.max(.05,1-(coverage[1]||0)),
      farming:Math.max(.05,1-(coverage[0]||0))};
    const missing=rawTypes.filter(kind=>!own.some(s=>s.kind===kind));
    const factoryNeeds=[];
    for(const site of own){
      const recipe=RECIPE[site.kind];
      if(TYPES[site.kind].group==='extract'&&recipe&&!own.some(s=>s.kind===recipe))
        factoryNeeds.push(recipe);
    }
    const role=FACTIONS3230[f]?.role||'balanced';
    let choice=null,score=0;
    const sample=aiNationalSamples3275?.[f]||[];
    const cells=[capitals[f]];
    const step=Math.max(1,Math.ceil(sample.length/36));
    for(let i=0;i<sample.length&&cells.length<40;i+=step)cells.push(sample[i]);
    for(const cell of cells){
      if(!Number.isInteger(cell)||owner6[cell]!==f||sites.has(cell))continue;
      const road=connect(cell,f);
      // Preferimos nodos conectados, no colonizamos el mapa de iconos.
      const logistics=road>=0?1.38:.48;
      for(const kind of missing){
        const type=TYPES[kind],p=potential(cell,f,kind);
        const need=pressure[type.sector]||.2;
        const value=p*(.72+need*1.35)*logistics;
        if(value>score&&botGold3230[f]>type.cost+65){score=value;choice={cell,kind}}
      }
      for(const kind of factoryNeeds){
        const type=TYPES[kind];
        const value=(road>=0?2.7:.28)*(role==='growth'?1.25:1);
        if(value>score&&botGold3230[f]>type.cost+65){score=value;choice={cell,kind}}
      }
    }
    if(choice&&score>.35&&build(f,choice.cell,choice.kind,true))nextAI[f]=now+70+(f%13)*6;
  }
  function saveState(){
    return {v:1,sites:[...sites.values()].map(s=>({cell:s.cell,f:s.f,kind:s.kind,
      level:s.level,pct:s.pct,stock:s.stock,output:s.output})),
      depots:[...depots],sectors:[...sectorPct]};
  }
  function restore(data){
    sites.clear();depots.clear();sectorPct.clear();revision++;aiCursor=1;nextAI.fill(0);
    if(!data||!Array.isArray(data.sites))return;
    for(const x of data.sites.slice(0,MAX_SITES)){
      if(!x||!TYPES[x.kind]||!Number.isInteger(x.cell)||x.cell<0||x.cell>=owner6.length)continue;
      const f=owner6[x.cell];
      if(f<0)continue;
      sites.set(x.cell,{cell:x.cell,f,kind:x.kind,level:clamp(Math.trunc(x.level||1),1,5),
        pct:clamp(Number(x.pct??100),0,100),stock:clamp(Number(x.stock)||0,0,325),
        output:Math.max(0,Number(x.output)||0),potential:potential(x.cell,f,x.kind),
        updated:campaignSeconds3230||0});
    }
    if(Array.isArray(data.depots))for(const [cell,d] of data.depots.slice(0,MAX_SITES)){
      if(Number.isInteger(cell)&&ports3212.has(cell)&&d&&typeof d==='object'){
        const clean={};for(const kind of rawTypes)clean[kind]=clamp(Number(d[kind])||0,0,65);
        depots.set(cell,clean);
      }
    }
    if(Array.isArray(data.sectors))for(const [f,values] of data.sectors){
      if(Number.isInteger(f)&&values&&typeof values==='object'){
        const clean={};for(const sector of Object.keys(SECTORS))
          clean[sector]=clamp(Number(values[sector]??100),0,100);
        sectorPct.set(f,clean);
      }
    }
  }
  const baseSave=saveGame3212;
  saveGame3212=function(){const out=baseSave.apply(this,arguments);
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(saveState()))}catch(_){}return out};
  const baseLoad=loadGame3212;
  loadGame3212=function(){const out=baseLoad.apply(this,arguments);
    try{restore(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'))}catch(_){restore(null)}
    return out};
  const baseReset=resetGame3230;
  resetGame3230=function(clearSave=true){const out=baseReset.apply(this,arguments);
    restore(null);if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out};
  if(typeof buildPortableFile3275==='function'){
    const base=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=base.apply(this,arguments);
      if(file?.payload){file.payload.production0388=saveState();
        if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload))}
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const base=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const input=file?.payload?.production0388||null;
      const out=base.apply(this,arguments);
      restore(input);
      try{localStorage.setItem(SAVE_KEY,JSON.stringify(saveState()))}catch(_){}
      return out;
    };
  }
  function economyPanel(){
    if(sysTab3220!=='eco'||!started3230)return;
    const host=document.getElementById('sysContent3213');
    if(!host||host.querySelector('#productionDashboard0388'))return;
    const wrapper=document.createElement('div');
    wrapper.className='sysBlock3213 industryDashboard0388';
    wrapper.id='productionDashboard0388';
    const mine=[...sites.values()].filter(s=>s.f===0);
    const count=mine.length;
    const summary=api()?.resourceSummaryCached?.(0);
    const rows=Object.entries(SECTORS).map(([k,label])=>
      '<label class="industrySector0388"><span>'+esc(label)+'</span>'+
      '<input type="range" min="0" max="100" step="5" value="'+sec(0,k)+'" data-industry-sector0388="'+k+'">'+
      '<b data-industry-sector-label0388="'+k+'">'+sec(0,k)+'%</b></label>').join('');
    const data=mine.map(s=>{
      const def=TYPES[s.kind],hasRoad=connect(s.cell,0)>=0;
      const place=typeof placeDisplayName3271==='function'?placeDisplayName3271(s.cell):'Hexágono '+s.cell;
      return '<div class="industrySite0388"><div><b>'+def.icon+' '+esc(def.name)+'</b>'+
        '<small>'+esc(place)+' · Nivel '+s.level+'/5 · '+(hasRoad?'Conectada':'Sin carretera')+
        (def.group==='extract'?' · Yacimiento '+Math.round(s.potential*100)+'%':' · Transformación')+'</small></div>'+
        '<label>Actividad <input type="range" min="0" max="100" step="5" value="'+s.pct+'" data-industry-site0388="'+s.cell+'"></label>'+
        '<span data-industry-site-label0388="'+s.cell+'">'+s.pct+'%</span>'+
        '<button data-industry-upgrade0388="'+s.cell+'" '+(s.level>=5?'disabled':'')+'>Mejorar</button></div>';
    }).join('');
    wrapper.innerHTML='<h3>🏭 Producción territorial</h3>'+
      '<p>Explotaciones de hasta siete hexágonos. La extracción se almacena localmente; las fábricas necesitan una conexión logística para recibirla. Los productos transformados abastecen ciudades mediante la red comercial.</p>'+
      '<div class="industryStats0388"><span>Instalaciones <b>'+count+'</b></span><span>Extracción/ciclo <b>'+lastStats.produced+'</b></span>'+
      '<span>Transformado/ciclo <b>'+lastStats.processed+'</b></span><span>Combustible nacional <b>'+Math.round((summary?.coverage?.[2]||0)*100)+'%</b></span></div>'+
      '<h4>Reguladores nacionales por sector</h4><div class="industrySectors0388">'+rows+'</div>'+
      '<h4>Instalaciones y control individual</h4>'+
      (count?'<div class="industrySites0388">'+data+'</div>':'<p>Sin instalaciones especializadas. Selecciona un hexágono propio y pulsa INDUSTRIA PRODUCTIVA para construir.</p>')+
      '<p class="industryNote0388">Una explotación aislada puede producir y almacenar, pero no abastecerá a fábricas desconectadas. Los suministros existentes siguen activos durante la transición económica.</p>';
    host.prepend(wrapper);
  }
  const baseRender=renderSystems3220;
  renderSystems3220=function(){const r=baseRender.apply(this,arguments);
    try{economyPanel()}catch(e){console.warn('[Hexategos Production UI]',e)}
    return r};
  const systemHost=document.getElementById('sysContent3213');
  systemHost?.addEventListener('input',event=>{
    const target=event.target;
    if(target.matches('[data-industry-site0388]')){
      const cell=Number(target.dataset.industrySite0388);
      if(setPct(cell,target.value)){
        const label=systemHost.querySelector('[data-industry-site-label0388="'+cell+'"]');
        if(label)label.textContent=target.value+'%';
      }
    }
    if(target.matches('[data-industry-sector0388]')){
      const sector=target.dataset.industrySector0388;
      if(setSector(0,sector,target.value)){
        const label=systemHost.querySelector('[data-industry-sector-label0388="'+sector+'"]');
        if(label)label.textContent=target.value+'%';
      }
    }
  });
  systemHost?.addEventListener('click',event=>{
    const button=event.target.closest('[data-industry-upgrade0388]');
    if(!button)return;
    if(!upgrade(Number(button.dataset.industryUpgrade0388)))
      {if(typeof toast==='function')toast('No se puede mejorar la instalación')}
    renderSystems3220();
  });
  function showBuildModal(cell){
    if(owner6[cell]!==0)return false;
    closeContextDialog3244();
    uiInteractionState3244.modal={type:'production0388',data:{cell}};
    modal3244.classList.add('open3244');modal3244.setAttribute('aria-hidden','false');
    modalTitle3244.textContent='Industria productiva · '+(typeof placeDisplayName3271==='function'?placeDisplayName3271(cell):'Territorio');
    const existing=sites.get(cell);
    if(existing){
      modalBody3244.innerHTML='<div class="industryModal0388"><p>Ya existe una instalación en este hexágono: '+esc(TYPES[existing.kind].name)+'. Puedes mejorarla desde Sistemas → Economía.</p></div>';
    }else{
      const sections=[['extract','Explotaciones primarias'],['factory','Industrias transformadoras']];
      modalBody3244.innerHTML='<div class="industryModal0388"><p>Cada explotación aprovecha el recurso de este hexágono y hasta seis vecinos propios. Solo llegará a otras industrias si existe conexión logística.</p>'+
        sections.map(([group,title])=>'<h4>'+title+'</h4><div class="industryBuildGrid0388">'+
          Object.entries(TYPES).filter(([k,v])=>v.group===group).map(([kind,def])=>{
            const strength=group==='extract'?Math.round(potential(cell,0,kind)*100):null;
            const disabled=gold3212<def.cost?'disabled':'';
            return '<button type="button" data-industry-build0388="'+kind+'" '+disabled+'>'+
              def.icon+' <b>'+esc(def.name)+'</b><small>'+def.cost+' oro'+(strength===null?'':' · potencial '+strength+'%')+'</small></button>';
          }).join('')+'</div>').join('')+'</div>';
    }
    modalActions3244.innerHTML='<button data-modal-action="close">CERRAR</button>';
    return true;
  }
  const baseActions=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const actions=baseActions.apply(this,arguments);
    if(ctx?.kind==='cell'&&Number.isInteger(ctx.cell)&&owner6[ctx.cell]===0&&!actions.some(a=>a.id==='production0388'))
      actions.push(classicAction3246('production0388','ECONOMÍA','🏭','INDUSTRIA PRODUCTIVA',true,''));
    return actions;
  };
  const baseHandle=handleContextAction3244;
  handleContextAction3244=function(id){
    if(id==='production0388'){
      const ctx=uiInteractionState3244?.contextData;
      if(ctx?.kind==='cell'&&Number.isInteger(ctx.cell))showBuildModal(ctx.cell);
      return;
    }
    return baseHandle.apply(this,arguments);
  };
  modalBody3244?.addEventListener('click',event=>{
    const button=event.target.closest('[data-industry-build0388]');
    if(!button||uiInteractionState3244?.modal?.type!=='production0388')return;
    const cell=uiInteractionState3244.modal.data?.cell,kind=button.dataset.industryBuild0388;
    if(build(0,cell,kind,true)){
      if(typeof toast==='function')toast(TYPES[kind].name+' construida');
      modal3244.classList.remove('open3244');modal3244.setAttribute('aria-hidden','true');
      if(typeof sysTab3220==='string'&&sysTab3220==='eco')renderSystems3220();
    }else if(typeof toast==='function')toast('Terreno ocupado, límite alcanzado u oro insuficiente');
  });
  // Un único icono discreto por instalación visible; nunca se dibujan
  // los otros seis hexágonos ni una carretera por cada recurso.
  const baseDraw=drawInfrastructure3212;
  drawInfrastructure3212=function(R,cx,cy,now){
    const out=baseDraw.apply(this,arguments);
    if(currentKey!==MAX_GAME_LEVEL3233||zoom<7||!sites.size)return out;
    const C=loadLevel(MAX_GAME_LEVEL3233).centers;
    let drawn=0;
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    for(const s of sites.values()){
      if(drawn>=140)break;
      if(owner6[s.cell]!==s.f||s.f<0)continue;
      if(s.f!==0&&zoom<13)continue;
      const j=s.cell*3;
      const p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(p[2]<.06||p[0]<-14||p[0]>vw+14||p[1]<-14||p[1]>vh+14)continue;
      const icon=TYPES[s.kind].icon;
      const radius=Math.min(11,Math.max(6,globeIconScale3249()*.62));
      ctx.fillStyle='rgba(5,18,28,.82)';
      ctx.beginPath();ctx.arc(p[0],p[1],radius,0,Math.PI*2);ctx.fill();
      ctx.font=Math.round(radius*1.5)+'px system-ui, sans-serif';
      ctx.fillText(icon,p[0],p[1]+.4);
      drawn++;
    }
    ctx.restore();return out;
  };
  window.HexategosProduction0388={
    version:VERSION,types:TYPES,cells:()=>sites.keys(),revision:()=>revision,tick,
    sites:()=>[...sites.values()].map(s=>({...s})),sector:(f,s)=>sec(f,s),
    build,upgrade,setPct,setSector,potential,efficiency,
    stats:()=>({...lastStats}),validate:()=>{
      const errors=[];for(const s of sites.values())if(!TYPES[s.kind]||s.cell<0)errors.push('instalación inválida');
      return {ok:!errors.length,errors,stats:lastStats};
    }
  };
  console.info('[HEXATEGOS] '+VERSION+' · industrias primarias, transformación y logística material.');
})();
