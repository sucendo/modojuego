/**
 * Tácticas (pantalla estilo PCF):
 * - Lista titulares (misma tabla que Alineación: orden y columnas)
 * - Campo abajo con dorsales, movibles (drag) -> club.tactics.manualPositions
 * - Balón parado (pen/fk/corners)
 * - Ficha jugador a la derecha (selección desde tabla o campo)
 * - Presets: guardar, listar, cargar y renombrar
 * Importante: Alineación escucha 'pcf:tacticsChanged' y repinta el campo.
*/

import { GameState } from '../state.js';
import { createFlagImgElement } from './utils/flags.js';
import { isPlayerInjuredNow, isPlayerSuspendedNow } from '../game/utils/index.js';
 
import {
  ensureClubTactics,
  autoPickMatchdaySquad,
  getFormationSlots,
  assignPlayersToSlots,
} from './utils/tacticsState.js';

let bound = false;
let selectedPlayerId = null;
let dragging = null; // { pid, offsetX, offsetY }
let selectedPresetId = null;
let pendingRenamePresetId = null;

const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'];
const MENTALITIES = [
  { v: 'DEFENSIVE', t: 'Defensiva' },
  { v: 'BALANCED', t: 'Equilibrada' },
  { v: 'ATTACKING', t: 'Ofensiva' },
];
const TEMPOS = [
  { v: 'SLOW', t: 'Lento' },
  { v: 'NORMAL', t: 'Normal' },
  { v: 'FAST', t: 'Rápido' },
];
const PRESSURES = [
  { v: 'LOW', t: 'Baja' },
  { v: 'NORMAL', t: 'Media' },
  { v: 'HIGH', t: 'Alta' },
];

const QUICK_GROUPS = {
  playStyle: [
    { v: 'POSSESSION', t: 'Posesión' },
    { v: 'DIRECT', t: 'Directo' },
  ],
  transition: [
    { v: 'COUNTER', t: 'Contra' },
    { v: 'MIXED', t: 'Mixto' },
  ],
  focus: [
    { v: 'GENERAL', t: 'General' },
    { v: 'ATTACK', t: 'Ataque' },
    { v: 'DEFENSE', t: 'Defensa' },
  ],
};

function getUserClub() {
  const clubId = GameState.user?.clubId;
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  if (!clubs.length) return null;
  if (!clubId) return clubs[0];
  return clubs.find((c) => c.id === clubId) || clubs[0];
}

function ensureExtendedTactics(club) {
  if (!club) return;
  try { ensureClubTactics(club); } catch (e) {}
  if (!club.tactics) club.tactics = {};
  const t = club.tactics;
  if (!t.formation) t.formation = '4-4-2';
  if (!t.mentality) t.mentality = 'BALANCED';
  if (!t.tempo) t.tempo = 'NORMAL';
  if (!t.pressure) t.pressure = 'NORMAL';
  if (!t.playStyle) t.playStyle = 'POSSESSION';
  if (!t.transition) t.transition = 'MIXED';
  if (!t.focus) t.focus = 'GENERAL';
  if (!t.setPieces) t.setPieces = { penalties:'', freeKicks:'', corners:'' };
  if (!t.manualPositions) t.manualPositions = {}; // { [playerId]: {left, top} }
}

function getRoleFromPosition(pos){
  const p = String(pos||'').toUpperCase();
  if (p === 'POR' || p === 'GK') return 'POR';
  if (p.includes('D') || ['RB','LB','CB','RWB','LWB'].includes(p)) return 'DEF';
  if (p.includes('M') || ['CDM','CM','CAM','RM','LM'].includes(p)) return 'MED';
  return 'DEL';
}

function getDemarcation(pos){
  const p = String(pos||'').toUpperCase();
  return p || '-';
}

function getOrderedXIPlayers(club){
  const xi = getXIPlayers(club);
  const formation = club.tactics?.formation || '4-4-2';
  const slots = getFormationSlots(formation);
  const assigned = assignPlayersToSlots(xi, slots);
  const coord = new Map();
  assigned.forEach(s=>{ if(s?.player?.id!=null) coord.set(String(s.player.id), {x:s.x??50, y:s.y??50}); });
  const isGK = (p)=>/^(POR|GK)$/i.test(p?.position||'');
  return xi.slice().sort((a,b)=>{
    const ag=isGK(a), bg=isGK(b);
    if(ag!==bg) return ag? -1 : 1;
    const ca=coord.get(String(a.id)), cb=coord.get(String(b.id));
    const ay=ca?.y??-999, by=cb?.y??-999;
    if(ay!==by) return by-ay;
    const ax=ca?.x??999, bx=cb?.x??999;
    if(ax!==bx) return ax-bx;
    return (a.name||'').localeCompare(b.name||'');
  });
}

