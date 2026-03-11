import { SYSTEMS } from './systems.js';

export const GALAXY = {
      // ============================================================
      // SYSTEMS: coordenadas fijas en LY (1 LY = __LY unidades de escena)
      // ============================================================
      system: SYSTEMS,
    
      // ============================================================
      // STARS: una o varias por system (binarios/trinarios: añades más)
      // starId es la KEY. "orbits" apunta SIEMPRE al systemId.
      // ============================================================
      star: {
        "Sol": {
          // orbital
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          // physical / visual
          size: 696340,
          color: 0xf6f6f6,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 7.25,
          rotationPeriod: 27.5,
    
          // hierarchy
          orbits: "Sol",
    
          // engine extras
          kind: "sun",
          radius: 20,
          emissive: new BABYLON.Color3(0.95, 0.90, 0.78),
        },
    
		// --- ALPHA CENTAURI (Triple) ---
		"Alpha Centauri A": {
		  periapsis: 0,
		  apoapsis: 0,
		  orbitalPeriod: 0,
		  inclination: 0,
		  argumentOfPeriapsis: 0,
		  longitudeOfAscendingNode: 0,
		  lastPerihelion: "2024-01-01",

		  // Radio físico: 1.2234 R☉ ≈ 851,119 km
		  size: 851119,
		  color: 0xffffee,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,

		  // Aproximado (hay dispersión en la literatura)
		  rotationPeriod: 22,

		  orbits: "Alpha Centauri",
		  kind: "sun",
		  radius: 41,
		  emissive: new BABYLON.Color3(1.0, 1.0, 0.92),
		},

		"Alpha Centauri B": {
		  // Separación A–B: ~11.2 AU a ~35.6 AU (en km)
		  periapsis: 1675496152,
		  apoapsis: 5325684197,

		  // ~79.9 años ≈ 29,196 días (tu 29,183 también es razonable)
		  orbitalPeriod: 29196,

		  // Elementos orbitales típicos (solución clásica tipo Pourbaix)
		  inclination: 79.20,
		  argumentOfPeriapsis: 231.65,
		  longitudeOfAscendingNode: 204.85,

		  // OJO: último periastron (no el próximo)
		  lastPerihelion: "1955-08-01",

		  // Radio físico: 0.8632 R☉ ≈ 600,528 km
		  size: 600528,
		  color: 0xffd799,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,

		  // ~36 días (no 27)
		  rotationPeriod: 36.2,

		  orbits: "Alpha Centauri",
		  kind: "sun",
		  radius: 34,
		  emissive: new BABYLON.Color3(1.0, 0.84, 0.60),
		},
    
		"Proxima Centauri": {
		  // Periastron/apastron: 4.3 kAU y 13.0 kAU (en km)
		  periapsis: 643270844010,
		  apoapsis: 1944772319100,

		  // Periodo: ~547,000 años ≈ 199,791,750 días
		  orbitalPeriod: 199791750,

		  // Orientación orbital (Kervella+ 2017)
		  inclination: 107.6,
		  argumentOfPeriapsis: 72.3,
		  longitudeOfAscendingNode: 126.0,

		  // En realidad el “epoch of periastron” está a cientos de miles de años;
		  // si tu motor necesita una fecha, mejor tratarlo como placeholder.
		  lastPerihelion: "2024-01-01",

		  // Radio físico: 0.1542 R☉ ≈ 107,277 km
		  size: 107277,
		  color: 0xff4c33,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,

		  // ~83 días (bien)
		  rotationPeriod: 83.1,

		  orbits: "Alpha Centauri",
		  kind: "sun",
		  radius: 7,
		  emissive: new BABYLON.Color3(1.0, 0.3, 0.1),
		},
    

		// --- BARNARD'S STAR (Solitaria) ---
		// Es la estrella con el mayor movimiento propio conocido.
		"Barnard's Star": {
		  periapsis: 0, apoapsis: 0,
		  orbitalPeriod: 0, inclination: 0,
		  argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0,
		  lastPerihelion: "2024-01-01",

		  size: 130146,              // ~0.187 R☉
		  color: 0xff9966,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,
		  rotationPeriod: 130.4,     // ~130–150 d en la literatura

		  orbits: "Barnard's Star",
		  kind: "star",
		  radius: 6,
		  emissive: new BABYLON.Color3(0.8, 0.25, 0.1)
		},
		
		// --- LUHMAN 16 (Binaria Enanas Marrones) ---
		"Luhman 16 A": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 70000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
			orbits: "Luhman 16", kind: "brown_dwarf", radius: 5, emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
		},
		"Luhman 16 B": {
			periapsis: 350000000, apoapsis: 550000000, orbitalPeriod: 9125, inclination: 79.5, argumentOfPeriapsis: 130, longitudeOfAscendingNode: 42, lastPerihelion: "2015-01-01",
			size: 65000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.21,
			orbits: "Luhman 16 A", kind: "brown_dwarf", radius: 4.8, emissive: new BABYLON.Color3(0.25, 0.08, 0.04)
		},

		// --- WISE 0855-0714 (Enana Sub-marrón Solitaria) ---
		"WISE 0855-0714": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 40000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
			orbits: "WISE 0855-0714", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.1, 0.0, 0.15)
		},

		  // --- WOLF 359 (Solitaria) ---
		  "Wolf 359": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 220000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.5, // Estrella muy activa
			orbits: "Wolf 359", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
		  },
		  
		// --- LALANDE 21185 (Solitaria) ---
		// Una de las enanas rojas más brillantes del cielo norte.
		"Lalande 21185": {
		  periapsis: 0, apoapsis: 0,
		  orbitalPeriod: 0, inclination: 0,
		  argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0,
		  lastPerihelion: "2024-01-01",

		  size: 273244,              // ~0.3924 R☉
		  color: 0xffaa77,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,
		  rotationPeriod: 56.0,

		  orbits: "Lalande 21185",
		  kind: "star",
		  radius: 8,
		  emissive: new BABYLON.Color3(0.9, 0.35, 0.15)
		},
		  
		// --- SIRIUS (Binaria) ---
		"Sirius A": {
		  periapsis: 0, apoapsis: 0,
		  orbitalPeriod: 0, inclination: 0,
		  argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0,
		  lastPerihelion: "2024-01-01",

		  size: 1192830,              // ~1.713 R☉
		  color: 0xf8fbff,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,
		  rotationPeriod: 5.5,        // típicamente citado como <= 5.5 d

		  orbits: "Sirius",
		  kind: "star",
		  radius: 20,
		  emissive: new BABYLON.Color3(0.9, 0.95, 1.0)
		},
		
		"Sirius B": {
		  // Órbita relativa (valores tipo ORB6)
		  periapsis: 1208157290,          // km  (~8.076 AU)
		  apoapsis: 4705775305,           // km  (~31.456 AU)
		  orbitalPeriod: 18309.4,         // días (~50.1284 años)
		  inclination: 136.336,
		  argumentOfPeriapsis: 149.161,   // (secondary) ojo convenciones
		  longitudeOfAscendingNode: 45.400,
		  lastPerihelion: "1994-07-28",   // ~1994.5715

		  size: 5635,                     // km (radio típico ~5634 km)
		  color: 0xeaf3ff,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,
		  rotationPeriod: 0,              // desconocido / no fijar sin fuente sólida

		  orbits: "Sirius",
		  kind: "white_dwarf",
		  radius: 4,
		  emissive: new BABYLON.Color3(0.7, 0.8, 1.0)
		},

		  // --- LUYTEN 726-8 (UV Ceti - Binaria) ---
		  "Luyten 726-8 A": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 97400, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
			orbits: "Luyten 726-8", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.9, 0.2, 0.1)
		  },
		  "Luyten 726-8 B": {
			periapsis: 314150000, apoapsis: 882000000, orbitalPeriod: 9672, inclination: 121, argumentOfPeriapsis: 285, longitudeOfAscendingNode: 151, lastPerihelion: "1971-11-01",
			size: 90000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
			orbits: "Luyten 726-8 A", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(1.0, 0.3, 0.1)
		  },
		  
		// --- GLIESE 729 (Solitaria) (Ross 154) ---
		// Una estrella fulgurante (flare star) que puede duplicar su brillo en segundos.
		"Gliese 729": {
		  periapsis: 0, apoapsis: 0,
		  orbitalPeriod: 0, inclination: 0,
		  argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0,
		  lastPerihelion: "2024-01-01",

		  size: 139268,              // ~0.200 R☉
		  color: 0xff9966,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,
		  rotationPeriod: 2.848,

		  orbits: "Gliese 729",
		  kind: "star",
		  radius: 6,
		  emissive: new BABYLON.Color3(1.0, 0.3, 0.1)
		},

		  // --- ROSS 248 (Solitaria) ---
		  "Ross 248": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 220000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 4.2,
			orbits: "Ross 248", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
		  },
		  
		// --- EPSILON ERIDANI (Solitaria - Lore: Eridani A) ---
		"Epsilon Eridani": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 864900,
          color: 0xffd700,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Epsilon Eridani",
    
          kind: "sun",
          radius: 28,
          emissive: new BABYLON.Color3(1.0, 0.92, 0.75),
        }, 

		 // --- LACAILLE 9352 (Solitaria) ---
		  "Lacaille 9352": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 650000, color: 0xff6633, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
			orbits: "Lacaille 9352", kind: "star", radius: 8, emissive: new BABYLON.Color3(0.9, 0.4, 0.2)
		  },

		  // --- GLIESE 447 (Solitaria) ---
		  "Gliese 447": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 250000, color: 0xff3311, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 5.0,
			orbits: "Gliese 447", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
		  },

		  // --- EZ AQUARII (Triple) ---
		  "EZ Aquarii A": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 150000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 3.5,
			orbits: "EZ Aquarii", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
		  },
		  "EZ Aquarii B": {
			periapsis: 1450000, apoapsis: 1550000, orbitalPeriod: 3.8, inclination: 110, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 110000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 3.8,
			orbits: "EZ Aquarii A", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
		  },
		  "EZ Aquarii C": {
			periapsis: 150000000, apoapsis: 200000000, orbitalPeriod: 823, inclination: 90, argumentOfPeriapsis: 45, longitudeOfAscendingNode: 12, lastPerihelion: "2024-01-01",
			size: 80000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 4.2,
			orbits: "EZ Aquarii A", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
		  },

		  // --- 61 CYGNI (Binaria) ---
		  "61 Cygni A": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 462000, color: 0xffb866, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
			orbits: "61 Cygni", kind: "star", radius: 12, emissive: new BABYLON.Color3(1.0, 0.6, 0.2)
		  },
		  "61 Cygni B": {
			periapsis: 6582000000, apoapsis: 12000000000, orbitalPeriod: 247470, inclination: 52, argumentOfPeriapsis: 171, longitudeOfAscendingNode: 175, lastPerihelion: "1690-01-01",
			size: 410000, color: 0xffa044, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
			orbits: "61 Cygni A", kind: "star", radius: 10, emissive: new BABYLON.Color3(0.9, 0.5, 0.1)
		  },
		  
		  // --- PROCYON (Binaria) ---
		  "Procyon A": {
			periapsis: 0, 
			apoapsis: 0,
			orbitalPeriod: 0,
			inclination: 0, 
			argumentOfPeriapsis: 0,
			longitudeOfAscendingNode: 0,
			lastPerihelion: "2024-01-01",

			size: 1419000,             // Radio en km (~2.04 radios solares)
			color: 0xf5f5f5,           // Blanco amarillento (F5)
			rotationAxis: { x: 0, y: 1, z: 0 },
			axialTilt: 3,              // Grados (Estimado bajo)
			rotationPeriod: 23,        // Días terrestres

			orbits: "Procyon",

			kind: "sun",
			radius: 42,                // Visualmente grande y brillante
			emissive: new BABYLON.Color3(1.0, 1.0, 0.9), // Blanco casi puro
		},
		
		"Procyon B": {
			// Parámetros orbitales (Referencia: respecto a A)
			periapsis: 1331421049,       // 8.9 UA en km
			apoapsis: 3141555285,       // 21.0 UA en km
			orbitalPeriod: 14909,       // 40.82 años en días
			inclination: 31.1,         // Grados
			argumentOfPeriapsis: 11.0, // Grados
			longitudeOfAscendingNode: 104.0, // Grados
			lastPerihelion: "2008-01-01", // Último periastro

			size: 8600,                // Radio en km (~0.012 radios solares, similar a la Tierra)
			color: 0xccffff,           // Blanco azulado intenso
			rotationAxis: { x: 0, y: 1, z: 0 },
			axialTilt: 0,
			rotationPeriod: 0.5,       // Estimado (las enanas blancas rotan muy rápido)

			orbits: "Procyon",

			kind: "sun",
			radius: 5,                 // Representación pequeña en el mapa
			emissive: new BABYLON.Color3(0.6, 0.8, 1.0), // Brillo azulado frío
		},
		  
		  
		  // --- GLIESE 725 (Binaria) ---
		  "Gliese 725 A": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 230000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 10,
			orbits: "Gliese 725", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
		  },
		  "Gliese 725 B": {
			periapsis: 2000000000, apoapsis: 2000000000, orbitalPeriod: 148920, inclination: 45, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 90, lastPerihelion: "1900-01-01",
			size: 190000, color: 0xff3311, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 12,
			orbits: "Gliese 725 A", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.7, 0.2, 0.1)
		  },

		  // --- 2MASS J1812-2608 (Enana Marrón Solitaria) ---
		  "2MASS J1812-2608": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 85000, color: 0x552211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
			orbits: "2MASS J1812-2608", kind: "brown_dwarf", radius: 5, emissive: new BABYLON.Color3(0.4, 0.15, 0.1)
		  },

		// --- GROOMBRIDGE 34 (Binaria) ---
		"Groombridge 34 A": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 271000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 44,
			orbits: "Groombridge 34", kind: "star", radius: 8, emissive: new BABYLON.Color3(0.8, 0.3, 0.1)
		},
		"Groombridge 34 B": {
			periapsis: 18000000000, apoapsis: 24000000000, orbitalPeriod: 949000, inclination: 100, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "1850-01-01",
			size: 132000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
			orbits: "Groombridge 34 A", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.7, 0.2, 0.05)
		},

		// --- DX CANCRI (Solitaria) ---
		"DX Cancri": {
			periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 120000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.46, // Rotación muy rápida
			orbits: "DX Cancri", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
		},
  
  		// --- EPSILON INDI (Estrella + Binaria Enanas Marrones) --- 
 
        "Epsilon Indi A": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 900000,
          color: 0xffaa88,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Epsilon Indi",
    
          kind: "sun",
          radius: 42,
          emissive: new BABYLON.Color3(1.0, 0.60, 0.45),
        },
		
		"Epsilon Indi Ba": {
			periapsis: 224390000000, apoapsis: 224390000000, orbitalPeriod: 15000000, inclination: 45, argumentOfPeriapsis: 10, longitudeOfAscendingNode: 20, lastPerihelion: "1900-01-01",
			size: 70000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.15,
			orbits: "Epsilon Indi A", kind: "brown_dwarf", radius: 4, emissive: new BABYLON.Color3(0.2, 0.05, 0.0)
		},
		"Epsilon Indi Bb": {
			periapsis: 90000000, apoapsis: 90000000, orbitalPeriod: 15, inclination: 120, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
			size: 65000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.13,
			orbits: "Epsilon Indi Ba", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.15, 0.05, 0.0)
		},
		
		///////
		
  // --- TAU CETI ---
  "Tau Ceti": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1100000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 7, rotationPeriod: 34,
    orbits: "Tau Ceti", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- GLIESE 1061 ---
  "Gliese 1061": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 160000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 95,
    orbits: "Gliese 1061", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- YZ CETI ---
  "YZ Ceti": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 180000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 68,
    orbits: "YZ Ceti", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
  },

  // --- LUYTEN'S STAR ---
  "Luyten's Star": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 116,
    orbits: "Luyten's Star", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.9, 0.3, 0.1)
  },

  // --- TEEGARDEN'S STAR ---
  "Teegarden's Star": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 150000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 100,
    orbits: "Teegarden's Star", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- KAPTEYN'S STAR ---
  "Kapteyn's Star": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 400000, color: 0xff6644, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 143,
    orbits: "Kapteyn's Star", kind: "star", radius: 8, emissive: new BABYLON.Color3(0.8, 0.4, 0.2)
  },

  // --- AX MICROSCOPII ---
  "AX Microscopii": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 700000, color: 0xff7744, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "AX Microscopii", kind: "star", radius: 9, emissive: new BABYLON.Color3(0.9, 0.4, 0.2)
  },

  // --- KRUGER 60 (Binaria) ---
  "Kruger 60 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 350000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 18,
    orbits: "Kruger 60", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },
  "Kruger 60 B": {
    periapsis: 820000000, apoapsis: 1900000000, orbitalPeriod: 16315, inclination: 127, argumentOfPeriapsis: 163, longitudeOfAscendingNode: 155, lastPerihelion: "1969-01-01",
    size: 240000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 22,
    orbits: "Kruger 60 A", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- WISE J053516.80-750024.9 ---
  "WISE J053516.80-750024.9": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 60000, color: 0x221133, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE J053516.80-750024.9", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.1, 0.0, 0.2)
  },

  // --- SCR 1845-6357 (Binaria) ---
  "SCR 1845-6357 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 110000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "SCR 1845-6357", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },
  "SCR 1845-6357 B": {
    periapsis: 670000000, apoapsis: 670000000, orbitalPeriod: 18000, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 50000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "SCR 1845-6357 A", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.05, 0.02)
  },

  // --- DEN 1048-3956 ---
  "DEN 1048-3956": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 90000, color: 0x441100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.18,
    orbits: "DEN 1048-3956", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.3, 0.05, 0.0)
  },

  // --- WISE J0722-0540 ---
  "WISE J0722-0540": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 75000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "WISE J0722-0540", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.1, 0.0, 0.1)
  },

  // --- GLIESE 234 (Binaria) ---
  "Gliese 234 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 250000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 12,
    orbits: "Gliese 234", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
  },
  "Gliese 234 B": {
    periapsis: 350000000, apoapsis: 520000000, orbitalPeriod: 6132, inclination: 53, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "1999-01-01",
    size: 150000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "Gliese 234 A", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- GAIA DR2 4129144660321847040 ---
  "Gaia DR2 4129144660321847040": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 120000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 14,
    orbits: "Gaia DR2 4129144660321847040", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- WOLF 1061 ---
  "Wolf 1061": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 350000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 90,
    orbits: "Wolf 1061", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- VAN MAANEN'S STAR ---
  "Van Maanen's Star": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 13000, color: 0xddeeff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.15,
    orbits: "Van Maanen's Star", kind: "white_dwarf", radius: 2, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- FL VIRGINIS A ---
  "FL Virginis A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 180000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2.5,
    orbits: "FL Virginis A", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.9, 0.1, 0.0)
  },

  // --- GLIESE 1 ---
  "Gliese 1": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 450000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 59,
    orbits: "Gliese 1", kind: "star", radius: 8, emissive: new BABYLON.Color3(0.8, 0.3, 0.1)
  },

  // --- 2MASS J0429+3806 ---
  "2MASS J0429+3806": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 95000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "2MASS J0429+3806", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
  },

  // --- TZ ARIETIS ---
  "TZ Arietis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff3311, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.2,
    orbits: "TZ Arietis", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.8, 0.1, 0.05)
  },

  // --- GLIESE 687 ---
  "Gliese 687": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 410000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 60,
    orbits: "Gliese 687", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- GLIESE 674 ---
  "Gliese 674": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 350000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "Gliese 674", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
  },

  // --- GLIESE 3622 ---
  "Gliese 3622": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 140000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 20,
    orbits: "Gliese 3622", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- GLIESE 440 ---
  "Gliese 440": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 15000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.1,
    orbits: "Gliese 440", kind: "white_dwarf", radius: 2.2, emissive: new BABYLON.Color3(0.7, 0.8, 1.0)
  },

  // --- GLIESE 1245 (Triple) ---
  "Gliese 1245 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 150000, color: 0xff3311, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "Gliese 1245", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },
  "Gliese 1245 B": {
    periapsis: 4900000000, apoapsis: 4900000000, orbitalPeriod: 255500, inclination: 45, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "1900-01-01",
    size: 140000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 18,
    orbits: "Gliese 1245 A", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },
  "Gliese 1245 C": {
    periapsis: 1500000, apoapsis: 1500000, orbitalPeriod: 15.5, inclination: 10, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 90000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "Gliese 1245 A", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- GLIESE 876 ---
  "Gliese 876": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 400000, color: 0xff3311, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 96,
    orbits: "Gliese 876", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
  },

  // --- GLIESE 3618 ---
  "Gliese 3618": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 280000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 3618", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
  },

  // --- GLIESE 1002 ---
  "Gliese 1002": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 160000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 120,
    orbits: "Gliese 1002", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- DEN 0255-4700 ---
  "DEN 0255-4700": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 80000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.1,
    orbits: "DEN 0255-4700", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.05, 0.0)
  },

  // --- GROOMBRIDGE 1618 ---
  "Groombridge 1618": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 850000, color: 0xffaa66, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "Groombridge 1618", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 0.6, 0.3)
  },
  
  ////////
  
  // --- GLIESE 412 (Binaria) ---
  "Gliese 412 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 400000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 100,
    orbits: "Gliese 412", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },
  "Gliese 412 B": {
    periapsis: 2800000000, apoapsis: 3500000000, orbitalPeriod: 255500, inclination: 10, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 45, lastPerihelion: "1950-01-01",
    size: 150000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 412 A", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- WISE 1639-6847 ---
  "WISE 1639-6847": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 70000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "WISE 1639-6847", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.1, 0.0, 0.15)
  },

  // --- AD LEONIS ---
  "AD Leonis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 390000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2.2, // Estrella fulgurante muy activa
    orbits: "AD Leonis", kind: "star", radius: 6, emissive: new BABYLON.Color3(1.0, 0.3, 0.1)
  },

  // --- GLIESE 832 ---
  "Gliese 832": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 450000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 46,
    orbits: "Gliese 832", kind: "star", radius: 7.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- GLIESE 1005 (Binaria) ---
  "Gliese 1005 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 150000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Gliese 1005", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },
  "Gliese 1005 B": {
    periapsis: 115000000, apoapsis: 135000000, orbitalPeriod: 1640, inclination: 80, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 20, lastPerihelion: "2024-01-01",
    size: 90000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 1005 A", kind: "star", radius: 3, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- WISE J0521+1025 ---
  "WISE J0521+1025": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 80000, color: 0x331122, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE J0521+1025", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.0, 0.1)
  },

  // --- GLIESE 682 ---
  "Gliese 682": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 250000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "Gliese 682", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- 40 ERIDANI (Keid - Triple compleja) ---
  "40 Eridani A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1100000, color: 0xffcc88, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 43,
    orbits: "40 Eridani", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 0.8, 0.5)
  },
  "40 Eridani B": { // Enana Blanca
    periapsis: 5800000000, apoapsis: 6100000000, orbitalPeriod: 292000, inclination: 108, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 150, lastPerihelion: "1849-01-01",
    size: 11000, color: 0xaabbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.1,
    orbits: "40 Eridani A", kind: "white_dwarf", radius: 2, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },
  "40 Eridani C": { // Enana Roja
    periapsis: 31000000, apoapsis: 31000000, orbitalPeriod: 250 * 365, inclination: 108, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 150, lastPerihelion: "2024-01-01",
    size: 280000, color: 0xff3311, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 12,
    orbits: "40 Eridani B", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- EV LACERTAE ---
  "EV Lacertae": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 320000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 4.3,
    orbits: "EV Lacertae", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(1.0, 0.2, 0.0)
  },

  // --- 2MASS 0939-2448 (Binaria de Enanas Marrones) ---
  "2MASS 0939-2448 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 75000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "2MASS 0939-2448", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
  },
  "2MASS 0939-2448 B": {
    periapsis: 150000000, apoapsis: 150000000, orbitalPeriod: 1000, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 70000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.35,
    orbits: "2MASS 0939-2448 A", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.25, 0.05, 0.0)
  },

  // --- 70 OPHIUCHI (Binaria) ---
		"70 Ophiuchi A": {
			periapsis: 0, 
			apoapsis: 0,
			orbitalPeriod: 0,
			inclination: 0,
			argumentOfPeriapsis: 0,
			longitudeOfAscendingNode: 0,
			lastPerihelion: "2024-01-01",

			size: 626000,              // Radio en km (~0.90 radios solares)
			color: 0xffd27d,           // Naranja amarillento claro
			rotationAxis: { x: 0, y: 1, z: 0 },
			axialTilt: 0,
			rotationPeriod: 19.7,      // Días terrestres

			orbits: "70 Ophiuchi",

			kind: "sun",
			radius: 32,                // Tamaño visual relativo
			emissive: new BABYLON.Color3(1.0, 0.82, 0.49),
		},
		
		"70 Ophiuchi B": {
			// Parámetros orbitales reales
			periapsis: 11.4,            // UA (Unidades Astronómicas)
			apoapsis: 34.8,             // UA
			orbitalPeriod: 88.38,       // Años terrestres
			inclination: 121.1,         // Grados
			argumentOfPeriapsis: 166.6, // Grados
			longitudeOfAscendingNode: 122.3, // Grados
			lastPerihelion: "1984-05-01", // El próximo será cerca de 2072

			size: 486800,              // Radio en km (~0.70 radios solares)
			color: 0xffa500,           // Naranja puro
			rotationAxis: { x: 0, y: 1, z: 0 },
			axialTilt: 0,
			rotationPeriod: 23.0,      // Días terrestres

			orbits: "70 Ophiuchi",

			kind: "sun",
			radius: 25,                // Visualmente más pequeña que la A
			emissive: new BABYLON.Color3(1.0, 0.65, 0.0),
		},

  // --- ALTAIR ---
  "Altair": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 2500000, color: 0xeeffff, rotationAxis: { x: 1, y: 0.2, z: 0 }, axialTilt: 60, rotationPeriod: 0.37, // Rotación ultra rápida, eje inclinado
    orbits: "Altair", kind: "star", radius: 15, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- EI CANCRI (Binaria) ---
  "EI Cancri A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 200000, color: 0xff3300, orbits: "EI Cancri", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.8, 0.1, 0.0), rotationPeriod: 12
  },
  "EI Cancri B": {
    periapsis: 18000000, apoapsis: 18000000, orbitalPeriod: 17, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 120000, color: 0xff1100, orbits: "EI Cancri A", kind: "star", radius: 3.5, emissive: new BABYLON.Color3(0.6, 0.05, 0.0), rotationPeriod: 17
  },

  // --- WISE J1506+7027 ---
  "WISE J1506+7027": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 75000, color: 0x221100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "WISE J1506+7027", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.15, 0.05, 0.0)
  },

  // --- GLIESE 3379 ---
  "Gliese 3379": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 180000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 3379", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- 2MASS J08173001-6155158 ---
  "2MASS J08173001-6155158": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 90000, color: 0x331122, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "2MASS J08173001-6155158", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.2, 0.0, 0.1)
  },

  // --- GLIESE 445 ---
  "Gliese 445": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 300000, color: 0xff3311, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "Gliese 445", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
  },

  // --- 2MASS J1540-5101 ---
  "2MASS J1540-5101": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 110000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 18,
    orbits: "2MASS J1540-5101", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- GLIESE 3323 ---
  "Gliese 3323": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 150000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 10,
    orbits: "Gliese 3323", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- 2MASS J0254+0223 ---
  "2MASS J0254+0223": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 85000, color: 0x221100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "2MASS J0254+0223", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.15, 0.05, 0.0)
  },

  // --- GLIESE 526 ---
  "Gliese 526": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 550000, color: 0xff6633, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 526", kind: "star", radius: 8, emissive: new BABYLON.Color3(0.9, 0.3, 0.1)
  },

  // --- STEIN 2051 (Binaria Enana Roja / Blanca) ---
  "Stein 2051 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, orbits: "Stein 2051", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 22
  },
  "Stein 2051 B": { // Enana Blanca
    periapsis: 500000000, apoapsis: 1500000000, orbitalPeriod: 80 * 365, inclination: 25, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 90, lastPerihelion: "2010-01-01",
    size: 11500, color: 0xeeffff, orbits: "Stein 2051 A", kind: "white_dwarf", radius: 2.1, emissive: new BABYLON.Color3(0.9, 0.9, 1.0), rotationPeriod: 0.1
  },

  // --- GLIESE 251 ---
  "Gliese 251": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 420000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 120,
    orbits: "Gliese 251", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- LP 816-60 ---
  "LP 816-60": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "LP 816-60", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- 2MASS J11145133-2618235 ---
  "2MASS J11145133-2618235": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 80000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "2MASS J11145133-2618235", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.05, 0.0)
  },

  // --- WISE 1741+2553 ---
  "WISE 1741+2553": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 70000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE 1741+2553", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.1, 0.0, 0.15)
  },

  // --- 2MASS 1835+3259 ---
  "2MASS 1835+3259": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 110000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.12, // Rotación extremadamente rápida
    orbits: "2MASS 1835+3259", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- GLIESE 205 ---
  "Gliese 205": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 680000, color: 0xff6644, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 33,
    orbits: "Gliese 205", kind: "star", radius: 9, emissive: new BABYLON.Color3(0.9, 0.3, 0.1)
  },

  // --- 2MASS 0415-0935 ---
  "2MASS 0415-0935": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 80000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "2MASS 0415-0935", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.1, 0.0, 0.1)
  },

  // --- GLIESE 229 (Binaria con Enana Marrón T) ---
  "Gliese 229 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 650000, color: 0xff5533, orbits: "Gliese 229", kind: "star", radius: 8.5, emissive: new BABYLON.Color3(0.8, 0.25, 0.1), rotationPeriod: 7
  },
  "Gliese 229 B": { // Enana Marrón famosa
    periapsis: 35 * 149597870, apoapsis: 45 * 149597870, orbitalPeriod: 200 * 365, inclination: 15, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "1995-01-01",
    size: 85000, color: 0x220044, orbits: "Gliese 229 A", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.1, 0.0, 0.2), rotationPeriod: 0.3
  },

  // --- SIGMA DRACONIS (Solitaria muy estable) ---
        "Sigma Draconis": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 900000,
          color: 0xffaa88,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Sigma Draconis",
    
          kind: "sun",
          radius: 42,
          emissive: new BABYLON.Color3(1.0, 0.60, 0.45),
        },
  
  ///////
  
  // --- ROSS 47 ---
  "Ross 47": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 250000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 60,
    orbits: "Ross 47", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- 33 G. LIBRAE (Gliese 570) ---
  // Es un sistema múltiple, pero para esta entrada usaremos la principal A
  "33 G. Librae A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 780000, color: 0xffcc44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 48,
    orbits: "33 G. Librae", kind: "star", radius: 8, emissive: new BABYLON.Color3(1.0, 0.7, 0.2)
  },

  // --- GLIESE 693 ---
  "Gliese 693": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 280000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "Gliese 693", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- GLIESE 754 ---
  "Gliese 754": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 190000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "Gliese 754", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- GLIESE 908 ---
  "Gliese 908": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "Gliese 908", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- GLIESE 752 ---
  "Gliese 752 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 450000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Gliese 752", kind: "star", radius: 7.5, emissive: new BABYLON.Color3(0.9, 0.3, 0.1)
  },
  "Gliese 752 B": { // Conocida como Van Biesbroeck 10
    periapsis: 650000000, apoapsis: 650000000, orbitalPeriod: 45000, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 110000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "Gliese 752 A", kind: "star", radius: 3.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- ETA CASSIOPEIAE (Achird - Binaria Visual) ---
  
  "Eta Cassiopeiae A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1050000, color: 0xffffdd, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 10,
    orbits: "Eta Cassiopeiae", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },
  "Eta Cassiopeiae B": {
    periapsis: 5400000000, apoapsis: 15800000000, orbitalPeriod: 480 * 365, inclination: 34, argumentOfPeriapsis: 88, longitudeOfAscendingNode: 264, lastPerihelion: "1889-01-01",
    size: 650000, color: 0xff9944, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 12,
    orbits: "Eta Cassiopeiae A", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.9, 0.4, 0.1)
  },

  // --- 36 OPHIUCHI (Triple) ---
		"36 Ophiuchi A": {
			periapsis: 0, 
			apoapsis: 0,
			orbitalPeriod: 0,
			inclination: 0,
			argumentOfPeriapsis: 0,
			longitudeOfAscendingNode: 0,
			lastPerihelion: "2024-01-01",

			size: 563500,              // Radio en km (~0.81 radios solares)
			color: 0xffcc66,           // Naranja amarillento (K0V)
			rotationAxis: { x: 0, y: 1, z: 0 },
			axialTilt: 0,
			rotationPeriod: 22.9,      // Días terrestres

			orbits: "36 Ophiuchi Baricentro", // O directamente al sistema estelar

			kind: "sun",
			radius: 30,                // Tamaño visual en tu escena
			emissive: new BABYLON.Color3(1.0, 0.8, 0.4),
		},
    
		"36 Ophiuchi B": {
			// Parámetros orbitales reales
			periapsis: 1047185095,       // 7 UA en km
			apoapsis: 25282039999,      // 169 UA en km
			orbitalPeriod: 208192,      // 570 años en días
			inclination: 153,          // Grados (Órbita retrógrada)
			argumentOfPeriapsis: 284,  // Grados
			longitudeOfAscendingNode: 172, // Grados
			lastPerihelion: "1905-01-01",

			size: 563500,              // Radio en km (Casi idéntica a la A)
			color: 0xffa500,           // Naranja (K1V)
			rotationAxis: { x: 0, y: 1, z: 0 },
			axialTilt: 0,
			rotationPeriod: 21.2,      // Días terrestres

			orbits: "36 Ophiuchi A",   // Orbita a la primaria

			kind: "sun",
			radius: 28,                // Un poco menor visualmente que la A
			emissive: new BABYLON.Color3(1.0, 0.65, 0.0),
		},

  // --- WISE J2000+3629 ---
  "WISE J2000+3629": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 85000, color: 0x442200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE J2000+3629", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.2, 0.1, 0.0)
  },

  // --- YZ CANIS MINORIS ---
  "YZ Canis Minoris": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 320000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2.7,
    orbits: "YZ Canis Minoris", kind: "star", radius: 6, emissive: new BABYLON.Color3(1.0, 0.2, 0.0)
  },

  // --- 82 G. ERIDANI ---
  "82 G. Eridani": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 920000, color: 0xffffbb, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 33,
    orbits: "82 G. Eridani", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 0.9, 0.7)
  },

  // --- DELTA PAVONIS ---
        "Delta Pavonis": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 864900,
          color: 0xffd7aa,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Delta Pavonis",
    
          kind: "sun",
          radius: 32,
          emissive: new BABYLON.Color3(1.0, 0.86, 0.65),
        },

  // --- EQ PEGASI (Binaria de Enanas Rojas) ---
  "EQ Pegasi A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 350000, color: 0xff3300, orbits: "EQ Pegasi", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.1, 0.0), rotationPeriod: 1.0
  },
  "EQ Pegasi B": {
    periapsis: 300000000, apoapsis: 300000000, orbitalPeriod: 180 * 365, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 250000, color: 0xff2200, orbits: "EQ Pegasi A", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0), rotationPeriod: 0.4
  },

  // --- GLIESE 581 ---
  "Gliese 581": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 290000, color: 0xff3311, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 94,
    orbits: "Gliese 581", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.8, 0.1, 0.05)
  },

  // --- SCHOLZ'S STAR (Binaria Estrella-Enana Marrón) ---
  
  "Scholz's Star A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 150000, color: 0xff2200, orbits: "Scholz's Star", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0), rotationPeriod: 20
  },
  "Scholz's Star B": {
    periapsis: 120000000, apoapsis: 120000000, orbitalPeriod: 5000, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 80000, color: 0x331100, orbits: "Scholz's Star A", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.05, 0.0), rotationPeriod: 0.5
  },

  // --- XI BOÖTIS (Binaria) ---
  "Xi Boötis A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 850000, color: 0xffcc44, orbits: "Xi Boötis", kind: "star", radius: 9, emissive: new BABYLON.Color3(1.0, 0.8, 0.3), rotationPeriod: 6
  },
  "Xi Boötis B": {
    periapsis: 2400000000, apoapsis: 7500000000, orbitalPeriod: 151 * 365, inclination: 139, argumentOfPeriapsis: 180, longitudeOfAscendingNode: 0, lastPerihelion: "1909-01-01",
    size: 610000, color: 0xff8822, orbits: "Xi Boötis A", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.8, 0.3, 0.1), rotationPeriod: 11
  },
  
  // --- WISE 0350-5658 ---
  "WISE 0350-5658": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 65000, color: 0x110011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE 0350-5658", kind: "brown_dwarf", radius: 2.5, emissive: new BABYLON.Color3(0.05, 0.0, 0.1)
  },

  // --- RURUHJELM 46 (Gliese 250) ---
  "Ruruhjelm 46 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 820000, color: 0xffcc44, orbits: "Ruruhjelm 46", kind: "star", radius: 9, emissive: new BABYLON.Color3(1.0, 0.8, 0.3), rotationPeriod: 40
  },
  "Ruruhjelm 46 B": {
    periapsis: 750000000, apoapsis: 750000000, orbitalPeriod: 150000, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 350000, color: 0xff3300, orbits: "Ruruhjelm 46 A", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.7, 0.1, 0.0), rotationPeriod: 35
  },

  // --- WISE 1541-225 ---
  "WISE 1541-225": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 70000, color: 0x220033, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "WISE 1541-225", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.1, 0.0, 0.15)
  },

  // --- GAIA DR2 5312099874809857024 ---
  "Gaia DR2 5312099874809857024": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 140000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "Gaia DR2 5312099874809857024", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- 279 G. SAGITTARI (Gliese 783) ---
  "279 G. Sagittari A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 810000, color: 0xffbb33, orbits: "279 G. Sagittari", kind: "star", radius: 9, emissive: new BABYLON.Color3(1.0, 0.7, 0.2), rotationPeriod: 38
  },
  "279 G. Sagittari B": {
    periapsis: 620000000, apoapsis: 1100000000, orbitalPeriod: 25550, inclination: 40, argumentOfPeriapsis: 120, longitudeOfAscendingNode: 30, lastPerihelion: "1990-01-01",
    size: 320000, color: 0xff3300, orbits: "279 G. Sagittari A", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.8, 0.1, 0.0), rotationPeriod: 42
  },

  // --- QY AURIGAE ---
  "QY Aurigae": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 55,
    orbits: "QY Aurigae", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- 2MASS J0136+0933 ---
  "2MASS J0136+0933": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 92000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.1, // T-Dwarf muy rápida
    orbits: "2MASS J0136+0933", kind: "brown_dwarf", radius: 3.2, emissive: new BABYLON.Color3(0.2, 0.05, 0.0)
  },

  // --- GLIESE 784 ---
  "Gliese 784": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 580000, color: 0xff6633, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 44,
    orbits: "Gliese 784", kind: "star", radius: 8, emissive: new BABYLON.Color3(0.9, 0.3, 0.1)
  },

  // --- GLIESE 1221 ---
  "Gliese 1221": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 130000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 18,
    orbits: "Gliese 1221", kind: "star", radius: 3.5, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- GLIESE 555 ---
  "Gliese 555": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 340000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 60,
    orbits: "Gliese 555", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- GLIESE 338 ---
  "Gliese 338 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 790000, color: 0xffaa44, orbits: "Gliese 338", kind: "star", radius: 8.5, emissive: new BABYLON.Color3(1.0, 0.7, 0.2), rotationPeriod: 30
  },
  "Gliese 338 B": {
    periapsis: 1500000000, apoapsis: 1500000000, orbitalPeriod: 300000, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 760000, color: 0xffaa44, orbits: "Gliese 338 A", kind: "star", radius: 8.5, emissive: new BABYLON.Color3(1.0, 0.7, 0.2), rotationPeriod: 32
  },

  // --- LHS 2090 ---
  "LHS 2090": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 160000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 12,
    orbits: "LHS 2090", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- WISEP J1503+2525 ---
  "WISEP J1503+2525": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 75000, color: 0x111122, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "WISEP J1503+2525", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.1, 0.0, 0.1)
  },

  // --- LP 944-20 ---
  "LP 944-20": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 120000, color: 0x441100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.15,
    orbits: "LP 944-20", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.3, 0.05, 0.0)
  },

  // --- GLIESE 223.2 ---
  "Gliese 223.2": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "Gliese 223.2", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.1, 0.05)
  },

  // --- V1054 OPHIUCHI (Triple) ---
  "V1054 Ophiuchi A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, orbits: "V1054 Ophiuchi", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 22
  },
  "V1054 Ophiuchi B": {
    periapsis: 450000, apoapsis: 450000, orbitalPeriod: 1.5, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 360000, color: 0xff4422, orbits: "V1054 Ophiuchi A", kind: "star", radius: 6.2, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 1.5
  },

  // --- 2MASS J0937+2931 ---
  "2MASS J0937+2931": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 85000, color: 0x331111, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.25,
    orbits: "2MASS J0937+2931", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.05, 0.05)
  },

  // --- GL VIRGINIS ---
  "GL Virginis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 150000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5, // Enana roja tipo flare
    orbits: "GL Virginis", kind: "star", radius: 4, emissive: new BABYLON.Color3(1.0, 0.1, 0.0)
  },

  // --- WISE J2209+2711 ---
  "WISE J2209+2711": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 60000, color: 0x000011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE J2209+2711", kind: "brown_dwarf", radius: 2.5, emissive: new BABYLON.Color3(0.02, 0.0, 0.1)
  },

  // --- GLIESE 625 ---
  "Gliese 625": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 320000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 80,
    orbits: "Gliese 625", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- GLIESE 1128 ---
  "Gliese 1128": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 190000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Gliese 1128", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- WISE J0410+1502 ---
  "WISE J0410+1502": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 65000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "WISE J0410+1502", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.1, 0.0, 0.1)
  },

  // --- GLIESE 892 ---
  "Gliese 892": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 820000, color: 0xffcc44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "Gliese 892", kind: "star", radius: 9, emissive: new BABYLON.Color3(1.0, 0.8, 0.4)
  },

  // --- CWISE J1055+5433 ---
  "CWISE J1055+5433": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 55000, color: 0x000011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.6,
    orbits: "CWISE J1055+5433", kind: "brown_dwarf", radius: 2.2, emissive: new BABYLON.Color3(0.01, 0.0, 0.08)
  },

  // --- GLIESE 408 ---
  "Gliese 408": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 510000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "Gliese 408", kind: "star", radius: 7.5, emissive: new BABYLON.Color3(0.9, 0.25, 0.1)
  },

  // --- GLIESE 299 ---
  "Gliese 299": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 180000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 100,
    orbits: "Gliese 299", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- GLIESE 829 ---
  "Gliese 829": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 290000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "Gliese 829", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.7, 0.15, 0.0)
  },

  // --- GLIESE 880 ---
  "Gliese 880": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 610000, color: 0xff6633, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 32,
    orbits: "Gliese 880", kind: "star", radius: 8.5, emissive: new BABYLON.Color3(0.9, 0.35, 0.1)
  },

  // --- EE LEONIS ---
  "EE Leonis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 310000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2.4, // Flare star
    orbits: "EE Leonis", kind: "star", radius: 6, emissive: new BABYLON.Color3(1.0, 0.2, 0.05)
  },
  
  /////
  
  // --- GLIESE 393 ---
  "Gliese 393": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 310000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 34,
    orbits: "Gliese 393", kind: "star", radius: 5.8, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- GLIESE 809 ---
  "Gliese 809": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 420000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 48,
    orbits: "Gliese 809", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- 2MASS J2146+3813 ---
  "2MASS J2146+3813": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 85000, color: 0x441122, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "2MASS J2146+3813", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.0, 0.1)
  },

  // --- GLIESE 3877 ---
  "Gliese 3877": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 190000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 3877", kind: "star", radius: 4.2, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- L 230-188 ---
  "L 230-188": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 220000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "L 230-188", kind: "star", radius: 4.8, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- WISE J0005+3737 ---
  "WISE J0005+3737": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 60000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "WISE J0005+3737", kind: "brown_dwarf", radius: 2.5, emissive: new BABYLON.Color3(0.1, 0.0, 0.15)
  },

  // --- GLIESE 1286 ---
  "Gliese 1286": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 140000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "Gliese 1286", kind: "star", radius: 3.8, emissive: new BABYLON.Color3(0.6, 0.05, 0.0)
  },

  // --- WISEA J082507.37+280548.2 ---
  "WISEA J082507.37+280548.2": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 55000, color: 0x000011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISEA J082507.37+280548.2", kind: "brown_dwarf", radius: 2.2, emissive: new BABYLON.Color3(0.01, 0.0, 0.1)
  },

  // --- 268 G. CETI (Gliese 91) ---
  "268 G. Cet": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 680000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 28,
    orbits: "268 G. Cet", kind: "star", radius: 8.2, emissive: new BABYLON.Color3(1.0, 0.6, 0.2)
  },

  // --- 2MASS 0835-0819 ---
  "2MASS 0835-0819": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 90000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.15,
    orbits: "2MASS 0835-0819", kind: "brown_dwarf", radius: 3.2, emissive: new BABYLON.Color3(0.2, 0.05, 0.0)
  },

  // --- GLIESE 4274 ---
  "Gliese 4274": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 4274", kind: "star", radius: 4.6, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- GLIESE 667 (Sistema Triple con Exoplanetas) ---
  "Gliese 667 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 750000, color: 0xffaa44, orbits: "Gliese 667", kind: "star", radius: 8.5, emissive: new BABYLON.Color3(1.0, 0.7, 0.3), rotationPeriod: 105
  },
  "Gliese 667 B": {
    periapsis: 12.6 * 149597870, apoapsis: 12.6 * 149597870, orbitalPeriod: 42 * 365, inclination: 128, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 680000, color: 0xffaa44, orbits: "Gliese 667 A", kind: "star", radius: 8, emissive: new BABYLON.Color3(1.0, 0.7, 0.3), rotationPeriod: 105
  },
  "Gliese 667 C": { // La estrella que alberga los planetas
    periapsis: 230 * 149597870, apoapsis: 230 * 149597870, orbitalPeriod: 2262 * 365, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 330000, color: 0xff2200, orbits: "Gliese 667 A", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0), rotationPeriod: 105
  },

  // --- GAIA EDR3 3426333598021539840 ---
  "Gaia EDR3 3426333598021539840": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 155000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 20,
    orbits: "Gaia EDR3 3426333598021539840", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- GAIA DR2 4733794485572154752 ---
  "Gaia DR2 4733794485572154752": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 145000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "Gaia DR2 4733794485572154752", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- WISE 0607+2429 ---
  "WISE 0607+2429": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 78000, color: 0x331122, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.35,
    orbits: "WISE 0607+2429", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.15, 0.0, 0.1)
  },

  // --- WISE 0049+2151 ---
  "WISE 0049+2151": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 82000, color: 0x221133, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE 0049+2151", kind: "brown_dwarf", radius: 3.2, emissive: new BABYLON.Color3(0.1, 0.0, 0.2)
  },

  // --- 2MASS J1507-1627 ---
  "2MASS J1507-1627": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 95000, color: 0x441100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.1,
    orbits: "2MASS J1507-1627", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.25, 0.05, 0.0)
  },

  // --- LHS 6167 ---
  "LHS 6167": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 170000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "LHS 6167", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- 96 G. PISCIUM (Gliese 54) ---
  "96 G. Piscium": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 510000, color: 0xff6633, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
    orbits: "96 G. Piscium", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.9, 0.3, 0.1)
  },

  // --- BB CAPRICORNUS ---
  "BB Capricornus": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 340000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2.5, // Estrella flare activa
    orbits: "BB Capricornus", kind: "star", radius: 6, emissive: new BABYLON.Color3(1.0, 0.2, 0.0)
  },

  // --- HU DELPHINI ---
  "HU Delphini": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 310000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.2,
    orbits: "HU Delphini", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(1.0, 0.1, 0.0)
  },

  // --- BETA HYDRI ---
  "Beta Hydri": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1500000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 21,
    orbits: "Beta Hydri", kind: "star", radius: 14, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- WISE 1405+5534 ---
  "WISE 1405+5534": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 65000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.45,
    orbits: "WISE 1405+5534", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.1, 0.0, 0.2)
  },

  // --- GAIA DR2 6702242043883732864 ---
  "Gaia DR2 6702242043883732864": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 130000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "Gaia DR2 6702242043883732864", kind: "star", radius: 3.5, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- GLIESE 3991 (Binaria) ---
  "Gliese 3991 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, orbits: "Gliese 3991", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 15
  },
  "Gliese 3991 B": { // Enana Blanca
    periapsis: 2500000, apoapsis: 2500000, orbitalPeriod: 14.7, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 11000, color: 0xccddff, orbits: "Gliese 3991 A", kind: "white_dwarf", radius: 1.8, emissive: new BABYLON.Color3(0.8, 0.9, 1.0), rotationPeriod: 0.05
  },

  // --- G141-36 ---
  "G141-36": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 180000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "G141-36", kind: "star", radius: 4.2, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- GLIESE 514 ---
  "Gliese 514": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 530000, color: 0xff6633, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Gliese 514", kind: "star", radius: 7.8, emissive: new BABYLON.Color3(0.9, 0.3, 0.1)
  },

  // --- GLIESE 4053 ---
  "Gliese 4053": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 390000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 42,
    orbits: "Gliese 4053", kind: "star", radius: 6.8, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- 107 PISCIUM ---
  "107 Piscium": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 890000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 24,
    orbits: "107 Piscium", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 0.9, 0.6)
  },

  // --- GLIESE 4248 ---
  "Gliese 4248": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 160000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 55,
    orbits: "Gliese 4248", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.05, 0.0)
  },

  // --- MU CASSIOPEIAE (Marfak) ---
  "Mu Cassiopeiae A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 820000, color: 0xffcc44, orbits: "Mu Cassiopeiae", kind: "star", radius: 9, emissive: new BABYLON.Color3(1.0, 0.8, 0.4), rotationPeriod: 22
  },
  "Mu Cassiopeiae B": {
    periapsis: 720000000, apoapsis: 720000000, orbitalPeriod: 22 * 365, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 240000, color: 0xff2200, orbits: "Mu Cassiopeiae A", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0), rotationPeriod: 30
  },
  
  /////
  
  // --- Vega ---
  "Vega": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 2500000, color: 0xccddee, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.52,
    orbits: "Vega", kind: "star", radius: 22, emissive: new BABYLON.Color3(0.9, 0.95, 1.0)
  },

  // --- Gliese 109 ---
  "Gliese 109": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
    orbits: "Gliese 109", kind: "star", radius: 6.2, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Fomalhaut ---
  "Fomalhaut": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1980000, color: 0xeeeeff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.6,
    orbits: "Fomalhaut", kind: "star", radius: 18, emissive: new BABYLON.Color3(0.9, 0.9, 1.0)
  },

  // --- AN Sextantis ---
  "AN Sextantis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 280000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 3.5,
    orbits: "AN Sextantis", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(1.0, 0.2, 0.0)
  },

  // --- Gliese 673 ---
  "Gliese 673": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 610000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 42,
    orbits: "Gliese 673", kind: "star", radius: 8, emissive: new BABYLON.Color3(1.0, 0.6, 0.2)
  },

  // --- SIPS J1259-4336 ---
  "SIPS J1259-4336": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 110000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 20,
    orbits: "SIPS J1259-4336", kind: "star", radius: 3.2, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- Gliese 2005 ---
  "Gliese 2005": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 150000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Gliese 2005", kind: "star", radius: 4.2, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Gliese 3378 ---
  "Gliese 3378": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 240000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "Gliese 3378", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- Gliese 701 ---
  "Gliese 701": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 440000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 32,
    orbits: "Gliese 701", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Gliese 1093 ---
  "Gliese 1093": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 28,
    orbits: "Gliese 1093", kind: "star", radius: 4.8, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- LP 71-82 ---
  "LP 71-82": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 130000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "LP 71-82", kind: "star", radius: 3.5, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- WISE 1800+0134 ---
  "WISE 1800+0134": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 88000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE 1800+0134", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.05, 0.0)
  },

  // --- Gliese 623 ---
  "Gliese 623": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 340000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 60,
    orbits: "Gliese 623", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- 2MASS 0729-3954 ---
  "2MASS 0729-3954": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 92000, color: 0x442200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "2MASS 0729-3954", kind: "brown_dwarf", radius: 3.2, emissive: new BABYLON.Color3(0.25, 0.1, 0.0)
  },

  // --- Gliese 1224 ---
  "Gliese 1224": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 195000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 1224", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- SCR J0740-4257 ---
  "SCR J0740-4257": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 140000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 22,
    orbits: "SCR J0740-4257", kind: "star", radius: 3.8, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- Pi3 Orionis ---
  "Pi3 Orionis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1350000, color: 0xffffdd, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2.1,
    orbits: "Pi3 Orionis", kind: "star", radius: 13, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- Gliese 257 ---
  "Gliese 257": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 310000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
    orbits: "Gliese 257", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- Gliese 1151 ---
  "Gliese 1151": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 180000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 120,
    orbits: "Gliese 1151", kind: "star", radius: 4.2, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Gliese 480.1 ---
  "Gliese 480.1": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 290000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "Gliese 480.1", kind: "star", radius: 5.2, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- Chi Draconis ---
  "Chi Draconis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1100000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 8,
    orbits: "Chi Draconis", kind: "star", radius: 11, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- Gliese 486 ---
  "Gliese 486": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 320000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "Gliese 486", kind: "star", radius: 5.8, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
  },

  // --- 2MASSW J2148162+400359 ---
  "2MASSW J2148162+400359": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 98000, color: 0x552211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "2MASSW J2148162+400359", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
  },

  // --- Gliese 793 ---
  "Gliese 793": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 360000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 55,
    orbits: "Gliese 793", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Gliese 1154 ---
  "Gliese 1154": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 190000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Gliese 1154", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- WISE 2220-3628 ---
  "WISE 2220-3628": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 62000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "WISE 2220-3628", kind: "brown_dwarf", radius: 2.5, emissive: new BABYLON.Color3(0.1, 0.0, 0.2)
  },

  // --- Gliese 300 ---
  "Gliese 300": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 480000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 300", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.9, 0.25, 0.1)
  },

  // --- Gliese 1087 ---
  "Gliese 1087": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 175000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 32,
    orbits: "Gliese 1087", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Gliese 686 ---
  "Gliese 686": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 510000, color: 0xff6633, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "Gliese 686", kind: "star", radius: 7.5, emissive: new BABYLON.Color3(0.9, 0.3, 0.1)
  },

  // --- Gliese 293 ---
  "Gliese 293": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 12000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.01,
    orbits: "Gliese 293", kind: "white_dwarf", radius: 1.5, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- UGPS J0521+3640 ---
  "UGPS J0521+3640": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 68000, color: 0x000011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "UGPS J0521+3640", kind: "brown_dwarf", radius: 2.5, emissive: new BABYLON.Color3(0.02, 0.0, 0.15)
  },

  // --- p Eridani ---
  "p Eridani": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 850000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "p Eridani", kind: "star", radius: 9.5, emissive: new BABYLON.Color3(1.0, 0.7, 0.2)
  },

  // --- Gaia EDR3 4479498508613790464 ---
  "Gaia EDR3 4479498508613790464": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 145000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 28,
    orbits: "Gaia EDR3 4479498508613790464", kind: "star", radius: 3.8, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- L 173-19 ---
  "L 173-19": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "L 173-19", kind: "star", radius: 4.6, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Gliese 884 ---
  "Gliese 884": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 650000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 42,
    orbits: "Gliese 884", kind: "star", radius: 8.5, emissive: new BABYLON.Color3(1.0, 0.7, 0.2)
  },

  // --- Gliese 48 ---
  "Gliese 48": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 410000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 36,
    orbits: "Gliese 48", kind: "star", radius: 6.2, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Gliese 54 ---
  "Gliese 54": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 530000, color: 0xff6633, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 54", kind: "star", radius: 7.5, emissive: new BABYLON.Color3(0.9, 0.35, 0.1)
  },

  // --- Gliese 747 ---
  "Gliese 747": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 80,
    orbits: "Gliese 747", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Gliese 915 ---
  "Gliese 915": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 13000, color: 0xeeffff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.05,
    orbits: "Gliese 915", kind: "white_dwarf", radius: 1.6, emissive: new BABYLON.Color3(0.9, 0.95, 1.0)
  },

  // --- Mu Herculis Aa ---
  "Mu Herculis Aa": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1600000, color: 0xffddaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 18,
    orbits: "Mu Herculis", kind: "star", radius: 15, emissive: new BABYLON.Color3(1.0, 0.8, 0.5)
  },
  
  ///////
  
  // --- Gliese 518 ---
  "Gliese 518": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 420000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 518", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Gliese 1227 ---
  "Gliese 1227": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 190000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "Gliese 1227", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Gliese 1289 ---
  "Gliese 1289": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 230000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 48,
    orbits: "Gliese 1289", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.15, 0.0)
  },

  // --- Gliese 185 ---
  "Gliese 185": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 460000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Gliese 185", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.9, 0.2, 0.1)
  },

  // --- 2MASS J18352–3123 ---
  "2MASS J18352–3123": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 85000, color: 0x331100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.12,
    orbits: "2MASS J18352–3123", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.2, 0.05, 0.0)
  },

  // --- SCR 1138-7721 ---
  "SCR 1138-7721": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 120000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 18,
    orbits: "SCR 1138-7721", kind: "star", radius: 3.5, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- 2MASS J1546-5534 ---
  "2MASS J1546-5534": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 90000, color: 0x441122, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.25,
    orbits: "2MASS J1546-5534", kind: "brown_dwarf", radius: 3.2, emissive: new BABYLON.Color3(0.2, 0.0, 0.1)
  },

  // --- TYC 3980-1081-1 ---
  "TYC 3980-1081-1": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 580000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 22,
    orbits: "TYC 3980-1081-1", kind: "star", radius: 8, emissive: new BABYLON.Color3(1.0, 0.6, 0.2)
  },

  // --- Beta Canum Venaticorum (Chara) ---
  "Beta Canum Venaticorum": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1100000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 10,
    orbits: "Beta Canum Venaticorum", kind: "star", radius: 12, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- Gliese 232 ---
  "Gliese 232": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 350000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 42,
    orbits: "Gliese 232", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.7, 0.15, 0.0)
  },

  // --- Gliese 618 ---
  "Gliese 618": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 400000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
    orbits: "Gliese 618", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Gliese 318 ---
  "Gliese 318": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 15000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.02,
    orbits: "Gliese 318", kind: "white_dwarf", radius: 1.8, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- 61 Virginis ---
  "61 Virginis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 950000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 29,
    orbits: "61 Virginis", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 0.95, 0.7)
  },

  // --- Gliese 1276 ---
  "Gliese 1276": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "Gliese 1276", kind: "star", radius: 4.8, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Gliese 493.1 ---
  "Gliese 493.1": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 280000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 44,
    orbits: "Gliese 493.1", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- Gliese 3454 ---
  "Gliese 3454": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 170000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 32,
    orbits: "Gliese 3454", kind: "star", radius: 4.2, emissive: new BABYLON.Color3(0.6, 0.05, 0.0)
  },

  // --- Gliese 877 ---
  "Gliese 877": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 310000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 877", kind: "star", radius: 5.8, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- CD Ceti ---
  "CD Ceti": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 250000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 9, // Rotación rápida para una enana roja
    orbits: "CD Ceti", kind: "star", radius: 5.2, emissive: new BABYLON.Color3(0.8, 0.1, 0.0)
  },

  // --- Zeta Tucanae ---
  "Zeta Tucanae": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1050000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "Zeta Tucanae", kind: "star", radius: 11, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- LP 502-56 ---
  "LP 502-56": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 135000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "LP 502-56", kind: "star", radius: 3.8, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- Gliese 3517 ---
  "Gliese 3517": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 195000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
    orbits: "Gliese 3517", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- AP Columbae ---
  "AP Columbae": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 330000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5, // Muy joven y rápida
    orbits: "AP Columbae", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(1.0, 0.2, 0.0)
  },

  // --- PM J11413-3624 ---
  "PM J11413-3624": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 110000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 20,
    orbits: "PM J11413-3624", kind: "star", radius: 3.5, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- Chi1 Orionis ---
  "Chi1 Orionis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1020000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 5.1,
    orbits: "Chi1 Orionis", kind: "star", radius: 10.5, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- Gliese 1207 ---
  "Gliese 1207": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 140000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "Gliese 1207", kind: "star", radius: 3.8, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- LP 991-84 ---
  "LP 991-84": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 125000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 22,
    orbits: "LP 991-84", kind: "star", radius: 3.6, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- 2MASS 0036+1821 ---
  "2MASS 0036+1821": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 80000, color: 0x220033, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.15,
    orbits: "2MASS 0036+1821", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.1, 0.0, 0.2)
  },

  // --- Gliese 250 ---
  "Gliese 250 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 820000, color: 0xffaa44, orbits: "Gliese 250", kind: "star", radius: 9, emissive: new BABYLON.Color3(1.0, 0.7, 0.2), rotationPeriod: 45
  },
  "Gliese 250 B": {
    periapsis: 500 * 149597870, apoapsis: 500 * 149597870, orbitalPeriod: 10000 * 365, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 450000, color: 0xff4422, orbits: "Gliese 250 A", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 50
  },

  // --- Gliese 450 ---
  "Gliese 450": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 390000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 36,
    orbits: "Gliese 450", kind: "star", radius: 6.8, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- 41 G. Arae ---
  "41 G. Arae": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 920000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "41 G. Arae", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 0.9, 0.6)
  },

  // --- 5 G. Capricorni ---
  "5 G. Capricorni": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 980000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 18,
    orbits: "5 G. Capricorni", kind: "star", radius: 11, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- Gliese 849 ---
  "Gliese 849": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 490000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 39,
    orbits: "Gliese 849", kind: "star", radius: 7.2, emissive: new BABYLON.Color3(0.9, 0.25, 0.1)
  },

  // --- Gliese 745 ---
  "Gliese 745 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, orbits: "Gliese 745", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 45
  },
  "Gliese 745 B": {
    periapsis: 1200 * 149597870, apoapsis: 1200 * 149597870, orbitalPeriod: 25000 * 365, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 370000, color: 0xff4422, orbits: "Gliese 745 A", kind: "star", radius: 5.8, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 45
  },

  // --- Xi Ursae Majoris Aa ---
  "Xi Ursae Majoris Aa": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1010000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 5.1,
    orbits: "Xi Ursae Majoris", kind: "star", radius: 10.5, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },
  
  /////
  
  // --- LDS 169 ---
  "LDS 169 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 420000, color: 0xff4422, orbits: "LDS 169", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 40
  },
  "LDS 169 B": {
    periapsis: 80 * 149597870, apoapsis: 110 * 149597870, orbitalPeriod: 600 * 365, inclination: 12, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, orbits: "LDS 169 A", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 45
  },

  // --- 284 G. Eridani ---
  "284 G. Eridani": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 890000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 22,
    orbits: "284 G. Eridani", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 0.95, 0.7)
  },

  // --- WISE 1217+1626 ---
  "WISE 1217+1626": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 72000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE 1217+1626", kind: "brown_dwarf", radius: 2.5, emissive: new BABYLON.Color3(0.1, 0.0, 0.2)
  },

  // --- Gliese 1105 ---
  "Gliese 1105": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 450000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
    orbits: "Gliese 1105", kind: "star", radius: 6.8, emissive: new BABYLON.Color3(0.9, 0.25, 0.1)
  },

  // --- Gliese 465 ---
  "Gliese 465": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 410000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 42,
    orbits: "Gliese 465", kind: "star", radius: 6.2, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- SCR J0630-7643 ---
  "SCR J0630-7643": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 135000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "SCR J0630-7643", kind: "star", radius: 3.8, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- DENIS 0334-49 ---
  "DENIS 0334-49": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 95000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "DENIS 0334-49", kind: "brown_dwarf", radius: 3.1, emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
  },

  // --- Gaia DR2 209067 ---
  "Gaia DR2 209067": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Gaia DR2 209067", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- CWISEP J1810 ---
  "CWISEP J1810": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 65000, color: 0x000011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "CWISEP J1810", kind: "brown_dwarf", radius: 2.2, emissive: new BABYLON.Color3(0.05, 0.0, 0.1)
  },

  // --- WISE J1810-1010 ---
  "WISE J1810-1010": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 78000, color: 0x221100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "WISE J1810-1010", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.2, 0.1, 0.0)
  },

  // --- 2MASS J0348-6022 ---
  "2MASS J0348-6022": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 92000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.25,
    orbits: "2MASS J0348-6022", kind: "brown_dwarf", radius: 3.2, emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
  },

  // --- FK Aquarii ---
  "FK Aquarii A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 520000, color: 0xff6633, orbits: "FK Aquarii", kind: "star", radius: 7.5, emissive: new BABYLON.Color3(0.9, 0.35, 0.1), rotationPeriod: 4.4
  },
  "FK Aquarii B": {
    periapsis: 1500000, apoapsis: 1500000, orbitalPeriod: 4.3, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 480000, color: 0xff5522, orbits: "FK Aquarii A", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.9, 0.25, 0.1), rotationPeriod: 4.3
  },

  // --- Gamma Leporis ---
  "Gamma Leporis A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1250000, color: 0xffffcc, orbits: "Gamma Leporis", kind: "star", radius: 13, emissive: new BABYLON.Color3(1.0, 1.0, 0.85), rotationPeriod: 14
  },
  "Gamma Leporis B": {
    periapsis: 96 * 149597870, apoapsis: 96 * 149597870, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 750000, color: 0xffaa44, orbits: "Gamma Leporis A", kind: "star", radius: 8.5, emissive: new BABYLON.Color3(1.0, 0.7, 0.2), rotationPeriod: 32
  },

  // --- Gliese 2066 ---
  "Gliese 2066": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 480000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 2066", kind: "star", radius: 7.2, emissive: new BABYLON.Color3(0.9, 0.25, 0.1)
  },

  // --- Gliese 3421 ---
  "Gliese 3421": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 240000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "Gliese 3421", kind: "star", radius: 5.2, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- LP 388-55 ---
  "LP 388-55": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 155000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 28,
    orbits: "LP 388-55", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- SZ Ursae Majoris ---
  "SZ Ursae Majoris A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 430000, color: 0xff4422, orbits: "SZ Ursae Majoris", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 2.8
  },
  "SZ Ursae Majoris B": {
    periapsis: 2200000, apoapsis: 2200000, orbitalPeriod: 5.4, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 180000, color: 0xff2200, orbits: "SZ Ursae Majoris A", kind: "star", radius: 4, emissive: new BABYLON.Color3(0.6, 0.1, 0.0), rotationPeriod: 5.4
  },

  // --- Gliese 433 ---
  "Gliese 433": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 470000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 73,
    orbits: "Gliese 433", kind: "star", radius: 7, emissive: new BABYLON.Color3(0.9, 0.2, 0.1)
  },

  // --- 2MASS 0727+1710 ---
  "2MASS 0727+1710": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 82000, color: 0x330011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.35,
    orbits: "2MASS 0727+1710", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.15, 0.0, 0.05)
  },

  // --- Rana (Delta Eridani) ---
  "Rana": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1650000, color: 0xffddaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "Rana", kind: "star", radius: 16, emissive: new BABYLON.Color3(1.0, 0.85, 0.6)
  },
  
  /////
  
  // --- HD 115953 ---
  "HD 115953": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 980000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "HD 115953", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- Gliese 3146 ---
  "Gliese 3146": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "Gliese 3146", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Gliese 2012 ---
  "Gliese 2012": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 195000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 2012", kind: "star", radius: 4.2, emissive: new BABYLON.Color3(0.6, 0.05, 0.0)
  },

  // --- V374 Pegasi ---
  "V374 Pegasi": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 320000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.44, // Rotación ultra rápida, muy activa
    orbits: "V374 Pegasi", kind: "star", radius: 5.8, emissive: new BABYLON.Color3(1.0, 0.2, 0.0)
  },

  // --- 2MASS J0652 ---
  "2MASS J0652": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 88000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "2MASS J0652", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
  },

  // --- WT 460 ---
  "WT 460": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 280000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "WT 460", kind: "star", radius: 5.2, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- Gliese 283 ---
  "Gliese 283 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 14000, color: 0xccddff, orbits: "Gliese 283", kind: "white_dwarf", radius: 1.6, emissive: new BABYLON.Color3(0.8, 0.9, 1.0), rotationPeriod: 0.05
  },
  "Gliese 283 B": {
    periapsis: 15 * 149597870, apoapsis: 15 * 149597870, orbitalPeriod: 40 * 365, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 220000, color: 0xff2200, orbits: "Gliese 283 A", kind: "star", radius: 4.8, emissive: new BABYLON.Color3(0.6, 0.1, 0.0), rotationPeriod: 30
  },

  // --- 2MASS 0355+1133 ---
  "2MASS 0355+1133": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 92000, color: 0x552211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "2MASS 0355+1133", kind: "brown_dwarf", radius: 3.2, emissive: new BABYLON.Color3(0.4, 0.1, 0.05)
  },

  // --- WISEP J2134 ---
  "WISEP J2134": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 68000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "WISEP J2134", kind: "brown_dwarf", radius: 2.4, emissive: new BABYLON.Color3(0.1, 0.0, 0.2)
  },

  // --- Argelander's Star (Groombridge 1830) ---
  "Argelander's Star": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 650000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 45,
    orbits: "Argelander's Star", kind: "star", radius: 8.5, emissive: new BABYLON.Color3(1.0, 0.7, 0.2)
  },

  // --- Gliese 3801 ---
  "Gliese 3801": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 180000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 32,
    orbits: "Gliese 3801", kind: "star", radius: 4.2, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Beta Comae Berenices ---
  "Beta Comae Berenices": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1100000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 11,
    orbits: "Beta Comae Berenices", kind: "star", radius: 12, emissive: new BABYLON.Color3(1.0, 0.95, 0.7)
  },

  // --- WISE 0148-7202 ---
  "WISE 0148-7202": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 60000, color: 0x000011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.6,
    orbits: "WISE 0148-7202", kind: "brown_dwarf", radius: 2.1, emissive: new BABYLON.Color3(0.05, 0.0, 0.15)
  },

  // --- WISE J0713 ---
  "WISE J0713": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 74000, color: 0x220033, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "WISE J0713", kind: "brown_dwarf", radius: 2.6, emissive: new BABYLON.Color3(0.1, 0.0, 0.25)
  },

  // --- 2MASS J1750 ---
  "2MASS J1750": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 82000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "2MASS J1750", kind: "brown_dwarf", radius: 2.9, emissive: new BABYLON.Color3(0.25, 0.1, 0.0)
  },

  // --- Gliese 190 ---
  "Gliese 190": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 440000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
    orbits: "Gliese 190", kind: "star", radius: 6.5, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Gliese 3325 ---
  "Gliese 3325": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 190000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 28,
    orbits: "Gliese 3325", kind: "star", radius: 4.5, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- Gliese 3128 ---
  "Gliese 3128": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 210000, color: 0xff2200, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "Gliese 3128", kind: "star", radius: 4.8, emissive: new BABYLON.Color3(0.6, 0.1, 0.0)
  },

  // --- WISE 0458+6434 ---
  "WISE 0458+6434 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 78000, color: 0x110022, orbits: "WISE 0458+6434", kind: "brown_dwarf", radius: 2.8, emissive: new BABYLON.Color3(0.1, 0.0, 0.2), rotationPeriod: 0.5
  },
  "WISE 0458+6434 B": {
    periapsis: 5 * 149597870, apoapsis: 5 * 149597870, orbitalPeriod: 15 * 365, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 72000, color: 0x000011, orbits: "WISE 0458+6434 A", kind: "brown_dwarf", radius: 2.5, emissive: new BABYLON.Color3(0.05, 0.0, 0.1), rotationPeriod: 0.6
  },

  // --- CFBDS J0059 ---
  "CFBDS J0059": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 66000, color: 0x000011, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.4,
    orbits: "CFBDS J0059", kind: "brown_dwarf", radius: 2.3, emissive: new BABYLON.Color3(0.02, 0.0, 0.1)
  },

  // --- Gamma Pavonis ---
  "Gamma Pavonis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1150000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 12,
    orbits: "Gamma Pavonis", kind: "star", radius: 13, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- WISE 1804+3117 ---
  "WISE 1804+3117": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 88000, color: 0x442211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.3,
    orbits: "WISE 1804+3117", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
  },

  // --- Gliese 1103 ---
  "Gliese 1103 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 380000, color: 0xff4422, orbits: "Gliese 1103", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 45
  },
  "Gliese 1103 B": {
    periapsis: 2200000, apoapsis: 2200000, orbitalPeriod: 5.4, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 110000, color: 0xff1100, orbits: "Gliese 1103 A", kind: "star", radius: 3.2, emissive: new BABYLON.Color3(0.4, 0.05, 0.0), rotationPeriod: 5.4
  },

  // --- Kappa 1 Ceti ---
  "Kappa 1 Ceti": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 960000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 9, // Estrella joven tipo solar
    orbits: "Kappa 1 Ceti", kind: "star", radius: 10.5, emissive: new BABYLON.Color3(1.0, 0.95, 0.7)
  },

  // --- WISEP J2325 ---
  "WISEP J2325": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 70000, color: 0x110022, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "WISEP J2325", kind: "brown_dwarf", radius: 2.4, emissive: new BABYLON.Color3(0.1, 0.0, 0.2)
  },

  // --- SDSS J1416+1348 ---
  "SDSS J1416+1348 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 85000, color: 0x442211, orbits: "SDSS J1416+1348", kind: "brown_dwarf", radius: 3, emissive: new BABYLON.Color3(0.3, 0.1, 0.05), rotationPeriod: 0.3
  },
  "SDSS J1416+1348 B": {
    periapsis: 9 * 149597870, apoapsis: 9 * 149597870, orbitalPeriod: 25 * 365, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 65000, color: 0x000011, orbits: "SDSS J1416+1348 A", kind: "brown_dwarf", radius: 2.2, emissive: new BABYLON.Color3(0.05, 0.0, 0.15), rotationPeriod: 0.4
  },

  // --- 2MASS J0011+5908 ---
  "2MASS J0011+5908": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 95000, color: 0x552211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "2MASS J0011+5908", kind: "brown_dwarf", radius: 3.3, emissive: new BABYLON.Color3(0.4, 0.1, 0.05)
  },

  // --- 66 G. Centauri ---
  "66 G. Centauri": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 870000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 28,
    orbits: "66 G. Centauri", kind: "star", radius: 10, emissive: new BABYLON.Color3(1.0, 0.95, 0.7)
  },

  // --- Gliese 84 ---
  "Gliese 84": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 490000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 39,
    orbits: "Gliese 84", kind: "star", radius: 7.2, emissive: new BABYLON.Color3(0.9, 0.25, 0.1)
  },

  // --- 2MASS J1821 ---
  "2MASS J1821": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 98000, color: 0x552211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.2,
    orbits: "2MASS J1821", kind: "brown_dwarf", radius: 3.5, emissive: new BABYLON.Color3(0.35, 0.1, 0.05)
  },

  // --- 2MASS J0340 ---
  "2MASS J0340": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 94000, color: 0x552211, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.25,
    orbits: "2MASS J0340", kind: "brown_dwarf", radius: 3.3, emissive: new BABYLON.Color3(0.4, 0.1, 0.05)
  },

  // --- Ross 837 ---
  "Ross 837": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 260000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 48,
    orbits: "Ross 837", kind: "star", radius: 5.2, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- Gliese 3135 ---
  "Gliese 3135": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 230000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Gliese 3135", kind: "star", radius: 5, emissive: new BABYLON.Color3(0.7, 0.15, 0.0)
  },

  // --- Gliese 3306 ---
  "Gliese 3306 A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 410000, color: 0xff4422, orbits: "Gliese 3306", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1), rotationPeriod: 36
  },
  "Gliese 3306 B": {
    periapsis: 2500000, apoapsis: 2500000, orbitalPeriod: 6.2, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 150000, color: 0xff2200, orbits: "Gliese 3306 A", kind: "star", radius: 3.8, emissive: new BABYLON.Color3(0.6, 0.05, 0.0), rotationPeriod: 6.2
  },

  // --- Wolf 1062 ---
  "Wolf 1062": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 340000, color: 0xff4422, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 52,
    orbits: "Wolf 1062", kind: "star", radius: 6, emissive: new BABYLON.Color3(0.8, 0.2, 0.1)
  },

  // --- Gliese 367 ---
  "Gliese 367": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 310000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 48,
    orbits: "Gliese 367", kind: "star", radius: 5.5, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- Gliese 357 ---
  "Gliese 357": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 240000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 78,
    orbits: "Gliese 357", kind: "star", radius: 5.2, emissive: new BABYLON.Color3(0.7, 0.1, 0.0)
  },

  // --- Gliese 226 ---
  "Gliese 226": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 470000, color: 0xff5522, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 35,
    orbits: "Gliese 226", kind: "star", radius: 7.1, emissive: new BABYLON.Color3(0.9, 0.2, 0.1)
  },

  // --- UCAC4 379-100760 ---
  "UCAC4 379-100760": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 145000, color: 0xff1100, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 22,
    orbits: "UCAC4 379-100760", kind: "star", radius: 3.6, emissive: new BABYLON.Color3(0.5, 0.05, 0.0)
  },

  // --- 1RXS J115928 ---
  "1RXS J115928": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 290000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5, // Enana roja activa
    orbits: "1RXS J115928", kind: "star", radius: 5.4, emissive: new BABYLON.Color3(1.0, 0.2, 0.0)
  },
  
  //////
  
  // --- Pollux (Gigante naranja) ---
  "Pollux": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 8500000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 38,
    orbits: "Pollux", kind: "star", radius: 45, emissive: new BABYLON.Color3(1.0, 0.6, 0.2)
  },

  // --- Denebola ---
  "Denebola": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1700000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.6,
    orbits: "Denebola", kind: "star", radius: 18, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Arcturus (Gigante roja brillante) ---
  "Arcturus": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 25000000, color: 0xff7722, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 100,
    orbits: "Arcturus", kind: "star", radius: 65, emissive: new BABYLON.Color3(1.0, 0.4, 0.1)
  },

  // --- Capella (Sistema Cuádruple) ---
  "Capella Aa": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 12000000, color: 0xffffaa, orbits: "Capella", kind: "star", radius: 50, emissive: new BABYLON.Color3(1.0, 0.9, 0.5), rotationPeriod: 104
  },
  "Capella Ab": {
    periapsis: 110000000, apoapsis: 110000000, orbitalPeriod: 104, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 8000000, color: 0xffffaa, orbits: "Capella Aa", kind: "star", radius: 35, emissive: new BABYLON.Color3(1.0, 0.9, 0.6), rotationPeriod: 104
  },

  // --- Gamma Cephei (Yondair) ---
  "Gamma Cephei": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 4800000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 70,
    orbits: "Gamma Cephei", kind: "star", radius: 30, emissive: new BABYLON.Color3(0.9, 0.6, 0.2)
  },

  // --- Caph ---
  "Caph": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 3500000, color: 0xffffff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.1,
    orbits: "Caph", kind: "star", radius: 25, emissive: new BABYLON.Color3(1.0, 1.0, 1.0)
  },

  // --- Castor (Sistema Sextuple - Representado como binario principal) ---
  "Castor A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 2200000, color: 0xccddff, orbits: "Castor", kind: "star", radius: 20, emissive: new BABYLON.Color3(0.8, 0.9, 1.0), rotationPeriod: 0.8
  },
  "Castor B": {
    periapsis: 100 * 149597870, apoapsis: 100 * 149597870, orbitalPeriod: 445 * 365, inclination: 25, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1800000, color: 0xccddff, orbits: "Castor A", kind: "star", radius: 17, emissive: new BABYLON.Color3(0.8, 0.9, 1.0), rotationPeriod: 0.9
  },

  // --- Hamal ---
  "Hamal": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 14000000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 50,
    orbits: "Hamal", kind: "star", radius: 55, emissive: new BABYLON.Color3(1.0, 0.5, 0.2)
  },

  // --- Aldebaran (El ojo del Toro) ---
  "Aldebaran": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 44000000, color: 0xff8833, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 400,
    orbits: "Aldebaran", kind: "star", radius: 90, emissive: new BABYLON.Color3(1.0, 0.4, 0.1)
  },

  // --- Psi Draconis ---
  "Psi Draconis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1300000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "Psi Draconis", kind: "star", radius: 15, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },

  // --- Alphecca ---
  "Alphecca": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 3000000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.5,
    orbits: "Alphecca", kind: "star", radius: 22, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Mizar & Alcor ---
  "Mizar": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 2400000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2,
    orbits: "Mizar", kind: "star", radius: 20, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Merak ---
  "Merak": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 3000000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2,
    orbits: "Merak", kind: "star", radius: 22, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Regulus ---
  "Regulus": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 3500000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.6,
    orbits: "Regulus", kind: "star", radius: 24, emissive: new BABYLON.Color3(0.9, 0.95, 1.0)
  },

  // --- Alioth ---
  "Alioth": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 4000000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 5,
    orbits: "Alioth", kind: "star", radius: 26, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Mu Draconis (Laoujin) ---
  "Mu Draconis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1500000, color: 0xffffff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 12,
    orbits: "Mu Draconis", kind: "star", radius: 15, emissive: new BABYLON.Color3(1.0, 1.0, 1.0)
  },

  // --- Algol (La estrella endemoniada) ---
  "Algol A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 2800000, color: 0xccddff, orbits: "Algol", kind: "star", radius: 25, emissive: new BABYLON.Color3(0.8, 0.9, 1.0), rotationPeriod: 2.86
  },
  "Algol B": {
    periapsis: 9000000, apoapsis: 9000000, orbitalPeriod: 2.86, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 3500000, color: 0xffaa44, orbits: "Algol A", kind: "star", radius: 20, emissive: new BABYLON.Color3(1.0, 0.6, 0.2), rotationPeriod: 2.86
  },

  // --- Altais ---
  "Altais": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 10000000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 40,
    orbits: "Altais", kind: "star", radius: 40, emissive: new BABYLON.Color3(1.0, 0.9, 0.4)
  },

  // --- Alkaid ---
  "Alkaid": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 3400000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1,
    orbits: "Alkaid", kind: "star", radius: 25, emissive: new BABYLON.Color3(0.5, 0.7, 1.0)
  },

  // --- Alnair ---
  "Alnair": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 3400000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.8,
    orbits: "Alnair", kind: "star", radius: 24, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Epsilon Ophiuchi (Epsilon Alangue) ---
  "Epsilon Ophiuchi": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 10500000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 60,
    orbits: "Epsilon Ophiuchi", kind: "star", radius: 42, emissive: new BABYLON.Color3(1.0, 0.7, 0.3)
  },

  // --- Miaplacidus ---
  "Miaplacidus": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 6800000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2,
    orbits: "Miaplacidus", kind: "star", radius: 32, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Dubhe (Binaria Osa Mayor) ---
  "Dubhe A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 30000000, color: 0xffaa44, orbits: "Dubhe", kind: "star", radius: 70, emissive: new BABYLON.Color3(1.0, 0.6, 0.2), rotationPeriod: 100
  },

  // --- Alkalurops ---
  "Alkalurops": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 2500000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.2,
    orbits: "Alkalurops", kind: "star", radius: 18, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Gamma Piscium (Gamma Waiping) ---
  "Gamma Piscium": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 11000000, color: 0xffffaa, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 55,
    orbits: "Gamma Piscium", kind: "star", radius: 45, emissive: new BABYLON.Color3(1.0, 0.9, 0.4)
  },

  // --- Achernar (Muy achatada por rotación) ---
  "Achernar": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 6700000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.2,
    orbits: "Achernar", kind: "star", radius: 35, emissive: new BABYLON.Color3(0.6, 0.8, 1.0)
  },

  // --- Alpha Piscium ---
  "Alpha Piscium A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 2000000, color: 0xccddff, orbits: "Alpha Piscium", kind: "star", radius: 18, emissive: new BABYLON.Color3(0.8, 0.9, 1.0), rotationPeriod: 1.5
  },

  // --- Theta Eridani (Thalim) ---
  "Theta Eridani A": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 4000000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1,
    orbits: "Theta Eridani", kind: "star", radius: 28, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Alpha Crateris (Alces Minor) ---
  "Alpha Crateris": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 13000000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 80,
    orbits: "Alpha Crateris", kind: "star", radius: 52, emissive: new BABYLON.Color3(1.0, 0.7, 0.3)
  },

  // --- Theta Leonis (Theta Shaowei) ---
  "Theta Leonis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 4200000, color: 0xffffff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1,
    orbits: "Theta Leonis", kind: "star", radius: 28, emissive: new BABYLON.Color3(1.0, 1.0, 1.0)
  },

  // --- Peacock ---
  "Peacock": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 4800000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.8,
    orbits: "Peacock", kind: "star", radius: 30, emissive: new BABYLON.Color3(0.5, 0.7, 1.0)
  },

  // --- Schedar (Gigante naranja en Casiopea) ---
  "Schedar": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 45000000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 500,
    orbits: "Schedar", kind: "star", radius: 95, emissive: new BABYLON.Color3(1.0, 0.6, 0.2)
  },

  // --- Iota Leporis (Kuentsing) ---
  "Iota Leporis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 2100000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1,
    orbits: "Iota Leporis", kind: "star", radius: 18, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Bellatrix ---
  "Bellatrix": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 5800000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "Bellatrix", kind: "star", radius: 35, emissive: new BABYLON.Color3(0.6, 0.8, 1.0)
  },

  // --- Spica ---
  "Spica": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 7800000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 4,
    orbits: "Spica", kind: "star", radius: 45, emissive: new BABYLON.Color3(0.5, 0.7, 1.0)
  },

  // --- Alpha Carinae (Canopus) ---
  "Alpha Carinae": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 70000000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Alpha Carinae", kind: "star", radius: 130, emissive: new BABYLON.Color3(1.0, 1.0, 0.9)
  },

  // --- HD 58661 (Beta Lyncis) ---
  "HD 58661": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 28000000, color: 0xffaa44, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 120,
    orbits: "HD 58661", kind: "star", radius: 85, emissive: new BABYLON.Color3(1.0, 0.7, 0.3)
  },

  // --- Polaris (Estrella Polar - Sistema Triple) ---
  "Polaris Aa": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 45000000, color: 0xffffaa, orbits: "Polaris", kind: "star", radius: 110, emissive: new BABYLON.Color3(1.0, 1.0, 0.8), rotationPeriod: 119
  },

  // --- Theta Arietis (Theta Shalish) ---
  "Theta Arietis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 1800000, color: 0xffffff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 10,
    orbits: "Theta Arietis", kind: "star", radius: 18, emissive: new BABYLON.Color3(1.0, 1.0, 1.0)
  },

  // --- Mirfak ---
  "Mirfak": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 60000000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 15,
    orbits: "Mirfak", kind: "star", radius: 140, emissive: new BABYLON.Color3(0.9, 0.95, 1.0)
  },

  // --- Adhara (Brillante en ultravioleta) ---
  "Adhara": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 14000000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "Adhara", kind: "star", radius: 60, emissive: new BABYLON.Color3(0.4, 0.6, 1.0)
  },

  // --- Antares (Supergigante roja masiva) ---
  "Antares": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 700000000, color: 0xff4411, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1500,
    orbits: "Antares", kind: "star", radius: 450, emissive: new BABYLON.Color3(1.0, 0.2, 0.0)
  },

  // --- Alpha Orionis (Betelgeuse - Unsidor) ---
  "Alpha Orionis": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 900000000, color: 0xff3300, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2000,
    orbits: "Alpha Orionis", kind: "star", radius: 500, emissive: new BABYLON.Color3(1.0, 0.15, 0.0)
  },

  // --- Saiph ---
  "Saiph": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 22000000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1,
    orbits: "Saiph", kind: "star", radius: 80, emissive: new BABYLON.Color3(0.5, 0.7, 1.0)
  },

  // --- Rigel (Supergigante azul) ---
  "Rigel": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 78000000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 25,
    orbits: "Rigel", kind: "star", radius: 180, emissive: new BABYLON.Color3(0.8, 0.9, 1.0)
  },

  // --- Naos ---
  "Naos": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 20000000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 4.8,
    orbits: "Naos", kind: "star", radius: 90, emissive: new BABYLON.Color3(0.4, 0.6, 1.0)
  },

  // --- El Cinturón de Orión (Alnitak, Mintaka, Alnilam) ---
  "Alnitak": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 20000000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 7,
    orbits: "Alnitak", kind: "star", radius: 100, emissive: new BABYLON.Color3(0.5, 0.7, 1.0)
  },
  "Mintaka": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 16000000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 5,
    orbits: "Mintaka", kind: "star", radius: 95, emissive: new BABYLON.Color3(0.5, 0.7, 1.0)
  },
  "Alnilam": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 42000000, color: 0xccddff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.8,
    orbits: "Alnilam", kind: "star", radius: 120, emissive: new BABYLON.Color3(0.7, 0.8, 1.0)
  },

  // --- Las Gigantes de Can Mayor (Wezen & Aludra) ---
  "Wezen": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 215000000, color: 0xffffcc, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 30,
    orbits: "Wezen", kind: "star", radius: 250, emissive: new BABYLON.Color3(1.0, 1.0, 0.8)
  },
  "Aludra": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 56000000, color: 0x99bbff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 20,
    orbits: "Aludra", kind: "star", radius: 160, emissive: new BABYLON.Color3(0.5, 0.6, 1.0)
  },

  // --- Deneb (Una de las más lejanas y brillantes visibles) ---
  "Deneb": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 200000000, color: 0xffffff, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.5,
    orbits: "Deneb", kind: "star", radius: 300, emissive: new BABYLON.Color3(1.0, 1.0, 1.0)
  },

  // --- Sagittarius A* (El núcleo de la Galaxia) ---
  "Sagittarius A*": {
    periapsis: 0, apoapsis: 0, orbitalPeriod: 0, inclination: 0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0, lastPerihelion: "2024-01-01",
    size: 24000000, color: 0x000000, rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.01,
    orbits: "Galactic Center", kind: "black_hole", radius: 1000, emissive: new BABYLON.Color3(0.05, 0.0, 0.1)
  },
		  
		//---------------------------  
		    
        "Alkalurops": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 720000,
          color: 0xe8f3ff,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Alkalurops",
    
          kind: "sun",
          radius: 30,
          emissive: new BABYLON.Color3(0.92, 0.95, 1.0),
        },
		    
        "Gamma Piscium": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 700000,
          color: 0xfff5dd,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Gamma Piscium",
    
          kind: "sun",
          radius: 29,
          emissive: new BABYLON.Color3(1.0, 0.94, 0.80),
        },
    
        "Theta Arietis": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 690000,
          color: 0xffdfb0,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Theta Arietis",
    
          kind: "sun",
          radius: 28,
          emissive: new BABYLON.Color3(1.0, 0.82, 0.60),
        },
    
        "Theta Leonis": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 630000,
          color: 0xffcfaa,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Theta Leonis",
    
          kind: "sun",
          radius: 25,
          emissive: new BABYLON.Color3(0.95, 0.78, 0.55),
        },
    
        "Psi Draconis": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 670000,
          color: 0xfff0dd,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Psi Draconis",
    
          kind: "sun",
          radius: 27,
          emissive: new BABYLON.Color3(0.95, 0.90, 0.82),
        },
    

    
		"Alpha Piscium A": {
		  periapsis: 6582375000, 
		  apoapsis: 19747125000,
		  orbitalPeriod: 262800, 
		  inclination: 65, 
		  argumentOfPeriapsis: 0,
		  longitudeOfAscendingNode: 0,
		  lastPerihelion: "2024-01-01",

		  size: 1391400, 
		  color: 0xe6f0ff,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,
		  rotationPeriod: 2.1,

		  orbits: "Alpha Piscium",

		  kind: "sun",
		  radius: 52,
		  emissive: new BABYLON.Color3(0.9, 0.94, 1.0),
		},

		"Alpha Piscium B": {
		  periapsis: 8377625000, 
		  apoapsis: 25132875000,
		  orbitalPeriod: 262800, 
		  inclination: 65, 
		  argumentOfPeriapsis: 180, // Lado opuesto de la elipse
		  longitudeOfAscendingNode: 0,
		  lastPerihelion: "2024-01-01",

		  size: 1043550, 
		  color: 0xfffcf5,
		  rotationAxis: { x: 0, y: 1, z: 0 },
		  axialTilt: 0,
		  rotationPeriod: 3.5,

		  orbits: "Alpha Piscium",

		  kind: "sun",
		  radius: 39,
		  emissive: new BABYLON.Color3(1.0, 0.98, 0.9),
		},
    
        "Mu Draconis": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 650000,
          color: 0xfff0d2,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Mu Draconis",
    
          kind: "sun",
          radius: 26,
          emissive: new BABYLON.Color3(0.95, 0.92, 0.78),
        },
    
		"Theta Eridani A": {
			periapsis: 0, 
			apoapsis: 0,
			orbitalPeriod: 0,
			inclination: 0,
			argumentOfPeriapsis: 0,
			longitudeOfAscendingNode: 0,
			lastPerihelion: "2024-01-01",

			size: 1113000,             // Radio en km (~1.6 radios solares)
			color: 0x99ccff,           // Blanco azulado (Tipo A)
			rotationAxis: { x: 0, y: 1, z: 0 },
			axialTilt: 0,
			rotationPeriod: 2.1,       // Días terrestres (Rotación rápida típica de estrellas A)

			orbits: "Theta Eridani",

			kind: "sun",
			radius: 45,                // Visualmente más grande por su alta luminosidad
			emissive: new BABYLON.Color3(0.7, 0.8, 1.0), // Brillo blanco-azul frío
		},
		
		"Theta Eridani B": {
			// Parámetros orbitales (Sistema con separación visual de 8.3 segundos de arco)
			periapsis: 52359254745,      // 350 UA en km
			apoapsis: 74798935350,      // 500 UA en km
			orbitalPeriod: 1168800,     // 3200 años en días
			inclination: 54,            // Grados
			argumentOfPeriapsis: 110,   // Grados
			longitudeOfAscendingNode: 15, // Grados
			lastPerihelion: "1550-01-01",

			size: 904000,              // Radio en km (~1.3 radios solares)
			color: 0xdae9ff,           // Blanco puro
			rotationAxis: { x: 0, y: 1, z: 0 },
			axialTilt: 0,
			rotationPeriod: 1.8,       // Días terrestres

			orbits: "Theta Eridani",

			kind: "sun",
			radius: 35,                // Un poco menor que la A
			emissive: new BABYLON.Color3(0.9, 0.9, 1.0),
		},
    
        "Iota Leporis": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 680000,
          color: 0xffedd0,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Iota Leporis",
    
          kind: "sun",
          radius: 27,
          emissive: new BABYLON.Color3(0.95, 0.88, 0.70),
        },
    
        "Epsilon Ophiuchi": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 700000,
          color: 0xe9f2ff,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Epsilon Ophiuchi",
    
          kind: "sun",
          radius: 28,
          emissive: new BABYLON.Color3(0.90, 0.92, 1.0),
        },
    
        "HD 58661": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 760000,
          color: 0xfff0d2,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "HD 58661",
    
          kind: "sun",
          radius: 30,
          emissive: new BABYLON.Color3(0.95, 0.90, 0.78),
        },
    
        "Alpha Crateris": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 760000,
          color: 0xfff0d2,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Alpha Crateris",
    
          kind: "sun",
          radius: 30,
          emissive: new BABYLON.Color3(0.95, 0.90, 0.78),
        },
    

    
        "Alpha Orionis": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 700000,
          color: 0xfff5dd,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Alpha Orionis",
    
          kind: "sun",
          radius: 29,
          emissive: new BABYLON.Color3(1.0, 0.94, 0.80),
        },
    
        "Gamma Cephei": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
          size: 650000,
          color: 0xfff0d2,
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 27,
    
          orbits: "Gamma Cephei",
    
          kind: "sun",
          radius: 26,
          emissive: new BABYLON.Color3(0.95, 0.92, 0.78),
        },
		
		"Alpha Carinae": {
          periapsis: 0, apoapsis: 0,
          orbitalPeriod: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          lastPerihelion: "2024-01-01",
    
    	  // Ajustado para que Arrakis (a 87M km) esté fuera y sea habitable
    	  // Un radio de ~15M km permite una visualización épica sin "comerse" al planeta
    	  // Radio escalado (9M es el límite de Seban; usamos 7.65M para dejar espacio)
          size: 7650000,
          color: 0xffffff, // Blanco puro (Supergigante Clase A)
          rotationAxis: { x: 0, y: 1, z: 0 },
          axialTilt: 0,
          rotationPeriod: 300,
    
          orbits: "Alpha Carinae",
    
          kind: "sun",
          radius: 152.3,
          emissive: new BABYLON.Color3(1.0, 0.95, 0.85),
        },
		
		"Polaris Aa": {
			periapsis: 0, 
			apoapsis: 0,
			orbitalPeriod: 0,
			inclination: 0, 
			argumentOfPeriapsis: 0,
			longitudeOfAscendingNode: 0,
			lastPerihelion: "2024-01-01",
            
            // Características físicas de la Supergigante (Polaris Aa)
            size: 32000000,           // Radio estimado (~46 radios solares)
            color: 0xffffcc,           // Blanco amarillento (Clase F7)
            rotationAxis: { x: 0, y: 1, z: 0 },
            axialTilt: 0,
            rotationPeriod: 119,       // Días (rotación lenta de supergigante)
            
			orbits: "Polaris",
            kind: "sun",
            radius: 50,                // Escala visual mayor en el mapa
            emissive: new BABYLON.Color3(1.0, 1.0, 0.8),
        },

        "Polaris Ab": {
            // Órbita muy cercana a la estrella principal (A)
            periapsis: 2244000000,     // ~15 UA en km
            apoapsis: 3141500000,      // ~21 UA en km
            orbitalPeriod: 10950,      // ~30 años en días
            inclination: 50.0,
            argumentOfPeriapsis: 303.0,
            longitudeOfAscendingNode: 231.0,
            lastPerihelion: "2006-01-01",

            size: 723000,              // ~1.04 radios solares (Enana secuencia principal)
            color: 0xffffff,
            rotationAxis: { x: 0, y: 1, z: 0 },
            axialTilt: 0,
            rotationPeriod: 1.0,
            
            orbits: "Polaris",
            kind: "sun",
            radius: 5,
            emissive: new BABYLON.Color3(0.9, 0.9, 1.0),
        },

        "Polaris B": {
            // Órbita mucho más lejana (Referencia: respecto a A)
            periapsis: 359000000000,   // ~2400 UA en km
            apoapsis: 374000000000,    // Estimado (órbita casi circular a gran distancia)
            orbitalPeriod: 15330000,   // ~42,000 años en días
            inclination: 38.0,
            argumentOfPeriapsis: 0,
            longitudeOfAscendingNode: 0,
            lastPerihelion: "1900-01-01",

            size: 967000,              // ~1.39 radios solares (Clase F3)
            color: 0xf0f0ff,
            rotationAxis: { x: 0, y: 1, z: 0 },
            axialTilt: 0,
            rotationPeriod: 1.5,
            
            orbits: "Polaris",
            kind: "sun",
            radius: 8,
            emissive: new BABYLON.Color3(0.8, 0.8, 1.0),
        },
		
      },	  
    
      // ============================================================
      // PLANETS: planetId KEY. "orbits" apunta a starId.
      // ============================================================
      planets: {
        // ----------------------------------------------------------
        // Sistema SOL
        // ----------------------------------------------------------
        "Mercurio": {
          periapsis: 46000000, apoapsis: 69800000,
          size: 2439.5, color: 0xaaaaaa,
          orbits: "Sol", orbitalPeriod: 88,
          // JPL approx. positions (Table 1, J2000 ecliptic/equinox)
          inclination: 7.00497902, argumentOfPeriapsis: 29.12703035, longitudeOfAscendingNode: 48.33076593,
          epochJD: 2451545.0,
          semiMajorAxisAuAtEpoch: 0.38709927,
          semiMajorAxisRateAuPerCentury: 0.00000037,
          eccentricityAtEpoch: 0.20563593,
          eccentricityRatePerCentury: 0.00001906,
          inclinationAtEpoch: 7.00497902,
          inclinationRateDegPerCentury: -0.00594749,
          meanLongitudeAtEpoch: 252.25032350,
          meanLongitudeRateDegPerCentury: 149472.67411175,
          longitudeOfPerihelionAtEpoch: 77.45779628,
          longitudeOfPerihelionRateDegPerCentury: 0.16047689,
          longitudeOfAscendingNodeAtEpoch: 48.33076593,
          longitudeOfAscendingNodeRateDegPerCentury: -0.12534081,
		  lastPerihelion: "2026-02-19",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.034, rotationPeriod: 58.7,
          jsonFile: "mercurio.json",
        },
    
        "Venus": {
          periapsis: 107480000, apoapsis: 108940000,
          size: 6052, color: 0xff9900,
          orbits: "Sol", orbitalPeriod: 224.7,
          // ω = long.peri - long.node = 131.60246718 - 76.67984255
          inclination: 3.39467605, argumentOfPeriapsis: 54.92262463, longitudeOfAscendingNode: 76.67984255,
          epochJD: 2451545.0,
          semiMajorAxisAuAtEpoch: 0.72333566,
          semiMajorAxisRateAuPerCentury: 0.00000390,
          eccentricityAtEpoch: 0.00677672,
          eccentricityRatePerCentury: -0.00004107,
          inclinationAtEpoch: 3.39467605,
          inclinationRateDegPerCentury: -0.00078890,
          meanLongitudeAtEpoch: 181.97909950,
          meanLongitudeRateDegPerCentury: 58517.81538729,
          longitudeOfPerihelionAtEpoch: 131.60246718,
          longitudeOfPerihelionRateDegPerCentury: 0.00268329,
          longitudeOfAscendingNodeAtEpoch: 76.67984255,
          longitudeOfAscendingNodeRateDegPerCentury: -0.27769418,
		  lastPerihelion: "2025-10-02",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 177.36, rotationPeriod: -243.02,
          jsonFile: "venus.json",
        },
    
        "Tierra": {
          periapsis: 147090000, apoapsis: 152100000,
          size: 6371, color: 0x0000ff,
          orbits: "Sol", orbitalPeriod: 365.25,
          // JPL usa EM Bary para la órbita terrestre aproximada
          inclination: -0.00001531, argumentOfPeriapsis: 102.93768193, longitudeOfAscendingNode: 0.0,
          epochJD: 2451545.0,
          semiMajorAxisAuAtEpoch: 1.00000261,
          semiMajorAxisRateAuPerCentury: 0.00000562,
          eccentricityAtEpoch: 0.01671123,
          eccentricityRatePerCentury: -0.00004392,
          inclinationAtEpoch: -0.00001531,
          inclinationRateDegPerCentury: -0.01294668,
          meanLongitudeAtEpoch: 100.46457166,
          meanLongitudeRateDegPerCentury: 35999.37244981,
          longitudeOfPerihelionAtEpoch: 102.93768193,
          longitudeOfPerihelionRateDegPerCentury: 0.32327364,
          longitudeOfAscendingNodeAtEpoch: 0.0,
          longitudeOfAscendingNodeRateDegPerCentury: 0.0,
		  lastPerihelion: "2026-01-03",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 23.44, rotationPeriod: 0.99726968,
          jsonFile: "tierra.json",
        },
    
        "Marte": {
          periapsis: 206620000, apoapsis: 249230000,
          size: 3389.5, color: 0xff3300,
          orbits: "Sol", orbitalPeriod: 687,
          // ω = -23.94362959 - 49.55953891 = -73.50316850 => 286.49683150
          inclination: 1.84969142, argumentOfPeriapsis: 286.49683150, longitudeOfAscendingNode: 49.55953891,
          epochJD: 2451545.0,
          semiMajorAxisAuAtEpoch: 1.52371034,
          semiMajorAxisRateAuPerCentury: 0.00001847,
          eccentricityAtEpoch: 0.09339410,
          eccentricityRatePerCentury: 0.00007882,
          inclinationAtEpoch: 1.84969142,
          inclinationRateDegPerCentury: -0.00813131,
          meanLongitudeAtEpoch: -4.55343205,
          meanLongitudeRateDegPerCentury: 19140.30268499,
          longitudeOfPerihelionAtEpoch: -23.94362959,
          longitudeOfPerihelionRateDegPerCentury: 0.44441088,
          longitudeOfAscendingNodeAtEpoch: 49.55953891,
          longitudeOfAscendingNodeRateDegPerCentury: -0.29257343,
		  lastPerihelion: "2024-05-08",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 25.19, rotationPeriod: 1.02595675,
          jsonFile: "marte.json",
        },
    
        "Jupiter": {
          periapsis: 740520000, apoapsis: 816620000,
          size: 71492, color: 0xb5651d,
          orbits: "Sol", orbitalPeriod: 4332.59,
          // ω = 14.72847983 - 100.47390909 = -85.74542926 => 274.25457074
          inclination: 1.30439695, argumentOfPeriapsis: 274.25457074, longitudeOfAscendingNode: 100.47390909,
          epochJD: 2451545.0,
          semiMajorAxisAuAtEpoch: 5.20288700,
          semiMajorAxisRateAuPerCentury: -0.00011607,
          eccentricityAtEpoch: 0.04838624,
          eccentricityRatePerCentury: -0.00013253,
          inclinationAtEpoch: 1.30439695,
          inclinationRateDegPerCentury: -0.00183714,
          meanLongitudeAtEpoch: 34.39644051,
          meanLongitudeRateDegPerCentury: 3034.74612775,
          longitudeOfPerihelionAtEpoch: 14.72847983,
          longitudeOfPerihelionRateDegPerCentury: 0.21252668,
          longitudeOfAscendingNodeAtEpoch: 100.47390909,
          longitudeOfAscendingNodeRateDegPerCentury: 0.20469106,
		  lastPerihelion: "2023-01-22",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 3.13, rotationPeriod: 0.41,
          jsonFile: "jupiter.json",
        },
    
        "Saturno": {
          periapsis: 1352550000, apoapsis: 1514500000,
          size: 60268, color: 0xf4a460,
          orbits: "Sol", orbitalPeriod: 10759.22,
          // ω = 92.59887831 - 113.66242448 = -21.06354617 => 338.93645383
          inclination: 2.48599187, argumentOfPeriapsis: 338.93645383, longitudeOfAscendingNode: 113.66242448,
          epochJD: 2451545.0,
          semiMajorAxisAuAtEpoch: 9.53667594,
          semiMajorAxisRateAuPerCentury: -0.00125060,
          eccentricityAtEpoch: 0.05386179,
          eccentricityRatePerCentury: -0.00050991,
          inclinationAtEpoch: 2.48599187,
          inclinationRateDegPerCentury: 0.00193609,
          meanLongitudeAtEpoch: 49.95424423,
          meanLongitudeRateDegPerCentury: 1222.49362201,
          longitudeOfPerihelionAtEpoch: 92.59887831,
          longitudeOfPerihelionRateDegPerCentury: -0.41897216,
          longitudeOfAscendingNodeAtEpoch: 113.66242448,
          longitudeOfAscendingNodeRateDegPerCentury: -0.28867794,
		  lastPerihelion: "2003-07-21",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 26.73, rotationPeriod: 0.45,
          jsonFile: "saturno.json",
        },
    	
    	"Urano": { 
    		periapsis: 2741300000, apoapsis: 3006300000, 
    		size: 25362, color: 0x00ffff, 
    		orbits: "Sol", orbitalPeriod: 30685, 
            // ω = 170.95427630 - 74.01692503 = 96.93735127
            inclination: 0.77263783, argumentOfPeriapsis: 96.93735127, longitudeOfAscendingNode: 74.01692503, 
            epochJD: 2451545.0,
            semiMajorAxisAuAtEpoch: 19.18916464,
            semiMajorAxisRateAuPerCentury: -0.00196176,
            eccentricityAtEpoch: 0.04725744,
            eccentricityRatePerCentury: -0.00004397,
            inclinationAtEpoch: 0.77263783,
            inclinationRateDegPerCentury: -0.00242939,
            meanLongitudeAtEpoch: 313.23810451,
            meanLongitudeRateDegPerCentury: 428.48202785,
            longitudeOfPerihelionAtEpoch: 170.95427630,
            longitudeOfPerihelionRateDegPerCentury: 0.40805281,
            longitudeOfAscendingNodeAtEpoch: 74.01692503,
            longitudeOfAscendingNodeRateDegPerCentury: 0.04240589,
			lastPerihelion: "1966-06-25", 
    		rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 97.77, rotationPeriod: -0.72, // Rotación retrógrada
			jsonFile: "urano.json",
    	},
    	"Neptuno": { 
    		periapsis: 4444400000, apoapsis: 4545700000, 
    		size: 24622, color: 0x0000ff, 
    		orbits: "Sol", orbitalPeriod: 60190, 
            // ω = 44.96476227 - 131.78422574 = -86.81946347 => 273.18053653
            inclination: 1.77004347, argumentOfPeriapsis: 273.18053653, longitudeOfAscendingNode: 131.78422574, 
            epochJD: 2451545.0,
            semiMajorAxisAuAtEpoch: 30.06992276,
            semiMajorAxisRateAuPerCentury: 0.00026291,
            eccentricityAtEpoch: 0.00859048,
            eccentricityRatePerCentury: 0.00005105,
            inclinationAtEpoch: 1.77004347,
            inclinationRateDegPerCentury: 0.00035372,
            meanLongitudeAtEpoch: -55.12002969,
            meanLongitudeRateDegPerCentury: 218.45945325,
            longitudeOfPerihelionAtEpoch: 44.96476227,
            longitudeOfPerihelionRateDegPerCentury: -0.32241464,
            longitudeOfAscendingNodeAtEpoch: 131.78422574,
            longitudeOfAscendingNodeRateDegPerCentury: -0.00508664,
			lastPerihelion: "1877-10-25", 
    		rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 28.32, rotationPeriod: 0.67,
			jsonFile: "neptuno.json",
    	},
    	"Ceres": {
    		periapsis: 413700000, apoapsis: 445600000, 
    		size: 473, color: 0xb0c4de, 
    		orbits: "Sol", orbitalPeriod: 1680,
    		inclination: 10.59, argumentOfPeriapsis: 73.41, longitudeOfAscendingNode: 80.33, 
    		lastPerihelion: "2022-01-01",
    		rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 4, rotationPeriod: 0.38,
			jsonFile: "ceres.json",
    	},
    	"Pluton": {
    		periapsis: 4437000000, apoapsis: 7376000000, 
    		size: 1188.3, color: 0xa9a9a9, 
    		orbits: "Sol", orbitalPeriod: 90560,
    		inclination: 17.16, argumentOfPeriapsis: 113.76, longitudeOfAscendingNode: 110.3, 
    		lastPerihelion: "1989-09-05",
    		rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 122.5, rotationPeriod: -6.39,
			jsonFile: "pluton.json",
    	},
    	"Haumea": {
    		periapsis: 5155000000, apoapsis: 7748000000, 
    		size: 780, color: 0xffffff, 
    		orbits: "Sol", orbitalPeriod: 103250,
    		inclination: 28.22, argumentOfPeriapsis: 240.2, longitudeOfAscendingNode: 122.1, 
    		lastPerihelion: "1992-01-01",
    		rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 126, rotationPeriod: 0.16,
			jsonFile: "haumea.json",
    	},
    	"Makemake": {
    		periapsis: 5103000000, apoapsis: 7935000000, 
    		size: 715, color: 0xffd700, 
    		orbits: "Sol", orbitalPeriod: 112897,
    		inclination: 28.98, argumentOfPeriapsis: 296.1, longitudeOfAscendingNode: 79.62, 
    		lastPerihelion: "2023-01-01",
    		rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.32
    	},
    	"Eris": {
    		periapsis: 5766000000, apoapsis: 14544000000, 
    		size: 1163, color: 0xffffff, 
    		orbits: "Sol", orbitalPeriod: 204670,
    		inclination: 44.04, argumentOfPeriapsis: 151.8, longitudeOfAscendingNode: 35.95, 
    		lastPerihelion: "1699-08-01",
    		rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 78, rotationPeriod: 1.08
    	},
    
        // ----------------------------------------------------------
        // Sistema CANOPUS (Dune)
        // ----------------------------------------------------------
        "Seban": {
          periapsis: 36000000, apoapsis: 40000000,
          size: 2440, color: 0xaaaaaa,
          orbits: "Alpha Carinae", orbitalPeriod: 88,
          inclination: 7.0, argumentOfPeriapsis: 29.124, longitudeOfAscendingNode: 48.331,
          lastPerihelion: "2024-02-15",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.034, rotationPeriod: 58.646,
          jsonFile: "seban.json",
        },
    
        "Menaris": {
          periapsis: 58000000, apoapsis: 62000000,
          size: 5992, color: 0xff9900,
          orbits: "Alpha Carinae", orbitalPeriod: 225.0,
          inclination: 3.39, argumentOfPeriapsis: 54.852, longitudeOfAscendingNode: 76.67,
          lastPerihelion: "2023-08-13",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 177.36, rotationPeriod: -243.02,
          jsonFile: "menaris.json",
        },
    
        "Arrakis": {
          periapsis: 82600000, apoapsis: 91400000,
          size: 6128, color: 0xffeaaf,
          orbits: "Alpha Carinae", orbitalPeriod: 353.041,
          inclination: 1.25, argumentOfPeriapsis: 114.208, longitudeOfAscendingNode: 348.739,
          lastPerihelion: "2024-01-03",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.5, rotationPeriod: 1.0,
          jsonFile: "arrakis.json",
        },
    
        "Extaris": {
          periapsis: 135000000, apoapsis: 145000000,
          size: 5341, color: 0xff3300,
          orbits: "Alpha Carinae", orbitalPeriod: 687,
          inclination: 1.85, argumentOfPeriapsis: 286.537, longitudeOfAscendingNode: 49.562,
          lastPerihelion: "2023-11-20",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 25.19, rotationPeriod: 1.02595675,
          jsonFile: "extaris.json",
        },
    
        "Ven": {
          periapsis: 230000000, apoapsis: 250000000,
          size: 61284, color: 0xb5651d,
          orbits: "Alpha Carinae", orbitalPeriod: 1850.0,
          inclination: 0.8, argumentOfPeriapsis: 150.0, longitudeOfAscendingNode: 22.0,
          lastPerihelion: "2024-05-10",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 3.13, rotationPeriod: 0.41,
          jsonFile: "ven.json",
        },
    
        "Revona": {
          periapsis: 440000000, apoapsis: 470000000,
          size: 51520, color: 0xf4a460,
          orbits: "Alpha Carinae", orbitalPeriod: 4332.0,
          inclination: 2.49, argumentOfPeriapsis: 94.3, longitudeOfAscendingNode: 131.7,
          lastPerihelion: "2024-08-20",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 26.73, rotationPeriod: 0.45,
          jsonFile: "revona.json",
        },
    
        // ----------------------------------------------------------
        // Catálogo Dune (planetas sueltos, cada uno con su estrella)
        // ----------------------------------------------------------
        "Caladan": {
          periapsis: 160000000, apoapsis: 170000000,
          size: 4460, color: 0x2f6fb3,
          orbits: "Delta Pavonis", orbitalPeriod: 410,
          inclination: 1.9, argumentOfPeriapsis: 114.0, longitudeOfAscendingNode: 48.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 18.0, rotationPeriod: 0.92,
          jsonFile: "caladan.json",
        },
    
        "Giedi Prime": {
          periapsis: 120000000, apoapsis: 140000000,
          size: 4200, color: 0x4a4a4a,
          orbits: "36 Ophiuchi B", orbitalPeriod: 290,
          inclination: 3.2, argumentOfPeriapsis: 62.0, longitudeOfAscendingNode: 210.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 6.0, rotationPeriod: 0.78,
          jsonFile: "giedi-prime.json",
        },
    
        "Ix": {
          periapsis: 105000000, apoapsis: 112000000,
          size: 3750, color: 0x8fd3ff,
          orbits: "Alkalurops", orbitalPeriod: 235,
          inclination: 2.4, argumentOfPeriapsis: 18.0, longitudeOfAscendingNode: 320.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 11.0, rotationPeriod: 1.06,
          jsonFile: "ix.json",
        },
    
        "Richese": {
          periapsis: 135000000, apoapsis: 155000000,
          size: 4080, color: 0x2aa6c8,
          orbits: "Epsilon Eridani", orbitalPeriod: 335,
          inclination: 1.1, argumentOfPeriapsis: 140.0, longitudeOfAscendingNode: 75.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 23.0, rotationPeriod: 1.12,
          jsonFile: "richese.json",
        },
    
        "Kaitain": {
          periapsis: 145000000, apoapsis: 155000000,
          size: 4020, color: 0x5bc06a,
          orbits: "Alpha Piscium A", orbitalPeriod: 365,
          inclination: 0.8, argumentOfPeriapsis: 102.0, longitudeOfAscendingNode: 12.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 21.0, rotationPeriod: 0.98,
          jsonFile: "kaitain.json",
        },
    
        "Salusa Secundus": {
          periapsis: 210000000, apoapsis: 255000000,
          size: 3820, color: 0x8a6b4b,
          orbits: "Gamma Piscium", orbitalPeriod: 620,
          inclination: 4.7, argumentOfPeriapsis: 250.0, longitudeOfAscendingNode: 33.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 33.0, rotationPeriod: 1.45,
        },
    
        "Wallach IX": {
          periapsis: 98000000, apoapsis: 108000000,
          size: 3180, color: 0x6cbf7a,
          orbits: "Mu Draconis", orbitalPeriod: 210,
          inclination: 1.6, argumentOfPeriapsis: 80.0, longitudeOfAscendingNode: 190.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 14.0, rotationPeriod: 0.74,
        },
    
        "Tleilax": {
          periapsis: 88000000, apoapsis: 103000000,
          size: 3120, color: 0x7ea0b5,
          orbits: "Theta Eridani A", orbitalPeriod: 185,
          inclination: 2.8, argumentOfPeriapsis: 310.0, longitudeOfAscendingNode: 260.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 5.0, rotationPeriod: 1.90,
        },
    
        "Rossak": {
          periapsis: 72000000, apoapsis: 86000000,
          size: 3060, color: 0x1b8f3f,
          orbits: "Alpha Crateris", orbitalPeriod: 145,
          inclination: 6.1, argumentOfPeriapsis: 170.0, longitudeOfAscendingNode: 45.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 29.0, rotationPeriod: 0.68,
          jsonFile: "rossak.json",
        },
    
        "Buzzell": {
          periapsis: 175000000, apoapsis: 205000000,
          size: 2930, color: 0x2a6fd6,
          orbits: "Alpha Piscium B", orbitalPeriod: 510,
          inclination: 3.9, argumentOfPeriapsis: 12.0, longitudeOfAscendingNode: 155.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 40.0, rotationPeriod: 0.83,
        },
    
        "Lampadas": {
          periapsis: 112000000, apoapsis: 138000000,
          size: 2990, color: 0x555555,
          orbits: "Mu Draconis", orbitalPeriod: 275,
          inclination: 2.2, argumentOfPeriapsis: 205.0, longitudeOfAscendingNode: 88.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 9.0, rotationPeriod: 1.02,
        },
    
        "Ginaz": {
          periapsis: 130000000, apoapsis: 150000000,
          size: 3600, color: 0x3aa5ff,
          orbits: "Alpha Piscium B", orbitalPeriod: 320,
          inclination: 1.3, argumentOfPeriapsis: 44.0, longitudeOfAscendingNode: 22.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 27.0, rotationPeriod: 0.88,
        },
    
        "Ecaz": {
			// Es el cuarto, así que lo alejamos más en el esquema
			periapsis: 650000000, 
			apoapsis: 720000000,
			size: 6100,                  // Tamaño similar a Venus/Tierra
			color: 0x2e8b57,             // Verde bosque (por su densa vegetación y maderas)
			orbits: "Alpha Centauri B",  // Orbita específicamente a la estrella B
			orbitalPeriod: 2200, 
			inclination: 1.8, 
			argumentOfPeriapsis: 240.0, 
			longitudeOfAscendingNode: 15.0,
			lastPerihelion: "2024-08-15",
			
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 18.0, 
			rotationPeriod: 0.98,        // Día casi terrestre			
			jsonFile: "ecaz.json",
        },
    
        "Chusuk": {
          periapsis: 140000000, apoapsis: 165000000,
          size: 3950, color: 0x2fb35a,
          orbits: "Theta Arietis", orbitalPeriod: 360,
          inclination: 1.7, argumentOfPeriapsis: 90.0, longitudeOfAscendingNode: 60.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 24.0, rotationPeriod: 1.05,
        },
    
        "Hagal": {
          periapsis: 60000000, apoapsis: 68000000,
          size: 2800, color: 0xb3f0ff,
          orbits: "Theta Leonis", orbitalPeriod: 120,
          inclination: 5.6, argumentOfPeriapsis: 275.0, longitudeOfAscendingNode: 140.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 2.0, rotationPeriod: 0.51,
        },
    
        "Gamont": {
          periapsis: 155000000, apoapsis: 190000000,
          size: 4100, color: 0x2f8f7f,
          orbits: "Psi Draconis", orbitalPeriod: 460,
          inclination: 2.9, argumentOfPeriapsis: 10.0, longitudeOfAscendingNode: 200.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 32.0, rotationPeriod: 0.97,
        },
    
        "Grumman": {
          periapsis: 220000000, apoapsis: 290000000,
          size: 3750, color: 0x8c8c8c,
          orbits: "Psi Draconis", orbitalPeriod: 780,
          inclination: 4.1, argumentOfPeriapsis: 188.0, longitudeOfAscendingNode: 15.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 12.0, rotationPeriod: 1.62,
        },
    
        "Poritrin": {
          periapsis: 105000000, apoapsis: 128000000,
          size: 4010, color: 0x3ac46a,
          orbits: "Epsilon Ophiuchi", orbitalPeriod: 240,
          inclination: 1.2, argumentOfPeriapsis: 56.0, longitudeOfAscendingNode: 270.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 28.0, rotationPeriod: 0.91,
        },
    
        "Bela Tegeuse": {
          periapsis: 180000000, apoapsis: 240000000,
          size: 4200, color: 0x7fb4ff,
          orbits: "Iota Leporis", orbitalPeriod: 640,
          inclination: 3.0, argumentOfPeriapsis: 330.0, longitudeOfAscendingNode: 100.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 17.0, rotationPeriod: 1.10,
        },
    
        "Lankiveil": {
          periapsis: 520000000, apoapsis: 720000000,
          size: 3900, color: 0x9bd7ff,
          orbits: "Delta Pavonis", orbitalPeriod: 3200,
          inclination: 7.8, argumentOfPeriapsis: 15.0, longitudeOfAscendingNode: 250.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 9.0, rotationPeriod: 1.28,
        },
    
        "Corrin": {
          periapsis: 240000000, apoapsis: 310000000,
          size: 3950, color: 0xff6b3a,
          orbits: "Sigma Draconis", orbitalPeriod: 860,
          inclination: 5.1, argumentOfPeriapsis: 120.0, longitudeOfAscendingNode: 5.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 16.0, rotationPeriod: 1.34,
        },
    
        "Tanegaard": {
          periapsis: 150000000, apoapsis: 165000000,
          size: 4050, color: 0x88a0a8,
          orbits: "Alpha Piscium B", orbitalPeriod: 370,
          inclination: 0.6, argumentOfPeriapsis: 240.0, longitudeOfAscendingNode: 40.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 3.0, rotationPeriod: 0.99,
        },
    
        "Conexión": {
          periapsis: 170000000, apoapsis: 210000000,
          size: 3600, color: 0x6b7a7f,
          orbits: "Psi Draconis", orbitalPeriod: 520,
          inclination: 2.0, argumentOfPeriapsis: 96.0, longitudeOfAscendingNode: 180.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 7.0, rotationPeriod: 0.93,
        },
    
        "Kolhar": {
          periapsis: 260000000, apoapsis: 340000000,
          size: 3700, color: 0xb9d8ff,
          orbits: "Psi Draconis", orbitalPeriod: 980,
          inclination: 6.4, argumentOfPeriapsis: 200.0, longitudeOfAscendingNode: 290.0,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 22.0, rotationPeriod: 1.08,
        },

		// --- PLANETAS DE PROXIMA CENTAURI ---
		"Proxima b": {
			periapsis: 170000000, apoapsis: 210000000,
			size: 6371, color: 0x6b7a7f,
			orbits: "Proxima Centauri", orbitalPeriod: 520,
			inclination: 2.0, argumentOfPeriapsis: 96.0, longitudeOfAscendingNode: 180.0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 7.0, rotationPeriod: 0.93,
			kind: "planet", radius: 2.5,
			jsonFile: "proxima_b.json",
		},
		
		"Proxima d": {
			periapsis: 280000000, apoapsis: 320000000,
			size: 3200, color: 0x21353c,
			orbits: "Proxima Centauri", orbitalPeriod: 850,
			inclination: 1.5, argumentOfPeriapsis: 45.0, longitudeOfAscendingNode: 210.0,
			lastPerihelion: "2024-03-12",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 2.0, rotationPeriod: 1.1,
			kind: "planet", radius: 1.8,
			jsonFile: "proxima_d.json",
		},
		
		// --- PLANETA DE ALPHA CENTAURI A (Candidato) ---
		"Alp2Cen A-b": {
			periapsis: 450000000, apoapsis: 510000000,
			size: 12000, color: 0x5a6a6f,
			orbits: "Alpha Centauri A", orbitalPeriod: 1400,
			inclination: 0.5, argumentOfPeriapsis: 180.0, longitudeOfAscendingNode: 15.0,
			lastPerihelion: "2023-11-20",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 10.0, rotationPeriod: 0.85,
			kind: "planet", radius: 4.2,
			jsonFile: "vulcanis.json",
		},
		
		// --- PLANETAS INTERIORES DE ALPHA CENTAURI B (Para completar el sistema de Ecaz) ---

		// Alp2Cen B-b: El primer planeta, un mundo de roca fundida.
		"Alp2Cen B-b": {
			periapsis: 170000000, 
			apoapsis: 210000000,
			size: 3100, 
			color: 0x5c4033, // Marrón oscuro/quemado
			orbits: "Alpha Centauri B", 
			orbitalPeriod: 520,
			inclination: 2.5, 
			argumentOfPeriapsis: 96.0, 
			longitudeOfAscendingNode: 180.0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 2.0, 
			rotationPeriod: 0.8,
			kind: "planet",
			radius: 2.1,
			jsonFile: "alp2cen_b-b.json",
		},

		// Alp2Cen B-c: El segundo planeta, un desierto de polvo sulfuroso.
		"Alp2Cen B-c": {
			periapsis: 320000000, 
			apoapsis: 370000000,
			size: 4800, 
			color: 0x9c8e5e, // Ocre/Arena
			orbits: "Alpha Centauri B", 
			orbitalPeriod: 980,
			inclination: 1.2, 
			argumentOfPeriapsis: 45.0, 
			longitudeOfAscendingNode: 210.0,
			lastPerihelion: "2024-04-10",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 15.0, 
			rotationPeriod: 1.1,
			kind: "planet",
			radius: 2.6
		},

		// Alp2Cen B-d: El tercer planeta, un mundo volcánico activo.
		"Alp2Cen B-d": {
			periapsis: 480000000, 
			apoapsis: 540000000,
			size: 5900, 
			color: 0x7b3f00, // Color tierra rojiza
			orbits: "Alpha Centauri B", 
			orbitalPeriod: 1550,
			inclination: 0.8, 
			argumentOfPeriapsis: 180.0, 
			longitudeOfAscendingNode: 30.0,
			lastPerihelion: "2023-11-20",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 23.0, 
			rotationPeriod: 1.3,
			kind: "planet",
			radius: 2.8
		},
		
		// --- SISTEMA ESTRELLA DE BARNARD ---
		
		"Barnard b": {
			periapsis: 170000000, 
			apoapsis: 210000000,
			size: 3600, 
			color: 0x6b7a7f,
			orbits: "Barnard's Star", 
			orbitalPeriod: 520,
			inclination: 2.0, 
			argumentOfPeriapsis: 96.0, 
			longitudeOfAscendingNode: 180.0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 7.0, 
			rotationPeriod: 0.93,
			kind: "planet",
			radius: 2.5
		},
		
		"Barnard c": {
			periapsis: 290000000, 
			apoapsis: 330000000,
			size: 4100, 
			color: 0x7a868a,
			orbits: "Barnard's Star", 
			orbitalPeriod: 850,
			inclination: 1.5, 
			argumentOfPeriapsis: 45.0, 
			longitudeOfAscendingNode: 210.0,
			lastPerihelion: "2024-03-12",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 12.0, 
			rotationPeriod: 1.10,
			kind: "planet",
			radius: 2.8
		},
		
		"Barnard d": {
			periapsis: 450000000, 
			apoapsis: 510000000,
			size: 3800, 
			color: 0x5a6469,
			orbits: "Barnard's Star", 
			orbitalPeriod: 1400,
			inclination: 0.5, 
			argumentOfPeriapsis: 180.0, 
			longitudeOfAscendingNode: 15.0,
			lastPerihelion: "2023-11-20",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 3.0, 
			rotationPeriod: 0.85,
			kind: "planet",
			radius: 2.3
		},
		
		"Barnard e": {
			periapsis: 620000000, 
			apoapsis: 690000000,
			size: 5200, 
			color: 0x4d5659,
			orbits: "Barnard's Star", 
			orbitalPeriod: 2100,
			inclination: 1.2, 
			argumentOfPeriapsis: 270.0, 
			longitudeOfAscendingNode: 120.0,
			lastPerihelion: "2024-06-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 25.0, 
			rotationPeriod: 1.50,
			kind: "planet",
			radius: 3.5
		},
		
		// --- SISTEMA LALANDE 21185 ---
  
		// Lalande 21185 b: Una Super-Tierra cercana a la estrella.
		"Lalande 21185 b": {
			periapsis: 170000000, 
			apoapsis: 210000000,
			size: 4200, // Un poco más grande que tu ejemplo anterior
			color: 0x7a8b99,
			orbits: "Lalande 21185", 
			orbitalPeriod: 520,
			inclination: 2.0, 
			argumentOfPeriapsis: 96.0, 
			longitudeOfAscendingNode: 180.0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 7.0, 
			rotationPeriod: 0.93,
			kind: "planet",
			radius: 2.8
		},
		
		// Lalande 21185 d: El planeta intermedio (candidato muy probable).
		"Lalande 21185 d": {
			periapsis: 310000000, 
			apoapsis: 360000000,
			size: 4800, 
			color: 0x8e9ba2,
			orbits: "Lalande 21185", 
			orbitalPeriod: 890,
			inclination: 1.8, 
			argumentOfPeriapsis: 45.0, 
			longitudeOfAscendingNode: 220.0,
			lastPerihelion: "2024-03-15",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 12.0, 
			rotationPeriod: 1.15,
			kind: "planet",
			radius: 3.2
		},
		
		// Lalande 21185 c: Un gigante gaseoso (similar a Neptuno/Urano).
		"Lalande 21185 c": {
			periapsis: 520000000, 
			apoapsis: 590000000,
			size: 22000, // Mucho más grande, es un gigante gaseoso
			color: 0x5c6b70,
			orbits: "Lalande 21185", 
			orbitalPeriod: 1800,
			inclination: 0.8, 
			argumentOfPeriapsis: 180.0, 
			longitudeOfAscendingNode: 15.0,
			lastPerihelion: "2023-11-20",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 3.0, 
			rotationPeriod: 0.65, // Rotación más rápida como los gigantes gaseosos
			kind: "planet",
			radius: 5.5
		},
		
		// --- PLANETAS DE SIRIUS A ---
		
		// Sirius A-b: Un gigante gaseoso masivo (Super-Júpiter)
		"Sirius A-b": {
			periapsis: 170000000, 
			apoapsis: 210000000,
			size: 71000, // Tamaño similar a Júpiter
			color: 0xdae4e8, // Blanco azulado brillante por el reflejo de la estrella
			orbits: "Sirius", 
			orbitalPeriod: 520,
			inclination: 2.0, 
			argumentOfPeriapsis: 96.0, 
			longitudeOfAscendingNode: 180.0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 3.0, 
			rotationPeriod: 0.41, // Rotación muy rápida
			kind: "planet",
			radius: 9.0
		},
		
		// Sirius A-c: Un gigante helado en el borde del sistema
		"Sirius A-c": {
			periapsis: 350000000, 
			apoapsis: 410000000,
			size: 25000, 
			color: 0x8fa9b3,
			orbits: "Sirius", 
			orbitalPeriod: 1200,
			inclination: 4.5, 
			argumentOfPeriapsis: 210.0, 
			longitudeOfAscendingNode: 45.0,
			lastPerihelion: "2024-06-15",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 28.0, 
			rotationPeriod: 0.72,
			kind: "planet",
			radius: 6.0
		},
		
		// --- PLANETAS DE SIRIUS B ---
		
		// Sirius B-b: Un "Mundo Cadáver" (Planeta superviviente a una Nova)
		"Sirius B-b": {
			periapsis: 120000000, 
			apoapsis: 150000000,
			size: 5800, 
			color: 0x4a4a4a, // Ceniza oscura
			orbits: "Sirius B", 
			orbitalPeriod: 310,
			inclination: 12.0, 
			argumentOfPeriapsis: 0.0, 
			longitudeOfAscendingNode: 0.0,
			lastPerihelion: "2024-02-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 45.0, 
			rotationPeriod: 2.1,
			kind: "planet",
			radius: 3.0
		},
		
		// --- SISTEMA GL 729 (ROSS 154) ---
		
		// Gl 729 b: Un mundo abrasado por las fulguraciones
		"Gliese 729 b": {
			periapsis: 170000000, 
			apoapsis: 210000000,
			size: 3400, 
			color: 0x8b4513, // Tono bronce/marrón por la radiación
			orbits: "Gliese 729", 
			orbitalPeriod: 520,
			inclination: 2.0, 
			argumentOfPeriapsis: 96.0, 
			longitudeOfAscendingNode: 180.0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 3.0, 
			rotationPeriod: 0.93,
			kind: "planet",
			radius: 2.4
		},
		
		// Gl 729 c: Un mundo desértico con atmósfera tenue
		"Gliese 729 c": {
			periapsis: 320000000, 
			apoapsis: 370000000,
			size: 4000, 
			color: 0x696969, // Gris oscuro/ceniza
			orbits: "Gliese 729", 
			orbitalPeriod: 910,
			inclination: 1.5, 
			argumentOfPeriapsis: 210.0, 
			longitudeOfAscendingNode: 60.0,
			lastPerihelion: "2024-04-15",
			rotationAxis: { x: 0, y: 1, z: 0 }, 
			axialTilt: 15.0, 
			rotationPeriod: 1.25,
			kind: "planet",
			radius: 2.8
		},
		
      },
    
      // ============================================================
      // SATELLITES: lunas (y lunas de lunas si quieres)
      // satelliteId KEY. "orbits" apunta a planetId (o moonId)
      // ============================================================
      satellites: {
        // --- Sol ---
        "Luna": {
          periapsis: 363300, apoapsis: 405500,
          size: 1737.1, color: 0xcccccc,
          orbits: "Tierra", orbitalPeriod: 27.321,
          inclination: 5.14, argumentOfPeriapsis: 41.5, longitudeOfAscendingNode: 125.08,
          lastPerihelion: "2024-12-03",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 1.54, rotationPeriod: 27.321,
          jsonFile: "luna.json",
        },
    
        "Io": {
          periapsis: 421700, apoapsis: 422000,
          size: 1821.5, color: 0xffa500,
          orbits: "Jupiter", orbitalPeriod: 1.769,
          inclination: 0.05, argumentOfPeriapsis: 84.03, longitudeOfAscendingNode: 43.97,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.04, rotationPeriod: 1.769,
		  jsonFile: "io.json",
        },
    
        "Europa": {
          periapsis: 670900, apoapsis: 676900,
          size: 1561, color: 0xffffff,
          orbits: "Jupiter", orbitalPeriod: 3.551,
          inclination: 0.47, argumentOfPeriapsis: 88.97, longitudeOfAscendingNode: 219.11,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.10, rotationPeriod: 3.551,
		  jsonFile: "europa.json",
        },
    
        "Ganymede": {
          periapsis: 1070400, apoapsis: 1071600,
          size: 2634, color: 0xffff00,
          orbits: "Jupiter", orbitalPeriod: 7.155,
          inclination: 0.2, argumentOfPeriapsis: 192.42, longitudeOfAscendingNode: 63.55,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.03, rotationPeriod: 7.155,
		  jsonFile: "ganymede.json",
        },
    
        "Callisto": {
          periapsis: 1882700, apoapsis: 1883300,
          size: 2410.5, color: 0x808080,
          orbits: "Jupiter", orbitalPeriod: 16.689,
          inclination: 0.19, argumentOfPeriapsis: 52.64, longitudeOfAscendingNode: 298.84,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.4, rotationPeriod: 16.689,
		  jsonFile: "callisto.json",
        },
		
		"Amalthea": {
          periapsis: 181150, apoapsis: 182840,
          size: 125, color: 0xff4500, // Es muy roja
          orbits: "Jupiter", orbitalPeriod: 0.498,
          inclination: 0.37, argumentOfPeriapsis: 156, longitudeOfAscendingNode: 108,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.498,
        },

        "Himalia": {
          periapsis: 11341330, apoapsis: 11628670,
          size: 102.4, color: 0x8b8682,
          orbits: "Jupiter", orbitalPeriod: 250.56,
          inclination: 27.5, argumentOfPeriapsis: 326, longitudeOfAscendingNode: 45.1,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.32, // No es síncrona
        },

        "Thebe": {
          periapsis: 218000, apoapsis: 226000,
          size: 116, color: 0xbc8f8f,
          orbits: "Jupiter", orbitalPeriod: 0.675,
          inclination: 1.07, argumentOfPeriapsis: 135, longitudeOfAscendingNode: 235,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.675,
        },
    
        "Titan": {
          periapsis: 1186600, apoapsis: 1221860,
          size: 2575, color: 0xffcc99,
          orbits: "Saturno", orbitalPeriod: 15.945,
          inclination: 0.3, argumentOfPeriapsis: 174.17, longitudeOfAscendingNode: 109.49,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.3, rotationPeriod: 15.945,
		  jsonFile: "titan.json",
        },
    
        "Enceladus": {
          periapsis: 237950, apoapsis: 238040,
          size: 252.1, color: 0xb0e0e6,
          orbits: "Saturno", orbitalPeriod: 1.37,
          inclination: 0.019, argumentOfPeriapsis: 161.23, longitudeOfAscendingNode: 40.66,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.02, rotationPeriod: 1.37,
		  jsonFile: "enceladus.json",
        },
		
		"Mimas": {
			periapsis: 181902, apoapsis: 189176,
			size: 198.2, color: 0x999999,
			orbits: "Saturno", orbitalPeriod: 0.942,
			inclination: 1.57, argumentOfPeriapsis: 31.6, longitudeOfAscendingNode: 153.1,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.942,
		},
		
		"Tethys": {
			periapsis: 294619, apoapsis: 294619,
			size: 531.1, color: 0xdcdcdc,
			orbits: "Saturno", orbitalPeriod: 1.887,
			inclination: 1.12, argumentOfPeriapsis: 159.2, longitudeOfAscendingNode: 329.8,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.887,
		},
		
		"Dione": {
			periapsis: 376595, apoapsis: 378213,
			size: 561.4, color: 0xc0c0c0,
			orbits: "Saturno", orbitalPeriod: 2.737,
			inclination: 0.02, argumentOfPeriapsis: 164.5, longitudeOfAscendingNode: 73.0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2.737,
		},
		
		"Rhea": {
			periapsis: 526364, apoapsis: 527848,
			size: 763.8, color: 0xeeeeee,
			orbits: "Saturno", orbitalPeriod: 4.518,
			inclination: 0.33, argumentOfPeriapsis: 310.8, longitudeOfAscendingNode: 13.5,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 4.518,
		},
		
		"Iapetus": {
			periapsis: 3438060, apoapsis: 3684110,
			size: 734.5, color: 0x444444, // Muy oscuro en un hemisferio
			orbits: "Saturno", orbitalPeriod: 79.321,
			inclination: 15.47, argumentOfPeriapsis: 275.8, longitudeOfAscendingNode: 75.0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 79.321,
		},
		
		"Phoebe": {
			periapsis: 11504100, apoapsis: 14391600,
			size: 106.5, color: 0x333333,
			orbits: "Saturno", orbitalPeriod: -550.5, // Órbita retrógrada
			inclination: 175.3, argumentOfPeriapsis: 315.5, longitudeOfAscendingNode: 232.5,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 152.0, rotationPeriod: 0.38, // No es síncrona
		},
		
		"Hyperion": {
		  periapsis: 1465424, apoapsis: 1535756,
		  size: 135, color: 0xcdb69b, // Tono café claro/esponja
		  orbits: "Saturno", orbitalPeriod: 21.276,
		  inclination: 0.56, argumentOfPeriapsis: 338, longitudeOfAscendingNode: 150,
		  lastPerihelion: "2024-01-01",
		  rotationAxis: { x: 1, y: 1, z: 1 }, axialTilt: 0, rotationPeriod: 0.5, // ¡Rotación caótica!
		},
							
		"Miranda": { 
		  periapsis: 129390, apoapsis: 129850, 
		  size: 235.8, color: 0xadd8e6, 
		  orbits: "Urano", orbitalPeriod: 1.41, 
		  inclination: 4.338, argumentOfPeriapsis: 145.2, longitudeOfAscendingNode: 80.3, 
		  lastPerihelion: "2024-01-01",
		  rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 4.22, rotationPeriod: 1.41
		},
		
		"Ariel": {
			periapsis: 190500, apoapsis: 191300,
			size: 578.9, color: 0xcccccc,
			orbits: "Urano", orbitalPeriod: 2.52,
			inclination: 0.26, argumentOfPeriapsis: 115.3, longitudeOfAscendingNode: 22.1,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 2.52
		},
		
		"Umbriel": {
			periapsis: 265000, apoapsis: 267000,
			size: 584.7, color: 0x666666,
			orbits: "Urano", orbitalPeriod: 4.144,
			inclination: 0.20, argumentOfPeriapsis: 85.0, longitudeOfAscendingNode: 33.5,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 4.144
		},
		
		"Titania": {
			periapsis: 435000, apoapsis: 437000,
			size: 788.4, color: 0xdddddd,
			orbits: "Urano", orbitalPeriod: 8.706,
			inclination: 0.34, argumentOfPeriapsis: 155.1, longitudeOfAscendingNode: 99.1,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 8.706
		},
		
		"Oberon": {
			periapsis: 582000, apoapsis: 585000,
			size: 761.4, color: 0xbbbbbb,
			orbits: "Urano", orbitalPeriod: 13.463,
			inclination: 0.05, argumentOfPeriapsis: 101.4, longitudeOfAscendingNode: 279.1,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 13.463
		},
		
		"Triton": {
			periapsis: 354750, apoapsis: 354760,
			size: 1353.4, color: 0xffefd5,
			orbits: "Neptuno", orbitalPeriod: -5.877, // Retrógrada
			inclination: 156.8, argumentOfPeriapsis: 155.0, longitudeOfAscendingNode: 170.1,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: -5.877
		},
		
		"Proteus": {
			periapsis: 117647, apoapsis: 117647,
			size: 210, color: 0x555555,
			orbits: "Neptuno", orbitalPeriod: 1.122,
			inclination: 0.52, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 1.122
		},
		
		"Nereid": {
		  periapsis: 1372000, apoapsis: 9655000, // Órbita extremadamente elíptica
		  size: 170, color: 0x8b8989,
		  orbits: "Neptuno", orbitalPeriod: 360.13,
		  inclination: 7.23, argumentOfPeriapsis: 282, longitudeOfAscendingNode: 323,
		  lastPerihelion: "2024-01-01",
		  rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 0.48, // No síncrona
		},
		
		"Charon": {
			periapsis: 19591, apoapsis: 19599,
			size: 606, color: 0x999999,
			orbits: "Pluton", orbitalPeriod: 6.387,
			inclination: 0.0, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 0,
			lastPerihelion: "2024-01-01",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 6.387,
		},
		
		"Hi'iaka": {
		  periapsis: 45310, apoapsis: 54110,
		  size: 155, color: 0xffffff,
		  orbits: "Haumea", orbitalPeriod: 49.12,
		  inclination: 232.1, argumentOfPeriapsis: 154, longitudeOfAscendingNode: 206,
		  lastPerihelion: "2024-01-01",
		  rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0, rotationPeriod: 49.12 // Síncrona
		},
    
        // --- Dune: Arrakis ---
    	"Arvon": {
    	  periapsis: 103093, apoapsis: 130040,
          size: 201, color: 0x808080,
          orbits: "Arrakis", orbitalPeriod: 5.7,
          inclination: 0.19, argumentOfPeriapsis: 52.64, longitudeOfAscendingNode: 298.84,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.4, rotationPeriod: 16.689,
          jsonFile: "arvon.json",
        },
    	
        "Krelln": {
    	  periapsis: 324077, apoapsis: 340040,
          size: 488, color: 0xffff00,
          orbits: "Arrakis", orbitalPeriod: 25.5,
          inclination: 0.2, argumentOfPeriapsis: 192.42, longitudeOfAscendingNode: 63.55,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.03, rotationPeriod: 7.155,
          jsonFile: "krelln.json",
        },
    
        // --- Dune: Extaris moons ---
        "Dreko": {
    	  periapsis: 237950, apoapsis: 238040,
          size: 252.1, color: 0xb0e0e6,
          orbits: "Extaris", orbitalPeriod: 1.37,
          inclination: 0.019, argumentOfPeriapsis: 161.23, longitudeOfAscendingNode: 40.66,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.02, rotationPeriod: 1.37,
        },
    
        "Namar": {
    	  periapsis: 237950, apoapsis: 238040,
          size: 235.8, color: 0xadd8e6,
          orbits: "Extaris", orbitalPeriod: 1.41,
          inclination: 4.338, argumentOfPeriapsis: 145.2, longitudeOfAscendingNode: 80.3,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 4.22, rotationPeriod: 1.41,
        },
    
        "Sesh": {
    	  periapsis: 237950, apoapsis: 238040,
          size: 235.8, color: 0xadd8e6,
          orbits: "Extaris", orbitalPeriod: 1.41,
          inclination: 4.338, argumentOfPeriapsis: 145.2, longitudeOfAscendingNode: 80.3,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 4.22, rotationPeriod: 1.41,
        },
    
        "Vala": {
    	  periapsis: 237950, apoapsis: 238040,
          size: 235.8, color: 0xadd8e6,
          orbits: "Extaris", orbitalPeriod: 1.41,
          inclination: 4.338, argumentOfPeriapsis: 145.2, longitudeOfAscendingNode: 80.3,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 4.22, rotationPeriod: 1.41,
        },
    	
    	"Aja": {
    	  periapsis: 398003, apoapsis: 399000,
          size: 257, color: 0xffcc99,
          orbits: "Extaris", orbitalPeriod: 15.945,
          inclination: 0.3, argumentOfPeriapsis: 174.17, longitudeOfAscendingNode: 109.49,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 0.3, rotationPeriod: 15.945,
        },
    
        // --- Dune: Revona moon ---
        "Laran": {
    	  periapsis: 237950, apoapsis: 238040,
          size: 235.8, color: 0xadd8e6,
          orbits: "Revona", orbitalPeriod: 1.41,
          inclination: 4.338, argumentOfPeriapsis: 145.2, longitudeOfAscendingNode: 80.3,
          lastPerihelion: "2024-01-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 4.22, rotationPeriod: 1.41,
        },
      },
    
      // ============================================================
      // ARTIFICIAL SATELLITES
      // ============================================================
      artificialSatellites: {
        "ISS": {
          periapsis: 6779, apoapsis: 6781,
          size: 5.45, color: "green",
          orbits: "Tierra", orbitalPeriod: 1.5,
          inclination: 51.64, argumentOfPeriapsis: 0, longitudeOfAscendingNode: 258.76,
          lastPerihelion: "2023-12-01",
          rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 23.0, rotationPeriod: 365.37,
        },
      },
    
      // ============================================================
      // COMETS
      // ============================================================
      comets: {
        "Halley": {
          periapsis: 87870000, apoapsis: 5247100000,
          size: 11, color: 0xffffff,
          orbits: "Sol", orbitalPeriod: 27740,
          inclination: 162.26, argumentOfPeriapsis: 111.33, longitudeOfAscendingNode: 58.42,
          lastPerihelion: "1986-02-09",
          orientation: 58.42,
		  jsonFile: "halley.json",
        },
    
        "Encke": {
          periapsis: 50917500, apoapsis: 611150000,
          size: 4.8, color: 0x87ceeb,
          orbits: "Sol", orbitalPeriod: 1205.325,
          inclination: 11.78, argumentOfPeriapsis: 186.45, longitudeOfAscendingNode: 334.57,
          lastPerihelion: "2023-11-22",
          orientation: 334.57,
        },
    
        "Hale-Bopp": {
          periapsis: 136680000, apoapsis: 55350000000,
          size: 60, color: 0xadd8e6,
          orbits: "Sol", orbitalPeriod: 919200,
          inclination: 89.4, argumentOfPeriapsis: 130.59, longitudeOfAscendingNode: 282.47,
          lastPerihelion: "1997-04-01",
          orientation: 282.47,
		  jsonFile: "hale-bopp.json",
        },
      },
	  
	  // ============================================================
      // ASTEROIDS
      // ============================================================
	  
	  asteroids: {
		"Vesta": {
			periapsis: 321635422, apoapsis: 384466528,
			size: 263, color: 0xb0b0b0,
			orbits: "Sol", orbitalPeriod: 1326,
			inclination: 7.1422, argumentOfPeriapsis: 151.66, longitudeOfAscendingNode: 103.71,
			lastPerihelion: "2025-08-14",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 29, rotationPeriod: 0.2226,
			jsonFile: "vesta.json",
		},

		"Pallas": {
			periapsis: 318643465, apoapsis: 510128739,
			size: 256, color: 0xa9a9a9,
			orbits: "Sol", orbitalPeriod: 1687,
			inclination: 34.84, argumentOfPeriapsis: 310.93, longitudeOfAscendingNode: 172.89,
			lastPerihelion: "2023-03-07",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: 84, rotationPeriod: 0.3256
		},

		"Hygiea": {
			periapsis: 418724440, apoapsis: 521797373,
			size: 217, color: 0x6b6b6b,
			orbits: "Sol", orbitalPeriod: 2034,
			inclination: 3.832, argumentOfPeriapsis: 312.71, longitudeOfAscendingNode: 283.13,
			lastPerihelion: "2022-07-12",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: null, rotationPeriod: 0.5761
		},

		"Interamnia": {
			periapsis: 386261702, apoapsis: 528230081,
			size: 160, color: 0x8b8b8b,
			orbits: "Sol", orbitalPeriod: 1951,
			inclination: 17.32, argumentOfPeriapsis: 94.11, longitudeOfAscendingNode: 280.17,
			lastPerihelion: "2023-02-26",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: null, rotationPeriod: 0.3629
		},

		"Davida": {
			periapsis: 383568940, apoapsis: 563086385,
			size: 149, color: 0x7a7a7a,
			orbits: "Sol", orbitalPeriod: 2055,
			inclination: 15.95, argumentOfPeriapsis: 336.67, longitudeOfAscendingNode: 107.56,
			lastPerihelion: "2025-05-03",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: null, rotationPeriod: 0.2137
		},

		"Europa": {
			periapsis: 410795753, apoapsis: 514467077,
			size: 158, color: 0x9a9a9a,
			orbits: "Sol", orbitalPeriod: 1995,
			inclination: 7.48, argumentOfPeriapsis: 342.96, longitudeOfAscendingNode: 128.58,
			lastPerihelion: "2021-03-02",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: null, rotationPeriod: 0.2346
		},

		"Sylvia": {
			periapsis: 471233293, apoapsis: 569967887,
			size: 137, color: 0x5e5e5e,
			orbits: "Sol", orbitalPeriod: 2372,
			inclination: 10.9, argumentOfPeriapsis: 263, longitudeOfAscendingNode: 73,
			lastPerihelion: "2024-03-04",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: null, rotationPeriod: 0.2160
		},

		"Eunomia": {
			periapsis: 321037031, apoapsis: 469438118,
			size: 134, color: 0xb8a47a,
			orbits: "Sol", orbitalPeriod: 1571,
			inclination: 11.75, argumentOfPeriapsis: 99, longitudeOfAscendingNode: 293,
			lastPerihelion: "2024-07-13",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: null, rotationPeriod: 0.2535
		},

		"Euphrosyne": {
			periapsis: 367786365, apoapsis: 576295877,
			size: 134, color: 0x4f4f4f,
			orbits: "Sol", orbitalPeriod: 2042,
			inclination: 26.3033, argumentOfPeriapsis: 61.4704, longitudeOfAscendingNode: 31.1186,
			lastPerihelion: "2023-07-31",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: null, rotationPeriod: 0.2304
		},

		"Cybele": {
			periapsis: 455734953, apoapsis: 569997807,
			size: 132, color: 0x3f3f3f,
			orbits: "Sol", orbitalPeriod: 2319,
			inclination: 3.5627, argumentOfPeriapsis: 102.37, longitudeOfAscendingNode: 155.63,
			lastPerihelion: "2024-12-24",
			rotationAxis: { x: 0, y: 1, z: 0 }, axialTilt: null, rotationPeriod: 0.2534
		},

      },
    };
