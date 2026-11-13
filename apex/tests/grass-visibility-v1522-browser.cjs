'use strict';
// Actual software WebGL2 pixel comparison, including longer-range grass visibility.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const modulePath=process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES&&path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
if(!modulePath)throw Error('PLAYWRIGHT_MODULE_PATH is required');
const {chromium}=require(modulePath),root=path.resolve(__dirname,'..'),
 shader=fs.readFileSync(path.join(root,'parts/part-025-bridgefull-trees3d-preview.txt'),'utf8');
const i=shader.indexOf('function apexPhase5GpuProgram('),j=shader.indexOf('function apexPhase5GpuGroundError(',i);
assert.ok(i>=0&&j>i,'static GPU shader not found');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:400,height:400}});
  const r=await page.evaluate(src=>{
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
   const gl=canvas.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false,depth:false});
   if(!gl)throw Error('WebGL2 unavailable');
   const compile=(gl,type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
   const program=new Function('webglCompile',src+'return apexPhase5GpuProgram;')(compile)(gl,false,true),u=program.uniforms,attrs=program.attrs;
   gl.disable(gl.DITHER);gl.viewport(0,0,256,256);gl.useProgram(program.program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.enableVertexAttribArray(attrs.world);gl.vertexAttribPointer(attrs.world,3,gl.FLOAT,false,12,0);
   gl.disableVertexAttribArray(attrs.color);gl.disableVertexAttribArray(attrs.material);
   gl.vertexAttrib4f(attrs.color,111/255,134/255,83/255,1);
   gl.uniform3f(u.uCamera,0,0,0);gl.uniform2f(u.uRight,1,0);gl.uniform2f(u.uForward,0,1);
   gl.uniform3f(u.uTilt,1,0,0);gl.uniform4f(u.uView,1,1,0,0);
   gl.uniform2f(u.uRoll,1,0);gl.uniform3f(u.uDepth,0,0,0);
   gl.uniform1f(u.uGroundTexture,1);gl.uniform1f(u.uGroundWet,0);
   const bytes=new Uint8Array(256*256*4);
   function paint(scale,kind,grassOn,wet=0){
    const v=new Float32Array([-6*scale,-6*scale,6*scale,
      6*scale,-6*scale,6*scale,-2*scale,2*scale,2*scale,2*scale,2*scale,2*scale]);
    gl.bufferData(gl.ARRAY_BUFFER,v,gl.STATIC_DRAW);
    gl.vertexAttrib1f(attrs.material,kind);
    gl.uniform1f(u.uGrassTexture,grassOn);gl.uniform1f(u.uGroundWet,wet);
    gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    const a=[];for(let y=36;y<220;y+=4)for(let x=36;x<220;x+=4)a.push(bytes[(y*256+x)*4]);
    return {samples:a,unique:new Set(a).size,mean:a.reduce((v,n)=>v+n,0)/a.length};
   }
   const rms=(a,b)=>Math.sqrt(a.samples.reduce((sum,v,i)=>sum+(v-b.samples[i])**2,0)/a.samples.length);
   const scales=[1,10,60,120],data=[];
   for(const k of scales){
    const flat=paint(k,1,0),visible=paint(k,1,1),wet=paint(k,1,1,1);
    data.push({scale:k,unique:visible.unique,flatUnique:flat.unique,
      contrast:+rms(visible,flat).toFixed(2),wetContrast:+rms(wet,flat).toFixed(2),
      meanShift:+(visible.mean-flat.mean).toFixed(2)});
   }
   const waterFlat=paint(12,0,0),waterTextured=paint(12,0,1);
   const roadWithGrassOff=paint(10,2,0),roadWithGrassOn=paint(10,2,1);
   const out={scales:data,waterDelta:+rms(waterTextured,waterFlat).toFixed(2),
    asphaltDelta:+rms(roadWithGrassOn,roadWithGrassOff).toFixed(2),glError:gl.getError()};
   gl.deleteBuffer(buffer);gl.deleteProgram(program.program);return out;
  },shader.slice(i,j));
  console.log(JSON.stringify({test:'grass-visibility-v1522-measurements',...r}));
  assert.equal(r.glError,0,'WebGL draw error');
  for(const m of r.scales){
   assert.equal(m.flatUnique,1,'grass=0 should remain flat');
   assert.ok(m.unique>=4,'grass must have pixel detail at world scale '+m.scale);
   assert.ok(m.contrast>2.3,'grass contrast too faint at world scale '+m.scale+': '+m.contrast);
   assert.ok(Math.abs(m.meanShift)<24,'SVG base must remain dominant');
   assert.ok(m.wetContrast<m.contrast*1.02,'wet grass must not amplify noise');
  }
  assert.equal(r.waterDelta,0,'water unaffected');
  assert.equal(r.asphaltDelta,0,'grass toggle does not affect asphalt');
  console.log(JSON.stringify({test:'grass-visibility-v1522-browser',
    device:process.env.APEX_AUDIT_DEVICE||'desktop',...r,ok:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});