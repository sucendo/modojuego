// HEXATEGOS 0.33 · panel de nueva partida móvil/desktop
(() => {
  const setup = document.getElementById('newGameSetup3302');
  const head = setup?.querySelector('.newGameSetupHead3302');
  const minBtn = document.getElementById('setupMinimize033');
  if (!setup || !head || !minBtn) return;

  let drag = null;
  let wasOpen = setup.classList.contains('open3302');

  const resetPosition = () => {
    setup.style.removeProperty('left');
    setup.style.removeProperty('right');
    setup.style.removeProperty('top');
    setup.style.removeProperty('bottom');
    setup.style.removeProperty('transform');
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

    setup.style.left = r.left + 'px';
    setup.style.top = r.top + 'px';
    setup.style.right = 'auto';
    setup.style.bottom = 'auto';
    setup.style.transform = 'none';
    setup.classList.add('dragging033');

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
    setup.style.left = x + 'px';
    setup.style.top = y + 'px';
    e.preventDefault();
  });

  const endDrag = e => {
    if (!drag || (e.pointerId !== undefined && drag.id !== e.pointerId)) return;
    try { head.releasePointerCapture(drag.id); } catch (_) {}
    drag = null;
    setup.classList.remove('dragging033');
  };
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);

  // Cada nueva apertura empieza limpia y compacta, pero el mapa queda totalmente
  // interactivo fuera de la propia tarjeta.
  const obs = new MutationObserver(() => {
    const open = setup.classList.contains('open3302');
    if (open && !wasOpen) {
      resetPosition();
      setMinimized(false);
    }
    wasOpen = open;
  });
  obs.observe(setup, { attributes: true, attributeFilter: ['class'] });

  addEventListener('resize', () => {
    if (!setup.classList.contains('open3302')) return;
    const r = setup.getBoundingClientRect();
    if (r.right > innerWidth || r.bottom > innerHeight || r.left < 0 || r.top < 0) resetPosition();
  }, { passive: true });
})();
