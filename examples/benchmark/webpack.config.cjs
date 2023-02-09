const { makeConfig } = require('@anansi/webpack-config');

const generateConfig = makeConfig({
  basePath: 'src',
  serverDir: 'dist',
  babelLoader: {
    rootMode: 'upward',
  },
});

module.exports = (env, argv) => {
  const config = generateConfig(env, argv);
  if (!config.experiments) config.experiments = {};
  config.experiments.backCompat = false;
  config.experiments.outputModule = true;
  config.output.chunkFormat = 'module';
  // we want to inline the local packages, so no externals for us
  config.externals = [];

  config.entry = {
    index: {
      import: './src/index.ts',
      library: {
        type: 'module',
      },
    },
  };
  return config;
};
