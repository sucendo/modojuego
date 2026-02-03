// src/galaxy/systems.js
// ✅ ONE ARRAY to rule them all.
// Edit ONLY GALAXY_LIST (it includes systems, multi-star, planets, moons and future ships).
// Everything else is derived.
//
// Uses global BABYLON.

export function buildSystems(T) {
	
// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------
// If a planet has no hint/system, don't create a fake "Landsraad" system.
// Instead, either (a) it gets auto-bucketed into Outer-* systems, or (b) falls
// back to Sol/Old Earth.
const DEFAULT_SYSTEM = "Al-Lat";

// ===================================================
// Validation + report (dev-time safety net)
// - logs a compact summary in console
// - exposes window.__GALAXY_REPORT for optional UI
// ===================================================
function _validateBuild(out) {
  const report = {
    counts: { systems: 0, stars: 0, planets: 0, moons: 0, others: 0 },
    duplicates: [],
    missingSystemPos: [],
    planetsMissingSystem: [],
    planetsMissingOrbit: [],
    moonsMissingParent: [],
  };

  const seen = new Map();
  const systemIds = new Set();

  for (const e of out) {
    const key = (e && (e.id || e.name)) ? String(e.id || e.name) : "";
    if (key) {
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
    }
    if (!e || !e.kind) continue;
    if (e.kind === "system") {
      report.counts.systems++;
      systemIds.add(e.id);
      if (!e.pos || typeof e.pos.x !== "number" || typeof e.pos.y !== "number" || typeof e.pos.z !== "number") {
        report.missingSystemPos.push(e.id);
      }
    } else if (e.kind === "star") report.counts.stars++;
    else if (e.kind === "planet") report.counts.planets++;
    else if (e.kind === "moon") report.counts.moons++;
    else report.counts.others++;
  }

  // Duplicates
  const dups = [...seen.entries()].filter(([, n]) => n > 1).map(([k, n]) => ({ id: k, count: n }));
  report.duplicates = dups;

  // Planets sanity
  const planets = out.filter(e => e && e.kind === "planet");
  for (const p of planets) {
    if (!p.systemId || !systemIds.has(p.systemId)) {
      report.planetsMissingSystem.push({ planet: p.name, systemId: p.systemId || null });
    }
    const badOrbit =
      (typeof p.orbitIndex !== "number") ||
      (typeof p.orbitR !== "number") ||
      (typeof p.orbitSpeed !== "number");
    if (badOrbit) {
      report.planetsMissingOrbit.push({ planet: p.name, orbitIndex: p.orbitIndex, orbitR: p.orbitR, orbitSpeed: p.orbitSpeed });
    }
  }

  // Moons sanity
  const moons = out.filter(e => e && e.kind === "moon");
  const bodyNames = new Set(out.filter(e => e && (e.kind === "planet" || e.kind === "moon")).map(e => e.name));
  for (const m of moons) {
    if (!m.parentId || !bodyNames.has(m.parentId)) {
      report.moonsMissingParent.push({ moon: m.name, parentId: m.parentId || null });
    }
  }

  // Derived report for UI + console
  const systemsNoStar = [];
  const starsBySystem = new Map();
  for (const s of out.filter(e => e && e.kind === "star")) {
    const sid = s.systemId || s.id; // tolerate both
    starsBySystem.set(sid, (starsBySystem.get(sid) || 0) + 1);
  }
  for (const sid of systemIds) {
    if (!starsBySystem.get(sid)) systemsNoStar.push(sid);
  }

  const problems = {
    duplicateIds: report.duplicates,
    missingSystemPos: report.missingSystemPos,
    systemsNoStar,
    planetsUnknownSystem: report.planetsMissingSystem,
    planetsMissingOrbit: report.planetsMissingOrbit,
    moonsMissingParent: report.moonsMissingParent,
    duplicatePlanetNames: [], // reserved (if you add aliasing later)
  };

  const finalReport = {
    counts: report.counts,
    problems,
    generatedAt: new Date().toISOString(),
  };

  try { window.__GALAXY_REPORT = finalReport; } catch(_) {}

  const warnCount =
    problems.missingSystemPos.length +
    problems.systemsNoStar.length +
    problems.planetsMissingOrbit.length +
    problems.planetsUnknownSystem.length +
    problems.duplicateIds.length +
    problems.moonsMissingParent.length;

  // Console output (compact)
  try {
    console.groupCollapsed(`GALAXY BUILD REPORT (${warnCount ? "WARN" : "OK"})`);
    console.log("Counts:", finalReport.counts);
    if (warnCount) console.warn("Problems:", finalReport.problems);
    else console.log("No problems detected.");
    console.groupEnd();
  } catch(_) {}

  return finalReport;
}

const _hash32 = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
};

const _rand01 = (seedStr) => {
  const x = _hash32(seedStr);
  // xorshift
  let y = x ^ (x << 13);
  y ^= (y >>> 17);
  y ^= (y << 5);
  return ((y >>> 0) % 100000) / 100000;
};

const _romanToInt = (r) => {
  if (!r) return null;
  const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  let s = 0, prev = 0;
  for (let i = r.length - 1; i >= 0; i--) {
    const v = map[r[i]] || 0;
    if (v < prev) s -= v; else { s += v; prev = v; }
  }
  return s || null;
};

const _pushUnique = (arr, v) => { if (!arr.includes(v)) arr.push(v); };

