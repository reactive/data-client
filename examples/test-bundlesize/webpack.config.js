const fs = require('fs');
const path = require('path');
const { makeConfig } = require('@anansi/webpack-config');

const options = {
  basePath: 'src',
  buildDir: 'dist/',
  serverDir: 'dist-server/',
  globalStyleDir: 'style',
  sassOptions: false,
};

function rdcSplitChunks(rdcName) {
  return {
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
      [rdcName]: {
        test: /packages/,
        name: rdcName,
        chunks: 'all',
        priority: 1000,
      },
    },
  };
}

function withRdcChunks(config, rdcName) {
  if (!config.experiments) config.experiments = {};
  config.experiments.backCompat = false;
  if (!config.optimization) config.optimization = {};
  config.optimization.splitChunks = rdcSplitChunks(rdcName);
  if (!config.plugins) config.plugins = [];
  return config;
}

function copyRdcToDist(filename) {
  return {
    apply(compiler) {
      compiler.hooks.afterEmit.tap('copyRdcToDist', () => {
        fs.copyFileSync(
          path.join(compiler.options.output.path, filename),
          path.join(__dirname, 'dist', filename),
        );
      });
    },
  };
}

const adapters = [
  {
    name: 'nextjs',
    entrypath: './src/nextjs.tsx',
    rdcName: 'rdcNextjs',
  },
  {
    name: 'renderToPipeableStream',
    entrypath: './src/renderToPipeableStream.tsx',
    rdcName: 'rdcPipeableStream',
  },
];

module.exports = (env = {}, argv) => {
  const spa = withRdcChunks(makeConfig(options)(env, argv), 'rdcClient');
  spa.name = 'spa';

  const extra = adapters.map(({ name, entrypath, rdcName }) => {
    const config = withRdcChunks(
      makeConfig({
        ...options,
        buildDir: `node_modules/.cache/test-bundlesize/${name}/`,
        htmlOptions: false,
      })({ ...env, name, entrypath }, argv),
      rdcName,
    );
    config.name = name;
    config.dependencies = ['spa'];
    config.plugins.push(copyRdcToDist(`${rdcName}.js`));
    return config;
  });

  return [spa, ...extra];
};

module.exports.options = options;
