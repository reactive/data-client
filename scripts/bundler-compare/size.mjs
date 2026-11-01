// Prints "<name>-gzip <bytes>" and "<name>-brotli <bytes>" for the JS a browser loads from <dir>
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { brotliCompressSync, constants, gzipSync } from 'zlib';

const [name, dir] = process.argv.slice(2);
const files = readdirSync(dir, { recursive: true }).filter(
  file => file.endsWith('.js') && !file.split(/[\\/]/).includes('server'),
);
if (!files.length)
  throw new Error(`no JS in ${dir}: did the ${name} build fail?`);
let gzip = 0;
let brotli = 0;
for (const file of files) {
  const code = readFileSync(join(dir, file));
  gzip += gzipSync(code, { level: 9 }).length;
  brotli += brotliCompressSync(code, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
}
console.log(`${name}-gzip ${gzip}\n${name}-brotli ${brotli}`);
