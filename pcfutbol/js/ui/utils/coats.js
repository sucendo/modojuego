// js/ui/utils/coats.js
// Utilidad de escudos (UI). Igual que flags.js: mapea id de club -> imagen.

function normalizeClubId(clubId) {
  if (!clubId) return '';
  return String(clubId).trim().toLowerCase();
}

function getProvisionalCoatUrl(clubId, clubName = '') {
  const label = (clubName || clubId).replace(/_/g, ' ').trim();
  const words = label.split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? `${words[0][0]}${words[1][0]}` : label.slice(0, 2))
    .toLocaleUpperCase().replace(/[^A-ZÁÉÍÓÚÑ0-9]/g, '').slice(0, 2) || 'FC';
  let hash = 0;
  for (const ch of clubId) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const color = ['#2459a5', '#9b2835', '#176e62', '#694eab', '#8c622e'][Math.abs(hash) % 5];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 96"><path d="M7 5h66v43c0 20-14 32-33 42C21 80 7 68 7 48Z" fill="${color}" stroke="#eee" stroke-width="4"/><text x="40" y="52" font-size="26" font-weight="bold" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getCoatUrlForClubId(clubId) {
  const id = normalizeClubId(clubId);
  if (!id) return null;

  // Mapa id de club → fichero de escudo en img/coats
  const map = {
    // =====================
    // LaLiga (España)
    // =====================
    alaves: 'es/Alavés.png',
    athletic: 'es/Athletic Bilbao.png',
    atletico: 'es/Atlético Madrid.png',
    barcelona: 'es/FC Barcelona.png',
    celta: 'es/Celta de Vigo.png',
    elche: 'es/Elche.png',
    espanyol: 'es/RCD Espanyol.png',
    getafe: 'es/Getafe.png',
    girona: 'es/Girona.png',
    mallorca: 'es/RCD Mallorca.png',
    osasuna: 'es/Osasuna.png',
    rayo: 'es/rayo Vallecano.png',
    betis: 'es/Real Betis.png',
    realmadrid: 'es/Real Madrid.png',
    realsociedad: 'es/Real Sociedad.png',
    sevilla: 'es/Sevilla.png',
    valencia: 'es/Valencia.png',
    villarreal: 'es/Villarreal.png',
    realoviedo: 'es/Real Oviedo.png',
    levante: 'es/Levante.png',

    // =====================
    // Premier League (Inglaterra)
    // =====================
    arsenal: 'en/Arsenal.png',
    mancity: 'en/Manchester City.png',
    liverpool: 'en/Liverpool.png',
    manutd: 'en/Manchester United.png',
    chelsea: 'en/Chelsea.png',
    tottenham: 'en/Tottenham.png',
    newcastle: 'en/Newcastle.png',
    astonvilla: 'en/Aston Villa.png',
    brighton: 'en/Brighton.png',
    westham: 'en/west Ham.png',
    everton: 'en/Everton.png',
    leeds: 'en/Leeds.png',
    bournemouth: 'en/Bournemouth.png',
    burnley: 'en/Burnley.png',
    nottingham: 'en/Nottingham.png',
    wolves: 'en/Wolves.png',
    brentford: 'en/brentford.png',
    sunderland: 'en/Sunderland AFC.png',
    crystalpalace: 'en/Crystal Palace.png',
    fulham: 'en/Fulham.png',

    // =====================
    // Serie A (Italia)
    // =====================
    acmilan: 'it/Milan.png',
    inter: 'it/inter.png',
    juventus: 'it/Juventus.png',
    napoli: 'it/napoli.png',
    roma: 'it/Roma.png',
    lazio: 'it/Lazio.png',
    atalanta: 'it/Atalanta.png',
    fiorentina: 'it/Fiorentina.png',
    bologna: 'it/Bolonia.png',
    torino: 'it/Torino.png',
    cagliari: 'it/Cagliari.png',
    udinese: 'it/Udinese.png',
    hellasverona: 'it/Hellas Verona.png',
    sassuolo: 'it/Sassuolo.png',
    lecce: 'it/Lecce.png',
    como: 'it/Como.png',
    genoa: 'it/Genoa.png',
    cremonese: 'it/Cremonese.png',
    parma: 'it/Parma.png',
    pisa: 'it/Pisa.png',

    // =====================
    // Bundesliga (Alemania)
    // =====================
    bayern: 'de/Bayern Munich.png',
    dortmund: 'de/Dortmund.png',
    leverkusen: 'de/Leverkusen.png',
    augsburg: 'de/Augsburgo.png',
    colonia: 'de/Colonia.png',
    unionberlin: 'de/FC Union Berlin.png',
    frankfurt: 'de/Frankfurt.png',
    freiburg: 'de/Friburgo.png',
    hamburg: 'de/Hamburg.png',
    heidenheim: 'de/Heidenheim.png',
    hoffenheim: 'de/Hoffenheim.png',
    leipzig: 'de/Leipzig.png',
    mainz: 'de/Mainz 05.png',
    monchengladbach: 'de/Monchengladbach.png',
    stpauli: 'de/St Pauli.png',
    stuttgart: 'de/Stuttgart.png',
    werderbremen: 'de/Werder Bremen.png',
    wolfsburg: 'de/Wolfsburg.png',

    // =====================
    // Ligue 1 (Francia)
    // =====================
    psg: 'fr/PSG.png',
    metz: 'fr/Metz.png',
    monaco: 'fr/Monaco.png',
    nantes: 'fr/Nantes.png',
    angers: 'fr/Angers.png',
    auxerre: 'fr/Auxerre.png',
    lehavre: 'fr/Le Havre.png',
    lens: 'fr/Lens.png',
    lorient: 'fr/Lorient.png',
    lille: 'fr/LOSC.png',
    lyon: 'fr/Lyon.png',
    marseille: 'fr/Marsella.png',
    nice: 'fr/Niza.png',
    parisfc: 'fr/Paris FC.png',
    strasbourg: 'fr/Racing Estrasburgo.png',
    rennes: 'fr/Rennes.png',
    brest: 'fr/Stade Brestois.png',
    toulouse: 'fr/Toulouse.png',

    // =====================
    // Eredivisie (Países Bajos)
    // =====================
    ajax: 'nl/Ajax.png',
    psv: 'nl/PSV Eindhoven.png',
    feyenoord: 'nl/Feyenoord.png',
    az: 'nl/AZ Alkmaar.png',
    nec: 'nl/NEC.png',
    utrecht: 'nl/Utrecht.png',
    twente: 'nl/Twente.png',
    heerenveen: 'nl/Heerenveen.png',
    groningen: 'nl/FC Groningen.png',
    sparta: 'nl/Sparta Rotterdam.png',
    heracles: 'nl/Heracles.png',
    nac: 'nl/NAC.png',
    telstar: 'nl/SC Telstar.png',
    volendam: 'nl/Volendam.png',
    zwolle: 'nl/Zwolle.png',
    excelsior: 'nl/Excelsior.png',
    fortunasittard: 'nl/Fortuna Sittard.png',
    fortuna: 'nl/Fortuna Sittard.png',
    goahead: 'nl/Go Ahead.png',

    // Primeira Liga (Portugal)
    porto: 'pt/Porto.png',
    benfica: 'pt/Benfica.png',
    sportingcp: 'pt/Sporting Lisboa.png',
    braga: 'pt/Braga.png',
    guimaraes: 'pt/Guimaraes.png',
    arouca: 'pt/Arouca.png',
    estoril: 'pt/Estoril.png',
    moreirense: 'pt/Moreirense.png',
    nacional: 'pt/Nacional.png',
    rioave: 'pt/Rio Ave.png',
    santaclara: 'pt/Santa Clara.png',
    tondela: 'pt/Tondela.png',
  };

  // Los filiales comparten el escudo del club matriz mientras no haya una
  // variante propia contrastada disponible en el paquete gráfico.
  const affiliateParent = {
    celta_fortuna: 'celta', realsociedad_b: 'realsociedad', sporting_b: 'sportingcp',
    benfica_b: 'benfica', porto_b: 'porto', jong_ajax: 'ajax', jong_az: 'az',
    jong_utrecht: 'utrecht', jong_psv: 'psv',
  };
  const filename = map[id] || map[affiliateParent[id]];
  return filename ? `img/coats/${filename}` : getProvisionalCoatUrl(id);
}

