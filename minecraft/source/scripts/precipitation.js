import { SkyExposure } from './skyExposure.js';
import * as THREE from 'three';

const RAIN_COUNT=280,SNOW_COUNT=215,DRIP_COUNT=9;
const seeded=(i,salt)=>{let x=Math.imul(i+salt,0x9e3779b1);x=Math.imul(x^(x>>>15),0x85ebca6b);return ((x^(x>>>13))>>>0)/4294967296;};
const wrap=(v,n)=>((v%n)+n)%n;
export class Precipitation {
  constructor(scene,world){
    this.world=world;this.seconds=0;this.checkedCover=-Infinity;this.underRoof=false;
    this.sky=new SkyExposure(world);
    this.qualityFactor=1;
    this.rainPositions=new Float32Array(RAIN_COUNT*6);
    const rainGeometry=new THREE.BufferGeometry();
    rainGeometry.setAttribute('position',new THREE.BufferAttribute(this.rainPositions,3).setUsage(THREE.DynamicDrawUsage));
    this.rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:0xa7c4e8,transparent:true,opacity:.55,depthWrite:false,fog:false}));
    this.rain.frustumCulled=false;this.rain.visible=false;scene.add(this.rain);
    this.snowPositions=new Float32Array(SNOW_COUNT*3);
    const snowGeometry=new THREE.BufferGeometry();
    snowGeometry.setAttribute('position',new THREE.BufferAttribute(this.snowPositions,3).setUsage(THREE.DynamicDrawUsage));
    this.snow=new THREE.Points(snowGeometry,new THREE.PointsMaterial({color:0xeef4ff,size:.26,sizeAttenuation:true,transparent:true,opacity:.87,depthWrite:false,fog:false}));
    this.snow.frustumCulled=false;this.snow.visible=false;scene.add(this.snow);
    // Sparse underground drips are a separate effect, never snow under rock.
    this.dripPositions=new Float32Array(DRIP_COUNT*6);
    const dripGeo=new THREE.BufferGeometry();
    dripGeo.setAttribute('position',new THREE.BufferAttribute(this.dripPositions,3).setUsage(THREE.DynamicDrawUsage));
    this.drips=new THREE.LineSegments(dripGeo,new THREE.LineBasicMaterial({color:0x8fbce0,transparent:true,opacity:.52,depthWrite:false,fog:false}));
    this.drips.frustumCulled=false;this.drips.visible=false;scene.add(this.drips);
  }
  setQualityFactor(factor){this.qualityFactor=Math.max(.25,Math.min(1,factor));}
  resetCover(){
    this.sky.clear();this.checkedCover=-Infinity;this.underRoof=false;
  }
  checkRoof(position,now){
    if(now-this.checkedCover<350)return;
    this.checkedCover=now;
    // Must check up to the ACTUAL world ceiling (32 for legacy, 80 for v10).
    this.underRoof=!this.sky.skyVisible(position.x,position.y+1,position.z,now);
  }
  update(weather,position,dt,active,now,enabled=true){
    const rain=enabled?weather.rain:0;
    const flakes=enabled?Math.max(weather.snow,weather.ash,weather.dust):0;
    if(active)this.seconds+=Math.min(dt,.12);
    this.checkRoof(position,now);
    // Individual particle columns are tested against the terrain/roof.
    // A cave entrance may still show snowfall OUTSIDE without snow indoors.
    const shelter=this.underRoof?.2:1;
    this.rain.visible=rain>.06;
    this.snow.visible=flakes>.06;
    if(this.rain.visible){
      const amount=rain*shelter,points=this.rainPositions,elapsed=this.seconds;
      const windX=weather.windX,windZ=weather.windZ;
      const rainCount=Math.max(1,Math.floor(RAIN_COUNT*this.qualityFactor));
      this.rain.geometry.setDrawRange(0,rainCount*2);
      for(let i=0;i<rainCount;i++){
        const bx=(seeded(i,1)-.5)*33,bz=(seeded(i,3)-.5)*33;
        const travel=wrap(elapsed*(14+seeded(i,5)*6)+seeded(i,7)*22,22);
        const p=i*6,drift=22-travel;
        points[p]=bx+windX*drift*.18; points[p+1]=15-travel;
        points[p+2]=bz+windZ*drift*.18;
        points[p+3]=points[p]-.07*windX;
        points[p+4]=points[p+1]-.52;
        points[p+5]=points[p+2]-.07*windZ;
        const wx=position.x+points[p],wz=position.z+points[p+2];
        if(!this.sky.skyVisible(wx,position.y+points[p+4],wz,now)){
          points[p+1]=-10000;points[p+4]=-10000;
        }
      }
      this.rain.geometry.attributes.position.needsUpdate=true;
      this.rain.position.copy(position);
      this.rain.material.opacity=Math.min(.8,.22+amount*.48);
    }
    if(this.snow.visible){
      const ash=weather.ash>=Math.max(weather.snow,weather.dust);
      const dust=weather.dust>Math.max(weather.snow,weather.ash);
      const color=ash?0xaaa19d:dust?0xdcc39b:0xf2f6ff;
      this.snow.material.color.setHex(color);
      this.snow.material.opacity=Math.min(.93,.4+flakes*shelter*.53);
      const points=this.snowPositions,elapsed=this.seconds;
      const snowCount=Math.max(1,Math.floor(SNOW_COUNT*this.qualityFactor));
      this.snow.geometry.setDrawRange(0,snowCount);
      for(let i=0;i<snowCount;i++){
        const rate=ash?1.4:dust?1.1:1.7;
        const age=wrap(elapsed*(rate+seeded(i,9)) + seeded(i,11)*20,20);
        const p=i*3;
        points[p]=(seeded(i,13)-.5)*31+weather.windX*age*.47+Math.sin(elapsed*1.4+i)*.22;
        points[p+1]=12-age;
        points[p+2]=(seeded(i,17)-.5)*31+weather.windZ*age*.47;
        if(!this.sky.skyVisible(position.x+points[p],position.y+points[p+1],position.z+points[p+2],now))
          points[p+1]=-10000;
      }
      this.snow.geometry.attributes.position.needsUpdate=true;
      this.snow.position.copy(position);
    }
    // Optional occasional drops falling from a nearby cave ceiling during rain.
    this.drips.visible=rain>.2&&this.underRoof;
    if(this.drips.visible){
      const p=this.dripPositions;
      for(let i=0;i<DRIP_COUNT;i++){
        const dx=(seeded(i,32)-.5)*7,dz=(seeded(i,36)-.5)*7;
        const ceiling=this.sky.caveCeiling(position.x+dx,position.y+1.1,position.z+dz,7);
        const j=i*6;
        if(ceiling===null){p[j+1]=-10000;p[j+4]=-10000;continue;}
        const fall=wrap(this.seconds*(1+seeded(i,42)) + seeded(i,43)*2,2.5);
        const y=ceiling-.58-fall-position.y;
        const occupied=this.world.getBlockId(Math.floor(position.x+dx),Math.floor(position.y+y),Math.floor(position.z+dz));
        if(occupied&&occupied!==9){p[j+1]=-10000;p[j+4]=-10000;continue;}
        p[j]=dx;p[j+1]=y;p[j+2]=dz;
        p[j+3]=dx;p[j+4]=y-.16;p[j+5]=dz;
      }
      this.drips.position.copy(position);
      this.drips.geometry.attributes.position.needsUpdate=true;
    }
  }
  dispose(scene){
    for(const object of [this.rain,this.snow,this.drips]){
      scene.remove(object);object.geometry.dispose();object.material.dispose();
    }
  }
}
