'use strict';
/* HEXATEGOS 0.38.30 · Geología mundial determinista (bloque C).
   Modelo heurístico de provincias, NO inventario ni mapa geológico científico.
   Depósitos reales ocultos hasta una futura prospección (bloque D).
   Referencias de diseño: mapas de provincias EIA y datos de recursos USGS. */
(() => {
  const BUILD='0.38.30', GENERATOR=1, CACHE_LIMIT=8192;
  const rawKinds=['iron','copper','coal','quarry','oil','gas'];
  const materials=new Set(rawKinds);
  const cache=new Map();
  const nature=window.HexategosNaturalPotential03829;
  if(!nature||typeof cellLonLat3302!=='function'||typeof terrainKey3250!=='function'){
    console.warn('[Hexategos geología] Falta el atlas o el generador natural');return;
  }
  // Provincias elípticas ajustables. No constituyen depósitos garantizados:
  // sólo modifican posibilidades y calidad mediante ruido espacial de la seed.
  // Formato: nombre, latitud, longitud, semiejes en grados, pesos por material.
  const PROVINCES=Object.freeze([
    ['Golfo Pérsico',27,50,11,18,{oil:.80,gas:.78}],
    ['Caspio',41,51,15,18,{oil:.68,gas:.72}],
    ['Sáhara septentrional',29,5,13,25,{oil:.54,gas:.65}],
    ['Mar del Norte',57,3,13,15,{oil:.60,gas:.58}],
    ['Siberia occidental',62,72,18,35,{oil:.69,gas:.85,coal:.34}],
    ['Golfo de México',25,-91,12,19,{oil:.72,gas:.58}],
    ['Venezuela oriental',10,-64,12,19,{oil:.69,gas:.50}],
    ['Cuenca del Níger',5,7,11,17,{oil:.56,gas:.49}],
    ['Alberta',55,-113,14,21,{oil:.61,gas:.46,coal:.37}],
    ['Indonesia insular',-3,118,15,26,{oil:.41,gas:.47,coal:.39}],
    ['Apalaches',38,-81,13,15,{coal:.83,gas:.34}],
    ['Cuenca carbonífera china',38,113,16,20,{coal:.80,iron:.30}],
    ['Australia oriental',-24,147,17,20,{coal:.82,copper:.35}],
    ['Australia occidental',-23,119,17,20,{iron:.92,coal:.28}],
    ['India central',23,83,14,16,{coal:.72,iron:.55}],
    ['Siberia central',55,96,15,29,{coal:.58,iron:.49}],
    ['Europa centro-occidental',51,9,13,17,{coal:.55,iron:.38}],
    ['África austral',-27,27,17,22,{coal:.65,iron:.35}],
    ['Sudeste de Brasil',-20,-44,16,17,{iron:.85,copper:.24}],
    ['Lagos Superiores',47,-89,12,15,{iron:.73,copper:.34}],
    ['Escandinavia septentrional',67,21,14,17,{iron:.73,copper:.28}],
    ['Hierro de África occidental',12,-11,17,22,{iron:.52}],
    ['Andes Chile-Perú',-24,-70,28,12,{copper:.95,iron:.31}],
    ['Cinturón centroafricano',-12,28,15,19,{copper:.90}],
    ['Arizona y Sonora',32,-110,14,20,{copper:.79}],
    ['Australia central',-23,138,17,24,{copper:.68,iron:.42}],
    ['Mongolia meridional',43,106,16,21,{copper:.73,coal:.36}],
    ['Altiplano boliviano',-17,-67,15,15,{copper:.48}],
    ['Cordillera canadiense',55,-124,19,18,{copper:.50,coal:.25}]
  ].map(([name,lat,lon,ry,rx,weights])=>Object.freeze({
    name,lat,lon,ry,rx,weights:Object.freeze(weights)
  })));
  const thresholds=Object.freeze({
    iron:.61,copper:.64,coal:.62,quarry:.50,oil:.67,gas:.66
  });
  let activeSeed=NaN;
  function syncSeed(){
    const actual=nature.seed();
    if(actual!==activeSeed){activeSeed=actual;cache.clear()}
  }
  function wrappedDelta(lon,reference){
    return ((lon-reference+540)%360)-180;
  }
  function provinceEffect(lat,lon,kind){
    let best=0;
    for(const p of PROVINCES){
      const weight=p.weights[kind]||0;
      if(!weight)continue;
      const dy=(lat-p.lat)/p.ry,dx=wrappedDelta(lon,p.lon)/p.rx;
      const d=dy*dy+dx*dx;
      if(d>5)continue;
      best=Math.max(best,weight*Math.exp(-2.5*d));
    }
    return best;
  }
  function terrainTendency(kind,type){
    // Geología y relieve separados. La superficie sólo inclina muy débilmente
    // la posibilidad, nunca impone minerales ni los prohíbe en llanuras.
    if(kind==='quarry')return type==='mountain'||type==='highmountain'?.07:.02;
    if(kind==='iron'||kind==='copper')
      return type==='mountain'||type==='highmountain'?.035:0;
    if(kind==='oil'||kind==='gas')
      return type==='plain'||type==='steppe'||type==='desert'||type==='sea'?.025:0;
    return 0;
  }
  function qualityAt(lat,lon,type,kind){
    const boost=provinceEffect(lat,lon,kind);
    const n1=nature.regionalNoise(lat,lon,16,0xA100+rawKinds.indexOf(kind)*17);
    const n2=nature.regionalNoise(lat,lon,5.5,0xB300+rawKinds.indexOf(kind)*53);
    const n3=nature.regionalNoise(lat,lon,2.2,0xC700+rawKinds.indexOf(kind)*109);
    // Muchos ceros reales. Una provincia eleva probabilidad y calidad,
    // pero incluso su centro puede no albergar un yacimiento.
    const regional=n1*.43+n2*.34+n3*.23;
    const surplus=regional*(1+.84*boost)+.06*boost+
      terrainTendency(kind,type)-thresholds[kind];
    return surplus<=0?0:Math.min(2.6,Math.pow(surplus*3.5,1.18));
  }
  function effectiveDeposit(cell,kind,base){
    // Una mina histórica demuestra físicamente el yacimiento existente.
    // La garantía se conserva con ella aunque cambie su propietario.
    const guarantee=Number(window.HexategosProduction0388?.legacyQuality?.(cell,kind))||0;
    if(guarantee<=base.quality)return {...base};
    return {kind,quality:guarantee,
      reserve:Math.max(base.reserve,Math.round(guarantee*160000))};
  }
  function deposit(cell,kind){
    if(!materials.has(kind))return null;
    cell=Number(cell);
    if(!Number.isInteger(cell)||cell<0||!window.__openfrontBootCompleted3281)return null;
    syncSeed();
    const key=cell+':'+kind,old=cache.get(key);
    if(old)return effectiveDeposit(cell,kind,old);
    let loc=null,type='plain';
    try{loc=cellLonLat3302(cell);type=terrainKey3250(cell)||'plain'}catch(_){return null}
    const lat=Number(loc?.lat),lon=Number(loc?.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
    const quality=qualityAt(lat,lon,type,kind);
    const reserve=quality===0?0:Math.max(1,Math.round(
      quality*160000*(.7+.6*nature.regionalNoise(lat,lon,8,0xD610+rawKinds.indexOf(kind)))));
    const result=Object.freeze({kind,quality,reserve});
    if(cache.size>=CACHE_LIMIT)cache.delete(cache.keys().next().value);
    cache.set(key,result);
    return effectiveDeposit(cell,kind,result);
  }
  function hint(cell){
    // Conocimiento superficial: no consultar el yacimiento concreto.
    const p=nature.profile(cell);
    return p?{mineralPotential:nature.category(p.mineral),
      energyPotential:nature.category(p.energy)}:null;
  }
  window.HexategosGeology03830=Object.freeze({
    version:BUILD,generatorVersion:GENERATOR,
    deposit,hint,provinceEffect,qualityAt,
    kinds:()=>rawKinds.slice(),
    provinces:()=>PROVINCES.map(p=>({name:p.name,lat:p.lat,lon:p.lon,
      ry:p.ry,rx:p.rx,weights:{...p.weights}})),
    cacheSize:()=>cache.size,cacheLimit:CACHE_LIMIT
  });
})();
