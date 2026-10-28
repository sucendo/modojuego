'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.createContext(context);
for(const file of ['track-sponsor-vectors.js','track-sponsors.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
const api=context.window.ApexTrackSponsors;
assert.equal(Object.keys(api.data).length,3);
for(const [key,logo] of Object.entries(api.data)){
 const svg=fs.readFileSync(path.join(root,'assets/sponsors',key+'.svg'),'utf8');
 assert.ok(svg.includes('<path '));assert.ok(!/<(?:image|text|rect|filter)\b/.test(svg),'Contours only, transparent exterior: '+key);
 assert.ok(!/data:image|https?:\/\/(?!www.w3.org)/.test(svg));
 assert.ok(logo.aspect>0);
 for(const layer of logo.layers){assert.equal(layer.triangles.length%6,0);assert.ok(Array.from(layer.triangles).every(Number.isFinite));}
}
assert.equal(api.colorKey('#53aa66'),'team-equipalia');assert.equal(api.colorKey('#00673e'),'team-equipalia');
assert.equal(api.spacingM,24);assert.equal(api.equipaliaSpacingM,8);
assert.equal(api.sctSpacingM,8,'SCT blue walls use seamless 8m tiles');
assert.equal(api.data.sct.aspect,6,'SCT artwork is panoramic, not a square sticker');
const sctSvg=fs.readFileSync(path.join(root,'assets/sponsors/sct.svg'),'utf8');
const sctWall24=fs.readFileSync(path.join(root,'assets/sponsors/sct-wall-24m.svg'),'utf8');
for(const color of ['#ffffff','#25a9d5','#00a2d6','#116faf','#10a2e8','#d9f2ff'])
 assert.ok(sctSvg.includes(color),'Original SCT blue diamonds and white lettering plus racing stripes: '+color);
assert.equal((sctWall24.match(/<use href="#sct-blue-8m"/g)||[]).length,3,'24m SCT reference has three full-width 8m modules');
assert.ok(!/<image\b|<text\b|<foreignObject\b/i.test(sctSvg+sctWall24),'SCT mural is 100% vectorial');

// Full-height vector wallpaper: the tile is clipped to each real wall piece,
// and the same continuous geometry must meet at panel edges on both faces.
function checkWallTile(layers){
 for(const layer of [...layers.accents,...layers.wordmark,...layers.fine]){
  assert.equal(layer.triangles.length%6,0);
  for(let k=0;k<layer.triangles.length;k+=2){
   assert.ok(layer.triangles[k]>=-1e-5&&layer.triangles[k]<=1+1e-5,'Wall U clipped to panel');
   assert.ok(layer.triangles[k+1]>=-1e-5&&layer.triangles[k+1]<=1+1e-5,'Wall V inside full-height face');
  }
 }
}
function seamVertices(tile,at){
 const y=[];
 for(const layer of [...tile.accents,...tile.wordmark]){
  for(let i=0;i<layer.triangles.length;i+=2)
   if(Math.abs(layer.triangles[i]-at)<.0001)y.push(Math.round(layer.triangles[i+1]*10000));
 }
 return new Set(y);
}
const wallA={},wallB={},tileA=api.wallTileLayers(wallA,0,7.3,false),
 tileB=api.wallTileLayers(wallB,7.3,14.6,false);
assert.ok(tileA.accents.length>0&&tileB.accents.length>0,'Decorative stripes cross physical panels');
checkWallTile(tileA);checkWallTile(tileB);
assert.ok(tileA.accents.some(l=>l.triangles.some((v,i)=>i%2&&Math.abs(v)<1e-4)),'Stripes touch wall top');
assert.ok(tileA.accents.some(l=>l.triangles.some((v,i)=>i%2&&Math.abs(v-1)<1e-4)),'Stripes touch wall bottom');
const seamA=seamVertices(tileA,1),seamB=seamVertices(tileB,0);
assert.ok(seamA.size>0,'Left segment reaches seam');
assert.deepEqual([...seamA].sort((a,b)=>a-b),[...seamB].sort((a,b)=>a-b),
 'No gaps or jumps where two adjacent wall segments meet');
const revA=api.wallTileLayers(wallA,0,7.3,true),
 revB=api.wallTileLayers(wallB,7.3,14.6,true);
checkWallTile(revA);checkWallTile(revB);
assert.deepEqual([...seamVertices(revA,0)].sort((a,b)=>a-b),
 [...seamVertices(revB,1)].sort((a,b)=>a-b),
 'Opposite camera direction preserves pattern continuity');
assert.equal(api.wallTileLayers(wallA,0,7.3,false),tileA,'No frame-time re-triangulation');
// SCT shares the same seam-safe clipping implementation but must keep its
// OWN cached brand entry even when a physical wall swaps brand at sector edges.
const sctA=api.wallTileLayers(wallA,0,7.3,false,'sct');
const sctB=api.wallTileLayers(wallB,7.3,14.6,false,'sct');
checkWallTile(sctA);checkWallTile(sctB);
assert.ok(sctA.accents.length>=5 && sctA.wordmark.length>=1,'SCT diamond/diagonals and original white letters are separated');
assert.ok(sctA.accents.some(l=>l.triangles.some((v,i)=>i%2&&Math.abs(v)<1e-4)),'SCT stripes reach top');
assert.ok(sctA.accents.some(l=>l.triangles.some((v,i)=>i%2&&Math.abs(v-1)<1e-4)),'SCT stripes reach bottom');
assert.deepEqual([...seamVertices(sctA,1)].sort((a,b)=>a-b),
 [...seamVertices(sctB,0)].sort((a,b)=>a-b),'SCT diagonal seams match exactly');
const sctReverseA=api.wallTileLayers(wallA,0,7.3,true,'sct'),
 sctReverseB=api.wallTileLayers(wallB,7.3,14.6,true,'sct');
checkWallTile(sctReverseA);checkWallTile(sctReverseB);
assert.deepEqual([...seamVertices(sctReverseA,0)].sort((a,b)=>a-b),
 [...seamVertices(sctReverseB,1)].sort((a,b)=>a-b),'SCT reversed wall has no phase jump');
assert.equal(api.wallTileLayers(wallA,0,7.3,false,'sct'),sctA,'SCT triangle clipping is cached');
assert.notEqual(api.wallTileLayers(wallA,0,7.3,false,'sct'),tileA,'Shared wall source does not mix sponsors');
api.beginFrame(71);
const accentN=sctA.accents.reduce((n,l)=>n+l.triangles.length/6,0);
assert.equal(api.claimWallAccents(accentN,true),true,'SCT accents render within mobile budget');
assert.ok(api.stats.accentTriangles>0&&api.stats.triangles<=2600,'Mobile triangle budget respected');


const equipaliaSource=fs.readFileSync(path.join(root,'assets/sponsors/team-equipalia.svg'),'utf8');
const wall24=fs.readFileSync(path.join(root,'assets/sponsors/team-equipalia-wall-24m.svg'),'utf8');
assert.equal(api.data['team-equipalia'].aspect,6,'El módulo de 8 m tiene proporción panorámica');
for(const color of ['#ffffff','#64d25d','#ed3145','#2898e7','#f7faf9'])
 assert.ok(equipaliaSource.includes(color),'Contornos blancos e icono tricolor original: '+color);
assert.ok(equipaliaSource.includes('translate(18 0)'),'Identidad vectorial reutilizada');
assert.equal((wall24.match(/<use href="#equipalia-8m"/g)||[]).length,3,'Tres módulos en la valla de 24 m');
assert.ok(!/<image\b|<text\b|<foreignObject\b/i.test(wall24),'Vista frontal 24 m 100 % vectorial');assert.equal(api.colorKey('#17633a'),'team-equipalia');
assert.equal(api.colorKey('#175da5'),'sct');assert.equal(api.colorKey('#fff'),'mdtel');
for(const c of ['#ff0000','#f3cf2f','#111111','invalid'])assert.equal(api.colorKey(c),null);
for(const mobile of [false,true]){
 api.beginFrame(mobile?2:1);
 for(let i=0;i<30;i++)api.claim('test'+i,'mdtel',110,mobile);
 assert.ok(api.stats.logos<=(mobile?6:12));assert.ok(api.stats.triangles<=(mobile?2600:5200));
 const count=api.stats.logos;assert.equal(api.claim('test0','mdtel',110,mobile),null);assert.equal(api.stats.logos,count);
}
api.beginFrame(3);assert.equal(api.claim('tiny','sct',4,false),null);assert.equal(api.stats.triangles,0);
const full=api.claim('close','team-equipalia',110,false);api.beginFrame(4);const far=api.claim('far','team-equipalia',12,false);
assert.ok(full.length>far.length,'Fine slogan only when legible');
api.beginFrame(5);assert.equal(api.stats.triangles,0);assert.equal(api.stats.logos,0);
const part=fs.readFileSync(path.join(root,'parts/part-024.txt'),'utf8');
const start=part.indexOf('const APEX_AD_BRANDS=['),end=part.indexOf('function drawGeneratedWallAd',start);
const config={};const ctx={window:context.window,trackData:{km:5,spec:{r:0}},readStoredCircuitJson:()=>config,mod:(x,n)=>(x%n+n)%n,wrapRangeContains:(s,a,b)=>s>=a&&s<=b};vm.createContext(ctx);vm.runInContext(part.slice(start,end),ctx);
assert.equal(ctx.circuitAdvertisingStyle(12,{},1).logo,'team-equipalia');assert.equal(ctx.circuitAdvertisingStyle(84,{},1).logo,'sct');assert.equal(ctx.circuitAdvertisingStyle(156,{},1).logo,'mdtel');
config.walls={advertising:{enabled:false}};assert.equal(ctx.circuitAdvertisingStyle(12,{},1),null);
config.walls.advertising={panels:[{fromM:0,toM:20,blank:true}]};assert.equal(ctx.circuitAdvertisingStyle(12,{},1),null);
config.walls.advertising={panels:[{fromM:0,toM:20,bg:'#ff0000',brand:'CUSTOM'}]};assert.equal(ctx.circuitAdvertisingStyle(12,{},1).brand,'CUSTOM');
// Stations are cached against the real visual wall segments. One segment per
// side/station, never invent geometry in missing runs or disabled advertising.
const helper=part.slice(part.indexOf('let apexSponsorAnchorSource='),start);
ctx.wrapDeltaS=(a,b,L)=>((b-a+L/2)%L+L)%L-L/2;
const walls=[{s:11,side:1,x1:0,z1:0,x2:0,z2:5},{s:13,side:1,x1:0,z1:5,x2:0,z2:10},
 {s:36,side:-1,x1:10,z1:20,x2:10,z2:25},{s:60,side:1,x1:0,z1:30,x2:0,z2:35,advertising:false}];
ctx.trackData.customWorld={_wallRenderSegments:walls};vm.runInContext(helper,ctx);
assert.equal(walls.filter(w=>ctx.apexSponsorExactAnchor(w)===12).length,1);
assert.equal(ctx.apexSponsorExactAnchor(walls[2]),36);assert.equal(ctx.apexSponsorExactAnchor(walls[3]),null);
const greenWalls=[4,12,20,28].map(s=>({s,side:1,x1:s,z1:0,x2:s+4,z2:0}));
ctx.trackData.customWorld._wallRenderSegments=greenWalls;
assert.deepEqual(Array.from(greenWalls,w=>ctx.apexSponsorExactAnchor(w,'team-equipalia')),[4,12,20,28],
 'Los tres logos / 24 m se anclan a geometría existente cada 8 m');
assert.ok(greenWalls.filter(w=>ctx.apexSponsorExactAnchor(w)).length<greenWalls.length,
 'Otros anunciantes conservan la separación de 24 m');
ctx.trackData.customWorld._wallRenderSegments=[];assert.equal(ctx.apexSponsorExactAnchor(walls[0]),null);
// Compile all production inline scripts; part files intentionally split tokens.
const html=Array.from({length:28},(_,i)=>fs.readFileSync(path.join(root,'parts',`part-${String(i).padStart(3,'0')}.txt`),'utf8')).join('');
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(match[1]);
console.log(JSON.stringify({test:'track-sponsor-vectors',logos:3,spacingM:api.spacingM,mobileTriangleBudget:2600,desktopTriangleBudget:5200,ok:true}));