function applyDuneTags(def, tags = []) {
  const t = new Set(tags);

  // defaults razonables (para planetas genéricos)
  def.rocky = true;
  def.terrainScale ??= 0.15;
  def.noiseFrequency ??= 2.6;
  def.noiseOctaves ??= 6;
  def.farSegments ??= 24;
  def.microBump ??= T("detail_craters.png");
// ----------------------------
// Auto-atmosferas por tags
// - solo si el planeta no define atmo explícitamente
// ----------------------------
const hasAtmo = (def.atmo === true);
const canAutoAtmo = (def.atmo == null); // undefined/null => podemos decidir

const setAtmoIf = (cond, cfg) => {
  if (!canAutoAtmo || hasAtmo) return;
  if (!cond) return;
  def.atmo = true;
  def.atmoAlpha ??= cfg.atmoAlpha ?? 0.12;
  def.atmoColor ??= cfg.atmoColor ?? new BABYLON.Color3(0.35,0.55,1.0);
  if (cfg.surfaceFogColor) def.surfaceFogColor ??= cfg.surfaceFogColor;
  if (cfg.atmoOpts) def.atmoOpts = { ...(def.atmoOpts || {}), ...cfg.atmoOpts };
  if (cfg.atmoLayers) def.atmoLayers = cfg.atmoLayers;
};

// Desert (Arrakis-like): cielo azul + polvo; capa baja marrón
/*setAtmoIf(t.has("desert"), {
  atmoAlpha: 0.13,
  atmoColor: new BABYLON.Color3(0.30,0.50,1.00),
  surfaceFogColor: new BABYLON.Color3(0.90,0.78,0.56),
  atmoOpts: {
    miePower: 7.5, mieStrength: 0.75,
    pathPower: 2.2, pathStrength: 0.18,
    noiseStrength: 0.10,
    mieColor: new BABYLON.Color3(0.95,0.82,0.55),
    skyZenithColor: new BABYLON.Color3(0.22,0.42,0.95),
    skyHorizonColor: new BABYLON.Color3(0.98,0.86,0.62),
    skyHazeStrength: 1.20,
    skySunStrength: 1.30,
    cloudStrength: 0.12, cloudScale: 2.2, cloudSharpness: 2.2,
    ditherStrength: 1.5,
    segments: 32,
  },
  atmoLayers: [
    { mul: 1.020, aMul: 0.95, rimPower: 3.0, terminatorSoftness: 0.16, nightMin: 0.03, mieStrength: 0.28, pathStrength: 0.30, layerFade: 1.00,
      mieColor: new BABYLON.Color3(0.62,0.44,0.22) }, // polvo bajo marrón
    { mul: 1.045, aMul: 0.85, rimPower: 4.6, terminatorSoftness: 0.22, nightMin: 0.06, mieStrength: 0.55, pathStrength: 0.22, layerFade: 0.85 },
    { mul: 1.080, aMul: 0.45, rimPower: 6.2, terminatorSoftness: 0.30, nightMin: 0.08, mieStrength: 0.75, pathStrength: 0.10, layerFade: 0.55 },
  ],
});

// Ocean / humid / stormy (Caladan-like): azul + Mie blanco + nubes densas
setAtmoIf(t.has("ocean") || t.has("humid") || t.has("stormy") || t.has("forest") || t.has("rain"), {
  atmoAlpha: 0.12,
  atmoColor: new BABYLON.Color3(0.28,0.55,1.00),
  surfaceFogColor: new BABYLON.Color3(0.70,0.78,0.86),
  atmoOpts: {
    rimPower: 4.6, terminatorSoftness: 0.26, nightMin: 0.03,
    miePower: 7.0, mieStrength: 0.42,
    pathPower: 2.2, pathStrength: 0.18,
    noiseStrength: 0.035,
    mieColor: new BABYLON.Color3(0.92,0.95,1.00),
    sunsetColor: new BABYLON.Color3(1.00,0.55,0.14),
    sunsetStrength: 0.55,
    cloudStrength: 0.65, cloudScale: 1.8, cloudSharpness: 1.4,
    ditherStrength: 1.4,
    segments: 36,
  },
});

// Industrial / polluted / toxic: haze verdoso/gris
setAtmoIf(t.has("industrial") || t.has("polluted") || t.has("toxic"), {
  atmoAlpha: 0.16,
  atmoColor: new BABYLON.Color3(0.55,0.65,0.58),
  surfaceFogColor: new BABYLON.Color3(0.35,0.42,0.36),
  atmoOpts: {
    miePower: 6.8, mieStrength: 0.70,
    pathPower: 2.0, pathStrength: 0.16,
    noiseStrength: 0.06,
    mieColor: new BABYLON.Color3(0.65,0.75,0.62),
    ditherStrength: 1.5,
  },
});

// Cold / ice: fina, pálida, casi sin Mie
setAtmoIf(t.has("cold") || t.has("ice_world") || t.has("fjords"), {
  atmoAlpha: 0.10,
  atmoColor: new BABYLON.Color3(0.70,0.80,1.00),
  surfaceFogColor: new BABYLON.Color3(0.78,0.84,0.92),
  atmoOpts: {
    mieStrength: 0.22,
    mieColor: new BABYLON.Color3(0.88,0.92,1.00),
    ditherStrength: 1.2,
  },
});*/

		
  // ---- gas giant ----
/*  if (t.has("gas-giant")) {
    def.rocky = false;
    def.ocean = false;
    def.seaLevel = 0.02;
    def.terrainScale = 0.03;
    def.noiseFrequency = 1.1;
    def.noiseOctaves = 4;
    def.farSegments = Math.max(def.farSegments || 36, 56);

    // atmósfera muy visible por defecto (si no se definió ya)
    /*if (def.atmo == null) {
      def.atmo = true;
      def.atmoAlpha ??= 0.42;
      if (t.has("pink")) def.atmoColor ??= new BABYLON.Color3(0.95,0.55,0.70);
    }*/
  /*}*/

  // ---- biomes base ----
  if (t.has("desert")) {
    def.biomePreset = "desert_dunes";
    def.ocean = false;
    def.seaLevel = 0.02;
    def.terrainScale = 0.22;
    def.noiseFrequency = 3.0;
    def.microBump = T("detail_rock3.png");
  }

  if (t.has("ocean")) {
    def.biomePreset ??= "oceanic_temperate";
    def.ocean = true;
    def.seaLevel ??= -0.03;
    def.oceanColor ??= new BABYLON.Color3(0.04,0.20,0.30);
    def.terrainScale = Math.min(def.terrainScale ?? 0.13, 0.13);
  }

  if (t.has("industrial") || t.has("polluted")) {
    def.biomePreset = "industrial_toxic";
    def.ocean = false; // más “tóxico/industrial” que oceánico
    def.seaLevel = 0.02;
    def.terrainScale = 0.20;
    def.noiseFrequency = 3.1;
    def.microBump = T("detail_rock2.png");
  }

  if (t.has("tech")) {
    def.biomePreset = "techno_frost";
    def.ocean = false;
    def.seaLevel = 0.02;
    def.terrainScale = 0.16;
    def.noiseFrequency = 2.7;
    def.microBump = T("detail_snow.png");
  }

  if (t.has("prison") || t.has("military") || t.has("harsh")) {
    def.biomePreset = "harsh_badlands";
    def.ocean = false;
    def.seaLevel = 0.02;
    def.terrainScale = 0.24;
    def.noiseFrequency = 3.1;
    def.microBump = T("detail_rock3.png");
  }

  if (t.has("jungle") || t.has("lush") || t.has("forest")) {
    def.biomePreset = "oceanic_temperate";
    def.ocean ??= true;
    def.seaLevel ??= -0.02;
    def.oceanColor ??= new BABYLON.Color3(0.05,0.22,0.28);
    def.noiseFrequency = 2.2;
    def.terrainScale = 0.14;
  }

  if (t.has("cold") || t.has("ice_world") || t.has("fjords")) {
    def.biomePreset = "techno_frost";
    def.ocean ??= false;
    def.seaLevel ??= 0.02;
    def.noiseFrequency = 2.4;
    def.terrainScale = 0.18;
    def.microBump = T("detail_snow.png");
  }

  // ---- rasgos extra ----
  if (t.has("archipelago") || t.has("islands")) {
    def.ocean = true;
    def.seaLevel ??= -0.02;
    def.continentFreq ??= 0.55;
    def.continentStrength ??= 0.55;
    def.islandsFreq ??= 4.8;
    def.islandsStrength ??= 0.22;
  }

  if (t.has("crystal") || t.has("jewel")) {
    def.biomePreset ??= "imperial_temperate";
    def.ocean = false;
    def.seaLevel = 0.03;
    def.terrainScale = 0.26;
    def.noiseFrequency = 2.9;
  }

  if (t.has("imperial") || t.has("engineered-climate")) {
    def.biomePreset = "imperial_temperate";
    def.ocean ??= true;
    def.seaLevel ??= -0.02;
    def.terrainScale = 0.12;
    def.noiseFrequency = 2.2;
  }

  if (t.has("hedonism") || t.has("urban") || t.has("bureaucracy")) {
    def.biomePreset = "imperial_temperate";
    def.ocean ??= true;
    def.seaLevel ??= -0.01;
    def.terrainScale = 0.10;
    def.noiseFrequency = 2.0;
  }

  if (t.has("marsh")) {
    def.biomePreset ??= "imperial_temperate";
    def.ocean = true;
    def.seaLevel ??= -0.008; // más “aguas someras”
    def.terrainScale = 0.11;
    def.noiseFrequency = 2.1;
  }

  if (t.has("river")) {
    def.biomePreset ??= "oceanic_temperate";
    def.ocean = true;
    def.seaLevel ??= -0.015;
    def.terrainScale = 0.12;
    def.noiseFrequency = 2.3;
  }

  if (t.has("toxic")) {
    def.biomePreset = "industrial_toxic";
    def.ocean = false;
    def.seaLevel = 0.02;
    def.terrainScale = 0.19;
    def.noiseFrequency = 2.9;
  }

  if (t.has("battlefield") || t.has("red-sun")) {
    def.biomePreset = "harsh_badlands";
    def.ocean = false;
    def.seaLevel = 0.02;
    def.terrainScale = 0.26;
    def.noiseFrequency = 3.2;
  }
}

function applyDuneMeta(def) {
  const entry = PLANET_OVERRIDES[def.name];
  if (!entry) return;

  const { tags, ...hard } = entry;

  // tags -> look (procedural adjustments)
  applyDuneTags(def, tags || []);

  // keep lore if present
  if (hard.house) def.house = hard.house;
  if (hard.production) def.production = hard.production;

  // hard overrides (radius/biome/atmo/rings/etc.)
  Object.assign(def, hard);
}

const makePlanetDef = (planetName, orbitIndex, overrides = {}) => {
  const r0 = _rand01("r:" + planetName);
  const r1 = _rand01("s:" + planetName);
  const baseRadius = 3.2 + r0 * 4.4; // 3.2..7.6

  // órbitas “bonitas” (solo visual)
  const orbitR = 110 + orbitIndex * 70;
  const orbitSpeed = 0.00095 / (1 + orbitIndex * 0.38);
  const rotSpeed = (0.04 + r1 * 0.18) * (r0 > 0.5 ? 1 : -1);

  const def = {
    name: planetName,
    kind: "planet",
    radius: baseRadius,
    orbitR,
    orbitSpeed,
    rotSpeed,
    rocky: true,
    biomePreset: "imperial_temperate",
    terrainScale: 0.14,
    seaLevel: -0.01,
    noiseFrequency: 2.2,
    noiseOctaves: 6,
    farSegments: 22,
    ocean: true,
  };

  // default por “tipo” del nombre
  const n = planetName.toLowerCase();
  if (/(dune|arrakis|raki)/.test(n)) {
    def.biomePreset = "desert_dunes";
    def.ocean = false;
    def.seaLevel = 0.01;
    def.terrainScale = 0.22;
    def.noiseFrequency = 2.9;
  } else if (/(prime|industrial|giedi|komider|chado|tanegaard|connection|conex)/.test(n)) {
    def.biomePreset = "industrial_toxic";
    def.ocean = true;
    def.seaLevel = 0.01;
    def.terrainScale = 0.18;
  } else if (/(caladan|buzzell|ocean|sea)/.test(n)) {
    def.biomePreset = "oceanic_temperate";
    def.ocean = true;
    def.seaLevel = -0.02;
    def.terrainScale = 0.12;
  } else if (/(ix|richese|kronin)/.test(n)) {
    def.biomePreset = "techno_frost";
    def.ocean = false;
    def.seaLevel = 0.02;
    def.terrainScale = 0.16;
  }
		
  // (Nuevo) Ajuste por “descripción/lore” (tags → look)
  // Importante: se aplica ANTES de overrides duros/canon.
  applyDuneMeta(def);

  Object.assign(def, overrides);
  return def;
};

