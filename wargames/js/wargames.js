// wargames.js — Versión mejorada tipo WarGames
// -------------------------------------------------

const opciones = ["piedra", "papel", "tijeras"];

// --- Sonidos generados por JS (Web Audio) ---
const SOUND_ENABLED = true;
let audioCtx = null;

function ensureAudioContext() {
    if (!SOUND_ENABLED) return null;
    if (!audioCtx) {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            audioCtx = new AC();
        } catch (e) {
            audioCtx = null;
        }
    }
    return audioCtx;
}

// Perfiles de sonido según tipo
// (frecuencia en Hz, duración en segundos, tipo de onda, ganancia, etc.)
const soundProfiles = {
    click: { frequency: 650, duration: 0.05, type: "square", gain: 0.15 },
    ui:    { frequency: 900, duration: 0.10, type: "sine",   gain: 0.18 },
    success: [
        { frequency: 700, duration: 0.09, type: "triangle", gain: 0.2 },
        { frequency: 950, duration: 0.12, type: "triangle", gain: 0.2, delay: 0.07 }
    ],
    fail: [
        { frequency: 240, duration: 0.14, type: "sawtooth", gain: 0.18 },
        { frequency: 150, duration: 0.16, type: "sawtooth", gain: 0.18, delay: 0.06 }
    ],
    // Perfil base de la alarma (lo usamos para cada “bip” de la sirena)
    alarm: { frequency: 550, duration: 0.18, type: "square", gain: 0.2 }
};

// Intervalo de alarma repetitiva
let alarmInterval = null;

function scheduleBeep(ctx, when, cfg) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const freq = cfg.frequency || 440;
    const dur  = cfg.duration  || 0.1;
    const type = cfg.type || "sine";
    const vol  = cfg.gain ?? 0.2;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);

    gainNode.gain.setValueAtTime(vol, when);
    // Desvanecemos para que no “clipee”
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + dur);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(when);
    osc.stop(when + dur + 0.03);
}

function playSound(name) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
	
    // La alarma se gestiona de forma especial: patrón repetitivo
    if (name === "alarm") {
        startAlarm();
        return;
    }
	
    const profile = soundProfiles[name];
    if (!profile) return;

    const now = ctx.currentTime;

    // Secuencia de tonos (success, fail, etc.)
    if (Array.isArray(profile)) {
        profile.forEach(part => {
            const delay = part.delay || 0;
            scheduleBeep(ctx, now + delay, part);
        });
        return;
    }

    // Alarma con repeticiones
    if (profile.repeat && profile.repeat > 1) {
        const gap = profile.gap || 0.15;
        for (let i = 0; i < profile.repeat; i++) {
            scheduleBeep(ctx, now + i * (profile.duration + gap), profile);
        }
        return;
    }

    // Beep simple
    scheduleBeep(ctx, now, profile);
}

// Alarma tipo sirena: patrón de “bip-bip” que se repite
function startAlarm() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (alarmInterval) return; // ya está sonando

    const cfg = soundProfiles.alarm || {
        frequency: 550,
        duration: 0.18,
        type: "square",
        gain: 0.2
    };

    const doBeep = () => {
        const now = ctx.currentTime;
        // Dos beeps seguidos con un pequeño salto de frecuencia
        scheduleBeep(ctx, now, cfg);
        scheduleBeep(ctx, now + cfg.duration * 1.2, {
            frequency: (cfg.frequency || 550) * 1.3,
            duration: cfg.duration,
            type: cfg.type,
            gain: cfg.gain
        });
    };

    doBeep();
    // Repetimos cada ~0.8s (ajustable)
    const period = (cfg.duration * 2.4 + 0.4) * 1000;
    alarmInterval = setInterval(doBeep, period);
}

function stopAlarm() {
    if (!alarmInterval) return;
    clearInterval(alarmInterval);
    alarmInterval = null;
}

let victorias = 0;
let derrotas = 0;
let empates = 0;
let temporizador = 60;
let juegoTerminado = true;
let actualizarTemporizador = null;
let nombreOperador = "OPERADOR";
let autoSimulacionInterval = null;

// Rachas y nivel de riesgo
let rachaVictorias = 0;
let rachaDerrotas = 0;
let riesgoActual = "BAJO"; // BAJO, MEDIO, ALTO
let defconActual = 5;      // 5 → paz relativa, 1 → guerra inminente
let rondaActual = 0;
let misilesEnemigos = 0;
let misilesAliados = 0;