export function createCoatImgElement(clubId, clubName, size = 20) {
  const url = getCoatUrlForClubId(clubId);
  if (!url) return null;

  const img = document.createElement('img');
  img.src = url;
  img.alt = clubName ? `Escudo de ${clubName}` : 'Escudo del club';
  if (url.startsWith('data:')) img.title = 'Emblema provisional; falta el escudo oficial';
  img.addEventListener('error', () => {
    if (img.src.startsWith('data:')) return;
    img.src = getProvisionalCoatUrl(normalizeClubId(clubId), clubName);
    img.title = 'Emblema provisional; imagen oficial no disponible';
  });
  img.classList.add('coat-icon');
  img.loading = 'lazy';
  if (size != null) {
    img.width = size;
    img.height = size;
  }
  return img;
}

  const mapita = {
    // =====================
    // LaLiga (España)
    // =====================
    alaves: 'es/Alavés.png',
    athletic: 'es/Athletic Bilbao.png',
    atletico: 'es/Atlético Madrid.png',
    barcelona: 'es/FC Barcelona.png',
    celta: 'es/Celta de Vigo.png',
    elche: 'es/Elche.png',
    espanyol: 'es/RCD Espanyol.png',
    getafe: 'es/Getafe.png',
    girona: 'es/Girona.png',
    mallorca: 'es/RCD Mallorca.png',
    osasuna: 'es/Osasuna.png',
    rayo: 'es/rayo Vallecano.png',
    betis: 'es/Real Betis.png',
    realmadrid: 'es/Real Madrid.png',
    realsociedad: 'es/Real Sociedad.png',
    sevilla: 'es/Sevilla.png',
    valencia: 'es/Valencia.png',
    villarreal: 'es/Villarreal.png',
    realoviedo: 'es/Real Oviedo.png',
    levante: 'es/Levante.png',

    // =====================
    // Premier League (Inglaterra) – clubs de tu liga
    // =====================
    arsenal: 'en/Arsenal.png',
    mancity: 'en/Manchester City.png',
    liverpool: 'en/Liverpool.png',
    manutd: 'en/Manchester United.png',
    chelsea: 'en/Chelsea.png',
    tottenham: 'en/Tottenham.png',
    newcastle: 'en/Newcastle.png',
    astonvilla: 'en/Aston Villa.png',
    brighton: 'en/Brighton.png',
    westham: 'en/west Ham.png',

    // Premier extra (equipos para los que también tienes escudo)
    everton: 'en/Everton.png',
    leeds: 'en/Leeds.png',
    bournemouth: 'en/Bournemouth.png',
    burnley: 'en/Burnley.png',
    nottingham: 'en/Nottingham.png',
    wolves: 'en/Wolves.png',
    brentford: 'en/brentford.png',
    sunderland: 'en/Sunderland AFC.png',

    // =====================
    // Serie A (Italia) – clubs de tu liga
    // =====================
    acmilan: 'it/Milan.png',
    inter: 'it/inter.png',
    juventus: 'it/Juventus.png',
    napoli: 'it/napoli.png',
    roma: 'it/Roma.png',
    lazio: 'it/Lazio.png',
    atalanta: 'it/Atalanta.png',
    fiorentina: 'it/Fiorentina.png',
    bologna: 'it/Bolonia.png',   // faltaba en tu map original
    torino: 'it/Torino.png',

    // Serie A / Italia extra (escudos que también tienes en coats)
    cagliari: 'it/Cagliari.png',
    udinese: 'it/Udinese.png',
    hellasverona: 'it/Hellas Verona.png',
    sassuolo: 'it/Sassuolo.png',
    lecce: 'it/Lecce.png',
    como: 'it/Como.png',

    // =====================
    // Bundesliga (Alemania)
    // =====================
    bayern: 'de/Bayern Munich.png',
    dortmund: 'de/Dortmund.png',
    leverkusen: 'de/Leverkusen.png',
    augsburg: 'de/Augsburgo.png',
    colonia: 'de/Colonia.png',
    unionberlin: 'de/FC Union Berlin.png',
    frankfurt: 'de/Frankfurt.png',
    freiburg: 'de/Friburgo.png',
    hamburg: 'de/Hamburg.png',
    heidenheim: 'de/Heidenheim.png',
    hoffenheim: 'de/Hoffenheim.png',
    leipzig: 'de/Leipzig.png',
    mainz: 'de/Mainz 05.png',
monchengladbach: 'de/Monchengladbach.png',
stpauli: 'de/St Pauli.png',
stuttgart: 'de/Stuttgart.png',
werderbremen: 'de/Werder Bremen.png',
wolfsburg: 'de/Wolfsburg.png',   

    // =====================
    // Ligue 1 (Francia)
    // =====================
    psg: 'fr/PSG.png',
    metz: 'fr/Metz.png',
    monaco: 'fr/Monaco.png',
    nantes: 'fr/Nantes.png',
    angers: 'fr/Angers.png',
    auxerre: 'fr/Auxerre.png',
    lehavre: 'fr/Le Havre.png',
    lens: 'fr/Lens.png',
    lorient: 'fr/Lorient.png',
    lille: 'fr/LOSC.png',   // Lille OSC
    lyon: 'fr/Lyon.png',
    marseille: 'fr/Marsella.png',   
nice: 'fr/Niza.png',
parisfc: 'fr/Paris FC.png',
strasbourg: 'fr/Racing Estrasburgo.png',
rennes: 'fr/Rennes.png',
brest: 'fr/Stade Brestois.png',
toulouse: 'fr/Toulouse.png',

    // =====================
    // Eredivisie (Países Bajos) – los de tu liga
    // =====================
    ajax: 'nl/Ajax.png',                  // en tu proyecto
    psv: 'nl/PSV Eindhoven.png',          // en tu proyecto
    feyenoord: 'nl/Feyenoord.png',        // en tu proyecto
    az: 'nl/AZ Alkmaar.png',              // en tu proyecto
    nec: 'nl/NEC.png',                    // en tu proyecto
    utrecht: 'nl/Utrecht.png',
    twente: 'nl/Twente.png',
    heerenveen: 'nl/Heerenveen.png',
    groningen: 'nl/FC Groningen.png',
    sparta: 'nl/Sparta Rotterdam.png',

    // Eredivisie extra (otros escudos que ya tienes)
    heracles: 'nl/Heracles.png',
    nac: 'nl/NAC.png',
    telstar: 'nl/SC Telstar.png',
    volendam: 'nl/Volendam.png',
    zwolle: 'nl/Zwolle.png',

    // =====================
    // (reservado) Primeira Liga (Portugal)
    // =====================
    // En el coats.zip que has subido ahora no aparecen PNG de Benfica, Porto, etc.
    // Cuando los añadas en img/coats/pt/..., aquí se pueden mapear:
    // benfica: 'pt/Benfica.png',
    // porto: 'pt/Porto.png',
    // ...
  };
