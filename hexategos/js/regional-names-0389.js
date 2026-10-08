'use strict';
/* HEXATEGOS 0.38.9 · Toponimia geográfica para naciones, capitales y ciudades.
   En el mundo no hay un año histórico único: los nombres políticos se inspiran
   en regiones históricas, nunca afirman reproducir una frontera real. */
(() => {
  const VERSION='0.38.9',KEY='hexategos.regionalNames.0389';
  // Rectángulos culturales aproximados; las localidades concretas SIEMPRE
  // proceden del atlas geográfico con prueba exacta del hexágono.
  const REGIONS=[
    ['Cataluña',40.5,43,0.6,3.7,'Principado de Cataluña'],
    ['Aragón',40.2,42.9,-2.5,0.7,'Reino de Aragón'],
    ['Navarra',41.6,43.3,-2.5,-0.6,'Reino de Navarra'],
    ['Valencia',37.8,40.8,-1.7,0.7,'Reino de Valencia'],
    ['Galicia',41.5,44,-10,-6.5,'Reino de Galicia'],
    ['Portugal',36.7,42.4,-10,-6,'Reino de Portugal'],
    ['Andalucía occidental',35.5,38.8,-7.8,-4.0,'Reino de Sevilla'],
    ['Andalucía oriental',35.5,38.8,-4.0,-1.6,'Reino de Granada'],
    ['Castilla',38.4,43.4,-7.4,-1.8,'Reino de Castilla'],
    ['Escocia',54.3,59.5,-8.6,-1,'Reino de Escocia'],
    ['Gales',51.2,53.8,-5.6,-2.3,'Principado de Gales'],
    ['Inglaterra',50,55.6,-6.1,2.2,'Reino de Inglaterra'],
    ['Normandía',48.4,50.3,-2,1.9,'Ducado de Normandía'],
    ['Bretaña',47.2,48.9,-5.5,-1,'Ducado de Bretaña'],
    ['Aquitania',43,46.5,-2.1,2,'Ducado de Aquitania'],
    ['Borgoña',46.3,48.6,3,6.2,'Ducado de Borgoña'],
    ['Provenza',42.4,45.3,4.3,7.7,'Condado de Provenza'],
    ['Baviera',47.2,50.6,10,13.9,'Ducado de Baviera'],
    ['Sajonia',50.3,53.8,9.4,15.1,'Ducado de Sajonia'],
    ['Bohemia',48.4,51.2,12,18.9,'Reino de Bohemia'],
    ['Lombardía',44.8,46.7,8.1,11.5,'Ducado de Lombardía'],
    ['Venecia',44.4,46.3,11.5,13.6,'República de Venecia'],
    ['Toscana',42.4,44.5,9.6,12.6,'Gran Ducado de Toscana'],
    ['Sicilia',36.5,38.7,12,15.8,'Reino de Sicilia'],
    ['Epiro',38.2,41.5,19.2,21.5,'Despotado de Epiro'],
    ['Tracia',40.1,42.7,25,29.5,'Tracia'],
    ['Anatolia',35.7,42.5,26,44,'Anatolia'],
    ['Mesopotamia',29.5,37.5,38,49,'Mesopotamia'],
    ['Arabia',12,32.5,34,60,'Arabia'],
    ['Persia',24,41,44,63,'Persia'],
    ['Magreb',27,37.5,-10,12,'Magreb'],
    ['Egipto',21.5,32.3,24,37,'Egipto'],
    ['Sahel',10,19,-18,38,'Sahel'],
    ['Etiopía',3,15,33,48,'Etiopía'],
    ['India',7,34,68,89,'India'],
    ['Tíbet',26,37,78,101,'Tíbet'],
    ['China',18,53,100,135,'China'],
    ['Corea',33,43,124,132,'Corea'],
    ['Japón',30,46,129,146,'Japón'],
    ['Indochina',5,25,95,110,'Indochina'],
    ['Mesoamérica',8,23,-110,-86,'Mesoamérica'],
    ['Andes',-33,9,-82,-67,'Andes']
  ];
  const originalFactionName=factionName3230;
  const nations=new Map(),cities=new Map(),checked=new Set(),working=new Set();
  let cityCursor=null,capCursor=0,lastCampaign=-1e9,generation=0;
  let searches=0,applied=0,failures=0;
  function geo(cell){
    if(!Number.isInteger(cell)||cell<0||cell>=owner6.length)return null;
    try{const p=cellLonLat3302(cell);return Number.isFinite(p?.lat)&&Number.isFinite(p?.lon)?p:null}
    catch(_){return null}
  }
  function regionOf(cell){
    const pos=geo(cell);if(!pos)return null;
    const {lat,lon}=pos;
    for(const [region,minLat,maxLat,minLon,maxLon,polity] of REGIONS)
      if(lat>=minLat&&lat<=maxLat&&lon>=minLon&&lon<=maxLon)return {region,polity,lat,lon};
    const culture=lat>34&&lon>=-12&&lon<=42?'europe':
      lat>-37&&lat<39&&lon>=-18&&lon<=52?'africa':
      lat>=12&&lon>=34&&lon<63?'arabia':
      lon>=42&&lon<=180&&lat>=-5?'asia':
      lon>=-170&&lon<=-34?'america':
      lon>=108&&lat<0?'oceania':'other';
    return {region:'',polity:'',lat,lon,culture};
  }
  function politicalName(place,location,f){
    if(location?.polity){
      if(location.region==='Cataluña'&&/^Barcelona$/i.test(place||''))return 'Condado de Barcelona';
      // Evitar repetir una entidad histórica idéntica en 500 naciones.
      const used=[...nations.entries()].some(([id,value])=>id!==f&&value.name===location.polity);
      if(!used)return location.polity;
    }
    if(!place){
      // Fallback geográfico deliberadamente neutro, hasta conocer la capital.
      const r=location?.region||'territorio';
      return 'Estado de '+r+' '+(f+1);
    }
    const c=location?.culture||(location?.region?'europe':'other');
    const prefix=c==='europe'?'Principado de ':c==='arabia'?'Emirato de ':
      c==='asia'?'Estado de ':c==='africa'?'Confederación de ':
      c==='america'?'Confederación de ':c==='oceania'?'Estado de ':'Estado de ';
    const name=prefix+place;
    if(![...nations.entries()].some(([id,v])=>id!==f&&v.name===name))return name;
    return 'Liga de '+place+' '+(f+1);
  }
  function tryApplyCity(cell,name,f){
    if(!name||!Number.isInteger(cell)||owner6[cell]!==f)return false;
    const previous=cities.get(cell);
    if(previous===name)return true;
    // Jamás sobrescribir ciudades personalizadas del jugador, excepto su capital
    // con un nombre geográficamente incorrecto como Madrid en Barcelona.
    if(f===0&&cell!==capitals?.[0])return false;
    const display=typeof cityDisplayName3271==='function'?cityDisplayName3271(cell):'';
    const isWrongCapital=f===0&&cell===capitals?.[0]&&
      (/(^|\b)(Madrid|capital)(\b|$)/i.test(display)||!display);
    if(f===0&&!isWrongCapital&&display&&display!==name)return false;
    if(typeof setCityName3271!=='function')return false;
    const clean=typeof cleanCityName3271==='function'?cleanCityName3271(name):name;
    setCityName3271(cell,clean);
    cities.set(cell,clean);applied++;
    return true;
  }
  function ensureNation(f){
    if(f<=0||f>=activeFactionCount3230)return null;
    const cell=capitals?.[f]??-1;
    if(!Number.isInteger(cell)||cell<0||owner6[cell]!==f)return null;
    const old=nations.get(f);
    if(old?.capital===cell)return old;
    const location=regionOf(cell);
    if(!location)return null;
    const name=politicalName('',location,f);
    const record={capital:cell,name,atlas:false};
    nations.set(f,record);
    return record;
  }
  factionName3230=function(f){
    f=Number(f);
    if(!Number.isInteger(f)||f<=0||!started3230)return originalFactionName.apply(this,arguments);
    const record=ensureNation(f);
    return record?.name||originalFactionName.apply(this,arguments);
  };
  async function nameCell(cell,f,isCapital){
    const marker=(isCapital?'c':'t')+':'+cell+':'+f;
    if(working.has(marker)||checked.has(marker))return;
    working.add(marker);
    const before=capitals?.[f],epoch=generation;
    try{
      const atlas=window.HexategosRealCities0354;
      if(!atlas?.suggest)return;
      searches++;
      const result=await atlas.suggest(cell);
      if(epoch!==generation||!started3230||owner6[cell]!==f||(isCapital&&capitals?.[f]!==before))return;
      checked.add(marker);
      // Exacta: dentro del hexágono. Cercana: solo cuando está realmente próxima.
      const option=result?.options?.[0];
      if(!option?.name)return;
      const exact=result.kind==='exact';
      if(!exact&&(!Number.isFinite(option.distanceKm)||option.distanceKm>35))return;
      if(isCapital&&f>0){
        const location=regionOf(cell);
        const record={capital:cell,name:politicalName(option.name,location,f),atlas:true};
        nations.set(f,record);
      }
      tryApplyCity(cell,option.name,f);
      checked.add(marker);
    }catch(err){failures++;console.warn('[Hexategos topónimos]',err?.message||err)}
    finally{working.delete(marker)}
  }
  function service(){
    if(!started3230||paused3230||!owner6?.length)return;
    const time=Number(campaignSeconds3230)||0;
    if(time-lastCampaign<2.5||working.size>=2)return;
    lastCampaign=time;
    // 500 naciones sin barrido masivo: una capital por ronda.
    if(capCursor<activeFactionCount3230){
      const f=capCursor++,cell=capitals?.[f]??-1;
      if(f>0)ensureNation(f);
      if(Number.isInteger(cell)&&cell>=0&&owner6[cell]===f)void nameCell(cell,f,true);
      return;
    }
    // Ciudades de IA: un paso de iterador por ronda, sin array de todas las ciudades.
    if(!cityCursor)cityCursor=cities3212.values();
    let item=cityCursor.next();
    if(item.done){cityCursor=cities3212.values();item=cityCursor.next()}
    if(item.done)return;
    const cell=item.value,f=owner6[cell];
    if(Number.isInteger(f)&&f>0&&f<activeFactionCount3230)void nameCell(cell,f,false);
  }
  function serialize(){
    return {v:1,nations:[...nations].map(([f,n])=>[f,n]),cities:[...cities],checked:[...checked]};
  }
  function restore(s){
    nations.clear();cities.clear();checked.clear();working.clear();generation++;
    capCursor=0;cityCursor=null;lastCampaign=-1e9;
    if(!s||!Array.isArray(s.nations))return;
    for(const [f,r] of s.nations.slice(0,FACTIONS3230.length))
      if(Number.isInteger(f)&&f>0&&r?.capital===capitals?.[f]&&owner6[r.capital]===f)
        nations.set(f,{capital:r.capital,name:String(r.name||''),atlas:!!r.atlas});
    if(Array.isArray(s.cities))for(const [cell,name] of s.cities.slice(0,6000)){
      if(Number.isInteger(cell)&&owner6[cell]>=0&&typeof setCityName3271==='function'){
        setCityName3271(cell,name);cities.set(cell,name);
      }
    }
    if(Array.isArray(s.checked))for(const k of s.checked.slice(0,6000))checked.add(String(k));
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(serialize()))}catch(_){}}
  const originalSave=saveGame3212;
  saveGame3212=function(){const out=originalSave.apply(this,arguments);save();return out};
  const originalLoad=loadGame3212;
  loadGame3212=function(){const out=originalLoad.apply(this,arguments);
    try{restore(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){restore(null)}
    return out};
  const originalReset=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=originalReset.apply(this,arguments);restore(null);
    if(clearSave)try{localStorage.removeItem(KEY)}catch(_){}
    return out;
  };
  if(typeof buildPortableFile3275==='function'){
    const base=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=base.apply(this,arguments);
      if(file?.payload){file.payload.regionalNames0389=serialize();
        if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload))}
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const base=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const data=file?.payload?.regionalNames0389||null;
      const out=base.apply(this,arguments);restore(data);save();return out;
    };
  }
  // Sin timers nuevos: comparte el tick económico existente.
  const baseEconomy=economyTick3212;
  economyTick3212=function(){
    const out=baseEconomy.apply(this,arguments);
    service();return out;
  };
  window.HexategosRegionalNames0389={
    version:VERSION,regionOf,service,serialize,ensureNation,
    stats:()=>({namedNations:nations.size,namedCities:cities.size,atlasQueries:searches,failures,inFlight:working.size})
  };
  console.info('[HEXATEGOS] '+VERSION+' · naciones históricas y localidades georreferenciadas');
})();
