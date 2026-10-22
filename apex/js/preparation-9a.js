/* APEX 9A.2 · Preparación sobre los controles reales de Carrera rápida y Entrenamiento.
 * Sin duplicar física, cronometraje, IA ni estrategias de boxes.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const MODES=Object.freeze({
  quick:{track:'track',weather:'weather',distance:'laps',launch:'start',info:'quickCircuitInfo',label:'CARRERA RÁPIDA'},
  practice:{track:'practiceTrack',weather:'practiceWeather',distance:null,launch:'practiceStart',info:'practiceCircuitInfo',label:'ENTRENAMIENTO LIBRE'}
});
const WX={CLEAR:'Despejado',PARTLY:'Parcialmente nublado',OVERCAST:'Nublado',DRIZZLE:'Llovizna',RAIN:'Lluvia',STORM:'Tormenta',VARIABLE:'Variable'};
const TYRE_ART=Object.freeze(Object.fromEntries(['SOFT','MEDIUM','HARD','INTERMEDIATE','WET'].map(t=>[t,'assets/9a/tyre-'+t.toLowerCase()+'.webp'])));
const COMPOUNDS={SOFT:['Blando','#df3044'],MEDIUM:['Medio','#f3d43f'],HARD:['Duro','#f5f5f5'],INTERMEDIATE:['Intermedio','#3dcc73'],WET:['Lluvia extrema','#3d9ef5']};
let overlay=null,kind=null,launchBypass=false,manualStrategy='balanced',returnFocus=null;
function pick(id){const el=$(id);return el?.selectedOptions?.[0]?.textContent?.trim()||el?.value||'—';}
function asCompound(nativeValue){return String(nativeValue||'MEDIUM').toUpperCase().replace(/^C[1-5]$/,'MEDIUM');}
function nativeTyres(){return $('menuTyreCompound');}
function chosenWeather(){return $('apex9aPrepWeather')?.value||$(MODES[kind]?.weather)?.value||'VARIABLE';}
function resolvedWeather(){
 const selected=chosenWeather();
 if(selected!=='auto')return selected;
 const spec=MODES[kind],el=$(spec?.track);
 return window.ApexClimate9A?.resolvePreset({dir:el?.value||'',name:pick(spec?.track)},0,'auto')||'VARIABLE';
}
function availableTyres(){
 const el=nativeTyres();
 return el?Array.from(el.options).filter(o=>o.value&&COMPOUNDS[asCompound(o.value)]):[];
}
function recommend(weather){
 return weather==='RAIN'||weather==='STORM'?'WET':
 weather==='DRIZZLE'?'INTERMEDIATE':'MEDIUM';
}
function updateState(){
 if(!kind||!MODES[kind])return;
 const spec=MODES[kind],tyre=nativeTyres();
 try{window.ApexCompetition9A?.select({
  mode:kind,circuitId:String($(spec.track)?.value||'')||null,
  teamId:String($('teamSelect')?.value||'')||null,
  distance:spec.distance?Number($(spec.distance)?.value)||25:100,
  weather:chosenWeather(),
  tyre:String(tyre?.value||'MEDIUM').toLowerCase(),
  strategy:manualStrategy
 });}catch(e){console.warn('[APEX 9A] No se pudo guardar selección',e);}
}
// Refleja los <select> originales sin crear un segundo estado ni duplicar el motor.
function mirrorSelect(sourceId,targetId,locked=false){
 const source=$(sourceId),target=$(targetId);
 if(!target)return;
 if(!source){target.replaceChildren();target.disabled=true;return;}
 const options=Array.from(source.options);
 const different=target.options.length!==options.length||options.some((o,i)=>
  target.options[i]?.value!==o.value||target.options[i]?.textContent!==o.textContent||
  target.options[i]?.disabled!==o.disabled);
 if(different)target.replaceChildren(...options.map(o=>o.cloneNode(true)));
 target.value=source.value;
 target.disabled=!!(source.disabled||locked||!options.length);
 target.title=source.title||'';
}
function syncPreparationSelectors(){
 if(!kind)return;
 const spec=MODES[kind];
 mirrorSelect(spec.track,'apex9aPrepCircuit');
 mirrorSelect('teamSelect','apex9aPrepTeam');
 $('apex9aPrepDistanceRow').hidden=!spec.distance;
 if(spec.distance)mirrorSelect(spec.distance,'apex9aPrepDistance');
}
function bindSelector(targetId,sourceId){
 $(targetId).addEventListener('change',e=>{
  if(!kind)return;
  const native=$(typeof sourceId==='function'?sourceId():sourceId),mirror=e.currentTarget;
  if(!native||native.disabled||!Array.from(native.options).some(o=>o.value===mirror.value)){
   syncPreparationSelectors();return;
  }
  native.value=mirror.value;
  native.dispatchEvent(new Event('change',{bubbles:true}));
  refresh();
 });
}
function refresh(){
 if(!overlay||!kind)return;
 syncPreparationSelectors();
 const spec=MODES[kind],weather=resolvedWeather(),
  current=asCompound(nativeTyres()?.value),recommended=recommend(weather);
 const wet=['DRIZZLE','RAIN','STORM'].includes(weather);
 $('apex9aPrepTitle').textContent=kind==='practice'?'PREPARACIÓN DE ENTRENAMIENTO':'PREPARACIÓN DE CARRERA';
 $('apex9aTrackName').textContent=pick(spec.track);
 $('apex9aTrackDetails').replaceChildren();
 const info=$(spec.info);
 if(info){const copy=info.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));$('apex9aTrackDetails').append(copy);}
 $('apex9aWeatherName').textContent=WX[weather]||weather;
 $('apex9aSurface').textContent=wet?'Pista húmeda / mojada':'Pista seca o variable';
 $('apex9aWeatherHonesty').textContent=chosenWeather()==='auto'?'Estimación estacional SIMULADA por circuito. No representa una previsión real.':weather==='VARIABLE'?
  'El motor gestiona condiciones variables. No se muestra una previsión numérica que no haya calculado APEX.':
  'Condición seleccionada para esta sesión en el sistema meteorológico original de APEX.';
 $('apex9aDistance').textContent=spec.distance?pick(spec.distance):'Sesión libre · sin distancia de GP';
 const nativeDistanceHint=spec.distance?$('lapsDistanceHint')?.textContent||'':'';
 $('apex9aRaceLaps').textContent=nativeDistanceHint;
 $('apex9aRaceLaps').hidden=!nativeDistanceHint||kind==='practice';
 $('apex9aTeam').textContent=pick('teamSelect');
 $('apex9aTyres').innerHTML='';
 const types=availableTyres();
 for(const opt of types){
  const key=asCompound(opt.value),meta=COMPOUNDS[key],button=document.createElement('button');
  button.type='button';button.className='apex9aTyre'+(key===current?' selected':'');
  button.dataset.compound=opt.value;button.setAttribute('aria-pressed',String(key===current));
  const visual=document.createElement('span');visual.className='apex9aTyreVisual';visual.style.setProperty('--apex-compound-color',meta[1]);
  // Imagen transparente auténtica, cuando está instalada, con fallback CSS sin recursos perdidos.
  // Carga sólo imágenes confirmadas por el manifiesto de recursos.
  // Mientras no estén en GitHub, el anillo CSS evita peticiones 404.
  const src=TYRE_ART[key];
  if(typeof src==='string'&&src){
    const art=document.createElement('img');art.alt='';art.loading='lazy';
    art.src=src;art.onerror=()=>art.remove();visual.appendChild(art);
  }
  const label=document.createElement('b');label.textContent=meta[0];
  button.append(visual,label);
  button.addEventListener('click',()=>{
   const select=nativeTyres();if(!select)return;
   select.value=opt.value;
   select.dispatchEvent(new Event('change',{bubbles:true}));
   refresh();
  });
  $('apex9aTyres').appendChild(button);
 }
 $('apex9aTyreNotice').textContent=types.length?
  'El compuesto elegido se aplica al selector de neumáticos original del simulador.':
  'No se ha inicializado todavía el selector de neumáticos original.';
 $('apex9aLaunch').disabled=types.length===0||!$(spec.launch)||!!$(spec.launch).disabled;
 const human=COMPOUNDS[recommended]?.[0]||'Medio';
 $('apex9aAdvice').textContent=kind==='practice'?
  'Entrenamiento sin estrategia de carrera obligatoria. Recomendación inicial: '+human+'.':
  'Compuesto orientativo por la condición seleccionada: '+human+'. El desgaste y las paradas reales siguen gestionándose desde APEX.';
 $('apex9aStrategyRow').hidden=kind==='practice';
 $('apex9aStrategyNote').hidden=kind==='practice';
 updateState();
}
function close(){const restore=overlay&&!overlay.hidden&&overlay.contains(document.activeElement);if(overlay)overlay.hidden=true;kind=null;if(restore){const target=returnFocus?.isConnected&&!returnFocus.disabled?returnFocus:$('apex9aBack');target?.focus({preventScroll:true});}}
function open(which){
 if(!MODES[which])return;
 if(!overlay)build();
 returnFocus=$(MODES[which].launch)||document.activeElement;kind=which;overlay.hidden=false;
 const old=window.ApexCompetition9A?.get?.();
 const preferred=old?.mode===which&&old.weather==='auto'?'auto':$(MODES[kind].weather)?.value||'VARIABLE';
 if($('apex9aPrepWeather'))$('apex9aPrepWeather').value=preferred;
 refresh();$('apex9aClose')?.focus();
}
function build(){
 overlay=document.createElement('section');overlay.id='apex9aPreparation';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','apex9aPrepTitle');
 overlay.innerHTML=`<div class="apex9aPrepShell">
  <header class="apex9aPrepHead"><div><small>APEX FORMULA 26 · PREPARACIÓN</small><h2 id="apex9aPrepTitle">PREPARACIÓN DE CARRERA</h2></div><button id="apex9aClose" type="button" aria-label="Volver a la configuración">×</button></header>
  <div class="apex9aPrepColumns">
   <div class="apex9aPrepCard"><h3>01 · CIRCUITO Y VEHÍCULO</h3><label class="apex9aMirrorLabel" for="apex9aPrepCircuit">CIRCUITO</label><select class="apex9aNativeMirror" id="apex9aPrepCircuit"></select><label class="apex9aMirrorLabel" for="apex9aPrepTeam">ESCUDERÍA</label><select class="apex9aNativeMirror" id="apex9aPrepTeam"></select><div id="apex9aPrepDistanceRow"><label class="apex9aMirrorLabel" for="apex9aPrepDistance">DISTANCIA DE CARRERA</label><select class="apex9aNativeMirror" id="apex9aPrepDistance"></select></div><strong id="apex9aTrackName"></strong><div id="apex9aTrackDetails"></div><p>Escudería: <b id="apex9aTeam"></b></p><div class="apex9aVehicleVisual"><img src="assets/9a/race-vehicle.webp" alt="Monoplaza de presentación APEX"></div><p>Distancia: <b id="apex9aDistance"></b></p><p id="apex9aRaceLaps" class="apex9aInfo"></p></div>
   <div class="apex9aPrepCard apex9aWeatherCard"><h3>02 · METEOROLOGÍA</h3><label for="apex9aPrepWeather">CONDICIÓN DE LA SESIÓN</label><select id="apex9aPrepWeather"><option value="auto">Automática · estacional simulada</option><option value="CLEAR">Despejado</option><option value="PARTLY">Sol y nubes</option><option value="OVERCAST">Nublado</option><option value="DRIZZLE">Llovizna</option><option value="RAIN">Lluvia</option><option value="STORM">Tormenta</option><option value="VARIABLE">Variable</option></select><strong id="apex9aWeatherName"></strong><div class="apex9aTrackStateArt"><img src="assets/9a/track-state-thumb.webp" alt="Fotografía ilustrativa de la superficie de asfalto"></div><p>Estado previsto del asfalto: <b id="apex9aSurface"></b></p><p id="apex9aWeatherHonesty"></p><div class="apex9aInfo">La previsión no sustituye ni simula el motor meteorológico.</div></div>
   <div class="apex9aPrepCard"><h3>03 · NEUMÁTICOS Y ESTRATEGIA</h3><div class="apex9aTyreGrid" id="apex9aTyres"></div><p id="apex9aTyreNotice"></p><div id="apex9aStrategyRow"><label for="apex9aStrategy">PLAN DE SALIDA</label><select id="apex9aStrategy"><option value="aggressive">Agresiva</option><option value="balanced">Equilibrada</option><option value="conservative">Conservadora</option></select></div><p id="apex9aStrategyNote" class="apex9aInfo">La selección guarda la preferencia; no automatiza las paradas. Los ajustes de boxes durante la carrera siguen en el panel real.</p><p class="apex9aAdvice" id="apex9aAdvice"></p></div>
  </div><footer class="apex9aPrepActions"><button id="apex9aCancel" type="button">VOLVER</button><button id="apex9aLaunch" type="button">INICIAR SESIÓN ›</button></footer></div>`;
 document.body.appendChild(overlay);
 $('apex9aClose').onclick=close;$('apex9aCancel').onclick=close;
 bindSelector('apex9aPrepCircuit',()=>MODES[kind]?.track);
 bindSelector('apex9aPrepTeam','teamSelect');
 bindSelector('apex9aPrepDistance',()=>MODES[kind]?.distance);
 $('apex9aStrategy').value=manualStrategy;
 $('apex9aPrepWeather').onchange=refresh;
 $('apex9aStrategy').onchange=()=>{manualStrategy=$('apex9aStrategy').value;refresh();};
 $('apex9aLaunch').onclick=()=>{
  if(!kind)return;
  const action=MODES[kind].launch,button=$(action);
  if(!button||button.disabled)return;
  updateState();
  const nativeWeather=$(MODES[kind].weather),realWeather=resolvedWeather();
  if(nativeWeather){nativeWeather.value=realWeather;nativeWeather.dispatchEvent(new Event('change',{bubbles:true}));}
  close();
  launchBypass=true;
  try{button.click();}finally{launchBypass=false;}
 };
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 document.addEventListener('keydown',e=>{if(!overlay.hidden&&e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}},true);
 const menu=$('menu');
 if(menu)new MutationObserver(()=>{if(menu.classList.contains('hidden'))close();}).observe(menu,{attributes:true,attributeFilter:['class']});
}
function init(){
 for(const [which,spec] of Object.entries(MODES)){
  const button=$(spec.launch);if(!button)continue;
  button.addEventListener('click',e=>{
   if(launchBypass||e.defaultPrevented)return;
   // No sustituir el lanzador nativo; abrir preparación y ejecutar el mismo botón al confirmar.
   e.preventDefault();e.stopImmediatePropagation();open(which);
  },true);
 }
 const state=window.ApexCompetition9A?.get();
 if(state?.strategy&&['aggressive','balanced','conservative'].includes(state.strategy))manualStrategy=state.strategy;
}
window.ApexPreparation9A=Object.freeze({open,close,isOpen:()=>!!overlay&&!overlay.hidden});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
