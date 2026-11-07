// eslint-env jest
import { Entity } from '@data-client/endpoint';
import { schema as schemas } from '@data-client/endpoint';
import v8 from 'v8';
import vm from 'vm';

import MemoCache from '../memo/MemoCache.native';
import { normalize } from '../normalize/normalize';

// React Native: MemoCache.native.ts, whose memo keeps the newest entry per node
// plus the ones committed renders read.
/** Runs a full GC once the current job ends, since WeakRef targets stay alive until then */
async function collect() {
  v8.setFlagsFromString('--expose_gc');
  await new Promise(resolve => setTimeout(resolve, 0));
  (vm.runInNewContext('gc') as () => void)();
}

describe('MemoCache.commit', () => {
  class Todo extends Entity {
    id = '';
    title = '';
  }
  const input = ['1', '2'];
  const store = (title: string) => ({
    Todo: { '1': { id: '1', title }, '2': { id: '2', title: 'b' } },
  });

  it('keeps a committed result through any number of one-off reads', () => {
    const memo = new MemoCache();
    const committed = store('committed');
    const first = memo.denormalize([Todo], input, committed).data;
    memo.commit(committed);
    // a pending transition: each retry builds new entities, read once
    for (let i = 0; i < 5; i++)
      memo.denormalize([Todo], input, store(`retry ${i}`));
    expect(memo.denormalize([Todo], input, committed).data).toBe(first);
  });

  it('keeps a result first read after its store committed', () => {
    const memo = new MemoCache();
    memo.denormalize([Todo], input, store('older'));
    const committed = store('committed');
    memo.commit(committed);
    // a late mount reads the committed store
    const late = memo.denormalize([Todo], input, committed).data;
    for (let i = 0; i < 5; i++)
      memo.denormalize([Todo], input, store(`retry ${i}`));
    expect(memo.denormalize([Todo], input, committed).data).toBe(late);
  });

  it('keeps a result first read after an unsettled commit', () => {
    // optimistic updates were pending when the store committed
    const memo = new MemoCache();
    memo.denormalize([Todo], input, store('older'));
    const committed = store('committed');
    memo.commit(committed, false);
    const late = memo.denormalize([Todo], input, committed).data;
    for (let i = 0; i < 5; i++)
      memo.denormalize([Todo], input, store(`retry ${i}`));
    expect(memo.denormalize([Todo], input, committed).data).toBe(late);
  });

  it('brings back a result evicted before its commit', () => {
    const memo = new MemoCache();
    memo.denormalize([Todo], input, store('first'));
    const committed = store('committed');
    const first = memo.denormalize([Todo], input, committed).data;
    for (let i = 0; i < 5; i++)
      memo.denormalize([Todo], input, store(`retry ${i}`));
    memo.commit(committed);
    expect(memo.denormalize([Todo], input, committed).data).toBe(first);
  });

  it('does not track reads without an entities table', () => {
    const memo = new MemoCache();
    expect(memo.denormalize({ data: Todo }, { data: null }, null).data).toEqual(
      { data: null },
    );
  });

  describe('results whose input is a pk', () => {
    // a detail endpoint stores just the pk, and queries build one; each retry
    // rewrites a nested child while the top-level entity object stays
    class Author extends Entity {
      id = '';
      name = '';
    }
    class Post extends Entity {
      id = '';
      author = Author.fromJS();
      static schema = { author: Author };
    }
    const post = { id: '1', author: '2' };
    const withAuthor = (name: string) => ({
      Post: { '1': post },
      Author: { '2': { id: '2', name } },
    });

    it('keeps a committed single-entity result through one-off reads', () => {
      const memo = new MemoCache();
      memo.denormalize(Post, '1', withAuthor('older'));
      const committed = withAuthor('committed');
      const first = memo.denormalize(Post, '1', committed).data;
      memo.commit(committed);
      for (let i = 0; i < 5; i++)
        memo.denormalize(Post, '1', withAuthor(`retry ${i}`));
      expect(memo.denormalize(Post, '1', committed).data).toBe(first);
    });

    it('keeps a committed query result through one-off reads', () => {
      const memo = new MemoCache();
      const state = (name: string) => ({
        entities: withAuthor(name),
        indexes: {},
      });
      memo.query(Post, [{ id: '1' }], state('older'));
      const committed = state('committed');
      const first = memo.query(Post, [{ id: '1' }], committed).data;
      memo.commit(committed.entities);
      for (let i = 0; i < 5; i++)
        memo.query(Post, [{ id: '1' }], state(`retry ${i}`));
      expect(memo.query(Post, [{ id: '1' }], committed).data).toBe(first);
    });

    it('keeps a committed Collection result through one-off reads', () => {
      const memo = new MemoCache();
      const posts = new schemas.Collection([Post]);
      const args = [{ userId: 'u' }];
      const { entities } = normalize(
        posts,
        [{ id: '1', author: { id: '2', name: 'older' } }],
        args,
      );
      const state = (name: string) => ({
        entities: {
          ...entities,
          Author: { '2': { id: '2', name } },
        },
        indexes: {},
      });
      memo.query(posts, args, state('older'));
      const committed = state('committed');
      const first = memo.query(posts, args, committed).data;
      memo.commit(committed.entities);
      for (let i = 0; i < 5; i++) memo.query(posts, args, state(`retry ${i}`));
      expect(memo.query(posts, args, committed).data).toBe(first);
    });
  });

  it('keeps the settled result after the committed pin moves on', () => {
    const memo = new MemoCache();
    const s0 = store('settled');
    const r0 = memo.denormalize([Todo], input, s0).data;
    memo.commit(s0, true);
    // an optimistic update commits: s1 takes the committed pin
    const s1 = store('optimistic');
    const r1 = memo.denormalize([Todo], input, s1).data;
    memo.commit(s1, false);
    // one-off reads, such as retries of a pending transition
    for (let i = 0; i < 4; i++) memo.denormalize([Todo], input, store(`x${i}`));
    // only the settled pin holds r0 now
    expect(memo.denormalize([Todo], input, s0).data).toBe(r0);
    expect(memo.denormalize([Todo], input, s1).data).toBe(r1);
  });

  it('releases old pins once newer commits replace them', () => {
    const memo = new MemoCache();
    memo.denormalize([Todo], input, store('older'));
    const s0 = store('first');
    const r0 = memo.denormalize([Todo], input, s0).data;
    memo.commit(s0);
    const s1 = store('second');
    memo.denormalize([Todo], input, s1);
    memo.commit(s1);
    for (let i = 0; i < 4; i++)
      memo.denormalize([Todo], input, store(`one-off ${i}`));
    // bounded retention: nothing pins r0 any more
    const again = memo.denormalize([Todo], input, s0).data;
    expect(again).toEqual(r0);
    expect(again).not.toBe(r0);
  });

  it('repeat reads with the same entities do not grow the buffer', () => {
    const memo = new MemoCache();
    const pending = store('pending');
    for (let i = 0; i < 50; i++) memo.denormalize([Todo], input, pending);
    memo.denormalize([Todo], ['2'], pending);
    // one per cached input, however many reads
    expect((memo as any).reads.get(pending).size).toBe(2);
  });

  it('without commit, one-off reads push out a result read only once', () => {
    const memo = new MemoCache();
    memo.denormalize([Todo], input, store('first'));
    const committed = store('committed');
    const first = memo.denormalize([Todo], input, committed).data;
    for (let i = 0; i < 5; i++)
      memo.denormalize([Todo], input, store(`retry ${i}`));
    expect(memo.denormalize([Todo], input, committed).data).not.toBe(first);
  });

  it('keeps the query key a committed query read', () => {
    // queries build their input from the store: the committed one must stay
    // cached, or the pinned result is looked up with a new input
    const memo = new MemoCache();
    const all = new schemas.All(Todo);
    const s0 = { entities: store('s0'), indexes: {} };
    const first = memo.query(all, [], s0).data;
    memo.commit(s0.entities);
    memo.query(all, [], { entities: store('s1'), indexes: {} });
    expect(memo.query(all, [], s0).data).toBe(first);
  });

  describe('nested values', () => {
    // the parent row stays the same while its nested child changes, so the
    // parent's own node gets a new value for each store version
    class Owner extends Entity {
      id = '';
      name = '';
    }
    class Project extends Entity {
      id = '';
      owner = Owner.fromJS();
      static schema = { owner: Owner };
    }
    const project = { id: 'p', owner: 'o' };
    const projects = ['p'];
    const withOwner = (name: string) => ({
      Project: { p: project },
      Owner: { o: { id: 'o', name } },
    });

    it('a detail read gets the object a committed list showed', () => {
      const memo = new MemoCache();
      const s0 = withOwner('s0');
      const list = memo.denormalize([Project], projects, s0).data as any[];
      memo.commit(s0);
      // a pending transition renders a new owner
      memo.denormalize([Project], projects, withOwner('retry'));
      // first read of the row on its own, against the committed store
      expect(memo.denormalize(Project, 'p', s0).data).toBe(list[0]);
    });

    it('nested objects keep their identity across committed reads', () => {
      const memo = new MemoCache();
      const s0 = withOwner('s0');
      const list = memo.denormalize([Project], projects, s0).data as any[];
      memo.commit(s0);
      for (let i = 0; i < 3; i++)
        memo.denormalize([Project], projects, withOwner(`retry ${i}`));
      // another input over the same rows reuses the nested values
      const again = memo.denormalize([Project], ['p'], s0).data as any[];
      expect(again[0]).toBe(list[0]);
      expect(again[0].owner).toBe(list[0].owner);
    });
  });

  it('frees the reads of a store that never commits with that store', async () => {
    // direct use, or a provider that never calls commit(): results read
    // against a store must not outlive it through the commit bookkeeping
    const memo = new MemoCache();
    const results: WeakRef<object>[] = [];
    (() => {
      const entities = store('never committed');
      for (let i = 0; i < 1000; i++) {
        const { data } = memo.denormalize([Todo], ['1'], entities);
        results.push(new WeakRef(data as object));
      }
    })();
    await collect();
    expect(results.filter(ref => ref.deref()).length).toBe(0);
  });

  it('keeps a bounded number of reads for a live store that never commits', async () => {
    // a long-lived store read with many new inputs, and no commit()
    const memo = new MemoCache();
    const entities = store('never committed');
    const results: WeakRef<object>[] = [];
    for (let i = 0; i < 1000; i++) {
      const { data } = memo.denormalize([Todo], ['1'], entities);
      results.push(new WeakRef(data as object));
    }
    await collect();
    expect(results.filter(ref => ref.deref()).length).toBeLessThanOrEqual(256);
    expect(entities).toBeDefined();
  });
});
