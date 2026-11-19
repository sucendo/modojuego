import * as THREE from 'three';
import { MapTerrain } from './mapTerrain.js';
import { landmarkForChunk } from './landmarks.js';
import { LOD_LEVELS,lodTier,sectorCoord,weatherHorizonRadius } from './lodHorizon.js';
import {hazeTarget,hazeTintHex,normalizeHazeMode} from './horizonHaze.js';

/** Visual terrain beyond the physical chunks.  v10.5 has two progressively
 * coarser LOD bands (4-block and 8-block samples), each combined into sector
 * meshes. Chunks, physics, world saves and player edits remain untouched.
 * Expensive height sampling is spread across multiple animation frames.
 */
export class DistantTerrain extends THREE.Group {
  constructor(world){
    super();
    this.world=world;
    this.map=new MapTerrain(world);
    this.sectors=new Map();
    this.retiring=new Set();
    this.jobs=[];
    this.lastSignature='';this.lastScan=0;
    this.epoch=world.terrainEpoch??0;
    this.fadeRadius=world.getHorizonDistance();
    this.fadeCenter={value:new THREE.Vector2()};
    this.fadeRange={value:this.fadeRadius*world.chunkSize.width};
    // Shared shader uniforms: all LOD sectors use the same atmospheric state.
    this.hazeMode='auto';
    const initialHaze=hazeTarget(this.fadeRadius,24,world.params.terrain.waterOffset,{},this.hazeMode);
    this.hazeRange={value:new THREE.Vector2(initialHaze.near,initialHaze.far)};
    this.hazeStrength={value:initialHaze.strength};
    this.hazeColor={value:new THREE.Color(0x80a0e0)};
    this.hazeTint=new THREE.Color();
    // A base material is also used by regression tests; each live sector gets
    // its own tiny uniform so it can fade in/out without changing geometry.
    this.material=this.makeMaterial({value:1},'medium');
    this.activeRadius=world.getHorizonDistance();
    this.sectorsBuilt=0;
    this.lastBuildMs=0;
    this.totalBuildMs=0;
    this.lastSamples=0;
  }

  setHazeMode(mode){this.hazeMode=normalizeHazeMode(mode);}

  updateHaze(position,weather,radius,dt){
    const target=hazeTarget(radius,position.y??24,
      this.world.params.terrain.waterOffset,weather,this.hazeMode);
    const alpha=1-Math.exp(-Math.min(.25,Math.max(0,dt))*3.2);
    this.hazeRange.value.x+=(target.near-this.hazeRange.value.x)*alpha;
    this.hazeRange.value.y+=(target.far-this.hazeRange.value.y)*alpha;
    this.hazeStrength.value+=(target.strength-this.hazeStrength.value)*alpha;
    // Reuse the actual sky/fog colour, which already changes with the sun,
    // moon, cloud cover and lightning. The biome tint remains deliberately low.
    const sky=this.parent?.fog?.color;
    if(sky){
      const tint=this.hazeTint.setHex(hazeTintHex(this.world.type));
      const daylight=Math.min(1,Math.max(0,sky.r*.25+sky.g*.6+sky.b*.15));
      const weatherTint=Math.min(.12,Math.max(weather.dust||0,weather.ash||0)*.12);
      tint.lerp(sky,1-Math.min(.25,.06+daylight*.14+weatherTint));
      this.hazeColor.value.lerp(tint,alpha);
    }
  }

