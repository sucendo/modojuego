'use strict';
/* HEXATEGOS v0.38.12 · Símbolos geopolíticos jerarquizados.
   Ciudad centrada; puerto en borde costero real; carreteras bajo capital;
   pictogramas vectoriales homogéneos, sin emojis superpuestos. */
(() => {
  const VERSION='0.38.12',DETAIL_ZOOM=5.5,PRODUCTION_ZOOM=7,AI_PRODUCTION_ZOOM=13;
  const COLORS={city:'#f3d487',capital:'#fae6a3',historic:'#b3c7d8',port:'#7ad4e1',
    industry:'#ebb47b',oil:'#ddc199',gas:'#edc99a',iron:'#cfcaad',copper:'#d6aa8a',
    timber:'#9bd8aa',quarry:'#cfccc3',crops:'#a8d69d',livestock:'#b4d7a3',
    refinery:'#b2cddd',gasplant:'#b2cddd',steel:'#b2cddd',smelter:'#b2cddd',
    sawmill:'#b2cddd',cement:'#b2cddd',foodplant:'#b2cddd'};
  const production=()=>window.HexategosProduction0388;
  let frame=null,rendered={city:0,port:0,capital:0,industry:0,special:0};
  const coastline=new Map();
  const entryRole=(s)=>String(s.cell)+':'+s.kind;
  const finite=x=>Number.isFinite(x);
  function radius(){return Math.max(7.2,Math.min(9.7,globeIconScale3249()*1.08))}
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
    const shore=Math.max(19,Math.min(125,len/count*.49));
    return {x:point[0]+Math.cos(angle)*shore,
      y:point[1]+Math.sin(angle)*shore,angle,shore};
  }
  function layout(cell){
    if(!frame)return null;
    let l=frame.layouts.get(cell);
    if(l)return l;
    const owner=owner6[cell],point=centerPoint(cell);
    if(owner<0||!point){l={coords:new Map(),center:point};frame.layouts.set(cell,l);return l}
    const city=cities3212.has(cell);
    const showDetail=zoom>=DETAIL_ZOOM;
    const hasPort=showDetail&&ports3212.has(cell);
    const cap=capitals?.[owner]===cell;
    const hist=!!frame.historic?.has(cell);
    const specialVisible=zoom>=PRODUCTION_ZOOM&&(owner===0||zoom>=AI_PRODUCTION_ZOOM);
    const specials=specialVisible?(production()?.sitesOnCell?.(cell)||[]).filter(s=>s.f===owner):[];
    const roles=[];
    if(showDetail&&cap)roles.push('capital');
    else if(showDetail&&hist)roles.push('historic');
    if(showDetail&&industries3212.has(cell))roles.push('industry');
    for(const s of specials)roles.push(entryRole(s));
    const coords=new Map();
    if(city)coords.set('city',[point[0],point[1]]);
    // Incluso sin ciudad, una capital no queda oculta por la carretera.
    if(!city&&cap&&!showDetail)coords.set('capital',[point[0],point[1]]);
    const shore=hasPort?portPosition(cell,point):null;
    if(hasPort&&shore)coords.set('port',[shore.x,shore.y]);
    else if(hasPort)roles.push('port');
    const central=!city&&!cap&&!hasPort&&roles.length?roles.shift():null;
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
    const color=COLORS[type]||'#c2d4e1';
    ctx.fillStyle='rgba(2,12,21,.92)';
    ctx.strokeStyle='rgba(3,10,18,.95)';
    ctx.lineWidth=2.6;
    ctx.beginPath();ctx.arc(0,0,r+1.65,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#113044';ctx.strokeStyle=color;ctx.lineWidth=1.25;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.scale(r/9,r/9);
    ctx.strokeStyle='#f1f7fa';ctx.fillStyle='#e5f1f7';
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
    }else if(type==='industry'||['refinery','gasplant','steel','smelter','sawmill','cement','foodplant'].includes(type)){
      line(-6,4.5,-6,-1,-2,1,1,-1,4,1,4,-4.2,6,-4.2,6,4.5,-6,4.5);
      ctx.fillRect(-3,2.5,1.8,1.3);ctx.fillRect(.3,2.5,1.8,1.3);
      if(type!=='industry'){
        const label={refinery:'R',gasplant:'G',steel:'S',smelter:'M',
          sawmill:'W',cement:'C',foodplant:'A'}[type];
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
    }else if(type==='iron'||type==='copper'){
      line(-5,-4.7,4.5,4.5);line(-4,0,-1,-3,1,-4,4,-4.3);
      ctx.font='bold 5.5px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(type==='iron'?'Fe':'Cu',0,5);
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
    drawGlobeCityIcon3249=function(x,y,cell){landIcon('city',x,y,cell)};
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
    frame={R,cx,cy,L,layouts:new Map(),historic:new Set()};
    rendered={city:0,port:0,capital:0,industry:0,special:0};
    if(zoom>=DETAIL_ZOOM&&typeof historicCapital3230!=='undefined'){
      for(let f=0;f<activeFactionCount3230;f++){
        const old=historicCapital3230[f],cap=capitals[f];
        if(old>=0&&old!==cap&&owner6[old]===f)frame.historic.add(old);
      }
    }
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
      // A zoom lejano solamente quedan ciudades; las capitales sin ciudad
      // mantienen su estrella para evitar desaparecer completamente.
      if(zoom<2.16&&zoom>=1.3){
        for(let f=0;f<activeFactionCount3230;f++){
          const cell=capitals[f];
          if(cell<0||owner6[cell]!==f)continue;
          if(zoom<1.65&&f!==0)continue;
          const p=centerPoint(cell);
          if(!p||p[2]<.10||p[0]<-20||p[0]>vw+20||p[1]<-20||p[1]>vh+20)continue;
          badge(p[0],p[1],cities3212.has(cell)?'city':'capital',f===0?1.1:1);
        }
      }
      if(zoom>=DETAIL_ZOOM){
        // Histórico primero, capitales actuales al final: siempre POR ENCIMA
        // de carreteras, ciudades, puertos y explotaciones.
        for(const cell of frame.historic){
          const p=centerPoint(cell);
          if(!p||p[2]<.10||p[0]<-28||p[0]>vw+28||p[1]<-28||p[1]>vh+28)continue;
          const xy=iconPosition(cell,'historic',p[0],p[1]);
          badge(xy[0],xy[1],'historic',.86);
        }
        for(let f=0;f<activeFactionCount3230;f++){
          const cell=capitals[f];
          if(cell<0||owner6[cell]!==f)continue;
          const p=centerPoint(cell);
          if(!p||p[2]<.10||p[0]<-28||p[0]>vw+28||p[1]<-28||p[1]>vh+28)continue;
          const xy=iconPosition(cell,'capital',p[0],p[1]);
          badge(xy[0],xy[1],'capital',f===0?1.05:.94);rendered.capital++;
        }
      }
    }
    frame=null;
    return output;
  };
  window.HexategosMapIcons03812={
    active:true,version:VERSION,
    positionFor:(cell,role)=>{
      // Sin un fotograma activo, la proyección depende del giro del globo.
      const v=frame?.layouts.get(cell)?.coords.get(role);
      return v?[...v]:null;
    },
    metrics:()=>({...rendered}),
    coastalNeighbours:cell=>[...coastNeighbours(cell)],
    zooms:{detail:DETAIL_ZOOM,production:PRODUCTION_ZOOM,aiProduction:AI_PRODUCTION_ZOOM}
  };
  console.info('[HEXATEGOS] '+VERSION+' · ciudades centrales, puertos costeros, capitales sobre carreteras, iconos vectoriales.');
})();