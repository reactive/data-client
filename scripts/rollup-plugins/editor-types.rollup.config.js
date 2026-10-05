import fs from 'fs';
import path from 'path';
import dts from 'rollup-plugin-dts';

import { typeConfig } from './rollup-utils.js';

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

export default [
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
