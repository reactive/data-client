import {
  babel,
  commonjs,
  filesize,
  json,
  resolve,
  replace,
  terser,
  typeConfig,
  typeConfigNext,
  onwarn,
  resolveTsAsJs,
} from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies).filter(
  dep => !['@babel/runtime'].includes(dep),
);

const extensions = ['.ts', '.tsx', '.js', '.mjs', '.json', '.node'];
const nativeExtensions = ['.native.ts', ...extensions];
process.env.NODE_ENV = 'production';

function isExternal(id) {
  return dependencies.some(dep => dep === id || id.startsWith(dep));
}

const configs = [];
if (process.env.BROWSERSLIST_ENV !== 'node12') {
  //TODO: this needs to use src/index.ts so it doesn't include the wrong polyfills
  // browser-friendly UMD build
  configs.push({
    input: 'src/index.ts',
    output: [{ file: pkg.unpkg, format: 'umd', name: 'Rest' }],
    onwarn,
    plugins: [
      babel({
        exclude: ['node_modules/**', '/**__tests__/**'],
        extensions,
        babelHelpers: 'runtime',
        rootMode: 'upward',
        caller: { polyfillMethod: false },
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true,
      }),
      resolve({ extensions }),
      resolveTsAsJs,
      commonjs({ extensions }),
      json(),
      terser(),
      filesize({ showBrotliSize: true }),
    ],
  });
  configs.push(typeConfig);
  configs.push(typeConfigNext);
} else {
  // node-friendly commonjs build
  [
    { input: 'src/index.ts', output: pkg.main },
    { input: 'src/next/index.ts', output: 'dist/next.js' },
  ].forEach(({ input, output }) => {
    configs.push({
      input,
      external: isExternal,
      output: [{ file: output, format: 'cjs' }],
      onwarn,
      plugins: [
        babel({
          exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
          extensions: nativeExtensions,
          babelHelpers: 'runtime',
          rootMode: 'upward',
        }),
        replace({
          'process.env.CJS': 'true',
          preventAssignment: true,
        }),
        resolve({ extensions: nativeExtensions }),
        resolveTsAsJs,
        commonjs({ extensions: nativeExtensions }),
      ],
    });
  });
}
export default configs;
