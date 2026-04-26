import type { EntityInterface } from '../interface';
import { getEntityCaches } from '../memo/entitiesCache';
import GlobalCache from '../memo/globalCache';
import { MemoPolicy } from '../memo/Policy';
import type { DenormGetEntity, EndpointsCache } from '../memo/types';
import WeakDependencyMap from '../memo/WeakDependencyMap';

// GlobalCache is MemoCache's per-denormalize frame. It coordinates three
// caches:
//   - localCache: dedupes entity walks within one denormalize call (cycles)
//   - _getCache: per-entity WeakDependencyMap recording chains of deps
//   - _resultCache: top-level endpoint cache keyed by input object
// These unit tests assert the contracts individual callers rely on: args
// defaulting, argsKey bucketing, paths()/subscription filtering, and
// result-cache hit/miss behavior.
describe('GlobalCache', () => {
  const Foo = { key: 'Foo' } as EntityInterface;

  const makeDeps = (entities: Record<string, Record<string, object>> = {}) => {
    const getEntity: DenormGetEntity = MemoPolicy.getEntities(entities);
    const getCache = getEntityCaches(new Map());
    const resultCache: EndpointsCache = new WeakDependencyMap();
    return { getEntity, getCache, resultCache };
  };

  describe('constructor', () => {
    it('accepts an optional args list — defaulting to []', () => {
      // Covers the default-arg path that MemoCache never triggers (it always
      // forwards the endpoint's args). argsKey with no bound args must still
      // produce a consistent value.
      const { getEntity, getCache, resultCache } = makeDeps();
      const cache = new GlobalCache(getEntity, getCache, resultCache);

      expect(cache.argsKey(args => `len:${args.length}`)).toBe('len:0');
      // fn(undefined-indexed) returns undefined, which argsKey passes through
      expect(cache.argsKey(args => args[0]?.x)).toBeUndefined();
    });
  });

  describe('argsKey', () => {
    it('returns fn(args) bound at construction', () => {
      const { getEntity, getCache, resultCache } = makeDeps();
      const cache = new GlobalCache(getEntity, getCache, resultCache, [
        { portfolio: 'A' },
      ]);
      expect(cache.argsKey(args => args[0]?.portfolio)).toBe('A');
    });

    it('filters function-typed deps out of subscription paths', () => {
      // When argsKey registers a function dep, paths() must NOT surface it in
      // the subscription list — consumers subscribe to entity cells by
      // {key, pk}, and a function is not an entity path.
      const { getEntity, getCache, resultCache } = makeDeps({
        Foo: { '1': { id: '1' } },
      });
      const cache = new GlobalCache(getEntity, getCache, resultCache, [
        { portfolio: 'A' },
      ]);
      const lens = (args: readonly any[]) => args[0]?.portfolio;

      // First simulate a denormalize frame: the walker calls argsKey then
      // records an entity dep via getEntity.
      const input = { id: '1' };
      const { data, paths } = cache.getResults(input, true, () => {
        cache.argsKey(lens);
        cache.getEntity('1', Foo, { id: '1' }, m =>
          m.set('1', { id: '1', resolved: true }),
        );
        return [{ id: '1', resolved: true }];
      });

      expect(data).toEqual([{ id: '1', resolved: true }]);
      // Only entity paths — function dep is stripped by paths()
      expect(paths).toEqual([{ key: 'Foo', pk: '1' }]);
      expect(paths.every(p => typeof p !== 'function')).toBe(true);
    });
  });

  describe('getResults', () => {
    it('when cachable=false: runs compute and returns paths without hitting resultCache', () => {
      const { getEntity, getCache, resultCache } = makeDeps({
        Foo: { '1': { id: '1' } },
      });
      const cache = new GlobalCache(getEntity, getCache, resultCache);
      const compute = jest.fn(() => {
        cache.getEntity('1', Foo, { id: '1' }, m => m.set('1', { id: '1' }));
        return { id: '1' };
      });

      const r = cache.getResults(null, false, compute);
      expect(compute).toHaveBeenCalledTimes(1);
      expect(r.data).toEqual({ id: '1' });
      // paths still reflect the entities that were walked
      expect(r.paths).toEqual([{ key: 'Foo', pk: '1' }]);
    });

    it('when cachable=true: caches the result by input identity across fresh frames', () => {
      // MemoCache allocates a new GlobalCache per denormalize call, so the
      // second call must hit the SHARED resultCache even though the frame
      // object is new. Compute should only run once.
      const entities = { Foo: { '1': { id: '1', name: 'first' } } };
      const { getEntity, getCache, resultCache } = makeDeps(entities);
      const input = { id: '1' };

      const firstFrame = new GlobalCache(getEntity, getCache, resultCache, []);
      const compute1 = jest.fn(() => {
        firstFrame.getEntity('1', Foo, entities.Foo['1'], m =>
          m.set('1', { ...entities.Foo['1'] }),
        );
        return { value: 'computed' };
      });
      const r1 = firstFrame.getResults(input, true, compute1);
      expect(compute1).toHaveBeenCalledTimes(1);

      const secondFrame = new GlobalCache(getEntity, getCache, resultCache, []);
      const compute2 = jest.fn(() => ({ value: 'should-not-run' }));
      const r2 = secondFrame.getResults(input, true, compute2);
      expect(compute2).not.toHaveBeenCalled();
      // Value and paths survive across frames and maintain reference
      expect(r2.data).toBe(r1.data);
      expect(r2.paths).toEqual(r1.paths);
    });

    it('cache hit across frames also works when argsKey was used (paths filtered)', () => {
      // Once the resultCache has stored any function-typed dep, future hits
      // must strip them when returning paths. Ensures the on-hit filter at
      // getResults branches correctly.
      const entities = { Foo: { '1': { id: '1' } } };
      const { getEntity, getCache, resultCache } = makeDeps(entities);
      const input = { id: '1' };
      const lens = (args: readonly any[]) => args[0]?.portfolio;
      const args = [{ portfolio: 'A' }];

      const frame1 = new GlobalCache(getEntity, getCache, resultCache, args);
      frame1.getResults(input, true, () => {
        frame1.argsKey(lens);
        frame1.getEntity('1', Foo, entities.Foo['1'], m =>
          m.set('1', { ...entities.Foo['1'] }),
        );
        return { v: 1 };
      });

      // Second frame, same inputs/args — should hit the cache and still
      // return only entity paths.
      const frame2 = new GlobalCache(getEntity, getCache, resultCache, args);
      const compute = jest.fn(() => ({ v: 'not-run' }));
      const r = frame2.getResults(input, true, compute);
      expect(compute).not.toHaveBeenCalled();
      expect(r.paths).toEqual([{ key: 'Foo', pk: '1' }]);
      expect(r.paths.every(p => typeof p !== 'function')).toBe(true);
    });
  });

  describe('getEntity', () => {
    it('memoizes the per-entity WeakDependencyMap lookup across sibling calls', () => {
      // Two sibling references to the same entity inside one denormalize
      // frame must re-use the cached walk: compute runs once.
      const entities = { Foo: { '1': { id: '1' } } };
      const { getEntity, getCache, resultCache } = makeDeps(entities);
      const cache = new GlobalCache(getEntity, getCache, resultCache);
      const compute = jest.fn((m: Map<string, any>) =>
        m.set('1', { id: '1', built: true }),
      );

      const a = cache.getEntity('1', Foo, entities.Foo['1'], compute);
      const b = cache.getEntity('1', Foo, entities.Foo['1'], compute);
      expect(a).toBe(b);
      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('reuses cached dependency chain from a previous denormalize frame', () => {
      // Cross-frame entity cache: the second frame should NOT call
      // computeValue at all because _getCache returns a cached chain for
      // the same entity reference.
      const entities = { Foo: { '1': { id: '1' } } };
      const { getEntity, getCache, resultCache } = makeDeps(entities);

      const frame1 = new GlobalCache(getEntity, getCache, resultCache);
      const compute1 = jest.fn((m: Map<string, any>) =>
        m.set('1', { id: '1', built: true }),
      );
      const v1 = frame1.getEntity('1', Foo, entities.Foo['1'], compute1);
      expect(compute1).toHaveBeenCalledTimes(1);

      const frame2 = new GlobalCache(getEntity, getCache, resultCache);
      const compute2 = jest.fn((m: Map<string, any>) =>
        m.set('1', { should: 'not-run' }),
      );
      const v2 = frame2.getEntity('1', Foo, entities.Foo['1'], compute2);
      expect(compute2).not.toHaveBeenCalled();
      expect(v2).toBe(v1);
    });

    it('preserves function-dep filtering across a result-cache miss + entity-cache hit', () => {
      // Regression: when the result cache misses (new input ref) but every
      // entity ref is unchanged, getEntity replays cached deps WITHOUT
      // running computeValue — so argsKey is never called in this frame.
      // The replayed deps may contain function-typed (`argsKey`) paths from
      // the prior frame; `paths()` must still strip them from the
      // subscription list, otherwise a function leaks into EntityPath[].
      const entities = { Foo: { '1': { id: '1' } } };
      const { getEntity, getCache, resultCache } = makeDeps(entities);
      const lens = (args: readonly any[]) => args[0]?.portfolio;
      const args = [{ portfolio: 'A' }];

      // Frame 1: populate the per-entity cache with a chain that contains
      // both the entity dep and a function (argsKey) dep, exactly as would
      // happen when an Entity's computeValue walks a Scalar field.
      const frame1 = new GlobalCache(getEntity, getCache, resultCache, args);
      frame1.getResults({ id: '1' }, true, () => {
        frame1.getEntity('1', Foo, entities.Foo['1'], m => {
          frame1.argsKey(lens);
          m.set('1', { id: '1', resolved: true });
        });
        return [{ id: '1', resolved: true }];
      });

      // Frame 2: NEW input ref (resultCache miss) but same entity ref
      // (entity cache hits, so computeValue / argsKey do NOT run).
      const frame2 = new GlobalCache(getEntity, getCache, resultCache, args);
      const { paths } = frame2.getResults({ id: '1' }, true, () => {
        frame2.getEntity('1', Foo, entities.Foo['1'], () => {
          throw new Error(
            'computeValue must not run — entity cache should hit',
          );
        });
        return [{ id: '1', resolved: true }];
      });

      expect(paths.every(p => typeof p !== 'function')).toBe(true);
      expect(paths).toEqual([{ key: 'Foo', pk: '1' }]);
    });

    it('recomputes when the entity reference changes (WeakMap identity)', () => {
      // Entity-keyed chains depend on === identity of the entity ref. A new
      // object at entities[key][pk] busts the cache even if contents match.
      const initial = { id: '1', name: 'old' };
      const entities = { Foo: { '1': initial } };
      const { getEntity, getCache, resultCache } = makeDeps(entities);

      const frame1 = new GlobalCache(getEntity, getCache, resultCache);
      frame1.getEntity('1', Foo, initial, m =>
        m.set('1', { ...initial, denormed: true }),
      );

      // Swap entity for a new object (same pk, fresh ref).
      const next = { id: '1', name: 'new' };
      entities.Foo['1'] = next;

      const frame2 = new GlobalCache(getEntity, getCache, resultCache);
      const compute = jest.fn((m: Map<string, any>) =>
        m.set('1', { ...next, denormed: true }),
      );
      frame2.getEntity('1', Foo, next, compute);
      expect(compute).toHaveBeenCalledTimes(1);
    });
  });
});
