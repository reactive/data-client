/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';

import Playground from '..';

// a crawler: the live preview never loads, so the preview stays its loading
// frame (whose Code toggle already works), and no Monaco
jest.mock('../userAgent', () => ({ isBot: true, isMobileOrBot: () => true }));
jest.mock('../PlaygroundEditor', () => require('../testing/playgroundEditor'));

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
    // unseen until the Code toggle shows it: plain text for crawlers, not a
    // node per highlighted token
    expect(html).not.toContain('token-line');
    const codeToggle = html.match(/<button[^>]*aria-label="Code"[^>]*>/)?.[0];
    expect(codeToggle).toContain('aria-pressed="false"');
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
    expect(screen.getByText(/listOfPosts/)).toBeTruthy();
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

describe('hidden playground (an unselected homepage tab)', () => {
  test('the server HTML has its code as plain text, and no preview', () => {
    const html = renderToString(
      <Playground row hidden>
        {fences()}
      </Playground>,
    );
    expect(html).toContain('listOfPosts');
    expect(html).not.toContain('token-line');
    expect(html).not.toContain('Live Preview');
  });
});

describe('folded fixtures', () => {
  const fixtures = [
    {
      endpoint: { key: () => 'GET /article/1' },
      args: [],
      response: { id: 1 },
    },
  ] as any[];

  test('render once the pointer reaches the playground, not in the HTML', () => {
    const html = renderToString(
      <Playground row fixtures={fixtures}>
        {fences()}
      </Playground>,
    );
    expect(html).toContain('aria-label="Fixtures"');
    expect(html).not.toContain('/article/1');

    const { container } = render(
      <Playground row fixtures={fixtures}>
        {fences()}
      </Playground>,
    );
    expect(container.textContent).not.toContain('/article/1');
    fireEvent.pointerOver(screen.getByRole('button', { name: 'Fixtures' }));
    expect(container.textContent).toContain('/article/1');
  });
});
