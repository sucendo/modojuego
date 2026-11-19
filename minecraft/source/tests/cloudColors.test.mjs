import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cloudColorAtHour } from '../scripts/cloudColors.js';

const rgb = (value) => [(value >> 16) & 255, (value >> 8) & 255, value & 255];
const brightness = value => rgb(value).reduce((a, b) => a + b, 0);

test('nubes cambian suavemente entre noche, amanecer, mediodía y atardecer', () => {
  const night = cloudColorAtHour(2);
  const sunrise = cloudColorAtHour(6.25);
  const midday = cloudColorAtHour(12);
  const sunset = cloudColorAtHour(18);
  assert.ok(brightness(night) < brightness(sunrise));
  assert.ok(brightness(midday) > brightness(sunrise));
  assert.ok(brightness(sunset) > brightness(night));
  assert.ok(rgb(sunrise)[0] > rgb(sunrise)[2], 'amanecer cálido');
  assert.ok(rgb(sunset)[0] > rgb(sunset)[2], 'atardecer cálido');
});

test('nubes son continuas al cruzar medianoche y mantienen colores válidos', () => {
  assert.equal(cloudColorAtHour(0), cloudColorAtHour(24));
  assert.equal(cloudColorAtHour(-1), cloudColorAtHour(23));
  assert.equal(cloudColorAtHour(48.5), cloudColorAtHour(0.5));
  for (let h=0; h<=24; h+=.02) {
    const channels=rgb(cloudColorAtHour(h));
    assert.ok(channels.every(v=>v>=0 && v<=255));
    const next=rgb(cloudColorAtHour(h+.02));
    assert.ok(channels.every((v,i)=>Math.abs(v-next[i])<=5),`transición brusca a las ${h}`);
  }
});

test('nubes presentan matices por mundo sin dejar de cambiar de hora', () => {
  const types=['classic','ocean','jungle','desert','snow','lava'];
  for (const type of types) {
    assert.notEqual(cloudColorAtHour(12,type),cloudColorAtHour(0,type));
    assert.ok(brightness(cloudColorAtHour(12,type))>brightness(cloudColorAtHour(0,type)));
  }
  assert.ok(brightness(cloudColorAtHour(12,'lava')) < brightness(cloudColorAtHour(12,'classic')));
  assert.equal(cloudColorAtHour(12,'unknown'),cloudColorAtHour(12,'classic'));
  assert.equal(cloudColorAtHour(NaN),cloudColorAtHour(12));
});

test('el render aplica el color a material compartido, con actualización limitada',()=>{
  const lighting=readFileSync(new URL('../scripts/dayNightLighting.js', import.meta.url),'utf8');
  const blocks=readFileSync(new URL('../scripts/blocks.js', import.meta.url),'utf8');
  assert.match(blocks,/cloud:\s*\{[\s\S]*?material:\s*new THREE\.MeshBasicMaterial/);
  assert.match(lighting,/blocks\.cloud\.material\.color\.setHex\(cloudColorAtHour\(hours, worldType\)\)/);
  assert.match(lighting,/now-this\.previous<180/);
});
