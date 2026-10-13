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
  const pendingCities=[],queuedCities=new Set();
  // Topónimo permanente y nombre administrativo: jamás alterar geografía.
  const cityIdentity=new Map(),nationCultures=new Map();
  let playerCulture='';
  const historicalVariants={
    'Córdoba':{arabic:'Qurtuba'},'Zaragoza':{arabic:'Saraqusta'},
    'Sevilla':{arabic:'Isbiliya'},'Toledo':{arabic:'Tulaytula'},
    'Granada':{arabic:'Garnata'},'Mérida':{arabic:'Marida'},
    'Lérida':{catalan:'Lleida',arabic:'Larida'},'Lleida':{castilian:'Lérida',arabic:'Larida'},
    'Gerona':{catalan:'Girona'},'Girona':{castilian:'Gerona'},
    'Alicante':{catalan:'Alacant'},'Alacant':{castilian:'Alicante'},
    'Castellón de la Plana':{catalan:'Castelló de la Plana'},
    'Ibiza':{catalan:'Eivissa'},'Eivissa':{castilian:'Ibiza'}
  };
  const CULTURES=['castilian','catalan','arabic','other'];
  const CULTURE_LABELS={castilian:'Castellana',catalan:'Catalana/valenciana',arabic:'Árabe/andalusí',other:'Otra / sin equivalencia'};
  // La identidad cultural se fija en el origen de la nación y se guarda:
  // conquistar una capital extranjera no cambia su cultura.
  function nationCulture(f){
    if(f===0&&playerCulture)return playerCulture;
    if(nationCultures.has(f))return nationCultures.get(f);
    const capital=capitals?.[f],loc=Number.isInteger(capital)?regionOf(capital):null;
    const n=String(originalFactionName(f)||'').toLocaleLowerCase('es');
    let culture='other';
    if(/catalu|català|catalan|barcelona|valenciano|balear/.test(n))culture='catalan';
    else if(/emirat|califat|sultan|árab|arabe|andalus|magreb|marroqu/.test(n))culture='arabic';
    else if(/castilla|castellan|españa|le[oó]n/.test(n))culture='castilian';
    else if(['Cataluña','Valencia'].includes(loc?.region))culture='catalan';
    else if(['Magreb','Arabia'].includes(loc?.region))culture='arabic';
    else if(['Castilla','Andalucía occidental','Andalucía oriental'].includes(loc?.region))culture='castilian';
    nationCultures.set(f,culture);
    return culture;
  }
  function setPlayerCulture(value){
    if(!CULTURES.includes(value))return false;
    playerCulture=value;nationCultures.set(0,value);save();return true;
  }
  function cultureDialog(){
    const options='castilian = Castellana; catalan = Catalana/valenciana; arabic = Árabe/andalusí; other = Otra.';
    const selection=window.prompt('Cultura administrativa de tu nación: '+options,nationCulture(0));
    if(selection!==null&&!setPlayerCulture(String(selection).trim().toLowerCase()))
      window.alert('Cultura no reconocida. Usa castilian, catalan, arabic u other.');
  }
  function cityRecord(cell,base){
    let rec=cityIdentity.get(cell);
    if(!rec){
      const official=typeof cityDisplayName3271==='function'?cityDisplayName3271(cell):base;
      rec={geo:String(base||official||''),geoSource:base?'atlas':'legacy',
        name:String(official||base||''),history:[],owner:owner6[cell],pending:null,manual:false};
      cityIdentity.set(cell,rec);
    }
    if(base&&!rec.geo)rec.geo=String(base);
    return rec;
  }
  function applyCityOfficial(cell,rec,next,reason){
    if(!next||next===rec.name)return;
    if(rec.name&&rec.name!==rec.history[rec.history.length-1])rec.history.push(rec.name);
    rec.history=rec.history.slice(-12);
    rec.name=next;rec.pending=null;rec.reason=reason;
    if(typeof setCityName3271==='function')setCityName3271(cell,next);
  }
  function inspectCityIdentity(cell,geoName){
    if(!cities3212.has(cell)||owner6[cell]<0)return null;
    const rec=cityRecord(cell,geoName);
    const now=Number(campaignSeconds3230)||0,owner=owner6[cell];
    // El nombre pudo establecerse después de la fundación: no tratar el
    // nombre provisional de la nueva ciudad como el nombre oficial definitivo.
    if(!rec.manual&&!rec.pending&&!rec.history?.length){
      const current=typeof cityDisplayName3271==='function'?cityDisplayName3271(cell):'';
      if(current)rec.name=String(current);
    }
    if(rec.owner!==owner){
      rec.owner=owner;rec.pending=null;
      // Una decisión manual se respeta mientras dura el mandato del jugador,
      // pero no bloquea para siempre las decisiones de futuros conquistadores.
      rec.manual=false;
      const target=historicalVariants[rec.geo]?.[nationCulture(owner)]||rec.geo;
      if(target&&target!==rec.name&&rec.geoSource==='atlas')
        rec.pending={name:target,since:now,reason:'adaptación cultural tras conquista'};
    }
    if(rec.pending&&now-rec.pending.since>=90)
      applyCityOfficial(cell,rec,rec.pending.name,rec.pending.reason);
    return rec;
  }

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
  function broadRegion(location){
    const lat=location?.lat??0,lon=location?.lon??0;
    if(lat>58&&lon<-55&&lon>-170)return 'Canadá septentrional';
    if(lat>=28&&lon<-65&&lon>-125)return lon<-105?'Grandes Llanuras':lon<-90?'Misisipi':'Apalaches';
    if(lat<12&&lat>-34&&lon<-33&&lon>-83)return lon<-70?'Cordillera de los Andes':lon<-56?'Amazonia':'Brasil atlántico';
    if(lat<=-34&&lon>-76&&lon<-48)return 'Patagonia';
    if(lat>15&&lat<35&&lon>-18&&lon<36)return lat>25?'Sáhara':'Sahel';
    if(lat>-5&&lat<=15&&lon>-18&&lon<31)return 'Guinea';
    if(lat>-8&&lat<5&&lon>10&&lon<33)return 'Cuenca del Congo';
    if(lat<-8&&lon>10&&lon<41)return lat<-27?'África austral':'África oriental';
    if(lat>45&&lon>39&&lon<91)return lat>60?'Siberia':'Estepa euroasiática';
    if(lat>42&&lon>=91&&lon<135)return 'Mongolia';
    if(lat>12&&lat<40&&lon>=60&&lon<100)return 'Asia meridional';
    if(lat>=-12&&lat<18&&lon>=98&&lon<150)return 'Archipiélago malayo';
    if(lat<0&&lon>110&&lon<156)return lon<130?'Australia occidental':'Australia oriental';
    if(lat<0&&lon>=156)return 'Melanesia';
    if(lat>35&&lon>-12&&lon<42)return 'Europa continental';
    if(lat>18&&lon>=39&&lon<60)return 'Oriente Próximo';
    return location?.culture==='asia'?'Asia oriental':
      location?.culture==='africa'?'África central':
      location?.culture==='america'?'América':location?.culture==='oceania'?'Oceanía':'región continental';
  }
  function politicalName(place,location,f){
    if(location?.polity){
      if(location.region==='Cataluña'&&/^Barcelona$/i.test(place||''))return 'Condado de Barcelona';
      // Evitar repetir una entidad histórica idéntica en 500 naciones.
      const used=[...nations.entries()].some(([id,value])=>id!==f&&value.name===location.polity);
      if(!used)return location.polity;
    }
    if(!place){
      // Topónimo macroregional provisional, sustituido por el de la capital
      // real cuando el atlas comprueba su situación dentro del hexágono.
      const region=location?.region||broadRegion(location),c=location?.culture||'other';
      const prefix=c==='europe'?'Principado de ':c==='arabia'?'Emirato de ':
        c==='africa'?'Confederación de ':c==='america'?'Confederación de ':'Estado de ';
      const base=prefix+region;
      const siblings=[...nations.values()].filter(n=>n.name===base||n.name.startsWith(base+' ·')).length;
      return siblings?base+' · '+(siblings+1):base;
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
    // No sobrescribir una ciudad con identidad administrativa ya consolidada.
    const identity=cityIdentity.get(cell);
    if(identity&&(identity.manual||identity.pending||identity.history?.length))return false;
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
  const originalPlayerName=()=>String(originalFactionName.call(null,0)||'Mi nación');
  let playerName='',playerHistory=[];
  const changes=[];
  function historyAdd(record,oldName){
    record.history ||= [];
    if(oldName&&!record.history.includes(oldName))record.history.push(oldName);
    if(record.history.length>12)record.history.shift();
  }
  // Una sustitución política no es instantánea. Se conserva su identidad
  // durante un periodo y el nombre previo permanece en el registro histórico.
  function proposeName(f,next,reason){
    const record=nations.get(f);
    if(!record||!next||next===record.name||next===record.pending?.name)return false;
    record.pending={name:next,since:Number(campaignSeconds3230)||0,reason};
    return true;
  }
  function advanceName(f){
    const rec=nations.get(f),pending=rec?.pending;
    if(!pending)return;
    if((Number(campaignSeconds3230)||0)-pending.since<90)return;
    historyAdd(rec,rec.name);
    changes.push({f,from:rec.name,to:pending.name,reason:pending.reason,at:campaignSeconds3230||0});
    if(changes.length>150)changes.shift();
    rec.name=pending.name;rec.pending=null;
  }
  function nationCount(f){
    const v=aiSnapshot3260?.territory?.[f];
    return Number.isFinite(v)?v:null;
  }
  function ensureNation(f){
    if(f<=0||f>=activeFactionCount3230)return null;
    const cell=capitals?.[f]??-1;
    const old=nations.get(f);
    if(!Number.isInteger(cell)||cell<0||owner6[cell]!==f)return old||null;
    if(old){
      // Una capital que cambia no borra la identidad anterior.
      if(old.capital!==cell){
        const oldRegion=regionOf(old.capital),newRegion=regionOf(cell);
        old.capital=cell;old.atlas=false;
        // No renombrar por un traslado corto dentro del mismo ámbito.
        if(newRegion && (newRegion.region||broadRegion(newRegion))!==(oldRegion?.region||broadRegion(oldRegion)))
          proposeName(f,politicalName('',newRegion,f),'cambio de capital y región política');
      }
      advanceName(f);
      return old;
    }
    const location=regionOf(cell);
    if(!location)return null;
    const record={capital:cell,name:politicalName('',location,f),atlas:false,history:[],pending:null,baseline:nationCount(f)};
    nations.set(f,record);
    return record;
  }
  function serviceNationalIdentity(f){
    const record=ensureNation(f);
    if(!record)return;
    const count=nationCount(f);
    if(count===null||count<=0)return;
    if(!Number.isFinite(record.baseline)||record.baseline<=0)record.baseline=count;
    // Pérdidas mínimas de frontera nunca desencadenan renombrados.
    // Las pérdidas pronunciadas sólo permiten proponer un nombre nuevo,
    // manteniendo la identidad actual durante la transición.
    // La pérdida territorial por sí sola no legitima otro nombre.
    // Sólo la reubicación de la capital o una nueva capital identificada
    // geográficamente pueden iniciar una transición de identidad.
    if(count>record.baseline)record.baseline=count;
  }
  factionName3230=function(f){
    f=Number(f);
    if(!Number.isInteger(f))return originalFactionName.apply(this,arguments);
    if(f===0)return playerName||originalFactionName.apply(this,arguments);
    if(!started3230)return originalFactionName.apply(this,arguments);
    const record=ensureNation(f);
    return record?.name||originalFactionName.apply(this,arguments);
  };
  function renamePlayer(name){
    const clean=String(name||'').trim().replace(/\\s+/g,' ').slice(0,64);
    if(clean.length<3)return false;
    const before=playerName||originalPlayerName();
    if(before!==clean&&!playerHistory.includes(before))playerHistory.push(before);
    playerHistory=playerHistory.slice(-12);
    playerName=clean;save();
    if(typeof updateUI3230==='function')updateUI3230();
    return true;
  }
  function renameDialog(){
    const proposal=window.prompt('Nuevo nombre de tu nación (3–64 caracteres):',factionName3230(0));
    if(proposal!==null&&!renamePlayer(proposal))window.alert('Introduce un nombre de entre 3 y 64 caracteres.');
  }
  async function nameCell(cell,f,isCapital){
    const marker=(isCapital?'c':'t')+':'+cell+':'+f;
    const epoch=generation,job=epoch+':'+marker;
    if(working.has(job)||checked.has(marker))return;
    working.add(job);
    const before=capitals?.[f];
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
        const record=ensureNation(f);
        if(record){
          const target=politicalName(option.name,location,f);
          if(!record.atlas && target!==record.name)proposeName(f,target,'identificación geográfica');
          record.atlas=true;
        }
      }
      tryApplyCity(cell,option.name,f);
      if(cities3212.has(cell)){
        const rec=cityRecord(cell,exact?option.name:null);
        if(exact){rec.geo=option.name;rec.geoSource='atlas'}
        // Una ciudad cercana no es necesariamente la ubicación del hexágono.
        inspectCityIdentity(cell,exact?option.name:null);
      }
      checked.add(marker);
    }catch(err){failures++;console.warn('[Hexategos topónimos]',err?.message||err)}
    finally{working.delete(job)}
  }
  function service(){
    if(!started3230||paused3230||!owner6?.length)return;
    const time=Number(campaignSeconds3230)||0;
    if(time-lastCampaign<1.5)return;
    lastCampaign=time;
    // El seguimiento de ciudades no puede quedar bloqueado por las búsquedas
    // de topónimos de las 500 capitales. Revisión incremental acotada.
    if(!cityCursor)cityCursor=cities3212.values();
    for(let j=0;j<12;j++){
      let entry=cityCursor.next();
      if(entry.done){cityCursor=cities3212.values();entry=cityCursor.next()}
      if(entry.done)break;
      const cell=entry.value,f=owner6[cell];
      if(f<0||f>=activeFactionCount3230)continue;
      const rec=inspectCityIdentity(cell);
      if(rec?.geoSource!=='atlas'&&working.size<2&&!checked.has('t:'+cell+':'+f))
        void nameCell(cell,f,false);
    }
    // Priorizar ciudades que la IA acaba de construir sin buscar en el mapa.
    if(pendingCities.length&&(capCursor>=activeFactionCount3230||Math.floor(time)%3===0)){
      const cell=pendingCities.shift();queuedCities.delete(cell);
      const f=owner6[cell];
      if(f>=0&&f<activeFactionCount3230&&cities3212.has(cell)&&working.size<2)void nameCell(cell,f,false);
      return;
    }
    // 500 naciones sin barrido masivo: una capital por ronda.
    if(capCursor<activeFactionCount3230&&working.size<2){
      const f=capCursor++,cell=capitals?.[f]??-1;
      if(f>0){serviceNationalIdentity(f);nationCulture(f)}
      if(Number.isInteger(cell)&&cell>=0&&owner6[cell]===f)void nameCell(cell,f,true);
    }
  }
  function serialize(){
    return {v:3,nations:[...nations].map(([f,n])=>[f,n]),cities:[...cities],checked:[...checked],playerName,playerHistory,changes:changes.slice(-150),cityIdentity:[...cityIdentity],playerCulture,nationCultures:[...nationCultures]};
  }
  function restore(s){
    nations.clear();cities.clear();cityIdentity.clear();nationCultures.clear();checked.clear();working.clear();generation++;playerName='';playerHistory=[];playerCulture='';changes.length=0;
    pendingCities.length=0;queuedCities.clear();
    capCursor=0;cityCursor=null;lastCampaign=-1e9;
    if(!s||!Array.isArray(s.nations))return;
    playerName=String(s.playerName||'').slice(0,64);
    playerCulture=CULTURES.includes(s.playerCulture)?s.playerCulture:'';
    if(Array.isArray(s.nationCultures))for(const [f,c] of s.nationCultures){
      if(Number.isInteger(f)&&f>=0&&f<FACTIONS3230.length&&CULTURES.includes(c))nationCultures.set(f,c)
    }
    playerHistory=Array.isArray(s.playerHistory)?s.playerHistory.slice(-12).map(String):[];
    if(Array.isArray(s.changes))changes.push(...s.changes.slice(-150));
    for(const [f,r] of s.nations.slice(0,FACTIONS3230.length))
      if(Number.isInteger(f)&&f>0&&f<activeFactionCount3230&&r&&typeof r.name==='string')
        // Si cambió la capital entre guardado y carga, conservar toda la
        // historia y dejar que ensureNation procese la mudanza.
        nations.set(f,{capital:r.capital,name:String(r.name||'').slice(0,100),atlas:!!r.atlas,history:Array.isArray(r.history)?r.history.slice(-12):[],pending:r.pending||null,baseline:Number(r.baseline)||nationCount(f)});
    if(Array.isArray(s.cities))for(const [cell,name] of s.cities.slice(0,6000)){
      if(Number.isInteger(cell)&&owner6[cell]>=0&&typeof setCityName3271==='function'){
        setCityName3271(cell,name);cities.set(cell,name);
      }
    }
    if(Array.isArray(s.checked))for(const k of s.checked.slice(0,6000))checked.add(String(k));
    if(Array.isArray(s.cityIdentity))for(const [cell,rec] of s.cityIdentity.slice(0,6000)){
      if(Number.isInteger(cell)&&cities3212.has(cell)&&rec?.geo){cityIdentity.set(cell,rec);
        // Las partidas v2 carecían de certificación geográfica.
        if(!rec.geoSource)rec.geoSource='legacy';
        if(rec.geoSource!=='atlas'){
          // Revisar topónimo sin invalidar las decisiones manuales.
          checked.delete('t:'+cell+':'+owner6[cell]);
          checked.delete('c:'+cell+':'+owner6[cell]);
        }
        if(rec.name&&typeof setCityName3271==='function')setCityName3271(cell,rec.name)}
    }
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
  // Captura O(1) de nuevas ciudades de las IA, sin recuentos ni barridos.
  const baseCityAdd=cities3212.add;
  cities3212.add=function(cell){
    const existed=this.has(cell),out=baseCityAdd.call(this,cell);
    if(!existed&&started3230&&owner6[cell]>=0){
      cityRecord(cell);
      if(!queuedCities.has(cell)){pendingCities.push(cell);queuedCities.add(cell)}
    }
    return out;
  };
  // Sin timers nuevos: comparte el tick económico existente.
  const baseEconomy=economyTick3212;
  economyTick3212=function(){
    const out=baseEconomy.apply(this,arguments);
    service();return out;
  };
  // Acceso del jugador independiente de los diálogos, sin tapar el HUD.
  const renameButton=document.createElement('button');
  renameButton.textContent='Renombrar nación';
  renameButton.title='Cambiar nombre político de tu nación';
  renameButton.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99990;background:#193a53;color:#fff;border:1px solid #84a1ba;border-radius:8px;padding:8px;cursor:pointer;font:12px system-ui';
  renameButton.addEventListener('click',renameDialog);
  document.body.append(renameButton);
  // Consulta permanente de nombres anteriores, también tras importación.
  const historyButton=document.createElement('button');
  historyButton.textContent='Historia de nombres';
  historyButton.title='Nombre actual y denominaciones anteriores de cada nación';
  historyButton.style.cssText='position:fixed;right:12px;bottom:48px;z-index:99990;background:#193a53;color:#fff;border:1px solid #84a1ba;border-radius:8px;padding:8px;cursor:pointer;font:12px system-ui';
  historyButton.addEventListener('click',()=>{
    const raw=window.prompt('Número de nación (0–'+Math.max(0,activeFactionCount3230-1)+'):', '0');
    if(raw===null)return;
    const f=Number(raw);
    if(!Number.isInteger(f)||f<0||f>=activeFactionCount3230)return;
    const id=f===0?{history:playerHistory,pending:null}:ensureNation(f);
    const prior=id?.history?.length?id.history.join(' → '):'Sin nombres anteriores registrados';
    window.alert('Nación '+f+'\\nNombre actual: '+factionName3230(f)+
      '\\nNombre anterior / historial: '+prior+
      (id?.pending?'\\nCambio gradual pendiente hacia: '+id.pending.name:''));
  });
  document.body.append(historyButton);
  const cultureButton=document.createElement('button');
  cultureButton.textContent='Cultura nacional';
  cultureButton.title='Fijar la tradición toponímica de tu nación';
  cultureButton.style.cssText='position:fixed;right:12px;bottom:120px;z-index:99990;background:#193a53;color:#fff;border:1px solid #84a1ba;border-radius:8px;padding:8px;cursor:pointer;font:12px system-ui';
  cultureButton.onclick=cultureDialog;
  document.body.append(cultureButton);
  const cityButton=document.createElement('button');
  cityButton.textContent='Renombrar ciudad';
  cityButton.style.cssText='position:fixed;right:12px;bottom:84px;z-index:99990;background:#193a53;color:#fff;border:1px solid #84a1ba;border-radius:8px;padding:8px;cursor:pointer;font:12px system-ui';
  cityButton.onclick=()=>{
    const cell=selected?.key===MAX_GAME_LEVEL3233?selected.i:-1;
    if(!Number.isInteger(cell)||!cities3212.has(cell)||owner6[cell]!==0){
      window.alert('Selecciona una ciudad de tu nación en el mapa.');return;
    }
    const rec=inspectCityIdentity(cell);
    const name=window.prompt('Nombre oficial (geográfico: '+(rec?.geo||'desconocido')+'):',rec?.name||'');
    if(name!==null&&window.HexategosRegionalNames0389?.renameCity(cell,name)){
      if(typeof updateUI3230==='function')updateUI3230();
      needsRender=true;
    }
  };
  document.body.append(cityButton);
  window.HexategosRegionalNames0389={
    version:VERSION,regionOf,service,serialize,ensureNation,renamePlayer,renameDialog,
    nationCulture,setPlayerCulture,cultureDialog,cultureLabels:CULTURE_LABELS,
    cityIdentity:cell=>inspectCityIdentity(Number(cell)),
    renameCity:(cell,name)=>{cell=Number(cell);if(!cities3212.has(cell)||owner6[cell]!==0)return false;
      const clean=String(name||'').trim().slice(0,64);if(clean.length<2)return false;
      const rec=cityRecord(cell);rec.manual=true;applyCityOfficial(cell,rec,clean,'decisión del jugador');save();return true},
    identity:f=>Number(f)===0?{name:factionName3230(0),history:playerHistory.slice()}:ensureNation(Number(f)),
    stats:()=>({namedNations:nations.size,namedCities:cities.size,atlasQueries:searches,failures,inFlight:working.size})
  };
  console.info('[HEXATEGOS] '+VERSION+' · naciones históricas y localidades georreferenciadas');
})();
