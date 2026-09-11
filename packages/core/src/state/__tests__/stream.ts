import {
  ArticleResource,
  CoolerArticleResource,
  IndexedUserResource,
} from '__tests__/new';

import { Controller } from '../..';
import { GC, HYDRATE } from '../../actionTypes';
import {
  createInvalidate,
  createReset,
  createSetResponse,
} from '../../controller/actions';
import type { State, StateDelta } from '../../types';
import createReducer, { initialState } from '../reducer/createReducer';
import {
  applyStateDelta,
  createHydrate,
  diffState,
  mergeStateDelta,
  overlayState,
  selectBaseline,
} from '../stream';

/** What a JSON transport can carry: no `optimistic`, no `undefined` */
const serializable = (state: State<unknown>) =>
  JSON.parse(JSON.stringify({ ...state, optimistic: undefined }));

/** Round trip through JSON like the browser receives it */
const transport = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe('state streaming', () => {
  const reducer = createReducer(new Controller());
  const article = { id: 5, title: 'hi', content: 'body', tags: ['a'] };
  const setArticle = createSetResponse(ArticleResource.get, {
    args: [{ id: 5 }],
    response: article,
    fetchedAt: 1000,
  });
  const setOther = createSetResponse(ArticleResource.get, {
    args: [{ id: 6 }],
    response: { ...article, id: 6, title: 'other' },
    fetchedAt: 2000,
  });
  const s1 = reducer(initialState, setArticle);
  const s2 = reducer(s1, setOther);

  describe('diffState + applyStateDelta', () => {
    it('returns null when nothing changed', () => {
      expect(diffState(initialState, initialState)).toBeNull();
      expect(diffState(s1, s1)).toBeNull();
    });

    it('fold of the delta equals the serializable projection of state', () => {
      const delta = diffState(initialState, s1);
      expect(delta).not.toBeNull();
      const folded = applyStateDelta(initialState, delta!);
      expect(serializable(folded)).toEqual(serializable(s1));
      expect(folded.optimistic).toEqual([]);
    });

    it('shares leaf references with the state it was produced from', () => {
      const delta = diffState(initialState, s1)!;
      const folded = applyStateDelta(initialState, delta);
      const key = setArticle.key;
      expect(folded.entities.Article!['5']).toBe(s1.entities.Article!['5']);
      expect(folded.entitiesMeta.Article['5']).toBe(
        s1.entitiesMeta.Article['5'],
      );
      expect(folded.endpoints[key]).toBe(s1.endpoints[key]);
      expect(folded.meta[key]).toBe(s1.meta[key]);
    });

    it('only encodes slots that changed since the last emission', () => {
      const emitted = applyStateDelta(
        initialState,
        diffState(initialState, s1)!,
      );
      const delta = diffState(emitted, s2)!;
      expect(delta.entities.map(c => c.pk)).toEqual(['6']);
      expect(delta.endpoints.map(c => c.key)).toEqual([setOther.key]);
      expect(delta.reset).toBeUndefined();
      expect(serializable(applyStateDelta(emitted, delta))).toEqual(
        serializable(s2),
      );
    });

    it('is idempotent', () => {
      const delta = transport(diffState(s1, s2)!);
      const once = applyStateDelta(s1, delta);
      const twice = applyStateDelta(once, delta);
      expect(serializable(twice)).toEqual(serializable(once));
    });

    it('encodes endpoint removal from invalidate while keeping its meta', () => {
      const invalidated = reducer(
        s1,
        createInvalidate(ArticleResource.get, { args: [{ id: 5 }] }),
      );
      const delta = diffState(s1, invalidated)!;
      expect(delta.entities).toEqual([]);
      expect(delta.endpoints).toEqual([
        {
          key: setArticle.key,
          value: { meta: invalidated.meta[setArticle.key] },
        },
      ]);
      const folded = applyStateDelta(s1, transport(delta));
      expect(folded.endpoints).not.toHaveProperty(setArticle.key);
      expect(folded.meta[setArticle.key].invalidated).toBe(true);
    });

    it('detects in-place GC deletions when the emitted snapshot is owned', () => {
      // GC mutates state in place, so an emitted snapshot that aliased
      // `state` would never see the removal.
      const server = reducer(s1, setOther);
      const emitted = applyStateDelta(
        initialState,
        diffState(initialState, server)!,
      );
      const collected = reducer(server, {
        type: GC,
        entities: [{ key: 'Article', pk: '6' }],
        endpoints: [setOther.key],
      });
      expect(collected).toBe(server);
      const delta = diffState(emitted, collected)!;
      expect(delta.entities).toEqual([{ key: 'Article', pk: '6' }]);
      expect(delta.endpoints).toEqual([{ key: setOther.key }]);
      const folded = applyStateDelta(emitted, transport(delta));
      expect(folded.entities.Article).not.toHaveProperty('6');
      expect(folded.entitiesMeta.Article).not.toHaveProperty('6');
      expect(folded.endpoints).not.toHaveProperty(setOther.key);
      expect(folded.meta).not.toHaveProperty(setOther.key);
    });

    it('encodes a reset as a restart from an empty store', () => {
      const reset = reducer(s2, createReset());
      const afterReset = reducer(reset, setOther);
      const delta = diffState(s2, afterReset)!;
      expect(delta.reset).toBe(afterReset.lastReset);
      expect(delta.entities.map(c => c.pk)).toEqual(['6']);
      const folded = applyStateDelta(s2, transport(delta));
      expect(serializable(folded)).toEqual(serializable(afterReset));
      expect(folded.entities.Article).not.toHaveProperty('5');
    });

    it('encodes index tables', () => {
      const setUser = createSetResponse(IndexedUserResource.get, {
        args: [{ id: 1 }],
        response: { id: 1, username: 'bob' },
      });
      const withUser = reducer(initialState, setUser);
      const delta = diffState(initialState, withUser)!;
      expect(delta.indexes).toEqual([
        { key: 'IndexedUser', index: 'username', value: { bob: '1' } },
      ]);
      const folded = applyStateDelta(initialState, transport(delta));
      expect(folded.indexes.IndexedUser.username.bob).toBe('1');
      const removed = applyStateDelta(folded, {
        entities: [],
        endpoints: [],
        indexes: [{ key: 'IndexedUser', index: 'username' }],
      });
      expect(removed.indexes.IndexedUser).toEqual({});
    });

    it('does not carry optimistic actions', () => {
      const withOptimistic: State<unknown> = {
        ...s1,
        optimistic: [setOther],
      };
      const delta = diffState(initialState, withOptimistic)!;
      expect(JSON.stringify(delta)).not.toContain('optimistic');
      expect(applyStateDelta(initialState, delta).optimistic).toEqual([]);
    });
  });

  describe('mergeStateDelta', () => {
    const delta = transport(diffState(s1, s2)!);

    it('takes every slot the client has not touched', () => {
      const baseline = selectBaseline(s1, delta);
      const merged = mergeStateDelta(s1, delta, baseline);
      expect(serializable(merged)).toEqual(serializable(s2));
      expect(merged.entities.Article!['5']).toBe(s1.entities.Article!['5']);
    });

    it('keeps slots the client changed since the baseline', () => {
      const baseline = selectBaseline(s1, delta);
      const clientArticle = { ...article, id: 6, title: 'client wins' };
      const live = reducer(
        s1,
        createSetResponse(ArticleResource.get, {
          args: [{ id: 6 }],
          response: clientArticle,
          fetchedAt: 3000,
        }),
      );
      const merged = mergeStateDelta(live, delta, baseline);
      expect((merged.entities.Article!['6'] as any).title).toBe('client wins');
      expect(merged.endpoints[setOther.key]).toBe(live.endpoints[setOther.key]);
      expect(merged.meta[setOther.key]).toBe(live.meta[setOther.key]);
    });

    it('treats an entity and its meta as one slot', () => {
      const baseline = selectBaseline(s1, delta);
      const live: State<unknown> = {
        ...s1,
        entities: {
          ...s1.entities,
          Article: { ...s1.entities.Article, 6: { id: 6, title: 'touched' } },
        },
      };
      const merged = mergeStateDelta(live, delta, baseline);
      expect((merged.entities.Article!['6'] as any).title).toBe('touched');
      expect(merged.entitiesMeta.Article['6']).toBeUndefined();
    });

    it('applies removals under the same rule', () => {
      const removal: StateDelta = {
        entities: [{ key: 'Article', pk: '6' }],
        endpoints: [],
        indexes: [],
      };
      const withSix = applyStateDelta(s1, delta);
      const baseline = selectBaseline(withSix, removal);
      expect(
        mergeStateDelta(withSix, removal, baseline).entities.Article,
      ).not.toHaveProperty('6');

      const touched: State<unknown> = {
        ...withSix,
        entities: {
          ...withSix.entities,
          Article: { ...withSix.entities.Article, 6: { id: 6 } },
        },
      };
      expect(
        mergeStateDelta(touched, removal, baseline).entities.Article,
      ).toHaveProperty('6');
    });

    it('a reset delta replaces client state', () => {
      const reset = reducer(s2, createReset());
      const afterReset = reducer(reset, setOther);
      const resetDelta = transport(diffState(s2, afterReset)!);
      const baseline = selectBaseline(s2, resetDelta);
      const merged = mergeStateDelta(s2, resetDelta, baseline);
      expect(merged.lastReset).toBe(afterReset.lastReset);
      expect(merged.entities.Article).not.toHaveProperty('5');
      expect(merged.entities.Article).toHaveProperty('6');
    });

    it('returns the same state when nothing is taken', () => {
      const baseline = selectBaseline(initialState, delta);
      // every slot differs from an empty baseline
      expect(mergeStateDelta(s2, delta, baseline)).toBe(s2);
    });
  });

  describe('selectBaseline', () => {
    it('picks current values of the changed slots only', () => {
      const delta = diffState(s1, s2)!;
      const baseline = selectBaseline(s1, delta);
      expect(baseline.lastReset).toBe(s1.lastReset);
      expect(baseline.entities).toEqual({});
      expect(baseline.endpoints).toEqual({});
      const back = selectBaseline(s2, diffState(s2, s1)!);
      expect(back.entities.Article!['6']).toBe(s2.entities.Article!['6']);
      expect(back.entities.Article).not.toHaveProperty('5');
      expect(back.endpoints[setOther.key]).toBe(s2.endpoints[setOther.key]);
    });
  });

  describe('overlayState', () => {
    it('prefers snapshot slots and falls back to live for the rest', () => {
      const live = reducer(
        s1,
        createSetResponse(ArticleResource.get, {
          args: [{ id: 5 }],
          response: { ...article, title: 'client' },
          fetchedAt: 9000,
        }),
      );
      const view = overlayState(s1, reducer(live, setOther));
      // server value wins where it exists
      expect(view.entities.Article!['5']).toBe(s1.entities.Article!['5']);
      expect(view.meta[setArticle.key]).toBe(s1.meta[setArticle.key]);
      // live fills in what the server never sent
      expect((view.entities.Article!['6'] as any).title).toBe('other');
      expect(view.endpoints[setOther.key]).toBe('6');
    });

    it('returns live itself when the snapshot is live', () => {
      expect(overlayState(s1, s1)).toBe(s1);
    });

    it('keeps live-only tables and adds snapshot-only tables', () => {
      const setUser = createSetResponse(IndexedUserResource.get, {
        args: [{ id: 1 }],
        response: { id: 1, username: 'bob' },
      });
      const live = reducer(initialState, setUser);
      const view = overlayState(s1, live);
      expect(view.entities.IndexedUser).toBe(live.entities.IndexedUser);
      expect(view.indexes.IndexedUser).toBe(live.indexes.IndexedUser);
      expect(view.entities.Article).toEqual(s1.entities.Article);
    });
  });

  describe('prototype safety', () => {
    const hostile = transport({
      entities: [
        {
          key: '__proto__',
          pk: 'polluted',
          value: { entity: { polluted: true } },
        },
        {
          key: 'Article',
          pk: '__proto__',
          value: { entity: { polluted: true } },
        },
      ],
      endpoints: [
        { key: '__proto__', value: { endpoint: { polluted: true } } },
      ],
      indexes: [{ key: '__proto__', index: 'x', value: { a: 'b' } }],
    });

    it('ignores changes that would alter prototypes', () => {
      const folded = applyStateDelta(s1, hostile);
      expect(folded).toBe(s1);
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.getPrototypeOf(folded.entities)).toBe(Object.prototype);
      const merged = mergeStateDelta(s1, hostile, selectBaseline(s1, hostile));
      expect(merged).toBe(s1);
      expect(selectBaseline(s1, hostile).entities).toEqual({});
    });
  });

  describe('HYDRATE reducer', () => {
    const delta = transport(diffState(s1, s2)!);

    it('merges when the client has not reset', () => {
      const action = createHydrate(delta, selectBaseline(s1, delta));
      expect(action.type).toBe(HYDRATE);
      const next = reducer(s1, action);
      expect(serializable(next)).toEqual(serializable(s2));
    });

    it('ignores deltas after the client reset', () => {
      const live = reducer(s1, createReset());
      const next = reducer(
        live,
        createHydrate(delta, selectBaseline(s1, delta)),
      );
      expect(next).toBe(live);
    });

    it('applies a server reset', () => {
      const afterReset = reducer(reducer(s2, createReset()), setOther);
      const resetDelta = transport(diffState(s2, afterReset)!);
      const next = reducer(
        s2,
        createHydrate(resetDelta, selectBaseline(s2, resetDelta)),
      );
      expect(serializable(next)).toEqual(serializable(afterReset));
    });

    it('is exposed as an ActionType handled without schemas', () => {
      const setCooler = createSetResponse(CoolerArticleResource.get, {
        args: [{ id: 7 }],
        response: { id: 7, title: 'cool', content: '', tags: [] },
      });
      const server = reducer(initialState, setCooler);
      const wire = transport(diffState(initialState, server)!);
      const client = reducer(
        initialState,
        createHydrate(wire, selectBaseline(initialState, wire)),
      );
      expect(client.entities.CoolerArticle!['7']).toEqual(
        transport(server.entities.CoolerArticle!['7']),
      );
    });
  });
});
