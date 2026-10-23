// eslint-env jest
import { Endpoint } from '@data-client/endpoint';
import React, { Suspense, version } from 'react';
import * as ReactDOMServer from 'react-dom/server';

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
    ReactDOMServer.renderToString(tree);
    await new Promise(resolve => setTimeout(resolve, 0));

    const msg = ReactDOMServer.renderToString(tree);

    expect(ssrWarnings()).toEqual([]);

    if (!LegacyReact) {
      expect(msg).toMatchInlineSnapshot(
        `"<!--$--><div>hi</div><!--/$--><!--$--><!--/$-->"`,
      );
    } else {
      expect(msg).toMatchInlineSnapshot(`"<div>hi</div>"`);
    }
  });

  it('should not warn about uncaught suspense when React renders but discards the fallback', async () => {
    // only streaming renderers (React 18+) outline
    if (!('renderToReadableStream' in ReactDOMServer)) return;
    // React 19 also renders the fallback of a non-root boundary over 500 bytes, then discards it
    const tree = (
      <div>
        <DataProvider>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i}>{`row ${i} of text to fill out the boundary`}</div>
          ))}
        </DataProvider>
      </div>
    );

    const stream = await (ReactDOMServer as any).renderToReadableStream(tree);
    await stream.allReady;
    const msg = await new Response(stream).text();

    expect(msg).toContain('row 19');
    expect(msg).not.toContain('Uncaught Suspense');
    expect(
      warnspy.mock.calls.filter(([msg]) =>
        `${msg}`.includes('Uncaught suspense'),
      ),
    ).toEqual([]);
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

    ReactDOMServer.renderToString(tree);
    ReactDOMServer.renderToString(tree);

    expect(ssrWarnings()).toMatchSnapshot();
  });
});
