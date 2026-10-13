/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { CodeDocument } from '../../editor/codeModel';
import { Link, Router, routerTrailer, useNavigate } from '../router';

jest.mock('../../DesignSystem/Loading', () => ({ Loading: () => null }));

const doc = (value: string, route?: string): CodeDocument => ({
  value,
  route,
  path: 'Page.tsx',
  collapsed: false,
  language: 'tsx',
});

describe('routerTrailer', () => {
  test('is empty without routes', () => {
    expect(routerTrailer([doc('render(<App />);')])).toBe('');
  });

  test('renders each route at its named default export', () => {
    expect(
      routerTrailer([
        doc('export default function PostList() {}', '/'),
        doc('const x = 1;'),
        doc('export default PostDetail;', '/posts/:id'),
      ]),
    ).toBe(
      '\n;render(<__PlaygroundRouter routes={[["/", PostList], ["/posts/:id", PostDetail]]} />);',
    );
  });
});

describe('Router', () => {
  afterEach(() => jest.restoreAllMocks());
  function List() {
    return <Link to="/posts/5">Post 5</Link>;
  }
  function Detail({ id }: { id: string }) {
    const navigate = useNavigate();
    return <button onClick={() => navigate('/')}>post {id}</button>;
  }
  const routes = [
    ['/', List],
    ['/posts/:id', Detail],
  ] as const;

  test('navigates with params as props, and Back returns', async () => {
    render(<Router routes={routes} />);
    const back = screen.getByRole('button', { name: 'Back' });
    expect(back).toHaveProperty('disabled', true);

    await act(async () => {
      fireEvent.click(screen.getByText('Post 5'));
    });
    expect(screen.getByText('/posts/5')).toBeTruthy();
    expect(screen.getByText('post 5')).toBeTruthy();

    await act(async () => {
      fireEvent.click(back);
    });
    expect(screen.getByText('Post 5')).toBeTruthy();
    expect(back).toHaveProperty('disabled', true);
  });

  test('keeps the page shown while the next one loads', async () => {
    let resolve!: () => void;
    const ready = new Promise<void>(r => (resolve = r));
    function Slow() {
      React.use(ready);
      return <>slow page</>;
    }
    const { container } = render(
      <Router
        routes={[
          ['/', () => <Link to="/slow">Slow</Link>],
          ['/slow', Slow],
        ]}
      />,
    );
    const progress = container.firstElementChild!;

    await act(async () => {
      fireEvent.click(screen.getByText('Slow'));
    });
    expect(screen.getByText('Slow')).toBeTruthy();
    expect(progress.hasAttribute('data-pending')).toBe(true);

    await act(async () => resolve());
    expect(screen.getByText('slow page')).toBeTruthy();
    expect(progress.hasAttribute('data-pending')).toBe(false);
  });

  test('keeps Back working when a page throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Router
        routes={[
          ['/', () => <Link to="/missing">Missing</Link>],
          ['/posts/:id', Detail],
        ]}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Missing'));
    });
    expect(screen.getByRole('alert').textContent).toContain(
      'No route matches "/missing"',
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    });
    expect(screen.getByText('Missing')).toBeTruthy();
  });

  test('stops at the first page when Back is pressed twice', async () => {
    render(<Router routes={routes} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Post 5'));
    });
    const back = screen.getByRole('button', { name: 'Back' });
    await act(async () => {
      fireEvent.click(back);
      fireEvent.click(back);
    });
    expect(screen.getByText('Post 5')).toBeTruthy();
  });

  test('leaves a Link alone when its onClick cancels the event', async () => {
    render(
      <Router
        routes={[
          [
            '/',
            () => (
              <Link to="/posts/5" onClick={event => event.preventDefault()}>
                Post 5
              </Link>
            ),
          ],
        ]}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Post 5'));
    });
    expect(screen.getByText('/')).toBeTruthy();
  });
});
