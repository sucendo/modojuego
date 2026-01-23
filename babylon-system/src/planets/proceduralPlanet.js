// src/planets/proceduralPlanet.js
import { fbm3, lerp } from "../utils/noise.js";

// Chunk mesh pool is kept per planet to avoid cross-planet material/shadow issues.

class PlanetChunk {
  constructor(parentPlanet, radius, detailLevel, localUp, bounds, material, seed) {
    this.scene = parentPlanet.scene;
    this.parentPlanet = parentPlanet;
    this.localUp = localUp;
    this.bounds = bounds; // {minX,maxX,minY,maxY} in [0..1]
    this.detailLevel = detailLevel;
    this.radius = radius;
    this.material = material;
    this.seed = seed;

    this.children = [];
    this.isLeaf = true;
    this.mesh = null;

    // split distance tuned for web
    this.splitDistance = radius * (1.9 / Math.pow(1.85, detailLevel));
    this.mergeDistance = this.splitDistance * 1.35; // hysteresis

    this.buildMesh();
  }

  buildMesh() {
    const resolution = this.parentPlanet.chunkResolution; // vertices per side
    const positions = new Array((resolution + 1) * (resolution + 1) * 3);
    const normals = new Array((resolution + 1) * (resolution + 1) * 3);
    const uvs = new Array((resolution + 1) * (resolution + 1) * 2);
    const colors = new Array((resolution + 1) * (resolution + 1) * 4);
    const indices = [];

    const lu = this.localUp;
    const axisA = new BABYLON.Vector3(lu.y, lu.z, lu.x);
    const axisB = BABYLON.Vector3.Cross(lu, axisA);

    // Reuse vector to avoid per-vertex allocations
    const p = new BABYLON.Vector3();

    let vp = 0, vn = 0, vt = 0, vc = 0;

    for (let y = 0; y <= resolution; y++) {
      for (let x = 0; x <= resolution; x++) {
        const px = x / resolution;
        const py = y / resolution;

        const localX = this.bounds.minX + (this.bounds.maxX - this.bounds.minX) * px;
        const localY = this.bounds.minY + (this.bounds.maxY - this.bounds.minY) * py;

        const cx = (localX - 0.5) * 2;
        const cy = (localY - 0.5) * 2;

        // pointOnCube = localUp + axisA*cx + axisB*cy (numeric, no temp vectors)
        const cX = lu.x + axisA.x * cx + axisB.x * cy;
        const cY = lu.y + axisA.y * cx + axisB.y * cy;
        const cZ = lu.z + axisA.z * cx + axisB.z * cy;

        // normalize
        const invLen = 1.0 / Math.max(1e-9, Math.hypot(cX, cY, cZ));
        const sX = cX * invLen, sY = cY * invLen, sZ = cZ * invLen;
        p.set(sX, sY, sZ);

        // Terrain
        let elevation = this.parentPlanet.computeElevation(sX, sY, sZ);

        const r = this.radius * (1 + elevation);
        positions[vp++] = sX * r;
        positions[vp++] = sY * r;
        positions[vp++] = sZ * r;

        // initial normals, recomputed later
        normals[vn++] = sX;
        normals[vn++] = sY;
        normals[vn++] = sZ;

        uvs[vt++] = px;
        uvs[vt++] = py;

        const c = this.parentPlanet.getBiomeColor(p, elevation);
        colors[vc++] = c.r;
        colors[vc++] = c.g;
        colors[vc++] = c.b;
        colors[vc++] = 1.0;
      }
    }

    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const i = x + y * (resolution + 1);
        indices.push(i, i + 1, i + resolution + 1);
        indices.push(i + 1, i + resolution + 2, i + resolution + 1);
      }
    }

    const mesh = this.parentPlanet._allocChunkMesh(this.detailLevel);
    mesh.name = `chunk_${this.parentPlanet.name}_L${this.detailLevel}`;
    mesh.metadata = mesh.metadata || {};
    mesh.metadata.isChunk = true;
    mesh.metadata.planet = this.parentPlanet.name;

    const vd = new BABYLON.VertexData();
    vd.positions = positions;
    vd.indices = indices;
    vd.normals = normals;
    vd.uvs = uvs;
    vd.colors = colors;
    vd.applyToMesh(mesh, true);

    // recompute normals for terrain
    const tempNormals = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, tempNormals);
    mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, tempNormals);

    // Low-poly look (faceted). Evitar hacerlo en LOD muy alto para no matar CPU.
    if (this.detailLevel <= 4 && this.parentPlanet.chunkResolution <= 16) {
      try { mesh.convertToFlatShadedMesh(); } catch (e) {}
    }

    mesh.material = this.material;
    mesh.parent = this.parentPlanet.root;
    mesh.isPickable = true;
    mesh.checkCollisions = false;

    if (this.parentPlanet.shadowGen) {
      this.parentPlanet.shadowGen.addShadowCaster(mesh);
      mesh.receiveShadows = true;
    }

    // Allow the host app to configure lights, shadows, rendering groups, etc.
    // (e.g., add this chunk to a light's includedOnlyMeshes list).
    try {
      const cb = this.parentPlanet.onChunkMesh;
      if (typeof cb === "function") cb(mesh, this.parentPlanet);
    } catch (e) {}

    this.mesh = mesh;
  }

  updateLOD(cameraPos) {
    if (!this.mesh) return;

    const dist = BABYLON.Vector3.Distance(cameraPos, this.mesh.getBoundingInfo().boundingSphere.centerWorld);

    if (dist < this.splitDistance && this.detailLevel < this.parentPlanet.maxDetailLevel) {
      if (this.isLeaf) this.parentPlanet._requestSplit(this);
      if (!this.isLeaf) for (const c of this.children) c.updateLOD(cameraPos);
    } else if (dist > (this.mergeDistance || (this.splitDistance * 1.35))) {
      if (!this.isLeaf) this.merge();
    }
  }

  split() {
    this.isLeaf = false;
    if (this.mesh) this.mesh.setEnabled(false);

    const next = this.detailLevel + 1;
    const b = this.bounds;
    const midX = (b.minX + b.maxX) / 2;
    const midY = (b.minY + b.maxY) / 2;

    const b1 = { minX: b.minX, maxX: midX, minY: b.minY, maxY: midY };
    const b2 = { minX: midX, maxX: b.maxX, minY: b.minY, maxY: midY };
    const b3 = { minX: b.minX, maxX: midX, minY: midY, maxY: b.maxY };
    const b4 = { minX: midX, maxX: b.maxX, minY: midY, maxY: b.maxY };

    this.children = [
      new PlanetChunk(this.parentPlanet, this.radius, next, this.localUp, b1, this.material, this.seed),
      new PlanetChunk(this.parentPlanet, this.radius, next, this.localUp, b2, this.material, this.seed),
      new PlanetChunk(this.parentPlanet, this.radius, next, this.localUp, b3, this.material, this.seed),
      new PlanetChunk(this.parentPlanet, this.radius, next, this.localUp, b4, this.material, this.seed),
    ];
  }

  merge() {
    this.isLeaf = true;
    if (this.mesh) this.mesh.setEnabled(true);
    for (const c of this.children) c.dispose();
    this.children = [];
  }

  dispose() {
    if (this.mesh) {
      if (this.parentPlanet.shadowGen) this.parentPlanet.shadowGen.removeShadowCaster(this.mesh);
      this.parentPlanet._freeChunkMesh(this.mesh);
      this.mesh = null;
    }
    for (const c of this.children) c.dispose();
    this.children = [];
  }
}

