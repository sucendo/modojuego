/*
* chatbotPedia.js
* By Sucendo 2024-2025
*/

"use strict";

/* ------------------- ENCICLOPEDIA (MODO TEXTO, SIN CACHÉ) ---------------------- */

/** fetchJSON con timeout y cancelación */
async function fetchJSON(url, options = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const { signal: extSig, ...rest } = options;
  const onAbort = () => ctrl.abort();
  if (extSig) extSig.addEventListener("abort", onAbort, { once: true });

  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
    if (extSig) extSig.removeEventListener("abort", onAbort);
  }
}

/** fetchText (HTML Parsoid) con timeout y cancelación */
async function fetchText(url, options = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const { signal: extSig, ...rest } = options;
  const onAbort = () => ctrl.abort();
  if (extSig) extSig.addEventListener("abort", onAbort, { once: true });

  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
    if (extSig) extSig.removeEventListener("abort", onAbort);
  }
}

/* ---------- Utilidades internas ---------- */

function getPrefsLang() {
  try {
    const prefs = (window.Chatmu && Chatmu.memoria && Chatmu.memoria.obtenerPrefs && Chatmu.memoria.obtenerPrefs()) || {};
    return (prefs.lang || localStorage.getItem("chatbot_lang") || "es").split("-")[0];
  } catch { return "es"; }
}

function recortarFrases(txt, maxFrases = 3) {
  const clean = String(txt || "").trim();
  if (!clean) return clean;
  const partes = (clean.match(/[^.!?]+[.!?]?/g) || []).slice(0, maxFrases).join(" ");
  return partes.trim();
}

function limpiarSnippet(html) {
  return String(html || "")
    .replace(/<\/?span[^>]*>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function limpiarTexto(s) {
  return String(s || "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAccents(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N");
}

function extraerNumeroYAnio(texto) {
  const s = limpiarTexto(texto);
  const nums = (s.match(/(?:\d{1,3}(?:[.\u00A0 ]\d{3})+|\d{2,})/g) || [])
    .map(x => Number(x.replace(/[.\u00A0 ]/g, "")))
    .filter(n => Number.isFinite(n) && n >= 0 && n < 2e12);
  const years = (s.match(/(?:1[5-9]\d{2}|20\d{2})/g) || []).map(y => parseInt(y, 10));
  return {
    num: nums.length ? Math.max(...nums) : null,
    year: years.length ? Math.max(...years) : null
  };
}

function uniqList(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr.map(v => v && v.trim()).filter(Boolean)) {
    const k = x.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(x); }
  }
  return out;
}

function langCycle(l) { return [l || "es", ...(l !== "es" ? ["es"] : []), "en"]; }

const API  = (l) => `https://${l}.wikipedia.org/w/api.php`;
const REST = (l) => `https://${l}.wikipedia.org/api/rest_v1`;

/* ---------- Filtro y construcción de sugerencias (texto) ---------- */

function esTituloSugerenciaValido(t, q) {
  const tlc = String(t || "").toLowerCase().trim();
  const qlc = String(q || "").toLowerCase().trim();
  if (/^(anexo|categoría|portal|ayuda|wikipedia|plantilla|módulo|archivo):/i.test(t)) return false;
  if (tlc === qlc) return false;
  const relevante =
    tlc.startsWith(qlc) ||
    tlc.includes(`${qlc} (`) ||
    tlc.endsWith(` de ${qlc}`) || tlc.endsWith(` del ${qlc}`) ||
    tlc.endsWith(` de la ${qlc}`) || tlc.endsWith(` de los ${qlc}`) ||
    tlc.endsWith(` de las ${qlc}`);
  if (!relevante) return false;
  if (/^(provincia|municipio|comarca|ente|administración|demografía)\b/i.test(t)) return false;
  return true;
}

function construirListaSugerenciasTexto(results, tituloPrincipal, q) {
  const items = results
    .filter(r => r.title.toLowerCase() !== String(tituloPrincipal || "").toLowerCase())
    .filter(r => esTituloSugerenciaValido(r.title, q))
    .slice(0, 5)
    .map(r => {
      const sn = limpiarSnippet(r.snippet || "");
      return sn ? `- ${r.title} — ${sn}` : `- ${r.title}`;
    });
  return items.length ? `\n\n¿Querías decir?\n${items.join("\n")}\n\nEscribe: Buscar <término exacto>` : "";
}

/* ---------- Debounce y cancelación ---------- */

let _debTimer;
let _wikiAbort;

