/// <reference types="jest" />
import { renderHook } from '@testing-library/react';

import { usePlaygroundConsoleDemotion } from '../usePlaygroundConsoleDemotion';

const caught = [
  '%o\n\n%s\n\n%s\n',
  new Error('boom'),
  'The above error occurred in the <A> component.',
  'React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.',
];

it("demotes React's caught-error log to a warning while mounted", () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const { unmount } = renderHook(() => usePlaygroundConsoleDemotion());

  console.error(...caught);
  console.error('something else');
  expect(warn).toHaveBeenCalledWith(...caught);
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith('something else');

  unmount();
  console.error(...caught);
  expect(error).toHaveBeenCalledTimes(2);
  expect(warn).toHaveBeenCalledTimes(1);
  jest.restoreAllMocks();
});