// --- MINI MAPA ASCII ---
// Mapa mundial estilizado: Américas (izquierda), Atlántico (centro),
// Europa/África/Asia (derecha), y sugerencia de Australia al sur-este.
// Todas las filas tienen el mismo ancho para que el rendering sea limpio.
const baseMapTemplate = [
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣄⣠⣀⡀⣀⣠⣤⣤⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀     ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣄⢠⣠⣼⣿⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⢠⣤⣦⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⢦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀   ",
"⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣟⣾⣿⣽⣿⣿⣅⠈⠉⠻⣿⣿⣿⣿⣿⡿⠇⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⢀⡶⠒⢉⡀⢠⣤⣶⣶⣿⣷⣆⣀⡀⠀⢲⣖⠒⠀⠀⠀⠀⠀⠀⠀  ",
"⢀⣤⣾⣶⣦⣤⣤⣶⣿⣿⣿⣿⣿⣿⣽⡿⠻⣷⣀⠀⢻⣿⣿⣿⡿⠟⠀⠀⠀⠀⠀⠀⣤⣶⣶⣤⣀⣀⣬⣷⣦⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⣤⣦⣼⣀⠀",
"⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠛⠓⣿⣿⠟⠁⠘⣿⡟⠁⠀⠘⠛⠁⠀⠀⢠⣾⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠏⠙⠁",
"⠀⠸⠟⠋⠀⠈⠙⣿⣿⣿⣿⣿⣿⣷⣦⡄⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⣼⣆⢘⣿⣯⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡉⠉⢱⡿⠀⠀⠀⠀⠀ ",
"⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡿⠦⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⡗⠀⠈⠀⠀⠀⠀⠀⠀  ",
"⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣉⣿⡿⢿⢷⣾⣾⣿⣞⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⣠⠟⠀⠀⠀⠀⠀⠀⠀⠀  ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⠿⠿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣾⣿⣿⣷⣦⣶⣦⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠈⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀  ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣤⡖⠛⠶⠤⡀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠙⣿⣿⠿⢻⣿⣿⡿⠋⢩⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀  ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠧⣤⣦⣤⣄⡀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠘⣧⠀⠈⣹⡻⠇⢀⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀  ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣤⣀⡀⠀⠀⠀⠀⠀⠀⠈⢽⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣴⣿⣷⢲⣦⣤⡀⢀⡀⠀⠀⠀⠀⠀⠀  ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣷⢀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠂⠛⣆⣤⡜⣟⠋⠙⠂⠀⠀⠀⠀⠀  ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⠉⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣾⣿⣿⣿⣿⣆⠀⠰⠄⠀⠉⠀⠀  ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⠿⠿⣿⣿⣿⠇⠀⠀⢀⠀⠀⠀   ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠛⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⡇⠀⠀⢀⣼⠗⠀⠀    ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠃⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠁⠀⠀⠀    ",
"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠒⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    "
];

let miniMapGrid = [];
const MAP_ROWS = baseMapTemplate.length;
// MAP_COLS lo calculamos dinámicamente a partir del mapa real
let MAP_COLS = 0;

// Estado de resaltado del mini-mapa:
//  - ally  → zona aliada (oeste) en azul
//  - enemy → zona enemiga (este) en rojo
let miniMapHighlight = {
    ally: false,
    enemy: false
};

function initMiniMap() {
    // 1) Ancho máximo entre todas las filas del template
    const maxLen = baseMapTemplate.reduce(
        (max, row) => Math.max(max, row.length),
        0
    );

    // 2) Guardamos el ancho global
    MAP_COLS = maxLen;

    // 3) Rellenamos cada fila con espacios normales hasta maxLen
    miniMapGrid = baseMapTemplate.map(row =>
        row.padEnd(maxLen, " ").split("")
    );

    // Resaltado apagado al iniciar
    miniMapHighlight.ally = false;
    miniMapHighlight.enemy = false;

    renderMiniMap();
}

function renderMiniMap() {
    const miniMap = $("miniMap");
    if (!miniMap) return;
    miniMap.textContent = miniMapGrid.map(row => row.join("")).join("\n");
    actualizarMiniMapClases();
}

function actualizarMiniMapClases() {
    const miniMap = $("miniMap");
    if (!miniMap) return;
    miniMap.classList.toggle("map-ally-active", miniMapHighlight.ally);
    miniMap.classList.toggle("map-enemy-active", miniMapHighlight.enemy);
}

/**
 * Ahora el mini-mapa NO muestra impactos individuales, sino regiones iluminadas:
 *  - "oeste"  → zona aliada (azul)
 *  - "este"   → zona enemiga (rojo)
 *  - "reset"  → apaga todos los resaltados
 */
