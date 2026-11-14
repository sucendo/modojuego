'use strict';
// V15.2 static regression. No frame-rate claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'parts/part-024-bridgefull-preview.txt'),'utf8'),
 render=fs.readFileSync(path.join(root,'parts/part-025-bridgefull-trees3d-preview.txt'),'utf8'),
 preview=fs.readFileSync(path.join(root,'perf6a-preview.html'),'utf8'),
 production=fs.readFileSync(path.join(root,'apex.html'),'utf8');
assert.match(preview,/part-024-bridgefull-preview\.txt/);
assert.match(preview,/part-025-bridgefull-trees3d-preview\.txt/);
assert.match(production,/url=perf6a-preview\.html/);
const part=(source,begin,end)=>{
 const a=source.indexOf(begin),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'missing: '+begin);const snippet=source.slice(a,b);
 new vm.Script(snippet);return snippet;
};
const material=part(render,'function apexSurfaceMaterialKindV152(', 'function apexPhase5PrepareGpuGround(');
const materialKind=new Function(material+'return apexSurfaceMaterialKindV152;')();
for(const name of ['GRASS','DRYGRASS','PARK','FOREST'])assert.equal(materialKind(name),1);
for(const name of ['ASPHALT','ROAD','CITY','PLAZA'])assert.equal(materialKind(name),2);
for(const name of ['GRAVEL','WATER','SAND','DIRT',''])assert.equal(materialKind(name),0);
assert.match(render,/zones\.push\(\{tris,color,kind:apexSurfaceMaterialKindV152\(it\.surfaceKind\)\}\)/);
assert.match(render,/const data=new Float32Array\(triangles\*24\)/);
assert.match(render,/data\[k\+7\]=zone\.kind/);
assert.match(render,/gl\.vertexAttribPointer\(s\.attrs\.material,1,gl\.FLOAT,false,32,28\)/);
assert.match(render,/gl\.vertexAttrib1f\(s\.attrs\.material,s\.grid\?\.tone==='BROWN'/);
assert.match(render,/apexPhase5GpuProgram\(gl,false,true\)/);
assert.match(render,/apexSvgTerrainBaseColorV152\(\)/);
assert.match(core,/td\._apexV152GrassSvgColor=apexRoadSvgNormalizeColorV15/);
assert.match(core,/td\._apexV152PitSvgColor=apexRoadSvgNormalizeColorV15/);
assert.match(core,/function apexSurfaceTintV152\(/);
assert.match(core,/function apexPitAsphaltColorV152\(/);
assert.match(render,/paved\?apexSurfaceTintV152\(d\.material\.kind\|\|'PITLANE'/);
assert.match(core,/apexSurfaceTintV152\(it\.surfaceKind,color,x,z,depth\)/);
assert.match(render,/get\('ground'\)!=='0'/);
const create=part(render,'function apexPhase5GpuProgram(', 'function apexPhase5GpuGroundError(');
const shaders=[],shaderFactory=new Function('webglCompile',create+'return apexPhase5GpuProgram;')(
 (gl,type,shader)=>{shaders.push(shader);return {}});
const fakeGl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,LINK_STATUS:3,
 createProgram:()=>({}),attachShader(){},linkProgram(){},deleteShader(){},
 getProgramParameter:()=>true,getAttribLocation:(_,k)=>k,getUniformLocation:(_,k)=>k};
let p=shaderFactory(fakeGl,false,true);
assert.equal(p.attrs.material,'aSurfaceKind');
assert.equal(p.uniforms.uGroundTexture,'uGroundTexture');
assert.match(shaders[0],/vGroundKind=aSurfaceKind/);
assert.match(shaders[1],/vGroundKind<1\.5/);
assert.match(shaders[1],/fwidth|dFdx/);
assert.match(shaders[1],/grassPatchV1522\(organicW\*0\.062\)/);
assert.match(shaders[1],/groundHash\(floor\(w\*20\.0\)\)/);
shaders.length=0;p=shaderFactory(fakeGl,false,false);
assert.equal(p.uniforms.uGroundTexture,undefined);
assert.doesNotMatch(shaders[1],/groundHash/,'non-ground rendering must stay unchanged');
const helper=part(core,'function apexGrassValueNoiseV1523(', 'function apexUnifiedGroundDrawCorridor(');
const tint=new Function('apexRoadSvgNormalizeColorV15','apexRoadTextureHashV15','apexWeatherWetFactor','shadeColor',
 helper+'return apexSurfaceTintV152;')(
 c=>c,(x,z,seed)=>(((x*173+z*397+seed*37)%97+97)%97)/97,()=>0,
 (color,n)=>color+':'+n);
assert.equal(tint('GRASS','#45804f',20,50,800),'#45804f','very distant Canvas LOD is flat');
assert.equal(tint('WATER','#115599',20,50,5),'#115599','unrelated materials remain exact');
assert.equal(tint('GRASS','#45804f',20,50,5),tint('GRASS','#45804f',20,50,5));
console.log(JSON.stringify({phase:'V15.2',grass:true,asphaltRunoff:true,pitSvg:true,terrainSvg:true,canvasFallback:true,glslWorldLod:true,prodUntouched:true,ok:true}));
