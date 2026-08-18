import { lookAngles, observerSunElevation, shadowInfo } from './orbit.js';

function refineCrossing(satrec,observer,t0,t1,minEl,targetAbove){
  let a=t0.getTime(), b=t1.getTime();
  for(let i=0;i<18 && b-a>700;i++){
    const m=(a+b)/2, look=lookAngles(satrec,new Date(m),observer), above=(look?.elevationDeg??-90)>=minEl;
    if(above===targetAbove) b=m; else a=m;
  }
  return new Date((a+b)/2);
}

function samplePass(satrec,observer,aos,los){
  let best=null, visibleSeconds=0, anyVisible=false;
  const start=aos.getTime(), end=los.getTime(), step=5000;
  for(let t=start;t<=end;t+=step){
    const d=new Date(t), look=lookAngles(satrec,d,observer); if(!look) continue;
    if(!best || look.elevationDeg>best.elevationDeg) best={date:d,...look};
    const shadow=shadowInfo(look.state.position,d), sunEl=observerSunElevation(d,observer);
    const visible=(shadow.fraction<0.98 && sunEl<=-6 && look.elevationDeg>0);
    if(visible){ anyVisible=true; visibleSeconds+=step/1000; }
  }
  if(!best) return null;
  const aosLook=lookAngles(satrec,aos,observer), losLook=lookAngles(satrec,los,observer);
  const bestShadow=shadowInfo(best.state.position,best.date), bestSunEl=observerSunElevation(best.date,observer);
  return {
    aos,los,maxTime:best.date,maxElevationDeg:best.elevationDeg,rangeKm:best.rangeKm,
    aosAzimuthDeg:aosLook?.azimuthDeg,losAzimuthDeg:losLook?.azimuthDeg,
    durationSec:(los-aos)/1000,observerSunElevationDeg:bestSunEl,shadowFraction:bestShadow.fraction,
    illumination:bestShadow.state,visibleAtMax:bestShadow.fraction<0.98 && bestSunEl<=-6,
    anyVisible,visibleSeconds
  };
}

export async function predictPasses(record,observer,startDate,{hours=48,minElevationDeg=10,maxPasses=12,onProgress}={}){
  if(!record?.satrec || !observer) return [];
  const satrec=record.satrec, start=new Date(startDate), end=start.getTime()+hours*3600000;
  const stepMs=30000;
  const passes=[];
  let prevDate=start, prevLook=lookAngles(satrec,prevDate,observer), prevAbove=(prevLook?.elevationDeg??-90)>=minElevationDeg;
  let aos=null;
  // Si la simulación comienza en mitad de un paso, buscamos hacia atrás el AOS real
  // para no presentar la hora de inicio como si fuese la adquisición de señal.
  if(prevAbove){
    let hi=start, lo=new Date(start.getTime()-stepMs);
    for(let back=0;back<240;back++){
      const lk=lookAngles(satrec,lo,observer), above=(lk?.elevationDeg??-90)>=minElevationDeg;
      if(!above){aos=refineCrossing(satrec,observer,lo,hi,minElevationDeg,true);break;}
      hi=lo;lo=new Date(lo.getTime()-stepMs);
    }
    if(!aos)aos=start;
  }
  let iterations=0;
  for(let t=start.getTime()+stepMs;t<=end;t+=stepMs){
    const d=new Date(t), look=lookAngles(satrec,d,observer), above=(look?.elevationDeg??-90)>=minElevationDeg;
    if(!prevAbove && above) aos=refineCrossing(satrec,observer,prevDate,d,minElevationDeg,true);
    if(prevAbove && !above && aos){
      const los=refineCrossing(satrec,observer,prevDate,d,minElevationDeg,false);
      const pass=samplePass(satrec,observer,aos,los); if(pass) passes.push(pass);
      aos=null;
      if(passes.length>=maxPasses) break;
    }
    prevDate=d; prevAbove=above;
    if(++iterations%300===0){ onProgress?.(Math.min(1,(t-start.getTime())/(hours*3600000))); await new Promise(r=>setTimeout(r,0)); }
  }
  return passes;
}
