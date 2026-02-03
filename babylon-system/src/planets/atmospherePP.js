// src/planets/atmospherePP.js
// PostProcess atmosphere from generate-planet-js (ported to ES modules).
// Supports depth-based occlusion + integrated procedural clouds.

export function createAtmospherePostProcess(scene, camera) {
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

  // strengths
  pp._atmoStrength = 2.8;
  pp._mieStrength = 2.4;
  pp._upperStrength = 1.6;
  pp._steps = 48;

  // default colors
  pp._c0 = new BABYLON.Vector3(0.62, 0.58, 0.52);
  pp._c1 = new BABYLON.Vector3(0.18, 0.42, 0.95);
  pp._c2 = new BABYLON.Vector3(0.10, 0.28, 0.65);

  // layer tuning
  pp._a0 = 0.52; pp._a1 = 0.34; pp._a2 = 0.18;
  pp._h0 = 0.10; pp._h1 = 0.48; pp._h2 = 0.95;
  pp._fall0 = 8.0; pp._fall1 = 3.6; pp._fall2 = 1.7;

  // clouds in PP
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

export function attachDepthForAtmosphere(scene, camera, pp) {
  const depth = scene.enableDepthRenderer(camera, true);
  pp._depthTex = depth.getDepthMap();
  pp._useDepth = true;
}

export function setAtmosphereTarget(pp, planetMesh, planetRadius, atmoRadius, sunPos) {
  const p = planetMesh.getAbsolutePosition();
  pp._planetPos = new BABYLON.Vector3(p.x, p.y, p.z);
  pp._planetRadius = planetRadius;
  pp._atmoRadius = atmoRadius;
  pp._sunPos = new BABYLON.Vector3(sunPos.x, sunPos.y, sunPos.z);
}

export function enableAtmospherePP(pp, enabled) {
  pp._enabled = !!enabled;
  const cam = pp._camera;
  if (!cam) return;

  if (pp._enabled && !pp._attached) {
    try { cam.attachPostProcess(pp); pp._attached = true; } catch (e) {}
  } else if (!pp._enabled && pp._attached) {
    try { cam.detachPostProcess(pp); pp._attached = false; } catch (e) {}
  }
}

export function updateAtmospherePP(pp, timeSeconds) { pp._time = timeSeconds; }

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

    float noise3(vec3 p){
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f*f*(3.0 - 2.0*f);

      float n000 = hash(i + vec3(0,0,0));
      float n100 = hash(i + vec3(1,0,0));
      float n010 = hash(i + vec3(0,1,0));
      float n110 = hash(i + vec3(1,1,0));
      float n001 = hash(i + vec3(0,0,1));
      float n101 = hash(i + vec3(1,0,1));
      float n011 = hash(i + vec3(0,1,1));
      float n111 = hash(i + vec3(1,1,1));

      float n00 = mix(n000, n100, f.x);
      float n10 = mix(n010, n110, f.x);
      float n01 = mix(n001, n101, f.x);
      float n11 = mix(n011, n111, f.x);

      float n0 = mix(n00, n10, f.y);
      float n1 = mix(n01, n11, f.y);

      return mix(n0, n1, f.z);
    }

    vec3 uvToWorldRay(vec2 uv){
      vec2 ndc = uv * 2.0 - 1.0;
      vec4 clip = vec4(ndc, 1.0, 1.0);
      vec4 view = invProjection * clip;
      view /= view.w;
      vec4 world = invView * vec4(view.xyz, 0.0);
      return safeNormalize(world.xyz);
    }

    float depthToLinear(float depth){
      float z = depth * 2.0 - 1.0;
      return (2.0 * minZ * maxZ) / (maxZ + minZ - z * (maxZ - minZ));
    }

    float layerAlpha(float h, float a, float fall){
      float x = saturate(1.0 - h);
      return a * pow(x, fall);
    }

    void main(void){
      vec4 base = texture2D(textureSampler, vUV);
      if (atmoStrength <= 0.0001 && cloudAlpha <= 0.0001) {
        gl_FragColor = base;
        return;
      }

      vec3 ro = cameraPos;
      vec3 rd = uvToWorldRay(vUV);

      vec2 hitAtmo = raySphere(ro, rd, planetPos, atmoRadius);
      if (hitAtmo.x < 0.0) { gl_FragColor = base; return; }

      vec2 hitPlanet = raySphere(ro, rd, planetPos, planetRadius);
      float tPlanet = (hitPlanet.x > 0.0) ? hitPlanet.x : 1e9;

      // Depth-based occlusion (optional)
      if (useDepth > 0.5) {
        float d = texture2D(depthSampler, vUV).r;
        float lin = depthToLinear(d);
        if (lin < tPlanet) { // something is in front of the planet surface
          // Still allow clouds a bit, but damp atmosphere hard
          // (avoids x-ray atmosphere when another object is between)
          // We'll just clip if the depth is closer than the atmosphere entry.
          if (lin < hitAtmo.x) { gl_FragColor = base; return; }
          tPlanet = min(tPlanet, lin);
        }
      }

      float t0 = max(hitAtmo.x, 0.0);
      float t1 = min(hitAtmo.y, tPlanet);
      if (t1 <= t0) { gl_FragColor = base; return; }

      float steps = max(8.0, min(96.0, stepsF));
      float dt = (t1 - t0) / steps;
      vec3 sum = vec3(0.0);
      vec3 sumCloud = vec3(0.0);

      vec3 L = safeNormalize(sunPos - planetPos);

      for (float i = 0.0; i < 128.0; i += 1.0) {
        if (i >= steps) break;
        float t = t0 + (i + 0.5) * dt;
        vec3 pos = ro + rd * t;
        float h = (length(pos - planetPos) - planetRadius) / max(1e-6, (atmoRadius - planetRadius));
        h = saturate(h);

        // density profile: 3 layers
        float d0 = layerAlpha(h / max(1e-3, h0), a0, fall0);
        float d1 = layerAlpha(abs(h - h1) / max(1e-3, (1.0 - h0)), a1, fall1);
        float d2 = layerAlpha(abs(h - h2) / max(1e-3, (1.0 - h1)), a2, fall2);

        float dens = d0 + d1 + d2;

        // Lighting: cheap phase function-ish
        vec3 N = safeNormalize(pos - planetPos);
        float mu = dot(N, L);
        float day = saturate(mu * 0.5 + 0.5);

        vec3 col = c0 * d0 + c1 * d1 + c2 * d2;

        // Mie-ish forward scattering boost near sun direction
        float mie = pow(saturate(dot(rd, L)), 10.0) * mieStrength;
        float upper = pow(day, 2.0) * upperStrength;

        sum += col * dens * (atmoStrength * (0.35 + 0.65 * day) + mie + upper) * dt;

        // Clouds (procedural noise band)
        if (cloudAlpha > 0.0001) {
          float n = noise3(pos * cloudScale + cloudWind * time);
          n = pow(saturate(n), cloudSharpness);
          float cDens = n * cloudAlpha * day;
          sumCloud += cloudTint * cDens * dt;
        }
      }

      vec3 outCol = base.rgb + sum + sumCloud;
      gl_FragColor = vec4(outCol, 1.0);
    }
  `;
}
