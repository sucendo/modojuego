// Game climate, not a real-world forecast. Temperatures follow biome, solar
// hour and elevation; an explicit value also supports deterministic replays.
export function surfaceTemperature(type,weather={},height=12){
 if(Number.isFinite(weather.temperature))return weather.temperature;
 const base=({classic:4,mixed:4,snow:-8,jungle:22,desert:18,ocean:9,lava:45})[type]??4;
 const hour=Number.isFinite(weather.hour)?weather.hour:12;
 const sun=Math.max(0,Math.sin((hour-6)*Math.PI/12));
 let temperature=base+(sun-.5)*16-Math.max(0,height-12)*.18;
 if(weather.snow>.12)temperature=Math.min(-2,temperature);
 return temperature;
}

export function evolveSnow(record={},weather={},dt=0,type='classic',height=12){
 dt=Math.min(8,Math.max(0,dt));
 let depth=record.depth||0,ice=Math.min(depth,record.ice||0),cold=record.cold||0;
 const temperature=surfaceTemperature(type,weather,height),snow=Math.max(0,weather.snow||0);
 if(snow>.12&&temperature<=1)depth=Math.min(.18,depth+snow*.0025*dt);
 if(temperature<=0&&depth>.001){
  cold=Math.min(120,cold+dt);
  if(cold>=30)ice=Math.min(depth,ice+Math.min(6,-temperature)*.0008*dt);
 }else{
  cold=0;
  if(temperature>0){
   // Loose snow melts first; the remaining crust takes longer to thaw.
   const melt=(.00012*temperature+Math.max(0,weather.rain||0)*.005)*dt;
   depth=Math.max(ice,depth-melt);
   const thaw=Math.min(ice,(.000045*temperature+Math.max(0,weather.rain||0)*.001)*dt);
   ice-=thaw;depth=Math.max(0,depth-thaw);
  }
 }
 return {depth,ice:Math.min(ice,depth),cold};
}
