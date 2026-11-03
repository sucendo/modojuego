'use strict';
// Production-function regression for the closed-lap time-optimised racing reference.
// Tests deterministic lateral exploration, physical road containment and the
// promise that the original trajectory is retained if the time proxy does not improve.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../parts/part-024.txt'),'utf8');
const start=src.indexOf('function driverPhysicalSpeedFromCurvature('),
      end=src.indexOf('function prepareDriverReferenceModel(',start);
assert.ok(start>=0&&end>start,'Extract actual time-reference optimizer from production');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const mod=(v,n)=>(v%n+n)%n;
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
let wet=false,allowOutside=false;
const ctx={Math,Number,Float32Array,clamp,mod,angleDiff,
 finite:(v,fallback)=>Number.isFinite(v)?v:fallback,
 apexWeatherIsWet:()=>wet,bankAt:()=>0,
 apexDrivableAreaContains:(x,z)=>allowOutside||Math.abs(Math.hypot(x,z)-150)<=3.00};
vm.createContext(ctx);
vm.runInContext(src.slice(start,end),ctx);
const n=240,baseR=150,step=2*Math.PI*baseR/n;
function build(){
 const P=[],cx=new Float32Array(n),cz=new Float32Array(n),
 ch=new Float32Array(n),px=new Float32Array(n),pz=new Float32Array(n),
 pathSafe=new Float32Array(n);
 for(let i=0;i<n;i++){
  const a=2*Math.PI*i/n;
  P.push([baseR*Math.cos(a),baseR*Math.sin(a)]);
  cx[i]=P[i][0];cz[i]=P[i][1];
  // Deliberately inefficient lane oscillation: the optimiser must smooth it
  // without escaping a physically valid ±3 m racing ribbon.
  const radius=baseR+1.55*Math.sin(10*a);
  px[i]=radius*Math.cos(a);pz[i]=radius*Math.sin(a);
  pathSafe[i]=2.92;
 }
 for(let i=0;i<n;i++){
  const p=P[mod(i-2,n)],q=P[mod(i+2,n)];
  ch[i]=Math.atan2(q[0]-p[0],q[1]-p[1]);
 }
 return{P,cx,cz,ch,px,pz,pathSafe};
}
function solve(){
 const t=build(),before=ctx.driverTimeRacingProxy(t.px,t.pz,step);
 const result=ctx.driverTimeOptimizeRacingPath(t.P,t.cx,t.cz,t.ch,t.px,t.pz,t.pathSafe,step);
 assert.ok(result.after<=before+1e-8,'Cannot regress the full-cycle time proxy');
 assert.ok(result.before===before);
 for(let i=0;i<n;i++){
  const d=Math.hypot(t.px[i]-t.P[i][0],t.pz[i]-t.P[i][1]);
  assert.ok(d<=t.pathSafe[i]+.002,'Track clearance violated at '+i+': '+d);
  assert.ok(Math.abs(Math.hypot(t.px[i],t.pz[i])-baseR)<=3.001,'Drivable polygon at '+i);
 }
 return{result,x:Array.from(t.px),z:Array.from(t.pz)};
}
const one=solve(),two=solve();
assert.deepEqual(one,two,'Reference optimisation must be reproducible for an unchanged SVG');
assert.ok(one.result.accepted>0,'Must actually optimise inefficient curve sequence');
assert.ok(one.result.after<one.result.before,'Optimised line must lower time proxy');
assert.ok(one.result.largestShift>0,'Search must use available track width');
assert.match(src,/const timeLine=driverTimeOptimizeRacingPath\(P,cx,cz,ch,px,pz,pathSafe,step\)/);
assert.match(src,/curbAccess=!wallish&&Number\.isFinite\(env\.curb\)/);
assert.match(src,/trackData\.model\.driver=\{[^\n]*timeLine\}/);
wet=true;const wetModel=solve();assert.ok(wetModel.result.after<=wetModel.result.before,'Wet model cannot accept a worse line');
console.log(JSON.stringify({test:'aut-time-optimal-line',passed:true,accepted:one.result.accepted,
 timeProxyBefore:one.result.before,timeProxyAfter:one.result.after,
 maxSingleControlShiftM:one.result.largestShift,wetStatus:wetModel.result.status}));
