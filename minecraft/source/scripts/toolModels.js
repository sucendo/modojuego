import * as THREE from 'three';
import { TOOL_PROFILES } from './toolProfiles.js';
const wood=new THREE.MeshLambertMaterial({color:0x7a5735});
const steel=new THREE.MeshLambertMaterial({color:0xc1d0d8});
function part(g, material, size, position){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
  mesh.position.set(...position);mesh.castShadow=false;g.add(mesh);
}
export function createToolModel(id='basic_pickaxe') {
  const type=TOOL_PROFILES[id] || TOOL_PROFILES.basic_pickaxe;
  const color=new THREE.MeshLambertMaterial({color:type.color});
  const g=new THREE.Group();
  if(type.kind==='pickaxe'){
    part(g,wood,[.16,1.3,.15],[0,-.09,0]);
    part(g,color,[1.18,.19,.22],[0,.45,0]);
    part(g,color,[.2,.23,.22],[-.51,.36,0]);
    part(g,color,[.2,.23,.22],[.51,.36,0]);
  }else if(type.kind==='broom'){
    part(g,wood,[.10,1.42,.10],[0,-.18,0]);
    part(g,wood,[.65,.13,.16],[0,.48,0]);
    for(let i=0;i<7;i++)part(g,color,[.085,.40,.17],[(i-3)*.09,.70,0]);
  }else if(type.kind==='saw'){
    part(g,wood,[.18,.66,.20],[0,-.42,0]);
    part(g,steel,[.19,1,.07],[0,.35,0]);
    for(let n=0;n<5;n++) part(g,steel,[.14,.12,.10],[.14,.02+n*.19,0]);
  }else{
    part(g,wood,[.16,.45,.16],[0,-.53,0]);
    part(g,color,[.22,1.36,.12],[0,.35,0]);
    part(g,steel,[.72,.13,.18],[0,-.24,0]);
    part(g,color,[.18,.16,.12],[0,1.08,0]);
  }
  return g;
}
