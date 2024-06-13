// eslint-env jest
import React, { version } from 'react';
import { renderToString } from 'react-dom/server';

import DataProvider from '../DataProvider';

describe('<BackupBoundary />', () => {
  let warnspy: jest.SpyInstance;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnspy.mockRestore();
  });

  it('should warn users about SSR with DataProvider', async () => {
    const tree = (
      <DataProvider>
        <div>hi</div>
      </DataProvider>
    );
    const LegacyReact = version.startsWith('16') || version.startsWith('17');

    // let our lazy component load
    renderToString(tree);
    await new Promise(resolve => setTimeout(resolve, 0));

    const msg = renderToString(tree);

    expect(warnspy.mock.lastCall).toMatchSnapshot();

    if (!LegacyReact) {
      expect(msg).toMatchInlineSnapshot(
        `"<!--$--><div>hi</div><!--/$--><!--$--><!--/$-->"`,
      );
    } else {
      expect(msg).toMatchInlineSnapshot(`"<div>hi</div>"`);
    }
  });
});
