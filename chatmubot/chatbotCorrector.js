/* ChatmuBot v3.0.1 · LanguageTool, solo a petición o con consentimiento expreso.
 * Una solicitud por frase, con timeout y propagación clara de errores.
 */
(function () {
  "use strict";
  const API = "https://api.languagetool.org/v2/check";

  async function consultarLanguageTool(texto, idioma = "es") {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8500);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text: texto, language: idioma }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`LanguageTool HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.matches)) throw new Error("Respuesta incorrecta del corrector");
      return data.matches;
    } finally {
      clearTimeout(timeout);
    }
  }

  function escapeHTML(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function corregirTexto(texto) {
    const original = String(texto || "");
    if (!original.trim()) return { corregidoSimple: original, corregidoHTML: escapeHTML(original) };
    const matches = await consultarLanguageTool(original);
    const validos = matches
      .filter(m => Number.isInteger(m.offset) && Number.isInteger(m.length) && m.offset >= 0 && m.length > 0 &&
        m.offset + m.length <= original.length && Array.isArray(m.replacements) && m.replacements[0] && typeof m.replacements[0].value === "string")
      .sort((a, b) => b.offset - a.offset);
    let textoPlano = original;
    // Aplicamos cambios de derecha a izquierda sin desajustar las posiciones.
    let limite = original.length;
    for (const m of validos) {
      if (m.offset + m.length > limite) continue; // descartar solapamientos
      textoPlano = textoPlano.slice(0, m.offset) + m.replacements[0].value + textoPlano.slice(m.offset + m.length);
      limite = m.offset;
    }
    return { corregidoSimple: textoPlano, corregidoHTML: escapeHTML(textoPlano) };
  }

  // La búsqueda de Wikipedia no corrige consultas automáticamente: evitar
  // enviar a LanguageTool datos no destinados explícitamente al corrector.
  window.consultarLanguageTool = consultarLanguageTool;
  window.corregirTexto = corregirTexto;
  window.corregirConsulta = async (consulta) => consulta;
})();
