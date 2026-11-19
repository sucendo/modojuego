import test from 'node:test';
import assert from 'node:assert/strict';
import { HydrologyEngine } from '../scripts/hydrologyEngine.js';
import { sourceWaterBlocked } from '../scripts/waterVoxelsV1134.js';

function mockWorld(sources = [], ground = []) {
  const chunks = new Map();
  function chunkAt(cx, cz) {
    const id = `${cx},${cz}`;
    if (!chunks.has(id)) {
      const floor = new Float32Array(1024).fill(6.5);
      const chunk = {
        position: { x: cx * 32, z: cz * 32 }, loaded: true,
        waterColumns: Array(1024).fill(null), hydrologyGround: floor,
        refreshes: 0, refreshWater() { this.refreshes++; },
      };
      chunks.set(id, chunk);
    }
    return chunks.get(id);
  }
  for (const [x, z, bed] of ground) {
    const c = chunkAt(Math.floor(x / 32), Math.floor(z / 32));
    c.hydrologyGround[((z % 32) + 32) % 32 * 32 + ((x % 32) + 32) % 32] = bed;
  }
  for (const [x, z, bed, kind = 'river', source = false, flowX = 0, flowZ = 0] of sources) {
    const c = chunkAt(Math.floor(x / 32), Math.floor(z / 32));
    const i = ((z % 32) + 32) % 32 * 32 + ((x % 32) + 32) % 32;
    c.hydrologyGround[i] = bed;
    c.waterColumns[i] = { y: bed + .75, depth: 1, kind, stable: true, source, flowX, flowZ };
  }
  for (const c of chunks.values()) {
    c.naturalWaterColumns = c.waterColumns.map(w => w ? { ...w } : null);
    c.naturalWaterGround = c.hydrologyGround.slice();
  }
  return {
    chunks,
    world: { type: 'classic', hybrid: { hydrographyVersion: 3 },
      getChunk(cx, cz) { return chunks.get(`${cx},${cz}`) || null; } },
    at(x,z) {
      const c = chunkAt(Math.floor(x / 32), Math.floor(z / 32));
      return c.waterColumns[((z % 32) + 32) % 32 * 32 + ((x % 32) + 32) % 32];
    },
    setGround(x,z,bed) {
      const c = chunkAt(Math.floor(x / 32), Math.floor(z / 32));
      c.hydrologyGround[((z % 32) + 32) % 32 * 32 + ((x % 32) + 32) % 32] = bed;
    }
  };
}

test('una cascada conserva el caudal tras modificar su orilla y esperar', () => {
  const env = mockWorld([[16,16,4.5,'river',true],[17,16,3.5,'river',false]],
    [[18,16,3.5],[19,16,3.5]]);
  const engine = new HydrologyEngine(env.world);
  env.setGround(18,16,2.5); // se ha excavado el bloque que abría la orilla
  engine.onBlockEdit(18,4,16);
  assert.ok(env.at(18,16), 'agua reocupa el bloque libre');
  assert.equal(env.at(16,16).source,true,'el marcador original no cambia');
  assert.equal(env.at(17,16).stable,true,'la corriente natural permanece');
  const initial = engine.snapshot();
  for (let i = 0; i < 180; i++) engine.update(.5,{ x:18,z:16 });
  assert.deepEqual(engine.snapshot(),initial,'no existe agotamiento con el tiempo');
  assert.equal(engine.cells.size,0,'sin simulación física de reserva limitada');
});

test('poner y quitar una presa tapa y restaura el manantial sin subir el agua', () => {
  const env = mockWorld([[16,16,4.5,'river',true]]);
  const engine = new HydrologyEngine(env.world);
  env.setGround(16,16,5.5);
  engine.onBlockEdit(16,5,16);
  assert.equal(env.at(16,16),null,'el bloque sólido desplaza el agua');
  env.setGround(16,16,4.5);
  engine.onBlockEdit(16,5,16);
  assert.equal(env.at(16,16).source,true,'la fuente original vuelve a surgir');
  assert.equal(env.at(16,16).y,5.25,'la fuente no asciende sobre el terreno');
});

test('un manantial cerrado deja de alimentar su agua derivada', () => {
  const env = mockWorld([[16,16,4.5,'river',true]],[[17,16,4.5],[18,16,4.5]]);
  const engine = new HydrologyEngine(env.world);
  env.setGround(17,16,3.5);
  engine.onBlockEdit(17,5,16);
  assert.ok(env.at(17,16)?.flowing);
  env.setGround(16,16,5.5);
  engine.onBlockEdit(16,5,16);
  assert.equal(env.at(16,16),null);
  assert.equal(env.at(17,16),null,'sin fuente, el tramo derivado se seca');
});

