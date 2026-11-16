// Registros ausentes de algunas instantáneas 2026/27. Solo se incluyen
// futbolistas que figuran en las páginas del club o de la competición.
// Los nombres abreviados reproducen la grafía de la liga, sin inventar apellidos.
export const SQUAD_SUPPLEMENTS_2026_27 = {
  nec: {
    source: 'https://www.nec-nijmegen.nl/teams.htm',
    players: [
      { name: 'Emre Mor', position: 'RW', shirtNumber: 7 },
      { name: 'Dusan Tadić', position: 'ST', shirtNumber: 10, preferredPosition: true },
      { name: 'Kaj Sierhuis', position: 'ST', shirtNumber: 14, preferredPosition: true },
      { name: 'Adam Tahaui', position: 'LW', shirtNumber: 19 },
      { name: 'Bryan Linssen', position: 'ST', shirtNumber: 30, preferredPosition: true },
      { name: 'Kevin Kers', position: 'ST', shirtNumber: 34, preferredPosition: true },
      { name: 'Clement Bischoff', position: 'RW', shirtNumber: 99 },
    ],
  },
  willemii: {
    source: 'https://eredivisie.nl/competitie/clubs/willem-ii/',
    players: [
      { name: 'J. Slory', position: 'RW', shirtNumber: 7 },
      { name: 'D. Haen', position: 'ST', shirtNumber: 9, preferredPosition: true },
      { name: 'A. Culum', position: 'LW', shirtNumber: 11 },
      { name: 'C. Obi', position: 'ST', shirtNumber: 17, preferredPosition: true },
      { name: 'T. Verheydt', position: 'ST', shirtNumber: 28, preferredPosition: true },
      { name: 'L. Maal', position: 'ST', shirtNumber: 44, preferredPosition: true },
      { name: 'E. Gürbüz', position: 'ST', shirtNumber: 50, preferredPosition: true },
    ],
  },
  marseille: {
    source: 'https://www.uefa.com/uefaeuropaleague/clubs/52748--marseille/squad/',
    players: [
      { name: 'Jelle van Neck', position: 'GK', shirtNumber: 40 },
      { name: 'Ibrahim Gomis', position: 'GK', shirtNumber: 41 },
    ],
  },
  arouca: {
    source: 'https://fcarouca.eu/plantel/',
    players: [
      { name: 'Jakub Vinarcik', position: 'GK' },
      { name: 'Ignacio de Arruabarrena', position: 'GK' },
    ],
  },
};
