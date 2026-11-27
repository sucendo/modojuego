import * as THREE from 'three';
import {SHAPES} from './constructionShapes.js';
import {constructionGeometry} from './constructionGeometry.js';
import { furnitureGeometry, furnitureMaterial, torchMaterial } from './furniture.js';

const textureLoader = new THREE.TextureLoader();

function loadTexture(path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

const textures = {
  cactusSide: loadTexture('textures/cactus_side.png'),
  cactusTop: loadTexture('textures/cactus_top.png'),
  dirt: loadTexture('textures/dirt.png'),
  grass: loadTexture('textures/grass.png'),
  grassSide: loadTexture('textures/grass_side.png'),
  coalOre: loadTexture('textures/coal_ore.png'),
  ironOre: loadTexture('textures/iron_ore.png'),
  jungleTreeSide: loadTexture('textures/jungle_tree_side.png'),
  jungleTreeTop: loadTexture('textures/jungle_tree_top.png'),
  jungleLeaves: loadTexture('textures/jungle_leaves.png'),
  leaves: loadTexture('textures/leaves.png'),
  treeSide: loadTexture('textures/tree_side.png'),
  treeTop: loadTexture('textures/tree_top.png'),
  sand: loadTexture('textures/sand.png'),
  snow: loadTexture('textures/snow.png'),
  snowSide: loadTexture('textures/snow_side.png'),
  stone: loadTexture('textures/stone.png'),
  // Estos tres bloques ya existían en el catálogo, pero faltaban sus mapas 3D.
  planks: loadTexture('textures/planks.png'),
  stoneBricks: loadTexture('textures/stone_bricks.png'),
  glass: loadTexture('textures/glass.png'),
  craftingTable: loadTexture('textures/crafting_table.png'),
  basalt: loadTexture('textures/basalt.png'),
  snowLeaves: loadTexture('textures/snow_leaves.png'),
  deepslate: loadTexture('textures/deepslate.png'),
};

export const blocks = {
  empty: {
    id: 0,
    name: 'empty',
    visible: false
  },
  grass: {
    id: 1,
    name: 'grass',
    material: [
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.grass }), // top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.grassSide })  // back
    ]
  },
  dirt: {
    id: 2,
    name: 'dirt',
    material: new THREE.MeshLambertMaterial({ map: textures.dirt })
  },
  stone: {
    id: 3,
    name: 'stone',
    material: new THREE.MeshLambertMaterial({ map: textures.stone }),
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.8
  },
  coalOre: {
    id: 4,
    name: 'coal_ore',
    material: new THREE.MeshLambertMaterial({ map: textures.coalOre }),
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8
  },
  ironOre: {
    id: 5,
    name: 'iron_ore',
    material: new THREE.MeshLambertMaterial({ map: textures.ironOre }),
    scale: { x: 40, y: 40, z: 40 },
    scarcity: 0.9
  },
  tree: {
    id: 6,
    name: 'tree',
    visible: true,
    material: [
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.treeTop }), // top
      new THREE.MeshLambertMaterial({ map: textures.treeTop }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.treeSide })  // back
    ]
  },
  leaves: {
    id: 7,
    name: 'leaves',
    visible: true,
    material: new THREE.MeshLambertMaterial({ map: textures.leaves, alphaTest: 0.25, side: THREE.DoubleSide })
  },
  sand: {
    id: 8,
    name: 'sand',
    visible: true,
    material: new THREE.MeshLambertMaterial({ map: textures.sand })
  },
  cloud: {
    id: 9,
    name: 'cloud',
    visible: true,
    material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 })
  },
  snow: {
    id: 10,
    name: 'snow',
    material: [
      new THREE.MeshLambertMaterial({ map: textures.snowSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.snowSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.snow }), // top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.snowSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.snowSide })  // back
    ]
  },
  jungleTree: {
    id: 11,
    name: 'jungleTree',
    material: [
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeTop }),  // top
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeTop }),  // bottom
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide })  // back
    ]
  },
  jungleLeaves: {
    id: 12,
    name: 'jungleLeaves',
    material: new THREE.MeshLambertMaterial({ map: textures.jungleLeaves, alphaTest: 0.25, side: THREE.DoubleSide })
  },
  cactus: {
    id: 13,
    name: 'cactus',
    material: [
      new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.cactusTop }),  // top
      new THREE.MeshLambertMaterial({ map: textures.cactusTop }),  // bottom
      new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.cactusSide })  // back
    ]
  },
  planks: { id: 15, name: 'planks', material: new THREE.MeshLambertMaterial({ map: textures.planks }) },
  stoneBricks: { id: 16, name: 'stoneBricks', material: new THREE.MeshLambertMaterial({ map: textures.stoneBricks }) },
  glass: { id: 17, name: 'glass', material: new THREE.MeshLambertMaterial({ map: textures.glass, transparent: true, opacity: 0.90, depthWrite: false, side: THREE.DoubleSide }) },
  craftingTable: { id: 18, name: 'craftingTable', material: new THREE.MeshLambertMaterial({map:textures.craftingTable}) },
  basalt: { id: 19, name: 'basalt', material: new THREE.MeshLambertMaterial({map:textures.basalt}) },
  snowLeaves: { id: 20, name: 'snowLeaves', material: new THREE.MeshLambertMaterial({map:textures.snowLeaves,alphaTest:.25,side:THREE.DoubleSide}) },
  torch: { id: 21, name: 'torch', geometry: furnitureGeometry.torch, material: torchMaterial, partial: true, solid: false },
  bookshelf: { id: 22, name: 'bookshelf', geometry: furnitureGeometry.bookshelf, material: furnitureMaterial, partial: true },
  bed: { id: 23, name: 'bed', geometry: furnitureGeometry.bed, material: furnitureMaterial, partial: true, hitbox:{halfX:.48,halfY:.18,halfZ:.48,offsetY:-.29} },
  table: { id: 24, name: 'table', geometry: furnitureGeometry.table, material: furnitureMaterial, partial: true, hitbox:{halfX:.46,halfY:.10,halfZ:.46,offsetY:.18} },
  chest: { id: 25, name: 'chest', geometry: furnitureGeometry.chest, material: furnitureMaterial, partial: true },
  furnace: { id: 26, name: 'furnace', geometry: furnitureGeometry.furnace, material: furnitureMaterial },
  deepslate: { id: 27, name: 'deepslate', material: new THREE.MeshLambertMaterial({map:textures.deepslate}) },
  // Walkable, mineable surface ice. The water mesh remains beneath it so that
  // removing a block reveals a real opening without flooding nearby chunks.
  ice: { id: 28, name: 'ice', material: new THREE.MeshLambertMaterial({
    map:textures.glass,color:0x9fdde8,transparent:true,opacity:.86,
    alphaTest:.18,depthWrite:true,side:THREE.DoubleSide
  }) },
  jungleGrass: {
    id: 14,
    name: 'jungleGrass',
    material: [
      new THREE.MeshLambertMaterial({ color: 0x80c080, map: textures.grassSide }), // right
      new THREE.MeshLambertMaterial({ color: 0x80c080, map: textures.grassSide }), // left
      new THREE.MeshLambertMaterial({ color: 0x80c080, map: textures.grass }), // top
      new THREE.MeshLambertMaterial({ color: 0x80c080, map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ color: 0x80c080, map: textures.grassSide }), // front
      new THREE.MeshLambertMaterial({ color: 0x80c080, map: textures.grassSide })  // back
    ]
  },
};

for(const [name,id,texture] of [['goldOre',29,'gold_ore.svg'],['emeraldOre',30,'emerald_ore.svg'],['diamondOre',31,'diamond_ore.svg'],['roofTiles',32,'roof_tiles.svg'],['goldBlock',51,'gold_block.svg'],['emeraldBlock',52,'emerald_block.svg'],['diamondBlock',53,'diamond_block.svg']]){
 blocks[name]={id,name,material:new THREE.MeshLambertMaterial({map:loadTexture('textures/'+texture)})};
}
for(const [id,shape] of SHAPES){
 const material=shape.material==='wood'?blocks.planks.material:shape.material==='tile'?blocks.roofTiles.material:blocks.stoneBricks.material;
 blocks['construction'+id]={id,name:'construction'+id,geometry:constructionGeometry(id),material,partial:true,hitboxes:shape.boxes};
}

export const resources = [
  blocks.stone,
  blocks.coalOre,
  blocks.ironOre
];
