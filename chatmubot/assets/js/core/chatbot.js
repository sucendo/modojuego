/*
* chatbot.js (core)
* Estructura v3 con configuración central y dataset normalizado
* By Sucendo 2024-2026
*/

(() => {
  if (window.__CHATBOT_CORE_READY__) return;

  let nombreUsuario = localStorage.getItem("chatbot_nombreUsuario") || "";
  let RESPUESTAS = null;
  let replayingHistory = false;
  let recognition = null;

  const DEFAULTS = {
    hola: ["¡Hola! ¿Cómo puedo ayudarte?", "¡Hola! ¿Qué tal te encuentras?"],
    no_entender: [
      "Lo siento, no entiendo tu pregunta.",
      "¿Puedes reformularlo, por favor?",
      "No estoy seguro de qué estás preguntando."
    ]
  };

  const contextoConversacion = {
    palabraClave: null,
    repeticiones: 0,
    juegoIniciado: false,
    respuestaCorrecta: null,
    modo: null,
    confirm: null,
    buscaUltimo: null,
    ultimoTema: null,
    ultimoTipo: null,
    ultimaRespuestaBot: null,
    ultimaEntradaUsuario: null,
    ultimaRespuestaTs: null,
    historialTemas: [],
    calcValor: undefined,
    traducirIdioma: null,
    traducirUltima: null,
    ortoUltima: null,
    adivinanza: { usadas: [], aciertos: 0, fallos: 0, ronda: 0, activa: false, esperandoSiguiente: false },
    duelo: { usadas: [], ganados: 0, perdidos: 0, ronda: 0, intentoActual: 0, activa: false, esperandoSiguiente: false },
  };

  const idiomasSoportados = {
    español: "es",
    espanol: "es",
    es: "es",
    ingles: "en",
    inglés: "en",
    english: "en",
    en: "en",
    francés: "fr",
    frances: "fr",
    fr: "fr",
    alemán: "de",
    aleman: "de",
    de: "de",
    italiano: "it",
    it: "it",
    portugués: "pt",
    portugues: "pt",
    pt: "pt",
    catalán: "ca",
    catalan: "ca",
    ca: "ca",
  };
  window.idiomasSoportados = { español: "es", inglés: "en", francés: "fr", alemán: "de", italiano: "it", portugués: "pt", catalán: "ca" };

  const $ = (sel) => document.querySelector(sel);
  const tiene = (fn) => typeof fn === "function";

  function normalizarTexto(s = "") {
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s:\/\-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function elegirAleatoria(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function sanitizeBotHTML(html) {
    const ALLOWED = /^(EM|STRONG|B|I|U|BR|P|UL|OL|LI|CODE|PRE|A|SMALL)$/;
    const tpl = document.createElement("template");
    tpl.innerHTML = String(html);

    const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT);
    const toReplace = [];
    while (walker.nextNode()) {
      const el = walker.currentNode;
      if (!ALLOWED.test(el.tagName)) {
        toReplace.push(el);
        continue;
      }
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const val = String(attr.value || "").trim().toLowerCase();
        if (name.startsWith("on") || (name === "href" && val.startsWith("javascript:"))) {
          el.removeAttribute(attr.name);
        }
      }
      if (el.tagName === "A") {
        if (!el.hasAttribute("target")) el.setAttribute("target", "_blank");
        if (!el.hasAttribute("rel")) el.setAttribute("rel", "noopener noreferrer");
      }
    }
    toReplace.forEach((n) => n.replaceWith(document.createTextNode(n.textContent || "")));
    return tpl.innerHTML;
  }

  function sanitizeEmOnly(input) {
    const OPEN = "__EM_OPEN__";
    const CLOSE = "__EM_CLOSE__";
    let s = String(input || "");
    s = s.replace(/<\s*em\b[^>]*>/gi, OPEN).replace(/<\/\s*em\s*>/gi, CLOSE);
    s = s.replace(/<[^>]*>/g, "");
    s = escapeHTML(s);
    return s.replace(new RegExp(OPEN, "g"), "<em>").replace(new RegExp(CLOSE, "g"), "</em>");
  }

  function autoResizeTextarea() {
    const input = $("#userInput");
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  }

  function formatHora(ts = Date.now()) {
    try {
      return new Date(ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  function resumirPlano(texto, max = 220) {
    const limpio = String(texto || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!limpio) return "";
    return limpio.length <= max ? limpio : `${limpio.slice(0, max - 1)}…`;
  }

  function registrarTema(tema, tipo = "general") {
    const limpio = resumirPlano(tema, 120);
    if (!limpio) return;
    contextoConversacion.ultimoTema = limpio;
    contextoConversacion.ultimoTipo = tipo;
    contextoConversacion.historialTemas = Array.isArray(contextoConversacion.historialTemas) ? contextoConversacion.historialTemas : [];
    contextoConversacion.historialTemas.push({ tema: limpio, tipo, t: Date.now() });
    if (contextoConversacion.historialTemas.length > 12) {
      contextoConversacion.historialTemas = contextoConversacion.historialTemas.slice(-12);
    }
  }


  function leerEnVozAlta(texto) {
    const prefs = window.Chatmu?.memoria?.obtenerPrefs?.() || {};
    if (!prefs.tts || !("speechSynthesis" in window)) return;
    const limpio = String(texto || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!limpio) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(limpio);
      utterance.lang = (prefs.lang || "es").startsWith("es") ? "es-ES" : prefs.lang;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  function mostrarMensaje(actor, contenido, { html = false, persist = true, ts = Date.now() } = {}) {
    const chat = $("#chat");
    if (!chat) return;

    const wrap = document.createElement("article");
    wrap.className = `msg ${actor === "Usuario" ? "mensaje-usuario" : "mensaje-robot"}`;

    const body = document.createElement("div");
    if (actor === "Usuario") {
      if (html) body.innerHTML = sanitizeEmOnly(contenido);
      else body.textContent = contenido;
    } else {
      if (html) body.innerHTML = sanitizeBotHTML(contenido);
      else body.textContent = contenido;
    }
    body.style.whiteSpace = html ? "normal" : "pre-wrap";
    wrap.appendChild(body);

    const meta = document.createElement("small");
    meta.className = "msg-meta";
    meta.textContent = `${actor === "Usuario" ? "Tú" : "ChatmuBot"} · ${formatHora(ts)}`;
    wrap.appendChild(meta);

    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;

    if (actor === "Usuario") {
      contextoConversacion.ultimaEntradaUsuario = body.textContent.trim();
    } else {
      contextoConversacion.ultimaRespuestaBot = body.textContent.trim();
      contextoConversacion.ultimaRespuestaTs = ts;
    }

    if (persist && !replayingHistory) {
      window.Chatmu?.memoria?.add?.({ actor, contenido, html });
    }

    if (actor !== "Usuario") {
      leerEnVozAlta(html ? body.textContent : contenido);
    }
  }

  let escribiendoEl = null;
  function setEscribiendo(estado) {
    const chat = $("#chat");
    if (!chat) return;
    if (estado) {
      if (!escribiendoEl) {
        escribiendoEl = document.createElement("article");
        escribiendoEl.className = "msg mensaje-robot";
        escribiendoEl.textContent = "…";
        chat.appendChild(escribiendoEl);
      }
    } else if (escribiendoEl) {
      escribiendoEl.remove();
      escribiendoEl = null;
    }
    chat.scrollTop = chat.scrollHeight;
  }

  
async function cargarRespuestas() {
  if (RESPUESTAS) return RESPUESTAS;

  const cacheKey = "chatbot_respuestas_cache_v3";
  const rutas = [
    window.ChatmuConfig?.data?.responses,
    "data/chatmubot/chatbotrespuestas.json",
    "./data/chatmubot/chatbotrespuestas.json"
  ].filter(Boolean);

  for (const url of rutas) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const json = await r.json();
      RESPUESTAS = { ...DEFAULTS, ...(json || {}) };
      localStorage.setItem(cacheKey, JSON.stringify(RESPUESTAS));
      return RESPUESTAS;
    } catch {}
  }

  const cache = localStorage.getItem(cacheKey);
  if (cache) {
    try {
      RESPUESTAS = JSON.parse(cache);
      return RESPUESTAS;
    } catch {}
  }

  RESPUESTAS = { ...DEFAULTS };
  return RESPUESTAS;
}

  async function safeCorregirConsulta(q) {
    if (tiene(window.corregirConsulta)) {
      try { return await window.corregirConsulta(q); } catch {}
    }
    return q;
  }

  async function safeBuscarWikipedia(q) {
    if (tiene(window.buscarEnWikipedia)) {
      try { return await window.buscarEnWikipedia(q); } catch (e) { console.warn(e); }
    }
    return "La búsqueda en Wikipedia no está disponible ahora.";
  }

  async function safeTraducir(frase, idiomaDestino) {
    if (tiene(window.traducirGoogle)) {
      try { return await window.traducirGoogle(frase, idiomaDestino); } catch {}
    }
    if (tiene(window.traducirTexto)) {
      try { return await window.traducirTexto(frase, idiomaDestino); } catch {}
    }
    return "No pude traducir en este momento.";
  }

  function evalSeguro(expr) {
    let s = String(expr || "").replace(/,/g, ".").trim();
    if (s.length > 200) throw new Error("Expresión demasiado larga");
    if (!/^[\d+\-*/().\s^]+$/.test(s)) throw new Error("Expresión inválida");
    s = s.replace(/\^/g, "**");
    return Function(`"use strict"; return (${s});`)();
  }

  function sugerirClaves(textoNorm, respuestas) {
    const tokens = new Set(textoNorm.split(/\s+/).filter(Boolean));
    const candidatos = [];
    for (const clave of Object.keys(respuestas || {})) {
      if (!clave || clave === "no_entender") continue;
      const normClave = normalizarTexto(clave);
      const puntos = normClave.split(/\s+/).reduce((acc, tok) => acc + (tokens.has(tok) ? 1 : 0), 0);
      if (puntos > 0) candidatos.push({ clave, puntos });
    }
    return candidatos.sort((a, b) => b.puntos - a.puntos).slice(0, 3).map((c) => c.clave);
  }

  function helpText() {
    return [
      "Puedo ayudarte con varias cosas:",
      "- Buscar en Wikipedia: `busca Roma`, `quien es Marie Curie`, `capital de Japón`",
      "- Seguimiento de contexto: `y su capital`, `cuéntame más`, `de qué hablábamos`, `repíteme`",
      "- Matemáticas: `cuanto es 45*12`, `+5`, `/2`",
      "- Traducción: `traduce al inglés: buenos días`",
      "- Ortografía: `como se escribe cocreta`, `corrige: ola ke ase`",
      "- Juegos: `adivinanza`, `pista`, `otra`, `me rindo`, `duelo`, `siguiente`",
      "- Memoria local: `guardar color azul`, `mostrar color`, `mostrar datos`",
      "- Comandos rápidos: `/reset`, `/limpiar`, `/exportar`",
      "- Contexto: `de qué hablábamos`, `repíteme`, `resúmelo`, `háblame más de eso`",
      "También puedes usar los botones superiores para limpiar, exportar, dictar por voz o activar lectura de respuestas."
    ].join("\n");
  }

  function manejarComandosLocal(texto, tnorm) {
    if (["/reset", "/reiniciar", "resetear contexto"].includes(tnorm)) {
      Object.assign(contextoConversacion, {
        palabraClave: null,
        repeticiones: 0,
        juegoIniciado: false,
        respuestaCorrecta: null,
        modo: null,
        confirm: null,
        buscaUltimo: null,
        ultimoTema: null,
        ultimoTipo: null,
        ultimaRespuestaBot: null,
        ultimaEntradaUsuario: null,
        ultimaRespuestaTs: null,
        historialTemas: [],
    historialTemas: [],
        calcValor: undefined,
        traducirIdioma: null,
        traducirUltima: null,
        ortoUltima: null,
        adivinanza: { usadas: [], aciertos: 0, fallos: 0, ronda: 0, activa: false, esperandoSiguiente: false },
        duelo: { usadas: [], ganados: 0, perdidos: 0, ronda: 0, intentoActual: 0, activa: false, esperandoSiguiente: false },
      });
      return "He reiniciado el contexto de la conversación.";
    }

    if (["/limpiar", "limpiar chat", "borra el chat"].includes(tnorm)) {
      limpiarChat(true);
      return "He limpiado el historial del chat.";
    }

    if (["/exportar", "exporta el chat", "exportar chat"].includes(tnorm)) {
      window.Chatmu?.memoria?.exportar?.();
      return "He exportado el historial del chat en JSON.";
    }

    if (tnorm === "ayuda" || tnorm === "que puedes hacer" || tnorm === "qué puedes hacer" || tnorm === "/ayuda") {
      return helpText();
    }

    const mGuardar = texto.match(/^guardar\s+([^\s]+)\s+(.+)$/i);
    if (mGuardar) {
      const clave = normalizarTexto(mGuardar[1]).replace(/\s+/g, "_");
      const valor = mGuardar[2].trim();
      window.Chatmu?.memoria?.setDato?.(clave, valor);
      return `He guardado "${valor}" con la clave "${clave}".`;
    }

    if (/^mostrar\s+datos$/i.test(texto)) {
      const datos = window.Chatmu?.memoria?.obtenerDatos?.() || {};
      const entries = Object.entries(datos);
      if (!entries.length) return "No tienes datos guardados todavía.";
      return ["Datos guardados:", ...entries.map(([k, v]) => `- ${k}: ${v}`)].join("\n");
    }

    const mMostrar = texto.match(/^mostrar\s+([^\s]+)$/i);
    if (mMostrar) {
      const clave = normalizarTexto(mMostrar[1]).replace(/\s+/g, "_");
      const dato = window.Chatmu?.memoria?.getDato?.(clave);
      return dato ? `El dato almacenado para "${clave}" es: ${dato}` : `No he encontrado ningún dato con la clave "${clave}".`;
    }

    const mBorrar = texto.match(/^borrar\s+([^\s]+)$/i);
    if (mBorrar) {
      const clave = normalizarTexto(mBorrar[1]).replace(/\s+/g, "_");
      window.Chatmu?.memoria?.borrarDato?.(clave);
      return `He borrado la clave "${clave}".`;
    }

    if (/^(activar|encender) voz$/i.test(tnorm)) {
      setVoiceOutput(true);
      return "He activado la lectura en voz alta.";
    }
    if (/^(desactivar|apagar) voz$/i.test(tnorm)) {
      setVoiceOutput(false);
      return "He desactivado la lectura en voz alta.";
    }

    return null;
  }

  async function resolverIntents(textoOriginal) {
    const respuestas = await cargarRespuestas();
    const texto = String(textoOriginal || "").trim();
    const tnorm = normalizarTexto(texto);
    const palabras = tnorm.split(" ").filter(Boolean);

    const cmd = manejarComandosLocal(texto, tnorm);
    if (cmd) return cmd;

    if (tiene(window.manejarContextoConversacion)) {
      try {
        const rctx = window.manejarContextoConversacion(contextoConversacion, texto, tnorm, palabras, respuestas);
        if (typeof rctx === "string" && rctx.trim()) return rctx;
      } catch (e) {
        console.warn("Contexto conversacional no disponible:", e);
      }
    }


    if (contextoConversacion.ultimoTema && /^(y eso|y eso que es|que significa eso|qué significa eso|hablame mas de eso|háblame más de eso)$/i.test(tnorm)) {
      return await safeBuscarWikipedia(contextoConversacion.ultimoTema);
    }

    if ((tnorm.includes("me llamo ") || tnorm.startsWith("soy ")) && !tnorm.startsWith("soy una") && !tnorm.startsWith("soy un")) {
      const tokens = texto.split(/\s+/);
      const idx = tokens.findIndex((p) => /^(llamo|soy)$/i.test(p));
      if (idx !== -1 && idx < tokens.length - 1) {
        const nuevo = tokens[idx + 1].replace(/[^\p{L}\p{N}\-_]/gu, "");
        if (nuevo) {
          nombreUsuario = nuevo;
          localStorage.setItem("chatbot_nombreUsuario", nombreUsuario);
          registrarTema(nuevo, "nombre_usuario");
          return `Encantado de conocerte, ${nombreUsuario}.`;
        }
      }
    }

    if (tnorm.includes("como me llamo") || tnorm.includes("como me llamo?")) {
      return nombreUsuario ? `Te llamas ${nombreUsuario}.` : "Aún no me has dicho tu nombre.";
    }

    if (/\b(hora)\b/i.test(tnorm)) {
      return `La hora actual es ${tiene(window.calcularHoraActual) ? window.calcularHoraActual() : new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}.`;
    }

    if (tnorm.includes("es hoy")) {
      return tiene(window.calcularDiaHoy) ? window.calcularDiaHoy(texto) : `Hoy es ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
    }

    if (tnorm.includes("queda")) {
      return tiene(window.calcularTiempoRestante) ? window.calcularTiempoRestante(texto) : "No se proporcionó una fecha y hora válidas.";
    }

    if (tnorm.includes("buenos dias") || tnorm.includes("buenas tardes") || tnorm.includes("buenas noches")) {
      return tiene(window.saludoDia) ? window.saludoDia(texto) : "¡Hola!";
    }

    const adivinanzaEnCurso = contextoConversacion.palabraClave === "adivinanza" && (contextoConversacion.adivinanza?.activa || contextoConversacion.adivinanza?.esperandoSiguiente);
    if (adivinanzaEnCurso && tiene(window.manejarAdivinanza)) {
      try { return window.manejarAdivinanza(contextoConversacion, texto, respuestas); } catch {}
    }

    const dueloEnCurso = contextoConversacion.palabraClave === "duelo" && (contextoConversacion.duelo?.activa || contextoConversacion.duelo?.esperandoSiguiente);
    if (dueloEnCurso && tiene(window.manejarRespuestaInsulto)) {
      try { return window.manejarRespuestaInsulto(contextoConversacion, texto, respuestas); } catch {}
    }

    const esOperacionRelativa = /^\s*[+\-*/]\s*[\d.,]+\s*$/.test(texto);
    if (tnorm.includes("cuanto es") || tnorm.includes("calcula") || esOperacionRelativa) {
      if (esOperacionRelativa && typeof contextoConversacion.calcValor === "number") {
        const rel = texto.match(/^\s*([+\-*/])\s*([\d.,]+)\s*$/);
        const b = Number(rel[2].replace(/,/g, "."));
        let r = contextoConversacion.calcValor;
        if (rel[1] === "+") r += b;
        if (rel[1] === "-") r -= b;
        if (rel[1] === "*") r *= b;
        if (rel[1] === "/") r = b === 0 ? NaN : r / b;
        if (!Number.isFinite(r)) return "No se puede dividir por cero.";
        contextoConversacion.calcValor = r;
        contextoConversacion.modo = "calc";
        return `El resultado es ${r}`;
      }

      const expresionMatematicaOriginal = texto
        .replace(/^(?:\s*(?:cuanto\s+es|calcula)\s*)/i, "")
        .replace(/[?¡!]/g, "")
        .trim();
      try {
        let resultado;
        if (typeof math !== "undefined" && typeof math.evaluate === "function") {
          resultado = math.evaluate(expresionMatematicaOriginal.replace(/,/g, "."));
        } else {
          resultado = evalSeguro(expresionMatematicaOriginal);
        }
        contextoConversacion.modo = "calc";
        contextoConversacion.calcValor = Number(resultado);
        registrarTema(expresionMatematicaOriginal, "calculo");
        return `El resultado es ${resultado}`;
      } catch {
        return "No pude resolver la operación matemática.";
      }
    }

    if (tnorm.includes("adivinanza")) {
      contextoConversacion.palabraClave = "adivinanza";
      contextoConversacion.ultimoTipo = "juego_adivinanza";
      if (tiene(window.iniciarAdivinanza)) {
        try { return window.iniciarAdivinanza(contextoConversacion, respuestas); } catch {}
      }
    }

    if (tnorm.includes("duelo")) {
      contextoConversacion.palabraClave = "duelo";
      contextoConversacion.ultimoTipo = "juego_duelo";
      if (tiene(window.iniciarDueloDeInsultos)) {
        try { return window.iniciarDueloDeInsultos(contextoConversacion, respuestas); } catch {}
      }
    }

    if (contextoConversacion.buscaUltimo && /^(y\s+)?(su\s+)?(capital|poblacion|población|superficie|altitud|gentilicio|idioma|idiomas|moneda|historia|fundacion|fundación)\b/i.test(tnorm)) {
      const campo = texto.replace(/^(y\s+)?(su\s+)?/i, "").trim();
      const resultado = await safeBuscarWikipedia(`${campo} de ${contextoConversacion.buscaUltimo}`);
      registrarTema(contextoConversacion.buscaUltimo, "seguimiento_busqueda");
      return resultado;
    }

    if (contextoConversacion.buscaUltimo && /^(cuentame mas|cuéntame más|amplia|explica mejor|más detalles|mas detalles)$/i.test(tnorm)) {
      registrarTema(contextoConversacion.buscaUltimo, "ampliacion_busqueda");
      return await safeBuscarWikipedia(contextoConversacion.buscaUltimo);
    }

    if (/\b(busca|que es|quien es)\b/i.test(tnorm)) {
      const consulta = texto.replace(/^\s*(busca|Busca|que es|Que es|quien es|Quien es)\s*/i, "").trim();
      if (!consulta) return "Por favor, proporciona algo para buscar en Wikipedia.";
      const cor = await safeCorregirConsulta(consulta);
      contextoConversacion.modo = "busca";
      contextoConversacion.buscaUltimo = cor;
      registrarTema(cor, "busqueda_wiki");
      const resultado = await safeBuscarWikipedia(cor);
      return `Esto es lo que encontré sobre "${cor}":
${resultado}`;
    }

    if (/^corrige\s*:/i.test(texto) || tnorm.startsWith("como se escribe")) {
      const q = texto.replace(/^corrige\s*:/i, "").replace(/como se escribe/i, "").replace(/^\s*[:;,.-]+\s*/, "").trim();
      if (!q) return "Dime la palabra o frase que quieres revisar.";
      contextoConversacion.modo = "ortografia";
      contextoConversacion.ortoUltima = q;
      registrarTema(q, "ortografia");
      if (tiene(window.corregirTexto)) {
        try {
          const { corregidoSimple } = await window.corregirTexto(q);
          return `Se escribe así: ${corregidoSimple}`;
        } catch {}
      }
      return `Se escribe de la siguiente manera ${q}`;
    }

    if (contextoConversacion.modo === "ortografia") {
      const mO = texto.match(/^\s*(?:ahora|y\s+ahora|y)?\s*(.+)$/i);
      if (mO && mO[1] && mO[1].trim()) {
        const q2 = mO[1].trim();
        if (tiene(window.corregirTexto)) {
          try {
            const { corregidoSimple } = await window.corregirTexto(q2);
            contextoConversacion.ortoUltima = q2;
            return `Se escribe así: ${corregidoSimple}`;
          } catch {}
        }
      }
    }

    if (tnorm.startsWith("traduce al") || tnorm.startsWith("traduccion al")) {
      const m = texto.match(/^(traduce al|traduccion al)\s+([a-záéíóúñü]+)\s*:?\s*(.+)$/i);
      if (!m) return "Formato: traduce al <idioma>: <frase>.";
      const idiomaTexto = normalizarTexto(m[2]);
      const frase = m[3].trim();
      const code = idiomasSoportados[idiomaTexto];
      if (!code) return `Lo siento, no soporto traducciones al idioma «${m[2]}».`;
      const tr = await safeTraducir(frase, code);
      contextoConversacion.modo = "traduce";
      contextoConversacion.traducirIdioma = code;
      contextoConversacion.traducirUltima = frase;
      registrarTema(frase, "traduccion");
      return `Traducción al ${m[2]}: "${tr}"`;
    }

    if (contextoConversacion.modo === "traduce") {
      const mLang = texto.match(/^\s*(?:al|a)\s+([a-záéíóúñü]+)\s*:?\s*(.*)$/i);
      if (mLang) {
        const idiomaTexto2 = normalizarTexto(mLang[1]);
        const code2 = idiomasSoportados[idiomaTexto2];
        if (code2) {
          contextoConversacion.traducirIdioma = code2;
          const frase2 = (mLang[2] && mLang[2].trim()) ? mLang[2].trim() : (contextoConversacion.traducirUltima || "");
          if (!frase2) return `Listo, dime qué quieres traducir al ${mLang[1]}.`;
          const tr2 = await safeTraducir(frase2, code2);
          contextoConversacion.traducirUltima = frase2;
          return `Traducción al ${mLang[1]}: "${tr2}"`;
        }
      }
      const mF = texto.match(/^\s*(?:ahora|y\s+ahora|y|tambien|también)?\s*(.+)$/i);
      if (mF && mF[1] && mF[1].trim()) {
        const fraseX = mF[1].trim();
        const lang = contextoConversacion.traducirIdioma || "en";
        const trX = await safeTraducir(fraseX, lang);
        contextoConversacion.traducirUltima = fraseX;
        return `Traducción: "${trX}"`;
      }
    }

    for (const clave of Object.keys(respuestas || {})) {
      if (!clave || clave === "no_entender") continue;
      if (tnorm.includes(normalizarTexto(clave))) {
        const lista = respuestas[clave];
        if (Array.isArray(lista) && lista.length) {
          contextoConversacion.palabraClave = clave;
          contextoConversacion.repeticiones = 0;
          registrarTema(clave, "respuesta_json");
          return elegirAleatoria(lista);
        }
      }
    }

    const sugerencias = sugerirClaves(tnorm, respuestas);
    if (sugerencias.length) {
      return `No estoy seguro de haber entendido eso. Quizá querías decir: ${sugerencias.join(", ")}. También puedes escribir “ayuda”.`;
    }

    return elegirAleatoria(respuestas.no_entender || DEFAULTS.no_entender);
  }

  async function procesarEntrada(textoForzado = null) {
    const input = $("#userInput");
    const btn = $("#enviar");
    if (!input || !btn) return;

    const original = (textoForzado ?? input.value).trim();
    if (!original) return;

    let corregidoHTML = original;
    let corregidoSimple = original;
    try {
      if (tiene(window.corregirTexto)) {
        const r = await window.corregirTexto(original);
        if (r && (r.corregidoHTML || r.corregidoSimple)) {
          corregidoHTML = r.corregidoHTML || original;
          corregidoSimple = r.corregidoSimple || original;
        }
      }
    } catch {}

    mostrarMensaje("Usuario", corregidoHTML, { html: true });
    input.value = "";
    autoResizeTextarea();

    btn.disabled = true;
    setEstado("Pensando…");
    setEscribiendo(true);

    let respuesta;
    try {
      respuesta = await resolverIntents(corregidoSimple);
    } catch (e) {
      console.error(e);
      respuesta = "Ups, algo falló procesando tu mensaje.";
    } finally {
      setEscribiendo(false);
      btn.disabled = false;
      setEstado(`Listo · v${window.ChatmuConfig?.version || "3"}`);
    }

    mostrarMensaje("Robot", typeof respuesta === "string" && respuesta.trim() ? respuesta : "Lo siento, no pude generar una respuesta.");
  }

  function renderQuickActions() {
    const cont = $("#quickActions");
    if (!cont) return;
    const acciones = [
      ["Ayuda", "ayuda"],
      ["Hora", "hora"],
      ["Chiste", "chiste"],
      ["Adivinanza", "adivinanza"],
      ["Duelo", "duelo"],
      ["Busca Roma", "busca Roma"],
      ["Más contexto", "de qué hablábamos"],
      ["Traduce", "traduce al inglés: buenos días"],
      ["Ortografía", "como se escribe cocreta"],
    ];
    cont.innerHTML = "";
    for (const [label, prompt] of acciones) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-chip";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        const input = $("#userInput");
        if (!input) return;
        input.value = prompt;
        autoResizeTextarea();
        input.focus();
      });
      cont.appendChild(btn);
    }
  }

  function setEstado(texto) {
    const el = $("#botStatus");
    if (el) el.textContent = texto;
  }

  function limpiarChat(silencioso = false) {
    const chat = $("#chat");
    if (chat) chat.innerHTML = "";
    window.Chatmu?.memoria?.limpiar?.();
    if (!silencioso) mostrarMensaje("Robot", "He limpiado el historial del chat.", { persist: false });
  }

  function setVoiceOutput(activo) {
    window.Chatmu?.memoria?.setPref?.("tts", !!activo);
    const btn = $("#btnVoz");
    if (btn) btn.classList.toggle("activo", !!activo);
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = $("#micBtn");
    if (!micBtn) return;
    if (!SpeechRecognition) {
      micBtn.disabled = true;
      micBtn.title = "El dictado no está disponible en este navegador";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => micBtn.classList.add("activo");
    recognition.onend = () => micBtn.classList.remove("activo");
    recognition.onerror = () => micBtn.classList.remove("activo");
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      const input = $("#userInput");
      if (!input) return;
      input.value = text;
      autoResizeTextarea();
      procesarEntrada(text);
    };

    micBtn.addEventListener("click", () => {
      try { recognition.start(); } catch {}
    });
  }

  function bindFullscreen() {
    const fullscreenBtn = $("#fullscreenBtn");
    if (!fullscreenBtn || fullscreenBtn.__bound) return;
    fullscreenBtn.__bound = true;

    const syncIcon = () => {
      fullscreenBtn.textContent = document.fullscreenElement ? "↔️" : "↕️";
    };

    fullscreenBtn.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch {}
      syncIcon();
    });

    document.addEventListener("fullscreenchange", syncIcon);
    syncIcon();
  }

  function bindEventos() {
    const form = $("#input-container");
    const input = $("#userInput");
    const btnModo = $("#btnModo");
    const btnVoz = $("#btnVoz");
    const clearBtn = $("#clearChatBtn");
    const exportBtn = $("#exportChatBtn");

    if (form && !form.__bound) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        procesarEntrada();
      });
      form.__bound = true;
    }

    if (input && !input.__bound) {
      input.addEventListener("input", autoResizeTextarea);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          procesarEntrada();
        }
      });
      input.__bound = true;
      autoResizeTextarea();
      input.focus();
    }

    if (btnModo && !btnModo.__bound) {
      btnModo.addEventListener("click", () => {
        document.body.classList.toggle("modo-nocturno");
        const dark = document.body.classList.contains("modo-nocturno");
        btnModo.textContent = dark ? "☀️" : "🌙";
        btnModo.classList.toggle("activo", dark);
        localStorage.setItem("chatbot_modo_nocturno", dark ? "1" : "0");
      });
      btnModo.__bound = true;
    }

    if (btnVoz && !btnVoz.__bound) {
      btnVoz.addEventListener("click", () => {
        const prefs = window.Chatmu?.memoria?.obtenerPrefs?.() || {};
        setVoiceOutput(!prefs.tts);
      });
      btnVoz.__bound = true;
    }

    if (clearBtn && !clearBtn.__bound) {
      clearBtn.addEventListener("click", () => {
        limpiarChat();
        mostrarMensaje("Robot", "Hola, ¿en qué puedo ayudarte?", { persist: true });
      });
      clearBtn.__bound = true;
    }

    if (exportBtn && !exportBtn.__bound) {
      exportBtn.addEventListener("click", () => window.Chatmu?.memoria?.exportar?.());
      exportBtn.__bound = true;
    }

    bindFullscreen();
    initSpeechRecognition();
    renderQuickActions();
  }

  function ensureLangSelect() {
    const cont = $("#controles");
    if (!cont || $("#langSelect")) return;
    const prefs = window.Chatmu?.memoria?.obtenerPrefs?.() || {};
    const langActual = prefs.lang || localStorage.getItem("chatbot_lang") || "es";
    const sel = document.createElement("select");
    sel.id = "langSelect";
    sel.title = "Idioma";
    const usados = new Set();
    Object.entries(window.idiomasSoportados).forEach(([nombre, code]) => {
      if (usados.has(code)) return;
      usados.add(code);
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = `${nombre} (${code})`;
      sel.appendChild(opt);
    });
    sel.value = langActual;
    sel.addEventListener("change", () => {
      window.Chatmu?.memoria?.setPref?.("lang", sel.value);
      localStorage.setItem("chatbot_lang", sel.value);
    });
    cont.appendChild(sel);
  }

  async function cargarHistorialOSaludo() {
    const chat = $("#chat");
    const hist = window.Chatmu?.memoria?.cargar?.() || [];
    if (chat && hist.length) {
      replayingHistory = true;
      chat.innerHTML = "";
      for (const m of hist) {
        mostrarMensaje(m.actor, m.contenido, { html: !!m.html, persist: false, ts: m.t || Date.now() });
      }
      replayingHistory = false;
      return;
    }

    const prefs = window.Chatmu?.memoria?.obtenerPrefs?.() || {};
    const lang = prefs.lang || localStorage.getItem("chatbot_lang") || "es";
    let saludo = "Hola, ¿en qué puedo ayudarte?";
    if (lang && lang !== "es") {
      try { saludo = await safeTraducir(saludo, lang); } catch {}
    }
    mostrarMensaje("Robot", saludo);
  }

  async function inicializarChatbot() {
    if (window.__CHATBOT_CORE_READY__) return;
    window.__CHATBOT_CORE_READY__ = true;

    try {
      const dark = localStorage.getItem("chatbot_modo_nocturno") === "1";
      document.body.classList.toggle("modo-nocturno", dark);
      const botonModo = $("#btnModo");
      if (botonModo) {
        botonModo.textContent = dark ? "☀️" : "🌙";
        botonModo.classList.toggle("activo", dark);
      }
      const prefs = window.Chatmu?.memoria?.obtenerPrefs?.() || {};
      setVoiceOutput(!!prefs.tts);
    } catch {}

    bindEventos();
    ensureLangSelect();
    await cargarRespuestas();
    await cargarHistorialOSaludo();
    setEstado(`Listo · v${window.ChatmuConfig?.version || "3"}`);

    document.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (ctrl && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        const input = $("#userInput");
        if (input) { input.focus(); input.select(); }
      }
      if (ctrl && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        window.Chatmu?.memoria?.exportar?.();
      }
      if (ctrl && e.shiftKey && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        limpiarChat();
        mostrarMensaje("Robot", "Hola, ¿en qué puedo ayudarte?", { persist: true });
      }
    });
  }

  window.inicializarChatbot = inicializarChatbot;
  window.cambiarModo = () => $("#btnModo")?.click();

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.__CHATBOT_CORE_READY__) inicializarChatbot();
  });
})();
