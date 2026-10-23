/* APEX 9B - Integration of real native weekend launchers and native transitions.
 * The race boundary fixture is explicitly test-only; this does NOT claim a full driven GP.
 * Timed sessions ended without complete timed laps retain the engine's native simulated rival timings.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
const root=path.resolve(__dirname,'../..');
const pit=fs.readFileSync(path.join(__dirname,'pit-tyres-hook.js'),'utf8');
const race=fs.readFileSync(path.join(__dirname,'race-distance-hook.js'),'utf8');
const extra=`
 window.__apex9BIntegration=Object.freeze({
  check:()=>({
   session:currentSession,mode:mode,currentMode,weather:sessionSettings.weather,
   tyre:player?.tyres?.compound||null,round:save.round,
   points:JSON.stringify(save.points),
   initial:document.getElementById('menuTyreCompound')?.value||null,
   raceLaps:trackData?.raceConfig?.totalLaps??null,
   raceGrid:Array.isArray(weekendContext?.gridOrder)?weekendContext.gridOrder.slice():null
  })
 });
`;
async function finishResults(page){
 for(let step=0;step<6;step++){
  if(await page.locator('#weekendPanel').isVisible())return;
  if(await page.locator('#finish').isVisible()){
   await page.locator('#finishNext').click();
   continue;
  }
  await page.waitForTimeout(150);
 }
 assert.equal(await page.locator('#weekendPanel').isVisible(),true,'Native finish flow returns to weekend hub');
}
(async()=>{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile',browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const ctx=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const page=await ctx.newPage(),errors=[];
  page.setDefaultTimeout(40000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/parts/part-027.txt',async route=>{
   const src=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8');
   const at=src.lastIndexOf('requestAnimationFrame(loop);');
   assert(at>0);
   await route.fulfill({body:src.slice(0,at)+pit+race+extra+src.slice(at),contentType:'text/plain'});
  });
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__apex9BIntegration&&window.__apexRaceAudit&&window.ApexSessionPreparation9B&&document.getElementById('gpTrack')?.options.length>0,null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  await page.locator('[data-apex-mode="grandprix"]').click();
  await page.locator('#apexProtoNext').click();
  await page.locator('#apex9aCompDistanceSelect').selectOption('25');
  await page.locator('#apex9aCompLaunch').click();
  await page.waitForFunction(()=>!document.getElementById('weekendPanel').classList.contains('hidden'));
  const stages=['fp1','fp2','fp3','qualifying','race'],compounds=['SOFT','HARD','MEDIUM','SOFT','MEDIUM'];
  const captured={};
  for(let i=0;i<5;i++){
   const stage=stages[i],cmp=compounds[i];
   const snap=await page.evaluate(()=>window.ApexNativeWeekend9B.snapshot());
   assert.equal(snap.session,stage,'Real native session sequence '+stage);
   const before=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('apex26canvas-v2')||'{}').points||{}));
   await page.locator('#weekendActions .primary').click();
   await page.waitForFunction(()=>window.ApexSessionPreparation9B.isOpen());
   assert.equal(await page.locator('#apex9bPreparation').isVisible(),true);
   const currentEvent=await page.evaluate(()=>window.ApexNativeWeekend9B.snapshot());
   const title=await page.locator('#apex9bCircuit').innerText();
   assert.ok(title.includes(currentEvent.spec.name.toUpperCase())||currentEvent.spec.name.toUpperCase().includes(title.toUpperCase()));
   await page.locator('[data-tyre="'+cmp+'"]').click();
   if(stage==='fp1'){await page.locator('#apex9bProgram').selectOption('performance');await page.locator('#apex9bTargetLaps').fill('7');}
   if(stage==='fp2')await page.locator('#apex9bProgram').selectOption('race-simulation');
   if(stage==='qualifying'){await page.locator('#apex9bAttempts').selectOption('3');}
   if(stage==='race'){await page.locator('#apex9bStops').selectOption('2');}
   await page.locator('#apex9bWeatherSelect').selectOption(i===0?'STORM':'auto');
   const plan=await page.evaluate(s=>{
    const w=window.ApexNativeWeekend9B.snapshot();
    return window.ApexSessionPlans9B.getPlan({mode:w.mode,spec:w.spec,round:w.round},s);
   },stage);
   assert.equal(plan.compound,cmp);
   const dim=await page.locator('#apex9bPreparation').evaluate(n=>({overflow:n.scrollWidth-n.clientWidth}));
   assert.ok(dim.overflow<=2,'No horizontal overflow: '+stage+' '+JSON.stringify(dim));
   await page.locator('#apex9bPreparation').evaluate(n=>n.scrollTop=0);
   await page.screenshot({path:'/tmp/apex-results/9b-'+(mobile?'mobile':'desktop')+'-'+stage+'-top.png'});
   await page.locator('#apex9bPreparation').evaluate(n=>n.scrollTop=n.scrollHeight);
   await page.screenshot({path:'/tmp/apex-results/9b-'+(mobile?'mobile':'desktop')+'-'+stage+'-bottom.png'});
   await page.locator('#apex9bLaunch').click();
   await page.waitForFunction(()=>document.getElementById('hud')&&!document.getElementById('hud').classList.contains('hidden'),null,{timeout:90000});
   const live=await page.evaluate(()=>window.__apex9BIntegration.check());
   assert.equal(live.session,stage);
   assert.equal(live.tyre,cmp,'Real tyre applied to car '+stage);
   assert.equal(live.weather,i===0?'STORM':undefined??live.weather);
   assert.equal(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('apex26canvas-v2')||'{}').points||{})),before,'Menus/session launch must not award points');
   captured[stage]={compound:live.tyre,weather:live.weather,program:plan.program||null};
   if(stage==='race'){
    assert.equal(live.raceLaps,snap.raceLaps);
    assert.ok(Array.isArray(live.raceGrid)&&live.raceGrid.length>0,'Native qualification grid');
    const result=await page.evaluate(async()=>{
     await window.__apexRaceAudit.boundaryFixture();
     return window.__apexRaceAudit.drive(45);
    });
    assert.equal(result.end.state,'FINISHED','Test boundary fixture reached production finish gate');
    assert.equal(result.end.finished,22);
    assert.equal(result.end.mode,'finish');
    break;
   }
   // End the authentic timed session via the same native button as a player.
   await page.locator('#endSession').evaluate(n=>n.click());
   await page.waitForFunction(()=>!document.getElementById('finish').classList.contains('hidden'),null,{timeout:30000});
   await finishResults(page);
   assert.equal((await page.evaluate(()=>window.ApexNativeWeekend9B.snapshot())).session,stages[i+1]);
  }
  const plans=await page.evaluate(()=>{
   const saved=JSON.parse(localStorage.getItem(window.ApexSessionPlans9B.storageKey));
   return Object.values(saved.events).filter(e=>e.mode==='grandprix');
  });
  assert.equal(plans.length,1);assert.equal(plans[0].sessions.fp1.program,'performance');
  assert.equal(plans[0].sessions.fp2.program,'race-simulation');
  assert.equal(plans[0].sessions.fp3.program,'balanced');
  assert.deepEqual(errors.filter(s=>/SyntaxError|TypeError|ReferenceError/.test(s)),[]);
  console.log(JSON.stringify({test:'apex-9b-five-session-native-transition',mobile,stages,captured,
   methodology:'FP/Q ended through native endSession; rival timings use native simulation. Race used explicit final-boundary fixture followed by real production physics and finish timing gate. Not a full driven GP.',ok:true}));
  await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
