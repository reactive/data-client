import { Temporal } from 'temporal-polyfill';

import { INVALID } from '../denormalize/symbol';
import { EntityPath } from '../interface';
import { MemoPolicy } from '../memo/Policy';
import WeakDependencyMap, {
  depKey,
  keep,
} from '../memo/WeakDependencyMap.native';

let gen = 0;
/** Pins the pair a `get` or `set` pushed to `out`, as a commit does. */
const pinOut = (out: unknown[], settled: boolean) =>
  keep(out[0], out[1], settled, ++gen);

/** Checks the retention rule: a node keeps its newest value, plus the value
 * a committed render last read and the one a committed render of a store
 * with no optimistic updates last read. Any other value goes once a newer one
 * is written. */
function expectEviction(
  wem: WeakDependencyMap<EntityPath>,
  setB: (entity: object, value: string) => void,
  get: (entity: object, out?: unknown[]) => unknown,
) {
  /** Pins the value `entity` reads, as a commit of its store would. */
  const commit = (entity: object, settled: boolean) => {
    const out: unknown[] = [];
    get(entity, out);
    pinOut(out, settled);
  };
  const [v0, v1, v2, v3, v4] = [[0], [1], [2], [3], [4]];
  setB(v0, 'v0');
  setB(v1, 'v1');
  // nothing committed: only the newest stays
  expect(get(v0)).toBeUndefined();
  expect(get(v1)).toBe('v1');
  commit(v1, true);
  // an optimistic update commits
  setB(v2, 'v2');
  commit(v2, false);
  // one-off values, such as each retry of a pending transition
  setB(v3, 'v3');
  setB(v4, 'v4');
  expect(get(v3)).toBeUndefined();
  expect(get(v4)).toBe('v4');
  expect(get(v2)).toBe('v2');
  expect(get(v1)).toBe('v1');
  // a settled commit moves both pins, so the older pinned values go
  commit(v4, true);
  setB(v0, 'v0 again');
  expect(get(v1)).toBeUndefined();
  expect(get(v2)).toBeUndefined();
  expect(get(v4)).toBe('v4');
}

