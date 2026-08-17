import { bearingLabel, createEl, formatAge, formatDuration, formatLocal, formatUtc } from './utils.js';
import { SATELLITE_ICONS, normalizeSatelliteIcon, satelliteIconUrl } from './icons.js';
import { footprintRadiusMeters } from './orbit.js';
import { metadataFor, shortCatalogSummary } from './metadata.js';

const f=(x,n=2,suffix='')=>Number.isFinite(Number(x))?`${Number(x).toFixed(n)}${suffix}`:'—';

export function toast(message,type='info',ms=3600){
  const host=document.getElementById('toastHost'); if(!host)return;
  const el=createEl('div',{class:`toast ${type==='error'?'error':type==='success'?'success':''}`,text:message});host.append(el);setTimeout(()=>el.remove(),ms);
}
export function setButtonState(btn,on){btn?.classList.toggle('active',!!on);btn?.setAttribute('aria-pressed',on?'true':'false');}
export function switchTab(name){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.toggle('active',p.id===`tab-${name}`));
}

export function renderTracked(container,records,selectedId,callbacks,filter=''){
  container.replaceChildren();const q=filter.trim().toLowerCase();
  const visible=records.filter(r=>!q||r.name.toLowerCase().includes(q)||String(r.noradId||'').includes(q));
  if(!visible.length){container.append(createEl('div',{class:'empty-state',text:records.length?'No hay coincidencias.':'Todavía no sigues ningún satélite. Añádelo desde Catálogo o mediante TLE.'}));return;}
  for(const r of visible){
    const snap=r.lastSnapshot;
    const check=createEl('input',{type:'checkbox',class:'visibility-toggle',title:'Mostrar / ocultar'});check.checked=r.visible!==false;check.addEventListener('change',()=>callbacks.visible(r.id,check.checked));
    const satImg=createEl('img',{class:'sat-list-icon',src:satelliteIconUrl(r.iconKey,32),alt:'',title:'Icono del satélite'});satImg.style.setProperty('--sat-color',r.color);
    const dot=createEl('span',{class:'color-dot'});dot.style.background=r.color;
    const name=createEl('div',{class:'sat-card__name',text:r.name});
    const sub=createEl('div',{class:'sat-card__sub',text:`${r.noradId?`NORAD ${r.noradId} · `:''}${snap?`${f(snap.altKm,0,' km')} · ${f(snap.speedKms,2,' km/s')}`:'sin posición'}`});
    const main=createEl('div',{class:'sat-card__main'},name,sub);
    const top=createEl('div',{class:'sat-card__top'},check,satImg,dot,main);
    const detailBtn=createEl('button',{class:'small-btn',type:'button',text:'Ficha',title:'Abrir ficha'});detailBtn.addEventListener('click',()=>callbacks.select(r.id));
    const followBtn=createEl('button',{class:'mini-icon',type:'button',text:r.following?'◎':'⌖',title:r.following?'Dejar de seguir':'Seguir en el mapa'});followBtn.addEventListener('click',()=>callbacks.follow(r.id));
    const iconBtn=createEl('button',{class:'mini-icon sat-icon-button',type:'button',title:'Cambiar imagen del satélite'});iconBtn.style.setProperty('--sat-color',r.color);iconBtn.append(createEl('img',{src:satelliteIconUrl(r.iconKey,32),alt:''}));iconBtn.addEventListener('click',()=>callbacks.icon(r.id));
    const editBtn=createEl('button',{class:'mini-icon',type:'button',text:'✎',title:'Editar nombre / TLE'});editBtn.addEventListener('click',()=>callbacks.edit(r.id));
    const color=createEl('input',{type:'color',value:r.color,title:'Color de órbita'});color.style.width='30px';color.style.height='30px';color.style.padding='0';color.addEventListener('input',()=>callbacks.color(r.id,color.value));
    const del=createEl('button',{class:'mini-icon',type:'button',text:'×',title:'Eliminar'});del.addEventListener('click',()=>callbacks.remove(r.id));
    const actions=createEl('div',{class:'sat-card__actions'},detailBtn,followBtn,iconBtn,editBtn,color,del);
    const card=createEl('article',{class:`sat-card ${r.id===selectedId?'selected':''}`},top,actions);card.addEventListener('click',e=>{if(!e.target.closest('button,input'))callbacks.select(r.id);});card.addEventListener('dblclick',()=>callbacks.zoom(r.id));container.append(card);
  }
}

