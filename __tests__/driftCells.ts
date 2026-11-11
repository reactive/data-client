/**
 * The drift page's cells, shared by the files that rerun them.
 */
import v8 from 'v8';
import vm from 'vm';

import type * as Drift from './driftFixtures';
import {
  installDom,
  loadServerHalf,
  messagesOf,
  settle,
  until,
} from './splitEnvHarness';
import { expectNoUnknownClass, loadBrowserHalf } from './streamBrowser';
import type { BrowserHalf } from './streamBrowser';
import type { LedgerCapture, LedgerFlush } from './streamingHarness';
import type { Ledger } from '../packages/react/src/server/stream';

export type DriftOptions = Drift.DriftOptions;

export async function driftServer(
  build: (drift: typeof Drift) => Parameters<typeof Drift.runDriftServer>[0],
) {
  const drift = loadServerHalf(
    () => require('./driftFixtures') as typeof Drift,
  );
  const { page, capture } = await drift.runDriftServer(build(drift));
  return {
    capture,
    reads: page.reads,
    finalState: JSON.stringify(page.stream.controller.getState()),
  };
}

export const pinsOf = (capture: LedgerCapture) =>
  capture.flushes
    .flatMap(f => messagesOf(f.script))
    .filter(m => m.t === 'pin') as { id: string; rev: number }[];

export const lastPins = (capture: LedgerCapture) => {
  const out = new Map<string, number>();
  for (const pin of pinsOf(capture)) out.set(pin.id, pin.rev);
  return out;
};

/** Id of the boundary whose HTML holds `testId`: the one pin in that flush */
export function pinIdOf(capture: LedgerCapture, testId: string) {
  const flush = capture.flushes.find(f =>
    f.html.includes(`data-testid="${testId}"`),
  )!;
  const pins = messagesOf(flush.script).filter(m => m.t === 'pin');
  expect(pins).toHaveLength(1);
  return pins[0].id as string;
}

export function pinOf(capture: LedgerCapture, testId: string) {
  const flush = capture.flushes.find(f =>
    f.html.includes(`data-testid="${testId}"`),
  )!;
  const pins = messagesOf(flush.script).filter(m => m.t === 'pin');
  expect(pins).toHaveLength(1);
  return pins[0] as { id: string; rev: number };
}

export const TEST_IDS = ['b1', 'b2', 'd', 'shell', 'layout'];

/** Every flush in order: its script (filtered by `keep`), then its HTML */
export async function deliverAll(
  b: BrowserHalf,
  capture: LedgerCapture,
  keep?: (message: any) => boolean,
  flushes: LedgerFlush[] = capture.flushes,
) {
  const found: Record<string, Element | undefined> = {};
  const [shell, ...rest] = flushes;
  b.shell(shell, keep);
  for (const testId of TEST_IDS)
    if (b.byTestId(testId)) found[testId] = b.byTestId(testId)!;
  for (const flush of rest) {
    b.script(flush, keep);
    const ids = TEST_IDS.filter(id =>
      flush.html.includes(`data-testid="${id}"`),
    );
    Object.assign(found, b.htmlFind(flush, ids));
  }
  await until(
    () => !/<!--\$[?~]-->/.test(b.container.innerHTML),
    'every boundary revealed',
  );
  return found;
}

export async function inBrowser<T>(
  run: (b: BrowserHalf) => Promise<T>,
): Promise<T> {
  const teardownDom = installDom();
  let b: BrowserHalf | undefined;
  try {
    b = loadBrowserHalf();
    const result = await run(b);
    expectNoUnknownClass();
    return result;
  } finally {
    b?.teardown();
    await teardownDom();
  }
}

export type ClientOptions = Parameters<typeof Drift.createDriftClientPage>[0];

/** The options that shape the server's tree, with handles of its own */
export function serverOptions(opts: ClientOptions = {}): DriftOptions {
  const handle = (h?: { initial?: 'visible' | 'hidden' }) =>
    h && { initial: h.initial };
  return {
    layout: opts.layout,
    invalidIfStale: opts.invalidIfStale,
    dataExpiryLength: opts.dataExpiryLength,
    activityB1: handle(opts.activityB1),
    activityH: handle(opts.activityH),
  };
}

