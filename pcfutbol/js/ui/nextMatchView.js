// js/ui/nextMatchView.js
// Vista 3/3 de Competición: PRÓXIMO PARTIDO (previa + postpartido)
// Inspiración UI: PC Fútbol (capturas proporcionadas)

import { GameState } from '../state.js';
import { getUserClub } from '../game/selectors.js';
import { advanceToNextUserMatchPrep } from '../game/simulateMatchday.js';
import {
  getGameDateFor,
  formatGameDateLabel,
  getFixtureKickoffDate,
  formatFixtureKickoffLabel,
} from './utils/calendar.js';
import { createCoatImgElement } from './utils/coats.js';
import { renderMatchTimeline } from './utils/matchTimeline.js';
import { getFormationSlots, assignPlayersToSlots } from './utils/tacticsState.js';

let __bound = false;
let __onOpenMatchDetail = null;
let __lastSimulatedMatchday = null;
let __liveTacticsBound = false;

// --------------------------
// Helpers
// --------------------------

function escapeHtml(v) {
  const s = String(v ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cssEscapeAttr(v) {
  const s = String(v ?? '');
  // CSS.escape está soportado en navegadores modernos. Fallback simple para IDs numéricos/alfanum.
  if (typeof CSS !== 'undefined' && CSS && typeof CSS.escape === 'function') return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_\-]/g, (ch) => '\\' + ch);
}

function stableHash(str) {
  const s = String(str || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function stableRand01(seedStr) {
  const h = stableHash(seedStr);
  // LCG
  let x = (h + 1013904223) >>> 0;
  x = (Math.imul(1664525, x) + 1013904223) >>> 0;
  return (x >>> 0) / 4294967295;
}

function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function int(n, d = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : d;
}

function buildClubIndex() {
  const map = new Map();
  (GameState.clubs || []).forEach((c) => {
    if (c?.id) map.set(c.id, c);
  });
  return map;
}

function buildPlayerIndex(clubs) {
  const map = new Map();
  (clubs || []).forEach((club) => {
    const players = Array.isArray(club?.players) ? club.players : [];
    players.forEach((p) => {
      if (p?.id) map.set(p.id, { player: p, club });
    });
  });
  return map;
}

function getClubName(club, fallbackId) {
  return (club && (club.name || club.shortName)) || fallbackId || '';
}

let __matchScreen = 'pre'; // 'pre' | 'post'
let __bindingsDone = false;

function setMatchScreen(screen) {
  __matchScreen = (screen === 'post') ? 'post' : 'pre';
  applyMatchScreen();
}

function applyMatchScreen() {
  const preCard = document.getElementById('nextmatch-card-pre');
  const postCard = document.getElementById('nextmatch-card-post');
  if (!preCard || !postCard) return;

  const showPost = (__matchScreen === 'post');
  preCard.classList.toggle('hidden', showPost);
  postCard.classList.toggle('hidden', !showPost);
}

function trySimulateFromMatchScreen() {
  // Preferimos disparar el mismo flujo que el botón oficial de "Simular jornada actual",
  // porque ahí se hace toda la contabilidad: matchday simulado, vistas, etc.
  const btn =
    document.getElementById('btn-simulate-current-matchday') ||
    document.getElementById('btn-simulate-matchday') ||
    document.querySelector('[data-action="simulate-matchday"]');

  if (btn) {
    btn.click();
    return true;
  }

  // Fallbacks (por si en algún refactor el botón desaparece)
  if (typeof window.simulateCurrentMatchday === 'function') {
    window.simulateCurrentMatchday();
    return true;
  }
  if (typeof window.simulateMatchday === 'function') {
    window.simulateMatchday();
    return true;
  }
  return false;
}

function ensureMatchScreenBindings() {
  if (__bindingsDone) return;
  __bindingsDone = true;

  const btnSim = document.getElementById('nextmatch-simulate');
  const btnCont = document.getElementById('nextmatch-continue');

  if (btnSim) {
    btnSim.addEventListener('click', () => {
      const ok = trySimulateFromMatchScreen();
      if (!ok) {
        console.warn('[nextMatchView] No se encontró función/botón de simular jornada.');
        return;
      }
      // El flujo oficial ya refresca las vistas. Forzamos ver el POST de la jornada recién simulada.
      updateNextMatchView();
      setMatchScreen('post');
    });
  }

  if (btnCont) {
    btnCont.addEventListener('click', () => {
      // Tras ver el post, dejar la pantalla lista para la siguiente previa...
      // para que al entrar de nuevo muestre el siguiente partido.
      __lastSimulatedMatchday = null;
      setMatchScreen('pre');
	  
      // Avanzar el mundo hasta 1 día antes del próximo partido (y simular lo ocurrido entre medias)
      try { advanceToNextUserMatchPrep(); } catch (e) { console.warn(e); }

       const btnDash = document.getElementById('btn-nav-dashboard');
       if (btnDash) {
         btnDash.click();
       } else {
         if (typeof window.refreshAllViews === 'function') window.refreshAllViews();
       }	  
   });
  }
}


function getKickoffTime(fx, idx = 0) {
  const t = fx?.kickoffTime;
  if (typeof t === 'string' && t.includes(':')) return t;
  const slots = ['16:00', '18:00', '20:30', '22:00'];
  return slots[Math.max(0, idx) % slots.length];
}

function getClubPower(club) {
  if (!club) return 60;
  if (typeof club.baseOverall === 'number') return club.baseOverall;
  const ps = Array.isArray(club.players) ? club.players : [];
  const top = ps
    .filter(Boolean)
    .slice()
    .sort((a, b) => Number(b?.overall || 0) - Number(a?.overall || 0))
    .slice(0, 14);
  if (!top.length) return 60;
  const avg = top.reduce((acc, p) => acc + Number(p?.overall || 0), 0) / top.length;
  return Math.round(avg);
}

function pickBestXI(club) {
  const players = Array.isArray(club?.players) ? club.players : [];
  const available = players
    .filter(Boolean)
    .slice()
    .sort((a, b) => Number(b?.overall || 0) - Number(a?.overall || 0));

  const xi = [];
  const gk = available.find((p) => String(p?.position || '').toUpperCase() === 'GK');
  if (gk) xi.push(gk);

  for (let i = 0; i < available.length && xi.length < 11; i++) {
    if (!xi.includes(available[i])) xi.push(available[i]);
  }
  return xi.slice(0, 11);
}

function getPreLineup(club) {
  // 1) si la alineación está definida por el usuario
  const ids = Array.isArray(club?.lineup) ? club.lineup : [];
  const benchIds = Array.isArray(club?.bench) ? club.bench : [];
  const byId = new Map((club?.players || []).map((p) => [p?.id, p]));
  const xi = ids.map((id) => byId.get(id)).filter(Boolean);
  const bench = benchIds.map((id) => byId.get(id)).filter(Boolean);
  if (xi.length >= 11) return { xi: xi.slice(0, 11), bench };

  // 2) fallback: best XI
  const best = pickBestXI(club);
  const bestIds = new Set(best.map((p) => p.id));
  const rest = (club?.players || [])
    .filter((p) => p && !bestIds.has(p.id))
    .slice()
    .sort((a, b) => Number(b?.overall || 0) - Number(a?.overall || 0));
  return { xi: best, bench: rest.slice(0, 9) };
}

function estimateAttendance(fx, homeClub, awayClub) {
  const cap = Number(homeClub?.stadium?.capacity || homeClub?.stadiumCapacity || homeClub?.capacity || 30000);
  const seed = `${fx?.id || ''}:${homeClub?.id || ''}:${awayClub?.id || ''}:${fx?.matchday || ''}`;
  const r = stableRand01(seed);
  // 62%..98% con ligera variación
  const fill = 0.62 + r * 0.36;
  const att = Math.max(1500, Math.round(cap * fill));
  return { capacity: cap, attendance: Math.min(att, cap) };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '';
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html ?? '';
}

function setCoat(id, clubId, clubName, size = 28) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  const img = createCoatImgElement(clubId, clubName, size);
  if (img) el.appendChild(img);
}

function renderPlayersList(container, players, { note = 'overall' } = {}) {
  if (!container) return;
  container.innerHTML = '';
  const list = Array.isArray(players) ? players : [];
  if (!list.length) {
    container.innerHTML = '<div class="muted">—</div>';
    return;
  }
  list.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'pcf-lineup-item';
    const pid = p?.id != null ? String(p.id) : '';
    if (pid) div.dataset.playerId = pid;
    // Clickable como la lista de Tácticas (para enlazar con el mini-campo)
    div.setAttribute('role', 'button');
    div.tabIndex = 0;
    const num = p?.shirtNumber ?? p?.number ?? '';
    const nm = p?.name || 'Jugador';
    const nte =
      note === 'none'
        ? ''
        : note === 'position'
          ? String(p?.position || '').toUpperCase()
          : p?.overall != null
            ? String(p.overall)
            : '';

    div.innerHTML = `
      <span class="pcf-lineup-item__num">${escapeHtml(num)}</span>
      <span class="pcf-lineup-item__name">${escapeHtml(nm)}</span>
      <span class="pcf-lineup-item__note">${escapeHtml(nte)}</span>
    `;
    container.appendChild(div);
  });
}

