/* APEX Formula 26 · Escuderías 2026 · showroom premium V2.
 * Reutiliza catálogo deportivo, las once identidades existentes, botones de
 * selección originales y los controles carColor/carAccent del motor.
 * Sólo mejora interfaz, gráficos vectoriales y personalización local.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const STORE='apex26.vehicle-studio.palette.v1';
const HEX=/^#[0-9a-f]{6}$/i;
const hex=(x,f)=>HEX.test(String(x||''))?String(x).toLowerCase():f;
const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32);
let panel,hero,car,queued=false,saveNotice='',colors={},knownOptions='';
try{
 const saved=JSON.parse(global.localStorage.getItem(STORE)||'{}');
 if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
  for(const [key,value] of Object.entries(saved)){
   if(/^[A-Z0-9_]{2,24}$/.test(key)&&value&&
      HEX.test(value.primary)&&HEX.test(value.secondary)&&HEX.test(value.accent)){
    colors[key]={
     primary:hex(value.primary),secondary:hex(value.secondary),
     accent:hex(value.accent),
     finish:['carbon','silver','white'].includes(value.finish)?value.finish:'paint'
    };
   }
  }
 }
}catch(_){}
function info(){
 const native=$('teamSelect'),key=native?.value||'';
 return {native,key,team:global.ApexNativeTeamStudio9A?.get?.(key)||null,
  count:native?.options?.length||0,index:Math.max(0,native?.selectedIndex??0),
  locked:!!native?.disabled};
}
function colorsFor(key){
 const c=colors[key];
 return c?{primary:c.primary,secondary:c.secondary,accent:c.accent,
  stripe:c.accent,finish:c.finish}:null;
}
function current(key,team){
 const c=colors[key],l=team?.preview?.livery||{};
 return {
  primary:c?.primary||hex(l.primary,hex(team?.color,'#ff8700')),
  secondary:c?.secondary||hex(l.secondary,'#171e27'),
  accent:c?.accent||hex(l.stripe,hex(l.accent,'#59d9ff')),
  finish:c?.finish||'paint'
 };
}
function persist(){
 try{global.localStorage.setItem(STORE,JSON.stringify(colors));return true;}
 catch(_){return false;}
}
function applyNative(key){
 const chosen=colors[key];
 if(!chosen)return;
 for(const [id,value] of [['carColor',chosen.primary],['carAccent',chosen.accent]]){
  const input=$(id);
  if(input&&String(input.value).toLowerCase()!==value){
   input.value=value;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
}
// Reutilizamos las 11 formas de identidad ya definidas por el catálogo APEX:
// swoosh/star/shield/horns/etc. Se pulen como marcas vectoriales de competición.
function emblem(symbol){
 const d={
  swoosh:'<path d="M4 42C19 9 31 30 61 11 49 40 25 55 4 42Z"/><path d="M17 42L47 22" fill="none" stroke="var(--logo-line)" stroke-width="3"/>',
  star:'<path d="M32 4l7.5 19 20.5-2-16 13 6 20-18-12-18 12 6-20L4 21l20.5 2Z"/>',
  shield:'<path d="M32 4 53 12v21c0 12-9 20-21 27C20 53 11 45 11 33V12Z"/><path d="M32 14v33" stroke="var(--logo-line)" stroke-width="5"/>',
  horns:'<path d="M7 50L19 13 32 24 45 13 57 50 42 43 32 55 22 43Z"/><path d="M22 26l10 9 10-9" fill="none" stroke="var(--logo-line)" stroke-width="3"/>',
  doubleBar:'<path d="M6 12h52v15H6ZM13 37h38v15H13Z"/><path d="M11 19h42M19 44h26" stroke="var(--logo-line)" stroke-width="3" />',
  aeroA:'<path d="M32 4 61 57H47l-6-12H23l-6 12H3Z"/><path d="M28 34h8l-4-11Z" fill="#08111b"/>',
  hash:'<path d="M9 6h10v51H9Zm18 0h10v51H27Zm18 0h10v51H45Z"/><path d="M7 25h50M7 42h50" fill="none" stroke="var(--logo-line)" stroke-width="2"/>',
  ring:'<path d="M32 6a26 26 0 1 0 0 52 26 26 0 0 0 0-52Zm0 11a15 15 0 1 1 0 30 15 15 0 0 1 0-30Z" fill-rule="evenodd"/>',
  wave:'<path d="M4 39C15 8 26 49 37 23 46 5 55 20 60 18" fill="none" stroke="url(#LOGO_GRAD)" stroke-width="10" stroke-linecap="round"/><path d="M9 49c11-10 18-1 29-10" fill="none" stroke="var(--logo-line)" stroke-width="3"/>',
  leaf:'<path d="M32 4C56 17 56 39 32 60 8 40 8 16 32 4Z"/><path d="M32 15v36M32 34l-12-9M32 40l12-10" fill="none" stroke="var(--logo-line)" stroke-width="3"/>',
  crest:'<path d="M9 8h46v26L32 60 9 34Z"/><path d="M32 14 44 31 32 46 20 31Z" fill="var(--logo-line)"/>'
 };
 return d[symbol]||d.swoosh;
}
function badgeSvg(teamKey,compact=false){
 const team=global.ApexNativeTeamStudio9A?.get?.(teamKey);
 if(!team)return '';
 const l=team.preview?.livery||{},symbol=l.symbol||'swoosh';
 const primary=hex(l.primary,hex(team.color,'#ff8700')),accent=hex(l.stripe,hex(l.accent,'#fff'));
 const grad='studio-brand-'+safe(teamKey)+(compact?'-tile':'-hero');
 // Stable per-team + context ids. Grid never duplicates same key.
 const path=emblem(symbol).replaceAll('url(#LOGO_GRAD)','url(#'+grad+')');
 return '<svg class="apexStudioBrandMark" viewBox="0 0 64 64" role="img" aria-label="Logo de '+safe(teamKey)+'" style="--logo-line:'+accent+'">'+
 '<defs><linearGradient id="'+grad+'" x1="0" y1="0" x2=".9" y2="1">'+
 '<stop offset="0" stop-color="'+accent+'"/><stop offset=".3" stop-color="'+primary+'"/><stop offset="1" stop-color="'+primary+'"/></linearGradient></defs>'+
 '<g fill="url(#'+grad+')" stroke="#000" stroke-width=".5" stroke-linejoin="round">'+path+'</g></svg>';
}
function badgeAndWordmark(key,team){
 const target=$('apexStudioLogo');if(!target)return;
 target.replaceChildren();
 const mark=document.createElement('div');
 mark.className='apexStudioLogoMark';
 mark.innerHTML=badgeSvg(key);
 const wordmark=document.createElement('div');
 wordmark.className='apexStudioLogoName';
 const words=String(team.name||key).trim().split(/\s+/);
 const first=document.createElement('strong');first.textContent=words[0]||key;
 const remaining=document.createElement('small');remaining.textContent=words.slice(1).join(' ').toUpperCase()||'RACING';
 wordmark.append(first,remaining);
 target.append(mark,wordmark);
}
function teamCards(){
 const {native}=info(),row=$('apexStudioTeamCards');if(!row||!native)return;
 const options=[...native.options].filter(x=>x.value&&!x.hidden);
 const signature=options.map(x=>x.value+':'+x.textContent).join('|');
 if(signature===knownOptions)return;
 knownOptions=signature;
 row.replaceChildren();
 options.forEach(o=>{
  const team=global.ApexNativeTeamStudio9A?.get?.(o.value);
  if(!team)return;
  const button=document.createElement('button');
  button.type='button';button.className='apexStudioTeamCard';
  button.dataset.teamKey=o.value;button.title=team.name;
  button.setAttribute('aria-label','Seleccionar '+team.name);
  const image=document.createElement('span');image.className='apexStudioCardLogo';
  image.innerHTML=badgeSvg(o.value,true);
  const caption=document.createElement('span');caption.className='apexStudioCardText';
  const parts=team.name.split(/\s+/);
  const line1=document.createElement('strong');line1.textContent=parts[0];
  const line2=document.createElement('small');line2.textContent=parts.slice(1).join(' ')||'RACING';
  caption.append(line1,line2);button.append(image,caption);
  button.addEventListener('click',()=>{
   const n=$('teamSelect');if(!n||n.disabled)return;
   if(n.value!==o.value){
    n.value=o.value;
    n.dispatchEvent(new Event('change',{bubbles:true}));
   }
   refresh();
  });
  row.append(button);
 });
}
function paint(){
 queued=false;
 if(!panel?.isConnected)return;
 const {key,team,index,count,locked}=info();
 if(!team){setTimeout(refresh,120);return;}
 applyNative(key);
 teamCards();
 const c=current(key,team),name=team.name||'Escudería';
 panel.style.setProperty('--apex-team-color',c.primary);
 panel.style.setProperty('--apex-team-secondary',c.secondary);
 panel.style.setProperty('--apex-team-accent',c.accent);
 $('apexStudioOrder').textContent=String(index+1).padStart(2,'0')+' / '+String(count).padStart(2,'0');
 $('apexStudioTeamName').textContent=name.toUpperCase();
 $('apexStudioSelectedLabel').textContent=locked?'ESCUDERÍA FIJADA · TEMPORADA':'ESCUDERÍA SELECCIONADA';
 $('apexStudioChassis').textContent=team.chassis||'—';
 $('apexStudioModel').textContent=team.model||'—';
 $('apexStudioMotor').textContent='HÍBRIDO · 2026';
 const fw=Number(team.preview?.geometry?.frontWing)||1;
 $('apexStudioAero').textContent=fw>1.02?'ALTA CARGA':fw<.99?'BAJA RESISTENCIA':'EQUILIBRADA';
 $('apexStudioMass').textContent='SEGÚN CONFIGURACIÓN';
 panel.classList.toggle('apexStudioLocked',locked);
 hero.setAttribute('aria-label','Monoplaza cenital F1 2026 de '+name);
 badgeAndWordmark(key,team);
 for(const role of ['primary','secondary','accent']){
  const input=$('apexStudioColor-'+role);
  if(input&&input.value.toLowerCase()!==c[role])input.value=c[role];
 }
 for(const button of panel.querySelectorAll('.apexStudioFinish')){
  const active=button.dataset.finish===c.finish;
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
 }
 for(const button of panel.querySelectorAll('.apexStudioTeamCard')){
  const active=button.dataset.teamKey===key;
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
  button.disabled=locked&&!active;
 }
 // Keep the highlighted team in view within the compact horizontal strip.
 // Do not scroll the page or move keyboard focus while changing teams.
 const strip=$('apexStudioTeamCards');
 const selected=strip?.querySelector('.apexStudioTeamCard.active');
 if(strip&&selected){
  const left=selected.offsetLeft-strip.offsetLeft;
  const right=left+selected.offsetWidth;
  if(left<strip.scrollLeft)strip.scrollLeft=Math.max(0,left-6);
  else if(right>strip.scrollLeft+strip.clientWidth)
   strip.scrollLeft=right-strip.clientWidth+6;
 }
 $('apexStudioReset').disabled=!colors[key];
 $('apexStudioSave').textContent=saveNotice|| (colors[key]?'COLORES PERSONALIZADOS':'COLORES DE ESCUDERÍA');
 global.ApexTeamCarPreview9A?.setCar?.(key);
 if(car?.complete&&car.naturalWidth===0)hero.classList.add('apexStudioAssetMissing');
}
function refresh(){if(queued)return;queued=true;queueMicrotask(paint);}
function change(role,value){
 saveNotice='';
 const {key,team}=info();if(!team||!HEX.test(value))return;
 colors[key]={...current(key,team),[role]:hex(value),finish:'paint'};
 persist();applyNative(key);refresh();
}
function finish(kind){
 saveNotice='';
 const {key,team}=info();if(!team)return;
 const presets={silver:'#b4c1cc',carbon:'#101920',white:'#f2f6fa'};
 if(!presets[kind])return;
 colors[key]={...current(key,team),secondary:presets[kind],finish:kind};
 persist();applyNative(key);refresh();
}
function reset(){
 saveNotice='';
 const {key,team}=info();if(!team)return;
 delete colors[key];persist();
 for(const [id,value] of [['carColor',team.color],['carAccent',team.accent]]){
  const input=$(id);
  if(input&&HEX.test(value)){
   input.value=value;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
 refresh();
}
function confirmSave(){
 const {key}=info();
 saveNotice=persist()?'GUARDADO ✓':'NO SE PUDO GUARDAR';
 refresh();
}
function setup(){
 const modes=$('apex9aModesScreen');if(!modes){setTimeout(setup,100);return;}
 panel=modes.querySelector('.apexProtoVehiclePanel');
 if(!panel||panel.classList.contains('apexTeamStudio'))return;
 const h=panel.querySelector('h2'),identity=panel.querySelector('.apexProtoTeamIdent'),
  picker=panel.querySelector('.apexProtoTeamPicker'),footer=panel.querySelector(':scope > p');
 car=$('apexProtoTeamImage');
 if(!h||!identity||!picker||!car)return;
 panel.classList.add('apexTeamStudio');
 hero=document.createElement('section');hero.className='apexStudioHero';
 hero.innerHTML=[
 '<div class="apexStudioIdentity"><div class="apexStudioText">',
 '<span class="apexStudioEyebrow" id="apexStudioSelectedLabel">ESCUDERÍA SELECCIONADA</span>',
 '<strong class="apexStudioTeamName" id="apexStudioTeamName"></strong>',
 '<small class="apexStudioTagline">MONOPLAZA · APEX 26</small></div>',
 '<div class="apexStudioHeaderControls"><button type="button" id="apexStudioHeaderPrev" aria-label="Escudería anterior">‹</button>',
 '<strong class="apexStudioOrdinal" id="apexStudioOrder">01 / 11</strong>',
 '<button type="button" id="apexStudioHeaderNext" aria-label="Escudería siguiente">›</button></div></div>',
 '<div class="apexStudioLayout"><aside class="apexStudioDetails">',
 '<div class="apexStudioLogo" id="apexStudioLogo" aria-label="Logotipo de la escudería"></div>',
 '<dl class="apexStudioSpecs">',
 '<div><dt>CHASIS</dt><dd id="apexStudioChassis">—</dd></div>',
 '<div><dt>MODELO</dt><dd id="apexStudioModel">—</dd></div>',
 '<div><dt>MOTOR</dt><dd id="apexStudioMotor">—</dd></div>',
 '<div><dt>AERODINÁMICA</dt><dd id="apexStudioAero">—</dd></div>',
 '<div><dt>PESO</dt><dd id="apexStudioMass">—</dd></div>',
 '<div><dt>TEMPORADA</dt><dd>2026</dd></div>',
 '</dl></aside>',
 '<div class="apexStudioStage"><div class="apexStudioHalo" aria-hidden="true"></div></div></div>'
 ].join('');
 h.after(hero);
 identity.classList.add('apexStudioOriginalIdentity');
 hero.querySelector('.apexStudioText').append(identity);
 hero.querySelector('.apexStudioStage').append(car);
 // Reutilizamos los botones nativos; la nueva cabecera sólo los acciona.
 $('apexStudioHeaderPrev').addEventListener('click',()=>$('apexProtoPrevTeam')?.click());
 $('apexStudioHeaderNext').addEventListener('click',()=>$('apexProtoNextTeam')?.click());
 const controls=document.createElement('section');controls.className='apexStudioControls';
 controls.innerHTML='<div class="apexStudioControlsLabel">ELEGIR ESCUDERÍA</div>'+
 '<div class="apexStudioTeamCards" id="apexStudioTeamCards" role="group" aria-label="Once escuderías del simulador"></div>';
 controls.append(picker);
 if(footer){footer.classList.add('apexStudioFootnote');controls.append(footer);}
 panel.append(controls);
 const palette=document.createElement('section');palette.className='apexStudioPalette';
 palette.innerHTML=[
 '<div class="apexStudioPaletteTitle"><strong>COLORES DEL COCHE</strong><small>Personaliza los colores de tu escudería</small></div>',
 '<div class="apexStudioColorOptions">',
 '<label>PRINCIPAL<input type="color" id="apexStudioColor-primary" aria-label="Color principal del coche"></label>',
 '<label>SECUNDARIO<input type="color" id="apexStudioColor-secondary" aria-label="Color secundario de la vista del coche"></label>',
 '<label>DETALLES<input type="color" id="apexStudioColor-accent" aria-label="Color de los detalles del coche"></label>',
 '<button class="apexStudioFinish" data-finish="silver" type="button" aria-label="Acabado plata" aria-pressed="false"><span class="apexStudioFinishSwatch silver"></span>PLATA</button>',
 '<button class="apexStudioFinish" data-finish="carbon" type="button" aria-label="Acabado carbono" aria-pressed="false"><span class="apexStudioFinishSwatch carbon"></span>CARBONO</button>',
 '<button class="apexStudioFinish" data-finish="white" type="button" aria-label="Acabado blanco" aria-pressed="false"><span class="apexStudioFinishSwatch white"></span>BLANCO</button>',
 '</div><div class="apexStudioPaletteActions">',
 '<button type="button" id="apexStudioReset">↺ RESTAURAR</button>',
 '<button type="button" id="apexStudioSaveButton">▣ GUARDAR</button>',
 '<small id="apexStudioSave" aria-live="polite">COLORES DE ESCUDERÍA</small></div>'
 ].join('');
 panel.append(palette);
 const nativeSelect=$('teamSelect');
 nativeSelect?.addEventListener('change',()=>{saveNotice='';refresh();});
 if(nativeSelect)new MutationObserver(refresh).observe(nativeSelect,{childList:true,attributes:true,attributeFilter:['disabled']});
 $('apexProtoTeam')?.addEventListener('change',refresh);
 $('carColor')?.addEventListener('input',refresh);
 $('carAccent')?.addEventListener('input',refresh);
 for(const role of ['primary','secondary','accent'])
  $('apexStudioColor-'+role).addEventListener('input',e=>change(role,e.target.value));
 palette.querySelectorAll('.apexStudioFinish').forEach(b=>
  b.addEventListener('click',()=>finish(b.dataset.finish)));
 $('apexStudioReset').addEventListener('click',reset);
 $('apexStudioSaveButton').addEventListener('click',confirmSave);
 car.addEventListener('load',()=>hero.classList.remove('apexStudioAssetMissing'));
 car.addEventListener('error',()=>hero.classList.add('apexStudioAssetMissing'));
 modes.addEventListener('click',refresh);
 refresh();
 // El motor inicializa las opciones nativas en otro ciclo de tareas.
 // Releer tras completar la carga del menú y recuperar la preferencia local.
 setTimeout(refresh,250);
}
global.ApexVehicleStudio9A=Object.freeze({refresh,colorsFor,reset});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})(window);
