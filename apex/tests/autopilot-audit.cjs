/* Differential browser integration against main's pre-phase-7 build.
   Physics ticks accelerated at 100 Hz; heavy world update grouped identically.
   This tests trajectory/control compatibility, not FPS or rendering smoothness. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
const root=path.resolve(__dirname,'../..'),ref=process.env.BASELINE_REF||'8e71e2d0dba93cf4b6efbb97aba546f36278be6d',hook=fs.readFileSync(path.join(__dirname,'autopilot-hook.js'),'utf8');
const dirs=(process.env.APEX_AUTO_CIRCUITS||'14-spain,06-monaco,10-belgium,13-italy,03-japan').split(','),seconds=Number(process.env.APEX_AUTO_SECONDS||60);
const source={};for(const variant of ['baseline','candidate'])source[variant]=Array.from({length:28},(_,i)=>{const p=`apex/parts/part-${String(i).padStart(3,'0')}.txt`;return variant==='baseline'?cp.execFileSync('git',['show',`${ref}:${p}`],{cwd:root,encoding:'utf8',maxBuffer:15e6}):fs.readFileSync(path.join(root,p),'utf8');});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const rows=[];
 try{
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{let seed=261007;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);Object.defineProperty(navigator,'getGamepads',{value:()=>[]});});
  let variant='baseline';const page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);
  page.on('pageerror',e=>{errors.push(e.message);console.log(JSON.stringify({test:'auto-page-error',message:e.message}));});
  page.on('dialog',async d=>{errors.push(d.message());console.log(JSON.stringify({test:'auto-dialog',message:d.message()}));await d.dismiss();});
  await page.route('**/parts/part-*.txt',async route=>{const i=Number(new URL(route.request().url()).pathname.match(/part-(\d+)\.txt$/)[1]);let body=source[variant][i];if(i===27){const at=body.lastIndexOf('requestAnimationFrame(loop);');assert.ok(at>=0);body=body.slice(0,at)+hook+body.slice(at);}await route.fulfill({body,contentType:'text/plain'});});
  for(variant of ['baseline','candidate']){
   await page.goto(process.env.APEX_AUDIT_URL||'http://127.0.0.1:8765/apex/apex.html?perf=1');await page.waitForFunction(()=>window.__apexAuto);
   for(const dir of dirs)for(const traffic of [false,true]){
    console.log(JSON.stringify({test:'auto-case-start',variant,dir,traffic}));
    const loaded=await page.evaluate(async({dir,traffic})=>__apexAuto.load(dir,traffic),{dir,traffic});
    const result=await page.evaluate(seconds=>__apexAuto.run(seconds),seconds),row={test:'autopilot-differential',variant,dir,traffic,...loaded,...result};rows.push(row);console.log(JSON.stringify(row));assert.deepEqual(errors,[]);
   }
  }
  const comparisons=rows.filter(r=>r.variant==='candidate').map(after=>{const before=rows.find(r=>r.variant==='baseline'&&r.dir===after.dir&&r.traffic===after.traffic);return {dir:after.dir,traffic:after.traffic,before:{progressM:before.progressM,maxStoppedSec:before.maxStoppedSec,maxNoProgressSec:before.maxNoProgressSec},after:{progressM:after.progressM,maxStoppedSec:after.maxStoppedSec,maxNoProgressSec:after.maxNoProgressSec}};});
  console.log(JSON.stringify({test:'autopilot-comparison',baseline:ref,seconds,comparisons}));
  // A passing watchdog is not proof of racing stability. Also reject material
  // regressions in driven distance and accumulated damage against the CURRENT
  // main branch on the same seeded circuit/traffic setup.
  for(const after of rows.filter(r=>r.variant==='candidate')){
   const before=rows.find(r=>r.variant==='baseline'&&r.dir===after.dir&&r.traffic===after.traffic);
   assert.ok(before,'Missing main baseline: '+after.dir+' traffic='+after.traffic);
   const label=after.dir+', traffic='+after.traffic;
   assert.ok(after.progressM>=before.progressM*.85,
     label+': progress regressed '+after.progressM.toFixed(1)+'m vs main '+before.progressM.toFixed(1)+'m');
   assert.ok(after.end.hp>=before.end.hp-2.0,
     label+': excess impact damage, HP '+after.end.hp.toFixed(2)+' vs main '+before.end.hp.toFixed(2));
  }
  console.log(JSON.stringify({test:'autopilot-main-regression',cases:10,minProgressRatio:.85,maxExtraHpLoss:2,passed:true}));
  // Behavioral watchdogs for the fixed 60 s fixture, not lap-time or FPS goals.
  // Allow a short recovery, but fail prolonged immobility/no net forward progress.
  // Keep comparative distances visible: traffic contacts may diverge between models.
  if(seconds===60){
   const candidates=rows.filter(r=>r.variant==='candidate');
   for(const r of candidates){
    const label=`${r.dir}, traffic=${r.traffic}`;
    assert.ok(r.maxStoppedSec<8,`${label}: stopped for ${r.maxStoppedSec}s`);
    assert.ok(r.maxNoProgressSec<15,`${label}: no progress for ${r.maxNoProgressSec}s`);
    assert.ok(r.progressM>0,`${label}: no positive net progress`);
    assert.equal(r.end.physicsFaults||0,0,`${label}: physics faults`);
   }
   console.log(JSON.stringify({test:'autopilot-watchdogs',cases:candidates.length,seconds,maxStoppedSec:8,maxNoProgressSec:15,passed:true}));
  }
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
