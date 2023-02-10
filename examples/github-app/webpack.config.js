const { makeConfig } = require('@anansi/webpack-config');

const options = {
  basePath: 'src',
  buildDir: 'dist/',
  htmlOptions: {
    title: 'todo-app',
    scriptLoading: 'defer',
    template: 'index.ejs',
  },
  globalStyleDir: 'style',
  terserOptions: { keep_classnames: true },
};

const generateConfig = makeConfig(options);

module.exports = (env, argv) => {
  const config = generateConfig(env, argv);
  return config;
};

module.exports.options = options;
