(function(global){
  "use strict";
  const BABYLON = global.BABYLON;
  const EPS = 1e-6;
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  // --- Geometry: annulus with small thickness (like a very thin ribbon) ---
  function buildRibbon(innerR, outerR, halfThick, segs, scene){
    // NOTE: To avoid "grid/interference" artifacts with transparency,
    // we use a SINGLE surface annulus (double-sided) instead of a thick ribbon
    // with top/bottom + side walls.
    const paths = [];
    for(let i=0;i<=segs;i++){
      const a = (i/segs) * Math.PI*2;
      const ca = Math.cos(a), sa = Math.sin(a);
      paths.push([
        new BABYLON.Vector3(innerR*ca, 0, innerR*sa),
        new BABYLON.Vector3(outerR*ca, 0, outerR*sa),
      ]);
    }
    const ring = BABYLON.MeshBuilder.CreateRibbon("ringRibbon", {
      pathArray: paths,
      closeArray: true,
      closePath: false,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      updatable: true
    }, scene);
    return ring;
  }

  function ensureRingUVs(mesh, innerR, outerR){
    const pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if(!pos) return;
    const vCount = pos.length/3;
    const uvs = new Float32Array(vCount*2);
    for(let i=0;i<vCount;i++){
      const x=pos[i*3], z=pos[i*3+2];
      const rr=Math.sqrt(x*x+z*z);
      const u=clamp((rr-innerR)/Math.max(EPS,(outerR-innerR)),0,1); // radial
      const v=Math.atan2(z,x)/(Math.PI*2); // angular
      uvs[i*2]=u;
      uvs[i*2+1]=(v<0)?(v+1):v;
    }
    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, true);
  }

  // Simple deterministic hash noise (fast, good enough for ring banding)
  
  // --- Ring Shader (Saturn-style): forward scattering + simple sphere shadow ---
  // We keep it cheap: one texture sample (RGB+A) + analytical occlusion by the planet sphere.
  if(!BABYLON.Effect.ShadersStore["ringSaturnVertexShader"]){
    BABYLON.Effect.ShadersStore["ringSaturnVertexShader"] = `
      precision highp float;
      // Attributes
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      // Uniforms
      uniform mat4 world;
      uniform mat4 worldViewProjection;

      // Varyings
      varying vec2 vUV;
      varying vec3 vPosW;
      varying vec3 vNrmW;

      void main(void){
        vec4 wPos = world * vec4(position, 1.0);
        vPosW = wPos.xyz;
        vNrmW = normalize((world * vec4(normal, 0.0)).xyz);
        vUV = uv;
        gl_Position = worldViewProjection * vec4(position, 1.0);
      }
    `;
    BABYLON.Effect.ShadersStore["ringSaturnFragmentShader"] = `
      precision highp float;

      varying vec2 vUV;
      varying vec3 vPosW;
      varying vec3 vNrmW;

      uniform sampler2D ringTex;

      uniform vec3 cameraPosition;
      uniform vec3 lightDir;      // direction FROM point TO light (normalized)
      uniform vec3 lightColor;    // 0..1
      uniform float lightIntensity;

      uniform vec3 planetPos;
      uniform float planetRadius;

      uniform float scatterStrength;
      uniform float scatterPower;
      uniform float fresnelStrength;
      uniform float fresnelPower;
      uniform float ambient;

      // Ray/sphere intersection: does ray (p + t*L, t>0) hit sphere?
      float sphereShadow(vec3 p, vec3 L, vec3 c, float r){
        vec3 oc = p - c;
        float b = dot(oc, L);
        float c2 = dot(oc, oc) - r*r;
        float h = b*b - c2;
        if(h < 0.0) return 1.0;
        float t = -b - sqrt(h);
        // If intersection is in front along L, the planet blocks the light.
        return (t > 0.0) ? 0.0 : 1.0;
      }

      void main(void){
        vec4 tex = texture2D(ringTex, vUV);
        float a = tex.a;
        if(a <= 0.001) discard;

        vec3 N = normalize(vNrmW);
        vec3 V = normalize(cameraPosition - vPosW);
        vec3 L = normalize(lightDir);

        // Planet shadow
        float sh = sphereShadow(vPosW, L, planetPos, planetRadius);

        // Rings are effectively 2D sheets: use abs for a stable lambert-like term
        float ndl = abs(dot(N, L));
        float lambert = 0.18 + 0.42 * ndl;

        // Forward scattering "glow" when looking toward the light through the ring
        float phase = pow(max(0.0, dot(V, L)), scatterPower) * scatterStrength;

        // Fresnel brightening at grazing angles
        float fres = pow(1.0 - abs(dot(N, V)), fresnelPower) * fresnelStrength;

        // Compose lighting
        float lit = ambient + (lambert + phase + fres) * sh * lightIntensity;

        vec3 col = tex.rgb * (lightColor * lit);

        // In shadow the ring still has a tiny contribution (bounced light), but much darker
        float aOut = a * (0.35 + 0.65 * sh);

        gl_FragColor = vec4(col, aOut);
      }
    `;
  }

function hash1(x){
    const s = Math.sin(x*127.1 + 311.7)*43758.5453123;
    return s - Math.floor(s);
  }

  function rebuildRingTextureForItem(gen, item, innerR, outerR, idx){
    const scene = gen.scene;
    const W = 1024, H = 128;

    if(!gen._ringItemTex) gen._ringItemTex = [];
    if(!gen._ringItemTex[idx]){
      // IMPORTANT: Rings are extremely prone to moiré/shimmering when the
      // texture contains high-frequency noise and no mipmaps.
      // We generate mipmaps + trilinear filtering and keep the noise band-limited.
      const dt = new BABYLON.DynamicTexture(
        "ringItemDT_"+idx,
        {width:W, height:H},
        scene,
        true, // generateMipMaps
        BABYLON.Texture.TRILINEAR_SAMPLINGMODE
      );
      dt.hasAlpha = true;
      dt.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
      dt.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
      dt.anisotropicFilteringLevel = 8;
      gen._ringItemTex[idx] = dt;
    }

    const dt = gen._ringItemTex[idx];
    const ctx = dt.getContext();
    const img = ctx.createImageData(W,H);
    const data = img.data;

    const base = BABYLON.Color3.FromHexString(item.color || "#d6c9b1");
    const alpha = clamp(item.alpha ?? 0.75, 0, 1);
    const noise = clamp(item.noise ?? 0.35, 0, 1);
    const bandFreq = clamp(item.bandFreq ?? 38.0, 0, 200);
    const gapFreq = clamp(item.gapFreq ?? 8.0, 0, 200);
    const gapPower = clamp(item.gapPower ?? 2.5, 0.1, 20);

    // Seed affects ring grain, but stays stable per-planet
    const seed = (gen.seed ?? gen.params?.seed ?? 1337) + idx*1013;

    // 1D value-noise (band-limited) to avoid pixel-level interference.
    const lerp = (a,b,t)=>a+(b-a)*t;
    const smooth = (t)=>t*t*(3-2*t);
    const valueNoise1D = (x, periodPx)=>{
      const gx = x / periodPx;
      const i0 = Math.floor(gx);
      const f  = gx - i0;
      const n0 = hash1(i0 + seed*0.17);
      const n1 = hash1(i0 + 1 + seed*0.17);
      return lerp(n0, n1, smooth(f));
    };

    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const t = x/(W-1);

        // Irregular radial structure (band-limited) to avoid periodic moiré.
        // bandFreq: "how many features" across the width (0..120)
        // gapFreq : fine low-density streaks (0..60)
        const bf = Math.max(0.0, bandFreq);
        const gf = Math.max(0.0, gapFreq);

        // Convert feature-count to pixel periods (bigger period => lower frequency)
        const basePeriod = (bf <= 0.0) ? 99999.0 : clamp(W / (bf + 1.0), 6.0, 220.0);
        const finePeriod = (bf <= 0.0) ? 99999.0 : clamp(basePeriod * 0.45, 3.5, 120.0);

        const gPeriod  = (gf <= 0.0) ? 99999.0 : clamp(W / (gf + 1.0), 3.0, 90.0);
        const gPeriod2 = (gf <= 0.0) ? 99999.0 : clamp(gPeriod * 0.55, 2.0, 60.0);

        // Smooth 1D value-noise stack (0..1)
        const b0 = valueNoise1D(x + seed*0.03, basePeriod);
        const b1 = valueNoise1D(x + seed*0.11, finePeriod);
        const bands = (b0*0.65 + b1*0.35); // 0..1

        const n0 = valueNoise1D(x + seed*0.07, 7.0);
        const n1 = valueNoise1D(x + seed*0.17, 15.0);
        const grain = (n0*0.55 + n1*0.45); // 0..1 (low amplitude)

        // Micro-gaps: use smooth noise then sharpen a bit
        let gapMask = 1.0;
        if (gf > 0.0){
          const g0 = valueNoise1D(x + seed*0.23, gPeriod);
          const g1 = valueNoise1D(x + seed*0.41, gPeriod2);
          const g = (g0*0.6 + g1*0.4);
          const gg = Math.pow(clamp(g,0,1), gapPower); // 0..1
          // keep mean density high to preserve color, but allow thin streaks
          gapMask = 0.72 + 0.28*gg; // 0.72..1.0
        }

        // Density: base from "bands" (large structure) + subtle grain
        // noise controls how strong the structure is.
        const struct = clamp( (bands*0.75 + grain*0.25), 0, 1);
        const dens = clamp( (0.72 + 0.28*struct) * (1.0 - noise*0.55*(grain-0.5)*2.0) * gapMask, 0, 1);
        const a = clamp(alpha * Math.pow(dens, 1.10), 0, 1);

        // Slight color modulation with density + banding
        const c = clamp(0.85 + 0.15*bands, 0, 2);
        const r = clamp(base.r * c, 0, 1);
        const g = clamp(base.g * c, 0, 1);
        const b = clamp(base.b * c, 0, 1);

        const o = (y*W + x)*4;
        data[o]   = (r*255)|0;
        data[o+1] = (g*255)|0;
        data[o+2] = (b*255)|0;
        data[o+3] = (a*255)|0;
      }
    }

    ctx.putImageData(img,0,0);
    dt.update(true);
    return dt;
  }

  function ensureLegacyRing(gen, params){
    // Original "single ring" mode kept for backwards compatibility
    const scene = gen.scene;
    const planetMesh = gen.mesh || gen.planetMesh || null;
    const radius = (gen.radius || params.radius || 1);

    const innerR = radius * (params.ringInnerMul ?? 1.35);
    const outerR = radius * (params.ringOuterMul ?? 2.35);
    const segs   = clamp(params.ringSegments ?? 128, 32, 256)|0;
    const halfTh = clamp(params.ringThickness ?? 0.05, 0.0, 0.5) * radius * 0.15;

    const geoKey = [innerR.toFixed(4), outerR.toFixed(4), segs, halfTh.toFixed(4)].join("|");

    if(!gen.ringMesh || gen._ringGeoKey !== geoKey){
      gen._ringGeoKey = geoKey;
      if(gen.ringMesh) gen.ringMesh.dispose();

      const mesh = buildRibbon(innerR, outerR, halfTh, segs, scene);
        // Ensure stable radial UVs (prevents stretching/clamping artifacts when changing inner/width/segs)
        ensureRingUVs(mesh, innerR, outerR);
      mesh.name = "ringLegacy";
      mesh.isPickable = false;
      mesh.renderingGroupId = 3;
      mesh.alwaysSelectAsActiveMesh = true;

      if(planetMesh){
        mesh.parent = planetMesh;
        mesh.position.set(0,0,0);
      }

      const mat = new BABYLON.StandardMaterial("ringMatLegacy", scene);
      mat.backFaceCulling = false;
      mat.specularColor = new BABYLON.Color3(0,0,0);
      mat.needDepthPrePass = true;
      if (typeof mat.forceDepthWrite !== "undefined") mat.forceDepthWrite = true;
      mat.alpha = 1.0;
      mat.diffuseColor = BABYLON.Color3.White();
      mat.useAlphaFromDiffuseTexture = true;
      mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
      mesh.material = mat;

      // Reuse old procedural texture if present (falls back to simple solid)
      const dt = rebuildRingTextureForItem(gen, {
        color: params.ringColorA || params.ringColor || "#d6c9b1",
        alpha: params.ringAlphaBase ?? params.ringAlpha ?? 0.55,
        noise: params.ringAlphaNoise ?? 0.35,
        bandFreq: params.ringBandFreq ?? 42.0,
        gapFreq: params.ringGapFreq ?? 6.0,
        gapPower: params.ringGapPower ?? 2.2
      }, innerR, outerR, 999);
      mat.diffuseTexture = dt;
      mat.opacityTexture = dt;
      ensureRingUVs(mesh, innerR, outerR);

      gen.ringMesh = mesh;
    }

    const tiltX = (params.ringTiltX ?? params.ringTilt ?? 0.18);
    const tiltZ = (params.ringTiltZ ?? 0.0);
    gen.ringMesh.rotation.x = tiltX;
    gen.ringMesh.rotation.z = tiltZ;
    gen.ringMesh.setEnabled(true);
  }

  function ensureMultiRings(gen, params){
    const scene = gen.scene;
    const planetMesh = gen.mesh || gen.planetMesh || null;
    const radius = (gen.radius || params.radius || 1);
    const segs   = clamp(params.ringSegments ?? 128, 32, 256)|0;
    const halfTh = clamp(params.ringThickness ?? 0.05, 0.0, 0.5) * radius * 0.15;

    if(!gen.ringMeshes) gen.ringMeshes = Array.from({length:10}, ()=>null);
    if(!gen._ringItemGeoKey) gen._ringItemGeoKey = Array.from({length:10}, ()=>"");
    if(!gen._ringItemTexKey) gen._ringItemTexKey = Array.from({length:10}, ()=>"");

    const tiltX = (params.ringTiltX ?? params.ringTilt ?? 0.18);
    const tiltZ = (params.ringTiltZ ?? 0.0);

    const rings = Array.isArray(params.ringRings) ? params.ringRings : [];
    for(let i=0;i<10;i++){
      const item = rings[i] || { enabled:false };
      const enabled = !!item.enabled && (item.widthMul ?? 0) > 0 && (item.alpha ?? 0) > 0;

      if(!enabled){
        if(gen.ringMeshes[i]) gen.ringMeshes[i].setEnabled(false);
        continue;
      }

      const innerR = radius * clamp(item.innerMul ?? 1.35, 1.01, 50.0);
      const outerR = radius * clamp((item.innerMul ?? 1.35) + (item.widthMul ?? 0.10), 1.02, 60.0);

      const geoKey = [innerR.toFixed(4), outerR.toFixed(4), segs, halfTh.toFixed(4)].join("|");
      if(!gen.ringMeshes[i] || gen._ringItemGeoKey[i] !== geoKey){
        gen._ringItemGeoKey[i] = geoKey;
        if(gen.ringMeshes[i]) gen.ringMeshes[i].dispose();

        const mesh = buildRibbon(innerR, outerR, halfTh, segs, scene);
        mesh.name = "ring_"+i;
        mesh.isPickable = false;
        mesh.renderingGroupId = 3;
        mesh.alwaysSelectAsActiveMesh = true;

        if(planetMesh){
          mesh.parent = planetMesh;
          mesh.position.set(0,0,0);
        }

        // Saturn-style ring shader material (cheap scattering + planet shadow)
        const mat = new BABYLON.ShaderMaterial("ringMat_"+i, scene, {
          vertex: "ringSaturn",
          fragment: "ringSaturn",
        }, {
          attributes: ["position","normal","uv"],
          uniforms: ["world","worldViewProjection","cameraPosition",
                     "lightDir","lightColor","lightIntensity",
                     "planetPos","planetRadius",
                     "scatterStrength","scatterPower","fresnelStrength","fresnelPower","ambient"],
          samplers: ["ringTex"],
          needAlphaBlending: true
        });

        mat.backFaceCulling = false;
        mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;

        // Defaults tuned for Saturn-like ice
        mat.setFloat("scatterStrength", 0.55);
        mat.setFloat("scatterPower",  3.5);
        mat.setFloat("fresnelStrength", 0.25);
        mat.setFloat("fresnelPower",  4.0);
        mat.setFloat("ambient", 0.08);

        // We update light + camera per bind (cheap)
        mat.onBindObservable.add(()=>{
          const cam = scene.activeCamera;
          if (cam) mat.setVector3("cameraPosition", cam.globalPosition || cam.position);

          // Determine light vector (point->light)
          let L = new BABYLON.Vector3(0.6, 0.25, 0.7);
          let LC = BABYLON.Color3.White();
          let LI = 1.0;

          const sun = scene._ringSunLight || scene.lights.find(l=>l && l.isEnabled && l.isEnabled() && (l instanceof BABYLON.DirectionalLight || l instanceof BABYLON.PointLight));
          if (sun){
            LI = (sun.intensity ?? 1.0);
            LC = (sun.diffuse && sun.diffuse.clone) ? sun.diffuse.clone() : BABYLON.Color3.White();
            if (sun instanceof BABYLON.DirectionalLight){
              // sun.direction is the ray direction; point->light is opposite
              L = sun.direction.scale(-1).normalize();
            } else if (sun instanceof BABYLON.PointLight){
              const lp = (typeof sun.getAbsolutePosition === "function") ? sun.getAbsolutePosition() : sun.position;
              const rp = gen.ringMeshes[i].getAbsolutePosition();
              L = lp.subtract(rp).normalize();
            }
          }
          mat.setVector3("lightDir", L);
          mat.setVector3("lightColor", new BABYLON.Vector3(LC.r, LC.g, LC.b));
          mat.setFloat("lightIntensity", LI);

          // Planet (sphere) shadow
          const p = planetMesh ? planetMesh.getAbsolutePosition() : BABYLON.Vector3.Zero();
          mat.setVector3("planetPos", p);
          mat.setFloat("planetRadius", radius);
        });

        mesh.material = mat;

        ensureRingUVs(mesh, innerR, outerR);

        gen.ringMeshes[i] = mesh;
      }

      // Orientation
      gen.ringMeshes[i].rotation.x = tiltX;
      gen.ringMeshes[i].rotation.z = tiltZ;

      // Texture (rebuild only if ring item changed)
      const texKey = [
        item.color||"", item.alpha??0.75, item.noise??0.35,
        item.bandFreq??38, item.gapFreq??8, item.gapPower??2.5
      ].join("|");

      if(gen._ringItemTexKey[i] !== texKey){
        gen._ringItemTexKey[i] = texKey;
        const dt = rebuildRingTextureForItem(gen, item, innerR, outerR, i);
        const mat = gen.ringMeshes[i].material;
        // Usamos el mismo mapa para color+alpha.
        // EmissiveTexture garantiza que el color se vea aunque la luz sea baja.
        mat.setTexture("ringTex", dt);
      }

      gen.ringMeshes[i].setEnabled(true);
    }
  }

  function ensureRings(gen, params){
    // Disable everything
    if(!params.ringsEnabled){
      if(gen.ringMesh) gen.ringMesh.setEnabled(false);
      if(gen.ringMeshes) for(const m of gen.ringMeshes) if(m) m.setEnabled(false);
      return;
    }

    // Solo modo multi (hasta 10 anillos). Eliminamos legacy por simplicidad.
    if(gen.ringMesh) gen.ringMesh.setEnabled(false);
    ensureMultiRings(gen, params);
  }

  global.RingSystem = { ensureRings };
})(window);