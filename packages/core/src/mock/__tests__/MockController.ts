import { Endpoint } from '@data-client/endpoint';

import { FETCH } from '../../actionTypes';
import Controller from '../../controller/Controller';
import { MockController } from '../MockController';

/** Runs the endpoint the mock dispatches, as NetworkManager would */
function mockedFetch(
  fixtures: any[],
  endpoint: any,
  ...args: any[]
): Promise<any> {
  const Mocked = MockController(Controller, { fixtures });
  const controller = new Mocked({
    dispatch: (action: any) => action.endpoint(...action.args),
  } as any);
  return controller.dispatch({
    type: FETCH,
    key: endpoint.key(...args),
    args,
    endpoint,
  } as any);
}

/** Minimal RestEndpoint stand-in: fetchResponse and signal members */
const getThing = new Endpoint(
  function (this: any, { id }: { id: number }): Promise<{ id: number }> {
    return this.fetchResponse(`/things/${id}`, { signal: this.signal }).then(
      (res: Response) => res.json(),
    );
  },
  {
    key: ({ id }: { id: number }) => `/things/${id}`,
    testKey: (key: string) => key.startsWith('/things/'),
    fetchResponse: (input: RequestInfo, init: RequestInit) =>
      fetch(input, init),
    signal: undefined as AbortSignal | undefined,
  },
);

describe('MockController', () => {
  it('accepts a Controller subclass with its own members', () => {
    class MyController extends Controller {
      doSomething = () => 'hi';
    }
    const Mocked = MockController(MyController, {});
    const controller = new Mocked();

    expect(controller).toBeInstanceOf(MyController);
    expect(controller.doSomething()).toBe('hi');
  });

  describe('AbortSignal', () => {
    const fixtures = [
      {
        endpoint: getThing,
        args: [{ id: 5 }],
        response: { id: 5 },
        delay: 1000,
      },
    ];

    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('resolves after delay without a signal', async () => {
      const promise = mockedFetch(fixtures, getThing, { id: 5 });
      await jest.advanceTimersByTimeAsync(1000);
      await expect(promise).resolves.toEqual({ id: 5 });
    });

    it('rejects with AbortError when aborted during delay', async () => {
      const abort = new AbortController();
      const promise = mockedFetch(
        fixtures,
        getThing.extend({ signal: abort.signal }),
        { id: 5 },
      );
      await jest.advanceTimersByTimeAsync(500);
      abort.abort();
      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
      expect(jest.getTimerCount()).toBe(0);
    });

    it('rejects at once when already aborted', async () => {
      const abort = new AbortController();
      abort.abort();
      const promise = mockedFetch(
        [{ ...fixtures[0], delayCollapse: true }],
        getThing.extend({ signal: abort.signal }),
        { id: 5 },
      );
      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    });
  });

  it('awaits an async fetchResponse, which can read init.signal', async () => {
    const abort = new AbortController();
    const seen: (AbortSignal | null | undefined)[] = [];
    const interceptor = {
      endpoint: getThing,
      async fetchResponse(input: RequestInfo, init: RequestInit) {
        seen.push(init.signal);
        await Promise.resolve();
        return { id: Number(`${input}`.split('/').pop()) };
      },
    };
    await expect(
      mockedFetch([interceptor], getThing.extend({ signal: abort.signal }), {
        id: 7,
      }),
    ).resolves.toEqual({ id: 7 });
    expect(seen).toEqual([abort.signal]);
  });
});
