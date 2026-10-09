/* global module */
/**
 * Locales the docs are translated into, read by docusaurus.config.ts (i18n;
 * Docusaurus names each in the language menu) and translate.mjs.
 *
 * - language: the target language, as translators are told it
 * - pages: source paths (or folder prefixes) to translate; all docs if unset
 */
const LOCALES = {
  es: {
    language:
      'Spanish (neutral international Spanish, as used in Latin America)',
    pages: ['docs/core/README.md', 'docs/core/getting-started/'],
  },
};

module.exports = { DEFAULT_LOCALE: 'en', LOCALES };
