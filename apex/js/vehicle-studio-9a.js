/* APEX Formula 26 — Presentación de escudería en Tipo de carrera.
 * Solo reorganiza elementos del menú 9A existentes. Los controles nativos
 * y el motor no se sustituyen ni se modifican.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
let panel,hero,car,queued=false;
function meta(){
 const select=$('teamSelect');
 const index=Math.max(0,select?.selectedIndex??0);
 const teamKey=select?.value||'';
 // Catálogo original del simulador: no mantener otra lista de equipos.
 const catalog=typeof teamCatalog!=='undefined'&&teamCatalog&&typeof teamCatalog==='object'?teamCatalog:null;
 const team=catalog?.[teamKey]||null;
 return {team,index,count:select?.options?.length||0,locked:!!select?.disabled};
}
function color(value,backup){
 const s=String(value||'');
 return /^#[0-9a-f]{6}$/i.test(s)?s:backup;
}
function sync(){
 queued=false;
 if(!panel?.isConnected)return;
 const {team,index,count,locked}=meta();
 const selected=$('teamSelect')?.selectedOptions?.[0];
 const name=selected?.textContent?.trim()||'Escudería';
 const mainColor=color(team?.color,'#ed344d');
 const secondary=color(team?.accent,'#e9f4ff');
 panel.style.setProperty('--apex-team-color',mainColor);
 panel.style.setProperty('--apex-team-secondary',secondary);
 $('apexStudioOrder').textContent=String(index+1).padStart(2,'0')+' / '+String(count).padStart(2,'0');
 $('apexStudioChassis').textContent=team?.chassis||'—';
 $('apexStudioModel').textContent=team?.model||'—';
 $('apexStudioSelectedLabel').textContent=locked?'ESCUDERÍA FIJADA · TEMPORADA':'ESCUDERÍA SELECCIONADA';
 hero.setAttribute('aria-label','Monoplaza de '+name);
 panel.classList.toggle('apexStudioLocked',locked);
 if(car?.complete&&car.naturalWidth===0)hero.classList.add('apexStudioAssetMissing');
}
function queue(){
 if(queued)return;
 queued=true;
 queueMicrotask(sync);
}
function setup(){
 const modes=$('apex9aModesScreen');
 if(!modes){setTimeout(setup,100);return;}
 panel=modes.querySelector('.apexProtoVehiclePanel');
 if(!panel||panel.classList.contains('apexTeamStudio'))return;
 const heading=panel.querySelector('h2'),teamIdentity=panel.querySelector('.apexProtoTeamIdent');
 const picker=panel.querySelector('.apexProtoTeamPicker');
 const footer=panel.querySelector(':scope > p');
 car=$('apexProtoTeamImage');
 if(!heading||!teamIdentity||!picker||!car){return;}
 panel.classList.add('apexTeamStudio');
 hero=document.createElement('section');
 hero.className='apexStudioHero';
 hero.innerHTML='<div class="apexStudioIdentity"><div class="apexStudioNameWrap">'+
   '<span id="apexStudioSelectedLabel" class="apexStudioEyebrow">ESCUDERÍA SELECCIONADA</span></div>'+
   '<div class="apexStudioOrdinal" id="apexStudioOrder">01 / 12</div></div>'+
   '<div class="apexStudioStage"><div class="apexStudioHalo" aria-hidden="true"></div></div>'+
   '<div class="apexStudioSpecs">'+
   '<div><span>CHASIS</span><strong id="apexStudioChassis">—</strong></div>'+
   '<div><span>MODELO</span><strong id="apexStudioModel">—</strong></div>'+
   '<div class="apexStudioYear">APEX <strong>26</strong></div></div>';
 heading.after(hero);
 hero.querySelector('.apexStudioNameWrap').append(teamIdentity);
 hero.querySelector('.apexStudioStage').append(car);
 const controls=document.createElement('section');
 controls.className='apexStudioControls';
 const label=document.createElement('span');
 label.className='apexStudioControlsLabel';
 label.textContent='ELEGIR ESCUDERÍA';
 controls.append(label,picker);
 if(footer){footer.classList.add('apexStudioFootnote');controls.append(footer);}
 panel.append(controls);
 const native=$('teamSelect');
 native?.addEventListener('change',queue);
 $('apexProtoTeam')?.addEventListener('change',queue);
 // El menú 9A actualiza imagen y nombre, también al cambiar de modo.
 new MutationObserver(queue).observe(car,{attributes:true,attributeFilter:['src']});
 car.addEventListener('load',()=>hero.classList.remove('apexStudioAssetMissing'));
 car.addEventListener('error',()=>hero.classList.add('apexStudioAssetMissing'));
 modes.addEventListener('click',queue);
 queue();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
else setup();
global.ApexVehicleStudio9A=Object.freeze({refresh:queue});
})(window);
