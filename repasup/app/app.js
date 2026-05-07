import { initUI, runGame } from '../engine/game-engine.js';
import { loadCatalog } from './services/catalog-service.js';
import { getRepasoStatsForPlayer } from './services/progress-service.js';
import {
  AVATARS,
  applyAppearance,
  ensurePlayer,
  getActiveAppearance,
  getFavorites,
  getPlayer,
  listPlayers,
  loadStore,
  persistAppearance,
  renamePlayer,
  deletePlayer,
  setCurrentPlayer,
  toggleFavorite,
  saveStore,
} from './services/store-service.js';
import { goDeck, goHome, parseRoute } from './router.js';

const state = {
  catalog: [],
  catalogById: new Map(),
  store: loadStore(),
  favoritesOnly: false,
  activeGameDeckId: null,
  appearancePreview: null,
};

const els = {
  searchInput: document.getElementById('searchInput'),
  subjectFilter: document.getElementById('subjectFilter'),
  playerSelect: document.getElementById('playerSelect'),
  btnNewPlayer: document.getElementById('btnNewPlayer'),
  btnPlayerOptions: document.getElementById('btnPlayerOptions'),
  btnDeckHome: document.getElementById('btnDeckHome'),
  btnGameStats: document.getElementById('btnGameStats'),
  btnBackPortal: document.getElementById('btnBackPortal'),
  btnShowFavs: document.getElementById('btnShowFavs'),
  countLabel: document.getElementById('countLabel'),
  summaryBar: document.getElementById('summaryBar'),
  cardsGrid: document.getElementById('cardsGrid'),
  homeView: document.getElementById('homeView'),
  gameView: document.getElementById('gameView'),
  gameMount: document.getElementById('gameMount'),
  brandLogo: document.getElementById('brandLogo'),
  headerSubcopy: document.getElementById('headerSubcopy'),
  shellModalBack: document.getElementById('shellModalBack'),
  shellModalClose: document.getElementById('shellModalClose'),
  shellModalBody: document.getElementById('shellModalBody'),
  shellModalTitle: document.getElementById('shellModalTitle'),
  shellModalEyebrow: document.getElementById('shellModalEyebrow'),
};

