/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { DataProvider } from '@data-client/react';
import { MockResolver } from '@data-client/test';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { LivePreview, LiveProvider } from 'react-live';

import PreviewError from '../PreviewError';

// Guards PreviewError's reliance on react-live's undocumented `newCode`.
function renderPreview(code: string) {
  const onRenderError = jest.fn();
  render(
    <DataProvider>
      <MockResolver
        fixtures={[]}
        getInitialInterceptorData={() => ({ votes: 1 })}
      >
        <LiveProvider code={code} noInline>
          <LivePreview />
          <PreviewError
            onReset={() => {}}
            onRenderError={onRenderError}
            onHealthy={() => {}}
          />
        </LiveProvider>
      </MockResolver>
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
  expect(screen.getByText('Error').tagName).toBe('STRONG');
  expect(screen.getByText('Runtime error')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Reset preview/ })).toBeTruthy();
  await waitFor(() =>
    expect(onRenderError).toHaveBeenCalledWith(code, {
      // in-flight requests die with the store, so their optimistic updates go too
      state: expect.objectContaining({ optimistic: [] }),
      interceptorData: { votes: 1 },
    }),
  );
});

it('never resets compile errors', async () => {
  const onRenderError = renderPreview('render(<div>);');
  expect(await screen.findByText(/SyntaxError/)).toBeTruthy();
  expect(screen.getByText('Compile error')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(onRenderError).not.toHaveBeenCalled();
});

it('never resets evaluation errors', async () => {
  const onRenderError = renderPreview(
    `throw new Error('eval');\nrender(<div />);`,
  );
  expect(await screen.findByText(/eval/)).toBeTruthy();
  // threw while running, though before anything rendered
  expect(screen.getByText('Runtime error')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(onRenderError).not.toHaveBeenCalled();
});
