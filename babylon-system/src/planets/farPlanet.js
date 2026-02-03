// src/planets/farPlanet.js
import { fbm3 } from "../utils/noise.js";

// ------------------------------------------------------------
// Minimal biome color helper for FAR rocky planets only.
// (The "real look" for rocky bodies comes from generate-planet-js JSON)
// This avoids depending on deleted files (proceduralPlanet/nightLights).
// ------------------------------------------------------------
function getBiomeColor(dummy, dir, elev) {
  const sea = dummy.seaLevel ?? 0.0;
  const h = Math.max(0, elev - sea); // height above sea
  const lat = Math.abs(dir.y);       // 0 equator -> 1 poles
  const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));

  // Palette presets (very simple)
  let base1, base2, rock, snow;
  switch ((dummy.biomePreset || "default").toLowerCase()) {
    case "desert_dunes":
    case "arrakis":
      base1 = new BABYLON.Color3(0.78, 0.67, 0.44);
      base2 = new BABYLON.Color3(0.62, 0.50, 0.28);
      rock  = new BABYLON.Color3(0.45, 0.37, 0.22);
      snow  = new BABYLON.Color3(0.95, 0.95, 0.95);
      break;
    case "oceanic_temperate":
    case "caladan":
      base1 = new BABYLON.Color3(0.20, 0.42, 0.24); // lowlands green
      base2 = new BABYLON.Color3(0.32, 0.52, 0.30); // midlands
      rock  = new BABYLON.Color3(0.45, 0.45, 0.45);
      snow  = new BABYLON.Color3(0.96, 0.96, 0.96);
      break;
    default:
      base1 = new BABYLON.Color3(0.30, 0.46, 0.30);
      base2 = new BABYLON.Color3(0.44, 0.44, 0.44);
      rock  = new BABYLON.Color3(0.50, 0.50, 0.50);
      snow  = new BABYLON.Color3(0.95, 0.95, 0.95);
      break;
  }

  // Height blend: green -> rock
  const tRock = clamp(h / Math.max(0.02, (dummy.terrainScale ?? 0.12) * 0.7), 0, 1);
  let c = BABYLON.Color3.Lerp(base1, base2, clamp(tRock * 0.55, 0, 1));
  c = BABYLON.Color3.Lerp(c, rock, clamp(tRock, 0, 1));

  // Snow caps by latitude + height
  const tSnow = clamp((lat - 0.72) / 0.22, 0, 1) * clamp((h - 0.01) / 0.08, 0, 1);
  c = BABYLON.Color3.Lerp(c, snow, tSnow);

  return c;
}

