/* noise.js — gradient noise 3D con tabla de permutación (sin dependencias) */
(function(global){
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }

  function Noise(seed){
    seed = (seed|0) || 1337;
    const rnd = mulberry32(seed);
    const p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i=0;i<256;i++) perm[i]=i;
    for (let i=255;i>0;i--){
      const j = (rnd()* (i+1))|0;
      const t = perm[i]; perm[i]=perm[j]; perm[j]=t;
    }
    for (let i=0;i<512;i++) p[i] = perm[i & 255];

    function fade(t){ return t*t*t*(t*(t*6-15)+10); }
    function lerp(a,b,t){ return a + (b-a)*t; }
    function grad(hash, x,y,z){
      const h = hash & 15;
      const u = h<8 ? x : y;
      const v = h<4 ? y : (h===12||h===14 ? x : z);
      return ((h&1)?-u:u) + ((h&2)?-v:v);
    }

    this.noise3D = function(x,y,z){
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);
      const zf = z - Math.floor(z);
      const u = fade(xf), v = fade(yf), w = fade(zf);

      const A  = p[X] + Y, AA = p[A] + Z, AB = p[A+1] + Z;
      const B  = p[X+1] + Y, BA = p[B] + Z, BB = p[B+1] + Z;

      const x1 = lerp(grad(p[AA], xf, yf, zf), grad(p[BA], xf-1, yf, zf), u);
      const x2 = lerp(grad(p[AB], xf, yf-1, zf), grad(p[BB], xf-1, yf-1, zf), u);
      const y1 = lerp(x1, x2, v);

      const x3 = lerp(grad(p[AA+1], xf, yf, zf-1), grad(p[BA+1], xf-1, yf, zf-1), u);
      const x4 = lerp(grad(p[AB+1], xf, yf-1, zf-1), grad(p[BB+1], xf-1, yf-1, zf-1), u);
      const y2 = lerp(x3, x4, v);

      return lerp(y1, y2, w) * 0.936;
    };
  }

  global.Noise = Noise;
})(window);
