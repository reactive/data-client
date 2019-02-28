import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import { uglify } from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';
import { minify } from 'uglify-es';

import pkg from './package.json';

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['normalizr'].includes(dep));

const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node'];
process.env.NODE_ENV = 'production';

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
    output: [{ file: pkg.browser, format: 'umd', name: 'restHook' }],
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**'],
        extensions,
      }),
      resolve({ extensions }),
      commonjs({ extensions }),
      json(),
      uglify({}, minify),
      filesize(),
    ],
  },
  // node-friendly commonjs build
  {
    input: 'src/index.ts',
    external: isExternal,
    output: [{ file: pkg.main, format: 'cjs' }],
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
        extensions,
        runtimeHelpers: true,
        plugins: ['@babel/plugin-transform-runtime'],
      }),
      resolve({ extensions }),
      commonjs({ extensions }),
    ],
  },

];
