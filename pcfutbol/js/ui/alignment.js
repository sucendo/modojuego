/**
 * Alineación (XI/banquillo/no convocados).
 * La vista de Tácticas vive en /ui/tactics.js.
 */

import { GameState } from '../state.js';
import { createFlagImgElement } from './utils/flags.js';
import { getPlayerGameAge } from './utils/calendar.js';
import {
  ensureClubTactics,
  autoPickMatchdaySquad,
  getFormationSlots,
  assignPlayersToSlots,
  isPlayerUnavailable,
  isPlayerInjuredNow,
  isPlayerSuspendedNow
} from '../game/utils/index.js';

let bound = false;
let selectedPlayerId = null;
let selectionCssInjected = false;
let headerTooltipsApplied = false;

const SIGLA_TOOLTIPS = {
  EN: 'Energía / Fit: “combustible” disponible para rendir en el partido (baja con el esfuerzo).',
  CF: 'Condición física (ritmo + resistencia + fuerza)',
  CM: 'Mental (visión + compostura + trabajo + liderazgo)',
  CD: 'Capacidad defensiva (entrada + fuerza + trabajo + compostura)',
  CO: 'Capacidad ofensiva (tiro + regate + pase + visión)',
  MO: 'Moral',
  EF: 'Estado de forma: condición física global (resultado del entrenamiento; eficiencia aeróbica/anaeróbica).',
  ME: 'Media: valor global calculado (resumen de capacidades).',
  ROL: 'Rol principal según posición',
  DEM: 'Demarcación / Posición',
  ESTADO: 'Estado: disponible / lesionado / sancionado',
};

/*
🧤 Portero
GK – Portero
🛡️ Defensa
RB – Lateral derecho
LB – Lateral izquierdo
CB – Central
RWB – Carrilero derecho
LWB – Carrilero izquierdo
⚙️ Centro del campo
CDM – Pivote defensivo
CM – Interior / mixto
CAM – Mediapunta
RM – Interior derecho
LM – Interior izquierdo
⚔️ Ataque
RW – Extremo derecho
LW – Extremo izquierdo
CF – Delantero móvil / falso 9
ST – Delantero centro
*/

const DEMARCATION_LABELS = {
  GK: 'Portero',
  RB: 'Lateral derecho',
  LB: 'Lateral izquierdo',
  CB: 'Defensa central',
  RWB: 'Carrilero derecho',
  LWB: 'Carrilero izquierdo',
  CDM: 'Pivote defensivo',
  CM:'Interior / mixto',
  CAM: 'Mediapunta',
  RM :'Interior derecho',
  LM :'Interior izquierdo',
  RW: 'Extremo derecho',
  LW : 'Extremo izquierdo',
  CF: 'Delantero móvil / falso 9',
  ST: 'Delantero centro',
};

const ROLE_DESCRIPTIONS = {
  // Roles “humanos” típicos; si tu motor devuelve otros nombres, añade aquí
  Portero: 'Guardameta: seguridad bajo palos, juego con pies y reflejos.',
  Lateral: 'Lateral: apoyo por banda, centros, recorridos y ayudas defensivas.',
  Central: 'Central: marcaje, anticipación y juego aéreo.',
  Pivote: 'Pivote: equilibrio, robo, posicionamiento y salida limpia.',
  Organizador: 'Organizador: distribuye y marca el ritmo (pase + visión).',
  BoxToBox: 'Box to Box: ida y vuelta, llegada y trabajo constante.',
  Mediapunta: 'Mediapunta: último pase, creatividad y llegada al área.',
  Extremo: 'Extremo: desborde por banda, centros/diagonal y 1vs1.',
  Delantero: 'Delantero: desmarque, definición y remate.',
};

function dispatchLineupChanged() {
  document.dispatchEvent(new CustomEvent('pcf:lineupChanged'));
}

function getRoleLabelFromPosition(pos) {
  const p = String(pos || '').toUpperCase();
  if (p === 'POR' || p === 'GK') return 'Portero';
  if (['LD','LI','RB','LB','RD'].includes(p)) return 'Lateral';
  if (['DFC','CB'].includes(p)) return 'Central';
  if (['MCD','DM'].includes(p)) return 'Pivote';
  if (['MC','CM','MD','MI'].includes(p)) return 'Organizador';
  if (['MCO','AM','MP','SS'].includes(p)) return 'Mediapunta';
  if (['ED','EI','RW','LW'].includes(p)) return 'Extremo';
  if (['DC','ST'].includes(p)) return 'Delantero';
  return '';
}

