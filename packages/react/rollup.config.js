import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';
import { typeConfig, typeConfigNext } from '../../config/rollup-utils';

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(
    dep =>
      !['@rest-hooks/use-enhanced-reducer', '@babel/runtime'].includes(dep),
  );

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
    output: [{ file: pkg.unpkg, format: 'umd', name: 'restHookCore' }],
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
    { input: 'lib/makeCacheProvider.js', output: 'dist/makeCacheProvider.js' },
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
