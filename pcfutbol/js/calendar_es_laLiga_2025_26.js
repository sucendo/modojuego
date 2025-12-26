/**
 * PC Fútbol – Calendario La Liga EA Sports 2025/26 (España)
 *
 * Adaptado a los IDs de clubs usados en tu data.js (league_es_primera).
 * - matchdays[]: 38 jornadas
 * - matches[]: 10 partidos por jornada
 *
 * match:
 *  - matchId: "es_2025_26_r05_m123"
 *  - kickoffLocal: ISO con offset (Europe/Madrid)
 *  - kickoffUtc: ISO en UTC
 *  - date/time: strings "YYYY-MM-DD" / "HH:MM"
 *  - stadium: estadio del equipo local (según data.js)
 *  - homeId/awayId: ids internos (realmadrid, barcelona, ...)
 *  - homeName/awayName: nombres internos (según data.js)
 *  - score: null (hasta que haya resultado)
 */
export const CALENDAR_ES_LALIGA_2025_26 = {
  "leagueId": "league_es_primera",
  "leagueName": "La Liga EA Sports",
  "country": "España",
  "season": "2025-2026",
  "timezone": "Europe/Madrid",
  "generatedAt": "2025-12-23T09:47:34.670591+01:00",
  "matchdays": [
    {
      "matchday": 1,
      "dateFrom": "2025-08-15",
      "dateTo": "2025-08-19",
      "matches": [
        {
          "matchId": "es_2025_26_r01_m001",
          "round": 1,
          "kickoffLocal": "2025-08-15T19:00:00+02:00",
          "kickoffUtc": "2025-08-15T17:00:00Z",
          "date": "2025-08-15",
          "time": "19:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "rayo",
          "homeName": "Girona FC",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 1,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r01_m002",
          "round": 1,
          "kickoffLocal": "2025-08-15T21:30:00+02:00",
          "kickoffUtc": "2025-08-15T19:30:00Z",
          "date": "2025-08-15",
          "time": "21:30",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "realoviedo",
          "homeName": "Villarreal CF",
          "awayName": "Real Oviedo",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r01_m004",
          "round": 1,
          "kickoffLocal": "2025-08-16T19:30:00+02:00",
          "kickoffUtc": "2025-08-16T17:30:00Z",
          "date": "2025-08-16",
          "time": "19:30",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "barcelona",
          "homeName": "RCD Mallorca",
          "awayName": "FC Barcelona",
          "score": {
            "home": 0,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r01_m003",
          "round": 1,
          "kickoffLocal": "2025-08-16T21:30:00+02:00",
          "kickoffUtc": "2025-08-16T19:30:00Z",
          "date": "2025-08-16",
          "time": "21:30",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "levante",
          "homeName": "Deportivo Alavés",
          "awayName": "Levante UD",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r01_m005",
          "round": 1,
          "kickoffLocal": "2025-08-16T21:30:00+02:00",
          "kickoffUtc": "2025-08-16T19:30:00Z",
          "date": "2025-08-16",
          "time": "21:30",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "realsociedad",
          "homeName": "Valencia CF",
          "awayName": "Real Sociedad",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r01_m006",
          "round": 1,
          "kickoffLocal": "2025-08-17T17:00:00+02:00",
          "kickoffUtc": "2025-08-17T15:00:00Z",
          "date": "2025-08-17",
          "time": "17:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "getafe",
          "homeName": "RC Celta",
          "awayName": "Getafe CF",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r01_m007",
          "round": 1,
          "kickoffLocal": "2025-08-17T19:30:00+02:00",
          "kickoffUtc": "2025-08-17T17:30:00Z",
          "date": "2025-08-17",
          "time": "19:30",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "sevilla",
          "homeName": "Athletic Club",
          "awayName": "Sevilla FC",
          "score": {
            "home": 3,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r01_m008",
          "round": 1,
          "kickoffLocal": "2025-08-17T21:30:00+02:00",
          "kickoffUtc": "2025-08-17T19:30:00Z",
          "date": "2025-08-17",
          "time": "21:30",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "atletico",
          "homeName": "RCD Espanyol",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r01_m009",
          "round": 1,
          "kickoffLocal": "2025-08-18T21:00:00+02:00",
          "kickoffUtc": "2025-08-18T19:00:00Z",
          "date": "2025-08-18",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "betis",
          "homeName": "Elche CF",
          "awayName": "Real Betis",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r01_m010",
          "round": 1,
          "kickoffLocal": "2025-08-19T21:00:00+02:00",
          "kickoffUtc": "2025-08-19T19:00:00Z",
          "date": "2025-08-19",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "osasuna",
          "homeName": "Real Madrid CF",
          "awayName": "CA Osasuna",
          "score": {
            "home": 1,
            "away": 0
          }
        }
      ]
    },
    {
      "matchday": 2,
      "dateFrom": "2025-08-22",
      "dateTo": "2025-08-25",
      "matches": [
        {
          "matchId": "es_2025_26_r02_m015",
          "round": 2,
          "kickoffLocal": "2025-08-22T21:30:00+02:00",
          "kickoffUtc": "2025-08-22T19:30:00Z",
          "date": "2025-08-22",
          "time": "21:30",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "alaves",
          "homeName": "Real Betis",
          "awayName": "Deportivo Alavés",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r02_m017",
          "round": 2,
          "kickoffLocal": "2025-08-23T17:00:00+02:00",
          "kickoffUtc": "2025-08-23T15:00:00Z",
          "date": "2025-08-23",
          "time": "17:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "celta",
          "homeName": "RCD Mallorca",
          "awayName": "RC Celta",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r02_m012",
          "round": 2,
          "kickoffLocal": "2025-08-23T19:30:00+02:00",
          "kickoffUtc": "2025-08-23T17:30:00Z",
          "date": "2025-08-23",
          "time": "19:30",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "elche",
          "homeName": "Atlético de Madrid",
          "awayName": "Elche CF",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r02_m016",
          "round": 2,
          "kickoffLocal": "2025-08-23T21:30:00+02:00",
          "kickoffUtc": "2025-08-23T19:30:00Z",
          "date": "2025-08-23",
          "time": "21:30",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "barcelona",
          "homeName": "Levante UD",
          "awayName": "FC Barcelona",
          "score": {
            "home": 2,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r02_m013",
          "round": 2,
          "kickoffLocal": "2025-08-24T17:00:00+02:00",
          "kickoffUtc": "2025-08-24T15:00:00Z",
          "date": "2025-08-24",
          "time": "17:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "valencia",
          "homeName": "CA Osasuna",
          "awayName": "Valencia CF",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r02_m018",
          "round": 2,
          "kickoffLocal": "2025-08-24T19:30:00+02:00",
          "kickoffUtc": "2025-08-24T17:30:00Z",
          "date": "2025-08-24",
          "time": "19:30",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "espanyol",
          "homeName": "Real Sociedad",
          "awayName": "RCD Espanyol",
          "score": {
            "home": 2,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r02_m020",
          "round": 2,
          "kickoffLocal": "2025-08-24T19:30:00+02:00",
          "kickoffUtc": "2025-08-24T17:30:00Z",
          "date": "2025-08-24",
          "time": "19:30",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "girona",
          "homeName": "Villarreal CF",
          "awayName": "Girona FC",
          "score": {
            "home": 5,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r02_m014",
          "round": 2,
          "kickoffLocal": "2025-08-24T21:30:00+02:00",
          "kickoffUtc": "2025-08-24T19:30:00Z",
          "date": "2025-08-24",
          "time": "21:30",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "realmadrid",
          "homeName": "Real Oviedo",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 0,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r02_m011",
          "round": 2,
          "kickoffLocal": "2025-08-25T19:30:00+02:00",
          "kickoffUtc": "2025-08-25T17:30:00Z",
          "date": "2025-08-25",
          "time": "19:30",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "rayo",
          "homeName": "Athletic Club",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r02_m019",
          "round": 2,
          "kickoffLocal": "2025-08-25T21:30:00+02:00",
          "kickoffUtc": "2025-08-25T19:30:00Z",
          "date": "2025-08-25",
          "time": "21:30",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "getafe",
          "homeName": "Sevilla FC",
          "awayName": "Getafe CF",
          "score": {
            "home": 1,
            "away": 2
          }
        }
      ]
    },
    {
      "matchday": 3,
      "dateFrom": "2025-08-29",
      "dateTo": "2025-08-31",
      "matches": [
        {
          "matchId": "es_2025_26_r03_m023",
          "round": 3,
          "kickoffLocal": "2025-08-29T19:30:00+02:00",
          "kickoffUtc": "2025-08-29T17:30:00Z",
          "date": "2025-08-29",
          "time": "19:30",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "levante",
          "homeName": "Elche CF",
          "awayName": "Levante UD",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r03_m029",
          "round": 3,
          "kickoffLocal": "2025-08-29T21:30:00+02:00",
          "kickoffUtc": "2025-08-29T19:30:00Z",
          "date": "2025-08-29",
          "time": "21:30",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "getafe",
          "homeName": "Valencia CF",
          "awayName": "Getafe CF",
          "score": {
            "home": 3,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r03_m021",
          "round": 3,
          "kickoffLocal": "2025-08-30T17:00:00+02:00",
          "kickoffUtc": "2025-08-30T15:00:00Z",
          "date": "2025-08-30",
          "time": "17:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "atletico",
          "homeName": "Deportivo Alavés",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r03_m026",
          "round": 3,
          "kickoffLocal": "2025-08-30T19:00:00+02:00",
          "kickoffUtc": "2025-08-30T17:00:00Z",
          "date": "2025-08-30",
          "time": "19:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "realsociedad",
          "homeName": "Real Oviedo",
          "awayName": "Real Sociedad",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r03_m025",
          "round": 3,
          "kickoffLocal": "2025-08-30T19:30:00+02:00",
          "kickoffUtc": "2025-08-30T17:30:00Z",
          "date": "2025-08-30",
          "time": "19:30",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "sevilla",
          "homeName": "Girona FC",
          "awayName": "Sevilla FC",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r03_m030",
          "round": 3,
          "kickoffLocal": "2025-08-30T21:30:00+02:00",
          "kickoffUtc": "2025-08-30T19:30:00Z",
          "date": "2025-08-30",
          "time": "21:30",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "mallorca",
          "homeName": "Real Madrid CF",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r03_m022",
          "round": 3,
          "kickoffLocal": "2025-08-31T17:00:00+02:00",
          "kickoffUtc": "2025-08-31T15:00:00Z",
          "date": "2025-08-31",
          "time": "17:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "villarreal",
          "homeName": "RC Celta",
          "awayName": "Villarreal CF",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r03_m027",
          "round": 3,
          "kickoffLocal": "2025-08-31T19:00:00+02:00",
          "kickoffUtc": "2025-08-31T17:00:00Z",
          "date": "2025-08-31",
          "time": "19:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "athletic",
          "homeName": "Real Betis",
          "awayName": "Athletic Club",
          "score": {
            "home": 1,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r03_m024",
          "round": 3,
          "kickoffLocal": "2025-08-31T19:30:00+02:00",
          "kickoffUtc": "2025-08-31T17:30:00Z",
          "date": "2025-08-31",
          "time": "19:30",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "osasuna",
          "homeName": "RCD Espanyol",
          "awayName": "CA Osasuna",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r03_m028",
          "round": 3,
          "kickoffLocal": "2025-08-31T21:30:00+02:00",
          "kickoffUtc": "2025-08-31T19:30:00Z",
          "date": "2025-08-31",
          "time": "21:30",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "barcelona",
          "homeName": "Rayo Vallecano",
          "awayName": "FC Barcelona",
          "score": {
            "home": 1,
            "away": 1
          }
        }
      ]
    },
    {
      "matchday": 4,
      "dateFrom": "2025-09-12",
      "dateTo": "2025-09-15",
      "matches": [
        {
          "matchId": "es_2025_26_r04_m039",
          "round": 4,
          "kickoffLocal": "2025-09-12T21:00:00+02:00",
          "kickoffUtc": "2025-09-12T19:00:00Z",
          "date": "2025-09-12",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "elche",
          "homeName": "Sevilla FC",
          "awayName": "Elche CF",
          "score": {
            "home": 2,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r04_m035",
          "round": 4,
          "kickoffLocal": "2025-09-13T14:00:00+02:00",
          "kickoffUtc": "2025-09-13T12:00:00Z",
          "date": "2025-09-13",
          "time": "14:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "realoviedo",
          "homeName": "Getafe CF",
          "awayName": "Real Oviedo",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r04_m040",
          "round": 4,
          "kickoffLocal": "2025-09-13T16:15:00+02:00",
          "kickoffUtc": "2025-09-13T14:15:00Z",
          "date": "2025-09-13",
          "time": "16:15",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "realmadrid",
          "homeName": "Real Sociedad",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 1,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r04_m037",
          "round": 4,
          "kickoffLocal": "2025-09-13T18:30:00+02:00",
          "kickoffUtc": "2025-09-13T16:30:00Z",
          "date": "2025-09-13",
          "time": "18:30",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "alaves",
          "homeName": "Athletic Club",
          "awayName": "Deportivo Alavés",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r04_m031",
          "round": 4,
          "kickoffLocal": "2025-09-13T21:00:00+02:00",
          "kickoffUtc": "2025-09-13T19:00:00Z",
          "date": "2025-09-13",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "villarreal",
          "homeName": "Atlético de Madrid",
          "awayName": "Villarreal CF",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r04_m033",
          "round": 4,
          "kickoffLocal": "2025-09-14T14:00:00+02:00",
          "kickoffUtc": "2025-09-14T12:00:00Z",
          "date": "2025-09-14",
          "time": "14:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "girona",
          "homeName": "RC Celta",
          "awayName": "Girona FC",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r04_m038",
          "round": 4,
          "kickoffLocal": "2025-09-14T16:15:00+02:00",
          "kickoffUtc": "2025-09-14T14:15:00Z",
          "date": "2025-09-14",
          "time": "16:15",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "betis",
          "homeName": "Levante UD",
          "awayName": "Real Betis",
          "score": {
            "home": 2,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r04_m036",
          "round": 4,
          "kickoffLocal": "2025-09-14T18:30:00+02:00",
          "kickoffUtc": "2025-09-14T16:30:00Z",
          "date": "2025-09-14",
          "time": "18:30",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "rayo",
          "homeName": "CA Osasuna",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r04_m032",
          "round": 4,
          "kickoffLocal": "2025-09-14T21:00:00+02:00",
          "kickoffUtc": "2025-09-14T19:00:00Z",
          "date": "2025-09-14",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "valencia",
          "homeName": "FC Barcelona",
          "awayName": "Valencia CF",
          "score": {
            "home": 6,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r04_m034",
          "round": 4,
          "kickoffLocal": "2025-09-15T21:00:00+02:00",
          "kickoffUtc": "2025-09-15T19:00:00Z",
          "date": "2025-09-15",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "mallorca",
          "homeName": "RCD Espanyol",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 3,
            "away": 2
          }
        }
      ]
    },
    {
      "matchday": 5,
      "dateFrom": "2025-09-19",
      "dateTo": "2025-09-21",
      "matches": [
        {
          "matchId": "es_2025_26_r05_m043",
          "round": 5,
          "kickoffLocal": "2025-09-19T21:00:00+02:00",
          "kickoffUtc": "2025-09-19T19:00:00Z",
          "date": "2025-09-19",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "realsociedad",
          "homeName": "Real Betis",
          "awayName": "Real Sociedad",
          "score": {
            "home": 3,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r05_m045",
          "round": 5,
          "kickoffLocal": "2025-09-20T14:00:00+02:00",
          "kickoffUtc": "2025-09-20T12:00:00Z",
          "date": "2025-09-20",
          "time": "14:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "levante",
          "homeName": "Girona FC",
          "awayName": "Levante UD",
          "score": {
            "home": 0,
            "away": 4
          }
        },
        {
          "matchId": "es_2025_26_r05_m049",
          "round": 5,
          "kickoffLocal": "2025-09-20T16:15:00+02:00",
          "kickoffUtc": "2025-09-20T14:15:00Z",
          "date": "2025-09-20",
          "time": "16:15",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "espanyol",
          "homeName": "Real Madrid CF",
          "awayName": "RCD Espanyol",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r05_m041",
          "round": 5,
          "kickoffLocal": "2025-09-20T18:30:00+02:00",
          "kickoffUtc": "2025-09-20T16:30:00Z",
          "date": "2025-09-20",
          "time": "18:30",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "sevilla",
          "homeName": "Deportivo Alavés",
          "awayName": "Sevilla FC",
          "score": {
            "home": 1,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r05_m050",
          "round": 5,
          "kickoffLocal": "2025-09-20T18:30:00+02:00",
          "kickoffUtc": "2025-09-20T16:30:00Z",
          "date": "2025-09-20",
          "time": "18:30",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "osasuna",
          "homeName": "Villarreal CF",
          "awayName": "CA Osasuna",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r05_m046",
          "round": 5,
          "kickoffLocal": "2025-09-20T21:00:00+02:00",
          "kickoffUtc": "2025-09-20T19:00:00Z",
          "date": "2025-09-20",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "athletic",
          "homeName": "Valencia CF",
          "awayName": "Athletic Club",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r05_m048",
          "round": 5,
          "kickoffLocal": "2025-09-21T14:00:00+02:00",
          "kickoffUtc": "2025-09-21T12:00:00Z",
          "date": "2025-09-21",
          "time": "14:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "celta",
          "homeName": "Rayo Vallecano",
          "awayName": "RC Celta",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r05_m047",
          "round": 5,
          "kickoffLocal": "2025-09-21T16:15:00+02:00",
          "kickoffUtc": "2025-09-21T14:15:00Z",
          "date": "2025-09-21",
          "time": "16:15",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "atletico",
          "homeName": "RCD Mallorca",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r05_m044",
          "round": 5,
          "kickoffLocal": "2025-09-21T18:15:00+02:00",
          "kickoffUtc": "2025-09-21T16:15:00Z",
          "date": "2025-09-21",
          "time": "18:15",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "realoviedo",
          "homeName": "Elche CF",
          "awayName": "Real Oviedo",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r05_m042",
          "round": 5,
          "kickoffLocal": "2025-09-21T21:00:00+02:00",
          "kickoffUtc": "2025-09-21T19:00:00Z",
          "date": "2025-09-21",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "getafe",
          "homeName": "FC Barcelona",
          "awayName": "Getafe CF",
          "score": {
            "home": 3,
            "away": 0
          }
        }
      ]
    },
    {
      "matchday": 6,
      "dateFrom": "2025-08-27",
      "dateTo": "2025-09-25",
      "matches": [
        {
          "matchId": "es_2025_26_r06_m058",
          "round": 6,
          "kickoffLocal": "2025-08-27T21:00:00+02:00",
          "kickoffUtc": "2025-08-27T19:00:00Z",
          "date": "2025-08-27",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "betis",
          "homeName": "RC Celta",
          "awayName": "Real Betis",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r06_m051",
          "round": 6,
          "kickoffLocal": "2025-09-23T19:00:00+02:00",
          "kickoffUtc": "2025-09-23T17:00:00Z",
          "date": "2025-09-23",
          "time": "19:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "girona",
          "homeName": "Athletic Club",
          "awayName": "Girona FC",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r06_m053",
          "round": 6,
          "kickoffLocal": "2025-09-23T19:00:00+02:00",
          "kickoffUtc": "2025-09-23T17:00:00Z",
          "date": "2025-09-23",
          "time": "19:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "valencia",
          "homeName": "RCD Espanyol",
          "awayName": "Valencia CF",
          "score": {
            "home": 2,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r06_m054",
          "round": 6,
          "kickoffLocal": "2025-09-23T21:30:00+02:00",
          "kickoffUtc": "2025-09-23T19:30:00Z",
          "date": "2025-09-23",
          "time": "21:30",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "realmadrid",
          "homeName": "Levante UD",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 1,
            "away": 4
          }
        },
        {
          "matchId": "es_2025_26_r06_m055",
          "round": 6,
          "kickoffLocal": "2025-09-23T21:30:00+02:00",
          "kickoffUtc": "2025-09-23T19:30:00Z",
          "date": "2025-09-23",
          "time": "21:30",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "villarreal",
          "homeName": "Sevilla FC",
          "awayName": "Villarreal CF",
          "score": {
            "home": 1,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r06_m056",
          "round": 6,
          "kickoffLocal": "2025-09-24T19:00:00+02:00",
          "kickoffUtc": "2025-09-24T17:00:00Z",
          "date": "2025-09-24",
          "time": "19:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "alaves",
          "homeName": "Getafe CF",
          "awayName": "Deportivo Alavés",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r06_m052",
          "round": 6,
          "kickoffLocal": "2025-09-24T21:30:00+02:00",
          "kickoffUtc": "2025-09-24T19:30:00Z",
          "date": "2025-09-24",
          "time": "21:30",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "rayo",
          "homeName": "Atlético de Madrid",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 3,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r06_m060",
          "round": 6,
          "kickoffLocal": "2025-09-24T21:30:00+02:00",
          "kickoffUtc": "2025-09-24T19:30:00Z",
          "date": "2025-09-24",
          "time": "21:30",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "mallorca",
          "homeName": "Real Sociedad",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r06_m059",
          "round": 6,
          "kickoffLocal": "2025-09-25T19:30:00+02:00",
          "kickoffUtc": "2025-09-25T17:30:00Z",
          "date": "2025-09-25",
          "time": "19:30",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "elche",
          "homeName": "CA Osasuna",
          "awayName": "Elche CF",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r06_m057",
          "round": 6,
          "kickoffLocal": "2025-09-25T21:30:00+02:00",
          "kickoffUtc": "2025-09-25T19:30:00Z",
          "date": "2025-09-25",
          "time": "21:30",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "barcelona",
          "homeName": "Real Oviedo",
          "awayName": "FC Barcelona",
          "score": {
            "home": 1,
            "away": 3
          }
        }
      ]
    },
    {
      "matchday": 7,
      "dateFrom": "2025-09-26",
      "dateTo": "2025-09-30",
      "matches": [
        {
          "matchId": "es_2025_26_r07_m069",
          "round": 7,
          "kickoffLocal": "2025-09-26T21:00:00+02:00",
          "kickoffUtc": "2025-09-26T19:00:00Z",
          "date": "2025-09-26",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "espanyol",
          "homeName": "Girona FC",
          "awayName": "RCD Espanyol",
          "score": {
            "home": 0,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r07_m064",
          "round": 7,
          "kickoffLocal": "2025-09-27T14:00:00+02:00",
          "kickoffUtc": "2025-09-27T12:00:00Z",
          "date": "2025-09-27",
          "time": "14:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "levante",
          "homeName": "Getafe CF",
          "awayName": "Levante UD",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r07_m061",
          "round": 7,
          "kickoffLocal": "2025-09-27T16:15:00+02:00",
          "kickoffUtc": "2025-09-27T14:15:00Z",
          "date": "2025-09-27",
          "time": "16:15",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "realmadrid",
          "homeName": "Atlético de Madrid",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 5,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r07_m066",
          "round": 7,
          "kickoffLocal": "2025-09-27T18:30:00+02:00",
          "kickoffUtc": "2025-09-27T16:30:00Z",
          "date": "2025-09-27",
          "time": "18:30",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "alaves",
          "homeName": "RCD Mallorca",
          "awayName": "Deportivo Alavés",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r07_m067",
          "round": 7,
          "kickoffLocal": "2025-09-27T21:00:00+02:00",
          "kickoffUtc": "2025-09-27T19:00:00Z",
          "date": "2025-09-27",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "athletic",
          "homeName": "Villarreal CF",
          "awayName": "Athletic Club",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r07_m065",
          "round": 7,
          "kickoffLocal": "2025-09-28T14:00:00+02:00",
          "kickoffUtc": "2025-09-28T12:00:00Z",
          "date": "2025-09-28",
          "time": "14:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "sevilla",
          "homeName": "Rayo Vallecano",
          "awayName": "Sevilla FC",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r07_m068",
          "round": 7,
          "kickoffLocal": "2025-09-28T16:15:00+02:00",
          "kickoffUtc": "2025-09-28T14:15:00Z",
          "date": "2025-09-28",
          "time": "16:15",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "celta",
          "homeName": "Elche CF",
          "awayName": "RC Celta",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r07_m062",
          "round": 7,
          "kickoffLocal": "2025-09-28T18:30:00+02:00",
          "kickoffUtc": "2025-09-28T16:30:00Z",
          "date": "2025-09-28",
          "time": "18:30",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "realsociedad",
          "homeName": "FC Barcelona",
          "awayName": "Real Sociedad",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r07_m063",
          "round": 7,
          "kickoffLocal": "2025-09-28T21:00:00+02:00",
          "kickoffUtc": "2025-09-28T19:00:00Z",
          "date": "2025-09-28",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "osasuna",
          "homeName": "Real Betis",
          "awayName": "CA Osasuna",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r07_m070",
          "round": 7,
          "kickoffLocal": "2025-09-30T20:00:00+02:00",
          "kickoffUtc": "2025-09-30T18:00:00Z",
          "date": "2025-09-30",
          "time": "20:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "realoviedo",
          "homeName": "Valencia CF",
          "awayName": "Real Oviedo",
          "score": {
            "home": 1,
            "away": 2
          }
        }
      ]
    },
    {
      "matchday": 8,
      "dateFrom": "2025-10-03",
      "dateTo": "2025-10-05",
      "matches": [
        {
          "matchId": "es_2025_26_r08_m078",
          "round": 8,
          "kickoffLocal": "2025-10-03T21:00:00+02:00",
          "kickoffUtc": "2025-10-03T19:00:00Z",
          "date": "2025-10-03",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "getafe",
          "homeName": "CA Osasuna",
          "awayName": "Getafe CF",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r08_m079",
          "round": 8,
          "kickoffLocal": "2025-10-04T14:00:00+02:00",
          "kickoffUtc": "2025-10-04T12:00:00Z",
          "date": "2025-10-04",
          "time": "14:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "levante",
          "homeName": "Real Oviedo",
          "awayName": "Levante UD",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r08_m073",
          "round": 8,
          "kickoffLocal": "2025-10-04T16:15:00+02:00",
          "kickoffUtc": "2025-10-04T14:15:00Z",
          "date": "2025-10-04",
          "time": "16:15",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "valencia",
          "homeName": "Girona FC",
          "awayName": "Valencia CF",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r08_m072",
          "round": 8,
          "kickoffLocal": "2025-10-04T18:30:00+02:00",
          "kickoffUtc": "2025-10-04T16:30:00Z",
          "date": "2025-10-04",
          "time": "18:30",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "mallorca",
          "homeName": "Athletic Club",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r08_m074",
          "round": 8,
          "kickoffLocal": "2025-10-04T21:00:00+02:00",
          "kickoffUtc": "2025-10-04T19:00:00Z",
          "date": "2025-10-04",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "villarreal",
          "homeName": "Real Madrid CF",
          "awayName": "Villarreal CF",
          "score": {
            "home": 3,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r08_m071",
          "round": 8,
          "kickoffLocal": "2025-10-05T14:00:00+02:00",
          "kickoffUtc": "2025-10-05T12:00:00Z",
          "date": "2025-10-05",
          "time": "14:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "elche",
          "homeName": "Deportivo Alavés",
          "awayName": "Elche CF",
          "score": {
            "home": 3,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r08_m076",
          "round": 8,
          "kickoffLocal": "2025-10-05T16:15:00+02:00",
          "kickoffUtc": "2025-10-05T14:15:00Z",
          "date": "2025-10-05",
          "time": "16:15",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "barcelona",
          "homeName": "Sevilla FC",
          "awayName": "FC Barcelona",
          "score": {
            "home": 4,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r08_m077",
          "round": 8,
          "kickoffLocal": "2025-10-05T18:30:00+02:00",
          "kickoffUtc": "2025-10-05T16:30:00Z",
          "date": "2025-10-05",
          "time": "18:30",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "betis",
          "homeName": "RCD Espanyol",
          "awayName": "Real Betis",
          "score": {
            "home": 1,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r08_m080",
          "round": 8,
          "kickoffLocal": "2025-10-05T18:30:00+02:00",
          "kickoffUtc": "2025-10-05T16:30:00Z",
          "date": "2025-10-05",
          "time": "18:30",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "rayo",
          "homeName": "Real Sociedad",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r08_m075",
          "round": 8,
          "kickoffLocal": "2025-10-05T21:00:00+02:00",
          "kickoffUtc": "2025-10-05T19:00:00Z",
          "date": "2025-10-05",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "atletico",
          "homeName": "RC Celta",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 1,
            "away": 1
          }
        }
      ]
    },
    {
      "matchday": 9,
      "dateFrom": "2025-10-17",
      "dateTo": "2025-10-20",
      "matches": [
        {
          "matchId": "es_2025_26_r09_m089",
          "round": 9,
          "kickoffLocal": "2025-10-17T21:00:00+02:00",
          "kickoffUtc": "2025-10-17T19:00:00Z",
          "date": "2025-10-17",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "espanyol",
          "homeName": "Real Oviedo",
          "awayName": "RCD Espanyol",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r09_m090",
          "round": 9,
          "kickoffLocal": "2025-10-18T14:00:00+02:00",
          "kickoffUtc": "2025-10-18T12:00:00Z",
          "date": "2025-10-18",
          "time": "14:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "mallorca",
          "homeName": "Sevilla FC",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 1,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r09_m083",
          "round": 9,
          "kickoffLocal": "2025-10-18T16:15:00+02:00",
          "kickoffUtc": "2025-10-18T14:15:00Z",
          "date": "2025-10-18",
          "time": "16:15",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "girona",
          "homeName": "FC Barcelona",
          "awayName": "Girona FC",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r09_m088",
          "round": 9,
          "kickoffLocal": "2025-10-18T18:30:00+02:00",
          "kickoffUtc": "2025-10-18T16:30:00Z",
          "date": "2025-10-18",
          "time": "18:30",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "betis",
          "homeName": "Villarreal CF",
          "awayName": "Real Betis",
          "score": {
            "home": 2,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r09_m082",
          "round": 9,
          "kickoffLocal": "2025-10-18T21:00:00+02:00",
          "kickoffUtc": "2025-10-18T19:00:00Z",
          "date": "2025-10-18",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "osasuna",
          "homeName": "Atlético de Madrid",
          "awayName": "CA Osasuna",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r09_m087",
          "round": 9,
          "kickoffLocal": "2025-10-19T14:00:00+02:00",
          "kickoffUtc": "2025-10-19T12:00:00Z",
          "date": "2025-10-19",
          "time": "14:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "athletic",
          "homeName": "Elche CF",
          "awayName": "Athletic Club",
          "score": {
            "home": 0,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r09_m084",
          "round": 9,
          "kickoffLocal": "2025-10-19T16:15:00+02:00",
          "kickoffUtc": "2025-10-19T14:15:00Z",
          "date": "2025-10-19",
          "time": "16:15",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "realsociedad",
          "homeName": "RC Celta",
          "awayName": "Real Sociedad",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r09_m086",
          "round": 9,
          "kickoffLocal": "2025-10-19T18:30:00+02:00",
          "kickoffUtc": "2025-10-19T16:30:00Z",
          "date": "2025-10-19",
          "time": "18:30",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "rayo",
          "homeName": "Levante UD",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 0,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r09_m085",
          "round": 9,
          "kickoffLocal": "2025-10-19T21:00:00+02:00",
          "kickoffUtc": "2025-10-19T19:00:00Z",
          "date": "2025-10-19",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "realmadrid",
          "homeName": "Getafe CF",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r09_m081",
          "round": 9,
          "kickoffLocal": "2025-10-20T21:00:00+02:00",
          "kickoffUtc": "2025-10-20T19:00:00Z",
          "date": "2025-10-20",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "valencia",
          "homeName": "Deportivo Alavés",
          "awayName": "Valencia CF",
          "score": {
            "home": 0,
            "away": 0
          }
        }
      ]
    },
    {
      "matchday": 10,
      "dateFrom": "2025-10-24",
      "dateTo": "2025-10-27",
      "matches": [
        {
          "matchId": "es_2025_26_r10_m093",
          "round": 10,
          "kickoffLocal": "2025-10-24T21:00:00+02:00",
          "kickoffUtc": "2025-10-24T19:00:00Z",
          "date": "2025-10-24",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "sevilla",
          "homeName": "Real Sociedad",
          "awayName": "Sevilla FC",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r10_m092",
          "round": 10,
          "kickoffLocal": "2025-10-25T14:00:00+02:00",
          "kickoffUtc": "2025-10-25T12:00:00Z",
          "date": "2025-10-25",
          "time": "14:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "realoviedo",
          "homeName": "Girona FC",
          "awayName": "Real Oviedo",
          "score": {
            "home": 3,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r10_m099",
          "round": 10,
          "kickoffLocal": "2025-10-25T16:15:00+02:00",
          "kickoffUtc": "2025-10-25T14:15:00Z",
          "date": "2025-10-25",
          "time": "16:15",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "elche",
          "homeName": "RCD Espanyol",
          "awayName": "Elche CF",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r10_m091",
          "round": 10,
          "kickoffLocal": "2025-10-25T18:30:00+02:00",
          "kickoffUtc": "2025-10-25T16:30:00Z",
          "date": "2025-10-25",
          "time": "18:30",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "getafe",
          "homeName": "Athletic Club",
          "awayName": "Getafe CF",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r10_m094",
          "round": 10,
          "kickoffLocal": "2025-10-25T21:00:00+02:00",
          "kickoffUtc": "2025-10-25T19:00:00Z",
          "date": "2025-10-25",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "villarreal",
          "homeName": "Valencia CF",
          "awayName": "Villarreal CF",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r10_m100",
          "round": 10,
          "kickoffLocal": "2025-10-26T14:00:00+01:00",
          "kickoffUtc": "2025-10-26T13:00:00Z",
          "date": "2025-10-26",
          "time": "14:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "levante",
          "homeName": "RCD Mallorca",
          "awayName": "Levante UD",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r10_m097",
          "round": 10,
          "kickoffLocal": "2025-10-26T16:15:00+01:00",
          "kickoffUtc": "2025-10-26T15:15:00Z",
          "date": "2025-10-26",
          "time": "16:15",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "barcelona",
          "homeName": "Real Madrid CF",
          "awayName": "FC Barcelona",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r10_m098",
          "round": 10,
          "kickoffLocal": "2025-10-26T18:30:00+01:00",
          "kickoffUtc": "2025-10-26T17:30:00Z",
          "date": "2025-10-26",
          "time": "18:30",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "celta",
          "homeName": "CA Osasuna",
          "awayName": "RC Celta",
          "score": {
            "home": 2,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r10_m095",
          "round": 10,
          "kickoffLocal": "2025-10-26T21:00:00+01:00",
          "kickoffUtc": "2025-10-26T20:00:00Z",
          "date": "2025-10-26",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "alaves",
          "homeName": "Rayo Vallecano",
          "awayName": "Deportivo Alavés",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r10_m096",
          "round": 10,
          "kickoffLocal": "2025-10-27T21:00:00+01:00",
          "kickoffUtc": "2025-10-27T20:00:00Z",
          "date": "2025-10-27",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "atletico",
          "homeName": "Real Betis",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 0,
            "away": 2
          }
        }
      ]
    },
    {
      "matchday": 11,
      "dateFrom": "2025-10-31",
      "dateTo": "2025-11-03",
      "matches": [
        {
          "matchId": "es_2025_26_r11_m105",
          "round": 11,
          "kickoffLocal": "2025-10-31T21:00:00+01:00",
          "kickoffUtc": "2025-10-31T20:00:00Z",
          "date": "2025-10-31",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "girona",
          "homeName": "Getafe CF",
          "awayName": "Girona FC",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r11_m110",
          "round": 11,
          "kickoffLocal": "2025-11-01T14:00:00+01:00",
          "kickoffUtc": "2025-11-01T13:00:00Z",
          "date": "2025-11-01",
          "time": "14:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "rayo",
          "homeName": "Villarreal CF",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 4,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r11_m102",
          "round": 11,
          "kickoffLocal": "2025-11-01T16:15:00+01:00",
          "kickoffUtc": "2025-11-01T15:15:00Z",
          "date": "2025-11-01",
          "time": "16:15",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "sevilla",
          "homeName": "Atlético de Madrid",
          "awayName": "Sevilla FC",
          "score": {
            "home": 3,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r11_m107",
          "round": 11,
          "kickoffLocal": "2025-11-01T18:30:00+01:00",
          "kickoffUtc": "2025-11-01T17:30:00Z",
          "date": "2025-11-01",
          "time": "18:30",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "athletic",
          "homeName": "Real Sociedad",
          "awayName": "Athletic Club",
          "score": {
            "home": 3,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r11_m106",
          "round": 11,
          "kickoffLocal": "2025-11-01T21:00:00+01:00",
          "kickoffUtc": "2025-11-01T20:00:00Z",
          "date": "2025-11-01",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "valencia",
          "homeName": "Real Madrid CF",
          "awayName": "Valencia CF",
          "score": {
            "home": 4,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r11_m108",
          "round": 11,
          "kickoffLocal": "2025-11-02T14:00:00+01:00",
          "kickoffUtc": "2025-11-02T13:00:00Z",
          "date": "2025-11-02",
          "time": "14:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "celta",
          "homeName": "Levante UD",
          "awayName": "RC Celta",
          "score": {
            "home": 1,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r11_m101",
          "round": 11,
          "kickoffLocal": "2025-11-02T16:15:00+01:00",
          "kickoffUtc": "2025-11-02T15:15:00Z",
          "date": "2025-11-02",
          "time": "16:15",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "espanyol",
          "homeName": "Deportivo Alavés",
          "awayName": "RCD Espanyol",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r11_m103",
          "round": 11,
          "kickoffLocal": "2025-11-02T18:30:00+01:00",
          "kickoffUtc": "2025-11-02T17:30:00Z",
          "date": "2025-11-02",
          "time": "18:30",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "elche",
          "homeName": "FC Barcelona",
          "awayName": "Elche CF",
          "score": {
            "home": 3,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r11_m104",
          "round": 11,
          "kickoffLocal": "2025-11-02T21:00:00+01:00",
          "kickoffUtc": "2025-11-02T20:00:00Z",
          "date": "2025-11-02",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "mallorca",
          "homeName": "Real Betis",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 3,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r11_m109",
          "round": 11,
          "kickoffLocal": "2025-11-03T21:00:00+01:00",
          "kickoffUtc": "2025-11-03T20:00:00Z",
          "date": "2025-11-03",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "osasuna",
          "homeName": "Real Oviedo",
          "awayName": "CA Osasuna",
          "score": {
            "home": 0,
            "away": 0
          }
        }
      ]
    },
    {
      "matchday": 12,
      "dateFrom": "2025-11-07",
      "dateTo": "2025-11-09",
      "matches": [
        {
          "matchId": "es_2025_26_r12_m113",
          "round": 12,
          "kickoffLocal": "2025-11-07T21:00:00+01:00",
          "kickoffUtc": "2025-11-07T20:00:00Z",
          "date": "2025-11-07",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "realsociedad",
          "homeName": "Elche CF",
          "awayName": "Real Sociedad",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r12_m116",
          "round": 12,
          "kickoffLocal": "2025-11-08T14:00:00+01:00",
          "kickoffUtc": "2025-11-08T13:00:00Z",
          "date": "2025-11-08",
          "time": "14:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "alaves",
          "homeName": "Girona FC",
          "awayName": "Deportivo Alavés",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r12_m120",
          "round": 12,
          "kickoffLocal": "2025-11-08T16:15:00+01:00",
          "kickoffUtc": "2025-11-08T15:15:00Z",
          "date": "2025-11-08",
          "time": "16:15",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "osasuna",
          "homeName": "Sevilla FC",
          "awayName": "CA Osasuna",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r12_m112",
          "round": 12,
          "kickoffLocal": "2025-11-08T18:30:00+01:00",
          "kickoffUtc": "2025-11-08T17:30:00Z",
          "date": "2025-11-08",
          "time": "18:30",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "levante",
          "homeName": "Atlético de Madrid",
          "awayName": "Levante UD",
          "score": {
            "home": 3,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r12_m114",
          "round": 12,
          "kickoffLocal": "2025-11-08T21:00:00+01:00",
          "kickoffUtc": "2025-11-08T20:00:00Z",
          "date": "2025-11-08",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "villarreal",
          "homeName": "RCD Espanyol",
          "awayName": "Villarreal CF",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r12_m111",
          "round": 12,
          "kickoffLocal": "2025-11-09T14:00:00+01:00",
          "kickoffUtc": "2025-11-09T13:00:00Z",
          "date": "2025-11-09",
          "time": "14:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "realoviedo",
          "homeName": "Athletic Club",
          "awayName": "Real Oviedo",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r12_m115",
          "round": 12,
          "kickoffLocal": "2025-11-09T16:15:00+01:00",
          "kickoffUtc": "2025-11-09T15:15:00Z",
          "date": "2025-11-09",
          "time": "16:15",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "realmadrid",
          "homeName": "Rayo Vallecano",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 0,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r12_m118",
          "round": 12,
          "kickoffLocal": "2025-11-09T18:30:00+01:00",
          "kickoffUtc": "2025-11-09T17:30:00Z",
          "date": "2025-11-09",
          "time": "18:30",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "betis",
          "homeName": "Valencia CF",
          "awayName": "Real Betis",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r12_m119",
          "round": 12,
          "kickoffLocal": "2025-11-09T18:30:00+01:00",
          "kickoffUtc": "2025-11-09T17:30:00Z",
          "date": "2025-11-09",
          "time": "18:30",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "getafe",
          "homeName": "RCD Mallorca",
          "awayName": "Getafe CF",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r12_m117",
          "round": 12,
          "kickoffLocal": "2025-11-09T21:00:00+01:00",
          "kickoffUtc": "2025-11-09T20:00:00Z",
          "date": "2025-11-09",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "barcelona",
          "homeName": "RC Celta",
          "awayName": "FC Barcelona",
          "score": {
            "home": 2,
            "away": 4
          }
        }
      ]
    },
    {
      "matchday": 13,
      "dateFrom": "2025-11-21",
      "dateTo": "2025-11-24",
      "matches": [
        {
          "matchId": "es_2025_26_r13_m129",
          "round": 13,
          "kickoffLocal": "2025-11-21T21:00:00+01:00",
          "kickoffUtc": "2025-11-21T20:00:00Z",
          "date": "2025-11-21",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "levante",
          "homeName": "Valencia CF",
          "awayName": "Levante UD",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r13_m121",
          "round": 13,
          "kickoffLocal": "2025-11-22T14:00:00+01:00",
          "kickoffUtc": "2025-11-22T13:00:00Z",
          "date": "2025-11-22",
          "time": "14:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "celta",
          "homeName": "Deportivo Alavés",
          "awayName": "RC Celta",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r13_m127",
          "round": 13,
          "kickoffLocal": "2025-11-22T16:15:00+01:00",
          "kickoffUtc": "2025-11-22T15:15:00Z",
          "date": "2025-11-22",
          "time": "16:15",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "athletic",
          "homeName": "FC Barcelona",
          "awayName": "Athletic Club",
          "score": {
            "home": 4,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r13_m125",
          "round": 13,
          "kickoffLocal": "2025-11-22T18:30:00+01:00",
          "kickoffUtc": "2025-11-22T17:30:00Z",
          "date": "2025-11-22",
          "time": "18:30",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "realsociedad",
          "homeName": "CA Osasuna",
          "awayName": "Real Sociedad",
          "score": {
            "home": 1,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r13_m130",
          "round": 13,
          "kickoffLocal": "2025-11-22T21:00:00+01:00",
          "kickoffUtc": "2025-11-22T20:00:00Z",
          "date": "2025-11-22",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "mallorca",
          "homeName": "Villarreal CF",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r13_m126",
          "round": 13,
          "kickoffLocal": "2025-11-23T14:00:00+01:00",
          "kickoffUtc": "2025-11-23T13:00:00Z",
          "date": "2025-11-23",
          "time": "14:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "rayo",
          "homeName": "Real Oviedo",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 0,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r13_m122",
          "round": 13,
          "kickoffLocal": "2025-11-23T16:15:00+01:00",
          "kickoffUtc": "2025-11-23T15:15:00Z",
          "date": "2025-11-23",
          "time": "16:15",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "girona",
          "homeName": "Real Betis",
          "awayName": "Girona FC",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r13_m128",
          "round": 13,
          "kickoffLocal": "2025-11-23T18:30:00+01:00",
          "kickoffUtc": "2025-11-23T17:30:00Z",
          "date": "2025-11-23",
          "time": "18:30",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "atletico",
          "homeName": "Getafe CF",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r13_m123",
          "round": 13,
          "kickoffLocal": "2025-11-23T21:00:00+01:00",
          "kickoffUtc": "2025-11-23T20:00:00Z",
          "date": "2025-11-23",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "realmadrid",
          "homeName": "Elche CF",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 2,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r13_m124",
          "round": 13,
          "kickoffLocal": "2025-11-24T21:00:00+01:00",
          "kickoffUtc": "2025-11-24T20:00:00Z",
          "date": "2025-11-24",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "sevilla",
          "homeName": "RCD Espanyol",
          "awayName": "Sevilla FC",
          "score": {
            "home": 2,
            "away": 1
          }
        }
      ]
    },
    {
      "matchday": 14,
      "dateFrom": "2025-11-28",
      "dateTo": "2025-12-01",
      "matches": [
        {
          "matchId": "es_2025_26_r14_m140",
          "round": 14,
          "kickoffLocal": "2025-11-28T21:00:00+01:00",
          "kickoffUtc": "2025-11-28T20:00:00Z",
          "date": "2025-11-28",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "elche",
          "homeName": "Getafe CF",
          "awayName": "Elche CF",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r14_m134",
          "round": 14,
          "kickoffLocal": "2025-11-29T14:00:00+01:00",
          "kickoffUtc": "2025-11-29T13:00:00Z",
          "date": "2025-11-29",
          "time": "14:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "osasuna",
          "homeName": "RCD Mallorca",
          "awayName": "CA Osasuna",
          "score": {
            "home": 2,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r14_m137",
          "round": 14,
          "kickoffLocal": "2025-11-29T16:15:00+01:00",
          "kickoffUtc": "2025-11-29T15:15:00Z",
          "date": "2025-11-29",
          "time": "16:15",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "alaves",
          "homeName": "FC Barcelona",
          "awayName": "Deportivo Alavés",
          "score": {
            "home": 3,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r14_m138",
          "round": 14,
          "kickoffLocal": "2025-11-29T18:30:00+01:00",
          "kickoffUtc": "2025-11-29T17:30:00Z",
          "date": "2025-11-29",
          "time": "18:30",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "athletic",
          "homeName": "Levante UD",
          "awayName": "Athletic Club",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r14_m131",
          "round": 14,
          "kickoffLocal": "2025-11-29T21:00:00+01:00",
          "kickoffUtc": "2025-11-29T20:00:00Z",
          "date": "2025-11-29",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "realoviedo",
          "homeName": "Atlético de Madrid",
          "awayName": "Real Oviedo",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r14_m136",
          "round": 14,
          "kickoffLocal": "2025-11-30T14:00:00+01:00",
          "kickoffUtc": "2025-11-30T13:00:00Z",
          "date": "2025-11-30",
          "time": "14:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "villarreal",
          "homeName": "Real Sociedad",
          "awayName": "Villarreal CF",
          "score": {
            "home": 2,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r14_m139",
          "round": 14,
          "kickoffLocal": "2025-11-30T16:15:00+01:00",
          "kickoffUtc": "2025-11-30T15:15:00Z",
          "date": "2025-11-30",
          "time": "16:15",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "betis",
          "homeName": "Sevilla FC",
          "awayName": "Real Betis",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r14_m132",
          "round": 14,
          "kickoffLocal": "2025-11-30T18:30:00+01:00",
          "kickoffUtc": "2025-11-30T17:30:00Z",
          "date": "2025-11-30",
          "time": "18:30",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "espanyol",
          "homeName": "RC Celta",
          "awayName": "RCD Espanyol",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r14_m133",
          "round": 14,
          "kickoffLocal": "2025-11-30T21:00:00+01:00",
          "kickoffUtc": "2025-11-30T20:00:00Z",
          "date": "2025-11-30",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "realmadrid",
          "homeName": "Girona FC",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r14_m135",
          "round": 14,
          "kickoffLocal": "2025-12-01T21:00:00+01:00",
          "kickoffUtc": "2025-12-01T20:00:00Z",
          "date": "2025-12-01",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "valencia",
          "homeName": "Rayo Vallecano",
          "awayName": "Valencia CF",
          "score": {
            "home": 1,
            "away": 1
          }
        }
      ]
    },
    {
      "matchday": 15,
      "dateFrom": "2025-12-05",
      "dateTo": "2025-12-08",
      "matches": [
        {
          "matchId": "es_2025_26_r15_m149",
          "round": 15,
          "kickoffLocal": "2025-12-05T21:00:00+01:00",
          "kickoffUtc": "2025-12-05T20:00:00Z",
          "date": "2025-12-05",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "mallorca",
          "homeName": "Real Oviedo",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 0,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r15_m147",
          "round": 15,
          "kickoffLocal": "2025-12-06T14:00:00+01:00",
          "kickoffUtc": "2025-12-06T13:00:00Z",
          "date": "2025-12-06",
          "time": "14:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "getafe",
          "homeName": "Villarreal CF",
          "awayName": "Getafe CF",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r15_m141",
          "round": 15,
          "kickoffLocal": "2025-12-06T16:15:00+01:00",
          "kickoffUtc": "2025-12-06T15:15:00Z",
          "date": "2025-12-06",
          "time": "16:15",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "realsociedad",
          "homeName": "Deportivo Alavés",
          "awayName": "Real Sociedad",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r15_m145",
          "round": 15,
          "kickoffLocal": "2025-12-06T18:30:00+01:00",
          "kickoffUtc": "2025-12-06T17:30:00Z",
          "date": "2025-12-06",
          "time": "18:30",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "barcelona",
          "homeName": "Real Betis",
          "awayName": "FC Barcelona",
          "score": {
            "home": 3,
            "away": 5
          }
        },
        {
          "matchId": "es_2025_26_r15_m142",
          "round": 15,
          "kickoffLocal": "2025-12-06T21:00:00+01:00",
          "kickoffUtc": "2025-12-06T20:00:00Z",
          "date": "2025-12-06",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "atletico",
          "homeName": "Athletic Club",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r15_m143",
          "round": 15,
          "kickoffLocal": "2025-12-07T14:00:00+01:00",
          "kickoffUtc": "2025-12-07T13:00:00Z",
          "date": "2025-12-07",
          "time": "14:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "girona",
          "homeName": "Elche CF",
          "awayName": "Girona FC",
          "score": {
            "home": 3,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r15_m150",
          "round": 15,
          "kickoffLocal": "2025-12-07T16:15:00+01:00",
          "kickoffUtc": "2025-12-07T15:15:00Z",
          "date": "2025-12-07",
          "time": "16:15",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "sevilla",
          "homeName": "Valencia CF",
          "awayName": "Sevilla FC",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r15_m144",
          "round": 15,
          "kickoffLocal": "2025-12-07T18:30:00+01:00",
          "kickoffUtc": "2025-12-07T17:30:00Z",
          "date": "2025-12-07",
          "time": "18:30",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "rayo",
          "homeName": "RCD Espanyol",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 1,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r15_m146",
          "round": 15,
          "kickoffLocal": "2025-12-07T21:00:00+01:00",
          "kickoffUtc": "2025-12-07T20:00:00Z",
          "date": "2025-12-07",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "celta",
          "homeName": "Real Madrid CF",
          "awayName": "RC Celta",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r15_m148",
          "round": 15,
          "kickoffLocal": "2025-12-08T21:00:00+01:00",
          "kickoffUtc": "2025-12-08T20:00:00Z",
          "date": "2025-12-08",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "levante",
          "homeName": "CA Osasuna",
          "awayName": "Levante UD",
          "score": {
            "home": 2,
            "away": 0
          }
        }
      ]
    },
    {
      "matchday": 16,
      "dateFrom": "2025-12-12",
      "dateTo": "2025-12-15",
      "matches": [
        {
          "matchId": "es_2025_26_r16_m159",
          "round": 16,
          "kickoffLocal": "2025-12-12T21:00:00+01:00",
          "kickoffUtc": "2025-12-12T20:00:00Z",
          "date": "2025-12-12",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "girona",
          "homeName": "Real Sociedad",
          "awayName": "Girona FC",
          "score": {
            "home": 1,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r16_m152",
          "round": 16,
          "kickoffLocal": "2025-12-13T14:00:00+01:00",
          "kickoffUtc": "2025-12-13T13:00:00Z",
          "date": "2025-12-13",
          "time": "14:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "valencia",
          "homeName": "Atlético de Madrid",
          "awayName": "Valencia CF",
          "score": {
            "home": 2,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r16_m157",
          "round": 16,
          "kickoffLocal": "2025-12-13T16:15:00+01:00",
          "kickoffUtc": "2025-12-13T15:15:00Z",
          "date": "2025-12-13",
          "time": "16:15",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "elche",
          "homeName": "RCD Mallorca",
          "awayName": "Elche CF",
          "score": {
            "home": 3,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r16_m153",
          "round": 16,
          "kickoffLocal": "2025-12-13T18:30:00+01:00",
          "kickoffUtc": "2025-12-13T17:30:00Z",
          "date": "2025-12-13",
          "time": "18:30",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "osasuna",
          "homeName": "FC Barcelona",
          "awayName": "CA Osasuna",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r16_m158",
          "round": 16,
          "kickoffLocal": "2025-12-13T21:00:00+01:00",
          "kickoffUtc": "2025-12-13T20:00:00Z",
          "date": "2025-12-13",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "espanyol",
          "homeName": "Getafe CF",
          "awayName": "RCD Espanyol",
          "score": {
            "home": 0,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r16_m160",
          "round": 16,
          "kickoffLocal": "2025-12-14T14:00:00+01:00",
          "kickoffUtc": "2025-12-14T13:00:00Z",
          "date": "2025-12-14",
          "time": "14:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "realoviedo",
          "homeName": "Sevilla FC",
          "awayName": "Real Oviedo",
          "score": {
            "home": 4,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r16_m155",
          "round": 16,
          "kickoffLocal": "2025-12-14T16:15:00+01:00",
          "kickoffUtc": "2025-12-14T15:15:00Z",
          "date": "2025-12-14",
          "time": "16:15",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "athletic",
          "homeName": "RC Celta",
          "awayName": "Athletic Club",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r16_m154",
          "round": 16,
          "kickoffLocal": "2025-12-14T18:30:00+01:00",
          "kickoffUtc": "2025-12-14T17:30:00Z",
          "date": "2025-12-14",
          "time": "18:30",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "villarreal",
          "homeName": "Levante UD",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r16_m151",
          "round": 16,
          "kickoffLocal": "2025-12-14T21:00:00+01:00",
          "kickoffUtc": "2025-12-14T20:00:00Z",
          "date": "2025-12-14",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "realmadrid",
          "homeName": "Deportivo Alavés",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 1,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r16_m156",
          "round": 16,
          "kickoffLocal": "2025-12-15T21:00:00+01:00",
          "kickoffUtc": "2025-12-15T20:00:00Z",
          "date": "2025-12-15",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "betis",
          "homeName": "Rayo Vallecano",
          "awayName": "Real Betis",
          "score": {
            "home": 0,
            "away": 0
          }
        }
      ]
    },
    {
      "matchday": 17,
      "dateFrom": "2025-12-19",
      "dateTo": "2025-12-22",
      "matches": [
        {
          "matchId": "es_2025_26_r17_m170",
          "round": 17,
          "kickoffLocal": "2025-12-19T21:00:00+01:00",
          "kickoffUtc": "2025-12-19T20:00:00Z",
          "date": "2025-12-19",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "mallorca",
          "homeName": "Valencia CF",
          "awayName": "RCD Mallorca",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r17_m169",
          "round": 17,
          "kickoffLocal": "2025-12-20T14:00:00+01:00",
          "kickoffUtc": "2025-12-20T13:00:00Z",
          "date": "2025-12-20",
          "time": "14:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "celta",
          "homeName": "Real Oviedo",
          "awayName": "RC Celta",
          "score": {
            "home": 0,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r17_m164",
          "round": 17,
          "kickoffLocal": "2025-12-20T16:15:00+01:00",
          "kickoffUtc": "2025-12-20T15:15:00Z",
          "date": "2025-12-20",
          "time": "16:15",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "realsociedad",
          "homeName": "Levante UD",
          "awayName": "Real Sociedad",
          "score": {
            "home": 1,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r17_m166",
          "round": 17,
          "kickoffLocal": "2025-12-20T18:30:00+01:00",
          "kickoffUtc": "2025-12-20T17:30:00Z",
          "date": "2025-12-20",
          "time": "18:30",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "alaves",
          "homeName": "CA Osasuna",
          "awayName": "Deportivo Alavés",
          "score": {
            "home": 3,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r17_m165",
          "round": 17,
          "kickoffLocal": "2025-12-20T21:00:00+01:00",
          "kickoffUtc": "2025-12-20T20:00:00Z",
          "date": "2025-12-20",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "sevilla",
          "homeName": "Real Madrid CF",
          "awayName": "Sevilla FC",
          "score": {
            "home": 2,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r17_m167",
          "round": 17,
          "kickoffLocal": "2025-12-21T14:00:00+01:00",
          "kickoffUtc": "2025-12-21T13:00:00Z",
          "date": "2025-12-21",
          "time": "14:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "atletico",
          "homeName": "Girona FC",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 0,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r17_m168",
          "round": 17,
          "kickoffLocal": "2025-12-21T16:15:00+01:00",
          "kickoffUtc": "2025-12-21T15:15:00Z",
          "date": "2025-12-21",
          "time": "16:15",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "barcelona",
          "homeName": "Villarreal CF",
          "awayName": "FC Barcelona",
          "score": {
            "home": 0,
            "away": 2
          }
        },
        {
          "matchId": "es_2025_26_r17_m163",
          "round": 17,
          "kickoffLocal": "2025-12-21T18:30:00+01:00",
          "kickoffUtc": "2025-12-21T17:30:00Z",
          "date": "2025-12-21",
          "time": "18:30",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "rayo",
          "homeName": "Elche CF",
          "awayName": "Rayo Vallecano",
          "score": {
            "home": 4,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r17_m162",
          "round": 17,
          "kickoffLocal": "2025-12-21T21:00:00+01:00",
          "kickoffUtc": "2025-12-21T20:00:00Z",
          "date": "2025-12-21",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "getafe",
          "homeName": "Real Betis",
          "awayName": "Getafe CF",
          "score": {
            "home": 4,
            "away": 0
          }
        },
        {
          "matchId": "es_2025_26_r17_m161",
          "round": 17,
          "kickoffLocal": "2025-12-22T21:00:00+01:00",
          "kickoffUtc": "2025-12-22T20:00:00Z",
          "date": "2025-12-22",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "espanyol",
          "homeName": "Athletic Club",
          "awayName": "RCD Espanyol",
          "score": {
            "home": 1,
            "away": 2
          }
        }
      ]
    },
    {
      "matchday": 18,
      "dateFrom": "2026-01-02",
      "dateTo": "2026-01-04",
      "matches": [
        {
          "matchId": "es_2025_26_r18_m178",
          "round": 18,
          "kickoffLocal": "2026-01-02T21:00:00+01:00",
          "kickoffUtc": "2026-01-02T20:00:00Z",
          "date": "2026-01-02",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "getafe",
          "homeName": "Rayo Vallecano",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m172",
          "round": 18,
          "kickoffLocal": "2026-01-03T14:00:00+01:00",
          "kickoffUtc": "2026-01-03T13:00:00Z",
          "date": "2026-01-03",
          "time": "14:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "valencia",
          "homeName": "RC Celta",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m174",
          "round": 18,
          "kickoffLocal": "2026-01-03T16:15:00+01:00",
          "kickoffUtc": "2026-01-03T15:15:00Z",
          "date": "2026-01-03",
          "time": "16:15",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "athletic",
          "homeName": "CA Osasuna",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m173",
          "round": 18,
          "kickoffLocal": "2026-01-03T18:30:00+01:00",
          "kickoffUtc": "2026-01-03T17:30:00Z",
          "date": "2026-01-03",
          "time": "18:30",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "villarreal",
          "homeName": "Elche CF",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m176",
          "round": 18,
          "kickoffLocal": "2026-01-03T21:00:00+01:00",
          "kickoffUtc": "2026-01-03T20:00:00Z",
          "date": "2026-01-03",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "barcelona",
          "homeName": "RCD Espanyol",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m180",
          "round": 18,
          "kickoffLocal": "2026-01-04T14:00:00+01:00",
          "kickoffUtc": "2026-01-04T13:00:00Z",
          "date": "2026-01-04",
          "time": "14:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "levante",
          "homeName": "Sevilla FC",
          "awayName": "Levante UD",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m177",
          "round": 18,
          "kickoffLocal": "2026-01-04T16:15:00+01:00",
          "kickoffUtc": "2026-01-04T15:15:00Z",
          "date": "2026-01-04",
          "time": "16:15",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "betis",
          "homeName": "Real Madrid CF",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m171",
          "round": 18,
          "kickoffLocal": "2026-01-04T18:30:00+01:00",
          "kickoffUtc": "2026-01-04T17:30:00Z",
          "date": "2026-01-04",
          "time": "18:30",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "realoviedo",
          "homeName": "Deportivo Alavés",
          "awayName": "Real Oviedo",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m179",
          "round": 18,
          "kickoffLocal": "2026-01-04T18:30:00+01:00",
          "kickoffUtc": "2026-01-04T17:30:00Z",
          "date": "2026-01-04",
          "time": "18:30",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "girona",
          "homeName": "RCD Mallorca",
          "awayName": "Girona FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r18_m175",
          "round": 18,
          "kickoffLocal": "2026-01-04T21:00:00+01:00",
          "kickoffUtc": "2026-01-04T20:00:00Z",
          "date": "2026-01-04",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "atletico",
          "homeName": "Real Sociedad",
          "awayName": "Atlético de Madrid",
          "score": null
        }
      ]
    },
    {
      "matchday": 19,
      "dateFrom": "2025-12-02",
      "dateTo": "2026-01-12",
      "matches": [
        {
          "matchId": "es_2025_26_r19_m185",
          "round": 19,
          "kickoffLocal": "2025-12-02T21:00:00+01:00",
          "kickoffUtc": "2025-12-02T20:00:00Z",
          "date": "2025-12-02",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "atletico",
          "homeName": "FC Barcelona",
          "awayName": "Atlético de Madrid",
          "score": {
            "home": 3,
            "away": 1
          }
        },
        {
          "matchId": "es_2025_26_r19_m181",
          "round": 19,
          "kickoffLocal": "2025-12-03T19:00:00+01:00",
          "kickoffUtc": "2025-12-03T18:00:00Z",
          "date": "2025-12-03",
          "time": "19:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "realmadrid",
          "homeName": "Athletic Club",
          "awayName": "Real Madrid CF",
          "score": {
            "home": 0,
            "away": 3
          }
        },
        {
          "matchId": "es_2025_26_r19_m182",
          "round": 19,
          "kickoffLocal": "2026-01-09T21:00:00+01:00",
          "kickoffUtc": "2026-01-09T20:00:00Z",
          "date": "2026-01-09",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "realsociedad",
          "homeName": "Getafe CF",
          "awayName": "Real Sociedad",
          "score": null
        },
        {
          "matchId": "es_2025_26_r19_m186",
          "round": 19,
          "kickoffLocal": "2026-01-10T14:00:00+01:00",
          "kickoffUtc": "2026-01-10T13:00:00Z",
          "date": "2026-01-10",
          "time": "14:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "betis",
          "homeName": "Real Oviedo",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r19_m184",
          "round": 19,
          "kickoffLocal": "2026-01-10T16:15:00+01:00",
          "kickoffUtc": "2026-01-10T15:15:00Z",
          "date": "2026-01-10",
          "time": "16:15",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "alaves",
          "homeName": "Villarreal CF",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r19_m183",
          "round": 19,
          "kickoffLocal": "2026-01-10T18:30:00+01:00",
          "kickoffUtc": "2026-01-10T17:30:00Z",
          "date": "2026-01-10",
          "time": "18:30",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "osasuna",
          "homeName": "Girona FC",
          "awayName": "CA Osasuna",
          "score": null
        },
        {
          "matchId": "es_2025_26_r19_m188",
          "round": 19,
          "kickoffLocal": "2026-01-10T21:00:00+01:00",
          "kickoffUtc": "2026-01-10T20:00:00Z",
          "date": "2026-01-10",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "elche",
          "homeName": "Valencia CF",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r19_m190",
          "round": 19,
          "kickoffLocal": "2026-01-11T14:00:00+01:00",
          "kickoffUtc": "2026-01-11T13:00:00Z",
          "date": "2026-01-11",
          "time": "14:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "mallorca",
          "homeName": "Rayo Vallecano",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r19_m189",
          "round": 19,
          "kickoffLocal": "2026-01-11T16:15:00+01:00",
          "kickoffUtc": "2026-01-11T15:15:00Z",
          "date": "2026-01-11",
          "time": "16:15",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "espanyol",
          "homeName": "Levante UD",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r19_m187",
          "round": 19,
          "kickoffLocal": "2026-01-12T21:00:00+01:00",
          "kickoffUtc": "2026-01-12T20:00:00Z",
          "date": "2026-01-12",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "celta",
          "homeName": "Sevilla FC",
          "awayName": "RC Celta",
          "score": null
        }
      ]
    },
    {
      "matchday": 20,
      "dateFrom": "2026-01-18",
      "dateTo": "2026-01-18",
      "matches": [
        {
          "matchId": "es_2025_26_r20_m191",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "villarreal",
          "homeName": "Real Betis",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m192",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "rayo",
          "homeName": "RC Celta",
          "awayName": "Rayo Vallecano",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m193",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "sevilla",
          "homeName": "Elche CF",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m194",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "girona",
          "homeName": "RCD Espanyol",
          "awayName": "Girona FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m195",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "valencia",
          "homeName": "Getafe CF",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m196",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "realoviedo",
          "homeName": "CA Osasuna",
          "awayName": "Real Oviedo",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m197",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "alaves",
          "homeName": "Atlético de Madrid",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m198",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "athletic",
          "homeName": "RCD Mallorca",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m199",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "barcelona",
          "homeName": "Real Sociedad",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r20_m200",
          "round": 20,
          "kickoffLocal": "2026-01-18T21:00:00+01:00",
          "kickoffUtc": "2026-01-18T20:00:00Z",
          "date": "2026-01-18",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "levante",
          "homeName": "Real Madrid CF",
          "awayName": "Levante UD",
          "score": null
        }
      ]
    },
    {
      "matchday": 21,
      "dateFrom": "2026-01-25",
      "dateTo": "2026-01-25",
      "matches": [
        {
          "matchId": "es_2025_26_r21_m201",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "betis",
          "homeName": "Deportivo Alavés",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m202",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "mallorca",
          "homeName": "Atlético de Madrid",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m203",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "realoviedo",
          "homeName": "FC Barcelona",
          "awayName": "Real Oviedo",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m204",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "athletic",
          "homeName": "Sevilla FC",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m205",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "celta",
          "homeName": "Real Sociedad",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m206",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "elche",
          "homeName": "Levante UD",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m207",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "espanyol",
          "homeName": "Valencia CF",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m208",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "getafe",
          "homeName": "Girona FC",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m209",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "osasuna",
          "homeName": "Rayo Vallecano",
          "awayName": "CA Osasuna",
          "score": null
        },
        {
          "matchId": "es_2025_26_r21_m210",
          "round": 21,
          "kickoffLocal": "2026-01-25T21:00:00+01:00",
          "kickoffUtc": "2026-01-25T20:00:00Z",
          "date": "2026-01-25",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "realmadrid",
          "homeName": "Villarreal CF",
          "awayName": "Real Madrid CF",
          "score": null
        }
      ]
    },
    {
      "matchday": 22,
      "dateFrom": "2026-02-01",
      "dateTo": "2026-02-01",
      "matches": [
        {
          "matchId": "es_2025_26_r22_m211",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "realsociedad",
          "homeName": "Athletic Club",
          "awayName": "Real Sociedad",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m212",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "valencia",
          "homeName": "Real Betis",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m213",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "sevilla",
          "homeName": "RCD Mallorca",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m214",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "villarreal",
          "homeName": "CA Osasuna",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m215",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "alaves",
          "homeName": "RCD Espanyol",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m216",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "atletico",
          "homeName": "Levante UD",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m217",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "barcelona",
          "homeName": "Elche CF",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m218",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "celta",
          "homeName": "Getafe CF",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m219",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "girona",
          "homeName": "Real Oviedo",
          "awayName": "Girona FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r22_m220",
          "round": 22,
          "kickoffLocal": "2026-02-01T21:00:00+01:00",
          "kickoffUtc": "2026-02-01T20:00:00Z",
          "date": "2026-02-01",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "rayo",
          "homeName": "Real Madrid CF",
          "awayName": "Rayo Vallecano",
          "score": null
        }
      ]
    },
    {
      "matchday": 23,
      "dateFrom": "2026-02-08",
      "dateTo": "2026-02-08",
      "matches": [
        {
          "matchId": "es_2025_26_r23_m221",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "getafe",
          "homeName": "Deportivo Alavés",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m222",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "levante",
          "homeName": "Athletic Club",
          "awayName": "Levante UD",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m223",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "betis",
          "homeName": "Atlético de Madrid",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m224",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "mallorca",
          "homeName": "FC Barcelona",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m225",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "osasuna",
          "homeName": "RC Celta",
          "awayName": "CA Osasuna",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m226",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "elche",
          "homeName": "Real Sociedad",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m227",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "espanyol",
          "homeName": "Villarreal CF",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m228",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "girona",
          "homeName": "Sevilla FC",
          "awayName": "Girona FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m229",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "realmadrid",
          "homeName": "Valencia CF",
          "awayName": "Real Madrid CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r23_m230",
          "round": 23,
          "kickoffLocal": "2026-02-08T21:00:00+01:00",
          "kickoffUtc": "2026-02-08T20:00:00Z",
          "date": "2026-02-08",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "realoviedo",
          "homeName": "Rayo Vallecano",
          "awayName": "Real Oviedo",
          "score": null
        }
      ]
    },
    {
      "matchday": 24,
      "dateFrom": "2026-02-15",
      "dateTo": "2026-02-15",
      "matches": [
        {
          "matchId": "es_2025_26_r24_m231",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "osasuna",
          "homeName": "Elche CF",
          "awayName": "CA Osasuna",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m232",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "villarreal",
          "homeName": "Getafe CF",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m233",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "valencia",
          "homeName": "Levante UD",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m234",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "realsociedad",
          "homeName": "Real Madrid CF",
          "awayName": "Real Sociedad",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m235",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "alaves",
          "homeName": "Sevilla FC",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m236",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "athletic",
          "homeName": "Real Oviedo",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m237",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "atletico",
          "homeName": "Rayo Vallecano",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m238",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "barcelona",
          "homeName": "Girona FC",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m239",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "betis",
          "homeName": "RCD Mallorca",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r24_m240",
          "round": 24,
          "kickoffLocal": "2026-02-15T21:00:00+01:00",
          "kickoffUtc": "2026-02-15T20:00:00Z",
          "date": "2026-02-15",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "celta",
          "homeName": "RCD Espanyol",
          "awayName": "RC Celta",
          "score": null
        }
      ]
    },
    {
      "matchday": 25,
      "dateFrom": "2026-02-22",
      "dateTo": "2026-02-22",
      "matches": [
        {
          "matchId": "es_2025_26_r25_m241",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "girona",
          "homeName": "Deportivo Alavés",
          "awayName": "Girona FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m242",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "elche",
          "homeName": "Athletic Club",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m243",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "espanyol",
          "homeName": "Atlético de Madrid",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m244",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "levante",
          "homeName": "FC Barcelona",
          "awayName": "Levante UD",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m245",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "rayo",
          "homeName": "Real Betis",
          "awayName": "Rayo Vallecano",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m246",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "mallorca",
          "homeName": "RC Celta",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m247",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "sevilla",
          "homeName": "Getafe CF",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m248",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "realmadrid",
          "homeName": "CA Osasuna",
          "awayName": "Real Madrid CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m249",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "valencia",
          "homeName": "Villarreal CF",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r25_m250",
          "round": 25,
          "kickoffLocal": "2026-02-22T21:00:00+01:00",
          "kickoffUtc": "2026-02-22T20:00:00Z",
          "date": "2026-02-22",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "realoviedo",
          "homeName": "Real Sociedad",
          "awayName": "Real Oviedo",
          "score": null
        }
      ]
    },
    {
      "matchday": 26,
      "dateFrom": "2026-03-01",
      "dateTo": "2026-03-01",
      "matches": [
        {
          "matchId": "es_2025_26_r26_m251",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "villarreal",
          "homeName": "FC Barcelona",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m252",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "sevilla",
          "homeName": "Real Betis",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m253",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "espanyol",
          "homeName": "Elche CF",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m254",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "realsociedad",
          "homeName": "RCD Mallorca",
          "awayName": "Real Sociedad",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m255",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "alaves",
          "homeName": "Levante UD",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m256",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "athletic",
          "homeName": "Rayo Vallecano",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m257",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "atletico",
          "homeName": "Real Oviedo",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m258",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "celta",
          "homeName": "Girona FC",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m259",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "getafe",
          "homeName": "Real Madrid CF",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r26_m260",
          "round": 26,
          "kickoffLocal": "2026-03-01T21:00:00+01:00",
          "kickoffUtc": "2026-03-01T20:00:00Z",
          "date": "2026-03-01",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "osasuna",
          "homeName": "Valencia CF",
          "awayName": "CA Osasuna",
          "score": null
        }
      ]
    },
    {
      "matchday": 27,
      "dateFrom": "2026-03-08",
      "dateTo": "2026-03-08",
      "matches": [
        {
          "matchId": "es_2025_26_r27_m261",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "barcelona",
          "homeName": "Athletic Club",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m262",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "realsociedad",
          "homeName": "Atlético de Madrid",
          "awayName": "Real Sociedad",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m263",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "realmadrid",
          "homeName": "RC Celta",
          "awayName": "Real Madrid CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m264",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "realoviedo",
          "homeName": "RCD Espanyol",
          "awayName": "Real Oviedo",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m265",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "alaves",
          "homeName": "Valencia CF",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m266",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "betis",
          "homeName": "Getafe CF",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m267",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "elche",
          "homeName": "Villarreal CF",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m268",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "girona",
          "homeName": "Levante UD",
          "awayName": "Girona FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m269",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "mallorca",
          "homeName": "CA Osasuna",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r27_m270",
          "round": 27,
          "kickoffLocal": "2026-03-08T21:00:00+01:00",
          "kickoffUtc": "2026-03-08T20:00:00Z",
          "date": "2026-03-08",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "rayo",
          "homeName": "Sevilla FC",
          "awayName": "Rayo Vallecano",
          "score": null
        }
      ]
    },
    {
      "matchday": 28,
      "dateFrom": "2026-03-15",
      "dateTo": "2026-03-15",
      "matches": [
        {
          "matchId": "es_2025_26_r28_m271",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "villarreal",
          "homeName": "Deportivo Alavés",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m272",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "getafe",
          "homeName": "Atlético de Madrid",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m273",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "sevilla",
          "homeName": "FC Barcelona",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m274",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "celta",
          "homeName": "Real Betis",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m275",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "valencia",
          "homeName": "Real Oviedo",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m276",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "athletic",
          "homeName": "Girona FC",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m277",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "elche",
          "homeName": "Real Madrid CF",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m278",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "espanyol",
          "homeName": "RCD Mallorca",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m279",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "levante",
          "homeName": "Rayo Vallecano",
          "awayName": "Levante UD",
          "score": null
        },
        {
          "matchId": "es_2025_26_r28_m280",
          "round": 28,
          "kickoffLocal": "2026-03-15T21:00:00+01:00",
          "kickoffUtc": "2026-03-15T20:00:00Z",
          "date": "2026-03-15",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "osasuna",
          "homeName": "Real Sociedad",
          "awayName": "CA Osasuna",
          "score": null
        }
      ]
    },
    {
      "matchday": 29,
      "dateFrom": "2026-03-22",
      "dateTo": "2026-03-22",
      "matches": [
        {
          "matchId": "es_2025_26_r29_m281",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "betis",
          "homeName": "Athletic Club",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m282",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "rayo",
          "homeName": "FC Barcelona",
          "awayName": "Rayo Vallecano",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m283",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "mallorca",
          "homeName": "Elche CF",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m284",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "getafe",
          "homeName": "RCD Espanyol",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m285",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "realoviedo",
          "homeName": "Levante UD",
          "awayName": "Real Oviedo",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m286",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "valencia",
          "homeName": "Sevilla FC",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m287",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "alaves",
          "homeName": "RC Celta",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m288",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "atletico",
          "homeName": "Real Madrid CF",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m289",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "girona",
          "homeName": "CA Osasuna",
          "awayName": "Girona FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r29_m290",
          "round": 29,
          "kickoffLocal": "2026-03-22T21:00:00+01:00",
          "kickoffUtc": "2026-03-22T20:00:00Z",
          "date": "2026-03-22",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "realsociedad",
          "homeName": "Villarreal CF",
          "awayName": "Real Sociedad",
          "score": null
        }
      ]
    },
    {
      "matchday": 30,
      "dateFrom": "2026-04-05",
      "dateTo": "2026-04-05",
      "matches": [
        {
          "matchId": "es_2025_26_r30_m291",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "osasuna",
          "homeName": "Deportivo Alavés",
          "awayName": "CA Osasuna",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m292",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "barcelona",
          "homeName": "Atlético de Madrid",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m293",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "espanyol",
          "homeName": "Real Betis",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m294",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "villarreal",
          "homeName": "Girona FC",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m295",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "realmadrid",
          "homeName": "RCD Mallorca",
          "awayName": "Real Madrid CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m296",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "sevilla",
          "homeName": "Real Oviedo",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m297",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "athletic",
          "homeName": "Getafe CF",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m298",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "celta",
          "homeName": "Valencia CF",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m299",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "elche",
          "homeName": "Rayo Vallecano",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r30_m300",
          "round": 30,
          "kickoffLocal": "2026-04-05T21:00:00+02:00",
          "kickoffUtc": "2026-04-05T19:00:00Z",
          "date": "2026-04-05",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "levante",
          "homeName": "Real Sociedad",
          "awayName": "Levante UD",
          "score": null
        }
      ]
    },
    {
      "matchday": 31,
      "dateFrom": "2026-04-12",
      "dateTo": "2026-04-12",
      "matches": [
        {
          "matchId": "es_2025_26_r31_m301",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "villarreal",
          "homeName": "Athletic Club",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m302",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "espanyol",
          "homeName": "FC Barcelona",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m303",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "realoviedo",
          "homeName": "RC Celta",
          "awayName": "Real Oviedo",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m304",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "valencia",
          "homeName": "Elche CF",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m305",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "rayo",
          "homeName": "RCD Mallorca",
          "awayName": "Rayo Vallecano",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m306",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "alaves",
          "homeName": "Real Sociedad",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m307",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "atletico",
          "homeName": "Sevilla FC",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m308",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "betis",
          "homeName": "CA Osasuna",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m309",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "getafe",
          "homeName": "Levante UD",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r31_m310",
          "round": 31,
          "kickoffLocal": "2026-04-12T21:00:00+02:00",
          "kickoffUtc": "2026-04-12T19:00:00Z",
          "date": "2026-04-12",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "girona",
          "homeName": "Real Madrid CF",
          "awayName": "Girona FC",
          "score": null
        }
      ]
    },
    {
      "matchday": 32,
      "dateFrom": "2026-04-19",
      "dateTo": "2026-04-19",
      "matches": [
        {
          "matchId": "es_2025_26_r32_m311",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "mallorca",
          "homeName": "Deportivo Alavés",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m312",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "realmadrid",
          "homeName": "Real Betis",
          "awayName": "Real Madrid CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m313",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "levante",
          "homeName": "RCD Espanyol",
          "awayName": "Levante UD",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m314",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "sevilla",
          "homeName": "CA Osasuna",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m315",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "realsociedad",
          "homeName": "Rayo Vallecano",
          "awayName": "Real Sociedad",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m316",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "athletic",
          "homeName": "Atlético de Madrid",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m317",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "barcelona",
          "homeName": "Getafe CF",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m318",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "celta",
          "homeName": "Villarreal CF",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m319",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "elche",
          "homeName": "Real Oviedo",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r32_m320",
          "round": 32,
          "kickoffLocal": "2026-04-19T21:00:00+02:00",
          "kickoffUtc": "2026-04-19T19:00:00Z",
          "date": "2026-04-19",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "girona",
          "homeName": "Valencia CF",
          "awayName": "Girona FC",
          "score": null
        }
      ]
    },
    {
      "matchday": 33,
      "dateFrom": "2026-04-22",
      "dateTo": "2026-04-22",
      "matches": [
        {
          "matchId": "es_2025_26_r33_m321",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "osasuna",
          "homeName": "Athletic Club",
          "awayName": "CA Osasuna",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m322",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "celta",
          "homeName": "FC Barcelona",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m323",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "sevilla",
          "homeName": "Levante UD",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m324",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "valencia",
          "homeName": "RCD Mallorca",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m325",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "villarreal",
          "homeName": "Real Oviedo",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m326",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "alaves",
          "homeName": "Real Madrid CF",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m327",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "atletico",
          "homeName": "Elche CF",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m328",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "betis",
          "homeName": "Girona FC",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m329",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "espanyol",
          "homeName": "Rayo Vallecano",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r33_m330",
          "round": 33,
          "kickoffLocal": "2026-04-22T21:00:00+02:00",
          "kickoffUtc": "2026-04-22T19:00:00Z",
          "date": "2026-04-22",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "getafe",
          "homeName": "Real Sociedad",
          "awayName": "Getafe CF",
          "score": null
        }
      ]
    },
    {
      "matchday": 34,
      "dateFrom": "2026-05-03",
      "dateTo": "2026-05-03",
      "matches": [
        {
          "matchId": "es_2025_26_r34_m331",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "athletic",
          "homeName": "Deportivo Alavés",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m332",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "realoviedo",
          "homeName": "Real Betis",
          "awayName": "Real Oviedo",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m333",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "elche",
          "homeName": "RC Celta",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m334",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "realmadrid",
          "homeName": "RCD Espanyol",
          "awayName": "Real Madrid CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m335",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "rayo",
          "homeName": "Getafe CF",
          "awayName": "Rayo Vallecano",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m336",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "mallorca",
          "homeName": "Girona FC",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m337",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "atletico",
          "homeName": "Valencia CF",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m338",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "barcelona",
          "homeName": "CA Osasuna",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m339",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "levante",
          "homeName": "Villarreal CF",
          "awayName": "Levante UD",
          "score": null
        },
        {
          "matchId": "es_2025_26_r34_m340",
          "round": 34,
          "kickoffLocal": "2026-05-03T21:00:00+02:00",
          "kickoffUtc": "2026-05-03T19:00:00Z",
          "date": "2026-05-03",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "realsociedad",
          "homeName": "Sevilla FC",
          "awayName": "Real Sociedad",
          "score": null
        }
      ]
    },
    {
      "matchday": 35,
      "dateFrom": "2026-05-10",
      "dateTo": "2026-05-10",
      "matches": [
        {
          "matchId": "es_2025_26_r35_m341",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "valencia",
          "homeName": "Athletic Club",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m342",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "celta",
          "homeName": "Atlético de Madrid",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m343",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "realmadrid",
          "homeName": "FC Barcelona",
          "awayName": "Real Madrid CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m344",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "osasuna",
          "homeName": "Levante UD",
          "awayName": "CA Osasuna",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m345",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "villarreal",
          "homeName": "RCD Mallorca",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m346",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "alaves",
          "homeName": "Elche CF",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m347",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "betis",
          "homeName": "Real Sociedad",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m348",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "espanyol",
          "homeName": "Sevilla FC",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m349",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "getafe",
          "homeName": "Real Oviedo",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r35_m350",
          "round": 35,
          "kickoffLocal": "2026-05-10T21:00:00+02:00",
          "kickoffUtc": "2026-05-10T19:00:00Z",
          "date": "2026-05-10",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "girona",
          "homeName": "Rayo Vallecano",
          "awayName": "Girona FC",
          "score": null
        }
      ]
    },
    {
      "matchday": 36,
      "dateFrom": "2026-05-13",
      "dateTo": "2026-05-13",
      "matches": [
        {
          "matchId": "es_2025_26_r36_m351",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "barcelona",
          "homeName": "Deportivo Alavés",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m352",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "elche",
          "homeName": "Real Betis",
          "awayName": "Elche CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m353",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "levante",
          "homeName": "RC Celta",
          "awayName": "Levante UD",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m354",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "mallorca",
          "homeName": "Getafe CF",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m355",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "realsociedad",
          "homeName": "Girona FC",
          "awayName": "Real Sociedad",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m356",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "athletic",
          "homeName": "RCD Espanyol",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m357",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "atletico",
          "homeName": "CA Osasuna",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m358",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "rayo",
          "homeName": "Valencia CF",
          "awayName": "Rayo Vallecano",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m359",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "sevilla",
          "homeName": "Villarreal CF",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r36_m360",
          "round": 36,
          "kickoffLocal": "2026-05-13T21:00:00+02:00",
          "kickoffUtc": "2026-05-13T19:00:00Z",
          "date": "2026-05-13",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "realoviedo",
          "homeName": "Real Madrid CF",
          "awayName": "Real Oviedo",
          "score": null
        }
      ]
    },
    {
      "matchday": 37,
      "dateFrom": "2026-05-17",
      "dateTo": "2026-05-17",
      "matches": [
        {
          "matchId": "es_2025_26_r37_m361",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "San Mamés",
          "homeId": "athletic",
          "awayId": "celta",
          "homeName": "Athletic Club",
          "awayName": "RC Celta",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m362",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "Metropolitano",
          "homeId": "atletico",
          "awayId": "girona",
          "homeName": "Atlético de Madrid",
          "awayName": "Girona FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m363",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "Camp Nou",
          "homeId": "barcelona",
          "awayId": "betis",
          "homeName": "FC Barcelona",
          "awayName": "Real Betis",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m364",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "Estadio Martínez Valero",
          "homeId": "elche",
          "awayId": "getafe",
          "homeName": "Elche CF",
          "awayName": "Getafe CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m365",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "Ciutat de València",
          "homeId": "levante",
          "awayId": "mallorca",
          "homeName": "Levante UD",
          "awayName": "RCD Mallorca",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m366",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "Vallecas",
          "homeId": "rayo",
          "awayId": "villarreal",
          "homeName": "Rayo Vallecano",
          "awayName": "Villarreal CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m367",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "Reale Arena",
          "homeId": "realsociedad",
          "awayId": "valencia",
          "homeName": "Real Sociedad",
          "awayName": "Valencia CF",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m368",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "Carlos Tartiere",
          "homeId": "realoviedo",
          "awayId": "alaves",
          "homeName": "Real Oviedo",
          "awayName": "Deportivo Alavés",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m369",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "El Sadar",
          "homeId": "osasuna",
          "awayId": "espanyol",
          "homeName": "CA Osasuna",
          "awayName": "RCD Espanyol",
          "score": null
        },
        {
          "matchId": "es_2025_26_r37_m370",
          "round": 37,
          "kickoffLocal": "2026-05-17T21:00:00+02:00",
          "kickoffUtc": "2026-05-17T19:00:00Z",
          "date": "2026-05-17",
          "time": "21:00",
          "stadium": "Ramón Sánchez-Pizjuán",
          "homeId": "sevilla",
          "awayId": "realmadrid",
          "homeName": "Sevilla FC",
          "awayName": "Real Madrid CF",
          "score": null
        }
      ]
    },
    {
      "matchday": 38,
      "dateFrom": "2026-05-24",
      "dateTo": "2026-05-24",
      "matches": [
        {
          "matchId": "es_2025_26_r38_m371",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "Mendizorrotza",
          "homeId": "alaves",
          "awayId": "rayo",
          "homeName": "Deportivo Alavés",
          "awayName": "Rayo Vallecano",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m372",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "Benito Villamarín",
          "homeId": "betis",
          "awayId": "levante",
          "homeName": "Real Betis",
          "awayName": "Levante UD",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m373",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "Balaídos",
          "homeId": "celta",
          "awayId": "sevilla",
          "homeName": "RC Celta",
          "awayName": "Sevilla FC",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m374",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "RCDE Stadium",
          "homeId": "espanyol",
          "awayId": "realsociedad",
          "homeName": "RCD Espanyol",
          "awayName": "Real Sociedad",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m375",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "Coliseum",
          "homeId": "getafe",
          "awayId": "osasuna",
          "homeName": "Getafe CF",
          "awayName": "CA Osasuna",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m376",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "Son Moix",
          "homeId": "mallorca",
          "awayId": "realoviedo",
          "homeName": "RCD Mallorca",
          "awayName": "Real Oviedo",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m377",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "Santiago Bernabéu",
          "homeId": "realmadrid",
          "awayId": "athletic",
          "homeName": "Real Madrid CF",
          "awayName": "Athletic Club",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m378",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "La Cerámica",
          "homeId": "villarreal",
          "awayId": "atletico",
          "homeName": "Villarreal CF",
          "awayName": "Atlético de Madrid",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m379",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "Mestalla",
          "homeId": "valencia",
          "awayId": "barcelona",
          "homeName": "Valencia CF",
          "awayName": "FC Barcelona",
          "score": null
        },
        {
          "matchId": "es_2025_26_r38_m380",
          "round": 38,
          "kickoffLocal": "2026-05-24T21:00:00+02:00",
          "kickoffUtc": "2026-05-24T19:00:00Z",
          "date": "2026-05-24",
          "time": "21:00",
          "stadium": "Montilivi",
          "homeId": "girona",
          "awayId": "elche",
          "homeName": "Girona FC",
          "awayName": "Elche CF",
          "score": null
        }
      ]
    }
  ],
  "teamNameToId": {
    "Athletic Club": "athletic",
    "Atlético de Madrid": "atletico",
    "CA Osasuna": "osasuna",
    "Celta": "celta",
    "Deportivo Alavés": "alaves",
    "Elche CF": "elche",
    "FC Barcelona": "barcelona",
    "Getafe CF": "getafe",
    "Girona FC": "girona",
    "Levante UD": "levante",
    "RCD Espanyol de Barcelona": "espanyol",
    "RCD Mallorca": "mallorca",
    "Rayo Vallecano": "rayo",
    "Real Betis": "betis",
    "Real Madrid": "realmadrid",
    "Real Oviedo": "realoviedo",
    "Real Sociedad": "realsociedad",
    "Sevilla FC": "sevilla",
    "Valencia CF": "valencia",
    "Villarreal CF": "villarreal"
  }
};

export default CALENDAR_ES_LALIGA_2025_26;
