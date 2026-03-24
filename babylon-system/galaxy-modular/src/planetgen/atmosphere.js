/* atmosphere.js — integrado (global) */
(function(global){
  // Requiere BABYLON global
// src/planets/atmosphere.js
function createAtmospherePostProcess(scene, camera, options) {
  ensureShaders();
  options = options || {};

  const ppName = String(options.name || "atmoPP");
  const ppRatio = Number.isFinite(options.ratio) ? Math.max(0.25, options.ratio) : 1.0;
  const samplingMode = Number.isFinite(options.samplingMode)
    ? options.samplingMode
    : BABYLON.Texture.BILINEAR_SAMPLINGMODE;

  const pp = new BABYLON.PostProcess(
    ppName,
    "atmoPP",
    [
      "useDepth",
      "reverseDepth",
      "planetPos", "sunPos", "cameraPos",
      "planetRadius", "atmoRadius",
      "invView", "invProjection",
      "time",
      "c0", "c1", "c2",
      "atmoStrength",
      "mieStrength",
      "upperStrength",
      "stepsF",
      "a0", "a1", "a2",
      "h0", "h1", "h2",
      "fall0", "fall1", "fall2",
      "cloudAlpha", "cloudScale", "cloudSharpness",
      "cloudWind", "cloudTint",
      "minZ", "maxZ",
    ],
    ["depthSampler"],
    ppRatio,
    camera,
    samplingMode,
    scene.getEngine(),
    false
  );

  pp.alphaMode = BABYLON.Engine.ALPHA_DISABLE;
  pp._name = ppName;
  pp._role = String(options.role || 'generic');

  pp._camera = camera;
  pp._attached = true;
  try { camera.detachPostProcess(pp); pp._attached = false; } catch (e) {}

  pp._enabled = false;
  pp._useDepth = false;
  pp._planetPos = BABYLON.Vector3.Zero();
  pp._sunPos = BABYLON.Vector3.Zero();
  pp._planetRadius = 1;
  pp._atmoRadius = 1.05;
  pp._time = 0;
  
  // UI strengths
  pp._atmoStrength = 2.8;
  pp._mieStrength = 2.4;
  pp._upperStrength = 1.6;
  pp._steps = 48;

  pp._c0 = new BABYLON.Vector3(0.62, 0.58, 0.52);
  pp._c1 = new BABYLON.Vector3(0.18, 0.42, 0.95);
  pp._c2 = new BABYLON.Vector3(0.10, 0.28, 0.65);

  pp._a0 = 0.52; pp._a1 = 0.34; pp._a2 = 0.18;
  pp._h0 = 0.10; pp._h1 = 0.48; pp._h2 = 0.95;
  pp._fall0 = 8.0; pp._fall1 = 3.6; pp._fall2 = 1.7;

  pp._cloudAlpha = 0.22;
  pp._cloudScale = 2.7;
  pp._cloudSharpness = 2.2;
  pp._cloudWind = new BABYLON.Vector3(0.020, 0.0, 0.012);
  pp._cloudTint = new BABYLON.Vector3(0.92, 0.96, 1.08);

  pp.onApply = (effect) => {
    const cam = camera;
    const enabled = !!pp._enabled;

    const invV = cam.getViewMatrix().clone().invert();
    const invP = cam.getProjectionMatrix().clone().invert();

    effect.setFloat("useDepth", pp._useDepth ? 1.0 : 0.0);
    effect.setFloat("reverseDepth", scene.getEngine()?.useReverseDepthBuffer ? 1.0 : 0.0);
    effect.setVector3("planetPos", pp._planetPos);
    effect.setVector3("sunPos", pp._sunPos);
    effect.setVector3("cameraPos", cam.globalPosition || cam.position);

    effect.setFloat("planetRadius", pp._planetRadius);
    effect.setFloat("atmoRadius", pp._atmoRadius);

    effect.setMatrix("invView", invV);
    effect.setMatrix("invProjection", invP);

    effect.setFloat("time", pp._time);
	
    effect.setFloat("atmoStrength", pp._enabled ? (pp._atmoStrength || 1.0) : 0.0);
    effect.setFloat("mieStrength",  pp._enabled ? (pp._mieStrength  || 1.0) : 0.0);
    effect.setFloat("upperStrength",pp._enabled ? (pp._upperStrength|| 1.0) : 0.0);
    effect.setFloat("stepsF", Math.max(8, Math.min(96, (pp._steps || 48))));

    effect.setVector3("c0", pp._c0);
    effect.setVector3("c1", pp._c1);
    effect.setVector3("c2", pp._c2);

    effect.setFloat("a0", enabled ? pp._a0 : 0.0);
    effect.setFloat("a1", enabled ? pp._a1 : 0.0);
    effect.setFloat("a2", enabled ? pp._a2 : 0.0);

    effect.setFloat("h0", pp._h0);
    effect.setFloat("h1", pp._h1);
    effect.setFloat("h2", pp._h2);

    effect.setFloat("fall0", pp._fall0);
    effect.setFloat("fall1", pp._fall1);
    effect.setFloat("fall2", pp._fall2);

    effect.setFloat("cloudAlpha", enabled ? pp._cloudAlpha : 0.0);
    effect.setFloat("cloudScale", pp._cloudScale);
    effect.setFloat("cloudSharpness", pp._cloudSharpness);
    effect.setVector3("cloudWind", pp._cloudWind);
    effect.setVector3("cloudTint", pp._cloudTint);

    effect.setFloat("minZ", cam.minZ || 0.1);
    effect.setFloat("maxZ", cam.maxZ || 10000);

    if (pp._depthTex) effect.setTexture("depthSampler", pp._depthTex);
  };

  return pp;
}

function attachDepthForAtmosphere(scene, camera, pp) {
  if (!scene || !camera || !pp) return null;

  let depth = null;
  try {
    if (!scene.__atmoDepthRendererByCamera) {
      scene.__atmoDepthRendererByCamera = new WeakMap();
    }
    depth = scene.__atmoDepthRendererByCamera.get(camera) || null;
    if (!depth) {
      depth = scene.enableDepthRenderer(camera, true);
      try { scene.__atmoDepthRendererByCamera.set(camera, depth); } catch (_) {}
    }
  } catch (_) {
    depth = scene.enableDepthRenderer(camera, true);
  }

  pp._depthTex = depth?.getDepthMap?.() || null;
  pp._useDepth = true;
  return depth;
}

function setAtmosphereTarget(pp, planetTarget, planetRadius, atmoRadius, sunPos) {
  const p = (planetTarget && typeof planetTarget.getAbsolutePosition === 'function')
    ? planetTarget.getAbsolutePosition()
    : (planetTarget?.position || BABYLON.Vector3.Zero());
  pp._planetPos = new BABYLON.Vector3(p.x, p.y, p.z);
  pp._planetRadius = planetRadius;
  pp._atmoRadius = atmoRadius;
  pp._sunPos = new BABYLON.Vector3(sunPos.x, sunPos.y, sunPos.z);
}

function enableAtmospherePP(pp, enabled) {
  pp._enabled = !!enabled;
  const cam = pp._camera;
  if (!cam) return;

  if (pp._enabled && !pp._attached) {
    try { cam.attachPostProcess(pp); pp._attached = true; } catch (e) {}
  } else if (!pp._enabled && pp._attached) {
    try { cam.detachPostProcess(pp); pp._attached = false; } catch (e) {}
  }
}

function updateAtmospherePP(pp, timeSeconds) { pp._time = timeSeconds; }

function disposeAtmospherePP(pp) {
  if (!pp) return;
  try {
    const cam = pp._camera;
    if (pp._attached && cam) {
      cam.detachPostProcess(pp);
    }
  } catch (e) {}

  pp._attached = false;
  pp._enabled = false;

  try { pp.dispose(); } catch (e) {}
}

function ensureShaders() {
  try {
    delete BABYLON.Effect.ShadersStore["atmoPPVertexShader"];
    delete BABYLON.Effect.ShadersStore["atmoPPFragmentShader"];
  } catch (e) {}

  BABYLON.Effect.ShadersStore["atmoPPVertexShader"] = `
    precision highp float;
    attribute vec2 position;
    uniform vec2 scale;
    varying vec2 vUV;
    const vec2 madd=vec2(0.5,0.5);
    void main(void){
      vUV = (position * madd + madd) * scale;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  BABYLON.Effect.ShadersStore["atmoPPFragmentShader"] = `
    precision highp float;
    varying vec2 vUV;

    uniform sampler2D textureSampler;
    uniform sampler2D depthSampler;
    uniform float useDepth;
	uniform float reverseDepth;

    uniform vec3 planetPos, sunPos, cameraPos;
    uniform float planetRadius, atmoRadius;
    uniform mat4 invView, invProjection;
    uniform float time;

    uniform vec3 c0, c1, c2;
    uniform float atmoStrength;
    uniform float mieStrength;
    uniform float upperStrength;
    uniform float stepsF;
    uniform float a0, a1, a2;
    uniform float h0, h1, h2;
    uniform float fall0, fall1, fall2;

    uniform float cloudAlpha, cloudScale, cloudSharpness;
    uniform vec3 cloudWind, cloudTint;

    uniform float minZ, maxZ;
    uniform vec2 scale;

    float saturate(float x){ return clamp(x, 0.0, 1.0); }
    vec3 safeNormalize(vec3 v){
      float l = length(v);
      return (l > 1e-6) ? (v / l) : vec3(1.0, 0.0, 0.0);
    }
    vec2 raySphere(vec3 ro, vec3 rd, vec3 c, float r){
      vec3 oc = ro - c;
      float b = dot(oc, rd);
      float cc = dot(oc, oc) - r*r;
      float h = b*b - cc;
      if (h < 0.0) return vec2(-1.0);
      h = sqrt(h);
      return vec2(-b - h, -b + h);
    }
    float hash(vec3 p){
      p = fract(p * 0.1031);
      p += dot(p, p.yzx + 33.33);
      return fract((p.x + p.y) * p.z);
    }

    // hash 2D (estable por pixel)
    float hash2(vec2 p){
      vec3 p3 = fract(vec3(p.x, p.y, p.x) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
	
    // jitter por paso (barato) -> evita arcos concéntricos
    float stepJitter(vec2 uv, float i, float t){
      // i = índice de paso; t = tiempo
      return hash2(uv * 2048.0 + vec2(i * 17.13, i * 3.71) + t * 0.07);
    }
	
    float fbm(vec3 p){
      float f = 0.0;
      float a = 0.5;
      for(int i=0;i<4;i++){
        f += a * hash(p);
        p *= 2.02;
        a *= 0.5;
      }
      return f;
    }
    float layerDensity(float hn, float h, float fall){
      return exp(-abs(hn - h) * fall);
    }

    // 1.0 = iluminado por el sol, 0.0 = en sombra del planeta
    float sphereShadow(vec3 p, vec3 L, vec3 c, float r){
      vec3 oc = p - c;
      float b = dot(oc, L);
      float c2 = dot(oc, oc) - r*r;
      float h = b*b - c2;
      if(h < 0.0) return 1.0;
      float t = -b - sqrt(h);
      return (t > 0.0) ? 0.0 : 1.0;
    }

    // Beer-Lambert
    vec3 exp3(vec3 v){ return vec3(exp(v.x), exp(v.y), exp(v.z)); }

    void main(void){
      vec4 base = texture2D(textureSampler, vUV);

      vec2 uvDepth = vUV / max(scale, vec2(1e-6));
      vec2 ndc = uvDepth * 2.0 - 1.0;

      vec4 clip = vec4(ndc, 1.0, 1.0);
      vec4 view = invProjection * clip;
      view.xyz /= max(1e-6, view.w);
      vec3 rdV = safeNormalize(view.xyz);
      vec3 rdW = safeNormalize((invView * vec4(rdV, 0.0)).xyz);
      vec3 roW = cameraPos;

      float camCenterDist = length(roW - planetPos);
      float camAlt = camCenterDist - planetRadius;
      float atmoThickness = max(1e-6, atmoRadius - planetRadius);
	  
      // Ya no apagamos depth cerca del suelo: eso era lo que dejaba
      // que el halo atravesase montañas. Con el fix del raySphere,
      // mantener depth activo da una oclusión mucho más realista.
      bool cameraInsideAtmo = (camCenterDist <= atmoRadius + 1e-5);
      bool cameraNearSurface = (camAlt <= max(atmoThickness * 0.20, planetRadius * 0.0015));
      bool allowDepth = (useDepth > 0.5);

      float sceneT = 1e20;
      bool hasSceneDepth = false;
      if (allowDepth) {
        float rawDepth = texture2D(depthSampler, uvDepth).r;
        float sceneD = rawDepth;

        if (reverseDepth > 0.5) {
          // Reverse depth: 0 suele ser fondo/clear, valores altos son geometría cercana.
          if (rawDepth > 0.000001) {
            hasSceneDepth = true;
            sceneD = 1.0 - rawDepth;
          }
        } else {
          // Depth “normal”: 1 suele ser fondo/clear.
          if (rawDepth < 0.999999) {
            hasSceneDepth = true;
            sceneD = rawDepth;
          }
        }

        if (hasSceneDepth) {
          float clipZ = sceneD * 2.0 - 1.0;
          vec4 clipD = vec4(ndc, clipZ, 1.0);
          vec4 viewD = invProjection * clipD;
          if (abs(viewD.w) > 1e-6) {
            viewD.xyz /= viewD.w;
            vec3 worldD = (invView * vec4(viewD.xyz, 1.0)).xyz;
            sceneT = dot(worldD - roW, rdW);
            if (sceneT < 0.0) sceneT = 1e20;
          }
        }
      }

      vec2 hitA = raySphere(roW, rdW, planetPos, atmoRadius);
      // Si la cámara está dentro de la atmósfera, hitA.x puede ser negativo
      // y hitA.y sigue siendo la salida válida hacia delante.
      if (hitA.y < 0.0) { gl_FragColor = base; return; }

      // Ligero solape con el horizonte para evitar la costura negra
      // entre el disco del planeta y la atmósfera.
      float occRadius = planetRadius * 1.00045;
      float horizonOverlap = max(atmoThickness * 0.03, planetRadius * 0.00035);
      vec2 hitP = raySphere(roW, rdW, planetPos, occRadius);

	  vec3 upN = safeNormalize(roW - planetPos);
      float t0 = max(hitA.x, 0.0);
      float t1 = hitA.y;

      if (!cameraInsideAtmo) {
        if (hitP.x > 0.0) t1 = min(t1, hitP.x + horizonOverlap);
        t1 = min(t1, sceneT);
      } else {
        // Dentro de la atmósfera no dejes que la rama "sin depth" mate el cielo.
        // Solo recortamos con el planeta si realmente miramos hacia abajo.
        if (dot(rdW, upN) < -0.05) {
          if (hitP.y > 0.0) t1 = min(t1, hitP.y + horizonOverlap);
          t1 = min(t1, sceneT);
        } else if (allowDepth) {
          t1 = min(t1, sceneT);
        }
      }

      if (t1 <= t0 + 1e-5) { gl_FragColor = base; return; }

      vec3 sunDir = safeNormalize(sunPos - planetPos);
      vec3 camUp = upN;
      float sunElev = dot(camUp, sunDir); // >0 día, ~0 horizonte, <0 noche
      float dayAmt = smoothstep(-0.08, 0.16, sunElev);
      float twilight = 1.0 - smoothstep(0.10, 0.34, abs(sunElev));
      float zenithAmt = saturate(dot(rdW, camUp));
      float horizonAmt = 1.0 - smoothstep(0.02, 0.72, zenithAmt);
      float sunHorizonBand = twilight * horizonAmt;
      float nearSun = saturate(dot(rdW, sunDir));
      float horizonStreak = pow(nearSun, 18.0) * pow(horizonAmt, 1.25) * sunHorizonBand;
      vec3 horizonWarm = mix(vec3(0.84, 0.92, 1.02), vec3(1.30, 0.82, 0.42), twilight);

      // Más pasos + integración físicamente inspirada => adiós anillos
      float steps = max(24.0, min(96.0, stepsF));
      float dt = (t1 - t0) / steps;
      vec3 ins = vec3(0.0);
      vec3 tau = vec3(0.0); // optical depth acumulada (RGB)

      // Perfil de densidad (exponencial): ajusta estos para “objetivo”
      // Rayleigh (azul) dominante arriba; Mie (polvo) más abajo
      float HR = mix(0.22, 0.30, dayAmt);     // más bóveda azul de día
      float HM = mix(0.040, 0.060, twilight); // algo más de aerosol al amanecer/atardecer
 
      // Coeficientes (tuneables). Puedes mapear tus 3 capas aquí:
      // Día: más Rayleigh azul. Horizonte: más calidez Mie/ozono.
      vec3 warmTint = mix(
        vec3(1.0),
        vec3(1.45, 0.74, 0.30),
        twilight * (0.30 + 0.70 * horizonAmt)
      );
      vec3 betaR = c1 * a1 * 0.060 * atmoStrength * mix(0.85, 1.40, dayAmt);
      vec3 betaM = mix(vec3(1.0), c0, 0.25) * warmTint * a0 * 0.026 * mieStrength * mix(1.0, 1.35, sunHorizonBand);
      vec3 betaO = mix(c2, vec3(1.00, 0.44, 0.16), twilight * 0.35) * a2 * 0.006 * upperStrength;
 
      // Más extinción diurna para que el cielo tape mejor las estrellas.
      vec3 betaExt = betaR * 1.05 + betaM * 0.95 + betaO * 0.24;

      // Fase simple (Rayleigh + Mie). No es perfecta, pero da el look.
      float muSun = dot(rdW, sunDir);
      float phaseR = 0.75 * (1.0 + muSun*muSun);               // ~Rayleigh
      // Un poco más de forward scattering para que el sol "deslumbre" ligeramente.
      float g = mix(0.62, 0.76, sunHorizonBand);
      float denom = (1.0 + g*g - 2.0*g*muSun);
      float phaseM = (1.0 - g*g) / max(1e-3, pow(denom, 1.5)); // Henyey-Greenstein

      const int MAX_STEPS = 96;
      float j0 = hash2(uvDepth * 8192.0 + time * 0.11);
      for(int i=0;i<MAX_STEPS;i++){
        float fi = float(i);
        if (fi >= steps) break;
        float j = hash2(uvDepth * 4096.0 + vec2(fi*13.1, fi*7.7) + j0);
        float t = t0 + (fi + j) * dt;
        vec3 pos = roW + rdW * t;
        float r = length(pos - planetPos);
        float hn = saturate((r - planetRadius) / max(1e-6, atmoRadius - planetRadius));

        // densidades exponenciales (más realistas que 3 “picos” gaussianos)
        float dR = exp(-hn / max(1e-3, HR));
        float dM = exp(-hn / max(1e-3, HM));
        float dU = exp(-hn / 0.35);
		
        // Sombra planetaria respecto al Sol
        float shSun = sphereShadow(pos, sunDir, planetPos, planetRadius * 1.0005);

        // Amanecer/atardecer: más cálido y menos azul en capas bajas.
        float warmBand = twilight * (1.0 - smoothstep(0.0, 0.72, hn)) * (0.20 + 0.80 * horizonAmt);
        vec3 sunsetTint = mix(vec3(1.0), vec3(1.55, 0.78, 0.34), warmBand);
        vec3 rayCol = betaR * mix(1.0, 0.72, warmBand) * dR * phaseR;
        vec3 mieCol = (betaM * dM * phaseM + betaO * dU) * sunsetTint;

        // Scattering local
        vec3 scat = (rayCol + mieCol) * shSun;
        vec3 ext  = betaExt * (0.55*dR + 1.35*dM + 0.20*dU);

        // Acumular optical depth
        tau += ext * dt;
        vec3 Tr = exp3(-tau); // transmittance desde cámara hasta este punto

        // In-scattering (single scattering aprox)
        ins += Tr * scat * dt;

        // Clouds band within lower atmosphere (añadimos como scattering extra)
        // Banda algo más ancha y con transición más suave (mejor “Tierra”)
        float cloudBand = smoothstep(0.05, 0.14, hn) * (1.0 - smoothstep(0.36, 0.52, hn));
        if (cloudAlpha > 0.001 && cloudBand > 0.001){
          vec3 dir = safeNormalize(pos - planetPos);
          vec3 p = dir * cloudScale + cloudWind * time;
          float n = fbm(p);
          float m = pow(saturate((n - 0.52) * 1.9), cloudSharpness);
          // Mucho menos aporte aditivo: las nubes ya existen como mesh,
          // aquí solo queremos insinuar volumen atmosférico, no quemar el cielo.
          ins += Tr * (cloudTint * (m * cloudAlpha * cloudBand)) * dt * 0.55 * shSun;
        }
      }

      // aplicar transmittance al color base + añadir in-scattering
      vec3 TrEnd = exp3(-tau);
      // Más cielo visible de día, sin volverlo lechoso.
      vec3 skyAdd = vec3(1.0) - exp(-ins * 1.28);
      // Raya de luz rasante cerca del sol cuando está pegado al horizonte.
      // Es local/direccional, no uniforme en todo el borde.
      float mieAmt = saturate(mieStrength * 0.08);
      vec3 streakAdd = horizonWarm * (0.18 * horizonStreak) * mix(0.55, 0.90, mieAmt);

      // En píxeles de cielo, de día, la atmósfera debe tapar casi todas las estrellas.
      vec3 baseRgb = base.rgb;
      float skyPixel = hasSceneDepth ? 0.0 : 1.0;
      float skyLuma = dot(skyAdd, vec3(0.2126, 0.7152, 0.0722));
      float dayVeil = dayAmt * mix(0.72, 1.0, horizonAmt) * smoothstep(0.015, 0.10, skyLuma);
      baseRgb *= mix(1.0, 0.04, skyPixel * dayVeil);

      // Sol ligeramente deslumbrante, más visible cuando miras hacia él.
      float sunGlow = pow(saturate(muSun), 96.0) * dayAmt;
      float sunCore = pow(saturate(muSun), 1200.0) * dayAmt;
      vec3 sunGlowCol = mix(
        vec3(1.0, 0.84, 0.62),
        vec3(1.0, 0.96, 0.90),
        saturate(sunElev * 3.0 + 0.5)
      );
      vec3 sunAdd = sunGlowCol * (0.18 * sunGlow + 0.55 * sunCore);

      vec3 outCol = baseRgb * TrEnd + skyAdd + streakAdd + sunAdd;

      // Un pelín de gamma visual para acercarlo a un cielo más "terraqueo".
      outCol = pow(max(outCol, vec3(0.0)), vec3(0.92));
      outCol = clamp(outCol, 0.0, 20.0);
      gl_FragColor = vec4(outCol, 1.0);
    }
  `;
}


  global.AtmospherePP = {
    createAtmospherePostProcess,
    attachDepthForAtmosphere,
    setAtmosphereTarget,
    enableAtmospherePP,
    updateAtmospherePP,
    disposeAtmospherePP
  };
})(window);
