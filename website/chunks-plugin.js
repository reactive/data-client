/* global module */
/** Docusaurus disables webpack's default cache groups and only shares modules
 * used by half of all pages ('common'). The Playground is embedded in far
 * fewer, so without this every page chunk would carry its own copy. */
module.exports = function (context, options) {
  return {
    name: 'chunks-plugin',
    configureWebpack(config, isServer) {
      if (isServer) return {};
      return {
        optimization: {
          splitChunks: {
            cacheGroups: {
              playground: {
                test: /[\\/]src[\\/]components[\\/](?:HooksPlayground|Playground[\\/])/,
                name: 'playground',
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
