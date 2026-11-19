/** Deterministic world-space clouds; no Three.js dependency. */
export const CLOUD_STYLES = Object.freeze(['fast', 'fancy', 'advanced']);
export const normalizeCloudStyle = s => CLOUD_STYLES.includes(s) ? s : 'advanced';
export function hash3(seed,x,z,salt) {
  let n=(Math.imul(seed|0,0x9e3779b1)^Math.imul(x|0,0x85ebca6b)^Math.imul(z|0,0xc2b2ae35)^salt)>>>0;
  n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
  return ((n^(n>>>16))>>>0)/4294967296;
}
export function smoothstep(a,b,v){const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);}
export function cloudHorizonOpacity(distance,fadeStart,fadeEnd){return 1-smoothstep(fadeStart,fadeEnd,distance);}
export function cloudCoverOpacity(chance,cover){return smoothstep(chance-.14,chance+.14,cover);}
export function cloudCell(seed,cx,cz,layer,size){
  const s=layer*103;
  return { x:(cx+.18+.64*hash3(seed,cx,cz,s+11))*size,
    z:(cz+.18+.64*hash3(seed,cx,cz,s+12))*size,
    y:(layer===0?83:105)+hash3(seed,cx,cz,s+13)*7,
    chance:hash3(seed,cx,cz,s+9),
    l:Math.min(size*.94,12+hash3(seed,cx,cz,s+14)*14),
    w:Math.min(size*.79,9+hash3(seed,cx,cz,s+15)*11),
    h:2.4+hash3(seed,cx,cz,s+16)*2.5,
    variant:hash3(seed,cx,cz,s+17) };
}
/** Broad connected squares: no disconnected bars or rotated geometry. */
export function cloudShapeParts(c,style){
  const {l,w,h,variant:v}=c;
  if(style==='fast')return [
    [0,0,0,l,.22,w], [l*.29,.04,w*.15,l*.55,.22,w*.65],
    [-l*.27,.08,-w*.13,l*.55,.22,w*.7] ];
  const p=[[0,0,0,l*.78,h,w*.85], [l*.27,h*.04,w*.12,l*.55,h*.84,w*.68],
    [-l*.27,h*.06,-w*.10,l*.54,h*.8,w*.7]];
  if(style==='advanced'){
    p.push([l*(v-.5)*.18,h*.32,0,l*.48,h*.55,w*.55]);
    if(v>.4)p.push([-l*.11,-h*.13,w*.24,l*.4,h*.62,w*.53]);
  }
  return p;
}
