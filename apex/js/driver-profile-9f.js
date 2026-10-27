/* APEX Formula 26 · 9F.1 · Perfil de piloto y casco configurable.
 * Datos locales versionados, sin servidor. La identidad deportiva interna
 * continúa siendo PLAYER para no modificar clasificación ni guardados.
 */
(function(global){
'use strict';
const KEY='apex26.driverProfile.v1';
const $=id=>document.getElementById(id);
const PATTERN_NAMES=Object.freeze({racing:'Franja de competición',chevron:'Chevron',bands:'Bandas',split:'Dos tonos',clean:'Minimalista',diagonal:'Diagonales',waves:'Ondas',organic:'Líneas orgánicas',facets:'Paneles geométricos',stars:'Estrellas',checker:'Damero'});
const PATTERNS=Object.keys(PATTERN_NAMES);
const VISOR_FINISHES=['iridium','smoke','silver','gold'];
const GENDERS=['unspecified','male','female','other'];
const SUIT_PATTERNS=['racing','chevron','diagonal','classic'];
const SUIT_SOURCES=['helmet','team','custom'];
const DEFAULT=()=>({version:1,name:'',age:null,gender:'unspecified',nationality:'',number:null,
 helmet:{primary:'#10263b',secondary:'#e32842',trim:'#f4f7fb',visor:'#162536',visorFinish:'iridium',pattern:'racing'},
 suit:{primary:'#10263b',secondary:'#e32842',trim:'#f4f7fb',pattern:'racing',source:'helmet'}});
const validColor=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(String(v||''))?String(v).toLowerCase():fallback;
const bounded=(v,n)=>String(v??'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n);
const digit=(v,min,max)=>v===''||v==null?null:(Number.isInteger(Number(v))&&+v>=min&&+v<=max?+v:null);
const copy=o=>JSON.parse(JSON.stringify(o));
function normalize(value){
 const d=DEFAULT(),v=value&&typeof value==='object'?value:{},h=v.helmet&&typeof v.helmet==='object'?v.helmet:{},
 suit=v.suit&&typeof v.suit==='object'?v.suit:{};
 return {
  version:1,name:bounded(v.name,26),age:digit(v.age,1,120),
  gender:GENDERS.includes(v.gender)?v.gender:'unspecified',
  nationality:bounded(v.nationality,36),number:digit(v.number,0,99),
  helmet:{
   primary:validColor(h.primary,d.helmet.primary),
   secondary:validColor(h.secondary,d.helmet.secondary),
   trim:validColor(h.trim,d.helmet.trim),
   visor:validColor(h.visor,d.helmet.visor),
   visorFinish:VISOR_FINISHES.includes(h.visorFinish)?h.visorFinish:d.helmet.visorFinish,
   pattern:PATTERNS.includes(h.pattern)?h.pattern:d.helmet.pattern
  },
  suit:{
   primary:validColor(suit.primary,d.suit.primary),
   secondary:validColor(suit.secondary,d.suit.secondary),
   trim:validColor(suit.trim,d.suit.trim),
   pattern:SUIT_PATTERNS.includes(suit.pattern)?suit.pattern:d.suit.pattern,
   source:SUIT_SOURCES.includes(suit.source)?suit.source:d.suit.source
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
   visorFinish:form.elements.helmetVisorFinish.value,
   pattern:form.elements.helmetPattern.value
  },
  suit:{
   primary:form.elements.suitPrimary?.value||state.suit.primary,
   secondary:form.elements.suitSecondary?.value||state.suit.secondary,
   trim:form.elements.suitTrim?.value||state.suit.trim,
   pattern:form.elements.suitPattern?.value||state.suit.pattern,
   source:form.elements.suitSource?.value||state.suit.source
  }
 });
}
function helmetSvg(value,scope='studio'){
 const profile=normalize(value),h=profile.helmet;
 const p=h.primary,s=h.secondary,t=h.trim,v=h.visor;
 const prefix='apexHelmet-'+String(scope).replace(/[^a-z0-9_-]/gi,'').slice(0,24);
 const url=id=>'url(#'+prefix+'-'+id+')';
 const path=(d,fill,extra='')=>'<path d="'+d+'" fill="'+fill+'" '+extra+'/>';
 const line=(d,color,width,extra='')=>path(d,'none','stroke="'+color+'" stroke-width="'+width+'" '+extra);
 const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const shell='M73 128C73 79 106 46 157 36C217 23 273 46 296 89Q313 118 306 154L313 186Q315 210 294 231Q267 250 225 253L107 247Q82 243 70 224L60 209Q55 198 60 186L70 164Z';
 const visor='M73 127Q151 110 236 120Q259 123 274 138L263 169Q170 186 70 164L67 146Z';
 const no=profile.number==null?'26':String(profile.number).padStart(2,'0');
 const patterns={
  racing:path('M137 22Q167 17 189 22L225 116L197 189L171 253L132 251L165 181L177 123Z',s)+
   line('M153 24L192 122L182 181L151 251',t,5)+line('M181 25L213 119L203 180L177 251',t,2.5),
  chevron:path('M54 66L167 108L300 54L312 83L170 145L56 104ZM59 186L166 218L307 176L300 201L170 241L65 213Z',s)+
   line('M61 83L169 124L304 68M62 201L168 232L302 191',t,4),
  bands:line('M58 82Q173 39 307 96M51 208Q181 245 316 193',s,24)+
   line('M61 61Q178 24 297 74M57 226Q179 261 309 216',t,4),
  split:path('M210 20Q278 40 300 85L321 233L232 262L196 179L205 115Z',s)+
   line('M210 24L205 114L196 179L232 256',t,5),
  clean:line('M59 225Q185 264 309 218',s,10)+line('M61 232Q185 270 305 227',t,2),
  diagonal:path('M59 151L270 22L300 46L72 192ZM85 246L311 108L323 142L133 261Z',s)+
   line('M57 137L259 19M72 239L314 93',t,4),
  waves:line('M51 70C113 42 138 102 192 76S264 37 314 61M45 202C99 169 143 227 202 205S266 169 326 190',s,20)+
   line('M52 51C117 27 141 86 194 58S270 27 312 42M52 224C105 195 148 247 207 225S272 196 317 209',t,3),
  organic:Array.from({length:9},(_,i)=>line('M'+(63+i*5)+' '+(30+i*24)+'C'+(110+i*3)+' '+(11+i*25)+' '+(119+i*4)+' '+(78+i*18)+' '+(167+i*3)+' '+(56+i*23)+'S'+(252+i*3)+' '+(18+i*25)+' 320 '+(45+i*25),i%3===0?t:s,i%3===0?2:6,'stroke-linecap="round"')).join(''),
  facets:path('M64 91L137 30L199 97L157 122ZM194 23L299 57L249 112ZM58 200L128 180L176 250L102 247ZM202 196L308 170L300 224L239 253Z',s)+
   line('M76 90L137 42L185 94M197 204L291 183L284 221L240 244',t,3),
  stars:path('M52 193Q182 237 317 184L319 230Q182 278 62 231Z',s)+
   [[126,66,12],[183,46,9],[241,69,13],[270,204,9],[217,227,8],[104,213,8]].map(([x,y,r])=>{
    const points=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,k=i%2?r*.43:r;return (x+Math.cos(a)*k).toFixed(2)+' '+(y+Math.sin(a)*k).toFixed(2);});
    return path('M'+points.join('L')+'Z',t);
   }).join(''),
  checker:path('M52 61Q185 13 308 81L312 109Q183 44 52 91ZM52 207Q183 250 320 201L312 230Q180 273 59 235Z',url('checker'))+
   line('M55 95Q184 50 310 112M57 202Q182 243 316 197',t,3)
 };
 const glassStops={
  iridium:'<stop stop-color="#90e6fa" stop-opacity=".6"/><stop offset=".22" stop-color="#2384bf" stop-opacity=".2"/><stop offset=".48" stop-color="#070e20" stop-opacity=".45"/><stop offset=".78" stop-color="#5e4f89" stop-opacity=".35"/><stop offset="1" stop-color="#b9def3" stop-opacity=".45"/>',
  smoke:'<stop stop-color="#b2c3ce" stop-opacity=".32"/><stop offset=".4" stop-color="#01050a" stop-opacity=".5"/><stop offset="1" stop-color="#01050a" stop-opacity=".8"/>',
  silver:'<stop stop-color="#e4edf3" stop-opacity=".85"/><stop offset=".25" stop-color="#8595a1" stop-opacity=".55"/><stop offset=".57" stop-color="#142330" stop-opacity=".5"/><stop offset="1" stop-color="#cad9e1" stop-opacity=".75"/>',
  gold:'<stop stop-color="#ffeab1" stop-opacity=".85"/><stop offset=".24" stop-color="#c6943d" stop-opacity=".8"/><stop offset=".57" stop-color="#301b10" stop-opacity=".75"/><stop offset="1" stop-color="#e5bd65" stop-opacity=".8"/>'
 };
 const vent=(d,lip='')=>'<g class="apex-helmet-vent-assembly">'+path(d,'#02070a','class="apex-helmet-vent" stroke="#334550" stroke-width=".7"')+
  (lip?line(lip,'#d1e0e7',.75,'stroke-opacity=".38"'):'')+'</g>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 300" role="img" data-apex-helmet="competition-v3" data-paint="'+h.pattern+'" data-visor-finish="'+h.visorFinish+'" aria-label="Casco de competición personalizado, vista de tres cuartos">'+
  '<defs><clipPath id="'+prefix+'-shell">'+path(shell,'#fff')+'</clipPath><clipPath id="'+prefix+'-visor">'+path(visor,'#fff')+'</clipPath>'+
  '<linearGradient id="'+prefix+'-shellLight" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff" stop-opacity=".3"/><stop offset=".3" stop-color="#fff" stop-opacity=".05"/><stop offset=".62" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#01050a" stop-opacity=".72"/></linearGradient>'+
  '<radialGradient id="'+prefix+'-crown" cx=".32" cy=".18" r=".85"><stop stop-color="#fff" stop-opacity=".33"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></radialGradient>'+
  '<linearGradient id="'+prefix+'-lensCurve"><stop stop-color="#010710" stop-opacity=".55"/><stop offset=".23" stop-color="#fff" stop-opacity=".02"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#010710" stop-opacity=".65"/></linearGradient>'+
  '<linearGradient id="'+prefix+'-chinRelief" x1="0" y1="0" x2=".15" y2="1"><stop stop-color="#000" stop-opacity=".46"/><stop offset=".22" stop-color="#000" stop-opacity=".18"/><stop offset=".8" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient>'+
  '<linearGradient id="'+prefix+'-glass" x1="0" y1="0" x2="0" y2="1">'+glassStops[h.visorFinish]+'</linearGradient>'+
  '<linearGradient id="'+prefix+'-reflection"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#e0f8ff" stop-opacity=".4"/><stop offset=".6" stop-color="#fff" stop-opacity=".65"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'+
  '<linearGradient id="'+prefix+'-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d2dde2"/><stop offset=".3" stop-color="#4e626e"/><stop offset=".6" stop-color="#15242d"/><stop offset="1" stop-color="#758994"/></linearGradient>'+
  '<pattern id="'+prefix+'-checker" width="24" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-9)"><rect width="24" height="20" fill="'+s+'"/><path d="M0 0H12V10H0ZM12 10H24V20H12Z" fill="'+p+'"/></pattern></defs>'+
  (scope==='studio'?'<ellipse cx="192" cy="265" rx="116" ry="8" fill="#010508" opacity=".5"/>':'')+
  path('M284 83L315 93L323 103L299 101Z',url('metal'),'class="apex-helmet-spoiler" fill-opacity=".55" stroke="#71838e" stroke-opacity=".6" stroke-width=".8"')+
  path(shell,p,'class="apex-helmet-shell" stroke="#091219" stroke-width="1.6"')+
  '<g class="apex-helmet-paint" clip-path="'+url('shell')+'">'+patterns[h.pattern]+'</g>'+
  path(shell,url('shellLight'))+path(shell,url('crown'))+
  line('M96 84Q127 45 180 42Q229 38 266 64','#e5f1f6',1.4,'stroke-opacity=".3" stroke-linecap="round"')+
  '<g clip-path="'+url('shell')+'" class="apex-helmet-shell-contours">'+
   path('M260 63Q307 108 290 160L283 210Q281 229 265 239Q297 230 304 205L310 155Q316 104 284 76Z','#01070d','opacity=".18"')+
   line('M276 78Q298 112 294 148M280 179L279 209Q278 221 269 228','#d2e1e8',.8,'stroke-opacity=".18"')+'</g>'+
  line('M288 96Q309 159 298 206','#01070b',2,'stroke-opacity=".4"')+
  // Rubber eyeport seal, moulded brow and separate curved glass.
  path(visor,'#02070b','class="apex-helmet-eyeport" stroke="#020609" stroke-width="6" stroke-linejoin="round"')+
  path(visor,v,'class="apex-helmet-visor" stroke="#60717c" stroke-width="1"')+
  path(visor,url('glass'))+path(visor,url('lensCurve'),'class="apex-helmet-lens-curvature"')+
  '<g clip-path="'+url('visor')+'">'+path('M113 118Q126 115 138 117L120 174Q108 174 98 170Z',url('reflection'),'class="apex-helmet-visor-reflection"')+
   path('M235 119L244 122L225 176L217 177Z','#d6f3ff','opacity=".13"')+
   line('M77 158Q167 179 256 165','#b7dae8',.75,'stroke-opacity=".42"')+
   line('M65 144Q160 126 275 142','#dceff8',.8,'stroke-opacity=".22"')+'</g>'+
  path('M73 121Q159 105 241 118L268 128L267 133Q158 115 71 132Z',t,'class="apex-helmet-brow"')+
  line('M71 164Q166 184 264 169','#899da7',1,'stroke-opacity=".5"')+
  // Chin recess, rubber base and small machined visor attachments.
  '<g clip-path="'+url('shell')+'" class="apex-helmet-chin-recess">'+
   path('M68 174Q104 184 143 184L150 193L136 201L73 195L64 187Z',url('chinRelief'))+
   line('M73 177Q106 187 139 186L144 192',t,.85,'stroke-opacity=".3"')+
   vent('M76 185L100 189L98 193L74 189Z','M76 185L100 189')+
   vent('M110 191L136 192L134 196L108 195Z','M110 191L136 192')+
   vent('M79 205L98 209L124 209L122 214L101 214L81 210Z','M81 205L98 209H123')+
   line('M98 210L98 213M106 210V213M114 210V213','#687b87',.6,'stroke-opacity=".5"')+
   vent('M248 70L264 78L262 82L246 74Z','M248 70L264 78')+
   vent('M151 46L175 43L176 47L152 51Z','M151 46L175 43')+'</g>'+
  path('M67 218Q103 241 158 241L225 246Q269 244 298 224L290 237Q266 255 222 258L108 250Q80 246 70 230Z','#080f14','class="apex-helmet-base"')+
  line('M80 227Q168 253 267 235',t,1.2,'stroke-opacity=".6"')+
  path('M88 238Q173 258 240 250L232 256L111 250Z','#17252d','class="apex-helmet-neck-roll"')+
  line('M110 248Q172 261 226 254','#8296a1',.7,'stroke-opacity=".25"')+
  path('M261 130Q277 129 281 139L275 160L258 169L251 160Z','#16242d','class="apex-helmet-hinge" stroke="#70848e" stroke-width="1"')+
  '<circle cx="267" cy="143" r="7" fill="'+url('metal')+'"/><circle cx="267" cy="143" r="2.8" fill="#0a151d"/>'+
  line('M265 141L269 145','#a5b6be',.9)+
  path('M248 162L264 155L267 161L253 172Z',url('metal'))+
  '<circle cx="256" cy="164" r="2" fill="#07131a"/>'+
  '<g class="apex-helmet-tearoff">'+
   path('M247 145L254 142L256 146L250 151Z','#c9e0eb','fill-opacity=".3" stroke="#cbe5ef" stroke-opacity=".4" stroke-width=".6"')+
   '<circle cx="250" cy="147" r="1.8" fill="#081722" stroke="#708a99" stroke-width=".6"/>'+
   '<circle cx="85" cy="143" r="1.7" fill="#17313e" stroke="#9cb5c2" stroke-width=".6"/>'+
  '</g>'+
  '<text x="150" y="91" text-anchor="middle" transform="rotate(-7 150 91)" font-size="27" font-family="Arial,sans-serif" font-weight="900" fill="'+t+'" stroke="#030911" stroke-opacity=".4" stroke-width=".6">'+no+'</text>'+
  '<text x="183" y="127" text-anchor="middle" font-size="7" letter-spacing="2.5" font-family="Arial,sans-serif" font-weight="900" fill="#13232c">APEX 26</text>'+
  '<text x="205" y="218" text-anchor="middle" transform="rotate(-5 205 218)" font-size="8" letter-spacing=".6" font-family="Arial,sans-serif" font-weight="700" fill="'+t+'">'+escape(profile.name||'APEX RACING')+'</text></svg>';
}
function render(){
 if(!form)return;
 const current=profilePatch(form);
 $('apexProfileHelmetImage').innerHTML=helmetSvg(current);
 $('apexProfileNamePreview').textContent=current.name||'TU NOMBRE';
 $('apexProfileNumberPreview').textContent=current.number==null?'#26':'#'+String(current.number).padStart(2,'0');
 $('apexProfilePreviewHelp').textContent=PATTERN_NAMES[current.helmet.pattern]+' · Misma forma, distinta pintura';
 global.ApexDriverAppearance9F?.render?.(current);
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
  ['helmetTrim','trim'],['helmetVisor','visor'],['helmetVisorFinish','visorFinish'],['helmetPattern','pattern']]){
  form.elements[control].value=p.helmet[key];
 }
 for(const [control,key] of [['suitPrimary','primary'],['suitSecondary','secondary'],
  ['suitTrim','trim'],['suitPattern','pattern'],['suitSource','source']]){
  if(form.elements[control])form.elements[control].value=p.suit[key];
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
 PATTERNS.map(key=>'<option value="'+key+'">'+PATTERN_NAMES[key]+'</option>').join('')+'</select>'+
 '<label class="apexProfilePatternLabel" for="apexHelmetVisorFinish">ACABADO DE VISERA</label>'+
 '<select id="apexHelmetVisorFinish" name="helmetVisorFinish"><option value="iridium">Iridio</option><option value="smoke">Ahumada</option><option value="silver">Espejo plata</option><option value="gold">Espejo dorado</option></select>'+
 '<div class="apexHelmetRestore"><button id="apexHelmetRecover" type="button">RECUPERAR GUARDADO</button><button id="apexHelmetReset" type="button">RESTABLECER CASCO</button></div>'+
 '<small id="apexProfilePreviewHelp"></small></div></div>'+
 '<div class="apexProfileActions"><span id="apexProfileStatus" role="status" aria-live="polite"></span>'+
 '<button id="apexProfileCancel" type="button">CANCELAR</button>'+
 '<button id="apexProfileSave" type="submit">GUARDAR PERFIL ❯❯</button></div></form></div>';
 menu.append(screen);
 form=$('apexDriverProfileForm');
 form.addEventListener('input',render);
 form.addEventListener('change',render);
 form.addEventListener('submit',e=>{e.preventDefault();if(form.checkValidity())save();else form.reportValidity();});
 const restoreHelmet=helmet=>{
  for(const [control,key] of [['helmetPrimary','primary'],['helmetSecondary','secondary'],['helmetTrim','trim'],['helmetVisor','visor'],['helmetVisorFinish','visorFinish'],['helmetPattern','pattern']])form.elements[control].value=helmet[key];
  render();
 };
 $('apexHelmetRecover').onclick=()=>restoreHelmet(state.helmet);
 $('apexHelmetReset').onclick=()=>restoreHelmet(DEFAULT().helmet);
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
