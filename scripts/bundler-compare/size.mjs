// Prints "<name> <bytes>": the brotli size (quality 11) of the JS a browser loads from <dir>
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { brotliCompressSync, constants } from 'zlib';

const [name, dir] = process.argv.slice(2);
const files = readdirSync(dir, { recursive: true }).filter(file =>
  file.endsWith('.js'),
);
if (!files.length)
  throw new Error(`no JS in ${dir}: did the ${name} build fail?`);
let brotli = 0;
for (const file of files) {
  brotli += brotliCompressSync(readFileSync(join(dir, file)), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
}
console.log(`${name} ${brotli}`);
