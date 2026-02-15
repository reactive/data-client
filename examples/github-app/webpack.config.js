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
  if (config.devServer) {
    // Avoid network interface enumeration that crashes in StackBlitz WebContainers
    config.devServer.host = '127.0.0.1';
    config.devServer.allowedHosts = [
      '.stackblitz.io',
      'localhost',
      '127.0.0.1',
    ];
  }
  return config;
};

module.exports.options = options;
