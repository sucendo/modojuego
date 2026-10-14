/* Real Chromium regression: large HXZ2 import inside a cross-origin iframe.
 * This reproduces the hexategos-pruebas embedding pattern without changing main.
 */
const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[
 process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()
]}));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 let crashed=false;
 const errors=[];
 page.on('crash',()=>{crashed=true});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const origin=process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos/';
  await page.route('http://127.0.0.1:8766/hexategos-pruebas/',route=>
   route.fulfill({status:200,contentType:'text/html',body:
    '<!doctype html><title>Hexategos Pruebas</title><iframe title="Hexategos Pruebas" src="'+
    origin+'" style="width:100vw;height:100vh;border:0"></iframe>'}));
  await page.goto('http://127.0.0.1:8766/hexategos-pruebas/',{waitUntil:'load',timeout:120000});
  const frame=page.frameLocator('iframe');
  assert.notEqual(new URL(origin).origin,new URL(page.url()).origin,'Test must use a cross-origin iframe');
  await frame.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();
  await frame.getByRole('button',{name:/UBICACIÓN ALEATORIA/}).click();
  await frame.getByRole('button',{name:/COMENZAR AQUÍ/}).click();
  const game=page.frames().find(f=>f.url().includes('/hexategos/')&&!f.url().includes('pruebas'));
  assert(game,'Game iframe not found');
  await game.waitForFunction(()=>typeof started3230!=='undefined'&&started3230&&owner6.length===510762,
   {timeout:90000});
  const file=await game.evaluate(async()=>{
   paused3230=true;
   gold3212=16384;
   const save=buildPortableFile3275();
   if(save.payload.main.owner.length!==510762)throw Error('Saved mesh invalid');
   const data=new TextEncoder().encode(JSON.stringify(save));
   const gzip=new Uint8Array(await new Response(
      new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'))
   ).arrayBuffer());
   gold3212=19;
   return Array.from(new Uint8Array([72,88,90,50,0,...gzip]));
  });
  assert(file.length>1000);
  await frame.locator('#gameLoadFile3306').setInputFiles({
   name:'HEXATEGOS_TEST_510762.hexategos',
   mimeType:'application/octet-stream',
   buffer:Buffer.from(file)
  });
  const confirm=frame.locator('.hexUnifiedDialog03851');
  await confirm.waitFor({state:'visible',timeout:20000});
  await confirm.getByRole('button',{name:'Cargar partida'}).click();
  await game.waitForFunction(()=>gold3212===16384,null,{timeout:120000});
  await confirm.waitFor({state:'detached',timeout:15000});
  assert.equal(crashed,false,'Chromium renderer must remain alive');
  assert.deepEqual(errors,[],'No uncaught browser exceptions');
  const check=await game.evaluate(()=>({
   gold:gold3212,cells:owner6.length,active:started3230,
   message:window.HexategosPortableHXZ2?.stats?.().lastError||null
  }));
  assert.equal(check.gold,16384);
  assert.equal(check.active,true);
  assert.equal(check.message,null);
  console.log('CHROMIUM HXZ2 PASS: 510,762 cells imported inside iframe without renderer crash',check);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