function getDemarcationTooltip(player) {
  const code = (player?.position || player?.demarcation || '').toString().trim().toUpperCase();
  if (!code) return 'Demarcación';
  const label = DEMARCATION_LABELS[code];
  return label ? `Demarcación: ${label} (${code})` : `Demarcación: ${code}`;
}

function getRoleTooltip(player, roleText) {
  const role = (roleText || '').toString().trim();
  if (!role) return 'Rol';
  // 1) match directo
  if (ROLE_DESCRIPTIONS[role]) return `Rol: ${role}. ${ROLE_DESCRIPTIONS[role]}`;
  // 2) heurística por palabras (por si el motor devuelve “Lateral Ofensivo”, “Delantero Referencia”, etc.)
  const r = role.toLowerCase();
  const pick =
    (r.includes('port') && ROLE_DESCRIPTIONS.Portero) ||
    (r.includes('lateral') && ROLE_DESCRIPTIONS.Lateral) ||
    (r.includes('central') && ROLE_DESCRIPTIONS.Central) ||
    ((r.includes('pivote') || r.includes('mcd') || r.includes('ancla')) && ROLE_DESCRIPTIONS.Pivote) ||
    ((r.includes('organ') || r.includes('cread') || r.includes('play')) && ROLE_DESCRIPTIONS.Organizador) ||
    ((r.includes('box') || r.includes('todocamp')) && ROLE_DESCRIPTIONS.BoxToBox) ||
    ((r.includes('media') || r.includes('engan') || r.includes('mp')) && ROLE_DESCRIPTIONS.Mediapunta) ||
    (r.includes('extrem') && ROLE_DESCRIPTIONS.Extremo) ||
    ((r.includes('delant') || r.includes('punta') || r.includes('9')) && ROLE_DESCRIPTIONS.Delantero) ||
    '';
  return pick ? `Rol: ${role}. ${pick}` : `Rol: ${role}`;
}

function applyHeaderTooltips() {
  if (headerTooltipsApplied) return;
  // Ajusta este id si tu contenedor de la pestaña se llama distinto
  const root = document.getElementById('tab-alignment') || document;

  root.querySelectorAll('th').forEach((th) => {
    const key = (th.textContent || '').trim().toUpperCase();
    const tip = SIGLA_TOOLTIPS[key];
    if (!tip) return;
    th.title = tip;
    th.setAttribute('aria-label', tip);
  });

  headerTooltipsApplied = true;
}

// Normaliza IDs que vienen del DOM (dataset siempre es string).
// Si el club usa ids numéricos, convierte "123" -> 123 para que coincida con p.id/lineup.
function normalizePlayerId(id, club) {
  if (id == null) return null;
  if (typeof id === 'number') return id;
  const s = String(id).trim();
  if (!s) return null;
  const clubUsesNumberIds =
    Array.isArray(club?.players) && typeof club.players[0]?.id === 'number';
  if (clubUsesNumberIds && /^\d+$/.test(s)) return Number(s);
  return s;
}

function normalizeIdArray(arr, club) {
  const src = Array.isArray(arr) ? arr : [];
  return src.map((id) => normalizePlayerId(id, club)).filter((id) => id != null);
}

function ensureSelectionCss() {
  if (selectionCssInjected) return;
  selectionCssInjected = true;
  const style = document.createElement('style');
  style.id = 'pcf-alignment-selection-style';
  style.textContent = `
    /* Selección tabla: borde iluminado + fondo suave */
    tr.pcf-selected-row {
      position: relative;
    }
    tr.pcf-selected-row td {
      background: rgba(255,255,255,0.10);
    }
    tr.pcf-selected-row::after {
		content: "";
		position: absolute;
		inset: -1px;
		border-radius: 1px;
		pointer-events: none;
		border-top: 1px solid rgba(255, 255, 255, 0.55);
		border-bottom: 1px solid rgba(255, 255, 255, 0.55);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.12), 0 0 12px rgba(255, 255, 255, 0.35);
		max-width: 100%;
		left: 0;
    }

    /* Selección en el campo: glow circular */
    .pcf-dot.pcf-selected-dot {
      border-radius: 999px;
      box-shadow:
        0 0 0 2px rgba(255,255,255,0.65),
        0 0 0 6px rgba(255,255,255,0.14),
        0 0 16px rgba(255,255,255,0.40);
    }
  `;
  document.head.appendChild(style);
}

function paintSelection() {
  // Tabla
  document.querySelectorAll('tr[data-player-id]').forEach((tr) => {
    tr.classList.toggle('pcf-selected-row', tr.dataset.playerId === String(selectedPlayerId));
  });
  // Campo
  document.querySelectorAll('.pcf-dot[data-player-id]').forEach((dot) => {
    dot.classList.toggle('pcf-selected-dot', dot.dataset.playerId === String(selectedPlayerId));
  });
}

