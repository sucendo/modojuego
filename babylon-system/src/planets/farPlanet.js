// src/planets/farPlanet.js
import { fbm3 } from "../utils/noise.js";
import { ProceduralPlanet } from "./proceduralPlanet.js";

// Low-poly far planets: vertex displaced sphere + optional ocean + rings.
export function createLowPolyFarPlanet(scene, def, orbitNode) {
        // -----------------------------
        // Gas giant path: perfectly spherical (no rocky surface)
        // -----------------------------
        if (def.gasGiant || (def.rocky === false && (def.terrainScale ?? 0) <= 0.05)) {
          return createGasGiantFarPlanet(scene, def, orbitNode);
        }

        const seg = def.farSegments || 48;
        const land = BABYLON.MeshBuilder.CreateSphere(def.name + "_land", { diameter: def.radius * 2, segments: seg }, scene);
        land.parent = orbitNode;
        land.position.set(def.orbitR, 0, 0);
        // Rendimiento + colisiones
        land.isPickable = false;
        land.checkCollisions = false;
  
        // Material (vertex colors)
        const landMat = new BABYLON.StandardMaterial(def.name + "_landMat", scene);
        landMat.diffuseColor = new BABYLON.Color3(1,1,1);
        landMat.specularColor = new BABYLON.Color3(0.06,0.06,0.06);
        landMat.useVertexColor = true;
        land.material = landMat;
  
        // Optional micro bump to avoid "plastic" look
        if (def.microBump) {
          const bt = loadTextureOrNull(scene, def.microBump);
          if (bt) {
            bt.uScale = 6;
            bt.vScale = 6;
            landMat.bumpTexture = bt;
            landMat.bumpTexture.level = 0.8;
          }
        }
  
        const positions = land.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const normals   = land.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        if (!positions || !normals) return { land, ocean: null };
  
        const colors = new Array((positions.length/3) * 4);
  
        // Dummy for palette reuse
        const dummy = {
          seed: (def.name.length * 17.13) % 1000,
          biomePreset: def.biomePreset || "default",
          seaLevel: (def.seaLevel ?? 0.0),
          terrainScale: (def.terrainScale ?? 0.12),
        };
  
        const f = def.noiseFrequency ?? 2.6;
        const oct = def.noiseOctaves ?? 6;
        const amp = def.terrainScale ?? 0.12;
        const sea = def.seaLevel ?? 0.0;
  
        // Helpers
        const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
        const quant = (x,step)=> (step>0? (Math.round(x/step)*step) : x);
  
        // Temp vector to avoid per-vertex allocations (GC stutter)
        const _tmpV = new BABYLON.Vector3();

        for (let i=0; i<positions.length; i+=3) {
          // unit direction
          const nx = normals[i], ny = normals[i+1], nz = normals[i+2];
  
          // domain warp (reduces repetition)
          const w = (fbm3(nx*f*1.2 + dummy.seed, ny*f*1.2 + dummy.seed, nz*f*1.2 + dummy.seed, 3) * 2 - 1) * 0.25;
          const wx = nx + w, wy = ny + w*0.35, wz = nz - w*0.2;
  
          const n0 = (fbm3(wx*f + dummy.seed, wy*f + dummy.seed, wz*f + dummy.seed, oct) * 2 - 1);
          // ridged mountains
          const r0 = 1.0 - Math.abs(n0);
          const ridge = Math.pow(clamp(r0,0,1), 2.2);
  
          // extra detail
          const n1 = (fbm3(wx*f*2.4 + 19.7 + dummy.seed, wy*f*2.4 + 3.3 + dummy.seed, wz*f*2.4 + 11.1 + dummy.seed, 4) * 2 - 1);
  
          // base elevation
          let elev = (n0 * 0.55 + ridge * 0.55 + n1 * 0.12) * amp;
  
          // Planet-specific flavor
          if (dummy.biomePreset === "arrakis") {
            // dunes banding
            const band = (Math.sin((wx + wz) * 16.0) * 0.5 + 0.5) * 0.10;
            elev += band * amp * 0.55;
          }
          if (dummy.biomePreset === "giedi" || dummy.biomePreset === "salusa") {
            // harsher craters/erosion feel
            const pits = (fbm3(wx*f*4.0 + 99.0 + dummy.seed, wy*f*4.0 + 17.0 + dummy.seed, wz*f*4.0 + 33.0 + dummy.seed, 3) - 0.55);
            elev += pits * amp * 0.20;
          }
  
          // clamp by seaLevel (visual basins)
          elev = Math.max(elev, sea);
  
          // low-poly quantization for chunky facets
          elev = quant(elev, amp * 0.11);
  
          const scale = def.radius * (1 + elev);
          positions[i]   = nx * scale;
          positions[i+1] = ny * scale;
          positions[i+2] = nz * scale;
  
          _tmpV.set(nx, ny, nz);
          const c = ProceduralPlanet.prototype.getBiomeColor.call(dummy, _tmpV, elev);
          const ci = (i/3)*4;
          colors[ci] = c.r; colors[ci+1] = c.g; colors[ci+2] = c.b; colors[ci+3] = 1.0;
        }
  
        land.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        land.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
        // recompute normals after displacement
        BABYLON.VertexData.ComputeNormals(positions, land.getIndices(), normals);
        land.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
        try { land.convertToFlatShadedMesh(); } catch(e){}
  
        // Optional ocean sphere
        let ocean = null;
  	  if (def.ocean) {
  		const seaFrac = Math.max(0.6, 1 + sea + 0.002);
  		ocean = BABYLON.MeshBuilder.CreateSphere(
  			def.name + "_ocean",
  			{ diameter: def.radius * 2 * seaFrac, segments: Math.max(24, Math.floor(seg * 0.7)) },
  			scene
  		);
  		ocean.parent = orbitNode;
  		ocean.position.set(def.orbitR, 0, 0);
  		ocean.isPickable = false;
  		ocean.checkCollisions = false;
  		
  		const oceanKind = def.oceanKind || "water";
  		const om = new BABYLON.PBRMaterial(def.name + "_oceanMat", scene);
  		
  		if (oceanKind === "lava" || def.biomePreset === "lava") {
  			// --- LAVA: emisivo, sin refracción/translucidez, más rugoso ---
  			om.albedoColor = new BABYLON.Color3(0.10, 0.03, 0.02); // base oscura
  			om.metallic = 0.0;
  			om.roughness = 0.55; // lava "espesa" (menos espejo)
  			om.alpha = 1.0;
  			om.transparencyMode = BABYLON.PBRMaterial.PBR_OPAQUE;
  			om.backFaceCulling = true;
  		
  			const lavaCol = (def.lavaColor || new BABYLON.Color3(1.0, 0.35, 0.08));
  			om.emissiveColor = lavaCol.scale(def.lavaIntensity ?? 1.8);
  		
  			// Si quieres “vetas” brillantes + animación
  			if (def.lavaTexture) {
  			const lt = loadTextureOrNull(scene, def.lavaTexture);
  			if (lt) {
  				lt.uScale = 6; lt.vScale = 6;
  				om.emissiveTexture = lt;
  				const spd = def.lavaFlowSpeed ?? 0.06;
  				scene.onBeforeRenderObservable.add(() => {
  				const dt = scene.getEngine().getDeltaTime() * 0.001;
  				lt.uOffset += dt * spd;
  				lt.vOffset += dt * (spd * 0.65);
  				});
  			}
  			}
  		
  			// Importante: lava NO es translúcida
  			om.indexOfRefraction = 1.0;
  			om.translucencyIntensity = 0.0;
  		
  		} else {
  			// --- AGUA: tu configuración actual ---
  			om.albedoColor = def.oceanColor || new BABYLON.Color3(0.05,0.18,0.28);
  			om.metallic = 0.15;
  			om.roughness = 0.2;
  			om.alpha = 0.9;
  			om.useAlphaFromAlbedoTexture = false;
  			om.transparencyMode = BABYLON.PBRMaterial.PBR_ALPHABLEND;
  			om.backFaceCulling = true;
  			om.indexOfRefraction = 1.33;
  			om.translucencyIntensity = 0.5;
  		}
  		
  		ocean.material = om;
  		ocean.receiveShadows = true;
  	  }
  		
  
        return { land, ocean };
      }
	  
      // ==========================================================
      // Gas giant renderer (far): bands + optional storms + clouds
      // ==========================================================
      function createGasGiantFarPlanet(scene, def, orbitNode) {
        const seg = Math.max(def.farSegments || 56, 56);
        const land = BABYLON.MeshBuilder.CreateSphere(def.name + "_gas", { diameter: def.radius * 2, segments: seg }, scene);
        land.parent = orbitNode;
        land.position.set(def.orbitR, 0, 0);
        land.isPickable = false;
        land.checkCollisions = false;

        // Generate a single shared dynamic texture per gas giant (cheap & stable)
        const tex = makeGasGiantDynamicTexture(scene, def);

        const mat = new BABYLON.PBRMaterial(def.name + "_gasMat", scene);
        mat.metallic = 0.0;
        mat.roughness = 0.92;
        mat.specularIntensity = 0.22;
        mat.albedoTexture = tex;
        // Slight tint if provided
        if (def.gasTint) mat.albedoColor = def.gasTint;
        land.material = mat;

        // Optional clouds layer (very subtle), gives depth without a solid surface
        const clouds = BABYLON.MeshBuilder.CreateSphere(def.name + "_clouds", { diameter: def.radius * 2 * 1.012, segments: Math.max(32, Math.floor(seg * 0.75)) }, scene);
        clouds.parent = orbitNode;
        clouds.position.set(def.orbitR, 0, 0);
        clouds.isPickable = false;
        clouds.checkCollisions = false;

        const ctex = makeGasCloudsDynamicTexture(scene, def);
        const cmat = new BABYLON.StandardMaterial(def.name + "_cloudMat", scene);
        cmat.diffuseTexture = ctex;
        cmat.diffuseTexture.hasAlpha = true;
        cmat.opacityTexture = ctex;
        cmat.specularColor = new BABYLON.Color3(0,0,0);
        cmat.emissiveColor = new BABYLON.Color3(0,0,0);
        cmat.alpha = (typeof def.cloudAlpha === "number") ? def.cloudAlpha : 0.18;
        cmat.backFaceCulling = true;
        cmat.disableLighting = false; // let it react to the sun
        clouds.material = cmat;
        clouds.renderingGroupId = land.renderingGroupId;
        clouds.alphaIndex = 40;

        // Gentle rotation for bands + clouds
        const spin = (typeof def.spin === "number") ? def.spin : 0.006;
        const cloudSpin = (typeof def.cloudSpin === "number") ? def.cloudSpin : 0.010;
        scene.onBeforeRenderObservable.add(() => {
          const dt = scene.getEngine().getDeltaTime() * 0.001;
          land.rotation.y += dt * spin;
          clouds.rotation.y += dt * cloudSpin;
          if (ctex) ctex.uOffset = (ctex.uOffset + dt * cloudSpin * 0.08) % 1;
        });

        return { land, ocean: null, clouds };
      }

      function makeGasGiantDynamicTexture(scene, def) {
        const w = 512, h = 256;
        const dyn = new BABYLON.DynamicTexture(def.name + "_gasTex", { width: w, height: h }, scene, false);
        const ctx = dyn.getContext();

        // Seeded pseudo-random from name
        let seed = 0;
        for (let i = 0; i < def.name.length; i++) seed = (seed * 31 + def.name.charCodeAt(i)) >>> 0;
        const rnd = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return (seed & 0xffffff) / 0x1000000;
        };

        const base = def.atmoColor || new BABYLON.Color3(0.88, 0.72, 0.55);
        // Two palette endpoints around base
        const c1 = new BABYLON.Color3(
          Math.min(1, base.r * (0.90 + rnd()*0.10)),
          Math.min(1, base.g * (0.90 + rnd()*0.10)),
          Math.min(1, base.b * (0.90 + rnd()*0.10))
        );
        const c2 = new BABYLON.Color3(
          Math.min(1, base.r * (1.05 + rnd()*0.15)),
          Math.min(1, base.g * (1.05 + rnd()*0.15)),
          Math.min(1, base.b * (1.05 + rnd()*0.15))
        );

        const bandFreq = 10 + Math.floor(rnd() * 10);
        const bandWarp = 0.14 + rnd() * 0.12;
        const bandContrast = 0.55 + rnd() * 0.25;

        // Precompute a couple storms
        const storms = [];
        const stormCount = def.gasStorms ? 2 + Math.floor(rnd()*2) : 1;
        for (let i = 0; i < stormCount; i++) {
          storms.push({
            cx: rnd(),
            cy: 0.25 + rnd() * 0.5,
            rx: 0.06 + rnd() * 0.12,
            ry: 0.03 + rnd() * 0.08,
            k: 0.25 + rnd() * 0.35
          });
        }

        const lerp = (a,b,t)=>a+(b-a)*t;
        const clamp01 = (x)=>Math.max(0,Math.min(1,x));

        for (let y = 0; y < h; y++) {
          const v = y / (h - 1);
          // latitude in [-1..1]
          const lat = v * 2 - 1;
          // band value with warp
          const s = Math.sin((lat * bandFreq + rnd() * 2.0) * Math.PI);
          const wv = Math.sin((lat * (bandFreq * 0.5) + 1.7) * Math.PI) * bandWarp;
          const band = clamp01(0.5 + (s + wv) * 0.5);
          const bmix = Math.pow(band, 1.0 / bandContrast);

          const rr = lerp(c1.r, c2.r, bmix);
          const gg = lerp(c1.g, c2.g, bmix);
          const bb = lerp(c1.b, c2.b, bmix);

          // Fill row with slight longitudinal variation
          for (let x = 0; x < w; x++) {
            const u = x / (w - 1);
            // Mild turbulence using fbm3 on a cylinder-ish domain
            const nx = Math.cos(u * Math.PI * 2);
            const nz = Math.sin(u * Math.PI * 2);
            const n = fbm3(nx * 1.6 + 13.0, lat * 2.2 + 7.1, nz * 1.6 + 29.0, 4);
            const turb = (n - 0.5) * 0.10;

            let r = clamp01(rr + turb);
            let g = clamp01(gg + turb);
            let b = clamp01(bb + turb);

            // Storm ovals
            for (const st of storms) {
              const dx = (u - st.cx);
              const dy = (v - st.cy);
              const d = (dx*dx)/(st.rx*st.rx) + (dy*dy)/(st.ry*st.ry);
              if (d < 1.0) {
                const t = (1.0 - d);
                r = clamp01(r + st.k * t);
                g = clamp01(g + st.k * t * 0.85);
                b = clamp01(b + st.k * t * 0.65);
              }
            }

            ctx.fillStyle = `rgb(${Math.floor(r*255)},${Math.floor(g*255)},${Math.floor(b*255)})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }

        dyn.update(false);
        dyn.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        dyn.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        dyn.anisotropicFilteringLevel = 4;
        return dyn;
      }

      function makeGasCloudsDynamicTexture(scene, def) {
        const w = 512, h = 256;
        const dyn = new BABYLON.DynamicTexture(def.name + "_cloudTex", { width: w, height: h }, scene, false);
        const ctx = dyn.getContext();
        ctx.clearRect(0,0,w,h);

        // Slightly brighter than base
        const base = def.atmoColor || new BABYLON.Color3(0.9, 0.8, 0.65);
        const cr = Math.min(1, base.r * 1.08);
        const cg = Math.min(1, base.g * 1.08);
        const cb = Math.min(1, base.b * 1.05);

        for (let y = 0; y < h; y++) {
          const v = y / (h - 1);
          const lat = v * 2 - 1;
          for (let x = 0; x < w; x++) {
            const u = x / (w - 1);
            const nx = Math.cos(u * Math.PI * 2);
            const nz = Math.sin(u * Math.PI * 2);
            const n = fbm3(nx * 2.8 + 101.0, lat * 2.5 + 33.0, nz * 2.8 + 17.0, 5);
            // Threshold + soften
            const a = Math.max(0, (n - 0.52) / 0.18);
            if (a <= 0.01) continue;
            const aa = Math.min(1, a) * 0.75;
            ctx.fillStyle = `rgba(${Math.floor(cr*255)},${Math.floor(cg*255)},${Math.floor(cb*255)},${aa})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }

        dyn.update(false);
        dyn.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        dyn.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        dyn.anisotropicFilteringLevel = 4;
        return dyn;
      }

      // ====================================================================
      // 3) Helpers (textures/materials/atmospheres)
      // ====================================================================
      function loadTextureOrNull(scene, url, { hasAlpha=false } = {}) {
        try {
          const t = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            null,
            () => console.warn("[texture] no se pudo cargar:", url)
          );
          t.hasAlpha = !!hasAlpha;
          return t;
        } catch (e) {
          console.warn("[texture] error creando textura:", url, e);
          return null;
        }
      }
  
      function makePlanetPBR(scene, name, maps) {
        const mat = new BABYLON.PBRMaterial(name, scene);
        mat.metallic = 0.0;
        mat.roughness = maps?.roughness ?? 0.95;
        mat.specularIntensity = maps?.specularIntensity ?? 0.15;
  
        if (maps?.albedo) {
          const a = loadTextureOrNull(scene, maps.albedo);
          if (a) mat.albedoTexture = a;
        } else {
          mat.albedoColor = maps?.fallbackColor ?? new BABYLON.Color3(0.6,0.6,0.6);
        }
  
        if (maps?.normal) {
          const n = loadTextureOrNull(scene, maps.normal);
          if (n) {
            mat.bumpTexture = n;
            mat.bumpTexture.level = maps.bumpLevel ?? 1.0;
          }
        }
        if (maps?.bump) {
          const b = loadTextureOrNull(scene, maps.bump);
          if (b) {
            mat.bumpTexture = b;
            mat.bumpTexture.level = maps.bumpLevel ?? 0.8;
          }
        }
  
        return mat;
      }
  
      function makeAtmosphere(scene, parentNode, radius, color3, alpha=0.35) {
        const atmo = BABYLON.MeshBuilder.CreateSphere(parentNode.name + "_Atmo", { diameter: radius * 2.18, segments: 48 }, scene);
        atmo.parent = parentNode;
        atmo.isPickable = false;
  
        const mat = new BABYLON.StandardMaterial(parentNode.name + "_AtmoMat", scene);
        mat.diffuseColor = BABYLON.Color3.Black();
        mat.specularColor = BABYLON.Color3.Black();
        mat.emissiveColor = color3;
        mat.alpha = alpha;
        mat.backFaceCulling = false;
  
        // Fresnel-ish edge glow
        mat.emissiveFresnelParameters = new BABYLON.FresnelParameters();
        mat.emissiveFresnelParameters.bias = 0.2;
        mat.emissiveFresnelParameters.power = 2.0;
        mat.emissiveFresnelParameters.leftColor = BABYLON.Color3.Black();
        mat.emissiveFresnelParameters.rightColor = color3;
  
        atmo.material = mat;
        return atmo;
      }
  
      
