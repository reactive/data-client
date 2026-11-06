import { Endpoint } from '@data-client/endpoint';
import { useCache } from '@data-client/react';

import { renderDataHook } from '..';

const getValue = new Endpoint(({ id }: { id: number }) =>
  Promise.resolve({ id }),
);

// libraries and apps spread the result: `return { ...renderDataHook(...) }`
describe('renderDataHook() result spread', () => {
  it('keeps result, rerender and unmount', () => {
    const { result, rerender, unmount } = {
      ...renderDataHook(
        ({ id }: { id: number }) => useCache(getValue, { id }),
        {
          initialProps: { id: 1 },
          initialFixtures: [
            { endpoint: getValue, args: [{ id: 1 }], response: { id: 1 } },
            { endpoint: getValue, args: [{ id: 2 }], response: { id: 2 } },
          ],
        },
      ),
    };
    expect(result.current).toEqual({ id: 1 });
    rerender({ id: 2 });
    expect(result.current).toEqual({ id: 2 });
    expect(() => unmount()).not.toThrow();
  });
});
