import {
  clientPage,
  deliverAll,
  driftServer,
  firstText,
  inBrowser,
  lastPins,
  pinIdOf,
  pinsOf,
} from '__tests__/driftCells';
import type { DriftOptions } from '__tests__/driftCells';
import type * as Drift from '__tests__/driftFixtures';
import {
  installDom,
  loadServerHalf,
  messagesOf,
  settle,
  until,
} from '__tests__/splitEnvHarness';
import { loadBrowserHalf } from '__tests__/streamBrowser';
import type { BrowserHalf } from '__tests__/streamBrowser';
import type * as Fixtures from '__tests__/streamFixtures';
import type { LedgerCapture, LedgerFlush } from '__tests__/streamingHarness';

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

describeReact19('D: no mis-hydration under drift', () => {
  it('D1/pinned', async () => {
    const { capture } = await driftServer(() => ({}));
    const r = await inBrowser(async b => {
      const page = clientPage();
      const streamed = await deliverAll(b, capture);
      expect(page.ledger().rev).toBe(2);
      b.hydrate(page.element);
      await until(
        () =>
          page.log.commits.includes('b1') && page.log.commits.includes('b2'),
        'B1 and B2 hydrated',
      );
      await settle(50);
      return {
        errors: b.errors.length,
        b1Adopted: b.byTestId('b1') === streamed.b1,
        b2Adopted: b.byTestId('b2') === streamed.b2,
        b1First: firstText(page.log.texts, 'b1'),
        b1: b.text('b1'),
        b2: b.text('b2'),
        fetches: page.fetches,
        pins: page.ledger().stats().pins,
      };
    });
    expect(r).toEqual({
      errors: 0,
      b1Adopted: true,
      b2Adopted: true,
      b1First: 'b1=BTC:100ETH:10',
      b1: 'BTC:101.5ETH:10',
      b2: 'BTC:101.5',
      fetches: [],
      pins: 0,
    });
  });

  it('D2/control-handoff', async () => {
    const { capture, finalState } = await driftServer(() => ({}));
    const r = await inBrowser(async b => {
      const page = clientPage({ handoff: JSON.parse(finalState) });
      const streamed = await deliverAll(b, capture);
      b.hydrate(page.element);
      await until(() => page.log.commits.includes('b1'), 'B1 committed');
      await settle(50);
      return {
        errors: b.errors.length,
        b1Adopted: b.byTestId('b1') === streamed.b1,
      };
    });
    expect(r.errors).toBeGreaterThanOrEqual(1);
    expect(r.b1Adopted).toBe(false);
  });

  it('D3/late-pin', async () => {
    const { capture } = await driftServer(() => ({}));
    const b2 = pinIdOf(capture, 'b2');
    const pin = pinsOf(capture)
      .filter(p => p.id === b2)
      .at(-1)!;
    const r = await inBrowser(async b => {
      const page = clientPage();
      // the stream stays open: `end` follows the pin
      const streamed = await deliverAll(
        b,
        capture,
        m => !(m.t === 'pin' && m.id === b2) && m.t !== 'end',
      );
      b.hydrate(page.element);
      await until(() => page.log.commits.includes('b1'), 'B1 hydrated');
      await settle(100);
      const waited =
        !page.log.renders.includes('b2') &&
        b.byTestId('b2') === streamed.b2 &&
        b.text('b2') === 'BTC:101.5';
      b.push([{ t: 'pin', id: b2, rev: pin.rev }]);
      await until(() => page.log.commits.includes('b2'), 'B2 hydrated');
      b.push([{ t: 'end' }]);
      await settle(30);
      return {
        waited,
        errors: b.errors.length,
        adopted: b.byTestId('b2') === streamed.b2,
        b2First: firstText(page.log.texts, 'b2'),
      };
    });
    expect(r).toEqual({
      waited: true,
      errors: 0,
      adopted: true,
      b2First: 'b2=BTC:101.5',
    });
  });

  it('D4/no-pin-at-end', async () => {
    const { capture } = await driftServer(() => ({}));
    const b2 = pinIdOf(capture, 'b2');
    const r = await inBrowser(async b => {
      const page = clientPage();
      const streamed = await deliverAll(
        b,
        capture,
        m => !(m.t === 'pin' && m.id === b2) && m.t !== 'end',
      );
      b.hydrate(page.element);
      await until(() => page.log.commits.includes('b1'), 'B1 hydrated');
      await settle(50);
      const waitedForPin = !page.log.renders.includes('b2');
      b.push([{ t: 'end' }]);
      await until(() => page.log.commits.includes('b2'), 'B2 hydrated');
      await settle(30);
      return {
        waitedForPin,
        errors: b.errors.length,
        adopted: b.byTestId('b2') === streamed.b2,
        fetches: page.fetches,
      };
    });
    // B2 was rendered at the last revision, so live state matches it
    expect(r).toEqual({
      waitedForPin: true,
      errors: 0,
      adopted: true,
      fetches: [],
    });
  });

  it('D5/expired-in-snapshot', async () => {
    const opts = { invalidIfStale: true, dataExpiryLength: 1 };
    const { capture } = await driftServer(() => opts);
    const r = await inBrowser(async b => {
      const page = clientPage(opts);
      const streamed = await deliverAll(b, capture);
      b.hydrate(page.element);
      await until(() => page.log.commits.includes('b1'), 'B1 hydrated');
      let fallbackShown = false;
      for (let i = 0; i < 10; i++) {
        await settle(10);
        if (b.container.textContent?.includes('loading')) fallbackShown = true;
      }
      return {
        errors: b.errors.length,
        adopted: b.byTestId('b1') === streamed.b1,
        b1First: firstText(page.log.texts, 'b1'),
        b1: b.text('b1'),
        fallbackShown,
        listFetches: page.fetches.filter(f => f.startsWith('getTickers'))
          .length,
      };
    });
    expect(r.errors).toBe(0);
    expect(r.adopted).toBe(true);
    expect(r.b1First).toBe('b1=BTC:100ETH:10');
    expect(r.fallbackShown).toBe(false);
    // the server content stays while the revalidation is pending
    expect(r.b1).toMatch(/^BTC:/);
    expect(r.listFetches).toBeLessThanOrEqual(1);
  });

  it('D6/drift-inside-one-boundary (recorded)', async () => {
    const { capture } = await driftServer(() => ({ layout: 'one-boundary' }));
    const r = await inBrowser(async b => {
      const page = clientPage({ layout: 'one-boundary' });
      const streamed = await deliverAll(b, capture);
      const serverText = {
        b1: b.text('b1'),
        b2: b.text('b2'),
      };
      b.hydrate(page.element);
      await until(
        () =>
          page.log.commits.includes('b1') && page.log.commits.includes('b2'),
        'boundary committed',
      );
      await settle(50);
      return {
        serverText,
        errors: b.errors.length,
        adopted: b.byTestId('b1') === streamed.b1,
        b1: b.text('b1'),
        b2: b.text('b2'),
      };
    });
    // Recorded on React 19.3.1. The list rendered at revision 1 and the
    // boundary's pin is revision 2, so the list mismatches once.
    expect(r).toEqual({
      serverText: { b1: 'BTC:100ETH:10', b2: 'BTC:101.5' },
      errors: 1,
      adopted: false,
      b1: 'BTC:101.5ETH:10',
      b2: 'BTC:101.5',
    });
  });

  it('D7/shell-reader', async () => {
    // B2 finds BTC in the shell's list, so a gate in B2 keeps the stream open
    // until BTC has moved to revision 2
    const { makeGate } =
      require('__tests__/streamingHarness') as typeof import('__tests__/streamingHarness');
    const hold = makeGate();
    const { capture } = await driftServer(drift => ({
      layout: 'shell-reader',
      holdB2: hold,
      steps: [drift.writeBtc, () => hold.release()],
      async before(page) {
        drift.resolveTickers(page);
        await page.stream.controller.fetch(page.endpoints.getTickers);
      },
    }));
    const r = await inBrowser(async b => {
      const page = clientPage({ layout: 'shell-reader' });
      const streamed = await deliverAll(b, capture);
      b.hydrate(page.element);
      await until(
        () =>
          page.log.commits.includes('shell') && page.log.commits.includes('b2'),
        'shell and B2 hydrated',
      );
      await until(
        () => b.text('shell') === 'BTC:101.5ETH:10',
        'publish transition',
      );
      return {
        open: page.ledger().shellRev,
        rev: page.ledger().rev,
        errors: b.errors.length,
        shellAdopted: b.byTestId('shell') === streamed.shell,
        shellFirst: firstText(page.log.texts, 'shell'),
        shell: b.text('shell'),
        fetches: page.fetches,
      };
    });
    expect(r).toEqual({
      open: 1,
      rev: 2,
      errors: 0,
      shellAdopted: true,
      shellFirst: 'shell=BTC:100ETH:10',
      shell: 'BTC:101.5ETH:10',
      fetches: [],
    });
  });

  it('D8/nested-pin', async () => {
    const { capture, reads } = await driftServer(() => ({ layout: 'nested' }));

    // server half: each boundary read through its own scoped getState
    const ids = [...reads.keys()];
    expect(ids).toHaveLength(2);
    const [outer, inner] = ids;
    expect(reads.get(outer)).toBeGreaterThanOrEqual(1);
    expect(reads.get(inner)).toBeGreaterThanOrEqual(1);
    const pins = lastPins(capture);
    expect(pins.get(outer)).toBe(1);
    expect(pins.get(inner)).toBe(2);
    // no pin message ever moved the outer boundary past revision 1
    expect(
      pinsOf(capture)
        .filter(p => p.id === outer)
        .every(p => p.rev <= 1),
    ).toBe(true);

    // full page: every flush delivered, then hydrate on live revision 2
    const r = await inBrowser(async b => {
      const page = clientPage({ layout: 'nested' });
      const streamed = await deliverAll(b, capture);
      expect(page.ledger().rev).toBe(2);
      b.hydrate(page.element);
      await until(
        () => page.log.commits.includes('b1') && page.log.commits.includes('d'),
        'B1 and D hydrated',
      );
      await settle(30);
      return {
        errors: b.errors.length,
        b1Adopted: b.byTestId('b1') === streamed.b1,
        dAdopted: b.byTestId('d') === streamed.d,
        b1First: firstText(page.log.texts, 'b1'),
        d: b.text('d'),
        b1: b.text('b1'),
        fetches: page.fetches,
      };
    });
    expect(r).toEqual({
      errors: 0,
      b1Adopted: true,
      dAdopted: true,
      b1First: 'b1=BTC:100ETH:10',
      d: 'BTC:101.5',
      // after the join B1 reads live state
      b1: 'BTC:101.5ETH:10',
      fetches: [],
    });
  });

  it('D9/open-late', async () => {
    const fx = loadServerHalf(
      () => require('__tests__/streamFixtures') as typeof Fixtures,
    );
    const { capture } = await fx.runServerPage();
    const r = await inBrowser(async b => {
      const page = b.fx.createClientPage();
      const shell = capture.flushes[0];
      b.container.innerHTML = shell.html;
      const layout = b.byTestId('layout');
      const a = b.byTestId('a');
      b.hydrate(page.element);
      await settle(50);
      const waited =
        page.log.renders.length === 0 && b.byTestId('layout') === layout;
      b.script(shell);
      await until(() => page.log.commits.includes('a'), 'A hydrated');
      await settle(30);
      const adopted = b.byTestId('layout') === layout && b.byTestId('a') === a;
      // a second render after open does not suspend
      b.probe.resetCommits();
      const providerRenders = page.log.renders.length;
      b.rootRender(page.element);
      await settle(30);
      return {
        waited,
        adopted,
        errors: b.errors.length,
        committedAgain: b.probe.commits.length > 0,
        sameNodes: b.byTestId('layout') === layout && b.byTestId('a') === a,
        rendersAfter: page.log.renders.length - providerRenders,
      };
    });
    expect(r).toEqual({
      waited: true,
      adopted: true,
      errors: 0,
      committedAgain: true,
      sameNodes: true,
      // the memo layout bails out
      rendersAfter: 0,
    });
  });
});
