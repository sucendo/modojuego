import { APP_VERSION, CATALOG_GROUPS, DEFAULTS } from './config.js';
import { CatalogService } from './catalog.js';
import { MapManager } from './map.js';
import { OverlayManager } from './overlays.js';
import { TimeController } from './time-controller.js';
import { WeatherService } from './weather.js';
import { Storage } from './storage.js';
import { buildTrack, createSatrec, getEpoch, orbitalElements, parseTleBlock, snapshot, tleChecksumOk, tleNoradId } from './orbit.js';
import { predictPasses } from './passes.js';
import { debounce, hashColor, uid } from './utils.js';
import { editSatelliteDialog, pickObserverLocationDialog, pickSatelliteIconDialog, renderCatalog, renderDetails, renderTracked, setButtonState, switchTab, toast } from './ui.js';
import { defaultSatelliteIcon, normalizeSatelliteIcon, satelliteIconUrl } from './icons.js';

const settings={...DEFAULTS,...Storage.loadSettings()};
delete settings.nightOpacity; // v2.8: intensidad nocturna fija (Suave = 0,45).
const state={sats:new Map(),selectedId:null,observer:null,weatherData:null,catalogResults:[],trackDirty:true,lastTrackAt:0,lastOverlayAt:0,lastWeatherAt:0,lastDetailAt:0,mobileView:'map',mobileCardSatId:null};
const mapManager=new MapManager('map');
const overlays=new OverlayManager(mapManager.map);
const time=new TimeController();
const catalog=new CatalogService();
const weather=new WeatherService();
let lastMobileMode=window.matchMedia('(max-width:760px)').matches;

const $=id=>document.getElementById(id);
const els={
  headerStatus:$('headerStatus'),utcStatus:$('utcStatus'),trackedList:$('trackedList'),trackedFilter:$('trackedFilter'),
  catalogSearch:$('catalogSearch'),catalogResults:$('catalogResults'),catalogSource:$('catalogSource'),catalogUpdated:$('catalogUpdated'),
  manualName:$('manualName'),manualTle:$('manualTle'),manualColor:$('manualColor'),manualIconBtn:$('manualIconBtn'),manualAddBtn:$('manualAddBtn'),manualTleStatus:$('manualTleStatus'),
  sidePanel:$('sidePanel'),panelOpenBtn:$('panelOpenBtn'),timeControls:$('timeControls'),mobileDock:$('mobileDock'),mobileSelectedCard:$('mobileSelectedCard'),
  mobileVisibleCountBtn:$('mobileVisibleCountBtn'),mobileVisibleCount:$('mobileVisibleCount'),mobileLocateBtn:$('mobileLocateBtn')
};

function persistSettings(){Storage.saveSettings(settings);}
function persistSats(){Storage.saveSatellites([...state.sats.values()]);}
function selected(){return state.selectedId?state.sats.get(state.selectedId):null;}
function records(){return [...state.sats.values()];}
function trackedNorads(){return new Set(records().map(r=>String(r.noradId||'')).filter(Boolean));}

function setObserverButtonState(on){
  setButtonState($('locateBtn'),on);
  setButtonState(els.mobileLocateBtn,on);
}

async function ensureSatelliteMetadata(record,{force=false}={}){
  if(!record?.omm||record._metadataBusy)return;
  if(record.omm._SATCAT&&!force)return;
  record._metadataBusy=true;
  try{
    const enriched=await catalog.ensureMetadata(record.omm,{force});
    if(enriched&&enriched!==record.omm){record.omm=enriched;persistSats();renderAllLists();renderSelectedDetails();}
  }catch(err){console.warn('Metadatos SATCAT no disponibles',err);}
  finally{record._metadataBusy=false;}
}

function hydrateRecord(raw){
  const rec={...raw,id:raw.id||uid('sat'),name:raw.name||raw.omm?.OBJECT_NAME||'Satélite',color:raw.color||hashColor(raw.noradId||raw.name),visible:raw.visible!==false,source:raw.source|| (raw.omm?'catalog':'manual'),passes:[]};
  rec.iconKey=normalizeSatelliteIcon(raw.iconKey||defaultSatelliteIcon(rec));
  rec.noradId=raw.noradId ?? raw.omm?.NORAD_CAT_ID ?? tleNoradId(raw.l1); rec.satrec=createSatrec(rec);
  return rec.satrec?rec:null;
}