  makeMaterial(reveal,level='far'){
    const material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,fog:true});
    material.onBeforeCompile=shader=>{
      shader.uniforms.lodCenter=this.fadeCenter;
      shader.uniforms.lodHorizon=this.fadeRange;
      shader.uniforms.lodReveal=reveal;
      shader.uniforms.lodHazeColor=this.hazeColor;
      shader.uniforms.lodHazeRange=this.hazeRange;
      shader.uniforms.lodHazeStrength=this.hazeStrength;
      shader.uniforms.lodHazeTier={value:level==='far'?1:.36};
      shader.vertexShader='varying vec2 lodWorldXZ;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n lodWorldXZ=(modelMatrix * vec4(position,1.0)).xz;');
      shader.fragmentShader='varying vec2 lodWorldXZ; uniform vec2 lodCenter; uniform float lodHorizon; uniform float lodReveal;\n'+
        'uniform vec3 lodHazeColor; uniform vec2 lodHazeRange; uniform float lodHazeStrength; uniform float lodHazeTier;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',
        '#include <fog_fragment>\n'+
        'float lodHazeDistance=distance(lodWorldXZ,lodCenter);\n'+
        'float lodHaze=smoothstep(lodHazeRange.x,lodHazeRange.y,lodHazeDistance)*lodHazeStrength*lodHazeTier;\n'+
        'gl_FragColor.rgb=mix(gl_FragColor.rgb,lodHazeColor,clamp(lodHaze,0.0,1.0));');
      shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',
        '#include <dithering_fragment>\n'+
        'float lodDistance=max(abs(lodWorldXZ.x-lodCenter.x),abs(lodWorldXZ.y-lodCenter.y));\n'+
        'float lodVisibility=lodReveal*(1.0-smoothstep(lodHorizon-40.0,lodHorizon-8.0,lodDistance));\n'+
        'float lodDither=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);\n'+
        'if(lodDither>lodVisibility)discard;');
    };
    material.customProgramCacheKey=()=>`minecraftDistantLod-v1051-${level}`;
    return material;
  }
  release(entry){
    this.remove(entry.mesh);
    entry.mesh.geometry.dispose();entry.mesh.material.dispose();
    this.retiring.delete(entry);
  }
  retire(entry){if(!entry||entry.retiring)return;entry.retiring=true;this.retiring.add(entry);}
  reset(){
    for(const entry of this.sectors.values())this.release(entry);
    for(const entry of [...this.retiring])this.release(entry);
    this.sectors.clear();this.jobs=[];this.lastSignature='';
    this.epoch=this.world.terrainEpoch??0;
    this.map.refresh();
  }
  dispose(){this.reset();this.material.dispose();}
  surfaceColor(sample){
    const {height,biome,water}=sample,world=this.world;
    if(world.type==='lava')return water?[.95,.30,.06]:[.29,.27,.29];
    if(water)return sample.waterKind==='frozen'?[.66,.83,.89]:sample.waterKind==='oasis'?[.23,.66,.61]:world.type==='ocean'?[.12,.43,.71]:[.18,.49,.66];
    if(sample.waterBank)return world.type==='snow'?[.61,.69,.71]:[.75,.66,.43];
    if(height<=world.params.terrain.waterOffset+1)return [.75,.66,.43];
    const base=biome==='Desert'?[.74,.63,.38]:biome==='Tundra'?[.78,.83,.88]:
      biome==='Jungle'?[.13,.39,.18]:[.27,.52,.27];
    const factor=Math.max(.85,Math.min(1.18,1+(height-24)*.004));
    return base.map(v=>Math.min(1,v*factor));
  }

  /** Cheap cubic silhouettes of foliage and persistent points of interest.
   * They are merged into the SAME sector mesh; no additional draw calls or
   * collision bodies. Tree positions are visual approximations, not saved data.
   */
  appendBox(builder,x,y,z,dx,dy,dz,color){
    const {verts,colors,indices}=builder;
    const x0=x-dx/2,x1=x+dx/2,y0=y,y1=y+dy,z0=z-dz/2,z1=z+dz/2;
    const faces=[
      [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],.75],
      [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],.8],
      [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],.68],
      [[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],.82],
      [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],1],
      [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],.56]
    ];
    for(const face of faces){
      const start=verts.length/3,shade=face[4];
      for(let i=0;i<4;i++){
        verts.push(...face[i]);
        colors.push(...color.map(value=>value*shade));
      }
      indices.push(start,start+1,start+2,start,start+2,start+3);
    }
  }
  appendMediumDetails(builder,cx,cz){
    if(builder.level!=='medium')return;
    const width=this.world.chunkSize.width;
    const seed=Math.trunc(this.world.params.seed)||0;
    const hash=(v)=>{let x=Math.imul(v^seed,0x45d9f3b);x^=x>>>16;return x>>>0;};
    const waterOffset=this.world.params.terrain.waterOffset;
    for(let i=0;i<2;i++){
      const h=hash(Math.imul(cx+31,73856093)^Math.imul(cz+71,19349663)^Math.imul(i+1,83492791));
      const wx=cx*width+4+(h%24),wz=cz*width+4+((h>>>9)%24);
      const sample=this.map.sample(wx,wz);
      if(sample.water||sample.height<=waterOffset+1||sample.height>=this.world.chunkSize.height-11||this.world.type==='lava')continue;
      if(sample.biome==='Desert'){
        if((h&3)===0)this.appendBox(builder,wx-.5,sample.height+.51,wz-.5,1,2.5,1,[.17,.42,.20]);
        continue;
      }
      if(sample.biome==='Tundra'&&this.world.type!=='snow')continue;
      const isJungle=sample.biome==='Jungle';
      const snowy=sample.biome==='Tundra';
      const treeHeight=isJungle?6:4.5;
      this.appendBox(builder,wx-.5,sample.height+.51,wz-.5,.8,treeHeight,.8,[.36,.23,.12]);
      this.appendBox(builder,wx-.5,sample.height+.51+treeHeight-1,wz-.5,isJungle?4.5:3.6,3.1,isJungle?4.5:3.6,
        snowy?[.77,.83,.82]:isJungle?[.11,.35,.16]:[.21,.46,.19]);
    }
    if(!this.world.landmarksEnabled)return;
    const poi=landmarkForChunk(seed,cx,cz);
    if(!poi)return;
    const sample=this.map.sample(poi.x,poi.z);
    if(sample.water||sample.height<=waterOffset+1||sample.height>=this.world.chunkSize.height-9)return;
    const x=poi.x-.5,z=poi.z-.5,y=sample.height+.51;
    const grey=[.54,.55,.53],wood=[.45,.30,.17];
    if(poi.type==='tower'){
      for(const dx of [-2,2])for(const dz of [-2,2])this.appendBox(builder,x+dx,y,z+dz,.9,5,.9,wood);
      this.appendBox(builder,x,y+5,z,5,1,5,wood);
    }else if(poi.type==='ruin'){
      for(const dx of [-3,3])for(const dz of [-3,3])this.appendBox(builder,x+dx,y,z+dz,.95,3,.95,grey);
    }else this.appendBox(builder,x,y,z,5,1.5,5,wood);
  }

  newBuilder(level){return {level,verts:[],colors:[],indices:[],tiles:0,samples:0};}
  /** Append only one 32x32 tile at a time; no 80-level voxel generation. */
  appendTile(builder,{cx,cz}){
    const width=this.world.chunkSize.width;
    const step=LOD_LEVELS[builder.level].step;
    const resolution=width/step;
    const {verts,colors,indices}=builder;
    const x0=cx*width,z0=cz*width;
    const base=verts.length/3;
    const heights=new Array((resolution+1)*(resolution+1));
    const tileColors=new Array(heights.length);
    for(let z=0;z<=resolution;z++)for(let x=0;x<=resolution;x++){
      const wx=x0+x*step,wz=z0+z*step;
      const sample=this.map.sample(wx,wz);
      const height=sample.stableWater?sample.height+1.5:
        sample.water?Math.max(sample.height+.5,(sample.waterY??this.world.params.terrain.waterOffset)+.45):sample.height+.51;
      const i=z*(resolution+1)+x;
      heights[i]=height;tileColors[i]=this.surfaceColor(sample);
      verts.push(wx-.5,height,wz-.5);
      colors.push(...tileColors[i]);
    }
    for(let z=0;z<resolution;z++)for(let x=0;x<resolution;x++){
      const a=base+z*(resolution+1)+x,b=a+1,c=a+resolution+1,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
    // Small skirts hide T-junctions where 4-block and 8-block sampling meet,
    // particularly when steep mountain slopes cross chunk boundaries.
    const skirt=(x1,z1,x2,z2,h1,h2,c1,c2)=>{
      const a=verts.length/3,drop=2.25;
      verts.push(x1,h1,z1,x2,h2,z2,x1,h1-drop,z1,x2,h2-drop,z2);
      colors.push(...c1,...c2,...c1.map(v=>v*.74),...c2.map(v=>v*.74));
      indices.push(a,a+2,a+1,a+1,a+2,a+3);
    };
    for(let i=0;i<resolution;i++){
      const row=resolution+1;
      const t=i,b=i+1,l=i*row,r=(i+1)*row;
      skirt(x0+i*step-.5,z0-.5,x0+(i+1)*step-.5,z0-.5,heights[t],heights[b],tileColors[t],tileColors[b]);
      const zrow=resolution*row;
      skirt(x0+i*step-.5,z0+width-.5,x0+(i+1)*step-.5,z0+width-.5,heights[zrow+t],heights[zrow+b],tileColors[zrow+t],tileColors[zrow+b]);
      skirt(x0-.5,z0+i*step-.5,x0-.5,z0+(i+1)*step-.5,heights[l],heights[r],tileColors[l],tileColors[r]);
      const xcol=resolution;
      skirt(x0+width-.5,z0+i*step-.5,x0+width-.5,z0+(i+1)*step-.5,heights[l+xcol],heights[r+xcol],tileColors[l+xcol],tileColors[r+xcol]);
    }
    this.appendMediumDetails(builder,cx,cz);
    builder.tiles++;builder.samples+=heights.length;
  }
  finalizeBuilder(builder){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(builder.verts,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(builder.colors,3));
    geometry.setIndex(builder.indices);
    geometry.computeVertexNormals();geometry.computeBoundingSphere();
    return geometry;
  }
  /** Useful for tests and one-off terrain rebuilds; runtime uses batching. */
  buildSector(cells,level='medium'){
    const builder=this.newBuilder(level);
    for(const cell of cells)this.appendTile(builder,cell);
    return this.finalizeBuilder(builder);
  }
  scan(cx,cz,near,far){
    const regions=new Map();
    for(let x=cx-far;x<=cx+far;x++)for(let z=cz-far;z<=cz+far;z++){
      const full=Math.max(Math.abs(x-cx),Math.abs(z-cz))<=near?this.world.getChunk(x,z):null;
      const level=lodTier(x,z,cx,cz,near,far,full);
      if(!level)continue;
      const size=LOD_LEVELS[level].sectorSize;
      const sx=sectorCoord(x,size),sz=sectorCoord(z,size);
      const key=`${level}:${sx},${sz}`;
      if(!regions.has(key))regions.set(key,{key,level,sx,sz,size,cells:[]});
      regions.get(key).cells.push({cx:x,cz:z});
    }
    const wanted=new Set(regions.keys());
    for(const [key,entry] of this.sectors){
      if(wanted.has(key))continue;
      this.retire(entry);this.sectors.delete(key);
    }
    const pending=new Map(this.jobs.map(job=>[job.key,job]));
    const nextJobs=[];
    for(const [key,region] of regions){
      const signature=region.cells.map(cell=>`${cell.cx},${cell.cz}`).join(';');
      const previous=this.sectors.get(key);
      if(previous?.signature===signature)continue;
      const queued=pending.get(key);
      nextJobs.push(queued?.signature===signature?queued:{...region,signature,progress:0,builder:null});
    }
    this.jobs=nextJobs;
    this.jobs.sort((a,b)=>{
      // Work closest to the player first, medium before the far 9–16 ring.
      const da=Math.max(Math.abs(a.sx*a.size+a.size*.5-cx),Math.abs(a.sz*a.size+a.size*.5-cz));
      const db=Math.max(Math.abs(b.sx*b.size+b.size*.5-cx),Math.abs(b.sz*b.size+b.size*.5-cz));
      return da-db;
    });
  }
  tickReveals(dt){
    const step=Math.min(.08,Math.max(0,dt))/.65;
    for(const entry of this.sectors.values())entry.reveal.value=Math.min(1,entry.reveal.value+step);
    for(const entry of [...this.retiring]){
      entry.reveal.value=Math.max(0,entry.reveal.value-step*1.5);
      if(entry.reveal.value<=0)this.release(entry);
    }
  }
  update(position,dt=0,weather={}){
    const world=this.world,width=world.chunkSize.width;
    const cx=Math.floor(position.x/width),cz=Math.floor(position.z/width);
    const near=world.getRenderDistance();
    const severity=Math.max(weather.storm||0,weather.snow||0,weather.rain||0,weather.dust||0,weather.ash||0);
    const far=weatherHorizonRadius(world.getHorizonDistance(),severity);
    this.activeRadius=far;
    this.fadeCenter.value.set(position.x,position.z);
    this.fadeRadius+=(far-this.fadeRadius)*(1-Math.exp(-Math.min(.1,Math.max(0,dt))*1.8));
    this.fadeRange.value=this.fadeRadius*width;
    this.updateHaze(position,weather,far,dt);
    if(this.epoch!==(world.terrainEpoch??0))this.reset();
    this.tickReveals(dt);
    const now=performance.now();
    const signature=`${cx},${cz}:${near}:${far}:${world.generationCount}:${world.chunkIndex.size}`;
    if(signature!==this.lastSignature||now-this.lastScan>620){
      this.lastSignature=signature;this.lastScan=now;
      this.scan(cx,cz,near,Math.max(far,Math.ceil(this.fadeRadius)));
    }
    if(!this.jobs.length)return;
    // Bound work per frame, including when 16x16-sector rings are first built.
    // The same heightfield tiles are much cheaper than generating voxel chunks.
    const job=this.jobs[0];
    if(!job.builder)job.builder=this.newBuilder(job.level);
    const start=performance.now();
    const maxTiles=job.level==='medium'?4:8;
    let count=0;
    while(job.progress<job.cells.length&&count<maxTiles){
      this.appendTile(job.builder,job.cells[job.progress++]);count++;
      if(performance.now()-start>3.5)break;
    }
    this.lastBuildMs=performance.now()-start;
    this.totalBuildMs+=this.lastBuildMs;
    this.lastSamples=job.builder.samples;
    if(job.progress<job.cells.length)return;
    this.jobs.shift();
    const geometry=this.finalizeBuilder(job.builder);
    const previous=this.sectors.get(job.key);
    if(previous)this.retire(previous);
    const reveal={value:0};
    const mesh=new THREE.Mesh(geometry,this.makeMaterial(reveal,job.level));
    mesh.name=`Terrain LOD ${job.level}`;
    mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=true;
    this.add(mesh);
    this.sectors.set(job.key,{mesh,reveal,signature:job.signature,level:job.level,retiring:false});
    this.sectorsBuilt++;
  }
  get triangles(){
    let count=0;for(const entry of this.sectors.values())count+=entry.mesh.geometry.index.count/3;
    return count;
  }
  get tiers(){
    let medium=0,far=0;
    for(const entry of this.sectors.values())entry.level==='medium'?medium++:far++;
    return {medium,far};
  }
  get pendingTiles(){return this.jobs.reduce((n,j)=>n+(j.cells.length-j.progress),0);}
}
