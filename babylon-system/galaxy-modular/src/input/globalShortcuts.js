import { APP_CONFIG } from '../config/appConfig.js';

function isEditableTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || '').toLowerCase();
  return !!(
    target.isContentEditable ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select'
  );
}

function matchesShortcut(e, shortcut) {
  if (!shortcut) return false;
  const wanted = String(shortcut).toLowerCase();
  return (
    String(e.code || '').toLowerCase() === wanted ||
    String(e.key || '').toLowerCase() === wanted
  );
}

export function registerGlobalShortcuts({
  onSave,
  onClearSave,
  onLoadSave,
  introModal,
}) {
  const { flags, shortcuts } = APP_CONFIG.input;

  if (!window[flags.saveKeysBound]) {
    window[flags.saveKeysBound] = true;
    window.addEventListener('keydown', (e) => {
      if (isEditableTarget(e.target)) return;

      if (matchesShortcut(e, shortcuts.save)) {
        e.preventDefault?.();
        onSave?.();
      } else if (matchesShortcut(e, shortcuts.clearSave)) {
        e.preventDefault?.();
        onClearSave?.();
      } else if (matchesShortcut(e, shortcuts.load)) {
        e.preventDefault?.();
        onLoadSave?.();
      }
    });
  }

  if (!window[flags.introKeysBound]) {
    window[flags.introKeysBound] = true;
    window.addEventListener('keydown', (e) => {
      if (isEditableTarget(e.target)) return;

      if (matchesShortcut(e, shortcuts.openIntro)) {
        e.preventDefault?.();
        introModal?.open?.(true);
      } else if (matchesShortcut(e, shortcuts.closeModal)) {
        introModal?.close?.();
      }
    });
  }
}

export function scheduleIntroOpen({ introModal, hasSavedState, delayMs }) {
  try {
    if (hasSavedState) return;
    window.setTimeout(() => {
      introModal?.open?.(false);
    }, delayMs);
  } catch (_) {}
}