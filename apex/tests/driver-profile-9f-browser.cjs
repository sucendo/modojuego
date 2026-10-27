/* APEX 9F.1 — Perfil de piloto y casco: interfaz, persistencia y no regresión.
 * Servir el repositorio en localhost:8765. Ejecución desktop/mobile.
 */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext(mobile?
   {viewport:{width:844,height:390},isMobile:true,hasTouch:true}:
   {viewport:{width:1440,height:900}});
  // A profile created before visor finishes existed must retain its colours.
  await context.addInitScript(()=>{
   if(!localStorage.getItem('apex26.driverProfile.v1'))localStorage.setItem('apex26.driverProfile.v1',JSON.stringify({version:1,name:'Piloto anterior',helmet:{primary:'#183354',secondary:'#e34c21',trim:'#eeeeee',visor:'#192a37',pattern:'bands'}}));
  });
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(30000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexDriverProfile9F&&!!window.ApexMenuPrototype9A&&
   !!document.getElementById('apex9fProfileScreen'),null,{timeout:90000});
  const legacy=await page.evaluate(()=>window.ApexDriverProfile9F.get());
  assert.equal(legacy.name,'Piloto anterior');
  assert.equal(legacy.helmet.primary,'#183354');
  assert.equal(legacy.helmet.pattern,'bands');
  assert.equal(legacy.helmet.visorFinish,'iridium','Perfiles v1 sin acabado siguen siendo válidos');
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
  const variations=await page.evaluate(async()=>{
   const profile=window.ApexDriverProfile9F.get();
   const patterns=Array.from(document.querySelector('#apexHelmetPattern').options).map(o=>o.value);
   const finishes=Array.from(document.querySelector('#apexHelmetVisorFinish').options).map(o=>o.value);
   const pixels=[],visorPixels=[],signatures=new Set();let combinations=0;
   for(const pattern of patterns)for(const visorFinish of finishes){
    const source=window.ApexDriverProfile9F.helmetSvg({...profile,name:'Álex & Samuel',helmet:{primary:'#a8e230',secondary:'#17334e',trim:'#f4f7fb',visor:'#182c40',pattern,visorFinish}},'audit');
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw Error('Casco SVG inválido');
    if(doc.querySelector('image,filter,script'))throw Error('El casco debe ser vectorial sin filtros');
    signatures.add(JSON.stringify([...doc.querySelectorAll('.apex-helmet-shell,.apex-helmet-eyeport,.apex-helmet-visor,.apex-helmet-base,.apex-helmet-spoiler,.apex-helmet-hinge,.apex-helmet-vent')].map(el=>el.getAttribute('d'))));
    const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);await img.decode();
    const canvas=document.createElement('canvas');canvas.width=390;canvas.height=300;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
    const data=ctx.getImageData(0,0,390,300).data;
    if(visorFinish==='iridium')pixels.push(data);
    if(pattern==='racing')visorPixels.push(Array.from(ctx.getImageData(85,138,160,22).data));
    combinations++;
   }
   let minimumDifference=1;
   for(let i=0;i<pixels.length;i++)for(let j=i+1;j<pixels.length;j++){
    let changed=0;for(let k=0;k<pixels[i].length;k+=4)if(Math.abs(pixels[i][k]-pixels[j][k])+Math.abs(pixels[i][k+1]-pixels[j][k+1])+Math.abs(pixels[i][k+2]-pixels[j][k+2])>60)changed++;
    minimumDifference=Math.min(minimumDifference,changed/(390*300));
   }
   return {patterns:patterns.length,finishes:finishes.length,combinations,geometries:signatures.size,minimumDifference,
    distinctVisors:new Set(visorPixels.map(p=>JSON.stringify(p))).size};
  });
  assert.equal(variations.patterns,11);assert.equal(variations.finishes,4);assert.equal(variations.combinations,44);
  assert.equal(variations.geometries,1,'La decoración y la visera no cambian la forma del casco');
  assert.ok(variations.minimumDifference>.005,'Las once pinturas son visualmente diferentes');
  assert.equal(variations.distinctVisors,4,'Cuatro acabados de visera visibles');
  console.log(JSON.stringify({test:'helmet-variations',...variations,ok:true}));
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
  const suit=page.locator('#apexSuitPreview > svg'),avatar=page.locator('#apexDriverAvatarImage > svg');
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
  await page.locator('#apexHelmetPattern').selectOption('organic');
  await page.locator('#apexHelmetVisorFinish').selectOption('gold');
  await page.locator('[name="helmetVisor"]').fill('#243751');
  assert.equal(await avatar.locator('[data-apex-helmet]').getAttribute('data-paint'),'organic');
  assert.equal(await avatar.locator('[data-apex-helmet]').getAttribute('data-visor-finish'),'gold');
  const duplicateIds=await page.locator('[id^="apexHelmet-"]').evaluateAll(els=>els.map(e=>e.id).filter((id,i,ids)=>ids.indexOf(id)!==i));
  assert.deepEqual(duplicateIds,[],'Editor, avatar e icono tienen recursos SVG independientes');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#apexProfileExportAvatar').click();
  const avatarDownload=await downloadPromise;
  assert.equal(avatarDownload.suggestedFilename(),'APEX26-perfil-piloto.svg');
  const exportSvg=fs.readFileSync(await avatarDownload.path(),'utf8');
  assert.ok(exportSvg.includes('data-paint="organic"')&&exportSvg.includes('data-visor-finish="gold"'),
   'El avatar descargado contiene el mismo casco y acabado que el editor');

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
  assert.equal(saved.helmet.pattern,'organic');
  assert.equal(saved.helmet.visorFinish,'gold');
  assert.equal(saved.helmet.visor,'#243751');
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
  assert.equal(await page.locator('#apexHelmetPattern').inputValue(),'organic');
  assert.equal(await page.locator('#apexSuitSource').inputValue(),'custom');
  assert.equal(await page.locator('#apexSuitPattern').inputValue(),'diagonal');
  assert.equal(await page.locator('[name="suitPrimary"]').inputValue(),'#107a51');
  assert.ok((await page.locator('#apexDriverAvatarImage > svg').evaluate(el=>el.outerHTML)).includes('#107a51'),
   'Avatar restaurado con la personalización guardada');
  assert.equal(await page.locator('#apexHelmetVisorFinish').inputValue(),'gold');
  await page.locator('#apexHelmetReset').click();
  assert.equal(await page.locator('#apexHelmetPattern').inputValue(),'racing');
  assert.equal(await page.locator('#apexDriverName').inputValue(),'Lucía Martín','Restablecer solo cambia el casco');
  assert.equal(await page.locator('[name="suitPrimary"]').inputValue(),'#107a51','No borra el mono independiente');
  assert.equal(await page.evaluate(()=>window.ApexDriverProfile9F.get().helmet.pattern),'organic','Restablecer no sobrescribe el guardado');
  await page.locator('#apexHelmetRecover').click();
  assert.equal(await page.locator('#apexHelmetPattern').inputValue(),'organic');
  assert.equal(await page.locator('#apexHelmetVisorFinish').inputValue(),'gold');
  assert.equal(await page.locator('[name="helmetVisor"]').inputValue(),'#243751');
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
