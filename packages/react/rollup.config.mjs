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
// React Native Jest (runs in Node; does not compile node_modules): `.native` sources
// (see babel.config.js) as CommonJS for Node. Metro loads the ESM `native/` build instead.
const isNative = process.env.COMPILE_TARGET === 'native';

function isExternal(id) {
  return (
    // when we import contexts in our other entry points
    id === '../../index.js' ||
    id === '../index.js' ||
    id === 'react-native' ||
    dependencies.some(dep => dep === id || id.startsWith(dep))
  );
}
// React contexts must be one instance per app. Metro `import`s the ESM `native/` build and
// Jest (or a `require()`) loads the CommonJS one, so both load the contexts from this file.
const nativeContext = 'dist/context.native.js';
const srcContext = path.resolve('src/context.js');
const shareNativeContext = {
  name: 'share-native-context',
  resolveId(source, importer) {
    if (
      importer &&
      source.endsWith('/context.js') &&
      path.resolve(path.dirname(importer), source) === srcContext
    )
      return { id: srcContext, external: true };
    return null;
  },
};
// native entries must share the native index and contexts
function nativePaths(output) {
  const relativeTo = file => {
    const relative = path.relative(path.dirname(output), file);
    return relative.startsWith('.') ? relative : `./${relative}`;
  };
  const targets = {
    [path.resolve('src/index.js')]: relativeTo('dist/index.native.js'),
    [srcContext]: relativeTo(nativeContext),
  };
  return id => targets[id] ?? id;
}

const configs = [];
if (process.env.BROWSERSLIST_ENV !== 'node12' && !isNative) {
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
} else if (isNative) {
  [
    { input: 'src/context.ts', output: nativeContext },
    { input: 'src/index.ts', output: 'dist/index.native.js' },
    { input: 'src/next/index.ts', output: 'dist/next.native.js' },
    {
      input: 'src/server/redux/index.ts',
      output: 'dist/server/redux/index.native.js',
    },
  ].forEach(({ input, output }) => {
    configs.push({
      input,
      external: isExternal,
      output: [
        {
          file: output,
          format: 'cjs',
          inlineDynamicImports: true,
          paths: nativePaths(output),
        },
      ],
      onwarn,
      plugins: [
        babel({
          exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
          extensions,
          rootMode: 'upward',
          babelHelpers: 'runtime',
        }),
        replace({ 'process.env.CJS': 'true', preventAssignment: true }),
        shareNativeContext,
        resolve({ extensions }),
        commonjs({ extensions }),
      ],
    });
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
