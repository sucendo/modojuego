'use strict';
// V15.2.2 preview-only regression for visible grass in static, near-eye and CPU fallback paths.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const road=read('parts/part-025.txt'),core=read('parts/part-024.txt'),
 preview=read('apex.html'),main=read('index.html');
const snippet=(source,a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i);assert.ok(i>=0&&j>i,a);return source.slice(i,j)};
const shader=snippet(road,'function apexPhase5GpuProgram(', 'function apexPhase5GpuGroundError(');
const make=new Function('webglCompile',shader+'return apexPhase5GpuProgram;');
const programs=[],create=make((gl,type,src)=>{programs.push({type,src});return {}});
const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,LINK_STATUS:3,createProgram:()=>({}),
 attachShader(){},linkProgram(){},deleteShader(){},getProgramParameter:()=>true,
 getAttribLocation:(_,n)=>n,getUniformLocation:(_,n)=>n};
const material=create(gl,false,true),ground=programs[1].src;
assert.equal(material.uniforms.uGrassTexture,'uGrassTexture');
assert.match(ground,/grassPatchV1522\(w\*0\.018\)/); // Far meadow pattern survives on the horizon
assert.match(ground,/grassPatchV1522\(organicW\*0\.062\)/);
assert.match(ground,/grassPatchV1522\(organicW\*0\.25\)/);
assert.match(ground,/grain\*=uGrassTexture/);
assert.match(ground,/farFade=1\.0-smoothstep\(13\.0,34\.0,px\)/);
assert.match(ground,/uGroundTexture>0\.001&&vGroundKind>0\.5/);
programs.length=0;
const asphalt=create(gl,true,false);
assert.equal(asphalt.uniforms.uGrassTexture,undefined,'grass changes must not touch road shader');
assert.doesNotMatch(programs[1].src,/grassPatchV1522/);
const start=road.indexOf('function webglPushTerrainPlateMesh('),
 terrain=road.slice(start,road.indexOf('window.apexPhase11Diagnostics=',start));
assert.match(terrain,/g\.tone!=='GREEN'\|\|window\.apexGrassV1522NearGpuEnabled===false/);
assert.match(terrain,/kind==='PORTAL'\|\|kind==='TUNNEL'/);
assert.match(terrain,/apexSurfaceTintV152\('GRASS',fill,cellX,cellZ/);
assert.match(road,/window\.apexGrassV1522Enabled=.*URLSearchParams/);
assert.match(road,/get\('grassNearGpu'\)!=='0'/);
assert.equal((road.match(/gl\.uniform1f\(u\.uGrassTexture,window\.apexGrassV1522Enabled===false\?0:1\)/g)||[]).length,2);
assert.match(core,/function apexSurfaceTintV152\(/);
const tintStart=core.indexOf('function apexGrassValueNoiseV1523('),
 tintEnd=core.indexOf('function apexUnifiedGroundDrawCorridor(',tintStart);
const fn=new Function('apexRoadSvgNormalizeColorV15','apexRoadTextureHashV15','apexWeatherWetFactor','shadeColor',
 core.slice(tintStart,tintEnd)+'return apexSurfaceTintV152;')(
 c=>c,(x,z,seed)=>((x*179+z*389+seed*23)%101+101)%101/101,()=>0,(color,amount)=>color+':'+amount);
assert.equal(fn('GRASS','#6f8653',0,0,800),'#6f8653','very far CPU fallback stays unmodified');
assert.equal(fn('WATER','#164399',0,0,20),'#164399','water stays unmodified');
assert.equal(fn('SAND','#bb9966',0,0,20),'#bb9966','sand stays unmodified');
assert.equal(fn('GRASS','#6f8653',25,20,200),fn('GRASS','#6f8653',25,20,200),'fallback is world anchored');
assert.match(core,/td\._apexV152GrassSvgColor=apexRoadSvgNormalizeColorV15/,'SVG authored green still wins');
console.log(JSON.stringify({test:'grass-visibility-v1522-preview',multiscale:true,
 nearGPU:true,portalFallback:true,cpuFallback:true,svgColorPreserved:true,
 roadUntouched:true,ok:true}));