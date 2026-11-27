import {surfaceTemperature} from './snowEvolution.js';
export function evolveSoil(record={},weather={},dt=0,{type='classic',height=12,covered=false,wet=false,neighbor=false}={}){
 dt=Math.min(8,Math.max(0,dt));
 const temperature=surfaceTemperature(type,weather,height),hour=weather.hour??12,sun=Math.max(0,Math.sin((hour-6)*Math.PI/12));
 let moisture=record.moisture??.15,growth=record.growth||0,dry=record.dry||0;
 moisture=Math.max(0,Math.min(1,moisture+(wet?.1:Math.max(0,weather.rain||0)*.04)*dt-Math.max(0,temperature)*sun*.00012*dt));
 if(!covered&&!wet&&sun>.2&&temperature>0&&moisture>.28)growth=Math.min(1,growth+dt/(neighbor?75:240));
 else growth=Math.max(0,growth-dt/150);
 dry=moisture<.04&&temperature>22&&!covered?Math.min(240,dry+dt):0;
 return {moisture,growth,dry};
}
