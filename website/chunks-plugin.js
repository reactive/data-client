/* global module */
/** Docusaurus disables webpack's default cache groups and only shares modules
 * used by half of all pages ('common'). Site components used by fewer pages
 * (Playground, PkgTabs, StackBlitz...) would otherwise be copied into every
 * page chunk that uses them; this splits them into chunks shared per module set. */
module.exports = function (context, options) {
  return {
    name: 'chunks-plugin',
    configureWebpack(config, isServer) {
      if (isServer) return {};
      return {
        optimization: {
          splitChunks: {
            cacheGroups: {
              site: {
                test: /[\\/]website[\\/](?:src|framework-docs)[\\/]/,
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
