// Apps get polyfills elsewhere, so leave the entries' Object.hasOwn fallback out of the totals
import { readFileSync, writeFileSync } from 'fs';

const fallback = /^Object\.hasOwn = Object\.hasOwn \|\|[\s\S]*?\n\};\n/;
let stripped = 0;
for (const file of process.argv.slice(2)) {
  const code = readFileSync(file, 'utf8');
  if (!fallback.test(code)) continue;
  writeFileSync(file, code.replace(fallback, ''));
  stripped++;
}
// endpoint and react carry it; none found means the built header changed
if (!stripped)
  throw new Error('no Object.hasOwn fallback found: update strip-hasown.mjs');
