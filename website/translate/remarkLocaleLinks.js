/* global require, module, process */
/**
 * Relative `.md` links of a locale's pages, for a docs instance.
 *
 * A locale renders each page from its translation when there is one, else
 * from the English source, so a link between the two crosses folders, and
 * Docusaurus resolves `./` and `../` links only within the linking file's own.
 * This points each such link at the file the locale renders.
 *
 * Options: `id` (docs instance), `contentPath` (its English folder, absolute)
 */
const fs = require('fs');
const path = require('path');

const { DEFAULT_LOCALE } = require('./locales.js');
const { localizedPath } = require('../framework-docs/docsInstances.js');

const ROOT = path.resolve(__dirname, '../..');
const MD_LINK = /^(\.{0,2}\/?[^:?#]*\.mdx?)([?#].*)?$/;

const inside = (dir, file) => !path.relative(dir, file).startsWith('..');

module.exports = function remarkLocaleLinks({ id, contentPath }) {
  return async (tree, file) => {
    // set by Docusaurus for each locale it builds
    const locale = process.env.DOCUSAURUS_CURRENT_LOCALE;
    if (!locale || locale === DEFAULT_LOCALE) return;
    const localized = path.join(ROOT, localizedPath(id, locale));
    /** The file this locale renders for a page in either folder */
    const rendered = target => {
      const base = inside(localized, target) ? localized : contentPath;
      if (!inside(base, target)) return target;
      const translation = path.join(localized, path.relative(base, target));
      return fs.existsSync(translation) ? translation : (
          path.join(contentPath, path.relative(base, target))
        );
    };
    const { visit } = await import('unist-util-visit');
    visit(tree, ['link', 'definition'], node => {
      const match = MD_LINK.exec(node.url);
      if (!match || match[1].startsWith('/')) return;
      const dir = path.dirname(file.path);
      const target = path.resolve(dir, decodeURIComponent(match[1]));
      const to = rendered(target);
      if (to === target) return;
      const relative = path.relative(dir, to).split(path.sep).join('/');
      node.url = `${relative.startsWith('.') ? '' : './'}${relative}${match[2] ?? ''}`;
    });
  };
};
