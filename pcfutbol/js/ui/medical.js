/**
 * Médico / lesiones / sanciones (placeholder).
 */

import { GameState } from '../state.js';

function getUserClub() {
  const clubId = GameState.user?.clubId;
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  if (!clubs.length) return null;
  if (!clubId) return clubs[0];
  return clubs.find((c) => c?.id === clubId) || clubs[0];
}

function ensureClubMedical(club) {
  if (!club) return;
  if (!club.medical) {
    club.medical = { centerLevel: 1, physioLevel: 1 };
  } else {
    if (club.medical.centerLevel == null) club.medical.centerLevel = 1;
    if (club.medical.physioLevel == null) club.medical.physioLevel = 1;
  }
}

function formatCurrency(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return '-';
  try {
    return v.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });
  } catch {
    return String(Math.round(v));
  }
}

function isPlayerInjuredNow(p) {
  const m = p?.injury?.matchesRemaining;
  return Number.isFinite(m) && m > 0;
}

function isPlayerSuspendedNow(p) {
  const m = p?.suspension?.matchesRemaining;
  return Number.isFinite(m) && m > 0;
}

function describeCenterLevel(level) {
  switch (level) {
    case 1:
      return 'Instalaciones básicas. Probabilidad estándar de lesión en partido.';
    case 2:
      return 'Centro médico moderno. Menos lesiones en los partidos más exigentes.';
    case 3:
      return 'Centro de alto rendimiento. Reducción notable del riesgo de lesión.';
    case 4:
      return 'Instalaciones de élite. Protección máxima frente a lesiones.';
    default:
      return '';
  }
}

function describePhysioLevel(level) {
  switch (level) {
    case 1:
      return 'Equipo reducido. Recuperaciones dentro de los plazos normales.';
    case 2:
      return 'Fisioterapeutas a tiempo completo. Algunas lesiones se acortan.';
    case 3:
      return 'Departamento avanzado. Muchas lesiones se recortan 1 partido extra.';
    case 4:
      return 'Equipo de referencia mundial. Recuperaciones muy aceleradas.';
    default:
      return '';
  }
}

function getMedicalUpgradeCost(kind, currentLevel) {
  const base = kind === 'center' ? 2_000_000 : 1_200_000;
  const multiplier = 1 + (currentLevel - 1) * 0.6;
  return Math.round(base * multiplier);
}

export function updateQuickNotes() {
  const list = document.getElementById('quick-notes');
  if (!list) return;

  const club = getUserClub();
  if (!club) {
    list.innerHTML = `
      <li>Versión prototipo del juego.</li>
      <li>Sin información de club disponible todavía.</li>
    `;
    return;
  }

  ensureClubMedical(club);

  const players = Array.isArray(club.players) ? club.players : [];
  const injured = players.filter((p) => isPlayerInjuredNow(p));
  const sanctioned = players.filter((p) => isPlayerSuspendedNow(p));

  const centerLevel = club.medical?.centerLevel ?? 1;
  const physioLevel = club.medical?.physioLevel ?? 1;

  list.innerHTML = '';

  // 1) Últimos resultados (del club)
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  const played = fixtures
    .filter((fx) => fx && fx.played && (fx.homeClubId === club.id || fx.awayClubId === club.id))
    .slice()
    .sort((a, b) => Number(b.matchday || 0) - Number(a.matchday || 0));

  const liResultsTitle = document.createElement('li');
  liResultsTitle.innerHTML = `<strong>Resultados recientes:</strong>`;
  list.appendChild(liResultsTitle);

  if (played.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Aún no se han jugado partidos.';
    list.appendChild(li);
  } else {
    played.slice(0, 3).forEach((fx) => {
      const hg = fx.homeGoals ?? 0;
      const ag = fx.awayGoals ?? 0;
      const isHome = fx.homeClubId === club.id;
      const gf = isHome ? hg : ag;
      const gc = isHome ? ag : hg;
      const res = gf > gc ? 'V' : gf < gc ? 'D' : 'E';
      const li = document.createElement('li');
      li.textContent = `J${fx.matchday}: ${fx.homeClubId} ${hg}-${ag} ${fx.awayClubId} (${res})`;
      list.appendChild(li);
    });
  }

  const liHealth = document.createElement('li');
  const aHealth = document.createElement('a');
  aHealth.href = '#';

  const textLesionados =
    injured.length === 0
      ? 'sin lesionados'
      : injured.length === 1
      ? '1 lesionado'
      : `${injured.length} lesionados`;

  const textSancionados =
    sanctioned.length === 0
      ? 'sin sancionados'
      : sanctioned.length === 1
      ? '1 sancionado'
      : `${sanctioned.length} sancionados`;

  aHealth.textContent = `Plantilla: ${textLesionados}, ${textSancionados} (ver área médica)`;

  aHealth.addEventListener('click', (ev) => {
    ev.preventDefault();
    const btn = document.getElementById('btn-nav-medical');
    if (btn && !btn.disabled) btn.click();
  });

  liHealth.appendChild(aHealth);
  list.appendChild(liHealth);

  const liInfra = document.createElement('li');
  liInfra.textContent = `Centro médico nivel ${centerLevel}, fisioterapeutas nivel ${physioLevel}.`;
  list.appendChild(liInfra);
  
  // 3) Novedades (placeholder futuro)
  const liNews = document.createElement('li');
  const news = Array.isArray(GameState.news) ? GameState.news : [];
  liNews.innerHTML = `<strong>Novedades:</strong> ${news[0]?.text || 'Sin novedades destacadas.'}`;
  list.appendChild(liNews);
}

