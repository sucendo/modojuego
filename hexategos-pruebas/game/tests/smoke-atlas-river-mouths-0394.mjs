'use strict';
/* Run: node hexategos-pruebas/game/tests/smoke-atlas-river-mouths-0394.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const atlas=fs.readFileSync(new URL('../../../hexategos-atlas/atlas-iberia-edges-v2.js',import.meta.url),'utf8');
const reference=fs.readFileSync(new URL('../data/iberia-physical-atlas-v1.js',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Function(atlas));
const geo=new Function('globalThis',reference+';return globalThis.HEXATEGOS_IBERIA_PHYSICAL_V1')({});
assert.equal(geo.rivers.length,8);
for(const river of geo.rivers){
 assert.ok(river.channelMeters?.length>=4,'Missing physical channel-width profile: '+river.name);
 assert.ok(river.channelMeters.every(([f,m])=>f>=0&&f<=1&&m>0));
}
const body=atlas.slice(atlas.indexOf('function paintRiver('),atlas.indexOf('drawTerrain3212=function'));
assert.ok(!body.includes('sys.rank'),'width may not depend on abstract rank');

const result=new Function('src',"\nconst v=(x,y)=>{const a=x*Math.PI/180,b=y*Math.PI/180;return [Math.round(Math.cos(b)*Math.sin(a)*32767),Math.round(Math.sin(b)*32767),Math.round(Math.cos(b)*Math.cos(a)*32767)]};\nconst F=[],C=[],adj=[],off=[0],land=[],verts=new Map(),pairs=new Map();\nfunction vertex(x,y){let k=x.toFixed(6)+','+y.toFixed(6);if(!verts.has(k)){verts.set(k,F.length/3);F.push(...v(x,y))}return verts.get(k)}\nconst radius=.12;\nfor(let q=0;q<17;q++)for(let row=0;row<13;row++){\n const x=-7.8+1.5*radius*q,y=38.4+Math.sqrt(3)*radius*(row+q/2),id=C.length/3;\n C.push(...v(x,y));land.push(q<12?1:-1);\n const vs=[];for(let j=0;j<6;j++){const a=Math.PI/3*j;vs.push(vertex(x+radius*Math.cos(a),y+radius*Math.sin(a)))}\n for(let j=0;j<6;j++){\n  const u=vs[j],w=vs[(j+1)%6],key=Math.min(u,w)+','+Math.max(u,w),k=adj.length;\n  if(!pairs.has(key))pairs.set(key,[]);pairs.get(key).push([id,k]);adj.push(u);\n }\n off.push(adj.length);\n}\nconst edgeNbr=Array(adj.length).fill(-1);\nfor(const rows of pairs.values())if(rows.length===2){edgeNbr[rows[0][1]]=rows[1][0];edgeNbr[rows[1][1]]=rows[0][0]}\nconst L={n:land.length,land,centers:C,faceCenters:F,adj,offsets:off,edgeNbr};\nconst globalThis={HEXATEGOS_IBERIA_PHYSICAL_V1:{\n rivers:[{name:'Ebro',rank:3,channelMeters:[[0,4],[.3,16],[.5,48],[.8,35],[1,180]],points:[[-7.6,39.55],[-7.1,39.68],[-6.7,39.82],[-6.20,40.02],[-5.64,40.08]]}],\n mountains:[{name:'Pirineos',rank:3,points:[[-7.6,39.5],[-7.1,39.62],[-6.5,39.62]]}]\n}};\nconst window=globalThis,console={info(){},warn(){}};\nconst river={n:'Ebro',edges:[1,2],branch:false},mountain={n:'Pirineos',edges:[3,4],branch:false};\nconst MAP_RIVERS3242=[river],MOUNTAIN_NETWORKS3242=[mountain];\nlet zoom=20,masked=false,baseRuns=0,style='',width=0,strokes=[];\nlet drawTerrain3212=()=>{baseRuns++;masked=river.edges.length===0};\nconst $=()=>({checked:true}),loadLevel=()=>L,projectVec=(x,y,z,R,cx,cy)=>[x*R+cx,y*R+cy,1];\nconst ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},\n stroke(){if(style.includes('111,208,227'))strokes.push(width)},\n set lineCap(v){},set lineJoin(v){},set lineWidth(v){width=v},set strokeStyle(v){style=v}};\neval(src);\ndrawTerrain3212(1000,0,0);\n\nconst mouths=window.HexategosIberiaRiverDiagnostics.mouths();\nconst end=mouths[0]?.mouthVertex,edge=mouths[0]?.riverLastEdge;\nconst lastPair=edge?pairs.get(Math.min(...edge)+','+Math.max(...edge)):null;\nconst coastPair=rows=>rows?.length===2&&rows.some(([i])=>land[i]<0)&&rows.some(([i])=>land[i]>=0);\nconst shorelineVertex=Number.isInteger(end)&&[...pairs].some(([key,rows])=>\n  key.split(',').map(Number).includes(end)&&coastPair(rows));\nconst lastEdgeInland=!!lastPair&&!coastPair(lastPair)&&lastPair.every(([i])=>land[i]>=0);\nconst lastEdgeEndsAtMouth=edge?.[1]===end;\nconst previousIsInland=edge&&!([...pairs].some(([key,rows])=>\n  key.split(',').map(Number).includes(edge[0])&&coastPair(rows)));\nconst first=strokes.slice();\ndrawTerrain3212(1000,0,0);\nreturn {shorelineVertex,lastEdgeInland,lastEdgeEndsAtMouth,previousIsInland,masked,\n  restored:river.edges.length===2&&mountain.edges.length===2,\n  dynamic:new Set(first).size>1,\n  stable:JSON.stringify(first)===JSON.stringify(strokes.slice(first.length)),\n  mouths,baseRuns};\n")(atlas);

assert.equal(result.shorelineVertex,true,'river must terminate at shoreline intersection');
assert.equal(result.lastEdgeInland,true,'last river edge must not be a coastal edge');
assert.equal(result.lastEdgeEndsAtMouth,true,'last river edge ends at shoreline vertex');
assert.equal(result.previousIsInland,true,'last river segment approaches from land');
assert.equal(result.masked,true,'canonical strokes suppressed only in view pass');
assert.equal(result.restored,true,'original map topology restored after paint');
assert.equal(result.dynamic,true,'channel width differs among river sections');
assert.equal(result.stable,true,'second render must reproduce width profile');
assert.equal(result.mouths.length,1,'one mouth per river');
console.log('HEXATEGOS ATLAS: river ends at coastline intersection, no coastal segment, variable width: OK');
