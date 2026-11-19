/** Adaptive terrain radius based on sustained frame time, not individual hitches.
 * Only a local rendering preference: the world seed and save format are untouched.
 */
export const MIN_SAFE_RADIUS=2;
export function boundedRadius(value, maximum){
  const cap=Math.max(0,Math.min(5,Math.floor(Number(maximum)||0)));
  return Math.max(Math.min(MIN_SAFE_RADIUS,cap),Math.min(cap,Math.floor(Number(value)||0)));
}

export class AdaptiveVisibility {
  constructor(maximum=3){
    this.radius=boundedRadius(maximum,maximum);
    this.slowSeconds=0;
    this.fastSeconds=0;
    this.cooldown=0;
    this.elapsed=0;
    this.activeSeconds=0;
    this.frameCount=0;
    this.lastFps=0;
  }
  reset(maximum){
    this.radius=boundedRadius(maximum,maximum);
    this.slowSeconds=0;this.fastSeconds=0;this.cooldown=0;
    this.elapsed=0;this.activeSeconds=0;this.frameCount=0;
    return this.radius;
  }
  /** Returns a new radius only when it needs to change. */
  sample(dt,active,maximum){
    const cap=boundedRadius(maximum,maximum);
    const limit=boundedRadius(this.radius,maximum);
    if(limit!==this.radius){this.radius=limit;this.slowSeconds=0;this.fastSeconds=0;return limit;}
    // Never treat menus, inactive tabs and tab-resume stalls as bad game FPS.
    if(!active||!Number.isFinite(dt)||dt<=0||dt>.35){
      this.elapsed=0;this.activeSeconds=0;this.frameCount=0;
      this.slowSeconds=0;this.fastSeconds=0;
      return null;
    }
    this.elapsed+=dt;this.activeSeconds+=dt;this.frameCount++;
    if(this.elapsed<2)return null;
    const seconds=this.elapsed;
    const fps=this.frameCount/Math.max(.001,this.activeSeconds);
    this.lastFps=fps;
    this.elapsed=0;this.activeSeconds=0;this.frameCount=0;
    this.cooldown=Math.max(0,this.cooldown-seconds);
    if(fps<47){this.slowSeconds+=seconds;this.fastSeconds=0;}
    else if(fps>57){this.fastSeconds+=seconds;this.slowSeconds=0;}
    else{this.slowSeconds=0;this.fastSeconds=0;}
    if(this.cooldown>0)return null;
    if(this.slowSeconds>=6 && this.radius>Math.min(MIN_SAFE_RADIUS,cap)){
      this.radius--;this.slowSeconds=0;this.cooldown=12;return this.radius;
    }
    if(this.fastSeconds>=18 && this.radius<cap){
      this.radius++;this.fastSeconds=0;this.cooldown=14;return this.radius;
    }
    return null;
  }
}
