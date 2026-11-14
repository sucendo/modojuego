'use strict';
// Universal desktop WebGL trees + one circular SVG map symbol per family.
// Run: node apex/tests/trees3d-universal.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/trees-3d-test.js'),'utf8');
const core=fs.readFileSync(path.join(root,'parts/part-023.txt'),'utf8');
const production=fs.readFileSync(path.join(root,'parts/part-025.txt'),'utf8');
const preview=fs.readFileSync(path.join(root,'parts/part-025-bridgefull-trees3d-preview.txt'),'utf8');
const mainHtml=fs.readFileSync(path.join(root,'apex.html'),'utf8');
const perfHtml=fs.readFileSync(path.join(root,'perf6a-preview.html'),'utf8');
const testHtml=fs.readFileSync(path.join(root,'trees3d-preview.html'),'utf8');
function load(search=''){
 const win={location:{search}};
 vm.runInNewContext(source,{window:win,URLSearchParams}, {filename:'trees-3d-test.js'});
 return win;
}
const w=load();
assert.equal(w.apexTrees3dTrialEnabled,true,'3D trees should be enabled by default');
const ids=['01-australia','14-spain','19-usa','extra-nurburgring'];
const families=['deciduous','fir','palm'];
const triangles=[];
for(const id of ids)for(const family of families){
 let drawn=0;
 const c={circuitId:id,it:{type:'tree',sourceId:id+'-'+family,treeVariant:family,width:6,height:13},
   lod:1,depth:80,mobile:false,
   P:(x,y,z)=>({x,y,z}),pitch:0,
   poly:()=>{drawn++},quad:()=>{drawn++},
   shade:(v)=>v,
   hash:(v)=>[...v].reduce((h,ch)=>(Math.imul(h,31)+ch.charCodeAt(0))>>>0,7)};
 assert.equal(w.apexTrees3dRender(c),true,id+'/'+family+' did not render');
 assert.ok(drawn>0,id+'/'+family+' produced no 3D geometry');
 triangles.push(drawn);
}
assert.deepEqual(JSON.parse(JSON.stringify(w.apexTrees3dTrialInfo().species)),
 {deciduous:ids.length,fir:ids.length,palm:ids.length});
assert.equal(w.apexTrees3dTrialInfo().scope,'all-circuits');
assert.equal(w.apexTrees3dRender({circuitId:'14-spain',it:{type:'tree'},lod:0,mobile:true,depth:20}),false);
assert.equal(w.apexTrees3dRender({circuitId:'14-spain',it:{type:'tree'},lod:3,mobile:false,depth:20}),false);
const off=load('?trees3d=0');
assert.equal(off.apexTrees3dTrialEnabled,false,'Legacy opt-out must be supported');
assert.equal(typeof off.apexTrees3dRender,'undefined','Disabled renderer must leave legacy route untouched');
for(const s of [production,preview])assert.match(s,/window\.apexTrees3dRender\(\{circuitId:/);
assert.match(mainHtml,/url=perf6a-preview\.html/);
for(const s of [perfHtml,testHtml])assert.match(s,/js\/trees-3d-test\.js\?v=all-circuits-v1/);
assert.match(core,/function apexNormalizeSvgTreeSymbols\(rawSvg\)/);
assert.match(core,/data-apex-symbol="tree-circle-v1"/);
for(const family of families)assert.match(core,new RegExp("tree-"+family));
for(const name of [
 'apex26_01-australia_circuito-propuesta-20261111-v2.svg',
 'apex26_14-spain_circuito-propuesta-20261110.svg']){
 const svg=fs.readFileSync(path.join(root,'circuits/svg',name),'utf8');
 const glyphs=[...svg.matchAll(/<(circle|path|polygon|ellipse)\b[^>]*data-apex-type="tree"[^>]*>/g)];
 assert.ok(glyphs.length>5,name+' has no tree symbols');
 assert.ok(glyphs.every(x=>x[1]==='circle'),name+' still has non-circular tree glyphs');
 assert.ok(glyphs.every(x=>/data-apex-symbol="tree-circle-v1"/.test(x[0])),name+' lacks canonical markers');
 assert.ok(glyphs.every(x=>/data-apex-variant="(deciduous|fir|palm)"/.test(x[0])),name+' lost species');
 assert.match(svg,/data-apex-library="1"/);
}
console.log(JSON.stringify({test:'trees3d-universal',circuits:ids.length,
 species:families,drawCallsMin:Math.min(...triangles),drawCallsMax:Math.max(...triangles),
 rendererHooks:2,htmlEntrypoints:3,editorPalette:true,mobileFallback:true,optOut:true,ok:true}));
