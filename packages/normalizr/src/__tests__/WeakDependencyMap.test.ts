import { Temporal } from 'temporal-polyfill';

import { INVALID } from '../denormalize/symbol';
import { EntityPath } from '../interface';
import { MemoPolicy } from '../memo/Policy';
import WeakDependencyMap from '../memo/WeakDependencyMap';

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

  it('keeps three entries, never evicting the one the store flipped back to', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const [b2, b3, b4, b5] = [[2], [3], [4], [5]];
    const withB = (entity: object) =>
      MemoPolicy.getEntities({ ...state, B: { '2': entity } });
    const setB = (entity: object, value: string) =>
      wem.set([depA, { ...depB, entity }], value);
    setB(b, 'b');
    setB(b2, 'b2');
    setB(b3, 'b3');
    // full: the least recently used goes, except the first entry, kept until a flip
    setB(b4, 'b4');
    expect(wem.get(a, withB(b2))[0]).toBeUndefined();
    expect(wem.get(a, withB(b))[0]).toBe('b');

    // reading b3 back after newer entries makes it the kept one instead;
    // most recently used now: b3, b, b4
    expect(wem.get(a, withB(b3))[0]).toBe('b3');
    setB(b5, 'b5');
    expect(wem.get(a, withB(b4))[0]).toBeUndefined();
    setB(b4, 'b4 again');
    // most recently used: b4, b5, b3 (kept), b; b goes
    expect(wem.get(a, withB(b))[0]).toBeUndefined();
    expect(wem.get(a, withB(b3))[0]).toBe('b3');
  });

  it('keeps a re-read value while one-off values come and go', () => {
    // a pending transition: React re-reads the committed store between
    // retries that each build new entities
    const wem = new WeakDependencyMap<EntityPath>();
    const withB = (entity: object) =>
      MemoPolicy.getEntities({ ...state, B: { '2': entity } });
    wem.set([depA, depB], 'committed');
    for (let i = 0; i < 5; i++) {
      const retry = [i];
      expect(wem.get(a, withB(retry))[0]).toBeUndefined();
      wem.set([depA, { ...depB, entity: retry }], `retry ${i}`);
      expect(wem.get(a, withB(b))[0]).toBe('committed');
    }
  });

  it.each([
    ['null', null],
    ['INVALID', INVALID],
  ])('tracks a %s dependency, as root or after it', (_, value) => {
    const wem = new WeakDependencyMap<EntityPath>();
    const withA = (entity: unknown) =>
      MemoPolicy.getEntities({ ...state, A: { '1': entity as any } });
    const depNull = { path: depA.path, entity: value as any };
    wem.set([depNull], 'root');
    wem.set([depB, depNull], 'child');
    expect(wem.get(value as any, withA(value))[0]).toBe('root');
    expect(wem.get(b, withA(value))[0]).toBe('child');
    expect(wem.get(b, withA(a))[0]).toBeUndefined();
    expect(wem.get(b, withA(undefined))[0]).toBeUndefined();
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
    // `set()` stores `curLink.nextPath = dep.path` (the function itself),
    // and bucket keys are derived each call from `dep.path(args)`.
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
      // Exercises _getMixed: the slow path must correctly interleave
      // function-keyed lookups (nextStr.get) with entity-keyed lookups
      // (next.get) while traversing one cached chain.
      const wem = new WeakDependencyMap<EntityPath>();
      wem.set([depA, depFn, depB], 'mixed', [{ userId: 'bob' }]);

      expect(wem.get(a, getEntity, [{ userId: 'bob' }])[0]).toBe('mixed');
      // different argsKey output hits the function branch and misses
      expect(wem.get(a, getEntity, [{ userId: 'alice' }])[0]).toBeUndefined();

      // removing entity `b` from the store makes the tail entity lookup
      // resolve to the UNDEF sentinel in mixed mode, which doesn't match
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
      // and args must land in the exact same Link — not leak a stale value.
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

  it('keeps the committed version after the store moves on to a new one (two epochs)', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const S0 = { v: 'S0' };
    wem.set([rootDep, dep(S0)], 'S0');
    // epoch 1: pending transition; retries build fresh entities, urgent
    // renders re-read S0. This is the pattern the existing tests cover.
    for (let i = 0; i < 2; i++) {
      const x = { v: `x${i}` };
      expect(wem.get(root, withB(x))[0]).toBeUndefined();
      wem.set([rootDep, dep(x)], `x${i}`);
      expect(wem.get(root, withB(S0))[0]).toBe('S0');
    }
    // the transition commits: its final render's entities ARE the new store
    const S1 = { v: 'S1' };
    wem.set([rootDep, dep(S1)], 'S1');
    expect(wem.get(root, withB(S1))[0]).toBe('S1');
    // epoch 2: another pending transition builds a fresh entity...
    wem.set([rootDep, dep({ v: 'y0' })], 'y0');
    // ...and an urgent render re-reads the committed store. S1 is alive and
    // was read moments ago; the old chain would hit. S0 is dead but pinned.
    expect(wem.get(root, withB(S1))[0]).toBe('S1');
  });

  it('a stale entry does not crowd out a version that keeps being read', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const dead = { v: 'dead' };
    const S = { v: 'S' };
    wem.set([rootDep, dep(dead)], 'dead');
    wem.set([rootDep, dep(S)], 'S');
    // alternate one-offs with re-reads of S many times; S should earn its keep
    let misses = 0;
    for (let i = 0; i < 10; i++) {
      wem.set([rootDep, dep({ v: `x${i}` })], `x${i}`);
      if (wem.get(root, withB(S))[0] === undefined) {
        misses++;
        wem.set([rootDep, dep(S)], 'S');
      }
    }
    expect(misses).toBe(0);
  });

  it('a stable version first read after two one-offs is retained', () => {
    // e.g. a list whose first render is inside a pending transition that
    // suspended once (render, ping, render) before any urgent render
    const wem = new WeakDependencyMap<EntityPath>();
    const S = { v: 'S' };
    wem.set([rootDep, dep({ v: 'x0' })], 'x0');
    wem.set([rootDep, dep({ v: 'x1' })], 'x1');
    wem.set([rootDep, dep(S)], 'S');
    wem.set([rootDep, dep({ v: 'x2' })], 'x2');
    expect(wem.get(root, withB(S))[0]).toBe('S');
  });

  it('a different argsKey fn at the same position makes the other entry unreachable (false miss, not wrong data)', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const fnA = (args: readonly any[]) => args[0]?.userId;
    const fnB = (args: readonly any[]) => args[0]?.team;
    wem.set([rootDep, { path: fnA, entity: undefined }], 'A', [
      { userId: 'bob' },
    ]);
    wem.set([rootDep, { path: fnB, entity: undefined }], 'B', [{ team: 'x' }]);
    const getEntity = MemoPolicy.getEntities({ A: { '1': root } });
    // B is reachable; A only if fnB(args) happens to equal fnA(args)
    expect(wem.get(root, getEntity, [{ team: 'x' }])[0]).toBe('B');
    expect(wem.get(root, getEntity, [{ userId: 'bob' }])[0]).toBeUndefined();
    // never the wrong value: an entry is validated against its own fn
    expect(
      wem.get(root, getEntity, [{ userId: 'bob', team: 'y' }])[0],
    ).toBeUndefined();
  });

  it('a shorter dependency list at the same root is served when the longer one mismatches', () => {
    // each entry is checked against its own dependencies, so the older one
    // still serves reads that never touch C
    const wem = new WeakDependencyMap<EntityPath>();
    const b = { b: 1 };
    const c = { c: 1 };
    const depC = (entity: object | undefined) => ({
      path: { key: 'C', pk: '1' },
      entity,
    });
    wem.set([rootDep, dep(b)], 'short');
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
