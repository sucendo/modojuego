import { setupTouchControls } from './touchControls.js';
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Physics } from './physics.js';
import { setupUI } from './ui.js';
import { ModelLoader } from './modelLoader.js';
import { SaveManager } from './saveManager.js';
import { setupMenu } from './menu.js';
import { setupInventoryUI } from './inventoryUI.js';
import { TorchLighting } from './torchLighting.js';
import { setupStationUI } from './stationUI.js';
import { tickFurnaces } from './stations.js';
import { Animals } from './animals.js';
import { setupPlaytimeUI } from './playtimeUI.js';
import { DayNightLighting } from './dayNightLighting.js';
import { Atmosphere } from './atmosphere.js';
import { FogAtmosphere, DEFAULT_FOG } from './fogAtmosphere.js';
import { setupWorldProgressUI } from './worldProgressUI.js';
import { setupWorldMapUI } from './worldMapUI.js';
import { setupPerformanceUI } from './performanceUI.js';
import { DistantTerrain } from './distantTerrain.js';
import { updateWaterAnimation } from './waterVisuals.js';
import { EnvironmentVisuals, UnderwaterVision } from './environmentVisuals.js';

// UI Setup
const stats = new Stats();
document.body.appendChild(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5)); // cap costly 4K/HiDPI fill-rate
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x80a0e0, DEFAULT_FOG.near, DEFAULT_FOG.far);
scene.userData.fogPreferences={...DEFAULT_FOG};

const world = new World();
scene.add(world);
// Visual-only LOD is a sibling, never a physics/collision chunk inside World.
const distantTerrain=new DistantTerrain(world);
scene.add(distantTerrain);

const player = new Player(scene, world);
const physics = new Physics(scene);
const torchLighting = new TorchLighting(scene,world);
const animals = new Animals(scene,world);
player.animals=animals;
// The save manager generates the active world once after restoring its seed.

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
orbitCamera.position.set(24, 24, 24);
orbitCamera.layers.enable(1);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.update();
setupTouchControls(player, renderer.domElement, controls);

const modelLoader = new ModelLoader((models) => {
  player.setTool(models.pickaxe);
})

let sun, ambient;
function setupLights() {
  sun = new THREE.DirectionalLight();
  sun.intensity = 1.5;
  sun.position.set(50, 50, 50);
  sun.castShadow = true;

  // Set the size of the sun's shadow box
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0001;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  scene.add(sun.target);

  ambient = new THREE.AmbientLight();
  ambient.intensity = 0.2;
  scene.add(ambient);
}

// Render loop
setupLights();
const lighting = new DayNightLighting(scene,renderer,sun,ambient);
const atmosphere = new Atmosphere(scene,world);
const fogAtmosphere = new FogAtmosphere(scene,world);
const environmentVisuals = new EnvironmentVisuals(scene,world);
const underwaterVision = new UnderwaterVision(scene,renderer,world,[
  lighting.sunMesh,lighting.moonMesh,lighting.stars,...atmosphere.clouds.meshes,
  atmosphere.precipitation.rain,atmosphere.precipitation.snow,atmosphere.precipitation.drips,distantTerrain
]);
const performancePanel=setupPerformanceUI({renderer,world,sun,atmosphere});
performancePanel.setDistantTerrain(distantTerrain);
const orbitOffset=new THREE.Vector3(16,16,16);
let previousTime = performance.now();
let contextLost=false;
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;player.controls.unlock();});
renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;previousTime=performance.now();sun.shadow.needsUpdate=true;});
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  if(contextLost||document.hidden){previousTime=currentTime;return;}
  underwaterVision.restore();
  const rawDt = Math.max(0,(currentTime - previousTime) / 1000);
  const dt = Math.min(rawDt,.25);

  // Only update physics when player controls are locked
  if (player.controls.isLocked) {
    physics.update(dt, player, world);
    if(world.type==='lava' && player.position.y < world.params.terrain.waterOffset+1.7){
      player.respawn();saves.showStatus('lavaRespawn',true);
    }
    player.update(world);
    if (!document.hidden) saves.dayNight.tick(dt*1000);
    saves.progress.observeMovement(player.position);
    animals.update(dt,player.position,currentTime);
    world.update(player);
    world.hydrology?.update(dt,player.position);

    // Update positon of the orbit camera to track player 
    orbitCamera.position.copy(player.position).add(orbitOffset);
    controls.target.copy(player.position);
  }

  // Screen-door transitions use no world edits and never touch save data.
  world.updateTransitions(dt);

  // Furnaces keep cooking while their inventory UI is open (pointer lock is off).
  if(tickFurnaces(world,Math.min(dt,0.12)*1000))saves.markDirty();
  worldMapUI?.tick(currentTime);
  const weather=atmosphere.update(saves.dayNight,player.position,dt,player.controls.isLocked&&!document.hidden,currentTime);
  world.hydrology?.environment.update(dt,player.position,weather,player.controls.isLocked&&!document.hidden);
  lighting.update(saves.dayNight,player.position,world.type,currentTime,false,weather);
  fogAtmosphere.update(weather,player.position,dt,false,atmosphere.precipitation.underRoof);
  updateWaterAnimation(currentTime,performancePanel.quality,document.hidden);
  distantTerrain.update(player.position,dt,weather);
  torchLighting.update(player.position,currentTime);
  environmentVisuals.update(dt);
  underwaterVision.update(player.controls.isLocked ? player.camera : orbitCamera);
  renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
  stats.update();
  performancePanel.sample(rawDt,player.controls.isLocked&&!document.hidden);

  previousTime = currentTime;
}