export function renderCatalog(container,items,trackedNorads,callbacks){
  container.replaceChildren();
  if(!items.length){container.append(createEl('div',{class:'empty-state',text:'Sin resultados.'}));return;}
  for(const omm of items.slice(0,250)){
    const id=String(omm.NORAD_CAT_ID??''), added=trackedNorads.has(id),meta=metadataFor(omm);
    const name=createEl('div',{class:'catalog-card__name',text:omm.OBJECT_NAME||`NORAD ${id}`});
    const inc=Number.isFinite(Number(omm.INCLINATION))?`${Number(omm.INCLINATION).toFixed(2)}°`:'inclinación —';
    const sub=createEl('div',{class:'catalog-card__sub',text:`NORAD ${id} · ${omm.OBJECT_ID||'sin designador'} · ${inc}`});
    const summary=createEl('div',{class:'catalog-card__mission',text:shortCatalogSummary(omm)});
    const facts=createEl('div',{class:'catalog-card__facts'});
    if(meta.objectType&&meta.objectType!=='—')facts.append(createEl('span',{text:meta.objectType}));
    if(meta.rcsM2!=null)facts.append(createEl('span',{text:`RCS ${meta.rcsM2.toFixed(meta.rcsM2<10?2:1)} m²`}));
    const main=createEl('div',{class:'catalog-card__main'},name,sub,summary,facts);
    const btn=createEl('button',{class:'small-btn',type:'button','data-action':'add',text:added?'Añadido':'Añadir'});btn.disabled=added;btn.addEventListener('click',()=>callbacks.add(omm));
    const card=createEl('article',{class:`catalog-card ${added?'is-added':''}`},createEl('div',{class:'catalog-card__top'},main,btn));container.append(card);
  }
}

function metric(label,value){return createEl('div',{class:'metric'},createEl('span',{text:label}),createEl('strong',{text:value}));}
function badge(text,kind=''){return createEl('span',{class:`badge ${kind}`,text});}