// Low-poly far planets: vertex displaced sphere + optional ocean + rings.
export function createLowPolyFarPlanet(scene, def, orbitNode) {
        // Si el planeta viene de JSON exportado del generador, guardamos params en def._jsonParams
        // y aquí los usamos para que el LOD lejano coincida con el aspecto del generador.
        const jp = def && def._jsonParams ? def._jsonParams : null;

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
        // IMPORTANT: scene.ambientColor only contributes if material.ambientColor isn't black.
        // This prevents bodies from going fully black if a system light is out of range / excluded.
        landMat.ambientColor = BABYLON.Color3.White();
        land.material = landMat;

        // Base planet surface in group 0
        land.renderingGroupId = 0;
  
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
        const seaFromJson = (jp && typeof jp.seaLevel === "number") ? jp.seaLevel : undefined;
        const sea = (typeof def.seaLevel === "number") ? def.seaLevel : (seaFromJson ?? 0.0);

        const oceanFromJson = (jp && typeof jp.seaEnabled === "boolean") ? jp.seaEnabled : undefined;
        const oceanEnabled =
          (def.ocean === false) ? false :
          (def.ocean === true)  ? true  :
          !!oceanFromJson;

        const dummy = {
          seed: (def.name.length * 17.13) % 1000,
          biomePreset: def.biomePreset || "default",
          seaLevel: sea,
          terrainScale: (def.terrainScale ?? 0.12),
        };
  
        const f = def.noiseFrequency ?? 2.6;
        const oct = def.noiseOctaves ?? 6;
        const amp = def.terrainScale ?? 0.12;
        // Reusar 'sea' calculado arriba
  
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
  /*
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
 */ 
          // clamp by seaLevel (visual basins)
          elev = Math.max(elev, sea);
  
          // low-poly quantization for chunky facets
          elev = quant(elev, amp * 0.11);
  
          const scale = def.radius * (1 + elev);
          positions[i]   = nx * scale;
          positions[i+1] = ny * scale;
          positions[i+2] = nz * scale;
  
          _tmpV.set(nx, ny, nz);
          const c = getBiomeColor(dummy, _tmpV, elev);
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
        let nightLights = null;
     if (oceanEnabled) {
        // Match generator semantics: sea radius = radius * (1 + seaLevel) * seaThickness
       const seaThickness =
       (jp && typeof jp.seaThickness === "number") ? jp.seaThickness : 1.0;
       // tiny epsilon to avoid z-fighting in extreme cases (kept very small)
       const eps = 0.0005;
       const seaFrac = Math.max(0.6, (1 + sea) * seaThickness + eps);
    		ocean = BABYLON.MeshBuilder.CreateSphere(
    			def.name + "_ocean",
  	   		{ diameter: def.radius * 2 * seaFrac, segments: Math.max(24, Math.floor(seg * 0.7)) },
    			scene
    		);
  		ocean.parent = orbitNode;
  		ocean.position.set(def.orbitR, 0, 0);
  		ocean.isPickable = false;
  		ocean.checkCollisions = false;
	   	ocean.renderingGroupId = 0;
  		
		const oceanKind = def.oceanKind || "water";
		const om = new BABYLON.PBRMaterial(def.name + "_oceanMat", scene);
		// Depth prepass helps when using alpha + atmosphere/rings
		om.needDepthPrePass = true;
  		
  		if (oceanKind === "lava" || def.biomePreset === "lava") {
  			// --- LAVA: emisivo, sin refracción/translucidez, más rugoso ---
        // Color: prioridad def.oceanColor, si no, JSON seaColor, si no, fallback
        if (def.oceanColor) {
          om.albedoColor = def.oceanColor;
        } else if (jp && typeof jp.seaColor === "string" && jp.seaColor[0] === "#") {
          om.albedoColor = BABYLON.Color3.FromHexString(jp.seaColor);
        } else {
          om.albedoColor = new BABYLON.Color3(0.05,0.18,0.28);
        }
  			om.metallic = 0.0;
        // Rough/alpha desde JSON si existen, si no fallback
        om.roughness = (jp && typeof jp.seaRoughness === "number") ? jp.seaRoughness : 0.2;
        om.alpha = (jp && typeof jp.seaAlpha === "number") ? jp.seaAlpha : 0.9;
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
        // Color: def.oceanColor > JSON seaColor > fallback
       const oc =
          def.oceanColor ? def.oceanColor :
          (jp && typeof jp.seaColor === "string" && jp.seaColor[0] === "#")
            ? BABYLON.Color3.FromHexString(jp.seaColor)
            : new BABYLON.Color3(0.05,0.18,0.28);
  			om.albedoColor = oc;
       om.metallic  =
          (typeof def.oceanMetallic  === "number") ? def.oceanMetallic :
          (jp && typeof jp.seaMetallic === "number") ? jp.seaMetallic : 0.02;
       om.roughness =
          (typeof def.oceanRoughness === "number") ? def.oceanRoughness :
          (jp && typeof jp.seaRoughness === "number") ? jp.seaRoughness : 0.12;
  
            // IMPORTANTE:
            // El océano far es una esfera completa por encima del terreno.
            // Si es casi opaca o escribe profundidad, "tapa" el land y lo oscurece.
       om.alpha =
          (typeof def.oceanAlpha === "number") ? def.oceanAlpha :
          (jp && typeof jp.seaAlpha === "number") ? jp.seaAlpha : 0.62;

  			om.useAlphaFromAlbedoTexture = false;
            // En Babylon 8, esta constante existe; si no, cae al modo clásico.
  			om.transparencyMode =
              (BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND ?? BABYLON.PBRMaterial.PBR_ALPHABLEND); 
  			om.backFaceCulling = true;
  			om.indexOfRefraction = 1.33;
  			om.translucencyIntensity = 0.35;

            // CRÍTICO: NO escribir depth en una capa transparente por encima
            om.forceDepthWrite = false;
            om.disableDepthWrite = true;

            // Without envTexture, oceans can read as "black". Add a subtle self-illumination.
            // (keeps the space look but avoids dead-black water)
            om.emissiveColor = oc.scale(0.22);
            om.specularIntensity =
              (typeof def.oceanSpecular === "number") ? def.oceanSpecular :
              (jp && typeof jp.seaSpecular === "number") ? jp.seaSpecular : 0.55;
  		}
  		
  		ocean.material = om;
  		ocean.receiveShadows = true;
  	  }

        // Night lights removed in generate-planet-js-only build.
        // (Keep null to avoid extra dependencies.)
        nightLights = null;	
  
        return { land, ocean, nightLights };
      }
	  
      // ==========================================================
      // Gas giant renderer (far): bands + optional storms + clouds
      // ==========================================================
      function createGasGiantFarPlanet(scene, def, orbitNode) {
        // Compat: algunos bloques antiguos usaban "bodyDef".
        // Si en algún punto quedó una referencia, esto evita el ReferenceError.
        const bodyDef = def;

        const seg = Math.max(def.farSegments || 56, 56);
        const land = BABYLON.MeshBuilder.CreateSphere(def.name + "_gas", { diameter: def.radius * 2, segments: seg }, scene);
        land.parent = orbitNode;
        land.position.set(def.orbitR, 0, 0);
        land.isPickable = false;

  // Rendering groups: tierra (0), océano patch (1) como en el generador
  land.renderingGroupId = 0;

  // Sync de params JSON al "def" para que el LOD lejano (farPlanet) use el mismo mar/valores
  if (bodyDef) {
    bodyDef._jsonParams = params;
    // Si no está definido explícitamente en systems.js, heredamos de JSON:
    if (typeof bodyDef.seaLevel !== "number" && typeof params.seaLevel === "number") bodyDef.seaLevel = params.seaLevel;
    if (typeof bodyDef.ocean !== "boolean" && typeof params.seaEnabled === "boolean") bodyDef.ocean = params.seaEnabled;
    if (typeof bodyDef.atmo !== "boolean" && typeof params.atmoEnabled === "boolean") bodyDef.atmo = params.atmoEnabled;
  }
        land.checkCollisions = false;

        // Generate a single shared dynamic texture per gas giant (cheap & stable)
        const tex = makeGasGiantDynamicTexture(scene, def);

        const mat = new BABYLON.PBRMaterial(def.name + "_gasMat", scene);
        mat.metallic = 0.0;
        mat.roughness = 0.92;
        mat.specularIntensity = 0.22;
        mat.albedoTexture = tex;
        // Evita "negro absoluto" si el sistema no tiene luz activa en ese momento
        mat.emissiveColor = (def.gasTint || def.atmoColor || new BABYLON.Color3(0.88, 0.72, 0.55)).scale(0.06);
        // Slight tint if provided
        if (def.gasTint) mat.albedoColor = def.gasTint;
        land.material = mat;

        // Optional clouds layer (very subtle), gives depth without a solid surface
        // IMPORTANTE: 1.012 es demasiado cerca → z-fighting a distancias grandes (bandas negras)
        const clouds = BABYLON.MeshBuilder.CreateSphere(
          def.name + "_clouds",
          { diameter: def.radius * 2 * 1.03, segments: Math.max(32, Math.floor(seg * 0.75)) },
          scene
        );        
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
        // Un pelín de emissive (blanco-azulado) para que no se apaguen si falta luz
        cmat.emissiveColor = (def.cloudTint3 || new BABYLON.Color3(0.85, 0.92, 1.0)).scale(0.10);
        cmat.alpha = (typeof def.cloudAlpha === "number") ? def.cloudAlpha : 0.18;
        cmat.backFaceCulling = true;
        cmat.disableLighting = false; // let it react to the sun
        // CRÍTICO: capa transparente NO debe escribir depth (provoca “cortes”/bandas al solaparse)
        cmat.disableDepthWrite = true;
        cmat.forceDepthWrite = false;
        // Alpha blending estándar
        cmat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;

        // Si Babylon soporta zOffset en StandardMaterial, ayuda aún más contra z-fighting
        // (no pasa nada si no existe)
        try { cmat.zOffset = -2; } catch(e) {}
        clouds.material = cmat;
        // Transparent layer: render with atmospheres (after all opaque bodies)
        clouds.renderingGroupId = 1;
        clouds.alphaIndex = 40;
        // Con disableDepthWrite, no necesitamos depth prepass (y evita artefactos al solapar)
        cmat.needDepthPrePass = false;

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
  
      
