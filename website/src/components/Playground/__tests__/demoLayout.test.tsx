/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';

import Playground from '..';

// a crawler: the live preview never loads, so the preview stays its loading
// frame (whose Code toggle already works), and no Monaco
jest.mock('../userAgent', () => ({ isBot: true, isMobileOrBot: () => true }));
jest.mock('../PlaygroundEditor', () => ({
  __esModule: true,
  default: ({ code }: { code: string }) =>
    require('react').createElement('textarea', { defaultValue: code }),
}));

// one Prism token each, so the HTML and the DOM's text can be searched for them
const LIST =
  'const listOfPosts = 1;\nexport default function PostList() { return null; }';
const DETAIL = 'export default function PostDetail() { return null; }';

/** A fence as MDX hands it over */
const code = (key: string, metastring: string, children: string) =>
  React.createElement(
    'code',
    { key, className: 'language-tsx', metastring },
    children,
  );

const fences = () => [
  code('list', 'title="PostList" route="/"', LIST),
  code('detail', 'title="PostDetail" route="/posts/:id" collapsed', DETAIL),
];

describe('demo layout', () => {
  test('the server HTML has the code and the Code toggle, preview first', () => {
    const html = renderToString(<Playground demo>{fences()}</Playground>);
    expect(html).toContain('listOfPosts');
    expect(html).toContain('aria-label="Code"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain('data-code');
    expect(html.indexOf('Live Preview')).toBeLessThan(
      html.indexOf('listOfPosts'),
    );
  });

  test('the Code toggle trades the result for the code, and back', () => {
    const { container } = render(<Playground demo>{fences()}</Playground>);
    const playground = container.querySelector('[data-playground] > div')!;
    const toggle = screen.getByRole('button', { name: 'Code' });
    // the code is there, hidden by the layout, before it is shown
    expect(screen.getByText('listOfPosts')).toBeTruthy();
    expect(playground.hasAttribute('data-code')).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.title).toBe('Show code');

    fireEvent.click(toggle);
    expect(playground.hasAttribute('data-code')).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.title).toBe('Hide code');
    // the header names the code in the label's place
    expect(screen.getByText('Editor').getAttribute('aria-hidden')).toBe(
      'false',
    );
    // files are tabs, as in row
    expect(screen.getByRole('tab', { name: 'PostDetail' })).toBeTruthy();

    fireEvent.click(toggle);
    expect(playground.hasAttribute('data-code')).toBe(false);
    expect(screen.getByText('Editor').getAttribute('aria-hidden')).toBe('true');
  });

  test('without demo there is no Code toggle', () => {
    render(<Playground row>{fences()}</Playground>);
    expect(screen.queryByRole('button', { name: 'Code' })).toBeNull();
  });
});
