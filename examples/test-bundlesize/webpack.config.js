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
  config.optimization.splitChunks = {
    chunks: 'async',
    maxInitialRequests: 3000,
    maxAsyncRequests: 3000,
    minSize: 1,
    cacheGroups: {
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|scheduler|object-assign|loose-envify)[\\/]/,
        name: 'react',
        chunks: 'all',
      },
      polyfill: {
        test: /[\\/]node_modules[\\/](core-js|core-js-pure|@babel\/runtime|@babel\/runtime-corejs3|regenerator-runtime|ric-shim|babel-runtime)[\\/].*/,
        name: 'polyfill',
        chunks: 'all',
      },
      rdcEndpoint: {
        test: /packages[\\/](endpoint|rest|graphql)/,
        name: 'rdcEndpoint',
        chunks: 'all',
        priority: 10000,
      },
      rdcClient: {
        test: /packages/,
        name: 'rdcClient',
        chunks: 'all',
        priority: 1000,
      },
    },
  };
  return config;
};

module.exports.options = options;
