
  function buildGasGiantTexture(gen, params){
    const scene = gen.scene;
    const W = 1024, H = 512;
    if (!gen._gasTex){
      gen._gasTex = new BABYLON.DynamicTexture("gasDT", {width:W, height:H}, scene, false);
      gen._gasTex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
      gen._gasTex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
      gen._gasTex.hasAlpha = false;
    }
    const dt = gen._gasTex;
    const ctx = dt.getContext();
    const img = ctx.createImageData(W,H);
    const data = img.data;

    const cA = BABYLON.Color3.FromHexString(params.gasColorA || "#d8b48a");
    const cB = BABYLON.Color3.FromHexString(params.gasColorB || "#b9855f");
    const cC = BABYLON.Color3.FromHexString(params.gasColorC || "#f2d7b6");

    const bands = Math.max(2, (params.gasBandCount|0) || 12);
    const contrast = params.gasBandContrast ?? 0.85;
    const swirl = params.gasSwirl ?? 0.35;
    const stormAmp = params.gasStormAmp ?? 0.0;

    const stormLat = (params.gasStormLat ?? -0.22) * Math.PI;     // -pi..pi (normalized * pi)
    const stormLon = (params.gasStormLon ?? 0.25) * Math.PI*2;    // 0..1 -> 0..2pi
    const stormRad = Math.max(0.02, params.gasStormRadius ?? 0.10);
    const stormSoft = Math.max(0.01, params.gasStormSoftness ?? 0.35);
    const stormCol = BABYLON.Color3.FromHexString(params.gasStormColor || "#b84a2a");
    const stormSwirl = params.gasStormSwirl ?? 0.45;
    const stormContrast = params.gasStormContrast ?? 1.35;

    const n = gen._noise || gen.noise;

    function mix3(a,b,t){ return new BABYLON.Color3(a.r+(b.r-a.r)*t, a.g+(b.g-a.g)*t, a.b+(b.b-a.b)*t); }

    for (let y=0;y<H;y++){
      const v = (y+0.5)/H;
      const lat = (v-0.5) * Math.PI; // -pi/2..pi/2
      const latN = Math.sin((lat*0.5 + 0.5) * Math.PI * bands);
      for (let x=0;x<W;x++){
        const u = (x+0.5)/W;
        const lon = (u-0.5) * Math.PI*2;

        // noise in equirectangular -> sample on unit sphere
        const cl = Math.cos(lat);
        const sx = Math.cos(lon)*cl;
        const sy = Math.sin(lat);
        const sz = Math.sin(lon)*cl;

        const ns = n.noise3D(sx*(params.gasStormScale??14.0), sy*(params.gasStormScale??14.0), sz*(params.gasStormScale??14.0));
        const t0 = clamp(0.5 + 0.5*(latN*contrast + ns*swirl), 0, 1);

        let c = (t0 < 0.5) ? mix3(cA,cB, t0/0.5) : mix3(cB,cC, (t0-0.5)/0.5);

        // Great storm blob (gaussian in lat/lon)
        if (stormAmp > 0.0001 && params.gasStormEnabled){
          // distance on sphere approximated by lat/lon
          const dLat = (lat - stormLat);
          const dLon = Math.atan2(Math.sin(lon-stormLon), Math.cos(lon-stormLon));
          const d = Math.sqrt(dLat*dLat + (dLon*Math.cos(lat))*(dLon*Math.cos(lat)));
          const g = Math.exp(-(d*d)/(2*Math.max(1e-4,stormRad*stormRad)));
          const swirlN = n.noise3D(sx*(params.gasStormScale??14.0)*2.2, sy*(params.gasStormScale??14.0)*2.2, sz*(params.gasStormScale??14.0)*2.2);
          const swirlF = 1.0 + swirlN*stormSwirl;
          let s = Math.pow(g, 1.0/Math.max(0.05,stormSoft)) * stormAmp * swirlF;
          s = Math.pow(clamp(s,0,1), 1.0/stormContrast);
          c = new BABYLON.Color3(
            clamp(c.r + (stormCol.r - c.r)*s, 0, 1),
            clamp(c.g + (stormCol.g - c.g)*s, 0, 1),
            clamp(c.b + (stormCol.b - c.b)*s, 0, 1)
          );
        }

        const i=(y*W+x)*4;
        data[i]   = (c.r*255)|0;
        data[i+1] = (c.g*255)|0;
        data[i+2] = (c.b*255)|0;
        data[i+3] = 255;
      }
    }

    ctx.putImageData(img,0,0);
    dt.update(false);
    return dt;
  }

