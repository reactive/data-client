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
