#!/usr/bin/env node
// Parses every @data-client declaration file the installed TypeScript loads
// from each published entry point (via the `typesVersions` matching its
// version), so syntax that version can't parse fails CI on every entry point,
// even ones no typetest imports. Users see these errors even with
// `skipLibCheck`.
//
// Usage: node scripts/check-dts-parse.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ts = createRequire(import.meta.url)('typescript');
const [major, minor] = ts.versionMajorMinor.split('.').map(Number);

function matches(range) {
  const [, rMajor, rMinor] = /^>=(\d+)\.(\d+)$/.exec(range) ?? [];
  if (rMajor === undefined)
    throw new Error(`Unsupported typesVersions range ${range}`);
  return major > +rMajor || (major === +rMajor && minor >= +rMinor);
}

// Declaration entry points this TypeScript resolves for a package's exports
function entryPoints(pkg) {
  const range = Object.keys(pkg.typesVersions ?? {}).find(matches);
  if (!range) return [pkg.types];
  return Object.entries(pkg.typesVersions[range])
    .filter(([subpath]) => subpath !== '*')
    .map(([, [entry]]) => entry);
}

const rootNames = [];
for (const name of fs.readdirSync(path.join(root, 'packages'))) {
  const pkgDir = path.join(root, 'packages', name);
  const pkgFile = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgFile)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  if (pkg.private) continue;
  for (const entry of entryPoints(pkg)) {
    const file = path.join(pkgDir, entry);
    if (!fs.existsSync(file)) {
      console.error(`${pkg.name}: ${entry} is not built`);
      process.exitCode = 1;
    }
    rootNames.push(file);
  }
}

// Only syntax is checked, so the files each entry point imports are loaded
// but nothing is type-checked.
const program = ts.createProgram(rootNames, {
  types: [],
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
});
const packagesDir = path.join(root, 'packages') + path.sep;
let files = 0;
for (const source of program.getSourceFiles()) {
  const file = path.resolve(source.fileName);
  if (
    !file.startsWith(packagesDir) ||
    file.includes(`${path.sep}node_modules${path.sep}`)
  )
    continue;
  files++;
  for (const diagnostic of program.getSyntacticDiagnostics(source)) {
    process.exitCode = 1;
    const { line, character } = source.getLineAndCharacterOfPosition(
      diagnostic.start,
    );
    console.error(
      `${path.relative(root, file)}(${line + 1},${character + 1}): error TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
    );
  }
}
console.log(`TypeScript ${ts.version}: parsed ${files} declaration files`);
