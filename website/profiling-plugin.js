const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (context, options) {
  return {
    name: 'profiling-plugin',
    // to support running babel transformer we need to polyfill node api 'fs'
    configureWebpack(config, isServer, utils) {
      if (isServer) return {};
      if (process.env.PROFILE === 'true') {
        return {
          optimization: {
            ...config.optimization,
            minimizer: [
              /* TODO: make this actually work */
              new TerserPlugin({
                terserOptions: {
                  parse: {
                    ecma: 9,
                  },
                  compress: {
                    ecma: 6,
                    warnings: false,
                    // Pending further investigation:
                    // https://github.com/mishoo/UglifyJS2/issues/2011
                    comparisons: false,
                    // Pending futher investigation:
                    // https://github.com/terser-js/terser/issues/120
                    inline: 2,
                  },
                  mangle: {
                    safari10: true,
                  },
                  output: {
                    ecma: 6,
                    comments: false,
                    ascii_only: true,
                  },
                  keep_classnames: true,
                  keep_fnames: true,
                },
                extractComments: true,
              }),
            ],
          },
          resolve: {
            ...config.resolve,
            alias: {
              ...config?.resolve?.alias,
              'react-dom$': 'react-dom/profiling',
              'scheduler/tracing': 'scheduler/tracing-profiling',
            },
          },
        };
      }
      return {};
    },
  };
};
