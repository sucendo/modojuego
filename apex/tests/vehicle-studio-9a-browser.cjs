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
  const images=new Map();
  for(let i=0;i<options.length;i++){
   const value=options[i];
   await page.locator('#apexProtoTeam').selectOption(value);
   await page.waitForFunction(v=>document.getElementById('teamSelect').value===v,value);
   const state=await page.evaluate(()=>{
    const selected=document.getElementById('teamSelect');
    const img=document.getElementById('apexProtoTeamImage');
    return {index:selected.selectedIndex,
     source:img.getAttribute('src'),key:selected.value,
     renderedTeam:img.dataset.apexTeamKey,renderedModel:img.dataset.apexModel,
     renderedChassis:img.dataset.apexChassis,previewMode:img.dataset.apexPreview,
     native:window.ApexNativeTeamStudio9A.get(selected.value),
     svg:window.ApexTeamCarPreview9A.build(selected.value)?.svg,
     teamName:document.getElementById('apexProtoTeamTitle').textContent,
     teamLabel:selected.selectedOptions[0].textContent,
     chassis:document.getElementById('apexStudioChassis').textContent,
     model:document.getElementById('apexStudioModel').textContent,
     ordinal:document.getElementById('apexStudioOrder').textContent,
     count:selected.options.length};
   });
   assert.equal(state.previewMode,'native-blueprint','No utilizar fotos estáticas del prototipo');
   assert.equal(state.renderedTeam,state.key,'Imagen basada en la clave deportiva real');
   assert.equal(state.renderedModel,state.native.model,'Modelo 3D y vista del menú coinciden');
   assert.equal(state.renderedChassis,state.native.chassis,'Chasis real del equipo');
   assert.ok(state.source.startsWith('data:image/svg+xml;charset=utf-8,'),'Vista SVG derivada de blueprint real');
   assert.ok(state.svg.includes('data-apex-team="'+state.key+'"'));
   assert.ok(state.svg.includes('data-apex-model="'+state.native.model+'"'));
   assert.ok(state.svg.includes(state.native.preview.livery.primary.toLowerCase()));
   assert.ok(state.svg.includes(state.native.preview.livery.stripe.toLowerCase()));
   assert.equal(state.teamName,state.teamLabel.trim().toUpperCase());
   assert.ok(state.chassis&&state.chassis!=='—','El chasis procede del catálogo original');
   assert.ok(state.model&&state.model!=='—','El modelo procede del catálogo original');
   assert.equal(await panel.locator('#apexStudioLogo svg').count(),1,
    'Logo SVG original visible para la escudería '+value);
   assert.ok((await panel.locator('#apexStudioLogo svg').getAttribute('viewBox'))==='0 0 64 64',
    'Se reutiliza el logo original y no un logotipo inventado');
   assert.equal(state.ordinal,
    String(state.index+1).padStart(2,'0')+' / '+String(state.count).padStart(2,'0'));
   assert.ok(!images.has(state.key),'Cada escudería debe validarse una vez');
   assert.ok(![...images.values()].includes(state.source),'No reutilizar imagen de otra escudería');
   images.set(state.key,state.source);
   await page.locator('#apexProtoTeamImage').evaluate(img=>img.decode());
   assert.ok(await page.locator('#apexProtoTeamImage').evaluate(img=>img.complete&&img.naturalWidth>0),
    'Asset del coche cargado: '+value);
  }
  assert.equal(images.size,options.length,'Todas las imágenes del catálogo comprobadas');
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  // Colores persistentes por equipo. Principal y acento también deben llegar
  // a los controles deportivos nativos, no ser una pintura ficticia.
  const initial=await page.locator('#apexProtoTeamImage').getAttribute('src');
  await page.locator('#apexStudioColor-primary').fill('#34acde');
  await page.locator('#apexStudioColor-accent').fill('#ee8822');
  await page.locator('#apexStudioColor-secondary').fill('#172f46');
  await page.waitForFunction(()=>document.getElementById('carColor').value.toLowerCase()==='#34acde' &&
    document.getElementById('carAccent').value.toLowerCase()==='#ee8822');
  const personalized=await page.locator('#apexProtoTeamImage').getAttribute('src');
  assert.notEqual(personalized,initial,'La carrocería cambia al escoger otro color');
  assert.ok(decodeURIComponent(personalized).includes('#34acde'));
  assert.ok(decodeURIComponent(personalized).includes('#ee8822'));
  assert.ok(decodeURIComponent(personalized).includes('#172f46'));
  assert.equal(await page.locator('#apexStudioSave').innerText(),'COLORES GUARDADOS');
  await page.locator('#apexProtoTeam').selectOption(options[1]);
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  await page.waitForFunction(()=>document.getElementById('carColor').value.toLowerCase()==='#34acde');
  // La selección de equipo debe seguir siendo la nativa.
  assert.equal(await page.locator('#teamSelect').inputValue(),options[0]);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ApexVehicleStudio9A && document.getElementById('apexStudioColor-primary'),null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  assert.equal(await page.locator('#apexStudioColor-primary').inputValue(),'#34acde',
   'El color personalizado persiste tras recarga');
  await page.locator('#apexStudioReset').click();
  assert.notEqual(await page.locator('#apexStudioColor-primary').inputValue(),'#34acde',
   'Restaurar recupera la pintura original de la escudería');
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
