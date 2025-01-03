import { babel, banner, commonjs, filesize, json, resolve, replace, terser, typeConfig, typeConfigNext } from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(
    dep =>
      !['@data-client/use-enhanced-reducer', '@babel/runtime'].includes(dep),
  );
const peers = Object.keys(pkg.peerDependencies);

const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node', '.jsx'];
const nativeExtensions = ['.native.ts', ...extensions];
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
    input: 'lib/index.js',
    external: id => peers.some(dep => dep === id || id.startsWith(dep)),
    output: [
      {
        file: pkg.unpkg,
        format: 'umd',
        name: 'RDC',
        inlineDynamicImports: true,
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
  configs.push(typeConfig);
  configs.push(typeConfigNext);
  configs.push({
    ...typeConfig,
    input: './lib/server/nextjs/index.d.ts',
    output: [{ file: 'nextjs.d.ts', format: 'es' }],
  });
  configs.push({
    ...typeConfig,
    input: './lib/server/index.d.ts',
    output: [{ file: 'ssr.d.ts', format: 'es' }],
  });
  configs.push({
    ...typeConfig,
    input: './lib/server/redux/index.d.ts',
    output: [{ file: 'redux.d.ts', format: 'es' }],
  });
} else {
  // node-friendly commonjs build
  [
    { input: 'lib/index.js', output: pkg.main },
    { input: 'lib/next/index.js', output: 'dist/next.js' },
    { input: 'lib/server/index.js', output: 'dist/server/index.js' },
    {
      input: 'lib/server/redux/index.js',
      output: 'dist/server/redux/index.js',
    },
  ].forEach(({ input, output }) => {
    configs.push({
      input,
      external: isExternal,
      output: [{ file: output, format: 'cjs', inlineDynamicImports: true }],
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
  });
}
export default configs;
