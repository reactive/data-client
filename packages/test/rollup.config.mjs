import {
  babel,
  banner,
  commonjs,
  resolve,
  replace,
  onwarn,
  isNative,
  nativeOrNormalPath,
} from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['@data-client/normalizr', '@babel/runtime'].includes(dep));

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

// renderHook.cts loads this lazily with require(), which rollup leaves as-is
const renderHookWrapped = './render18HookWrapped.js';

export default [
  // test utils commonjs build
  {
    input: 'src/index.ts',
    external: id => id === '..' || isExternal(id),
    output: [{ file: nativeOrNormalPath(pkg.main), format: 'cjs' }],
    onwarn,
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
        ignore: ['@testing-library/react-hooks', renderHookWrapped],
      }),
      ...(isNative ?
        [
          replace({
            values: {
              [`require('${renderHookWrapped}')`]: `require('${nativeOrNormalPath(renderHookWrapped)}')`,
            },
            delimiters: ['', ''],
            preventAssignment: false,
          }),
        ]
      : []),
    ],
  },
  {
    input: 'src/makeRenderDataClient/render18HookWrapped.tsx',
    external: id => id === '..' || isExternal(id),
    output: [
      {
        file: nativeOrNormalPath('./dist/render18HookWrapped.js'),
        format: 'cjs',
      },
    ],
    onwarn,
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
