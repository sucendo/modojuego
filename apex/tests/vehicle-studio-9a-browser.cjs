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
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext(mobile?
   {viewport:{width:Number(process.env.APEX_AUDIT_WIDTH)||844,height:Number(process.env.APEX_AUDIT_HEIGHT)||390},isMobile:true,hasTouch:true}:
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
  assert.equal(options.length,11,'Se conservan las once escuderías');
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
   assert.equal(await page.evaluate(svg=>{
    const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
    return doc.querySelectorAll('parsererror').length;
   },state.svg),0,'SVG válido para '+value);
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
  const drawing=await page.evaluate(()=>{
   const source=window.ApexTeamCarPreview9A.build(document.getElementById('teamSelect').value).svg;
   const host=document.createElement('div');host.style.cssText='position:fixed;left:-2000px;top:0';
   host.innerHTML=source;document.body.append(host);
   const svg=host.firstElementChild;
   const parts=[...svg.querySelectorAll('.apex-car-tyre')].map(el=>{
    const b=el.getBBox();return {x:b.x,y:b.y,width:b.width,height:b.height};
   });
   const bounds=svg.getBBox();host.remove();
   return {parts,bounds:{x:bounds.x,y:bounds.y,right:bounds.x+bounds.width,bottom:bounds.y+bounds.height}};
  });
  assert.equal(drawing.parts.length,4,'Cuatro neumáticos slick');
  assert.ok(drawing.parts.every(b=>b.width>b.height*1.25),'Neumáticos alargados en el eje longitudinal');
  assert.ok(drawing.bounds.x>0&&drawing.bounds.y>0&&drawing.bounds.right<1000&&drawing.bounds.bottom<470,
   'Toda la silueta dentro del viewBox '+JSON.stringify(drawing));
  assert.equal(images.size,options.length,'Todas las imágenes del catálogo comprobadas');
  assert.equal(await panel.locator('.apexStudioTeamCard').count(),options.length,
   'Tarjeta y logotipo propio para cada una de las 11 escuderías');
  const logos=await panel.locator('.apexStudioCardLogo svg').evaluateAll(els=>els.map(el=>el.outerHTML));
  assert.equal(new Set(logos).size,options.length,'Identidad vectorial diferenciada por equipo');
  await panel.locator('.apexStudioTeamCard').filter({hasText:'Meridian'}).click();
  assert.equal(await page.locator('#teamSelect').inputValue(),options[1],
   'El mosaico debe activar el selector deportivo nativo');
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  assert.equal(await panel.locator('.apexStudioTeamCard.active').count(),1,
   'Sólo la escudería activa debe resaltarse');
  await panel.locator('#apexStudioHeaderNext').click();
  assert.equal(await page.locator('#teamSelect').inputValue(),options[1],
   'Las flechas superiores reutilizan los controles nativos');
  await panel.locator('#apexStudioHeaderPrev').click();
  assert.equal(await page.locator('#teamSelect').inputValue(),options[0]);
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
  assert.equal(await page.locator('#apexStudioSave').innerText(),'COLORES PERSONALIZADOS');
  for(const [name,finish,secondary] of [
   ['Acabado plata','silver','#b4c1cc'],
   ['Acabado carbono','carbon','#101920'],
   ['Acabado blanco','white','#f2f6fa']
  ]){
   await panel.getByRole('button',{name}).click();
   assert.equal(await panel.locator('.apexStudioFinish[aria-pressed="true"]').count(),1,
    'Acabado seleccionado con botón accesible');
   assert.equal(await page.locator('#apexStudioColor-secondary').inputValue(),secondary);
   assert.ok((await page.locator('#apexProtoTeamImage').getAttribute('src')).includes(encodeURIComponent(secondary)),
    'El acabado cambia la librea cenital '+finish);
  }
  await page.locator('#apexStudioColor-secondary').fill('#172f46');
  await panel.locator('#apexStudioSaveButton').click();
  assert.equal(await page.locator('#apexStudioSave').innerText(),'GUARDADO ✓');
  await page.locator('#apexProtoTeam').selectOption(options[1]);
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  await page.waitForFunction(()=>document.getElementById('carColor').value.toLowerCase()==='#34acde');
  // La selección de equipo debe seguir siendo la nativa.
  assert.equal(await page.locator('#teamSelect').inputValue(),options[0]);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ApexVehicleStudio9A && document.getElementById('apexStudioColor-primary'),null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  await page.waitForFunction(()=>{
   const team=document.getElementById('teamSelect'),input=document.getElementById('apexStudioColor-primary');
   return team?.value&&input?.value.toLowerCase()==='#34acde';
  },null,{timeout:30000});
  assert.equal(await page.locator('#apexStudioColor-primary').inputValue(),'#34acde',
   'El color personalizado persiste tras recarga');
  assert.equal(await page.locator('#apexStudioColor-secondary').inputValue(),'#172f46');
  assert.equal(await page.locator('#apexStudioColor-accent').inputValue(),'#ee8822');
  await page.locator('#apexStudioReset').click();
  assert.notEqual(await page.locator('#apexStudioColor-primary').inputValue(),'#34acde',
   'Restaurar recupera la pintura original de la escudería');
  // Layout contract: on desktop Circuito and Vehículo share one 50/50 row;
  // on a narrow/mobile viewport they stack rather than clipping the car.
  const split=await page.evaluate(()=>{
    const c=document.querySelector('.apexProtoCircuitPanel')?.getBoundingClientRect();
    const v=document.querySelector('.apexProtoVehiclePanel')?.getBoundingClientRect();
    const d=document.querySelector('.apexProtoDetails')?.getBoundingClientRect();
    return {circuit:c&&{x:c.x,y:c.y,width:c.width,height:c.height,bottom:c.bottom},
     vehicle:v&&{x:v.x,y:v.y,width:v.width,height:v.height,bottom:v.bottom},
     details:d&&{width:d.width},viewport:innerWidth};
  });
  assert.ok(split.circuit&&split.vehicle&&split.details,'Ambos paneles permanecen visibles');
  if(!mobile){
    assert.ok(Math.abs(split.circuit.y-split.vehicle.y)<4,
     'Circuito y Vehículo en una misma fila en escritorio '+JSON.stringify(split));
    const fraction=split.vehicle.width/split.details.width;
    assert.ok(fraction>.44&&fraction<.52,
     'El vehículo debe ocupar aproximadamente la mitad de la pantalla '+JSON.stringify(split));
    assert.ok(split.circuit.height>=500&&split.vehicle.height>=500,
     'Ambos paneles deben tener espacio suficiente para el contenido');
  }else{
    assert.ok(split.vehicle.y>=split.circuit.bottom-3,
     'En pantallas estrechas deben apilarse sin montarse '+JSON.stringify(split));
  }
  const geometry=await panel.evaluate(el=>{
   const rect=el.getBoundingClientRect();
   const hero=el.querySelector('.apexStudioHero').getBoundingClientRect();
   const controls=el.querySelector('.apexStudioControls').getBoundingClientRect();
   const image=el.querySelector('.apexStudioStage img').getBoundingClientRect();
   return {overflow:el.scrollWidth-el.clientWidth,
    heroBelowHeader:hero.top>=el.querySelector('h2').getBoundingClientRect().bottom-1,
    imageInsideHero:image.top>=hero.top-1&&image.bottom<=hero.bottom+1&&
     image.left>=hero.left-1&&image.right<=hero.right+1,
    controlsBelowHero:controls.top>=hero.bottom-1,
    controlsInside:controls.bottom<=rect.bottom+2,
    bounds:{heroTop:Math.round(hero.top),heroBottom:Math.round(hero.bottom),
      imageTop:Math.round(image.top),imageBottom:Math.round(image.bottom),
      imageHeight:Math.round(image.height),controlsTop:Math.round(controls.top)}};
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
  console.log(JSON.stringify({test:'apex-vehicle-team-studio',mobile,teams:options.length,geometry,split,ok:true}));
  await context.close();
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
