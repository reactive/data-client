import {
  AsyncBoundary,
  DataProvider,
  GCPolicy,
  useQuery,
  useSuspense,
} from '@data-client/react';
import { MockResolver } from '@data-client/test';
import { render, screen, act } from '@testing-library/react';
import { Article, ArticleResource } from '__tests__/new';
import '@testing-library/jest-dom';
import { useState } from 'react';

const mockGetList = jest.fn();
const mockGet = jest.fn();
const GC_INTERVAL = 5000;

const ArticleList = ({
  articles,
  onSelect,
}: {
  articles: Article[];
  onSelect: (id: number) => void;
}) => {
  return (
    <div>
      {articles.map(article => (
        <div key={article.id} onClick={() => onSelect(article.id ?? 0)}>
          {article.title}
        </div>
      ))}
    </div>
  );
};
const ArticleDetail = ({ id }: { id: number }) => {
  const article = useSuspense(ArticleResource.get, { id });

  return (
    <div>
      <h3>{article.title}</h3>
      <p>{article.content}</p>
    </div>
  );
};

const ListView = ({ onSelect }: { onSelect: (id: number) => void }) => {
  const articles = useSuspense(ArticleResource.getList);
  return <ArticleList articles={articles} onSelect={onSelect} />;
};

const QueryArticleList = ({ onSelect }: { onSelect: (id: number) => void }) => {
  const articles = useQuery(ArticleResource.getList.schema);

  if (articles === undefined) return <div>Articles not found</div>;
  return <ArticleList articles={articles} onSelect={onSelect} />;
};
const ListQueryView = ({ onSelect }: { onSelect: (id: number) => void }) => {
  const [toggle, setToggle] = useState(false);

  return (
    <>
      <QueryArticleList key={`${toggle}`} onSelect={onSelect} />{' '}
      <button onClick={() => setToggle(!toggle)}>Toggle Re-render</button>
      {toggle && <div>Toggle state: {toggle.toString()}</div>}
    </>
  );
};

const DetailView = ({ id }: { id: number }) => {
  const [toggle, setToggle] = useState(false);

  return (
    <>
      <ArticleDetail key={`${toggle}`} id={id} />{' '}
      <button onClick={() => setToggle(!toggle)}>Toggle Re-render</button>
      {toggle && <div>Toggle state: {toggle.toString()}</div>}
    </>
  );
};

const TestComponent = () => {
  const [view, setView] = useState<'list' | 'detail' | 'querylist' | 'blank'>(
    'list',
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <DataProvider gcPolicy={new GCPolicy({ intervalMS: GC_INTERVAL })}>
      <MockResolver
        fixtures={[
          {
            endpoint: ArticleResource.getList,
            response: mockGetList,
            delay: 100,
          },
          { endpoint: ArticleResource.get, response: mockGet, delay: 100 },
        ]}
      >
        <div onClick={() => setView('list')}>Home</div>
        <div onClick={() => setView('querylist')}>Query</div>
        <div onClick={() => setView('blank')}>Blank</div>
        <div
          onClick={() => {
            setSelectedId(1);
            setView('detail');
          }}
        >
          Try first article
        </div>
        <AsyncBoundary fallback={<div>Loading...</div>}>
          {view === 'list' ?
            <ListView
              onSelect={id => {
                setSelectedId(id);
                setView('detail');
              }}
            />
          : view === 'querylist' ?
            <ListQueryView
              onSelect={id => {
                setSelectedId(id);
                setView('detail');
              }}
            />
          : view === 'blank' ?
            <div>This is an empty page</div>
          : selectedId !== null && <DetailView id={selectedId} />}
        </AsyncBoundary>
      </MockResolver>
    </DataProvider>
  );
};

describe('Integration Garbage Collection Web', () => {
  it('should count properly with useSuspense', async () => {
    jest.useFakeTimers();
    mockGetList.mockReturnValue([
      { id: 1, title: 'Article 1', content: 'Content 1' },
      { id: 2, title: 'Article 2', content: 'Content 2' },
    ]);
    mockGet.mockReturnValue({
      id: 1,
      title: 'Article 1',
      content: 'Content 1',
    });

    render(<TestComponent />);

    // only needed for react 17
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    // Initial render, should show list view
    expect(await screen.findByText('Article 1')).toBeInTheDocument();

    // Switch to detail view
    act(() => {
      screen.getByText('Article 1').click();
    });

    // Detail view should render
    expect(await screen.findByText('Content 1')).toBeInTheDocument();

    // Jest time pass to trigger sweep but not expired
    act(() => {
      jest.advanceTimersByTime(GC_INTERVAL);
    });

    // Switch back to list view
    act(() => {
      screen.getByText('Home').click();
    });

    // List view should instantly render
    expect(await screen.findByText('Article 1')).toBeInTheDocument();

    // Switch back to detail view
    act(() => {
      screen.getByText('Article 1').click();
    });

    // Jest time pass to expiry
    act(() => {
      jest.advanceTimersByTime(
        ArticleResource.getList.dataExpiryLength ?? 60000 + GC_INTERVAL,
      );
    });
    expect(await screen.findByText('Content 1')).toBeInTheDocument();

    // Re-render detail view to make sure it still renders
    act(() => {
      screen.getByText('Toggle Re-render').click();
    });
    expect(await screen.findByText('Toggle state: true')).toBeInTheDocument();
    expect(await screen.findByText('Content 1')).toBeInTheDocument();

    // Visit list view and see suspense fallback
    act(() => {
      screen.getByText('Home').click();
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('should count properly with useQuery', async () => {
    jest.useFakeTimers();
    mockGetList.mockReturnValue([
      { id: 1, title: 'Article 1', content: 'Content 1' },
      { id: 2, title: 'Article 2', content: 'Content 2' },
    ]);
    mockGet.mockReturnValue({
      id: 1,
      title: 'Article 1',
      content: 'Content 1',
    });

    render(<TestComponent />);

    // only needed for react 17
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    // Initial render, should show list view
    expect(await screen.findByText('Article 1')).toBeInTheDocument();

    // Switch to detail view
    act(() => {
      screen.getByText('Article 1').click();
    });

    // Detail view should render
    expect(await screen.findByText('Content 1')).toBeInTheDocument();

    // Jest time pass to trigger sweep but not expired
    act(() => {
      jest.advanceTimersByTime(GC_INTERVAL);
    });

    // Switch to useQuery() list view
    act(() => {
      screen.getByText('Query').click();
    });

    // List view should instantly render
    expect(await screen.findByText('Article 1')).toBeInTheDocument();

    // Jest time pass to expiry
    act(() => {
      jest.advanceTimersByTime(
        ArticleResource.getList.dataExpiryLength ?? 60000 + GC_INTERVAL,
      );
    });
    expect(await screen.findByText('Article 1')).toBeInTheDocument();

    // Re-render query list view to make sure it still renders
    act(() => {
      screen.getByText('Toggle Re-render').click();
    });
    expect(await screen.findByText('Toggle state: true')).toBeInTheDocument();
    expect(await screen.findByText('Article 1')).toBeInTheDocument();

    act(() => {
      screen.getByText('Blank').click();
    });
    // enough time to GC
    act(() => {
      jest.advanceTimersByTime(GC_INTERVAL);
    });

    // Visit detail view and see suspense fallback
    act(() => {
      screen.getByText('Try first article').click();
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Visit useQuery() list view and see query fallback
    act(() => {
      screen.getByText('Query').click();
    });

    expect(screen.getByText('Articles not found')).toBeInTheDocument();
    jest.useRealTimers();
  });
});