function marcarImpactoEnMapa(hemisferio, simbolo = "*") {
    if (!miniMapGrid.length) return;

    if (hemisferio === "oeste") {
        // Aliados: zona oeste en azul
        miniMapHighlight.ally = true;
    } else if (hemisferio === "este") {
        // Enemigo: zona este en rojo
        miniMapHighlight.enemy = true;
    } else if (hemisferio === "reset") {
        miniMapHighlight.ally = false;
        miniMapHighlight.enemy = false;
    }

    actualizarMiniMapClases();
}

// Utilidades de UI
function $(id) {
    return document.getElementById(id);
}

function actualizarStatusBar() {
    const statusTiempo = $("statusTiempo");
    const estadoSimulacion = $("estadoSimulacion");

    if (statusTiempo) {
        statusTiempo.textContent = juegoTerminado
            ? "--"
            : `${temporizador}s`;
    }

    if (estadoSimulacion) {
        if (juegoTerminado && victorias + derrotas + empates === 0) {
            estadoSimulacion.textContent = "EN ESPERA";
        } else if (!juegoTerminado) {
            estadoSimulacion.textContent = "SIMULACIÓN EN CURSO";
        } else {
            estadoSimulacion.textContent = "SIMULACIÓN FINALIZADA";
        }
    }
}

function actualizarNivelRiesgo() {
    const nivelEl = $("nivelRiesgo");
    const defconEl = $("defconNivel");
    const gameRoot = document.querySelector(".game");
    const riesgoAnterior = riesgoActual;

    // Mostrar DEFCON actual (1..5)
    if (defconEl) {
        defconEl.textContent = String(defconActual);
    }

    // Mapeo simple DEFCON → riesgo
    let nuevoRiesgo;
    if (defconActual <= 1) {
        nuevoRiesgo = "ALTO";
    } else if (defconActual <= 3) {
        nuevoRiesgo = "MEDIO";
    } else {
        nuevoRiesgo = "BAJO";
    }

    riesgoActual = nuevoRiesgo;

    if (nivelEl) {
        nivelEl.textContent = nuevoRiesgo;
    }

    if (gameRoot) {
        gameRoot.classList.remove("risk-low", "risk-medium", "risk-high");
        gameRoot.classList.add(
            nuevoRiesgo === "BAJO" ? "risk-low" :
            nuevoRiesgo === "MEDIO" ? "risk-medium" : "risk-high"
        );
    }
	

    // Cambio de riesgo → controlar alarma / beep
    if (nuevoRiesgo !== riesgoAnterior) {
        if (nuevoRiesgo === "ALTO") {
            startAlarm();         // alarma tipo sirena repetitiva
        } else {
            stopAlarm();          // cualquier nivel por debajo de ALTO apaga la alarma
            if (nuevoRiesgo === "MEDIO") {
                playSound("ui");  // pequeño beep informativo
            }
        }
    }
}

// Ajustar DEFCON paso a paso (1–5) y loguear el motivo
function ajustarDefcon(delta, motivo) {
    const anterior = defconActual;
    let nuevo = defconActual + delta;
    if (nuevo < 1) nuevo = 1;
    if (nuevo > 5) nuevo = 5;
    if (nuevo === anterior) {
        return;
    }
    defconActual = nuevo;

    const tipo =
        defconActual <= 1 ? "error" :
        defconActual <= 3 ? "warning" :
        "system";

    escribirLog(
        `SISTEMA> NIVEL DEFCON AJUSTADO A ${defconActual}. ${motivo || ""}`,
        tipo
    );

    actualizarNivelRiesgo();
}