const FORMATIONS = ['4-4-2','4-3-3','4-2-3-1','3-5-2','3-4-3','5-3-2'];
const MENTALITIES = [
  { v:'DEFENSIVE', t:'Defensiva' },
  { v:'BALANCED',  t:'Equilibrada' },
  { v:'ATTACKING', t:'Ofensiva' },
];
const TEMPOS = [
  { v:'SLOW',   t:'Lento' },
  { v:'NORMAL', t:'Normal' },
  { v:'FAST',   t:'Rápido' },
];
const PRESSURES = [
  { v:'LOW',    t:'Baja' },
  { v:'NORMAL', t:'Media' },
  { v:'HIGH',   t:'Alta' },
];

function getUserClub() {
  const clubId = GameState.user?.clubId;
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  if (clubs.length === 0) return null;
  if (!clubId) return clubs[0];
  return clubs.find((c) => c.id === clubId) || clubs[0];
}

function formatPercent01(v) {
  if (v == null || Number.isNaN(v)) return '-';
  const clamped = Math.max(0, Math.min(1, Number(v)));
  return String(Math.round(clamped * 100));
}

function formatAttr(v) {
  if (v == null || Number.isNaN(v)) return '-';
  return String(Math.round(Number(v)));
}

function getRoleFromPosition(pos) {
  const p = String(pos || '').toUpperCase();
  if (p === 'POR' || p === 'GK') return 'POR';
  if (p.startsWith('D') || ['RB','LB','CB','RWB','LWB'].includes(p)) return 'DEF';
  if (p.startsWith('M') || ['CDM','CM','CAM','RM','LM'].includes(p)) return 'MED';
  return 'DEL';
}

function getDemarcation(pos) {
  return String(pos || '-').toUpperCase();
}

function computePCFParams(p) {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n)));
  const overall = Number.isFinite(Number(p?.overall)) ? Number(p.overall) : 50;

  // EN = Energía (fitness 0..1 -> 0..100). Si falta, fallback a overall.
  const enRaw = p?.fitness != null ? Math.round(clamp(p.fitness, 0, 1) * 100) : null;
  const EN = enRaw != null ? enRaw : Math.round(overall);
  const tech = p?.attributes?.technical || {};
  const ment = p?.attributes?.mental || {};
  const phys = p?.attributes?.physical || {};

  const avg = (...xs) => {
    const vals = xs.filter((n) => typeof n === 'number' && Number.isFinite(n));
    if (!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0) / vals.length;
  };

  const CF = avg(phys.pace, phys.stamina, phys.strength) ?? overall;
  const CM = avg(ment.vision, ment.composure, ment.workRate, ment.leadership) ?? overall;
  const CD = avg(tech.tackling, phys.strength, ment.workRate, ment.composure) ?? overall;
  const CO = avg(tech.shooting, tech.dribbling, tech.passing, ment.vision) ?? overall;
 
  const MO = p?.morale != null ? Math.round(clamp(p.morale, 0, 1) * 100) : null;

  // EF = Forma (player.form suele ser -3..+3). Lo mapeamos a 0..100
  // -3 => 5, 0 => 50, +3 => 95 (suave y útil visualmente)
  const form = (p?.form != null && Number.isFinite(Number(p.form))) ? Number(p.form) : null;
  const EF = form != null ? Math.round(clamp(50 + clamp(form, -3, 3) * 15, 0, 100)) : null;

  const MEraw = avg(CF, CM, CD, CO) ?? overall;
  // ME = Media del jugador (prioriza overall; si no existe, usa la media PCF)
  const MEbase = Number.isFinite(overall) ? overall : MEraw;
  const ME = MEbase != null ? Math.round(clamp(MEbase, 1, 99)) : null;

  return {
    EN,
    CF: Math.round(clamp(CF, 1, 99)),
    CM: Math.round(clamp(CM, 1, 99)),
    CD: Math.round(clamp(CD, 1, 99)),
    CO: Math.round(clamp(CO, 1, 99)),
    MO: MO != null ? Math.round(clamp(MO, 0, 100)) : null,
    EF: EF != null ? Math.round(clamp(EF, 0, 100)) : null,
    ME,
    ROL: getRoleFromPosition(p?.position),
    DEM: getDemarcation(p?.position),
  };
}

