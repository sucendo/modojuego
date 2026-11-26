import test from 'node:test';
import assert from 'node:assert/strict';
import {continuousCorner,connectedWater,WaterTransitions,transitionValue} from '../scripts/continuousWater.js';
const wet=(top,bottom=0,extra={})=>({top,bottom,kind:'river',...extra});
const grid=entries=>{const m=new Map(entries.map(([x,z,c])=>[`${x},${z}`,c]));return (x,z)=>m.get(`${x},${z}`)||null;};

test('different levels join at identical heights and normals on both sides of a chunk edge',()=>{
  const sample=grid([[31,0,wet(2)],[32,0,wet(2.4)],[31,1,wet(2.1)],[32,1,wet(2.3)]]);
  const corners=[continuousCorner(31,0,1,1,sample),continuousCorner(32,0,-1,1,sample),
    continuousCorner(31,1,1,-1,sample),continuousCorner(32,1,-1,-1,sample)];
  for(const c of corners)assert.deepEqual(c,corners[0]);
  assert.ok(Math.abs(corners[0].top-2.2)<1e-12);
  assert.ok(corners[0].normal.every(Number.isFinite));
});
test('a flat reservoir has one uniform sheet, including negative coordinates',()=>{
  const sample=grid([[-1,-1,wet(3)],[-2,-1,wet(3)],[-1,-2,wet(3)],[-2,-2,wet(3)]]);
  const a=continuousCorner(-1,-1,-1,-1,sample),b=continuousCorner(-2,-2,1,1,sample);
  assert.deepEqual(a,b);assert.equal(a.top,3);assert.equal(a.normal[1],1);
});
test('diagonal puddles, frozen water, filled roofs and vertical waterfalls never become ramps',()=>{
  const sample=grid([[0,0,wet(1)],[1,1,wet(.4)]]);
  assert.notEqual(continuousCorner(0,0,1,1,sample).key,continuousCorner(1,1,-1,-1,sample).key);
  assert.equal(connectedWater(wet(4,3),wet(3,2)),false);
  assert.equal(connectedWater(wet(2,0),wet(1.9,0,{kind:'frozen'})),false);
  assert.equal(connectedWater(wet(2,0),wet(1.9,0,{open:false})),false);
});
test('retargeting a filling reservoir starts at the currently displayed level, with no jump',()=>{
  const t=new WaterTransitions();t.begin('left');
  const original=t.target('shared',1,0,1);t.end();
  t.begin('left');const rise=t.target('shared',2,1,1);t.end();
  const before=transitionValue(rise,1.12);
  assert.ok(before>1&&before<2);
  t.begin('right');const next=t.target('shared',3,1.12,0);t.end();
  assert.equal(transitionValue(next,1.12),before);
  assert.equal(transitionValue(next,2),3);
  const start=next.start;
  t.begin('left');t.target('shared',3,1.2);t.end();
  assert.equal(next.start,start,'neighbor rebuilds do not restart the interpolation');
  t.release('left');assert.equal(t.records.size,1);t.release('right');assert.equal(t.records.size,0);
});
test('new and drying water fades continuously and ownership stays bounded',()=>{
  const t=new WaterTransitions();t.begin('chunk');const r=t.target('opacity',1,0,0);t.end();
  assert.equal(transitionValue(r,0),0);assert.equal(transitionValue(r,1),1);
  t.begin('chunk');const dry=t.target('opacity',0,1);t.end();
  assert.ok(transitionValue(dry,1.16)>0&&transitionValue(dry,1.16)<1);
  assert.equal(transitionValue(dry,2),0);
  t.begin('chunk');t.end();assert.equal(t.records.size,0);
});

test('a per-sheet corner cache shares work only within a connected component',()=>{
 const cache=new Map();let calls=0;
 const sample=(x,z)=>{calls++;return {bottom:.5,top:2,kind:'lake',open:true};};
 const a=continuousCorner(0,0,1,1,sample,cache);
 for(const [x,z,sx,sz] of [[1,0,-1,1],[0,1,1,-1],[1,1,-1,-1]])assert.equal(continuousCorner(x,z,sx,sz,sample,cache),a);
 assert.equal(calls,4,'four adjoining cells calculate their common vertex once');
 const split=new Map(),diagonal=(x,z)=>(x===z?{bottom:.5,top:2,kind:'lake',open:true}:null);
 assert.notEqual(continuousCorner(0,0,1,1,diagonal,split).key,continuousCorner(1,1,-1,-1,diagonal,split).key);
});
