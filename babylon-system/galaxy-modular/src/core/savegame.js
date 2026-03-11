// src/core/savegame.js
// Guarda/recupera estado del viaje en localStorage:
// - floating origin offset
// - posición local de cámara
// - orientación de cámara
// - estado de vuelo del modo K (rumbo, vista libre, velocidad, gyro)
// - NO guarda tiempo orbital: el universo siempre sigue tiempo real

const KEY = "gm14_save_v2";

export function saveState({ floating, camera, camCtrl }) {
  try {
    const off = floating?.originOffset || { x: 0, y: 0, z: 0 };
    const p = camera?.position || { x: 0, y: 0, z: 0 };

    const q = camera?.rotationQuaternion || null;
    const r = camera?.rotation || null;

    const cameraRotQ = q ? { x: q.x, y: q.y, z: q.z, w: q.w } : null;
    const cameraRotE = (!q && r) ? { x: r.x, y: r.y, z: r.z } : null;
    const flightState = camCtrl?.serializeState?.() || null;

    localStorage.setItem(KEY, JSON.stringify({
      v: 4,
      savedAt: Date.now(),
      originOffset: { x: off.x, y: off.y, z: off.z },
      cameraLocal: { x: p.x, y: p.y, z: p.z },
      cameraRotQ,
      cameraRotE,
      flightState,
    }));
    return true;
  } catch (e) {
    console.warn('Save failed:', e);
    return false;
  }
}

export function loadState() {
  try {
    const keys = [KEY, 'gm13_save_v1'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const s = JSON.parse(raw);
      if (!s) continue;
      if (s.v !== 1 && s.v !== 2 && s.v !== 3 && s.v !== 4) continue;
      return s;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem('gm13_save_v1');
  } catch {}
}

export function applyLoadedState({ state, worldRoot, floating, camera, camCtrl }) {
  if (!state) return false;

  const S = new BABYLON.Vector3(
    state.originOffset?.x || 0,
    state.originOffset?.y || 0,
    state.originOffset?.z || 0
  );

  const kids = worldRoot?.getChildren?.() || [];
  for (let i = 0; i < kids.length; i++) {
    const n = kids[i];
    if (n?.position?.subtractInPlace) n.position.subtractInPlace(S);
  }

  if (floating?.originOffset?.copyFrom) floating.originOffset.copyFrom(S);

  if (camera?.position?.set) {
    const c = state.cameraLocal || { x: 0, y: 0, z: 0 };
    camera.position.set(c.x || 0, c.y || 0, c.z || 0);
  }

  const hasFlightState = !!(state.flightState && typeof state.flightState === 'object');
  const needsLegacyCameraRot = !hasFlightState || state.flightState?.mode !== 'ship';

  if (needsLegacyCameraRot && camera) {
    if (state.cameraRotQ) {
      if (!camera.rotationQuaternion) {
        camera.rotationQuaternion = new BABYLON.Quaternion(
          state.cameraRotQ.x, state.cameraRotQ.y, state.cameraRotQ.z, state.cameraRotQ.w
        );
      } else {
        camera.rotationQuaternion.set(
          state.cameraRotQ.x, state.cameraRotQ.y, state.cameraRotQ.z, state.cameraRotQ.w
        );
      }
    } else if (state.cameraRotE && camera.rotation) {
      camera.rotation.set(state.cameraRotE.x, state.cameraRotE.y, state.cameraRotE.z);
    }
  }

  if (hasFlightState) {
    try { camCtrl?.applySavedState?.(state.flightState); } catch (e) { console.warn('Load flight state failed:', e); }
  }

  try { camera?.computeWorldMatrix?.(true); } catch (_) {}
  return true;
}