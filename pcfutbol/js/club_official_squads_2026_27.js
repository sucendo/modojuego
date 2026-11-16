// Plantillas de clubes 2026/27 publicadas directamente por los equipos.
// Nombres, posiciones y dorsales publicados; valor, salario, cláusulas y
// duración contractual son estimaciones del juego.
function decodeClubRoster(rows) {
  return rows.split('\n').filter(Boolean).map(row => {
    const [name, position, shirt] = row.split('|');
    return { name, position, ...(shirt ? { shirtNumber: Number(shirt) } : {}) };
  });
}

export const CLUB_OFFICIAL_SQUADS_2026_27 = {
  "sabadell": { source: "https://www.cesabadellfc.com/es/plantilla/", players: decodeClubRoster("Diego Fuoli|POR|1\nJosé Ortega|POR|13\nCarlos Alemán|CB|\nPipa|CB|2\nGenar Fornés|CB|3\nMiki Codina|CB|4\nArthur Bonaldo|CB|5\nEdgar González|CB|6\nTon Ripoll|CB|7\nÓscar Sanz|CB|14\nKaiser|CB|15\nEneko Aguilar|CB|24\nJosé Luís Catalá|CB|27\nPere Pons|CM|8\nUrri|CM|20\nAlain Ribeiro|CM|21\nQuadri Liameed|CM|22\nMiguelete|ST|10\nJavi López-Pinto|ST|11\nGastón Valles|ST|\nNicholas Gioacchini|ST|16\nAgustín Coscia|ST|17\nNikolay Obolskii|ST|18\nYanis Rahmani|ST|19\nJoel Priego|ST|23\nXavi Moreno|ST|30") },
  "celta_fortuna": { source: "https://rccelta.es/equipos/celta-fortuna/", players: decodeClubRoster("Coke Carrillo|POR|1\nCaio Barone|POR|13\nMarcos González|POR|25\nAnthony Khayat|CB|\nPablo Gavián|CB|2\nQuique Ribes|CB|3\nSeyni Ndiaye|CB|4\nPablo Meixús|CB|\nJan Oliveras|CB|14\nJoel López|CB|18\nAnxo Rodríguez|CB|20\nAlexis Olmedo|CB|21\nGermain Milla|CB|23\nHugo Burcio|CM|5\nAndrés Antañón|CM|8\nAdrià Capdevila|CM|16\nStefan Bajčetić|CM|22\nJones El-Abdellaoui|ST|\nBernard Somuah|ST|7\nÁlvaro Marín|ST|9\nÓscar Marcos|ST|10\nÁngel Arcos|ST|11\nAldrine Kibet|ST|15\nHugo Cuenca|ST|17\nÁngel Davila|ST|19") },
};

