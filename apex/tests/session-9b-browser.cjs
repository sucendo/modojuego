/* 9B · Entradas reales de GP y Temporada + screenshots desktop/mobile */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext(mobile?
   {viewport:{width:844,height:390},isMobile:true,hasTouch:true}:
   {viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexSessionPlans9B&&!!window.ApexNativeWeekend9B&&
   !!window.ApexSessionPreparation9B&&document.getElementById('gpTrack')?.options.length>0,null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  await page.locator('[data-apex-mode="grandprix"]').click();
  await page.locator('#apexProtoNext').click();
  await page.locator('#apex9aCompLaunch').click();
  await page.waitForFunction(()=>!document.getElementById('weekendPanel').classList.contains('hidden'));
  assert.equal(await page.locator('#weekendStages .sessionStage').count(),5);
  await page.locator('#weekendActions .primary').click();
  assert.equal(await page.locator('#apex9bPreparation').isVisible(),true);
  assert.match(await page.locator('#apex9bTitle').innerText(),/ENTRENAMIENTOS LIBRES 1/);
  await page.locator('#apex9bWeatherSelect').selectOption('STORM');
  await page.locator('[data-tyre="SOFT"]').click();
  await page.locator('#apex9bProgram').selectOption('performance');
  await page.locator('#apex9bTargetLaps').fill('7');
  const before=await page.evaluate(()=>window.ApexNativeWeekend9B.snapshot());
  const plan=await page.evaluate(()=>window.ApexSessionPlans9B.getPlan(
   {mode:window.ApexNativeWeekend9B.snapshot().mode,spec:window.ApexNativeWeekend9B.snapshot().spec,round:window.ApexNativeWeekend9B.snapshot().round},'fp1'));
  assert.equal(plan.weatherSelection,'STORM');
  assert.equal(plan.program,'performance');assert.equal(plan.targetLaps,7);
  await page.locator('#apex9bPreparation').screenshot({path:'/tmp/apex-results/9b-'+(mobile?'mobile':'desktop')+'-fp1.png'});
  await page.locator('#apex9bCancel').click();
  await page.locator('#weekendActions .primary').click();
  assert.equal(await page.locator('#apex9bWeatherSelect').inputValue(),'STORM');
  assert.equal(await page.locator('#apex9bProgram').inputValue(),'performance');
  await page.locator('#apex9bCancel').click();
  assert.equal(await page.evaluate(()=>window.ApexNativeWeekend9B.snapshot().sessionIndex),before.sessionIndex);
  await page.locator('#weekendMenu').click();
  await page.locator('[data-apex-mode="season"]').click();
  await page.locator('#apexProtoNext').click();
  const roundBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('apex26canvas-v2')||'{}').round||0);
  await page.locator('#apex9aCompLaunch').click();
  await page.locator('#weekendActions .primary').click();
  assert.equal(await page.locator('#apex9bPreparation').isVisible(),true);
  await page.locator('#apex9bPreparation').screenshot({path:'/tmp/apex-results/9b-'+(mobile?'mobile':'desktop')+'-season.png'});
  await page.locator('#apex9bCancel').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apex26canvas-v2')||'{}').round||0),roundBefore);
  assert.deepEqual(errors.filter(e=>/SyntaxError|Cannot read properties|Unexpected end/.test(e)),[]);
  console.log(JSON.stringify({test:'apex-session-9b-browser',mobile,ok:true}));
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
