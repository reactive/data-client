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

class CopyRdcIntoDistPlugin {
  constructor(filename) {
    this.filename = filename;
  }
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyRdcIntoDistPlugin', () => {
      const src = path.join(compiler.options.output.path, this.filename);
      const destDir = path.join(__dirname, 'dist');
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, this.filename));
    });
  }
}

// Three production compilations, same minify/split as SPA:
//   rdcClient.js          SPA (@data-client/react)
//   rdcNextjs.js          Next.js/RSC (@data-client/react/nextjs)
//   rdcPipeableStream.js  renderToPipeableStream (@data-client/react/ssr)
module.exports = (env = {}, argv) => {
  const spa = withRdcChunks(makeConfig(options)(env, argv), 'rdcClient');
  spa.name = 'spa';

  const nextjs = withRdcChunks(
    makeConfig({
      ...options,
      buildDir: '.sizecompare/nextjs/',
      htmlOptions: false,
    })({ ...env, name: 'nextjs', entrypath: './src/nextjs.tsx' }, argv),
    'rdcNextjs',
  );
  nextjs.name = 'nextjs';
  nextjs.dependencies = ['spa'];
  nextjs.plugins.push(new CopyRdcIntoDistPlugin('rdcNextjs.js'));

  const pipeableStream = withRdcChunks(
    makeConfig({
      ...options,
      buildDir: '.sizecompare/pipeable-stream/',
      htmlOptions: false,
    })(
      {
        ...env,
        name: 'renderToPipeableStream',
        entrypath: './src/renderToPipeableStream.tsx',
      },
      argv,
    ),
    'rdcPipeableStream',
  );
  pipeableStream.name = 'renderToPipeableStream';
  pipeableStream.dependencies = ['spa'];
  pipeableStream.plugins.push(new CopyRdcIntoDistPlugin('rdcPipeableStream.js'));

  return [spa, nextjs, pipeableStream];
};

module.exports.options = options;
