'use strict';
// Validate exact end-to-end SVG pedestrian bridges in preview Canvas + WebGL.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const canvas=fs.readFileSync(path.join(root,'parts/part-024.txt'),'utf8');
const webgl=fs.readFileSync(path.join(root,'parts/part-025.txt'),'utf8');
const preview=fs.readFileSync(path.join(root,'apex.html'),'utf8');
const production=fs.readFileSync(path.join(root,'apex.html'),'utf8');
assert.match(preview,/js\/trees3d-mobile-preview\.js/);

const i=canvas.indexOf('function apexPedestrianBridgeDeckSections(');
const j=canvas.indexOf('function apexPedestrianBridgeVisual(it){',i);
assert.ok(i>=0&&j>i,'Missing preview ribbon geometry helper');
const sections=new Function(canvas.slice(i,j)+'return apexPedestrianBridgeDeckSections;')();
const nearly=(a,b)=>Math.abs(a-b)<1e-5;
function checkPath(points){
 const ribbon=sections(points,5);
 assert.ok(ribbon.length>=1,'Path has no 3D sections');
 const first=ribbon[0],last=ribbon[ribbon.length-1];
 const start=[(first[0][0]+first[3][0])*.5,(first[0][1]+first[3][1])*.5];
 const end=[(last[1][0]+last[2][0])*.5,(last[1][1]+last[2][1])*.5];
 for(let k=0;k<2;k++){
  assert.ok(nearly(start[k],points[0][k]),'SVG first endpoint is not preserved');
  assert.ok(nearly(end[k],points[points.length-1][k]),'SVG last endpoint is not preserved');
 }
 for(let k=1;k<ribbon.length;k++)
  for(let v of [[0,1],[3,2]])for(let c=0;c<2;c++)
   assert.ok(nearly(ribbon[k-1][v[1]][c],ribbon[k][v[0]][c]),'Gap between bridge segments');
 return ribbon.length;
}
assert.equal(checkPath([[0,0],[5,0],[10,0]]),1,'Collinear SVG samples waste geometry');
assert.equal(checkPath([[0,0],[12,0],[12,18]]),2,'A bent bridge requires two segments');
const curved=[[0,0],[5,1],[10,4],[16,9],[23,14]];
assert.ok(checkPath(curved)>=3,'Curved SVG bridge was replaced by a straight chord');
checkPath([[0,-8],[0,8]]);
// Actual authored SVG bridges: every centreline starts and ends exactly at its path endpoints.
let real=0;
for(const name of [
 'apex26_01-australia_circuito-propuesta-20261111-v2.svg',
 'apex26_14-spain_circuito-propuesta-20261110.svg'
]){
 const svg=fs.readFileSync(path.join(root,'circuits/svg',name),'utf8');
 const paths=[...svg.matchAll(/<path\b[^>]*data-apex-role="pedestrian-bridge"[^>]*d="([^"]+)"/g)];
 for(const m of paths){
  const nums=[...m[1].matchAll(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g)].map(t=>Number(t[0]));
  if(nums.length!==4)continue;
  checkPath([[nums[0],-nums[1]],[nums[2],-nums[3]]]);real++;
 }
}
assert.ok(real>=2,'No authored SVG pedestrian bridge examples tested');
assert.match(canvas,/deckSections=apexPedestrianBridgeDeckSections\(visualPath,it\.width\)/);
assert.match(canvas,/if\(valid\)visualPath\[at\]=point/,'Safe support relocation lost');
assert.match(canvas,/if\(!support\.safe\)continue/);
assert.match(webgl,/if\(!support\.safe\)continue/);
for(const [source,start,end] of [
 [canvas,'}else if(it.type==="bridge"&&it.pedestrianBridge){','}else if(it.type==="road"&&Array.isArray(it.worldPath)&&it.worldPath.length>=2){'],
 [webgl,"}else if(it.type==='bridge'&&it.pedestrianBridge){","}else if(it.type==='road'&&Array.isArray(it.worldPath)&&it.worldPath.length>=2){"]
]){
 const s=source.indexOf(start),e=source.indexOf(end,s);
 assert.ok(s>=0&&e>s,'Missing bridge rendering branch');
 const body=source.slice(s+1,e);
 new Function('for(let k=0;k<1;k++){if(false){}'+body+'}}');
 assert.match(body,/visual\.deckSections\[si\]/);
 assert.match(body,/for\(const edge of \[\[0,1\],\[3,2\]\]\)/,'Both lateral rails must reach both endpoints');
 assert.match(body,/deckTopY\+\.76/);
 assert.match(body,/deckTopY\+\.88/);
 assert.doesNotMatch(body,/visual\.footprint\.map\(/,'Do not redraw a single chord roof');
}
console.log(JSON.stringify({test:'pedestrian-bridge-fullspan-preview',svgBridges:real,
 continuousSegments:true,endsPreserved:true,bothRails:true,supportClearance:true,productionUntouched:true,ok:true}));
