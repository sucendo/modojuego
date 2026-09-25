// HEXATEGOS 0.33 · panel de nueva partida móvil/desktop
(() => {
  const setup = document.getElementById('newGameSetup3302');
  const head = setup?.querySelector('.newGameSetupHead3302');
  const minBtn = document.getElementById('setupMinimize033');
  if (!setup || !head || !minBtn) return;

  let drag = null;
  let wasOpen = setup.classList.contains('open3302');
  const POS_KEY = 'hexategos.ui.newGameSetup.pos.033';

  const readPos = () => {
    try { return JSON.parse(localStorage.getItem(POS_KEY) || 'null'); }
    catch (_) { return null; }
  };

  const savePos = () => {
    const r = setup.getBoundingClientRect();
    try { localStorage.setItem(POS_KEY, JSON.stringify({x:r.left,y:r.top})); } catch (_) {}
  };

  const resetPosition = () => {
    setup.style.removeProperty('left');
    setup.style.removeProperty('right');
    setup.style.removeProperty('top');
    setup.style.removeProperty('bottom');
    setup.style.removeProperty('transform');
    setup.classList.remove('uiMoved033','dragging033');
  };

  const applySavedPosition = () => {
    const pos = readPos();
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
      resetPosition();
      return;
    }
    const r = setup.getBoundingClientRect();
    const margin = 4;
    const maxX = Math.max(margin, innerWidth - r.width - margin);
    const maxY = Math.max(margin, innerHeight - r.height - margin);
    const x = Math.min(maxX, Math.max(margin, pos.x));
    const y = Math.min(maxY, Math.max(margin, pos.y));
    setup.classList.add('uiMoved033');
    setup.style.setProperty('left', x + 'px', 'important');
    setup.style.setProperty('top', y + 'px', 'important');
    setup.style.setProperty('right', 'auto', 'important');
    setup.style.setProperty('bottom', 'auto', 'important');
    setup.style.setProperty('transform', 'none', 'important');
  };

  const setMinimized = value => {
    setup.classList.toggle('minimized033', value);
    minBtn.textContent = value ? '+' : '−';
    minBtn.setAttribute('aria-label', value ? 'Ampliar panel' : 'Minimizar panel');
    minBtn.title = value ? 'Ampliar panel' : 'Minimizar panel';
  };

  minBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    setMinimized(!setup.classList.contains('minimized033'));
  });

  head.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button')) return;

    const r = setup.getBoundingClientRect();
    drag = {
      id: e.pointerId,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top
    };

    setup.classList.add('uiMoved033','dragging033');
    setup.style.setProperty('left', r.left + 'px', 'important');
    setup.style.setProperty('top', r.top + 'px', 'important');
    setup.style.setProperty('right', 'auto', 'important');
    setup.style.setProperty('bottom', 'auto', 'important');
    setup.style.setProperty('transform', 'none', 'important');

    try { head.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  head.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const r = setup.getBoundingClientRect();
    const margin = 4;
    const maxX = Math.max(margin, innerWidth - r.width - margin);
    const maxY = Math.max(margin, innerHeight - r.height - margin);
    const x = Math.min(maxX, Math.max(margin, e.clientX - drag.dx));
    const y = Math.min(maxY, Math.max(margin, e.clientY - drag.dy));
    setup.style.setProperty('left', x + 'px', 'important');
    setup.style.setProperty('top', y + 'px', 'important');
    e.preventDefault();
  });

  const endDrag = e => {
    if (!drag || (e.pointerId !== undefined && drag.id !== e.pointerId)) return;
    try { head.releasePointerCapture(drag.id); } catch (_) {}
    drag = null;
    setup.classList.remove('dragging033');
    savePos();
  };
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);

  // Cada nueva apertura conserva la última posición elegida por el usuario.
  // El mapa sigue totalmente interactivo fuera de la propia tarjeta.
  const obs = new MutationObserver(() => {
    const open = setup.classList.contains('open3302');
    if (open && !wasOpen) {
      applySavedPosition();
      setMinimized(false);
    }
    wasOpen = open;
  });
  obs.observe(setup, { attributes: true, attributeFilter: ['class'] });

  addEventListener('resize', () => {
    if (!setup.classList.contains('open3302')) return;
    applySavedPosition();
    savePos();
  }, { passive: true });
})();
