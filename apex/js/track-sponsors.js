/* Trackside SVG logos: shared, pre-triangulated once; no image decoding or
 * texture upload in the race loop. Render through the existing world batch. */
(function(global){
'use strict';
const data=Object.assign({},global.ApexSponsorVectorData||{},global.ApexFeatureSponsorData||{});
// The official MDTel lettering already has a compact, faithful 522-triangle
// vector. Reuse it on the full-width white race mural instead of tracing the
// same glyphs a second time (>1,600 triangles per 8 m tile).
function apexMdtelWhiteMural(){
 const legacy=data.mdtel,source=data['mdtel-white-24m'];
 if(!legacy||!source)return;
 const w=1800,h=210;
 const poly=(fill,points)=>{
  const v=[];
  for(let k=1;k<points.length-1;k++)for(const p of [points[0],points[k],points[k+1]])v.push(p[0]/w,p[1]/h);
  return {fill,triangles:v};
 };
 const backdrop=[
  poly('#f8fafc',[[0,0],[w,0],[w,h],[0,h]]),
  poly('#d4e7fb',[[0,175],[240,0],[315,0],[75,210],[0,210]]),
  poly('#2a6db3',[[1260,210],[1505,0],[1560,0],[1315,210]]),
  poly('#75bce5',[[1322,210],[1570,0],[1598,0],[1350,210]]),
  poly('#d7e5f3',[[1630,210],[1800,45],[1800,115],[1735,210]]),
  poly('#e4eaf2',[[0,0],[1800,0],[1800,9],[0,9]]),
  poly('#d6dee9',[[0,195],[1800,195],[1800,210],[0,210]])
 ];
 const wordmark=legacy.layers.map(layer=>{
  const v=layer.triangles,triangles=[];
  for(let i=0;i<v.length;i+=2)triangles.push(.168+v[i]*.225,.055+v[i+1]*.87);
  return {fill:layer.fill,fine:layer.fine,triangles};
 });
 data['mdtel-white-24m']={aspect:source.aspect,layers:backdrop.concat(wordmark)};
}
apexMdtelWhiteMural();
for(const logo of Object.values(data))for(const layer of logo.layers)layer.triangles=new Float32Array(layer.triangles);
const styles=Object.freeze([
 Object.freeze({brand:'TEAM EQUIPALIA',bg:'#00673e',fg:'#ffffff',logo:'team-equipalia'}),
 Object.freeze({brand:'SCT TELECOM',bg:'#07539b',fg:'#ffffff',logo:'sct'}),
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
const stats={frames:0,logos:0,triangles:0,accentTriangles:0,muralBlocks:0,sctTriangles:0,culled:0,cpuMs:0,maxLogos:0,maxTriangles:0,compiled:Object.keys(data).length};
function beginFrame(id){if(id===frame)return;frame=id;seen.clear();stats.frames++;stats.logos=0;stats.triangles=0;stats.accentTriangles=0;stats.muralBlocks=0;stats.sctTriangles=0;stats.culled=0;stats.cpuMs=0;}
function claim(id,key,height,mobile){
 const logo=data[key];if(!logo||height<7||seen.has(id)){stats.culled++;return null;}
 const fine=height>=100&&!mobile,layers=logo.layers.filter(l=>!l.fine||fine),triangles=layers.reduce((sum,l)=>sum+l.triangles.length/6,0);
 if(stats.logos>=(mobile?6:12)||stats.triangles+triangles>(mobile?2600:5200)){stats.culled++;return null;}
 seen.add(id);stats.logos++;stats.triangles+=triangles;
 stats.maxLogos=Math.max(stats.maxLogos,stats.logos);stats.maxTriangles=Math.max(stats.maxTriangles,stats.triangles);
 return layers;
}
/* Brand walls use a real 24m SCT mural and independent 8m Equipalia tiles.
 * Crop the pre-triangulated artwork to physical wall-segment boundaries once.
 * All clipped vertices are reused by Canvas2D and WebGL on every frame. */
const wallPatternCache=new WeakMap();
const EQUIPALIA_TILE_METRES=8, SCT_MURAL_METRES=24;
function wallPatternMetres(key){return key==='sct-wall'?SCT_MURAL_METRES:EQUIPALIA_TILE_METRES;}
const wallStripeFills=new Set([
 '#71d650','#64bf48','#06472e','#f7faf9','#8ddc77',
 '#25a9d5','#00a2d6','#116faf','#0874bf','#0086cb','#0056a5',
 '#078fe0','#36b7ef','#eafaff','#007acb','#42c9f5'
]);
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
// SCT is a single planar 24m master. Cache its crops by physical range, not
// by the transient camera segment object; never fit or scale a logo locally.
const sctSliceCache=new WeakMap();
function sctMuralSlices(source,fromM,toM,reverse=false){
 if(!source||!Number.isFinite(fromM)||!Number.isFinite(toM)||toM<=fromM)return [];
 let cache=sctSliceCache.get(source);if(!cache){cache=new Map();sctSliceCache.set(source,cache);}
 const stamp=fromM.toFixed(6)+':'+toM.toFixed(6)+':'+reverse;
 if(cache.has(stamp))return cache.get(stamp);
 const from=reverse?-toM:fromM,to=reverse?-fromM:toM,span=to-from,out=[],master=data['sct-wall'];
 for(let tile=Math.floor(from/24);tile<=Math.floor((to-1e-8)/24);tile++){
  const low=Math.max(0,(from-tile*24)/24),high=Math.min(1,(to-tile*24)/24),layers=[];
  let triangles=0;
  for(const layer of master.layers){
   const vertices=[],src=layer.triangles;
   for(let i=0;i<src.length;i+=6){
    let polygon=[[src[i],src[i+1]],[src[i+2],src[i+3]],[src[i+4],src[i+5]]];
    polygon=wallClipEdge(polygon,low,true);if(polygon.length<3)continue;
    polygon=wallClipEdge(polygon,high,false);if(polygon.length<3)continue;
    for(let k=1;k<polygon.length-1;k++)for(const p of [polygon[0],polygon[k],polygon[k+1]]){
     const u=Math.max(0,Math.min(1,(tile*24+p[0]*24-from)/span));
     vertices.push(reverse?1-u:u,p[1]);
    }
   }
   if(vertices.length){layers.push({fill:layer.fill,part:layer.part,triangles:new Float32Array(vertices)});triangles+=vertices.length/6;}
  }
  out.push({tile,layers,triangles});
 }
 if(cache.size>=2048)cache.delete(cache.keys().next().value);
 cache.set(stamp,out);return out;
}
function claimMural(id,triangles,mobile,reserve=0){
 if(stats.triangles+triangles>(mobile?2600:5200)-reserve){stats.culled++;return false;}
 if(!claimWallText(id,triangles,mobile))return false;
 stats.muralBlocks++;stats.sctTriangles+=triangles;return true;
}

function wallTileLayers(source,fromM,toM,reverse,brand='team-equipalia'){
 if(!source||!Number.isFinite(fromM)||!Number.isFinite(toM)||toM-fromM<.02)return null;
 let cached=wallPatternCache.get(source);
 if(!cached){cached=new Map();wallPatternCache.set(source,cached);}
 const id=brand+':'+fromM+':'+toM+':'+(reverse?'reverse':'forward');
 if(cached.has(id))return cached.get(id);
 const from=reverse?-toM:fromM,to=reverse?-fromM:toM,span=to-from;
 const out={accents:[],wordmark:[],fine:[],triangleCount:0};
 const logo=data[brand];if(!logo)return null;
 const tileMetres=wallPatternMetres(brand);
 for(let tile=Math.floor(from/tileMetres);tile<=Math.floor((to-1e-8)/tileMetres);tile++){
  const low=Math.max(0,(from-tile*tileMetres)/tileMetres),
        high=Math.min(1,(to-tile*tileMetres)/tileMetres);
  if(high-low<1e-7)continue;
  for(const layer of logo.layers){
   const target=layer.fine?out.fine:(wallStripeFills.has(layer.fill)?out.accents:out.wordmark);
   const triangles=layer.triangles,verts=[];
   for(let j=0;j<triangles.length;j+=6){
    let polygon=[[triangles[j],triangles[j+1]],[triangles[j+2],triangles[j+3]],[triangles[j+4],triangles[j+5]]];
    polygon=wallClipEdge(polygon,low,true);
    if(polygon.length<3)continue;
    polygon=wallClipEdge(polygon,high,false);
    if(polygon.length<3)continue;
    for(let k=1;k<polygon.length-1;k++)for(const p of [polygon[0],polygon[k],polygon[k+1]]){
     verts.push(Math.max(0,Math.min(1,(tile*tileMetres+p[0]*tileMetres-from)/span)),p[1]);
    }
   }
   if(verts.length){target.push({fill:layer.fill,triangles:new Float32Array(verts)});out.triangleCount+=verts.length/6;}
  }
 }
 cached.set(id,out);return out;
}
// Legacy independent/Equipalia surfaces retain their original bias. The SCT
// master uses disjoint planar regions and a common .06 world-face bias.
function wallLayerDepthBias(){return .026;}
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
global.ApexTrackSponsors=Object.freeze({styles,data,colorKey,beginFrame,claim,stats,spacingM:24,equipaliaSpacingM:8,sctSpacingM:24,wallPatternMetres,
 wallTileLayers,claimWallAccents,claimWallText,wallLayerDepthBias,sctMuralSlices,claimMural});
})(window);
