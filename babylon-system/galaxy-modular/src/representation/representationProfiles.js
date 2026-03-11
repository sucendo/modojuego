// representation/representationProfiles.js
// Default pixel-based representation profiles per entity kind.
//
// States:
// - 'none'
// - 'dot'
// - 'sphere_low'
// - 'sphere_high'
//
// NOTE: thresholds are intentionally conservative; tune later.

export function getDefaultRepresentationProfiles() {
  return {
    star: {
      // Stars are always at least a dot, unless you explicitly change logic.
      // Use higher thresholds because stars are usually very bright.
      stateByDiamPx: [
        { max: 2.0, state: 'dot' },
        { max: 34.0, state: 'sphere_low' },
        { max: Infinity, state: 'sphere_high' },
      ],
      dotMinPx: 2.0,
      sphereLowSegments: 14,
      sphereHighSegments: 24,
      sphereDisableLighting: true,
      dotDisableLighting: true,
      lit: false,
    },

    planet: {
      stateByDiamPx: [
        // Always at least a dot (helps targeting/labels at realistic scales)
        { max: 0.8, state: 'dot' },
        { max: 6.0, state: 'dot' },
        // Switch to high rep a bit earlier so the planet-editor procedural mesh
        // is used sooner when you are actually close.
        { max: 14.0, state: 'sphere_low' },
        { max: Infinity, state: 'sphere_high' },
      ],
      dotMinPx: 3.0,
      sphereLowSegments: 14,
      sphereHighSegments: 22,
      // Max subdivisions to allow when upgrading a planet to planet-editor procedural mesh.
      // Set to 99 to match the editor's max (be aware it's heavy).
      planetEditorMaxSubdivisions: 99,
      // Many presets are saved with low subdivisions for editor responsiveness.
      // In-sim we want a higher baseline so the first procedural build already looks "editor-like".
      // (Still refined further based on screen size.)
      planetEditorMinSubdivisions: 32,
      // Auto subdivisions (distance + size): controlled by screen-space diameter (px)
      planetEditorAutoSubdiv: true,
      // When the planet becomes large enough on screen, jump to MAX once and lock.
      // Lower values help avoid "never reaching" max on small physical scales.
      planetEditorLockMaxAtPx: 520,
      // Map pixel diameter to subdivision levels.
      planetEditorSubdivPxMin: 18,     // <=18px: keep low-ish
      planetEditorSubdivPxMax: 900,    // >=900px: can reach 99
      planetEditorSubdivLevels: [18, 24, 32, 42, 56, 72, 90, 99],
      planetEditorRefineCooldownMs: 2200,
      planetEditorRefineMinDelta: 10,  // only regen if +10 (or more)
      sphereDisableLighting: false,
      dotDisableLighting: true,
      lit: true,
    },

    moon: {
      stateByDiamPx: [
        { max: 1.0, state: 'dot' },
        { max: 5.0, state: 'dot' },
        { max: 10.0, state: 'sphere_low' },
        { max: Infinity, state: 'sphere_high' },
      ],
      dotMinPx: 3.0,
      sphereLowSegments: 10,
      sphereHighSegments: 16,
	    planetEditorMaxSubdivisions: 99,
      // Moons are physically tiny at real scale, so pixel-based refinement may stay too low.
      // Force a higher baseline to avoid faceting (e.g., Europa/Ceres).
      planetEditorMinSubdivisions: 56,
      planetEditorAutoSubdiv: true,
      planetEditorLockMaxAtPx: 420,
      planetEditorSubdivPxMin: 16,
      planetEditorSubdivPxMax: 720,
      planetEditorSubdivLevels: [18, 24, 32, 42, 56, 72, 90, 99],
      planetEditorRefineCooldownMs: 2200,
      planetEditorRefineMinDelta: 10,
      sphereDisableLighting: false,
      dotDisableLighting: true,
      lit: true,
    },

    asteroid: {
      stateByDiamPx: [
        // Asteroids are tiny at real scale; switch to procedural high earlier if a preset exists.
        { max: 3.0, state: 'dot' },
        { max: 9.0, state: 'sphere_low' },
        { max: Infinity, state: 'sphere_high' },
      ],
      dotMinPx: 3.0,
      sphereLowSegments: 10,
      sphereHighSegments: 14,
      planetEditorMaxSubdivisions: 64,
      planetEditorMinSubdivisions: 24,
      planetEditorAutoSubdiv: true,
      planetEditorLockMaxAtPx: 180,
      planetEditorSubdivPxMin: 12,
      planetEditorSubdivPxMax: 420,
      planetEditorSubdivLevels: [12, 18, 24, 32, 42, 56, 64],
      planetEditorRefineCooldownMs: 1800,
      planetEditorRefineMinDelta: 8,
      sphereDisableLighting: false,
      dotDisableLighting: true,
      lit: true,
    },

    comet: {
      stateByDiamPx: [
        // Comets/cores benefit from an earlier high rep too.
        { max: 3.0, state: 'dot' },
        { max: 9.0, state: 'sphere_low' },
        { max: Infinity, state: 'sphere_high' },
      ],
      dotMinPx: 3.0,
      sphereLowSegments: 10,
      sphereHighSegments: 14,
      planetEditorMaxSubdivisions: 56,
      planetEditorMinSubdivisions: 20,
      planetEditorAutoSubdiv: true,
      planetEditorLockMaxAtPx: 160,
      planetEditorSubdivPxMin: 12,
      planetEditorSubdivPxMax: 360,
      planetEditorSubdivLevels: [12, 18, 24, 32, 42, 56],
      planetEditorRefineCooldownMs: 1800,
      planetEditorRefineMinDelta: 8,
      sphereDisableLighting: false,
      dotDisableLighting: true,
      lit: true,
    },

    artificialSatellite: {
      stateByDiamPx: [
        // Always at least a dot (helps targeting/labels at realistic scales)
        { max: 8.0, state: 'dot' },
        { max: 20.0, state: 'sphere_low' },
        { max: Infinity, state: 'sphere_high' },
      ],
      dotMinPx: 2.0,
      sphereLowSegments: 8,
      sphereHighSegments: 12,
      sphereDisableLighting: false,
      dotDisableLighting: true,
      lit: true,
    },
  };
}
