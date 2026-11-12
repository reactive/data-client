/**
 * G1's page cells, shared by the files that rerun them. Callers mock `react-dom`'s
 * `flushSync` and React's `useSyncExternalStore` with `jest.fn` wrappers.
 */
import {
  installDom,
  loadServerHalf,
  messagesOf,
  settle,
  until,
} from './splitEnvHarness';
import { expectNoUnknownClass, loadBrowserHalf } from './streamBrowser';
import type { BrowserHalf } from './streamBrowser';
import type * as Fixtures from './streamFixtures';
import type { LedgerFlush } from './streamingHarness';

export type Variant = Fixtures.Variant;
export type PageOptions = Fixtures.PageOptions;

export interface ServerHalf {
  flushes: LedgerFlush[];
  shell: LedgerFlush;
  /** The flush whose HTML holds this test id */
  with(testId: string): LedgerFlush;
  /** Scoped `getState` calls of each boundary id over the whole request */
  reads: Map<string, number>;
}

export async function serverHalf(
  build: (fx: typeof Fixtures) => Parameters<typeof Fixtures.runServerPage>[0],
): Promise<ServerHalf> {
  const fx = loadServerHalf(
    () => require('./streamFixtures') as typeof Fixtures,
  );
  const { capture, page } = await fx.runServerPage(build(fx));
  const { flushes } = capture;
  return {
    reads: page.reads,
    flushes,
    shell: flushes[0],
    with(testId) {
      const flush = flushes.find(f =>
        f.html.includes(`data-testid="${testId}"`),
      );
      if (!flush) throw new Error(`no flush holds ${testId}`);
      return flush;
    },
  };
}
export const defaultServer = () => serverHalf(() => ({}));
export const srvSteps = (fx: typeof Fixtures) =>
  [1, 2, 3, 4, 5].map(fx.serverWrite);

/** Splits a script's messages into the server writes' pieces and the rest */
export function splitServerWrites(flush: LedgerFlush) {
  const messages = messagesOf(flush.script);
  const isWrite = (m: any) =>
    m.t === 'piece' &&
    /^srv-/.test(m.entities?.Todo?.['1']?.title ?? '') &&
    Object.keys(m.endpoints ?? {}).every(key => key.startsWith('getTodo'));
  return {
    writes: messages.filter(isWrite),
    rest: messages.filter(m => !isWrite(m)),
  };
}

export interface Outcome {
  pendingAfterWrites: { b: boolean; c: boolean };
  rendersBeforeHtml: string[];
  aAfterWrites: string | undefined;
  /** Title of A's record in live state when `aAfterWrites` was read */
  aStore: string | undefined;
  writesWhileBPending: number;
  adopted: boolean;
  bText: string | undefined;
  errors: number;
  fetches: string[];
  immediateCommits: number;
  flushSyncCalls: number;
  detectorOnly: boolean;
}

export type Page = ReturnType<typeof Fixtures.createClientPage>;

export async function inBrowser<T>(
  run: (b: BrowserHalf, finish: (page: Page) => Promise<Base>) => Promise<T>,
): Promise<T> {
  const teardownDom = installDom();
  let b: BrowserHalf | undefined;
  try {
    b = loadBrowserHalf();
    const flushSync = jest.mocked(
      (require('react-dom') as typeof import('react-dom')).flushSync,
    );
    const uses = jest.mocked(
      (require('react') as typeof import('react')).useSyncExternalStore,
    );
    flushSync.mockClear();
    uses.mockClear();
    const half = b;
    const finish = async (page: Page): Promise<Base> => {
      await settle(30);
      return {
        errors: half.errors.length,
        fetches: page.fetches,
        immediateCommits: half.probe.commits.filter(
          c => c.priority === half.probe.ImmediatePriority,
        ).length,
        flushSyncCalls: flushSync.mock.calls.length,
        detectorOnly: uses.mock.calls.every(
          call => (call[0] as any).name === 'neverNotify',
        ),
      };
    };
    const result = await run(b, finish);
    expectNoUnknownClass();
    return result;
  } finally {
    for (const timer of watchers) clearInterval(timer);
    watchers.clear();
    b?.teardown();
    await teardownDom();
  }
}
export type Base = Pick<
  Outcome,
  'errors' | 'fetches' | 'immediateCommits' | 'flushSyncCalls' | 'detectorOnly'
>;

export function socketWrite(
  b: BrowserHalf,
  page: Page,
  title: string,
  transition = false,
) {
  // A block body: a callback that returns the dispatch's promise makes the
  // transition an async action that waits for its own commit
  const write = () => {
    page.controller.current!.setResponse(
      page.endpoints.getTodo,
      { id: '1' },
      { id: '1', title },
    );
  };
  if (transition) b.React.startTransition(write);
  else write();
}

