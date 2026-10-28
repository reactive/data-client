import { ArticleResource } from '__tests__/new';
import nock from 'nock';

// relative imports to avoid circular dependency in tsconfig references
import { useCancelling, useSuspense } from '../..';
import { renderHook, act, renderDataHook } from '../../../../test';

describe('useCancelling()', () => {
  const payload = {
    id: '6',
    title: 'lala',
  };
  const payload2 = {
    id: '7',
    title: 'second one',
  };
  beforeAll(() => {
    jest.useFakeTimers({
      legacyFakeTimers: true,
    });
    const mynock = nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200);

    mynock
      .get(`/article/${payload.id}`)
      .delay(2000)
      .reply(200, payload)
      .get(`/article/${payload2.id}`)
      .delay(2000)
      .reply(200, payload2);
  });
  afterAll(() => {
    jest.useRealTimers();
    nock.cleanAll();
  });

  it('should abort when props change and resolve when kept the same', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => {
        return useCancelling(ArticleResource.get, { id });
      },
      { initialProps: { id: '6' } },
    );
    const firstendpoint = result.current;
    const ogPromise = result.current({ id: '6' });
    jest.advanceTimersByTime(10);
    act(() => rerender({ id: '7' }));
    expect(result.current).not.toBe(firstendpoint);
    expect(ogPromise).rejects.toMatchInlineSnapshot(`[AbortError: Aborted]`);
    const nextPromise = result.current({ id: '7' });
    jest.advanceTimersByTime(2000);
    await expect(nextPromise).resolves.toMatchInlineSnapshot(`
      {
        "id": "7",
        "title": "second one",
      }
    `);
    act(() => rerender({ id: '7' }));
  });

  it('should remain === if params does not change', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => {
        return useCancelling(ArticleResource.get, { id });
      },
      { initialProps: { id: '6' } },
    );
    let lastendpoint = result.current;
    act(() => rerender({ id: '6' }));
    expect(result.current).toBe(lastendpoint);
    lastendpoint = result.current;
    act(() => rerender({ id: '6' }));
    expect(result.current).toBe(lastendpoint);
  });

  describe('with real timers', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });
    afterEach(() => {
      jest.useFakeTimers({ legacyFakeTimers: true });
    });

    it('keeps the fetch of a render that suspended and is retried', async () => {
      const fetched: number[] = [];
      const fixtures = [
        {
          endpoint: ArticleResource.get,
          response({ id }: { id: number }) {
            fetched.push(id);
            return { id, title: `article ${id}` };
          },
          delay: 50,
        },
      ];
      const { result, rerender, waitForNextUpdate } = renderDataHook(
        ({ id }: { id: number; tick: number }) =>
          useSuspense(useCancelling(ArticleResource.get, { id }), { id }),
        { initialProps: { id: 6, tick: 0 }, resolverFixtures: fixtures },
      );
      await waitForNextUpdate();
      expect(result.current.title).toBe('article 6');

      // suspends on id 7; a parent re-render retries it while its fetch is open
      act(() => rerender({ id: 7, tick: 1 }));
      act(() => rerender({ id: 7, tick: 2 }));
      await waitForNextUpdate();
      expect(result.current.title).toBe('article 7');
      // the retry reused the open fetch instead of aborting it for a new one
      expect(fetched).toEqual([6, 7]);
    });
  });
});
