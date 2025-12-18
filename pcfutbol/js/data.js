// js/data.js
// Datos de ligas y clubs. Los jugadores se generan automáticamente al cargar,
// salvo que exista una plantilla "real" definida en alguno de los archivos
// de plantillas (squads_es.js, squads_en.js, etc.).

import { realSquads as realSquadsEs } from './squads_es.js';
import { realSquads as realSquadsEn } from './squads_en.js';

// Mapa global con TODAS las plantillas reales conocidas (España, Premier, etc.)
// La clave es el id del club (real_madrid, barcelona, arsenal, astonvilla, ...).
const realSquads = {
  ...(realSquadsEs || {}),
  ...(realSquadsEn || {})
};

// Distribución simple de 18 jugadores por club
const SQUAD_POSITIONS = [
  "GK","GK",          // 2 porteros
  "RB","LB","CB","CB", // 4 defensas
  "RWB","LWB",          // 2 carrileros/extremos
  "CDM","CM","CAM","RM","LM",// 5 centrocampistas
  "RW","LW",            // 2 extremos ofensivos
  "CF","ST","ST"   // 3 atacantes
];

// Genera una plantilla de 18 jugadores ficticios para un club
function generateSquadForClub(clubBase) {
  const players = [];
  for (let i = 0; i < SQUAD_POSITIONS.length; i++) {
    const pos = SQUAD_POSITIONS[i];
    const idx = i + 1;
    const id = `${clubBase.id}_p${String(idx).padStart(2, "0")}`;
    const name = `Jugador ${clubBase.shortName} ${String(idx).padStart(2, "0")}`;

    const age = 19 + (i * 3 + clubBase.baseOverall) % 16; // 19–34
    let overall = clubBase.baseOverall + (((i * 7) % 9) - 4); // base ±4
    if (overall < 55) overall = 55;
    if (overall > 85) overall = 85;

    const wage = overall * overall * 180;  // sueldo aproximado
    const value = overall * overall * 950; // valor de mercado aproximado
    const contractYears = 1 + ((i + clubBase.baseOverall) % 5); // 1–5 años

    players.push({
      id,
      name,
      position: pos,
      age,
      overall,
      wage,
      contractYears,
      value
    });
  }
  return players;
}

function createLeagueFromBase(baseClubs, id, name, country) {
  const clubs = baseClubs.map((c) => {
    // Si tenemos plantilla real definida para este club, la usamos
    let players = null;
    if (realSquads && Object.prototype.hasOwnProperty.call(realSquads, c.id)) {
      const real = realSquads[c.id];
      if (Array.isArray(real) && real.length > 0) {
        // clon superficial para no mutar la constante original
        players = real.map((p) => ({ ...p }));
      }
    }

    // Si no hay plantilla real, generamos una ficticia estándar
    if (!players) {
      players = generateSquadForClub(c);
    }

    return {
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      stadium: {
        name: c.stadiumName,
        capacity: c.capacity
      },
      cash: c.cash,
      wageBudget: c.wageBudget,
      players
    };
  });

  return {
    id,
    name,
    country,
    cardStrictness: 1.0,
    clubs
  };
}

