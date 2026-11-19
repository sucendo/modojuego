import * as THREE from 'three';

// Compact voxel furniture made from actual meshes, not transparent cube decals.
// Each item occupies one cell so it remains compatible with existing v1-v3 saves,
// block selection, chunk instancing, and the current block-collision model.
function voxels(parts) {
  const position = [], normal = [], colors = [];
  for (const { at, size, color } of parts) {
    const box = new THREE.BoxGeometry(...size).toNonIndexed();
    box.translate(...at);
    const xyz = box.getAttribute('position').array;
    const nrm = box.getAttribute('normal').array;
    const pigment = new THREE.Color(color);
    for (let i = 0; i < xyz.length; i += 3) {
      position.push(xyz[i], xyz[i+1], xyz[i+2]);
      normal.push(nrm[i], nrm[i+1], nrm[i+2]);
      colors.push(pigment.r, pigment.g, pigment.b);
    }
    box.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeBoundingSphere();
  return geo;
}
const part = (at, size, color) => ({at,size,color});

export const furnitureMaterial = new THREE.MeshLambertMaterial({vertexColors:true});
export const torchMaterial = new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x8d4316,emissiveIntensity:0.22});

export const furnitureGeometry = {
  torch: voxels([
    part([0,-.16,0],[.11,.66,.11],0x794c28),
    part([0,.18,0],[.18,.17,.18],0x4b3424),
    part([0,.31,0],[.19,.18,.19],0xffbe4b),
    part([0,.45,0],[.12,.12,.12],0xfff0a0)
  ]),
  table: voxels([
    part([0,.18,0],[.92,.16,.92],0xa6723e),
    part([-.34,-.19,-.34],[.15,.63,.15],0x67432d),
    part([.34,-.19,-.34],[.15,.63,.15],0x67432d),
    part([-.34,-.19,.34],[.15,.63,.15],0x67432d),
    part([.34,-.19,.34],[.15,.63,.15],0x67432d)
  ]),
  bed: voxels([
    part([0,-.29,0],[.96,.18,.96],0x704c2c),
    part([0,-.12,0],[.93,.20,.93],0xbf313b),
    part([0,-.005,-.32],[.85,.055,.28],0xe8e7d3),
    part([0,.08,-.46],[.98,.50,.10],0x835536),
    part([-.40,-.39,.38],[.12,.15,.12],0x66412a),
    part([.40,-.39,.38],[.12,.15,.12],0x66412a)
  ]),
  bookshelf: (()=>{
    const p=[part([0,0,0],[.99,.99,.78],0x714b2c)];
    for (const y of [-.34,-.01,.32]) {
      p.push(part([0,y-.15,.43],[.98,.075,.17],0xb4844d));
      for(let i=0;i<9;i++){
        const shades=[0x2d7285,0xb34d33,0x67a064,0xa98732,0x783e6c,0x3b83a7];
        p.push(part([-.39+i*.098,y,.438],[.083,.24,.095],shades[(i+Math.floor((y+1)*8))%shades.length]));
      }
    }
    p.push(part([-.46,0,.39],[.08,.95,.17],0xc39255));
    p.push(part([.46,0,.39],[.08,.95,.17],0xc39255));
    return voxels(p);
  })(),
  chest: voxels([
    part([0,-.08,0],[.88,.70,.78],0x9f6936),
    part([0,.23,0],[.91,.15,.82],0x784825),
    part([0,-.08,.40],[.12,.72,.07],0x5c402c),
    part([-.34,-.08,.4],[.09,.72,.07],0x5c402c),
    part([.34,-.08,.4],[.09,.72,.07],0x5c402c),
    part([0,.06,.45],[.16,.20,.10],0xe2b64c)
  ]),
  furnace: voxels([
    part([0,0,0],[.98,.98,.98],0x777a7b),
    part([0,.33,.502],[.75,.10,.02],0x4b4f50),
    part([0,.02,.503],[.73,.29,.02],0x292b2a),
    part([0,-.24,.509],[.70,.24,.02],0x373231),
    part([0,-.26,.519],[.46,.10,.02],0xe07824),
    part([-.43,0,.51],[.10,.95,.02],0x515353),
    part([.43,0,.51],[.10,.95,.02],0x515353)
  ])
};