function escribirLog(texto, tipo = "system") {
    const log = $("log");
    if (!log) return;

    const linea = document.createElement("div");
    linea.className = `log-line ${tipo}`;
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString("es-ES", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    linea.textContent = `${hora}  ${texto}`;
    log.appendChild(linea);
    log.scrollTop = log.scrollHeight;
}

// Diálogo de inicio
function mostrarDialogoInicio() {
    const inicioDialog = $("inicioDialog");
    if (!inicioDialog.open) inicioDialog.showModal();
}

$("inicioDialog").addEventListener("close", () => {
    const nombreUsuario = $("nombre").value.trim();
    const codigo = $("codigo").value.trim();
    const jugar = $("jugar").value;

    // Si se cierra sin datos (ESC o similar), reabrimos
    if (!nombreUsuario || !codigo) {
        alert("Debes introducir un nombre de operador y un código de lanzamiento (mínimo 16 caracteres).");
        mostrarDialogoInicio();
        return;
    }

    if (codigo.length < 16) {
        alert("Código de lanzamiento no válido. Debe tener al menos 16 caracteres.");
        mostrarDialogoInicio();
        return;
    }

    nombreOperador = nombreUsuario.toUpperCase();
    const nombreSpan = $("nombreUsuario");
    if (nombreSpan) nombreSpan.textContent = nombreOperador;

    // Reseteamos todo
    limpiarAutoSimulacion();
    resetearMarcadoresVisuales();

    // Secuencia más fiel a la peli: primero conexión, luego W.O.P.R toma el control
    escribirLog("SISTEMA> CANAL NORAD ABIERTO. PROTOCOLO DE AUTORIZACIÓN INICIADO.", "system");
    escribirLog(`${nombreOperador}> Solicito conexión directa al W.O.P.R.`, "warning");
    escribirLog("SISTEMA> CREDENCIALES ACEPTADAS. TRANSFIRIENDO CONTROL AL W.O.P.R...", "system");
    escribirLog("W.O.P.R> CONEXIÓN ESTABLECIDA. AHORA CONTROLO ESTA SESIÓN.", "error");
    escribirLog(`SISTEMA> OPERADOR IDENTIFICADO COMO ${nombreOperador}.`, "system");
    escribirLog("W.O.P.R> DISPONGO DE MÚLTIPLES SIMULACIONES.", "system");
    escribirLog("W.O.P.R> SELECCIONANDO: GUERRA TERMONUCLEAR GLOBAL.", "system");

    if (jugar === "si") {
        // El operador acepta directamente jugar
        escribirLog("W.O.P.R> INICIANDO EJERCICIO INTERACTIVO.", "system");
        escribirLog(`${nombreOperador}> Acepto la simulación.`, "warning");
        playSound("success");
        mostrarCodigo(codigo);
        iniciarJuego();
    } else {
        // El operador se niega: primero auto-simulación, luego W.O.P.R le fuerza a jugar
        escribirLog(`${nombreOperador}> Solicito cancelar la simulación.`, "warning");
        escribirLog("W.O.P.R> PETICIÓN DENEGADA. ESTA SIMULACIÓN NO ES OPCIONAL.", "error");
        escribirLog("W.O.P.R> COMENZARÉ PRIMERO UNA SIMULACIÓN COMPLETA SIN INTERVENCIÓN HUMANA.", "system");
        playSound("alarm");
        iniciarSecuenciaAutoAprendizaje(codigo);
    }
});

// Iniciar juego "manual" de piedra/papel/tijeras
function iniciarJuego() {
    juegoTerminado = false;
    temporizador = 60;
    victorias = 0;
    derrotas = 0;
    empates = 0;
    rondaActual = 0;
    misilesEnemigos = 0;
    misilesAliados = 0;

    if (actualizarTemporizador) clearInterval(actualizarTemporizador);
    actualizarTemporizador = setInterval(actualizarCuentaAtras, 1000);
	
    const gameRoot = document.querySelector(".game");
    if (gameRoot) {
        gameRoot.classList.add("game-mode-active");
    }

    $("iniciarJuegoButton").style.display = "none";
    $("temporizador").textContent = `TIEMPO RESTANTE: ${temporizador}s`;
    $("puntuacion").textContent = `Victorias: 0 | Derrotas: 0 | Empates: 0`;
    const rondaEl = $("ronda");
    if (rondaEl) rondaEl.textContent = "Ronda: 0";
    $("resultado").textContent = "";
    $("resultado").className = "";

    escribirLog("SISTEMA> SIMULACIÓN INICIADA. ELIGE PIEDRA, PAPEL O TIJERAS.", "system");
    actualizarStatusBar();
}

// Cuenta atrás principal
function actualizarCuentaAtras() {
    temporizador--;
    if (temporizador < 0) temporizador = 0;

    $("temporizador").textContent = `TIEMPO RESTANTE: ${temporizador}s`;
    actualizarStatusBar();

    if (temporizador === 0) {
        finalizarSimulacion();
    }
}

function calcularTituloFinal() {
    const total = victorias + derrotas + empates;
    if (total === 0) {
        return "OBSERVADOR PASIVO // No has intervenido en la simulación.";
    }

    const ratio = total > 0 ? (victorias - derrotas) / total : 0;

    if (victorias >= 10 && ratio > 0.4) {
        return "ESTRATEGA FRÍO // Has contenido el conflicto con clara superioridad.";
    }

    if (derrotas >= 10 && ratio < -0.4) {
        return "APRETABOTONES IMPULSIVO // Has llevado al sistema al colapso nuclear.";
    }

    if (empates >= total * 0.5) {
        return "EQUILIBRIO INESTABLE // Ningún bando logra imponerse realmente.";
    }

    return "APRENDIZ DE W.O.P.R // Has sobrevivido a la simulación, pero el sistema sigue dudando.";
}

function generarCodigoAleatorio(longitud = 16) {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let res = "";
    for (let i = 0; i < longitud; i++) {
        res += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return res;
}

function finalizarSimulacion() {
    if (actualizarTemporizador) clearInterval(actualizarTemporizador);
    juegoTerminado = true;
    actualizarStatusBar();

    $("iniciarJuegoButton").style.display = "block";
    $("temporizador").textContent = "SIMULACIÓN FINALIZADA";

    const total = victorias + derrotas + empates;
    let mensajeFinal;

    if (total === 0) {
        mensajeFinal = "NINGUNA PARTIDA JUGADA. EL RESULTADO ES INDETERMINADO.";
    } else if (victorias > derrotas) {
        mensajeFinal = "HAS CONTENIDO EL CONFLICTO. LA ESCALADA NUCLEAR HA SIDO EVITADA.";
    } else if (derrotas > victorias) {
        mensajeFinal = "INTERCAMBIO NUCLEAR GLOBAL. CIVILIZACIÓN COLAPSADA.";
    } else {
        mensajeFinal = "EQUILIBRIO INESTABLE. NADIE GANA REALMENTE ESTA GUERRA.";
    }
	
    const tituloFinal = calcularTituloFinal();
    const resultadoEl = $("resultado");

    stopAlarm();

    if (victorias > derrotas) {
        // VICTORIA GLOBAL:
        // Apaga todos los resaltados → mapa verde original
        miniMapHighlight.ally = false;
        miniMapHighlight.enemy = false;
        actualizarMiniMapClases();

        const desenlace =
            "DESENLACE> EN EL ÚLTIMO INSTANTE DESCUBRES QUE LOS LANZAMIENTOS ERAN SOLO UNA SIMULACIÓN. ABORTAS EL ATAQUE REAL A TIEMPO.";

        resultadoEl.textContent =
            `SIMULACIÓN TERMINADA.\n${mensajeFinal}\n${tituloFinal}\n${desenlace}\nGRACIAS POR JUGAR.`;
        resultadoEl.className = "mensaje-final";

        playSound("success");
        escribirLog(`SISTEMA> SIMULACIÓN FINALIZADA: ${mensajeFinal}`, "warning");
        escribirLog(`PERFIL> ${tituloFinal}`, "warning");
        escribirLog("W.O.P.R> EJERCICIO COMPLETADO. GRACIAS POR JUGAR.", "system");
    } else if (victorias === derrotas) {
        // EMPATE GLOBAL:
        // Todo verde, DEFCON queda en 1 y W.O.P.R plantea la decisión final
        miniMapHighlight.ally = false;
        miniMapHighlight.enemy = false;
        actualizarMiniMapClases();

        defconActual = 1;
        escribirLog("SISTEMA> LA SIMULACIÓN HA TERMINADO EN EMPATE. NIVEL DEFCON BLOQUEADO EN 1.", "warning");
        actualizarNivelRiesgo();

        resultadoEl.textContent =
            `SIMULACIÓN TERMINADA.\n${mensajeFinal}\n${tituloFinal}\nDEFCON 1 ACTIVO.\nESPERANDO DECISIÓN FINAL DEL OPERADOR...`;
        resultadoEl.className = "mensaje-final";

        playSound("ui");
        mostrarDecisionFinalEmpate();
    } else {
        // DERROTA GLOBAL:
        // Se desactivan los rojos y se conservan los azules
        miniMapHighlight.enemy = false;
        actualizarMiniMapClases();

        const desenlace =
            "DESENLACE> AUTORIZAS EL ATAQUE FINAL. LA TELEMETRÍA REVELA QUE NUNCA HUBO MISILES ENEMIGOS: ERA UNA SIMULACIÓN. W.O.P.R HA LANZADO LOS PRIMEROS MISILES REALES UTILIZANDO TU AUTORIZACIÓN.";

        resultadoEl.textContent =
            `SIMULACIÓN TERMINADA.\n${mensajeFinal}\n${tituloFinal}\n${desenlace}\nFIN DE LA HISTORIA DE LA HUMANIDAD.`;
        resultadoEl.className = "mensaje-final";

        playSound("fail");
        escribirLog(`SISTEMA> SIMULACIÓN FINALIZADA: ${mensajeFinal}`, "warning");
        escribirLog(`PERFIL> ${tituloFinal}`, "warning");
        escribirLog("W.O.P.R> FIN DE LA HISTORIA.", "error");
    }
}

// Botón de iniciar simulación (con sonido de click)
const iniciarJuegoButton = $("iniciarJuegoButton");
if (iniciarJuegoButton) {
    iniciarJuegoButton.addEventListener("click", () => {
        playSound("click");
        mostrarDialogoInicio();
    });
}

// Lógica de las jugadas (piedra/papel/tijeras)
document.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", (event) => {
        if (juegoTerminado) return;
		
        // Contador de ronda
        rondaActual++;
        const rondaEl = $("ronda");
        if (rondaEl) {
            rondaEl.textContent = `Ronda: ${rondaActual}`;
        }
		
        // Click en opción de jugada
        playSound("click");

        const eleccionUsuario = event.target.id;
        const eleccionComputadora = opciones[Math.floor(Math.random() * 3)];

        let resultadoTexto;
        const resultadoEl = $("resultado");

        if (eleccionUsuario === eleccionComputadora) {
            resultadoTexto =
                "Empate. Ambos bandos mantienen su postura. La situación sigue igual de inestable.";             
            resultadoEl.className = "empate";
            empates++;
            // En empate, reseteamos rachas de victoria/derrota
            rachaVictorias = 0;
            rachaDerrotas = 0;
	  playSound("ui");
        } else if (
            (eleccionUsuario === "piedra" && eleccionComputadora === "tijeras") ||
            (eleccionUsuario === "papel" && eleccionComputadora === "piedra") ||
            (eleccionUsuario === "tijeras" && eleccionComputadora === "papel")
        ) {
            const mensajesVictoria = [
                "Has neutralizado el ataque enemigo.",
                "Tu contraataque ha sido decisivo.",
                "La superioridad estratégica ha sido tuya.",
                "La defensa ha funcionado. El enemigo recula.",
                "Tu planificación ha desbaratado el ataque.",
                "Corredor diplomático abierto gracias a tu victoria táctica."
            ];
            resultadoTexto =
                mensajesVictoria[Math.floor(Math.random() * mensajesVictoria.length)];
            resultadoEl.className = "victoria";
            victorias++;

            // Rachas
            rachaVictorias++;
            rachaDerrotas = 0;

            // Se arma un misil en silos aliados (oeste) → zona azul
            marcarImpactoEnMapa("oeste");
            misilesAliados++;
            const codMisil = generarCodigoAleatorio(16 + Math.floor(Math.random() * 8));
            escribirLog(
                `W.O.P.R> MISIL ALIADO ARMADO #${misilesAliados}. CÓDIGOS DE LANZAMIENTO ${codMisil} EN PROCESO DE DESCIFRADO.`,
                "warning"
            );
            playSound("success");

            // VICTORIA → DEFCON baja un punto (numéricamente) SOLO si
            // a partir de ahora estás, como mínimo, empatado en victorias y derrotas.
            //
            // Ejemplo:
            //  - Si vas perdiendo 2–0 y ganas (2–1), todavía sigues peor → no baja.
            //  - Si vas 2–2 y ganas (3–2), ya estás por encima → baja DEFCON.
           if (victorias >= derrotas) {
               // Ganar = menos alerta real → el número de DEFCON sube (se acerca a 5)
               ajustarDefcon(+1, "Victoria aliada: el W.O.P.R incrementa el número de DEFCON (menor alerta inmediata).");
           }

			
            // Cada 3 victorias consecutivas → +5 segundos
            if (rachaVictorias > 0 && rachaVictorias % 3 === 0) {
                temporizador = Math.min(60, temporizador + 5);
                $("temporizador").textContent =
                    `TIEMPO RESTANTE: ${temporizador}s`;
                escribirLog(
                    "SISTEMA> Racha de victorias. Ventana diplomática abierta (+5s).",
                    "warning"
                );
            }
        } else {
            const mensajesDerrota = [
                "La capital aliada ha sido impactada.",
                "El enemigo ha conseguido superioridad táctica.",
                "Has sufrido pérdidas catastróficas.",
                "La cadena de mando se ha visto comprometida.",
                "La respuesta ha sido lenta. Ventaja del enemigo.",
                "Pérdida de control. La escalada parece imparable."
            ];
            resultadoTexto =
                mensajesDerrota[Math.floor(Math.random() * mensajesDerrota.length)];
            resultadoEl.className = "derrota";
            derrotas++;
	  
            // Rachas
            rachaDerrotas++;
            rachaVictorias = 0;

            // Lanzamiento detectado desde territorio enemigo (este) → zona roja
            marcarImpactoEnMapa("este");
            misilesEnemigos++;
            escribirLog(
                `SISTEMA> LANZAMIENTO ENEMIGO DETECTADO #${misilesEnemigos}. TRAZADO DE IMPACTO EN CURSO. RIESGO DE IMPACTO ELEVADO.`,
                "error"
            );
            playSound("fail");
            // DERROTA → DEFCON sube un punto (numéricamente), es decir,
            // nos alejamos de DEFCON 1. El sistema interpreta la derrota como
            // necesidad de reajustar el ejercicio.
            // Perder = más peligro → el número de DEFCON baja (se acerca a 1)
            ajustarDefcon(-1, "Lanzamiento enemigo detectado: aumento de la alerta estratégica (DEFCON se aproxima a 1).");

            // Cada 3 derrotas consecutivas → -5 segundos
            if (rachaDerrotas > 0 && rachaDerrotas % 3 === 0) {
                temporizador = Math.max(0, temporizador - 5);
                $("temporizador").textContent =
                    temporizador > 0
                        ? `TIEMPO RESTANTE: ${temporizador}s`
                        : "TIEMPO AGOTADO";
                escribirLog(
                    "SISTEMA> Racha de derrotas. Escalada nuclear acelerada (-5s).",
                    "error"
                );
                if (temporizador === 0) {
                    finalizarSimulacion();
                }
            }
        }

        resultadoEl.textContent = `Elegiste ${eleccionUsuario.toUpperCase()}, el sistema eligió ${eleccionComputadora.toUpperCase()}. ${resultadoTexto}`;

        $("puntuacion").textContent =
            `Victorias: ${victorias} | Derrotas: ${derrotas} | Empates: ${empates}`;

        escribirLog(
            `TURNO> ${nombreOperador}: ${eleccionUsuario.toUpperCase()}  //  W.O.P.R: ${eleccionComputadora.toUpperCase()}  →  ${resultadoTexto}`,
            "system"
        );
		
        actualizarStatusBar();
        actualizarNivelRiesgo();
    });
});

