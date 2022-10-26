import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import replace from 'rollup-plugin-replace';

import { typeConfig, esnextConfig } from '../../rollup-utils';
import pkg from './package.json';

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['@babel/runtime'].includes(dep));

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
    input: 'lib/index.js',
    external: isExternal,
    output: [{ file: pkg.unpkg, format: 'umd', name: 'restHook' }],
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
  configs.push(esnextConfig);
} else {
  // node-friendly commonjs build
  configs.push({
    input: 'lib/index.js',
    external: isExternal,
    output: [{ file: pkg.main, format: 'cjs' }],
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
}
export default configs;
