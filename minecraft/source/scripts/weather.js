// Minecraft.js v9.2 — deterministic, world-local weather without Three.js.
// A forecast derives from the world seed, terrain type and saved world clock.
// No real-world timer or extra save fields are needed: imports replay the same weather.
import { DAY_MS } from './dayNight.js';

export const WEATHER_KINDS = Object.freeze(['clear','cloudy','rain','storm','snow','dust','ash']);
const CLIMATES = Object.freeze({
  classic: [['clear',34],['cloudy',30],['rain',21],['storm',11],['snow',4]],
  ocean:   [['clear',23],['cloudy',24],['rain',34],['storm',19]],
  jungle:  [['clear',19],['cloudy',22],['rain',35],['storm',24]],
  desert:  [['clear',65],['cloudy',18],['dust',17]],
  snow:    [['clear',22],['cloudy',28],['snow',44],['storm',6]],
  lava:    [['clear',20],['cloudy',31],['ash',49]]
});
const clamp = x => Math.max(0,Math.min(1,x));
const smooth = t => { t=clamp(t);return t*t*(3-2*t); };
function random01(seed,step,salt){
  let h=(Math.imul(seed|0,0x9e3779b1)^Math.imul(step|0,0x85ebca6b)^salt)>>>0;
  h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);
  return ((h^(h>>>16))>>>0)/4294967296;
}
export function forecastForPeriod(seed,worldType,period){
  const choices=CLIMATES[worldType]||CLIMATES.classic;
  let roll=random01(seed,period,0x41b09c23)*100;
  let kind=choices[choices.length-1][0];
  for(const [label,weight] of choices){roll-=weight;if(roll<0){kind=label;break;}}
  const variance=.75+.25*random01(seed,period,0x71c83739);
  const cover=({clear:.16,cloudy:.66,rain:.85,storm:.97,snow:.79,dust:.65,ash:.83})[kind]*variance;
  const fall=({rain:.68,storm:1,snow:.68,dust:.58,ash:.54})[kind]||0;
  const snowStorm=worldType==='snow'&&kind==='storm';
  const windAngle=random01(seed,period,0x176af561)*Math.PI*2;
  const windSpeed=(.45+random01(seed,period,0x32ac180f)*.85)*(kind==='storm'?2.15:1);
  return {kind,cloudCover:cover,rain:(kind==='rain'||kind==='storm')&&!snowStorm?fall:0,
    snow:kind==='snow'||snowStorm?fall:0,ash:kind==='ash'?fall:0,dust:kind==='dust'?fall:0,
    storm:kind==='storm'&&!snowStorm?1:0,windX:Math.cos(windAngle)*windSpeed,windZ:Math.sin(windAngle)*windSpeed};
}
export function sampleWeather(seed,worldType,clock){
  const timeMs=Number.isFinite(clock?.timeMs)?clock.timeMs:DAY_MS/3;
  const day=Number.isSafeInteger(clock?.day)?clock.day:1;
  const hours=(Math.max(1,day)-1)*24+timeMs/DAY_MS*24;
  // Four-hour weather periods; crossfade during the first ~24 s of a period.
  const period=Math.floor(hours/4),fraction=(hours/4)-period;
  const current=forecastForPeriod(seed,worldType,period);
  const previous=forecastForPeriod(seed,worldType,period-1);
  const blend=smooth(fraction/.12);
  const mix=(field)=>previous[field]+(current[field]-previous[field])*blend;
  const out={cloudCover:mix('cloudCover'),rain:mix('rain'),snow:mix('snow'),
    ash:mix('ash'),dust:mix('dust'),storm:mix('storm'),windX:mix('windX'),windZ:mix('windZ')};
  const precip=Math.max(out.rain,out.snow,out.ash,out.dust);
  if(out.storm>.42 && out.rain>.20)out.kind='storm';
  else if(precip>.14)out.kind=['rain','snow','ash','dust'].reduce((a,b)=>out[a]>=out[b]?a:b);
  else out.kind=out.cloudCover>.45?'cloudy':'clear';
  // Weather lightning is repeatable and only flashes during thunderstorms.
  // An event lasts ~120 ms at 20 min per in-game day.
  const strikeCycle=hours/.18, strikeIndex=Math.floor(strikeCycle), phase=strikeCycle-strikeIndex;
  out.lightning=out.storm>.45 && random01(seed,strikeIndex,0x156bb4ad)>.72 && phase<.013
    ? out.storm*(1-phase/.013):0;
  return out;
}
