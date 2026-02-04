// scene/orbits.js
// Paso 5: extraer actualización de órbitas/rotación (planetas + lunas)

export function createOrbitSystem({ bodies, moonOrbitNodes, uiState }) {
  function updateOrbits(dt) {
    if (!uiState || uiState.timeScale <= 0) return;
    const ts = uiState.timeScale;

    // Planets around sun
    for (const [, b] of bodies.entries()) {
      if (!b || !b.def) continue;
      if (b.def.kind !== "planet") continue;
      if (!b.orbitNode || !b.farMesh) continue;

      const sysS = b.def._sysSpeed || 1;
      b.orbitAngle += (b.def.orbitSpeed * sysS) * dt * ts;
      b.orbitNode.rotation.y = b.orbitAngle;

      // órbita excéntrica
      const e = b.def.orbitEcc || 0;
      if (e > 0) {
        const a = b.def.orbitR;
        const th = b.orbitAngle;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(th));
        b.farMesh.position.set(r, 0, 0);
        if (b.ocean) {
          // Si el océano es hijo del land (JSON), su posición local debe ser (0,0,0)
          if (b.ocean.parent === b.farMesh) b.ocean.position.set(0, 0, 0);
          else b.ocean.position.set(r, 0, 0);
        }
      } else {
        b.farMesh.position.set(b.def.orbitR, 0, 0);
        if (b.ocean) {
          if (b.ocean.parent === b.farMesh) b.ocean.position.set(0, 0, 0);
          else b.ocean.position.set(b.def.orbitR, 0, 0);
        }
      }

      // self-rotation (visual)
      b.farMesh.rotation.y += (b.def.rotSpeed || 0.01) * dt * ts;
      if (b.ring) b.ring.rotation.z += 0.3 * dt * ts;
    }

    // Moons around their parent planet
    for (const [moonId, moonOrbitNode] of moonOrbitNodes.entries()) {
      const m = bodies.get(moonId);
      if (!m || !m.def || !m.farMesh) continue;

      const sysSm = m.def._sysSpeed || 1;
      m.orbitAngle += (m.def.orbitSpeed * sysSm) * dt * ts;
      moonOrbitNode.rotation.y = m.orbitAngle;

      // órbita excéntrica opcional
      const me = m.def.orbitEcc || 0;
      if (me > 0) {
        const a = m.def.orbitR;
        const th = m.orbitAngle;
        const r = (a * (1 - me * me)) / (1 + me * Math.cos(th));
        m.farMesh.position.set(r, 0, 0);
        if (m.ocean) {
          if (m.ocean.parent === m.farMesh) m.ocean.position.set(0, 0, 0);
          else m.ocean.position.set(r, 0, 0);
        }
      } else {
        m.farMesh.position.set(m.def.orbitR, 0, 0);
        if (m.ocean) {
          if (m.ocean.parent === m.farMesh) m.ocean.position.set(0, 0, 0);
          else m.ocean.position.set(m.def.orbitR, 0, 0);
        }
      }

      // spin
      m.farMesh.rotation.y += (m.def.rotSpeed || 0.01) * dt * ts;
    }
  }

  // Orbit update barato para TODOS usando tiempo absoluto
  // (lo dejamos por si quieres alternar a "absolute time" sin acumulación)
  function updateAllOrbitsAbsolute(nowSec) {
    if (!uiState) return;
    const t = nowSec * (uiState.timeScale || 0);

    for (const [, b] of bodies.entries()) {
      if (!b || !b.def) continue;
      const def = b.def;

      if (def.kind === "sun") {
        if (b.farMesh) b.farMesh.rotation.y = t * (def.rotSpeed || 0.02);
        continue;
      }

      if (b.orbitNode) {
        const ang = t * (def.orbitSpeed || 0.001);
        b.orbitNode.rotation.y = ang;
      }

      if (b.farMesh) {
        b.farMesh.rotation.y = t * (def.rotSpeed || 0.01);
      }
    }
  }

  return { updateOrbits, updateAllOrbitsAbsolute };
}