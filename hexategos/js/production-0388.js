'use strict';
/* HEXATEGOS 0.38.8 · Cadenas industriales territoriales.
   Una instalación explota como máximo 7 hexágonos; inventario material
   concentrado en nodos, nunca un objeto de producción por celda. */
(() => {
  const VERSION='0.38.33';
  const GEO_KINDS=new Set(['iron','copper','coal','quarry','oil','gas']);
  const SAVE_KEY='hexategos.production.0388';
  const MAX_SITES=5600,AI_RESERVED_FOR_PLAYER=160,MAX_PLAYER_SITES=160,MAX_PER_CELL=3;
  const MAX_PER_NATION=18;
  const aiSiteLimit=()=>activeFactionCount3230>=350?9:activeFactionCount3230>=200?12:MAX_PER_NATION;
  const nationLimit=f=>f===0?MAX_PLAYER_SITES:aiSiteLimit();
  const TYPES={
    oil:     {name:'Pozo de petróleo', icon:'🛢',sector:'energy',   group:'extract',material:'oil', cost:100},
    gas:     {name:'Pozo de gas',       icon:'🔥',sector:'energy',   group:'extract',material:'gas', cost:100},
    coal:    {name:'Mina de carbón',    icon:'⛏',sector:'mining',group:'extract',material:'coal',cost:85},
    iron:    {name:'Mina de hierro',    icon:'⛏',sector:'mining',   group:'extract',material:'iron',cost:85},
    copper:  {name:'Mina de cobre',     icon:'⛏',sector:'mining',   group:'extract',material:'copper',cost:90},
    timber:  {name:'Explotación forestal',icon:'🌲',sector:'mining',group:'extract',material:'timber',cost:65},
    quarry:  {name:'Cantera',           icon:'🪨',sector:'mining',   group:'extract',material:'quarry',cost:70},
    crops:   {name:'Cultivos',          icon:'🌾',sector:'farming',  group:'extract',material:'crops',cost:55},
    livestock:{name:'Granja ganadera',  icon:'🐄',sector:'farming',  group:'extract',material:'livestock',cost:65},
    refinery:{name:'Refinería',         icon:'🏭',sector:'manufacturing',group:'factory',inputs:['oil'],output:2,cost:160},
    gasplant:{name:'Planta de gas',     icon:'🏭',sector:'manufacturing',group:'factory',inputs:['gas'],output:2,cost:140},
    steel:   {name:'Siderurgia',        icon:'🏭',sector:'manufacturing',group:'factory',inputs:['iron'],electricity:.16,output:1,cost:155},
    smelter: {name:'Metalurgia',        icon:'🏭',sector:'manufacturing',group:'factory',inputs:['copper'],electricity:.13,output:1,cost:135},
    sawmill: {name:'Aserradero',        icon:'🏭',sector:'manufacturing',group:'factory',inputs:['timber'],output:1,cost:105},
    cement:  {name:'Cementera',         icon:'🏭',sector:'manufacturing',group:'factory',inputs:['quarry'],output:1,cost:120},
    foodplant:{name:'Industria alimentaria',icon:'🏭',sector:'manufacturing',group:'factory',inputs:['crops','livestock','dairy'],inputMode:'any',output:0,cost:115},
    fiberworks:{name:'Hilandería',icon:'🧶',sector:'manufacturing',group:'factory',inputs:['plantfiber','wool'],inputMode:'any',output:3,cost:110},
    tannery:{name:'Curtiduría',icon:'🟤',sector:'manufacturing',group:'factory',inputs:['hides'],output:3,cost:105},
    thermal:{name:'Central termoeléctrica',icon:'⚡',sector:'energy',group:'power',inputs:['coal','fuel','gasfuel'],inputMode:'any',output:2,cost:175},
    civilian:{name:'Manufactura civil',icon:'📦',sector:'manufacturing',group:'manufacture',inputs:['steel','lumber'],output:3,cost:155},
    machinery:{name:'Industria de maquinaria',icon:'⚙️',sector:'manufacturing',group:'manufacture',inputs:['steel','copperref'],output:3,cost:200},
    arms:{name:'Industria armamentística',icon:'🛡️',sector:'manufacturing',group:'manufacture',inputs:['steel','copperref','machinerygoods'],output:4,cost:230},
    textile:{name:'Industria textil',icon:'🧵',sector:'manufacturing',group:'manufacture',inputs:['textilebase','leather','plantfiber','wool'],inputMode:'any',output:3,cost:120},
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
  const PROCESSED={refinery:'fuel',gasplant:'gasfuel',steel:'steel',smelter:'copperref',sawmill:'lumber',cement:'cement',fiberworks:'textilebase',tannery:'leather',machinery:'machinerygoods'};
  const RESOURCE_PRODUCT_LABELS={fuel:'Combustible refinado',gasfuel:'Gas procesado',steel:'Acero',copperref:'Cobre refinado',lumber:'Madera elaborada',cement:'Cemento',plantfiber:'Fibras vegetales',dairy:'Leche y lácteos',wool:'Lana',hides:'Pieles',textilebase:'Hilos y tejidos base',leather:'Cuero',machinerygoods:'Maquinaria industrial'};
  const MATERIAL_KEYS=['oil','gas','coal','iron','copper','timber','quarry','crops','livestock','plantfiber','wool','hides','dairy',...Object.values(PROCESSED)];
  const DERIVATIVES={crops:{plantfiber:.30},livestock:{dairy:.22,wool:.20,hides:.13}};
  const industryStage=t=>t.group==='extract'?1:t.group==='power'?3:t.electricity?4:t.group==='factory'?2:t.inputs?.includes('machinerygoods')?6:5;
  const RECIPE={oil:'refinery',gas:'gasplant',coal:'thermal',iron:'steel',copper:'smelter',timber:'sawmill',quarry:'cement',crops:'foodplant',livestock:'foodplant',plantfiber:'fiberworks',wool:'fiberworks',hides:'tannery',dairy:'foodplant'};
  const rawTypes=Object.keys(TYPES).filter(k=>TYPES[k].group==='extract');
  const TYPE_SALTS=Object.fromEntries(rawTypes.map(kind=>[
    kind,[...kind].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261)]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sites=new Map(),perCell=new Map(),nationSites=new Map(),nationCounts=new Map(),manufacturingCounts=new Map(),depots=new Map(),sectorPct=new Map(),nextAI=new Float64Array(FACTIONS3230.length);
  let revision=1, aiCursor=1, lastStats={produced:0,processed:0,shipped:0,disconnected:0,sites:0};
  let lastPeriodicSaveWall03827=0;
  const nationalElectricDeficit=new Map();
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
    else if(kind==='coal')v=raw*(mountain?1.45:t==='forest'||t==='plain'?1.1:.65)*(.80+(hash%47)/110);
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
    const natural=window.HexategosNaturalPotential03829?.profile?.(cell);
    const geology=window.HexategosGeology03830;
    if(natural&&(!GEO_KINDS.has(kind)||geology?.deposit)){
      let value=0;
      if(GEO_KINDS.has(kind))value=Number(geology.deposit(cell,kind)?.quality)||0;
      else if(kind==='timber')value=Number(natural.forest)||0;
      else if(kind==='crops')value=Number(natural.food)||0;
      else if(kind==='livestock')value=Number(natural.livestock)||0;
      // La garantía de una instalación anterior no depende de su propietario.
      const old=sites.get(String(cell)+':'+kind);
      return clamp(Math.max(value,Number(old?.legacyQuality)||0),0,2.6);
    }
    // Compatibilidad para builds y pruebas anteriores a la capa geológica.
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
  function moveNationSite(s,previous,next){
    if(previous!=null){
      const old=nationSites.get(previous);
      old?.delete(s);
      if(old&&!old.size)nationSites.delete(previous);
    }
    if(next!=null){
      let collection=nationSites.get(next);
      if(!collection){collection=new Set();nationSites.set(next,collection)}
      collection.add(s);
    }
  }
  function addSite(s){
    const key=siteKey(s.cell,s.kind);
    if(sites.has(key))return false;
    sites.set(key,s);
    if(!perCell.has(s.cell))perCell.set(s.cell,[]);
    perCell.get(s.cell).push(s);trackNation(s.f,1,s.kind);
    moveNationSite(s,null,s.f);
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
    if(def.group==='extract'&&window.HexategosNaturalPotential03829){
      if(GEO_KINDS.has(kind)&&window.HexategosGeology03830){
        if(!window.HexategosProspection03831?.hasKnowledge?.(cell))
          return {ok:false,reason:'Necesita prospección geológica'};
      }
      if(potential(cell,f,kind)<=.000001)
        return {ok:false,reason:'No hay recurso aprovechable en este hexágono'};
    }
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
    const s={cell,f,kind,level:1,pct:100,stock:0,byproducts:{},output:0,legacyQuality:0,potential:def.group==='extract'?potential(cell,f,kind):1,updated:campaignSeconds3230||0};
    if(!addSite(s))return false;
    revision++;
    if(isPlayer)persistProduction0388();
    return true;
  }
  function upgrade(cell){
    const s=siteById(cell);if(!s||s.f!==0||s.level>=5)return false;
    const cost=TYPES[s.kind].cost*(s.level+1);
    if(gold3212<cost)return false;
    gold3212-=cost;s.level++;revision++;persistProduction0388();return true;
  }
  function setPct(cell,pct){
    const s=siteById(cell);
    if(!s||s.f!==0)return false;
    s.pct=clamp(Math.round(Number(pct)||0),0,100);
    persistProduction0388();
    return true;
  }
  function setSector(f,name,pct){
    if(!SECTORS[name]||f!==0)return false;
    if(!sectorPct.has(f))sectorPct.set(f,{});
    sectorPct.get(f)[name]=clamp(Math.round(Number(pct)||0),0,100);
    persistProduction0388();
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
      if(!g){g={key,f,raw:new Map(),factories:[],powerNodes:new Set(),electricity:0};groups.set(key,g)}
      return g;
    };
    const conn=new Map();
    let produced=0,processed=0,shipped=0,disconnected=0;
    // Capturas y pérdida de instalaciones: no se reconstruye el mapa entero.
    for(const s of sites.values()){
      const owner=owner6[s.cell];
      if(owner>=0&&owner!==s.f){const previous=s.f;trackNation(previous,-1,s.kind);s.f=owner;trackNation(s.f,1,s.kind);moveNationSite(s,previous,owner);s.stock*=.5;for(const key of Object.keys(s.byproducts||{}))s.byproducts[key]*=.5;s.pct=75;s.updated=-1e9;revision++}
      if(owner<0||owner!==s.f)continue;
      const n=nodes.get(s.cell);
      if(!n)continue;
      const comp=connect(s.cell,s.f);
      conn.set(s.cell,comp);
      if(comp<0)disconnected++;
      const g=group(s.f,comp,s.cell);
      g.powerNodes.add(n);
      const def=TYPES[s.kind];
      if(def.group==='extract'){
        if(now-s.updated>=36){
          s.potential=potential(s.cell,s.f,s.kind);s.updated=now;
        }
        const amount=clamp(s.potential,0,2.6)*.37*s.level*activeFactor(s)*dt;
        const before=s.stock;
        s.stock=clamp(s.stock+amount,0,65*s.level);
        const extracted=s.stock-before;
        // Derivados físicos, obtenidos del mismo volumen extraído: no crear
        // materias primas gratis ni un inventario por hexágono.
        if(DERIVATIVES[s.kind]){
          s.byproducts ||= {};
          for(const [material,ratio] of Object.entries(DERIVATIVES[s.kind])){
            const old=Number(s.byproducts[material])||0;
            const qty=Math.min(extracted*ratio,65*s.level-old);
            if(qty<=0)continue;
            s.stock-=qty;s.byproducts[material]=old+qty;
            if(!g.raw.has(material))g.raw.set(material,[]);
            g.raw.get(material).push({site:s,product:material});
          }
          for(const material of Object.keys(DERIVATIVES[s.kind])){
            if(!g.raw.has(material))g.raw.set(material,[]);
            if(!g.raw.get(material).some(x=>x.site===s))
              g.raw.get(material).push({site:s,product:material});
          }
        }
        produced+=extracted;
        if(s.f===0){
          s.lastRate=extracted/Math.max(.1,dt);
          s.status=comp<0?'Sin conexión logística':extracted<=.000001?
            (s.stock>=65*s.level-.000001?'Almacén lleno':'Producción reducida'):'Produciendo';
          s.efficiency=Math.round(100*activeFactor(s));
        }
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
        const available=x.site?(x.product?(x.site.byproducts?.[x.product]||0):x.site.stock):(x.depot[kind]||0);
        const qty=Math.min(available,remaining);
        if(qty<=0)continue;
        if(x.site){if(x.product)x.site.byproducts[x.product]-=qty;else x.site.stock-=qty}else x.depot[kind]-=qty;
        taken+=qty;remaining-=qty;
      }
      return taken;
    }
    function available(g,kind){
      return (g?.raw.get(kind)||[]).reduce((total,x)=>total+(x.site?(x.product?(x.site.byproducts?.[x.product]||0):x.site.stock):(x.depot[kind]||0)),0);
    }
    // La energía eléctrica NO es combustible en almacén. Se genera en
    // centrales durante el ciclo y se distribuye solo en la red conectada.
    function availablePower(g){return Math.max(0,g?.electricity||0)}
    function consumePower(g,required){
      const used=Math.min(availablePower(g),Math.max(0,required));
      g.electricity-=used;
      return used;
    }
    // Solo se mueve materia físicamente por rutas existentes entre nodos.
    // Las fábricas receptoras determinan qué mercancía debe viajar.
    for(const r of routes){
      r.productionCargo0388={};r.productionCargoDetail03817=[];
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
          r.productionCargoDetail03817.push({kind,rate:cargo/Math.max(.1,dt),direction:port===r.to?1:-1});
        }
      }
    }
    // Producción por etapas: las instalaciones primarias alimentan las
    // transformadoras; estas crean intermedios reales (acero, gas procesado,
    // combustible...) y la manufactura consume esos intermedios y electricidad.
    for(const g of groups.values()){
      g.factories.sort((a,b)=>industryStage(TYPES[a.site.kind])-industryStage(TYPES[b.site.kind]));
      // Cuotas de materias elaboradas y electricidad calculadas una sola vez
      // tras la etapa de transformación. Evita que una fábrica más antigua
      // acapare todo el acero/cobre y bloquee las industrias posteriores.
      let fairShares=null;
      for(const item of g.factories){
        const s=item.site,n=item.node,def=TYPES[s.kind],out=def.output;
        const intermediate=PROCESSED[s.kind]||null;
        const powerStation=def.group==='power';
        const electricRate=def.group==='manufacture'?.12:(def.electricity||0);
        const rawInputs=def.inputs||[];
        const powerBefore=availablePower(g);
        const inputBefore=rawInputs.map(kind=>({kind,available:available(g,kind)}));
        if(s.f===0){
          s.lastRate=0;s.lastPower=powerBefore;s.lastInputs=inputBefore;
          s.status='Producción reducida';s.efficiency=0;
        }
        const room=powerStation?Infinity:Math.max(0,n.cap[out]-n.stock[out]);
        const buffer=intermediate?Math.max(0,65*s.level-s.stock):0;
        if(room+buffer<=.000001){if(s.f===0)s.status='Almacén lleno';continue}
        const sharedLevel=industries3212.has(s.cell)?Math.max(1,industryLevel3230[s.cell]||1):0;
        const industrialBonus=1+Math.min(.24,sharedLevel*.08);
        let amount=Math.min(.39*s.level*activeFactor(s)*dt*industrialBonus,(room+buffer)/.90);
        if(amount<=0){if(s.f===0)s.status='Producción reducida';continue}
        const nominal=amount;
        if(def.group==='manufacture'){
          if(!fairShares){
            const demand=new Map();
            let electricalDemand=0;
            for(const candidate of g.factories){
              const cd=TYPES[candidate.site.kind];
              if(cd.group!=='manufacture')continue;
              const cs=candidate.site,cn=candidate.node;
              const upgrade=industries3212.has(cs.cell)?Math.max(1,industryLevel3230[cs.cell]||1):0;
              const desired=Math.min(.39*cs.level*activeFactor(cs)*dt*(1+Math.min(.24,upgrade*.08)),
                Math.max(0,cn.cap[cd.output]-cn.stock[cd.output])/.9);
              if(desired<=0)continue;
              electricalDemand+=desired*.12;
              if(cd.inputMode!=='any')for(const key of cd.inputs)
                demand.set(key,(demand.get(key)||0)+desired);
            }
            fairShares=new Map();
            for(const [key,requested] of demand)
              fairShares.set(key,requested?Math.min(1,available(g,key)/requested):1);
            fairShares.set('electric',electricalDemand?
              Math.min(1,availablePower(g)/electricalDemand):1);
          }
          amount*=fairShares.get('electric')??1;
          if(def.inputMode!=='any')for(const key of def.inputs)
            amount=Math.min(amount,.39*s.level*activeFactor(s)*dt*industrialBonus*(fairShares.get(key)??1));
        }
        // Reservar energía ANTES de consumir materias para no perder cargamentos
        // cuando una fábrica tenga apagones o capacidad eléctrica insuficiente.
        if(electricRate>0)amount=Math.min(amount,availablePower(g)/electricRate);
        if(amount<=0){
          if(s.f===0)s.status=electricRate>0&&availablePower(g)<=.000001?'Falta electricidad':'Producción reducida';
          continue;
        }
        const inputs=def.inputs||[];
        if(!inputs.length)continue;
        if(def.inputMode==='any'){
          let chosen=null,maximum=0;
          for(const kind of inputs){
            const qty=available(g,kind);
            if((powerStation||s.kind==='textile')&&qty>0){chosen=kind;maximum=qty;break}
            if(qty>maximum){chosen=kind;maximum=qty}
          }
          if(!chosen||maximum<=0){if(s.f===0)s.status=connect(s.cell,s.f)<0?'Sin conexión logística':'Falta materia prima';continue}
          amount=Math.min(amount,maximum);
          // Los telares antiguos pueden seguir usando lana o fibras naturales
          // sin hilandería; los materiales elaborados rinden más por unidad.
          if(s.kind==='textile'&&(chosen==='plantfiber'||chosen==='wool'))amount*=.72;
          amount=take(g,chosen,amount);
        }else{
          for(const kind of inputs)amount=Math.min(amount,available(g,kind));
          if(amount<=0){if(s.f===0)s.status=connect(s.cell,s.f)<0?'Sin conexión logística':'Falta materia prima';continue}
          for(const kind of inputs)take(g,kind,amount);
        }
        if(amount<=0){if(s.f===0)s.status='Falta materia prima';continue}
        if(s.f===0){
          s.status=amount<nominal*.98?'Producción reducida':'Produciendo';
          s.lastRate=amount*.9/Math.max(.1,dt);
          s.efficiency=Math.round(Math.min(100,amount/Math.max(.0001,nominal)*100));
          s.lastPower=powerBefore;
        }
        // Los bienes finales necesitan energía; las centrales son las
        // encargadas de generarla. No consumir el stock a nivel de mapa.
        if(electricRate>0)consumePower(g,amount*electricRate);
        const outputQty=amount*.90;
        if(powerStation){
          // Combustible procesado -> electricidad, sin crear combustible extra.
          g.electricity+=outputQty;
          g.generatedElectricity=(g.generatedElectricity||0)+outputQty;
          s.output+=outputQty;
          processed+=outputQty;
          continue;
        }
        // Reservar parte del intermedio para la cadena real y entregar el resto
        // al inventario logístico clásico, sin perder masa si uno está lleno.
        let stored=intermediate?Math.min(buffer,outputQty*.62):0;
        const delivered=Math.min(room,outputQty-stored);
        if(intermediate)stored+=Math.min(buffer-stored,outputQty-stored-delivered);
        if(intermediate)s.stock+=stored;
        n.stock[out]+=delivered;
        processed+=stored+delivered;s.output+=stored+delivered;
      }
    }
    // Planificador energético: déficit por nación, calculado sobre los grupos
    // logísticos reales, sin examinar todo el mapa ni los 500 países por turno.
    nationalElectricDeficit.clear();
    for(const g of groups.values()){
      let demand=0;
      for(const {site} of g.factories){
        const def=TYPES[site.kind];
        const power=def.group==='manufacture'?.12:(def.electricity||0);
        if(power>0)demand+=.39*site.level*activeFactor(site)*dt*power;
      }
      if(demand>0){
        const old=nationalElectricDeficit.get(g.f)||0;
        nationalElectricDeficit.set(g.f,Math.max(old,clamp(1-(g.generatedElectricity||0)/demand,0,1)));
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
    // Physical stocks change even without player actions; checkpoint them
    // on the existing simulation tick, never with a new polling timer.
    const wall=performance.now();
    if(wall-lastPeriodicSaveWall03827>=20000){
      lastPeriodicSaveWall03827=wall;
      persistProduction0388();
    }
  }
  function aiDevelop(f){
    if(f<=0||f>=activeFactionCount3230||!Number.isInteger(capitals[f]))return;
    const now=campaignSeconds3230||0;
    if(now<nextAI[f])return;
    nextAI[f]=now+44+(f%11)*6;
    if(botGold3230[f]<150||countNation(f)>=nationLimit(f))return;
    const own=Array.from(nationSites.get(f)||[]);
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
    if(ownKinds.has('crops'))ownKinds.add('plantfiber');
    if(ownKinds.has('livestock'))for(const kind of ['dairy','wool','hides'])ownKinds.add(kind);
    for(const kind of ['plantfiber','wool','hides']){
      const recipe=RECIPE[kind];
      if(ownKinds.has(kind)&&recipe&&!ownKinds.has(recipe))factoryNeeds.add(recipe);
    }
    const needsElectric=own.some(s=>TYPES[s.kind]?.electricity||TYPES[s.kind]?.group==='manufacture');
    const electricShortage=nationalElectricDeficit.get(f)||0;
    const thermals=own.filter(s=>s.kind==='thermal').length;
    const availableOutputs=new Set(ownKinds);
    for(const site of own){
      const output=PROCESSED[site.kind];
      if(output)availableOutputs.add(output);
    }
    // La IA necesita centrales si no tiene ninguna, o si su red está por
    // debajo de la demanda. Siempre debe disponer de combustible potencial.
    const fuelChain=['coal','fuel','gasfuel'].some(k=>availableOutputs.has(k));
    if(needsElectric&&fuelChain&&thermals<3&&(thermals===0||electricShortage>.15))
      factoryNeeds.add('thermal');
    for(const [kind,def] of Object.entries(TYPES)){
      if(def.group!=='manufacture'&&def.group!=='power')continue;
      if(ownKinds.has(kind)&&!(kind==='thermal'&&electricShortage>.15&&thermals<3))continue;
      const sourceAvailable=def.inputMode==='any'?
        def.inputs.some(k=>availableOutputs.has(k)):
        def.inputs.every(k=>availableOutputs.has(k));
      if(sourceAvailable)factoryNeeds.add(kind);
    }
    const role=FACTIONS3230[f]?.role||'balanced';
    const prospection=window.HexategosProspection03831;
    const agronomy=window.HexategosAgronomy03832;
    const physicalGeology=!!window.HexategosGeology03830;
    const needsOre=missing.some(k=>['iron','copper','coal','quarry'].includes(k));
    const needsFuel=missing.some(k=>k==='oil'||k==='gas');
    const needsFarm=!ownKinds.has('crops')||!ownKinds.has('livestock');
    // Las IA sólo usan indicios superficiales para elegir estudios.
    // Nunca consultan depósitos exactos de hexágonos no prospectados.
    let surveyChoice=null,surveyScore=0;
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
      const guess=window.HexategosNaturalPotential03829?.profile?.(cell);
      if(guess&&physicalGeology&&prospection&&
         !prospection.hasKnowledge(cell)&&prospection.availability(f,cell).ok){
        const estimate=Math.max(needsOre?guess.mineral:0,needsFuel?guess.energy:0);
        const value=estimate*logistics*(.8+pressure.mining*.4);
        if(value>surveyScore){surveyScore=value;surveyChoice={cell,kind:'geo'}}
      }
      if(guess&&needsFarm&&agronomy&&!agronomy.isKnown(cell)&&
         agronomy.availability(f,cell).ok){
        const estimate=Math.max(!ownKinds.has('crops')?guess.food:0,
          !ownKinds.has('livestock')?guess.livestock:0);
        const value=estimate*logistics*(.5+pressure.farming*.3);
        if(value>surveyScore){surveyScore=value;surveyChoice={cell,kind:'agro'}}
      }
      for(const kind of missing){
        if(physicalGeology&&GEO_KINDS.has(kind)&&
           !prospection?.hasKnowledge?.(cell))continue;
        const type=TYPES[kind],p=potential(cell,f,kind);
        const need=pressure[type.sector]||.2;
        const value=p*(.72+need*1.35)*logistics;
        if(value>score&&availability(f,cell,kind,true).ok&&botGold3230[f]>type.cost+65){score=value;choice={cell,kind}}
      }
      for(const kind of factoryNeeds){
        const type=TYPES[kind];
        const strategic=kind==='arms'?(role==='aggressive'?1.45:.77):
          kind==='thermal'?(1+pressure.energy*.5+electricShortage*1.1):
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
    if(surveyChoice&&surveyScore>.32&&botGold3230[f]>165){
      const out=surveyChoice.kind==='geo'?
        prospection?.begin(f,surveyChoice.cell):
        agronomy?.begin(f,surveyChoice.cell);
      if(out?.ok){
        nextAI[f]=now+27+(f%11)*5;
        return;
      }
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
    return {v:3,sites:[...sites.values()].map(s=>({cell:s.cell,f:s.f,kind:s.kind,
      level:s.level,pct:s.pct,stock:s.stock,output:s.output,
      legacyQuality:Number(s.legacyQuality)||0,byproducts:s.byproducts||{}})),
      depots:[...depots],sectors:[...sectorPct]};
  }
  function restore(data){
    sites.clear();perCell.clear();nationSites.clear();nationCounts.clear();manufacturingCounts.clear();depots.clear();sectorPct.clear();nationalElectricDeficit.clear();revision++;aiCursor=1;nextAI.fill(0);
    if(!data||!Array.isArray(data.sites))return;
    for(const x of data.sites.slice(0,MAX_SITES)){
      if(!x||!TYPES[x.kind]||!Number.isInteger(x.cell)||x.cell<0||x.cell>=owner6.length)continue;
      const f=owner6[x.cell];
      if(f<0)continue;
      if(sitesOnCell(x.cell).length>=MAX_PER_CELL)continue;
      const byproducts={};
      if(x.byproducts&&typeof x.byproducts==='object')for(const kind of Object.keys(DERIVATIVES[x.kind]||{}))
        byproducts[kind]=clamp(Number(x.byproducts[kind])||0,0,325);
      const legacy=TYPES[x.kind].group==='extract'?
        ((data.v==null||Number(data.v)<3)? .85:clamp(Number(x.legacyQuality)||0,0,2.6)):0;
      // Los yacimientos que sustentaban minas de partidas antiguas permanecen.
      const p=legacy?Math.max(legacy,potential(x.cell,f,x.kind)):
        potential(x.cell,f,x.kind);
      addSite({cell:x.cell,f,kind:x.kind,byproducts,legacyQuality:legacy,
        level:clamp(Math.trunc(x.level||1),1,5),
        pct:clamp(Number(x.pct??100),0,100),stock:clamp(Number(x.stock)||0,0,325),
        output:Math.max(0,Number(x.output)||0),potential:p,
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
  // Escribir la instantánea ANTES y después del guardado general: algunos
  // guardados internos vuelven a invocar reset / sincronizaciones de otros módulos.
  function readProduction03827(){
    const codec=window.HexategosSaveStorage03827;
    return codec?.get?codec.get(SAVE_KEY):JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
  }
  function persistProduction0388(){
    const state=saveState(),codec=window.HexategosSaveStorage03827;
    if(codec?.set)return codec.set(SAVE_KEY,state);
    try{
      const text=JSON.stringify(state);
      localStorage.setItem(SAVE_KEY,text);
      return localStorage.getItem(SAVE_KEY)===text;
    }catch(error){
      console.warn('[Hexategos producción] No se pudo guardar. Exporta una copia.',error);
      return false;
    }
  }
  const baseSave=saveGame3212;
  saveGame3212=function(){
    persistProduction0388();
    const out=baseSave.apply(this,arguments);
    if(out!==false)persistProduction0388();
    return out;
  };
  const baseLoad=loadGame3212;
  loadGame3212=function(){
    // Captura previa: la carga general puede inicializar otros subsistemas.
    let snapshot=null;
    try{snapshot=readProduction03827()}catch(error){
      console.warn('[Hexategos producción] Copia industrial ilegible; se preserva el estado anterior',error);
    }
    const out=baseLoad.apply(this,arguments);
    if(out!==false){
      // No borrar industrias si la partida no contiene copia industrial.
      // Las partidas antiguas siguen siendo válidas y pueden no incluirla.
      if(snapshot&&Array.isArray(snapshot.sites))restore(snapshot);
    }
    return out;
  };
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
      if(out!==false){
        // Nunca mezclar instalaciones de otra partida con un archivo antiguo.
        restore(input&&Array.isArray(input.sites)?input:null);
        persistProduction0388();
      }
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
      const inputInfo=(s.lastInputs||[]).map(v=>(RESOURCE_PRODUCT_LABELS[v.kind]||v.kind)+': '+Number(v.available||0).toFixed(1)).join(' · ');
      const status=s.status||'Pendiente de simulación';
      return '<div class="industrySite0388"><div><b>'+def.icon+' '+esc(def.name)+'</b>'+ 
        '<small>'+esc(place)+' · Nivel '+s.level+'/5 · '+(hasRoad?'Conectada':'Sin carretera')+
        (def.group==='extract'?' · Yacimiento '+Math.round(s.potential*100)+'%':' · Transformación')+
        ' · '+esc(status)+' · Producción '+Number(s.lastRate||0).toFixed(2)+'/s'+
        ' · Eficiencia '+Math.round(s.efficiency||0)+'%'+
        (def.electricity||def.group==='manufacture'?' · Electricidad '+Number(s.lastPower||0).toFixed(2):'')+
        (inputInfo?' · '+esc(inputInfo):'')+'</small></div>'+
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
  function renderIndustryModal0388(cell){
    const state=uiInteractionState3244?.modal;
    if(state?.type!=='production0388'||state.data?.cell!==cell)return false;
    const context=industryContext0388(cell);
    if(!context){closeModal3244();return false}
    state.data.section='catalog';
    const existing=sitesOnCell(cell);
    const place=typeof placeDisplayName3271==='function'?placeDisplayName3271(cell):'Hexágono '+cell;
    const generalLevel=context.industry||0;
    const generalCost=generalLevel?115+generalLevel*55:110;
    const generalEnabled=typeof canIndustry3244==='function'&&canIndustry3244(context);
    const gold=Math.floor(gold3212);
    modalTitle3244.textContent='Industria · '+place;
    const primary=Object.entries(TYPES);
    const groups=[
      {name:'Nivel I · Industrias primarias',tip:'Explotaciones de recursos naturales (hasta siete hexágonos)',kinds:primary.filter(([,d])=>d.group==='extract')},
      {name:'Nivel II · Transformación y materias elaboradas',tip:'Refino, siderurgia, metalurgia, madera, cemento, alimentación, hilados y cuero',kinds:primary.filter(([,d])=>d.group==='factory')},
      {name:'Nivel III · Manufactura y bienes finales',tip:'Bienes civiles, maquinaria, textiles, química y electrónica',kinds:primary.filter(([k,d])=>d.group==='manufacture'&&k!=='arms')},
      {name:'Nivel IV · Electricidad y producción militar',tip:'Centrales térmicas y fabricación de material para el ejército',kinds:primary.filter(([k,d])=>d.group==='power'||k==='arms')}
    ];
    const general='<button type="button" class="industryBuildChoice0388 industryGeneric03815" data-industry-general0388 '+
      (generalEnabled?'':'disabled')+'><span class="industryTypeIcon0388">🏭</span>'+
      '<span class="industryBuildText0388"><b>Industria manufacturera · área general</b>'+
      '<small>Nivel '+generalLevel+'/3 · '+generalCost+' oro · infraestructura y capacidad industrial'+
      (generalEnabled?'':' · mejora no disponible')+'</small></span></button>';
    const cards=groups.map((group,i)=>
      '<section class="industryGroup0388 industryStage03815" data-stage03815="'+(i+1)+'">'+
      '<h4>'+group.name+'</h4><p class="industryStageHint03815">'+group.tip+'</p>'+
      '<div class="industryBuildGrid0388">'+(i===2?general:'')+
      group.kinds.map(([kind,def])=>{
        const strength=def.group==='extract'?Math.round(potential(cell,0,kind)*100):null;
        const test=availability(0,cell,kind,true);
        return '<button type="button" class="industryBuildChoice0388" data-industry-build0388="'+kind+'" '+
          (test.ok?'':'disabled')+'><span class="industryTypeIcon0388">'+def.icon+'</span>'+
          '<span class="industryBuildText0388"><b>'+esc(def.name)+'</b>'+
          '<small>'+def.cost+' oro'+(strength===null?'':' · potencial '+strength+'%')+
          (test.ok?' · Disponible':' · '+esc(test.reason))+'</small></span></button>';
      }).join('')+'</div></section>').join('');
    const future='<section class="industryGroup0388 industryFuture03815"><h4>Nivel V · Tecnologías futuras</h4>'+
      '<p class="industryStageHint03815">Planificación tecnológica. Estas industrias aún no pueden construirse ni fabricar recursos.</p>'+
      '<div class="industryBuildGrid0388">'+FUTURE_INDUSTRIES.map(t=>
        '<div class="industryFutureCard03815"><b>🔒 '+esc(t.name)+'</b><small>'+esc(t.note)+'</small></div>'
      ).join('')+'</div></section>';
    modalBody3244.innerHTML='<div class="industryModal0388 industryCatalog03815">'+
      '<div class="industryIntro0388"><b>🏭 Complejo industrial</b>'+
      '<p>Todos los tipos en un mismo catálogo, ordenados por etapa. Las materias pasan de extracción a transformación y manufactura. Las industrias finales necesitan energía y transporte.</p></div>'+
      '<div class="industryBudget0388">Oro: <b>'+gold.toLocaleString('es-ES')+'</b> · '+
      'Instalaciones especializadas: <b>'+countNation(0)+'/'+MAX_PLAYER_SITES+'</b> · '+
      'En este hexágono: <b>'+existing.length+'/'+MAX_PER_CELL+'</b></div>'+
      (existing.length?'<div class="industryExisting0388"><b>Ya construidas aquí:</b> '+
         existing.map(site=>esc(TYPES[site.kind].name)).join(' · ')+'</div>':'')+
      cards+future+'</div>';
    modalActions3244.innerHTML='<button type="button" data-modal-action="close">CERRAR</button>';
    return true;
  }
  function showBuildModal(cell){
    if(!Number.isInteger(cell)||owner6[cell]!==0)return false;
    closeContextDialog3244();
    // Rescatar por seguridad cualquier modal de producción anterior. Las
    // acciones normales de cierre vacían la bandera modal además del overlay.
    if(uiInteractionState3244?.modal?.type==='production0388')closeModal3244();
    uiInteractionState3244.modal={type:'production0388',data:{cell,section:'catalog'}};
    modal3244.classList.add('open3244');
    modal3244.setAttribute('aria-hidden','false');
    return renderIndustryModal0388(cell);
  }
  const baseActions=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const actions=baseActions.apply(this,arguments);
    if(ctx?.kind!=='cell'||!Number.isInteger(ctx.cell)||!ctx.own)return actions;
    const general=actions.findIndex(a=>a.id==='build_industry');
    const merged=classicAction3246('production0388','INDUSTRIA','🏭',
      'PRIMARIA · TRANSFORMACIÓN · MANUFACTURA',true,'good3244');
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
  // Snapshot económico derivado, no persistido: lee únicamente instalaciones
  // reales, nunca yacimientos ocultos ni inventarios ficticios por hexágono.
  // Los valores de demanda son tasas estimadas por segundo para orientar
  // importaciones e inversiones, no una segunda producción.
  function materialBalance03838(){
    const nations=new Map();
    for(const s of sites.values()){
      if(s.f<0||s.f>=activeFactionCount3230)continue;
      let n=nations.get(s.f);
      if(!n){n={stock:{},demand:{},outputs:{},sites:0};nations.set(s.f,n)}
      n.sites++;
      const def=TYPES[s.kind];
      const produced=def.group==='extract'?s.kind:PROCESSED[s.kind];
      if(produced){
        n.stock[produced]=(n.stock[produced]||0)+Math.max(0,Number(s.stock)||0);
        n.outputs[produced]=(n.outputs[produced]||0)+Math.max(0,Number(s.lastRate)||0);
      }
      if(s.byproducts)for(const [kind,amount] of Object.entries(s.byproducts))
        n.stock[kind]=(n.stock[kind]||0)+Math.max(0,Number(amount)||0);
      if(def.inputs?.length){
        const rate=.39*s.level*activeFactor(s);
        // Cadenas alternativas necesitan un combustible, no todos a la vez.
        if(def.inputMode==='any'){
          const chosen=def.inputs.find(k=>(n.stock[k]||0)>0)||
            def.inputs[0];
          n.demand[chosen]=(n.demand[chosen]||0)+rate;
        }else{
          for(const kind of def.inputs)
            n.demand[kind]=(n.demand[kind]||0)+rate;
        }
      }
    }
    // Mercancías físicamente depositadas en puertos.
    for(const [cell,goods] of depots){
      const f=owner6[cell],n=nations.get(f);
      if(!n)continue;
      for(const kind of MATERIAL_KEYS)
        if(Number(goods[kind])>0)n.stock[kind]=(n.stock[kind]||0)+Number(goods[kind]);
    }
    return nations;
  }
  window.HexategosProduction0388={
    version:VERSION,types:TYPES,cells:()=>perCell.keys(),revision:()=>revision,tick,
    sites:()=>[...sites.values()].map(s=>({...s})),sector:(f,s)=>sec(f,s),
    build,upgrade,setPct,setSector,potential,efficiency,availability,sitesOnCell:cell=>sitesOnCell(cell).map(s=>({...s})),
    legacyManufacturingFactor:f=>Math.max(.15,1-(manufacturingCounts.get(Number(f))||0)*.22),
    intermediates:()=>({...RESOURCE_PRODUCT_LABELS}),futureIndustries:()=>FUTURE_INDUSTRIES.map(v=>({...v})),
    iconOffset:iconOffset03811,
    drawCandidates:()=>sites.values(),
    snapshot:saveState,persist:persistProduction0388,materialBalance:materialBalance03838,
    legacyQuality:(cell,kind)=>Number(sites.get(siteKey(cell,kind))?.legacyQuality)||0,
    stats:()=>({...lastStats}),electricDeficit:f=>nationalElectricDeficit.get(Number(f))||0,validate:()=>{
      const errors=[];for(const s of sites.values())if(!TYPES[s.kind]||s.cell<0)errors.push('instalación inválida');
      return {ok:!errors.length,errors,stats:lastStats};
    }
  };
  console.info('[HEXATEGOS] '+VERSION+' · industrias primarias, transformación y logística material.');
})();
