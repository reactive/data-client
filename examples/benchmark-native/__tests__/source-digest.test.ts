/**
 * Release sourceDigest must follow Metro's react-native export (lib/),
 * not package src. The APK bundles that lib; src-only edits do not.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  bundleRootForPackage,
  collectInputFiles,
  hashInputFiles,
  sourceDigest,
} = require('../scripts/build-manifest.cjs');

export {};

// Jest cwd is this workspace (examples/benchmark-native).
const REPO = path.resolve('../..');

function rel(file: string): string {
  return path.relative(REPO, file).split(path.sep).join('/');
}

describe('android sourceDigest inputs', () => {
  it('hashes the Metro react-native lib, not package src or legacy', () => {
    for (const name of ['core', 'normalizr', 'endpoint']) {
      const pkg = require(`../../../packages/${name}/package.json`);
      expect(pkg.exports['.']['react-native']).toBe('./lib/index.js');
      expect(pkg['react-native']).toBe('legacy/index.js');
      expect(bundleRootForPackage(`packages/${name}`)).toBe(
        path.join(REPO, 'packages', name, 'lib'),
      );
    }

    const rels: string[] = collectInputFiles().map(rel);
    expect(rels).toEqual(
      expect.arrayContaining([
        'packages/core/lib/index.js',
        'packages/normalizr/lib/index.js',
        'packages/endpoint/lib/index.js',
        'examples/gc-shared/protocol.js',
      ]),
    );
    expect(
      rels.some((r: string) =>
        /^packages\/(core|normalizr|endpoint)\/(src|legacy)\//.test(r),
      ),
    ).toBe(false);
    expect(
      rels.some(
        (r: string) => r.startsWith('packages/core/lib/') && !r.endsWith('.js'),
      ),
    ).toBe(false);
    expect(sourceDigest()).toBe(hashInputFiles(collectInputFiles()));
  });

  it('changes when bundled lib bytes change', () => {
    const lib = collectInputFiles().find((file: string) =>
      rel(file).endsWith('packages/core/lib/index.js'),
    );
    expect(lib).toBeDefined();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-digest-'));
    const copy = path.join(dir, 'index.js');
    const bytes = fs.readFileSync(lib, 'utf8');
    fs.writeFileSync(copy, bytes);
    const before = hashInputFiles([copy]);
    fs.writeFileSync(copy, `${bytes}\n`);
    expect(hashInputFiles([copy])).not.toBe(before);
  });

  it('does not include package src, so a src-only file is outside the digest', () => {
    const src = path.join(REPO, 'packages/core/src/index.ts');
    expect(fs.existsSync(src)).toBe(true);
    expect(collectInputFiles().includes(path.resolve(src))).toBe(false);
  });
});
