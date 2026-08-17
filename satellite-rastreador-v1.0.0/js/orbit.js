import * as satellite from 'https://cdn.jsdelivr.net/npm/satellite.js@7.1.0/+esm';
import { EARTH_MU_KM3_S2, EARTH_RADIUS_KM } from './config.js';
import { clamp, deg, normLon, rad } from './utils.js';

export { satellite };

export function createSatrec(record){
  try{
    if (record.omm) return satellite.json2satrec(record.omm);
    if (record.l1 && record.l2) return satellite.twoline2satrec(record.l1.trim(), record.l2.trim());
  }catch(err){ console.warn('No se pudo crear SatRec', err); }
  return null;
}

export function parseTleBlock(text){
  const lines=String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const i1=lines.findIndex(l=>/^1\s/.test(l));
  if(i1<0) return null;
  const l2=lines.slice(i1+1).find(l=>/^2\s/.test(l));
  return l2 ? {l1:lines[i1],l2} : null;
}

export function tleChecksumOk(line){
  if(!line || line.length<69) return false;
  const check=line.slice(68,69);
  if(!/^\d$/.test(check)) return false;
  let sum=0;
  for(let i=0;i<68;i++){
    const ch=line[i];
    if(ch>='0'&&ch<='9') sum += ch.charCodeAt(0)-48;
    else if(ch==='-') sum += 1;
  }
  return sum%10===Number(check);
}

export function julianToDate(jd){
  if(!Number.isFinite(jd)) return null;
  return new Date((jd - 2440587.5)*86400000);
}

export function getEpoch(record, satrec){
  if(record.omm?.EPOCH){ const d=new Date(record.omm.EPOCH.endsWith('Z')?record.omm.EPOCH:`${record.omm.EPOCH}Z`); if(!Number.isNaN(d.getTime())) return d; }
  return julianToDate(satrec?.jdsatepoch);
}

export function orbitalElements(record, satrec){
  const omm=record.omm || {};
  const meanMotion=Number(omm.MEAN_MOTION) || (Number.isFinite(satrec?.no) ? satrec.no*1440/(2*Math.PI) : NaN);
  const eccentricity=Number.isFinite(Number(omm.ECCENTRICITY)) ? Number(omm.ECCENTRICITY) : satrec?.ecco;
  const inclination=Number.isFinite(Number(omm.INCLINATION)) ? Number(omm.INCLINATION) : (Number.isFinite(satrec?.inclo)?deg(satrec.inclo):NaN);
  const periodMin=Number.isFinite(meanMotion)&&meanMotion>0 ? 1440/meanMotion : NaN;
  const nRadSec=Number.isFinite(meanMotion)&&meanMotion>0 ? meanMotion*2*Math.PI/86400 : NaN;
  const semiMajorKm=Number.isFinite(nRadSec) ? Math.cbrt(EARTH_MU_KM3_S2/(nRadSec*nRadSec)) : NaN;
  const perigeeKm=Number.isFinite(semiMajorKm)&&Number.isFinite(eccentricity) ? semiMajorKm*(1-eccentricity)-EARTH_RADIUS_KM : NaN;
  const apogeeKm=Number.isFinite(semiMajorKm)&&Number.isFinite(eccentricity) ? semiMajorKm*(1+eccentricity)-EARTH_RADIUS_KM : NaN;
  return {meanMotion,eccentricity,inclination,periodMin,semiMajorKm,perigeeKm,apogeeKm};
}

export function propagateState(satrec, date){
  try{
    return satellite.propagate(satrec,new Date(date),{communityDecayCheckEnabled:true});
  }catch{
    try{return satellite.propagate(satrec,new Date(date));}catch{return null;}
  }
}

export function toGeodetic(positionEci, date){
  const gmst=satellite.gstime(new Date(date));
  const gd=satellite.eciToGeodetic(positionEci,gmst);
  return {lat:satellite.degreesLat(gd.latitude),lon:satellite.degreesLong(gd.longitude),altKm:gd.height};
}

export function lookAngles(satrec, date, observer){
  if(!observer) return null;
  const state=propagateState(satrec,date); if(!state) return null;
  const gmst=satellite.gstime(new Date(date));
  const ecf=satellite.eciToEcf(state.position,gmst);
  const obs={longitude:rad(observer.lon),latitude:rad(observer.lat),height:(observer.altMeters||0)/1000};
  const look=satellite.ecfToLookAngles(obs,ecf);
  return {azimuthDeg:deg(look.azimuth),elevationDeg:deg(look.elevation),rangeKm:look.rangeSat,state};
}

