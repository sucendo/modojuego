'use strict';

// HEXATEGOS 0.37.8 · IDENTIDAD VISUAL NACIONAL.
// Tráfico fino desde zoom 25. Convoyes y flotas desde zoom 15.
// Las flotas conservan simulación discreta pero se interpolan visualmente.
(() => {
  const BUILD='0.37.8';
  const TRAFFIC_MIN_ZOOM0378=25;
  const NAVAL_MIN_ZOOM0378=15;
  const NAVAL_VISUAL_STEP_MS0378=1320;

  function factionColor0378(f){
    f=Number.isInteger(f)?f:0;
    if(f===0)return (FACTIONS3230?.[0]?.color)||(typeof PLAYER_COLOR!=='undefined'?PLAYER_COLOR:'#2f91ff');
    return FACTIONS3230?.[f]?.color||'#8da9c2';
  }

  function drawBlueSeaPath0378(path,R,cx,cy,C,alpha=.38){
    if(!Array.isArray(path)||path.length<2)return;
    ctx.beginPath();let started=false;
    const stride=Math.max(1,Math.floor(path.length/90));
    for(let i=0;i<path.length;i+=stride){
      const cell=path[i],j=cell*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(p[2]<.02){started=false;continue}
      if(!started){ctx.moveTo(p[0],p[1]);started=true}else ctx.lineTo(p[0],p[1]);
    }
    const last=path[path.length-1],j=last*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
    if(p[2]>=.02){if(!started)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1])}
    ctx.setLineDash([2.5,3.5]);
    ctx.strokeStyle='rgba(99,206,226,'+alpha+')';
    ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
  }

  function drawTransportColor0378(R,cx,cy,now,C){
    if(zoom<NAVAL_MIN_ZOOM0378||!Array.isArray(fleets3212)||!fleets3212.length)return;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(const tr of fleets3212){
      const route=ensureFleetSeaRoute3261(tr);
      if(!route?.length)continue;
      drawBlueSeaPath0378(route,R,cx,cy,C,.36);

      const t=Math.max(0,Math.min(.9999,(now-tr.start)*Math.max(1,gameSpeed3212)/Math.max(1,tr.duration)));
      const pos=t*(route.length-1),i=Math.floor(pos),q=pos-i;
      const a=route[Math.min(i,route.length-1)],b=route[Math.min(i+1,route.length-1)];
      const ia=a*3,ib=b*3;
      let v;
      if(a===b)v=[C[ia]/32767,C[ia+1]/32767,C[ia+2]/32767];
      else{
        const av=[C[ia]/32767,C[ia+1]/32767,C[ia+2]/32767],
              bv=[C[ib]/32767,C[ib+1]/32767,C[ib+2]/32767];
        v=slerp3212(av,bv,q);
      }
      const p=projectVec(v[0],v[1],v[2],R,cx,cy);
      if(p[2]<=.02||p[0]<-12||p[0]>vw+12||p[1]<-12||p[1]>vh+12)continue;
      const fac=Number.isInteger(tr.f)?tr.f:0,col=factionColor0378(fac),r=3.45;
      ctx.beginPath();
      ctx.moveTo(p[0],p[1]-r);
      ctx.lineTo(p[0]+r*.82,p[1]);
      ctx.lineTo(p[0],p[1]+r);
      ctx.lineTo(p[0]-r*.82,p[1]);
      ctx.closePath();
      ctx.fillStyle=col;ctx.fill();
      ctx.lineWidth=1;ctx.strokeStyle='rgba(3,10,16,.94)';ctx.stroke();
    }
    ctx.restore();
  }

  function visibleNavalRoute0378(g){
    if(!Array.isArray(g.route)||!g.route.length)return null;
    const pos=Math.max(0,g.routePos||0);
    if(g.order==='patrol'){
      return [g.cell,...g.route.slice(pos,pos+3)].filter((v,i,a)=>i===0||v!==a[i-1]);
    }
    return g.route.slice(pos);
  }

  // Internal naval simulation keeps its efficient 1.4 s tick. We remember the
  // cells crossed by that tick and animate through them until the next tick.
  const baseNavalAdvance0378=navalAdvanceGroup3270;
  navalAdvanceGroup3270=function(g){
    const from=g?.cell;
    const route=Array.isArray(g?.route)?g.route.slice():null;
    const fromPos=Math.max(0,g?.routePos||0);
    const out=baseNavalAdvance0378.apply(this,arguments);
    const to=g?.cell;
    if(Number.isInteger(from)&&Number.isInteger(to)&&from!==to){
      let segment=[from,to];
      if(route?.length){
        let toPos=route.indexOf(to,fromPos);
        if(toPos<0)toPos=Math.min(route.length-1,fromPos+7);
        segment=route.slice(fromPos,toPos+1);
        if(segment[0]!==from)segment.unshift(from);
        if(segment[segment.length-1]!==to)segment.push(to);
      }
      g._visualSegment0378=segment;
      g._visualStart0378=performance.now();
      g._visualDuration0378=NAVAL_VISUAL_STEP_MS0378;
    }
    return out;
  };

  function navalVisualPosition0378(g,now,C,R,cx,cy){
    const seg=g._visualSegment0378;
    const start=Number(g._visualStart0378)||0;
    const duration=Math.max(1,Number(g._visualDuration0378)||NAVAL_VISUAL_STEP_MS0378);
    if(Array.isArray(seg)&&seg.length>=2&&now-start<duration){
      const phase=Math.max(0,Math.min(.999999,(now-start)/duration));
      const x=phase*(seg.length-1),i=Math.floor(x),q=x-i;
      const a=seg[i],b=seg[Math.min(seg.length-1,i+1)],ia=a*3,ib=b*3;
      const av=[C[ia]/32767,C[ia+1]/32767,C[ia+2]/32767],
            bv=[C[ib]/32767,C[ib+1]/32767,C[ib+2]/32767];
      const v=a===b?av:slerp3212(av,bv,q);
      const p=projectVec(v[0],v[1],v[2],R,cx,cy);
      return {p,moving:true};
    }
    const j=g.cell*3;
    return {p:projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy),moving:false};
  }

  function drawNavalGroupsColor0378(R,cx,cy,now,C){
    if(zoom<NAVAL_MIN_ZOOM0378||!Array.isArray(navalGroups3270)||!navalGroups3270.length)return;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    let animate=false;

    for(const g of navalGroups3270){
      if(g.f>0&&relations3220[g.f]>=2)continue;

      const route=visibleNavalRoute0378(g);
      if(route?.length)drawBlueSeaPath0378(route,R,cx,cy,C,.36);

      const vis=navalVisualPosition0378(g,now,C,R,cx,cy),p=vis.p;
      if(vis.moving)animate=true;
      if(!p||p[2]<.025||p[0]<-14||p[0]>vw+14||p[1]<-14||p[1]>vh+14)continue;

      const r=3.4+Math.min(2,g.strength/14);
      ctx.beginPath();
      ctx.moveTo(p[0],p[1]-r);
      ctx.lineTo(p[0]+r*.85,p[1]+r*.65);
      ctx.lineTo(p[0]-r*.85,p[1]+r*.65);
      ctx.closePath();
      ctx.fillStyle=factionColor0378(g.f);ctx.fill();
      ctx.strokeStyle='rgba(3,11,18,.94)';ctx.lineWidth=1;ctx.stroke();
    }
    ctx.restore();

    // Only request continuous frames while a fleet is visibly interpolating.
    if(animate)needsRender=true;
  }

  const baseDrawFleets0378=drawFleetsSea3261;
  drawFleetsSea3261=function(R,cx,cy,now,C){
    // Suppress legacy generic cyan/red naval markers; the simulation arrays are
    // restored immediately and our national-colour layer draws them once.
    const savedTransports=fleets3212,savedGroups=navalGroups3270;
    let out;
    try{
      fleets3212=[];navalGroups3270=[];
      out=baseDrawFleets0378.apply(this,arguments);
    }finally{
      fleets3212=savedTransports;navalGroups3270=savedGroups;
    }
    drawTransportColor0378(R,cx,cy,now,C);
    drawNavalGroupsColor0378(R,cx,cy,now,C);
    return out;
  };

  window.HexategosNationalVisuals0378={
    version:BUILD,
    color:factionColor0378,
    trafficMinZoom:TRAFFIC_MIN_ZOOM0378,
    navalMinZoom:NAVAL_MIN_ZOOM0378,
    validate:()=>({
      ok:true,
      convoyCount:Array.isArray(fleets3212)?fleets3212.length:0,
      fleetCount:Array.isArray(navalGroups3270)?navalGroups3270.length:0,
      trafficMinZoom:TRAFFIC_MIN_ZOOM0378,
      navalMinZoom:NAVAL_MIN_ZOOM0378,
      smoothNaval:true
    })
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.37.8 · tráfico desde zoom 25 · flotas desde zoom 15 · movimiento naval continuo');
})();
