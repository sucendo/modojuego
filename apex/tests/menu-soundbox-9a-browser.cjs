/* APEX 9A · Comprobar tema oficial SoundBox en menus y respeto del audio. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
const apex=path.resolve(__dirname,'..');
const file=path.join(apex,'assets/soundbox/apex-song01.js');
const songctx=vm.createContext({});
vm.runInContext(fs.readFileSync(file,'utf8'),songctx);
assert.equal(songctx.song.numChannels,42);
assert.equal(songctx.song.songData.length,42);
assert.equal(songctx.song.rowLen,4828);
assert.equal(songctx.song.endPattern,71);
assert.ok(fs.statSync(path.join(apex,'assets/music/apex-theme.mp3')).size>100000,
 'Debe existir la composición completa MP3 renderizada, no los osciladores provisionales');

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
  let fetched=false;
  page.on('response',r=>{if(r.url().includes('assets/music/apex-theme.mp3')&&r.ok())fetched=true;});
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ApexMenuMusic9A&&document.getElementById('apex9aAudio'),null,{timeout:90000});
  assert.equal(await page.evaluate(()=>window.ApexMenuMusic9A.state().playing),false,'Sin autoplay');
  await page.locator('#apex9aAudio').click();
  await page.waitForFunction(()=>window.ApexMenuMusic9A.state().playing,null,{timeout:30000});
  assert.equal(await page.evaluate(()=>window.ApexMenuMusic9A.get()),true);
  await page.waitForFunction(()=>{
   const p=window.ApexMenuMusic9A.state();
   return p.readyState>=2&&p.duration>250&&p.duration<255;
  },null,{timeout:30000});
  // La duración decodificada prueba que se cargó la pista completa, aunque
  // Chromium sirva la petición MP3 por caché o por Range (206).
  assert.ok((await page.evaluate(()=>window.ApexMenuMusic9A.state().duration))>250,
    'Audio completo SoundBox cargado, no la melodía provisional');
  const state=await page.evaluate(()=>window.ApexMenuMusic9A.state());
  assert.equal(state.src,'assets/music/apex-theme.mp3');
  assert.ok(state.volume<=.4,'Volumen de menú prudente');
  await page.locator('#apex9aRace').click();
  assert.equal(await page.evaluate(()=>window.ApexMenuMusic9A.state().playing),true,
   'Música continúa entre pantallas de menú');
  await page.locator('#apexProtoModeBack').click();
  await page.locator('#apex9aOptions').click();
  assert.equal(await page.locator('#apexProtoAudioText').innerText(),'MÚSICA ACTIVADA');
  await page.locator('#apexProtoAudioText').click();
  await page.waitForFunction(()=>!window.ApexMenuMusic9A.state().playing);
  assert.equal(await page.evaluate(()=>window.ApexMenuMusic9A.get()),false,'Pausar desde Opciones');
  await page.locator('#apexProtoAudioText').click();
  await page.waitForFunction(()=>window.ApexMenuMusic9A.state().playing);
  await page.evaluate(()=>document.getElementById('menu').classList.add('hidden'));
  await page.waitForFunction(()=>!window.ApexMenuMusic9A.state().playing,null,{timeout:10000});
  await page.evaluate(()=>document.getElementById('menu').classList.remove('hidden'));
  // Algunos navegadores móviles requieren un gesto para volver a reproducir
  // tras salir de carrera. Debe poder reanudarse sin recrear el audio.
  if(!(await page.evaluate(()=>window.ApexMenuMusic9A.state().playing))){
   const back=page.locator('#apexProtoModeBack');
   if(await back.isVisible())await back.click();
   else await page.keyboard.press('Shift');
  }
  await page.waitForFunction(()=>window.ApexMenuMusic9A.state().playing,null,{timeout:30000});
  // Reingresar en el documento no debe arrancar música sin un gesto previo.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ApexMenuMusic9A&&document.getElementById('apex9aAudio'),null,{timeout:90000});
  assert.equal(await page.evaluate(()=>window.ApexMenuMusic9A.get()),true,'Preferencia preservada');
  assert.equal(await page.evaluate(()=>window.ApexMenuMusic9A.state().playing),false,'Sin autoplay tras recarga');
  await page.locator('#apex9aRace').click();
  await page.waitForFunction(()=>window.ApexMenuMusic9A.state().playing,null,{timeout:30000});
  assert.deepEqual(errors.filter(s=>/SyntaxError|Cannot read properties/.test(s)),[]);
  console.log(JSON.stringify({test:'soundbox-official-theme',mobile,loaded:fetched,ok:true}));
  await context.close();
 } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
