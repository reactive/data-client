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
  sassOptions: false,
};

const generateConfig = makeConfig(options);

module.exports = (env, argv) => {
  const config = generateConfig(env, argv);
  config.entry = config.entry.App;
  if (config.devServer) {
    config.devServer.allowedHosts = ['.csb.app', 'localhost', '127.0.0.1'];
  }
  return config;
};

module.exports.options = options;
