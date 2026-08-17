import { clamp, deg, normLon, rad } from './utils.js';
import { satellite } from './orbit.js';

const RAIN_META='https://api.rainviewer.com/public/weather-maps.json';
const MERC_MAX=85.05112878;
const LIVE_CLOUD_SOURCES=[
  'https://clouds.matteason.co.uk/images/4096x2048/clouds-alpha.png',
  'https://clouds.matteason.co.uk/images/2048x1024/clouds-alpha.png',
  'https://matteason.github.io/daily-cloud-maps/2048x1024-clouds-alpha.png'
];

function sunSubsolar(date){
  const d=new Date(date), {rtasc,decl}=satellite.sunPos(satellite.jday(d)), gmst=satellite.gstime(d);
  // satellite.js devuelve ascensión recta y declinación solares en radianes.
  // El punto subsolar tiene latitud = declinación y longitud = RA - GMST.
  return {lat:deg(decl),lon:normLon(deg(rtasc-gmst))};
}

function visibleWorldOffsets(map){
  const b=map.getBounds(),west=b.getWest(),east=b.getEast();
  let first=Math.ceil((west-180)/360)-1,last=Math.floor((east+180)/360)+1;
  first=Math.max(-6,first);last=Math.min(6,last);
  const out=[];for(let k=first;k<=last;k++)out.push(k*360);
  if(!out.includes(0))out.push(0);
  return [...new Set(out)].sort((a,b)=>a-b);
}

function shiftSegments(segments,offset){
  if(!offset)return segments;
  return segments.map(seg=>seg.map(([lat,lon])=>[lat,lon+offset]));
}

function shiftRing(ring,offset){
  if(!offset)return ring;
  return ring.map(([lat,lon])=>[lat,lon+offset]);
}

function buildNightGeometry(sun){
  const delta=rad(sun.lat),sinDelta=Math.sin(delta),cosDelta=Math.cos(delta);

  // En los equinoccios el terminador son prácticamente dos meridianos.
  // Representar ese caso como un rectángulo de 180° evita inestabilidad numérica.
  if(Math.abs(sinDelta)<1e-5){
    const anti=normLon(sun.lon+180),west=anti-90,east=anti+90;
    return {
      lineSegments:[
        [[-MERC_MAX,west],[MERC_MAX,west]],
        [[-MERC_MAX,east],[MERC_MAX,east]]
      ],
      nightRings:[[
        [-MERC_MAX,west],[MERC_MAX,west],[MERC_MAX,east],[-MERC_MAX,east],[-MERC_MAX,west]
      ]]
    };
  }

  // Para cada longitud resolvemos la condición de horizonte solar:
  // sin(phi)sin(delta) + cos(phi)cos(delta)cos(H) = 0.
  //
  // La versión anterior usaba atan2(y, sin(delta)) sin normalizar el cuadrante.
  // Cuando delta era negativa (invierno boreal), eso devolvía latitudes fuera
  // de [-90°,90°] y terminaban recortadas a ±85°, deformando el terminador.
  const terminator=[];
  for(let lon=-180;lon<=180.0001;lon+=.5){
    const hourAngle=rad(normLon(lon-sun.lon));
    let phi=Math.atan2(-cosDelta*Math.cos(hourAngle),sinDelta);
    // La latitud geográfica física debe quedar en [-pi/2, pi/2].
    if(phi>Math.PI/2) phi-=Math.PI;
    else if(phi<-Math.PI/2) phi+=Math.PI;
    terminator.push([clamp(deg(phi),-MERC_MAX,MERC_MAX),lon]);
  }
  const edge=sun.lat>0?-MERC_MAX:MERC_MAX;
  const ring=[...terminator,[edge,180],[edge,-180],terminator[0]];
  return {lineSegments:[terminator],nightRings:[ring]};
}

const CLOUD_REFRESH_MS=10*60*1000;

function cloudCacheToken(){
  // Live Cloud Maps publica una nueva composición aproximadamente cada 3 h.
  // La app comprueba una posible actualización cada 10 min mientras está abierta:
  // así recoge una publicación nueva sin obligar al usuario a recargar la página.
  return Math.floor(Date.now()/CLOUD_REFRESH_MS);
}


