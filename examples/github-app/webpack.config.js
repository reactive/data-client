const { makeConfig } = require('@anansi/webpack-config');

const options = {
  basePath: 'src',
  buildDir: 'dist/',
  serverDir: 'dist-server/',
  htmlOptions: {
    title: 'Github App',
    scriptLoading: 'defer',
    template: 'index.ejs',
  },
  globalStyleDir: 'style',
  terserOptions: { keep_classnames: true },
  sassOptions: false,
};

const generateConfig = makeConfig(options);

module.exports = (env, argv) => {
  const config = generateConfig(env, argv);
  return config;
};

module.exports.options = options;
