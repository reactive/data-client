/* global module */
/**
 * Locales the docs are translated into, read by docusaurus.config.ts (i18n;
 * Docusaurus names each in the language menu) and translate.mjs.
 *
 * - language: the target language, as translators are told it
 * - pages: source paths (or folder prefixes) to translate; all docs if unset
 * - outdated: notice on a translated page whose English changed since
 * - announcement: the announcement bar (HTML; Docusaurus doesn't translate it)
 */
const LOCALES = {
  es: {
    language:
      'Spanish (neutral international Spanish, as used in Latin America)',
    outdated:
      'El original en inglés cambió después de esta traducción, así que puede estar desactualizada.',
    announcement:
      'Si te gusta Reactive Data Client, dale una ⭐️ en <a target="_blank" rel="noopener noreferrer" href="https://github.com/reactive/data-client">GitHub</a>',
  },
  'pt-BR': {
    language: 'Brazilian Portuguese',
    outdated:
      'O original em inglês mudou depois desta tradução, então ela pode estar desatualizada.',
    announcement:
      'Se você gosta do Reactive Data Client, dê uma ⭐️ no <a target="_blank" rel="noopener noreferrer" href="https://github.com/reactive/data-client">GitHub</a>',
  },
  'zh-Hans': {
    language: 'Simplified Chinese',
    outdated: '这篇翻译之后英文原文有更新，内容可能已过时。',
    announcement:
      '如果你喜欢 Reactive Data Client，请在 <a target="_blank" rel="noopener noreferrer" href="https://github.com/reactive/data-client">GitHub</a> 上给它一颗 ⭐️',
  },
};

module.exports = { DEFAULT_LOCALE: 'en', LOCALES };
