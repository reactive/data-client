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

  test('function rows show what the function returns, once pinned', () => {
    const response = () => ({ id: 1 });
    const { container } = render(
      <FixturePreview
        fixtures={[
          { endpoint: getArticle, response },
          {
            endpoint: getArticle,
            response: Object.defineProperty(() => 2, 'returnedSource', {
              value: '{ id: 1 }',
            }),
          },
        ]}
      />,
    );
    const [unpinned, pinned] = container.querySelectorAll('button');
    expect(unpinned.textContent).toContain('ƒ response');
    expect(pinned.textContent).toContain('ƒ → { id: 1 }');
  });

  test('delay functions: ƒ on the pill, their source on hover and open', () => {
    const delay = () => 150;
    render(
      <FixturePreview
        fixtures={[{ endpoint: getArticle, response: 1, delay } as any]}
      />,
    );
    const toggle = screen.getByRole('button');
    const pill = screen.getByTitle(`${delay}`);
    expect(pill.textContent).toBe('ƒ delay');
    fireEvent.click(toggle);
    expect(screen.getByText(`delay: ${delay}`)).toBeTruthy();
  });

  test('labels delay sources unless they are a delay() method', () => {
    const fixtures = [
      { endpoint: getArticle, response: 1, delay: (delayMs: any) => delayMs },
      {
        endpoint: getArticle,
        response: 1,
        delay() {
          return 150;
        },
      },
    ] as any;
    const { container } = render(<FixturePreview fixtures={fixtures} />);
    for (const toggle of screen.getAllByRole('button')) fireEvent.click(toggle);
    const sources = [...container.querySelectorAll('code')].map(
      code => code.textContent,
    );
    expect(sources).toContain(`delay: ${fixtures[0].delay}`);
    expect(sources).toContain(`${fixtures[1].delay}`);
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
    fireEvent.click(screen.getByRole('button'));
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
      fnName: 'response',
      hint: undefined,
      error: false,
      delay: true,
      delayFn: true,
    });
  });

  test('delay labels: pinned numbers, none for zero, else true', () => {
    const labelFor = (delay: unknown) =>
      summarize({ endpoint: getArticle, response: 1, delay } as any).delay;
    const pinned = (returnedSource?: string) =>
      Object.defineProperty(() => 0, 'returnedSource', {
        value: returnedSource,
      });
    expect(labelFor(150)).toBe('150 ms');
    expect(labelFor(0)).toBeUndefined();
    expect(labelFor(pinned('1_000'))).toBe('1000 ms');
    expect(labelFor(pinned('0'))).toBeUndefined();
    expect(labelFor(pinned('_150'))).toBe(true);
    expect(labelFor(pinned('1e3'))).toBe('1000 ms');
    expect(labelFor(pinned('.5'))).toBe('0.5 ms');
    expect(labelFor(pinned('1e400'))).toBe(true);
    expect(labelFor(pinned('500 + Math.random() * 4500'))).toBe(true);
    expect(labelFor(pinned())).toBe(true);
  });

  test('fetch interceptors name fetchResponse', () => {
    expect(
      summarize({
        endpoint: getArticle,
        fetchResponse: () => ({ id: 1 }),
      } as any).fnName,
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
