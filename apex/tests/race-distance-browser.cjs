/* Real Chromium and production update() runs. Emulated mobile is not a phone. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const output=process.env.APEX_RACE_RESULTS||'/tmp/apex-race-results';fs.mkdirSync(output,{recursive:true});
const root=path.resolve(__dirname,'../..'),pitHook=fs.readFileSync(path.join(__dirname,'pit-tyres-hook.js'),'utf8'),raceHook=fs.readFileSync(path.join(__dirname,'race-distance-hook.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{const mobile=process.env.APEX_AUDIT_DEVICE==='mobile',context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:1280,height:720}});await context.addInitScript(()=>{let s=810260;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});const page=await context.newPage(),errors=[];page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{errors.push(d.message());await d.dismiss()});
 await page.route('**/parts/part-027.txt',async route=>{let body=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8'),at=body.lastIndexOf('requestAnimationFrame(loop);');await route.fulfill({body:body.slice(0,at)+pitHook+raceHook+body.slice(at),contentType:'text/plain'})});
 await page.goto(process.env.APEX_AUDIT_URL||'http://127.0.0.1:8765/apex/apex.html?perf=1');await page.waitForFunction(()=>window.__apexRaceAudit);
 await page.locator('#apex9aRace').click();
 await page.locator('#apex9aModesScreen [data-apex-mode="quick"]').click();
 await page.locator('#apexProtoDistanceControl [data-apex-distance="50"]').click();
 assert.equal(await page.locator('#laps').inputValue(),'50');
 assert.equal(await page.locator('#gpLaps').inputValue(),'50');
 assert.ok((await page.locator('#lapsDistanceHint').textContent()).includes('50 %'));
 await page.reload();await page.waitForFunction(()=>window.__apexRaceAudit);assert.equal(await page.locator('#laps').inputValue(),'50');
 const matrix=await page.evaluate(()=>__apexRaceAudit.matrix());assert.equal(matrix.length,23);for(const t of matrix)for(const r of t.rows)assert.equal(r.totalLaps,Math.ceil(r.officialLaps*r.percentage/100));console.log(JSON.stringify({test:'race-distance-matrix',mobileEmulation:mobile,matrix}));
 const dirs=(process.env.APEX_RACE_CIRCUITS||'14-spain,06-monaco,13-italy,03-japan,10-belgium').split(',');
 for(const dir of dirs){
  const start=await page.evaluate(dir=>__apexRaceAudit.load(dir,25),dir);assert.equal(start.laps,0);assert.equal(start.rivals,21);assert.equal(start.totalLaps,Math.ceil(start.config.officialLaps/4));
  // Changing a hidden configuration cannot mutate the current race.
  await page.evaluate(()=>__apexRaceAudit.select(100));assert.equal((await page.evaluate(()=>__apexRaceAudit.status())).percentage,25);
  await page.evaluate(()=>__apexRaceAudit.boundaryFixture());const early=await page.evaluate(()=>__apexRaceAudit.drive(1));assert.equal(early.end.state,'CHEQUERED');assert.match(early.end.flagText,/CUADROS|FINALIZADO/);const result=await page.evaluate(()=>__apexRaceAudit.drive(45));console.log(JSON.stringify({test:'race-final-gates',dir,mobileEmulation:mobile,...result}));
  assert.equal(result.end.state,'FINISHED');assert.equal(result.end.finished,22);assert.equal(result.end.mode,'finish');assert.equal(result.end.faults,0);assert.equal(result.end.rows[0].laps,start.totalLaps);assert.equal(result.end.rows.at(-1).laps,start.totalLaps-1);assert.ok(result.end.rows.every(r=>r.finished&&Number.isFinite(r.finishTime)&&r.pitStops===0));
  await page.screenshot({path:path.join(output,`${mobile?'mobile':'desktop'}-${dir}.png`)});
  const persisted=await page.evaluate(()=>__apexRaceAudit.persisted());assert.equal(persisted.result.results.length,22);assert.equal(persisted.result.config.percentage,25);
  await page.locator('#finishMenu').click();
  await page.locator('#apexProtoLastResults').click();assert.match(await page.locator('#finishBoardWrap').innerText(),/paradas/i);await page.locator('#finishMenu').click();assert.deepEqual(errors,[]);
 }
 // One complete reduced GP from real grid, no teleports or forced laps.
 if(process.env.APEX_RACE_SKIP_FULL!=='1'){await page.reload();await page.waitForFunction(()=>window.__apexRaceAudit);const full=await page.evaluate(()=>__apexRaceAudit.fullRace('13-italy',25,2400));console.log(JSON.stringify({test:'race-full-gp',mobileEmulation:mobile,...full}));assert.equal(full.start.laps,0);assert.equal(full.end.state,'FINISHED');assert.equal(full.end.finished,22);assert.equal(full.end.rows[0].laps,14);assert.equal(full.end.faults,0);assert.deepEqual(errors,[])}
 await context.close();console.log(JSON.stringify({test:'race-browser-success',mobileEmulation:mobile}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
