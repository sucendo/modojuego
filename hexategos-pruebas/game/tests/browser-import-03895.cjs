'use strict';
/* Browser regression for the published same-origin iframe. Synthetic legacy
 * save deliberately lacks aiCampaigns; no user save is ever uploaded to CI. */
const assert=require('node:assert/strict');
const { chromium }=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1366,height:800}});
 let crashed=false;const errors=[];
 page.on('crash',()=>{crashed=true});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos-pruebas/',{waitUntil:'load',timeout:120000});
  const view=page.frameLocator('iframe[title="Hexategos pruebas"]');
  await view.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();
  await view.getByRole('button',{name:/UBICACIÓN ALEATORIA/}).click();
  await view.getByRole('button',{name:/COMENZAR AQUÍ/}).click();
  const game=page.frames().find(f=>f.url().includes('/hexategos-pruebas/game/'));
  assert(game,'Game iframe not found');
  await game.waitForFunction(()=>started3230&&owner6.length===510762,null,{timeout:90000});
  const encoded=await game.evaluate(async()=>{
    paused3230=true;
    gold3212=8064;
    const save=buildPortableFile3275();
    delete save.payload.aiCampaigns;
    delete save.payload.regionalAI;
    save.gameVersion='0.37.9';
    save.checksum=fnv1a3273(JSON.stringify(save.payload));
    const bytes=new TextEncoder().encode(JSON.stringify(save));
    const compressed=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    const full=new Uint8Array(5+compressed.length);full.set([72,88,90,50,0]);full.set(compressed,5);
    let b64='';for(let i=0;i<full.length;i+=12000)
      b64+=String.fromCharCode(...full.subarray(i,i+12000));
    return {base64:btoa(b64),cities:cities3212.size,sites:save.payload.production0388?.sites?.length||0};
  });
  await view.locator('#gameLoadFile3306').setInputFiles({
    name:'HEXATEGOS_LEGACY_SYNTHETIC_510762.hexategos',
    mimeType:'application/octet-stream',buffer:Buffer.from(encoded.base64,'base64')
  });
  const confirm=view.locator('.hexUnifiedDialog03851');
  await confirm.waitFor({state:'visible',timeout:20000});
  await confirm.getByRole('button',{name:'Cargar partida'}).click();
  await game.waitForFunction(()=>window.HexategosImportScheduler03895?.status().stage==='apply:done',null,{timeout:120000});
  const restored=await game.evaluate(()=>({
    gold:gold3212,cells:owner6.length,cities:cities3212.size,
    sites:window.HexategosProduction0388?.snapshot?.().sites?.length||0,
    paused:paused3230,diag:window.HexategosImportScheduler03895?.status()
  }));
  assert.equal(restored.gold,8064);
  assert.equal(restored.cells,510762);
  assert.equal(restored.cities,encoded.cities);
  assert.equal(restored.sites,encoded.sites);
  assert.equal(restored.paused,true);
  assert.equal(restored.diag.skippedNational,149);
  assert.equal(restored.diag.pendingNation,1);
  assert.equal(crashed,false);
  assert.deepEqual(errors,[]);
  await game.evaluate(()=>{paused3230=false});
  await game.waitForFunction(()=>window.HexategosImportScheduler03895?.status().pendingNation!==1,null,{timeout:120000});
  await game.evaluate(()=>{paused3230=true});
  assert.equal(crashed,false);
  console.log('CHROMIUM 0.38.95 PASS: synthetic old HXZ2, same-origin iframe, 510762 cells, deferred AI',restored);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});