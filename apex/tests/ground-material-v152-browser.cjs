'use strict';
// Software-WebGL2 pixel proof of V15.2 materials. No real-device FPS claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const playwright=process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES&&path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
if(!playwright)throw Error('PLAYWRIGHT_MODULE_PATH missing');
const {chromium}=require(playwright);
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'parts/part-025.txt'),'utf8');
const a=src.indexOf('function apexPhase5GpuProgram('),b=src.indexOf('function apexPhase5GpuGroundError(',a);
assert.ok(a>=0&&b>a);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:360,height:360}});
  const result=await p.evaluate(code=>{
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
   const gl=canvas.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false,depth:false});
   if(!gl)throw Error('WebGL2 not available');
   const compile=(g,type,src)=>{const shader=g.createShader(type);g.shaderSource(shader,src);g.compileShader(shader);if(!g.getShaderParameter(shader,g.COMPILE_STATUS))throw Error('GLSL: '+g.getShaderInfoLog(shader));return shader};
   const shaderFactory=new Function('webglCompile',code+'return apexPhase5GpuProgram;')(compile);
   const shader=shaderFactory(gl,false,true),u=shader.uniforms,attrs=shader.attrs;
   const verts=new Float32Array([-6,-6,6, 6,-6,6, -2,2,2, 2,2,2]);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
   gl.viewport(0,0,256,256);gl.disable(gl.DITHER);gl.useProgram(shader.program);
   gl.enableVertexAttribArray(attrs.world);gl.vertexAttribPointer(attrs.world,3,gl.FLOAT,false,12,0);
   gl.disableVertexAttribArray(attrs.color);
   gl.disableVertexAttribArray(attrs.material);
   gl.uniform3f(u.uCamera,0,0,0);gl.uniform2f(u.uRight,1,0);gl.uniform2f(u.uForward,0,1);
   gl.uniform3f(u.uTilt,1,0,0);gl.uniform4f(u.uView,1,1,0,0);
   gl.uniform2f(u.uRoll,1,0);gl.uniform3f(u.uDepth,0,0,0);
   const pixels=new Uint8Array(256*256*4);
   function paint(kind,texture,wet,colour){
    gl.vertexAttrib1f(attrs.material,kind);
    gl.vertexAttrib4f(attrs.color,...colour,1);
    gl.uniform1f(u.uGroundTexture,texture);gl.uniform1f(u.uGroundWet,wet);gl.uniform1f(u.uGrassTexture,1);
    gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    gl.readPixels(0,0,256,256,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    const a=[];for(let y=36;y<220;y+=4)for(let x=36;x<220;x+=4)a.push(pixels[(y*256+x)*4]);
    return {data:a,unique:new Set(a).size};
   }
   const green=[.28,.52,.32],blue=[.23,.35,.65];
   const grassFlat=paint(1,0,0,green),grass=paint(1,1,0,green),grassWet=paint(1,1,1,green);
   const blueFlat=paint(2,0,0,blue),blueRunoff=paint(2,1,0,blue),blueWet=paint(2,1,1,blue),water=paint(0,1,0,blue);
   const rms=(x,y)=>Math.sqrt(x.data.reduce((n,v,i)=>n+(v-y.data[i])**2,0)/x.data.length);
   const data={grassPixels:grass.unique,grassFlatPixels:grassFlat.unique,
    grassContrast:+rms(grass,grassFlat).toFixed(2),grassWetContrast:+rms(grassWet,grassFlat).toFixed(2),
    blueRunoffPixels:blueRunoff.unique,blueFlatPixels:blueFlat.unique,
    blueContrast:+rms(blueRunoff,blueFlat).toFixed(2),blueWetContrast:+rms(blueWet,blueFlat).toFixed(2),
    waterDelta:+rms(water,blueFlat).toFixed(2),glError:gl.getError()};
   gl.deleteBuffer(buffer);gl.deleteProgram(shader.program);return data;
  },src.slice(a,b));
  assert.equal(result.glError,0,'WebGL2 material draw error');
  assert.equal(result.grassFlatPixels,1,'texture off must be flat green');
  assert.equal(result.blueFlatPixels,1,'texture off must be flat blue');
  assert.ok(result.grassPixels>=5&&result.grassContrast>1.2,'grass must have visible pixel grain');
  assert.ok(result.blueRunoffPixels>=5&&result.blueContrast>1.2,'blue SVG asphalt must retain colour and show real grain');
  assert.ok(result.grassWetContrast<result.grassContrast,'wet grass must be calmer');
  assert.ok(result.blueWetContrast<result.blueContrast*.8,'wet runoff must lose asphalt grain');
  assert.equal(result.waterDelta,0,'water/other surfaces must not get grass or asphalt texture');
  console.log(JSON.stringify({test:'ground-material-v152-browser',device:process.env.APEX_AUDIT_DEVICE||'desktop',...result,ok:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
