'use strict';
// Extraído del renderizador 0.38.94 de hexategos-pruebas/game/js/game.js.
// Las funciones de malla, proyección, LOD, colores y relieve proceden del juego.
// No se incluyen simuladores, sistemas políticos, IA, guardados ni HUD militar.
const $=id=>document.getElementById(id);
const canvas=$('view'),ctx=canvas.getContext('2d',{alpha:false});
const RAD=Math.PI/180,DEG=180/Math.PI,ROOT='../hexategos-pruebas/game/';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const wrapLon=v=>((v+180)%360+360)%360-180;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const MAX_GAME_LEVEL3233='8';
const COUNTRY_ISO=["FJI","TZA","ESH","CAN","USA","KAZ","UZB","PNG","IDN","ARG","CHL","COD","SOM","KEN","SDN","TCD","HTI","DOM","RUS","BHS","FLK","-99","GRL","ATF","TLS","ZAF","LSO","MEX","URY","BRA","BOL","PER","COL","PAN","CRI","NIC","HND","SLV","GTM","BLZ","VEN","GUY","SUR","-99","ECU","PRI","JAM","CUB","ZWE","BWA","NAM","SEN","MLI","MRT","BEN","NER","NGA","CMR","TGO","GHA","CIV","GIN","GNB","LBR","SLE","BFA","CAF","COG","GAB","GNQ","ZMB","MWI","MOZ","SWZ","AGO","BDI","ISR","LBN","MDG","PSE","GMB","TUN","DZA","JOR","ARE","QAT","KWT","IRQ","OMN","VUT","KHM","THA","LAO","MMR","VNM","PRK","KOR","MNG","IND","BGD","BTN","NPL","PAK","AFG","TJK","KGZ","TKM","IRN","SYR","ARM","SWE","BLR","UKR","POL","AUT","HUN","MDA","ROU","LTU","LVA","EST","DEU","BGR","GRC","TUR","ALB","HRV","CHE","LUX","BEL","NLD","PRT","ESP","IRL","NCL","SLB","NZL","AUS","LKA","CHN","TWN","ITA","DNK","GBR","ISL","AZE","GEO","PHL","MYS","BRN","SVN","FIN","SVK","CZE","ERI","JPN","PRY","YEM","SAU","ATA","-99","CYP","MAR","EGY","LBY","ETH","DJI","-99","UGA","RWA","BIH","MKD","SRB","MNE","-99","TTO","SSD"];



let vw=1,vh=1,dpr=1,yaw=0,pitch=-.28,zoom=1,showGrid=true,showLabels=true;
let currentKey='',currentLevel=null,selected=null,drawn=[],needsRender=true,lastFrame=0,framePending=false,ready=false;
let mountainTier3212=new Uint8Array(0),owner6=new Int16Array(0);
let nameCache=new Map(),nameQueue=[],nameQueued=new Set(),nameWorkers=0,hoverID=-1,hoverTimer=0;
let labelDrawn=0,cityBandCache=new Map(),excludeRows=new Set(),historyNames={},metadataReady=null;
const atlasRoot=ROOT+'data/cities-0354/';
function decodeB64(str,Type){
 const compressed=str.charCodeAt(0)===126; // '~' denotes zlib-compressed binary
 const bin=atob(compressed?str.slice(1):str),u8=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
 const data=compressed?pako.inflate(u8):u8;
 return new Type(data.buffer,data.byteOffset,data.byteLength/Type.BYTES_PER_ELEMENT);
}
function loadLevel(key){
 const d=DATA[key];
 if(d._decoded)return d._decoded;
 d._decoded={
  n:d.n,faces:d.faces,
  centers:decodeB64(d.centers,Int16Array),
  faceCenters:decodeB64(d.faceCenters,Int16Array),
  offsets:decodeB64(d.offsets,Uint32Array),
  adj:decodeB64(d.adj,Uint32Array),
  edgeNbr:decodeB64(d.edgeNbr,Int32Array),
  land:decodeB64(d.land,Int16Array)
 };
 return d._decoded;
}
function loadGroups(key){
 if(key===MAX_GAME_LEVEL3233)return null;
 const g=GROUPS[key];if(g._decoded)return g._decoded;
 g._decoded={offsets:decodeB64(g.offsets,Uint32Array),ids:decodeB64(g.ids,Uint32Array)};return g._decoded;
}