function addOmm(omm,{select=true}={}){
  const norad=String(omm.NORAD_CAT_ID??'');
  const existing=records().find(r=>String(r.noradId||'')===norad);
  if(existing){existing.omm=omm;existing.satrec=createSatrec(existing);existing.name=existing.name||omm.OBJECT_NAME;persistSats();toast('El satélite ya estaba añadido; datos orbitales actualizados.','success');if(select)selectSatellite(existing.id);return existing;}
  const rec=hydrateRecord({id:`norad-${norad}`,name:omm.OBJECT_NAME||`NORAD ${norad}`,noradId:norad,source:'catalog',omm,color:hashColor(norad),iconKey:defaultSatelliteIcon(omm),visible:true});
  if(!rec){toast('CelesTrak devolvió datos que no se pudieron convertir a SGP4.','error');return null;}
  state.sats.set(rec.id,rec);persistSats();state.trackDirty=true;renderAllLists();toast(`${rec.name} añadido.`,'success');if(select)selectSatellite(rec.id);return rec;
}

let manualIconKey='sat1';

function addManual(name,tle,color,iconKey=manualIconKey){
  const parsed=parseTleBlock(tle);if(!parsed||!tleChecksumOk(parsed.l1)||!tleChecksumOk(parsed.l2))throw new Error('El TLE no supera la validación de formato y checksum.');
  const id=uid('manual'),rec=hydrateRecord({id,name:name.trim(),noradId:tleNoradId(parsed.l1),source:'manual',l1:parsed.l1,l2:parsed.l2,color,iconKey:normalizeSatelliteIcon(iconKey),visible:true});
  if(!rec)throw new Error('satellite.js no pudo inicializar este TLE.');state.sats.set(id,rec);persistSats();state.trackDirty=true;renderAllLists();selectSatellite(id);return rec;
}

function removeSatellite(id){
  const r=state.sats.get(id);if(!r)return;if(!confirm(`¿Eliminar ${r.name} del seguimiento?`))return;
  mapManager.remove(id);state.sats.delete(id);if(state.selectedId===id)state.selectedId=records()[0]?.id||null;persistSats();renderAllLists();renderSelectedDetails();
}

function selectSatellite(id,{openDetails=true}={}){
  if(!state.sats.has(id))return;state.selectedId=id;mapManager.select(id);if(openDetails)switchTab('details');renderAllLists();renderSelectedDetails();
  const r=selected();if(r)ensureSatelliteMetadata(r);
  if(isMobileViewport()&&openDetails)setMobileView('details');
  else if(isMobileViewport())updateMobileSelectedCard();
  scheduleAutoPasses();
}


async function editSatellite(id){
  const r=state.sats.get(id);if(!r)return;const result=await editSatelliteDialog(r);if(!result)return;
  if(result.name)r.name=result.name;
  if(result.tle){const p=parseTleBlock(result.tle);if(!p||!tleChecksumOk(p.l1)||!tleChecksumOk(p.l2)){toast('No se ha guardado: TLE/checksum inválido.','error');return;}r.l1=p.l1;r.l2=p.l2;r.omm=null;r.source='manual';r.noradId=tleNoradId(p.l1);r.satrec=createSatrec(r);r.passes=[];state.trackDirty=true;}
  persistSats();renderAllLists();renderSelectedDetails();
}

async function changeSatelliteIcon(id){
  const r=state.sats.get(id);if(!r)return;const key=await pickSatelliteIconDialog(r.iconKey);if(!key)return;
  r.iconKey=normalizeSatelliteIcon(key);mapManager.updateIcon(r);persistSats();renderAllLists();renderSelectedDetails();
}

function isMobileViewport(){return window.matchMedia('(max-width:760px)').matches;}

function updateMobileDockActive(view=state.mobileView){
  els.mobileDock?.querySelectorAll('[data-mobile-view]').forEach(b=>b.classList.toggle('active',b.dataset.mobileView===view));
}

