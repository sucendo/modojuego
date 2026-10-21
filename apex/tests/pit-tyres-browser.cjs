/* Complete real production pit cycle + same-host render comparison.
   Software Chromium/mobile emulation are NOT physical GPU/phone benchmarks. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
const root=path.resolve(__dirname,'../..'),hook=fs.readFileSync(path.join(__dirname,'pit-tyres-hook.js'),'utf8'),ref=process.env.APEX_PIT_BASELINE_REF||'36fd9f591f6c2c26d7946a551e45d7108369678a';
const output=process.env.APEX_PIT_RESULTS||'/tmp/apex-pit-results';fs.mkdirSync(output,{recursive:true});
const variants={};for(const variant of ['baseline','candidate'])variants[variant]=Array.from({length:28},(_,i)=>{const p=`apex/parts/part-${String(i).padStart(3,'0')}.txt`;return variant==='baseline'?cp.execFileSync('git',['show',`${ref}:${p}`],{cwd:root,encoding:'utf8',maxBuffer:15e6}):fs.readFileSync(path.join(root,p),'utf8')});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const mobile=process.env.APEX_AUDIT_DEVICE==='mobile',context=await browser.newContext(mobile?{viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}:{viewport:{width:1280,height:720}});
  await context.addInitScript(()=>{let seed=260820;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>{errors.push(e.message);console.log(JSON.stringify({test:'pit-page-error',message:e.message}))});page.on('dialog',async d=>{errors.push(d.message());await d.dismiss()});
  let variant='baseline';await page.route('**/parts/part-*.txt',async route=>{const i=Number(new URL(route.request().url()).pathname.match(/part-(\d+)\.txt$/)[1]);let body=variants[variant][i];if(i===27){const at=body.lastIndexOf('requestAnimationFrame(loop);');assert.ok(at>=0);body=body.slice(0,at)+hook+body.slice(at)}await route.fulfill({body,contentType:'text/plain'})});
  const url=process.env.APEX_AUDIT_URL||'http://127.0.0.1:8765/apex/apex.html?perf=1',perf=[];
  for(variant of ['baseline','candidate']){await page.goto(url);await page.waitForFunction(()=>window.__apexPitAudit);await page.evaluate(()=>__apexPitAudit.setDistance(100));await page.evaluate(()=>__apexPitAudit.load('14-spain','CLEAR',true));await page.waitForTimeout(8000);const row=await page.evaluate(()=>__apexPitAudit.perf());perf.push({variant,mobileEmulation:mobile,...row});console.log(JSON.stringify({test:'pit-render-perf',...perf.at(-1)}));assert.equal(row.rivals,21);assert.ok(row.summary.frames>0);await page.evaluate(()=>__apexPitAudit.stop())}
  console.log(JSON.stringify({test:'pit-render-comparison',baseline:ref,mobileEmulation:mobile,rows:perf,limitation:'Software renderer and short rolling windows; not a hardware FPS certification'}));
  await page.evaluate(()=>__apexPitAudit.setDistance(25));
  const failures=[],restrictions=[];
  const dirs=(process.env.APEX_PIT_CIRCUITS||'14-spain,06-monaco,10-belgium,13-italy,03-japan').split(',');variant='candidate';
  for(const dir of dirs){try{
   console.log(JSON.stringify({test:'pit-case-start',dir,mobileEmulation:mobile}));
   const loaded=await page.evaluate(dir=>__apexPitAudit.load(dir),dir);if(!loaded.available){assert.equal(dir,'10-belgium');assert.equal(loaded.reason,'UNSAFE_PIT_GEOMETRY');assert.equal(loaded.issue.code,'REVERSED_SHORT_PIT_SEGMENT');restrictions.push(loaded);const denied=await page.evaluate(()=>__apexPitAudit.request());assert.equal(denied.pit.pitStops,0);assert.equal(denied.phase,null);console.log(JSON.stringify({test:'pit-geometry-limitation',...loaded}));continue;}assert.equal(loaded.rivals,21);
   await page.keyboard.press('KeyY');assert.equal((await page.evaluate(()=>__apexPitAudit.status())).paused,false);assert.equal(await page.locator('#pitNextCompound').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');assert.equal(await page.locator('#pitStrategyPanel').evaluate(el=>el.classList.contains('hidden')),true);await page.keyboard.press('KeyY');await page.locator('#pitNextCompound').selectOption('HARD');
   const request=await page.evaluate(()=>__apexPitAudit.request());assert.equal(request.pit.nextCompound,'HARD');
   const result=await page.evaluate(()=>__apexPitAudit.run(180));
   fs.writeFileSync(path.join(output,`${mobile?'mobile':'desktop'}-${dir}.json`),JSON.stringify({loaded,...result},null,2));await page.screenshot({path:path.join(output,`${mobile?'mobile':'desktop'}-${dir}.png`)});
   console.log(JSON.stringify({test:'pit-complete-cycle',dir,mobileEmulation:mobile,loaded,...result,samples:undefined}));
   assert.equal(result.completed,true,`${dir}: ${JSON.stringify(result.end)}`);assert.equal(result.end.tyres.compound,'HARD');assert.equal(result.end.pit.pitStops,1);assert.equal(result.end.pit.tyreSet,2);assert.equal(result.end.pit.history.length,1);
   assert.equal(result.service.tyres.front.wear,0);assert.equal(result.service.tyres.rear.wear,0);assert.ok(result.service.tyres.distance<.01);assert.ok(Math.abs(result.service.tyres.front.surfaceTemperature-80)<.1);
   assert.equal(result.end.network,'TRACK');assert.equal(result.end.faults,0);assert.ok(result.maxMove<1.2);assert.ok(result.maxProgressJump<5);assert.ok(result.maxLaneKph<=loaded.plan.speedKph+.05);
   assert.equal(result.end.lap-result.start.lap,result.finishCrossings);assert.ok(result.end.total>result.start.total);assert.ok(result.phases.some(p=>p.phase==='SERVICE'));assert.ok(result.phases.some(p=>p.phase==='EXITING'));assert.deepEqual(errors,[]);
  }catch(e){failures.push({dir,error:e.message});console.log(JSON.stringify({test:'pit-case-failure',dir,error:e.message}))}}
  // Rain recommendation and real wet installation are covered separately from dry S->H.
  try{await page.evaluate(()=>__apexPitAudit.load('13-italy','RAIN'));await page.keyboard.press('KeyY');await page.locator('#pitNextCompound').selectOption('INTERMEDIATE');await page.evaluate(()=>__apexPitAudit.request());const wet=await page.evaluate(()=>__apexPitAudit.run(180));console.log(JSON.stringify({test:'pit-wet-cycle',mobileEmulation:mobile,completed:wet.completed,end:wet.end}));assert.equal(wet.completed,true);assert.equal(wet.end.tyres.compound,'INTERMEDIATE');assert.deepEqual(errors,[]);}catch(e){failures.push({dir:'RAIN',error:e.message});console.log(JSON.stringify({test:'pit-case-failure',dir:'RAIN',error:e.message}))}
  for(const device of ['keyboard','touch','gyro']){try{
   await page.evaluate(()=>__apexPitAudit.load('13-italy'));await page.evaluate(device=>__apexPitAudit.manualFixture(device),device);
   if(device==='keyboard'){await page.locator('body').click({position:{x:5,y:5}});await page.keyboard.down('ArrowUp')}
   if(device==='touch')await page.locator('#gas').dispatchEvent('pointerdown',{pointerId:8,pointerType:'touch',isPrimary:true});
   const result=await page.evaluate(()=>__apexPitAudit.manualService());
   if(device==='keyboard')await page.keyboard.up('ArrowUp');if(device==='touch')await page.locator('#gas').dispatchEvent('pointerup',{pointerId:8,pointerType:'touch',isPrimary:true});
   console.log(JSON.stringify({test:'pit-manual-service',mobileEmulation:mobile,device,...result}));
   assert.ok(result.installed,device+': service did not finish');assert.equal(result.after.tyres.compound,'HARD');assert.equal(result.after.driving,'MANUAL');assert.equal(result.after.pit.pitStops,1);assert.equal(result.after.faults,0);assert.ok(result.after.speed>0,device+': inputs not restored');
  }catch(e){failures.push({dir:device,error:e.message});console.log(JSON.stringify({test:'pit-case-failure',dir:device,error:e.message}))}}
  assert.deepEqual(failures,[]);
  console.log(JSON.stringify({test:'pit-browser-success',mobileEmulation:mobile,completedCircuits:dirs.length-restrictions.length,restrictedCircuits:restrictions.map(x=>x.dir),rain:true}));await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
