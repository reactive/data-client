const { makeConfig } = require('@anansi/webpack-config');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const options = {
  basePath: 'src',
  buildDir: 'dist/',
  htmlOptions: {
    title: 'todo-app',
    scriptLoading: 'defer',
    template: 'index.ejs',
  },
  globalStyleDir: 'style',
  libraryInclude: /node_modules\/(@rest-hooks\/)/,
  libraryExclude: /node_modules(?!\/(@rest-hooks\/))/,
};

const generateConfig = makeConfig(options);

module.exports = (env, argv) => {
  const config = generateConfig(env, argv);
  config.resolve.plugins.push(new TsconfigPathsPlugin());
  return config;
};

module.exports.options = options;
