/* APEX 9A.3–9A.5: preparación GP/Temporada sobre los botones y guardado NATIVOS.
 * No concede puntos, no inventa carreras ni dispara servicios de boxes automáticos.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const NATIVE_SAVE='apex26canvas-v2', PLAN_KEY='apex26.start-plan.v1';
const WEATHER=[['auto','Automática · simulación estacional'],['CLEAR','Despejado'],['PARTLY','Sol y nubes'],['OVERCAST','Nublado'],['DRIZZLE','Llovizna'],['RAIN','Lluvia'],['STORM','Tormenta'],['VARIABLE','Variable']];
const LABELS={CLEAR:'Despejado',PARTLY:'Sol y nubes',OVERCAST:'Nublado',DRIZZLE:'Llovizna',RAIN:'Lluvia',STORM:'Tormenta',VARIABLE:'Variable'};
const TYRES=[['SOFT','Blando'],['MEDIUM','Medio'],['HARD','Duro'],['INTERMEDIATE','Intermedio'],['WET','Lluvia extrema']];
const STAGES=['FP1','FP2','FP3','CLASIFICACIÓN','CARRERA'];
let panel=null,mode=null,bypass=false,seasonObserver=null;
let musicChoice=null;
function saved(){
 try{const v=JSON.parse(global.localStorage.getItem(NATIVE_SAVE));return v&&v.schema===4?v:null}catch(_){return null}
}
function plan(){
 try{const v=JSON.parse(global.localStorage.getItem(PLAN_KEY));return v&&typeof v==='object'?v:{}}catch(_){return {}}
}
function persistPlan(v){try{global.localStorage.setItem(PLAN_KEY,JSON.stringify(v))}catch(_){}}
function selected(id){const el=$(id);return el?.selectedOptions?.[0]?.textContent?.trim()||el?.value||'—'}
function nativeSnapshot(){try{return global.ApexNativeSeason9A?.snapshot?.()||null}catch(_){return null}}
function seasonRound(){return Math.min(23,Math.max(0,Number(nativeSnapshot()?.round??saved()?.round)||0))}
function currentCircuit(){
 if(mode==='grandprix'){
  const el=$('gpTrack');return {dir:el?.value||'',name:selected('gpTrack'),r:0};
 }
 const direct=nativeSnapshot()?.nextCircuit;
 if(direct)return direct;
 const event=document.querySelector('#schedule .event.current');
 return {dir:'',name:event?.querySelector('.small')?.textContent?.trim()||$('seasonStatus')?.textContent||'Próximo GP',r:seasonRound()+1};
}
function fmtTyre(v){return TYRES.find(t=>t[0]===String(v).toUpperCase())?.[1]||'Medio'}
function tyreValue(){
 const native=$('menuTyreCompound');
 return String(native?.value||'MEDIUM').toUpperCase();
}
function classification(saveData){
 const scores=Object.entries(saveData?.points||{}).filter(([_,p])=>Number.isFinite(+p)).map(([id,p])=>({id,points:+p}));
 scores.sort((a,b)=>b.points-a.points||a.id.localeCompare(b.id));
 return scores;
}
function seasonMarkup(){
 const native=saved(),official=nativeSnapshot(),round=seasonRound();
 const score=official?.drivers?.length?official.drivers:
  classification(native).map(d=>({driverId:d.id,name:d.id==='PLAYER'?'TÚ':d.id,points:d.points}));
 const history=Array.isArray(official?.history)?official.history:Array.isArray(native?.seasonHistory9A)?native.seasonHistory9A:[];
 const rows=score.slice(0,12).map((d,i)=>'<tr><td>'+(i+1)+'</td><td>'+escapeHtml(d.name||d.driverId)+'</td><td>'+d.points+'</td></tr>').join('');
 const teams=(official?.constructors||[]).slice(0,12).map((d,i)=>'<tr><td>'+(i+1)+'</td><td>'+escapeHtml(d.name||d.teamId)+'</td><td>'+d.points+'</td></tr>').join('');
 const last=history[history.length-1];
 const lastText=last?'Último GP registrado: '+(last.source==='simulated'?'simulado':'disputado')+
  ' · '+(last.classification||[]).length+' clasificados.':'El historial detallado comienza con las próximas carreras; se conservan los puntos anteriores.';
 return '<div class="apex9aChampInfo"><b>CAMPEONATO NATIVO · '+round+'/23 GP</b><p>'+
  escapeHtml($('seasonStatus')?.textContent||'')+'</p><div class="apex9aProgress"><i style="width:'+(100*round/23).toFixed(1)+'%"></i></div>'+
  '<h4>PILOTOS</h4><table><thead><tr><th>POS.</th><th>PILOTO</th><th>PTS</th></tr></thead><tbody>'+rows+'</tbody></table>'+
  (teams?'<h4>CONSTRUCTORES</h4><table><thead><tr><th>POS.</th><th>EQUIPO</th><th>PTS</th></tr></thead><tbody>'+teams+'</tbody></table>':'')+
  '<p class="apex9aFootnote">'+escapeHtml(lastText)+'</p></div>';
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));}
function build(){
 panel=document.createElement('section');panel.id='apex9aCompetitionSetup';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.setAttribute('aria-labelledby','apex9aCompTitle');
 panel.innerHTML='<div class="apex9aPrepShell apex9aCompetitionShell">'+
  '<header class="apex9aPrepHead"><div><small>APEX FORMULA 26 · COMPETICIÓN</small><h2 id="apex9aCompTitle"></h2></div><button id="apex9aCompClose" type="button" aria-label="Volver">×</button></header>'+
  '<div class="apex9aStages">'+STAGES.map(s=>'<span>'+s+'</span>').join('')+'</div>'+
  '<div class="apex9aPrepColumns">'+
  '<section class="apex9aPrepCard"><h3>01 · CIRCUITO Y CAMPEONATO</h3><strong id="apex9aCompCircuit"></strong><div id="apex9aCompProgress"></div><p>Escudería: <b id="apex9aCompTeam"></b></p><p>Distancia: <b id="apex9aCompDistance"></b></p><div class="apex9aVehicleVisual"><img src="assets/9a/race-vehicle.webp" alt="Monoplaza APEX 26"></div></section>'+
  '<section class="apex9aPrepCard apex9aWeatherCard"><h3>02 · METEOROLOGÍA</h3><label for="apex9aCompWeather">Condición al comenzar el fin de semana</label><select id="apex9aCompWeather"></select><strong id="apex9aCompWeatherResult"></strong><p id="apex9aCompForecast"></p><div class="apex9aTrackStateArt"><img src="assets/9a/track-state-thumb.webp" alt="Superficie de pista"></div><p class="apex9aFootnote">Previsión simulada, no servicio meteorológico en tiempo real. El preset elegido se transmite al motor de APEX.</p></section>'+
  '<section class="apex9aPrepCard"><h3>03 · NEUMÁTICOS Y ESTRATEGIA</h3><div id="apex9aCompTyres" class="apex9aTyreGrid"></div><label for="apex9aCompStrategy">Estilo de estrategia</label><select id="apex9aCompStrategy"><option value="aggressive">Agresiva</option><option value="balanced">Equilibrada</option><option value="conservative">Conservadora</option></select><label for="apex9aCompStops">Paradas previstas</label><select id="apex9aCompStops"><option value="0">0 (solo previsión)</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select><p id="apex9aCompAdvice" class="apex9aAdvice"></p><p class="apex9aFootnote">Se configura el compuesto inicial real. El plan de paradas es orientativo; la solicitud y servicio de boxes siguen en el motor de carrera.</p></section>'+
  '</div><footer class="apex9aPrepActions"><button id="apex9aCompCancel" type="button">VOLVER</button><button id="apex9aCompLaunch" type="button">CONTINUAR AL GP ›</button></footer></div>';
 document.body.appendChild(panel);
 $('apex9aCompClose').onclick=close;$('apex9aCompCancel').onclick=close;
 $('apex9aCompWeather').innerHTML=WEATHER.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('');
 $('apex9aCompWeather').onchange=renderWeather;
 $('apex9aCompStrategy').onchange=renderAdvice;
 $('apex9aCompStops').onchange=renderAdvice;
 $('apex9aCompLaunch').onclick=launch;
 panel.addEventListener('click',e=>{if(e.target===panel)close();});
 document.addEventListener('keydown',e=>{if(!panel.hidden&&e.key==='Escape'){e.stopPropagation();close();}},true);
 const menu=$('menu');
 if(menu)new MutationObserver(()=>{if(menu.classList.contains('hidden'))close();}).observe(menu,{attributes:true,attributeFilter:['class']});
}
function open(which,viewOnly=false){
 if(which!=='grandprix'&&which!=='season')return;
 if(!panel)build();
 mode=which;panel.hidden=false;
 const state=global.ApexCompetition9A?.get?.(),p=plan();
 const nativeWeather=which==='grandprix'?$('gpWeather')?.value:null;
 $('apex9aCompWeather').value=state?.mode===(which==='grandprix'?'grand-prix':'season')&&state.weather?
  (WEATHER.some(x=>x[0]===state.weather)?state.weather:'auto'):(which==='grandprix'?(nativeWeather||'auto'):'auto');
 $('apex9aCompStrategy').value=['aggressive','balanced','conservative'].includes(p.strategy)?p.strategy:'balanced';
 $('apex9aCompStops').value=String([0,1,2,3].includes(+p.stops)?+p.stops:1);
 $('apex9aCompTitle').textContent=which==='grandprix'?'GRAN PREMIO · FIN DE SEMANA':'TEMPORADA 2026';
 $('apex9aCompProgress').innerHTML=which==='season'?seasonMarkup():
  '<p>Entrenamientos FP1–FP3, clasificación oficial, parrilla y carrera se gestionan mediante el sistema original de fin de semana.</p>';
 $('apex9aCompCircuit').textContent=currentCircuit().name;
 $('apex9aCompTeam').textContent=selected('teamSelect');
 $('apex9aCompDistance').textContent=selected(which==='season'?'seasonDistance':'gpLaps');
 const launch=$('apex9aCompLaunch');
 launch.disabled=!!viewOnly||(which==='season'&&seasonRound()>=23);
 launch.textContent=viewOnly?'VER CLASIFICACIÓN':'ABRIR FIN DE SEMANA ›';
 drawTyres();renderWeather();renderAdvice();
 $('apex9aCompClose').focus();
}
function drawTyres(){
 const target=$('apex9aCompTyres'),native=$('menuTyreCompound');target.replaceChildren();
 if(!native)return;
 const val=tyreValue();
 for(const [code,label] of TYRES){
  const opt=Array.from(native.options).find(o=>String(o.value).toUpperCase()===code);
  if(!opt)continue;
  const b=document.createElement('button');b.type='button';b.className='apex9aTyre'+(val===code?' selected':'');
  b.dataset.compound=opt.value;b.setAttribute('aria-pressed',String(val===code));
  const img=document.createElement('img');img.src='assets/9a/tyre-'+code.toLowerCase()+'.webp';img.alt='';img.loading='lazy';
  const span=document.createElement('span');span.className='apex9aTyreVisual';span.appendChild(img);
  const name=document.createElement('b');name.textContent=label;b.append(span,name);target.appendChild(b);
  b.onclick=()=>{native.value=opt.value;native.dispatchEvent(new Event('change',{bubbles:true}));drawTyres();renderAdvice();};
 }
 $('apex9aCompLaunch').disabled=$('apex9aCompLaunch').disabled||target.children.length===0;
}
function forecast(){
 const s=currentCircuit();
 return global.ApexClimate9A?.forecast(s,mode==='season'?seasonRound():0)||{preset:'VARIABLE',label:'Variable',disclaimer:'Sin estimación disponible.'};
}
function renderWeather(){
 const v=$('apex9aCompWeather').value,estimate=forecast();
 const resolved=v==='auto'?estimate.preset:v;
 $('apex9aCompWeatherResult').textContent=LABELS[resolved]||estimate.label;
 $('apex9aCompForecast').textContent=v==='auto'?
  'Modo automático: '+estimate.disclaimer:'Condición elegida manualmente para el motor meteorológico nativo.';
 renderAdvice();
}
function renderAdvice(){
 if(!panel||panel.hidden)return;
 const weather=$('apex9aCompWeather').value,resolved=weather==='auto'?forecast().preset:weather;
 const p=$('apex9aCompStrategy').value,stops=+$('apex9aCompStops').value;
 const proposed=['RAIN','STORM'].includes(resolved)?'WET':resolved==='DRIZZLE'?'INTERMEDIATE':'MEDIUM';
 $('apex9aCompAdvice').textContent='Recomendación inicial: '+fmtTyre(proposed)+
  '. Plan '+({aggressive:'agresivo',balanced:'equilibrado',conservative:'conservador'}[p]||'equilibrado')+
  ' · '+stops+' parada'+(stops===1?'':'s')+' previstas. El siguiente compuesto se prepara en el servicio de boxes real; la solicitud de entrada sigue siendo manual o AUT.';
}
function launch(){
 if(!mode)return;
 const target=mode==='grandprix'?'gpStart':'nextSeason',native=$(target);
 if(!native||native.disabled)return;
 const weather=$('apex9aCompWeather').value,
  resolved=global.ApexClimate9A?.resolvePreset(currentCircuit(),mode==='season'?seasonRound():0,weather)||
   (weather==='auto'?'VARIABLE':weather);
 if(mode==='grandprix'&&$('gpWeather')){$('gpWeather').value=resolved;$('gpWeather').dispatchEvent(new Event('change',{bubbles:true}));}
 const t=tyreValue(),strategy=$('apex9aCompStrategy').value,stops=+$('apex9aCompStops').value;
 const next=stops===0?t:
  ['RAIN','STORM'].includes(resolved)?'WET':resolved==='DRIZZLE'?'INTERMEDIATE':
  strategy==='aggressive'?'SOFT':strategy==='conservative'?'HARD':t==='SOFT'?'MEDIUM':'HARD';
 // 8B lee esta misma preferencia al crear al jugador; el servicio físico sigue siendo nativo.
 try{global.localStorage.setItem('apex26.tyre.next.v1',next)}catch(_){}
 persistPlan({strategy,stops,weather,compound:t,nextCompound:next,mode});
 global.ApexCompetition9A?.select?.({mode:mode==='grandprix'?'grand-prix':'season',
  circuitId:mode==='grandprix'?String($('gpTrack')?.value||'')||null:null,
  teamId:String($('teamSelect')?.value||'')||null,
  distance:Number($(mode==='season'?'seasonDistance':'gpLaps')?.value)||100,
  weather,tyre:t.toLowerCase(),strategy});
 close();bypass=true;
 try{native.click()}finally{bypass=false}
}
function close(){if(panel)panel.hidden=true;mode=null;}
function init(){
 for(const [name,id] of [['grandprix','gpStart'],['season','nextSeason']]){
  const btn=$(id);if(!btn)continue;
  btn.addEventListener('click',e=>{
   if(bypass||e.defaultPrevented)return;
   e.preventDefault();e.stopImmediatePropagation();open(name);
  },true);
 }
 const season=$('season');
 if(season&&!$('apex9aSeasonStandings')){
  const show=document.createElement('button');show.type='button';show.id='apex9aSeasonStandings';
  show.className='btn';show.textContent='VER CLASIFICACIÓN Y PRÓXIMO GP';
  show.onclick=()=>open('season',seasonRound()>=23);
  season.prepend(show);
 }
 document.addEventListener('apex:native-season-save',()=>{if(panel&&!panel.hidden&&mode==='season')$('apex9aCompProgress').innerHTML=seasonMarkup()});
}
global.ApexCompetitionFlows9A=Object.freeze({open,close,readNativeSeason:saved});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
