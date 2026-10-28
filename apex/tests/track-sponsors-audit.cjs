'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.createContext(context);
for(const file of ['track-sponsor-vectors.js','track-sponsors.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
const api=context.window.ApexTrackSponsors;
assert.equal(Object.keys(api.data).length,4);
for(const [key,logo] of Object.entries(api.data)){
 const svg=fs.readFileSync(path.join(root,'assets/sponsors',key+'.svg'),'utf8');
 assert.ok(svg.includes('<path '));assert.ok(!/<(?:image|text|rect|filter)\b/.test(svg),'Contours only, transparent exterior: '+key);
 assert.ok(!/data:image|https?:\/\/(?!www.w3.org)/.test(svg));
 assert.ok(logo.aspect>0);
 for(const layer of logo.layers){assert.equal(layer.triangles.length%6,0);assert.ok(Array.from(layer.triangles).every(Number.isFinite));}
}
assert.equal(api.colorKey('#53aa66'),'team-equipalia');assert.equal(api.colorKey('#00673e'),'team-equipalia');
assert.equal(api.spacingM,24);assert.equal(api.equipaliaSpacingM,8);assert.equal(api.sctSpacingM,24);
assert.equal(api.wallPatternMetres('team-equipalia'),8);
assert.equal(api.wallPatternMetres('sct-wall'),24);
assert.equal(api.stats.compiled,4);
const sctWallSvg=fs.readFileSync(path.join(root,'assets/sponsors/sct-wall.svg'),'utf8');
const sct24=fs.readFileSync(path.join(root,'assets/sponsors/sct-wall-24m.svg'),'utf8');
assert.ok(sctWallSvg.includes('SCT Telecom'));
assert.ok(!/<image\\b|<text\\b|<foreignObject\\b/i.test(sctWallSvg),'SCT wall has vector contours only');
assert.ok(!/<image\\b|<text\\b|<foreignObject\\b/i.test(sct24),'SCT 24m source has no raster content');
assert.equal(sctWallSvg,sct24,'The game uses the exact full 24m SVG master');
assert.ok(!/<use\b|<symbol\b/.test(sct24),'No 8m symbols or repeated tiles');
assert.equal(api.data['sct-wall'].aspect,18);
assert.equal((sct24.match(/data-design-part="large-sct"/g)||[]).length,2);
assert.equal((sct24.match(/data-design-part="medium-sct"/g)||[]).length,2);
assert.equal((sct24.match(/data-design-part="small-sct"/g)||[]).length,2);
assert.ok((sct24.match(/data-design-part="diagonal-/g)||[]).length>=10);
assert.equal((sct24.match(/data-design-part="continuous-background"/g)||[]).length,1);
// The original SCT shadow and white face were coplanar. The new layer offsets
// must guarantee a crisp face above the shadow and decorative blue geometry,
// including near-oblique cameras; Equipalia/MDTel keep their existing bias.
const depth=api.wallLayerDepthBias;
assert.equal(depth('team-equipalia','#ffffff',0),.026);
assert.equal(depth('mdtel','#ffffff',0),.026);
assert.ok(depth('sct','#ffffff',0)>depth('sct','#063365',0));
assert.ok(depth('sct','#063365',0)>depth('sct','#36b7ef',13));
assert.ok(depth('sct','#ffffff',0)-depth('sct','#063365',0)>.04);
const sctLogoMesh=api.data['sct-wall'];
function meshBounds(layer){
 const pts=layer.triangles,x=[],y=[];
 for(let i=0;i<pts.length;i+=2){x.push(pts[i]*1440);y.push(pts[i+1]*80);}
 return {left:Math.min(...x),right:Math.max(...x),top:Math.min(...y),bottom:Math.max(...y)};
}
const sctWhiteFaces=sctLogoMesh.layers.filter(l=>l.fill==='#ffffff');
assert.equal(sctWhiteFaces.length,6,'SCT and TELECOM white paths at three scales');
const sctGlyph=meshBounds(sctWhiteFaces[0]);
const sctMedium=meshBounds(sctWhiteFaces[2]);
const sctSmall=meshBounds(sctWhiteFaces[4]);
assert.ok(sctGlyph.right-sctGlyph.left>sctMedium.right-sctMedium.left);
assert.ok(sctMedium.right-sctMedium.left>sctSmall.right-sctSmall.left);
assert.ok(sctGlyph.bottom-sctGlyph.top>sctMedium.bottom-sctMedium.top);
assert.ok(sctMedium.bottom-sctMedium.top>sctSmall.bottom-sctSmall.top);
assert.ok(sctGlyph.right<520&&sctMedium.left>700&&sctSmall.left>1150,'Three distinct placements');
assert.ok(sctGlyph.right-sctGlyph.left>140,'SCT principal must span at least 140 SVG units');
assert.ok(sctGlyph.bottom-sctGlyph.top>60,'SCT principal almost fills the wall height');
assert.ok(sctGlyph.top<10&&sctGlyph.bottom>70,'SCT brand must be clearly legible');
assert.ok(sctLogoMesh.layers.every(l=>l.triangles.length%6===0));

for(const color of ['#ffffff','#25a9d5','#00a2d6','#116faf','#eafaff'])
 assert.ok(sctWallSvg.includes(color),'SCT vector identity and racing stripes: '+color);
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
const sctA=api.wallTileLayers(wallA,0,7.3,false,'sct-wall'),
      sctB=api.wallTileLayers(wallB,7.3,14.6,false,'sct-wall');
assert.ok(sctA.accents.length>0&&sctA.wordmark.length>0,'Blue SCT pattern includes logo and racing decor');
checkWallTile(sctA);checkWallTile(sctB);
assert.ok(sctA.accents.some(l=>l.triangles.some((v,i)=>i%2&&Math.abs(v)<1e-4)), 'SCT diagonals reach wall top');
assert.ok(sctA.accents.some(l=>l.triangles.some((v,i)=>i%2&&Math.abs(v-1)<1e-4)), 'SCT diagonals reach wall bottom');
assert.deepEqual([...seamVertices(sctA,1)].sort((a,b)=>a-b),
 [...seamVertices(sctB,0)].sort((a,b)=>a-b),'SCT 24m mural continues across adjacent wall pieces');
const sctRevA=api.wallTileLayers(wallA,0,7.3,true,'sct-wall'),
      sctRevB=api.wallTileLayers(wallB,7.3,14.6,true,'sct-wall');
checkWallTile(sctRevA);checkWallTile(sctRevB);
assert.deepEqual([...seamVertices(sctRevA,0)].sort((a,b)=>a-b),
 [...seamVertices(sctRevB,1)].sort((a,b)=>a-b),'SCT seam continuous from opposite camera direction');
assert.equal(api.wallTileLayers(wallA,0,7.3,false,'sct-wall'),sctA,'SCT clipped triangles cached');
const sctMuralA=api.wallTileLayers({},0,24,false,'sct-wall');
const sctMuralB=api.wallTileLayers({},24,48,false,'sct-wall');
assert.equal(sctMuralA.triangleCount,sctMuralB.triangleCount,'SCT repeats only at 24 metres');
const sctAt8=api.wallTileLayers({},8,16,false,'sct-wall');
const sctAt16=api.wallTileLayers({},16,24,false,'sct-wall');
assert.ok(sctAt8.wordmark.length>0&&sctAt16.wordmark.length>0,'Medium and small SCT labels exist in their own portions');
for(const at of [8,16,24]){
 const left=api.wallTileLayers({},at-.37,at,false,'sct-wall');
 const right=api.wallTileLayers({},at,at+.37,false,'sct-wall');
 assert.deepEqual([...seamVertices(left,1)].sort((a,b)=>a-b),
 [...seamVertices(right,0)].sort((a,b)=>a-b),'No visible stripe jump at '+at+' m');
}
const source=fs.readFileSync(path.join(root,'parts/part-024.txt'),'utf8'); // Check both wall types.
assert.ok(source.includes("item.sponsorTileSource")&&source.includes("function apexSponsorContinuousWall"),'Both procedural and SVG walls use SCT full-width mapping');

assert.notEqual(sctA,tileA,'Brand-specific cache keeps Equipalia and SCT separate');

const equipaliaSource=fs.readFileSync(path.join(root,'assets/sponsors/team-equipalia.svg'),'utf8');
const wall24=fs.readFileSync(path.join(root,'assets/sponsors/team-equipalia-wall-24m.svg'),'utf8');
assert.equal(api.data['team-equipalia'].aspect,6,'El módulo de 8 m tiene proporción panorámica');
for(const color of ['#ffffff','#64d25d','#ed3145','#2898e7','#f7faf9'])
 assert.ok(equipaliaSource.includes(color),'Contornos blancos e icono tricolor original: '+color);
assert.ok(equipaliaSource.includes('translate(18 0)'),'Identidad vectorial reutilizada');
assert.equal((wall24.match(/<use href="#equipalia-8m"/g)||[]).length,3,'Tres módulos en la valla de 24 m');
assert.ok(!/<image\b|<text\b|<foreignObject\b/i.test(wall24),'Vista frontal 24 m 100 % vectorial');assert.equal(api.colorKey('#17633a'),'team-equipalia');
assert.equal(api.colorKey('#175da5'),'sct');assert.equal(api.colorKey('#07539b'),'sct');assert.equal(api.colorKey('#fff'),'mdtel');
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
console.log(JSON.stringify({test:'track-sponsor-vectors',logos:4,spacingM:api.spacingM,mobileTriangleBudget:2600,desktopTriangleBudget:5200,ok:true}));
