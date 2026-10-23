/* APEX 9B season persistence and native progression.
 * Progression to round 2 uses the existing explicitly SIMULATED skip function.
 * It must not be confused with a played or completed physical race.
 */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',dialog=>dialog.accept());
 const enter=async()=>{await page.locator('[data-apex-mode="season"]').click();await page.locator('#apexProtoNext').click();await page.locator('#apex9aCompLaunch').click();await page.waitForFunction(()=>!!window.ApexNativeWeekend9B?.snapshot?.());};
 await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.ApexSessionPlans9B&&document.getElementById('gpTrack')?.options.length>0,null,{timeout:90000});
 await page.locator('#apex9aRace').click();
 const firstRound=await page.evaluate(()=>window.ApexNativeSeason9A.snapshot());
 const baseline=JSON.stringify(firstRound.drivers.map(d=>d.points));
 await enter();
 let w=await page.evaluate(()=>window.ApexNativeWeekend9B.snapshot());
 assert.equal(w.mode,'season');assert.equal(w.round,firstRound.round);
 const circuit=w.spec.dir;
 await page.locator('#weekendActions .primary').click();
 await page.locator('[data-tyre="SOFT"]').click();
 await page.locator('#apex9bProgram').selectOption('race-simulation');
 const first=await page.evaluate(()=>{
  const w=window.ApexNativeWeekend9B.snapshot(),ctx={mode:w.mode,spec:w.spec,round:w.round};
  return {event:window.ApexSessionPlans9B.forecast(ctx,'fp1').eventId,plan:window.ApexSessionPlans9B.getPlan(ctx,'fp1')};
 });
 assert.equal(first.plan.compound,'SOFT');
 await page.locator('#apex9bCancel').click();
 assert.equal(JSON.stringify((await page.evaluate(()=>window.ApexNativeSeason9A.snapshot())).drivers.map(d=>d.points)),baseline);
 await page.locator('#weekendMenu').click();
 await enter();
 assert.equal((await page.evaluate(()=>window.ApexNativeWeekend9B.snapshot())).spec.dir,circuit);
 await page.locator('#weekendActions .primary').click();
 assert.equal(await page.locator('#apex9bProgram').inputValue(),'race-simulation');
 await page.locator('#apex9bCancel').click();
 await page.reload();
 await page.waitForFunction(()=>!!window.ApexSessionPlans9B&&!!window.ApexNativeSeason9A&&document.getElementById('gpTrack')?.options.length>0,null,{timeout:90000});
 await page.locator('#apex9aRace').click();
 await enter();
 await page.locator('#weekendActions .primary').click();
 assert.equal(await page.locator('#apex9bProgram').inputValue(),'race-simulation');
 assert.equal(await page.locator('[data-tyre="SOFT"]').getAttribute('aria-pressed'),'true');
 await page.locator('#apex9bCancel').click();
 const resumed=await page.evaluate(()=>window.ApexNativeSeason9A.snapshot());
 assert.equal(resumed.round,firstRound.round);
 assert.equal(JSON.stringify(resumed.drivers.map(d=>d.points)),baseline,'No points for menus or reload');
 const team=resumed.seasonTeam;
 await page.getByRole('button',{name:'SALTAR GP COMPLETO'}).click();
 const after=await page.evaluate(()=>window.ApexNativeSeason9A.snapshot());
 assert.equal(after.round,firstRound.round+1,'Round advances from explicit native simulation');
 assert.equal(after.seasonTeam,team,'Locked team unchanged');
 await enter();
 w=await page.evaluate(()=>window.ApexNativeWeekend9B.snapshot());
 assert.equal(w.round,firstRound.round+1,'New weekend uses new native round');
 assert.notEqual(w.spec.dir,circuit);
 await page.locator('#weekendActions .primary').click();
 const second=await page.evaluate(()=>{
  const w=window.ApexNativeWeekend9B.snapshot(),ctx={mode:w.mode,spec:w.spec,round:w.round};
  return {event:window.ApexSessionPlans9B.forecast(ctx,'fp1').eventId,plan:window.ApexSessionPlans9B.getPlan(ctx,'fp1')};
 });
 assert.notEqual(second.event,first.event);
 assert.equal(second.plan.compound,'MEDIUM','Previous GP plan must not leak into new round');
 assert.equal(second.plan.program,'balanced');
 await page.locator('#apex9bCancel').click();
 assert.deepEqual(errors.filter(s=>/SyntaxError|TypeError|ReferenceError/.test(s)),[]);
 console.log(JSON.stringify({test:'apex-9b-season-persistence',mobile,roundStart:firstRound.round,roundEnd:after.round,method:'Native SIMULATED skip, not driven GP',ok:true}));
 await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
