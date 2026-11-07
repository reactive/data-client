import { Endpoint } from '@data-client/endpoint';
import { useController } from '@data-client/react';
import { RestEndpoint } from '@data-client/rest';

import { renderDataHook } from '..';

// controller.fetch() answered by resolverFixtures resolves even with no hook subscribed to the store
const getTodo = new RestEndpoint({
  urlPrefix: 'http://test.com',
  path: '/todo/:id',
});
const getValue = new Endpoint(
  ({ id }: { id: number }) => Promise.resolve({ id }),
  { name: 'getValue' },
);

describe('renderDataHook() resolverFixtures with controller.fetch()', () => {
  it('resolves a RestEndpoint interceptor', async () => {
    const { controller } = renderDataHook(() => useController(), {
      resolverFixtures: [
        {
          endpoint: getTodo,
          response: ({ id }: { id: number }) => ({ id, title: 'hi' }),
        },
      ],
    });
    await expect(controller.fetch(getTodo, { id: 5 })).resolves.toEqual({
      id: 5,
      title: 'hi',
    });
  });

  it('resolves an Endpoint fixture under its own key', async () => {
    const { controller } = renderDataHook(() => useController(), {
      resolverFixtures: [
        { endpoint: getValue, args: [{ id: 5 }], response: { id: 6 } },
      ],
    });
    await expect(controller.fetch(getValue, { id: 5 })).resolves.toEqual({
      id: 6,
    });
    expect(controller.getState().endpoints).toEqual({
      [getValue.key({ id: 5 })]: { id: 6 },
    });
  });
});
