'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.createContext(context);
for(const file of ['track-sponsor-vectors.js','track-sponsors.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
const api=context.window.ApexTrackSponsors,master=api.data['sct-wall'];
assert.equal(Object.keys(api.data).length,4);assert.equal(master.metres,24);assert.equal(master.planar,true);assert.equal(master.aspect,18);
const svg=fs.readFileSync(path.join(root,'assets/sponsors/sct-wall-24m.svg'),'utf8');
assert.equal(svg,fs.readFileSync(path.join(root,'assets/sponsors/sct-wall.svg'),'utf8'));
assert.ok(!/<(?:image|text|filter|foreignObject|use)\b/.test(svg),'One complete vector master, no raster/8m symbols');
assert.ok(!svg.includes('#063365'),'No dirty overlapping extrusion');
for(const part of ['large','medium','small'])assert.equal((svg.match(new RegExp('data-design-part="'+part+'-sct"','g'))||[]).length,1);
const area=tri=>Math.abs((tri[2]-tri[0])*(tri[5]-tri[1])-(tri[4]-tri[0])*(tri[3]-tri[1]))/2;
let totalArea=0;const triangles=[];
for(const [layerIndex,layer] of master.layers.entries()){
 const t=layer.triangles;assert.equal(t.length%6,0);
 for(let i=0;i<t.length;i+=6){const tri=Array.from(t.slice(i,i+6));totalArea+=area(tri);triangles.push({tri,layerIndex,minX:Math.min(tri[0],tri[2],tri[4]),maxX:Math.max(tri[0],tri[2],tri[4]),minY:Math.min(tri[1],tri[3],tri[5]),maxY:Math.max(tri[1],tri[3],tri[5])});}
}
assert.ok(Math.abs(totalArea-1)<2e-5,'Planar mural covers exactly one complete face, without holes or double paint');
function intersectionArea(a,b){
 let poly=[[a[0],a[1]],[a[2],a[3]],[a[4],a[5]]];
 const orientation=Math.sign((b[2]-b[0])*(b[5]-b[1])-(b[4]-b[0])*(b[3]-b[1]));
 for(let i=0;i<3&&poly.length;i++){
  const x=b[i*2],y=b[i*2+1],j=(i+1)%3,dx=b[j*2]-x,dy=b[j*2+1]-y,side=p=>orientation*(dx*(p[1]-y)-dy*(p[0]-x)),out=[];
  for(let k=0;k<poly.length;k++){const p=poly[k],q=poly[(k+1)%poly.length],u=side(p),v=side(q);if(u>=0)out.push(p);if((u>=0)!==(v>=0)){const f=u/(u-v);out.push([p[0]+f*(q[0]-p[0]),p[1]+f*(q[1]-p[1])]);}}
  poly=out;
 }
 return Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
}
let maxOverlap=0;
for(let i=0;i<triangles.length;i++)for(let j=i+1;j<triangles.length;j++){
 const a=triangles[i],b=triangles[j];if(a.layerIndex===b.layerIndex||a.maxX<=b.minX||b.maxX<=a.minX||a.maxY<=b.minY||b.maxY<=a.minY)continue;
 maxOverlap=Math.max(maxOverlap,intersectionArea(a.tri,b.tri));
}
assert.ok(maxOverlap<2e-7,'Letters and blue regions have no overlapping faces / z-fighting');
const bounds=layer=>{const t=layer.triangles,x=[],y=[];for(let i=0;i<t.length;i+=2){x.push(t[i]);y.push(t[i+1]);}return [Math.min(...x),Math.max(...x),Math.min(...y),Math.max(...y)];};
const faces=['large','medium','small'].map(size=>master.layers.find(l=>l.part===size+'-sct'));
const boxes=faces.map(bounds);
assert.ok(boxes[0][1]-boxes[0][0]>boxes[1][1]-boxes[1][0]);assert.ok(boxes[1][1]-boxes[1][0]>boxes[2][1]-boxes[2][0]);
assert.ok(boxes[0][0]<boxes[1][0]&&boxes[1][0]<boxes[2][0]);
const tags=[...svg.matchAll(/<path\b[^>]*\/>/g)].map(m=>m[0]);
for(const [i,label] of ['large','medium','small'].entries()){
 const tag=tags.find(t=>t.includes('data-design-part="'+label+'-icon"')&&t.includes('fill="#116faf"'));
 const pts=[...tag.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1]/1440,+m[2]/80]);
 const inside=(x,y)=>{const xs=[];for(let k=0;k<pts.length;k++){const a=pts[k],b=pts[(k+1)%pts.length];if(a[1]!==b[1]&&y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1]))xs.push(a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]));}return x>=Math.min(...xs)-1e-6&&x<=Math.max(...xs)+1e-6;};
 const t=faces[i].triangles;for(let k=0;k<t.length;k+=2)assert.ok(inside(t[k],t[k+1]),'Complete S/C/T inside diamond: '+label);
 const telecom=master.layers.find(l=>l.part===label+'-telecom');assert.ok(bounds(telecom)[0]>Math.max(...pts.map(p=>p[0])),'TELECOM to the right of the rhombus');
}
function flat(slices){return slices.flatMap(s=>s.layers);}
function seam(slices,u){return new Set(flat(slices).flatMap(l=>{const out=[];for(let i=0;i<l.triangles.length;i+=2)if(Math.abs(l.triangles[i]-u)<1e-5)out.push(l.part+':'+Math.round(l.triangles[i+1]*1e5));return out;}));}
for(const reverse of [false,true])for(const at of [1.7,4.3,7.3,8,12.1,16,20.5,24,25.6,47.8]){
 const a=api.sctMuralSlices({},at-.37,at,reverse),b=api.sctMuralSlices({},at,at+.37,reverse);
 assert.deepEqual([...seam(a,1)].sort(),[...seam(b,0)].sort(),'No seam jump at '+at+' reverse='+reverse);
}
const full=api.sctMuralSlices({},0,24),repeat=api.sctMuralSlices({},24,48);
assert.deepEqual(Array.from(flat(full),l=>Array.from(l.triangles)),Array.from(flat(repeat),l=>Array.from(l.triangles)),'Repeat only every 24m');
const cropped=api.sctMuralSlices({},8,16);assert.notDeepEqual(Array.from(flat(cropped),l=>Array.from(l.triangles)),Array.from(flat(full),l=>Array.from(l.triangles)),'8m fragment cannot restart full mural');
// Reassemble uneven pieces: all three wordmarks must retain exactly the same
// world-space bounds as the master, independently of wall segmentation.
for(const cuts of [[0,24],[0,.8,3.7,8,9.3,16,21,24],Array.from({length:25},(_,i)=>i)]){
 const result=new Map();for(let i=0;i<cuts.length-1;i++)for(const l of flat(api.sctMuralSlices({},cuts[i],cuts[i+1]))){
  if(!l.part.endsWith('-sct'))continue;const pts=result.get(l.part)||[];for(let k=0;k<l.triangles.length;k+=2)pts.push([cuts[i]+l.triangles[k]*(cuts[i+1]-cuts[i]),l.triangles[k+1]]);result.set(l.part,pts);
 }
 for(const [i,label] of ['large','medium','small'].entries()){
  const points=result.get(label+'-sct'),x=points.map(p=>p[0]),y=points.map(p=>p[1]);
  const b=[Math.min(...x)/24,Math.max(...x)/24,Math.min(...y),Math.max(...y)];for(let k=0;k<4;k++)assert.ok(Math.abs(b[k]-boxes[i][k])<2e-6,'Fixed size '+label+' / '+cuts.length+' pieces');
 }
}
const mutable={};const first=api.sctMuralSlices(mutable,0,7.3);assert.equal(api.sctMuralSlices(mutable,0,7.3),first);assert.notEqual(api.sctMuralSlices(mutable,1,8.3),first,'Cache must include physical interval, not just object identity');
// Preserve Equipalia's 8m tile and MDTel's independent vector identity.
assert.equal(api.equipaliaSpacingM,8);assert.equal(api.sctSpacingM,24);assert.equal(api.wallPatternMetres('sct-wall'),24);assert.equal(api.data['team-equipalia'].aspect,6);
const green=api.wallTileLayers({},0,8,false);assert.ok(green.accents.length&&green.wordmark.length);assert.ok(api.data.mdtel.layers.length);
for(const [color,key] of [['#00673e','team-equipalia'],['#07539b','sct'],['#fff','mdtel']])assert.equal(api.colorKey(color),key);
for(const mobile of [false,true]){
 api.beginFrame(mobile?2:1);assert.ok(api.claimMural('whole',1800,mobile));assert.equal(api.claimMural('whole',10,mobile),false);
 assert.equal(api.claimMural('too-much',6000,mobile),false);assert.ok(api.stats.triangles<=(mobile?2600:5200));assert.equal(api.stats.muralBlocks,1);
}
api.beginFrame(6);assert.equal(api.claimMural('would-starve-green',2400,true,400),false);assert.ok(api.claimMural('whole-with-green-room',2075,true,400));assert.ok(api.stats.triangles<=2200,'Shared budget leaves room for Equipalia/MDTel');
const source=fs.readFileSync(path.join(root,'parts/part-024.txt'),'utf8'),renderer=fs.readFileSync(path.join(root,'parts/part-025.txt'),'utf8');
assert.ok(renderer.includes("apexPlanSctWallMurals(wallItems.map(entry=>entry.data),pitch,'canvas2d')")&&renderer.includes("apexPlanSctWallMurals(items,pitch,'webgl2')"),'Exact/procedural items are planned once before either rendering backend');
const helper=source.slice(source.indexOf('const apexSctProceduralAtlases='),source.indexOf('function apexPlanSctWallMurals'));
const nodes=[0,2,5,8,12,24,48],q=s=>({x:0,z:s,tx:0,tz:1}),trackData={km:.048,customWorld:{}},wrapDeltaS=(a,b,L)=>((a-b+L/2)%L+L)%L-L/2;
const ctx={trackData,apexRoadMeshSamples:()=>nodes,wallGeometryAtS:(s,side)=>({q:q(s),bottom:{x:side*5,z:s}}),mod:(s,L)=>(s%L+L)%L,lerp:(a,b,f)=>a+(b-a)*f,wrapDeltaS};vm.createContext(ctx);vm.runInContext(helper,ctx);
const raw=[{x:0},{x:1},{x:2},{x:3}];
for(const [a,b] of [[0,8],[8,24],[24,32]]){
 const exact=ctx.apexSctWallDescriptor({side:1,sponsorSource:{sponsorPatternFromM:a,sponsorPatternToM:b,sponsorMuralRun:1},sponsorPoly3:raw});
 const procedural=ctx.apexSctWallDescriptor({side:1,sponsorS0:a,sponsorS1:b,sponsorPoly3:raw});
 assert.equal(exact.from,procedural.from);assert.equal(exact.to,procedural.to);
}
assert.equal(ctx.apexSctProceduralAtlas(1).reverse,true,'Right-hand wall has a stable readable front face');assert.equal(ctx.apexSctProceduralAtlas(-1).reverse,false,'Left-hand wall has the opposite physical orientation');
const backward=ctx.apexSctWallDescriptor({side:1,sponsorS0:8,sponsorS1:0,sponsorPoly3:raw});assert.equal(backward.from,0);assert.equal(backward.to,8);assert.equal(backward.raw[0],raw[3]);
const setup=source.slice(source.indexOf('const sponsorRuns=new Map();'),source.indexOf(' cw._apexGroundStamp=stamp;',source.indexOf('const sponsorRuns=new Map();')));
const segments=[{runId:1,side:1,s:1,x1:5,z1:0,x2:5,z2:5},{runId:1,side:1,s:6,x1:5,z1:5,x2:5,z2:12},{runId:2,side:-1,s:1,x1:-5,z1:0,x2:-5,z2:5}];
vm.runInNewContext(setup,{cw:{_wallRenderSegments:segments},renderRibbonFrameAt:q});
assert.equal(segments[0].sponsorMuralReverse,true);assert.equal(segments[1].sponsorMuralReverse,true);assert.equal(segments[2].sponsorMuralReverse,false);
assert.equal(segments[0].sponsorPatternToM,segments[1].sponsorPatternFromM,'Physical distance continues across exact wall joints');
const html=Array.from({length:28},(_,i)=>fs.readFileSync(path.join(root,'parts',`part-${String(i).padStart(3,'0')}.txt`),'utf8')).join('');for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
console.log(JSON.stringify({test:'sct-master-24m',triangles:triangles.length,area:totalArea,maxLayerOverlap:maxOverlap,threeFixedSizes:true,seams:true,exactAndProcedural:true,budgets:true,ok:true}));
