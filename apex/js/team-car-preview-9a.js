/* APEX 26 · 9A · Vista del monoplaza derivada del blueprint real.
 * Sustituye las fotografías genéricas del prototipo por una vista técnica SVG.
 * Misma clave de equipo, modelo A26/VXR/NOVA, dimensiones y librea que el motor.
 * No crea modelos deportivos paralelos, no necesita WebGL ni carga binarios extra.
 */
(function(global){
'use strict';
const get=id=>document.getElementById(id);
const cache=new Map();
const color=(s,f)=>/^#[0-9a-f]{6}$/i.test(String(s||''))?String(s).toLowerCase():f;
const safeId=(s)=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32);
const size=(n,f=1)=>Number.isFinite(Number(n))?Math.max(.78,Math.min(1.25,Number(n))):f;
const fmt=n=>Number(n).toFixed(2);
function markup(profile){
 if(!profile||!profile.geometry||!profile.livery)return null;
 const l=profile.livery,g=profile.geometry;
 const primary=color(l.primary,'#526578'),accent=color(l.accent,'#d5eafa');
 const side=color(l.secondary,'#17212c'),stripe=color(l.stripe,accent),trim=color(l.trim,'#e2e9ef');
 const carbon=color(l.carbon,'#0b1017'),wing=color(l.wing,'#10151b');
 const halo=color(l.halo,primary),wheel=color(l.wheel,accent);
 const nose=size(g.noseWidth),noseL=size(g.noseLen),sidepods=size(g.sidepodWidth),wingFront=size(g.frontWing),wingRear=size(g.rearWing);
 const tire=size(g.wheelScale),engine=size(g.engineHeight),haloWidth=size(g.haloWidth);
 const frontWingHalf=fmt(89*wingFront),rearWingHalf=fmt(75*wingRear);
 const frontTyreHalf=fmt(30*tire),rearTyreHalf=fmt(35*tire);
 const podUpper=fmt(140-47*sidepods),podLower=fmt(140+47*sidepods);
 const frontNose=fmt(555+19*(noseL-1)*10), noseHalf=fmt(14*nose), tip=fmt(556+25*(noseL-1)*10);
 const cockpitHalf=fmt(30*haloWidth),centerY=140;
 const team=safeId(profile.teamKey),model=safeId(profile.model),chassis=safeId(profile.chassis);
 // El dibujo es una vista cenital simplificada y legible del MISMO blueprint,
 // no una fotografía de otro monoplaza ni una promesa de render 3D literal.
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 280" width="680" height="280" role="img"'+
 ' data-apex-team="'+team+'" data-apex-model="'+model+'" data-apex-chassis="'+chassis+'"'+
 ' aria-label="Vista técnica del monoplaza '+team+' '+model+'">'+
 '<defs>'+
 '<linearGradient id="apexCarMain" x1="0" y1=".12" x2=".8" y2="1">'+
 '<stop offset="0" stop-color="'+trim+'" stop-opacity=".46"/>'+
 '<stop offset=".24" stop-color="'+primary+'"/>'+
 '<stop offset=".75" stop-color="'+primary+'"/>'+
 '<stop offset="1" stop-color="'+side+'"/></linearGradient>'+
 '<linearGradient id="apexCarFibre" x1="0" y1="0" x2="0" y2="1">'+
 '<stop offset="0" stop-color="'+wing+'"/>'+
 '<stop offset=".48" stop-color="'+carbon+'"/>'+
 '<stop offset="1" stop-color="#03060a"/></linearGradient>'+
 '<linearGradient id="apexWheel" x1="0" y1="0" x2="1" y2="0">'+
 '<stop offset="0" stop-color="#040608"/><stop offset=".5" stop-color="#262b30"/>'+
 '<stop offset="1" stop-color="#040608"/></linearGradient>'+
 '</defs>'+
 // Suelo/sombra suave, no una segunda fotografía de coche.
 '<ellipse cx="337" cy="157" rx="268" ry="94" fill="#02070d" opacity=".30"/>'+
 // Alerón trasero, geometría proporcional a rearWing.
 '<rect x="76" y="'+fmt(centerY-Number(rearWingHalf))+'" width="66" height="'+fmt(2*Number(rearWingHalf))+'" rx="7" fill="url(#apexCarFibre)" stroke="'+trim+'" stroke-opacity=".27" stroke-width="2"/>'+
 '<path d="M86 '+fmt(140-Number(rearWingHalf)+10)+'V'+fmt(140+Number(rearWingHalf)-10)+
 ' M134 '+fmt(140-Number(rearWingHalf)+10)+'V'+fmt(140+Number(rearWingHalf)-10)+'" stroke="'+accent+'" stroke-width="5" opacity=".83"/>'+
 // Neumáticos traseros: guardan escala del modelo.
 '<rect x="154" y="'+fmt(140-65*tire-Number(rearTyreHalf))+'" width="77" height="'+fmt(2*Number(rearTyreHalf))+'" rx="14" fill="url(#apexWheel)" stroke="#050a0e" stroke-width="5"/>'+
 '<rect x="154" y="'+fmt(140+65*tire-Number(rearTyreHalf))+'" width="77" height="'+fmt(2*Number(rearTyreHalf))+'" rx="14" fill="url(#apexWheel)" stroke="#050a0e" stroke-width="5"/>'+
 '<path d="M180 '+fmt(140-65*tire)+'h32M180 '+fmt(140+65*tire)+'h32" stroke="'+wheel+'" stroke-width="4" opacity=".65"/>'+
 // Suspensión y difusor.
 '<path d="M121 115L199 90M121 165L199 190M206 140L176 80M206 140L176 200" stroke="'+wing+'" stroke-width="9"/>'+
 '<path d="M127 115H196V165H127Z" fill="'+carbon+'"/>'+
 // Monocasco, cubierta y tapa motor: distintas proporciones de motor y carrocería.
 '<path d="M122 116Q152 106 208 103L267 '+podUpper+
 ' Q332 '+fmt(140-50*engine)+' 402 109 L'+frontNose+' '+fmt(140-Number(noseHalf))+
 'L'+tip+' 140L'+frontNose+' '+fmt(140+Number(noseHalf))+
 ' L402 171Q332 '+fmt(140+50*engine)+' 267 '+podLower+
 ' L208 177Q152 174 122 164Z" fill="url(#apexCarMain)" stroke="'+carbon+'" stroke-width="5" stroke-linejoin="round"/>'+
 // Sidepods y tomas: proceden de sidepodWidth.
 '<path d="M260 '+podUpper+' Q322 '+fmt(140-58*sidepods)+' 366 '+fmt(140-46*sidepods)+
 ' L390 112L355 123L300 130L260 140Z" fill="'+side+'" stroke="'+trim+'" stroke-opacity=".21" stroke-width="2"/>'+
 '<path d="M260 '+podLower+' Q322 '+fmt(140+58*sidepods)+' 366 '+fmt(140+46*sidepods)+
 ' L390 168L355 157L300 150L260 140Z" fill="'+side+'" stroke="'+trim+'" stroke-opacity=".21" stroke-width="2"/>'+
 // Librea: colores y motivo salen del mismo teamCarVisualBlueprint.
 (l.pattern==='chevron'?
 '<path d="M249 103L315 140L249 177" stroke="'+stripe+'" stroke-width="16" fill="none" stroke-linejoin="round"/>':
 l.pattern==='split'?
 '<path d="M250 141L461 141" stroke="'+stripe+'" stroke-width="23" fill="none"/>':
 l.pattern==='center'?
 '<path d="M193 140H526" stroke="'+stripe+'" stroke-width="14" fill="none"/>':
 l.pattern==='bars'?
 '<path d="M275 102L305 178M311 100L343 174" stroke="'+stripe+'" stroke-width="11"/>':
 l.pattern==='double'?
 '<path d="M200 122L534 130M200 158L534 150" stroke="'+stripe+'" stroke-width="8" fill="none"/>':
 l.pattern==='sweep'?
 '<path d="M185 124Q282 90 433 132" stroke="'+stripe+'" stroke-width="12" fill="none"/>':
 l.pattern==='flank'?
 '<path d="M224 108Q315 85 397 114M224 172Q315 195 397 166" stroke="'+stripe+'" stroke-width="9" fill="none"/>':
 '<path d="M226 140Q365 127 493 140" stroke="'+stripe+'" stroke-width="10" fill="none"/>')+
 // Cockpit/halo y airbox.
 '<path d="M286 '+fmt(140-Number(cockpitHalf))+'Q306 '+fmt(140-42*haloWidth)+
 ' 337 '+fmt(140-Number(cockpitHalf))+'Q368 119 381 140Q368 161 337 '+fmt(140+Number(cockpitHalf))+
 'Q306 '+fmt(140+42*haloWidth)+' 286 '+fmt(140+Number(cockpitHalf))+'Z" fill="#080e15" stroke="'+trim+'" stroke-opacity=".50" stroke-width="4"/>'+
 '<ellipse cx="328" cy="140" rx="22" ry="25" fill="'+halo+'" stroke="'+carbon+'" stroke-width="5"/>'+
 '<path d="M301 115Q342 105 373 133M301 165Q342 175 373 147" stroke="'+carbon+'" stroke-width="8" fill="none"/>'+
 '<path d="M336 123V157" stroke="'+carbon+'" stroke-width="8"/>'+
 '<path d="M405 131L535 '+fmt(140-Number(noseHalf))+'L'+tip+' 140L535 '+fmt(140+Number(noseHalf))+'L405 149Z" fill="'+primary+'" stroke="'+trim+'" stroke-opacity=".32" stroke-width="2"/>'+
 '<path d="M413 140H'+frontNose+'" stroke="'+stripe+'" stroke-width="6" stroke-linecap="round"/>'+
 // Suspensiones delanteras / neumáticos / alerón ancho real.
 '<path d="M484 140L513 69M484 140L513 211M545 140L510 67M545 140L510 213" stroke="'+carbon+'" stroke-width="8" fill="none"/>'+
 '<rect x="484" y="'+fmt(140-66*tire-Number(frontTyreHalf))+'" width="72" height="'+fmt(2*Number(frontTyreHalf))+'" rx="12" fill="url(#apexWheel)" stroke="#050a0e" stroke-width="5"/>'+
 '<rect x="484" y="'+fmt(140+66*tire-Number(frontTyreHalf))+'" width="72" height="'+fmt(2*Number(frontTyreHalf))+'" rx="12" fill="url(#apexWheel)" stroke="#050a0e" stroke-width="5"/>'+
 '<path d="M508 '+fmt(140-66*tire)+'h32M508 '+fmt(140+66*tire)+'h32" stroke="'+wheel+'" stroke-width="4" opacity=".65"/>'+
 '<path d="M552 '+fmt(140-Number(frontWingHalf))+' H605V'+fmt(140+Number(frontWingHalf))+
 ' H552Z" fill="url(#apexCarFibre)" stroke="'+trim+'" stroke-opacity=".28" stroke-width="2"/>'+
 '<path d="M565 '+fmt(140-Number(frontWingHalf)+7)+'V'+fmt(140+Number(frontWingHalf)-7)+
 ' M595 '+fmt(140-Number(frontWingHalf)+9)+'V'+fmt(140+Number(frontWingHalf)-9)+
 '" stroke="'+accent+'" stroke-width="6" stroke-linecap="round"/>'+
 '<path d="M548 132H616V148H548Z" fill="'+wing+'"/>'+
 // Identidad del modelo/carrocería y número de chasis.
 '<text x="267" y="146" fill="'+trim+'" font-family="Arial,sans-serif" font-size="10" font-weight="900" text-anchor="middle">'+model+'</text>'+
 '<text x="395" y="107" fill="'+trim+'" opacity=".86" font-family="Arial,sans-serif" font-size="10" font-weight="bold">'+chassis+'</text>'+
 '</svg>';
}
function build(teamKey){
 const key=String(teamKey||'');
 const native=global.ApexNativeTeamStudio9A?.get?.(key);
 const blueprint=native?.preview;
 if(!blueprint||blueprint.teamKey!==key)return null;
 const cacheKey=JSON.stringify(blueprint);
 if(cache.has(cacheKey))return cache.get(cacheKey);
 const svg=markup(blueprint);
 if(!svg)return null;
 const result=Object.freeze({key,model:blueprint.model,chassis:blueprint.chassis,
  svg,src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
 cache.set(cacheKey,result);
 return result;
}
function setCar(teamKey){
 const img=get('apexProtoTeamImage');
 if(!img)return false;
 const render=build(teamKey);
 const name=global.ApexNativeTeamStudio9A?.get?.(teamKey)?.name||'Escudería';
 if(!render){
  img.removeAttribute('src');
  img.alt='Vista del monoplaza no disponible para '+name;
  img.dataset.apexTeamKey='';
  img.dataset.apexModel='';
  img.dataset.apexPreview='unavailable';
  img.hidden=true;return false;
 }
 img.hidden=false;
 img.alt='Vista técnica del monoplaza de '+name+' ('+render.model+' · '+render.chassis+')';
 img.dataset.apexTeamKey=render.key;
 img.dataset.apexModel=render.model;
 img.dataset.apexChassis=render.chassis;
 img.dataset.apexPreview='native-blueprint';
 if(img.src!==render.src)img.src=render.src;
 return true;
}
global.ApexTeamCarPreview9A=Object.freeze({build,setCar,markup});
})(window);
