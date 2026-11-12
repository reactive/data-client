import { KINDS, parentRerender } from '__tests__/limitCells';
import { describeReact19 } from '__tests__/splitEnvHarness';

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

// What React does to the woken boundary is recorded in observed/limits.node.tsx
describeReact19('L: limits', () => {
  describe('L1/parent-rerender', () => {
    for (const at of ['$?', 'revealed'] as const)
      for (const kind of KINDS)
        it(`${at} shield ${kind}`, async () => {
          const r = await parentRerender('shield', kind, at);
          if (kind === 'same') {
            expect(r.record.woken).toBe(false);
            expect(r.record.adopted).toBe(true);
          } else {
            expect(r.record.fetches).toBeLessThanOrEqual(1);
          }
          expect(r.outcome).toEqual({
            b: 'a@2b2',
            bOnLive: true,
            onlyLiveShown: true,
            errors: 0,
          });
        });
  });
});
