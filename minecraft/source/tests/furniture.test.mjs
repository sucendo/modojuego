import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=name=>readFileSync(join(root,'scripts',name),'utf8');

test('new furniture has actual chunk-instanced voxel geometry and icons',()=>{
  const blocks=source('blocks.js');
  const chunk=source('worldChunk.js');
  const geometry=source('furniture.js');
  for(const name of ['torch','bed','bookshelf','table','chest','furnace']){
    assert.match(blocks,new RegExp(`${name}: \\{ id: (21|22|23|24|25|26), name: '${name}'`));
    assert.match(geometry,new RegExp(`${name}:`));
    for(const dir of ['textures','public/textures'])assert.ok(existsSync(join(root,dir,`${name}.png`)),`${name} missing icon in ${dir}`);
  }
  assert.match(chunk,/blockType\.geometry \|\| geometry/);
  assert.match(chunk,/blocks\.torch\.id/);
});

test('torches use capped nearby lights and bed interactions persist with the world',()=>{
  const lamps=source('torchLighting.js');
  assert.match(lamps,/maxLights=8/);
  assert.match(lamps,/PointLight/);
  assert.match(lamps,/distance2>14\*14/);
  const player=source('player.js');
  assert.match(player,/id===23/);
  assert.match(player,/this\.respawnPoint=\[x,y\+2,z\]/);
  const save=source('saveManager.js');
  assert.match(save,/respawnPoint: player\.respawnPoint/);
});
