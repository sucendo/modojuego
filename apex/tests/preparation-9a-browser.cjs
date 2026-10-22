/* APEX 9A.2 · Browser smoke test for preparation of real quick race and practice. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:720}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ApexPreparation9A&&document.getElementById('apex9aRace')&&
    document.getElementById('menuTyreCompound')?.options.length>0,null,{timeout:90000});
  await page.screenshot({path:'/tmp/apex-results/9a-'+(mobile?'mobile':'desktop')+'-home.png'});
  await page.locator('#apex9aRace').click();
  await page.screenshot({path:'/tmp/apex-results/9a-'+(mobile?'mobile':'desktop')+'-modes.png'});
  await page.locator('#start').click();
  await page.waitForFunction(()=>ApexPreparation9A.isOpen());
  await page.screenshot({path:'/tmp/apex-results/9a-'+(mobile?'mobile':'desktop')+'-preparation.png'});
  assert.match(await page.locator('#apex9aPrepTitle').textContent(),/CARRERA/);
  const tyres=page.locator('#apex9aTyres .apex9aTyre');
  assert.ok(await tyres.count()>=3,'Real compound choices must be available');
  const logo=page.locator('#apex9aLanding img[src*="logo-apex26"]');
  const logoOk=await logo.evaluate(img=>img.complete&&img.naturalWidth>0);
  assert.equal(logoOk,true,'Approved logo must load');
  const imagesLoaded=await page.locator('#apex9aTyres img').evaluateAll(imgs=>imgs.length>=3&&imgs.every(x=>x.complete&&x.naturalWidth>0));
  assert.equal(imagesLoaded,true,'Transparent approved tyre images must load without 404');
  const first=tyres.first();
  const key=await first.getAttribute('data-compound');
  await first.click();
  assert.equal(await page.locator('#menuTyreCompound').inputValue(),key);
  assert.notEqual(await page.locator('#apex9aStrategyRow').getAttribute('hidden'),'');
  await page.locator('#apex9aCancel').click();
  assert.equal(await page.evaluate(()=>ApexPreparation9A.isOpen()),false);
  await page.locator('#menuModeTabs [data-t="practice"]').click();
  await page.locator('#practiceStart').click();
  await page.waitForFunction(()=>ApexPreparation9A.isOpen());
  assert.match(await page.locator('#apex9aPrepTitle').textContent(),/ENTRENAMIENTO/);
  assert.equal(await page.locator('#apex9aStrategyRow').getAttribute('hidden'),'');
  await page.locator('#apex9aCancel').click();
  assert.equal(await page.evaluate(()=>ApexPreparation9A.isOpen()),false);
  assert.deepEqual(errors.filter(s=>/SyntaxError|Unexpected end of input|Cannot read properties/.test(s)),[]);
  console.log(JSON.stringify({test:'apex-9a-preparation',mobile,tyres:await tyres.count(),ok:true}));
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
