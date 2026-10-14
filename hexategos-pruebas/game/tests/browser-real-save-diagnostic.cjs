/* Run with: HEX_TEST_URL=http://127.0.0.1:8765/hexategos-pruebas/ HEX_SAVE_FILE=/private/path/save.hexategos node tests/browser-real-save-diagnostic.cjs
 * The supplied save is read locally and NEVER uploaded to GitHub.
 */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const filePath=process.env.HEX_SAVE_FILE;
if(!filePath||!fs.existsSync(filePath))throw Error('Set HEX_SAVE_FILE to the original .hexategos');
const url=process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos-pruebas/';
const timeout=Number(process.env.HEX_TIMEOUT_MS||180000);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1365,height:850}});
 const start=Date.now(),events=[],failures=[];
 const record=(phase,data={})=>{const entry={elapsedMs:Date.now()-start,phase,...data};events.push(entry);console.log('IMPORT_DIAG',JSON.stringify(entry))};
 page.on('console',msg=>{if(msg.type()==='error')record('console-error',{message:msg.text().slice(0,500)})});
 page.on('pageerror',e=>{failures.push(String(e));record('pageerror',{message:String(e).slice(0,500)})});
 page.on('crash',()=>{failures.push('PAGE_CRASH');record('page-crash')});
 page.on('close',()=>record('page-close'));
 try{
  record('navigate',{url});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout});
  const frame=page.frameLocator('iframe[title="Hexategos pruebas"]');
  const game=page.frames().find(f=>f.url().includes('/hexategos-pruebas/game/'))||page.mainFrame();
  await game.waitForFunction(()=>document.querySelector('#landingFile3305,#gameLoadFile3306'),null,{timeout});
  await game.evaluate(()=>{
   const phases=['importGameText3273','applyPortableFile3275','applyMainState3275','loadGame3212','saveGame3212'];
   window.__hexRestoreTrace=[];
   const mark=(phase,event,error)=>{const value={phase,event,time:performance.now(),error:error?String(error).slice(0,400):null};window.__hexRestoreTrace.push(value);console.log('[HEX_RESTORE]',JSON.stringify(value))};
   phases.forEach(name=>{
    try{
     const original=window[name];
     if(typeof original!=='function')return;
     window[name]=function(...args){
      mark(name,'start');
      try{
       const result=original.apply(this,args);
       if(result&&typeof result.then==='function')return result.then(v=>{mark(name,'end');return v},e=>{mark(name,'error',e);throw e});
       mark(name,'end');return result;
      }catch(e){mark(name,'error',e);throw e}
     };
    }catch(e){mark(name,'instrument-error',e)}
   });
  });
  record('upload-start',{bytes:fs.statSync(filePath).size});
  const load=game.locator('#landingFile3305');
  if(await load.count())await load.setInputFiles(filePath);
  else await game.locator('#gameLoadFile3306').setInputFiles(filePath);
  record('file-selected');
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline){
   if(failures.includes('PAGE_CRASH'))throw Error('Chromium renderer crashed');
   const dialog=game.locator('.hexUnifiedDialog03851');
   if(await dialog.isVisible().catch(()=>false)){
    const btn=dialog.getByRole('button',{name:/Cargar partida|Confirmar|Aceptar/i}).first();
    if(await btn.isVisible().catch(()=>false)){await btn.click();record('confirmed')}
   }
   let state;
   try{state=await game.evaluate(()=>({started:typeof started3230!=='undefined'&&started3230,
    cells:typeof owner6!=='undefined'&&owner6?.length,
    campaign:typeof campaignSeconds3230!=='undefined'?campaignSeconds3230:null,
    traces:window.__hexRestoreTrace?.slice(-8)||[],
    heap:performance.memory?.usedJSHeapSize||null}));}
   catch(e){record('evaluate-error',{message:String(e)});throw e}
   record('poll',state);
   if(state.started&&state.cells===510762&&state.campaign>=14002){
    await page.waitForTimeout(3000);
    record('loaded-and-responsive');
    assert(!failures.length,'Browser exceptions: '+failures.join(';'));
    return;
   }
   await page.waitForTimeout(1200);
  }
  throw Error('Import did not complete before timeout');
 }finally{
  record('finished',{failures});
  await browser.close();
 }
})().catch(e=>{console.error('IMPORT_DIAG_FAILED',e);process.exitCode=1});
