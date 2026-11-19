import * as THREE from 'three';
import { DAY_MS } from './dayNight.js';
import { blocks } from './blocks.js';
import { cloudColorAtHour } from './cloudColors.js';

// One sun, one moon and a small star field; no shadows or lights per block.
// Light colors/fog are recomputed at most 5 times per second.
const SKY_COLORS={classic:0x80a0e0,ocean:0x75b6ee,jungle:0x81b4a0,desert:0xe7bc84,snow:0xbacddd,lava:0x96524b};
const NIGHT_COLOR=new THREE.Color(0x060d20);
const DUSK_COLOR=new THREE.Color(0xd87953);
const WHITE=new THREE.Color(0xffffff);
const OVERCAST_COLOR=new THREE.Color(0x3e5067);
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const smooth=(a,b,value)=>{const x=clamp((value-a)/(b-a));return x*x*(3-2*x);};

export class DayNightLighting {
  constructor(scene,renderer,sun,ambient) {
    this.scene=scene;this.renderer=renderer;this.sun=sun;this.ambient=ambient;
    this.moonLight=new THREE.DirectionalLight(0x819ac7,.12);
    this.moonLight.castShadow=false;
    scene.add(this.moonLight);scene.add(this.moonLight.target);
    const sunGeo=new THREE.SphereGeometry(3.1,12,8);
    this.sunMesh=new THREE.Mesh(sunGeo,new THREE.MeshBasicMaterial({color:0xfff2c4,fog:false,depthWrite:false}));
    this.sunMesh.frustumCulled=false;scene.add(this.sunMesh);
    const moonGeo=new THREE.SphereGeometry(2.5,12,8);
    this.moonMesh=new THREE.Mesh(moonGeo,new THREE.MeshBasicMaterial({color:0xdce5e9,fog:false,depthWrite:false}));
    this.moonMesh.frustumCulled=false;scene.add(this.moonMesh);
    // Decorative points use one draw call and are always hidden in daylight.
    const positions=[];
    let seed=1928371;
    for(let i=0;i<120;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const u=seed/4294967296;
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=seed/4294967296;
      const az=u*Math.PI*2, alt=0.13+v*1.31;
      positions.push(Math.cos(alt)*Math.cos(az)*65,Math.sin(alt)*65,Math.cos(alt)*Math.sin(az)*65);
    }
    const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    this.stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xd9e7ff,size:1.45,sizeAttenuation:false,fog:false,depthWrite:false}));
    scene.add(this.stars);
    this.previous=-Infinity;
    this.sky=new THREE.Color();this.dayColor=new THREE.Color();
  }
  update(clock,position,worldType,now=performance.now(),force=false,weather=null){
    if(!force && now-this.previous<180)return;
    this.previous=now;
    const hours=clock.timeMs/DAY_MS*24;
    const angle=(hours-6)/24*Math.PI*2;
    const altitude=Math.sin(angle);
    const daylight=smooth(-.12,.28,altitude);
    const twilight=(1-Math.min(1,Math.abs(altitude)/.37))*smooth(-.28,-.02,altitude);
    this.dayColor.setHex(SKY_COLORS[worldType] || SKY_COLORS.classic);
    this.sky.copy(NIGHT_COLOR).lerp(this.dayColor,daylight);
    this.sky.lerp(DUSK_COLOR,clamp(twilight*.55));
    // Cloud fronts soften sunlight and cool the whole sky. Storm lightning is a
    // short exposure change, not an expensive additional real-time light.
    const coverage=weather?.cloudCover ?? 0;
    const storm=weather?.storm ?? 0;
    this.sky.lerp(OVERCAST_COLOR,clamp(coverage*(.20+storm*.28)));
    if((weather?.lightning||0)>0) this.sky.lerp(WHITE,weather.lightning*.52);
    // All cloud chunks share one MeshBasicMaterial. Tinting that material is
    // a uniform update (no new geometry, chunks or draw calls).
    blocks.cloud.material.color.setHex(cloudColorAtHour(hours, worldType));
    this.renderer.setClearColor(this.sky);
    if(this.scene.fog) this.scene.fog.color.copy(this.sky);
    this.ambient.intensity=.17+daylight*.34*(1-coverage*.32)+(weather?.lightning||0)*.55;
    this.sun.intensity=daylight*1.45*(1-coverage*.61)+(weather?.lightning||0)*.28;
    this.sun.color.copy(WHITE).lerp(DUSK_COLOR,clamp(twilight*.35));
    this.sun.castShadow=altitude>.14 && coverage<.92;
    this.sun.position.set(position.x+Math.cos(angle)*65,position.y+Math.sin(angle)*80,position.z+32);
    this.sun.target.position.copy(position);
    this.sunMesh.position.set(position.x+Math.cos(angle)*62,position.y+Math.sin(angle)*62,position.z+22);
    this.sunMesh.material.color.copy(WHITE).lerp(DUSK_COLOR,clamp(twilight*.6));
    this.sunMesh.visible=altitude>-.08 && coverage<.94;
    this.moonLight.intensity=(1-daylight)*.17*(1-coverage*.4);
    this.moonLight.position.set(position.x-Math.cos(angle)*60,position.y-Math.sin(angle)*70,position.z-24);
    this.moonLight.target.position.copy(position);
    this.moonMesh.position.set(position.x-Math.cos(angle)*62,position.y-Math.sin(angle)*62,position.z-22);
    this.moonMesh.visible=altitude<-.08 && coverage<.90;
    this.stars.visible=altitude<-.12 && coverage<.72;
    this.stars.position.copy(position);
    // Prevent rendering background overlays over nearby blocks.
    this.sun.target.updateMatrixWorld();this.moonLight.target.updateMatrixWorld();
  }
}
