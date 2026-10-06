'use strict';

// HEXATEGOS 0.35.4 · navegación de clasificación + atlas de localidades reales.
// Atlas: snapshot cities1000 basado en GeoNames, indexado por longitud y teselas de 1°.
// La búsqueda exacta comprueba si la coordenada real cae dentro del polígono esférico
// del hexágono/pentágono de la malla de juego.
(() => {
  const BUILD='0.35.4';
  const DATA_ROOT='data/cities-0354/';
  const BAND_DEG=30;
  const BAND_COUNT=12;
  const bandCache=new Map();
  let cityMetaPromise0355=null;
  let pplxExclusions0355=new Set();
  let historicalNames0355=Object.create(null);
  let cityProposalState0354=null;
  let cityBuildBypass0354=false;

  function escape0354(v){
    return String(v??'').replace(/[&<>"']/g,c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function wrapLon0354(lon){
    lon=Number(lon)||0;
    while(lon<-180)lon+=360;
    while(lon>=180)lon-=360;
    return lon;
  }

  function bandForLon0354(lon){
    lon=wrapLon0354(lon);
    return Math.max(0,Math.min(BAND_COUNT-1,Math.floor((lon+180)/BAND_DEG)));
  }

  async function loadBand0354(band){
    band=((band%BAND_COUNT)+BAND_COUNT)%BAND_COUNT;
    if(bandCache.has(band))return bandCache.get(band);
    const p=fetch(DATA_ROOT+'band-'+String(band).padStart(2,'0')+'.json',{cache:'force-cache'})
      .then(r=>{
        if(!r.ok)throw Error('HTTP '+r.status);
        return r.json();
      })
      .catch(err=>{
        bandCache.delete(band);
        throw err;
      });
    bandCache.set(band,p);
    return p;
  }

  function tileLon0354(x){
    while(x<-180)x+=360;
    while(x>=180)x-=360;
    return x;
  }

  function rowKey0355(row){
    return String(row?.[0]??'')+'\u0001'+Number(row?.[1])+'\u0001'+Number(row?.[2])+'\u0001'+String(row?.[4]??'');
  }

  function exclusionKey0355(row){
    return String(row?.[0]??'')+'\u0001'+Number(row?.[1])+'\u0001'+Number(row?.[2])+'\u0001'+String(row?.[3]??'');
  }

  async function loadCityMeta0355(){
    if(cityMetaPromise0355)return cityMetaPromise0355;
    cityMetaPromise0355=Promise.all([
      fetch(DATA_ROOT+'pplx-exclusions.json',{cache:'force-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(DATA_ROOT+'historical-names.json',{cache:'force-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
    ]).then(([excluded,history])=>{
      const rows=excluded?.rows||[];
      pplxExclusions0355=new Set(rows.map(exclusionKey0355));
      historicalNames0355=history?.records||Object.create(null);
      return {
        excluded:pplxExclusions0355.size,
        historical:Object.keys(historicalNames0355).length
      };
    });
    return cityMetaPromise0355;
  }

  function validSettlementRow0355(row){
    return !pplxExclusions0355.has(rowKey0355(row));
  }

  function historicalNamesFor0355(country,name){
    return historicalNames0355[String(country||'')+'|'+String(name||'')]||[];
  }

  async function tileCities0354(latTile,lonTile){
    if(latTile<-90||latTile>89)return [];
    lonTile=tileLon0354(lonTile);
    const band=bandForLon0354(lonTile+.5);
    const data=await loadBand0354(band);
    return data.tiles?.[latTile+','+lonTile]||[];
  }

  function dot0354(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
  function cross0354(a,b){
    return [
      a[1]*b[2]-a[2]*b[1],
      a[2]*b[0]-a[0]*b[2],
      a[0]*b[1]-a[1]*b[0]
    ];
  }

  function pointInsideCell0354(cell,lat,lon){
    const L=loadLevel(MAX_GAME_LEVEL3233);
    if(cell<0||cell>=L.n)return false;
    const p=lonLatVec(lon,lat);
    const ci=cell*3,c=[
      L.centers[ci]/32767,
      L.centers[ci+1]/32767,
      L.centers[ci+2]/32767
    ];
    const s=L.offsets[cell],e=L.offsets[cell+1],count=e-s;
    if(count<3)return false;
    for(let k=0;k<count;k++){
      const fa=L.adj[s+k],fb=L.adj[s+((k+1)%count)];
      const ia=fa*3,ib=fb*3;
      const a=[L.faceCenters[ia]/32767,L.faceCenters[ia+1]/32767,L.faceCenters[ia+2]/32767];
      const b=[L.faceCenters[ib]/32767,L.faceCenters[ib+1]/32767,L.faceCenters[ib+2]/32767];
      const n=cross0354(a,b);
      const dc=dot0354(n,c),dp=dot0354(n,p);
      if(Math.abs(dc)>1e-9&&dc*dp<-2e-7)return false;
    }
    return true;
  }

  function distanceKm0354(lat1,lon1,lat2,lon2){
    const r=Math.PI/180;
    const a1=lat1*r,a2=lat2*r,dlat=(lat2-lat1)*r,dlon=wrapLon0354(lon2-lon1)*r;
    const h=Math.sin(dlat/2)**2+Math.cos(a1)*Math.cos(a2)*Math.sin(dlon/2)**2;
    return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));
  }

  async function collectTiles0354(lat,lon,latRadiusDeg){
    const cos=Math.max(.10,Math.cos(lat*Math.PI/180));
    const lonRadius=Math.min(42,latRadiusDeg/cos);
    const lat0=Math.max(-90,Math.floor(lat-latRadiusDeg));
    const lat1=Math.min(89,Math.floor(lat+latRadiusDeg));
    const lon0=Math.floor(lon-lonRadius),lon1=Math.floor(lon+lonRadius);
    const jobs=[];
    for(let y=lat0;y<=lat1;y++){
      for(let x=lon0;x<=lon1;x++)jobs.push(tileCities0354(y,x));
    }
    const arrays=await Promise.all(jobs);
    return arrays.flat();
  }

  function cityObject0354(row,lat,lon){
    const country=row[4]||'',name=row[0];
    return {
      name,
      lat:Number(row[1]),
      lon:Number(row[2]),
      population:Number(row[3])||0,
      country,
      historicalNames:historicalNamesFor0355(country,name),
      distanceKm:distanceKm0354(lat,lon,Number(row[1]),Number(row[2]))
    };
  }

  async function suggestForCell0354(cell){
    await loadCityMeta0355();
    const {lat,lon}=cellLonLat3302(cell);
    // The geodesic cells are small, but longitude width grows near the poles.
    const localRows=await collectTiles0354(lat,lon,.9);
    const exact=[];
    const seen=new Set();
    for(const row of localRows){
      if(!validSettlementRow0355(row))continue;
      const key=row[0]+'|'+row[1]+'|'+row[2];
      if(seen.has(key))continue;
      seen.add(key);
      if(pointInsideCell0354(cell,Number(row[1]),Number(row[2])))
        exact.push(cityObject0354(row,lat,lon));
    }
    exact.sort((a,b)=>b.population-a.population||a.distanceKm-b.distanceKm);
    if(exact.length){
      return {cell,lat,lon,kind:'exact',options:exact.slice(0,6)};
    }

    // Progressive nearby search. This remains geographically honest: it is
    // labelled as nearby rather than pretending the city lies in the cell.
    let nearby=[];
    for(const radius of [2,4,8,14]){
      const rows=await collectTiles0354(lat,lon,radius);
      const uniq=new Map();
      for(const row of rows){
        if(!validSettlementRow0355(row))continue;
        const c=cityObject0354(row,lat,lon);
        const k=row[0]+'|'+row[1]+'|'+row[2];
        const old=uniq.get(k);
        if(!old||c.distanceKm<old.distanceKm)uniq.set(k,c);
      }
      nearby=[...uniq.values()].sort((a,b)=>a.distanceKm-b.distanceKm||b.population-a.population);
      if(nearby.length)break;
    }

    // Extreme remote cells: guarantee a proposal by searching the compact atlas.
    if(!nearby.length){
      const all=await Promise.all(Array.from({length:BAND_COUNT},(_,i)=>loadBand0354(i)));
      for(const data of all){
        for(const rows of Object.values(data.tiles||{})){
          for(const row of rows)if(validSettlementRow0355(row))nearby.push(cityObject0354(row,lat,lon));
        }
      }
      nearby.sort((a,b)=>a.distanceKm-b.distanceKm||b.population-a.population);
    }
    return {cell,lat,lon,kind:'nearby',options:nearby.slice(0,6)};
  }

  function ensureModalMovable0354(){
    const card=document.getElementById('modalCard3244');
    if(card)window.HexategosMovablePanels0353?.register(card,'.modalHead3244','generic-modal');
  }

  function renderCityProposal0354(result){
    if(uiInteractionState3244.modal?.type!=='real_city_0354'||
       uiInteractionState3244.modal?.data?.cell!==result.cell)return;

    cityProposalState0354=result;
    const exact=result.kind==='exact';
    modalTitle3244.textContent=exact?'Elegir nombre real':'Localidad real cercana';

    const lead=exact
      ?'Estas localidades del atlas están realmente situadas dentro del hexágono seleccionado.'
      :'El atlas no contiene una localidad de más de 1.000 habitantes dentro de este hexágono. Puedes usar una localidad real cercana o construir la ciudad sin asignar nombre real.';

    const cards=result.options.map((c,i)=>{
      const history=Array.isArray(c.historicalNames)&&c.historicalNames.length
        ?'<small class="realCityHistory0355">Hist.: '+escape0354(c.historicalNames.join(' → '))+' → '+escape0354(c.name)+'</small>'
        :'';
      return '<button class="realCityChoice0354" data-modal-action="real_city_build" data-index="'+i+'">'+
        '<b>'+escape0354(c.name)+'</b>'+
        '<span>'+escape0354(c.country)+(exact?' · dentro del hexágono':' · '+c.distanceKm.toFixed(c.distanceKm<10?1:0)+' km')+'</span>'+
        history+
      '</button>';
    }).join('');

    modalBody3244.innerHTML=
      '<div class="realCityIntro0354">'+lead+'</div>'+
      '<div class="realCityList0354">'+cards+'</div>'+
      '<div class="realCitySource0354">Datos geográficos: GeoNames · barrios/distritos PPLX excluidos · nombres históricos solo cuando están documentados.</div>';

    modalActions3244.innerHTML=
      '<button data-modal-action="real_city_build" data-index="-1">CONSTRUIR SIN NOMBRE REAL</button>'+
      '<button data-modal-action="close">CANCELAR</button>';
    ensureModalMovable0354();
  }

  async function openCityProposal0354(cell){
    if(cell<0||owner6[cell]!==playerCountry||cities3212.has(cell))return false;
    closeContextDialog3244();
    uiInteractionState3244.modal={type:'real_city_0354',data:{cell}};
    modal3244.classList.add('open3244');
    modal3244.setAttribute('aria-hidden','false');
    modalTitle3244.textContent='Buscando localidad real…';
    modalBody3244.innerHTML='<div class="realCityLoading0354">Consultando el atlas offline de localidades…</div>';
    modalActions3244.innerHTML='<button data-modal-action="close">CANCELAR</button>';
    ensureModalMovable0354();
    try{
      const result=await suggestForCell0354(cell);
      renderCityProposal0354(result);
    }catch(err){
      console.warn('[HEXATEGOS 0.35.4] No se pudo consultar el atlas',err);
      if(uiInteractionState3244.modal?.type==='real_city_0354'){
        modalTitle3244.textContent='Nombre de ciudad';
        modalBody3244.innerHTML='<div class="realCityIntro0354">El atlas no está disponible. Puedes construir la ciudad con el nombre automático y renombrarla después.</div>';
        modalActions3244.innerHTML='<button data-modal-action="real_city_build" data-index="-1">CONSTRUIR</button><button data-modal-action="close">CANCELAR</button>';
      }
    }
    return true;
  }

  // Intercept all user city construction paths. Upgrades keep the existing name.
  const baseBuild0354=build3212;
  build3212=function(type){
    if(type==='city'&&!cityBuildBypass0354&&selected?.key===MAX_GAME_LEVEL3233&&
       owner6[selected.i]===playerCountry&&!cities3212.has(selected.i)){
      openCityProposal0354(selected.i);
      return;
    }
    return baseBuild0354.apply(this,arguments);
  };

  // The contextual handler may have been wrapped by city rename and other layers,
  // so let it reach build3212; the wrapper above is the single interception point.

  modal3244.addEventListener('click',e=>{
    const b=e.target.closest('[data-modal-action="real_city_build"]');
    if(!b)return;
    const m=uiInteractionState3244.modal;
    if(m?.type!=='real_city_0354')return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const cell=m.data.cell;
    const idx=Number(b.dataset.index);
    const option=idx>=0?cityProposalState0354?.options?.[idx]:null;
    closeModal3244();

    selected={key:MAX_GAME_LEVEL3233,i:cell};
    if(typeof uiInteractionState3244!=='undefined')uiInteractionState3244.selectedCell=cell;
    const before=cities3212.has(cell);

    // v3.28.2 protects construction with a short-lived permit issued by an
    // explicit context action. Opening the city-name modal consumes the first
    // permit, so confirming the chosen name must issue a fresh permit for the
    // same cell before calling the protected builder.
    if(typeof contextBuildPermit3282!=='undefined'){
      contextBuildPermit3282={type:'city',cell,until:performance.now()+900};
    }

    cityBuildBypass0354=true;
    try{baseBuild0354('city')}finally{cityBuildBypass0354=false}
    const built=!before&&cities3212.has(cell);
    if(built&&option?.name){
      const clean=typeof cleanCityName3271==='function'?cleanCityName3271(option.name):option.name;
      if(typeof setCityName3271==='function')setCityName3271(cell,clean);
      toast('Ciudad desarrollada · '+clean);
    }
  },true);

  // ---------------------------------------------------------------------------
  // Ranking -> current capital.
  // ---------------------------------------------------------------------------
  function rankingOrder0354(){
    const counts=ownedCounts3220(),arr=[];
    const n=Math.min(activeFactionCount3230,counts.length);
    for(let f=0;f<n;f++)if(counts[f]>0)arr.push([f,counts[f]]);
    arr.sort((a,b)=>b[1]-a[1]);
    return arr.slice(0,9);
  }

  function decorateRanking0354(){
    const host=document.getElementById('rankRows3213');
    if(!host)return;
    const order=rankingOrder0354();
    [...host.querySelectorAll('.rankRow3213')].forEach((row,i)=>{
      const f=order[i]?.[0];
      if(!Number.isInteger(f))return;
      row.dataset.faction=String(f);
      row.tabIndex=0;
      row.setAttribute('role','button');
      row.setAttribute('aria-label','Ir a la capital de '+factionName3230(f));
      row.title='Ir a la capital de '+factionName3230(f);
    });
  }

  const baseRanking0354=updateRanking3220;
  updateRanking3220=function(){
    const out=baseRanking0354.apply(this,arguments);
    decorateRanking0354();
    return out;
  };

  function focusFactionCapital0354(f){
    f=Number(f);
    if(!Number.isInteger(f)||f<0||f>=activeFactionCount3230)return false;
    const cell=capitals?.[f]??-1;
    if(cell<0||cell>=owner6.length){
      toast('Esta nación no tiene una capital activa');
      return false;
    }
    closeContextDialog3244?.();
    const {lon,lat}=cellLonLat3302(cell);
    const coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
    const targetZoom=coarse?7.1:5.7;
    rotateToGeo3243(lon,lat,targetZoom);
    selected={key:MAX_GAME_LEVEL3233,i:cell};
    if(typeof uiInteractionState3244!=='undefined')uiInteractionState3244.selectedCell=cell;
    updatePanel();
    needsRender=true;
    const capName=typeof cityDisplayName3271==='function'?cityDisplayName3271(cell):'capital';
    toast(factionName3230(f)+' · '+capName);
    window.HexategosGeoMap0352?.refresh?.();
    return true;
  }

  const rankHost=document.getElementById('rankRows3213');
  rankHost?.addEventListener('click',e=>{
    const row=e.target.closest('.rankRow3213[data-faction]');
    if(row)focusFactionCapital0354(row.dataset.faction);
  });
  rankHost?.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const row=e.target.closest('.rankRow3213[data-faction]');
    if(!row)return;
    e.preventDefault();
    focusFactionCapital0354(row.dataset.faction);
  });
  decorateRanking0354();

  async function validate0354(){
    const errors=[],warnings=[];
    if(typeof rotateToGeo3243!=='function')errors.push('Navegación geográfica no disponible');
    if(typeof updateRanking3220!=='function')errors.push('Clasificación no disponible');
    if(typeof pointInsideCell0354!=='function')errors.push('Prueba geométrica de celda no disponible');
    if(!document.getElementById('rankRows3213'))errors.push('Contenedor de clasificación no disponible');
    let atlas=null;
    try{
      const b=await loadBand0354(6);
      atlas={band:b.band,tiles:Object.keys(b.tiles||{}).length};
      if(!atlas.tiles)errors.push('Atlas sin teselas');
    }catch(err){
      warnings.push('No se pudo comprobar el atlas: '+err.message);
    }
    return {ok:errors.length===0,errors,warnings,atlas,cachedBands:bandCache.size};
  }

  window.HexategosRealCities0354={
    version:BUILD,
    suggest:suggestForCell0354,
    focusCapital:focusFactionCapital0354,
    validate:validate0354,
    cachedBands:()=>[...bandCache.keys()].sort((a,b)=>a-b),
    source:{
      name:'GeoNames cities1000',
      records:140607,
      excludedPPLX:5428,
      usableRecords:135179,
      historicalRecords:33,
      attribution:'GeoNames · CC BY 4.0'
    }
  };

  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.35.4 navegación de capitales + atlas de localidades reales activo');
})();