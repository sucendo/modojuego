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
assert.equal(api.colorKey('#53aa66'),'team-equipalia');assert.equal(api.colorKey('#17633a'),'team-equipalia');
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
ctx.trackData.customWorld._wallRenderSegments=[];assert.equal(ctx.apexSponsorExactAnchor(walls[0]),null);
// Compile all production inline scripts; part files intentionally split tokens.
const html=Array.from({length:28},(_,i)=>fs.readFileSync(path.join(root,'parts',`part-${String(i).padStart(3,'0')}.txt`),'utf8')).join('');
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(match[1]);
console.log(JSON.stringify({test:'track-sponsor-vectors',logos:3,spacingM:api.spacingM,mobileTriangleBudget:2600,desktopTriangleBudget:5200,ok:true}));
