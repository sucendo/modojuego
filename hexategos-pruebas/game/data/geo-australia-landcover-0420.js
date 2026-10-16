'use strict';(function(){
const rad=Math.PI/180,clamp=x=>Math.max(0,Math.min(1,x));
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-clamp(t))+b[i]*clamp(t)));
const g=(x,y,a,b,u,v)=>Math.exp(-.5*(((x-a)/u)**2+((y-b)/v)**2));
function evaluate(lat,lon){
 if(lon<111||lon>154.5||lat< -44.5||lat> -9)return null;
 const dry=g(lon,lat,130,-25,12,8),west=g(lon,lat,120,-24,6,9);
 const north=g(lon,lat,134,-15,15,5),rain=g(lon,lat,146,-17,4,7);
 const ridge=g(lon,lat,149,-29,3,10),south=g(lon,lat,145,-37,6,4);
 const southwest=g(lon,lat,116,-33,4,4),tas=g(lon,lat,146.5,-42,3,2.5);
 const weight=Math.max(dry,west,north,rain,ridge,south,southwest,tas)*.97;
 if(weight<.02)return null;
 let color=[151,155,109];
 color=mix(color,[194,163,110],Math.max(dry*.83,west*.75));
 color=mix(color,[187,133,92],dry*.48);
 color=mix(color,[148,159,100],north*.82);
 color=mix(color,[49,120,74],rain*.91);
 color=mix(color,[121,146,96],southwest*.83);
 color=mix(color,[77,132,89],Math.max(south*.85,tas*.96));
 color=mix(color,[119,128,106],ridge*.47);
 return {color,weight};
}
const cache=new Map();
function rgbForCell(key,i,L,base){
 if(L.land[i]<0)return base;
 const j=i*3,y=L.centers[j+1]/32767;
 if(y<Math.sin(-44.5*rad)||y>Math.sin(-9*rad))return base;
 const lon=Math.atan2(L.centers[j],L.centers[j+2])/rad;
 if(lon<111||lon>154.5)return base;
 let v=cache.get(key);
 if(!v||v.mesh!==L){v={mesh:L,values:new Map()};cache.set(key,v)}
 let e=v.values.get(i);
 if(e===undefined){e=evaluate(Math.asin(Math.max(-1,Math.min(1,y)))/rad,lon);v.values.set(i,e)}
 return e?mix(base,e.color,e.weight*.92):base;
}
window.HexategosAustraliaLandcover0420=Object.freeze({version:'0.42.0',evaluate,rgbForCell});
})();