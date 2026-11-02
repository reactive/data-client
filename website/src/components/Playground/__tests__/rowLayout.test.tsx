/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import Playground from '..';
import BeforeFolder from '../BeforeFolder';
import { BEFORE_END } from '../types';

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
    default: () => createElement(PreviewWrapper, { layout: 'row' }, 'the app'),
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

describe('row layout: a `before` replay', () => {
  test('its end screen shows the code in its place, and its tab brings it back', () => {
    const { container } = render(
      <Playground before={<div>the old app</div>} beforeLabel="v0.18">
        {APP}
      </Playground>,
    );
    const row = container.querySelector('[data-comparing]')!;
    expect(row.hasAttribute('data-code')).toBe(false);
    // no autoRun: nothing to play
    expect(screen.queryByRole('button', { name: /play/i })).toBeNull();
    const show = screen.getByRole('button', { name: 'Show code' });
    expect(show.closest('[data-before]')).not.toBeNull();
    show.focus();
    fireEvent.click(show);
    expect(row.hasAttribute('data-code')).toBe(true);
    // the replay's tab leads the files'; focus moved on from the hidden
    // button to the file showing
    const tab = screen.getByRole('tab', { name: 'v0.18' });
    expect(tab.getAttribute('aria-selected')).toBe('false');
    expect(document.activeElement?.getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tab);
    expect(row.hasAttribute('data-code')).toBe(false);
    expect(document.activeElement).toBe(show);
  });
  test('its end screen hears an end sent as the demo mounts beside it', async () => {
    jest.useFakeTimers();
    // the demo's preview, mounting in the same commit (its chunk already
    // loaded), says at once that it won't play (reduced motion, or played)
    const Demo = () => (
      <div
        ref={el => {
          el?.parentElement
            ?.querySelector('[data-before]')
            ?.dispatchEvent(new Event(BEFORE_END));
        }}
      />
    );
    const { container } = render(
      <div data-playground>
        <BeforeFolder
          label="v0.18"
          replayable
          onShowCode={() => {}}
          showCodeRef={React.createRef()}
        >
          the old app
        </BeforeFolder>
        <Demo />
      </div>,
    );
    await act(() => jest.runAllTimersAsync());
    expect(
      container.querySelector('[data-before]')!.hasAttribute('data-ended'),
    ).toBe(true);
    jest.useRealTimers();
  });
});
