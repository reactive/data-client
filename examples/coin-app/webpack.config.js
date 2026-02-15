const { makeConfig } = require('@anansi/webpack-config');

const options = {
  basePath: 'src',
  buildDir: 'dist/',
  serverDir: 'dist-server/',
  globalStyleDir: 'style',
  sassOptions: false,
};

const generateConfig = makeConfig(options);

module.exports = (env, argv) => {
  const config = generateConfig(env, argv);
  if (!config.experiments) config.experiments = {};
  config.experiments.backCompat = false;
  if (config.devServer) {
    // Avoid network interface enumeration that crashes in StackBlitz WebContainers
    config.devServer.host = 'localhost';
    config.devServer.allowedHosts = [
      '.stackblitz.io',
      'localhost',
      '127.0.0.1',
    ];
  }

  return config;
};

module.exports.options = options;
