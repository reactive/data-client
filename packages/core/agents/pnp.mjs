// Finds installed packages in Yarn Plug'n'Play projects. It reads the install
// map and the zip cache as data and never runs the project's .pnp.cjs.
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { readJSON } from './node-modules.mjs';

/**
 * Each installed version of the `names` packages in the PnP project holding
 * `projectDir`. Packages in the zip cache get their package.json and skills
 * extracted under `extractTo`, an empty directory the caller owns.
 * @returns {{ pkg: string, dir: string }[]}
 */
export function pnpPackages(projectDir, names, extractTo) {
  const root = pnpRoot(projectDir);
  if (!root) return [];
  const found = [];
  for (const [pkg, versions] of runtimeState(root).packageRegistryData) {
    if (!names.includes(pkg)) continue;
    for (const [, { packageLocation }] of versions) {
      const location = path.resolve(root, packageLocation);
      const dir =
        fs.existsSync(location) ? location : (
          extract(location, path.join(extractTo, String(found.length)))
        );
      if (dir) found.push({ pkg, dir });
    }
  }
  return found;
}

/** The nearest directory with a PnP install map, the project's Yarn root */
function pnpRoot(dir) {
  for (let up = dir; ; up = path.dirname(up)) {
    if (
      ['.pnp.data.json', '.pnp.cjs'].some(f => fs.existsSync(path.join(up, f)))
    )
      return up;
    if (up === path.dirname(up)) return undefined;
  }
}

/**
 * The install map: .pnp.data.json, or the JSON that .pnp.cjs inlines as a
 * single-quoted string (Yarn's default)
 */
function runtimeState(root) {
  const data = path.join(root, '.pnp.data.json');
  if (fs.existsSync(data)) return readJSON(data);
  const text = fs.readFileSync(path.join(root, '.pnp.cjs'), 'utf8');
  // most PnP projects don't use Data Client; skip parsing their map
  if (!text.includes('"@data-client/')) return { packageRegistryData: [] };
  const literal = /RAW_RUNTIME_STATE\s*=\s*'((?:[^'\\]|\\[\s\S])*)'/.exec(
    text,
  )?.[1];
  // older Yarn majors inline the map differently
  if (!literal) return { packageRegistryData: [] };
  // undo the string escapes; a backslash before a line break continues it
  return JSON.parse(
    literal.replace(/\\(\r?\n|[\s\S])/g, (_, c) =>
      /^\r?\n$/.test(c) ? '' : c,
    ),
  );
}

/** Extracts a zipped package's package.json and skills into `dir` */
function extract(location, dir) {
  const [, zipFile, inner] = /^(.*?\.zip)[\\/](.*)$/.exec(location) ?? [];
  if (!zipFile || !fs.existsSync(zipFile)) return undefined;
  const prefix = inner.split(path.sep).join('/').replace(/\/?$/, '/');
  const entries = zipEntries(fs.readFileSync(zipFile));
  const manifest = entries.get(`${prefix}package.json`)?.();
  if (!manifest) return undefined;
  for (const [entry, read] of entries) {
    const relative = entry.slice(prefix.length);
    if (
      entry.startsWith(`${prefix}skills/`) &&
      !entry.endsWith('/') &&
      !relative.split(/[\\/]/).includes('..')
    )
      write(path.join(dir, relative), read());
  }
  write(path.join(dir, 'package.json'), manifest);
  return dir;
}

function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

/** Entry name -> reader of its contents, for a zip without Zip64 */
function zipEntries(zip) {
  const end = zip.lastIndexOf(Buffer.from('PK\x05\x06', 'latin1'));
  const entries = new Map();
  let at = zip.readUInt32LE(end + 16);
  for (let count = zip.readUInt16LE(end + 10); count > 0; count--) {
    const method = zip.readUInt16LE(at + 10);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const local = zip.readUInt32LE(at + 42);
    entries.set(zip.toString('utf8', at + 46, at + 46 + nameLength), () => {
      const start =
        local +
        30 +
        zip.readUInt16LE(local + 26) +
        zip.readUInt16LE(local + 28);
      const data = zip.subarray(start, start + size);
      // a skill file is small; a bigger one is a zip bomb, not a skill
      return method === 8 ?
          zlib.inflateRawSync(data, { maxOutputLength: 8 << 20 })
        : data;
    });
    at +=
      46 + nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
  }
  return entries;
}
