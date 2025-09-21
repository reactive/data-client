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

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['@babel/runtime'].includes(dep));
const peers = Object.keys(pkg.peerDependencies);

const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node', '.jsx'];
process.env.NODE_ENV = 'production';

function isExternal(id) {
  return (
    // when we import contexts in our other entry points
    id === '../../index.js' ||
    id === '../index.js' ||
    dependencies.some(dep => dep === id || id.startsWith(dep))
  );
}

const configs = [];
if (process.env.BROWSERSLIST_ENV !== 'node12') {
  // browser-friendly UMD build
  configs.push({
    input: 'src/index.ts',
    external: id => peers.some(dep => dep === id || id.startsWith(dep)),
    output: [
      {
        file: pkg.unpkg,
        format: 'umd',
        name: 'VDC',
        inlineDynamicImports: true,
        globals: {
          vue: 'Vue',
        },
      },
    ],
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
    output: [{ file: pkg.main, format: 'cjs', inlineDynamicImports: true }],
    onwarn,
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
        extensions,
        rootMode: 'upward',
        babelHelpers: 'runtime',
      }),
      replace({ 'process.env.CJS': 'true', preventAssignment: true }),
      resolve({ extensions }),
      commonjs({ extensions }),
    ],
  });
}
export default configs;