function applyMobileDockVisibility(){
  const visible=settings.mobileDockVisible!==false;
  els.mobileDock?.classList.toggle('menu-hidden',!visible);
  document.documentElement.classList.toggle('mobile-dock-hidden',!visible);
  setButtonState($('mobileMenuBtn'),visible);
  $('mobileMenuBtn')?.setAttribute('title',visible?'Ocultar menú inferior':'Mostrar menú inferior');
  updateMobileSelectedCard();
  setTimeout(()=>mapManager.invalidate(),60);
}
function toggleMobileDock(){
  if(!isMobileViewport())return;
  settings.mobileDockVisible=settings.mobileDockVisible===false;
  if(!settings.mobileDockVisible)setMobileView('map');
  persistSettings();applyMobileDockVisibility();
}

function updateMobileSelectedCard(){
  const card=els.mobileSelectedCard;if(!card)return;
  const mobileMap=isMobileViewport()&&state.mobileView==='map';
  const visible=records().filter(r=>r.visible!==false&&r.lastSnapshot&&mapManager.isSatelliteInViewport(r.id));

  if(els.mobileVisibleCountBtn){
    const showCount=mobileMap&&visible.length>0;
    els.mobileVisibleCountBtn.hidden=!showCount;
    if(showCount)els.mobileVisibleCount.textContent=String(visible.length);
  }

  // La tarjeta nunca cambia silenciosamente de satélite. Solo representa al
  // satélite seleccionado y únicamente mientras ese satélite está en pantalla.
  const r=selected();
  const show=mobileMap&&!!r?.lastSnapshot&&mapManager.isSatelliteInViewport(r.id);
  state.mobileCardSatId=show?r.id:null;
  card.hidden=!show;if(!show)return;
  const snap=r.lastSnapshot,img=$('mobileSelectedIcon');img.src=satelliteIconUrl(r.iconKey,32);img.style.setProperty('--sat-color',r.color);
  $('mobileSelectedName').textContent=r.name;
  const look=snap.look;const extra=look?` · elev. ${look.elevationDeg.toFixed(1)}°`:'';
  $('mobileSelectedStatus').textContent=`${snap.altKm.toFixed(0)} km · ${snap.speedKms.toFixed(2)} km/s${extra}`;
}

function setMobileView(view){
  if(!isMobileViewport())return;
  state.mobileView=view;updateMobileDockActive(view);
  $('topActions').classList.remove('open');
  els.sidePanel.classList.remove('mobile-expanded');
  if(view!=='time'&&settings.timeControlsVisible){settings.timeControlsVisible=false;els.timeControls.classList.remove('active');setButtonState($('timeToggleBtn'),false);persistSettings();updateTimeHeight();}
  if(view==='map'){
    els.sidePanel.hidden=true;
  }else if(view==='satellites'||view==='details'){
    els.sidePanel.hidden=false;
    if(view==='details'){
      switchTab('details');els.sidePanel.classList.add('mobile-expanded');
    }else{
      const current=document.querySelector('.tab.active')?.dataset.tab;
      switchTab(current==='catalog'?'catalog':'tracked');
    }
  }else if(view==='layers'){
    els.sidePanel.hidden=true;$('topActions').classList.add('open');
  }else if(view==='time'){
    els.sidePanel.hidden=true;settings.timeControlsVisible=true;els.timeControls.classList.add('active');setButtonState($('timeToggleBtn'),true);persistSettings();updateTimeHeight();
  }
  updateMobileSelectedCard();setTimeout(()=>mapManager.invalidate(),80);
}

async function toggleFullscreen(){
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }catch(err){toast('El navegador no permite activar pantalla completa en este momento.','error');}
}

function updateFullscreenButtons(){
  const active=!!document.fullscreenElement;
  for(const id of ['fullscreenBtn','mobileFullscreenBtn']){
    const b=$(id);if(!b)continue;b.classList.toggle('active',active);b.textContent=active?'⤢':'⛶';b.title=active?'Salir de pantalla completa':'Pantalla completa';
  }
}

