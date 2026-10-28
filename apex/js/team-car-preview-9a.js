/* APEX 26 · Lightweight overhead studio drawing. Geometry only: the native
 * team catalogue, palette, persistence and image lifecycle remain unchanged.
 */
(function(global){
'use strict';
const $=id=>document.getElementById(id);
const cache=new Map();
// Studio dimensions in mm, from the supplied Piola 2026 comparison. These
// calibrate the illustration; they are not a full FIA volume/homologation check.
const dimensions=Object.freeze({wheelbaseMm:3400,frontOverhangMm:1300,rearOverhangMm:750,
 lengthMm:5450,widthMm:1900,frontWingMm:1800,rearWingMm:1150,
 tyreDiameterMm:710,frontTyreMm:275,rearTyreMm:375});
const mmPerUnit=dimensions.wheelbaseMm/564;
const unit=mm=>mm/mmPerUnit;
const hex=(s,f)=>/^#[0-9a-f]{6}$/i.test(String(s||''))?String(s).toLowerCase():f;
const safe=s=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,36);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||1));
// Showroom interpretations of the catalogue's inspiredBy references, not CAD
// replicas or changes to the racing physics/mesh. Each has its own shoulder,
// undercut, inlet, engine-cover, nose and wing curves; colours remain swappable.
const designs=Object.freeze({
 PAPAYA:{mirror:[650,143,12,28],reference:'McLaren',nose:[16,27,0],wing:[0,0],rear:[0,0],cover:[22,47,58,25],podBase:'secondary',
  proportions:{tailX:222,tailHalf:26,rearChord:1.26,cockpitShift:20,cockpitScale:.98,airboxShift:16},
  frontBlades:[
   'M877 225C889 200 879 163 855 126Q844 106 847 @10L869 @7C865 113 894 148 905 181L918 227Z',
   'M921 228C912 197 905 165 881 128Q868 106 872 @8L891 @8Q890 105 906 132Q931 172 939 229Z',
   'M942 230Q933 178 915 139Q896 108 895 @9L934 @12Q930 109 943 147Q960 194 964 233Z'],
  frontRidges:'M881 223C890 195 868 146 853 123Q847 105 851 @13M925 226Q916 171 889 126Q876 105 877 @12M946 228Q931 165 919 141Q903 107 901 @13',
  pod:'M266 218C310 203 327 162 369 138C418 110 483 108 544 112Q611 111 643 135Q656 149 649 177L633 207Q564 209 490 204Q373 218 266 226Z',
  panel:'M304 205C363 181 402 143 452 127Q519 108 581 119Q622 125 643 147L637 161Q601 137 556 132Q492 125 446 147C391 171 351 201 304 213Z',
  stripe:'M273 219C350 213 393 203 421 184C446 166 443 146 473 132C509 114 561 118 594 136L630 159',
  inlet:'M609 157Q626 151 644 160L642 178Q624 165 608 170Z',
  bodyUpper:'M173 211C275 211 354 203 416 187C455 175 483 173 518 175C565 176 599 184 635 195',
  bodyLower:'C599 286 565 294 518 295C483 297 455 295 416 283C354 267 275 259 173 259Z',
  spine:'M191 224C280 224 356 210 420 212Q456 211 480 220V250Q456 259 420 258C356 260 280 246 191 246Z',
  cockpit:{rim:'M486 208Q486 194 500 194H556Q597 194 613 211Q628 225 628 235Q628 245 613 259Q597 276 556 276H500Q486 276 486 262Z',
   well:'M497 215Q497 205 507 205H553Q579 205 591 216Q601 226 601 235Q601 244 591 254Q579 265 553 265H507Q497 265 497 255Z',
   halo:'M503 194H556C591 194 616 209 626 235C616 261 591 276 556 276H503',
   shadow:'M503 197H556C591 197 616 212 626 238C616 264 591 279 556 279H503',
   upper:'M505 192H556C588 192 612 207 621 227',
   lower:'M505 278H556C588 278 612 263 621 243'},
  livery:'sweep'},
 SILVERWING:{mirror:[644,140,11,27],shoulderRelief:0.8,reference:'Mercedes',nose:[20,24,-8],wing:[-12,14],rear:[10,-4],cover:[16,34,49,18],podBase:'secondary',
  bodySegments:[[173,217],[290,217,350,200,410,181],[450,171,480,169,518,171],[566,174,601,189,635,202]],
  spineProfile:[9,423,17,18],cockpitProfile:[488,554,624,38],
  pod:'M274 221C336 212 366 183 411 158Q449 139 494 137L587 132Q624 132 641 147L639 180L618 202Q551 212 476 209L366 219Z',
  panel:'M324 211L400 164Q445 149 494 147L609 141L628 153L614 182L548 193L425 207Z',
  stripe:'M323 216L415 191L518 182L621 165',
  inlet:'M600 145L638 144L638 155L601 159Z',
  livery:'center'},
 FERRATI:{mirror:[647,145,13,26],shoulderRelief:0.84,reference:'Ferrari',nose:[21,37,-14],wing:[10,-12],rear:[-6,5],cover:[30,61,65,30],podBase:'primary',
  bodySegments:[[173,205],[282,205,332,192,386,170],[438,148,483,146,531,156],[580,166,611,181,635,190]],
  spineProfile:[16,420,29,23],cockpitProfile:[482,558,633,43],
  pod:'M264 219C310 207 333 168 371 143C414 115 472 110 548 114Q610 116 640 139Q652 155 645 180L624 208Q543 218 453 212L337 225Z',
  panel:'M309 214Q365 197 400 161Q478 123 558 131Q602 132 628 151L625 176Q561 152 509 167Q415 202 309 219Z',
  stripe:'M342 204Q433 143 531 140L610 153',
  inlet:'M601 149Q619 142 638 154L633 174L600 170Z',
  livery:'double'},
 BULLHORN:{mirror:[649,130,12,30],shoulderRelief:0.77,reference:'Red Bull Racing',nose:[13,22,4],wing:[-17,23],rear:[7,-7],cover:[14,31,57,17],podBase:'primary',
  bodySegments:[[173,221],[280,221,355,203,412,174],[448,149,491,145,532,151],[579,157,612,184,635,203]],
  spineProfile:[7,429,20,16],cockpitProfile:[492,555,621,39],
  pod:'M258 223C335 218 363 190 398 153C433 116 481 108 538 111L606 113Q643 115 654 138L640 181L616 209Q546 215 473 207Q372 221 258 228Z',
  panel:'M293 217Q384 199 414 153Q455 126 526 124L619 124L638 140L619 178L554 181L467 202Z',
  stripe:'M323 215L424 170L487 134L568 133L619 146',
  inlet:'M606 128L646 126L641 146L606 153Z',
  livery:'chevron'},
 SUNRIDGE:{mirror:[648,146,12,25],shoulderRelief:0.83,reference:'Racing Bulls',nose:[18,31,-4],wing:[4,8],rear:[-1,-9],cover:[23,46,53,27],podBase:'primary',
  bodySegments:[[173,212],[282,212,342,200,402,181],[450,163,486,157,528,162],[577,169,610,185,635,193]],
  spineProfile:[12,419,25,20],cockpitProfile:[486,560,629,40],
  pod:'M270 222C341 213 367 179 408 155Q461 128 537 126Q609 127 644 148L643 179L620 205Q549 218 482 211Q377 224 270 228Z',
  panel:'M316 214Q406 178 443 148Q522 129 602 146L629 160L614 185Q548 162 488 187Q414 211 316 219Z',
  stripe:'M330 213Q447 150 515 145L616 161',
  inlet:'M610 149L639 150L640 165L605 169Z',
  livery:'split'},
 ALPEN:{mirror:[647,139,13,28],shoulderRelief:0.81,reference:'Alpine',nose:[15,33,-10],wing:[-6,-16],rear:[-8,8],cover:[20,40,62,24],podBase:'primary',
  bodySegments:[[173,215],[284,215,355,197,410,169],[446,151,489,151,529,158],[573,165,610,185,635,196]],
  spineProfile:[11,425,23,21],cockpitProfile:[488,557,626,41],
  pod:'M268 222L344 205Q379 176 408 149L453 132L503 124L603 125L647 143L646 180L621 209L537 216L411 214Z',
  panel:'M319 215L399 182L441 146L517 135L612 137L631 151L611 184L529 190L412 211Z',
  stripe:'M337 212L412 177L449 145L524 133L616 145',
  inlet:'M603 143L641 149L632 173L602 166Z',
  livery:'flank'},
 MIDNIGHT:{mirror:[648,144,14,26],shoulderRelief:0.87,reference:'Haas',nose:[23,35,-18],wing:[14,-5],rear:[-4,12],cover:[27,55,59,32],podBase:'primary',
  bodySegments:[[173,208],[284,208,343,194,401,174],[446,157,485,155,526,158],[574,165,610,180,635,188]],
  spineProfile:[15,416,27,24],cockpitProfile:[484,553,630,42],
  pod:'M275 218L354 199L398 147L456 129L601 129L643 144L646 182L616 211L480 215L359 225Z',
  panel:'M330 215L418 185Q500 169 604 179L625 183L613 197Q509 183 441 199Z',
  stripe:'M352 210L419 174L477 153H610',
  inlet:'M607 149H638V170H607Z',
  livery:'bars'},
 AUREON:{mirror:[645,142,12,29],shoulderRelief:0.82,reference:'Audi',nose:[19,29,-6],wing:[6,18],rear:[5,3],cover:[21,39,54,23],podBase:'secondary',
  bodySegments:[[173,214],[281,214,345,199,397,181],[442,165,484,159,526,162],[575,165,610,187,635,197]],
  spineProfile:[10,431,22,19],cockpitProfile:[489,551,623,39],
  pod:'M268 220L355 201Q395 166 430 143Q455 129 491 128L600 129Q632 130 644 149L646 180L622 207L534 214L412 215Z',
  panel:'M313 216L397 183L454 140L577 134L622 151L624 174L557 179L463 203Z',
  stripe:'M329 215L430 185L480 148L593 145L620 159',
  inlet:'M606 145L640 155L635 174L604 165Z',
  livery:'blade'},
 OCEANIC:{mirror:[647,148,11,27],shoulderRelief:0.84,reference:'Williams',nose:[17,26,6],wing:[-10,-7],rear:[2,10],cover:[19,43,51,22],podBase:'primary',
  bodySegments:[[173,216],[281,216,349,204,407,183],[450,169,488,164,527,166],[574,171,609,190,635,198]],
  spineProfile:[10,421,21,17],cockpitProfile:[487,559,627,38],
  pod:'M262 223C337 218 371 182 417 154C459 134 503 131 550 135Q610 136 642 156L636 184L614 209Q539 216 475 210Q367 225 262 228Z',
  panel:'M310 216C388 202 413 160 467 148Q541 139 604 153L625 166L609 186Q541 170 482 190Q407 215 310 220Z',
  stripe:'M328 215Q415 176 469 159Q541 149 607 164',
  inlet:'M604 156Q621 148 635 160L631 176L602 173Z',
  livery:'pinstripe'},
 GREENSTONE:{mirror:[645,134,12,31],shoulderRelief:0.78,reference:'Aston Martin',nose:[14,28,-1],wing:[-19,5],rear:[12,-3],cover:[13,30,56,19],podBase:'primary',
  bodySegments:[[173,222],[281,222,354,209,412,180],[452,153,489,149,532,154],[580,160,612,187,635,201]],
  spineProfile:[6,435,19,15],cockpitProfile:[493,556,622,37],
  pod:'M255 225C340 223 377 202 411 170C439 137 470 114 522 112Q594 107 639 134L646 164L624 204Q566 219 488 211Q373 224 255 230Z',
  panel:'M306 219Q395 210 436 156Q475 121 530 122Q587 119 624 143L630 160L611 186Q557 161 506 184Q410 218 306 223Z',
  stripe:'M324 219Q412 208 451 157Q510 116 608 148',
  inlet:'M608 137L640 141L635 151L605 155Z',
  livery:'spear'},
 CADARA:{mirror:[647,150,13,25],shoulderRelief:0.86,reference:'Cadillac',nose:[22,32,-12],wing:[12,4],rear:[-10,0],cover:[28,52,61,28],podBase:'primary',
  bodySegments:[[173,207],[283,207,340,192,396,173],[443,155,484,152,529,159],[574,168,611,181,635,192]],
  spineProfile:[14,417,28,22],cockpitProfile:[483,561,632,41],
  pod:'M272 222C334 212 368 174 413 151Q466 125 522 126L565 128L617 140Q638 147 644 157L638 187L616 211Q533 221 460 214L351 226Z',
  panel:'M320 216Q406 173 452 153Q522 133 602 148L628 163L610 188Q537 165 478 194L383 216Z',
  stripe:'M338 213Q439 156 511 147L615 163',
  inlet:'M606 155L636 155L636 174L606 171Z',
  livery:'lux'}
});
// Each reference owns its stations; only reflection and curve assembly are shared.
function shapeProfile(definition){
 if(!definition.bodySegments)return definition;
 const stations=definition.bodySegments.map((row,index)=>index===0?row:row.map((value,i)=>{
  if(i%2===0)return value;
  const x=row[i-1],weight=Math.max(0,Math.min(1,(x-280)/140,(680-x)/80));
  return Number((235+(value-235)*(1-weight*(1-definition.shoulderRelief))).toFixed(2));
 })),start=stations[0];
 const bodyUpper='M'+start.join(' ')+stations.slice(1).map(row=>'C'+row.join(' ')).join('');
 let bodyLower='';
 for(let i=stations.length-1;i>0;i--){
  const row=stations[i],previous=stations[i-1],end=previous.slice(-2);
  bodyLower+='C'+[row[2],470-row[3],row[0],470-row[1],end[0],470-end[1]].join(' ');
 }
 const [tail,middle,width,root]=definition.spineProfile;
 const spine='M191 '+(235-tail)+'C285 '+(235-tail)+' 347 '+(235-width)+' '+middle+' '+(235-width)+
  'Q456 '+(235-width)+' 480 '+(235-root)+'V'+(235+root)+
  'Q456 '+(235+width)+' '+middle+' '+(235+width)+'C347 '+(235+width)+' 285 '+(235+tail)+' 191 '+(235+tail)+'Z';
 const [rear,shoulder,front,half]=definition.cockpitProfile;
 const opening=(r,h,f,a)=>'M'+r+' '+(245-a)+'Q'+r+' '+(235-a)+' '+(r+10)+' '+(235-a)+'H'+h+
  'C'+(h+28)+' '+(235-a)+' '+f+' '+(235-a*.55)+' '+f+' 235C'+f+' '+(235+a*.55)+' '+(h+28)+' '+(235+a)+' '+h+' '+(235+a)+
  'H'+(r+10)+'Q'+r+' '+(235+a)+' '+r+' '+(225+a)+'Z';
 const halo=(offset=0)=>'M'+(rear+12)+' '+(235-half+offset)+'H'+shoulder+
  'C'+(shoulder+30)+' '+(235-half+offset)+' '+(front-8)+' '+(211+offset)+' '+front+' '+(235+offset)+
  'C'+(front-8)+' '+(259+offset)+' '+(shoulder+30)+' '+(235+half+offset)+' '+shoulder+' '+(235+half+offset)+'H'+(rear+12);
 return {...definition,bodyUpper,bodyLower:bodyLower+'Z',spine,
  cockpit:{rim:opening(rear,shoulder,front+2,half),well:opening(rear+10,shoulder-3,front-21,half-11),
   halo:halo(),shadow:halo(3),anchorX:rear+12,anchorTop:235-half,anchorBottom:235+half,
   upper:'M'+(rear+14)+' '+(233-half)+'H'+shoulder+'Q'+(shoulder+41)+' '+(233-half)+' '+(front-5)+' 227',
   lower:'M'+(rear+14)+' '+(237+half)+'H'+shoulder+'Q'+(shoulder+41)+' '+(237+half)+' '+(front-5)+' 243'}};
}
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
 const d=shapeProfile(designs[profile.teamKey]||designs.PAPAYA);
 const paintStyle=paintStyles.some(x=>x.key===profile.paintStyle)?profile.paintStyle:'original';
 const customPaint=paintStyle!=='original';
 const p=hex(l.primary,'#f58a00'),s=hex(l.secondary,'#161a20'),
  a=hex(l.accent,'#3ccef8'),stripe=hex(l.stripe,a),
  carbon=hex(l.carbon,'#080d13'),wing=hex(l.wing,'#10161e'),trim=hex(l.trim,'#f5f8fb');
 const finish=['silver','carbon','white'].includes(l.finish)?l.finish:'paint';
 const surface=finish==='silver'?'#b4c1cc':finish==='white'?'#f2f6fa':finish==='carbon'?'#101920':s;
 // Coordinate frame: nose points right; all mirrored parts share y=235.
 // Wheel footprints are longer along the chassis than across it.
 const nw=d.nose[0]*.65*clamp(g.noseWidth,.94,1.06),tip=785+unit(dimensions.frontOverhangMm),
  fy=75-(clamp(g.frontWing,.94,1.06)-1)*60,
  ry=116-(clamp(g.rearWing,.94,1.06)-1)*60,
  ws=1,cw=clamp(g.cockpitWidth,.94,1.06);
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
 // Shared dimensions drive both the slick envelope and its upright contact.
 // Front tyres are slimmer across the car; rears carry a wider tread.
 const wheelDimensions={front:{width:unit(dimensions.tyreDiameterMm),height:unit(dimensions.frontTyreMm)},
  rear:{width:unit(dimensions.tyreDiameterMm),height:unit(dimensions.rearTyreMm)}};
 const frontWheelY=235-unit((dimensions.widthMm-dimensions.frontTyreMm)/2);
 const rearWheelY=235-unit((dimensions.widthMm-dimensions.rearTyreMm)/2);
 const tire=(cx,cy,rear=false)=>{
  const size=wheelDimensions[rear?'rear':'front'];
  const shape='M-48 -34C-33 -39 -11 -39 0 -39C20 -39 39 -39 49 -34Q59 -29 59 0Q59 29 49 34C32 39 11 39 0 39C-20 39 -39 39 -49 34Q-59 29 -59 0Q-59 -29 -48 -34Z';
  const shoulder='M-46 -32Q0 -39 46 -32M-46 32Q0 39 46 32';
  return '<g class="apex-car-tyre" data-axle="'+(rear?'rear':'front')+'" transform="translate('+cx+' '+cy+') scale('+(size.width*ws/118)+' '+(size.height*ws/78)+')">'+
   P(shape,'url(#tyre)','class="apex-car-tyre-envelope" stroke="#030507" stroke-width="1.5"')+
   P(shape,'url(#rubberLight)')+P(shape,'url(#rubberGrain)')+
   // Rounded tread shoulders, a fine mould seam and subdued compound marks.
   P(shoulder,'none','stroke="#a5b0b6" stroke-opacity=".2" stroke-width="1.1"')+
   P('M-53 -26Q-57 0 -53 26M53 -26Q57 0 53 26','none','stroke="#020507" stroke-opacity=".8" stroke-width="3"')+
   P('M-49 -28Q-52 0 -49 28M49 -28Q52 0 49 28','none','stroke="#77848d" stroke-opacity=".12" stroke-width=".8"')+
   P('M-44 -23Q-19 -27 13 -25M-25 -14Q5 -16 39 -13M-40 16Q-8 19 24 17M-12 27Q15 29 40 25','none','stroke="#c3c9cc" stroke-opacity=".075" stroke-width=".6"')+
   P('M-47 -31Q-35 -34 -18 -34M-45 31Q-34 34 -20 34M23 -34L40 -32M22 34L40 32','none','stroke="#b4bec4" stroke-opacity=".16" stroke-width="1.1"')+
   P('M-26 -37Q0 -39 26 -37M-26 37Q0 39 26 37','none','stroke="#a92e36" stroke-opacity=".6" stroke-width=".9"')+'</g>';
 };
 const shade=(color,amount)=>'#'+color.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*amount).toString(16).padStart(2,'0')).join('');
 const defs='<defs>'+[
  ['tyre','#070a0c','#252b2e','#070a0c'],
  ['paint',shade(p,.78),p,shade(p,.66)],['panel',shade(surface,.78),surface,shade(surface,.55)],
  ['carbon','#182128',carbon,'#080c10'],['wing','#080d11','#20282e',wing],
  ['suspension','#52636d','#253039','#070c10'],['machined','#84919a','#303c44','#10171d']
 ].map(([id,c1,c2,c3])=>'<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+c1+'"/><stop offset=".45" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c3+'"/></linearGradient>').join('')+
 '<linearGradient id="light"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'+
 '<linearGradient id="volume" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#000" stop-opacity=".42"/><stop offset=".16" stop-color="#fff" stop-opacity=".1"/><stop offset=".34" stop-color="#fff" stop-opacity=".18"/><stop offset=".48" stop-color="#fff" stop-opacity=".03"/><stop offset=".75" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".46"/></linearGradient>'+
 // Local reflections describe the shoulders and recesses without raster
 // filters. Transparent shading preserves every custom paint pattern below.
 '<radialGradient id="podReflection" cx=".61" cy=".23" r=".65" gradientTransform="translate(0 .14) scale(1 .62)"><stop stop-color="#eef6fa" stop-opacity=".32"/><stop offset=".35" stop-color="#cfdee6" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'+
 '<radialGradient id="podUndercut" cx=".62" cy=".98" r=".72"><stop stop-color="#010508" stop-opacity=".8"/><stop offset=".48" stop-color="#010508" stop-opacity=".34"/><stop offset="1" stop-color="#010508" stop-opacity="0"/></radialGradient>'+
 '<linearGradient id="inletWell" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#010304"/><stop offset=".6" stop-color="#020609"/><stop offset="1" stop-color="#243039"/></linearGradient>'+
 '<linearGradient id="inletLip" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c3d2da" stop-opacity=".65"/><stop offset=".3" stop-color="#607583" stop-opacity=".35"/><stop offset="1" stop-color="#02080c" stop-opacity=".9"/></linearGradient>'+
 '<linearGradient id="mirrorGlass" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="#213944"/><stop offset=".45" stop-color="#aac4cf"/><stop offset=".65" stop-color="#d1e1e7"/><stop offset="1" stop-color="#304c5a"/></linearGradient>'+
 '<radialGradient id="clearCoat" cx=".58" cy=".18" r=".75"><stop stop-color="#fff" stop-opacity=".18"/><stop offset=".36" stop-color="#d5e7f0" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'+
 '<pattern id="seatFabric" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 1H1M2 2H3" stroke="#b7c4cd" stroke-opacity=".08" stroke-width=".5"/></pattern>'+
 '<radialGradient id="cockpitWell" cx=".3" cy=".5" r=".8"><stop stop-color="#182027"/><stop offset=".55" stop-color="#060c11"/><stop offset="1" stop-color="#010305"/></radialGradient>'+
 '<linearGradient id="seat" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#293138"/><stop offset=".3" stop-color="#111a21"/><stop offset=".75" stop-color="#1c252b"/><stop offset="1" stop-color="#070d12"/></linearGradient>'+
 '<linearGradient id="halo" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#56636b"/><stop offset=".15" stop-color="#26333b"/><stop offset=".45" stop-color="#0a1116"/><stop offset=".8" stop-color="#1e2b33"/><stop offset="1" stop-color="#080d12"/></linearGradient>'+
 '<linearGradient id="spineReflection" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#e4edf3" stop-opacity=".17"/><stop offset=".42" stop-color="#fff" stop-opacity=".035"/><stop offset=".6" stop-color="#000" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>'+
 '<linearGradient id="foilRelief" x1="0" y1="0" x2="1" y2=".15"><stop stop-color="#000" stop-opacity=".55"/><stop offset=".16" stop-color="#fff" stop-opacity=".18"/><stop offset=".4" stop-color="#fff" stop-opacity=".03"/><stop offset=".85" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></linearGradient>'+
 '<linearGradient id="channelRelief" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#000" stop-opacity=".6"/><stop offset=".25" stop-color="#000" stop-opacity=".08"/><stop offset=".5" stop-color="#e5edf3" stop-opacity=".15"/><stop offset=".7" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient>'+
 '<radialGradient id="rubberLight" cx=".4" cy=".28" r=".8"><stop stop-color="#b8c1c5" stop-opacity=".13"/><stop offset=".48" stop-color="#7c898f" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".64"/></radialGradient>'+
 '<pattern id="rubberGrain" width="37" height="29" patternUnits="userSpaceOnUse"><path d="M2 3l2 -1M9 8l3 1M18 2l1 -1M4 15l3 1M16 14l2 -1" stroke="#c3c9cc" stroke-width=".45" stroke-opacity=".055"/><path d="M6 5l5 1M14 17h4M1 11h3" stroke="#010507" stroke-width=".6" stroke-opacity=".12"/></pattern>'+
 '<pattern id="weave" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0H1.5V1.5H0ZM1.5 1.5H3V3H1.5Z" fill="#c2ced5" fill-opacity=".035"/></pattern>'+
 '</defs>';
 // Restrained carbon floor, stepped edge and small rear diffuser vanes.
 const floorShape='M160 220L216 211L257 195L287 184L299 118Q445 119 570 111L653 98L665 145L659 196L673 209L807 223V247L673 261L659 274L665 325L653 372L570 359Q445 351 299 352L287 286L257 275L216 259L160 250Z';
 const floor=P(floorShape,'url(#carbon)','class="apex-car-floor" stroke="#080d11" stroke-width="3"')+
  P(floorShape,'url(#weave)')+
  M(P('M301 122Q479 124 650 104L654 115Q477 139 305 134Z','#11191e','stroke="#7c8a92" stroke-opacity=".4" stroke-width="1"')+
   P('M314 138Q460 140 623 119','none','stroke="#bccad2" stroke-opacity=".16" stroke-width="1.4"')+
   P('M258 199L282 190L294 157L297 167L285 197L261 205Z','#0a1218','stroke="#53636e" stroke-opacity=".35" stroke-width=".8"')+
   P('M264 207L281 201L292 183M254 217L273 214L285 203','none','stroke="#63717a" stroke-opacity=".28" stroke-width="1.2"'));
 // Suspension joints are computed from the same tyre footprints: all four
 // inboard mounts stay attached for each native model's wheelScale.
 const frontInner=frontWheelY+wheelDimensions.front.height*ws/2,rearInner=rearWheelY+wheelDimensions.rear.height*ws/2;
 const number=n=>Number(n.toFixed(3));
 function arm(ax,ay,bx,by,width=6,kind='wishbone'){
  const length=Math.hypot(bx-ax,by-ay),nx=-(by-ay)/length,ny=(bx-ax)/length;
  const point=(x,y,offset)=>number(x+nx*offset)+' '+number(y+ny*offset);
  const path='M'+point(ax,ay,width/2)+'L'+point(bx,by,width*.32)+
   'L'+point(bx,by,-width*.32)+'L'+point(ax,ay,-width/2)+'Z';
  return '<g class="apex-car-suspension-arm" data-link="'+kind+'" data-anchors="'+[ax,ay,bx,by].join(' ')+'">'+
   P(path,kind==='halfshaft'?'url(#machined)':'url(#suspension)','stroke="#050b10" stroke-width="1"')+
   (kind==='wishbone'?P(path,'url(#weave)','opacity=".5"'):'')+
   P('M'+point(ax,ay,width*.16)+'L'+point(bx,by,width*.1),'none',
    'stroke="#b7c6ce" stroke-opacity=".28" stroke-width=".8"')+'</g>';
 }
 // Native rear stations keep the mechanical opening coherent with each
 // engine cover. Axle centres and tyre footprints remain the shared anchors.
 const rearForward=Number((294+d.cover[1]*.4).toFixed(2));
 const rearArmWidth=Number((8+d.cover[0]*.12).toFixed(2));
 const rearCaseHalf=Number((14+d.cover[0]*.18).toFixed(2));
 const suspension=M(
  '<g class="apex-car-suspension" data-axle="front">'+
   arm(670,215,780,frontInner+8,17)+arm(799,222,789,frontInner+9,14)+
   arm(708,227,776,frontInner+11,4.6,'pushrod')+
   arm(767,230,795,frontInner+9,3.2,'steering')+'</g>'+
  '<g class="apex-car-suspension" data-axle="rear">'+
   arm(231,220,215,rearInner+8,rearArmWidth)+arm(rearForward,221,229,rearInner+10,rearArmWidth*.85)+
   arm(rearForward-38,229,224,rearInner+14,3.4,'pushrod')+
   arm(221,235,221,rearInner+11,4.5,'halfshaft')+'</g>'
 );
 // The painted tail ends beside the rear axle. The exposed gearbox, near-
 // transverse shafts and diffuser lip form the open space behind it.
 const rearChord=d.proportions?.rearChord??(1+d.rear[1]/100);
 const rearShift=221-unit(dimensions.rearOverhangMm)-(110-33*rearChord);
 const rearYmin=ry-(d.frontBlades?5:3);
 const rearSpanScale=unit(dimensions.rearWingMm)/(470-2*rearYmin);
 const rearWingExit=110+35*rearChord+rearShift;
 const caseRear=rearWingExit+15,exitX=rearWingExit+25;
 const gearboxShape='M'+caseRear+' 228L'+(caseRear+14)+' 224Q211 '+(235-rearCaseHalf)+' 230 '+(235-rearCaseHalf)+
  'L258 223L267 230V240L258 247L230 '+(235+rearCaseHalf)+'Q211 '+(235+rearCaseHalf)+' '+(caseRear+14)+' 246L'+caseRear+' 242Z';
 const diffuserShape='M'+(caseRear-7)+' 202L'+(caseRear+7)+' 198L'+(exitX+13)+' 210V260L'+(caseRear+7)+' 272L'+(caseRear-7)+' 268Z';
 const pylonShape='M'+(rearWingExit-2)+' 222Q'+(rearWingExit+17)+' 222 211 225L232 227V232L210 230Q'+(rearWingExit+15)+' 227 '+(rearWingExit-2)+' 228Z';
 const rearAssembly='<g class="apex-car-rear-assembly" data-rear-stations="'+[caseRear,rearCaseHalf,rearForward,rearWingExit].join(' ')+'">'+
  // Only the upper diffuser lip is exposed from overhead, behind the gearbox.
  P(diffuserShape,'url(#carbon)','class="apex-car-diffuser-exit" stroke="#080d12" stroke-width="1"')+
  P(diffuserShape,'url(#weave)')+
  M(P('M'+(caseRear-6)+' 206L'+(caseRear+5)+' 203L'+(exitX+12)+' 213','none','stroke="#697984" stroke-opacity=".28" stroke-width="1"'))+
  P(gearboxShape,'url(#carbon)','class="apex-car-gearbox" stroke="#31404a" stroke-width=".8"')+
  P(gearboxShape,'url(#weave)','opacity=".65"')+
  // Cast casing shoulders, flange and two visible mounting brackets.
  M(P('M'+(caseRear+6)+' 226L202 222L218 '+(238-rearCaseHalf)+'L235 '+(238-rearCaseHalf)+'L249 226','none','stroke="#7b8b95" stroke-opacity=".35" stroke-width="1"')+
   P('M226 216L238 216L243 224L232 226Z','url(#machined)','class="apex-car-rear-bracket" stroke="#0a1116" stroke-width="1"')+
   '<circle cx="233" cy="220" r="1.4" fill="#a7b3ba"/>')+
  P('M209 220Q215 218 220 218V252Q215 252 209 250Z','url(#machined)','opacity=".55"')+
  M(P(pylonShape,'url(#carbon)','class="apex-car-rear-pylon" stroke="#0a1116" stroke-width=".8"')+
   P('M'+(rearWingExit+1)+' 223Q'+(rearWingExit+18)+' 223 211 226L229 228','none','stroke="#a6b5bf" stroke-opacity=".32" stroke-width=".8"'))+
  // Small axial exhaust above the case, visibly hollow at the rear edge.
  P('M'+(caseRear-2)+' 231H209L217 235L209 239H'+(caseRear-2)+'Z','url(#machined)','class="apex-car-tail-outlet" stroke="#16232b" stroke-width=".8"')+
  '<ellipse cx="'+(caseRear-2)+'" cy="235" rx="2.8" ry="4" fill="#010406" stroke="#7b8b94" stroke-width=".8"/></g>';
 function wheelMount(cx,inner,rear=false){
  const duct=rear?18:25;
  return '<g class="apex-car-wheel-mount" data-axle="'+(rear?'rear':'front')+'">'+
   // Upright, short exposed axle stub and inner wheel face. A true top view
   // does not show a full side-on alloy rim or an axle crossing the nose.
   P('M'+(cx-15)+' '+(inner-2)+'Q'+cx+' '+(inner-5)+' '+(cx+14)+' '+(inner-1)+'L'+(cx+12)+' '+(inner+9)+'L'+(cx+4)+' '+(inner+16)+'Q'+(cx-9)+' '+(inner+14)+' '+(cx-13)+' '+(inner+9)+'Z','url(#carbon)','stroke="#25343e" stroke-width="1"')+
   P('M'+(cx-4)+' '+(inner+3)+'H'+(cx+4)+'V'+(inner+16)+'H'+(cx-4)+'Z','url(#suspension)')+
   '<ellipse cx="'+cx+'" cy="'+(inner+1)+'" rx="12" ry="3" fill="#0a1117" stroke="#6c7c87" stroke-opacity=".4" stroke-width=".8"/>'+
   '<circle cx="'+cx+'" cy="'+(inner+8)+'" r="1.7" fill="#667780" stroke="#0b1217" stroke-width=".7"/>'+
   '<g class="apex-car-brake-duct">'+
    P('M'+(cx+9)+' '+(inner+3)+'L'+(cx+duct)+' '+(inner-2)+'Q'+(cx+duct+5)+' '+(inner+5)+' '+(cx+duct+1)+' '+(inner+12)+'L'+(cx+9)+' '+(inner+15)+'Z','url(#carbon)','stroke="#37454e" stroke-width="1"')+
    P('M'+(cx+duct)+' '+(inner+1)+'L'+(cx+duct+1)+' '+(inner+9)+'L'+(cx+duct-4)+' '+(inner+10)+'L'+(cx+duct-4)+' '+(inner+2)+'Z','#010508','stroke="#687d89" stroke-opacity=".5" stroke-width=".6"')+'</g></g>';
 }
 const rearJoints=M('<g class="apex-car-rear-joints">'+
  '<ellipse cx="231" cy="220" rx="3.6" ry="2.4" fill="#0b141b" stroke="#687b86" stroke-width=".8"/>'+
  '<ellipse cx="'+rearForward+'" cy="221" rx="3.6" ry="2.4" fill="#0b141b" stroke="#687b86" stroke-width=".8"/>'+
  '<circle cx="221" cy="'+(rearInner+8)+'" r="2.7" fill="#283640" stroke="#86959d" stroke-width=".8"/></g>');
 const mounts=M(wheelMount(785,frontInner)+wheelMount(221,rearInner,true))+rearJoints;
 const rearWing='<g class="apex-car-rear-wing" transform="translate('+rearShift+' 0) translate(110 235) scale('+rearChord+' '+rearSpanScale+') translate(-110 -235)">'+
  P('M79 '+ry+'Q106 '+(ry-3)+' 145 '+(ry+4)+'L145 '+(466-ry)+'Q106 '+(473-ry)+' 79 '+(470-ry)+'Z','url(#wing)','stroke="#04080c" stroke-width="3"')+
  [[80,99,'url(#wing)'],[101,122,'url(#panel)'],[124,144,'url(#carbon)']].map(([left,right,fill])=>
   P('M'+left+' '+(ry+5)+'H'+right+'V'+(465-ry)+'H'+left+'Z',fill,'class="apex-car-rear-wing-element"')).join('')+
  P('M79 '+ry+'Q106 '+(ry-3)+' 145 '+(ry+4)+'L145 '+(466-ry)+'Q106 '+(473-ry)+' 79 '+(470-ry)+'Z','url(#foilRelief)','class="apex-car-rear-plane-relief"')+
  M(P('M88 '+(ry+14)+'H136V'+(ry+25)+'H88Z','none','stroke="#667680" stroke-opacity=".35" stroke-width=".65"'))+
  P('M122 '+(ry+8)+'V'+(462-ry),'none','stroke="'+p+'" stroke-width="'+(d.frontBlades?3:8)+'"')+
  P('M100 '+(ry+6)+'V'+(464-ry)+'M123 '+(ry+8)+'V'+(462-ry),'none','stroke="#a4b1b9" stroke-opacity=".45" stroke-width="1.3"')+
  deco('M79 '+ry+'Q106 '+(ry-3)+' 145 '+(ry+4)+'L145 '+(466-ry)+'Q106 '+(473-ry)+' 79 '+(470-ry)+'Z')+
  P('M98 231H150L165 235L150 239H98Z','url(#suspension)','stroke="#0a1118" stroke-width="1"')+
  P('M104 233H147','none','stroke="#9cabb4" stroke-opacity=".5" stroke-width="1"')+
  '<text transform="translate(109 235) rotate(-90)" font-family="Arial,sans-serif" font-size="'+(brand.length>10?14:19)+'" font-weight="800" text-anchor="middle" fill="'+trim+'">'+brand+'</text>'+
  (d.frontBlades?M(P('M77 '+(ry-4)+'Q111 '+(ry-7)+' 151 '+(ry-1)+'L149 '+(ry+5)+'Q111 '+(ry+2)+' 77 '+(ry+3)+'Z','url(#carbon)','stroke="'+p+'" stroke-width="1.1"')):
   M(P('M77 '+(ry-3)+'H149V'+(ry+4)+'H77Z',carbon,'stroke="'+stripe+'" stroke-width="1.5"')))+'</g>';
 // Distinct transverse wing elements, swept back at the centre.
 const sweep=d.wing[1];
 const blade=(a0,a1,b0,b1)=>'M'+a0+' 228Q'+(a0-15+sweep*.15)+' 169 '+a1+' '+(fy+10)+
  'L'+b1+' '+(fy+7)+'Q'+(b0-14+sweep*.15)+' 168 '+b0+' 230Z';
 const wingPath=path=>path.replace(/@(\d+)/g,(_,offset)=>fy+Number(offset));
 const foils=d.frontBlades?d.frontBlades.map(wingPath):[
  blade(872,850,896,873),blade(899,878,917,899),blade(920,904,951,943)];
 const foilPaint=['url(#wing)','url(#panel)','url(#carbon)'];
 const frontYmin=fy-(d.frontBlades?3.84:13/12);
 const frontSpanScale=unit(dimensions.frontWingMm)/(470-2*frontYmin);
 const frontWingTransform='translate(930 235) scale('+(1+d.wing[0]/85)+' '+frontSpanScale+') translate(-930 -235)';
 // Join each element's actual centre roots, including the custom McRaven
 // curves. A slight overlap avoids an antialiased crack between mirrored halves.
 const frontBridge='<g class="apex-car-front-bridge" transform="'+frontWingTransform+'">'+foils.map((shape,index)=>{
  const points=shape.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const [ax,ay]=points,[bx,by]=points.slice(-2);
  const join='M'+ax+' '+(ay-1)+'L'+bx+' '+(by-1)+'Q'+(bx+2)+' 235 '+bx+' '+(471-by)+
   'L'+ax+' '+(471-ay)+'Q'+(ax+1)+' 235 '+ax+' '+(ay-1)+'Z';
  return P(join,foilPaint[index],'class="apex-car-wing-join" data-element="'+index+'" stroke="#060b10" stroke-width=".7"')+
   (index===1?deco(join):'');
 }).join('')+'</g>';
 const frontHalf='<g class="apex-car-front-wing" transform="'+frontWingTransform+'">'+
  foils.map((shape,index)=>P(shape,foilPaint[index],'class="apex-car-wing-element" data-element="'+index+'" stroke="#060b10" stroke-width="1.5"')+(index===1?deco(shape):'')+P(shape,'url(#foilRelief)','class="apex-car-foil-relief"')+(index===foils.length-1?P(shape,'none','stroke="'+p+'" stroke-width="1"'):'')).join('')+
  P(d.frontRidges?wingPath(d.frontRidges):'M877 225Q860 165 855 '+(fy+14)+'M904 226Q889 164 883 '+(fy+14)+'M925 227Q913 167 909 '+(fy+14),'none','stroke="#d9e5ec" stroke-opacity=".4" stroke-width="1.2"')+
  P(d.frontBlades?'M846 '+(fy+1)+'Q889 '+(fy-10)+' 944 '+(fy+4)+'L950 '+(fy+16)+'Q918 '+(fy+8)+' 892 '+(fy+10)+'L848 '+(fy+12)+'Z':
   'M846 '+(fy+1)+'Q887 '+(fy-4)+' 944 '+(fy+3)+'L950 '+(fy+12)+'Q891 '+(fy+5)+' 847 '+(fy+9)+'Z','url(#carbon)','stroke="'+p+'" stroke-width="2"')+
  P('M887 169L906 207L913 208L894 168Z','url(#suspension)')+
  '<circle cx="891" cy="173" r="2" fill="#9cabb4" stroke="#10191f" stroke-width=".7"/>'+
  '<text transform="translate(890 143) rotate(74)" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="'+trim+'" text-anchor="middle">'+brand+'</text></g>';
 // Independent pod outlines, inlet cuts and paint masks per reference.
 const podSkin=d.pod;
 // A recessed longitudinal channel sits between the raised outer shoulder
 // and the engine cover. Its stations follow each team's shoulder/waist;
 // it is a physical surface, independent of the selected paint pattern.
 const channelOffset=(d.cover[1]-47)*.18,channelFront=d.cover[2]-58;
 const podChannel='M291 216C366 204 413 '+(171+channelOffset)+' 464 '+(155+channelOffset)+
  'Q522 '+(139+channelOffset)+' 575 '+(150+channelOffset)+'Q612 '+(156+channelFront*.15)+' 637 177L629 195'+
  'Q580 '+(170+channelOffset)+' 532 '+(177+channelOffset)+'C457 '+(191+channelOffset)+' 371 216 291 225Z';
 const channelRidge='M302 215C374 202 419 '+(171+channelOffset)+' 465 '+(157+channelOffset)+
  'Q527 '+(141+channelOffset)+' 576 '+(152+channelOffset)+'Q608 158 633 176';
 const podTone=customPaint?p:d.podBase==='secondary'?surface:p;
 const podPanel=d.livery==='double'||d.livery==='sweep'?p:d.livery==='pinstripe'?stripe:surface;
 const podDetail=customPaint?deco(podSkin):P(d.panel,podPanel)+
  (d.livery==='sweep'?'':P(d.stripe,'none','stroke="'+stripe+'" stroke-width="'+(d.livery==='flank'?12:d.livery==='split'?7:3.5)+'" stroke-linecap="round"'));
 const inletStart=d.inlet.match(/^M([\d.]+) ([\d.]+)/).slice(1).map(Number);
 const inletX=inletStart[0]+16,inletY=inletStart[1]+9;
 const throatTransform='translate('+inletX+' '+inletY+') scale(.76 .55) translate('+(-inletX)+' '+(-inletY)+')';
 const inletRibs=[605,614,623,632,641].map(x=>P('M'+x+' 120L'+(x-5)+' 185','none','stroke="#81929d" stroke-opacity=".15" stroke-width=".65"')).join('');
 const pod=upper=>'<g class="apex-car-sidepod">'+
  P(podSkin,podTone,'stroke="#0a1015" stroke-width="2"')+
  (d.livery==='sweep'?P(podSkin,'url(#weave)'):'')+
  podDetail+
  // Cadara's upper secondary panel sits below the same material layers.
  (upper&&!customPaint&&d.livery==='lux'?P(podSkin,surface):'')+
  (d.livery==='sweep'?'':P(d.panel,'url(#weave)','opacity=".45"'))+
  P(podSkin,'url(#volume)','opacity="'+(d.livery==='sweep'?0.55:1)+'"')+
  P(podSkin,'url(#podReflection)','class="apex-car-pod-reflection" opacity="'+(d.livery==='sweep'?0.55:1)+'"')+
  P(podSkin,'url(#podUndercut)')+
  P(d.panel,'url(#channelRelief)','class="apex-car-pod-shoulder"')+
  '<g clip-path="url(#podMask)">'+
   P(podChannel,'url(#panel)','class="apex-car-pod-channel"')+
   P(podChannel,'url(#channelRelief)')+P(podChannel,'url(#weave)')+
   P(channelRidge,'none','class="apex-car-channel-ridge" stroke="#d4e1e8" stroke-opacity=".24" stroke-width="1.1"')+
  '</g>'+
  P(d.panel,'none','stroke="#03080c" stroke-opacity=".5" stroke-width="1.2"')+
  '<g clip-path="url(#podMask)">'+

   P('M309 218Q420 213 494 190Q558 172 619 192','none','stroke="#010609" stroke-opacity=".4" stroke-width="4"')+
   P(d.inlet,'#020609','stroke="#010609" stroke-opacity=".6" stroke-width="5"')+
   P(d.inlet,'url(#inletWell)','class="apex-car-inlet" stroke="url(#inletLip)" stroke-width="1.6"')+
   '<g class="apex-car-inlet-throat" transform="'+throatTransform+'">'+
    P(d.inlet,'#010406','stroke="#081218" stroke-width=".8"')+'</g>'+
   '<g class="apex-car-inlet-depth" clip-path="url(#throatMask)">'+inletRibs+'</g>'+
   P(d.inlet,'none','class="apex-car-inlet-return" stroke="url(#inletLip)" stroke-opacity=".65" stroke-width=".7"')+'</g>'+
  P('M523 132L532 137M533 131L542 136M543 131L552 136M553 132L562 137','none','stroke="#020609" stroke-width="2"')+'</g>';
 const sidepods=pod(true)+'<g transform="translate(0 470) scale(1 -1)">'+pod(false)+'</g>';
 const [tail,waist,shoulder,root]=d.cover;
 const half=d.nose[1]*1.12;
 const noseRoot=root+15;
 const tailX=d.proportions?.tailX??(221+d.rear[1]*.12),tailHalf=d.proportions?.tailHalf??Math.max(16,tail*1.05);
 const rearUpper=d.bodyUpper?.replace(/^M173 [\d.]+/,'M'+tailX+' '+(235-tailHalf));
 const rearLower=d.bodyLower?.replace(/173 [\d.]+Z$/,tailX+' '+(235+tailHalf)+'Z');
 const rearSpine=d.spine?.replace(/^M191 [\d.]+/,'M'+(tailX+6)+' '+(235-Math.min(9,tailHalf*.6)))
  .replace(/191 [\d.]+Z$/,(tailX+6)+' '+(235+Math.min(9,tailHalf*.6))+'Z');
 // Absolute stations give independently shaped engine-cover shoulders, waist,
 // nose root and nose tip. Mirrored on the centreline, never scaled as one car.
 const bodyShape=(rearUpper||'M173 '+(235-tail)+'L272 '+(235-tail-3)+
  'C329 '+(235-waist+3)+' 362 '+(235-waist-8)+' 402 '+(235-shoulder-9)+
  'Q448 '+(220-shoulder)+' 487 '+(225-shoulder+5)+
  'L531 '+(229-shoulder)+'Q595 '+(235-root-22)+' 635 '+(235-noseRoot))+
  'Q677 '+(235-half-2)+' 744 '+(235-half*.76)+
  'L'+(tip-8)+' '+(235-nw)+'Q'+(tip+8)+' 235 '+(tip-8)+' '+(235+nw)+
  'L744 '+(235+half*.76)+'Q677 '+(235+half+2)+' 635 '+(235+noseRoot)+
  (rearLower||'Q595 '+(235+root+22)+' 531 '+(241+shoulder)+'L487 '+(245+shoulder-5)+
  'Q448 '+(250+shoulder)+' 402 '+(235+shoulder+9)+
  'C362 '+(235+waist+8)+' 329 '+(235+waist-3)+' 272 '+(235+tail+3)+'L173 '+(235+tail)+'Z');
 // The engine cover is a tapered spine, surrounded by painted shoulders.
 const spine=waist*.30,spineRoot=shoulder*.34;
 const engineShape=rearSpine||'M183 '+(235-tail*.47)+'L293 '+(235-spine)+
  'Q375 '+(235-spineRoot)+' 442 '+(235-spineRoot)+
  'Q465 '+(235-spineRoot+1)+' 485 217L485 253Q465 '+(235+spineRoot-1)+' 442 '+(235+spineRoot)+
  'Q375 '+(235+spineRoot)+' 293 '+(235+spine)+'L183 '+(235+tail*.47)+'Z';
 const noseShape='M635 '+(235-noseRoot)+'Q677 '+(235-half-2)+' 744 '+(235-half*.76)+
  'L'+(tip-8)+' '+(235-nw)+'Q'+(tip+8)+' 235 '+(tip-8)+' '+(235+nw)+
  'L744 '+(235+half*.76)+'Q677 '+(235+half+2)+' 635 '+(235+noseRoot)+'Z';
 const blocks={
  sweep:'',
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
 const body=P(bodyShape,'url(#paint)','class="apex-car-body" stroke="'+(d.bodyUpper?shade(p,.45):'#111820')+'" stroke-width="'+(d.bodyUpper?0.8:2)+'"')+
  P(engineShape,d.livery==='double'?p:'url(#panel)','class="apex-car-engine-cover"')+
  '<g clip-path="url(#bodyMask)" class="apex-car-livery">'+(customPaint?deco(bodyShape):blocks[d.livery])+'</g>'+
  P(bodyShape,'url(#volume)','opacity="'+(d.bodyUpper?0.65:1)+'"')+
  P(bodyShape,'url(#clearCoat)','class="apex-car-body-reflection"')+
  P(engineShape,'url(#weave)','opacity=".55"')+
  P(engineShape,'url(#spineReflection)')+
  P(engineShape,'none','stroke="#e1edf4" stroke-opacity=".13" stroke-width="1"')+
  P(noseShape,'url(#light)','class="apex-car-nose"')+
  P('M664 '+(234-half)+'L'+(tip-28)+' '+(234-nw),'none','stroke="#fff" stroke-opacity=".32" stroke-width="1.4"')+
  P(d.proportions?'M'+(tip-58)+' 218L'+(tip-16)+' 224V246L'+(tip-58)+' 252Z':'M845 220L872 222L874 248L845 250Z',stripe,'opacity=".9" clip-path="url(#bodyMask)"')+
  '<text x="860" y="241" font-family="Arial,sans-serif" font-size="17" font-weight="900" text-anchor="middle" fill="'+trim+'">26</text>';
 const serviceDetails='<g class="apex-car-service-details">'+
  P('M668 224Q668 222 671 222H695Q698 222 698 225V245Q698 248 695 248H671Q668 248 668 245Z','none','stroke="#dae5eb" stroke-opacity=".28" stroke-width=".9"')+
  P('M676 229H688V241H676Z','#0b141a','opacity=".8"')+
  '<circle cx="673" cy="225" r="1.1" fill="#c5d0d7" opacity=".6"/><circle cx="693" cy="245" r="1.1" fill="#c5d0d7" opacity=".6"/>'+
  P('M792 232H799V238H792Z','#071017','stroke="#8798a3" stroke-opacity=".5" stroke-width=".7"')+'</g>';
 const cockpitWellShape=d.cockpit?.well||'M492 215Q492 208 501 208L546 207Q578 209 600 235Q578 261 546 263L501 262Q492 262 492 255Z';
 const bodyMasks='<defs><clipPath id="cockpitMask">'+P(cockpitWellShape,'#fff')+'</clipPath><clipPath id="bodyMask">'+P(bodyShape,'#fff')+'</clipPath><clipPath id="shellMask">'+P(bodyShape,'#fff')+P(podSkin,'#fff')+P(podSkin,'#fff','transform="translate(0 470) scale(1 -1)"')+'</clipPath><clipPath id="podMask">'+P(podSkin,'#fff')+'</clipPath><clipPath id="inletMask">'+P(d.inlet,'#fff')+'</clipPath><clipPath id="throatMask">'+P(d.inlet,'#fff','transform="'+throatTransform+'"')+'</clipPath><clipPath id="upperHalf"><rect x="0" y="0" width="1000" height="235"/></clipPath></defs>';
 // One uninterrupted paint curve spans both surfaces; it cannot be hidden by
 // the body/pod drawing order or appear as separate straight arrows.
 const flowingAccent=!customPaint&&d.livery==='sweep'?'<g class="apex-car-flowing-accent" clip-path="url(#shellMask)">'+
  M(P(d.stripe,'none','stroke="'+stripe+'" stroke-width="3.5" stroke-linecap="round"'))+'</g>':'';

 // Empty showroom cockpit: seat, belts and steering wheel. The halo sits
 // above the cockpit rim and converges into its single forward support.
 const cockpit='<g class="apex-car-cockpit" transform="translate('+(d.proportions?.cockpitShift||0)+' 0) translate(554 235) scale('+(d.proportions?.cockpitScale||1.02)+' '+(cw*.98)+') translate(-554 -235)">'+
  P(d.cockpit?.rim||'M482 211Q482 200 493 199L544 197Q594 197 626 235Q594 273 544 273L493 271Q482 270 482 259Z',d.cockpit?'url(#paint)':'url(#carbon)','stroke="'+shade(p,.65)+'" stroke-width="2"')+
  P(cockpitWellShape,'url(#cockpitWell)','stroke="#76838b" stroke-opacity=".24" stroke-width=".8"')+
  '<g clip-path="url(#cockpitMask)">'+
  // Slim padded shoulders follow the opening; the same cockpit clip keeps
  // them inside every native shell and outside the painted rim.
  M(P('M500 210L530 208Q544 210 552 217L547 221Q532 215 513 216H500Z','url(#seat)','class="apex-car-cockpit-padding" stroke="#52606a" stroke-opacity=".3" stroke-width=".7"')+
   P('M503 211L528 210Q542 212 548 217','none','stroke="#94a2ac" stroke-opacity=".23" stroke-width=".6"'))+
  // Padded bucket and side bolsters: broad dark surfaces, fine stitching.
  P('M497 219Q497 216 502 216H519Q531 219 536 225V245Q531 251 519 254H502Q497 254 497 251Z','url(#seat)','class="apex-car-seat" stroke="#344149" stroke-opacity=".45" stroke-width=".8"')+
  P('M500 218H521L535 227V243L521 252H500Z','url(#seatFabric)','class="apex-car-seat-fabric"')+
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
  '</g>'+
  // A short offset shadow seats the halo above the rim, without blur filters.
  P(d.cockpit?.shadow||'M494 202C544 190 589 201 621 238C589 275 544 286 494 274','none','stroke="#010406" stroke-opacity=".65" stroke-width="8" stroke-linecap="round"')+
  P(d.cockpit?.halo||'M494 199C544 187 589 198 621 235C589 272 544 283 494 271','none','stroke="url(#halo)" stroke-width="5.5" stroke-linecap="round"')+
  P(d.cockpit?.upper||'M496 197C543 188 586 199 615 227','none','stroke="#d5dfe5" stroke-opacity=".38" stroke-width=".9"')+
  P(d.cockpit?.lower||'M496 273C543 282 586 271 615 243','none','stroke="#4c5a63" stroke-opacity=".4" stroke-width=".8"')+
  P('M618 235H649','none','stroke="url(#halo)" stroke-width="5" stroke-linecap="round"')+
  P('M620 232H647','none','stroke="#a3afb6" stroke-opacity=".4" stroke-width=".8"')+
  '<circle cx="'+(d.cockpit?(d.cockpit.anchorX||503):495)+'" cy="'+(d.cockpit?(d.cockpit.anchorTop||194):199)+'" r="1.8" fill="#7b8a93"/><circle cx="'+(d.cockpit?(d.cockpit.anchorX||503):495)+'" cy="'+(d.cockpit?(d.cockpit.anchorBottom||276):271)+'" r="1.8" fill="#47565f"/></g>';
 // Mirror cases are elongated across the car, with only a thin rearward
 // reflective face visible overhead. Both faired stays have visible roots.
 const [mx,my,mw,mh]=d.mirror,left=mx-mw/2,right=mx+mw/2,top=my-mh/2,bottom=my+mh/2;
 const caseShape='M'+(left+3)+' '+top+'H'+(right-3)+'Q'+right+' '+top+' '+right+' '+(top+4)+
  'V'+(bottom-4)+'Q'+right+' '+bottom+' '+(right-3)+' '+bottom+'H'+(left+2)+'Q'+(left-1)+' '+bottom+' '+left+' '+(bottom-4)+
  'L'+(left-1)+' '+(top+4)+'Q'+(left-1)+' '+top+' '+(left+3)+' '+top+'Z';
 const glassShape='M'+(left+.6)+' '+(top+5)+'L'+(left+3)+' '+(top+3)+'V'+(bottom-3)+'L'+(left+.6)+' '+(bottom-5)+'Z';
 const stay=(ax,ay,bx,by,width)=>{
  const len=Math.hypot(bx-ax,by-ay),nx=-(by-ay)/len,ny=(bx-ax)/len;
  const point=(x,y,k)=>number(x+nx*k)+' '+number(y+ny*k);
  return '<g class="apex-car-mirror-stay" data-anchors="'+[ax,ay,bx,by].join(' ')+'">'+
   P('M'+point(ax,ay,width*.5)+'Q'+point((ax+bx)/2,(ay+by)/2,width*.4)+' '+point(bx,by,width*.2)+
    'L'+point(bx,by,-width*.2)+'Q'+point((ax+bx)/2,(ay+by)/2,-width*.3)+' '+point(ax,ay,-width*.5)+'Z','url(#carbon)','stroke="#101b22" stroke-width=".6"')+
   P('M'+point(ax,ay,width*.15)+'L'+point(bx,by,width*.08),'none','stroke="#8395a0" stroke-opacity=".32" stroke-width=".65"')+'</g>';
 };
 const rootX=620,rootY=182+(d.cover[0]-22)*.15;
 const mirrorHalf='<g class="apex-car-mirror">'+
  P('M628 207L635 204L638 209L631 212Z','url(#carbon)','class="apex-car-mirror-root" stroke="#5b6e79" stroke-width=".65"')+
  P('M'+(rootX-4)+' '+(rootY-2)+'L'+(rootX+4)+' '+(rootY-3)+'L'+(rootX+5)+' '+(rootY+2)+'L'+(rootX-3)+' '+(rootY+3)+'Z','url(#carbon)','class="apex-car-mirror-root" stroke="#5b6e79" stroke-width=".65"')+
  stay(632,208,mx-2,bottom-1,4.2)+stay(rootX,rootY,left+2,my+mh*.25,3.2)+
  P(caseShape,'url(#paint)','class="apex-car-mirror-case" stroke="#0c1720" stroke-width=".9"')+
  P(caseShape,'url(#volume)','opacity=".55"')+
  P(glassShape,'url(#mirrorGlass)','class="apex-car-mirror-glass" stroke="#152b38" stroke-width=".45"')+
  P('M'+(right-2)+' '+(top+4)+'V'+(bottom-4),'none','stroke="'+stripe+'" stroke-width=".9"')+
  P('M'+(left+4)+' '+(top+1.5)+'H'+(right-3),'none','stroke="#f1f7fa" stroke-opacity=".45" stroke-width=".7"')+
  '<circle cx="632" cy="208" r="1.1" fill="#8b9ba5"/></g>';
 const mirrors=M(mirrorHalf);
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 470" width="1040" height="470" role="img" data-mm-per-unit="'+mmPerUnit+'" data-apex-silhouette="f1-mirrors-inlets-v23" data-apex-design-key="'+id+'" data-apex-paint-style="'+paintStyle+'" data-apex-design="'+safe(d.reference)+'" data-apex-team="'+id+'" data-apex-model="'+model+'" data-apex-chassis="'+chassis+'" aria-label="Vista cenital de monoplaza '+id+' '+model+'">'+defs+paintDefs+bodyMasks+
  floor+rearWing+rearAssembly+frontBridge+M(frontHalf)+suspension+mounts+sidepods+body+flowingAccent+serviceDetails+
  tire(221,rearWheelY,true)+tire(221,470-rearWheelY,true)+tire(785,frontWheelY)+tire(785,470-frontWheelY)+cockpit+mirrors+
  '<g class="apex-car-airbox" transform="translate('+(d.proportions?.airboxShift||0)+' 0)">'+
  P('M466 221H488V249H466Z','url(#carbon)','stroke="#61717b" stroke-width=".8"')+
  M(P('M468 205H487V215H468Z','url(#carbon)','stroke="#485a65" stroke-width=".6"'))+
  P('M471 225H482V245H471Z','#03080b','stroke="#303e48" stroke-width="1"')+'</g>'+
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
  svg,dimensions,src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
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
global.ApexTeamCarPreview9A=Object.freeze({build,setCar,markup,paintStyles,dimensions});
})(window);