export function renderDetails({record,snapshot,elements,epoch,passes=[],weather,currentWeather,weatherScore,observer,minElevationDeg,courseDeg=NaN}){
  const empty=document.getElementById('emptyDetails'), box=document.getElementById('satDetails');
  if(!record||!snapshot){empty.hidden=false;box.hidden=true;return;}
  empty.hidden=true;box.hidden=false;

  const detailIcon=document.getElementById('detailIcon');detailIcon.src=satelliteIconUrl(record.iconKey,64);detailIcon.style.setProperty('--sat-color',record.color);
  const detailColor=document.getElementById('detailColor');if(detailColor&&document.activeElement!==detailColor)detailColor.value=record.color;
  document.getElementById('detailName').textContent=record.name;
  document.getElementById('detailSubtitle').textContent=`${record.noradId?`NORAD ${record.noradId}`:'TLE manual'}${record.omm?.OBJECT_ID?` · ${record.omm.OBJECT_ID}`:''}`;

  const badges=document.getElementById('detailBadges');badges.replaceChildren();
  const age=epoch?Date.now()-epoch.getTime():NaN, ageHours=age/3600000;
  badges.append(badge(`Datos: ${formatAge(age)}`,ageHours<24?'good':ageHours<72?'warn':'bad'));
  const illumText=snapshot.shadow.state==='sunlight'?'☀ Iluminado':snapshot.shadow.state==='penumbra'?'◐ Penumbra':'● Umbra';
  badges.append(badge(illumText,snapshot.shadow.state==='sunlight'?'good':snapshot.shadow.state==='penumbra'?'warn':'bad'));
  if(snapshot.look)badges.append(badge(snapshot.look.elevationDeg>=minElevationDeg?`Visible > ${minElevationDeg}°`:snapshot.look.elevationDeg>0?'Sobre horizonte':'Bajo horizonte',snapshot.look.elevationDeg>=minElevationDeg?'good':snapshot.look.elevationDeg>0?'warn':'bad'));

  const coverageRadiusKm=footprintRadiusMeters(snapshot.altKm,minElevationDeg)/1000;
  const coverageDiameterKm=coverageRadiusKm*2;
  const situation=document.getElementById('detailSituation');
  if(observer&&snapshot.look){
    const el=snapshot.look.elevationDeg;
    const relation=el>=minElevationDeg?`está por encima de tu elevación mínima (${minElevationDeg}°)`:el>0?'está sobre tu horizonte, pero todavía bajo la elevación mínima':'está bajo tu horizonte';
    situation.textContent=`Ahora está a ${f(snapshot.altKm,0,' km')} de altitud sobre ${Math.abs(snapshot.lat).toFixed(1)}° ${snapshot.lat>=0?'N':'S'}, ${Math.abs(snapshot.lon).toFixed(1)}° ${snapshot.lon>=0?'E':'O'}, moviéndose hacia ${Number.isFinite(courseDeg)?bearingLabel(courseDeg):'—'}. Desde tu ubicación ${relation}.`;
  }else{
    situation.textContent=`Ahora está a ${f(snapshot.altKm,0,' km')} de altitud y viaja a ${f(snapshot.speedKms,2,' km/s')} hacia ${Number.isFinite(courseDeg)?bearingLabel(courseDeg):'—'}. Su huella para una elevación mínima de ${minElevationDeg}° cubre aproximadamente ${f(coverageDiameterKm,0,' km')} de diámetro.`;
  }

  const quick=document.getElementById('quickStatusGrid');quick.replaceChildren();
  const quickItem=(label,value,sub='')=>createEl('div',{class:'quick-status'},createEl('span',{text:label}),createEl('strong',{text:value}),sub?createEl('small',{text:sub}):null);
  quick.append(
    quickItem('Altitud',f(snapshot.altKm,0,' km'),'sobre la Tierra'),
    quickItem('Velocidad',f(snapshot.speedKms,2,' km/s'),Number.isFinite(courseDeg)?`rumbo ${bearingLabel(courseDeg)}`:`${f(snapshot.speedKms*3600,0,' km/h')}`),
    quickItem('Cobertura',f(coverageDiameterKm,0,' km'),`diámetro > ${minElevationDeg}°`),
    quickItem(observer&&snapshot.look?'Elevación':'Iluminación',observer&&snapshot.look?f(snapshot.look.elevationDeg,1,'°'):(snapshot.shadow.state==='sunlight'?'Sol':snapshot.shadow.state==='penumbra'?'Penumbra':'Umbra'),observer&&snapshot.look?bearingLabel(snapshot.look.azimuthDeg):'estado actual')
  );

  const meta=metadataFor({...record.omm,name:record.name,noradId:record.noradId});
  const infoBlock=document.getElementById('catalogInfoBlock'),mission=document.getElementById('missionSummary'),infoGrid=document.getElementById('catalogInfoGrid'),physical=document.getElementById('physicalInfo');
  if(record.source==='catalog'||record.omm?._SATCAT){
    infoBlock.hidden=false;mission.textContent=meta.function;
    infoGrid.replaceChildren(
      metric('Tipo',meta.objectType),
      metric('Operador / país',meta.owner||'—'),
      metric('Lanzamiento',meta.launchDate||'—'),
      metric('Sitio lanzamiento',meta.launchSite||'—'),
      metric('Estado SATCAT',meta.operationalStatus||meta.orbitType||'—'),
      metric('Sección radar',meta.rcsM2==null?'—':`${meta.rcsM2.toFixed(meta.rcsM2<10?2:1)} m²`),
      metric('Designador',record.omm?.OBJECT_ID||record.omm?._SATCAT?.OBJECT_ID||'—'),
      metric('Centro orbital',meta.orbitCenter||'Tierra')
    );
    physical.replaceChildren();
    if(meta.physical){
      physical.append(createEl('strong',{text:'Dimensiones físicas conocidas: '}),document.createTextNode(meta.physical.dimensions));
      if(meta.physical.mass)physical.append(document.createTextNode(` · Masa ${meta.physical.mass}`));
      physical.append(createEl('small',{text:` · Fuente: ${meta.physical.source}`}));
    }else{
      physical.append(createEl('span',{text:'Dimensiones físicas: no disponibles en SATCAT. No se estiman a partir de la sección radar.'}));
    }
  }else{
    infoBlock.hidden=false;mission.textContent='Satélite añadido mediante TLE manual.';infoGrid.replaceChildren(metric('NORAD',record.noradId||'—'),metric('Metadatos de misión','No disponibles'));physical.textContent='Añádelo desde el catálogo o actualiza sus datos para intentar obtener información SATCAT.';
  }

  const pg=document.getElementById('positionGrid');pg.replaceChildren(metric('Latitud',f(snapshot.lat,3,'°')),metric('Longitud',f(snapshot.lon,3,'°')),metric('Altitud',f(snapshot.altKm,1,' km')),metric('Velocidad SGP4',f(snapshot.speedKms,3,' km/s')));
  if(snapshot.look){pg.append(metric('Azimut',bearingLabel(snapshot.look.azimuthDeg)),metric('Elevación',f(snapshot.look.elevationDeg,1,'°')),metric('Distancia',f(snapshot.look.rangeKm,0,' km')),metric('Sol observador',f(snapshot.sunElevation,1,'°')));}

  const og=document.getElementById('orbitGrid');og.replaceChildren(metric('Inclinación',f(elements.inclination,3,'°')),metric('Excentricidad',f(elements.eccentricity,6)),metric('Periodo',f(elements.periodMin,2,' min')),metric('Mov. medio',f(elements.meanMotion,6,' rev/día')),metric('Perigeo',f(elements.perigeeKm,0,' km')),metric('Apogeo',f(elements.apogeeKm,0,' km')));
  const dg=document.getElementById('dataGrid');dg.replaceChildren(metric('Epoch',epoch?formatUtc(epoch,false):'—'),metric('Edad',formatAge(age)),metric('Origen',record.source==='catalog'?'OMM / CelesTrak':'TLE manual'),metric('Cobertura',`>${minElevationDeg}°`));

  const observerSituation=document.getElementById('observerSituation');
  if(!observer){
    observerSituation.textContent='Todavía no hay una ubicación de observación. Puedes usar la ubicación del dispositivo o elegir una manualmente.';
  }else if(snapshot.look){
    const horizon=snapshot.look.elevationDeg>0?'sobre':'bajo';
    observerSituation.textContent=`Observador: ${observer.lat.toFixed(3)}°, ${observer.lon.toFixed(3)}° · satélite ${horizon} el horizonte · azimut ${bearingLabel(snapshot.look.azimuthDeg)} · distancia ${f(snapshot.look.rangeKm,0,' km')}.`;
  }

  const passesInfo=document.getElementById('passesInfo');passesInfo.textContent=observer?`${passes.length} pasos calculados con elevación ≥ ${minElevationDeg}°`:'Activa o elige tu ubicación para calcular pasos.';
  const nextHero=document.getElementById('nextPassHero');nextHero.replaceChildren();
  const next=passes[0];
  if(!observer){
    nextHero.append(createEl('div',{class:'next-pass-empty',text:'Define una ubicación de observación para saber cuándo volverá a pasar por tu cielo.'}));
  }else if(!next){
    nextHero.append(createEl('div',{class:'next-pass-empty',text:'Aún no hay pasos calculados. Pulsa “Calcular 48 h”.'}));
  }else{
    const vis=next.anyVisible?'Potencialmente visible':'Paso orbital';
    const kind=next.anyVisible?'good':'warn';
    nextHero.append(
      createEl('div',{class:'next-pass-main'},
        createEl('div',{class:'next-pass-time'},createEl('strong',{text:formatLocal(next.aos)}),createEl('small',{text:`AOS ${bearingLabel(next.aosAzimuthDeg)} · ${formatDuration(next.durationSec)}`})),
        createEl('div',{class:'next-pass-elevation'},createEl('strong',{text:f(next.maxElevationDeg,1,'°')}),createEl('small',{text:'elevación máxima'}))
      ),
      createEl('div',{class:'next-pass-meta'},badge(vis,kind),badge(next.illumination==='sunlight'?'☀ Sol':next.illumination==='penumbra'?'◐ Penumbra':'● Umbra'),next.weatherScore?.label?badge(next.weatherScore.label,next.weatherScore.score>=65?'good':next.weatherScore.score>=45?'warn':'bad'):null)
    );
  }

  const list=document.getElementById('passesList');list.replaceChildren();
  for(const p of passes){
    const vis=p.anyVisible ? (p.weatherScore?.label ? `Visible · ${p.weatherScore.label}` : 'Visible') : 'No visible';
    const kind=!p.anyVisible?'warn':(p.weatherScore?.score>=65||p.weatherScore?.score==null)?'good':p.weatherScore?.score>=45?'warn':'bad';
    const head=createEl('div',{class:'pass-card__head'},createEl('span',{text:formatLocal(p.aos)}),createEl('span',{class:`badge ${kind}`,text:vis}));
    const grid=createEl('div',{class:'pass-card__grid'},
      createEl('div',{},'AOS',createEl('strong',{text:bearingLabel(p.aosAzimuthDeg)})),
      createEl('div',{},'Máx.',createEl('strong',{text:`${f(p.maxElevationDeg,1,'°')} · ${formatLocal(p.maxTime)}`})),
      createEl('div',{},'LOS',createEl('strong',{text:bearingLabel(p.losAzimuthDeg)})),
      createEl('div',{},'Duración',createEl('strong',{text:formatDuration(p.durationSec)})),
      createEl('div',{},'Iluminación',createEl('strong',{text:p.illumination==='sunlight'?'Sol':p.illumination==='penumbra'?'Penumbra':'Umbra'})),
      createEl('div',{},'Distancia',createEl('strong',{text:f(p.rangeKm,0,' km')}))
    );
    list.append(createEl('article',{class:'pass-card'},head,grid));
  }

  const wc=document.getElementById('weatherCard');wc.replaceChildren();
  if(!observer){wc.textContent='Activa o elige tu ubicación para consultar condiciones.';}
  else if(!currentWeather){wc.textContent='Meteorología no disponible en este momento.';}
  else{
    const scoreText=weatherScore?.score==null?'—':`${weatherScore.score}/100`;
    wc.append(createEl('div',{class:'weather-score'},createEl('strong',{text:weatherScore?.label||'Condiciones'}),createEl('span',{class:'badge',text:scoreText})));
    const grid=createEl('div',{class:'metric-grid'},metric('Nubosidad',f(currentWeather.cloud_cover,0,'%')),metric('Precipitación',currentWeather.precipitation_probability==null?f(currentWeather.precipitation,1,' mm'):f(currentWeather.precipitation_probability,0,'%')),metric('Visibilidad',f((currentWeather.visibility||0)/1000,1,' km')),metric('Noche',snapshot.sunElevation<=-6?'Sí':'No'));
    wc.append(grid);
  }
}
export async function pickSatelliteIconDialog(currentKey='sat1'){
  return new Promise(resolve=>{
    let chosen=normalizeSatelliteIcon(currentKey);
    const dialog=createEl('dialog',{class:'icon-dialog'}),title=createEl('h3',{text:'Imagen del satélite'}),hint=createEl('p',{class:'muted',text:'Incluye los iconos originales del proyecto y ocho variantes adicionales de las imágenes que adjuntaste.'}),grid=createEl('div',{class:'satellite-icon-grid'});
    const buttons=[];
    for(const item of SATELLITE_ICONS){
      const img=createEl('img',{src:satelliteIconUrl(item.key,64),alt:''});
      const b=createEl('button',{type:'button',class:`satellite-icon-choice ${item.key===chosen?'selected':''}`,title:item.label},img,createEl('span',{text:item.label}));
      b.addEventListener('click',()=>{chosen=item.key;for(const x of buttons)x.classList.toggle('selected',x===b);});buttons.push(b);grid.append(b);
    }
    const cancel=createEl('button',{class:'small-btn',type:'button',text:'Cancelar'}),save=createEl('button',{class:'primary-btn',type:'button',text:'Usar imagen'}),row=createEl('div',{class:'section-row dialog-actions'},cancel,save);
    dialog.append(title,hint,grid,row);document.body.append(dialog);
    const finish=value=>{dialog.close();dialog.remove();resolve(value);};cancel.addEventListener('click',()=>finish(null));save.addEventListener('click',()=>finish(chosen));dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null);},{once:true});dialog.showModal();
  });
}



