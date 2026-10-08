/* global module, require */
const path = require('path');

/** Docusaurus disables webpack's default cache groups and only shares modules
 * used by half of all pages ('common'). Site components used by fewer pages
 * (Playground, PkgTabs, StackBlitz...) would otherwise be copied into every
 * page chunk that uses them; this splits them into chunks shared per module
 * set (sets under webpack's minSize stay inlined). */
module.exports = function (context, options) {
  const siteSource = ['src', 'framework-docs'].map(
    dir => path.join(context.siteDir, dir) + path.sep,
  );
  return {
    name: 'chunks-plugin',
    configureWebpack(config, isServer) {
      if (isServer) return {};
      return {
        optimization: {
          splitChunks: {
            cacheGroups: {
              site: {
                test: mod =>
                  siteSource.some(dir => mod.resource?.startsWith(dir)),
                name: false,
                chunks: 'async',
                minChunks: 2,
                priority: 30,
              },
            },
          },
        },
      };
    },
  };
};
