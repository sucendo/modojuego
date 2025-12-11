// js/squads_real.js
// Plantillas "reales" por club. Si un club aparece aquí, se usan estos jugadores
// en vez de la generación automática de data.js.
// Los atributos detallados se siguen generando en el motor a partir de overall + posición.

export const realSquads = {
	
  // =======================
  // ATHLETIC CLUB
  // =======================
  athletic: [
    // PORTEROS
    {
      id: "athletic_unai_simon",
      name: "Unai Simón",
      shirtNumber: 1,
      position: "POR",
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
      position: "POR",
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
      position: "DM",
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
      position: "AM",
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
      position: "AM",
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
      position: "DM",
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
      position: "AM",
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
      position: "EI",
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
      position: "ED",
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
      position: "EI",
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
      position: "EI",
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
	position: "POR",
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
	position: "POR",
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
	position: "DM",
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
	position: "MC",
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
	position: "MC",
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
	position: "AM",
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
	position: "AM",
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
	position: "DC",
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
	position: "DC",
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
	position: "EI",
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
	position: "POR",
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
	position: "POR",
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
	position: "POR",
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
	position: "MC",
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
	position: "AM",
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
	position: "DM",
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
	position: "AM",
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
	position: "DM",
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
	position: "EI",
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
	position: "ED",
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
	position: "ED",
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
	position: "EI",
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
	position: "ED",
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
  // REAL MADRID CF
  // =======================
  realmadrid: [
    {
      id: "rm_courtois",
      name: "Thibaut Courtois",
      shirtNumber: 1,
      position: "POR",
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
      position: "POR",
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
      position: "POR",
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
      position: "AM",
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
      position: "DM",
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
      position: "AM",
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
      position: "AM",
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
      position: "EI",
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
      position: "ED",
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
      position: "DC",
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
      position: "ED",
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
  // VALENCIA CF
  // =======================
  valencia: [
    // PORTEROS
    {
      id: "valencia_dimitrievski",
      name: "Stole Dimitrievski",
      shirtNumber: 1,
      position: "POR",
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
      position: "POR",
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
      position: "POR",
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
      position: "AM",
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
      position: "EI",
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
      position: "AM",
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
      position: "DM",
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
      position: "AM",
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
      position: "DM",
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
      position: "EI",
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
      position: "ED",
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
      position: "POR",
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
      position: "POR",
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
      position: "POR",
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
      position: "AM",
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
      position: "AM",
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
      position: "DM",
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
      position: "AM",
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
      position: "DM",
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
      position: "AM",
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
      position: "AM",
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
      position: "EI",
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