export class ProceduralPlanet {
  constructor(scene, name, radius, shadowGen, opts = null) {
    this.scene = scene;
    this.name = name;
    this.radius = radius;
    this.shadowGen = shadowGen;

    this.root = new BABYLON.TransformNode(name + "_procRoot", scene);
    this.faces = [];

    // Tuning
    this.hasTerrain = true;
    this.terrainScale = 0.15;
    this.seaLevel = -0.02;
    this.noiseFrequency = 3.5;
    this.noiseOctaves = 7;

    this.chunkResolution = 18;
    this.maxDetailLevel = 6;

    this.material = new BABYLON.StandardMaterial(name + "_procMat", scene);
    this.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
    this.material.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    this.material.useVertexColor = true;
    // Nota: no congelamos aquí; el host puede añadir bump/params. Se puede freeze() luego si se quiere.

    // Optional callback invoked for every created chunk mesh.
    // Signature: (mesh, planet) => void
    this.onChunkMesh = null;

    // Biome preset (descriptive ids). Old ids are still supported via alias map.
    this.biomePreset = "default";
    this.atmo = null;
    this.seed = (name.length * 17.13) % 1000;
    // Def opcional del planeta (para replicar características del "far planet" en superficie)
    this.def = opts || {};
    // Aplica overrides del def si vienen (para consistencia)
    if (this.def.biomePreset) this.biomePreset = this.def.biomePreset;
    if (this.def.terrainScale != null) this.terrainScale = this.def.terrainScale;
    if (this.def.seaLevel != null) this.seaLevel = this.def.seaLevel;
    if (this.def.noiseFrequency != null) this.noiseFrequency = this.def.noiseFrequency;
    if (this.def.noiseOctaves != null) this.noiseOctaves = this.def.noiseOctaves;
    // Micro-bump opcional (si existe el PNG en /textures/planets/)
    if (this.def.microBump) {
      try {
        const bt = new BABYLON.Texture(this.def.microBump, scene, true, false);
        bt.uScale = 6;
        bt.vScale = 6;
        this.material.bumpTexture = bt;
        this.material.bumpTexture.level = 0.8;
      } catch (e) {}
    }


    // Océano en superficie (si el planeta lo tiene)
    this.ocean = null;
    if (this.def.ocean) {
      const sea = (this.def.seaLevel != null) ? this.def.seaLevel : this.seaLevel;
      const seaFrac = Math.max(0.6, 1 + sea + 0.002);
      this.ocean = BABYLON.MeshBuilder.CreateSphere(
        name + "_procOcean",
        { diameter: radius * 2 * seaFrac, segments: 28 },
        scene
      );
      this.ocean.parent = this.root;
      this.ocean.isPickable = false;
      this.ocean.checkCollisions = false;

      const oceanKind = this.def.oceanKind || "water";
      const om = new BABYLON.PBRMaterial(name + "_procOceanMat", scene);

      if (oceanKind === "lava" || this.biomePreset === "lava_world") {
        // Lava: emisivo, opaco, más rugoso
        om.albedoColor = new BABYLON.Color3(0.10, 0.03, 0.02);
        om.emissiveColor = new BABYLON.Color3(1.2, 0.35, 0.12);
        om.metallic = 0.0;
        om.roughness = 0.55;
        om.alpha = 1.0;
        om.transparencyMode = BABYLON.PBRMaterial.PBR_OPAQUE;
      } else {
        // Agua
        om.albedoColor = this.def.oceanColor || new BABYLON.Color3(0.05, 0.18, 0.28);
        om.metallic = 0.15;
        om.roughness = 0.20;
        om.alpha = 0.90;
        om.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        om.backFaceCulling = true;
      }

      this.ocean.material = om;
    }


    // Mesh pool (avoid alloc/dispose churn)
    this._chunkMeshPool = [];
    this._chunkMeshPoolMax = 256; // sane default

    const dirs = [
      new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, -1, 0),
      new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(-1, 0, 0),
      new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 0, -1)
    ];

    for (const dir of dirs) {
      this.faces.push(new PlanetChunk(
        this,
        this.radius,
        0,
        dir,
        { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        this.material,
        this.seed
      ));
    }

    this.enabled = true;
    this._splitQueue = [];
    this._maxSplitsPerFrame = 6;
    this.setEnabled(false);
  }


	  
      // Color por bioma (inspirado en Dune / planetas ficticios)
      // Biomes are referenced by descriptive ids (e.g. "desert_dunes").
      // Legacy ids (e.g. "arrakis") are mapped via BIOME_ALIASES.
      // Elevación del terreno (misma "receta" que el far-planet para que no cambie el look al entrar en superficie)
      computeElevation(sX, sY, sZ) {
        if (!this.hasTerrain) return 0;

        const clamp01 = (x) => Math.max(0, Math.min(1, x));
        const amp = this.terrainScale;
        const sea = this.seaLevel;
        const f = this.noiseFrequency;
        const seed = this.seed;

        // base fbm
        const n0 = (fbm3(sX * f + seed, sY * f + seed, sZ * f + seed, this.noiseOctaves) * 2 - 1);

        // ridges
        const r0 = 1.0 - Math.abs(n0);
        const ridge = Math.pow(clamp01(r0), 2.2);

        // extra detail
        const n1 = (fbm3(
          sX * f * 2.4 + 19.7 + seed,
          sY * f * 2.4 + 3.3 + seed,
          sZ * f * 2.4 + 11.1 + seed,
          4
        ) * 2 - 1);

        let elev = (n0 * 0.55 + ridge * 0.55 + n1 * 0.12) * amp;

        // Planet-specific flavor (aliases legacy->descriptivo)
        const BIOME_ALIASES = {
          arrakis: "desert_dunes",
          caladan: "oceanic_temperate",
          giedi: "industrial_toxic",
          ice: "ice_world",
          ix: "techno_frost",
          kaitain: "imperial_temperate",
          salusa: "harsh_badlands",
          richese: "archipelago_turquoise",
          lava: "lava_world",
        };
        const preset = BIOME_ALIASES[this.biomePreset] || this.biomePreset;

        if (preset === "desert_dunes") {
          // dunes banding (se nota MUCHO en superficie)
          const band = (Math.sin((sX + sZ) * 16.0) * 0.5 + 0.5) * 0.10;
          elev += band * amp * 0.55;
        }
        if (preset === "industrial_toxic" || preset === "harsh_badlands") {
          // cráteres / erosión
          const pits = (fbm3(
            sX * f * 4.0 + 99.0 + seed,
            sY * f * 4.0 + 17.0 + seed,
            sZ * f * 4.0 + 33.0 + seed,
            3
          ) - 0.55);
          elev += pits * amp * 0.20;
        }

        // clamp by seaLevel (visual basins)
        elev = Math.max(elev, sea);

        // low-poly quantization for chunky facets
        const step = amp * 0.11;
        if (step > 0) elev = Math.round(elev / step) * step;

        return elev;
      }


      getBiomeColor(pOnSphere, elevation) {
        const BIOME_ALIASES = {
          // legacy -> descriptive
          arrakis: "desert_dunes",
          caladan: "oceanic_temperate",
          giedi: "industrial_toxic",
          ice: "ice_world",
          ix: "techno_frost",
          kaitain: "imperial_temperate",
          salusa: "harsh_badlands",
          richese: "archipelago_turquoise",
          lava: "lava_world",
        };

        const preset = BIOME_ALIASES[this.biomePreset] || this.biomePreset;
        const clamp01 = (x) => Math.max(0, Math.min(1, x));
        const lerp3 = (a,b,t) => new BABYLON.Color3(
          lerp(a.r,b.r,t), lerp(a.g,b.g,t), lerp(a.b,b.b,t)
        );

        // normaliza altura a 0..1 aprox
        const h = elevation; // suele estar en [-0.02 .. +0.16] según preset
        const h01 = clamp01((h - this.seaLevel) / Math.max(1e-6, (this.terrainScale * 1.2)));

        // latitud 0..1 (para nieve en polos si aplica)
        const lat = clamp01(Math.abs(pOnSphere.y));

        // presets
        if (preset === "desert_dunes") {
          // Desierto: arena + roca oscura en montañas, casi sin agua
          const sand = new BABYLON.Color3(0.82, 0.70, 0.46);
          const dune = new BABYLON.Color3(0.90, 0.78, 0.52);
          const rock = new BABYLON.Color3(0.35, 0.29, 0.22);
          const t = clamp01(Math.pow(h01, 1.2));
          // dunas (ligero “bandeado”)
          const band = (Math.sin((pOnSphere.x + pOnSphere.z) * 18.0) * 0.5 + 0.5) * 0.08;
          const base = lerp3(sand, dune, clamp01(t + band));
          return lerp3(base, rock, clamp01((h01 - 0.65) * 2.2));
        }

        if (preset === "oceanic_temperate") {
          // Oceánico: agua profunda + costas claras + verde húmedo + nieve en picos/polos
          const deep = new BABYLON.Color3(0.03, 0.12, 0.22);
          const water = new BABYLON.Color3(0.05, 0.22, 0.35);
          const shore = new BABYLON.Color3(0.78, 0.72, 0.55);
          const green = new BABYLON.Color3(0.16, 0.48, 0.18);
          const rock  = new BABYLON.Color3(0.30, 0.28, 0.25);
          const snow  = new BABYLON.Color3(0.92, 0.92, 0.92);

          if (h < 0.0) {
            const d = clamp01((-h) * 10);
            return lerp3(water, deep, d);
          }
          // costa cerca de 0
          const coast = clamp01(1 - Math.abs(h) * 55);
          let land = (h01 < 0.55) ? green : lerp3(green, rock, clamp01((h01 - 0.55) * 1.8));
          land = lerp3(land, shore, coast);
          // nieve por altura + polos
          const snowMask = clamp01((h01 - 0.82) * 4.0) * clamp01((lat - 0.25) * 1.4 + 0.3);
          return lerp3(land, snow, snowMask);
        }

        if (preset === "industrial_toxic") {
          // Industrial oscuro: basaltos, ceniza, “brillos” verdosos
          const ash = new BABYLON.Color3(0.10, 0.10, 0.11);
          const basalt = new BABYLON.Color3(0.18, 0.17, 0.16);
          const metal = new BABYLON.Color3(0.22, 0.23, 0.24);
          const toxic = new BABYLON.Color3(0.10, 0.22, 0.12);
          const t = clamp01(Math.pow(h01, 1.1));
          let c = lerp3(ash, basalt, t);
          c = lerp3(c, metal, clamp01((h01 - 0.6) * 2.0));
          // “manchas” verdosas sutiles
          const stain = clamp01((fbm3(pOnSphere.x*5+this.seed, pOnSphere.y*5+this.seed, pOnSphere.z*5+this.seed, 3) - 0.55) * 3.0);
          c = lerp3(c, toxic, stain * 0.35);
          return c;
        }

        if (preset === "ice_world") {
          // Helado: hielo + roca
          const ice = new BABYLON.Color3(0.78, 0.86, 0.92);
          const snow = new BABYLON.Color3(0.94, 0.95, 0.96);
          const rock = new BABYLON.Color3(0.32, 0.32, 0.35);
          const t = clamp01(h01);
          let c = lerp3(ice, snow, clamp01((t - 0.2) * 1.4));
          c = lerp3(c, rock, clamp01((t - 0.75) * 2.0));
          return c;
        }

        if (preset === "techno_frost") {
          // Ix: frío/tecnológico (acero + hielo + roca)
          const steel = new BABYLON.Color3(0.38, 0.42, 0.46);
          const rock  = new BABYLON.Color3(0.24, 0.25, 0.28);
          const ice   = new BABYLON.Color3(0.82, 0.88, 0.94);
          const t = clamp01(Math.pow(h01, 1.1));
          let c = lerp3(steel, rock, clamp01((t - 0.35) * 1.5));
          const frost = clamp01((lat - 0.18) * 1.6) * clamp01((0.55 - h01) * 2.0);
          c = lerp3(c, ice, frost);
          return c;
        }

        if (preset === "imperial_temperate") {
          // Kaitain: templado imperial (praderas, tierras claras, mares)
          const water = new BABYLON.Color3(0.05, 0.18, 0.30);
          const deep  = new BABYLON.Color3(0.02, 0.08, 0.16);
          const shore = new BABYLON.Color3(0.80, 0.74, 0.56);
          const grass = new BABYLON.Color3(0.20, 0.55, 0.22);
          const soil  = new BABYLON.Color3(0.58, 0.52, 0.38);
          const rock  = new BABYLON.Color3(0.32, 0.30, 0.28);

          if (h < 0.0) {
            const d = clamp01((-h) * 10);
            return lerp3(water, deep, d);
          }
          const coast = clamp01(1 - Math.abs(h) * 65);
          let land = (h01 < 0.48) ? grass : lerp3(grass, soil, clamp01((h01 - 0.48) * 1.7));
          land = lerp3(land, rock, clamp01((h01 - 0.78) * 2.2));
          land = lerp3(land, shore, coast);
          return land;
        }

        if (preset === "harsh_badlands") {
          // Salusa Secundus: áspero, cárcavas, roca rojiza
          const dark = new BABYLON.Color3(0.12, 0.10, 0.10);
          const rust = new BABYLON.Color3(0.42, 0.22, 0.16);
          const rock = new BABYLON.Color3(0.30, 0.22, 0.20);
          const t = clamp01(Math.pow(h01, 1.2));
          let c = lerp3(dark, rust, clamp01(t + 0.12));
          c = lerp3(c, rock, clamp01((h01 - 0.62) * 2.2));
          // ceniza/tormentas sutiles
          const ash = clamp01((fbm3(pOnSphere.x*4+this.seed, pOnSphere.y*4+this.seed, pOnSphere.z*4+this.seed, 3) - 0.55) * 3.2);
          c = lerp3(c, dark, ash * 0.25);
          return c;
        }

        if (preset === "archipelago_turquoise") {
          // Richese: archipiélagos, mares turquesa, costas claras
          const deep  = new BABYLON.Color3(0.02, 0.14, 0.20);
          const water = new BABYLON.Color3(0.04, 0.28, 0.34);
          const aqua  = new BABYLON.Color3(0.08, 0.42, 0.40);
          const shore = new BABYLON.Color3(0.86, 0.80, 0.62);
          const green = new BABYLON.Color3(0.18, 0.56, 0.22);
          const rock  = new BABYLON.Color3(0.30, 0.30, 0.28);

          if (h < 0.0) {
            const d = clamp01((-h) * 10);
            return lerp3(water, deep, d);
          }
          const coast = clamp01(1 - Math.abs(h) * 80);
          let land = (h01 < 0.55) ? green : lerp3(green, rock, clamp01((h01 - 0.55) * 1.9));
          land = lerp3(land, shore, coast);
          // lagunas turquesa (manchas)
          const lagoon = clamp01((fbm3(pOnSphere.x*6+this.seed, pOnSphere.y*6+this.seed, pOnSphere.z*6+this.seed, 2) - 0.58) * 3.4);
          land = lerp3(land, aqua, lagoon * 0.18);
          return land;
        }

        if (preset === "lava_world") {
          // Lava world: basalto/ceniza + mares de lava (emissive se aplica en el material del océano)
          const ash   = new BABYLON.Color3(0.08, 0.08, 0.09);
          const basalt= new BABYLON.Color3(0.14, 0.14, 0.15);
          const rock  = new BABYLON.Color3(0.22, 0.21, 0.21);
          const hot   = new BABYLON.Color3(0.75, 0.22, 0.04);  // costras calientes
          const glow  = new BABYLON.Color3(1.00, 0.38, 0.06);  // lava brillante (solo color base)

          // h < 0 => “mar” (lava)
          if (h < 0.0) {
            // más brillante cerca del borde (poco profundo)
            const shallow = clamp01(1.0 - clamp01((-h) * 18.0));
            // manchas/venas en la lava
            const veins = clamp01((fbm3(pOnSphere.x*7+this.seed, pOnSphere.y*7+this.seed, pOnSphere.z*7+this.seed, 3) - 0.55) * 3.0);
            let c = lerp3(new BABYLON.Color3(0.35,0.06,0.02), glow, shallow);
            c = lerp3(c, new BABYLON.Color3(1.0,0.65,0.15), veins*0.55);
            return c;
          }

          // tierra: ceniza abajo -> basalto -> roca -> “hot caps” en cimas
          let land = lerp3(ash, basalt, clamp01(h01 * 1.2));
          land = lerp3(land, rock, clamp01((h01 - 0.45) * 1.6));

          // cimas “más calientes / erosionadas”
          const peak = clamp01((h01 - 0.72) / 0.22);
          land = lerp3(land, hot, peak);
          return land;
        }		

        // default (rocoso simple)
        const low = new BABYLON.Color3(0.35, 0.35, 0.37);
        const high = new BABYLON.Color3(0.55, 0.55, 0.55);
        return lerp3(low, high, h01);
      }

  _allocChunkMesh(detailLevel) {
    let mesh = this._chunkMeshPool.pop() || null;
    if (!mesh) {
      mesh = new BABYLON.Mesh("chunkPool", this.scene);
      mesh.isPickable = true;
      mesh.checkCollisions = false;
    }
    mesh.setEnabled(true);
    mesh.parent = this.root;
    return mesh;
  }

  _freeChunkMesh(mesh) {
    if (!mesh) return;
    mesh.setEnabled(false);
    mesh.parent = null;
    // Keep buffers for reuse; just pool mesh objects.
    if (this._chunkMeshPool.length < this._chunkMeshPoolMax) {
      this._chunkMeshPool.push(mesh);
    } else {
      mesh.dispose();
    }
  }



      setEnabled(on) {
        this.enabled = on;
        this.root.setEnabled(on);
        for (const f of this.faces) this._setChunkTreeEnabled(f, on);
        if (this.atmo) this.atmo.setEnabled(on);
      }

      _setChunkTreeEnabled(chunk, on) {
        if (chunk.mesh) chunk.mesh.setEnabled(on && chunk.isLeaf);
        if (!chunk.isLeaf) for (const c of chunk.children) this._setChunkTreeEnabled(c, on);
      }

      _requestSplit(chunk) {
        // Evita duplicados
        if (chunk._queued) return;
        chunk._queued = true;
        this._splitQueue.push(chunk);
      }

      update(camera) {
        if (!this.enabled) return;

        // update lod only if camera is near
        const dist = BABYLON.Vector3.Distance(camera.position, this.root.position);
        if (dist < this.radius * 5.5) {
          for (const f of this.faces) f.updateLOD(camera.position);
        }

        // Procesa splits con presupuesto por frame (evita picos)
        let budget = this._maxSplitsPerFrame;
        while (budget-- > 0 && this._splitQueue.length) {
          const ch = this._splitQueue.shift();
          if (!ch) break;
          ch._queued = false;
          if (ch.isLeaf) ch.split();
        }
      }

      countActiveChunks() {
        let total = 0;
        for (const f of this.faces) total += this._countLeaves(f);
        return total;
      }
      _countLeaves(chunk) {
        if (chunk.isLeaf) return (chunk.mesh && chunk.mesh.isEnabled()) ? 1 : 0;
        let c = 0;
        for (const ch of chunk.children) c += this._countLeaves(ch);
        return c;
      }

      dispose() {
        for (const f of this.faces) f.dispose();
        this.faces = [];
        if (this.atmo) this.atmo.dispose();
        this.root.dispose();
      }
    }

    
    
