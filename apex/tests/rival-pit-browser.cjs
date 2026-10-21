/* Rival PIT traversal in production simulator, with one initial test fixture. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=path.resolve(__dirname,'../..'),hook=fs.readFileSync(path.join(__dirname,'pit-tyres-hook.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/parts/part-027.txt',async route=>{
  const src=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8'),at=src.lastIndexOf('requestAnimationFrame(loop);');
  await route.fulfill({body:src.slice(0,at)+hook+src.slice(at),contentType:'text/plain'});
 });
 await page.goto(process.env.APEX_AUDIT_URL||'http://127.0.0.1:8765/apex/apex.html?perf=1');
 await page.waitForFunction(()=>window.__apexPitAudit);
 const dirs=(process.env.APEX_RIVAL_PIT_CIRCUITS||'13-italy,14-spain,06-monaco,03-japan,10-belgium').split(',');
 const failures=[];
 for(const dir of dirs){
  try{
   const x=await page.evaluate(dir=>__apexPitAudit.rivalCycle(dir),dir);
   console.log(JSON.stringify({test:'rival-pit-real-circuit',mobile,dir,...x}));
   if(dir==='10-belgium'){assert.equal(x.available,false);assert.equal(x.reason,'UNSAFE_PIT_ROUTE');continue;}
   assert.equal(x.available,true);assert.equal(x.done,true,dir+' phase '+x.final);
   assert.equal(x.pitStops,1);assert.equal(x.compound,'HARD');assert.equal(x.network,'TRACK');
   assert.ok(x.phases.some(p=>p.phase==='SERVICE'));assert.ok(x.phases.some(p=>p.phase==='EXITING'));
   assert.ok(x.maxSpeed<=x.limit+.05);assert.ok(x.maxWorldJump<3,dir+' world jump '+x.maxWorldJump);
  }catch(e){failures.push({dir,error:e.message});console.log(JSON.stringify({test:'rival-pit-failure',dir,error:e.message}));}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 await page.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