const makeMoonDef = (moonName, parentName, moonIndex = 0) => {
  const r0 = _rand01("m:" + moonName);
  return {
    name: moonName,
    kind: "moon",
    radius: 0.7 + r0 * 0.9,
    orbitR: 9.5 + moonIndex * 6.5,
    orbitSpeed: 0.05 + r0 * 0.06,
    rotSpeed: 0.008 + r0 * 0.012,
    atmo: false,
    rocky: true,
    parent: parentName,
  };
};

// ===================================================
// ✅ SINGLE ARRAY SOURCE OF TRUTH
// You can mix entries:
//  - { kind:"system", id, pos, speedScale }
//  - { kind:"star", id, systemId, ... }
//  - { kind:"planet", name, systemId, orbitIndex, orbitR, orbitSpeed, ...visuals }
//  - { kind:"moon",  name, parentId, systemId, orbitR, orbitSpeed, ... }
//  - { kind:"ship",  id, systemId/parentId, ... }  (future)
// To avoid repeating huge data, we keep ONE catalog entry that expands into entities.
// Still: **ONE ARRAY**, one place to edit.
// ===================================================
const GALAXY_LIST = [
  {
    kind: "catalog",
    id: "DUNE",
    // Planet visuals catalog (your current overrides):
    planets: {
	  // Canon-ish clave
	  // Arrakis: órbita excéntrica + anillo tenue de polvo (tercera luna destruida, Dune Encyclopedia)
	  // y rotación prógrada (como la Tierra): el sol “sale por el Este”
		"Arrakis": {
			jsonFile: "arrakis.json",
		  tags: ["desert","spice","extreme"],
		  radius: 6.2,
		  biomePreset: "desert_dunes",
		  seaLevel: 0.01,
		  ocean: false,

		  orbitEcc: 0.18,
		  rotSpeed: 0.080,

		  rings: true,
		  ringTex: "proc:dust",
		  ringAlpha: 0.22,
		  ringRadiusMul: 2.55,
		  ringTilt: 0.10,

		  atmo: true,
		  atmoColor: new BABYLON.Color3(0.30, 0.50, 1.00),
		  atmoAlpha: 0.14,
		  surfaceFogColor: new BABYLON.Color3(0.30,0.50,1.00),

		  atmoOpts: {
			miePower: 7.5,
			mieStrength: 0.85,
			pathPower: 2.2,
			pathStrength: 0.18,
			noiseStrength: 0.12,

			// Dust/Mie global (amarillo arena)
			mieColor: new BABYLON.Color3(0.95, 0.82, 0.55),

			// Inside-sky (azul arriba, arena en horizonte)
			skyZenithColor: new BABYLON.Color3(0.22, 0.42, 0.95),
			skyHorizonColor: new BABYLON.Color3(0.98, 0.86, 0.62),
			skyHazeStrength: 1.25,
			skySunStrength: 1.35,

			cloudStrength: 0.16,
			cloudScale: 2.2,
			cloudSharpness: 2.2,

			// Solo dithering sutil (sin grano animado)
			ditherStrength: 1.6,

			segments: 32
		  },

		  // Capa inferior con tinte marrón (polvo cercano al suelo)
		  atmoLayers: [
			{
			  mul: 1.120,
			  aMul: 0.95,
			  rimPower: 3.0,
			  terminatorSoftness: 0.16,
			  nightMin: 0.03,
			  mieStrength: 0.30,
			  pathStrength: 0.30,
			  layerFade: 1.00,

			  // 👇 marrón bajo (polvo denso cerca del suelo)
			  mieColor: new BABYLON.Color3(0.62, 0.44, 0.22),
			  atmoColor: new BABYLON.Color3(0.28, 0.46, 0.95)
			},
			{
			  mul: 1.145,
			  aMul: 0.85,
			  rimPower: 4.6,
			  terminatorSoftness: 0.22,
			  nightMin: 0.06,
			  mieStrength: 0.55,
			  pathStrength: 0.22,
			  layerFade: 0.85
			},
			{
			  mul: 1.180,
			  aMul: 0.45,
			  rimPower: 6.2,
			  terminatorSoftness: 0.30,
			  nightMin: 0.08,
			  mieStrength: 0.75,
			  pathStrength: 0.10,
			  layerFade: 0.55
			}
		  ],

		  terrainScale: 0.20,
		  noiseFrequency: 2.6,
		  noiseOctaves: 6,
		  farSegments: 48,
		  microBump: T("detail_rock3.png")
		},
		// Canopus (6 planetas): detalle visual según tu última descripción
		"Seban":            {
			jsonFile: "seban.json",
		  tags: ["rocky","hot","inner"], radius: 4.0, biomePreset: "harsh_badlands",  seaLevel: 0.02,  ocean: false,
								terrainScale: 0.18, noiseFrequency: 3.4, noiseOctaves: 6, farSegments: 40,
								rings: true, ringTex: "proc:ion" }, // nube tenue de metales ionizados
		"Menaris":          {
		  tags: ["rocky","temperate"], radius: 5.1, biomePreset: "imperial_temperate", seaLevel: -0.01, ocean: true,
								oceanColor: new BABYLON.Color3(0.05,0.15,0.22), terrainScale: 0.12,
								noiseFrequency: 2.4, noiseOctaves: 6, farSegments: 42 }, // “gemelo” de Extaris
		"Extaris":          {
		  tags: ["rocky","dry"], radius: 4.4, biomePreset: "techno_frost",      seaLevel: 0.02,  ocean: false,
								terrainScale: 0.16, noiseFrequency: 2.8, noiseOctaves: 6, farSegments: 40 }, // pequeño exterior, 5 lunas
		"Ven":              {
		  tags: ["gas-giant","pink","storms"], radius: 12.0,
			// === GAS GIANT (sin superficie sólida) ===
			gasGiant: true,
			gasStorms: true,           // porque en META tiene "storms"
			rocky: false,
			ocean: false,
			seaLevel: 0.02,
			// parámetros suaves (solo para “bandas”/variación, NO cráteres)
			terrainScale: 0.03,
			noiseFrequency: 1.1,
			noiseOctaves: 4,
			farSegments: 64,
			// atmósfera bien visible (rosada)
			/*atmo: true,
			atmoColor: new BABYLON.Color3(0.95,0.55,0.70),
			atmoAlpha: 0.42 */}, // gigante rosado gaseoso (casi “estrella fallida”)
	    "Revona":           {
	      jsonFile: "revona.json",
		  tags: ["ocean","cold","fjords"], radius: 6.6, biomePreset: "imperial_temperate", seaLevel: -0.02, ocean: true,
			oceanColor: new BABYLON.Color3(0.04,0.12,0.24), terrainScale: 0.10,
			noiseFrequency: 2.1, noiseOctaves: 6, farSegments: 48 }, // muy exterior, con Laran
		"Caladan": 		  {
			jsonFile: "caladan.json",
		  tags: ["ocean","stormy","forest"],
			oceanAlpha: 0.60,
			oceanRoughness: 0.14,
			oceanMetallic: 0.05,
			oceanSpecular: 0.45,
			nightLights: true,
			nightLightsIntensity: 2.2,
			oceanAlpha: 0.82,
			radius: 7.0,
			biomePreset: "oceanic_temperate",
			seaLevel: 0.0355,
			ocean: true,
			oceanColor: new BABYLON.Color3(0.04,0.20,0.30),
			terrainScale: 0.13,
			noiseFrequency: 2.1,
			noiseOctaves: 6,
			farSegments: 52,
			microBump: T("detail_craters.png"),
			
			atmo: true,
			atmoColor: new BABYLON.Color3(0.28, 0.55, 1.00),
			atmoAlpha: 0.12, // un pelín menos para evitar “aro”
			surfaceFogColor: new BABYLON.Color3(0.70, 0.78, 0.86),
			
			atmoOpts: {
			  rimPower: 4.6,
			  terminatorSoftness: 0.26,
			  nightMin: 0.03,
			   
			  miePower: 7.0,
			  mieStrength: 0.42,      // humedad: menos agresivo que polvo
			  pathPower: 2.2,
			  pathStrength: 0.18,
			  noiseStrength: 0.035,
			   
			  mieColor: new BABYLON.Color3(0.92, 0.95, 1.00),
			  sunsetColor: new BABYLON.Color3(1.00, 0.55, 0.14),
			  sunsetStrength: 0.55,   // menos naranja (más realista “tierra”)
			   
			  ditherStrength: 2.4,
			  aerosolGrainStrength: 0.14,
			  aerosolGrainScale: 0.95,
			  aerosolGrainSpeed: 9.0,
			   
			  // Unas nubes muy sutiles (Arrakis casi siempre despejado)
			  cloudStrength: 1.16,
			  cloudScale: 5.2,
			  cloudSharpness: 5.2, 
			   
			  segments: 36,
			  // si tu atmosphere.js soporta esto:
			  // blendMode: "premul",
			},
			
			// Capas MUCHO más juntas (fusionan y desaparece la ralla)
			atmoLayers: [
			  { mul: 1.120, aMul: 0.95, rimPower: 3.8, terminatorSoftness: 0.22, nightMin: 0.02, mieStrength: 0.26, pathStrength: 0.22, layerFade: 0.95 },
			  { mul: 1.140, aMul: 0.70, rimPower: 4.9, terminatorSoftness: 0.26, nightMin: 0.03, mieStrength: 0.40, pathStrength: 0.14, layerFade: 0.78 },
			  { mul: 1.165, aMul: 0.40, rimPower: 6.2, terminatorSoftness: 0.30, nightMin: 0.04, mieStrength: 0.55, pathStrength: 0.09, layerFade: 0.58 },
			],
		},
		"Giedi Prime":      {
			jsonFile: "giedi-prime.json",
			tags: ["industrial","polluted"], radius: 6.6, biomePreset: "industrial_toxic",   seaLevel: 0.008,  ocean: true,  oceanColor: new BABYLON.Color3(0.02,0.08,0.05), terrainScale: 0.20, noiseFrequency: 3.2, noiseOctaves: 5, farSegments: 50, microBump: T("detail_rock2.png") },
		"Ix":               {
			jsonFile: "ix.json",
			tags: ["tech","subsurface","dry"], radius: 5.9, biomePreset: "techno_frost",      seaLevel: -0.012, ocean: true,  oceanColor: new BABYLON.Color3(0.03,0.12,0.18), terrainScale: 0.16, noiseFrequency: 2.7, noiseOctaves: 6, farSegments: 48, microBump: T("detail_snow.png") },
		"Richese":          {
			jsonFile: "richese.json",
			tags: ["tech","ocean","miniaturization","archipelago"], radius: 6.4, biomePreset: "archipelago_turquoise", seaLevel: -0.0125, ocean: true, oceanColor: new BABYLON.Color3(0.05,0.26,0.30), terrainScale: 0.11, noiseFrequency: 2.0, noiseOctaves: 6, farSegments: 52, microBump: T("detail_craters.png"),
					continentFreq: 0.55, continentStrength: 0.55, islandsFreq: 4.8, islandsStrength: 0.22 },
		"Kaitain":          {
			tags: ["imperial","engineered-climate","temperate"], radius: 6.3, biomePreset: "imperial_temperate",  seaLevel: -0.022, ocean: true,  oceanColor: new BABYLON.Color3(0.04,0.18,0.26), terrainScale: 0.12, noiseFrequency: 2.2, noiseOctaves: 6, farSegments: 50, microBump: T("detail_craters.png") },
		"Salusa Secundus":  {
			tags: ["prison","harsh","military"], radius: 6.0, biomePreset: "harsh_badlands",   seaLevel: 0.01,   ocean: false, terrainScale: 0.24, noiseFrequency: 3.0, noiseOctaves: 6, farSegments: 48, microBump: T("detail_rock3.png") },
		"Wallach IX":       {
			tags: ["bg","austere","humid"], radius: 5.0, biomePreset: "imperial_temperate",  seaLevel: -0.01,  ocean: true,  terrainScale: 0.12, noiseFrequency: 2.2, noiseOctaves: 6, farSegments: 36 },
		"Tleilax":          {
			tags: ["secretive","dry","bioengineering"], radius: 4.9, biomePreset: "industrial_toxic",    seaLevel: 0.02,   ocean: false, terrainScale: 0.18, noiseFrequency: 2.8, noiseOctaves: 6, farSegments: 32 },
		"Rossak":           {
			jsonFile: "rossak.json",
			tags: ["toxic","jungle","pharma","mystic"], radius: 4.8, biomePreset: "industrial_toxic",    seaLevel: 0.02,   ocean: false, terrainScale: 0.19, noiseFrequency: 2.6, noiseOctaves: 6, farSegments: 32 },
		"Buzzell":          {
			tags: ["ocean","punishment","storms"], radius: 4.6, biomePreset: "oceanic_temperate",  seaLevel: -0.02,  ocean: true,  terrainScale: 0.12, noiseFrequency: 2.0, noiseOctaves: 6, farSegments: 32 },
		"Lampadas":         {
			tags: ["bg","school","ruins","ash"], radius: 4.7, biomePreset: "imperial_temperate",  seaLevel: -0.035, ocean: true,  terrainScale: 0.12, noiseFrequency: 2.1, noiseOctaves: 6, farSegments: 32 },
		"Tierra":          {
			jsonFile: "tierra.json",
			tags: ["ocean","cold","fjords"], 
			nightLights: true,
			nightLightsIntensity: 2.2,
			radius: 6.6, biomePreset: "imperial_temperate", 
			/*seaLevel: -0.09, ocean: true,
			oceanColor: new BABYLON.Color3(0.04,0.12,0.24),   oceanAlpha: 0.62,
			oceanRoughness: 0.12, terrainScale: 0.10,
			noiseFrequency: 2.1, noiseOctaves: 6, farSegments: 48,

			// Atmósfera multicapa (Tierra futura post-cataclismo)
			atmo: true,
			// Base is only used as a fallback; each layer has its own color
			atmoColor: new BABYLON.Color3(0.20, 0.45, 0.95),
			atmoAlpha: 0.34,
			// Mostrar atmósfera/nubes solo al acercarse
			atmoRange: 260,
			cloudRange: 235,
			cloudMinDist: 12.0,

			// 3 capas: polvo gris-amarronado (baja), azul intenso (media), azul tenue (alta)
			atmoLayers: [
			  // Capa inferior: polvo/ceniza cerca del suelo
			  {
				mul: 1.068, aMul: 0.95,
				color: new BABYLON.Color3(0.62, 0.58, 0.52),
				mieColor: new BABYLON.Color3(0.78, 0.70, 0.58),
				rimPower: 3.7, terminatorSoftness: 0.26, nightMin: 0.03,
				mieStrength: 0.48, miePower: 6.5,
				pathStrength: 0.22, pathPower: 2.0,
				noiseStrength: 0.085,
				sunsetColor: new BABYLON.Color3(1.0, 0.62, 0.30),
				sunsetStrength: 0.42,
				layerFade: 0.95,
			  },
			  // Capa intermedia: azul más fuerte (tipo Tierra, algo sucia)
			  {
				mul: 1.080, aMul: 0.72,
				color: new BABYLON.Color3(0.18, 0.42, 0.95),
				mieColor: new BABYLON.Color3(0.30, 0.48, 0.80),
				rimPower: 4.9, terminatorSoftness: 0.28, nightMin: 0.04,
				mieStrength: 0.46,
				pathStrength: 0.18,
				noiseStrength: 0.060,
				layerFade: 0.78,
			  },
			  // Capa superior: azul muy tenue que se fusiona con el negro
			  {
				mul: 1.092, aMul: 0.36,
				color: new BABYLON.Color3(0.08, 0.22, 0.55),
				mieColor: new BABYLON.Color3(0.12, 0.26, 0.62),
				rimPower: 6.4, terminatorSoftness: 0.32, nightMin: 0.05,
				mieStrength: 0.62,
				pathStrength: 0.10,
				noiseStrength: 0.035,
				layerFade: 0.58,
			  },
			],
			atmoOpts: {
				blendMode: "premul",
				ditherStrength: 1.25,
			},*/

			// --- Atmósfera "Unity-style" (screen-space postprocess) ---
			// Se activa solo al acercarte y desactiva automáticamente las mallas de atmo/nubes
			// para evitar el look "por capas".
			/*atmoPP: {
				range: 400,
				radiusMul: 1.08,
				layers: [
					// Capa inferior: polvo/ceniza (gris amarronado)
					{ color: new BABYLON.Color3(0.62, 0.58, 0.52), alpha: 0.34, height: 0.10, falloff: 8.0 },
					// Capa intermedia: azul intenso (algo sucia)
					{ color: new BABYLON.Color3(0.18, 0.42, 0.95), alpha: 0.26, height: 0.48, falloff: 3.6 },
					// Capa superior: azul tenue que se funde con el negro
					{ color: new BABYLON.Color3(0.10, 0.28, 0.65), alpha: 0.22, height: 0.95, falloff: 1.7 },
				],
				clouds: {
					alpha: 0.22,
					scale: 2.7,
					sharpness: 2.2,
					wind: new BABYLON.Vector3(0.020, 0.0, 0.012),
					tint: new BABYLON.Color3(0.92, 0.96, 1.08), // blanco + azul suave
				},
			},*/

			// Nubes: blancas/azules, irregulares y evolutivas (solo cerca)
			clouds: true,
			cloudAlpha: 0.96,
			cloudMul: 1.082,
			cloudScale: 30.0,
			cloudCoverage: 0.56,
			cloudSharpness: 2.45,
			cloudWind: new BABYLON.Vector2(0.022, -0.010),
			cloudColorA: new BABYLON.Color3(0.98, 0.99, 1.00),
			cloudColorB: new BABYLON.Color3(0.62, 0.78, 1.00),
		}, // muy exterior
	    "Jupiter":          {
		    tags: ["gas-giant","pink","storms"], radius: 12.0,
			// === GAS GIANT (sin superficie sólida) ===
			gasGiant: true,
			gasStorms: true,           // porque en META tiene "storms"
			rocky: false,
			ocean: false,
			seaLevel: 0.02,
			// parámetros suaves (solo para “bandas”/variación, NO cráteres)
			terrainScale: 0.03,
			noiseFrequency: 1.1,
			noiseOctaves: 4,
			farSegments: 64,
			// atmósfera bien visible (rosada)
			/*atmo: true,
			atmoColor: new BABYLON.Color3(0.95,0.55,0.70),
			atmoAlpha: 0.42 */}, // gigante rosado gaseoso (casi “estrella fallida”)				
	    // Extra "no-canon" útil para tu demo (lava)
		"Saturno":              {
			tags: ["gas-giant","red","storms"],
			radius: 10.0,
			// === GAS GIANT (sin superficie sólida) ===
			gasGiant: true,
			gasStorms: true,           // porque en META tiene "storms"
			rocky: false,
			ocean: false,
			seaLevel: 0.02,
			// parámetros suaves (solo para “bandas”/variación, NO cráteres)
			terrainScale: 0.03,
			noiseFrequency: 1.1,
			noiseOctaves: 4,
			farSegments: 64,
			
			rings: true, ringTex: "proc:ion",
			// atmósfera bien visible (rosada)
			/*atmo: true,
			atmoColor: new BABYLON.Color3(0.95,0.55,0.70),
			atmoAlpha: 0.42 */}, // gigante rosado gaseoso (casi “estrella fallida”)
	    "Vulcanis": {
			jsonFile: "vulcanis.json", radius: 6.6, biomePreset: "lava_world", seaLevel: -0.098, ocean: true, oceanKind: "lava", lavaIntensity: 2.0, lavaFlowSpeed: 0.06,
			lavaColor: new BABYLON.Color3(1.0, 0.35, 0.08), terrainScale: 0.20, noiseFrequency: 2.9, noiseOctaves: 6, farSegments: 52, microBump: T("detail_rock2.png") },

		// --- Planetas solo con tags/lore (sin overrides duros) ---
		"Ginaz": { tags:["islands","tropical","martial"], production:["swordmasters"] },
		"Ecaz": { tags:["jungle","fog","lush"], production:["drugs","medicine","mimetic-wood"] },
		"Chusuk": { tags:["forest","cultural","musical"], production:["instruments"] },
		"Hagal": { tags:["crystal","mining","jewel"], production:["quartz"] },
		"Gamont": { tags:["hedonism","urban","humid"], production:["pleasure-tourism"] },
		"Grumman": { tags:["mining","fortress","harsh"], production:["minerals"] },
		"Poritrin": { tags:["river","hot","slavery"], production:["commerce"] },
		"Bela Tegeuse": { tags:["rain","fog","low-light"], production:["hydroponics"] },
		"Lankiveil": { tags:["cold","fjords","ocean","whaling"], production:["whale-products"] },
		"Corrin": { tags:["red-sun","battlefield","toxic"], production:["history"] },
		"Tanegaard": { tags:["bureaucracy","monolithic","temperate"], production:["CHOAM"] },
		"Conexión": { tags:["shipyard","marsh","industrial"], production:["guild-hub"] },
		"Kolhar": { tags:["cold","plains","shipyard"], production:["guild-origin"] },
	},
    // Raw bodies list:
    rawBodies: [
		// Canopus / Arrakis
		"Seban", "Menaris", "Arrakis", "Extaris", "Ven", "Revona",
		// Otros mundos clave
		"Caladan", "Giedi Prime", "Kaitain", "Salusa Secundus", "Ix", "Richese",
		"Tleilax", "Wallach IX", "Ginaz", "Ecaz", "Chusuk", "Hagal", "Poritrin",
		"Gamont", "Grumman", "Lankiveil", "Lampadas", "Rossak", "Buzzell", "Corrin",
		"Vulcanis", "Tierra", "Jupiter", "Saturno",
		// Lista ampliada (tu listado)
		/*"III Delta Kaising", "Acline", "Al Dhanab", "Alahir", "Alarkand",
		"Allgrave (Andala IV)", "Anbus IV", "Andaur", "Andioyu", "Andosia", "Alpha Corvus",
		"Arbelough", "Armouth", "Artisia", "Atar", "Balut", "Barandiko", "Beakkal",
		"Bela Tegeuse (V Kuentsing)", "Bellaris", "Bellos", "Belos IV", "Biarek", "Bifkar",
		"Borhees", "Boujet", "Buzzell", "Canidar", "Casa Capitular", "Cedon", "Ceel",
		"Cherodo", "Chado", "Clione (Luna de Novebruns)", "Colonia Peridot", "Colonia Ventree",
		"Conexión", "Conexión Alpha", "Crell", "Crompton", "Crustacea Tres", "Cuarte",
		"Culat", "Denali", "Draemh (Enthi VII)", "Dross", "Dur", "Duvalle", "Ecaz",
		"Ekhnot", "Eleccan", "Elegy", "Ellram", "Enfeil", "Fharris", "Fournier",
		"Gaar", "Galicia", "Gangigisree", "Gansireed", "Gillek", "Grand Hein", "Grenbelle (Mycopterra XIV)",
		"Harmonthep", "Hassika V", "Havari", "Hessra", "Honru", "Ilthamont", "Irawok",
		"Ishkal", "Ishia", "Isla", "Issimo III", "Ipyr", "Ixap", "Izvinor", "Jakar",
		"Jericha", "Jervish", "Jhibraith", "Jongleur", "Katinov (Alderamin IV)", "Kellinor",
		"Kepler", "Keres (Kora II)", "Kirana III", "Klytemn", "Kobold (Kora II)", "Kolhar",
		"Komider", "Kronin", "Lampadas", "Lectaire", "Lernaeus", "Mallador", "Markon",
		"Meuse", "Midea", "Molitor", "Moroko", "Muritan", "Naraj", "Narcal", "Niushe",
		"No-Planeta de las Honoradas Matres", "Nossus", "Novebruns", "Oalar", "Oculiat",
		"Omwara", "Osmynea (estación sobre Wrasni)", "Otak", "Otorio", "Palma", "Parmentier",
		"Parella", "Pedmiot", "Péle", "Perdiccas (Luna de Hagal)", "Perth", "Perrin XIV",
		"Pilargo", "Pincknon", "Pirido", "Pital", "Planeta de los Adiestradores", "Pliesse",
		"Ponciard", "Prix", "Qalloway", "Quardhyr (Mycopterra XVIII)", "Qelso", "Quadra",
		"Reenol", "Relicon", "Renditai", "Rhisso", "Richese", "Risp VII", "Roc", "Romo",
		"Ronto", "Ros-Jal", "Rossak", "Sansin", "Selos", "Seneca", "Seprek", "Sikun",
		"Sincronía", "Souci (Luna)", "Subiak", "Taligari", "Tanegaard", "Tarahell", "Tengrid (Kublai XII)",
		"Thonaris", "Tleilax Siete", "Tupile", "Tyndall", "Ularda", "Unsidor",
		"Uthers", "Velan", "Walgis", "Wallach VI", "Wallach VII", "Wrasni (Uuokia IV)",
		"Xuttuh", "Yardin", "Yondair", "Zabulon", "Zanbar", "Zanobar", "Zenha", "Zenith",
		// define sistemas citados como tales (se rellenan si no tienen planetas)*/
		"SYS: Unsidor", "SYS: Thonaris", "SYS: Yondair"
	],
    // Hints for system placement + orbitIndex:
    hints: {
		"Arrakis":         { system: "Canopus", pos: 3 },
		"Seban":           { system: "Canopus", pos: 1 },
		"Menaris":         { system: "Canopus", pos: 2 },
		"Extaris":         { system: "Canopus", pos: 4 },
		"Ven":             { system: "Canopus", pos: 5 },
		"Revona":          { system: "Canopus", pos: 6 },
		
        "Ishia":           { system: "Beta Lyncis", pos: 3 },
		
		"Caladan":         { system: "Delta Pavonis", pos: 3 },
		"Harmonthep":      { system: "Delta Pavonis", pos: 4 },
		"Giedi Prime":     { system: "36 Ophiuchi B", pos: 1 },
		"Ix":              { system: "Alkalurops", pos: 9 },
		"Richese":         { system: "Eridani A", pos: 4 },
		"Ecaz":            { system: "Alpha Centauri B", pos: 4 },
		
		// Rossak (en el mapa central aparece ligado a Alces Minor)
		"Rossak":          { system: "Alces Minor", pos: 2 },
		
		// Bela Tegeuse: normaliza ambas variantes que tienes en rawBodies
		"Bela Tegeuse":               { system: "Kuentsing", pos: 2 },
		"Bela Tegeuse (V Kuentsing)": { system: "Kuentsing", pos: 2 },
		
		// Lampadas / Wallach: lo dejo en el mismo entorno de Laoujin (BG)
		"Lampadas":        { system: "Laoujin", pos: 8 },
		
		// Buzzell / Lankiveil / Ginaz (no están en el mapa central, pero al menos quedan “colocados”)
		// Puedes reubicar luego a sus estrellas canónicas si las añades
		"Buzzell":         { system: "Alpha Piscium", pos: 7 },
		"Lankiveil":       { system: "Delta Pavonis", pos: 6 },
		"Ginaz":           { system: "Alpha Piscium", pos: 6 },
		
		// Mundos “infra/CHOAM/Guild hub”: los coloco en Psi Draconis (tu nodo ya existente)
		"Conexión":        { system: "Psi Draconis", pos: 7 },
		"Kolhar":          { system: "Psi Draconis", pos: 8 },
		"Tanegaard":       { system: "Alpha Piscium", pos: 8 },
		
		"Wallach IX":      { system: "Laoujin", pos: 9 },
		"Tleilax":         { system: "Thalim", pos: 1 },
		"Salusa Secundus": { system: "Gamma Waiping", pos: 3 },
		"Poritrin":        { system: "Epsilon Alangue", pos: 3 },
		"Chusuk":          { system: "Theta Shalish", pos: 4 },
		"Hagal":           { system: "Theta Shaowei", pos: 2 },
		"Grumman":         { system: "Psi Draconis", pos: 2 },
		"Gamont":          { system: "Psi Draconis", pos: 3 },
		"Corrin":          { system: "Sigma Draconis", pos: 6 },
		"Kaitain":         { system: "Alpha Piscium", pos: 3 },
		// Sistema Solar: al-Lat
		"Vulcanis":        { system: "Al-Lat", pos: 2 },
		"Tierra":          { system: "Al-Lat", pos: 3 },
		"Jupiter":         { system: "Al-Lat", pos: 5 },
		"Saturno":         { system: "Al-Lat", pos: 6 },
    },
    // Exact orbit overrides (optional):
    orbitOverrides: {
		"Canopus": {
			"Seban":   { orbitR: 150, orbitSpeed: 0.00125 },
			"Menaris": { orbitR: 240, orbitSpeed: 0.00090 },
			"Arrakis": { orbitR: 330, orbitSpeed: 0.00068 },
			"Extaris": { orbitR: 420, orbitSpeed: 0.00055 },
			"Ven":     { orbitR: 560, orbitSpeed: 0.00033 },
			"Revona":  { orbitR: 820, orbitSpeed: 0.00018 }
		},
		"Al-Lat": {
			"vulcanis":{ orbitR: 190, orbitSpeed: 0.00120 },
			"Tierra":  { orbitR: 220, orbitSpeed: 0.00090 },
			"Jupiter": { orbitR: 520, orbitSpeed: 0.00040 },
			"Saturno": { orbitR: 610, orbitSpeed: 0.00045 }
		}
	},
    // Moon overrides (optional):
    moonOverrides: {
		"Arrakis": [
			{ name:"Krelln", kind:"moon", radius: 1.35, orbitR: 14.5, orbitSpeed: 0.060, rotSpeed: 0.010, jsonFile: "krelln.json", atmo:false, rocky:true },
			{ name:"Arvon",  kind:"moon", radius: 0.95, orbitR: 10.2, orbitSpeed: 0.085, rotSpeed: 0.012, jsonFile: "arvon.json", atmo:false, rocky:true, alias:["Muad'Dib"] }
		],
		"Extaris": [
			{ name:"Aja",    kind:"moon", radius: 0.82, orbitR: 10.0, orbitSpeed: 0.090, rotSpeed: 0.012, atmo:false, rocky:true },
			{ name:"Dreko",  kind:"moon", radius: 0.65, orbitR: 14.0, orbitSpeed: 0.075, rotSpeed: 0.011, atmo:false, rocky:true },
			{ name:"Namar",  kind:"moon", radius: 0.58, orbitR: 18.5, orbitSpeed: 0.062, rotSpeed: 0.010, atmo:false, rocky:true },
			{ name:"Sesh",   kind:"moon", radius: 0.52, orbitR: 23.0, orbitSpeed: 0.053, rotSpeed: 0.010, atmo:false, rocky:true },
			{ name:"Vala",   kind:"moon", radius: 0.47, orbitR: 28.0, orbitSpeed: 0.047, rotSpeed: 0.009, atmo:false, rocky:true }
		],
		"Revona": [
			{ name:"Laran",  kind:"moon", radius: 0.74, orbitR: 12.0, orbitSpeed: 0.070, rotSpeed: 0.011, atmo:false, rocky:true }
		],
		"Tierra": [
			{ name:"Luna",  kind:"moon", radius: 0.50, orbitR: 12.0, orbitSpeed: 0.070, rotSpeed: 0.011, jsonFile: "luna.json", atmo:false, rocky:true }
		]
	},

    // Optional: fixed system properties
    systemProps: {
      // Units: 1 light-year = 1000 scene units (tweak to taste)
      __LY: 1000,

      // Coordinate frame:
      //  - Old Earth / Sol (Al-Lat) is (0,0,0)
      //  - X: right, Y: up/down (vertical), Z: "to the back" (depth), 

      // --- Old Earth Cluster (from your 10 ly map) ---
      "Al-Lat":           { posLY: new BABYLON.Vector3(   0.000,    0.000,   0.000), speedScale: 6 },  // Old Earth / Sol
      "Alpha Centauri B": { posLY: new BABYLON.Vector3(  -1.400,    0.000,   4.244), speedScale: 6 },  // Ecaz
	  //"Epsilon Eridani": Keid, Rodale, Alkalurops 3 estrellas
      "Eridani A":        { posLY: new BABYLON.Vector3(  17.166,    0.000,   2.192), speedScale: 6 },  // Richese
      "Alkalurops":       { posLY: new BABYLON.Vector3(  16.500,    0.000,   0.000), speedScale: 6 },  // Ix
      "Delta Pavonis":    { posLY: new BABYLON.Vector3(  -4.811,   20.343,  -2.143), speedScale: 6 },  // Caladan & Harmonthep
      "36 Ophiuchi B":    { posLY: new BABYLON.Vector3( -17.172,    0.000,   9.997), speedScale: 6 },  // Giedi Prime / Gammu
      "70 Ophiuchi A":    { posLY: new BABYLON.Vector3( -16.850,    0.000,  -0.331), speedScale: 6 },  // Sikun (node in map)
      "Sigma Draconis":   { posLY: new BABYLON.Vector3(  -5.200,  -16.800,  -1.884), speedScale: 6 },  // Corrin

      // --- 3D offsets from the "Central Planets of the Imperium" map ---
	  "Alpha Piscium":    { posLY: new BABYLON.Vector3(  -3.200,    0.000,   0.500), speedScale: 6 },  // Kaitain (cerca del cluster)
	  "Gamma Waiping":    { posLY: new BABYLON.Vector3( -90.300,    0.000,  21.200), speedScale: 6 },  // Salusa Secundus (plano)
	  "Theta Shalish":    { posLY: new BABYLON.Vector3(-193.400,    0.000,   0.400), speedScale: 6 },  // Chusuk (muy a la izquierda)
	  "Thalim":           { posLY: new BABYLON.Vector3( -39.600,   70.000,  63.900), speedScale: 6 },  // Tleilax (elevado)
	  "Kuentsing":        { posLY: new BABYLON.Vector3(  14.400,   55.000,  40.700), speedScale: 6 },  // Bela Tegeuse (elevado)
	  "Laoujin":          { posLY: new BABYLON.Vector3(  46.600,  120.000,  28.000), speedScale: 6 },  // Wallach IX (más alto)
	  "Alces Minor":      { posLY: new BABYLON.Vector3(  78.300,    0.000,  14.700), speedScale: 6 },  // Rossak (plano, derecha) - HD95424
	  "Epsilon Alangue":  { posLY: new BABYLON.Vector3(  -2.600,    0.000,  -8.800), speedScale: 6 },  // Poritrin (cerca del cluster)
	  "Psi Draconis":     { posLY: new BABYLON.Vector3(   7.200,  -30.000,  -7.300), speedScale: 6 },  // Gammu & Grumman (ligeramente bajo)
	  "Theta Shaowei":    { posLY: new BABYLON.Vector3(  67.800,    0.000, -33.100), speedScale: 6 },  // Hagal (plano, derecha-bajo)
      "Canopus":          { posLY: new BABYLON.Vector3(  17.000,  226.000, 198.000), speedScale: 6 },  // Arrakis
      "Beta Lyncis":      { posLY: new BABYLON.Vector3( 150.000,-250.5000,215.0000), speedScale: 6 },  // Ishia - HD58661
      "Unsidor":          { posLY: new BABYLON.Vector3(  62.400, -125.650, 112.558), speedScale: 6 },
      "Thonaris":         { posLY: new BABYLON.Vector3(  84.400, -139.650,  96.558), speedScale: 6 },
      "Yondair":          { posLY: new BABYLON.Vector3(  74.400, -118.650, 106.558), speedScale: 6 },	  
    },
	    // Stars by systemId (can later be multi-star per system):
    systemStars: {
		"Canopus":            { name: "Canopus", kind: "sun", radius: 50, emissive: new BABYLON.Color3(1.0,0.92,0.70) },
		"Delta Pavonis":      { name: "Delta Pavonis", kind: "sun", radius: 32, emissive: new BABYLON.Color3(1.0,0.86,0.65) },
		"36 Ophiuchi B":      { name: "36 Ophiuchi B", kind: "sun", radius: 30, emissive: new BABYLON.Color3(1.0,0.90,0.70) },
		"Alkalurops":         { name: "Alkalurops", kind: "sun", radius: 30, emissive: new BABYLON.Color3(0.92,0.95,1.0) },
		"Eridani A":          { name: "Eridani A", kind: "sun", radius: 28, emissive: new BABYLON.Color3(1.0,0.92,0.75) },
		"Alpha Centauri B":   { name: "Alpha Centauri B", kind: "sun", radius: 34, emissive: new BABYLON.Color3(1.0,0.84,0.60) },
		"Laoujin":            { name: "Laoujin", kind: "sun", radius: 26, emissive: new BABYLON.Color3(0.95,0.92,0.78) },
		"Thalim":             { name: "Thalim", kind: "sun", radius: 26, emissive: new BABYLON.Color3(1.0,0.70,0.55) },
		"Gamma Waiping":      { name: "Gamma Waiping", kind: "sun", radius: 29, emissive: new BABYLON.Color3(1.0,0.94,0.80) },
		"Kuentsing":          { name: "Kuentsing", kind: "sun", radius: 27, emissive: new BABYLON.Color3(0.95,0.88,0.70) },
		"Epsilon Alangue":    { name: "Epsilon Alangue", kind: "sun", radius: 28, emissive: new BABYLON.Color3(0.90,0.92,1.0) },
		"Theta Shalish":      { name: "Theta Shalish", kind: "sun", radius: 28, emissive: new BABYLON.Color3(1.0,0.82,0.60) },
		"Theta Shaowei":      { name: "Theta Shaowei", kind: "sun", radius: 25, emissive: new BABYLON.Color3(0.95,0.78,0.55) },
		"Psi Draconis":       { name: "Psi Draconis", kind: "sun", radius: 27, emissive: new BABYLON.Color3(0.95,0.90,0.82) },
		"Sigma Draconis":     { name: "Sigma Draconis", kind: "sun", radius: 42, emissive: new BABYLON.Color3(1.0,0.60,0.45) },
		"Al-Lat": 			  { name: "Al-Lat", kind: "sun", radius: 20, emissive: new BABYLON.Color3(0.95,0.90,0.78) },
		"Beta Lyncis":        { name: "Beta Lyncis", kind: "sun", radius: 30, emissive: new BABYLON.Color3(0.95,0.90,0.78) },
		"Alces Minor":        { name: "Alces Minor", kind: "sun", radius: 30, emissive: new BABYLON.Color3(0.95,0.90,0.78) },
		"70 Ophiuchi A":      { name: "70 Ophiuchi A", kind: "sun", radius: 34, emissive: new BABYLON.Color3(1.0,0.84,0.60) },
		"Alpha Piscium":      { name: "Alpha Piscium", kind: "sun", radius: 26, emissive: new BABYLON.Color3(0.95,0.92,0.78) },
		"Unsidor":            { name: "Unsidor", kind: "sun", radius: 29, emissive: new BABYLON.Color3(1.0,0.94,0.80) },
        "Thonaris":           { name: "Thonaris", kind: "sun", radius: 42, emissive: new BABYLON.Color3(1.0,0.60,0.45) },
        "Yondair":            { name: "Yondair", kind: "sun", radius: 26, emissive: new BABYLON.Color3(0.95,0.92,0.78) },
	},
  },
];

