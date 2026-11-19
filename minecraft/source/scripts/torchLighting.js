import * as THREE from 'three';

// Only light the closest player-placed torches. Never allocate a PointLight
// for every torch in every loaded chunk: large buildings must remain playable.
export class TorchLighting {
  constructor(scene,world,maxLights=8) {
    this.world=world;
    this.pool=Array.from({length:maxLights},()=>{
      const light=new THREE.PointLight(0xffbd65,1.55,11,2);
      light.visible=false;
      light.castShadow=false;
      scene.add(light);
      return light;
    });
    this.nextUpdate=0;
  }
  update(position,now=performance.now()) {
    if(now<this.nextUpdate)return;
    this.nextUpdate=now+500;
    const nearest=[];
    const matrix=new THREE.Matrix4();
    const point=new THREE.Vector3();
    for(const chunk of this.world.children){
      const mesh=chunk.children.find(child=>child.name==='21');
      if(!mesh?.isInstancedMesh || !mesh.count)continue;
      for(let index=0;index<mesh.count;index++){
        mesh.getMatrixAt(index,matrix);
        point.setFromMatrixPosition(matrix).add(chunk.position);
        const distance2=position.distanceToSquared(point);
        if(distance2>14*14)continue;
        nearest.push({distance2,x:point.x,y:point.y+.30,z:point.z});
      }
    }
    nearest.sort((a,b)=>a.distance2-b.distance2);
    this.pool.forEach((light,index)=>{
      const target=nearest[index];
      light.visible=!!target;
      if(target)light.position.set(target.x,target.y,target.z);
    });
  }
}
