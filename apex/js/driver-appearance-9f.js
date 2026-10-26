/* APEX 26 · 9F.2 · Mono de competición e imagen de perfil SVG.
 * La identidad PLAYER y la simulación permanecen intactas. Sin servicios externos.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const valid=v=>/^#[0-9a-f]{6}$/i.test(String(v||''))?String(v).toLowerCase():'#10263b';
const text=(n,s)=>{const e=$(n);if(e)e.textContent=s;};
function selectedTeamPalette(){
 const id=$('teamSelect')?.value;
 const meta=global.ApexNativeTeamStudio9A?.get?.(id)||
            global.ApexDriverTeamPalette9F?.get?.(id);
 if(!meta)return null;
 return {primary:valid(meta.color),secondary:valid(meta.accent),trim:'#f4f7fb',name:meta.name||''};
}
function palette(p){
 const src=p.suit.source;
 if(src==='team'){
  const team=selectedTeamPalette();
  if(team)return {...team,source:'team'};
 }
 if(src==='helmet'||src==='team'){
  return {primary:p.helmet.primary,secondary:p.helmet.secondary,
   trim:p.helmet.trim,source:src==='team'?'helmet-fallback':'helmet'};
 }
 return {primary:p.suit.primary,secondary:p.suit.secondary,trim:p.suit.trim,source:'custom'};
}
function svgSuite(p){
 const e=palette(p);
 const [a,b,c]=[e.primary,e.secondary,e.trim];
 let pattern='';
 switch(p.suit.pattern){
 case 'chevron':
  pattern='<path d="M69 77 160 184 251 77" fill="none" stroke="'+b+'" stroke-width="30" stroke-linecap="square"/><path d="M70 77 160 167 250 77" fill="none" stroke="'+c+'" stroke-width="8"/>';break;
 case 'diagonal':
  pattern='<path d="M55 198 225 43 261 63 94 223Z" fill="'+b+'"/><path d="M80 217 244 68" stroke="'+c+'" stroke-width="8"/>';break;
 case 'classic':
  pattern='<path d="M145 35H175V266H145Z" fill="'+b+'"/><path d="M160 35V266" stroke="'+c+'" stroke-width="5"/>';break;
 default:
  pattern='<path d="M130 42 147 42 137 250 103 255Z" fill="'+b+'"/><path d="M176 42 193 42 223 252 190 250Z" fill="'+b+'"/><path d="M147 40 160 40 160 253" fill="none" stroke="'+c+'" stroke-width="6"/>';
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 290" role="img" aria-label="Mono de competición personalizado">'+
 '<defs><linearGradient id="suitFabric" x1="0" y1="0" x2="1" y2=".8"><stop offset="0" stop-color="#ffffff" stop-opacity=".16"/><stop offset=".53" stop-color="'+a+'"/><stop offset="1" stop-color="#02070f" stop-opacity=".64"/></linearGradient></defs>'+
 '<ellipse cx="159" cy="279" rx="125" ry="10" fill="#02080e" opacity=".6"/>'+
 '<path d="M116 31 132 18H188L204 31 245 51 284 107 309 184 266 201 224 137 218 268 104 268 96 138 53 201 11 184 36 104 73 53Z" fill="'+a+'" stroke="#07101a" stroke-width="7" stroke-linejoin="round"/>'+
 '<path d="M116 31 132 18H188L204 31 245 51 284 107 309 184 266 201 224 137 218 268 104 268 96 138 53 201 11 184 36 104 73 53Z" fill="url(#suitFabric)"/>'+
 '<path d="M73 53 104 137 95 189 53 201 11 184 36 104Z" fill="'+b+'" opacity=".8"/>'+
 '<path d="M245 51 224 137 233 189 266 201 309 184 284 107Z" fill="'+b+'" opacity=".8"/>'+
 '<path d="M114 33 132 19 160 54 187 19 206 33 184 74 160 97 136 74Z" fill="#0a1521" stroke="'+c+'" stroke-width="5"/>'+
 '<path d="M116 31 132 18H188L204 31 245 51 284 107 309 184 266 201 224 137 218 268 104 268 96 138 53 201 11 184 36 104 73 53Z" fill="none" stroke="#020810" stroke-width="4"/>'+
 '<svg x="84" y="50" width="152" height="219" viewBox="0 0 320 290" preserveAspectRatio="none">'+pattern+'</svg>'+
 '<path d="M115 34 137 63 160 89 183 63 205 34" fill="none" stroke="'+c+'" stroke-width="6"/>'+
 '<path d="M96 143 103 266M224 143 217 266" fill="none" stroke="'+c+'" stroke-opacity=".45" stroke-width="3"/>'+
 '<path d="M107 222H213" stroke="'+b+'" stroke-width="8"/>'+
 '<path d="M17 180 55 193M266 193 303 180" stroke="'+c+'" stroke-width="7"/>'+
 '<text x="160" y="131" text-anchor="middle" fill="'+c+'" stroke="#07101b" stroke-width="1.2" font-family="Arial,sans-serif" font-weight="900" font-size="32">'+(p.number==null?'26':String(p.number).padStart(2,'0'))+'</text>'+
 '</svg>';
}
function avatarSvg(p){
 const suit=palette(p),h=p.helmet;
 const a=suit.primary,b=suit.secondary,c=suit.trim;
 const pattern=p.suit.pattern==='chevron'?
  '<path d="M58 272 180 348 302 272" stroke="'+b+'" stroke-width="25" fill="none"/>':
  p.suit.pattern==='diagonal'?
  '<path d="M63 353 260 244" stroke="'+b+'" stroke-width="45"/>':
  p.suit.pattern==='classic'?
  '<path d="M166 225V383" stroke="'+b+'" stroke-width="22"/>':
  '<path d="M127 228 143 373M233 228 216 373" stroke="'+b+'" stroke-width="20" fill="none"/>';
 const helmetAccent=h.pattern==='bands'?
  '<path d="M109 103 Q176 71 246 105" stroke="'+h.secondary+'" stroke-width="19" fill="none"/>':
  h.pattern==='split'?
  '<path d="M185 53 Q252 76 248 166 L185 174Z" fill="'+h.secondary+'"/>':
  h.pattern==='chevron'?
  '<path d="M115 95 182 153 246 95" fill="none" stroke="'+h.secondary+'" stroke-width="17"/>':
  h.pattern==='clean'?
  '<path d="M105 144 252 151" stroke="'+h.secondary+'" stroke-width="8"/>':
  '<path d="M174 55H194L214 158H154Z" fill="'+h.secondary+'"/>';
 const num=p.number==null?'26':String(p.number).padStart(2,'0');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 380" role="img" aria-label="Imagen de perfil del piloto con casco y mono personalizados">'+
 '<defs><linearGradient id="driverShine" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".23"/><stop offset=".6" stop-color="#ffffff" stop-opacity=".02"/><stop offset="1" stop-color="#020810" stop-opacity=".65"/></linearGradient></defs>'+
 '<circle cx="180" cy="175" r="160" fill="none" stroke="'+b+'" stroke-opacity=".28" stroke-width="2"/>'+
 '<path d="M107 207 Q40 211 30 286L10 380H350L330 286Q320 211 253 207L216 192H144Z" fill="'+a+'" stroke="#050e17" stroke-width="10"/>'+
 '<path d="M107 207 Q40 211 30 286L10 380H350L330 286Q320 211 253 207L216 192H144Z" fill="url(#driverShine)"/>'+
 '<path d="M51 266 22 380H100L120 224Z" fill="'+b+'" opacity=".8"/>'+
 '<path d="M309 266 338 380H260L240 224Z" fill="'+b+'" opacity=".8"/>'+
 pattern+
 '<path d="M144 200 180 257 217 199" stroke="'+c+'" stroke-width="9" fill="#0c1824"/>'+
 '<path d="M101 367H257" stroke="'+c+'" stroke-width="3" stroke-opacity=".45"/>'+
 '<path d="M104 130Q105 60 153 45Q179 33 210 43Q258 62 258 132L264 182Q250 212 182 221Q118 216 105 185Z" fill="'+h.primary+'" stroke="#020711" stroke-width="8"/>'+
 '<path d="M104 130Q105 60 153 45Q179 33 210 43Q258 62 258 132L264 182Q250 212 182 221Q118 216 105 185Z" fill="url(#driverShine)"/>'+
 helmetAccent+
 '<path d="M103 141Q172 126 259 147L252 183Q179 202 114 185Z" fill="'+h.visor+'" stroke="'+h.trim+'" stroke-width="6"/>'+
 '<path d="M117 149Q167 134 224 145" stroke="#d9f6ff" stroke-opacity=".43" stroke-width="5" fill="none"/>'+
 '<path d="M117 194Q176 216 248 193L235 210Q179 232 134 207Z" fill="'+h.primary+'" stroke="'+h.trim+'" stroke-width="4"/>'+
 '<path d="M147 204Q180 213 220 204" stroke="'+h.secondary+'" stroke-width="8" fill="none"/>'+
 '<text x="181" y="97" text-anchor="middle" font-size="20" font-family="Arial,sans-serif" font-weight="900" fill="'+h.trim+'">'+num+'</text>'+
 '</svg>';
}
function render(p){
 const suit=$('apexSuitPreview'),av=$('apexDriverAvatarImage');
 if(!suit||!av)return;
 const effective=palette(p);
 suit.innerHTML=svgSuite(p);
 av.innerHTML=avatarSvg(p);
 text('apexAvatarName',p.name||'TU PILOTO');
 text('apexAvatarTeam',effective.source==='team'?'COLORES DE ESCUDERÍA':
  effective.source==='helmet'?'COLORES DEL CASCO':
  effective.source==='helmet-fallback'?'SIN EQUIPO DISPONIBLE · COLORES DEL CASCO':'COLORES PERSONALIZADOS');
 const inputs=['suitPrimary','suitSecondary','suitTrim'];
 for(const [i,key] of ['primary','secondary','trim'].entries()){
  const input=document.forms.apexDriverProfileForm?.elements[inputs[i]];
  if(input){
   input.disabled=p.suit.source!=='custom';
   if(p.suit.source!=='custom')input.value=effective[key];
  }
 }
 const avatarHome=$('apexDriverProfileHomeIcon');
 if(avatarHome)avatarHome.innerHTML=avatarSvg(p);
}
function applySource(){
 const form=$('apexDriverProfileForm');if(!form)return;
 const source=form.elements.suitSource.value;
 if(source==='team'&&!selectedTeamPalette()){
  form.elements.suitSource.value='helmet';
  text('apexSuitHint','No hay datos de escudería disponibles; se utilizan los colores del casco.');
 }else text('apexSuitHint',source==='team'?'Colores reales de la escudería seleccionada.':
    source==='helmet'?'El mono sigue automáticamente los colores del casco.':
    'Puedes elegir cada color del mono independientemente.');
 const p=global.ApexDriverProfile9F.get();
 // Reproducir el estado actual del formulario, no el último guardado.
 const h={primary:form.elements.helmetPrimary.value,secondary:form.elements.helmetSecondary.value,
  trim:form.elements.helmetTrim.value,visor:form.elements.helmetVisor.value,
  pattern:form.elements.helmetPattern.value};
 const s={primary:form.elements.suitPrimary.value,secondary:form.elements.suitSecondary.value,
  trim:form.elements.suitTrim.value,pattern:form.elements.suitPattern.value,source:form.elements.suitSource.value};
 render({...p,helmet:h,suit:s,name:form.elements.driverName.value,
  number:form.elements.driverNumber.value===''?null:+form.elements.driverNumber.value});
}
function downloadSvg(){
 const form=$('apexDriverProfileForm');
 if(!form)return;
 const data=global.ApexDriverProfile9F.get(),h={
  primary:form.elements.helmetPrimary.value,secondary:form.elements.helmetSecondary.value,
  trim:form.elements.helmetTrim.value,visor:form.elements.helmetVisor.value,
  pattern:form.elements.helmetPattern.value};
 const p={...data,name:form.elements.driverName.value,number:form.elements.driverNumber.value===''?null:+form.elements.driverNumber.value,
  helmet:h,suit:{primary:form.elements.suitPrimary.value,secondary:form.elements.suitSecondary.value,
  trim:form.elements.suitTrim.value,pattern:form.elements.suitPattern.value,source:form.elements.suitSource.value}};
 const blob=new Blob([avatarSvg(p)],{type:'image/svg+xml;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='APEX26-perfil-piloto.svg';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function init(){
 const form=$('apexDriverProfileForm');
 if(!form||!global.ApexDriverProfile9F){setTimeout(init,100);return;}
 if($('apexDriverAvatarImage'))return;
 const grid=form.querySelector('.apexProfileGrid');
 if(!grid)return;
 const card=document.createElement('section');
 card.className='apexProfileSuit';
 card.innerHTML='<h2>MONO DE COMPETICIÓN</h2><div id="apexSuitPreview" class="apexSuitStage" aria-live="off"></div>'+
 '<div class="apexSuitControls"><label for="apexSuitSource">PALETA DE COLORES</label>'+
 '<select id="apexSuitSource" name="suitSource"><option value="helmet">Combinar con el casco</option>'+
 '<option value="team">Colores de mi escudería</option><option value="custom">Personalizados</option></select>'+
 '<div class="apexSuitColors"><label>PRINCIPAL <input type="color" name="suitPrimary" aria-label="Color principal del mono"></label>'+
 '<label>SECUNDARIO <input type="color" name="suitSecondary" aria-label="Color secundario del mono"></label>'+
 '<label>DETALLES <input type="color" name="suitTrim" aria-label="Color de detalles del mono"></label></div>'+
 '<label for="apexSuitPattern">DISEÑO</label>'+
 '<select id="apexSuitPattern" name="suitPattern"><option value="racing">Franjas deportivas</option>'+
 '<option value="chevron">Chevron</option><option value="diagonal">Diagonal</option>'+
 '<option value="classic">Clásico</option></select>'+
 '<small id="apexSuitHint">El mono sigue automáticamente los colores del casco.</small></div>';
 const portrait=document.createElement('section');
 portrait.className='apexProfileAvatar';
 portrait.innerHTML='<h2>IMAGEN DE PERFIL</h2>'+
 '<div id="apexDriverAvatarImage" class="apexAvatarStage" aria-label="Avatar de competición"></div>'+
 '<div class="apexAvatarDetails"><strong id="apexAvatarName">TU PILOTO</strong>'+
 '<small id="apexAvatarTeam">COLORES DEL CASCO</small></div>'+
 '<p>Tu avatar se genera a partir del casco y el mono. No es necesario subir una fotografía.</p>'+
 '<button type="button" id="apexProfileExportAvatar">DESCARGAR AVATAR SVG</button>';
 grid.append(card,portrait);
 const label=$('apex9aProfile');
 if(label&&!$('apexDriverProfileHomeIcon')){
  const span=document.createElement('span');
  span.id='apexDriverProfileHomeIcon';
  span.className='apexDriverProfileHomeIcon';
  span.setAttribute('aria-hidden','true');
  label.prepend(span);
 }
 form.elements.suitSource.addEventListener('change',applySource);
 $('apexProfileExportAvatar').addEventListener('click',downloadSvg);
 $('teamSelect')?.addEventListener('change',()=>{if(!form.closest('[hidden]'))applySource();});
 global.addEventListener('apex:driver-profile-change',()=>render(global.ApexDriverProfile9F.get()));
 render(global.ApexDriverProfile9F.get());
}
global.ApexDriverAppearance9F=Object.freeze({render,avatarSvg,suitSvg:svgSuite,palette,selectedTeamPalette});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(window);
