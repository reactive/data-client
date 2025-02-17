const { resolvePath } = require('babel-plugin-module-resolver');
const fs = require('fs');
const path = require('path');

module.exports = function (api) {
  api.cache.using(
    () => process.env.NODE_ENV + process.env.BROWSERSLIST_ENV + '0',
  );
  return {
    presets: [
      [
        '@anansi',
        {
          hasJsxRuntime: true,
          loose: true,
          resolver: {
            resolvePath(sourcePath, currentFile, opts) {
              // babel needs to handle .js imports that refer to .ts files
              if (
                process.env.NODE_ENV === 'test' &&
                sourcePath.startsWith('.') &&
                (sourcePath.endsWith('.js') || sourcePath.endsWith('.cjs'))
              ) {
                const removedExt = sourcePath.substring(
                  0,
                  sourcePath.lastIndexOf('.'),
                );
                return resolvePath(removedExt, currentFile, opts);
              }
              // for compiling CJS .native only outputs
              if (
                process.env.COMPILE_TARGET === 'native' &&
                sourcePath.startsWith('.') &&
                (sourcePath.endsWith('.js') || sourcePath.endsWith('.cjs')) &&
                !sourcePath.includes('.native')
              ) {
                const final =
                  sourcePath.substring(0, sourcePath.lastIndexOf('.')) +
                  '.native';

                const resolved = resolvePath(final, currentFile, opts);
                for (const ext of opts.extensions) {
                  const absolutePath = path.join(
                    path.dirname(currentFile),
                    resolved + ext,
                  );
                  if (fs.existsSync(absolutePath)) {
                    return resolved + path.extname(sourcePath);
                  }
                }
              }
            },
            root: [],
          },
        },
      ],
    ],
    assumptions: {
      noDocumentAll: true,
      noClassCalls: true,
      constantReexports: true,
      objectRestNoSymbols: true,
      pureGetters: true,
    },
    sourceMaps: 'inline',
    // allows us to load .babelrc in addition to this
    babelrcRoots: ['packages/*', '__tests__'],
    // this is just for testing react native...they ship packages with flowtype in them
    overrides: [
      {
        test: /node_modules\/.+\.(m|c)?js$/,
        presets: ['@babel/preset-flow'],
        plugins: ['babel-plugin-syntax-hermes-parser'],
      },
    ],
  };
};
