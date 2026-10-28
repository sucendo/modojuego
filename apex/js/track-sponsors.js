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
const stats={frames:0,logos:0,triangles:0,accentTriangles:0,culled:0,cpuMs:0,maxLogos:0,maxTriangles:0,compiled:3};
function beginFrame(id){if(id===frame)return;frame=id;seen.clear();stats.frames++;stats.logos=0;stats.triangles=0;stats.accentTriangles=0;stats.culled=0;stats.cpuMs=0;}
function claim(id,key,height,mobile){
 const logo=data[key];if(!logo||height<7||seen.has(id)){stats.culled++;return null;}
 const fine=height>=100&&!mobile,layers=logo.layers.filter(l=>!l.fine||fine),triangles=layers.reduce((sum,l)=>sum+l.triangles.length/6,0);
 if(stats.logos>=(mobile?6:12)||stats.triangles+triangles>(mobile?2600:5200)){stats.culled++;return null;}
 seen.add(id);stats.logos++;stats.triangles+=triangles;
 stats.maxLogos=Math.max(stats.maxLogos,stats.logos);stats.maxTriangles=Math.max(stats.maxTriangles,stats.triangles);
 return layers;
}
/* Blue SCT and green Equipalia walls use continuous 8m vector tiles.
 * Clip the shared triangulated SVG per physical segment only once,
 * and reuse the result in Canvas2D and WebGL without any textures. */
const wallPatternCache=new WeakMap();
const WALL_TILE_METRES=8;
const wallStripeFills=Object.freeze({
 'team-equipalia':new Set(['#71d650','#64bf48','#06472e','#f7faf9','#8ddc77']),
 sct:new Set(['#07549f','#0e64ae','#0b5ca7','#25a9d5','#00a2d6','#116faf',
              '#0875c5','#10a2e8','#d9f2ff','#2caff1','#0877c7'])
});
function wallClipEdge(points,limit,keepGreater){
 const out=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  const ai=keepGreater?a[0]>=limit-1e-7:a[0]<=limit+1e-7,
        bi=keepGreater?b[0]>=limit-1e-7:b[0]<=limit+1e-7;
  if(ai)out.push(a);
  if(ai!==bi){
   const f=(limit-a[0])/(b[0]-a[0]);
   out.push([limit,a[1]+f*(b[1]-a[1])]);
  }
 }
 return out;
}
function wallTileLayers(source,fromM,toM,reverse,key='team-equipalia'){
 if(!source||!wallStripeFills[key]||!Number.isFinite(fromM)||!Number.isFinite(toM)||toM-fromM<.02)return null;
 let cached=wallPatternCache.get(source);
 if(!cached){cached=new Map();wallPatternCache.set(source,cached);}
 const id=key+':'+(reverse?'reverse':'forward');
 if(cached.has(id))return cached.get(id);
 const from=reverse?-toM:fromM,to=reverse?-fromM:toM,span=to-from;
 const out={accents:[],wordmark:[],fine:[],triangleCount:0};
 const logo=data[key],decor=wallStripeFills[key];
 for(let tile=Math.floor(from/WALL_TILE_METRES);tile<=Math.floor((to-1e-8)/WALL_TILE_METRES);tile++){
  const low=Math.max(0,(from-tile*WALL_TILE_METRES)/WALL_TILE_METRES),
        high=Math.min(1,(to-tile*WALL_TILE_METRES)/WALL_TILE_METRES);
  if(high-low<1e-7)continue;
  for(const layer of logo.layers){
   const target=layer.fine?out.fine:(decor.has(layer.fill)?out.accents:out.wordmark);
   const triangles=layer.triangles,verts=[];
   for(let j=0;j<triangles.length;j+=6){
    let polygon=[[triangles[j],triangles[j+1]],[triangles[j+2],triangles[j+3]],[triangles[j+4],triangles[j+5]]];
    polygon=wallClipEdge(polygon,low,true);
    if(polygon.length<3)continue;
    polygon=wallClipEdge(polygon,high,false);
    if(polygon.length<3)continue;
    for(let k=1;k<polygon.length-1;k++)for(const p of [polygon[0],polygon[k],polygon[k+1]]){
     verts.push(Math.max(0,Math.min(1,(tile*WALL_TILE_METRES+p[0]*WALL_TILE_METRES-from)/span)),p[1]);
    }
   }
   if(verts.length){target.push({fill:layer.fill,triangles:new Float32Array(verts)});out.triangleCount+=verts.length/6;}
  }
 }
 cached.set(id,out);return out;
}
function claimWallText(id,triangles,mobile){
 if(seen.has(id)||stats.logos>=(mobile?6:12)||stats.triangles+triangles>(mobile?2600:5200)){
  stats.culled++;return false;
 }
 seen.add(id);stats.logos++;stats.triangles+=triangles;
 stats.maxLogos=Math.max(stats.maxLogos,stats.logos);
 stats.maxTriangles=Math.max(stats.maxTriangles,stats.triangles);
 return true;
}
function claimWallAccents(triangles,mobile){
 if(stats.triangles+triangles>(mobile?2600:5200))return false;
 stats.triangles+=triangles;
 stats.accentTriangles+=triangles;
 stats.maxTriangles=Math.max(stats.maxTriangles,stats.triangles);
 return true;
}
global.ApexTrackSponsors=Object.freeze({styles,data,colorKey,beginFrame,claim,stats,spacingM:24,equipaliaSpacingM:8,sctSpacingM:8,
 wallTileLayers,claimWallAccents,claimWallText});
})(window);