function fillSelect(select, options, currentValue) {
  if (!select) return;
  select.innerHTML = '';
  options.forEach((o) => {
    const opt = document.createElement('option');
    if (typeof o === 'string') {
      opt.value = o;
      opt.textContent = o;
    } else {
      opt.value = o.v;
      opt.textContent = o.t;
    }
    select.appendChild(opt);
  });
  if (currentValue != null) select.value = currentValue;
}

function setActiveQuickButtons(root, key, value) {
  if (!root) return;
  root.querySelectorAll(`[data-tactics-key="${key}"] [data-tactics-value]`).forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-tactics-value') === value);
  });
}

function dispatchTacticsChanged() {
  document.dispatchEvent(new CustomEvent('pcf:tacticsChanged'));
}
function dispatchLineupChanged() {
  document.dispatchEvent(new CustomEvent('pcf:lineupChanged'));
}

function getByIdMap(club) {
  const players = Array.isArray(club?.players) ? club.players : [];
  const byId = new Map();
  players.forEach((p) => byId.set(String(p.id), p));
  return byId;
}

function getXIPlayers(club) {
  const byId = getByIdMap(club);
  const ids = Array.isArray(club?.lineup) ? club.lineup : [];
  const seen = new Set();
  const xi = [];
  ids.forEach((id) => {
    const k = String(id);
    if (seen.has(k)) return;
    seen.add(k);
    const p = byId.get(k);
    if (p) xi.push(p);
  });
  return xi;
}

function getShirtNumber(p) {
  if (!p) return '';
  const n = p.shirtNumber ?? p.number ?? p.jerseyNumber ?? p.dorsal;
  return n == null ? '' : String(n);
}

function formatAttr(v) {
  if (v == null || Number.isNaN(v)) return '-';
  return String(Math.round(Number(v)));
}

function computePCFParams(p) {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n)));
  const overall = Number.isFinite(Number(p?.overall)) ? Number(p.overall) : 50;
  const enRaw = p?.fitness != null ? Math.round(clamp(p.fitness, 0, 1) * 100) : null;
  const EN = enRaw != null ? enRaw : Math.round(overall);

  const tech = p?.attributes?.technical || {};
  const ment = p?.attributes?.mental || {};
  const phys = p?.attributes?.physical || {};

  const avg = (...xs) => {
    const vals = xs.filter((n) => typeof n === 'number' && Number.isFinite(n));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const CF = avg(phys.pace, phys.stamina, phys.strength) ?? overall;
  const CM = avg(ment.vision, ment.composure, ment.workRate, ment.leadership) ?? overall;
  const CD = avg(tech.tackling, phys.strength, ment.workRate, ment.composure) ?? overall;
  const CO = avg(tech.shooting, tech.dribbling, tech.passing, ment.vision) ?? overall;
  const MO = p?.morale != null ? Math.round(clamp(p.morale, 0, 1) * 100) : null;
  const form = (p?.form != null && Number.isFinite(Number(p.form))) ? Number(p.form) : null;
  const EF = form != null ? Math.round(clamp(50 + clamp(form, -3, 3) * 15, 0, 100)) : null;
  const ME = Number.isFinite(overall) ? Math.round(clamp(overall, 1, 99)) : null;
  const pos = String(p?.position || '-').toUpperCase();
  const ROL = (pos === 'POR' || pos === 'GK') ? 'POR' : (pos.includes('D') || ['RB','LB','CB','RWB','LWB'].includes(pos)) ? 'DEF' : (pos.includes('M') || ['CDM','CM','CAM','RM','LM'].includes(pos)) ? 'MED' : 'DEL';
  const DEM = pos;

  return {
    EN,
    CF: Math.round(clamp(CF, 1, 99)),
    CM: Math.round(clamp(CM, 1, 99)),
    CD: Math.round(clamp(CD, 1, 99)),
    CO: Math.round(clamp(CO, 1, 99)),
    MO: MO != null ? Math.round(clamp(MO, 0, 100)) : null,
    EF: EF != null ? Math.round(clamp(EF, 0, 100)) : null,
    ME,
    ROL,
    DEM,
  };
}

