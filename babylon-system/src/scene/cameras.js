// scene/cameras.js
// Paso 2: extraer cámaras + modos (orbit/fly/surface) y helpers de órbita.
// Nota: NO toca atmósfera PP aquí; se notifica vía onActiveCameraChanged(cam).

export function setupCamerasAndModes({
  scn,
  engine,
  canvas,
  ui,
  onActiveCameraChanged, // (cam)=>void (para re-crear PP atmósfera por cámara)
}) {
  const GALAXY_MAX_Z = 5e7;

  // ------------------------------------------------------------
  // Cameras
  // ------------------------------------------------------------
  const cameraOrbit = new BABYLON.ArcRotateCamera(
    "camOrbit",
    -Math.PI / 2,
    Math.PI / 3,
    260,
    BABYLON.Vector3.Zero(),
    scn
  );
  cameraOrbit.lowerRadiusLimit = 8;
  cameraOrbit.upperRadiusLimit = 2500;
  cameraOrbit.wheelDeltaPercentage = 0.01;
  cameraOrbit.panningSensibility = 1200; // más bajo = paneo más rápido
  cameraOrbit.panningMouseButton = 2;    // 2 = botón derecho
  cameraOrbit.maxZ = GALAXY_MAX_Z;

  // Firma: attachControl(canvas, noPreventDefault, useCtrlForPanning, panningMouseButton)
  cameraOrbit.attachControl(canvas, true, false, 2);
  try {
    const p = cameraOrbit.inputs && cameraOrbit.inputs.attached && cameraOrbit.inputs.attached.pointers;
    if (p) {
      p.panningMouseButton = 2;
      if (Array.isArray(p.buttons)) p.buttons = [0, 2];
    }
  } catch (e) {}

  // Evita menú contextual con botón derecho (si no, interfiere con el pan)
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  const cameraFly = new BABYLON.UniversalCamera(
    "camFly",
    new BABYLON.Vector3(0, 60, -220),
    scn
  );
  cameraFly.minZ = 0.1;
  cameraFly.maxZ = GALAXY_MAX_Z;

  // Velocidad base + turbo (Shift) para vuelo libre
  const FLY_SPEED_BASE = 2.2;
  const FLY_SPEED_SPRINT = 7.5;
  cameraFly.speed = FLY_SPEED_BASE;
  cameraFly._flyBaseSpeed = FLY_SPEED_BASE;
  cameraFly._flySprintSpeed = FLY_SPEED_SPRINT;
  cameraFly.angularSensibility = 4000;
  cameraFly.keysUp = [87];    // W
  cameraFly.keysDown = [83];  // S
  cameraFly.keysLeft = [65];  // A
  cameraFly.keysRight = [68]; // D
  cameraFly.keysUpward = [32];       // Space up
  cameraFly.keysDownward = [17, 67]; // Ctrl or C down

  // Collisions (fly) — mantenemos tu config tal cual
  scn.collisionsEnabled = false;
  cameraFly.checkCollisions = false;
  cameraFly.applyGravity = false;
  cameraFly.ellipsoid = new BABYLON.Vector3(1.2, 1.2, 1.2);
  cameraFly.ellipsoidOffset = new BABYLON.Vector3(0, 1.2, 0);
  cameraFly.onCollide = () => {
    try { cameraFly.cameraDirection.scaleInPlace(-0.25); } catch (e) {}
  };

  // Surface camera: use a playerRoot for proper orientation
  const playerRoot = new BABYLON.TransformNode("playerRoot", scn);
  playerRoot.rotationQuaternion = BABYLON.Quaternion.Identity();

  const cameraSurface = new BABYLON.UniversalCamera(
    "camSurface",
    new BABYLON.Vector3(0, 0, 0),
    scn
  );
  cameraSurface.parent = playerRoot;
  cameraSurface.minZ = 0.05;
  cameraSurface.maxZ = GALAXY_MAX_Z;
  cameraSurface.speed = 0;
  cameraSurface.angularSensibility = 3500;

  // Default
  scn.activeCamera = cameraOrbit;
  try { onActiveCameraChanged && onActiveCameraChanged(scn.activeCamera); } catch (e) {}

  // ------------------------------------------------------------
  // Modes: orbit / fly / surface
  // ------------------------------------------------------------
  const mode = { value: "orbit" };

  let orbitLockedBodyName = null;

  function lockOrbitToBody(body) {
    if (!body || !body.farMesh) return;
    orbitLockedBodyName = body.def?.name || body.farMesh.name;
    try {
      cameraOrbit.lockedTarget = body.farMesh;
      cameraOrbit.setTarget(body.farMesh);
    } catch (e) {
      cameraOrbit.setTarget(body.farMesh.getAbsolutePosition());
    }
    const r = body.def?.radius || 10;
    cameraOrbit.lowerRadiusLimit = Math.max(8, r * 1.25);
    cameraOrbit.upperRadiusLimit = Math.max(cameraOrbit.lowerRadiusLimit * 2, r * 80);
    cameraOrbit.radius = Math.max(cameraOrbit.lowerRadiusLimit * 1.35, r * 6);
  }

  function unlockOrbit() {
    orbitLockedBodyName = null;
    try { cameraOrbit.lockedTarget = null; } catch (e) {}
  }

  function updateModeButtons() {
    const is = (m) => mode.value === m;
    if (ui?.camOrbitBtn) ui.camOrbitBtn.classList.toggle("active", is("orbit"));
    if (ui?.camFlyBtn) ui.camFlyBtn.classList.toggle("active", is("fly"));
    if (ui?.camSurfaceBtn) ui.camSurfaceBtn.classList.toggle("active", is("surface"));

    // compat visual: elimina primary si existe
    if (ui?.camOrbitBtn) ui.camOrbitBtn.classList.toggle("primary", false);
    if (ui?.camFlyBtn) ui.camFlyBtn.classList.toggle("primary", false);
    if (ui?.camSurfaceBtn) ui.camSurfaceBtn.classList.toggle("primary", false);
  }

  function setMode(m, { onExitSurface } = {}) {
    mode.value = m;
    if (ui?.modePill) ui.modePill.textContent = (m === "orbit") ? "Órbita" : (m === "fly" ? "Vuelo" : "Superficie");
    updateModeButtons();

    // Fog/"aire" solo en superficie (se ajusta por planeta en el loop)
    if (m !== "surface") {
      try { scn.fogMode = BABYLON.Scene.FOGMODE_NONE; } catch (e) {}
    }

    // Si salimos de Superficie, dejamos que main.js haga el detach real del playerRoot
    if (m !== "surface") {
      try { onExitSurface && onExitSurface(); } catch (e) {}
    }

    // detach all
    try { cameraOrbit.detachControl(canvas); } catch (e) {}
    try { cameraFly.detachControl(canvas); } catch (e) {}
    try { cameraSurface.detachControl(canvas); } catch (e) {}

    if (m === "orbit") {
      // al volver a órbita: suelta pointer-lock
      if (document.pointerLockElement === canvas) {
        try { document.exitPointerLock?.(); } catch (e) {}
      }
      scn.activeCamera = cameraOrbit;
      cameraOrbit.attachControl(canvas, true, false, 2);
      try {
        const p = cameraOrbit.inputs && cameraOrbit.inputs.attached && cameraOrbit.inputs.attached.pointers;
        if (p) {
          p.panningMouseButton = 2;
          if (Array.isArray(p.buttons)) p.buttons = [0, 2];
        }
      } catch (e) {}
    } else if (m === "fly") {
      unlockOrbit();
      scn.activeCamera = cameraFly;
      cameraFly.attachControl(canvas, true);
    } else {
      unlockOrbit();
      scn.activeCamera = cameraSurface;
      cameraSurface.attachControl(canvas, true);
    }

    // Notificar para que main re-haga PP atmósfera por cámara activa
    try { onActiveCameraChanged && onActiveCameraChanged(scn.activeCamera); } catch (e) {}
  }

  // Pointer lock: click en canvas para capturar ratón en Vuelo/Superficie
  scn.onPointerDown = () => {
    if (mode.value !== "fly" && mode.value !== "surface") return;
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  };
  document.addEventListener("pointerlockchange", () => {});

  // Botones de modo (surface se maneja en main porque necesita checks + approach)
  if (ui?.camOrbitBtn) ui.camOrbitBtn.addEventListener("click", () => setMode("orbit"));
  if (ui?.camFlyBtn) ui.camFlyBtn.addEventListener("click", () => setMode("fly"));

  // Estado inicial
  updateModeButtons();

  return {
    cameraOrbit,
    cameraFly,
    cameraSurface,
    playerRoot,
    mode,
    setMode,
    lockOrbitToBody,
    unlockOrbit,
    getOrbitLockedBodyName: () => orbitLockedBodyName,
  };
}