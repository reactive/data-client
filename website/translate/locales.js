/* global module */
/**
 * Locales the docs are translated into, read by docusaurus.config.ts (i18n;
 * Docusaurus names each in the language menu) and translate.mjs.
 *
 * - language: the target language, as translators are told it
 * - pages: source paths (or folder prefixes) to translate; all docs if unset
 * - outdated: notice on a translated page whose English changed since
 */
const LOCALES = {
  es: {
    language:
      'Spanish (neutral international Spanish, as used in Latin America)',
    pages: ['docs/core/README.md', 'docs/core/getting-started/'],
    outdated:
      'La versión en inglés de esta página cambió después de traducirla, así que esta traducción puede estar desactualizada.',
  },
};

module.exports = { DEFAULT_LOCALE: 'en', LOCALES };
