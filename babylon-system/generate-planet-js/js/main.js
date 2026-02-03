/* main.js — v2: auto-LOD + smoothing + colores por cota */
(function(){
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: false
  });


  const params = {
    // Presets de iluminación (rápido para juego vs vista previa)
    lightingPreset: "DirectionalOnly", // DirectionalOnly | DirectionalPlusAmbient

    // Luz ambiente (Hemispheric). SOLO se usa si lightingPreset lo permite o si la activas.
    ambientEnabled: false,
    ambientIntensity: 0.35,
    ambientColor: "#ffffff",
    ambientGroundColor: "#202020",

    // Iluminación basada en entorno (IBL). Si quieres CERO luz ambiente, déjalo en false.
    iblEnabled: false,
    iblIntensity: 0.0,
    seed: 1337,
    radius: 6.0,

    // Sol / Luz (solo una)
    sunType: "Directional",   // Directional | Point
    sunIntensity: 1.25,
    sunColor: "#fff1d9",
    sunRange: 500,              // PointLight
    sunPosX: 35,
    sunPosY: 10,
    sunPosZ: -42,
    sunSize: 3.5,

    // Atmósfera
    atmoEnabled: true,
    atmoUseDepth: true,
    atmoRadiusMul: 1.055,
    atmoStrength: 2.8,
    mieStrength: 2.4,
    upperStrength: 1.6,
    atmoSteps: 48,
    c0: "#9e9585",
    c1: "#2e6bff",
    c2: "#1947a6",
    cloudAlpha: 0.0,
    cloudScale: 2.7,
    cloudSharpness: 2.2,
    cloudWindX: 0.020,
    cloudWindZ: 0.012,
    cloudTint: "#eef6ff",

    // LOD (manual)
    subdivisions: 6,

    // Auto-LOD por distancia cámara
    autoLOD: false,
    lodNear: 18,      // si cámara < lodNear => high subdiv
    lodFar: 48,       // si cámara > lodFar  => low subdiv
    lodHighSubdiv: 8,
    lodLowSubdiv: 5,

    // Continentes (macro)
    continentAmp: 0.30,
    continentScale: 0.65,
    continentPower: 1.25,
    continentMaskMin: 0.10,
    continentMaskMax: 0.85,

    // Montañas (fbm)
    mountainAmp: 0.25,
    noiseScale: 2.1,
    octaves: 5,
    lacunarity: 2.02,
    gain: 0.52,
    mountainMaskByContinents: true,

    // Ridged peaks
    ridgeAmp: 0.22,
    ridgeScale: 4.0,
    ridgeOctaves: 5,
    ridgeLacunarity: 2.05,
    ridgeGain: 0.56,
    ridgeMaskByContinents: true,

    // Mar (encajado)
    seaEnabled: true,
    oceanMode: "patch",        // "patch" (recomendado) o "sphere"
    oceanCoastFill: 0.05,      // cuanto "rellena" cerca de costa (en multiplicador de altura)
    seaLevel: 0.06,
    seaThickness: 1.002,       // un pelín por encima para evitar z-fighting
    flattenUnderSea: true,
    flattenStrength: 0.85,
    shoreBand: 0.06,           // transición costera (multiplicador de altura)
    shoreStrength: 0.65,
    seaColor: "#10314a",
    seaAlpha: 1.0,
    seaRoughness: 0.12,
    seaSpecular: 0.85,
    seaReflect: 0.55,
    seaFresnelBias: 0.08,
    seaFresnelPower: 4.0,
    seaClearCoat: 0.75,
    seaClearCoatRough: 0.12,
    seaZOffset: 0,

    // Color del agua por profundidad
    colorsWaterEnabled: true,
    waterShallowColor: "#2a8fb3",
    waterDeepColor: "#062238",
    waterDepthRange: 0.22,
    waterDepthCurve: 1.8,

    // Espuma / orilla
    foamEnabled: true,
    foamColor: "#e9f6ff",
    foamWidth: 0.03,
    foamIntensity: 0.55,

    // Oleaje (ruido sobre el agua)
    wavesEnabled: false,
    waveAmp: 0.08,        // amplitud (unidades mundo)
    waveScale: 6.0,       // frecuencia
    waveSpeed: 1.0,       // velocidad
    waveOctaves: 2,
    waveNormalEveryMs: 90,
    seaDoubleSided: false,
    seaHugCoast: true,
    seaHugBand: 0.45,      // en unidades de mundo (aprox)
    seaHugFactor: 0.35,    // 0..1 (cuánto sigue la costa)

    // Cráteres
    cratersEnabled: true,
    craterCount: 60,
    craterRadiusMin: 0.035,
    craterRadiusMax: 0.085,
    craterDepthMin: 0.03,
    craterDepthMax: 0.09,
    craterRim: 0.18,
    craterBlend: 0.60,

    // Clamps (evita picos "volando")
    heightClampEnabled: true,
    heightClampMin: 0.80,
    heightClampMax: 1.65,

    // Erosión (térmica) — hace que el relieve parezca más geológico
    erosionEnabled: true,
    erosionIterations: 2,
    erosionTalus: 0.02,    // umbral de pendiente
    erosionRate: 0.15,     // 0..0.5

    // Suavizado
    smoothingEnabled: true,
    smoothIterations: 1,
    smoothStrength: 0.35,

    // Colores por cota
    colorsEnabled: true,
    colorBeach: "#bfa77a",
    colorLow:   "#6e7a5e",
    colorMid:   "#7c6a4c",
    colorHigh:  "#8b7f70",
    colorSnow:  "#e7edf0",
    beachWidth: 0.03,  // banda cerca del mar (en multiplicador de altura)
    snowLine: 0.82,    // 0..1 (altura normalizada por encima del mar)
    snowLinePole: 0.62, // más nieve en polos
    snowLatPower: 1.6,

    // Slope shading (oscurece paredes)
    slopeShading: true,
    slopeStrength: 0.45,
    rockColor: "#6f6a61",
    rockSlope: 0.35, // desde qué pendiente empieza a salir roca (0..1)

    // Visual
    wireframe: false,
    autorotate: true,
    rotSpeed: 0.06,

    regenerate: () => regenerate(true),
    randomizeSeed: () => { params.seed = (Math.random()*1e9)|0; regenerate(true); }
  };

  // =========================
  // Export / Import (JSON)
  // =========================
  const PROJECT_ID = "planet-babylon-terrain";
  const CONFIG_VERSION = 1;

  function deepClone(obj){
    return JSON.parse(JSON.stringify(obj));
  }


  function pickPlanetParams(p){
    // Exporta SOLO identidad del planeta: terreno, colores, mar, atmósfera y nubes.
    // Excluye: luces/IBL, animación, LOD/render helpers, wireframe.
    const EXCLUDE_PREFIXES = ["sun", "ibl", "wave", "ambient", "lighting"];
    const EXCLUDE_KEYS = new Set([
      "autorotate","rotSpeed",
      "wireframe",
      "autoLOD","lodNear","lodFar","lodHighSubdiv","lodLowSubdiv",
      "waveAmp","waveScale","waveSpeed","waveOctaves","waveNormalEveryMs","wavesEnabled"
    ]);
    const out = {};
    for (const k of Object.keys(p || {})){
      const lower = k.toLowerCase();
      if (EXCLUDE_KEYS.has(k)) continue;
      if (EXCLUDE_PREFIXES.some(pref => lower.startsWith(pref))) continue;
      out[k] = p[k];
    }
    return out;
  }


  function getExportPayload(){
    return {
      project: PROJECT_ID,
      configVersion: CONFIG_VERSION,
      exportedAt: new Date().toISOString(),
      params: deepClone(pickPlanetParams(params))
    };
  }

  function downloadJSON(filename, data){
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function clampKnownParams(p){
    // defensivo: por si importas un json antiguo o valores fuera de rango
    if (typeof p.subdivisions === "number") p.subdivisions = Math.max(1, Math.min(99, Math.floor(p.subdivisions)));
    if (typeof p.lodHighSubdiv === "number") p.lodHighSubdiv = Math.max(1, Math.min(99, Math.floor(p.lodHighSubdiv)));
    if (typeof p.lodLowSubdiv === "number") p.lodLowSubdiv = Math.max(1, Math.min(99, Math.floor(p.lodLowSubdiv)));

    if (typeof p.seaAlpha === "number") p.seaAlpha = Math.max(0, Math.min(1, p.seaAlpha));
    if (typeof p.seaRoughness === "number") p.seaRoughness = Math.max(0.02, Math.min(1, p.seaRoughness));
    if (typeof p.seaSpecular === "number") p.seaSpecular = Math.max(0, Math.min(1.5, p.seaSpecular));

    if (typeof p.iblIntensity === "number") p.iblIntensity = Math.max(0, Math.min(2, p.iblIntensity));
    if (typeof p.sunIntensity === "number") p.sunIntensity = Math.max(0, Math.min(20, p.sunIntensity));
 
    if (typeof p.ambientIntensity === "number") p.ambientIntensity = Math.max(0, Math.min(2, p.ambientIntensity));
    if (typeof p.ambientEnabled === "boolean") p.ambientEnabled = !!p.ambientEnabled;

    return p;
  }

  function applyImportedParams(imported){
    const safe = clampKnownParams(imported || {});
    // Importar SOLO parámetros del planeta (no iluminación/animación/oleaje/etc.)
    const filtered = pickPlanetParams(safe);
    for (const k of Object.keys(filtered)) params[k] = filtered[k];
  }

  function createFilePicker(onFile){
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.style.display = "none";
    input.addEventListener("change", () => {
      const f = input.files && input.files[0];
      if (!f) return;
      onFile(f);
      // permitir cargar el mismo archivo dos veces seguidas
      input.value = "";
    });
    document.body.appendChild(input);
    return input;
  }

  function loadJSONFromFile(file, onDone){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(String(reader.result || "{}"));
        onDone(null, data);
      } catch(err){
        onDone(err);
      }
    };
    reader.onerror = () => onDone(reader.error || new Error("FileReader error"));
    reader.readAsText(file);
  }

  function saveToLocalStorage(){
    try{
      localStorage.setItem(PROJECT_ID + ":lastConfig", JSON.stringify(getExportPayload()));
      toast("Guardado en el navegador ✅");
    } catch(e){
      console.warn(e);
      toast("No se pudo guardar en localStorage");
    }
  }

  function loadFromLocalStorage(){
    try{
      const raw = localStorage.getItem(PROJECT_ID + ":lastConfig");
      if (!raw) return toast("No hay config guardada en este navegador");
      const data = JSON.parse(raw);
      if (data && data.params){
        applyImportedParams(data.params);
        refreshGUI();
        // actualiza IBL/env si aplica
        applyIBL();
        rebuildSunLight(params.sunType);
        regenerate(true);
        toast("Cargado ✅");
      }
    } catch(e){
      console.warn(e);
      toast("No se pudo cargar desde localStorage");
    }
  }


  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.03,0.04,0.06,1);
  scene.ambientColor = new BABYLON.Color3(0,0,0);

  // Luz ambiente (Hemispheric) — opcional
  let ambientLight = null;
  function rebuildAmbientLight(){
    if (ambientLight) { try { ambientLight.dispose(); } catch(e){} ambientLight = null; }
    if (!params.ambientEnabled) return;
    ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0,1,0), scene);
    ambientLight.intensity = Math.max(0, params.ambientIntensity || 0);
    ambientLight.diffuse = BABYLON.Color3.FromHexString(params.ambientColor || "#ffffff");
    ambientLight.groundColor = BABYLON.Color3.FromHexString(params.ambientGroundColor || "#202020");
    ambientLight.specular = ambientLight.diffuse;
  }
   
  function applyIBL(){
  // Entorno (IBL) opcional: aporta luz "ambiental". Por defecto está apagado.
    if (params.iblEnabled){
      scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        "https://playground.babylonjs.com/textures/environment.env",
        scene
      );
      scene.environmentIntensity = params.iblIntensity;
    } else {
      scene.environmentTexture = null;
      scene.environmentIntensity = 0.0;
    }
  }  

  function applyLightingPreset(preset){
    params.lightingPreset = preset || params.lightingPreset;

    if (params.lightingPreset === "DirectionalOnly"){
      // Modo juego: sin ambiente (ni hemi ni IBL)
      params.sunType = "Directional";
      params.ambientEnabled = false;
      params.iblEnabled = false;
      params.iblIntensity = 0.0;
      applyIBL();
      rebuildAmbientLight();
      if (typeof rebuildSunLight === "function") rebuildSunLight("Directional");
      return;
    }

    if (params.lightingPreset === "DirectionalPlusAmbient"){
      // Vista previa: direccional + ambiente (hemi) + IBL suave para mejorar agua/reflejos
      params.sunType = "Directional";
      params.ambientEnabled = true;
      if ((params.ambientIntensity||0) <= 0) params.ambientIntensity = 0.35;

      // IBL opcional pero recomendado en este modo
      params.iblEnabled = true;
      if ((params.iblIntensity||0) <= 0) params.iblIntensity = 0.35;
      applyIBL();
      rebuildAmbientLight();
      if (typeof rebuildSunLight === "function") rebuildSunLight("Directional");
      return;
    }
  }

  applyIBL();
  rebuildAmbientLight();
  // MUY IMPORTANTE: el mar está en renderingGroupId=1. Babylon por defecto limpia el depth entre grupos,
  // lo que hace que el mar se vea "a través" del terreno. Desactivamos el auto-clear del depth en el grupo 1.
  scene.setRenderingAutoClearDepthStencil(1, false);

  // Cámara
  const camera = new BABYLON.ArcRotateCamera("cam",
    -Math.PI/2, Math.PI/2.2, 26,
    BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 2200;
  camera.minZ = 0.1;

  // Luz (solo UNA fuente). Creamos un "sol" (mesh) + un único light (Directional o Point)
  const sunMesh = BABYLON.MeshBuilder.CreateSphere("sunMesh", {diameter: 3.5, segments: 24}, scene);
  sunMesh.isPickable = false;
  sunMesh.position.set(35, 10, -42);
  const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
  sunMat.emissiveColor = new BABYLON.Color3(1.0, 0.95, 0.85);
  sunMat.disableLighting = true;
  sunMesh.material = sunMat;

  let sunLight = null;
  const sunState = { type: "Directional", intensity: 1.25, color: "#fff1d9", range: 500 };
  function rebuildSunLight(type){
    sunState.type = type || sunState.type;
    if (sunLight) { try { sunLight.dispose(); } catch(e){} }
    if (sunState.type === "Point") {
      sunLight = new BABYLON.PointLight("sunLight", sunMesh.position.clone(), scene);
      sunLight.range = sunState.range;
    } else {
      sunLight = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-0.6,-0.2,-0.7), scene);
    }
    sunLight.intensity = sunState.intensity;
    sunLight.diffuse = BABYLON.Color3.FromHexString(sunState.color);
    sunLight.specular = sunLight.diffuse;
  }

  const planet = new PlanetGenerator(scene);

  // Atmósfera (post-process) basado en atmospherePP.js
  const atmoPP = (window.AtmospherePP && AtmospherePP.createAtmospherePostProcess)
    ? AtmospherePP.createAtmospherePostProcess(scene, camera)
    : null;
  if (atmoPP){
    AtmospherePP.attachDepthForAtmosphere(scene, camera, atmoPP);
  }

  let pending = false;
    function hexToVec3(hex){
    const c = BABYLON.Color3.FromHexString(hex);
    return new BABYLON.Vector3(c.r, c.g, c.b);
  }

  function clampSubdiv(v){
    v = Math.floor(v||0);
    if (v < 1) v = 1;
    if (v > 99) v = 99;
    return v;
  }

