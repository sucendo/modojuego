/* APEX 9A: comprobación de la nueva ficha Vehículo / Escudería.
 * Servir el repositorio en http://127.0.0.1:8765 antes de ejecutar.
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
  const context=await browser.newContext(mobile?
   {viewport:{width:844,height:390},isMobile:true,hasTouch:true}:
   {viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(30000);
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexVehicleStudio9A&&
   !!document.querySelector('.apexProtoVehiclePanel.apexTeamStudio')&&
   document.getElementById('teamSelect')?.options?.length>0,null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  const panel=page.locator('.apexProtoVehiclePanel.apexTeamStudio');
  assert.equal(await panel.isVisible(),true,'Ficha de equipo visible');
  assert.equal(await panel.locator('.apexStudioStage img').count(),1,'Un único monoplaza protagonista');
  assert.equal(await panel.locator('.apexProtoTeamPicker').count(),1,'Se reutiliza el selector original');
  assert.equal(await panel.locator('.apexProtoVehicleScene').evaluate(el=>getComputedStyle(el).display),'none',
    'No se muestra un segundo coche en el fondo');
  assert.ok((await panel.locator('#apexProtoTeamTitle').innerText()).length>3);
  const options=await page.locator('#teamSelect').evaluate(el=>Array.from(el.options).filter(o=>o.value&&!o.disabled).map(o=>o.value));
  assert.ok(options.length>=10,'El catálogo original continúa ofreciendo escuderías');
  for(let i=0;i<options.length;i++){
   const value=options[i];
   await page.locator('#apexProtoTeam').selectOption(value);
   await page.waitForFunction(v=>document.getElementById('teamSelect').value===v,value);
   const state=await page.evaluate(()=>{
    const selected=document.getElementById('teamSelect');
    const img=document.getElementById('apexProtoTeamImage');
    return {index:selected.selectedIndex,
     source:img.getAttribute('src'),
     teamName:document.getElementById('apexProtoTeamTitle').textContent,
     teamLabel:selected.selectedOptions[0].textContent,
     chassis:document.getElementById('apexStudioChassis').textContent,
     model:document.getElementById('apexStudioModel').textContent,
     ordinal:document.getElementById('apexStudioOrder').textContent,
     count:selected.options.length};
   });
   assert.equal(state.source,'assets/9a/team-'+String(state.index+1).padStart(2,'0')+'.webp',
     'La imagen corresponde a la selección nativa');
   assert.equal(state.teamName,state.teamLabel.trim().toUpperCase());
   assert.ok(state.chassis&&state.chassis!=='—','El chasis procede del catálogo original');
   assert.ok(state.model&&state.model!=='—','El modelo procede del catálogo original');
   assert.equal(state.ordinal,
    String(state.index+1).padStart(2,'0')+' / '+String(state.count).padStart(2,'0'));
   await page.locator('#apexProtoTeamImage').evaluate(img=>img.decode());
   assert.ok(await page.locator('#apexProtoTeamImage').evaluate(img=>img.complete&&img.naturalWidth>0),
    'Asset del coche cargado: '+value);
  }
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  const geometry=await panel.evaluate(el=>{
   const rect=el.getBoundingClientRect();
   const hero=el.querySelector('.apexStudioHero').getBoundingClientRect();
   const controls=el.querySelector('.apexStudioControls').getBoundingClientRect();
   const image=el.querySelector('.apexStudioStage img').getBoundingClientRect();
   return {overflow:el.scrollWidth-el.clientWidth,
    heroBelowHeader:hero.top>=el.querySelector('h2').getBoundingClientRect().bottom-1,
    imageInsideHero:image.top>=hero.top-1&&image.bottom<=hero.bottom+1,
    controlsBelowHero:controls.top>=hero.bottom-1,
    controlsInside:controls.bottom<=rect.bottom+2};
  });
  assert.ok(geometry.overflow<=2,'Sin desbordamiento horizontal '+JSON.stringify(geometry));
  assert.ok(geometry.heroBelowHeader&&geometry.imageInsideHero&&geometry.controlsBelowHero&&geometry.controlsInside,
   'Sin solapamientos de coche, título y selector '+JSON.stringify(geometry));
  await page.screenshot({path:'/tmp/apex-results/9a-vehicle-studio-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
  await page.locator('[data-apex-mode="grandprix"]').click();
  assert.equal(await panel.isVisible(),true,'La ficha existe en Gran Premio');
  await page.locator('[data-apex-mode="season"]').click();
  assert.equal(await panel.isVisible(),true,'La ficha existe en Temporada');
  await page.locator('[data-apex-mode="practice"]').click();
  assert.equal(await panel.isVisible(),true,'La ficha existe en Entrenamiento');
  assert.deepEqual(errors.filter(e=>/SyntaxError|Cannot read properties|Unexpected end/.test(e)),[]);
  console.log(JSON.stringify({test:'apex-vehicle-team-studio',mobile,teams:options.length,geometry,ok:true}));
  await context.close();
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
