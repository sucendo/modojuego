/* APEX Formula 26 · 9F.1 · Perfil de piloto y casco configurable.
 * Datos locales versionados, sin servidor. La identidad deportiva interna
 * continúa siendo PLAYER para no modificar clasificación ni guardados.
 */
(function(global){
'use strict';
const KEY='apex26.driverProfile.v1';
const $=id=>document.getElementById(id);
const PATTERNS=['racing','chevron','bands','split','clean'];
const GENDERS=['unspecified','male','female','other'];
const DEFAULT=()=>({version:1,name:'',age:null,gender:'unspecified',nationality:'',number:null,
 helmet:{primary:'#10263b',secondary:'#e32842',trim:'#f4f7fb',visor:'#162536',pattern:'racing'}});
const validColor=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(String(v||''))?String(v).toLowerCase():fallback;
const bounded=(v,n)=>String(v??'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n);
const digit=(v,min,max)=>v===''||v==null?null:(Number.isInteger(Number(v))&&+v>=min&&+v<=max?+v:null);
const copy=o=>JSON.parse(JSON.stringify(o));
function normalize(value){
 const d=DEFAULT(),v=value&&typeof value==='object'?value:{},h=v.helmet&&typeof v.helmet==='object'?v.helmet:{};
 return {
  version:1,name:bounded(v.name,26),age:digit(v.age,1,120),
  gender:GENDERS.includes(v.gender)?v.gender:'unspecified',
  nationality:bounded(v.nationality,36),number:digit(v.number,0,99),
  helmet:{
   primary:validColor(h.primary,d.helmet.primary),
   secondary:validColor(h.secondary,d.helmet.secondary),
   trim:validColor(h.trim,d.helmet.trim),
   visor:validColor(h.visor,d.helmet.visor),
   pattern:PATTERNS.includes(h.pattern)?h.pattern:d.helmet.pattern
  }
 };
}
let state=DEFAULT(),screen=null,form=null;
try{const raw=global.localStorage.getItem(KEY);if(raw)state=normalize(JSON.parse(raw));}catch(_){}
function get(){return {...copy(state),displayName:state.name||'TÚ'};}
function profilePatch(form){
 return normalize({
  name:form.elements.driverName.value,
  age:form.elements.driverAge.value,
  gender:form.elements.driverGender.value,
  nationality:form.elements.driverNationality.value,
  number:form.elements.driverNumber.value,
  helmet:{
   primary:form.elements.helmetPrimary.value,
   secondary:form.elements.helmetSecondary.value,
   trim:form.elements.helmetTrim.value,
   visor:form.elements.helmetVisor.value,
   pattern:form.elements.helmetPattern.value
  }
 });
}
function helmetSvg(profile){
 const h=profile.helmet;
 const p=h.primary,s=h.secondary,t=h.trim,v=h.visor;
 let livery='';
 switch(h.pattern){
  case 'chevron':livery='<path d="M110 102 L194 178 278 102 251 85 194 137 137 85Z" fill="'+s+'"/><path d="M126 115 194 169 262 115" fill="none" stroke="'+t+'" stroke-width="9" stroke-linejoin="round"/>';break;
  case 'bands':livery='<path d="M108 126C149 100 217 93 277 120" stroke="'+s+'" stroke-width="37" fill="none"/><path d="M112 99C154 74 221 71 267 91" stroke="'+t+'" stroke-width="9" fill="none"/>';break;
  case 'split':livery='<path d="M194 43 C252 41 287 100 282 162 L194 205Z" fill="'+s+'"/><path d="M194 45V204" stroke="'+t+'" stroke-width="9"/>';break;
  case 'clean':livery='<path d="M95 163Q177 145 287 172" fill="none" stroke="'+s+'" stroke-width="10"/>';break;
  default:livery='<path d="M165 49Q194 37 223 49L245 173H143Z" fill="'+s+'"/><path d="M190 48L175 166" fill="none" stroke="'+t+'" stroke-width="10"/><path d="M207 50L221 168" fill="none" stroke="'+t+'" stroke-width="7"/>';break;
 }
 const no=profile.number!=null?String(profile.number).padStart(2,'0'):'26';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 300" role="img" aria-label="Vista frontal y lateral del casco personalizado">'+
 '<defs><linearGradient id="apexHelmShell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".23"/><stop offset=".45" stop-color="'+p+'"/><stop offset="1" stop-color="#060b13" stop-opacity=".7"/></linearGradient>'+
 '<linearGradient id="apexHelmGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5faff" stop-opacity=".35"/><stop offset=".35" stop-color="'+v+'"/><stop offset="1" stop-color="#010810"/></linearGradient>'+
 '<filter id="apexHelmShadow" x="-30%" y="-40%" width="160%" height="190%"><feGaussianBlur stdDeviation="11"/></filter></defs>'+
 '<ellipse cx="192" cy="261" rx="132" ry="17" fill="#000" opacity=".45" filter="url(#apexHelmShadow)"/>'+
 '<path d="M75 164Q64 78 128 46Q192 17 247 42Q305 73 308 160L320 201Q326 232 285 245Q230 267 139 250Q102 243 88 218Z" fill="'+p+'" stroke="#0b121d" stroke-width="7"/>'+
 '<path d="M75 164Q64 78 128 46Q192 17 247 42Q305 73 308 160L320 201Q326 232 285 245Q230 267 139 250Q102 243 88 218Z" fill="url(#apexHelmShell)"/>'+
 livery+
 '<path d="M78 164Q126 132 196 137Q270 132 307 161L311 205Q256 226 137 217Q95 212 83 204Z" fill="#060c13" stroke="'+t+'" stroke-width="6"/>'+
 '<path d="M91 164Q153 143 211 150Q265 144 302 165L299 199Q210 214 113 199L87 193Z" fill="url(#apexHelmGlass)"/>'+
 '<path d="M104 159Q146 143 198 145" fill="none" stroke="#fff" stroke-opacity=".48" stroke-width="5" stroke-linecap="round"/>'+
 '<path d="M104 218Q194 240 302 218L283 245Q191 267 139 248Z" fill="'+p+'" stroke="#0a141c" stroke-width="5"/>'+
 '<path d="M118 227Q196 242 289 224" fill="none" stroke="'+s+'" stroke-width="13"/>'+
 '<path d="M132 242Q198 259 275 242" fill="none" stroke="'+t+'" stroke-width="4"/>'+
 '<path d="M114 71Q174 40 233 60" stroke="#fff" stroke-opacity=".22" stroke-width="9" fill="none" stroke-linecap="round"/>'+
 '<path d="M83 204L69 217 95 231 106 213Z" fill="'+t+'" stroke="#0c1620" stroke-width="4"/>'+
 '<text x="197" y="104" text-anchor="middle" font-size="32" font-family="Arial,sans-serif" font-weight="900" fill="'+t+'" stroke="#030b15" stroke-width=".7">'+no+'</text></svg>';
}
function render(){
 if(!form)return;
 const current=profilePatch(form);
 $('apexProfileHelmetImage').innerHTML=helmetSvg(current);
 $('apexProfileNamePreview').textContent=current.name||'TU NOMBRE';
 $('apexProfileNumberPreview').textContent=current.number==null?'#26':'#'+String(current.number).padStart(2,'0');
 $('apexProfilePreviewHelp').textContent=PATTERNS.includes(current.helmet.pattern)?'Diseño: '+({
  racing:'Franja de competición',chevron:'Chevron',bands:'Bandas',
  split:'Dos tonos',clean:'Minimalista'
 })[current.helmet.pattern]:'';
 $('apexProfileStatus').textContent='CAMBIOS SIN GUARDAR';
 $('apexProfileStatus').dataset.saved='false';
}
function fill(){
 if(!form)return;
 const p=state;
 form.elements.driverName.value=p.name;
 form.elements.driverAge.value=p.age??'';
 form.elements.driverGender.value=p.gender;
 form.elements.driverNationality.value=p.nationality;
 form.elements.driverNumber.value=p.number??'';
 for(const [control,key] of [['helmetPrimary','primary'],['helmetSecondary','secondary'],
  ['helmetTrim','trim'],['helmetVisor','visor'],['helmetPattern','pattern']]){
  form.elements[control].value=p.helmet[key];
 }
 render();
 $('apexProfileStatus').textContent=p.name?'PERFIL GUARDADO':'PERFIL SIN CONFIGURAR';
 $('apexProfileStatus').dataset.saved='true';
}
function save(){
 if(!form)return;
 const next=profilePatch(form);
 if(!next.name){$('apexProfileStatus').textContent='INTRODUCE EL NOMBRE DEL PILOTO';form.elements.driverName.focus();return;}
 state=next;
 try{global.localStorage.setItem(KEY,JSON.stringify(next));}
 catch(_){$('apexProfileStatus').textContent='NO SE PUDO GUARDAR EN ESTE NAVEGADOR';return;}
 global.dispatchEvent(new CustomEvent('apex:driver-profile-change',{detail:get()}));
 $('apexProfileStatus').textContent='PERFIL GUARDADO CORRECTAMENTE';
 $('apexProfileStatus').dataset.saved='true';
}
function close(){
 if(!screen||screen.hidden)return false;
 screen.hidden=true;
 if(global.ApexMenuPrototype9A?.show)global.ApexMenuPrototype9A.show('home');
 else if($('apex9aLanding'))$('apex9aLanding').hidden=false;
 return true;
}
function open(){
 const menu=$('menu');
 if(!menu||!screen||menu.classList.contains('hidden'))return false;
 $('apex9aLanding').hidden=true;
 if($('apex9aModesScreen'))$('apex9aModesScreen').hidden=true;
 if($('apex9aOptionsScreen'))$('apex9aOptionsScreen').hidden=true;
 menu.classList.add('apex9aPrototype');
 screen.hidden=false;
 fill();
 menu.scrollTop=0;
 $('apex9fBack')?.focus({preventScroll:true});
 return true;
}
function init(){
 const menu=$('menu'),landing=$('apex9aLanding');
 if(!menu||!landing){setTimeout(init,100);return;}
 if($('apex9fProfileScreen'))return;
 screen=document.createElement('section');
 screen.id='apex9fProfileScreen';screen.hidden=true;
 screen.setAttribute('aria-label','Perfil de piloto de APEX 26');
 screen.innerHTML='<div class="apexProfileShell">'+
 '<header class="apexProtoTop"><button id="apex9fBack" type="button">‹ VOLVER AL MENÚ</button><span>03</span><small>APEX 26 // DRIVER IDENTITY</small></header>'+
 '<div class="apexProtoTitle"><h1>PERFIL DE PILOTO</h1><p>CREA TU IDENTIDAD PARA COMPETIR EN APEX FORMULA 26</p></div>'+
 '<form id="apexDriverProfileForm" autocomplete="off"><div class="apexProfileGrid">'+
 '<div class="apexProfileIdentity"><h2>DATOS DEL PILOTO</h2>'+
 '<div class="apexProfileFields">'+
 '<label for="apexDriverName">NOMBRE DE COMPETICIÓN <em>Obligatorio</em></label>'+
 '<input id="apexDriverName" name="driverName" type="text" minlength="2" maxlength="26" placeholder="Ej.: ÁLEX SERRANO" required>'+
 '<div class="apexProfileRow"><div><label for="apexDriverAge">EDAD <em>Opcional</em></label>'+
 '<input id="apexDriverAge" name="driverAge" type="number" min="1" max="120" step="1" placeholder="—"></div>'+
 '<div><label for="apexDriverGender">SEXO <em>Opcional</em></label><select id="apexDriverGender" name="driverGender">'+
 '<option value="unspecified">Prefiero no indicarlo</option><option value="male">Hombre</option>'+
 '<option value="female">Mujer</option><option value="other">Otro</option></select></div></div>'+
 '<div class="apexProfileRow"><div><label for="apexDriverNationality">NACIONALIDAD <em>Opcional</em></label>'+
 '<input id="apexDriverNationality" name="driverNationality" type="text" list="apexNations" maxlength="36" placeholder="Ej.: España">'+
 '<datalist id="apexNations"><option value="España"><option value="Italia"><option value="Francia">'+
 '<option value="Reino Unido"><option value="Alemania"><option value="Países Bajos"><option value="México">'+
 '<option value="Argentina"><option value="Brasil"><option value="Estados Unidos"><option value="Japón"></datalist></div>'+
 '<div><label for="apexDriverNumber">DORSAL <em>0–99</em></label>'+
 '<input id="apexDriverNumber" name="driverNumber" type="number" min="0" max="99" step="1" placeholder="26"></div></div></div>'+
 '<div class="apexProfilePrivacy">El perfil se guarda solo en este navegador. No exige fecha de nacimiento ni datos personales adicionales.</div>'+
 '</div>'+
 '<div class="apexProfileHelmet"><h2>DISEÑO DEL CASCO</h2>'+
 '<div class="apexProfileHelmetStage"><div id="apexProfileHelmetImage"></div>'+
 '<div class="apexProfileHelmetCaption"><strong id="apexProfileNamePreview">TU NOMBRE</strong>'+
 '<span id="apexProfileNumberPreview">#26</span></div></div>'+
 '<div class="apexProfileColors">'+
 '<label>COLOR PRINCIPAL <input type="color" name="helmetPrimary" aria-label="Color principal del casco"></label>'+
 '<label>COLOR SECUNDARIO <input type="color" name="helmetSecondary" aria-label="Color secundario del casco"></label>'+
 '<label>DETALLES <input type="color" name="helmetTrim" aria-label="Color de los detalles"></label>'+
 '<label>VISERA <input type="color" name="helmetVisor" aria-label="Color de la visera"></label></div>'+
 '<label class="apexProfilePatternLabel" for="apexHelmetPattern">DECORACIÓN DEL CASCO</label>'+
 '<select id="apexHelmetPattern" name="helmetPattern">'+
 '<option value="racing">Franja de competición</option><option value="chevron">Chevron</option>'+
 '<option value="bands">Bandas</option><option value="split">Dos tonos</option>'+
 '<option value="clean">Minimalista</option></select>'+
 '<small id="apexProfilePreviewHelp"></small></div></div>'+
 '<div class="apexProfileActions"><span id="apexProfileStatus" role="status" aria-live="polite"></span>'+
 '<button id="apexProfileCancel" type="button">CANCELAR</button>'+
 '<button id="apexProfileSave" type="submit">GUARDAR PERFIL ❯❯</button></div></form></div>';
 menu.append(screen);
 form=$('apexDriverProfileForm');
 form.addEventListener('input',render);
 form.addEventListener('change',render);
 form.addEventListener('submit',e=>{e.preventDefault();if(form.checkValidity())save();else form.reportValidity();});
 $('apexProfileCancel').onclick=close;
 $('apex9fBack').onclick=close;
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!screen.hidden&&menu&&!menu.classList.contains('hidden')){
   e.preventDefault();e.stopImmediatePropagation();close();
  }
 },true);
 // Si el juego vuelve del circuito o de resultados, no mostrar Perfil superpuesto.
 new MutationObserver(()=>{
  if(menu.classList.contains('hidden')&&!screen.hidden)screen.hidden=true;
 }).observe(menu,{attributes:true,attributeFilter:['class']});
}
global.ApexDriverProfile9F=Object.freeze({get,open,close,save,helmetSvg});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(window);