function bindMobileGestures(){
  const handle=$('mobileSheetHandle');
  let startY=null,suppressHandleClickUntil=0;
  handle?.addEventListener('click',()=>{if(Date.now()<suppressHandleClickUntil)return;els.sidePanel.classList.toggle('mobile-expanded');});
  handle?.addEventListener('touchstart',e=>{startY=e.touches[0]?.clientY??null;},{passive:true});
  handle?.addEventListener('touchend',e=>{
    if(startY==null)return;const end=e.changedTouches[0]?.clientY??startY,dy=end-startY;startY=null;
    if(dy<-35){suppressHandleClickUntil=Date.now()+450;els.sidePanel.classList.add('mobile-expanded');return;}
    if(dy>45){suppressHandleClickUntil=Date.now()+450;if(els.sidePanel.classList.contains('mobile-expanded'))els.sidePanel.classList.remove('mobile-expanded');else setMobileView('map');}
  },{passive:true});

  let cardStartY=null;
  els.mobileSelectedCard?.addEventListener('touchstart',e=>{cardStartY=e.touches[0]?.clientY??null;},{passive:true});
  els.mobileSelectedCard?.addEventListener('touchend',e=>{
    if(cardStartY==null)return;const end=e.changedTouches[0]?.clientY??cardStartY,dy=end-cardStartY;cardStartY=null;
    if(dy<-28&&state.mobileCardSatId)selectSatellite(state.mobileCardSatId,{openDetails:true});
  },{passive:true});
}

async function scheduleAutoPasses(){
  const r=selected();if(!r||!state.observer||r.passes?.length||r._autoPassBusy)return;
  r._autoPassBusy=true;renderSelectedDetails();
  try{
    r.passes=await predictPasses(r,state.observer,time.now(),{hours:24,minElevationDeg:settings.minElevationDeg,maxPasses:6});
    if(state.weatherData){for(const p of r.passes){const w=weather.at(state.weatherData,p.maxTime);p.weatherScore=weather.score({weather:w,observerSunElevationDeg:p.observerSunElevationDeg,satelliteLit:p.shadowFraction<.98,elevationDeg:p.maxElevationDeg});}}
  }catch(err){console.warn('Predicción automática de pasos no disponible',err);}finally{r._autoPassBusy=false;renderSelectedDetails();}
}

function renderAllLists(){
  for(const r of state.sats.values())r.following=mapManager.followId===r.id;
  renderTracked(els.trackedList,records(),state.selectedId,{
    visible:(id,on)=>{const r=state.sats.get(id);mapManager.setVisible(r,on);persistSats();},
    select:selectSatellite,follow:id=>{mapManager.follow(id);mapManager.zoomTo(id);renderAllLists();renderSelectedDetails();},zoom:id=>mapManager.zoomTo(id),
    edit:editSatellite,icon:changeSatelliteIcon,color:(id,c)=>{const r=state.sats.get(id);r.color=c;mapManager.updateColor(r);persistSats();renderAllLists();},remove:removeSatellite
  },els.trackedFilter.value||'');
  renderCatalog(els.catalogResults,state.catalogResults,trackedNorads(),{add:addOmm});
}

function groundCourseDeg(a,b){
  if(!a||!b)return NaN;
  const r=Math.PI/180,lat1=a.lat*r,lat2=b.lat*r,dLon=(b.lon-a.lon)*r;
  const y=Math.sin(dLon)*Math.cos(lat2),x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  return (Math.atan2(y,x)/r+360)%360;
}

function renderSelectedDetails(){
  const r=selected();if(!r||!r.lastSnapshot){renderDetails({record:null});return;}
  const now=time.now(),elements=orbitalElements(r,r.satrec),epoch=getEpoch(r,r.satrec),currentWeather=state.weatherData?weather.at(state.weatherData,now):null;
  const score=weather.score({weather:currentWeather,observerSunElevationDeg:r.lastSnapshot.sunElevation,satelliteLit:r.lastSnapshot.shadow.fraction<.98,elevationDeg:r.lastSnapshot.look?.elevationDeg});
  const ahead=snapshot(r,new Date(now.getTime()+30000),state.observer),courseDeg=groundCourseDeg(r.lastSnapshot,ahead);
  renderDetails({record:r,snapshot:r.lastSnapshot,elements,epoch,passes:r.passes||[],weather:state.weatherData,currentWeather,weatherScore:score,observer:state.observer,minElevationDeg:settings.minElevationDeg,courseDeg});
  $('detailFollowBtn').textContent=mapManager.followId===r.id?'Dejar de seguir':'Seguir';
  $('detailObserverBtn').textContent=state.observer?'◎ Observador':'◎ Ubicación';
  updateMobileSelectedCard();
}

