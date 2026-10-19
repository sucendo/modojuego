/* Full simulator integration runner. Serve repository root on port 8765.
   Requires Playwright/Chromium; optional PLAYWRIGHT_MODULE_PATH, CHROME_EXECUTABLE,
   APEX_AUDIT_URL, APEX_AUDIT_DEVICE=desktop|mobile, ALL_CIRCUITS=1, SOFTWARE_GL=1.
   Mobile emulation/software WebGL is not a physical Android/GPU benchmark.
   Fixtures and hooks only exist in this browser context, not production sources. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
const root=path.resolve(__dirname,'../..'),url=process.env.APEX_AUDIT_URL||'http://127.0.0.1:8765/apex/apex.html?perf=1';
const hook=fs.readFileSync(path.join(__dirname,'browser-hook.js'),'utf8');
function finiteState(result){assert.ok(result.state);for(const [key,value] of Object.entries(result.state))assert.ok(Number.isFinite(value),`${key}: ${value}`);}
function report(value){console.log(JSON.stringify(value));}
(async()=>{
 const browser=await chromium.launch({headless:process.env.HEADED!=='1',...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),args:['--no-sandbox',...(process.env.SOFTWARE_GL==='1'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])]});
 try{
  const devices=process.env.APEX_AUDIT_DEVICE==='desktop'?[false]:process.env.APEX_AUDIT_DEVICE==='mobile'?[true]:[false,true];
  for(const mobile of devices){
   const context=await browser.newContext(mobile?{viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}:{viewport:{width:1280,height:720}});
   await context.addInitScript(()=>{
    if(!localStorage.getItem('apex26canvas-v2'))localStorage.setItem('apex26canvas-v2',JSON.stringify({schema:2,round:2,points:{PLAYER:17},wins:1}));
    Object.defineProperty(navigator,'getGamepads',{value:()=>window.__apexGamepad?[window.__apexGamepad]:[]});
   });
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{errors.push(d.message());await d.dismiss();});
   await page.route('**/parts/part-027.txt',async route=>{
    const body=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8'),at=body.lastIndexOf('requestAnimationFrame(loop);');assert.ok(at>=0);
    await route.fulfill({body:body.slice(0,at)+hook+body.slice(at),contentType:'text/plain'});
   });
   await page.goto(url);await page.waitForFunction(()=>window.__apexAudit);
   const initialSave=await page.evaluate(()=>__apexAudit.saveSnapshot());assert.equal(initialSave.save.schema,4);assert.equal(initialSave.save.round,2);assert.equal(initialSave.save.points.PLAYER,17);assert.deepEqual(initialSave.save,initialSave.stored);
   await page.reload();await page.waitForFunction(()=>window.__apexAudit);assert.deepEqual(await page.evaluate(()=>__apexAudit.saveSnapshot()),initialSave);
   report({test:'save-migration-and-reload',mobileEmulation:mobile,schema:4,oldSchema:2,ok:true});
   const cases=process.env.ALL_CIRCUITS==='1'?(await page.evaluate(()=>__apexAudit.circuits())).map(dir=>[dir,dir==='14-spain']):[['14-spain',true],['06-monaco',false],['10-belgium',false],['BASE_OTHER',false],['03-japan',false]];
   for(const [dir,custom] of cases){
    report({test:'load-start',dir,custom,mobileEmulation:mobile});
    await page.evaluate(async({dir,custom})=>__apexAudit.load(dir,custom),{dir,custom});
    for(const camera of ['cockpit','tcam','chase']){
     assert.equal(await page.evaluate(camera=>__apexAudit.camera(camera),camera),true);
     await page.waitForTimeout(1500);await page.evaluate(()=>__apexAudit.reset());await page.waitForTimeout(6000);
     const result=await page.evaluate(()=>__apexAudit.snapshot());finiteState(result);assert.equal(result.glError,0);assert.equal(result.backend,'webgl2');assert.ok(result.rivals>0);assert.ok(result.summary&&result.summary.frames>0);assert.equal(result.mode,'race');assert.ok(result.simulationSeconds>0);assert.equal(result.contextLost,false);
     report({test:'browser-rAF',mobileEmulation:mobile,...result});
    }
    // Real production input/update path; synthetic browser events and analog samples.
    for(const device of ['keyboard','touch','gamepad','gyro']){
     await page.evaluate(device=>__apexAudit.manual(device),device);
     if(device==='keyboard')await page.keyboard.down('ArrowRight');
     if(device==='touch')await page.locator('#right').dispatchEvent('pointerdown',{pointerId:7,pointerType:'touch',isPrimary:true});
     await page.waitForTimeout(180);const input=await page.evaluate(()=>__apexAudit.snapshot());
     if(device==='keyboard')await page.keyboard.up('ArrowRight');
     if(device==='touch')await page.locator('#right').dispatchEvent('pointerup',{pointerId:7,pointerType:'touch',isPrimary:true});
     await page.evaluate(()=>__apexAudit.release());assert.equal(input.driving.device,device);assert.ok(input.driving.steer>0);finiteState(input);
     report({test:'browser-input-path',mobileEmulation:mobile,device,circuit:input.circuit,driving:input.driving});
    }
    if(dir==='BASE_OTHER'||dir==='13-italy'){
     assert.equal(await page.evaluate(()=>__apexAudit.backend('canvas2d')),true);await page.waitForTimeout(700);const canvas=await page.evaluate(()=>__apexAudit.snapshot());assert.equal(canvas.backend,'canvas2d');finiteState(canvas);
     report({test:'canvas-fallback',mobileEmulation:mobile,ok:true,circuit:canvas.circuit});assert.equal(await page.evaluate(()=>__apexAudit.backend('webgl2')),true);
    }
    assert.equal(await page.evaluate(()=>__apexAudit.stop()),true);assert.deepEqual(errors,[]);
   }
   const base=await page.evaluate(()=>__apexAudit.baseTests());report({test:'23-circuit-regressions',mobileEmulation:mobile,...base});assert.equal(base.runtime.ok,true);assert.equal(base.timing.ok,true);if(base.road)assert.equal(base.road.ok,true);assert.deepEqual(errors,[]);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
