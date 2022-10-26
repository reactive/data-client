import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import replace from 'rollup-plugin-replace';
import dts from 'rollup-plugin-dts';

import pkg from './package.json';

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['@babel/runtime'].includes(dep));

const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node'];
const nativeExtensions = ['.native.ts', ...extensions];
process.env.NODE_ENV = 'production';
process.env.BROWSERSLIST_ENV = 'legacy';
process.env.ROOT_PATH_PREFIX = '@rest-hooks/hooks';

function isExternal(id) {
  const ret = dependencies.includes(id);
  if (!ret) {
    for (const dep of dependencies) {
      if (id.startsWith(dep)) return true;
    }
  }
  return ret;
}

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.ts',
    external: isExternal,
    output: [{ file: pkg.unpkg, format: 'umd', name: 'restHookHooks' }],
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
  },
  {
    input: './lib/index.d.ts',
    output: [{ file: 'index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
  // node-friendly commonjs build
  {
    input: 'src/index.ts',
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
  },
];
