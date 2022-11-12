// eslint-env jest
import React, { version } from 'react';
import { renderToString } from 'react-dom/server';

import CacheProvider from '../CacheProvider';

describe('<BackupBoundary />', () => {
  let warnspy: jest.SpyInstance;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn');
  });
  afterEach(() => {
    warnspy.mockRestore();
  });

  it('should warn users about SSR with CacheProvider', () => {
    const tree = (
      <CacheProvider>
        <div>hi</div>
      </CacheProvider>
    );
    const LegacyReact = version.startsWith('16') || version.startsWith('17');

    const msg = renderToString(tree);

    expect(warnspy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "CacheProvider does not update while doing SSR.
      Try using https://resthooks.io/docs/api/ExternalCacheProvider for server entry points.",
      ]
    `);

    if (!LegacyReact) {
      expect(msg).toMatchInlineSnapshot(`"<!--$--><div>hi</div><!--/$-->"`);
    } else {
      expect(msg).toMatchInlineSnapshot(`"<div>hi</div>"`);
    }
  });
});
