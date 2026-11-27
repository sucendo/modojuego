import { t,onLanguageChange } from './i18n.js';
import { graphicsProfile, normalizeGraphicsQuality } from './graphicsQuality.js';
import { AdaptiveVisibility } from './adaptiveVisibility.js';
import { HorizonVisibility,clampHorizonRadius,QUALITY_HORIZON_CAP } from './lodHorizon.js';
import {normalizeHazeMode,HAZE_MODES} from './horizonHaze.js';

const STORAGE_KEY='minecraftjs_graphics_quality_v94';
const AUTO_KEY='minecraftjs_adaptive_visibility_v103';
const HORIZON_KEY='minecraftjs_lod_horizon_v105';
const HAZE_KEY='minecraftjs_horizon_haze_v1051';
const html=(name,tag='div')=>{const element=document.createElement(tag);element.className=name;return element;};

/** Diagnostic overlay. 2 updates/s; no GPU queries or sync readbacks. */
export function setupPerformanceUI({renderer,world,sun,atmosphere,distantTerrain=null}){
  const panel=html('performance-panel');
  panel.id='performance-panel';panel.hidden=true;
  const heading=html('performance-title','strong');
  const qualityRow=html('performance-quality');
  const label=document.createElement('label');
  const select=document.createElement('select');select.id='graphics-quality';
  for(const key of ['low','medium','high']){
    const option=document.createElement('option');option.value=key;select.append(option);
  }
  label.htmlFor=select.id;
  qualityRow.append(label,select);
  const horizonRow=html('performance-quality');
  const horizonLabel=document.createElement('label');
  const horizonSelect=document.createElement('select');
  horizonSelect.id='lod-horizon-radius';
  for(const n of [6,8,10,12,14,16,18]){
    const option=document.createElement('option');option.value=String(n);
    option.textContent=String(n);horizonSelect.append(option);
  }
  horizonLabel.htmlFor=horizonSelect.id;
  horizonRow.append(horizonLabel,horizonSelect);
  const hazeRow=html('performance-quality');
  const hazeLabel=document.createElement('label');
  const hazeSelect=document.createElement('select');hazeSelect.id='lod-horizon-haze';
  for(const key of HAZE_MODES){
    const option=document.createElement('option');option.value=key;hazeSelect.append(option);
  }
  hazeLabel.htmlFor=hazeSelect.id;
  hazeRow.append(hazeLabel,hazeSelect);
  const autoRow=html('performance-quality');
  const autoLabel=document.createElement('label');
  const autoCheck=document.createElement('input');
  autoCheck.type='checkbox';autoCheck.id='adaptive-visibility';
  autoLabel.htmlFor=autoCheck.id;
  autoRow.append(autoLabel,autoCheck);
  const readout=html('performance-readout','pre');
  const help=html('performance-help','small');
  panel.append(heading,qualityRow,horizonRow,hazeRow,autoRow,readout,help);document.body.append(panel);
  const translate=()=>{
    heading.textContent=t('perfTitle');label.textContent=t('perfQuality');
    horizonLabel.textContent=t('perfHorizonLod');
    hazeLabel.textContent=t('perfHaze');
    for(let i=0;i<hazeSelect.options.length;i++)hazeSelect.options[i].textContent=t(`perfHaze${HAZE_MODES[i][0].toUpperCase()+HAZE_MODES[i].slice(1)}`);
    autoLabel.textContent=t('perfAutoVisibility');
    for(let i=0;i<select.options.length;i++)select.options[i].textContent=t(`perf${['Low','Medium','High'][i]}`);
    help.textContent=t('perfHint');
  };
  onLanguageChange(translate);translate();
  let lodReference=distantTerrain;
  let selectedHaze='auto';
  try{selectedHaze=normalizeHazeMode(localStorage.getItem(HAZE_KEY));}catch{/* optional */}
  hazeSelect.value=selectedHaze;
  lodReference?.setHazeMode(selectedHaze);
  hazeSelect.addEventListener('change',()=>{
    selectedHaze=normalizeHazeMode(hazeSelect.value);
    lodReference?.setHazeMode(selectedHaze);
    try{localStorage.setItem(HAZE_KEY,selectedHaze);}catch{/* optional */}
  });
  const mobile=window.matchMedia('(pointer: coarse)').matches;
  // Separate local defaults from desktop preferences; never modify saved terrain settings.
  const qualityKey=mobile?STORAGE_KEY+'_touch_v1182':STORAGE_KEY;
  const horizonKey=mobile?HORIZON_KEY+'_touch_v1182':HORIZON_KEY;
  const nearMaximum=()=>mobile&&selected!=='high'?Math.min(2,world.drawDistance):world.drawDistance;
  let selected=mobile?'low':'high';
  try{const stored=localStorage.getItem(qualityKey);if(stored)selected=normalizeGraphicsQuality(stored);}catch { /* optional */ }
  const adaptive=new AdaptiveVisibility(nearMaximum());
  let maximumHorizon=mobile?6:12;
  try{maximumHorizon=clampHorizonRadius(localStorage.getItem(horizonKey)||maximumHorizon);}catch{/* optional */}
  world.horizonDistance=maximumHorizon;
  horizonSelect.value=String(maximumHorizon);
  const horizon=new HorizonVisibility(maximumHorizon);
  horizonSelect.addEventListener('change',()=>{
    maximumHorizon=clampHorizonRadius(Number(horizonSelect.value));
    world.horizonDistance=maximumHorizon;
    horizon.reset(Math.min(maximumHorizon,world.horizonQualityCap));
    world.setAdaptiveHorizonDistance(autoEnabled?horizon.radius:null);
    try{localStorage.setItem(horizonKey,String(maximumHorizon));}catch{/* optional */}
  });
  let autoEnabled=true;
  try {autoEnabled=localStorage.getItem(AUTO_KEY)!=='false';}catch{/* optional */}
  function setAutoEnabled(enabled){
    autoEnabled=!!enabled;autoCheck.checked=autoEnabled;
    adaptive.reset(nearMaximum());
    horizon.reset(Math.min(maximumHorizon,world.horizonQualityCap));
    world.setAdaptiveDrawDistance(autoEnabled?adaptive.radius:(mobile?nearMaximum():null));
    world.setAdaptiveHorizonDistance(autoEnabled?horizon.radius:null);
    try{localStorage.setItem(AUTO_KEY,String(autoEnabled));}catch{/* optional */}
  }
  autoCheck.addEventListener('change',()=>setAutoEnabled(autoCheck.checked));
  setAutoEnabled(autoEnabled);
  const setQuality=name=>{
    selected=normalizeGraphicsQuality(name);select.value=selected;
    const profile=graphicsProfile(selected,window.devicePixelRatio);
    renderer.setPixelRatio(mobile&&selected==='low'?Math.min(.85,profile.pixelRatio):profile.pixelRatio);
    renderer.setSize(window.innerWidth,window.innerHeight);
    if(sun.shadow.mapSize.x!==profile.shadowMapSize){
      sun.shadow.mapSize.set(profile.shadowMapSize,profile.shadowMapSize);
      if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
      sun.shadow.needsUpdate=true;
    }
    atmosphere.precipitation.setQualityFactor(profile.precipitation);
    world.shadowRadius=profile.shadowRadius;
    world.horizonQualityCap=QUALITY_HORIZON_CAP[selected];
    adaptive.reset(nearMaximum());world.setAdaptiveDrawDistance(autoEnabled?adaptive.radius:(mobile?nearMaximum():null));
    horizon.reset(Math.min(maximumHorizon,world.horizonQualityCap));
    world.setAdaptiveHorizonDistance(autoEnabled?horizon.radius:null);
    world.refreshChunkShadows();
    try{ localStorage.setItem(qualityKey,selected); }catch { /* optional */ }
  };
  select.addEventListener('change',()=>setQuality(select.value));
  setQuality(selected);
  document.addEventListener('keydown',event=>{
    if(event.code!=='F3'||event.repeat)return;
    if(['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName))return;
    event.preventDefault();panel.hidden=!panel.hidden;
  });
  let frameTimeTotal=0,frames=0,elapsed=0;
  let frameHistory=[],hitches=0,worstMs=0;
  const toggle=()=>{panel.hidden=!panel.hidden;};
  const close=html('small-button','button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close');close.addEventListener('click',toggle);panel.prepend(close);
  document.getElementById('open-performance')?.addEventListener('click',toggle);
  return {
    sample(dt,active=false){
      if(!Number.isFinite(dt)||dt<=0)return;
      const gameplayActive=active;
      if(gameplayActive&&dt>=.1){hitches++;worstMs=Math.max(worstMs,dt*1000);}
      if(autoEnabled){
        // Sacrifice the cheap far LOD first; preserve full nearby blocks.
        // After the horizon reaches 6, sustained low FPS may shrink near detail.
        const canGrowFar=world.getRenderDistance()>=nearMaximum();
        const farChange=horizon.sample(dt,active,Math.min(maximumHorizon,world.horizonQualityCap),canGrowFar);
        if(farChange!==null)world.setAdaptiveHorizonDistance(farChange);
        // Keep v10.3's near-radius controller but freeze it until far LOD is
        // already at its minimum: only then sacrifice close-up voxel detail.
        active=active && horizon.radius<=6;
        const radius=adaptive.sample(dt,active,nearMaximum());
        if(radius!==null)world.setAdaptiveDrawDistance(radius);
      }
      frameTimeTotal+=dt;frames++;elapsed+=dt;
      if(gameplayActive){frameHistory.push(dt*1000);if(frameHistory.length>120)frameHistory.shift();}
      if(elapsed<.5)return;
      if(!panel.hidden){
        const avgMs=frameTimeTotal/Math.max(1,frames)*1000;
        const fps=frames/frameTimeTotal;
        const sorted=frameHistory.slice().sort((a,b)=>a-b);
        const p95=sorted.length?sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]:0;
        const loaded=Array.from(world.chunkIndex.values()).filter(c=>c.loaded);
        const bytes=loaded.reduce((sum,c)=>sum+(c.voxels?.byteLength||0),0);
        const draw=renderer.info.render;
        const lines=[
          `FPS                 ${fps.toFixed(0)}`,
          `${t('perfFrame')}      ${avgMs.toFixed(1)} ms`,
          `Frame p95           ${p95.toFixed(1)} ms`,
          `Hitches ≥100 ms      ${hitches}`,
          `Worst frame          ${worstMs.toFixed(0)} ms`,
          `Water mesh queue     ${world.hydrology?.basins.meshQueue.size??0}`,
          `${t('perfChunks')}         ${loaded.length} / ${(2*world.getRenderDistance()+1)**2}`,
          `${t('perfViewRadius')}     ${world.getRenderDistance()} / ${world.drawDistance} ${t('perfChunksUnit')}`,
          `${t('perfAutoStatus')}       ${autoEnabled?t('perfAutoOn'):t('perfAutoOff')}`,
          `${t('perfHorizonLod')}       ${lodReference?.activeRadius??world.getHorizonDistance()} / ${Math.min(maximumHorizon,world.horizonQualityCap)} ${t('perfChunksUnit')}`,
          `${t('perfLodSectors')}       ${lodReference?.sectors.size??0} (M ${lodReference?.tiers.medium??0} / F ${lodReference?.tiers.far??0})`,
          `LOD pendiente         ${lodReference?.pendingTiles??0} chunks`,
          `${t('perfLodTriangles')}     ${lodReference?.triangles??0}`,
          `${t('perfLodBuild')}         ${(lodReference?.lastBuildMs??0).toFixed(0)} ms`,
          `${t('perfPending')}        ${world.pendingChunks.length}`,
          `${t('perfVoxelMemory')}  ${(bytes/1048576).toFixed(1)} MiB`,
          `${t('perfDrawCalls')}       ${draw.calls}`,
          `${t('perfTriangles')}      ${Math.round(draw.triangles).toLocaleString()}`,
          `${t('perfClouds')}          ${atmosphere.clouds.meshes.reduce((sum,m)=>sum+(m.visible?m.count:0),0)}`,
          `${t('perfChunkBuild')}     ${world.generationMsLast.toFixed(0)} ms`
        ];
        if(performance.memory?.usedJSHeapSize)lines.push(`JS heap             ${(performance.memory.usedJSHeapSize/1048576).toFixed(0)} MiB`);
        readout.textContent=lines.join('\n');
      }
      elapsed=0;frameTimeTotal=0;frames=0;
    },
    setDistantTerrain(value){lodReference=value;lodReference?.setHazeMode(selectedHaze);},
    get quality(){return selected;},
    setQuality,
    setAutoEnabled,
    get autoEnabled(){return autoEnabled;},
  };
}
