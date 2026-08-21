(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
const RATIOS=[[1,1],[2,1],[3,2],[4,3],[5,4],[5,3],[7,3],[3,1],[4,1],[5,2],[7,4]];
const refKey=b=>b.orbitReferenceId?"ref:"+b.orbitReferenceId:
  Array.isArray(b.orbitCenterIds)&&b.orbitCenterIds.length
  ?"bary:"+[...b.orbitCenterIds].sort().join("|"):"parent:"+(b.parent||"root");
core.findResonances=function(bodies,periodFn,tolerancePercent=1){
  const groups=new Map(),out=[];
  for(const b of bodies){
    const P=periodFn(b); if(!Number.isFinite(P)||P<=0)continue;
    const k=refKey(b); if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push({body:b,P});
  }
  for(const [referenceKey,items] of groups){
    items.sort((a,b)=>a.P-b.P);
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
      const inner=items[i],outer=items[j],actual=outer.P/inner.P;
      let best=null;
      for(const [n,d] of RATIOS){
        const target=n/d,errorPercent=Math.abs(actual-target)/target*100;
        if(!best||errorPercent<best.errorPercent)best={n,d,target,errorPercent};
      }
      if(best&&best.errorPercent<=tolerancePercent)out.push({
        referenceKey,innerId:inner.body.id,innerName:inner.body.name,
        outerId:outer.body.id,outerName:outer.body.name,ratio:`${best.n}:${best.d}`,
        actualRatio:actual,errorPercent:best.errorPercent
      });
    }
  }
  return out.sort((a,b)=>a.errorPercent-b.errorPercent);
};
core.findResonanceChains=function(resonances){
  const twos=resonances.filter(r=>r.ratio==="2:1"),out=[];
  for(const a of twos)for(const b of twos){
    if(a.outerId===b.innerId&&a.referenceKey===b.referenceKey)
      out.push({names:[a.innerName,a.outerName,b.outerName],ratio:"4:2:1",maxErrorPercent:Math.max(a.errorPercent,b.errorPercent)});
  }
  return out;
};
})();