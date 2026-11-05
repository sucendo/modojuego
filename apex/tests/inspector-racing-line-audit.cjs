'use strict';
// APEX inspector racing line: static source parity and production geometry unit
// tests. Run: node apex/tests/inspector-racing-line-audit.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const saved=read('circuits/svg/apex26_14-madrid-spain_2026-11-03.svg');
const base=read('circuits/svg/apex26_14-madrid-spain.svg');
const ui=read('parts/part-000.txt'),svgImport=read('parts/part-023.txt');
const canvas=read('parts/part-025.txt'),webgl=read('parts/part-026.txt');
const getPath=raw=>{
 const tag=raw.match(/<path\b[^>]*\bid="apex_ideal_racing_path"[^>]*>/)?.[0];
 assert.ok(tag,'Missing authored racing line');
 assert.match(tag,/stroke="#ffd400"/,'Racing line must be yellow');
 assert.match(tag,/stroke-dasharray="9 7"/,'Racing line must be dashed');
 return tag.match(/\bd="([^"]+)"/)?.[1];
};
assert.equal(getPath(base),getPath(saved),'BASE and saved must use the same trajectory');
for(const svg of [base,saved]){
 assert.equal((svg.match(/id="apex_ideal_racing_path"/g)||[]).length,1);
 assert.ok(!svg.includes('id="apex_ideal_racing_halo"'),'No second line/halo');
}
assert.match(ui,/id="insLayerRacing"/);
assert.match(ui,/id="inspectorQuickRacing"/);
assert.match(svgImport,/ctx\.root\.querySelectorAll\('\[data-apex-role="racing-line"\]'\)/);
assert.match(svgImport,/function apexEnsureAuthoredRacingLine\(/);
assert.match(svgImport,/function apexDrawInspectionRacingLineCanvas\(/);
assert.match(svgImport,/function apexDrawInspectionRacingLineWebgl\(/);
assert.match(canvas,/apexDrawInspectionRacingLineCanvas\(cam,pitch\)/);
assert.match(webgl,/apexDrawInspectionRacingLineWebgl\(cam,cam\.pitch\)/);

const from=svgImport.indexOf('function apexInspectionRacingDashQuads()');
const to=svgImport.indexOf('function apexDrawInspectionRacingLineCanvas(',from);
assert.ok(from>0&&to>from);
const inspection={active:true,height:60,layers:{racing:true}},trackData={km:.160};
const ctx={Math,Number,trackData,apexInspection:inspection,
 apexAuthoredRacingProfile:()=>({valid:true}),
 apexAuthoredRacingOffset:()=>.6,
 renderRibbonFrameAt:s=>({x:s,z:0,y:0,ox:0,oz:1,bank:0}),
 ribbonWorldPoint:(q,w,side,y)=>({x:q.x,z:q.z+w*side,y:q.y+y}),
 autoSafeLaneLimit:()=>3,
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};
vm.createContext(ctx);
vm.runInContext(svgImport.slice(from,to),ctx);
const first=ctx.apexInspectionRacingDashQuads();
assert.equal(first.length,10,'160 metres should contain ten dashed marks');
assert.ok(first.every(quad=>quad.length===4&&quad.every(v=>v.y===.065)));
assert.equal(ctx.apexInspectionRacingDashQuads(),first,'Geometry must be cached');
inspection.layers.racing=false;
assert.equal(ctx.apexInspectionRacingDashQuads().length,0,'OFF must hide the entire overlay');
inspection.layers.racing=true;inspection.height=400;
const wider=ctx.apexInspectionRacingDashQuads();
assert.notEqual(wider,first,'Zoom change should update drawing width');
assert.notEqual(wider[0][0].z,first[0][0].z);
console.log(JSON.stringify({test:'inspector-racing-line',svgParity:true,yellowDashed:true,dashes:first.length,cached:true,toggle:true,zoom:true,passed:true}));