// =======================
// LIGA ESPAÑOLA (LaLiga)
// =======================
const ES_PRIMERA_CLUBS = [
  {
    id: "alaves",
    name: "Deportivo Alavés",
    shortName: "ALA",
    stadiumName: "Mendizorrotza",
    capacity: 19840,
    cash: 22000000,
    wageBudget: 9000000,
    baseOverall: 69
  },
  {
    id: "athletic",
    name: "Athletic Club",
    shortName: "ATH",
    stadiumName: "San Mamés",
    capacity: 53289,
    cash: 32000000,
    wageBudget: 14000000,
    baseOverall: 74
  },
  {
    id: "atletico",
    name: "Atlético de Madrid",
    shortName: "ATM",
    stadiumName: "Metropolitano",
    capacity: 70692,
    cash: 50000000,
    wageBudget: 25000000,
    baseOverall: 82
  },
  {
    id: "barcelona",
    name: "FC Barcelona",
    shortName: "FCB",
    stadiumName: "Camp Nou",
    capacity: 105000,
    cash: 52000000,
    wageBudget: 26000000,
    baseOverall: 83
  },
  {
    id: "celta",
    name: "RC Celta",
    shortName: "CEL",
    stadiumName: "Balaídos",
    capacity: 24870,
    cash: 24000000,
    wageBudget: 10000000,
    baseOverall: 71
  },
 	{
	id: "elche",
	name: "Elche CF",
	shortName: "ELC",
	stadiumName: "Estadio Martínez Valero",
	capacity: 33732,
	cash: 18000000,
	wageBudget: 7500000,
	baseOverall: 66
	},
  {
    id: "espanyol",
    name: "RCD Espanyol",
    shortName: "ESP",
    stadiumName: "RCDE Stadium",
    capacity: 37776,
    cash: 23000000,
    wageBudget: 9500000,
    baseOverall: 70
  },
  {
    id: "getafe",
    name: "Getafe CF",
    shortName: "GET",
    stadiumName: "Coliseum",
    capacity: 16500,
    cash: 21000000,
    wageBudget: 9000000,
    baseOverall: 70
  },
  {
    id: "girona",
    name: "Girona FC",
    shortName: "GIR",
    stadiumName: "Montilivi",
    capacity: 14624,
    cash: 24000000,
    wageBudget: 10000000,
    baseOverall: 73
  },
  {
    id: "levante",
    name: "Levante UD",
    shortName: "LEV",
    stadiumName: "Ciutat de València",
    capacity: 26354,
    cash: 20000000,
    wageBudget: 8500000,
    baseOverall: 68
  },
  {
    id: "mallorca",
    name: "RCD Mallorca",
    shortName: "MAL",
    stadiumName: "Son Moix",
    capacity: 23142,
    cash: 22000000,
    wageBudget: 9000000,
    baseOverall: 71
  },

  {
    id: "osasuna",
    name: "CA Osasuna",
    shortName: "OSA",
    stadiumName: "El Sadar",
    capacity: 23576,
    cash: 23000000,
    wageBudget: 9500000,
    baseOverall: 72
  },
  {
    id: "rayo",
    name: "Rayo Vallecano",
    shortName: "RAY",
    stadiumName: "Vallecas",
    capacity: 14708,
    cash: 20000000,
    wageBudget: 8500000,
    baseOverall: 69
  },
  {
    id: "betis",
    name: "Real Betis",
    shortName: "BET",
    stadiumName: "Benito Villamarín",
    capacity: 60721,
    cash: 32000000,
    wageBudget: 14000000,
    baseOverall: 74
  },
  {
    id: "realmadrid",
    name: "Real Madrid CF",
    shortName: "RMA",
    stadiumName: "Santiago Bernabéu",
    capacity: 83186,
    cash: 55000000,
    wageBudget: 28000000,
    baseOverall: 84
  },
  {
    id: "realoviedo",
    name: "Real Oviedo",
    shortName: "OVI",
    stadiumName: "Carlos Tartiere",
    capacity: 30500,
    cash: 19000000,
    wageBudget: 8000000,
    baseOverall: 67
  },
  {
    id: "realsociedad",
    name: "Real Sociedad",
    shortName: "RSO",
    stadiumName: "Reale Arena",
    capacity: 39313,
    cash: 32000000,
    wageBudget: 14000000,
    baseOverall: 75
  },
  {
    id: "sevilla",
    name: "Sevilla FC",
    shortName: "SEV",
    stadiumName: "Ramón Sánchez-Pizjuán",
    capacity: 43883,
    cash: 31000000,
    wageBudget: 13500000,
    baseOverall: 74
  },
  {
    id: "valencia",
    name: "Valencia CF",
    shortName: "VAL",
    stadiumName: "Mestalla",
    capacity: 49430,
    cash: 28000000,
    wageBudget: 12000000,
    baseOverall: 72
  },
  {
    id: "villarreal",
    name: "Villarreal CF",
    shortName: "VIL",
    stadiumName: "La Cerámica",
    capacity: 23008,
    cash: 30000000,
    wageBudget: 13000000,
    baseOverall: 75
  }
];

const leagueES = createLeagueFromBase(
  ES_PRIMERA_CLUBS,
  "league_es_primera",
  "La Liga EA Sports",
  "España"
);

