/* APEX 9F.1 — Perfil de piloto y casco: interfaz, persistencia y no regresión.
 * Servir el repositorio en localhost:8765. Ejecución desktop/mobile.
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
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexDriverProfile9F&&!!window.ApexMenuPrototype9A&&
   !!document.getElementById('apex9fProfileScreen'),null,{timeout:90000});
  const before=await page.evaluate(()=>window.ApexNativeSeason9A?.snapshot?.()||null);
  assert.equal(await page.locator('#apex9fProfileScreen').isVisible(),false,'Perfil empieza oculto');
  await page.locator('#apex9aProfile').click();
  const screen=page.locator('#apex9fProfileScreen');
  assert.equal(await screen.isVisible(),true,'Botón Perfil abre su pantalla propia');
  assert.equal(await page.locator('#apex9aLanding').isVisible(),false,'La portada no se superpone al Perfil');
  assert.equal(await page.locator('#apex9aModesScreen').isVisible(),false);
  const svg=page.locator('#apexProfileHelmetImage svg');
  assert.equal(await svg.count(),1,'Casco SVG real');
  const original=await svg.evaluate(el=>el.outerHTML);
  await page.locator('#apexDriverName').fill('Lucía Martín');
  await page.locator('#apexDriverAge').fill('27');
  await page.locator('#apexDriverGender').selectOption('female');
  await page.locator('#apexDriverNationality').fill('España');
  await page.locator('#apexDriverNumber').fill('7');
  await page.locator('[name="helmetPrimary"]').evaluate(el=>{el.value='#114477';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('[name="helmetSecondary"]').evaluate(el=>{el.value='#ff3366';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('[name="helmetTrim"]').evaluate(el=>{el.value='#eeeeee';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#apexHelmetPattern').selectOption('chevron');
  assert.notEqual(await svg.evaluate(el=>el.outerHTML),original,'El casco cambia realmente con los colores');
  assert.ok((await svg.evaluate(el=>el.outerHTML)).includes('#ff3366'),'Color real aplicado al casco');
  assert.equal(await page.locator('#apexProfileNamePreview').innerText(),'Lucía Martín');
  assert.equal(await page.locator('#apexProfileNumberPreview').innerText(),'#07');
  await page.waitForFunction(()=>!!window.ApexDriverAppearance9F&&
   !!document.querySelector('#apexSuitPreview svg')&&
   !!document.querySelector('#apexDriverAvatarImage svg'),null,{timeout:30000});
  const suit=page.locator('#apexSuitPreview svg'),avatar=page.locator('#apexDriverAvatarImage svg');
  const initialSuit=await suit.evaluate(el=>el.outerHTML),initialAvatar=await avatar.evaluate(el=>el.outerHTML);
  assert.ok(initialSuit.includes('#114477')&&initialAvatar.includes('#ff3366'),
   'Mono y avatar emplean la paleta del casco en modo combinado');
  await page.locator('#apexSuitSource').selectOption('custom');
  await page.locator('[name="suitPrimary"]').evaluate(el=>{
   el.value='#107a51';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.locator('[name="suitSecondary"]').evaluate(el=>{
   el.value='#e7a334';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.locator('[name="suitTrim"]').evaluate(el=>{
   el.value='#f1f2f3';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.locator('#apexSuitPattern').selectOption('diagonal');
  assert.notEqual(await suit.evaluate(el=>el.outerHTML),initialSuit);
  assert.notEqual(await avatar.evaluate(el=>el.outerHTML),initialAvatar);
  assert.ok((await suit.evaluate(el=>el.outerHTML)).includes('#107a51'));
  assert.ok((await avatar.evaluate(el=>el.outerHTML)).includes('#e7a334'));
  const customSnapshot=await page.locator('[name="suitPrimary"]').inputValue();
  await page.locator('#apexSuitSource').selectOption('helmet');
  assert.ok((await suit.evaluate(el=>el.outerHTML)).includes('#114477'),
   'Vincular mono con casco actualiza la apariencia');
  await page.locator('#apexSuitSource').selectOption('team');
  const teamPalette=await page.evaluate(()=>window.ApexDriverAppearance9F.selectedTeamPalette());
  assert.ok(teamPalette&&/^#[0-9a-f]{6}$/i.test(teamPalette.primary),
   'Escudería real disponible para combinar colores');
  assert.ok((await suit.evaluate(el=>el.outerHTML)).includes(teamPalette.primary),
   'Mono usa el color auténtico de la escudería');
  await page.locator('#apexSuitSource').selectOption('custom');
  assert.equal(await page.locator('[name="suitPrimary"]').inputValue(),customSnapshot,
   'Cambiar de paleta no destruye el diseño personalizado');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#apexProfileExportAvatar').click();
  const avatarDownload=await downloadPromise;
  assert.equal(avatarDownload.suggestedFilename(),'APEX26-perfil-piloto.svg');

  const geometry=await screen.evaluate(el=>({scroll:el.scrollWidth-el.clientWidth,forms:el.querySelectorAll('form').length}));
  assert.ok(geometry.scroll<=2,'Perfil sin desbordamientos horizontales '+JSON.stringify(geometry));
  await page.screenshot({path:'/tmp/apex-results/9f-profile-'+(mobile?'mobile-landscape':'desktop')+'.png',fullPage:true});
  await page.locator('#apexProfileSave').click();
  assert.match(await page.locator('#apexProfileStatus').innerText(),/GUARDADO CORRECTAMENTE/);
  const saved=await page.evaluate(()=>window.ApexDriverProfile9F.get());
  assert.equal(saved.name,'Lucía Martín');
  assert.equal(saved.displayName,'Lucía Martín');
  assert.equal(saved.age,27);
  assert.equal(saved.gender,'female');
  assert.equal(saved.nationality,'España');
  assert.equal(saved.number,7);
  assert.equal(saved.helmet.secondary,'#ff3366');
  assert.equal(saved.helmet.pattern,'chevron');
  assert.equal(saved.suit.source,'custom');
  assert.equal(saved.suit.primary,'#107a51');
  assert.equal(saved.suit.secondary,'#e7a334');
  assert.equal(saved.suit.trim,'#f1f2f3');
  assert.equal(saved.suit.pattern,'diagonal');
  assert.ok(await page.evaluate(()=>window.localStorage.getItem('apex26.driverProfile.v1')),'Persistencia local versionada');
  const after=await page.evaluate(()=>window.ApexNativeSeason9A?.snapshot?.()||null);
  const stable=x=>x?{...x,drivers:x.drivers?.map(({name,...rest})=>rest)}:x;
  assert.deepEqual(stable(after),stable(before),'Cambiar nombre no altera UID, calendario, puntos ni escuderías');
  const playerName=await page.evaluate(()=>typeof window.raceName==='function'?window.raceName(0):null);
  if(playerName!==null)assert.equal(playerName,'Lucía Martín','Nombre visible del piloto en motor');
  await page.locator('#apex9fBack').click();
  assert.equal(await screen.isVisible(),false);
  assert.equal(await page.locator('#apex9aLanding').isVisible(),true);
  await page.locator('#apex9aProfile').click();
  assert.equal(await page.locator('#apexDriverName').inputValue(),'Lucía Martín');
  // Cerrar sin guardar no debe sobrescribir cambios.
  await page.locator('#apexDriverName').fill('Cambio temporal');
  await page.locator('#apexProfileCancel').click();
  assert.equal(await page.evaluate(()=>window.ApexDriverProfile9F.get().name),'Lucía Martín');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexDriverProfile9F&&!!document.getElementById('apex9fProfileScreen'),null,{timeout:90000});
  assert.equal(await page.evaluate(()=>window.ApexDriverProfile9F.get().name),'Lucía Martín','Recarga conserva perfil');
  await page.locator('#apex9aProfile').click();
  assert.equal(await page.locator('#apexDriverGender').inputValue(),'female');
  assert.equal(await page.locator('#apexHelmetPattern').inputValue(),'chevron');
  assert.equal(await page.locator('#apexSuitSource').inputValue(),'custom');
  assert.equal(await page.locator('#apexSuitPattern').inputValue(),'diagonal');
  assert.equal(await page.locator('[name="suitPrimary"]').inputValue(),'#107a51');
  assert.ok((await page.locator('#apexDriverAvatarImage svg').evaluate(el=>el.outerHTML)).includes('#107a51'),
   'Avatar restaurado con la personalización guardada');
  await page.locator('#apex9fBack').click();
  await page.locator('#apex9aRace').click();
  assert.equal(await page.locator('#apex9aModesScreen').isVisible(),true,'Tipo de carrera sigue funcionando');
  await page.locator('#apexProtoModeBack').click();
  if(mobile){
   await page.setViewportSize({width:390,height:844});
   await page.locator('#apex9aProfile').click();
   const portrait=await page.locator('#apex9fProfileScreen').evaluate(el=>({
    total:el.scrollWidth-el.clientWidth,
    fields:el.querySelector('.apexProfileFields').scrollWidth-el.querySelector('.apexProfileFields').clientWidth
   }));
   assert.ok(portrait.total<=2&&portrait.fields<=2,'Móvil vertical sin scroll lateral '+JSON.stringify(portrait));
   await page.screenshot({path:'/tmp/apex-results/9f-profile-mobile-portrait.png',fullPage:true});
  }
  assert.deepEqual(errors.filter(e=>/SyntaxError|Unexpected end|Cannot read properties/.test(e)),[]);
  console.log(JSON.stringify({test:'apex-9f-profile',mobile,profileSaved:true,geometry,ok:true}));
  await context.close();
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