describe('WeakDependencyMap', () => {
  const a = { hi: '5' };
  const b = [1, 2, 3];
  const c = Temporal.Instant.fromEpochMilliseconds(0);
  const state: Record<string, Record<string, object>> = {
    A: {
      '1': a,
    },
    B: {
      '2': b,
    },
    C: {
      '3': c,
    },
  };
  const getEntity = MemoPolicy.getEntities(state);
  const depA = { path: { key: 'A', pk: '1' }, entity: a };
  const depB = { path: { key: 'B', pk: '2' }, entity: b };
  const depC = { path: { key: 'C', pk: '3' }, entity: c };

  it('should construct', () => {
    const wem = new WeakDependencyMap<EntityPath>();
  });

  it('should set one item', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const deps = [depA];
    wem.set(deps, 'myvalue');

    expect(wem.get(a, getEntity)[0]).toBe('myvalue');

    expect(wem.get(b, getEntity)[0]).toBeUndefined();
    expect(wem.get(c, getEntity)[0]).toBeUndefined();
  });

  it('should set multiple on same path', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const attempts = [
      { key: [depA], value: 'first' },
      {
        key: [depA, depB],
        value: 'second',
      },
      {
        key: [depA, depB, depC],
        value: 'third',
      },
    ];

    for (const attempt of attempts) {
      wem.set(attempt.key, attempt.value);
    }
    expect(wem.get(a, getEntity)[0]).toBe('third');
  });

  it('should set multiple on distinct paths', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const attempts = [
      {
        key: [depA, depB],
        value: 'first',
      },
      {
        key: [depB, depA],
        value: 'second',
      },
      {
        key: [depC, depA],
        value: 'third',
      },
      {
        key: [depA, depB, depC],
        value: 'fourth',
      },
      { key: [depC], value: 'fifth' },
    ];

    for (const attempt of attempts) {
      wem.set(attempt.key, attempt.value);
    }
    expect(wem.get(a, getEntity)[0]).toBe('fourth');
    expect(wem.get(b, getEntity)[0]).toBe('second');
    expect(wem.get(c, getEntity)[0]).toBe('fifth');

    expect(wem.get({}, getEntity)[0]).toBeUndefined();
  });

  it('hits and misses on a long dependency list', () => {
    const items = Array.from({ length: 5000 }, (_, i) => ({ i }));
    const big = Object.fromEntries(items.map((v, i) => [`${i}`, v]));
    const deps = [
      depA,
      ...items.map((entity, i) => ({ path: { key: 'D', pk: `${i}` }, entity })),
    ];
    const wem = new WeakDependencyMap<EntityPath>();
    wem.set(deps, 'all');

    expect(wem.get(a, MemoPolicy.getEntities({ ...state, D: big }))[0]).toBe(
      'all',
    );
    const changed = { ...big, '4999': { i: 4999 } };
    expect(
      wem.get(a, MemoPolicy.getEntities({ ...state, D: changed }))[0],
    ).toBeUndefined();
  });

  it('keeps the newest value and the ones committed renders read', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    expectEviction(
      wem,
      (entity, value) => wem.set([depA, { ...depB, entity }], value),
      (entity, out) =>
        wem.get(
          a,
          MemoPolicy.getEntities({ ...state, B: { '2': entity } }),
          [],
          out,
        )[0],
    );
  });

  it('keeps a committed value while one-off values come and go', () => {
    // a pending transition: React re-reads the committed store between
    // retries that each build new entities
    const wem = new WeakDependencyMap<EntityPath>();
    const withB = (entity: object) =>
      MemoPolicy.getEntities({ ...state, B: { '2': entity } });
    const out: unknown[] = [];
    wem.set([depA, depB], 'committed', [], undefined, out);
    pinOut(out, true);
    for (let i = 0; i < 5; i++) {
      const retry = [i];
      expect(wem.get(a, withB(retry))[0]).toBeUndefined();
      wem.set([depA, { ...depB, entity: retry }], `retry ${i}`);
      expect(wem.get(a, withB(b))[0]).toBe('committed');
    }
  });

  describe('commit pins', () => {
    const withB = (entity: object) =>
      MemoPolicy.getEntities({ ...state, B: { '2': entity } });
    const setB = (
      wem: WeakDependencyMap<EntityPath>,
      entity: object,
      value: string,
      out?: unknown[],
    ) => wem.set([depA, { ...depB, entity }], value, [], undefined, out);
    /** Pins the entry `entity` reads, as a commit of its store would. */
    const commit = (
      wem: WeakDependencyMap<EntityPath>,
      entity: object,
      settled: boolean,
    ) => {
      const out: unknown[] = [];
      wem.get(a, withB(entity), [], out);
      pinOut(out, settled);
    };

    it('reports the node and entry a get hit or a set wrote', () => {
      const wem = new WeakDependencyMap<EntityPath>();
      const written: unknown[] = [];
      wem.set([depA, depB], 'value', [], undefined, written);
      expect(written).toHaveLength(2);
      const read: unknown[] = [];
      wem.get(a, getEntity, [], read);
      expect(read).toEqual(written);
      // a miss reports nothing
      const missed: unknown[] = [];
      wem.get({}, getEntity, [], missed);
      expect(missed).toHaveLength(0);
    });

    it('keeps a committed entry through any number of newer ones', () => {
      const wem = new WeakDependencyMap<EntityPath>();
      setB(wem, ['first'], 'first');
      const committed = ['committed'];
      setB(wem, committed, 'committed');
      commit(wem, committed, false);
      for (let i = 0; i < 5; i++) setB(wem, [i], `one-off ${i}`);
      expect(wem.get(a, withB(committed))[0]).toBe('committed');
    });

    it('keep pins the entry a set wrote', () => {
      const wem = new WeakDependencyMap<EntityPath>();
      setB(wem, ['first'], 'first');
      const committed = ['committed'];
      const out: unknown[] = [];
      setB(wem, committed, 'committed', out);
      pinOut(out, true);
      for (let i = 0; i < 5; i++) setB(wem, [i], `one-off ${i}`);
      expect(wem.get(a, withB(committed))[0]).toBe('committed');
    });

    it('puts back an entry evicted before its commit', () => {
      const wem = new WeakDependencyMap<EntityPath>();
      const out: unknown[] = [];
      const committed = ['committed'];
      setB(wem, ['first'], 'first');
      setB(wem, committed, 'committed', out);
      const oneOffs = [[0], [1], [2]];
      oneOffs.forEach((entity, i) => setB(wem, entity, `one-off ${i}`));
      expect(wem.get(a, withB(committed))[0]).toBeUndefined();
      pinOut(out, true);
      expect(wem.get(a, withB(committed))[0]).toBe('committed');
      // still at most three: the newest, committed and settled
      expect(wem.get(a, withB(oneOffs[2]))[0]).toBe('one-off 2');
      expect(wem.get(a, withB(oneOffs[1]))[0]).toBeUndefined();
    });

    it('pins the entries a value was computed from', () => {
      // a list pins its rows: a later read of a row gets the list's object
      const list = new WeakDependencyMap<EntityPath>();
      const row = new WeakDependencyMap<EntityPath>();
      const rowOut: unknown[] = [];
      const v1 = ['row v1'];
      setB(row, v1, 'row v1', rowOut);
      const listOut: unknown[] = [];
      list.set([depA, depB], 'list', [], undefined, listOut, rowOut);
      // one-off versions of the row push v1 out of its own node
      for (let i = 0; i < 3; i++) setB(row, [i], `row ${i}`);
      expect(row.get(a, withB(v1))[0]).toBeUndefined();
      pinOut(listOut, false);
      expect(row.get(a, withB(v1))[0]).toBe('row v1');
    });

    it('keeps the settled value while optimistic updates commit', () => {
      // every optimistic update in flight rebuilds the entities it touches,
      // so when the last settles, the store returns to the settled value
      const wem = new WeakDependencyMap<EntityPath>();
      const settled = ['settled'];
      setB(wem, settled, 'settled');
      commit(wem, settled, true);
      const optimistic = Array.from({ length: 5 }, (_, i) => [i]);
      optimistic.forEach((entity, i) => {
        setB(wem, entity, `optimistic ${i}`);
        commit(wem, entity, false);
      });
      expect(wem.get(a, withB(settled))[0]).toBe('settled');
      // older unsettled values go once newer ones are written
      expect(wem.get(a, withB(optimistic[2]))[0]).toBeUndefined();
      expect(wem.get(a, withB(optimistic[4]))[0]).toBe('optimistic 4');
    });
  });

  it.each<[string, any]>([
    ['null', null],
    ['INVALID', INVALID],
  ])('tracks a %s dependency after the root', (_, value) => {
    const wem = new WeakDependencyMap<EntityPath>();
    const withA = (entity: any) =>
      MemoPolicy.getEntities({ ...state, A: { '1': entity } });
    const depValue = { path: depA.path, entity: value };
    wem.set([depB, depValue], 'child');
    expect(wem.get(b, withA(value))[0]).toBe('child');
    expect(wem.get(b, withA(a))[0]).toBeUndefined();
    expect(wem.get(b, withA(undefined))[0]).toBeUndefined();
  });

  it('keys objects and functions by themselves, so they stay collectable', () => {
    // an Entity class is a function, and is the first dependency of buildQueryKey
    class Thing {}
    const obj = {};
    expect(depKey(Thing)).toBe(Thing);
    expect(depKey(obj)).toBe(obj);
    expect(depKey(null)).toBe(depKey(null));
    expect(depKey(null)).not.toBe(depKey(INVALID));
    expect(depKey(1)).toBe(depKey(1));
    expect(depKey(1)).not.toBe(depKey(2));
  });

  it('considers empty key list invalid', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    expect(() => wem.set([], 'whatever')).toThrowErrorMatchingInlineSnapshot(
      `"Keys must include at least one member"`,
    );

    expect(wem.get([], getEntity)[0]).toBeUndefined();
  });

  describe('argsKey (function-typed) deps', () => {
    // `argFn` is the stable fn reference that doubles as the path key.
    // `set()` keys a branch by the function itself, and its children by
    // `dep.path(args)`, derived on each call.
    const argFn = (args: readonly any[]) => args[0]?.userId;
    const depFn = { path: argFn, entity: undefined };

    it('hasStringDeps flips to true only after a function-typed set', () => {
      const wem = new WeakDependencyMap<EntityPath>();
      expect(wem.hasStringDeps).toBe(false);
      // entity-only writes never flip the flag
      wem.set([depA, depB], 'entity-only');
      expect(wem.hasStringDeps).toBe(false);
      wem.set([depA, depFn], 'with-args', [{ userId: 'bob' }]);
      expect(wem.hasStringDeps).toBe(true);
    });

    it('buckets values by the string returned from argsKey', () => {
      const wem = new WeakDependencyMap<EntityPath>();
      wem.set([depA, depFn], 'bob-value', [{ userId: 'bob' }]);
      wem.set([depA, depFn], 'alice-value', [{ userId: 'alice' }]);

      expect(wem.get(a, getEntity, [{ userId: 'bob' }])[0]).toBe('bob-value');
      expect(wem.get(a, getEntity, [{ userId: 'alice' }])[0]).toBe(
        'alice-value',
      );
      // args not previously seen are a miss
      expect(wem.get(a, getEntity, [{ userId: 'carol' }])[0]).toBeUndefined();
    });

    it('routes argsKey=undefined to a shared sentinel bucket', () => {
      const wem = new WeakDependencyMap<EntityPath>();
      // argFn returns undefined for both [] and [{}] (no userId field) — both
      // must land in the same UNDEF_KEY bucket so a lookup-time miss doesn't
      // mask a legitimately cached `undefined`-argsKey value.
      wem.set([depA, depFn], 'no-user', []);

      expect(wem.get(a, getEntity, [])[0]).toBe('no-user');
      expect(wem.get(a, getEntity, [{}])[0]).toBe('no-user');
      expect(wem.get(a, getEntity, [{ other: 'x' }])[0]).toBe('no-user');
      // explicit userId goes to a different bucket → miss
      expect(wem.get(a, getEntity, [{ userId: 'bob' }])[0]).toBeUndefined();
    });

    it('walks mixed entity + function + entity chains on get', () => {
      // `find()` must follow the argsKey branch, then match the entity
      // deps on either side of it in one cached entry.
      const wem = new WeakDependencyMap<EntityPath>();
      wem.set([depA, depFn, depB], 'mixed', [{ userId: 'bob' }]);

      expect(wem.get(a, getEntity, [{ userId: 'bob' }])[0]).toBe('mixed');
      // different argsKey output hits the function branch and misses
      expect(wem.get(a, getEntity, [{ userId: 'alice' }])[0]).toBeUndefined();

      // removing entity `b` from the store makes the tail entity lookup
      // resolve to the undefined stand-in in mixed mode, which doesn't match
      // the originally-recorded reference → miss
      const getEntityMissingB = MemoPolicy.getEntities({ A: { '1': a } });
      expect(
        wem.get(a, getEntityMissingB, [{ userId: 'bob' }])[0],
      ).toBeUndefined();
    });

    it('records journey with function refs for later subscription filtering', () => {
      // getResults() strips function-typed paths when returning subscription
      // paths; this test guarantees the function reference is preserved in
      // the journey so the caller can still detect and filter it.
      const wem = new WeakDependencyMap<EntityPath>();
      wem.set([depA, depFn], 'value', [{ userId: 'bob' }]);
      const [value, journey] = wem.get(a, getEntity, [{ userId: 'bob' }]);
      expect(value).toBe('value');
      expect(journey).toEqual([depA.path, argFn]);
    });

    it('overwrites the same (entity, argsKey) cell on re-set', () => {
      // argsKey bucketing is keyed by fn(args), so repeating the same deps
      // and args must land on the same node — not leak a stale value.
      const wem = new WeakDependencyMap<EntityPath>();
      wem.set([depA, depFn], 'first', [{ userId: 'bob' }]);
      wem.set([depA, depFn], 'second', [{ userId: 'bob' }]);
      expect(wem.get(a, getEntity, [{ userId: 'bob' }])[0]).toBe('second');
    });
  });
});

