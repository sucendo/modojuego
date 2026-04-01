/*
* chatbotJuegos.js
* By Sucendo 2024-2026
*/

(function(){
  function _norm(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?¡!.,;:()"']/g, " ")
      .replace(/\b(el|la|los|las|un|una|unos|unas|de|del|al)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function _levenshtein(a, b) {
    const aa = _norm(a);
    const bb = _norm(b);
    const m = Array.from({ length: bb.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= aa.length; j++) m[0][j] = j;
    for (let i = 1; i <= bb.length; i++) {
      for (let j = 1; j <= aa.length; j++) {
        m[i][j] = bb[i - 1] === aa[j - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
      }
    }
    return m[bb.length][aa.length];
  }

  function _esRespuestaParecida(usuario, correcta) {
    const u = _norm(usuario);
    const c = _norm(correcta);
    if (!u || !c) return false;
    if (u === c) return true;
    if (c.includes(u) || u.includes(c)) return true;
    const dist = _levenshtein(u, c);
    const limite = Math.max(1, Math.floor(c.length * 0.18));
    return dist <= limite;
  }

  function _pickSinRepetir(lista, usadas) {
    const usadasSet = new Set(Array.isArray(usadas) ? usadas : []);
    const libres = lista.map((_, i) => i).filter(i => !usadasSet.has(i));
    const pool = libres.length ? libres : lista.map((_, i) => i);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function _ensureGameState(ctx) {
    ctx.adivinanza = ctx.adivinanza || { usadas: [], aciertos: 0, fallos: 0, ronda: 0 };
    ctx.duelo = ctx.duelo || { usadas: [], ganados: 0, perdidos: 0, ronda: 0, intentoActual: 0 };
  }

  function _pistaAdivinanza(actual) {
    const respuesta = String(actual?.respuesta || "").trim();
    const limpia = _norm(respuesta);
    const palabras = limpia.split(/\s+/).filter(Boolean);
    const iniciales = palabras.map(p => p[0]?.toUpperCase() || "").join(" ");
    const longitud = limpia.replace(/\s+/g, "").length;
    const sugerencias = [
      `Pista: empieza por ${iniciales}.`,
      `Pista: la respuesta tiene ${palabras.length} palabra${palabras.length === 1 ? "" : "s"}.`,
      `Pista: la respuesta tiene ${longitud} letra${longitud === 1 ? "" : "s"} sin contar espacios.`
    ];
    const idx = Math.min(actual?.pistasUsadas || 0, sugerencias.length - 1);
    return sugerencias[idx];
  }

  function iniciarAdivinanza(ctx, respuestas, opts = {}) {
    _ensureGameState(ctx);
    const lista = respuestas["adivinanza"] || [];
    if (!Array.isArray(lista) || !lista.length) return "No tengo adivinanzas ahora.";

    const idx = _pickSinRepetir(lista, ctx.adivinanza.usadas);
    const item = lista[idx];
    ctx.adivinanza.usadas = [...(ctx.adivinanza.usadas || []).slice(-20), idx];
    ctx.adivinanza.actual = { ...item, indice: idx, pistasUsadas: 0, intentos: 0 };
    ctx.adivinanza.activa = true;
    ctx.adivinanza.esperandoSiguiente = false;
    ctx.adivinanza.ronda = (ctx.adivinanza.ronda || 0) + 1;
    ctx.respuestaCorrecta = item.respuesta;
    ctx.palabraClave = "adivinanza";
    ctx.modo = "juego_adivinanza";

    const encabezado = opts.desdeOtro
      ? `Vamos con otra. Adivinanza ${ctx.adivinanza.ronda}:`
      : `Adivinanza ${ctx.adivinanza.ronda}:`;

    return `${encabezado}\n${item.pregunta}\nPuedes responder, pedir una "pista", decir "otra", "me rindo" o "salir".`;
  }

  function manejarAdivinanza(ctx, respuestaUsuario, respuestas) {
    _ensureGameState(ctx);
    const txt = String(respuestaUsuario || "").trim();
    const norm = _norm(txt);

    if (!ctx.adivinanza?.actual && respuestas) return iniciarAdivinanza(ctx, respuestas);
    if (!ctx.adivinanza?.actual) return "No tengo una adivinanza activa ahora mismo. Escribe \"adivinanza\" para empezar.";

    if (/^(salir|terminar|deja(?:r)?|cancelar)(?:\s+adivinanza)?$/i.test(txt)) {
      ctx.adivinanza.activa = false;
      ctx.adivinanza.esperandoSiguiente = false;
      ctx.palabraClave = null;
      ctx.modo = null;
      ctx.respuestaCorrecta = null;
      return "He salido de la adivinanza.";
    }

    if (/^(otra|otra adivinanza|siguiente|vamos|continua|continúa)$/i.test(norm)) {
      return respuestas ? iniciarAdivinanza(ctx, respuestas, { desdeOtro: true }) : "Dime \"adivinanza\" para empezar otra.";
    }

    if (/^(pista|otra pista|ayuda|dame una pista)$/i.test(norm)) {
      const actual = ctx.adivinanza.actual;
      const pista = _pistaAdivinanza(actual);
      actual.pistasUsadas = (actual.pistasUsadas || 0) + 1;
      return `${pista}\nPregunta: ${actual.pregunta}`;
    }

    if (/^(me rindo|rendirme|solucion|solución|no se|no sé)$/i.test(norm)) {
      const solucion = ctx.adivinanza.actual.respuesta;
      ctx.adivinanza.fallos = (ctx.adivinanza.fallos || 0) + 1;
      ctx.adivinanza.activa = false;
      ctx.adivinanza.esperandoSiguiente = true;
      ctx.respuestaCorrecta = null;
      return `La respuesta correcta era: ${solucion}.\nSi quieres otra, escribe \"otra\".`;
    }

    const actual = ctx.adivinanza.actual;
    if (_esRespuestaParecida(txt, actual.respuesta)) {
      ctx.adivinanza.aciertos = (ctx.adivinanza.aciertos || 0) + 1;
      ctx.adivinanza.activa = false;
      ctx.adivinanza.esperandoSiguiente = true;
      ctx.respuestaCorrecta = null;
      return `¡Correcto! Era: ${actual.respuesta}.\nMarcador: ${ctx.adivinanza.aciertos} acierto${ctx.adivinanza.aciertos === 1 ? "" : "s"} y ${ctx.adivinanza.fallos || 0} fallo${(ctx.adivinanza.fallos || 0) === 1 ? "" : "s"}.\nEscribe \"otra\" para seguir.`;
    }

    actual.intentos = (actual.intentos || 0) + 1;
    if (actual.intentos >= 3) {
      ctx.adivinanza.fallos = (ctx.adivinanza.fallos || 0) + 1;
      ctx.adivinanza.activa = false;
      ctx.adivinanza.esperandoSiguiente = true;
      ctx.respuestaCorrecta = null;
      return `No era correcto. La respuesta era: ${actual.respuesta}.\nEscribe \"otra\" si quieres seguir jugando.`;
    }

    const pista = _pistaAdivinanza(actual);
    actual.pistasUsadas = Math.max(actual.pistasUsadas || 0, 1);
    return `No es eso. Intento ${actual.intentos} de 3.\n${pista}`;
  }

  function _respuestaDueloValida(usuario, correcta, palabrasClave) {
    const u = _norm(usuario);
    const c = _norm(correcta);
    if (!u || !c) return false;
    if (u === c) return true;
    if (Array.isArray(palabrasClave) && palabrasClave.length) {
      const okPalabras = palabrasClave.every(p => u.includes(_norm(p)));
      if (okPalabras) return true;
    }
    const dist = _levenshtein(u, c);
    return dist <= Math.max(2, Math.floor(c.length * 0.18));
  }

  function _pistaDuelo(par) {
    const palabras = Array.isArray(par?.palabrasClave) ? par.palabrasClave.filter(Boolean) : [];
    if (palabras.length) {
      return `Pista: tu réplica debe incluir algo relacionado con ${palabras.map(p => `«${p}»`).join(", ")}.`;
    }
    const resp = String(par?.respuesta || "").trim();
    return `Pista: la réplica empieza por «${resp.slice(0, 1)}» y tiene ${resp.split(/\s+/).length} palabras aproximadamente.`;
  }

  function iniciarDueloDeInsultos(ctx, respuestas, opts = {}) {
    _ensureGameState(ctx);
    const lista = respuestas["duelo"] || [];
    if (!Array.isArray(lista) || !lista.length) return "No tengo duelos ahora.";

    const idx = _pickSinRepetir(lista, ctx.duelo.usadas);
    const item = lista[idx];
    ctx.duelo.usadas = [...(ctx.duelo.usadas || []).slice(-24), idx];
    ctx.duelo.actual = { ...item, indice: idx };
    ctx.duelo.ronda = (ctx.duelo.ronda || 0) + 1;
    ctx.duelo.intentoActual = 0;
    ctx.duelo.activa = true;
    ctx.duelo.esperandoSiguiente = false;
    ctx.respuestaCorrecta = item.respuesta;
    ctx.palabrasClave = item.palabrasClave || [];
    ctx.palabraClave = "duelo";
    ctx.modo = "juego_duelo";

    const intro = opts.desdeOtro ? "Siguiente asalto:" : "Comienza el duelo:";
    return `${intro}\nRonda ${ctx.duelo.ronda}.\nYo digo: ${item.insulto}\nTe toca responder. Puedes pedir "pista", decir "me rindo", "salir" o "siguiente" cuando termine un asalto.`;
  }

  function manejarRespuestaInsulto(ctx, respuestaUsuario, respuestas) {
    _ensureGameState(ctx);
    const txt = String(respuestaUsuario || "").trim();
    const norm = _norm(txt);

    if (!ctx.duelo?.actual && respuestas) return iniciarDueloDeInsultos(ctx, respuestas);
    if (!ctx.duelo?.actual) return "No hay un duelo activo. Escribe \"duelo\" para empezar uno.";

    if (/^(salir|terminar|deja(?:r)?|cancelar)(?:\s+duelo)?$/i.test(txt)) {
      ctx.duelo.activa = false;
      ctx.duelo.esperandoSiguiente = false;
      ctx.palabraClave = null;
      ctx.modo = null;
      ctx.respuestaCorrecta = null;
      ctx.palabrasClave = [];
      return "He salido del duelo.";
    }

    if (/^(siguiente|otra|otro|vamos|continua|continúa)$/i.test(norm) && ctx.duelo.esperandoSiguiente) {
      return respuestas ? iniciarDueloDeInsultos(ctx, respuestas, { desdeOtro: true }) : "Escribe \"duelo\" para otro asalto.";
    }

    if (/^(pista|otra pista|ayuda|dame una pista)$/i.test(norm)) {
      return _pistaDuelo(ctx.duelo.actual);
    }

    if (/^(me rindo|rendirme|solucion|solución)$/i.test(norm)) {
      const correcta = ctx.duelo.actual.respuesta;
      ctx.duelo.perdidos = (ctx.duelo.perdidos || 0) + 1;
      ctx.duelo.activa = false;
      ctx.duelo.esperandoSiguiente = true;
      ctx.respuestaCorrecta = null;
      return `Te rindes en este asalto. La réplica correcta era: ${correcta}\nMarcador: ${ctx.duelo.ganados || 0} ganados, ${ctx.duelo.perdidos} perdidos.\nEscribe \"siguiente\" para continuar.`;
    }

    const actual = ctx.duelo.actual;
    if (_respuestaDueloValida(txt, actual.respuesta, actual.palabrasClave)) {
      ctx.duelo.ganados = (ctx.duelo.ganados || 0) + 1;
      ctx.duelo.activa = false;
      ctx.duelo.esperandoSiguiente = true;
      ctx.respuestaCorrecta = null;
      const r = ctx.duelo.ronda || 1;
      return `¡Buena réplica!\nRespuesta esperada: ${actual.respuesta}\nMarcador: ${ctx.duelo.ganados} ganados, ${ctx.duelo.perdidos || 0} perdidos.\nEscribe \"siguiente\" para ir al asalto ${r + 1}.`;
    }

    ctx.duelo.intentoActual = (ctx.duelo.intentoActual || 0) + 1;
    if (ctx.duelo.intentoActual >= 2) {
      ctx.duelo.perdidos = (ctx.duelo.perdidos || 0) + 1;
      ctx.duelo.activa = false;
      ctx.duelo.esperandoSiguiente = true;
      ctx.respuestaCorrecta = null;
      return `No has dado con la réplica adecuada. La correcta era: ${actual.respuesta}\nMarcador: ${ctx.duelo.ganados || 0} ganados, ${ctx.duelo.perdidos} perdidos.\nEscribe \"siguiente\" para continuar.`;
    }

    return `No es una mala réplica, pero no es la esperada.\n${_pistaDuelo(actual)}`;
  }

  window.iniciarAdivinanza = iniciarAdivinanza;
  window.manejarAdivinanza = manejarAdivinanza;
  window.iniciarDueloDeInsultos = iniciarDueloDeInsultos;
  window.manejarRespuestaInsulto = manejarRespuestaInsulto;
})();
