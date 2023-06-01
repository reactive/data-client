const { makeConfig } = require('@anansi/webpack-config');
const fs = require('fs');
const { isAbsolute } = require('path');

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
  config.output.devtoolModuleFilenameTemplate = context => {
    let path = context.absoluteResourcePath;
    context.resourcePath;

    // For regular files, this statement is true.
    if (isAbsolute(path)) {
      if (path.includes('/examples')) {
        if (fs.existsSync(path)) return path;
        for (const f of [
          path.replace('examples/src', 'packages/normalizr/src'),
          path.replace('examples/src', 'packages/endpoint/src'),
          path.replace('examples/src', 'packages/core/src'),
        ]) {
          if (fs.existsSync(f)) return f;
        }
        console.log('could not find file to map: ', path);
      }
      for (const f of [
        path.replace('rest-hooks/src', 'rest-hooks/packages/normalizr/src'),
        path.replace('rest-hooks/src', 'rest-hooks/packages/endpoint/src'),
        path.replace('rest-hooks/src', 'rest-hooks/packages/core/src'),
        path.replace('src/state', 'rest-hooks/packages/core/src/state'),
      ]) {
        if (fs.existsSync(f)) return f;
      }
      console.log('could not find file to map: ', path);

      return path;
    } else {
      // Mimic Webpack's default behavior:
      return `webpack://${context.namespace}/${context.resourcePath}`;
    }
  };

  return config;
};
