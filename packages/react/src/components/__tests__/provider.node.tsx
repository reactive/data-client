// eslint-env jest
import { Endpoint } from '@data-client/endpoint';
import React, { Suspense, version } from 'react';
import { renderToString } from 'react-dom/server';

import { useSuspense } from '../../hooks';
import DataProvider from '../DataProvider';

describe('<DataProvider />', () => {
  let warnspy: jest.Spied<any>;
  beforeEach(() => {
    warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnspy.mockRestore();
  });
  const ssrWarnings = () =>
    warnspy.mock.calls.filter(([msg]) =>
      `${msg}`.includes('does not update while doing SSR'),
    );

  it('should render without warning when nothing fetches during SSR', async () => {
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

    expect(ssrWarnings()).toEqual([]);

    if (!LegacyReact) {
      expect(msg).toMatchInlineSnapshot(
        `"<!--$--><div>hi</div><!--/$--><!--$--><!--/$-->"`,
      );
    } else {
      expect(msg).toMatchInlineSnapshot(`"<div>hi</div>"`);
    }
  });

  it('should warn once when fetching during SSR', () => {
    const getThing = new Endpoint(() => Promise.resolve({ id: '5' }), {
      key: () => 'getThing',
    });
    function Thing() {
      useSuspense(getThing);
      return <div>thing</div>;
    }
    const tree = (
      <DataProvider>
        <Suspense fallback={<div>loading</div>}>
          <Thing />
        </Suspense>
      </DataProvider>
    );

    renderToString(tree);
    renderToString(tree);

    expect(ssrWarnings()).toMatchSnapshot();
  });
});