// ---------------------------------------------------
// Expand catalog entry into normalized entities
// ---------------------------------------------------
const expandCatalog = (list) => {
  const out = [];
  for (const e of list) {
    if (!e || e.kind !== "catalog") {
      out.push(e);
      continue;
    }

    const planets = e.planets || {};
    const systemStars = e.systemStars || {};
    const rawBodies = e.rawBodies || [];
    const hints = e.hints || {};
    const orbitOverrides = e.orbitOverrides || {};
    const moonOverrides = e.moonOverrides || {};
    const systemProps = e.systemProps || {};
	
    const __LY = (typeof systemProps.__LY === "number" ? systemProps.__LY : 10);

    const normalizeBase = (name) => {
      if (typeof name !== "string") return "";
      return name.trim().replace(/\s*\(.*\)\s*$/, "").trim();
    };

    // ---------------------------------------------------
    // Auto-bucket: 1 system per 4 planets (for any unhinted planets)
    //   - Far from center
    //   - Far from each other
    // Deterministic: depends only on input order.
    // ---------------------------------------------------
    const autoHints = new Map();

    // Build a placement pool:
    //  - any catalog planet without explicit system AND without hint
    //  - any rawBodies planet without hint
    // One system per 4 planets.
    const placementPool = [];
    const addPool = (name) => {
      const base = normalizeBase(name);
      if (!base) return;
      if (hints[base]?.system) return;
      if (placementPool.includes(base)) return;
      placementPool.push(base);
    };

    // 1) Catalog planets missing placement
    for (const [pName, pDef0] of Object.entries(planets)) {
      if (pDef0?.systemId || pDef0?.system) continue;
      addPool(pName);
    }

    // 2) Raw bodies missing placement
    for (const raw0 of rawBodies) {
      if (typeof raw0 !== "string") continue;
      const raw = raw0.trim();
      if (!raw || raw.startsWith("SYS:")) continue;
      addPool(raw);
    }

    const outerSystemIds = [];
    const outerSystemIndex = new Map();
    const OUTER_GROUP = 4;
    const outerCount = Math.ceil(placementPool.length / OUTER_GROUP);

    for (let i = 0; i < outerCount; i++) {
      const sid = `Outer-${String(i + 1).padStart(3, "0")}`;
      outerSystemIds.push(sid);
      outerSystemIndex.set(sid, i);
      const start = i * OUTER_GROUP;
      for (let k = 0; k < OUTER_GROUP; k++) {
        const p = placementPool[start + k];
        if (!p) break;
        autoHints.set(p, { system: sid, pos: (k + 1) });
      }
    }

    // Systems + Stars (multi-star ready)
    const systemIds = new Set(Object.keys(systemStars));
    // also ensure systems from hints and SYS: raw entries exist
    for (const [pName, h] of Object.entries(hints)) {
      if (h?.system) systemIds.add(h.system);
    }
	for (const sid of outerSystemIds) systemIds.add(sid);
    for (const raw of rawBodies) {
      if (typeof raw === "string" && raw.trim().startsWith("SYS:")) {
        systemIds.add(raw.replace(/^SYS:\s*/i, "").trim());
      }
    }

    // create systems
    for (const sid of systemIds) {
      const props = systemProps[sid] || {};

      // Auto positions for Outer-* systems (far & spaced)
      let autoPosLY = null;
      if (outerSystemIndex.has(sid) && !props.pos && !props.posLY) {
        const i = outerSystemIndex.get(sid);
        // golden-angle spiral in XZ + layered Y
        const GA = 2.399963229728653; // radians
        const theta = i * GA;
        const r = 100 + i * 52; // ly, grows => separation
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = (((i % 9) - 4) * 220) + ((i % 2) ? 180 : -180);
        autoPosLY = new BABYLON.Vector3(x, y, z);
      }

      out.push({
        kind: "system",
        id: sid,
        speedScale: props.speedScale,
        pos: (
          props.pos ||
          (props.posLY ? props.posLY.scale(__LY) : (autoPosLY ? autoPosLY.scale(__LY) : undefined))
        ),
     });

      // create star(s) for system
      const sDef = systemStars[sid];
      if (sDef) {
        out.push({
          kind: "star",
          id: sid + ":A",
          systemId: sid,
          primary: true,
          ...sDef
        });
      } else {
        // fallback star
        out.push({
          kind: "star",
          id: sid + ":A",
          systemId: sid,
          primary: true,
          name: sid,
          kind: "sun",
          radius: 24 + _rand01("star:"+sid) * 12,
          emissive: new BABYLON.Color3(0.95, 0.92, 0.78),
        });
      }
    }

    // Planets from overrides (full)
    const existingPlanets = new Set();
    for (const [pName, pDef0] of Object.entries(planets)) {
      const h = hints[pName] || autoHints.get(pName) || null;
      const systemId = pDef0.systemId || pDef0.system || h?.system || DEFAULT_SYSTEM;
      const orbitIndex = pDef0.orbitIndex || h?.pos || null;

      const oo = orbitOverrides[systemId] ? orbitOverrides[systemId][pName] : null;

      out.push({
        kind: "planet",
        name: pName,
        systemId,
        orbitIndex,
        orbitR: oo?.orbitR ?? pDef0.orbitR,
        orbitSpeed: oo?.orbitSpeed ?? pDef0.orbitSpeed,
        ...pDef0
      });
      existingPlanets.add(pName);

      // moons (as entities)
      const moons = (Array.isArray(pDef0.moons) ? pDef0.moons : moonOverrides[pName]) || null;
      if (Array.isArray(moons)) {
        for (const m of moons) {
          out.push({
            kind: "moon",
            name: m.name,
            systemId,
            parentId: pName,
            ...m
          });
        }
      }
    }

    // Extra planets from rawBodies list (minimal entries)
    for (const raw0 of rawBodies) {
      if (typeof raw0 !== "string") continue;
      const raw = raw0.trim();
      if (!raw || raw.startsWith("SYS:")) continue;

      // normalize name: strip parenthesis
      const base = normalizeBase(raw);
      if (!base || existingPlanets.has(base)) continue;

      const h = hints[base] || autoHints.get(base) || null;
      out.push({
        kind: "planet",
        name: base,
        systemId: h?.system || DEFAULT_SYSTEM,
        orbitIndex: h?.pos || null,
        tags: [],
      });
      existingPlanets.add(base);
    }

    // You can later put ships right into GALAXY_LIST (no changes needed)
  }
  return out.filter(Boolean);
};

