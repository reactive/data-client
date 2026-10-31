// eslint-env jest
import { Endpoint } from '@data-client/endpoint';
import React from 'react';
import * as ReactDOMServer from 'react-dom/server';

import ClientStore from '../ClientStore';
import DataProvider from '../DataProvider';

const endpoint = new Endpoint((id: number) => Promise.resolve(id), {
  name: 'served',
});

describe('ClientStore on the server', () => {
  it('settles dispatches even though no provider ever commits', async () => {
    const store = new ClientStore();
    expect(
      ReactDOMServer.renderToString(
        <DataProvider store={store} devButton={null}>
          <div>hi</div>
        </DataProvider>,
      ),
    ).toContain('hi');
    await expect(store.controller.fetch(endpoint, 1)).resolves.toBe(1);
    expect(store.getState().endpoints[endpoint.key(1)]).toBe(1);
  });
});
