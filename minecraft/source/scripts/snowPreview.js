import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {WaterEnvironment} from './waterEnvironment.js';
import {EnvironmentVisuals} from './environmentVisuals.js';
import {createToolModel} from './toolModels.js';
import {viewPoseFor} from './toolPose.js';
try { start3D(); }
catch(error){
 if(!/WebGL|context/i.test(error.message))throw error;
 import('./snowPreview2D.js').then(({startSnowPreview2D})=>startSnowPreview2D());
}
function start3D(){
const canvas=document.getElementById('scene'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(1.5,devicePixelRatio));
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9db4c1);
const camera=new THREE.PerspectiveCamera(48,1,.1,60);camera.position.set(6,5.5,7);scene.add(camera);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,.1,0);controls.minDistance=4;controls.maxDistance=14;controls.maxPolarAngle=Math.PI*.46;controls.enableDamping=true;
scene.add(new THREE.HemisphereLight(0xe4f1ff,0x6c5745,2));const sun=new THREE.DirectionalLight(0xfff0d7,2);sun.position.set(-3,7,4);scene.add(sun);
const dirt=new THREE.MeshLambertMaterial({color:0x805c40}),grass=new THREE.MeshLambertMaterial({color:0x658447}),stone=new THREE.MeshLambertMaterial({color:0x8b9291});
const tiles=[],chunk={loaded:true,position:{x:0,z:0}},width=32;
const world={type:'classic',chunkSize:{width,height:8},terrainEpoch:0,params:{terrain:{waterOffset:0}},getChunk:()=>chunk,getBlockId:(x,y,z)=>y===0&&Math.abs(x)<=2&&Math.abs(z)<=2?2:0};
const model=new WaterEnvironment(world);world.hydrology={environment:model};const visuals=new EnvironmentVisuals(scene,world);
for(let z=-2;z<=2;z++)for(let x=-2;x<=2;x++){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),x===2?stone:[dirt,dirt,grass,dirt,dirt,dirt]);
 mesh.position.set(x,0,z);mesh.userData.tile={x,z};scene.add(mesh);tiles.push(mesh);
}
const outline=new THREE.BoxHelper(tiles[12],0xe6d591);outline.material.depthTest=false;outline.renderOrder=4;scene.add(outline);
let selected={x:0,z:0},phase='snow',tool=null,swing=0,elapsed=0;
const reading=document.getElementById('reading'),status=document.getElementById('status');
const climates={snow:{snow:1,temperature:-4},frost:{snow:0,temperature:-7},sun:{snow:0,temperature:14}};
const equip=kind=>{
 if(tool)camera.remove(tool);tool=createToolModel(kind==='broom'?'broom':'basic_pickaxe');const pose=viewPoseFor(kind);
 tool.position.set(...pose.position);tool.rotation.set(...pose.rotation);tool.scale.setScalar(pose.scale*.8);tool.userData.base=tool.rotation.z;camera.add(tool);swing=.4;
};
const use=kind=>{
 equip(kind);const changed=model.clearSurface(selected.x,0,selected.z,kind);
 status.textContent=changed?(kind==='broom'?'Nieve barrida; el suelo se conserva.':'Costra rota; el suelo se conserva.'):(model.snow.get(`${selected.x},${selected.z}`)?.ice>.001?'La costra helada necesita el pico.':'No hay una capa que quitar aquí.');
};
document.querySelectorAll('[data-weather]').forEach(button=>button.onclick=()=>{
 phase=button.dataset.weather;document.querySelectorAll('[data-weather]').forEach(b=>b.classList.toggle('active',b===button));
 status.textContent=phase==='frost'?'El frío sostenido compacta la nieve y forma hielo.':phase==='sun'?'La nieve y la costra se derriten poco a poco.':'La nieve se acumula sobre la tierra y la piedra.';
});
document.getElementById('sweep').onclick=()=>use('broom');document.getElementById('pick').onclick=()=>use('pickaxe');
document.getElementById('reset').onclick=()=>{model.clear();status.textContent='Suelo limpio. Elige el clima para empezar.';};
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
canvas.addEventListener('pointerup',e=>{
 if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;
 pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(tiles)[0];
 if(hit){selected=hit.object.userData.tile;outline.setFromObject(hit.object);status.textContent='Loseta elegida: puedes barrerla o romper su costra.';}
});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
let last=performance.now();
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden)return;
 for(const tile of tiles){const {x,z}=tile.userData.tile;model.updateSnow({x,z,top:0},climates[phase],dt*8);}
 visuals.update(dt);controls.update();
 scene.background.setHex(phase==='frost'?0x44536b:phase==='sun'?0xacc7d2:0x98aebd);sun.intensity=phase==='frost'?.45:2;
 if(tool){swing=Math.max(0,swing-dt);tool.rotation.z=tool.userData.base+Math.sin(swing/.4*Math.PI)*.35;}
 elapsed+=dt;if(elapsed>.15){elapsed=0;const r=model.snow.get(`${selected.x},${selected.z}`);reading.textContent=`${climates[phase].temperature} °C · Nieve ${Math.round(((r?.depth||0)-(r?.ice||0))*100)} cm · Hielo ${Math.round((r?.ice||0)*100)} cm`;}
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);

}
