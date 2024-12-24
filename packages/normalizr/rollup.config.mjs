import { babel, commonjs, filesize, dts, resolve, terser } from 'rollup-plugins';

const name = 'normalizr';

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
