// Datos biográficos contrastados con las fichas individuales de LaLiga 2026/27.
// Sólo se incluyen fichas comprobadas; nunca se deduce la nacionalidad por el nombre.
const VILLARREAL = {
  'Júnior R.': ['Luiz Lúcio Reis Júnior', 1, 'Brasil', '2001-01-14', 'luiz-junior-1'],
  'Costa': ['Logan Evans Costa', 2, 'Cabo Verde', '2001-04-01', 'logan-costa'],
  'Freeman': ['Alex Freeman', 3, 'Estados Unidos', '2004-08-09', 'alex-freeman'],
  'A. Diatta': ['Alassane Diatta', 5, 'Senegal', '2005-05-14', 'alassane-diatta'],
  'Pau Navarro': ['Pau Navarro', 6, 'España', '2005-04-25', 'pau-navarro'],
  'Gerard': ['Gerard Moreno', 7, 'España', '1992-04-07', 'gerard-moreno'],
  'Foyth': ['Juan Foyth', 8, 'Argentina', '1998-01-12', 'foyth'],
  'Mikautadze': ['Georges Mikautadze', 9, 'Georgia', '2000-10-31', 'georges-mikautadze'],
  'A. Moleiro': ['Alberto Moleiro', 10, 'España', '2003-09-30', 'alberto-moleiro'],
  'I. Akhomach': ['Ilias Akhomach', 11, 'Marruecos', '2004-04-16', 'ilias-akhomach'],
  'Renato Veiga': ['Renato Palma Veiga', 12, 'Portugal', '2003-07-29', 'renato-veiga'],
  'Ruben Gomez': ['Rubén Gómez', 13, 'España', '2002-01-24', 'ruben-gomez-peris'],
  'Santi C.v.': ['Santi Comesaña', 14, 'España', '1996-10-05', 'santi-comesana'],
  'Mouriño': ['Santiago Mouriño', 15, 'Uruguay', '2002-02-13', 'santiago-mourino'],
  'Macia': ['Carlos Maciá', 16, 'España', '2008-09-01', 'carlos-macia-1'],
  'Buchanan': ['Tajon Buchanan', 17, 'Canadá', '1999-02-08', 'tajon-buchanan'],
  'Gueye': ['Pape Gueye', 18, 'Senegal', '1999-01-24', 'pape-alassane-gueye'],
  'Pepe': ['Nicolas Pépé', 19, 'Costa de Marfil', '1995-05-29', 'nicolas-pepe'],
  'C. Romero': ['Carlos Romero', 20, 'España', '2001-10-29', 'carlos-romero'],
  'Oluwaseyi': ['Tani Oluwaseyi', 21, 'Canadá', '2000-05-15', 'tani-oluwaseyi'],
  'Ayoze': ['Ayoze Pérez', 22, 'España', '1993-07-29', 'ayoze-perez'],
  'S. Cardona': ['Sergi Cardona', 23, 'España', '1999-07-08', 'sergi-cardona'],
  'Saliba': ['Nathan Saliba', 24, 'Canadá', '2004-02-07', 'nathan-saliba'],
  'Gulácsi': ['Péter Gulácsi', 25, 'Hungría', '1990-05-06', 'peter-gulacsi'],
  'Nizar': ['Nizar El Jmili Ben Hamou', 27, 'España', '2004-11-30', 'nizar-jmili'],
  'J. Gaitán': ['José Ángel Gaitán Diaz', 28, 'España', '2007-02-25', 'joselillo-1'],
  'Cheikh': ['Cheikh Thiam', 30, 'Senegal', '2005-11-07', 'cheikh-thiam'],
};

export function getVerifiedPlayerBiography(clubId, publishedName) {
  if (clubId !== 'villarreal') return null;
  const row = VILLARREAL[publishedName];
  if (!row) return null;
  const [name, shirtNumber, nationality, birthDate, slug] = row;
  return { name, fullName: name, shirtNumber, nationality, birthDate,
    biographySource: `https://www.laliga.com/jugador/${slug}`, biographyVerified: true };
}