class LiveCloudLayer extends L.GridLayer {
  initialize(options={}){
    L.setOptions(this,options);
    this._image=null;this._imagePromise=null;this._revision=null;this._sourceIndex=0;
  }
  refresh(){
    const rev=cloudCacheToken();
    if(this._revision===rev&&this._image)return;
    this._revision=rev;this._image=null;this._imagePromise=null;this._sourceIndex=0;
    this.redraw();
  }
  async _loadImage(){
    const rev=cloudCacheToken();
    if(this._image&&this._revision===rev)return this._image;
    if(this._imagePromise&&this._revision===rev)return this._imagePromise;
    this._revision=rev;
    this._imagePromise=new Promise((resolve,reject)=>{
      const trySource=index=>{
        if(index>=LIVE_CLOUD_SOURCES.length){reject(new Error('No se pudo cargar la textura global de nubes.'));return;}
        const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
        img.onload=()=>{this._sourceIndex=index;this._image=img;resolve(img);};
        img.onerror=()=>trySource(index+1);
        const sep=LIVE_CLOUD_SOURCES[index].includes('?')?'&':'?';
        img.src=`${LIVE_CLOUD_SOURCES[index]}${sep}v=${rev}`;
      };
      trySource(0);
    }).catch(err=>{this._imagePromise=null;throw err;});
    return this._imagePromise;
  }
  createTile(coords,done){
    const tile=L.DomUtil.create('canvas','leaflet-tile live-cloud-tile'),size=this.getTileSize();tile.width=size.x;tile.height=size.y;
    this._loadImage().then(img=>{
      const ctx=tile.getContext('2d',{alpha:true});ctx.clearRect(0,0,size.x,size.y);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      const n=2**coords.z,wrappedX=((coords.x%n)+n)%n;
      const sx=wrappedX/n*img.naturalWidth,sw=img.naturalWidth/n;
      // La textura fuente es equirectangular. Remuestreamos cada fila a Web Mercator
      // para que las bandas de nubes coincidan con el mapa Leaflet, también cerca de los polos.
      for(let y=0;y<size.y;y++){
        const wy0=(coords.y*size.y+y)/(n*size.y),wy1=(coords.y*size.y+y+1)/(n*size.y);
        if(wy1<=0||wy0>=1)continue;
        const lat0=deg(Math.atan(Math.sinh(Math.PI*(1-2*clamp(wy0,0,1)))));
        const lat1=deg(Math.atan(Math.sinh(Math.PI*(1-2*clamp(wy1,0,1)))));
        const sy0=(90-lat0)/180*img.naturalHeight,sy1=(90-lat1)/180*img.naturalHeight;
        const sy=Math.min(sy0,sy1),sh=Math.max(1,Math.abs(sy1-sy0));
        ctx.drawImage(img,sx,sy,sw,sh,0,y,size.x,1);
      }
      done?.(null,tile);
    }).catch(err=>{console.warn('Nubes casi en tiempo real no disponibles',err);done?.(err,tile);});
    return tile;
  }
}