function fillSelect(select, options, currentValue) {
  if (!select) return;
  select.innerHTML = '';
  options.forEach((o) => {
    const opt = document.createElement('option');
    if (typeof o === 'string') { opt.value = o; opt.textContent = o; }
    else { opt.value = o.v; opt.textContent = o.t; }
    select.appendChild(opt);
  });
  if (currentValue != null) select.value = currentValue;
}

export function initAlignmentUI() {
  if (bound) return;
  bound = true;
  
  // Si Tácticas mueve posiciones o cambia formación -> repintar campo aquí
  document.addEventListener('pcf:tacticsChanged', () => updateTacticsView());

  // Mantener Alineación sincronizada con cambios desde la pestaña Tácticas
  document.addEventListener('pcf:tacticsChanged', updateAlignmentView);
  document.addEventListener('pcf:lineupChanged', updateAlignmentView);

  const xiBody = document.getElementById('alignment-xi-body');
  const benchBody = document.getElementById('alignment-bench-body');
  const outBody = document.getElementById('alignment-out-body');
  const pitch = document.getElementById('alignment-pitch');

  const bindBody = (tbody) => {
    if (!tbody) return;
    tbody.addEventListener('click', (e) => {
      const row = e.target?.closest?.('tr[data-player-id]');
      const pid = row?.dataset?.playerId || null;
      if (!pid) return;

      handlePlayerClick(pid);
    });
  };

  bindBody(xiBody);
  bindBody(benchBody);
  bindBody(outBody);

  pitch?.addEventListener('click', (e) => {
    const dot = e.target?.closest?.('.pcf-dot[data-player-id]');
    const pid = dot?.dataset?.playerId;
    if (!pid) return;
    handlePlayerClick(pid);
  });
}

function getPlayerGroup(club, playerId) {
  if (!club || !playerId) return 'OUT';
  if (Array.isArray(club.lineup) && club.lineup.includes(playerId)) return 'XI';
  if (Array.isArray(club.bench) && club.bench.includes(playerId)) return 'BENCH';
  return 'OUT';
}

function swapPlayersInArray(arr, a, b) {
  const next = Array.isArray(arr) ? arr.slice() : [];
  const ia = next.indexOf(a);
  const ib = next.indexOf(b);
  if (ia === -1 || ib === -1) return next;
  next[ia] = b;
  next[ib] = a;
  return next;
}

function normalizeLineupBench(club) {
  if (!club) return;
  if (!Array.isArray(club.lineup)) club.lineup = [];
  if (!Array.isArray(club.bench)) club.bench = [];

  // IMPORTANT: normaliza tipos de ID (p.ej. "12" -> 12 si los players usan ids numéricos)
  club.lineup = normalizeIdArray(club.lineup, club);
  club.bench  = normalizeIdArray(club.bench, club);

  club.lineup = Array.from(new Set(club.lineup)).slice(0, 11);
  const setXI = new Set(club.lineup);
  club.bench = Array.from(new Set(club.bench)).filter((id) => id && !setXI.has(id)).slice(0, 9);
}

function swapPlayersBetweenGroups(club, aId, bId) {
  if (!club || !aId || !bId || aId === bId) return;
  ensureClubTactics(club);
  // Asegura consistencia de ids antes de operar (evita que includes/indexOf fallen)
  normalizeLineupBench(club);

  const aGroup = getPlayerGroup(club, aId);
  const bGroup = getPlayerGroup(club, bId);

  const xi = Array.isArray(club.lineup) ? club.lineup.slice() : [];
  const bench = Array.isArray(club.bench) ? club.bench.slice() : [];

  const iaXI = xi.indexOf(aId);
  const ibXI = xi.indexOf(bId);
  const iaB = bench.indexOf(aId);
  const ibB = bench.indexOf(bId);

  // 1) mismo grupo: swap orden
  if (aGroup === 'XI' && bGroup === 'XI') {
    club.lineup = swapPlayersInArray(xi, aId, bId);
    normalizeLineupBench(club);
    return;
  }
  if (aGroup === 'BENCH' && bGroup === 'BENCH') {
    club.bench = swapPlayersInArray(bench, aId, bId);
    normalizeLineupBench(club);
    return;
  }
  if (aGroup === 'OUT' && bGroup === 'OUT') return;

  // 2) XI <-> BENCH
  if ((aGroup === 'XI' && bGroup === 'BENCH') || (aGroup === 'BENCH' && bGroup === 'XI')) {
    const xiIdx = aGroup === 'XI' ? iaXI : ibXI;
    const benchIdx = aGroup === 'BENCH' ? iaB : ibB;
    const xiId = aGroup === 'XI' ? aId : bId;
    const benchId = aGroup === 'BENCH' ? aId : bId;

    const nextXI = xi.slice();
    const nextB = bench.slice();
    if (xiIdx >= 0) nextXI[xiIdx] = benchId;
    if (benchIdx >= 0) nextB[benchIdx] = xiId;
    club.lineup = nextXI;
    club.bench = nextB;
    normalizeLineupBench(club);
    return;
  }

  // 3) XI <-> OUT
  if ((aGroup === 'XI' && bGroup === 'OUT') || (aGroup === 'OUT' && bGroup === 'XI')) {
    const xiIdx = aGroup === 'XI' ? iaXI : ibXI;
    const xiId = aGroup === 'XI' ? aId : bId;
    const outId = aGroup === 'OUT' ? aId : bId;

    const nextXI = xi.slice();
    if (xiIdx >= 0) nextXI[xiIdx] = outId;
    club.lineup = nextXI;
    // evita duplicados accidentales
    club.bench = bench.filter((id) => id !== outId && id !== xiId);
    normalizeLineupBench(club);
    return;
  }

  // 4) BENCH <-> OUT
  if ((aGroup === 'BENCH' && bGroup === 'OUT') || (aGroup === 'OUT' && bGroup === 'BENCH')) {
    const benchIdx = aGroup === 'BENCH' ? iaB : ibB;
    const benchId = aGroup === 'BENCH' ? aId : bId;
    const outId = aGroup === 'OUT' ? aId : bId;

    const nextB = bench.slice();
    if (benchIdx >= 0) nextB[benchIdx] = outId;
    club.bench = nextB;
    club.lineup = xi.filter((id) => id !== outId && id !== benchId);
    normalizeLineupBench(club);
    return;
  }

  normalizeLineupBench(club);
}

