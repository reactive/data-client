import {
  babel,
  commonjs,
  filesize,
  json,
  resolve,
  replace,
  terser,
  typeConfig,
  onwarn,
} from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies).filter(
  dep => !['@babel/runtime'].includes(dep),
);

const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node'];
const nativeExtensions = ['.native.ts', ...extensions];
process.env.NODE_ENV = 'production';

function isExternal(id) {
  return dependencies.some(dep => dep === id || id.startsWith(dep));
}
const configs = [];
if (process.env.BROWSERSLIST_ENV !== 'node12') {
  // browser-friendly UMD build
  configs.push({
    input: 'src/index.ts',
    output: [{ file: pkg.unpkg, format: 'umd', name: 'GraphQL' }],
    onwarn,
    plugins: [
      babel({
        exclude: ['node_modules/**', '/**__tests__/**'],
        extensions,
        rootMode: 'upward',
        babelHelpers: 'runtime',
        caller: { polyfillMethod: false },
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true,
      }),
      resolve({ extensions }),
      commonjs({ extensions }),
      json(),
      terser({}),
      filesize({ showBrotliSize: true }),
    ],
  });
  configs.push(typeConfig);
} else {
  // node-friendly commonjs build
  configs.push({
    input: 'src/index.ts',
    external: isExternal,
    output: [{ file: pkg.main, format: 'cjs' }],
    onwarn,
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
        extensions: nativeExtensions,
        rootMode: 'upward',
        babelHelpers: 'runtime',
      }),
      replace({ 'process.env.CJS': 'true', preventAssignment: true }),
      resolve({ extensions: nativeExtensions }),
      commonjs({ extensions: nativeExtensions }),
    ],
  });
}
export default configs;
