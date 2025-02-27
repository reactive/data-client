import {
  babel,
  commonjs,
  banner,
  filesize,
  json,
  resolve,
  replace,
  terser,
  onwarn,
} from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['@babel/runtime'].includes(dep));
const peers = Object.keys(pkg.peerDependencies);

const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node'];
const nativeExtensions = ['.native.ts', ...extensions];
process.env.NODE_ENV = 'production';

function isExternal(id) {
  return dependencies.some(dep => dep === id || id.startsWith(dep));
}
const configs = [];
if (process.env.BROWSERSLIST_ENV !== 'node16') {
  // browser-friendly UMD build
  configs.push({
    input: 'src/index.ts',
    external: id => peers.some(dep => dep === id || id.startsWith(dep)),
    output: [
      {
        file: pkg.unpkg,
        format: 'umd',
        name: 'Img',
        globals: {
          '@data-client/react': 'RDC',
          react: 'React',
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
        extensions: nativeExtensions,
        rootMode: 'upward',
        babelHelpers: 'runtime',
      }),
      replace({ 'process.env.CJS': 'true', preventAssignment: true }),
      resolve({ extensions: nativeExtensions }),
      commonjs({ extensions: nativeExtensions }),
      // for nextjs 13 compatibility in node https://nextjs.org/docs/app/building-your-application/rendering
      banner(() => "'use client';\n"),
    ],
  });
}
export default configs;
