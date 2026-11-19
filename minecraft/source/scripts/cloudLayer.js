import * as THREE from 'three';
import { cloudColorAtHour } from './cloudColors.js';
import { cloudCell, cloudShapeParts, cloudHorizonOpacity,
  cloudCoverOpacity, normalizeCloudStyle } from './cloudMath.js';

// A transparent ring inside the generation radius hides every cell turnover.
// Positions depend only on seed+cell, never on camera heading or current cover.
const RADIUS=7, MAX_PARTS=1450, UPDATE_MS=150;
// Rebuild only after meaningful movement/cover changes; translation with
// the wind is continuous on the GPU and needs no new matrices.
const MOVE_THRESHOLD_SQ=25, COVER_THRESHOLD=.016;
const CACHE_LIMIT=2400;
const helper=new THREE.Object3D();
const darkColor=new THREE.Color();
function cloudShader(material, faces) {
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('void main() {',
      'attribute float cloudOpacity;\nvarying float vCloudOpacity;\n'+
      (faces?'varying float vCloudShade;\n':'')+'void main() {\n'+
      'vCloudOpacity = cloudOpacity;\n'+
      (faces?'vCloudShade = normal.y > 0.5 ? 1.0 : (normal.y < -0.5 ? 0.69 : 0.85);\n':''));
    shader.fragmentShader=shader.fragmentShader.replace('void main() {',
      'varying float vCloudOpacity;\n'+(faces?'varying float vCloudShade;\n':'')+
      'void main() {\n'+(faces?'':'if (vCloudOpacity < .5) discard;\n'));
    if(faces) shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.a *= vCloudOpacity;\ndiffuseColor.rgb *= vCloudShade;');
  };
  material.customProgramCacheKey=()=>`cloud-opacity-${faces?'surface':'shadow'}-v1`;
}
function createMesh(scene,layer){
  const geo=new THREE.BoxGeometry(1,1,1);
  geo.setAttribute('cloudOpacity',new THREE.InstancedBufferAttribute(
    new Float32Array(MAX_PARTS),1).setUsage(THREE.DynamicDrawUsage));
  const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,
    opacity:layer===0?.88:.7,depthWrite:false,fog:false});
  cloudShader(mat,true);
  const mesh=new THREE.InstancedMesh(geo,mat,MAX_PARTS);
  mesh.count=0;
  mesh.frustumCulled=false; // never cull an entire sky when the camera turns
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.renderOrder=-1;
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
  cloudShader(depth,false);mesh.customDepthMaterial=depth;
  scene.add(mesh);return mesh;
}
export class CloudLayer {
  constructor(scene){
    this.meshes=[createMesh(scene,0),createMesh(scene,1)];
    this.windX=this.windZ=this.driftX=this.driftZ=0;
    this.lastBuild=-Infinity;this.currentWorld='';this.currentStyle='';
    this.tint=new THREE.Color();
    this.lastCover=NaN;this.lastPositionX=NaN;this.lastPositionZ=NaN;
    this.lastSize=NaN;
    this.cellCache=new Map();
  }
  update(clock,position,world,weather,dt,active,now=0){
    const style=normalizeCloudStyle(world.cloudStyle);
    const key=`${world.params.seed}/${world.type}`;
    if(key!==this.currentWorld){
      this.currentWorld=key;this.driftX=this.driftZ=this.windX=this.windZ=0;
      this.lastBuild=-Infinity;
      this.cellCache.clear();this.lastCover=NaN;
    }
    if(style!==this.currentStyle){this.currentStyle=style;this.lastBuild=-Infinity;this.cellCache.clear();}
    if(active){
      const step=Math.min(Math.max(0,dt),.12);
      this.driftX+=this.windX*step;this.driftZ+=this.windZ*step;
      const a=Math.min(1,step*.35);
      this.windX+=(weather.windX-this.windX)*a;
      this.windZ+=(weather.windZ-this.windZ)*a;
    }
    const hour=clock.hour??clock.timeMs/1200000*24;
    const color=this.tint.setHex(cloudColorAtHour(hour,world.type));
    darkColor.setHex(world.type==='lava'?0x373033:0x434d61);
    color.lerp(darkColor,Math.min(.6,weather.cloudCover*.24+weather.storm*.36));
    const size=Math.max(18,Math.min(80,world.params.clouds.scale||30));
    const density=Math.max(.12,Math.min(1.8,(world.params.clouds.density??.3)/.3));
    const cover=Math.max(.015,Math.min(.99,weather.cloudCover*density));
    for(let layer=0;layer<2;layer++){
      const mesh=this.meshes[layer], drift=layer===0?.65:1.25;
      mesh.position.set(this.driftX*drift,0,this.driftZ*drift);
      mesh.visible=style==='advanced'||layer===0;
      mesh.material.color.copy(color);
      mesh.material.opacity=(layer===0?.88:.7)*(1-weather.storm*.08);
      mesh.castShadow=style==='advanced'&&layer===0&&world.weatherEnabled&&
        weather.cloudCover>.18&&weather.cloudCover<.86;
    }
    const dx=position.x-this.lastPositionX,dz=position.z-this.lastPositionZ;
    const rebuildRequired=now-this.lastBuild>=UPDATE_MS && (
      !Number.isFinite(this.lastBuild) || dx*dx+dz*dz>=MOVE_THRESHOLD_SQ ||
      Math.abs(cover-this.lastCover)>=COVER_THRESHOLD || size!==this.lastSize
    );
    if(!rebuildRequired)return;
    this.lastBuild=now;
    this.lastCover=cover;this.lastPositionX=position.x;this.lastPositionZ=position.z;
    if(size!==this.lastSize){this.cellCache.clear();this.lastSize=size;}
    for(let layer=0;layer<2;layer++){
      const mesh=this.meshes[layer];
      if(!mesh.visible){mesh.count=0;continue;}
      const drift=layer===0?.65:1.25;
      this.rebuild(layer,world.params.seed,position.x-this.driftX*drift,
        position.z-this.driftZ*drift,size,cover,style);
    }
  }
  rebuild(layer,seed,x,z,size,cover,style){
    const mesh=this.meshes[layer];
    const alpha=mesh.geometry.getAttribute('cloudOpacity');
    const cx=Math.floor(x/size),cz=Math.floor(z/size);
    const end=Math.min((RADIUS-.4)*size,315), start=end-Math.max(2.15*size,65);
    let count=0;
    for(let dx=-RADIUS;dx<=RADIUS&&count<MAX_PARTS;dx++){
      for(let dz=-RADIUS;dz<=RADIUS&&count<MAX_PARTS;dz++){
        const cacheKey=`${layer}:${cx+dx}:${cz+dz}`;
        let cached=this.cellCache.get(cacheKey);
        if(!cached){
          const cell=cloudCell(seed,cx+dx,cz+dz,layer,size);
          cached={cell,parts:cloudShapeParts(cell,style)};
          if(this.cellCache.size>=CACHE_LIMIT)this.cellCache.clear();
          this.cellCache.set(cacheKey,cached);
        }
        const c=cached.cell;
        const edge=cloudHorizonOpacity(Math.hypot(c.x-x,c.z-z),start,end);
        if(edge<=0)continue;
        const weatherAlpha=cloudCoverOpacity(c.chance,cover);
        if(weatherAlpha<=.002)continue;
        for(const [ox,oy,oz,sx,sy,sz] of cached.parts){
          if(count>=MAX_PARTS)break;
          helper.position.set(c.x+ox,c.y+oy,c.z+oz);
          helper.scale.set(sx,sy,sz);
          helper.rotation.set(0,0,0);helper.updateMatrix();
          mesh.setMatrixAt(count,helper.matrix);
          alpha.setX(count,edge*weatherAlpha);
          count++;
        }
      }
    }
    mesh.count=count;
    mesh.instanceMatrix.needsUpdate=true;
    alpha.needsUpdate=true;
  }
  dispose(scene){for(const mesh of this.meshes){
    scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();
    mesh.customDepthMaterial.dispose();
  }}
}