// =======================
// PREMIER LEAGUE (Inglaterra)
// =======================
const EN_PREMIER_CLUBS = [
  {
    id: "arsenal",
    name: "Arsenal",
    shortName: "ARS",
    stadiumName: "Emirates Stadium",
    capacity: 60704,
    cash: 52000000,
    wageBudget: 26000000,
    baseOverall: 82
  },
  {
    id: "astonvilla",
    name: "Aston Villa",
    shortName: "AVL",
    stadiumName: "Villa Park",
    capacity: 42657,
    cash: 36000000,
    wageBudget: 17000000,
    baseOverall: 78
  },
  {
    id: "mancity",
    name: "Manchester City",
    shortName: "MCI",
    stadiumName: "Etihad Stadium",
    capacity: 53400,
    cash: 60000000,
    wageBudget: 30000000,
    baseOverall: 84
  },
  {
    id: "liverpool",
    name: "Liverpool",
    shortName: "LIV",
    stadiumName: "Anfield",
    capacity: 54074,
    cash: 55000000,
    wageBudget: 28000000,
    baseOverall: 83
  },
  {
    id: "manutd",
    name: "Manchester United",
    shortName: "MUN",
    stadiumName: "Old Trafford",
    capacity: 74879,
    cash: 58000000,
    wageBudget: 29000000,
    baseOverall: 82
  },
  {
    id: "chelsea",
    name: "Chelsea",
    shortName: "CHE",
    stadiumName: "Stamford Bridge",
    capacity: 40341,
    cash: 50000000,
    wageBudget: 26000000,
    baseOverall: 81
  },
  {
    id: "tottenham",
    name: "Tottenham Hotspur",
    shortName: "TOT",
    stadiumName: "Tottenham Hotspur Stadium",
    capacity: 62850,
    cash: 48000000,
    wageBudget: 23000000,
    baseOverall: 80
  },
  {
    id: "newcastle",
    name: "Newcastle United",
    shortName: "NEW",
    stadiumName: "St James' Park",
    capacity: 52305,
    cash: 47000000,
    wageBudget: 22000000,
    baseOverall: 79
  },
  {
    id: "brighton",
    name: "Brighton & Hove Albion",
    shortName: "BHA",
    stadiumName: "Amex Stadium",
    capacity: 31800,
    cash: 32000000,
    wageBudget: 15000000,
    baseOverall: 77
  },
  {
    id: "westham",
    name: "West Ham United",
    shortName: "WHU",
    stadiumName: "London Stadium",
    capacity: 60000,
    cash: 34000000,
    wageBudget: 16000000,
    baseOverall: 77
  }
];

const leagueEN = createLeagueFromBase(
  EN_PREMIER_CLUBS,
  "league_en_premier",
  "Premier League",
  "Inglaterra"
);

// =======================
// SERIE A (Italia)
// =======================
const IT_SERIEA_CLUBS = [
  {
    id: "acmilan",
    name: "AC Milan",
    shortName: "MIL",
    stadiumName: "San Siro",
    capacity: 80018,
    cash: 48000000,
    wageBudget: 23000000,
    baseOverall: 81
  },
  {
    id: "inter",
    name: "Inter de Milán",
    shortName: "INT",
    stadiumName: "San Siro",
    capacity: 80018,
    cash: 49000000,
    wageBudget: 24000000,
    baseOverall: 82
  },
  {
    id: "juventus",
    name: "Juventus",
    shortName: "JUV",
    stadiumName: "Allianz Stadium",
    capacity: 41507,
    cash: 50000000,
    wageBudget: 25000000,
    baseOverall: 82
  },
  {
    id: "napoli",
    name: "Napoli",
    shortName: "NAP",
    stadiumName: "Diego Armando Maradona",
    capacity: 54726,
    cash: 42000000,
    wageBudget: 20000000,
    baseOverall: 81
  },
  {
    id: "roma",
    name: "AS Roma",
    shortName: "ROM",
    stadiumName: "Stadio Olimpico",
    capacity: 72698,
    cash: 38000000,
    wageBudget: 19000000,
    baseOverall: 79
  },
  {
    id: "lazio",
    name: "Lazio",
    shortName: "LAZ",
    stadiumName: "Stadio Olimpico",
    capacity: 72698,
    cash: 36000000,
    wageBudget: 18000000,
    baseOverall: 79
  },
  {
    id: "atalanta",
    name: "Atalanta",
    shortName: "ATA",
    stadiumName: "Gewiss Stadium",
    capacity: 21300,
    cash: 33000000,
    wageBudget: 16000000,
    baseOverall: 78
  },
  {
    id: "fiorentina",
    name: "Fiorentina",
    shortName: "FIO",
    stadiumName: "Artemio Franchi",
    capacity: 43147,
    cash: 30000000,
    wageBudget: 15000000,
    baseOverall: 77
  },
  {
    id: "bologna",
    name: "Bologna",
    shortName: "BOL",
    stadiumName: "Renato Dall'Ara",
    capacity: 38279,
    cash: 28000000,
    wageBudget: 13000000,
    baseOverall: 76
  },
  {
    id: "torino",
    name: "Torino",
    shortName: "TOR",
    stadiumName: "Olimpico Grande Torino",
    capacity: 27994,
    cash: 27000000,
    wageBudget: 12000000,
    baseOverall: 75
  }
];

