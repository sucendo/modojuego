'use strict';
/* 0.41.7 · GRANDES LAGOS DE ASIA: criterio europeo 0.39.7.
 * Ejes y anchuras aproximados; contorno visual SIN relleno de hexágonos.
 * El trazo central sigue vértices/aristas L8 conectados; jamás
 * cambia L.land, propietarios, hidrografía jugable o guardados.
 */
(function(){
 if(typeof loadLevel!=='function'||typeof loadGroups!=='function')return;
 const rad=Math.PI/180;
 const lakes=[
  {id:'aralN',name:'Aral septentrional',label:'Mar de Aral',axis:[[60.22,46.22],[60.55,46.36],[60.96,46.26]],widthKm:25,minZoom:5.15},
  {id:'aralW',name:'Aral occidental',label:'Mar de Aral',axis:[[59.09,43.93],[59.10,44.42],[59.10,45.03]],widthKm:16,minZoom:5.15},
  {id:'balkhash',name:'Balkhash',label:'Lago Balkhash',axis:[[73.85,46.53],[75.15,46.48],[76.5,46.39],[77.7,46.35],[78.8,46.28]],widthKm:27,minZoom:5.2},
  {id:'issyk',name:'Issyk-Kul',label:'Issyk-Kul',axis:[[76.65,42.44],[77.3,42.44],[77.98,42.45]],widthKm:16,minZoom:6.6},
  {id:'alakol',name:'Alakol',label:'Lago Alakol',axis:[[81.25,46.28],[81.6,46.27],[81.92,46.2]],widthKm:19,minZoom:7.1},
  {id:'sary',name:'Sarykamysh',label:'Lago Sarykamysh',axis:[[57.39,42],[57.68,42.0],[57.95,42.0]],widthKm:14,minZoom:7.5},
  {id:'pangong',name:'Pangong Tso',label:'Pangong Tso',axis:[[77.89,33.74],[78.57,33.77],[79.25,33.78]],widthKm:7,minZoom:8.1},
  {id:'moriri',name:'Tso Moriri',label:'Tso Moriri',axis:[[78.28,32.83],[78.34,32.94],[78.41,33.03]],widthKm:4.5,minZoom:9.2},
  {id:'manasarovar',name:'Manasarovar',label:'Lago Manasarovar',axis:[[81.36,30.65],[81.53,30.67]],widthKm:12,minZoom:9},
  {id:'rakshastal',name:'Rakshastal',label:'Lago Rakshastal',axis:[[81.1,30.72],[81.26,30.72]],widthKm:10,minZoom:9.2},
  {id:'yamdrok',name:'Yamdrok',label:'Lago Yamdrok',axis:[[90.37,29.07],[90.7,28.96],[90.96,28.83]],widthKm:8,minZoom:8.9},
  {id:'namtso',name:'Namtso',label:'Lago Namtso',axis:[[90.15,30.76],[90.65,30.72],[91.1,30.70]],widthKm:14,minZoom:8},
  {id:'tonle',name:'Tonlé Sap',label:'Tonlé Sap',axis:[[103.50,13.08],[104.0,12.70],[104.47,12.32]],widthKm:32,minZoom:6.6},
  {id:'baikal',name:'Lago Baikal',label:'Lago Baikal',axis:[[104.15,51.8],[105.6,52.3],[107.4,53.4],[109.1,54.58],[109.9,55.3]],widthKm:38,minZoom:6.8},
  {id:'khovsgol',name:'Lago Khövsgöl',label:'Lago Khövsgöl',axis:[[100.43,50.7],[100.48,51.11],[100.52,51.52]],widthKm:17,minZoom:8},
  {id:'hulun',name:'Lago Hulun',label:'Lago Hulun',axis:[[116.9,48.91],[117.33,48.96],[117.7,49.02]],widthKm:30,minZoom:8},
  {id:'qinghai',name:'Lago Qinghai',label:'Lago Qinghai',axis:[[99.64,36.88],[100.15,36.89],[100.61,36.91]],widthKm:41,minZoom:7.4},
  {id:'biwa',name:'Lago Biwa',label:'Lago Biwa',axis:[[136.02,34.98],[136.11,35.20],[136.17,35.43]],widthKm:9,minZoom:9},
  {id:'toba',name:'Lago Toba',label:'Lago Toba',axis:[[98.70,2.46],[98.91,2.66],[99.09,2.8]],widthKm:18,minZoom:9}
 ];
 const paths=new Map(),drawn=new Set(),prepared=new Map();
 const lock=(v,a,b)=>Math.max(a,Math.min(b,v));
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 const km=(a,b)=>Math.hypot((a.lon-b.lon)*111.2*Math.cos((a.lat+b.lat)*rad/2),(a.lat-b.lat)*111.2);
 function build(lake){
  if(prepared.has(lake.id))return prepared.get(lake.id);
  const L=loadLevel('8'),P=loadLevel('5'),groups=loadGroups('5'),
   longs=lake.axis.map(x=>x[0]),lats=lake.axis.map(x=>x[1]),
   dlat=Math.max(.65,lake.widthKm/100)+.7,
   dlon=Math.max(.9,lake.widthKm/75)+1.0,
   west=Math.min(...longs)-dlon,east=Math.max(...longs)+dlon,
   south=Math.min(...lats)-dlat,north=Math.max(...lats)+dlat,
   pos=new Map(),adj=new Map(),coast=new Set(),
   y0=Math.sin((south-2)*rad)*32767,y1=Math.sin((north+2)*rad)*32767,
   seen=new Set();
  function add(id){
   if(pos.has(id))return;
   const n=id*3,F=L.faceCenters;
   pos.set(id,{lon:Math.atan2(F[n],F[n+2])/rad,
    lat:Math.asin(lock(F[n+1]/32767,-1,1))/rad});
  }
  function connect(a,b){
   add(a);add(b);
   if(!adj.has(a))adj.set(a,new Set());
   if(!adj.has(b))adj.set(b,new Set());
   adj.get(a).add(b);adj.get(b).add(a);
  }
  for(let p=0;p<P.n;p++){
   const j=p*3;
   if(P.centers[j+1]<y0||P.centers[j+1]>y1)continue;
   const lon=Math.atan2(P.centers[j],P.centers[j+2])/rad;
   if(lon<west-3||lon>east+3)continue;
   for(let n=groups.offsets[p];n<groups.offsets[p+1];n++){
    const cell=groups.ids[n];
    if(seen.has(cell))continue;seen.add(cell);
    if(L.land[cell]<0)continue;
    const i=cell*3;
    const lat=Math.asin(lock(L.centers[i+1]/32767,-1,1))/rad,
     lng=Math.atan2(L.centers[i],L.centers[i+2])/rad;
    if(lat<south-1||lat>north+1||lng<west-1||lng>east+1)continue;
    for(let k=L.offsets[cell],stop=L.offsets[cell+1];k<stop;k++){
     const a=L.adj[k],b=L.adj[k+1<stop?k+1:L.offsets[cell]];
     if(a===b)continue;connect(a,b);
     const other=L.edgeNbr[k];
     if(other>=0&&L.land[other]<0)coast.add(key(a,b));
    }
   }
  }
  const g={L,pos,adj,coast};
  prepared.set(lake.id,g);return g;
 }
 function closest(G,pt){
  let chosen=-1,best=Infinity;const target={lon:pt[0],lat:pt[1]};
  for(const [id,p] of G.pos){
   const d=km(p,target);if(d<best){chosen=id;best=d}
  }
  return {id:chosen,km:best};
 }
 function pathBetween(G,first,last){
  if(first===last)return [first];
  const start=G.pos.get(first),end=G.pos.get(last);
  const limit=2400,queue=[[km(start,end),0,first]],
   best=new Map([[first,0]]),prev=new Map();let expanded=0;
  // Local A*: compact ordered heap, bounded to lake neighbourhood.
  function put(item){
   let k=queue.length;queue.push(item);
   while(k){const p=(k-1)>>1;if(queue[p][0]<=item[0])break;queue[k]=queue[p];k=p}
   queue[k]=item;
  }
  function take(){
   const out=queue[0],v=queue.pop();
   if(queue.length){
    let i=0;while(true){
     const a=i*2+1;if(a>=queue.length)break;
     const b=a+1,j=b<queue.length&&queue[b][0]<queue[a][0]?b:a;
     if(queue[j][0]>=v[0])break;queue[i]=queue[j];i=j;
    }queue[i]=v;
   }
   return out;
  }
  while(queue.length&&expanded++<limit){
   const [,cost,id]=take();
   if(cost>(best.get(id)??Infinity)+1e-7)continue;
   if(id===last){
    const all=[last];let u=last;
    while(u!==first){u=prev.get(u);if(u==null)return null;all.push(u)}
    return all.reverse();
   }
   const p=G.pos.get(id);
   for(const to of G.adj.get(id)||[]){
    if(G.coast.has(key(id,to)))continue;
    const q=G.pos.get(to),step=km(p,q);
    const vx=end.lon-start.lon,vy=end.lat-start.lat,
     px=q.lon-start.lon,py=q.lat-start.lat,den=vx*vx+vy*vy,
     t=den?lock((px*vx+py*vy)/den,0,1):0,
     off=Math.hypot((px-t*vx)*Math.cos(q.lat*rad),(py-t*vy))*111.2;
    const next=cost+step*(1+.006*Math.min(90,off));
    if(next+1e-7<(best.get(to)??Infinity)){
     best.set(to,next);prev.set(to,id);put([next+km(q,end),next,to]);
    }
   }
  }
  return null;
 }
 function resolve(lake){
  if(paths.has(lake.id))return paths.get(lake.id);
  const G=build(lake),ids=[],tolerance=Math.max(20,Math.min(48,lake.widthKm*1.35+12));
  let reason='',all=[];
  for(const pt of lake.axis){
   const found=closest(G,pt);
   if(found.id<0||found.km>tolerance){reason='Ancla sin vértice L8 próximo';break}
   if(ids.at(-1)!==found.id)ids.push(found.id);
  }
  if(!reason&&ids.length>=2){
   all=[ids[0]];
   for(let k=1;k<ids.length;k++){
    const part=pathBetween(G,all.at(-1),ids[k]);
    if(!part){reason='Sin aristas L8 terrestres entre las anclas';break}
    const straight=km(G.pos.get(all.at(-1)),G.pos.get(ids[k]));
    let dist=0;
    for(let i=1;i<part.length;i++)dist+=km(G.pos.get(part[i-1]),G.pos.get(part[i]));
    if(dist>Math.max(50,straight*2.5)){reason='Desvío excesivo';break}
    all.push(...part.slice(1));
   }
  }
  let plan=null;
  if(!reason&&all.length>=2&&all.every((v,k)=>!k||
    G.adj.get(all[k-1])?.has(v)&&!G.coast.has(key(all[k-1],v)))){
   plan={kind:'edge',path:all,mesh:G.L};
  }else if(!reason||ids.length<2){
   // Como en Europa, un lago menor que la resolución L8 no inventa
   // aristas. Sólo una marca puntual discreta anclada al vértice.
   const id=ids[0]??closest(G,lake.axis[Math.floor(lake.axis.length/2)]).id;
   if(id>=0)plan={kind:'point',path:[id],mesh:G.L};
  }
  paths.set(lake.id,plan);
  return plan;
 }
 function enabled(){
  const bridge=window.HexategosGameAtlasBridge0400;
  return $('lakes')?.checked!==false&&(!bridge||bridge.enabled());
 }
 function visible(lake,R,cx,cy){
  return lake.axis.some(([lon,lat])=>{
   const u=lonLatVec(lon,lat),p=projectVec(u[0],u[1],u[2],R,cx,cy);
   return p[2]>.025&&p[0]>-90&&p[0]<vw+90&&p[1]>-90&&p[1]<vh+90;
  });
 }
 function draw(R,cx,cy){
  drawn.clear();
  if(!enabled())return 0;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if(mode!=='terrain'&&mode!=='political')return 0;
  let count=0;ctx.save();
  try{
   ctx.lineCap='round';ctx.lineJoin='round';
   for(const lake of lakes){
    if(zoom<lake.minZoom||!visible(lake,R,cx,cy))continue;
    const plan=resolve(lake);if(!plan)continue;
    const F=plan.mesh.faceCenters,points=plan.path;
    const path=[];
    for(const v of points){
     const j=v*3,p=projectVec(F[j]/32767,F[j+1]/32767,F[j+2]/32767,R,cx,cy);
     if(p[2]>.015)path.push(p);
    }
    if(!path.length)continue;
    const width=Math.max(1.15,Math.min(36,lake.widthKm*R/6371*1.07));
    if(plan.kind==='point'){
     ctx.beginPath();ctx.arc(path[0][0],path[0][1],Math.min(2.7,Math.max(1.25,width*.42)),0,Math.PI*2);
     ctx.fillStyle='rgba(47,146,180,.92)';ctx.fill();
    }else if(path.length>1){
     ctx.beginPath();
     path.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
     ctx.strokeStyle='rgba(4,34,47,.84)';ctx.lineWidth=width+2;ctx.stroke();
     ctx.strokeStyle='rgba(50,145,178,.93)';ctx.lineWidth=width;ctx.stroke();
    }else continue;
    drawn.add(lake.id);count++;
   }
  }finally{ctx.restore()}
  return count;
 }
 window.HexategosAsianLakes0417=Object.freeze({
  version:'0.41.7',enabled:true,lakes,draw,
  isDrawn:name=>lakes.some(l=>(l.name===name||l.label===name)&&drawn.has(l.id)),
  inspect:name=>{
   const l=lakes.find(x=>x.name===name||x.id===name);
   const p=l?resolve(l):null;return p?{name:l.name,kind:p.kind,path:p.path.slice()}:null;
  },
  inspectAll:()=>lakes.map(l=>({name:l.name,kind:resolve(l)?.kind||'omitted',
   edges:Math.max(0,(resolve(l)?.path.length||1)-1)})),
  diagnostics:()=>({prepared:paths.size,rendered:drawn.size,
   edgeRoutes:[...paths.values()].filter(p=>p?.kind==='edge').length,
   markers:[...paths.values()].filter(p=>p?.kind==='point').length})
 });
})();
