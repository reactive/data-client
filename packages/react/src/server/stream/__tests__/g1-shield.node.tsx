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
  serverHalf,
  socketWrite,
  splitServerWrites,
  srvSteps,
  deliverB,
} from '__tests__/g1Cells';
import type { PageOptions, Variant } from '__tests__/g1Cells';
import { settle, until } from '__tests__/splitEnvHarness';
import type { LanesHandle } from '__tests__/streamFixtures';

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
      await settle(30);
      const revealedUnhydrated = !page.log.commits.includes('b');
      let nodeKept = true;
      let fallbackShown = false;
      const check = async () => {
        await settle(10);
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

  /**
   * `behind`: an application transition whose reader suspends is pending when
   * the piece arrives. `hold`: A's island suspends while it shows the piece, in
   * a boundary that is already showing content.
   */
  async function runLanes(mode: 'hold' | 'behind') {
    const server = await serverHalf(fx => ({
      lanes: {},
      steps: [fx.serverWrite(1), fx.resolveGroup('b'), fx.resolveGroup('c')],
    }));
    const { writes } = splitServerWrites(server.with('b'));
    expect(writes).toHaveLength(1);
    return inBrowser(async (b, finish) => {
      let releaseA!: () => void;
      const lanes: LanesHandle = {};
      if (mode === 'hold')
        lanes.holdA = new Promise<void>(resolve => {
          releaseA = resolve;
        });
      const page = b.fx.createClientPage({ lanes });
      await b.start(page, server.shell);
      b.probe.resetCommits();
      if (mode === 'behind') {
        lanes.start!();
        await settle(30);
      }
      b.push(writes);
      await settle(30);
      const aWhileHeld = b.text('a');
      const fallbackA = b.container.textContent!.includes('loading a');
      page.controller.current!.setResponse(
        page.endpoints.getTodo,
        { id: 'sock' },
        { id: 'sock', title: 'socket-1' },
      );
      await settle(30);
      const socketShown = b.text('lanes');
      const aAfterSocket = b.text('a');
      if (mode === 'hold') releaseA();
      else lanes.release!();
      await settle(50);
      return {
        aWhileHeld,
        fallbackA,
        socketShown,
        aAfterSocket,
        aAfterRelease: b.text('a'),
        lanesAfterRelease: b.text('lanes'),
        pending: { b: b.pending('B:0'), c: b.pending('B:1') },
        ...(await finish(page)),
      };
    });
  }

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

  // recorded: React renders a transition apart from one that suspended on
  // another lane, so the piece does not wait for the application's transition
  it('G1/lanes-behind-app-transition (recorded)', async () => {
    const r = await runLanes('behind');
    expect(r).toEqual({
      aWhileHeld: 'srv-1',
      fallbackA: false,
      socketShown: 'socket-1',
      aAfterSocket: 'srv-1',
      aAfterRelease: 'srv-1',
      lanesAfterRelease: 'socket-1+resolved',
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
      let writesWhileDPending = 0;
      const count = async () => {
        await settle(10);
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
      await settle(20);
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

  it('G1/seeded-record-updates', async () => {
    const server = await defaultServer();
    const r = await inBrowser(async (b, finish) => {
      const page = b.fx.createClientPage();
      await b.start(page, server.shell);
      const ledger = page.ledger();
      const seeded: any =
        page.controller.current!.getState().entities.Todo!['1'];
      b.script(server.with('b'));
      await settle(30);
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
      await settle(30);
      const pendingBeforeWake = b.pending('B:0');
      wake.current!();
      await until(() => page.log.commits.includes('b'), 'B committed');
      await settle(50);
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
