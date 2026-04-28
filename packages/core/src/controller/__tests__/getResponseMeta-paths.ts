import { Endpoint, Entity } from '@data-client/endpoint';

import { initialState } from '../../state/reducer/createReducer';
import Controller from '../Controller';

/** Integration test: `Controller.getResponseMeta()` is the seam every read
 * hook (`useSuspense`, `useCache`, `useFetch`, `useDLE`, `useLive`) calls.
 * Multiple subscribers to the same endpoint + args + entities must observe
 * the same `expiresAt`, otherwise late subscribers silently skip the
 * entity-expiry refetch in `useSuspense`'s gate
 * `if (Date.now() <= expiresAt && !forceFetch) return;`.
 *
 * The bug fixed by this PR was a `paths.shift()` mutation on the journey
 * stored by reference on `WeakDependencyMap.Link.journey`. Each successive
 * cache hit returned a journey one entry shorter than the last. The first
 * entity dropped is the one with the *earliest* expiry, so subscriber 2's
 * `entityExpiresAt(paths, …)` skipped it and computed a too-late
 * `expiresAt`; subscriber 3 saw an empty array and got `Infinity`.
 *
 * The path is GC-independent: it fires under `ImmortalGCPolicy` too, since
 * `entityExpiresAt` is unconditional whenever the endpoint has no
 * top-level `meta.expiresAt` (the common case for state populated via
 * `controller.set(Entity, …)`, SSR hydration, or `useQuery`).
 */
describe('Controller.getResponseMeta repeated calls', () => {
  it('returns identical expiresAt across subscribers (journey is not consumed by reads)', () => {
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

    const controller = new Controller({});

    // Endpoint slot exists (so we hit the `denormalize` path) but the
    // endpoint itself has no top-level `meta.expiresAt` yet — mirrors
    // apps that hydrate from SSR or use `controller.set(Entity, …)`
    // without going through an endpoint fetch. In that shape,
    // `Controller.getResponseMeta()` falls back to walking per-entity
    // meta via `entityExpiresAt(paths, …)`. Foo|'1' has the earliest
    // expiry — the first journey entry the buggy `paths.shift()` would
    // drop.
    const FOO_1_EXPIRY = 100;
    const FOO_2_EXPIRY = 1_000_000;
    const state = {
      ...initialState,
      entities: {
        Foo: {
          '1': { id: '1' },
          '2': { id: '2' },
        },
      },
      entitiesMeta: {
        Foo: {
          '1': { date: 0, fetchedAt: 0, expiresAt: FOO_1_EXPIRY },
          '2': { date: 0, fetchedAt: 0, expiresAt: FOO_2_EXPIRY },
        },
      },
      endpoints: {
        [ep.key()]: ['1', '2'],
      },
    };

    // Three successive calls simulate three React components mounting
    // with the same endpoint + args. Call 1 is a result-cache miss;
    // calls 2 and 3 are hits.
    const m1 = controller.getResponseMeta(ep, state);
    const m2 = controller.getResponseMeta(ep, state);
    const m3 = controller.getResponseMeta(ep, state);

    // Subscriber 1 picks the earliest entity expiry. Subscribers 2+ must
    // pick the same one — pre-fix they observed FOO_2_EXPIRY (m2) and
    // Infinity (m3), silently suppressing entity-expiry refetch.
    expect(m1.expiresAt).toBe(FOO_1_EXPIRY);
    expect(m2.expiresAt).toBe(m1.expiresAt);
    expect(m3.expiresAt).toBe(m1.expiresAt);

    // Cached data must remain referentially equal across hits — the
    // memo contract `useSuspense` etc. rely on for skip-rerender.
    expect(m2.data).toBe(m1.data);
    expect(m3.data).toBe(m1.data);
  });
});