function renderSummary(club) {
  const el = document.getElementById('tactics-summary');
  if (!el || !club?.tactics) return;
  const t = club.tactics;
  const m = MENTALITIES.find((x) => x.v === t.mentality)?.t || t.mentality;
  const te = TEMPOS.find((x) => x.v === t.tempo)?.t || t.tempo;
  const p = PRESSURES.find((x) => x.v === t.pressure)?.t || t.pressure;
  const ps = QUICK_GROUPS.playStyle.find((x) => x.v === t.playStyle)?.t || t.playStyle;
  const tr = QUICK_GROUPS.transition.find((x) => x.v === t.transition)?.t || t.transition;
  const f = QUICK_GROUPS.focus.find((x) => x.v === t.focus)?.t || t.focus;
  el.textContent = `${t.formation} · ${m} · Ritmo ${te} · Presión ${p} · ${ps}/${tr} · ${f}`;
}

function renderXIListTable(club) {
  const tbody = document.getElementById('tactics-xi-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const xi = getOrderedXIPlayers(club);
  if (!xi.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 14;
    td.textContent = 'Sin titulares (ve a Alineación y define el XI).';
    td.style.opacity = '0.85';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const makeTd = (txt, cls) => {
    const td = document.createElement('td');
    if (cls) td.className = cls;
    td.textContent = txt;
    return td;
  };

  xi.forEach((p) => {
    const id = String(p.id);
    const tr = document.createElement('tr');
    tr.dataset.playerId = id;
    tr.classList.toggle('pcf-selected-row', selectedPlayerId != null && String(selectedPlayerId) === id);
 
    const stats = computePCFParams(p);
    tr.appendChild(makeTd(getShirtNumber(p) || '·', 'pcf-td-num'));

    // Jugador + bandera (igual que Alineación)
    const tdName = document.createElement('td');
    tdName.className = 'squad-player-name-cell';
    const flag = createFlagImgElement(p.nationality);
    if (flag) tdName.appendChild(flag);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = p.name || p.shortName || 'Jugador';
    tdName.appendChild(nameSpan);
    tr.appendChild(tdName);

    tr.appendChild(makeTd(formatAttr(stats.EN)));
    tr.appendChild(makeTd(formatAttr(stats.CF)));
    tr.appendChild(makeTd(formatAttr(stats.CM)));
    tr.appendChild(makeTd(formatAttr(stats.CD)));
    tr.appendChild(makeTd(formatAttr(stats.CO)));
    tr.appendChild(makeTd(formatAttr(stats.MO)));
    tr.appendChild(makeTd(formatAttr(stats.EF)));
    tr.appendChild(makeTd(formatAttr(stats.ME), 'pcf-td-me'));

    tr.appendChild(makeTd(getRoleFromPosition(p.position)));
    tr.appendChild(makeTd(getDemarcation(p.position)));

    const injured = isPlayerInjuredNow(p);
    const suspended = isPlayerSuspendedNow(p);
    const statusText =
      injured && suspended ? 'Les./Sanc.' :
      injured ? `Les. (${p.injury?.matchesRemaining ?? '?'})` :
      suspended ? `Sanc. (${p.suspension?.matchesRemaining ?? '?'})` :
      '-';
    tr.appendChild(makeTd(statusText));
    tr.appendChild(document.createElement('td'));

    tbody.appendChild(tr);
  });
}

// ===== Presets (lista + renombrar) =====
function presetsKey(club){
  const id = club?.id ?? club?.slug ?? club?.name ?? 'club';
  return `pcf_tactics_presets_${String(id)}`;
}
function readPresets(club){
  try { return JSON.parse(localStorage.getItem(presetsKey(club))||'[]')||[]; } catch(_){ return []; }
}
function writePresets(club, presets){
  localStorage.setItem(presetsKey(club), JSON.stringify(presets||[]));
}
function savePreset(club){
  const presets = readPresets(club);
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const name = `Táctica ${presets.length + 1}`;
  presets.unshift({ id, name, savedAt: Date.now(), tactics: club.tactics });
  writePresets(club, presets);
  selectedPresetId = id;
  pendingRenamePresetId = id;
}
function loadPreset(club, id){
  const presets = readPresets(club);
  const p = presets.find(x=>x.id===id);
  if(!p) return false;
  selectedPresetId = p.id;
  club.tactics = p.tactics || {};
  ensureExtendedTactics(club);
  dispatchTacticsChanged();
  return true;
}
function renderPresets(club){
  const ul = document.getElementById('tactics-presets-list');
  if(!ul) return;
  ul.innerHTML = '';
  const presets = readPresets(club);
  presets.forEach(p=>{
    const li = document.createElement('li');
    li.className = 'pcf-presets-item' + (selectedPresetId===p.id ? ' is-active' : '');
    li.dataset.presetId = p.id;
    if (pendingRenamePresetId === p.id){
      const input = document.createElement('input');
      input.className = 'pcf-presets-input';
      input.value = p.name || 'Táctica';
      li.appendChild(input);
      ul.appendChild(li);
      setTimeout(()=>input.focus(),0);
      const commit = ()=>{
        const presets2 = readPresets(club);
        const f = presets2.find(x=>x.id===p.id);
        if (f) f.name = (input.value||'Táctica').trim();
        writePresets(club, presets2);
        pendingRenamePresetId = null;
        renderPresets(club);
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e)=>{
        if(e.key==='Enter') commit();
        if(e.key==='Escape'){ pendingRenamePresetId=null; renderPresets(club); }
      });
      return;
    }
    const name = document.createElement('span');
    name.className = 'pcf-presets-name';
    name.textContent = p.name || 'Táctica';
    const meta = document.createElement('span');
    meta.className = 'pcf-presets-meta';
    meta.textContent = new Date(p.savedAt||Date.now()).toLocaleDateString();
    li.appendChild(name);
    li.appendChild(meta);
    ul.appendChild(li);
  });
}

function renderSetPieces(club) {
  const selPen = document.getElementById('tactics-sp-pen');
  const selFk = document.getElementById('tactics-sp-fk');
  const selCor = document.getElementById('tactics-sp-cor');
  if (!selPen || !selFk || !selCor) return;

  const players = Array.isArray(club?.players) ? club.players : [];
  const opts = players.map((p) => ({
    v: String(p.id),
    t: `${getShirtNumber(p) ? getShirtNumber(p) + ' · ' : ''}${p.name || 'Jugador'} (${p.position || '-'})`,
  }));
  // Opción “—”
  const withNone = [{ v: '', t: '—' }, ...opts];

  fillSelect(selPen, withNone, club.tactics.setPieces.penalties ? String(club.tactics.setPieces.penalties) : '');
  fillSelect(selFk, withNone, club.tactics.setPieces.freeKicks ? String(club.tactics.setPieces.freeKicks) : '');
  fillSelect(selCor, withNone, club.tactics.setPieces.corners ? String(club.tactics.setPieces.corners) : '');
}

function renderPlayerCard(club) {
  const root = document.getElementById('tactics-player-card');
  if (!root) return;
  root.innerHTML = '';

  const byId = getByIdMap(club);
  const p = selectedPlayerId != null ? byId.get(String(selectedPlayerId)) : null;
  if (!p) {
    root.innerHTML = `<div class="pcf-box pcf-kv-item"><span>Jugador</span><strong>—</strong></div>`;
    return;
  }

  const mk = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };

  const tech = p.attributes?.technical || {};
  const ment = p.attributes?.mental || {};
  const phys = p.attributes?.physical || {};
  const stats = computePCFParams(p);

  const age = (typeof window.getPlayerGameAge === 'function') ? window.getPlayerGameAge(p) : null;
  const ageText = age != null ? `${age} años` : '—';

  const top = mk('div', 'pcf-pcard-top');
  const left = mk('div', '');
  left.appendChild(mk('div', 'pcf-pcard-name', p.name || 'Jugador'));
  left.appendChild(mk('div', 'pcf-pcard-sub', `${p.position || '-'} • ${p.nationality || '—'} • ${ageText}`));
  const ov = mk('div', 'pcf-pcard-ov');
  ov.appendChild(mk('div', 'v', p.overall != null ? String(p.overall) : '--'));
  ov.appendChild(mk('div', 't', 'MEDIA'));
  top.appendChild(left);
  top.appendChild(ov);

  const info = mk('div', 'pcf-pcard-info');
  const kv = mk('div', 'pcf-pcard-kv');
  const kvItem = (k, v) => {
    const box = mk('div', 'pcf-box pcf-kv-item');
    box.appendChild(mk('span', '', k));
    box.appendChild(mk('strong', '', v));
    return box;
  };
  kv.appendChild(kvItem('Dorsal', getShirtNumber(p) || '—'));
  kv.appendChild(kvItem('País', p.nationality || '—'));
  kv.appendChild(kvItem('Pie', p.foot || '—'));
  kv.appendChild(kvItem('Nac.', p.birthDate || '—'));

  const portrait = mk('div', 'pcf-pcard-portrait');
  const initials = (p.name || 'J').split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase();
  portrait.appendChild(mk('div','',initials));
  info.appendChild(kv);
  info.appendChild(portrait);

  const statsGrid = mk('div', 'pcf-pcard-stats');
  const statBox = (label, value) => {
    const box = mk('div', 'pcf-box pcf-stat');
    box.appendChild(mk('span', 'l', label));
    box.appendChild(mk('span', 'r', formatAttr(value)));
    return box;
  };
  const colA = mk('div','');
  colA.appendChild(statBox('Velocidad', phys.pace));
  colA.appendChild(statBox('Resistencia', phys.stamina));
  colA.appendChild(statBox('Fuerza', phys.strength));
  colA.appendChild(statBox('Entrada', tech.tackling));
  const colB = mk('div','');
  colB.appendChild(statBox('Pase', tech.passing));
  colB.appendChild(statBox('Regate', tech.dribbling));
  colB.appendChild(statBox('Tiro', tech.shooting));
  colB.appendChild(statBox('Visión', ment.vision));
  colB.appendChild(statBox('Compostura', ment.composure));
  statsGrid.appendChild(colA);
  statsGrid.appendChild(colB);

  const summary = mk('div','pcf-pcard-summary');
  const pill = (k, v) => {
    const el = mk('div','pcf-pill');
    el.appendChild(mk('span','',k));
    el.appendChild(mk('strong','', v != null ? String(Math.round(v)) : '-'));
    return el;
  };
  summary.appendChild(pill('EN', stats.EN));
  summary.appendChild(pill('CF', stats.CF));
  summary.appendChild(pill('CM', stats.CM));
  summary.appendChild(pill('CD', stats.CD));
  summary.appendChild(pill('CO', stats.CO));
  summary.appendChild(pill('ME', stats.ME));

  root.appendChild(top);
  root.appendChild(info);
  root.appendChild(statsGrid);
  root.appendChild(summary);
}

