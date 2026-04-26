import LocalCache from '../denormalize/localCache';
import type { EntityInterface } from '../interface';

// LocalCache is the uncached-path cache used by the plain `denormalize()`
// entry point. Unlike GlobalCache it does NOT:
//   - persist across denormalize calls
//   - track dependency paths for subscriptions
//   - bucket by argsKey (its argsKey is a pure passthrough)
// It exists only to (1) deduplicate intra-walk entity computations (so cycles
// terminate and a shared entity isn't rebuilt twice) and (2) provide an API-
// compatible `Cache` so schemas like Scalar can call `delegate.argsKey()`
// without special-casing the uncached path.
describe('LocalCache', () => {
  const Foo = { key: 'Foo' } as EntityInterface;
  const Bar = { key: 'Bar' } as EntityInterface;

  describe('getEntity', () => {
    it('computes once per pk within a single cache instance', () => {
      const cache = new LocalCache();
      const computeValue = jest.fn((m: Map<string, any>) =>
        m.set('1', { id: '1', built: true }),
      );

      const first = cache.getEntity('1', Foo, { id: '1' }, computeValue);
      const second = cache.getEntity('1', Foo, { id: '1' }, computeValue);

      expect(first).toEqual({ id: '1', built: true });
      expect(second).toBe(first);
      expect(computeValue).toHaveBeenCalledTimes(1);
    });

    it('computes independently for distinct pks of the same key', () => {
      const cache = new LocalCache();
      const compute1 = jest.fn((m: Map<string, any>) =>
        m.set('1', { id: '1' }),
      );
      const compute2 = jest.fn((m: Map<string, any>) =>
        m.set('2', { id: '2' }),
      );

      cache.getEntity('1', Foo, { id: '1' }, compute1);
      cache.getEntity('2', Foo, { id: '2' }, compute2);

      expect(compute1).toHaveBeenCalledTimes(1);
      expect(compute2).toHaveBeenCalledTimes(1);
    });

    it('partitions cache by schema key so same pk under distinct keys never collides', () => {
      // A real-world cycle can have Foo/1 and Bar/1 simultaneously in-flight.
      // They must resolve to distinct values.
      const cache = new LocalCache();
      const foo = cache.getEntity('1', Foo, { id: '1' }, m =>
        m.set('1', 'foo-1'),
      );
      const bar = cache.getEntity('1', Bar, { id: '1' }, m =>
        m.set('1', 'bar-1'),
      );

      expect(foo).toBe('foo-1');
      expect(bar).toBe('bar-1');
    });

    it('surfaces whatever value computeValue stores (including undefined-sentinels)', () => {
      // unvisit writes `undefined` into the map to mark "resolved to undefined"
      // (e.g. missing nested ref). The get() must still short-circuit compute
      // on the next call — but LocalCache uses `!localCacheKey.get(pk)` as its
      // has-check, so an `undefined` value intentionally causes recomputation.
      const cache = new LocalCache();
      const compute = jest.fn((m: Map<string, any>) => m.set('1', undefined));

      expect(cache.getEntity('1', Foo, { id: '1' }, compute)).toBeUndefined();
      expect(cache.getEntity('1', Foo, { id: '1' }, compute)).toBeUndefined();
      // This is the documented behavior: a stored `undefined` re-triggers
      // compute. Change detector — if this behavior changes, GlobalCache's
      // same-shaped check must be revisited too (see globalCache.getEntity).
      expect(compute).toHaveBeenCalledTimes(2);
    });
  });

  describe('getResults', () => {
    it('always calls computeValue — no cross-call caching', () => {
      const cache = new LocalCache();
      const compute = jest.fn(() => ({ v: 'result' }));

      const r1 = cache.getResults({}, true, compute);
      const r2 = cache.getResults({}, true, compute);

      expect(r1.data).toEqual({ v: 'result' });
      expect(r2.data).toEqual({ v: 'result' });
      expect(compute).toHaveBeenCalledTimes(2);
    });

    it('returns empty paths regardless of cachable flag (no subscription tracking)', () => {
      const cache = new LocalCache();
      expect(cache.getResults({}, false, () => 1).paths).toEqual([]);
      expect(cache.getResults({}, true, () => 1).paths).toEqual([]);
    });
  });

  describe('argsKey', () => {
    it('evaluates fn against the constructor-bound args', () => {
      const cache = new LocalCache([{ userId: 'u1' }]);
      expect(cache.argsKey(args => args[0]?.userId)).toBe('u1');
    });

    it('returns undefined when fn does (no coercion)', () => {
      const cache = new LocalCache([{}]);
      expect(cache.argsKey(args => args[0]?.userId)).toBeUndefined();
    });

    it('defaults to an empty args list when constructor args were omitted', () => {
      const cache = new LocalCache();
      expect(cache.argsKey(args => `len:${args.length}`)).toBe('len:0');
    });

    it('is a pure passthrough — does not affect entity caching', () => {
      // In GlobalCache, argsKey registers a dep and buckets results per
      // fn(args). LocalCache discards deps entirely, so calling argsKey must
      // not alter how getEntity memoizes (compute still runs once per pk).
      const cache = new LocalCache([{ userId: 'u1' }]);
      const fn = (args: readonly any[]) => args[0]?.userId;

      cache.argsKey(fn);
      cache.argsKey(fn);

      const compute = jest.fn((m: Map<string, any>) => m.set('1', 'ok'));
      cache.getEntity('1', Foo, { id: '1' }, compute);
      cache.getEntity('1', Foo, { id: '1' }, compute);
      expect(compute).toHaveBeenCalledTimes(1);
    });
  });
});