function chooseLevel(){if(zoom<1.28)return '3';if(zoom<1.92)return '4';if(zoom<2.85)return '5';if(zoom<5.15)return '6';if(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches&&zoom<6.7)return '6';return MAX_GAME_LEVEL3233;}

function rot(x,y,z){
 const cy=Math.cos(yaw),sy=Math.sin(yaw);
 const x1=cy*x+sy*z,z1=-sy*x+cy*z;
 const cp=Math.cos(pitch),sp=Math.sin(pitch);
 return [x1,cp*y-sp*z1,sp*y+cp*z1];
}
function baseRadius(){return Math.min(vw,vh)*.435*zoom}
function projectVec(x,y,z,R,cx,cy){
 const r=rot(x,y,z);
 return [cx+R*r[0],cy-R*r[1],r[2]];
}
function lonLatVec(lon,lat){
 const L=lon*Math.PI/180,B=lat*Math.PI/180,c=Math.cos(B);
 return [c*Math.sin(L),Math.sin(B),c*Math.cos(L)];
}
function shadeColor(hex,z){
 let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
 const k=.72+.28*Math.max(0,z);
 return `rgb(${Math.round(r*k)},${Math.round(g*k)},${Math.round(b*k)})`;
}

function shadeColor(hex,z){let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);const k=.72+.28*Math.max(0,z);return 'rgb('+Math.round(r*k)+','+Math.round(g*k)+','+Math.round(b*k)+')';}
function renderIds3233(key,R,cx,cy){
 if(key!==MAX_GAME_LEVEL3233)return null;const P=loadLevel('5'),g=loadGroups('5'),C=P.centers,ids=[],margin=Math.max(120,Math.min(360,R*.055));
 for(let p=0;p<P.n;p++){const j=p*3,pr=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);if(pr[2]<-.06||pr[0]<-margin||pr[0]>vw+margin||pr[1]<-margin||pr[1]>vh+margin)continue;for(let k=g.offsets[p];k<g.offsets[p+1];k++)ids.push(g.ids[k])}return ids;
}



const TERRAIN_PALETTE3247 = {
  ice:[176,194,201],
  tundra:[101,115,108],
  desert:[143,113,70],
  rainforest:[35,77,56],
  forest:[47,82,61],
  savanna:[107,104,61],
  steppe:[96,91,63],
  plain:[82,99,70],
  mediterranean:[98,105,70],
  mountain:[91,78,66],
  highmountain:[116,106,96]
};
const TERRAIN_NAMES3247 = {
  ice:'hielo / glaciar',
  tundra:'tundra',
  desert:'desierto',
  rainforest:'selva',
  forest:'bosque',
  savanna:'sabana',
  steppe:'estepa',
  plain:'llanura',
  mediterranean:'matorral mediterráneo',
  mountain:'montaña',
  highmountain:'alta montaña'
};
const TERRAIN_CODES3247 = [
  'plain','ice','tundra','desert','rainforest','forest',
  'savanna','steppe','mediterranean'
];
const terrainClimateCache3247 = Object.create(null);

