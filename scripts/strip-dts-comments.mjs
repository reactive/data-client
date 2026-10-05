// usage: node scripts/strip-dts-comments.mjs <in.d.ts> <out.d.ts>
// Reprints a declaration file without comments, for editor types whose JSDoc
// dwarfs the declarations (csstype's MDN docs are ~75% of the file).
import fs from 'fs';
import ts from 'typescript';

const [input, output] = process.argv.slice(2);
const source = ts.createSourceFile(
  input,
  fs.readFileSync(input, 'utf8'),
  ts.ScriptTarget.Latest,
);
fs.writeFileSync(
  output,
  ts.createPrinter({ removeComments: true }).printFile(source),
);
