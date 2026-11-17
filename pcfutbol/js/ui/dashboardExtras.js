/** Paneles y accesos personalizados de la portada. Solo presentación y preferencias locales. */
import { GameState } from '../state.js';
import { getUserClub } from '../game/selectors.js';
import { createCoatImgElement } from './utils/coats.js';
import { buildClubInbox, buildFootballNews } from './dashboardFeed.js';

const SHORTCUTS_KEY = 'pcfutbol.dashboard.shortcuts.v1';
const LINKS = [
  ['squad', 'Plantilla', '♟'],
  ['tactics', 'Tácticas', '⌁'],
  ['calendar', 'Calendario', '▦'],
  ['transfermarket', 'Fichajes', '⇄'],
  ['stats', 'Estadísticas', '▥'],
  ['standings', 'Clasificación', '▤'],
  ['alignment', 'Alineación', '♜'],
  ['results', 'Resultados', '◈'],
  ['medical', 'Médicos', '✚'],
  ['nextmatch', 'Partido', '⚽'],
];
const DEFAULT_LINKS = LINKS.slice(0, 5).map(([key]) => key);
let bound = false;

function loadShortcuts() {
  try {
    const data = JSON.parse(localStorage.getItem(SHORTCUTS_KEY));
    if (!Array.isArray(data)) return DEFAULT_LINKS.slice();
    const valid = new Set(LINKS.map(([key]) => key));
    const selected = [...new Set(data)].filter(key => valid.has(key));
    return selected.length ? selected.slice(0, 7) : DEFAULT_LINKS.slice();
  } catch {
    return DEFAULT_LINKS.slice();
  }
}

function saveShortcuts(selected) {
  try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(selected)); } catch { /* modo privado */ }
}

let chosen = null;

function renderShortcuts() {
  const list = document.getElementById('pcf-shortcuts-list');
  const options = document.getElementById('pcf-shortcuts-options');
  if (!list || !options) return;
  chosen ??= loadShortcuts();
  list.replaceChildren();
  options.replaceChildren();

  for (const [key, label, icon] of LINKS) {
    if (chosen.includes(key)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pcf-shortcuts__chip';
      btn.dataset.navTarget = key;
      btn.textContent = `${icon}  ${label}`;
      list.appendChild(btn);
    }

    const choice = document.createElement('label');
    choice.className = 'pcf-shortcuts__choice';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = key;
    input.checked = chosen.includes(key);
    input.disabled = !input.checked && chosen.length >= 7;
    input.addEventListener('change', () => {
      if (input.checked) chosen = [...chosen, key].slice(0, 7);
      else if (chosen.length > 1) chosen = chosen.filter(value => value !== key);
      saveShortcuts(chosen);
      renderShortcuts();
    });
    const text = document.createElement('span');
    text.textContent = label;
    choice.append(input, text);
    options.appendChild(choice);
  }
}

