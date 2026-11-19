import * as THREE from 'three';
import { waterAtPoint, surfaceWater } from './waterEnvironment.js';
import { exposedLiquidIntervals, exposedLiquidTop, mergeLiquidTiles } from './liquidShell.js';
import { applyWaterMotion } from './waterVisuals.js';

export function immersionTarget(depth) {
  const d=Math.max(0,depth);
  return {near:.12,far:Math.max(5,19-d*.7),darkness:Math.min(.62,.13+d*.025)};
}

// Restore the exact atmospheric state BEFORE lighting/fog run each frame.
// No above-water preference, movement, speed, or camera FOV is modified.
export class UnderwaterVision {
  constructor(scene,renderer,world,sky=[]){
    this.scene=scene;this.renderer=renderer;this.world=world;this.sky=sky;
    this.saved=null;this.color=new THREE.Color();
  }
  restore(){
    if(!this.saved)return;
    const s=this.saved;
    this.scene.fog.near=s.near;this.scene.fog.far=s.far;
    this.scene.fog.color.copy(s.color);this.renderer.setClearColor(s.clear,s.alpha);
    for(const [object,visible] of s.visibility)object.visible=visible;
    this.saved=null;
  }
  update(camera){
    const water=waterAtPoint(this.world,camera.position);
    if(!water||!this.scene.fog)return;
    const fog=this.scene.fog;
    this.saved={near:fog.near,far:fog.far,color:fog.color.clone(),
      clear:this.renderer.getClearColor(new THREE.Color()),alpha:this.renderer.getClearAlpha(),
      visibility:this.sky.filter(Boolean).map(object=>[object,object.visible])};
    const target=immersionTarget(water.depth);
    const brightness=Math.max(.16,Math.min(1,this.saved.color.r+this.saved.color.g+this.saved.color.b));
    this.color.setHex(water.kind==='underground'?0x164954:0x236d80);
    this.color.multiplyScalar(brightness*(1-target.darkness));
    // A few centimetres blend the interface without flickering or retaining
    // a tint after leaving the water.
    const blend=Math.min(1,water.depth/.10);
    fog.near=this.saved.near+(target.near-this.saved.near)*blend;
    fog.far=this.saved.far+(target.far-this.saved.far)*blend;
    fog.color.lerp(this.color,blend);
    this.renderer.setClearColor(fog.color);
    for(const object of this.sky)if(object)object.visible=false;
  }
}

function quad(positions,a,b,c,d){positions.push(...a,...b,...c,...a,...c,...d);}
export class EnvironmentVisuals {
  constructor(scene,world){
    this.world=world;this.group=new THREE.Group();scene.add(this.group);
    this.waterMaterial=applyWaterMotion(new THREE.MeshLambertMaterial({color:0x377d8b,
      transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide}),'river');
    this.waterMaterial.forceSinglePass=true;
    this.snowMaterial=new THREE.MeshLambertMaterial({color:0xf2f5fa,side:THREE.DoubleSide});
    this.meshes=[];this.revision=-1;this.elapsed=0;
  }
  rebuild(model){
    for(const mesh of this.meshes){this.group.remove(mesh);mesh.geometry.dispose();}
    this.meshes=[];
    const water=[],snow=[],tops=[];
    const volumesAt=(x,z)=>{
      const values=[];
      for(const c of model.columns.get(`${x},${z}`)?.cavities??[]){
        const v=model.water.get(`${x},${z},${c.bottom}`)||0;
        if(v>.025)values.push({bottom:c.bottom,top:Math.min(c.roof,c.bottom+v)});
      }
      const surface=surfaceWater(this.world,x,z);if(surface)values.push(surface);
      return values;
    };
    for(const column of model.columns.values()){
      if(!column.chunk.loaded||this.world.getChunk(Math.floor(column.x/32),Math.floor(column.z/32))!==column.chunk)continue;
      for(const c of column.cavities){
        const v=model.water.get(`${c.x},${c.z},${c.bottom}`)||0;
        if(v<.025)continue;
        const top=Math.min(c.roof,c.bottom+v),x=c.x,z=c.z;
        const surface=surfaceWater(this.world,x,z);
        if(surface&&surface.bottom<=c.bottom+.001&&surface.top>=top-.001)continue;
        if(top<c.roof-.001&&exposedLiquidTop(top,y=>this.world.getBlockId(x,y,z)))
          tops.push({x,z,top,kind:'river'});
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const covered=volumesAt(x+dx,z+dz);
          for(const span of exposedLiquidIntervals(c.bottom,top,covered,
            y=>this.world.getBlockId(x+dx,y,z+dz))){
            const low=span.bottom,high=span.top;
            if(dx)quad(water,[x+dx*.5,low,z-.5],[x+dx*.5,high,z-.5],[x+dx*.5,high,z+.5],[x+dx*.5,low,z+.5]);
            else quad(water,[x-.5,low,z+dz*.5],[x-.5,high,z+dz*.5],[x+.5,high,z+dz*.5],[x+.5,low,z+dz*.5]);
          }
        }
      }
    }
    for(const r of mergeLiquidTiles(tops)){
      const {x,z,top,width,depth}=r;
      quad(water,[x-.5,top,z-.5],[x-.5,top,z+depth-.5],
        [x+width-.5,top,z+depth-.5],[x+width-.5,top,z-.5]);
    }
    for(const c of model.snow.values()){
      const chunk=this.world.getChunk(Math.floor(c.x/32),Math.floor(c.z/32));
      if(!chunk?.loaded||this.world.getBlockId(c.x,c.y,c.z)===0||this.world.getBlockId(c.x,c.y+1,c.z)!==0)continue;
      const {x,z,y,depth}=c,bottom=y+.502,top=bottom+depth;
      quad(snow,[x-.5,top,z-.5],[x-.5,top,z+.5],[x+.5,top,z+.5],[x+.5,top,z-.5]);
      for(const dx of [-.5,.5])quad(snow,[x+dx,bottom,z-.5],[x+dx,top,z-.5],[x+dx,top,z+.5],[x+dx,bottom,z+.5]);
      for(const dz of [-.5,.5])quad(snow,[x-.5,bottom,z+dz],[x-.5,top,z+dz],[x+.5,top,z+dz],[x+.5,bottom,z+dz]);
    }
    for(const [positions,material,layer] of [[water,this.waterMaterial,1],[snow,this.snowMaterial,0]]){
      if(!positions.length)continue;
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,material);mesh.layers.set(layer);mesh.receiveShadow=true;
      this.group.add(mesh);this.meshes.push(mesh);
    }
  }
  update(dt){
    const model=this.world.hydrology?.environment;
    if(!model)return;
    this.group.visible=this.world.type!=='lava';
    this.elapsed+=dt;
    if(this.elapsed<.5||this.revision===model.revision)return;
    this.elapsed=0;this.revision=model.revision;this.rebuild(model);
  }
}
