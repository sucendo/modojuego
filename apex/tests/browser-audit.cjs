/* Browser smoke/performance runner. Requires Playwright + a Chrome installation.
   Serve repository root separately, e.g. python -m http.server 8765
   APEX_AUDIT_URL=http://localhost:8765/apex/apex.html node apex/tests/browser-audit.cjs
   CHROME_EXECUTABLE=/path/to/chrome selects an existing browser.
   This file injects test hooks into the served response, never production sources.
   Reports real browser/rAF measurements; mobile emulation is NOT physical Android. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const root=path.resolve(__dirname,'../..'),url=process.env.APEX_AUDIT_URL||'http://127.0.0.1:8765/apex/apex.html?perf=1';
const hook=`
window.__apexAudit={
 async load(dir,custom=false){
  goMenu();const spec=dir==='BASE_OTHER'?(calendar.find(s=>/italy|monza/i.test(s.dir+' '+s.name))||calendar[0]):calendar.find(s=>s.dir===dir);if(!spec)throw Error('Circuit not found: '+dir);
  if(custom)await importEditableCircuitSvgText(await(await fetch('circuits/svg/apex26_14-madrid-spain.svg')).text(),spec);
  sessionSettings={diff:1,weather:'CLEAR',noRivals:false};currentSession='race';await startRace(spec,5,'quick',$('start'));
  if(!player||!trackData)throw Error('Session did not start');
  if(!setRendererBackend('webgl2',{notify:false,persist:false}))throw Error('WebGL2 unavailable');
  countdown=0;paused=false;setAutoDriveMode(1,false);
 },
 reset(){apexRuntimePerfReset();},
 camera(mode){return apexSetCameraMode(mode,{silent:true});},
 snapshot(){const gl=webglState.gl,ext=gl&&gl.getExtension('WEBGL_debug_renderer_info');return{
  version:APP_VERSION,circuit:trackData&&trackData.spec.dir,backend:rendererBackendId(),
  camera:apexCameraMode(),rivals:rivals.length,summary:apexPerformanceSummary(),profile:renderProfilerSnapshot(),
  terrain:apexPhase5TerrainDiagnostics(),ground:apexPhase5GpuDiagnostics(),glError:gl&&gl.getError(),
  renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl&&gl.getParameter(gl.RENDERER)};},
 stop(){goMenu();return !apexPhase5TerrainGPU.buffer&&!apexPhase5GroundGPU.buffer;},
 async baseTests(){return{runtime:await apexCircuitRuntimeSelfTest(),timing:await apexLapEngineSelfTest()};}
};
`;
(async()=>{
 const browser=await chromium.launch({headless:process.env.HEADED!=='1',...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),args:['--no-sandbox',...(process.env.SOFTWARE_GL==='1'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])]});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext(mobile?{viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}:{viewport:{width:1280,height:720}});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{errors.push(d.message());await d.dismiss();});
   await page.route('**/parts/part-027.txt',async route=>{const body=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8'),at=body.lastIndexOf('requestAnimationFrame(loop);');assert.ok(at>=0);await route.fulfill({body:body.slice(0,at)+hook+body.slice(at),contentType:'text/plain'});});
   await page.goto(url);await page.waitForFunction(()=>window.__apexAudit,{timeout:60000});
   for(const [dir,custom] of [['14-spain',true],['BASE_OTHER',false]]){
    await page.evaluate(async({dir,custom})=>__apexAudit.load(dir,custom),{dir,custom});
    for(const camera of ['cockpit','tcam','chase']){
     assert.equal(await page.evaluate(camera=>__apexAudit.camera(camera),camera),true);
     // Measure the unchanged production rAF scheduler after warmup.
     await page.waitForTimeout(1500);await page.evaluate(()=>__apexAudit.reset());await page.waitForTimeout(6000);
     const result=await page.evaluate(()=>__apexAudit.snapshot());assert.equal(result.glError,0);assert.equal(result.backend,'webgl2');assert.ok(result.rivals>0);assert.ok(result.summary.frames>0);
     console.log(JSON.stringify({test:'browser-rAF',mobileEmulation:mobile,...result}));
    }
    assert.equal(await page.evaluate(()=>__apexAudit.stop()),true);
   }
   const base=await page.evaluate(()=>__apexAudit.baseTests());console.log(JSON.stringify({test:'23-circuit-regressions',mobileEmulation:mobile,...base}));assert.equal(base.runtime.ok,true);assert.equal(base.timing.ok,true);assert.deepEqual(errors,[]);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
