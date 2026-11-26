import { continuousCorner, connectedWater, WaterTransitions, waterTime } from './continuousWater.js';
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
      transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide}),'river',false,true);
    this.waterMaterial.forceSinglePass=true;
    this.snowMaterial=new THREE.MeshLambertMaterial({color:0xf2f5fa,side:THREE.DoubleSide});
    this.meshes=[];this.revision=-1;this.elapsed=0;
    this.transitions=new WaterTransitions();this.previousWater=new Map();
  }
  rebuild(model){
    for(const mesh of this.meshes){this.group.remove(mesh);mesh.geometry.dispose();}
    this.meshes=[];
    const water=[],snow=[],tops=[],motion=[];
    const now=waterTime(),timeline=this.transitions;timeline.begin(this);
    const previous=this.previousWater,nextPresented=new Map();
    const pushWater=(a,b,c,d,meta)=>{
      quad(water,a,b,c,d);
      for(const i of [0,1,2,0,2,3])motion.push(meta[i]);
    };
    const volumesAt=(x,z)=>{
      const values=[];
      for(const c of model.columns.get(`${x},${z}`)?.cavities??[]){
        const v=model.water.get(`${x},${z},${c.bottom}`)||0;
        if(v>(c.finite?.001:.025))values.push({bottom:c.bottom,top:Math.min(c.roof,c.bottom+v),kind:'river',open:c.bottom+v<c.roof-.001});
      }
      const surface=surfaceWater(this.world,x,z);if(surface)values.push({...surface,kind:'river'});
      return values;
    };
    const cornersFor=c=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz])=>
      continuousCorner(c.x,c.z,sx,sz,(x,z)=>{
        const candidates=volumesAt(x,z).filter(v=>Math.min(v.top,c.top)>Math.max(v.bottom,c.bottom)+.001);
        if(x===c.x&&z===c.z)return {...c,kind:'river',open:c.top<c.roof-.001};
        return candidates.sort((a,b)=>Math.abs(a.top-c.top)-Math.abs(b.top-c.top))[0]||null;
      }));
    const metadata=(c,corner,y,normal=true)=>({key:'cave:'+corner.key,from:previous.has(c.id)?y:c.bottom,
      fixed:!Number.isFinite(corner.top)||Math.abs(y-corner.top)>1e-6,
      alphaKey:'cave-cell:'+c.id,alpha:c.drying?0:1,fromAlpha:previous.has(c.id)?1:0,
      normal:normal?corner.normal:null});
    for(const column of model.columns.values()){
      if(!column.chunk.loaded||this.world.getChunk(Math.floor(column.x/32),Math.floor(column.z/32))!==column.chunk)continue;
      for(const c of column.cavities){
        const id=`${c.x},${c.z},${c.bottom}`;
        let v=model.water.get(id)||0,drying=false;
        const old=previous.get(id);
        if(v<(c.finite?.001:.025)){
          if(!old||now-(old.dryStart??now)>.32)continue;
          v=c.finite?.0011:.026;drying=true;
        }
        nextPresented.set(id,{top:c.bottom+v,dryStart:drying?(old.dryStart??now):undefined});
        const top=Math.min(c.roof,c.bottom+v),x=c.x,z=c.z;
        const draw={...c,id,top,drying},cs=cornersFor(draw);
        const surface=surfaceWater(this.world,x,z);
        if(surface&&surface.bottom<=c.bottom+.001&&surface.top>=top-.001)continue;
        if(top<c.roof-.001&&exposedLiquidTop(top,y=>this.world.getBlockId(x,y,z)))
          tops.push({x,z,top,kind:'river',corners:cs,cell:draw});
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const covered=volumesAt(x+dx,z+dz);
          if(covered.some(n=>connectedWater({...draw,kind:'river'},n)))continue;
          for(const span of exposedLiquidIntervals(c.bottom,top,covered,
            y=>this.world.getBlockId(x+dx,y,z+dz))){
            const low=span.bottom,high=span.top;
            const edge=dx>0?[cs[1],cs[2]]:dx<0?[cs[0],cs[3]]:dz>0?[cs[3],cs[2]]:[cs[0],cs[1]];
            const ha=Math.max(low,Math.min(high,edge[0].top)),hb=Math.max(low,Math.min(high,edge[1].top));
            const fixed={key:`bottom:${id}:${low}`,top:low};
            const meta=[metadata(draw,fixed,low,false),metadata(draw,edge[0],ha,false),
              metadata(draw,edge[1],hb,false),metadata(draw,fixed,low,false)];
            // A bottom vertex is a physical floor, not a free surface.
            meta[0].fixed=true;meta[3].fixed=true;
            if(dx)pushWater([x+dx*.5,low,z-.5],[x+dx*.5,ha,z-.5],[x+dx*.5,hb,z+.5],[x+dx*.5,low,z+.5],meta);
            else pushWater([x-.5,low,z+dz*.5],[x-.5,ha,z+dz*.5],[x+.5,hb,z+dz*.5],[x+.5,low,z+dz*.5],meta);
          }
        }
      }
    }
    const byCell=new Map(tops.map(t=>[`${t.x},${t.z},${Math.round(t.top*10000)}`,t]));
    const flat=tops.filter(t=>t.corners.every(c=>Math.abs(c.top-t.top)<1e-7)&&
      (!previous.size||t.corners.every(c=>{
        const r=timeline.records.get('cave:'+c.key);
        return !r||r.to===t.top&&now>=r.start+r.duration;
      })));
    const mergedCells=new Set(flat.map(t=>`${t.x},${t.z},${Math.round(t.top*10000)}`));
    for(const r of mergeLiquidTiles(flat)){
      const {x,z,top,width,depth}=r;
      const locations=[[x,z,0],[x,z+depth-1,3],[x+width-1,z+depth-1,2],[x+width-1,z,1]];
      const meta=locations.map(([cx,cz,k])=>{const t=byCell.get(`${cx},${cz},${Math.round(top*10000)}`);return metadata(t.cell,t.corners[k],top);});
      pushWater([x-.5,top,z-.5],[x-.5,top,z+depth-.5],
        [x+width-.5,top,z+depth-.5],[x+width-.5,top,z-.5],meta);
    }
    for(const t of tops){
      if(mergedCells.has(`${t.x},${t.z},${Math.round(t.top*10000)}`))continue;
      const {x,z,corners:cs,cell}=t;
      pushWater([x-.5,cs[0].top,z-.5],[x-.5,cs[3].top,z+.5],
        [x+.5,cs[2].top,z+.5],[x+.5,cs[1].top,z-.5],
        [0,3,2,1].map(k=>metadata(cell,cs[k],cs[k].top)));
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
      if(layer===1){
        const heights=[],alphas=[];
        for(let i=0;i<motion.length;i++){
          const m=motion[i],y=positions[i*3+1];
          const h=m.fixed?{from:y,start:now,duration:0}:timeline.target(m.key,y,now,m.from);
          const a=timeline.target(m.alphaKey,m.alpha,now,m.fromAlpha);
          heights.push(h.from,h.start,h.duration);alphas.push(a.from,a.to,a.start,a.duration);
          if(m.normal)geometry.attributes.normal.setXYZ(i,...m.normal);
        }
        geometry.setAttribute('waterHeightMotion',new THREE.Float32BufferAttribute(heights,3));
        geometry.setAttribute('waterAlphaMotion',new THREE.Float32BufferAttribute(alphas,4));
        geometry.computeBoundingBox();
        for(let i=0;i<heights.length;i+=3){
          geometry.boundingBox.min.y=Math.min(geometry.boundingBox.min.y,heights[i]);
          geometry.boundingBox.max.y=Math.max(geometry.boundingBox.max.y,heights[i]);
        }
        geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
      }
      const mesh=new THREE.Mesh(geometry,material);mesh.layers.set(layer);mesh.receiveShadow=true;
      this.group.add(mesh);this.meshes.push(mesh);
    }
    timeline.end();this.previousWater=nextPresented;
  }
  update(dt){
    const model=this.world.hydrology?.environment;
    if(!model)return;
    this.group.visible=this.world.type!=='lava';
    this.elapsed+=dt;
    if(this.elapsed<.15||this.revision===model.revision)return;
    this.elapsed=0;this.revision=model.revision;this.rebuild(model);
  }
}
