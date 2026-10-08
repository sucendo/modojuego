'use strict';
/* HEXATEGOS 0.38.8 · Cadenas industriales territoriales.
   Una instalación explota como máximo 7 hexágonos; inventario material
   concentrado en nodos, nunca un objeto de producción por celda. */
(() => {
  const VERSION='0.38.15';
  const SAVE_KEY='hexategos.production.0388';
  const MAX_SITES=5600,AI_RESERVED_FOR_PLAYER=160,MAX_PLAYER_SITES=160,MAX_PER_CELL=3;
  const MAX_PER_NATION=18;
  const aiSiteLimit=()=>activeFactionCount3230>=350?9:activeFactionCount3230>=200?12:MAX_PER_NATION;
  const nationLimit=f=>f===0?MAX_PLAYER_SITES:aiSiteLimit();
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
    foodplant:{name:'Industria alimentaria',icon:'🏭',sector:'manufacturing',group:'factory',inputs:['crops','livestock'],inputMode:'any',output:0,cost:115},
    thermal:{name:'Central termoeléctrica',icon:'⚡',sector:'energy',group:'power',inputs:['fuel','gasfuel'],inputMode:'any',output:2,cost:175},
    civilian:{name:'Manufactura civil',icon:'📦',sector:'manufacturing',group:'manufacture',inputs:['steel','lumber'],output:3,cost:155},
    machinery:{name:'Industria de maquinaria',icon:'⚙️',sector:'manufacturing',group:'manufacture',inputs:['steel','copperref'],output:3,cost:200},
    arms:{name:'Industria armamentística',icon:'🛡️',sector:'manufacturing',group:'manufacture',inputs:['steel','copperref'],output:4,cost:230},
    textile:{name:'Industria textil',icon:'🧵',sector:'manufacturing',group:'manufacture',inputs:['crops','livestock'],inputMode:'any',output:3,cost:120},
    chemical:{name:'Industria química',icon:'⚗️',sector:'manufacturing',group:'manufacture',inputs:['fuel','gasfuel'],inputMode:'any',output:3,cost:195},
    electronics:{name:'Industria electrónica',icon:'🔌',sector:'manufacturing',group:'manufacture',inputs:['copperref','steel'],output:3,cost:215}
  };
  const SECTORS={energy:'Energía y electricidad',mining:'Minería y madera',farming:'Agricultura y ganadería',manufacturing:'Transformación y manufactura'};
  const FUTURE_INDUSTRIES=[
    {name:'Central nuclear',note:'Pendiente de tecnología nuclear y combustible enriquecido'},
    {name:'Industria aeronáutica',note:'Pendiente de investigación aeronáutica'},
    {name:'Industria de armamento nuclear',note:'Pendiente de tecnología nuclear y cadena estratégica'},
    {name:'Arsenal de misiles',note:'Pendiente de investigación de misiles y sistemas de lanzamiento'}
  ];
  const PROCESSED={refinery:'fuel',gasplant:'gasfuel',steel:'steel',smelter:'copperref',sawmill:'lumber',cement:'cement'};
  const RESOURCE_PRODUCT_LABELS={fuel:'Combustible refinado',gasfuel:'Gas procesado',steel:'Acero',copperref:'Cobre refinado',lumber:'Madera elaborada',cement:'Cemento'};
  const MATERIAL_KEYS=['oil','gas','iron','copper','timber','quarry','crops','livestock',...Object.values(PROCESSED)];
  const industryStage=t=>t.group==='extract'?1:t.group==='factory'?2:t.group==='power'?3:4;
  const RECIPE={oil:'refinery',gas:'gasplant',iron:'steel',copper:'smelter',timber:'sawmill',quarry:'cement',crops:'foodplant',livestock:'foodplant'};
  const rawTypes=Object.keys(TYPES).filter(k=>TYPES[k].group==='extract');
  const TYPE_SALTS=Object.fromEntries(rawTypes.map(kind=>[
    kind,[...kind].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261)]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sites=new Map(),perCell=new Map(),nationCounts=new Map(),manufacturingCounts=new Map(),depots=new Map(),sectorPct=new Map(),nextAI=new Float64Array(FACTIONS3230.length);
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
    const hash=(Math.imul(cell+13,1103515245)^TYPE_SALTS[kind])>>>0;
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
  const siteKey=(cell,kind)=>String(cell)+':'+kind;
  const sitesOnCell=cell=>perCell.get(Number(cell))||[];
  const countNation=f=>nationCounts.get(Number(f))||0;
  function trackNation(f,change,kind){
    const n=(nationCounts.get(f)||0)+change;
    if(n>0)nationCounts.set(f,n);else nationCounts.delete(f);
    if(kind&&TYPES[kind]?.group==='manufacture'){
      const m=(manufacturingCounts.get(f)||0)+change;
      if(m>0)manufacturingCounts.set(f,m);else manufacturingCounts.delete(f);
    }
  }
  function addSite(s){
    const key=siteKey(s.cell,s.kind);
    if(sites.has(key))return false;
    sites.set(key,s);
    if(!perCell.has(s.cell))perCell.set(s.cell,[]);
    perCell.get(s.cell).push(s);trackNation(s.f,1,s.kind);
    return true;
  }
  function siteById(id){
    const key=String(id);
    return sites.get(key)||((Number.isInteger(Number(id))&&!key.includes(':'))?sitesOnCell(Number(id))[0]:null);
  }
  function availability(f,cell,kind,charge=true){
    const def=TYPES[kind];
    if(!def)return {ok:false,reason:'Instalación desconocida'};
    if(!Number.isInteger(cell)||cell<0||cell>=owner6.length||owner6[cell]!==f)
      return {ok:false,reason:'Territorio no controlado'};
    if(sites.has(siteKey(cell,kind)))return {ok:false,reason:'Ya construida en este hexágono'};
    if(sitesOnCell(cell).length>=MAX_PER_CELL)return {ok:false,reason:'Máximo de '+MAX_PER_CELL+' especializadas en este hexágono'};
    if(countNation(f)>=nationLimit(f))return {ok:false,reason:'Límite nacional de '+nationLimit(f)+' instalaciones'};
    if(sites.size>=(f===0?MAX_SITES:MAX_SITES-AI_RESERVED_FOR_PLAYER))
      return {ok:false,reason:'Capacidad global de simulación alcanzada'};
    const money=f===0?gold3212:botGold3230[f];
    if(charge&&money<def.cost+(f===0?0:45))return {ok:false,reason:'Faltan '+Math.ceil(def.cost+(f===0?0:45)-money)+' de oro'};
    return {ok:true,reason:'Disponible'};
  }
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
    if(!availability(f,cell,kind,charge).ok)return false;
    const price=def.cost;
    if(charge){
      if(isPlayer){if(gold3212<price)return false;gold3212-=price}
      else {if(botGold3230[f]<price+45)return false;botGold3230[f]-=price}
    }
    const s={cell,f,kind,level:1,pct:100,stock:0,output:0,potential:def.group==='extract'?potential(cell,f,kind):1,updated:campaignSeconds3230||0};
    if(!addSite(s))return false;
    revision++;
    return true;
  }
  function upgrade(cell){
    const s=siteById(cell);if(!s||s.f!==0||s.level>=5)return false;
    const cost=TYPES[s.kind].cost*(s.level+1);
    if(gold3212<cost)return false;
    gold3212-=cost;s.level++;revision++;return true;
  }
  function setPct(cell,pct){
    const s=siteById(cell);
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
      if(owner>=0&&owner!==s.f){trackNation(s.f,-1,s.kind);s.f=owner;trackNation(s.f,1,s.kind);s.stock*=.5;s.pct=75;s.updated=-1e9;revision++}
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
        const material=PROCESSED[s.kind];
        if(material){
          if(!g.raw.has(material))g.raw.set(material,[]);
          g.raw.get(material).push({site:s});
        }
      }
    }
    // Los cargamentos de los puertos se pueden recoger únicamente desde
    // una instalación que comparta una red viaria (o el propio puerto).
    for(const [cell,d] of depots){
      const f=owner6[cell];
      if(f<0||!ports3212.has(cell)){depots.delete(cell);continue}
      const comp=connect(cell,f);
      const g=group(f,comp,cell);
      for(const kind of MATERIAL_KEYS){
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
      r.productionCargo0388={};
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
          r.productionCargo0388[kind]=(r.productionCargo0388[kind]||0)+cargo/Math.max(.1,dt);
        }
      }
    }
    // Producción por etapas: las instalaciones primarias alimentan las
    // transformadoras; estas crean intermedios reales (acero, gas procesado,
    // combustible...) y la manufactura consume esos intermedios y electricidad.
    for(const g of groups.values()){
      g.factories.sort((a,b)=>industryStage(TYPES[a.site.kind])-industryStage(TYPES[b.site.kind]));
      for(const item of g.factories){
        const s=item.site,n=item.node,def=TYPES[s.kind],out=def.output;
        const intermediate=PROCESSED[s.kind]||null;
        const room=Math.max(0,n.cap[out]-n.stock[out]);
        const buffer=intermediate?Math.max(0,65*s.level-s.stock):0;
        if(room+buffer<=.000001)continue;
        const sharedLevel=industries3212.has(s.cell)?Math.max(1,industryLevel3230[s.cell]||1):0;
        const industrialBonus=1+Math.min(.24,sharedLevel*.08);
        let amount=Math.min(.39*s.level*activeFactor(s)*dt*industrialBonus,(room+buffer)/.90);
        if(amount<=0)continue;
        // Reservar energía ANTES de consumir materias para no perder cargamentos
        // cuando una fábrica tenga apagones o capacidad eléctrica insuficiente.
        if(def.group==='manufacture')amount=Math.min(amount,Math.max(0,n.stock[2]||0)/.12);
        if(amount<=0)continue;
        const inputs=def.inputs||[];
        if(!inputs.length)continue;
        if(def.inputMode==='any'){
          let chosen=null,maximum=0;
          for(const kind of inputs){
            const qty=available(g,kind);
            if(qty>maximum){chosen=kind;maximum=qty}
          }
          if(!chosen||maximum<=0)continue;
          amount=Math.min(amount,maximum);
          amount=take(g,chosen,amount);
        }else{
          for(const kind of inputs)amount=Math.min(amount,available(g,kind));
          if(amount<=0)continue;
          for(const kind of inputs)take(g,kind,amount);
        }
        if(amount<=0)continue;
        // Los bienes finales necesitan energía; las centrales son las
        // encargadas de generarla. No consumir el stock a nivel de mapa.
        if(def.group==='manufacture')n.stock[2]=Math.max(0,n.stock[2]-amount*.12);
        const outputQty=amount*.90;
        const stored=intermediate?Math.min(buffer,outputQty*.62):0;
        const delivered=Math.min(room,outputQty-stored);
        if(intermediate)s.stock+=stored;
        n.stock[out]+=delivered;
        processed+=stored+delivered;s.output+=stored+delivered;
      }
    }
    // La IA invierte escalonadamente, siempre con su presupuesto y de forma
    // condicionada por riqueza geográfica y carencias de su economía.
    const batch=activeFactionCount3230>350?10:activeFactionCount3230>180?8:5;
    const aiStarted=Date.now();let aiReviewed=0;
    for(let i=0;i<batch&&activeFactionCount3230>1;i++){
      if(i>0&&Date.now()-aiStarted>=4)break;
      if(aiCursor>=activeFactionCount3230)aiCursor=1;
      aiDevelop(aiCursor++);aiReviewed++;
    }
    lastStats={aiReviewed,produced:+produced.toFixed(2),processed:+processed.toFixed(2),
      shipped:+shipped.toFixed(2),disconnected,sites:sites.size};
  }
  function aiDevelop(f){
    if(f<=0||f>=activeFactionCount3230||!Number.isInteger(capitals[f]))return;
    const now=campaignSeconds3230||0;
    if(now<nextAI[f])return;
    nextAI[f]=now+44+(f%11)*6;
    if(botGold3230[f]<150||countNation(f)>=nationLimit(f))return;
    const own=[...sites.values()].filter(s=>s.f===f);
    const summary=api()?.resourceSummaryCached?.(f);
    const coverage=summary?.coverage||[.5,.5,.5];
    const pressure={energy:Math.max(.05,1-(coverage[2]||0)),mining:Math.max(.05,1-(coverage[1]||0)),
      farming:Math.max(.05,1-(coverage[0]||0))};
    const missing=rawTypes.filter(kind=>!own.some(s=>s.kind===kind));
    const factoryNeeds=new Set();
    for(const site of own){
      const recipe=RECIPE[site.kind];
      if(TYPES[site.kind].group==='extract'&&recipe&&!own.some(s=>s.kind===recipe))
        factoryNeeds.add(recipe);
    }
    const ownKinds=new Set(own.map(s=>s.kind));
    const availableOutputs=new Set(ownKinds);
    for(const site of own){
      const output=PROCESSED[site.kind];
      if(output)availableOutputs.add(output);
    }
    for(const [kind,def] of Object.entries(TYPES)){
      if(def.group!=='manufacture'&&def.group!=='power')continue;
      if(ownKinds.has(kind))continue;
      const sourceAvailable=def.inputMode==='any'?
        def.inputs.some(k=>availableOutputs.has(k)):
        def.inputs.every(k=>availableOutputs.has(k));
      if(sourceAvailable)factoryNeeds.add(kind);
    }
    const role=FACTIONS3230[f]?.role||'balanced';
    // Las IA ajustan autónomamente el uso sectorial según la escasez.
    const policy={energy:clamp(Math.round(70+pressure.energy*30),0,100),
      mining:clamp(Math.round(70+pressure.mining*30),0,100),
      farming:clamp(Math.round(70+pressure.farming*30),0,100),
      manufacturing:role==='growth'?100:90};
    sectorPct.set(f,policy);
    let choice=null,score=0;
    const sample=aiNationalSamples3275?.[f]||[];
    const cells=[capitals[f]];
    // 500 IA: búsqueda acotada a once ubicaciones por revisión.
    const step=Math.max(1,Math.ceil(sample.length/10));
    for(let i=0;i<sample.length&&cells.length<12;i+=step)cells.push(sample[i]);
    for(const cell of cells){
      if(!Number.isInteger(cell)||owner6[cell]!==f||sitesOnCell(cell).length>=MAX_PER_CELL)continue;
      const road=connect(cell,f);
      // Preferimos nodos conectados, no colonizamos el mapa de iconos.
      const logistics=road>=0?1.38:.48;
      for(const kind of missing){
        const type=TYPES[kind],p=potential(cell,f,kind);
        const need=pressure[type.sector]||.2;
        const value=p*(.72+need*1.35)*logistics;
        if(value>score&&availability(f,cell,kind,true).ok&&botGold3230[f]>type.cost+65){score=value;choice={cell,kind}}
      }
      for(const kind of factoryNeeds){
        const type=TYPES[kind];
        const strategic=kind==='arms'?(role==='aggressive'?1.45:.77):
          kind==='thermal'?(1+pressure.energy*.5):
          kind==='machinery'?(role==='growth'?1.35:1):
          kind==='civilian'?1.08:1;
        const value=(road>=0?2.7:.28)*strategic*(role==='growth'?1.12:1);
        if(value>score&&availability(f,cell,kind,true).ok&&botGold3230[f]>type.cost+65){score=value;choice={cell,kind}}
      }
    }
    if(choice&&score>.35&&build(f,choice.cell,choice.kind,true)){
      nextAI[f]=now+70+(f%13)*6;
      return;
    }
    // Las economías maduras también amplían capacidad: nunca reciben
    // una mejora gratuita y siguen usando su propia tesorería.
    let best=null,bestScore=-1;
    for(const site of own){
      if(site.level>=5)continue;
      const price=TYPES[site.kind].cost*(site.level+1);
      if(botGold3230[f]<price+80)continue;
      const material=TYPES[site.kind].group==='factory'?
        (TYPES[site.kind].output===2?'energy':TYPES[site.kind].output===0?'farming':'mining'):
        TYPES[site.kind].sector;
      const priority=(pressure[material]||.45)*(TYPES[site.kind].group==='factory'?1.3:1)+
        (site.potential||.5)*.25-site.level*.10;
      if(priority>bestScore){bestScore=priority;best={site,price}}
    }
    if(best){botGold3230[f]-=best.price;best.site.level++;revision++;
      nextAI[f]=now+100+(f%13)*9}
  }
  function saveState(){
    return {v:1,sites:[...sites.values()].map(s=>({cell:s.cell,f:s.f,kind:s.kind,
      level:s.level,pct:s.pct,stock:s.stock,output:s.output})),
      depots:[...depots],sectors:[...sectorPct]};
  }
  function restore(data){
    sites.clear();perCell.clear();nationCounts.clear();manufacturingCounts.clear();depots.clear();sectorPct.clear();revision++;aiCursor=1;nextAI.fill(0);
    if(!data||!Array.isArray(data.sites))return;
    for(const x of data.sites.slice(0,MAX_SITES)){
      if(!x||!TYPES[x.kind]||!Number.isInteger(x.cell)||x.cell<0||x.cell>=owner6.length)continue;
      const f=owner6[x.cell];
      if(f<0)continue;
      if(sitesOnCell(x.cell).length>=MAX_PER_CELL)continue;
      addSite({cell:x.cell,f,kind:x.kind,level:clamp(Math.trunc(x.level||1),1,5),
        pct:clamp(Number(x.pct??100),0,100),stock:clamp(Number(x.stock)||0,0,325),
        output:Math.max(0,Number(x.output)||0),potential:potential(x.cell,f,x.kind),
        updated:campaignSeconds3230||0});
    }
    if(Array.isArray(data.depots))for(const [cell,d] of data.depots.slice(0,MAX_SITES)){
      if(Number.isInteger(cell)&&ports3212.has(cell)&&d&&typeof d==='object'){
        const clean={};for(const kind of MATERIAL_KEYS)clean[kind]=clamp(Number(d[kind])||0,0,65);
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
      const id=siteKey(s.cell,s.kind);
      return '<div class="industrySite0388"><div><b>'+def.icon+' '+esc(def.name)+'</b>'+ 
        '<small>'+esc(place)+' · Nivel '+s.level+'/5 · '+(hasRoad?'Conectada':'Sin carretera')+
        (def.group==='extract'?' · Yacimiento '+Math.round(s.potential*100)+'%':' · Transformación')+'</small></div>'+
        '<label>Actividad <input type="range" min="0" max="100" step="5" value="'+s.pct+'" data-industry-site0388="'+id+'"></label>'+
        '<span data-industry-site-label0388="'+id+'">'+s.pct+'%</span>'+
        '<button data-industry-upgrade0388="'+id+'" '+(s.level>=5?'disabled':'')+'>Mejorar</button></div>';
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
      const id=target.dataset.industrySite0388;
      if(setPct(id,target.value)){
        const label=systemHost.querySelector('[data-industry-site-label0388="'+id+'"]');
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
    if(!upgrade(button.dataset.industryUpgrade0388))
      {if(typeof toast==='function')toast('No se puede mejorar la instalación')}
    renderSystems3220();
  });
  // Un único acceso INDUSTRIA desde el menú del hexágono.
  // Nunca modificar el flujo de selección global: el cierre nativo es
  // imprescindible porque pick3244 ignora clics mientras modal !== null.
  function industryContext0388(cell){
    if(!Number.isInteger(cell)||owner6[cell]!==0)return null;
    return typeof cellContext3244==='function'?cellContext3244(cell):null;
  }
  function renderIndustryModal0388(cell,section='menu'){
    const state=uiInteractionState3244?.modal;
    if(state?.type!=='production0388'||state.data?.cell!==cell)return false;
    const context=industryContext0388(cell);
    if(!context){closeModal3244();return false}
    state.data.section=section;
    const place=typeof placeDisplayName3271==='function'?placeDisplayName3271(cell):'Hexágono '+cell;
    const existing=sitesOnCell(cell);
    const industryCost=context.industry?115+context.industry*55:110;
    const canGeneral=typeof canIndustry3244==='function'?canIndustry3244(context):false;
    modalTitle3244.textContent='Industria · '+place;
    const intro='<div class="industryIntro0388"><b>🏭 Gestión industrial del territorio</b>'+
      '<p>La industria general representa el desarrollo industrial existente. Las explotaciones y fábricas especializadas utilizan recursos reales y la red logística.</p></div>';
    const general='<button type="button" class="industryChoice0388" data-industry-general0388 '+
       (canGeneral?'':'disabled')+'><span class="industryChoiceIcon0388">🏭</span>'+
       '<span><b>'+(context.industry?'Mejorar industria general':'Construir industria general')+'</b>'+
       '<small>Nivel '+(context.industry||0)+'/3 · '+industryCost+' oro · producción industrial base</small></span>'+
       '<span class="industryChoiceArrow0388">›</span></button>';
    const specialized='<button type="button" class="industryChoice0388" data-industry-view0388="specialized">'+
      '<span class="industryChoiceIcon0388">⛏</span><span><b>Producción especializada</b>'+
      '<small>Pozos, minas, cultivos, granjas y fábricas transformadoras</small></span>'+
      '<span class="industryChoiceArrow0388">›</span></button>';
    if(section==='menu'){
      modalBody3244.innerHTML='<div class="industryModal0388">'+intro+
        '<div class="industryChoices0388">'+general+specialized+'</div>'+
        (existing.length?'<div class="industryExisting0388"><b>Instalaciones en este hexágono</b>'+ 
          '<p>'+existing.map(site=>esc(TYPES[site.kind].icon+' '+TYPES[site.kind].name)+' (nivel '+site.level+'/5)').join(' · ')+
          ' · Controles individuales en Sistemas → Economía.</p></div>':'')+
        '</div>';
      modalActions3244.innerHTML='<button type="button" data-modal-action="close">CERRAR</button>';
    }else{
      const sections=[['extract','Explotaciones primarias'],['factory','Industrias transformadoras']];
      const spent=countNation(0);
      const gold=Math.floor(gold3212);
      const status='<div class="industryBudget0388">Oro disponible: <b>'+gold.toLocaleString('es-ES')+'</b> · Instalaciones: <b>'+spent+'/'+MAX_PLAYER_SITES+'</b> · En este hexágono: <b>'+existing.length+'/'+MAX_PER_CELL+'</b></div>';
      const types=sections.map(([group,title])=>
        '<section class="industryGroup0388 industryGroup-'+group+'0388"><h4>'+title+'</h4>'+
        '<div class="industryBuildGrid0388">'+Object.entries(TYPES).filter(([,def])=>def.group===group).map(([kind,def])=>{
          const strength=group==='extract'?Math.round(potential(cell,0,kind)*100):null;
          const test=availability(0,cell,kind,true);
          const allowed=test.ok;
          return '<button type="button" class="industryBuildChoice0388" data-industry-build0388="'+kind+'" '+
            (allowed?'':'disabled')+'><span class="industryTypeIcon0388">'+def.icon+'</span>'+
            '<span class="industryBuildText0388"><b>'+esc(def.name)+'</b>'+
            '<small>'+def.cost+' oro'+(strength===null?'':' · potencial '+strength+'%')+
            (allowed?' · Disponible':' · '+esc(test.reason))+'</small></span></button>';
        }).join('')+'</div></section>').join('');
      modalBody3244.innerHTML='<div class="industryModal0388"><div class="industryIntro0388">'+
        '<b>Explotaciones e industria transformadora</b>'+
        '<p>Una explotación aprovecha hasta siete hexágonos propios. Para abastecer fábricas y ciudades necesita conexiones terrestres o marítimas. Puedes combinar hasta tres instalaciones diferentes por hexágono.</p></div>'+status+
        (existing.length?'<div class="industryExisting0388">Ya construidas: '+
        existing.map(site=>esc(TYPES[site.kind].name)).join(' · ')+
        '. Puedes añadir otras diferentes o mejorarlas desde Sistemas → Economía.</div>':'')+types+'</div>';
      modalActions3244.innerHTML='<button type="button" data-industry-view0388="menu">← VOLVER</button>'+
        '<button type="button" data-modal-action="close">CERRAR</button>';
    }
    return true;
  }
  function showBuildModal(cell){
    if(!Number.isInteger(cell)||owner6[cell]!==0)return false;
    closeContextDialog3244();
    // Rescatar por seguridad cualquier modal de producción anterior. Las
    // acciones normales de cierre vacían la bandera modal además del overlay.
    if(uiInteractionState3244?.modal?.type==='production0388')closeModal3244();
    uiInteractionState3244.modal={type:'production0388',data:{cell,section:'menu'}};
    modal3244.classList.add('open3244');
    modal3244.setAttribute('aria-hidden','false');
    return renderIndustryModal0388(cell,'menu');
  }
  const baseActions=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const actions=baseActions.apply(this,arguments);
    if(ctx?.kind!=='cell'||!Number.isInteger(ctx.cell)||!ctx.own)return actions;
    const general=actions.findIndex(a=>a.id==='build_industry');
    const merged=classicAction3246('production0388','INDUSTRIA','🏭',
      'GENERAL · EXTRACTIVA · TRANSFORMADORA',true,'good3244');
    if(general>=0)actions.splice(general,1,merged);
    else actions.push(merged);
    return actions.filter(a=>a.id!=='industry_menu_0388');
  };
  const baseHandle=handleContextAction3244;
  handleContextAction3244=function(id){
    if(id==='production0388'||id==='industry_menu_0388'){
      const st=uiInteractionState3244,ctx=st?.contextData;
      if(ctx?.kind==='cell'&&ctx.own&&Number.isInteger(ctx.cell)&&st.contextDialog&&
         st.availableActions.includes(id))showBuildModal(ctx.cell);
      return;
    }
    return baseHandle.apply(this,arguments);
  };
  function buildGeneralIndustry0388(cell){
    const context=industryContext0388(cell);
    if(!context||typeof canIndustry3244!=='function'||!canIndustry3244(context))return false;
    // El motor exige un permiso explícito por acción; el submenú forma parte
    // de la misma acción voluntaria del jugador, y no elude ese control.
    selected={key:MAX_GAME_LEVEL3233,i:cell};
    uiInteractionState3244.selectedCell=cell;
    if(typeof contextBuildPermit3282!=='undefined')
      contextBuildPermit3282={type:'industry',cell,until:performance.now()+900};
    const previous=industries3212.has(cell)?Math.max(1,industryLevel3230[cell]||1):0;
    build3212('industry');
    const next=industries3212.has(cell)?Math.max(1,industryLevel3230[cell]||1):0;
    return next>previous;
  }
  modalBody3244?.addEventListener('click',event=>{
    const state=uiInteractionState3244?.modal;
    if(state?.type!=='production0388')return;
    const cell=state.data?.cell;
    const general=event.target.closest('[data-industry-general0388]');
    if(general){
      event.preventDefault();
      if(general.disabled)return;
      // Este cierre devuelve el control al globo: no basta con ocultar el CSS.
      closeModal3244();
      if(buildGeneralIndustry0388(cell)){
        if(typeof updateUI3230==='function')updateUI3230();
      }else if(typeof toast==='function')toast('No se pudo construir o mejorar la industria general');
      return;
    }
    const change=event.target.closest('[data-industry-view0388]');
    if(change){
      event.preventDefault();
      renderIndustryModal0388(cell,change.dataset.industryView0388);
      return;
    }
    const button=event.target.closest('[data-industry-build0388]');
    if(!button)return;
    event.preventDefault();
    if(button.disabled)return;
    const kind=button.dataset.industryBuild0388;
    if(build(0,cell,kind,true)){
      // closeModal3244 limpia uiInteractionState3244.modal, imprescindible
      // para poder volver a seleccionar otro hexágono inmediatamente.
      closeModal3244();
      if(typeof saveGame3212==='function')saveGame3212();
      if(typeof updateUI3230==='function')updateUI3230();
      needsRender=true;
      if(typeof toast==='function')toast(TYPES[kind].name+' construida');
      if(typeof sysTab3220==='string'&&sysTab3220==='eco')renderSystems3220();
    }else if(typeof toast==='function')toast(availability(0,cell,kind,true).reason);
  });
  if(typeof modalActions3244!=='undefined')modalActions3244?.addEventListener('click',event=>{
    const change=event.target.closest?.('[data-industry-view0388]');
    if(!change||uiInteractionState3244?.modal?.type!=='production0388')return;
    event.preventDefault();
    renderIndustryModal0388(uiInteractionState3244.modal.data.cell,change.dataset.industryView0388);
  });
  // Distribución de símbolos por hexágono: respeta ciudad, puerto,
  // industria general y capital, además de hasta tres especializadas.
  // Los iconos originales no se borran ni se sustituyen por los nuevos.
  function iconSlots03811(cell){
    const f=owner6[cell];if(f<0)return {items:[],capital:false};
    const types=[];
    if(cities3212.has(cell))types.push('city');
    if(ports3212.has(cell))types.push('port');
    if(industries3212.has(cell))types.push('industry');
    if(zoom>=7&&(f===0||zoom>=13))
      for(const s of sitesOnCell(cell))if(s.f===f)types.push(siteKey(cell,s.kind));
    return {items:types,capital:capitals?.[f]===cell};
  }
  function iconOffset03811(cell,role){
    const slots=iconSlots03811(cell);
    const index=slots.items.indexOf(role),count=slots.items.length;
    if(index<0||(!slots.capital&&count<2))return [0,0];
    const px=globeIconScale3249();
    const radius=px*(slots.capital?2.65:count>=5?2.5:count===4?1.75:count===3?1.82:1.52);
    // Cuando hay una capital, la estrella queda en el centro y la
    // infraestructura ocupa su corona exterior, sin superponerse.
    const angle=-Math.PI/2+(2*Math.PI*index)/count;
    return [Math.cos(angle)*radius,Math.sin(angle)*radius];
  }
  function shiftNativeIcon03811(base,role){
    return function(x,y,cell,px){
      if(zoom<7)return base.apply(this,arguments);
      const delta=iconOffset03811(cell,role);
      return base.call(this,x+delta[0],y+delta[1],cell,px);
    };
  }
  if(typeof drawGlobeCityIcon3249==='function')
    drawGlobeCityIcon3249=shiftNativeIcon03811(drawGlobeCityIcon3249,'city');
  if(typeof drawGlobePortIcon3249==='function')
    drawGlobePortIcon3249=shiftNativeIcon03811(drawGlobePortIcon3249,'port');
  if(typeof drawGlobeIndustryIcon3249==='function')
    drawGlobeIndustryIcon3249=shiftNativeIcon03811(drawGlobeIndustryIcon3249,'industry');
  // No se dibujan los otros seis hexágonos de explotación ni carreteras nuevas.
  const baseDraw=drawInfrastructure3212;
  drawInfrastructure3212=function(R,cx,cy,now){
    const out=baseDraw.apply(this,arguments);
    // El sistema cartográfico 0.38.12 unifica los símbolos en una pasada posterior.
    if(window.HexategosMapIcons03812?.active)return out;
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
      const radius=Math.min(8.0,Math.max(6,globeIconScale3249()*.82));
      const delta=iconOffset03811(s.cell,siteKey(s.cell,s.kind));
      const x=p[0]+delta[0],y=p[1]+delta[1];
      ctx.fillStyle='rgba(5,18,28,.9)';
      ctx.beginPath();ctx.arc(x,y,radius+1,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(194,221,237,.7)';ctx.lineWidth=.8;ctx.stroke();
      ctx.font=Math.round(radius*1.72)+'px system-ui, sans-serif';
      ctx.fillText(icon,x,y+.4);
      drawn++;
    }
    ctx.restore();return out;
  };
  window.HexategosProduction0388={
    version:VERSION,types:TYPES,cells:()=>perCell.keys(),revision:()=>revision,tick,
    sites:()=>[...sites.values()].map(s=>({...s})),sector:(f,s)=>sec(f,s),
    build,upgrade,setPct,setSector,potential,efficiency,availability,sitesOnCell:cell=>sitesOnCell(cell).map(s=>({...s})),
    legacyManufacturingFactor:f=>Math.max(.15,1-(manufacturingCounts.get(Number(f))||0)*.22),
    intermediates:()=>({...RESOURCE_PRODUCT_LABELS}),futureIndustries:()=>FUTURE_INDUSTRIES.map(v=>({...v})),
    iconOffset:iconOffset03811,
    drawCandidates:()=>sites.values(),
    stats:()=>({...lastStats}),validate:()=>{
      const errors=[];for(const s of sites.values())if(!TYPES[s.kind]||s.cell<0)errors.push('instalación inválida');
      return {ok:!errors.length,errors,stats:lastStats};
    }
  };
  console.info('[HEXATEGOS] '+VERSION+' · industrias primarias, transformación y logística material.');
})();