function inGeoBox3247(lon,lat,w,e,s,n){
  if(lat<s||lat>n)return false;
  if(w<=e)return lon>=w&&lon<=e;
  return lon>=w||lon<=e; // box crossing ±180°
}
function terrainClimateCode3247(lat,lon,iso){
  const a=Math.abs(lat);

  // Permanent ice / polar cap.
  if(iso==='ATA'||lat<=-62||(iso==='GRL'&&lat>=61)||a>=78)return 1;
  if(a>=67)return 2;

  // Major deserts and hyper-arid belts.
  if(
    inGeoBox3247(lon,lat,-17,36,15,35) ||       // Sahara
    inGeoBox3247(lon,lat,34,61,15,33) ||        // Arabian Peninsula
    inGeoBox3247(lon,lat,45,72,25,40) ||        // Iranian / Central Asian arid belt
    inGeoBox3247(lon,lat,72,92,24,44) ||        // Thar + Taklamakan
    inGeoBox3247(lon,lat,92,116,35,47) ||       // Gobi
    inGeoBox3247(lon,lat,-120,-100,23,38) ||    // SW USA + N Mexico
    inGeoBox3247(lon,lat,-75,-66,-31,-15) ||    // Atacama
    inGeoBox3247(lon,lat,10,30,-32,-16) ||      // Namib + Kalahari
    inGeoBox3247(lon,lat,113,145,-35,-16)       // Australian interior
  ) return 3;

  // Tropical rainforest cores.
  if(
    inGeoBox3247(lon,lat,-81,-44,-16,8) ||      // Amazonia
    inGeoBox3247(lon,lat,9,31,-9,7) ||          // Congo basin
    inGeoBox3247(lon,lat,-16,10,0,10) ||        // Gulf of Guinea
    inGeoBox3247(lon,lat,94,151,-11,18) ||      // SE Asia + Indonesia
    inGeoBox3247(lon,lat,-94,-77,7,19)          // Central America
  ) return 4;

  // Mediterranean-type vegetation.
  if(
    inGeoBox3247(lon,lat,-10,40,30,45) ||
    inGeoBox3247(lon,lat,-124,-116,31,42) ||
    inGeoBox3247(lon,lat,-74,-69,-39,-29) ||
    inGeoBox3247(lon,lat,16,22,-36,-30) ||
    inGeoBox3247(lon,lat,113,121,-36,-29)
  ) return 8;

  // Dry continental steppe.
  if(
    inGeoBox3247(lon,lat,28,100,39,56) ||
    inGeoBox3247(lon,lat,-72,-60,-53,-38) ||
    inGeoBox3247(lon,lat,-108,-95,35,52)
  ) return 7;

  // Boreal and temperate forest belts.
  if(
    (lat>=49&&lat<67&&(
      inGeoBox3247(lon,lat,-170,-52,49,67) ||
      inGeoBox3247(lon,lat,5,180,49,67)
    )) ||
    inGeoBox3247(lon,lat,-12,42,43,59) ||
    inGeoBox3247(lon,lat,-96,-62,29,50) ||
    inGeoBox3247(lon,lat,100,150,26,50) ||
    inGeoBox3247(lon,lat,135,154,-43,-20) ||
    inGeoBox3247(lon,lat,165,179,-47,-34)
  ) return 5;

  // Tropical/subtropical non-desert land defaults to savanna/grassland.
  if(a<23)return 6;

  return 0; // temperate plain / grassland
}
function terrainClimateArray3247(key,L){
  let arr=terrainClimateCache3247[key];
  if(arr&&arr.length===L.n)return arr;
  arr=new Uint8Array(L.n);
  for(let i=0;i<L.n;i++){
    if(L.land[i]<0){arr[i]=255;continue}
    const j=i*3,x=L.centers[j]/32767,y=L.centers[j+1]/32767,z=L.centers[j+2]/32767;
    const lat=Math.asin(Math.max(-1,Math.min(1,y)))*180/Math.PI;
    const lon=Math.atan2(x,z)*180/Math.PI;
    const iso=COUNTRY_ISO[L.land[i]]||'';
    arr[i]=terrainClimateCode3247(lat,lon,iso);
  }
  terrainClimateCache3247[key]=arr;
  return arr;
}
function terrainType3247(key,i,L){
  if(L.land[i]<0)return 'sea';
  // At the maximum gameplay LOD, canonical mountain gameplay data wins over climate.
  if(key===MAX_GAME_LEVEL3233 && mountainTier3212?.length>i){
    const mt=mountainTier3212[i]||0;
    if(mt>=3)return 'highmountain';
    if(mt>0)return 'mountain';
  }
  const a=terrainClimateArray3247(key,L),code=a[i];
  return TERRAIN_CODES3247[code]||'plain';
}
function mixRGB3247(a,b,t){
  const u=1-t;
  return [
    Math.round(a[0]*u+b[0]*t),
    Math.round(a[1]*u+b[1]*t),
    Math.round(a[2]*u+b[2]*t)
  ];
}
function hexRGB3247(hex){
  return [
    parseInt(hex.slice(1,3),16),
    parseInt(hex.slice(3,5),16),
    parseInt(hex.slice(5,7),16)
  ];
}
function shadedRGB3247(rgb,z){
  const k=.72+.28*Math.max(0,z);
  return `rgb(${Math.round(rgb[0]*k)},${Math.round(rgb[1]*k)},${Math.round(rgb[2]*k)})`;
}
function terrainStrategicFill3247(key,i,L,own,z){
  if(L.land[i]<0)return shadeColor('#17384f',z);

  const type=terrainType3247(key,i,L);
  const base=TERRAIN_PALETTE3247[type]||TERRAIN_PALETTE3247.plain;
  if(own<0)return shadedRGB3247(base,z);

  const faction=(FACTIONS3230[own]||FACTIONS3230[0]).color;
  const factionRGB=hexRGB3247(faction);

  // Political tint is stronger at strategic zoom, physical terrain stronger close up.
  const tint=zoom<1.7?.58:zoom<3.5?.50:zoom<7?.43:.36;
  return shadedRGB3247(mixRGB3247(base,factionRGB,tint),z);
}

