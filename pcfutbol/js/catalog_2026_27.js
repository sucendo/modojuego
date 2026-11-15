// Participantes de las dos primeras categorías en la temporada 2026/27.
// Fuentes: webs oficiales de LaLiga, Premier League, EFL, Lega Serie A/B,
// Bundesliga, LFP, Liga Portugal, Eredivisie y Keuken Kampioen Divisie.
// Formato por línea: identificador estable | nombre | abreviatura.
// Este catálogo NO afirma que las plantillas de jugadores estén actualizadas.

function clubs(text) {
  return text.trim().split('\n').map((line) => {
    const [id, name, shortName] = line.split('|').map((part) => part.trim());
    if (!id || !name || !shortName) throw new Error(`Club inválido: ${line}`);
    return { id, name, shortName };
  });
}

export const COMPETITIONS_2026_27 = [
  {
    id: 'league_es_primera', name: 'LaLiga EA Sports', country: 'España', tier: 1,
    clubs: clubs(`
alaves|Deportivo Alavés|ALA
athletic|Athletic Club|ATH
atletico|Atlético de Madrid|ATM
barcelona|FC Barcelona|FCB
celta|RC Celta|CEL
elche|Elche CF|ELC
espanyol|RCD Espanyol|ESP
getafe|Getafe CF|GET
levante|Levante UD|LEV
malaga|Málaga CF|MAL
racing_santander|Real Racing Club|RAC
rayo|Rayo Vallecano|RAY
deportivo|RC Deportivo|DEP
osasuna|CA Osasuna|OSA
betis|Real Betis|BET
realmadrid|Real Madrid CF|RMA
realsociedad|Real Sociedad|RSO
sevilla|Sevilla FC|SEV
valencia|Valencia CF|VAL
villarreal|Villarreal CF|VIL`),
  },
  {
    id: 'league_es_segunda', name: 'LaLiga Hypermotion', country: 'España', tier: 2,
    clubs: clubs(`
ceuta|AD Ceuta FC|CEU
albacete|Albacete Balompié|ALB
burgos|Burgos CF|BUR
cadiz|Cádiz CF|CAD
castellon|CD Castellón|CAS
eldense|CD Eldense|ELD
leganes|CD Leganés|LEG
tenerife|CD Tenerife|TEN
sabadell|CE Sabadell|SAB
celta_fortuna|Celta Fortuna|CELB
cordoba|Córdoba CF|COR
andorra|FC Andorra|AND
girona|Girona FC|GIR
granada|Granada CF|GRA
realsociedad_b|Real Sociedad B|RSOB
mallorca|RCD Mallorca|MAL
realoviedo|Real Oviedo|OVI
sporting_gijon|Real Sporting de Gijón|SPO
valladolid|Real Valladolid CF|VAD
eibar|SD Eibar|EIB
almeria|UD Almería|ALM
laspalmas|UD Las Palmas|LPA`),
  },
  {
    id: 'league_en_premier', name: 'Premier League', country: 'Inglaterra', tier: 1,
    clubs: clubs(`
bournemouth|AFC Bournemouth|BOU
arsenal|Arsenal|ARS
astonvilla|Aston Villa|AVL
brentford|Brentford|BRE
brighton|Brighton & Hove Albion|BHA
chelsea|Chelsea|CHE
coventry|Coventry City|COV
crystalpalace|Crystal Palace|CRY
everton|Everton|EVE
fulham|Fulham|FUL
hull|Hull City|HUL
ipswich|Ipswich Town|IPS
leeds|Leeds United|LEE
liverpool|Liverpool|LIV
mancity|Manchester City|MCI
manutd|Manchester United|MUN
newcastle|Newcastle United|NEW
nottingham|Nottingham Forest|NFO
sunderland|Sunderland|SUN
tottenham|Tottenham Hotspur|TOT`),
  },
  {
    id: 'league_en_championship', name: 'EFL Championship', country: 'Inglaterra', tier: 2,
    clubs: clubs(`
birmingham|Birmingham City|BIR
blackburn|Blackburn Rovers|BLA
bolton|Bolton Wanderers|BOL
bristol_city|Bristol City|BRC
burnley|Burnley|BUR
cardiff|Cardiff City|CAR
charlton|Charlton Athletic|CHA
derby|Derby County|DER
lincoln|Lincoln City|LIN
middlesbrough|Middlesbrough|MID
millwall|Millwall|MIL
norwich|Norwich City|NOR
portsmouth|Portsmouth|POR
preston|Preston North End|PRE
qpr|Queens Park Rangers|QPR
sheffield_utd|Sheffield United|SHU
southampton|Southampton|SOU
stoke|Stoke City|STO
swansea|Swansea City|SWA
watford|Watford|WAT
westbrom|West Bromwich Albion|WBA
westham|West Ham United|WHU
wolves|Wolverhampton Wanderers|WOL
wrexham|Wrexham|WRE`),
  },
  {
    id: 'league_it_seriea', name: 'Serie A', country: 'Italia', tier: 1,
    clubs: clubs(`
acmilan|AC Milan|MIL
atalanta|Atalanta|ATA
bologna|Bologna|BOL
cagliari|Cagliari|CAG
como|Como 1907|COM
fiorentina|Fiorentina|FIO
frosinone|Frosinone|FRO
genoa|Genoa|GEN
inter|Inter de Milán|INT
juventus|Juventus|JUV
lazio|Lazio|LAZ
lecce|Lecce|LEC
monza|Monza|MON
napoli|Napoli|NAP
parma|Parma|PAR
roma|AS Roma|ROM
sassuolo|Sassuolo|SAS
torino|Torino|TOR
udinese|Udinese|UDI
venezia|Venezia|VEN`),
  },
  {
    id: 'league_it_serieb', name: 'Serie B', country: 'Italia', tier: 2,
    clubs: clubs(`
arezzo|Arezzo|ARE
ascoli|Ascoli|ASC
avellino|Avellino|AVE
benevento|Benevento|BEN
carrarese|Carrarese|CAR
catanzaro|Catanzaro|CAT
cesena|Cesena|CES
cremonese|Cremonese|CRE
empoli|Empoli|EMP
verona|Hellas Verona|VER
juvestabia|Juve Stabia|JST
vicenza|L.R. Vicenza|VIC
mantova|Mantova|MAN
modena|Modena|MOD
padova|Padova|PAD
palermo|Palermo|PAL
pisa|Pisa|PIS
sampdoria|Sampdoria|SAM
sudtirol|Südtirol|SUD
virtusentella|Virtus Entella|ENT`),
  },
  {
    id: 'league_de_bundesliga', name: 'Bundesliga', country: 'Alemania', tier: 1,
    clubs: clubs(`
bayern|Bayern de Múnich|FCB
dortmund|Borussia Dortmund|BVB
leipzig|RB Leipzig|RBL
stuttgart|VfB Stuttgart|VFB
hoffenheim|TSG Hoffenheim|TSG
leverkusen|Bayer Leverkusen|B04
freiburg|SC Freiburg|SCF
frankfurt|Eintracht Frankfurt|SGE
augsburg|FC Augsburg|FCA
mainz|Mainz 05|M05
unionberlin|Union Berlin|FCU
monchengladbach|Borussia Mönchengladbach|BMG
hamburg|Hamburger SV|HSV
koln|1. FC Köln|KOE
werder|Werder Bremen|SVW
schalke|Schalke 04|S04
elversberg|SV Elversberg|ELV
paderborn|SC Paderborn 07|PAD`),
  },
  {
    id: 'league_de_zweite', name: '2. Bundesliga', country: 'Alemania', tier: 2,
    clubs: clubs(`
wolfsburg|VfL Wolfsburg|WOB
heidenheim|1. FC Heidenheim|FCH
stpauli|FC St. Pauli|STP
hannover|Hannover 96|H96
darmstadt|SV Darmstadt 98|D98
kaiserslautern|1. FC Kaiserslautern|FCK
hertha|Hertha BSC|BSC
nurnberg|1. FC Nürnberg|FCN
bochum|VfL Bochum|BOC
karlsruhe|Karlsruher SC|KSC
dresden|Dynamo Dresden|SGD
holsteinkiel|Holstein Kiel|KIE
bielefeld|Arminia Bielefeld|DSC
magdeburg|1. FC Magdeburg|FCM
braunschweig|Eintracht Braunschweig|EBS
greutherfurth|Greuther Fürth|FUR
cottbus|Energie Cottbus|COT
osnabruck|VfL Osnabrück|OSN`),
  },
  {
    id: 'league_fr_ligue1', name: 'Ligue 1', country: 'Francia', tier: 1,
    clubs: clubs(`
angers|Angers SCO|ANG
auxerre|AJ Auxerre|AUX
monaco|AS Monaco|ASM
brest|Stade Brestois|BRE
lorient|FC Lorient|LOR
lehavre|Le Havre AC|HAC
lille|Lille OSC|LIL
nice|OGC Nice|NCE
lyon|Olympique Lyonnais|OL
marseille|Olympique de Marseille|OM
parisfc|Paris FC|PFC
psg|Paris Saint-Germain|PSG
lens|RC Lens|RCL
rennes|Stade Rennais|REN
strasbourg|RC Strasbourg|STR
toulouse|Toulouse FC|TOU
lemans|Le Mans FC|LEM
troyes|ESTAC Troyes|TRO`),
  },
  {
    id: 'league_fr_ligue2', name: 'Ligue 2', country: 'Francia', tier: 2,
    clubs: clubs(`
saintetienne|AS Saint-Étienne|ASSE
boulogne|US Boulogne|BOU
clermont|Clermont Foot|CLE
dunkerque|USL Dunkerque|DUN
guingamp|EA Guingamp|GUI
annecy|FC Annecy|ANN
grenoble|Grenoble Foot 38|GRE
laval|Stade Lavallois|LAV
montpellier|Montpellier HSC|MHS
nancy|AS Nancy Lorraine|NAN
pau|Pau FC|PAU
redstar|Red Star FC|RED
reims|Stade de Reims|REI
rodez|Rodez AF|ROD
metz|FC Metz|MET
nantes|FC Nantes|NAN
dijon|Dijon FCO|DIJ
sochaux|FC Sochaux|SOC`),
  },
  {
    id: 'league_pt_primeira', name: 'Liga Portugal Betclic', country: 'Portugal', tier: 1,
    clubs: clubs(`
porto|FC Porto|FCP
benfica|SL Benfica|BEN
sportingcp|Sporting CP|SCP
santaclara|Santa Clara|STA
arouca|FC Arouca|ARO
academico_viseu|Académico de Viseu|ACV
alverca|FC Alverca|ALV
gilvicente|Gil Vicente FC|GV
braga|SC Braga|BRA
estrela|Estrela da Amadora|EST
moreirense|Moreirense FC|MOR
maritimo|CS Marítimo|MAR
famalicao|FC Famalicão|FAM
rioave|Rio Ave FC|RA
guimaraes|Vitória SC|GUI
nacional|CD Nacional|NAC
casapia|Casa Pia AC|CAS
estoril|GD Estoril Praia|ESTP`),
  },
  {
    id: 'league_pt_segunda', name: 'Liga Portugal 2 Meu Super', country: 'Portugal', tier: 2,
    clubs: clubs(`
lourosa|Lusitânia de Lourosa FC|LOU
sporting_b|Sporting CP B|SCPB
penafiel|FC Penafiel|PEN
academica|Académica de Coimbra|ACA
farense|SC Farense|FAR
benfica_b|SL Benfica B|BENB
afs|AVS Futebol SAD|AFS
tondela|CD Tondela|TON
vizela|FC Vizela|VIZ
uniao_leiria|UD Leiria|LEI
leixoes|Leixões SC|LEI
portimonense|Portimonense|POR
torreense|SCU Torreense|TOR
chaves|GD Chaves|CHA
porto_b|FC Porto B|FCPB
felgueiras|FC Felgueiras|FEL
amarante|Amarante FC|AMA
feirense|CD Feirense|FEI`),
  },
  {
    id: 'league_nl_eredivisie', name: 'Eredivisie', country: 'Países Bajos', tier: 1,
    clubs: clubs(`
denhaag|ADO Den Haag|ADO
ajax|AFC Ajax|AJA
az|AZ Alkmaar|AZ
excelsior|Excelsior Rotterdam|EXC
groningen|FC Groningen|GRO
twente|FC Twente|TWE
utrecht|FC Utrecht|UTR
feyenoord|Feyenoord|FEY
fortuna|Fortuna Sittard|FOR
goahead|Go Ahead Eagles|GAE
nec|N.E.C. Nijmegen|NEC
zwolle|PEC Zwolle|ZWO
psv|PSV Eindhoven|PSV
cambuur|SC Cambuur|CAM
heerenveen|SC Heerenveen|HEE
sparta|Sparta Rotterdam|SPA
telstar|Telstar|TEL
willemii|Willem II|WIL`),
  },
  {
    id: 'league_nl_eerste', name: 'Keuken Kampioen Divisie', country: 'Países Bajos', tier: 2,
    clubs: clubs(`
almere|Almere City FC|ALM
graafschap|De Graafschap|GRA
denbosch|FC Den Bosch|DBO
dordrecht|FC Dordrecht|DOR
eindhoven|FC Eindhoven|EIN
emmen|FC Emmen|EMM
volendam|FC Volendam|VOL
helmond|Helmond Sport|HEL
heracles|Heracles Almelo|HER
jong_ajax|Jong Ajax|AJB
jong_az|Jong AZ|AZB
jong_utrecht|Jong FC Utrecht|UTB
jong_psv|Jong PSV|PSVB
mvv|MVV Maastricht|MVV
nac|NAC Breda|NAC
rkc|RKC Waalwijk|RKC
roda|Roda JC Kerkrade|ROD
oss|TOP Oss|OSS
vitesse|Vitesse|VIT
vvv|VVV-Venlo|VVV`),
  },
];

// Los filiales juegan su propia competición, pero no deben ascender a una
// categoría en la que ya participe su primer equipo.
export const AFFILIATE_PARENT_IDS = Object.freeze({
  celta_fortuna: 'celta',
  realsociedad_b: 'realsociedad',
  sporting_b: 'sportingcp',
  benfica_b: 'benfica',
  porto_b: 'porto',
  jong_ajax: 'ajax',
  jong_az: 'az',
  jong_utrecht: 'utrecht',
  jong_psv: 'psv',
});