window.addEventListener('resize', () => {
  // Resize camera aspect ratio and renderer size to the new window size
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

const settingsPanel = setupUI(world, player, physics, scene);
const saves = new SaveManager(world, player, physics, scene, () => {
  underwaterVision.restore();
  animals.reset();
  settingsPanel.refresh();
  atmosphere.lastUpdate=-Infinity;
  atmosphere.precipitation.resetCover();
  const weather=atmosphere.update(saves.dayNight,player.position,0,false,performance.now());
  lighting.update(saves.dayNight,player.position,world.type,performance.now(),true,weather);
  fogAtmosphere.update(weather,player.position,0,true,atmosphere.precipitation.underRoof);
});
settingsPanel.onChange(() => saves.markDirty());
setupMenu(player, saves);
setupInventoryUI(player, saves);
setupStationUI(player,saves,world);
animals.onChange=()=>saves.markDirty();
animals.onSpotted=(type)=>saves.progress.spotSpecies(type);
player.onSleep=()=>{
  const slept=saves.dayNight.sleep();
  if(slept){
    saves.progress.increment('nightsSlept');saves.markDirty();
    atmosphere.lastUpdate=-Infinity;
    const weather=atmosphere.update(saves.dayNight,player.position,0,false,performance.now());
    lighting.update(saves.dayNight,player.position,world.type,performance.now(),true,weather);
    fogAtmosphere.update(weather,player.position,0,true,atmosphere.precipitation.underRoof);
  }
  return slept;
};
player.onFeedback = (key, error) => saves.showStatus(key,error);
if(!saves.initialize()) world.generate(false,player.position);
setupPlaytimeUI(saves,player);
setupWorldProgressUI(saves,player);
const worldMapUI=setupWorldMapUI(saves,player,world);
atmosphere.lastUpdate=-Infinity;
const initialWeather=atmosphere.update(saves.dayNight,player.position,0,false,performance.now());
lighting.update(saves.dayNight,player.position,world.type,performance.now(),true,initialWeather);
fogAtmosphere.update(initialWeather,player.position,0,true,atmosphere.precipitation.underRoof);
// Keep the world clock paused while navigating menus or the browser is hidden.
player.controls.addEventListener('lock',()=>{
  if (!document.hidden) saves.playtime.start();
});
player.controls.addEventListener('unlock',()=>saves.playtime.pause());
document.addEventListener('visibilitychange',()=>{
  if (document.hidden) saves.playtime.pause();
  else if (player.controls.isLocked) saves.playtime.start();
});
// Save only the active world. Movement and look direction are included.
setInterval(() => saves.autosave(), 45000);
window.addEventListener('pagehide',() => { saves.playtime.endSession(); saves.autosave(); });
animate();