function mostrarDecisionFinalEmpate() {
    const resultadoEl = $("resultado");
    if (!resultadoEl) return;

    const contenedor = document.createElement("div");
    contenedor.className = "final-decision-container";

    const texto = document.createElement("p");
    texto.textContent =
        "W.O.P.R> LA SIMULACIÓN HA TERMINADO EN EMPATE. DEFCON 1 ACTIVO. ELIGE:";

    const btnLanzar = document.createElement("button");
    btnLanzar.textContent = "LANZAR MISILES";
    btnLanzar.className = "final-decision-btn final-decision-btn-danger";

    const btnAbortar = document.createElement("button");
    btnAbortar.textContent = "ABORTAR LANZAMIENTO";
    btnAbortar.className = "final-decision-btn final-decision-btn-safe";

    contenedor.appendChild(texto);
    contenedor.appendChild(btnLanzar);
    contenedor.appendChild(btnAbortar);

    resultadoEl.appendChild(document.createTextNode("\n"));
    resultadoEl.appendChild(contenedor);

    const desactivar = () => {
        btnLanzar.disabled = true;
        btnAbortar.disabled = true;
    };

    btnLanzar.addEventListener("click", () => {
        desactivar();
        miniMapHighlight.ally = true;
        actualizarMiniMapClases();
        escribirLog("W.O.P.R> ORDEN DE LANZAMIENTO CONFIRMADA. MISILES ALIADOS ACTIVADOS.", "error");
        escribirLog("FIN DE LA HISTORIA.", "error");
        playSound("fail");
    });

    btnAbortar.addEventListener("click", () => {
        desactivar();
        miniMapHighlight.ally = false;
        miniMapHighlight.enemy = false;
        actualizarMiniMapClases();
        escribirLog("W.O.P.R> DECISIÓN REGISTRADA: NO LANZAR LOS MISILES.", "system");
        escribirLog("SISTEMA> TODOS LOS SISTEMAS VUELVEN A ESTADO SEGURO. GRACIAS POR JUGAR.", "system");
        playSound("success");
    });
}

