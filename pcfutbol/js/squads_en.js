// js/squads_en.js
// Plantillas "reales" por club de en. Si un club aparece aquí, se usan estos jugadores
// en vez de la generación automática de data.js.
// Los atributos detallados se siguen generando en el motor a partir de overall + posición.

export const realSquads = {

  // =======================
  // ARSENAL FC
  // =======================
  arsenal: [
    // PORTEROS
    {
      id: "ars_raya",
      name: "David Raya",
      shirtNumber: 1,
      position: "GK",
      overall: 87,
      wage: 7000000,
      contractYears: 3, // hasta 2028
      value: 45000000,
      birthDate: "1995-09-15",
      nationality: "España",
      birthPlace: "Barcelona (España)",
      youthClub: "UE Cornellà",
      attributes: {
        technical: {
          passing: 76,
          shooting: 12,
          dribbling: 50,
          tackling: 35
        },
        mental: {
          vision: 82,
          composure: 88,
          workRate: 84,
          leadership: 80
        },
        physical: {
          pace: 60,
          stamina: 78,
          strength: 78
        }
      }
    },
    {
      id: "ars_kepa",
      name: "Kepa Arrizabalaga",
      shirtNumber: 13,
      position: "GK",
      overall: 84,
      wage: 5000000,
      contractYears: 3, // hasta 2028
      value: 12000000,
      birthDate: "1994-10-03",
      nationality: "España",
      birthPlace: "Ondarroa (España)",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 70,
          shooting: 10,
          dribbling: 48,
          tackling: 32
        },
        mental: {
          vision: 78,
          composure: 82,
          workRate: 80,
          leadership: 78
        },
        physical: {
          pace: 58,
          stamina: 76,
          strength: 76
        }
      }
    },

    // DEFENSAS
    {
      id: "ars_saliba",
      name: "William Saliba",
      shirtNumber: 2,
      position: "CB",
      overall: 89,
      wage: 9000000,
      contractYears: 2, // hasta 2027
      value: 80000000,
      birthDate: "2001-03-24",
      nationality: "Francia",
      birthPlace: "Bondy (Francia)",
      youthClub: "AS Saint-Étienne",
      attributes: {
        technical: {
          passing: 82,
          shooting: 55,
          dribbling: 76,
          tackling: 92
        },
        mental: {
          vision: 78,
          composure: 90,
          workRate: 90,
          leadership: 84
        },
        physical: {
          pace: 84,
          stamina: 88,
          strength: 90
        }
      }
    },
    {
      id: "ars_mosquera",
      name: "Cristhian Mosquera",
      shirtNumber: 3,
      position: "CB",
      overall: 82,
      wage: 3000000,
      contractYears: 5, // hasta 2030
      value: 35000000,
      birthDate: "2004-06-27",
      nationality: "España",
      birthPlace: "Alicante (España)",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 45,
          dribbling: 70,
          tackling: 84
        },
        mental: {
          vision: 70,
          composure: 80,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "ars_ben_white",
      name: "Ben White",
      shirtNumber: 4,
      position: "RB",
      overall: 85,
      wage: 7000000,
      contractYears: 3, // hasta 2028
      value: 50000000,
      birthDate: "1997-10-08",
      nationality: "Inglaterra",
      birthPlace: "Poole (Inglaterra)",
      youthClub: "Southampton",
      attributes: {
        technical: {
          passing: 82,
          shooting: 56,
          dribbling: 78,
          tackling: 86
        },
        mental: {
          vision: 78,
          composure: 84,
          workRate: 90,
          leadership: 78
        },
        physical: {
          pace: 82,
          stamina: 88,
          strength: 80
        }
      }
    },
    {
      id: "ars_hincapie",
      name: "Piero Hincapié",
      shirtNumber: 5,
      position: "CB",
      overall: 84,
      wage: 4000000,
      contractYears: 1, // cesión hasta 2026
      value: 40000000,
      birthDate: "2002-01-09",
      nationality: "Ecuador",
      birthPlace: "Esmeraldas (Ecuador)",
      youthClub: "Independiente del Valle",
      attributes: {
        technical: {
          passing: 78,
          shooting: 50,
          dribbling: 74,
          tackling: 86
        },
        mental: {
          vision: 74,
          composure: 82,
          workRate: 88,
          leadership: 76
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "ars_gabriel_magalhaes",
      name: "Gabriel Magalhães",
      shirtNumber: 6,
      position: "CB",
      overall: 87,
      wage: 8000000,
      contractYears: 4, // hasta 2029
      value: 60000000,
      birthDate: "1997-12-19",
      nationality: "Brasil",
      birthPlace: "São Paulo (Brasil)",
      youthClub: "Avaí",
      attributes: {
        technical: {
          passing: 78,
          shooting: 54,
          dribbling: 72,
          tackling: 90
        },
        mental: {
          vision: 74,
          composure: 84,
          workRate: 90,
          leadership: 82
        },
        physical: {
          pace: 82,
          stamina: 86,
          strength: 90
        }
      }
    },
    {
      id: "ars_timber",
      name: "Jurriën Timber",
      shirtNumber: 12,
      position: "RB",
      overall: 86,
      wage: 6000000,
      contractYears: 3, // hasta 2028
      value: 55000000,
      birthDate: "2001-06-17",
      nationality: "Países Bajos",
      birthPlace: "Utrecht (Países Bajos)",
      youthClub: "Ajax",
      attributes: {
        technical: {
          passing: 82,
          shooting: 52,
          dribbling: 82,
          tackling: 88
        },
        mental: {
          vision: 78,
          composure: 84,
          workRate: 92,
          leadership: 78
        },
        physical: {
          pace: 86,
          stamina: 88,
          strength: 80
        }
      }
    },
    {
      id: "ars_calafiori",
      name: "Riccardo Calafiori",
      shirtNumber: 33,
      position: "LB",
      overall: 84,
      wage: 5000000,
      contractYears: 4, // hasta 2029
      value: 55000000,
      birthDate: "2002-05-19",
      nationality: "Italia",
      birthPlace: "Roma (Italia)",
      youthClub: "AS Roma",
      attributes: {
        technical: {
          passing: 80,
          shooting: 60,
          dribbling: 78,
          tackling: 86
        },
        mental: {
          vision: 76,
          composure: 82,
          workRate: 88,
          leadership: 74
        },
        physical: {
          pace: 82,
          stamina: 86,
          strength: 84
        }
      }
    },
    {
      id: "ars_lewis_skelly",
      name: "Myles Lewis-Skelly",
      shirtNumber: 49,
      position: "LB",
      overall: 82,
      wage: 2000000,
      contractYears: 5, // hasta 2030
      value: 40000000,
      birthDate: "2006-09-26",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Arsenal",
      attributes: {
        technical: {
          passing: 78,
          shooting: 60,
          dribbling: 82,
          tackling: 80
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 90,
          leadership: 70
        },
        physical: {
          pace: 86,
          stamina: 88,
          strength: 78
        }
      }
    },

    // MEDIOCENTROS
    {
      id: "ars_odegaard",
      name: "Martin Ødegaard",
      shirtNumber: 8,
      position: "CAM",
      overall: 90,
      wage: 11000000,
      contractYears: 3, // hasta 2028
      value: 100000000,
      birthDate: "1998-12-17",
      nationality: "Noruega",
      birthPlace: "Drammen (Noruega)",
      youthClub: "Drammen Strong",
      attributes: {
        technical: {
          passing: 93,
          shooting: 86,
          dribbling: 90,
          tackling: 60
        },
        mental: {
          vision: 94,
          composure: 88,
          workRate: 88,
          leadership: 90
        },
        physical: {
          pace: 80,
          stamina: 88,
          strength: 72
        }
      }
    },
    {
      id: "ars_eze",
      name: "Eberechi Eze",
      shirtNumber: 10,
      position: "CAM",
      overall: 87,
      wage: 9000000,
      contractYears: 4, // hasta 2029
      value: 70000000,
      birthDate: "1998-06-29",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Millwall",
      attributes: {
        technical: {
          passing: 86,
          shooting: 84,
          dribbling: 90,
          tackling: 56
        },
        mental: {
          vision: 86,
          composure: 86,
          workRate: 82,
          leadership: 74
        },
        physical: {
          pace: 84,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "ars_norgaard",
      name: "Christian Nørgaard",
      shirtNumber: 16,
      position: "CDM",
      overall: 84,
      wage: 6000000,
      contractYears: 2, // hasta 2027
      value: 35000000,
      birthDate: "1994-03-10",
      nationality: "Dinamarca",
      birthPlace: "Copenhague (Dinamarca)",
      youthClub: "Brøndby IF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 70,
          dribbling: 74,
          tackling: 86
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 90,
          leadership: 82
        },
        physical: {
          pace: 72,
          stamina: 86,
          strength: 80
        }
      }
    },
    {
      id: "ars_nwaneri",
      name: "Ethan Nwaneri",
      shirtNumber: 22,
      position: "CAM",
      overall: 80,
      wage: 2000000,
      contractYears: 5, // hasta 2030
      value: 35000000,
      birthDate: "2007-03-21",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Arsenal",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 86,
          tackling: 55
        },
        mental: {
          vision: 82,
          composure: 76,
          workRate: 80,
          leadership: 64
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 64
        }
      }
    },
    {
      id: "ars_merino",
      name: "Mikel Merino",
      shirtNumber: 23,
      position: "CM",
      overall: 86,
      wage: 7000000,
      contractYears: 3, // hasta 2028
      value: 50000000,
      birthDate: "1996-06-22",
      nationality: "España",
      birthPlace: "Pamplona (España)",
      youthClub: "CA Osasuna",
      attributes: {
        technical: {
          passing: 86,
          shooting: 80,
          dribbling: 82,
          tackling: 82
        },
        mental: {
          vision: 86,
          composure: 84,
          workRate: 90,
          leadership: 82
        },
        physical: {
          pace: 76,
          stamina: 90,
          strength: 82
        }
      }
    },
    {
      id: "ars_zubimendi",
      name: "Martín Zubimendi",
      shirtNumber: 36,
      position: "CDM",
      overall: 86,
      wage: 9000000,
      contractYears: 5, // hasta 2030
      value: 70000000,
      birthDate: "1999-02-02",
      nationality: "España",
      birthPlace: "San Sebastián (España)",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 88,
          shooting: 72,
          dribbling: 80,
          tackling: 88
        },
        mental: {
          vision: 86,
          composure: 86,
          workRate: 90,
          leadership: 80
        },
        physical: {
          pace: 76,
          stamina: 88,
          strength: 80
        }
      }
    },
    {
      id: "ars_rice",
      name: "Declan Rice",
      shirtNumber: 41,
      position: "CDM",
      overall: 88,
      wage: 12000000,
      contractYears: 3, // hasta 2028
      value: 110000000,
      birthDate: "1999-01-14",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Chelsea",
      attributes: {
        technical: {
          passing: 86,
          shooting: 78,
          dribbling: 80,
          tackling: 92
        },
        mental: {
          vision: 84,
          composure: 86,
          workRate: 94,
          leadership: 88
        },
        physical: {
          pace: 80,
          stamina: 94,
          strength: 86
        }
      }
    },

    // DELANTEROS
    {
      id: "ars_saka",
      name: "Bukayo Saka",
      shirtNumber: 7,
      position: "RW",
      overall: 90,
      wage: 11000000,
      contractYears: 2, // hasta 2027
      value: 140000000,
      birthDate: "2001-09-05",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Arsenal",
      attributes: {
        technical: {
          passing: 88,
          shooting: 86,
          dribbling: 92,
          tackling: 55
        },
        mental: {
          vision: 88,
          composure: 86,
          workRate: 92,
          leadership: 80
        },
        physical: {
          pace: 90,
          stamina: 92,
          strength: 78
        }
      }
    },
    {
      id: "ars_gabriel_jesus",
      name: "Gabriel Jesus",
      shirtNumber: 9,
      position: "ST",
      overall: 86,
      wage: 10000000,
      contractYears: 2, // hasta 2027
      value: 45000000,
      birthDate: "1997-04-03",
      nationality: "Brasil",
      birthPlace: "São Paulo (Brasil)",
      youthClub: "Palmeiras",
      attributes: {
        technical: {
          passing: 82,
          shooting: 86,
          dribbling: 88,
          tackling: 58
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 90,
          leadership: 76
        },
        physical: {
          pace: 86,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "ars_martinelli",
      name: "Gabriel Martinelli",
      shirtNumber: 11,
      position: "LW",
      overall: 87,
      wage: 8000000,
      contractYears: 2, // hasta 2027
      value: 75000000,
      birthDate: "2001-06-18",
      nationality: "Brasil",
      birthPlace: "Guarulhos (Brasil)",
      youthClub: "Ituano",
      attributes: {
        technical: {
          passing: 82,
          shooting: 86,
          dribbling: 90,
          tackling: 55
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 92,
          leadership: 74
        },
        physical: {
          pace: 92,
          stamina: 90,
          strength: 78
        }
      }
    },
    {
      id: "ars_gyokeres",
      name: "Viktor Gyökeres",
      shirtNumber: 14,
      position: "ST",
      overall: 87,
      wage: 9000000,
      contractYears: 5, // hasta 2030
      value: 75000000,
      birthDate: "1998-06-04",
      nationality: "Suecia",
      birthPlace: "Estocolmo (Suecia)",
      youthClub: "IF Brommapojkarna",
      attributes: {
        technical: {
          passing: 78,
          shooting: 90,
          dribbling: 82,
          tackling: 50
        },
        mental: {
          vision: 78,
          composure: 86,
          workRate: 86,
          leadership: 76
        },
        physical: {
          pace: 86,
          stamina: 88,
          strength: 88
        }
      }
    },
    {
      id: "ars_trossard",
      name: "Leandro Trossard",
      shirtNumber: 19,
      position: "LW",
      overall: 84,
      wage: 6000000,
      contractYears: 2, // hasta 2027
      value: 25000000,
      birthDate: "1994-12-04",
      nationality: "Bélgica",
      birthPlace: "Waterschei (Bélgica)",
      youthClub: "KRC Genk",
      attributes: {
        technical: {
          passing: 84,
          shooting: 84,
          dribbling: 86,
          tackling: 52
        },
        mental: {
          vision: 82,
          composure: 82,
          workRate: 80,
          leadership: 72
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 70
        }
      }
    },
    {
      id: "ars_madueke",
      name: "Noni Madueke",
      shirtNumber: 20,
      position: "RW",
      overall: 84,
      wage: 6000000,
      contractYears: 5, // hasta 2030
      value: 50000000,
      birthDate: "2002-03-10",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Tottenham Hotspur",
      attributes: {
        technical: {
          passing: 80,
          shooting: 82,
          dribbling: 90,
          tackling: 48
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 90,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "ars_havertz",
      name: "Kai Havertz",
      shirtNumber: 29,
      position: "ST",
      overall: 87,
      wage: 14000000,
      contractYears: 3, // hasta 2028
      value: 65000000,
      birthDate: "1999-06-11",
      nationality: "Alemania",
      birthPlace: "Aquisgrán (Alemania)",
      youthClub: "Bayer Leverkusen",
      attributes: {
        technical: {
          passing: 86,
          shooting: 86,
          dribbling: 86,
          tackling: 50
        },
        mental: {
          vision: 86,
          composure: 84,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 82,
          stamina: 86,
          strength: 80
        }
      }
    },
    {
      id: "ars_dowman",
      name: "Max Dowman",
      shirtNumber: 56,
      position: "ST",
      overall: 72,
      wage: 500000,
      contractYears: 4, // juvenil largo plazo
      value: 2000000,
      birthDate: "2010-01-01", // aproximado / placeholder
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Arsenal",
      attributes: {
        technical: {
          passing: 64,
          shooting: 72,
          dribbling: 70,
          tackling: 38
        },
        mental: {
          vision: 66,
          composure: 64,
          workRate: 76,
          leadership: 60
        },
        physical: {
          pace: 78,
          stamina: 74,
          strength: 64
        }
      }
    }
  ],
	
  // =======================
  // ASTON VILLA FC
  // =======================
  astonvilla: [
    // PORTEROS
    {
      id: "av_emi_martinez",
      name: "Emiliano Martínez",
      shirtNumber: 23,
      position: "GK",
      overall: 89,
      wage: 8000000,
      contractYears: 4, // hasta 2029
      value: 45000000,
      birthDate: "1992-09-02",
      nationality: "Argentina",
      birthPlace: "Mar del Plata (Argentina)",
      youthClub: "Independiente",
      attributes: {
        technical: {
          passing: 72,
          shooting: 12,
          dribbling: 48,
          tackling: 34
        },
        mental: {
          vision: 80,
          composure: 90,
          workRate: 86,
          leadership: 88
        },
        physical: {
          pace: 58,
          stamina: 78,
          strength: 84
        }
      }
    },
    {
      id: "av_bizot",
      name: "Marco Bizot",
      shirtNumber: 40,
      position: "GK",
      overall: 82,
      wage: 4000000,
      contractYears: 2, // hasta 2027
      value: 8000000,
      birthDate: "1991-03-10",
      nationality: "Países Bajos",
      birthPlace: "Hoorn (Países Bajos)",
      youthClub: "AZ Alkmaar",
      attributes: {
        technical: {
          passing: 68,
          shooting: 10,
          dribbling: 46,
          tackling: 32
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 80,
          leadership: 78
        },
        physical: {
          pace: 55,
          stamina: 76,
          strength: 80
        }
      }
    },

    // DEFENSAS
    {
      id: "av_cash",
      name: "Matty Cash",
      shirtNumber: 2,
      position: "RB",
      overall: 83,
      wage: 5000000,
      contractYears: 2, // hasta 2027
      value: 28000000,
      birthDate: "1997-08-07",
      nationality: "Polonia",
      birthPlace: "Slough (Inglaterra)",
      youthClub: "Nottingham Forest",
      attributes: {
        technical: {
          passing: 78,
          shooting: 64,
          dribbling: 78,
          tackling: 82
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 90,
          leadership: 74
        },
        physical: {
          pace: 84,
          stamina: 88,
          strength: 78
        }
      }
    },
    {
      id: "av_lindelof",
      name: "Victor Lindelöf",
      shirtNumber: 3,
      position: "CB",
      overall: 83,
      wage: 6000000,
      contractYears: 2, // hasta 2027
      value: 20000000,
      birthDate: "1994-07-17",
      nationality: "Suecia",
      birthPlace: "Västerås (Suecia)",
      youthClub: "Västerås SK",
      attributes: {
        technical: {
          passing: 78,
          shooting: 52,
          dribbling: 70,
          tackling: 84
        },
        mental: {
          vision: 76,
          composure: 82,
          workRate: 84,
          leadership: 80
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "av_konsa",
      name: "Ezri Konsa",
      shirtNumber: 4,
      position: "CB",
      overall: 85,
      wage: 6500000,
      contractYears: 3, // hasta 2028
      value: 40000000,
      birthDate: "1997-10-23",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Charlton Athletic",
      attributes: {
        technical: {
          passing: 80,
          shooting: 50,
          dribbling: 74,
          tackling: 88
        },
        mental: {
          vision: 76,
          composure: 84,
          workRate: 88,
          leadership: 80
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 86
        }
      }
    },
    {
      id: "av_mings",
      name: "Tyrone Mings",
      shirtNumber: 5,
      position: "CB",
      overall: 82,
      wage: 5500000,
      contractYears: 2, // hasta 2027
      value: 15000000,
      birthDate: "1993-03-13",
      nationality: "Inglaterra",
      birthPlace: "Bath (Inglaterra)",
      youthClub: "Southampton",
      attributes: {
        technical: {
          passing: 74,
          shooting: 50,
          dribbling: 70,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 78,
          workRate: 84,
          leadership: 82
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 86
        }
      }
    },
    {
      id: "av_digne",
      name: "Lucas Digne",
      shirtNumber: 12,
      position: "LB",
      overall: 83,
      wage: 6500000,
      contractYears: 3, // hasta 2028
      value: 22000000,
      birthDate: "1993-07-20",
      nationality: "Francia",
      birthPlace: "Meaux (Francia)",
      youthClub: "Lille OSC",
      attributes: {
        technical: {
          passing: 82,
          shooting: 68,
          dribbling: 80,
          tackling: 82
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 86,
          leadership: 76
        },
        physical: {
          pace: 78,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "av_pau_torres",
      name: "Pau Torres",
      shirtNumber: 14,
      position: "CB",
      overall: 85,
      wage: 7000000,
      contractYears: 3, // hasta 2028
      value: 40000000,
      birthDate: "1997-01-16",
      nationality: "España",
      birthPlace: "Villarreal (España)",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 84,
          shooting: 52,
          dribbling: 78,
          tackling: 86
        },
        mental: {
          vision: 82,
          composure: 86,
          workRate: 82,
          leadership: 80
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 82
        }
      }
    },
    {
      id: "av_andres_garcia",
      name: "Andrés García",
      shirtNumber: 16,
      position: "RB",
      overall: 76,
      wage: 1200000,
      contractYears: 3,
      value: 6000000,
      birthDate: "2003-04-01", // aproximado
      nationality: "España",
      birthPlace: "Valencia (España)",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 70,
          shooting: 46,
          dribbling: 74,
          tackling: 76
        },
        mental: {
          vision: 68,
          composure: 72,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "av_maatsen",
      name: "Ian Maatsen",
      shirtNumber: 22,
      position: "LB",
      overall: 82,
      wage: 4500000,
      contractYears: 5, // hasta 2030
      value: 32000000,
      birthDate: "2002-03-10",
      nationality: "Países Bajos",
      birthPlace: "Vlaardingen (Países Bajos)",
      youthClub: "Feyenoord",
      attributes: {
        technical: {
          passing: 78,
          shooting: 60,
          dribbling: 82,
          tackling: 80
        },
        mental: {
          vision: 74,
          composure: 78,
          workRate: 88,
          leadership: 68
        },
        physical: {
          pace: 86,
          stamina: 86,
          strength: 74
        }
      }
    },
    {
      id: "av_bogarde",
      name: "Lamare Bogarde",
      shirtNumber: 26,
      position: "CB",
      overall: 74,
      wage: 1000000,
      contractYears: 3,
      value: 5000000,
      birthDate: "2004-01-05",
      nationality: "Países Bajos",
      birthPlace: "Rotterdam (Países Bajos)",
      youthClub: "Aston Villa",
      attributes: {
        technical: {
          passing: 68,
          shooting: 44,
          dribbling: 68,
          tackling: 76
        },
        mental: {
          vision: 64,
          composure: 70,
          workRate: 80,
          leadership: 64
        },
        physical: {
          pace: 76,
          stamina: 78,
          strength: 78
        }
      }
    },

    // MEDIOCAMPISTAS
    {
      id: "av_barkley",
      name: "Ross Barkley",
      shirtNumber: 6,
      position: "CM",
      overall: 80,
      wage: 4500000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1993-12-05",
      nationality: "Inglaterra",
      birthPlace: "Liverpool (Inglaterra)",
      youthClub: "Everton",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 80,
          tackling: 60
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 82,
          leadership: 72
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "av_mcginn",
      name: "John McGinn",
      shirtNumber: 7,
      position: "CM",
      overall: 84,
      wage: 6000000,
      contractYears: 2, // hasta 2027
      value: 28000000,
      birthDate: "1994-10-18",
      nationality: "Escocia",
      birthPlace: "Glasgow (Escocia)",
      youthClub: "St Mirren",
      attributes: {
        technical: {
          passing: 82,
          shooting: 80,
          dribbling: 80,
          tackling: 78
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 92,
          leadership: 86
        },
        physical: {
          pace: 76,
          stamina: 92,
          strength: 82
        }
      }
    },
    {
      id: "av_tielemans",
      name: "Youri Tielemans",
      shirtNumber: 8,
      position: "CM",
      overall: 84,
      wage: 7000000,
      contractYears: 2, // hasta 2027
      value: 30000000,
      birthDate: "1997-05-07",
      nationality: "Bélgica",
      birthPlace: "Sint-Pieters-Leeuw (Bélgica)",
      youthClub: "Anderlecht",
      attributes: {
        technical: {
          passing: 86,
          shooting: 82,
          dribbling: 82,
          tackling: 70
        },
        mental: {
          vision: 86,
          composure: 84,
          workRate: 80,
          leadership: 78
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 76
        }
      }
    },
    {
      id: "av_buendia",
      name: "Emiliano Buendía",
      shirtNumber: 10,
      position: "CAM",
      overall: 83,
      wage: 6000000,
      contractYears: 2, // hasta 2027
      value: 26000000,
      birthDate: "1996-12-25",
      nationality: "Argentina",
      birthPlace: "Mar del Plata (Argentina)",
      youthClub: "Getafe CF",
      attributes: {
        technical: {
          passing: 86,
          shooting: 82,
          dribbling: 88,
          tackling: 54
        },
        mental: {
          vision: 86,
          composure: 80,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 68
        }
      }
    },
    {
      id: "av_onana",
      name: "Amadou Onana",
      shirtNumber: 24,
      position: "CDM",
      overall: 84,
      wage: 7000000,
      contractYears: 4, // hasta 2029
      value: 45000000,
      birthDate: "2001-08-16",
      nationality: "Bélgica",
      birthPlace: "Dakar (Senegal)",
      youthClub: "Hamburgo",
      attributes: {
        technical: {
          passing: 80,
          shooting: 70,
          dribbling: 78,
          tackling: 88
        },
        mental: {
          vision: 78,
          composure: 82,
          workRate: 88,
          leadership: 78
        },
        physical: {
          pace: 78,
          stamina: 86,
          strength: 88
        }
      }
    },
    {
      id: "av_kamara",
      name: "Boubacar Kamara",
      shirtNumber: 44,
      position: "CDM",
      overall: 85,
      wage: 7500000,
      contractYears: 5, // hasta 2030
      value: 50000000,
      birthDate: "1999-11-23",
      nationality: "Francia",
      birthPlace: "Marsella (Francia)",
      youthClub: "Olympique de Marseille",
      attributes: {
        technical: {
          passing: 82,
          shooting: 68,
          dribbling: 80,
          tackling: 88
        },
        mental: {
          vision: 80,
          composure: 84,
          workRate: 90,
          leadership: 80
        },
        physical: {
          pace: 78,
          stamina: 88,
          strength: 84
        }
      }
    },

    // DELANTEROS
    {
      id: "av_elliott",
      name: "Harvey Elliott",
      shirtNumber: 9,
      position: "RW",
      overall: 82,
      wage: 4500000,
      contractYears: 1, // cesión hasta 2026
      value: 32000000,
      birthDate: "2003-04-04",
      nationality: "Inglaterra",
      birthPlace: "Chertsey (Inglaterra)",
      youthClub: "Fulham",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 86,
          tackling: 50
        },
        mental: {
          vision: 82,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 68
        }
      }
    },
    {
      id: "av_watkins",
      name: "Ollie Watkins",
      shirtNumber: 11,
      position: "ST",
      overall: 86,
      wage: 7000000,
      contractYears: 3, // hasta 2028
      value: 55000000,
      birthDate: "1995-12-30",
      nationality: "Inglaterra",
      birthPlace: "Torquay (Inglaterra)",
      youthClub: "Exeter City",
      attributes: {
        technical: {
          passing: 80,
          shooting: 88,
          dribbling: 84,
          tackling: 48
        },
        mental: {
          vision: 78,
          composure: 84,
          workRate: 92,
          leadership: 78
        },
        physical: {
          pace: 86,
          stamina: 90,
          strength: 80
        }
      }
    },
    {
      id: "av_malen",
      name: "Donyell Malen",
      shirtNumber: 17,
      position: "ST",
      overall: 84,
      wage: 6000000,
      contractYears: 3,
      value: 38000000,
      birthDate: "1999-01-19",
      nationality: "Países Bajos",
      birthPlace: "Wieringen (Países Bajos)",
      youthClub: "Ajax",
      attributes: {
        technical: {
          passing: 78,
          shooting: 86,
          dribbling: 86,
          tackling: 46
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 88,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "av_sancho",
      name: "Jadon Sancho",
      shirtNumber: 19,
      position: "RW",
      overall: 84,
      wage: 10000000,
      contractYears: 1, // cesión hasta 2026
      value: 38000000,
      birthDate: "2000-03-25",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "Watford",
      attributes: {
        technical: {
          passing: 84,
          shooting: 82,
          dribbling: 90,
          tackling: 46
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 78,
          leadership: 70
        },
        physical: {
          pace: 86,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "av_rogers",
      name: "Morgan Rogers",
      shirtNumber: 27,
      position: "LW",
      overall: 80,
      wage: 3000000,
      contractYears: 5, // hasta 2030
      value: 25000000,
      birthDate: "2002-07-26",
      nationality: "Inglaterra",
      birthPlace: "Halesowen (Inglaterra)",
      youthClub: "West Brom",
      attributes: {
        technical: {
          passing: 78,
          shooting: 80,
          dribbling: 84,
          tackling: 46
        },
        mental: {
          vision: 76,
          composure: 76,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 84,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "av_guessand",
      name: "Evann Guessand",
      shirtNumber: 29,
      position: "ST",
      overall: 79,
      wage: 2500000,
      contractYears: 3,
      value: 18000000,
      birthDate: "2001-02-01",
      nationality: "Costa de Marfil",
      birthPlace: "Ajaccio (Francia)",
      youthClub: "Nice",
      attributes: {
        technical: {
          passing: 74,
          shooting: 80,
          dribbling: 80,
          tackling: 44
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 80
        }
      }
    }
  ],

  // =======================
  // AFC BOURNEMOUTH
  // =======================
  bournemouth: [
    // PORTEROS
    {
      id: "bou_petrovic",
      name: "Đorđe Petrović",
      shirtNumber: 1,
      position: "GK",
      overall: 81,
      wage: 4000000,
      contractYears: 5, // hasta 2030
      value: 18000000,
      birthDate: "1999-10-08",
      nationality: "Serbia",
      birthPlace: "Požarevac (Serbia)",
      youthClub: "Rudar Kostolac",
      attributes: {
        technical: {
          passing: 68,
          shooting: 10,
          dribbling: 46,
          tackling: 30
        },
        mental: {
          vision: 72,
          composure: 80,
          workRate: 80,
          leadership: 76
        },
        physical: {
          pace: 55,
          stamina: 74,
          strength: 80
        }
      }
    },
    {
      id: "bou_dennis",
      name: "Will Dennis",
      shirtNumber: 40,
      position: "GK",
      overall: 72,
      wage: 800000,
      contractYears: 3, // hasta 2028
      value: 3000000,
      birthDate: "2000-07-10",
      nationality: "Inglaterra",
      birthPlace: "Londres (Inglaterra)",
      youthClub: "AFC Bournemouth",
      attributes: {
        technical: {
          passing: 60,
          shooting: 8,
          dribbling: 40,
          tackling: 26
        },
        mental: {
          vision: 62,
          composure: 68,
          workRate: 74,
          leadership: 60
        },
        physical: {
          pace: 55,
          stamina: 70,
          strength: 72
        }
      }
    },
    {
      id: "bou_mckenna",
      name: "Callan McKenna",
      shirtNumber: 46,
      position: "GK",
      overall: 70,
      wage: 600000,
      contractYears: 5,
      value: 2500000,
      birthDate: "2006-01-01", // aproximado
      nationality: "Escocia",
      birthPlace: "Glasgow (Escocia)",
      youthClub: "AFC Bournemouth",
      attributes: {
        technical: {
          passing: 58,
          shooting: 6,
          dribbling: 38,
          tackling: 24
        },
        mental: {
          vision: 60,
          composure: 66,
          workRate: 74,
          leadership: 58
        },
        physical: {
          pace: 54,
          stamina: 68,
          strength: 68
        }
      }
    },

    // DEFENSAS
    {
      id: "bou_araujo",
      name: "Julián Araujo",
      shirtNumber: 2,
      position: "RB",
      overall: 78,
      wage: 2500000,
      contractYears: 4, // hasta 2029
      value: 12000000,
      birthDate: "2001-08-13",
      nationality: "México",
      birthPlace: "Lompoc, California (Estados Unidos)",
      youthClub: "LA Galaxy",
      attributes: {
        technical: {
          passing: 72,
          shooting: 54,
          dribbling: 76,
          tackling: 78
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 86,
          leadership: 66
        },
        physical: {
          pace: 84,
          stamina: 86,
          strength: 74
        }
      }
    },
    {
      id: "bou_truffert",
      name: "Adrien Truffert",
      shirtNumber: 3,
      position: "LB",
      overall: 80,
      wage: 3000000,
      contractYears: 5, // hasta 2030
      value: 20000000,
      birthDate: "2001-11-20",
      nationality: "Francia",
      birthPlace: "Lieja (Bélgica)",
      youthClub: "Stade Rennais",
      attributes: {
        technical: {
          passing: 76,
          shooting: 58,
          dribbling: 80,
          tackling: 80
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 84,
          stamina: 86,
          strength: 74
        }
      }
    },
    {
      id: "bou_senesi",
      name: "Marcos Senesi",
      shirtNumber: 5,
      position: "CB",
      overall: 81,
      wage: 3500000,
      contractYears: 1, // hasta 2026
      value: 18000000,
      birthDate: "1997-05-10",
      nationality: "Argentina",
      birthPlace: "Concordia (Argentina)",
      youthClub: "San Lorenzo",
      attributes: {
        technical: {
          passing: 76,
          shooting: 50,
          dribbling: 72,
          tackling: 84
        },
        mental: {
          vision: 72,
          composure: 78,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 84
        }
      }
    },
    {
      id: "bou_soler",
      name: "Julio Soler",
      shirtNumber: 6,
      position: "CB",
      overall: 73,
      wage: 1200000,
      contractYears: 4,
      value: 6000000,
      birthDate: "2005-01-01", // aproximado
      nationality: "Argentina",
      birthPlace: "Lanús (Argentina)",
      youthClub: "Lanús",
      attributes: {
        technical: {
          passing: 66,
          shooting: 44,
          dribbling: 66,
          tackling: 76
        },
        mental: {
          vision: 64,
          composure: 68,
          workRate: 80,
          leadership: 60
        },
        physical: {
          pace: 74,
          stamina: 76,
          strength: 78
        }
      }
    },
    {
      id: "bou_adam_smith",
      name: "Adam Smith",
      shirtNumber: 15,
      position: "RB",
      overall: 75,
      wage: 3000000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "1991-04-29",
      nationality: "Inglaterra",
      birthPlace: "Leytonstone (Inglaterra)",
      youthClub: "Tottenham Hotspur",
      attributes: {
        technical: {
          passing: 72,
          shooting: 54,
          dribbling: 74,
          tackling: 78
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 86,
          leadership: 80
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "bou_diakite",
      name: "Bafodé Diakité",
      shirtNumber: 18,
      position: "CB",
      overall: 79,
      wage: 3000000,
      contractYears: 4,
      value: 16000000,
      birthDate: "2001-01-06",
      nationality: "Francia",
      birthPlace: "Toulouse (Francia)",
      youthClub: "Toulouse FC",
      attributes: {
        technical: {
          passing: 72,
          shooting: 48,
          dribbling: 70,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 76,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 82
        }
      }
    },
    {
      id: "bou_alex_jimenez",
      name: "Álex Jiménez",
      shirtNumber: 20,
      position: "RB",
      overall: 73,
      wage: 1200000,
      contractYears: 1, // cesión hasta 2026
      value: 6000000,
      birthDate: "2005-05-08",
      nationality: "España",
      birthPlace: "Madrid (España)",
      youthClub: "Real Madrid",
      attributes: {
        technical: {
          passing: 70,
          shooting: 48,
          dribbling: 76,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 70,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "bou_james_hill",
      name: "James Hill",
      shirtNumber: 23,
      position: "CB",
      overall: 73,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2002-01-10",
      nationality: "Inglaterra",
      birthPlace: "Bristol (Inglaterra)",
      youthClub: "Fleetwood Town",
      attributes: {
        technical: {
          passing: 66,
          shooting: 44,
          dribbling: 66,
          tackling: 76
        },
        mental: {
          vision: 64,
          composure: 70,
          workRate: 80,
          leadership: 64
        },
        physical: {
          pace: 74,
          stamina: 78,
          strength: 78
        }
      }
    },
    {
      id: "bou_bevan",
      name: "Owen Bevan",
      shirtNumber: 35,
      position: "CB",
      overall: 72,
      wage: 800000,
      contractYears: 3, // hasta 2028
      value: 4000000,
      birthDate: "2003-10-26",
      nationality: "Gales",
      birthPlace: "Winchester (Inglaterra)",
      youthClub: "AFC Bournemouth",
      attributes: {
        technical: {
          passing: 64,
          shooting: 40,
          dribbling: 64,
          tackling: 74
        },
        mental: {
          vision: 62,
          composure: 68,
          workRate: 80,
          leadership: 62
        },
        physical: {
          pace: 72,
          stamina: 76,
          strength: 76
        }
      }
    },
    {
      id: "bou_milosavljevic",
      name: "Veljko Milosavljević",
      shirtNumber: 44,
      position: "CB",
      overall: 71,
      wage: 700000,
      contractYears: 5, // hasta 2030
      value: 3500000,
      birthDate: "2007-01-01", // aproximado
      nationality: "Serbia",
      birthPlace: "Belgrado (Serbia)",
      youthClub: "Estrella Roja",
      attributes: {
        technical: {
          passing: 62,
          shooting: 38,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 60,
          composure: 66,
          workRate: 78,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 74,
          strength: 76
        }
      }
    },
    {
      id: "bou_akinmboni",
      name: "Matai Akinmboni",
      shirtNumber: 45,
      position: "CB",
      overall: 71,
      wage: 700000,
      contractYears: 4,
      value: 3500000,
      birthDate: "2006-04-17",
      nationality: "Estados Unidos",
      birthPlace: "Springfield, Virginia (Estados Unidos)",
      youthClub: "D.C. United",
      attributes: {
        technical: {
          passing: 62,
          shooting: 38,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 60,
          composure: 66,
          workRate: 80,
          leadership: 58
        },
        physical: {
          pace: 74,
          stamina: 76,
          strength: 78
        }
      }
    },

    // MEDIOCENTROS
    {
      id: "bou_lewis_cook",
      name: "Lewis Cook",
      shirtNumber: 4,
      position: "CM",
      overall: 80,
      wage: 3500000,
      contractYears: 3, // hasta 2028
      value: 20000000,
      birthDate: "1997-02-03",
      nationality: "Inglaterra",
      birthPlace: "York (Inglaterra)",
      youthClub: "Leeds United",
      attributes: {
        technical: {
          passing: 82,
          shooting: 72,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 86,
          leadership: 76
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "bou_alex_scott",
      name: "Alex Scott",
      shirtNumber: 8,
      position: "CM",
      overall: 79,
      wage: 2500000,
      contractYears: 3, // hasta 2028
      value: 20000000,
      birthDate: "2003-08-21",
      nationality: "Inglaterra",
      birthPlace: "Guernsey",
      youthClub: "Bristol City",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 80,
          tackling: 74
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "bou_christie",
      name: "Ryan Christie",
      shirtNumber: 10,
      position: "CAM",
      overall: 78,
      wage: 3000000,
      contractYears: 2, // hasta 2027
      value: 14000000,
      birthDate: "1995-02-22",
      nationality: "Escocia",
      birthPlace: "Inverness (Escocia)",
      youthClub: "Inverness CT",
      attributes: {
        technical: {
          passing: 80,
          shooting: 78,
          dribbling: 80,
          tackling: 62
        },
        mental: {
          vision: 80,
          composure: 76,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 76,
          stamina: 84,
          strength: 70
        }
      }
    },
    {
      id: "bou_tyler_adams",
      name: "Tyler Adams",
      shirtNumber: 12,
      position: "CDM",
      overall: 81,
      wage: 4000000,
      contractYears: 3, // hasta 2028
      value: 22000000,
      birthDate: "1999-02-14",
      nationality: "Estados Unidos",
      birthPlace: "Wappingers Falls, Nueva York (Estados Unidos)",
      youthClub: "New York Red Bulls",
      attributes: {
        technical: {
          passing: 78,
          shooting: 64,
          dribbling: 76,
          tackling: 84
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 90,
          leadership: 78
        },
        physical: {
          pace: 78,
          stamina: 88,
          strength: 78
        }
      }
    },
    {
      id: "bou_tavernier",
      name: "Marcus Tavernier",
      shirtNumber: 16,
      position: "CM",
      overall: 79,
      wage: 3000000,
      contractYears: 3, // hasta 2028
      value: 18000000,
      birthDate: "1999-03-22",
      nationality: "Inglaterra",
      birthPlace: "Leeds (Inglaterra)",
      youthClub: "Middlesbrough",
      attributes: {
        technical: {
          passing: 78,
          shooting: 78,
          dribbling: 80,
          tackling: 68
        },
        mental: {
          vision: 76,
          composure: 76,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "bou_kluivert",
      name: "Justin Kluivert",
      shirtNumber: 19,
      position: "CAM",
      overall: 80,
      wage: 3500000,
      contractYears: 3, // hasta 2028
      value: 20000000,
      birthDate: "1999-05-05",
      nationality: "Países Bajos",
      birthPlace: "Ámsterdam (Países Bajos)",
      youthClub: "Ajax",
      attributes: {
        technical: {
          passing: 80,
          shooting: 78,
          dribbling: 84,
          tackling: 54
        },
        mental: {
          vision: 80,
          composure: 76,
          workRate: 80,
          leadership: 68
        },
        physical: {
          pace: 84,
          stamina: 82,
          strength: 72
        }
      }
    },

    // DELANTEROS
    {
      id: "bou_brooks",
      name: "David Brooks",
      shirtNumber: 7,
      position: "RW",
      overall: 77,
      wage: 3000000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1997-07-08",
      nationality: "Gales",
      birthPlace: "Warrington (Inglaterra)",
      youthClub: "Sheffield United",
      attributes: {
        technical: {
          passing: 78,
          shooting: 76,
          dribbling: 82,
          tackling: 46
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 78,
          leadership: 68
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 68
        }
      }
    },
    {
      id: "bou_evanilson",
      name: "Evanilson",
      shirtNumber: 9,
      position: "ST",
      overall: 82,
      wage: 4500000,
      contractYears: 4,
      value: 26000000,
      birthDate: "1999-10-06",
      nationality: "Brasil",
      birthPlace: "Fortaleza (Brasil)",
      youthClub: "Fluminense",
      attributes: {
        technical: {
          passing: 74,
          shooting: 84,
          dribbling: 80,
          tackling: 40
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 82
        }
      }
    },
    {
      id: "bou_ben_doak",
      name: "Ben Doak",
      shirtNumber: 11,
      position: "RW",
      overall: 76,
      wage: 2000000,
      contractYears: 5, // hasta 2030
      value: 14000000,
      birthDate: "2005-11-11",
      nationality: "Escocia",
      birthPlace: "Dalry (Escocia)",
      youthClub: "Celtic",
      attributes: {
        technical: {
          passing: 72,
          shooting: 74,
          dribbling: 84,
          tackling: 40
        },
        mental: {
          vision: 72,
          composure: 70,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 88,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "bou_adli",
      name: "Amine Adli",
      shirtNumber: 21,
      position: "LW",
      overall: 81,
      wage: 4000000,
      contractYears: 5, // hasta 2030
      value: 26000000,
      birthDate: "2000-05-10",
      nationality: "Marruecos",
      birthPlace: "Béziers (Francia)",
      youthClub: "Toulouse",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 86,
          tackling: 44
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 84,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "bou_kroupi",
      name: "Eli Junior Kroupi",
      shirtNumber: 22,
      position: "ST",
      overall: 74,
      wage: 1500000,
      contractYears: 5, // hasta 2030
      value: 9000000,
      birthDate: "2006-06-23",
      nationality: "Francia",
      birthPlace: "Lorient (Francia)",
      youthClub: "Lorient",
      attributes: {
        technical: {
          passing: 70,
          shooting: 76,
          dribbling: 78,
          tackling: 40
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 80,
          leadership: 60
        },
        physical: {
          pace: 82,
          stamina: 78,
          strength: 72
        }
      }
    },
    {
      id: "bou_semenyo",
      name: "Antoine Semenyo",
      shirtNumber: 24,
      position: "ST",
      overall: 79,
      wage: 3000000,
      contractYears: 5, // hasta 2030
      value: 20000000,
      birthDate: "2000-01-07",
      nationality: "Ghana",
      birthPlace: "Chelsea, Londres (Inglaterra)",
      youthClub: "Bristol City",
      attributes: {
        technical: {
          passing: 72,
          shooting: 80,
          dribbling: 80,
          tackling: 42
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 84,
          stamina: 82,
          strength: 80
        }
      }
    },
    {
      id: "bou_enes_unal",
      name: "Enes Ünal",
      shirtNumber: 26,
      position: "ST",
      overall: 81,
      wage: 4000000,
      contractYears: 3, // hasta 2028
      value: 22000000,
      birthDate: "1997-05-10",
      nationality: "Turquía",
      birthPlace: "Bursa (Turquía)",
      youthClub: "Bursaspor",
      attributes: {
        technical: {
          passing: 74,
          shooting: 84,
          dribbling: 76,
          tackling: 40
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 80,
          leadership: 72
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 82
        }
      }
    }
  ],


  
};