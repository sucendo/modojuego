function normalizeNationality(nationality) {
  if (!nationality) return '';
  return String(nationality)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

export function getFlagUrlForNationality(nationality) {
  const n = normalizeNationality(nationality);
  if (!n) return null;

  // Tu mapa original (puedes ampliarlo aquí como ya lo tenías)

  // Mapa nacionalidad (ES) → fichero de bandera
  const map = {
	// Europa
	Albania: 'Flag_of_Albania.svg',
	Andorra: 'Flag_of_Andorra.svg',
	Austria: 'Flag_of_Austria.svg',
	Bélgica: 'Flag_of_Belgium.svg',
	Belgica: 'Flag_of_Belgium.svg',
	Croacia: 'Flag_of_Croatia.svg',
	Kósovo: 'Flag_of_Kosovo.svg',
	Dinamarca: 'Flag_of_Denmark.svg',
	Finlandia: 'Flag_of_Finland.svg',
	Grecia: 'Flag_of_Greece.svg',
	Inglaterra: 'Flag_of_England.svg',
	Islandia: 'Flag_of_Iceland.svg',
	Francia: 'Flag_of_France.svg',
	Georgia: 'Flag_of_Georgia.svg',
	Alemania: 'Flag_of_Germany.svg',
	Italia: 'Flag_of_Italy.svg',
	Macedonia: 'Flag_of_North_Macedonia.svg',
	'Macedonia del Norte': 'Flag_of_North_Macedonia.svg',
	Noruega: 'Flag_of_Norway.svg',
	Polonia: 'Flag_of_Poland.svg',
	Portugal: 'Flag_of_Portugal.svg',
	Rumanía: 'Flag_of_Romania.svg',
	Rumania: 'Flag_of_Romania.svg',
	Rusia: 'Flag_of_Russia.svg',
	Eslovaquia: 'Flag_of_Slovakia.svg',
	Eslovenia:	'Flag_of_Slovenia.svg',
	España: 'Flag_of_Spain.svg',
	Serbia: 'Flag_of_Serbia.svg',
	Suecia: 'Flag_of_Sweden.svg',
	Suiza: 'Flag_of_Switzerland.svg',
	'República Checa': 'Flag_of_the_Czech_Republic.svg',
	'Republica Checa': 'Flag_of_the_Czech_Republic.svg',
	'República Dominicana': 'Flag_of_the_Dominican_Republic.svg',
	'Republica Dominicana': 'Flag_of_the_Dominican_Republic.svg',
	'Países Bajos': 'Flag_of_the_Netherlands.svg',
	'Paises Bajos': 'Flag_of_the_Netherlands.svg',
	Ucrania: 'Flag_of_Ukraine.svg',

	// América
	Argentina: 'Flag_of_Argentina.svg',
	Brasil: 'Flag_of_Brazil.svg',	
	Canadá: 'Flag_of_Canada.svg',
	Chile: 'Flag_of_Chile.svg',
	Colombia: 'Flag_of_Colombia.svg',
	Ecuador: 'Flag_of_Ecuador.svg',
	'Estados Unidos': 'Flag_of_the_United_States.svg',
	Honduras: 'Flag_of_Honduras_2022_present.svg',
	'Guadalupe (Francia)':  'Flag_of_France.svg',
	México: 'Flag_of_Mexico.svg',
	Mexico: 'Flag_of_Mexico.svg',
	Surinam: 'Flag_of_Suriname.svg',
	Uruguay: 'Flag_of_Uruguay.svg',
	Venezuela: 'Flag_of_Venezuela.svg',

	// África
	Angola: 'Flag_of_Angola.svg',
	'Cabo Verde': 'Flag_of_Cape_Verde.svg',
	Camerún: 'Flag_of_Cameroon.svg',
	Camerun: 'Flag_of_Cameroon.svg',
	'República Centroafricana': 'Flag_of_the_Central_African_Republic.svg',
	'República Democrática del Congo': 'Flag_of_the_Democratic_Republic_of_the_Congo.svg',
	'Costa de Marfil': 'Flag_of_Côte_d_Ivoire.svg',
	Ghana:	'Flag_of_Ghana.svg',
	Guinea: 'Flag_of_Guinea.svg',
	'Guinea Ecuatorial': 'Flag_of_Equatorial_Guinea.svg',
	Marruecos: 'Flag_of_Morocco.svg',
	Mozambique: 'Flag_of_Mozambique.svg',
	Niger: 'Flag_of_Niger.svg',
	Nigeria: 'Flag_of_Nigeria.svg',
	Senegal: 'Flag_of_Senegal.svg',
	Togo: 'Flag_of_Togo_(3-2).svg',

	// Asia / otros
	Israel: 'Flag_of_Israel.svg',
	Japón: 'Flag_of_Japan.svg',
	Kazajistán: 'Flag_of_Kazakhstan.svg',
	Kazajistan: 'Flag_of_Kazakhstan.svg',
	Turquía: 'Flag_of_Turkey.svg',
	Turquia: 'Flag_of_Turkey.svg',
	
	// Oceania
	Australia: 'Flag_of_Australia_(converted).svg',
	
  };

  const filename = map[n] || map[nationality];
  if (!filename) return null;
  return `img/flags/${filename}`;
}

export function createFlagImgElement(nationality, size = 16) {
  const url = getFlagUrlForNationality(nationality);
  if (!url) return null;

  const img = document.createElement('img');
  img.src = url;
  img.alt = nationality ? `Bandera de ${nationality}` : 'Bandera';
  img.classList.add('flag-icon');
  img.loading = 'lazy';
  if (size != null) {
    img.width = size;
    img.height = size;
  }
  return img;
}