const { NODE_ALIAS } = require('@anansi/webpack-config/lib/base/node-polyfill');

module.exports = function (context, options) {
  return {
    name: 'node-support-plugin',
    // to support running babel transformer we need to polyfill node api 'fs'
    configureWebpack(config, isServer, utils) {
      if (isServer) return {};
      return {
        node: { __dirname: true, __filename: true, global: true },
        resolve: {
          alias: NODE_ALIAS,
          fallback: {
            fs: false,
          },
        },
        module: {
          rules: [
            // transpile rest hooks to not use classes so it works with buble
            /*{
              test: /\.m?js$/,
              include: [
                /node_modules[\\/]rest-hooks/,
                /node_modules[\\/]@rest-hooks/,
              ],
              exclude: [
                // \\ for Windows, / for Mac OS and Linux
                /node_modules[\\/](core-js)/,
                /node_modules[\\/](@docusaurus)/,
                /node_modules[\\/]webpack[\\/]buildin/,
                /@babel(?:\/|\\{1,2})runtime/,
              ],
              use: {
                loader: require.resolve('babel-loader'),
                options: {
                  babelrc: false,
                  configFile: false,
                  compact: false,
                  cacheDirectory: true,
                  // See https://github.com/facebook/create-react-app/issues/6846 for context
                  cacheCompression: false,
                  // Babel assumes ES Modules, which isn't safe until CommonJS
                  // dies. This changes the behavior to assume CommonJS unless
                  // an `import` or `export` is present in the file.
                  // https://github.com/webpack/webpack/issues/4039#issuecomment-419284940
                  sourceType: 'unambiguous',
                  presets: [
                    [
                      '@babel/preset-env',
                      {
                        bugfixes: true,
                        useBuiltIns: 'entry',
                        loose: true,
                        corejs: 3,
                        exclude: [
                          'transform-typeof-symbol',
                          'transform-async-to-generator',
                        ],
                        targets: 'since 2017, safari>=10.1',
                      },
                    ],
                  ],
                  plugins: [
                    ['@babel/plugin-transform-classes', { loose: true }],
                    [
                      '@babel/plugin-transform-runtime',
                      {
                        corejs: 3,
                        helpers: true,
                        regenerator: true,
                        useESModules: true,
                        version: require('@babel/runtime/package.json').version,
                      },
                    ],
                  ],
                },
              },
            },*/
          ],
        },
      };
    },
  };
};