async function calculatePasses({hours=48,maxPasses=16,quiet=false}={}){
  const r=selected();if(!r){if(!quiet)toast('Selecciona un satélite.','error');return;}if(!state.observer){if(!quiet)toast('Activa o elige tu ubicación para calcular pasos.','error');return;}
  const btn=$('computePassesBtn');if(btn){btn.disabled=true;btn.textContent='Calculando…';}$('passesInfo').textContent=`Calculando pasos durante las próximas ${hours} h…`;
  try{
    r.passes=await predictPasses(r,state.observer,time.now(),{hours,minElevationDeg:settings.minElevationDeg,maxPasses,onProgress:quiet?undefined:p=>$('passesInfo').textContent=`Calculando… ${Math.round(p*100)}%`});
    if(state.weatherData){
      for(const p of r.passes){const w=weather.at(state.weatherData,p.maxTime);p.weatherScore=weather.score({weather:w,observerSunElevationDeg:p.observerSunElevationDeg,satelliteLit:p.shadowFraction<.98,elevationDeg:p.maxElevationDeg});}
    }
    renderSelectedDetails();
  }catch(err){if(!quiet)toast(`No se pudieron calcular los pasos: ${err.message}`,'error');else console.warn(err);}
  finally{if(btn){btn.disabled=false;btn.textContent='Calcular 48 h';}}
}

async function refreshWeather(force=false){
  if(!state.observer)return;
  try{
    state.weatherData=await weather.get(state.observer,{force});state.lastWeatherAt=Date.now();
    for(const r of state.sats.values())for(const p of r.passes||[]){const w=weather.at(state.weatherData,p.maxTime);p.weatherScore=weather.score({weather:w,observerSunElevationDeg:p.observerSunElevationDeg,satelliteLit:p.shadowFraction<.98,elevationDeg:p.maxElevationDeg});}
    renderSelectedDetails();
  }catch(err){console.warn(err);state.weatherData=null;renderSelectedDetails();}
}

async function doCatalogSearch(){
  const q=els.catalogSearch.value.trim();if(!q)return;els.catalogResults.replaceChildren();els.catalogSource.textContent='Catálogo: buscando…';
  try{const r=await catalog.search(q);state.catalogResults=r.data;els.catalogSource.textContent=`Catálogo: ${r.source}`;renderAllLists();}
  catch(err){state.catalogResults=[];renderAllLists();toast(err.message,'error');els.catalogSource.textContent='Catálogo: error';}
}

async function loadCategory(group){
  els.catalogSource.textContent=`Catálogo: cargando ${CATALOG_GROUPS[group]}…`;
  try{const r=await catalog.group(group);state.catalogResults=r.data;els.catalogSource.textContent=`Catálogo: ${r.source}`;renderAllLists();}
  catch(err){state.catalogResults=[];renderAllLists();toast(err.message,'error');}
}

async function refreshTracked(){
  const sats=records().filter(r=>r.noradId);if(!sats.length){toast('No hay satélites con NORAD ID para actualizar.');return;}
  const localById=new Map(catalog.catalog.map(x=>[String(x.NORAD_CAT_ID),x]));let count=0;
  if(localById.size>500){
    for(const r of sats){const omm=localById.get(String(r.noradId));if(omm){r.omm=omm;r.source='catalog';r.satrec=createSatrec(r);r.passes=[];count++;}}
    persistSats();state.trackDirty=true;toast(`${count} satélites actualizados desde el snapshot de CelesTrak.`,'success');return;
  }
  const r=selected();if(!r?.noradId){toast('El snapshot local aún no está generado. Selecciona un satélite con NORAD ID para actualizarlo.','error');return;}
  try{const omm=await catalog.refreshNorad(r.noradId);if(omm){r.omm=omm;r.source='catalog';r.satrec=createSatrec(r);r.passes=[];persistSats();state.trackDirty=true;toast(`${r.name} actualizado desde CelesTrak.`,'success');}}
  catch(err){toast(`No se pudo actualizar: ${err.message}`,'error');}
}

async function activateObserver(){
  if(state.observer||mapManager.watchId!=null){mapManager.clearObserver();setObserverButtonState(false);return;}
  try{mapManager.startGeolocation();setObserverButtonState(true);}catch(err){await chooseManualObserver(err.message);}
}

