import { babel, commonjs, filesize, json, resolve, replace, terser, typeConfig, typeConfigNext } from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };


const dependencies = Object.keys(pkg.dependencies)
  //.concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['@babel/runtime'].includes(dep));

const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node', '.jsx'];
const nativeExtensions = ['.native.ts', ...extensions];
process.env.NODE_ENV = 'production';

function isExternal(id) {
  return dependencies.some(dep => dep === id || id.startsWith(dep));
}

const configs = [];
if (process.env.BROWSERSLIST_ENV !== 'node12') {
  // browser-friendly UMD build
  configs.push({
    input: 'lib/index.js',
    external: isExternal,
    output: [{ file: pkg.unpkg, format: 'umd', name: 'RDC.Core' }],
    plugins: [
      babel({
        exclude: ['node_modules/**', '/**__tests__/**'],
        extensions,
        rootMode: 'upward',
        runtimeHelpers: true,
      }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      resolve({ extensions }),
      commonjs({ extensions }),
      json(),
      terser({}),
      filesize({ showBrotliSize: true }),
    ],
  });
  configs.push(typeConfig);
  configs.push(typeConfigNext);
} else {
  // node-friendly commonjs build
  [
    { input: 'lib/index.js', output: pkg.main },
    { input: 'lib/next/index.js', output: 'dist/next.js' },
  ].forEach(({ input, output }) => {
    configs.push({
      input,
      external: isExternal,
      output: [{ file: output, format: 'cjs' }],
      plugins: [
        babel({
          exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
          extensions: nativeExtensions,
          rootMode: 'upward',
          runtimeHelpers: true,
        }),
        replace({ 'process.env.CJS': 'true' }),
        resolve({ extensions: nativeExtensions }),
        commonjs({ extensions: nativeExtensions }),
      ],
    });
  });
}
export default configs;