async function buscarYMostrar(q) {
  clearTimeout(_debTimer);
  _debTimer = setTimeout(async () => {
    const r = await window.buscarEnWikipedia(q);
    try { mostrarMensaje("Robot", r, { html: false }); } catch { mostrarMensaje("Robot", r); }
  }, 200);
}

/* ---------- Scraping Parsoid: helpers ---------- */

async function obtenerDocHTML(title, lang, SIG) {
  const html = await fetchText(REST(lang) + "/page/html/" + encodeURIComponent(title), SIG);
  const dp = new DOMParser();
  return dp.parseFromString(html, "text/html");
}

function extraerCeldaInfobox(doc, clavesRegex) {
  const rows = doc.querySelectorAll(".infobox tr");
  for (const tr of rows) {
    const th = tr.querySelector("th, .infobox-label");
    if (!th) continue;
    const label = limpiarTexto(th.textContent).toLowerCase();
    if (clavesRegex.test(label)) {
      const td = tr.querySelector("td, .infobox-data");
      if (td) return td;
    }
  }
  return null;
}

function extraerCeldaInfoboxGenerico(doc, campo, aliasRxList = []) {
  const rows = doc.querySelectorAll(".infobox tr");
  const campoNorm = stripAccents(campo).toLowerCase();
  for (const tr of rows) {
    const th = tr.querySelector("th, .infobox-label");
    if (!th) continue;
    const labelText = limpiarTexto(th.textContent);
    const labelNorm = stripAccents(labelText).toLowerCase();
    const regexHit = aliasRxList.some(rx => rx.test(labelText));
    if (regexHit || labelNorm.includes(campoNorm)) {
      const td = tr.querySelector("td, .infobox-data");
      if (td) return { td, label: labelText };
    }
  }
  return null;
}

// Captura texto “limpio” de una celda (prioriza anchors)
function textoDeCelda(td) {
  if (!td) return "";
  const anchors = Array.from(td.querySelectorAll('a[href^="/wiki/"]')).map(a => limpiarTexto(a.textContent));
  const joined = uniqList(anchors).join(", ");
  const fallback = limpiarTexto(td.textContent || "");
  return joined || fallback;
}

// Extrae primer número de una celda (permite miles y decimales)
function numeroDeCelda(td) {
  if (!td) return null;
  const s = limpiarTexto(td.textContent || "");
  const m = s.match(/(\d{1,3}(?:[.\u00A0 ]\d{3})+|\d+)(?:[.,](\d+))?/);
  if (!m) return null;
  const int = m[1].replace(/[.\u00A0 ]/g, "");
  const dec = m[2] ? "." + m[2] : "";
  const n = Number(int + dec);
  return Number.isFinite(n) ? n : null;
}

/* ---------- Extractores específicos (ya existentes) ---------- */

// Población / habitantes
function extraerPoblacionDeDoc(doc) {
  const celda = extraerCeldaInfobox(doc, /(poblaci[oó]n|habitantes)/i);
  if (celda) {
    const { num, year } = extraerNumeroYAnio(celda.textContent);
    if (num) return { num, year, via: "infobox" };
  }
  const paras = Array.from(doc.querySelectorAll("p, li")).slice(0, 40);
  for (const el of paras) {
    const t = el.textContent || "";
    if (/(poblaci[oó]n|habitantes)/i.test(t)) {
      const { num, year } = extraerNumeroYAnio(t);
      if (num) return { num, year, via: "texto" };
    }
  }
  return null;
}

// Hijos / descendencia
function extraerHijosDeDoc(doc) {
  const celda = extraerCeldaInfobox(doc, /(hijos|descendencia)/i);
  if (celda) {
    const a = Array.from(celda.querySelectorAll('a[href^="/wiki/"]')).map(n => n.textContent);
    let lista = uniqList(a);
    if (!lista.length) lista = uniqList(limpiarTexto(celda.textContent).split(/[•·;,\(\)]/));
    if (lista.length) return { hijos: lista, via: "infobox" };
  }
  const heads = Array.from(doc.querySelectorAll("h2, h3"));
  const rx = /(descendencia|familia|matrimonio y descendencia)/i;
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    const txt = limpiarTexto(h.textContent || "");
    if (!rx.test(txt)) continue;
    const items = [];
    let sib = h.nextElementSibling;
    while (sib && !/^H[23]$/.test(sib.tagName)) {
      if (sib.matches("ul, ol")) items.push(...Array.from(sib.querySelectorAll("li a[href^='/wiki/']")).map(n => n.textContent));
      sib = sib.nextElementSibling;
    }
    const lista = uniqList(items);
    if (lista.length) return { hijos: lista, via: "seccion" };
  }
  return null;
}

