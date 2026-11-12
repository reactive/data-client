jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  const flushSync = jest.fn((...args: any[]) => actual.flushSync(...args));
  return { ...actual, flushSync, default: { ...actual, flushSync } };
});
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const useSyncExternalStore = jest.fn((...args: any[]) =>
    actual.useSyncExternalStore(...args),
  );
  const wrapped = { ...actual, useSyncExternalStore };
  return { ...wrapped, default: wrapped };
});

import {
  defaultServer,
  expectKept,
  expectWoken,
  inBrowser,
  runCell,
  runLanes,
  serverHalf,
  socketWrite,
  splitServerWrites,
  srvSteps,
  deliverB,
} from '__tests__/g1Cells';
import type { PageOptions, Variant } from '__tests__/g1Cells';
import { messagesOf, until } from '__tests__/splitEnvHarness';
import { quiet } from '__tests__/streamBrowser';

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

describeReact19('G1: the shield inside the real AsyncBoundary', () => {
  it('G1/publish-transition', async () => {
    const r = await runCell('shield', 'publish-transition');
    expectKept(r, 1);
    expect(r.aAfterWrites).toBe('a@2');
    expect(r.bText).toBe('a@2b2');
  });

  it('G1/socket-default', async () => {
    const r = await runCell('shield', 'socket-default');
    expectKept(r, 10);
    expect(r.aAfterWrites).toBe('socket-10');
  });

  it('G1/socket-transition', async () => {
    const r = await runCell('shield', 'socket-transition');
    expectKept(r, 10);
    expect(r.aAfterWrites).toBe('socket-10');
  });

  it('G1/interleaved', async () => {
    const r = await runCell('shield', 'interleaved');
    expectKept(r, 10);
    // The merge keeps whichever of the last two writes has the later
    // fetchedAt; the server's clock is shifted onto the client's, so it varies
    expect(['srv-5', 'socket-5']).toContain(r.aAfterWrites);
    expect(r.aAfterWrites).toBe(r.aStore);
  });

  it('G1/revealed-not-hydrated', async () => {
    const server = await serverHalf(fx => ({
      steps: [fx.resolveGroup('b'), ...srvSteps(fx), fx.resolveGroup('c')],
    }));
    const bFlush = server.with('b');
    const { writes } = splitServerWrites(server.with('c'));
    expect(writes).toHaveLength(5);
    const r = await inBrowser(async (b, finish) => {
      let resolveCode!: () => void;
      const lazyB = new Promise<void>(resolve => {
        resolveCode = resolve;
      });
      const page = b.fx.createClientPage({ lazyB });
      await b.start(page, server.shell);
      b.probe.resetCommits();
      b.script(bFlush);
      const streamed = b.html(bFlush, 'b');
      await until(
        () =>
          !b.pending('B:0') &&
          b.byTestId('b') === streamed &&
          !b.container.querySelector('[id="S:0"]'),
        'B revealed',
      );
      await quiet(b);
      const revealedUnhydrated = !page.log.commits.includes('b');
      let nodeKept = true;
      let fallbackShown = false;
      const check = async () => {
        await quiet(b);
        if (!b.container.contains(streamed!)) nodeKept = false;
        if (b.container.textContent?.includes('loading b'))
          fallbackShown = true;
      };
      for (let k = 0; k < 5; k++) {
        b.push([writes[k]]);
        await check();
        socketWrite(b, page, `socket-${k + 1}`);
        await check();
      }
      resolveCode();
      await until(() => page.log.commits.includes('b'), 'B hydrated');
      return {
        revealedUnhydrated,
        nodeKept,
        fallbackShown,
        adopted: b.byTestId('b') === streamed,
        ...(await finish(page)),
      };
    });
    expect(r.revealedUnhydrated).toBe(true);
    expect(r.nodeKept).toBe(true);
    expect(r.fallbackShown).toBe(false);
    expect(r.adopted).toBe(true);
    expect(r.errors).toBe(0);
    expect(r.fetches).toEqual([]);
    expect(r.immediateCommits).toBe(0);
    expect(r.flushSyncCalls).toBe(0);
  });

  it('G1/lanes', async () => {
    const r = await runLanes('hold');
    expect(r).toEqual({
      // published in a transition: A's boundary keeps its content while the
      // piece's render suspends; at default lane it would show its fallback
      aWhileHeld: 'a@1',
      fallbackA: false,
      // the socket write keeps its default lane: shown at once
      socketShown: 'socket-1',
      aAfterSocket: 'a@1',
      aAfterRelease: 'srv-1+resolved',
      lanesAfterRelease: 'socket-1',
      pending: { b: true, c: true },
      errors: 0,
      fetches: [],
      immediateCommits: 0,
      flushSyncCalls: 0,
      detectorOnly: true,
    });
  });

  /**
   * `b-commit` publishes the first piece from B's layout effect, before B's
   * scope joins live state; B's scope still provides the pinned snapshot.
   */
  async function runNested(
    firstPiece: 'after-hydration' | 'b-commit',
    variant: Variant = 'shield',
  ) {
    const server = await serverHalf(fx => ({
      nested: true,
      steps: [
        fx.resolveGroup('b'),
        ...srvSteps(fx),
        fx.resolveGroup('d'),
        fx.resolveGroup('c'),
      ],
    }));
    const bFlush = server.with('b');
    const dFlush = server.with('d');
    const { writes, rest } = splitServerWrites(dFlush);
    expect(writes).toHaveLength(5);
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage({ nested: true, variant });
      page.log.states = {};
      await b.start(page, server.shell);
      b.probe.resetCommits();
      b.script(bFlush);
      let pushedAtCommit = false;
      let dTemplate: string | undefined;
      if (firstPiece === 'b-commit') {
        const commits = page.log.commits;
        const push = commits.push.bind(commits);
        commits.push = (...names: string[]) => {
          if (names.includes('b') && !pushedAtCommit) {
            pushedAtCommit = true;
            dTemplate = b.templateOf('loading d');
            b.push([writes[0]]);
          }
          return push(...names);
        };
      }
      const bAdopted = await deliverB(b, page, bFlush);
      dTemplate ??= b.templateOf('loading d');
      expect(dTemplate).toBeDefined();
      // D's fate is set by the transitions after B's commit; React renders
      // pending transitions together, so none commits after B's join
      await until(
        () =>
          page.log.states!.b?.at(-1)?.deref() ===
          page.controller.current!.getState(),
        'B joined',
      );
      let writesWhileDPending = 0;
      const count = async () => {
        await quiet(b);
        if (b.pending(dTemplate!)) writesWhileDPending++;
      };
      for (let k = 0; k < 5; k++) {
        if (!(k === 0 && pushedAtCommit)) b.push([writes[k]]);
        await count();
        socketWrite(b, page, `socket-${k + 1}`);
        await count();
      }
      const dRendered = page.log.renders.includes('d');
      b.push(rest);
      await quiet(b);
      const dPendingBeforeHtml = b.pending(dTemplate!);
      const streamed = b.html(dFlush, 'd');
      await until(() => page.log.commits.includes('d'), 'D hydrated').catch(
        () => {},
      );
      return {
        bAdopted,
        writesWhileDPending,
        dRendered,
        dPendingBeforeHtml,
        dAdopted: b.byTestId('d') === streamed,
        pushedAtCommit,
        ...(await finish(page)),
      };
    });
    expect(r.pushedAtCommit).toBe(firstPiece === 'b-commit');
    return r;
  }

  async function expectNestedKept(firstPiece: 'after-hydration' | 'b-commit') {
    const r = await runNested(firstPiece);
    expect(r.bAdopted).toBe(true);
    expect(r.writesWhileDPending).toBe(10);
    expect(r.dRendered).toBe(false);
    expect(r.dPendingBeforeHtml).toBe(true);
    expect(r.dAdopted).toBe(true);
    expect(r.errors).toBe(0);
    expect(r.fetches).toEqual([]);
    expect(r.immediateCommits).toBe(0);
    expect(r.flushSyncCalls).toBe(0);
  }

  it('G1/nested', () => expectNestedKept('after-hydration'));

  it('G1/nested-before-join', () => expectNestedKept('b-commit'));

  it('G1/control-nested-same-identity', async () => {
    // A scope whose value stays the snapshot object while the outer state changes
    const r = await runNested('b-commit', 'held');
    expect(r.bAdopted).toBe(true);
    expect(r.writesWhileDPending).toBe(0);
    expect(r.dPendingBeforeHtml).toBe(false);
    expect(r.dAdopted).toBe(false);
    expect(r.fetches).toEqual(['getList {"group":"d"}']);
  });

  /**
   * S and O read no state; O holds I, which reads in a boundary of its own.
   * `unpinned` drops S's and O's pins from the shell's script, which is what a
   * server that pins a boundary only on its first read sends.
   */
  async function runNoRead(unpinned: boolean) {
    const server = await serverHalf(() => ({ noRead: true }));
    const shellPins = messagesOf(server.shell.script).filter(
      m => m.t === 'pin',
    ) as { id: string }[];
    const noReadIds = shellPins
      .map(pin => pin.id)
      .filter(id => !server.reads.get(id));
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage({ noRead: true });
      b.shell(
        server.shell,
        unpinned ?
          m => !(m.t === 'pin' && noReadIds.includes(m.id))
        : undefined,
      );
      const names = ['s', 'o', 'i'] as const;
      const streamed = names.map(name => b.byTestId(name));
      b.hydrate(page.element);
      await until(() => page.log.commits.includes('a'), 'A hydrated');
      await quiet(b);
      const ledger = page.ledger();
      const beforeEnd = {
        ended: ledger.ended,
        hydrated: names.filter(name => page.log.commits.includes(name)),
      };
      for (const flush of server.flushes.slice(1)) {
        b.script(flush);
        b.html(flush);
      }
      await until(
        () => names.every(name => page.log.commits.includes(name)),
        'S, O and I hydrated',
      );
      await quiet(b);
      return {
        beforeEnd,
        adopted: names.filter((name, i) => b.byTestId(name) === streamed[i]),
        ...(await finish(page)),
      };
    });
    return { noReadIds, ...r };
  }

  it('G1/no-read-boundary', async () => {
    const r = await runNoRead(false);
    expect(r).toEqual({
      noReadIds: [expect.any(String), expect.any(String)],
      beforeEnd: { ended: false, hydrated: ['s', 'o', 'i'] },
      adopted: ['s', 'o', 'i'],
      errors: 0,
      fetches: [],
      immediateCommits: 0,
      flushSyncCalls: 0,
      detectorOnly: true,
    });
  });

  it('G1/control-no-read-unpinned', async () => {
    const r = await runNoRead(true);
    expect(r.noReadIds).toHaveLength(2);
    // they wait for the end of the stream, and I waits inside O
    expect(r.beforeEnd).toEqual({ ended: false, hydrated: [] });
    expect(r.adopted).toEqual(['s', 'o', 'i']);
    expect(r.errors).toBe(0);
  });

  it('G1/boundary-ids-match', async () => {
    const server = await serverHalf(fx => ({
      noRead: true,
      nested: true,
      steps: [fx.resolveGroup('b'), fx.resolveGroup('d'), fx.resolveGroup('c')],
    }));
    const pins = server.flushes
      .flatMap(f => messagesOf(f.script))
      .filter(m => m.t === 'pin') as { id: string; p?: string }[];
    const serverIds = [...new Set(pins.map(pin => pin.id))].sort();
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage({ noRead: true, nested: true });
      const ledger = page.ledger();
      const commit = ledger.commit.bind(ledger);
      const committed: [string, boolean][] = [];
      ledger.commit = (id, hydrated) => {
        committed.push([id, hydrated]);
        commit(id, hydrated);
      };
      await b.start(page, server.shell);
      for (const flush of server.flushes.slice(1)) {
        b.script(flush);
        b.html(flush);
      }
      await until(
        () => ['b', 'c', 'd', 'i'].every(n => page.log.commits.includes(n)),
        'every island hydrated',
      );
      await quiet(b);
      return { committed, stats: ledger.stats(), ...(await finish(page)) };
    });
    // A, B, C, D, S, O and I: every boundary the server pinned hydrated on
    // its own id, once
    expect(serverIds).toHaveLength(7);
    expect(r.committed.every(([, hydrated]) => hydrated)).toBe(true);
    expect(r.committed.map(([id]) => id).sort()).toEqual(serverIds);
    expect(r.stats).toEqual({ pieces: 0, pins: 0, unknown: 0 });
    expect(r.errors).toBe(0);
    expect(r.fetches).toEqual([]);
  });

  /** Shield and Scope renders over 10 socket writes, before and after N mounts on the client */
  async function quietRenders(variant: Variant) {
    const server = await serverHalf(() => ({ mountN: {} }));
    return inBrowser(async (b, finish) => {
      const handle: { current?: () => void } = {};
      const page = b.fx.createClientPage({ mountN: handle, variant });
      await b.start(page, server.shell);
      for (const flush of server.flushes.slice(1)) {
        b.script(flush);
        b.html(flush);
      }
      await until(
        () => ['b', 'c'].every(name => page.log.commits.includes(name)),
        'B and C hydrated',
      );
      await quiet(b);
      let k = 0;
      const tenWrites = async () => {
        b.probe.resetRenders();
        for (let i = 0; i < 10; i++) {
          socketWrite(b, page, `quiet-${++k}`);
          // each write renders on its own
          await until(() => b.text('a') === `quiet-${k}`, `write ${k} shown`);
        }
        await quiet(b);
        const count = (name: string) => b.probe.renders.get(name) ?? 0;
        return {
          Shield: count('Shield'),
          Scope: count('Scope'),
          IslandA: count('IslandA'),
        };
      };
      const joined = await tenWrites();
      handle.current!();
      await until(() => page.log.commits.includes('n'), 'N mounted');
      await quiet(b);
      const withN = await tenWrites();
      return { joined, withN, a: b.text('a'), ...(await finish(page)) };
    });
  }

  it('F2/quiet-after-join', async () => {
    const r = await quietRenders('shield');
    // A, B and C hydrated on pins: each scope reads live state once per write
    expect(r.joined.Scope).toBe(30);
    // and each shield at most once
    expect(r.joined.Shield).toBeLessThanOrEqual(30);
    // N mounted on the client: its shield and scope never render again
    expect(r.withN).toEqual(r.joined);
    expect(r.a).toBe('quiet-20');
    expect(r.errors).toBe(0);
    expect(r.immediateCommits).toBe(0);
  });

  it('F2/quiet-after-join without the adapter', async () => {
    const r = await quietRenders('none');
    expect(r.joined).toEqual({ Shield: 0, Scope: 0, IslandA: 10 });
    expect(r.withN).toEqual(r.joined);
  });

  it('G1/seeded-record-updates', async () => {
    const server = await defaultServer();
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage();
      await b.start(page, server.shell);
      const ledger = page.ledger();
      const seeded: any =
        page.controller.current!.getState().entities.Todo!['1'];
      b.script(server.with('b'));
      await quiet(b);
      const state = page.controller.current!.getState();
      const record: any = state.entities.Todo!['1'];
      const now = Date.now();
      return {
        seededPlaced: ledger.placed.has(seeded),
        replaced: record !== seeded && ledger.placed.has(record),
        title: record.title,
        aText: b.text('a'),
        staleMetas: Object.values(state.meta).filter(
          (meta: any) => meta.expiresAt <= now,
        ).length,
        ...(await finish(page)),
      };
    });
    expect(r.seededPlaced).toBe(true);
    expect(r.replaced).toBe(true);
    expect(r.title).toBe('a@2');
    expect(r.aText).toBe('a@2');
    expect(r.staleMetas).toBe(0);
    expect(r.fetches).toEqual([]);
  });

  it('G1/woken-reads-live', async () => {
    const wake: PageOptions['wakeB'] = { current: undefined };
    const server = await serverHalf(() => ({ wakeB: { current: undefined } }));
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage({ wakeB: wake });
      await b.start(page, server.shell);
      b.script(server.with('b'));
      await quiet(b);
      const pendingBeforeWake = b.pending('B:0');
      wake.current!();
      await until(() => page.log.commits.includes('b'), 'B committed');
      await quiet(b);
      return {
        pendingBeforeWake,
        pendingAfterWake: b.pending('B:0'),
        bText: b.text('b'),
        renders: page.log.renders.filter(n => n === 'b').length,
        ...(await finish(page)),
      };
    });
    expect(r.pendingBeforeWake).toBe(true);
    expect(r.pendingAfterWake).toBe(false);
    // live state: the piece published before the wake
    expect(r.bText).toBe('a@2b2');
    expect(r.fetches.length).toBeLessThanOrEqual(1);
    expect(r.renders).toBeLessThan(5);
  });

  describe('G1/control-no-adapter', () => {
    it('publish-transition', async () => {
      expectWoken(await runCell('none', 'publish-transition'));
    });
    it('socket-default', async () => {
      expectWoken(await runCell('none', 'socket-default'));
    });
  });

  describe('G1/control-scope-only', () => {
    it('publish-transition', async () => {
      expectWoken(await runCell('scope-only', 'publish-transition'));
    });
    it('socket-default', async () => {
      expectWoken(await runCell('scope-only', 'socket-default'));
    });
  });

  describe('G1/frozen-parity', () => {
    it('publish-transition', async () => {
      const r = await runCell('frozen', 'publish-transition');
      expectKept(r, 1);
      expect(r.aAfterWrites).toBe('a@2');
    });
    it('socket-default', async () => {
      const r = await runCell('frozen', 'socket-default');
      expectKept(r, 10);
      expect(r.aAfterWrites).toBe('socket-10');
    });
  });
});