test('un tejado por encima del agua no oculta la fuente natural', () => {
  const water = { y:5.25,depth:1,kind:'river',stable:true };
  assert.equal(sourceWaterBlocked(water,4.5,12.5,y=>y===12?3:0),false);
  assert.equal(sourceWaterBlocked(water,4.5,5.5,y=>y===5?3:0),true);
});

test('los niveles fluyentes se guardan y recuperan sin volver a simular un río', () => {
  const a = mockWorld([[16,16,4.5,'lake',true]],[[17,16,5.5],[18,16,5.5]]);
  const engine = new HydrologyEngine(a.world);
  a.setGround(17,16,4.5);
  engine.onBlockEdit(17,5,16);
  const first = a.at(17,16);
  assert.ok(first?.flowing);
  assert.ok(first.depth<1 && first.depth>0,'se usan ocho niveles, no mini-cubos');
  const saved = engine.snapshot();
  assert.equal(saved.cells.length,0);
  assert.ok(saved.flows.length>0);
  const b = mockWorld([[16,16,4.5,'lake',true]],[[17,16,5.5],[18,16,5.5]]);
  b.setGround(17,16,4.5);
  const loaded = new HydrologyEngine(b.world);
  loaded.restore(saved);
  loaded.reconcileChunk(b.world.getChunk(0,0));
  assert.deepEqual(b.at(17,16),first);
  loaded.update(360,{x:17,z:16});
  assert.deepEqual(b.at(17,16),first);
});

test('el agua atraviesa límites de chunks contiguos sin consumir la fuente', () => {
  const env = mockWorld([[31,16,4.5,'river',true]],[[32,16,3.5]]);
  const engine = new HydrologyEngine(env.world);
  env.setGround(32,16,2.5);
  engine.onBlockEdit(32,4,16);
  assert.ok(env.at(32,16)?.flowing);
  assert.equal(env.at(31,16).source,true);
  assert.ok(env.world.getChunk(0,0).refreshes>0);
  assert.ok(env.world.getChunk(1,0).refreshes>0);
});

test('las celdas transitorias antiguas no se reactivan al cargar un mundo nuevo', () => {
  const env = mockWorld([[16,16,4.5,'river',true]]);
  const engine = new HydrologyEngine(env.world);
  engine.restore({version:2,cells:[[16,16,.1,0,'sand','river']]});
  engine.reconcileChunk(env.world.getChunk(0,0));
  assert.equal(engine.cells.size,0);
  assert.equal(env.at(16,16).source,true);
  assert.equal(env.at(16,16).depth,1);
});

test('un cambio junto al río no desborda otras orillas sin excavar',()=>{
  const env=mockWorld([[16,16,4.5,'river',true],[18,16,4.5,'river',false]],
    [[16,17,3.5],[17,16,4.5],[18,17,3.5]]);
  const engine=new HydrologyEngine(env.world);
  engine.onBlockEdit(17,5,16); // terreno sin bajar: no se ha abierto una salida
  assert.equal(env.at(16,17),null);
  assert.equal(env.at(18,17),null);
  env.setGround(17,16,3.5); // ahora sí se ha abierto una zanja junto al agua
  engine.onBlockEdit(17,5,16);
  assert.ok(env.at(17,16)?.flowing);
  assert.ok(env.at(16,17)===null,'otra orilla sin excavación permanece seca');
});

test('11.4.5: una presa seca el tramo aguas abajo y al abrirla recupera el caudal',()=>{
  const river=Array.from({length:11},(_,i)=>[12+i,16,4.5,'river',i===0,1,0]);
  const env=mockWorld(river);
  const engine=new HydrologyEngine(env.world);
  env.setGround(16,16,5.5);
  engine.onBlockEdit(16,5,16);
  assert.equal(env.at(16,16),null,'el obstáculo ocupa la celda del río');
  for(const x of [17,18,19,20])assert.equal(env.at(x,16),null,`se seca x=${x}`);
  assert.ok(env.at(15,16),'el tramo de cabecera permanece lleno');
  const saved=engine.snapshot();
  assert.ok(saved.suppressed.some(([x,z])=>x===19&&z===16));
  const reloaded=mockWorld(river);
  reloaded.setGround(16,16,5.5);
  const restored=new HydrologyEngine(reloaded.world);
  restored.restore(saved);
  restored.reconcileChunk(reloaded.world.getChunk(0,0));
  assert.equal(reloaded.at(19,16),null,'el cauce no reaparece al cargar la partida');
  env.setGround(16,16,4.5);
  engine.onBlockEdit(16,5,16);
  assert.ok(env.at(19,16),'se restablece el río aguas abajo al romper la presa');
  assert.equal(engine.suppressedNatural.size,0);
});

