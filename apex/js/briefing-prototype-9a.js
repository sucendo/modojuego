/* APEX Formula 26 · 9A.9 — Maquetación de preparación del prototipo aprobado.
 * Decoración progresiva: mantiene los controles, handlers, IDs y lanzadores nativos
 * creados por preparation-9a.js y competition-flows-9a.js.
 * Nunca inventar temperaturas, records, pronósticos ni paradas efectivas.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const COMPS=[
 ['SOFT','BLANDO','Máximo agarre · menor duración'],
 ['MEDIUM','MEDIO','Equilibrio y rendimiento'],
 ['HARD','DURO','Mayor durabilidad'],
 ['INTERMEDIATE','INTERMEDIO','Pista húmeda'],
 ['WET','LLUVIA','Lluvia intensa']
];
const STRATEGIES=[
 ['aggressive','AGRESIVA','Más rendimiento'],
 ['balanced','EQUILIBRADA','Plan estándar'],
 ['conservative','CONSERVADORA','Menos riesgo']
];
function el(tag,cls,text){
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(text!==undefined)node.textContent=text;return node;
}
function by(root,sel){return root.querySelector(sel);}
function makeStat(key,value){
 const cell=el('div','apexBriefStat');
 const name=el('small','',key),result=el('strong','',value);
 cell.append(name,result);return {cell,result};
}
function selectedName(select){return select?.selectedOptions?.[0]?.textContent?.trim()||select?.value||'';}
function setNative(select,value){
 if(!select||select.disabled||!Array.from(select.options).some(o=>o.value===String(value)&&!o.disabled))return;
 select.value=String(value);
 select.dispatchEvent(new Event('change',{bubbles:true}));
}
function syncStrategy(data){
 const select=by(data.root,data.comp?'#apex9aCompStrategy':'#apex9aStrategy');
 if(!select)return;
 data.strategyChips?.querySelectorAll('button').forEach(button=>{
  const selected=button.dataset.value===select.value;
  button.classList.toggle('selected',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
}
function syncDistance(data){
 const select=by(data.root,data.comp?'#apex9aCompDistanceSelect':'#apex9aPrepDistance');
 const visible=!!select&&!select.disabled;
 data.distanceBlock.hidden=!visible;
 if(!visible)return;
 const available=Array.from(select.options).filter(o=>!o.disabled);
 const opts=new Map(available.map(o=>[String(o.value),o]));
 data.distanceChips.querySelectorAll('button').forEach(button=>{
  const value=button.dataset.value;
  button.disabled=!opts.has(value);
  button.classList.toggle('selected',String(select.value)===value);
  button.setAttribute('aria-pressed',String(select.value===value));
 });
}
function makeChoiceChips(options,type){
 const row=el('div','apexBriefChoices apexBrief'+type);
 for(const [value,title,description] of options){
  const b=el('button','apexBriefChoice');b.type='button';b.dataset.value=value;
  b.setAttribute('aria-pressed','false');
  b.append(el('strong','',title));
  if(description)b.append(el('small','',description));
  row.append(b);
 }
 return row;
}
function getMode(data){
 if(!data.comp)return $('apex9aPrepTitle')?.textContent?.includes('ENTRENAMIENTO')?'practice':'quick';
 return $('apex9aCompTitle')?.textContent?.includes('TEMPORADA')?'season':'grandprix';
}
function getWeather(data){
 const label=by(data.root,data.comp?'#apex9aCompWeatherResult':'#apex9aWeatherName');
 return label?.textContent?.trim()||selectedName(by(data.root,data.comp?'#apex9aCompWeather':'#apex9aPrepWeather'))||'Variable';
}
function getTrack(data){
 const name=by(data.root,data.comp?'#apex9aCompCircuit':'#apex9aTrackName');
 return name?.textContent?.trim()||'Circuito seleccionado';
}
function getTeam(data){
 const name=by(data.root,data.comp?'#apex9aCompTeam':'#apex9aTeam');
 return name?.textContent?.trim()||'Escudería seleccionada';
}
function getDistance(data){
 const label=by(data.root,data.comp?'#apex9aCompDistance':'#apex9aDistance');
 return label?.textContent?.trim()||'—';
}
function circuitArt(data,name){
 const mode=getMode(data),track=mode==='grandprix'?$('gpTrack'):mode==='practice'?$('practiceTrack'):$('track');
 const isMonaco=/m[oó]naco|monaco|monte.carlo/i.test(name+' '+(track?.value||''));
 return isMonaco?'assets/9a/prep-monaco.webp':
   mode==='practice'?'assets/9a/race-practice.webp':
   mode==='season'?'assets/9a/race-season.webp':
   mode==='grandprix'?'assets/9a/race-gp.webp':'assets/9a/race-fast.webp';
}
function sync(data){
 if(!data.root.isConnected||data.root.hidden)return;
 const name=getTrack(data),team=getTeam(data),weather=getWeather(data),distance=getDistance(data);
 data.heroTitle.textContent=name.toUpperCase();
 data.heroCaption.textContent=getMode(data)==='season'?'PRÓXIMO EVENTO DEL CAMPEONATO':'CIRCUITO DE LA SESIÓN';
 data.heroPhoto.style.backgroundImage='linear-gradient(0deg,rgba(2,10,18,.5),rgba(2,10,18,.08)),url("'+circuitArt(data,name)+'")';
 data.statMode.textContent=getMode(data)==='practice'?'PRÁCTICA':getMode(data)==='season'?'TEMPORADA':getMode(data)==='grandprix'?'GRAN PREMIO':'CARRERA RÁPIDA';
 data.statDistance.textContent=distance;
 data.statTeam.textContent=team;
 data.weatherTitle.textContent=weather;
 const wet=/lluvia|rain|mojad|húmed|drizzle|torment|storm/i.test(weather);
 data.weatherIcon.textContent=wet?'☂':/nub|cloud|overcast|variable/i.test(weather)?'☁':'☀';
 const surface=by(data.root,'#apex9aSurface');
 data.weatherState.textContent=surface?.textContent?.trim()||
  (wet?'Humedad posible':'Según el motor meteorológico');
 const isAuto=by(data.root,data.comp?'#apex9aCompWeather':'#apex9aPrepWeather')?.value==='auto';
 data.weatherOrigin.textContent=isAuto?'ESTIMACIÓN SIMULADA':'SELECCIÓN MANUAL';
 data.heroStrip.textContent=getMode(data)==='season'?'CAMPEONATO EN CURSO':'APEX FORMULA 26';
 data.vehicleImage.src='assets/9a/team-'+String(Math.max(1,Math.min(12,($('teamSelect')?.selectedIndex??0)+1))).padStart(2,'0')+'.webp';
 data.vehicleImage.alt='Monoplaza de '+team;
 syncDistance(data);syncStrategy(data);
 data.root.querySelectorAll('.apex9aTyre').forEach(button=>{
  const compound=String(button.dataset.compound||'').toUpperCase();
  const item=COMPS.find(x=>x[0]===compound);
  if(item&&!button.querySelector('.apexBriefTyreDescription')){
   button.append(el('small','apexBriefTyreDescription',item[2]));
  }
 });
 data.recommendLabel.textContent=getMode(data)==='practice'?'RECOMENDACIÓN DE ENTRENAMIENTO':'RECOMENDACIÓN DE ESTRATEGIA';
}
function decorate(root){
 if(!root||root.dataset.briefingProto==='1')return;
 const comp=root.id==='apex9aCompetitionSetup',shell=by(root,'.apex9aPrepShell'),columns=by(root,'.apex9aPrepColumns');
 const cards=columns?.querySelectorAll(':scope > .apex9aPrepCard');
 if(!shell||!cards||cards.length!==3)return;
 root.dataset.briefingProto='1';
 root.classList.add('apex9aBriefingProto');
 shell.classList.add('apex9aBriefingShell');
 columns.classList.add('apex9aBriefGrid');
 const data={root,comp,shell,columns,cards};
 const head=by(root,'.apex9aPrepHead');
 head.classList.add('apex9aBriefHeader');
 const headSub=el('p','apexBriefSubtitle','REVISA LAS CONDICIONES, ELIGE TU ESTRATEGIA Y SAL A LA PISTA');
 head.querySelector('div')?.append(headSub);
 const close=by(root,comp?'#apex9aCompClose':'#apex9aClose');
 if(close){close.textContent='← TIPO DE CARRERA';close.setAttribute('aria-label','Volver al tipo de carrera');}

 // Panel 1: ficha GP, fotografía contextual, datos reales del menú y monoplaza.
 const trackCard=cards[0];trackCard.classList.add('apex9aBriefCircuitCard');
 const trackHead=by(trackCard,'h3');trackHead.textContent='CIRCUITO / GRAN PREMIO';
 const heroTitleRow=el('div','apexBriefTrackHeading');
 heroTitleRow.append(el('span','apexBriefBadge','A26'));
 const heading=el('div','apexBriefHeadingCopy');
 data.heroTitle=el('strong','apexBriefTrackTitle','CIRCUITO');
 data.heroCaption=el('small','apexBriefTrackCaption','CIRCUITO DE LA SESIÓN');
 heading.append(data.heroTitle,data.heroCaption);heroTitleRow.append(heading);
 trackHead.after(heroTitleRow);
 data.heroPhoto=el('div','apexBriefHeroPhoto');
 heroTitleRow.after(data.heroPhoto);
 const statRow=el('div','apexBriefStatsRow');
 let st=makeStat('MODALIDAD','—');data.statMode=st.result;statRow.append(st.cell);
 st=makeStat('DISTANCIA','—');data.statDistance=st.result;statRow.append(st.cell);
 st=makeStat('ESCUDERÍA','—');data.statTeam=st.result;statRow.append(st.cell);
 data.heroPhoto.after(statRow);
 const strip=el('div','apexBriefTrackStrip');
 strip.append(el('span','','APEX 26'),data.heroStrip=el('span','',''));
 trackCard.append(strip);
 const originalCar=by(trackCard,'.apex9aVehicleVisual img');
 if(originalCar){data.vehicleImage=originalCar;originalCar.loading='lazy';originalCar.style.objectFit='contain';}
 else{
  const car=el('div','apex9aVehicleVisual');data.vehicleImage=el('img');car.append(data.vehicleImage);trackCard.append(car);
 }
 // Panel 2: banners meteorológicos + información sin números ficticios.
 const weatherCard=cards[1];weatherCard.classList.add('apex9aBriefWeatherCard');
 by(weatherCard,'h3').textContent='CONDICIONES METEOROLÓGICAS';
 const banner=el('div','apexBriefWeatherBanner');
 data.weatherIcon=el('span','apexBriefWeatherIcon','☀');
 const bcopy=el('div','');
 bcopy.append(el('small','','CONDICIÓN ACTUAL DE LA SESIÓN'),data.weatherTitle=el('strong','','Variable'));
 banner.append(data.weatherIcon,bcopy);
 const weatherHead=by(weatherCard,'h3');weatherHead.after(banner);
 const weatherGrid=el('div','apexBriefWeatherData');
 let w=makeStat('ORIGEN DEL CLIMA','—');data.weatherOrigin=w.result;weatherGrid.append(w.cell);
 w=makeStat('ESTADO ESTIMADO DE PISTA','—');data.weatherState=w.result;weatherGrid.append(w.cell);
 banner.after(weatherGrid);

 // Panel 3: neumáticos gráficos, estrategias y distancia, sin reemplazar controles.
 const setup=cards[2];setup.classList.add('apex9aBriefSetupCard');
 by(setup,'h3').textContent='ELECCIÓN DE NEUMÁTICOS';
 const tyreGrid=by(setup,'.apex9aTyreGrid');tyreGrid.classList.add('apex9aBriefTyres');
 const strategy=by(setup,comp?'#apex9aCompStrategy':'#apex9aStrategy');
 if(strategy){
  const section=el('div','apexBriefStrategySection');
  section.append(el('h3','','ESTRATEGIA DE CARRERA'));
  data.strategyChips=makeChoiceChips(STRATEGIES,'Strategies');
  section.append(data.strategyChips);
  const anchor=comp?strategy.closest('label')||strategy:by(setup,'#apex9aStrategyRow');
  // Mantener el select original (y sus handlers) visible para accesibilidad/pruebas.
  if(comp){const previous=strategy.previousElementSibling; if(previous?.tagName==='LABEL')previous.before(section);else strategy.before(section);}
  else anchor.before(section);
  data.strategyChips.addEventListener('click',e=>{
   const btn=e.target.closest('button[data-value]');if(!btn)return;
   setNative(strategy,btn.dataset.value);sync(data);
  });
 }
 const distance=by(root,comp?'#apex9aCompDistanceSelect':'#apex9aPrepDistance');
 data.distanceBlock=el('section','apexBriefDistanceSection');
 data.distanceBlock.append(el('h3','','DISTANCIA DE CARRERA'));
 data.distanceChips=makeChoiceChips([['25','25%'],['50','50%'],['75','75%'],['100','100%']],'Distance');
 data.distanceBlock.append(data.distanceChips);
 data.distanceChips.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-value]');if(!btn)return;
  setNative(distance,btn.dataset.value);sync(data);
 });
 const advice=by(setup,comp?'#apex9aCompAdvice':'#apex9aAdvice');
 advice?.before(data.distanceBlock);
 if(distance)distance.addEventListener('change',()=>sync(data));
 if(strategy)strategy.addEventListener('change',()=>sync(data));
 const recommendation=el('div','apexBriefRecTitle');
 recommendation.append(el('span','apexBriefBars','▂▄▆█'));
 data.recommendLabel=el('strong','','RECOMENDACIÓN');
 advice?.before(recommendation);
 advice?.classList.add('apex9aBriefRecommendation');
 const launch=by(root,comp?'#apex9aCompLaunch':'#apex9aLaunch');
 if(launch)launch.classList.add('apex9aBriefStart');
 const weatherSelect=by(root,comp?'#apex9aCompWeather':'#apex9aPrepWeather');
 weatherSelect?.addEventListener('change',()=>queueMicrotask(()=>sync(data)));
 const trackSelect=by(root,comp?'#apex9aCompCircuitSelect':'#apex9aPrepCircuit');
 trackSelect?.addEventListener('change',()=>queueMicrotask(()=>sync(data)));
 const teamSelect=by(root,comp?'#apex9aCompTeamSelect':'#apex9aPrepTeam');
 teamSelect?.addEventListener('change',()=>queueMicrotask(()=>sync(data)));
 // Observar exclusivamente los textos que recalculan los módulos 9A; no observar
 // el contenedor completo, para evitar bucles causados por el propio decorador.
 for(const id of (comp?['apex9aCompCircuit','apex9aCompWeatherResult','apex9aCompDistance','apex9aCompTeam']:
 ['apex9aTrackName','apex9aWeatherName','apex9aDistance','apex9aTeam','apex9aSurface'])){
  const node=$(id);
  if(node)new MutationObserver(()=>{if(!root.hidden)sync(data);})
   .observe(node,{childList:true,characterData:true,subtree:true});
 }
 // Se reconstruyen los botones de neumáticos en cada actualización del motor.
 const tyreContainer=by(setup,'.apex9aTyreGrid');
 if(tyreContainer)new MutationObserver(()=>{if(!root.hidden)sync(data);})
   .observe(tyreContainer,{childList:true});
 new MutationObserver(()=>{if(!root.hidden)queueMicrotask(()=>sync(data));})
  .observe(root,{attributes:true,attributeFilter:['hidden']});
 queueMicrotask(()=>sync(data));
}
function init(){
 const observe=new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes){
   if(node.nodeType!==1)continue;
   if(node.matches?.('#apex9aPreparation,#apex9aCompetitionSetup'))decorate(node);
  }
 });
 observe.observe(document.body,{childList:true});
 decorate($('apex9aPreparation'));decorate($('apex9aCompetitionSetup'));
}
global.ApexBriefingPrototype9A=Object.freeze({decorate});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