// Año de nacimiento / muerte / evento; duración; conteos; etc.
function extraerAnioNacimiento(doc) {
  const celda = extraerCeldaInfobox(doc, /(nacimiento|fecha de nacimiento)/i);
  if (celda) { const m = (celda.textContent || "").match(/(1[5-9]\d{2}|20\d{2})/); if (m) return { year: +m[1], via: "infobox" }; }
  const p = Array.from(doc.querySelectorAll("p")).slice(0, 30);
  for (const el of p) { const t = el.textContent || ""; const m = t.match(/naci[oó]\w*.*?(1[5-9]\d{2}|20\d{2})/i); if (m) return { year: +m[1], via: "texto" }; }
  return null;
}
function extraerAnioMuerte(doc) {
  const celda = extraerCeldaInfobox(doc, /(fallecimiento|defunci[oó]n|muerte|fecha de fallecimiento)/i);
  if (celda) { const m = (celda.textContent || "").match(/(1[5-9]\d{2}|20\d{2})/); if (m) return { year: +m[1], via: "infobox" }; }
  const p = Array.from(doc.querySelectorAll("p")).slice(0, 30);
  for (const el of p) { const t = el.textContent || ""; const m = t.match(/(mur[ií]o|falleci[oó]).*?(1[5-9]\d{2}|20\d{2})/i); if (m) return { year: +(m[2]||m[1]), via: "texto" }; }
  return null;
}
function extraerAnioEvento(doc) {
  const celda = extraerCeldaInfobox(doc, /(fecha|fechas)/i);
  if (celda) { const m = (celda.textContent || "").match(/(1[5-9]\d{2}|20\d{2})/); if (m) return { year: +m[1], via: "infobox" }; }
  const p = Array.from(doc.querySelectorAll("p")).slice(0, 20);
  for (const el of p) { const m = (el.textContent || "").match(/(?:en\s+)?(1[5-9]\d{2}|20\d{2})/); if (m) return { year: +m[1], via: "texto" }; }
  return null;
}
function extraerDuracionAnios(doc) {
  const text = doc.body ? doc.body.textContent || "" : "";
  const m = text.match(/(?:de\s+)?(1[5-9]\d{2}|20\d{2})\s*(?:–|-|—|\ba\b|hasta|al)\s*(1[5-9]\d{2}|20\d{2})/i);
  if (m) { const a1 = +m[1], a2 = +m[2]; if (a2 >= a1) return { years: a2 - a1, from: a1, to: a2, via: "rango" }; }
  const ini = extraerCeldaInfobox(doc, /(inicio|comienzo|fundaci[oó]n|apertura|primer[a-o]\s+emisi[oó]n|periodo|fechas)/i);
  const fin = extraerCeldaInfobox(doc, /(fin|final|disoluci[oó]n|cierre|[uú]ltim[ao]\s+emisi[oó]n|fechas)/i);
  const y1 = ini ? (ini.textContent || "").match(/(1[5-9]\d{2}|20\d{2})/) : null;
  const y2 = fin ? (fin.textContent || "").match(/(1[5-9]\d{2}|20\d{2})/) : null;
  if (y1 && y2) { const a1 = +y1[1], a2 = +y2[1]; if (a2 >= a1) return { years: a2 - a1, from: a1, to: a2, via: "infobox" }; }
  return null;
}
function extraerConteoPorClave(doc, rxPalabra) {
  const celda = extraerCeldaInfobox(doc, rxPalabra);
  if (celda) { const { num } = extraerNumeroYAnio(celda.textContent); if (Number.isFinite(num)) return { num, via: "infobox" }; }
  const texto = limpiarTexto(doc.body ? doc.body.textContent || "" : "");
  const m = texto.match(new RegExp(`(\\d{1,6})\\s+${rxPalabra.source}`, "i"));
  if (m) { const n = parseInt(m[1], 10); if (Number.isFinite(n)) return { num: n, via: "texto" }; }
  return null;
}
function textoDeCampo(doc, rxLabel) {
  const td = extraerCeldaInfobox(doc, rxLabel);
  const val = textoDeCelda(td);
  return val ? { text: val, via: "infobox" } : null;
}
function extraerSuperficie(doc) { const td = extraerCeldaInfobox(doc, /(superficie)/i); const n = numeroDeCelda(td); return (n==null)?null:{ km2:n, via:"infobox" }; }
function extraerAltitud(doc) { const td = extraerCeldaInfobox(doc, /(altitud|elevaci[oó]n)/i); const n = numeroDeCelda(td); return (n==null)?null:{ m:n, via:"infobox" }; }
function extraerEdad(doc) {
  const nac = extraerCeldaInfobox(doc, /(nacimiento|fecha de nacimiento)/i);
  if (!nac) return null;
  const muer = extraerCeldaInfobox(doc, /(fallecimiento|defunci[oó]n|muerte|fecha de fallecimiento)/i);
  const birthYear = (nac.textContent || "").match(/(1[5-9]\d{2}|20\d{2})/); if (!birthYear) return null;
  const by = +birthYear[1];
  let refYear = null;
  if (muer) { const dy = (muer.textContent || "").match(/(1[5-9]\d{2}|20\d{2})/); if (dy) refYear = +dy[1]; }
  if (!refYear) refYear = new Date().getFullYear();
  return { age: Math.max(0, refYear - by), refYear, via: muer ? "infobox (edad al morir)" : "infobox (edad actual aprox.)" };
}