function setSelectedInLineup(lineupEl, pid) {
  if (!lineupEl) return;
  const id = pid ? String(pid) : '';
  lineupEl.dataset.selectedPlayerId = id;

  lineupEl
    .querySelectorAll('.pcf-lineup-item.is-selected')
    .forEach((el) => el.classList.remove('is-selected'));

  if (!id) return;

  const item = lineupEl.querySelector(
    `.pcf-lineup-item[data-player-id="${cssEscapeAttr(id)}"]`
  );
  if (item) item.classList.add('is-selected');
}

function setSelectedInMiniPitch(pitchEl, pid) {
  if (!pitchEl) return;
  const id = pid ? String(pid) : '';
  pitchEl.dataset.selectedPlayerId = id;

  pitchEl
    .querySelectorAll('.pcf-pitch-dot.is-selected')
    .forEach((el) => el.classList.remove('is-selected'));

  if (!id) return;

  const dot = pitchEl.querySelector(
    `.pcf-pitch-dot[data-player-id="${cssEscapeAttr(id)}"]`
  );
  if (dot) dot.classList.add('is-selected');
  else pitchEl.dataset.selectedPlayerId = '';
}

function selectMiniPitchPlayer(pitchEl, lineupEl, pid) {
  setSelectedInMiniPitch(pitchEl, pid);
  setSelectedInLineup(lineupEl, pid);
}

function ensureLineupBoundToMiniPitch(lineupEl, pitchEl) {
  if (!lineupEl || !pitchEl) return;

  // Enlace para que el click del campo pueda iluminar también la lista
  if (!lineupEl.id) lineupEl.id = `pcf-lineup-${Math.random().toString(36).slice(2, 9)}`;
  pitchEl.dataset.linkedLineupId = lineupEl.id;

  if (lineupEl.dataset.lineupBound === '1') return;
  lineupEl.dataset.lineupBound = '1';

  const onActivate = (itemEl) => {
    if (!itemEl) return;
    const pid = itemEl.getAttribute('data-player-id') || '';
    if (!pid) return;
    selectMiniPitchPlayer(pitchEl, lineupEl, pid);
  };

  // Click en lista -> ilumina punto en campo + fila
  lineupEl.addEventListener('click', (e) => {
    const item =
      e.target instanceof Element
        ? e.target.closest('.pcf-lineup-item[data-player-id]')
        : null;
    if (!item) return;
    onActivate(item);
  });

  // Enter/Espacio en lista -> igual que click
  lineupEl.addEventListener('keydown', (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.pcf-lineup-item[data-player-id]');
    if (!item) return;
    e.preventDefault();
    onActivate(item);
  });

  // Mantener selección si ya estaba marcada en el campo
  const already = pitchEl.dataset.selectedPlayerId ? String(pitchEl.dataset.selectedPlayerId) : '';
  if (already) selectMiniPitchPlayer(pitchEl, lineupEl, already);
}

