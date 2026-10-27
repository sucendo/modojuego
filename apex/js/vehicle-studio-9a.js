/* APEX 26 · Estudio de escudería. 11 logos y pinturas NATIVOS.
 * Sin otro catálogo, sin reemplazar el simulador o guardar partidas.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id),KEY='apex26.vehicle-studio.palette.v1';
const HEX=/^#[0-9a-f]{6}$/i,hex=(v,d)=>HEX.test(String(v||''))?String(v).toLowerCase():d;
let panel,hero,car,pending=false,colors={};
try{
 const saved=JSON.parse(global.localStorage.getItem(KEY)||'{}');
 if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
  for(const [k,v] of Object.entries(saved)){
   if(/^[A-Z0-9_]{2,24}$/.test(k)&&v&&HEX.test(v.primary)&&HEX.test(v.secondary)&&HEX.test(v.accent))
    colors[k]={primary:hex(v.primary),secondary:hex(v.secondary),accent:hex(v.accent)};
  }
 }
}catch(_){}
function info(){
 const native=$('teamSelect'),key=native?.value||'';
 return {key,team:global.ApexNativeTeamStudio9A?.get?.(key),
  index:Math.max(0,native?.selectedIndex??0),count:native?.options?.length||0,locked:!!native?.disabled};
}
function colorsFor(key){
 const c=colors[key];
 return c?{primary:c.primary,secondary:c.secondary,accent:c.accent,stripe:c.accent}:null;
}
function current(key,team){
 const c=colors[key],l=team?.preview?.livery||{};
 return {primary:c?.primary||hex(l.primary,hex(team?.color,'#ff8700')),
  secondary:c?.secondary||hex(l.secondary,'#161b23'),
  accent:c?.accent||hex(l.stripe,hex(l.accent,'#59d9ff'))};
}
function save(){try{global.localStorage.setItem(KEY,JSON.stringify(colors));}catch(_){}}
function applyNative(key){
 const c=colors[key];if(!c)return;
 for(const [name,value] of [['carColor',c.primary],['carAccent',c.accent]]){
  const input=$(name);
  if(input&&String(input.value).toLowerCase()!==value){
   input.value=value;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
}
function logo(){
 const source=$('selectedTeamLogo')?.querySelector('svg'),target=$('apexStudioLogo');
 if(!target)return;
 target.replaceChildren();
 if(!source){target.textContent='APEX';return;}
 const copy=source.cloneNode(true);copy.removeAttribute('class');
 copy.setAttribute('aria-hidden','true');
 const ids={};
 copy.querySelectorAll('[id]').forEach(el=>{ids[el.id]='studio-'+el.id;el.id=ids[el.id]});
 copy.querySelectorAll('*').forEach(el=>Array.from(el.attributes).forEach(attr=>{
  let v=attr.value;
  for(const [old,id] of Object.entries(ids)){
   v=v.replaceAll('url(#'+old+')','url(#'+id+')');
   if((attr.name==='href'||attr.name==='xlink:href')&&v==='#'+old)v='#'+id;
  }
  if(v!==attr.value)el.setAttribute(attr.name,v);
 }));
 target.append(copy);
}
function sync(){
 pending=false;
 if(!panel?.isConnected)return;
 const {key,team,index,count,locked}=info();
 if(!team)return;
 applyNative(key);
 const c=current(key,team),name=$('teamSelect')?.selectedOptions?.[0]?.textContent?.trim()||team.name;
 panel.style.setProperty('--apex-team-color',c.primary);
 panel.style.setProperty('--apex-team-secondary',c.secondary);
 panel.style.setProperty('--apex-team-accent',c.accent);
 $('apexStudioOrder').textContent=String(index+1).padStart(2,'0')+' / '+String(count).padStart(2,'0');
 $('apexStudioChassis').textContent=team.chassis||'—';
 $('apexStudioModel').textContent=team.model||'—';
 $('apexStudioMotor').textContent='HÍBRIDO · 2026';
 const wing=Number(team.preview?.geometry?.frontWing)||1;
 $('apexStudioAero').textContent=wing>1.02?'ALERÓN AMPLIADO':wing<.99?'ALERÓN COMPACTO':'ALERÓN ESTÁNDAR';
 $('apexStudioSelectedLabel').textContent=locked?'ESCUDERÍA FIJADA · TEMPORADA':'ESCUDERÍA SELECCIONADA';
 $('apexStudioTeamName').textContent=name.toUpperCase();
 hero.setAttribute('aria-label','Monoplaza F1 2026 de '+name);
 panel.classList.toggle('apexStudioLocked',locked);
 for(const [role,value] of Object.entries(c)){
  const input=$('apexStudioColor-'+role);if(input&&input.value.toLowerCase()!==value)input.value=value;
 }
 $('apexStudioReset').disabled=!colors[key];
 $('apexStudioSave').textContent=colors[key]?'COLORES GUARDADOS':'COLORES DE ESCUDERÍA';
 logo();
 global.ApexTeamCarPreview9A?.setCar?.(key);
 if(car?.complete&&car.naturalWidth===0)hero.classList.add('apexStudioAssetMissing');
}
function refresh(){if(pending)return;pending=true;queueMicrotask(sync);}
function update(role,value){
 const {key,team}=info();
 if(!team||!HEX.test(value))return;
 colors[key]={...current(key,team),[role]:hex(value)};
 save();applyNative(key);refresh();
}
function reset(){
 const {key,team}=info();if(!team)return;
 delete colors[key];save();
 for(const [name,value] of [['carColor',team.color],['carAccent',team.accent]]){
  const input=$(name);
  if(input&&HEX.test(value)){
   input.value=value;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
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
 '<small class="apexStudioTagline">MONOPLAZA · APEX 26</small>',
 '</div><strong class="apexStudioOrdinal" id="apexStudioOrder">01 / 11</strong></div>',
 '<div class="apexStudioLayout"><aside class="apexStudioDetails">',
 '<div class="apexStudioLogo" id="apexStudioLogo" aria-label="Logotipo original de escudería"></div>',
 '<dl class="apexStudioSpecs">',
 '<div><dt>CHASIS</dt><dd id="apexStudioChassis">—</dd></div>',
 '<div><dt>MODELO</dt><dd id="apexStudioModel">—</dd></div>',
 '<div><dt>PROPULSIÓN</dt><dd id="apexStudioMotor">—</dd></div>',
 '<div><dt>AERODINÁMICA</dt><dd id="apexStudioAero">—</dd></div>',
 '<div><dt>TEMPORADA</dt><dd>2026</dd></div>',
 '</dl></aside>',
 '<div class="apexStudioStage"><div class="apexStudioHalo" aria-hidden="true"></div></div></div>'
 ].join('');
 h.after(hero);
 identity.classList.add('apexStudioOriginalIdentity');
 hero.querySelector('.apexStudioText').append(identity);
 hero.querySelector('.apexStudioStage').append(car);
 const controls=document.createElement('section');
 controls.className='apexStudioControls';
 controls.innerHTML='<span class="apexStudioControlsLabel">ELEGIR ESCUDERÍA</span>';
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
 '</div><div class="apexStudioPaletteActions">',
 '<button type="button" id="apexStudioReset">RESTAURAR</button>',
 '<small id="apexStudioSave" aria-live="polite">COLORES DE ESCUDERÍA</small></div>'
 ].join('');
 panel.append(palette);
 $('teamSelect')?.addEventListener('change',refresh);
 $('apexProtoTeam')?.addEventListener('change',refresh);
 $('carColor')?.addEventListener('input',refresh);
 $('carAccent')?.addEventListener('input',refresh);
 for(const role of ['primary','secondary','accent'])
  $('apexStudioColor-'+role).addEventListener('input',e=>update(role,e.target.value));
 $('apexStudioReset').addEventListener('click',reset);
 new MutationObserver(refresh).observe(car,{attributes:true,attributeFilter:['src']});
 const nativeLogo=$('selectedTeamLogo');
 if(nativeLogo)new MutationObserver(refresh).observe(nativeLogo,{childList:true});
 car.addEventListener('load',()=>hero.classList.remove('apexStudioAssetMissing'));
 car.addEventListener('error',()=>hero.classList.add('apexStudioAssetMissing'));
 modes.addEventListener('click',refresh);
 refresh();
}
global.ApexVehicleStudio9A=Object.freeze({refresh,colorsFor,reset});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})(window);
