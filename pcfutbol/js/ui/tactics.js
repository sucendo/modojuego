/**
 * Tácticas (estilo de juego).
 *
 * - Controles (Sistema/Mentalidad/Ritmo/Presión + Auto)
 * - Controles rápidos inspirados en PCF (Posesión/Directo, Contra/Mixto, General/Ataque/Defensa)
 * - Esquema sobre un campo con los slots de la formación
 *
 * La alineación (XI/banquillo/no convocados) vive en /ui/alignment.js.
 */

import { GameState } from '../state.js';
import {
  ensureClubTactics,
  autoPickMatchdaySquad,
  getFormationSlots,
} from '../game/utils/index.js';

let bound = false;

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
  if (clubs.length === 0) return null;
  if (!clubId) return clubs[0];
  return clubs.find((c) => c.id === clubId) || clubs[0];
}

function ensureExtendedTactics(club) {
  ensureClubTactics(club);
  if (!club?.tactics) return;
  if (!club.tactics.playStyle) club.tactics.playStyle = 'POSSESSION';
  if (!club.tactics.transition) club.tactics.transition = 'MIXED';
  if (!club.tactics.focus) club.tactics.focus = 'GENERAL';
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

function renderTacticsPitch(pitchEl, formation) {
  if (!pitchEl) return;
  pitchEl.innerHTML = '';

  const slots = getFormationSlots(formation);
  // Numeración simple 1..11 (GK=1)
  slots.forEach((s, idx) => {
    const dot = document.createElement('div');
    dot.className = 'pcf-dot pcf-dot--slot';
    dot.style.left = `${s.x}%`;
    dot.style.top = `${s.y}%`;
    dot.textContent = String(idx + 1);
    dot.title = `${formation} · ${s.role}`;
    pitchEl.appendChild(dot);
  });
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

export function initTacticsUI() {
  if (bound) return;
  bound = true;

  const formationSelect = document.getElementById('tactics-formation');
  const mentalitySelect = document.getElementById('tactics-mentality');
  const tempoSelect = document.getElementById('tactics-tempo');
  const pressureSelect = document.getElementById('tactics-pressure');
  const autoBtn = document.getElementById('btn-tactics-auto');

  const pitch = document.getElementById('tactics-pitch');
  const quickRoot = document.getElementById('tactics-quick');

  // Rellenar selects (evita “...” del HTML)
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
      if (refresh) {
        updateTacticsView();
      } else {
        renderSummary(club);
      }
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

  // Primera pintura
  if (pitch) {
    const club = getUserClub();
    if (club) {
      ensureExtendedTactics(club);
      renderTacticsPitch(pitch, club.tactics.formation);
      renderSummary(club);
    }
  }
}

export function updateTacticsView() {
  const club = getUserClub();
  if (!club) return;
  ensureExtendedTactics(club);

  const formationSelect = document.getElementById('tactics-formation');
  const mentalitySelect = document.getElementById('tactics-mentality');
  const tempoSelect = document.getElementById('tactics-tempo');
  const pressureSelect = document.getElementById('tactics-pressure');
  const pitch = document.getElementById('tactics-pitch');
  const quickRoot = document.getElementById('tactics-quick');

  if (formationSelect) formationSelect.value = club.tactics.formation;
  if (mentalitySelect) mentalitySelect.value = club.tactics.mentality;
  if (tempoSelect) tempoSelect.value = club.tactics.tempo;
  if (pressureSelect) pressureSelect.value = club.tactics.pressure;

  if (quickRoot) {
    setActiveQuickButtons(quickRoot, 'playStyle', club.tactics.playStyle);
    setActiveQuickButtons(quickRoot, 'transition', club.tactics.transition);
    setActiveQuickButtons(quickRoot, 'focus', club.tactics.focus);
  }

  renderTacticsPitch(pitch, club.tactics.formation);
  renderSummary(club);
}
