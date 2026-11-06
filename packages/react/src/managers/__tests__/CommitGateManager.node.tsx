// eslint-env jest
import { Endpoint } from '@data-client/endpoint';
import React from 'react';
import * as ReactDOMServer from 'react-dom/server';

import { CommitGateManager } from '..';
import DataProvider from '../../components/DataProvider';
import { getDefaultManagers } from '../../components/getDefaultManagers';
import { useController } from '../../hooks';

const endpoint = new Endpoint(() => Promise.resolve(5), { name: 'served' });

describe('CommitGateManager on the server', () => {
  it('passes results through, since a server render never commits', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const gate = new CommitGateManager();
    let ctrl: ReturnType<typeof useController> | undefined;
    function Probe() {
      ctrl = useController();
      return null;
    }
    ReactDOMServer.renderToString(
      <DataProvider managers={[gate, ...getDefaultManagers()]}>
        <Probe />
      </DataProvider>,
    );
    void ctrl?.setResponse(endpoint, 5);
    expect(gate['held']).toEqual([]);
    warn.mockRestore();
  });
});
