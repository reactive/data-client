/**
 * Host matrix filter must match slash-bounded segments. A raw substring
 * would treat 1000 as part of 10000 and 100000, and a non-empty filter
 * disables the 100k skip.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

export {};

function dryRun(filter: string): string[] {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-matrix-'));
  const stdout = execFileSync(
    'bash',
    [
      '-c',
      'DRY_RUN=1 OUT_DIR="$1" bash scripts/run-matrix.sh "$2"',
      'bash',
      outDir,
      filter,
    ],
    { cwd: '.', encoding: 'utf8' },
  );
  return stdout
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => /^(entity|endpoint|mixed)\//.test(line));
}

describe('run-matrix.sh filter', () => {
  it('does not select 10000 or 100000 for a 1000 filter', () => {
    for (const filter of ['1000', 'entity/unique/1000']) {
      const specs = dryRun(filter);
      expect(specs.length).toBeGreaterThan(0);
      expect(specs.every((spec: string) => spec.split('/')[2] === '1000')).toBe(
        true,
      );
    }
  });

  it('runs /100000/ without FULL=1 and selects only 100k rows', () => {
    const specs = dryRun('/100000/');
    expect(specs.length).toBeGreaterThan(0);
    expect(specs.every((spec: string) => spec.split('/')[2] === '100000')).toBe(
      true,
    );
  });
});
