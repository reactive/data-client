import type { State } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  DataProvider,
  getDefaultManagers,
  useController,
  useSuspense,
} from '@data-client/react';
import { mockInitialState } from '@data-client/test';
import { act, render } from '@testing-library/react';
import { makeGetTodo, Todo } from '__tests__/concurrentFixtures';
import type { TodoItem } from '__tests__/concurrentFixtures';
import React, {
  Suspense,
  useEffect,
  useState,
  useTransition,
  version,
} from 'react';

import useCacheState from '../hooks/useCacheState';

/**
 * Memoization under concurrent rendering. Every read of the list records the
 * entity versions it read and the result it got. A read of versions an
 * earlier read already saw, that gets a different result, is a miss that
 * caching more would have avoided, since those versions' entities are
 * still alive.
 */

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const describeConcurrent = LegacyReact ? describe.skip : describe;

class Note extends Entity {
  id = '';
  text = '';
}

class Owner extends Entity {
  id = '';
  name = '';
}
class Project extends Entity {
  id = '';
  owner = Owner.fromJS();
  static schema = { owner: Owner };
}
const projectResponse = { id: 'p', owner: { id: 'o', name: 'v1' } };
const getProject = new Endpoint(
  (_: { id: string }) => Promise.resolve(projectResponse),
  { schema: Project, name: 'getProject' },
);
const getOwner = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id, name: id }),
  { schema: Owner, name: 'getOwner' },
);

const ROWS = 50;
const rows = (): TodoItem[] =>
  Array.from({ length: ROWS }, (_, i) => ({ id: `${i}`, title: `${i}` }));

const getTodoList = new Endpoint(() => Promise.resolve(rows()), {
  schema: [Todo],
  name: 'getTodoList',
});
const getTodo = makeGetTodo(({ id }) => Promise.resolve({ id, title: id }));
const getNote = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id, text: id }),
  { schema: Note, name: 'getNote' },
);
const pending: Record<
  string,
  { resolve: (value: TodoItem) => void; reject: (error: Error) => void }
> = {};
const hold = (key: string) =>
  new Promise<TodoItem>((resolve, reject) => {
    pending[key] = { resolve, reject };
  });
const getDetail = new Endpoint(({ id }: { id: string }) => hold(id), {
  schema: Todo,
  name: 'getDetail',
});
const updateKey = (id: string, title: string) => `update ${id} ${title}`;
const updateTodo = new Endpoint(
  ({ id, title }: { id: string; title: string }) => hold(updateKey(id, title)),
  {
    schema: Todo,
    sideEffect: true,
    name: 'updateTodo',
    getOptimisticResponse(_snap, { id, title }) {
      return { id, title };
    },
  },
);
const noDevManagers = getDefaultManagers({ devToolsManager: null });

const ids = new WeakMap<object, number>();
let nextId = 0;
const idOf = (o: object) => {
  let id = ids.get(o);
  if (id === undefined) {
    id = nextId++;
    ids.set(o, id);
  }
  return id;
};

/** Every read: entity versions read, result identity, and `who: 'render'`
 * for list renders. */
type Read = { versions: string; data: unknown; who?: 'render' };
let reads: Read[] = [];
/** The reads of renders React committed, in commit order. */
let committed: Read[] = [];
const versionsOf = (state: State<unknown>, todos: { id: string }[]) => {
  const table = (state.entities[Todo.key] ?? {}) as Record<string, object>;
  return todos.map(todo => idOf(table[todo.id])).join(',');
};

/** Record a render's read, and record it as committed if React commits that render. */
function useRecordRead(read: Read) {
  reads.push(read);
  useEffect(() => {
    committed.push(read);
  });
}

function List() {
  const todos = useSuspense(getTodoList);
  const state = useCacheState();
  useRecordRead({
    versions: versionsOf(state, todos),
    data: todos,
    who: 'render',
  });
  return <div>{todos.length}</div>;
}

function ProjectView() {
  const project = useSuspense(getProject, { id: 'p' });
  const state = useCacheState();
  const table = (key: string, pk: string) =>
    idOf((state.entities[key] as Record<string, object>)[pk]);
  useRecordRead({
    versions: `p${table(Project.key, 'p')}:o${table(Owner.key, 'o')}`,
    data: project,
  });
  return <div>{project.owner.name}</div>;
}

function Detail({ id }: { id: string }) {
  const todo = useSuspense(getDetail, { id });
  return <div>{todo.title}</div>;
}

let controller: ReturnType<typeof useController>;
let startTransition: (fn: () => void) => void;
let showDetail: (id: string) => void;
let typeText: (text: string) => void;