/* geosphere.js — v2: mar encaja con topo + suavizado + colores por cota */
(function(global){
  function clamp(x,a,b){ return Math.max(a, Math.min(b,x)); }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function smoothstep(a,b,x){
    const t = clamp((x-a)/(b-a), 0, 1);
    return t*t*(3-2*t);
  }
  const EPS = 1e-6;

  function makeRng(seed){
    let a = (seed|0) >>> 0;
    return function(){
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function unitVec(rng){
    const u = rng(), v = rng();
    const th = 2*Math.PI*u;
    const z = 2*v - 1;
    const r = Math.sqrt(Math.max(0, 1 - z*z));
    return { x: r*Math.cos(th), y: z, z: r*Math.sin(th) };
  }

  function hexToColor3(hex){
    return BABYLON.Color3.FromHexString(hex);
  }
  function color3ToArray(c){ return [c.r, c.g, c.b]; }

  function PlanetGenerator(scene){
    this.scene = scene;
    this.mesh = null;
    this.seaMesh = null;
	this.cloudMesh = null;

    this._noise = new Noise(1337);
    this._cloudNoise = new Noise(2337);
    this._cloudTex = null; // BABYLON.DynamicTexture
    this._cloudMat = null;
    this._cloudKey = "";

    this._basePositions = null;   // Float32Array
    this._positions = null;       // Float32Array
    this._heights = null;         // Float32Array (multiplicador radial)
    this._adj = null;             // Array<Array<int>> adyacencias por vertice

    this._craters = [];

    // Sea waves (runtime)
    this._seaBasePos = null;
    this._seaPos = null;
    this._seaNrm = null;
    this._seaIdx = null;
    this._seaTime = 0;
  }

  PlanetGenerator.prototype.dispose = function(){
    if (this.mesh) this.mesh.dispose();
    if (this.seaMesh) this.seaMesh.dispose();
    if (this.cloudMesh) this.cloudMesh.dispose();
    if (this._cloudTex) this._cloudTex.dispose();
    this.mesh = null; this.seaMesh = null;
    this.cloudMesh = null;
    this._cloudTex = null;
    this._cloudMat = null;
    this._basePositions = null; 
	this._positions = null; 
	this._heights = null;
    this._adj = null;
    this._craters.length = 0;
  };

  PlanetGenerator.prototype._ensureMesh = function(params){
    const scene = this.scene;
    const radius = params.radius;
    const needRecreate = (!this.mesh) || (this.mesh._subdiv !== params.subdivisions) || (this.mesh._radius !== radius);

    if (needRecreate){
      if (this.mesh) this.mesh.dispose();
      const subs = Math.max(1, Math.min(99, (params.subdivisions|0)));
      this.mesh = BABYLON.MeshBuilder.CreateIcoSphere("planet", {
        radius,
        subdivisions: subs,
        flat: false,
        updatable: true
      }, scene);

      // Soldar vértices duplicados para evitar grietas al deformar
      weldVertices(this.mesh, 1e-6);
      this.mesh._subdiv = params.subdivisions;
      this.mesh._radius = radius;
      this.mesh.isPickable = false;

      // Material: PBR con vertex colors (más "realista" sin texturas)
      const mat = new BABYLON.PBRMaterial("planetMat", scene);
      mat.albedoColor = new BABYLON.Color3(1,1,1);
      mat.metallic = 0.0;
      mat.roughness = 1.0;
      mat.useVertexColors = true;
      mat.specularIntensity = 0.15;
      this.mesh.material = mat;

      // Base buffers (después de weld)
      const base = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      this._basePositions = new Float32Array(base);
      this._positions = new Float32Array(base.length);
      this._heights = new Float32Array(base.length/3);

      // Precompute adjacency (para suavizado)
      this._adj = buildAdjacency(this.mesh.getIndices(), this._heights.length);
// Si hay mar, recrear también (mismo topo)
      if (this.seaMesh){ this.seaMesh.dispose(); this.seaMesh = null; }
    } else {
      // Asegurar buffers
      const base = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      if (!this._basePositions || this._basePositions.length !== base.length){
        this._basePositions = new Float32Array(base);
        this._positions = new Float32Array(base.length);
        this._heights = new Float32Array(base.length/3);
        this._adj = buildAdjacency(this.mesh.getIndices(), this._heights.length);
        if (this.seaMesh){ this.seaMesh.dispose(); this.seaMesh = null; }
      }
    }

    this.mesh.material.wireframe = !!params.wireframe;
  };


  function weldVertices(mesh, eps){
    // El IcoSphere puede traer vértices duplicados (seams). Si se deforman por separado => grietas.
    // Esto "solda" (weld) los vértices por posición (con tolerancia eps).
    eps = eps || 1e-6;
    const pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const idx = mesh.getIndices();
    const map = new Map();
    const newPos = [];
    const remap = new Int32Array(pos.length/3);

    for (let i=0, vi=0;i<pos.length;i+=3, vi++){
      const x = pos[i], y = pos[i+1], z = pos[i+2];
      const kx = Math.round(x/eps), ky = Math.round(y/eps), kz = Math.round(z/eps);
      const key = kx + "," + ky + "," + kz;
      let ni = map.get(key);
      if (ni === undefined){
        ni = (newPos.length/3)|0;
        newPos.push(x,y,z);
        map.set(key, ni);
      }
      remap[vi] = ni;
    }

    const newIdx = new (idx.constructor)(idx.length);
    for (let i=0;i<idx.length;i++){
      newIdx[i] = remap[idx[i]];
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, newPos, true);
    mesh.setIndices(newIdx);
    // Normales y colores se recalculan después de deformar.
  }

  function buildAdjacency(indices, vertCount){
    const adj = Array.from({length: vertCount}, () => []);
    function add(a,b){
      const la = adj[a];
      // pequeña optimización: evitar duplicados raros
      if (la.length < 64 && la.indexOf(b) === -1) la.push(b);
    }
    for (let i=0;i<indices.length;i+=3){
      const a = indices[i], b = indices[i+1], c = indices[i+2];
      add(a,b); add(a,c);
      add(b,a); add(b,c);
      add(c,a); add(c,b);
    }
    return adj;
  }


  function buildOceanPatch(basePositions, indices, heights, params){
    // Construye una malla de océano SOLO con triángulos "bajo el mar"
    // para que no se vea como una esfera superpuesta.
    const seaMul = 1.0 + params.seaLevel;
    const seaR = params.radius * seaMul * params.seaThickness;

    const coastFill = Math.max(0, params.oceanCoastFill || 0); // en multiplicador de altura
    const maxHAllowed = seaMul + coastFill;

    // map original vertex -> new vertex
    const remap = new Int32Array(heights.length);
    remap.fill(-1);

    const newPos = [];
    const newIdx = [];
    const orig = [];

    function addVertex(vi){
      let nv = remap[vi];
      if (nv !== -1) return nv;
      const i = vi*3;
      const x = basePositions[i], y = basePositions[i+1], z = basePositions[i+2];
      const invLen = 1.0 / Math.max(1e-9, Math.sqrt(x*x+y*y+z*z));
      // Ocean siempre a radio seaR (ligero "hug" opcional)
      let rLocal = seaR;
      if (params.seaHugCoast){
        const terrainR = params.radius * heights[vi];
        if (terrainR > seaR && terrainR < seaR + params.seaHugBand){
          rLocal = seaR + (terrainR - seaR) * params.seaHugFactor;
        }
      }
      nv = (newPos.length/3)|0;
      newPos.push(x*invLen*rLocal, y*invLen*rLocal, z*invLen*rLocal);
      orig[nv] = vi;
      remap[vi] = nv;
      return nv;
    }

    for (let i=0;i<indices.length;i+=3){
      const a = indices[i], b = indices[i+1], c = indices[i+2];
      const ha = heights[a], hb = heights[b], hc = heights[c];

      // incluir triángulos totalmente bajo el mar o muy cerca de la costa
      const maxH = Math.max(ha, hb, hc);
      if (maxH > maxHAllowed) continue;

      const na = addVertex(a);
      const nb = addVertex(b);
      const nc = addVertex(c);
      newIdx.push(na, nb, nc);
    }

    return {
      positions: new Float32Array(newPos),
      indices: (newIdx.length ? new Uint32Array(newIdx) : new Uint32Array(0)),
      orig: (orig.length ? new Int32Array(orig) : new Int32Array(0))
    };
  }

  PlanetGenerator.prototype._buildCraters = function(params){
    const rng = makeRng(params.seed ^ 0xA53C1);
    this._craters.length = 0;
    if (!params.cratersEnabled || params.craterCount <= 0) return;

    for (let i=0;i<params.craterCount;i++){
      const c = unitVec(rng);
      const radius = lerp(params.craterRadiusMin, params.craterRadiusMax, rng()); // angular
      const depth = lerp(params.craterDepthMin, params.craterDepthMax, rng());
      this._craters.push({ c, radius, depth, rim: params.craterRim, blend: params.craterBlend });
    }
  };

  PlanetGenerator.prototype._heightRaw = function(nx,ny,nz, params){
    const n = this._noise;

    // Continentes (macro)
    const cont = n.noise3D(nx*params.continentScale, ny*params.continentScale, nz*params.continentScale);
    const cont01 = clamp(cont*0.5+0.5, 0, 1);
    const continent = Math.pow(cont01, params.continentPower) * params.continentAmp;

    // FBM
    let amp = 1.0, freq = params.noiseScale, sum = 0.0, norm = 0.0;
    for (let o=0;o<params.octaves;o++){
      sum += n.noise3D(nx*freq, ny*freq, nz*freq) * amp;
      norm += amp;
      amp *= params.gain;
      freq *= params.lacunarity;
    }
    const fbm = sum / Math.max(EPS, norm);

    // Ridged
    let rAmp=1.0, rFreq=params.ridgeScale, rSum=0.0, rNorm=0.0;
    for (let o=0;o<params.ridgeOctaves;o++){
      let v = n.noise3D(nx*rFreq, ny*rFreq, nz*rFreq);
      v = 1.0 - Math.abs(v);
      v = v*v;
      rSum += v * rAmp;
      rNorm += rAmp;
      rAmp *= params.ridgeGain;
      rFreq *= params.ridgeLacunarity;
    }
    const ridged = rSum / Math.max(EPS, rNorm);

    // máscara de continentes (0..1)
    const contNorm = (params.continentAmp > EPS) ? (continent / params.continentAmp) : 0.0;
    const mask = smoothstep(params.continentMaskMin, params.continentMaskMax, contNorm);

    const mountains = fbm * params.mountainAmp * (params.mountainMaskByContinents ? mask : 1.0);
    const peaks = (ridged - 0.5) * 2.0 * params.ridgeAmp * (params.ridgeMaskByContinents ? mask : 1.0);

    return 1.0 + continent + mountains + peaks;
  };

  PlanetGenerator.prototype._applyCraters = function(nx,ny,nz,h, params){
    if (!params.cratersEnabled || this._craters.length === 0) return h;
    for (let i=0;i<this._craters.length;i++){
      const cr = this._craters[i];
      const dot = clamp(nx*cr.c.x + ny*cr.c.y + nz*cr.c.z, -1, 1);
      const ang = Math.acos(dot);
      const R = cr.radius;
      if (ang > R) continue;

      const t = ang / R;
      const bowl = (1 - smoothstep(0,1,t));
      const depression = -cr.depth * Math.pow(bowl, 1.6);

      const rimBand = smoothstep(1.0 - cr.rim, 1.0, t);
      const rim = cr.depth * 0.35 * rimBand;

      const blend = smoothstep(0.0, cr.blend, bowl);
      h += (depression + rim) * blend;
    }
    return h;
  };

  PlanetGenerator.prototype._applySeaFlatten = function(h, params){
    if (!params.seaEnabled || !params.flattenUnderSea) return h;
    const seaMul = 1.0 + params.seaLevel;
    const band = Math.max(EPS, params.shoreBand);
    if (h < seaMul){
      return lerp(h, seaMul, params.flattenStrength);
    }
    // banda costera suave (evita corte duro)
    if (h < seaMul + band){
      const t = 1.0 - (h - seaMul)/band; // 1..0
      const w = smoothstep(0,1,t) * params.shoreStrength;
      return lerp(h, seaMul + (h - seaMul)*0.15, w);
    }
    return h;
  };

  PlanetGenerator.prototype._smoothHeights = function(params){
    const iters = params.smoothIterations|0;
    if (!params.smoothingEnabled || iters <= 0 || params.smoothStrength <= 0) return;

    const h = this._heights;
    const tmp = new Float32Array(h.length);
    const adj = this._adj;
    const s = params.smoothStrength;

    for (let k=0;k<iters;k++){
      for (let i=0;i<h.length;i++){
        const nei = adj[i];
        if (!nei || nei.length === 0){ tmp[i] = h[i]; continue; }
        let sum = 0.0;
        for (let j=0;j<nei.length;j++) sum += h[nei[j]];
        const avg = sum / nei.length;
        tmp[i] = lerp(h[i], avg, s);
      }
      h.set(tmp);
    }
  };

  PlanetGenerator.prototype._thermalErosion = function(params){
    // Erosión térmica simple: redistribuye material de pendientes muy pronunciadas.
    if (!params.erosionEnabled) return;
    const iters = params.erosionIterations|0;
    if (iters <= 0) return;

    const h = this._heights;
    const adj = this._adj;
    const talus = Math.max(1e-6, params.erosionTalus);
    const rate = clamp(params.erosionRate, 0, 0.5);

    const tmp = new Float32Array(h.length);
    for (let k=0;k<iters;k++){
      tmp.set(h);
      for (let i=0;i<h.length;i++){
        const nei = adj[i];
        if (!nei || nei.length===0) continue;

        // Buscar vecino más bajo
        let lowest = -1;
        let minH = h[i];
        for (let j=0;j<nei.length;j++){
          const n = nei[j];
          if (h[n] < minH){
            minH = h[n];
            lowest = n;
          }
        }
        if (lowest === -1) continue;

        const dh = h[i] - minH;
        if (dh <= talus) continue;

        // mover una fracción del exceso
        const move = (dh - talus) * rate;
        tmp[i] -= move;
        tmp[lowest] += move;
      }
      h.set(tmp);
    }
  };


  PlanetGenerator.prototype._computeVertexColors = function(params){
    const colors = new Float32Array(this._heights.length * 4);
    const seaMul = 1.0 + params.seaLevel;
    const pos = this._positions; // para latitud (radial)

    // normalizar alturas (solo para colores)
    let minH = 1e9, maxH = -1e9;
    for (let i=0;i<this._heights.length;i++){
      const v = this._heights[i];
      if (v < minH) minH = v;
      if (v > maxH) maxH = v;
    }
    maxH = Math.max(maxH, seaMul + EPS);

    const beach = hexToColor3(params.colorBeach);
    const low   = hexToColor3(params.colorLow);
    const mid   = hexToColor3(params.colorMid);
    const high  = hexToColor3(params.colorHigh);
    const snow  = hexToColor3(params.colorSnow);

    const beachW = Math.max(EPS, params.beachWidth);

    // para "sombrear" por pendiente usaremos dot(normal, radial) después; aquí lo dejamos neutro.
    for (let i=0;i<this._heights.length;i++){
      const h = this._heights[i];
      // Latitud aproximada (0 ecuator -> 1 polo)
      const vi3 = i*3;
      const px = pos[vi3], py = pos[vi3+1], pz = pos[vi3+2];
      const invLen = 1.0/Math.max(EPS, Math.sqrt(px*px+py*py+pz*pz));
      const lat = Math.abs(py*invLen);
      const latW = Math.pow(lat, params.snowLatPower);
      const snowLineEff = lerp(params.snowLine, params.snowLinePole, latW);

      let c = high;
      if (params.seaEnabled && h <= seaMul + beachW){
        // playa en la banda costera
        const t = clamp((h - (seaMul - beachW*0.5)) / (beachW*1.5), 0, 1);
        // mezcla: playa->low
        c = new BABYLON.Color3(
          lerp(beach.r, low.r, t),
          lerp(beach.g, low.g, t),
          lerp(beach.b, low.b, t)
        );
      } else {
        // elevación relativa por encima del mar
        const rel = clamp((h - seaMul) / Math.max(EPS, (maxH - seaMul)), 0, 1);

        // split en bandas
        if (rel < 0.33){
          const t = rel/0.33;
          c = new BABYLON.Color3(
            lerp(low.r, mid.r, t),
            lerp(low.g, mid.g, t),
            lerp(low.b, mid.b, t)
          );
        } else if (rel < snowLineEff){
          const t = (rel-0.33) / Math.max(EPS, (snowLineEff-0.33));
          c = new BABYLON.Color3(
            lerp(mid.r, high.r, t),
            lerp(mid.g, high.g, t),
            lerp(mid.b, high.b, t)
          );
        } else {
          const t = clamp((rel - snowLineEff) / Math.max(EPS, (1.0 - snowLineEff)), 0, 1);
          c = new BABYLON.Color3(
            lerp(high.r, snow.r, t),
            lerp(high.g, snow.g, t),
            lerp(high.b, snow.b, t)
          );
        }
      }

      const base = i*4;
      colors[base] = c.r; colors[base+1] = c.g; colors[base+2] = c.b; colors[base+3] = 1.0;
    }

    return colors;
  };

  PlanetGenerator.prototype._applySlopeShading = function(colors, params){
    if (!params.slopeShading || !this.mesh) return colors;

    const normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    const pos = this._positions;
    const strength = params.slopeStrength;
    const rock = BABYLON.Color3.FromHexString(params.rockColor);
    const rockSlope = clamp(params.rockSlope, 0.0, 1.0);

    for (let i=0, vi=0;i<colors.length;i+=4, vi+=3){
      const nx = normals[vi], ny = normals[vi+1], nz = normals[vi+2];
      const px = pos[vi], py = pos[vi+1], pz = pos[vi+2];
      const invLen = 1.0/Math.max(EPS, Math.sqrt(px*px+py*py+pz*pz));
      const rx = px*invLen, ry = py*invLen, rz = pz*invLen;
      const flat = clamp(nx*rx + ny*ry + nz*rz, 0, 1); // 1=plano, 0=vertical
      const shade = lerp(1.0 - strength, 1.0 + strength*0.15, flat);
      // oscurecer/aclarar por pendiente
      colors[i] *= shade;
      colors[i+1] *= shade;
      colors[i+2] *= shade;
      // roca en pendientes muy verticales
      const steep = 1.0 - flat;
      if (steep > rockSlope){
        const t = clamp((steep - rockSlope) / Math.max(EPS, (1.0 - rockSlope)), 0, 1);
        colors[i]   = lerp(colors[i],   rock.r, t);
        colors[i+1] = lerp(colors[i+1], rock.g, t);
        colors[i+2] = lerp(colors[i+2], rock.b, t);
      }
    }
    return colors;
  };

  PlanetGenerator.prototype._ensureSeaMesh = function(){
    if (this.seaMesh) return;

    this.seaMesh = new BABYLON.Mesh("sea", this.scene);
    this.seaMesh.isPickable = false;

    const mat = new BABYLON.PBRMaterial("seaMat", this.scene);
    mat.albedoColor = BABYLON.Color3.White();
    mat.metallic = 0.0;
    mat.roughness = 0.12;
    mat.specularIntensity = 0.85;
    // Reflejos de entorno (sin skybox obligatorio)
    // Reflexión (IBL) opcional: solo si hay environmentTexture
    mat.reflectionTexture = this.scene.environmentTexture || null;
    if (mat.reflectionTexture) mat.reflectionTexture.level = 0.55;
    // Fresnel para reforzar borde/ángulo de visión
    mat.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    mat.reflectionFresnelParameters.bias = 0.08;
    mat.reflectionFresnelParameters.power = 4.0;
    mat.reflectionFresnelParameters.leftColor = new BABYLON.Color3(0.2,0.2,0.2);
    mat.reflectionFresnelParameters.rightColor = new BABYLON.Color3(1,1,1);
    // ClearCoat (brillo tipo lámina de agua)
    mat.clearCoat.isEnabled = true;
    mat.clearCoat.intensity = 0.75;
    mat.clearCoat.roughness = 0.12;
    // IMPORTANTE: el océano es semitransparente; sin prepass puede verse "a través" del planeta.
    // 1) backFaceCulling=true: no dibuja la cara trasera (el lado opuesto del planeta).
    // 2) needDepthPrePass=true: escribe profundidad antes de mezclar alpha, evitando el efecto rayos-X.
    mat.backFaceCulling = true;
    mat.needDepthPrePass = true;
    // Algunas versiones soportan forceDepthWrite; lo activamos si existe.
    if (typeof mat.forceDepthWrite !== "undefined") mat.forceDepthWrite = true;
    mat.zOffset = 2; // evita z-fighting
    this.seaMesh.material = mat;

    this.seaMesh.renderingGroupId = 1;
    this.mesh.renderingGroupId = 0;
  };

  PlanetGenerator.prototype._updateSeaGeometry = function(params){
    if (!params.seaEnabled){
      if (this.seaMesh) this.seaMesh.setEnabled(false);
      return;
    }

    this._ensureSeaMesh();
    this.seaMesh.setEnabled(true);

    const indices = this.mesh.getIndices();
    const seaMul = 1.0 + params.seaLevel;

    // MODO NUEVO: océano por "parches" (triángulos bajo el mar). Evita la sensación de esfera superpuesta.
    if (params.oceanMode === "patch"){
      const patch = buildOceanPatch(this._basePositions, indices, this._heights, params);

      this.seaMesh.setIndices(patch.indices);
      this.seaMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, patch.positions, true);

      // Cache para oleaje
      this._seaBasePos = new Float32Array(patch.positions);
      this._seaPos = new Float32Array(patch.positions);
      this._seaIdx = patch.indices;
      this._seaNrm = new Float32Array(patch.positions.length);

      const seaNormals = this._seaNrm;
      if (patch.indices.length > 0){
        BABYLON.VertexData.ComputeNormals(patch.positions, patch.indices, seaNormals);
      }
      this.seaMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, seaNormals, true);

      // Colores del agua: profundidad + espuma de orilla (sin texturas)
      if (params.colorsWaterEnabled && patch.orig && patch.orig.length){
        const vCount = (patch.positions.length/3)|0;
        const cols = new Float32Array(vCount*4);
        const shallow = hexToColor3(params.waterShallowColor);
        const deep = hexToColor3(params.waterDeepColor);
        const foamC = hexToColor3(params.foamColor);
        const seaMul2 = 1.0 + params.seaLevel;
        const depthRange = Math.max(EPS, params.waterDepthRange);
        const curve = Math.max(EPS, params.waterDepthCurve);
        const foamW = Math.max(0, params.foamWidth);
        const foamInt = clamp(params.foamIntensity, 0, 1);

        for (let vi=0; vi<vCount; vi++){
          const o = patch.orig[vi];
          const h = (o >= 0) ? this._heights[o] : seaMul2;
          const d = clamp((seaMul2 - h)/depthRange, 0, 1);
          const tt = Math.pow(d, curve);
          let r = shallow.r + (deep.r - shallow.r)*tt;
          let g = shallow.g + (deep.g - shallow.g)*tt;
          let b = shallow.b + (deep.b - shallow.b)*tt;

          if (params.foamEnabled && foamW > 0){
            const near = 1.0 - clamp(Math.abs(h - seaMul2)/foamW, 0, 1);
            const f = Math.pow(near, 1.6) * foamInt;
            r = r + (foamC.r - r)*f;
            g = g + (foamC.g - g)*f;
            b = b + (foamC.b - b)*f;
          }

          const bi = vi*4;
          cols[bi]=r; cols[bi+1]=g; cols[bi+2]=b; cols[bi+3]=1.0;
        }
        this.seaMesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, cols, true);
      }

      const m = this.seaMesh.material;
      m.albedoColor = hexToColor3(params.seaColor);
      // Recomendado: alpha 1.0 para evitar ordenación de transparencias.
      m.alpha = params.seaAlpha;
      m.zOffset = params.seaZOffset;
      m.backFaceCulling = !params.seaDoubleSided;
      // Si alpha < 1, forzamos pipeline correcto para evitar que se vea a través del terreno.
      if (m.alpha < 0.999){
        m.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        m.needDepthPrePass = true;
        if (typeof m.forceDepthWrite !== "undefined") m.forceDepthWrite = true;
      } else {
        m.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        m.needDepthPrePass = false;
        if (typeof m.forceDepthWrite !== "undefined") m.forceDepthWrite = false;
      }
      // Reflejos + fresnel
      m.roughness = params.seaRoughness;
      m.specularIntensity = params.seaSpecular;
      m.reflectionTexture = this.scene.environmentTexture || null;
      if (m.reflectionTexture) m.reflectionTexture.level = params.seaReflect;
      if (m.reflectionFresnelParameters){
        m.reflectionFresnelParameters.bias = params.seaFresnelBias;
        m.reflectionFresnelParameters.power = params.seaFresnelPower;
      }
      if (m.clearCoat){
        m.clearCoat.isEnabled = true;
        m.clearCoat.intensity = params.seaClearCoat;
        m.clearCoat.roughness = params.seaClearCoatRough;
      }
      return;
    }

    // MODO ANTERIOR: esfera (por si la quieres)
    const vCount = this._heights.length;
    const seaR = params.radius * seaMul * params.seaThickness;

    const base = this._basePositions;
    const seaPos = new Float32Array(base.length);
    for (let i=0;i<base.length;i+=3){
      const x = base[i], y = base[i+1], z = base[i+2];
      const invLen = 1.0 / Math.max(EPS, Math.sqrt(x*x+y*y+z*z));

      let rLocal = seaR;
      if (params.seaHugCoast){
        const vi = (i/3)|0;
        const terrainR = params.radius * this._heights[vi];
        if (terrainR > seaR && terrainR < seaR + params.seaHugBand){
          rLocal = seaR + (terrainR - seaR) * params.seaHugFactor;
        }
      }
      seaPos[i] = x*invLen*rLocal;
      seaPos[i+1] = y*invLen*rLocal;
      seaPos[i+2] = z*invLen*rLocal;
    }

    const seaNormals = new Float32Array(seaPos.length);
    BABYLON.VertexData.ComputeNormals(seaPos, indices, seaNormals);

    this.seaMesh.setIndices(indices);
    this.seaMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, seaPos, true);
    // Colores del agua (sphere): profundidad + espuma (usa alturas originales del planeta)
    if (params.colorsWaterEnabled){
      const vCount = this._heights.length;
      const cols = new Float32Array(vCount*4);
      const shallow = hexToColor3(params.waterShallowColor);
      const deep = hexToColor3(params.waterDeepColor);
      const foamC = hexToColor3(params.foamColor);
      const seaMul2 = 1.0 + params.seaLevel;
      const depthRange = Math.max(EPS, params.waterDepthRange);
      const curve = Math.max(EPS, params.waterDepthCurve);
      const foamW = Math.max(0, params.foamWidth);
      const foamInt = clamp(params.foamIntensity, 0, 1);

      for (let vi=0; vi<vCount; vi++){
        const h = this._heights[vi];
        const d = clamp((seaMul2 - h)/depthRange, 0, 1);
        const tt = Math.pow(d, curve);
        let r = shallow.r + (deep.r - shallow.r)*tt;
        let g = shallow.g + (deep.g - shallow.g)*tt;
        let b = shallow.b + (deep.b - shallow.b)*tt;

        if (params.foamEnabled && foamW > 0){
          const near = 1.0 - clamp(Math.abs(h - seaMul2)/foamW, 0, 1);
          const f = Math.pow(near, 1.6) * foamInt;
          r = r + (foamC.r - r)*f;
          g = g + (foamC.g - g)*f;
          b = b + (foamC.b - b)*f;
        }

        const bi = vi*4;
        cols[bi]=r; cols[bi+1]=g; cols[bi+2]=b; cols[bi+3]=1.0;
      }
      this.seaMesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, cols, true);
    }

    this.seaMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, seaNormals, true);

    // Cache para oleaje (sphere)
    this._seaBasePos = new Float32Array(seaPos);
    this._seaPos = new Float32Array(seaPos);
    this._seaIdx = indices;
    this._seaNrm = new Float32Array(seaPos.length);

    const m = this.seaMesh.material;
    m.albedoColor = hexToColor3(params.seaColor);
    m.alpha = params.seaAlpha;
    m.zOffset = params.seaZOffset;
    m.backFaceCulling = !params.seaDoubleSided;
      // Si alpha < 1, forzamos pipeline correcto para evitar que se vea a través del terreno.
      if (m.alpha < 0.999){
        m.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        m.needDepthPrePass = true;
        if (typeof m.forceDepthWrite !== "undefined") m.forceDepthWrite = true;
      } else {
        m.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        m.needDepthPrePass = false;
        if (typeof m.forceDepthWrite !== "undefined") m.forceDepthWrite = false;
      }
      // Reflejos + fresnel
      m.roughness = params.seaRoughness;
      m.specularIntensity = params.seaSpecular;
      m.reflectionTexture = this.scene.environmentTexture || null;
      if (m.reflectionTexture) m.reflectionTexture.level = params.seaReflect;
      if (m.reflectionFresnelParameters){
        m.reflectionFresnelParameters.bias = params.seaFresnelBias;
        m.reflectionFresnelParameters.power = params.seaFresnelPower;
      }
      if (m.clearCoat){
        m.clearCoat.isEnabled = true;
        m.clearCoat.intensity = params.seaClearCoat;
        m.clearCoat.roughness = params.seaClearCoatRough;
      }
  };

  PlanetGenerator.prototype.generate = function(params){
    this._noise = new Noise(params.seed|0);
	this._cloudNoise = new Noise((params.seed|0) + 99991);
    this._ensureMesh(params);
    this.radius = params.radius;

    // Gas giant: todo es atmósfera (bandas tipo Júpiter/Saturno)
    if (params.planetType === "GasGiant"){
      // Desactivar hidrosfera/geosfera extra
      if (this.seaMesh) this.seaMesh.setEnabled(false);
      this._generateGasGiant(params);
      // Asegurar nubes si el usuario quiere una capa superior (opcional)
      this._ensureCloudLayer(params);
      return;
    }

    this._buildCraters(params);

    // IMPORTANTE: asegurar capa de nubes (mesh + material + textura)
    // Si no se llama aquí, cloudMesh nunca se crea y no se ve nada.
    this._ensureCloudLayer(params);

    const radius = params.radius;
    const base = this._basePositions;
    const out = this._positions;
    const hArr = this._heights;

    // 1) calcular alturas (multiplicadores)
    for (let i=0, vi=0;i<base.length;i+=3, vi++){
      const x = base[i], y = base[i+1], z = base[i+2];
      const invLen = 1.0 / Math.max(EPS, Math.sqrt(x*x+y*y+z*z));
      const nx = x*invLen, ny = y*invLen, nz = z*invLen;

      let h = this._heightRaw(nx,ny,nz, params);
      h = this._applyCraters(nx,ny,nz, h, params);
      h = this._applySeaFlatten(h, params);
      if (params.heightClampEnabled){
        h = clamp(h, params.heightClampMin, params.heightClampMax);
      }
      hArr[vi] = h;
    }

    // 2) erosión térmica (geología más natural)
    this._thermalErosion(params);

    // 3) suavizado (sobre alturas, conserva radial)
    this._smoothHeights(params);

    // 4) posiciones finales
    for (let i=0, vi=0;i<base.length;i+=3, vi++){
      const x = base[i], y = base[i+1], z = base[i+2];
      const invLen = 1.0 / Math.max(EPS, Math.sqrt(x*x+y*y+z*z));
      const nx = x*invLen, ny = y*invLen, nz = z*invLen;
      const r = radius * hArr[vi];
      out[i] = nx*r; out[i+1]=ny*r; out[i+2]=nz*r;
    }

    this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, out, true, false);

    // Normales
    const indices = this.mesh.getIndices();
    const normals = new Float32Array(out.length);
    BABYLON.VertexData.ComputeNormals(out, indices, normals);
    this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true, false);

    // Colores por cota
    if (params.colorsEnabled){
      let cols = this._computeVertexColors(params);
      // Para slope shading necesitamos normales ya presentes (se leen del mesh)
      this.mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, cols, true);
      if (params.slopeShading){
        cols = this._applySlopeShading(cols, params);
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, cols, true, false);
      }
    } else {
      // quitar colors si existen
      if (this.mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)){
        this.mesh.removeVerticesData(BABYLON.VertexBuffer.ColorKind);
      }
    }

    // Mar encajado
    this._updateSeaGeometry(params);

    // Nubes reales (capa mesh)
    // Si no se llama aquí, cloudMesh nunca se crea y no se verá nada.
    this._ensureCloudLayer(params);
  };

  
  PlanetGenerator.prototype._ensureCloudLayer = function(params){
    const scene = this.scene;
    const enabled = !!params.cloudLayerEnabled;

    if (!enabled){
      if (this.cloudMesh){ this.cloudMesh.dispose(); this.cloudMesh = null; }
      if (this._cloudTex){ this._cloudTex.dispose(); this._cloudTex = null; }
      this._cloudMat = null;
      this._cloudKey = "";
      return;
    }

    const radius = params.radius;
    const mul = (typeof params.cloudLayerMul === "number") ? params.cloudLayerMul : 1.018;
    const cloudR = radius * mul;

    // Crea mesh si no existe
    if (!this.cloudMesh){
      const seg = Math.max(24, Math.min(72, Math.floor((params.subdivisions||48) * 0.75)));
      this.cloudMesh = BABYLON.MeshBuilder.CreateSphere("cloudLayer", { diameter: cloudR * 2, segments: seg }, scene);
      this.cloudMesh.isPickable = false;
      this.cloudMesh.renderingGroupId = 2; // encima de mar/terreno (y con depth)
      this.cloudMesh.alwaysSelectAsActiveMesh = true;

      // Material simple transparente
      const m = new BABYLON.StandardMaterial("cloudMat", scene);
      m.backFaceCulling = true;
      m.specularColor = new BABYLON.Color3(0,0,0);
      m.disableLighting = false;
      // IMPORTANT: las nubes NO deben "brillar" en la noche.
      // Sin emisión; se iluminan únicamente por la luz principal / IBL si está activa.
      m.emissiveColor = new BABYLON.Color3(0, 0, 0);
      m.alpha = 1.0;
      m.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
      this._cloudMat = m;
      this.cloudMesh.material = m;
    } else {
      // Actualiza tamaño si cambia
      this.cloudMesh.scaling.set(1,1,1);
      this.cloudMesh.scaling.scaleInPlace((cloudR*2) / this.cloudMesh.getBoundingInfo().boundingSphere.radius / 2);
      // Nota: el escalado anterior es defensivo; si prefieres, recreamos la esfera cuando cambie mul.
    }

    // Rebuild textura si han cambiado parámetros relevantes
    const key = [
      params.seed|0,
      mul.toFixed(4),
      (params.cloudScale||0).toFixed(3),
      (params.cloudCoverage||0).toFixed(3),
      (params.cloudSharpness||0).toFixed(3),
      (params.cloudAlpha||0).toFixed(3),
      String(params.cloudTint||"")
    ].join("|");
    if (key !== this._cloudKey){
      this._cloudKey = key;
      this._rebuildCloudTexture(params);
    }

    // Alpha global
    const a = (typeof params.cloudAlpha === "number") ? params.cloudAlpha : 0.22;
    this._cloudMat.alpha = Math.max(0, Math.min(1, a));
  };

  PlanetGenerator.prototype._rebuildCloudTexture = function(params){
    const scene = this.scene;
    const W = 1024, H = 512;
    if (!this._cloudTex){
      this._cloudTex = new BABYLON.DynamicTexture("cloudDT", { width: W, height: H }, scene, false);
      this._cloudTex.hasAlpha = true;
      this._cloudTex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
      this._cloudTex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    }

    const ctx = this._cloudTex.getContext();
    const img = ctx.createImageData(W, H);
    const data = img.data;

    const scale = (typeof params.cloudScale === "number") ? params.cloudScale : 2.7;
    const coverage = (typeof params.cloudCoverage === "number") ? params.cloudCoverage : 0.54; // más alto = menos nubes
    const sharp = (typeof params.cloudSharpness === "number") ? params.cloudSharpness : 2.2;
    const tint = (params.cloudTint || "#eef6ff");
    const col = BABYLON.Color3.FromHexString(tint);
	
    // Sin emisión: las nubes no deben verse iluminadas en el lado nocturno.
    if (this._cloudMat){
      this._cloudMat.emissiveColor = new BABYLON.Color3(0,0,0);
    }

    // FBM
    const fbm = (x,y,z)=>{
      let f=0, amp=0.55, freq=1.0;
      for (let o=0;o<5;o++){
        f += amp * this._cloudNoise.noise3D(x*freq, y*freq, z*freq);
        freq *= 2.02;
        amp *= 0.55;
      }
      // noise3D suele estar en [-1..1] => normalizamos a [0..1]
      return 0.5 + 0.5 * f;
    };

    // equirectangular: u = lon, v = lat
    for (let y=0; y<H; y++){
      const v = (y + 0.5) / H;
      const phi = v * Math.PI; // 0..pi
      const sp = Math.sin(phi), cp = Math.cos(phi);
      for (let x=0; x<W; x++){
        const u = (x + 0.5) / W;
        const th = u * Math.PI * 2.0;
        const ct = Math.cos(th), st = Math.sin(th);
        // dirección unidad
        const dx = sp * ct;
        const dy = cp;
        const dz = sp * st;

        let n = fbm(dx*scale, dy*scale, dz*scale);

        // Cobertura: umbral + suavizado + nitidez
        // coverage alto => menos nubes
        const t0 = coverage - 0.08;
        const t1 = coverage + 0.10;
        let m = (n - t0) / Math.max(EPS, (t1 - t0));
        m = clamp(m, 0, 1);
        // suavizado tipo smoothstep
        m = m*m*(3-2*m);
        // nitidez
        m = Math.pow(m, Math.max(0.2, sharp));

        const a = Math.floor(255 * m);
        const i = (y*W + x) * 4;
        data[i+0] = Math.floor(255 * col.r);
        data[i+1] = Math.floor(255 * col.g);
        data[i+2] = Math.floor(255 * col.b);
        data[i+3] = a;
      }
    }

    ctx.putImageData(img, 0, 0);
    this._cloudTex.update(false);

    // Asignar a material
    if (this._cloudMat){
      this._cloudMat.diffuseTexture = this._cloudTex;
      this._cloudMat.opacityTexture = this._cloudTex;
      this._cloudMat.useAlphaFromDiffuseTexture = true;
      if (this._cloudMat.diffuseTexture){
        this._cloudMat.diffuseTexture.uScale = 1.0;
        this._cloudMat.diffuseTexture.vScale = 1.0;
      }
    }
  };

  PlanetGenerator.prototype.updateClouds = function(dt, params){
    if (!this.cloudMesh || !this._cloudTex || !this._cloudMat) return;
    if (!params.cloudLayerEnabled) return;

    const dts = dt * 0.001;
    const rot = (typeof params.cloudRotSpeed === "number") ? params.cloudRotSpeed : 0.06;
    this.cloudMesh.rotation.y += rot * dts;

    // Deriva UV (viento) suave
    const wx = (typeof params.cloudWindX === "number") ? params.cloudWindX : 0.0;
    const wz = (typeof params.cloudWindZ === "number") ? params.cloudWindZ : 0.0;
    const tex = this._cloudTex;
    tex.uOffset = (tex.uOffset + wx * dts * 0.02) % 1.0;
    tex.vOffset = (tex.vOffset + wz * dts * 0.02) % 1.0;
  };

  
  // ----------------------------
  // Gas giant (Jupiter/Saturn-like)
  // ----------------------------
  PlanetGenerator.prototype._generateGasGiant = function(params){
    // No craters, no sea flatten, no erosion/smoothing
    const radius = params.radius;
    this.radius = radius;

    const base = this._basePositions;
    const out  = this._positions;
    const hArr = this._heights;

    const n = this._noise;

    const bulge = params.gasBulge ?? 0.035;
    const detailScale = params.gasDetailScale ?? 6.0;
    const detailOct = Math.max(1, Math.min(5, params.gasDetailOctaves ?? 2));
    const lac = params.gasDetailLacunarity ?? 2.03;
    const gain = params.gasDetailGain ?? 0.55;

    // heights
    for (let i=0, vi=0; i<base.length; i+=3, vi++){
      const x=base[i], y=base[i+1], z=base[i+2];
      const invLen = 1.0 / Math.max(EPS, Math.sqrt(x*x+y*y+z*z));
      const nx=x*invLen, ny=y*invLen, nz=z*invLen;

      // fbm for subtle bulge
      let amp=1.0, freq=detailScale, sum=0.0, norm=0.0;
      for (let o=0;o<detailOct;o++){
        sum += n.noise3D(nx*freq, ny*freq, nz*freq) * amp;
        norm += amp;
        amp *= gain;
        freq *= lac;
      }
      const fbm = sum / Math.max(EPS, norm); // ~[-1..1]
      const smooth = (params.gasSmooth ?? 0.65);
      // Smoothness reduces micro-bulge influence (smoother surface)
      const fbmSm = fbm * (0.25 + 0.75*(1.0 - smooth));
      const h = 1.0 + bulge * fbmSm;
      hArr[vi] = h;
    }

    // positions
    for (let i=0, vi=0; i<base.length; i+=3, vi++){
      const x=base[i], y=base[i+1], z=base[i+2];
      const invLen = 1.0 / Math.max(EPS, Math.sqrt(x*x+y*y+z*z));
      const nx=x*invLen, ny=y*invLen, nz=z*invLen;
      const r = radius * hArr[vi];
      out[i]=nx*r; out[i+1]=ny*r; out[i+2]=nz*r;
    }

    this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, out, true, false);

    const indices = this.mesh.getIndices();
    const normals = new Float32Array(out.length);
    BABYLON.VertexData.ComputeNormals(out, indices, normals);
    this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true, false);

    // Gas vertex colors (bands + turbulence)
    this._applyGasColors(params);
  };

  PlanetGenerator.prototype._applyGasColors = function(params){
    const out = this._positions;
    const baseA = BABYLON.Color3.FromHexString(params.gasColorA || "#d8b48a");
    const baseB = BABYLON.Color3.FromHexString(params.gasColorB || "#b9855f");
    const baseC = BABYLON.Color3.FromHexString(params.gasColorC || "#f2d7b6");

    const bands = Math.max(2, Math.min(64, params.gasBandCount ?? 14));
    const contrast = params.gasBandContrast ?? 0.95;
    const swirl = params.gasSwirl ?? 0.45;

    const stormAmp = params.gasStormAmp ?? 0.22;
    const stormScale = params.gasStormScale ?? 16.0;

    const latWarp = params.gasLatWarp ?? 0.25;     // how "curvy" bands are
    const bandSharp = params.gasBandSharpness ?? 1.35;

    const n = this._noise;

    const vCount = out.length/3;
    const cols = new Float32Array(vCount*4);

    for (let i=0;i<vCount;i++){
      const x=out[i*3], y=out[i*3+1], z=out[i*3+2];
      const invLen = 1.0 / Math.max(EPS, Math.sqrt(x*x+y*y+z*z));
      const nx=x*invLen, ny=y*invLen, nz=z*invLen;

      // latitude in 0..1
      const lat01 = (Math.asin(clamp(ny,-1,1))/Math.PI) + 0.5;

      // warp latitude using noise so bands meander
      const w = n.noise3D(nx*stormScale*0.35, ny*stormScale*0.35, nz*stormScale*0.35);
      const lat = lat01 + w*latWarp*0.08;

      // band pattern
      let b = Math.sin(lat * Math.PI * bands);
      // sharpen bands (Jupiter-like)
      b = Math.sign(b) * Math.pow(Math.abs(b), bandSharp);

      // turbulence / swirl
      const tN = n.noise3D(nx*stormScale, ny*stormScale, nz*stormScale);
      let t = 0.5 + 0.5*(b*contrast + tN*swirl);
      t = clamp(t, 0, 1);

      // palette mix A-B-C
      let r,g,bb;
      if (t < 0.5){
        const u = t/0.5;
        r = baseA.r + (baseB.r-baseA.r)*u;
        g = baseA.g + (baseB.g-baseA.g)*u;
        bb= baseA.b + (baseB.b-baseA.b)*u;
      } else {
        const u = (t-0.5)/0.5;
        r = baseB.r + (baseC.r-baseB.r)*u;
        g = baseB.g + (baseC.g-baseB.g)*u;
        bb= baseB.b + (baseC.b-baseB.b)*u;
      }

      // storms/ovals
      const oval = Math.max(0, tN) * stormAmp;
      r = clamp(r + oval*0.25, 0, 1);
      g = clamp(g + oval*0.18, 0, 1);
      bb= clamp(bb+ oval*0.12, 0, 1);

      cols[i*4]=r; cols[i*4+1]=g; cols[i*4+2]=bb; cols[i*4+3]=1.0;
    }

    this.mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, cols, true);
    this.mesh.material.useVertexColors = true;
    this.mesh.material.albedoColor = BABYLON.Color3.White();
    this.mesh.material.roughness = params.gasRoughness ?? 0.85;
    this.mesh.material.metallic = 0.0;
  };

global.PlanetGenerator = PlanetGenerator;
})(window);