// El renderizador geográfico definitivo se instala desde atlas-geography.js.
// No mantener un segundo dibujado de ríos/cordilleras en el núcleo de la esfera.
function drawTerrain3212(){throw Error('No se ha cargado atlas-geography.js');}
function invalidate(){needsRender=true;if(!framePending&&ready){framePending=true;requestAnimationFrame(render);}}
function resize(){const r=canvas.getBoundingClientRect();vw=Math.max(1,r.width);vh=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);invalidate();}
function rotateToGeo(lon,lat,z=zoom){const v=lonLatVec(lon,lat),x=v[0],y=v[1],zz=v[2];yaw=Math.atan2(-x,zz);const cy=Math.cos(yaw),sy=Math.sin(yaw),z1=-sy*x+cy*zz;pitch=Math.atan2(y,z1);zoom=clamp(z,.62,40);invalidate();}
function screenGeo(px,py){
 const R=baseRadius(),cx=vw*.5,cy=vh*.515,sx=(px-cx)/R,sy=-(py-cy)/R,t=sx*sx+sy*sy;
 if(t>1)return null;
 const zz=Math.sqrt(Math.max(0,1-t)),cp=Math.cos(pitch),sp=Math.sin(pitch),cyaw=Math.cos(yaw),syaw=Math.sin(yaw);
 const y=cp*sy+sp*zz,z1=-sp*sy+cp*zz,x=cyaw*sx-syaw*z1,z=syaw*sx+cyaw*z1;
 return {lat:Math.asin(clamp(y,-1,1))*DEG,lon:Math.atan2(x,z)*DEG,x,y,z};
}

