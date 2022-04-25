import { StateContext, DispatchContext, actionTypes } from '@rest-hooks/core';
import type { ActionTypes } from '@rest-hooks/core';
import React from 'react';

import mockState, { Fixture } from './mockState.js';

const mockDispatch = (value: ActionTypes) => {
  if (actionTypes.FETCH_TYPE === value.type) {
    console.error(
      `MockProvider received a dispatch:
${JSON.stringify(value, undefined, 2)}
for which there is no matching fixture.

If you were expecting to see results, it is likely due to data not being found in fixtures.
Double check your params and FetchShape match. For example:

useResource(ArticleResource.listShape(), { maxResults: 10 });

and

{
request: ArticleResource.listShape(),
params: { maxResults: 10 },
result: [],
}`,
    );
  }

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
