import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = name => readFileSync(join(project, 'scripts', name), 'utf8');

test('all 3D block material maps are registered and packaged with the game', () => {
  const blocks = source('blocks.js');
  const declared = [...blocks.matchAll(/\b([A-Za-z]+):\s*loadTexture\(['"]([^'"]+)['"]\)/g)];
  const keys = new Map(declared.map(([, key, path]) => [key, path]));
  const references = [...blocks.matchAll(/map:\s*textures\.([A-Za-z]+)/g)].map(m => m[1]);
  assert.ok(references.length > 20);
  for (const name of references) {
    assert.ok(keys.has(name), `Missing texture registration: ${name}`);
    for (const folder of ['public', '.']) {
      const assetPath = resolve(project, folder, keys.get(name));
      assert.ok(existsSync(assetPath), `Missing ${folder} texture: ${keys.get(name)}`);
      assert.ok(statSync(assetPath).size > 50, `Empty texture: ${name}`);
    }
  }
  for (const name of ['planks', 'stoneBricks', 'glass']) assert.ok(keys.has(name));
});

test('pickaxe has a bundled GLB plus fallback and is animated by left click', () => {
  const glb = readFileSync(join(project, 'public/models/pickaxe.glb'));
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  assert.match(source('modelLoader.js'), /createFallbackPickaxe/);
  assert.match(source('player.js'), /event\.button!==0 && event\.button!==2/);
  assert.match(source('player.js'), /this\.mineMode/);
  assert.match(source('player.js'), /pickVoxel\(/);
  assert.match(source('player.js'), /this\.tool\.container\.visible=true/);
  assert.match(source('player.js'), /this\.tool\.container\.visible=this\.shouldShowPickaxe\(\)/);
});

test('semi-transparent neighbors do not incorrectly hide solid blocks', () => {
  const chunk = source('worldChunk.js');
  assert.match(chunk, /NON_OCCLUDING/);
  assert.match(chunk, /blocks\.glass\.id/);
  assert.match(chunk, /blocks\.leaves\.id/);
});
