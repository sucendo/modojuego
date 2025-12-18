// js/squads_es.js
// Plantillas "reales" por club de es. Si un club aparece aquí, se usan estos jugadores
// en vez de la generación automática de data.js.
// Los atributos detallados se siguen generando en el motor a partir de overall + posición.

export const realSquads = {

  // =======================
  // DEPORTIVO ALAVÉS
  // =======================
  alaves: [
    // PORTEROS
    {
      id: "alaves_sivera",
      name: "Antonio Sivera",
      shirtNumber: 1,
      position: "GK",
      overall: 78,
      wage: 1800000,
      contractYears: 2, // hasta 2027
      value: 8000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia Mestalla",
      attributes: {
        technical: {
          passing: 66,
          shooting: 14,
          dribbling: 40,
          tackling: 30
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 84,
          leadership: 80
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 80
        }
      }
    },
    {
      id: "alaves_raul_fernandez",
      name: "Raúl Fernández",
      shirtNumber: 13,
      position: "GK",
      overall: 75,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 3000000,
      birthDate: "1988-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "C.D. Mirandés",
      attributes: {
        technical: {
          passing: 62,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 64,
          composure: 74,
          workRate: 78,
          leadership: 72
        },
        physical: {
          pace: 54,
          stamina: 72,
          strength: 78
        }
      }
    },
    {
      id: "alaves_swiderski",
      name: "Grégo Swiderski",
      shirtNumber: 31,
      position: "GK",
      overall: 73,
      wage: 800000,
      contractYears: 2, // hasta 2027
      value: 2500000,
      birthDate: "2005-01-01",
      nationality: "Canadá",
      birthPlace: "Canadá",
      youthClub: "Girondins de Burdeos",
      attributes: {
        technical: {
          passing: 60,
          shooting: 10,
          dribbling: 34,
          tackling: 24
        },
        mental: {
          vision: 62,
          composure: 68,
          workRate: 76,
          leadership: 58
        },
        physical: {
          pace: 60,
          stamina: 72,
          strength: 74
        }
      }
    },

    // DEFENSAS
    {
      id: "alaves_garces",
      name: "Facundo Garcés",
      shirtNumber: 2,
      position: "CB",
      overall: 79,
      wage: 2000000,
      contractYears: 3, // 2028
      value: 9000000,
      birthDate: "1999-01-01",
      nationality: "Malasia",
      birthPlace: "Malasia",
      youthClub: "C.A. Colón",
      attributes: {
        technical: {
          passing: 72,
          shooting: 46,
          dribbling: 66,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 84
        }
      }
    },
    {
      id: "alaves_yusi_enriquez",
      name: "Yusi Enríquez",
      shirtNumber: 3,
      position: "CB",
      overall: 76,
      wage: 1200000,
      contractYears: 4, // 2029
      value: 7000000,
      birthDate: "2005-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Real Madrid Castilla",
      attributes: {
        technical: {
          passing: 70,
          shooting: 44,
          dribbling: 64,
          tackling: 78
        },
        mental: {
          vision: 68,
          composure: 70,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "alaves_pacheco",
      name: "Jon Pacheco",
      shirtNumber: 5,
      position: "CB",
      overall: 78,
      wage: 1800000,
      contractYears: 1, // 2026
      value: 9000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 66,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "alaves_tenaglia",
      name: "Nahuel Tenaglia",
      shirtNumber: 14,
      position: "RB",
      overall: 79,
      wage: 2000000,
      contractYears: 2, // 2027
      value: 10000000,
      birthDate: "1996-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "C.A. Talleres",
      attributes: {
        technical: {
          passing: 74,
          shooting: 52,
          dribbling: 76,
          tackling: 80
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 80
        }
      }
    },
    {
      id: "alaves_jonny",
      name: "Jonny Otto",
      shirtNumber: 17,
      position: "LB",
      overall: 77,
      wage: 2500000,
      contractYears: 2, // 2027
      value: 8000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Celta / PAOK",
      attributes: {
        technical: {
          passing: 74,
          shooting: 52,
          dribbling: 76,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 78
        }
      }
    },
    {
      id: "alaves_moussa_diarra",
      name: "Moussa Diarra",
      shirtNumber: 22,
      position: "CB",
      overall: 78,
      wage: 2000000,
      contractYears: 3, // 2028
      value: 9000000,
      birthDate: "2000-01-01",
      nationality: "Mali",
      birthPlace: "Mali",
      youthClub: "Toulouse FC",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 66,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "alaves_victor_parada",
      name: "Víctor Parada",
      shirtNumber: 24,
      position: "CB",
      overall: 74,
      wage: 900000,
      contractYears: 4, // 2029
      value: 5000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Deportivo Alavés",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 76
        },
        mental: {
          vision: 66,
          composure: 68,
          workRate: 80,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 76
        }
      }
    },
    {
      id: "alaves_maras",
      name: "Nikola Maraš",
      shirtNumber: 25,
      position: "CB",
      overall: 77,
      wage: 1800000,
      contractYears: 2, // 2027
      value: 7000000,
      birthDate: "1995-01-01",
      nationality: "Serbia",
      birthPlace: "Serbia",
      youthClub: "U.D. Almería",
      attributes: {
        technical: {
          passing: 70,
          shooting: 44,
          dribbling: 64,
          tackling: 80
        },
        mental: {
          vision: 68,
          composure: 72,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 84
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "alaves_denis_suarez",
      name: "Denis Suárez",
      shirtNumber: 4,
      position: "CM",
      overall: 80,
      wage: 2800000,
      contractYears: 2, // 2027
      value: 12000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Celta / Villarreal",
      attributes: {
        technical: {
          passing: 86,
          shooting: 78,
          dribbling: 84,
          tackling: 60
        },
        mental: {
          vision: 86,
          composure: 82,
          workRate: 78,
          leadership: 72
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 68
        }
      }
    },
    {
      id: "alaves_guevara",
      name: "Ander Guevara",
      shirtNumber: 6,
      position: "CDM",
      overall: 79,
      wage: 2200000,
      contractYears: 2, // 2027
      value: 10000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 78,
          tackling: 82
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "alaves_carlos_vicente",
      name: "Carlos Vicente",
      shirtNumber: 7,
      position: "RW",
      overall: 77,
      wage: 1800000,
      contractYears: 2, // 2027
      value: 9000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Racing de Ferrol",
      attributes: {
        technical: {
          passing: 78,
          shooting: 78,
          dribbling: 82,
          tackling: 52
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "alaves_antonio_blanco",
      name: "Antonio Blanco",
      shirtNumber: 8,
      position: "CM",
      overall: 79,
      wage: 2200000,
      contractYears: 2, // 2027
      value: 11000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Madrid",
      attributes: {
        technical: {
          passing: 82,
          shooting: 74,
          dribbling: 80,
          tackling: 80
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "alaves_carles_alena",
      name: "Carles Aleñá",
      shirtNumber: 10,
      position: "CM",
      overall: 79,
      wage: 2600000,
      contractYears: 4, // 2029
      value: 12000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 84,
          tackling: 60
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 80,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "alaves_guridi",
      name: "Jon Guridi",
      shirtNumber: 18,
      position: "CM",
      overall: 78,
      wage: 2200000,
      contractYears: 1, // 2026
      value: 9000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 80,
          shooting: 76,
          dribbling: 80,
          tackling: 76
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "alaves_pablo_ibanez",
      name: "Pablo Ibáñez",
      shirtNumber: 19,
      position: "CM",
      overall: 78,
      wage: 2200000,
      contractYears: 5, // 2030
      value: 11000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "C.A. Osasuna",
      attributes: {
        technical: {
          passing: 80,
          shooting: 76,
          dribbling: 80,
          tackling: 74
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "alaves_calebe",
      name: "Calebe Gonçalves",
      shirtNumber: 20,
      position: "CM",
      overall: 77,
      wage: 1800000,
      contractYears: 1, // 2026
      value: 8000000,
      birthDate: "2000-01-01",
      nationality: "Brasil",
      birthPlace: "Brasil",
      youthClub: "Fortaleza EC",
      attributes: {
        technical: {
          passing: 80,
          shooting: 78,
          dribbling: 82,
          tackling: 52
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "alaves_protesoni",
      name: "Carlos Protesoni",
      shirtNumber: 23,
      position: "CM",
      overall: 77,
      wage: 2000000,
      contractYears: 1, // 2026
      value: 9000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "C.A. Independiente",
      attributes: {
        technical: {
          passing: 80,
          shooting: 76,
          dribbling: 80,
          tackling: 72
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "alaves_lander_pinillos",
      name: "Lander Pinillos",
      shirtNumber: 28,
      position: "CM",
      overall: 73,
      wage: 900000,
      contractYears: 2, // 2027
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Deportivo Alavés",
      attributes: {
        technical: {
          passing: 72,
          shooting: 68,
          dribbling: 74,
          tackling: 68
        },
        mental: {
          vision: 72,
          composure: 70,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 70
        }
      }
    },

    // DELANTEROS
    {
      id: "alaves_mariano",
      name: "Mariano Díaz",
      shirtNumber: 9,
      position: "ST",
      overall: 78,
      wage: 2500000,
      contractYears: 2, // 2027
      value: 9000000,
      birthDate: "1993-01-01",
      nationality: "República Dominicana",
      birthPlace: "República Dominicana",
      youthClub: "Sin equipo",
      attributes: {
        technical: {
          passing: 72,
          shooting: 82,
          dribbling: 78,
          tackling: 48
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "alaves_toni_martinez",
      name: "Toni Martínez",
      shirtNumber: 11,
      position: "ST",
      overall: 78,
      wage: 2200000,
      contractYears: 3, // 2028
      value: 10000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "FC Porto",
      attributes: {
        technical: {
          passing: 74,
          shooting: 82,
          dribbling: 78,
          tackling: 46
        },
        mental: {
          vision: 74,
          composure: 78,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "alaves_lucas_boye",
      name: "Lucas Boyé",
      shirtNumber: 15,
      position: "ST",
      overall: 80,
      wage: 3000000,
      contractYears: 4, // 2029
      value: 14000000,
      birthDate: "1996-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Granada CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 84,
          dribbling: 80,
          tackling: 48
        },
        mental: {
          vision: 76,
          composure: 80,
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
      id: "alaves_abde_rebbach",
      name: "Abde Rebbach",
      shirtNumber: 21,
      position: "LW",
      overall: 77,
      wage: 2000000,
      contractYears: 3, // 2028
      value: 9000000,
      birthDate: "1998-01-01",
      nationality: "Argelia",
      birthPlace: "Argelia",
      youthClub: "Deportivo Alavés",
      attributes: {
        technical: {
          passing: 78,
          shooting: 78,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 76,
          composure: 76,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 72
        }
      }
    }
  ],
	
  // =======================
  // ATHLETIC CLUB
  // =======================
  athletic: [
    // PORTEROS
    {
      id: "athletic_unai_simon",
      name: "Unai Simón",
      shirtNumber: 1,
      position: "GK",
      overall: 85,
      wage: 5000000,
      contractYears: 4, // hasta 2029
      value: 25000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 70,
          shooting: 15,
          dribbling: 40,
          tackling: 30
        },
        mental: {
          vision: 78,
          composure: 86,
          workRate: 84,
          leadership: 80
        },
        physical: {
          pace: 60,
          stamina: 76,
          strength: 82
        }
      }
    },
    {
      id: "athletic_alex_padilla",
      name: "Álex Padilla",
      shirtNumber: 27,
      position: "GK",
      overall: 77,
      wage: 1200000,
      contractYears: 4, // hasta 2029
      value: 6000000,
      birthDate: "2003-01-01",
      nationality: "México",
      birthPlace: "México",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 64,
          shooting: 12,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 66,
          composure: 74,
          workRate: 80,
          leadership: 60
        },
        physical: {
          pace: 60,
          stamina: 74,
          strength: 76
        }
      }
    },

    // DEFENSAS
    {
      id: "athletic_gorosabel",
      name: "Andoni Gorosabel",
      shirtNumber: 2,
      position: "RB",
      overall: 80,
      wage: 2500000,
      contractYears: 3, // 2028
      value: 10000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Deportivo Alavés",
      attributes: {
        technical: {
          passing: 76,
          shooting: 52,
          dribbling: 76,
          tackling: 80
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "athletic_vivian",
      name: "Dani Vivian",
      shirtNumber: 3,
      position: "CB",
      overall: 83,
      wage: 3500000,
      contractYears: 7, // 2032
      value: 25000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 78,
          shooting: 48,
          dribbling: 68,
          tackling: 88
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 88,
          leadership: 78
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 86
        }
      }
    },
    {
      id: "athletic_paredes",
      name: "Aitor Paredes",
      shirtNumber: 4,
      position: "CB",
      overall: 81,
      wage: 2800000,
      contractYears: 4, // 2029
      value: 18000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 76,
          shooting: 46,
          dribbling: 66,
          tackling: 84
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 86,
          leadership: 74
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "athletic_yeray",
      name: "Yeray Álvarez",
      shirtNumber: 5,
      position: "CB",
      overall: 82,
      wage: 3200000,
      contractYears: 1, // 2026
      value: 16000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 74,
          shooting: 44,
          dribbling: 64,
          tackling: 86
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 86,
          leadership: 78
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 84
        }
      }
    },
    {
      id: "athletic_areso",
      name: "Jesús Areso",
      shirtNumber: 12,
      position: "RB",
      overall: 79,
      wage: 2200000,
      contractYears: 6, // 2031
      value: 12000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 74,
          shooting: 52,
          dribbling: 76,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "athletic_laporte",
      name: "Aymeric Laporte",
      shirtNumber: 14,
      position: "CB",
      overall: 86,
      wage: 6000000,
      contractYears: 3, // 2028
      value: 28000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "Francia",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 84,
          shooting: 60,
          dribbling: 76,
          tackling: 88
        },
        mental: {
          vision: 80,
          composure: 84,
          workRate: 84,
          leadership: 82
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "athletic_lekue",
      name: "Iñigo Lekue",
      shirtNumber: 15,
      position: "RB",
      overall: 78,
      wage: 2200000,
      contractYears: 1, // 2026
      value: 8000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 74,
          shooting: 50,
          dribbling: 76,
          tackling: 78
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "athletic_yuri",
      name: "Yuri Berchiche",
      shirtNumber: 17,
      position: "LB",
      overall: 80,
      wage: 3500000,
      contractYears: 1, // 2026
      value: 9000000,
      birthDate: "1990-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 78,
          shooting: 60,
          dribbling: 78,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 78,
          workRate: 84,
          leadership: 78
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "athletic_boiro",
      name: "Adama Boiro",
      shirtNumber: 19,
      position: "CB",
      overall: 76,
      wage: 1500000,
      contractYears: 4, // 2029
      value: 7000000,
      birthDate: "2002-01-01",
      nationality: "Senegal",
      birthPlace: "Senegal",
      youthClub: "Osasuna B",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 78
        },
        mental: {
          vision: 64,
          composure: 68,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "athletic_egiluz",
      name: "Unai Egiluz",
      shirtNumber: 32,
      position: "CB",
      overall: 75,
      wage: 1400000,
      contractYears: 3, // 2028
      value: 6000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 68,
          shooting: 38,
          dribbling: 60,
          tackling: 76
        },
        mental: {
          vision: 64,
          composure: 68,
          workRate: 80,
          leadership: 62
        },
        physical: {
          pace: 74,
          stamina: 78,
          strength: 78
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "athletic_vesga",
      name: "Mikel Vesga",
      shirtNumber: 6,
      position: "CDM",
      overall: 80,
      wage: 2800000,
      contractYears: 2, // 2027
      value: 10000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 76,
          tackling: 82
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 84,
          leadership: 74
        },
        physical: {
          pace: 68,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "athletic_sancet",
      name: "Oihan Sancet",
      shirtNumber: 8,
      position: "CAM",
      overall: 84,
      wage: 4500000,
      contractYears: 7, // 2032
      value: 35000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 86,
          shooting: 84,
          dribbling: 86,
          tackling: 70
        },
        mental: {
          vision: 86,
          composure: 82,
          workRate: 82,
          leadership: 74
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 78
        }
      }
    },
    {
      id: "athletic_ruiz_galarreta",
      name: "Iñigo Ruiz de Galarreta",
      shirtNumber: 16,
      position: "CM",
      overall: 80,
      wage: 3000000,
      contractYears: 2, // 2027
      value: 9000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 82,
          tackling: 72
        },
        mental: {
          vision: 84,
          composure: 82,
          workRate: 82,
          leadership: 74
        },
        physical: {
          pace: 70,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "athletic_jauregizar",
      name: "Mikel Jauregizar",
      shirtNumber: 18,
      position: "CM",
      overall: 76,
      wage: 1200000,
      contractYears: 6, // 2031
      value: 7000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 76,
          shooting: 70,
          dribbling: 78,
          tackling: 70
        },
        mental: {
          vision: 74,
          composure: 72,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "athletic_unai_gomez",
      name: "Unai Gómez",
      shirtNumber: 20,
      position: "CM",
      overall: 77,
      wage: 1500000,
      contractYears: 3, // 2028
      value: 8000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 78,
          shooting: 76,
          dribbling: 80,
          tackling: 64
        },
        mental: {
          vision: 78,
          composure: 74,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "athletic_prados",
      name: "Beñat Prados",
      shirtNumber: 24,
      position: "CDM",
      overall: 78,
      wage: 1800000,
      contractYears: 6, // 2031
      value: 10000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 78,
          shooting: 70,
          dribbling: 76,
          tackling: 80
        },
        mental: {
          vision: 76,
          composure: 76,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "athletic_rego",
      name: "Alejandro Rego",
      shirtNumber: 30,
      position: "CM",
      overall: 74,
      wage: 900000,
      contractYears: 1, // 2026
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 74,
          shooting: 68,
          dribbling: 76,
          tackling: 68
        },
        mental: {
          vision: 72,
          composure: 70,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "athletic_ibon_sanchez",
      name: "Ibon Sánchez",
      shirtNumber: 35,
      position: "CM",
      overall: 73,
      wage: 800000,
      contractYears: 2, // 2027
      value: 3500000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 72,
          shooting: 66,
          dribbling: 74,
          tackling: 66
        },
        mental: {
          vision: 70,
          composure: 68,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 70
        }
      }
    },
    {
      id: "athletic_selton_sanchez",
      name: "Selton Sánchez",
      shirtNumber: 44,
      position: "RW",
      overall: 72,
      wage: 700000,
      contractYears: 4, // 2029
      value: 4000000,
      birthDate: "2007-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 74,
          shooting: 70,
          dribbling: 80,
          tackling: 60
        },
        mental: {
          vision: 74,
          composure: 68,
          workRate: 80,
          leadership: 58
        },
        physical: {
          pace: 78,
          stamina: 76,
          strength: 64
        }
      }
    },

    // DELANTEROS
    {
      id: "athletic_berenguer",
      name: "Álex Berenguer",
      shirtNumber: 7,
      position: "LW",
      overall: 81,
      wage: 3500000,
      contractYears: 2, // 2027
      value: 15000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 86,
          tackling: 52
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 84,
          stamina: 82,
          strength: 70
        }
      }
    },
    {
      id: "athletic_inaki",
      name: "Iñaki Williams",
      shirtNumber: 9,
      position: "ST",
      overall: 84,
      wage: 6000000,
      contractYears: 3, // 2028
      value: 28000000,
      birthDate: "1994-01-01",
      nationality: "Ghana",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 78,
          shooting: 84,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 86,
          leadership: 80
        },
        physical: {
          pace: 92,
          stamina: 86,
          strength: 80
        }
      }
    },
    {
      id: "athletic_nico_williams",
      name: "Nico Williams Jr.",
      shirtNumber: 10,
      position: "RW",
      overall: 86,
      wage: 7000000,
      contractYears: 10, // 2035
      value: 65000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 84,
          shooting: 82,
          dribbling: 90,
          tackling: 52
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 94,
          stamina: 86,
          strength: 72
        }
      }
    },
    {
      id: "athletic_guruzeta",
      name: "Gorka Guruzeta",
      shirtNumber: 11,
      position: "ST",
      overall: 82,
      wage: 3500000,
      contractYears: 3, // 2028
      value: 20000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 78,
          shooting: 84,
          dribbling: 80,
          tackling: 50
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 78
        }
      }
    },
    {
      id: "athletic_sannadi",
      name: "Maroan Sannadi",
      shirtNumber: 21,
      position: "ST",
      overall: 78,
      wage: 2200000,
      contractYears: 4, // 2029
      value: 12000000,
      birthDate: "2001-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Deportivo Alavés",
      attributes: {
        technical: {
          passing: 74,
          shooting: 80,
          dribbling: 78,
          tackling: 48
        },
        mental: {
          vision: 74,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 76
        }
      }
    },
    {
      id: "athletic_nico_serrano",
      name: "Nico Serrano",
      shirtNumber: 22,
      position: "LW",
      overall: 77,
      wage: 1800000,
      contractYears: 3, // 2028
      value: 10000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 78,
          shooting: 76,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 76,
          composure: 74,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "athletic_robert_navarro",
      name: "Robert Navarro",
      shirtNumber: 23,
      position: "LW",
      overall: 80,
      wage: 2500000,
      contractYears: 5, // 2030
      value: 15000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 86,
          tackling: 50
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "athletic_urko_izeta",
      name: "Urko Izeta",
      shirtNumber: 25,
      position: "ST",
      overall: 76,
      wage: 1800000,
      contractYears: 2, // 2027
      value: 9000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "CD Vitoria",
      attributes: {
        technical: {
          passing: 72,
          shooting: 80,
          dribbling: 76,
          tackling: 46
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "athletic_asier_hierro",
      name: "Asier Hierro",
      shirtNumber: 31,
      position: "ST",
      overall: 74,
      wage: 900000,
      contractYears: 3, // 2028
      value: 5000000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 70,
          shooting: 78,
          dribbling: 76,
          tackling: 44
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 78,
          stamina: 78,
          strength: 72
        }
      }
    }
  ],

  // =======================
  // ATLÉTICO DE MADRID
  // =======================
  atletico: [
	// PORTEROS
	{
	id: "atletico_musso",
	name: "Juan Musso",
	shirtNumber: 1,
	position: "GK",
	overall: 82,
	wage: 3000000,
	contractYears: 3,
	value: 10000000,
	birthDate: "1994-05-06",
	nationality: "Argentina",
	birthPlace: "San Nicolás de los Arroyos (Argentina)",
	youthClub: "Racing Club",
	attributes: {
		technical: {
		passing: 65,
		shooting: 20,
		dribbling: 40,
		tackling: 35
		},
		mental: {
		vision: 68,
		composure: 82,
		workRate: 78,
		leadership: 72
		},
		physical: {
		pace: 52,
		stamina: 70,
		strength: 82
		}
	}
	},
	{
	id: "atletico_oblak",
	name: "Jan Oblak",
	shirtNumber: 13,
	position: "GK",
	overall: 89,
	wage: 10000000,
	contractYears: 3,
	value: 25000000,
	birthDate: "1993-01-07",
	nationality: "Eslovenia",
	birthPlace: "Škofja Loka (Eslovenia)",
	youthClub: "Olimpija Ljubljana",
	attributes: {
		technical: {
		passing: 70,
		shooting: 18,
		dribbling: 44,
		tackling: 38
		},
		mental: {
		vision: 74,
		composure: 94,
		workRate: 83,
		leadership: 88
		},
		physical: {
		pace: 54,
		stamina: 72,
		strength: 86
		}
	}
	},
	
	// DEFENSAS
	{
	id: "atletico_gimenez",
	name: "José María Giménez",
	shirtNumber: 2,
	position: "CB",
	overall: 86,
	wage: 7000000,
	contractYears: 3,
	value: 30000000,
	birthDate: "1995-01-20",
	nationality: "Uruguay",
	birthPlace: "Toledo (Uruguay)",
	youthClub: "Danubio",
	attributes: {
		technical: {
		passing: 73,
		shooting: 45,
		dribbling: 60,
		tackling: 89
		},
		mental: {
		vision: 70,
		composure: 82,
		workRate: 90,
		leadership: 88
		},
		physical: {
		pace: 74,
		stamina: 82,
		strength: 88
		}
	}
	},
	{
	id: "atletico_ruggeri",
	name: "Matteo Ruggeri",
	shirtNumber: 3,
	position: "LB",
	overall: 80,
	wage: 2000000,
	contractYears: 5,
	value: 22000000,
	birthDate: "2002-07-11",
	nationality: "Italia",
	birthPlace: "San Giovanni Bianco (Italia)",
	youthClub: "Atalanta",
	attributes: {
		technical: {
		passing: 74,
		shooting: 50,
		dribbling: 72,
		tackling: 78
		},
		mental: {
		vision: 72,
		composure: 76,
		workRate: 86,
		leadership: 70
		},
		physical: {
		pace: 81,
		stamina: 86,
		strength: 77
		}
	}
	},
	{
	id: "atletico_llorente",
	name: "Marcos Llorente",
	shirtNumber: 14,
	position: "RB",
	overall: 84,
	wage: 7000000,
	contractYears: 2,
	value: 45000000,
	birthDate: "1995-01-30",
	nationality: "España",
	birthPlace: "Madrid (España)",
	youthClub: "Real Madrid",
	attributes: {
		technical: {
		passing: 82,
		shooting: 78,
		dribbling: 80,
		tackling: 79
		},
		mental: {
		vision: 80,
		composure: 82,
		workRate: 92,
		leadership: 80
		},
		physical: {
		pace: 88,
		stamina: 92,
		strength: 82
		}
	}
	},
	{
	id: "atletico_lenglet",
	name: "Clément Lenglet",
	shirtNumber: 15,
	position: "CB",
	overall: 82,
	wage: 5000000,
	contractYears: 3,
	value: 15000000,
	birthDate: "1995-06-17",
	nationality: "Francia",
	birthPlace: "Beauvais (Francia)",
	youthClub: "Nancy",
	attributes: {
		technical: {
		passing: 80,
		shooting: 52,
		dribbling: 68,
		tackling: 84
		},
		mental: {
		vision: 78,
		composure: 82,
		workRate: 80,
		leadership: 78
		},
		physical: {
		pace: 70,
		stamina: 78,
		strength: 82
		}
	}
	},
	{
	id: "atletico_molina",
	name: "Nahuel Molina",
	shirtNumber: 16,
	position: "RB",
	overall: 84,
	wage: 4000000,
	contractYears: 2,
	value: 35000000,
	birthDate: "1998-04-06",
	nationality: "Argentina",
	birthPlace: "Embalse, Córdoba (Argentina)",
	youthClub: "Boca Juniors",
	attributes: {
		technical: {
		passing: 80,
		shooting: 72,
		dribbling: 82,
		tackling: 79
		},
		mental: {
		vision: 78,
		composure: 80,
		workRate: 88,
		leadership: 74
		},
		physical: {
		pace: 86,
		stamina: 90,
		strength: 76
		}
	}
	},
	{
	id: "atletico_hancko",
	name: "Dávid Hancko",
	shirtNumber: 17,
	position: "CB",
	overall: 83,
	wage: 4000000,
	contractYears: 5,
	value: 30000000,
	birthDate: "1997-12-13",
	nationality: "Eslovaquia",
	birthPlace: "Prievidza (Eslovaquia)",
	youthClub: "Žilina",
	attributes: {
		technical: {
		passing: 78,
		shooting: 58,
		dribbling: 68,
		tackling: 86
		},
		mental: {
		vision: 74,
		composure: 81,
		workRate: 86,
		leadership: 80
		},
		physical: {
		pace: 76,
		stamina: 82,
		strength: 88
		}
	}
	},
	{
	id: "atletico_pubill",
	name: "Marc Pubill",
	shirtNumber: 18,
	position: "RB",
	overall: 78,
	wage: 1500000,
	contractYears: 5,
	value: 16000000,
	birthDate: "2003-06-20",
	nationality: "España",
	birthPlace: "Terrassa (España)",
	youthClub: "Espanyol",
	attributes: {
		technical: {
		passing: 74,
		shooting: 55,
		dribbling: 77,
		tackling: 76
		},
		mental: {
		vision: 70,
		composure: 72,
		workRate: 88,
		leadership: 68
		},
		physical: {
		pace: 84,
		stamina: 88,
		strength: 78
		}
	}
	},
	{
	id: "atletico_galan",
	name: "Javi Galán",
	shirtNumber: 21,
	position: "LB",
	overall: 79,
	wage: 2500000,
	contractYears: 1,
	value: 10000000,
	birthDate: "1994-11-19",
	nationality: "España",
	birthPlace: "Badajoz (España)",
	youthClub: "San Roque Badajoz",
	attributes: {
		technical: {
		passing: 76,
		shooting: 52,
		dribbling: 82,
		tackling: 77
		},
		mental: {
		vision: 72,
		composure: 76,
		workRate: 88,
		leadership: 70
		},
		physical: {
		pace: 86,
		stamina: 90,
		strength: 72
		}
	}
	},
	{
	id: "atletico_lenormand",
	name: "Robin Le Normand",
	shirtNumber: 24,
	position: "CB",
	overall: 85,
	wage: 5000000,
	contractYears: 4,
	value: 40000000,
	birthDate: "1996-11-11",
	nationality: "España",
	birthPlace: "Pabu (Francia)",
	youthClub: "Stade Brestois",
	attributes: {
		technical: {
		passing: 80,
		shooting: 50,
		dribbling: 68,
		tackling: 88
		},
		mental: {
		vision: 76,
		composure: 84,
		workRate: 88,
		leadership: 82
		},
		physical: {
		pace: 74,
		stamina: 82,
		strength: 86
		}
	}
	},
	
	// MEDIOCAMPISTAS
	{
	id: "atletico_gallagher",
	name: "Conor Gallagher",
	shirtNumber: 4,
	position: "CM",
	overall: 84,
	wage: 6000000,
	contractYears: 4,
	value: 40000000,
	birthDate: "2000-02-06",
	nationality: "Inglaterra",
	birthPlace: "Epsom (Inglaterra)",
	youthClub: "Chelsea",
	attributes: {
		technical: {
		passing: 82,
		shooting: 78,
		dribbling: 80,
		tackling: 80
		},
		mental: {
		vision: 80,
		composure: 80,
		workRate: 92,
		leadership: 78
		},
		physical: {
		pace: 82,
		stamina: 93,
		strength: 80
		}
	}
	},
	{
	id: "atletico_johnny_cardoso",
	name: "Johnny Cardoso",
	shirtNumber: 5,
	position: "CDM",
	overall: 82,
	wage: 3000000,
	contractYears: 5,
	value: 25000000,
	birthDate: "2001-09-20",
	nationality: "Estados Unidos",
	birthPlace: "Denville Township, NJ (Estados Unidos)",
	youthClub: "Internacional",
	attributes: {
		technical: {
		passing: 82,
		shooting: 70,
		dribbling: 78,
		tackling: 80
		},
		mental: {
		vision: 78,
		composure: 80,
		workRate: 88,
		leadership: 74
		},
		physical: {
		pace: 79,
		stamina: 88,
		strength: 80
		}
	}
	},
	{
	id: "atletico_koke",
	name: "Koke Resurrección",
	shirtNumber: 6,
	position: "CM",
	overall: 85,
	wage: 7000000,
	contractYears: 1,
	value: 20000000,
	birthDate: "1992-01-08",
	nationality: "España",
	birthPlace: "Madrid (España)",
	youthClub: "Atlético Madrid",
	attributes: {
		technical: {
		passing: 89,
		shooting: 76,
		dribbling: 80,
		tackling: 78
		},
		mental: {
		vision: 90,
		composure: 88,
		workRate: 86,
		leadership: 95
		},
		physical: {
		pace: 70,
		stamina: 86,
		strength: 76
		}
	}
	},
	{
	id: "atletico_barrios",
	name: "Pablo Barrios",
	shirtNumber: 8,
	position: "CM",
	overall: 82,
	wage: 2500000,
	contractYears: 3,
	value: 35000000,
	birthDate: "2003-06-15",
	nationality: "España",
	birthPlace: "Madrid (España)",
	youthClub: "Atlético Madrid",
	attributes: {
		technical: {
		passing: 82,
		shooting: 76,
		dribbling: 82,
		tackling: 76
		},
		mental: {
		vision: 82,
		composure: 80,
		workRate: 88,
		leadership: 72
		},
		physical: {
		pace: 80,
		stamina: 88,
		strength: 76
		}
	}
	},
	{
	id: "atletico_baena",
	name: "Álex Baena",
	shirtNumber: 10,
	position: "LM",
	overall: 84,
	wage: 5000000,
	contractYears: 5,
	value: 50000000,
	birthDate: "2001-07-20",
	nationality: "España",
	birthPlace: "Roquetas de Mar (España)",
	youthClub: "Villarreal",
	attributes: {
		technical: {
		passing: 88,
		shooting: 80,
		dribbling: 88,
		tackling: 68
		},
		mental: {
		vision: 90,
		composure: 82,
		workRate: 84,
		leadership: 72
		},
		physical: {
		pace: 82,
		stamina: 86,
		strength: 70
		}
	}
	},
	{
	id: "atletico_almada",
	name: "Thiago Almada",
	shirtNumber: 11,
	position: "CAM",
	overall: 85,
	wage: 4000000,
	contractYears: 5,
	value: 35000000,
	birthDate: "2001-04-26",
	nationality: "Argentina",
	birthPlace: "Ciudadela, Buenos Aires (Argentina)",
	youthClub: "Vélez Sarsfield",
	attributes: {
		technical: {
		passing: 87,
		shooting: 82,
		dribbling: 90,
		tackling: 60
		},
		mental: {
		vision: 90,
		composure: 82,
		workRate: 84,
		leadership: 70
		},
		physical: {
		pace: 86,
		stamina: 84,
		strength: 66
		}
	}
	},
	
	// DELANTEROS
	{
	  id: "atletico_griezmann",
	  name: "Antoine Griezmann",
	  shirtNumber: 7,
	  position: "CF", // antes "SD"
	  overall: 86,
	  wage: 8000000,
	  contractYears: 2,
	  value: 28000000,
	  birthDate: "1991-03-21",
	  nationality: "Francia",
	  birthPlace: "Mâcon (Francia)",
	  youthClub: "Real Sociedad",
	  attributes: {
		technical: {
		  passing: 80,
		  shooting: 92,
		  dribbling: 82,
		  tackling: 45
		},
		mental: {
		  vision: 81,
		  composure: 92,
		  workRate: 86,
		  leadership: 88
		},
		physical: {
		  pace: 76,
		  stamina: 84,
		  strength: 86
		}
	  }
	},
	{
	id: "atletico_sorloth",
	name: "Alexander Sørloth",
	shirtNumber: 9,
	position: "ST",
	overall: 84,
	wage: 5000000,
	contractYears: 4,
	value: 35000000,
	birthDate: "1995-12-05",
	nationality: "Noruega",
	birthPlace: "Trondheim (Noruega)",
	youthClub: "Rosenborg",
	attributes: {
		technical: {
		passing: 74,
		shooting: 86,
		dribbling: 76,
		tackling: 52
		},
		mental: {
		vision: 76,
		composure: 82,
		workRate: 84,
		leadership: 72
		},
		physical: {
		pace: 82,
		stamina: 84,
		strength: 90
		}
	}
	},
	{
	id: "atletico_carlos_martin",
	name: "Carlos Martín",
	shirtNumber: 12,
	position: "ST",
	overall: 78,
	wage: 1200000,
	contractYears: 4,
	value: 12000000,
	birthDate: "2002-04-22",
	nationality: "España",
	birthPlace: "Madrid (España)",
	youthClub: "Atlético Madrid",
	attributes: {
		technical: {
		passing: 72,
		shooting: 78,
		dribbling: 78,
		tackling: 55
		},
		mental: {
		vision: 72,
		composure: 74,
		workRate: 86,
		leadership: 65
		},
		physical: {
		pace: 82,
		stamina: 84,
		strength: 75
		}
	}
	},
	{
	id: "atletico_julian_alvarez",
	name: "Julián Álvarez",
	shirtNumber: 19,
	position: "CF",
	overall: 88,
	wage: 7000000,
	contractYears: 5,
	value: 60000000,
	birthDate: "2000-01-31",
	nationality: "Argentina",
	birthPlace: "Calchín (Argentina)",
	youthClub: "River Plate",
	attributes: {
		technical: {
		passing: 84,
		shooting: 90,
		dribbling: 88,
		tackling: 62
		},
		mental: {
		vision: 86,
		composure: 88,
		workRate: 94,
		leadership: 78
		},
		physical: {
		pace: 87,
		stamina: 92,
		strength: 76
		}
	}
	},
	{
	id: "atletico_giuliano_simeone",
	name: "Giuliano Simeone",
	shirtNumber: 20,
	position: "ST",
	overall: 80,
	wage: 2000000,
	contractYears: 3,
	value: 18000000,
	birthDate: "2002-12-18",
	nationality: "Argentina",
	birthPlace: "Roma (Italia)",
	youthClub: "River Plate",
	attributes: {
		technical: {
		passing: 74,
		shooting: 80,
		dribbling: 82,
		tackling: 60
		},
		mental: {
		vision: 74,
		composure: 76,
		workRate: 90,
		leadership: 70
		},
		physical: {
		pace: 84,
		stamina: 88,
		strength: 74
		}
	}
	},
	{
	id: "atletico_raspadori",
	name: "Giacomo Raspadori",
	shirtNumber: 22,
	position: "CF",
	overall: 83,
	wage: 4500000,
	contractYears: 5,
	value: 25000000,
	birthDate: "2000-02-18",
	nationality: "Italia",
	birthPlace: "Bentivoglio (Italia)",
	youthClub: "Sassuolo",
	attributes: {
		technical: {
		passing: 84,
		shooting: 83,
		dribbling: 88,
		tackling: 58
		},
		mental: {
		vision: 84,
		composure: 84,
		workRate: 86,
		leadership: 72
		},
		physical: {
		pace: 82,
		stamina: 84,
		strength: 70
		}
	}
	},
	{
	id: "atletico_nico_gonzalez",
	name: "Nico González",
	shirtNumber: 23,
	position: "LW",
	overall: 84,
	wage: 4000000,
	contractYears: 1,
	value: 28000000,
	birthDate: "1998-04-06",
	nationality: "Argentina",
	birthPlace: "Belén de Escobar (Argentina)",
	youthClub: "Argentinos Juniors",
	attributes: {
		technical: {
		passing: 80,
		shooting: 82,
		dribbling: 88,
		tackling: 60
		},
		mental: {
		vision: 80,
		composure: 82,
		workRate: 88,
		leadership: 70
		},
		physical: {
		pace: 86,
		stamina: 86,
		strength: 74
		}
	}
	}	
  ],

  // =======================
  // FC BARCELONA
  // =======================
  barcelona: [
	// PORTEROS
	{
	id: "barca_ter_stegen",
	name: "Marc-André ter Stegen",
	shirtNumber: 1,
	position: "GK",
	overall: 89,
	wage: 12000000,
	contractYears: 3, // hasta 2028
	value: 22000000,
	birthDate: "1992-04-30",
	nationality: "Alemania",
	birthPlace: "Mönchengladbach (Alemania)",
	youthClub: "Borussia Mönchengladbach",
	attributes: {
	technical: {
		passing: 78,
		shooting: 15,
		dribbling: 46,
		tackling: 40
	},
	mental: {
		vision: 80,
		composure: 93,
		workRate: 82,
		leadership: 90
	},
	physical: {
		pace: 50,
		stamina: 71,
		strength: 84
	}
	}
	},
	{
	id: "barca_joan_garcia",
	name: "Joan García",
	shirtNumber: 13,
	position: "GK",
	overall: 84,
	wage: 4000000,
	contractYears: 6, // hasta 2031
	value: 22000000,
	birthDate: "2001-05-04",
	nationality: "España",
	birthPlace: "Sallent (España)",
	youthClub: "RCD Espanyol",
	attributes: {
	technical: {
		passing: 70,
		shooting: 15,
		dribbling: 42,
		tackling: 38
	},
	mental: {
		vision: 76,
		composure: 84,
		workRate: 86,
		leadership: 72
	},
	physical: {
		pace: 55,
		stamina: 74,
		strength: 80
	}
	}
	},
	{
	id: "barca_szczesny",
	name: "Wojciech Szczęsny",
	shirtNumber: 25,
	position: "GK",
	overall: 85,
	wage: 6000000,
	contractYears: 2, // hasta 2027
	value: 8000000,
	birthDate: "1990-04-18",
	nationality: "Polonia",
	birthPlace: "Varsovia (Polonia)",
	youthClub: "Agrykola Warszawa",
	attributes: {
	technical: {
		passing: 68,
		shooting: 14,
		dribbling: 40,
		tackling: 38
	},
	mental: {
		vision: 72,
		composure: 86,
		workRate: 80,
		leadership: 78
	},
	physical: {
		pace: 48,
		stamina: 72,
		strength: 86
	}
	}
	},
	
	// DEFENSAS
	{
	id: "barca_balde",
	name: "Alejandro Balde",
	shirtNumber: 3,
	position: "LB",
	overall: 84,
	wage: 5000000,
	contractYears: 3, // 2028
	value: 45000000,
	birthDate: "2003-10-18",
	nationality: "España",
	birthPlace: "Barcelona (España)",
	youthClub: "FC Barcelona",
	attributes: {
	technical: {
		passing: 78,
		shooting: 55,
		dribbling: 84,
		tackling: 80
	},
	mental: {
		vision: 76,
		composure: 78,
		workRate: 88,
		leadership: 70
	},
	physical: {
		pace: 90,
		stamina: 90,
		strength: 76
	}
	}
	},
	{
	id: "barca_araujo",
	name: "Ronald Araújo",
	shirtNumber: 4,
	position: "CB",
	overall: 88,
	wage: 9000000,
	contractYears: 6, // 2031
	value: 70000000,
	birthDate: "1999-03-07",
	nationality: "Uruguay",
	birthPlace: "Rivera (Uruguay)",
	youthClub: "Boston River",
	attributes: {
	technical: {
		passing: 78,
		shooting: 48,
		dribbling: 64,
		tackling: 92
	},
	mental: {
		vision: 72,
		composure: 84,
		workRate: 94,
		leadership: 88
	},
	physical: {
		pace: 82,
		stamina: 86,
		strength: 92
	}
	}
	},
	{
	id: "barca_cubarsi",
	name: "Pau Cubarsí",
	shirtNumber: 5,
	position: "CB",
	overall: 86,
	wage: 5000000,
	contractYears: 4, // 2029
	value: 60000000,
	birthDate: "2007-01-22",
	nationality: "España",
	birthPlace: "Bescanó (España)",
	youthClub: "Girona",
	attributes: {
	technical: {
		passing: 82,
		shooting: 46,
		dribbling: 70,
		tackling: 90
	},
	mental: {
		vision: 80,
		composure: 86,
		workRate: 90,
		leadership: 78
	},
	physical: {
		pace: 74,
		stamina: 82,
		strength: 84
	}
	}
	},
	{
	id: "barca_christensen",
	name: "Andreas Christensen",
	shirtNumber: 15,
	position: "CB",
	overall: 83,
	wage: 5000000,
	contractYears: 1, // 2026
	value: 20000000,
	birthDate: "1996-04-10",
	nationality: "Dinamarca",
	birthPlace: "Lillerød (Dinamarca)",
	youthClub: "Brøndby IF",
	attributes: {
	technical: {
		passing: 78,
		shooting: 42,
		dribbling: 68,
		tackling: 86
	},
	mental: {
		vision: 72,
		composure: 82,
		workRate: 82,
		leadership: 78
	},
	physical: {
		pace: 70,
		stamina: 80,
		strength: 84
	}
	}
	},
	{
	id: "barca_gerard_martin",
	name: "Gerard Martín",
	shirtNumber: 18,
	position: "LB",
	overall: 79,
	wage: 2000000,
	contractYears: 3, // 2028
	value: 15000000,
	birthDate: "2002-02-26",
	nationality: "España",
	birthPlace: "Esplugues de Llobregat (España)",
	youthClub: "Cornellà",
	attributes: {
	technical: {
		passing: 74,
		shooting: 48,
		dribbling: 78,
		tackling: 78
	},
	mental: {
		vision: 70,
		composure: 74,
		workRate: 86,
		leadership: 68
	},
	physical: {
		pace: 84,
		stamina: 86,
		strength: 76
	}
	}
	},
	{
	id: "barca_kounde",
	name: "Jules Koundé",
	shirtNumber: 23,
	position: "RB",
	overall: 86,
	wage: 8000000,
	contractYears: 5, // 2030
	value: 55000000,
	birthDate: "1998-11-12",
	nationality: "Francia",
	birthPlace: "París (Francia)",
	youthClub: "Girondins de Bordeaux",
	attributes: {
	technical: {
		passing: 80,
		shooting: 50,
		dribbling: 78,
		tackling: 88
	},
	mental: {
		vision: 76,
		composure: 84,
		workRate: 90,
		leadership: 80
	},
	physical: {
		pace: 82,
		stamina: 86,
		strength: 82
	}
	}
	},
	{
	id: "barca_eric_garcia",
	name: "Eric García",
	shirtNumber: 24,
	position: "CB",
	overall: 82,
	wage: 4000000,
	contractYears: 1, // 2026 (según tu plantilla)
	value: 18000000,
	birthDate: "2001-01-09",
	nationality: "España",
	birthPlace: "Martorell (España)",
	youthClub: "FC Barcelona",
	attributes: {
	technical: {
		passing: 80,
		shooting: 42,
		dribbling: 70,
		tackling: 82
	},
	mental: {
		vision: 76,
		composure: 80,
		workRate: 84,
		leadership: 76
	},
	physical: {
		pace: 70,
		stamina: 80,
		strength: 78
	}
	}
	},
	
	// MEDIOCAMPISTAS
	{
	id: "barca_gavi",
	name: "Gavi",
	shirtNumber: 6,
	position: "CM",
	overall: 86,
	wage: 7000000,
	contractYears: 5, // 2030
	value: 70000000,
	birthDate: "2004-08-05",
	nationality: "España",
	birthPlace: "Los Palacios y Villafranca (España)",
	youthClub: "Real Betis",
	attributes: {
	technical: {
		passing: 86,
		shooting: 78,
		dribbling: 86,
		tackling: 80
	},
	mental: {
		vision: 86,
		composure: 82,
		workRate: 96,
		leadership: 80
	},
	physical: {
		pace: 80,
		stamina: 94,
		strength: 76
	}
	}
	},
	{
	id: "barca_pedri",
	name: "Pedri",
	shirtNumber: 8,
	position: "CM",
	overall: 88,
	wage: 9000000,
	contractYears: 5, // 2030
	value: 90000000,
	birthDate: "2002-11-25",
	nationality: "España",
	birthPlace: "Tegueste (España)",
	youthClub: "Juventud Laguna",
	attributes: {
	technical: {
		passing: 92,
		shooting: 80,
		dribbling: 92,
		tackling: 74
	},
	mental: {
		vision: 95,
		composure: 90,
		workRate: 86,
		leadership: 78
	},
	physical: {
		pace: 78,
		stamina: 86,
		strength: 72
	}
	}
	},
	{
	id: "barca_fermin",
	name: "Fermín López",
	shirtNumber: 16,
	position: "CM",
	overall: 83,
	wage: 4000000,
	contractYears: 4, // 2029
	value: 30000000,
	birthDate: "2003-05-11",
	nationality: "España",
	birthPlace: "El Campillo (España)",
	youthClub: "Real Betis",
	attributes: {
	technical: {
		passing: 84,
		shooting: 82,
		dribbling: 86,
		tackling: 60
	},
	mental: {
		vision: 82,
		composure: 80,
		workRate: 88,
		leadership: 72
	},
	physical: {
		pace: 82,
		stamina: 86,
		strength: 72
	}
	}
	},
	{
	id: "barca_casado",
	name: "Marc Casadó",
	shirtNumber: 17,
	position: "CDM",
	overall: 81,
	wage: 2500000,
	contractYears: 3, // 2028
	value: 20000000,
	birthDate: "2003-09-14",
	nationality: "España",
	birthPlace: "Sant Pere de Vilamajor (España)",
	youthClub: "CF Damm",
	attributes: {
	technical: {
		passing: 80,
		shooting: 60,
		dribbling: 74,
		tackling: 84
	},
	mental: {
		vision: 76,
		composure: 78,
		workRate: 92,
		leadership: 78
	},
	physical: {
		pace: 76,
		stamina: 88,
		strength: 78
	}
	}
	},
	{
	id: "barca_dani_olmo",
	name: "Dani Olmo",
	shirtNumber: 20,
	position: "CAM",
	overall: 85,
	wage: 7000000,
	contractYears: 5, // 2030
	value: 60000000,
	birthDate: "1998-05-07",
	nationality: "España",
	birthPlace: "Terrassa (España)",
	youthClub: "FC Barcelona",
	attributes: {
	technical: {
		passing: 88,
		shooting: 84,
		dribbling: 88,
		tackling: 64
	},
	mental: {
		vision: 88,
		composure: 84,
		workRate: 84,
		leadership: 76
	},
	physical: {
		pace: 80,
		stamina: 84,
		strength: 72
	}
	}
	},
	{
	id: "barca_de_jong",
	name: "Frenkie de Jong",
	shirtNumber: 21,
	position: "CM",
	overall: 87,
	wage: 9000000,
	contractYears: 4, // 2029
	value: 70000000,
	birthDate: "1997-05-12",
	nationality: "Países Bajos",
	birthPlace: "Arkel (Países Bajos)",
	youthClub: "Willem II",
	attributes: {
	technical: {
		passing: 92,
		shooting: 76,
		dribbling: 90,
		tackling: 80
	},
	mental: {
		vision: 92,
		composure: 88,
		workRate: 84,
		leadership: 78
	},
	physical: {
		pace: 78,
		stamina: 86,
		strength: 76
	}
	}
	},
	{
	id: "barca_marc_bernal",
	name: "Marc Bernal",
	shirtNumber: 22,
	position: "CDM",
	overall: 82,
	wage: 3000000,
	contractYears: 4, // 2029
	value: 25000000,
	birthDate: "2007-05-26",
	nationality: "España",
	birthPlace: "Berga (España)",
	youthClub: "CE Berga",
	attributes: {
	technical: {
		passing: 82,
		shooting: 66,
		dribbling: 76,
		tackling: 84
	},
	mental: {
		vision: 80,
		composure: 80,
		workRate: 88,
		leadership: 76
	},
	physical: {
		pace: 74,
		stamina: 84,
		strength: 82
	}
	}
	},
	
	// DELANTEROS
	{
	id: "barca_ferran_torres",
	name: "Ferran Torres",
	shirtNumber: 7,
	position: "LW",
	overall: 84,
	wage: 6000000,
	contractYears: 2, // 2027
	value: 45000000,
	birthDate: "2000-02-29",
	nationality: "España",
	birthPlace: "Foios (España)",
	youthClub: "Valencia CF",
	attributes: {
	technical: {
		passing: 80,
		shooting: 82,
		dribbling: 86,
		tackling: 54
	},
	mental: {
		vision: 78,
		composure: 80,
		workRate: 86,
		leadership: 70
	},
	physical: {
		pace: 86,
		stamina: 86,
		strength: 72
	}
	}
	},
	{
	id: "barca_lewandowski",
	name: "Robert Lewandowski",
	shirtNumber: 9,
	position: "ST",
	overall: 88,
	wage: 12000000,
	contractYears: 1, // 2026
	value: 15000000,
	birthDate: "1988-08-21",
	nationality: "Polonia",
	birthPlace: "Varsovia (Polonia)",
	youthClub: "MKS Varsovia Warszawa",
	attributes: {
	technical: {
		passing: 82,
		shooting: 95,
		dribbling: 82,
		tackling: 50
	},
	mental: {
		vision: 84,
		composure: 95,
		workRate: 84,
		leadership: 88
	},
	physical: {
		pace: 76,
		stamina: 80,
		strength: 86
	}
	}
	},
	{
	id: "barca_lamine_yamal",
	name: "Lamine Yamal",
	shirtNumber: 10,
	position: "RW",
	overall: 90,
	wage: 8000000,
	contractYears: 6, // 2031
	value: 120000000,
	birthDate: "2007-07-13",
	nationality: "España",
	birthPlace: "Esplugues de Llobregat (España)",
	youthClub: "FC Barcelona",
	attributes: {
	technical: {
		passing: 90,
		shooting: 88,
		dribbling: 96,
		tackling: 56
	},
	mental: {
		vision: 92,
		composure: 86,
		workRate: 84,
		leadership: 72
	},
	physical: {
		pace: 92,
		stamina: 86,
		strength: 70
	}
	}
	},
	{
	id: "barca_raphinha",
	name: "Raphinha",
	shirtNumber: 11,
	position: "RW",
	overall: 85,
	wage: 7000000,
	contractYears: 3, // 2028
	value: 50000000,
	birthDate: "1996-12-14",
	nationality: "Brasil",
	birthPlace: "Porto Alegre (Brasil)",
	youthClub: "Avaí",
	attributes: {
	technical: {
		passing: 84,
		shooting: 84,
		dribbling: 90,
		tackling: 52
	},
	mental: {
		vision: 82,
		composure: 82,
		workRate: 86,
		leadership: 70
	},
	physical: {
		pace: 88,
		stamina: 84,
		strength: 72
	}
	}
	},
	{
	id: "barca_rashford",
	name: "Marcus Rashford",
	shirtNumber: 14,
	position: "LW",
	overall: 86,
	wage: 9000000,
	contractYears: 3, // aprox, sin año definido en tu plantilla
	value: 65000000,
	birthDate: "1997-10-31",
	nationality: "Inglaterra",
	birthPlace: "Mánchester (Inglaterra)",
	youthClub: "Manchester United",
	attributes: {
	technical: {
		passing: 80,
		shooting: 86,
		dribbling: 88,
		tackling: 50
	},
	mental: {
		vision: 80,
		composure: 82,
		workRate: 84,
		leadership: 74
	},
	physical: {
		pace: 90,
		stamina: 84,
		strength: 78
	}
	}
	},
	{
	id: "barca_roony_bardghji",
	name: "Roony Bardghji",
	shirtNumber: 28,
	position: "RW",
	overall: 82,
	wage: 3000000,
	contractYears: 4, // 2029
	value: 30000000,
	birthDate: "2005-11-15",
	nationality: "Suecia",
	birthPlace: "Kuwait City (Kuwait)",
	youthClub: "Malmö FF",
	attributes: {
	technical: {
		passing: 80,
		shooting: 80,
		dribbling: 88,
		tackling: 50
	},
	mental: {
		vision: 80,
		composure: 78,
		workRate: 84,
		leadership: 68
	},
	physical: {
		pace: 88,
		stamina: 82,
		strength: 70
	}
	}
	}	
  ],
  
  // =======================
  // RC CELTA DE VIGO
  // =======================
  celta: [
    // PORTEROS
    {
      id: "celta_ivan_villar",
      name: "Iván Villar",
      shirtNumber: 1,
      position: "GK",
      overall: 77,
      wage: 1800000,
      contractYears: 2, // hasta 2027
      value: 7000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 66,
          shooting: 14,
          dribbling: 40,
          tackling: 30
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 82,
          leadership: 72
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 78
        }
      }
    },
    {
      id: "celta_ionut_radu",
      name: "Ionuț Radu",
      shirtNumber: 13,
      position: "GK",
      overall: 78,
      wage: 2200000,
      contractYears: 4, // hasta 2029
      value: 9000000,
      birthDate: "1997-01-01",
      nationality: "Rumanía",
      birthPlace: "Rumanía",
      youthClub: "Venezia FC",
      attributes: {
        technical: {
          passing: 68,
          shooting: 14,
          dribbling: 40,
          tackling: 30
        },
        mental: {
          vision: 72,
          composure: 80,
          workRate: 82,
          leadership: 74
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 80
        }
      }
    },
    {
      id: "celta_marc_vidal",
      name: "Marc Vidal",
      shirtNumber: 25,
      position: "GK",
      overall: 75,
      wage: 1200000,
      contractYears: 3, // hasta 2028
      value: 4000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Barcelona Atlètic",
      attributes: {
        technical: {
          passing: 64,
          shooting: 12,
          dribbling: 38,
          tackling: 26
        },
        mental: {
          vision: 66,
          composure: 72,
          workRate: 80,
          leadership: 60
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 76
        }
      }
    },

    // DEFENSAS
    {
      id: "celta_starfelt",
      name: "Carl Starfelt",
      shirtNumber: 2,
      position: "CB",
      overall: 79,
      wage: 2500000,
      contractYears: 2, // hasta 2027
      value: 10000000,
      birthDate: "1995-01-01",
      nationality: "Suecia",
      birthPlace: "Suecia",
      youthClub: "Celtic FC",
      attributes: {
        technical: {
          passing: 72,
          shooting: 46,
          dribbling: 66,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 76,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 84
        }
      }
    },
    {
      id: "celta_mingueza",
      name: "Óscar Mingueza",
      shirtNumber: 3,
      position: "CB",
      overall: 78,
      wage: 2300000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "FC Barcelona",
      attributes: {
        technical: {
          passing: 76,
          shooting: 50,
          dribbling: 74,
          tackling: 80
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "celta_sergio_carreira",
      name: "Sergio Carreira",
      shirtNumber: 5,
      position: "RB",
      overall: 76,
      wage: 1500000,
      contractYears: 4, // hasta 2029
      value: 7000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 72,
          shooting: 50,
          dribbling: 76,
          tackling: 78
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "celta_manu_fernandez",
      name: "Manu Fernández",
      shirtNumber: 12,
      position: "CB",
      overall: 75,
      wage: 1300000,
      contractYears: 3, // hasta 2028
      value: 6000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 70,
          shooting: 44,
          dribbling: 64,
          tackling: 78
        },
        mental: {
          vision: 68,
          composure: 70,
          workRate: 82,
          leadership: 62
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "celta_javi_rueda",
      name: "Javi Rueda",
      shirtNumber: 17,
      position: "RB",
      overall: 75,
      wage: 1300000,
      contractYears: 4, // hasta 2029
      value: 6500000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Madrid Castilla",
      attributes: {
        technical: {
          passing: 72,
          shooting: 50,
          dribbling: 76,
          tackling: 76
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 62
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "celta_marcos_alonso",
      name: "Marcos Alonso",
      shirtNumber: 20,
      position: "LB",
      overall: 78,
      wage: 3000000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1991-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Madrid",
      attributes: {
        technical: {
          passing: 78,
          shooting: 70,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 76,
          composure: 80,
          workRate: 80,
          leadership: 76
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "celta_ristic",
      name: "Mihailo Ristić",
      shirtNumber: 21,
      position: "LB",
      overall: 77,
      wage: 2500000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "1995-01-01",
      nationality: "Serbia",
      birthPlace: "Serbia",
      youthClub: "Benfica",
      attributes: {
        technical: {
          passing: 76,
          shooting: 64,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 74,
          composure: 76,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "celta_carlos_dominguez",
      name: "Carlos Domínguez",
      shirtNumber: 24,
      position: "CB",
      overall: 75,
      wage: 1400000,
      contractYears: 3, // hasta 2028
      value: 6000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 70,
          shooting: 44,
          dribbling: 64,
          tackling: 78
        },
        mental: {
          vision: 68,
          composure: 70,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "celta_yoel_lago",
      name: "Yoel Lago",
      shirtNumber: 29,
      position: "CB",
      overall: 72,
      wage: 800000,
      contractYears: 4, // hasta 2029
      value: 3500000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 66,
          workRate: 80,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 74
        }
      }
    },
    {
      id: "celta_javi_rodriguez",
      name: "Javi Rodríguez",
      shirtNumber: 32,
      position: "RB",
      overall: 73,
      wage: 900000,
      contractYears: 3, // hasta 2028
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 70,
          shooting: 48,
          dribbling: 74,
          tackling: 72
        },
        mental: {
          vision: 68,
          composure: 68,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 72
        }
      }
    },

    // MEDIOCAMPISTAS
    {
      id: "celta_ilaix",
      name: "Ilaix Moriba",
      shirtNumber: 6,
      position: "CM",
      overall: 79,
      wage: 2500000,
      contractYears: 4, // hasta 2029
      value: 20000000,
      birthDate: "2003-01-01",
      nationality: "Guinea",
      birthPlace: "Guinea",
      youthClub: "RB Leipzig",
      attributes: {
        technical: {
          passing: 80,
          shooting: 78,
          dribbling: 82,
          tackling: 76
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "celta_fran_beltran",
      name: "Fran Beltrán",
      shirtNumber: 8,
      position: "CDM",
      overall: 81,
      wage: 2800000,
      contractYears: 1, // hasta 2026
      value: 23000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Rayo Vallecano",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 80,
          tackling: 84
        },
        mental: {
          vision: 82,
          composure: 82,
          workRate: 88,
          leadership: 74
        },
        physical: {
          pace: 74,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "celta_cervi",
      name: "Franco Cervi",
      shirtNumber: 11,
      position: "LW",
      overall: 79,
      wage: 2600000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1994-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Benfica",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 84,
          tackling: 52
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "celta_damian_rodriguez",
      name: "Damián Rodríguez",
      shirtNumber: 14,
      position: "CM",
      overall: 74,
      wage: 900000,
      contractYears: 3, // hasta 2028
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 74,
          shooting: 70,
          dribbling: 76,
          tackling: 70
        },
        mental: {
          vision: 72,
          composure: 70,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "celta_bryan_zaragoza",
      name: "Bryan Zaragoza",
      shirtNumber: 15,
      position: "LW",
      overall: 80,
      wage: 3000000,
      contractYears: 1, // hasta 2026
      value: 20000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Granada / Bayern",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 88,
          tackling: 52
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 90,
          stamina: 82,
          strength: 68
        }
      }
    },
    {
      id: "celta_miguel_roman",
      name: "Miguel Román",
      shirtNumber: 16,
      position: "CM",
      overall: 74,
      wage: 900000,
      contractYears: 3, // hasta 2028
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 74,
          shooting: 70,
          dribbling: 76,
          tackling: 70
        },
        mental: {
          vision: 72,
          composure: 70,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "celta_swedberg",
      name: "Williot Swedberg",
      shirtNumber: 19,
      position: "CAM",
      overall: 77,
      wage: 1800000,
      contractYears: 4, // hasta 2029
      value: 10000000,
      birthDate: "2004-01-01",
      nationality: "Suecia",
      birthPlace: "Suecia",
      youthClub: "Hammarby IF",
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
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "celta_hugo_sotelo",
      name: "Hugo Sotelo",
      shirtNumber: 22,
      position: "CM",
      overall: 76,
      wage: 1200000,
      contractYears: 3, // hasta 2028
      value: 9000000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 78,
          shooting: 74,
          dribbling: 80,
          tackling: 72
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "celta_hugo_alvarez",
      name: "Hugo Álvarez",
      shirtNumber: 23,
      position: "CM",
      overall: 75,
      wage: 1100000,
      contractYears: 3, // hasta 2028
      value: 7000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 76,
          shooting: 72,
          dribbling: 78,
          tackling: 70
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 84,
          leadership: 62
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "celta_jones_elabdellaoui",
      name: "Jones El-Abdellaoui",
      shirtNumber: 39,
      position: "CAM",
      overall: 73,
      wage: 800000,
      contractYears: 4, // hasta 2029
      value: 4000000,
      birthDate: "2006-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Vålerenga Fotball",
      attributes: {
        technical: {
          passing: 74,
          shooting: 72,
          dribbling: 80,
          tackling: 60
        },
        mental: {
          vision: 74,
          composure: 68,
          workRate: 80,
          leadership: 58
        },
        physical: {
          pace: 78,
          stamina: 78,
          strength: 66
        }
      }
    },

    // DELANTEROS
    {
      id: "celta_borja_iglesias",
      name: "Borja Iglesias",
      shirtNumber: 7,
      position: "ST",
      overall: 81,
      wage: 3500000,
      contractYears: 3, // hasta 2028
      value: 16000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 78,
          shooting: 84,
          dribbling: 78,
          tackling: 48
        },
        mental: {
          vision: 78,
          composure: 80,
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
      id: "celta_jutgla",
      name: "Ferrán Jutglà",
      shirtNumber: 9,
      position: "ST",
      overall: 79,
      wage: 2500000,
      contractYears: 4, // hasta 2029
      value: 15000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Club Brujas",
      attributes: {
        technical: {
          passing: 76,
          shooting: 82,
          dribbling: 80,
          tackling: 46
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 78
        }
      }
    },
    {
      id: "celta_iago_aspas",
      name: "Iago Aspas",
      shirtNumber: 10,
      position: "ST",
      overall: 84,
      wage: 4000000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1987-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 86,
          shooting: 86,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 88,
          composure: 86,
          workRate: 82,
          leadership: 86
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "celta_pablo_duran",
      name: "Pablo Durán",
      shirtNumber: 18,
      position: "ST",
      overall: 76,
      wage: 1500000,
      contractYears: 2, // hasta 2027
      value: 8000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 74,
          shooting: 80,
          dribbling: 78,
          tackling: 46
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 76
        }
      }
    }
  ],
  
    // =======================
  // ELCHE CF
  // =======================
  elche: [
    // PORTEROS
    {
      id: "elche_dituro",
      name: "Matías Dituro",
      shirtNumber: 1,
      position: "GK",
      overall: 77,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "1987-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Fatih Karagümrük S.K.",
      attributes: {
        technical: {
          passing: 66,
          shooting: 14,
          dribbling: 38,
          tackling: 30
        },
        mental: {
          vision: 70,
          composure: 80,
          workRate: 80,
          leadership: 78
        },
        physical: {
          pace: 55,
          stamina: 72,
          strength: 78
        }
      }
    },
    {
      id: "elche_inaki_pena",
      name: "Iñaki Peña",
      shirtNumber: 13,
      position: "GK",
      overall: 78,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "FC Barcelona",
      attributes: {
        technical: {
          passing: 68,
          shooting: 12,
          dribbling: 38,
          tackling: 28
        },
        mental: {
          vision: 70,
          composure: 80,
          workRate: 82,
          leadership: 72
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 78
        }
      }
    },
    {
      id: "elche_iturbe",
      name: "Alejandro Iturbe",
      shirtNumber: 45,
      position: "GK",
      overall: 75,
      wage: 1200000,
      contractYears: 4, // hasta 2029
      value: 5000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Atlético de Madrid B",
      attributes: {
        technical: {
          passing: 64,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 66,
          composure: 72,
          workRate: 80,
          leadership: 60
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 76
        }
      }
    },

    // DEFENSAS
    {
      id: "elche_pedrosa",
      name: "Adrià Pedrosa",
      shirtNumber: 3,
      position: "LB",
      overall: 79,
      wage: 2500000,
      contractYears: 1, // hasta 2026
      value: 14000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Sevilla FC",
      attributes: {
        technical: {
          passing: 78,
          shooting: 64,
          dribbling: 80,
          tackling: 78
        },
        mental: {
          vision: 74,
          composure: 78,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 84,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "elche_bambo_diaby",
      name: "Bambo Diaby",
      shirtNumber: 4,
      position: "CB",
      overall: 76,
      wage: 1800000,
      contractYears: 2, // hasta 2027
      value: 9000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Sheffield Wednesday",
      attributes: {
        technical: {
          passing: 70,
          shooting: 46,
          dribbling: 64,
          tackling: 80
        },
        mental: {
          vision: 68,
          composure: 72,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 84
        }
      }
    },
    {
      id: "elche_bigas",
      name: "Pedro Bigas",
      shirtNumber: 6,
      position: "CB",
      overall: 78,
      wage: 2200000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1990-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "SD Eibar",
      attributes: {
        technical: {
          passing: 74,
          shooting: 50,
          dribbling: 66,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 80,
          workRate: 82,
          leadership: 76
        },
        physical: {
          pace: 70,
          stamina: 78,
          strength: 84
        }
      }
    },
    {
      id: "elche_alvaro_nunez",
      name: "Álvaro Núñez",
      shirtNumber: 15,
      position: "RB",
      overall: 74,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "SD Amorebieta",
      attributes: {
        technical: {
          passing: 72,
          shooting: 50,
          dribbling: 76,
          tackling: 74
        },
        mental: {
          vision: 68,
          composure: 70,
          workRate: 84,
          leadership: 62
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "elche_petrot",
      name: "Léo Pétrot",
      shirtNumber: 21,
      position: "CB",
      overall: 76,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "1997-01-01",
      nationality: "Francia",
      birthPlace: "Francia",
      youthClub: "AS Saint-Étienne",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 66,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "elche_affengruber",
      name: "David Affengruber",
      shirtNumber: 22,
      position: "CB",
      overall: 77,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "2001-01-01",
      nationality: "Austria",
      birthPlace: "Austria",
      youthClub: "SK Sturm Graz",
      attributes: {
        technical: {
          passing: 74,
          shooting: 46,
          dribbling: 66,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "elche_chust",
      name: "Víctor Chust",
      shirtNumber: 23,
      position: "CB",
      overall: 77,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Cádiz CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 44,
          dribbling: 66,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "elche_niculaesei",
      name: "Albert Niculâesei",
      shirtNumber: 27,
      position: "CB",
      overall: 70,
      wage: 500000,
      contractYears: 4, // hasta 2029
      value: 3000000,
      birthDate: "2008-01-01",
      nationality: "Rumanía",
      birthPlace: "Rumanía",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 64,
          shooting: 38,
          dribbling: 60,
          tackling: 72
        },
        mental: {
          vision: 62,
          composure: 64,
          workRate: 80,
          leadership: 56
        },
        physical: {
          pace: 72,
          stamina: 76,
          strength: 72
        }
      }
    },
    {
      id: "elche_hector_fort",
      name: "Héctor Fort",
      shirtNumber: 39,
      position: "RB",
      overall: 73,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "2006-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "FC Barcelona",
      attributes: {
        technical: {
          passing: 70,
          shooting: 46,
          dribbling: 74,
          tackling: 72
        },
        mental: {
          vision: 68,
          composure: 68,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 70
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "elche_federico_redondo",
      name: "Federico Redondo",
      shirtNumber: 5,
      position: "CDM",
      overall: 80,
      wage: 3000000,
      contractYears: 5, // hasta 2030
      value: 22000000,
      birthDate: "2003-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Inter Miami",
      attributes: {
        technical: {
          passing: 84,
          shooting: 76,
          dribbling: 80,
          tackling: 84
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "elche_yago_santiago",
      name: "Yago Santiago",
      shirtNumber: 7,
      position: "RW",
      overall: 75,
      wage: 1400000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Tottenham Hotspur",
      attributes: {
        technical: {
          passing: 78,
          shooting: 76,
          dribbling: 82,
          tackling: 50
        },
        mental: {
          vision: 76,
          composure: 72,
          workRate: 82,
          leadership: 62
        },
        physical: {
          pace: 80,
          stamina: 78,
          strength: 68
        }
      }
    },
    {
      id: "elche_marc_aguado",
      name: "Marc Aguado",
      shirtNumber: 8,
      position: "CM",
      overall: 77,
      wage: 1800000,
      contractYears: 3, // hasta 2028
      value: 10000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Zaragoza",
      attributes: {
        technical: {
          passing: 82,
          shooting: 74,
          dribbling: 80,
          tackling: 76
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "elche_german_valera",
      name: "Germán Valera",
      shirtNumber: 11,
      position: "RW",
      overall: 78,
      wage: 2000000,
      contractYears: 2, // hasta 2027
      value: 12000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 84,
          tackling: 52
        },
        mental: {
          vision: 80,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "elche_febas",
      name: "Aleix Febas",
      shirtNumber: 14,
      position: "CM",
      overall: 77,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Málaga CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 74,
          dribbling: 82,
          tackling: 70
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 70
        }
      }
    },
    {
      id: "elche_martim_neto",
      name: "Martim Neto",
      shirtNumber: 16,
      position: "CM",
      overall: 76,
      wage: 1500000,
      contractYears: 3, // hasta 2028
      value: 9000000,
      birthDate: "2003-01-01",
      nationality: "Portugal",
      birthPlace: "Portugal",
      youthClub: "SL Benfica",
      attributes: {
        technical: {
          passing: 80,
          shooting: 74,
          dribbling: 80,
          tackling: 72
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "elche_josan",
      name: "Josan Ferrández",
      shirtNumber: 17,
      position: "RW",
      overall: 76,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "1989-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 80,
          shooting: 76,
          dribbling: 82,
          tackling: 52
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 84,
          leadership: 78
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "elche_chetauya",
      name: "John Chetauya",
      shirtNumber: 18,
      position: "CDM",
      overall: 75,
      wage: 1400000,
      contractYears: 3, // hasta 2028
      value: 8000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 70,
          dribbling: 76,
          tackling: 82
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 86,
          leadership: 66
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 78
        }
      }
    },
    {
      id: "elche_diangana",
      name: "Grady Diangana",
      shirtNumber: 19,
      position: "RW",
      overall: 79,
      wage: 2500000,
      contractYears: 2, // hasta 2027
      value: 14000000,
      birthDate: "1998-01-01",
      nationality: "RD del Congo",
      birthPlace: "RD del Congo",
      youthClub: "West Bromwich Albion",
      attributes: {
        technical: {
          passing: 82,
          shooting: 80,
          dribbling: 86,
          tackling: 52
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "elche_mendoza",
      name: "Rodrigo Mendoza",
      shirtNumber: 30,
      position: "CM",
      overall: 72,
      wage: 700000,
      contractYears: 3, // hasta 2028
      value: 3500000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 68,
          dribbling: 74,
          tackling: 66
        },
        mental: {
          vision: 70,
          composure: 68,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 70
        }
      }
    },
    {
      id: "elche_ali_houary",
      name: "Ali Houary",
      shirtNumber: 35,
      position: "RW",
      overall: 72,
      wage: 700000,
      contractYears: 3, // hasta 2028
      value: 3500000,
      birthDate: "2005-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 70,
          dribbling: 78,
          tackling: 60
        },
        mental: {
          vision: 72,
          composure: 68,
          workRate: 80,
          leadership: 58
        },
        physical: {
          pace: 78,
          stamina: 78,
          strength: 68
        }
      }
    },

    // DELANTEROS
    {
      id: "elche_andre_silva",
      name: "André Silva",
      shirtNumber: 9,
      position: "ST",
      overall: 81,
      wage: 3500000,
      contractYears: 1, // hasta 2026
      value: 22000000,
      birthDate: "1995-01-01",
      nationality: "Portugal",
      birthPlace: "Portugal",
      youthClub: "RB Leipzig",
      attributes: {
        technical: {
          passing: 78,
          shooting: 86,
          dribbling: 80,
          tackling: 46
        },
        mental: {
          vision: 78,
          composure: 82,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 80
        }
      }
    },
    {
      id: "elche_rafa_mir",
      name: "Rafa Mir",
      shirtNumber: 10,
      position: "ST",
      overall: 79,
      wage: 2800000,
      contractYears: 1, // hasta 2026
      value: 16000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Sevilla FC",
      attributes: {
        technical: {
          passing: 74,
          shooting: 84,
          dribbling: 78,
          tackling: 46
        },
        mental: {
          vision: 74,
          composure: 78,
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
      id: "elche_alvaro_rodriguez",
      name: "Álvaro Rodríguez",
      shirtNumber: 20,
      position: "ST",
      overall: 76,
      wage: 1800000,
      contractYears: 4, // hasta 2029
      value: 12000000,
      birthDate: "2004-01-01",
      nationality: "Uruguay",
      birthPlace: "Uruguay",
      youthClub: "Real Madrid Castilla",
      attributes: {
        technical: {
          passing: 72,
          shooting: 80,
          dribbling: 78,
          tackling: 44
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 78
        }
      }
    },
    {
      id: "elche_adam_boayar",
      name: "Adam Boayar",
      shirtNumber: 32,
      position: "LW",
      overall: 73,
      wage: 900000,
      contractYears: 2, // hasta 2027
      value: 5000000,
      birthDate: "2005-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 74,
          dribbling: 80,
          tackling: 44
        },
        mental: {
          vision: 72,
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
    }
  ],
  
    // =======================
  // RCD ESPANYOL
  // =======================
  espanyol: [
    // PORTEROS
    {
      id: "espanyol_angel_fortuno",
      name: "Ángel Fortuño",
      shirtNumber: 1,
      position: "GK",
      overall: 74,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 62,
          shooting: 10,
          dribbling: 34,
          tackling: 24
        },
        mental: {
          vision: 64,
          composure: 70,
          workRate: 80,
          leadership: 60
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 74
        }
      }
    },
    {
      id: "espanyol_dmitrovic",
      name: "Marko Dmitrović",
      shirtNumber: 13,
      position: "GK",
      overall: 79,
      wage: 2200000,
      contractYears: 3, // hasta 2028
      value: 9000000,
      birthDate: "1992-01-01",
      nationality: "Serbia",
      birthPlace: "Serbia",
      youthClub: "CD Leganés",
      attributes: {
        technical: {
          passing: 66,
          shooting: 12,
          dribbling: 36,
          tackling: 28
        },
        mental: {
          vision: 70,
          composure: 82,
          workRate: 82,
          leadership: 80
        },
        physical: {
          pace: 56,
          stamina: 74,
          strength: 82
        }
      }
    },
    {
      id: "espanyol_pol_tristan",
      name: "Pol Tristán",
      shirtNumber: 30,
      position: "GK",
      overall: 73,
      wage: 700000,
      contractYears: 1, // hasta 2026
      value: 3000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 60,
          shooting: 10,
          dribbling: 34,
          tackling: 24
        },
        mental: {
          vision: 62,
          composure: 68,
          workRate: 78,
          leadership: 58
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 72
        }
      }
    },

    // DEFENSAS
    {
      id: "espanyol_ruben_sanchez",
      name: "Rubén Sánchez",
      shirtNumber: 2,
      position: "RB",
      overall: 76,
      wage: 1200000,
      contractYears: 2, // hasta 2027
      value: 7000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 72,
          shooting: 52,
          dribbling: 76,
          tackling: 76
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "espanyol_calero",
      name: "Fernando Calero",
      shirtNumber: 5,
      position: "CB",
      overall: 77,
      wage: 1600000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Valladolid CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 64,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 76,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 70,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "espanyol_cabrera",
      name: "Leandro Cabrera",
      shirtNumber: 6,
      position: "CB",
      overall: 78,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1991-01-01",
      nationality: "Uruguay",
      birthPlace: "Uruguay",
      youthClub: "Getafe CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 46,
          dribbling: 64,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 84,
          leadership: 82
        },
        physical: {
          pace: 68,
          stamina: 80,
          strength: 84
        }
      }
    },
    {
      id: "espanyol_salinas",
      name: "José Salinas",
      shirtNumber: 12,
      position: "LB",
      overall: 76,
      wage: 1300000,
      contractYears: 3, // hasta 2028
      value: 7000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 54,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "espanyol_miguel_rubio",
      name: "Miguel Rubio",
      shirtNumber: 15,
      position: "CB",
      overall: 76,
      wage: 1400000,
      contractYears: 3, // hasta 2028
      value: 8000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Granada CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 46,
          dribbling: 64,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "espanyol_carlos_romero",
      name: "Carlos Romero",
      shirtNumber: 22,
      position: "LB",
      overall: 74,
      wage: 1000000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 50,
          dribbling: 76,
          tackling: 74
        },
        mental: {
          vision: 68,
          composure: 70,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "espanyol_el_hilali",
      name: "Omar El Hilali",
      shirtNumber: 23,
      position: "RB",
      overall: 75,
      wage: 1100000,
      contractYears: 2, // hasta 2027
      value: 6000000,
      birthDate: "2003-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 72,
          shooting: 50,
          dribbling: 76,
          tackling: 76
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 62
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "espanyol_riedel",
      name: "Clemens Riedel",
      shirtNumber: 38,
      position: "CB",
      overall: 76,
      wage: 1400000,
      contractYears: 4, // hasta 2029
      value: 9000000,
      birthDate: "2003-01-01",
      nationality: "Alemania",
      birthPlace: "Alemania",
      youthClub: "Darmstadt 98",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 64,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 82
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "espanyol_urko_gonzalez",
      name: "Urko González",
      shirtNumber: 4,
      position: "CDM",
      overall: 77,
      wage: 1500000,
      contractYears: 5, // hasta 2030
      value: 11000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 80,
          shooting: 70,
          dribbling: 76,
          tackling: 82
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "espanyol_edu_exposito",
      name: "Edu Expósito",
      shirtNumber: 8,
      position: "CM",
      overall: 78,
      wage: 2000000,
      contractYears: 2, // hasta 2027
      value: 12000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "SD Eibar",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 80,
          tackling: 72
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "espanyol_pol_lozano",
      name: "Pol Lozano",
      shirtNumber: 10,
      position: "CM",
      overall: 77,
      wage: 1700000,
      contractYears: 2, // hasta 2027
      value: 10000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 80,
          shooting: 74,
          dribbling: 78,
          tackling: 74
        },
        mental: {
          vision: 80,
          composure: 76,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "espanyol_terrats",
      name: "Ramón Terrats",
      shirtNumber: 14,
      position: "CM",
      overall: 77,
      wage: 1700000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "espanyol_koleosho",
      name: "Luca Koleosho",
      shirtNumber: 16,
      position: "LW",
      overall: 76,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 10000000,
      birthDate: "2004-01-01",
      nationality: "Italia",
      birthPlace: "Italia",
      youthClub: "Burnley FC",
      attributes: {
        technical: {
          passing: 78,
          shooting: 76,
          dribbling: 84,
          tackling: 48
        },
        mental: {
          vision: 76,
          composure: 72,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 86,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "espanyol_jofre",
      name: "Jofre Carreras",
      shirtNumber: 17,
      position: "RW",
      overall: 75,
      wage: 1300000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 78,
          shooting: 74,
          dribbling: 82,
          tackling: 48
        },
        mental: {
          vision: 76,
          composure: 72,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "espanyol_pickel",
      name: "Charles Pickel",
      shirtNumber: 18,
      position: "CDM",
      overall: 78,
      wage: 2000000,
      contractYears: 2, // hasta 2027
      value: 12000000,
      birthDate: "1997-01-01",
      nationality: "RD del Congo",
      birthPlace: "RD del Congo",
      youthClub: "US Cremonese",
      attributes: {
        technical: {
          passing: 78,
          shooting: 70,
          dribbling: 76,
          tackling: 84
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 82
        }
      }
    },
    {
      id: "espanyol_antoniu_roca",
      name: "Antoniu Roca",
      shirtNumber: 20,
      position: "RW",
      overall: 74,
      wage: 1000000,
      contractYears: 2, // hasta 2027
      value: 6000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 76,
          shooting: 72,
          dribbling: 80,
          tackling: 46
        },
        mental: {
          vision: 74,
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
      id: "espanyol_dolan",
      name: "Tyrhys Dolan",
      shirtNumber: 24,
      position: "LW",
      overall: 76,
      wage: 1500000,
      contractYears: 3, // hasta 2028
      value: 10000000,
      birthDate: "2001-01-01",
      nationality: "Inglaterra",
      birthPlace: "Inglaterra",
      youthClub: "Blackburn Rovers",
      attributes: {
        technical: {
          passing: 78,
          shooting: 76,
          dribbling: 84,
          tackling: 48
        },
        mental: {
          vision: 76,
          composure: 74,
          workRate: 82,
          leadership: 62
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "espanyol_javi_hernandez",
      name: "Javi Hernández",
      shirtNumber: 27,
      position: "CM",
      overall: 72,
      wage: 800000,
      contractYears: 3, // hasta 2028
      value: 4000000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 74,
          shooting: 68,
          dribbling: 74,
          tackling: 68
        },
        mental: {
          vision: 72,
          composure: 70,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 70
        }
      }
    },

    // DELANTEROS
    {
      id: "espanyol_puado",
      name: "Javi Puado",
      shirtNumber: 7,
      position: "ST",
      overall: 80,
      wage: 2800000,
      contractYears: 5, // hasta 2030
      value: 20000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 80,
          shooting: 82,
          dribbling: 82,
          tackling: 50
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 86,
          leadership: 74
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "espanyol_roberto_fernandez",
      name: "Roberto Fernández",
      shirtNumber: 9,
      position: "ST",
      overall: 78,
      wage: 2200000,
      contractYears: 6, // hasta 2031
      value: 18000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Sporting de Braga",
      attributes: {
        technical: {
          passing: 76,
          shooting: 82,
          dribbling: 78,
          tackling: 46
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "espanyol_pere_milla",
      name: "Pere Milla",
      shirtNumber: 11,
      position: "ST",
      overall: 77,
      wage: 1800000,
      contractYears: 2, // hasta 2027
      value: 8000000,
      birthDate: "1992-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 78,
          shooting: 80,
          dribbling: 78,
          tackling: 48
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "espanyol_kike_garcia",
      name: "Kike García",
      shirtNumber: 19,
      position: "ST",
      overall: 76,
      wage: 2000000,
      contractYears: 2, // hasta 2027
      value: 6000000,
      birthDate: "1989-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Deportivo Alavés",
      attributes: {
        technical: {
          passing: 74,
          shooting: 80,
          dribbling: 74,
          tackling: 46
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 84,
          leadership: 78
        },
        physical: {
          pace: 70,
          stamina: 82,
          strength: 82
        }
      }
    }
  ],

  // =======================
  // GETAFE CF
  // =======================
  getafe: [
    // PORTEROS
    {
      id: "getafe_letacek",
      name: "Jiří Letáček",
      shirtNumber: 1,
      position: "GK",
      overall: 76,
      wage: 1400000,
      contractYears: 3, // hasta 2028
      value: 6000000,
      birthDate: "1999-01-01",
      nationality: "República Checa",
      birthPlace: "República Checa",
      youthClub: "FC Baník Ostrava",
      attributes: {
        technical: {
          passing: 64,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 66,
          composure: 74,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 78
        }
      }
    },
    {
      id: "getafe_david_soria",
      name: "David Soria",
      shirtNumber: 13,
      position: "GK",
      overall: 79,
      wage: 2200000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Sevilla FC",
      attributes: {
        technical: {
          passing: 66,
          shooting: 12,
          dribbling: 38,
          tackling: 28
        },
        mental: {
          vision: 70,
          composure: 82,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 56,
          stamina: 74,
          strength: 82
        }
      }
    },
    {
      id: "getafe_jorge_benito",
      name: "Jorge Benito",
      shirtNumber: 35,
      position: "GK",
      overall: 72,
      wage: 600000,
      contractYears: 2, // hasta 2027
      value: 3000000,
      birthDate: "2006-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 60,
          shooting: 8,
          dribbling: 34,
          tackling: 22
        },
        mental: {
          vision: 62,
          composure: 66,
          workRate: 78,
          leadership: 54
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 70
        }
      }
    },
    {
      id: "getafe_diego_ferrer",
      name: "Diego Ferrer",
      shirtNumber: 42,
      position: "GK",
      overall: 71,
      wage: 500000,
      contractYears: 2, // hasta 2027
      value: 2500000,
      birthDate: "2007-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 58,
          shooting: 8,
          dribbling: 32,
          tackling: 22
        },
        mental: {
          vision: 60,
          composure: 64,
          workRate: 78,
          leadership: 52
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 68
        }
      }
    },

    // DEFENSAS
    {
      id: "getafe_djene",
      name: "Djené Dakonam",
      shirtNumber: 2,
      position: "CB",
      overall: 80,
      wage: 2500000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1992-01-01",
      nationality: "Togo",
      birthPlace: "Togo",
      youthClub: "Sint-Truidense",
      attributes: {
        technical: {
          passing: 74,
          shooting: 46,
          dribbling: 66,
          tackling: 86
        },
        mental: {
          vision: 72,
          composure: 80,
          workRate: 88,
          leadership: 84
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 86
        }
      }
    },
    {
      id: "getafe_abqar",
      name: "Abdel Abqar",
      shirtNumber: 3,
      position: "CB",
      overall: 78,
      wage: 1800000,
      contractYears: 3, // hasta 2028
      value: 10000000,
      birthDate: "1999-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Deportivo Alavés",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 64,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 76,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "getafe_nyon",
      name: "Allan Nyon",
      shirtNumber: 12,
      position: "CB",
      overall: 75,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "1988-01-01",
      nationality: "Camerún",
      birthPlace: "Camerún",
      youthClub: "Libre",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 60,
          tackling: 80
        },
        mental: {
          vision: 68,
          composure: 74,
          workRate: 80,
          leadership: 76
        },
        physical: {
          pace: 66,
          stamina: 76,
          strength: 84
        }
      }
    },
    {
      id: "getafe_diego_rico",
      name: "Diego Rico",
      shirtNumber: 16,
      position: "LB",
      overall: 77,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 76,
          shooting: 64,
          dribbling: 76,
          tackling: 78
        },
        mental: {
          vision: 74,
          composure: 76,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "getafe_kiko_femenia",
      name: "Kiko Femenía",
      shirtNumber: 17,
      position: "RB",
      overall: 76,
      wage: 1600000,
      contractYears: 2, // hasta 2027
      value: 6000000,
      birthDate: "1991-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 62,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "getafe_juan_iglesias",
      name: "Juan Iglesias",
      shirtNumber: 21,
      position: "RB",
      overall: 76,
      wage: 1400000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 74,
          shooting: 54,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "getafe_domingos_duarte",
      name: "Domingos Duarte",
      shirtNumber: 22,
      position: "CB",
      overall: 78,
      wage: 1900000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1995-01-01",
      nationality: "Portugal",
      birthPlace: "Portugal",
      youthClub: "Granada CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 64,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 76,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "getafe_davinchi",
      name: "Davinchi",
      shirtNumber: 26,
      position: "RB",
      overall: 72,
      wage: 700000,
      contractYears: 3, // hasta 2028
      value: 4000000,
      birthDate: "2007-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Recreativo de Huelva",
      attributes: {
        technical: {
          passing: 70,
          shooting: 50,
          dribbling: 76,
          tackling: 70
        },
        mental: {
          vision: 68,
          composure: 66,
          workRate: 82,
          leadership: 56
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 68
        }
      }
    },
    {
      id: "getafe_bekhoucha",
      name: "Ismael Bekhoucha",
      shirtNumber: 31,
      position: "CB",
      overall: 72,
      wage: 800000,
      contractYears: 3, // hasta 2028
      value: 4000000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 66,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 74
        }
      }
    },
    {
      id: "getafe_lucas_laso",
      name: "Lucas Laso",
      shirtNumber: 32,
      position: "CB",
      overall: 72,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 66,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 74
        }
      }
    },
    {
      id: "getafe_vilaplana",
      name: "Marc Vilaplana",
      shirtNumber: 33,
      position: "CB",
      overall: 72,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 66,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 74
        }
      }
    },
    {
      id: "getafe_tallal",
      name: "Yassin Tallal",
      shirtNumber: 39,
      position: "CB",
      overall: 71,
      wage: 700000,
      contractYears: 1, // hasta 2026
      value: 3500000,
      birthDate: "2005-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 66,
          shooting: 38,
          dribbling: 60,
          tackling: 72
        },
        mental: {
          vision: 64,
          composure: 64,
          workRate: 82,
          leadership: 56
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 72
        }
      }
    },
    {
      id: "getafe_jorge_montes",
      name: "Jorge Montes",
      shirtNumber: 41,
      position: "CB",
      overall: 72,
      wage: 800000,
      contractYears: 2, // hasta 2027
      value: 4000000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 66,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 74
        }
      }
    },
    {
      id: "getafe_tito_cordero",
      name: "\"Tito\" Cordero",
      shirtNumber: 43,
      position: "RB",
      overall: 71,
      wage: 700000,
      contractYears: 1, // hasta 2026
      value: 3500000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 68,
          shooting: 46,
          dribbling: 74,
          tackling: 70
        },
        mental: {
          vision: 66,
          composure: 64,
          workRate: 82,
          leadership: 56
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 70
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "getafe_neyou",
      name: "Yvan Neyou",
      shirtNumber: 4,
      position: "CDM",
      overall: 77,
      wage: 1700000,
      contractYears: 3, // hasta 2028
      value: 10000000,
      birthDate: "1997-01-01",
      nationality: "Camerún",
      birthPlace: "Camerún",
      youthClub: "CD Leganés",
      attributes: {
        technical: {
          passing: 80,
          shooting: 70,
          dribbling: 76,
          tackling: 84
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 82
        }
      }
    },
    {
      id: "getafe_luis_milla",
      name: "Luis Milla",
      shirtNumber: 5,
      position: "CM",
      overall: 78,
      wage: 1900000,
      contractYears: 2, // hasta 2027
      value: 11000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Granada CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 76,
          dribbling: 80,
          tackling: 78
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "getafe_mario_martin",
      name: "Mario Martín",
      shirtNumber: 6,
      position: "CM",
      overall: 74,
      wage: 900000,
      contractYears: 1, // hasta 2026
      value: 6000000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Madrid CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 70,
          dribbling: 76,
          tackling: 72
        },
        mental: {
          vision: 74,
          composure: 72,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "getafe_arambarri",
      name: "Mauro Arambarri",
      shirtNumber: 8,
      position: "CDM",
      overall: 81,
      wage: 2600000,
      contractYears: 3, // hasta 2028
      value: 22000000,
      birthDate: "1995-01-01",
      nationality: "Uruguay",
      birthPlace: "Uruguay",
      youthClub: "Boston River",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 80,
          tackling: 86
        },
        mental: {
          vision: 82,
          composure: 82,
          workRate: 88,
          leadership: 76
        },
        physical: {
          pace: 74,
          stamina: 86,
          strength: 80
        }
      }
    },
    {
      id: "getafe_javi_munoz",
      name: "Javi Muñoz",
      shirtNumber: 14,
      position: "CM",
      overall: 77,
      wage: 1600000,
      contractYears: 3, // hasta 2028
      value: 9000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "UD Las Palmas",
      attributes: {
        technical: {
          passing: 80,
          shooting: 74,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "getafe_alberto_risco",
      name: "Alberto Risco",
      shirtNumber: 30,
      position: "CM",
      overall: 70,
      wage: 600000,
      contractYears: 2, // año estimado
      value: 3000000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 72,
          shooting: 66,
          dribbling: 72,
          tackling: 66
        },
        mental: {
          vision: 70,
          composure: 66,
          workRate: 80,
          leadership: 56
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 70
        }
      }
    },
    {
      id: "getafe_solozabal",
      name: "Hugo Solozábal",
      shirtNumber: 34,
      position: "CM",
      overall: 71,
      wage: 700000,
      contractYears: 1, // hasta 2026
      value: 3500000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 74,
          shooting: 68,
          dribbling: 74,
          tackling: 68
        },
        mental: {
          vision: 72,
          composure: 68,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 70
        }
      }
    },

    // DELANTEROS
    {
      id: "getafe_juanmi",
      name: "Juanmi Jiménez",
      shirtNumber: 7,
      position: "ST",
      overall: 79,
      wage: 2400000,
      contractYears: 3, // hasta 2028
      value: 15000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Betis",
      attributes: {
        technical: {
          passing: 78,
          shooting: 84,
          dribbling: 80,
          tackling: 46
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "getafe_mayoral",
      name: "Borja Mayoral",
      shirtNumber: 9,
      position: "ST",
      overall: 80,
      wage: 2600000,
      contractYears: 2, // hasta 2027
      value: 20000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Madrid CF",
      attributes: {
        technical: {
          passing: 78,
          shooting: 86,
          dribbling: 80,
          tackling: 46
        },
        mental: {
          vision: 78,
          composure: 82,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "getafe_abu_kamara",
      name: "Abu Kamara",
      shirtNumber: 11,
      position: "ST",
      overall: 74,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "2003-01-01",
      nationality: "Inglaterra",
      birthPlace: "Inglaterra",
      youthClub: "Hull City AFC",
      attributes: {
        technical: {
          passing: 74,
          shooting: 78,
          dribbling: 80,
          tackling: 42
        },
        mental: {
          vision: 74,
          composure: 72,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "getafe_sancris",
      name: "Álex Sancris",
      shirtNumber: 18,
      position: "RW",
      overall: 74,
      wage: 1200000,
      contractYears: 3, // hasta 2028
      value: 8000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Burgos CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 76,
          dribbling: 82,
          tackling: 44
        },
        mental: {
          vision: 74,
          composure: 72,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "getafe_coba_da_costa",
      name: "Coba da Costa",
      shirtNumber: 20,
      position: "ST",
      overall: 72,
      wage: 800000,
      contractYears: 4, // hasta 2029
      value: 5000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 72,
          shooting: 76,
          dribbling: 78,
          tackling: 42
        },
        mental: {
          vision: 70,
          composure: 68,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "getafe_adrian_liso",
      name: "Adrián Liso",
      shirtNumber: 23,
      position: "ST",
      overall: 72,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Zaragoza",
      attributes: {
        technical: {
          passing: 72,
          shooting: 76,
          dribbling: 78,
          tackling: 42
        },
        mental: {
          vision: 70,
          composure: 68,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "getafe_aleksandrov",
      name: "Mykyta Aleksandrov",
      shirtNumber: 29,
      position: "ST",
      overall: 72,
      wage: 900000,
      contractYears: 2, // hasta 2027
      value: 5000000,
      birthDate: "2004-01-01",
      nationality: "Ucrania",
      birthPlace: "Ucrania",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 72,
          shooting: 76,
          dribbling: 78,
          tackling: 42
        },
        mental: {
          vision: 70,
          composure: 68,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "getafe_joselu_perez",
      name: "Joselu Pérez",
      shirtNumber: 37,
      position: "ST",
      overall: 71,
      wage: 700000,
      contractYears: 2, // año estimado
      value: 4000000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF B",
      attributes: {
        technical: {
          passing: 70,
          shooting: 74,
          dribbling: 76,
          tackling: 40
        },
        mental: {
          vision: 68,
          composure: 66,
          workRate: 82,
          leadership: 56
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 70
        }
      }
    }
  ],
  
   // =======================
  // GIRONA FC
  // =======================
  girona: [
    // PORTEROS
    {
      id: "girona_livakovic",
      name: "Dominik Livaković",
      shirtNumber: 1,
      position: "GK",
      overall: 82,
      wage: 3500000,
      contractYears: 1, // hasta 2026
      value: 22000000,
      birthDate: "1995-01-01",
      nationality: "Croacia",
      birthPlace: "Croacia",
      youthClub: "Fenerbahçe SK",
      attributes: {
        technical: {
          passing: 70,
          shooting: 15,
          dribbling: 40,
          tackling: 32
        },
        mental: {
          vision: 74,
          composure: 84,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 59,
          stamina: 75,
          strength: 80
        }
      }
    },
    {
      id: "girona_gazzaniga",
      name: "Paulo Gazzaniga",
      shirtNumber: 13,
      position: "GK",
      overall: 79,
      wage: 2200000,
      contractYears: 2, // hasta 2027
      value: 10000000,
      birthDate: "1992-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Fulham FC",
      attributes: {
        technical: {
          passing: 66,
          shooting: 14,
          dribbling: 38,
          tackling: 30
        },
        mental: {
          vision: 70,
          composure: 80,
          workRate: 82,
          leadership: 74
        },
        physical: {
          pace: 57,
          stamina: 74,
          strength: 80
        }
      }
    },
    {
      id: "girona_krapyvtsov",
      name: "Vladyslav Krapyvtsov",
      shirtNumber: 25,
      position: "GK",
      overall: 73,
      wage: 800000,
      contractYears: 4, // hasta 2029
      value: 4000000,
      birthDate: "2005-01-01",
      nationality: "Ucrania",
      birthPlace: "Ucrania",
      youthClub: "SC Dnipro-1",
      attributes: {
        technical: {
          passing: 60,
          shooting: 10,
          dribbling: 34,
          tackling: 24
        },
        mental: {
          vision: 62,
          composure: 68,
          workRate: 80,
          leadership: 58
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 72
        }
      }
    },
    {
      id: "girona_juan_carlos",
      name: "Juan Carlos Martín",
      shirtNumber: 26,
      position: "GK",
      overall: 75,
      wage: 1400000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "1988-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "CD Lugo",
      attributes: {
        technical: {
          passing: 64,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 68,
          composure: 78,
          workRate: 80,
          leadership: 76
        },
        physical: {
          pace: 55,
          stamina: 72,
          strength: 78
        }
      }
    },

    // DEFENSAS
    {
      id: "girona_hugo_rincon",
      name: "Hugo Rincón",
      shirtNumber: 2,
      position: "RB",
      overall: 75,
      wage: 1100000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 74,
          shooting: 54,
          dribbling: 78,
          tackling: 74
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 62
        },
        physical: {
          pace: 84,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "girona_arnau_martinez",
      name: "Arnau Martínez",
      shirtNumber: 4,
      position: "RB",
      overall: 80,
      wage: 2200000,
      contractYears: 2, // hasta 2027
      value: 26000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Girona FC",
      attributes: {
        technical: {
          passing: 80,
          shooting: 66,
          dribbling: 80,
          tackling: 84
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 88,
          leadership: 72
        },
        physical: {
          pace: 84,
          stamina: 86,
          strength: 78
        }
      }
    },
    {
      id: "girona_david_lopez",
      name: "David López",
      shirtNumber: 5,
      position: "CB",
      overall: 79,
      wage: 2400000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1989-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 78,
          shooting: 60,
          dribbling: 72,
          tackling: 84
        },
        mental: {
          vision: 78,
          composure: 82,
          workRate: 84,
          leadership: 82
        },
        physical: {
          pace: 68,
          stamina: 80,
          strength: 84
        }
      }
    },
    {
      id: "girona_vitor_reis",
      name: "Vitor Reis",
      shirtNumber: 12,
      position: "CB",
      overall: 74,
      wage: 900000,
      contractYears: 1, // hasta 2026
      value: 6000000,
      birthDate: "2006-01-01",
      nationality: "Brasil",
      birthPlace: "Brasil",
      youthClub: "Manchester City FC",
      attributes: {
        technical: {
          passing: 72,
          shooting: 48,
          dribbling: 70,
          tackling: 78
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "girona_frances",
      name: "Alejandro Francés",
      shirtNumber: 16,
      position: "CB",
      overall: 79,
      wage: 2000000,
      contractYears: 3, // hasta 2028
      value: 22000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Zaragoza",
      attributes: {
        technical: {
          passing: 78,
          shooting: 52,
          dribbling: 74,
          tackling: 84
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 88,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "girona_blind",
      name: "Daley Blind",
      shirtNumber: 17,
      position: "CB",
      overall: 80,
      wage: 2600000,
      contractYears: 1, // hasta 2026
      value: 10000000,
      birthDate: "1990-01-01",
      nationality: "Países Bajos",
      birthPlace: "Países Bajos",
      youthClub: "FC Bayern München",
      attributes: {
        technical: {
          passing: 84,
          shooting: 64,
          dribbling: 78,
          tackling: 82
        },
        mental: {
          vision: 86,
          composure: 84,
          workRate: 82,
          leadership: 84
        },
        physical: {
          pace: 66,
          stamina: 78,
          strength: 78
        }
      }
    },
    {
      id: "girona_alex_moreno",
      name: "Álex Moreno",
      shirtNumber: 24,
      position: "LB",
      overall: 79,
      wage: 2400000,
      contractYears: 2, // hasta 2027
      value: 18000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Aston Villa FC",
      attributes: {
        technical: {
          passing: 80,
          shooting: 66,
          dribbling: 82,
          tackling: 78
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 86,
          stamina: 86,
          strength: 76
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "girona_van_de_beek",
      name: "Donny van de Beek",
      shirtNumber: 6,
      position: "CM",
      overall: 80,
      wage: 3200000,
      contractYears: 3, // hasta 2028
      value: 24000000,
      birthDate: "1997-01-01",
      nationality: "Países Bajos",
      birthPlace: "Países Bajos",
      youthClub: "Manchester United FC",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 82,
          tackling: 72
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "girona_lemar",
      name: "Thomas Lemar",
      shirtNumber: 11,
      position: "LM",
      overall: 82,
      wage: 3800000,
      contractYears: 1, // hasta 2026
      value: 26000000,
      birthDate: "1995-01-01",
      nationality: "Francia",
      birthPlace: "Francia",
      youthClub: "Atlético de Madrid",
      attributes: {
        technical: {
          passing: 86,
          shooting: 80,
          dribbling: 86,
          tackling: 60
        },
        mental: {
          vision: 84,
          composure: 82,
          workRate: 84,
          leadership: 74
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "girona_ounahi",
      name: "Azzedine Ounahi",
      shirtNumber: 18,
      position: "CM",
      overall: 82,
      wage: 3200000,
      contractYears: 5, // hasta 2030
      value: 32000000,
      birthDate: "2000-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Olympique de Marsella",
      attributes: {
        technical: {
          passing: 86,
          shooting: 78,
          dribbling: 88,
          tackling: 72
        },
        mental: {
          vision: 86,
          composure: 82,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 82,
          stamina: 86,
          strength: 74
        }
      }
    },
    {
      id: "girona_witsel",
      name: "Axel Witsel",
      shirtNumber: 20,
      position: "CDM",
      overall: 82,
      wage: 3600000,
      contractYears: 2, // hasta 2027
      value: 18000000,
      birthDate: "1989-01-01",
      nationality: "Bélgica",
      birthPlace: "Bélgica",
      youthClub: "Atlético de Madrid",
      attributes: {
        technical: {
          passing: 86,
          shooting: 74,
          dribbling: 80,
          tackling: 84
        },
        mental: {
          vision: 86,
          composure: 86,
          workRate: 82,
          leadership: 86
        },
        physical: {
          pace: 66,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "girona_jhon_solis",
      name: "Jhon Solís",
      shirtNumber: 22,
      position: "CM",
      overall: 75,
      wage: 1200000,
      contractYears: 3, // hasta 2028
      value: 8000000,
      birthDate: "2004-01-01",
      nationality: "Colombia",
      birthPlace: "Colombia",
      youthClub: "Atlético Nacional",
      attributes: {
        technical: {
          passing: 76,
          shooting: 70,
          dribbling: 78,
          tackling: 74
        },
        mental: {
          vision: 74,
          composure: 72,
          workRate: 84,
          leadership: 62
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "girona_ivan_martin",
      name: "Iván Martín",
      shirtNumber: 23,
      position: "CM",
      overall: 79,
      wage: 2000000,
      contractYears: 3, // hasta 2028
      value: 16000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 84,
          tackling: 60
        },
        mental: {
          vision: 82,
          composure: 78,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 72
        }
      }
    },

    // DELANTEROS
    {
      id: "girona_joel_roca",
      name: "Joel Roca",
      shirtNumber: 3,
      position: "LW",
      overall: 74,
      wage: 900000,
      contractYears: 4, // hasta 2029
      value: 8000000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Girona FC",
      attributes: {
        technical: {
          passing: 76,
          shooting: 72,
          dribbling: 82,
          tackling: 46
        },
        mental: {
          vision: 74,
          composure: 70,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 86,
          stamina: 82,
          strength: 70
        }
      }
    },
    {
      id: "girona_stuani",
      name: "Cristhian Stuani",
      shirtNumber: 7,
      position: "ST",
      overall: 79,
      wage: 2600000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1986-01-01",
      nationality: "Uruguay",
      birthPlace: "Uruguay",
      youthClub: "Middlesbrough FC",
      attributes: {
        technical: {
          passing: 76,
          shooting: 84,
          dribbling: 76,
          tackling: 50
        },
        mental: {
          vision: 76,
          composure: 84,
          workRate: 86,
          leadership: 86
        },
        physical: {
          pace: 70,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "girona_portu",
      name: "Cristian Portugués \"Portu\"",
      shirtNumber: 8,
      position: "RW",
      overall: 79,
      wage: 2400000,
      contractYears: 2, // hasta 2027
      value: 16000000,
      birthDate: "1992-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 84,
          tackling: 52
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 84,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "girona_abel_ruiz",
      name: "Abel Ruiz",
      shirtNumber: 9,
      position: "ST",
      overall: 80,
      wage: 2600000,
      contractYears: 4, // hasta 2029
      value: 26000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "SC Braga",
      attributes: {
        technical: {
          passing: 78,
          shooting: 84,
          dribbling: 80,
          tackling: 48
        },
        mental: {
          vision: 78,
          composure: 82,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "girona_yaser_asprilla",
      name: "Yáser Asprilla",
      shirtNumber: 10,
      position: "LW",
      overall: 78,
      wage: 2000000,
      contractYears: 5, // hasta 2030
      value: 20000000,
      birthDate: "2003-01-01",
      nationality: "Colombia",
      birthPlace: "Colombia",
      youthClub: "Watford FC",
      attributes: {
        technical: {
          passing: 80,
          shooting: 78,
          dribbling: 86,
          tackling: 50
        },
        mental: {
          vision: 80,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 86,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "girona_tsygankov",
      name: "Viktor Tsygankov",
      shirtNumber: 15,
      position: "RW",
      overall: 83,
      wage: 3500000,
      contractYears: 2, // hasta 2027
      value: 38000000,
      birthDate: "1997-01-01",
      nationality: "Ucrania",
      birthPlace: "Ucrania",
      youthClub: "FC Dínamo Kiev",
      attributes: {
        technical: {
          passing: 86,
          shooting: 84,
          dribbling: 88,
          tackling: 54
        },
        mental: {
          vision: 86,
          composure: 82,
          workRate: 86,
          leadership: 74
        },
        physical: {
          pace: 86,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "girona_vanat",
      name: "Vladyslav Vanat",
      shirtNumber: 19,
      position: "ST",
      overall: 79,
      wage: 2200000,
      contractYears: 5, // hasta 2030
      value: 26000000,
      birthDate: "2002-01-01",
      nationality: "Ucrania",
      birthPlace: "Ucrania",
      youthClub: "FC Dínamo Kiev",
      attributes: {
        technical: {
          passing: 78,
          shooting: 84,
          dribbling: 80,
          tackling: 46
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "girona_bryan_gil",
      name: "Bryan Gil",
      shirtNumber: 21,
      position: "LW",
      overall: 80,
      wage: 2800000,
      contractYears: 5, // hasta 2030
      value: 26000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Tottenham Hotspur FC",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 88,
          tackling: 50
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 86,
          stamina: 82,
          strength: 70
        }
      }
    }
  ],
  
  // =======================
  // LEVANTE UD
  // =======================
  levante: [
    // PORTEROS
    {
      id: "levante_pablo_cunat",
      name: "Pablo Cuñat",
      shirtNumber: 1,
      position: "GK",
      overall: 72,
      wage: 700000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 60,
          shooting: 8,
          dribbling: 34,
          tackling: 24
        },
        mental: {
          vision: 62,
          composure: 68,
          workRate: 80,
          leadership: 58
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 72
        }
      }
    },
    {
      id: "levante_mathew_ryan",
      name: "Mathew Ryan",
      shirtNumber: 13,
      position: "GK",
      overall: 78,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "1992-01-01",
      nationality: "Australia",
      birthPlace: "Australia",
      youthClub: "RC Lens",
      attributes: {
        technical: {
          passing: 66,
          shooting: 12,
          dribbling: 38,
          tackling: 28
        },
        mental: {
          vision: 70,
          composure: 82,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 57,
          stamina: 74,
          strength: 80
        }
      }
    },
    {
      id: "levante_alex_primo",
      name: "Álex Primo",
      shirtNumber: 32,
      position: "GK",
      overall: 70,
      wage: 500000,
      contractYears: 3, // hasta 2028
      value: 2500000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 58,
          shooting: 8,
          dribbling: 32,
          tackling: 22
        },
        mental: {
          vision: 60,
          composure: 64,
          workRate: 78,
          leadership: 52
        },
        physical: {
          pace: 58,
          stamina: 70,
          strength: 70
        }
      }
    },

    // DEFENSAS
    {
      id: "levante_matias_moreno",
      name: "Matías Moreno",
      shirtNumber: 2,
      position: "CB",
      overall: 72,
      wage: 1000000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2003-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Fiorentina",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 76
        },
        mental: {
          vision: 66,
          composure: 68,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 78
        }
      }
    },
    {
      id: "levante_matturro",
      name: "Alan Matturro",
      shirtNumber: 3,
      position: "CB",
      overall: 74,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "2004-01-01",
      nationality: "Uruguay",
      birthPlace: "Uruguay",
      youthClub: "Genoa CFC",
      attributes: {
        technical: {
          passing: 70,
          shooting: 42,
          dribbling: 64,
          tackling: 78
        },
        mental: {
          vision: 68,
          composure: 70,
          workRate: 86,
          leadership: 62
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "levante_adrian_dela",
      name: "Adrián Dela",
      shirtNumber: 4,
      position: "CB",
      overall: 72,
      wage: 900000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal B",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 76
        },
        mental: {
          vision: 66,
          composure: 68,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 78
        }
      }
    },
    {
      id: "levante_elgezabal",
      name: "Unai Elgezabal",
      shirtNumber: 5,
      position: "CB",
      overall: 73,
      wage: 1200000,
      contractYears: 2, // hasta 2027
      value: 4000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Burgos CF",
      attributes: {
        technical: {
          passing: 70,
          shooting: 42,
          dribbling: 62,
          tackling: 78
        },
        mental: {
          vision: 68,
          composure: 72,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 70,
          stamina: 78,
          strength: 80
        }
      }
    },
    {
      id: "levante_pampin",
      name: "Diego Pampín",
      shirtNumber: 6,
      position: "LB",
      overall: 73,
      wage: 1000000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "FC Andorra",
      attributes: {
        technical: {
          passing: 72,
          shooting: 52,
          dribbling: 76,
          tackling: 74
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "levante_cabello",
      name: "Jorge Cabello",
      shirtNumber: 14,
      position: "CB",
      overall: 70,
      wage: 600000,
      contractYears: 3, // hasta 2028
      value: 3000000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 66,
          shooting: 38,
          dribbling: 60,
          tackling: 72
        },
        mental: {
          vision: 64,
          composure: 64,
          workRate: 82,
          leadership: 54
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 72
        }
      }
    },
    {
      id: "levante_victor_garcia",
      name: "Víctor García",
      shirtNumber: 17,
      position: "RB",
      overall: 72,
      wage: 900000,
      contractYears: 2, // hasta 2027
      value: 4000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "CD Eldense",
      attributes: {
        technical: {
          passing: 70,
          shooting: 48,
          dribbling: 74,
          tackling: 74
        },
        mental: {
          vision: 68,
          composure: 68,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "levante_toljan",
      name: "Jeremy Toljan",
      shirtNumber: 22,
      position: "RB",
      overall: 77,
      wage: 2000000,
      contractYears: 2, // hasta 2027
      value: 9000000,
      birthDate: "1994-01-01",
      nationality: "Alemania",
      birthPlace: "Alemania",
      youthClub: "Sassuolo",
      attributes: {
        technical: {
          passing: 78,
          shooting: 60,
          dribbling: 80,
          tackling: 78
        },
        mental: {
          vision: 76,
          composure: 76,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "levante_manu_sanchez",
      name: "Manu Sánchez",
      shirtNumber: 23,
      position: "LB",
      overall: 75,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RC Celta",
      attributes: {
        technical: {
          passing: 76,
          shooting: 56,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 86,
          leadership: 66
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 74
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "levante_olasagasti",
      name: "Jon Ander Olasagasti",
      shirtNumber: 8,
      position: "CM",
      overall: 74,
      wage: 1200000,
      contractYears: 3, // hasta 2028
      value: 7000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 78,
          tackling: 72
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "levante_pablo_martinez",
      name: "Pablo Martínez",
      shirtNumber: 10,
      position: "CAM",
      overall: 75,
      wage: 1400000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 82,
          shooting: 76,
          dribbling: 82,
          tackling: 60
        },
        mental: {
          vision: 80,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "levante_vencedor",
      name: "Unai Vencedor",
      shirtNumber: 12,
      position: "CDM",
      overall: 75,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 80,
          shooting: 70,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 80,
          composure: 76,
          workRate: 86,
          leadership: 66
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "levante_arriaga",
      name: "Kervin Arriaga",
      shirtNumber: 16,
      position: "CDM",
      overall: 76,
      wage: 1800000,
      contractYears: 3, // hasta 2028
      value: 10000000,
      birthDate: "1998-01-01",
      nationality: "Honduras",
      birthPlace: "Honduras",
      youthClub: "Partizán de Belgrado",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 76,
          tackling: 82
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 88,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 86,
          strength: 80
        }
      }
    },
    {
      id: "levante_iker_losada",
      name: "Iker Losada",
      shirtNumber: 18,
      position: "CAM",
      overall: 73,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 6000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Betis",
      attributes: {
        technical: {
          passing: 78,
          shooting: 74,
          dribbling: 80,
          tackling: 60
        },
        mental: {
          vision: 76,
          composure: 72,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "levante_oriol_rey",
      name: "Oriol Rey",
      shirtNumber: 20,
      position: "CM",
      overall: 72,
      wage: 900000,
      contractYears: 0, // hasta 2025
      value: 4000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "CD Mirandés",
      attributes: {
        technical: {
          passing: 78,
          shooting: 70,
          dribbling: 76,
          tackling: 70
        },
        mental: {
          vision: 76,
          composure: 72,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 70,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "levante_carlos_alvarez",
      name: "Carlos Álvarez",
      shirtNumber: 24,
      position: "RW",
      overall: 73,
      wage: 1100000,
      contractYears: 2, // hasta 2027
      value: 6000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Sevilla Atlético",
      attributes: {
        technical: {
          passing: 80,
          shooting: 74,
          dribbling: 82,
          tackling: 58
        },
        mental: {
          vision: 78,
          composure: 72,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 70
        }
      }
    },

    // DELANTEROS
    {
      id: "levante_roger_brugue",
      name: "Roger Brugué",
      shirtNumber: 7,
      position: "RW",
      overall: 75,
      wage: 1500000,
      contractYears: 3, // hasta 2028
      value: 8000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Nàstic de Tarragona",
      attributes: {
        technical: {
          passing: 78,
          shooting: 76,
          dribbling: 82,
          tackling: 48
        },
        mental: {
          vision: 76,
          composure: 74,
          workRate: 86,
          leadership: 66
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "levante_ivan_romero",
      name: "Iván Romero",
      shirtNumber: 9,
      position: "ST",
      overall: 74,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Sevilla FC",
      attributes: {
        technical: {
          passing: 74,
          shooting: 80,
          dribbling: 78,
          tackling: 42
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "levante_morales",
      name: "José Luis Morales",
      shirtNumber: 11,
      position: "ST",
      overall: 76,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "1987-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 80,
          shooting: 82,
          dribbling: 84,
          tackling: 46
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 84,
          leadership: 80
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "levante_koyalipou",
      name: "Goduine Koyalipou",
      shirtNumber: 15,
      position: "LW",
      overall: 74,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "2000-01-01",
      nationality: "República Centroafricana",
      birthPlace: "República Centroafricana",
      youthClub: "RC Lens",
      attributes: {
        technical: {
          passing: 76,
          shooting: 78,
          dribbling: 84,
          tackling: 44
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "levante_carlos_espi",
      name: "Carlos Espí",
      shirtNumber: 19,
      position: "ST",
      overall: 72,
      wage: 800000,
      contractYears: 2, // hasta 2027
      value: 5000000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 72,
          shooting: 78,
          dribbling: 76,
          tackling: 40
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 58
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "levante_etta_eyong",
      name: "Etta Eyong",
      shirtNumber: 21,
      position: "ST",
      overall: 73,
      wage: 1000000,
      contractYears: 4, // hasta 2029
      value: 6000000,
      birthDate: "2003-01-01",
      nationality: "Camerún",
      birthPlace: "Camerún",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 78,
          dribbling: 78,
          tackling: 40
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 58
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 74
        }
      }
    }
  ],

  // =======================
  // RCD MALLORCA
  // =======================
  mallorca: [
    // PORTEROS
    {
      id: "mallorca_leo_roman",
      name: "Leo Román",
      shirtNumber: 1,
      position: "GK",
      overall: 76,
      wage: 900000,
      contractYears: 5, // hasta 2030
      value: 9000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Mallorca",
      attributes: {
        technical: {
          passing: 66,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 76
        }
      }
    },
    {
      id: "mallorca_bergstrom",
      name: "Lucas Bergström",
      shirtNumber: 13,
      position: "GK",
      overall: 75,
      wage: 1000000,
      contractYears: 2, // hasta 2027
      value: 7000000,
      birthDate: "2002-01-01",
      nationality: "Finlandia",
      birthPlace: "Finlandia",
      youthClub: "Chelsea FC",
      attributes: {
        technical: {
          passing: 64,
          shooting: 10,
          dribbling: 34,
          tackling: 24
        },
        mental: {
          vision: 68,
          composure: 74,
          workRate: 80,
          leadership: 62
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 76
        }
      }
    },
    {
      id: "mallorca_ivan_cuellar",
      name: "Iván Cuéllar",
      shirtNumber: 25,
      position: "GK",
      overall: 72,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 3000000,
      birthDate: "1984-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sporting",
      attributes: {
        technical: {
          passing: 62,
          shooting: 8,
          dribbling: 32,
          tackling: 24
        },
        mental: {
          vision: 70,
          composure: 80,
          workRate: 78,
          leadership: 82
        },
        physical: {
          pace: 50,
          stamina: 68,
          strength: 78
        }
      }
    },

    // DEFENSAS
    {
      id: "mallorca_mateu_morey",
      name: "Mateu Morey",
      shirtNumber: 2,
      position: "RB",
      overall: 76,
      wage: 1400000,
      contractYears: 2, // hasta 2027
      value: 11000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Borussia Dortmund",
      attributes: {
        technical: {
          passing: 76,
          shooting: 58,
          dribbling: 80,
          tackling: 78
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 86,
          leadership: 64
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "mallorca_toni_lato",
      name: "Toni Lato",
      shirtNumber: 3,
      position: "LB",
      overall: 75,
      wage: 1300000,
      contractYears: 2, // hasta 2027
      value: 9000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 56,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "mallorca_kumbulla",
      name: "Marash Kumbulla",
      shirtNumber: 4,
      position: "CB",
      overall: 78,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 15000000,
      birthDate: "2000-01-01",
      nationality: "Albania",
      birthPlace: "Albania",
      youthClub: "AS Roma",
      attributes: {
        technical: {
          passing: 74,
          shooting: 46,
          dribbling: 68,
          tackling: 84
        },
        mental: {
          vision: 72,
          composure: 78,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "mallorca_raillo",
      name: "Antonio Raíllo",
      shirtNumber: 21,
      position: "CB",
      overall: 79,
      wage: 2200000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1991-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 76,
          shooting: 46,
          dribbling: 68,
          tackling: 86
        },
        mental: {
          vision: 74,
          composure: 82,
          workRate: 86,
          leadership: 84
        },
        physical: {
          pace: 70,
          stamina: 82,
          strength: 86
        }
      }
    },
    {
      id: "mallorca_mojica",
      name: "Johan Mojica",
      shirtNumber: 22,
      position: "LB",
      overall: 78,
      wage: 2000000,
      contractYears: 2, // hasta 2027
      value: 14000000,
      birthDate: "1992-01-01",
      nationality: "Colombia",
      birthPlace: "Colombia",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 78,
          shooting: 62,
          dribbling: 82,
          tackling: 76
        },
        mental: {
          vision: 74,
          composure: 76,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 86,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "mallorca_maffeo",
      name: "Pablo Maffeo",
      shirtNumber: 23,
      position: "RB",
      overall: 78,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 15000000,
      birthDate: "1997-01-01",
      nationality: "Argentina",
      birthPlace: "España",
      youthClub: "VfB Stuttgart",
      attributes: {
        technical: {
          passing: 78,
          shooting: 58,
          dribbling: 80,
          tackling: 82
        },
        mental: {
          vision: 74,
          composure: 78,
          workRate: 88,
          leadership: 70
        },
        physical: {
          pace: 84,
          stamina: 86,
          strength: 78
        }
      }
    },
    {
      id: "mallorca_valjent",
      name: "Martin Valjent",
      shirtNumber: 24,
      position: "CB",
      overall: 79,
      wage: 2100000,
      contractYears: 4, // hasta 2029
      value: 17000000,
      birthDate: "1995-01-01",
      nationality: "Eslovaquia",
      birthPlace: "Eslovaquia",
      youthClub: "AC Chievo Verona",
      attributes: {
        technical: {
          passing: 76,
          shooting: 46,
          dribbling: 68,
          tackling: 86
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 86,
          leadership: 76
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "mallorca_david_lopez_cantera",
      name: "David López",
      shirtNumber: 27,
      position: "CB",
      overall: 72,
      wage: 800000,
      contractYears: 2, // hasta 2027
      value: 5000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Mallorca",
      attributes: {
        technical: {
          passing: 70,
          shooting: 40,
          dribbling: 64,
          tackling: 74
        },
        mental: {
          vision: 68,
          composure: 68,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 74
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "mallorca_mascarell",
      name: "Omar Mascarell",
      shirtNumber: 5,
      position: "CDM",
      overall: 78,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1993-01-01",
      nationality: "Guinea Ecuatorial",
      birthPlace: "España",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 70,
          dribbling: 76,
          tackling: 84
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 88,
          leadership: 74
        },
        physical: {
          pace: 70,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "mallorca_antonio_sanchez",
      name: "Antonio Sánchez",
      shirtNumber: 6,
      position: "CM",
      overall: 76,
      wage: 1500000,
      contractYears: 2, // hasta 2027
      value: 11000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Mallorca",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 78,
          tackling: 74
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "mallorca_morlanes",
      name: "Manu Morlanes",
      shirtNumber: 8,
      position: "CM",
      overall: 77,
      wage: 1800000,
      contractYears: 3, // hasta 2028
      value: 13000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 74,
          dribbling: 80,
          tackling: 76
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "mallorca_darder",
      name: "Sergi Darder",
      shirtNumber: 10,
      position: "CM",
      overall: 82,
      wage: 3000000,
      contractYears: 3, // hasta 2028
      value: 26000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Espanyol",
      attributes: {
        technical: {
          passing: 88,
          shooting: 82,
          dribbling: 84,
          tackling: 70
        },
        mental: {
          vision: 88,
          composure: 84,
          workRate: 84,
          leadership: 78
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "mallorca_samu_costa",
      name: "Samu Costa",
      shirtNumber: 12,
      position: "CDM",
      overall: 79,
      wage: 2200000,
      contractYears: 3, // hasta 2028
      value: 20000000,
      birthDate: "2000-01-01",
      nationality: "Portugal",
      birthPlace: "Portugal",
      youthClub: "UD Almería",
      attributes: {
        technical: {
          passing: 82,
          shooting: 72,
          dribbling: 78,
          tackling: 84
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 88,
          leadership: 72
        },
        physical: {
          pace: 76,
          stamina: 86,
          strength: 80
        }
      }
    },
    {
      id: "mallorca_dani_rodriguez",
      name: "Dani Rodríguez",
      shirtNumber: 14,
      position: "CM",
      overall: 77,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1988-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Albacete Balompié",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 82,
          tackling: 60
        },
        mental: {
          vision: 82,
          composure: 82,
          workRate: 84,
          leadership: 80
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "mallorca_pablo_torre",
      name: "Pablo Torre",
      shirtNumber: 20,
      position: "CAM",
      overall: 77,
      wage: 1600000,
      contractYears: 4, // hasta 2029
      value: 18000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "FC Barcelona",
      attributes: {
        technical: {
          passing: 84,
          shooting: 76,
          dribbling: 84,
          tackling: 58
        },
        mental: {
          vision: 82,
          composure: 78,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 70
        }
      }
    },

    // DELANTEROS
    {
      id: "mallorca_muriqi",
      name: "Vedat Muriqi",
      shirtNumber: 7,
      position: "ST",
      overall: 81,
      wage: 3200000,
      contractYears: 4, // hasta 2029
      value: 28000000,
      birthDate: "1994-01-01",
      nationality: "Kosovo",
      birthPlace: "Kosovo",
      youthClub: "SS Lazio",
      attributes: {
        technical: {
          passing: 76,
          shooting: 86,
          dribbling: 78,
          tackling: 48
        },
        mental: {
          vision: 78,
          composure: 84,
          workRate: 86,
          leadership: 80
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 88
        }
      }
    },
    {
      id: "mallorca_abdon_prats",
      name: "Abdón Prats",
      shirtNumber: 9,
      position: "ST",
      overall: 78,
      wage: 2200000,
      contractYears: 3, // hasta 2028
      value: 15000000,
      birthDate: "1992-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Mallorca",
      attributes: {
        technical: {
          passing: 76,
          shooting: 82,
          dribbling: 76,
          tackling: 44
        },
        mental: {
          vision: 76,
          composure: 82,
          workRate: 86,
          leadership: 78
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 80
        }
      }
    },
    {
      id: "mallorca_asano",
      name: "Takuma Asano",
      shirtNumber: 11,
      position: "ST",
      overall: 77,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 13000000,
      birthDate: "1994-01-01",
      nationality: "Japón",
      birthPlace: "Japón",
      youthClub: "VfL Bochum",
      attributes: {
        technical: {
          passing: 74,
          shooting: 80,
          dribbling: 80,
          tackling: 44
        },
        mental: {
          vision: 74,
          composure: 78,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 84,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "mallorca_jan_virgili",
      name: "Jan Virgili",
      shirtNumber: 17,
      position: "LW",
      overall: 72,
      wage: 800000,
      contractYears: 5, // hasta 2030
      value: 6000000,
      birthDate: "2006-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "FC Barcelona Atlètic",
      attributes: {
        technical: {
          passing: 74,
          shooting: 72,
          dribbling: 82,
          tackling: 40
        },
        mental: {
          vision: 72,
          composure: 68,
          workRate: 82,
          leadership: 56
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "mallorca_mateo_joseph",
      name: "Mateo Joseph",
      shirtNumber: 18,
      position: "ST",
      overall: 74,
      wage: 1000000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Leeds United FC",
      attributes: {
        technical: {
          passing: 74,
          shooting: 80,
          dribbling: 80,
          tackling: 42
        },
        mental: {
          vision: 72,
          composure: 72,
          workRate: 84,
          leadership: 58
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "mallorca_llabres",
      name: "Javier Llabrés",
      shirtNumber: 19,
      position: "RW",
      overall: 73,
      wage: 900000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Mallorca",
      attributes: {
        technical: {
          passing: 76,
          shooting: 74,
          dribbling: 82,
          tackling: 44
        },
        mental: {
          vision: 74,
          composure: 70,
          workRate: 84,
          leadership: 58
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "mallorca_marc_domenench",
      name: "Marc Domènech",
      shirtNumber: 30,
      position: "ST",
      overall: 71,
      wage: 700000,
      contractYears: 4, // hasta 2029
      value: 5000000,
      birthDate: "2006-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Mallorca",
      attributes: {
        technical: {
          passing: 70,
          shooting: 76,
          dribbling: 76,
          tackling: 40
        },
        mental: {
          vision: 68,
          composure: 66,
          workRate: 82,
          leadership: 54
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 72
        }
      }
    }
  ],

  // =======================
  // CA OSASUNA
  // =======================
  osasuna: [
    // PORTEROS
    {
      id: "osasuna_sergio_herrera",
      name: "Sergio Herrera",
      shirtNumber: 1,
      position: "GK",
      overall: 78,
      wage: 2200000,
      contractYears: 3, // hasta 2028
      value: 9000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "SD Huesca",
      attributes: {
        technical: {
          passing: 66,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 72,
          composure: 82,
          workRate: 84,
          leadership: 86
        },
        physical: {
          pace: 56,
          stamina: 74,
          strength: 80
        }
      }
    },
    {
      id: "osasuna_aitor_fernandez",
      name: "Aitor Fernández",
      shirtNumber: 13,
      position: "GK",
      overall: 77,
      wage: 1800000,
      contractYears: 2, // hasta 2027
      value: 7000000,
      birthDate: "1991-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 64,
          shooting: 10,
          dribbling: 34,
          tackling: 24
        },
        mental: {
          vision: 70,
          composure: 80,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 55,
          stamina: 72,
          strength: 78
        }
      }
    },
    {
      id: "osasuna_stamatakis",
      name: "Dimitrios Stamatakis",
      shirtNumber: 31,
      position: "GK",
      overall: 71,
      wage: 700000,
      contractYears: 2, // hasta 2027
      value: 3000000,
      birthDate: "2003-01-01",
      nationality: "Grecia",
      birthPlace: "Grecia",
      youthClub: "Atlético de Madrid B",
      attributes: {
        technical: {
          passing: 60,
          shooting: 8,
          dribbling: 32,
          tackling: 22
        },
        mental: {
          vision: 62,
          composure: 66,
          workRate: 80,
          leadership: 54
        },
        physical: {
          pace: 58,
          stamina: 72,
          strength: 72
        }
      }
    },

    // DEFENSAS
    {
      id: "osasuna_juan_cruz",
      name: "Juan Cruz",
      shirtNumber: 3,
      position: "LB",
      overall: 76,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1992-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 56,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "osasuna_herrando",
      name: "Jorge Herrando",
      shirtNumber: 5,
      position: "CB",
      overall: 73,
      wage: 1000000,
      contractYears: 2, // hasta 2027
      value: 6000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 70,
          shooting: 44,
          dribbling: 66,
          tackling: 78
        },
        mental: {
          vision: 68,
          composure: 70,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "osasuna_rosier",
      name: "Valentin Rosier",
      shirtNumber: 19,
      position: "RB",
      overall: 76,
      wage: 1700000,
      contractYears: 3, // hasta 2028
      value: 9000000,
      birthDate: "1996-01-01",
      nationality: "Francia",
      birthPlace: "Francia",
      youthClub: "CD Leganés",
      attributes: {
        technical: {
          passing: 78,
          shooting: 60,
          dribbling: 80,
          tackling: 78
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 86,
          leadership: 66
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "osasuna_boyomo",
      name: "Enzo Boyomo",
      shirtNumber: 22,
      position: "CB",
      overall: 77,
      wage: 1600000,
      contractYears: 4, // hasta 2029
      value: 12000000,
      birthDate: "2001-01-01",
      nationality: "Camerún",
      birthPlace: "Camerún",
      youthClub: "Real Valladolid CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 46,
          dribbling: 68,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 76,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "osasuna_bretones",
      name: "Abel Bretones",
      shirtNumber: 23,
      position: "LB",
      overall: 74,
      wage: 1200000,
      contractYears: 4, // hasta 2029
      value: 8000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Oviedo",
      attributes: {
        technical: {
          passing: 76,
          shooting: 58,
          dribbling: 78,
          tackling: 74
        },
        mental: {
          vision: 72,
          composure: 72,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "osasuna_catena",
      name: "Alejandro Catena",
      shirtNumber: 24,
      position: "CB",
      overall: 78,
      wage: 1900000,
      contractYears: 3, // hasta 2028
      value: 12000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Rayo Vallecano",
      attributes: {
        technical: {
          passing: 76,
          shooting: 46,
          dribbling: 68,
          tackling: 84
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 84,
          leadership: 78
        },
        physical: {
          pace: 70,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "osasuna_chasco",
      name: "Raúl Chasco",
      shirtNumber: 34,
      position: "LB",
      overall: 71,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 70,
          shooting: 50,
          dribbling: 74,
          tackling: 70
        },
        mental: {
          vision: 68,
          composure: 66,
          workRate: 82,
          leadership: 54
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "osasuna_arguibide",
      name: "Íñigo Arguibide",
      shirtNumber: 41,
      position: "CB",
      overall: 70,
      wage: 700000,
      contractYears: 2, // hasta 2027
      value: 3500000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 64,
          tackling: 72
        },
        mental: {
          vision: 66,
          composure: 64,
          workRate: 82,
          leadership: 52
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 72
        }
      }
    },
    {
      id: "osasuna_serrano",
      name: "Mikel Serrano",
      shirtNumber: 42,
      position: "CB",
      overall: 71,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Unionistas de Salamanca",
      attributes: {
        technical: {
          passing: 68,
          shooting: 42,
          dribbling: 64,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 66,
          workRate: 82,
          leadership: 54
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 74
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "osasuna_iker_benito",
      name: "Iker Benito",
      shirtNumber: 2,
      position: "LWB",
      overall: 73,
      wage: 900000,
      contractYears: 2, // hasta 2027
      value: 7000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 76,
          shooting: 74,
          dribbling: 82,
          tackling: 46
        },
        mental: {
          vision: 74,
          composure: 70,
          workRate: 84,
          leadership: 58
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "osasuna_lucas_torro",
      name: "Lucas Torró",
      shirtNumber: 6,
      position: "CDM",
      overall: 79,
      wage: 2200000,
      contractYears: 2, // hasta 2027
      value: 16000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Eintracht Frankfurt",
      attributes: {
        technical: {
          passing: 82,
          shooting: 72,
          dribbling: 76,
          tackling: 84
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 88,
          leadership: 76
        },
        physical: {
          pace: 70,
          stamina: 84,
          strength: 82
        }
      }
    },
    {
      id: "osasuna_moncayola",
      name: "Jon Moncayola",
      shirtNumber: 7,
      position: "CM",
      overall: 80,
      wage: 2500000,
      contractYears: 6, // hasta 2031
      value: 24000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 80,
          tackling: 82
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 90,
          leadership: 78
        },
        physical: {
          pace: 76,
          stamina: 88,
          strength: 80
        }
      }
    },
    {
      id: "osasuna_iker_munoz",
      name: "Iker Muñoz",
      shirtNumber: 8,
      position: "CM",
      overall: 75,
      wage: 1300000,
      contractYears: 2, // hasta 2027
      value: 10000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 78,
          composure: 74,
          workRate: 86,
          leadership: 64
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "osasuna_aimar_oroz",
      name: "Aimar Oroz",
      shirtNumber: 10,
      position: "CAM",
      overall: 79,
      wage: 1900000,
      contractYears: 4, // hasta 2029
      value: 22000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 86,
          tackling: 60
        },
        mental: {
          vision: 86,
          composure: 80,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "osasuna_kike_barja",
      name: "Kike Barja",
      shirtNumber: 11,
      position: "RW",
      overall: 76,
      wage: 1600000,
      contractYears: 1, // hasta 2026
      value: 11000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 80,
          shooting: 76,
          dribbling: 84,
          tackling: 54
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "osasuna_ruben_garcia",
      name: "Rubén García",
      shirtNumber: 14,
      position: "RW",
      overall: 77,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 82,
          tackling: 56
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "osasuna_moi_gomez",
      name: "Moi Gómez",
      shirtNumber: 16,
      position: "LM",
      overall: 78,
      wage: 2000000,
      contractYears: 2, // hasta 2027
      value: 13000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 84,
          tackling: 58
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "osasuna_echegoyen",
      name: "Mauro Echegoyen",
      shirtNumber: 26,
      position: "CM",
      overall: 70,
      wage: 700000,
      contractYears: 1, // hasta 2026
      value: 3500000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 72,
          shooting: 66,
          dribbling: 74,
          tackling: 68
        },
        mental: {
          vision: 70,
          composure: 66,
          workRate: 84,
          leadership: 52
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "osasuna_jon_garcia",
      name: "Jon García",
      shirtNumber: 28,
      position: "CM",
      overall: 71,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 74,
          shooting: 68,
          dribbling: 74,
          tackling: 70
        },
        mental: {
          vision: 72,
          composure: 68,
          workRate: 84,
          leadership: 54
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "osasuna_osambela",
      name: "Asier Osambela",
      shirtNumber: 29,
      position: "CM",
      overall: 72,
      wage: 900000,
      contractYears: 4, // hasta 2029
      value: 4500000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 76,
          shooting: 70,
          dribbling: 76,
          tackling: 72
        },
        mental: {
          vision: 74,
          composure: 70,
          workRate: 84,
          leadership: 56
        },
        physical: {
          pace: 74,
          stamina: 82,
          strength: 72
        }
      }
    },

    // DELANTEROS
    {
      id: "osasuna_raul_garcia_haro",
      name: "Raúl García de Haro",
      shirtNumber: 9,
      position: "ST",
      overall: 78,
      wage: 2000000,
      contractYears: 3, // hasta 2028
      value: 18000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Betis",
      attributes: {
        technical: {
          passing: 76,
          shooting: 84,
          dribbling: 78,
          tackling: 46
        },
        mental: {
          vision: 76,
          composure: 80,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "osasuna_budimir",
      name: "Ante Budimir",
      shirtNumber: 17,
      position: "ST",
      overall: 80,
      wage: 2600000,
      contractYears: 2, // hasta 2027
      value: 20000000,
      birthDate: "1991-01-01",
      nationality: "Croacia",
      birthPlace: "Croacia",
      youthClub: "RCD Mallorca",
      attributes: {
        technical: {
          passing: 76,
          shooting: 86,
          dribbling: 78,
          tackling: 48
        },
        mental: {
          vision: 78,
          composure: 84,
          workRate: 84,
          leadership: 78
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 86
        }
      }
    },
    {
      id: "osasuna_becker",
      name: "Sheraldo Becker",
      shirtNumber: 18,
      position: "RW",
      overall: 79,
      wage: 2600000,
      contractYears: 2, // hasta 2027
      value: 22000000,
      birthDate: "1995-01-01",
      nationality: "Surinam",
      birthPlace: "Surinam",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 86,
          tackling: 50
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 90,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "osasuna_victor_munoz",
      name: "Víctor Muñoz",
      shirtNumber: 21,
      position: "ST",
      overall: 72,
      wage: 900000,
      contractYears: 5, // hasta 2030
      value: 6000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Madrid CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 78,
          dribbling: 76,
          tackling: 40
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 56
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "osasuna_pedroarena",
      name: "Martín Pedroarena",
      shirtNumber: 27,
      position: "ST",
      overall: 71,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4500000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "UD Mutilvera",
      attributes: {
        technical: {
          passing: 70,
          shooting: 76,
          dribbling: 74,
          tackling: 40
        },
        mental: {
          vision: 68,
          composure: 68,
          workRate: 82,
          leadership: 52
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "osasuna_roberto_arroyo",
      name: "Roberto Arroyo",
      shirtNumber: 37,
      position: "ST",
      overall: 71,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4500000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Valladolid CF",
      attributes: {
        technical: {
          passing: 70,
          shooting: 76,
          dribbling: 74,
          tackling: 40
        },
        mental: {
          vision: 68,
          composure: 68,
          workRate: 82,
          leadership: 52
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "osasuna_aly_kall",
      name: "Aly Kall",
      shirtNumber: 47,
      position: "ST",
      overall: 69,
      wage: 600000,
      contractYears: 4, // hasta 2029
      value: 3500000,
      birthDate: "2007-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Osasuna",
      attributes: {
        technical: {
          passing: 68,
          shooting: 74,
          dribbling: 76,
          tackling: 38
        },
        mental: {
          vision: 66,
          composure: 64,
          workRate: 82,
          leadership: 50
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 70
        }
      }
    }
  ],

  // =======================
  // RAYO VALLECANO
  // =======================
  rayo: [
    // PORTEROS
    {
      id: "rayo_dani_cardenas",
      name: "Dani Cárdenas",
      shirtNumber: 1,
      position: "GK",
      overall: 76,
      wage: 1000000,
      contractYears: 2, // hasta 2027
      value: 7000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 66,
          shooting: 10,
          dribbling: 34,
          tackling: 26
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 56,
          stamina: 74,
          strength: 76
        }
      }
    },
    {
      id: "rayo_augusto_batalla",
      name: "Augusto Batalla",
      shirtNumber: 13,
      position: "GK",
      overall: 77,
      wage: 1200000,
      contractYears: 5, // hasta 2030
      value: 9000000,
      birthDate: "1996-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "River Plate",
      attributes: {
        technical: {
          passing: 66,
          shooting: 10,
          dribbling: 34,
          tackling: 26
        },
        mental: {
          vision: 70,
          composure: 80,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 56,
          stamina: 74,
          strength: 78
        }
      }
    },

    // DEFENSAS
    {
      id: "rayo_andrei_ratiu",
      name: "Andrei Rațiu",
      shirtNumber: 2,
      position: "RB",
      overall: 76,
      wage: 1500000,
      contractYears: 5, // hasta 2030
      value: 11000000,
      birthDate: "1998-01-01",
      nationality: "Rumanía",
      birthPlace: "Rumanía",
      youthClub: "SD Huesca",
      attributes: {
        technical: {
          passing: 76,
          shooting: 58,
          dribbling: 80,
          tackling: 76
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 86,
          leadership: 64
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "rayo_pep_chavarria",
      name: "Pep Chavarría",
      shirtNumber: 3,
      position: "LB",
      overall: 75,
      wage: 1300000,
      contractYears: 5, // hasta 2030
      value: 9000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Zaragoza",
      attributes: {
        technical: {
          passing: 76,
          shooting: 56,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "rayo_luiz_felipe",
      name: "Luiz Felipe",
      shirtNumber: 5,
      position: "CB",
      overall: 79,
      wage: 2200000,
      contractYears: 1, // hasta 2026
      value: 16000000,
      birthDate: "1997-01-01",
      nationality: "Italia",
      birthPlace: "Brasil",
      youthClub: "Olympique de Marseille",
      attributes: {
        technical: {
          passing: 76,
          shooting: 46,
          dribbling: 68,
          tackling: 84
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 86,
          leadership: 74
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 86
        }
      }
    },
    {
      id: "rayo_abdul_mumin",
      name: "Abdul Mumin",
      shirtNumber: 16,
      position: "CB",
      overall: 77,
      wage: 1700000,
      contractYears: 1, // hasta 2026
      value: 13000000,
      birthDate: "1998-01-01",
      nationality: "Ghana",
      birthPlace: "Ghana",
      youthClub: "Vitória SC",
      attributes: {
        technical: {
          passing: 74,
          shooting: 46,
          dribbling: 66,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 76,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "rayo_ivan_balliu",
      name: "Iván Balliu",
      shirtNumber: 20,
      position: "RB",
      overall: 76,
      wage: 1500000,
      contractYears: 2, // hasta 2027
      value: 9000000,
      birthDate: "1992-01-01",
      nationality: "Albania",
      birthPlace: "España",
      youthClub: "UD Almería",
      attributes: {
        technical: {
          passing: 78,
          shooting: 54,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 74,
          composure: 76,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "rayo_pacha_espino",
      name: "\"Pacha\" Espino",
      shirtNumber: 22,
      position: "LB",
      overall: 77,
      wage: 1600000,
      contractYears: 1, // hasta 2026
      value: 10000000,
      birthDate: "1992-01-01",
      nationality: "Uruguay",
      birthPlace: "Uruguay",
      youthClub: "Cádiz CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 56,
          dribbling: 78,
          tackling: 82
        },
        mental: {
          vision: 74,
          composure: 76,
          workRate: 88,
          leadership: 72
        },
        physical: {
          pace: 80,
          stamina: 86,
          strength: 74
        }
      }
    },
    {
      id: "rayo_lejeune",
      name: "Florian Lejeune",
      shirtNumber: 24,
      position: "CB",
      overall: 78,
      wage: 1800000,
      contractYears: 2, // hasta 2027
      value: 10000000,
      birthDate: "1991-01-01",
      nationality: "Francia",
      birthPlace: "Francia",
      youthClub: "Deportivo Alavés",
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
          leadership: 78
        },
        physical: {
          pace: 66,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "rayo_marco_sias",
      name: "Marco de las Sías",
      shirtNumber: 26,
      position: "CB",
      overall: 69,
      wage: 600000,
      contractYears: 2, // hasta 2027
      value: 3000000,
      birthDate: "2006-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Rayo Vallecano",
      attributes: {
        technical: {
          passing: 66,
          shooting: 40,
          dribbling: 64,
          tackling: 70
        },
        mental: {
          vision: 64,
          composure: 62,
          workRate: 82,
          leadership: 50
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 70
        }
      }
    },
    {
      id: "rayo_nobel_mendy",
      name: "Nobel Mendy",
      shirtNumber: 32,
      position: "CB",
      overall: 72,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2004-01-01",
      nationality: "Senegal",
      birthPlace: "Senegal",
      youthClub: "Real Betis",
      attributes: {
        technical: {
          passing: 70,
          shooting: 42,
          dribbling: 66,
          tackling: 74
        },
        mental: {
          vision: 68,
          composure: 66,
          workRate: 84,
          leadership: 54
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 76
        }
      }
    },
    {
      id: "rayo_vertrouwd",
      name: "Jozhua Vertrouwd",
      shirtNumber: 33,
      position: "CB",
      overall: 71,
      wage: 800000,
      contractYears: 1, // hasta 2026
      value: 4500000,
      birthDate: "2004-01-01",
      nationality: "Países Bajos",
      birthPlace: "Países Bajos",
      youthClub: "CD Castellón",
      attributes: {
        technical: {
          passing: 68,
          shooting: 42,
          dribbling: 64,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 66,
          workRate: 82,
          leadership: 52
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 74
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "rayo_pedro_diaz",
      name: "Pedro Díaz",
      shirtNumber: 4,
      position: "CM",
      overall: 77,
      wage: 1700000,
      contractYears: 3, // hasta 2028
      value: 13000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Girondins de Bordeaux",
      attributes: {
        technical: {
          passing: 84,
          shooting: 76,
          dribbling: 80,
          tackling: 72
        },
        mental: {
          vision: 82,
          composure: 78,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "rayo_pathe_ciss",
      name: "Pathé Ciss",
      shirtNumber: 6,
      position: "CDM",
      overall: 77,
      wage: 1700000,
      contractYears: 2, // hasta 2027
      value: 13000000,
      birthDate: "1994-01-01",
      nationality: "Senegal",
      birthPlace: "Senegal",
      youthClub: "CF Fuenlabrada",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 76,
          tackling: 84
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 88,
          leadership: 72
        },
        physical: {
          pace: 72,
          stamina: 86,
          strength: 82
        }
      }
    },
    {
      id: "rayo_isi_palazon",
      name: "\"Isi\" Palazón",
      shirtNumber: 7,
      position: "RW",
      overall: 80,
      wage: 2200000,
      contractYears: 3, // hasta 2028
      value: 23000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "SD Ponferradina",
      attributes: {
        technical: {
          passing: 86,
          shooting: 82,
          dribbling: 86,
          tackling: 54
        },
        mental: {
          vision: 86,
          composure: 82,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "rayo_oscar_trejo",
      name: "Óscar Trejo",
      shirtNumber: 8,
      position: "CAM",
      overall: 79,
      wage: 2300000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1988-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Toulouse FC",
      attributes: {
        technical: {
          passing: 86,
          shooting: 82,
          dribbling: 86,
          tackling: 56
        },
        mental: {
          vision: 88,
          composure: 84,
          workRate: 84,
          leadership: 84
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "rayo_gumbau",
      name: "Gerard Gumbau",
      shirtNumber: 15,
      position: "CM",
      overall: 76,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 10000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Granada CF",
      attributes: {
        technical: {
          passing: 84,
          shooting: 76,
          dribbling: 78,
          tackling: 74
        },
        mental: {
          vision: 82,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 70,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "rayo_unai_lopez",
      name: "Unai López",
      shirtNumber: 17,
      position: "CM",
      overall: 77,
      wage: 1700000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 82,
          tackling: 72
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "rayo_alvaro_garcia",
      name: "Álvaro García",
      shirtNumber: 18,
      position: "LW",
      overall: 79,
      wage: 2000000,
      contractYears: 3, // hasta 2028
      value: 20000000,
      birthDate: "1992-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Cádiz CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 80,
          dribbling: 86,
          tackling: 56
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 88,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "rayo_oscar_valentin",
      name: "Óscar Valentín",
      shirtNumber: 23,
      position: "CDM",
      overall: 78,
      wage: 1900000,
      contractYears: 2, // hasta 2027
      value: 14000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Rayo Majadahonda",
      attributes: {
        technical: {
          passing: 80,
          shooting: 70,
          dribbling: 76,
          tackling: 86
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 90,
          leadership: 82
        },
        physical: {
          pace: 70,
          stamina: 86,
          strength: 80
        }
      }
    },
    {
      id: "rayo_samu_becerra",
      name: "\"Samu\" Becerra",
      shirtNumber: 28,
      position: "CM",
      overall: 69,
      wage: 600000,
      contractYears: 2, // hasta 2027
      value: 3000000,
      birthDate: "2006-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Rayo Vallecano",
      attributes: {
        technical: {
          passing: 72,
          shooting: 66,
          dribbling: 74,
          tackling: 66
        },
        mental: {
          vision: 70,
          composure: 64,
          workRate: 84,
          leadership: 50
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 70
        }
      }
    },

    // DELANTEROS
    {
      id: "rayo_alemao",
      name: "Alexandre Zurawski \"Alemão\"",
      shirtNumber: 9,
      position: "ST",
      overall: 77,
      wage: 1800000,
      contractYears: 5, // hasta 2030
      value: 16000000,
      birthDate: "1998-01-01",
      nationality: "Brasil",
      birthPlace: "Brasil",
      youthClub: "CF Pachuca",
      attributes: {
        technical: {
          passing: 74,
          shooting: 84,
          dribbling: 78,
          tackling: 46
        },
        mental: {
          vision: 74,
          composure: 78,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "rayo_sergio_camello",
      name: "Sergio Camello",
      shirtNumber: 10,
      position: "ST",
      overall: 76,
      wage: 1600000,
      contractYears: 2, // hasta 2027
      value: 13000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Atlético de Madrid",
      attributes: {
        technical: {
          passing: 76,
          shooting: 82,
          dribbling: 80,
          tackling: 46
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 86,
          leadership: 66
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "rayo_randy_nteka",
      name: "Randy Nteka",
      shirtNumber: 11,
      position: "ST",
      overall: 75,
      wage: 1600000,
      contractYears: 3, // hasta 2028
      value: 11000000,
      birthDate: "1997-01-01",
      nationality: "Angola",
      birthPlace: "Francia",
      youthClub: "CF Fuenlabrada",
      attributes: {
        technical: {
          passing: 72,
          shooting: 80,
          dribbling: 78,
          tackling: 50
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 82
        }
      }
    },
    {
      id: "rayo_de_frutos",
      name: "Jorge de Frutos",
      shirtNumber: 19,
      position: "RW",
      overall: 79,
      wage: 2000000,
      contractYears: 3, // hasta 2028
      value: 22000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 82,
          shooting: 80,
          dribbling: 86,
          tackling: 52
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 86,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "rayo_fran_perez",
      name: "\"Fran\" Pérez",
      shirtNumber: 21,
      position: "LW",
      overall: 76,
      wage: 1500000,
      contractYears: 4, // hasta 2029
      value: 15000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 78,
          shooting: 78,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 76,
          composure: 76,
          workRate: 86,
          leadership: 62
        },
        physical: {
          pace: 86,
          stamina: 84,
          strength: 72
        }
      }
    }
  ],

  // =======================
  // REAL BETIS BALOMPIÉ
  // =======================
  betis: [
    // PORTEROS
    {
      id: "betis_alvaro_valles",
      name: "Álvaro Valles",
      shirtNumber: 1,
      position: "GK",
      overall: 78,
      wage: 1800000,
      contractYears: 5, // hasta 2030
      value: 14000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Agente libre",
      attributes: {
        technical: {
          passing: 68,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 74,
          composure: 82,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 58,
          stamina: 76,
          strength: 80
        }
      }
    },
    {
      id: "betis_adrian",
      name: "Adrián San Miguel",
      shirtNumber: 13,
      position: "GK",
      overall: 74,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 4000000,
      birthDate: "1987-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Liverpool FC",
      attributes: {
        technical: {
          passing: 64,
          shooting: 8,
          dribbling: 32,
          tackling: 24
        },
        mental: {
          vision: 72,
          composure: 82,
          workRate: 78,
          leadership: 82
        },
        physical: {
          pace: 50,
          stamina: 70,
          strength: 78
        }
      }
    },
    {
      id: "betis_pau_lopez",
      name: "Pau López",
      shirtNumber: 25,
      position: "GK",
      overall: 79,
      wage: 2000000,
      contractYears: 3, // hasta 2028
      value: 16000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Deportivo Toluca",
      attributes: {
        technical: {
          passing: 70,
          shooting: 10,
          dribbling: 38,
          tackling: 28
        },
        mental: {
          vision: 76,
          composure: 84,
          workRate: 82,
          leadership: 76
        },
        physical: {
          pace: 58,
          stamina: 76,
          strength: 82
        }
      }
    },

    // DEFENSAS
    {
      id: "betis_bellerin",
      name: "Héctor Bellerín",
      shirtNumber: 2,
      position: "RB",
      overall: 79,
      wage: 2600000,
      contractYears: 3, // hasta 2028
      value: 19000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Sporting CP",
      attributes: {
        technical: {
          passing: 80,
          shooting: 64,
          dribbling: 82,
          tackling: 78
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 88,
          leadership: 72
        },
        physical: {
          pace: 86,
          stamina: 86,
          strength: 74
        }
      }
    },
    {
      id: "betis_diego_llorente",
      name: "Diego Llorente",
      shirtNumber: 3,
      position: "CB",
      overall: 78,
      wage: 2300000,
      contractYears: 3, // hasta 2028
      value: 17000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Leeds United FC",
      attributes: {
        technical: {
          passing: 78,
          shooting: 50,
          dribbling: 68,
          tackling: 84
        },
        mental: {
          vision: 76,
          composure: 80,
          workRate: 86,
          leadership: 76
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "betis_natan",
      name: "Natan de Souza",
      shirtNumber: 4,
      position: "CB",
      overall: 77,
      wage: 1800000,
      contractYears: 5, // hasta 2030
      value: 15000000,
      birthDate: "2001-01-01",
      nationality: "Brasil",
      birthPlace: "Brasil",
      youthClub: "SSC Napoli",
      attributes: {
        technical: {
          passing: 74,
          shooting: 48,
          dribbling: 70,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "betis_bartra",
      name: "Marc Bartra",
      shirtNumber: 5,
      position: "CB",
      overall: 79,
      wage: 2200000,
      contractYears: 2, // hasta 2027
      value: 14000000,
      birthDate: "1991-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Trabzonspor",
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
          pace: 70,
          stamina: 82,
          strength: 84
        }
      }
    },
    {
      id: "betis_ricardo_rodriguez",
      name: "Ricardo Rodríguez",
      shirtNumber: 12,
      position: "LB",
      overall: 78,
      wage: 2100000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1992-01-01",
      nationality: "Suiza",
      birthPlace: "Suiza",
      youthClub: "Torino FC",
      attributes: {
        technical: {
          passing: 80,
          shooting: 70,
          dribbling: 76,
          tackling: 80
        },
        mental: {
          vision: 78,
          composure: 82,
          workRate: 84,
          leadership: 78
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "betis_valentin_gomez",
      name: "Valentín Gómez",
      shirtNumber: 16,
      position: "CB",
      overall: 75,
      wage: 1200000,
      contractYears: 5, // hasta 2030
      value: 9000000,
      birthDate: "2003-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Vélez Sarsfield",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 66,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 86,
          leadership: 64
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "betis_junior_firpo",
      name: "Junior Firpo",
      shirtNumber: 23,
      position: "LB",
      overall: 77,
      wage: 1900000,
      contractYears: 3, // hasta 2028
      value: 13000000,
      birthDate: "1996-01-01",
      nationality: "República Dominicana",
      birthPlace: "República Dominicana",
      youthClub: "Leeds United FC",
      attributes: {
        technical: {
          passing: 78,
          shooting: 62,
          dribbling: 80,
          tackling: 78
        },
        mental: {
          vision: 74,
          composure: 76,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "betis_aitor_ruibal",
      name: "Aitor Ruibal",
      shirtNumber: 24,
      position: "RB",
      overall: 76,
      wage: 1600000,
      contractYears: 3, // hasta 2028
      value: 11000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Betis",
      attributes: {
        technical: {
          passing: 78,
          shooting: 70,
          dribbling: 80,
          tackling: 74
        },
        mental: {
          vision: 74,
          composure: 74,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "betis_angel_ortiz",
      name: "Ángel Ortiz",
      shirtNumber: 40,
      position: "CB",
      overall: 71,
      wage: 800000,
      contractYears: 4, // hasta 2029
      value: 4500000,
      birthDate: "2004-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Betis",
      attributes: {
        technical: {
          passing: 70,
          shooting: 40,
          dribbling: 64,
          tackling: 74
        },
        mental: {
          vision: 68,
          composure: 66,
          workRate: 82,
          leadership: 54
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 74
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "betis_sergi_altimira",
      name: "Sergi Altimira",
      shirtNumber: 6,
      position: "CDM",
      overall: 75,
      wage: 1300000,
      contractYears: 4, // hasta 2029
      value: 9000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF",
      attributes: {
        technical: {
          passing: 78,
          shooting: 66,
          dribbling: 74,
          tackling: 80
        },
        mental: {
          vision: 76,
          composure: 74,
          workRate: 88,
          leadership: 64
        },
        physical: {
          pace: 72,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "betis_pablo_fornals",
      name: "Pablo Fornals",
      shirtNumber: 8,
      position: "CM",
      overall: 82,
      wage: 3200000,
      contractYears: 4, // hasta 2029
      value: 28000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "West Ham United FC",
      attributes: {
        technical: {
          passing: 86,
          shooting: 80,
          dribbling: 84,
          tackling: 70
        },
        mental: {
          vision: 86,
          composure: 82,
          workRate: 86,
          leadership: 78
        },
        physical: {
          pace: 76,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "betis_amrabat",
      name: "Sofyan Amrabat",
      shirtNumber: 14,
      position: "CDM",
      overall: 82,
      wage: 3200000,
      contractYears: 1, // hasta 2026
      value: 26000000,
      birthDate: "1996-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Fenerbahçe SK",
      attributes: {
        technical: {
          passing: 82,
          shooting: 72,
          dribbling: 78,
          tackling: 88
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 92,
          leadership: 80
        },
        physical: {
          pace: 74,
          stamina: 88,
          strength: 86
        }
      }
    },
    {
      id: "betis_riquelme",
      name: "Rodrigo Riquelme",
      shirtNumber: 17,
      position: "LW",
      overall: 80,
      wage: 2600000,
      contractYears: 5, // hasta 2030
      value: 26000000,
      birthDate: "2000-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Atlético de Madrid",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 86,
          tackling: 60
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 84,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "betis_deossa",
      name: "Nelson Deossa",
      shirtNumber: 18,
      position: "CM",
      overall: 76,
      wage: 1500000,
      contractYears: 5, // hasta 2030
      value: 11000000,
      birthDate: "2000-01-01",
      nationality: "Colombia",
      birthPlace: "Colombia",
      youthClub: "CF Monterrey",
      attributes: {
        technical: {
          passing: 78,
          shooting: 72,
          dribbling: 80,
          tackling: 74
        },
        mental: {
          vision: 76,
          composure: 74,
          workRate: 86,
          leadership: 64
        },
        physical: {
          pace: 76,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "betis_lo_celso",
      name: "Giovani Lo Celso",
      shirtNumber: 20,
      position: "CAM",
      overall: 83,
      wage: 3600000,
      contractYears: 3, // hasta 2028
      value: 32000000,
      birthDate: "1996-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Tottenham Hotspur FC",
      attributes: {
        technical: {
          passing: 88,
          shooting: 82,
          dribbling: 86,
          tackling: 66
        },
        mental: {
          vision: 88,
          composure: 84,
          workRate: 84,
          leadership: 78
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "betis_marc_roca",
      name: "Marc Roca",
      shirtNumber: 21,
      position: "CDM",
      overall: 79,
      wage: 2400000,
      contractYears: 4, // hasta 2029
      value: 20000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Leeds United FC",
      attributes: {
        technical: {
          passing: 84,
          shooting: 72,
          dribbling: 78,
          tackling: 82
        },
        mental: {
          vision: 82,
          composure: 82,
          workRate: 86,
          leadership: 74
        },
        physical: {
          pace: 72,
          stamina: 86,
          strength: 78
        }
      }
    },
    {
      id: "betis_isco",
      name: "Isco Alarcón",
      shirtNumber: 22,
      position: "CAM",
      overall: 83,
      wage: 3400000,
      contractYears: 3, // hasta 2028
      value: 28000000,
      birthDate: "1992-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Agente libre",
      attributes: {
        technical: {
          passing: 90,
          shooting: 84,
          dribbling: 90,
          tackling: 60
        },
        mental: {
          vision: 90,
          composure: 86,
          workRate: 82,
          leadership: 80
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 74
        }
      }
    },

    // DELANTEROS
    {
      id: "betis_antony",
      name: "Antony dos Santos",
      shirtNumber: 7,
      position: "RW",
      overall: 82,
      wage: 3200000,
      contractYears: 5, // hasta 2030
      value: 32000000,
      birthDate: "2000-01-01",
      nationality: "Brasil",
      birthPlace: "Brasil",
      youthClub: "Manchester United FC",
      attributes: {
        technical: {
          passing: 82,
          shooting: 82,
          dribbling: 90,
          tackling: 52
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 88,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "betis_chimy_avila",
      name: "Chimy Ávila",
      shirtNumber: 9,
      position: "ST",
      overall: 79,
      wage: 2600000,
      contractYears: 2, // hasta 2027
      value: 20000000,
      birthDate: "1994-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "CA Osasuna",
      attributes: {
        technical: {
          passing: 74,
          shooting: 84,
          dribbling: 80,
          tackling: 52
        },
        mental: {
          vision: 76,
          composure: 80,
          workRate: 90,
          leadership: 76
        },
        physical: {
          pace: 80,
          stamina: 86,
          strength: 82
        }
      }
    },
    {
      id: "betis_ez_abde",
      name: "Ez Abde",
      shirtNumber: 10,
      position: "LW",
      overall: 79,
      wage: 2300000,
      contractYears: 4, // hasta 2029
      value: 23000000,
      birthDate: "2002-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "FC Barcelona",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 88,
          tackling: 50
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 90,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "betis_bakambu",
      name: "Cédric Bakambu",
      shirtNumber: 11,
      position: "ST",
      overall: 78,
      wage: 2200000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1991-01-01",
      nationality: "República Democrática del Congo",
      birthPlace: "RD Congo",
      youthClub: "Galatasaray SK",
      attributes: {
        technical: {
          passing: 74,
          shooting: 82,
          dribbling: 80,
          tackling: 48
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "betis_cucho_hernandez",
      name: "Cucho Hernández",
      shirtNumber: 19,
      position: "ST",
      overall: 81,
      wage: 2800000,
      contractYears: 5, // hasta 2030
      value: 30000000,
      birthDate: "1999-01-01",
      nationality: "Colombia",
      birthPlace: "Colombia",
      youthClub: "Columbus Crew SC",
      attributes: {
        technical: {
          passing: 80,
          shooting: 86,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 86,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "betis_pablo_garcia",
      name: "Pablo García",
      shirtNumber: 52,
      position: "ST",
      overall: 70,
      wage: 700000,
      contractYears: 4, // hasta 2029
      value: 4000000,
      birthDate: "2006-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Betis",
      attributes: {
        technical: {
          passing: 70,
          shooting: 76,
          dribbling: 76,
          tackling: 40
        },
        mental: {
          vision: 68,
          composure: 66,
          workRate: 82,
          leadership: 52
        },
        physical: {
          pace: 82,
          stamina: 80,
          strength: 72
        }
      }
    }
  ],
  
   // =======================
  // REAL MADRID CF
  // =======================
  realmadrid: [
    {
      id: "rm_courtois",
      name: "Thibaut Courtois",
      shirtNumber: 1,
      position: "GK",
      overall: 90,
      wage: 12000000,
      contractYears: 2,
      value: 40000000,
      birthDate: "1992-05-11",
      nationality: "Bélgica",
      birthPlace: "Bree (Bélgica)",
      youthClub: "Genk",
      attributes: {
        technical: {
          passing: 70,
          shooting: 15,
          dribbling: 40,
          tackling: 30
        },
        mental: {
          vision: 78,
          composure: 93,
          workRate: 82,
          leadership: 85
        },
        physical: {
          pace: 55,
          stamina: 72,
          strength: 88
        }
      }
    },
    {
      id: "rm_lunin",
      name: "Andriy Lunin",
      shirtNumber: 13,
      position: "GK",
      overall: 84,
      wage: 4000000,
      contractYears: 5,
      value: 18000000,
      birthDate: "1999-02-11",
      nationality: "Ucrania",
      birthPlace: "Krasnohrad (Ucrania)",
      youthClub: "Metalist Kharkiv",
      attributes: {
        technical: {
          passing: 68,
          shooting: 12,
          dribbling: 38,
          tackling: 28
        },
        mental: {
          vision: 74,
          composure: 84,
          workRate: 80,
          leadership: 70
        },
        physical: {
          pace: 60,
          stamina: 76,
          strength: 80
        }
      }
    },
    {
      id: "rm_fran_gonzalez",
      name: "Fran González",
      shirtNumber: 26,
      position: "GK",
      overall: 76,
      wage: 800000,
      contractYears: 1,
      value: 4000000,
      birthDate: "2005-06-24",
      nationality: "España",
      birthPlace: "León (España)",
      youthClub: "Cultural Leonesa",
      attributes: {
        technical: {
          passing: 62,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 66,
          composure: 72,
          workRate: 78,
          leadership: 60
        },
        physical: {
          pace: 63,
          stamina: 74,
          strength: 72
        }
      }
    },

    // DEFENSAS
    {
      id: "rm_carvajal",
      name: "Dani Carvajal",
      shirtNumber: 2,
      position: "RB",
      overall: 86,
      wage: 9000000,
      contractYears: 1,
      value: 22000000,
      birthDate: "1992-01-11",
      nationality: "España",
      birthPlace: "Leganés (España)",
      youthClub: "Real Madrid",
      attributes: {
        technical: {
          passing: 83,
          shooting: 65,
          dribbling: 78,
          tackling: 88
        },
        mental: {
          vision: 80,
          composure: 84,
          workRate: 92,
          leadership: 86
        },
        physical: {
          pace: 82,
          stamina: 88,
          strength: 78
        }
      }
    },
    {
      id: "rm_militao",
      name: "Éder Militão",
      shirtNumber: 3,
      position: "CB",
      overall: 87,
      wage: 10000000,
      contractYears: 3,
      value: 45000000,
      birthDate: "1998-01-18",
      nationality: "Brasil",
      birthPlace: "Sertãozinho (Brasil)",
      youthClub: "São Paulo",
      attributes: {
        technical: {
          passing: 78,
          shooting: 55,
          dribbling: 72,
          tackling: 90
        },
        mental: {
          vision: 76,
          composure: 84,
          workRate: 90,
          leadership: 82
        },
        physical: {
          pace: 84,
          stamina: 86,
          strength: 88
        }
      }
    },
    {
      id: "rm_alaba",
      name: "David Alaba",
      shirtNumber: 4,
      position: "CB",
      overall: 86,
      wage: 10000000,
      contractYears: 1,
      value: 25000000,
      birthDate: "1992-06-24",
      nationality: "Austria",
      birthPlace: "Viena (Austria)",
      youthClub: "Austria Wien",
      attributes: {
        technical: {
          passing: 86,
          shooting: 74,
          dribbling: 80,
          tackling: 86
        },
        mental: {
          vision: 84,
          composure: 86,
          workRate: 88,
          leadership: 88
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "rm_trent_aa",
      name: "Trent Alexander-Arnold",
      shirtNumber: 12,
      position: "RB",
      overall: 87,
      wage: 12000000,
      contractYears: 6,
      value: 55000000,
      birthDate: "1998-10-07",
      nationality: "Inglaterra",
      birthPlace: "Liverpool (Inglaterra)",
      youthClub: "Liverpool",
      attributes: {
        technical: {
          passing: 92,
          shooting: 75,
          dribbling: 82,
          tackling: 76
        },
        mental: {
          vision: 92,
          composure: 84,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "rm_raul_asencio",
      name: "Raúl Asencio",
      shirtNumber: 17,
      position: "CB",
      overall: 73,
      wage: 1000000,
      contractYears: 6,
      value: 5000000,
      birthDate: "2003-02-13",
      nationality: "España",
      birthPlace: "Las Palmas (España)",
      youthClub: "UD Las Palmas",
      attributes: {
        technical: {
          passing: 66,
          shooting: 40,
          dribbling: 60,
          tackling: 74
        },
        mental: {
          vision: 62,
          composure: 68,
          workRate: 76,
          leadership: 64
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 74
        }
      }
    },
    {
      id: "rm_alvaro_carreras",
      name: "Álvaro Carreras",
      shirtNumber: 18,
      position: "LB",
      overall: 78,
      wage: 2500000,
      contractYears: 6,
      value: 12000000,
      birthDate: "2003-04-07",
      nationality: "España",
      birthPlace: "Ferrol (España)",
      youthClub: "Racing de Ferrol",
      attributes: {
        technical: {
          passing: 74,
          shooting: 52,
          dribbling: 74,
          tackling: 76
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 80,
          leadership: 66
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "rm_fran_garcia",
      name: "Fran García",
      shirtNumber: 20,
      position: "LB",
      overall: 80,
      wage: 3000000,
      contractYears: 2,
      value: 15000000,
      birthDate: "1999-08-14",
      nationality: "España",
      birthPlace: "Bolaños de Calatrava (España)",
      youthClub: "Real Madrid",
      attributes: {
        technical: {
          passing: 76,
          shooting: 55,
          dribbling: 76,
          tackling: 78
        },
        mental: {
          vision: 72,
          composure: 74,
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
      id: "rm_rudiger",
      name: "Antonio Rüdiger",
      shirtNumber: 22,
      position: "CB",
      overall: 87,
      wage: 11000000,
      contractYears: 1,
      value: 30000000,
      birthDate: "1993-03-03",
      nationality: "Alemania",
      birthPlace: "Berlín (Alemania)",
      youthClub: "VfB Stuttgart",
      attributes: {
        technical: {
          passing: 76,
          shooting: 54,
          dribbling: 70,
          tackling: 90
        },
        mental: {
          vision: 70,
          composure: 84,
          workRate: 92,
          leadership: 86
        },
        physical: {
          pace: 82,
          stamina: 86,
          strength: 90
        }
      }
    },
    {
      id: "rm_ferland_mendy",
      name: "Ferland Mendy",
      shirtNumber: 23,
      position: "LB",
      overall: 84,
      wage: 7000000,
      contractYears: 2,
      value: 22000000,
      birthDate: "1995-06-08",
      nationality: "Francia",
      birthPlace: "Meulan-en-Yvelines (Francia)",
      youthClub: "Paris Saint-Germain",
      attributes: {
        technical: {
          passing: 74,
          shooting: 58,
          dribbling: 80,
          tackling: 84
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 86,
          stamina: 84,
          strength: 82
        }
      }
    },
    {
      id: "rm_huijsen",
      name: "Dean Huijsen",
      shirtNumber: 24,
      position: "CB",
      overall: 80,
      wage: 3500000,
      contractYears: 5,
      value: 25000000,
      birthDate: "2005-04-14",
      nationality: "España",
      birthPlace: "Ámsterdam (Países Bajos)",
      youthClub: "Málaga CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 60,
          dribbling: 70,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 76,
          workRate: 82,
          leadership: 72
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 84
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "rm_bellingham",
      name: "Jude Bellingham",
      shirtNumber: 5,
      position: "CAM",
      overall: 92,
      wage: 14000000,
      contractYears: 4,
      value: 150000000,
      birthDate: "2003-06-29",
      nationality: "Inglaterra",
      birthPlace: "Stourbridge (Inglaterra)",
      youthClub: "Birmingham City",
      attributes: {
        technical: {
          passing: 90,
          shooting: 90,
          dribbling: 88,
          tackling: 80
        },
        mental: {
          vision: 92,
          composure: 90,
          workRate: 94,
          leadership: 88
        },
        physical: {
          pace: 84,
          stamina: 92,
          strength: 86
        }
      }
    },
    {
      id: "rm_camavinga",
      name: "Eduardo Camavinga",
      shirtNumber: 6,
      position: "CM",
      overall: 87,
      wage: 10000000,
      contractYears: 4,
      value: 80000000,
      birthDate: "2002-11-10",
      nationality: "Francia",
      birthPlace: "Cabinda (Angola)",
      youthClub: "Drapeau-Fougères",
      attributes: {
        technical: {
          passing: 84,
          shooting: 74,
          dribbling: 86,
          tackling: 88
        },
        mental: {
          vision: 84,
          composure: 84,
          workRate: 92,
          leadership: 80
        },
        physical: {
          pace: 84,
          stamina: 90,
          strength: 84
        }
      }
    },
    {
      id: "rm_valverde",
      name: "Fede Valverde",
      shirtNumber: 8,
      position: "CM",
      overall: 87,
      wage: 11000000,
      contractYears: 4,
      value: 85000000,
      birthDate: "1998-07-22",
      nationality: "Uruguay",
      birthPlace: "Montevideo (Uruguay)",
      youthClub: "Peñarol",
      attributes: {
        technical: {
          passing: 86,
          shooting: 82,
          dribbling: 84,
          tackling: 82
        },
        mental: {
          vision: 84,
          composure: 84,
          workRate: 94,
          leadership: 82
        },
        physical: {
          pace: 88,
          stamina: 94,
          strength: 84
        }
      }
    },
    {
      id: "rm_tchouameni",
      name: "Aurélien Tchouaméni",
      shirtNumber: 14,
      position: "CDM",
      overall: 86,
      wage: 10000000,
      contractYears: 3,
      value: 70000000,
      birthDate: "2000-01-27",
      nationality: "Francia",
      birthPlace: "Ruan (Francia)",
      youthClub: "Girondins de Bordeaux",
      attributes: {
        technical: {
          passing: 84,
          shooting: 72,
          dribbling: 80,
          tackling: 90
        },
        mental: {
          vision: 84,
          composure: 86,
          workRate: 90,
          leadership: 82
        },
        physical: {
          pace: 80,
          stamina: 88,
          strength: 88
        }
      }
    },
    {
      id: "rm_arda_guler",
      name: "Arda Güler",
      shirtNumber: 15,
      position: "RW",
      overall: 82,
      wage: 5000000,
      contractYears: 4,
      value: 35000000,
      birthDate: "2005-02-25",
      nationality: "Turquía",
      birthPlace: "Ankara (Turquía)",
      youthClub: "Gençlerbirliği",
      attributes: {
        technical: {
          passing: 86,
          shooting: 82,
          dribbling: 86,
          tackling: 55
        },
        mental: {
          vision: 86,
          composure: 80,
          workRate: 78,
          leadership: 64
        },
        physical: {
          pace: 76,
          stamina: 78,
          strength: 60
        }
      }
    },
    {
      id: "rm_ceballos",
      name: "Dani Ceballos",
      shirtNumber: 19,
      position: "CM",
      overall: 81,
      wage: 6000000,
      contractYears: 2,
      value: 20000000,
      birthDate: "1996-08-07",
      nationality: "España",
      birthPlace: "Utrera (España)",
      youthClub: "Real Betis",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 84,
          tackling: 64
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 80,
          leadership: 70
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "rm_mastantuono",
      name: "Franco Mastantuono",
      shirtNumber: 30,
      position: "RW",
      overall: 78,
      wage: 3000000,
      contractYears: 6,
      value: 20000000,
      birthDate: "2007-08-04",
      nationality: "Argentina",
      birthPlace: "Azul (Argentina)",
      youthClub: "River Plate",
      attributes: {
        technical: {
          passing: 80,
          shooting: 78,
          dribbling: 82,
          tackling: 55
        },
        mental: {
          vision: 80,
          composure: 74,
          workRate: 78,
          leadership: 64
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 68
        }
      }
    },

    // DELANTEROS
    {
      id: "rm_vini_junior",
      name: "Vini Júnior",
      shirtNumber: 7,
      position: "LW",
      overall: 91,
      wage: 15000000,
      contractYears: 2,
      value: 160000000,
      birthDate: "2000-07-12",
      nationality: "Brasil",
      birthPlace: "São Gonçalo (Brasil)",
      youthClub: "Flamengo",
      attributes: {
        technical: {
          passing: 84,
          shooting: 88,
          dribbling: 96,
          tackling: 45
        },
        mental: {
          vision: 84,
          composure: 84,
          workRate: 88,
          leadership: 70
        },
        physical: {
          pace: 96,
          stamina: 90,
          strength: 78
        }
      }
    },
    {
      id: "rm_endrick",
      name: "Endrick Moreira",
      shirtNumber: 9,
      position: "ST",
      overall: 85,
      wage: 8000000,
      contractYears: 4,
      value: 65000000,
      birthDate: "2006-07-21",
      nationality: "Brasil",
      birthPlace: "Taguatinga (Brasil)",
      youthClub: "Palmeiras",
      attributes: {
        technical: {
          passing: 76,
          shooting: 88,
          dribbling: 86,
          tackling: 52
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 88,
          stamina: 86,
          strength: 84
        }
      }
    },
    {
      id: "rm_mbappe",
      name: "Kylian Mbappé",
      shirtNumber: 10,
      position: "ST",
      overall: 94,
      wage: 25000000,
      contractYears: 4,
      value: 180000000,
      birthDate: "1998-12-20",
      nationality: "Francia",
      birthPlace: "París (Francia)",
      youthClub: "AS Bondy",
      attributes: {
        technical: {
          passing: 86,
          shooting: 95,
          dribbling: 94,
          tackling: 48
        },
        mental: {
          vision: 88,
          composure: 92,
          workRate: 88,
          leadership: 80
        },
        physical: {
          pace: 98,
          stamina: 92,
          strength: 86
        }
      }
    },
    {
      id: "rm_rodrygo",
      name: "Rodrygo Goes",
      shirtNumber: 11,
      position: "RW",
      overall: 88,
      wage: 11000000,
      contractYears: 3,
      value: 90000000,
      birthDate: "2001-01-09",
      nationality: "Brasil",
      birthPlace: "Osasco (Brasil)",
      youthClub: "Santos",
      attributes: {
        technical: {
          passing: 84,
          shooting: 86,
          dribbling: 90,
          tackling: 52
        },
        mental: {
          vision: 84,
          composure: 86,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 88,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "rm_gonzalo_garcia",
      name: "Gonzalo García",
      shirtNumber: 16,
      position: "ST",
      overall: 80,
      wage: 3500000,
      contractYears: 5,
      value: 25000000,
      birthDate: "2004-03-24",
      nationality: "España",
      birthPlace: "Madrid (España)",
      youthClub: "Real Madrid",
      attributes: {
        technical: {
          passing: 76,
          shooting: 84,
          dribbling: 80,
          tackling: 48
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 80
        }
      }
    },
    {
      id: "rm_brahim_diaz",
      name: "Brahim Díaz",
      shirtNumber: 21,
      position: "RW",
      overall: 83,
      wage: 7000000,
      contractYears: 2,
      value: 30000000,
      birthDate: "1999-08-03",
      nationality: "Marruecos",
      birthPlace: "Málaga (España)",
      youthClub: "Málaga CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 82,
          dribbling: 88,
          tackling: 52
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 84,
          stamina: 82,
          strength: 70
        }
      }
    }
  ],
  
  // =======================
  // REAL OVIEDO
  // =======================
  realoviedo: [
    // PORTEROS
    {
      id: "oviedo_horatiu_moldovan",
      name: "Horatiu Moldovan",
      shirtNumber: 1,
      position: "GK",
      overall: 78,
      wage: 1800000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1998-01-01",
      nationality: "Rumanía",
      birthPlace: "Rumanía",
      youthClub: "Atlético de Madrid",
      attributes: {
        technical: {
          passing: 70,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 74,
          composure: 82,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 58,
          stamina: 76,
          strength: 80
        }
      }
    },
    {
      id: "oviedo_aaron_escandell",
      name: "Aarón Escandell",
      shirtNumber: 13,
      position: "GK",
      overall: 74,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 6000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "UD Las Palmas",
      attributes: {
        technical: {
          passing: 66,
          shooting: 8,
          dribbling: 34,
          tackling: 24
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 80,
          leadership: 66
        },
        physical: {
          pace: 54,
          stamina: 74,
          strength: 76
        }
      }
    },
    {
      id: "oviedo_miguel_narvaez",
      name: "Miguel Narváez",
      shirtNumber: 31,
      position: "GK",
      overall: 68,
      wage: 600000,
      contractYears: 2, // hasta 2027
      value: 2500000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "CD Badajoz",
      attributes: {
        technical: {
          passing: 60,
          shooting: 6,
          dribbling: 32,
          tackling: 22
        },
        mental: {
          vision: 62,
          composure: 64,
          workRate: 78,
          leadership: 52
        },
        physical: {
          pace: 56,
          stamina: 72,
          strength: 70
        }
      }
    },

    // DEFENSAS
    {
      id: "oviedo_eric_bailly",
      name: "Eric Bailly",
      shirtNumber: 2,
      position: "CB",
      overall: 79,
      wage: 2200000,
      contractYears: 2, // hasta 2027
      value: 15000000,
      birthDate: "1994-01-01",
      nationality: "Costa de Marfil",
      birthPlace: "Costa de Marfil",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 46,
          dribbling: 66,
          tackling: 84
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 86,
          leadership: 76
        },
        physical: {
          pace: 76,
          stamina: 84,
          strength: 86
        }
      }
    },
    {
      id: "oviedo_rahim_alhassane",
      name: "Rahim Alhassane",
      shirtNumber: 3,
      position: "CB",
      overall: 72,
      wage: 900000,
      contractYears: 2, // hasta 2027
      value: 5000000,
      birthDate: "2002-01-01",
      nationality: "Níger",
      birthPlace: "Níger",
      youthClub: "Recreativo de Huelva",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 66,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "oviedo_david_costas",
      name: "David Costas",
      shirtNumber: 4,
      position: "CB",
      overall: 75,
      wage: 1300000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Celta de Vigo",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 66,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 70,
          stamina: 82,
          strength: 80
        }
      }
    },
    {
      id: "oviedo_dani_calvo",
      name: "Dani Calvo",
      shirtNumber: 12,
      position: "CB",
      overall: 74,
      wage: 1200000,
      contractYears: 1, // hasta 2026
      value: 7000000,
      birthDate: "1994-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Elche CF",
      attributes: {
        technical: {
          passing: 70,
          shooting: 42,
          dribbling: 64,
          tackling: 78
        },
        mental: {
          vision: 68,
          composure: 74,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 68,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "oviedo_oier_luengo",
      name: "Oier Luengo",
      shirtNumber: 15,
      position: "CB",
      overall: 72,
      wage: 900000,
      contractYears: 2, // hasta 2027
      value: 5000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "SD Amorebieta",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 74
        },
        mental: {
          vision: 66,
          composure: 68,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 70,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "oviedo_david_carmo",
      name: "David Carmo",
      shirtNumber: 16,
      position: "CB",
      overall: 78,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 15000000,
      birthDate: "1999-01-01",
      nationality: "Angola",
      birthPlace: "Angola",
      youthClub: "Nottingham Forest",
      attributes: {
        technical: {
          passing: 76,
          shooting: 46,
          dribbling: 68,
          tackling: 84
        },
        mental: {
          vision: 74,
          composure: 78,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 86
        }
      }
    },
    {
      id: "oviedo_nacho_vidal",
      name: "Nacho Vidal",
      shirtNumber: 22,
      position: "RB",
      overall: 75,
      wage: 1300000,
      contractYears: 2, // hasta 2027
      value: 8000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "CA Osasuna",
      attributes: {
        technical: {
          passing: 76,
          shooting: 56,
          dribbling: 76,
          tackling: 78
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "oviedo_lucas_ahijado",
      name: "Lucas Ahijado",
      shirtNumber: 24,
      position: "RB",
      overall: 73,
      wage: 1000000,
      contractYears: 1, // hasta 2026
      value: 6000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Oviedo",
      attributes: {
        technical: {
          passing: 72,
          shooting: 52,
          dribbling: 74,
          tackling: 74
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 72
        }
      }
    },
    {
      id: "oviedo_omar_falah",
      name: "Omar Falah",
      shirtNumber: 29,
      position: "CB",
      overall: 68,
      wage: 600000,
      contractYears: 1, // hasta 2026
      value: 2500000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "UP Langreo",
      attributes: {
        technical: {
          passing: 64,
          shooting: 38,
          dribbling: 60,
          tackling: 70
        },
        mental: {
          vision: 62,
          composure: 62,
          workRate: 80,
          leadership: 52
        },
        physical: {
          pace: 70,
          stamina: 78,
          strength: 74
        }
      }
    },
    {
      id: "oviedo_marco_esteban",
      name: "Marco Esteban",
      shirtNumber: 30,
      position: "CB",
      overall: 66,
      wage: 500000,
      contractYears: 3, // hasta 2028
      value: 2000000,
      birthDate: "2006-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Oviedo",
      attributes: {
        technical: {
          passing: 62,
          shooting: 36,
          dribbling: 58,
          tackling: 68
        },
        mental: {
          vision: 60,
          composure: 60,
          workRate: 80,
          leadership: 48
        },
        physical: {
          pace: 70,
          stamina: 76,
          strength: 70
        }
      }
    },
    {
      id: "oviedo_alvaro_lemos",
      name: "Álvaro Lemos",
      shirtNumber: null,
      position: "RB",
      overall: 73,
      wage: 1000000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "UD Las Palmas",
      attributes: {
        technical: {
          passing: 74,
          shooting: 54,
          dribbling: 74,
          tackling: 72
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "oviedo_javi_lopez",
      name: "Javi López",
      shirtNumber: null,
      position: "LB",
      overall: 72,
      wage: 900000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Sociedad",
      attributes: {
        technical: {
          passing: 72,
          shooting: 50,
          dribbling: 74,
          tackling: 72
        },
        mental: {
          vision: 68,
          composure: 68,
          workRate: 84,
          leadership: 60
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 72
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "oviedo_alberto_reina",
      name: "Alberto Reina",
      shirtNumber: 5,
      position: "CM",
      overall: 74,
      wage: 1200000,
      contractYears: 2, // hasta 2027
      value: 8000000,
      birthDate: "1997-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "CD Mirandés",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 78,
          tackling: 70
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "oviedo_kwasi_sibo",
      name: "Kwasi Sibo",
      shirtNumber: 6,
      position: "CDM",
      overall: 73,
      wage: 1100000,
      contractYears: 1, // hasta 2026
      value: 6000000,
      birthDate: "1998-01-01",
      nationality: "Ghana",
      birthPlace: "Ghana",
      youthClub: "SD Amorebieta",
      attributes: {
        technical: {
          passing: 74,
          shooting: 66,
          dribbling: 72,
          tackling: 80
        },
        mental: {
          vision: 72,
          composure: 72,
          workRate: 86,
          leadership: 62
        },
        physical: {
          pace: 72,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "oviedo_santi_cazorla",
      name: "Santi Cazorla",
      shirtNumber: 8,
      position: "CAM",
      overall: 81,
      wage: 2500000,
      contractYears: 1, // hasta 2026
      value: 12000000,
      birthDate: "1985-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Oviedo",
      attributes: {
        technical: {
          passing: 90,
          shooting: 84,
          dribbling: 88,
          tackling: 60
        },
        mental: {
          vision: 92,
          composure: 88,
          workRate: 82,
          leadership: 88
        },
        physical: {
          pace: 64,
          stamina: 76,
          strength: 64
        }
      }
    },
    {
      id: "oviedo_haissem_hassan",
      name: "Haissem Hassan",
      shirtNumber: 10,
      position: "LW",
      overall: 72,
      wage: 900000,
      contractYears: 2, // hasta 2027
      value: 5000000,
      birthDate: "2002-01-01",
      nationality: "Francia",
      birthPlace: "Francia",
      youthClub: "Villarreal B",
      attributes: {
        technical: {
          passing: 74,
          shooting: 70,
          dribbling: 80,
          tackling: 58
        },
        mental: {
          vision: 72,
          composure: 70,
          workRate: 82,
          leadership: 58
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 68
        }
      }
    },
    {
      id: "oviedo_santiago_colombatto",
      name: "Santiago Colombatto",
      shirtNumber: 11,
      position: "CM",
      overall: 74,
      wage: 1300000,
      contractYears: 1, // hasta 2026
      value: 8000000,
      birthDate: "1997-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Club León",
      attributes: {
        technical: {
          passing: 80,
          shooting: 70,
          dribbling: 78,
          tackling: 72
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 72,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "oviedo_ejaria",
      name: "Ejaria",
      shirtNumber: 14,
      position: "CM",
      overall: 73,
      wage: 1100000,
      contractYears: 1, // hasta 2026
      value: 6000000,
      birthDate: "1997-01-01",
      nationality: "Inglaterra",
      birthPlace: "Inglaterra",
      youthClub: "Sin equipo",
      attributes: {
        technical: {
          passing: 78,
          shooting: 70,
          dribbling: 80,
          tackling: 60
        },
        mental: {
          vision: 76,
          composure: 74,
          workRate: 80,
          leadership: 60
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "oviedo_brandon_domingues",
      name: "Brandon Domingues",
      shirtNumber: 17,
      position: "CM",
      overall: 73,
      wage: 1100000,
      contractYears: 3, // hasta 2028
      value: 7000000,
      birthDate: "2000-01-01",
      nationality: "Francia",
      birthPlace: "Francia",
      youthClub: "Debreceni VSC",
      attributes: {
        technical: {
          passing: 78,
          shooting: 70,
          dribbling: 80,
          tackling: 64
        },
        mental: {
          vision: 76,
          composure: 74,
          workRate: 82,
          leadership: 60
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "oviedo_brekalo",
      name: "Josip Brekalo",
      shirtNumber: 18,
      position: "LW",
      overall: 78,
      wage: 2200000,
      contractYears: 2, // hasta 2027
      value: 18000000,
      birthDate: "1998-01-01",
      nationality: "Croacia",
      birthPlace: "Croacia",
      youthClub: "Fiorentina",
      attributes: {
        technical: {
          passing: 84,
          shooting: 80,
          dribbling: 86,
          tackling: 58
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "oviedo_dendoncker",
      name: "Leander Dendoncker",
      shirtNumber: 20,
      position: "CDM",
      overall: 80,
      wage: 2600000,
      contractYears: 2, // hasta 2027
      value: 22000000,
      birthDate: "1995-01-01",
      nationality: "Bélgica",
      birthPlace: "Bélgica",
      youthClub: "Aston Villa",
      attributes: {
        technical: {
          passing: 80,
          shooting: 72,
          dribbling: 76,
          tackling: 86
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 88,
          leadership: 78
        },
        physical: {
          pace: 72,
          stamina: 86,
          strength: 84
        }
      }
    },
    {
      id: "oviedo_luka_ilic",
      name: "Luka Ilić",
      shirtNumber: 21,
      position: "CM",
      overall: 78,
      wage: 2000000,
      contractYears: 3, // hasta 2028
      value: 18000000,
      birthDate: "1999-01-01",
      nationality: "Serbia",
      birthPlace: "Serbia",
      youthClub: "Estrella Roja",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 82,
          tackling: 70
        },
        mental: {
          vision: 82,
          composure: 80,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 76,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "oviedo_lamine_gueye",
      name: "Lamine Gueye",
      shirtNumber: 28,
      position: "ST",
      overall: 70,
      wage: 700000,
      contractYears: 2, // hasta 2027
      value: 4000000,
      birthDate: "2004-01-01",
      nationality: "Senegal",
      birthPlace: "Senegal",
      youthClub: "Real Oviedo",
      attributes: {
        technical: {
          passing: 70,
          shooting: 68,
          dribbling: 78,
          tackling: 56
        },
        mental: {
          vision: 68,
          composure: 64,
          workRate: 82,
          leadership: 52
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 70
        }
      }
    },

    // DELANTEROS
    {
      id: "oviedo_ilyas_chaira",
      name: "Ilyas Chaira",
      shirtNumber: 7,
      position: "LW",
      overall: 72,
      wage: 900000,
      contractYears: 3, // hasta 2028
      value: 6000000,
      birthDate: "2001-01-01",
      nationality: "Marruecos",
      birthPlace: "Marruecos",
      youthClub: "Girona FC",
      attributes: {
        technical: {
          passing: 74,
          shooting: 72,
          dribbling: 82,
          tackling: 52
        },
        mental: {
          vision: 72,
          composure: 70,
          workRate: 82,
          leadership: 56
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 68
        }
      }
    },
    {
      id: "oviedo_fede_vinas",
      name: "Fede Viñas",
      shirtNumber: 9,
      position: "ST",
      overall: 76,
      wage: 1500000,
      contractYears: 1, // hasta 2026
      value: 10000000,
      birthDate: "1998-01-01",
      nationality: "Uruguay",
      birthPlace: "Uruguay",
      youthClub: "Club León",
      attributes: {
        technical: {
          passing: 72,
          shooting: 82,
          dribbling: 76,
          tackling: 48
        },
        mental: {
          vision: 72,
          composure: 78,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 82
        }
      }
    },
    {
      id: "oviedo_alex_fores",
      name: "Álex Forés",
      shirtNumber: 19,
      position: "ST",
      overall: 72,
      wage: 900000,
      contractYears: 1, // hasta 2026
      value: 5000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 70,
          shooting: 78,
          dribbling: 76,
          tackling: 46
        },
        mental: {
          vision: 70,
          composure: 70,
          workRate: 82,
          leadership: 56
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 74
        }
      }
    },
    {
      id: "oviedo_salomom_rondon",
      name: "Salomón Rondón",
      shirtNumber: 23,
      position: "ST",
      overall: 77,
      wage: 2000000,
      contractYears: 1, // hasta 2026
      value: 9000000,
      birthDate: "1989-01-01",
      nationality: "Venezuela",
      birthPlace: "Venezuela",
      youthClub: "CF Pachuca",
      attributes: {
        technical: {
          passing: 72,
          shooting: 82,
          dribbling: 74,
          tackling: 48
        },
        mental: {
          vision: 72,
          composure: 82,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 70,
          stamina: 80,
          strength: 86
        }
      }
    }
  ],
  
// =======================
// REAL SOCIEDAD
// =======================  

realsociedad: [
  // PORTEROS
  {
    id: "real_sociedad_remiro",
    name: "Álex Remiro",
    shirtNumber: 1,
    position: "GK",
    overall: 84,
    wage: 4500000,
    contractYears: 2, // hasta 2027
    value: 28000000,
    birthDate: "1995-03-24",
    nationality: "España",
    birthPlace: "Cascante (España)",
    youthClub: "CD Aluvión / Athletic Club",
    attributes: {
      technical: {
        passing: 72,
        shooting: 35,
        dribbling: 45,
        tackling: 40
      },
      mental: {
        vision: 70,
        composure: 84,
        workRate: 80,
        leadership: 78
      },
      physical: {
        pace: 52,
        stamina: 70,
        strength: 78
      }
    }
  },
  {
    id: "real_sociedad_marrero",
    name: "Unai Marrero",
    shirtNumber: 13,
    position: "GK",
    overall: 74,
    wage: 600000,
    contractYears: 2,
    value: 2000000,
    birthDate: "2001-10-09",
    nationality: "España",
    birthPlace: "San Sebastián (España)",
    youthClub: "Lagun Onak / Real Sociedad",
    attributes: {
      technical: {
        passing: 66,
        shooting: 30,
        dribbling: 42,
        tackling: 40
      },
      mental: {
        vision: 65,
        composure: 72,
        workRate: 76,
        leadership: 65
      },
      physical: {
        pace: 55,
        stamina: 68,
        strength: 75
      }
    }
  },

  // DEFENSAS
  {
    id: "real_sociedad_aramburu",
    name: "Jon Aramburu",
    shirtNumber: 2,
    position: "RB",
    overall: 79,
    wage: 2000000,
    contractYears: 5,
    value: 18000000,
    birthDate: "2002-07-23",
    nationality: "Venezuela",
    birthPlace: "Caracas (Venezuela)",
    youthClub: "Deportivo La Guaira / Real Unión",
    attributes: {
      technical: {
        passing: 74,
        shooting: 55,
        dribbling: 76,
        tackling: 82
      },
      mental: {
        vision: 70,
        composure: 74,
        workRate: 85,
        leadership: 70
      },
      physical: {
        pace: 86,
        stamina: 84,
        strength: 74
      }
    }
  },
  {
    id: "real_sociedad_aihen_munoz",
    name: "Aihen Muñoz",
    shirtNumber: 3,
    position: "LB",
    overall: 78,
    wage: 1600000,
    contractYears: 2,
    value: 12000000,
    birthDate: "1997-08-15",
    nationality: "España",
    birthPlace: "Etxauri (España)",
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 75,
        shooting: 48,
        dribbling: 76,
        tackling: 80
      },
      mental: {
        vision: 70,
        composure: 73,
        workRate: 84,
        leadership: 68
      },
      physical: {
        pace: 83,
        stamina: 86,
        strength: 72
      }
    }
  },
  {
    id: "real_sociedad_zubeldia",
    name: "Igor Zubeldia",
    shirtNumber: 5,
    position: "CB",
    overall: 82,
    wage: 3500000,
    contractYears: 4,
    value: 26000000,
    birthDate: "1997-03-30",
    nationality: "España",
    birthPlace: "Azkoitia (España)",
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 79,
        shooting: 50,
        dribbling: 67,
        tackling: 87
      },
      mental: {
        vision: 74,
        composure: 84,
        workRate: 86,
        leadership: 82
      },
      physical: {
        pace: 74,
        stamina: 81,
        strength: 84
      }
    }
  },
  {
    id: "real_sociedad_elustondo",
    name: "Aritz Elustondo",
    shirtNumber: 6,
    position: "CB",
    overall: 80,
    wage: 3200000,
    contractYears: 1,
    value: 18000000,
    birthDate: "1994-03-28",
    nationality: "España",
    birthPlace: "Beasain (España)",
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 77,
        shooting: 52,
        dribbling: 65,
        tackling: 85
      },
      mental: {
        vision: 72,
        composure: 82,
        workRate: 84,
        leadership: 80
      },
      physical: {
        pace: 72,
        stamina: 80,
        strength: 83
      }
    }
  },
  {
    id: "real_sociedad_caleta_car",
    name: "Duje Ćaleta-Car",
    shirtNumber: 16,
    position: "CB",
    overall: 79,
    wage: 3500000,
    contractYears: 1,
    value: 17000000,
    birthDate: "1996-09-17",
    nationality: "Croacia",
    birthPlace: "Šibenik (Croacia)",
    youthClub: "Šibenik",
    attributes: {
      technical: {
        passing: 75,
        shooting: 52,
        dribbling: 62,
        tackling: 84
      },
      mental: {
        vision: 70,
        composure: 80,
        workRate: 78,
        leadership: 76
      },
      physical: {
        pace: 68,
        stamina: 78,
        strength: 86
      }
    }
  },
  {
    id: "real_sociedad_sergio_gomez",
    name: "Sergio Gómez",
    shirtNumber: 17,
    position: "LB",
    overall: 80,
    wage: 4000000,
    contractYears: 5,
    value: 30000000,
    birthDate: "2000-09-04",
    nationality: "España",
    birthPlace: "Badalona (España)",
    youthClub: "FC Barcelona / Borussia Dortmund",
    attributes: {
      technical: {
        passing: 82,
        shooting: 76,
        dribbling: 84,
        tackling: 72
      },
      mental: {
        vision: 82,
        composure: 78,
        workRate: 80,
        leadership: 70
      },
      physical: {
        pace: 80,
        stamina: 82,
        strength: 68
      }
    }
  },
  {
    id: "real_sociedad_odriozola",
    name: "Álvaro Odriozola",
    shirtNumber: 20,
    position: "RB",
    overall: 78,
    wage: 3500000,
    contractYears: 4,
    value: 14000000,
    birthDate: "1995-12-14",
    nationality: "España",
    birthPlace: "San Sebastián (España)",
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 77,
        shooting: 60,
        dribbling: 80,
        tackling: 74
      },
      mental: {
        vision: 74,
        composure: 74,
        workRate: 82,
        leadership: 68
      },
      physical: {
        pace: 84,
        stamina: 82,
        strength: 70
      }
    }
  },
  {
    id: "real_sociedad_jon_martin",
    name: "Jon Martín",
    shirtNumber: 31,
    position: "CB",
    overall: 69,
    wage: 250000,
    contractYears: 5,
    value: 2000000,
    birthDate: null,
    nationality: "España",
    birthPlace: null,
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 64,
        shooting: 40,
        dribbling: 55,
        tackling: 72
      },
      mental: {
        vision: 60,
        composure: 64,
        workRate: 78,
        leadership: 60
      },
      physical: {
        pace: 70,
        stamina: 72,
        strength: 73
      }
    }
  },
  {
    id: "real_sociedad_inaki_ruperez",
    name: "Iñaki Rupérez",
    shirtNumber: 33,
    position: "CB",
    overall: 68,
    wage: 250000,
    contractYears: 2,
    value: 1500000,
    birthDate: null,
    nationality: "España",
    birthPlace: null,
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 62,
        shooting: 38,
        dribbling: 52,
        tackling: 71
      },
      mental: {
        vision: 58,
        composure: 63,
        workRate: 78,
        leadership: 58
      },
      physical: {
        pace: 69,
        stamina: 72,
        strength: 72
      }
    }
  },

  // CENTROCAMPISTAS
  {
    id: "real_sociedad_gorrotxategi",
    name: "Jon Gorrotxategi",
    shirtNumber: 4,
    position: "CM",
    overall: 71,
    wage: 300000,
    contractYears: 2,
    value: 2500000,
    birthDate: null,
    nationality: "España",
    birthPlace: null,
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 74,
        shooting: 60,
        dribbling: 70,
        tackling: 68
      },
      mental: {
        vision: 72,
        composure: 70,
        workRate: 78,
        leadership: 64
      },
      physical: {
        pace: 70,
        stamina: 78,
        strength: 69
      }
    }
  },
  {
    id: "real_sociedad_turrientes",
    name: "Beñat Turrientes",
    shirtNumber: 8,
    position: "CM",
    overall: 80,
    wage: 2200000,
    contractYears: 5,
    value: 26000000,
    birthDate: "2002-01-31",
    nationality: "España",
    birthPlace: "Beasain (España)",
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 84,
        shooting: 74,
        dribbling: 80,
        tackling: 74
      },
      mental: {
        vision: 85,
        composure: 80,
        workRate: 82,
        leadership: 72
      },
      physical: {
        pace: 74,
        stamina: 82,
        strength: 72
      }
    }
  },
  {
    id: "real_sociedad_yangel_herrera",
    name: "Yangel Herrera",
    shirtNumber: 12,
    position: "CDM",
    overall: 82,
    wage: 3800000,
    contractYears: 5,
    value: 30000000,
    birthDate: "1998-01-07",
    nationality: "Venezuela",
    birthPlace: "La Guaira (Venezuela)",
    youthClub: "Atlético Venezuela",
    attributes: {
      technical: {
        passing: 80,
        shooting: 74,
        dribbling: 78,
        tackling: 85
      },
      mental: {
        vision: 78,
        composure: 80,
        workRate: 88,
        leadership: 76
      },
      physical: {
        pace: 78,
        stamina: 86,
        strength: 84
      }
    }
  },
  {
    id: "real_sociedad_carlos_soler",
    name: "Carlos Soler",
    shirtNumber: 18,
    position: "CM",
    overall: 83,
    wage: 6000000,
    contractYears: 5,
    value: 38000000,
    birthDate: "1997-01-02",
    nationality: "España",
    birthPlace: "Valencia (España)",
    youthClub: "Valencia CF",
    attributes: {
      technical: {
        passing: 86,
        shooting: 80,
        dribbling: 82,
        tackling: 70
      },
      mental: {
        vision: 86,
        composure: 84,
        workRate: 82,
        leadership: 78
      },
      physical: {
        pace: 76,
        stamina: 82,
        strength: 74
      }
    }
  },
  {
    id: "real_sociedad_zakharyan",
    name: "Arsen Zakharyan",
    shirtNumber: 21,
    position: "CAM",
    overall: 84,
    wage: 5000000,
    contractYears: 4,
    value: 42000000,
    birthDate: "2003-05-26",
    nationality: "Rusia",
    birthPlace: "Samara (Rusia)",
    youthClub: "Dinamo Moscú",
    attributes: {
      technical: {
        passing: 86,
        shooting: 82,
        dribbling: 88,
        tackling: 60
      },
      mental: {
        vision: 88,
        composure: 82,
        workRate: 80,
        leadership: 70
      },
      physical: {
        pace: 82,
        stamina: 80,
        strength: 70
      }
    }
  },
  {
    id: "real_sociedad_mikel_goti",
    name: "Mikel Goti",
    shirtNumber: 22,
    position: "CM",
    overall: 70,
    wage: 300000,
    contractYears: 3,
    value: 2500000,
    birthDate: null,
    nationality: "España",
    birthPlace: null,
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 74,
        shooting: 65,
        dribbling: 72,
        tackling: 66
      },
      mental: {
        vision: 72,
        composure: 68,
        workRate: 78,
        leadership: 62
      },
      physical: {
        pace: 72,
        stamina: 78,
        strength: 68
      }
    }
  },
  {
    id: "real_sociedad_brais_mendez",
    name: "Brais Méndez",
    shirtNumber: 23,
    position: "CM",
    overall: 84,
    wage: 5000000,
    contractYears: 3,
    value: 38000000,
    birthDate: "1997-01-07",
    nationality: "España",
    birthPlace: "Mos (España)",
    youthClub: "RC Celta",
    attributes: {
      technical: {
        passing: 87,
        shooting: 84,
        dribbling: 84,
        tackling: 64
      },
      mental: {
        vision: 88,
        composure: 84,
        workRate: 80,
        leadership: 76
      },
      physical: {
        pace: 76,
        stamina: 80,
        strength: 70
      }
    }
  },
  {
    id: "real_sociedad_luka_sucic",
    name: "Luka Sučić",
    shirtNumber: 24,
    position: "CM",
    overall: 83,
    wage: 4500000,
    contractYears: 4,
    value: 36000000,
    birthDate: "2002-09-08",
    nationality: "Croacia",
    birthPlace: "Linz (Austria)",
    youthClub: "Red Bull Salzburgo",
    attributes: {
      technical: {
        passing: 86,
        shooting: 82,
        dribbling: 84,
        tackling: 68
      },
      mental: {
        vision: 86,
        composure: 82,
        workRate: 82,
        leadership: 72
      },
      physical: {
        pace: 78,
        stamina: 84,
        strength: 74
      }
    }
  },
  {
    id: "real_sociedad_pablo_marin",
    name: "Pablo Marín",
    shirtNumber: 28,
    position: "CM",
    overall: 76,
    wage: 1200000,
    contractYears: 3,
    value: 14000000,
    birthDate: "2003-04-03",
    nationality: "España",
    birthPlace: "Logroño (España)",
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 80,
        shooting: 76,
        dribbling: 80,
        tackling: 60
      },
      mental: {
        vision: 80,
        composure: 74,
        workRate: 80,
        leadership: 62
      },
      physical: {
        pace: 76,
        stamina: 78,
        strength: 68
      }
    }
  },

  // DELANTEROS
  {
    id: "real_sociedad_barrenetxea",
    name: "Ander Barrenetxea",
    shirtNumber: 7,
    position: "LW",
    overall: 83,
    wage: 4500000,
    contractYears: 5,
    value: 38000000,
    birthDate: "2001-12-27",
    nationality: "España",
    birthPlace: "San Sebastián (España)",
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 80,
        shooting: 82,
        dribbling: 88,
        tackling: 55
      },
      mental: {
        vision: 80,
        composure: 80,
        workRate: 82,
        leadership: 68
      },
      physical: {
        pace: 88,
        stamina: 82,
        strength: 72
      }
    }
  },
  {
    id: "real_sociedad_orri_oskarsson",
    name: "Orri Óskarsson",
    shirtNumber: 9,
    position: "ST",
    overall: 77,
    wage: 1500000,
    contractYears: 5,
    value: 20000000,
    birthDate: null,
    nationality: "Islandia",
    birthPlace: null,
    youthClub: "FC Copenhague",
    attributes: {
      technical: {
        passing: 70,
        shooting: 82,
        dribbling: 74,
        tackling: 45
      },
      mental: {
        vision: 70,
        composure: 74,
        workRate: 80,
        leadership: 60
      },
      physical: {
        pace: 82,
        stamina: 78,
        strength: 78
      }
    }
  },
  {
    id: "real_sociedad_oyarzabal",
    name: "Mikel Oyarzabal",
    shirtNumber: 10,
    position: "LW",
    overall: 86,
    wage: 7000000,
    contractYears: 3,
    value: 50000000,
    birthDate: "1997-04-21",
    nationality: "España",
    birthPlace: "Eibar (España)",
    youthClub: "Eibar / Real Sociedad",
    attributes: {
      technical: {
        passing: 87,
        shooting: 86,
        dribbling: 84,
        tackling: 58
      },
      mental: {
        vision: 88,
        composure: 88,
        workRate: 86,
        leadership: 85
      },
      physical: {
        pace: 80,
        stamina: 84,
        strength: 78
      }
    }
  },
  {
    id: "real_sociedad_guedes",
    name: "Gonçalo Guedes",
    shirtNumber: 11,
    position: "LW",
    overall: 84,
    wage: 6500000,
    contractYears: 3,
    value: 38000000,
    birthDate: "1996-11-29",
    nationality: "Portugal",
    birthPlace: "Benavente (Portugal)",
    youthClub: "Benfica",
    attributes: {
      technical: {
        passing: 82,
        shooting: 84,
        dribbling: 87,
        tackling: 54
      },
      mental: {
        vision: 80,
        composure: 82,
        workRate: 82,
        leadership: 70
      },
      physical: {
        pace: 88,
        stamina: 82,
        strength: 78
      }
    }
  },
  {
    id: "real_sociedad_kubo",
    name: "Take Kubo",
    shirtNumber: 14,
    position: "RW",
    overall: 86,
    wage: 6000000,
    contractYears: 4,
    value: 55000000,
    birthDate: "2001-06-04",
    nationality: "Japón",
    birthPlace: "Kawasaki (Japón)",
    youthClub: "FC Tokyo / FC Barcelona",
    attributes: {
      technical: {
        passing: 86,
        shooting: 84,
        dribbling: 90,
        tackling: 55
      },
      mental: {
        vision: 88,
        composure: 84,
        workRate: 86,
        leadership: 70
      },
      physical: {
        pace: 88,
        stamina: 84,
        strength: 70
      }
    }
  },
  {
    id: "real_sociedad_umar_sadiq",
    name: "Umar Sadiq",
    shirtNumber: 15,
    position: "ST",
    overall: 82,
    wage: 4000000,
    contractYears: 3,
    value: 28000000,
    birthDate: "1997-02-02",
    nationality: "Nigeria",
    birthPlace: "Kaduna (Nigeria)",
    youthClub: "Spezia / Roma (juvenil)",
    attributes: {
      technical: {
        passing: 72,
        shooting: 86,
        dribbling: 78,
        tackling: 45
      },
      mental: {
        vision: 72,
        composure: 80,
        workRate: 82,
        leadership: 68
      },
      physical: {
        pace: 82,
        stamina: 80,
        strength: 88
      }
    }
  },
  {
    id: "real_sociedad_karrikaburu",
    name: "Jon Karrikaburu",
    shirtNumber: 19,
    position: "ST",
    overall: 78,
    wage: 2000000,
    contractYears: 2,
    value: 20000000,
    birthDate: "2002-09-19",
    nationality: "España",
    birthPlace: "Elizondo (España)",
    youthClub: "Real Sociedad",
    attributes: {
      technical: {
        passing: 72,
        shooting: 84,
        dribbling: 76,
        tackling: 48
      },
      mental: {
        vision: 72,
        composure: 78,
        workRate: 82,
        leadership: 64
      },
      physical: {
        pace: 80,
        stamina: 80,
        strength: 78
      }
    }
  }
],

// =======================
// SEVILLA FC
// =======================
sevilla: [
  // Porteros
  {
    id: "sevilla_vlachodimos",
    name: "Odisseas Vlachodimos",
    shirtNumber: 1,
    position: "GK",
    overall: 82,
    wage: 3500000,
    contractYears: 1, // hasta 2026
    value: 12000000,
    birthDate: "1994-04-26",
    nationality: "Grecia",
    birthPlace: "Stuttgart (Alemania)",
    youthClub: "VfB Stuttgart",
    attributes: {
      technical: {
        passing: 70,
        shooting: 40,
        dribbling: 55,
        tackling: 50
      },
      mental: {
        vision: 72,
        composure: 82,
        workRate: 80,
        leadership: 78
      },
      physical: {
        pace: 60,
        stamina: 72,
        strength: 80
      }
    }
  },
  {
    id: "sevilla_nyland",
    name: "Ørjan Nyland",
    shirtNumber: 13,
    position: "GK",
    overall: 78,
    wage: 2000000,
    contractYears: 1, // hasta 2026
    value: 3000000,
    birthDate: "1990-09-10",
    nationality: "Noruega",
    birthPlace: "Volda (Noruega)",
    youthClub: "IL Hødd",
    attributes: {
      technical: {
        passing: 66,
        shooting: 38,
        dribbling: 52,
        tackling: 48
      },
      mental: {
        vision: 68,
        composure: 79,
        workRate: 77,
        leadership: 76
      },
      physical: {
        pace: 58,
        stamina: 70,
        strength: 78
      }
    }
  },
  {
    id: "sevilla_alvaro_fernandez",
    name: "Álvaro Fernández",
    shirtNumber: 25,
    position: "GK",
    overall: 76,
    wage: 1200000,
    contractYears: 2, // hasta 2027
    value: 4000000,
    birthDate: "1998-04-13",
    nationality: "España",
    birthPlace: "Arnedo (España)",
    youthClub: "Osasuna",
    attributes: {
      technical: {
        passing: 68,
        shooting: 35,
        dribbling: 54,
        tackling: 48
      },
      mental: {
        vision: 69,
        composure: 76,
        workRate: 75,
        leadership: 70
      },
      physical: {
        pace: 61,
        stamina: 71,
        strength: 74
      }
    }
  },
  {
    id: "sevilla_alberto_flores",
    name: "Alberto Flores",
    shirtNumber: 31,
    position: "GK",
    overall: 72,
    wage: 400000,
    contractYears: 2, // hasta 2027
    value: 1500000,
    birthDate: "2003-11-10",
    nationality: "España",
    birthPlace: "Fuentes de Andalucía (España)",
    youthClub: "Sevilla FC (cantera)",
    attributes: {
      technical: {
        passing: 64,
        shooting: 30,
        dribbling: 52,
        tackling: 46
      },
      mental: {
        vision: 66,
        composure: 73,
        workRate: 74,
        leadership: 65
      },
      physical: {
        pace: 60,
        stamina: 69,
        strength: 72
      }
    }
  },

  // Defensas
  {
    id: "sevilla_carmona",
    name: "José Ángel Carmona",
    shirtNumber: 2,
    position: "RB",
    overall: 76,
    wage: 1300000,
    contractYears: 3, // hasta 2028
    value: 9000000,
    birthDate: "2002-01-29",
    nationality: "España",
    birthPlace: "El Viso del Alcor (España)",
    youthClub: "Sevilla FC (cantera)",
    attributes: {
      technical: {
        passing: 73,
        shooting: 55,
        dribbling: 72,
        tackling: 78
      },
      mental: {
        vision: 70,
        composure: 72,
        workRate: 84,
        leadership: 68
      },
      physical: {
        pace: 80,
        stamina: 82,
        strength: 76
      }
    }
  },
  {
    id: "sevilla_azpilicueta",
    name: "César Azpilicueta",
    shirtNumber: 3,
    position: "RB",
    overall: 80,
    wage: 6000000,
    contractYears: 1, // hasta 2026
    value: 3500000,
    birthDate: "1989-08-28",
    nationality: "España",
    birthPlace: "Zizur Mayor (España)",
    youthClub: "Osasuna",
    attributes: {
      technical: {
        passing: 79,
        shooting: 55,
        dribbling: 72,
        tackling: 86
      },
      mental: {
        vision: 78,
        composure: 83,
        workRate: 90,
        leadership: 90
      },
      physical: {
        pace: 70,
        stamina: 82,
        strength: 78
      }
    }
  },
  {
    id: "sevilla_kike_salas",
    name: "\"Kike\" Salas",
    shirtNumber: 4,
    position: "CB",
    overall: 75,
    wage: 900000,
    contractYears: 4, // hasta 2029
    value: 8000000,
    birthDate: "2002-04-23",
    nationality: "España",
    birthPlace: "Morón de la Frontera (España)",
    youthClub: "Sevilla FC (cantera)",
    attributes: {
      technical: {
        passing: 72,
        shooting: 48,
        dribbling: 63,
        tackling: 80
      },
      mental: {
        vision: 70,
        composure: 74,
        workRate: 82,
        leadership: 72
      },
      physical: {
        pace: 72,
        stamina: 76,
        strength: 82
      }
    }
  },
  {
    id: "sevilla_nianzou",
    name: "Tanguy Nianzou",
    shirtNumber: 5,
    position: "CB",
    overall: 77,
    wage: 2000000,
    contractYears: 2, // hasta 2027
    value: 12000000,
    birthDate: "2002-06-07",
    nationality: "Francia",
    birthPlace: "París (Francia)",
    youthClub: "Paris Saint-Germain",
    attributes: {
      technical: {
        passing: 73,
        shooting: 50,
        dribbling: 65,
        tackling: 82
      },
      mental: {
        vision: 71,
        composure: 75,
        workRate: 80,
        leadership: 70
      },
      physical: {
        pace: 74,
        stamina: 76,
        strength: 84
      }
    }
  },
  {
    id: "sevilla_suazo",
    name: "Gabriel Suazo",
    shirtNumber: 12,
    position: "LB",
    overall: 78,
    wage: 2000000,
    contractYears: 3, // hasta 2028
    value: 10000000,
    birthDate: "1997-08-09",
    nationality: "Chile",
    birthPlace: "Santiago (Chile)",
    youthClub: "Colo-Colo",
    attributes: {
      technical: {
        passing: 77,
        shooting: 55,
        dribbling: 78,
        tackling: 79
      },
      mental: {
        vision: 74,
        composure: 75,
        workRate: 86,
        leadership: 72
      },
      physical: {
        pace: 83,
        stamina: 85,
        strength: 76
      }
    }
  },
  {
    id: "sevilla_cardoso",
    name: "Fábio Cardoso",
    shirtNumber: 15,
    position: "CB",
    overall: 77,
    wage: 1800000,
    contractYears: 2, // hasta 2027
    value: 8000000,
    birthDate: "1994-04-19",
    nationality: "Portugal",
    birthPlace: "Águeda (Portugal)",
    youthClub: "Benfica",
    attributes: {
      technical: {
        passing: 73,
        shooting: 45,
        dribbling: 60,
        tackling: 82
      },
      mental: {
        vision: 70,
        composure: 77,
        workRate: 80,
        leadership: 76
      },
      physical: {
        pace: 70,
        stamina: 75,
        strength: 82
      }
    }
  },
  {
    id: "sevilla_marcao",
    name: "\"Marcão\" do Nascimiento",
    shirtNumber: 23,
    position: "CB",
    overall: 78,
    wage: 2500000,
    contractYears: 3, // hasta 2028
    value: 10000000,
    birthDate: "1996-07-05",
    nationality: "Brasil",
    birthPlace: "Londrina (Brasil)",
    youthClub: "Atlético Paranaense",
    attributes: {
      technical: {
        passing: 74,
        shooting: 44,
        dribbling: 60,
        tackling: 84
      },
      mental: {
        vision: 70,
        composure: 77,
        workRate: 81,
        leadership: 75
      },
      physical: {
        pace: 71,
        stamina: 76,
        strength: 84
      }
    }
  },
  {
    id: "sevilla_castrin",
    name: "Andrés Castrín",
    shirtNumber: 32,
    position: "CB",
    overall: 72,
    wage: 400000,
    contractYears: 2, // hasta 2027
    value: 2500000,
    birthDate: "2003-05-26",
    nationality: "España",
    birthPlace: "Riotorto (España)",
    youthClub: "Sevilla FC (cantera)",
    attributes: {
      technical: {
        passing: 68,
        shooting: 40,
        dribbling: 58,
        tackling: 76
      },
      mental: {
        vision: 66,
        composure: 70,
        workRate: 80,
        leadership: 64
      },
      physical: {
        pace: 71,
        stamina: 74,
        strength: 78
      }
    }
  },

  // Centrocampistas
  {
    id: "sevilla_gudelj",
    name: "Nemanja Gudelj",
    shirtNumber: 6,
    position: "CDM",
    overall: 81,
    wage: 4000000,
    contractYears: 1, // hasta 2026
    value: 9000000,
    birthDate: "1991-11-16",
    nationality: "Serbia",
    birthPlace: "Belgrado (Serbia)",
    youthClub: "NAC Breda",
    attributes: {
      technical: {
        passing: 80,
        shooting: 75,
        dribbling: 74,
        tackling: 84
      },
      mental: {
        vision: 79,
        composure: 84,
        workRate: 86,
        leadership: 85
      },
      physical: {
        pace: 69,
        stamina: 80,
        strength: 82
      }
    }
  },
  {
    id: "sevilla_jordan",
    name: "Joan Jordán",
    shirtNumber: 8,
    position: "CM",
    overall: 80,
    wage: 3500000,
    contractYears: 2, // hasta 2027
    value: 12000000,
    birthDate: "1994-07-06",
    nationality: "España",
    birthPlace: "Regencós (España)",
    youthClub: "RCD Espanyol",
    attributes: {
      technical: {
        passing: 84,
        shooting: 77,
        dribbling: 78,
        tackling: 74
      },
      mental: {
        vision: 84,
        composure: 82,
        workRate: 80,
        leadership: 76
      },
      physical: {
        pace: 71,
        stamina: 82,
        strength: 74
      }
    }
  },
  {
    id: "sevilla_juanlu",
    name: "\"Juanlu\" Sánchez",
    shirtNumber: 16,
    position: "RB",
    overall: 76,
    wage: 900000,
    contractYears: 1, // hasta 2026
    value: 9000000,
    birthDate: "2003-08-15",
    nationality: "España",
    birthPlace: "Sevilla (España)",
    youthClub: "Sevilla FC (cantera)",
    attributes: {
      technical: {
        passing: 76,
        shooting: 72,
        dribbling: 80,
        tackling: 66
      },
      mental: {
        vision: 75,
        composure: 72,
        workRate: 84,
        leadership: 68
      },
      physical: {
        pace: 84,
        stamina: 83,
        strength: 70
      }
    }
  },
  {
    id: "sevilla_agoume",
    name: "Lucien Agoumé",
    shirtNumber: 18,
    position: "CM",
    overall: 77,
    wage: 1500000,
    contractYears: 3, // hasta 2028
    value: 10000000,
    birthDate: "2002-02-09",
    nationality: "Francia",
    birthPlace: "Yaundé (Camerún)",
    youthClub: "Sochaux",
    attributes: {
      technical: {
        passing: 78,
        shooting: 68,
        dribbling: 76,
        tackling: 78
      },
      mental: {
        vision: 77,
        composure: 76,
        workRate: 84,
        leadership: 70
      },
      physical: {
        pace: 74,
        stamina: 82,
        strength: 80
      }
    }
  },
  {
    id: "sevilla_mendy",
    name: "Batista Mendy",
    shirtNumber: 19,
    position: "CDM",
    overall: 75,
    wage: 1200000,
    contractYears: 1, // hasta 2026
    value: 7000000,
    birthDate: "2000-01-12",
    nationality: "Francia",
    birthPlace: "Saint-Nazaire (Francia)",
    youthClub: "Nantes",
    attributes: {
      technical: {
        passing: 73,
        shooting: 60,
        dribbling: 70,
        tackling: 80
      },
      mental: {
        vision: 71,
        composure: 73,
        workRate: 83,
        leadership: 68
      },
      physical: {
        pace: 72,
        stamina: 80,
        strength: 82
      }
    }
  },
  {
    id: "sevilla_sow",
    name: "Djibril Sow",
    shirtNumber: 20,
    position: "CM",
    overall: 80,
    wage: 3500000,
    contractYears: 4, // hasta 2029
    value: 14000000,
    birthDate: "1997-02-06",
    nationality: "Suiza",
    birthPlace: "Zúrich (Suiza)",
    youthClub: "FC Zürich",
    attributes: {
      technical: {
        passing: 82,
        shooting: 73,
        dribbling: 79,
        tackling: 78
      },
      mental: {
        vision: 81,
        composure: 82,
        workRate: 86,
        leadership: 76
      },
      physical: {
        pace: 77,
        stamina: 84,
        strength: 78
      }
    }
  },
  {
    id: "sevilla_januzaj",
    name: "Adnan Januzaj",
    shirtNumber: 24,
    position: "RW",
    overall: 79,
    wage: 4500000,
    contractYears: 1, // hasta 2026
    value: 9000000,
    birthDate: "1995-02-05",
    nationality: "Bélgica",
    birthPlace: "Bruselas (Bélgica)",
    youthClub: "Anderlecht",
    attributes: {
      technical: {
        passing: 82,
        shooting: 78,
        dribbling: 86,
        tackling: 48
      },
      mental: {
        vision: 83,
        composure: 80,
        workRate: 72,
        leadership: 70
      },
      physical: {
        pace: 79,
        stamina: 76,
        strength: 68
      }
    }
  },
  {
    id: "sevilla_manu_bueno",
    name: "\"Manu\" Bueno",
    shirtNumber: 28,
    position: "CM",
    overall: 74,
    wage: 600000,
    contractYears: 1, // hasta 2026
    value: 6000000,
    birthDate: "2003-08-06",
    nationality: "España",
    birthPlace: "Jerez de la Frontera (España)",
    youthClub: "Sevilla FC (cantera)",
    attributes: {
      technical: {
        passing: 77,
        shooting: 68,
        dribbling: 75,
        tackling: 68
      },
      mental: {
        vision: 76,
        composure: 72,
        workRate: 82,
        leadership: 66
      },
      physical: {
        pace: 74,
        stamina: 80,
        strength: 70
      }
    }
  },

  // Delanteros
  {
    id: "sevilla_isaac_romero",
    name: "Isaac Romero",
    shirtNumber: 7,
    position: "ST",
    overall: 78,
    wage: 1500000,
    contractYears: 3, // hasta 2028
    value: 15000000,
    birthDate: "2000-03-06",
    nationality: "España",
    birthPlace: "Lebrija (España)",
    youthClub: "Sevilla FC (cantera)",
    attributes: {
      technical: {
        passing: 74,
        shooting: 82,
        dribbling: 80,
        tackling: 48
      },
      mental: {
        vision: 76,
        composure: 78,
        workRate: 84,
        leadership: 70
      },
      physical: {
        pace: 82,
        stamina: 82,
        strength: 78
      }
    }
  },
  {
    id: "sevilla_akor_adams",
    name: "Akor Adams",
    shirtNumber: 9,
    position: "ST",
    overall: 79,
    wage: 2500000,
    contractYears: 4, // hasta 2029
    value: 18000000,
    birthDate: "2000-01-29",
    nationality: "Nigeria",
    birthPlace: "Kogi State (Nigeria)",
    youthClub: "Jamba Football Academy",
    attributes: {
      technical: {
        passing: 70,
        shooting: 84,
        dribbling: 76,
        tackling: 50
      },
      mental: {
        vision: 72,
        composure: 79,
        workRate: 84,
        leadership: 68
      },
      physical: {
        pace: 83,
        stamina: 80,
        strength: 86
      }
    }
  },
  {
    id: "sevilla_alexis",
    name: "Alexis Sánchez",
    shirtNumber: 10,
    position: "LW",
    overall: 82,
    wage: 5500000,
    contractYears: 1, // hasta 2026
    value: 6000000,
    birthDate: "1988-12-19",
    nationality: "Chile",
    birthPlace: "Tocopilla (Chile)",
    youthClub: "Cobreloa",
    attributes: {
      technical: {
        passing: 84,
        shooting: 84,
        dribbling: 88,
        tackling: 55
      },
      mental: {
        vision: 86,
        composure: 82,
        workRate: 88,
        leadership: 82
      },
      physical: {
        pace: 82,
        stamina: 80,
        strength: 70
      }
    }
  },
  {
    id: "sevilla_vargas",
    name: "Rubén Vargas",
    shirtNumber: 11,
    position: "LW",
    overall: 80,
    wage: 2800000,
    contractYears: 4, // hasta 2029
    value: 16000000,
    birthDate: "1998-08-05",
    nationality: "Suiza",
    birthPlace: "Adligenswil (Suiza)",
    youthClub: "FC Luzern",
    attributes: {
      technical: {
        passing: 79,
        shooting: 78,
        dribbling: 84,
        tackling: 52
      },
      mental: {
        vision: 78,
        composure: 78,
        workRate: 84,
        leadership: 70
      },
      physical: {
        pace: 84,
        stamina: 82,
        strength: 72
      }
    }
  },
  {
    id: "sevilla_gerard_fernandez",
    name: "Gerard Fernández",
    shirtNumber: 14,
    position: "CF",
    overall: 74,
    wage: 600000,
    contractYears: 3, // hasta 2028
    value: 6000000,
    birthDate: "2002-10-04",
    nationality: "España",
    birthPlace: "L'Hospitalet de Llobregat (España)",
    youthClub: "FC Barcelona",
    attributes: {
      technical: {
        passing: 72,
        shooting: 77,
        dribbling: 78,
        tackling: 44
      },
      mental: {
        vision: 73,
        composure: 74,
        workRate: 80,
        leadership: 64
      },
      physical: {
        pace: 79,
        stamina: 78,
        strength: 70
      }
    }
  },
  {
    id: "sevilla_alfon",
    name: "\"Alfon\" González",
    shirtNumber: 17,
    position: "LW",
    overall: 73,
    wage: 500000,
    contractYears: 3, // hasta 2028
    value: 5000000,
    birthDate: "1999-05-09",
    nationality: "España",
    birthPlace: "Albacete (España)",
    youthClub: "Albacete Balompié",
    attributes: {
      technical: {
        passing: 72,
        shooting: 73,
        dribbling: 78,
        tackling: 44
      },
      mental: {
        vision: 71,
        composure: 70,
        workRate: 80,
        leadership: 62
      },
      physical: {
        pace: 82,
        stamina: 79,
        strength: 68
      }
    }
  },
  {
    id: "sevilla_ejuke",
    name: "Chidera Ejuke",
    shirtNumber: 21,
    position: "LW",
    overall: 78,
    wage: 2300000,
    contractYears: 2, // hasta 2027
    value: 11000000,
    birthDate: "1998-01-02",
    nationality: "Nigeria",
    birthPlace: "Zaria (Nigeria)",
    youthClub: "Gombe United",
    attributes: {
      technical: {
        passing: 76,
        shooting: 76,
        dribbling: 88,
        tackling: 44
      },
      mental: {
        vision: 77,
        composure: 74,
        workRate: 82,
        leadership: 64
      },
      physical: {
        pace: 87,
        stamina: 80,
        strength: 70
      }
    }
  }
],
  
  // =======================
  // VALENCIA CF
  // =======================
  valencia: [
    // PORTEROS
    {
      id: "valencia_dimitrievski",
      name: "Stole Dimitrievski",
      shirtNumber: 1,
      position: "GK",
      overall: 82,
      wage: 3000000,
      contractYears: 1, // hasta 2026
      value: 10000000,
      birthDate: "1994-01-01",
      nationality: "Macedonia del Norte",
      birthPlace: "Macedonia del Norte",
      youthClub: "Rayo Vallecano",
      attributes: {
        technical: {
          passing: 68,
          shooting: 14,
          dribbling: 40,
          tackling: 30
        },
        mental: {
          vision: 72,
          composure: 82,
          workRate: 82,
          leadership: 76
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 80
        }
      }
    },
    {
      id: "valencia_rivero",
      name: "Cristian Rivero",
      shirtNumber: 13,
      position: "GK",
      overall: 74,
      wage: 1200000,
      contractYears: 1, // 2026
      value: 3000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 62,
          shooting: 10,
          dribbling: 36,
          tackling: 26
        },
        mental: {
          vision: 64,
          composure: 70,
          workRate: 78,
          leadership: 60
        },
        physical: {
          pace: 56,
          stamina: 72,
          strength: 74
        }
      }
    },
    {
      id: "valencia_agirrezabala",
      name: "Julen Agirrezabala",
      shirtNumber: 25,
      position: "GK",
      overall: 79,
      wage: 1800000,
      contractYears: 1, // 2026
      value: 7000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Athletic Club",
      attributes: {
        technical: {
          passing: 66,
          shooting: 12,
          dribbling: 38,
          tackling: 28
        },
        mental: {
          vision: 68,
          composure: 78,
          workRate: 80,
          leadership: 66
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 78
        }
      }
    },

    // DEFENSAS
    {
      id: "valencia_copete",
      name: "José Copete",
      shirtNumber: 3,
      position: "CB",
      overall: 78,
      wage: 2000000,
      contractYears: 4, // 2029
      value: 9000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "RCD Mallorca",
      attributes: {
        technical: {
          passing: 72,
          shooting: 46,
          dribbling: 66,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "valencia_diakhaby",
      name: "Mouctar Diakhaby",
      shirtNumber: 4,
      position: "CB",
      overall: 80,
      wage: 3000000,
      contractYears: 2, // 2027
      value: 14000000,
      birthDate: "1997-01-01",
      nationality: "Guinea",
      birthPlace: "Guinea",
      youthClub: "Olympique de Lyon",
      attributes: {
        technical: {
          passing: 74,
          shooting: 48,
          dribbling: 66,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 76,
          workRate: 82,
          leadership: 70
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 86
        }
      }
    },
    {
      id: "valencia_tarrega",
      name: "César Tárrega",
      shirtNumber: 5,
      position: "CB",
      overall: 76,
      wage: 1500000,
      contractYears: 5, // 2030
      value: 8000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 70,
          shooting: 44,
          dribbling: 64,
          tackling: 78
        },
        mental: {
          vision: 68,
          composure: 72,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 80
        }
      }
    },
    {
      id: "valencia_correia",
      name: "Thierry Correia",
      shirtNumber: 12,
      position: "RB",
      overall: 79,
      wage: 2500000,
      contractYears: 1, // 2026
      value: 10000000,
      birthDate: "1999-01-01",
      nationality: "Portugal",
      birthPlace: "Portugal",
      youthClub: "Sporting CP",
      attributes: {
        technical: {
          passing: 74,
          shooting: 54,
          dribbling: 78,
          tackling: 78
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 84,
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
      id: "valencia_gaya",
      name: "José Luis Gayà",
      shirtNumber: 14,
      position: "LB",
      overall: 83,
      wage: 4500000,
      contractYears: 2, // 2027
      value: 26000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 84,
          shooting: 70,
          dribbling: 84,
          tackling: 82
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 86,
          leadership: 84
        },
        physical: {
          pace: 82,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "valencia_foulquier",
      name: "Dimitri Foulquier",
      shirtNumber: 20,
      position: "RB",
      overall: 77,
      wage: 2500000,
      contractYears: 2, // 2027
      value: 7000000,
      birthDate: "1993-01-01",
      nationality: "Guadalupe (Francia)",
      birthPlace: "Guadalupe",
      youthClub: "Granada CF",
      attributes: {
        technical: {
          passing: 72,
          shooting: 56,
          dribbling: 74,
          tackling: 78
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 78
        }
      }
    },
    {
      id: "valencia_jesus_vazquez",
      name: "Jesús Vázquez",
      shirtNumber: 21,
      position: "LB",
      overall: 76,
      wage: 1500000,
      contractYears: 1, // 2026
      value: 8000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 74,
          shooting: 52,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 70,
          composure: 72,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "valencia_comert",
      name: "Eray Cömert",
      shirtNumber: 24,
      position: "CB",
      overall: 78,
      wage: 2500000,
      contractYears: 3, // 2028
      value: 9000000,
      birthDate: "1998-01-01",
      nationality: "Suiza",
      birthPlace: "Suiza",
      youthClub: "Basel",
      attributes: {
        technical: {
          passing: 72,
          shooting: 44,
          dribbling: 66,
          tackling: 80
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 72,
          stamina: 80,
          strength: 82
        }
      }
    },

    // MEDIOCAMPISTAS
    {
      id: "valencia_javi_guerra",
      name: "Javi Guerra",
      shirtNumber: 8,
      position: "CM",
      overall: 82,
      wage: 2500000,
      contractYears: 4, // 2029
      value: 25000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 82,
          tackling: 74
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 78,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "valencia_andre_almeida",
      name: "André Almeida",
      shirtNumber: 10,
      position: "CM",
      overall: 80,
      wage: 2200000,
      contractYears: 3, // 2028
      value: 16000000,
      birthDate: "2000-01-01",
      nationality: "Portugal",
      birthPlace: "Portugal",
      youthClub: "Vitória Guimarães",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 84,
          tackling: 60
        },
        mental: {
          vision: 84,
          composure: 78,
          workRate: 80,
          leadership: 68
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "valencia_luis_rioja",
      name: "Luis Rioja",
      shirtNumber: 11,
      position: "LW",
      overall: 80,
      wage: 2200000,
      contractYears: 1, // 2026
      value: 10000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Alavés",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "valencia_diego_lopez",
      name: "Diego López",
      shirtNumber: 16,
      position: "LW",
      overall: 78,
      wage: 1800000,
      contractYears: 2, // 2027
      value: 12000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Valencia CF",
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
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 70
        }
      }
    },
    {
      id: "valencia_pepelu",
      name: "Pepelu",
      shirtNumber: 18,
      position: "CDM",
      overall: 82,
      wage: 3000000,
      contractYears: 3, // 2028
      value: 22000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Levante UD",
      attributes: {
        technical: {
          passing: 86,
          shooting: 78,
          dribbling: 80,
          tackling: 82
        },
        mental: {
          vision: 84,
          composure: 82,
          workRate: 86,
          leadership: 72
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "valencia_dani_raba",
      name: "Dani Raba",
      shirtNumber: 19,
      position: "RW",
      overall: 77,
      wage: 2000000,
      contractYears: 2, // 2027
      value: 9000000,
      birthDate: "1995-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 78,
          shooting: 78,
          dribbling: 80,
          tackling: 52
        },
        mental: {
          vision: 76,
          composure: 76,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 78,
          stamina: 80,
          strength: 72
        }
      }
    },
    {
      id: "valencia_santamaria",
      name: "Baptiste Santamaria",
      shirtNumber: 22,
      position: "CDM",
      overall: 80,
      wage: 2500000,
      contractYears: 2, // 2027
      value: 14000000,
      birthDate: "1995-01-01",
      nationality: "Francia",
      birthPlace: "Francia",
      youthClub: "Tours",
      attributes: {
        technical: {
          passing: 80,
          shooting: 74,
          dribbling: 78,
          tackling: 82
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 80
        }
      }
    },
    {
      id: "valencia_ugrinic",
      name: "Filip Ugrinić",
      shirtNumber: 23,
      position: "CM",
      overall: 80,
      wage: 2500000,
      contractYears: 4, // 2029
      value: 16000000,
      birthDate: "1999-01-01",
      nationality: "Suiza",
      birthPlace: "Suiza",
      youthClub: "Luzern",
      attributes: {
        technical: {
          passing: 82,
          shooting: 78,
          dribbling: 82,
          tackling: 72
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 74
        }
      }
    },

    // DELANTEROS
    {
      id: "valencia_danjuma",
      name: "Arnaut Danjuma",
      shirtNumber: 7,
      position: "LW",
      overall: 82,
      wage: 3500000,
      contractYears: 3, // 2028
      value: 22000000,
      birthDate: "1997-01-01",
      nationality: "Países Bajos",
      birthPlace: "Países Bajos",
      youthClub: "PSV",
      attributes: {
        technical: {
          passing: 80,
          shooting: 82,
          dribbling: 88,
          tackling: 50
        },
        mental: {
          vision: 80,
          composure: 80,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 86,
          stamina: 82,
          strength: 74
        }
      }
    },
    {
      id: "valencia_hugo_duro",
      name: "Hugo Duro",
      shirtNumber: 9,
      position: "ST",
      overall: 81,
      wage: 2800000,
      contractYears: 3, // 2028
      value: 20000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Getafe CF",
      attributes: {
        technical: {
          passing: 76,
          shooting: 84,
          dribbling: 78,
          tackling: 48
        },
        mental: {
          vision: 76,
          composure: 80,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 80,
          stamina: 84,
          strength: 78
        }
      }
    },
    {
      id: "valencia_lucas_beltran",
      name: "Lucas Beltrán",
      shirtNumber: 15,
      position: "ST",
      overall: 80,
      wage: 3000000,
      contractYears: 1, // 2026
      value: 18000000,
      birthDate: "2001-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "River Plate",
      attributes: {
        technical: {
          passing: 76,
          shooting: 84,
          dribbling: 80,
          tackling: 48
        },
        mental: {
          vision: 76,
          composure: 78,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 78
        }
      }
    },
    {
      id: "valencia_ramazani",
      name: "Largie Ramazani",
      shirtNumber: 17,
      position: "RW",
      overall: 79,
      wage: 2500000,
      contractYears: 1, // 2026
      value: 15000000,
      birthDate: "2001-01-01",
      nationality: "Bélgica",
      birthPlace: "Bélgica",
      youthClub: "Manchester United",
      attributes: {
        technical: {
          passing: 78,
          shooting: 78,
          dribbling: 86,
          tackling: 48
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 86,
          stamina: 82,
          strength: 70
        }
      }
    }
  ],  
  
    // =======================
  // VILLARREAL CF 
  // =======================
  villarreal: [
    // PORTEROS
    {
      id: "villarreal_luiz_junior",
      name: "Luiz Júnior",
      shirtNumber: 1,
      position: "GK",
      overall: 80,
      wage: 2500000,
      contractYears: 5, // hasta 2030
      value: 12000000,
      birthDate: "2001-01-01",
      nationality: "Brasil",
      birthPlace: "Brasil",
      youthClub: "Famalicão",
      attributes: {
        technical: {
          passing: 66,
          shooting: 15,
          dribbling: 40,
          tackling: 30
        },
        mental: {
          vision: 70,
          composure: 78,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 62,
          stamina: 76,
          strength: 78
        }
      }
    },
    {
      id: "villarreal_diego_conde",
      name: "Diego Conde",
      shirtNumber: 13,
      position: "GK",
      overall: 77,
      wage: 1500000,
      contractYears: 4, // hasta 2029
      value: 6000000,
      birthDate: "1998-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Leganés",
      attributes: {
        technical: {
          passing: 62,
          shooting: 12,
          dribbling: 38,
          tackling: 28
        },
        mental: {
          vision: 66,
          composure: 76,
          workRate: 80,
          leadership: 64
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 76
        }
      }
    },
    {
      id: "villarreal_arnau_tenas",
      name: "Arnau Tenas",
      shirtNumber: 25,
      position: "GK",
      overall: 78,
      wage: 1800000,
      contractYears: 4, // hasta 2029
      value: 8000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Paris Saint-Germain",
      attributes: {
        technical: {
          passing: 68,
          shooting: 14,
          dribbling: 40,
          tackling: 30
        },
        mental: {
          vision: 70,
          composure: 80,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 60,
          stamina: 75,
          strength: 78
        }
      }
    },

    // DEFENSAS
    {
      id: "villarreal_logan_costa",
      name: "Logan Costa",
      shirtNumber: 2,
      position: "CB",
      overall: 80,
      wage: 2500000,
      contractYears: 5, // 2030
      value: 14000000,
      birthDate: "2001-01-01",
      nationality: "Cabo Verde",
      birthPlace: "Cabo Verde",
      youthClub: "Toulouse",
      attributes: {
        technical: {
          passing: 70,
          shooting: 45,
          dribbling: 64,
          tackling: 84
        },
        mental: {
          vision: 68,
          composure: 78,
          workRate: 84,
          leadership: 72
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 86
        }
      }
    },
    {
      id: "villarreal_altimira",
      name: "Adrià Altimira",
      shirtNumber: 3,
      position: "RB",
      overall: 76,
      wage: 1200000,
      contractYears: 1, // 2026
      value: 6000000,
      birthDate: "2001-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Leganés",
      attributes: {
        technical: {
          passing: 72,
          shooting: 52,
          dribbling: 74,
          tackling: 74
        },
        mental: {
          vision: 68,
          composure: 70,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 80,
          stamina: 82,
          strength: 72
        }
      }
    },
    {
      id: "villarreal_rafa_marin",
      name: "Rafa Marín",
      shirtNumber: 4,
      position: "CB",
      overall: 79,
      wage: 2000000,
      contractYears: 1, // 2026
      value: 10000000,
      birthDate: "2002-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Madrid",
      attributes: {
        technical: {
          passing: 74,
          shooting: 48,
          dribbling: 68,
          tackling: 82
        },
        mental: {
          vision: 70,
          composure: 74,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "villarreal_kambwala",
      name: "Willy Kambwala",
      shirtNumber: 5,
      position: "CB",
      overall: 78,
      wage: 1800000,
      contractYears: 4, // 2029
      value: 9000000,
      birthDate: "2003-01-01",
      nationality: "Francia",
      birthPlace: "Francia",
      youthClub: "Manchester United",
      attributes: {
        technical: {
          passing: 70,
          shooting: 44,
          dribbling: 66,
          tackling: 82
        },
        mental: {
          vision: 66,
          composure: 72,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 84
        }
      }
    },
    {
      id: "villarreal_foyth",
      name: "Juan Foyth",
      shirtNumber: 8,
      position: "RB",
      overall: 83,
      wage: 4500000,
      contractYears: 4, // 2029
      value: 22000000,
      birthDate: "1998-01-01",
      nationality: "Argentina",
      birthPlace: "Argentina",
      youthClub: "Estudiantes",
      attributes: {
        technical: {
          passing: 78,
          shooting: 58,
          dribbling: 76,
          tackling: 87
        },
        mental: {
          vision: 74,
          composure: 80,
          workRate: 86,
          leadership: 78
        },
        physical: {
          pace: 78,
          stamina: 82,
          strength: 80
        }
      }
    },
    {
      id: "villarreal_renato_veiga",
      name: "Renato Veiga",
      shirtNumber: 12,
      position: "CB",
      overall: 80,
      wage: 2500000,
      contractYears: 7, // 2032
      value: 17000000,
      birthDate: "2003-01-01",
      nationality: "Portugal",
      birthPlace: "Portugal",
      youthClub: "Sporting CP",
      attributes: {
        technical: {
          passing: 76,
          shooting: 52,
          dribbling: 72,
          tackling: 82
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 76,
          stamina: 82,
          strength: 82
        }
      }
    },
    {
      id: "villarreal_mourino",
      name: "Santiago Mouriño",
      shirtNumber: 15,
      position: "CB",
      overall: 77,
      wage: 2000000,
      contractYears: 5, // 2030
      value: 9000000,
      birthDate: "2001-01-01",
      nationality: "Uruguay",
      birthPlace: "Uruguay",
      youthClub: "Nacional",
      attributes: {
        technical: {
          passing: 70,
          shooting: 44,
          dribbling: 66,
          tackling: 80
        },
        mental: {
          vision: 66,
          composure: 72,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 74,
          stamina: 80,
          strength: 82
        }
      }
    },
    {
      id: "villarreal_sergi_cardona",
      name: "Sergi Cardona",
      shirtNumber: 23,
      position: "LB",
      overall: 79,
      wage: 2200000,
      contractYears: 2, // 2027
      value: 10000000,
      birthDate: "1999-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Las Palmas",
      attributes: {
        technical: {
          passing: 76,
          shooting: 52,
          dribbling: 78,
          tackling: 80
        },
        mental: {
          vision: 72,
          composure: 74,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 84,
          strength: 74
        }
      }
    },
    {
      id: "villarreal_pedraza",
      name: "Alfonso Pedraza",
      shirtNumber: 24,
      position: "LB",
      overall: 80,
      wage: 3000000,
      contractYears: 1, // 2026
      value: 12000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 78,
          shooting: 60,
          dribbling: 80,
          tackling: 78
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 84,
          leadership: 70
        },
        physical: {
          pace: 84,
          stamina: 86,
          strength: 76
        }
      }
    },
    {
      id: "villarreal_pau_navarro",
      name: "Pau Navarro",
      shirtNumber: 26,
      position: "CB",
      overall: 75,
      wage: 1000000,
      contractYears: 5, // 2030
      value: 6000000,
      birthDate: "2005-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 68,
          shooting: 40,
          dribbling: 62,
          tackling: 76
        },
        mental: {
          vision: 64,
          composure: 68,
          workRate: 80,
          leadership: 62
        },
        physical: {
          pace: 72,
          stamina: 78,
          strength: 78
        }
      }
    },

    // CENTROCAMPISTAS
    {
      id: "villarreal_manor_solomon",
      name: "Manor Solomon",
      shirtNumber: 6,
      position: "LW",
      overall: 81,
      wage: 3500000,
      contractYears: 1, // 2026
      value: 16000000,
      birthDate: "1999-01-01",
      nationality: "Israel",
      birthPlace: "Israel",
      youthClub: "Maccabi Petah Tikva",
      attributes: {
        technical: {
          passing: 80,
          shooting: 78,
          dribbling: 86,
          tackling: 52
        },
        mental: {
          vision: 80,
          composure: 78,
          workRate: 82,
          leadership: 66
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 68
        }
      }
    },
    {
      id: "villarreal_parejo",
      name: "Dani Parejo",
      shirtNumber: 10,
      position: "CM",
      overall: 83,
      wage: 4500000,
      contractYears: 1, // 2026
      value: 9000000,
      birthDate: "1989-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Real Madrid",
      attributes: {
        technical: {
          passing: 90,
          shooting: 82,
          dribbling: 82,
          tackling: 66
        },
        mental: {
          vision: 92,
          composure: 88,
          workRate: 76,
          leadership: 84
        },
        physical: {
          pace: 58,
          stamina: 74,
          strength: 70
        }
      }
    },
    {
      id: "villarreal_ilias",
      name: "Ilias Akhomach",
      shirtNumber: 11,
      position: "RW",
      overall: 78,
      wage: 2000000,
      contractYears: 2, // 2027
      value: 12000000,
      birthDate: "2004-01-01",
      nationality: "Marruecos",
      birthPlace: "España",
      youthClub: "FC Barcelona",
      attributes: {
        technical: {
          passing: 78,
          shooting: 76,
          dribbling: 86,
          tackling: 52
        },
        mental: {
          vision: 78,
          composure: 74,
          workRate: 82,
          leadership: 64
        },
        physical: {
          pace: 86,
          stamina: 80,
          strength: 66
        }
      }
    },
    {
      id: "villarreal_santi_comesana",
      name: "Santi Comesaña",
      shirtNumber: 14,
      position: "CM",
      overall: 80,
      wage: 2800000,
      contractYears: 3, // 2028
      value: 14000000,
      birthDate: "1996-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Coruxo",
      attributes: {
        technical: {
          passing: 80,
          shooting: 76,
          dribbling: 78,
          tackling: 76
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 86,
          leadership: 70
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 76
        }
      }
    },
    {
      id: "villarreal_thomas_partey",
      name: "Thomas Partey",
      shirtNumber: 16,
      position: "CDM",
      overall: 83,
      wage: 5500000,
      contractYears: 2, // 2027
      value: 20000000,
      birthDate: "1993-01-01",
      nationality: "Ghana",
      birthPlace: "Ghana",
      youthClub: "Atlético Madrid",
      attributes: {
        technical: {
          passing: 80,
          shooting: 78,
          dribbling: 78,
          tackling: 86
        },
        mental: {
          vision: 80,
          composure: 82,
          workRate: 86,
          leadership: 80
        },
        physical: {
          pace: 74,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "villarreal_tajon_buchanan",
      name: "Tajon Buchanan",
      shirtNumber: 17,
      position: "RWB",
      overall: 80,
      wage: 3000000,
      contractYears: 5, // 2030
      value: 16000000,
      birthDate: "1999-01-01",
      nationality: "Canadá",
      birthPlace: "Canadá",
      youthClub: "New England Revolution",
      attributes: {
        technical: {
          passing: 78,
          shooting: 78,
          dribbling: 86,
          tackling: 54
        },
        mental: {
          vision: 78,
          composure: 76,
          workRate: 84,
          leadership: 66
        },
        physical: {
          pace: 86,
          stamina: 82,
          strength: 70
        }
      }
    },
    {
      id: "villarreal_pape_gueye",
      name: "Pape Gueye",
      shirtNumber: 18,
      position: "CDM",
      overall: 80,
      wage: 3000000,
      contractYears: 3, // 2028
      value: 15000000,
      birthDate: "1999-01-01",
      nationality: "Senegal",
      birthPlace: "Senegal",
      youthClub: "Le Havre",
      attributes: {
        technical: {
          passing: 78,
          shooting: 70,
          dribbling: 76,
          tackling: 84
        },
        mental: {
          vision: 76,
          composure: 76,
          workRate: 86,
          leadership: 68
        },
        physical: {
          pace: 76,
          stamina: 84,
          strength: 84
        }
      }
    },
    {
      id: "villarreal_nicolas_pepe",
      name: "Nicolas Pépé",
      shirtNumber: 19,
      position: "RW",
      overall: 81,
      wage: 3500000,
      contractYears: 3, // 2028
      value: 16000000,
      birthDate: "1995-01-01",
      nationality: "Costa de Marfil",
      birthPlace: "Costa de Marfil",
      youthClub: "Angers",
      attributes: {
        technical: {
          passing: 80,
          shooting: 82,
          dribbling: 86,
          tackling: 52
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 78,
          leadership: 68
        },
        physical: {
          pace: 84,
          stamina: 80,
          strength: 70
        }
      }
    },
    {
      id: "villarreal_moleiro",
      name: "Alberto Moleiro",
      shirtNumber: 20,
      position: "CAM",
      overall: 82,
      wage: 3000000,
      contractYears: 5, // 2030
      value: 22000000,
      birthDate: "2003-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Las Palmas",
      attributes: {
        technical: {
          passing: 84,
          shooting: 78,
          dribbling: 88,
          tackling: 54
        },
        mental: {
          vision: 84,
          composure: 80,
          workRate: 82,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 70
        }
      }
    },

    // DELANTEROS
    {
      id: "villarreal_gerard_moreno",
      name: "Gerard Moreno",
      shirtNumber: 7,
      position: "ST",
      overall: 84,
      wage: 5000000,
      contractYears: 2, // 2027
      value: 22000000,
      birthDate: "1992-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Villarreal CF",
      attributes: {
        technical: {
          passing: 82,
          shooting: 88,
          dribbling: 82,
          tackling: 52
        },
        mental: {
          vision: 82,
          composure: 86,
          workRate: 82,
          leadership: 78
        },
        physical: {
          pace: 76,
          stamina: 80,
          strength: 78
        }
      }
    },
    {
      id: "villarreal_mikautadze",
      name: "Georges Mikautadze",
      shirtNumber: 9,
      position: "ST",
      overall: 82,
      wage: 3500000,
      contractYears: 6, // 2031
      value: 26000000,
      birthDate: "2000-01-01",
      nationality: "Georgia",
      birthPlace: "Georgia",
      youthClub: "Metz",
      attributes: {
        technical: {
          passing: 78,
          shooting: 86,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 78,
          composure: 80,
          workRate: 84,
          leadership: 68
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 76
        }
      }
    },
    {
      id: "villarreal_tani_oluwaseyi",
      name: "Tani Oluwaseyi",
      shirtNumber: 21,
      position: "ST",
      overall: 79,
      wage: 2000000,
      contractYears: 5, // 2030
      value: 14000000,
      birthDate: "2000-01-01",
      nationality: "Canadá",
      birthPlace: "Canadá",
      youthClub: "Minnesota United",
      attributes: {
        technical: {
          passing: 72,
          shooting: 82,
          dribbling: 78,
          tackling: 48
        },
        mental: {
          vision: 72,
          composure: 76,
          workRate: 84,
          leadership: 64
        },
        physical: {
          pace: 82,
          stamina: 82,
          strength: 80
        }
      }
    },
    {
      id: "villarreal_ayoze",
      name: "Ayoze Pérez",
      shirtNumber: 22,
      position: "LW",
      overall: 80,
      wage: 3500000,
      contractYears: 2, // 2027
      value: 12000000,
      birthDate: "1993-01-01",
      nationality: "España",
      birthPlace: "España",
      youthClub: "Tenerife",
      attributes: {
        technical: {
          passing: 80,
          shooting: 80,
          dribbling: 84,
          tackling: 50
        },
        mental: {
          vision: 78,
          composure: 78,
          workRate: 80,
          leadership: 70
        },
        physical: {
          pace: 80,
          stamina: 80,
          strength: 70
        }
      }
    }
  ]

};
