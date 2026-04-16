
const videos = [
  {
    "id": "ugtlX2GEmfQ",
    "title": "Movilidad Tronco de Pie ( cabeza y columna )"
  },
  {
    "id": "FGdAfeNB9-g",
    "title": "Movilidad Tren inferior"
  },
  {
    "id": "dKd71jlC77k",
    "title": "Hazlo conmigo ( rutina movilidad )"
  },
  {
    "id": "rlTU5ChSv58",
    "title": "Movilidad columna en el suelo"
  },
  {
    "id": "xHPQAhVKTFk",
    "title": "Pulgares OK"
  },
  {
    "id": "TqVpOugBdWY",
    "title": "La concha con gomas"
  },
  {
    "id": "MziByg6GKbA",
    "title": "Remo con goma"
  },
  {
    "id": "XSfCP2QYZCM",
    "title": "Sentadilla isometrica pared 90º"
  },
  {
    "id": "IYFBJgaM7jI",
    "title": "Pull over"
  },
  {
    "id": "OYncFHGX_HY",
    "title": "Peso muerto con kettlebell"
  },
  {
    "id": "GhYlEtK7eis",
    "title": "Kb around the world"
  },
  {
    "id": "Iih5bd_Wgv0",
    "title": "Sentadilla con goma"
  },
  {
    "id": "Ohk_LFIYII4",
    "title": "Remo al mentón con goma"
  },
  {
    "id": "_a1G1tk15tQ",
    "title": "Pull over con goma de pie"
  },
  {
    "id": "1rU8-baK7f4",
    "title": "Abducción con goma sentados"
  },
  {
    "id": "lvtbxwgTzXM",
    "title": "Sentadilla con carga frontal"
  },
  {
    "id": "sRSL-3P9WCY",
    "title": "Remo con peso o kb"
  },
  {
    "id": "3irR0csgTxE",
    "title": "Facepull con goma"
  },
  {
    "id": "C8f2lGdM3B8",
    "title": "Press 1 mano con mancuerna o kb"
  },
  {
    "id": "RtdEWd095u4",
    "title": "Combo kb 2. Biceps Sentadilla Press hombro"
  },
  {
    "id": "taKytGRTCCQ",
    "title": "Zancada lateral"
  },
  {
    "id": "RrCC_Q7nXAk",
    "title": "Video para familias"
  },
  {
    "id": "zdlMDXNs9fg",
    "title": "Vídeo zdlMDXNs9fg"
  },
  {
    "id": "O5rG4u6G0N4",
    "title": "Posición de la aguja"
  },
  {
    "id": "CFCyccgV9bU",
    "title": "Sentadilla Sumo con KB"
  },
  {
    "id": "rHwU321JUws",
    "title": "Avanzada. Movilidad articular I"
  },
  {
    "id": "Rs0xHFPvdys",
    "title": "Cuadriceps isométrico sentado en silla con goma"
  },
  {
    "id": "8LERwEXbe_Y",
    "title": "Dead bug"
  },
  {
    "id": "kgS6bEAK9u4",
    "title": "Walking sides con goma"
  },
  {
    "id": "T4pF6VUS9bA",
    "title": "Puente de isquiotibiales"
  },
  {
    "id": "kmdhTwIhjGQ",
    "title": "Paso del granjero"
  },
  {
    "id": "vWUu6VGSTAU",
    "title": "Lunge a ladrillo"
  },
  {
    "id": "8nOcQwmNeE0",
    "title": "Plancha ventral ( regresión y básico 1 )"
  },
  {
    "id": "U92M5o8i7Nw",
    "title": "Puente de glúteo unilateral"
  },
  {
    "id": "B7Nfhizyn7Y",
    "title": "Plancha lateral"
  },
  {
    "id": "ipr7I-rEdlA",
    "title": "Plancha frontal con variación en pies"
  },
  {
    "id": "48YQ01B2fjE",
    "title": "Zancada frontal peso corporal"
  },
  {
    "id": "69FqL6ggMfc",
    "title": "Liberación miofascial planta del pie"
  }
];

