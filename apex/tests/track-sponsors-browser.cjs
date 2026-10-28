/* Serve repo on :8765. Uses real Canvas/WebGL backends; software GL is not
 * a physical-device FPS benchmark. Test hooks never enter production. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=path.resolve(__dirname,'../..'),mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
const hook=fs.readFileSync(path.join(__dirname,'browser-hook.js'),'utf8')+`
let sponsorTestEnabled=true;const sponsorTestDraw=apexSponsorDraw;
apexSponsorDraw=function(...args){return sponsorTestEnabled?sponsorTestDraw(...args):false;};
window.__sponsorAudit={
 freeze(s){setAutoDriveMode(0,false);paused=true;rivals.length=0;const q=poseAt(s);player.s=s;player.x=q.x;player.z=q.z;player.heading=Math.atan2(q.tx,q.tz);player.speed=0;},
 stats:()=>({...window.ApexTrackSponsors.stats,anchors:apexSponsorAnchors.size,glError:webglState.gl?.getError()}),
 bench(){const gl=webglState.gl,original=gl.drawArrays;let calls=0;gl.drawArrays=function(...args){calls++;return original.apply(this,args);};const results=[];
  try{for(const enabled of [false,true]){sponsorTestEnabled=enabled;for(let i=0;i<3;i++)activeRenderer.renderFrame();calls=0;const t=performance.now();for(let i=0;i<12;i++)activeRenderer.renderFrame();results.push({enabled,calls,cpuFrameMs:(performance.now()-t)/12,stats:{...window.ApexTrackSponsors.stats}});}}
  finally{sponsorTestEnabled=true;gl.drawArrays=original;}return results;
 },
 async pixels(sources){
  mode='menu';player=null;const results=[];for(const [i,key] of ['team-equipalia','sct','mdtel'].entries()){
   renderFrameId++;window.ApexTrackSponsors.beginFrame(renderFrameId);const api=window.ApexTrackSponsors,aspect=api.data[key].aspect;
   const raw=[{x:-4,y:-1,z:14},{x:-4,y:2,z:14},{x:4,y:2,z:14},{x:4,y:-1,z:14}],h=Math.min(2.4,8*.84/aspect),w=h*aspect;
   const tl=projectLocal(-w/2,.53+h/2,14,0),br=projectLocal(w/2,.53-h/2,14,0);
   const ix=Math.max(0,Math.floor(tl.x)),iy=Math.max(0,Math.floor(tl.y)),iw=Math.min(W,Math.ceil(br.x))-ix,ih=Math.min(H,Math.ceil(br.y))-iy;
   const bg=api.styles[i].bg;ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
   const px=Math.floor(ix*DPR),py=Math.floor(iy*DPR),pw=Math.floor(iw*DPR),ph=Math.floor(ih*DPR);
   const before=ctx.getImageData(px,py,pw,ph);
   apexSponsorDraw(raw,key,0,'canvas2d','pixel-'+key);
   const actual=ctx.getImageData(px,py,pw,ph);
   const doc=new DOMParser().parseFromString(sources[key],'image/svg+xml');
   if(br.y-tl.y<100||mobilePerformanceMode())doc.querySelectorAll('[data-detail="fine"]').forEach(el=>el.remove());
   const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(doc));await img.decode();
   const expected=document.createElement('canvas');expected.width=pw;expected.height=ph;const e=expected.getContext('2d');e.fillStyle=bg;e.fillRect(0,0,expected.width,expected.height);
   e.drawImage(img,tl.x*DPR-px,tl.y*DPR-py,(br.x-tl.x)*DPR,(br.y-tl.y)*DPR);
   const ref=e.getImageData(0,0,expected.width,expected.height);let mismatch=0,painted=0;
   for(let j=0;j<ref.data.length;j+=4){if(Math.max(...[0,1,2].map(k=>Math.abs(ref.data[j+k]-actual.data[j+k])))>45)mismatch++;if(Math.max(...[0,1,2].map(k=>Math.abs(before.data[j+k]-actual.data[j+k])))>30)painted++;}
   results.push({key,mismatch:mismatch/(pw*ph),painted});
  }return results;
 }
};`;
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/tmp/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:720}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/parts/part-027.txt',async route=>{const s=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8'),at=s.lastIndexOf('requestAnimationFrame(loop);');await route.fulfill({body:s.slice(0,at)+hook+s.slice(at),contentType:'text/plain'});});
 await page.goto('http://127.0.0.1:8765/apex/apex.html');await page.waitForFunction(()=>window.__sponsorAudit&&window.ApexTrackSponsors);
 await page.evaluate(()=>__apexAudit.load('14-spain',true));await page.evaluate(()=>__sponsorAudit.freeze(120));
 const scenes=[];for(const camera of ['cockpit','tcam','chase']){await page.evaluate(c=>__apexAudit.camera(c),camera);await page.waitForTimeout(400);const stats=await page.evaluate(()=>__sponsorAudit.stats());assert.equal(stats.glError,0);assert.ok(stats.maxLogos>0);assert.ok(stats.maxLogos<=(mobile?6:12));assert.ok(stats.maxTriangles<=(mobile?2600:5200));scenes.push({camera,...stats});}
 const bench=await page.evaluate(()=>__sponsorAudit.bench());assert.equal(bench[0].calls,bench[1].calls,'Vector logos reuse the same WebGL batch, no extra draw calls');
 await page.screenshot({path:process.env.APEX_SPONSOR_SCREENSHOT||'/tmp/apex-sponsors-'+(mobile?'mobile':'desktop')+'.png'});
 assert.equal(await page.evaluate(()=>__apexAudit.backend('canvas2d')),true);await page.waitForTimeout(500);const canvas=await page.evaluate(()=>__sponsorAudit.stats());assert.ok(canvas.maxLogos>0);
 // Same SVG geometry rendered by production triangle code; includes counters,
 // transparent holes and original logo colours, not merely a DOM component count.
 const sources=Object.fromEntries(['team-equipalia','sct','mdtel'].map(k=>[k,fs.readFileSync(path.join(root,'apex/assets/sponsors',k+'.svg'),'utf8')]));
 const pixels=await page.evaluate(src=>__sponsorAudit.pixels(src),sources);for(const p of pixels){assert.ok(p.painted>50,p.key+' is visibly drawn');assert.ok(p.mismatch<.065,'SVG/mesh pixel mismatch '+JSON.stringify(p));}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({test:'track-sponsors-browser',mobile,scenes,canvas,bench,pixels,ok:true}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
