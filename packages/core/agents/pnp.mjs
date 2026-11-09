// Finds installed packages in Yarn Plug'n'Play projects. It reads the install
// map and the zip cache as data and never runs the project's .pnp.cjs.
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { ancestors, escapes, posix, readJSON } from './node-modules.mjs';

/**
 * A package in Yarn's zip cache: the archive, then the package's path inside
 * it, which always starts at node_modules (so a folder named *.zip higher up
 * isn't taken for the archive)
 */
const ZIPPED = /^(.*?\.zip)[\\/](node_modules[\\/].*)$/;

/**
 * Each installed version of the `names` packages in the PnP project holding
 * `projectDir`. Packages in the zip cache get their package.json and skills
 * extracted under `extractTo`, an empty directory the caller owns. The
 * version `projectDir`'s own workspace resolves comes first.
 * @returns {{ pkg: string, dir: string }[]}
 */
export function pnpPackages(projectDir, names, extractTo) {
  const root = pnpRoot(projectDir);
  if (!root) return [];
  const registry = runtimeState(root).packageRegistryData;
  const own = ownDependencies(root, registry, projectDir);
  const found = [];
  for (const [pkg, versions] of registry) {
    if (!names.includes(pkg)) continue;
    const first = ([reference]) => reference === own.get(pkg);
    for (const [, { packageLocation }] of [
      ...versions.filter(first),
      ...versions.filter(version => !first(version)),
    ]) {
      const location = path.resolve(root, packageLocation);
      // read a path inside a zip only by extracting, never as a folder, even
      // when extracting finds nothing: under Yarn's runtime
      // (`yarn data-client-skills`) it looks like a folder, but only Yarn's
      // patched fs can read it
      const zip = zipLocation(location);
      const dir =
        zip ? extract(zip, path.join(extractTo, String(found.length)))
        : fs.existsSync(location) ? location
        : undefined;
      if (dir) found.push({ pkg, dir });
    }
  }
  return found;
}

/** Package name -> reference that the workspace at `dir` depends on */
function ownDependencies(root, registry, dir) {
  const workspace = registry
    .flatMap(([, versions]) => versions)
    .find(
      ([, { packageLocation }]) =>
        path.resolve(root, packageLocation) === path.resolve(dir),
    );
  return new Map(workspace?.[1].packageDependencies ?? []);
}

/** The nearest directory with a PnP install map, the project's Yarn root */
function pnpRoot(dir) {
  for (const up of ancestors(dir))
    if (
      ['.pnp.data.json', '.pnp.cjs'].some(f => fs.existsSync(path.join(up, f)))
    )
      return up;
}

/**
 * The install map: .pnp.data.json, or the JSON that .pnp.cjs inlines as a
 * single-quoted string (Yarn's default)
 */
function runtimeState(root) {
  const data = path.join(root, '.pnp.data.json');
  if (fs.existsSync(data)) return readJSON(data);
  const text = fs.readFileSync(path.join(root, '.pnp.cjs'), 'utf8');
  // Most PnP projects don't use Data Client, so skip parsing their map. The
  // literal ends at the first `';` closing a line: every line break inside it
  // is escaped (a per-character match overflows the regex stack on large
  // maps). Older Yarn majors inline the map differently.
  const literal =
    text.includes('"@data-client/') &&
    /RAW_RUNTIME_STATE\s*=\s*'([\s\S]*?)';\r?\n/.exec(text)?.[1];
  if (!literal) return { packageRegistryData: [] };
  // undo the string escapes; a backslash before a line break continues it
  return JSON.parse(
    literal.replace(/\\\r?\n/g, '').replace(/\\([\s\S])/g, '$1'),
  );
}

/** `location`'s archive and path inside it, when a zip file holds it */
function zipLocation(location) {
  const match = ZIPPED.exec(location);
  return match && fs.statSync(match[1], { throwIfNoEntry: false })?.isFile() ?
      { zipFile: match[1], inner: match[2] }
    : undefined;
}

/** Extracts a zipped package's package.json and skills into `dir` */
function extract({ zipFile, inner }, dir) {
  const prefix = posix(inner).replace(/\/?$/, '/');
  const entries = zipEntries(fs.readFileSync(zipFile));
  const manifest = entries.get(`${prefix}package.json`)?.();
  if (!manifest) return undefined;
  for (const [entry, read] of entries) {
    const relative = entry.slice(prefix.length);
    if (
      entry.startsWith(`${prefix}skills/`) &&
      !entry.endsWith('/') &&
      !escapes(relative)
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
