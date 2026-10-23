/* APEX 26 · 9A.8 · Menús visuales basados en el ZIP aprobado (22/10/2026).
 * Los controles de circuito/escudería/meteorología/distancia y los lanzadores
 * siguen siendo los originales. Este módulo no crea carreras ni modifica el motor.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const MODES=[
 {key:'quick',title:'CARRERA RÁPIDA',desc:'Una carrera a tu medida. Salta a la pista y compite al instante.',art:'race-fast',nativeTrack:'track',nativeWeather:'weather',nativeDistance:'laps'},
 {key:'grandprix',title:'GRAN PREMIO',desc:'Vive un fin de semana completo con todas sus sesiones.',art:'race-gp',nativeTrack:'gpTrack',nativeWeather:'gpWeather',nativeDistance:'gpLaps'},
 {key:'season',title:'TEMPORADA',desc:'Compite durante toda la temporada 2026 y haz historia.',art:'race-season',nativeTrack:null,nativeWeather:'gpWeather',nativeDistance:'seasonDistance'},
 {key:'practice',title:'ENTRENAMIENTO',desc:'Perfecciona tus habilidades y conoce los circuitos.',art:'race-practice',nativeTrack:'practiceTrack',nativeWeather:'practiceWeather',nativeDistance:null}
];
let menu,landing,modes,options,back,selectedMode='quick',page='home',advancedFrom='options',observer;
const change=el=>el?.dispatchEvent(new Event('change',{bubbles:true}));
const encode=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mode=()=>MODES.find(m=>m.key===selectedMode)||MODES[0];
function setNativeValue(el,value){
 if(!el||el.disabled)return false;
 if(!Array.from(el.options||[]).some(o=>!o.disabled&&o.value===value))return false;
 el.value=value;change(el);return true;
}
function nativeTrack(){return $(mode().nativeTrack);}
function chosenCircuitName(){
 const sel=nativeTrack();
 if(sel?.selectedOptions?.[0])return sel.selectedOptions[0].textContent.trim();
 return selectedMode==='season'?( $('seasonStatus')?.textContent.trim()||'Circuito del próximo GP'):'Selecciona un circuito';
}
function mirrorSelect(destination,original,emptyLabel){
 const old=destination.value;
 destination.replaceChildren();
 if(!original||!original.options?.length){
  const option=new Option(emptyLabel||'Se determina en el campeonato','');
  destination.add(option);destination.disabled=true;return;
 }
 for(const opt of original.options){
  if(!opt.value||opt.hidden)continue;
  const copy=new Option(opt.textContent,opt.value,opt.defaultSelected,opt.selected);
  copy.disabled=opt.disabled;destination.add(copy);
 }
 destination.disabled=!!original.disabled||destination.options.length===0;
 if(Array.from(destination.options).some(o=>o.value===original.value))destination.value=original.value;
 else if(Array.from(destination.options).some(o=>o.value===old))destination.value=old;
}
function teamNumber(){
 const n=$('teamSelect');
 const i=n?.selectedIndex??0;
 return String(Math.max(1,Math.min(12,i+1))).padStart(2,'0');
}
function updateModeVisual(){
 const m=mode();
 modes.querySelectorAll('[data-apex-mode]').forEach(button=>{
  const active=button.dataset.apexMode===selectedMode;
  button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
 });
 mirrorSelect($('apexProtoCircuit'),nativeTrack(),'Circuito fijado por el calendario');
 mirrorSelect($('apexProtoTeam'),$('teamSelect'),'Selecciona una escudería');
 const team=$('teamSelect');
 const teamName=team?.selectedOptions?.[0]?.textContent?.trim()||'APEX Racing';
 $('apexProtoTeamTitle').textContent=teamName.toUpperCase();
 $('apexProtoTeamSub').textContent='MONOPLAZA · APEX 26';
 $('apexProtoTeamImage').src='assets/9a/team-'+teamNumber()+'.webp';
 $('apexProtoTeamImage').alt='Monoplaza de '+teamName;
 $('apexProtoCircuitName').textContent=chosenCircuitName().toUpperCase();
 $('apexProtoCircuitSubtitle').textContent=selectedMode==='season'?'CALENDARIO OFICIAL 2026':'CIRCUITO SELECCIONADO';
 // Nunca mostrar datos o un trazado de Mónaco para otros circuitos.
 const info=selectedMode==='quick'?'quickCircuitInfo':selectedMode==='grandprix'?'gpCircuitInfo':selectedMode==='practice'?'practiceCircuitInfo':null;
 const summary=$(info)?.textContent?.replace(/\s+/g,' ').trim();
 $('apexProtoCircuitInfo').textContent=(summary||'Información del circuito disponible al configurar la sesión').slice(0,190);
 $('apexProtoCircuitControl').hidden=selectedMode==='season';
 $('apexProtoCircuitLocked').hidden=selectedMode!=='season';
 const distance=$(m.nativeDistance);
 $('apexProtoDistanceControl').hidden=!distance;
 modes.querySelectorAll('[data-apex-distance]').forEach(b=>{
  const active=!!distance&&String(distance.value)===b.dataset.apexDistance;
  b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));
  b.disabled=!distance||!Array.from(distance.options).some(o=>o.value===b.dataset.apexDistance);
 });
 const weather=$(m.nativeWeather);
 modes.querySelectorAll('[data-apex-weather]').forEach(b=>{
  const val=b.dataset.apexWeather;
  b.disabled=val!=='auto'&&(!weather||!Array.from(weather.options).some(o=>o.value===val));
  const saved=global.ApexCompetition9A?.get?.();
  const active=val==='auto'?saved?.mode===(selectedMode==='grandprix'?'grand-prix':selectedMode)&&saved?.weather==='auto':weather?.value===val&&!(saved?.mode===(selectedMode==='grandprix'?'grand-prix':selectedMode)&&saved?.weather==='auto');
  b.classList.toggle('selected',!!active);b.setAttribute('aria-pressed',String(!!active));
 });
 $('apexProtoNext').textContent=selectedMode==='practice'?'PREPARAR ENTRENAMIENTO  ❯❯':
  selectedMode==='season'?'CONTINUAR TEMPORADA  ❯❯':'METEOROLOGÍA Y ESTRATEGIA  ❯❯';
}
function chooseMode(key){
 if(!MODES.some(m=>m.key===key))return;
 selectedMode=key;
 document.querySelector('#menuModeTabs [data-t="'+key+'"]')?.click();
 updateModeVisual();
}
function show(which){
 if(!menu||menu.classList.contains('hidden'))return;
 page=which;menu.classList.add('apex9aPrototype');
 landing.hidden=which!=='home';
 modes.hidden=which!=='modes';options.hidden=which!=='options';
 back.hidden=true;
 if(which==='modes')updateModeVisual();
 if(which==='options')syncOptions();
 const focus=which==='home'?'apex9aRace':which==='modes'?'apexProtoModeBack':'apexProtoOptionsBack';
 $(focus)?.focus({preventScroll:true});
}
function advanced(dock,from){
 advancedFrom=from||page;
 page='advanced';
 menu.classList.remove('apex9aPrototype','apex9aLandingMode');
 menu.classList.add('apex9aModes');
 landing.hidden=true;modes.hidden=true;options.hidden=true;back.hidden=false;
 if(dock==='help')$('controlsTab')?.click();
 else {
  const el=$(dock);
  if(el){el.open=true;el.scrollIntoView({block:'start',behavior:'instant'});}
 }
}
function next(){
 // La preparación 9A ya disponible es la responsable de aplicar clima,
 // neumáticos y estrategia a los selectores originales del simulador.
 const m=mode();
 const api=(selectedMode==='quick'||selectedMode==='practice')?global.ApexPreparation9A:global.ApexCompetitionFlows9A;
 const target=(selectedMode==='quick'||selectedMode==='practice')?m.key:(m.key==='grandprix'?'grandprix':'season');
 if(api?.open){api.open(target);return;}
 // Degradación segura: acceder a controles reales, nunca simular una carrera.
 advanced(null,'modes');
}
function stepSelect(el,direction){
 if(!el||el.disabled)return;
 const choices=Array.from(el.options).filter(o=>!o.disabled&&o.value);
 if(choices.length<2)return;
 let idx=choices.findIndex(o=>o.value===el.value);
 idx=(idx+direction+choices.length)%choices.length;
 setNativeValue(el,choices[idx].value);
}
function makeHome(){
 landing.innerHTML='<img class="apexProtoHomeLogo" src="assets/9a/logo-apex26.webp" alt="APEX 26 Formula Racing">'+
 '<div class="apexProtoMotto">AUTÉNTICA<br>COMPETICIÓN.<br>SIN LÍMITES.</div>'+
 '<nav class="apexProtoHomeActions" aria-label="Opciones principales">'+
 '<button class="apexProtoMainAction primary" id="apex9aRace" type="button"><span aria-hidden="true">⚑</span><strong>TIPO DE CARRERA</strong><span>❯❯</span></button>'+
 '<button class="apexProtoMainAction secondary" id="apex9aOptions" type="button"><span aria-hidden="true">⚙</span><strong>OPCIONES</strong><span>❯❯</span></button></nav>'+
 '<footer class="apexProtoBottomBar"><nav class="apexProtoBottomLinks">'+
 '<button id="apex9aProfile" type="button">♟ <span>PERFIL<small>Piloto</small></span></button>'+
 '<button id="apex9aAudio" type="button">♫ <span>MÚSICA</span></button>'+
 '<button id="apex9aHelp" type="button">ⓘ <span>AYUDA</span></button>'+
 '<button id="apex9aCredits" type="button">▣ <span>CRÉDITOS</span></button>'+
 '</nav><div class="apexProtoSlogan">DRIVE<br>BEYOND</div></footer>';
 $('apex9aRace').addEventListener('click',()=>show('modes'));
 $('apex9aOptions').addEventListener('click',()=>show('options'));
 $('apex9aProfile').addEventListener('click',()=>advanced('teamGarage','home'));
 $('apex9aAudio').addEventListener('click',()=>global.ApexMenuMusic9A?.toggle());
 $('apex9aHelp').addEventListener('click',()=>advanced('help','home'));
 $('apex9aCredits').addEventListener('click',()=>global.alert('APEX Formula 26 · Sucendo'));
}
function makeModes(){
 modes=document.createElement('section');modes.id='apex9aModesScreen';modes.hidden=true;
 modes.setAttribute('aria-label','Tipo de carrera');
 modes.innerHTML='<div class="apexProtoRaceShell">'+
 '<header class="apexProtoTop"><button id="apexProtoModeBack" type="button">‹ VOLVER</button><span>02</span><small>APEX 26 // RACE SELECTION</small></header>'+
 '<div class="apexProtoTitle"><h1>TIPO DE CARRERA</h1><p>ELIGE TU FORMA DE VIVIR APEX FORMULA 26</p></div>'+
 '<div class="apexProtoModeCards">'+MODES.map(m=>
 '<button class="apexProtoModeCard" type="button" data-apex-mode="'+m.key+'" aria-pressed="false">'+
 '<span class="apexProtoModePicture" style="background-image:url(assets/9a/'+m.art+'.webp)"></span>'+
 '<span class="apexProtoModeCopy"><strong>'+m.title+'</strong><small>'+m.desc+'</small></span></button>').join('')+'</div>'+
 '<div class="apexProtoDetails">'+
 '<article class="apexProtoCircuitPanel"><h2>CIRCUITO</h2><div class="apexProtoCircuitScene"></div>'+
 '<div class="apexProtoCircuitText"><strong id="apexProtoCircuitName"></strong><small id="apexProtoCircuitSubtitle"></small></div>'+
 '<div class="apexProtoCircuitInfo" id="apexProtoCircuitInfo"></div>'+
 '<div class="apexProtoCircuitPicker" id="apexProtoCircuitControl"><button id="apexProtoPrevCircuit" type="button" aria-label="Circuito anterior">‹</button><select id="apexProtoCircuit" aria-label="Circuito"></select><button id="apexProtoNextCircuit" type="button" aria-label="Circuito siguiente">›</button></div>'+
 '<p class="apexProtoLocked" id="apexProtoCircuitLocked" hidden>El circuito de Temporada lo determina el calendario del campeonato.</p>'+
 '<div class="apexProtoChips"><label>CLIMA</label><div>'+
 [['auto','AUTO'],['CLEAR','SOL'],['PARTLY','NUBES'],['RAIN','LLUVIA']].map(x=>'<button type="button" data-apex-weather="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div>'+
 '<div class="apexProtoChips" id="apexProtoDistanceControl"><label>DISTANCIA DE CARRERA</label><div>'+
 [25,50,75,100].map(n=>'<button type="button" data-apex-distance="'+n+'">'+n+'%</button>').join('')+'</div></div>'+
 '</article>'+
 '<article class="apexProtoVehiclePanel"><h2>VEHÍCULO / ESCUDERÍA</h2><div class="apexProtoVehicleScene"></div>'+
 '<div class="apexProtoTeamIdent"><strong id="apexProtoTeamTitle"></strong><small id="apexProtoTeamSub"></small></div>'+
 '<img class="apexProtoTeamArt" id="apexProtoTeamImage" alt="">'+
 '<div class="apexProtoTeamPicker"><button id="apexProtoPrevTeam" type="button" aria-label="Escudería anterior">‹</button><select id="apexProtoTeam" aria-label="Escudería"></select><button id="apexProtoNextTeam" type="button" aria-label="Escudería siguiente">›</button></div>'+
 '<p>MONOPLAZAS DEL SIMULADOR · TEMPORADA 2026</p></article></div>'+
 '<div class="apexProtoRaceFooter"><button id="apexProtoAdvancedModes" type="button">AJUSTES AVANZADOS</button>'+
 '<button id="apexProtoNext" type="button">METEOROLOGÍA Y ESTRATEGIA  ❯❯</button></div></div>';
 menu.appendChild(modes);
 $('apexProtoModeBack').onclick=()=>show('home');
 modes.querySelectorAll('[data-apex-mode]').forEach(b=>b.onclick=()=>chooseMode(b.dataset.apexMode));
 $('apexProtoCircuit').onchange=e=>{setNativeValue(nativeTrack(),e.target.value);updateModeVisual();};
 $('apexProtoTeam').onchange=e=>{setNativeValue($('teamSelect'),e.target.value);updateModeVisual();};
 $('apexProtoPrevCircuit').onclick=()=>{stepSelect(nativeTrack(),-1);updateModeVisual();};
 $('apexProtoNextCircuit').onclick=()=>{stepSelect(nativeTrack(),1);updateModeVisual();};
 $('apexProtoPrevTeam').onclick=()=>{stepSelect($('teamSelect'),-1);updateModeVisual();};
 $('apexProtoNextTeam').onclick=()=>{stepSelect($('teamSelect'),1);updateModeVisual();};
 modes.querySelectorAll('[data-apex-distance]').forEach(b=>b.onclick=()=>{
  setNativeValue($(mode().nativeDistance),b.dataset.apexDistance);updateModeVisual();
 });
 modes.querySelectorAll('[data-apex-weather]').forEach(b=>b.onclick=()=>{
  const value=b.dataset.apexWeather;
  if(value!=='auto')setNativeValue($(mode().nativeWeather),value);
  global.ApexCompetition9A?.select?.({mode:selectedMode==='grandprix'?'grand-prix':selectedMode,weather:value});
  updateModeVisual();
 });
 $('apexProtoAdvancedModes').onclick=()=>advanced(null,'modes');
 $('apexProtoNext').onclick=next;
}
function nativeOptionsSelect(target,source){
 mirrorSelect($(target),$(source),'No disponible en este dispositivo');
}
function syncOptions(){
 nativeOptionsSelect('apexProtoRenderer','rendererSelect');
 nativeOptionsSelect('apexProtoDrive','menuDriveProfile');
 const q=$('renderQuality');const mirror=$('apexProtoQuality');
 mirror.disabled=!q;
 if(q)mirror.value=q.value;
 $('apexProtoQualityText').textContent=q?$('renderQualityLabel')?.textContent||q.value+'%':'Sin ajuste móvil';
 $('apexProtoAudioText').textContent=global.ApexMenuMusic9A?.get()?'MÚSICA ACTIVADA':'ACTIVAR MÚSICA';
}
function makeOptions(){
 options=document.createElement('section');options.id='apex9aOptionsScreen';options.hidden=true;
 options.setAttribute('aria-label','Opciones de APEX 26');
 options.innerHTML='<div class="apexProtoOptionsShell">'+
 '<header class="apexProtoTop"><button id="apexProtoOptionsBack" type="button">← MENÚ PRINCIPAL</button><span>APEX 26 // SYSTEM SETTINGS</span></header>'+
 '<div class="apexProtoTitle"><h1>OPCIONES</h1><p>CONFIGURACIÓN TÉCNICA Y HERRAMIENTAS DEL SIMULADOR</p></div>'+
 '<div class="apexProtoOptionsGrid">'+
 '<section><h2>GRÁFICOS Y RENDIMIENTO</h2><label for="apexProtoRenderer">MOTOR GRÁFICO</label><select id="apexProtoRenderer"></select>'+
 '<label for="apexProtoQuality">CALIDAD GRÁFICA MÓVIL</label><input type="range" min="0" max="100" step="1" id="apexProtoQuality"><p id="apexProtoQualityText"></p>'+
 '<p>El simulador ajusta resolución interna, horizonte, escenario y rivales según su motor actual.</p>'+
 '<button type="button" id="apexProtoGraphicsAdvanced">AJUSTES COMPLETOS DE GRÁFICOS ❯</button></section>'+
 '<section><h2>CONTROLES</h2><label for="apexProtoDrive">AYUDAS DE CONDUCCIÓN</label><select id="apexProtoDrive"></select>'+
 '<p>Conserva teclado, mandos, giroscopio y opciones de conducción del juego.</p>'+
 '<button type="button" id="apexProtoControlsAdvanced">CONTROLES Y CONFIGURACIÓN ❯</button></section>'+
 '<section><h2>CIRCUITOS Y EDITOR</h2><p>Editor SVG/JSON · Inspector 3D · Biblioteca de circuitos · Importación y exportación.</p>'+
 '<button type="button" id="apexProtoOpenEditor">ABRIR HERRAMIENTAS DE CIRCUITOS ❯</button></section>'+
 '<section><h2>AUDIO Y MÚSICA</h2><p>Banda sonora sintética de APEX 26, activada únicamente por elección del usuario.</p>'+
 '<button type="button" id="apexProtoAudioText">ACTIVAR MÚSICA</button>'+
 '<p>La configuración de audio de carrera permanece a cargo del simulador.</p></section></div></div>';
 menu.appendChild(options);
 $('apexProtoOptionsBack').onclick=()=>show('home');
 $('apexProtoRenderer').onchange=e=>setNativeValue($('rendererSelect'),e.target.value);
 $('apexProtoDrive').onchange=e=>setNativeValue($('menuDriveProfile'),e.target.value);
 $('apexProtoQuality').oninput=e=>{const q=$('renderQuality');if(q){q.value=e.target.value;q.dispatchEvent(new Event('input',{bubbles:true}));change(q);}$('apexProtoQualityText').textContent=$('renderQualityLabel')?.textContent||e.target.value+'%';};
 $('apexProtoGraphicsAdvanced').onclick=()=>advanced('menuGraphics','options');
 $('apexProtoControlsAdvanced').onclick=()=>advanced('teamGarage','options');
 $('apexProtoOpenEditor').onclick=()=>advanced('trackEditorDock','options');
 $('apexProtoAudioText').onclick=()=>{global.ApexMenuMusic9A?.toggle();syncOptions();};
}
function init(){
 menu=$('menu');landing=$('apex9aLanding');back=$('apex9aBack');
 if(!menu||!landing||!back||$('apex9aModesScreen'))return;
 makeHome();makeModes();makeOptions();
 back.addEventListener('click',e=>{
  if(page!=='advanced')return;
  e.preventDefault();e.stopImmediatePropagation();show(advancedFrom);
 },true);
 // La vista de selección se reabre al volver del motor, sin impedir acceso a resultados.
 let previousHidden=menu.classList.contains('hidden');
 observer=new MutationObserver(()=>{
  const hidden=menu.classList.contains('hidden');
  if(hidden&&!previousHidden){landing.hidden=true;modes.hidden=true;options.hidden=true;}
  if(!hidden&&previousHidden&&page!=='advanced')show('modes');
  previousHidden=hidden;
 });
 observer.observe(menu,{attributes:true,attributeFilter:['class']});
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||menu.classList.contains('hidden'))return;
  if(page==='modes'||page==='options'){e.preventDefault();show('home');}
  else if(page==='advanced'){e.preventDefault();show(advancedFrom);}
 },false);
 // Los selectores originales siguen siendo la fuente de verdad.
 ['track','gpTrack','practiceTrack','laps','gpLaps','seasonDistance','teamSelect','weather','gpWeather','practiceWeather'].forEach(id=>{
  $(id)?.addEventListener('change',()=>{if(page==='modes')updateModeVisual();});
 });
 chooseMode('quick');show('home');
}
global.ApexMenuPrototype9A=Object.freeze({show,chooseMode,updateModeVisual});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
