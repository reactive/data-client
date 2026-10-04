import fs from 'fs';
import path from 'path';
import dts from 'rollup-plugin-dts';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// number-flow's .d.ts use extensionless relative imports ('./ssr', '.')
const resolveRelativeDts = {
  name: 'resolve-relative-dts',
  resolveId(source, importer) {
    if (!importer || !source.startsWith('.')) return null;
    const base = path.resolve(path.dirname(importer), source);
    return (
      [`${base}.d.ts`, path.join(base, 'index.d.ts')].find(file =>
        fs.existsSync(file),
      ) ?? null
    );
  },
};

// number-flow/lite re-exports number-flow/plugins, so one bundle covers both
export default [
  {
    input: path.resolve(
      __dirname,
      '../../node_modules/number-flow/dist/lite.d.ts',
    ),
    output: [
      {
        file: path.resolve(
          __dirname,
          '../../website/src/components/Playground/editor-types/number-flow-lite.d.ts',
        ),
        format: 'es',
      },
    ],
    plugins: [
      resolveRelativeDts,
      dts({
        respectExternal: false, // Bundle everything
      }),
    ],
  },
];
