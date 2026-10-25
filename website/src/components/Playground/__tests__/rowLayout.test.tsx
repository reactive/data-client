/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { fireEvent, render, screen } from '@testing-library/react';
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
// can't load); the folder and its handle are the Playground's own
jest.mock('../preview/LivePreview', () => {
  const { createElement } = require('react');
  const PreviewWrapper = require('../preview/PreviewWrapper').default;
  return {
    __esModule: true,
    default: () => createElement(PreviewWrapper, {}, 'the app'),
  };
});

const APP = 'render(<div>the app</div>);';

describe("row layout: the Store on the preview's folder", () => {
  test('the handle pulls the folder out over the code, and Escape pushes it back', () => {
    const { container } = render(<Playground row>{APP}</Playground>);
    const handle = screen.getByRole('button', { name: 'Store' });
    const folder = document.getElementById(
      handle.getAttribute('aria-controls')!,
    )!;
    const code = container.querySelector('textarea')!.closest('[inert]');
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    expect(folder.hasAttribute('data-open')).toBe(false);
    expect(code).toBeNull();

    // the folder slides out: the code under it is inert
    fireEvent.click(handle);
    expect(handle.getAttribute('aria-expanded')).toBe('true');
    expect(folder.hasAttribute('data-open')).toBe(true);
    expect(
      container.querySelector('textarea')!.closest('[inert]'),
    ).not.toBeNull();

    // Escape on the drawer (where the Store's own keys have not taken it)
    // pushes it shut and hands focus back to the handle
    fireEvent.keyDown(folder.firstElementChild!, { key: 'Escape' });
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    expect(folder.hasAttribute('data-open')).toBe(false);
    expect(document.activeElement).toBe(handle);
    expect(container.querySelector('textarea')!.closest('[inert]')).toBeNull();
  });

  test('the server HTML has the handle, shut, on the folder after the preview', () => {
    const { renderToStaticMarkup } = require('react-dom/server');
    const html: string = renderToStaticMarkup(
      <Playground row>{APP}</Playground>,
    );
    const handle = html.match(/<button[^>]*aria-label="Store"[^>]*>/)?.[0];
    expect(handle).toContain('aria-expanded="false"');
    expect(html.indexOf('aria-label="Store"')).toBeGreaterThan(
      html.indexOf('the app'),
    );
  });
});
