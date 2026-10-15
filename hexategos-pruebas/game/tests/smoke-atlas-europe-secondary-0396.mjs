'use strict';
/* node hexategos-pruebas/game/tests/smoke-atlas-europe-secondary-0396.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../hexategos-atlas/atlas-europe-secondary-0396.js',import.meta.url),'utf8');
// Hex mesh fixture: 17 × 13 pointy-top hexagons, land on left, sea on right.
const result=new Function('src',String.raw`
const rad=Math.PI/180;
const vec=(x,y)=>[Math.round(Math.cos(y*rad)*Math.sin(x*rad)*32767),
 Math.round(Math.sin(y*rad)*32767),Math.round(Math.cos(y*rad)*Math.cos(x*rad)*32767)];
const F=[],C=[],adj=[],O=[0],land=[],vertices=new Map(),segments=new Map();
function vertex(x,y){
 const k=x.toFixed(6)+','+y.toFixed(6);
 if(!vertices.has(k)){vertices.set(k,F.length/3);F.push(...vec(x,y))}
 return vertices.get(k);
}
for(let q=0;q<17;q++)for(let row=0;row<13;row++){
 const x=-2.4+.27*q,y=49.4+Math.sqrt(3)*.18*(row+q/2),cell=C.length/3;
 C.push(...vec(x,y));land.push(q<12?1:-1);
 const poly=[];for(let j=0;j<6;j++){
  const a=j*Math.PI/3;poly.push(vertex(x+.18*Math.cos(a),y+.18*Math.sin(a)));
 }
 for(let j=0;j<6;j++){
  const a=poly[j],b=poly[(j+1)%6],index=adj.length,k=Math.min(a,b)+','+Math.max(a,b);
  if(!segments.has(k))segments.set(k,[]);
  segments.get(k).push([cell,index]);adj.push(a);
 }
 O.push(adj.length);
}
const edgeNbr=Array(adj.length).fill(-1);
for(const rows of segments.values())if(rows.length===2){
 edgeNbr[rows[0][1]]=rows[1][0];edgeNbr[rows[1][1]]=rows[0][0];
}
const L={n:land.length,land,centers:C,faceCenters:F,offsets:O,adj,edgeNbr};
const window={HexategosEuropeSecondary0396:{
 rivers:[
  {name:'Coastal test',mouth:true,
   points:[[-1.9,49.9],[-1.3,50.7],[-.35,51.4],[.9,51.4]],
   channelMeters:[[0,4],[.3,20],[1,120]],minZoom:8},
  {name:'Tributary test',mouth:false,
   points:[[-1.9,49.9],[-1.3,50.7],[-.35,51.4]],
   channelMeters:[[0,3],[1,40]],minZoom:8}
 ],
 mountains:[{name:'Mountain test',points:[[-1.7,49.9],[-.7,50.8]],
   elevationM:2600,ruggedness:.75,accessibility:.4,minZoom:9}]
}};
const globalThis=window,console={info(){},warn(){}};
let zoom=16,vw=1600,vh=1200,strokes=0,baseRuns=0,widths=[];
let drawTerrain3212=()=>baseRuns++;
const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},
 stroke(){strokes++},set lineWidth(x){widths.push(x)},set strokeStyle(x){},
 set lineCap(x){},set lineJoin(x){}};
const $=()=>({checked:true}),loadLevel=()=>L,lonLatVec=(x,y)=>vec(x,y).map(n=>n/32767);
const projectVec=(x,y,z,R,cx,cy)=>[
 cx+Math.atan2(x,z)/rad*125,cy-(Math.asin(y)/rad-52)*85,1
];
eval(src);
drawTerrain3212(1200,700,600);
const diagnostics=window.HexategosEuropeSecondaryRender0396.diagnostics(),
 first=strokes;
drawTerrain3212(1200,700,600);
return {diagnostics,graph:window.HexategosEuropeSecondaryRender0396.graphSize(),
 baseRuns,strokes:first,stable:strokes===first*2,variable:new Set(widths).size>3};
`)(source);
assert.equal(result.diagnostics.length,3);
assert.ok(result.diagnostics.every(x=>x.ok),JSON.stringify(result.diagnostics));
const sea=result.diagnostics.find(x=>x.name==='Coastal test');
assert.equal(sea.endsAtCoast,true);
assert.equal(sea.lastEdgeIsCoast,false);
assert.ok(sea.finalEdge?.length===2);
assert.ok(result.graph>200&&result.baseRuns===2&&result.strokes>0);
assert.equal(result.stable,true);
assert.equal(result.variable,true);
console.log('HEXATEGOS ATLAS 0.39.6 secondary waterways and minor ranges: OK');
