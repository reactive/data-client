import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import replace from 'rollup-plugin-replace';

import pkg from './package.json';

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['normalizr', '@babel/runtime'].includes(dep));

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

const plugins = [['@babel/plugin-transform-runtime', { useESModules: true }]];
const presets = [
  [
    '@anansi/babel-preset',
    {
      typing: 'typescript',
      useBuiltIns: false,
    },
  ],
];

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.ts',
    external: isExternal,
    output: [{ file: pkg.unpkg, format: 'umd', name: 'restHook' }],
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**'],
        extensions,
        runtimeHelpers: true,
        plugins,
        presets,
      }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      resolve({ extensions }),
      commonjs({ extensions }),
      json(),
      terser({}),
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
        plugins,
        presets,
      }),
      resolve({ extensions }),
      commonjs({ extensions }),
    ],
  },
  // test utils commonjs build
  {
    input: 'src/test/index.ts',
    external: id => id === '..' || isExternal(id),
    output: [{ file: 'dist/test.cjs.js', format: 'cjs' }],
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
        extensions,
        runtimeHelpers: true,
        plugins,
        presets,
      }),
      resolve({ extensions }),
      commonjs({ extensions }),
    ],
  },
];
