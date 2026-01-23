// src/galaxy/systems.js
// Star-system data + builders (extracted from main.js).
// Uses global BABYLON (CDN) so the project stays plain HTML/CSS/JS.

export function buildSystems(T) {
// DUNE GALAXY (data-driven)
// - Objetivo: que NINGÚN planeta quede "suelto" sin sistema/estrella.
// - Si no hay referencia fiable del sistema/estrella, lo asignamos a
//   un sistema "Outer-XX" (inventado) para mantener coherencia.
// - Esta capa SOLO construye defs visuales (radius/orbitR/orbitSpeed/etc.).
// ====================================================================

// ---- util: hash determinista para que los valores pseudo-random sean estables ----
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

// ---- presets por planeta (cuando sí sabemos "qué aspecto" debe tener) ----
const DUNE_PLANET_OVERRIDES = {
  // Canon-ish clave
  // Arrakis: órbita excéntrica + anillo tenue de polvo (tercera luna destruida, Dune Encyclopedia)
  // y rotación prógrada (como la Tierra): el sol “sale por el Este”
  "Arrakis":          { radius: 6.2, biomePreset: "desert_dunes", seaLevel: 0.01, ocean: false,
                        orbitEcc: 0.18,
                        rotSpeed: 0.080,         // <--- prógrado (como la Tierra)
                        rings: true, ringTex: "proc:dust",
                        ringAlpha: 0.22,          // muy poco apreciable
                        ringRadiusMul: 2.55,      // anillo cercano y fino
                        ringTilt: 0.10,           // leve inclinación
                        atmo: true,
                        atmoColor: new BABYLON.Color3(0.86,0.74,0.49), // tenue y polvorienta
                        atmoAlpha: 0.10,
                        atmoOpts: {
                          miePower: 7.5,
                          mieStrength: 0.55,
                          pathPower: 2.2,
                          pathStrength: 0.22,
                          noiseStrength: 0.10,
                          segments: 32
                        },
                        atmoLayers: [
                          { mul: 1.112, aMul: 0.80, rimPower: 3.0, terminatorSoftness: 0.16, nightMin: 0.03, mieStrength: 0.20, pathStrength: 0.28, layerFade: 1.00 },
                          { mul: 1.125, aMul: 1.00, rimPower: 4.6, terminatorSoftness: 0.22, nightMin: 0.06, mieStrength: 0.55, pathStrength: 0.22, layerFade: 0.85 },
                          { mul: 1.180, aMul: 0.45, rimPower: 6.2, terminatorSoftness: 0.30, nightMin: 0.08, mieStrength: 0.75, pathStrength: 0.10, layerFade: 0.55 }
                        ],
                        terrainScale: 0.20, noiseFrequency: 2.6, noiseOctaves: 6, farSegments: 48,
                        microBump: T("detail_rock3.png") },
		// Canopus (6 planetas): detalle visual según tu última descripción
  "Seban":            { radius: 4.0, biomePreset: "harsh_badlands",  seaLevel: 0.02,  ocean: false,
                        terrainScale: 0.18, noiseFrequency: 3.4, noiseOctaves: 6, farSegments: 40,
                        rings: true, ringTex: "proc:ion" }, // nube tenue de metales ionizados
  "Menaris":          { radius: 5.1, biomePreset: "imperial_temperate", seaLevel: -0.01, ocean: true,
                        oceanColor: new BABYLON.Color3(0.05,0.15,0.22), terrainScale: 0.12,
                        noiseFrequency: 2.4, noiseOctaves: 6, farSegments: 42 }, // “gemelo” de Extaris
  "Extaris":          { radius: 4.4, biomePreset: "techno_frost",      seaLevel: 0.02,  ocean: false,
                        terrainScale: 0.16, noiseFrequency: 2.8, noiseOctaves: 6, farSegments: 40 }, // pequeño exterior, 5 lunas
  "Ven":              { radius: 12.0,
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
                        atmo: true,
                        atmoColor: new BABYLON.Color3(0.95,0.55,0.70),
                        atmoAlpha: 0.42 }, // gigante rosado gaseoso (casi “estrella fallida”)
  "Revona":           { radius: 6.6, biomePreset: "imperial_temperate", seaLevel: -0.02, ocean: true,
                        oceanColor: new BABYLON.Color3(0.04,0.12,0.24), terrainScale: 0.10,
                        noiseFrequency: 2.1, noiseOctaves: 6, farSegments: 48 }, // muy exterior, con Laran
  "Caladan":          { radius: 7.0, biomePreset: "oceanic_temperate", seaLevel: 0.0355, ocean: true,  oceanColor: new BABYLON.Color3(0.04,0.20,0.30), terrainScale: 0.13, noiseFrequency: 2.1, noiseOctaves: 6, farSegments: 52, microBump: T("detail_craters.png") },
  "Giedi Prime":      { radius: 6.6, biomePreset: "industrial_toxic",   seaLevel: 0.008,  ocean: true,  oceanColor: new BABYLON.Color3(0.02,0.08,0.05), terrainScale: 0.20, noiseFrequency: 3.2, noiseOctaves: 5, farSegments: 50, microBump: T("detail_rock2.png") },
  "Ix":               { radius: 5.9, biomePreset: "techno_frost",      seaLevel: -0.012, ocean: true,  oceanColor: new BABYLON.Color3(0.03,0.12,0.18), terrainScale: 0.16, noiseFrequency: 2.7, noiseOctaves: 6, farSegments: 48, microBump: T("detail_snow.png") },
  "Richese":          { radius: 6.4, biomePreset: "archipelago_turquoise", seaLevel: -0.0125, ocean: true, oceanColor: new BABYLON.Color3(0.05,0.26,0.30), terrainScale: 0.11, noiseFrequency: 2.0, noiseOctaves: 6, farSegments: 52, microBump: T("detail_craters.png"),
                       continentFreq: 0.55, continentStrength: 0.55, islandsFreq: 4.8, islandsStrength: 0.22 },
  "Kaitain":          { radius: 6.3, biomePreset: "imperial_temperate",  seaLevel: -0.022, ocean: true,  oceanColor: new BABYLON.Color3(0.04,0.18,0.26), terrainScale: 0.12, noiseFrequency: 2.2, noiseOctaves: 6, farSegments: 50, microBump: T("detail_craters.png") },
  "Salusa Secundus":  { radius: 6.0, biomePreset: "harsh_badlands",   seaLevel: 0.01,   ocean: false, terrainScale: 0.24, noiseFrequency: 3.0, noiseOctaves: 6, farSegments: 48, microBump: T("detail_rock3.png") },
  "Wallach IX":       { radius: 5.0, biomePreset: "imperial_temperate",  seaLevel: -0.01,  ocean: true,  terrainScale: 0.12, noiseFrequency: 2.2, noiseOctaves: 6, farSegments: 36 },
  "Tleilax":          { radius: 4.9, biomePreset: "industrial_toxic",    seaLevel: 0.02,   ocean: false, terrainScale: 0.18, noiseFrequency: 2.8, noiseOctaves: 6, farSegments: 32 },
  "Rossak":           { radius: 4.8, biomePreset: "industrial_toxic",    seaLevel: 0.02,   ocean: false, terrainScale: 0.19, noiseFrequency: 2.6, noiseOctaves: 6, farSegments: 32 },
  "Buzzell":          { radius: 4.6, biomePreset: "oceanic_temperate",  seaLevel: -0.02,  ocean: true,  terrainScale: 0.12, noiseFrequency: 2.0, noiseOctaves: 6, farSegments: 32 },
  "Lampadas":         { radius: 4.7, biomePreset: "imperial_temperate",  seaLevel: -0.015, ocean: true,  terrainScale: 0.12, noiseFrequency: 2.1, noiseOctaves: 6, farSegments: 32 },
  // Extra "no-canon" útil para tu demo (lava)
        "Vulcanis":         { radius: 6.1, biomePreset: "lava_world", seaLevel: -0.098, ocean: true, oceanKind: "lava", lavaIntensity: 2.0, lavaFlowSpeed: 0.06,
                       lavaColor: new BABYLON.Color3(1.0, 0.35, 0.08), terrainScale: 0.20, noiseFrequency: 2.9, noiseOctaves: 6, farSegments: 52, microBump: T("detail_rock2.png") },
};
	  
// ===================================================
// DUNE: meta por planeta (tu descripción/lore)
// - Añade tags por planeta y el look se ajusta solo
// - Puedes ampliar esta tabla cuando quieras
// ===================================================
const DUNE_PLANET_META = {
  // --- Canopus (tu lista de 6) ---
  "Seban":   { tags:["rocky","hot","inner"], production:["minerals"] },
  "Menaris": { tags:["rocky","temperate"], production:["agri"] },
  "Arrakis": { tags:["desert","spice","extreme"], house:"Atreides/Fremen", production:["melange"] },
  "Extaris": { tags:["rocky","dry"], production:["silicates"] },
  "Ven": { tags:["gas-giant","pink","storms"], production:["helium","hydrogen"] },
  "Revona":  { tags:["ocean","cold","fjords"], production:["whale-products"] },

  // --- Claves (tu inicio) ---
  "Caladan": { tags:["ocean","stormy","forest"], house:"Atreides", production:["rice","fish"] },
  "Giedi Prime": { tags:["industrial","polluted"], house:"Harkonnen", production:["heavy-industry"] },
  "Salusa Secundus": { tags:["prison","harsh","military"], house:"Corrino", production:["sardaukar"] },
  "Kaitain": { tags:["imperial","engineered-climate","temperate"], house:"Corrino", production:["court","landsraad"] },

  "Ix": { tags:["tech","subsurface","dry"], production:["complex-machines"] },
  "Richese": { tags:["tech","ocean","miniaturization","archipelago"], production:["miniaturized-tech"] },
  "Tleilax": { tags:["secretive","dry","bioengineering"], production:["genetics","face-dancers","mentats"] },
  "Wallach IX": { tags:["bg","austere","humid"], production:["training"] },
  "Ginaz": { tags:["islands","tropical","martial"], production:["swordmasters"] },
  "Ecaz": { tags:["jungle","fog","lush"], production:["drugs","medicine","mimetic-wood"] },
  "Chusuk": { tags:["forest","cultural","musical"], production:["instruments"] },

  // Otros que mencionaste
  "Hagal": { tags:["crystal","mining","jewel"], production:["quartz"] },
  "Gamont": { tags:["hedonism","urban","humid"], production:["pleasure-tourism"] },
  "Grumman": { tags:["mining","fortress","harsh"], production:["minerals"] },
  "Poritrin": { tags:["river","hot","slavery"], production:["commerce"] },
  "Bela Tegeuse": { tags:["rain","fog","low-light"], production:["hydroponics"] },
  "Lankiveil": { tags:["cold","fjords","ocean","whaling"], production:["whale-products"] },
  "Lampadas": { tags:["bg","school","ruins","ash"], production:["archives"] },
  "Buzzell": { tags:["ocean","punishment","storms"], production:["soopstones"] },
  "Rossak": { tags:["toxic","jungle","pharma","mystic"], production:["pharmaceuticals"] },
  "Corrin": { tags:["red-sun","battlefield","toxic"], production:["history"] },
  "Tanegaard": { tags:["bureaucracy","monolithic","temperate"], production:["CHOAM"] },
  "Conexión": { tags:["shipyard","marsh","industrial"], production:["guild-hub"] },
  "Kolhar": { tags:["cold","plains","shipyard"], production:["guild-origin"] },
};

// ===================================================
// Tags → look (aquí conviertes “descripciones” en visual)
// ===================================================
function applyDuneTags(def, tags = []) {
  const t = new Set(tags);

  // defaults razonables (para planetas genéricos)
  def.rocky = true;
  def.terrainScale ??= 0.15;
  def.noiseFrequency ??= 2.6;
  def.noiseOctaves ??= 6;
  def.farSegments ??= 24;
  def.microBump ??= T("detail_craters.png");
		
  // ---- gas giant ----
  if (t.has("gas-giant")) {
    def.rocky = false;
    def.ocean = false;
    def.seaLevel = 0.02;
    def.terrainScale = 0.03;
    def.noiseFrequency = 1.1;
    def.noiseOctaves = 4;
    def.farSegments = Math.max(def.farSegments || 36, 56);

    // atmósfera muy visible (solo cerca)
    /*def.atmo = true;
    def.atmoAlpha ??= 0.42;
    def.atmoPower ??= 2.6;
    // rosado suave si aplica
    if (t.has("pink")) def.atmoColor ??= new BABYLON.Color3(0.95,0.55,0.70);*/
  }

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
  const meta = DUNE_PLANET_META[def.name];
  if (!meta) return;
  applyDuneTags(def, meta.tags || []);
  // Opcional: guarda lore para UI/tooltips si luego lo quieres mostrar
  if (meta.house) def.house = meta.house;
  if (meta.production) def.production = meta.production;
}


// ---- sistemas/estrellas conocidas (si no está aquí => inventamos) ----
const DUNE_SYSTEM_STAR = {
  "Canopus":            { name: "Canopus", kind: "sun", radius: 50, emissive: new BABYLON.Color3(1.0,0.92,0.70) },
  "Delta Pavonis":      { name: "Delta Pavonis", kind: "sun", radius: 32, emissive: new BABYLON.Color3(1.0,0.86,0.65) },
  "36 Ophiuchi B":      { name: "36 Ophiuchi B", kind: "sun", radius: 30, emissive: new BABYLON.Color3(1.0,0.90,0.70) },
  "IX Eridani":         { name: "IX Eridani", kind: "sun", radius: 30, emissive: new BABYLON.Color3(0.92,0.95,1.0) },
  "Eridani A":          { name: "Eridani A", kind: "sun", radius: 28, emissive: new BABYLON.Color3(1.0,0.92,0.75) },
  "Alpha Centauri B":   { name: "Alpha Centauri B", kind: "sun", radius: 34, emissive: new BABYLON.Color3(1.0,0.84,0.60) },
  "Laoujin":            { name: "Laoujin", kind: "sun", radius: 26, emissive: new BABYLON.Color3(0.95,0.92,0.78) },
  "Thalim":             { name: "Thalim", kind: "sun", radius: 26, emissive: new BABYLON.Color3(1.0,0.70,0.55) },
  "Gamma Waiping":      { name: "Gamma Waiping", kind: "sun", radius: 29, emissive: new BABYLON.Color3(1.0,0.94,0.80) },
  "Kuentsing":          { name: "Kuentsing", kind: "sun", radius: 27, emissive: new BABYLON.Color3(0.95,0.88,0.70) },
  "Epsilon Alangue":    { name: "Epsilon Alangue", kind: "sun", radius: 28, emissive: new BABYLON.Color3(0.90,0.92,1.0) },
  "Theta Shalish":      { name: "Theta Shalish", kind: "sun", radius: 28, emissive: new BABYLON.Color3(1.0,0.82,0.60) },
  "Theta Shaowewei":    { name: "Theta Shaowewei", kind: "sun", radius: 25, emissive: new BABYLON.Color3(0.95,0.78,0.55) },
  "Niushe":             { name: "Niushe", kind: "sun", radius: 27, emissive: new BABYLON.Color3(0.95,0.90,0.82) },
  // Corrin orbita Sigma Draconis (estrella gigante roja) en varias fuentes.
  "Sigma Draconis":     { name: "Sigma Draconis", kind: "sun", radius: 42, emissive: new BABYLON.Color3(1.0,0.60,0.45) },
  // Kaitain es especialmente confuso en fuentes (a veces se asocia a Sigma Draconis / a veces a "Kaitain" como designación),
  // aquí lo tratamos como sistema propio para NO mezclar.
  "Kaitain":            { name: "Kaitain", kind: "sun", radius: 30, emissive: new BABYLON.Color3(0.95,0.90,0.78) },
};

// ---- lista "completa" (según tu recopilación) para que no falte nada ----
// Formato flexible:
// - "Planeta"
// - "Planeta (Sistema IV)"  -> planeta en Sistema, posición IV
// - "Planeta (IV Sistema)"  -> planeta en Sistema, posición IV
// - "SYS: NombreSistema"     -> define sistema sin planetas explícitos (se rellenará)
const DUNE_RAW_BODIES = [
  // Canopus / Arrakis
  "Seban", "Menaris", "Arrakis", "Extaris", "Ven", "Revona",
  // Otros mundos clave
  "Caladan", "Giedi Prime", "Kaitain", "Salusa Secundus", "Ix", "Richese",
  "Tleilax", "Wallach IX", "Ginaz", "Ecaz", "Chusuk", "Hagal", "Poritrin",
  "Gamont", "Grumman", "Lankiveil", "Lampadas", "Rossak", "Buzzell", "Corrin",
  "Vulcanis",
  // Lista ampliada (tu listado)
  "III Delta Kaising", "Acline", "Al Dhanab", "Alahir", "Alarkand",
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
  "Thonaris", "Tierra", "Tleilax Siete", "Tupile", "Tyndall", "Ularda", "Unsidor",
  "Uthers", "Velan", "Walgis", "Wallach VI", "Wallach VII", "Wrasni (Uuokia IV)",
  "Xuttuh", "Yardin", "Yondair", "Zabulon", "Zanbar", "Zanobar", "Zenha", "Zenith",
  // define sistemas citados como tales (se rellenan si no tienen planetas)
  "SYS: Unsidor", "SYS: Thonaris", "SYS: Yondair"
];

// ---- parseo ligero de la lista anterior hacia entries {kind,name,system,pos,parent} ----
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

const parseDuneEntries = (rawList) => {
  const entries = [];
  const systemsExplicit = new Set();

  for (const raw0 of rawList) {
    const raw = String(raw0).trim();
    if (!raw) continue;
    if (raw.startsWith("SYS:")) {
      systemsExplicit.add(raw.replace(/^SYS:\s*/i, "").trim());
      continue;
    }

    // detect luna
    const isMoon = /\b(luna)\b/i.test(raw);

    // normaliza texto auxiliar
    const cleaned = raw
      .replace(/\s*:\s*.*$/, "")
      .replace(/\s*—\s*.*$/, "")
      .replace(/\s*\(estación.*\)$/i, "")
      .trim();

    // "Planet (System IV)" o "Planet (IV System)"
    let name = cleaned;
    let system = null;
    let pos = null;
    let parent = null;

    const m = cleaned.match(/^(.*?)\s*\((.*?)\)\s*$/);
    if (m) {
      name = m[1].trim();
      const inside = m[2].trim();

      // "Luna de X"
      const mMoonParent = inside.match(/luna\s+de\s+(.+)/i);
      if (mMoonParent) {
        parent = mMoonParent[1].trim();
        // el sistema se determinará más tarde por el planeta padre si se conoce
      }

      // "Sistema IV" (roman al final)
      const mSysRomanEnd = inside.match(/^(.+?)\s+([IVXLCM]+)$/i);
      // "IV Sistema" (roman al inicio)
      const mRomanSysStart = inside.match(/^([IVXLCM]+)\s+(.+)$/i);
      // "V Kuentsing" / "IV Eridani A" etc.
      if (mSysRomanEnd) {
        system = mSysRomanEnd[1].trim();
        pos = _romanToInt(mSysRomanEnd[2].toUpperCase());
      } else if (mRomanSysStart) {
        pos = _romanToInt(mRomanSysStart[1].toUpperCase());
        system = mRomanSysStart[2].trim();
      }
    }

    // hints manuales para planetas muy conocidos
    const HINTS = {
      "Arrakis":         { system: "Canopus", pos: 3 },
      "Seban":           { system: "Canopus", pos: 1 },
      "Menaris":         { system: "Canopus", pos: 2 },
      "Extaris":         { system: "Canopus", pos: 4 },
      "Ven":             { system: "Canopus", pos: 5 },
      "Revona":          { system: "Canopus", pos: 6 },
      "Caladan":         { system: "Delta Pavonis", pos: 3 },
      "Giedi Prime":     { system: "36 Ophiuchi B", pos: 1 },
      "Ix":              { system: "IX Eridani", pos: 9 },
      "Richese":         { system: "Eridani A", pos: 4 },
      "Ecaz":            { system: "Alpha Centauri B", pos: 4 },
      "Wallach IX":      { system: "Laoujin", pos: 9 },
      "Tleilax":         { system: "Thalim", pos: 1 },
      "Salusa Secundus": { system: "Gamma Waiping", pos: 3 },
      "Poritrin":        { system: "Epsilon Alangue", pos: 3 },
      "Chusuk":          { system: "Theta Shalish", pos: 4 },
      "Hagal":           { system: "Theta Shaowewei", pos: 2 },
      "Grumman":         { system: "Niushe", pos: 2 },
      "Gamont":          { system: "Niushe", pos: 3 },
      "Corrin":          { system: "Sigma Draconis", pos: 6 },
      // Kaitain: mantenemos sistema propio (ver comentario en DUNE_SYSTEM_STAR)
      "Kaitain":         { system: "Kaitain", pos: 3 },
    };

    if (!system && HINTS[name]) {
      system = HINTS[name].system;
      pos = HINTS[name].pos;
    }

    entries.push({
      kind: isMoon ? "moon" : "planet",
      name,
      system,
      pos,
      parent,
      raw
    });
  }

  // asegurar sistemas explícitos
  for (const s of systemsExplicit) {
    entries.push({ kind: "system", name: s, system: s, raw: "SYS:" + s });
  }

  return entries;
};

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

  // overrides de canon
  const ov = DUNE_PLANET_OVERRIDES[planetName] || {};
  Object.assign(def, ov);
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

const buildDuneExtraSystems = () => {
  const entries = parseDuneEntries(DUNE_RAW_BODIES);

  // mapa planeta->sistema (para colgar lunas correctamente)
  const planetToSystem = new Map();
  for (const e of entries) {
    if (e.kind === "planet" && e.system) planetToSystem.set(e.name, e.system);
  }

  // 1) agrupar planetas por sistema (si falta sistema => "Outer-XX")
  const bySystem = new Map();
  const unknownPlanets = [];

  const pendingMoons = [];
  for (const e of entries) {
    if (e.kind === "system") {
      if (!bySystem.has(e.system)) bySystem.set(e.system, { planets: [], moons: [], meta: [] });
      continue;
    }

    if (e.kind === "planet") {
      if (!e.system) unknownPlanets.push(e);
      else {
        if (!bySystem.has(e.system)) bySystem.set(e.system, { planets: [], moons: [], meta: [] });
        bySystem.get(e.system).planets.push(e);
      }
    } else if (e.kind === "moon") {
      pendingMoons.push(e);
    }
  }

  // adjuntar lunas al sistema del planeta padre si se conoce; si no, al primer Outer
  // IMPORTANT: si la luna referencia un planeta "huérfano" (sin sistema),
  // forzamos a que ese planeta vaya al MISMO Outer-XX que la luna para evitar:
  //   [moon] parent no encontrado: <Planeta> para <Luna>
  const _moveUnknownPlanetToSystem = (planetName, sysId) => {
    const idx = unknownPlanets.findIndex(p => p.name === planetName);
    if (idx >= 0) {
      if (!bySystem.has(sysId)) bySystem.set(sysId, { planets: [], moons: [], meta: [] });
      bySystem.get(sysId).planets.push(unknownPlanets.splice(idx, 1)[0]);
      planetToSystem.set(planetName, sysId);
      return true;
    }
    return false;
  };
		
		for (const m of pendingMoons) {
    const parentSys = (m.parent && planetToSystem.get(m.parent)) || m.system;
    const targetSys = parentSys || "Outer-01";
		  
    // Si el padre existe pero aún está en unknownPlanets, muévelo al mismo sistema
    if (m.parent && !planetToSystem.get(m.parent)) {
      _moveUnknownPlanetToSystem(m.parent, targetSys);
    }
		  
    if (!bySystem.has(targetSys)) bySystem.set(targetSys, { planets: [], moons: [], meta: [] });
    bySystem.get(targetSys).moons.push(m);
  }

  // 2) repartir desconocidos en sistemas inventados para que nada quede huérfano
  const OUTER_SIZE = 9;
  let outerIdx = 1;
  while (unknownPlanets.length) {
    const sysId = `Outer-${String(outerIdx).padStart(2, "0")}`;
    if (!bySystem.has(sysId)) bySystem.set(sysId, { planets: [], moons: [], meta: [] });
    const bucket = bySystem.get(sysId);
    bucket.planets.push(...unknownPlanets.splice(0, OUTER_SIZE));
    outerIdx++;
  }

  // 3) construir defs de sistemas
  const systems = [];
  const sysIds = Array.from(bySystem.keys())
    .filter(s => s !== "Canopus")
    .sort((a,b)=> a.localeCompare(b));

  // posiciones 3D simples (en anillo)
  const ringR = 2200;
  for (let si = 0; si < sysIds.length; si++) {
    const id = sysIds[si];
    const angle = (si / Math.max(1, sysIds.length)) * Math.PI * 2;
    const pos = new BABYLON.Vector3(Math.cos(angle) * ringR, (si%5 - 2) * 60, Math.sin(angle) * ringR);

    const starDef = DUNE_SYSTEM_STAR[id] || {
      name: `Star ${id}`,
      kind: "sun",
      radius: 24 + _rand01("star:"+id) * 10,
      emissive: new BABYLON.Color3(0.95, 0.92, 0.78)
    };

    // ordenar por pos (si hay), resolver colisiones
    const group = bySystem.get(id);
    const planets = (group?.planets || []).slice();
    planets.sort((a,b)=>{
      const ap = a.pos ?? 9999;
      const bp = b.pos ?? 9999;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });

    // asigna índices de órbita estables
    const usedPos = new Set();
    const planetDefs = [];
    for (let pi = 0; pi < planets.length; pi++) {
      const p = planets[pi];
      let idx = (p.pos != null ? p.pos : (pi + 1));
      while (usedPos.has(idx)) idx++;
      usedPos.add(idx);
      planetDefs.push(makePlanetDef(p.name, idx));
    }

    // si el sistema quedó sin planetas (pero lo declaraste), lo rellenamos
    if (planetDefs.length === 0) {
      planetDefs.push(makePlanetDef(`${id} I`, 1));
      planetDefs.push(makePlanetDef(`${id} II`, 2));
    }

    // moons: cuelgan del planeta padre si se indica; si no, del primero
    const moonDefs = [];
    const moons = (group?.moons || []).slice();
    for (let mi = 0; mi < moons.length; mi++) {
      const m = moons[mi];
      const parent = m.parent || (planetDefs[0]?.name);
      moonDefs.push(makeMoonDef(m.name, parent, mi));
    }

    systems.push({
      id,
      speedScale: 6,
      pos,
      star: starDef,
      planets: planetDefs,
      moons: moonDefs,
    });
  }

  return systems;
};

// Bodies definition (not to scale; tuned for visuals)
      // ===================================================
// Systems definition (single source of truth)
// - Canopus is treated like any other system (extraSystems[0])
// - bodyDefs se mantiene como "flatten" para el pipeline actual (UI, surface, etc.)
// ===================================================
const coreSystem = {
  id: "Canopus",
  speedScale: 1,
  pos: new BABYLON.Vector3(0, 0, 0),
  star: {
    name:"Canopus", kind:"sun", radius: 50,
    orbitR: 0, orbitSpeed: 0, rotSpeed: 0.002,
    rocky:false,
  },
  planets: [

    // Los 6 planetas del sistema Canopus (según tu descripción)
    makePlanetDef("Seban",   1, { orbitR: 150, orbitSpeed: 0.00125 }), // nube tenue de metales/gases ionizados
    makePlanetDef("Menaris", 2, { orbitR: 240, orbitSpeed: 0.00090 }), // “gemelo” de Extaris
    // órbita excéntrica (orbitEcc en DUNE_PLANET_OVERRIDES["Arrakis"])
    makePlanetDef("Arrakis", 3, { orbitR: 330, orbitSpeed: 0.00068 }),
    makePlanetDef("Extaris", 4, { orbitR: 420, orbitSpeed: 0.00055 }), // pequeño exterior, 5 lunas
    makePlanetDef("Ven",     5, { orbitR: 560, orbitSpeed: 0.00033 }), // gigante rosado (casi límite planeta/estrella)
    makePlanetDef("Revona",  6, { orbitR: 820, orbitSpeed: 0.00018 }), // muy exterior, con Laran
  ],
  moons: [
    // Arrakis (2)
    { name:"Krelln", kind:"moon", radius: 1.35, orbitR: 14.5, orbitSpeed: 0.060, rotSpeed: 0.010, atmo:false, rocky:true, parent:"Arrakis" },
    { name:"Arvon",  kind:"moon", radius: 0.95, orbitR: 10.2, orbitSpeed: 0.085, rotSpeed: 0.012, atmo:false, rocky:true, parent:"Arrakis", alias:["Muad'Dib"] },

    // Extaris (5) — “Aja y sus otras cuatro lunas”
    { name:"Aja",    kind:"moon", radius: 0.82, orbitR: 10.0, orbitSpeed: 0.090, rotSpeed: 0.012, atmo:false, rocky:true, parent:"Extaris" },
    { name:"Dreko",  kind:"moon", radius: 0.65, orbitR: 14.0, orbitSpeed: 0.075, rotSpeed: 0.011, atmo:false, rocky:true, parent:"Extaris" },
    { name:"Namar",  kind:"moon", radius: 0.58, orbitR: 18.5, orbitSpeed: 0.062, rotSpeed: 0.010, atmo:false, rocky:true, parent:"Extaris" },
    { name:"Sesh",   kind:"moon", radius: 0.52, orbitR: 23.0, orbitSpeed: 0.053, rotSpeed: 0.010, atmo:false, rocky:true, parent:"Extaris" },
    { name:"Vala",   kind:"moon", radius: 0.47, orbitR: 28.0, orbitSpeed: 0.047, rotSpeed: 0.009, atmo:false, rocky:true, parent:"Extaris" },

    // Revona (1)
    { name:"Laran",  kind:"moon", radius: 0.74, orbitR: 12.0, orbitSpeed: 0.070, rotSpeed: 0.011, atmo:false, rocky:true, parent:"Revona" }
  ],
};

// Bodies definition (flattened, no a escala; valores ajustados a visual)
const bodyDefs = [
  coreSystem.star,
  ...coreSystem.planets,
  ...coreSystem.moons
];

const extraSystems = [

  // Canopus es el núcleo y el resto se genera desde DUNE_RAW_BODIES
  coreSystem,
  ...buildDuneExtraSystems(),
];


  // Return a compact handle that main.js can use.
  return {
    coreSystem,
    extraSystems,
    bodyDefs,
    planetMeta: DUNE_PLANET_META,
    planetOverrides: DUNE_PLANET_OVERRIDES,
    systemStars: DUNE_SYSTEM_STAR,
  };
}
