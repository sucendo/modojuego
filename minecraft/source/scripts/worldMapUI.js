import { MapTerrain } from './mapTerrain.js';
import { springSites } from './hydrologyEngine.js';
import { hydrographyDebugSources, hydrographyDebugSegments } from './hydrographyV1140.js';
import { hydrographyDebugNetworkV1141 } from './hydrographyV1141.js';
import { hydrographyDebugNetworkV1142 } from './hydrographyV1142.js';
import { landmarksInArea } from './landmarks.js';
import { ACHIEVEMENTS } from './achievements.js';
import { t,onLanguageChange } from './i18n.js';

const $=id=>document.getElementById(id);
const symbol={flag:'⚑',home:'⌂',build:'▣',ruin:'▤',tower:'♜',camp:'⛺'};

export function setupWorldMapUI(saves,player,world){
  const overlay=$('world-map-overlay'),canvas=$('world-map-canvas'),mini=$('mini-map-canvas');
  const labels=$('map-marker-list'),poiList=$('map-poi-list'),achievements=$('achievements-grid');
  const ctx=canvas.getContext('2d'),miniCtx=mini.getContext('2d');
  const terrain=new MapTerrain(world);
  const debugHydro=typeof window!=='undefined'&&
    /(?:\?|&)waterDebug(?:=1|(?=&|$))/.test(window.location?.search||'');
  const debugLegend=$('map-hydro-debug-legend');
  if(debugLegend)debugLegend.hidden=!debugHydro;
  let zoom=1.6, lastMini=0,lastPoi=0,lastAch=0,lastID='',previousCell='',needsRedraw=true;
  let center={x:player.position.x,z:player.position.z};
  const exploration=saves.exploration;
  const hydroVersionAt=(x,z)=>{
    if(world.terrainVersion!==6)return 0;
    const k=`${Math.floor(x/32)},${Math.floor(z/32)}`;
    if(world.hybridV1Set?.has(k))return 1;
    if(world.hybridV2Set?.has(k))return 2;
    return world.hybridProtectedSet?.has(k)?0:(world.hybrid?.hydrographyVersion||0);
  };
  const v2Routes=(a,b,c,d)=>world.terrainVersion===6&&
    (world.hybrid?.hydrographyVersion===2||world.hybridV2Set?.size)
    ?hydrographyDebugNetworkV1141(terrain.simplex,world.params,world.type,a,b,c,d):[];
  const v3Routes=(a,b,c,d)=>world.terrainVersion===6&&world.hybrid?.hydrographyVersion===3
    ?hydrographyDebugNetworkV1142(terrain.simplex,world.params,world.type,a,b,c,d):[];
  const springsIn=(a,b,c,d)=>{
    const fresh=v3Routes(a,b,c,d).map(r=>r.source)
      .filter(s=>s.x>=a&&s.x<=c&&s.z>=b&&s.z<=d&&
        hydroVersionAt(s.x,s.z)===3&&terrain.sample(s.x,s.z).waterSource);
    const earlier=v2Routes(a,b,c,d).map(r=>r.source)
      .filter(s=>s.x>=a&&s.x<=c&&s.z>=b&&s.z<=d&&
        hydroVersionAt(s.x,s.z)===2&&terrain.sample(s.x,s.z).waterSource);
    const previous=world.hybridV1Set?.size?hydrographyDebugSources(
      terrain.simplex,world.params,world.type,a,b,c,d)
      .filter(s=>hydroVersionAt(s.x,s.z)===1&&terrain.sample(s.x,s.z).waterSource):[];
    const legacy=springSites(world.params.seed,a,b,c,d,(x,z)=>{
      if(hydroVersionAt(x,z)!==0)return null;
      const point=terrain.sample(x,z);
      return point.water?point.waterKind:null;
    });
    return [...fresh,...earlier,...previous,...legacy].map(s=>({...s,rate:s.rate??.012}));
  };
  const open=()=>{
    if(overlay.hidden===false)return;
    player.mapVisible=true;
    center={x:player.position.x,z:player.position.z};
    if(player.controls.isLocked) player.controls.unlock();
    $('overlay').hidden=true;
    overlay.hidden=false;needsRedraw=true;render(true);
  };
  const close=(resume=false)=>{
    overlay.hidden=true;player.mapVisible=false;
    if(resume)player.controls.lock();
    else $('overlay').hidden=false;
  };
  $('open-world-map').addEventListener('click',open);
  $('map-close-menu').addEventListener('click',()=>close());
  $('map-resume').addEventListener('click',()=>close(true));
  $('map-zoom-in').addEventListener('click',()=>{zoom=Math.min(3.5,zoom*1.4);needsRedraw=true;render(true);});
  $('map-zoom-out').addEventListener('click',()=>{zoom=Math.max(.4,zoom/1.4);needsRedraw=true;render(true);});
  $('map-center').addEventListener('click',()=>{center={x:player.position.x,z:player.position.z};needsRedraw=true;render(true);});
  $('map-add-marker').addEventListener('click',()=>addMarker(player.position.x,player.position.z));
  $('map-enable-pois').addEventListener('click',()=>{
    if(window.confirm(t('mapEnableWarning'))&&saves.enableLandmarks()){needsRedraw=true;render(true);}
  });
  function addMarker(x,z){
    const name=window.prompt(t('mapMarkerPrompt'),t('mapDefaultMarker'));
    if(!name)return;
    const kind=$('marker-kind').value;
    if(!exploration.addMarker(name,x,z,kind)){saves.showStatus('mapLimit',true);return;}
    needsRedraw=true;render(true);
  }
  canvas.addEventListener('click',e=>{
    const rect=canvas.getBoundingClientRect();
    const x=center.x+((e.clientX-rect.left)/rect.width-.5)*canvas.width/zoom;
    const z=center.z+((e.clientY-rect.top)/rect.height-.5)*canvas.height/zoom;
    if(exploration.isExplored(x,z))addMarker(x,z);
    else saves.showStatus('mapUndiscovered',true);
  });
  document.addEventListener('keydown',e=>{
    if(e.code==='KeyM' && !e.repeat && !['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)){
      e.preventDefault();
      if(overlay.hidden){if(player.controls.isLocked||!$('overlay').hidden)open();}
      else close(true);
    }else if(e.code==='Escape' && !overlay.hidden){e.preventDefault();close(false);}
  });
  function paintMap(context,size,cx,cz,pixelsPerBlock){
    const extent=size/(2*pixelsPerBlock);
    const step=8;
    context.clearRect(0,0,size,size);
    context.fillStyle='#17252a';context.fillRect(0,0,size,size);
    const minX=cx-extent,minZ=cz-extent,maxX=cx+extent,maxZ=cz+extent;
    const startX=Math.floor(minX/step)*step,startZ=Math.floor(minZ/step)*step;
    for(let x=startX;x<maxX;x+=step)for(let z=startZ;z<maxZ;z+=step){
      const px=(x-cx)*pixelsPerBlock+size/2,pz=(z-cz)*pixelsPerBlock+size/2;
      if(exploration.isExplored(x+step/2,z+step/2))context.fillStyle=terrain.color(x+step/2,z+step/2);
      else context.fillStyle='#18292b';
      context.fillRect(px,pz,Math.ceil(step*pixelsPerBlock)+.3,Math.ceil(step*pixelsPerBlock)+.3);
    }
    if(debugHydro&&size!==mini.width){
      const project=p=>({x:(p.x-cx)*pixelsPerBlock+size/2,
        z:(p.z-cz)*pixelsPerBlock+size/2});
      // On a development map only: arrows are the drainage direction, color
      // identifies endpoints. Explored world tiles are never changed by this.
      context.save();context.lineCap='round';context.lineJoin='round';
      const currentVersion=world.hybrid?.hydrographyVersion===3?3:2;
      const currentRoutes=currentVersion===3?v3Routes(minX,minZ,maxX,maxZ):v2Routes(minX,minZ,maxX,maxZ);
      for(const route of currentRoutes){
        const visible=route.path;
        context.strokeStyle='rgba(6,72,142,.88)';
        for(let i=1;i<visible.length;i++){
          const a=visible[i-1],b=visible[i],midX=(a.x+b.x)/2,midZ=(a.z+b.z)/2;
          if(hydroVersionAt(midX,midZ)!==currentVersion||!exploration.isExplored(midX,midZ))continue;
          const p=project(a),q=project(b);
          context.lineWidth=Math.max(1.3,Math.min(8,b.flow*pixelsPerBlock*.55));
          context.beginPath();context.moveTo(p.x,p.z);context.lineTo(q.x,q.z);context.stroke();
          if(b.fall>=2&&pixelsPerBlock>.7){
            context.fillStyle='#e5f9ff';
            context.beginPath();context.arc((p.x+q.x)/2,(p.z+q.z)/2,2.5,0,Math.PI*2);context.fill();
          }
          if(i%6===0){
            const theta=Math.atan2(q.z-p.z,q.x-p.x),len=5;
            context.lineWidth=1.8;context.strokeStyle='#f0f5e4';
            context.beginPath();context.moveTo(q.x-len*Math.cos(theta-.55),q.z-len*Math.sin(theta-.55));
            context.lineTo(q.x,q.z);context.lineTo(q.x-len*Math.cos(theta+.55),q.z-len*Math.sin(theta+.55));context.stroke();
            context.strokeStyle='rgba(6,72,142,.88)';
          }
        }
        const end=route.outlet;
        if(end&&exploration.isExplored(end.x,end.z)){
          const p=project(end);
          context.fillStyle=route.end==='sea'?'#40c7a8':route.end==='confluence'?'#f5d073':
            route.end==='basin'?'#a7d8ff':'#ea9868';
          context.beginPath();context.arc(p.x,p.z,3.5,0,Math.PI*2);context.fill();
        }
      }
      if(world.hybridV2Set?.size){
        context.strokeStyle='rgba(65,125,168,.62)';context.lineWidth=1;
        for(const route of v2Routes(minX,minZ,maxX,maxZ))for(let i=1;i<route.path.length;i++){
          const a=route.path[i-1],b=route.path[i];
          if(hydroVersionAt((a.x+b.x)/2,(a.z+b.z)/2)!==2)continue;
          const p=project(a),q=project(b);
          context.beginPath();context.moveTo(p.x,p.z);context.lineTo(q.x,q.z);context.stroke();
        }
      }
      if(world.hybridV1Set?.size){
        context.strokeStyle='rgba(90,130,165,.7)';context.lineWidth=1;
        for(const seg of hydrographyDebugSegments(terrain.simplex,world.params,world.type,minX,minZ,maxX,maxZ)){
          if(hydroVersionAt((seg.a.x+seg.b.x)/2,(seg.a.z+seg.b.z)/2)!==1)continue;
          const p=project(seg.a),q=project(seg.b);
          context.beginPath();context.moveTo(p.x,p.z);context.lineTo(q.x,q.z);context.stroke();
        }
      }
      context.restore();
    }
    context.strokeStyle='rgba(240,247,229,.12)';context.lineWidth=1;
    // Cell boundaries: map coordinates, not arbitrary canvas pixels.
    const spacing=32*pixelsPerBlock;
    for(let x=Math.ceil(minX/32)*32;x<maxX;x+=32){const px=(x-cx)*pixelsPerBlock+size/2;context.beginPath();context.moveTo(px,0);context.lineTo(px,size);context.stroke();}
    for(let z=Math.ceil(minZ/32)*32;z<maxZ;z+=32){const pz=(z-cz)*pixelsPerBlock+size/2;context.beginPath();context.moveTo(0,pz);context.lineTo(size,pz);context.stroke();}
    const icon=(x,z,letter,color,radius)=>{
      const px=(x-cx)*pixelsPerBlock+size/2,pz=(z-cz)*pixelsPerBlock+size/2;
      if(px<0||px>size||pz<0||pz>size)return;
      context.fillStyle=color;context.beginPath();context.arc(px,pz,radius,0,Math.PI*2);context.fill();
      context.fillStyle=color==='#123975'?'#fff':'#101e22';context.textAlign='center';context.textBaseline='middle';
      context.font=`bold ${Math.round(radius*1.35)}px sans-serif`;context.fillText(letter,px,pz+1);
    };
    if(world.landmarksEnabled){
      const pois=landmarksInArea(world.params.seed,minX,minZ,maxX,maxZ);
      for(const p of pois){
        if(!exploration.isExplored(p.x,p.z))continue;
        const elevation=terrain.sample(p.x,p.z);
        if(elevation.water||elevation.height+8>=31)continue;
        icon(p.x,p.z,symbol[p.type]||'?',exploration.visitedSet.has(p.id)?'#b5e9ab':'#ffcc75',size===mini.width?6:10);
      }
    }
    // Blue dots are actual source inputs in simulated, modified terrain.
    // Rivers that merely transport water are deliberately not labelled as springs.
    for(const spring of springsIn(minX,minZ,maxX,maxZ)){
      if(exploration.isExplored(spring.x,spring.z))
        icon(spring.x,spring.z,'+',debugHydro?'#123975':'#65d9ff',size===mini.width?5:8);
    }
    for(const m of exploration.data.markers)icon(m.x,m.z,symbol[m.kind],'#f1e08b',size===mini.width?5:9);
    // Player arrow rotates with camera yaw (first person direction).
    const q=player.camera.quaternion;
    const dx=-2*(q.x*q.z+q.w*q.y),dz=-(1-2*(q.x*q.x+q.y*q.y));
    const px=(player.position.x-cx)*pixelsPerBlock+size/2,pz=(player.position.z-cz)*pixelsPerBlock+size/2;
    const angle=Math.atan2(dx,-dz);
    context.save();context.translate(px,pz);context.rotate(angle);
    context.fillStyle='#fff';context.strokeStyle='#102d38';context.lineWidth=2;
    context.beginPath();context.moveTo(0,-12);context.lineTo(8,9);context.lineTo(0,5);context.lineTo(-8,9);context.closePath();context.fill();context.stroke();context.restore();
  }
  function renderLists(){
    labels.replaceChildren();
    if(!exploration.data.markers.length){const p=document.createElement('p');p.textContent=t('mapNoMarkers');labels.append(p);}
    for(const mark of exploration.data.markers){
      const row=document.createElement('div');row.className='map-list-row';
      const button=document.createElement('button');button.type='button';button.className='small-button';button.textContent=`${symbol[mark.kind]} ${mark.name} (${mark.x}, ${mark.z})`;
      button.addEventListener('click',()=>{center={x:mark.x,z:mark.z};needsRedraw=true;render(true);});
      const del=document.createElement('button');del.className='small-button danger';del.type='button';del.textContent='×';del.title=t('mapDeleteMarker');
      del.addEventListener('click',()=>{exploration.deleteMarker(mark.id);needsRedraw=true;render(true);});row.append(button,del);labels.append(row);
    }
    $('map-enable-pois').hidden=world.landmarksEnabled;
    const engine=world.hydrology;
    const hydroInfo=$('map-hydrology-info'),hydroSources=$('map-hydrology-sources');
    if(hydroInfo&&hydroSources){
      const sources=springsIn(center.x-170,center.z-170,center.x+170,center.z+170);
      const submerged=engine?.total()||0;
      hydroInfo.textContent=`${t('mapHydrologyActive')}: ${engine?.cells.size||0} · ${t('mapHydrologyStored')}: ${submerged.toFixed(1)} m³`;
      hydroSources.replaceChildren();
      if(!sources.length){const p=document.createElement('p');p.textContent=t('mapHydrologyNoSources');hydroSources.append(p);}
      for(const spring of sources.slice(0,8)){
        const button=document.createElement('button');button.type='button';button.className='small-button';
        button.textContent=`💧 ${spring.x}, ${spring.z} · ${spring.rate.toFixed(3)} m³/s`;
        button.addEventListener('click',()=>{center={x:spring.x,z:spring.z};needsRedraw=true;render(true);});
        hydroSources.append(button);
      }
    }
    poiList.replaceChildren();
    if(!world.landmarksEnabled){const p=document.createElement('p');p.textContent=t('mapOldWorld');poiList.append(p);}
    else{
      const near=landmarksInArea(world.params.seed,player.position.x-350,player.position.z-350,player.position.x+350,player.position.z+350)
        .filter(p=>exploration.isExplored(p.x,p.z)&&!terrain.sample(p.x,p.z).water).slice(0,14);
      if(!near.length){const p=document.createElement('p');p.textContent=t('mapNoPois');poiList.append(p);}
      for(const poi of near){
        const button=document.createElement('button');button.type='button';button.className='small-button';
        button.textContent=`${symbol[poi.type]} ${t('poi'+poi.type)} · ${Math.round(Math.hypot(poi.x-player.position.x,poi.z-player.position.z))} m ${exploration.visitedSet.has(poi.id)?'✓':''}`;
        button.addEventListener('click',()=>{center={x:poi.x,z:poi.z};needsRedraw=true;render(true);});poiList.append(button);
      }
    }
    updateAchievements();
  }
  function updateAchievements(){
    achievements.replaceChildren();
    const unlocked=saves.achievements.snapshot().unlocked;
    for(const def of ACHIEVEMENTS){
      const item=document.createElement('div');item.className='achievement-row'+(unlocked[def.id]?' unlocked':'');
      const name=document.createElement('strong');name.textContent=(unlocked[def.id]?'★ ':'☆ ')+t(def.key);
      const date=document.createElement('small');date.textContent=unlocked[def.id]?new Date(unlocked[def.id]).toLocaleDateString() : t('achLocked');
      item.append(name,date);achievements.append(item);
    }
  }
  function render(force=false){
    if(overlay.hidden)return;
    const active=saves.currentWorld()?.id||'';
    if(active!==lastID){lastID=active;terrain.refresh();center={x:player.position.x,z:player.position.z};force=true;}
    if(!force&&!needsRedraw)return;
    paintMap(ctx,canvas.width,center.x,center.z,zoom);
    $('map-player-coordinates').textContent=`X ${Math.floor(player.position.x)} · Z ${Math.floor(player.position.z)} · ${t('mapExplored')} ${exploration.data.explored.length}`;
    renderLists();needsRedraw=false;
  }
  onLanguageChange(()=>{needsRedraw=true;render(true);updateAchievements();});
  player.controls.addEventListener('unlock',updateAchievements);
  const prev=saves.onWorldsChange;
  saves.onWorldsChange=(worlds)=>{prev(worlds);needsRedraw=true;lastID='';render(true);updateAchievements();};
  function tick(now){
    if(!saves.index)return;
    const key=`${Math.floor(player.position.x/32)},${Math.floor(player.position.z/32)}`;
    if(key!==previousCell){previousCell=key;exploration.observe(player.position);needsRedraw=true;}
    if(world.landmarksEnabled && now-lastPoi>500){
      lastPoi=now;
      const p=player.position;
      for(const landmark of landmarksInArea(world.params.seed,p.x-20,p.z-20,p.x+20,p.z+20)){
        if(Math.hypot(landmark.x-p.x,landmark.z-p.z)<13 &&
           !terrain.sample(landmark.x,landmark.z).water && exploration.visitPoi(landmark.id)){
          saves.showStatus('poiDiscovered');needsRedraw=true;
        }
      }
    }
    if(now-lastMini>850){lastMini=now;paintMap(miniCtx,mini.width,player.position.x,player.position.z,1.04);}
    if(now-lastAch>1000&&!$('overlay').hidden){lastAch=now;updateAchievements();}
    if(!overlay.hidden && needsRedraw)render(true);
  }
  updateAchievements();
  return {tick,open,close};
}