async function chooseManualObserver(reason=''){
  if(reason)toast(`${reason} Puedes elegir la ubicación manualmente.`,'error',5200);
  const center=mapManager.map.getCenter();
  const chosen=await pickObserverLocationDialog(state.observer,center);
  if(!chosen)return;
  try{
    mapManager.setManualObserver(chosen);
    setObserverButtonState(true);
    toast('Ubicación de observación establecida manualmente.','success');
  }catch(err){toast(err.message,'error');}
}

function validateManual(){
  const p=parseTleBlock(els.manualTle.value),valid=!!p&&tleChecksumOk(p.l1)&&tleChecksumOk(p.l2),hasName=!!els.manualName.value.trim();
  els.manualTleStatus.textContent=valid?'TLE válido (2 líneas y checksum correctos).':els.manualTle.value.trim()?'TLE incompleto o checksum inválido.':'Esperando TLE…';
  els.manualAddBtn.disabled=!(valid&&hasName);
}

function applySettingsToUI(){
  $('baseMapSelect').value=settings.baseMap;$('trackMinutesSelect').value=String(settings.trackMinutes);$('minElevationSelect').value=String(settings.minElevationDeg);
  setButtonState($('terminatorBtn'),settings.terminator);setButtonState($('radarBtn'),settings.radar);setButtonState($('cloudsBtn'),settings.clouds);setButtonState($('labelsBtn'),settings.mapLabels);setButtonState($('footprintsBtn'),settings.footprints);setButtonState($('lowPowerBtn'),settings.lowPower);setButtonState($('timeToggleBtn'),settings.timeControlsVisible);
  overlays.setNightOpacity(.45);overlays.setState('terminator',settings.terminator);overlays.setState('radar',settings.radar);overlays.setState('clouds',settings.clouds);mapManager.setFootprints(settings.footprints);mapManager.setBase(settings.baseMap);mapManager.setLabels(settings.mapLabels);overlays.setBaseMap(settings.baseMap);
  els.timeControls.classList.toggle('active',settings.timeControlsVisible);updateTimeHeight();setPanelCollapsed(settings.panelCollapsed,false);
}

function updateTimeHeight(){const h=els.timeControls.classList.contains('active')?els.timeControls.getBoundingClientRect().height+8:0;document.documentElement.style.setProperty('--time-h',`${h}px`);setTimeout(()=>mapManager.invalidate(),80);}
function setPanelCollapsed(on,persist=true){settings.panelCollapsed=!!on;els.sidePanel.hidden=on;els.panelOpenBtn.hidden=!on;if(persist)persistSettings();setTimeout(()=>mapManager.invalidate(),80);}

