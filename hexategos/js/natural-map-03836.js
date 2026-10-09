'use strict';
/* HEXATEGOS 0.38.36 · Mapas naturales.
   Comparte los LOD y el dibujado existente. Sin intervalos, sin barridos
   de la malla completa y sin acceder a los yacimientos no descubiertos. */
(() => {
  const natural=window.HexategosNaturalPotential03829;
  const prospect=window.HexategosProspection03831;
  const agronomy=window.HexategosAgronomy03832;
  if(!natural||typeof terrainStrategicFill3247!=='function'||!document.getElementById('mapModeBtn3252'))
    return;
  const MODES=[
    ['natural-food','Agricultura','🌾','food'],
    ['natural-livestock','Ganadería','🐄','livestock'],
    ['natural-forest','Bosques','🌲','forest'],
    ['natural-mineral','Potencial minero','⛏️','mineral'],
    ['natural-energy','Potencial energético','⚡','energy'],
    ['natural-known','Yacimientos descubiertos','🔎','known']
  ];
  const FIELDS=new Map(MODES.map(([key,label,short,field])=>[key,{label,short,field}]));
  // Familia vectorial propia: misma geometría, peso de trazo y marco hexagonal.
  const ICON_PATHS={
    political:'<circle cx="12" cy="12" r="5.7"/><path d="M6.5 12h11M12 6.3c-3 3.2-3 8.2 0 11.4M12 6.3c3 3.2 3 8.2 0 11.4"/>',
    terrain:'<path d="m5 16 4.5-7 2.6 3.6 2.2-5 4.8 8.4H5z"/>',
    supply:'<path d="M5.5 8.5h8v7h-8zM13.5 11h3l2 2.4v2.1h-5z"/><circle cx="8" cy="16.3" r="1"/><circle cx="16.5" cy="16.3" r="1"/>',
    geopolitics:'<circle cx="12" cy="12" r="5.8"/><path d="m14.8 9.2-1.6 4-4 1.6 1.6-4z"/>',
    'natural-food':'<path d="M12 18V6M12 9c-3 0-4-2-4-3 3 0 4 2 4 3zm0 4c-3 0-4-2-4-3 3 0 4 2 4 3zm0 4c-3 0-4-2-4-3 3 0 4 2 4 3zm0-8c3 0 4-2 4-3-3 0-4 2-4 3zm0 4c3 0 4-2 4-3-3 0-4 2-4 3z"/>',
    'natural-livestock':'<path d="M8 10 6.5 7 9.5 8M16 10l1.5-3-3 1M8 10c-.7 1-.8 2.3-.8 4.1 0 2.8 2 4 4.8 4s4.8-1.2 4.8-4c0-1.8-.1-3.1-.8-4.1-2-2.2-6-2.2-8 0z"/><path d="M10 14v.4M14 14v.4M10.5 16.4q1.5 1 3 0"/>',
    'natural-forest':'<path d="m12 5-4 5h2l-3 4h3l-2 3h8l-2-3h3l-3-4h2zM12 17v2"/>',
    'natural-mineral':'<path d="m7 17 10-10M10 7l7 0-1 6M5 16l3 3M14 6l4 4"/>',
    'natural-energy':'<path d="m13.8 5-6.2 8h4l-1.4 6 6.3-9h-4z"/>',
    'natural-known':'<circle cx="11.3" cy="11" r="4.7"/><path d="m14.9 14.7 3.2 3.2M11.3 8.7v4.6M9 11h4.6"/>'
  };
  function mapIcon(mode){
    const paths=ICON_PATHS[mode]||ICON_PATHS.political;
    return '<svg class="hexMapIcon03855" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M12 1.8 20.8 6.9v10.2L12 22.2 3.2 17.1V6.9z" fill="none" stroke="currentColor" stroke-width="1.25" opacity=".6"/><g fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">'+paths+'</g></svg>';
  }
  const MENU=[
    ['political','Político'],['terrain','Terreno'],['supply','Suministro'],
    ['geopolitics','Geopolítica'],...MODES.map(x=>[x[0],x[1]])
  ];
  const GRADES=['Inexistente','Muy bajo','Bajo','Medio','Alto','Excepcional'];
  const PALETTES={
    food:[[50,53,53],[102,77,58],[150,108,65],[154,155,78],[84,157,85],[39,168,84]],
    livestock:[[50,53,53],[99,75,60],[156,111,70],[157,153,87],[117,163,78],[74,182,70]],
    forest:[[50,53,53],[96,83,64],[132,120,67],[96,138,72],[58,144,83],[26,113,70]],
    mineral:[[50,53,53],[82,83,97],[116,113,108],[144,125,95],[185,147,73],[223,172,65]],
    energy:[[50,53,53],[84,81,104],[95,119,127],[96,140,148],[79,174,191],[80,205,226]],
    known:[[51,57,66],[102,105,103],[153,122,88],[160,142,89],[95,171,121],[74,200,163]]
  };
  const MAX_CACHE=6000;
  const terrainFarming=new Map([
    ['plain',[3,3]],['mediterranean',[3,3]],['savanna',[2,3]],
    ['steppe',[2,3]],['forest',[2,2]],['rainforest',[2,1]],
    ['desert',[1,1]],['tundra',[1,1]],['ice',[0,0]],['mountain',[1,2]]
  ]);
  const estimatedGrade=(field,key,i,L)=>{
    const terrain=terrainType3247(key,i,L);
    const bands=terrainFarming.get(terrain)||[2,2];
    return bands[field==='food'?0:1];
  };
  const samples=new Map(),knownColors=new Map();
  let currentSeed=-1,currentStudyRevision=-1,currentIndustryRevision=-1;
  const stats={computed:0,cached:0,hidden:0};
  const grade=value=>{
    const v=Number(value)||0;
    return v<=.02?0:v<.38?1:v<.70?2:v<1.12?3:v<1.62?4:5;
  };
  function invalidate(){
    const seed=natural.seed?.()||0;
    const studiedRevision=prospect?.stats?.().revision??-1;
    const industryRevision=window.HexategosProduction0388?.revision?.()??-1;
    if(seed!==currentSeed){currentSeed=seed;samples.clear();knownColors.clear()}
    // On import, reset or newly completed studies, no discovery grade from
    // the previous campaign may remain in a reusable colour cache.
    if(studiedRevision!==currentStudyRevision||industryRevision!==currentIndustryRevision){
      currentStudyRevision=studiedRevision;
      currentIndustryRevision=industryRevision;
      knownColors.clear();
    }
  }
  function remember(cache,key,value){
    if(cache.size>=MAX_CACHE)cache.delete(cache.keys().next().value);
    cache.set(key,value);
    return value;
  }
  function sampled(key,i,L){
    invalidate();
    if(key===MAX_GAME_LEVEL3233)return natural.profile(i);
    const id=String(key)+':'+i;
    if(samples.has(id)){stats.cached++;return samples.get(id)}
    const j=i*3,xyz=L.centers;
    const x=xyz[j]/32767,y=xyz[j+1]/32767,z=xyz[j+2]/32767;
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))return null;
    const lon=Math.atan2(x,z)*180/Math.PI;
    const lat=Math.asin(Math.max(-1,Math.min(1,y)))*180/Math.PI;
    const value=natural.sampleAt(lat,lon,terrainType3247(key,i,L));
    if(value){stats.computed++;remember(samples,id,value)}
    return value;
  }
  function discoveredGrade(cell){
    invalidate();
    if(!prospect?.hasKnowledge?.(cell)){stats.hidden++;return 0}
    if(knownColors.has(cell))return knownColors.get(cell);
    // Only a completed prospecting report is allowed to expose grades.
    const result=prospect.result?.(cell);
    if(!result)return 0;
    const table={Inexistente:0,'Muy bajo':1,Bajo:2,Medio:3,Alto:4,Excepcional:5};
    let high=0;
    for(const value of Object.values(result))high=Math.max(high,table[value]||0);
    return remember(knownColors,cell,Math.max(1,high));
  }
  function paletteColor(mode,key,i,L){
    if(L.land[i]<0)return null;
    const field=FIELDS.get(mode)?.field;
    if(!field)return null;
    if(field==='known'){
      if(key!==MAX_GAME_LEVEL3233)return PALETTES.known[0];
      return PALETTES.known[discoveredGrade(i)];
    }
    if(field==='food'||field==='livestock'){
      // Antes del estudio sólo se conoce una aptitud genérica por el paisaje.
      // El valor real nunca se consulta en una parcela sin evaluar.
      if(key!==MAX_GAME_LEVEL3233||!agronomy?.isKnown?.(i))
        return PALETTES[field][estimatedGrade(field,key,i,L)];
    }
    const p=sampled(key,i,L);
    return PALETTES[field][grade(p?.[field])];
  }
  for(const [key,label] of MODES){
    if(!MAP_MODES3252.includes(key))MAP_MODES3252.push(key);
    MAP_MODE_NAMES3252[key]=label;
  }
  // Core reads the preference before these optional map modes are registered.
  try{
    const saved=localStorage.getItem('ofhex_map_mode_3252');
    if(FIELDS.has(saved))mapMode3252=saved;
  }catch(_){}
  const baseFill=terrainStrategicFill3247;
  terrainStrategicFill3247=function(key,i,L,owner,z){
    if(!FIELDS.has(mapMode3252))return baseFill.apply(this,arguments);
    if(L.land[i]<0)return baseFill.apply(this,arguments);
    return shadedRGB3247(paletteColor(mapMode3252,key,i,L),z);
  };
  const mapButton=document.getElementById('mapModeBtn3252');
  const menu=document.createElement('div');
  menu.id='naturalMapMenu03836';
  menu.className='naturalMapMenu03836';
  menu.hidden=true;
  menu.setAttribute('role','group');
  menu.setAttribute('aria-label','Elegir mapa');
  const options=MENU.map(([key,label])=>{
    const option=document.createElement('button');
    option.type='button';option.dataset.mapLayer03836=key;
    const spec=FIELDS.get(key);
    option.innerHTML=mapIcon(key)+'<span>'+label+'</span>';
    option.setAttribute('aria-pressed','false');
    menu.appendChild(option);
    return option;
  });
  document.body.appendChild(menu);
  function close(){menu.hidden=true;mapButton.setAttribute('aria-expanded','false')}
  function updateMenu(){
    options.forEach(option=>
      option.setAttribute('aria-pressed',String(option.dataset.mapLayer03836===mapMode3252)));
  }
  function open(){
    const rect=mapButton.getBoundingClientRect();
    menu.style.left=Math.min(Math.max(8,rect.right+9),
      Math.max(8,window.innerWidth-235))+'px';
    menu.style.top=Math.min(Math.max(8,rect.top-25),
      Math.max(8,window.innerHeight-Math.min(440,window.innerHeight-16)))+'px';
    menu.hidden=false;mapButton.setAttribute('aria-expanded','true');
    updateMenu();
  }
  function select(mode){
    if(!MAP_MODES3252.includes(mode))return false;
    mapMode3252=mode;
    try{localStorage.setItem('ofhex_map_mode_3252',mode)}catch(_){}
    updateMapModeUI3252(false);
    close();needsRender=true;return true;
  }
  mapButton.onclick=event=>{
    event?.preventDefault?.();
    menu.hidden?open():close();
  };
  menu.addEventListener('click',event=>{
    const btn=event.target.closest('[data-map-layer03836]');
    if(btn)select(btn.dataset.mapLayer03836);
  });
  document.addEventListener('pointerdown',event=>{
    if(!menu.hidden&&!menu.contains(event.target)&&event.target!==mapButton)close();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  const baseUpdate=updateMapModeUI3252;
  function legend(mode){
    const field=FIELDS.get(mode)?.field;
    if(!field)return '';
    const colors=PALETTES[field];
    const labels=field==='known'?
      ['Sin prospectar','Sin yacimiento relevante','Muy bajo','Medio','Alto','Excepcional']:
      GRADES;
    return colors.map((rgb,i)=>'<span class="tl3250"><i style="background:rgb('+
      rgb.join(',')+')"></i>'+labels[i]+'</span>').join('')+
      (field==='known'?'<small>Acércate a la malla de detalle para consultar los estudios.</small>':
       (field==='food'||field==='livestock')?'<small>Sin evaluación: aptitud aproximada por tipo de terreno. Tras evaluar un hexágono se muestra su potencial real.</small>':'');
  }
  updateMapModeUI3252=function(showToast=false){
    // Reuse the current map system, including the geopolitical panel cleanup.
    baseUpdate(false);
    const spec=FIELDS.get(mapMode3252);
    if(spec){
      const b=document.getElementById('mapModeBtn3252'),leg=document.getElementById('terrainLegend3250');
      if(b){
        b.innerHTML=mapIcon(mapMode3252);
        b.classList.remove('modeTerrain3252','modeSupply3252','modeGeopolitics0352');
        b.setAttribute('aria-label','Mapa: '+spec.label);
        b.title='Mapa '+spec.label+' · pulsa para elegir otra capa';
      }
      if(leg){
        leg.classList.remove('supplyLegend3252','geopoliticsLegend0352');
        leg.innerHTML=legend(mapMode3252);leg.style.display='';
      }
      showSupplyOverlay3230=false;
    }else if(ICON_PATHS[mapMode3252]){
      const b=document.getElementById('mapModeBtn3252');
      if(b){
        b.innerHTML=mapIcon(mapMode3252);
        const label=MENU.find(x=>x[0]===mapMode3252)?.[1]||'Mapa';
        b.setAttribute('aria-label','Mapa: '+label);
        b.title='Mapa '+label+' · pulsa para elegir otra capa';
      }
    }
    updateMenu();
    if(showToast&&typeof toast==='function')
      toast('Mapa '+(spec?.label||MAP_MODE_NAMES3252[mapMode3252]));
    needsRender=true;
  };
  updateMapModeUI3252(false);
  window.HexategosNaturalMap03836=Object.freeze({
    version:'0.38.55',select,active:()=>mapMode3252,
    paletteColor,grade,stats:()=>({...stats,cache:samples.size,discoveredCache:knownColors.size}),
    cacheLimit:MAX_CACHE
  });
})();
