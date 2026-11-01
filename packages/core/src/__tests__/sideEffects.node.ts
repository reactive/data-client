import fs from 'fs';
import path from 'path';

/* Packages list their entry files in `sideEffects` so webpack keeps each
 * package's index and hoists the package into one module. A new entry
 * missing from the list still works, but makes bundles larger.
 */
const packagesDir = path.join(__dirname, '../../..');
/* Not react: its index re-exports `__INTERNAL__` as a namespace, which
 * Turbopack keeps (+1 kB) once the index is marked side-effectful.
 */
const entriesListed = [
  '@data-client/core',
  '@data-client/endpoint',
  '@data-client/graphql',
  '@data-client/normalizr',
  '@data-client/rest',
];

/** Entry files bundlers resolve: `module`, `react-native` and `exports` targets */
function entryFiles(pkg: any): string[] {
  const targets: string[] = [pkg.module, pkg['react-native']];
  for (const entry of Object.values(pkg.exports ?? {})) {
    if (typeof entry === 'string') targets.push(entry);
    else
      for (const [condition, target] of Object.entries(entry as object)) {
        // types aren't bundled; require and import resolve to dist/ (Node)
        if (!['types', 'require', 'import'].includes(condition))
          targets.push(target);
      }
  }
  return [
    ...new Set(
      targets
        .filter(target => typeof target === 'string' && target.endsWith('.js'))
        .map(target => (target.startsWith('./') ? target : `./${target}`)),
    ),
  ];
}

const packages = fs
  .readdirSync(packagesDir)
  .map(name => path.join(packagesDir, name, 'package.json'))
  .filter(file => fs.existsSync(file))
  .map(file => JSON.parse(fs.readFileSync(file, 'utf8')))
  .filter(pkg => entriesListed.includes(pkg.name));

test('packages list sideEffects as arrays', () => {
  expect(packages.map(pkg => pkg.name).sort()).toEqual(entriesListed);
  for (const pkg of packages) expect(Array.isArray(pkg.sideEffects)).toBe(true);
});

test.each(packages.map(pkg => [pkg.name, pkg]))(
  '%s lists every entry file in sideEffects',
  (_, pkg) => {
    const missing = entryFiles(pkg).filter(
      file => !pkg.sideEffects.includes(file),
    );
    expect(missing).toEqual([]);
  },
);
