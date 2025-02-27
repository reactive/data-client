import {
  babel,
  banner,
  commonjs,
  filesize,
  json,
  resolve,
  replace,
  terser,
  onwarn,
} from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.peerDependencies))
  .filter(dep => !['@babel/runtime'].includes(dep));

const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node'];
process.env.NODE_ENV = 'production';
process.env.BROWSERSLIST_ENV = 'legacy';

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
    output: [
      {
        file: pkg.unpkg,
        format: 'umd',
        name: 'EnhancedReducer',
        globals: {
          react: 'React',
        },
      },
    ],
    onwarn,
    plugins: [
      babel({
        exclude: ['node_modules/**', '**/__tests__/**'],
        rootMode: 'upward',
        extensions,
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
      filesize(),
    ],
  },
  // node-friendly commonjs build
  {
    input: 'src/index.ts',
    external: isExternal,
    output: [{ file: pkg.main, format: 'cjs' }],
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