function $(selector, root = document){ return root.querySelector(selector); }
function escapeHtml(value){
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function norm(text){
  return String(text || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}
function uniq(values){ return [...new Set((values || []).filter(Boolean))]; }
function getActivePlayer(){ return getPlayer(state.store); }
function renderAvatarButton(avatar, isOn = false){
  return `
    <button class="avatarOpt ${isOn ? 'on' : ''}" type="button" data-avatar="${avatar}" aria-label="Avatar ${avatar}">
      <span class="avatarEmoji" aria-hidden="true">${avatar}</span>
    </button>
  `;
}
function getFavoritesSet(){ return getFavorites(state.store); }
function applyAppearancePreview(appearance){
  const next = {
    ...getActiveAppearance(state.store),
    ...(appearance || {})
  };
  document.documentElement.setAttribute('data-theme', next.theme);
  document.body.dataset.density = next.density;
  els.brandLogo.textContent = next.avatar;
  return next;
}
function beginAppearancePreview(){
  state.appearancePreview = {
    baseline: getActiveAppearance(state.store)
  };
}
function finishAppearancePreview({ restore = false } = {}){
  if (restore && state.appearancePreview?.baseline){
    applyAppearancePreview(state.appearancePreview.baseline);
    renderSummaryBar();
  }
  state.appearancePreview = null;
}
function getAppearanceDraftFromModal(){
  return {
    theme: document.getElementById('appearanceTheme')?.value || 'pastel',
    density: document.getElementById('appearanceDensity')?.value || 'normal',
    avatar: document.querySelector('#appearanceAvatarRow .avatarOpt.on')?.dataset.avatar || '🎮'
  };
}
function refreshAppearancePreviewFromModal(){
  if (!state.appearancePreview) return;
  const next = getAppearanceDraftFromModal();
  applyAppearancePreview(next);
}

function toast(message){
  const text = String(message || '').trim();
  if (!text) return;
  let el = document.getElementById('shellToast');
  if (!el){
    el = document.createElement('div');
    el.id = 'shellToast';
    Object.assign(el.style, {
      position:'fixed', left:'50%', bottom:'16px', transform:'translateX(-50%)', zIndex:'3000',
      padding:'10px 12px', borderRadius:'999px', border:'2px solid var(--line-soft)',
      background:'var(--surface-soft)', boxShadow:'0 16px 34px rgba(2,6,23,.18)', fontWeight:'950'
    });
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { el.style.display = 'none'; }, 1800);
}

function openShellModal({ title, eyebrow = 'Opciones', bodyHTML = '' }){
  els.shellModalTitle.textContent = title;
  els.shellModalEyebrow.textContent = eyebrow;
  els.shellModalBody.innerHTML = bodyHTML;
  els.shellModalBack.hidden = false;
  els.shellModalBack.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeShellModal(){
  finishAppearancePreview({ restore: true });
  els.shellModalBack.hidden = true;
  els.shellModalBack.classList.remove('is-open');
  els.shellModalBody.innerHTML = '';
  document.body.style.overflow = '';
}
function currentDeckLink(deck){
  return `${window.location.origin}${window.location.pathname}#/deck/${encodeURIComponent(deck.id)}`;
}
async function copyText(text){
  try {
    await navigator.clipboard.writeText(text);
    toast('✅ Enlace copiado');
  } catch {
    toast('No se pudo copiar automáticamente');
  }
}

function renderPlayerSelect(){
  const players = listPlayers(state.store);
  const currentId = state.store.currentPlayerId || '';
  const options = [`<option value="">Invitado</option>`]
    .concat(players.map(player => `<option value="${player.id}" ${player.id === currentId ? 'selected' : ''}>${escapeHtml(player.name)}</option>`));
  els.playerSelect.innerHTML = options.join('');
}

function renderSummaryBar(){
  const player = getActivePlayer();
  const favorites = getFavoritesSet();
  const stats = player ? getRepasoStatsForPlayer(state.store.currentPlayerId) : null;
  const appearance = getActiveAppearance(state.store);
  els.brandLogo.textContent = appearance.avatar;
  const chips = [
    `<span class="chip">📚 Decks <b>${state.catalog.length}</b></span>`,
    `<span class="chip">⭐ Favoritos <b>${favorites.size}</b></span>`,
    player
      ? `<span class="chip">👤 ${escapeHtml(player.name)}</span>`
      : `<span class="chip">👤 Invitado</span>`,
    stats
      ? `<span class="chip">🎯 Precisión <b>${stats.accuracy}%</b></span>`
      : `<span class="chip">🎯 Sin progreso guardado</span>`,
    stats
      ? `<span class="chip">⏱️ ${stats.timeMin} min</span>`
      : ''
  ].filter(Boolean).join('');
  const right = [`<span class="chip">Tema <b>${appearance.theme}</b></span>`, `<span class="chip">Vista <b>${appearance.density}</b></span>`].join('');
  els.summaryBar.innerHTML = `<div class="summaryChips">${chips}</div><div class="summaryChips">${right}</div>`;
}

function getSubjectOptions(){
  const subjects = uniq(state.catalog.map(deck => deck.subject));
  return ['<option value="all">Todas las materias</option>', '<option value="fav">Solo favoritos</option>']
    .concat(subjects.map(subject => {
      const deck = state.catalog.find(item => item.subject === subject);
      return `<option value="${escapeHtml(subject)}">${escapeHtml(deck?.subjectLabel || subject)}</option>`;
    })).join('');
}

function passesFilters(deck){
  const q = norm(els.searchInput.value);
  const subject = els.subjectFilter.value;
  const favorites = getFavoritesSet();
  if (state.favoritesOnly && !favorites.has(deck.id)) return false;
  if (subject === 'fav' && !favorites.has(deck.id)) return false;
  if (subject !== 'all' && subject !== 'fav' && deck.subject !== subject) return false;
  if (!q) return true;
  const hay = norm([deck.title, deck.description, deck.subjectLabel, deck.level, deck.tags.join(' '), deck.langs.join(' ')].join(' | '));
  return hay.includes(q);
}

function renderCards(){
  const favorites = getFavoritesSet();
  const list = state.catalog.filter(passesFilters);
  els.countLabel.textContent = String(list.length);
  if (!list.length){
    els.cardsGrid.innerHTML = `<div class="emptyState"><h3>No hay decks para este filtro</h3><p class="muted">Prueba otra búsqueda o cambia el filtro actual.</p></div>`;
    return;
  }
  els.cardsGrid.innerHTML = list.map(deck => {
    const isFav = favorites.has(deck.id);
    return `
      <article class="card" data-id="${deck.id}">
        <div class="cardTop">
          <div class="cardTitle">
            <div class="cardIcon">${escapeHtml(deck.icon)}</div>
            <div>
              <h3>${escapeHtml(deck.title)}</h3>
              <div class="metaChips">
                <span class="tag">${escapeHtml(deck.subjectLabel)}</span>
                <span class="tag">${escapeHtml(deck.level)}</span>
                ${deck.langs.length ? `<span class="tag">${escapeHtml(deck.langs.join(' · '))}</span>` : ''}
                <span class="tag">${deck.itemCount} ítems</span>
              </div>
            </div>
          </div>
          <button class="btn soft favBtn" data-action="fav">${isFav ? '⭐' : '☆'}</button>
        </div>
        <p class="desc">${escapeHtml(deck.description)}</p>
        <div class="metaChips">
          ${deck.tags.slice(0, 5).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="cardActions">
          <button class="btn primary" data-action="open">Abrir</button>
          <button class="btn soft" data-action="preview">Vista previa</button>
          <button class="btn soft" data-action="copy">Copiar link</button>
        </div>
      </article>
    `;
  }).join('');

  els.cardsGrid.querySelectorAll('.card').forEach(card => {
    const deck = state.catalogById.get(card.dataset.id);
    card.querySelector('[data-action="open"]').onclick = () => goDeck(deck.id);
    card.querySelector('[data-action="preview"]').onclick = () => openPreview(deck);
    card.querySelector('[data-action="copy"]').onclick = () => copyText(currentDeckLink(deck));
    card.querySelector('[data-action="fav"]').onclick = () => {
      try {
        toggleFavorite(state.store, deck.id);
        renderSummaryBar();
        renderCards();
      } catch (error) {
        toast(error.message || 'Primero crea un jugador.');
      }
    };
  });
}

function openPreview(deck){
  openShellModal({
    title: deck.title,
    eyebrow: 'Vista previa',
    bodyHTML: `
      <div class="formGrid">
        <p class="desc">${escapeHtml(deck.description)}</p>
        <div class="metaChips">
          <span class="tag">${escapeHtml(deck.subjectLabel)}</span>
          <span class="tag">${escapeHtml(deck.level)}</span>
          <span class="tag">${deck.itemCount} ítems</span>
          ${deck.topicsCount ? `<span class="tag">${deck.topicsCount} temas</span>` : ''}
        </div>
        <div class="metaChips">${deck.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="cardActions">
          <button class="btn primary" id="modalOpenDeck">Abrir deck</button>
          <button class="btn soft" id="modalCopyDeck">Copiar link</button>
        </div>
      </div>
    `
  });
  $('#modalOpenDeck').onclick = () => { closeShellModal(); goDeck(deck.id); };
  $('#modalCopyDeck').onclick = () => copyText(currentDeckLink(deck));
}

function openPlayerModal(){
  const avatarButtons = AVATARS.map((avatar, index) => renderAvatarButton(avatar, index === 0)).join('');
  openShellModal({
    title: 'Nuevo jugador',
    eyebrow: 'Perfil',
    bodyHTML: `
      <div class="formGrid">
        <label class="formGrid">
          <span>Nombre del jugador</span>
          <input id="newPlayerName" placeholder="Ej. Samuel" maxlength="32"/>
        </label>
        <div>
          <span>Avatar</span>
          <div class="avatarRow" id="avatarRow">${avatarButtons}</div>
        </div>
        <div class="cardActions">
          <button class="btn primary" id="saveNewPlayer">Guardar jugador</button>
        </div>
      </div>
    `
  });
  $('#avatarRow').querySelectorAll('.avatarOpt').forEach(btn => {
    btn.onclick = () => {
      $('#avatarRow').querySelectorAll('.avatarOpt').forEach(node => node.classList.remove('on'));
      btn.classList.add('on');
    };
  });
  $('#saveNewPlayer').onclick = () => {
    const name = $('#newPlayerName').value.trim();
    const avatar = $('#avatarRow .avatarOpt.on')?.dataset.avatar || '🎮';
    try {
      ensurePlayer(state.store, { name, avatar });
      applyAppearance(state.store);
      renderAll();
      closeShellModal();
      toast('✅ Jugador guardado');
    } catch (error) {
      toast(error.message || 'No se pudo crear el jugador');
    }
  };
}

function openPlayerOptions(){
  const player = getActivePlayer();
  const appearance = getActiveAppearance(state.store);
  if (!player){
    openShellModal({
      title: 'Perfil',
      eyebrow: 'Configuración',
      bodyHTML: `
        <div class="formGrid">
          <p class="desc">Ahora mismo estás jugando como invitado. Puedes crear un jugador o ajustar el aspecto global.</p>
          ${renderAppearanceFields(appearance)}
          <div class="cardActions"><button class="btn primary" id="saveAppearanceOnly">Guardar apariencia</button></div>
        </div>
      `
    });
    bindAppearanceEditor(() => {
      renderAll();
      closeShellModal();
      toast('✅ Apariencia actualizada');
    });
    return;
  }
  openShellModal({
    title: 'Perfil del jugador',
    eyebrow: 'Configuración',
    bodyHTML: `
      <div class="formGrid">
        <label class="formGrid">
          <span>Nombre</span>
          <input id="editPlayerName" value="${escapeHtml(player.name)}" maxlength="32"/>
        </label>
        ${renderAppearanceFields(appearance)}
        <div class="cardActions">
          <button class="btn primary" id="savePlayerOptions">Guardar cambios</button>
          <button class="btn soft" id="deletePlayerBtn">Eliminar jugador</button>
        </div>
      </div>
    `
  });
  bindAppearanceEditor(() => {});
  $('#savePlayerOptions').onclick = () => {
    try {
      renamePlayer(state.store, state.store.currentPlayerId, $('#editPlayerName').value);
      saveAppearanceFromModal();
      renderAll();
      closeShellModal();
      toast('✅ Perfil actualizado');
    } catch (error) {
      toast(error.message || 'No se pudo actualizar el perfil');
    }
  };
  $('#deletePlayerBtn').onclick = () => {
    const ok = window.confirm(`¿Eliminar a ${player.name}?`);
    if (!ok) return;
	finishAppearancePreview({ restore: false });
    deletePlayer(state.store, state.store.currentPlayerId);
    applyAppearance(state.store);
    renderAll();
    closeShellModal();
    toast('🗑️ Jugador eliminado');
  };
}

function renderAppearanceFields(appearance){
  return `
    <div class="formGrid two">
      <label class="formGrid">
        <span>Tema</span>
        <select id="appearanceTheme">
          ${['pastel','aurora','ocean','forest','sunset','midnight'].map(theme => `<option value="${theme}" ${appearance.theme === theme ? 'selected' : ''}>${theme}</option>`).join('')}
        </select>
      </label>
      <label class="formGrid">
        <span>Densidad</span>
        <select id="appearanceDensity">
          ${['normal','compact'].map(value => `<option value="${value}" ${appearance.density === value ? 'selected' : ''}>${value}</option>`).join('')}
        </select>
      </label>
    </div>
    <div>
      <span>Avatar</span>
      <div class="avatarRow" id="appearanceAvatarRow">
        ${AVATARS.map(avatar => renderAvatarButton(avatar, appearance.avatar === avatar)).join('')}
      </div>
    </div>
  `;
}

function bindAppearanceEditor(onSave){
  const row = document.getElementById('appearanceAvatarRow');
  const themeSelect = document.getElementById('appearanceTheme');
  const densitySelect = document.getElementById('appearanceDensity');
  if (!row && !themeSelect && !densitySelect) return;

  beginAppearancePreview();

  if (row){
    row.querySelectorAll('.avatarOpt').forEach(btn => {
      btn.onclick = () => {
        row.querySelectorAll('.avatarOpt').forEach(node => node.classList.remove('on'));
        btn.classList.add('on');
        refreshAppearancePreviewFromModal();
      };
    });
  }
  themeSelect?.addEventListener('change', refreshAppearancePreviewFromModal);
  densitySelect?.addEventListener('change', refreshAppearancePreviewFromModal);
  
  const saveBtn = document.getElementById('saveAppearanceOnly');
  if (saveBtn){
    saveBtn.onclick = () => {
      saveAppearanceFromModal();
      onSave();
    };
  }
}

function saveAppearanceFromModal(){
  const avatar = document.querySelector('#appearanceAvatarRow .avatarOpt.on')?.dataset.avatar || '🎮';
  persistAppearance(state.store, {
    theme: document.getElementById('appearanceTheme')?.value || 'pastel',
    density: document.getElementById('appearanceDensity')?.value || 'normal',
    avatar
  });
  applyAppearance(state.store);
  finishAppearancePreview({ restore: false });
  saveStore(state.store);
}

function updateRouteVisibility(route){
  const inGame = route.name === 'deck';
  document.querySelectorAll('.homeOnly').forEach(el => {
    el.classList.toggle('hidden', inGame);
    el.hidden = inGame;
  });
  document.querySelectorAll('.routeOnly').forEach(el => {
    el.classList.toggle('hidden', !inGame);
    el.hidden = !inGame;
  });
  els.headerSubcopy.innerHTML = inGame
    ? 'Jugando dentro del mismo <code>index.html</code>; los <code>games/*.html</code> quedan como legacy.'
    : 'Catálogo leído desde <code>data/manifest.json</code> + cabecera de cada deck JSON.';
}


async function mountDeck(deck){
  els.headerSubcopy.innerHTML = `${escapeHtml(deck.title)} · ${escapeHtml(deck.subjectLabel)} · ${escapeHtml(deck.level)} · <b>${deck.itemCount} ítems</b>`;
  if (state.activeGameDeckId !== deck.id){
    if (typeof els.gameMount.__repasoCleanup === 'function') {
      try { els.gameMount.__repasoCleanup(); } catch(error) { console.warn(error); }
      els.gameMount.__repasoCleanup = null;
    }
    els.gameMount.innerHTML = '';
    initUI(els.gameMount, { embedded: true });
    state.activeGameDeckId = deck.id;
    await runGame({
      root: els.gameMount,
      deckUrl: deck.file,
      externalControls: {
        homeBtn: els.btnDeckHome,
        statsBtn: els.btnGameStats,
        portalHref: './index.html'
      }
    });
  }
}


async function renderRoute(){
  const route = parseRoute();
  updateRouteVisibility(route);
  if (route.name === 'home'){
    if (typeof els.gameMount.__repasoCleanup === 'function') {
      try { els.gameMount.__repasoCleanup(); } catch(error) { console.warn(error); }
      els.gameMount.__repasoCleanup = null;
    }
    state.activeGameDeckId = null;
    return;
  }
  const deck = state.catalogById.get(route.deckId);
  if (!deck){
    goHome();
    toast('No se encontró ese deck en el catálogo actual');
    return;
  }
  await mountDeck(deck);
}

function bindEvents(){
  window.addEventListener('hashchange', () => { renderRoute().catch(handleFatalError); });
  els.searchInput.addEventListener('input', renderCards);
  els.subjectFilter.addEventListener('change', renderCards);
  els.playerSelect.addEventListener('change', () => {
    setCurrentPlayer(state.store, els.playerSelect.value || null);
    applyAppearance(state.store);
    renderAll();
  });
  els.btnNewPlayer.onclick = openPlayerModal;
  els.btnPlayerOptions.onclick = openPlayerOptions;
  els.btnDeckHome.onclick = () => window.dispatchEvent(new CustomEvent('repaso:deck-home'));
  els.btnBackPortal.onclick = () => goHome();
  els.btnShowFavs.onclick = () => {
    state.favoritesOnly = !state.favoritesOnly;
    els.btnShowFavs.textContent = state.favoritesOnly ? '⭐ Viendo favoritos' : '⭐ Favoritos';
    renderCards();
  };
  els.shellModalClose.onclick = closeShellModal;
  els.shellModalBack.addEventListener('click', event => { if (event.target === els.shellModalBack) closeShellModal(); });
}

function renderAll(){
  applyAppearance(state.store);
  renderPlayerSelect();
  renderSummaryBar();
  els.subjectFilter.innerHTML = getSubjectOptions();
  renderCards();
}

function handleFatalError(error){
  console.error(error);
  els.cardsGrid.innerHTML = `<div class="emptyState"><h3>No se pudo cargar la app</h3><p class="muted">${escapeHtml(error?.message || String(error))}</p></div>`;
}

async function init(){
  bindEvents();
  state.catalog = await loadCatalog();
  state.catalogById = new Map(state.catalog.map(deck => [deck.id, deck]));
  renderAll();
  await renderRoute();
}

init().catch(handleFatalError);
