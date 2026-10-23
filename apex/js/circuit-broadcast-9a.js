/* APEX 26 · Tarjeta broadcast de circuito sobre el menú 9A/9B.
 * Presentación exclusivamente: los selectores nativos siguen gobernando la carrera.
 * Reutiliza el SVG generado por updateCircuitCard para no duplicar geometría.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const SOURCES={quick:['track','quickCircuitInfo'],grandprix:['gpTrack','gpCircuitInfo'],practice:['practiceTrack','practiceCircuitInfo']};
let panel=null,hero=null,sourcesObserved=false,pending=false;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const titleCase=s=>clean(s).replace(/^\s*(?:R\d{1,2}\s*[·.:–-]\s*)/i,'');
function mode(){
 const active=document.querySelector('#apex9aModesScreen [data-apex-mode].selected');
 return active?.dataset.apexMode||'quick';
}
function metadata(dir){
 if(!dir)return null;
 try{
  if(typeof global.readStoredCircuitJson==='function')return global.readStoredCircuitJson(dir);
 }catch(_){}
 return global.APEX_BASE_CIRCUIT_JSON_BY_ID?.[dir]||null;
}
function resolveCircuit(key){
 const native=SOURCES[key];
 if(key==='season'){
  let next=null;
  try{next=global.ApexNativeSeason9A?.snapshot?.()?.nextCircuit||null}catch(_){}
  const dir=clean(next?.dir);
  const data=metadata(dir);
  return {dir,source:null,label:clean(next?.country||next?.name||'Próximo Gran Premio'),name:clean(next?.name||'Próximo Gran Premio'),data,round:Number(next?.r)||null};
 }
 const select=$(native?.[0]),option=select?.selectedOptions?.[0];
 const label=clean(option?.textContent||'');
 const round=Number(label.match(/^R(\d{1,2})\b/i)?.[1])||null;
 let dir='';
 const base=global.APEX_BASE_CIRCUIT_JSON_BY_ID;
 if(base&&round)dir=Object.keys(base).find(k=>k.startsWith(String(round).padStart(2,'0')+'-'))||'';
 if(!dir&&base){
  const needle=clean(label).toLocaleLowerCase('es');
  dir=Object.keys(base).find(k=> {
   const info=base[k]?.circuit||{};
   return clean(info.name).length>2&&needle.includes(clean(info.name).toLocaleLowerCase('es'));
  })||'';
 }
 return {dir,source:$(native?.[1]),label,name:label.split(/\s*[—–]\s*/).pop()||label,data:metadata(dir),round};
}
function statFromSource(source,label){
 const stats=source?.querySelectorAll('.circuitMeta .stat')||[];
 for(const s of stats){
  if(clean(s.querySelector('span')?.textContent).toLocaleLowerCase('es')===label){
   return clean(s.querySelector('b')?.textContent)||'—';
  }
 }
 return '';
}
function validPreview(source,info){
 if(!source)return false;
 const nativeName=clean(source.querySelector('.circuitHeroText b')?.textContent).toLocaleLowerCase('es');
 if(!nativeName)return false;
 const expected=clean(info.data?.circuit?.name||info.name).toLocaleLowerCase('es');
 return !!expected&&(nativeName===expected||clean(info.label).toLocaleLowerCase('es').includes(nativeName));
}
function drawLayout(source){
 const host=$('apexBroadcastLayout');
 if(!host)return;
 host.replaceChildren();
 const from=source?.querySelector('.trackPreviewBox svg');
 // Esta trayectoria la construye APEX a partir de su geometría SVG/points.
 const route=from?.querySelector('path[stroke="url(#tg)"]');
 const d=route?.getAttribute('d');
 if(!d){
  const text=document.createElement('span');
  text.className='apexBroadcastNoLayout';
  text.textContent='TRAZADO NO DISPONIBLE';
  host.append(text);
  return;
 }
 const svg=document.createElementNS(NS,'svg');
 svg.setAttribute('viewBox',from.getAttribute('viewBox')||'0 0 340 196');
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label','Trazado real del circuito');
 svg.setAttribute('preserveAspectRatio','xMidYMid meet');
 const path=document.createElementNS(NS,'path');
 path.setAttribute('d',d);
 path.setAttribute('fill','none');
 path.setAttribute('stroke','#f6fbff');
 path.setAttribute('stroke-width','5');
 path.setAttribute('stroke-linejoin','round');
 path.setAttribute('stroke-linecap','round');
 svg.append(path);host.append(svg);
}
function chooseImage(info){
 return /(?:^06-monaco$|m[oó]naco|monaco)/i.test(info.dir+' '+info.label)
  ?'assets/9a/prep-monaco.webp':'assets/9a/track-state-bg.webp';
}
function recordText(data){
 // La BASE no ofrece récord oficial fiable para todos los circuitos.
 // No confundir con el mejor tiempo personal ni con una estimación de IA.
 const value=data?.records?.officialLapRecord||data?.race?.officialLapRecord||null;
 if(typeof value==='string'&&/^\d{1,2}:\d{2}\.\d{3}$/.test(value))return value;
 return '—';
}
function update(){
 pending=false;
 if(!hero||!panel?.isConnected)return;
 const which=mode(),info=resolveCircuit(which),data=info.data||{},circuit=data.circuit||{};
 const nativeReady=validPreview(info.source,info);
 const raw=titleCase(info.label),parts=raw.split(/\s*[—–]\s*/);
 const country=clean(circuit.country||parts[0]||info.name).replace(/^[^\p{L}\p{N}]+/u,'')||'CIRCUITO';
 let subtitle=clean(circuit.displayName||circuit.name||info.name||'');
 if(subtitle.toLocaleLowerCase('es')===country.toLocaleLowerCase('es')&&parts.length>1)subtitle=parts[1];
 if(which==='season'&&!info.dir){
  subtitle=clean(info.name||'Próximo GP');
 }
 $('apexBroadcastName').textContent=country.toLocaleUpperCase('es');
 $('apexBroadcastSubtitle').textContent=subtitle||'Circuito seleccionado';
 $('apexBroadcastPhoto').style.backgroundImage='linear-gradient(90deg,rgba(3,12,21,.25),rgba(3,12,21,.63)),url("'+chooseImage(info)+'")';
 let length=nativeReady?statFromSource(info.source,'longitud'):'';
 let turns=nativeReady?statFromSource(info.source,'curvas'):'';
 const meters=Number(data.track?.lengthMeters);
 if(!length&&Number.isFinite(meters)&&meters>0)length=(meters/1000).toLocaleString('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3})+' km';
 if(!turns&&Number.isFinite(Number(data.race?.turns))&&Number(data.race.turns)>0)turns=String(data.race.turns);
 $('apexBroadcastLength').textContent=length||'—';
 $('apexBroadcastTurns').textContent=turns||'—';
 $('apexBroadcastRecord').textContent=recordText(data);
 hero.dataset.circuit=info.dir||'unknown';
 hero.dataset.mode=which;
 drawLayout(nativeReady?info.source:null);
}
function schedule(){
 if(pending)return;
 pending=true;
 setTimeout(update,0);
}
function boot(){
 const modes=$('apex9aModesScreen');
 if(!modes||!$('apexProtoCircuitName')){setTimeout(boot,150);return;}
 panel=modes.querySelector('.apexProtoCircuitPanel');
 if(!panel||panel.querySelector('.apexCircuitBroadcast'))return;
 hero=document.createElement('section');
 hero.className='apexCircuitBroadcast';
 hero.setAttribute('aria-label','Ficha visual del circuito seleccionado');
 hero.innerHTML='<div class="apexCircuitBroadcastPhoto" id="apexBroadcastPhoto"></div>'+
 '<div class="apexCircuitBroadcastGrid">'+
 '<div class="apexCircuitBroadcastIdentity"><strong id="apexBroadcastName">CIRCUITO</strong>'+
 '<small id="apexBroadcastSubtitle"></small></div>'+
 '<div class="apexCircuitBroadcastLayout" id="apexBroadcastLayout"></div>'+
 '<div class="apexCircuitBroadcastStats">'+
 '<div><span>LONGITUD</span><b id="apexBroadcastLength">—</b></div>'+
 '<div><span>CURVAS</span><b id="apexBroadcastTurns">—</b></div>'+
 '<div><span>RÉCORD DE VUELTA</span><b id="apexBroadcastRecord">—</b></div>'+
 '</div></div>';
 panel.querySelector('h2').after(hero);
 modes.addEventListener('click',schedule);
 modes.addEventListener('change',schedule);
 const tabs=$('menuModeTabs');
 tabs?.addEventListener('click',schedule);
 ['track','gpTrack','practiceTrack'].forEach(id=>$(id)?.addEventListener('change',schedule));
 // El simulador obtiene la geometría asíncronamente; observar solo las fichas
 // nativas, nunca el propio hero, para evitar bucles o reconstrucciones inútiles.
 if(!sourcesObserved){
  sourcesObserved=true;
  Object.values(SOURCES).forEach(([,id])=>{
   const node=$(id);
   if(node)new MutationObserver(schedule).observe(node,{childList:true,subtree:false});
  });
  const season=$('seasonStatus');
  if(season)new MutationObserver(schedule).observe(season,{childList:true,subtree:true,characterData:true});
 }
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ApexCircuitBroadcast9A=Object.freeze({refresh:schedule});
})(window);