function regenerate(forceRebuild){
    params.subdivisions = clampSubdiv(params.subdivisions);
    if (params.nearSubdiv !== undefined) params.nearSubdiv = clampSubdiv(params.nearSubdiv);
    if (params.farSubdiv !== undefined) params.farSubdiv = clampSubdiv(params.farSubdiv);
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      planet.generate(params);

    // Atmósfera: target y parámetros
    if (atmoPP){
      atmoPP._enabled = !!params.atmoEnabled;
      atmoPP._useDepth = !!params.atmoUseDepth;
      atmoPP._atmoStrength = params.atmoStrength;
      atmoPP._mieStrength = params.mieStrength;
      atmoPP._upperStrength = params.upperStrength;
      atmoPP._steps = params.atmoSteps;
      atmoPP._c0 = hexToVec3(params.c0);
      atmoPP._c1 = hexToVec3(params.c1);
      atmoPP._c2 = hexToVec3(params.c2);
      atmoPP._cloudAlpha = params.cloudAlpha;
      atmoPP._cloudScale = params.cloudScale;
      atmoPP._cloudSharpness = params.cloudSharpness;
      atmoPP._cloudWind = new BABYLON.Vector3(params.cloudWindX, 0.0, params.cloudWindZ);
      const ct = BABYLON.Color3.FromHexString(params.cloudTint);
      atmoPP._cloudTint = new BABYLON.Vector3(ct.r, ct.g, ct.b);

      const atmoR = params.radius * params.atmoRadiusMul;
      AtmospherePP.setAtmosphereTarget(atmoPP, planet.mesh, params.radius, atmoR, sunMesh.position);
      AtmospherePP.enableAtmospherePP(atmoPP, params.atmoEnabled);
    }
    });
  }

  regenerate(true);


  // Aplicar valores iniciales del sol/luz
  sunState.intensity = params.sunIntensity;
  sunState.color = params.sunColor;
  sunState.range = params.sunRange;
  rebuildSunLight(params.sunType);
  
  // Ahora sí: sunState/sunLight ya existen, podemos aplicar el preset
  applyLightingPreset(params.lightingPreset);

  // GUI
  const gui = new dat.GUI({ width: 370 });

  // Panel: Guardar / Cargar
  const fIO = gui.addFolder("Guardar / Cargar");
  fIO.open();

  fIO.add({saveJSON: () => {
    const payload = getExportPayload();
    const name = `planet_${Date.now()}.json`;
    downloadJSON(name, payload);
    toast("JSON descargado ✅");
  }}, "saveJSON").name("Guardar JSON");

  const _filePicker = createFilePicker((file) => {
    loadJSONFromFile(file, (err, data) => {
      if (err){ console.error(err); return toast("JSON inválido"); }
      if (!data || !data.params) return toast("Falta campo params");
      applyImportedParams(data.params);
      refreshGUI();
      if (typeof applyIBL === "function") applyIBL();
      if (typeof rebuildSunLight === "function") rebuildSunLight(params.sunType);
      regenerate(true);
      toast("JSON cargado ✅");
    });
  });

  fIO.add({loadJSON: () => _filePicker.click()}, "loadJSON").name("Cargar JSON");
  fIO.add({saveLocal: saveToLocalStorage}, "saveLocal").name("Guardar (navegador)");
  fIO.add({loadLocal: loadFromLocalStorage}, "loadLocal").name("Cargar (navegador)");


  // UI helper: toast ligero
  let _toastEl = null;
  function toast(msg){
    try{
      if (!_toastEl){
        _toastEl = document.createElement("div");
        _toastEl.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:9999;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,0.7);color:#fff;font:13px/1.2 system-ui;max-width:60vw;pointer-events:none;opacity:0;transition:opacity .15s ease";
        document.body.appendChild(_toastEl);
      }
      _toastEl.textContent = msg;
      _toastEl.style.opacity = "1";
      clearTimeout(_toastEl._t);
      _toastEl._t = setTimeout(()=>{ if(_toastEl) _toastEl.style.opacity="0"; }, 1400);
    } catch(e){}
  }

  // Refrescar GUI (recorre carpetas + controllers)
  function refreshGUI(){
    function walk(g){
      if (!g) return;
      if (g.__controllers){
        for (const c of g.__controllers){ try{ c.updateDisplay(); }catch(e){} }
      }

      if (g.__folders){
        for (const k of Object.keys(g.__folders)){ walk(g.__folders[k]); }
      }
    }
    walk(gui);
  }

  // Unificamos TODO en una misma sección (sin duplicados)
  const fSun = gui.addFolder("Sol / Iluminación (una)");
  fSun.open();

  // Presets + ambiente
  fSun.add(params, "lightingPreset", ["DirectionalOnly","DirectionalPlusAmbient"])
    .name("Preset")
    .onChange(() => {
      applyLightingPreset(params.lightingPreset);
      refreshGUI();
      regenerate(false);
    });
  fSun.add(params, "ambientEnabled").name("Ambiente (Hemi)").onChange(()=>{ rebuildAmbientLight(); });
  fSun.add(params, "ambientIntensity", 0.0, 2.0, 0.01).name("Ambiente intensidad")
    .onChange(()=>{ if (ambientLight) ambientLight.intensity = Math.max(0, params.ambientIntensity||0); });
  fSun.addColor(params, "ambientColor").name("Ambiente color")
    .onChange(()=>{ if (ambientLight) ambientLight.diffuse = BABYLON.Color3.FromHexString(params.ambientColor||"#fff"); });
  fSun.addColor(params, "ambientGroundColor").name("Suelo color")
    .onChange(()=>{ if (ambientLight) ambientLight.groundColor = BABYLON.Color3.FromHexString(params.ambientGroundColor||"#202020"); });

  // Sol / Luz (una)
  fSun.add(params, "sunType", ["Directional","Point"]).name("Tipo").onChange(()=>{ sunState.type = params.sunType; rebuildSunLight(params.sunType); });
  fSun.add(params, "sunIntensity", 0.0, 5.0, 0.01).name("Intensidad");
  fSun.addColor(params, "sunColor").name("Color");
  fSun.add(params, "sunRange", 10, 5000, 10);
  fSun.add(params, "sunPosX", -200, 200, 0.5);
  fSun.add(params, "sunPosY", -200, 200, 0.5);
  fSun.add(params, "sunPosZ", -200, 200, 0.5);
  fSun.add(params, "sunSize", 0.5, 30, 0.1);

  const fAtmo = gui.addFolder("Atmósfera (postprocess)");
  fAtmo.add(params, "atmoEnabled").onChange(()=>{ if(atmoPP) AtmospherePP.enableAtmospherePP(atmoPP, params.atmoEnabled); });
  fAtmo.add(params, "atmoUseDepth").onChange(()=>{ if(atmoPP) atmoPP._useDepth = !!params.atmoUseDepth; });
  fAtmo.add(params, "atmoRadiusMul", 1.01, 1.25, 0.001).onChange(()=>regenerate(false));
  fAtmo.add(params, "atmoStrength", 0.0, 8.0, 0.01).onChange(()=>regenerate(false));
  fAtmo.add(params, "mieStrength",  0.0, 8.0, 0.01).onChange(()=>regenerate(false));
  fAtmo.add(params, "upperStrength",0.0, 8.0, 0.01).onChange(()=>regenerate(false));
  fAtmo.add(params, "atmoSteps", 8, 96, 1).onChange(()=>regenerate(false));
  fAtmo.addColor(params, "c0").onChange(()=>regenerate(false));
  fAtmo.addColor(params, "c1").onChange(()=>regenerate(false));
  fAtmo.addColor(params, "c2").onChange(()=>regenerate(false));

  const fCloud = gui.addFolder("Nubes (opcional)");
  fCloud.add(params, "cloudAlpha", 0.0, 1.0, 0.01).onChange(()=>regenerate(false));
  fCloud.add(params, "cloudScale", 0.5, 8.0, 0.05).onChange(()=>regenerate(false));
  fCloud.add(params, "cloudSharpness", 0.2, 6.0, 0.05).onChange(()=>regenerate(false));
  fCloud.add(params, "cloudWindX", -0.2, 0.2, 0.001).onChange(()=>regenerate(false));
  fCloud.add(params, "cloudWindZ", -0.2, 0.2, 0.001).onChange(()=>regenerate(false));
  fCloud.addColor(params, "cloudTint").onChange(()=>regenerate(false));
  gui.domElement.style.zIndex = "20";

  const fMain = gui.addFolder("Planeta");
  fMain.add(params, "seed", 0, 999999999, 1).onFinishChange(()=>regenerate(true));
  fMain.add(params, "randomizeSeed");
  fMain.add(params, "radius", 2.0, 16.0, 0.1).onFinishChange(()=>regenerate(true));
  fMain.add(params, "subdivisions", 2, 99, 1).onFinishChange(()=>regenerate(true));
  fMain.add(params, "wireframe").onChange(()=>regenerate(false));
  fMain.open();

  const fLOD = gui.addFolder("Auto-LOD (por distancia)");
  fLOD.add(params, "autoLOD");
  fLOD.add(params, "lodNear", 6, 40, 1);
  fLOD.add(params, "lodFar", 20, 120, 1);
  fLOD.add(params, "lodHighSubdiv", 5, 9, 1);
  fLOD.add(params, "lodLowSubdiv", 2, 7, 1);

  const fCont = gui.addFolder("Continentes (macro)");
  fCont.add(params, "continentAmp", 0.0, 1.2, 0.01).onChange(()=>regenerate(false));
  fCont.add(params, "continentScale", 0.1, 3.0, 0.01).onChange(()=>regenerate(false));
  fCont.add(params, "continentPower", 0.5, 4.0, 0.01).onChange(()=>regenerate(false));
  fCont.add(params, "continentMaskMin", 0.0, 1.0, 0.01).onChange(()=>regenerate(false));
  fCont.add(params, "continentMaskMax", 0.0, 1.0, 0.01).onChange(()=>regenerate(false));

  const fMount = gui.addFolder("Montañas (fbm)");
  fMount.add(params, "mountainAmp", 0.0, 2.0, 0.01).onChange(()=>regenerate(false));
  fMount.add(params, "noiseScale", 0.2, 10.0, 0.01).onChange(()=>regenerate(false));
  fMount.add(params, "octaves", 1, 9, 1).onFinishChange(()=>regenerate(false));
  fMount.add(params, "lacunarity", 1.2, 3.5, 0.01).onChange(()=>regenerate(false));
  fMount.add(params, "gain", 0.2, 0.85, 0.01).onChange(()=>regenerate(false));
  fMount.add(params, "mountainMaskByContinents").onChange(()=>regenerate(false));

  const fRidge = gui.addFolder("Picos (ridged)");
  fRidge.add(params, "ridgeAmp", 0.0, 2.0, 0.01).onChange(()=>regenerate(false));
  fRidge.add(params, "ridgeScale", 0.2, 12.0, 0.01).onChange(()=>regenerate(false));
  fRidge.add(params, "ridgeOctaves", 1, 8, 1).onFinishChange(()=>regenerate(false));
  fRidge.add(params, "ridgeLacunarity", 1.2, 3.5, 0.01).onChange(()=>regenerate(false));
  fRidge.add(params, "ridgeGain", 0.2, 0.85, 0.01).onChange(()=>regenerate(false));
  fRidge.add(params, "ridgeMaskByContinents").onChange(()=>regenerate(false));

  const fSea = gui.addFolder("Mar");
  fSea.add(params, "seaEnabled").onChange(()=>regenerate(false));
  fSea.add(params, "oceanMode", ["patch","sphere"]).onChange(()=>regenerate(false));
  fSea.add(params, "oceanCoastFill", 0.0, 0.20, 0.005).onChange(()=>regenerate(false));
  fSea.add(params, "seaLevel", -0.25, 0.40, 0.005).onChange(()=>regenerate(false));
  fSea.add(params, "seaThickness", 1.000, 1.02, 0.0005).onChange(()=>regenerate(false));
  fSea.add(params, "flattenUnderSea").onChange(()=>regenerate(false));
  fSea.add(params, "flattenStrength", 0.0, 1.0, 0.01).onChange(()=>regenerate(false));
  fSea.add(params, "shoreBand", 0.0, 0.20, 0.005).onChange(()=>regenerate(false));
  fSea.add(params, "shoreStrength", 0.0, 1.0, 0.01).onChange(()=>regenerate(false));
  fSea.addColor(params, "seaColor").onChange(()=>regenerate(false));
  fSea.add(params, "seaAlpha", 0.15, 1.0, 0.01).onChange(()=>regenerate(false));
  fSea.add(params, "seaRoughness", 0.02, 1.0, 0.01).onChange(()=>regenerate(false));
  fSea.add(params, "seaSpecular", 0.0, 1.5, 0.01).onChange(()=>regenerate(false));
  fSea.add(params, "seaReflect", 0.0, 1.5, 0.01).onChange(()=>regenerate(false));
  fSea.add(params, "seaFresnelBias", 0.0, 0.3, 0.005).onChange(()=>regenerate(false));
  fSea.add(params, "seaFresnelPower", 1.0, 10.0, 0.1).onChange(()=>regenerate(false));
  fSea.add(params, "seaClearCoat", 0.0, 1.0, 0.01).onChange(()=>regenerate(false));
  fSea.add(params, "seaClearCoatRough", 0.02, 0.6, 0.01).onChange(()=>regenerate(false));
  fSea.add(params, "colorsWaterEnabled").onChange(()=>regenerate(false));
  fSea.addColor(params, "waterShallowColor").onChange(()=>regenerate(false));
  fSea.addColor(params, "waterDeepColor").onChange(()=>regenerate(false));
  fSea.add(params, "waterDepthRange", 0.02, 0.6, 0.005).onChange(()=>regenerate(false));
  fSea.add(params, "waterDepthCurve", 0.6, 4.0, 0.05).onChange(()=>regenerate(false));
  fSea.add(params, "foamEnabled").onChange(()=>regenerate(false));
  fSea.addColor(params, "foamColor").onChange(()=>regenerate(false));
  fSea.add(params, "foamWidth", 0.0, 0.12, 0.002).onChange(()=>regenerate(false));
  fSea.add(params, "foamIntensity", 0.0, 1.0, 0.01).onChange(()=>regenerate(false));
  fSea.add(params, "wavesEnabled").onChange(()=>regenerate(false));
  fSea.add(params, "waveAmp", 0.0, 0.35, 0.005);
  fSea.add(params, "waveScale", 0.5, 20.0, 0.1);
  fSea.add(params, "waveSpeed", 0.0, 4.0, 0.05);
  fSea.add(params, "waveOctaves", 1, 4, 1);
  fSea.add(params, "seaZOffset", -8, 8, 1).onChange(()=>regenerate(false));
  fSea.add(params, "seaDoubleSided").onChange(()=>regenerate(false));
  fSea.add(params, "seaHugCoast").onChange(()=>regenerate(false));
  fSea.add(params, "seaHugBand", 0.0, 2.0, 0.05).onChange(()=>regenerate(false));
  fSea.add(params, "seaHugFactor", 0.0, 0.95, 0.01).onChange(()=>regenerate(false));

  const fCr = gui.addFolder("Cráteres");
  fCr.add(params, "cratersEnabled").onChange(()=>regenerate(true));
  fCr.add(params, "craterCount", 0, 220, 1).onFinishChange(()=>regenerate(true));
  fCr.add(params, "craterRadiusMin", 0.005, 0.12, 0.001).onFinishChange(()=>regenerate(true));
  fCr.add(params, "craterRadiusMax", 0.01, 0.25, 0.001).onFinishChange(()=>regenerate(true));
  fCr.add(params, "craterDepthMin", 0.0, 0.30, 0.005).onFinishChange(()=>regenerate(true));
  fCr.add(params, "craterDepthMax", 0.0, 0.50, 0.005).onFinishChange(()=>regenerate(true));
  fCr.add(params, "craterRim", 0.0, 0.50, 0.01).onFinishChange(()=>regenerate(true));
  fCr.add(params, "craterBlend", 0.05, 1.0, 0.01).onFinishChange(()=>regenerate(true));

  const fClamp = gui.addFolder("Antipicos (clamp alturas)");
  fClamp.add(params, "heightClampEnabled").onChange(()=>regenerate(false));
  fClamp.add(params, "heightClampMin", 0.40, 1.10, 0.01).onChange(()=>regenerate(false));
  fClamp.add(params, "heightClampMax", 1.05, 2.50, 0.01).onChange(()=>regenerate(false));

  const fEro = gui.addFolder("Erosión (térmica)");
  fEro.add(params, "erosionEnabled").onChange(()=>regenerate(false));
  fEro.add(params, "erosionIterations", 0, 10, 1).onFinishChange(()=>regenerate(false));
  fEro.add(params, "erosionTalus", 0.0, 0.10, 0.002).onChange(()=>regenerate(false));
  fEro.add(params, "erosionRate", 0.0, 0.50, 0.01).onChange(()=>regenerate(false));

  const fSmooth = gui.addFolder("Suavizado");
  fSmooth.add(params, "smoothingEnabled").onChange(()=>regenerate(false));
  fSmooth.add(params, "smoothIterations", 0, 6, 1).onFinishChange(()=>regenerate(false));
  fSmooth.add(params, "smoothStrength", 0.0, 0.95, 0.01).onChange(()=>regenerate(false));

  const fCols = gui.addFolder("Colores por cota");
  fCols.add(params, "colorsEnabled").onChange(()=>regenerate(false));
  fCols.addColor(params, "colorBeach").onChange(()=>regenerate(false));
  fCols.addColor(params, "colorLow").onChange(()=>regenerate(false));
  fCols.addColor(params, "colorMid").onChange(()=>regenerate(false));
  fCols.addColor(params, "colorHigh").onChange(()=>regenerate(false));
  fCols.addColor(params, "colorSnow").onChange(()=>regenerate(false));
  fCols.add(params, "beachWidth", 0.0, 0.10, 0.002).onChange(()=>regenerate(false));
  fCols.add(params, "snowLine", 0.4, 0.98, 0.01).onChange(()=>regenerate(false));
  fCols.add(params, "snowLinePole", 0.2, 0.9, 0.01).onChange(()=>regenerate(false));
  fCols.add(params, "snowLatPower", 0.5, 4.0, 0.05).onChange(()=>regenerate(false));
  fCols.add(params, "slopeShading").onChange(()=>regenerate(false));
  fCols.add(params, "slopeStrength", 0.0, 0.9, 0.01).onChange(()=>regenerate(false));
  fCols.addColor(params, "rockColor").onChange(()=>regenerate(false));
  fCols.add(params, "rockSlope", 0.0, 0.95, 0.01).onChange(()=>regenerate(false));

  const fAnim = gui.addFolder("Animación");
  fAnim.add(params, "autorotate");
  fAnim.add(params, "rotSpeed", -0.6, 0.6, 0.005);

  // Auto LOD
  let lastLOD = params.subdivisions;
  scene.onBeforeRenderObservable.add(() => {
    if (!params.autoLOD) return;
    const d = camera.radius;
    const target = (d < params.lodNear) ? params.lodHighSubdiv :
                   (d > params.lodFar)  ? params.lodLowSubdiv :
                   params.subdivisions;
    if (target !== lastLOD){
      lastLOD = target;
      params.subdivisions = target;
      regenerate(true);
      // sync GUI controller display (dat.GUI doesn't auto update)
      // No necesario, pero ayuda: (busca el controller por name)
    }
  });

  engine.runRenderLoop(() => {
    const dt = engine.getDeltaTime();
    // Sol: posición y tamaño desde UI
    sunMesh.position.set(params.sunPosX, params.sunPosY, params.sunPosZ);
    sunMesh.scaling.set(params.sunSize/3.5, params.sunSize/3.5, params.sunSize/3.5);
    sunMat.emissiveColor = BABYLON.Color3.FromHexString(params.sunColor);
    sunState.intensity = params.sunIntensity;
    sunState.color = params.sunColor;
    sunState.range = params.sunRange;
    if (!sunLight || sunState.type !== params.sunType) rebuildSunLight(params.sunType);
    // actualizar luz
    sunLight.intensity = sunState.intensity;
    // IMPORTANTE: el color del sol debe teñir la luz SIEMPRE (aunque no se reconstruya)
    const sunC = BABYLON.Color3.FromHexString(params.sunColor || "#ffffff");
    sunLight.diffuse = sunC;
    sunLight.specular = sunC;

    if (sunLight instanceof BABYLON.PointLight){
      sunLight.position.copyFrom(sunMesh.position);
      sunLight.range = sunState.range;
    } else if (sunLight instanceof BABYLON.DirectionalLight){
      const dir = planet.mesh ? (planet.mesh.getAbsolutePosition().subtract(sunMesh.position)).normalize() : new BABYLON.Vector3(-0.6,-0.2,-0.7);
      sunLight.direction.copyFrom(dir);
    }

    // Ambiente live update (por si cambias sliders)
    if (ambientLight){
      ambientLight.intensity = Math.max(0, params.ambientIntensity||0);
      ambientLight.diffuse = BABYLON.Color3.FromHexString(params.ambientColor||"#ffffff");
      ambientLight.groundColor = BABYLON.Color3.FromHexString(params.ambientGroundColor||"#202020");
    }

    // Atmósfera tiempo/sol
    if (atmoPP && params.atmoEnabled){
      AtmospherePP.updateAtmospherePP(atmoPP, (performance.now()*0.001));
      atmoPP._sunPos = sunMesh.position.clone();
    }

    if (params.autorotate && planet.mesh){
      planet.mesh.rotation.y += params.rotSpeed * dt * 0.001;
      if (planet.seaMesh) planet.seaMesh.rotation.y = planet.mesh.rotation.y;
    }
    // Oleaje
    planet.updateSeaWaves(dt, params);
    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());
})();
