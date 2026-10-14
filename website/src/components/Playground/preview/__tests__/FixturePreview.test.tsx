/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import FixturePreview, { summarize } from '../FixturePreview';

// the parts of a RestEndpoint the rows read
const getArticle = {
  method: 'GET',
  path: '/article/:id',
  key: ({ id }: { id: number }) => `GET https://example.com/article/${id}`,
} as any;

describe('FixturePreview', () => {
  test('rows start collapsed and toggle their response', () => {
    render(
      <FixturePreview
        fixtures={[
          {
            endpoint: getArticle,
            args: [{ id: 1 }],
            response: { id: '1', title: 'first' },
          },
        ]}
      />,
    );
    const toggle = screen.getByRole('button', { expanded: false });
    expect(toggle.textContent).toContain('GET');
    expect(toggle.textContent).toContain('/article/1');
    expect(toggle.textContent).toContain('{"id":"1","title":"first"}');
    expect(screen.queryByText(/"title": "first"/)).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const code = screen.getByText(/"title": "first"/);
    expect(code.closest('[inert]')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // what it showed stays while it slides shut, out of the way
    expect(code.closest('[inert]')).not.toBeNull();
  });

  test('marks error fixtures and delays', () => {
    render(
      <FixturePreview
        fixtures={[
          {
            endpoint: getArticle,
            args: [{ id: 2 }],
            response: { message: 'not found' },
            error: true,
            delay: 150,
          },
        ]}
      />,
    );
    const toggle = screen.getByRole('button');
    expect(toggle.textContent).toContain('error');
    expect(toggle.textContent).toContain('150 ms');
  });

  test('shows function responses once open', () => {
    render(
      <FixturePreview
        fixtures={[
          {
            endpoint: getArticle,
            response({ id }: { id: number }) {
              return { id };
            },
          },
        ]}
      />,
    );
    const toggle = screen.getByRole('button');
    // collapsed, the row shows what the function returns
    expect(toggle.textContent).toContain('ƒ → { id }');
    fireEvent.click(toggle);
    expect(screen.getByText(/return \{ id \}/)).toBeTruthy();
  });
});

describe('summarize', () => {
  test('interceptors: method and path from the endpoint, function hint', () => {
    expect(
      summarize({
        endpoint: getArticle,
        response({ id }: { id: number }) {
          return { id };
        },
        delay: () => 150,
      }),
    ).toEqual({
      method: 'GET',
      path: '/article/:id',
      fn: 'response',
      hint: undefined,
      error: false,
      delay: 'delay',
    });
  });

  test('fetch interceptors name fetchResponse', () => {
    expect(
      summarize({
        endpoint: getArticle,
        fetchResponse: () => ({ id: 1 }),
      } as any).fn,
    ).toBe('fetchResponse');
  });

  test('fixtures without an HTTP method keep the whole key', () => {
    const { method, path } = summarize({
      endpoint: { key: (...args: any[]) => `custom ${JSON.stringify(args)}` },
      args: [1],
      response: 5,
    } as any);
    expect(method).toBe('');
    expect(path).toBe('custom [1]');
  });

  test('interceptors without a method or path are named by the endpoint', () => {
    const { method, path } = summarize({
      endpoint: { name: 'search' },
      response: 5,
    } as any);
    expect(method).toBe('');
    expect(path).toBe('search');
  });

  test('the hint is the response, capped', () => {
    expect(
      summarize({ endpoint: getArticle, args: [{ id: 9 }], response: 5 }).hint,
    ).toBe('5');
    expect(
      summarize({
        endpoint: getArticle,
        args: [{ id: 9 }],
        response: undefined,
      }).hint,
    ).toBe('undefined');
    const big = Array.from({ length: 500 }, (_, i) => ({ id: i }));
    expect(
      summarize({ endpoint: getArticle, args: [{ id: 9 }], response: big }).hint
        ?.length,
    ).toBe(160);
  });
});