const leagueIT = createLeagueFromBase(
  IT_SERIEA_CLUBS,
  "league_it_seriea",
  "Serie A",
  "Italia"
);

// =======================
// BUNDESLIGA (Alemania)
// =======================
const DE_BUNDES_CLUBS = [
  {
    id: "bayern",
    name: "Bayern de Múnich",
    shortName: "FCB",
    stadiumName: "Allianz Arena",
    capacity: 75000,
    cash: 55000000,
    wageBudget: 28000000,
    baseOverall: 84
  },
  {
    id: "dortmund",
    name: "Borussia Dortmund",
    shortName: "BVB",
    stadiumName: "Signal Iduna Park",
    capacity: 81365,
    cash: 48000000,
    wageBudget: 23000000,
    baseOverall: 82
  },
  {
    id: "leipzig",
    name: "RB Leipzig",
    shortName: "RBL",
    stadiumName: "Red Bull Arena",
    capacity: 47100,
    cash: 42000000,
    wageBudget: 20000000,
    baseOverall: 80
  },
  {
    id: "leverkusen",
    name: "Bayer Leverkusen",
    shortName: "B04",
    stadiumName: "BayArena",
    capacity: 30210,
    cash: 40000000,
    wageBudget: 19000000,
    baseOverall: 81
  },
  {
    id: "unionberlin",
    name: "Union Berlin",
    shortName: "FCU",
    stadiumName: "An der Alten Försterei",
    capacity: 22012,
    cash: 30000000,
    wageBudget: 14000000,
    baseOverall: 78
  },
  {
    id: "frankfurt",
    name: "Eintracht Frankfurt",
    shortName: "SGE",
    stadiumName: "Deutsche Bank Park",
    capacity: 51500,
    cash: 32000000,
    wageBudget: 15000000,
    baseOverall: 78
  },
  {
    id: "freiburg",
    name: "SC Freiburg",
    shortName: "SCF",
    stadiumName: "Europa-Park Stadion",
    capacity: 34700,
    cash: 29000000,
    wageBudget: 14000000,
    baseOverall: 77
  },
  {
    id: "monchengladbach",
    name: "Borussia Mönchengladbach",
    shortName: "BMG",
    stadiumName: "Borussia-Park",
    capacity: 54057,
    cash: 30000000,
    wageBudget: 14000000,
    baseOverall: 77
  },
  {
    id: "wolfsburg",
    name: "VfL Wolfsburg",
    shortName: "WOB",
    stadiumName: "Volkswagen Arena",
    capacity: 30000,
    cash: 29000000,
    wageBudget: 13500000,
    baseOverall: 76
  },
  {
    id: "stuttgart",
    name: "VfB Stuttgart",
    shortName: "VFB",
    stadiumName: "Mercedes-Benz Arena",
    capacity: 60449,
    cash: 28000000,
    wageBudget: 13000000,
    baseOverall: 76
  }
];

const leagueDE = createLeagueFromBase(
  DE_BUNDES_CLUBS,
  "league_de_bundesliga",
  "Bundesliga",
  "Alemania"
);

