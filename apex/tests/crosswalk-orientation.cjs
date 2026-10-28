/* APEX: regresión de la orientación de las barras de pasos de cebra.
 * node apex/tests/crosswalk-orientation.cjs
 * El generador real se extrae de part-024; no se replica la función.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const src=fs.readFileSync(path.join(__dirname,'../parts/part-024.txt'),'utf8');
const begin=src.indexOf('function apexCompileCrosswalkTriangles(it){');
const end=src.indexOf('function apexBuildLandmarkStaticBatch(it){',begin);
assert.ok(begin>=0&&end>begin,'Debe existir el compilador SVG de pasos de cebra');
const fnSource=src.slice(begin,end);

function clipPolygon(poly,projection,limit,lower){
 const output=[];
 const inside=p=>lower?projection(p)>=limit-1e-8:projection(p)<=limit+1e-8;
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],insideA=inside(a),insideB=inside(b);
  if(insideA)output.push(a);
  if(insideA!==insideB){
   const va=projection(a),vb=projection(b);
   const u=(limit-va)/(vb-va);
   output.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]);
  }
 }
 return output;
}
function makeCompile(tangent,dist=0){
 const sandbox={
  nearestTrackState:()=>({s:120,dist,lat:0}),
  envProfile:()=>({half:9,curb:1}),
  renderRibbonFrameAt:()=>({tx:tangent[0],tz:tangent[1]}),
  apexClipWorldPolygonScalar:clipPolygon,
  apexTriangulateGroundFootprint:p=>Array.from({length:Math.max(0,p.length-2)},(_,i)=>[0,i+1,i+2]),
  apexSvgSurfaceMarkingY:()=>0
 };
 vm.runInNewContext(fnSource+'\nthis.compile=apexCompileCrosswalkTriangles;',sandbox,{filename:'apex-crosswalk-compiler.js'});
 return it=>sandbox.compile(it);
}
function bounds(tri,coordinate){
 const arr=tri.map(p=>p[coordinate]);
 return Math.max(...arr)-Math.min(...arr);
}
function verify(kind,tangent,polygon,narrowDimension,wideDimension){
 const triangles=makeCompile(tangent)({type:'marking',markingKind:kind,worldFootprint:polygon});
 assert.ok(Array.isArray(triangles)&&triangles.length>0,kind+' debe producir rayas');
 assert.ok(triangles.every(tri=>bounds(tri,narrowDimension)<=0.641),
  kind+': cada raya debe mantener su anchura de 0,64 m');
 assert.ok(triangles.some(tri=>bounds(tri,wideDimension)>=3.95),
  kind+': las barras deben extenderse por el eje longitudinal previsto');
 return triangles;
}
const northSouth=[[-10,-2],[10,-2],[10,2],[-10,2]];
const eastWest=[[-2,-10],[2,-10],[2,10],[-2,10]];
// Dirección de la marcha +Z: barras paralelas a Z y repetidas lateralmente en X.
const north=verify('CROSSWALK',[0,1],northSouth,0,2);
const xPositions=new Set(north.map(tri=>Math.round(tri.reduce((n,p)=>n+p[0],0)/3*10)));
assert.ok(xPositions.size>=10,'El paso de cebra debe cubrir el ancho de la carretera');
// Dirección de la marcha +X: la misma regla funciona al girar 90°.
verify('CROSSWALK',[1,0],eastWest,2,0);
// Los cebreados urbanos no son pasos de cebra y mantienen la orientación antigua.
verify('URBAN_STRIPES',[0,1],northSouth,2,0);
console.log('OK: CROSSWALK longitudinal en ambos sentidos; URBAN_STRIPES sin cambios.');
