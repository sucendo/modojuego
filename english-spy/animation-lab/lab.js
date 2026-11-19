/* English Spy — movement lab. Independent from the Café de Oriente adventure. */
(() => {
  'use strict';
  const W=1200,H=675,canvas=document.getElementById('stage'),ctx=canvas.getContext('2d');
  const stage=document.getElementById('room-frame'),tip=document.getElementById('scene-tip');
  const statusNode=document.getElementById('status'),inventoryNode=document.getElementById('inventory');
  const atlas=document.getElementById('atlas-backdrop'),poseGrid=document.getElementById('pose-grid');
  const asset=new Image();asset.src='./assets/agent-sheet.webp';
  const poses=['Quieto · tres cuartos','Quieto · perfil','Quieto · derecha','Quieto · espaldas','Escuchando',
    'Caminar · frente A','Caminar · frente B','Caminar · lateral A','Caminar · lateral B','Caminar · lateral C',
    'Caminar · lateral D','Caminar · atrás A','Caminar · atrás B','Girar · izquierda','Girar · derecha',
    'Hablar','Señalar','Examinar','Recoger una prueba','Abrir una puerta'];
  const frames=[];
  const initial={x:397,y:592,facing:'front'};
  const agent={...initial,stride:0,moving:false,path:[],onArrival:null,action:null};
  let noteTaken=false,doorOpen=false,hover=null,last=performance.now();
  let camera={x:0,y:0,scale:1,left:0,top:0},screen={w:1,h:1,dpr:1};
  let targetMark=null,showcase=null,shownStatus='',lastFrame=-1;
  const heldKeys=new Set(),heldPad=new Set();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const objects=[
    {id:'sofa',name:'Sillón',x:226,y:479,radius:128,go:{x:398,y:526},action:'look'},
    {id:'desk',name:'Mesa de trabajo',x:629,y:476,radius:120,go:{x:602,y:600},action:'look'},
    {id:'note',name:'Documento',x:880,y:612,radius:36,go:{x:903,y:627},action:'pick'},
    {id:'chair',name:'Silla',x:830,y:551,radius:70,go:{x:903,y:598},action:'look'},
    {id:'plant',name:'Planta',x:1015,y:500,radius:70,go:{x:926,y:581},action:'look'},
    {id:'painting',name:'Cuadro',x:376,y:177,radius:98,go:{x:410,y:383},action:'point'},
    {id:'door',name:'Puerta',x:1090,y:282,radius:94,go:{x:1101,y:388},action:'open'}
  ];
  const obstacles=[
    {x1:95,y1:450,x2:353,y2:562},
    {x1:499,y1:478,x2:762,y2:557},
    {x1:768,y1:517,x2:892,y2:608},
    {x1:960,y1:519,x2:1082,y2:652}
  ];
  const now=()=>performance.now();
  function notify(message){tip.textContent=message;}
  function setStatus(message){if(message===shownStatus)return;shownStatus=message;statusNode.innerHTML='Estado: <strong>'+message.replaceAll('&','&amp;').replaceAll('<','&lt;')+'</strong>';}
  function refreshInventory(){inventoryNode.textContent=noteTaken?'Inventario: documento ✓':'Inventario: vacío';}
  function resize(){
    const rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);screen={w:rect.width,h:rect.height,dpr};
    canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
    canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';
  }
  new ResizeObserver(resize).observe(stage);window.addEventListener('resize',resize);resize();
  function updateCamera(){
    const portrait=screen.w/screen.h<1.25;
    const scale=portrait?Math.max(screen.w/W,screen.h/H):Math.min(screen.w/W,screen.h/H);
    const viewWidth=screen.w/scale,viewHeight=screen.h/scale;
    const x=viewWidth<W?clamp(agent.x-viewWidth*.49,0,W-viewWidth):0;
    const y=viewHeight<H?clamp(agent.y-viewHeight*.65,0,H-viewHeight):0;
    camera={x,y,scale,left:viewWidth>=W?(screen.w-W*scale)/2:0,top:viewHeight>=H?(screen.h-H*scale)/2:0};
  }
  function pointerWorld(e){const r=canvas.getBoundingClientRect();return{
    x:(e.clientX-r.left-camera.left)/camera.scale+camera.x,
    y:(e.clientY-r.top-camera.top)/camera.scale+camera.y
  };}
  function floor(x,y){
    if(x<55||x>1155||y<350||y>651)return false;
    if(obstacles.some(o=>x>o.x1&&x<o.x2&&y>o.y1&&y<o.y2))return false;
    return true;
  }
  function canStand(x,y){const rx=11,ry=7;return [[0,0],[rx,0],[-rx,0],[0,ry],[0,-ry],[rx*.65,ry*.65],[-rx*.65,-ry*.65],[rx*.65,-ry*.65],[-rx*.65,ry*.65]]
    .every(([a,b])=>floor(x+a,y+b));}
  function clearLine(a,b){const d=distance(a,b),n=Math.max(1,Math.ceil(d/3));for(let i=0;i<=n;i++){
    const t=i/n;if(!canStand(lerp(a.x,b.x,t),lerp(a.y,b.y,t)))return false;
  }return true;}
  const CELL=20,COLS=Math.ceil(W/CELL),ROWS=Math.ceil(H/CELL);
  const xy=i=>({x:(i%COLS+.5)*CELL,y:(Math.floor(i/COLS)+.5)*CELL});
  function nearest(p){if(canStand(p.x,p.y))return p;let best=null,score=Infinity;
    for(let i=0;i<COLS*ROWS;i++){const q=xy(i);if(!canStand(q.x,q.y))continue;
      const s=(q.x-p.x)**2+(q.y-p.y)**2;if(s<score){score=s;best=q;}}
    return best;
  }
  function planRoute(from,to){
    const a=nearest(from),b=nearest(to);if(!a||!b)return [];
    if(clearLine(a,b))return [b];
    const size=COLS*ROWS,allowed=new Uint8Array(size),cost=new Float64Array(size).fill(Infinity),prev=new Int32Array(size).fill(-1),closed=new Uint8Array(size);
    for(let i=0;i<size;i++){const p=xy(i);allowed[i]=canStand(p.x,p.y)?1:0;}
    function nearestIndex(p){let id=-1,d=Infinity;for(let i=0;i<size;i++){if(!allowed[i])continue;const q=xy(i),v=(p.x-q.x)**2+(p.y-q.y)**2;if(v<d){d=v;id=i;}}return id;}
    const start=nearestIndex(a),goal=nearestIndex(b);if(start<0||goal<0)return [];
    const open=[start];cost[start]=0;
    while(open.length){let at=0,small=Infinity;for(let j=0;j<open.length;j++){
      const v=open[j],q=xy(v),heur=cost[v]+distance(q,b);if(heur<small){small=heur;at=j;}}
      const cur=open.splice(at,1)[0];if(cur===goal)break;if(closed[cur])continue;closed[cur]=1;
      const x=cur%COLS,y=Math.floor(cur/COLS);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=COLS||yy>=ROWS)continue;
        const next=yy*COLS+xx;if(!allowed[next]||closed[next])continue;
        if(dx&&dy&&(!allowed[y*COLS+xx]||!allowed[yy*COLS+x]))continue;
        if(!clearLine(xy(cur),xy(next)))continue;
        const nextCost=cost[cur]+Math.hypot(dx,dy)*CELL;
        if(nextCost<cost[next]){cost[next]=nextCost;prev[next]=cur;if(!open.includes(next))open.push(next);}
      }
    }
    if(!Number.isFinite(cost[goal]))return [];
    const trace=[];for(let i=goal;i>=0;i=prev[i])trace.push(xy(i));trace.reverse();
    const chain=[a,...trace,b],smooth=[];
    for(let i=0;i<chain.length-1;){let last=i+1;
      for(let j=chain.length-1;j>i+1;j--){if(clearLine(chain[i],chain[j])){last=j;break;}}
      smooth.push(chain[last]);i=last;
    }
    return smooth;
  }
  function cancelAnimation(){showcase=null;agent.action=null;}
  function moveTo(p,callback=null){
    cancelAnimation();const path=planRoute(agent,p);
    if(!path.length){notify('No se puede llegar hasta ahí: hay un mueble en medio.');return false;}
    agent.path=path;agent.onArrival=callback;targetMark={...path.at(-1),until:now()+1100};return true;
  }
  function stopWalking(){agent.path=[];agent.onArrival=null;agent.moving=false;}
  function face(dx,dy){if(Math.abs(dx)>Math.abs(dy)*.7)agent.facing=dx>0?'right':'left';else if(Math.abs(dy)>.02)agent.facing=dy>0?'front':'back';}
  function tryMove(dx,dy,dt){const len=Math.hypot(dx,dy);if(len<.1)return false;
    const vx=dx/len,vy=dy/len,speed=175*dt;
    const x=agent.x+vx*speed,y=agent.y+vy*speed;
    if(canStand(x,y)){agent.x=x;agent.y=y;}
    else if(canStand(x,agent.y)){agent.x=x;}
    else if(canStand(agent.x,y)){agent.y=y;}
    else return false;
    face(vx,vy);agent.stride+=speed/25;return true;
  }
  function startAction(kind){
    stopWalking();showcase=null;
    if(kind==='turn'){
      const order=['front','right','back','left'];agent.facing=order[(order.indexOf(agent.facing)+1)%4];
    }
    agent.action={kind,since:now(),duration:kind==='pick'?1250:kind==='open'?1350:kind==='talk'?1700:1050,done:false};
    const names={talk:'Hablando',look:'Examinando',pick:'Recogiendo',point:'Señalando',listen:'Escuchando',turn:'Girando',open:'Abriendo puerta'};
    setStatus(names[kind]||'Acción');
  }
  function interact(obj){if(obj.id==='note'&&noteTaken){notify('Ya has recogido el documento.');return;}
    if(moveTo(obj.go,()=>{startAction(obj.action);notify(obj.name+' · '+(obj.action==='pick'?'Recogiendo prueba':obj.action==='open'?'Abriendo la puerta':'Inspeccionando'));}))
      notify('Caminando hacia '+obj.name.toLowerCase()+'...');}
  function doAction(name){
    if(name==='pick'){
      if(noteTaken){startAction('pick');notify('El documento ya está guardado en el inventario.');}
      else interact(objects.find(o=>o.id==='note'));
    }else if(name==='open')interact(objects.find(o=>o.id==='door'));
    else{startAction(name);notify({talk:'I am looking for Evelyn Blackwood.',look:'Una pista puede estar en cualquier lugar.',point:'Por allí. Mira esa dirección.',listen:'Escucho con atención...',turn:'Cambio de orientación.'}[name]||'Movimiento');}
  }
  function reset(){Object.assign(agent,{...initial,stride:0,moving:false,path:[],onArrival:null,action:null});
    noteTaken=false;doorOpen=false;showcase=null;targetMark=null;heldPad.clear();heldKeys.clear();
    document.querySelectorAll('.dir').forEach(b=>b.classList.remove('pressed'));
    refreshInventory();setStatus('En reposo');notify('Toca el suelo para caminar · Usa los botones para probar movimientos.');}
  function chooseHover(p){let best=null,d=Infinity;for(const obj of objects){
    if(obj.id==='note'&&noteTaken)continue;
    const dd=Math.hypot((p.x-obj.x), (p.y-obj.y)*1.1);
    if(dd<obj.radius&&dd<d){best=obj;d=dd;}
  }return best;}
  canvas.addEventListener('pointerdown',e=>{
    e.preventDefault();if(!atlas.hidden)return;updateCamera();const p=pointerWorld(e),hit=chooseHover(p);
    if(hit)interact(hit);else moveTo(p);
  });
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||!atlas.hidden)return;
    updateCamera();hover=chooseHover(pointerWorld(e));canvas.style.cursor=hover?'pointer':'crosshair';
  });
  canvas.addEventListener('pointerleave',()=>{hover=null;canvas.style.cursor='crosshair';});
  for(const button of document.querySelectorAll('[data-dir]')){
    const dir=button.dataset.dir;
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);
      heldPad.add(dir);button.classList.add('pressed');stopWalking();cancelAnimation();});
    const release=()=>{heldPad.delete(dir);button.classList.remove('pressed');};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);
    button.addEventListener('lostpointercapture',release);
  }
  for(const button of document.querySelectorAll('[data-action]'))button.addEventListener('click',()=>doAction(button.dataset.action));
  document.getElementById('reset').addEventListener('click',reset);
  const keyDirections={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
  document.addEventListener('keydown',e=>{
    if(!atlas.hidden){if(e.key==='Escape')atlas.hidden=true;return;}
    const k=e.key.toLowerCase(),dir=keyDirections[k];
    if(dir){e.preventDefault();if(!heldKeys.has(dir)){stopWalking();cancelAnimation();}heldKeys.add(dir);}
    else if(k===' '){e.preventDefault();doAction('talk');}
  });
  document.addEventListener('keyup',e=>{const dir=keyDirections[e.key.toLowerCase()];if(dir)heldKeys.delete(dir);});
  window.addEventListener('blur',()=>{heldKeys.clear();heldPad.clear();document.querySelectorAll('.dir').forEach(b=>b.classList.remove('pressed'));});
  const atlasToggle=document.getElementById('atlas-toggle'),atlasClose=document.getElementById('atlas-close');
  atlasToggle.addEventListener('click',()=>{atlas.hidden=false;stopWalking();cancelAnimation();});
  atlasClose.addEventListener('click',()=>{atlas.hidden=true;atlasToggle.focus();});
  atlas.addEventListener('pointerdown',e=>{if(e.target===atlas)atlas.hidden=true;});
  document.getElementById('play-all').addEventListener('click',()=>{
    atlas.hidden=true;stopWalking();agent.action=null;showcase={start:now(),duration:20*760};
    setStatus('Reproduciendo las 20 poses');notify('Secuencia completa de las 20 poses · Una cada 0,76 segundos');
  });
  function makeFrames(){
    frames.length=0;const cols=5,rows=4,cw=asset.naturalWidth/cols,ch=asset.naturalHeight/rows;
    const off=document.createElement('canvas');off.width=asset.naturalWidth;off.height=asset.naturalHeight;
    const c=off.getContext('2d',{willReadFrequently:true});c.drawImage(asset,0,0);
    const data=c.getImageData(0,0,off.width,off.height).data;
    for(let i=0;i<cols*rows;i++){
      const col=i%cols,row=Math.floor(i/cols),left=Math.floor(col*cw),right=Math.floor((col+1)*cw),top=Math.floor(row*ch),bottom=Math.floor((row+1)*ch);
      let minX=right,minY=bottom,maxX=left,maxY=top;
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
        if(data[(y*off.width+x)*4+3]<24)continue;
        if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
      }
      if(maxX<minX)frames.push({x:left,y:top,w:right-left,h:bottom-top});
      else {
        // Generated atlas frames sometimes contain detached dust/stray pixels
        // below the actual boots. They must never become the actor's floor
        // anchor: detect the last reasonably solid silhouette row instead.
        let lastBootRow=maxY;
        for(let y=maxY;y>=Math.max(minY,maxY-76);y--){
          let pixels=0,first=maxX,rightmost=minX;
          for(let x=minX;x<=maxX;x++)if(data[(y*off.width+x)*4+3]>96){
            pixels++;if(x<first)first=x;if(x>rightmost)rightmost=x;
          }
          if(pixels>=11&&rightmost-first>=15){lastBootRow=y;break;}
        }
        frames.push({x:minX,y:minY,w:maxX-minX+1,h:lastBootRow-minY+1});
      }
    }
    buildAtlas();
  }
  function buildAtlas(){poseGrid.replaceChildren();for(let i=0;i<20;i++){
    const button=document.createElement('button');button.className='pose-card';button.type='button';
    button.setAttribute('aria-label','Previsualizar '+poses[i]);
    const cv=document.createElement('canvas');cv.width=124;cv.height=112;
    const p=cv.getContext('2d'),f=frames[i],s=Math.min(105/f.h,110/f.w);
    p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
    p.drawImage(asset,f.x,f.y,f.w,f.h,(124-f.w*s)/2,110-f.h*s,f.w*s,f.h*s);
    const label=document.createElement('span');label.textContent=poses[i];button.append(cv,label);
    button.addEventListener('click',()=>{atlas.hidden=true;stopWalking();agent.action=null;
      showcase={start:now(),duration:2300,single:i};setStatus(poses[i]);notify('Pose '+(i+1)+'/20 · '+poses[i]);});
    poseGrid.append(button);
  }}
  asset.addEventListener('load',makeFrames);if(asset.complete&&asset.naturalWidth)makeFrames();
  asset.addEventListener('error',()=>{setStatus('No se ha podido cargar el atlas');notify('Error cargando la imagen del protagonista.');});
  function currentPose(t){
    if(showcase){const elapsed=t-showcase.start;
      if(elapsed>showcase.duration){showcase=null;setStatus('En reposo');}
      else if(showcase.single!==undefined)return {index:showcase.single,flip:false};
      else {const i=Math.min(19,Math.floor(elapsed/760));if(i!==lastFrame){lastFrame=i;setStatus('Pose '+(i+1)+'/20 · '+poses[i]);}return {index:i,flip:false};}
    }
    if(agent.action){const a=agent.action,phase=(t-a.since)/a.duration;
      if(phase>=1){agent.action=null;setStatus('En reposo');}
      else {const actions={talk:15,look:17,pick:18,point:16,listen:4,turn:agent.facing==='left'?13:14,open:19};
        if(phase>.09&&phase<.91)return {index:actions[a.kind]??0,flip:false};
      }
    }
    if(agent.moving){const frame=Math.floor(agent.stride)%4;
      if(agent.facing==='front')return {index:[5,0,6,0][frame],flip:false};
      if(agent.facing==='back')return {index:[11,3,12,3][frame],flip:false};
      return {index:[7,8,9,10][frame],flip:agent.facing==='left'};
    }
    if(agent.facing==='back')return {index:3,flip:false};
    if(agent.facing==='left')return {index:2,flip:true};
    if(agent.facing==='right')return {index:2,flip:false};
    return {index:0,flip:false};
  }
  function update(t,dt){
    let dx=0,dy=0;
    if(heldKeys.has('up')||heldPad.has('up'))dy--;
    if(heldKeys.has('down')||heldPad.has('down'))dy++;
    if(heldKeys.has('left')||heldPad.has('left'))dx--;
    if(heldKeys.has('right')||heldPad.has('right'))dx++;
    if(dx||dy){stopWalking();agent.action=null;showcase=null;agent.moving=tryMove(dx,dy,dt);if(agent.moving)setStatus('Caminando · '+agent.facing);}
    else if(agent.path.length){
      const next=agent.path[0],d=distance(agent,next),step=Math.min(d,172*dt);
      if(d<=step+1){agent.x=next.x;agent.y=next.y;agent.path.shift();
        if(!agent.path.length){agent.moving=false;const callback=agent.onArrival;agent.onArrival=null;if(callback)callback();else setStatus('En reposo');}}
      else if(canStand(agent.x+(next.x-agent.x)*step/d,agent.y+(next.y-agent.y)*step/d)){
        face(next.x-agent.x,next.y-agent.y);agent.x+=(next.x-agent.x)*step/d;agent.y+=(next.y-agent.y)*step/d;agent.stride+=step/25;agent.moving=true;setStatus('Caminando · '+agent.facing);
      }else{stopWalking();setStatus('Camino bloqueado');}
    }else agent.moving=false;
    if(agent.action&&!agent.action.done){const progress=(t-agent.action.since)/agent.action.duration;
      if(progress>.57){agent.action.done=true;
        if(agent.action.kind==='pick'&&!noteTaken){noteTaken=true;refreshInventory();notify('Documento recogido · Ahora está en el inventario.');}
        if(agent.action.kind==='open'){doorOpen=!doorOpen;notify(doorOpen?'La puerta se ha abierto.':'La puerta se ha cerrado.');}
      }
    }
  }
  function fill(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  function poly(points,fillColor,strokeColor=null,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();
    ctx.fillStyle=fillColor;ctx.fill();if(strokeColor){ctx.strokeStyle=strokeColor;ctx.lineWidth=width;ctx.stroke();}}
  function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function room(){
    // A quiet espionage safe house; plain furniture provides real occlusion tests.
    fill(0,0,W,H,'#273547');
    const wall=ctx.createLinearGradient(0,0,0,360);wall.addColorStop(0,'#25364c');wall.addColorStop(.7,'#43516a');wall.addColorStop(1,'#536075');fill(0,0,W,345,wall);
    for(let x=0;x<W;x+=52){fill(x+4,0,1,345,'#ffffff0a');fill(x+8,0,2,345,'#14243817');}
    fill(0,286,W,73,'#6e5649');fill(0,284,W,5,'#ba8959');
    for(let x=0;x<W;x+=84){line(x,291,x,349,'#372c32',3);line(x+7,295,x+7,347,'#a47d5a',1);}
    fill(0,345,W,H-345,'#51443d');
    poly([[0,345],[1200,345],[1200,675],[0,675]],'#6d5144');
    const floorLight=ctx.createLinearGradient(0,350,0,675);floorLight.addColorStop(0,'#72594c');floorLight.addColorStop(1,'#94684b');fill(0,345,W,330,floorLight);
    for(let y=352;y<675;y+=39){const depth=(y-345)/330;line(0,y,W,y,'#352a2b96',1.3+depth*1.5);line(0,y+3,W,y+3,'#c4926a33',1);}
    for(let x=0;x<1200;x+=94){line(x,352,x-85,675,'#52392f79',2);}
    for(let y=359;y<675;y+=78){for(let x=28;x<1200;x+=190)fill(x+(y%3)*45,y,4,3,'#d3a47224');}
    // A simple burgundy rug, flat on the floor and not an obstacle.
    poly([[351,559],[779,555],[888,667],[259,667]],'#573e45','#be9a6d',4);
    poly([[374,571],[762,567],[849,656],[293,656]],'#704b53','#93726b',2);
    for(let i=0;i<14;i++)line(320+i*36,646,810-i*6,589,'#aa7d6b19',1);
    // Window with an evening skyline.
    fill(723,69,232,225,'#3c262a');fill(733,79,212,201,'#171f37');
    const sky=ctx.createLinearGradient(0,78,0,274);sky.addColorStop(0,'#182b50');sky.addColorStop(.55,'#55648a');sky.addColorStop(1,'#d08065');fill(744,89,190,181,sky);
    for(let i=0;i<12;i++){const x=748+i*17,h=25+(i*23)%82;fill(x,270-h,16,h,'#28263b');for(let j=0;j<3;j++)fill(x+4,264-h+j*12,3,4,'#dfb86b');}
    fill(833,85,7,196,'#8f6b53');fill(744,176,190,7,'#8f6b53');fill(729,68,13,226,'#9a6c47');fill(942,68,13,226,'#9a6c47');
    // Painting and brass lamp.
    fill(277,93,208,174,'#241e23');fill(285,101,192,158,'#c08d54');fill(296,112,170,136,'#1b3542');
    poly([[302,230],[353,180],[389,210],[448,153],[461,243],[300,243]],'#6c6e5d');
    line(300,238,465,238,'#b99451',4);fill(312,119,141,38,'#56778a');
    fill(544,95,13,40,'#a87f4e');fill(526,114,50,11,'#b99466');
    ctx.beginPath();ctx.arc(550,111,15,0,Math.PI*2);ctx.fillStyle='#ffe5a3';ctx.fill();
    const glow=ctx.createRadialGradient(551,120,12,551,120,136);glow.addColorStop(0,'#ffdda01e');glow.addColorStop(1,'#ffdda000');fill(415,0,272,268,glow);
    // Door is part of the architecture but can open after an action.
    fill(999,77,171,279,'#5f3828');fill(1008,87,154,263,'#b28451');fill(1017,97,136,252,'#372925');
    if(doorOpen){fill(1020,102,123,239,'#0e1b2b');poly([[1020,102],[1104,112],[1110,337],[1020,341]],'#5c3b2a','#c5945b',5);fill(1090,233,8,9,'#e7bd65');}
    else{fill(1027,103,117,236,'#704a35');fill(1037,113,97,106,'#855a3e');fill(1037,228,97,98,'#8b5f40');
      fill(1045,122,81,86,'#68422f');fill(1045,238,81,76,'#70472f');fill(1120,239,8,12,'#e2ba67');}
    fill(1004,346,158,8,'#2c2427');line(996,359,1172,359,'#9c765c',3);
  }
  function shadow(x,y,rx,ry){ctx.fillStyle='#141a2073';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
  function desk(){
    shadow(633,548,151,18);
    fill(522,480,18,84,'#57301e');fill(727,480,18,84,'#57301e');
    fill(529,485,216,16,'#a46a45');fill(517,495,246,17,'#63412f');
    poly([[499,461],[741,454],[773,485],[522,500]],'#b68257','#55382e',5);
    line(513,470,741,464,'#f0be82',3);line(531,492,765,482,'#63372b',3);
    // Training props embedded in the tabletop.
    poly([[600,463],[677,462],[704,476],[623,479]],'#e6d6b4','#bca27c',2);
    line(610,467,668,466,'#86796d',2);line(615,471,673,470,'#9b8779',1);
    fill(548,457,27,13,'#413635');fill(555,449,15,9,'#766e61');
    ctx.beginPath();ctx.ellipse(717,470,14,8,0,0,Math.PI*2);ctx.fillStyle='#f5ede2';ctx.fill();
    fill(701,463,24,7,'#ece4d6');
  }
  function sofa(){
    shadow(232,559,150,20);
    fill(112,410,245,119,'#442b2c');fill(120,420,229,102,'#688270');
    fill(137,431,98,77,'#819b7f');fill(243,431,89,77,'#768c73');
    for(let x of [132,232,335]){fill(x,425,4,88,'#3b665c');}
    fill(114,499,239,37,'#526d60');fill(102,465,33,88,'#4b3028');fill(331,466,31,88,'#4b3028');
    fill(112,540,14,24,'#4a2f29');fill(335,540,14,24,'#4a2f29');
    line(135,526,331,526,'#9da88a',3);line(104,482,104,540,'#a27853',3);
  }
  function chair(){
    shadow(833,605,70,12);
    fill(779,481,15,101,'#493529');fill(872,477,15,101,'#493529');
    fill(790,481,83,52,'#815f49');fill(797,488,68,40,'#8b765f');
    poly([[784,543],[871,538],[899,557],[803,568]],'#987755','#4c362e',4);
    fill(799,556,15,52,'#5a392a');fill(878,552,12,52,'#5a392a');
  }
  function plant(){
    shadow(1019,644,77,13);
    poly([[988,579],[1052,577],[1048,644],[998,644]],'#996444','#362a27',5);
    fill(995,589,48,6,'#c58c5c');line(1005,600,1038,600,'#d09b6b',2);
    for(let i=0;i<17;i++){const x=1015+Math.sin(i*2.8)*53,y=483+Math.cos(i*2.6)*52;
      line(1017,582,x,y,'#31432a',4);
      ctx.fillStyle=i%3?'#426442':'#6f8554';ctx.beginPath();ctx.ellipse(x,y,27,11,i*.8,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<5;i++){ctx.fillStyle='#dbac89';ctx.beginPath();ctx.arc(986+i*14,490+(i%2)*12,5,0,Math.PI*2);ctx.fill();}
  }
  function note(){if(noteTaken)return;shadow(881,618,28,5);
    poly([[854,596],[890,591],[909,616],[867,623]],'#ead6ac','#8a7256',2);
    line(864,603,892,601,'#b98c67',2);line(867,608,898,607,'#9b7a68',1);
    poly([[870,612],[879,609],[881,618]],'#bd5950');
  }
  function drawAgent(t){
    const f=currentPose(t),frame=frames[f.index];if(!asset.naturalWidth||!frame)return;
    const size=lerp(.50,.87,clamp((agent.y-350)/305,0,1));
    const bob=agent.moving?Math.sin(agent.stride*Math.PI)*1.5:0;
    shadow(agent.x,agent.y,42*size,8*size);
    ctx.save();ctx.translate(agent.x,agent.y+bob);ctx.scale(f.flip?-size:size,size);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(asset,frame.x,frame.y,frame.w,frame.h,-frame.w/2,-frame.h,frame.w,frame.h);
    ctx.restore();
  }
  function draw(t){
    if(!screen.w)return;updateCamera();
    ctx.setTransform(screen.dpr,0,0,screen.dpr,0,0);
    ctx.clearRect(0,0,screen.w,screen.h);fill(0,0,screen.w,screen.h,'#0d1621');
    ctx.save();ctx.translate(camera.left,camera.top);ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);
    room();note();
    const items=[{y:558,fn:sofa},{y:555,fn:desk},{y:607,fn:chair},{y:651,fn:plant},{y:agent.y,fn:()=>drawAgent(t)}];
    items.sort((a,b)=>a.y-b.y);for(const item of items)item.fn();
    if(targetMark&&targetMark.until>t){ctx.globalAlpha=(targetMark.until-t)/1100*.6;
      const {x,y}=targetMark;line(x-8,y,x+8,y,'#f4c476',2);line(x,y-6,x,y+6,'#f4c476',2);ctx.globalAlpha=1;}
    ctx.restore();
    if(hover&&atlas.hidden&&!agent.moving)tip.textContent=hover.name+' · Toca para interactuar';
  }
  function loop(t){const dt=Math.min(.04,(t-last)/1000);last=t;update(t,Math.max(.001,dt));draw(t);requestAnimationFrame(loop);}
  refreshInventory();setStatus('En reposo');requestAnimationFrame(loop);
  // A small read-only probe for automated geometry QA; never changes game state.
  window.ENGLISH_SPY_ANIMATION_QA={canStand,planRoute,objects:objects.map(({id,go})=>({id,go})),start:{...initial}};
})();
