import { APP_CONFIG } from '../config/appConfig.js';

export function createBootSplash({
  title = APP_CONFIG.app.title,
  logoUrl = '',
  delayMs = APP_CONFIG.boot.delayMs,
  fadeMs = APP_CONFIG.boot.fadeMs,
} = {}) {
  const root = document.createElement('div');
  root.id = 'bootSplash';
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.zIndex = '99999';
  root.style.display = 'flex';
  root.style.alignItems = 'center';
  root.style.justifyContent = 'center';
  root.style.background = '#000';
  root.style.opacity = '1';
  root.style.pointerEvents = 'auto';
  root.style.transition = `opacity ${fadeMs}ms ease`;

  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';
  wrap.style.justifyContent = 'center';
  wrap.style.gap = '22px';
  wrap.style.padding = '24px';
  wrap.style.transform = 'translateY(-2%)';

  const img = document.createElement('img');
  img.alt = 'Logo';
  img.src = logoUrl;
  img.style.display = logoUrl ? 'block' : 'none';
  img.style.width = 'min(42vw, 420px)';
  img.style.maxWidth = '80vw';
  img.style.maxHeight = '40vh';
  img.style.objectFit = 'contain';
  img.style.filter = 'drop-shadow(0 0 24px rgba(255,255,255,0.10))';
  img.style.userSelect = 'none';
  img.draggable = false;
  img.onerror = () => {
    img.style.display = 'none';
  };

  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.color = '#fff';
  titleEl.style.fontFamily = 'Arial, Helvetica, sans-serif';
  titleEl.style.fontSize = 'clamp(28px, 4vw, 56px)';
  titleEl.style.fontWeight = '700';
  titleEl.style.letterSpacing = '0.28em';
  titleEl.style.textAlign = 'center';
  titleEl.style.textShadow = '0 0 22px rgba(255,255,255,0.12)';
  titleEl.style.userSelect = 'none';

  wrap.appendChild(img);
  wrap.appendChild(titleEl);
  root.appendChild(wrap);
  document.body.appendChild(root);

  let removed = false;

  const remove = () => {
    if (removed) return;
    removed = true;
    try { root.remove(); } catch (_) {}
  };

  const startFadeOut = () => {
    window.setTimeout(() => {
      root.style.opacity = '0';
      root.style.pointerEvents = 'none';
      window.setTimeout(remove, fadeMs + 60);
    }, delayMs);
  };

  return { root, remove, startFadeOut };
}