export async function pickObserverLocationDialog(current=null,mapCenter=null){
  return new Promise(resolve=>{
    const fallbackLat=Number.isFinite(Number(current?.lat))?Number(current.lat):Number(mapCenter?.lat)||0;
    const fallbackLon=Number.isFinite(Number(current?.lon))?Number(current.lon):Number(mapCenter?.lng??mapCenter?.lon)||0;
    const dialog=createEl('dialog',{class:'location-dialog'});
    const title=createEl('h3',{text:'Elegir ubicación de observación'});
    const hint=createEl('p',{class:'muted',text:'Esta ubicación se usará para próximos pasos, elevación/azimut y condiciones meteorológicas. Puedes escribir coordenadas o usar el centro actual del mapa.'});
    const lat=createEl('input',{class:'text-input',type:'number',step:'any',min:'-90',max:'90',value:String(fallbackLat.toFixed(6))});
    const lon=createEl('input',{class:'text-input',type:'number',step:'any',min:'-180',max:'180',value:String(fallbackLon.toFixed(6))});
    const status=createEl('div',{class:'muted',text:'Latitud −90…90 · Longitud −180…180'});
    const useCenter=createEl('button',{class:'small-btn',type:'button',text:'Usar centro del mapa'});
    const cancel=createEl('button',{class:'small-btn',type:'button',text:'Cancelar'});
    const save=createEl('button',{class:'primary-btn',type:'button',text:'Usar ubicación'});
    const fields=createEl('div',{class:'location-grid'},createEl('label',{},'Latitud',lat),createEl('label',{},'Longitud',lon));
    const row=createEl('div',{class:'section-row dialog-actions'},useCenter,cancel,save);
    dialog.append(title,hint,fields,status,row);document.body.append(dialog);
    const finish=value=>{dialog.close();dialog.remove();resolve(value);};
    const validate=()=>{
      const la=Number(lat.value),lo=Number(lon.value),ok=Number.isFinite(la)&&la>=-90&&la<=90&&Number.isFinite(lo)&&lo>=-180&&lo<=180;
      save.disabled=!ok;status.textContent=ok?'Ubicación válida.':'Introduce una latitud y longitud válidas.';return ok;
    };
    lat.addEventListener('input',validate);lon.addEventListener('input',validate);
    useCenter.addEventListener('click',()=>{lat.value=String((Number(mapCenter?.lat)||0).toFixed(6));lon.value=String((Number(mapCenter?.lng??mapCenter?.lon)||0).toFixed(6));validate();});
    cancel.addEventListener('click',()=>finish(null));
    save.addEventListener('click',()=>{if(validate())finish({lat:Number(lat.value),lon:Number(lon.value),altMeters:0});});
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null);},{once:true});validate();dialog.showModal();
  });
}
export async function editSatelliteDialog(record){
  return new Promise(resolve=>{
    const dialog=createEl('dialog',{class:'edit-dialog'}),form=createEl('form',{method:'dialog'}),title=createEl('h3',{text:'Editar satélite'}),name=createEl('input',{class:'text-input',value:record.name});
    const tle=createEl('textarea',{class:'text-area',placeholder:'TLE opcional (2 líneas)'});tle.value=record.l1&&record.l2?`${record.l1}\n${record.l2}`:'';
    const info=createEl('p',{class:'muted',text:record.source==='catalog'?'Puedes cambiar el nombre. Si introduces un TLE manual, el satélite pasará a usar ese TLE.':'Edita nombre y/o TLE.'});
    const cancel=createEl('button',{class:'small-btn',value:'cancel',type:'button',text:'Cancelar'}),save=createEl('button',{class:'primary-btn',value:'save',type:'button',text:'Guardar'}),row=createEl('div',{class:'section-row'},cancel,save);
    form.append(title,createEl('label',{},'Nombre',name),createEl('label',{},'TLE',tle),info,row);dialog.append(form);document.body.append(dialog);
    const finish=value=>{dialog.close();dialog.remove();resolve(value);};cancel.addEventListener('click',()=>finish(null));save.addEventListener('click',()=>finish({name:name.value.trim(),tle:tle.value.trim()}));dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null);},{once:true});dialog.showModal();
  });
}
