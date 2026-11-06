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

// Entry files other entries load instead of bundling a copy (src -> dist).
// React Native: the contexts are one CommonJS file that both the ESM `native/` build (Metro
// `import`) and `dist/*.native.js` (Jest, `require()`) load, so an app has one set of contexts.
const nativeContext = 'dist/context.native.js';
const siblings = Object.fromEntries(
  Object.entries({
    'src/index.js': nativeOrNormalPath('dist/index.js'),
    ...(isNative && { 'src/context.js': nativeContext }),
  }).map(([src, dist]) => [path.resolve(src), dist]),
);

function isExternal(id, importer) {
  return (
    (importer &&
      id.startsWith('.') &&
      path.resolve(path.dirname(importer), id) in siblings) ||
    id === 'react-native' ||
    dependencies.some(dep => dep === id || id.startsWith(dep))
  );
}
/** Require siblings by their dist path, relative to `output` */
function siblingPaths(output) {
  return id => {
    if (!(id in siblings)) return id;
    const relative = path.relative(path.dirname(output), siblings[id]);
    return relative.startsWith('.') ? relative : `./${relative}`;
  };
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
  (isNative ?
    [
      { input: 'src/context.ts', output: nativeContext },
      { input: 'src/index.ts', output: pkg.main },
      { input: 'src/next/index.ts', output: 'dist/next.js' },
      {
        input: 'src/server/redux/index.ts',
        output: 'dist/server/redux/index.js',
      },
    ]
  : [
      { input: 'src/index.ts', output: pkg.main },
      { input: 'src/next/index.ts', output: 'dist/next.js' },
      { input: 'src/server/index.ts', output: 'dist/server/index.js' },
      {
        input: 'src/server/redux/index.ts',
        output: 'dist/server/redux/index.js',
      },
      { input: 'src/mock/index.ts', output: 'dist/mock.js' },
    ]
  ).forEach(({ input, output }) => {
    const file = output === nativeContext ? output : nativeOrNormalPath(output);
    configs.push({
      input,
      external: isExternal,
      output: [
        {
          file,
          format: 'cjs',
          inlineDynamicImports: true,
          paths: siblingPaths(file),
        },
      ],
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
        ...(output === nativeContext ? [writeNativeContext] : []),
        // for nextjs 13 compatibility in node https://nextjs.org/docs/app/building-your-application/rendering
        ...(isNative ? [] : [banner(() => "'use client';\n")]),
      ],
    });
  });
}
export default configs;