function bindEvents(){
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{switchTab(b.dataset.tab);if(isMobileViewport()){state.mobileView=b.dataset.tab==='details'?'details':'satellites';updateMobileDockActive(state.mobileView);els.sidePanel.classList.toggle('mobile-expanded',b.dataset.tab==='details');}}));
  els.trackedFilter.addEventListener('input',()=>renderAllLists());
  $('refreshTrackedBtn').addEventListener('click',refreshTracked);
  els.catalogSearch.addEventListener('keydown',e=>{if(e.key==='Enter')doCatalogSearch();});$('catalogSearchBtn').addEventListener('click',doCatalogSearch);
  $('categoryGrid').addEventListener('click',e=>{const b=e.target.closest('button[data-group]');if(b)loadCategory(b.dataset.group);});
  els.manualTle.addEventListener('input',validateManual);els.manualName.addEventListener('input',validateManual);
  els.manualIconBtn.addEventListener('click',async()=>{const key=await pickSatelliteIconDialog(manualIconKey);if(!key)return;manualIconKey=key;els.manualIconBtn.querySelector('img').src=satelliteIconUrl(manualIconKey,32);});
  els.manualAddBtn.addEventListener('click',()=>{try{const r=addManual(els.manualName.value,els.manualTle.value,els.manualColor.value,manualIconKey);els.manualName.value='';els.manualTle.value='';validateManual();toast(`${r.name} añadido.`,'success');}catch(err){toast(err.message,'error');}});
  $('panelCloseBtn').addEventListener('click',()=>isMobileViewport()?setMobileView('map'):setPanelCollapsed(true));els.panelOpenBtn.addEventListener('click',()=>setPanelCollapsed(false));
  $('detailIconBtn').addEventListener('click',()=>{const r=selected();if(r)changeSatelliteIcon(r.id);});
  $('detailCenterBtn').addEventListener('click',()=>{const r=selected();if(!r)return;mapManager.zoomTo(r.id);if(isMobileViewport())setMobileView('map');});
  $('detailObserverBtn').addEventListener('click',()=>state.observer?chooseManualObserver():activateObserver());
  $('changeObserverBtn').addEventListener('click',()=>chooseManualObserver());
  $('detailColor').addEventListener('input',e=>{const r=selected();if(!r)return;r.color=e.target.value;mapManager.updateColor(r);persistSats();renderAllLists();renderSelectedDetails();});
  $('detailFollowBtn').addEventListener('click',()=>{const r=selected();if(!r)return;mapManager.follow(r.id);mapManager.zoomTo(r.id);renderAllLists();renderSelectedDetails();});$('computePassesBtn').addEventListener('click',calculatePasses);

  $('baseMapSelect').addEventListener('change',e=>{settings.baseMap=e.target.value;mapManager.setBase(settings.baseMap);mapManager.setLabels(settings.mapLabels);overlays.setBaseMap(settings.baseMap);persistSettings();});
  $('labelsBtn').addEventListener('click',()=>{settings.mapLabels=!settings.mapLabels;setButtonState($('labelsBtn'),settings.mapLabels);mapManager.setLabels(settings.mapLabels);persistSettings();});
  $('trackMinutesSelect').addEventListener('change',e=>{settings.trackMinutes=Number(e.target.value);state.trackDirty=true;persistSettings();});
  $('minElevationSelect').addEventListener('change',e=>{settings.minElevationDeg=Number(e.target.value);for(const r of state.sats.values())r.passes=[];state.trackDirty=true;persistSettings();renderSelectedDetails();scheduleAutoPasses();});
  for(const [id,key] of [['terminatorBtn','terminator'],['radarBtn','radar'],['cloudsBtn','clouds']])$(id).addEventListener('click',()=>{settings[key]=!settings[key];setButtonState($(id),settings[key]);overlays.setState(key,settings[key]);persistSettings();if(settings[key]&&key!=='terminator')overlays.updateWeather(time.now(),time.manual);});
  $('footprintsBtn').addEventListener('click',()=>{settings.footprints=!settings.footprints;setButtonState($('footprintsBtn'),settings.footprints);mapManager.setFootprints(settings.footprints);persistSettings();});
  $('lowPowerBtn').addEventListener('click',()=>{settings.lowPower=!settings.lowPower;setButtonState($('lowPowerBtn'),settings.lowPower);persistSettings();});
  $('timeToggleBtn').addEventListener('click',()=>{settings.timeControlsVisible=!settings.timeControlsVisible;els.timeControls.classList.toggle('active',settings.timeControlsVisible);setButtonState($('timeToggleBtn'),settings.timeControlsVisible);persistSettings();updateTimeHeight();});
  $('locateBtn').addEventListener('click',activateObserver);
  els.mobileLocateBtn?.addEventListener('click',activateObserver);
  $('fullscreenBtn').addEventListener('click',toggleFullscreen);
  $('mobileFullscreenBtn')?.addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',updateFullscreenButtons);
  $('mobileMenuBtn').addEventListener('click',()=>isMobileViewport()?toggleMobileDock():$('topActions').classList.toggle('open'));
  els.mobileVisibleCountBtn?.addEventListener('click',()=>setMobileView('satellites'));
  bindMobileGestures();
  els.mobileDock?.addEventListener('click',e=>{const b=e.target.closest('[data-mobile-view]');if(b)setMobileView(b.dataset.mobileView);});
  els.mobileSelectedCard?.addEventListener('click',()=>{if(state.mobileCardSatId&&state.sats.has(state.mobileCardSatId))selectSatellite(state.mobileCardSatId,{openDetails:true});else setMobileView('details');});
  window.addEventListener('resize',debounce(()=>{
    const mobile=isMobileViewport();
    if(mobile!==lastMobileMode){
      lastMobileMode=mobile;
      if(mobile){setMobileView('map');applyMobileDockVisibility();}
      else{els.sidePanel.hidden=!!settings.panelCollapsed;els.sidePanel.classList.remove('mobile-expanded');$('topActions').classList.remove('open');if(els.mobileSelectedCard)els.mobileSelectedCard.hidden=true;}
    }
    updateTimeHeight();mapManager.invalidate();
  },120));

  mapManager.addEventListener('satclick',e=>selectSatellite(e.detail,{openDetails:false}));
  mapManager.addEventListener('viewportchange',()=>updateMobileSelectedCard());
  mapManager.addEventListener('observerpick',e=>{if(confirm('¿Usar este punto del mapa como ubicación de observación?')){mapManager.setManualObserver(e.detail);setObserverButtonState(true);toast('Ubicación de observación fijada desde el mapa.','success');}});
  mapManager.addEventListener('observer',e=>{state.observer=e.detail;for(const r of state.sats.values())r.passes=[];refreshWeather(true);renderSelectedDetails();scheduleAutoPasses();});
  mapManager.addEventListener('geoerror',async()=>{mapManager.clearObserver();setObserverButtonState(false);await chooseManualObserver('El navegador no ha podido proporcionar la ubicación.');});
  time.addEventListener('change',()=>{if(time.manual)state.trackDirty=true;});
}

