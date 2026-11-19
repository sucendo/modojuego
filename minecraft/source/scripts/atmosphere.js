import { sampleWeather } from './weather.js';
import { CloudLayer } from './cloudLayer.js';
import { Precipitation } from './precipitation.js';
import { t, onLanguageChange } from './i18n.js';

/** Manages clouds and local weather in two draw calls + up to two particle calls. */
export class Atmosphere {
  constructor(scene,world){
    this.world=world;this.clouds=new CloudLayer(scene);this.precipitation=new Precipitation(scene,world);
    this.weather=sampleWeather(world.params.seed,world.type,{day:1,timeMs:400000});
    this.hud=document.getElementById('weather-hud');
    this.lastHud='';this.lastUpdate=-Infinity;
    onLanguageChange(()=>{this.lastHud='';this.refreshHud();});
  }
  update(clock,position,dt,active,now){
    if(now-this.lastUpdate>170){
      this.weather=sampleWeather(this.world.params.seed,this.world.type,clock);
      this.lastUpdate=now;
      this.hour=clock.hour ?? (clock.timeMs/1200000*24);
      this.refreshHud();
    }
    const weather=this.world.weatherEnabled?this.weather:{...this.weather,rain:0,snow:0,dust:0,ash:0,storm:0,cloudCover:.35,lightning:0};
    this.clouds.update(clock,position,this.world,weather,dt,active,now);
    this.precipitation.update(weather,position,dt,active,now,this.world.weatherEnabled);
    return weather;
  }
  refreshHud(){
    if(!this.hud)return;
    const weather=this.world.weatherEnabled?this.weather:{kind:'clear'};
    const icons={clear:'☀',cloudy:'☁',rain:'🌧',storm:'⛈',snow:'❄',dust:'🌫',ash:'🌋'};
    const label=t(`weather_${weather.kind}`);
    const skyIcon=weather.kind==='clear' && (this.hour>=19||this.hour<6)?'☾':icons[weather.kind];
    const signature=`${skyIcon} ${label}`;
    if(this.lastHud!==signature){this.hud.textContent=signature;this.hud.title=t('weatherForecastHelp');this.lastHud=signature;}
  }
}