function renderNotCalledList(container, club, xi, bench, maxItems = 3) {
  if (!container) return;
  const all = Array.isArray(club?.players) ? club.players : [];
  const used = new Set([...(xi || []), ...(bench || [])].filter(Boolean).map((p) => p.id));
  const notCalled = all
    .filter((p) => p && p.id && !used.has(p.id))
    .slice()
    .sort((a, b) => Number(b?.overall || 0) - Number(a?.overall || 0))
    .slice(0, maxItems);
  renderPlayersList(container, notCalled, { note: 'overall' });
}

function setMeter(container, value01) {
  if (!container) return;
  const v = clamp(Number(value01) || 0, 0, 1);
  container.innerHTML = `<i style="width:${Math.round(v * 100)}%"></i>`;
}

function parseFormation(str) {
  const s = String(str || '').trim();
  const nums = s
    .split('-')
    .map((n) => int(n, 0))
    .filter((n) => n > 0);
  if (!nums.length) return [4, 4, 2];
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum === 10) return nums; // outfield rows
  return nums;
}

function getShirtNumber(player) {
  const n = player?.shirtNumber ?? player?.number ?? player?.dorsal;
  const x = Number(n);
  if (Number.isFinite(x) && x > 0) return String(Math.trunc(x));
  return '';
}

function ensureMiniPitchBound(container) {
  if (!container || container.dataset?.miniPitchBound === '1') return;
  container.dataset.miniPitchBound = '1';
  container.addEventListener('click', (e) => {
    const dot =
      e.target instanceof Element
        ? e.target.closest('.pcf-pitch-dot[data-player-id]')
        : null;
    if (!dot) return;
    const pid = dot.getAttribute('data-player-id') || '';
    setSelectedInMiniPitch(container, pid);

    // Si el mini-campo está enlazado a una lista (Titulares), iluminar también esa fila
    const linkedListId = container.dataset.linkedLineupId || '';
    if (linkedListId) {
      const lineupEl = document.getElementById(linkedListId);
      if (lineupEl) setSelectedInLineup(lineupEl, pid);
    }
  });
}

function getSavedPitchPositionsMap(club){
  // En tu tactics.js se guarda como:
  // club.tactics.manualPositions = { [playerId]: { left:number, top:number } }  // % CSS
  // Aceptamos también formatos legacy {x,y}.
  const t = club?.tactics || club?.tactic || null;
  const m =
    t?.positionsByPlayerId ||
    t?.playerPositions ||
    t?.pitchPositions ||
    t?.dotPositions ||
    t?.positions ||
	t?.manualPositions ||
    null;
  return m;
}

function readPitchPosFromSaved(map, playerId){
  // Acepta varios formatos históricos:
  // - { left, top }   -> ya son CSS % (como tactics.js/alignment.js)
  // - { x, y }        -> coordenadas 0..100 (legacy)
  if (!map || playerId == null) return null;
  const key = String(playerId);
  const v = map instanceof Map ? (map.get(key) || map.get(playerId)) : (map[key] || map[playerId]);
  if (!v) return null;

  const left = Number(v.left ?? v.x);
  const top  = Number(v.top  ?? v.y);
  if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
  return { left, top };
}

function slotToPitchCSS(slot){
  // IMPORTANT: en Tácticas/Alignment, el pitch es horizontal (420x300)
  // y se convierte así: left = 100 - y ; top = x
  const sx = Number(slot?.x);
  const sy = Number(slot?.y);
  const top = Number.isFinite(sx) ? clamp(sx, 0, 100) : 50;
  const left = Number.isFinite(sy) ? clamp(100 - sy, 0, 100) : 50;
  return { left, top };
}

function rotate180IfAway(pos, isAway){
  // Rotación 180°: invierte ambos ejes
  // left' = 100 - left
  // top'  = 100 - top
  const l = Number(pos?.left);
  const t = Number(pos?.top);
  const left = Number.isFinite(l) ? l : 50;
  const top  = Number.isFinite(t) ? t : 50;
  if (!isAway) return { left, top };
  return { left: 100 - left, top: 100 - top };
}

function renderMiniPitch(container, club, xiPlayers = null, side = 'home') {
  if (!container) return;
  ensureMiniPitchBound(container);
  container.innerHTML = '';

  const formation = club?.tactics?.formation || club?.formation || '4-4-2';
  const slots = getFormationSlots(formation);

  const players =
    Array.isArray(xiPlayers) && xiPlayers.length ? xiPlayers : getPreLineup(club).xi;
  const assigned = assignPlayersToSlots(players, slots);
  
  // ✅ Visitante ataca a la izquierda: rotación 180° del layout
  const isAway = (String(side) === 'away');

  // ✅ Posiciones guardadas en Tácticas (si existen)
  const savedMap = getSavedPitchPositionsMap(club);

  const selectedPid = container.dataset.selectedPlayerId
    ? String(container.dataset.selectedPlayerId)
    : '';

  assigned.forEach((slot) => {
    const p = slot?.player || null;
    const pid = p?.id != null ? String(p.id) : '';
	
    // 1) Intentar usar posición guardada de Tácticas por jugador
    const savedPos = p ? readPitchPosFromSaved(savedMap, p.id) : null;
    const basePos = savedPos ? savedPos : slotToPitchCSS(slot);
    const rotated = rotate180IfAway(basePos, isAway);
    const left = clamp(rotated.left, 0, 100);
    const top  = clamp(rotated.top, 0, 100);
	
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pcf-pitch-dot' + (slot?.role === 'GK' ? ' is-gk' : '');
    if (pid) btn.dataset.playerId = pid;
    btn.style.left = `${left}%`;
    btn.style.top = `${top}%`;
    btn.textContent = getShirtNumber(p) || '·';
    btn.title = p
      ? `${p.name || 'Jugador'} (${String(p.position || '').toUpperCase() || '-'})`
      : `${formation}`;
    if (pid && selectedPid && pid === selectedPid) btn.classList.add('is-selected');
    container.appendChild(btn);
  });
}

