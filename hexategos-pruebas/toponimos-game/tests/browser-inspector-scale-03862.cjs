/* Requires Playwright; see browser-inspector-03861.cjs for runtime options. */
const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.HEX_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});
 const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto(process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos/',{waitUntil:'load'});
 await page.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();
 await page.getByRole('button',{name:/UBICACIÓN ALEATORIA/}).click();
 await page.getByRole('button',{name:/COMENZAR AQUÍ/}).click();
 await page.waitForFunction(()=>started3230&&capitals[0]>=0);
 await page.evaluate(()=>{paused3230=true;openContextDialog3244(cellContext3244(capitals[0]),50,100)});
 const measure=()=>page.locator('#contextMenu3244').evaluate(el=>{
   const r=el.getBoundingClientRect(),button=el.querySelector('.ctxAction3244'),icon=button.querySelector('svg');
   return {width:r.width,right:r.right,bottom:r.bottom,x:r.x,y:r.y,button:button.getBoundingClientRect().height,icon:icon.getBoundingClientRect().width,zoom:Number(getComputedStyle(el).zoom),overflow:el.scrollWidth>el.clientWidth+1};
 });
 const results={};
 for(const value of ['100','75','90','110','120','130','145','auto']){
   // Use the real bound Options select's change handler, including persistence.
   await page.evaluate(value=>{const select=document.getElementById('landingFontSelect0387');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));},value);
   await page.waitForTimeout(100);results[value]=await measure();
   assert(results[value].right<=1441&&results[value].bottom<=1081&&!results[value].overflow,JSON.stringify({value,geometry:results[value]}));
 }
 assert(Math.abs(results['75'].width/results['100'].width-.75)<.01);
 assert(Math.abs(results['75'].icon/results['100'].icon-.75)<.01);
 assert(results['75'].button<results['100'].button);
 assert(results['90'].width<results['100'].width);
 for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.waitForTimeout(300);
   await page.evaluate(()=>openContextDialog3244(cellContext3244(capitals[0]),50,100));
   for(const value of ['75','90','100','145']){
     await page.evaluate(value=>HexategosTypography0387.set(value),value);await page.waitForTimeout(120);
     const m=await measure();assert(m.right<=width+1&&m.bottom<=845&&m.x>=0&&!m.overflow,JSON.stringify({width,value,m}));
   }
 }
 await page.evaluate(()=>HexategosTypography0387.set('75'));
 await page.reload({waitUntil:'load'});
 assert.equal(await page.evaluate(()=>HexategosTypography0387.get()),'75');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--hex-dialog-zoom').trim()),'0.75');
 assert.deepEqual(errors,[]);
 console.log('PASS: real Options select, all presets, proportional compact width/buttons/icons, live repositioning, mobile 390/320 bounds, persisted compact setting on reload.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
