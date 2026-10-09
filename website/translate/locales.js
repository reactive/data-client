/* global module */
/**
 * Locales the docs are translated into, read by docusaurus.config.ts (i18n)
 * and translate.mjs (what to translate, and into which language).
 *
 * - label: name in the navbar's language dropdown
 * - htmlLang: <html lang>, hreflang
 * - language: target language, as the translation prompt names it
 * - pages: source paths (or folder prefixes) to translate; all docs if unset
 */
const LOCALES = {
  es: {
    label: 'Español',
    htmlLang: 'es',
    language:
      'Spanish (neutral international Spanish, as used in Latin America)',
    pages: ['docs/core/README.md', 'docs/core/getting-started/'],
  },
};

module.exports = { DEFAULT_LOCALE: 'en', LOCALES };
