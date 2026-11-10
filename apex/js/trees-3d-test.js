/* APEX Formula 26 - Melbourne procedural vegetation experiment.
 * Opt in using ?trees3d=1. Mainline render path remains untouched by default.
 * Works with APEX's native camera-space WebGL2 primitives; no Three.js dependency.
 */
(function () {
  'use strict';
  const query = new URLSearchParams(window.location.search);
  const enabled = query.get('trees3d') === '1';
  const stats = { drawn: 0, faces: 0, species: { deciduous: 0, fir: 0, palm: 0 }, deciduousProfilesDrawn: {}, firProfilesDrawn: {}, palmProfilesDrawn: {} };
  window.apexTrees3dTrialEnabled = enabled;
  window.apexTrees3dTrialInfo = function () {
    return {
      enabled, circuit: '01-australia', maxDistanceM: 1100, lodPolicy: 'The same 3D crown and silhouette from near to far, up to engine culling',
      mobile: 'Original tree rendering retained on mobile',
      renderedSinceLoad: stats.drawn, facesSubmittedSinceLoad: stats.faces,
      species: Object.assign({}, stats.species),
      deciduousProfilesDrawn: Object.assign({}, stats.deciduousProfilesDrawn),
      firProfilesDrawn: Object.assign({}, stats.firProfilesDrawn),
      palmProfilesDrawn: Object.assign({}, stats.palmProfilesDrawn),
      profilePhase: 4, profileCatalog: {deciduous:5,fir:4,palm:3},
      note: 'Counts are accumulated draw submissions, not unique trees or FPS. Compare APEX diagnostics on equal laps.'
    };
  };
  if (!enabled) return;

  const TAU = Math.PI * 2;
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const mix = (a, b, t) => a + (b - a) * t;

  // Phase 1: data only; later phases will apply these profiles to geometry.
  const TREE_PROFILES = Object.freeze({"deciduous":[{"name":"round-lush","height":1,"width":1.02,"trunk":1.1,"foliage":1.08,"density":1.16,"crownLift":0,"leanX":0,"leanZ":0},{"name":"tall-open","height":1.16,"width":0.9,"trunk":0.94,"foliage":0.94,"density":0.88,"crownLift":0.08,"leanX":0.04,"leanZ":-0.03},{"name":"wide-old","height":0.96,"width":1.18,"trunk":1.26,"foliage":1.02,"density":1.02,"crownLift":-0.01,"leanX":-0.04,"leanZ":0.02},{"name":"columnar-dense","height":1.11,"width":0.76,"trunk":0.9,"foliage":0.9,"density":1.14,"crownLift":0.1,"leanX":0.02,"leanZ":0.04},{"name":"sparse-leaning","height":1.03,"width":1,"trunk":0.98,"foliage":0.82,"density":0.76,"crownLift":0.03,"leanX":-0.09,"leanZ":0.06}],"fir":[{"name":"fir-classic","height":1.02,"width":1,"trunk":1,"foliage":1,"density":1,"crownLift":0,"leanX":0,"leanZ":0,"tiers":[0.68,0.56,0.44,0.28]},{"name":"fir-slender","height":1.16,"width":0.84,"trunk":0.92,"foliage":0.92,"density":0.95,"crownLift":0,"leanX":0.03,"leanZ":-0.02,"tiers":[0.56,0.47,0.36,0.22]},{"name":"fir-broad","height":0.96,"width":1.17,"trunk":1.1,"foliage":1.08,"density":1.07,"crownLift":0,"leanX":-0.03,"leanZ":0.02,"tiers":[0.8,0.64,0.5,0.34]},{"name":"fir-young","height":0.86,"width":0.72,"trunk":0.9,"foliage":0.93,"density":0.94,"crownLift":0,"leanX":0.01,"leanZ":0.01,"tiers":[0.46,0.36,0.28,0.18]}],"palm":[{"name":"palm-tall","height":1.12,"width":0.92,"trunk":0.92,"foliage":1,"density":1,"crownLift":0,"leanX":0.05,"leanZ":-0.03,"frondLength":1.02,"frondDrop":0,"frondCount":8},{"name":"palm-wide","height":0.98,"width":1.08,"trunk":1.02,"foliage":1.04,"density":1.06,"crownLift":0,"leanX":-0.03,"leanZ":0.04,"frondLength":1.15,"frondDrop":0.04,"frondCount":8},{"name":"palm-compact","height":0.9,"width":0.84,"trunk":1.12,"foliage":0.97,"density":0.96,"crownLift":0,"leanX":0.02,"leanZ":0.01,"frondLength":0.86,"frondDrop":-0.02,"frondCount":7}]});

  // Different crown architectures; unchanged between LOD 0, 1 and 2.
  const DECIDUOUS_CROWN_LAYOUTS = Object.freeze({"round-lush":[[0,0,0.8,0.36,0.27],[-0.3,-0.13,0.68,0.32,0.24],[0.32,-0.1,0.7,0.33,0.25],[-0.14,0.3,0.77,0.3,0.25],[0.17,0.28,0.8,0.3,0.25],[-0.18,-0.23,0.92,0.23,0.19],[0.22,-0.19,0.93,0.23,0.18],[0,0.06,1,0.23,0.18]],"tall-open":[[0,0,0.94,0.24,0.22],[-0.18,-0.08,0.73,0.25,0.22],[0.2,-0.13,0.78,0.23,0.2],[-0.08,0.24,0.86,0.22,0.19],[0.17,0.2,0.92,0.2,0.18],[0,-0.04,1.1,0.17,0.14]],"wide-old":[[0,0,0.8,0.34,0.22],[-0.44,-0.11,0.65,0.35,0.22],[0.45,-0.1,0.67,0.36,0.23],[-0.29,0.25,0.79,0.31,0.22],[0.3,0.26,0.78,0.31,0.22],[-0.14,-0.26,0.87,0.23,0.18],[0.15,-0.2,0.88,0.23,0.18]],"columnar-dense":[[0,0,0.88,0.21,0.27],[-0.15,-0.09,0.69,0.21,0.23],[0.17,-0.08,0.71,0.21,0.22],[-0.1,0.14,0.83,0.21,0.24],[0.12,0.14,0.85,0.2,0.24],[-0.08,-0.15,0.99,0.17,0.19],[0.09,-0.09,1.03,0.17,0.19],[0,0.08,1.1,0.14,0.16]],"sparse-leaning":[[0,0,0.87,0.31,0.23],[-0.33,-0.15,0.69,0.25,0.18],[0.3,-0.13,0.74,0.24,0.17],[-0.17,0.3,0.87,0.21,0.17],[0.18,0.26,0.97,0.19,0.15]]});
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
      leanZ:base.leanZ+(b-.5)*.03,
      age:.78+.46*((bits>>>24)&255)/255
    });
  }

  function makeTreeTemplate(species, seed, profileSeed = seed) {
    // Stable jitter avoids flickering or changing shape when cameras turn.
    let s = (seed >>> 0) || 1;
    const rand = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    const seedAngle = rand() * TAU;
    const profile = chooseProfile(species, profileSeed);
    const leaves = [];
    if (species === 'deciduous') {
      // These layouts and density are evaluated once per cached identity.
      const centers = DECIDUOUS_CROWN_LAYOUTS[profile.name] || DECIDUOUS_CROWN_LAYOUTS['round-lush'];
      const count = centers.length;
      const fill = Math.min(1.13, Math.max(.80, Math.sqrt(profile.density)));
      for (let j = 0; j < count; j++) {
        const c = centers[j], a = seedAngle + j * .71;
        leaves.push({
          x: c[0] + (rand() - .5) * .065, z: c[1] + (rand() - .5) * .065,
          y: c[2] + (rand() - .5) * .035 + (profile.crownLift||0),
          rx: c[3] * fill * (.91 + rand() * .16), rz: c[3] * fill * (.85 + rand() * .24),
          ry: c[4] * fill * (.91 + rand() * .18), rotation: a,
          tint: Math.round((rand() - .5) * 22)
        });
      }
    }
    return { rotation: seedAngle, leaves, profile };
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

  // Phase 3: four stable conifer architectures. Every LOD uses identical
  // trunks and four whorls of foliage; no silhouette substitution at distance.
  // Width/height from SVG remain authoritative base dimensions.
  function drawFir(c, baseHeight, baseWidth, trunkColor, foliage, profile) {
    const height = baseHeight * profile.height;
    const width = baseWidth * profile.width;
    const leanX = (profile.leanX || 0) * width;
    const leanZ = (profile.leanZ || 0) * width;
    const trunkHeight = height * .86;
    const baseRadius = Math.max(.12, width * .047 * profile.trunk);
    const topRadius = Math.max(.045, width * .014 * profile.trunk);
    drawTube(c, { x: 0, z: 0, y: 0 },
      { x: leanX * .86, z: leanZ * .86, y: trunkHeight },
      baseRadius, topRadius, trunkColor, 5);

    const tiers = profile.tiers || [.68, .56, .44, .28];
    const P = c.P;
    // Six unchanged radial sectors across LOD 0/1/2 avoid shape popping.
    // More distant trees are still culled by the existing scene budget.
    const sides = 6;
    const density = Math.max(.91, Math.min(1.10, profile.density));
    const tint = Math.round((profile.foliage - 1) * 28);
    for (let tier = 0; tier < tiers.length; tier++) {
      const base = height * (.16 + tier * .185);
      const top = height * Math.min(1.05, .64 + tier * .125);
      const r = width * tiers[tier] * density;
      const rotation = c.rotation + tier * .19;
      const x0 = leanX * base / height, z0 = leanZ * base / height;
      const x1 = leanX * top / height, z1 = leanZ * top / height;
      for (let k = 0; k < sides; k++) {
        const a = rotation + TAU * k / sides;
        const b = rotation + TAU * (k + 1) / sides;
        c.poly([
          P(x0 + r * Math.cos(a), z0 + r * Math.sin(a), base),
          P(x0 + r * Math.cos(b), z0 + r * Math.sin(b), base + height * .014),
          P(x1, z1, top)
        ], c.pitch,
          c.shade(foliage, -15 + tier * 6 + (k % 3) * 6 + tint),
          .60, -.008);
        stats.faces++;
      }
    }
  }

  // Phase 4: three stable palm architectures. All LODs retain exactly the
  // same bent trunk and the same fronds to avoid any visible silhouette popping.
  function drawPalm(c, baseHeight, baseWidth, trunkColor, foliage, profile) {
    const height = baseHeight * profile.height;
    const width = baseWidth * profile.width;
    const curvatureX = (profile.leanX || 0) * width * 2.7;
    const curvatureZ = (profile.leanZ || 0) * width * 2.7;
    const trunkScale = profile.trunk;
    const center = {x: curvatureX, z: curvatureZ, y: height * .74};
    const elbow = {
      x: curvatureX * .27 + width * .012,
      z: curvatureZ * .23,
      y: height * .37
    };
    const rootRadius = Math.max(.10, width * .043 * trunkScale);
    const midRadius = Math.max(.075, width * .035 * trunkScale);
    const tipRadius = Math.max(.055, width * .028 * trunkScale);
    // Two connected tapered cylinders form a curved, genuinely 3D palm trunk.
    drawTube(c, {x:0,z:0,y:0}, elbow, rootRadius, midRadius, trunkColor, 6);
    drawTube(c, elbow, center, midRadius, tipRadius, trunkColor, 6);

    const count = profile.frondCount || 8;
    const length = profile.frondLength || 1;
    const drop = profile.frondDrop || 0;
    const density = Math.max(.91, Math.min(1.12, profile.density));
    const tint = Math.round((profile.foliage - 1) * 28);
    const P = c.P;
    for (let k = 0; k < count; k++) {
      const a = c.rotation + TAU * k / count;
      const dx = Math.cos(a), dz = Math.sin(a), nx = -dz, nz = dx;
      // Deterministic per-frond differences; not tied to camera, time or LOD.
      const variation = Math.sin((k + 1) * 2.17 + c.rotation) * .035;
      const len = width * (.73 + (k % 3) * .085) * length * (1 + variation);
      const mid = width * .40 * length;
      const midHeight = height * (.91 - drop * .27 + variation * .15);
      const tipHeight = height * (.57 - drop + .04 * (k % 2) - variation * .30);
      const leafHeight = height * (.835 - drop * .21);
      const spread = width * .125 * density;
      const crown = P(center.x, center.z, height * .75);
      const midPoint = P(center.x + mid * dx, center.z + mid * dz, midHeight);
      const tip = P(center.x + len * dx, center.z + len * dz, tipHeight);
      const leafL = P(center.x + mid * dx + nx * spread, center.z + mid * dz + nz * spread, leafHeight);
      const leafR = P(center.x + mid * dx - nx * spread, center.z + mid * dz - nz * spread, leafHeight);
      const col = c.shade(foliage, (k % 2 ? 5 : -9) + tint);
      c.poly([crown, leafL, midPoint], c.pitch, col, .60, -.008);
      c.poly([crown, midPoint, leafR], c.pitch, c.shade(col, -10), .60, -.008);
      c.poly([leafL, tip, midPoint], c.pitch, col, .60, -.009);
      c.poly([leafR, midPoint, tip], c.pitch, c.shade(col, 10), .60, -.009);
      stats.faces += 4;
    }
  }

  // Phase 2: deciduous only. Core clusters are never removed by LOD;
  // near LOD draws more secondary branches, not a different crown outline.
  function drawDeciduous(c,template,baseW,baseH,trunk,foliage,detail) {
    const pr=template.profile;
    const width=baseW*pr.width*Math.pow(pr.age,.78);
    const height=baseH*pr.height*pr.age;
    const trunkHeight=height*(.54+Math.min(.05,Math.max(-.03,(pr.crownLift||0)*.25)));
    const leanX=pr.leanX*width, leanZ=pr.leanZ*width;
    drawTube(c,{x:0,z:0,y:0},{x:leanX,z:leanZ,y:trunkHeight},
      Math.max(.13,width*.050*pr.trunk),
      Math.max(.075,width*.027*pr.trunk),
      trunk,detail===2?4:6);
    if(detail<=1) {
      const branchCount=detail===0?Math.min(4,template.leaves.length-1):Math.min(2,template.leaves.length-1);
      for(let j=1;j<=branchCount;j++){
        const leaf=template.leaves[j];
        drawTube(c,
          {x:leanX*.35,z:leanZ*.35,y:trunkHeight*.68},
          {x:leanX+leaf.x*width*.63,z:leanZ+leaf.z*width*.63,y:leaf.y*height*.90},
          Math.max(.047,width*.018*pr.trunk),
          Math.max(.025,width*.008*pr.trunk),
          trunk,detail===0?4:3);
      }
    }
    for(const leaf of template.leaves){
      const tint=pr.name==='sparse-leaning'?-4:pr.name==='round-lush'?2:0;
      const color=c.shade(foliage,leaf.tint-9+tint);
      drawLeafCluster(c,leanX+leaf.x*width,leanZ+leaf.z*width,leaf.y*height,
        leaf.rx*width,leaf.rz*width,leaf.ry*height,leaf.rotation,color);
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
    c.treeProfile = t.profile; // stable identity shared by all three tree families
    const width = Math.max(1, Number(it.width) || 5) * (.89 + (seed & 255) / 255 * .28);
    const height = Math.max(3, Number(it.height) || 12) * (.92 + ((seed >>> 8) & 255) / 255 * .17);
    const trunk = kind === 'palm' ? '#745638' : '#59432f';
    const foliage = it.foliage || (kind === 'fir' ? '#285f38' : '#4b8447');
    c.rotation = t.rotation;
    if (kind === 'fir') {
      drawFir(c, height, width, trunk, foliage, t.profile);
      stats.firProfilesDrawn[t.profile.name]=(stats.firProfilesDrawn[t.profile.name]||0)+1;
    }
    else if (kind === 'palm') {
      drawPalm(c, height, width, trunk, foliage, t.profile);
      stats.palmProfilesDrawn[t.profile.name]=(stats.palmProfilesDrawn[t.profile.name]||0)+1;
    }
    else {
      drawDeciduous(c,t,width,height,trunk,foliage,detail);
      stats.deciduousProfilesDrawn[t.profile.name]=(stats.deciduousProfilesDrawn[t.profile.name]||0)+1;
    }
    stats.drawn++;
    stats.species[kind]++;
    return true;
  };
})();
