/**
 * Release sourceDigest must hash the files Metro puts in the Android bundle.
 * Package exports are matched in the package's own key order, so `import`
 * (node.mjs → dist) wins before the `react-native` field (lib/).
 */
const fs = require('fs');
const { resolve } = require('metro-resolver');
const os = require('os');
const path = require('path');

const {
  collectInputFiles,
  hashInputFiles,
  metroBundledPackageFiles,
  resolveMetroFile,
  sourceDigest,
} = require('../scripts/build-manifest.cjs');

export {};

// Jest cwd is this workspace (examples/benchmark-native).
const REPO = path.resolve('../..');
const ORIGIN = path.resolve('src/gcHarness.ts');

function rel(file: string): string {
  return path.relative(REPO, file).split(path.sep).join('/');
}

describe('android sourceDigest inputs', () => {
  it('hashes the files Metro resolves, not the react-native lib field', () => {
    const esmEntry = resolveMetroFile(ORIGIN, '@data-client/core', true);
    const cjsEntry = resolveMetroFile(ORIGIN, '@data-client/core', false);
    expect(rel(esmEntry)).toBe('packages/core/node.mjs');
    expect(rel(cjsEntry)).toBe('packages/core/dist/index.js');

    const bundled = metroBundledPackageFiles().map(rel);
    expect(bundled).toEqual([
      'packages/core/dist/index.js',
      'packages/core/node.mjs',
      'packages/normalizr/dist/normalizr.js',
    ]);

    const rels: string[] = collectInputFiles().map(rel);
    for (const file of bundled) {
      expect(rels).toContain(file);
    }
    expect(rels.some((r: string) => r.startsWith('packages/core/lib/'))).toBe(
      false,
    );
    expect(rels.some((r: string) => r.startsWith('packages/core/src/'))).toBe(
      false,
    );
    expect(
      rels.some((r: string) => r.startsWith('packages/normalizr/lib/')),
    ).toBe(false);
    expect(rels.some((r: string) => r.startsWith('packages/endpoint/'))).toBe(
      false,
    );
    expect(rels).toContain('examples/gc-shared/protocol.js');
    expect(sourceDigest()).toBe(hashInputFiles(collectInputFiles()));
  });

  it('asks metro-resolver for the release entry and uses that path', () => {
    const config = require('../metro.config.js');
    const resolver = config.resolver;
    const origin = ORIGIN;
    function lookup(filePath: string) {
      try {
        const stat = fs.lstatSync(filePath);
        return {
          exists: true,
          type: stat.isDirectory() ? 'd' : 'f',
          realPath: fs.realpathSync(filePath),
        };
      } catch {
        return { exists: false };
      }
    }
    function getPackageForModule(abs: string) {
      let dir = abs;
      try {
        if (!fs.statSync(abs).isDirectory()) dir = path.dirname(abs);
      } catch {
        dir = path.dirname(abs);
      }
      while (true) {
        const pkgPath = path.join(dir, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const relative = path.relative(dir, abs);
          return {
            rootPath: dir,
            packageJson: JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
            packageRelativePath: relative === '' ? '' : relative,
          };
        }
        const parent = path.dirname(dir);
        if (parent === dir) return null;
        dir = parent;
      }
    }
    const resolved = resolve(
      {
        allowHaste: false,
        assetExts: new Set(resolver.assetExts),
        dev: false,
        disableHierarchicalLookup: !!resolver.disableHierarchicalLookup,
        doesFileExist: (filePath: string) => {
          try {
            return fs.statSync(filePath).isFile();
          } catch {
            return false;
          }
        },
        extraNodeModules: resolver.extraNodeModules || {},
        fileSystemLookup: lookup,
        getPackage: (pkgPath: string) =>
          JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
        getPackageForModule,
        isESMImport: true,
        mainFields: resolver.resolverMainFields,
        nodeModulesPaths: resolver.nodeModulesPaths,
        originModulePath: origin,
        preferNativePlatform: true,
        resolveAsset: () => null,
        resolveRequest: resolver.resolveRequest || null,
        sourceExts: resolver.sourceExts,
        unstable_conditionNames: resolver.unstable_conditionNames,
        unstable_conditionsByPlatform: resolver.unstable_conditionsByPlatform,
        unstable_enablePackageExports: resolver.unstable_enablePackageExports,
        unstable_logWarning: () => {},
      },
      '@data-client/core',
      'android',
    );
    expect(rel(resolved.filePath)).toBe('packages/core/node.mjs');
    expect(metroBundledPackageFiles().map(rel)).toContain(
      'packages/core/node.mjs',
    );
    expect(rel(resolved.filePath)).not.toContain('/lib/');
  });

  it('changes when a bundled dist file changes and ignores package src', () => {
    const dist = collectInputFiles().find((file: string) =>
      rel(file).endsWith('packages/core/dist/index.js'),
    );
    expect(dist).toBeDefined();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-digest-'));
    const copy = path.join(dir, 'index.js');
    const bytes = fs.readFileSync(dist, 'utf8');
    fs.writeFileSync(copy, bytes);
    const before = hashInputFiles([copy]);
    fs.writeFileSync(copy, `${bytes}\n`);
    expect(hashInputFiles([copy])).not.toBe(before);

    const src = path.join(REPO, 'packages/core/src/index.ts');
    expect(fs.existsSync(src)).toBe(true);
    expect(collectInputFiles().includes(path.resolve(src))).toBe(false);
  });
});