// =======================
// LIGUE 1 (Francia)
// =======================
const FR_LIGUE1_CLUBS = [
  {
    id: "psg",
    name: "Paris Saint-Germain",
    shortName: "PSG",
    stadiumName: "Parc des Princes",
    capacity: 47929,
    cash: 60000000,
    wageBudget: 32000000,
    baseOverall: 84
  },
  {
    id: "marseille",
    name: "Olympique de Marseille",
    shortName: "OM",
    stadiumName: "Stade Vélodrome",
    capacity: 67394,
    cash: 42000000,
    wageBudget: 20000000,
    baseOverall: 80
  },
  {
    id: "lyon",
    name: "Olympique Lyonnais",
    shortName: "OL",
    stadiumName: "Groupama Stadium",
    capacity: 59186,
    cash: 38000000,
    wageBudget: 18000000,
    baseOverall: 78
  },
  {
    id: "monaco",
    name: "AS Monaco",
    shortName: "ASM",
    stadiumName: "Stade Louis II",
    capacity: 18523,
    cash: 36000000,
    wageBudget: 17000000,
    baseOverall: 79
  },
  {
    id: "lille",
    name: "Lille OSC",
    shortName: "LIL",
    stadiumName: "Stade Pierre-Mauroy",
    capacity: 50083,
    cash: 34000000,
    wageBudget: 16000000,
    baseOverall: 78
  },
  {
    id: "rennes",
    name: "Stade Rennais",
    shortName: "REN",
    stadiumName: "Roazhon Park",
    capacity: 29778,
    cash: 32000000,
    wageBudget: 15000000,
    baseOverall: 77
  },
  {
    id: "nice",
    name: "OGC Nice",
    shortName: "NCE",
    stadiumName: "Allianz Riviera",
    capacity: 35624,
    cash: 30000000,
    wageBudget: 14000000,
    baseOverall: 77
  },
  {
    id: "lens",
    name: "RC Lens",
    shortName: "RCL",
    stadiumName: "Stade Bollaert-Delelis",
    capacity: 38223,
    cash: 30000000,
    wageBudget: 14000000,
    baseOverall: 77
  },
  {
    id: "nantes",
    name: "FC Nantes",
    shortName: "NAN",
    stadiumName: "Stade de la Beaujoire",
    capacity: 37473,
    cash: 26000000,
    wageBudget: 12000000,
    baseOverall: 75
  },
  {
    id: "toulouse",
    name: "Toulouse FC",
    shortName: "TOU",
    stadiumName: "Stadium de Toulouse",
    capacity: 33150,
    cash: 24000000,
    wageBudget: 11000000,
    baseOverall: 74
  }
];

const leagueFR = createLeagueFromBase(
  FR_LIGUE1_CLUBS,
  "league_fr_ligue1",
  "Ligue 1",
  "Francia"
);

// =======================
// PRIMEIRA LIGA (Portugal)
// =======================
const PT_PRIMEIRA_CLUBS = [
  {
    id: "benfica",
    name: "SL Benfica",
    shortName: "BEN",
    stadiumName: "Estádio da Luz",
    capacity: 64742,
    cash: 42000000,
    wageBudget: 20000000,
    baseOverall: 80
  },
  {
    id: "porto",
    name: "FC Porto",
    shortName: "FCP",
    stadiumName: "Estádio do Dragão",
    capacity: 50033,
    cash: 41000000,
    wageBudget: 19500000,
    baseOverall: 80
  },
  {
    id: "sportingcp",
    name: "Sporting CP",
    shortName: "SCP",
    stadiumName: "Estádio José Alvalade",
    capacity: 50066,
    cash: 39000000,
    wageBudget: 18500000,
    baseOverall: 79
  },
  {
    id: "braga",
    name: "SC Braga",
    shortName: "BRA",
    stadiumName: "Estádio Municipal de Braga",
    capacity: 30286,
    cash: 32000000,
    wageBudget: 15000000,
    baseOverall: 78
  },
  {
    id: "guimaraes",
    name: "Vitória SC",
    shortName: "GUI",
    stadiumName: "Estádio D. Afonso Henriques",
    capacity: 30008,
    cash: 26000000,
    wageBudget: 12000000,
    baseOverall: 76
  },
  {
    id: "boavista",
    name: "Boavista FC",
    shortName: "BOA",
    stadiumName: "Estádio do Bessa",
    capacity: 28263,
    cash: 23000000,
    wageBudget: 11000000,
    baseOverall: 74
  },
  {
    id: "rioave",
    name: "Rio Ave FC",
    shortName: "RA",
    stadiumName: "Estádio dos Arcos",
    capacity: 12815,
    cash: 22000000,
    wageBudget: 10000000,
    baseOverall: 73
  },
  {
    id: "famalicao",
    name: "FC Famalicão",
    shortName: "FAM",
    stadiumName: "Estádio Municipal 22 de Junho",
    capacity: 5280,
    cash: 21000000,
    wageBudget: 9500000,
    baseOverall: 73
  },
  {
    id: "gilvicente",
    name: "Gil Vicente FC",
    shortName: "GV",
    stadiumName: "Estádio Cidade de Barcelos",
    capacity: 12374,
    cash: 20000000,
    wageBudget: 9000000,
    baseOverall: 72
  },
  {
    id: "estoril",
    name: "GD Estoril Praia",
    shortName: "EST",
    stadiumName: "Estádio António Coimbra da Mota",
    capacity: 8000,
    cash: 19000000,
    wageBudget: 8500000,
    baseOverall: 71
  }
];

