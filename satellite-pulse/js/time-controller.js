import { toLocalInputValue } from './utils.js';

export class TimeController extends EventTarget {
  constructor(){
    super();
    this.manual = false;
    this.value = new Date();
    this.playing = false;
    this.speed = 1;
    this.lastFrame = null;
    this.raf = 0;
    this._uiTimer = 0;
  }
  now(){ return this.manual ? new Date(this.value) : new Date(); }
  set(date){
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return;
    this.manual = true; this.value = d; this.emit();
  }
  useNow(){ this.pause(); this.manual = false; this.value = new Date(); this.speed = 1; this.emit(); }
  setSpeed(speed){ this.speed = Number(speed) || 1; this.dispatchEvent(new CustomEvent('rate',{detail:this.speed})); }
  play(){
    if (!this.manual){ this.manual = true; this.value = new Date(); }
    if (this.playing) return;
    this.playing = true; this.lastFrame = null; this.dispatchEvent(new Event('playstate')); this.raf = requestAnimationFrame(t=>this.loop(t));
  }
  pause(){
    this.playing = false;
    this.lastFrame = null;
    cancelAnimationFrame(this.raf);
    this.dispatchEvent(new Event('playstate'));
  }
  toggle(){ this.playing ? this.pause() : this.play(); }
  loop(ts){
    if (!this.playing) return;
    if (this.lastFrame == null) this.lastFrame = ts;
    const dt = Math.min(.25, (ts-this.lastFrame)/1000);
    this.lastFrame = ts;
    this.value = new Date(this.value.getTime() + dt*1000*this.speed);
    this.emit();
    this.raf = requestAnimationFrame(t=>this.loop(t));
  }
  emit(){ this.dispatchEvent(new CustomEvent('change',{detail:this.now()})); }
  static sliderToSpeed(raw){
    const pos = Number(raw)/1000, offset = pos-.5, dead=.02;
    if (Math.abs(offset)<dead) return 1;
    const m=(Math.abs(offset)-dead)/(.5-dead), sign=offset>0?1:-1;
    return sign*Math.pow(86400,m);
  }
  bindUI({useNowBtn, playPauseBtn, slider, rateLabel, input}){
    const refresh = ()=>{
      if (document.activeElement !== input) input.value = toLocalInputValue(this.now());
      useNowBtn.classList.toggle('is-now', !this.manual);
      playPauseBtn.textContent = (this.playing || !this.manual) ? '❚❚' : '▶';
      playPauseBtn.title = (this.playing || !this.manual) ? 'Pausar' : 'Reproducir';
      if (!this.manual) {
        rateLabel.textContent='Tiempo real';
      } else {
        const s=this.speed, a=Math.abs(s);
        const txt=a===1?'1×':a<10?`${a.toFixed(2)}×`:a<100?`${a.toFixed(1)}×`:`${Math.round(a)}×`;
        rateLabel.textContent=(s<0?'−':'')+txt;
      }
    };
    useNowBtn.addEventListener('click',()=>{ slider.value='500'; this.useNow(); refresh(); });
    playPauseBtn.addEventListener('click',()=>{ if(!this.manual){ this.set(new Date()); this.pause(); } else this.toggle(); refresh(); });
    slider.addEventListener('input',()=>{ this.setSpeed(TimeController.sliderToSpeed(slider.value)); if(!this.manual) this.set(new Date()); if(!this.playing) this.play(); refresh(); });
    input.addEventListener('change',()=>{ if(input.value) this.set(new Date(input.value)); refresh(); });
    this.addEventListener('change', refresh); this.addEventListener('rate', refresh); this.addEventListener('playstate', refresh);
    refresh();

    // En tiempo real no se dispara `change` continuamente; el reloj del sistema
    // avanza por su cuenta. Este temporizador mantiene el input sincronizado con
    // segundos visibles sin forzar recálculos orbitales extra.
    clearInterval(this._uiTimer);
    this._uiTimer = setInterval(()=>{
      if(!document.hidden) refresh();
    }, 250);
  }
}