function handlePlayerClick(playerId) {
  const club = getUserClub();
  if (!club) return;
  const pid = normalizePlayerId(playerId, club);
  if (pid == null) return;
  ensureClubTactics(club);
  normalizeLineupBench(club);

  // 1) No hay selección previa: seleccionar y marcar
  if (selectedPlayerId == null) {
    selectedPlayerId = pid;
    updateAlignmentView();
    return;
  }

  // 2) Click en el mismo: deseleccionar
  if (selectedPlayerId === pid) {
    selectedPlayerId = null;
    updateAlignmentView();
    return;
  }

  // 3) Segundo click: swap y limpiar selección (reinicia el proceso)
  swapPlayersBetweenGroups(club, selectedPlayerId, pid);
  selectedPlayerId = null;
  // Notifica a otras vistas (y esta misma está suscrita a lineupChanged)
  dispatchLineupChanged();
}

export function updateAlignmentView() {
   ensureSelectionCss();
   applyHeaderTooltips();
  const club = getUserClub();
  if (!club) return;

  ensureClubTactics(club);

  // Normalizar XI/banquillo (incluye normalización de tipos de ID)
  normalizeLineupBench(club);

  const players = Array.isArray(club.players) ? club.players.slice() : [];
  const byId = new Map(players.map((p) => [p.id, p]));

  const xiBody = document.getElementById('alignment-xi-body');
  const benchBody = document.getElementById('alignment-bench-body');
  const outBody = document.getElementById('alignment-out-body');
  if (!xiBody || !benchBody || !outBody) return;

  xiBody.innerHTML = '';
  benchBody.innerHTML = '';
  outBody.innerHTML = '';

  const xiIds = club.lineup.filter((id) => byId.has(id));
  const benchIds = club.bench.filter((id) => byId.has(id));
  const squadSet = new Set([...xiIds, ...benchIds]);

  const outPlayers = players
    .filter((p) => p && p.id && !squadSet.has(p.id))
    .slice()
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  const renderRow = (p, group) => {
    const injured = isPlayerInjuredNow(p);
    const suspended = isPlayerSuspendedNow(p);
    const unavailable = injured || suspended;

    const tr = document.createElement('tr');
    tr.dataset.playerId = String(p.id);
    if (String(selectedPlayerId) === String(p.id)) tr.classList.add('pcf-selected-row');
    if (unavailable) tr.classList.add('row-disabled');

    const statusText =
      injured && suspended ? 'Les./Sanc.' :
      injured ? `Les. (${p.injury?.matchesRemaining ?? '?'})` :
      suspended ? `Sanc. (${p.suspension?.matchesRemaining ?? '?'})` :
      '-';

    const params = computePCFParams(p);

    const td = (text) => {
      const x = document.createElement('td');
      x.textContent = text == null ? '-' : String(text);
      return x;
    };

    // #
    tr.appendChild(td(p.shirtNumber ?? p.number ?? '-'));

    // Jugador + bandera
    const tdName = document.createElement('td');
    tdName.className = 'squad-player-name-cell';
    const flag = createFlagImgElement(p.nationality);
    if (flag) tdName.appendChild(flag);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = p.name || 'Jugador';
    tdName.appendChild(nameSpan);
    tr.appendChild(tdName);

    // EN..ME + ROL/DEM
    tr.appendChild(td(params.EN));
    tr.appendChild(td(params.CF != null ? Math.round(params.CF) : '-'));
    tr.appendChild(td(params.CM != null ? Math.round(params.CM) : '-'));
    tr.appendChild(td(params.CD != null ? Math.round(params.CD) : '-'));
    tr.appendChild(td(params.CO != null ? Math.round(params.CO) : '-'));
    tr.appendChild(td(params.MO != null ? params.MO : '-'));
    tr.appendChild(td(params.EF != null ? params.EF : '-'));
    tr.appendChild(td(params.ME != null ? Math.round(params.ME) : '-'));
	
    // ROL (tooltip por jugador)
    const tdRol = td(params.ROL);
    const roleLabel = getRoleLabelFromPosition(p.position);
    tdRol.title = getRoleTooltip(p, roleLabel || params.ROL);
    tr.appendChild(tdRol);

    // DEM (tooltip por jugador)
    const tdDem = td(params.DEM);
    tdDem.title = getDemarcationTooltip(p);
    tr.appendChild(tdDem);
	
    tr.appendChild(td(statusText));

    // columna vacía (se mantiene el layout de la tabla sin “controles”)
    tr.appendChild(document.createElement('td'));

    return tr;
  };

  //xiIds.map((id) => byId.get(id)).filter(Boolean).forEach((p) => xiBody.appendChild(renderRow(p, 'XI')));
  getOrderedXIPlayers(club, xiIds, byId).forEach((p) => xiBody.appendChild(renderRow(p, 'XI')));
  benchIds.map((id) => byId.get(id)).filter(Boolean).forEach((p) => benchBody.appendChild(renderRow(p, 'BENCH')));
  outPlayers.forEach((p) => outBody.appendChild(renderRow(p, 'OUT')));

  updateXIcount(club);

  // La tarjeta puede mostrar un jugador “por defecto”, pero NO debe auto-seleccionar.
  const cardPlayer =
    (selectedPlayerId != null && byId.get(selectedPlayerId)) ||
    (xiIds[0] && byId.get(xiIds[0])) ||
    null;
  renderPlayerCard(cardPlayer);
  
  // Media del equipo titular (XI)
  renderTeamCard(computeXIteamAverages(club, xiIds, byId));
  
  renderPitch(club);
  paintSelection();
}

