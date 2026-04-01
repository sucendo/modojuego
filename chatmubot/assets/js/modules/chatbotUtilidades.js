/*
* chatbotUtilidades.js
* By Sucendo 2024-2026
*/

function calcularTiempoRestante(texto) {
  const patronFechaHora = /(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(\d{1,2})[:h](\d{1,2}))?/i;
  const m = String(texto || "").match(patronFechaHora);
  if (!m) return "No se proporcionó una fecha y hora válidas.";

  const [dia, mes, anio] = m[1].split("/").map(Number);
  const horas = m[2] ? Number(m[2]) : 0;
  const minutos = m[3] ? Number(m[3]) : 0;
  const fechaEspecifica = new Date(anio, mes - 1, dia, horas, minutos, 0, 0);

  if (Number.isNaN(fechaEspecifica.getTime())) {
    return "No se proporcionó una fecha y hora válidas.";
  }

  const ahora = new Date();
  const tiempoRestante = fechaEspecifica.getTime() - ahora.getTime();
  if (tiempoRestante <= 0) return "La fecha y hora especificadas ya han pasado.";

  const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
  const horasRestantes = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutosRestantes = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));

  if (dias > 365) {
    const anos = Math.floor(dias / 365);
    const diasRestantes = dias % 365;
    return `Quedan ${anos} años, ${diasRestantes} días, ${horasRestantes} horas y ${minutosRestantes} minutos para la fecha especificada.`;
  }
  return `Quedan ${dias} días, ${horasRestantes} horas y ${minutosRestantes} minutos para la fecha especificada.`;
}

function calcularHoraActual() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

function calcularDiaHoy() {
  const ahora = new Date();
  const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return `Hoy es ${ahora.toLocaleDateString("es-ES", opcionesFecha)}`;
}

function saludoDia() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "¡Buenos días! ¿Cómo estás?";
  if (hora >= 12 && hora < 20) return "¡Buenas tardes! ¿Cómo estás?";
  return "¡Buenas noches! ¿Cómo estás?";
}

window.Chatmu = window.Chatmu || {};
Chatmu.memoria = (function () {
  const K = "chatbot_historial_v2";
  const KPREF = "chatbot_prefs_v2";
  const KDATA = "chatbot_datos_v2";
  const MAX = 500;

  function cargar() {
    try { return JSON.parse(localStorage.getItem(K)) || []; } catch { return []; }
  }

  function guardar(hist) {
    localStorage.setItem(K, JSON.stringify((hist || []).slice(-MAX)));
  }

  function add(entry) {
    if (!entry || !entry.actor) return;
    const h = cargar();
    h.push({ ...entry, t: Date.now() });
    guardar(h);
  }

  function limpiar() {
    localStorage.removeItem(K);
  }

  function exportar() {
    const data = {
      exportedAt: new Date().toISOString(),
      history: cargar(),
      prefs: obtenerPrefs(),
      savedData: obtenerDatos(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatmubot_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function obtenerPrefs() {
    try { return JSON.parse(localStorage.getItem(KPREF)) || {}; } catch { return {}; }
  }

  function setPref(key, val) {
    const p = obtenerPrefs();
    p[key] = val;
    localStorage.setItem(KPREF, JSON.stringify(p));
  }

  function obtenerDatos() {
    try { return JSON.parse(localStorage.getItem(KDATA)) || {}; } catch { return {}; }
  }

  function setDato(clave, valor) {
    const datos = obtenerDatos();
    datos[clave] = valor;
    localStorage.setItem(KDATA, JSON.stringify(datos));
  }

  function getDato(clave) {
    return obtenerDatos()[clave];
  }

  function borrarDato(clave) {
    const datos = obtenerDatos();
    delete datos[clave];
    localStorage.setItem(KDATA, JSON.stringify(datos));
  }

  function limpiarDatos() {
    localStorage.removeItem(KDATA);
  }

  return {
    cargar,
    guardar,
    add,
    limpiar,
    exportar,
    obtenerPrefs,
    setPref,
    obtenerDatos,
    setDato,
    getDato,
    borrarDato,
    limpiarDatos,
  };
})();
