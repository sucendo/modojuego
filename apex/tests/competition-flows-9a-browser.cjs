/* APEX 9A.3–9A.7 — GP/season native launch without shadow simulation.
 * Run against http.server, with PLAYWRIGHT_MODULE_PATH and APEX_AUDIT_DEVICE.
 */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
  const context=await browser.newContext(mobile?
   {viewport:{width:844,height:390},isMobile:true,hasTouch:true}:
   {viewport:{width:1280,height:720}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexCompetitionFlows9A&&!!window.ApexClimate9A&&
   !!window.ApexMenuMusic9A&&document.getElementById('gpTrack')?.options.length>0&&
   document.getElementById('menuTyreCompound')?.options.length>0,null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  await page.locator('#menuModeTabs [data-t="grandprix"]').click();
  await page.locator('#gpStart').click();
  assert.equal(await page.locator('#apex9aCompetitionSetup').isVisible(),true);
  assert.match(await page.locator('#apex9aCompTitle').textContent(),/GRAN PREMIO/);
  assert.equal(await page.locator('#apex9aCompTyres button').count(),5);
  assert.equal(await page.locator('#apex9aCompCircuitSelect').inputValue(),await page.locator('#gpTrack').inputValue());
  assert.equal(await page.locator('#apex9aCompTeamSelect').inputValue(),await page.locator('#teamSelect').inputValue());
  assert.equal(await page.locator('#apex9aCompDistanceSelect').inputValue(),await page.locator('#gpLaps').inputValue());
  await page.locator('#apex9aCompDistanceSelect').selectOption('50');
  assert.equal(await page.locator('#gpLaps').inputValue(),'50',
   'El nuevo selector de GP debe usar la distancia original de carrera');

  await page.locator('#apex9aCompWeather').selectOption('auto');
  assert.match(await page.locator('#apex9aCompForecast').textContent(),/simulad/i);
  const roundBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('apex26canvas-v2')||'{}').round||0);
  await page.locator('#apex9aCompLaunch').click();
  await page.waitForFunction(()=>!document.getElementById('weekendPanel').classList.contains('hidden'),null,{timeout:15000});
  assert.equal(await page.locator('#weekendStages .sessionStage').count(),5);
  await page.locator('#weekendMenu').click();
  await page.locator('#menuModeTabs [data-t="season"]').click();
  await page.locator('#nextSeason').click();
  assert.match(await page.locator('#apex9aCompTitle').textContent(),/TEMPORADA/);
  assert.match(await page.locator('#apex9aCompProgress').textContent(),/CAMPEONATO NATIVO/);
  assert.equal(await page.locator('#apex9aCompCircuitPickerRow').getAttribute('hidden'),'',
   'El calendario nativo debe fijar el circuito de temporada');
  assert.equal(await page.locator('#apex9aCompDistanceSelect').inputValue(),await page.locator('#seasonDistance').inputValue());
  await page.locator('#apex9aCompDistanceSelect').selectOption('75');
  assert.equal(await page.locator('#seasonDistance').inputValue(),'75',
   'La temporada usa el mismo control nativo de distancia');

  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apex26canvas-v2')||'{}').round||0),roundBefore,
   'Opening setup must never advance the native championship');
  await page.locator('#apex9aCompCancel').click();
  assert.equal(await page.locator('#apex9aCompetitionSetup').isVisible(),false);
  await page.locator('#nextSeason').click();
  await page.locator('#apex9aCompLaunch').click();
  await page.waitForFunction(()=>!document.getElementById('weekendPanel').classList.contains('hidden'),null,{timeout:15000});
  assert.match(await page.locator('#weekendSubtitle').textContent(),/TEMPORADA/);
  await page.locator('#weekendMenu').click();
  await page.locator('#nextSeason').click();
  assert.equal(await page.locator('#apex9aCompTeamSelect').isDisabled(),true,
   'Una temporada iniciada conserva la escudería bloqueada en el nuevo menú');
  await page.locator('#apex9aCompCancel').click();

  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apex26canvas-v2')||'{}').round||0),roundBefore,
   'Starting a weekend without racing must not award points');
  assert.deepEqual(errors.filter(s=>/SyntaxError|Unexpected end of input|Cannot read properties/.test(s)),[]);
  console.log(JSON.stringify({test:'apex-9a-gp-season',mobile,ok:true}));
  await context.close();
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
