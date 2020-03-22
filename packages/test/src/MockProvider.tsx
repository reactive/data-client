import { __INTERNAL__, ActionTypes } from 'rest-hooks';
import React from 'react';

import mockState, { Fixture } from './mockState';
const { StateContext, DispatchContext } = __INTERNAL__;

const mockDispatch = (value: ActionTypes) => {
  console.error(
    `MockProvider does not implement dispatch.
If you were expecting to see results, it is likely due to data not being found in fixtures.
Double check your params and FetchShape match:

useResource(ArticleResource.listShape(), { maxResults: 10 });

and

{
request: ArticleResource.listShape(),
params: { maxResults: 10 },
result: [],
}`,
  );

  return Promise.resolve();
};

export default function MockProvider({
  children,
  results,
}: {
  children: React.ReactChild;
  results: Fixture[];
}) {
  const state = mockState(results);
  return (
    <DispatchContext.Provider value={mockDispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}
