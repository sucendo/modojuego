'use strict';
/* HEXATEGOS v0.38.12 · Símbolos geopolíticos jerarquizados.
   Ciudad centrada; puerto en borde costero real; carreteras bajo capital;
   pictogramas vectoriales homogéneos, sin emojis superpuestos. */
(() => {
  const VERSION='0.38.15',DETAIL_ZOOM=5.5,PRODUCTION_ZOOM=7,AI_PRODUCTION_ZOOM=13;
  // Paleta del estilo original: círculo sólido por categoría y dibujo oscuro.
  // Todos los tipos tienen fondo propio, evitando el azul genérico anterior.
  const COLORS={
    city:'#ffd76f',capital:'#f7e493',historic:'#b4becd',port:'#67d5df',
    industry:'#f0a05b',
    oil:'#c4a17a',gas:'#f0b959',
    coal:'#92989c',iron:'#a8b7c7',copper:'#e3a075',quarry:'#c9c5b8',
    timber:'#78bc8f',crops:'#acd477',livestock:'#9dc995',
    refinery:'#80abc9',gasplant:'#8fc5d9',steel:'#9aafc3',
    smelter:'#c6ada1',sawmill:'#8abfa6',cement:'#b9bfba',
    foodplant:'#a8c18a',
    thermal:'#e2c36d',civilian:'#8aa9c5',machinery:'#a3b6c7',
    arms:'#c67d75',textile:'#c6a1cc',chemical:'#a2c7a3',electronics:'#8dbae1'
  };
  const production=()=>window.HexategosProduction0388;
  let frame=null,rendered={city:0,port:0,capital:0,industry:0,special:0};
  const coastline=new Map();
  const entryRole=(s)=>String(s.cell)+':'+s.kind;
  const finite=x=>Number.isFinite(x);
  function radius(){return Math.max(8.3,Math.min(11.2,globeIconScale3249()*1.18))}
  function centerPoint(cell){
    const c=frame?.L?.centers;if(!c||cell<0||cell>=owner6.length)return null;
    const j=3*cell;
    return projectVec(c[j]/32767,c[j+1]/32767,c[j+2]/32767,frame.R,frame.cx,frame.cy);
  }
  function coastNeighbours(cell){
    if(coastline.has(cell))return coastline.get(cell);
    const L=frame?.L;
    if(!L)return [];
    const found=[];
    for(let k=L.offsets[cell];k<L.offsets[cell+1];k++){
      const n=L.edgeNbr[k];
      if(n>=0&&L.land[n]<0)found.push(n);
    }
    coastline.set(cell,found);
    return found;
  }
  function portPosition(cell,point){
    const seas=coastNeighbours(cell);
    if(!seas.length)return null;
    let dx=0,dy=0,len=0,count=0;
    let strongest=null;
    for(const sea of seas){
      const target=centerPoint(sea);
      if(!target||target[2]<-.05)continue;
      const ux=target[0]-point[0],uy=target[1]-point[1];
      const norm=Math.hypot(ux,uy);
      if(norm<.001)continue;
      // Acumular direcciones unitarias evita sesgar el puerto hacia
      // el vecino que parece lejano solo por perspectiva.
      dx+=ux/norm;dy+=uy/norm;len+=norm;count++;
      if(!strongest||norm>strongest.norm)strongest={ux,uy,norm};
    }
    if(!count||!strongest)return null;
    let sum=Math.hypot(dx,dy);
    if(sum<.12){dx=strongest.ux/strongest.norm;dy=strongest.uy/strongest.norm;sum=1}
    const angle=Math.atan2(dy,dx);
    // Aproximación al borde común tierra/mar (mitad del tramo centro-centro).
    // El mínimo deja visibles el puerto y la ciudad en zoom intermedio.
    const shore=Math.max(22,Math.min(125,len/count*.49));
    return {x:point[0]+Math.cos(angle)*shore,
      y:point[1]+Math.sin(angle)*shore,angle,shore};
  }
  function layout(cell){
    if(!frame)return null;
    let l=frame.layouts.get(cell);
    if(l)return l;
    const owner=owner6[cell],point=centerPoint(cell);
    if(owner<0||!point){l={coords:new Map(),center:point};frame.layouts.set(cell,l);return l}
    const cap=capitals?.[owner]===cell;
    const city=cities3212.has(cell)||cap;
    const showDetail=zoom>=DETAIL_ZOOM;
    const hasPort=showDetail&&ports3212.has(cell);
    const specialVisible=zoom>=PRODUCTION_ZOOM&&(owner===0||zoom>=AI_PRODUCTION_ZOOM);
    const specials=specialVisible?(production()?.sitesOnCell?.(cell)||[]).filter(s=>s.f===owner):[];
    const roles=[];
    if(showDetail&&industries3212.has(cell))roles.push('industry');
    for(const s of specials)roles.push(entryRole(s));
    const coords=new Map();
    if(city)coords.set('city',[point[0],point[1]]);
    const shore=hasPort?portPosition(cell,point):null;
    if(hasPort&&shore)coords.set('port',[shore.x,shore.y]);
    else if(hasPort)roles.push('port');
    const central=!city&&!cap&&roles.length?roles.shift():null;
    if(central)coords.set(central,[point[0],point[1]]);
    const n=roles.length,hasShore=!!shore;
    const r=hasShore?Math.max(24,22+n*5.2):Math.max(21,20+n*3.6);
    for(let i=0;i<n;i++){
      // Dejamos el lado marítimo libre para el puerto; resto tierra adentro.
      const angle=hasShore?(shore.angle+Math.PI+(i-(n-1)/2)*(n>=5?.53:.61)):
        (-Math.PI/2+i*2*Math.PI/Math.max(1,n));
      coords.set(roles[i],[point[0]+r*Math.cos(angle),point[1]+r*Math.sin(angle)]);
    }
    l={coords,center:point,shore,city,cap};
    frame.layouts.set(cell,l);
    return l;
  }
  function iconPosition(cell,role,x,y){
    const l=layout(cell);
    const p=l?.coords.get(role);
    return p||[x,y];
  }
  function badge(x,y,type,scale=1){
    if(!finite(x)||!finite(y))return;
    const r=radius()*scale;
    ctx.save();
    ctx.translate(x,y);
    const color=COLORS[type]||'#b4c2ce';
    // Misma estética que ciudad/puerto/fábrica originales: base de color,
    // pictograma oscuro, borde pálido y sombra mínima para el terreno.
    // Sin gradientes por icono para mantener un coste estable con 500 IA.
    ctx.fillStyle='rgba(2,10,17,.85)';
    ctx.beginPath();ctx.arc(0,0,r+1.55,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=color;ctx.strokeStyle='rgba(250,251,248,.9)';
    ctx.lineWidth=1.12;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.scale(r/9,r/9);
    ctx.strokeStyle='#263440';ctx.fillStyle='#263440';
    ctx.lineWidth=1.35;ctx.lineJoin='round';ctx.lineCap='round';
    const line=(...points)=>{
      ctx.beginPath();ctx.moveTo(points[0],points[1]);
      for(let i=2;i<points.length;i+=2)ctx.lineTo(points[i],points[i+1]);ctx.stroke();
    };
    if(type==='city'){
      ctx.strokeRect(-5,-2.2,4,7);ctx.strokeRect(1,-4.4,4,9.2);
      line(-6,4.8,6,4.8);line(-3,-.5,-3,1.2);line(3,-2.3,3,-.5);
    }else if(type==='capital'||type==='historic'){
      ctx.beginPath();
      for(let i=0;i<10;i++){
        const a=-Math.PI/2+i*Math.PI/5,rr=i%2?2.8:6.4;
        if(!i)ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
        else ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
      }
      ctx.closePath();
      if(type==='historic')ctx.stroke();else{ctx.fill();ctx.stroke()}
    }else if(type==='port'){
      ctx.beginPath();ctx.arc(0,-4.6,1.2,0,2*Math.PI);ctx.stroke();
      line(0,-3.4,0,4.9);line(-4,-1.0,4,-1.0);
      ctx.beginPath();ctx.moveTo(-5,2.2);ctx.quadraticCurveTo(-3,6.8,0,5.8);
      ctx.quadraticCurveTo(3,6.8,5,2.2);ctx.stroke();
    }else if(type==='industry'||['refinery','gasplant','steel','smelter','sawmill','cement','foodplant',
      'thermal','civilian','machinery','arms','textile','chemical','electronics'].includes(type)){
      line(-6,4.5,-6,-1,-2,1,1,-1,4,1,4,-4.2,6,-4.2,6,4.5,-6,4.5);
      ctx.fillRect(-3,2.5,1.8,1.3);ctx.fillRect(.3,2.5,1.8,1.3);
      if(type!=='industry'){
        const label={refinery:'R',gasplant:'G',steel:'S',smelter:'M',
          sawmill:'W',cement:'C',foodplant:'A',
          thermal:'E',civilian:'B',machinery:'M',arms:'D',textile:'T',chemical:'Q',electronics:'L'}[type];
        ctx.font='bold 5.2px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(label,1.5,-3.2);
      }
    }else if(type==='gas'||type==='oil'){
      ctx.beginPath();ctx.moveTo(0,-6.2);
      ctx.bezierCurveTo(type==='gas'?4:-4,-2,5,0,5,2);
      ctx.bezierCurveTo(5,5.5,2.5,6,0,6);
      ctx.bezierCurveTo(-3.4,6,-5,4,-5,1.5);
      ctx.bezierCurveTo(-5,-.5,-1,-3.9,0,-6.2);
      ctx.stroke();
      if(type==='gas')line(0,-1,2,1.5,0,3.5);
      else ctx.fillRect(-1.1,1,2.2,2.5);
    }else if(type==='coal'||type==='iron'||type==='copper'){
      // Las tres minas comparten el mismo pico vectorial y se distinguen
      // por el color y el símbolo químico/abreviatura de su recurso.
      line(-5,-4.7,4.5,4.5);line(-4,0,-1,-3,1,-4,4,-4.3);
      ctx.font='bold 5.5px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(type==='coal'?'C':type==='iron'?'Fe':'Cu',0,5);
    }else if(type==='timber'){
      line(0,-6,-5,1,-2,1,-5,4,5,4,2,1,5,1,0,-6);
      line(0,4,0,6);
    }else if(type==='quarry'){
      line(-6,4,-2,-3,0,.5,3,-5,6,4,-6,4);
      line(-2,-3,-.2,1,1,-1);
    }else if(type==='crops'){
      line(0,-5.8,0,5.5);
      for(const side of [-1,1])for(const y of [-3.2,-.5,2.2]){
        ctx.beginPath();ctx.ellipse(side*2.1,y,2.1,1.0,side*.4,0,Math.PI*2);ctx.stroke();
      }
    }else if(type==='livestock'){
      ctx.beginPath();ctx.ellipse(0,.3,3.6,4.5,0,0,Math.PI*2);ctx.stroke();
      line(-3,-2.7,-6,-5);line(3,-2.7,6,-5);
      ctx.beginPath();ctx.arc(-1.3,-.6,.5,0,2*Math.PI);ctx.arc(1.3,-.6,.5,0,2*Math.PI);ctx.fill();
      line(-1.3,2.1,1.3,2.1);
    }
    ctx.restore();
  }
  // Capital = CIUDAD central, ligeramente mayor, con estrella en el
  // color real de la nación detrás. Nunca se pinta una segunda estrella.
  function capitalCityIcon03814(x,y,f,scale=1){
    if(!finite(x)||!finite(y))return;
    const cityR=radius()*scale;
    const factionColor=typeof FACTIONS3230!=='undefined'?
      (FACTIONS3230[f]?.color||COLORS.capital):COLORS.capital;
    ctx.save();
    ctx.translate(x,y);
    ctx.beginPath();
    const outer=cityR*1.63,inner=cityR*.76;
    for(let i=0;i<10;i++){
      const a=-Math.PI/2+i*Math.PI/5,r=i%2?inner:outer;
      if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
      else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    }
    ctx.closePath();
    ctx.fillStyle=factionColor;
    ctx.strokeStyle='rgba(3,10,18,.95)';
    ctx.lineWidth=2.5;
    ctx.fill();ctx.stroke();
    ctx.restore();
    badge(x,y,'city',scale);
    rendered.capital++;
  }
  function landIcon(type,x,y,cell,scale=1){
    if(zoom<DETAIL_ZOOM&&type!=='city'&&type!=='capital')return;
    if(!frame)return;
    if(type==='port'&&!coastNeighbours(cell).length)return;
    const [a,b]=iconPosition(cell,type,x,y);
    badge(a,b,type,scale);rendered[type]++;
  }
  // Sustituimos los dibujantes originales sin alterar sus bucles de
  // visibilidad ni sus conjuntos de datos: el coste queda acotado.
  if(typeof drawGlobeCityIcon3249==='function')
    drawGlobeCityIcon3249=function(x,y,cell){
      // Las capitales se pintan una sola vez, al final, como ciudad + estrella.
      const owner=owner6[cell];
      if(owner>=0&&capitals?.[owner]===cell)return;
      landIcon('city',x,y,cell);
    };
  if(typeof drawGlobePortIcon3249==='function')
    drawGlobePortIcon3249=function(x,y,cell){landIcon('port',x,y,cell)};
  if(typeof drawGlobeIndustryIcon3249==='function')
    drawGlobeIndustryIcon3249=function(x,y,cell){landIcon('industry',x,y,cell)};
  // El motor solía dibujar la estrella ANTES de las carreteras. Ahora las
  // capitales se dibujan una sola vez, después de toda la infraestructura.
  if(typeof drawGlobeCapitalIcon3249==='function')
    drawGlobeCapitalIcon3249=function(){};
  const baseDraw=drawInfrastructure3212;
  drawInfrastructure3212=function(R,cx,cy,now){
    const L=loadLevel(MAX_GAME_LEVEL3233);
    frame={R,cx,cy,L,layouts:new Map()};
    rendered={city:0,port:0,capital:0,industry:0,special:0};
    // El dibujo base incluye las carreteras; los símbolos nativos ya
    // usan nuestro estilo y la ciudad conserva exactamente el centro.
    const output=baseDraw.apply(this,arguments);
    if(currentKey===MAX_GAME_LEVEL3233){
      const showSpecial=zoom>=PRODUCTION_ZOOM;
      if(showSpecial){
        const candidates=production()?.drawCandidates?.();
        if(candidates){
          let shown=0;
          for(const s of candidates){
            if(shown>=190)break;
            if(s.f<0||owner6[s.cell]!==s.f||(s.f!==0&&zoom<AI_PRODUCTION_ZOOM))continue;
            const p=centerPoint(s.cell);
            if(!p||p[2]<.06||p[0]<-38||p[0]>vw+38||p[1]<-38||p[1]>vh+38)continue;
            const role=entryRole(s),l=layout(s.cell);
            const pos=l?.coords.get(role);
            if(!pos)continue;
            badge(pos[0],pos[1],s.kind,.96);shown++;rendered.special++;
          }
        }
      }
    }
    // La capital NO es otra estrella: es la propia ciudad central,
    // con una estrella del color nacional por detrás. Se dibuja DESPUÉS
    // de las carreteras y del resto de infraestructuras.
    if(zoom>=1.3){
      for(let f=0;f<activeFactionCount3230;f++){
        const cell=capitals[f];
        if(!Number.isInteger(cell)||cell<0||cell>=owner6.length||owner6[cell]!==f)continue;
        if(zoom<1.65&&f!==0)continue;
        const p=centerPoint(cell);
        if(!p||p[2]<.10||p[0]<-24||p[0]>vw+24||p[1]<-24||p[1]>vh+24)continue;
        capitalCityIcon03814(p[0],p[1],f,f===0?1.22:1.15);
      }
    }
    frame=null;
    return output;
  };
  window.HexategosMapIcons03812={
    active:true,version:VERSION,
    palette:{...COLORS},iconRadius:radius,capitalCityIcon:capitalCityIcon03814,
    positionFor:(cell,role)=>{
      // Sin un fotograma activo, la proyección depende del giro del globo.
      const v=frame?.layouts.get(cell)?.coords.get(role);
      return v?[...v]:null;
    },
    metrics:()=>({...rendered}),
    coastalNeighbours:cell=>[...coastNeighbours(cell)],
    zooms:{detail:DETAIL_ZOOM,production:PRODUCTION_ZOOM,aiProduction:AI_PRODUCTION_ZOOM}
  };
  console.info('[HEXATEGOS] '+VERSION+' · capital como ciudad con estrella nacional; sin estrellas históricas independientes.');
})();