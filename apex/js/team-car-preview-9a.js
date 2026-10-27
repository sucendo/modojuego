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
 const p=hex(l.primary,'#f58a00'),s=hex(l.secondary,'#15191f'),
       a=hex(l.accent,'#3ccef8'),stripe=hex(l.stripe,a),
       carbon=hex(l.carbon,'#0b121b'),wing=hex(l.wing,'#121a24'),
       trim=hex(l.trim,'#e6f3ff'),halo=hex(l.halo,p);
 const nose=clamp(g.noseWidth,.8,1.22),noseL=clamp(g.noseLen,.8,1.22),
       pod=clamp(g.sidepodWidth,.8,1.22),front=clamp(g.frontWing,.8,1.22),
       rear=clamp(g.rearWing,.8,1.22),wheel=clamp(g.wheelScale,.8,1.22),
       cockpit=clamp(g.cockpitWidth,.8,1.22);
 const finish=['silver','carbon','white'].includes(l.finish)?l.finish:'paint';
 const surface=finish==='silver'?'#bdc9d2':finish==='white'?'#edf3f8':finish==='carbon'?'#131c25':s;
 const surfLine=finish==='white'?'#ffffff':finish==='silver'?'#f3f7fc':finish==='carbon'?'#60717d':trim;
 const id=safe(profile.teamKey),model=safe(profile.model),chassis=safe(profile.chassis);
 const f=n=>Number(n).toFixed(2);
 // All four wheels, cockpit, suspension and wing sizes share one 2026 frame.
 const frontAxle=783,frontWingTip=97+(1-front)*13,rearWingTip=137+(1-rear)*15;
 const noseTip=908+Math.round((noseL-1)*23),podEdge=156-(pod-1)*18;
 const halfNose=10*nose;
 const wheelW=86*wheel,wheelH=107*wheel;
 const P=(d,fill,extras='')=>'<path d="'+d+'" fill="'+fill+'" '+extras+'/>';
 const M=upper=>'<g>'+upper+'</g><g transform="translate(0 470) scale(1 -1)">'+upper+'</g>';
 const tire=(x,y)=>{
  const w=wheelW,h=wheelH;
  return '<g>'+
   '<rect x="'+f(x-3)+'" y="'+f(y-3)+'" width="'+f(w+6)+'" height="'+f(h+6)+'" rx="22" fill="#010306"/>'+
   '<rect x="'+f(x)+'" y="'+f(y)+'" width="'+f(w)+'" height="'+f(h)+'" rx="19" fill="url(#tyre)" stroke="#242b31" stroke-width="3"/>'+
   '<rect x="'+f(x+7)+'" y="'+f(y+8)+'" width="'+f(w-14)+'" height="'+f(h-16)+'" rx="15" fill="none" stroke="#838c95" opacity=".17" stroke-width="2"/>'+
   '<path d="M'+f(x+12)+' '+f(y+13)+'Q'+f(x+6)+' '+f(y+h/2)+' '+f(x+12)+' '+f(y+h-13)+
    'M'+f(x+w-12)+' '+f(y+13)+'Q'+f(x+w-6)+' '+f(y+h/2)+' '+f(x+w-12)+' '+f(y+h-13)+'" fill="none" stroke="#e3e7ec" stroke-opacity=".14" stroke-width="3"/>'+
   '<rect x="'+f(x+w*.52)+'" y="'+f(y+6)+'" width="2" height="'+f(h-12)+'" rx="1" fill="#e53735" opacity=".68"/>'+
   '<path d="M'+f(x+18)+' '+f(y+10)+'L'+f(x+18)+' '+f(y+h-10)+
    'M'+f(x+w-18)+' '+f(y+10)+'L'+f(x+w-18)+' '+f(y+h-10)+'" stroke="#03070a" stroke-width="4" opacity=".35" fill="none"/>'+
   '</g>';
 };
 // Top-side motor/sidepod contours. Reflect about the longitudinal axis.
 const sideP=
   'M280 189 Q318 166 367 '+f(podEdge)+' Q417 '+f(podEdge-11)+' 476 '+f(podEdge+8)+
   ' L561 184 Q617 194 664 217 L648 230 L483 221 Q369 204 280 211Z';
 const upper=M(
  P('M264 190 Q345 144 456 145 L576 168 Q641 180 697 217 L670 232 L454 225 L299 225Z','url(#floorGlow)','stroke="#060b10" stroke-width="3"')+
  P(sideP,'url(#podPaint)','stroke="#060a10" stroke-width="4"')+
  P('M297 191 Q368 171 464 176 L549 190 Q589 198 618 219 L521 214 Q405 199 297 209Z','url(#darkCarbon)','opacity=".92"')+
  P('M327 177 Q390 157 474 174 L559 200 Q492 186 417 183 Q365 181 327 192Z','url(#reflection)','opacity=".68"')+
  P('M322 195 Q406 176 532 206 L594 221','none','stroke="'+stripe+'" stroke-width="7" stroke-linecap="round" opacity=".93"')+
  P('M319 213 C397 201 484 216 536 222','none','stroke="'+p+'" stroke-width="6" opacity=".84"')+
  P('M449 171 L467 177 L451 202 L430 200Z','#02060a','stroke="#73818d" stroke-width="1.3"')+
  P('M464 177 L474 182 L464 198','none','stroke="#9cb5c2" stroke-width="2.1" opacity=".55"')+
  P('M293 221 Q364 235 470 234','none','stroke="#b9d0dd" stroke-width="2.1" opacity=".26"')+
  // sculpted forward sidepod inlet, not an abstract polygon
  P('M536 194 Q559 194 582 211 L598 220 L548 219Z','#03090d','stroke="#657786" stroke-width="2"')+
  P('M549 200 L579 217','none','stroke="#9cabb3" stroke-width="2.4" opacity=".55"')+
  P('M335 150 Q385 140 435 155','none','stroke="'+surfLine+'" stroke-opacity=".15" stroke-width="3"')
 );
 const mainBody=
  P('M171 220 Q227 208 293 202 Q375 180 442 198 L545 215 L672 226 L'+f(noseTip-6)+' '+f(235-halfNose)+' Q'+f(noseTip+5)+' 235 '+f(noseTip-6)+' '+f(235+halfNose)+' L672 244 L545 255 L442 272 Q375 290 293 268 Q227 262 171 250Z','url(#bodyPaint)','stroke="#06090d" stroke-width="6"')+
  P('M185 227 Q286 215 391 219 L458 229 L571 235 L458 241 L391 251 Q286 255 185 243Z','url(#carbon)','stroke="#28343e" stroke-width="1.3"')+
  P('M205 231 Q314 222 399 225 L450 234 L399 243 Q314 248 205 239Z','url(#reflection)','opacity=".65"')+
  P('M552 227 L'+f(noseTip-15)+' '+f(235-halfNose*.55)+' L'+f(noseTip+5)+' 235 L'+f(noseTip-15)+' '+f(235+halfNose*.55)+' L552 243Z',p,'stroke="#101923" stroke-width="3"')+
  P('M576 235 L'+f(noseTip-5)+' 235','none','stroke="'+stripe+'" stroke-opacity=".84" stroke-width="5"')+
  P('M258 230 Q327 219 405 231 M258 240 Q327 251 405 239','none','stroke="'+p+'" stroke-width="3" opacity=".85"');
 const rearWing=
   P('M72 '+f(rearWingTip)+'L145 '+f(rearWingTip+8)+'Q157 235 145 '+f(470-rearWingTip-8)+'L72 '+f(470-rearWingTip)+'Z','url(#wingPaint)','stroke="#03070b" stroke-width="5"')+
   P('M87 '+f(rearWingTip+14)+'L133 '+f(rearWingTip+24)+'L133 '+f(446-rearWingTip)+'L87 '+f(456-rearWingTip)+'Z',p,'opacity=".83"')+
   P('M89 '+f(rearWingTip+25)+'V'+f(445-rearWingTip)+' M99 '+f(rearWingTip+31)+'V'+f(439-rearWingTip),'none','stroke="'+stripe+'" stroke-width="3" opacity=".68"')+
   P('M73 '+f(rearWingTip+5)+'L147 '+f(rearWingTip+15)+' M73 '+f(465-rearWingTip)+'L147 '+f(455-rearWingTip),'none','stroke="#e4eff7" stroke-opacity=".28" stroke-width="2.7"');
 // A wing made of three CURVED horizontal elements and two endplates,
 // not a huge opaque rectangular platform behind the nose.
 const wingTop=
   P('M839 165 Q885 '+f(frontWingTip+18)+' 955 '+f(frontWingTip+15)+' L962 '+f(frontWingTip+40)+' Q909 '+f(frontWingTip+41)+' 853 200Z','url(#wingPaint)','stroke="#060a11" stroke-width="3"')+
   P('M844 176 Q893 '+f(frontWingTip+26)+' 955 '+f(frontWingTip+24)+' L958 '+f(frontWingTip+38)+' Q894 '+f(frontWingTip+44)+' 848 203Z',p,'opacity=".88"')+
   P('M846 191 Q899 '+f(frontWingTip+51)+' 953 '+f(frontWingTip+46)+' L952 '+f(frontWingTip+60)+' Q904 '+f(frontWingTip+68)+' 851 209Z','url(#carbon)','stroke="#879eab" stroke-opacity=".45" stroke-width="1.4"')+
   P('M853 206 Q901 '+f(frontWingTip+76)+' 944 '+f(frontWingTip+74)+' L943 '+f(frontWingTip+88)+' Q891 224 859 220Z',s,'stroke="#18222e" stroke-width="2"')+
   P('M946 '+f(frontWingTip+12)+'L968 '+f(frontWingTip+8)+'L966 '+f(frontWingTip+100)+'L953 '+f(frontWingTip+100)+'Z',wing,'stroke="'+a+'" stroke-width="2.4"')+
   P('M878 191 Q920 164 952 172','none','stroke="'+stripe+'" stroke-width="4" opacity=".85"');
 const suspFront=M(
  P('M661 231 L'+f(frontAxle-8)+' 118 L'+f(frontAxle+8)+' 134 L709 236Z','url(#carbon)','stroke="#222e38" stroke-width="2"')+
  P('M689 228 L'+f(frontAxle+20)+' 154 L'+f(frontAxle+8)+' 142 L743 228Z','#17222c','stroke="#647482" stroke-width="1.5"')+
  P('M670 225 L765 143','none','stroke="#7b8e9c" stroke-opacity=".6" stroke-width="3"')+
  P('M711 227 L770 167','none','stroke="#060b0e" stroke-width="7"')+
  P('M717 227 L771 168','none','stroke="#4f5d66" stroke-width="2"')
 );
 const suspRear=M(
  P('M279 222 L199 145 L210 139 L333 216Z','url(#carbon)','stroke="#465560" stroke-width="2"')+
  P('M304 222 L231 148 L224 144 L331 220Z','#080e15','stroke="#788a94" stroke-width="1.2"')+
  P('M288 220 L203 156','none','stroke="#7b8c99" stroke-width="3" opacity=".63"')
 );
 const cockpitTop=207-(cockpit-1)*14;
 const cockpitBottom=470-cockpitTop;
 const cockpitShape=
   P('M437 '+f(cockpitTop)+'Q470 '+f(cockpitTop-30)+' 506 '+f(cockpitTop-23)+
    'Q561 '+f(cockpitTop-18)+' 587 235 Q561 '+f(cockpitBottom+18)+
    ' 506 '+f(cockpitBottom+23)+' Q470 '+f(cockpitBottom+30)+' 437 '+f(cockpitBottom)+'Z',
    '#070d14','stroke="#6f828e" stroke-width="3"')+
   P('M451 216 Q471 195 507 201 Q549 208 568 235 Q549 262 507 269 Q471 275 451 254Z','#02070d','stroke="'+p+'" stroke-width="2.5"')+
   P('M472 215 Q492 204 515 214 L543 233 Q513 250 472 255Z','#101922','stroke="#526371" stroke-width="2"')+
   // Visible F1 halo over the cockpit: side arches, central stem, headrest.
   P('M444 205 Q485 171 532 199 Q559 211 577 235 Q559 259 532 271 Q485 299 444 265','none',
     'stroke="#050a0f" stroke-width="16" stroke-linecap="round"')+
   P('M444 203 Q488 177 529 199 Q555 211 572 234','none','stroke="'+surfLine+'" stroke-width="3" stroke-opacity=".49"')+
   P('M490 204 L506 263','none','stroke="#0b1119" stroke-width="10"')+
   P('M492 205 L502 257','none','stroke="#727f88" stroke-opacity=".52" stroke-width="2.4"')+
   '<ellipse cx="510" cy="235" rx="17" ry="19" fill="'+halo+'" stroke="#02060a" stroke-width="5"/>'+
   P('M502 231h15v7h-15Z',stripe,'opacity=".84"')+
   P('M463 226L479 225L479 245L463 246Z','#17202b','stroke="#596876" stroke-width="1.4"')+
   P('M468 230H474M468 234H475M468 238H474','none','stroke="'+a+'" stroke-width="1.4"')+
   M(P('M449 210 L421 177 L396 174','none','stroke="#121b22" stroke-width="6"')+
     P('M394 166h28v10h-28Z','#050b11','stroke="'+p+'" stroke-width="2"'));
 const decor={chevron:'M329 202 L399 236 L329 268',center:'M226 235H690',
   split:'M255 231H685M255 239H685',double:'M302 216L695 225M302 254L695 245',
   bars:'M344 181L360 278M378 177L395 288',flank:'M291 191Q409 163 556 205M291 279Q409 307 556 265'};
 const dec=P(decor[l.pattern]||'M315 193Q477 159 614 219M315 277Q477 311 614 251','none',
    'stroke="'+stripe+'" stroke-width="5" stroke-opacity=".83"');
 const svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 470" width="1000" height="470"',
  ' role="img" data-apex-team="'+id+'" data-apex-model="'+model+'" data-apex-chassis="'+chassis+'"',
  ' aria-label="Monoplaza de Fórmula 1 2026, '+id+' '+model+'">',
  '<defs>',
  '<linearGradient id="tyre" x1="0" y1="0" x2="1" y2=".24"><stop stop-color="#050709"/><stop offset=".2" stop-color="#303337"/><stop offset=".47" stop-color="#171b1f"/><stop offset=".76" stop-color="#252a2f"/><stop offset="1" stop-color="#030506"/></linearGradient>',
  '<linearGradient id="carbon" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="#3b454c"/><stop offset=".24" stop-color="'+carbon+'"/><stop offset=".66" stop-color="#060a0e"/><stop offset="1" stop-color="#48525b"/></linearGradient>',
  '<linearGradient id="darkCarbon" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#26313b"/><stop offset=".26" stop-color="#060b0f"/><stop offset=".68" stop-color="'+carbon+'"/><stop offset="1" stop-color="#202b35"/></linearGradient>',
  '<linearGradient id="wingPaint" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="#64737e"/><stop offset=".14" stop-color="'+wing+'"/><stop offset=".57" stop-color="#070b10"/><stop offset="1" stop-color="#2a333b"/></linearGradient>',
  '<linearGradient id="floorGlow" x1=".3" y1="0" x2="1" y2="1"><stop stop-color="#0d1318"/><stop offset=".33" stop-color="#343e47"/><stop offset=".62" stop-color="#05090e"/><stop offset="1" stop-color="#17212a"/></linearGradient>',
  '<linearGradient id="bodyPaint" x1=".12" y1="0" x2=".8" y2="1"><stop stop-color="'+trim+'" stop-opacity=".38"/><stop offset=".19" stop-color="'+p+'"/><stop offset=".55" stop-color="'+p+'"/><stop offset=".83" stop-color="'+s+'"/><stop offset="1" stop-color="'+p+'"/></linearGradient>',
  '<linearGradient id="podPaint" x1=".12" y1=".1" x2="1" y2=".85"><stop stop-color="'+p+'"/><stop offset=".18" stop-color="'+surface+'"/><stop offset=".5" stop-color="'+s+'"/><stop offset=".78" stop-color="'+p+'"/><stop offset="1" stop-color="'+p+'"/></linearGradient>',
  '<linearGradient id="reflection" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+surfLine+'" stop-opacity=".35"/><stop offset=".28" stop-color="'+p+'" stop-opacity=".32"/><stop offset=".68" stop-color="#ffffff" stop-opacity=".03"/><stop offset="1" stop-color="'+surfLine+'" stop-opacity=".13"/></linearGradient>',
  '<pattern id="weave" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0l7 7M-2 2l7 7" stroke="#a9bdc7" stroke-opacity=".12" stroke-width=".65"/></pattern>',
  '<filter id="shadow" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>',
  '</defs>',
  // The actual outline is a sequence of aerodynamic surfaces, NOT a rectangle.
  '<ellipse cx="510" cy="253" rx="440" ry="124" fill="#000" opacity=".42" filter="url(#shadow)"/>',
  rearWing,
  P('M150 221 Q232 204 286 168 Q328 146 432 151 L570 166 Q656 188 724 213 L819 225 L819 245 L724 257 Q656 282 570 304 L432 319 Q328 324 286 302 Q232 266 150 249Z',
    'url(#floorGlow)','stroke="#03090e" stroke-width="7"'),
  P('M287 172 Q355 141 428 152 L575 169 Q651 189 708 219 L646 220 L541 191 L398 171Z','url(#weave)','opacity=".62"'),
  M(P('M281 180 Q390 142 539 172 L663 214 L690 231 L572 210 Q394 185 281 204Z','url(#carbon)','opacity=".9"')),
  '<g>'+wingTop+'</g><g transform="translate(0 470) scale(1 -1)">'+wingTop+'</g>',
  suspRear,suspFront,upper,
  // Head-heavy conventional car shape: tapering nose, pronounced rear engine.
  mainBody,dec,
  // Refined diffuser/floor fins before the wheel layer.
  M(P('M258 205 L347 179 L384 197 M271 221 L353 204','none','stroke="#6d7c86" stroke-width="3" opacity=".66"')),
  // The four tyres conceal suspension endpoints in a genuine overhead view.
  tire(177,74),tire(177,470-74-wheelH),tire(748,65),tire(748,470-65-wheelH),
  cockpitShape,
  // The engine intake behind helmet and thin mirrors are integrated.
  P('M420 216 L444 206 L452 220 L444 250 L420 255 L410 236Z','#060b11','stroke="'+p+'" stroke-width="4"'),
  P('M424 221L438 225L438 243L424 248Z','url(#weave)','stroke="#7a8c98" stroke-width="1"'),
  // Team identification kept readable when displayed in only half the menu.
  '<text x="673" y="226" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="'+trim+'" text-anchor="middle">'+model+'</text>',
  '<text x="337" y="235" font-family="Arial,sans-serif" font-size="15" font-weight="900" fill="'+trim+'" letter-spacing="1.2" text-anchor="middle">'+chassis+'</text>',
  P('M606 226L617 235L606 244','none','stroke="'+a+'" stroke-width="4.3"'),
  '</svg>'].join('');
 return svg;
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
