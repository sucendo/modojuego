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
function markup(profile){
 if(!profile?.geometry||!profile?.livery)return null;
 const g=profile.geometry,l=profile.livery;
 const p=hex(l.primary,'#f58a00'),s=hex(l.secondary,'#161a20'),
  a=hex(l.accent,'#3ccef8'),stripe=hex(l.stripe,a),
  carbon=hex(l.carbon,'#080d13'),wing=hex(l.wing,'#10161e'),trim=hex(l.trim,'#f5f8fb');
 const finish=['silver','carbon','white'].includes(l.finish)?l.finish:'paint';
 const surface=finish==='silver'?'#b4c1cc':finish==='white'?'#f2f6fa':finish==='carbon'?'#101920':s;
 // Coordinate frame: nose points right; all mirrored parts share y=235.
 // Wheel footprints are longer along the chassis than across it.
 const nw=16*clamp(g.noseWidth,.9,1.1),tip=927+(clamp(g.noseLen,.9,1.1)-1)*20,
  pod=clamp(g.sidepodWidth,.9,1.1),fy=75-(clamp(g.frontWing,.94,1.06)-1)*60,
  ry=116-(clamp(g.rearWing,.94,1.06)-1)*60,
  ws=clamp(g.wheelScale,.94,1.06),cw=clamp(g.cockpitWidth,.94,1.06);
 const id=safe(profile.teamKey),model=safe(profile.model),chassis=safe(profile.chassis);
 const brand=safe(String(profile.teamName||id).split(/\s+/)[0]).toUpperCase();
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
 const rearWing='<g class="apex-car-rear-wing">'+
  P('M79 '+ry+'Q106 '+(ry-3)+' 145 '+(ry+4)+'L145 '+(466-ry)+'Q106 '+(473-ry)+' 79 '+(470-ry)+'Z','url(#wing)','stroke="#04080c" stroke-width="3"')+
  P('M87 '+(ry+8)+'V'+(462-ry)+'H117V'+(ry+8)+'Z','url(#panel)')+
  P('M122 '+(ry+8)+'V'+(462-ry),'none','stroke="'+p+'" stroke-width="8"')+
  P('M106 '+(ry+6)+'V'+(464-ry)+'M136 '+(ry+8)+'V'+(462-ry),'none','stroke="#a4b1b9" stroke-opacity=".45" stroke-width="1.3"')+
  P('M143 220H191M143 250H191','none','stroke="#10191e" stroke-width="5"')+
  '<text transform="translate(109 235) rotate(-90)" font-family="Arial,sans-serif" font-size="19" font-weight="800" text-anchor="middle" fill="'+trim+'">'+brand+'</text>'+
  M(P('M77 '+(ry-3)+'H149V'+(ry+4)+'H77Z',carbon,'stroke="'+stripe+'" stroke-width="1.5"'))+'</g>';
 // Distinct transverse wing elements, swept back at the centre.
 const frontHalf='<g class="apex-car-front-wing">'+
  P('M850 218Q878 160 862 '+(fy+8)+'L886 '+fy+'Q900 155 934 225Z','url(#wing)','stroke="#080d11" stroke-width="2"')+
  P('M869 220Q897 157 883 '+(fy+6)+'L902 '+(fy+3)+'Q914 158 944 226Z','url(#panel)','stroke="#080d11" stroke-width="2"')+
  P('M895 222Q917 156 906 '+(fy+5)+'L921 '+(fy+7)+'Q936 166 952 230Z','url(#carbon)','stroke="#080d11" stroke-width="2"')+
  P('M922 227Q941 162 925 '+(fy+9)+'L936 '+(fy+12)+'Q954 166 961 231Z','url(#paint)','stroke="#080d11" stroke-width="2"')+
  P('M860 213Q890 153 878 '+(fy+12)+'M888 216Q911 154 898 '+(fy+10)+'M911 220Q933 161 919 '+(fy+13),'none','stroke="#cad7de" stroke-opacity=".32" stroke-width="1.4"')+
  P('M861 '+(fy-3)+'L938 '+(fy+2)+'L943 '+(fy+10)+'L862 '+(fy+5)+'Z',wing,'stroke="'+p+'" stroke-width="2"')+
  P('M892 157L909 191','none','stroke="'+stripe+'" stroke-width="2.2"')+'</g>';
 // Broad, continuous sidepod skins measured against the supplied overhead
 // references. Their outer shoulder wraps the cockpit, with an undercut below;
 // no detached decorative rings around a thin central fuselage.
 const edge=119-(pod-1)*25;
 const podSkin='M264 216C330 205 346 167 415 '+(edge+15)+'C484 '+(edge-8)+' 573 '+(edge-9)+' 620 '+(edge+10)+'Q646 '+(edge+20)+' 648 160L640 195L618 219Q536 213 462 211Q366 223 264 224Z';
 const sidepods=M('<g class="apex-car-sidepod">'+
  P(podSkin,'url(#paint)','stroke="#0a1015" stroke-width="2"')+
  P('M285 216C369 192 381 '+(edge+19)+' 458 '+(edge+8)+'Q563 '+(edge-7)+' 620 '+(edge+16)+'L636 166L620 199Q554 173 495 183Q389 218 285 220Z','url(#panel)')+
  P(podSkin,'url(#volume)')+
  P('M305 211C392 182 416 '+(edge+15)+' 490 '+(edge+12)+'Q566 '+(edge+6)+' 613 '+(edge+24),'none','stroke="'+stripe+'" stroke-width="4" stroke-linecap="round"')+
  P('M296 216C386 192 413 164 480 155Q552 145 607 167L621 188Q551 166 498 177Q401 204 296 219Z','#020609','opacity=".64"')+
  P('M332 196C414 157 449 144 503 139Q567 133 610 152','none','stroke="#fff" stroke-opacity=".23" stroke-width="1.6"')+
  // Inlet lip and horizontal dark opening at the forward end of each pod.
  P('M596 150Q620 145 638 157L641 172Q616 164 594 168Z','#020609','stroke="#60717c" stroke-width="1"')+
  P('M596 148Q620 143 638 156','none','stroke="'+p+'" stroke-width="4"')+
  P('M523 132L532 137M533 131L542 136M543 131L552 136M553 132L562 137','none','stroke="#020609" stroke-width="2"')+'</g>');
 const bodyShape='M173 217L272 214C329 211 362 194 402 182Q448 169 487 177L531 181Q588 184 635 202Q664 207 710 210L'+(tip-8)+' '+(235-nw)+'Q'+(tip+8)+' 235 '+(tip-8)+' '+(235+nw)+'L710 260Q664 263 635 268Q588 286 531 289L487 293Q448 301 402 288C362 276 329 259 272 256L173 253Z';
 const body=P(bodyShape,'url(#paint)','stroke="#111820" stroke-width="2"')+
  P(bodyShape,'url(#volume)')+
  // Central engine cover grows out of the rear bodywork instead of a thin spine.
  P('M192 224L302 220Q370 204 421 190Q454 181 479 190L498 212L488 258L479 280Q454 289 421 280Q370 266 302 250L192 246Z','url(#panel)')+
  P('M213 226L306 222Q392 199 445 197L474 209L478 261L445 273Q392 271 306 248L213 244Z','url(#carbon)')+
  P('M218 227Q331 227 442 204L468 213','none','stroke="#c0cbd1" stroke-opacity=".34" stroke-width="2"')+
  P('M250 219Q337 210 419 184M250 251Q337 260 419 286','none','stroke="'+stripe+'" stroke-width="2.5"')+
  // Smooth, tapering monocoque shoulders continue all the way to the nose tip.
  P('M643 215Q739 218 '+(tip-10)+' 228Q'+(tip+1)+' 235 '+(tip-10)+' 242Q739 252 643 255Z','url(#light)')+
  P('M664 213L'+(tip-28)+' 225','none','stroke="#fff" stroke-opacity=".32" stroke-width="1.4"')+
  P('M845 220L872 222L874 248L845 250Z',stripe,'opacity=".9"')+
  '<text x="860" y="241" font-family="Arial,sans-serif" font-size="17" font-weight="900" text-anchor="middle" fill="'+trim+'">26</text>';

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
  P('M490 199Q571 177 626 235Q571 293 490 271','none','stroke="#050a0d" stroke-width="11" stroke-linecap="round"')+
  P('M493 197Q568 181 619 227','none','stroke="#c2cdd4" stroke-opacity=".57" stroke-width="2"')+
  P('M496 272Q568 286 619 243','none','stroke="#4c5a63" stroke-opacity=".6" stroke-width="1.6"')+
  P('M620 235H649','none','stroke="#0a1117" stroke-width="8"')+
  P('M620 232H647','none','stroke="#a3afb6" stroke-opacity=".5" stroke-width="1.5"')+'</g>';
 const mirrors=M(P('M621 205L623 167','none','stroke="#0c141a" stroke-width="4"')+P('M609 156H636V166H609Z','url(#panel)','stroke="'+p+'" stroke-width="2"'));
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 470" width="1000" height="470" role="img" data-apex-silhouette="f1-overhead-v6" data-apex-team="'+id+'" data-apex-model="'+model+'" data-apex-chassis="'+chassis+'" aria-label="Vista cenital de monoplaza '+id+' '+model+'">'+defs+
  floor+rearWing+M(frontHalf)+suspension+sidepods+body+
  tire(221,104,true)+tire(221,366,true)+tire(785,101)+tire(785,369)+cockpit+mirrors+
  P('M461 219L483 210L491 218V252L483 260L461 251Z','url(#carbon)','stroke="'+p+'" stroke-width="2"')+
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
 const input={...blueprint,teamName:t.name,livery:l};
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
