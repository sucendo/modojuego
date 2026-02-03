// src/planets/planetGenerator.js
// Port of generate-planet-js PlanetGenerator (terrain + crater + optional sea patch).
// Uses global BABYLON. Designed to consume the exported JSON params.

import { Noise } from "../utils/perlinNoise.js";

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

    this._noise = new Noise(1337);

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
    this.mesh = null; this.seaMesh = null;
    this._basePositions = null; this._positions = null; this._heights = null;
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

    // IMPORTANT: si el mar está en otro rendering group que el terreno,
    // puede ignorar el depth de lo ya dibujado y "verse a través" de montañas/otros planetas.
    // Mantén mar y tierra en el MISMO grupo.
    this.seaMesh.renderingGroupId = 0;
    // Renderiza el mar después del terreno dentro del grupo (si procede).
    this.seaMesh.alphaIndex = 2;
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
    this._ensureMesh(params);
    this._buildCraters(params);

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
  };



  PlanetGenerator.prototype.updateSeaWaves = function(dt, params){
    if (!this.seaMesh || !this.seaMesh.isEnabled()) return;
    if (!params.wavesEnabled) return;
    if (!this._seaBasePos || !this._seaPos || !this._seaIdx) return;

    this._seaTime += dt * params.waveSpeed;
    const t = this._seaTime;

    const base = this._seaBasePos;
    const out = this._seaPos;
    const amp = params.waveAmp;
    const scale = params.waveScale;

    // Oleaje radial simple: desplaza a lo largo del normal/radial usando ruido 3D animado.
    for (let i=0;i<base.length;i+=3){
      const x = base[i], y = base[i+1], z = base[i+2];
      const invLen = 1.0 / Math.max(EPS, Math.sqrt(x*x+y*y+z*z));
      const nx = x*invLen, ny = y*invLen, nz = z*invLen;

      let n = this._noise.noise3D(nx*scale + t*0.15, ny*scale + t*0.12, nz*scale + t*0.10);
      if (params.waveOctaves > 1){
        let a = 0.5, f = 2.0;
        for (let o=1;o<params.waveOctaves;o++){
          n += this._noise.noise3D(nx*scale*f + t*0.11, ny*scale*f + t*0.09, nz*scale*f + t*0.08) * a;
          a *= 0.5;
          f *= 2.0;
        }
      }
      n = n / Math.max(1, params.waveOctaves);

      const w = amp * n;
      out[i]   = x + nx*w;
      out[i+1] = y + ny*w;
      out[i+2] = z + nz*w;
    }

    // Actualizar posiciones y normales (normales no hace falta cada frame si quieres optimizar)
    this.seaMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, out, true, false);

    // Normales cada N ms
    this._seaNrmTick = this._seaNrmTick || 0;
    this._seaNrmTick += dt;
    if (this._seaNrmTick >= (params.waveNormalEveryMs || 80)){
      this._seaNrmTick = 0;
      const nrm = this._seaNrm || new Float32Array(out.length);
      BABYLON.VertexData.ComputeNormals(out, this._seaIdx, nrm);
      this._seaNrm = nrm;
      this.seaMesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, nrm, true, false);
    }
  };

export { PlanetGenerator };
