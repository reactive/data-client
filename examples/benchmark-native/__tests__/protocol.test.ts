/**
 * Shared GC protocol (examples/gc-shared) — the single implementation behind
 * the Node/browser/Android scenario lists, ids, filters, and the host CLI used
 * by run-matrix.sh / collect-report.sh.
 */
const { execFileSync, spawnSync } = require('child_process');
const path = require('path');

const {
  listScenarios,
  matchScenarioId,
  parseScenarioId,
  scenarioId,
} = require('../../gc-shared/protocol.js');

export {};

// Jest runs with cwd = this workspace (see run-matrix-filter.test.ts)
const CLI = path.resolve('../gc-shared/protocol-cli.js');

const ids = (platform: string, filter?: string): string[] =>
  listScenarios(platform, { filter }).map((s: { id: string }) => s.id);
const countOf = (id: string) => id.split('/')[3];

describe('scenario ids', () => {
  it('round-trips parseScenarioId', () => {
    for (const id of [
      'android/mixed/unique/10000/interaction/no-gc',
      'browser/entity/duplicate/1000/end-to-end/gc',
      'node/endpoint/unique/100000/reducer/gc',
    ]) {
      expect(scenarioId(parseScenarioId(id))).toBe(id);
    }
  });

  it('rejects malformed ids, wrong platform modes, and invalid axes', () => {
    expect(() => parseScenarioId('android/entity/unique/1000/gc')).toThrow();
    expect(() =>
      parseScenarioId('node/entity/unique/1000/interaction/gc'),
    ).toThrow(/mode/);
    expect(() =>
      parseScenarioId('android/endpoint/duplicate/1000/interaction/gc'),
    ).toThrow(/duplicate pattern only supports/);
    expect(() =>
      parseScenarioId('android/entity/unique/999/interaction/gc'),
    ).toThrow(/count/);
  });
});

describe('listScenarios', () => {
  it('lists android in device matrix order (kind → count → control, then duplicates)', () => {
    const all = ids('android');
    expect(all).toHaveLength(24);
    expect(all.slice(0, 7)).toEqual([
      'android/entity/unique/1000/interaction/gc',
      'android/entity/unique/1000/interaction/no-gc',
      'android/entity/unique/10000/interaction/gc',
      'android/entity/unique/10000/interaction/no-gc',
      'android/entity/unique/100000/interaction/gc',
      'android/entity/unique/100000/interaction/no-gc',
      'android/endpoint/unique/1000/interaction/gc',
    ]);
    expect(all.slice(-2)).toEqual([
      'android/entity/duplicate/100000/interaction/gc',
      'android/entity/duplicate/100000/interaction/no-gc',
    ]);
  });

  it('lists node/browser count-first with every mode', () => {
    expect(ids('node')).toHaveLength(72);
    expect(ids('browser')).toHaveLength(24);
    expect(ids('browser').slice(0, 8).map(countOf)).toEqual(
      Array(8).fill('1000'),
    );
  });

  it('lists duplicate only for entity', () => {
    const all = ids('android');
    expect(all.some(id => id.includes('/duplicate/'))).toBe(true);
    expect(all.some(id => id.startsWith('android/endpoint/duplicate'))).toBe(
      false,
    );
  });
});

describe('matchScenarioId (slash-bounded filter)', () => {
  it('matches segments so 1000 does not select 10000 or 100000', () => {
    const counts = (filter: string) => ids('android', filter).map(countOf);

    expect(counts('1000')).toEqual(expect.arrayContaining(['1000']));
    expect(counts('1000').every(count => count === '1000')).toBe(true);
    expect(counts('entity/unique/1000')).toEqual(['1000', '1000']);
    expect(counts('/100000/').length).toBeGreaterThan(0);
    expect(counts('/100000/').every(count => count === '100000')).toBe(true);
    expect(counts('100000/').every(count => count === '100000')).toBe(true);
    expect(counts('/100000').every(count => count === '100000')).toBe(true);
  });

  it('matches against the full stable id, including the mode segment', () => {
    const id = 'android/entity/unique/1000/interaction/gc';
    expect(matchScenarioId(id, 'unique/1000/interaction/gc')).toBe(true);
    expect(matchScenarioId(id, 'interaction/gc')).toBe(true);
    // kind/pattern/count/control is not contiguous in the stable id
    expect(matchScenarioId(id, 'entity/unique/1000/gc')).toBe(false);
  });

  it('supports ^prefix against the stable id', () => {
    expect(ids('android', '^android/mixed/')).toHaveLength(6);
    expect(ids('android', '^entity')).toHaveLength(0);
  });

  it('treats empty filters as match-all', () => {
    expect(ids('android', '')).toHaveLength(24);
    expect(ids('android', '/')).toHaveLength(24);
  });
});

describe('protocol-cli.js', () => {
  it('lists ids one per line', () => {
    const out = execFileSync('node', [CLI, 'list', 'android', '/10000/'], {
      encoding: 'utf8',
    });
    expect(out.trim().split('\n')).toEqual(ids('android', '/10000/'));
  });

  it('validates host config with env-var wording', () => {
    const run = (...args: string[]) =>
      spawnSync('node', [CLI, 'validate', ...args], { encoding: 'utf8' });

    expect(run('entity', 'duplicate', '100000', 'gc', '5').status).toBe(0);
    const cases: [string[], string][] = [
      [
        ['widget', 'unique', '1000', 'gc'],
        'error: invalid CANDIDATE_KIND=widget; expected entity|endpoint|mixed',
      ],
      [
        ['entity', 'twice', '1000', 'gc'],
        'error: invalid PATTERN=twice; expected unique|duplicate',
      ],
      [
        ['entity', 'unique', '1000', 'off'],
        'error: invalid CONTROL=off; expected gc|no-gc',
      ],
      [
        ['entity', 'unique', '01000', 'gc'],
        'error: invalid COUNT=01000; expected 1000|10000|100000',
      ],
      [
        ['endpoint', 'duplicate', '1000', 'gc'],
        'error: duplicate pattern only supports CANDIDATE_KIND=entity (got endpoint)',
      ],
      [
        ['entity', 'unique', '1000', 'gc', '51'],
        'error: invalid SAMPLES=51; expected integer 1..50',
      ],
    ];
    for (const [args, message] of cases) {
      const res = run(...args);
      expect(res.status).toBe(1);
      expect(res.stderr.trim()).toBe(message);
    }
  });
});
