import type * as Drift from '__tests__/driftFixtures';
import {
  installDom,
  loadServerHalf,
  messagesOf,
  settle,
  until,
} from '__tests__/splitEnvHarness';
import { loadBrowserHalf } from '__tests__/streamBrowser';
import type { LedgerCapture } from '__tests__/streamingHarness';

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

function loadDrift() {
  return loadServerHalf(
    () => require('__tests__/driftFixtures') as typeof Drift,
  );
}

const pinsOf = (capture: LedgerCapture) =>
  capture.flushes
    .flatMap(f => messagesOf(f.script))
    .filter(m => m.t === 'pin') as { id: string; rev: number }[];

const lastPins = (capture: LedgerCapture) => {
  const out = new Map<string, number>();
  for (const pin of pinsOf(capture)) out.set(pin.id, pin.rev);
  return out;
};

describeReact19('D: no mis-hydration under drift', () => {
  it('D8/nested-pin', async () => {
    const drift = loadDrift();
    const { page, capture } = await drift.runDriftServer({ layout: 'nested' });

    // server half: each boundary read through its own scoped getState
    const ids = [...page.reads.keys()];
    expect(ids).toHaveLength(2);
    const [outer, inner] = ids;
    expect(page.reads.get(outer)).toBeGreaterThanOrEqual(1);
    expect(page.reads.get(inner)).toBeGreaterThanOrEqual(1);
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
    const teardownDom = installDom();
    const b = loadBrowserHalf();
    try {
      const fx = require('__tests__/driftFixtures') as typeof Drift;
      const client = fx.createDriftClientPage({ layout: 'nested' });
      const [shell, ...rest] = capture.flushes;
      b.shell(shell);
      const streamed: Record<string, Element | undefined> = {};
      for (const flush of rest) {
        b.script(flush);
        const b1 = flush.html.includes('data-testid="b1"');
        const d = flush.html.includes('data-testid="d"');
        const node = b.html(
          flush,
          b1 ? 'b1'
          : d ? 'd'
          : undefined,
        );
        if (b1) streamed.b1 = node;
        if (d) streamed.d = node;
      }
      await until(
        () => !/<!--\$[?~]-->/.test(b.container.innerHTML),
        'every boundary revealed',
      );
      expect(client.ledger().rev).toBe(2);
      b.hydrate(client.element);
      await until(
        () =>
          client.log.commits.includes('b1') && client.log.commits.includes('d'),
        'B1 and D hydrated',
      );
      await settle(30);
      expect(b.errors).toEqual([]);
      expect(b.byTestId('b1')).toBe(streamed.b1);
      expect(b.byTestId('d')).toBe(streamed.d);
      expect(b.text('d')).toBe('BTC:101.5');
      // after the join B1 reads live state
      expect(b.text('b1')).toBe('BTC:101.5ETH:10');
      expect(client.fetches).toEqual([]);
    } finally {
      b.teardown();
      await teardownDom();
    }
  });
});