const ENTITIES = expandCatalog(GALAXY_LIST);

// Emit a sanity report early (console + optional UI)
_validateBuild(ENTITIES);


// ---------------------------------------------------
// Build fast lookups (single source: ENTITIES)
// ---------------------------------------------------
const systemsById = new Map();
const starsBySystem = new Map();
const planetEntities = [];
const moonEntities = [];
const shipEntities = [];

for (const e of ENTITIES) {
  if (!e || !e.kind) continue;
  if (e.kind === "system") {
    systemsById.set(e.id, {
      id: e.id,
      speedScale: e.speedScale,
      pos: e.pos,
      star: null,
      stars: [],
      planets: [],
      moons: [],
      ships: [],
      _planetRaw: [],
      _moonRaw: [],
    });
  } else if (e.kind === "star") {
    if (!starsBySystem.has(e.systemId)) starsBySystem.set(e.systemId, []);
    starsBySystem.get(e.systemId).push(e);
  } else if (e.kind === "planet") {
    planetEntities.push(e);
  } else if (e.kind === "moon") {
    moonEntities.push(e);
  } else if (e.kind === "ship") {
    shipEntities.push(e);
  }
}

// Ensure systems exist for any referenced systemId
for (const p of planetEntities) {
  const sid = p.systemId || DEFAULT_SYSTEM;
  if (!systemsById.has(sid)) {
    systemsById.set(sid, {
      id: sid, speedScale: 6, pos: null, star: null, stars: [], planets: [], moons: [], ships: [],
      _planetRaw: [], _moonRaw: []
    });
  }
}
for (const m of moonEntities) {
  const sid = m.systemId || DEFAULT_SYSTEM;
  if (!systemsById.has(sid)) {
    systemsById.set(sid, {
      id: sid, speedScale: 6, pos: null, star: null, stars: [], planets: [], moons: [], ships: [],
      _planetRaw: [], _moonRaw: []
    });
  }
}

