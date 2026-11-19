import test from 'node:test';
import assert from 'node:assert/strict';
import {stepPressureV1146,pressureKey} from '../scripts/pressureHydrologyV1146.js';

const key=pressureKey;
function basin(){
  const cells=new Map([
    [key(-2,0),{bed:4.5,baseTop:5.5}],
    [key(-1,0),{bed:4.5,baseTop:5.5}],
    [key(0,0),{bed:5.5,baseTop:5.5,dammed:true}],
    [key(-1,1),{bed:5.95,baseTop:5.95}],
    [key(0,1),{bed:5.95,baseTop:5.95}],
    [key(1,1),{bed:5.95,baseTop:5.95}],
    [key(1,0),{bed:4.5,baseTop:4.5}],
  ]);
  return {cells,sample:(x,z)=>cells.get(key(x,z))||null,
    inlet:{damX:0,damZ:0,upstream:[{x:-1,z:0}],rate:.85,headLimit:6.5}};
}

test('11.4.6: el agua se embalsa progresivamente ante una presa',()=>{
  const b=basin();let volumes=new Map();
  let totalAdded=0;
  for(let i=0;i<40;i++){
    const before=[...volumes.values()].reduce((a,v)=>a+v,0);
    const step=stepPressureV1146(volumes,[b.inlet],b.sample,.25);
    volumes=step.volumes;totalAdded+=step.added;
    const after=[...volumes.values()].reduce((a,v)=>a+v,0);
    assert.ok(Math.abs(after-before-step.added)<.015,'los trasvases conservan volumen');
    if(i===0)assert.equal(volumes.get(key(0,0))||0,0,'el agua no atraviesa inmediatamente el sólido');
  }
  assert.ok((volumes.get(key(-1,0))||0)>.05,'aumenta la altura aguas arriba');
  assert.ok((volumes.get(key(-1,1))||0)>.01,'la superficie supera la antigua orilla');
  assert.ok(totalAdded>0,'solo el manantial aporta agua nueva');
  assert.ok((volumes.get(key(0,0))||0)<1.5,'el desbordamiento queda limitado por la cresta');
});

test('11.4.6: abrir un hueco lateral hace salir el agua acumulada',()=>{
  const b=basin();let volumes=new Map();
  for(let i=0;i<35;i++)volumes=stepPressureV1146(volumes,[b.inlet],b.sample,.25).volumes;
  const oldOutlet=volumes.get(key(-1,1))||0;
  b.cells.set(key(-1,1),{bed:4.5,baseTop:4.5});
  for(let i=0;i<20;i++)volumes=stepPressureV1146(volumes,[b.inlet],b.sample,.25).volumes;
  assert.ok((volumes.get(key(-1,1))||0)>oldOutlet+.15,'el caudal ocupa el hueco excavado');
  assert.ok((volumes.get(key(0,1))||0)>0,'sale hacia el canal abierto');
});

test('11.4.6: sin presa no se crea ni una gota',()=>{
  const b=basin();b.cells.set(key(0,0),{bed:4.5,baseTop:5.5,dammed:false});
  let volumes=new Map();
  for(let i=0;i<80;i++)volumes=stepPressureV1146(volumes,[b.inlet],b.sample,.25).volumes;
  assert.equal(volumes.size,0);
});

test('11.4.6: un desagüe retira volumen contabilizado sin duplicarlo',()=>{
  const b=basin();
  const volumes=new Map([[key(-1,0),.75],[key(0,1),.25]]);
  const prev=[...volumes.values()].reduce((a,v)=>a+v,0);
  const step=stepPressureV1146(volumes,[],b.sample,.25,[{x:0,z:1,rate:.5}]);
  const next=[...step.volumes.values()].reduce((a,v)=>a+v,0);
  assert.ok(step.removed>0);
  assert.ok(Math.abs(next-(prev-step.removed))<.015);
});
