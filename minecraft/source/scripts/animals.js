import * as THREE from 'three';
const palette={
  sheep:{body:0xe8e5d9,head:0xd2c8af,leg:0x756d5d,face:0x443f3b},
  cow:{body:0xcfc4b4,head:0xa18e7c,leg:0x695144,face:0x302823},
  pig:{body:0xe49fa1,head:0xe8afb1,leg:0xd68a8f,face:0x874d55},
  chicken:{body:0xf1eee1,head:0xf5efe3,leg:0xe9a440,face:0xe39825}
};
const materials={};
const geometry=new THREE.BoxGeometry(1,1,1);
function material(color){if(!materials[color])materials[color]=new THREE.MeshLambertMaterial({color});return materials[color];}
function part(parent,color,position,size){
  const mesh=new THREE.Mesh(geometry,material(color));mesh.position.set(...position);mesh.scale.set(...size);mesh.castShadow=true;mesh.receiveShadow=true;
  parent.add(mesh);return mesh;
}
function createModel(type){
  const g=new THREE.Group(),p=palette[type],legs=[];
  if(type==='chicken'){
    part(g,p.body,[0,0,0],[.63,.60,.75]);
    part(g,p.head,[0,.38,-.33],[.45,.44,.44]);
    part(g,p.face,[0,.30,-.61],[.18,.16,.23]);
    part(g,0xdf3630,[0,.67,-.34],[.16,.19,.19]);
    for(const x of [-.17,.17])legs.push(part(g,p.leg,[x,-.48,.03],[.09,.40,.12]));
  }else{
    part(g,p.body,[0,0,.07],[.80,.72,1.16]);
    part(g,p.head,[0,.12,-.58],[.53,.55,.54]);
    if(type==='pig')part(g,0xbc6c76,[0,.09,-.89],[.34,.22,.15]);
    else part(g,p.face,[0,-.02,-.87],[.35,.22,.10]);
    for(const x of [-.28,.28])for(const z of [-.34,.38])legs.push(part(g,p.leg,[x,-.48,z],[.19,.49,.19]));
    if(type==='cow'){
      part(g,0x43332f,[.24,.22,.30],[.22,.20,.31]);
      part(g,0x43332f,[-.28,-.13,-.10],[.18,.25,.35]);
    }
    if(type==='sheep')for(const x of [-.30,.30])part(g,0xf8f5e9,[x,.34,.08],[.29,.23,.91]);
  }
  // simple pixel eyes
  for(const x of [-.13,.13])part(g,0x202022,[x,.26,type==='chicken' ? -.56 : -.86],[.07,.08,.08]);
  return {group:g,legs};
}
function randomFrom(...values){
  let seed=2166136261;
  for(const value of values){seed=Math.imul(seed ^ (value|0),16777619)>>>0;}
  seed ^= seed>>>16;seed=Math.imul(seed,2246822507)>>>0;seed^=seed>>>13;
  return (seed>>>0)/4294967296;
}
const SURFACE=new Set([1,2,8,10,14,19]);
const TYPES=['sheep','cow','pig','chicken'];
export class Animals {
  constructor(scene,world){
    this.group=new THREE.Group();this.group.name='Animals';scene.add(this.group);
    this.world=world;this.entries=new Map();this.lastSync=0;this.onChange=()=>{};this.onSpotted=()=>{};
  }
  clear(){for(const entry of this.entries.values())this.group.remove(entry.mesh);this.entries.clear();}
  reset(){this.clear();this.lastSync=0;}
  sync(player){
    const cx=Math.floor(player.x/this.world.chunkSize.width);
    const cz=Math.floor(player.z/this.world.chunkSize.width);
    const wanted=new Set();
    if(this.world.type!=='lava')for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
      const chunk=this.world.getChunk(cx+dx,cz+dz);
      if(!chunk?.loaded)continue;
      for(let n=0;n<2;n++){
        const x=Math.round(chunk.position.x+4+randomFrom(chunk.userData.x,chunk.userData.z,n,this.world.params.seed)*23);
        const z=Math.round(chunk.position.z+4+randomFrom(chunk.userData.z,chunk.userData.x,n+61,this.world.params.seed)*23);
        const id=`${chunk.userData.x}:${chunk.userData.z}:${n}`;
        if(this.world.removedAnimals?.includes(id))continue;
        if(this.world.type==='desert' && randomFrom(x,z,15)>.25)continue;
        const localX=x-chunk.position.x,localZ=z-chunk.position.z;
        if(chunk.waterColumns?.[localZ*this.world.chunkSize.width+localX])continue;
        let top=-1;
        for(let y=this.world.chunkSize.height-2;y>=0;y--){
          if(SURFACE.has(this.world.getBlock(x,y,z)?.id)){top=y;break;}
        }
        if(top < 0 || top <=this.world.params.terrain.waterOffset)continue;
        wanted.add(id);
        if(!this.entries.has(id)){
          const types=this.world.type==='snow'?['sheep','chicken']:this.world.type==='jungle'?['pig','chicken','cow']:TYPES;
          const type=types[Math.floor(randomFrom(x,z,26)*types.length)];
          const {group:mesh,legs}=createModel(type);
          mesh.position.set(x,top+1.35,z);mesh.rotation.y=randomFrom(x,z,38)*Math.PI*2;
          mesh.userData.animalId=id;
          this.group.add(mesh);
          this.entries.set(id,{id,type,mesh,legs,base:mesh.position.clone(),phase:randomFrom(x,z,47)*10,angle:mesh.rotation.y});
          this.onSpotted(type);
        }
      }
    }
    for(const [id,entry] of this.entries)if(!wanted.has(id)){this.group.remove(entry.mesh);this.entries.delete(id);}
  }
  update(dt,player,now){
    if(now-this.lastSync>1200){this.lastSync=now;this.sync(player);}
    const time=now/1000;
    for(const entry of this.entries.values()){
      const a=Math.sin(time*.45+entry.phase)*.42;
      entry.mesh.rotation.y=entry.angle+a;
      entry.mesh.position.x=entry.base.x+Math.sin(time*.22+entry.phase)*.60;
      entry.mesh.position.z=entry.base.z+Math.cos(time*.25+entry.phase)*.60;
      entry.legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(time*2.5+entry.phase+i*Math.PI)*.20;});
    }
  }
  raycast(raycaster,maxDistance=Infinity){
    const hit=raycaster.intersectObject(this.group,true).find(h=>h.distance<maxDistance);
    if(!hit)return null;
    let node=hit.object;
    while(node && !node.userData.animalId)node=node.parent;
    return node?{id:node.userData.animalId,distance:hit.distance}:null;
  }
  harvest(id,inventory,toolId='basic_pickaxe'){
    const entry=this.entries.get(id);if(!entry)return false;
    const item=entry.type==='sheep'?'wool':'raw_meat';
    const quantity=['sword','spear'].includes(toolId) && item==='raw_meat' ? 2 : 1;
    if(inventory.mode==='survival' && !inventory.canAccept(item,quantity))return false;
    if(inventory.mode==='survival')inventory.add(item,quantity);
    this.world.removedAnimals ||= [];
    if(!this.world.removedAnimals.includes(id))this.world.removedAnimals.push(id);
    this.group.remove(entry.mesh);this.entries.delete(id);this.onChange();
    return true;
  }
}
