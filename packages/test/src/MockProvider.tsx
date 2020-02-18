import { __INTERNAL__ } from 'rest-hooks';

import React from 'react';

import mockState, { Fixture } from './mockState';
const { StateContext } = __INTERNAL__;

export default function MockProvider({
  children,
  results,
}: {
  children: React.ReactChild;
  results: Fixture[];
}) {
  const state = mockState(results);
  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}
