// HEXATEGOS 0.33 · HUD unificado + posiciones persistentes + zoomCtl opcional
(() => {
  const rail = document.getElementById('leftRail3306');
  const zoomCtl = document.getElementById('zoomCtl3232');
  const zoomHandle = document.getElementById('zoomRead3232');
  const landingZoom = document.getElementById('landingZoomCtl033');

  const K_RAIL = 'hexategos.ui.leftRail.pos.033';
  const K_ZOOM_POS = 'hexategos.ui.zoomCtl.pos.033';
  const K_ZOOM_VISIBLE = 'hexategos.ui.zoomCtl.visible.033';

  const readJSON = key => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  };
  const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };

  function visiblePreference(){
    try {
      const v = localStorage.getItem(K_ZOOM_VISIBLE);
      return v === null ? true : v === '1';
    } catch (_) { return true; }
  }

  function setZoomVisible(show, source){
    const value = !!show;
    try { localStorage.setItem(K_ZOOM_VISIBLE, value ? '1' : '0'); } catch (_) {}
    zoomCtl?.classList.toggle('zoomCtlHidden033', !value);
    if (landingZoom && source !== landingZoom) landingZoom.checked = value;

    const sys = document.getElementById('settingsZoomCtl033');
    if (sys && source !== sys) sys.checked = value;
  }

  if (landingZoom){
    landingZoom.checked = visiblePreference();
    landingZoom.addEventListener('change', () => setZoomVisible(landingZoom.checked, landingZoom));
  }
  setZoomVisible(visiblePreference());

  function clampXY(el, x, y){
    const r = el.getBoundingClientRect();
    const margin = 4;
    const w = r.width || el.offsetWidth || 1;
    const h = r.height || el.offsetHeight || 1;
    return {
      x: Math.min(Math.max(margin, x), Math.max(margin, innerWidth - w - margin)),
      y: Math.min(Math.max(margin, y), Math.max(margin, innerHeight - h - margin))
    };
  }

  function applyPosition(el, pos){
    if (!el || !pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
    const p = clampXY(el, pos.x, pos.y);
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.transform = 'none';
    el.classList.add('uiMoved033');
  }

  function savePosition(el, key){
    if (!el) return;
    const r = el.getBoundingClientRect();
    writeJSON(key, {x:r.left, y:r.top});
  }

  function makeDraggable(el, handle, key){
    if (!el || !handle) return;
    let drag = null;

    handle.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      const r = el.getBoundingClientRect();
      drag = {id:e.pointerId, dx:e.clientX-r.left, dy:e.clientY-r.top};
      el.style.left = r.left + 'px';
      el.style.top = r.top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = 'none';
      el.classList.add('uiMoved033','dragging033');
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
      e.stopPropagation();
    });

    handle.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const p = clampXY(el, e.clientX-drag.dx, e.clientY-drag.dy);
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      e.preventDefault();
      e.stopPropagation();
    });

    const end = e => {
      if (!drag || (e.pointerId !== undefined && drag.id !== e.pointerId)) return;
      try { handle.releasePointerCapture(drag.id); } catch (_) {}
      drag = null;
      el.classList.remove('dragging033');
      savePosition(el,key);
      e.preventDefault?.();
      e.stopPropagation?.();
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  // Barra unificada: se puede arrastrar desde cualquier punto.
  // Un toque corto sobre un botón sigue activándolo; solo se convierte en arrastre
  // cuando el puntero supera el umbral de movimiento.
  if (rail){
    rail.querySelector('.railDragHandle033')?.remove();
    applyPosition(rail, readJSON(K_RAIL));

    let pending = null;
    let suppressClick = false;

    rail.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      const r = rail.getBoundingClientRect();
      pending = {
        id:e.pointerId,
        startX:e.clientX,
        startY:e.clientY,
        dx:e.clientX-r.left,
        dy:e.clientY-r.top,
        moved:false,
        threshold:e.pointerType === 'touch' ? 16 : 7
      };
      try { rail.setPointerCapture(e.pointerId); } catch (_) {}
    }, true);

    rail.addEventListener('pointermove', e => {
      if (!pending || pending.id !== e.pointerId) return;

      if (!pending.moved){
        const dist = Math.hypot(e.clientX-pending.startX,e.clientY-pending.startY);
        if (dist < pending.threshold) return;

        const r = rail.getBoundingClientRect();
        rail.style.left = r.left + 'px';
        rail.style.top = r.top + 'px';
        rail.style.right = 'auto';
        rail.style.bottom = 'auto';
        rail.style.transform = 'none';
        rail.classList.add('uiMoved033','dragging033');
        pending.moved = true;
        suppressClick = true;
      }

      const p = clampXY(rail,e.clientX-pending.dx,e.clientY-pending.dy);
      rail.style.left = p.x + 'px';
      rail.style.top = p.y + 'px';
      e.preventDefault();
      e.stopPropagation();
    }, true);

    const finishRailDrag = e => {
      if (!pending || (e.pointerId !== undefined && pending.id !== e.pointerId)) return;
      const moved = pending.moved;
      try { rail.releasePointerCapture(pending.id); } catch (_) {}
      pending = null;
      rail.classList.remove('dragging033');

      if (moved){
        savePosition(rail,K_RAIL);
        e.preventDefault?.();
        e.stopPropagation?.();
        setTimeout(() => { suppressClick = false; }, 0);
      }
    };
    rail.addEventListener('pointerup',finishRailDrag,true);
    rail.addEventListener('pointercancel',finishRailDrag,true);

    rail.addEventListener('click', e => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      suppressClick = false;
    }, true);
  }

  if (zoomCtl && zoomHandle){
    zoomHandle.title = 'Arrastra para mover el control de zoom';
    applyPosition(zoomCtl, readJSON(K_ZOOM_POS));
    makeDraggable(zoomCtl, zoomHandle, K_ZOOM_POS);
  }

  function mountSystemZoomOption(){
    const tabs = document.querySelector('.sysTabs3213');
    const active = tabs?.querySelector('button.active');
    if (!active || active.dataset.tab !== 'settings') return;

    const host = document.getElementById('sysContent3213');
    if (!host || host.querySelector('#settingsZoomCtl033')) return;

    const row = document.createElement('label');
    row.className = 'uiSettingRow033';
    row.innerHTML = '<input id="settingsZoomCtl033" type="checkbox"> Mostrar control de zoom';
    host.appendChild(row);

    const cb = row.querySelector('input');
    cb.checked = visiblePreference();
    cb.addEventListener('change', () => setZoomVisible(cb.checked, cb));
  }

  document.querySelector('.sysTabs3213')?.addEventListener('click', () => {
    setTimeout(mountSystemZoomOption,0);
    setTimeout(mountSystemZoomOption,80);
  });

  const sysContent = document.getElementById('sysContent3213');
  if (sysContent){
    new MutationObserver(mountSystemZoomOption).observe(sysContent,{childList:true,subtree:false});
  }

  addEventListener('resize', () => {
    if (rail?.classList.contains('uiMoved033')) applyPosition(rail, readJSON(K_RAIL));
    if (zoomCtl?.classList.contains('uiMoved033')) applyPosition(zoomCtl, readJSON(K_ZOOM_POS));
  }, {passive:true});
})();