describe('WeakDependencyMap eviction', () => {
  const root = { root: true };
  const rootDep = { path: { key: 'A', pk: '1' }, entity: root };
  const dep = (entity: object) => ({ path: { key: 'B', pk: '1' }, entity });
  const withB = (entity: object) =>
    MemoPolicy.getEntities({ A: { '1': root }, B: { '1': entity } });

  /** Writes a value its store's commit pins, as `MemoCache` does for a read
   * of the latest committed store. */
  const setCommitted = (
    wem: WeakDependencyMap<EntityPath>,
    entity: object,
    value: string,
  ) => {
    const out: unknown[] = [];
    wem.set([rootDep, dep(entity)], value, [], undefined, out);
    pinOut(out, true);
  };

  it('keeps the committed version after the store moves on to a new one (two epochs)', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const S0 = { v: 'S0' };
    setCommitted(wem, S0, 'S0');
    // epoch 1: pending transition; retries build fresh entities, urgent
    // renders re-read S0
    for (let i = 0; i < 2; i++) {
      const x = { v: `x${i}` };
      expect(wem.get(root, withB(x))[0]).toBeUndefined();
      wem.set([rootDep, dep(x)], `x${i}`);
      expect(wem.get(root, withB(S0))[0]).toBe('S0');
    }
    // the transition commits: its final render's entities ARE the new store
    const S1 = { v: 'S1' };
    setCommitted(wem, S1, 'S1');
    expect(wem.get(root, withB(S1))[0]).toBe('S1');
    // epoch 2: another pending transition builds a fresh entity...
    wem.set([rootDep, dep({ v: 'y0' })], 'y0');
    // ...and an urgent render re-reads the committed store
    expect(wem.get(root, withB(S1))[0]).toBe('S1');
    // S0 is no longer pinned
    expect(wem.get(root, withB(S0))[0]).toBeUndefined();
  });

  it('a committed version first read after two one-offs is retained', () => {
    // e.g. a list whose first render is inside a pending transition that
    // suspended once (render, ping, render) before any urgent render
    const wem = new WeakDependencyMap<EntityPath>();
    const S = { v: 'S' };
    wem.set([rootDep, dep({ v: 'x0' })], 'x0');
    wem.set([rootDep, dep({ v: 'x1' })], 'x1');
    setCommitted(wem, S, 'S');
    wem.set([rootDep, dep({ v: 'x2' })], 'x2');
    expect(wem.get(root, withB(S))[0]).toBe('S');
  });

  describe('argsKey branches', () => {
    // a missing entity skips its nested argsKey, so which fn comes first can
    // change between store snapshots of the same schema and args
    const portfolio = (args: readonly any[]) => args[0]?.portfolio;
    const currency = (args: readonly any[]) => args[0]?.currency;
    const region = (args: readonly any[]) => args[0]?.region;
    const args = [{ portfolio: 'P', currency: 'USD', region: 'EU' }];
    const c = (entity: object | undefined) => ({
      path: { key: 'C', pk: '2' },
      entity,
    });
    const fn = (path: (args: readonly any[]) => string | undefined) => ({
      path,
      entity: undefined,
    });
    const withC = (entity: object | undefined) =>
      MemoPolicy.getEntities({ A: { '1': root }, C: { '2': entity as any } });
    const loaded = { c: 1 };
    const changed = { c: 2 };
    function setup() {
      const wem = new WeakDependencyMap<EntityPath>();
      wem.set([rootDep, c(undefined)], 'plain', args);
      wem.set([rootDep, c(undefined), fn(currency)], 'C missing', args);
      wem.set(
        [rootDep, c(loaded), fn(portfolio), fn(currency)],
        'C loaded',
        args,
      );
      // a second branch below the root: the lookup has to come back to it
      wem.set([rootDep, c(changed), fn(portfolio), fn(region)], 'region', args);
      return wem;
    }

    it('finds the entry for each snapshot as they alternate', () => {
      const wem = setup();
      for (let i = 0; i < 2; i++) {
        // the first branch's child doesn't match, so the other branch is tried
        expect(wem.get(root, withC(loaded), args)[0]).toBe('C loaded');
        // root entries are checked before any branch
        expect(wem.get(root, withC(undefined), args)[0]).toBe('plain');
        // two branches deep: currency's child misses, then region's is tried
        expect(wem.get(root, withC(changed), args)[0]).toBe('region');
      }
    });

    it('never returns an entry whose own argsKey results differ', () => {
      const wem = setup();
      expect(
        wem.get(root, withC(loaded), [{ ...args[0], currency: 'EUR' }])[0],
      ).toBeUndefined();
      expect(
        wem.get(root, withC(changed), [{ ...args[0], region: 'US' }])[0],
      ).toBeUndefined();
      expect(wem.get(root, withC({ c: 3 }), args)[0]).toBeUndefined();
    });

    it('keeps rows under the same fn apart by args', () => {
      // a Scalar lens: every row records the same argsKey fn
      const wem = new WeakDependencyMap<EntityPath>();
      const row2 = (entity: object) => ({
        path: { key: 'D', pk: '2' },
        entity,
      });
      const withRows = (c2: object, d2: object) =>
        MemoPolicy.getEntities({
          A: { '1': root },
          C: { '2': c2 },
          D: { '2': d2 },
        });
      const r1 = { r: 1 };
      const r2 = { r: 2 };
      for (const p of ['A', 'B']) {
        wem.set([rootDep, fn(portfolio), c(r1), fn(portfolio), row2(r2)], p, [
          { portfolio: p },
        ]);
      }
      for (let i = 0; i < 2; i++) {
        for (const p of ['A', 'B']) {
          expect(wem.get(root, withRows(r1, r2), [{ portfolio: p }])[0]).toBe(
            p,
          );
        }
      }
      expect(
        wem.get(root, withRows(r1, { r: 3 }), [{ portfolio: 'A' }])[0],
      ).toBeUndefined();
    });

    it('treats a selector that throws on unreached args as a miss', () => {
      // the Scalar inside C reads args[0].portfolio; with C missing, traversal
      // never calls it, so a lookup must not fail on it either
      const wem = new WeakDependencyMap<EntityPath>();
      const strict = (a: readonly any[]) => a[0].portfolio;
      wem.set([rootDep, c(loaded), fn(strict)], 'with C', [{ portfolio: 'P' }]);
      expect(() => wem.get(root, withC(undefined), [])).not.toThrow();
      expect(wem.get(root, withC(undefined), [])[0]).toBeUndefined();
      expect(wem.get(root, withC(loaded), [{ portfolio: 'P' }])[0]).toBe(
        'with C',
      );
    });

    it('bounds the routes a lookup searches', () => {
      // each entry reaches a different argsKey first, as missing entities
      // can make happen; lookups must not slow down as routes pile up
      const wem = new WeakDependencyMap<EntityPath>();
      let calls = 0;
      const fns = Array.from({ length: 40 }, (_, i) => (a: readonly any[]) => {
        calls++;
        return `${i}${a[0]?.x}`;
      });
      const getEntity = MemoPolicy.getEntities({ A: { '1': root } });
      fns.forEach((path, i) =>
        wem.set([rootDep, fn(path)], `v${i}`, [{ x: 1 }]),
      );
      calls = 0;
      // every route is valid for these args, so any of the kept ones may hit
      expect(wem.get(root, getEntity, [{ x: 1 }])[0]).toBeDefined();
      expect(calls).toBeLessThanOrEqual(10);
      // a long chain of one argsKey after another is not a fork
      wem.set([rootDep, ...fns.map(fn)], 'chain', [{ x: 1 }]);
      expect(wem.get(root, getEntity, [{ x: 2 }])[0]).toBeUndefined();
    });

    it('evicts inside an argsKey child as at the root', () => {
      const wem = new WeakDependencyMap<EntityPath>();
      const one = [{ portfolio: 'P' }];
      expectEviction(
        wem,
        (entity, value) =>
          wem.set([rootDep, fn(portfolio), dep(entity)], value, one),
        (entity, out) => wem.get(root, withB(entity), one, out)[0],
      );
    });
  });

  it('looks up values behind many nested argsKey deps', () => {
    // a list whose rows each record an argsKey nests one node per row
    const wem = new WeakDependencyMap<EntityPath>();
    const fns = Array.from({ length: 20000 }, (_, i) => () => `${i}`);
    const getEntity = MemoPolicy.getEntities({ A: { '1': root } });
    wem.set(
      [rootDep, ...fns.map(path => ({ path, entity: undefined }))],
      'deep',
    );
    expect(wem.get(root, getEntity)[0]).toBe('deep');
  });

  it('a shorter dependency list at the same root is served when the longer one mismatches', () => {
    // each entry is checked against its own dependencies, so the older
    // (committed) one still serves reads that never touch C
    const wem = new WeakDependencyMap<EntityPath>();
    const b = { b: 1 };
    const c = { c: 1 };
    const depC = (entity: object | undefined) => ({
      path: { key: 'C', pk: '1' },
      entity,
    });
    setCommitted(wem, b, 'short');
    wem.set([rootDep, dep(b), depC(c)], 'long');
    const both = MemoPolicy.getEntities({
      A: { '1': root },
      B: { '1': b },
      C: { '1': c },
    });
    const noC = MemoPolicy.getEntities({ A: { '1': root }, B: { '1': b } });
    expect(wem.get(root, both)[0]).toBe('long');
    expect(wem.get(root, noC)[0]).toBe('short');
  });
});
