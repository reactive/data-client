import { loadServerHalf, messagesOf } from '__tests__/splitEnvHarness';
import type * as Fixtures from '__tests__/streamFixtures';
import { chunkOf } from '__tests__/streamingHarness';

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

const fx = loadServerHalf(
  () => require('__tests__/streamFixtures') as typeof Fixtures,
);

const REVEAL = /\$RC\(|\$RC=|\$RB/;

describeReact19('E: emission order', () => {
  it('E1/byte-order', async () => {
    const { capture } = await fx.runServerPage();
    const { flushes } = capture;
    expect(flushes.length).toBeGreaterThanOrEqual(4);

    // The first chunk starts with the open script
    expect(capture.shell.startsWith('<script>')).toBe(true);
    expect(messagesOf(flushes[0].script)[0]).toMatchObject({ t: 'open', v: 1 });

    // In every chunk the script comes before the HTML, and so before any reveal
    for (const flush of flushes) {
      const chunk = chunkOf(flush);
      if (flush.script) expect(chunk.indexOf('<script>')).toBe(0);
      const reveal = chunk.search(REVEAL);
      if (reveal >= 0 && flush.script)
        expect(chunk.indexOf(flush.script)).toBeLessThan(reveal);
    }

    // B and C resolve in separate flushes
    const bAt = flushes.findIndex(f => f.html.includes('data-testid="b"'));
    const cAt = flushes.findIndex(f => f.html.includes('data-testid="c"'));
    expect(bAt).toBeGreaterThan(0);
    expect(cAt).toBeGreaterThan(bAt);
    expect(flushes[bAt].html).toMatch(REVEAL);

    // The script before B's reveal holds B's moved pin and every piece up to it
    const before = flushes.slice(0, bAt + 1).flatMap(f => messagesOf(f.script));
    const bScript = messagesOf(flushes[bAt].script);
    const bPins = bScript.filter(m => m.t === 'pin');
    expect(bPins).toHaveLength(1);
    const bPin = bPins[0];
    const shellPins = messagesOf(flushes[0].script).filter(m => m.t === 'pin');
    // B read in the shell before it suspended, so its pin moved
    expect(shellPins.find(m => m.id === bPin.id)?.rev).toBeLessThan(bPin.rev);
    const revs = before.filter(m => m.t === 'piece').map(m => m.rev);
    for (let rev = 1; rev <= bPin.rev; rev++) expect(revs).toContain(rev);
    expect(
      bScript.some(
        m => m.t === 'piece' && m.entities?.Todo?.['2']?.title === 'b2',
      ),
    ).toBe(true);

    // end is the last write, and written once
    const all = flushes.flatMap(f => messagesOf(f.script));
    expect(all.filter(m => m.t === 'end')).toHaveLength(1);
    const last = flushes[flushes.length - 1];
    expect(last.html).toBe('');
    expect(messagesOf(last.script)).toEqual([{ t: 'end' }]);
    expect(all[all.length - 1]).toEqual({ t: 'end' });
  });

  it('E2/abort', async () => {
    let abort: (() => void) | undefined;
    const { capture } = await fx.runServerPage({
      steps: [fx.resolveGroup('b'), () => abort?.()],
      onAbortable: a => {
        abort = a;
      },
    });
    const { flushes } = capture;
    // C never rendered its content
    expect(flushes.some(f => f.html.includes('data-testid="c"'))).toBe(false);
    const all = flushes.flatMap(f => messagesOf(f.script));
    expect(all.filter(m => m.t === 'end')).toHaveLength(1);
    expect(all[all.length - 1]).toEqual({ t: 'end' });
    // end comes after the last HTML
    const lastHtml = flushes.map(f => !!f.html).lastIndexOf(true);
    const endAt = flushes.findIndex(f => f.script.includes('"t":"end"'));
    expect(endAt).toBeGreaterThan(lastHtml);
    // No script is written twice
    const scripts = flushes.map(f => f.script).filter(Boolean);
    expect(new Set(scripts).size).toBe(scripts.length);
    const pieceRevs = all.filter(m => m.t === 'piece').map(m => m.rev);
    expect(new Set(pieceRevs).size).toBe(pieceRevs.length);
    expect(all.filter(m => m.t === 'open')).toHaveLength(1);
  });
});
