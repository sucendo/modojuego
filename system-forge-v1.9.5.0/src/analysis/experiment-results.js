(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
const finite=x=>Number.isFinite(x);
const pct=(a,b)=>finite(a)&&finite(b)&&Math.abs(a)>1e-15?(b-a)/Math.abs(a)*100:null;
const ad=(a,b)=>finite(a)&&finite(b)?b-a:null;
function rowScore(r){
  let s=0;
  if(r.unboundNow)s+=12;
  if(finite(r.deltaAPct))s+=Math.min(10,Math.abs(r.deltaAPct)/12);
  if(finite(r.deltaE))s+=Math.min(5,Math.abs(r.deltaE)*6);
  if(finite(r.deltaIDeg))s+=Math.min(4,Math.abs(r.deltaIDeg)/12);
  if(finite(r.deltaSpecificEnergyPct))s+=Math.min(6,Math.abs(r.deltaSpecificEnergyPct)/30);
  if(finite(r.deltaHPercent))s+=Math.min(4,Math.abs(r.deltaHPercent)/25);
  if(r.dynamicStatus)s+=2;
  return s;
}
function compare(baseline,current,statusById={}){
  const cur=new Map((current.bodies||[]).map(b=>[b.id,b])),rows=[];
  for(const a of baseline.bodies||[]){
    const b=cur.get(a.id);if(!b)continue;
    const oa=a.osculating||{},ob=b.osculating||{};
    const r={id:a.id,name:a.name,kind:a.kind,parentBefore:a.parentName||null,parentAfter:b.parentName||null,
      aBefore:oa.aAU??null,aAfter:ob.aAU??null,eBefore:oa.e??null,eAfter:ob.e??null,iBefore:oa.iDeg??null,iAfter:ob.iDeg??null,
      deltaA:ad(oa.aAU,ob.aAU),deltaAPct:pct(oa.aAU,ob.aAU),deltaE:ad(oa.e,ob.e),deltaIDeg:ad(oa.iDeg,ob.iDeg),
      specificEnergyBefore:a.specificEnergy??null,specificEnergyAfter:b.specificEnergy??null,
      deltaSpecificEnergy:ad(a.specificEnergy,b.specificEnergy),deltaSpecificEnergyPct:pct(a.specificEnergy,b.specificEnergy),
      hBefore:a.specificAngularMomentum??null,hAfter:b.specificAngularMomentum??null,
      deltaHPercent:pct(a.specificAngularMomentum,b.specificAngularMomentum),
      unboundBefore:oa.e>=1||oa.aAU<0,unboundNow:ob.e>=1||ob.aAU<0,
      dynamicStatus:statusById[a.id]?.short||"",dynamicType:statusById[a.id]?.type||""};
    r.score=rowScore(r);rows.push(r);
  }
  rows.sort((a,b)=>b.score-a.score);
  const energyPct=current.approximate?null:pct(baseline.systemEnergy,current.systemEnergy),angularPct=current.approximate?null:pct(baseline.angularMomentumMagnitude,current.angularMomentumMagnitude);
  return {elapsedYears:(current.timeYears??0)-(baseline.timeYears??0),rows,ranking:rows.filter(r=>r.kind!=="structure").slice(0,12),
    system:{energyBefore:baseline.systemEnergy,energyAfter:current.systemEnergy,deltaEnergyPercent:energyPct,
      angularBefore:baseline.angularMomentumMagnitude,angularAfter:current.angularMomentumMagnitude,deltaAngularPercent:angularPct},
    approximate:!!current.approximate};
}
core.ExperimentResults={compare,rowScore};
})();