export function sunSubpoint(date){
  const d=new Date(date), jd=satellite.jday(d), {rsun}=satellite.sunPos(jd), gmst=satellite.gstime(d);
  const rxy=Math.hypot(rsun.x,rsun.y);
  const lat=deg(Math.atan2(rsun.z,rxy));
  const lon=normLon(deg(Math.atan2(rsun.y,rsun.x)-gmst));
  return {lat,lon,rsun};
}

export function observerSunElevation(date, observer){
  if(!observer) return NaN;
  const s=sunSubpoint(date);
  const cosz=Math.sin(rad(observer.lat))*Math.sin(rad(s.lat))+Math.cos(rad(observer.lat))*Math.cos(rad(s.lat))*Math.cos(rad(normLon(observer.lon-s.lon)));
  return deg(Math.asin(clamp(cosz,-1,1)));
}

export function shadowInfo(positionEci,date){
  try{
    const {rsun}=satellite.sunPos(satellite.jday(new Date(date)));
    const fraction=clamp(satellite.shadowFraction(rsun,positionEci),0,1);
    const state=fraction<=0.001?'sunlight':fraction>=0.999?'umbra':'penumbra';
    return {fraction,state};
  }catch{return {fraction:NaN,state:'unknown'};}
}

export function snapshot(record,date,observer=null){
  const satrec=record.satrec || createSatrec(record); if(!satrec) return null;
  const state=propagateState(satrec,date); if(!state) return null;
  const gd=toGeodetic(state.position,date);
  const speedKms=Math.hypot(state.velocity.x,state.velocity.y,state.velocity.z);
  let look=null;
  if(observer){
    const gmst=satellite.gstime(new Date(date));
    const ecf=satellite.eciToEcf(state.position,gmst);
    const obs={longitude:rad(observer.lon),latitude:rad(observer.lat),height:(observer.altMeters||0)/1000};
    const a=satellite.ecfToLookAngles(obs,ecf);
    look={azimuthDeg:deg(a.azimuth),elevationDeg:deg(a.elevation),rangeKm:a.rangeSat};
  }
  const shadow=shadowInfo(state.position,date);
  const sunElevation=observer ? observerSunElevation(date,observer) : NaN;
  return {...gd,speedKms,positionEci:state.position,velocityEci:state.velocity,look,shadow,sunElevation,state};
}

export function footprintRadiusMeters(altKm,minElevationDeg=0){
  const r=EARTH_RADIUS_KM+Math.max(Number(altKm)||0,.001), k=EARTH_RADIUS_KM/r, e=rad(clamp(Number(minElevationDeg)||0,0,89.9));
  const cosE=Math.cos(e), sinE=Math.sin(e);
  const cosPsi=k*cosE*cosE + sinE*Math.sqrt(Math.max(0,1-k*k*cosE*cosE));
  const psi=Math.acos(clamp(cosPsi,-1,1));
  return EARTH_RADIUS_KM*psi*1000;
}

export function splitAntimeridian(points){
  const segments=[]; let seg=[]; let prev=null;
  for(const p of points){
    if(prev && Math.abs(p[1]-prev[1])>180){ if(seg.length>1) segments.push(seg); seg=[]; }
    seg.push(p); prev=p;
  }
  if(seg.length>1) segments.push(seg);
  return segments;
}

export function buildTrack(record,date,pastMinutes=60,futureMinutes=60){
  const satrec=record.satrec || createSatrec(record); if(!satrec) return {past:[],future:[]};
  const center=new Date(date).getTime();
  const sample=(fromMin,toMin)=>{
    const span=Math.max(Math.abs(fromMin),Math.abs(toMin));
    const stepSec=span>120?60:30;
    const pts=[];
    const start=Math.round(fromMin*60), end=Math.round(toMin*60), dir=start<=end?1:-1;
    for(let sec=start; dir>0?sec<=end:sec>=end; sec+=dir*stepSec){
      const d=new Date(center+sec*1000), st=propagateState(satrec,d); if(!st) continue;
      const gd=toGeodetic(st.position,d); pts.push([gd.lat,gd.lon]);
    }
    return splitAntimeridian(pts);
  };
  return {past:sample(-pastMinutes,0),future:sample(0,futureMinutes)};
}

export function tleNoradId(l1){
  const m=String(l1||'').match(/^1\s+([0-9A-Z]+)/); return m?m[1]:null;
}
