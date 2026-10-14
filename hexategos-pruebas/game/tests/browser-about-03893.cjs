/* Browser verification of the complete "Acerca de" UI. */
const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[
 process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()
]}));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos/',{waitUntil:'load',timeout:120000});
  assert.match(await page.title(),/0\.38\.93/);
  await page.locator('#landingAbout0351').click();
  const overlay=page.locator('#aboutOverlay0351');
  await overlay.waitFor({state:'visible'});
  assert.equal(await overlay.getAttribute('aria-hidden'),'false');
  assert.match(await overlay.locator('.aboutHeadText0351 p').innerText(),/versión 0\.38\.93/);
  const current=overlay.locator('.aboutVersion0351.current0351');
  assert.equal(await current.count(),1);
  assert.match(await current.innerText(),/0\.38\.93/);
  const cards=overlay.locator('.aboutVersion0351');
  assert((await cards.count())>=65,'historical milestones must be preserved');
  for(const [index,version] of ['0.38.93','0.38.92','0.38.91','0.38.77','0.38.75'].entries()){
    assert.match(await cards.nth(index).locator('h3').innerText(),new RegExp(version.replace(/\./g,'\\.')));
  }
  const all=await overlay.innerText();
  for(const label of ['Reclutamiento','Movilización','Guardado fiable','Sistemas estable','0.35.1']){
    assert(all.toLocaleLowerCase('es').includes(label.toLocaleLowerCase('es')),label+' missing from About');
  }
  await page.keyboard.press('Escape');
  assert.equal(await overlay.getAttribute('aria-hidden'),'true');
  await page.locator('#landingAbout0351').click();
  assert.equal(await overlay.getAttribute('aria-hidden'),'false');
  await overlay.locator('#aboutClose0351').click();
  assert.equal(await overlay.getAttribute('aria-hidden'),'true');
  assert.deepEqual(errors,[]);
  console.log('REAL BROWSER ABOUT PASS: v0.38.93, full history, current badge, reopen, close, no JS errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
