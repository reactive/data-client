import { babel, banner, commonjs, resolve } from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['@data-client/normalizr'].includes(dep));

const extensions = [
  '.js',
  '.ts',
  '.tsx',
  '.cts',
  '.cjs',
  '.mjs',
  '.json',
  '.node',
];
process.env.NODE_ENV = 'production';

function isExternal(id) {
  return dependencies.some(dep => dep === id || id.startsWith(dep));
}

function nativeOrNormalPath(path) {
  if (process.env.COMPILE_TARGET !== 'native') return path;
  return path.replace('.js', '.native.js');
}

export default [
  // test utils commonjs build
  {
    input: 'lib/index.js',
    external: id => id === '..' || isExternal(id),
    output: [{ file: nativeOrNormalPath(pkg.main), format: 'cjs' }],
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
        rootMode: 'upward',
        extensions,
        babelHelpers: 'runtime',
      }),
      resolve({ extensions }),
      commonjs({
        extensions,
        ignore: ['@testing-library/react-hooks', './render18HookWrapped.js'],
      }),
    ],
  },
  {
    input: 'lib/makeRenderDataClient/render18HookWrapped.js',
    external: id => id === '..' || isExternal(id),
    output: [
      {
        file: nativeOrNormalPath('./dist/render18HookWrapped.js'),
        format: 'cjs',
      },
    ],
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
        rootMode: 'upward',
        extensions,
        babelHelpers: 'runtime',
      }),
      resolve({ extensions }),
      commonjs({ extensions }),
      // for nextjs 13 compatibility in node https://nextjs.org/docs/app/building-your-application/rendering
      banner(() => "'use client';\n"),
    ],
  },
];
