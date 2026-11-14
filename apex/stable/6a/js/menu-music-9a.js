/* APEX Formula 26 · Tema principal SoundBox elegido por el usuario.
 * La canción completa se sintetiza OFFLINE en CI y se sirve como MP3 local.
 * Sin red externa, sintetizadores en el hilo del juego ni autoplay invasivo.
 */
(function(global){
'use strict';
const KEY='apex26.menu-music.v1'; // Conserva la preferencia de APEX 9A.
const FILE='assets/music/apex-theme.mp3';
const VOLUME=0.33;
const $=id=>document.getElementById(id);
let enabled=false,unlocked=false,audio=null,starting=false;
// El navegador puede seguir reproduciendo HTMLAudio en una pestaña inactiva.
// APEX oculta #menu mientras muestra #apexRaceLoading: ese intervalo sigue
// siendo parte de la preparación, NO de la conducción.
function musicAllowed(){
 const menu=$('menu'),loading=$('apexRaceLoading');
 return !!(menu&&!menu.classList.contains('hidden'))||
   !!(loading&&!loading.classList.contains('hidden'));
}
function updateButton(){
 const b=$('apex9aAudio');
 if(b){
  const span=b.querySelector('span');
  if(span)span.textContent=enabled?'MÚSICA ✓':'MÚSICA';
  else b.textContent=enabled?'MÚSICA: ACTIVADA':'MÚSICA: DESACTIVADA';
  b.setAttribute('aria-label',enabled?'Desactivar música de APEX 26':'Activar música de APEX 26');
  b.setAttribute('aria-pressed',String(enabled));
  b.title=enabled?'Tema APEX 26 · detener':'Tema APEX 26 · reproducir';
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
 if(!enabled||!unlocked||!musicAllowed()||starting)return;
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
function refresh(){if(!musicAllowed())stop();else if(enabled)start();}
function unlock(){unlocked=true;refresh();}
function init(){
 try{enabled=global.localStorage.getItem(KEY)==='true'}catch(_){}
 updateButton();
 const menu=$('menu');
 const watcher=new MutationObserver(refresh);
 if(menu)watcher.observe(menu,{attributes:true,attributeFilter:['class','hidden']});
 const loading=$('apexRaceLoading');
 if(loading)watcher.observe(loading,{attributes:true,attributeFilter:['class','hidden']});
 // No pausar en visibilitychange: el usuario quiere música en otras pestañas.
 // pagehide sí libera el audio al abandonar realmente la página.
 // Respeta el bloqueo de autoplay: después de recargar, esperar al primer gesto.
 // Los navegadores móviles pueden bloquear una reanudación automática tras
 // volver de carrera. Cualquier nuevo gesto ofrece otra oportunidad segura.
 document.addEventListener('pointerdown',unlock,{passive:true});
 document.addEventListener('keydown',unlock);
 global.addEventListener('pagehide',stop);
}
global.ApexMenuMusic9A=Object.freeze({
 toggle,get:()=>enabled,stop,refresh,
 state:()=>({enabled,playing:!!audio&&!audio.paused,src:FILE,unlocked,volume:VOLUME,
  duration:audio&&Number.isFinite(audio.duration)?audio.duration:null,
  currentTime:audio?.currentTime||0,
  readyState:audio?.readyState||0})
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(window);
