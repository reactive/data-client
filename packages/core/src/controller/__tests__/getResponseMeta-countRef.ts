import { Endpoint, Entity } from '@data-client/endpoint';

import { GCPolicy } from '../../state/GCPolicy';
import { initialState } from '../../state/reducer/createReducer';
import Controller from '../Controller';

/** Integration test for the `paths` → `countRef` pipeline.
 *
 * React hooks (`useSuspense`, `useCache`, `useLive`, `useDLE`, `useQuery`)
 * all call `controller.getResponseMeta(...)` during `useMemo` and then
 * pass the returned `countRef` to `useEffect`. `useEffect` executes
 * `countRef` once per hook instance — iterating the **captured** `paths`
 * array to increment `GCPolicy.entityCount` per referenced entity. When
 * the component unmounts (or `data` changes) the returned `decrement`
 * closure iterates that same captured `paths` array to decrement.
 *
 * Before the fix, `globalCache.getResults` called `paths.shift()` on a
 * result-cache hit, mutating the journey array stored by reference on
 * `WeakDependencyMap.Link.journey`. Because `paths` aliases that stored
 * journey, every successive hit dropped one more real `EntityPath` from
 * the subscription list. The Nth component mount (for N ≥ 3, same
 * endpoint + args, entities unchanged) would have its `countRef`
 * iterate a progressively shorter list — skipping the first real
 * entity, then the second, etc. — leaving `entityCount` under-counted
 * for those entities and allowing GC to reap entities that mounted
 * components still subscribe to.
 */
describe('Controller.getResponseMeta + GCPolicy.countRef integration', () => {
  it('entityCount tracks all entities for each subscriber across repeated result-cache hits', () => {
    class Foo extends Entity {
      id = '';
      pk() {
        return this.id;
      }
    }
    const ep = new Endpoint(() => Promise.resolve(), {
      key: () => 'listFoo',
      schema: [Foo],
    });

    const gcPolicy = new GCPolicy();
    const controller = new Controller({ gcPolicy });
    gcPolicy.init(controller);

    const state = {
      ...initialState,
      entities: {
        Foo: {
          '1': { id: '1' },
          '2': { id: '2' },
        },
      },
      endpoints: {
        [ep.key()]: ['1', '2'],
      },
    };

    // Three successive `getResponseMeta` calls simulate three React
    // components mounting with the same endpoint + args, where the store
    // has not changed between renders. Call 1 is a result-cache miss;
    // calls 2 and 3 are hits — each hit mutates the shared journey.
    const m1 = controller.getResponseMeta(ep, state);
    const m2 = controller.getResponseMeta(ep, state);
    const m3 = controller.getResponseMeta(ep, state);

    // Simulate `useEffect(countRef, [data])` firing for each mount.
    // Pre-fix: m2.paths and m3.paths both aliased the shared journey,
    // and by the time the countRefs run the journey has been shifted
    // twice — so both iterate `[Foo|'2']` only, silently skipping
    // Foo|'1'. Only m1 (miss path, fresh `paths`) counted Foo|'1'.
    const dec1 = m1.countRef();
    const dec2 = m2.countRef();
    const dec3 = m3.countRef();

    // Each mount must have incremented *both* entities.
    // Pre-fix: Foo|'1' = 1 (only m1 counted it); Foo|'2' = 3.
    expect(gcPolicy['entityCount'].get('Foo')?.get('1')).toBe(3);
    expect(gcPolicy['entityCount'].get('Foo')?.get('2')).toBe(3);

    // Simulate all three components unmounting (or `data` changing).
    // Pre-fix: only dec1 would decrement Foo|'1' (taking it from 1 to
    // 0) — observable as premature GC-eligibility of Foo|'1' while
    // the other two subscribers still depended on it.
    dec1();
    dec2();
    dec3();

    expect(gcPolicy['entityCount'].get('Foo')?.get('1')).toBeUndefined();
    expect(gcPolicy['entityCount'].get('Foo')?.get('2')).toBeUndefined();

    gcPolicy.cleanup();
  });
});
