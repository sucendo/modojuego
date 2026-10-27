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
 const nw=15*clamp(g.noseWidth,.9,1.1),tip=927+(clamp(g.noseLen,.9,1.1)-1)*20,
  pod=clamp(g.sidepodWidth,.9,1.1),fy=75-(clamp(g.frontWing,.94,1.06)-1)*60,
  ry=116-(clamp(g.rearWing,.94,1.06)-1)*60,
  ws=clamp(g.wheelScale,.94,1.06),cw=clamp(g.cockpitWidth,.94,1.06);
 const id=safe(profile.teamKey),model=safe(profile.model),chassis=safe(profile.chassis);
 const P=(d,fill,extra='')=>'<path d="'+d+'" fill="'+fill+'" '+extra+'/>';
 const M=d=>d+'<g transform="translate(0 470) scale(1 -1)">'+d+'</g>';
 const tire=(cx,cy,rear=false)=>{
  const w=(rear?124:118)*ws,h=(rear?85:77)*ws;
  return '<g class="apex-car-tyre">'+
   '<rect x="'+(cx-w/2)+'" y="'+(cy-h/2)+'" width="'+w+'" height="'+h+'" rx="18" fill="url(#tyre)" stroke="#030507" stroke-width="4"/>'+
   P('M'+(cx-w/2+14)+' '+(cy-h/2+5)+'H'+(cx+w/2-14)+'M'+(cx-w/2+14)+' '+(cy+h/2-5)+'H'+(cx+w/2-14),'none','stroke="#a5afb8" stroke-opacity=".19" stroke-width="2"')+
   P('M'+(cx-31)+' '+(cy-h/2+3)+'h62M'+(cx-31)+' '+(cy+h/2-3)+'h62','none','stroke="#ca3438" stroke-opacity=".7" stroke-width="1.8"')+'</g>';
 };
 const defs='<defs>'+[
  ['tyre','#06080a','#34383b','#07090b'],
  ['paint',p,p,s],['panel',surface,surface,s],
  ['carbon','#30383e',carbon,'#080c10'],['wing',wing,'#252d32',wing]
 ].map(([id,c1,c2,c3])=>'<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+c1+'"/><stop offset=".45" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c3+'"/></linearGradient>').join('')+
 '<linearGradient id="light"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
 const floor=P('M160 219L283 207L299 117Q421 109 562 122L639 146L667 207L807 223V247L667 263L639 324L562 348Q421 361 299 353L283 263L160 251Z','url(#carbon)','stroke="#080d11" stroke-width="3"');
 const suspension=M(
  P('M695 221L777 117M748 224L805 117M704 225L787 134M274 220L220 128M343 216L233 129M302 228L213 141','none','stroke="#060a0d" stroke-width="7" stroke-linejoin="round"')+
  P('M695 220L777 117M748 223L805 117M274 219L220 128M343 215L233 129','none','stroke="#71808b" stroke-opacity=".55" stroke-width="1.6"'));
 const rearWing='<g class="apex-car-rear-wing">'+
  P('M79 '+ry+'Q106 '+(ry-3)+' 145 '+(ry+4)+'L145 '+(466-ry)+'Q106 '+(473-ry)+' 79 '+(470-ry)+'Z','url(#wing)','stroke="#04080c" stroke-width="3"')+
  P('M87 '+(ry+8)+'V'+(462-ry)+'H117V'+(ry+8)+'Z','url(#panel)')+
  P('M122 '+(ry+8)+'V'+(462-ry),'none','stroke="'+p+'" stroke-width="8"')+
  M(P('M77 '+(ry-3)+'H149V'+(ry+4)+'H77Z',carbon,'stroke="'+stripe+'" stroke-width="1.5"'))+'</g>';
 // Three slender transverse elements, swept back at the centre.
 const frontHalf='<g class="apex-car-front-wing">'+
  P('M879 226Q874 170 871 '+(fy+7)+'L889 '+fy+'Q906 160 938 224Z','url(#wing)','stroke="#080d11" stroke-width="2"')+
  P('M898 226Q894 160 894 '+(fy+6)+'L908 '+(fy+5)+'Q920 162 945 226Z','url(#panel)','stroke="#080d11" stroke-width="2"')+
  P('M920 227Q921 155 914 '+(fy+6)+'L929 '+(fy+9)+'Q943 165 952 230Z','url(#paint)','stroke="#080d11" stroke-width="2"')+
  P('M869 '+(fy-3)+'L930 '+(fy+1)+'L935 '+(fy+9)+'L869 '+(fy+5)+'Z',wing,'stroke="'+stripe+'" stroke-width="1.5"')+'</g>';
 // Sidepods flow from a broad inlet into the narrow gearbox/engine tail.
 const edge=143-(pod-1)*35;
 const sidepods=M('<g class="apex-car-sidepod">'+
  P('M254 218C340 206 376 '+(edge+3)+' 514 '+edge+'Q566 '+(edge-3)+' 615 168L649 208L616 219Q549 176 494 183C403 194 340 221 254 224Z','url(#paint)','stroke="#0a1015" stroke-width="2"')+
  P('M287 214C389 183 428 '+(edge+10)+' 526 '+(edge+10)+'Q573 '+(edge+10)+' 605 174L624 202Q546 176 496 191C405 211 355 218 287 219Z','url(#panel)')+
  P('M302 216C405 198 443 '+(edge+14)+' 528 '+(edge+13)+'Q576 '+(edge+13)+' 600 175','none','stroke="'+stripe+'" stroke-width="4" stroke-linecap="round"')+
  P('M592 172Q617 176 634 196L618 204L592 188Z','#04090c','stroke="#52616b" stroke-width="1"')+
  P('M329 205Q442 156 535 156','none','stroke="#fff" stroke-opacity=".18" stroke-width="2"')+'</g>');
 const body=P('M157 228L286 221Q379 204 461 192Q492 183 528 189L588 201Q644 216 704 217L'+(tip-8)+' '+(235-nw)+'Q'+(tip+8)+' 235 '+(tip-8)+' '+(235+nw)+'L704 253Q644 254 588 269L528 281Q492 287 461 278Q379 266 286 249L157 242Z','url(#paint)','stroke="#111820" stroke-width="2"')+
  P('M188 230L305 227L469 208L494 221L481 248L305 243L188 240Z','url(#panel)')+
  P('M214 234L448 219L473 232L448 247L214 238Z','url(#carbon)')+
  P('M261 228L437 213M261 242L437 257','none','stroke="'+stripe+'" stroke-width="2.5"')+
  P('M657 226L'+(tip-10)+' 229Q'+(tip+1)+' 235 '+(tip-10)+' 241L657 244Z','url(#light)')+
  P('M687 235H'+(tip-25),'none','stroke="'+stripe+'" stroke-width="3"');
 const cockpit='<g class="apex-car-cockpit" transform="translate(550 235) scale(1 '+cw+') translate(-550 -235)">'+
  P('M484 213Q501 202 536 204Q578 203 614 235Q578 267 536 266Q501 268 484 257Z','#02070b','stroke="'+p+'" stroke-width="5"')+
  P('M497 216Q517 211 535 216L541 254Q512 261 497 254Z','#111b22')+
  '<ellipse cx="532" cy="235" rx="16" ry="14" fill="'+p+'" stroke="#05090d" stroke-width="3"/>'+
  P('M537 223L541 247','none','stroke="'+stripe+'" stroke-width="4"')+
  P('M558 219L564 251','none','stroke="#83909a" stroke-width="4"')+
  // Halo U and its central forward support follow the longitudinal axis.
  P('M493 208Q568 191 613 235Q568 279 493 262','none','stroke="#060b10" stroke-width="9" stroke-linecap="round"')+
  P('M499 207Q566 196 605 229','none','stroke="#a9b5be" stroke-opacity=".5" stroke-width="1.8"')+
  P('M606 235H636','none','stroke="#0a1117" stroke-width="7"')+
  P('M606 233H635','none','stroke="#9da9b1" stroke-opacity=".5" stroke-width="1.3"')+'</g>';
 const mirrors=M(P('M605 208L600 184','none','stroke="#0c141a" stroke-width="4"')+P('M588 174H612V183H588Z','url(#panel)','stroke="'+p+'" stroke-width="2"'));
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 470" width="1000" height="470" role="img" data-apex-silhouette="f1-overhead-v4" data-apex-team="'+id+'" data-apex-model="'+model+'" data-apex-chassis="'+chassis+'" aria-label="Vista cenital de monoplaza '+id+' '+model+'">'+defs+
  floor+rearWing+M(frontHalf)+suspension+sidepods+body+
  tire(221,104,true)+tire(221,366,true)+tire(785,101)+tire(785,369)+cockpit+mirrors+
  P('M469 222L488 219V251L469 248Z','url(#carbon)','stroke="'+p+'" stroke-width="2"')+
  '<text x="748" y="239" font-family="Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="'+trim+'">'+model+'</text>'+
  '<text x="358" y="239" font-family="Arial,sans-serif" font-size="10" letter-spacing="1" text-anchor="middle" fill="'+trim+'">'+chassis+'</text></svg>';
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
