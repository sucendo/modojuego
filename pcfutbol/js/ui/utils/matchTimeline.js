// js/ui/utils/matchTimeline.js
// Renderiza cronologías estilo "línea central" (tipo Google) para cualquier partido.

import { escapeHtml } from './dom.js';

function n0(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function capFirst(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function minuteLabel(minute) {
  const m = n0(minute);
  if (!m) return '-';
  // Stoppage simplificado: 90+X
  if (m > 90) return `90+${m - 90}'`;
  return `${m}'`;
}

function buildPlayerIndexFromClubs(clubs) {
  const idx = new Map();
  (clubs || []).forEach((club) => {
    const ps = Array.isArray(club?.players) ? club.players : [];
    ps.forEach((p) => {
      if (p?.id) idx.set(p.id, { player: p, club });
    });
  });
  return idx;
}

function getPlayerName(playerIndex, pid) {
  if (!pid) return 'Jugador';
  const info = playerIndex?.get?.(pid) || null;
  return info?.player?.name || String(pid);
}

function getClubLabel(clubIndex, id) {
  const c = clubIndex?.get?.(id) || null;
  return (c && (c.shortName || c.name)) || String(id || '');
}

function normalizeEvents(fx) {
  const events = Array.isArray(fx?.events) ? fx.events.slice() : [];
  const subs = Array.isArray(fx?.substitutions) ? fx.substitutions : [];
  subs.forEach((s) => {
    if (!s) return;
    events.push({
      type: 'SUB',
      minute: n0(s.minute),
      clubId: s.clubId,
      inPlayerId: s.inPlayerId,
      outPlayerId: s.outPlayerId,
    });
  });

  // Orden descendente (como en la captura: 90+... arriba)
  events.sort((a, b) => {
    const ma = typeof a?.minute === 'number' ? a.minute : n0(a?.minute);
    const mb = typeof b?.minute === 'number' ? b.minute : n0(b?.minute);
    return mb - ma;
  });

  return events;
}

function eventIconId(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'GOAL') return 'ico-ball';
  if (t === 'SUB') return 'ico-sub';
  if (t === 'INJURY') return 'ico-injury';
  if (t === 'YELLOW' || t === 'YELLOW_CARD' || t === 'CARD_YELLOW') return 'ico-yellow';
  if (t === 'RED' || t === 'RED_CARD' || t === 'CARD_RED') return 'ico-red';
  return 'ico-dot';
}

function buildEntryHTML({ fx, ev, clubIndex, playerIndex }) {
  const t = String(ev?.type || '').toUpperCase();
  const teamLabel = getClubLabel(clubIndex, ev?.clubId);

  // Texto principal + subtítulo (para SUB/GOAL)
  let main = '';
  let sub = '';

  if (t === 'GOAL') {
    main = getPlayerName(playerIndex, ev?.playerId);
    if (ev?.assistPlayerId) sub = `Asist.: ${getPlayerName(playerIndex, ev.assistPlayerId)}`;
  } else if (t === 'SUB') {
    main = getPlayerName(playerIndex, ev?.inPlayerId);
    const out = getPlayerName(playerIndex, ev?.outPlayerId);
    sub = `entra por ${out}`;
  } else if (t === 'YELLOW' || t === 'YELLOW_CARD' || t === 'CARD_YELLOW') {
    main = getPlayerName(playerIndex, ev?.playerId);
  } else if (t === 'RED' || t === 'RED_CARD' || t === 'CARD_RED') {
    main = getPlayerName(playerIndex, ev?.playerId);
  } else if (t === 'INJURY') {
    main = getPlayerName(playerIndex, ev?.playerId);
    sub = ev?.injuryType ? String(ev.injuryType) : 'Lesión';
  } else {
    main = capFirst(String(ev?.type || 'Evento'));
    if (ev?.playerId) sub = getPlayerName(playerIndex, ev.playerId);
  }

  const minute = minuteLabel(ev?.minute);
  const iconId = eventIconId(t);

  const isHome = String(ev?.clubId) === String(fx?.homeClubId);
  const isAway = String(ev?.clubId) === String(fx?.awayClubId);
  const side = isHome ? 'home' : isAway ? 'away' : 'neutral';

  const entry = `
    <div class="pcf-mtl__entry">
      <div class="pcf-mtl__main">${escapeHtml(main || teamLabel || '—')}</div>
      ${sub ? `<div class="pcf-mtl__sub">${escapeHtml(sub)}</div>` : ''}
    </div>
  `;

  const center = `
    <div class="pcf-mtl__center">
      <span class="pcf-mtl__badge pcf-mtl__badge--${escapeHtml(iconId.replace('ico-',''))}">
        <svg class="pcf-ico" aria-hidden="true" focusable="false">
          <use href="img/resources/pcf-icons.svg#${escapeHtml(iconId)}"></use>
        </svg>
      </span>
    </div>
  `;

  if (side === 'home') {
    return `
      <div class="pcf-mtl__item is-home">
        <div class="pcf-mtl__col pcf-mtl__col--left">
          ${entry}
          <div class="pcf-mtl__min">${escapeHtml(minute)}</div>
        </div>
        ${center}
        <div class="pcf-mtl__col pcf-mtl__col--right"></div>
      </div>
    `;
  }

  if (side === 'away') {
    return `
      <div class="pcf-mtl__item is-away">
        <div class="pcf-mtl__col pcf-mtl__col--left"></div>
        ${center}
        <div class="pcf-mtl__col pcf-mtl__col--right">
          <div class="pcf-mtl__min">${escapeHtml(minute)}</div>
          ${entry}
        </div>
      </div>
    `;
  }

  // Neutral (árbitro, VAR, etc.) → centrado
  return `
    <div class="pcf-mtl__item is-neutral">
      <div class="pcf-mtl__col pcf-mtl__col--left"></div>
      ${center}
      <div class="pcf-mtl__col pcf-mtl__col--right">
        <div class="pcf-mtl__min">${escapeHtml(minute)}</div>
        ${entry}
      </div>
    </div>
  `;
}

export function buildMatchTimelineHTML(containerOpts) {
  const {
    fx,
    clubIndex,
    clubs,
    playerIndex: passedPlayerIndex,
    maxItems = 60,
    withFinalLabel = true,
    withWrap = true,
    filter,
  } = containerOpts || {};
  if (!fx?.played) return `<div class="muted">Sin cronología.</div>`;

  const idx = passedPlayerIndex || buildPlayerIndexFromClubs(clubs || []);
  let events = normalizeEvents(fx);
  if (typeof filter === 'function') {
    events = events.filter((e) => {
      try { return !!filter(e); } catch { return true; }
    });
  }
  if (!events.length) return `<div class="muted">Sin cronología.</div>`;

  const sliced = events.slice(0, maxItems);
  const hasFirstHalf = sliced.some((e) => n0(e?.minute) > 0 && n0(e?.minute) <= 45);
  const hasSecondHalf = sliced.some((e) => n0(e?.minute) > 45);

  let html = '';
  if (withWrap) html += `<div class="pcf-mtl-wrap">`;
  html += `<div class="pcf-mtl">`;
  if (withFinalLabel) html += `<div class="pcf-mtl__sep">Final del partido</div>`;

  let insertedBreak = false;
  let seenSecondHalf = false;

  sliced.forEach((ev) => {
    const m = n0(ev?.minute);
    if (hasFirstHalf && hasSecondHalf) {
      if (m > 45) seenSecondHalf = true;
      if (!insertedBreak && seenSecondHalf && m <= 45) {
        html += `<div class="pcf-mtl__sep">Descanso</div>`;
        insertedBreak = true;
      }
    }
    html += buildEntryHTML({ fx, ev, clubIndex, playerIndex: idx });
  });

  html += `</div>`;
  if (withWrap) html += `</div>`;
  return html;
}

export function renderMatchTimeline(container, opts) {
  if (!container) return;
  const html = buildMatchTimelineHTML(opts);
  container.innerHTML = html;
}