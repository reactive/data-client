import { render } from '@testing-library/react';
import { CoolerArticleResource } from '__tests__/legacy-3';
import nock from 'nock';
import React, { Suspense } from 'react';

import { Controller, ControllerContext } from '../..';
import useFetchDispatcher from '../useFetchDispatcher';

async function testDispatchFetch(
  Component: React.FunctionComponent<any>,
  payloads: any[],
) {
  const dispatch = jest.fn();
  const tree = (
    <ControllerContext.Provider value={new Controller({ dispatch })}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </ControllerContext.Provider>
  );
  render(tree);
  expect(dispatch).toHaveBeenCalledTimes(payloads.length);
  let i = 0;
  for (const call of dispatch.mock.calls) {
    delete call[0]?.meta?.createdAt;
    delete call[0]?.meta?.promise;
    expect(call[0]).toMatchSnapshot();
    const action = call[0];
    const res = await action.payload();
    expect(res).toEqual(payloads[i]);
    i++;
  }
}

let mynock: nock.Scope;

beforeAll(() => {
  nock(/.*/)
    .persist()
    .defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    })
    .options(/.*/)
    .reply(200);
  mynock = nock(/.*/).defaultReplyHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
});

afterAll(() => {
  nock.cleanAll();
});

describe('useFetchDispatcher', () => {
  const payload = { id: 1, content: 'hi' };

  it('should dispatch an action that fetches a create', async () => {
    mynock.post(`/article-cooler/`).reply(201, payload);

    function DispatchTester() {
      const dispatch = useFetchDispatcher();
      dispatch(CoolerArticleResource.createShape(), {}, { content: 'hi' }).then(
        v => {
          v.author;
          //@ts-expect-error
          v.jasfdasdf;
        },
      );
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });
});
