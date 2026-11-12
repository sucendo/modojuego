'use strict';
// Real WebGL2 compilation + pixel test for the 6A asphalt fragment shader.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const modulePath=process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES&&path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
if(!modulePath)throw Error('PLAYWRIGHT_MODULE_PATH is required');
const {chromium}=require(modulePath);
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'parts/part-025-bridgefull-trees3d-preview.txt'),'utf8');
const i=source.indexOf('function apexPhase5GpuProgram('),j=source.indexOf('function apexPhase5GpuGroundError(',i);
assert.ok(i>=0&&j>i);
const functionCode=source.slice(i,j);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:400,height:400}});
  const result=await page.evaluate(code=>{
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
   const gl=canvas.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false,depth:false,stencil:false});
   if(!gl)throw Error('WebGL2 unavailable');
   const compile=(gl,type,src)=>{
    const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('GLSL compile: '+gl.getShaderInfoLog(shader));
    return shader;
   };
   const factory=new Function('webglCompile',code+'return apexPhase5GpuProgram;')(compile);
   const program=factory(gl,true);
   const bytes=new Uint8Array(256*256*4),u=program.uniforms;
   const vertices=new Float32Array([
    -6,-6,6, 6,-6,6, -2,2,2, 2,2,2
   ]);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
   gl.viewport(0,0,256,256);
   gl.disable(gl.DITHER); // Compare true grain, not default framebuffer dithering.
   gl.useProgram(program.program);
   gl.enableVertexAttribArray(program.attrs.world);
   gl.vertexAttribPointer(program.attrs.world,3,gl.FLOAT,false,0,0);
   gl.disableVertexAttribArray(program.attrs.color);
   gl.vertexAttrib4f(program.attrs.color,0.21,0.23,0.25,1);
   gl.uniform3f(u.uCamera,0,0,0);
   gl.uniform2f(u.uRight,1,0);gl.uniform2f(u.uForward,0,1);
   gl.uniform3f(u.uTilt,1,0,0);
   gl.uniform4f(u.uView,1,1,0,0);
   gl.uniform2f(u.uRoll,1,0);
   gl.uniform3f(u.uDepth,0,0,0);
   const paint=(grain,wet)=>{
    gl.uniform1f(u.uRoadTexture,grain);gl.uniform1f(u.uRoadWet,wet);
    gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    const r=[];for(let y=36;y<220;y+=4)for(let x=36;x<220;x+=4)r.push(bytes[(y*256+x)*4]);
    const avg=r.reduce((a,b)=>a+b,0)/r.length,
     std=Math.sqrt(r.reduce((a,b)=>a+(b-avg)**2,0)/r.length);
    return {red:r,average:avg,std,unique:new Set(r).size};
   };
   const flat=paint(0,0),dry=paint(1,0),wet=paint(1,1),curb=paint(0,1);
   const rms=(p,q)=>Math.sqrt(p.red.reduce((a,b,i)=>a+(b-q.red[i])**2,0)/p.red.length);
   const out={flatUnique:flat.unique,dryUnique:dry.unique,curbUnique:curb.unique,
    dryStd:Number(dry.std.toFixed(2)),flatStd:Number(flat.std.toFixed(2)),
    dryRms:Number(rms(dry,flat).toFixed(2)),wetRms:Number(rms(wet,flat).toFixed(2)),
    curbRms:Number(rms(curb,flat).toFixed(2)),glError:gl.getError()};
   gl.deleteProgram(program.program);gl.deleteBuffer(buffer);
   return out;
  },functionCode);
  assert.equal(result.glError,0,'real WebGL2 asphalt draw must be error-free');
  assert.equal(result.flatUnique,1,'texture-off material must be flat');
  assert.equal(result.curbUnique,1,'kerbs remain flat even with wetness');
  assert.ok(result.dryUnique>=5,'asphalt must show unmistakable pixel variation');
  assert.ok(result.dryRms>1.3,'the new asphalt cannot be an imperceptible per-segment tint');
  assert.ok(result.wetRms<result.dryRms*.7,'wet asphalt should lose grain contrast');
  assert.equal(result.curbRms,0,'painted kerbs must not change');
  console.log(JSON.stringify({test:'asphalt-fragment-v151-browser',device:process.env.APEX_AUDIT_DEVICE||'desktop',...result,ok:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
