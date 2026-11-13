import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../..');
const STREAM = path.join(SRC, 'server', 'stream');
const SERVER = path.join(SRC, 'server');

const SPECIFIER =
  /(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveFile(base: string, native: boolean): string | undefined {
  const stem = base.replace(/\.(js|jsx|ts|tsx)$/, '');
  const exts =
    native ?
      ['.native.tsx', '.native.ts', '.native.js', '.tsx', '.ts', '.js']
    : ['.tsx', '.ts', '.js'];
  for (const ext of exts) {
    if (fs.existsSync(stem + ext)) return stem + ext;
  }
  if (fs.existsSync(base) && fs.statSync(base).isDirectory())
    return resolveFile(path.join(base, 'index'), native);
  return undefined;
}

/** Every module in this package reached from `entry` through relative imports */
function walk(entry: string, native: boolean): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(SPECIFIER)) {
      const spec = match[1] ?? match[2] ?? match[3] ?? match[4];
      if (!spec?.startsWith('.')) continue;
      const resolved = resolveFile(
        path.resolve(path.dirname(file), spec),
        native,
      );
      if (resolved) queue.push(resolved);
    }
  }
  return seen;
}

const under = (dir: string) => (file: string) =>
  file.startsWith(dir + path.sep);

describe('package entry import graph', () => {
  const index = path.join(SRC, 'index.ts');

  it('B4/main-entry-guard: the main entry reaches no stream module', () => {
    const reached = walk(index, false);
    // the walker sees the boundary seam, so it would see a stream import too
    expect(reached).toContain(
      path.join(SRC, 'components', 'AsyncBoundary.tsx'),
    );
    expect([...reached].filter(under(STREAM))).toEqual([]);
    expect(reached).toContain(
      path.join(SRC, 'components', 'BoundaryContext.ts'),
    );
  });

  it('N2/no-stream-code: React Native reaches nothing under server/ and no BoundaryContext', () => {
    const reached = walk(index, true);
    const twin = path.join(SRC, 'components', 'AsyncBoundary.native.tsx');
    expect(reached).toContain(twin);
    expect(reached).not.toContain(
      path.join(SRC, 'components', 'AsyncBoundary.tsx'),
    );
    expect([...reached].filter(under(SERVER))).toEqual([]);
    expect(reached).not.toContain(
      path.join(SRC, 'components', 'BoundaryContext.ts'),
    );
    expect(fs.readFileSync(twin, 'utf8')).not.toMatch(/BoundaryContext/);
  });
});
