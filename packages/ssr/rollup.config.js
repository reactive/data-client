import babel from 'rollup-plugin-babel';
import banner from 'rollup-plugin-banner2';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .concat(['@data-client/core', 'data-client'])
  .filter(dep => !['@babel/runtime'].includes(dep));
const peers = Object.keys(pkg.peerDependencies);

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
    external: id => peers.some(dep => dep === id || id.startsWith(dep)),
    output: [
      {
        file: pkg.unpkg,
        format: 'umd',
        name: 'RDC.SSR',
        globals: {
          '@data-client/react': 'RDC',
          '@data-client/redux': 'RDC.Redux',
          redux: 'Redux',
          react: 'React',
        },
      },
    ],
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
      // for nextjs 13 compatibility in node https://nextjs.org/docs/app/building-your-application/rendering
      banner(() => "'use client';\n"),
    ],
  });
}
export default configs;
