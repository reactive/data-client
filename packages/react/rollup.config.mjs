import fs from 'fs';
import path from 'path';
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
  isNative,
  nativeOrNormalPath,
  nodeEntries,
  nodeShims,
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

// React Native: the contexts are one CommonJS file that both the ESM `native/` build (Metro
// `import`) and `dist/*.native.js` (Jest, `require()`) load, so an app has one set of contexts.
const nativeContextEntry = 'context';
const nativeContext = nativeOrNormalPath(`dist/${nativeContextEntry}.js`);

function isExternal(id) {
  return (
    id === 'react-native' ||
    dependencies.some(dep => dep === id || id.startsWith(dep))
  );
}
/** native/ (Babel ESM) re-exports the shared contexts */
const writeNativeContext = {
  name: 'write-native-context',
  writeBundle() {
    fs.mkdirSync('native', { recursive: true });
    fs.writeFileSync(
      'native/context.js',
      `export * from '${path.relative('native', nativeContext)}';\n`,
    );
  },
};

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
  // node-friendly (or React Native Jest) commonjs build
  // One build so the entries share chunks: `@data-client/react/redux` must provide the same
  // contexts the hooks from `@data-client/react` read, not a bundled copy
  configs.push({
    input: {
      ...nodeEntries(pkg),
      // its own file: native/context.js loads it (see nativeContext)
      ...(isNative && { [nativeContextEntry]: 'src/context.ts' }),
    },
    external: isExternal,
    output: [
      {
        dir: 'dist',
        format: 'cjs',
        entryFileNames: nativeOrNormalPath('[name].js'),
        chunkFileNames: nativeOrNormalPath('[name]-[hash].js'),
      },
    ],
    onwarn,
    plugins: [
      nodeShims(pkg),
      babel({
        exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
        extensions: nativeExtensions,
        rootMode: 'upward',
        babelHelpers: 'runtime',
      }),
      replace({ 'process.env.CJS': 'true', preventAssignment: true }),
      resolve({ extensions: nativeExtensions }),
      commonjs({ extensions: nativeExtensions }),
      // web: 'use client' for nextjs 13 compatibility in node https://nextjs.org/docs/app/building-your-application/rendering
      isNative ? writeNativeContext : banner(() => "'use client';\n"),
    ],
  });
}
export default configs;
