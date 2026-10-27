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
  panel:'M285 216C369 192 381 138 458 127Q563 112 620 135L636 166L620 199Q554 173 495 183Q389 218 285 220Z',
  stripe:'M305 211C392 182 416 134 490 131Q566 125 613 143',
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
function markup(profile){
 if(!profile?.geometry||!profile?.livery)return null;
 const g=profile.geometry,l=profile.livery;
 const d=designs[profile.designKey]||designs[profile.teamKey]||designs.PAPAYA;
 const p=hex(l.primary,'#f58a00'),s=hex(l.secondary,'#161a20'),
  a=hex(l.accent,'#3ccef8'),stripe=hex(l.stripe,a),
  carbon=hex(l.carbon,'#080d13'),wing=hex(l.wing,'#10161e'),trim=hex(l.trim,'#f5f8fb');
 const finish=['silver','carbon','white'].includes(l.finish)?l.finish:'paint';
 const surface=finish==='silver'?'#b4c1cc':finish==='white'?'#f2f6fa':finish==='carbon'?'#101920':s;
 // Coordinate frame: nose points right; all mirrored parts share y=235.
 // Wheel footprints are longer along the chassis than across it.
 const nw=d.nose[0]*clamp(g.noseWidth,.94,1.06),tip=927+d.nose[2]+(clamp(g.noseLen,.94,1.06)-1)*20,
  fy=75-(clamp(g.frontWing,.94,1.06)-1)*60,
  ry=116-(clamp(g.rearWing,.94,1.06)-1)*60,
  ws=clamp(g.wheelScale,.94,1.06),cw=clamp(g.cockpitWidth,.94,1.06);
 const id=safe(profile.teamKey),model=safe(profile.model),chassis=safe(profile.chassis);
 const words=String(profile.teamName||id).trim().split(/\s+/);
 const brand=words.slice(0,['Red','Racing','Aston'].includes(words[0])?2:1).map(safe).join(' ').toUpperCase();
 const P=(d,fill,extra='')=>'<path d="'+d+'" fill="'+fill+'" '+extra+'/>';
 const M=d=>d+'<g transform="translate(0 470) scale(1 -1)">'+d+'</g>';
 const tire=(cx,cy,rear=false)=>{
  const w=(rear?124:118)*ws,h=(rear?85:77)*ws;
  return '<g class="apex-car-tyre">'+
   '<rect x="'+(cx-w/2)+'" y="'+(cy-h/2)+'" width="'+w+'" height="'+h+'" rx="22" fill="url(#tyre)" stroke="#030507" stroke-width="4"/>'+
   '<rect x="'+(cx-w/2+5)+'" y="'+(cy-h/2+5)+'" width="'+(w-10)+'" height="'+(h-10)+'" rx="18" fill="url(#rubberLight)"/>'+
   P('M'+(cx-w/2+10)+' '+(cy-h/2+13)+'Q'+(cx-w/2+3)+' '+cy+' '+(cx-w/2+10)+' '+(cy+h/2-13)+'M'+(cx+w/2-10)+' '+(cy-h/2+13)+'Q'+(cx+w/2-3)+' '+cy+' '+(cx+w/2-10)+' '+(cy+h/2-13),'none','stroke="#b9c1c5" stroke-opacity=".16" stroke-width="1.6"')+
   P('M'+(cx-w/2+14)+' '+(cy-h/2+5)+'H'+(cx+w/2-14)+'M'+(cx-w/2+14)+' '+(cy+h/2-5)+'H'+(cx+w/2-14),'none','stroke="#a5afb8" stroke-opacity=".19" stroke-width="2"')+
   P('M'+(cx-31)+' '+(cy-h/2+3)+'h62M'+(cx-31)+' '+(cy+h/2-3)+'h62','none','stroke="#ca3438" stroke-opacity=".7" stroke-width="1.8"')+'</g>';
 };
 const defs='<defs>'+[
  ['tyre','#06080a','#34383b','#07090b'],
  ['paint',p,p,s],['panel',surface,surface,s],
  ['carbon','#182128',carbon,'#080c10'],['wing',wing,'#30383e',wing]
 ].map(([id,c1,c2,c3])=>'<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+c1+'"/><stop offset=".45" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c3+'"/></linearGradient>').join('')+
 '<linearGradient id="light"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'+
 '<linearGradient id="volume" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#000" stop-opacity=".66"/><stop offset=".16" stop-color="#fff" stop-opacity=".1"/><stop offset=".34" stop-color="#fff" stop-opacity=".32"/><stop offset=".48" stop-color="#fff" stop-opacity=".03"/><stop offset=".75" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></linearGradient>'+
 '<radialGradient id="rubberLight" cx=".38" cy=".44" r=".7"><stop stop-color="#899299" stop-opacity=".25"/><stop offset=".65" stop-color="#20282c" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>'+
 '<pattern id="weave" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0H3V2H0ZM3 2H5V5H3Z" fill="#c2ced5" fill-opacity=".055"/></pattern>'+
 '</defs>';
 // Restrained carbon floor, stepped edge and small rear diffuser vanes.
 const floorShape='M160 219L283 207L299 118Q445 119 570 111L653 98L665 145L659 196L673 209L807 223V247L673 261L659 274L665 325L653 372L570 359Q445 351 299 352L283 263L160 251Z';
 const floor=P(floorShape,'url(#carbon)','stroke="#080d11" stroke-width="3"')+
  P(floorShape,'url(#weave)')+
  M(P('M301 122Q479 124 650 104L654 115Q477 139 305 134Z','#11191e','stroke="#7c8a92" stroke-opacity=".4" stroke-width="1"')+
   P('M314 138Q460 140 623 119','none','stroke="#bccad2" stroke-opacity=".16" stroke-width="1.4"')+
   P('M272 217L291 167L304 148M259 219L278 178M245 223L258 193','none','stroke="#63717a" stroke-opacity=".5" stroke-width="2"'));
 const suspension=M(
  P('M695 221L777 117M748 224L805 117M704 225L787 134M274 220L220 128M343 216L233 129M302 228L213 141','none','stroke="#060a0d" stroke-width="7" stroke-linejoin="round"')+
  P('M695 220L777 117M748 223L805 117M274 219L220 128M343 215L233 129','none','stroke="#71808b" stroke-opacity=".55" stroke-width="1.6"'));
 const rearWing='<g class="apex-car-rear-wing" transform="translate(110 235) scale('+(1+d.rear[1]/100)+' '+(1+d.rear[0]/120)+') translate(-110 -235)">'+
  P('M79 '+ry+'Q106 '+(ry-3)+' 145 '+(ry+4)+'L145 '+(466-ry)+'Q106 '+(473-ry)+' 79 '+(470-ry)+'Z','url(#wing)','stroke="#04080c" stroke-width="3"')+
  P('M87 '+(ry+8)+'V'+(462-ry)+'H117V'+(ry+8)+'Z','url(#panel)')+
  P('M122 '+(ry+8)+'V'+(462-ry),'none','stroke="'+p+'" stroke-width="8"')+
  P('M106 '+(ry+6)+'V'+(464-ry)+'M136 '+(ry+8)+'V'+(462-ry),'none','stroke="#a4b1b9" stroke-opacity=".45" stroke-width="1.3"')+
  P('M143 220H191M143 250H191','none','stroke="#10191e" stroke-width="5"')+
  '<text transform="translate(109 235) rotate(-90)" font-family="Arial,sans-serif" font-size="'+(brand.length>10?14:19)+'" font-weight="800" text-anchor="middle" fill="'+trim+'">'+brand+'</text>'+
  M(P('M77 '+(ry-3)+'H149V'+(ry+4)+'H77Z',carbon,'stroke="'+stripe+'" stroke-width="1.5"'))+'</g>';
 // Distinct transverse wing elements, swept back at the centre.
 const frontHalf='<g class="apex-car-front-wing" transform="translate(930 235) scale('+(1+d.wing[0]/65)+' 1) translate(-930 -235)">'+
  P('M850 218Q'+(878+d.wing[1])+' 160 862 '+(fy+8)+'L886 '+fy+'Q900 155 934 225Z','url(#wing)','stroke="#080d11" stroke-width="2"')+
  P('M869 220Q'+(897+d.wing[1]*.8)+' 157 883 '+(fy+6)+'L902 '+(fy+3)+'Q914 158 944 226Z','url(#panel)','stroke="#080d11" stroke-width="2"')+
  P('M895 222Q'+(917+d.wing[1]*.6)+' 156 906 '+(fy+5)+'L921 '+(fy+7)+'Q936 166 952 230Z','url(#carbon)','stroke="#080d11" stroke-width="2"')+
  (d.wing[2]===4?P('M922 227Q941 162 925 '+(fy+9)+'L936 '+(fy+12)+'Q954 166 961 231Z','url(#paint)','stroke="#080d11" stroke-width="2"'):'')+
  P('M860 213Q890 153 878 '+(fy+12)+'M888 216Q911 154 898 '+(fy+10)+'M911 220Q933 161 919 '+(fy+13),'none','stroke="#cad7de" stroke-opacity=".32" stroke-width="1.4"')+
  P('M861 '+(fy-3)+'L938 '+(fy+2)+'L943 '+(fy+10)+'L862 '+(fy+5)+'Z',wing,'stroke="'+p+'" stroke-width="2"')+
  P('M892 157L909 191','none','stroke="'+stripe+'" stroke-width="2.2"')+'</g>';
 // Independent pod outlines, inlet cuts and paint masks per reference.
 const podSkin=d.pod;
 const podTone=d.podBase==='secondary'?surface:p;
 const podPanel=d.livery==='double'?p:d.livery==='pinstripe'?stripe:surface;
 const podDetail=P(d.panel,podPanel)+P(d.stripe,'none','stroke="'+stripe+'" stroke-width="'+(d.livery==='flank'?12:d.livery==='split'?7:3.5)+'" stroke-linecap="round"');
 const sidepods=M('<g class="apex-car-sidepod">'+
  P(podSkin,podTone,'stroke="#0a1015" stroke-width="2"')+
  podDetail+P(d.panel,'url(#weave)','opacity=".35"')+P(podSkin,'url(#volume)')+
  P(d.panel,'none','stroke="#b7c6cf" stroke-opacity=".18" stroke-width="1.1"')+
  P(d.inlet,'#020609','class="apex-car-inlet" stroke="#60717c" stroke-width="1"')+
  P('M523 132L532 137M533 131L542 136M543 131L552 136M553 132L562 137','none','stroke="#020609" stroke-width="2"')+'</g>')+
  (d.livery==='lux'?P(podSkin,surface):'');
 const [tail,waist,shoulder,root]=d.cover;
 const half=d.nose[1];
 // Absolute stations give independently shaped engine-cover shoulders, waist,
 // nose root and nose tip. Mirrored on the centreline, never scaled as one car.
 const bodyShape='M173 '+(235-tail)+'L272 '+(235-tail-3)+
  'C329 '+(235-waist+13)+' 362 '+(235-waist)+' 402 '+(235-shoulder)+
  'Q448 '+(230-shoulder)+' 487 '+(235-shoulder+5)+
  'L531 '+(239-shoulder)+'Q588 '+(235-root-16)+' 635 '+(235-root)+
  'Q664 '+(235-half-2)+' 710 '+(235-half)+
  'L'+(tip-8)+' '+(235-nw)+'Q'+(tip+8)+' 235 '+(tip-8)+' '+(235+nw)+
  'L710 '+(235+half)+'Q664 '+(235+half+2)+' 635 '+(235+root)+
  'Q588 '+(235+root+16)+' 531 '+(231+shoulder)+'L487 '+(235+shoulder-5)+
  'Q448 '+(240+shoulder)+' 402 '+(235+shoulder)+
  'C362 '+(235+waist)+' 329 '+(235+waist-13)+' 272 '+(235+tail+3)+'L173 '+(235+tail)+'Z';
 const engineShape='M192 '+(235-tail+5)+'L302 '+(235-waist+10)+
  'Q370 '+(235-shoulder+14)+' 421 '+(235-shoulder+8)+
  'Q454 '+(235-shoulder)+' 479 '+(235-shoulder+10)+
  'L498 212L488 258L479 '+(235+shoulder-10)+
  'Q454 '+(235+shoulder)+' 421 '+(235+shoulder-8)+
  'Q370 '+(235+shoulder-14)+' 302 '+(235+waist-10)+'L192 '+(235+tail-5)+'Z';
 const noseShape='M635 '+(235-root)+'Q664 '+(235-half-2)+' 710 '+(235-half)+
  'L'+(tip-8)+' '+(235-nw)+'Q'+(tip+8)+' 235 '+(tip-8)+' '+(235+nw)+
  'L710 '+(235+half)+'Q664 '+(235+half+2)+' 635 '+(235+root)+'Z';
 const blocks={
  sweep:M(P('M205 231L444 203L467 217L445 230L205 237Z',surface)),
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
  '<g clip-path="url(#bodyMask)" class="apex-car-livery">'+blocks[d.livery]+'</g>'+
  P(bodyShape,'url(#volume)')+
  P(noseShape,'url(#light)','class="apex-car-nose"')+
  P('M664 '+(234-half)+'L'+(tip-28)+' '+(234-nw),'none','stroke="#fff" stroke-opacity=".32" stroke-width="1.4"')+
  P('M845 220L872 222L874 248L845 250Z',stripe,'opacity=".9"')+
  '<text x="860" y="241" font-family="Arial,sans-serif" font-size="17" font-weight="900" text-anchor="middle" fill="'+trim+'">26</text>';
 const bodyMasks='<defs><clipPath id="bodyMask">'+P(bodyShape,'#fff')+'</clipPath><clipPath id="upperHalf"><rect x="0" y="0" width="1000" height="235"/></clipPath></defs>';

 // Empty showroom cockpit: seat, belts and steering wheel. The halo sits
 // above the cockpit rim and converges into its single forward support.
 const cockpit='<g class="apex-car-cockpit" transform="translate(554 235) scale(1 '+cw+') translate(-554 -235)">'+
  P('M482 206Q512 190 551 194Q603 197 635 235Q603 273 551 276Q512 280 482 264Z','url(#carbon)','stroke="'+p+'" stroke-width="5"')+
  P('M492 209Q519 201 548 205Q583 210 604 235Q583 260 548 265Q519 269 492 261Z','#020609','stroke="#76838b" stroke-opacity=".5" stroke-width="1.2"')+
  P('M496 217L518 211L544 217L549 235L544 253L518 259L496 253Z','#11191f','stroke="#303e48" stroke-width="1.5"')+
  P('M503 219L525 225L531 235L525 245L503 251','none','stroke="#394751" stroke-width="3"')+
  P('M511 213L538 231M511 257L538 239','none','stroke="#929b9e" stroke-opacity=".65" stroke-width="3"')+
  P('M537 231H545V239H537Z','#697780','stroke="#0c141a" stroke-width="1"')+
  P('M572 216L583 219L589 228V242L583 251L572 254L566 244V226Z','#03080c','stroke="#60717e" stroke-width="2"')+
  P('M574 224H581M575 229H582M575 235H582M574 241H581','none','stroke="'+stripe+'" stroke-width="1.5"')+
  P('M490 199Q571 177 626 235Q571 293 490 271','none','stroke="#050a0d" stroke-width="9" stroke-linecap="round"')+
  P('M493 197Q568 181 619 227','none','stroke="#c2cdd4" stroke-opacity=".57" stroke-width="2"')+
  P('M496 272Q568 286 619 243','none','stroke="#4c5a63" stroke-opacity=".6" stroke-width="1.6"')+
  P('M620 235H649','none','stroke="#0a1117" stroke-width="8"')+
  P('M620 232H647','none','stroke="#a3afb6" stroke-opacity=".5" stroke-width="1.5"')+'</g>';
 const mirrors=M(P('M621 205L623 167','none','stroke="#0c141a" stroke-width="4"')+P('M609 157L632 154Q639 154 637 162L611 166Z','url(#panel)','stroke="'+p+'" stroke-width="2"'));
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 470" width="1000" height="470" role="img" data-apex-silhouette="f1-team-bodywork-v8" data-apex-design-key="'+safe(profile.designKey||profile.teamKey)+'" data-apex-design="'+safe(d.reference)+'" data-apex-team="'+id+'" data-apex-model="'+model+'" data-apex-chassis="'+chassis+'" aria-label="Vista cenital de monoplaza '+id+' '+model+'">'+defs+bodyMasks+
  floor+rearWing+M(frontHalf)+suspension+sidepods+body+
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
 const selected=global.ApexVehicleStudio9A?.designFor?.(key);
 const designKey=Object.prototype.hasOwnProperty.call(designs,selected)?selected:key;
 const input={...blueprint,teamName:t.name,designKey,livery:l};
 const cacheKey=JSON.stringify(input);
 if(cache.has(cacheKey))return cache.get(cacheKey);
 const svg=markup(input);
 if(!svg)return null;
 const result=Object.freeze({key,designKey,model:blueprint.model,chassis:blueprint.chassis,
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
 img.dataset.apexDesignKey=render.designKey;
 img.dataset.apexModel=render.model;
 img.dataset.apexChassis=render.chassis;
 img.dataset.apexPreview='native-blueprint';
 if(img.src!==render.src)img.src=render.src;
 return true;
}
global.ApexTeamCarPreview9A=Object.freeze({build,setCar,markup});
})(window);