/* ---------- Diccionario de alias para el extractor genérico ---------- */

const FIELD_ALIASES = {
  capital:        [/(^|\b)capital(?!izaci[oó]n)\b/i, /\bseat of government\b/i],
  poblacion:      [/(poblaci[oó]n|habitantes)/i],
  superficie:     [/(superficie|área|area\b)/i],
  altitud:        [/(altitud|altura|elevaci[oó]n|msnm)/i],
  gentilicio:     [/(gentilicio)/i],
  moneda:         [/(moneda|divisa|currency)/i],
  idiomas:        [/(idioma(?:s)?\s*oficial(?:es)?|lenguas?\s*oficial(?:es)?|official\s+languages?)/i],
  pib:            [/\bpib(?!\s*per\s*c[aá]pita)\b/i, /gdp\b/i],
  pib_pc:         [/(pib\s*per\s*c[aá]pita|renta\s*per\s*c[aá]pita|gdp\s*per\s*capita)/i],
  fundacion:      [/(fundaci[oó]n|fundado\s*en|fundada\s*en|establecid[ao]|creaci[oó]n)/i],
  independencia:  [/(independencia|declaraci[oó]n\s+de\s+independencia)/i],
  lema:           [/(^|\b)lema\b|motto\b/i],
  forma_gob:      [/(forma\s+de\s+gobierno|tipo\s+de\s+gobierno|r[eé]gimen|system of government)/i],
  presidente:     [/(presidente|jefe\s+de\s+estado|presidencia|president\b)/i],
  monarca:        [/(monarca|rey|reina|soberano|monarch)/i],
  alcalde:        [/(alcalde|alcaldesa|mayor\b)/i],
  coordenadas:    [/(coordenadas|coordinates)/i],
  densidad:       [/(densidad\s+de\s+poblaci[oó]n|densidad|density)/i],
  codigo_postal:  [/(c[oó]digo\s+postal|postal\s+code)/i],
  prefijo_tel:    [/(prefijo\s+telef[oó]nico|tel[eé]fono|dialing\s+code|calling\s+code)/i],
  iso:            [/(c[oó]digo\s+iso|iso\s*code)/i],
  fundador:       [/(fundador(?:a)?s?|fundadores|founder(?:s)?)/i],
  autor:          [/(autor(?:a)?s?|autores|author(?:s)?)/i],
  editor:         [/(editor(?:a)?s?|editores|publisher)/i]
};

