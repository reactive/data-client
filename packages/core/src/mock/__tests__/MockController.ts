import { ArticleResource } from '__tests__/new';

import { createFetch } from '../../controller/actions';
import Controller from '../../controller/Controller';
import { MockController } from '../MockController';

/** Runs the endpoint the mock dispatches, as NetworkManager would */
function mockedFetch(fixtures: any[], endpoint: any, ...args: any[]) {
  const Mocked = MockController(Controller, { fixtures });
  const controller = new Mocked({
    dispatch: (action: any) => action.endpoint(...action.args),
  } as any);
  return controller.dispatch(createFetch(endpoint, { args })) as Promise<any>;
}

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
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'five' },
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
      const promise = mockedFetch(fixtures, ArticleResource.get, { id: 5 });
      await jest.advanceTimersByTimeAsync(1000);
      await expect(promise).resolves.toMatchObject({ id: 5 });
    });

    it('rejects with AbortError when aborted during delay', async () => {
      const abort = new AbortController();
      const promise = mockedFetch(
        fixtures,
        ArticleResource.get.extend({ signal: abort.signal }),
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
        ArticleResource.get.extend({ signal: abort.signal }),
        { id: 5 },
      );
      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('rejects when already aborted, even without a delay', async () => {
      const abort = new AbortController();
      abort.abort();
      const promise = mockedFetch(
        [{ ...fixtures[0], delay: undefined }],
        ArticleResource.get.extend({ signal: abort.signal }),
        { id: 5 },
      );
      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    });
  });

  it('awaits an async fetchResponse, which can read init.signal', async () => {
    const abort = new AbortController();
    const seen: (AbortSignal | null | undefined)[] = [];
    const interceptor = {
      endpoint: ArticleResource.get,
      async fetchResponse(input: RequestInfo, init: RequestInit) {
        seen.push(init.signal);
        await Promise.resolve();
        return { id: Number(`${input}`.split('/').pop()), title: 'seven' };
      },
    };
    await expect(
      mockedFetch(
        [interceptor],
        ArticleResource.get.extend({ signal: abort.signal }),
        { id: 7 },
      ),
    ).resolves.toMatchObject({ id: 7, title: 'seven' });
    expect(seen).toEqual([abort.signal]);
  });
});