export class OverlayManager {
  constructor(map){
    this.map=map;this.radar=null;this.clouds=null;this.meta=null;this.metaAt=0;this.lastRadarUrl='';
    this.states={terminator:true,radar:true,clouds:true};this.line=null;this.nightLayer=null;this.nightOpacity=.45;this.lastTime=new Date();
    this.terminatorBase=[];this.nightRingsBase=[];this._terminatorWorldKey='';this.baseMap='osm';
    this.ensurePanes();this.initDayNight();this.setBaseMap('osm');
    this.map.on('moveend zoomend',()=>this.refreshTerminatorCopies());
    this.map.on('move',()=>this.refreshTerminatorCopies());
  }
  ensurePanes(){
    const defs={cloudsPane:380,radarPane:390,terminatorPane:500,orbitPane:720,satPane:750};
    for(const [name,z] of Object.entries(defs)){
      if(!this.map.getPane(name))this.map.createPane(name);
      const p=this.map.getPane(name);p.style.zIndex=String(z);p.style.pointerEvents=name==='satPane'?'auto':'none';
    }
  }
  initDayNight(){
    this.nightLayer=L.layerGroup().addTo(this.map);
    this.line=L.polyline([],{pane:'terminatorPane',color:'#a9bdd8',weight:1.0,opacity:.30,interactive:false}).addTo(this.map);
    this.buildTerminatorGeometry(new Date());
  }
  getNightStyle(){
    if(this.baseMap==='dark'){
      return {fillColor:'#000000', lineColor:'#8c8c8c', lineOpacity:.24};
    }
    if(this.baseMap==='sat'){
      return {fillColor:'#000000', lineColor:'#b8c0ca', lineOpacity:.20};
    }
    return {fillColor:'#000000', lineColor:'#aab3bf', lineOpacity:.26};
  }
  setNightOpacity(value){
    this.nightOpacity=clamp(Number(value)||.45,.25,.9);
    const style=this.getNightStyle();
    this.line?.setStyle?.({color:style.lineColor,opacity:style.lineOpacity});
    this.nightLayer?.eachLayer(layer=>layer.setStyle?.({fillOpacity:this.nightOpacity,fillColor:style.fillColor}));
  }
  buildTerminatorGeometry(date){
    this.lastTime=new Date(date);
    const geometry=buildNightGeometry(sunSubsolar(date));
    this.terminatorBase=geometry.lineSegments;
    this.nightRingsBase=geometry.nightRings;
    this._terminatorWorldKey='';this.refreshTerminatorCopies(true);
  }
  refreshTerminatorCopies(force=false){
    if(!this.terminatorBase?.length)return;
    const offsets=visibleWorldOffsets(this.map),key=offsets.join(',');
    if(!force&&key===this._terminatorWorldKey)return;
    this._terminatorWorldKey=key;
    const style=this.getNightStyle();
    const repeated=[];for(const offset of offsets)repeated.push(...shiftSegments(this.terminatorBase,offset));
    this.line?.setLatLngs(repeated);
    this.line?.setStyle?.({color:style.lineColor,opacity:style.lineOpacity});

    this.nightLayer?.clearLayers();
    for(const offset of offsets){
      for(const ring of this.nightRingsBase){
        L.polygon(shiftRing(ring,offset),{
          pane:'terminatorPane',stroke:false,fill:true,fillColor:style.fillColor,fillOpacity:this.nightOpacity,
          interactive:false,smoothFactor:0,noClip:true
        }).addTo(this.nightLayer);
      }
    }
  }
  setBaseMap(key='osm'){
    this.baseMap=key;
    const pane=this.map.getPane('cloudsPane');
    if(pane){
      pane.classList.remove('clouds-on-light','clouds-on-dark','clouds-on-satellite');
      pane.classList.add(key==='dark'?'clouds-on-dark':key==='sat'?'clouds-on-satellite':'clouds-on-light');
      pane.style.setProperty('--cloud-opacity', (key==='dark' || key==='light') ? '0.40' : (key==='sat' || key==='osm') ? '1.00' : '0.40');
    }
    this.refreshTerminatorCopies(true);
  }
  async fetchMeta(){
    if(this.meta&&Date.now()-this.metaAt<120000)return this.meta;
    const r=await fetch(RAIN_META,{cache:'no-store'});if(!r.ok)throw new Error(`RainViewer HTTP ${r.status}`);
    this.meta=await r.json();this.metaAt=Date.now();return this.meta;
  }
  pick(frames,date,manual){
    if(!frames?.length)return null;if(!manual)return frames[frames.length-1];
    const ts=Math.floor(new Date(date).getTime()/1000);if(ts<frames[0].time)return null;
    let best=frames[0];for(const f of frames){if(f.time<=ts)best=f;else break;}return best;
  }
  ensureRadar(){if(!this.radar)this.radar=L.tileLayer('',{pane:'radarPane',opacity:.82,maxNativeZoom:9,maxZoom:22,noWrap:false,keepBuffer:2,crossOrigin:true,attribution:'Radar © RainViewer'});}
  ensureClouds(){
    if(!this.clouds){
      this.clouds=new LiveCloudLayer({pane:'cloudsPane',tileSize:256,opacity:1,noWrap:false,keepBuffer:2,attribution:'Nubes: Contains modified EUMETSAT data'});
      this.setBaseMap(this.baseMap);
    }
  }
  updateClouds(force=false){this.ensureClouds();this.clouds.refresh(force);}
  async updateRadar(date,manual=false){
    this.ensureRadar();
    try{
      const meta=await this.fetchMeta(),host=meta.host||'https://tilecache.rainviewer.com';
      const frames=[...(meta.radar?.past||[]),...(meta.radar?.nowcast||[])].sort((a,b)=>a.time-b.time),rf=this.pick(frames,date,manual);
      if(rf){const u=`${host}${rf.path}/256/{z}/{x}/{y}/3/1_1.png`;if(u!==this.lastRadarUrl){this.radar.setUrl(u);this.lastRadarUrl=u;}}
    }catch(err){console.warn('Radar RainViewer no disponible',err);}
  }
  async updateWeather(date,manual=false){
    // Las nubes representan la última composición real disponible; la aplicación
    // consulta periódicamente una nueva revisión mientras permanece abierta.
    if(this.states.clouds)this.updateClouds(false);
    if(this.states.radar)await this.updateRadar(date,manual);
    this.applyStates();
  }
  updateTime(date){if(this.states.terminator)this.buildTerminatorGeometry(date);}
  setState(kind,on){this.states[kind]=!!on;if(kind==='clouds'&&on)this.ensureClouds();if(kind==='radar'&&on)this.ensureRadar();this.applyStates();}
  applyStates(){
    const toggle=(layer,on)=>{if(!layer)return;if(on&&!this.map.hasLayer(layer))layer.addTo(this.map);if(!on&&this.map.hasLayer(layer))this.map.removeLayer(layer);};
    toggle(this.nightLayer,this.states.terminator);toggle(this.line,this.states.terminator);toggle(this.radar,this.states.radar);toggle(this.clouds,this.states.clouds);
  }
}
