import test from 'node:test';
import assert from 'node:assert/strict';
import { hydraulicBedAfterEdit, hydraulicCeiling } from '../scripts/hydraulicColumnV1147.js';
import { stepPressureV1147, PRESSURE_LIMIT } from '../scripts/pressureHydrologyV1147.js';
import { HydrologyEngine } from '../scripts/hydrologyEngine.js';

function column(bed = 4.5) {
  const solids = new Set([0, 1, 2, 3, 4]);
  const solidAt = y => solids.has(y);
  return {
    solids, solidAt,
    edit(y, solid) {
      const before = solidAt(y);
      if (solid) solids.add(y); else solids.delete(y);
      bed = hydraulicBedAfterEdit(bed, y, before, solid, solidAt, 64);
      return bed;
    },
    bed: () => bed
  };
}

test('11.4.7: un puente flotante deja intacto el cauce y admite agua por debajo', () => {
  const c = column();
  assert.equal(c.edit(7,true),4.5);
  assert.equal(c.edit(6,true),4.5);
  assert.equal(hydraulicCeiling(c.bed(),c.solidAt,64),5.5);
  assert.equal(c.edit(7,false),4.5);
  assert.equal(hydraulicCeiling(c.bed(),c.solidAt,64),5.5);
  assert.equal(c.edit(6,false),4.5);
  assert.equal(hydraulicCeiling(c.bed(),c.solidAt,64),Infinity);
});

test('11.4.7: muro apoyado forma presa y al romper la base deja un túnel', () => {
  const c = column();
  assert.equal(c.edit(6,true),4.5,'se puede construir el techo antes del muro');
  assert.equal(c.edit(5,true),6.5,'al cerrar el hueco el muro se une al fondo');
  assert.equal(c.edit(5,false),4.5,'la rotura inferior abre paso bajo el bloque superior');
  assert.equal(hydraulicCeiling(c.bed(),c.solidAt,64),5.5);
});

test('11.4.7: el agua extra no atraviesa el techo y busca una salida lateral', () => {
  const k=(x,z)=>`${x},${z}`;
  const cells=new Map([
    [k(0,0),{bed:4.5,baseTop:5.5,capacity:12}],
    [k(1,0),{bed:4.5,baseTop:5.5,capacity:0,roofed:true}],
    [k(0,1),{bed:4.5,baseTop:5.5,capacity:1}],
  ]);
  const original=new Map([[k(0,0),.8]]);
  const step=stepPressureV1147(original,[],(x,z)=>cells.get(k(x,z))||null,.25);
  assert.equal(step.volumes.get(k(1,0))||0,0,'no atraviesa el techo');
  assert.ok(step.volumes.get(k(0,1))>0,'se desvía al lateral abierto');
  const volume=values=>[...values.values()].reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(volume(original)-volume(step.volumes))<1e-9);
});

test('11.4.7: el mar recibe caudal sin subir su nivel global', () => {
  const k=(x,z)=>`${x},${z}`;
  const cells=new Map([
    [k(0,0),{bed:4.5,baseTop:5.5}],
    [k(1,0),{bed:4.5,baseTop:5.5,oceanSink:true}],
  ]);
  const step=stepPressureV1147(new Map([[k(0,0),.8]]),[],
    (x,z)=>cells.get(k(x,z))||null,.25);
  assert.ok(step.removedOcean>0,'el caudal entra en el sumidero marítimo');
  assert.equal(step.volumes.has(k(1,0)),false,'el mar mantiene su cota');
  assert.ok(Math.abs([...step.volumes.values()].reduce((a,b)=>a+b,0)+step.removed-.8)<1e-9);
});