function canonicalCampo(campoRaw) {
  const c = stripAccents(campoRaw).toLowerCase().trim();
  if (/^habitantes?$|^poblaci/.test(c)) return "poblacion";
  if (/^hijos?$|^descendencia$/.test(c)) return "hijos";
  if (/^capital$/.test(c)) return "capital";
  if (/^superficie$|^area$/.test(c)) return "superficie";
  if (/^altitud$|^altura$|^elevaci/.test(c)) return "altitud";
  if (/^gentilicio$/.test(c)) return "gentilicio";
  if (/^moneda$|^divisa$/.test(c)) return "moneda";
  if (/idiomas?/.test(c)) return "idiomas";
  if (/^pib(\s|$)/.test(c)) return /\bper\s*cap/.test(c) ? "pib_pc" : "pib";
  if (/fundaci/.test(c)) return "fundacion";
  if (/independenc/.test(c)) return "independencia";
  if (/^lema$/.test(c)) return "lema";
  if (/forma.*gobierno|tipo.*gobierno|regimen/.test(c)) return "forma_gob";
  if (/^presidente|jefe.*estado/.test(c)) return "presidente";
  if (/monarca|rey|reina/.test(c)) return "monarca";
  if (/alcalde|alcaldesa|mayor/.test(c)) return "alcalde";
  if (/coordenadas|coordinates/.test(c)) return "coordenadas";
  if (/densidad/.test(c)) return "densidad";
  if (/codigo.*postal|postal.*code/.test(c)) return "codigo_postal";
  if (/prefijo.*telef|dialing|calling/.test(c)) return "prefijo_tel";
  if (/iso/.test(c)) return "iso";
  if (/fundador|founder/.test(c)) return "fundador";
  if (/autor|author/.test(c)) return "autor";
  if (/editor|publisher/.test(c)) return "editor";
  return null;
}

/* ---------- Detección de consultas específicas ---------- */

function detectarConsultaEspecifica(q) {
  const txt = String(q || "").trim();

  // Especiales ya conocidos
  const mHab = txt.match(/^(?:busca(?:r)?\s+)?(?:la\s+)?(?:poblaci[oó]n|habitantes)\s+(?:de|en)\s+(.+)$/i);
  if (mHab) return { tipo: "habitantes", sujeto: mHab[1].trim() };

  const mHijos = txt.match(/^(?:busca(?:r)?\s+)?(?:los\s+)?hijos\s+de\s+(.+)$/i);
  if (mHijos) return { tipo: "hijos", sujeto: mHijos[1].trim() };

  const mNac = txt.match(/^(?:busca(?:r)?\s+)?a[nñ]o\s+de\s+nacimiento\s+de\s+(.+)$/i);
  if (mNac) return { tipo: "anio_nacimiento", sujeto: mNac[1].trim() };

  const mMue = txt.match(/^(?:busca(?:r)?\s+)?a[nñ]o\s+(?:de\s+)?(?:la\s+)?muerte\s+de\s+(.+)$/i);
  if (mMue) return { tipo: "anio_muerte", sujeto: mMue[1].trim() };

  const mBat = txt.match(/^(?:busca(?:r)?\s+)?a[nñ]o\s+batalla\s+de\s+(.+)$/i);
  if (mBat) return { tipo: "anio_batalla", sujeto: mBat[1].trim() };

  const mDur = txt.match(/^(?:busca(?:r)?\s+)?cu[aá]ntos?\s+a[nñ]os\s+dur[oó]\s+(?:el|la|los|las)?\s*(.+)$/i);
  if (mDur) return { tipo: "duracion_anios", sujeto: mDur[1].trim() };

  const mDist = txt.match(/^(?:busca(?:r)?\s+)?(?:n[uú]mero\s+de\s+)?distritos?\s+(?:de|en)\s+(.+)$/i);
  if (mDist) return { tipo: "num_distritos", sujeto: mDist[1].trim() };
  const mMun = txt.match(/^(?:busca(?:r)?\s+)?cu[aá]ntos?\s+municipios\s+(?:hay\s+)?(?:en|de)\s+(.+)$/i);
  if (mMun) return { tipo: "num_municipios", sujeto: mMun[1].trim() };

  // Intentos ampliados (capital, superficie, etc.) ya cubiertos por canonicalCampo en el genérico

  // GENÉRICO: "<campo> de/en <sujeto>"
  const mGen = txt.match(/^(?:busca(?:r)?\s+)?(.+?)\s+(?:de|del|de la|de los|de las|en)\s+(.+)\s*$/i);
  if (mGen) return { tipo: "dato_generico", campo: mGen[1].trim(), sujeto: mGen[2].trim() };

  return null;
}

/* ---------- Elección de título preferente al buscar ---------- */
function elegirTituloPreferente(results, q, opts = {}) {
  const qlc = String(q || "").toLowerCase();
  const exact = results.find(r => r.title.toLowerCase() === qlc);
  if (exact) return exact.title;

  const starts = results.find(r => r.title.toLowerCase().startsWith(qlc + " "));
  if (starts) return starts.title;

  if (opts.preferPrefix) {
    const pref = results.find(r => r.title.toLowerCase().startsWith(opts.preferPrefix.toLowerCase() + " "));
    if (pref) return pref.title;
  }
  return (results[0] && results[0].title) || q;
}

