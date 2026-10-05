/**
 * Pulled-report acceptance: buildId plus scenario axes and sample count.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  assertCollectedReport,
} = require('../scripts/accept-collected-report.cjs');

export {};

function report(overrides: Record<string, unknown> = {}) {
  return {
    build: { buildId: 'abc' },
    scenarios: [
      {
        candidateKind: 'entity',
        pattern: 'unique',
        count: 1000,
        control: 'gc',
        samples: [{ schemaVersion: 1 }, { schemaVersion: 1 }],
        ...overrides,
      },
    ],
  };
}

const expected = {
  buildId: 'abc',
  candidateKind: 'entity',
  pattern: 'unique',
  count: 1000,
  control: 'gc',
  samples: 2,
};

describe('assertCollectedReport', () => {
  it('accepts a report that matches the request', () => {
    expect(() => assertCollectedReport(report(), expected)).not.toThrow();
  });

  it('rejects a different kind, pattern, count, control, or sample count', () => {
    expect(() =>
      assertCollectedReport(report({ candidateKind: 'endpoint' }), expected),
    ).toThrow(/kind endpoint != entity/);
    expect(() =>
      assertCollectedReport(report({ pattern: 'duplicate' }), expected),
    ).toThrow(/pattern duplicate != unique/);
    expect(() =>
      assertCollectedReport(report({ count: 100000 }), expected),
    ).toThrow(/count 100000 != 1000/);
    expect(() =>
      assertCollectedReport(report({ control: 'no-gc' }), expected),
    ).toThrow(/control no-gc != gc/);
    const short = report();
    short.scenarios[0].samples = [{ schemaVersion: 1 }];
    expect(() => assertCollectedReport(short, expected)).toThrow(
      /samples 1 != 2/,
    );
  });

  it('rejects a buildId mismatch before trusting the axes', () => {
    const forged = report();
    forged.build.buildId = 'other';
    expect(() => assertCollectedReport(forged, expected)).toThrow(/buildId/);
  });

  it('does not rewrite the report file when the axes do not match', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-accept-'));
    const out = path.join(dir, 'gc-report.json');
    const sidecar = path.join(dir, 'sidecar.json');
    const body = report({ candidateKind: 'mixed' });
    fs.writeFileSync(out, JSON.stringify(body));
    fs.writeFileSync(
      sidecar,
      JSON.stringify({
        buildId: 'abc',
        sourceDigest: 'd',
        apkSha256: 'a',
        apkPath: '/apk',
        sidecarId: 's',
        apkSizeBytes: 1,
      }),
    );
    const before = fs.readFileSync(out);
    const { spawnSync } = require('child_process');
    const result = spawnSync(
      'node',
      [
        path.join('scripts', 'accept-collected-report.cjs'),
        out,
        sidecar,
        'installed',
        'entity',
        'unique',
        '1000',
        'gc',
        '2',
      ],
      { encoding: 'utf8' },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/does not match request/);
    expect(fs.readFileSync(out).equals(before)).toBe(true);
  });
});
