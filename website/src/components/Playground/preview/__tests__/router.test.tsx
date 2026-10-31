/// <reference types="jest" />
/// <reference types="@docusaurus/module-type-aliases" />

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import type { CodeDocument } from '../../editor/codeModel';
import PreviewWrapper from '../PreviewWrapper';
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

  test('passes null for a layout without a named default export', () => {
    expect(
      routerTrailer([
        doc('export default function Page() {}', '/'),
        { ...doc('export default () => null;'), layout: true },
      ]),
    ).toBe(
      '\n;render(<__PlaygroundRouter routes={[["/", Page]]} layout={null} />);',
    );
  });

  test('passes the layout and start path', () => {
    expect(
      routerTrailer([
        {
          ...doc('export default function Page() {}', '/p/:id'),
          start: '/p/1',
        },
        { ...doc('export default function Nav() {}'), layout: true },
      ]),
    ).toBe(
      '\n;render(<__PlaygroundRouter routes={[["/p/:id", Page]]} layout={Nav} start={"/p/1"} />);',
    );
  });
});

describe('Router', () => {
  afterEach(() => jest.restoreAllMocks());
  /** renders `ui` in the preview, whose header holds the router's controls */
  function renderInPreview(ui: React.ReactElement) {
    return render(<PreviewWrapper layout="stacked">{ui}</PreviewWrapper>);
  }
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
    renderInPreview(<Router routes={routes} />);
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
    renderInPreview(
      <Router
        routes={[
          ['/', () => <Link to="/slow">Slow</Link>],
          ['/slow', Slow],
        ]}
      />,
    );
    const controls = screen.getByRole('navigation', { name: 'Preview pages' });

    await act(async () => {
      fireEvent.click(screen.getByText('Slow'));
    });
    expect(screen.getByText('Slow')).toBeTruthy();
    expect(controls.getAttribute('aria-busy')).toBe('true');

    await act(async () => resolve());
    expect(screen.getByText('slow page')).toBeTruthy();
    expect(controls.getAttribute('aria-busy')).toBe('false');
  });

  test('keeps Back working when a page throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    renderInPreview(
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

  test('keeps the layout around pages, marking the current link', async () => {
    function Nav({ children }: { children: React.ReactNode }) {
      return (
        <>
          <nav>
            <Link to="/p/1">One</Link>
            <Link to="/p/2">Two</Link>
          </nav>
          {children}
        </>
      );
    }
    renderInPreview(
      <Router
        routes={[['/p/:id', ({ id }: { id: string }) => <>page {id}</>]]}
        layout={Nav}
        start="/p/1"
      />,
    );
    expect(screen.getByText('page 1')).toBeTruthy();
    expect(screen.getByText('One').getAttribute('aria-current')).toBe('page');

    await act(async () => {
      fireEvent.click(screen.getByText('Two'));
    });
    expect(screen.getByText('page 2')).toBeTruthy();
    expect(screen.getByText('Two').getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('One').getAttribute('aria-current')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    });
    expect(screen.getByText('page 1')).toBeTruthy();
  });

  test('Home returns to the first page from deep in the history', async () => {
    renderInPreview(
      <Router
        routes={[
          ['/', () => <Link to="/a">A</Link>],
          ['/a', () => <Link to="/b">B</Link>],
          ['/b', () => <>page b</>],
        ]}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByText('A'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('B'));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    });
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  test('mounts the page anew on Home, though its path is shown', async () => {
    const mounts = jest.fn();
    function Root() {
      React.useEffect(mounts, []);
      return <Link to="/a">A</Link>;
    }
    renderInPreview(
      <Router
        routes={[
          ['/', Root],
          ['/a', () => <Link to="/">Root</Link>],
        ]}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByText('A'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Root'));
    });
    expect(mounts).toHaveBeenCalledTimes(2);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    });
    expect(mounts).toHaveBeenCalledTimes(3);
  });

  test('stops at the first page when Back is pressed twice', async () => {
    renderInPreview(<Router routes={routes} />);
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
    renderInPreview(
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
