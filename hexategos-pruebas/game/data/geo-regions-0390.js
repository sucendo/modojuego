'use strict';
/* HEXATEGOS · Regiones geográficas compartidas 0.39.0.
 * Fuente política: matriz REGIONS de regional-names-0389.js, conservada en
 * el mismo orden y con sus límites originales para partidas antiguas.
 * Zonas naturales ibéricas: polígonos ESQUEMÁTICOS para lectura de Atlas;
 * no equivalen a límites oficiales ni afectan política, industrias o partidas.
 */
(function(){
 const politicalRegions=[
    ['Cataluña',40.5,43,0.6,3.7,'Principado de Cataluña'],
    ['Aragón',40.2,42.9,-2.5,0.7,'Reino de Aragón'],
    ['Navarra',41.6,43.3,-2.5,-0.6,'Reino de Navarra'],
    ['Valencia',37.8,40.8,-1.7,0.7,'Reino de Valencia'],
    ['Galicia',41.5,44,-10,-6.5,'Reino de Galicia'],
    ['Portugal',36.7,42.4,-10,-6,'Reino de Portugal'],
    ['Andalucía occidental',35.5,38.8,-7.8,-4.0,'Reino de Sevilla'],
    ['Andalucía oriental',35.5,38.8,-4.0,-1.6,'Reino de Granada'],
    ['Castilla',38.4,43.4,-7.4,-1.8,'Reino de Castilla'],
    ['Escocia',54.3,59.5,-8.6,-1,'Reino de Escocia'],
    ['Gales',51.2,53.8,-5.6,-2.3,'Principado de Gales'],
    ['Inglaterra',50,55.6,-6.1,2.2,'Reino de Inglaterra'],
    ['Normandía',48.4,50.3,-2,1.9,'Ducado de Normandía'],
    ['Bretaña',47.2,48.9,-5.5,-1,'Ducado de Bretaña'],
    ['Aquitania',43,46.5,-2.1,2,'Ducado de Aquitania'],
    ['Borgoña',46.3,48.6,3,6.2,'Ducado de Borgoña'],
    ['Provenza',42.4,45.3,4.3,7.7,'Condado de Provenza'],
    ['Baviera',47.2,50.6,10,13.9,'Ducado de Baviera'],
    ['Sajonia',50.3,53.8,9.4,15.1,'Ducado de Sajonia'],
    ['Bohemia',48.4,51.2,12,18.9,'Reino de Bohemia'],
    ['Lombardía',44.8,46.7,8.1,11.5,'Ducado de Lombardía'],
    ['Venecia',44.4,46.3,11.5,13.6,'República de Venecia'],
    ['Toscana',42.4,44.5,9.6,12.6,'Gran Ducado de Toscana'],
    ['Sicilia',36.5,38.7,12,15.8,'Reino de Sicilia'],
    ['Epiro',38.2,41.5,19.2,21.5,'Despotado de Epiro'],
    ['Tracia',40.1,42.7,25,29.5,'Tracia'],
    ['Anatolia',35.7,42.5,26,44,'Anatolia'],
    ['Mesopotamia',29.5,37.5,38,49,'Mesopotamia'],
    ['Arabia',12,32.5,34,60,'Arabia'],
    ['Persia',24,41,44,63,'Persia'],
    ['Magreb',27,37.5,-10,12,'Magreb'],
    ['Egipto',21.5,32.3,24,37,'Egipto'],
    ['Sahel',10,19,-18,38,'Sahel'],
    ['Etiopía',3,15,33,48,'Etiopía'],
    ['India',7,34,68,89,'India'],
    ['Tíbet',26,37,78,101,'Tíbet'],
    ['China',18,53,100,135,'China'],
    ['Corea',33,43,124,132,'Corea'],
    ['Japón',30,46,129,146,'Japón'],
    ['Indochina',5,25,95,110,'Indochina'],
    ['Mesoamérica',8,23,-110,-86,'Mesoamérica'],
    ['Andes',-33,9,-82,-67,'Andes']
  ];
const physicalRegions=[
  {
    "name": "Tierra de Campos",
    "type": "comarca",
    "priority": 100,
    "center": [
      -4.65,
      42.05
    ],
    "polygon": [
      [
        -5.9,
        42.58
      ],
      [
        -3.85,
        42.55
      ],
      [
        -3.84,
        41.57
      ],
      [
        -4.53,
        41.5
      ],
      [
        -5.6,
        41.75
      ]
    ]
  },
  {
    "name": "Los Monegros",
    "type": "comarca",
    "priority": 100,
    "center": [
      -0.4,
      41.65
    ],
    "polygon": [
      [
        -0.99,
        42.02
      ],
      [
        0.23,
        41.93
      ],
      [
        0.37,
        41.34
      ],
      [
        -0.06,
        41.08
      ],
      [
        -0.9,
        41.27
      ]
    ]
  },
  {
    "name": "La Mancha",
    "type": "comarca",
    "priority": 95,
    "center": [
      -3.04,
      39.15
    ],
    "polygon": [
      [
        -4.77,
        40.38
      ],
      [
        -3.9,
        40.53
      ],
      [
        -2.11,
        40.39
      ],
      [
        -1.7,
        39.64
      ],
      [
        -2.14,
        38.5
      ],
      [
        -3.19,
        38.42
      ],
      [
        -4.76,
        38.75
      ]
    ]
  },
  {
    "name": "Algarve",
    "type": "región natural",
    "priority": 95,
    "center": [
      -7.83,
      37.22
    ],
    "polygon": [
      [
        -9.04,
        37.05
      ],
      [
        -8.72,
        37.54
      ],
      [
        -7.46,
        37.5
      ],
      [
        -7.38,
        37.18
      ],
      [
        -7.53,
        36.92
      ],
      [
        -8.77,
        36.88
      ]
    ]
  },
  {
    "name": "Alentejo",
    "type": "región natural",
    "priority": 87,
    "center": [
      -7.75,
      38.45
    ],
    "polygon": [
      [
        -9.05,
        39.16
      ],
      [
        -8.64,
        39.58
      ],
      [
        -7.13,
        39.61
      ],
      [
        -6.88,
        38.86
      ],
      [
        -7,
        37.55
      ],
      [
        -8.58,
        37.49
      ],
      [
        -9.08,
        38.07
      ]
    ]
  },
  {
    "name": "Extremadura",
    "type": "región natural",
    "priority": 85,
    "center": [
      -6.06,
      39.33
    ],
    "polygon": [
      [
        -7.51,
        40.48
      ],
      [
        -5.22,
        40.44
      ],
      [
        -4.72,
        39.58
      ],
      [
        -4.8,
        38.19
      ],
      [
        -5.99,
        37.96
      ],
      [
        -7.43,
        38.13
      ]
    ]
  },
  {
    "name": "Valle del Guadalquivir",
    "type": "valle",
    "priority": 80,
    "center": [
      -5.06,
      37.76
    ],
    "polygon": [
      [
        -6.56,
        37.21
      ],
      [
        -5.99,
        37.2
      ],
      [
        -5.4,
        37.48
      ],
      [
        -4.66,
        37.7
      ],
      [
        -3.83,
        37.94
      ],
      [
        -3.38,
        38.08
      ],
      [
        -3.78,
        38.36
      ],
      [
        -5.13,
        38.19
      ],
      [
        -6.32,
        37.74
      ]
    ]
  },
  {
    "name": "Depresión del Ebro",
    "type": "depresión",
    "priority": 70,
    "center": [
      -0.58,
      41.72
    ],
    "polygon": [
      [
        -2.45,
        42.38
      ],
      [
        -1.56,
        42.48
      ],
      [
        -0.37,
        42.33
      ],
      [
        0.46,
        41.81
      ],
      [
        0.77,
        40.83
      ],
      [
        0.14,
        40.79
      ],
      [
        -1.37,
        41.29
      ],
      [
        -2.53,
        41.78
      ]
    ]
  },
  {
    "name": "Depresión del Guadalquivir",
    "type": "depresión",
    "priority": 70,
    "center": [
      -5.55,
      37.65
    ],
    "polygon": [
      [
        -7.35,
        37.15
      ],
      [
        -6.36,
        36.78
      ],
      [
        -5.32,
        36.96
      ],
      [
        -4.61,
        37.42
      ],
      [
        -3.47,
        37.9
      ],
      [
        -3.23,
        38.29
      ],
      [
        -4.43,
        38.59
      ],
      [
        -5.62,
        38.37
      ],
      [
        -6.78,
        37.73
      ]
    ]
  },
  {
    "name": "Submeseta Norte",
    "type": "meseta",
    "priority": 45,
    "center": [
      -4.45,
      41.63
    ],
    "polygon": [
      [
        -6.34,
        42.72
      ],
      [
        -5.72,
        42.88
      ],
      [
        -4.75,
        42.7
      ],
      [
        -3.12,
        42.62
      ],
      [
        -2.36,
        42.35
      ],
      [
        -2.1,
        41.3
      ],
      [
        -3.47,
        40.73
      ],
      [
        -4.78,
        40.9
      ],
      [
        -5.85,
        41.2
      ],
      [
        -6.53,
        41.73
      ]
    ]
  },
  {
    "name": "Submeseta Sur",
    "type": "meseta",
    "priority": 45,
    "center": [
      -4.1,
      39.74
    ],
    "polygon": [
      [
        -6.67,
        40.4
      ],
      [
        -5.68,
        40.37
      ],
      [
        -4.32,
        40.55
      ],
      [
        -3.31,
        40.68
      ],
      [
        -2.33,
        40.29
      ],
      [
        -1.36,
        39.17
      ],
      [
        -1.91,
        38.11
      ],
      [
        -3.18,
        38.15
      ],
      [
        -4.58,
        38.22
      ],
      [
        -5.52,
        38.46
      ],
      [
        -6.81,
        39.13
      ]
    ]
  }
];
 function inPolygon(lon,lat,poly){
   let inside=false;
   for(let i=0,j=poly.length-1;i<poly.length;j=i++){
     const a=poly[i],b=poly[j];
     const crosses=(a[1]>lat)!==(b[1]>lat);
     if(crosses&&lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside;
   }
   return inside;
 }
 function historicalAt(lat,lon){
   for(const item of politicalRegions){
     if(lat>=item[1]&&lat<=item[2]&&lon>=item[3]&&lon<=item[4])
       return {name:item[0],polity:item[5]};
   }
   return null;
 }
 function naturalAt(lat,lon){
   if(!Number.isFinite(lat)||!Number.isFinite(lon))return [];
   const matches=[];
   for(const reg of physicalRegions)
     if(inPolygon(lon,lat,reg.polygon))matches.push(reg);
   return matches.sort((a,b)=>b.priority-a.priority);
 }
 function regionsAt(lat,lon){
   return {natural:naturalAt(lat,lon),historical:historicalAt(lat,lon)};
 }
 window.HexategosGeoRegions0390=Object.freeze({
   version:'0.39.0',politicalRegions,physicalRegions,historicalAt,naturalAt,regionsAt
 });
})();