/* ---------- Extractor GENÉRICO de "dato de página" ---------- */

function aliasRegexListFor(campoCanonico, campoLibre) {
  if (campoCanonico && FIELD_ALIASES[campoCanonico]) return FIELD_ALIASES[campoCanonico];
  // Si no hay canónico, intenta con la frase del usuario (acento-insensible, espacios flexibles)
  const raw = campoLibre.replace(/\s+/g, "\\s+");
  const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // prueba directa (se aplica sobre label original, no normalizado)
  return [new RegExp(safe, "i")];
}

function intentarConteoGenerico(doc, campo) {
  // "número de <X>" dentro del campo libre
  const m = campo.match(/n[uú]mero\s+de\s+(.+)/i) || campo.match(/cu[aá]nt[oa]s?\s+(.+)/i);
  if (!m) return null;
  const cosa = m[1].trim();
  const pal = stripAccents(cosa).split(/\s+/)[0]; // primera palabra (distritos, barrios...)
  if (!pal) return null;
  const rx = new RegExp(`${pal}s?`, "i");
  const info = extraerConteoPorClave(doc, rx);
  if (info && Number.isFinite(info.num)) return info;
  return null;
}

function extraerDatoGenerico(doc, campo) {
  const canon = canonicalCampo(campo);
  const aliases = aliasRegexListFor(canon, campo);

  // Si es un campo conocido, delega a extractores "buenos"
  if (canon === "poblacion") {
    const r = extraerPoblacionDeDoc(doc);
    if (r) return { text: r.year ? `${new Intl.NumberFormat("es-ES").format(r.num)} (año ${r.year})` : `${new Intl.NumberFormat("es-ES").format(r.num)}`, via: r.via };
  }
  if (canon === "superficie") {
    const r = extraerSuperficie(doc);
    if (r) return { text: `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(r.km2)} km²`, via: r.via };
  }
  if (canon === "altitud") {
    const r = extraerAltitud(doc);
    if (r) return { text: `${new Intl.NumberFormat("es-ES").format(r.m)} m`, via: r.via };
  }
  if (canon === "gentilicio" || canon === "moneda" || canon === "idiomas" || canon === "lema" || canon === "forma_gob" ||
      canon === "presidente" || canon === "monarca" || canon === "alcalde" || canon === "coordenadas" ||
      canon === "densidad" || canon === "codigo_postal" || canon === "prefijo_tel" || canon === "iso" ||
      canon === "fundador" || canon === "autor" || canon === "editor" || canon === "capital" || canon === "pib" || canon === "pib_pc" || canon === "independencia" || canon === "fundacion") {
    const r = textoDeCampo(doc, (FIELD_ALIASES[canon] || aliases)[0]);
    if (r) return { text: r.text, via: r.via };
  }

  // Conteo genérico si el campo sugiere "número de X"
  const ctry = intentarConteoGenerico(doc, campo);
  if (ctry) return { text: String(ctry.num), via: ctry.via };

  // Búsqueda genérica en INFOBOX con alias/substring
  const hit = extraerCeldaInfoboxGenerico(doc, campo, aliases);
  if (hit && hit.td) {
    const num = numeroDeCelda(hit.td);
    const val = textoDeCelda(hit.td);
    return { text: (num != null ? String(num) : val) || val, via: "infobox", label: hit.label };
  }

  // Fallback: primera frase del cuerpo que contenga las palabras del campo
  const terms = stripAccents(campo).toLowerCase().split(/\s+/).filter(Boolean);
  const paras = Array.from(doc.querySelectorAll("p, li")).slice(0, 60);
  for (const el of paras) {
    const tNorm = stripAccents(el.textContent || "").toLowerCase();
    if (terms.every(w => tNorm.includes(w))) {
      return { text: recortarFrases(el.textContent || "", 2), via: "texto" };
    }
  }

  return null;
}

/* ---------- Buscar dato específico (incluye genérico) ---------- */

