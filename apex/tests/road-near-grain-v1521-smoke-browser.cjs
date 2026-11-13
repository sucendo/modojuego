'use strict';
// Integration smoke for the real assembled 6A preview, not a synthetic shader.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const modulePath=process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES&&path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
if(!modulePath)throw Error('PLAYWRIGHT_MODULE_PATH missing');
const {chromium}=require(modulePath),root=path.resolve(__dirname,'../..'),
 hook=fs.readFileSync(path.join(__dirname,'browser-hook.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const mobile=process.env.APEX_AUDIT_DEVICE==='mobile',page=await browser.newPage(mobile?
   {viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:720}});
  page.setDefaultTimeout(120000);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/parts/part-027.txt',async route=>{
   const body=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8'),
    at=body.lastIndexOf('requestAnimationFrame(loop);');
   assert.ok(at>=0);await route.fulfill({body:body.slice(0,at)+hook+body.slice(at),contentType:'text/plain'});
  });
  await page.goto('http://127.0.0.1:8765/apex/perf6a-preview.html');
  await page.waitForFunction(()=>window.__apexAudit,{timeout:120000});
  await page.evaluate(async()=>__apexAudit.load('01-australia',false));
  await page.waitForFunction(()=>{const r=window.apexAsphaltMaterialInfo?.();
   return r&&r.shader&&r.dynamicDrawCalls>0&&r.nearPatchTextured;},{timeout:90000});
  const result=await page.evaluate(()=>({
   material:apexAsphaltMaterialInfo(),
   phase6:apexPhase6RoadDiagnostics(),
   glError:webglState.gl?.getError(),
   backend:rendererBackendId(),
   race:mode
  }));
  assert.equal(result.backend,'webgl2');assert.equal(result.race,'race');
  assert.equal(result.glError,0,'6A WebGL must remain error-free');
  assert.ok(result.material.dynamicDrawCalls>0);
  assert.ok(result.material.nearPatchTextured);
  assert.ok(result.phase6.gpuSegments>0,'fixed road segments must stay on GPU');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({test:'road-near-grain-v1521-smoke',device:mobile?'mobile':'desktop',...result,ok:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
