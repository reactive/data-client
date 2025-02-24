import {
  AsyncBoundary,
  DataProvider,
  GCPolicy,
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
const ArticleDetail = ({ article }: { article: Article }) => {
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

const DetailView = ({ id }: { id: number }) => {
  const article = useSuspense(ArticleResource.get, { id });
  const [toggle, setToggle] = useState(false);

  return (
    <>
      <ArticleDetail article={article} />{' '}
      <button onClick={() => setToggle(!toggle)}>Toggle Re-render</button>
      {toggle && <div>Toggle state: {toggle.toString()}</div>}
    </>
  );
};

const TestComponent = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
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
        <AsyncBoundary fallback={<div>Loading...</div>}>
          {view === 'list' ?
            <ListView
              onSelect={id => {
                setSelectedId(id);
                setView('detail');
              }}
            />
          : selectedId !== null && <DetailView id={selectedId} />}
        </AsyncBoundary>
      </MockResolver>
    </DataProvider>
  );
};

describe('Integration Garbage Collection Web', () => {
  it('should render list view and detail view correctly', async () => {
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
        ArticleResource.getList.dataExpiryLength ?? 60000,
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
});