const leaguePT = createLeagueFromBase(
  PT_PRIMEIRA_CLUBS,
  "league_pt_primeira",
  "Primeira Liga",
  "Portugal"
);

// =======================
// EREDIVISIE (Países Bajos)
// =======================
const NL_EREDIVISIE_CLUBS = [
  {
    id: "ajax",
    name: "AFC Ajax",
    shortName: "AJA",
    stadiumName: "Johan Cruijff ArenA",
    capacity: 55865,      // ~55.865 asientos :contentReference[oaicite:0]{index=0}
    cash: 38000000,
    wageBudget: 18000000,
    baseOverall: 80
  },
  {
    id: "psv",
    name: "PSV Eindhoven",
    shortName: "PSV",
    stadiumName: "Philips Stadion",
    capacity: 35000,      // 35.000 asientos :contentReference[oaicite:1]{index=1}
    cash: 36000000,
    wageBudget: 17000000,
    baseOverall: 79
  },
  {
    id: "feyenoord",
    name: "Feyenoord",
    shortName: "FEY",
    stadiumName: "De Kuip",
    capacity: 47500,      // ~47.500 espectadores :contentReference[oaicite:2]{index=2}
    cash: 34000000,
    wageBudget: 16000000,
    baseOverall: 79
  },
  {
    id: "az",
    name: "AZ Alkmaar",
    shortName: "AZ",
    stadiumName: "AFAS Stadion",
    capacity: 19478,      // ~19.478 asientos :contentReference[oaicite:3]{index=3}
    cash: 30000000,
    wageBudget: 14000000,
    baseOverall: 77
  },
  {
    id: "twente",
    name: "FC Twente",
    shortName: "TWE",
    stadiumName: "De Grolsch Veste",
    capacity: 30205,      // 30.205 asientos :contentReference[oaicite:4]{index=4}
    cash: 26000000,
    wageBudget: 12000000,
    baseOverall: 76
  },
  {
    id: "utrecht",
    name: "FC Utrecht",
    shortName: "UTR",
    stadiumName: "Stadion Galgenwaard",
    capacity: 23750,      // ~23.750 espectadores :contentReference[oaicite:5]{index=5}
    cash: 24000000,
    wageBudget: 11000000,
    baseOverall: 75
  },
{
  id: "nec",
  name: "N.E.C. Nijmegen",
  shortName: "NEC",
  stadiumName: "Goffertstadion",
  capacity: 12500,      // ~12.500 asientos
  cash: 19000000,
  wageBudget: 8500000,
  baseOverall: 71
},
  {
    id: "heerenveen",
    name: "SC Heerenveen",
    shortName: "HEE",
    stadiumName: "Abe Lenstra Stadion",
    capacity: 26100,      // ~26.100 asientos :contentReference[oaicite:7]{index=7}
    cash: 21000000,
    wageBudget: 9500000,
    baseOverall: 73
  },
  {
    id: "groningen",
    name: "FC Groningen",
    shortName: "GRO",
    stadiumName: "Euroborg",
    capacity: 22525,      // ~22.525 asientos :contentReference[oaicite:8]{index=8}
    cash: 20000000,
    wageBudget: 9000000,
    baseOverall: 72
  },
  {
    id: "sparta",
    name: "Sparta Rotterdam",
    shortName: "SPA",
    stadiumName: "Sparta Stadion Het Kasteel",
    capacity: 11026,      // ~11.026 espectadores :contentReference[oaicite:9]{index=9}
    cash: 19000000,
    wageBudget: 8500000,
    baseOverall: 71
  }
];

const leagueNL = createLeagueFromBase(
  NL_EREDIVISIE_CLUBS,
  "league_nl_eredivisie",
  "Eredivisie",
  "Países Bajos"
);
 
// =======================
// EXPORTS
// =======================
export const initialLeague = leagueES;

export const allLeagues = [
  leagueES,
  leagueEN,
  leagueIT,
  leagueDE,
  leagueFR,
  leaguePT,
  leagueNL
];