// Conversión a campo horizontal (izq→der)
function slotToPitchCSS(slot) {
  const left = 100 - (slot?.y ?? 50);
  const top = (slot?.x ?? 50);
  return { left, top };
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function renderTacticsPitch(club) {
  const pitchEl = document.getElementById('tactics-pitch');
  if (!pitchEl) return;
  pitchEl.innerHTML = '';

  const t = club.tactics;
  const formation = t.formation || '4-4-2';
  const slots = getFormationSlots(formation);
  const xiPlayers = getXIPlayers(club);
  const assigned = assignPlayersToSlots(xiPlayers, slots); // [{player, x,y, role,...}]

  assigned.forEach((slot) => {
    const p = slot?.player;
    const pid = p ? String(p.id) : null;
    const dot = document.createElement('div');
    dot.className = 'pcf-dot pcf-dot--slot pcf-dot--draggable';
    if (pid) dot.dataset.playerId = pid;

    // Pos manual si existe
    let leftTop = null;
    if (pid && t.manualPositions && t.manualPositions[pid]) {
      leftTop = t.manualPositions[pid];
    } else {
      leftTop = slotToPitchCSS(slot);
    }

    dot.style.left = `${leftTop.left}%`;
    dot.style.top = `${leftTop.top}%`;
    dot.textContent = getShirtNumber(p) || '·';
    dot.title = p ? `${p.name} (${p.position || '-'})` : `${formation} · ${slot?.role || ''}`;

    if (pid && selectedPlayerId != null && String(selectedPlayerId) === pid) {
      dot.classList.add('is-selected');
    }

    pitchEl.appendChild(dot);
  });
}

function tacticsStorageKey(club) {
  const id = club?.id ?? club?.slug ?? club?.name ?? 'club';
  return `pcf_tactics_${String(id)}`;
}

export function initTacticsUI() {
  if (bound) return;
  bound = true;

  // Mantener sincronizada si cambia el XI desde Alineación
  document.addEventListener('pcf:lineupChanged', updateTacticsView);

  const formationSelect = document.getElementById('tactics-formation');
  const mentalitySelect = document.getElementById('tactics-mentality');
  const tempoSelect = document.getElementById('tactics-tempo');
  const pressureSelect = document.getElementById('tactics-pressure');
  const autoBtn = document.getElementById('btn-tactics-auto');

  const quickRoot = document.getElementById('tactics-quick');

  const selPen = document.getElementById('tactics-sp-pen');
  const selFk = document.getElementById('tactics-sp-fk');
  const selCor = document.getElementById('tactics-sp-cor');

  const btnSave = document.getElementById('btn-tactics-save');
  const btnLoad = document.getElementById('btn-tactics-load');
  const btnResetPos = document.getElementById('btn-tactics-resetpos');
  const presetsUl = document.getElementById('tactics-presets-list');

  // Selects
  fillSelect(formationSelect, FORMATIONS, null);
  fillSelect(mentalitySelect, MENTALITIES, null);
  fillSelect(tempoSelect, TEMPOS, null);
  fillSelect(pressureSelect, PRESSURES, null);

  const onSelectChange = (key, el, refresh = false) => {
    el?.addEventListener('change', () => {
      const club = getUserClub();
      if (!club) return;
      ensureExtendedTactics(club);
      club.tactics[key] = el.value;
      if (refresh) updateTacticsView();
      else renderSummary(club);
      dispatchTacticsChanged();
    });
  };
  onSelectChange('formation', formationSelect, true);
  onSelectChange('mentality', mentalitySelect);
  onSelectChange('tempo', tempoSelect);
  onSelectChange('pressure', pressureSelect);

  autoBtn?.addEventListener('click', () => {
    const club = getUserClub();
    if (!club) return;
    ensureExtendedTactics(club);
    autoPickMatchdaySquad(club, 9);
    dispatchLineupChanged();
    dispatchTacticsChanged();
  });

  // Botones rápidos
  quickRoot?.addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-tactics-key] [data-tactics-value]') : null;
    if (!btn) return;
    const group = btn.closest('[data-tactics-key]');
    const key = group?.getAttribute('data-tactics-key');
    const value = btn.getAttribute('data-tactics-value');
    if (!key || !value) return;

    const club = getUserClub();
    if (!club) return;
    ensureExtendedTactics(club);
    club.tactics[key] = value;
    setActiveQuickButtons(quickRoot, key, value);
    renderSummary(club);
    dispatchTacticsChanged();
  });

  // Set pieces
  const onSPChange = (key, el) => {
    el?.addEventListener('change', () => {
      const club = getUserClub();
      if (!club) return;
      ensureExtendedTactics(club);
      const v = el.value ? String(el.value) : '';
      club.tactics.setPieces[key] = v || '';
      dispatchTacticsChanged();
    });
  };
  onSPChange('penalties', selPen);
  onSPChange('freeKicks', selFk);
  onSPChange('corners', selCor);

  // Tabla titulares: seleccionar jugador
  const xiBody = document.getElementById('tactics-xi-body');
  xiBody?.addEventListener('click', (e) => {
    const tr = e.target instanceof Element ? e.target.closest('tr[data-player-id]') : null;
    if (!tr) return;
    selectedPlayerId = tr.dataset.playerId;
    updateTacticsView();
  });

  // Campo: click + drag
  const pitchEl = document.getElementById('tactics-pitch');
  pitchEl?.addEventListener('pointerdown', (e) => {
    const dot = e.target instanceof Element ? e.target.closest('.pcf-dot--draggable[data-player-id]') : null;
    if (!dot || !(e instanceof PointerEvent)) return;
    const club = getUserClub();
    if (!club) return;
    ensureExtendedTactics(club);

    const pid = dot.dataset.playerId;
    selectedPlayerId = pid;

    const rect = pitchEl.getBoundingClientRect();
    const curLeft = parseFloat(dot.style.left) || 50;
    const curTop = parseFloat(dot.style.top) || 50;
    const pxLeft = rect.left + (curLeft / 100) * rect.width;
    const pxTop = rect.top + (curTop / 100) * rect.height;
    dragging = {
      pid,
      offsetX: e.clientX - pxLeft,
      offsetY: e.clientY - pxTop,
    };
    dot.setPointerCapture(e.pointerId);
    dot.classList.add('is-dragging');
    updateTacticsView();
  });

  pitchEl?.addEventListener('pointermove', (e) => {
    if (!dragging || !(e instanceof PointerEvent)) return;
    const club = getUserClub();
    if (!club) return;
    ensureExtendedTactics(club);
    const rect = pitchEl.getBoundingClientRect();

    const x = e.clientX - rect.left - dragging.offsetX;
    const y = e.clientY - rect.top - dragging.offsetY;
    const left = clamp((x / rect.width) * 100, 0, 100);
    const top = clamp((y / rect.height) * 100, 0, 100);

    // pintar en vivo
    const dot = pitchEl.querySelector(`.pcf-dot--draggable[data-player-id="${dragging.pid}"]`);
    if (dot) {
      dot.style.left = `${left}%`;
      dot.style.top = `${top}%`;
    }
  });

  const endDrag = (e) => {
    if (!dragging) return;
    const club = getUserClub();
    if (!club) { dragging = null; return; }
    ensureExtendedTactics(club);
    const dot = pitchEl?.querySelector(`.pcf-dot--draggable[data-player-id="${dragging.pid}"]`);
    if (dot) {
      dot.classList.remove('is-dragging');
      const left = clamp(parseFloat(dot.style.left) || 50, 0, 100);
      const top = clamp(parseFloat(dot.style.top) || 50, 0, 100);
      club.tactics.manualPositions[String(dragging.pid)] = { left, top };
      dispatchTacticsChanged();
    }
    dragging = null;
  };

  pitchEl?.addEventListener('pointerup', endDrag);
  pitchEl?.addEventListener('pointercancel', endDrag);

  // Guardar / Cargar / Reset posiciones
  btnSave?.addEventListener('click', () => {
    const club = getUserClub();
    if (!club) return;
    ensureExtendedTactics(club);
    savePreset(club);
    renderPresets(club);
  });
  btnLoad?.addEventListener('click', () => {
    const club = getUserClub();
    if (!club) return;
    const ok = loadPreset(club, selectedPresetId);
    if (ok) updateTacticsView();
  });
  presetsUl?.addEventListener('click', (e)=>{
    const li = e.target instanceof Element ? e.target.closest('li[data-preset-id]') : null;
    if(!li) return;
    const id = li.dataset.presetId;
    const club = getUserClub();
    if(!club) return;
    ensureExtendedTactics(club);
    if (selectedPresetId === id){
      pendingRenamePresetId = id;
      renderPresets(club);
      return;
    }
    const ok = loadPreset(club, id);
    if (ok) updateTacticsView();
  });
  btnResetPos?.addEventListener('click', () => {
    const club = getUserClub();
    if (!club) return;
    ensureExtendedTactics(club);
    club.tactics.manualPositions = {};
    dispatchTacticsChanged();
    updateTacticsView();
  });

  // Primera pintura
  updateTacticsView();
}

