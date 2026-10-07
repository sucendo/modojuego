'use strict';

// HEXATEGOS 0.37.8 · IDENTIDAD VISUAL NACIONAL.
// Colorea convoyes y flotas por nación. Las rutas marítimas mantienen
// el azul claro discontinuo común para preservar legibilidad.
(() => {
  const BUILD='0.37.8';

  function factionColor0378(f){
    f=Number.isInteger(f)?f:0;
    if(f===0)return (FACTIONS3230?.[0]?.color)||(typeof PLAYER_COLOR!=='undefined'?PLAYER_COLOR:'#2f91ff');
    return FACTIONS3230?.[f]?.color||'#8da9c2';
  }

  function drawTransportColor0378(R,cx,cy,now,C){
    if(!Array.isArray(fleets3212)||!fleets3212.length)return;
    ctx.save();
    for(const tr of fleets3212){
      const route=ensureFleetSeaRoute3261(tr);
      if(!route?.length)continue;
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
      const f=Number.isInteger(tr.f)?tr.f:0,col=factionColor0378(f);
      const r=3.25;
      // Convoy / barco: rombo náutico compacto sobre el marcador legacy.
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

  function drawNavalGroupsColor0378(R,cx,cy,C){
    if(!Array.isArray(navalGroups3270)||!navalGroups3270.length||zoom<1.05)return;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';

    for(const g of navalGroups3270){
      // Mantiene el filtro de clutter ya usado por el juego.
      if(g.f>0&&relations3220[g.f]>=2)continue;

      const route=visibleNavalRoute0378(g);
      if(route?.length&&zoom>1.65){
        ctx.beginPath();let started=false;
        const stride=Math.max(1,Math.floor(route.length/80));
        for(let k=0;k<route.length;k+=stride){
          const c=route[k],j=c*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
          if(p[2]<.02){started=false;continue}
          if(!started){ctx.moveTo(p[0],p[1]);started=true}else ctx.lineTo(p[0],p[1]);
        }
        ctx.setLineDash([2,3]);
        ctx.strokeStyle='rgba(99,206,226,.36)';
        ctx.lineWidth=1.05;ctx.stroke();ctx.setLineDash([]);
      }

      const j=g.cell*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(p[2]<.025||p[0]<-14||p[0]>vw+14||p[1]<-14||p[1]>vh+14)continue;
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
  }

  const baseDrawFleets0378=drawFleetsSea3261;
  drawFleetsSea3261=function(R,cx,cy,now,C){
    const out=baseDrawFleets0378.apply(this,arguments);
    drawTransportColor0378(R,cx,cy,now,C);
    drawNavalGroupsColor0378(R,cx,cy,C);
    return out;
  };

  window.HexategosNationalVisuals0378={
    version:BUILD,
    color:factionColor0378,
    trafficMinZoom:25,
    validate:()=>({
      ok:true,
      convoyCount:Array.isArray(fleets3212)?fleets3212.length:0,
      fleetCount:Array.isArray(navalGroups3270)?navalGroups3270.length:0,
      trafficMinZoom:25
    })
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.37.8 · tráfico, barcos y flotas con color nacional · puntitos desde zoom 25');
})();