async function buscarDatoEnArticulo(tipo, sujeto, prefLang, SIG) {
  const langs = langCycle(prefLang);
  for (const L of langs) {
    const query = (tipo === "anio_batalla" && !/^batalla de/i.test(sujeto))
      ? `Batalla de ${sujeto}` : sujeto;

    const searchUrl = API(L)
      + `?action=query&list=search&srsearch=${encodeURIComponent(query)}`
      + `&srlimit=5&srprop=snippet|wordcount&format=json&origin=*`;
    const sr = await fetchJSON(searchUrl, SIG);
    const results = sr?.query?.search || [];
    if (!results.length) continue;

    const title = elegirTituloPreferente(results, query, {
      preferPrefix: tipo === "anio_batalla" ? "Batalla de" : null
    });

    const detailUrl = API(L)
      + `?action=query&redirects=1&prop=info&titles=${encodeURIComponent(title)}`
      + `&inprop=url&formatversion=2&format=json&origin=*`;
    const pj = await fetchJSON(detailUrl, SIG);
    const page = pj?.query?.pages?.[0] || {};
    const url = page.fullurl || `https://${L}.wikipedia.org/wiki/` + encodeURIComponent(title.replace(/ /g, "_"));
    const doc = await obtenerDocHTML(title, L, SIG);

    // ---------- Switch de tipos ----------
    if (tipo === "habitantes") {
      const info = extraerPoblacionDeDoc(doc);
      if (info && info.num) {
        const fmt = new Intl.NumberFormat("es-ES");
        const cifra = fmt.format(info.num);
        const anio = info.year ? ` (año ${info.year})` : "";
        return `Habitantes de ${title}: ${cifra}${anio}.\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${info.via}`;
      }
    } else if (tipo === "hijos") {
      const info = extraerHijosDeDoc(doc);
      if (info && info.hijos && info.hijos.length) {
        const lista = info.hijos.slice(0, 20).map(n => `- ${n}`).join("\n");
        return `Hijos de ${title} (${info.hijos.length}):\n${lista}\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${info.via}`;
      }
    } else if (tipo === "anio_nacimiento") {
      const info = extraerAnioNacimiento(doc);
      if (info && info.year) return `Año de nacimiento de ${title}: ${info.year}.\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${info.via}`;
    } else if (tipo === "anio_muerte") {
      const info = extraerAnioMuerte(doc);
      if (info && info.year) return `Año de la muerte de ${title}: ${info.year}.\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${info.via}`;
    } else if (tipo === "anio_batalla") {
      const info = extraerAnioEvento(doc);
      if (info && info.year) return `Año de la batalla de ${title.replace(/^Batalla de\s+/i, "")}: ${info.year}.\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${info.via}`;
    } else if (tipo === "duracion_anios") {
      const info = extraerDuracionAnios(doc);
      if (info && Number.isFinite(info.years)) {
        const suf = (info.from && info.to) ? ` (${info.from}–${info.to})` : "";
        return `Duración aproximada de ${title}: ${info.years} años${suf}.\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${info.via}`;
      }
    } else if (tipo === "num_distritos") {
      const info = extraerConteoPorClave(doc, /(distritos?)/i);
      if (info && Number.isFinite(info.num)) return `Número de distritos de ${title}: ${info.num}.\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${info.via}`;
    } else if (tipo === "num_municipios") {
      const info = extraerConteoPorClave(doc, /(municipios?)/i);
      if (info && Number.isFinite(info.num)) return `Número de municipios de ${title}: ${info.num}.\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${info.via}`;
    } else if (tipo === "dato_generico") {
      // ^^ arreglamos: el campo va en espec.campo, pero aquí no lo tenemos; lo pasamos vía closure en wrapper (ver más abajo)
    }

    // Si llegamos aquí y no es genérico, seguimos a siguiente idioma
    // (el caso genérico real lo resolvemos en un wrapper más abajo)
  }
  return null;
}

/* ---------- Búsqueda principal (modo TEXTO) ---------- */