// Attach stars
for (const [sid, s] of systemsById.entries()) {
  const stars = (starsBySystem.get(sid) || []).slice();
  stars.sort((a,b)=> (b.primary?1:0) - (a.primary?1:0)); // primary first
  s.stars = stars;
  s.star = stars[0] || {
    name: sid, kind:"sun", radius: 24 + _rand01("star:"+sid)*12, emissive: new BABYLON.Color3(0.95,0.92,0.78)
  };
  if (!s.speedScale) s.speedScale = (sid === "Canopus" ? 1 : 6);
}

// Assign positions for systems without pos (simple ring)
const systems = Array.from(systemsById.values());

// --- AUTO RING AROUND ALL KNOWN WORLDS ---
// Tune these two to bring invented systems closer/farther:
const AUTO_RING_MARGIN_RATIO = 0.01;   // 10% of galaxy radius
const AUTO_RING_MIN_MARGIN   = 10000;  // minimum extra distance (scene units)

const positioned = systems.filter(s => s.pos);
let center = new BABYLON.Vector3(0,0,0);
if (positioned.length) {
  for (const s of positioned) center.addInPlace(s.pos);
  center.scaleInPlace(1 / positioned.length);
}

let maxR = 0;
for (const s of positioned) {
  const d = BABYLON.Vector3.Distance(center, s.pos);
  if (d > maxR) maxR = d;
}

