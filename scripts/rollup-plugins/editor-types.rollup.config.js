import fs from 'fs';
import path from 'path';
import dts from 'rollup-plugin-dts';

import { isExternalTypes, typeConfig } from './rollup-utils.js';

// Bundles a package's .d.ts into one file for the playground editor
// (website/src/components/Playground/monaco/typeLibs.ts)

const EDITOR_TYPES = './website/src/components/Playground/editor-types';

// rollup-plugin-dts can't resolve relative imports written as './x.js' or './x'
const resolveRelativeDts = {
  name: 'resolve-relative-dts',
  resolveId(source, importer) {
    if (!importer || !source.startsWith('.')) return null;
    const base = path.resolve(
      path.dirname(importer),
      source.replace(/\.js$/, ''),
    );
    return (
      [`${base}.d.ts`, path.join(base, 'index.d.ts')].find(file =>
        fs.existsSync(file),
      ) ?? null
    );
  },
};

const editorTypes = (input, output, external = []) => ({
  input,
  output: { file: `${EDITOR_TYPES}/${output}`, format: 'es' },
  external,
  plugins: [resolveRelativeDts, dts({ respectExternal: true })],
});

// Bundles straight from each package's tsc output (lib/), so this only needs
// `tsc --build`, not the packages' full js + bundle builds.
// Mirrors the type configs in packages/*/rollup.config.mjs
const packageTypes = (pkg, entry, output) =>
  editorTypes(
    `./packages/${pkg}/lib/${entry}`,
    `@data-client/${output}`,
    isExternalTypes,
  );

export default [
  packageTypes('core', 'index.d.ts', 'core.d.ts'),
  packageTypes('core', 'next/index.d.ts', 'core/next.d.ts'),
  packageTypes('core', 'mock/index.d.ts', 'core/mock.d.ts'),
  packageTypes('endpoint', 'index.d.ts', 'endpoint.d.ts'),
  packageTypes('normalizr', 'index.d.ts', 'normalizr.d.ts'),
  packageTypes('graphql', 'index.d.ts', 'graphql.d.ts'),
  packageTypes('rest', 'index.d.ts', 'rest.d.ts'),
  packageTypes('rest', 'next/index.d.ts', 'rest/next.d.ts'),
  packageTypes('react', 'index.d.ts', 'react.d.ts'),
  packageTypes('react', 'next/index.d.ts', 'react/next.d.ts'),
  packageTypes('react', 'server/nextjs/index.d.ts', 'react/nextjs.d.ts'),
  packageTypes('react', 'server/index.d.ts', 'react/ssr.d.ts'),
  packageTypes('react', 'server/redux/index.d.ts', 'react/redux.d.ts'),
  packageTypes('vue', 'index.d.ts', 'vue.d.ts'),
  packageTypes('vue', 'test/index.d.ts', 'vue/test.d.ts'),
  editorTypes('./node_modules/uuid/dist/index.d.ts', 'uuid.d.ts'),
  // inlines number-flow/lite and number-flow/plugins
  editorTypes(
    './node_modules/@number-flow/react/dist/index.d.ts',
    '@number-flow/react.d.ts',
    ['react'],
  ),
  {
    ...typeConfig,
    input: './scripts/globals.ts',
    output: { file: `${EDITOR_TYPES}/globals.d.ts`, format: 'es' },
  },
];
