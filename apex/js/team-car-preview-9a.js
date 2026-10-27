/* APEX 26 · Lightweight overhead studio drawing. Geometry only: the native
 * team catalogue, palette, persistence and image lifecycle remain unchanged.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const cache=new Map();
const hex=(s,f)=>/^#[0-9a-f]{6}$/i.test(String(s||''))?String(s).toLowerCase():f;
const safe=s=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,36);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||1));
// Showroom interpretations of the catalogue's inspiredBy references, not CAD
// replicas or changes to the racing physics/mesh. Each has its own shoulder,
// undercut, inlet, engine-cover, nose and wing curves; colours remain swappable.
const designs=Object.freeze({
 PAPAYA:{reference:'McLaren',nose:[16,27,0],wing:[0,0,4],rear:[0,0],cover:[22,47,58,25],podBase:'primary',
  pod:'M264 216C330 205 346 167 415 134C484 111 573 110 620 129Q646 139 648 160L640 195L618 219Q536 213 462 211Q366 223 264 224Z',
  panel:'M289 216C369 199 392 159 458 143Q550 125 608 146L627 167L612 185Q552 166 493 183Q394 215 289 220Z',
  stripe:'M292 216C378 206 414 178 451 151Q480 129 516 131Q572 131 611 151',
  inlet:'M596 150Q620 145 638 157L641 172Q616 164 594 168Z',
  livery:'sweep'},
 SILVERWING:{reference:'Mercedes',nose:[20,24,-8],wing:[-12,14,3],rear:[10,-4],cover:[16,34,49,18],podBase:'secondary',
  pod:'M274 220L348 203Q397 153 460 137L589 128Q626 128 641 145L641 181L617 203L552 211L427 211Z',
  panel:'M324 211L400 164Q445 149 494 147L609 141L628 153L614 182L548 193L425 207Z',
  stripe:'M323 216L415 191L518 182L621 165',
  inlet:'M600 145L638 144L638 155L601 159Z',
  livery:'center'},
 FERRATI:{reference:'Ferrari',nose:[21,37,-14],wing:[10,-12,3],rear:[-6,5],cover:[30,61,65,30],podBase:'primary',
  pod:'M267 215Q337 198 367 156C403 126 468 113 549 116Q612 118 641 142Q652 160 644 180L622 205Q527 221 452 214L338 224Z',
  panel:'M309 214Q365 197 400 161Q478 123 558 131Q602 132 628 151L625 176Q561 152 509 167Q415 202 309 219Z',
  stripe:'M342 204Q433 143 531 140L610 153',
  inlet:'M601 149Q619 142 638 154L633 174L600 170Z',
  livery:'double'},
 BULLHORN:{reference:'Red Bull Racing',nose:[13,22,4],wing:[-17,23,4],rear:[7,-7],cover:[14,31,57,17],podBase:'primary',
  pod:'M258 220C342 218 366 180 399 146Q441 113 522 112L609 111Q644 112 655 136L641 183L615 208Q541 211 472 209L370 220Z',
  panel:'M293 217Q384 199 414 153Q455 126 526 124L619 124L638 140L619 178L554 181L467 202Z',
  stripe:'M323 215L424 170L487 134L568 133L619 146',
  inlet:'M606 128L646 126L641 146L606 153Z',
  livery:'chevron'},
 SUNRIDGE:{reference:'Racing Bulls',nose:[18,31,-4],wing:[4,8,3],rear:[-1,-9],cover:[23,46,53,27],podBase:'primary',
  pod:'M271 218Q344 206 391 159C425 138 475 125 544 125Q616 126 645 147L646 176L621 202Q556 217 483 211Q374 227 271 225Z',
  panel:'M316 214Q406 178 443 148Q522 129 602 146L629 160L614 185Q548 162 488 187Q414 211 316 219Z',
  stripe:'M330 213Q447 150 515 145L616 161',
  inlet:'M610 149L639 150L640 165L605 169Z',
  livery:'split'},
 ALPEN:{reference:'Alpine',nose:[15,33,-10],wing:[-6,-16,4],rear:[-8,8],cover:[20,40,62,24],podBase:'primary',
  pod:'M269 220L347 204L404 148Q441 126 498 119L608 121L649 140L648 180L621 210L530 214L405 217Z',
  panel:'M319 215L399 182L441 146L517 135L612 137L631 151L611 184L529 190L412 211Z',
  stripe:'M337 212L412 177L449 145L524 133L616 145',
  inlet:'M603 143L641 149L632 173L602 166Z',
  livery:'flank'},
 MIDNIGHT:{reference:'Haas',nose:[23,35,-18],wing:[14,-5,3],rear:[-4,12],cover:[27,55,59,32],podBase:'primary',
  pod:'M275 218L354 199L398 147L456 129L601 129L643 144L646 182L616 211L480 215L359 225Z',
  panel:'M331 214L405 169L467 145L602 144L628 157L612 186L492 191L397 216Z',
  stripe:'M352 210L419 174L477 153H610',
  inlet:'M607 149H638V170H607Z',
  livery:'bars'},
 AUREON:{reference:'Audi',nose:[19,29,-6],wing:[6,18,3],rear:[5,3],cover:[21,39,54,23],podBase:'secondary',
  pod:'M266 220L353 203L408 155L466 125L590 122L642 143L647 181L620 207L531 211L410 215Z',
  panel:'M313 216L397 183L454 140L577 134L622 151L624 174L557 179L463 203Z',
  stripe:'M329 215L430 185L480 148L593 145L620 159',
  inlet:'M606 145L640 155L635 174L604 165Z',
  livery:'blade'},
 OCEANIC:{reference:'Williams',nose:[17,26,6],wing:[-10,-7,4],rear:[2,10],cover:[19,43,51,22],podBase:'primary',
  pod:'M262 221C343 216 365 175 419 146Q470 127 547 130Q615 133 642 154L638 183L614 208Q542 214 473 212Q369 225 262 226Z',
  panel:'M310 216C388 202 413 160 467 148Q541 139 604 153L625 166L609 186Q541 170 482 190Q407 215 310 220Z',
  stripe:'M328 215Q415 176 469 159Q541 149 607 164',
  inlet:'M604 156Q621 148 635 160L631 176L602 173Z',
  livery:'pinstripe'},
 GREENSTONE:{reference:'Aston Martin',nose:[14,28,-1],wing:[-19,5,4],rear:[12,-3],cover:[13,30,56,19],podBase:'primary',
  pod:'M255 223C343 223 372 199 407 165C430 133 466 110 525 109Q595 102 641 131L648 163L624 203Q566 216 484 212Q378 223 255 228Z',
  panel:'M306 219Q395 210 436 156Q475 121 530 122Q587 119 624 143L630 160L611 186Q557 161 506 184Q410 218 306 223Z',
  stripe:'M324 219Q412 208 451 157Q510 116 608 148',
  inlet:'M608 137L640 141L635 151L605 155Z',
  livery:'spear'},
 CADARA:{reference:'Cadillac',nose:[22,32,-12],wing:[12,4,3],rear:[-10,0],cover:[28,52,61,28],podBase:'primary',
  pod:'M273 219L348 202Q389 159 434 141Q490 118 560 122L618 134L645 152L641 185L616 209Q536 220 459 215L350 224Z',
  panel:'M320 216Q406 173 452 153Q522 133 602 148L628 163L610 188Q537 165 478 194L383 216Z',
  stripe:'M338 213Q439 156 511 147L615 163',
  inlet:'M606 155L636 155L636 174L606 171Z',
  livery:'lux'}
});
const paintStyles=Object.freeze([
 ['original','Original de escudería'],['solid','Liso'],['center','Franja central'],
 ['double','Doble franja'],['diagonal','Franjas diagonales'],['stripes','Rayas'],
 ['checker','Damero'],['spots','Manchas'],['speckle','Jaspeado'],
 ['camouflage','Camuflaje'],['waves','Ondas']
].map(([key,name])=>Object.freeze({key,name})));
function markup(profile){
 if(!profile?.geometry||!profile?.livery)return null;
 const g=profile.geometry,l=profile.livery;
 // The sporting team alone owns the geometry. Legacy designKey is ignored.
 const d=designs[profile.teamKey]||designs.PAPAYA;
 const paintStyle=paintStyles.some(x=>x.key===profile.paintStyle)?profile.paintStyle:'original';
 const customPaint=paintStyle!=='original';
 const p=hex(l.primary,'#f58a00'),s=hex(l.secondary,'#161a20'),
  a=hex(l.accent,'#3ccef8'),stripe=hex(l.stripe,a),
  carbon=hex(l.carbon,'#080d13'),wing=hex(l.wing,'#10161e'),trim=hex(l.trim,'#f5f8fb');
 const finish=['silver','carbon','white'].includes(l.finish)?l.finish:'paint';
 const surface=finish==='silver'?'#b4c1cc':finish==='white'?'#f2f6fa':finish==='carbon'?'#101920':s;
 // Coordinate frame: nose points right; all mirrored parts share y=235.
 // Wheel footprints are longer along the chassis than across it.
 const nw=d.nose[0]*.65*clamp(g.noseWidth,.94,1.06),tip=927+d.nose[2]+(clamp(g.noseLen,.94,1.06)-1)*20,
  fy=75-(clamp(g.frontWing,.94,1.06)-1)*60,
  ry=116-(clamp(g.rearWing,.94,1.06)-1)*60,
  ws=clamp(g.wheelScale,.94,1.06),cw=clamp(g.cockpitWidth,.94,1.06);
 const id=safe(profile.teamKey),model=safe(profile.model),chassis=safe(profile.chassis);
 const words=String(profile.teamName||id).trim().split(/\s+/);
 const brand=words.slice(0,['Red','Racing','Aston'].includes(words[0])?2:1).map(safe).join(' ').toUpperCase();
 const P=(d,fill,extra='')=>'<path d="'+d+'" fill="'+fill+'" '+extra+'/>';
 const M=d=>d+'<g transform="translate(0 470) scale(1 -1)">'+d+'</g>';
 // Deterministic vector paint tiles, clipped to existing painted surfaces.
 const rect=(x,y,w,h,fill)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'"/>';
 const tiles={
  solid:[1000,470,''],
  center:[1000,470,rect(0,222,1000,26,surface)+rect(0,217,1000,3,stripe)+rect(0,250,1000,3,stripe)],
  double:[1000,470,rect(0,204,1000,13,surface)+rect(0,253,1000,13,surface)+rect(0,199,1000,3,stripe)+rect(0,268,1000,3,stripe)],
  diagonal:[96,96,rect(0,0,27,96,surface)+rect(34,0,4,96,stripe)],
  stripes:[48,48,rect(0,0,14,48,surface)+rect(19,0,3,48,stripe)],
  checker:[56,56,rect(0,0,28,28,surface)+rect(28,28,28,28,surface)+rect(25,25,6,6,stripe)],
  spots:[120,90,P('M7 12Q23 0 41 14L47 29Q36 42 15 35L4 25ZM66 47Q83 29 105 46L116 68Q102 87 79 78L63 63Z',surface)+P('M68 7Q82 2 87 13L82 24L68 19Z',stripe)],
  speckle:[110,80,P('M-10 8Q22 38 48 17T120 33M-10 57Q20 32 51 57T121 62','none','stroke="'+surface+'" stroke-width="9"')+P('M-5 27Q30 50 54 29T116 43','none','stroke="'+stripe+'" stroke-width="2.5"')],
  camouflage:[150,110,P('M0 5L33 0L55 22L47 49L14 55L0 32ZM81 68L112 52L150 64V108L121 110L96 94Z',surface)+P('M78 5L107 12L99 42L70 51L58 30ZM4 83L31 65L51 76L44 108H12Z',stripe)],
  waves:[150,90,P('M-15 20Q23 -5 63 21T165 20M-15 70Q23 45 63 71T165 70','none','stroke="'+surface+'" stroke-width="22"')+P('M-15 36Q23 11 63 37T165 36','none','stroke="'+stripe+'" stroke-width="3"')]
 };
 const tile=tiles[paintStyle]||tiles.solid;
 const paintDefs='<defs><pattern id="customPaint" width="'+tile[0]+'" height="'+tile[1]+'" patternUnits="userSpaceOnUse"'+(paintStyle==='diagonal'?' patternTransform="rotate(32)"':'')+'>'+rect(0,0,tile[0],tile[1],p)+tile[2]+'</pattern></defs>';
 const deco=shape=>customPaint?P(shape,'url(#customPaint)','class="apex-car-paint-layer"'):'';
 const tire=(cx,cy,rear=false)=>{
  const w=(rear?124:118)*ws,h=(rear?85:77)*ws;
  return '<g class="apex-car-tyre">'+
   '<rect x="'+(cx-w/2)+'" y="'+(cy-h/2)+'" width="'+w+'" height="'+h+'" rx="22" fill="url(#tyre)" stroke="#030507" stroke-width="4"/>'+
   '<rect x="'+(cx-w/2+5)+'" y="'+(cy-h/2+5)+'" width="'+(w-10)+'" height="'+(h-10)+'" rx="18" fill="url(#rubberLight)"/>'+
   '<rect x="'+(cx-w/2+4)+'" y="'+(cy-h/2+4)+'" width="'+(w-8)+'" height="'+(h-8)+'" rx="18" fill="url(#rubberGrain)"/>'+
   P('M'+(cx-w/2+16)+' '+(cy-h/2+8)+'Q'+cx+' '+(cy-h/2+3)+' '+(cx+w/2-16)+' '+(cy-h/2+8),'none','stroke="#d2d7da" stroke-opacity=".14" stroke-width="1.3"')+
   P('M'+(cx-w/2+10)+' '+(cy-h/2+13)+'Q'+(cx-w/2+3)+' '+cy+' '+(cx-w/2+10)+' '+(cy+h/2-13)+'M'+(cx+w/2-10)+' '+(cy-h/2+13)+'Q'+(cx+w/2-3)+' '+cy+' '+(cx+w/2-10)+' '+(cy+h/2-13),'none','stroke="#b9c1c5" stroke-opacity=".16" stroke-width="1.6"')+
   P('M'+(cx-w/2+14)+' '+(cy-h/2+5)+'H'+(cx+w/2-14)+'M'+(cx-w/2+14)+' '+(cy+h/2-5)+'H'+(cx+w/2-14),'none','stroke="#a5afb8" stroke-opacity=".19" stroke-width="2"')+
   P('M'+(cx-31)+' '+(cy-h/2+3)+'h62M'+(cx-31)+' '+(cy+h/2-3)+'h62','none','stroke="#ca3438" stroke-opacity=".7" stroke-width="1.8"')+'</g>';
 };
 const shade=(color,amount)=>'#'+color.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*amount).toString(16).padStart(2,'0')).join('');
 const defs='<defs>'+[
  ['tyre','#06080a','#34383b','#07090b'],
  ['paint',p,p,shade(p,.58)],['panel',surface,surface,s],
  ['carbon','#182128',carbon,'#080c10'],['wing',wing,'#30383e',wing],
  ['suspension','#68757d','#18232a','#04090d'],['machined','#84919a','#303c44','#10171d']
 ].map(([id,c1,c2,c3])=>'<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+c1+'"/><stop offset=".45" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c3+'"/></linearGradient>').join('')+
 '<linearGradient id="light"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'+
 '<linearGradient id="volume" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#000" stop-opacity=".42"/><stop offset=".16" stop-color="#fff" stop-opacity=".1"/><stop offset=".34" stop-color="#fff" stop-opacity=".18"/><stop offset=".48" stop-color="#fff" stop-opacity=".03"/><stop offset=".75" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".46"/></linearGradient>'+
 // Local reflections describe the shoulders and recesses without raster
 // filters. Transparent shading preserves every custom paint pattern below.
 '<radialGradient id="podReflection" cx=".61" cy=".23" r=".65" gradientTransform="translate(0 .14) scale(1 .62)"><stop stop-color="#eef6fa" stop-opacity=".32"/><stop offset=".35" stop-color="#cfdee6" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'+
 '<radialGradient id="podUndercut" cx=".62" cy=".98" r=".72"><stop stop-color="#010508" stop-opacity=".8"/><stop offset=".48" stop-color="#010508" stop-opacity=".34"/><stop offset="1" stop-color="#010508" stop-opacity="0"/></radialGradient>'+
 '<linearGradient id="inletWell" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#010304"/><stop offset=".6" stop-color="#020609"/><stop offset="1" stop-color="#243039"/></linearGradient>'+
 '<linearGradient id="inletLip" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c3d2da" stop-opacity=".65"/><stop offset=".3" stop-color="#607583" stop-opacity=".35"/><stop offset="1" stop-color="#02080c" stop-opacity=".9"/></linearGradient>'+
 '<radialGradient id="cockpitWell" cx=".3" cy=".5" r=".8"><stop stop-color="#182027"/><stop offset=".55" stop-color="#060c11"/><stop offset="1" stop-color="#010305"/></radialGradient>'+
 '<linearGradient id="seat" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#293138"/><stop offset=".3" stop-color="#111a21"/><stop offset=".75" stop-color="#1c252b"/><stop offset="1" stop-color="#070d12"/></linearGradient>'+
 '<linearGradient id="halo" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#56636b"/><stop offset=".15" stop-color="#26333b"/><stop offset=".45" stop-color="#0a1116"/><stop offset=".8" stop-color="#1e2b33"/><stop offset="1" stop-color="#080d12"/></linearGradient>'+
 '<linearGradient id="spineReflection" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#e4edf3" stop-opacity=".17"/><stop offset=".42" stop-color="#fff" stop-opacity=".035"/><stop offset=".6" stop-color="#000" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>'+
 '<radialGradient id="rubberLight" cx=".38" cy=".44" r=".7"><stop stop-color="#899299" stop-opacity=".25"/><stop offset=".65" stop-color="#20282c" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>'+
 '<pattern id="rubberGrain" width="13" height="11" patternUnits="userSpaceOnUse"><path d="M2 3l2 -1M8 8l3 1M11 2l1 -1" stroke="#c3c9cc" stroke-width=".7" stroke-opacity=".065"/></pattern>'+
 '<pattern id="weave" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0H3V2H0ZM3 2H5V5H3Z" fill="#c2ced5" fill-opacity=".055"/></pattern>'+
 '</defs>';
 // Restrained carbon floor, stepped edge and small rear diffuser vanes.
 const floorShape='M160 219L283 207L299 118Q445 119 570 111L653 98L665 145L659 196L673 209L807 223V247L673 261L659 274L665 325L653 372L570 359Q445 351 299 352L283 263L160 251Z';
 const floor=P(floorShape,'url(#carbon)','stroke="#080d11" stroke-width="3"')+
  P(floorShape,'url(#weave)')+
  M(P('M301 122Q479 124 650 104L654 115Q477 139 305 134Z','#11191e','stroke="#7c8a92" stroke-opacity=".4" stroke-width="1"')+
   P('M314 138Q460 140 623 119','none','stroke="#bccad2" stroke-opacity=".16" stroke-width="1.4"')+
   P('M272 217L291 167L304 148M259 219L278 178M245 223L258 193','none','stroke="#63717a" stroke-opacity=".5" stroke-width="2"'));
 // Suspension joints are computed from the same tyre footprints: all four
 // inboard mounts stay attached for each native model's wheelScale.
 const frontInner=101+77*ws/2,rearInner=104+85*ws/2;
 const number=n=>Number(n.toFixed(3));
 function arm(ax,ay,bx,by,width=6,kind='wishbone'){
  const length=Math.hypot(bx-ax,by-ay),nx=-(by-ay)/length,ny=(bx-ax)/length;
  const point=(x,y,offset)=>number(x+nx*offset)+' '+number(y+ny*offset);
  const path='M'+point(ax,ay,width/2)+'L'+point(bx,by,width*.32)+
   'L'+point(bx,by,-width*.32)+'L'+point(ax,ay,-width/2)+'Z';
  return '<g class="apex-car-suspension-arm" data-link="'+kind+'">'+
   P(path,kind==='halfshaft'?'url(#machined)':'url(#suspension)','stroke="#070e13" stroke-width="1"')+
   P('M'+point(ax,ay,width*.16)+'L'+point(bx,by,width*.1),'none',
    'stroke="#a7b5be" stroke-opacity=".33" stroke-width=".85"')+'</g>';
 }
 const suspension=M(
  '<g class="apex-car-suspension" data-axle="front">'+
   arm(674,221,783,frontInner+11,13)+arm(756,219,788,frontInner+9,11)+
   arm(711,227,776,frontInner+14,4,'pushrod')+
   arm(747,231,795,frontInner+13,3,'steering')+'</g>'+
  '<g class="apex-car-suspension" data-axle="rear">'+
   arm(274,218,215,rearInner+10,11)+arm(340,220,229,rearInner+10,11)+
   arm(306,226,224,rearInner+14,4,'pushrod')+
   arm(269,233,221,rearInner+11,5,'halfshaft')+'</g>'
 );
 function wheelMount(cx,inner,rear=false){
  const duct=rear?18:25;
  return '<g class="apex-car-wheel-mount" data-axle="'+(rear?'rear':'front')+'">'+
   // Upright, short exposed axle stub and inner wheel face. A true top view
   // does not show a full side-on alloy rim or an axle crossing the nose.
   P('M'+(cx-12)+' '+(inner-1)+'L'+(cx+12)+' '+(inner-1)+'L'+(cx+11)+' '+(inner+11)+'L'+(cx+4)+' '+(inner+17)+'L'+(cx-10)+' '+(inner+13)+'Z','url(#machined)','stroke="#070d12" stroke-width="1.3"')+
   P('M'+(cx-4)+' '+(inner+2)+'H'+(cx+4)+'V'+(inner+18)+'H'+(cx-4)+'Z','url(#suspension)')+
   '<ellipse cx="'+cx+'" cy="'+(inner+2)+'" rx="10" ry="3.5" fill="#131c23" stroke="#7b8c97" stroke-opacity=".6" stroke-width="1"/>'+
   '<circle cx="'+cx+'" cy="'+(inner+8)+'" r="2.4" fill="#9baab3" stroke="#0b1217" stroke-width=".8"/>'+
   '<g class="apex-car-brake-duct">'+
    P('M'+(cx+9)+' '+(inner+3)+'L'+(cx+duct)+' '+(inner-2)+'Q'+(cx+duct+5)+' '+(inner+5)+' '+(cx+duct+1)+' '+(inner+12)+'L'+(cx+9)+' '+(inner+15)+'Z','url(#carbon)','stroke="#37454e" stroke-width="1"')+
    P('M'+(cx+duct)+' '+(inner+1)+'L'+(cx+duct+1)+' '+(inner+9)+'L'+(cx+duct-4)+' '+(inner+10)+'L'+(cx+duct-4)+' '+(inner+2)+'Z','#010508','stroke="#687d89" stroke-opacity=".5" stroke-width=".6"')+'</g></g>';
 }
 const mounts=M(wheelMount(785,frontInner)+wheelMount(221,rearInner,true));
 const rearWing='<g class="apex-car-rear-wing" transform="translate(110 235) scale('+(1+d.rear[1]/100)+' '+(1+d.rear[0]/120)+') translate(-110 -235)">'+
  P('M79 '+ry+'Q106 '+(ry-3)+' 145 '+(ry+4)+'L145 '+(466-ry)+'Q106 '+(473-ry)+' 79 '+(470-ry)+'Z','url(#wing)','stroke="#04080c" stroke-width="3"')+
  P('M87 '+(ry+8)+'V'+(462-ry)+'H117V'+(ry+8)+'Z','url(#panel)')+
  P('M122 '+(ry+8)+'V'+(462-ry),'none','stroke="'+p+'" stroke-width="8"')+
  P('M106 '+(ry+6)+'V'+(464-ry)+'M136 '+(ry+8)+'V'+(462-ry),'none','stroke="#a4b1b9" stroke-opacity=".45" stroke-width="1.3"')+
  P('M143 220H191M143 250H191','none','stroke="#10191e" stroke-width="5"')+
  deco('M79 '+ry+'Q106 '+(ry-3)+' 145 '+(ry+4)+'L145 '+(466-ry)+'Q106 '+(473-ry)+' 79 '+(470-ry)+'Z')+
  P('M98 231H150L165 235L150 239H98Z','url(#suspension)','stroke="#0a1118" stroke-width="1"')+
  P('M104 233H147','none','stroke="#9cabb4" stroke-opacity=".5" stroke-width="1"')+
  '<text transform="translate(109 235) rotate(-90)" font-family="Arial,sans-serif" font-size="'+(brand.length>10?14:19)+'" font-weight="800" text-anchor="middle" fill="'+trim+'">'+brand+'</text>'+
  M(P('M77 '+(ry-3)+'H149V'+(ry+4)+'H77Z',carbon,'stroke="'+stripe+'" stroke-width="1.5"'))+'</g>';
 // Distinct transverse wing elements, swept back at the centre.
 const sweep=d.wing[1];
 const blade=(a0,a1,b0,b1)=>'M'+a0+' 228Q'+(a0-15+sweep*.15)+' 169 '+a1+' '+(fy+10)+
  'L'+b1+' '+(fy+7)+'Q'+(b0-14+sweep*.15)+' 168 '+b0+' 230Z';
 const frontHalf='<g class="apex-car-front-wing" transform="translate(930 235) scale('+(1+d.wing[0]/85)+' 1) translate(-930 -235)">'+
  P(blade(872,850,896,873),'url(#wing)','stroke="#060b10" stroke-width="2"')+
  P(blade(899,878,917,899),'url(#panel)','stroke="#060b10" stroke-width="1.5"')+
  deco(blade(899,878,917,899))+
  P(blade(920,904,937,924),'url(#carbon)','stroke="#060b10" stroke-width="1.5"')+
  (d.wing[2]===4?P(blade(940,929,951,943),'url(#paint)','stroke="#060b10" stroke-width="1.5"'):'')+
  P('M877 225Q860 165 855 '+(fy+14)+'M904 226Q889 164 883 '+(fy+14)+'M925 227Q913 167 909 '+(fy+14),'none','stroke="#d9e5ec" stroke-opacity=".4" stroke-width="1.2"')+
  P('M846 '+(fy+1)+'Q887 '+(fy-4)+' 944 '+(fy+3)+'L950 '+(fy+12)+'Q891 '+(fy+5)+' 847 '+(fy+9)+'Z','url(#carbon)','stroke="'+p+'" stroke-width="2"')+
  P('M887 169L906 207L913 208L894 168Z','url(#suspension)')+
  '<circle cx="891" cy="173" r="2" fill="#9cabb4" stroke="#10191f" stroke-width=".7"/>'+
  '<text transform="translate(890 143) rotate(74)" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="'+trim+'" text-anchor="middle">'+brand+'</text></g>';
 // Independent pod outlines, inlet cuts and paint masks per reference.
 const podSkin=d.pod;
 const podTone=customPaint?p:d.podBase==='secondary'?surface:p;
 const podPanel=d.livery==='double'?p:d.livery==='pinstripe'?stripe:surface;
 const podDetail=customPaint?deco(podSkin):P(d.panel,podPanel)+P(d.stripe,'none','stroke="'+stripe+'" stroke-width="'+(d.livery==='flank'?12:d.livery==='split'?7:d.livery==='sweep'?5:3.5)+'" stroke-linecap="round"');
 const inletRibs=[605,614,623,632,641].map(x=>P('M'+x+' 120L'+(x-5)+' 180','none','stroke="#586975" stroke-opacity=".23" stroke-width="1.4"')).join('');
 const pod=upper=>'<g class="apex-car-sidepod">'+
  P(podSkin,podTone,'stroke="#0a1015" stroke-width="2"')+
  podDetail+
  // Cadara's upper secondary panel sits below the same material layers.
  (upper&&!customPaint&&d.livery==='lux'?P(podSkin,surface):'')+
  P(d.panel,'url(#weave)','opacity=".45"')+P(podSkin,'url(#volume)')+
  P(podSkin,'url(#podReflection)','class="apex-car-pod-reflection"')+
  P(podSkin,'url(#podUndercut)')+
  '<g clip-path="url(#podMask)">'+
   P(d.stripe,'none','stroke="#e3edf2" stroke-opacity=".18" stroke-width="3.5"')+
   P(d.stripe,'none','stroke="#e3edf2" stroke-opacity=".36" stroke-width=".75"')+
   P('M309 218Q420 213 494 190Q558 172 619 192','none','stroke="#010609" stroke-opacity=".4" stroke-width="4"')+
   P(d.inlet,'#020609','stroke="#010609" stroke-opacity=".6" stroke-width="5"')+
   P(d.inlet,'url(#inletWell)','class="apex-car-inlet" stroke="url(#inletLip)" stroke-width="1.6"')+
   '<g class="apex-car-inlet-depth" clip-path="url(#inletMask)">'+inletRibs+'</g></g>'+
  P('M523 132L532 137M533 131L542 136M543 131L552 136M553 132L562 137','none','stroke="#020609" stroke-width="2"')+'</g>';
 const sidepods=pod(true)+'<g transform="translate(0 470) scale(1 -1)">'+pod(false)+'</g>';
 const [tail,waist,shoulder,root]=d.cover;
 const half=d.nose[1]*1.12;
 const noseRoot=root+15;
 // Absolute stations give independently shaped engine-cover shoulders, waist,
 // nose root and nose tip. Mirrored on the centreline, never scaled as one car.
 const bodyShape='M173 '+(235-tail)+'L272 '+(235-tail-3)+
  'C329 '+(235-waist+3)+' 362 '+(235-waist-8)+' 402 '+(235-shoulder-9)+
  'Q448 '+(220-shoulder)+' 487 '+(225-shoulder+5)+
  'L531 '+(229-shoulder)+'Q595 '+(235-root-22)+' 635 '+(235-noseRoot)+
  'Q677 '+(235-half-2)+' 744 '+(235-half*.76)+
  'L'+(tip-8)+' '+(235-nw)+'Q'+(tip+8)+' 235 '+(tip-8)+' '+(235+nw)+
  'L744 '+(235+half*.76)+'Q677 '+(235+half+2)+' 635 '+(235+noseRoot)+
  'Q595 '+(235+root+22)+' 531 '+(241+shoulder)+'L487 '+(245+shoulder-5)+
  'Q448 '+(250+shoulder)+' 402 '+(235+shoulder+9)+
  'C362 '+(235+waist+8)+' 329 '+(235+waist-3)+' 272 '+(235+tail+3)+'L173 '+(235+tail)+'Z';
 // The engine cover is a tapered spine, surrounded by painted shoulders.
 const spine=waist*.30,spineRoot=shoulder*.34;
 const engineShape='M183 '+(235-tail*.47)+'L293 '+(235-spine)+
  'Q375 '+(235-spineRoot)+' 442 '+(235-spineRoot)+
  'Q465 '+(235-spineRoot+1)+' 485 217L485 253Q465 '+(235+spineRoot-1)+' 442 '+(235+spineRoot)+
  'Q375 '+(235+spineRoot)+' 293 '+(235+spine)+'L183 '+(235+tail*.47)+'Z';
 const noseShape='M635 '+(235-noseRoot)+'Q677 '+(235-half-2)+' 744 '+(235-half*.76)+
  'L'+(tip-8)+' '+(235-nw)+'Q'+(tip+8)+' 235 '+(tip-8)+' '+(235+nw)+
  'L744 '+(235+half*.76)+'Q677 '+(235+half+2)+' 635 '+(235+noseRoot)+'Z';
 const blocks={
  sweep:M(P('M225 217Q355 201 445 187L457 191Q353 205 225 220Z',stripe)),
  center:P('M194 224L455 207L479 218V252L455 263L194 246Z',surface)+P('M194 231H476V239H194Z',stripe),
  double:P('M190 224H470V230H190ZM190 240H470V246H190Z',stripe)+M(P('M637 216L900 225L900 228L637 224Z',surface)),
  chevron:M(P('M215 232L375 207L455 224L412 215L375 218L215 237Z',stripe))+M(P('M640 220L702 214L817 229L757 231L695 224Z',surface)),
  split:M(P('M207 221L393 202L470 218L441 224L207 234Z',surface))+P('M638 222L900 226V244L638 248Z',surface),
  flank:M(P('M206 222L402 196L466 215L449 225L206 236Z',stripe))+P('M676 216L718 220V250L676 254Z',stripe),
  bars:M(P('M276 220L305 214L328 255L299 252ZM333 205L361 194L383 274L355 266Z',surface))+P('M670 217L701 218L735 254L704 253Z',stripe),
  blade:P('M191 222L434 191L478 219L344 241L191 247Z',surface)+P('M654 219L710 213L840 223L813 247L655 251Z',surface),
  pinstripe:M(P('M203 224L430 191L468 209L461 216L430 201L203 229Z',stripe))+P('M643 222L889 225V229L643 227Z',stripe),
  spear:M(P('M199 232L441 190L463 204L441 202L199 237Z',stripe))+P('M642 230L899 234L642 240L693 235Z',surface),
  lux:P(bodyShape,surface,'clip-path="url(#upperHalf)"')+P('M193 234H470V236H193ZM643 234H909V236H643Z',stripe)
 };
 const body=P(bodyShape,'url(#paint)','class="apex-car-body" stroke="#111820" stroke-width="2"')+
  P(engineShape,d.livery==='double'?p:'url(#panel)','class="apex-car-engine-cover"')+
  '<g clip-path="url(#bodyMask)" class="apex-car-livery">'+(customPaint?deco(bodyShape):blocks[d.livery])+'</g>'+
  P(bodyShape,'url(#volume)')+
  P(engineShape,'url(#weave)','opacity=".55"')+
  P(engineShape,'url(#spineReflection)')+
  P(engineShape,'none','stroke="#e1edf4" stroke-opacity=".13" stroke-width="1"')+
  P(noseShape,'url(#light)','class="apex-car-nose"')+
  P('M664 '+(234-half)+'L'+(tip-28)+' '+(234-nw),'none','stroke="#fff" stroke-opacity=".32" stroke-width="1.4"')+
  P('M845 220L872 222L874 248L845 250Z',stripe,'opacity=".9"')+
  '<text x="860" y="241" font-family="Arial,sans-serif" font-size="17" font-weight="900" text-anchor="middle" fill="'+trim+'">26</text>';
 const serviceDetails='<g class="apex-car-service-details">'+
  P('M668 224Q668 222 671 222H695Q698 222 698 225V245Q698 248 695 248H671Q668 248 668 245Z','none','stroke="#dae5eb" stroke-opacity=".28" stroke-width=".9"')+
  P('M676 229H688V241H676Z','#0b141a','opacity=".8"')+
  '<circle cx="673" cy="225" r="1.1" fill="#c5d0d7" opacity=".6"/><circle cx="693" cy="245" r="1.1" fill="#c5d0d7" opacity=".6"/>'+
  P('M792 232H799V238H792Z','#071017','stroke="#8798a3" stroke-opacity=".5" stroke-width=".7"')+'</g>';
 const bodyMasks='<defs><clipPath id="bodyMask">'+P(bodyShape,'#fff')+'</clipPath><clipPath id="podMask">'+P(podSkin,'#fff')+'</clipPath><clipPath id="inletMask">'+P(d.inlet,'#fff')+'</clipPath><clipPath id="upperHalf"><rect x="0" y="0" width="1000" height="235"/></clipPath></defs>';

 // Empty showroom cockpit: seat, belts and steering wheel. The halo sits
 // above the cockpit rim and converges into its single forward support.
 const cockpit='<g class="apex-car-cockpit" transform="translate(554 235) scale(1.12 '+(cw*1.18)+') translate(-554 -235)">'+
  P('M482 211Q482 200 493 199L544 197Q594 197 626 235Q594 273 544 273L493 271Q482 270 482 259Z','url(#carbon)','stroke="'+p+'" stroke-width="5"')+
  P('M492 215Q492 208 501 208L546 207Q578 209 600 235Q578 261 546 263L501 262Q492 262 492 255Z','url(#cockpitWell)','stroke="#76838b" stroke-opacity=".24" stroke-width=".8"')+
  // Padded bucket and side bolsters: broad dark surfaces, fine stitching.
  P('M497 219Q497 216 502 216H519Q531 219 536 225V245Q531 251 519 254H502Q497 254 497 251Z','url(#seat)','class="apex-car-seat" stroke="#344149" stroke-opacity=".45" stroke-width=".8"')+
  P('M500 220L509 219Q514 235 509 251L500 250ZM523 221L531 226V244L523 249Q529 235 523 221Z','#070d12')+
  P('M502 220H514Q520 221 523 225M523 245Q520 249 514 250H502','none','stroke="#89939a" stroke-opacity=".2" stroke-width=".7"')+
  P('M501 220L538 229M501 250L538 241','none','stroke="#010406" stroke-width="4"')+
  P('M501 220L538 229M501 250L538 241','none','stroke="#46535b" stroke-width="2.4"')+
  P('M535 231H543V239H535Z','url(#machined)','stroke="#080e13" stroke-width=".7"')+
  P('M492 211H510L512 215H492ZM492 255H510L512 259H492Z','#34414a','opacity=".45"')+
  // Steering grips, recessed display and a few small switch caps.
  P('M570 215Q578 213 584 220L588 226V244L584 250Q578 257 570 255L566 246V224Z','#03080c','class="apex-car-steering" stroke="#4f626e" stroke-opacity=".6" stroke-width="1"')+
  P('M571 219H580V225H571ZM571 245H580V251H571Z','#24323b')+
  P('M572 229H582V240H572Z','#07151b','stroke="#5f818e" stroke-opacity=".5" stroke-width=".6"')+
  P('M574 232H580M574 235H578','none','stroke="'+stripe+'" stroke-opacity=".75" stroke-width=".8"')+
  '<circle cx="576" cy="222" r="1.3" fill="#a33c37"/><circle cx="582" cy="225" r="1" fill="#8da39a"/><circle cx="576" cy="248" r="1.3" fill="#b6a15c"/>'+
  // A short offset shadow seats the halo above the rim, without blur filters.
  P('M494 202C544 190 589 201 621 238C589 275 544 286 494 274','none','stroke="#010406" stroke-opacity=".55" stroke-width="12" stroke-linecap="round"')+
  P('M494 199C544 187 589 198 621 235C589 272 544 283 494 271','none','stroke="url(#halo)" stroke-width="8" stroke-linecap="round"')+
  P('M496 197C543 188 586 199 615 227','none','stroke="#d5dfe5" stroke-opacity=".38" stroke-width=".9"')+
  P('M496 273C543 282 586 271 615 243','none','stroke="#4c5a63" stroke-opacity=".4" stroke-width=".8"')+
  P('M618 235H649','none','stroke="url(#halo)" stroke-width="7" stroke-linecap="round"')+
  P('M620 232H647','none','stroke="#a3afb6" stroke-opacity=".4" stroke-width=".8"')+
  '<circle cx="495" cy="199" r="1.8" fill="#7b8a93"/><circle cx="495" cy="271" r="1.8" fill="#47565f"/></g>';
 // Place the mirrors ahead of the inlet mouths, leaving the recess visible.
 const mirrors=M(P('M630 205L651 146','none','stroke="#0c141a" stroke-width="3.5"')+
  P('M638 136L661 133Q668 133 666 141L640 145Z','url(#carbon)','stroke="'+p+'" stroke-width="1.4"')+
  P('M641 137L661 135','none','stroke="#c1cfd8" stroke-opacity=".4" stroke-width=".8"'));
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 470" width="1000" height="470" role="img" data-apex-silhouette="f1-materials-v12" data-apex-design-key="'+id+'" data-apex-paint-style="'+paintStyle+'" data-apex-design="'+safe(d.reference)+'" data-apex-team="'+id+'" data-apex-model="'+model+'" data-apex-chassis="'+chassis+'" aria-label="Vista cenital de monoplaza '+id+' '+model+'">'+defs+paintDefs+bodyMasks+
  floor+rearWing+M(frontHalf)+suspension+mounts+sidepods+body+serviceDetails+
  tire(221,104,true)+tire(221,366,true)+tire(785,101)+tire(785,369)+cockpit+mirrors+
  P('M464 214H485Q489 214 489 219V251Q489 256 485 256H464Z','url(#carbon)','stroke="#61717b" stroke-width="1.2"')+
  P('M469 223H480V247H469Z','#03080b','stroke="#303e48" stroke-width="1"')+
  '<text x="735" y="238" font-family="Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="'+trim+'">'+brand+'</text>'+
  '<text x="358" y="239" font-family="Arial,sans-serif" font-size="10" letter-spacing="1" text-anchor="middle" fill="'+trim+'">'+chassis+'</text></svg>';
}
function build(teamKey){
 const key=String(teamKey||'');
 const t=global.ApexNativeTeamStudio9A?.get?.(key);
 const blueprint=t?.preview;
 if(!blueprint||blueprint.teamKey!==key)return null;
 const override=global.ApexVehicleStudio9A?.colorsFor?.(key)||null;
 const l=override?{...blueprint.livery,...override}:blueprint.livery;
 const selected=global.ApexVehicleStudio9A?.paintStyleFor?.(key);
 const paintStyle=paintStyles.some(x=>x.key===selected)?selected:'original';
 const designKey=key;
 const input={...blueprint,teamName:t.name,paintStyle,livery:l};
 const cacheKey=JSON.stringify(input);
 if(cache.has(cacheKey))return cache.get(cacheKey);
 const svg=markup(input);
 if(!svg)return null;
 const result=Object.freeze({key,designKey,paintStyle,model:blueprint.model,chassis:blueprint.chassis,
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
 img.dataset.apexDesignKey=render.key;
 img.dataset.apexPaintStyle=render.paintStyle;
 img.dataset.apexModel=render.model;
 img.dataset.apexChassis=render.chassis;
 img.dataset.apexPreview='native-blueprint';
 if(img.src!==render.src)img.src=render.src;
 return true;
}
global.ApexTeamCarPreview9A=Object.freeze({build,setCar,markup,paintStyles});
})(window);
