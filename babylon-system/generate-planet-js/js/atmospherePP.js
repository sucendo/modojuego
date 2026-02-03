/* atmospherePP.js — integrado (global) */
(function(global){
  // Requiere BABYLON global
// src/planets/atmospherePP.js
function createAtmospherePostProcess(scene, camera) {
  ensureShaders();

  const pp = new BABYLON.PostProcess(
    "atmoPP",
    "atmoPP",
    [
      "useDepth",
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
    1.0,
    camera,
    BABYLON.Texture.BILINEAR_SAMPLINGMODE,
    scene.getEngine(),
    false
  );

  pp.alphaMode = BABYLON.Engine.ALPHA_DISABLE;

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
  const depth = scene.enableDepthRenderer(camera, true);
  pp._depthTex = depth.getDepthMap();
  pp._useDepth = true;
}

function setAtmosphereTarget(pp, planetMesh, planetRadius, atmoRadius, sunPos) {
  const p = planetMesh.getAbsolutePosition();
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

      float sceneT = 1e20;
      if (useDepth > 0.5) {
        float sceneD = texture2D(depthSampler, uvDepth).r;
        if (sceneD > 0.0001 && sceneD < 0.9999) {
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
      if (hitA.x < 0.0) { gl_FragColor = base; return; }

      vec2 hitP = raySphere(roW, rdW, planetPos, planetRadius);

      float t0 = max(hitA.x, 0.0);
      float t1 = hitA.y;
      if (hitP.x > 0.0) t1 = min(t1, hitP.x);
      t1 = min(t1, sceneT);
      if (t1 <= t0) { gl_FragColor = base; return; }

      vec3 sunDir = safeNormalize(sunPos - planetPos);

      // Más pasos + integración físicamente inspirada => adiós anillos
      float steps = max(24.0, min(96.0, stepsF));
      float dt = (t1 - t0) / steps;
      vec3 ins = vec3(0.0);
      vec3 tau = vec3(0.0); // optical depth acumulada (RGB)

      // Perfil de densidad (exponencial): ajusta estos para “objetivo”
      // Rayleigh (azul) dominante arriba; Mie (polvo) más abajo
      float HR = 0.18;  // escala Rayleigh (relativa al espesor atmósfera)
      float HM = 0.08;  // escala Mie (más pegada al suelo)

      // Coeficientes (tuneables). Puedes mapear tus 3 capas aquí:
      // Intensidad (subida): más halo y más "aerial perspective" como tu objetivo
      // Rayleigh (azul) + Mie (polvo bajo) + tinte alto
      vec3 betaR = c1 * a1 * 0.070 * atmoStrength;
      vec3 betaM = c0 * a0 * 0.110 * mieStrength;
      vec3 betaO = c2 * a2 * 0.018 * upperStrength;

      // Extinción: un poco más alta para que el horizonte "lave" la superficie
      vec3 betaExt = betaR * 1.15 + betaM * 1.55 + betaO * 1.10;

      // Fase simple (Rayleigh + Mie). No es perfecta, pero da el look.
      float muSun = dot(rdW, sunDir);
      float phaseR = 0.75 * (1.0 + muSun*muSun);               // ~Rayleigh
      float g = 0.76;                                          // anisotropía Mie
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
		
        // Scattering local
        vec3 scat = betaR * dR * phaseR + betaM * dM * phaseM + betaO * dU;
        vec3 ext  = betaExt * (0.55*dR + 1.35*dM + 0.20*dU);

        // Acumular optical depth
        tau += ext * dt;
        vec3 Tr = exp3(-tau); // transmittance desde cámara hasta este punto

        // In-scattering (single scattering aprox)
        ins += Tr * scat * dt;

        // Clouds band within lower atmosphere (añadimos como scattering extra)
        float cloudBand = smoothstep(0.08, 0.16, hn) * (1.0 - smoothstep(0.32, 0.42, hn));
        if (cloudAlpha > 0.001 && cloudBand > 0.001){
          vec3 dir = safeNormalize(pos - planetPos);
          vec3 p = dir * cloudScale + cloudWind * time;
          float n = fbm(p);
          float m = pow(saturate((n - 0.52) * 2.2), cloudSharpness);
          // Nubes como “Mie” suave (blancas/azules) con transmittance
          ins += Tr * (cloudTint * (m * cloudAlpha * cloudBand)) * dt * 0.85;
        }
      }

      // aplicar transmittance al color base + añadir in-scattering
      vec3 TrEnd = exp3(-tau);
      vec3 outCol = base.rgb * TrEnd + ins;
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
    updateAtmospherePP
  };
})(window);
