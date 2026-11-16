// js/ui/utils/coats.js
// Utilidad de escudos (UI). Igual que flags.js: mapea id de club -> imagen.
import { GOOGLE_SPORTS_COATS, OTHER_REMOTE_COATS, LOCAL_COAT_ADDITIONS } from './coatSources.js';

function normalizeClubId(clubId) {
  if (!clubId) return '';
  return String(clubId).trim().toLowerCase();
}

export function getCoatCandidateUrlsForClubId(clubId) {
  const id = normalizeClubId(clubId);
  if (!id) return [];

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
  };

  const sources = [];
  const google = GOOGLE_SPORTS_COATS[id];
  if (google) {
    // El tamaño indicado por el usuario; si Google lo retira, probamos
    // la URL original obtenida del catálogo, antes del respaldo local.
    const match = google.match(/^https:\/\/ssl\.gstatic\.com\/onebox\/media\/sports\/logos\/(?:optimized\/)?([a-zA-Z0-9_-]+)_(?:48x48|96x96|500x500)\.png$/);
    if (match) {
      sources.push(`https://ssl.gstatic.com/onebox/media/sports/logos/optimized/${match[1]}_96x96.png`);
    }
    sources.push(google);
  }

  const filename = map[id] || LOCAL_COAT_ADDITIONS[id];
  if (filename) sources.push(`img/coats/${filename}`);
  if (OTHER_REMOTE_COATS[id]) sources.push(OTHER_REMOTE_COATS[id]);
  return [...new Set(sources)];
}

export function getCoatUrlForClubId(clubId) {
  return getCoatCandidateUrlsForClubId(clubId)[0] || null;
}

function coatPlaceholder(clubName, clubId) {
  const label = (clubName || clubId || '?').trim().split(/\s+/)
    .filter(Boolean).slice(0, 3).map(word => word[0].toUpperCase()).join('');
  const safeLabel = label.replace(/[&<>"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <path d="M48 5 85 16V48C85 70 70 84 48 93 26 84 11 70 11 48V16Z" fill="#173252" stroke="#e5bd59" stroke-width="5"/>
    <text x="48" y="60" font-size="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" fill="#fff">${safeLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Captura también las imágenes que se insertan mediante outerHTML en tablas.
let fallbackListenerInstalled = false;
function ensureCoatFallbackListener() {
  if (fallbackListenerInstalled) return;
  document.addEventListener('error', event => {
    const img = event.target;
    if (!img?.classList?.contains('coat-icon')) return;
    let remaining = [];
    try { remaining = JSON.parse(img.dataset.coatFallbacks || '[]'); } catch { /* no-op */ }
    if (!remaining.length) {
      img.style.visibility = 'hidden';
      return;
    }
    img.dataset.coatFallbacks = JSON.stringify(remaining.slice(1));
    img.src = remaining[0];
  }, true);
  fallbackListenerInstalled = true;
}

export function createCoatImgElement(clubId, clubName, size = 20) {
  const urls = getCoatCandidateUrlsForClubId(clubId);
  const placeholder = coatPlaceholder(clubName, clubId);
  ensureCoatFallbackListener();
  const img = document.createElement('img');
  img.src = urls[0] || placeholder;
  img.dataset.coatFallbacks = JSON.stringify([...urls.slice(1), placeholder]);
  img.alt = clubName ? `Escudo de ${clubName}` : 'Escudo del club';
  img.classList.add('coat-icon');
  img.loading = 'lazy';
  img.decoding = 'async';
  if (size != null) {
    img.width = size;
    img.height = size;
  }
  return img;
}
