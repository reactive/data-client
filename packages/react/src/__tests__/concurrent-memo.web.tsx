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
import React, { Suspense, useState, useTransition, version } from 'react';

import useCacheState from '../hooks/useCacheState';

/**
 * Memoization under concurrent rendering. Every read of the list records the
 * entity versions it read and the result it got. A read of versions an
 * earlier read already saw, that gets a different result, is a miss that
 * caching more would have avoided (the old dependency chain kept every
 * version whose entities were alive).
 */

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const describeConcurrent = LegacyReact ? describe.skip : describe;

class Note extends Entity {
  id = '';
  text = '';
}

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
const updateTodo = new Endpoint(
  ({ id, title }: { id: string; title: string }) =>
    hold(`update ${id} ${title}`),
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
const idOf = (o: object | undefined) => {
  if (!o) return -1;
  let id = ids.get(o);
  if (id === undefined) {
    id = nextId++;
    ids.set(o, id);
  }
  return id;
};

/** Every read of the list: entity versions read, result identity, reader. */
type Read = { versions: string; data: unknown; who: string };
let reads: Read[] = [];
const versionsOf = (table: Record<string, object>, todos: { id: string }[]) =>
  todos.map(todo => idOf(table[todo.id])).join(',');

function List() {
  const todos = useSuspense(getTodoList);
  const state = useCacheState();
  const table = (state.entities[Todo.key] ?? {}) as Record<string, object>;
  reads.push({
    versions: versionsOf(table, todos),
    data: todos,
    who: 'render',
  });
  return <div>{todos.length}</div>;
}

function Detail({ id }: { id: string }) {
  const todo = useSuspense(getDetail, { id });
  return <div>{todo.title}</div>;
}

let controller: ReturnType<typeof useController>;
let startTransition: (fn: () => void) => void;
let showDetail: (id: string) => void;
let typeText: (text: string) => void;

function App({ consumers }: { consumers: number }) {
  controller = useController();
  const [detail, setDetail] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [isPending, start] = useTransition();
  startTransition = start;
  showDetail = id => setDetail(ids => [...ids, id]);
  typeText = setText;
  return (
    <div>
      <span data-testid="pending">{String(isPending)}</span>
      <span>{text}</span>
      <Suspense fallback={<p>loading list</p>}>
        {Array.from({ length: consumers }, (_, i) => (
          <List key={i} />
        ))}
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
  const table = (state.entities[Todo.key] ?? {}) as Record<string, object>;
  reads.push({ versions: versionsOf(table, data as any), data, who: 'raw' });
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

function trace(name: string) {
  if (!process.env.MEMO_TRACE) return;
  const label = new Map<string, number>();
  const seq = reads.map(r => {
    if (!label.has(r.versions)) label.set(r.versions, label.size);
    return `${r.who === 'raw' ? 'R' : ''}v${label.get(r.versions)}:d${idOf(r.data as object)}`;
  });
  console.log(
    `${name}: ${reads.length} reads, ${label.size} versions, ${flipBacks(reads)} flip-backs, ${avoidableMisses(reads)} avoidable misses\n${seq.join(' ')}`,
  );
}

function mount(consumers: number) {
  return render(
    <DataProvider
      initialState={mockInitialState([
        { endpoint: getTodoList, args: [], response: rows() },
      ])}
      devButton={null}
      managers={noDevManagers}
    >
      <App consumers={consumers} />
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

async function finishTransition(id: string) {
  await act(async () => {
    pending[id].resolve({ id, title: 'detail' });
  });
}

const writeNote = (i: number) =>
  act(() => {
    controller.setResponse(
      getNote,
      { id: `${i}` },
      {
        id: `${i}`,
        text: `note ${i}`,
      },
    );
  });

function beginOptimistic(id: string, title: string) {
  act(() => {
    controller.fetch(updateTodo, { id, title }).catch(() => {});
  });
}

async function rollBack(id: string, title: string) {
  await act(async () => {
    pending[`update ${id} ${title}`].reject(new Error('rejected'));
  });
}

async function resolveOptimistic(id: string, title: string) {
  await act(async () => {
    pending[`update ${id} ${title}`].resolve({ id, title });
  });
}

describeConcurrent.each([1, 2])(
  'memoization under concurrent rendering, %i consumer(s)',
  consumers => {
    beforeEach(() => {
      reads = [];
      for (const key of Object.keys(pending)) delete pending[key];
    });

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
      trace('typing');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('urgent writes to other entities during a pending transition', async () => {
      const { getByTestId } = mount(consumers);
      beginTransition('5', 'X');
      for (let i = 0; i < 5; i++) writeNote(i);
      expect(getByTestId('pending').textContent).toBe('true');
      await finishTransition('X');
      trace('other entity writes');
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
      trace('listed row writes');
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
      trace('two transitions');
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
      trace('optimistic out of order');
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
      trace('optimistic during transition');
      expect(avoidableMisses(reads)).toBe(0);
    });

    // After a transition commits, the committed rows are a new version. The
    // memo only sees it again when a read reaches it: useSuspense serves
    // urgent re-renders with an unchanged store from its own useMemo.

    it('urgent re-renders during a second transition, after the first committed', async () => {
      const { getByTestId } = mount(consumers);
      beginTransition('5', 'X');
      for (let i = 0; i < 3; i++) act(() => typeText(`a${i}`));
      await finishTransition('X');
      expect(getByTestId('pending').textContent).toBe('false');
      // the store moved on: the committed rows now include row 5's new version
      beginTransition('6', 'Y');
      for (let i = 0; i < 3; i++) act(() => typeText(`b${i}`));
      await finishTransition('Y');
      trace('second transition');
      expect(flipBacks(reads)).toBeGreaterThan(0);
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
      trace('raw reads across a resolved mutation');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('urgent writes to other entities during a second transition, after the first committed', async () => {
      // every urgent write changes the state object, so useSuspense re-queries
      // the memo; the list's rows are unchanged and the old chain would hit
      mount(consumers);
      beginTransition('5', 'X');
      for (let i = 0; i < 3; i++) writeNote(i);
      await finishTransition('X');
      beginTransition('6', 'Y');
      for (let i = 3; i < 8; i++) writeNote(i);
      await finishTransition('Y');
      trace('other entity writes during a second transition');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });

    it('the same pattern as the existing typing test, after two committed writes to a row', async () => {
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
      trace('typing after two committed writes');
      expect(flipBacks(reads)).toBeGreaterThan(0);
      expect(avoidableMisses(reads)).toBe(0);
    });
  },
);
