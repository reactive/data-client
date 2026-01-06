import {
  babel,
  banner,
  commonjs,
  filesize,
  json,
  resolve,
  replace,
  terser,
  typeConfig,
  typeConfigNext,
  onwarn,
} from 'rollup-plugins';

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
    input: 'src/index.ts',
    external: id => peers.some(dep => dep === id || id.startsWith(dep)),
    output: [
      {
        file: pkg.unpkg,
        format: 'umd',
        name: 'RDC',
        inlineDynamicImports: true,
        globals: {
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
    { input: 'src/index.ts', output: pkg.main },
    { input: 'src/next/index.ts', output: 'dist/next.js' },
    { input: 'src/server/index.ts', output: 'dist/server/index.js' },
    {
      input: 'src/server/redux/index.ts',
      output: 'dist/server/redux/index.js',
    },
    { input: 'src/mock/index.ts', output: 'dist/mock.js' },
  ].forEach(({ input, output }) => {
    configs.push({
      input,
      external: isExternal,
      output: [{ file: output, format: 'cjs', inlineDynamicImports: true }],
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
  });
}
export default configs;
