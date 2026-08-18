import { WEATHER_CACHE_MS } from './config.js';
import { fetchJson } from './utils.js';
import { Storage } from './storage.js';

function locationKey(observer){ return `${observer.lat.toFixed(2)}_${observer.lon.toFixed(2)}`.replace(/\./g,'p').replace(/-/g,'m'); }
function nearestIndex(times,date){
  const t=new Date(date).getTime(); let best=-1,delta=Infinity;
  for(let i=0;i<(times?.length||0);i++){ const d=Math.abs(new Date(times[i]+'Z').getTime()-t); if(d<delta){delta=d;best=i;} }
  return delta <= 90*60*1000 ? best : -1;
}

export class WeatherService {
  async get(observer,{force=false}={}){
    if(!observer) return null;
    const key=`weather.${locationKey(observer)}`, cached=Storage.getCache(key);
    if(!force && cached?.time && Date.now()-cached.time<WEATHER_CACHE_MS) return cached.data;
    const params=new URLSearchParams({
      latitude:String(observer.lat),longitude:String(observer.lon),timezone:'UTC',forecast_days:'3',
      current:'cloud_cover,precipitation,is_day,visibility,weather_code',
      hourly:'cloud_cover,precipitation_probability,visibility,weather_code'
    });
    const data=await fetchJson(`https://api.open-meteo.com/v1/forecast?${params.toString()}`,{cache:'no-store'});
    Storage.setCache(key,{time:Date.now(),data}); return data;
  }
  at(data,date){
    if(!data) return null;
    const idx=nearestIndex(data.hourly?.time,date);
    if(idx<0) return null;
    return {
      time:data.hourly.time[idx],cloud_cover:data.hourly.cloud_cover?.[idx],
      precipitation_probability:data.hourly.precipitation_probability?.[idx],visibility:data.hourly.visibility?.[idx],
      weather_code:data.hourly.weather_code?.[idx]
    };
  }
  score({weather,observerSunElevationDeg,satelliteLit,elevationDeg}){
    if(!weather) return {score:null,label:'Sin datos meteorológicos'};
    const cloud=Number(weather.cloud_cover??50), rain=Number(weather.precipitation_probability??0), vis=Number(weather.visibility??10000);
    let score=100 - cloud*.65 - rain*.2;
    if(vis<5000) score-=20; else if(vis<10000) score-=8;
    if(observerSunElevationDeg>-6) score-=35;
    if(!satelliteLit) score-=45;
    if(Number.isFinite(elevationDeg)) score += Math.min(12,Math.max(0,(elevationDeg-10)*.3));
    score=Math.max(0,Math.min(100,Math.round(score)));
    const label=score>=80?'Excelente':score>=65?'Buena':score>=45?'Regular':'Mala';
    return {score,label};
  }
}
