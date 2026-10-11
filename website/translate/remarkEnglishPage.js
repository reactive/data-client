/* global module, require */
/**
 * Remark plugin that marks a page as English, for content a locale renders
 * untranslated (the blog): search engines index the English URL instead, and
 * screen readers read it as English. Same `<head>` as untranslated docs get
 * from localeDocs.js. It goes before any `<!-- truncate -->`, so blog list
 * pages, made of these excerpts, are marked too.
 */
const { DEFAULT_LOCALE } = require('./locales.js');

const element = (name, attributes, children = []) => ({
  type: 'mdxJsxFlowElement',
  name,
  attributes: Object.entries(attributes).map(([key, value]) => ({
    type: 'mdxJsxAttribute',
    name: key,
    value,
  })),
  children,
});

module.exports = function remarkEnglishPage() {
  return tree => {
    const start = tree.children[0]?.type === 'yaml' ? 1 : 0;
    tree.children.splice(
      start,
      0,
      element('head', {}, [
        element('html', { lang: DEFAULT_LOCALE }),
        element('meta', { name: 'robots', content: 'noindex' }),
      ]),
    );
  };
};