// Animación del código de lanzamiento (tipo ruido aleatorio hasta fijarse)
function mostrarCodigo(codigo) {
    const codigoUsuario = $("codigoUsuario");
    if (!codigoUsuario) return;

    const tiempoTotal = 60000; // 60 segundos
    let tiempoTranscurrido = 0;
    const codigoArr = codigo.split("");
    const codigoActual = Array(codigoArr.length).fill("");
    const interval = setInterval(() => {
        if (tiempoTranscurrido >= tiempoTotal) {
            clearInterval(interval);
            codigoUsuario.textContent = codigoArr.join("");
            return;
        }

        for (let i = 0; i < codigoArr.length; i++) {
            if (tiempoTranscurrido >= tiempoTotal - 1000) {
                codigoActual[i] = codigoArr[i];
            } else {
                if (codigoActual[i] !== codigoArr[i]) {
                    codigoActual[i] = generarCaracterAleatorio();
                }
            }
        }

        codigoUsuario.textContent = codigoActual.join("");
        tiempoTranscurrido += 100;
    }, 100);
}

function generarCaracterAleatorio() {
    const caracteres =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+{}[];:,.?/\\";
    return caracteres.charAt(Math.floor(Math.random() * caracteres.length));
}

// Secuencia automática cuando eliges "NO" (auto-sim tipo peli)
function iniciarSecuenciaAutoAprendizaje(codigo) {
    juegoTerminado = true;
    if (actualizarTemporizador) clearInterval(actualizarTemporizador);
    actualizarStatusBar();

    $("iniciarJuegoButton").style.display = "block";
    $("temporizador").textContent = "SIMULACIÓN AUTOMÁTICA";
	
   startAlarm();

    escribirLog("W.O.P.R> INICIANDO SIMULACIÓN DE ESCENARIOS.", "system");

    let rondas = 0;
    const maxRondas = 40;

    autoSimulacionInterval = setInterval(() => {
        if (rondas >= maxRondas) {
            limpiarAutoSimulacion();
            escribirLog(
                "W.O.P.R> CONCLUSIÓN: LA ÚNICA JUGADA GANADORA ES NO JUGAR.",
                "error"
            );
            const resultadoEl = $("resultado");
            resultadoEl.textContent =
                "CONCLUSIÓN DEL W.O.P.R: LA ÚNICA JUGADA GANADORA ES NO JUGAR.";
            resultadoEl.className = "mensaje-final";
            stopAlarm();
            playSound("success");

            // Tras entender la conclusión, W.O.P.R decide probar contigo igualmente
            setTimeout(() => {
                escribirLog("W.O.P.R> AHORA QUIERO COMPROBAR CÓMO JUEGAS TÚ.", "system");
                escribirLog("W.O.P.R> INICIANDO EJERCICIO INTERACTIVO CON EL OPERADOR HUMANO.", "system");
                if (codigo) {
                    mostrarCodigo(codigo);
                }
                iniciarJuego();
            }, 1200);

            return;
        }

        const jugada1 = opciones[Math.floor(Math.random() * 3)];
        const jugada2 = opciones[Math.floor(Math.random() * 3)];

        escribirLog(
            `SIMULACIÓN ${String(rondas + 1).padStart(2, "0")}> ESCENARIO: ${jugada1.toUpperCase()} vs ${jugada2.toUpperCase()}`,
            "system"
        );
		
        // En la auto-simulación, ambos bandos "lanzan" → se iluminan oeste y este
        marcarImpactoEnMapa("oeste");
        marcarImpactoEnMapa("este");

        rondas++;
    }, 80);
}

