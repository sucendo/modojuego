/* APEX 9B.2–9B.4 · Preparación individual enlazada al fin de semana NATIVO. */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const STAGES=['fp1','fp2','fp3','qualifying','race'];
const NAMES={fp1:'ENTRENAMIENTOS LIBRES 1',fp2:'ENTRENAMIENTOS LIBRES 2',fp3:'ENTRENAMIENTOS LIBRES 3',qualifying:'CLASIFICACIÓN',race:'CARRERA'};
const WEATHER={CLEAR:'Despejado',PARTLY:'Sol y nubes',OVERCAST:'Nublado',DRIZZLE:'Llovizna',RAIN:'Lluvia',STORM:'Tormenta',VARIABLE:'Variable'};
const COMPS={SOFT:'Blando',MEDIUM:'Medio',HARD:'Duro',INTERMEDIATE:'Intermedio',WET:'Lluvia extrema'};
let overlay=null,current=null,stage=null,releaseBypass=false,focusSource=null;
function snapshot(){return global.ApexNativeWeekend9B?.snapshot?.()||null}
function api(){return global.ApexSessionPlans9B}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function ctx(w){return {mode:w.mode,spec:w.spec,round:w.round}}
function sourceTyres(){
 const native=$('menuTyreCompound');
 return native?Array.from(native.options).filter(o=>!o.disabled&&Object.hasOwn(COMPS,String(o.value).toUpperCase())).map(o=>String(o.value).toUpperCase()):[];
}
function tyreMarkup(value){
 const list=sourceTyres();
 return list.map(code=>'<button type="button" class="apex9bTyre'+(code===value?' active':'')+'" data-tyre="'+code+'" aria-pressed="'+(code===value)+'"><img src="assets/9a/tyre-'+code.toLowerCase()+'.webp" alt="" loading="lazy"><span>'+esc(COMPS[code])+'</span></button>').join('');
}
function build(){
 overlay=document.createElement('section');overlay.id='apex9bPreparation';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','apex9bTitle');
 overlay.innerHTML='<div class="apex9bShell"><header class="apex9bHeader"><div><small>APEX FORMULA 26 · FIN DE SEMANA</small><h2 id="apex9bTitle">PREPARACIÓN DE SESIÓN</h2><p id="apex9bSubtitle"></p></div><button id="apex9bClose" type="button" aria-label="Regresar">×</button></header>'+
 '<div class="apex9bColumns"><section class="apex9bCard"><h3>01 · CIRCUITO Y SESIÓN</h3><strong id="apex9bCircuit"></strong><div class="apex9bCircuitArt" role="img" aria-label="Escenario ilustrativo de Gran Premio"></div><div id="apex9bTrackSvg" class="apex9bTrackSvg"></div><p id="apex9bEventInfo"></p><p id="apex9bStageInfo"></p></section>'+
 '<section class="apex9bCard"><h3>02 · METEOROLOGÍA</h3><div class="apex9bWeatherBanner"><strong id="apex9bWeatherLabel"></strong><small>PREVISIÓN SIMULADA · NO METEOROLOGÍA REAL</small></div><p>Estado de pista: <b id="apex9bTrackState"></b></p><p id="apex9bTrend"></p><label for="apex9bWeatherSelect">CONDICIÓN AL INICIAR SESIÓN</label><select id="apex9bWeatherSelect"><option value="auto">Automática · previsión del evento</option><option value="CLEAR">Despejado</option><option value="PARTLY">Sol y nubes</option><option value="OVERCAST">Nublado</option><option value="DRIZZLE">Llovizna</option><option value="RAIN">Lluvia</option><option value="STORM">Tormenta</option><option value="VARIABLE">Variable</option></select><p class="apex9bMuted">La previsión queda fija para este GP y sesión. El motor puede hacer evolucionar el tiempo durante la sesión.</p></section>'+
 '<section class="apex9bCard"><h3>03 · NEUMÁTICOS Y ESTRATEGIA</h3><div id="apex9bTyres" class="apex9bTyres"></div><div id="apex9bStrategyFields"></div><p id="apex9bAdvice" class="apex9bAdvice"></p><p id="apex9bLimits" class="apex9bMuted"></p></section></div>'+
 '<footer class="apex9bActions"><button id="apex9bCancel" type="button">VOLVER AL FIN DE SEMANA</button><button id="apex9bLaunch" class="primary" type="button">INICIAR SESIÓN REAL ›</button></footer></div>';
 document.body.appendChild(overlay);
 $('apex9bClose').onclick=()=>close(true);$('apex9bCancel').onclick=()=>close(true);
 $('apex9bWeatherSelect').onchange=()=>{save();refreshWeather();};
 $('apex9bTyres').onclick=e=>{const button=e.target.closest('[data-tyre]');if(!button)return;save({compound:button.dataset.tyre});updateTyres();renderAdvice();};
 $('apex9bStrategyFields').addEventListener('change',()=>{save();renderAdvice();});
 $('apex9bStrategyFields').addEventListener('input',e=>{if(e.target.matches('input'))save();});
 $('apex9bLaunch').onclick=launch;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close(true)});
 document.addEventListener('keydown',e=>{if(!overlay.hidden&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(true)}},true);
}
function getPlan(){return api().getPlan(ctx(current),stage)}
function value(id){return $(id)?.value}
function readFields(){
 const selected=$('apex9bTyres').querySelector('button.active')?.dataset.tyre||'MEDIUM';
 const patch={compound:selected,weatherSelection:value('apex9bWeatherSelect')};
 if(stage.startsWith('fp')){patch.program=value('apex9bProgram');const n=value('apex9bTargetLaps');patch.targetLaps=n===''?null:Number(n)}
 else if(stage==='qualifying'){patch.strategy=value('apex9bStrategy');patch.attempts=+value('apex9bAttempts')}
 else{
  patch.strategy=value('apex9bStrategy');patch.plannedStops=+value('apex9bStops');
  patch.stints=Array.from($('apex9bStrategyFields').querySelectorAll('.apex9bStint')).map((node,i)=>({
   compound:i===0?selected:node.querySelector('select')?.value||'MEDIUM',
   targetLap:node.querySelector('input')?.value?+node.querySelector('input').value:null
  }));
 }
 return patch;
}
function save(override){
 if(!current||!stage)return;
 const previous=getPlan(),patch={...readFields(),...override};
 // Las vueltas objetivo son planificación informativa, no una ejecución simulada.
 api().savePlan(ctx(current),stage,patch);
 global.dispatchEvent(new CustomEvent('apex:session-plan-change',{detail:{session:stage,eventId:api().forecast(ctx(current),stage).eventId}}));
}
function updateTyres(){
 const p=getPlan(),valid=sourceTyres();
 $('apex9bTyres').innerHTML=tyreMarkup(valid.includes(p.compound)?p.compound:(valid[0]||'MEDIUM'));
 $('apex9bLaunch').disabled=!valid.length;
}
function selectField(id,label,choices,currentValue){
 return '<label for="'+id+'">'+label+'</label><select id="'+id+'">'+choices.map(a=>'<option value="'+a[0]+'"'+(String(a[0])===String(currentValue)?' selected':'')+'>'+a[1]+'</option>').join('')+'</select>';
}
function renderStrategy(){
 const p=getPlan(),root=$('apex9bStrategyFields');
 const styles=[['conservative','Conservadora'],['balanced','Equilibrada'],['aggressive','Agresiva']];
 if(stage.startsWith('fp')){
  root.innerHTML=selectField('apex9bProgram','PROGRAMA DE ENTRENAMIENTO',
   [['performance','A · Rendimiento / vuelta rápida'],['balanced','B · Equilibrado'],['race-simulation','C · Simulación de carrera']],p.program)+
   '<label for="apex9bTargetLaps">VUELTAS OBJETIVO DE TANDA (OPCIONAL)</label><input id="apex9bTargetLaps" type="number" min="1" max="80" placeholder="Sin objetivo" value="'+(p.targetLaps??'')+'">';
  $('apex9bLimits').textContent='Programa y vueltas objetivo: preferencias guardadas, sin telemetría ficticia ni cierre automático de tanda.';
 }else if(stage==='qualifying'){
  root.innerHTML=selectField('apex9bStrategy','ENFOQUE DE CLASIFICACIÓN',styles,p.strategy)+
   selectField('apex9bAttempts','INTENTOS PREVISTOS',[[1,'1 intento'],[2,'2 intentos'],[3,'3 intentos'],[4,'4 intentos']],p.attempts);
  $('apex9bLimits').textContent='La clasificación real es una sesión continua: los intentos son un plan, no lanzamientos automáticos ni tiempos inventados.';
 }else{
  const count=p.plannedStops+1,stints=[];
  for(let i=0;i<count;i++){
   const entry=p.stints[i]||{},compound=i===0?p.compound:(entry.compound||'MEDIUM');
   stints.push('<div class="apex9bStint"><b>STINT '+(i+1)+'</b><select aria-label="Compuesto stint '+(i+1)+'"'+(i===0?' disabled':'')+'>'+
    sourceTyres().map(c=>'<option value="'+c+'"'+(c===compound?' selected':'')+'>'+COMPS[c]+'</option>').join('')+'</select>'+
    '<input type="number" min="1" max="1000" aria-label="Vuelta objetivo stint '+(i+1)+'" placeholder="Vuelta de parada" value="'+(entry.targetLap??'')+'"></div>');
  }
  root.innerHTML=selectField('apex9bStrategy','ENFOQUE DE CARRERA',styles,p.strategy)+
   selectField('apex9bStops','PARADAS PREVISTAS',[[0,'0 paradas'],[1,'1 parada'],[2,'2 paradas'],[3,'3 paradas']],p.plannedStops)+
   '<div class="apex9bStints">'+stints.join('')+'</div>';
  $('apex9bStops').onchange=()=>{save({stints:[]});renderStrategy();renderAdvice()};
  $('apex9bLimits').textContent='Los stints son un plan editable: solamente el siguiente compuesto pasa a la preferencia de boxes. Las paradas requieren entrada y servicio físicos reales; las vueltas objetivo no las ejecutan automáticamente.';
 }
}
function refreshWeather(){
 const f=api().forecast(ctx(current),stage),p=getPlan();
 const preset=p.weatherSelection==='auto'?f.preset:p.weatherSelection;
 $('apex9bWeatherLabel').textContent=WEATHER[preset]||preset;
 $('apex9bTrackState').textContent=['RAIN','STORM'].includes(preset)?'Mojada':preset==='DRIZZLE'?'Húmeda':preset==='VARIABLE'?'Variable':'Probablemente seca';
 $('apex9bTrend').textContent=p.weatherSelection==='auto'?f.trend:'Condición manual seleccionada (sin evolución prevista calculada).';
 $('apex9bWeatherSelect').value=p.weatherSelection;
 renderAdvice();
}
function renderAdvice(){
 const p=getPlan(),f=api().forecast(ctx(current),stage);
 const preset=p.weatherSelection==='auto'?f.preset:p.weatherSelection;
 const adviceTyre=['STORM','RAIN'].includes(preset)?'Lluvia extrema':preset==='DRIZZLE'?'Intermedio':'Medio';
 const prefix=stage.startsWith('fp')?{performance:'Tandas cortas',balanced:'Tandas mixtas','race-simulation':'Tandas largas'}[p.program]:
  stage==='qualifying'?{aggressive:'Buscar máximo rendimiento',balanced:'Equilibrar fiabilidad y velocidad',conservative:'Asegurar una vuelta válida'}[p.strategy]:
  {aggressive:'Priorizar velocidad',balanced:'Equilibrar degradación y ritmo',conservative:'Priorizar duración del neumático'}[p.strategy];
 $('apex9bAdvice').textContent=(prefix||'Plan de sesión')+'. Sugerencia climática: '+adviceTyre+'.';
}
function show(){
 const w=snapshot();if(!w||!w.session||!api()||$('weekendPanel')?.classList.contains('hidden'))return;
 if(!overlay)build();current=w;stage=w.session;focusSource=$('weekendActions')?.querySelector('.primary');
 const p=getPlan();overlay.hidden=false;
 $('apex9bTitle').textContent='PREPARACIÓN · '+NAMES[stage];
 $('apex9bSubtitle').textContent=w.mode==='season'?'TEMPORADA · RONDA '+(w.round+1):'GRAN PREMIO · FIN DE SEMANA';
 $('apex9bCircuit').textContent=w.spec.name;
 $('apex9bEventInfo').textContent=w.mode==='season'?'Campeonato · Ronda '+(w.round+1):'Gran Premio independiente';
 const gridPos=Array.isArray(w.gridOrder)?w.gridOrder.indexOf('PLAYER')+1:0;
 $('apex9bStageInfo').textContent='Sesión '+(w.sessionIndex+1)+' de 5'+(stage==='race'?' · '+w.racePercentage+' % · '+w.raceLaps+' vueltas'+(gridPos>0?' · Parrilla P'+gridPos:''):'');
 const svg=$('apex9bTrackSvg');svg.replaceChildren();
 const available=$('gpCircuitInfo')?.querySelector('svg')||$('seasonCircuitInfo')?.querySelector('svg');
 if(available)svg.appendChild(available.cloneNode(true));
 updateTyres();renderStrategy();refreshWeather();
 $('apex9bClose').focus();
}
function close(restore){
 if(!overlay)return;overlay.hidden=true;current=null;stage=null;
 if(restore&&focusSource?.isConnected&&!focusSource.disabled)focusSource.focus({preventScroll:true});
}
function launch(){
 const w=snapshot();if(!current||!w||w.mode!==current.mode||w.spec.dir!==current.spec.dir||w.session!==stage)return;
 if($('apex9bLaunch').disabled)return;
 save();close();
 const native=$('weekendActions')?.querySelector('.btn.primary');
 if(!native||native.disabled)return;
 releaseBypass=true;try{native.click()}finally{releaseBypass=false}
}
function renderHub(){
 const w=snapshot(),panel=$('weekendPanel'),cards=$('weekendStages');
 if(!w||!panel||panel.classList.contains('hidden')||!cards)return;
 Array.from(cards.querySelectorAll('.sessionStage')).forEach((card,i)=>{
  const s=STAGES[i];if(!s)return;
  const f=api()?.forecast(ctx(w),s),p=api()?.getPlan(ctx(w),s);
  if(!f||!p)return;
  const old=card.querySelector('.apex9bHubInfo');if(old)old.remove();
  const line=document.createElement('div');line.className='apex9bHubInfo';
  const rows=w.results?.[s],pos=w.states[s]==='done'&&Array.isArray(rows)?rows.findIndex(r=>r.uid==='PLAYER')+1:0;
  line.textContent=(WEATHER[p.weatherSelection==='auto'?f.preset:p.weatherSelection]||'Variable')+' · '+(COMPS[p.compound]||'Medio')+
   (pos>0?' · Resultado P'+pos:'')+(i===w.sessionIndex?' · PREPARAR':'');
  card.appendChild(line);
 });
 const button=$('weekendActions')?.querySelector('.btn.primary');
 if(button)button.textContent='PREPARAR '+NAMES[w.session];
}
function init(){
 const actions=$('weekendActions'),stages=$('weekendStages'),panel=$('weekendPanel');
 if(!actions||!stages||!panel)return;
 actions.addEventListener('click',e=>{
  const trigger=e.target.closest('.btn.primary');
  if(!trigger||releaseBypass||panel.classList.contains('hidden'))return;
  e.preventDefault();e.stopImmediatePropagation();show();
 },true);
 new MutationObserver(renderHub).observe(stages,{childList:true});
 new MutationObserver(renderHub).observe(panel,{attributes:true,attributeFilter:['class']});
 renderHub();
}
global.ApexSessionPreparation9B=Object.freeze({open:show,isOpen:()=>!!overlay&&!overlay.hidden,refresh:renderHub});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
