(function(global){
  "use strict";
  function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}}
  function Noise(seed){this.seed=seed|0; this._rnd=mulberry32(this.seed); this._p=new Uint8Array(512); const perm=new Uint8Array(256); for(let i=0;i<256;i++)perm[i]=i;
    for(let i=255;i>0;i--){const j=(this._rnd()*(i+1))|0; const t=perm[i]; perm[i]=perm[j]; perm[j]=t;}
    for(let i=0;i<512;i++) this._p[i]=perm[i&255];
  }
  function fade(t){return t*t*t*(t*(t*6-15)+10);}
  function lerp(a,b,t){return a+(b-a)*t;}
  function grad(h,x,y,z){const u=h<8?x:y; const v=h<4?y:(h===12||h===14?x:z); return ((h&1)?-u:u)+((h&2)?-v:v);}
  Noise.prototype.noise3D=function(x,y,z){
    const p=this._p;
    let X=Math.floor(x)&255, Y=Math.floor(y)&255, Z=Math.floor(z)&255;
    x-=Math.floor(x); y-=Math.floor(y); z-=Math.floor(z);
    const u=fade(x), v=fade(y), w=fade(z);
    const A=p[X]+Y, AA=p[A]+Z, AB=p[A+1]+Z;
    const B=p[X+1]+Y, BA=p[B]+Z, BB=p[B+1]+Z;
    return lerp(
      lerp(lerp(grad(p[AA],x,y,z), grad(p[BA],x-1,y,z), u),
           lerp(grad(p[AB],x,y-1,z), grad(p[BB],x-1,y-1,z), u), v),
      lerp(lerp(grad(p[AA+1],x,y,z-1), grad(p[BA+1],x-1,y,z-1), u),
           lerp(grad(p[AB+1],x,y-1,z-1), grad(p[BB+1],x-1,y-1,z-1), u), v),
      w
    );
  };
  global.Noise=Noise;
})(window);