const loginView = document.getElementById('login-view');
const galleryView = document.getElementById('gallery-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const videoGrid = document.getElementById('video-grid');
const stats = document.getElementById('stats');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');
const modal = document.getElementById('player-modal');
const modalTitle = document.getElementById('modal-title');
const modalPlayer = document.getElementById('modal-player');
const modalClose = document.getElementById('modal-close');

const SESSION_KEY = 'videmon_auth';
const THEME_KEY = 'videmon_theme';
const LAST_PLAYED_KEY = 'videmon_last_played';

function decodeBase64(value) {
  try { return atob(value); } catch (e) { return ''; }
}

async function loadUsers() {
  const response = await fetch('./users.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudo leer users.json');
  const data = await response.json();
  return (data.users || []).map(user => ({
    username: decodeBase64(user.username_b64),
    password: decodeBase64(user.password_b64),
    role: user.role || 'viewer'
  }));
}

function sanitize(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readLastPlayedMap() {
  try {
    const raw = localStorage.getItem(LAST_PLAYED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeLastPlayedMap(map) {
  localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(map));
}

function formatDate(value) {
  if (!value) return 'Aún no reproducido';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Aún no reproducido';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d);
}

function createVideoCard(video) {
  const safeTitle = sanitize(video.title);
  const safeId = sanitize(video.id);
  const lastPlayed = readLastPlayedMap()[video.id];
  return `
    <article class="video-card" data-video-id="${safeId}">
      <button class="thumb-button" data-play-id="${safeId}" data-play-title="${safeTitle}" aria-label="Reproducir ${safeTitle}">
        <img class="video-thumb" src="https://img.youtube.com/vi/${safeId}/hqdefault.jpg" alt="Miniatura de ${safeTitle}" loading="lazy" />
        <span class="play-badge">▶ Reproducir</span>
      </button>
      <div class="video-content">
        <h3 class="video-title">${safeTitle}</h3>
        <p class="video-meta">YouTube ID: ${safeId}</p>
        <p class="video-last-played">Última reproducción: <strong data-last-played="${safeId}">${sanitize(formatDate(lastPlayed))}</strong></p>
      </div>
    </article>
  `;
}

function renderVideos(filter = '') {
  const term = filter.trim().toLowerCase();
  const filtered = videos.filter(video =>
    video.title.toLowerCase().includes(term) || video.id.toLowerCase().includes(term)
  );

  stats.textContent = `Mostrando ${filtered.length} de ${videos.length} vídeos.`;

  if (!filtered.length) {
    videoGrid.innerHTML = '<div class="empty-state">No hay vídeos que coincidan con la búsqueda.</div>';
    return;
  }

  videoGrid.innerHTML = filtered.map(createVideoCard).join('');
}

function showGallery() {
  loginView.classList.remove('active');
  galleryView.classList.add('active');
  renderVideos(searchInput.value);
}

function showLogin() {
  galleryView.classList.remove('active');
  loginView.classList.add('active');
}

function persistSession(username) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, loggedAt: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  closePlayer();
}

function hasSession() {
  return Boolean(sessionStorage.getItem(SESSION_KEY));
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'light' ? 'Modo oscuro' : 'Modo día';
}

function initializeTheme() {
  const theme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function saveLastPlayed(videoId) {
  const map = readLastPlayedMap();
  const value = new Date().toISOString();
  map[videoId] = value;
  writeLastPlayedMap(map);
  const target = document.querySelector(`[data-last-played="${videoId}"]`);
  if (target) target.textContent = formatDate(value);
}

function openPlayer(videoId, title) {
  modalTitle.textContent = title;
  modalPlayer.innerHTML = `
    <iframe
      class="modal-frame"
      src="https://www.youtube.com/embed/${sanitize(videoId)}?autoplay=1&rel=0"
      title="${sanitize(title)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen>
    </iframe>
  `;
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  saveLastPlayed(videoId);
}

function closePlayer() {
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  modalPlayer.innerHTML = '';
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const users = await loadUsers();
    const match = users.find(user => user.username === username && user.password === password);

    if (!match) {
      loginError.textContent = 'Usuario o contraseña incorrectos.';
      return;
    }

    persistSession(username);
    loginForm.reset();
    showGallery();
  } catch (error) {
    console.error(error);
    loginError.textContent = 'No se pudo validar el acceso. Comprueba users.json.';
  }
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  showLogin();
});

searchInput.addEventListener('input', (event) => {
  renderVideos(event.target.value);
});

themeToggle.addEventListener('click', toggleTheme);

videoGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-play-id]');
  if (!button) return;
  openPlayer(button.getAttribute('data-play-id'), button.getAttribute('data-play-title'));
});

modalClose.addEventListener('click', closePlayer);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closePlayer();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePlayer();
});

window.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  if (hasSession()) showGallery();
  else showLogin();
});
