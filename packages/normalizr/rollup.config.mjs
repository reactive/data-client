import {
  babel,
  commonjs,
  filesize,
  dts,
  resolve,
  terser,
  onwarn,
} from 'rollup-plugins';

import pkg from './package.json' with { type: 'json' };

const dependencies = Object.keys(pkg.dependencies).filter(
  dep => !['@babel/runtime'].includes(dep),
);

const name = 'normalizr';

const isProduction = process.env.NODE_ENV === 'production';

const destBase = 'dist/normalizr';
const destExtension = `${isProduction ? '.min' : ''}.js`;
const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node'];

function snakeCase(id) {
  return id.replace(/(-|\/)/g, '_').replace(/@/g, '');
}

function isExternal(id) {
  return dependencies.some(dep => dep === id || id.startsWith(dep));
}

const configs = [];

if (process.env.BROWSERSLIST_ENV !== 'node12') {
  if (process.env.NODE_ENV === 'production') {
    configs.push({
      input: 'src/index.ts',
      output: [{ file: `${destBase}.es${destExtension}`, format: 'es' }],
      external: id => id === '..' || isExternal(id),
      onwarn,
      plugins: [
        babel({
          exclude: ['node_modules/**', '/**__tests__/**'],
          extensions,
          babelHelpers: 'runtime',
          rootMode: 'upward',
        }),
        resolve({ extensions }),
        commonjs({ extensions }),
        isProduction && terser(),
        filesize(),
      ].filter(Boolean),
    });
  } else {
    configs.push({
      input: 'src/index.ts',
      output: [
        {
          file: `${destBase}.umd${destExtension}`,
          format: 'umd',
          name: snakeCase(name),
        },
        {
          file: `${destBase}.amd${destExtension}`,
          format: 'amd',
          name: snakeCase(name),
        },
        {
          file: `${destBase}.browser${destExtension}`,
          format: 'iife',
          name: snakeCase(name),
        },
      ],
      onwarn,
      plugins: [
        babel({
          exclude: ['node_modules/**', '/**__tests__/**'],
          extensions,
          babelHelpers: 'runtime',
          rootMode: 'upward',
          caller: { polyfillMethod: false },
        }),
        resolve({ extensions }),
        commonjs({ extensions }),
        isProduction && terser(),
        filesize(),
      ].filter(Boolean),
    });
    configs.push({
      input: './lib/index.d.ts',
      output: [{ file: 'index.d.ts', format: 'es' }],
      plugins: [dts()],
    });
  }
} else {
  // node-friendly commonjs build
  configs.push({
    input: 'src/index.ts',
    output: [{ file: `${destBase}${destExtension}`, format: 'cjs' }],
    external: id => id === '..' || isExternal(id),
    onwarn,
    plugins: [
      babel({
        exclude: ['node_modules/**', '/**__tests__/**'],
        extensions,
        babelHelpers: 'runtime',
        rootMode: 'upward',
      }),
      resolve({ extensions }),
      commonjs({ extensions }),
      isProduction && terser(),
      filesize(),
    ].filter(Boolean),
  });
}
export default configs;
