const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (context, options) {
  return {
    name: 'profiling-plugin',
    // to support running babel transformer we need to polyfill node api 'fs'
    configureWebpack(config, isServer, utils) {
      if (isServer) return {};
      // React's profiling build calls <Profiler onRender> in production, which
      // the Playground `renderCount` badge relies on. Its timers only run
      // inside a <Profiler> subtree (profiling-loader stops React DevTools from
      // profiling the whole tree).
      // A replacement rather than an alias: Docusaurus' `react-dom` alias
      // would match `react-dom/client` first.
      const reactDomProfiling =
        new utils.currentBundler.instance.NormalModuleReplacementPlugin(
          /^react-dom\/client$/,
          'react-dom/profiling',
        );
      const patchDevToolsCheck = {
        rules: [
          {
            test: /react-dom[\\/]cjs[\\/]react-dom-profiling\.profiling\.js$/,
            loader: require.resolve('./profiling-loader'),
          },
        ],
      };
      if (process.env.PROFILE === 'true') {
        return {
          plugins: [reactDomProfiling],
          module: patchDevToolsCheck,
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
        };
      }
      return { plugins: [reactDomProfiling], module: patchDevToolsCheck };
    },
  };
};
