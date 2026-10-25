/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import Playground from '..';

// a phone: the live preview loads (not a bot), with the react-live editor
jest.mock('../userAgent', () => ({ isBot: false, isMobileOrBot: () => true }));
jest.mock('../PlaygroundEditor', () => ({
  __esModule: true,
  default: ({ code }: { code: string }) =>
    require('react').createElement('textarea', { defaultValue: code }),
}));
// The real chunk pulls in the whole preview scope (ESM-only packages jest
// can't load); what the demo layout needs of it is the header it renders
// (PreviewWrapper with its Store toggle) and the toggleStore it is handed.
jest.mock('../preview/LivePreview', () => {
  const { createElement } = require('react');
  const PreviewWrapper = require('../preview/PreviewWrapper').default;
  const { StoreHeaderToggle } = require('../preview/StoreToggle');
  return {
    __esModule: true,
    default: ({ storeOpen, toggleStore, code }: any) =>
      createElement(
        PreviewWrapper,
        {
          code,
          headerControls: createElement(StoreHeaderToggle, {
            open: storeOpen,
            onClick: toggleStore,
          }),
        },
        'the app',
      ),
  };
});

const APP = 'render(<div>the app</div>);';

describe('demo layout with the live preview', () => {
  test('the Store toggle brings the preview back from over the code', async () => {
    const { container } = render(<Playground demo>{APP}</Playground>);
    const playground = container.querySelector('[data-playground] > div')!;
    // the live preview has loaded once its Store toggle is enabled: a new
    // button, in the loading fallback's place (whose code also says "the app")
    const store = await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Store' });
      expect(button.hasAttribute('disabled')).toBe(false);
      return button;
    });
    const code = screen.getByRole('button', { name: 'Code' });

    fireEvent.click(code);
    expect(playground.hasAttribute('data-code')).toBe(true);
    expect(code.getAttribute('aria-pressed')).toBe('true');
    expect(store.getAttribute('aria-pressed')).toBe('false');

    // "Show Store": the preview returns with the Store open
    fireEvent.click(store);
    expect(playground.hasAttribute('data-code')).toBe(false);
    expect(store.getAttribute('aria-pressed')).toBe('true');
    expect(code.getAttribute('aria-pressed')).toBe('false');

    // "Hide Store" from over the code: the preview returns, Store closed
    fireEvent.click(code);
    expect(playground.hasAttribute('data-code')).toBe(true);
    fireEvent.click(store);
    expect(playground.hasAttribute('data-code')).toBe(false);
    expect(store.getAttribute('aria-pressed')).toBe('false');
  });
});
