export function setupCamera(scene, canvas, opts = {}) {
  const camera = new BABYLON.UniversalCamera(
    "cam",
    new BABYLON.Vector3(0, 3, -18),
    scene
  );
  camera.attachControl(canvas, true);

  const BASE_SPEED = Number.isFinite(opts.baseSpeed) ? opts.baseSpeed : 100.0;
  const FAST_MULT = Number.isFinite(opts.fastMult) ? opts.fastMult : 20.0;

  camera.speed = BASE_SPEED;

  const LY_KM = 9.4607304725808e12;
  const SECONDS_PER_YEAR = 365.25 * 86400;
  const HOTKEY_COUNT = 10;
  const MAX_SPEED_STEP = 49; // 50 velocidades totales: 0..49
  const HOTKEY_STEPS = [0, 4, 8, 12, 16, 21, 27, 34, 41, 49];

  const tmpForward = new BABYLON.Vector3();

  const state = {
    mode: "mouse",
    isFast: false,
    ship: {
      unitsPerLy: Number.isFinite(opts.unitsPerLy) ? opts.unitsPerLy : 1_000_000,
      speedStep: 0,                 // 0..49 (magnitud)
      reverse: false,
      selectedHotkey: 0,            // 0..9 o null si estás entre hitos
      targetSpeedUps: 0,            // units/sec
      currentSpeedUps: 0,           // units/sec
      rotAccel: Number.isFinite(opts.shipRotAccel) ? opts.shipRotAccel : 2.15, // rad/s²
      rotDamping: Number.isFinite(opts.shipRotDamping) ? opts.shipRotDamping : 3.0,
      accelK: Number.isFinite(opts.shipAccelK) ? opts.shipAccelK : 3.5,
      rotVel: { pitch: 0, yaw: 0, roll: 0 },
      shipQuat: null,
      freeLookYaw: 0,
      freeLookPitch: 0,
      lookSensitivityMouse: Number.isFinite(opts.shipLookSensitivityMouse) ? opts.shipLookSensitivityMouse : 0.0032,
      lookSensitivityTouch: Number.isFinite(opts.shipLookSensitivityTouch) ? opts.shipLookSensitivityTouch : 0.0040,
      maxFreeLookPitch: Number.isFinite(opts.shipMaxFreeLookPitch) ? opts.shipMaxFreeLookPitch : (Math.PI * 0.495),
      gyroEnabled: true,
      gyroInitialized: false,
      gyroPermissionAsked: false,
      gyroBase: { alpha: 0, beta: 0, gamma: 0 },
      gyroInput: { pitch: 0, yaw: 0, roll: 0 },
      gyroGain: Number.isFinite(opts.shipGyroGain) ? opts.shipGyroGain : 1.8,
      gyroDeadZone: Number.isFinite(opts.shipGyroDeadZone) ? opts.shipGyroDeadZone : 0.03,
      gyroPitchLimit: Number.isFinite(opts.shipGyroPitchLimit) ? opts.shipGyroPitchLimit : (Math.PI / 3),
      gyroYawLimit: Number.isFinite(opts.shipGyroYawLimit) ? opts.shipGyroYawLimit : (Math.PI / 2),
      gyroRollLimit: Number.isFinite(opts.shipGyroRollLimit) ? opts.shipGyroRollLimit : (Math.PI / 2),
      speedAnchorsUps: []
    }
  };

  const keysDown = new Set();

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function wrapPi(rad) {
    let r = rad;
    while (r > Math.PI) r -= Math.PI * 2;
    while (r < -Math.PI) r += Math.PI * 2;
    return r;
  }

  function _anchorUpsForHotkey(index) {
    const uPerLy = Math.max(1, state.ship.unitsPerLy);

    const lyPerSecFromKmS = (kmS) => (kmS / LY_KM);
    const lyPerSecFromKmH = (kmH) => ((kmH / 3600) / LY_KM);

    if (index <= 0) return 0;

    // En orden creciente para que los 50 pasos intermedios
    // siempre aceleren al subir y frenen al bajar.
    if (index === 1) return lyPerSecFromKmH(40300) * uPerLy;   // Escape Tierra
    if (index === 2) return lyPerSecFromKmH(214200) * uPerLy;  // Escape Júpiter
    if (index === 3) return lyPerSecFromKmS(192) * uPerLy;     // Parker
    if (index === 4) return lyPerSecFromKmS(617.5) * uPerLy;   // Escape Sol

    const v5 = uPerLy / SECONDS_PER_YEAR; // ~1 ly/año
    const v9 = uPerLy / 3600;             // 1 ly/h

    if (index === 5) return v5;
    if (index >= 9) return v9;

    const steps = 4; // 5 -> 9
    const ratio = v9 / Math.max(1e-12, v5);
    const f = Math.pow(ratio, 1 / steps);
    return v5 * Math.pow(f, index - 5);
  }

  function _rebuildSpeedAnchors() {
    state.ship.speedAnchorsUps = Array.from({ length: HOTKEY_COUNT }, (_, i) => _anchorUpsForHotkey(i));
  }

  function _speedAbsForStep(step) {
    const absStep = clamp(Math.round(Math.abs(Number(step) || 0)), 0, MAX_SPEED_STEP);
    if (absStep <= 0) return 0;

    const anchors = state.ship.speedAnchorsUps;
    for (let i = 0; i < HOTKEY_STEPS.length - 1; i++) {
      const s0 = HOTKEY_STEPS[i];
      const s1 = HOTKEY_STEPS[i + 1];
      if (absStep < s0 || absStep > s1) continue;
      const v0 = anchors[i] || 0;
      const v1 = anchors[i + 1] || 0;
      if (s1 <= s0) return v1;
      const t = clamp((absStep - s0) / (s1 - s0), 0, 1);
      if (v0 <= 0 || v1 <= 0) return lerp(v0, v1, t);
      return v0 * Math.pow(v1 / v0, t);
    }
	return anchors[anchors.length - 1] || 0;
  }

  function _signedStep() {
    return state.ship.reverse ? -state.ship.speedStep : state.ship.speedStep;
  }

  function _stepToHotkeyIndex(step) {
    const absStep = clamp(Math.round(Math.abs(Number(step) || 0)), 0, MAX_SPEED_STEP);
    for (let i = 0; i < HOTKEY_STEPS.length; i++) {
      if (HOTKEY_STEPS[i] === absStep) return i;
    }
    return null;
  }

  function _syncTargetFromStep() {
    const absUps = _speedAbsForStep(state.ship.speedStep);
    const sign = (state.ship.reverse && state.ship.speedStep > 0) ? -1 : 1;
    state.ship.targetSpeedUps = sign * absUps;
  }

  function _ensureShipQuatFromCamera() {
    if (state.ship.shipQuat) return state.ship.shipQuat;
    if (camera.rotationQuaternion) {
      state.ship.shipQuat = camera.rotationQuaternion.clone();
    } else {
      state.ship.shipQuat = BABYLON.Quaternion.RotationYawPitchRoll(
        camera.rotation.y,
        camera.rotation.x,
        camera.rotation.z
      );
    }
    state.ship.shipQuat.normalize();
    return state.ship.shipQuat;
  }

  function _applyShipCameraOrientation() {
    const shipQ = _ensureShipQuatFromCamera();
    const lookQ = BABYLON.Quaternion.RotationYawPitchRoll(
      state.ship.freeLookYaw,
      state.ship.freeLookPitch,
      0
    );
    camera.rotationQuaternion = shipQ.multiply(lookQ);
    if (camera.rotation?.set) camera.rotation.set(0, 0, 0);	
  }

  function _ensureEulerFromQuat() {
    if (!camera.rotationQuaternion) return;
    const e = camera.rotationQuaternion.toEulerAngles();
    camera.rotation.copyFrom(e);
    camera.rotationQuaternion = null;
  }

  function _setFreeLook(yaw, pitch) {
    state.ship.freeLookYaw = wrapPi(yaw);
    state.ship.freeLookPitch = clamp(pitch, -state.ship.maxFreeLookPitch, state.ship.maxFreeLookPitch);
    if (state.mode === 'ship') _applyShipCameraOrientation();
  }

  function centerView() {
    _setFreeLook(0, 0);
  }

  function setUnitsPerLy(unitsPerLy) {
    if (Number.isFinite(unitsPerLy) && unitsPerLy > 0) {
      state.ship.unitsPerLy = unitsPerLy;
      _rebuildSpeedAnchors();
      _syncTargetFromStep();
    }
  }

  function setSpeedStep(step, options = {}) {
    const sign = (options.sign != null)
      ? (options.sign < 0 ? -1 : 1)
      : ((state.ship.reverse && state.ship.speedStep > 0) ? -1 : 1);
    const absStep = clamp(Math.round(Math.abs(Number(step) || 0)), 0, MAX_SPEED_STEP);

    state.ship.speedStep = absStep;
    state.ship.reverse = (sign < 0) && absStep > 0;
    state.ship.selectedHotkey = _stepToHotkeyIndex(absStep);
    _syncTargetFromStep();
    return _signedStep();
  }

  function setSpeedLevel(level) {
    const idx = clamp(Math.round(Number(level) || 0), 0, HOTKEY_COUNT - 1);
    state.ship.selectedHotkey = idx;
    state.ship.reverse = false;
    state.ship.speedStep = HOTKEY_STEPS[idx];
    _syncTargetFromStep();
    return _signedStep();
  }

  function stepSpeed(delta) {
    const absStep = clamp(state.ship.speedStep + Math.sign(delta || 0), 0, MAX_SPEED_STEP);
    return setSpeedStep(absStep, { sign: state.ship.reverse ? -1 : 1 });
  }

  function toggleReverse() {
    if (state.ship.speedStep <= 0) {
      state.ship.speedStep = 1;
      state.ship.reverse = true;
    } else {
      state.ship.reverse = !state.ship.reverse;
    }
    state.ship.selectedHotkey = _stepToHotkeyIndex(state.ship.speedStep);
    _syncTargetFromStep();
    return _signedStep();
  }

  function getMode() { return state.mode; }
  function getSpeedLevel() { return _signedStep(); }
  function getSelectedHotkey() { return state.ship.selectedHotkey; }

  function getSpeedMetrics() {
    const kmPerUnit = LY_KM / Math.max(1, state.ship.unitsPerLy);
    const currentUps = Number(state.ship.currentSpeedUps) || 0;
    const targetUps = Number(state.ship.targetSpeedUps) || 0;
    return {
      signedStep: _signedStep(),
      absStep: state.ship.speedStep,
      reverse: !!state.ship.reverse,
      hotkey: state.ship.selectedHotkey,
      currentKmS: currentUps * kmPerUnit,
      currentLyH: (currentUps * 3600) / Math.max(1, state.ship.unitsPerLy),
      targetKmS: targetUps * kmPerUnit,
      targetLyH: (targetUps * 3600) / Math.max(1, state.ship.unitsPerLy),
      hotkeySteps: HOTKEY_STEPS.slice(),
      maxStep: MAX_SPEED_STEP,
    };
  }

  function getHudState() {
    const metrics = getSpeedMetrics();
    let headingMarker = { xN: 0, yN: 0, visible: state.mode === 'ship' };
    if (state.mode === 'ship') {
      const vfov = camera.fov || 0.8;
      const aspect = scene?.getEngine?.()?.getRenderWidth?.() > 0
        ? (scene.getEngine().getRenderWidth() / Math.max(1, scene.getEngine().getRenderHeight()))
        : ((window.innerWidth || 1) / Math.max(1, (window.innerHeight || 1)));
      const hfov = 2 * Math.atan(Math.tan(vfov * 0.5) * aspect);
      const xN = -Math.tan(state.ship.freeLookYaw) / Math.max(1e-4, Math.tan(hfov * 0.5));
      const yN = Math.tan(state.ship.freeLookPitch) / Math.max(1e-4, Math.tan(vfov * 0.5));
      headingMarker = {
        xN: clamp(xN, -1.2, 1.2),
        yN: clamp(yN, -1.2, 1.2),
        visible: true,
      };
    }
    return {
      mode: state.mode,
      speed: metrics,
      headingMarker,
      gyroEnabled: !!state.ship.gyroEnabled,
      freeLookYaw: state.ship.freeLookYaw,
      freeLookPitch: state.ship.freeLookPitch,
    };
  }

  function serializeState() {
    return {
      mode: state.mode,
      ship: {
        speedStep: state.ship.speedStep,
        reverse: !!state.ship.reverse,
        selectedHotkey: state.ship.selectedHotkey,
        targetSpeedUps: state.ship.targetSpeedUps,
        currentSpeedUps: state.ship.currentSpeedUps,
        rotVel: {
          pitch: state.ship.rotVel.pitch,
          yaw: state.ship.rotVel.yaw,
          roll: state.ship.rotVel.roll,
        },
        shipQuat: state.ship.shipQuat ? {
          x: state.ship.shipQuat.x,
          y: state.ship.shipQuat.y,
          z: state.ship.shipQuat.z,
          w: state.ship.shipQuat.w,
        } : null,
        freeLookYaw: state.ship.freeLookYaw,
        freeLookPitch: state.ship.freeLookPitch,
        gyroEnabled: !!state.ship.gyroEnabled,
      }
    };
  }

  function applySavedState(saved) {
    if (!saved || typeof saved !== 'object') return false;

    const wantedMode = (saved.mode === 'ship') ? 'ship' : 'mouse';

    if (saved.ship && typeof saved.ship === 'object') {
      const ss = saved.ship;
      state.ship.speedStep = clamp(Math.round(Math.abs(Number(ss.speedStep) || 0)), 0, MAX_SPEED_STEP);
      state.ship.reverse = !!ss.reverse && state.ship.speedStep > 0;
      state.ship.selectedHotkey = Number.isInteger(ss.selectedHotkey) ? clamp(ss.selectedHotkey, 0, HOTKEY_COUNT - 1) : _stepToHotkeyIndex(state.ship.speedStep);
      state.ship.targetSpeedUps = Number.isFinite(ss.targetSpeedUps) ? ss.targetSpeedUps : 0;
      state.ship.currentSpeedUps = Number.isFinite(ss.currentSpeedUps) ? ss.currentSpeedUps : 0;
      state.ship.rotVel.pitch = Number.isFinite(ss.rotVel?.pitch) ? ss.rotVel.pitch : 0;
      state.ship.rotVel.yaw = Number.isFinite(ss.rotVel?.yaw) ? ss.rotVel.yaw : 0;
      state.ship.rotVel.roll = Number.isFinite(ss.rotVel?.roll) ? ss.rotVel.roll : 0;
      state.ship.freeLookYaw = Number.isFinite(ss.freeLookYaw) ? wrapPi(ss.freeLookYaw) : 0;
      state.ship.freeLookPitch = Number.isFinite(ss.freeLookPitch) ? clamp(ss.freeLookPitch, -state.ship.maxFreeLookPitch, state.ship.maxFreeLookPitch) : 0;
      state.ship.gyroEnabled = ss.gyroEnabled !== false;
      if (ss.shipQuat && Number.isFinite(ss.shipQuat.x) && Number.isFinite(ss.shipQuat.y) && Number.isFinite(ss.shipQuat.z) && Number.isFinite(ss.shipQuat.w)) {
        state.ship.shipQuat = new BABYLON.Quaternion(ss.shipQuat.x, ss.shipQuat.y, ss.shipQuat.z, ss.shipQuat.w);
        state.ship.shipQuat.normalize();
      }
      _syncTargetFromStep();
    }

    setMode(wantedMode, { fromLoad: true });

    if (state.mode === 'ship') {
      _applyShipCameraOrientation();
      try { camera.computeWorldMatrix(true); } catch (_) {}
    }

    return true;
  }

  function _shouldIgnoreKey(ev) {
    const t = ev?.target;
    const tag = t?.tagName ? String(t.tagName).toUpperCase() : "";
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || ev?.metaKey || ev?.ctrlKey || ev?.altKey;
  }

  function _resetMotionOnModeChange() {
    state.ship.rotVel.pitch = 0;
    state.ship.rotVel.yaw = 0;
    state.ship.rotVel.roll = 0;
    state.ship.gyroInput.pitch = 0;
    state.ship.gyroInput.yaw = 0;
    state.ship.gyroInput.roll = 0;
  }

  async function _ensureGyroPermission() {
    if (state.ship.gyroPermissionAsked) return true;
    state.ship.gyroPermissionAsked = true;
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const res = await DeviceOrientationEvent.requestPermission();
        return res === 'granted';
      }
    } catch (_) {
      return false;
    }
    return true;
  }

  function setGyroEnabled(on) {
    state.ship.gyroEnabled = !!on;
    if (state.ship.gyroEnabled) {
      _ensureGyroPermission().catch(() => {});
      resetGyroscope();
    }
    return state.ship.gyroEnabled;
  }

  function resetGyroscope() {
    state.ship.gyroInitialized = false;
    state.ship.gyroInput.pitch = 0;
    state.ship.gyroInput.yaw = 0;
    state.ship.gyroInput.roll = 0;
  }

  function setMode(mode, options = {}) {
    mode = (mode === "ship") ? "ship" : "mouse";
    if (mode === state.mode && !options.fromLoad) return;

    if (mode === "ship") {
      try { document.exitPointerLock?.(); } catch (_) {}
      camera.detachControl();
      _ensureShipQuatFromCamera();
      camera.speed = 0;
      _resetMotionOnModeChange();
      _syncTargetFromStep();
      _applyShipCameraOrientation();
      _ensureGyroPermission().catch(() => {});
    } else {
      // vuelve al modo clásico (inputs de Babylon)
      _ensureEulerFromQuat();
      camera.rotation.z = 0;
      if (camera.cameraDirection) camera.cameraDirection.set(0, 0, 0);
      if (camera.cameraRotation) camera.cameraRotation.set(0, 0, 0);
      camera.attachControl(canvas, true);
      state.isFast = keysDown.has("ShiftLeft") || keysDown.has("ShiftRight");
    }

    state.mode = mode;
    _syncUi();
  }

  function _onKeyDown(ev) {
    if (!ev || _shouldIgnoreKey(ev)) return;

    const code = ev.code || "";
    const key = (ev.key || "").toLowerCase();
    keysDown.add(code);

    if (key === 'm') {
      ev.preventDefault?.();
      setMode('mouse');
      return;
    }
    if (key === 'k') {
      ev.preventDefault?.();
      setMode('ship');
      return;
    }

    if (ev.key === 'Shift' && state.mode === 'mouse') {
      state.isFast = true;
    }

    if (state.mode === 'ship') {
      if (code === 'Backquote' || key === 'º' || key === 'ª') {
        ev.preventDefault?.();
        toggleReverse();
        return;
      }

      if (key === '+' || (key === '=' && ev.shiftKey) || code === 'NumpadAdd') {
        ev.preventDefault?.();
        stepSpeed(+1);
        return;
      }

      if (key === '-' || code === 'NumpadSubtract') {
        ev.preventDefault?.();
        stepSpeed(-1);
        return;
      }

      if (key.length === 1 && key >= '0' && key <= '9') {
        ev.preventDefault?.();
        setSpeedLevel(parseInt(key, 10));
		return;
      }

      if (key === 'x') {
        ev.preventDefault?.();
        setSpeedStep(0, { sign: 1 });
        return;
      }

      if (key === 'r') {
        ev.preventDefault?.();
        centerView();
        return;
      }

	  if (key === 'y') {
	    ev.preventDefault?.();
	    setGyroEnabled(!state.ship.gyroEnabled);
	    return;
	  }

      if (["KeyW", "KeyS", "KeyA", "KeyD", "KeyQ", "KeyE"].includes(code)) {
        ev.preventDefault?.();
      }
    }
  }

  function _onKeyUp(ev) {
    if (!ev || _shouldIgnoreKey(ev)) return;
    const code = ev.code || "";
    keysDown.delete(code);
    if (ev.key === 'Shift') state.isFast = false;
  }

  window.addEventListener('keydown', _onKeyDown, { passive: false });
  window.addEventListener('keyup', _onKeyUp, { passive: false });

  let lookDrag = null;

  function _pointerSensitivity(pointerType) {
    return pointerType === 'touch' ? state.ship.lookSensitivityTouch : state.ship.lookSensitivityMouse;
  }
  function _onPointerDown(ev) {
    if (state.mode === 'mouse') {
      if (ev.pointerType === 'mouse') canvas.requestPointerLock?.();
      return;
    }

    if (state.mode !== 'ship') return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;

    lookDrag = {
      id: ev.pointerId,
      x: ev.clientX,
      y: ev.clientY,
      pointerType: ev.pointerType || 'mouse',
    };
    try { canvas.setPointerCapture?.(ev.pointerId); } catch (_) {}
    ev.preventDefault?.();
  }

  function _onPointerMove(ev) {
    if (state.mode !== 'ship' || !lookDrag || ev.pointerId !== lookDrag.id) return;
    const dx = ev.clientX - lookDrag.x;
    const dy = ev.clientY - lookDrag.y;
    lookDrag.x = ev.clientX;
    lookDrag.y = ev.clientY;

    const sens = _pointerSensitivity(lookDrag.pointerType);
    _setFreeLook(
      state.ship.freeLookYaw - dx * sens,
      state.ship.freeLookPitch - dy * sens
    );
    ev.preventDefault?.();
  }

  function _onPointerUp(ev) {
    if (!lookDrag || ev.pointerId !== lookDrag.id) return;
    try { canvas.releasePointerCapture?.(ev.pointerId); } catch (_) {}
    lookDrag = null;
  }

  canvas.addEventListener('pointerdown', _onPointerDown, { passive: false });
  canvas.addEventListener('pointermove', _onPointerMove, { passive: false });
  canvas.addEventListener('pointerup', _onPointerUp, { passive: true });
  canvas.addEventListener('pointercancel', _onPointerUp, { passive: true });

  window.addEventListener('deviceorientation', (event) => {
    if (!state.ship.gyroEnabled) return;
    if (state.mode !== 'ship') return;

    const alpha = (event.alpha || 0) * Math.PI / 180;
    const beta = (event.beta || 0) * Math.PI / 180;
    const gamma = (event.gamma || 0) * Math.PI / 180;

    if (!state.ship.gyroInitialized) {
      state.ship.gyroBase.alpha = alpha;
      state.ship.gyroBase.beta = beta;
      state.ship.gyroBase.gamma = gamma;
      state.ship.gyroInitialized = true;
      return;
    }

    const angle = (
      Number(window.screen?.orientation?.angle)
      || Number(window.orientation)
      || 0
    );

    let dYaw = wrapPi(alpha - state.ship.gyroBase.alpha);
    let dPitch = wrapPi(beta - state.ship.gyroBase.beta);
    let dRoll = wrapPi(gamma - state.ship.gyroBase.gamma);

    if (angle === 90) {
      const prevPitch = dPitch;
      dPitch = -dRoll;
      dRoll = prevPitch;
    } else if (angle === -90 || angle === 270) {
      const prevPitch = dPitch;
      dPitch = dRoll;
      dRoll = -prevPitch;
    } else if (Math.abs(angle) === 180) {
      dPitch = -dPitch;
      dRoll = -dRoll;
      dYaw = -dYaw;
    }

    dPitch = clamp(dPitch, -state.ship.gyroPitchLimit, state.ship.gyroPitchLimit);
    dYaw = clamp(dYaw, -state.ship.gyroYawLimit, state.ship.gyroYawLimit);
    dRoll = clamp(dRoll, -state.ship.gyroRollLimit, state.ship.gyroRollLimit);

    const dead = state.ship.gyroDeadZone;
    const norm = (value, limit) => {
      const n = clamp(value / Math.max(1e-5, limit), -1, 1);
      return Math.abs(n) < dead ? 0 : n;
    };

    state.ship.gyroInput.pitch = norm(dPitch, state.ship.gyroPitchLimit);
    state.ship.gyroInput.yaw = norm(dYaw, state.ship.gyroYawLimit);
    state.ship.gyroInput.roll = norm(dRoll, state.ship.gyroRollLimit);
  }, { passive: true });

  scene.onDisposeObservable?.add(() => {
    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
    canvas.removeEventListener('pointerdown', _onPointerDown);
    canvas.removeEventListener('pointermove', _onPointerMove);
    canvas.removeEventListener('pointerup', _onPointerUp);
    canvas.removeEventListener('pointercancel', _onPointerUp);
  });

  function update(dtSec) {
    dtSec = Number(dtSec) || 0;
    if (dtSec <= 0) return;

    if (state.mode === 'mouse') {
      state.isFast = keysDown.has('ShiftLeft') || keysDown.has('ShiftRight');
      camera.speed = BASE_SPEED * (state.isFast ? FAST_MULT : 1.0);
      return;
    }

    camera.speed = 0;
    _ensureShipQuatFromCamera();

    const ship = state.ship;
    const rotAccel = ship.rotAccel;
    const gyroAccel = rotAccel * ship.gyroGain;

    const pitchInput = (keysDown.has('KeyW') ? -1 : 0) + (keysDown.has('KeyS') ? 1 : 0);
    const yawInput = (keysDown.has('KeyQ') ? -1 : 0) + (keysDown.has('KeyE') ? 1 : 0);
    const rollInput = (keysDown.has('KeyA') ? -1 : 0) + (keysDown.has('KeyD') ? 1 : 0);

    ship.rotVel.pitch += pitchInput * rotAccel * dtSec;
    ship.rotVel.yaw += yawInput * rotAccel * dtSec;
    ship.rotVel.roll += rollInput * rotAccel * dtSec;

    if (ship.gyroEnabled) {
      ship.rotVel.pitch += ship.gyroInput.pitch * gyroAccel * dtSec;
      ship.rotVel.yaw += ship.gyroInput.yaw * gyroAccel * dtSec;
      ship.rotVel.roll += ship.gyroInput.roll * gyroAccel * dtSec;
    }

    const damp = Math.exp(-ship.rotDamping * dtSec);
    ship.rotVel.pitch *= damp;
    ship.rotVel.yaw *= damp;
    ship.rotVel.roll *= damp;

    let q = ship.shipQuat || BABYLON.Quaternion.Identity();
    if (Math.abs(ship.rotVel.pitch) > 1e-7) {
      q = q.multiply(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, ship.rotVel.pitch * dtSec));
    }
    if (Math.abs(ship.rotVel.yaw) > 1e-7) {
      q = q.multiply(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, ship.rotVel.yaw * dtSec));
    }
    if (Math.abs(ship.rotVel.roll) > 1e-7) {
      q = q.multiply(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, ship.rotVel.roll * dtSec));
    }
    q.normalize();
    ship.shipQuat = q;

    const alpha = 1 - Math.exp(-ship.accelK * dtSec);
    ship.currentSpeedUps += (ship.targetSpeedUps - ship.currentSpeedUps) * alpha;

    if (Math.abs(ship.currentSpeedUps) > 1e-12) {
      const rotM = new BABYLON.Matrix();
      q.toRotationMatrix(rotM);
      BABYLON.Vector3.TransformNormalToRef(BABYLON.Axis.Z, rotM, tmpForward);
      tmpForward.normalize();
      camera.position.addInPlace(tmpForward.scale(ship.currentSpeedUps * dtSec));
    }

	_applyShipCameraOrientation();
    _syncUi();
  }

  let ui = null;

  function _ensureUi() {
    if (opts.enableModeUI === false) return;
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('camModePanel');
    if (existing) {
      ui = {
        panel: existing,
        btnMouse: document.getElementById('camModeMouse'),
        btnShip: document.getElementById('camModeShip'),
        speed: document.getElementById('camModeSpeed')
      };
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'camModePanel';
    panel.style.position = 'fixed';
    panel.style.right = '12px';
    panel.style.bottom = '12px';
    panel.style.zIndex = '9999';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '6px';
    panel.style.padding = '8px';
    panel.style.background = 'rgba(0,0,0,0.35)';
    panel.style.border = '1px solid rgba(255,255,255,0.15)';
    panel.style.borderRadius = '10px';
    panel.style.backdropFilter = 'blur(6px)';
    panel.style.fontFamily = 'system-ui, Arial';
    panel.style.userSelect = 'none';

    const btnMouse = document.createElement('button');
    btnMouse.id = 'camModeMouse';
    btnMouse.textContent = 'M · modo ratón';
    btnMouse.style.padding = '6px 10px';
    btnMouse.style.cursor = 'pointer';

    const btnShip = document.createElement('button');
    btnShip.id = 'camModeShip';
    btnShip.textContent = 'K · modo nave';
    btnShip.style.padding = '6px 10px';
    btnShip.style.cursor = 'pointer';

    const speed = document.createElement('div');
    speed.id = 'camModeSpeed';
    speed.textContent = 'Velocidad: 0';
    speed.style.fontSize = '12px';
    speed.style.opacity = '0.95';

    btnMouse.onclick = () => setMode('mouse');
    btnShip.onclick = () => setMode('ship');

    panel.appendChild(btnMouse);
    panel.appendChild(btnShip);
    panel.appendChild(speed);
    document.body.appendChild(panel);

    ui = { panel, btnMouse, btnShip, speed };
    _syncUi();
  }

  function _syncUi() {
    if (!ui) return;
    const isMouse = state.mode === 'mouse';
    ui.btnMouse.style.opacity = isMouse ? '1.0' : '0.6';
    ui.btnShip.style.opacity = isMouse ? '0.6' : '1.0';
    ui.btnMouse.style.outline = isMouse ? '2px solid rgba(255,255,255,0.35)' : 'none';
    ui.btnShip.style.outline = (!isMouse) ? '2px solid rgba(255,255,255,0.35)' : 'none';
    const spd = getSpeedMetrics();
    const dir = spd.reverse ? 'REV' : 'FWD';
    ui.speed.textContent = `Vel: ${spd.signedStep} · ${dir} · ${spd.currentKmS.toFixed(3)} km/s`;
  }

  _rebuildSpeedAnchors();
  _syncTargetFromStep();
  _ensureUi();

  const controller = {
    setMode,
    getMode,
    update,
    setSpeedLevel,
    getSpeedLevel,
    getSelectedHotkey,
    setSpeedStep,
    stepSpeed,
    toggleReverse,
    centerView,
    setGyroEnabled,
    getGyroEnabled: () => !!state.ship.gyroEnabled,
    resetGyroscope,
    getSpeedMetrics,
    getHudState,
    serializeState,
    applySavedState,
    setUnitsPerLy,
    _state: state
  };

  return { camera, BASE_SPEED, FAST_MULT, controller };
}