// Ring radius large enough to enclose all positioned systems
const ringR = positioned.length
  ? (maxR + Math.max(AUTO_RING_MIN_MARGIN, maxR * AUTO_RING_MARGIN_RATIO))
  : 2200;

const auto = systems.filter(s => !s.pos);
for (let i=0;i<auto.length;i++) {
  const s = auto[i];
  const a = (i / Math.max(1, auto.length)) * Math.PI * 2;
  // spread a little in Y so it's actually 3D
  const y = ((i % 7) - 3) * Math.max(60, ringR * 0.01);
  s.pos = center.add(new BABYLON.Vector3(
    Math.cos(a) * ringR,
    y,
    Math.sin(a) * ringR
  ));
}

// PLANET_OVERRIDES map (planet entity contains ALL visuals; no other lists)
const PLANET_OVERRIDES = Object.create(null);
for (const p of planetEntities) {
  // copy without system wiring
  const c = { ...p };
  delete c.kind;
  delete c.systemId;
  delete c.orbitIndex;
  delete c.orbitR;
  delete c.orbitSpeed;
  PLANET_OVERRIDES[p.name] = c;
}

// Build planets per system using makePlanetDef (keeps your existing shader/tag/meta logic)
for (const p of planetEntities) {
  const sid = p.systemId || DEFAULT_SYSTEM;
  systemsById.get(sid)._planetRaw.push(p);
}
for (const m of moonEntities) {
  const sid = m.systemId || DEFAULT_SYSTEM;
  systemsById.get(sid)._moonRaw.push(m);
}
for (const sh of shipEntities) {
  const sid = sh.systemId || DEFAULT_SYSTEM;
  if (systemsById.has(sid)) systemsById.get(sid).ships.push(sh);
}

