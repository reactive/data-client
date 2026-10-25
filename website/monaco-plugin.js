/* global module */
const MONACO = /[\\/]node_modules[\\/]monaco-editor[\\/]/;

/**
 * Keeps Monaco out of what every visitor downloads (mobile and bots never load
 * the editor):
 * - its CSS stays inside its lazy chunks. Docusaurus extracts every CSS import
 *   into the one site-wide stylesheet; style-loader instead injects them when
 *   the Monaco chunk evaluates.
 * - its chunks are named monaco-*, so the offline cache leaves them out
 *   (docusaurus.config.ts).
 */
module.exports = function () {
  return {
    name: 'monaco-plugin',
    configureWebpack(config, isServer, utils) {
      // The server bundle never evaluates Monaco, and the package's `require`
      // export is its AMD build, which webpack can't bundle
      if (isServer) return { resolve: { alias: { 'monaco-editor': false } } };
      const cssRule = config.module.rules.find(
        rule => String(rule.test) === String(/\.css$/i) && rule.exclude,
      );
      if (!cssRule) throw new Error('monaco-plugin: Docusaurus CSS rule moved');
      cssRule.exclude = [cssRule.exclude, MONACO];
      return {
        optimization: {
          splitChunks: {
            cacheGroups: {
              monaco: {
                test: MONACO,
                chunks: 'all',
                name: false,
                filename: 'assets/js/monaco-[id].[contenthash:8].js',
                enforce: true,
                priority: 40,
              },
            },
          },
        },
        module: {
          rules: [
            {
              test: /\.css$/i,
              include: MONACO,
              // Docusaurus' css/postcss loaders (minus extraction), so url()
              // fonts resolve the same way as in the site's own CSS
              use: [
                'style-loader',
                ...utils
                  .getStyleLoaders(isServer, { importLoaders: 1 })
                  .slice(1),
              ],
            },
          ],
        },
      };
    },
  };
};