export function updateTacticsView() {
  const club = getUserClub();
  if (!club) return;
  ensureExtendedTactics(club);
  const t = club.tactics;

  const formationSelect = document.getElementById('tactics-formation');
  const mentalitySelect = document.getElementById('tactics-mentality');
  const tempoSelect = document.getElementById('tactics-tempo');
  const pressureSelect = document.getElementById('tactics-pressure');
  const quickRoot = document.getElementById('tactics-quick');

  if (formationSelect) formationSelect.value = t.formation || '4-4-2';
  if (mentalitySelect) mentalitySelect.value = t.mentality || 'BALANCED';
  if (tempoSelect) tempoSelect.value = t.tempo || 'NORMAL';
  if (pressureSelect) pressureSelect.value = t.pressure || 'NORMAL';

  if (quickRoot) {
    setActiveQuickButtons(quickRoot, 'playStyle', t.playStyle || 'POSSESSION');
    setActiveQuickButtons(quickRoot, 'transition', t.transition || 'MIXED');
    setActiveQuickButtons(quickRoot, 'focus', t.focus || 'GENERAL');
  }

  renderSummary(club);
  renderXIListTable(club);
  renderSetPieces(club);
  renderTacticsPitch(club);
  renderPlayerCard(club);
  renderPresets(club);
}