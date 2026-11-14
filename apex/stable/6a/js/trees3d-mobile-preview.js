/* APEX Formula 26 · Mobile 3D tree opt-in, perf6a-preview only.
 * The production tree renderer is intentionally untouched.
 */
(function () {
  'use strict';
  const KEY = 'apex26.preview.mobileTrees3d.v1';
  const SELECT_ID = 'apexProtoTrees3dMobile';
  const HELP_ID = 'apexProtoTrees3dMobileHint';
  let enabled = false;
  try { enabled = localStorage.getItem(KEY) === '1'; } catch (_) {}
  const stats = { drawn: 0, fallback: 0, distanceLimitM: 0 };

  function isMobile(c) {
    if (c && c.mobile) return true;
    if (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')) return true;
    return !!(document.body && document.body.classList.contains('mobile-performance'));
  }
  function renderPressure() {
    try {
      if (typeof mobileRenderPressure === 'function') {
        const pressure = Number(mobileRenderPressure());
        if (Number.isFinite(pressure)) return Math.max(0.12, Math.min(1, pressure));
      }
    } catch (_) {}
    return 1;
  }
  function effectiveDistance() {
    // On low-FPS devices keep the nearby trees three-dimensional and let the
    // existing light 2D tree renderer handle the rest of the scene.
    return Math.round(170 + 280 * renderPressure());
  }
  function info() {
    return {
      enabled, mobile: isMobile(), installed: !!(window.apexTrees3dRender && window.apexTrees3dRender._mobilePreviewV1),
      webglRequired: true, mobile3dDrawsSinceLoad: stats.drawn,
      classicFallbacksSinceLoad: stats.fallback, mobileDistanceLimitM: stats.distanceLimitM,
      persistence: KEY
    };
  }
  window.apexTrees3dMobilePreviewInfo = info;

  function installRenderer() {
    const original = window.apexTrees3dRender;
    if (typeof original !== 'function') return false;
    if (original._mobilePreviewV1) return true;

    function renderWithMobileOption(context) {
      if (!isMobile(context)) return original(context);
      if (!enabled) { stats.fallback++; return false; }
      if (!context || !Number.isFinite(context.depth)) { stats.fallback++; return false; }

      const distanceLimitM = effectiveDistance();
      stats.distanceLimitM = distanceLimitM;
      // LOD 2 and distant objects use the original low-cost silhouette.
      if (context.lod > 1 || context.depth > distanceLimitM) {
        stats.fallback++;
        return false;
      }
      const drawn = original(Object.assign({}, context, { mobile: false }));
      if (drawn) stats.drawn++;
      return drawn;
    }
    renderWithMobileOption._mobilePreviewV1 = true;
    window.apexTrees3dRender = renderWithMobileOption;

    const oldInfo = window.apexTrees3dTrialInfo;
    if (typeof oldInfo === 'function' && !oldInfo._mobilePreviewV1) {
      function extendedInfo() {
        return Object.assign({}, oldInfo(), { mobilePreview: info() });
      }
      extendedInfo._mobilePreviewV1 = true;
      window.apexTrees3dTrialInfo = extendedInfo;
    }
    return true;
  }

  function updateHint() {
    const hint = document.getElementById(HELP_ID);
    const select = document.getElementById(SELECT_ID);
    if (select) select.value = enabled ? '1' : '0';
    if (!hint) return;
    if (new URLSearchParams(location.search).get('trees3d') === '0') {
      hint.textContent = 'El parámetro trees3d=0 desactiva el renderizador 3D global. Quítalo de la URL.';
      if (select) select.disabled = true;
      return;
    }
    hint.textContent = enabled
      ? '3D adaptativo en móvil con WebGL2: árboles cercanos en 3D, lejanos en modo ligero. Puede reducir los FPS.'
      : 'Árboles clásicos en móvil (menor consumo). En PC se conserva el renderizador 3D habitual.';
  }

  function addOptionsControl() {
    const parent = document.querySelector('#apex9aOptionsScreen .apexProtoOptionsGrid > section');
    if (!parent) return false;
    if (document.getElementById(SELECT_ID)) { updateHint(); return true; }

    const label = document.createElement('label');
    label.setAttribute('for', SELECT_ID);
    label.textContent = 'ÁRBOLES 3D EN MÓVIL (PRUEBA)';

    const select = document.createElement('select');
    select.id = SELECT_ID;
    select.setAttribute('aria-describedby', HELP_ID);
    for (const [value, title] of [['0', 'Desactivados · mayor rendimiento'], ['1', 'Activados · 3D adaptativo']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = title;
      select.appendChild(option);
    }

    const hint = document.createElement('p');
    hint.id = HELP_ID;
    hint.setAttribute('role', 'status');
    hint.style.fontSize = '10px';
    hint.style.lineHeight = '1.4';

    const anchor = document.getElementById('apexProtoQualityText');
    if (anchor && anchor.parentElement === parent) anchor.after(label, select, hint);
    else parent.append(label, select, hint);

    select.addEventListener('change', function () {
      enabled = select.value === '1';
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (_) {}
      installRenderer();
      updateHint();
    });
    updateHint();
    return true;
  }

  installRenderer();
  if (!addOptionsControl()) {
    const observer = new MutationObserver(function () {
      if (addOptionsControl()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  document.addEventListener('DOMContentLoaded', function () {
    installRenderer();
    addOptionsControl();
  }, { once: true });
  window.addEventListener('load', installRenderer, { once: true });
})();