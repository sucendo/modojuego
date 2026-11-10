/* APEX · Smoke real de los ocho circuitos extra por sesión.
 * No sustituye la simulación de vueltas completas ni certifica FPS de GPU real.
 * Serve root: python3 -m http.server 8765
 * APEX_EXTRA_SET=first|second; APEX_AUDIT_DEVICE=desktop|mobile
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
const root=path.resolve(__dirname,'../..');
const hook=fs.readFileSync(path.join(__dirname,'browser-hook.js'),'utf8');
const sessions=['freepractice','fp1','fp2','fp3','qualifying','race'];
(async()=>{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const ctx=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:720}});
  const page=await ctx.newPage(),errors=[];
  page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('dialog',async d=>{errors.push(d.message());await d.dismiss();});
  await page.route('**/parts/part-027.txt',async route=>{
   const src=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8');
   const at=src.lastIndexOf('requestAnimationFrame(loop);');assert.ok(at>=0);
   await route.fulfill({body:src.slice(0,at)+hook+src.slice(at),contentType:'text/plain'});
  });
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__apexAudit&&document.getElementById('gpTrack')?.options.length===31,null,{timeout:120000});
  const selectable=await page.evaluate(()=>['track','gpTrack','practiceTrack'].map(id=>document.getElementById(id).options.length));
  assert.deepEqual(selectable,[31,31,31]);
  const all=await page.evaluate(()=>__apexAudit.circuits()),extra=await page.evaluate(()=>__apexAudit.extraCircuits());
  assert.equal(all.length,31);assert.equal(extra.length,8);
  const group=process.env.APEX_EXTRA_SET||'all';
  const selected=group==='first'?extra.slice(0,4):group==='second'?extra.slice(4):extra;
  const rows=[];
  for(const dir of selected)for(const session of sessions){
   await page.evaluate(async({dir,session})=>__apexAudit.load(dir,false,session),{dir,session});
   await page.waitForFunction(()=>__apexAudit.snapshot().simulationSeconds>0.08,null,{timeout:30000});
   const state=await page.evaluate(()=>__apexAudit.snapshot());
   assert.equal(state.circuit,dir);
   assert.equal(state.session,session);
   assert.equal(state.mode,'race');
   assert.equal(state.backend,'webgl2');
   assert.equal(state.glError,0,'WebGL error '+dir+'/'+session);
   assert.equal(state.contextLost,false);
   assert.equal(state.rivals,21);
   assert.ok(state.state&&Object.values(state.state).every(Number.isFinite),'Non-finite state '+dir+'/'+session);
   assert.equal(await page.evaluate(()=>__apexAudit.stop()),true);
   assert.deepEqual(errors,[],'JS errors '+dir+'/'+session);
   rows.push({dir,session,ok:true});
   console.log(JSON.stringify({test:'extra-session-smoke',mobile,dir,session,ok:true}));
  }
  console.log(JSON.stringify({test:'extra-circuits-browser',mobile,group,circuits:selected.length,sessions:sessions.length,checks:rows.length,ok:true,limits:'Load/spawn/physics/HUD/renderer; no full laps or authored pit-service validation'}));
  await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