function makeCoachName(club, isUser = false) {
  if (isUser) return GameState.user?.name || 'Mánager';
  const seed = stableHash(String(club?.id || club?.name || 'coach'));
  const first = ['Carlos', 'Miguel', 'Javi', 'Álvaro', 'Sergio', 'Rubén', 'Óscar', 'Iván', 'David', 'Héctor'][seed % 10];
  const last = ['López', 'García', 'Martínez', 'Sánchez', 'Pérez', 'Fernández', 'Gómez', 'Díaz', 'Alonso', 'Ruiz'][(seed >>> 4) % 10];
  return `${first} ${last}`;
}

function getRefereeName(seed) {
  const h = stableHash(seed);
  const first = ['Del Cerro', 'Martínez', 'Hernández', 'Soto', 'Munuera', 'González', 'Cordero', 'Ortiz', 'Iglesias', 'Pizarro'][h % 10];
  const last = ['Grande', 'Lahoz', 'Maeso', 'Suárez', 'Arias', 'Moreno', 'Rojas', 'Vico', 'Silva', 'Caballero'][(h >>> 3) % 10];
  return `${first} ${last}`;
}

function getFixtureForUser(matchday, userId, fixtures) {
  const list = (fixtures || []).filter((fx) => fx && Number(fx.matchday || 0) === Number(matchday || 0));
  return (
    list.find((fx) => fx.homeClubId === userId || fx.awayClubId === userId) ||
    list[0] ||
    null
  );
}

function computeExpectation(myClub, oppClub, seed) {
  const my = getClubPower(myClub);
  const opp = getClubPower(oppClub);
  const diff = my - opp;
  const base = 0.5 + clamp(diff / 40, -0.25, 0.25);
  const jitter = (stableRand01(seed) - 0.5) * 0.08;
  const p = clamp(base + jitter, 0.08, 0.92);
  return { pWin: p };
}

function computeBrillianceStars(fx, userId) {
  if (!fx?.played) return '★★☆☆☆';
  const isHome = fx.homeClubId === userId;
  const gf = isHome ? Number(fx.homeGoals || 0) : Number(fx.awayGoals || 0);
  const ga = isHome ? Number(fx.awayGoals || 0) : Number(fx.homeGoals || 0);
  const gd = gf - ga;
  let stars = 3;
  if (gd >= 3) stars = 5;
  else if (gd === 2) stars = 4;
  else if (gd === 1) stars = 4;
  else if (gd === 0) stars = 3;
  else if (gd === -1) stars = 2;
  else stars = 1;
  return '★★★★★'.slice(0, stars) + '☆☆☆☆☆'.slice(0, 5 - stars);
}

function computeDifficultyLabel(myClub, oppClub) {
  const my = getClubPower(myClub);
  const opp = getClubPower(oppClub);
  const diff = opp - my;
  if (diff >= 8) return 'Muy alta';
  if (diff >= 3) return 'Alta';
  if (diff <= -8) return 'Muy baja';
  if (diff <= -3) return 'Baja';
  return 'Media';
}

function calcPlayerRating(player, st, seed) {
  const ov = Number(player?.overall || 60);
  const goals = Number(st?.goals || 0);
  const assists = Number(st?.assists || 0);
  const y = Number(st?.yellows || 0);
  const r = Number(st?.reds || 0);
  const pass = Number(st?.passAccuracyPct || 0);
  const rec = Number(st?.recoveries || 0);
  const shots = Number(st?.shotsOnTarget || 0);

  const base = 5.8 + (ov - 60) * 0.03;
  const perf = goals * 1.2 + assists * 0.75 + shots * 0.08 + rec * 0.03 + (pass - 80) * 0.02;
  const disc = y * 0.18 + r * 1.2;
  const jitter = (stableRand01(seed) - 0.5) * 0.25;
  return clamp(base + perf - disc + jitter, 4.0, 9.9);
}

function renderPlayerContribTable(container, fx, club, playerStatsById, title, opts = {}) {
  const { showTitle = true } = opts || {};

  if (!container) return;
  const players = Array.isArray(club?.players) ? club.players : [];
  const byId = new Map(players.filter(Boolean).map((p) => [p.id, p]));

  const lineupIds = club?.id === fx?.homeClubId ? fx?.homeLineupIds : fx?.awayLineupIds;
  const benchIds = club?.id === fx?.homeClubId ? fx?.homeBenchIds : fx?.awayBenchIds;
  const ids = [...(lineupIds || []), ...(benchIds || [])].filter(Boolean);

  const rows = ids
    .map((pid) => {
      const p = byId.get(pid) || null;
      const st = playerStatsById?.[pid] || null;
      if (!p || !st) return null;
      const rating = calcPlayerRating(p, st, `${fx?.id || ''}:${pid}`);
      return { p, st, rating };
    })
    .filter(Boolean)
    .sort((a, b) => (b.rating - a.rating));

  const wrap = document.createElement('div');
  wrap.className = 'pcf-playerstats';
  wrap.innerHTML = showTitle && title ? `<div class="pcf-subtitle">${escapeHtml(title)}</div>` : '';

  const table = document.createElement('table');
  table.className = 'pcf-mini-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Jugador</th>
        <th class="num">EN</th>
        <th class="num">AP</th>
        <th class="num">G</th>
        <th class="num">A</th>
        <th class="num">T</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tb = table.querySelector('tbody');
  rows.slice(0, 16).forEach(({ p, st, rating }) => {
    const tr = document.createElement('tr');
    const cards = `${Number(st.yellows || 0)}/${Number(st.reds || 0)}`;
    tr.innerHTML = `
      <td>${escapeHtml(p.name || 'Jugador')}</td>
      <td class="num">${rating.toFixed(1)}</td>
      <td class="num">${int(st.minutes || 0)}</td>
      <td class="num"><strong>${int(st.goals || 0)}</strong></td>
      <td class="num">${int(st.assists || 0)}</td>
      <td class="num">${escapeHtml(cards)}</td>
    `;
    tb.appendChild(tr);
  });

  wrap.appendChild(table);
  container.appendChild(wrap);
}

