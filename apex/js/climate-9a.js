/* APEX 9A.5 — previsión ESTIMADA para un juego, nunca meteorología real.
 * Usa el circuito y la época estimada del calendario; entrega presets del motor existente.
 */
(function(global){
'use strict';
const PRESETS=['CLEAR','PARTLY','OVERCAST','DRIZZLE','RAIN','STORM','VARIABLE'];
const MONTHS=[3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10,10,11,12];
const LAT_HINTS=[
 [/australia|melbourne|albert/i,-38],[/bahrain|sakhir/i,26],[/saudi|jeddah|arabia/i,22],
 [/japan|suzuka/i,35],[/china|shanghai/i,31],[/miami|florida/i,26],
 [/imola|emilia/i,44],[/monaco|montecarlo/i,44],[/canada|montreal/i,46],
 [/barcelona|catalu/i,41],[/austria|spielberg/i,47],[/britain|silverstone|united.kingdom/i,52],
 [/belgium|spa/i,50],[/hungary|hungaroring/i,47],[/netherlands|zandvoort/i,52],
 [/italy|monza/i,45],[/madrid|spain|espa.a/i,40],[/azerbaijan|baku/i,40],
 [/singapore|marina.bay/i,1],[/austin|texas/i,30],[/mexico/i,19],
 [/brazil|sao.paulo|interlagos/i,-23],[/las.vegas/i,36],[/qatar|lusail/i,25],
 [/abu.dhabi|yas.marina/i,24]
];
function checksum(s){
 let h=2166136261;
 for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),16777619);}
 return (h>>>0)/4294967296;
}
function location(spec){
 const s=spec&&typeof spec==='object'?spec:{};
 const explicit=Number(s.lat??s.latitude??s.location?.lat);
 if(Number.isFinite(explicit)&&Math.abs(explicit)<=90&&explicit!==0)return explicit;
 const key=[s.dir,s.name,s.country,s.id].filter(Boolean).join(' ');
 for(const [re,lat] of LAT_HINTS)if(re.test(key))return lat;
 return null;
}
function forecast(spec,round=0){
 const s=spec&&typeof spec==='object'?spec:{};
 const idx=Math.max(0,Math.min(22,Number.isInteger(+round)?+round:0));
 const month=MONTHS[idx],lat=location(s),name=String(s.dir||s.name||'circuito');
 const southern=lat!==null&&lat<0;
 // Media estadística aproximada según latitud y época, con dispersión determinista.
 const winter=southern?[5,6,7,8]:[11,12,1,2];
 const summer=southern?[11,12,1,2]:[5,6,7,8];
 const wetBias=lat===null?0.48:Math.abs(lat)<15?0.59:Math.abs(lat)>48?0.60:0.43;
 const seasonal=winter.includes(month)?0.12:summer.includes(month)?-0.08:0.02;
 const jitter=checksum(name+':'+idx+':apex26-weather')-.5;
 const wet=Math.max(0,Math.min(1,wetBias+seasonal+jitter*.65));
 const preset=wet>.85?'RAIN':wet>.7?'DRIZZLE':wet>.54?'OVERCAST':wet>.38?'PARTLY':'CLEAR';
 return Object.freeze({preset,month,latitudeEstimated:lat,kind:'SIMULATED_SEASONAL_ESTIMATE',
  label:{CLEAR:'Despejado',PARTLY:'Intervalos nubosos',OVERCAST:'Nublado',DRIZZLE:'Llovizna',RAIN:'Lluvia'}[preset],
  disclaimer:'Estimación simulada por circuito y época aproximada; no es una previsión meteorológica real.'});
}
function resolvePreset(spec,round=0,selection){
 const state=global.ApexCompetition9A?.get?.();
 const selected=String(selection||state?.weather||'auto').toUpperCase();
 if(selected==='AUTO')return forecast(spec,round).preset;
 return PRESETS.includes(selected)?selected:'VARIABLE';
}
Object.defineProperty(global,'ApexClimate9A',{value:Object.freeze({forecast,resolvePreset,validPresets:PRESETS.slice()}),configurable:false});
})(window);
