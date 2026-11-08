import fs from 'fs';
import path from 'path';
import {
  babel,
  commonjs,
  filesize,
  dts,
  resolve,
  terser,
  onwarn,
  isNative,
  nativeOrNormalPath,
  nodeOutput,
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

// React Native: `INVALID` lives in one CommonJS file that both the ESM `native/` build (Metro
// `import`) and `dist/normalizr.native.js` (core, Jest `require()`) load, so an app has one `INVALID`.
const nativeSymbolEntry = 'symbol';
const nativeSymbol = nativeOrNormalPath(`dist/${nativeSymbolEntry}.js`);
/** native/ (Babel ESM) re-exports the shared `INVALID` */
const writeNativeSymbol = {
  name: 'write-native-symbol',
  writeBundle() {
    fs.mkdirSync('native/denormalize', { recursive: true });
    fs.writeFileSync(
      'native/denormalize/symbol.js',
      `export * from '${path.relative('native/denormalize', nativeSymbol)}';\n`,
    );
  },
};

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
  // node-friendly (or React Native Jest) commonjs build
  const plugins = [
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
  ].filter(Boolean);
  configs.push(
    isNative ?
      {
        // one build, so `normalizr` loads the `symbol` entry instead of bundling its own `INVALID`
        input: {
          [path.basename(destBase)]: 'src/index.ts',
          [nativeSymbolEntry]: 'src/denormalize/symbol.ts',
        },
        output: [nodeOutput],
        external: id => id === '..' || isExternal(id),
        onwarn,
        plugins: [...plugins, writeNativeSymbol],
      }
    : {
        input: 'src/index.ts',
        output: [{ file: `${destBase}${destExtension}`, format: 'cjs' }],
        external: id => id === '..' || isExternal(id),
        onwarn,
        plugins,
      },
  );
}
export default configs;