function updateXIcount(club) {
  const label = document.getElementById('alignment-xi-count');
  if (!label) return;
  const c = Array.isArray(club.lineup) ? club.lineup.length : 0;
  const b = Array.isArray(club.bench) ? club.bench.length : 0;
  label.textContent = `${c}/11 titulares • ${b}/9 convocados`;
}

function getOrderedXIPlayers(club, xiIds, byId) {
  const xiPlayers = xiIds.map((id) => byId.get(id)).filter(Boolean);
  const formation = club.tactics?.formation || '4-4-2';

  // Mapa playerId -> coords del slot asignado (x = vertical, y = profundidad)
  const coordById = new Map();
  try {
    const slots = getFormationSlots(formation);
    const assigned = assignPlayersToSlots(xiPlayers, slots);
    assigned.forEach((s) => {
      if (!s?.player?.id) return;
      coordById.set(String(s.player.id), {
        x: s.x ?? 50,
        y: s.y ?? 50,
      });
    });
  } catch (_) {
    // si algo falla, devolvemos el orden actual sin romper la UI
    return xiPlayers;
  }

  const isGK = (p) => /^(POR|GK)$/i.test(p?.position || '');

  // Orden:
  // 1) Portero primero
  // 2) De más retrasado a más adelantado => y DESC (recuerda: en renderPitch left = 100 - y)
  // 3) Dentro de cada línea, de izquierda a derecha => x ASC (top = x)
  return xiPlayers.slice().sort((a, b) => {
    const agk = isGK(a);
    const bgk = isGK(b);
    if (agk !== bgk) return agk ? -1 : 1;

    const ca = coordById.get(String(a.id));
    const cb = coordById.get(String(b.id));

    const ay = ca?.y ?? -999;
    const byy = cb?.y ?? -999;
    if (ay !== byy) return byy - ay; // y DESC (más atrás primero)

    const ax = ca?.x ?? 999;
    const bx = cb?.x ?? 999;
    if (ax !== bx) return ax - bx; // x ASC (izq -> dcha)

    const an = a.name || '';
    const bn = b.name || '';
    return an.localeCompare(bn);
  });
}

