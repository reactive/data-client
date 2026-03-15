const { makeConfig } = require('@anansi/webpack-config');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const LIBRARIES = ['data-client', 'tanstack-query', 'swr', 'baseline'];

const entries = {};
for (const lib of LIBRARIES) {
  entries[lib] = `./src/${lib}/index.tsx`;
}

const options = {
  rootPath: __dirname,
  basePath: 'src',
  buildDir: 'dist/',
  globalStyleDir: 'style',
  sassOptions: false,
  nohash: true,
};

const generateConfig = makeConfig(options);

module.exports = (env, argv) => {
  const config = generateConfig(env, argv);
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    '@shared': path.resolve(__dirname, 'src/shared'),
    swr: require.resolve('swr'),
  };

  config.entry = entries;
  config.output.filename = '[name].js';
  config.output.chunkFilename = '[name].chunk.js';

  config.plugins = config.plugins.filter(
    p => p.constructor.name !== 'HtmlWebpackPlugin',
  );
  for (const lib of LIBRARIES) {
    config.plugins.push(
      new HtmlWebpackPlugin({
        title: `Benchmark: ${lib}`,
        filename: path.join(lib, 'index.html'),
        chunks: [lib],
        scriptLoading: 'defer',
      }),
    );
  }

  return config;
};

module.exports.options = options;