function togglePicker(open) {
  const picker = document.getElementById('pcf-shortcuts-picker');
  const btn = document.getElementById('pcf-shortcuts-edit');
  if (!picker || !btn) return;
  picker.classList.toggle('hidden', !open);
  btn.setAttribute('aria-expanded', String(open));
  if (open) picker.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function syncNewsMoreButton() {
  const panel = document.querySelector('#view-dashboard .pcf-news');
  const list = document.getElementById('pcf-news-list');
  const more = document.getElementById('pcf-news-more');
  if (!panel || !list || !more) return;
  const mobile = window.matchMedia?.('(max-width: 780px)').matches ?? false;
  more.hidden = list.children.length <= (mobile ? 2 : 4);
  if (more.hidden) {
    panel.classList.remove('is-expanded');
    more.setAttribute('aria-expanded', 'false');
    more.firstChild.textContent = 'Ver todas las noticias ';
  }
}

function bindExtras() {
  if (bound || !document.getElementById('pcf-shortcuts-list')) return;
  bound = true;
  renderShortcuts();
  document.getElementById('pcf-shortcuts-edit')?.addEventListener('click', () => {
    const picker = document.getElementById('pcf-shortcuts-picker');
    togglePicker(picker?.classList.contains('hidden'));
  });
  document.getElementById('pcf-shortcuts-close')?.addEventListener('click', () => togglePicker(false));
  document.getElementById('pcf-mobile-more')?.addEventListener('click', () => togglePicker(true));
  window.addEventListener('resize', syncNewsMoreButton, { passive: true });
  document.getElementById('pcf-news-more')?.addEventListener('click', (event) => {
    const panel = document.querySelector('#view-dashboard .pcf-news');
    const expanded = panel?.classList.toggle('is-expanded') || false;
    event.currentTarget.setAttribute('aria-expanded', String(expanded));
    event.currentTarget.firstChild.textContent = expanded ? 'Ver menos noticias ' : 'Ver todas las noticias ';
  });
  document.getElementById('view-dashboard')?.addEventListener('click', (event) => {
    const toggle = event.target instanceof Element ? event.target.closest('[data-category-toggle]') : null;
    if (!toggle) return;
    const panel = toggle.closest('.pcf-panel');
    const expanded = panel?.classList.toggle('is-expanded') || false;
    toggle.setAttribute('aria-expanded', String(expanded));
  });
  document.getElementById('screen-dashboard')?.addEventListener('click', (event) => {
    const clicked = event.target instanceof Element ? event.target.closest('[data-nav-target]') : null;
    if (!clicked) return;
    togglePicker(false);
    document.querySelectorAll('.pcf-mobile-nav [data-nav-target]').forEach(el => {
      el.classList.toggle('is-current', el.dataset.navTarget === clicked.dataset.navTarget);
    });
  });
}

function addFeedItem(container, item, variant) {
  const entry = document.createElement(item.target ? 'button' : 'div');
  if (item.target) entry.type = 'button';
  entry.className = `pcf-feed-item pcf-feed-item--${variant}`;
  if (item.severity) entry.classList.add(`pcf-feed-item--${item.severity}`);
  if (item.target) entry.dataset.navTarget = item.target;

  const emblem = document.createElement('span');
  emblem.className = 'pcf-feed-item__emblem';
  if (variant === 'news') {
    const photoType = item.tag === 'FICHAJES' ? 'transfer'
      : item.tag === 'RESULTADOS' ? 'crowd'
        : item.tag === 'PRÓXIMO RIVAL' ? 'stadium' : 'press';
    emblem.classList.add('pcf-feed-item__emblem--photo', `pcf-feed-item__emblem--${photoType}`);
  }
  const related = item.clubId && createCoatImgElement(item.clubId, item.title, 46);
  if (related) emblem.appendChild(related);
  else emblem.textContent = item.icon || '•';
  if (variant === 'news' && item.score) {
    const result = document.createElement('span');
    result.className = 'pcf-feed-item__score';
    result.setAttribute('aria-hidden', 'true');
    result.textContent = item.score;
    emblem.appendChild(result);
  }

  const body = document.createElement('span');
  body.className = 'pcf-feed-item__body';
  const tag = document.createElement('span');
  tag.className = 'pcf-feed-item__tag';
  tag.textContent = item.tag;
  const heading = document.createElement('strong');
  heading.className = 'pcf-feed-item__title';
  heading.textContent = item.title;
  const description = document.createElement('span');
  description.className = 'pcf-feed-item__description';
  description.textContent = item.description;
  body.append(tag, heading, description);
  if (item.action) {
    const callToAction = document.createElement('span');
    callToAction.className = 'pcf-feed-item__action';
    callToAction.textContent = `${item.action}  ›`;
    body.appendChild(callToAction);
  }

  const chevron = document.createElement('span');
  chevron.className = 'pcf-feed-item__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '›';
  entry.append(emblem, body, chevron);
  container.appendChild(entry);
}

export function updateDashboardExtras() {
  bindExtras();
  const club = getUserClub(GameState);
  if (!club) return;
  const inbox = document.getElementById('pcf-inbox-list');
  const news = document.getElementById('pcf-news-list');
  const count = document.getElementById('pcf-inbox-count');
  if (inbox) {
    const items = buildClubInbox(GameState, club);
    inbox.replaceChildren();
    for (const item of items) addFeedItem(inbox, item, 'task');
    const idle = document.getElementById('pcf-inbox-idle');
    if (idle) {
      idle.hidden = !(items.length === 1 && (items[0].id === 'nextmatch' || items[0].id === 'clear'));
      const idleMessage = idle.querySelector('span:last-child');
      if (idleMessage) idleMessage.textContent = items[0]?.id === 'nextmatch'
        ? 'No hay más gestiones pendientes. Revisa la convocatoria y la táctica para tu próximo partido.'
        : 'No hay asuntos pendientes. Puedes explorar tu plantilla o avanzar en la temporada.';
    }
    if (count) {
      const urgent = items.filter(item => item.severity !== 'normal').length;
      count.textContent = String(urgent);
      count.hidden = urgent === 0;
    }
  }
  if (news) {
    news.replaceChildren();
    const items = buildFootballNews(GameState, club);
    for (const item of items) addFeedItem(news, item, 'news');
    const more = document.getElementById('pcf-news-more');
    if (more) {
      more.setAttribute('aria-expanded', 'false');
      more.firstChild.textContent = 'Ver todas las noticias ';
    }
    news.closest('.pcf-news')?.classList.remove('is-expanded');
    syncNewsMoreButton();
  }
}
