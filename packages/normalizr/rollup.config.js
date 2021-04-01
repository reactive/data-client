import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

import { name } from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

const destBase = 'dist/normalizr';
const destExtension = `${isProduction ? '.min' : ''}.js`;
const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node'];

function snakeCase(id) {
  return id.replace(/(-|\/)/g, '_').replace(/@/g, '');
}

const configs = [];

if (process.env.BROWSERSLIST_ENV === 'production') {
  configs.push({
    input: 'src/index.ts',
    output: [{ file: `${destBase}.es${destExtension}`, format: 'es' }],
    plugins: [
      babel({
        exclude: ['node_modules/**', '/**__tests__/**'],
        extensions,
        runtimeHelpers: true,
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
      { file: `${destBase}${destExtension}`, format: 'cjs' },
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
    plugins: [
      babel({
        exclude: ['node_modules/**', '/**__tests__/**'],
        extensions,
        runtimeHelpers: true,
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