function renderMiniStandings(container, clubIndex, userId, limit = 12) {
  if (!container) return;
  container.innerHTML = '';
  const rows = Array.isArray(GameState.leagueTable) ? GameState.leagueTable.slice() : [];
  if (!rows.length) {
    container.innerHTML = '<div class="muted">—</div>';
    return;
  }
  rows.slice(0, limit).forEach((r, idx) => {
    const club = clubIndex.get(r.clubId) || null;
    const name = getClubName(club, r.clubId);
    const row = document.createElement('div');
    row.className = 'row';
    if (r.clubId === userId) row.style.fontWeight = '900';
    const clubWrap = document.createElement('div');
    clubWrap.className = 'club';
    const coat = createCoatImgElement(r.clubId, name, 18);
    if (coat) clubWrap.appendChild(coat);
    const span = document.createElement('span');
    span.textContent = name;
    clubWrap.appendChild(span);

    const pos = document.createElement('div');
    pos.className = 'pos';
    pos.textContent = String(idx + 1);

    const pts = document.createElement('div');
    pts.className = 'pts';
    pts.textContent = String(r.pts ?? r.points ?? 0);

    row.appendChild(pos);
    row.appendChild(clubWrap);
    row.appendChild(pts);
    container.appendChild(row);
  });
}

function renderMiniResults(container, fixtures, matchday, clubIndex) {
  if (!container) return;
  container.innerHTML = '';
  const list = (fixtures || []).filter((fx) => fx && Number(fx.matchday || 0) === Number(matchday || 0));
  if (!list.length) {
    container.innerHTML = '<div class="muted">—</div>';
    return;
  }
  list.slice(0, 12).forEach((fx) => {
    const h = clubIndex.get(fx.homeClubId) || null;
    const a = clubIndex.get(fx.awayClubId) || null;
    const hn = getClubName(h, fx.homeClubId);
    const an = getClubName(a, fx.awayClubId);
    const row = document.createElement('div');
    row.className = 'row';

    const match = document.createElement('div');
    match.className = 'match';
    match.textContent = `${hn} - ${an}`;

    const score = document.createElement('div');
    score.className = 'score';
    score.textContent = fx.played ? `${fx.homeGoals ?? 0}-${fx.awayGoals ?? 0}` : '—';

    row.appendChild(match);
    row.appendChild(score);
    container.appendChild(row);
  });
}

function setActivePostTab(tabKey) {
  const tabs = document.querySelectorAll('#nextmatch-post-tabs .pcf-tab');
  const panels = document.querySelectorAll('#nextmatch-post-panels .pcf-post-panel');
  tabs.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-tab') === tabKey));
  panels.forEach((p) => p.classList.toggle('is-active', p.id === `nextmatch-post-panel-${tabKey}`));
}

function ensureBindings() {
  if (__bound) return;

  const btnDetailLast = document.getElementById('nextmatch-open-last-detail');
  const btnDetailNext = document.getElementById('nextmatch-open-next-detail');

  if (btnDetailLast) {
    btnDetailLast.addEventListener('click', () => {
      const fid = btnDetailLast.getAttribute('data-fixture-id');
      if (fid && typeof __onOpenMatchDetail === 'function') {
        __onOpenMatchDetail({ competitionId: GameState.league?.id || 'current', fixtureId: fid });
      }
    });
  }

  if (btnDetailNext) {
    btnDetailNext.addEventListener('click', () => {
      const fid = btnDetailNext.getAttribute('data-fixture-id');
      if (fid && typeof __onOpenMatchDetail === 'function') {
        __onOpenMatchDetail({ competitionId: GameState.league?.id || 'current', fixtureId: fid });
      }
    });
  }

  const tabButtons = document.querySelectorAll('#nextmatch-post-tabs .pcf-tab');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-tab') || 'general';
      setActivePostTab(k);
    });
  });

  // por defecto
  setActivePostTab('general');

  __bound = true;
}

// --------------------------
// Public API
// --------------------------

export function initNextMatchUI({ onOpenMatchDetail } = {}) {
  __onOpenMatchDetail = typeof onOpenMatchDetail === 'function' ? onOpenMatchDetail : null;
}

export function setLastSimulatedMatchday(md) {
  const n = Number(md);
  if (Number.isFinite(n) && n >= 1) __lastSimulatedMatchday = n;
}

