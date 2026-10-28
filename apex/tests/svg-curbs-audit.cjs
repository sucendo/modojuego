'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('apex/js/svg-curbs.js','utf8'),ctx);const api=ctx.window.ApexSvgCurbs;
const mark={sourceId:'test',width:1.25,curbStripeM:2,curbRuns:[[[0,0],[0,10]],[[5,30],[5,35]]]};
const mesh=api.compile([mark],()=>3);assert.equal(mesh.segments.length,2);assert.ok(mesh.quads.length>5);
for(const q of mesh.quads){assert.ok(q.points.every(p=>p.every(Number.isFinite)));assert.ok(q.points.every(p=>p[1]===3.018));}
assert.equal(api.contains(mesh,.5,5),true);assert.equal(api.contains(mesh,1,5),false);assert.equal(api.contains(mesh,2,20),false,'Separate M subpaths do not become a phantom kerb');
assert.ok(mesh.quads.some(q=>q.color==='#d92b36')&&mesh.quads.some(q=>q.color==='#f4f5f6'));
const moved=api.compile([{...mark,curbRuns:[[[20,0],[20,10]]]}],()=>0);assert.equal(api.contains(moved,.5,5),false);assert.equal(api.contains(moved,20.5,5),true);
assert.equal(api.compile([],()=>0).quads.length,0,'Removing all authored kerbs keeps the SVG empty');
const html=Array.from({length:28},(_,i)=>fs.readFileSync(`apex/parts/part-${String(i).padStart(3,'0')}.txt`,'utf8')).join('');for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
console.log(JSON.stringify({test:'svg-kerb-geometry',quads:mesh.quads.length,subpaths:true,paintAndContact:true,ok:true}));