function App({
  consumers,
  project = false,
}: {
  consumers: number;
  project?: boolean;
}) {
  controller = useController();
  const [detail, setDetail] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [isPending, start] = useTransition();
  startTransition = start;
  showDetail = id => setDetail(prev => [...prev, id]);
  typeText = setText;
  return (
    <div>
      <span data-testid="pending">{String(isPending)}</span>
      <span>{text}</span>
      <Suspense fallback={<p>loading list</p>}>
        {Array.from({ length: consumers }, (_, i) => (
          <List key={i} />
        ))}
        {project && <ProjectView />}
      </Suspense>
      <Suspense fallback={<p>loading detail</p>}>
        {detail.map(id => (
          <Detail key={id} id={id} />
        ))}
      </Suspense>
    </div>
  );
}

/** A manager or event handler reading the committed store outside render. */
function readRaw() {
  const state = controller.getState();
  const { data } = controller.getResponse(getTodoList, state);
  reads.push({ versions: versionsOf(state, data as any), data });
}

/** Reads of versions already read before, that got a different result. */
function avoidableMisses(list: Read[]) {
  const seen = new Map<string, unknown>();
  let misses = 0;
  for (const { versions, data } of list) {
    if (seen.has(versions) && seen.get(versions) !== data) misses++;
    seen.set(versions, data);
  }
  return misses;
}

function flipBacks(list: Read[]) {
  const seen = new Set<string>();
  let last: string | undefined;
  let flips = 0;
  for (const { versions } of list) {
    if (versions !== last && seen.has(versions)) flips++;
    seen.add(versions);
    last = versions;
  }
  return flips;
}

function mount(consumers: number, project = false) {
  return render(
    <DataProvider
      initialState={mockInitialState([
        { endpoint: getTodoList, args: [], response: rows() },
        {
          endpoint: getProject,
          args: [{ id: 'p' }],
          response: projectResponse,
        },
      ])}
      devButton={null}
      managers={noDevManagers}
    >
      <App consumers={consumers} project={project} />
    </DataProvider>,
  );
}

const writeTodo = (id: string, title: string) => {
  controller.setResponse(getTodo, { id }, { id, title });
};

function beginTransition(row: string, id: string) {
  act(() => {
    startTransition(() => {
      writeTodo(row, `from transition ${id}`);
      showDetail(id);
    });
  });
}

/** Resolves a held request with `value`, or rejects it with an `Error`. */
async function settle(key: string, value: TodoItem | Error) {
  await act(async () => {
    if (value instanceof Error) pending[key].reject(value);
    else pending[key].resolve(value);
  });
}
const finishTransition = (id: string) => settle(id, { id, title: 'detail' });

const writeOwner = (name: string) => {
  controller.setResponse(getOwner, { id: 'o' }, { id: 'o', name });
};

const writeNote = (i: number) =>
  act(() => {
    controller.setResponse(
      getNote,
      { id: `${i}` },
      { id: `${i}`, text: `note ${i}` },
    );
  });

function beginOptimistic(id: string, title: string) {
  act(() => {
    controller.fetch(updateTodo, { id, title }).catch(() => {});
  });
}

const rollBack = (id: string, title: string) =>
  settle(updateKey(id, title), new Error('rejected'));
const resolveOptimistic = (id: string, title: string) =>
  settle(updateKey(id, title), { id, title });
let note = 100;

beforeEach(() => {
  reads = [];
  committed = [];
  for (const key of Object.keys(pending)) delete pending[key];
  note = 100;
});

// Committed renders never get a new object for entity versions an earlier
// commit already showed. Such a miss re-runs the consumer's effects, memos
// and children for unchanged data. An implementation may tolerate misses on
// reads React throws away (uncommitted renders), but not on committed ones,
// so this holds for every test whatever misses it allows in `reads`.
afterEach(() => {
  expect(avoidableMisses(committed)).toBe(0);
});