test('11.4.7: filtración y evaporación registran exactamente las pérdidas', () => {
  const k=(x,z)=>`${x},${z}`;
  const v=new Map([[k(0,0),.5],[k(5,0),.5]]);
  const step=stepPressureV1147(v,[],(x,z)=>z===0&&(x===0||x===5)
    ?{bed:4.5,baseTop:5.5,permeability:.05,roofed:x===5}:null,1,[],
    {evaporationRate:.02,infiltrationScale:.2});
  assert.ok(Math.abs(step.evaporated-.02)<1e-10,'el techo evita evaporación directa');
  assert.ok(Math.abs(step.infiltrated-.02)<1e-10,'ambas columnas pueden filtrar');
  assert.ok(Math.abs([...step.volumes.values()].reduce((a,b)=>a+b,0)-1+step.removed)<1e-10);
});

test('11.4.7: el límite de celdas no hace desaparecer agua', () => {
  const k=(x,z)=>`${x},${z}`;
  const volumes=new Map();
  for(let i=0;i<PRESSURE_LIMIT;i++)volumes.set(k(i*10,0),.2);
  const step=stepPressureV1147(volumes,[],()=>({bed:4.5,baseTop:5.5}),.25);
  const sum=m=>[...m.values()].reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(sum(step.volumes)-sum(volumes))<1e-7);
  assert.ok(step.volumes.size<=PRESSURE_LIMIT);
});

test('11.4.7: una obra elevada no seca un río generado', () => {
  const waters=new Array(1024).fill(null),ground=new Float32Array(1024).fill(5.5);
  const solids=new Set();
  for(let x=12;x<=20;x++){
    const index=16*32+x;
    ground[index]=4.5;
    waters[index]={y:5.25,depth:1,kind:'river',stable:true,
      source:x===12,flowX:1,flowZ:0};
  }
  const chunk={position:{x:0,z:0},size:{height:64},loaded:true,
    waterColumns:waters,hydrologyGround:ground,
    naturalWaterColumns:waters.map(c=>c&&{...c}),naturalWaterGround:ground.slice(),
    getBlockId(x,y,z){return solids.has(`${x},${y},${z}`)?16:0;},
    refreshWater(){}};
  const world={type:'classic',hybrid:{hydrographyVersion:3},
    getChunk(cx,cz){return cx===0&&cz===0?chunk:null;}};
  const engine=new HydrologyEngine(world);
  solids.add('16,7,16');
  const index=16*32+16;
  ground[index]=hydraulicBedAfterEdit(ground[index],7,false,true,
    y=>solids.has(`16,${y},16`),64);
  engine.onBlockEdit(16,7,16);
  for(const x of [15,16,17,18])
    assert.equal(chunk.waterColumns[16*32+x]?.kind,'river',`río bajo el puente x=${x}`);
  assert.equal(engine.pressureInlets.size,0,'el puente no se reconoce como presa');
  assert.equal(engine.pressureSample(16,16).capacity,1,'queda un bloque libre bajo el tejado');
  solids.add('16,6,16');
  engine.onBlockEdit(16,6,16);
  assert.equal(engine.pressureSample(16,16).capacity,0,'un tejado más bajo limita el embalse');
  assert.ok(chunk.waterColumns[index], 'la corriente natural continúa bajo el tejado bajo');
  solids.delete('16,6,16');
  engine.onBlockEdit(16,6,16);
  assert.equal(engine.pressureSample(16,16).capacity,1,
    'el espacio se recupera inmediatamente después de quitar el bloque');
  solids.add('16,5,16');
  ground[index]=hydraulicBedAfterEdit(ground[index],5,false,true,
    y=>y<=4||solids.has(`16,${y},16`),64);
  engine.onBlockEdit(16,5,16);
  assert.ok(engine.pressureInlets.has('16,16'),'cerrar el paso crea una entrada de presa');
  assert.ok(engine.pressureDrains.has('16,16'),'se registra su salida aguas abajo');
  solids.delete('16,5,16');
  ground[index]=hydraulicBedAfterEdit(ground[index],5,true,false,
    y=>y<=4||solids.has(`16,${y},16`),64);
  engine.onBlockEdit(16,5,16);
  assert.equal(engine.pressureInlets.has('16,16'),false,'se retira la presa');
  assert.equal(engine.pressureDrains.has('16,16'),false,
    'al retirar una presa desaparece también el desagüe artificial');
});
