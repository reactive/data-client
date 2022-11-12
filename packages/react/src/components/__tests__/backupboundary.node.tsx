// eslint-env jest
import React, { version } from 'react';
import { renderToString } from 'react-dom/server';

import BackupBoundary from '../BackupBoundary';

describe('<BackupBoundary />', () => {
  let warnspy: jest.SpyInstance;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn');
  });
  afterEach(() => {
    warnspy.mockRestore();
  });

  it('should warn users about missing Suspense', () => {
    const tree = (
      <BackupBoundary>
        <div>hi</div>
      </BackupBoundary>
    );
    const LegacyReact = version.startsWith('16') || version.startsWith('17');
    const msg = renderToString(tree);

    if (LegacyReact) {
      expect(msg).toBeDefined();
      expect(msg).toMatchInlineSnapshot(`"<div>hi</div>"`);
    } else {
      expect(msg).toMatchInlineSnapshot(`"<!--$--><div>hi</div><!--/$-->"`);
    }
  });
});
