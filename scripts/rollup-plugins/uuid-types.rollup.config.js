import fs from 'fs';
import path from 'path';
import dts from 'rollup-plugin-dts';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolveJsAsDts = {
  name: 'resolve-js-as-dts',
  resolveId(source, importer) {
    if (source.endsWith('.js') && importer) {
      // For .js imports in .d.ts files, try to resolve to .d.ts
      const dtsFile = source.replace(/\.js$/, '.d.ts');
      const fullPath = path.resolve(path.dirname(importer), dtsFile);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  },
};

export default [
  {
    input: path.resolve(__dirname, '../../node_modules/uuid/dist/index.d.ts'),
    output: [
      {
        file: path.resolve(
          __dirname,
          '../../website/src/components/Playground/editor-types/uuid.d.ts',
        ),
        format: 'es',
      },
    ],
    plugins: [
      resolveJsAsDts,
      dts({
        respectExternal: false, // Bundle everything
      }),
    ],
  },
];
