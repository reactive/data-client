/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { DataProvider } from '@data-client/react';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { LivePreview, LiveProvider } from 'react-live';

import PreviewError from '../PreviewError';

// Guards PreviewError's reliance on react-live's undocumented `newCode`.
function renderPreview(code: string) {
  const onRenderError = jest.fn();
  render(
    <DataProvider>
      <LiveProvider code={code} noInline>
        <LivePreview />
        <PreviewError
          onReset={() => {}}
          onRenderError={onRenderError}
          onHealthy={() => {}}
        />
      </LiveProvider>
    </DataProvider>,
  );
  return onRenderError;
}

beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

it('offers a reset for render errors', async () => {
  const code = `function A() { throw new Error('boom'); }\nrender(<A />);`;
  const onRenderError = renderPreview(code);
  expect(await screen.findByText(/boom/)).toBeTruthy();
  expect(screen.getByRole('button', { name: /Reset preview/ })).toBeTruthy();
  await waitFor(() =>
    expect(onRenderError).toHaveBeenCalledWith(code, expect.anything()),
  );
});

it('never resets compile errors', async () => {
  const onRenderError = renderPreview('render(<div>);');
  expect(await screen.findByText(/SyntaxError/)).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(onRenderError).not.toHaveBeenCalled();
});

it('never resets evaluation errors', async () => {
  const onRenderError = renderPreview(
    `throw new Error('eval');\nrender(<div />);`,
  );
  expect(await screen.findByText(/eval/)).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(onRenderError).not.toHaveBeenCalled();
});
