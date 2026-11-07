import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import dts from 'rollup-plugin-dts';

const require = createRequire(import.meta.url);

export function isExternalTypes(id) {
  if (id.startsWith('@data-client/core')) return true;
  if (id.startsWith('@data-client') || id.startsWith('data-client'))
    return false;
  if (id.startsWith('.')) return false;
  if (id.includes('data-client/packages')) return false;
  return true;
}
export const typeConfig = {
  input: './lib/index.d.ts',
  output: [{ file: 'index.d.ts', format: 'es' }],
  external: isExternalTypes,
  plugins: [dts({ respectExternal: true })],
};
export const typeConfigNext = {
  input: './lib/next/index.d.ts',
  output: [{ file: 'next.d.ts', format: 'es' }],
  external: isExternalTypes,
  plugins: [dts({ respectExternal: true })],
};

export const esnextConfig = {
  // TypeScript 7 native no longer ships lib.*.d.ts beside the root package.
  // @typescript/old is the TS6 API dependency of @typescript/typescript6.
  input: require.resolve('@typescript/old/lib/lib.es2022.array.d.ts'),
  output: [{ file: 'lib.esnext.d.ts', format: 'es' }],
  external: id => {
    return false;
  },
  plugins: [dts({ respectExternal: true })],
};

/** React Native build (`yarn g:rollup-native`): compiles `.native` sources (see babel.config.js).
 * Its CommonJS `dist/*.native.js` output is for React Native Jest, which runs in Node and does not
 * compile node_modules. Metro loads the ESM `native/` build (`yarn g:babel-native`) instead.
 */
export const isNative = process.env.COMPILE_TARGET === 'native';

/** `dist/index.js` -> `dist/index.native.js` in the React Native build */
export function nativeOrNormalPath(file) {
  return isNative ? file.replace(/\.js$/, '.native.js') : file;
}

/** The CommonJS entries `exports` publishes for this build, as rollup `input`: each `require` target (in the
 * React Native build, `react-native.require`) from the source its `lib/` build compiles, e.g.
 * `{ 'server/redux/index': 'src/server/redux/index.ts' }`. Build them all in one rollup build, so entries share
 * chunks rather than each bundling its own copy of shared code (a second `Controller`, or contexts no hook reads).
 */
export function nodeEntries(pkg) {
  const input = {};
  for (const [subpath, conditions] of Object.entries(pkg.exports)) {
    const target =
      isNative ? conditions['react-native']?.require : conditions.require;
    if (typeof target !== 'string') continue;
    const base = (conditions.module ?? conditions.default)
      .replace(/^\.\/lib\//, 'src/')
      .replace(/\.js$/, '');
    const source = ['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync);
    if (!source)
      throw new Error(`exports['${subpath}']: no ${base}.ts to build`);
    input[target.replace(/^\.\/dist\//, '').replace(/(\.native)?\.js$/, '')] =
      source;
  }
  return input;
}

/** Fails the build unless every `exports` entry with a `require` target also loads it for Node `import`, through a
 * shim that re-exports it, with `module` ahead of `import` so bundlers keep `lib/`. Otherwise Node `import` of the
 * subpath falls through to `lib/` while the main entry loads `dist/`: two copies of shared code. */
export function nodeShims(pkg) {
  return {
    name: 'node-shims',
    buildStart() {
      for (const [subpath, conditions] of Object.entries(pkg.exports)) {
        if (typeof conditions.require !== 'string') continue;
        const shim = conditions.import;
        const expected = `export * from '${conditions.require}';\n`;
        const keys = Object.keys(conditions);
        if (typeof shim !== 'string' || !shim.endsWith('.mjs'))
          this.error(
            `exports['${subpath}'] needs an "import" shim (*.mjs) containing: ${expected}`,
          );
        else if (
          !fs.existsSync(shim) ||
          fs.readFileSync(shim, 'utf8') !== expected
        )
          this.error(`${shim} must contain exactly: ${expected}`);
        else if (keys.indexOf('module') > keys.indexOf('import'))
          this.error(
            `exports['${subpath}'] needs "module" (lib/) ahead of "import"`,
          );
      }
    },
  };
}

export function onwarn(warning, warn) {
  // Suppress "use client" warnings
  if (
    warning.message.includes(
      'Module level directives cause errors when bundled, "use client" in',
    )
  ) {
    return;
  }
  warn(warning);
}

export const resolveTsAsJs = {
  name: 'resolve-ts-as-js',
  resolveId(source, importer) {
    if (source.endsWith('.js')) {
      const tsFile = source.replace(/\.js$/, '.ts');
      const fullPath = path.resolve(path.dirname(importer), tsFile);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  },
};