export function updateMedicalView() {
  const club = getUserClub();
  if (!club) return;
  ensureClubMedical(club);

  const centerLevelEl = document.getElementById('medical-center-level');
  const physioLevelEl = document.getElementById('medical-physio-level');
  const centerDescEl = document.getElementById('medical-center-desc');
  const physioDescEl = document.getElementById('medical-physio-desc');
  const centerCostEl = document.getElementById('medical-center-next-cost');
  const physioCostEl = document.getElementById('medical-physio-next-cost');
  const injBody = document.getElementById('medical-injuries-body');
  const sancBody = document.getElementById('medical-sanctions-body');

  const centerLevel = club.medical.centerLevel ?? 1;
  const physioLevel = club.medical.physioLevel ?? 1;

  if (centerLevelEl) centerLevelEl.textContent = `Nivel ${centerLevel}`;
  if (physioLevelEl) physioLevelEl.textContent = `Nivel ${physioLevel}`;
  if (centerDescEl) centerDescEl.textContent = describeCenterLevel(centerLevel);
  if (physioDescEl) physioDescEl.textContent = describePhysioLevel(physioLevel);

  if (centerCostEl) {
    const nextCost = centerLevel >= 4 ? null : getMedicalUpgradeCost('center', centerLevel);
    centerCostEl.textContent = nextCost ? `Próx. mejora: ${formatCurrency(nextCost)}` : 'Nivel máximo alcanzado';
  }

  if (physioCostEl) {
    const nextCost = physioLevel >= 4 ? null : getMedicalUpgradeCost('physio', physioLevel);
    physioCostEl.textContent = nextCost ? `Próx. mejora: ${formatCurrency(nextCost)}` : 'Nivel máximo alcanzado';
  }

  // Lesiones
  if (injBody) {
    injBody.innerHTML = '';
    const injured = (club.players || []).filter((p) => isPlayerInjuredNow(p));
    if (injured.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4">No hay jugadores lesionados.</td>`;
      injBody.appendChild(tr);
    } else {
      injured.forEach((p) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p.name || 'Jugador'}</td>
          <td>${p.position || '-'}</td>
          <td>${p.injury?.type || '-'}</td>
          <td>${p.injury?.matchesRemaining != null ? String(p.injury.matchesRemaining) : '-'}</td>
        `;
        injBody.appendChild(tr);
      });
    }
  }

  // Sanciones
  if (sancBody) {
    sancBody.innerHTML = '';
    const sanctioned = (club.players || []).filter((p) => isPlayerSuspendedNow(p));
    if (sanctioned.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5">No hay jugadores sancionados.</td>`;
      sancBody.appendChild(tr);
    } else {
      sanctioned.forEach((p) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p.name || 'Jugador'}</td>
          <td>${p.position || '-'}</td>
          <td>${p.suspension?.type || '-'}</td>
          <td>${p.suspension?.matchesRemaining != null ? String(p.suspension.matchesRemaining) : '-'}</td>
          <td>${String(p.yellowCards ?? 0)}</td>
        `;
        sancBody.appendChild(tr);
      });
    }
  }

  updateQuickNotes();
}

export function upgradeMedical(kind, { onAfterUpgrade } = {}) {
  const club = getUserClub();
  if (!club) return false;
  ensureClubMedical(club);

  const key = kind === 'center' ? 'centerLevel' : 'physioLevel';
  const currentLevel = club.medical[key] ?? 1;
  if (currentLevel >= 4) {
    alert('Ya has alcanzado el nivel máximo.');
    return false;
  }

  const cost = getMedicalUpgradeCost(kind, currentLevel);
  if (club.cash == null) club.cash = 0;

  if (club.cash < cost) {
    alert('No tienes suficiente dinero en caja para esta mejora.');
    return false;
  }

  const label = kind === 'center' ? 'Centro médico' : 'Departamento de fisioterapia';
  const ok = confirm(`Mejorar ${label} a nivel ${currentLevel + 1} por ${formatCurrency(cost)}?`);
  if (!ok) return false;

  club.cash -= cost;
  club.medical[key] = currentLevel + 1;

  if (typeof onAfterUpgrade === 'function') onAfterUpgrade();
  return true;
}

export function initMedicalUI({ onAfterUpgrade } = {}) {
  const btnCenter = document.getElementById('btn-medical-upgrade-center');
  const btnPhysio = document.getElementById('btn-medical-upgrade-physio');

  if (btnCenter) {
    btnCenter.addEventListener('click', () => {
      upgradeMedical('center', { onAfterUpgrade });
    });
  }
  if (btnPhysio) {
    btnPhysio.addEventListener('click', () => {
      upgradeMedical('physio', { onAfterUpgrade });
    });
  }
}