/* APEX Formula 26 - Melbourne procedural vegetation experiment.
 * Opt in using ?trees3d=1. Mainline render path remains untouched by default.
 * Works with APEX's native camera-space WebGL2 primitives; no Three.js dependency.
 */
(function () {
  'use strict';
  const query = new URLSearchParams(window.location.search);
  const enabled = query.get('trees3d') === '1';
  const stats = { drawn: 0, faces: 0, species: { deciduous: 0, fir: 0, palm: 0 } };
  window.apexTrees3dTrialEnabled = enabled;
  window.apexTrees3dTrialInfo = function () {
    return {
      enabled, circuit: '01-australia', maxDistanceM: 1100, lodPolicy: 'The same 3D crown and silhouette from near to far, up to engine culling',
      mobile: 'Original tree rendering retained on mobile',
      renderedSinceLoad: stats.drawn, facesSubmittedSinceLoad: stats.faces,
      species: Object.assign({}, stats.species),
      profilePhase: 1, profileCatalog: {deciduous:5,fir:4,palm:3},
      note: 'Counts are accumulated draw submissions, not unique trees or FPS. Compare APEX diagnostics on equal laps.'
    };
  };
  if (!enabled) return;

  const TAU = Math.PI * 2;
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const mix = (a, b, t) => a + (b - a) * t;

  // Phase 1: data only; later phases will apply these profiles to geometry.
  const TREE_PROFILES = Object.freeze({"deciduous":[{"name":"round-lush","height":1,"width":1.02,"trunk":1.1,"foliage":1.08,"density":1.16,"crownLift":0,"leanX":0,"leanZ":0},{"name":"tall-open","height":1.16,"width":0.9,"trunk":0.94,"foliage":0.94,"density":0.88,"crownLift":0.08,"leanX":0.04,"leanZ":-0.03},{"name":"wide-old","height":0.96,"width":1.18,"trunk":1.26,"foliage":1.02,"density":1.02,"crownLift":-0.01,"leanX":-0.04,"leanZ":0.02},{"name":"columnar-dense","height":1.11,"width":0.76,"trunk":0.9,"foliage":0.9,"density":1.14,"crownLift":0.1,"leanX":0.02,"leanZ":0.04},{"name":"sparse-leaning","height":1.03,"width":1,"trunk":0.98,"foliage":0.82,"density":0.76,"crownLift":0.03,"leanX":-0.09,"leanZ":0.06}],"fir":[{"name":"fir-classic","height":1.02,"width":1,"trunk":1,"foliage":1,"density":1,"crownLift":0,"leanX":0,"leanZ":0,"tiers":[0.68,0.56,0.44,0.28]},{"name":"fir-slender","height":1.16,"width":0.84,"trunk":0.92,"foliage":0.92,"density":0.95,"crownLift":0,"leanX":0.03,"leanZ":-0.02,"tiers":[0.56,0.47,0.36,0.22]},{"name":"fir-broad","height":0.96,"width":1.17,"trunk":1.1,"foliage":1.08,"density":1.07,"crownLift":0,"leanX":-0.03,"leanZ":0.02,"tiers":[0.8,0.64,0.5,0.34]},{"name":"fir-young","height":0.86,"width":0.72,"trunk":0.9,"foliage":0.93,"density":0.94,"crownLift":0,"leanX":0.01,"leanZ":0.01,"tiers":[0.46,0.36,0.28,0.18]}],"palm":[{"name":"palm-tall","height":1.12,"width":0.92,"trunk":0.92,"foliage":1,"density":1,"crownLift":0,"leanX":0.05,"leanZ":-0.03,"frondLength":1.02,"frondDrop":0,"frondCount":8},{"name":"palm-wide","height":0.98,"width":1.08,"trunk":1.02,"foliage":1.04,"density":1.06,"crownLift":0,"leanX":-0.03,"leanZ":0.04,"frondLength":1.15,"frondDrop":0.04,"frondCount":8},{"name":"palm-compact","height":0.9,"width":0.84,"trunk":1.12,"foliage":0.97,"density":0.96,"crownLift":0,"leanX":0.02,"leanZ":0.01,"frondLength":0.86,"frondDrop":-0.02,"frondCount":7}]});
  function chooseProfile(species, seed) {
    const list=TREE_PROFILES[species]||TREE_PROFILES.deciduous;
    let bits=Math.imul((seed>>>0)^0x9e3779b9,0x85ebca6b)>>>0;
    bits^=bits>>>13;bits=Math.imul(bits,0xc2b2ae35)>>>0;bits^=bits>>>16;bits>>>=0;
    const base=list[bits%list.length];
    const a=(bits&255)/255,b=((bits>>>8)&255)/255,d=((bits>>>16)&255)/255;
    return Object.freeze({...base,
      height:base.height*(.95+.12*a),width:base.width*(.94+.14*b),
      trunk:base.trunk*(.92+.18*d),foliage:base.foliage*(.94+.12*d),
      density:base.density*(.90+.18*b),leanX:base.leanX+(a-.5)*.03,
      leanZ:base.leanZ+(b-.5)*.03
    });
  }

  function makeTreeTemplate(species, seed, profileSeed = seed) {
    // Stable jitter avoids flickering or changing shape when cameras turn.
    let s = (seed >>> 0) || 1;
    const rand = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    const seedAngle = rand() * TAU;
    const leaves = [];
    if (species === 'deciduous') {
      const centers = [
        [0, 0, .83, .35, .27], [-.28, -.12, .67, .31, .24],
        [.28, -.09, .68, .32, .26], [-.12, .27, .77, .30, .26],
        [.17, .23, .76, .29, .26], [-.18, -.19, .91, .23, .19],
        [.18, -.11, .94, .23, .19]
      ];
      // Every LOD uses all the same crowns and the same stable geometry anchors.
      const count = centers.length;
      for (let j = 0; j < count; j++) {
        const c = centers[j], a = seedAngle + j * .71;
        leaves.push({
          x: c[0] + (rand() - .5) * .065, z: c[1] + (rand() - .5) * .065,
          y: c[2] + (rand() - .5) * .035,
          rx: c[3] * (.91 + rand() * .16), rz: c[3] * (.85 + rand() * .24),
          ry: c[4] * (.91 + rand() * .18), rotation: a,
          tint: Math.round((rand() - .5) * 22)
        });
      }
    }
    return { rotation: seedAngle, leaves, profile:chooseProfile(species,profileSeed) };
  }
  const meshCache = new Map();
  function templateFor(species, seed) {
    // 384 is divisible by 24, preserving the existing crown seed for any
    // colliding identity. Bounded, deterministic cache across all three species.
    const identity=(seed>>>0)%384,key=species+':'+identity;
    let t=meshCache.get(key);
    if (!t) { t=makeTreeTemplate(species,identity%24,identity); meshCache.set(key,t); }
    return t;
  }

  function drawTube(c, from, to, baseRadius, tipRadius, tint, sides) {
    const { P, quad, pitch } = c;
    const offset = c.rotation || 0;
    for (let k = 0; k < sides; k++) {
      const a = offset + k * TAU / sides, b = offset + (k + 1) * TAU / sides;
      const d0x = Math.cos(a), d0z = Math.sin(a), d1x = Math.cos(b), d1z = Math.sin(b);
      quad(
        P(from.x + baseRadius * d0x, from.z + baseRadius * d0z, from.y),
        P(from.x + baseRadius * d1x, from.z + baseRadius * d1z, from.y),
        P(to.x + tipRadius * d1x, to.z + tipRadius * d1z, to.y),
        P(to.x + tipRadius * d0x, to.z + tipRadius * d0z, to.y),
        pitch, c.shade(tint, (k % 3 - 1) * 10), .60, -.006
      );
      stats.faces += 2;
    }
  }

  function drawLeafCluster(c, cx, cz, cy, rx, rz, ry, rotation, color) {
    const { P, poly, pitch } = c, N = 4;
    // Eight triangular facets around two poles, true volume on all sides.
    const top = P(cx + rx * .10, cz - rz * .11, cy + ry);
    const bottom = P(cx - rx * .07, cz + rz * .06, cy - ry * .86);
    for (let k = 0; k < N; k++) {
      const a = rotation + k * TAU / N, b = rotation + (k + 1) * TAU / N;
      const A = P(cx + rx * Math.cos(a), cz + rz * Math.sin(a), cy + .08 * ry * Math.sin(3*a));
      const B = P(cx + rx * Math.cos(b), cz + rz * Math.sin(b), cy + .08 * ry * Math.sin(3*b));
      poly([top, A, B], pitch, c.shade(color, (k % 2 ? 8 : -6)), .60, -.008);
      poly([bottom, B, A], pitch, c.shade(color, (k % 2 ? -10 : -17)), .60, -.008);
      stats.faces += 2;
    }
  }

  function drawFir(c, height, width, trunkColor, foliage) {
    const trunkHeight = height * .85;
    drawTube(c, { x: 0, z: 0, y: 0 }, { x: 0, z: 0, y: trunkHeight },
      Math.max(.12, width * .047), Math.max(.045, width * .014), trunkColor, 5);
    // Keep all four tiers and their silhouette at every distance; simplify only side facets.
    const tiers = 4, sides = c.lod === 2 ? 4 : 6, P = c.P;
    for (let tier = 0; tier < tiers; tier++) {
      const base = height * (.16 + tier * .185);
      const top = height * Math.min(1.05, .64 + tier * .125);
      const r = width * (.62 - tier * .10);
      const rotation = c.rotation + tier * .19;
      for (let k = 0; k < sides; k++) {
        const a = rotation + TAU * k / sides, b = rotation + TAU * (k + 1) / sides;
        c.poly([
          P(r * Math.cos(a), r * Math.sin(a), base),
          P(r * Math.cos(b), r * Math.sin(b), base + height * .014),
          P(0, 0, top)
        ], c.pitch, c.shade(foliage, -15 + tier * 6 + (k % 3) * 6), .60, -.008);
        stats.faces++;
      }
    }
  }

  function drawPalm(c, height, width, trunkColor, foliage) {
    drawTube(c, { x: 0, z: 0, y: 0 },
      { x: width * .045, z: width * -.018, y: height * .73 },
      Math.max(.10, width * .043), Math.max(.07, width * .029), trunkColor, 6);
    // Frond positions must stay identical across LOD changes.
    const count = 8, P = c.P;
    for (let k = 0; k < count; k++) {
      const a = c.rotation + TAU * k / count;
      const dx = Math.cos(a), dz = Math.sin(a), nx = -dz, nz = dx;
      const len = width * (.73 + (k % 3) * .085), mid = width * .40;
      const center = P(0, 0, height * .75);
      const midPoint = P(mid * dx, mid * dz, height * .91);
      const tip = P(len * dx, len * dz, height * (.57 + .04 * (k % 2)));
      const leafL = P(mid * dx + nx * width * .125, mid * dz + nz * width * .125, height * .835);
      const leafR = P(mid * dx - nx * width * .125, mid * dz - nz * width * .125, height * .835);
      const col = c.shade(foliage, k % 2 ? 5 : -9);
      c.poly([center, leafL, midPoint], c.pitch, col, .60, -.008);
      c.poly([center, midPoint, leafR], c.pitch, c.shade(col, -10), .60, -.008);
      c.poly([leafL, tip, midPoint], c.pitch, col, .60, -.009);
      c.poly([leafR, midPoint, tip], c.pitch, c.shade(col, 10), .60, -.009);
      stats.faces += 4;
    }
  }

  window.apexTrees3dRender = function (c) {
    // No 110 m switch back to the unrelated legacy silhouette: the engine's
    // existing visibility culling and LOD3 rejection determine when a tree disappears.
    if (!c || c.circuitId !== '01-australia' || c.mobile || c.lod > 2 ||
        !Number.isFinite(c.depth) || c.depth < .6) return false;
    const it = c.it, species = it.treeVariant || it.variant || 'deciduous';
    const kind = species === 'fir' ? 'fir' : species === 'palm' ? 'palm' : 'deciduous';
    const seed = c.hash(String(it.sourceId || it.name || 'tree') + '|' + kind) >>> 0;
    const detail = c.lod, t = templateFor(kind, seed);
    c.treeProfile = t.profile; // metadata for phases 2-4, no visual change
    const width = Math.max(1, Number(it.width) || 5) * (.89 + (seed & 255) / 255 * .28);
    const height = Math.max(3, Number(it.height) || 12) * (.92 + ((seed >>> 8) & 255) / 255 * .17);
    const trunk = kind === 'palm' ? '#745638' : '#59432f';
    const foliage = it.foliage || (kind === 'fir' ? '#285f38' : '#4b8447');
    c.rotation = t.rotation;
    if (kind === 'fir') drawFir(c, height, width, trunk, foliage);
    else if (kind === 'palm') drawPalm(c, height, width, trunk, foliage);
    else {
      const trunkH = height * .56;
      drawTube(c, { x: 0, z: 0, y: 0 }, { x: 0, z: 0, y: trunkH },
        Math.max(.13, width * .050), Math.max(.085, width * .028), trunk, detail === 2 ? 4 : 6);
      if (detail === 0) {
        for (let j = 1; j < 5; j++) {
          const leaf = t.leaves[j];
          drawTube(c, { x: 0, z: 0, y: trunkH * .68 },
            { x: leaf.x * width * .65, z: leaf.z * width * .65, y: leaf.y * height * .88 },
            Math.max(.055, width * .018), Math.max(.027, width * .008), trunk, 4);
        }
      }
      for (const leaf of t.leaves) {
        const color = c.shade(foliage, leaf.tint - 9);
        drawLeafCluster(c, leaf.x * width, leaf.z * width, leaf.y * height,
          leaf.rx * width, leaf.rz * width, leaf.ry * height,
          leaf.rotation, color);
      }
    }
    stats.drawn++;
    stats.species[kind]++;
    return true;
  };
})();
