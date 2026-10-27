/* APEX 26 · Vista de estudio F1 2026. Sólo SVG/CPU ligero, sin WebGL extra.
 * La geometría y la decoración se derivan del blueprint nativo de cada equipo.
 * Los tonos de personalización proceden de los controles carColor/carAccent.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const cache=new Map();
const hex=(s,f)=>/^#[0-9a-f]{6}$/i.test(String(s||''))?String(s).toLowerCase():f;
const safe=s=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,36);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||1));
function markup(profile){
 if(!profile?.geometry||!profile?.livery)return null;
 const g=profile.geometry,l=profile.livery;
 const p=hex(l.primary,'#f58a00'),s=hex(l.secondary,'#161a20'),
       a=hex(l.accent,'#3ccef8'),stripe=hex(l.stripe,a),
       carbon=hex(l.carbon,'#080d13'),wing=hex(l.wing,'#10161e'),
       trim=hex(l.trim,'#f5f8fb'),halo=hex(l.halo,p);
 const nose=clamp(g.noseWidth,.8,1.22),noseL=clamp(g.noseLen,.8,1.22);
 const pod=clamp(g.sidepodWidth,.8,1.22),front=clamp(g.frontWing,.8,1.22);
 const rear=clamp(g.rearWing,.8,1.22),wheel=clamp(g.wheelScale,.8,1.22);
 const cockpit=clamp(g.cockpitWidth,.8,1.22);
 const finish=['silver','carbon','white'].includes(l.finish)?l.finish:'paint';
 const surface=finish==='silver'?'#adb9c5':finish==='white'?'#edf2f4':finish==='carbon'?carbon:s;
 const surfLine=finish==='silver'?'#e7f1f8':finish==='white'?'#ffffff':finish==='carbon'?'#293741':trim;
 const xFront=773+(noseL-1)*28,frontHalf=183*front,rearHalf=118*rear;
 const nWidth=26*nose, podWidth=82*pod;
 const id=safe(profile.teamKey),model=safe(profile.model),chassis=safe(profile.chassis);
 const marks=(y,side)=>Array.from({length:6},(_,i)=>'<path d="M'+(348+i*8)+' '+(y+side*i*2)+' l18 '+(side*9)+'" stroke="'+trim+'" opacity=".14" stroke-width="2"/>').join('');
 const tire=(x,y,w,h)=>{
  // Slick 2026 tyres: restrained scuffing, rounded shoulder, sidewall
  // ring and a narrow red sidewall identification line. No tread grooves.
  const shoulder=Math.max(8,Math.min(16,w*.16));
  const marks=Array.from({length:7},(_,i)=>{
   const yy=y+14+i*(h-28)/6;
   return '<path d="M'+(x+6)+' '+yy+'l'+(shoulder*.65)+' -2M'+(x+w-6)+' '+yy+'l-'+(shoulder*.65)+' -2"'+
    ' stroke="#8a8e90" stroke-opacity="'+(.085+i%3*.027)+'" stroke-width="2"/>';
  }).join('');
  return '<g>'+
   '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(shoulder+3)+'" fill="#030609" opacity=".95" stroke="#010204" stroke-width="6"/>'+
   '<rect x="'+(x+3)+'" y="'+(y+3)+'" width="'+(w-6)+'" height="'+(h-6)+'" rx="'+shoulder+'" fill="url(#tire)" stroke="#34383c" stroke-opacity=".45" stroke-width="2"/>'+
   '<path d="M'+(x+9)+' '+(y+13)+'Q'+(x+shoulder)+' '+(y+h*.5)+' '+(x+9)+' '+(y+h-13)+
   'M'+(x+w-9)+' '+(y+13)+'Q'+(x+w-shoulder)+' '+(y+h*.5)+' '+(x+w-9)+' '+(y+h-13)+'"'+
   ' fill="none" stroke="#838a90" stroke-opacity=".24" stroke-width="3"/>'+
   '<path d="M'+(x+25)+' '+(y+9)+'V'+(y+h-9)+
   'M'+(x+w-25)+' '+(y+9)+'V'+(y+h-9)+'" fill="none" stroke="#06090c" stroke-opacity=".68" stroke-width="4"/>'+
   '<rect x="'+(x+w*.48)+'" y="'+(y+6)+'" width="2.4" height="'+(h-12)+'" rx="1.2" fill="#d92330" opacity=".7"/>'+
   '<path d="M'+(x+shoulder+2)+' '+(y+6)+'Q'+(x+w*.5)+' '+(y-1)+' '+(x+w-shoulder-2)+' '+(y+6)+
   'M'+(x+shoulder+2)+' '+(y+h-6)+'Q'+(x+w*.5)+' '+(y+h+1)+' '+(x+w-shoulder-2)+' '+(y+h-6)+'"'+
   ' fill="none" stroke="#9fa7ab" stroke-opacity=".25" stroke-width="2"/>'+marks+'</g>';
 };
 const f=(v)=>Number(v).toFixed(1);
 const pattern= l.pattern==='chevron'?'<path d="M330 175L425 235L330 296" fill="none" stroke="'+stripe+'" stroke-width="25" opacity=".8"/>':
 l.pattern==='center'?'<path d="M226 235H745" stroke="'+stripe+'" stroke-width="16" opacity=".8"/>':
 l.pattern==='split'?'<path d="M245 235H732" stroke="'+stripe+'" stroke-width="24" opacity=".75"/>':
 l.pattern==='double'?'<path d="M270 200L701 209M270 270L701 261" fill="none" stroke="'+stripe+'" stroke-width="10"/>':
 l.pattern==='bars'?'<path d="M373 159L397 311M419 155L449 310" stroke="'+stripe+'" stroke-width="13"/>':
 l.pattern==='flank'?'<path d="M246 169Q435 133 584 189M246 301Q435 337 584 281" stroke="'+stripe+'" stroke-width="12" fill="none"/>':
 '<path d="M265 181Q450 132 642 218M265 289Q450 338 642 252" fill="none" stroke="'+stripe+'" stroke-width="12" opacity=".82"/>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 470" width="1000" height="470" role="img"'+
 ' data-apex-team="'+id+'" data-apex-model="'+model+'" data-apex-chassis="'+chassis+'"'+
 ' aria-label="Monoplaza F1 2026 de '+id+' '+model+'">'+
 '<defs>'+
 '<linearGradient id="body" x1="0" y1="0" x2=".38" y2="1"><stop stop-color="'+trim+'" stop-opacity=".33"/><stop offset=".22" stop-color="'+p+'"/><stop offset=".62" stop-color="'+p+'"/><stop offset="1" stop-color="'+s+'"/></linearGradient>'+
 '<linearGradient id="pod" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+p+'"/><stop offset=".25" stop-color="'+s+'"/><stop offset=".6" stop-color="'+p+'"/><stop offset="1" stop-color="'+s+'"/></linearGradient>'+
 '<linearGradient id="carbon" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#29323a"/><stop offset=".5" stop-color="'+carbon+'"/><stop offset="1" stop-color="#020406"/></linearGradient>'+
 '<linearGradient id="tire" x1="0" y1="0" x2=".9" y2="0"><stop stop-color="#06080a"/><stop offset=".2" stop-color="#292c2f"/><stop offset=".42" stop-color="#14191d"/><stop offset=".67" stop-color="#24282c"/><stop offset="1" stop-color="#050609"/></linearGradient>'+
 '<pattern id="weave" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0l8 8M-2 2l8 8M2-2l8 8" stroke="#cce0ea" opacity=".12" stroke-width=".55"/></pattern>'+
 '<linearGradient id="wingShine" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#4c5359"/><stop offset=".2" stop-color="'+wing+'"/><stop offset=".55" stop-color="#020406"/><stop offset="1" stop-color="#343941"/></linearGradient>'+
 '<linearGradient id="finish" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+surfLine+'" stop-opacity=".84"/><stop offset=".15" stop-color="'+surface+'"/><stop offset=".49" stop-color="'+surface+'" stop-opacity=".48"/><stop offset=".91" stop-color="'+surface+'"/><stop offset="1" stop-color="#03070a"/></linearGradient>'+
 '<linearGradient id="gloss" x1=".1" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".38"/><stop offset=".23" stop-color="#cbd7e5" stop-opacity=".09"/><stop offset=".55" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#070c13" stop-opacity=".3"/></linearGradient>'+
 '<pattern id="carbonTwist" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 0L9 9M-2 2L7 11M2 -2L11 7" stroke="#dbe6ec" stroke-opacity=".19" stroke-width=".8"/></pattern>'+
 '<radialGradient id="rim" cx=".4" cy=".5" r=".8"><stop stop-color="#68727a"/><stop offset=".33" stop-color="#0d131a"/><stop offset=".69" stop-color="#02070a"/><stop offset="1" stop-color="#4c565d"/></radialGradient>'+
 '<filter id="drop" x="-20%" y="-40%" width="140%" height="190%"><feGaussianBlur stdDeviation="8"/></filter>'+
 '</defs>'+
 '<ellipse cx="500" cy="253" rx="445" ry="123" fill="#000" opacity=".43" filter="url(#drop)"/>'+
 // Rear wing assembly and underfloor
 '<path d="M130 139H343L585 114L794 169L812 301L589 356L343 331H130Z" fill="url(#carbon)" stroke="#090e12" stroke-width="7"/>'+
 '<path d="M133 155H334L576 130H720L594 340L337 316H133Z" fill="url(#weave)" opacity=".35"/>'+
 '<path d="M62 '+f(235-rearHalf)+'H143L155 '+f(235-rearHalf+10)+'V'+f(235+rearHalf-10)+'L143 '+f(235+rearHalf)+'H62Z" fill="url(#wingShine)" stroke="#06090c" stroke-width="4"/>'+
 '<path d="M69 '+f(235-rearHalf+9)+'H138M69 '+f(235+rearHalf-9)+'H138" stroke="'+p+'" stroke-width="10"/>'+
 '<path d="M83 '+f(235-rearHalf+25)+'V'+f(235+rearHalf-25)+'M109 '+f(235-rearHalf+27)+'V'+f(235+rearHalf-27)+'" stroke="'+a+'" stroke-width="3" opacity=".72"/>'+
 '<path d="M143 191L234 155M143 279L234 315M145 183L230 235M145 287L230 235" stroke="#111920" stroke-width="13"/>'+
 // Rear wheels
 tire(169,38,92,96*wheel)+tire(169,336,92,96*wheel)+
 '<path d="M195 140L271 184M195 330L271 286M201 145L272 239M201 325L272 231" stroke="#39434b" stroke-width="9" opacity=".8"/>'+
 // Sidepods, venturi tunnels: layered organic aerodynamic sweeps
 '<path d="M228 188Q302 131 '+f(390+podWidth*.7)+' 143L556 161Q609 183 652 216L637 232H330Z" fill="url(#pod)" stroke="#070b0f" stroke-width="6"/>'+
 '<path d="M228 282Q302 339 '+f(390+podWidth*.7)+' 327L556 309Q609 287 652 254L637 238H330Z" fill="url(#pod)" stroke="#070b0f" stroke-width="6"/>'+
 '<path d="M235 181Q380 154 523 175L602 211L345 220Z" fill="'+s+'" opacity=".88"/>'+
 '<path d="M235 289Q380 316 523 295L602 259L345 250Z" fill="'+s+'" opacity=".88"/>'+
 '<path d="M270 169Q394 148 541 173M270 301Q394 322 541 297" stroke="'+trim+'" stroke-width="3.4" opacity=".32" fill="none"/>'+
 '<path d="M263 188Q380 180 541 201M263 282Q380 290 541 269" stroke="'+a+'" stroke-width="9" opacity=".85" fill="none"/>'+
 marks(182,1)+marks(288,-1)+
 // Engine cover and upper central body
 '<path d="M155 209Q222 204 304 191Q383 176 444 195L556 204Q650 212 763 '+f(235-32*nose)+'L'+f(xFront+30)+' 235L763 '+f(235+32*nose)+'Q650 258 556 266L444 275Q383 294 304 279Q222 266 155 261Z" fill="url(#body)" stroke="#080b11" stroke-width="7"/>'+
 '<path d="M174 222Q282 214 357 208L427 230M174 248Q282 256 357 262L427 240" fill="none" stroke="'+s+'" stroke-width="19" opacity=".86"/>'+
 '<path d="M187 231Q296 227 410 226M187 239Q296 243 410 244" fill="none" stroke="'+trim+'" stroke-width="2" opacity=".37"/>'+
 pattern+
 // Airbox, mirrors and driver cockpit
 '<path d="M391 212L415 193L444 212V258L415 277L391 258Z" fill="#080d12" stroke="'+p+'" stroke-width="9"/>'+
 '<path d="M430 '+f(235-37*cockpit)+'Q462 '+f(235-56*cockpit)+' 500 '+f(235-46*cockpit)+
 'Q544 204 576 235Q544 266 500 '+f(235+46*cockpit)+'Q462 '+f(235+56*cockpit)+' 430 '+f(235+37*cockpit)+'Z" fill="#060a11" stroke="'+trim+'" stroke-width="3.2" stroke-opacity=".61"/>'+
 '<path d="M455 216Q496 204 527 231Q504 245 465 250Z" fill="#121923" stroke="#536171" stroke-width="2"/>'+
 '<ellipse cx="497" cy="236" rx="17" ry="20" fill="'+halo+'" stroke="#030507" stroke-width="5"/>'+
 '<path d="M434 207Q488 180 562 228M434 263Q488 290 562 242" fill="none" stroke="#070d12" stroke-width="13"/>'+
 '<path d="M483 209V261" stroke="#11161b" stroke-width="12"/>'+
 '<path d="M518 214V257" stroke="'+p+'" stroke-width="3" opacity=".83"/>'+
 '<path d="M436 201L418 179M436 269L418 291M418 179L397 177M418 291L397 293" stroke="#141a20" stroke-width="6" fill="none"/>'+
 '<rect x="386" y="168" width="29" height="10" rx="2" fill="#080b11" stroke="'+trim+'" stroke-opacity=".2"/>'+
 '<rect x="386" y="292" width="29" height="10" rx="2" fill="#080b11" stroke="'+trim+'" stroke-opacity=".2"/>'+
 // Continuous narrow nose, wheel suspension triangulation
 '<path d="M553 223L'+f(xFront+43)+' '+f(235-9*nose)+'L'+f(xFront+77)+' 235L'+f(xFront+43)+' '+f(235+9*nose)+'L553 247Z" fill="'+p+'" stroke="'+carbon+'" stroke-width="4"/>'+
 '<path d="M569 235H'+f(xFront+64)+'" stroke="'+stripe+'" stroke-width="7" opacity=".78"/>'+
 '<path d="M685 233L791 115M685 237L791 355M747 231L784 123M747 239L784 347" fill="none" stroke="#090f13" stroke-width="13"/>'+
 '<path d="M687 230L790 112M687 240L790 358M745 230L783 120M745 240L783 350" fill="none" stroke="#65707a" stroke-width="2.3" opacity=".62"/>'+
 tire(747,38,82,89*wheel)+tire(747,342,82,89*wheel)+
 // Modern 2026 active-aero front wing, separate mainplane + multiple flaps
 '<path d="M'+f(xFront+63)+' '+f(235-frontHalf)+'H949V'+f(235+frontHalf)+'H'+f(xFront+63)+'Z" fill="url(#wingShine)" stroke="#070a0e" stroke-width="5"/>'+
 '<path d="M'+f(xFront+69)+' '+f(235-frontHalf+15)+'Q903 '+f(235-frontHalf+26)+' 946 '+f(235-frontHalf+9)+
 'M'+f(xFront+69)+' '+f(235+frontHalf-15)+'Q903 '+f(235+frontHalf-26)+' 946 '+f(235+frontHalf-9)+'" stroke="'+a+'" stroke-width="6" fill="none"/>'+
 '<path d="M'+f(xFront+77)+' '+f(235-frontHalf+25)+'Q896 188 947 208M'+f(xFront+77)+' '+f(235+frontHalf-25)+'Q896 282 947 262" stroke="'+p+'" stroke-width="18" fill="none" opacity=".9"/>'+
 '<path d="M890 '+f(235-frontHalf+8)+'V'+f(235+frontHalf-8)+'M926 '+f(235-frontHalf+12)+'V'+f(235+frontHalf-12)+'" stroke="#e2ebf6" stroke-opacity=".27" stroke-width="2.5"/>'+
 '<path d="M868 222H969V248H868Z" fill="'+wing+'"/>'+
 // Convincing aero surfaces: sculpted sidepod shoulders / floor-edge vortices
 '<path d="M280 169Q420 133 570 184L633 225L552 197Q415 159 290 198Z" fill="url(#finish)" opacity=".96" stroke="#03070b" stroke-width="3"/>'+
 '<path d="M280 301Q420 337 570 286L633 245L552 273Q415 311 290 272Z" fill="url(#finish)" opacity=".96" stroke="#03070b" stroke-width="3"/>'+
 '<path d="M295 178Q403 156 542 191M295 292Q403 314 542 279" stroke="url(#gloss)" stroke-width="13" fill="none"/>'+
 '<path d="M267 172Q383 141 552 171L620 207M267 298Q383 329 552 299L620 263" stroke="'+a+'" opacity=".56" stroke-width="2.4" fill="none"/>'+
 // Sculpted inlets and precisely segmented carbon fibre guides.
 '<path d="M377 188Q424 179 463 196L440 210L384 206Z M377 282Q424 291 463 274L440 260L384 264Z" fill="#02080d" stroke="#657580" stroke-width="1.7" opacity=".92"/>'+
 '<path d="M382 194L445 201M382 276L445 269" stroke="#b7cedf" opacity=".18" stroke-width="4"/>'+
 '<path d="M227 171Q360 134 510 164L555 179M227 299Q360 336 510 306L555 291" fill="none" stroke="url(#gloss)" stroke-width="12"/>'+
 // Glossy cross-vents with carbon texture on the engine cover.
 '<path d="M191 213Q279 200 348 200Q397 187 425 198L402 219Q295 222 191 226Z" fill="url(#carbonTwist)" opacity=".76"/>'+
 '<path d="M191 257Q279 270 348 270Q397 283 425 272L402 251Q295 248 191 244Z" fill="url(#carbonTwist)" opacity=".76"/>'+
 // Side floor channels and bodywork fasteners (subtle at mobile resolution)
 '<path d="M236 178Q310 150 368 154M236 292Q310 320 368 316" stroke="#bac4cc" opacity=".36" stroke-width="2" fill="none"/>'+
 '<path d="M245 192L295 184M245 278L295 286" stroke="'+p+'" stroke-width="6" opacity=".89"/>'+
 '<g fill="#bac8d4" opacity=".55"><circle cx="293" cy="167" r="2"/><circle cx="293" cy="303" r="2"/><circle cx="326" cy="165" r="2"/><circle cx="326" cy="305" r="2"/><circle cx="598" cy="218" r="2"/><circle cx="598" cy="252" r="2"/><circle cx="740" cy="233" r="2"/></g>'+
 // F1 2026 halo attachment, steering wheel and instrument display.
 '<path d="M446 202Q484 196 524 206M446 268Q484 274 524 264" stroke="'+p+'" stroke-width="2.5" fill="none" opacity=".87"/>'+
 '<path d="M466 226h21v17h-21z" rx="3" fill="#171e2a" stroke="#728ca0" stroke-width="1.5"/>'+
 '<path d="M470 231h13M470 235h13M470 239h9" stroke="'+a+'" stroke-width="1.5"/>'+
 '<path d="M529 234h28" stroke="#17232d" stroke-width="6"/>'+
 // Multi-element front-wing flaps and small winglet supports.
 '<path d="M866 '+f(235-frontHalf+39)+'Q908 '+f(235-frontHalf+30)+' 954 '+f(235-frontHalf+44)+
 'M866 '+f(235+frontHalf-39)+'Q908 '+f(235+frontHalf-30)+' 954 '+f(235+frontHalf-44)+'" stroke="'+p+'" stroke-width="12" fill="none"/>'+
 '<path d="M874 '+f(235-frontHalf+63)+'Q917 '+f(235-frontHalf+49)+' 957 '+f(235-frontHalf+61)+
 'M874 '+f(235+frontHalf-63)+'Q917 '+f(235+frontHalf-49)+' 957 '+f(235+frontHalf-61)+'" stroke="'+surfLine+'" stroke-width="3.1" stroke-opacity=".53" fill="none"/>'+
 '<path d="M948 '+f(235-frontHalf+10)+'l15 -6v36l-15 -6M948 '+f(235+frontHalf-10)+'l15 6v-36l-15 6" fill="'+wing+'" stroke="'+a+'" stroke-width="3"/>'+
 // Carbon-surface roof reflections and segment separators on rear wing.
 '<path d="M76 '+f(235-rearHalf+40)+'H132M76 '+f(235+rearHalf-40)+'H132" stroke="'+surfLine+'" stroke-opacity=".42" stroke-width="3"/>'+
 '<path d="M84 '+f(235-rearHalf+14)+'V'+f(235+rearHalf-14)+'M91 '+f(235-rearHalf+14)+'V'+f(235+rearHalf-14)+'" stroke="#bcc7cc" stroke-opacity=".21" stroke-width="2"/>'+
 // Half-panel clarity: large recognisable flowing 2026 aero shapes
 // remain legible even when the 1000px drawing is displayed at ~370px.
 '<path d="M310 160Q446 120 576 162L612 201Q547 181 476 167Q389 153 310 182Z" fill="url(#carbon)" opacity=".61"/>'+
 '<path d="M310 310Q446 350 576 308L612 269Q547 289 476 303Q389 317 310 288Z" fill="url(#carbon)" opacity=".61"/>'+
 '<path d="M296 174Q438 137 561 186M296 296Q438 333 561 284" stroke="'+p+'" opacity=".84" stroke-width="7" fill="none"/>'+
 '<path d="M325 185Q440 168 539 205M325 285Q440 302 539 265" stroke="'+a+'" opacity=".95" stroke-width="4.5" fill="none"/>'+
 // A thin engine-cover spine, authentic radiator inlet silhouettes.
 '<path d="M198 231Q298 223 365 221L404 234L365 249Q298 247 198 239" fill="'+carbon+'" stroke="'+trim+'" stroke-opacity=".3" stroke-width="2"/>'+
 '<path d="M333 200Q394 190 423 204M333 270Q394 280 423 266" stroke="#060d14" opacity=".9" stroke-width="8" fill="none"/>'+
 // Two cockpit headrest lobes and a clearly visible carbon halo arch.
 '<path d="M445 213Q484 192 529 213M445 257Q484 278 529 257" fill="none" stroke="#dce6eb" stroke-opacity=".28" stroke-width="2"/>'+
 '<path d="M459 209Q488 194 522 208M459 261Q488 276 522 262" fill="none" stroke="'+carbon+'" stroke-width="6"/>'+
 // Airbox intake behind the helmet, slim central stabilizer and bolts.
 '<path d="M415 212L438 224L438 246L415 258L405 244L405 226Z" fill="#03080e" stroke="'+p+'" stroke-width="4"/>'+
 '<path d="M411 227h15v16h-15z" fill="url(#carbonTwist)" stroke="#5c6973" stroke-width="1"/>'+
 // Realistic front-wing flap segmentation with raised endplate lips.
 '<path d="M853 '+f(235-frontHalf+23)+'Q893 '+f(235-frontHalf+8)+' 946 '+f(235-frontHalf+20)+
 'M853 '+f(235+frontHalf-23)+'Q893 '+f(235+frontHalf-8)+' 946 '+f(235+frontHalf-20)+'" fill="none" stroke="'+p+'" stroke-width="8"/>'+
 '<path d="M878 '+f(235-frontHalf+46)+'Q910 '+f(235-frontHalf+39)+' 944 '+f(235-frontHalf+48)+
 'M878 '+f(235+frontHalf-46)+'Q910 '+f(235+frontHalf-39)+' 944 '+f(235+frontHalf-48)+'" fill="none" stroke="'+a+'" stroke-width="3.5"/>'+
 '<path d="M944 '+f(235-frontHalf+10)+'h13v29M944 '+f(235+frontHalf-10)+'h13v-29" fill="none" stroke="'+surfLine+'" stroke-opacity=".8" stroke-width="3"/>'+
 // Clear suspension pickup points and real-world structural diagonals.
 '<g fill="#778995" opacity=".86"><circle cx="752" cy="145" r="4"/><circle cx="752" cy="325" r="4"/><circle cx="698" cy="234" r="3"/><circle cx="258" cy="148" r="4"/><circle cx="258" cy="322" r="4"/></g>'+
 // Fine vehicle graphics; no brand/trademark reproductions
 '<path d="M307 196L371 184M307 274L371 286" stroke="'+a+'" stroke-width="4" opacity=".9"/>'+
 '<text x="653" y="227" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="'+trim+'" text-anchor="middle">'+model+'</text>'+
 '<text x="345" y="239" font-family="Arial,sans-serif" font-size="16" letter-spacing="2" font-weight="900" fill="'+trim+'" opacity=".75" text-anchor="middle">'+chassis+'</text>'+
 '<path d="M585 215l5 7 8-1-7 6 2 8-8-5-6 5 1-9-8-4 9-2z" fill="'+a+'" opacity=".78"/>'+
 // Opposite side lighting adds curvature; no second car image.
 '<path d="M278 157Q460 122 586 190M278 313Q460 348 586 280" stroke="'+trim+'" stroke-width="1.8" opacity=".12" fill="none"/>'+
 '</svg>';
}
function build(teamKey){
 const key=String(teamKey||'');
 const t=global.ApexNativeTeamStudio9A?.get?.(key);
 const blueprint=t?.preview;
 if(!blueprint||blueprint.teamKey!==key)return null;
 const override=global.ApexVehicleStudio9A?.colorsFor?.(key)||null;
 const l=override?{...blueprint.livery,...override}:blueprint.livery;
 const input={...blueprint,livery:l};
 const cacheKey=JSON.stringify(input);
 if(cache.has(cacheKey))return cache.get(cacheKey);
 const svg=markup(input);
 if(!svg)return null;
 const result=Object.freeze({key,model:blueprint.model,chassis:blueprint.chassis,
  svg,src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
 if(cache.size>48)cache.clear(); // Avoid retaining every intermediate picker colour.
 cache.set(cacheKey,result);return result;
}
function setCar(teamKey){
 const img=$('apexProtoTeamImage');if(!img)return false;
 const t=global.ApexNativeTeamStudio9A?.get?.(teamKey);
 const render=build(teamKey);
 if(!render){
  img.removeAttribute('src');
  img.dataset.apexPreview='unavailable';img.hidden=true;return false;
 }
 img.hidden=false;
 img.alt='Vista cenital F1 2026 del monoplaza '+(t?.name||'')+' ('+render.model+' · '+render.chassis+')';
 img.dataset.apexTeamKey=render.key;
 img.dataset.apexModel=render.model;
 img.dataset.apexChassis=render.chassis;
 img.dataset.apexPreview='native-blueprint';
 if(img.src!==render.src)img.src=render.src;
 return true;
}
global.ApexTeamCarPreview9A=Object.freeze({build,setCar,markup});
})(window);