function render(now=performance.now()){
 framePending=false;lastFrame=now;needsRender=false;
 const key=chooseLevel();
 if(key!==currentKey){
  currentKey=key;currentLevel=loadLevel(key);
 }

 const L=currentLevel,R=baseRadius(),cx=vw*.5,cy=vh*.515;
 const cArr=L.centers,fArr=L.faceCenters,off=L.offsets,adj=L.adj,edgeNbr=L.edgeNbr;
 drawn=[];

 const bg=ctx.createRadialGradient(cx,cy-R*.25,20,cx,cy,R*1.45);
 bg.addColorStop(0,'#12253a');bg.addColorStop(.52,'#07111f');bg.addColorStop(1,'#03070d');
 ctx.fillStyle=bg;ctx.fillRect(0,0,vw,vh);

 ctx.fillStyle='rgba(196,220,241,.25)';
 for(let i=0;i<85;i++){
  const x=(i*197.17)%vw,y=(i*83.71)%vh;
  if((x-cx)*(x-cx)+(y-cy)*(y-cy)>R*R*1.15)ctx.fillRect(x,y,(i%7===0)?1.2:.7,(i%7===0)?1.2:.7);
 }

 const ocean=ctx.createRadialGradient(cx-R*.22,cy-R*.28,R*.08,cx,cy,R);
 ocean.addColorStop(0,'#244f6d');ocean.addColorStop(.65,'#15374f');ocean.addColorStop(1,'#081c2b');
 ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle=ocean;ctx.fill();

 ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
 ctx.lineJoin='round';ctx.lineCap='round';

 // Cells.
 const vis3233=renderIds3233(key,R,cx,cy);
 const iter3233=vis3233||{[Symbol.iterator]:function*(){for(let i=0;i<L.n;i++)yield i}};
 for(const i of iter3233){
  const ix=i*3,bx=cArr[ix]/32767,by=cArr[ix+1]/32767,bz=cArr[ix+2]/32767;
  const pc=projectVec(bx,by,bz,R,cx,cy);
  if(pc[2]<=.015||pc[0]<-100||pc[0]>vw+100||pc[1]<-100||pc[1]>vh+100)continue;
  const s=off[i],e=off[i+1];
  ctx.beginPath();
  for(let k=s;k<e;k++){
   const fi=adj[k],j=fi*3,p=projectVec(fArr[j]/32767,fArr[j+1]/32767,fArr[j+2]/32767,R,cx,cy);
   if(k===s)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
  }
  ctx.closePath();

  const own=-1;
  ctx.fillStyle=terrainStrategicFill3247(key,i,L,own,pc[2]);ctx.fill();
  if(showGrid){
   const alpha=zoom<1.5?.11:zoom<3?.18:.28;
   ctx.strokeStyle=`rgba(3,9,14,${alpha})`;
   ctx.lineWidth=Math.max(.28,Math.min(.72,.26+Math.log2(Math.max(1,zoom))*.10));ctx.stroke();
  }
  drawn.push([i,pc[0],pc[1],pc[2],e-s,own]);
 }

 // Exact coastlines + political/front borders along shared Voronoi edges.
 const selOwn=-1;
 for(const d of drawn){
  const i=d[0],own=d[5],s=off[i],e=off[i+1];
  for(let k=s;k<e;k++){
   const n=edgeNbr[k];if(n<0||n<i)continue;
   const no=-1,geoA=L.land[i],geoB=L.land[n];
   const coast=(geoA<0)!=(geoB<0);
   if(no===own&&!coast)continue;

   const fiA=adj[k],fiB=adj[s+((k-s+1)%(e-s))];
   const a=projectVec(fArr[fiA*3]/32767,fArr[fiA*3+1]/32767,fArr[fiA*3+2]/32767,R,cx,cy);
   const b=projectVec(fArr[fiB*3]/32767,fArr[fiB*3+1]/32767,fArr[fiB*3+2]/32767,R,cx,cy);
   if(a[2]<-.03&&b[2]<-.03)continue;

   const selectedBorder=selOwn>=0&&(own===selOwn||no===selOwn)&&own!==no;
   const playerFront=false;

   ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
   // v3.24.8: borders stay screen-thin at every zoom.
   // Previously lineWidth grew linearly with zoom and became visually dominant.
   if(selectedBorder){
    ctx.strokeStyle='rgba(255,226,138,.48)';
    ctx.lineWidth=Math.min(1.15,.82+.07*Math.sqrt(Math.max(1,zoom)));
   }
   else if(playerFront){
    ctx.strokeStyle='rgba(115,207,255,.48)';
    ctx.lineWidth=Math.min(1.00,.70+.06*Math.sqrt(Math.max(1,zoom)));
   }
   else if(coast){
    ctx.strokeStyle='rgba(4,13,21,.60)';
    ctx.lineWidth=Math.min(.72,.40+.06*Math.sqrt(Math.max(1,zoom)));
   }
   else if(own!==no){
    ctx.strokeStyle='rgba(237,244,249,.20)';
    ctx.lineWidth=Math.min(.78,.48+.06*Math.sqrt(Math.max(1,zoom)));
   }
   else{continue}
   ctx.stroke();
  }
 }

 // Vegetación forestal: iconos limitados a las casillas visibles.
 // Dibujar ANTES de ríos/cordilleras para respetar su trazado.
 window.HexategosAtlasLandCover0391?.drawForests(R,cx,cy);
 drawTerrain3212(R,cx,cy);

 // Etiquetas geográficas y culturales compartidas con Hexategos Pruebas.
 // Se dibujan antes de ciudades para gestionar las colisiones de rótulos.
 window.HexategosAtlasRegions0390?.draw(R,cx,cy);

 drawAtlasSelection(R,cx,cy);

 drawAtlasNames(R,cx,cy);

 const atm=ctx.createRadialGradient(cx-R*.22,cy-R*.32,R*.18,cx,cy,R);
 atm.addColorStop(0,'rgba(255,255,255,.03)');atm.addColorStop(.72,'rgba(55,128,173,.025)');atm.addColorStop(1,'rgba(82,178,224,.20)');
 ctx.fillStyle=atm;ctx.fillRect(cx-R,cy-R,R*2,R*2);ctx.restore();

 ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);
 ctx.strokeStyle='rgba(109,199,238,.42)';ctx.lineWidth=Math.max(1.2,2.1/zoom);ctx.stroke();

 $('stats').textContent='Globo original · LOD '+key+' · zoom '+zoom.toFixed(1)+'× · '+nameCache.size.toLocaleString('es-ES')+' topónimos consultados';

}


