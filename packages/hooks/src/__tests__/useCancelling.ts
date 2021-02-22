import { ArticleResource } from '__tests__/new';
import { renderHook, act } from '@testing-library/react-hooks';
import nock from 'nock';

import useCancelling from '../useCancelling';

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
    jest.useFakeTimers();

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
        return useCancelling(ArticleResource.detail(), { id });
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
    expect(nextPromise).resolves.toMatchInlineSnapshot(`
            Object {
              "id": "7",
              "title": "second one",
            }
          `);
    act(() => rerender({ id: '7' }));
  });

  it('should remain === if params does not change', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => {
        return useCancelling(ArticleResource.detail(), { id });
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
});
