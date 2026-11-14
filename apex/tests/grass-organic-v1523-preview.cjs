'use strict';
// V15.2.3 regression: organic (interpolated) grass, stable adjacent cells.
// Verifies only the preview renderer; production canvas/engine unchanged.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cpu=read('parts/part-024.txt');
const gpu=read('parts/part-025.txt');
const preview=read('apex.html'),main=read('index.html');
const a=cpu.indexOf('function apexGrassValueNoiseV1523('),b=cpu.indexOf('function apexUnifiedGroundDrawCorridor(',a);
assert.ok(a>=0&&b>a);
const helpers=cpu.slice(a,b);
new vm.Script(helpers);
assert.match(helpers,/fx=fx\*fx\*\(3-2\*fx\)/);
assert.match(helpers,/fz=fz\*fz\*\(3-2\*fz\)/);
const hash=(x,z,seed)=>{
 let h=(Math.imul(x|0,374761393)+Math.imul(z|0,668265263)+Math.imul(seed|0,1442695041))|0;
 h=Math.imul(h^(h>>>13),1274126177);
 return ((h^(h>>>16))>>>0)/4294967296;
};
const c=new Function('apexRoadTextureHashV15','apexRoadSvgNormalizeColorV15','apexWeatherWetFactor','shadeColor','window',
 helpers+'return{noise:apexGrassValueNoiseV1523,tint:apexSurfaceTintV152};')(
 hash,color=>color,()=>0,(color,shade)=>({color,shade}),{apexGrassV1522Enabled:true});
for(const seed of [31,67,97]){
 for(const scale of [4.5,17,58]){
  for(const x of [-2,0,1,13]){
   for(const z of [-19,0,6]){
    const left=c.noise((x+1)*scale-0.01,z*scale+.39,scale,seed);
    const right=c.noise((x+1)*scale+0.01,z*scale+.39,scale,seed);
    assert.ok(Math.abs(left-right)<.0025,
     'grass noise discontinuity across tile seam: '+JSON.stringify({seed,scale,x,z,left,right}));
   }
  }
 }
}
let detail=false;
for(let x=1;x<46;x+=2){
 const value=c.tint('GRASS','#4e7650',x,12,45),adjacent=c.tint('GRASS','#4e7650',x+.05,12,45);
 assert.equal(value.color,'#4e7650');
 assert.ok(value.shade<=13&&value.shade>=-13,'CPU tint must preserve authored SVG colour');
 assert.ok(Math.abs(value.shade-adjacent.shade)<=1,'CPU shading should have no hard cell boundaries');
 if(value.shade!==0)detail=true;
}
assert.ok(detail,'grass should remain visibly modulated');
const water=c.tint('WATER','#226699',17,31,20);
assert.equal(water,'#226699','water colour must remain untouched');
assert.match(cpu,/const large=apexRoadTextureHashV15\(Math\.floor\(x\/2\.2\)/,
 'asphalt sampling remains unchanged');
const x=gpu.indexOf('function apexPhase5GpuProgram('),y=gpu.indexOf('function apexPhase5GpuGroundError(',x);
assert.ok(x>=0&&y>x);
const body=gpu.slice(x,y);
new vm.Script(body);
assert.match(body,/float grassPatchV1522/);
assert.match(body,/float warp=\(grassPatchV1522\(w\*0\.036/);
assert.match(body,/grassPatchV1522\(organicW\*2\.1\)/);
assert.match(body,/grassPatchV1522\(vec2\(organicW\.x\*11\.0,organicW\.y\*6\.5\)\)/);
assert.doesNotMatch(body,/groundHash\(floor\(w\*2\.1\)\)/);
assert.match(body,/grain=clamp\(grain,-0\.16,0\.16\)/);
assert.match(body,/uGrassTexture/);
assert.match(gpu,/apexSurfaceTintV152\('GRASS',fill,cellX,cellZ/);
console.log(JSON.stringify({test:'grass-organic-v1523-preview',seams:true,
 authoredSvgColor:true,cpuContinuous:true,gpuOrganic:true,asphaltUntouched:true,ok:true}));