export function clientPage(opts: ClientOptions = {}) {
  const drift = require('./driftFixtures') as typeof Drift;
  return drift.createDriftClientPage(opts);
}

export const firstText = (texts: string[] | undefined, name: string) =>
  texts?.find(t => t.startsWith(`${name}=`));

v8.setFlagsFromString('--expose-gc');
const gc: () => void = vm.runInNewContext('gc');
/** Several collections, each in its own job, so no WeakRef is kept by the current one */
export async function collect() {
  for (let i = 0; i < 3; i++) {
    await settle(10);
    gc();
  }
}

/** Records what the ledger builds and commits, holding built states weakly */
export function spyLedger(ledger: Ledger) {
  const target = ledger as any;
  const snapshots: { rev: number; ref: WeakRef<object> }[] = [];
  const folds: WeakRef<object>[] = [];
  const commits: string[] = [];
  const snapshot = target.snapshot.bind(ledger);
  const fold = target.fold.bind(ledger);
  const commit = target.commit.bind(ledger);
  target.snapshot = (rev: number) => {
    const state = snapshot(rev);
    snapshots.push({ rev, ref: new WeakRef(state) });
    return state;
  };
  target.fold = (rev: number) => {
    const state = fold(rev);
    folds.push(new WeakRef(state));
    return state;
  };
  target.commit = (id: string) => {
    commits.push(id);
    return commit(id);
  };
  return { snapshots, folds, commits };
}

export function joinOf(states: WeakRef<object>[], live: object) {
  const first = states[0].deref();
  return {
    pinnedBeforeJoin: first !== undefined && first !== live,
    liveAfterJoin: states[states.length - 1].deref() === live,
  };
}

/**
 * D1, then the join and the effect after it, on a quiet page, then `extraRenders`
 * socket writes that render the islands again
 */
export async function releaseAfterJoin(
  opts: ClientOptions = {},
  extraRenders = 0,
) {
  const { capture } = await driftServer(() => serverOptions(opts));
  return inBrowser(async b => {
    const page = clientPage(opts);
    const spy = spyLedger(page.ledger());
    const streamed = await deliverAll(b, capture);
    b.hydrate(page.element);
    await until(
      () => page.log.commits.includes('b1') && page.log.commits.includes('b2'),
      'B1 and B2 hydrated',
    );
    await until(() => b.text('b1') === 'BTC:101.5ETH:10', 'B1 joined');
    await settle(50);
    // no local of this async function may hold a state across the collection
    const pinned = {
      errors: b.errors.length,
      b1Adopted: b.byTestId('b1') === streamed.b1,
      b2Adopted: b.byTestId('b2') === streamed.b2,
      b1First: firstText(page.log.texts, 'b1'),
      b1: b.text('b1'),
      b2: b.text('b2'),
      fetches: page.fetches,
    };
    const result = {
      ...joinOf(page.log.states!.b1, page.controller.current!.getState()),
      pins: page.ledger().stats().pins,
      snapshotsBuilt: spy.snapshots.length,
    };
    for (let i = 0; i < extraRenders; i++) {
      page.controller.current!.setResponse(
        page.endpoints.getTicker,
        { id: 'BTC' },
        { id: 'BTC', price: 200 + i },
      );
      await settle(30);
    }
    await collect();
    return {
      pinned,
      release: {
        ...result,
        mounted: b.byTestId('b1') !== null && b.byTestId('b2') !== null,
        snapshotsRetained: spy.snapshots.filter(
          s => s.ref.deref() !== undefined,
        ).length,
      },
    };
  });
}

export const D1_PINNED = {
  errors: 0,
  b1Adopted: true,
  b2Adopted: true,
  b1First: 'b1=BTC:100ETH:10',
  b1: 'BTC:101.5ETH:10',
  b2: 'BTC:101.5',
  fetches: [],
};
export const R1_RELEASED = {
  pinnedBeforeJoin: true,
  liveAfterJoin: true,
  pins: 0,
  snapshotsBuilt: 2,
  mounted: true,
  snapshotsRetained: 0,
};
