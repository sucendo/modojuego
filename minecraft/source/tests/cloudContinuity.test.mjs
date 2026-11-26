import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cloudCell, cloudShapeParts, cloudHorizonOpacity, cloudCoverOpacity,
  normalizeCloudStyle } from '../scripts/cloudMath.js';

const file = name => readFileSync(new URL(name,import.meta.url),'utf8');
test('las nubes conservan su forma, lugar y profundidad aunque cambie la ventana del jugador',()=>{
  for(const layer of [0,1])for(const x of [-17,0,9,347])for(const z of [-108,1,34]){
    const a=cloudCell(922,x,z,layer,30);
    assert.deepEqual(a,cloudCell(922,x,z,layer,30));
    assert.notDeepEqual(a,cloudCell(923,x,z,layer,30));
    for(const style of ['fast','fancy','advanced']){
      const parts=cloudShapeParts(a,style);
      assert.ok(parts.length>=3);
      assert.ok(parts.every(p=>p.length===6&&p.every(Number.isFinite)));
    }
  }
});
test('opacidad gradual al alejarse, sin saltos en el borde',()=>{
  let previous=1;
  for(let d=0;d<=210;d+=.05){
    const a=cloudHorizonOpacity(d,120,198);
    assert.ok(a<=previous+1e-12);
    assert.ok(Math.abs(a-previous)<.003);
    previous=a;
  }
  assert.equal(cloudHorizonOpacity(198,120,198),0);
  assert.equal(cloudHorizonOpacity(50,120,198),1);
});
test('clima modifica opacidad sin redistribuir nubes',()=>{
  for(const chance of [.01,.2,.5,.8,.99]){
    let previous=cloudCoverOpacity(chance,0);
    for(let cover=0;cover<=1;cover+=.001){
      const alpha=cloudCoverOpacity(chance,cover);
      assert.ok(alpha>=previous-1e-12);
      assert.ok(Math.abs(alpha-previous)<.007);
      previous=alpha;
    }
  }
});
test('configuración de estilos y sombras nunca depende de la dirección de cámara',()=>{
  assert.equal(normalizeCloudStyle('unknown'),'advanced');
  assert.equal(normalizeCloudStyle('fast'),'fast');
  const layer=file('../scripts/cloudLayer.js');
  assert.match(layer,/frustumCulled=false/);
  assert.match(layer,/cloudHorizonOpacity\(/);
  assert.match(layer,/cloudCoverOpacity\(/);
  assert.doesNotMatch(layer,/camera\.rotation|camera\.quaternion|camera\.getWorldDirection/);
  assert.match(layer,/customDepthMaterial=depth/);
  const player=file('../scripts/player.js');
  assert.match(player,/0\.1, 900/);
});
test('estilo de nubes se valida, guarda y restaura sin cambiar formato JSON v9',()=>{
  const save=file('../scripts/saveManager.js');
  const world=file('../scripts/world.js');
  assert.match(world,/cloudStyle = 'advanced'/);
  assert.match(save,/cloudStyle:world\.cloudStyle/);
  assert.match(save,/world\.cloudStyle=normalized\.settings\.cloudStyle \?\? 'advanced'/);
  assert.match(save,/const SAVE_VERSION = 17/);
});
