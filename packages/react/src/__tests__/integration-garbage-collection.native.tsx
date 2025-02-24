import {
  AsyncBoundary,
  DataProvider,
  GCPolicy,
  useSuspense,
} from '@data-client/react';
import { MockResolver } from '@data-client/test';
import { render, screen, act, fireEvent } from '@testing-library/react-native';
import { ArticleResource } from '__tests__/new';
import { useState } from 'react';
import {
  View,
  Text,
  Button,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';

const mockGetList = jest.fn();
const mockGet = jest.fn();
const GC_INTERVAL = 5000;

const ListView = ({ onSelect }: { onSelect: (id: number) => void }) => {
  const articles = useSuspense(ArticleResource.getList);
  return (
    <View>
      {articles.map(article => (
        <TouchableOpacity
          key={article.id}
          onPress={() => onSelect(article.id ?? 0)}
        >
          <Text>{article.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const DetailView = ({ id }: { id: number }) => {
  const article = useSuspense(ArticleResource.get, { id });
  const [toggle, setToggle] = useState(false);

  return (
    <View>
      <Text>{article.title}</Text>
      <Text>{article.content}</Text>
      <Button title="Toggle Re-render" onPress={() => setToggle(!toggle)} />
      {toggle && <Text>Toggle state: {toggle.toString()}</Text>}
    </View>
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
        <TouchableOpacity onPress={() => setView('list')}>
          <Text>Home</Text>
        </TouchableOpacity>
        <AsyncBoundary fallback={<Text>Loading...</Text>}>
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

// Test cases
describe('Integration Garbage Collection React Native', () => {
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

    await act(async () => {
      jest.advanceTimersByTime(1000);
      InteractionManager.setDeadline(0);
      await jest.runOnlyPendingTimersAsync();
    });

    // Initial render, should show list view
    expect(await screen.findByText('Article 1')).toBeTruthy();

    // Switch to detail view
    act(() => {
      fireEvent.press(screen.getByText('Article 1'));
    });

    // Detail view should render
    expect(await screen.findByText('Content 1')).toBeTruthy();

    // Jest time pass to trigger sweep but not expired
    act(() => {
      jest.advanceTimersByTime(GC_INTERVAL);
      InteractionManager.setDeadline(0);
    });

    // Switch back to list view
    act(() => {
      fireEvent.press(screen.getByText('Home'));
    });

    // List view should instantly render
    expect(await screen.findByText('Article 1')).toBeTruthy();

    // Switch back to detail view
    act(() => {
      fireEvent.press(screen.getByText('Article 1'));
    });

    // Jest time pass to expiry
    await act(async () => {
      jest.advanceTimersByTime(
        Math.max(
          ArticleResource.getList.dataExpiryLength ?? 60000 + GC_INTERVAL,
          GC_INTERVAL,
        ),
      );
      InteractionManager.setDeadline(0);
      await jest.runOnlyPendingTimersAsync();
    });

    expect(await screen.findByText('Content 1')).toBeTruthy();

    // Re-render detail view to make sure it still renders
    act(() => {
      fireEvent.press(screen.getByText('Toggle Re-render'));
    });
    expect(await screen.findByText('Toggle state: true')).toBeTruthy();
    expect(await screen.findByText('Content 1')).toBeTruthy();

    // Visit list view and see suspense fallback
    act(() => {
      fireEvent.press(screen.getByText('Home'));
    });

    expect(screen.getByText('Loading...')).toBeTruthy();
    await jest.runOnlyPendingTimersAsync();
    jest.useRealTimers();
  });
});
