/* APEX 9A.6 · Música sintética opcional del menú, sin archivos ni reproducción automática. */
(function(global){
'use strict';
const KEY='apex26.menu-music.v1';
let ctx=null,timer=null,enabled=false,step=0,lastDisplay='';
const notes=[110,164.81,220,261.63,146.83,196,246.94,293.66];
const $=id=>document.getElementById(id);
function visible(){const menu=$('menu');return !!menu&&!menu.classList.contains('hidden')&&!!$('apex9aLanding')&&!$('apex9aLanding').hidden;}
function updateButton(){const b=$('apex9aAudio');if(b){b.textContent=enabled?'MÚSICA: ACTIVADA':'MÚSICA: DESACTIVADA';b.setAttribute('aria-pressed',String(enabled));}}
function playNote(){
 if(!ctx||ctx.state!=='running'||!visible())return;
 const now=ctx.currentTime,f=notes[step%notes.length];
 const osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type='sine';osc.frequency.setValueAtTime(f,now);
 gain.gain.setValueAtTime(0.0001,now);
 gain.gain.exponentialRampToValueAtTime(0.017,now+.035);
 gain.gain.exponentialRampToValueAtTime(.0001,now+.42);
 osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.44);
 step++;
}
function stop(){if(timer){clearInterval(timer);timer=null;}if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{});}
async function start(){
 if(!enabled||!visible())return;
 const C=global.AudioContext||global.webkitAudioContext;
 if(!C){enabled=false;updateButton();return;}
 try{
  if(!ctx)ctx=new C();
  if(ctx.state==='suspended')await ctx.resume();
  if(!enabled||!visible()){stop();return;}
  if(!timer){playNote();timer=setInterval(playNote,510);}
 }catch(e){console.warn('[APEX 9A] No se pudo iniciar música',e);stop();}
}
function toggle(){
 enabled=!enabled;
 try{global.localStorage.setItem(KEY,String(enabled))}catch(_){}
 updateButton();
 if(enabled)start();else stop();
 return enabled;
}
function init(){
 // El consentimiento previo nunca inicia audio sin un gesto de usuario.
 try{enabled=global.localStorage.getItem(KEY)==='true'}catch(_){}
 updateButton();
 const menu=$('menu');
 if(menu)new MutationObserver(()=>{if(!visible())stop();else if(enabled&&ctx)start();}).observe(menu,{attributes:true,attributeFilter:['class']});
 const landing=$('apex9aLanding');
 if(landing)new MutationObserver(()=>{if(!visible())stop();else if(enabled&&ctx)start();}).observe(landing,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(enabled&&ctx)start();});
}
global.ApexMenuMusic9A=Object.freeze({toggle,get:()=>enabled,stop});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