describeConcurrent.each([1, 2])(
  'memoization under concurrent rendering, %i consumer(s)',
  consumers => {
    // While a transition is pending, React renders the urgent lane without its
    // update and retries the transition with it, so a list alternates between
    // the committed rows and the transition's rows.

    it('urgent re-renders during a pending transition', async () => {
      const { getByTestId } = mount(consumers);
      beginTransition('5', 'X');
      expect(getByTestId('pending').textContent).toBe('true');
      for (let i = 0; i < 5; i++) act(() => typeText(`typed ${i}`));
      await finishTransition('X');
      expect(getByTestId('pending').textContent).toBe('false');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('urgent writes to other entities during a pending transition', async () => {
      const { getByTestId } = mount(consumers);
      beginTransition('5', 'X');
      for (let i = 0; i < 5; i++) writeNote(i);
      expect(getByTestId('pending').textContent).toBe('true');
      await finishTransition('X');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('urgent writes to a listed row during a pending transition', async () => {
      // React reapplies every update queued after the transition's on each
      // render, so each render reads new rows and none can hit.
      mount(consumers);
      beginTransition('5', 'X');
      for (let i = 0; i < 5; i++) {
        act(() => writeTodo('7', `urgent ${i}`));
      }
      await finishTransition('X');
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('two pending transitions with urgent writes between', async () => {
      mount(consumers);
      beginTransition('5', 'X');
      writeNote(0);
      beginTransition('6', 'Y');
      for (let i = 1; i < 5; i++) writeNote(i);
      await finishTransition('X');
      writeNote(5);
      await finishTransition('Y');
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('overlapping optimistic updates rolled back out of order', async () => {
      mount(consumers);
      beginOptimistic('3', 'A');
      writeNote(0);
      beginOptimistic('4', 'B');
      writeNote(1);
      await rollBack('3', 'A');
      writeNote(2);
      await rollBack('4', 'B');
      writeNote(3);
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('an optimistic update rolled back during a pending transition', async () => {
      mount(consumers);
      beginOptimistic('3', 'A');
      writeNote(0);
      beginTransition('5', 'X');
      for (let i = 1; i < 4; i++) writeNote(i);
      await rollBack('3', 'A');
      for (let i = 4; i < 7; i++) writeNote(i);
      await finishTransition('X');
      writeNote(7);
      expect(avoidableMisses(reads)).toBe(0);
    });

    // After a transition commits, the committed rows are a new version. Reads
    // of it must keep returning the same list, however many re-renders and
    // other transitions come in between.

    it('urgent re-renders during a second transition, after the first committed', async () => {
      const { getByTestId } = mount(consumers);
      beginTransition('5', 'X');
      for (let i = 0; i < 3; i++) act(() => typeText(`a${i}`));
      await finishTransition('X');
      expect(getByTestId('pending').textContent).toBe('false');
      beginTransition('6', 'Y');
      for (let i = 0; i < 3; i++) act(() => typeText(`b${i}`));
      await finishTransition('Y');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      // reads of versions already seen must return the same object, however
      // many re-renders came in between
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('reads outside render during optimistic updates, across a resolved mutation', async () => {
      mount(consumers);
      beginOptimistic('3', 'A');
      readRaw();
      writeNote(0);
      readRaw();
      // the mutation resolves: row 3 has a new committed version
      await resolveOptimistic('3', 'A');
      beginOptimistic('4', 'B');
      readRaw();
      writeNote(1);
      readRaw();
      writeNote(2);
      readRaw();
      await rollBack('4', 'B');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('urgent writes to other entities during a second transition, after the first committed', async () => {
      // every urgent write changes the store but not the list's rows, so
      // every read of the same rows must return the same list
      mount(consumers);
      beginTransition('5', 'X');
      for (let i = 0; i < 3; i++) writeNote(i);
      await finishTransition('X');
      beginTransition('6', 'Y');
      for (let i = 3; i < 8; i++) writeNote(i);
      await finishTransition('Y');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('urgent re-renders during a pending transition, after two committed writes to a row', async () => {
      mount(consumers);
      act(() => {
        writeTodo('9', 'v2');
      });
      act(() => {
        writeTodo('9', 'v3');
      });
      beginTransition('5', 'X');
      for (let i = 0; i < 3; i++) act(() => typeText(`a${i}`));
      await finishTransition('X');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      // reads of versions already seen must return the same object, however
      // many re-renders came in between
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('a single-entity read whose nested child each transition retry rewrites', async () => {
      // single-entity read: the parent stays the same while a nested child changes
      mount(consumers, true);
      act(() => writeOwner('v2'));
      act(() => writeOwner('v3'));
      act(() => {
        startTransition(() => {
          writeOwner('from transition');
          showDetail('X');
        });
      });
      for (let i = 0; i < 3; i++) act(() => typeText(`a${i}`));
      await finishTransition('X');
      // project and list version strings never collide, so one check covers both
      expect(avoidableMisses(reads)).toBe(0);
    });

    // Optimistic updates stack: each one rebuilds the entities it touches on
    // every store change, so only the store from before all of them can be
    // read again. However many are in flight, settling the last one must
    // return to that result, and the list must show the right rows.

    const SCRAMBLED = [3, 7, 1, 9, 0, 5, 2, 8, 4, 6];

    /** Optimistic edits `start`..`start + count - 1`, edit i to row 10 + i,
     * with an unrelated write after each. */
    function beginMany(count: number, start = 0) {
      for (let i = start; i < start + count; i++) {
        beginOptimistic(`${10 + i}`, `optimistic ${i}`);
        writeNote(100 + i);
      }
    }

    /** Titles the latest render showed. */
    function lastTitles() {
      const last = [...reads].reverse().find(r => r.who === 'render');
      return (last?.data as { title: string }[]).map(todo => todo.title);
    }

    it('ten optimistic updates in flight, rolled back out of order', async () => {
      mount(consumers);
      beginMany(10);
      for (const i of SCRAMBLED) {
        await rollBack(`${10 + i}`, `optimistic ${i}`);
        writeNote(200 + i);
      }
      expect(lastTitles()).toEqual(rows().map(row => row.title));
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('ten optimistic updates in flight, half resolved and half rolled back', async () => {
      mount(consumers);
      beginMany(10);
      for (const i of SCRAMBLED) {
        if (i % 2) await rollBack(`${10 + i}`, `optimistic ${i}`);
        else await resolveOptimistic(`${10 + i}`, `optimistic ${i}`);
        writeNote(200 + i);
      }
      expect(lastTitles()).toEqual(
        rows().map(({ id, title }) => {
          const i = Number(id) - 10;
          return i >= 0 && i < 10 && i % 2 === 0 ? `optimistic ${i}` : title;
        }),
      );
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('ten optimistic updates rolled back, after a transition committed and two later writes', async () => {
      mount(consumers);
      beginTransition('5', 'X');
      for (let i = 0; i < 3; i++) writeNote(i);
      await finishTransition('X');
      readRaw();
      writeNote(3);
      readRaw();
      beginMany(10);
      for (const i of SCRAMBLED) {
        await rollBack(`${10 + i}`, `optimistic ${i}`);
        readRaw();
      }
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('ten optimistic updates rolled back while a transition is pending', async () => {
      mount(consumers);
      beginMany(5);
      beginTransition('5', 'X');
      beginMany(5, 5);
      for (const i of SCRAMBLED) await rollBack(`${10 + i}`, `optimistic ${i}`);
      await finishTransition('X');
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('fifty optimistic updates in flight still settle to the right rows', async () => {
      mount(consumers);
      for (let i = 0; i < 50; i++)
        beginOptimistic(`${i % ROWS}`, `optimistic ${i}`);
      for (let i = 49; i >= 0; i -= 2)
        await rollBack(`${i % ROWS}`, `optimistic ${i}`);
      for (let i = 0; i < 50; i += 2)
        await rollBack(`${i % ROWS}`, `optimistic ${i}`);
      writeNote(0);
      expect(lastTitles()).toEqual(rows().map(row => row.title));
      expect(avoidableMisses(reads)).toBe(0);
    });
  },
);

/** Deterministic PRNG, so a bad seed can be replayed. */
const prng = (seed: number) => () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;

type Opt = { id: string; title: string };

/** Removes and returns a random element of `arr`. */
const takeRandom = <T,>(arr: T[], r: () => number): T =>
  arr.splice(Math.floor(r() * arr.length), 1)[0];

/** Settles one in-flight optimistic update: roll back, resolve as guessed,
 * or resolve with data the guess didn't predict. */
async function settleRandom({ id, title }: Opt, x: number) {
  if (x < 1 / 3) await rollBack(id, title);
  else if (x < 2 / 3) await resolveOptimistic(id, title);
  else await settle(updateKey(id, title), { id, title: `server ${title}` });
}

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

// Random interleavings of everything above, many store versions in flight.
// Every version stays readable until its update settles, so no read of a
// version already read may get a new result.
describeConcurrent('memoization under random concurrent churn', () => {
  it.each(SEEDS)('seed %i', async seed => {
    mount((seed % 3) + 1, true);
    const r = prng(seed);
    const opts: Opt[] = [];
    const trans: string[] = [];
    let o = 0;
    let t = 0;
    for (let step = 0; step < 100; step++) {
      const x = r();
      if (x < 0.22 && opts.length < 16) {
        // few rows, so updates often layer on the same row
        const opt = {
          id: `${Math.floor(r() * 3)}`,
          title: `s${seed}o${o++}`,
        };
        beginOptimistic(opt.id, opt.title);
        opts.push(opt);
      } else if (x < 0.32 && trans.length < 8) {
        const id = `s${seed}T${t++}`;
        beginTransition(`${Math.floor(r() * 4)}`, id);
        trans.push(id);
      } else if (x < 0.47 && opts.length) {
        await settleRandom(takeRandom(opts, r), r());
      } else if (x < 0.57 && trans.length) {
        await finishTransition(takeRandom(trans, r));
      } else if (x < 0.72) {
        act(() => typeText(`s${seed}k${step}`));
      } else if (x < 0.8) {
        writeNote(note++);
      } else if (x < 0.88) {
        act(() => writeOwner(`s${seed}w${step}`));
      } else {
        readRaw();
      }
    }
    while (opts.length || trans.length) {
      if (opts.length && (!trans.length || r() < 0.5)) {
        await settleRandom(takeRandom(opts, r), r());
      } else {
        await finishTransition(takeRandom(trans, r));
      }
      readRaw();
    }
    expect(avoidableMisses(reads)).toBe(0);
  });
});
