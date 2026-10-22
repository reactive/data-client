/// <reference types="jest" />
import { ErrorBoundary } from '@data-client/react';
import { render, renderHook } from '@testing-library/react';
import React from 'react';

import { usePlaygroundConsoleDemotion } from '../usePlaygroundConsoleDemotion';

function Throws(): React.ReactNode {
  throw new Error('boom');
}
/** Has React log an error a boundary caught, as a throwing preview does */
const throwCaught = () =>
  render(
    <ErrorBoundary>
      <Throws />
    </ErrorBoundary>,
  ).unmount();

let error: jest.SpyInstance;
let warn: jest.SpyInstance;
beforeEach(() => {
  error = jest.spyOn(console, 'error').mockImplementation(() => {});
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it("demotes React's caught-error log to a warning while any preview is mounted", () => {
  const first = renderHook(() => usePlaygroundConsoleDemotion());
  const second = renderHook(() => usePlaygroundConsoleDemotion());
  throwCaught();
  console.error('something else');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith('something else');

  first.unmount();
  throwCaught();
  expect(warn).toHaveBeenCalledTimes(2);

  second.unmount();
  throwCaught();
  expect(warn).toHaveBeenCalledTimes(2);
  expect(error).toHaveBeenCalledTimes(2);
});
