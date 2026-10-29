'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 try{
  const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html');
  await page.waitForFunction(()=>window.ApexSponsorTextures&&Object.keys(window.ApexSponsorTextures.assets).every(k=>window.ApexSponsorTextures.entry(k)?.status!=='loading'),{timeout:30000});
  const result=await page.evaluate(()=>{
   const api=window.ApexSponsorTextures,gl=document.createElement('canvas').getContext('webgl2');
   if(!gl)return{error:'WebGL2 unavailable'};
   const list=[];
   for(const name of Object.keys(api.assets)){
    const item=api.entry(name),texture=api.ensureTexture(gl,name);
    list.push({name,status:item.status,texture:!!texture,width:item.width,height:item.height});
   }
   return{list,glError:gl.getError(),loaded:api.state.loaded,uploads:api.state.uploads,bytes:api.state.bytes,
    filters:!!gl.getExtension('EXT_texture_filter_anisotropic')};
  });
  assert.ok(!result.error,JSON.stringify(result));
  assert.equal(result.glError,0);
  assert.equal(result.loaded,7);
  assert.equal(result.uploads,7);
  for(const item of result.list){assert.equal(item.status,'ready',item.name);assert.equal(item.texture,true,item.name);}
  assert.deepEqual(errors,[],'Runtime script errors');
  console.log(JSON.stringify({test:'sponsor-textures-browser',mobile,ok:true,...result}));
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