test('11.4.5: una zanja conecta una derivación y devuelve agua a un tramo cortado',()=>{
  const river=Array.from({length:11},(_,i)=>[12+i,16,4.5,'river',i===0,1,0]);
  const banks=[];
  for(const [x,z] of [[15,17],[16,17],[17,17]])banks.push([x,z,5.5]);
  const env=mockWorld(river,banks);
  const engine=new HydrologyEngine(env.world);
  env.setGround(16,16,5.5);
  engine.onBlockEdit(16,5,16);
  assert.equal(env.at(18,16),null);
  for(const [x,z] of [[15,17],[16,17],[17,17]]){
    env.setGround(x,z,4.5);
    engine.onBlockEdit(x,5,z);
  }
  assert.ok(env.at(16,17)?.flowing,'la acequia excavada recibe agua');
  assert.ok(env.at(18,16),'el agua vuelve al cauce aguas abajo');
  assert.equal(env.at(16,16),null,'la presa continúa cortando el cauce original');
});

test('11.4.5: el borde del terreno cargado aporta agua solo por el lado de entrada',()=>{
  const river=Array.from({length:73},(_,i)=>[-32+i,16,4.5,'river',false,1,0]);
  const env=mockWorld(river);
  const engine=new HydrologyEngine(env.world);
  env.setGround(0,16,5.5);
  engine.onBlockEdit(0,5,16);
  assert.ok(env.at(-25,16),'un río que entra de otro chunk sigue alimentado');
  assert.equal(env.at(25,16),null,'el río cortado no se alimenta desde el borde de salida');
  env.setGround(0,16,4.5);
  engine.onBlockEdit(0,5,16);
  assert.ok(env.at(25,16),'la continuidad vuelve tras retirar el obstáculo');
});

test('11.4.6: tras levantar una presa el nivel sube y el canal excavado conduce agua',()=>{
  const river=Array.from({length:11},(_,i)=>[12+i,16,4.5,'river',i===0,1,0]);
  const env=mockWorld(river,[[15,17,6.5],[16,17,6.5],[17,17,6.5]]);
  const engine=new HydrologyEngine(env.world);
  env.setGround(16,16,5.5);
  engine.onBlockEdit(16,5,16);
  assert.ok(engine.pressureInlets.size>0,'hay captación del caudal anterior a la presa');
  const initial=env.at(15,16).depth;
  for(let i=0;i<60;i++)engine.update(.25,{x:15,z:16});
  assert.ok(env.at(15,16).depth>initial+.08,'el embalse eleva la lámina aguas arriba');
  const beforeHole=engine.pressureVolumes.get('15,17')||0;
  env.setGround(15,17,4.5);
  engine.onBlockEdit(15,5,17);
  for(let i=0;i<28;i++)engine.update(.25,{x:15,z:17});
  assert.ok(env.at(15,17)?.dynamic,'el agua entra por el nuevo hueco');
  assert.ok((engine.pressureVolumes.get('15,17')||0)>beforeHole,'el hueco recibe volumen de agua');
  const snapshot=engine.snapshot();
  assert.ok(snapshot.pressure.length,'la masa embalsada se incluye en el guardado');
  assert.ok(snapshot.pressureInlets.length,'el manantial embalsado se conserva');
  const reopened=mockWorld(river,[[15,17,6.5],[16,17,6.5],[17,17,6.5]]);
  reopened.setGround(16,16,5.5);
  reopened.setGround(15,17,4.5);
  const loaded=new HydrologyEngine(reopened.world);
  loaded.restore(snapshot);
  loaded.reconcileChunk(reopened.world.getChunk(0,0));
  assert.ok(reopened.at(15,17)?.dynamic,'el caudal sigue tras recargar el mundo');
});

test('11.4.6: al retirar la presa deja de entrar caudal represado y baja la altura',()=>{
  const river=Array.from({length:11},(_,i)=>[12+i,16,4.5,'river',i===0,1,0]);
  const env=mockWorld(river);
  const engine=new HydrologyEngine(env.world);
  env.setGround(16,16,5.5);
  engine.onBlockEdit(16,5,16);
  for(let i=0;i<60;i++)engine.update(.25,{x:15,z:16});
  const before=engine.pressureVolumes.get('15,16')||0;
  assert.ok(before>.05);
  env.setGround(16,16,4.5);
  engine.onBlockEdit(16,5,16);
  assert.equal(engine.pressureInlets.size,0);
  for(let i=0;i<90;i++)engine.update(.25,{x:15,z:16});
  const after=engine.pressureVolumes.get('15,16')||0;
  assert.ok(after<before,'el embalse pierde parte de su exceso hacia el cauce');
});
