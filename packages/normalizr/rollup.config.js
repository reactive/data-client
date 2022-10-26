import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

import { name } from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

const destBase = 'dist/normalizr';
const destExtension = `${isProduction ? '.min' : ''}.js`;
const extensions = ['.js', '.ts', '.tsx', '.mjs', '.json', '.node'];

function snakeCase(id) {
  return id.replace(/(-|\/)/g, '_').replace(/@/g, '');
}

const configs = [];

if (process.env.BROWSERSLIST_ENV !== 'node12') {
  if (process.env.NODE_ENV === 'production') {
    configs.push({
      input: 'lib/index.js',
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
      input: 'lib/index.js',
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
    configs.push({
      input: './lib/index.d.ts',
      output: [{ file: 'index.d.ts', format: 'es' }],
      plugins: [dts()],
    });
  }
} else {
  // node-friendly commonjs build
  configs.push({
    input: 'lib/index.js',
    output: [{ file: `${destBase}${destExtension}`, format: 'cjs' }],
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