export function updateNextMatchView() {
  ensureMatchScreenBindings();
  ensureBindings();

  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  const clubIndex = buildClubIndex();
  const userClub = getUserClub(GameState);
  const userId = userClub?.id || null;

  if (!userClub || !userId) {
    // No hay club de usuario seleccionado
    return;

  }

  // Cabecera
  const season = Number(GameState.currentDate?.season || 1);
  const currentMd = Number(GameState.currentDate?.matchday || 1);
  setText('nextmatch-season-label', `${2024 + season}/${2025 + season}`);
  setText('nextmatch-current-matchday-label', String(currentMd));
  // La fecha de la cabecera se intentará ajustar al kickoff real del próximo partido (si existe)
  const baseDate = getGameDateFor(season, currentMd);
  setText('nextmatch-date-label', formatGameDateLabel(baseDate));

  // ----------------
  // PREVIA: próximo partido (jornada actual)
  // ----------------
  const nextFx = getFixtureForUser(currentMd, userId, fixtures);

  if (!nextFx) {
    setText('nextmatch-next-title', 'No hay próximo partido');
    setText('nextmatch-next-meta', '');
    setText('nextmatch-next-stadium', '');
    setText('nextmatch-next-attendance', '');
    renderPlayersList(document.getElementById('nextmatch-pre-home-xi'), []);
    renderPlayersList(document.getElementById('nextmatch-pre-home-bench'), []);
    renderPlayersList(document.getElementById('nextmatch-pre-home-out'), []);
    renderPlayersList(document.getElementById('nextmatch-pre-away-xi'), []);
    renderPlayersList(document.getElementById('nextmatch-pre-away-bench'), []);
    renderPlayersList(document.getElementById('nextmatch-pre-away-out'), []);
    const btn = document.getElementById('nextmatch-open-next-detail');
    if (btn) btn.setAttribute('data-fixture-id', '');
  } else {
    const home = clubIndex.get(nextFx.homeClubId) || null;
    const away = clubIndex.get(nextFx.awayClubId) || null;
    const homeName = getClubName(home, nextFx.homeClubId);
    const awayName = getClubName(away, nextFx.awayClubId);

    // Cabeceras lateral
    setText('nextmatch-pre-home-name', homeName);
    setText('nextmatch-pre-away-name', awayName);
    setCoat('nextmatch-pre-home-coat', nextFx.homeClubId, homeName, 34);
    setCoat('nextmatch-pre-away-coat', nextFx.awayClubId, awayName, 34);

    const isUserHome = String(userId) === String(nextFx.homeClubId);
    setText('nextmatch-pre-home-coach', makeCoachName(home, isUserHome));
    setText('nextmatch-pre-away-coach', makeCoachName(away, !isUserHome && String(userId) === String(nextFx.awayClubId)));

    // Centro
    setText('nextmatch-next-title', `${homeName} vs ${awayName}`);

    const kickoffLabel = formatFixtureKickoffLabel(nextFx, season, nextFx.matchday || currentMd);

    // Ajustar fecha cabecera a la del partido del usuario
    const headDate = getFixtureKickoffDate(nextFx, season, nextFx.matchday || currentMd);
    setText('nextmatch-date-label', formatGameDateLabel(headDate));
    const stadium = home?.stadiumName || home?.stadium?.name || 'Estadio';
    setText('nextmatch-next-meta', `Jornada ${nextFx.matchday || currentMd} • ${kickoffLabel}`);
    setText('nextmatch-next-stadium', stadium);

    const { capacity, attendance } = nextFx?.meta?.attendance != null
      ? {
          capacity: Number(nextFx.meta.capacity || home?.capacity || 30000),
          attendance: Number(nextFx.meta.attendance || 0),
        }
      : estimateAttendance(nextFx, home, away);
    setText('nextmatch-next-attendance', `Aforo: ${attendance.toLocaleString('es-ES')} esp. / Cap.: ${capacity.toLocaleString('es-ES')}`);

    // Alineaciones
    const homeL = getPreLineup(home);
    const awayL = getPreLineup(away);

    // Enlaces pitch <-> listado (selección como en Tácticas)
    const homePitchEl = document.getElementById('nextmatch-pre-home-pitch');
    const awayPitchEl = document.getElementById('nextmatch-pre-away-pitch');
    const homeXiEl = document.getElementById('nextmatch-pre-home-xi');
    const awayXiEl = document.getElementById('nextmatch-pre-away-xi');

    // Listas
    renderPlayersList(homeXiEl, homeL.xi);
    renderPlayersList(document.getElementById('nextmatch-pre-home-bench'), homeL.bench);
    renderNotCalledList(document.getElementById('nextmatch-pre-home-out'), home, homeL.xi, homeL.bench);

    renderPlayersList(awayXiEl, awayL.xi);
    renderPlayersList(document.getElementById('nextmatch-pre-away-bench'), awayL.bench);
    renderNotCalledList(document.getElementById('nextmatch-pre-away-out'), away, awayL.xi, awayL.bench);

    // ✅ home / away para aplicar mirror correcto
    renderMiniPitch(homePitchEl, home, homeL.xi, 'home');
    renderMiniPitch(awayPitchEl, away, awayL.xi, 'away');

    // Click en la lista (Titulares) <-> click en el campo (como en Tácticas)
    ensureLineupBoundToMiniPitch(homeXiEl, homePitchEl);
    ensureLineupBoundToMiniPitch(awayXiEl, awayPitchEl);

    // Expectativas (solo para el usuario)
    const myClub = isUserHome ? home : away;
    const oppClub = isUserHome ? away : home;
    const exp = computeExpectation(myClub, oppClub, `exp:${nextFx.id}:${userId}`);

    const meterMatch = document.getElementById('nextmatch-expect-match');
    const meterGen = document.getElementById('nextmatch-expect-general');
    setMeter(meterMatch, exp.pWin);
    setMeter(meterGen, clamp(exp.pWin * 0.92 + 0.04, 0, 1));

    // Botón detalle
    const btn = document.getElementById('nextmatch-open-next-detail');
    if (btn) btn.setAttribute('data-fixture-id', String(nextFx.id));
  }

  // ----------------
  // POST: último partido del usuario
  // ----------------
  let lastFx = null;
  const mdTarget = Number(__lastSimulatedMatchday || 0);
  if (mdTarget >= 1) {
    lastFx = fixtures.find(
      (fx) =>
        fx &&
        fx.played &&
        Number(fx.matchday) === mdTarget &&
        (fx.homeClubId === userId || fx.awayClubId === userId)
    ) || null;
  }

  if (!lastFx) {
    lastFx = fixtures
      .filter((fx) => fx && fx.played && (fx.homeClubId === userId || fx.awayClubId === userId))
      .slice()
      .sort((a, b) => Number(b.matchday || 0) - Number(a.matchday || 0))[0] || null;
  }

  const btnDetailLast = document.getElementById('nextmatch-open-last-detail');
  if (btnDetailLast) btnDetailLast.setAttribute('data-fixture-id', lastFx ? String(lastFx.id) : '');

  if (!lastFx) {
    setText('nextmatch-last-title', 'Aún no has jugado ningún partido');
    setText('nextmatch-last-meta', '');

    const stand = document.getElementById('nextmatch-post-standings');
    const res = document.getElementById('nextmatch-post-results');
    renderMiniStandings(stand, clubIndex, userId);
    renderMiniResults(res, fixtures, currentMd, clubIndex);

    return;
  }

  const lastHome = clubIndex.get(lastFx.homeClubId) || null;
  const lastAway = clubIndex.get(lastFx.awayClubId) || null;
  const lastHomeName = getClubName(lastHome, lastFx.homeClubId);
  const lastAwayName = getClubName(lastAway, lastFx.awayClubId);

  setText(
    'nextmatch-last-title',
    `${lastHomeName} ${lastFx.homeGoals ?? 0} - ${lastFx.awayGoals ?? 0} ${lastAwayName}`
  );

  const kDate = getFixtureKickoffDate(lastFx, season, lastFx.matchday || currentMd);
  const kLabel = formatGameDateLabel(kDate);
  const kTime = getKickoffTime(lastFx, 0);
  const stName = (lastHome?.stadiumName || 'Estadio');
  setText('nextmatch-last-meta', `Jornada ${lastFx.matchday} • ${kLabel} • ${kTime} • ${stName}`);

  // Sidecards (clasificación/resultados) para la jornada jugada
  const stand = document.getElementById('nextmatch-post-standings');
  const res = document.getElementById('nextmatch-post-results');
  renderMiniStandings(stand, clubIndex, userId);
  renderMiniResults(res, fixtures, lastFx.matchday, clubIndex);

  // Índices para nombres
  const playerIndex = buildPlayerIndex(GameState.clubs || []);

  // Panel GENERAL
  const highlightsEl = document.getElementById('nextmatch-post-highlights');
  const statsEl = document.getElementById('nextmatch-last-stats');
  const timelineEl = document.getElementById('nextmatch-last-timeline');
  
  // Panel OCASIONES (mismo renderer, pestaña aparte)
  const occEl = document.getElementById('nextmatch-post-occasions');

  if (highlightsEl) {
    highlightsEl.innerHTML = '';
	
    // Matchhead (marcador + escudos)
    const hCoatEl = createCoatImgElement(lastFx.homeClubId, lastHomeName, 22);
    const aCoatEl = createCoatImgElement(lastFx.awayClubId, lastAwayName, 22);
    if (hCoatEl) hCoatEl.classList.add('pcf-matchhead__coat');
    if (aCoatEl) aCoatEl.classList.add('pcf-matchhead__coat');

    const head = document.createElement('div');
    head.className = 'pcf-matchhead';
    head.innerHTML = `
      <div class="pcf-matchhead__team is-home">
        <span class="pcf-matchhead__name">${escapeHtml(lastHomeName)}</span>
        ${hCoatEl ? hCoatEl.outerHTML : ''}
      </div>
      <div class="pcf-matchhead__score">
        ${int(lastFx.homeGoals ?? 0)}<span>—</span>${int(lastFx.awayGoals ?? 0)}
      </div>
      <div class="pcf-matchhead__team is-away">
        ${aCoatEl ? aCoatEl.outerHTML : ''}
        <span class="pcf-matchhead__name">${escapeHtml(lastAwayName)}</span>
      </div>
    `;
    highlightsEl.appendChild(head);

    // Goleador del partido
    const goalEvents = (lastFx.events || []).filter((e) => e?.type === 'GOAL' && e.playerId);
    const cnt = new Map();
    goalEvents.forEach((e) => cnt.set(e.playerId, (cnt.get(e.playerId) || 0) + 1));
    let topPid = null;
    let topG = 0;
    cnt.forEach((v, k) => {
      if (v > topG) {
        topG = v;
        topPid = k;
      }
    });
    const topName = topPid ? (playerIndex.get(topPid)?.player?.name || 'Jugador') : '—';

    const diffLabel = computeDifficultyLabel(userClub, (lastFx.homeClubId === userId ? lastAway : lastHome));
    const stars = computeBrillianceStars(lastFx, userId);
    const ref = getRefereeName(`ref:${lastFx.id}:${lastFx.matchday}`);

    const blocks = [
      { title: 'Goleador', sub: topG > 0 ? `${topName} · ${topG} gol(es)` : 'Sin goles', stars: '' },
      { title: 'Dificultad', sub: diffLabel, stars: '' },
      { title: 'Brillantez', sub: 'Valoración del partido', stars },
      { title: 'Árbitro', sub: ref, stars: '' },
    ];

    blocks.forEach((b) => {
      const card = document.createElement('div');
      card.className = 'pcf-highlight';
      card.innerHTML = `
        <div class="pcf-highlight__left">
          <div class="pcf-highlight__title">${escapeHtml(b.title)}</div>
          <div class="pcf-highlight__sub">${escapeHtml(b.sub)}</div>
        </div>
        <div class="pcf-stars">${escapeHtml(b.stars || '')}</div>
      `;
      highlightsEl.appendChild(card);
    });
  }

  if (statsEl) {
    statsEl.innerHTML = '';
    const h = lastFx.teamStats?.home || null;
    const a = lastFx.teamStats?.away || null;

    if (!h || !a) {
      statsEl.innerHTML = '<div class="muted">No hay estadísticas avanzadas para este partido.</div>';
    } else {
      const hCoat = createCoatImgElement(lastFx.homeClubId, lastHomeName, 18);
      const aCoat = createCoatImgElement(lastFx.awayClubId, lastAwayName, 18);

      const table = document.createElement('table');
      table.className = 'pcf-mini-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th class="pcf-th pcf-th--home">
              <span class="pcf-thteam">
                <span class="pcf-thteam__name">${escapeHtml(lastHomeName)}</span>
                ${hCoat ? hCoat.outerHTML : ''}
              </span>
            </th>
            <th>Dato</th>
            <th class="pcf-th pcf-th--away num">
              <span class="pcf-thteam">
                ${aCoat ? aCoat.outerHTML : ''}
                <span class="pcf-thteam__name">${escapeHtml(lastAwayName)}</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="num">${int(h.possessionPct)}</td><td>Posesión (%)</td><td class="num">${int(a.possessionPct)}</td></tr>
          <tr><td class="num">${int(h.shotsTotal)}</td><td>Tiros</td><td class="num">${int(a.shotsTotal)}</td></tr>
          <tr><td class="num">${int(h.shotsOnTarget)}</td><td>Tiros a puerta</td><td class="num">${int(a.shotsOnTarget)}</td></tr>
          <tr><td class="num">${int(h.corners)}</td><td>Córners</td><td class="num">${int(a.corners)}</td></tr>
          <tr><td class="num">${int(h.offsides)}</td><td>Fueras de juego</td><td class="num">${int(a.offsides)}</td></tr>
          <tr><td class="num">${int(h.yellowCards)}</td><td>Amarillas</td><td class="num">${int(a.yellowCards)}</td></tr>
          <tr><td class="num">${int(h.redCards)}</td><td>Rojas</td><td class="num">${int(a.redCards)}</td></tr>
        </tbody>
      `;
      statsEl.appendChild(table);
    }
  }

  if (timelineEl) {
    renderMatchTimeline(timelineEl, {
      fx: lastFx,
      clubIndex,
      playerIndex,
      maxItems: 60,
      withFinalLabel: true,
    });
  }

  if (occEl) {
    renderMatchTimeline(occEl, {
      fx: lastFx,
      clubIndex,
      playerIndex,
      maxItems: 16,
      withFinalLabel: false,
      filter: (e) => {
        const t = String(e?.type || '').toUpperCase();
        return t === 'GOAL' || t === 'SUB' || t === 'INJURY' ||
               t === 'YELLOW' || t === 'YELLOW_CARD' || t === 'CARD_YELLOW' ||
               t === 'RED' || t === 'RED_CARD' || t === 'CARD_RED';
      },
    });
  }

  // Panel APORTACIONES
  const contribHomeEl = document.getElementById('nextmatch-last-players');
  const contribAwayEl = document.getElementById('nextmatch-last-players-opp');
  if (contribHomeEl || contribAwayEl) {
    if (contribHomeEl) contribHomeEl.innerHTML = '';
    if (contribAwayEl) contribAwayEl.innerHTML = '';

    const byId = lastFx.playerStatsById || null;
    if (!byId) {
      if (contribHomeEl) contribHomeEl.innerHTML = '<div class="muted">No hay aportaciones detalladas.</div>';
      if (contribAwayEl) contribAwayEl.innerHTML = '<div class="muted">No hay aportaciones detalladas.</div>';
    } else {
      // Nota: en HTML ya existen títulos (Tu equipo / Rival). Aquí solo pintamos tablas.
      if (contribHomeEl) renderPlayerContribTable(contribHomeEl, lastFx, lastHome, byId, lastHomeName, { showTitle: false });
      if (contribAwayEl) renderPlayerContribTable(contribAwayEl, lastFx, lastAway, byId, lastAwayName, { showTitle: false });
    }
  }

  // Panel SENSACIONES
  const sensEl = document.getElementById('nextmatch-post-sensations');
  if (sensEl) {
    const isHomeUser = lastFx.homeClubId === userId;
    const gf = isHomeUser ? (lastFx.homeGoals ?? 0) : (lastFx.awayGoals ?? 0);
    const ga = isHomeUser ? (lastFx.awayGoals ?? 0) : (lastFx.homeGoals ?? 0);
    const gd = Number(gf) - Number(ga);
    const poss = isHomeUser ? (lastFx.teamStats?.home?.possessionPct ?? null) : (lastFx.teamStats?.away?.possessionPct ?? null);

    const lines = [];
    if (gd >= 2) lines.push('Partido muy controlado.');
    else if (gd === 1) lines.push('Victoria trabajada.');
    else if (gd === 0) lines.push('Reparto de puntos, partido igualado.');
    else if (gd === -1) lines.push('Derrota ajustada.');
    else lines.push('Partido complicado.');

    if (poss != null) {
      if (poss >= 58) lines.push('Dominio de la posesión.');
      else if (poss <= 42) lines.push('Equipo replegado y saliendo a la contra.');
      else lines.push('Alternancia en el centro del campo.');
    }

    sensEl.innerHTML = `<div class="pcf-sensations__text">${lines.map((t) => `• ${escapeHtml(t)}`).join('<br>')}</div>`;
  }

  // Panel ÁRBITRO
  const refEl = document.getElementById('nextmatch-post-referee');
  if (refEl) {
    const seed = `ref:${lastFx.id}:${lastFx.matchday}`;
    const ref = getRefereeName(seed);
    const strict = clamp(Number(GameState.league?.cardStrictness || 1), 0.7, 1.3);
    const base = 6.5 + (stableRand01(seed) - 0.5) * 1.2;
    const note = clamp(base * strict, 5.0, 8.5).toFixed(1);
    const style = strict < 0.95 ? 'Permisivo' : 'Normal';
    refEl.innerHTML = `
      <div class="pcf-referee__name"><strong>${escapeHtml(ref)}</strong></div>
      <div class="pcf-referee__meta">Estilo: ${escapeHtml(style)} · Nota: ${escapeHtml(note)}</div>
     `;
  }
  
  // Si venimos de simular una jornada, saltamos automáticamente al POST del último partido jugado.
  if (__lastSimulatedMatchday != null) {
    const md = Number(__lastSimulatedMatchday);
    const maybeFx = getFixtureForUser(md, userId, fixtures);
    if (maybeFx && maybeFx.played) __matchScreen = 'post';
  }
  setMatchScreen(__matchScreen);
}