async function buscarEnWikipedia(consulta) {
  try {
    const q = (consulta || "").trim();
    if (!q) return "Dime qué quieres buscar.";

    if (_wikiAbort) _wikiAbort.abort();
    _wikiAbort = new AbortController();
    const SIG = { signal: _wikiAbort.signal };

    const prefLang = getPrefsLang();

    // Atajo: consultas específicas (incluye genérico)
    const espec = detectarConsultaEspecifica(q);

    // --- Wrapper para el GENÉRICO porque necesita 'campo' + 'sujeto' ---
    if (espec && espec.tipo === "dato_generico") {
      const { campo, sujeto } = espec;
      // Busca artículo de 'sujeto' y extrae 'campo'
      const langs = langCycle(prefLang);
      for (const L of langs) {
        const searchUrl = API(L)
          + `?action=query&list=search&srsearch=${encodeURIComponent(sujeto)}`
          + `&srlimit=5&srprop=snippet|wordcount&format=json&origin=*`;
        const sr = await fetchJSON(searchUrl, SIG);
        const results = sr?.query?.search || [];
        if (!results.length) continue;

        const title = elegirTituloPreferente(results, sujeto);
        const detailUrl = API(L)
          + `?action=query&redirects=1&prop=info&titles=${encodeURIComponent(title)}`
          + `&inprop=url&formatversion=2&format=json&origin=*`;
        const pj = await fetchJSON(detailUrl, SIG);
        const page = pj?.query?.pages?.[0] || {};
        const url = page.fullurl || `https://${L}.wikipedia.org/wiki/` + encodeURIComponent(title.replace(/ /g, "_"));
        const doc = await obtenerDocHTML(title, L, SIG);

        const found = extraerDatoGenerico(doc, campo);
        if (found && found.text) {
          const labelInfo = found.label ? ` (etiqueta: ${found.label})` : "";
          return `Dato «${campo}» de ${title}: ${found.text}.${labelInfo}\nMás información: ${url}\nFuente: Wikipedia (${L}) · vía ${found.via}`;
        }
        // prueba siguiente idioma
      }
      return `No pude encontrar el dato «${campo}» en el artículo de “${sujeto}”.`;
    }

    // Otros atajos especializados
    if (espec) {
      const out = await buscarDatoEnArticulo(espec.tipo, espec.sujeto, prefLang, SIG);
      if (out) return out;
      // si no, cae al flujo normal
    }

    // Flujo normal: resumen + sugerencias (texto)
    const langs = langCycle(prefLang);
    let finalOutput = null;

    for (const L of langs) {
      const searchUrl = API(L)
        + `?action=query&list=search&srsearch=${encodeURIComponent(q)}`
        + `&srlimit=5&srprop=snippet|wordcount&srinfo=suggestion&format=json&origin=*`;
      const sr = await fetchJSON(searchUrl, SIG);
      const results = sr?.query?.search || [];
      const suggestion = sr?.query?.searchinfo?.suggestion;

      if (!results.length) continue;

      const listRegex = /^(anexo:)?\s*(distritos?|barrios?|municipios?|provincias?)\s+de\s+/i;
      let title = elegirTituloPreferente(results, q);
      if (/(distritos?|barrios?|municipios?|provincias?)/i.test(q)) {
        const prefer = results.find(r => listRegex.test(r.title));
        if (prefer) title = prefer.title;
      }

      const detailUrl = API(L)
        + `?action=query&redirects=1&prop=extracts|categories|info|pageprops&titles=${encodeURIComponent(title)}`
        + `&exintro=1&explaintext=1&cllimit=50&inprop=url&formatversion=2&format=json&origin=*`;
      const pj = await fetchJSON(detailUrl, SIG);
      const page = pj?.query?.pages?.[0] || {};
      const url = page.fullurl || `https://${L}.wikipedia.org/wiki/` + encodeURIComponent(title.replace(/ /g, "_"));

      let extracto = page.extract || "";
      if (!extracto) {
        try {
          const rest = await fetchJSON(REST(L) + "/page/summary/" + encodeURIComponent(title), SIG);
          extracto = rest?.extract || "";
        } catch {}
      }
      extracto = recortarFrases(limpiarSnippet(extracto), 3);

      const isDisambig = !!(page.pageprops && (page.pageprops.disambiguation || page.pageprops.disambiguation === ""));
      const sugerenciasTxt = construirListaSugerenciasTexto(results, title, q);
      const maybe = suggestion ? `\n\nQuizá quisiste decir: ${suggestion}` : "";
      const verMas = `\nVer más resultados: https://${L}.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}&fulltext=1`;
      const idiomaNota = `\nFuente: Wikipedia (${L})`;

      let out;
      if (extracto) {
        out = `${extracto}\nMás información: ${url}`;
      } else {
        out = `Encontré la página "${title}", pero no pude leer el resumen.\nMás información: ${url}`;
      }
      if (isDisambig || sugerenciasTxt) out += sugerenciasTxt;
      out += maybe + verMas + idiomaNota;

      finalOutput = out;
      break;
    }

    if (!finalOutput) finalOutput = `No encontré resultados para "${q}".`;
    return finalOutput;

  } catch (error) {
    console.error("Error al buscar en Wikipedia:", error);
    return "Hubo un error al buscar en Wikipedia.";
  }
}

/* ---------- Exposición pública ---------- */
window.buscarEnWikipedia = buscarEnWikipedia;
