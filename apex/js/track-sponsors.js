/* Trackside SVG logos: shared, pre-triangulated once; no image decoding or
 * texture upload in the race loop. Render through the existing world batch. */
(function(global){
'use strict';
const data=global.ApexSponsorVectorData||{};
for(const logo of Object.values(data))for(const layer of logo.layers)layer.triangles=new Float32Array(layer.triangles);
const styles=Object.freeze([
 Object.freeze({brand:'TEAM EQUIPALIA',bg:'#00673e',fg:'#ffffff',logo:'team-equipalia'}),
 Object.freeze({brand:'SCT TELECOM',bg:'#175da5',fg:'#ffffff',logo:'sct'}),
 Object.freeze({brand:'MDTEL',bg:'#f4f6f8',fg:'#050505',logo:'mdtel'})
]);
const colors=new Map();
function colorKey(color){
 const key=String(color||'').toLowerCase();if(colors.has(key))return colors.get(key);
 let h=key.replace(/^#/,'');if(h.length===3)h=h.split('').map(c=>c+c).join('');let result=null;
 if(/^[\da-f]{6}$/.test(h)){
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  if(Math.min(r,g,b)>210)result='mdtel';
  else if(g>r*1.18&&g>b*1.10)result='team-equipalia';
  else if(b>r*1.25&&b>g*1.10)result='sct';
 }
 if(colors.size<64)colors.set(key,result);return result;
}
let frame=-1;const seen=new Set();
const stats={frames:0,logos:0,triangles:0,culled:0,cpuMs:0,maxLogos:0,maxTriangles:0,compiled:3};
function beginFrame(id){if(id===frame)return;frame=id;seen.clear();stats.frames++;stats.logos=0;stats.triangles=0;stats.culled=0;stats.cpuMs=0;}
function claim(id,key,height,mobile){
 const logo=data[key];if(!logo||height<7||seen.has(id)){stats.culled++;return null;}
 const fine=height>=100&&!mobile,layers=logo.layers.filter(l=>!l.fine||fine),triangles=layers.reduce((sum,l)=>sum+l.triangles.length/6,0);
 if(stats.logos>=(mobile?6:12)||stats.triangles+triangles>(mobile?2600:5200)){stats.culled++;return null;}
 seen.add(id);stats.logos++;stats.triangles+=triangles;
 stats.maxLogos=Math.max(stats.maxLogos,stats.logos);stats.maxTriangles=Math.max(stats.maxTriangles,stats.triangles);
 return layers;
}
global.ApexTrackSponsors=Object.freeze({styles,data,colorKey,beginFrame,claim,stats,spacingM:24,equipaliaSpacingM:8});
})(window);