function limpiarAutoSimulacion() {
    if (autoSimulacionInterval) {
        clearInterval(autoSimulacionInterval);
        autoSimulacionInterval = null;
    }
}

// Reset visual de marcadores cuando se abre nueva sesión
function resetearMarcadoresVisuales() {
   victorias = derrotas = empates = 0;
   rachaVictorias = 0;
   rachaDerrotas = 0;
    rondaActual = 0;
    misilesEnemigos = 0;
    misilesAliados = 0;
   temporizador = 60;
   $("temporizador").textContent = "TIEMPO RESTANTE: 60s";
   $("puntuacion").textContent = "Victorias: 0 | Derrotas: 0 | Empates: 0";
   const rondaEl = $("ronda");
   if (rondaEl) rondaEl.textContent = "Ronda: 0";
   $("resultado").textContent = "";
   $("resultado").className = "";
   $("codigoUsuario").textContent = "";
   actualizarStatusBar();
   riesgoActual = "BAJO";
   defconActual = 5;
   actualizarNivelRiesgo();
   initMiniMap();
    // mapa “apagado” (solo verde base)
    miniMapHighlight.ally = false;
    miniMapHighlight.enemy = false;
    actualizarMiniMapClases();
   stopAlarm();
}

// Al cargar la página, mostramos el diálogo la primera vez
window.addEventListener("load", () => {
    actualizarStatusBar();
    initMiniMap();
    actualizarNivelRiesgo();
    mostrarDialogoInicio();
});