function tick(ts){
  const playing=time.playing,wantMs=playing?50:(document.hidden?4000:(settings.lowPower?1000:250));
  if(!tick.last||ts-tick.last>=wantMs){
    tick.last=ts;const date=time.now();els.utcStatus.textContent=`UTC: ${date.toISOString().replace('T',' ').replace('Z','')}${time.manual?' (manual)':''}`;
    for(const r of state.sats.values()){const snap=snapshot(r,date,state.observer);r.lastSnapshot=snap;if(snap)mapManager.updateSatellite(r,snap,settings.minElevationDeg);}
    if(isMobileViewport())updateMobileSelectedCard();
    if(state.trackDirty||ts-state.lastTrackAt>(playing?5000:15000)){
      for(const r of state.sats.values()){const track=buildTrack(r,date,settings.trackMinutes,settings.trackMinutes);mapManager.updateTrack(r,track);}state.trackDirty=false;state.lastTrackAt=ts;
    }
    const overlayGap=playing?650:3000;if(ts-state.lastOverlayAt>overlayGap){overlays.updateTime(date);if(settings.radar||settings.clouds)overlays.updateWeather(date,time.manual);state.lastOverlayAt=ts;}
    if(state.observer&&Date.now()-state.lastWeatherAt>10*60*1000)refreshWeather(false);
    if(ts-state.lastDetailAt>800){renderSelectedDetails();state.lastDetailAt=ts;}
  }
  requestAnimationFrame(tick);
}

async function init(){
  els.headerStatus.textContent=`v${APP_VERSION} · cargando catálogo…`;
  time.bindUI({useNowBtn:$('useNowBtn'),playPauseBtn:$('playPauseBtn'),slider:$('timeRateSlider'),rateLabel:$('timeRate'),input:$('referenceTime')});
  bindEvents();applySettingsToUI();validateManual();els.manualIconBtn.querySelector('img').src=satelliteIconUrl(manualIconKey,32);
  for(const raw of Storage.loadSatellites()){const r=hydrateRecord(raw);if(r)state.sats.set(r.id,r);}
  state.selectedId=records()[0]?.id||null;if(state.selectedId)mapManager.select(state.selectedId);
  renderAllLists();
  try{await catalog.init();const count=catalog.catalog.length;els.catalogUpdated.textContent=`Actualizado: ${catalog.meta?.generatedAt?new Date(catalog.meta.generatedAt).toLocaleString('es-ES'):'sin snapshot'}`;els.headerStatus.textContent=`v${APP_VERSION} · ${count?`${count.toLocaleString('es-ES')} objetos en snapshot`:'catálogo online al buscar'}`;}
  catch{els.headerStatus.textContent=`v${APP_VERSION}`;}
  if(selected())ensureSatelliteMetadata(selected());
  renderAllLists();renderSelectedDetails();
  if(isMobileViewport()){setMobileView('map');applyMobileDockVisibility();}
  overlays.updateWeather(time.now(),false);
  requestAnimationFrame(tick);
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(console.warn);

  // API externa estable: corrige el problema de ámbito de la versión original.
  window.simTime={set:date=>time.set(date),play:on=>on?time.play():time.pause(),now:()=>time.now(),useNow:()=>time.useNow()};
}

init().catch(err=>{console.error(err);toast(`Error al iniciar: ${err.message}`,'error',8000);els.headerStatus.textContent='Error de inicialización';});
