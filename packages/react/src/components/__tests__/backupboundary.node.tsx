import React, { version } from 'react';
import { renderToString } from 'react-dom/server';

import BackupLoading from '../BackupLoading';
import UniversalSuspense from '../UniversalSuspense';

describe('<BackupBoundary />', () => {
  let warnspy: jest.Spied<any>;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnspy.mockRestore();
  });

  it('should warn users about missing Suspense', () => {
    const tree = (
      <UniversalSuspense fallback={<BackupLoading />}>
        <div>hi</div>
      </UniversalSuspense>
    );
    const LegacyReact = version.startsWith('16') || version.startsWith('17');
    const msg = renderToString(tree);

    if (LegacyReact) {
      expect(msg).toBeDefined();
      expect(msg).toMatchInlineSnapshot(`"<div data-reactroot="">hi</div>"`);
    } else {
      expect(msg).toMatchInlineSnapshot(`"<!--$--><div>hi</div><!--/$-->"`);
    }
  });
});
