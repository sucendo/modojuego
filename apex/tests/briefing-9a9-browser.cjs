/* APEX 9A.9 · Fidelidad de preparación y conexión nativa en cuatro modos.
   Ejecutar después de servir el repositorio en localhost:8765.
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
  page.setDefaultTimeout(25000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexBriefingPrototype9A&&!!window.ApexMenuPrototype9A&&
   document.getElementById('teamSelect')?.options.length>0,null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  for(const m of [
   {key:'quick',root:'#apex9aPreparation',distance:'#apex9aPrepDistance',native:'#laps',tyres:'#apex9aTyres',strategy:'#apex9aStrategy',cancel:'#apex9aCancel'},
   {key:'practice',root:'#apex9aPreparation',distance:null,native:null,tyres:'#apex9aTyres',strategy:'#apex9aStrategy',cancel:'#apex9aCancel'},
   {key:'grandprix',root:'#apex9aCompetitionSetup',distance:'#apex9aCompDistanceSelect',native:'#gpLaps',tyres:'#apex9aCompTyres',strategy:'#apex9aCompStrategy',cancel:'#apex9aCompCancel'},
   {key:'season',root:'#apex9aCompetitionSetup',distance:'#apex9aCompDistanceSelect',native:'#seasonDistance',tyres:'#apex9aCompTyres',strategy:'#apex9aCompStrategy',cancel:'#apex9aCompCancel'}
  ]){
   await page.locator('[data-apex-mode="'+m.key+'"]').click();
   await page.locator('#apexProtoNext').click();
   const root=page.locator(m.root);
   await page.waitForFunction(sel=>document.querySelector(sel)?.dataset.briefingProto==='1',m.root);
   assert.equal(await root.isVisible(),true,'Pantalla visible '+m.key);
   assert.equal(await root.locator('.apex9aBriefGrid>.apex9aPrepCard').count(),3);
   assert.equal(await root.locator('.apexBriefWeatherBanner').count(),1);
   assert.equal(await root.locator('.apexBriefHeroPhoto').count(),1);
   assert.equal(await root.locator('.apexBriefTrackTitle').innerText()==='',false);
   const tyres=root.locator(m.tyres+' button.apex9aTyre');
   assert.equal(await tyres.count(),5,'Cinco compuestos reales '+m.key);
   assert.ok((await root.locator('.apex9aBriefTyres img').count())>=5,'Imágenes de neumáticos '+m.key);
   const strategy=root.locator('.apexBriefStrategies button');
   assert.equal(await strategy.count(),3,'Tres estrategias visuales '+m.key);
   const original=await page.locator(m.strategy).inputValue();
   if(m.key!=='practice'){
    const choice=original==='aggressive'?'balanced':'aggressive';
    await root.locator('.apexBriefStrategies button[data-value="'+choice+'"]').click();
    assert.equal(await page.locator(m.strategy).inputValue(),choice,'Estrategia visual modifica control real '+m.key);
    await page.locator(m.strategy).selectOption(original);
   }
   const distanceChips=root.locator('.apexBriefDistance button');
   if(m.distance){
    assert.equal(await distanceChips.count(),4,'Cuatro distancias '+m.key);
    await root.locator('.apexBriefDistance button[data-value="50"]').click();
    assert.equal(await page.locator(m.native).inputValue(),'50','Distancia sincronizada '+m.key);
   }else{
    assert.equal(await root.locator('.apexBriefDistanceSection').isVisible(),false,'Entrenamiento sin distancia GP');
   }
   const title=await root.locator('.apexBriefTrackTitle').innerText();
   const photo=await root.locator('.apexBriefHeroPhoto').evaluate(x=>getComputedStyle(x).backgroundImage);
   if(!/m[oó]naco|monaco/i.test(title))assert.ok(!photo.includes('prep-monaco.webp'),'No mostrar Mónaco en circuito distinto');
   const tyreImages=await tyres.locator('img').evaluateAll(async imgs=>{
    await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));
    return imgs.length===5&&imgs.every(x=>x.complete&&x.naturalWidth>0);
   });
   assert.equal(tyreImages,true,'PNG/WebP RGBA cargados '+m.key);
   await root.screenshot({path:'/tmp/apex-results/9a9-'+(mobile?'mobile':'desktop')+'-'+m.key+'.png',fullPage:true});
   await page.locator(m.cancel).click();
   assert.equal(await root.isVisible(),false);
  }
  assert.deepEqual(errors.filter(x=>/SyntaxError|Cannot read properties|Unexpected end/.test(x)),[]);
  console.log(JSON.stringify({test:'apex-9a9-briefing-prototype',mobile,modeCount:4,ok:true}));
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
