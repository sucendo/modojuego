/* APEX 9A.8 — comprobación visual y de navegación frente al prototipo aprobado.
 * Cubre separación de pantallas, imágenes locales y enlace con controles nativos.
 */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexMenuPrototype9A&&document.getElementById('teamSelect')?.options.length>0,null,{timeout:90000});
  assert.equal(await page.locator('#apex9aLanding').isVisible(),true);
  await page.screenshot({path:'/tmp/apex-results/9a8-'+(mobile?'mobile':'desktop')+'-home.png'});
  await page.locator('#apex9aOptions').click();
  assert.equal(await page.locator('#apex9aOptionsScreen').isVisible(),true,'Opciones es una pantalla propia');
  assert.equal(await page.locator('#apex9aModesScreen').isVisible(),false,'No debe mezclarse con Tipo de carrera');
  assert.equal(await page.locator('#menuGraphics').isVisible(),false,'Los ajustes nativos son subyacentes, no pantalla compartida');
  await page.screenshot({path:'/tmp/apex-results/9a8-'+(mobile?'mobile':'desktop')+'-options.png'});
  const nativeRenderer=await page.locator('#rendererSelect').inputValue();
  assert.equal(await page.locator('#apexProtoRenderer').inputValue(),nativeRenderer);
  const alternative=await page.locator('#apexProtoRenderer').evaluate(el=>Array.from(el.options).find(o=>o.value!==el.value&&!o.disabled)?.value||null);
  if(alternative){
   await page.locator('#apexProtoRenderer').selectOption(alternative);
   assert.equal(await page.locator('#rendererSelect').inputValue(),alternative,'Opciones escribe en renderer real');
   await page.locator('#apexProtoRenderer').selectOption(nativeRenderer);
  }
  await page.locator('#apexProtoOpenEditor').click();
  assert.equal(await page.locator('#trackEditorDock').evaluate(el=>el.open),true,'Editor del juego se mantiene disponible');
  await page.locator('#apex9aBack').click();
  assert.equal(await page.locator('#apex9aOptionsScreen').isVisible(),true,'Regresar desde editor devuelve a Opciones');
  await page.locator('#apexProtoOptionsBack').click();
  await page.locator('#apex9aRace').click();
  assert.equal(await page.locator('#apex9aModesScreen').isVisible(),true,'Tipo de carrera es una pantalla propia');
  assert.equal(await page.locator('#apex9aOptionsScreen').isVisible(),false,'Opciones no aparece bajo carreras');
  const cards=page.locator('#apex9aModesScreen .apexProtoModeCard');
  assert.equal(await cards.count(),4);
  const backgrounds=await cards.evaluateAll(els=>els.map(x=>getComputedStyle(x.querySelector('.apexProtoModePicture')).backgroundImage));
  assert.ok(backgrounds.every(s=>/assets\/9a\/race-/.test(s)),'Cada modo usa su foto aprobada');
  await page.screenshot({path:'/tmp/apex-results/9a8-'+(mobile?'mobile':'desktop')+'-modes.png',fullPage:true});
  await page.locator('[data-apex-mode="grandprix"]').click();
  assert.equal(await page.locator('#apexProtoCircuit').inputValue(),await page.locator('#gpTrack').inputValue());
  const team=await page.locator('#teamSelect').inputValue();
  assert.equal(await page.locator('#apexProtoTeam').inputValue(),team);
  await page.locator('#apexProtoNext').click();
  assert.equal(await page.locator('#apex9aCompetitionSetup').isVisible(),true,'Preparación real de GP se abre');
  await page.locator('#apex9aCompCancel').click();
  await page.locator('[data-apex-mode="quick"]').click();
  await page.locator('#apexProtoNext').click();
  assert.equal(await page.locator('#apex9aPreparation').isVisible(),true,'Preparación real de Carrera rápida se abre');
  await page.locator('#apex9aCancel').click();
  assert.deepEqual(errors.filter(s=>/SyntaxError|Unexpected end of input|Cannot read properties/.test(s)),[]);
  console.log(JSON.stringify({test:'apex-9a8-prototype-fidelity',mobile,cards:await cards.count(),ok:true}));
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
