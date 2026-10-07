/* global module */
const MONACO = /[\\/]node_modules[\\/]monaco-editor[\\/]/;

/**
 * Keeps Monaco's CSS inside its lazy chunk. Docusaurus extracts every CSS
 * import into the one site-wide stylesheet, which would make every visitor
 * (mobile and bots included) download the editor's styles. style-loader
 * instead injects them when the Monaco chunk evaluates.
 */
module.exports = function () {
  return {
    name: 'monaco-plugin',
    configureWebpack(config, isServer, utils) {
      // The server bundle never evaluates Monaco; Docusaurus' rule is fine there
      if (isServer) return {};
      const cssRule = config.module.rules.find(
        rule => String(rule.test) === String(/\.css$/i) && rule.exclude,
      );
      if (!cssRule) throw new Error('monaco-plugin: Docusaurus CSS rule moved');
      cssRule.exclude = [cssRule.exclude, MONACO];
      return {
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
