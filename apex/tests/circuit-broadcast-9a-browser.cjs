/* APEX 9A · Circuito broadcast: geometría auténtica, sincronización y responsive.
   Servir el repositorio en localhost:8765 antes de ejecutar. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const ctx=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const page=await ctx.newPage(),errors=[];
  page.setDefaultTimeout(30000);
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexCircuitBroadcast9A&&
   document.querySelector('#apex9aModesScreen .apexCircuitBroadcast')&&
   document.getElementById('track')?.options.length>0,null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  const hero=page.locator('.apexCircuitBroadcast');
  assert.equal(await hero.isVisible(),true,'Tarjeta visible');
  assert.ok((await page.locator('#apexBroadcastName').innerText()).length>2);
  assert.equal(await page.locator('#apexProtoCircuitControl').isVisible(),true,'Selector conservado');
  assert.equal(await page.locator('.apexProtoCircuitPanel [data-apex-weather]').count(),4);
  assert.equal(await page.locator('.apexProtoCircuitPanel [data-apex-distance]').count(),4);
  await page.waitForFunction(()=>!!document.querySelector('#quickCircuitInfo .trackPreviewBox path[stroke="url(#tg)"]'),null,{timeout:70000});
  await page.waitForFunction(()=>document.querySelector('#apexBroadcastLayout svg path')?.getAttribute('d'),null,{timeout:30000});
  const real=await page.evaluate(()=>({
   source:document.querySelector('#quickCircuitInfo .trackPreviewBox path[stroke="url(#tg)"]')?.getAttribute('d'),
   broadcast:document.querySelector('#apexBroadcastLayout svg path')?.getAttribute('d'),
   length:document.querySelector('#apexBroadcastLength')?.textContent,
   turns:document.querySelector('#apexBroadcastTurns')?.textContent
  }));
  assert.equal(real.broadcast,real.source,'El trazado en blanco utiliza exactamente los puntos nativos');
  assert.notEqual(real.length,'—','Longitud real disponible');
  assert.notEqual(real.turns,'—','Número de curvas real disponible');
  assert.equal(await page.locator('#apexBroadcastRecord').innerText(),'—','No inventar récord oficial');
  // Las imágenes nunca deben corresponder a Mónaco al seleccionar Melbourne.
  const image=await page.locator('#apexBroadcastPhoto').evaluate(x=>x.style.backgroundImage);
  assert.ok(!image.includes('prep-monaco.webp'),'Foto no atribuida incorrectamente');
  // Los botones de carrera siguen escribiendo en los selectores originales.
  const nBefore=await page.locator('#track').inputValue();
  await page.locator('#apexProtoNextCircuit').click();
  assert.notEqual(await page.locator('#track').inputValue(),nBefore,'Navegación modifica el circuito nativo');
  assert.equal(await page.locator('#track').inputValue(),await page.locator('#apexProtoCircuit').inputValue());
  await page.locator('#apexProtoPrevCircuit').click();
  await page.locator('[data-apex-mode="grandprix"]').click();
  assert.equal(await page.locator('#apexProtoCircuitControl').isVisible(),true);
  assert.equal(await page.locator('#apexProtoCircuit').inputValue(),await page.locator('#gpTrack').inputValue());
  await page.locator('[data-apex-mode="practice"]').click();
  assert.equal(await page.locator('#apexProtoDistanceControl').isVisible(),false,'Entrenamiento sin distancia carrera');
  await page.locator('[data-apex-mode="season"]').click();
  assert.equal(await page.locator('#apexProtoCircuitControl').isVisible(),false,'Circuito de Temporada bloqueado');
  assert.equal(await page.locator('#apexProtoCircuitLocked').isVisible(),true);
  // Un trazado de otro GP nunca debe permanecer como representación de Temporada.
  assert.equal(await hero.getAttribute('data-mode'),'season');
  const layoutState=await page.locator('#apexBroadcastLayout').evaluate(el=>({
   hasSvg:!!el.querySelector('svg'),hasPlaceholder:!!el.querySelector('.apexBroadcastNoLayout')
  }));
  assert.equal(layoutState.hasSvg&&layoutState.hasPlaceholder,false);
  await page.locator('[data-apex-mode="quick"]').click();
  const overflow=await page.locator('#apex9aModesScreen').evaluate(el=>{
   const article=el.querySelector('.apexProtoCircuitPanel');
   const card=el.querySelector('.apexCircuitBroadcast');
   return {scroll:el.scrollWidth-el.clientWidth,panel:article.scrollWidth-article.clientWidth,
    card:card.scrollWidth-card.clientWidth};
  });
  assert.ok(overflow.scroll<=3&&overflow.panel<=3&&overflow.card<=3,'Tarjeta sin desbordamiento horizontal '+JSON.stringify(overflow));
  await page.screenshot({path:'/tmp/apex-results/9a-circuit-broadcast-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
  assert.deepEqual(errors.filter(e=>/SyntaxError|Unexpected end|Cannot read properties/.test(e)),[]);
  console.log(JSON.stringify({test:'apex-circuit-broadcast',mobile,sourceGeometry:true,overflow,ok:true}));
  await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
