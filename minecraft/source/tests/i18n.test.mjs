import test from 'node:test';
import assert from 'node:assert/strict';

const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value)
};
const translated = { dataset: { i18n: 'save' }, textContent: '' };
const titled = {
  dataset: { i18nTitle: 'block0' }, title: '',
  setAttribute(key, value) { this[key] = value; }
};
const aria = {
  dataset: { i18nAria: 'blockToolbar' },
  setAttribute(key, value) { this[key] = value; }
};
const selector = { value: '' };
globalThis.document = {
  documentElement: { lang: '' },
  title: '',
  querySelectorAll: (selector) => ({
    '[data-i18n]': [translated],
    '[data-i18n-title]': [titled],
    '[data-i18n-aria]': [aria]
  })[selector],
  getElementById: () => selector
};

const { t, setLanguage, getLanguage, onLanguageChange } = await import('../scripts/i18n.js');

test('all three languages update document, buttons, hints and browser preference', () => {
  let calls = 0;
  const unsubscribe = onLanguageChange(() => calls++);
  for (const language of ['es', 'en', 'fr']) {
    setLanguage(language);
    assert.equal(getLanguage(), language);
    assert.equal(stored.get('minecraftjs_language'), language);
    assert.equal(translated.textContent, t('save'));
    assert.equal(titled.title, t('block0'));
    assert.equal(aria['aria-label'], t('blockToolbar'));
    assert.equal(document.documentElement.lang, language);
    assert.equal(selector.value, language);
  }
  assert.equal(calls, 3);
  unsubscribe();
});

test('unsupported language does not alter the current preference', () => {
  setLanguage('unknown');
  assert.equal(getLanguage(), 'fr');
});
