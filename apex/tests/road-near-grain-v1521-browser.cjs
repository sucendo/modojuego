'use strict';
// Pixel proof: banked/elevated road crossing the WebGL near plane remains textured.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const playwright=process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES&&path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
if(!playwright)throw Error('PLAYWRIGHT_MODULE_PATH missing');
const {chromium}=require(playwright),root=path.resolve(__dirname,'..'),
 source=fs.readFileSync(path.join(root,'parts/part-025-bridgefull-trees3d-preview.txt'),'utf8');
const a=source.indexOf('function apexPhase5GpuProgram('),b=source.indexOf('function apexPhase5GpuGroundError(',a);
assert.ok(a>=0&&b>a);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:320,height:320}});
  const measured=await page.evaluate(code=>{
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
   const gl=canvas.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false,depth:false});
   if(!gl)throw Error('WebGL2 unavailable');
   const compile=(g,type,source)=>{
    const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);
    if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;
   };
   const program=new Function('webglCompile',code+'return apexPhase5GpuProgram;')(compile)(gl,true);
   gl.viewport(0,0,256,256);gl.disable(gl.DITHER);
   gl.useProgram(program.program);
   const u=program.uniforms;
   const n=.45,f=2200;
   gl.uniform3f(u.uCamera,0,0,0);gl.uniform2f(u.uRight,1,0);gl.uniform2f(u.uForward,0,1);
   gl.uniform3f(u.uTilt,1,0,0);gl.uniform4f(u.uView,1,1,0,0);
   gl.uniform2f(u.uRoll,1,0);gl.uniform3f(u.uDepth,(f+n)/(f-n),2*f*n/(f-n),0);
   const floats=new Float32Array([
    // A banked, rising ribbon; first two vertices are behind the eye.
    -7,-1,-3, 7,1,-3, 7,4,24,
    -7,-1,-3, 7,4,24, -7,2,24
   ]);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,floats,gl.STATIC_DRAW);
   gl.enableVertexAttribArray(program.attrs.world);
   gl.vertexAttribPointer(program.attrs.world,3,gl.FLOAT,false,12,0);
   gl.disableVertexAttribArray(program.attrs.color);
   gl.vertexAttrib4f(program.attrs.color,.22,.24,.26,1);
   const out=new Uint8Array(256*256*4);
   function paint(intensity){
    gl.uniform1f(u.uRoadTexture,intensity);gl.uniform1f(u.uRoadWet,0);
    gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES,0,6);
    gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,out);
    return out.slice();
   }
   const flat=paint(0),textured=paint(1);
   let count=0,delta=0,changed=0,unique=new Set(),samples=0;
   for(let i=0;i<flat.length;i+=4){
    if(flat[i]<12)continue;
    count++;
    const d=Math.abs(flat[i]-textured[i]);delta+=d*d;
    if(d>1)changed++;unique.add(textured[i]);
   }
   const rms=Math.sqrt(delta/Math.max(1,count));
   const glError=gl.getError();
   gl.deleteBuffer(buffer);gl.deleteProgram(program.program);
   return {visiblePixels:count,changedPixels:changed,grainUnique:unique.size,rms:+rms.toFixed(2),glError};
  },source.slice(a,b));
  assert.equal(measured.glError,0);
  assert.ok(measured.visiblePixels>100,'clipped banked ribbon must remain visible');
  assert.ok(measured.grainUnique>=5,'banked asphalt must have fine grain');
  assert.ok(measured.changedPixels>100,'texture must affect enough near-plane pixels');
  assert.ok(measured.rms>1.0,'near camera material must not become an imperceptible plain patch');
  console.log(JSON.stringify({test:'road-near-grain-v1521-browser',device:process.env.APEX_AUDIT_DEVICE||'desktop',...measured,ok:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