function renderPlayerCard(player) {
  const root = document.getElementById('alignment-player-card');
  if (!root) return;
  root.innerHTML = '';

  if (!player) {
    root.innerHTML = `<div class="pcf-box pcf-kv-item"><span>Jugador</span><strong>-</strong></div>`;
    return;
  }

  const injured = isPlayerInjuredNow(player);
  const suspended = isPlayerSuspendedNow(player);
  const statusText = injured ? 'Lesionado' : suspended ? 'Sancionado' : 'Disponible';
  const statusClass = injured ? 'pcf-status-bad' : suspended ? 'pcf-status-warn' : 'pcf-status-ok';

  const tech = player.attributes?.technical || {};
  const ment = player.attributes?.mental || {};
  const phys = player.attributes?.physical || {};
  const pcf = computePCFParams(player);

  const age = typeof getPlayerGameAge === 'function' ? getPlayerGameAge(player) : null;
  const ageText = age != null ? `${age} años` : '—';

  const mk = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };

  // TOP
  const top = mk('div','pcf-pcard-top');
  const left = mk('div','');
  left.appendChild(mk('div','pcf-pcard-name', player.name || 'Jugador'));
  left.appendChild(mk('div','pcf-pcard-sub',
    `${player.position || '-'} • ${player.nationality || '—'} • ${ageText}`
  ));
  const ov = mk('div','pcf-pcard-ov');
  ov.appendChild(mk('div','v', player.overall != null ? String(player.overall) : '--'));
  ov.appendChild(mk('div','t','MEDIA'));
  top.appendChild(left);
  top.appendChild(ov);

  // INFO (cuadritos + “retrato”)
  const info = mk('div','pcf-pcard-info');
  const kv = mk('div','pcf-pcard-kv');
  const kvItem = (k,v) => {
    const box = mk('div','pcf-box pcf-kv-item');
    box.appendChild(mk('span','',k));
    box.appendChild(mk('strong','',v));
    return box;
  };
  kv.appendChild(kvItem('País', player.nationality || '—'));
  kv.appendChild(kvItem('Edad', ageText));
  kv.appendChild(kvItem('Nac.', player.birthDate || '—'));
  kv.appendChild(kvItem('Pie', player.foot || '—'));

  const portrait = mk('div','pcf-pcard-portrait');
  const initials = (player.name || 'J').split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase();
  portrait.appendChild(mk('div','',initials));
  // bandera pequeña (si existe)
  const flag = createFlagImgElement(player.nationality);
  if (flag) {
    flag.classList.add('flag');
    portrait.style.position = 'relative';
    portrait.appendChild(flag);
  }

  info.appendChild(kv);
  info.appendChild(portrait);

  // STATS (dos columnas en cuadritos)
  const stats = mk('div','pcf-pcard-stats');
  const statBox = (label, value) => {
    const box = mk('div','pcf-box pcf-stat');
    box.appendChild(mk('span','l',label));
    box.appendChild(mk('span','r',formatAttr(value)));
    return box;
  };
  // Columna “física/defensa”
  const colA = mk('div','');
  colA.appendChild(statBox('Velocidad', phys.pace));
  colA.appendChild(statBox('Resistencia', phys.stamina));
  colA.appendChild(statBox('Pot. física', phys.strength));
  colA.appendChild(statBox('Entrada', tech.tackling));
  colA.appendChild(statBox('Trabajo', ment.workRate));
  // Columna “ofensiva/mental”
  const colB = mk('div','');
  colB.appendChild(statBox('Pase', tech.passing));
  colB.appendChild(statBox('Regate', tech.dribbling));
  colB.appendChild(statBox('Finalización', tech.shooting));
  colB.appendChild(statBox('Visión', ment.vision));
  colB.appendChild(statBox('Compostura', ment.composure));
  colB.appendChild(statBox('Liderazgo', ment.leadership));
  stats.appendChild(colA);
  stats.appendChild(colB);

  // RESUMEN PCF (cuadritos tipo “C. Física / C. Mental / …”)
  const summary = mk('div','pcf-pcard-summary');
  const pill = (k, v) => {
    const el = mk('div','pcf-pill');
    el.appendChild(mk('span','',k));
    el.appendChild(mk('strong','', v != null ? String(Math.round(v)) : '-'));
    return el;
  };
  summary.appendChild(pill('C. Física', pcf.CF));
  summary.appendChild(pill('C. Mental', pcf.CM));
  summary.appendChild(pill('C. Defens.', pcf.CD));
  summary.appendChild(pill('C. Ofens.', pcf.CO));
  summary.appendChild(pill('Moral', pcf.MO));
  summary.appendChild(pill('Forma', pcf.EF));

  // FOOTER (estado abajo)
  const footer = mk('div','pcf-pcard-footer');
  const leftFooter = mk('div','');
  leftFooter.textContent = `Energía ${formatPercent01(player.fitness)}% • Moral ${formatPercent01(player.morale)}%`;
  const badge = mk('div',`pcf-status-badge ${statusClass}`, statusText);
  footer.appendChild(leftFooter);
  footer.appendChild(badge);

  root.appendChild(top);
  root.appendChild(info);
  root.appendChild(stats);
  root.appendChild(summary);
  root.appendChild(footer);
}