for (const s of systemsById.values()) {
  const planetsRaw = s._planetRaw.slice().sort((a,b)=> (a.orbitIndex ?? 999) - (b.orbitIndex ?? 999));
  const used = new Set();
  s.planets = [];

  for (let i=0;i<planetsRaw.length;i++) {
    const p = planetsRaw[i];
    let idx = p.orbitIndex ?? (i+1);
    while (used.has(idx)) idx++;
    used.add(idx);

    const overrides = {};
    if (typeof p.orbitR === "number") overrides.orbitR = p.orbitR;
    if (typeof p.orbitSpeed === "number") overrides.orbitSpeed = p.orbitSpeed;

    s.planets.push(makePlanetDef(p.name, idx, overrides));
  }

  // Ensure planets/moons are independent: each orbits a parent body
  // - planets orbit the system star
  // - moons orbit the parent planet (already in m.parent)
  for (const p of (s.planets||[])) {
    p.systemId = s.id;
    p.parent = s.star ? s.star.name : null;
  }

  // moons
  s.moons = [];
  const moonsRaw = s._moonRaw.slice();
  for (let mi=0; mi<moonsRaw.length; mi++) {
    const m = moonsRaw[mi];
    if (m.radius != null && m.orbitR != null) {
      const mm = { ...m };
      delete mm.kind;
      // normalize to legacy fields
      mm.parent = m.parentId;
      delete mm.parentId;
      s.moons.push(mm);
    } else {
      s.moons.push(makeMoonDef(m.name || ("Moon"+mi), m.parentId || (s.planets[0]?.name), mi));
    }
  }

  // Tag moons with systemId (lighting/shadows helpers)
  for (const m of (s.moons||[])) {
    m.systemId = s.id;
  }

  delete s._planetRaw;
  delete s._moonRaw;
}

// Canopus first (legacy)
systems.sort((a,b)=> (a.id==="Canopus"?-1:b.id==="Canopus"?1:a.id.localeCompare(b.id)));

const extraSystems = systems;
const coreSystem = extraSystems.find(s => s.id === "Canopus") || extraSystems[0];

const bodyDefs = [ coreSystem.star, ...coreSystem.planets, ...coreSystem.moons ];

// systemStars map kept for compatibility (primary star per system)
const systemStars = Object.fromEntries(extraSystems.map(s => [s.id, s.star]));

return {
  coreSystem,
  extraSystems,
  bodyDefs,
  planetCatalog: PLANET_OVERRIDES,
  systemStars,
};
}
