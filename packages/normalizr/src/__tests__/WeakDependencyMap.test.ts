import { Temporal } from 'temporal-polyfill';

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
