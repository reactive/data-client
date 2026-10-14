/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import FixtureRow, { previewJson, summarize } from '../FixtureRow';

// the parts of a RestEndpoint the rows read
const getArticle = {
  method: 'GET',
  path: '/article/:id',
  key: ({ id }: { id: number }) => `GET /article/${id}`,
  testKey: () => true,
} as any;

describe('FixtureRow', () => {
  test('starts collapsed and toggles the response', () => {
    render(
      <FixtureRow
        fixture={{
          endpoint: getArticle,
          args: [{ id: 1 }],
          response: { id: '1', title: 'first' },
        }}
      >
        <pre>the response</pre>
      </FixtureRow>,
    );
    const toggle = screen.getByRole('button', { expanded: false });
    expect(toggle.textContent).toContain('GET');
    expect(toggle.textContent).toContain('/article/1');
    expect(toggle.textContent).toContain('{id: "1", title: "first"}');
    expect(screen.queryByText('the response')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('the response')).toBeTruthy();
    expect(toggle.getAttribute('aria-controls')).toBe(
      screen.getByText('the response').parentElement!.id,
    );

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('the response')).toBeNull();
  });

  test('marks error fixtures and delays', () => {
    render(
      <FixtureRow
        fixture={{
          endpoint: getArticle,
          args: [{ id: 2 }],
          response: { message: 'not found' },
          error: true,
          delay: 150,
        }}
      >
        <pre />
      </FixtureRow>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle.textContent).toContain('error');
    expect(toggle.textContent).toContain('150 ms');
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
      hint: 'response',
      isFunction: true,
      error: false,
      delay: 'delay',
    });
  });

  test('fetch interceptors name fetchResponse', () => {
    expect(
      summarize({
        endpoint: getArticle,
        fetchResponse: () => ({ id: 1 }),
      } as any).hint,
    ).toBe('fetchResponse');
  });

  test('fixtures without an HTTP method keep the whole key', () => {
    const { method, path } = summarize({
      endpoint: { key: (...args: any[]) => `custom ${JSON.stringify(args)}` },
      args: [1],
      response: 5,
    } as any);
    expect(method).toBeUndefined();
    expect(path).toBe('custom [1]');
  });
});

describe('previewJson', () => {
  test('is a readable single line', () => {
    expect(previewJson([{ id: 1, name: 'A' }, 2])).toBe(
      '[{id: 1, name: "A"}, 2]',
    );
    expect(previewJson(null)).toBe('null');
    expect(previewJson(undefined)).toBe('undefined');
  });
  test('is capped for huge responses', () => {
    const big = Array.from({ length: 500 }, (_, i) => ({ id: i }));
    expect(previewJson(big).length).toBeLessThan(400);
  });
});
