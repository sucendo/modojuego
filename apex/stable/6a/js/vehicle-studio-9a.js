/* APEX Formula 26 · Escuderías 2026 · showroom premium V2.
 * Reutiliza catálogo deportivo, las once identidades existentes, botones de
 * selección originales y los controles carColor/carAccent del motor.
 * Sólo mejora interfaz, gráficos vectoriales y personalización local.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const STORE='apex26.vehicle-studio.palette.v1';
// Old design.v1 choices are intentionally ignored: a team keeps its own body.
const PAINT_STORE='apex26.vehicle-studio.paint.v1';
const PAINT_STYLES=global.ApexTeamCarPreview9A?.paintStyles||[{key:'original',name:'Original de escudería'}];
const validPaint=value=>PAINT_STYLES.some(style=>style.key===value);
const TEAM_KEYS=['PAPAYA','SILVERWING','FERRATI','BULLHORN','SUNRIDGE','ALPEN','MIDNIGHT','AUREON','OCEANIC','GREENSTONE','CADARA'];
const validTeam=key=>TEAM_KEYS.includes(key);
const HEX=/^#[0-9a-f]{6}$/i;
const hex=(x,f)=>HEX.test(String(x||''))?String(x).toLowerCase():f;
const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32);
let panel,hero,car,queued=false,saveNotice='',colors={},paintChoices={},knownOptions='',knownPaints='';
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
try{
 const saved=JSON.parse(global.localStorage.getItem(PAINT_STORE)||'{}');
 if(saved&&typeof saved==='object'&&!Array.isArray(saved))
  for(const [key,value] of Object.entries(saved))
   if(validTeam(key)&&validPaint(value)&&value!=='original')paintChoices[key]=value;
}catch(_){}
function paintStyleFor(key){return validPaint(paintChoices[key])?paintChoices[key]:'original';}
function persistPaint(){
 try{global.localStorage.setItem(PAINT_STORE,JSON.stringify(paintChoices));return true;}
 catch(_){return false;}
}
function updatePaintPicker(key){
 const select=$('apexStudioPaintStyle');if(!select)return;
 if(knownPaints!==String(PAINT_STYLES.length)){
  knownPaints=String(PAINT_STYLES.length);select.replaceChildren();
  PAINT_STYLES.forEach(({key:value,name})=>{
   const option=document.createElement('option');option.value=value;option.textContent=name;
   select.append(option);
  });
 }
 select.value=paintStyleFor(key);
 $('apexStudioPaintReset').disabled=paintStyleFor(key)==='original';
}
function choosePaint(value){
 const {key,team}=info();if(!team||!validPaint(value))return;
 saveNotice='';
 if(value==='original')delete paintChoices[key];else paintChoices[key]=value;
 persistPaint();refresh();
}
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
  // Original APEX marks, sharing the catalogue's symbol vocabulary.
  swoosh:'<path d="M3 17 29 24 61 9 43 34 29 53 21 39 8 33 27 35 35 25 25 30Z"/><path d="m8 22 17 7-4 4-8-5Z" fill="var(--logo-line)"/><path d="m30 48 10-18 14-14-13 22Z" fill="var(--logo-line)"/>',
  star:'<path d="m32 4 8 18 20-2-15 14 5 23-18-12-18 12 5-23L4 20l20 2Z"/><path d="m32 14 1 19 13 17-14-10-14 10 13-17Z" fill="#07111b"/><path d="m32 9 5 16 15-1-16 7Z" fill="var(--logo-line)"/>',
  shield:'<path d="M32 4 54 12v19c0 13-11 23-22 30C21 54 10 44 10 31V12Z"/><path d="m32 10 16 6v15c0 9-7 18-16 24-9-6-16-15-16-24V16Z" fill="#07111b"/><path d="M24 17h20l-3 6H30v7h12l-3 6h-9v10l-6-4Z" fill="var(--logo-line)"/>',
  horns:'<path d="M5 9 20 21 32 18 44 21 59 9 54 30 45 36 42 49 32 58 22 49 19 36 10 30Z"/><path d="m15 19 8 11-8-4Zm34 0-8 11 8-4ZM24 34l8 4 8-4-3 12-5 4-5-4Z" fill="#07111b"/><path d="m24 29 5 2-4 3Zm16 0-5 2 4 3Z" fill="var(--logo-line)"/>',
  doubleBar:'<path d="M10 12h48l-7 13H3Zm5 24h40l-8 14H7Z"/><path d="M13 16h34l-3 5H10Zm7 24h22l-3 5H17Z" fill="var(--logo-line)"/>',
  aeroA:'<path d="M32 4 60 55H47L32 26 17 55H4Z"/><path d="m22 40 21-7 5 9-31 8Z" fill="var(--logo-line)"/><path d="m32 10 12 23-7-3-5-10-9 15Z" fill="#07111b"/>',
  hash:'<path d="M12 8h12L14 56H2Zm20 0h12L34 56H22Zm20 0h10L52 56H42Z"/><path d="M8 25h49l-2 7H6Zm-3 16h49l-2 7H3Z" fill="var(--logo-line)"/>',
  ring:'<path d="M32 5a27 27 0 1 0 27 27H47a15 15 0 1 1-15-15c5 0 9 2 12 5l8-9A27 27 0 0 0 32 5Z"/><path d="m31 22 29 2-9 9H31Z" fill="var(--logo-line)"/><path d="M11 35a21 21 0 0 0 34 14" fill="none" stroke="#07111b" stroke-width="2"/>',
  wave:'<path d="m3 17 10 4 6 22 13-21 7 18 15-26 8 4-23 37-9-18-14 20Z"/><path d="m10 20 8 26 13-18 8 18 16-27" fill="none" stroke="var(--logo-line)" stroke-width="2"/>',
  leaf:'<path d="M8 43C9 21 31 7 59 6 56 34 38 55 14 57L30 32Z"/><path d="M14 52 47 18M26 39l-2-14M33 32l14-2M22 43l15-1" fill="none" stroke="#07111b" stroke-width="3"/><path d="M14 45C24 23 40 14 54 11" fill="none" stroke="var(--logo-line)" stroke-width="2"/>',
  crest:'<path d="M32 5 56 11v22L46 48 32 60 18 48 8 33V11Z"/><path d="m32 10 18 5v17L40 47l-8 7-8-7-10-15V15Z" fill="#07111b"/><path d="M19 18h12v9H19Zm15 0h11v9H34ZM19 30h26v6H19Zm5 9h16l-8 10Z" fill="var(--logo-line)"/>'
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
 '<g fill="url(#'+grad+')" stroke="#02080e" stroke-width=".65" stroke-linejoin="round">'+path+'</g></svg>';
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
 updatePaintPicker(key);
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
 $('apexStudioSave').textContent=saveNotice|| (colors[key]?'COLORES PERSONALIZADOS':paintChoices[key]?'DECORACIÓN PERSONALIZADA':'COLORES DE ESCUDERÍA');
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
 const paletteSaved=persist(),paintSaved=persistPaint();
 saveNotice=paletteSaved&&paintSaved?'GUARDADO ✓':'NO SE PUDO GUARDAR';
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
 const designPicker=document.createElement('section');designPicker.className='apexStudioDesignPicker';
 designPicker.innerHTML='<div><label for="apexStudioPaintStyle">DECORACIÓN DEL COCHE</label>'+
  '<small>Cambia la pintura · misma carrocería</small></div>'+
  '<select id="apexStudioPaintStyle" aria-label="Decoración del coche"></select>'+
  '<button type="button" id="apexStudioPaintReset" aria-label="Restaurar decoración original">ORIGINAL</button>';
 panel.append(designPicker,palette);
 $('apexStudioPaintStyle').addEventListener('change',e=>choosePaint(e.target.value));
 $('apexStudioPaintReset').addEventListener('click',()=>choosePaint('original'));
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
global.ApexVehicleStudio9A=Object.freeze({refresh,colorsFor,paintStyleFor,reset});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})(window);
