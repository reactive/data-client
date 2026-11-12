import { inBrowser, serverHalf } from '__tests__/g1Cells';
import { settle, until } from '__tests__/splitEnvHarness';

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

const { version } = require('react') as typeof import('react');
const describeReact19 =
  Number(version.split('.')[0]) >= 19 ? describe : describe.skip;

describeReact19('V: endpoint values', () => {
  for (const value of [null, 0, false, ''])
    it(`V1/hydrating-reader: a schema-less endpoint that resolved ${JSON.stringify(value)} on the server`, async () => {
      const server = await serverHalf(fx => ({
        valueV: true,
        steps: [fx.resolveGroup('b'), fx.resolveGroup('c'), fx.resolveValue(value)],
      }));
      const vFlush = server.with('v');
      const r = await inBrowser(async (b, finish) => {
        const page = b.fx.createClientPage({ valueV: true });
        await b.start(page, server.shell);
        let streamed: Element | undefined;
        for (const flush of server.flushes.slice(1)) {
          b.script(flush);
          streamed = b.htmlFind(flush, ['v']).v ?? streamed;
        }
        await until(() => page.log.commits.includes('v'), 'V hydrated');
        await settle(30);
        const state = page.controller.current!.getState();
        const key = page.endpoints.getValue.key({ name: 'v' });
        return {
          inFlush: vFlush !== server.shell,
          text: b.text('v'),
          adopted: streamed !== undefined && b.byTestId('v') === streamed,
          held: key in state.endpoints,
          stored: state.endpoints[key],
          ...(await finish(page)),
        };
      });
      expect(r).toEqual({
        inFlush: true,
        text: JSON.stringify(value),
        adopted: true,
        held: true,
        stored: value,
        errors: 0,
        fetches: [],
        immediateCommits: 0,
        flushSyncCalls: 0,
        detectorOnly: true,
      });
    });
});