function roundInt(n) {
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function avg(nums) {
  const arr = (nums || []).filter((n) => Number.isFinite(n));
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeXIteamAverages(club, xiIds, byId) {
  const xiPlayers = (xiIds || []).map((id) => byId.get(id)).filter(Boolean);
  if (!xiPlayers.length) {
    return { CF: 0, CM: 0, CD: 0, CO: 0, MEDIA: 0 };
  }

  const pcfArr = xiPlayers.map((p) => computePCFParams(p));

  const CF = roundInt(avg(pcfArr.map((x) => x.CF)));
  const CM = roundInt(avg(pcfArr.map((x) => x.CM)));
  const CD = roundInt(avg(pcfArr.map((x) => x.CD)));
  const CO = roundInt(avg(pcfArr.map((x) => x.CO)));

  // MEDIA: usa overall si existe; si no, ME (media PCF)
  const mediaBase = xiPlayers.map((p, i) => (p.overall ?? pcfArr[i].ME));
  const MEDIA = roundInt(avg(mediaBase));

  return { CF, CM, CD, CO, MEDIA };
}

function renderTeamCard(teamAvg) {
  const root = document.getElementById('alignment-team-card');
  if (!root) return;
  root.innerHTML = '';

  const mk = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  const item = (label, value) => {
    const el = mk('div', 'pcf-team-item');
    el.appendChild(mk('span', '', label));
    el.appendChild(mk('strong', '', String(value)));
    return el;
  };

  const grid = mk('div', 'pcf-team-grid');
  const colL = mk('div', 'pcf-team-col');
  const colR = mk('div', 'pcf-team-col');
  const media = mk('div', 'pcf-team-media');
  media.appendChild(mk('div', 't', 'MEDIA'));
  media.appendChild(mk('div', 'v', String(teamAvg.MEDIA)));

  colL.appendChild(item('Capacidad Física', teamAvg.CF));
  colL.appendChild(item('Capacidad Mental', teamAvg.CM));
  colR.appendChild(item('Capacidad Defensiva', teamAvg.CD));
  colR.appendChild(item('Capacidad Ofensiva', teamAvg.CO));

  grid.appendChild(colL);
  grid.appendChild(colR);
  grid.appendChild(media);
  root.appendChild(grid);
}

function renderPitch(club) {
  const pitch = document.getElementById('alignment-pitch');
  if (!pitch) return;
  pitch.innerHTML = '';

  const byId = new Map((club.players || []).map((p) => [p.id, p]));
  const xiPlayers = (club.lineup || []).map((id) => byId.get(id)).filter(Boolean);

  const formation = club.tactics?.formation || club.alignment?.formation || '4-4-2';
  const slots = getFormationSlots(formation);
  const assigned = assignPlayersToSlots(xiPlayers, slots);

  assigned.forEach((slot) => {
    const p = slot.player;
    const dot = document.createElement('div');
    const unavailable = p ? isPlayerUnavailable(p) : false;
    dot.className = 'pcf-dot' + (unavailable ? ' is-unavailable' : '');

    // Campo horizontal: left = 100 - y, top = x
    // Si existe posición manual desde Tácticas, usarla
    const pid = p?.id != null ? String(p.id) : '';
    const manual = pid && club.tactics?.manualPositions ? club.tactics.manualPositions[pid] : null;
    const left = manual?.left != null ? manual.left : (100 - (slot.y ?? 50));
    const top  = manual?.top  != null ? manual.top  : (slot.x ?? 50);
    dot.style.left = `${left}%`;
    dot.style.top  = `${top}%`;
    dot.dataset.playerId = p?.id != null ? String(p.id) : '';
    dot.title = p ? `${p.name} (${p.position})` : '';
    dot.textContent = p?.shirtNumber ?? p?.number ?? (p?.position || '?');
    pitch.appendChild(dot);
  });
}