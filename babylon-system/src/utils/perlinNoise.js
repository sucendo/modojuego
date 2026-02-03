// src/utils/perlinNoise.js
// Perlin gradient noise 3D with seeded permutation table.
// ES module version of generate-planet-js/noise.js.

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Noise {
  constructor(seed = 1337) {
    seed = (seed | 0) || 1337;
    const rnd = mulberry32(seed);

    const p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = (rnd() * (i + 1)) | 0;
      const t = perm[i];
      perm[i] = perm[j];
      perm[j] = t;
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

    this._p = p;
  }

  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return (h & 1 ? -u : u) + (h & 2 ? -v : v);
  }

  noise3D(x, y, z) {
    const p = this._p;
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    const u = this._fade(xf);
    const v = this._fade(yf);
    const w = this._fade(zf);

    const A = p[X] + Y;
    const AA = p[A] + Z;
    const AB = p[A + 1] + Z;
    const B = p[X + 1] + Y;
    const BA = p[B] + Z;
    const BB = p[B + 1] + Z;

    const x1 = this._lerp(this._grad(p[AA], xf, yf, zf), this._grad(p[BA], xf - 1, yf, zf), u);
    const x2 = this._lerp(this._grad(p[AB], xf, yf - 1, zf), this._grad(p[BB], xf - 1, yf - 1, zf), u);
    const y1 = this._lerp(x1, x2, v);

    const x3 = this._lerp(this._grad(p[AA + 1], xf, yf, zf - 1), this._grad(p[BA + 1], xf - 1, yf, zf - 1), u);
    const x4 = this._lerp(this._grad(p[AB + 1], xf, yf - 1, zf - 1), this._grad(p[BB + 1], xf - 1, yf - 1, zf - 1), u);
    const y2 = this._lerp(x3, x4, v);

    // match original scaling (~[-0.936..0.936])
    return this._lerp(y1, y2, w) * 0.936;
  }
}
