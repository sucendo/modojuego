/**
 * ChatmuBot - Lógica conversacional mejorada
 * - Contexto más estable y menos invasivo
 * - Seguimiento de búsqueda y del último tema
 * - Soporte conversacional para juegos y repeticiones
 */

(function(){
  function _norm(s){
    return String(s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?¡!.,;:()"']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const INSULTOS = /\b(gilipollas|idiota|imb[eé]cil|est[uú]pido|tonto|asqueroso|mierda|capullo)\b/i;
  const RESET_CORTESIA = /^(gracias|de nada|vale|ok|okay|perfecto|entendido|genial|igualmente|a ti|no hay de que|no hay de qué)\.?$/i;
  const AFFIRM = /\b(s[ií]|si|claro|de acuerdo|correcto|por supuesto|adelante|continua|continua|continuar|sigue|proceder|vale|ok|perfecto)\b/i;

  function _resetCtx(ctx){
    if (!ctx) return;
    ctx.modo = null;
    ctx.modoLista = null;
    ctx.ultimaListaNombre = null;
    ctx.ultimaListaItems = null;
    ctx.confirm = null;
    ctx.confirmKey = null;
    ctx.calcValor = undefined;
    ctx.traducirIdioma = null;
    ctx.traducirUltima = null;
    ctx.ortoUltima = null;
    if (ctx.adivinanza) {
      ctx.adivinanza.activa = false;
      ctx.adivinanza.esperandoSiguiente = false;
    }
    if (ctx.duelo) {
      ctx.duelo.activa = false;
      ctx.duelo.esperandoSiguiente = false;
    }
    if (ctx.palabraClave === "adivinanza" || ctx.palabraClave === "duelo") ctx.palabraClave = null;
  }

  function _activarLista(ctx, nombre, items){
    if (!Array.isArray(items) || !items.length) return false;
    ctx.modoLista = { nombre, items, indice: 0 };
    ctx.ultimaListaNombre = nombre;
    ctx.ultimaListaItems = items;
    return true;
  }

  function _itemActual(ctx){
    const m = ctx.modoLista; if (!m) return null;
    if (m.indice < 0) m.indice = 0;
    if (m.indice >= m.items.length) m.indice = m.items.length - 1;
    return m.items[m.indice];
  }

  function _siguiente(ctx){
    const m = ctx.modoLista; if (!m) return null;
    m.indice = (m.indice + 1) % m.items.length;
    return m.items[m.indice];
  }

  function _aTexto(it){
    if (it == null) return "";
    if (typeof it === "string") return it;
    if (typeof it === "object") {
      if (it.pregunta && it.respuesta) return it.pregunta;
      if (it.insulto && it.respuesta) return it.insulto;
      if (it.texto) return it.texto;
      return JSON.stringify(it);
    }
    return String(it);
  }

  function _esExpresionMatematicaSimple(txt){
    const t = String(txt||"").trim();
    if (!t) return false;
    if (/[^0-9\s+*\/x·^().,-]/i.test(t)) return false;
    return /[-+*\/x·^]/.test(t);
  }

  function _resumir(texto, max = 220) {
    const s = String(texto || "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
  }

  function manejarContextoConversacion(ctx, texto, tnorm, palabras, resp){
    const t = String(texto||"").trim();
    const tn = _norm(tnorm || t);

    if (INSULTOS.test(t) && ctx.palabraClave !== "duelo") {
      ctx.insultos = (ctx.insultos||0) + 1;
      if (ctx.insultos >= 3) return "Puedo seguir ayudándote, pero mejor si mantenemos un tono un poco más amable.";
    }

    if (/^(de que hablabamos|de qué hablábamos|que estabamos viendo|qué estábamos viendo)$/i.test(tn)) {
      if (ctx.palabraClave === "adivinanza" && ctx.adivinanza?.actual) {
        return `Estábamos con una adivinanza. Pregunta actual: ${ctx.adivinanza.actual.pregunta}`;
      }
      if (ctx.palabraClave === "duelo" && ctx.duelo?.actual) {
        return `Estábamos en un duelo. Insulto actual: ${ctx.duelo.actual.insulto}`;
      }
      if (ctx.buscaUltimo) return `Lo último importante que vimos fue sobre ${ctx.buscaUltimo}.`;
      if (Array.isArray(ctx.historialTemas) && ctx.historialTemas.length > 1) {
        const ultimos = ctx.historialTemas.slice(-3).map((x) => x.tema).join(", ");
        return `Últimos temas en contexto: ${ultimos}.`;
      }
      if (ctx.ultimoTema) return `Lo último importante de lo que hablamos fue ${ctx.ultimoTema}.`;
      return "Todavía no tengo un tema claro en contexto.";
    }

    if (/^(repite|repiteme|repíteme|que has dicho|qué has dicho)$/i.test(tn)) {
      if (ctx.ultimaRespuestaBot) return `Te dije esto:\n${_resumir(ctx.ultimaRespuestaBot, 320)}`;
      return "Todavía no tengo ninguna respuesta previa para repetir.";
    }

    if (/^(resume|resumelo|resúmelo|mas corto|más corto)$/i.test(tn)) {
      if (ctx.ultimaRespuestaBot) return _resumir(ctx.ultimaRespuestaBot, 160);
      return null;
    }

    if (/^(ultimos temas|últimos temas|que temas hemos visto|qué temas hemos visto)$/i.test(tn)) {
      if (Array.isArray(ctx.historialTemas) && ctx.historialTemas.length) {
        return "Temas recientes: " + ctx.historialTemas.slice(-5).map((x) => x.tema).join(", ");
      }
      return "Todavía no tengo temas recientes guardados en el contexto.";
    }

    if (ctx.confirm && ctx.confirm.pending) {
      const NEG = /\b(no|para|deten|detén|cancela|mejor no)\b/i;
      const act = ctx.confirm.action;
      if (AFFIRM.test(tn)) {
        ctx.confirm = null;
        if (act === "lista_otro" && ctx.modoLista) {
          const it = _siguiente(ctx);
          return `${_aTexto(it)}\n¿Quieres otro?`;
        }
      } else if (NEG.test(tn)) {
        ctx.confirm = null;
        ctx.modoLista = null;
        return "Entendido.";
      }
    }

    if (RESET_CORTESIA.test(tn)) return null;

    const juegoActivo =
      (ctx.palabraClave === "adivinanza" && (ctx.adivinanza?.activa || ctx.adivinanza?.esperandoSiguiente)) ||
      (ctx.palabraClave === "duelo" && (ctx.duelo?.activa || ctx.duelo?.esperandoSiguiente));

    const CAMBIO_ACCION =
      /^(?:\s*traduce\s+al\b)/i.test(t) ||
      /\b(busca|que es|qué es|quien es|quién es)\b/i.test(tn) ||
      /\b(calcula|cuanto es|cuánto es)\b/i.test(tn) ||
      _esExpresionMatematicaSimple(t) ||
      /\b(chistes?|broma(s)?|curiosidad(es)?|pel[ií]culas?|adivinanza(s)?|duelo|juego|jugar|corrige\b)/i.test(tn);

    if (!CAMBIO_ACCION) {
      if (ctx.modo === "calc") {
        const rel = t.match(/^\s*([+\-*/])\s*([\-+]?\d+(?:[.,]\d+)?)\s*$/);
        if (rel && typeof ctx.calcValor === "number") {
          const op = rel[1];
          const b = parseFloat(rel[2].replace(",", "."));
          if (!Number.isNaN(b)) {
            let a = ctx.calcValor, r;
            if (op === "+") r = a + b;
            else if (op === "-") r = a - b;
            else if (op === "*") r = a * b;
            else if (op === "/") { if (b === 0) return "No se puede dividir por cero."; r = a / b; }
            ctx.calcValor = Number(r);
            ctx.modo = "calc";
            return `El resultado es ${r}`;
          }
        }
      }

      if (ctx.modo === "busca") {
        if (/^(y|ahora)\s+.+$/i.test(t)) return null;
        if (ctx.buscaUltimo && /^(cuentame mas|cuéntame más|amplia|explica mejor|más detalles|mas detalles)$/i.test(tn)) return null;
      }

      if (ctx.modo === "traduce") {
        if (/(?:\b(deja|termina|para|cancela|sal(?:ir)?)\b.*\b(traducir|traducci[oó]n)\b)/i.test(t)) {
          _resetCtx(ctx); return "Hecho, dejo de traducir.";
        }
      }

      if (ctx.modo === "ortografia") {
        if (/(?:\b(deja|termina|para|cancela|sal(?:ir)?)\b.*\b(corregir|correcci[oó]n|ortograf[ií]a)\b)/i.test(t)) {
          _resetCtx(ctx); return "Hecho, dejo de corregir.";
        }
      }

      if (!juegoActivo && ctx.modoLista) {
        if (/\botro\b/i.test(tn) || AFFIRM.test(tn)) {
          const it = _siguiente(ctx);
          ctx.confirm = { pending: true, action: "lista_otro" };
          return `${_aTexto(it)}\n¿Quieres otro?`;
        }
      }
    }

    if (/^(salir del juego|deja el juego|termina el juego)$/i.test(tn) && juegoActivo) {
      _resetCtx(ctx);
      return "He salido del juego actual.";
    }

    if (ctx.buscaUltimo && /^(y\s+)?(su\s+)?(capital|poblacion|población|superficie|altitud|gentilicio|idioma|idiomas|moneda|historia|fundacion|fundación)\b/i.test(tn)) {
      return null;
    }

    if (/^\s*corrige\s*:\s*/i.test(t)) {
      const q = t.replace(/^\s*corrige\s*:\s*/i, "").trim();
      if (!q) return "Dime el texto que quieres corregir.";
      ctx.modo = "ortografia";
      ctx.ortoUltima = q;
      return null;
    }

    if (!juegoActivo && !ctx.modoLista && resp && typeof resp === "object") {
      const LISTA_AUTO_KEYS = new Set(["chiste", "broma", "peliculas_lista", "cuentame una curiosidad", "cuéntame una curiosidad"]);
      for (const clave of Object.keys(resp)) {
        const val = resp[clave];
        if (!Array.isArray(val) || !val.length) continue;
        const k = _norm(clave);
        if (!k || !LISTA_AUTO_KEYS.has(k)) continue;
        const kEsc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const reK = new RegExp(`\\b${kEsc}\\b`, "i");
        if (reK.test(tn)) {
          if (_activarLista(ctx, clave, val)) {
            const it = _itemActual(ctx);
            return `${_aTexto(it)}\n¿Quieres otro?`;
          }
        }
      }
    }

    if (!juegoActivo && !ctx.modoLista && /\botro\b/i.test(tn) && Array.isArray(ctx.ultimaListaItems) && ctx.ultimaListaItems.length) {
      if (_activarLista(ctx, ctx.ultimaListaNombre||"lista", ctx.ultimaListaItems)) {
        const it = _siguiente(ctx);
        return `${_aTexto(it)}\n¿Quieres otro?`;
      }
    }

    return null;
  }

  window.manejarContextoConversacion = manejarContextoConversacion;
})();
