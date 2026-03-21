import {
  moveItemIsReady,
  renderBenchApp,
  useBenchState,
} from '@shared/benchHarness';
import {
  DOUBLE_LIST_STYLE,
  IssueRow,
  PlainIssueList,
} from '@shared/components';
import {
  FIXTURE_USERS,
  FIXTURE_USERS_BY_LOGIN,
  FIXTURE_ISSUES_BY_NUMBER,
  sortByTitle,
} from '@shared/data';
import { setCurrentIssues } from '@shared/refStability';
import { UserResource, IssueResource } from '@shared/resources';
import type { Issue } from '@shared/types';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';

function queryFn({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> {
  const [type, id] = queryKey as [string, string | number | undefined];
  if (type === 'issue' && id != null)
    return IssueResource.get({ number: Number(id) });
  if (type === 'user' && id) return UserResource.get({ login: String(id) });
  if (type === 'issues' && id && typeof id === 'object')
    return IssueResource.getList(id as { state?: string; count?: number });
  if (type === 'issues' && typeof id === 'number')
    return IssueResource.getList({ count: id });
  if (type === 'issues') return IssueResource.getList();
  return Promise.reject(new Error(`Unknown queryKey: ${queryKey}`));
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  },
});

function SortedListView({ limit }: { limit?: number }) {
  const { data: issues } = useQuery({
    queryKey: ['issues', 'all'],
    queryFn,
  });
  const sorted = useMemo(
    () => (issues ? sortByTitle(issues as Issue[]) : []),
    [issues],
  );
  if (!sorted.length) return null;
  return (
    <div data-sorted-list>
      <PlainIssueList issues={sorted} limit={limit} />
    </div>
  );
}

function DetailView({ number }: { number: number }) {
  const { data: issue } = useQuery({
    queryKey: ['issue', number],
    queryFn,
  });
  if (!issue) return null;
  return (
    <div data-detail-view data-issue-number={number}>
      <IssueRow issue={issue as Issue} />
    </div>
  );
}

function ListView({ count, limit }: { count: number; limit?: number }) {
  const { data: issues } = useQuery({
    queryKey: ['issues', count],
    queryFn,
  });
  if (!issues) return null;
  const list = issues as Issue[];
  setCurrentIssues(list);
  return <PlainIssueList issues={list} limit={limit} />;
}

function StateListView({
  state,
  count,
  limit,
}: {
  state: string;
  count: number;
  limit?: number;
}) {
  const { data: issues } = useQuery({
    queryKey: ['issues', { state, count }],
    queryFn,
  });
  if (!issues) return null;
  const list = issues as Issue[];
  return (
    <div data-state-list={state}>
      <span data-state-count>{list.length}</span>
      <PlainIssueList issues={list} limit={limit} />
    </div>
  );
}

function DoubleListView({ count, limit }: { count: number; limit?: number }) {
  return (
    <div style={DOUBLE_LIST_STYLE}>
      <StateListView state="open" count={count} limit={limit} />
      <StateListView state="closed" count={count} limit={limit} />
    </div>
  );
}

function BenchmarkHarness() {
  const client = useQueryClient();
  const {
    listViewCount,
    showSortedView,
    showDoubleList,
    doubleListCount,
    detailIssueNumber,
    renderLimit,
    containerRef,
    measureUpdate,
    registerAPI,
  } = useBenchState();

  const updateEntity = useCallback(
    (number: number) => {
      const issue = FIXTURE_ISSUES_BY_NUMBER.get(number);
      if (!issue) return;
      measureUpdate(() =>
        IssueResource.update(
          { number },
          { title: `${issue.title} (updated)` },
        ).then(() =>
          client.invalidateQueries({
            queryKey: ['issues'],
          }),
        ),
      );
    },
    [measureUpdate, client],
  );

  const updateUser = useCallback(
    (login: string) => {
      const user = FIXTURE_USERS_BY_LOGIN.get(login);
      if (!user) return;
      measureUpdate(() =>
        UserResource.update({ login }, { name: `${user.name} (updated)` }).then(
          () =>
            client.invalidateQueries({
              queryKey: ['issues'],
            }),
        ),
      );
    },
    [measureUpdate, client],
  );

  const unshiftItem = useCallback(() => {
    const user = FIXTURE_USERS[0];
    measureUpdate(() =>
      IssueResource.create({ title: 'New Issue', user }).then(() =>
        client.invalidateQueries({ queryKey: ['issues'] }),
      ),
    );
  }, [measureUpdate, client]);

  const deleteEntity = useCallback(
    (number: number) => {
      measureUpdate(() =>
        IssueResource.delete({ number }).then(() =>
          client.invalidateQueries({
            queryKey: ['issues'],
          }),
        ),
      );
    },
    [measureUpdate, client],
  );

  const moveItem = useCallback(
    (number: number) => {
      measureUpdate(
        () =>
          IssueResource.update({ number }, { state: 'closed' }).then(() =>
            client.invalidateQueries({ queryKey: ['issues'] }),
          ),
        () => moveItemIsReady(containerRef, number),
      );
    },
    [measureUpdate, client, containerRef],
  );

  registerAPI({
    updateEntity,
    updateUser,
    unshiftItem,
    deleteEntity,
    moveItem,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && (
        <ListView count={listViewCount} limit={renderLimit} />
      )}
      {showSortedView && <SortedListView limit={renderLimit} />}
      {showDoubleList && doubleListCount != null && (
        <DoubleListView count={doubleListCount} limit={renderLimit} />
      )}
      {detailIssueNumber != null && <DetailView number={detailIssueNumber} />}
    </div>
  );
}

function BenchProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

renderBenchApp(BenchmarkHarness, BenchProvider);