export function createIntroModal({
  title = APP_CONFIG.app.title,
  subtitle = APP_CONFIG.intro.subtitle,
  logoUrl = '',
  storyHtml = APP_CONFIG.intro.storyHtml,
  controlsHtml = APP_CONFIG.intro.controlsHtml,
  storageKey = APP_CONFIG.storage.introSeenKey,
  dontShowCheckedByDefault = APP_CONFIG.intro.dontShowCheckedByDefault,
} = {}) {
  let root = null;
  let panel = null;
  let dontShow = null;
  let isOpen = false;

  function markSeen() {
    try { localStorage.setItem(storageKey, '1'); } catch (_) {}
  }

  function hasSeen() {
    try { return localStorage.getItem(storageKey) === '1'; } catch (_) { return false; }
  }

  function build() {
    root = document.createElement('div');
    root.id = 'introModal';
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '100000';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.justifyContent = 'center';
    root.style.padding = '18px';
    root.style.background = 'rgba(0,0,0,0.74)';
    root.style.backdropFilter = 'blur(7px)';
    root.style.opacity = '0';
    root.style.pointerEvents = 'auto';
    root.style.transition = 'opacity 420ms ease';

    panel = document.createElement('div');
    panel.style.width = 'min(1100px, calc(100vw - 24px))';
    panel.style.maxHeight = 'min(88vh, 980px)';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.overflow = 'hidden';
    panel.style.borderRadius = '18px';
    panel.style.border = '1px solid rgba(255,255,255,0.14)';
    panel.style.background = 'linear-gradient(180deg, rgba(10,14,24,0.96), rgba(5,7,12,0.96))';
    panel.style.boxShadow = '0 24px 80px rgba(0,0,0,0.45)';
    panel.style.color = '#eaf2ff';
    panel.style.fontFamily = 'Arial, Helvetica, sans-serif';
    panel.style.transform = 'translateY(20px) scale(0.985)';
    panel.style.transition = 'transform 420ms ease, opacity 420ms ease';
    panel.style.opacity = '0';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '16px';
    header.style.padding = '18px 20px';
    header.style.borderBottom = '1px solid rgba(255,255,255,0.10)';
    header.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))';

    const logo = document.createElement('img');
    logo.alt = 'Logo';
    logo.src = logoUrl;
    logo.style.width = '76px';
    logo.style.height = '76px';
    logo.style.objectFit = 'contain';
    logo.style.flex = '0 0 auto';
    logo.style.display = logoUrl ? 'block' : 'none';
    logo.onerror = () => { logo.style.display = 'none'; };

    const titleWrap = document.createElement('div');
    titleWrap.style.minWidth = '0';
    titleWrap.style.flex = '1 1 auto';

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.fontSize = 'clamp(24px, 3vw, 40px)';
    titleEl.style.fontWeight = '700';
    titleEl.style.letterSpacing = '0.12em';
    titleEl.style.color = '#ffffff';

    const subEl = document.createElement('div');
    subEl.textContent = subtitle;
    subEl.style.marginTop = '6px';
    subEl.style.fontSize = '14px';
    subEl.style.opacity = '0.78';
    subEl.style.letterSpacing = '0.04em';

    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(subEl);
    header.appendChild(logo);
    header.appendChild(titleWrap);

    const body = document.createElement('div');
    body.style.display = 'grid';
    body.style.gridTemplateColumns = 'minmax(0, 1.55fr) minmax(280px, 0.95fr)';
    body.style.gap = '18px';
    body.style.padding = '18px';
    body.style.overflow = 'auto';

    const storyCard = document.createElement('section');
    storyCard.style.padding = '18px';
    storyCard.style.borderRadius = '14px';
    storyCard.style.border = '1px solid rgba(255,255,255,0.10)';
    storyCard.style.background = 'rgba(255,255,255,0.03)';
    storyCard.innerHTML = `<h2 style="margin:0 0 14px 0; font-size:22px; letter-spacing:0.04em; color:#fff;">Historia del simulador</h2><div style="font-size:15px; line-height:1.72; color:rgba(234,242,255,0.92);">${storyHtml}</div>`;

    const helpCard = document.createElement('section');
    helpCard.style.padding = '18px';
    helpCard.style.borderRadius = '14px';
    helpCard.style.border = '1px solid rgba(255,255,255,0.10)';
    helpCard.style.background = 'rgba(120,170,255,0.05)';
    helpCard.innerHTML = `<h2 style="margin:0 0 14px 0; font-size:22px; letter-spacing:0.04em; color:#fff;">Cómo se maneja</h2><div style="font-size:14px; line-height:1.72; color:rgba(234,242,255,0.92);">${controlsHtml}</div>`;

    body.appendChild(storyCard);
    body.appendChild(helpCard);

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.flexWrap = 'wrap';
    footer.style.alignItems = 'center';
    footer.style.justifyContent = 'space-between';
    footer.style.gap = '12px';
    footer.style.padding = '14px 18px 18px';
    footer.style.borderTop = '1px solid rgba(255,255,255,0.10)';

    const left = document.createElement('label');
    left.style.display = 'inline-flex';
    left.style.alignItems = 'center';
    left.style.gap = '10px';
    left.style.fontSize = '14px';
    left.style.opacity = '0.92';
    left.style.cursor = 'pointer';

    dontShow = document.createElement('input');
    dontShow.type = 'checkbox';
    dontShow.checked = !!dontShowCheckedByDefault;

    const leftTxt = document.createElement('span');
    leftTxt.textContent = 'No volver a mostrar al iniciar';

    left.appendChild(dontShow);
    left.appendChild(leftTxt);

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '10px';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Entrar al simulador';
    closeBtn.style.padding = '10px 16px';
    closeBtn.style.borderRadius = '10px';
    closeBtn.style.border = '1px solid rgba(255,255,255,0.18)';
    closeBtn.style.background = 'linear-gradient(180deg, rgba(140,190,255,0.22), rgba(90,130,210,0.18))';
    closeBtn.style.color = '#fff';
    closeBtn.style.fontWeight = '700';
    closeBtn.style.cursor = 'pointer';

    right.appendChild(closeBtn);
    footer.appendChild(left);
    footer.appendChild(right);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    root.appendChild(panel);

    closeBtn.onclick = () => close();
    root.onclick = (ev) => {
      if (ev.target === root) close();
    };
  }

  function open(force = false) {
    if (isOpen) return;
    if (!force && hasSeen()) return;
    if (!root) build();

    document.body.appendChild(root);
    isOpen = true;

    window.requestAnimationFrame(() => {
      root.style.opacity = '1';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0) scale(1)';
    });
  }

  function close() {
    if (!isOpen || !root) return;
    if (dontShow?.checked) markSeen();

    root.style.opacity = '0';
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(20px) scale(0.985)';

    window.setTimeout(() => {
      if (!isOpen) return;
      isOpen = false;
      try { root.remove(); } catch (_) {}
    }, 430);
  }

  return { open, close, hasSeen };
}