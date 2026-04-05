import { readFileSync } from 'fs';
import { createRequire } from 'module';
import {
  babel,
  commonjs,
  filesize,
  json,
  resolve,
  replace,
  terser,
  typeConfig,
  typeConfigNext,
  onwarn,
  resolveTsAsJs,
} from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies).filter(
  dep => !['@babel/runtime'].includes(dep),
);

const extensions = ['.ts', '.tsx', '.js', '.mjs', '.json', '.node'];
const nativeExtensions = ['.native.ts', ...extensions];
process.env.NODE_ENV = 'production';

function isExternal(id) {
  return dependencies.some(dep => dep === id || id.startsWith(dep));
}

// Converts path-to-regexp CJS to ESM so rollup can tree-shake unused exports
// (match, stringify, etc.). The standard @rollup/plugin-commonjs wraps the
// entire module in an opaque function, defeating tree-shaking.
function pathToRegexpESM() {
  const require = createRequire(import.meta.url);
  const VIRTUAL_ID = '\0path-to-regexp-esm';
  return {
    name: 'path-to-regexp-esm',
    resolveId(source) {
      if (source === 'path-to-regexp') return VIRTUAL_ID;
    },
    load(id) {
      if (id !== VIRTUAL_ID) return null;
      const source = readFileSync(require.resolve('path-to-regexp'), 'utf-8');
      // Strip CJS boilerplate — remaining code is plain function/class/const
      // declarations that work as-is in ESM (function declarations are hoisted).
      return (
        source
          .replace(/^"use strict";\s*/m, '')
          .replace(/^Object\.defineProperty\(exports,\s*"__esModule".*\n/m, '')
          .replace(/^(?:exports\.\w+\s*=\s*)+void 0;\s*\n/gm, '')
          .replace(/^exports\.(\w+)\s*=\s*\w+;\s*\n/gm, '')
          .replace(/\/\/# sourceMappingURL=.*$/, '') +
        '\nexport { compile, parse, pathToRegexp, TokenData };\n'
      );
    },
  };
}

const configs = [];
if (process.env.BROWSERSLIST_ENV === '2020') {
  // Bundle only path-to-regexp into lib/pathToRegexp.js as tree-shaken ESM.
  // Overwrites the Babel pass-through re-export with an inlined build that
  // eliminates the CJS/ESM boundary (fixes StackBlitz WebContainers) and
  // drops unused exports (match, stringify, ID regex).
  configs.push({
    input: 'src/pathToRegexp.ts',
    external: id => id === '@babel/runtime' || id.startsWith('@babel/runtime/'),
    output: [{ file: 'lib/pathToRegexp.js', format: 'esm' }],
    onwarn,
    plugins: [
      pathToRegexpESM(),
      babel({
        exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
        extensions,
        babelHelpers: 'runtime',
        rootMode: 'upward',
        caller: { polyfillMethod: false },
      }),
      resolve({ extensions }),
      resolveTsAsJs,
      json(),
    ],
  });
} else if (process.env.BROWSERSLIST_ENV !== 'node12') {
  //TODO: this needs to use src/index.ts so it doesn't include the wrong polyfills
  // browser-friendly UMD build
  configs.push({
    input: 'src/index.ts',
    output: [{ file: pkg.unpkg, format: 'umd', name: 'Rest' }],
    onwarn,
    plugins: [
      babel({
        exclude: ['node_modules/**', '/**__tests__/**'],
        extensions,
        babelHelpers: 'runtime',
        rootMode: 'upward',
        caller: { polyfillMethod: false },
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true,
      }),
      resolve({ extensions }),
      resolveTsAsJs,
      commonjs({ extensions }),
      json(),
      terser(),
      filesize({ showBrotliSize: true }),
    ],
  });
  configs.push(typeConfig);
  configs.push(typeConfigNext);
} else {
  // node-friendly commonjs build
  [
    { input: 'src/index.ts', output: pkg.main },
    { input: 'src/next/index.ts', output: 'dist/next.js' },
  ].forEach(({ input, output }) => {
    configs.push({
      input,
      external: isExternal,
      output: [{ file: output, format: 'cjs' }],
      onwarn,
      plugins: [
        babel({
          exclude: ['node_modules/**', '**/__tests__/**', '**/*.d.ts'],
          extensions: nativeExtensions,
          babelHelpers: 'runtime',
          rootMode: 'upward',
        }),
        replace({
          'process.env.CJS': 'true',
          preventAssignment: true,
        }),
        resolve({ extensions: nativeExtensions }),
        resolveTsAsJs,
        commonjs({ extensions: nativeExtensions }),
      ],
    });
  });
}
export default configs;
