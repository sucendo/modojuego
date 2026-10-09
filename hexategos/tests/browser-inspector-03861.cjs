/* Run against a local server: HEX_TEST_URL=http://127.0.0.1:8765/hexategos/
   Optional HEX_CHROMIUM_PATH, HEX_TEST_OUTPUT, CODEX_PRIMARY_RUNTIME_NODE_MODULES. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.HEX_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});
 const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning'&&m.text().includes('Inspector'))errors.push(m.text())});
 try{
 await page.goto(process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos/',{waitUntil:'load'});
 await page.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();
 await page.getByRole('button',{name:/UBICACIÓN ALEATORIA/}).click();
 await page.getByRole('button',{name:/COMENZAR AQUÍ/}).click();
 await page.waitForFunction(()=>typeof started3230!=='undefined'&&started3230&&capitals[0]>=0);
 await page.evaluate(()=>{paused3230=true;openContextDialog3244(cellContext3244(capitals[0]),20,60);});
 const root=page.locator('#contextMenu3244');await root.waitFor({state:'visible'});await page.waitForTimeout(180);
 assert.equal(await root.locator('.ctxIndicator').count(),10);
 assert.equal(await root.locator('.ctxExtras03817').count(),0);
 assert(await page.evaluate(()=>document.querySelector('#ctxActions3244').compareDocumentPosition(document.querySelector('.ctxDetails03817'))&Node.DOCUMENT_POSITION_FOLLOWING));
 assert.equal(await root.locator('#ctxStrength3246').getAttribute('min'),'0');
 await page.evaluate(()=>{const s=document.getElementById('ctxStrength3246');s.value='43';s.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await page.evaluate(()=>strength3212.value),'43');
 await page.evaluate(()=>{const s=document.getElementById('ctxAdvance3246');s.value='20';s.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await page.evaluate(()=>advance3212.value),'20');
 await root.locator('[data-hex-section03858="studies"] > summary').click();
 await root.locator('[data-natural-study03834="geology"]').click();
 assert.equal(await page.evaluate(()=>HexategosProspection03831.status(capitals[0]).state),'pending');
 assert(await root.locator('[data-natural-study03834="geology"]').isDisabled());
 await page.evaluate(()=>{campaignSeconds3230+=60;HexategosWorldCore03828.step(1);HexategosHexInspector03817.refresh();});
 assert.equal(await page.evaluate(()=>HexategosProspection03831.status(capitals[0]).state),'completed');
 assert(await root.locator('[data-natural-study03834="geology"]').isDisabled());
 await root.locator('[data-hex-section03858="industry"] > summary').click();
 await page.waitForFunction(()=>document.querySelectorAll('#contextMenu3244 details[open]').length===1);
 assert.equal(await root.locator('details[open]').count(),1);
 assert.equal(await root.locator('[data-hex-section03858="studies"]').getAttribute('open'),null);
 // Original action is still connected to the existing manager.
 await root.locator('[data-action="production0388"]').first().click();
 assert.equal(await page.locator('#modal3244').getAttribute('aria-hidden'),'false');
 await page.locator('#modalClose3244').click();
 await page.evaluate(()=>openContextDialog3244(cellContext3244(capitals[0]),20,60));
 // Real installations, different levels, control persistence and port layout.
 assert.equal(await page.evaluate(()=>{gold3212=10000;return HexategosProduction0388.build(0,capitals[0],'textile',false)}),true);
 await page.evaluate(()=>{industries3212.add(capitals[0]);industryLevel3230[capitals[0]]=2;ports3212.add(capitals[0]);renderContextDialog3244(cellContext3244(capitals[0]));});
 assert.equal(await root.locator('[data-inspect-tab03817="port"]').count(),1);
 await page.waitForTimeout(180);
 await root.locator('[data-inspect-tab03817="industry"]').click();
 assert.equal(await page.evaluate(()=>HexategosHexInspector03817.current().tab),'industry');
 const slider=root.locator('[data-inspect-pct03817]').first();
 if(await slider.count()){
   await slider.evaluate(el=>{el.value='45';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
   assert.equal(await page.evaluate(()=>HexategosProduction0388.sitesOnCell(capitals[0])[0].pct),45);
 }
 await page.evaluate(()=>{document.getElementById('contextMenu3244').scrollTop=450;});
 const before=await root.evaluate(el=>el.scrollTop);
 await page.evaluate(()=>renderContextDialog3244(cellContext3244(capitals[0])));
 assert.equal(await root.evaluate(el=>el.scrollTop),before);
 const cases=await page.evaluate(()=>{
   const own=owner6.findIndex((f,i)=>f===0&&!cities3212.has(i));
   const enemy=capitals[1];
   const neutral=owner6.findIndex((f,i)=>f<0&&loadLevel(MAX_GAME_LEVEL3233).land[i]>=0);
   return [own,enemy,neutral];
 });
 for(const cell of cases){
   assert(cell>=0);await page.evaluate(cell=>openContextDialog3244(cellContext3244(cell),20,60),cell);
   assert.equal(await root.locator('.ctxIndicator').count(),10);
   assert.equal(await root.evaluate(el=>el.scrollTop),0);
 }
 await page.evaluate(()=>openContextDialog3244(cellContext3244(capitals[0]),20,60));
 const output=process.env.HEX_TEST_OUTPUT||'/tmp';
 for(const size of [{width:1440,height:1080},{width:390,height:844},{width:320,height:740}]){
   await page.setViewportSize(size);
   await page.waitForTimeout(300);
   await page.evaluate(()=>{openContextDialog3244(cellContext3244(capitals[0]),20,60);positionContextDialog3244(20,60)});
   await page.waitForTimeout(250);
   const geometry=await root.evaluate(el=>({horizontal:el.scrollWidth>el.clientWidth+1,rect:el.getBoundingClientRect().toJSON(),
     scrollers:[...el.querySelectorAll('*')].filter(n=>/auto|scroll/.test(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1).map(n=>n.className),
     columns:getComputedStyle(document.getElementById('ctxActions3244')).gridTemplateColumns.split(' ').length}));
   assert.equal(geometry.horizontal,false,JSON.stringify(geometry));
   assert.equal(geometry.scrollers.length,0,JSON.stringify(geometry));
   assert.equal(geometry.columns,size.width<650?2:3,JSON.stringify({size,geometry}));
   assert(geometry.rect.bottom<=size.height+1,JSON.stringify(geometry));
   await page.screenshot({path:path.join(output,'hex-inspector-'+size.width+'.png')});
   await root.locator('[data-hex-section03858="studies"]').evaluate(el=>el.open=false);
   await page.waitForTimeout(30);
   await root.locator('[data-hex-section03858="studies"] > summary').focus();
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.querySelectorAll('#contextMenu3244 details[open]').length===1);
 assert.equal(await root.locator('details[open]').count(),1);
 }
 await page.setViewportSize({width:1440,height:1080});
 await page.waitForTimeout(300);
 await page.evaluate(()=>{openContextDialog3244(cellContext3244(capitals[0]),20,60);});
 await page.waitForTimeout(180);
 await root.locator('[data-inspect-tab03817="industry"]').click();
 assert.equal(await page.evaluate(()=>HexategosHexInspector03817.current().tab),'industry');
 await page.waitForTimeout(400);

 await page.screenshot({path:path.join(output,'hex-inspector-industry.png')});
 await page.locator('#ctxClose3244').click();assert(!(await root.isVisible()));
 await page.evaluate(()=>openContextDialog3244(cellContext3244(capitals[0]),20,60));assert(await root.isVisible());
 // Map picking calls the 3245 alias, which must also reset the scroll.
 await page.evaluate(cell=>openContextDialog3245(cellContext3244(cell),20,60),cases[0]);
 assert.equal(await root.evaluate(el=>el.scrollTop),0);
 // Font-size option must remain within the mobile viewport.
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await page.evaluate(()=>{HexategosTypography0387.set('145',false);openContextDialog3244(cellContext3244(capitals[0]),20,60)});
 await page.waitForTimeout(250);
 const enlarged=await root.evaluate(el=>({width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right,bottom:el.getBoundingClientRect().bottom,overflow:el.scrollWidth>el.clientWidth+1}));
 assert(!enlarged.overflow&&enlarged.right<=391&&enlarged.bottom<=845,JSON.stringify(enlarged));
 await page.screenshot({path:path.join(output,'hex-inspector-font145.png')});
 await page.evaluate(()=>HexategosTypography0387.set('100',false));
 // Zero force cannot start an order or change diplomacy.
 await page.evaluate(()=>{const s=document.getElementById('ctxStrength3246');s.value='0';s.dispatchEvent(new Event('input',{bubbles:true}));});
 const relationsBefore=await page.evaluate(()=>Array.from(relations3220));
 await root.locator('[data-action="send_troops"]').click();
 assert.equal(await page.evaluate(()=>uiInteractionState3244.interactionMode),'normal');
 assert.deepEqual(await page.evaluate(()=>Array.from(relations3220)),relationsBefore);
 // Submit a real neutral-territory front with the same engine parameters.
 const order=await page.evaluate(()=>{
   const L=loadLevel(MAX_GAME_LEVEL3233);let target=-1;
   for(let i=0;i<L.n&&target<0;i++)if(owner6[i]===0)
     for(let k=L.offsets[i];k<L.offsets[i+1];k++){const n=L.edgeNbr[k];if(n>=0&&L.land[n]>=0&&owner6[n]<0){target=n;break}}
   strength3212.value='43';advance3212.value='20';troops3230[0]=300;
   const front=createFront3230(target);
   return front?{advance:front.advance,pool:front.initial,remaining:troops3230[0]}:null;
 });
 assert(order);assert.equal(order.advance,20);assert.equal(order.pool,129);assert.equal(order.remaining,171);
 assert.deepEqual(errors,[]);
 console.log('PASS: live game, action routing, studies pending/completed, controls, own/enemy/neutral, port, scroll retention, exclusive accordions, keyboard, desktop/390/320 layout, 145% typography, zero-force safety, real front allocation and reopening.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
