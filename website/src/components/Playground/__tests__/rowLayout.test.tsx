/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import Playground from '..';

// a phone: the live preview loads (not a bot), with the react-live editor
jest.mock('../userAgent', () => ({ isBot: false, isMobileOrBot: () => true }));
jest.mock('../PlaygroundEditor', () => require('../testing/playgroundEditor'));
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
    const handle = screen.getByRole('tab', { name: 'Store' });
    const folder = document.getElementById(
      handle.getAttribute('aria-controls')!,
    )!;
    const code = container.querySelector('textarea')!.closest('[inert]');
    expect(handle.getAttribute('aria-selected')).toBe('false');
    expect(folder.hasAttribute('data-open')).toBe(false);
    expect(code).toBeNull();

    // the folder slides out: the code under it is inert
    fireEvent.click(handle);
    expect(handle.getAttribute('aria-selected')).toBe('true');
    expect(folder.hasAttribute('data-open')).toBe(true);
    expect(
      container.querySelector('textarea')!.closest('[inert]'),
    ).not.toBeNull();

    // Escape on the drawer (where the Store's own keys have not taken it)
    // pushes it shut and hands focus back to the handle
    fireEvent.keyDown(folder.firstElementChild!, { key: 'Escape' });
    expect(handle.getAttribute('aria-selected')).toBe('false');
    expect(folder.hasAttribute('data-open')).toBe(false);
    expect(document.activeElement).toBe(handle);
    expect(container.querySelector('textarea')!.closest('[inert]')).toBeNull();
  });

  test('the file tabs go inert under the Store with the code', () => {
    const fence = (key: string, title: string) =>
      React.createElement(
        'code',
        { key, className: 'language-tsx', metastring: `title="${title}"` },
        `export default function ${title}() { return null; }`,
      );
    const { container } = render(
      <Playground row>
        {[fence('a', 'First'), fence('b', 'Second')]}
      </Playground>,
    );
    const tab = container.querySelector('[role="tab"]')!;
    expect(tab.closest('[inert]')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Store' }));
    expect(tab.closest('[inert]')).not.toBeNull();
  });

  test('the Actions and Store tabs each open the folder to their view, the shown one shutting it', () => {
    render(<Playground row>{APP}</Playground>);
    const actions = screen.getByRole('tab', { name: 'Actions' });
    const store = screen.getByRole('tab', { name: 'Store' });
    const folder = document.getElementById(
      store.getAttribute('aria-controls')!,
    )!;
    const selected = () =>
      [actions, store].map(tab => tab.getAttribute('aria-selected'));
    // Actions over Store, on the folder's edge
    expect(actions.compareDocumentPosition(store)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    fireEvent.click(actions);
    expect(folder.hasAttribute('data-open')).toBe(true);
    expect(selected()).toEqual(['true', 'false']);
    // the other tab switches the view; the folder stays out
    fireEvent.click(store);
    expect(folder.hasAttribute('data-open')).toBe(true);
    expect(selected()).toEqual(['false', 'true']);
    // the one shown pushes it back
    fireEvent.click(store);
    expect(folder.hasAttribute('data-open')).toBe(false);
    expect(selected()).toEqual(['false', 'false']);
  });

  test('defaultOpen="actions" opens the folder on its Actions', () => {
    render(
      <Playground row defaultOpen="actions" groupId="row-actions">
        {APP}
      </Playground>,
    );
    const actions = screen.getByRole('tab', { name: 'Actions' });
    expect(actions.getAttribute('aria-selected')).toBe('true');
    expect(
      document
        .getElementById(actions.getAttribute('aria-controls')!)!
        .hasAttribute('data-open'),
    ).toBe(true);
  });

  test('the server HTML has the handle, shut, on the folder after the preview', () => {
    const { renderToStaticMarkup } = require('react-dom/server');
    const html: string = renderToStaticMarkup(
      <Playground row>{APP}</Playground>,
    );
    const handle = html.match(/<button[^>]*aria-label="Store"[^>]*>/)?.[0];
    expect(handle).toContain('aria-selected="false"');
    expect(html.indexOf('aria-label="Store"')).toBeGreaterThan(
      html.indexOf('the app'),
    );
  });
});
