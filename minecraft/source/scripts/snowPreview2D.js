import {WaterEnvironment} from './waterEnvironment.js';
// The same snow state and tool actions, with a Canvas fallback when the
// browser cannot create WebGL. This never changes the game's renderer.
export function startSnowPreview2D(){
 const previous=document.getElementById('scene'),canvas=previous.cloneNode(false);previous.replaceWith(canvas);
 const context=canvas.getContext('2d');if(!context)return;
 const world={type:'classic',chunkSize:{width:32,height:8},params:{terrain:{waterOffset:0}},getChunk:()=>({loaded:true,position:{x:0,z:0}}),getBlockId:(x,y,z)=>y===0&&Math.abs(x)<=2&&Math.abs(z)<=2?2:0};
 const model=new WaterEnvironment(world),tiles=[];
 for(let z=-2;z<=2;z++)for(let x=-2;x<=2;x++)tiles.push({x,z});
 tiles.sort((a,b)=>a.x+a.z-b.x-b.z||a.x-b.x);
 const climates={snow:{snow:1,temperature:-4},frost:{snow:0,temperature:-7},sun:{snow:0,temperature:14}};
 const status=document.getElementById('status'),reading=document.getElementById('reading');
 document.querySelector('.muted').textContent='Vista isométrica: WebGL no está disponible. Toca una loseta. Tiempo ×8.';
 let phase='snow',selected={x:0,z:0},width=0,height=0,scale=45,elapsed=0,faces=[];
 const project=(x,z,y)=>[width*.54+(x-z)*scale,height*.52+(x+z)*scale*.48-y*scale*1.7];
 const path=(points,color,stroke=null)=>{
  context.beginPath();points.forEach((p,i)=>i?context.lineTo(...p):context.moveTo(...p));context.closePath();context.fillStyle=color;context.fill();
  if(stroke){context.strokeStyle=stroke;context.lineWidth=2;context.stroke();}
 };
 const box=(x,z,bottom,top,colors,selected=false)=>{
  const a=project(x-.5,z-.5,top),b=project(x+.5,z-.5,top),c=project(x+.5,z+.5,top),d=project(x-.5,z+.5,top);
  path([b,c,project(x+.5,z+.5,bottom),project(x+.5,z-.5,bottom)],colors[1]);
  path([c,d,project(x-.5,z+.5,bottom),project(x+.5,z+.5,bottom)],colors[2]);
  path([a,b,c,d],colors[0],selected?'#e5cc73':null);return [a,b,c,d];
 };
 const use=tool=>{
  const changed=model.clearSurface(selected.x,0,selected.z,tool);
  status.textContent=changed?(tool==='broom'?'Nieve barrida; el suelo se conserva.':'Costra rota; el suelo se conserva.'):(model.snow.get(`${selected.x},${selected.z}`)?.ice>.001?'La costra helada necesita el pico.':'No hay una capa que quitar aquí.');
 };
 document.querySelectorAll('[data-weather]').forEach(button=>button.onclick=()=>{
  phase=button.dataset.weather;document.querySelectorAll('[data-weather]').forEach(b=>b.classList.toggle('active',b===button));
  status.textContent=phase==='frost'?'El frío sostenido compacta la nieve y forma hielo.':phase==='sun'?'La nieve y la costra se derriten poco a poco.':'La nieve se acumula sobre la tierra y la piedra.';
 });
 document.getElementById('sweep').onclick=()=>use('broom');document.getElementById('pick').onclick=()=>use('pickaxe');
 document.getElementById('reset').onclick=()=>{model.clear();status.textContent='Suelo limpio. Elige el clima para empezar.';};
 canvas.addEventListener('pointerup',event=>{
  for(const f of [...faces].reverse()){
   const [a,b,c,d]=f.points,px=event.clientX,py=event.clientY;
   const cx=(a[0]+c[0])/2,cy=(a[1]+c[1])/2;
   if(Math.abs(px-cx)/scale+Math.abs(py-cy)/(scale*.48)<=1){selected=f.tile;status.textContent='Loseta elegida: puedes barrerla o romper su costra.';break;}
  }
 });
 const resize=()=>{width=innerWidth;height=innerHeight;const pixel=Math.min(1.5,devicePixelRatio);canvas.width=width*pixel;canvas.height=height*pixel;context.setTransform(pixel,0,0,pixel,0,0);scale=Math.min(width/11,height/8,70);};
 addEventListener('resize',resize);resize();let last=performance.now();
 const frame=now=>{
  requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden)return;
  context.fillStyle=phase==='frost'?'#435268':phase==='sun'?'#abc6d0':'#96acb9';context.fillRect(0,0,width,height);faces=[];
  for(const tile of tiles){
   const {x,z}=tile;model.updateSnow({x,z,top:0},climates[phase],dt*8);
   const r=model.snow.get(`${x},${z}`),frozen=r?.ice||0,depth=r?.depth||0,chosen=selected.x===x&&selected.z===z;
   let points=box(x,z,-.5,.5,x===2?['#9a9f9d','#757f82','#838b8b']:['#739154','#78573e','#8b6547'],chosen);
   if(frozen>.001)points=box(x,z,.502,.502+frozen,['#b4d9e5','#729eae','#8db9c6'],chosen);
   if(depth-frozen>.001)points=box(x,z,.502+frozen,.502+depth,['#f5f7f6','#c9d6df','#e0e8ec'],chosen);
   faces.push({tile,points});
  }
  elapsed+=dt;if(elapsed>.15){elapsed=0;const r=model.snow.get(`${selected.x},${selected.z}`);reading.textContent=`${climates[phase].temperature} °C · Nieve ${Math.round(((r?.depth||0)-(r?.ice||0))*100)} cm · Hielo ${Math.round((r?.ice||0)*100)} cm`;}
 };
 requestAnimationFrame(frame);
}