/** B's HTML arrives; resolves whether the streamed node is the one on screen once B commits */
export async function deliverB(b: BrowserHalf, page: Page, flush: LedgerFlush) {
  const streamed = b.html(flush, 'b');
  try {
    await until(() => page.log.commits.includes('b'), 'B hydrated', 1500);
  } catch {
    return false;
  }
  return streamed !== undefined && b.byTestId('b') === streamed;
}

export type Cell =
  'publish-transition' | 'socket-default' | 'socket-transition' | 'interleaved';

export async function runCell(
  variant: Variant,
  cell: Cell,
  opts: PageOptions = {},
): Promise<Outcome> {
  const server =
    cell === 'interleaved' ?
      await serverHalf(fx => ({
        steps: [...srvSteps(fx), fx.resolveGroup('b'), fx.resolveGroup('c')],
      }))
    : await defaultServer();
  const bFlush = server.with('b');
  return inBrowser(async (b, finish) => {
    const page = b.fx.createClientPage({ variant, ...opts });
    await b.start(page, server.shell);
    b.probe.resetCommits();
    const rendersBefore = page.log.renders.length;
    let writesWhileBPending = 0;
    // A wake renders after the write; a slow machine needs more than 10 ms
    const count = async () => {
      await settle(10);
      try {
        await until(() => !b.pending('B:0'), 'B woken', 50);
      } catch {
        writesWhileBPending++;
      }
    };

    if (cell === 'publish-transition') {
      b.script(bFlush);
      await settle(20);
      await count();
    } else if (cell === 'interleaved') {
      const { writes, rest } = splitServerWrites(bFlush);
      expect(writes).toHaveLength(5);
      for (let k = 0; k < 5; k++) {
        b.push([writes[k]]);
        await count();
        socketWrite(b, page, `socket-${k + 1}`);
        await count();
      }
      b.push(rest);
      await settle(20);
    } else {
      for (let i = 1; i <= 10; i++) {
        socketWrite(b, page, `socket-${i}`, cell === 'socket-transition');
        await count();
      }
    }
    const aAfterWrites = b.text('a');
    const aStore = (
      page.controller.current!.getState().entities.Todo?.['1'] as any
    )?.title;
    if (cell === 'socket-default' || cell === 'socket-transition') {
      b.script(bFlush);
      await settle(20);
    }
    const pendingAfterWrites = { b: b.pending('B:0'), c: b.pending('B:1') };
    const rendersBeforeHtml = page.log.renders.slice(rendersBefore);
    const adopted = await deliverB(b, page, bFlush);
    return {
      pendingAfterWrites,
      rendersBeforeHtml,
      aAfterWrites,
      aStore,
      writesWhileBPending,
      adopted,
      bText: b.text('b'),
      ...(await finish(page)),
    };
  });
}

export function expectKept(r: Outcome, writes: number) {
  expect(r.pendingAfterWrites).toEqual({ b: true, c: true });
  expect(r.rendersBeforeHtml.filter(n => n === 'b' || n === 'c')).toEqual([]);
  expect(r.writesWhileBPending).toBe(writes);
  expect(r.adopted).toBe(true);
  expect(r.errors).toBe(0);
  expect(r.fetches).toEqual([]);
  expect(r.immediateCommits).toBe(0);
  expect(r.flushSyncCalls).toBe(0);
  expect(r.detectorOnly).toBe(true);
}

export function expectWoken(r: Outcome) {
  expect(r.pendingAfterWrites.b).toBe(false);
  expect(r.writesWhileBPending).toBe(0);
  expect(r.adopted).toBe(false);
}

/** B's or C's list as live state has it: the titles its reader would render */
export function liveList(page: Page, group: string) {
  const state = page.controller.current!.getState();
  const ids = state.endpoints[page.endpoints.getList.key({ group })] as
    string[] | undefined;
  return ids?.map(id => (state.entities.Todo?.[id] as any)?.title).join('');
}

const watchers = new Set<ReturnType<typeof setInterval>>();
const shown = (el: Element | null | undefined) => {
  for (let n = el as HTMLElement | null; n; n = n.parentElement)
    if (n.hidden || n.style?.display === 'none') return false;
  return !!el;
};

/**
 * Samples, every 2 ms, what the user sees of island `testId`: each distinct
 * text it shows, and whether its fallback is painted after its content was visible
 */
export function watch(b: BrowserHalf, testId: string, fallbackText: string) {
  const seen: string[] = [];
  let contentVisible = false;
  let fallbackOverContent = false;
  const tick = () => {
    const el = b.byTestId(testId);
    if (shown(el)) {
      contentVisible = true;
      const text = el!.textContent ?? '';
      if (seen[seen.length - 1] !== text) seen.push(text);
    }
    const fallback = [...b.container.querySelectorAll('span')].some(
      span => span.textContent === fallbackText && shown(span),
    );
    if (fallback && contentVisible) fallbackOverContent = true;
  };
  tick();
  const timer = setInterval(tick, 2);
  watchers.add(timer);
  return {
    stop() {
      clearInterval(timer);
      watchers.delete(timer);
      tick();
      return { seen, fallbackOverContent };
    },
  };
}
