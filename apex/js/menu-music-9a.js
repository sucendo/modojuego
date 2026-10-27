/* APEX Formula 26 · Endless Horizon V4, banda sonora circular de 8:10.
 * Piano y nuevos arreglos sobre la canción original del usuario.
 * Preparada OFFLINE como MP3 LAME gapless, sin síntesis durante el juego.
 * Audio activado voluntariamente, en bucle y suspendido al iniciar carrera.
 */
(function(global){
'use strict';
const KEY='apex26.menu-music.v1'; // Conserva la preferencia de APEX 9A.
const FILE='assets/music/apex-theme-v4-endless-horizon.mp3';
const VOLUME=0.33;
const $=id=>document.getElementById(id);
let enabled=false,unlocked=false,audio=null,starting=false;
function menuVisible(){
 const el=$('menu');
 return !!el&&!el.classList.contains('hidden')&&!document.hidden;
}
function updateButton(){
 const b=$('apex9aAudio');
 if(b){
  const span=b.querySelector('span');
  if(span)span.textContent=enabled?'MÚSICA ✓':'MÚSICA';
  else b.textContent=enabled?'MÚSICA: ACTIVADA':'MÚSICA: DESACTIVADA';
  b.setAttribute('aria-label',enabled?'Desactivar música de APEX 26':'Activar música de APEX 26');
  b.setAttribute('aria-pressed',String(enabled));
  b.title=enabled?'Endless Horizon · detener':'Endless Horizon · reproducir';
 }
 const option=$('apexProtoAudioText');
 if(option){
  option.textContent=enabled?'MÚSICA ACTIVADA':'ACTIVAR MÚSICA';
  option.setAttribute('aria-pressed',String(enabled));
 }
}
function getAudio(){
 if(audio)return audio;
 const a=new Audio();
 a.src=FILE;
 a.loop=true;
 a.preload='none';
 a.volume=VOLUME;
 a.addEventListener('error',()=>{
  console.warn('[APEX] No se puede reproducir la banda sonora local:',FILE);
  enabled=false;
  save();updateButton();
 });
 audio=a;return a;
}
function save(){
 try{global.localStorage.setItem(KEY,String(enabled))}catch(_){}
}
function stop(){if(audio)audio.pause();starting=false;}
function start(){
 if(!enabled||!unlocked||!menuVisible()||starting)return;
 const a=getAudio();
 if(!a.paused)return;
 starting=true;
 try{
  const promise=a.play();
  if(promise&&typeof promise.then==='function'){
   promise.catch(e=>{
    // Algunos dispositivos necesitan un gesto explícito para desbloquear audio.
    if(e?.name!=='AbortError')console.warn('[APEX] Reproducción aplazada:',e?.name||e);
   }).finally(()=>{starting=false;});
  }else starting=false;
 }catch(e){starting=false;console.warn('[APEX] Reproducción no disponible:',e);}
}
function toggle(){
 enabled=!enabled;
 unlocked=true; // Solo se llama desde botones de interacción del usuario.
 save();
 updateButton();
 if(enabled)start();else stop();
 return enabled;
}
function refresh(){if(!menuVisible())stop();else if(enabled)start();}
function unlock(){unlocked=true;refresh();}
function init(){
 try{enabled=global.localStorage.getItem(KEY)==='true'}catch(_){}
 updateButton();
 const menu=$('menu');
 if(menu)new MutationObserver(refresh).observe(menu,{attributes:true,attributeFilter:['class','hidden']});
 document.addEventListener('visibilitychange',refresh);
 // Respeta el bloqueo de autoplay: después de recargar, esperar al primer gesto.
 // Los navegadores móviles pueden bloquear una reanudación automática tras
 // volver de carrera. Cualquier nuevo gesto ofrece otra oportunidad segura.
 document.addEventListener('pointerdown',unlock,{passive:true});
 document.addEventListener('keydown',unlock);
 global.addEventListener('pagehide',stop);
}
global.ApexMenuMusic9A=Object.freeze({
 toggle,get:()=>enabled,stop,refresh,
 seekToEndForTest:(seconds=0.6)=>{
  if(global.location.hostname!=='127.0.0.1'&&global.location.hostname!=='localhost')return false;
  if(!audio||!Number.isFinite(audio.duration))return false;
  audio.currentTime=Math.max(0,audio.duration-seconds);
  return true;
 },
 state:()=>({enabled,playing:!!audio&&!audio.paused,src:FILE,unlocked,volume:VOLUME,
  duration:audio&&Number.isFinite(audio.duration)?audio.duration:null,
  currentTime:audio?.currentTime||0,
  loop:audio?.loop||false,
  readyState:audio?.readyState||0})
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(window);
